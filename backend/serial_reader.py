"""
GrydAI Serial Telemetry Bridge & Ingestion Engine
Handles bidirectional serial communication with the ESP32 hardware over USB (115200 baud)
or falls back to high-fidelity mock simulation.
Ingests Contract 1 JSON, processes via ML pipeline, and writes Contract 3 reverse commands.
"""

import sys
import json
import time
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

    def start(self):
        """Starts the background telemetry ingestion thread."""
        self.is_running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        mode_str = "MOCK SIMULATION" if self.is_mock else f"HARDWARE SERIAL ({self.port or 'AUTO'})"
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
            logger.warning("No COM ports found. Falling back to MOCK mode automatically.")
            self.is_mock = True
            return False

        try:
            self.serial_conn = serial.Serial(target_port, self.baudrate, timeout=1.0)
            self.port = target_port
            logger.info(f"Successfully opened serial port {target_port} at {self.baudrate} baud.")
            return True
        except Exception as e:
            logger.warning(f"Could not open serial port {target_port}: {e}. Switching to MOCK mode.")
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

        # Calibration Standards:
        # V_sim: 180.0V + (v_raw / 4095.0) * 80.0V (midpoint ~220.0V)
        # I_sim: (i_raw / 4095.0) * 30.0A (midpoint ~15.0A)
        # Solar: (solar_ldr / 4095.0) * 100.0%
        v_sim = round(180.0 + (v_raw / 4095.0) * 80.0, 1)
        i_sim = round((i_raw / 4095.0) * 30.0, 2)
        solar_eff = round(min(100.0, max(0.0, (solar_ldr / 4095.0) * 100.0)), 1)

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

        # Construct Contract 2 Payload
        payload = {
            "timestamp": raw_data.get("timestamp", int(time.time())),
            "metrics": {
                "voltage_sim": v_sim,
                "current_sim": i_sim,
                "solar_efficiency": solar_eff
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
        if not self.is_mock:
            self._connect_serial()

        while self.is_running:
            loop_start = time.time()

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
                    logger.debug(f"Serial read error: {e}")

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
