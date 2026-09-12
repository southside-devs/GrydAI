"""
GrydAI Serial Telemetry Bridge & Ingestion Engine
Handles bidirectional serial communication with the ESP32 hardware over USB (115200 baud)
or falls back to high-fidelity mock simulation.
Ingests Contract 1 JSON, processes via ML pipeline, and writes Contract 3 reverse commands.
"""

import sys
import json
import time
import math
import random
import logging
import threading
from pathlib import Path
from typing import Optional, Dict, Any, Callable
import serial
import serial.tools.list_ports

# Ensure project root is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from backend.ml_pipeline import GridAnomalyDetector
    from backend.mock_generator import MockTelemetryGenerator
except ImportError:
    from ml_pipeline import GridAnomalyDetector
    from mock_generator import MockTelemetryGenerator

logger = logging.getLogger("GrydAI.Serial")

class SerialTelemetryBridge:
    def __init__(
        self,
        port: Optional[str] = None,
        baudrate: int = 115200,
        is_mock: bool = False,
        on_payload_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        self.port = port
        self.baudrate = baudrate
        self.user_requested_mock = is_mock
        self.is_mock = is_mock
        self.on_payload_callback = on_payload_callback

        self.serial_conn: Optional[serial.Serial] = None
        self.is_running = False
        self.thread: Optional[threading.Thread] = None

        # ML Detector & Mock Generator
        self.detector = GridAnomalyDetector()
        self.mock_gen = MockTelemetryGenerator()

        # Telemetry Cache
        self.latest_payload: Optional[Dict[str, Any]] = None
        self.last_grid_status: int = 0
        self.last_reverse_cmd_time: float = 0.0

        # Rolling Buffer for calibration (keeps last 300 samples / 30 seconds)
        self.history_buffer = []

        # Potentiometer Noise-Gate Deadband & Fast-Tracking Responsive Filter
        # Eliminates idle ADC thermal/electrical jitter when the knob is sitting still.
        # Tracks deliberate hand turns instantly with zero lag and high reactivity.
        self.smooth_v: Optional[float] = None
        self.smooth_i: Optional[float] = None
        self.noise_thresh_v = 0.25   # Minimum voltage delta to update (ignores <0.25V resting noise)
        self.noise_thresh_i = 0.08   # Minimum current delta to update (ignores <0.08A resting noise)
        self.tracking_alpha = 0.85   # Ultra-responsive tracking speed (0.85 = instant follow)

    def start(self):
        """Starts the background telemetry ingestion thread."""
        self.is_running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        mode_str = "MOCK SIMULATION" if self.user_requested_mock else f"HARDWARE SERIAL ({self.port or 'AUTO'})"
        logger.info(f"Telemetry Bridge started in {mode_str} mode at 10 Hz.")

    def stop(self):
        """Stops the ingestion thread and closes the serial port."""
        self.is_running = False
        if self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.close()
            except Exception:
                pass

    def _auto_detect_port(self) -> Optional[str]:
        """Auto-detects USB serial ports corresponding to ESP32 / USB-UART chips."""
        ports = serial.tools.list_ports.comports()
        for p in ports:
            desc = p.description.lower()
            # Common ESP32 USB-to-UART identifiers
            if any(k in desc for k in ["cp210", "ch340", "ftdi", "usb serial", "uart"]):
                logger.info(f"Auto-detected ESP32 on port: {p.device} ({p.description})")
                return p.device
        if ports:
            # Fallback to first available COM port
            logger.info(f"Defaulting to available port: {ports[0].device} ({ports[0].description})")
            return ports[0].device
        return None

    def _connect_serial(self) -> bool:
        """Attempts to open the serial port."""
        target_port = self.port or self._auto_detect_port()
        if not target_port:
            if self.user_requested_mock:
                self.is_mock = True
            return False

        try:
            self.serial_conn = serial.Serial(target_port, self.baudrate, timeout=1.0)
            self.port = target_port
            self.is_mock = False
            logger.info(f"Successfully opened serial port {target_port} at {self.baudrate} baud.")
            return True
        except Exception as e:
            logger.warning(f"Could not open serial port {target_port}: {e}.")
            if self.user_requested_mock:
                self.is_mock = True
            return False

    def send_reverse_command(self, grid_status: int, anomaly_score: float):
        """
        Transmits Contract 3 reverse command to ESP32 over serial:
        Format: S:<grid_status>:<anomaly_score>\n
        """
        cmd_str = f"S:{grid_status}:{anomaly_score:.2f}\n"
        if self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(cmd_str.encode("ascii"))
                self.serial_conn.flush()
            except Exception as e:
                logger.error(f"Error writing Contract 3 command to serial: {e}")
        else:
            # Log in mock mode for verification
            pass

    def _convert_and_process(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converts Contract 1 (raw ADC) to engineering units and runs ML inference,
        producing the final Contract 2 JSON payload.
        """
        v_raw = raw_data.get("v_raw", 2048)
        i_raw = raw_data.get("i_raw", 2048)
        fault_btn = raw_data.get("fault_btn", 0)
        solar_ldr = raw_data.get("solar_ldr", 4095)

        # Raw instantaneous values from 12-bit ADC (0 - 4095)
        raw_v = 180.0 + (v_raw / 4095.0) * 80.0
        raw_i = (i_raw / 4095.0) * 30.0
        solar_eff = round(min(100.0, max(0.0, (solar_ldr / 4095.0) * 100.0)), 1)

        # Initialize smooth filter on first startup sample
        if self.smooth_v is None:
            self.smooth_v = round(raw_v, 1)
            self.smooth_i = round(raw_i, 2)

        # Emergency catastrophic button press immediately snaps to raw
        if fault_btn == 1:
            self.smooth_v = round(raw_v, 1)
            self.smooth_i = round(raw_i, 2)
        else:
            # 1. Voltage noise-gate deadband + responsive tracking
            diff_v = raw_v - self.smooth_v
            if abs(diff_v) >= self.noise_thresh_v:
                self.smooth_v = round(self.smooth_v + diff_v * self.tracking_alpha, 1)
            # Else: knob is resting -> freeze solid, zero drift!

            # 2. Current noise-gate deadband + responsive tracking
            diff_i = raw_i - self.smooth_i
            if abs(diff_i) >= self.noise_thresh_i:
                self.smooth_i = round(self.smooth_i + diff_i * self.tracking_alpha, 2)
            # Else: knob is resting -> freeze solid, zero drift!

        v_sim = self.smooth_v
        i_sim = self.smooth_i

        # Store in rolling buffer for calibration
        self.history_buffer.append({
            "voltage_sim": v_sim,
            "current_sim": i_sim,
            "solar_efficiency": solar_eff
        })
        if len(self.history_buffer) > 300:
            self.history_buffer.pop(0)

        # Run Scikit-Learn Autoencoder & State Machine
        prediction = self.detector.process_sample(v_sim, i_sim, solar_eff, fault_btn)
        status = prediction.get("grid_status", 0)
        z = prediction.get("z_score", 0.0)

        # Derived Microgrid Electrical Metrics (matching frontend dashboard expectations)
        # 1. Real Active Power (kW) with ~0.95 power factor
        current_kw = round((v_sim * i_sim * 0.95) / 1000.0, 2)

        # 2. Feeder Capacity Demand (% relative to 8.0 kW neighborhood pad limit)
        energy_percent = int(min(100, max(0, round((current_kw / 8.0) * 100))))

        # 3. Grid Frequency (50.0 Hz nominal with subtle load droop & natural oscillation)
        load_droop = max(0.0, (i_sim - 18.0) * 0.04) if i_sim > 18.0 else 0.0
        now_t = time.time()
        freq_osc = 0.02 * math.sin(now_t * 2.8) + random.uniform(-0.008, 0.008)
        freq_sim = round(max(48.2, min(51.4, 50.0 - load_droop + freq_osc)), 2)

        # 4. Grid Stability Index (0 - 100%, driven directly by ML reconstruction Z-score)
        if fault_btn == 1:
            stability = 12.5
        elif status == 2:
            stability = max(15.0, min(38.0, 36.0 - max(0.0, z - 3.5) * 5.0))
        elif status == 1:
            stability = max(48.0, min(76.0, 75.0 - max(0.0, z - 2.0) * 12.0))
        else:
            stability = max(89.0, min(99.6, 98.4 - max(0.0, z) * 3.5 + 0.4 * math.sin(now_t * 1.5)))
        stability = round(stability, 1)

        # 5. Dynamic 13-bar Waveform Equalizer (reacts to power magnitude & anomaly harmonic distortion)
        base_power_ratio = min(1.0, max(0.2, current_kw / 6.0))
        waveform = []
        for idx in range(13):
            center_dist = abs(idx - 6)
            spectral_weight = max(0.28, 1.0 - (center_dist * 0.12))
            harmonic_osc = math.sin(now_t * 4.5 + idx * 0.7) * 7.0
            if status == 2:
                bar_val = int(min(100, max(30, 78 + harmonic_osc + random.randint(-12, 18))))
            elif status == 1:
                bar_val = int(min(90, max(25, 52 * spectral_weight + harmonic_osc + random.randint(-6, 8))))
            else:
                bar_val = int(min(85, max(15, (base_power_ratio * 65.0 * spectral_weight) + harmonic_osc)))
            waveform.append(bar_val)

        # Construct Contract 2 Payload
        payload = {
            "timestamp": raw_data.get("timestamp", int(time.time())),
            "metrics": {
                "voltage_sim": v_sim,
                "current_sim": i_sim,
                "solar_efficiency": solar_eff,
                "frequency_sim": freq_sim,
                "frequency": freq_sim,
                "current_kw": current_kw,
                "energy_percent": energy_percent,
                "stability": stability,
                "waveform": waveform
            },
            "ai_prediction": prediction
        }

        # Check Reverse Command Triggers:
        # 1. Immediate trigger on status change
        # 2. Heartbeat every 500ms (2 Hz)
        now = time.time()
        current_status = prediction["grid_status"]
        if current_status != self.last_grid_status or (now - self.last_reverse_cmd_time) >= 0.5:
            self.send_reverse_command(current_status, prediction["anomaly_score"])
            self.last_grid_status = current_status
            self.last_reverse_cmd_time = now

        return payload

    def _run_loop(self):
        """Main 10 Hz ingestion loop."""
        if not self.user_requested_mock:
            self._connect_serial()

        last_retry_time = 0.0
        while self.is_running:
            loop_start = time.time()

            # If user wanted hardware mode but port is not open, retry every 2.0s
            if not self.user_requested_mock and (not self.serial_conn or not self.serial_conn.is_open):
                now = time.time()
                if now - last_retry_time > 2.0:
                    last_retry_time = now
                    self._connect_serial()

            raw_packet = None
            if self.is_mock or not self.serial_conn or not self.serial_conn.is_open:
                # Mock Mode Telemetry
                raw_packet = self.mock_gen.get_raw_telemetry()
            else:
                # Physical Hardware Mode Telemetry
                try:
                    line = self.serial_conn.readline().decode("utf-8", errors="ignore").strip()
                    if line.startswith("{") and line.endswith("}"):
                        raw_packet = json.loads(line)
                except Exception as e:
                    logger.warning(f"Serial connection interrupted: {e}. Auto-reconnecting...")
                    try:
                        self.serial_conn.close()
                    except Exception:
                        pass
                    self.serial_conn = None
                    time.sleep(1.0)
                    self._connect_serial()

            if raw_packet:
                try:
                    payload = self._convert_and_process(raw_packet)
                    self.latest_payload = payload
                    if self.on_payload_callback:
                        self.on_payload_callback(payload)
                except Exception as e:
                    logger.error(f"Error processing telemetry sample: {e}")

            # Pace loop to 10 Hz (100 ms interval)
            elapsed = time.time() - loop_start
            sleep_time = max(0.005, 0.100 - elapsed)
            time.sleep(sleep_time)
