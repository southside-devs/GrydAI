"""
GrydAI Synthetic Telemetry Generator (Mock Mode)
Generates realistic 10 Hz power grid telemetry for development and testing.
Simulates nominal baseline waveforms with subtle micro-fluctuations and supports
on-demand fault injections (EV charging surge, voltage sags, catastrophic line breaks).
"""

import math
import random
import time
from typing import Dict, Any, Optional

class MockTelemetryGenerator:
    def __init__(self):
        self.step = 0
        self.active_fault: Optional[str] = None
        self.fault_expiry: float = 0.0

        # Nominal Electrical Baselines
        self.nominal_voltage = 220.0  # Volts
        self.nominal_current = 15.0   # Amperes
        self.nominal_solar = 98.5     # %

    def inject_fault(self, fault_type: str, duration_sec: float = 5.0):
        """
        Inject a simulated fault for a specified duration.
        Supported types: 'ev_surge', 'voltage_sag', 'line_break', 'solar_drop'
        """
        self.active_fault = fault_type.lower()
        self.fault_expiry = time.time() + duration_sec

    def _check_fault_expiry(self):
        if self.active_fault and time.time() > self.fault_expiry:
            self.active_fault = None

    def get_raw_telemetry(self) -> Dict[str, Any]:
        """
        Generates Contract 1 JSON-compatible dictionary as if transmitted by ESP32:
        {
            "timestamp": 1694451234,
            "v_raw": 3102,
            "i_raw": 1840,
            "fault_btn": 0,
            "solar_ldr": 4095
        }
        """
        self._check_fault_expiry()
        self.step += 1
        t = self.step * 0.1  # 10 Hz time step

        # Normal Waveform with subtle micro-fluctuations (harmonic oscillation + noise)
        v_sim = self.nominal_voltage + 1.2 * math.sin(t * 0.8) + 0.6 * math.sin(t * 2.3) + random.uniform(-0.3, 0.3)
        i_sim = self.nominal_current + 0.4 * math.sin(t * 0.5) + random.uniform(-0.15, 0.15)
        solar_sim = min(100.0, max(0.0, self.nominal_solar + random.uniform(-0.5, 0.5)))
        fault_btn = 0

        # Apply Injected Fault Behavior
        if self.active_fault == "ev_surge":
            # Rapid current surge simulating multiple EVs fast-charging (overload)
            i_sim += random.uniform(9.0, 12.5)
            v_sim -= random.uniform(6.0, 9.0)  # Voltage sag under heavy load
        elif self.active_fault == "voltage_sag":
            # Severe voltage sag / dying transformer winding
            v_sim -= random.uniform(25.0, 32.0)
            i_sim += random.uniform(3.0, 5.0)
        elif self.active_fault == "solar_drop":
            # Cloud cover / solar generation collapse
            solar_sim = max(5.0, solar_sim - 75.0 + random.uniform(-2.0, 2.0))
            v_sim -= random.uniform(2.0, 4.0)
        elif self.active_fault == "line_break":
            # Catastrophic hardware line break
            fault_btn = 1
            i_sim = random.uniform(0.0, 0.8)
            v_sim = random.uniform(140.0, 170.0)

        # Map to 12-bit ADC (0 - 4095) according to calibration standards:
        # V_sim = 180.0 + (v_raw / 4095.0) * 80.0
        # I_sim = (i_raw / 4095.0) * 30.0
        # Solar = (solar_ldr / 4095.0) * 100.0
        v_raw = int(max(0, min(4095, ((v_sim - 180.0) / 80.0) * 4095.0)))
        i_raw = int(max(0, min(4095, (i_sim / 30.0) * 4095.0)))
        solar_ldr = int(max(0, min(4095, (solar_sim / 100.0) * 4095.0)))

        return {
            "timestamp": int(time.time()),
            "v_raw": v_raw,
            "i_raw": i_raw,
            "fault_btn": fault_btn,
            "solar_ldr": solar_ldr
        }
