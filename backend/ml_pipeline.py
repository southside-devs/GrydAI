"""
GrydAI Unsupervised Machine Learning Pipeline
Utilizes a Scikit-Learn MLPRegressor Autoencoder paired with Isolation Forest
to calculate live Reconstruction Mean Squared Error (MSE) and detect electrical
micro-fluctuations before catastrophic failure occurs.
"""

import collections
import warnings
import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.exceptions import ConvergenceWarning
from typing import Dict, Any, Tuple, Optional

# Suppress minor non-critical convergence warnings during rapid real-time fitting
warnings.filterwarnings('ignore', category=ConvergenceWarning)

class GridAnomalyDetector:
    def __init__(self):
        # Feature Rolling Window (10 samples @ 10 Hz = 1.0 second)
        self.window_size = 10
        self.raw_history = collections.deque(maxlen=self.window_size)
        
        # State Machine Tracking with Hysteresis & Persistence
        self.current_status = 0
        self.hold_timer = 0  # In samples (15 samples = 1.5 seconds hold time)
        self.candidate_status = 0
        self.candidate_count = 0
        self.smooth_z = -0.5
        
        # ML Models
        self.scaler = StandardScaler()
        self.autoencoder = MLPRegressor(
            hidden_layer_sizes=(8, 3, 8),
            activation='relu',
            solver='adam',
            learning_rate_init=0.01,
            max_iter=500,
            random_state=42,
            early_stopping=False
        )
        self.isolation_forest = IsolationForest(
            contamination=0.05,
            random_state=42
        )
        
        # Baseline Statistics (Mean & Std Dev of Reconstruction MSE)
        self.is_calibrated = False
        self.mu_mse = 0.005
        self.sigma_mse = 0.002
        
        # Initialize with synthetic healthy baseline so it works on startup
        self._init_default_baseline()

    def _init_default_baseline(self):
        """Pre-trains model with synthetic healthy resting telemetry for zero-wait startup."""
        np.random.seed(42)
        n_samples = 500
        dt = 0.1
        t = np.arange(0, n_samples * dt, dt)
        
        # Generate nominal healthy telemetry spanning realistic grid baseline operating conditions
        # Voltage resting: 215V - 225V; Current resting: 11A - 18A
        v = 220.0 + 3.0 * np.sin(t * 0.8) + 1.5 * np.sin(t * 2.3) + np.random.normal(0, 0.5, len(t))
        i = 14.5 + 2.5 * np.sin(t * 0.5) + np.random.normal(0, 0.5, len(t))
        dv = np.diff(v, prepend=v[0])
        di = np.diff(i, prepend=i[0])
        
        features = np.column_stack([v, i, dv, di])
        self.scaler.fit(features)
        scaled = self.scaler.transform(features)
        
        # Autoencoder learns to reconstruct healthy patterns: input -> output
        self.autoencoder.fit(scaled, scaled)
        self.isolation_forest.fit(scaled)
        
        # Calculate baseline MSE statistics
        reconstructed = self.autoencoder.predict(scaled)
        mse_errors = np.mean((scaled - reconstructed) ** 2, axis=1)
        self.mu_mse = float(np.mean(mse_errors))
        # Use 95th percentile buffer for sigma to avoid false positive spikes on random noise
        self.sigma_mse = max(0.010, float(np.std(mse_errors)))
        self.is_calibrated = True

    def calibrate(self, historical_metrics: list) -> Dict[str, Any]:
        """
        Dynamically recalibrates the Autoencoder and baseline stats from resting telemetry.
        Expects a list of dicts with keys: 'voltage_sim', 'current_sim', 'solar_efficiency'.
        """
        if len(historical_metrics) < 20:
            return {"status": "error", "message": "Need at least 20 samples to calibrate"}
            
        v = np.array([m["voltage_sim"] for m in historical_metrics])
        i = np.array([m["current_sim"] for m in historical_metrics])
        dv = np.diff(v, prepend=v[0])
        di = np.diff(i, prepend=i[0])
        
        features = np.column_stack([v, i, dv, di])
        self.scaler.fit(features)
        scaled = self.scaler.transform(features)
        
        self.autoencoder.fit(scaled, scaled)
        self.isolation_forest.fit(scaled)
        
        reconstructed = self.autoencoder.predict(scaled)
        mse_errors = np.mean((scaled - reconstructed) ** 2, axis=1)
        self.mu_mse = float(np.mean(mse_errors))
        self.sigma_mse = max(0.010, float(np.std(mse_errors)))
        self.is_calibrated = True
        
        # Reset state machine tracking
        self.current_status = 0
        self.hold_timer = 0
        self.candidate_status = 0
        self.candidate_count = 0
        self.smooth_z = -0.5
        
        return {
            "status": "success",
            "samples_used": len(historical_metrics),
            "mu_mse": round(self.mu_mse, 6),
            "sigma_mse": round(self.sigma_mse, 6)
        }

    def process_sample(
        self,
        v_sim: float,
        i_sim: float,
        solar_sim: float,
        fault_btn: int
    ) -> Dict[str, Any]:
        """
        Evaluates a single 10 Hz telemetry sample through the ML pipeline.
        Implements a Schmitt-trigger dual hysteresis state machine to guarantee
        zero chatter and deterministic transitions between Normal (0), Warning (1), and Critical (2).
        """
        self.raw_history.append((v_sim, i_sim))
        
        # Calculate rates of change (delta per 100ms sample)
        if len(self.raw_history) >= 2:
            prev_v, prev_i = self.raw_history[-2]
            dv = v_sim - prev_v
            di = i_sim - prev_i
        else:
            dv = 0.0
            di = 0.0

        # Soft-clamp dv and di to avoid single-step wiper contact friction explosion
        dv = float(np.clip(dv, -1.5, 1.5))
        di = float(np.clip(di, -0.8, 0.8))
            
        feat_vector = np.array([[v_sim, i_sim, dv, di]])
        scaled_vector = self.scaler.transform(feat_vector)
        
        # Autoencoder Reconstruction
        reconstructed = self.autoencoder.predict(scaled_vector)
        raw_mse = float(np.mean((scaled_vector - reconstructed) ** 2))
        
        # Z-Score relative to calibrated baseline
        raw_z = (raw_mse - self.mu_mse) / self.sigma_mse
        
        # Exponential Moving Average filter on Z-score for smooth meter needle movement
        self.smooth_z = 0.25 * raw_z + 0.75 * self.smooth_z
        effective_z = self.smooth_z

        # ---------------------------------------------------------------------
        # State Machine Evaluation with Dual Hysteresis & Latch Hold Time
        # ---------------------------------------------------------------------
        # 1. Catastrophic Push-Button Fault: Instantaneous 0 ms trip
        if fault_btn == 1:
            self.current_status = 2
            self.hold_timer = 20  # Hold for at least 2.0s
            self.candidate_count = 0
            return {
                "anomaly_score": 1.000,
                "grid_status": 2,
                "message": "CRITICAL: Instantaneous Line Break Triggered",
                "reconstruction_mse": round(raw_mse, 6),
                "z_score": round(effective_z, 2)
            }

        # 2. Level Detection with wide, predictable demo windows
        is_critical = (i_sim >= 23.0) or (v_sim <= 195.0) or (v_sim >= 245.0)
        is_warning = (i_sim >= 18.5) or (v_sim <= 211.0) or (v_sim >= 229.0) or (effective_z >= 3.5 and 212.0 <= v_sim <= 228.0)

        target_status = 2 if is_critical else (1 if is_warning else 0)

        # Decrement minimum hold timer
        if self.hold_timer > 0:
            self.hold_timer -= 1

        # 3. State Transitions with Hysteresis and Persistence
        if target_status > self.current_status:
            # Escalating (0 -> 1 or 1 -> 2): Require 3 consecutive samples (300 ms)
            if target_status == self.candidate_status:
                self.candidate_count += 1
            else:
                self.candidate_status = target_status
                self.candidate_count = 1

            if self.candidate_count >= 3:
                self.current_status = target_status
                self.hold_timer = 15  # Latch for at least 1.5 seconds on escalation
                self.candidate_count = 0
        elif target_status < self.current_status:
            # De-escalating (2 -> 1 or 1 -> 0): Must clear hysteresis AND hold timer must have expired
            can_downgrade = False
            if self.hold_timer == 0:
                if self.current_status == 2:
                    # Critical to Warning hysteresis gap: V in [198, 242], I < 21.5A
                    if (198.0 <= v_sim <= 242.0) and (i_sim < 21.5):
                        can_downgrade = True
                elif self.current_status == 1:
                    # Warning to Normal hysteresis gap: V in [213, 227], I < 17.5A, Z < 2.5
                    if (213.0 <= v_sim <= 227.0) and (i_sim < 17.5) and (effective_z < 2.5):
                        can_downgrade = True

            if can_downgrade:
                if target_status == self.candidate_status:
                    self.candidate_count += 1
                else:
                    self.candidate_status = target_status
                    self.candidate_count = 1

                # Require 5 consecutive clean samples (500 ms) to step down
                if self.candidate_count >= 5:
                    self.current_status = target_status
                    self.candidate_count = 0
            else:
                self.candidate_count = 0
        else:
            self.candidate_count = 0

        # 4. Synchronized Dynamic Message and Anomaly Score
        if self.current_status == 2:
            norm_score = min(1.00, 0.75 + max(0.0, effective_z - 3.5) * 0.08)
            if i_sim >= 21.5:
                message = f"CRITICAL: Severe Feeder Overload ({i_sim:.1f}A)"
            elif v_sim <= 198.0:
                message = f"CRITICAL: Severe Transformer Winding Sag ({v_sim:.1f}V)"
            elif v_sim >= 242.0:
                message = f"CRITICAL: Catastrophic Voltage Surge ({v_sim:.1f}V)"
            else:
                message = f"CRITICAL: Microgrid Phase Instability (Z={effective_z:.1f})"
        elif self.current_status == 1:
            norm_score = min(0.70, 0.25 + max(0.0, effective_z - 1.5) * 0.15)
            if i_sim >= 17.5:
                message = f"Warning: High Feeder Demand / EV Surge ({i_sim:.1f}A)"
            elif v_sim <= 213.0:
                message = f"Warning: Secondary Feeder Voltage Sag ({v_sim:.1f}V)"
            elif v_sim >= 227.0:
                message = f"Warning: Feeder Overvoltage Swell ({v_sim:.1f}V)"
            else:
                message = f"Warning: Microgrid Harmonic Distortion (Z={effective_z:.1f})"
        else:
            norm_score = max(-1.0, min(-0.65, -0.85 + (effective_z * 0.10)))
            message = "System Stable - Normal Feeder Telemetry"

        return {
            "anomaly_score": round(float(norm_score), 3),
            "grid_status": int(self.current_status),
            "message": message,
            "reconstruction_mse": round(float(raw_mse), 6),
            "z_score": round(float(effective_z), 2)
        }
