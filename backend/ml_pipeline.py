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
        self.status_history = collections.deque(maxlen=3)
        
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
        Returns the Contract 2 'ai_prediction' object:
        {
            "anomaly_score": float,
            "grid_status": int (0, 1, or 2),
            "message": str,
            "reconstruction_mse": float
        }
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
            
        feat_vector = np.array([[v_sim, i_sim, dv, di]])
        scaled_vector = self.scaler.transform(feat_vector)
        
        # Autoencoder Reconstruction
        reconstructed = self.autoencoder.predict(scaled_vector)
        raw_mse = float(np.mean((scaled_vector - reconstructed) ** 2))
        
        # Z-Score relative to calibrated baseline
        z_score = (raw_mse - self.mu_mse) / self.sigma_mse
        
        # Calculate smooth anomaly score bounded between -1.00 (stable) and +1.00 (critical)
        if z_score <= 1.0:
            norm_score = -0.85 + (z_score * 0.15) # Stays around -0.85 to -0.70 during normal baseline
        else:
            norm_score = min(1.0, -0.70 + (z_score - 1.0) * 0.35)
            
        # State Machine Evaluation
        # Physical emergency overrides:
        if fault_btn == 1:
            raw_status = 2
            message = "CRITICAL: Instantaneous Line Break Triggered"
            norm_score = 1.00
        elif z_score > 3.5 or i_sim > 23.0 or v_sim < 198.0 or v_sim > 242.0:
            raw_status = 2
            norm_score = max(0.75, norm_score)
            if i_sim > 23.0:
                message = "CRITICAL: Severe Feeder Overload / EV Surge"
            elif v_sim < 198.0:
                message = "CRITICAL: Severe Transformer Winding Sag"
            else:
                message = "CRITICAL: High Voltage Surge & Distortion"
        elif z_score > 2.0 or i_sim > 18.5 or v_sim < 210.0 or v_sim > 230.0:
            raw_status = 1
            norm_score = max(0.20, norm_score)
            if i_sim > 18.5:
                message = "Warning: Abnormal Current Surge Detected"
            elif v_sim < 210.0 or v_sim > 230.0:
                message = "Warning: Voltage Sag & Waveform Distortion"
            else:
                message = "Warning: Micro-Fluctuation Detected"
        else:
            raw_status = 0
            message = "System Stable - Normal Feeder Telemetry"
            norm_score = max(-1.0, min(-0.65, norm_score))

        # Debounce filter: Emergency button trips immediately; otherwise require 2-sample
        # consensus to eliminate single-sample ADC noise jitter
        if fault_btn == 1:
            self.status_history.clear()
            self.status_history.append(2)
            grid_status = 2
        else:
            self.status_history.append(raw_status)
            grid_status = collections.Counter(self.status_history).most_common(1)[0][0]

        return {
            "anomaly_score": round(norm_score, 3),
            "grid_status": grid_status,
            "message": message,
            "reconstruction_mse": round(raw_mse, 6),
            "z_score": round(z_score, 2)
        }
