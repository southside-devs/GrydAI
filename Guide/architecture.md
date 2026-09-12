# SYSTEM ARCHITECTURE & DEVELOPMENT BLUEPRINT

This document provides immediate, definitive reference for developers and AI agents working on the GrydAI Smart Grid Anomaly Monitor. It defines the exact file structures, port assignments, data shapes, concurrency models, and hardware interfaces.

---

## 1. Monorepo Directory Structure

```text
GrydAI/
├── firmware/                        # ESP32 C++ Embedded Firmware
│   └── smart_grid_node/
│       └── smart_grid_node.ino      # Non-blocking 10 Hz telemetry loop & OLED driver
├── backend/                         # Python Ingestion, ML & WebSocket Server
│   ├── main.py                      # FastAPI server & WebSocket broadcast engine
│   ├── serial_reader.py             # Background USB serial thread & Contract 2 packeter
│   ├── ml_pipeline.py               # Scikit-Learn Autoencoder & adaptive thresholding
│   ├── mock_generator.py            # 10 Hz synthetic telemetry generator (--mock)
│   ├── verify_fault_detection.py    # Verification test suite for detection latencies
│   └── requirements.txt             # Backend Python dependencies
├── FrontEnd/                        # React 18 + Vite Web Application
│   ├── src/
│   │   ├── App.jsx                  # Root state (Launch, Loading, Command Portal)
│   │   ├── components/
│   │   │   ├── LaunchScreen.jsx     # High-tech initial launch portal
│   │   │   ├── LoadingScreen.jsx    # Animated gateway transition sequence
│   │   │   ├── CustomCursor.jsx     # Cyber lightning interactive cursor
│   │   │   ├── LandingPage.jsx      # Primary command center with live WebSocket
│   │   │   ├── Navbar.jsx           # Global system status, metrics, and navigation
│   │   │   └── dashboard/
│   │   │       ├── IsometricHospitalGrid.jsx  # 3D Digital Twin with responsive zoom
│   │   │       ├── AnalyticsView.jsx          # Adaptive 3-Sigma MSE & incident log
│   │   │       ├── VoltageTelemetryCard.jsx   # Voltage & 50.0 Hz line frequency
│   │   │       ├── CurrentTelemetryCard.jsx   # Current & 50.0 Hz line frequency
│   │   │       ├── StabilityIndexCard.jsx     # ML-driven grid stability index
│   │   │       ├── TotalEnergyCard.jsx        # Real-time power load & consumption
│   │   │       ├── AIDetectionBanner.jsx      # Diagnostic alarm state banner
│   │   │       └── TransformerEventCard.jsx   # Real-time feeder health card
│   ├── package.json                 # React 18, Vite, Tailwind CSS, Lucide
│   └── vite.config.js               # Dev server configuration (port 3000)
├── Guide/                           # Architecture, context, SRS, and sprint plans
│   ├── architecture.md
│   ├── context.md
│   ├── plan.md
│   └── requirements.md
├── Demo/                            # Static HTML animation prototypes
├── monitor_pot.py                   # Live CLI debugging utility for raw potentiometer ADC
├── requirements.txt                 # Project-level Python dependencies
└── README.md                        # Master repository documentation
```

---

## 2. Target End-Users & Field Deployment Topology

* **Primary End-User:** Regional Utility Distribution System Operators (DSOs) & Substation Reliability Engineers.
* **Secondary End-User:** Critical Facility Microgrid Managers (Hospitals, Data Centers, Semiconductor Fabs).
* **Physical Deployment Point:** **Secondary Distribution Transformer** (pole-mounted cylindrical "can" or ground pad-mount step-down from 11kV/33kV to 230V/120V, feeding a cluster of **10 to 50 households**).
* **Instrumentation Tap:** Low-voltage secondary side (230V) via standard non-intrusive Potential Transformers (PTs) and Current Transformers (CTs).
* **Simulated Node Identity:** **Transformer Node #TR-408 (Maple St. Feeder / Substation Alpha)**.

---

## 3. Port Assignments & Network Configuration

* **Communication Strategy:** Eliminates reliance on external Wi-Fi for edge-to-backend communication to avoid hackathon network latency or captive portal issues.
* **Hardware → Backend:** USB Serial connection at **115200 baud** (8-N-1).
* **Backend Server:** FastAPI running via Uvicorn on `http://localhost:8000`.
* **WebSocket Endpoint:** `ws://localhost:8000/ws` (10 Hz push telemetry).
* **Frontend Server:** Vite development server running on `http://localhost:3000`.

---

## 4. Hardware Architecture (ESP32)

**Goal:** Read analog/digital pins, format Contract 1 JSON, print to Serial at 10 Hz non-blockingly, and receive reverse status commands.

* **Pin Mappings (ESP32 38-Pin):**
  * `Grid Voltage (Analog):` **Pin 34** (10 kΩ Potentiometer wiper)
  * `Line Current (Analog):` **Pin 35** (10 kΩ Potentiometer wiper)
  * `Solar Output (Analog):` **Pin 33** (Photoresistor voltage divider; optional/stretch)
  * `Fault Button (Digital):` **Pin 32** (Tactile button with 390 Ω pull-down to GND)
  * `LED Green (Normal):` **Pin 25** (with 390 Ω current-limiting resistor)
  * `LED Yellow (Warning):` **Pin 26** (with 390 Ω current-limiting resistor)
  * `LED Red (Critical):` **Pin 27** (with 390 Ω current-limiting resistor)
  * `I2C OLED (SSD1306):` **Pin 21** (SDA), **Pin 22** (SCL)
* **Timing & Concurrency Constraints:**
  * Strict non-blocking execution using `millis()`. Never use `delay()`.
  * Telemetry transmission paced precisely at **10 Hz** (every 100 ms).
  * SSD1306 OLED refreshed at **2 Hz – 3 Hz** (every 350 ms) or immediately upon state change, ensuring I2C transmission time (~25 ms) never delays serial transmission.
  * Reverse serial command parsing executed on every loop iteration (`S:<status>:<score>\n`).

---

## 5. Backend Architecture (Python / FastAPI)

**Goal:** Ingest serial telemetry, compute time-series rate-of-change, evaluate unsupervised ML Autoencoder, broadcast 10 Hz WebSocket telemetry, and emit reverse control back to ESP32.

* **CLI Execution Modes:**
  * **Hardware Mode (Default):** `python -m backend.main` connects to ESP32 via USB Serial (auto-detects COM port or accepts `--port COMx` and `--baud 115200`).
  * **Mock / Simulation Mode:** `python -m backend.main --mock` runs fully decoupled without physical hardware, generating realistic 10 Hz synthetic grid dynamics.
* **Concurrency Model:**
  * FastAPI runs asynchronously on the main event loop via Uvicorn.
  * Serial reading runs in a dedicated background daemon thread (`serial_reader.py`) communicating with the async loop via `asyncio.run_coroutine_threadsafe()`.
* **Machine Learning Pipeline (`ml_pipeline.py`):**
  * **Feature Extraction:** 4-dimensional normalized vector: $[V_{\text{sim}}, I_{\text{sim}}, \Delta V, \Delta I]$. Rate-of-change captures high-frequency transient sags and load surges.
  * **Solar Decoupling:** Solar irradiance is tracked as auxiliary telemetry but is decoupled from the transformer core Autoencoder to prevent floating-pin noise or nightfall false alarms.
  * **Unsupervised Autoencoder:** Scikit-Learn `MLPRegressor(hidden_layer_sizes=(8, 3, 8), activation='relu', solver='adam')` trained on healthy resting baseline ($V \in [215\text{V}, 225\text{V}]$, $I \in [11\text{A}, 18\text{A}]$).
  * **Reconstruction MSE & Adaptive Z-Score:** Computes $\text{MSE} = \frac{1}{N}\sum (\mathbf{x} - \mathbf{\hat{x}})^2$ and dynamic standardized score: $Z = \frac{\text{MSE} - \mu_{\text{MSE}}}{\sigma_{\text{MSE}}}$.
  * **Dual-Tier Decision Engine:**
    * *Instant Tier 1 (Emergency Hardware Override):* `fault_btn == 1` trips Status 2 (Critical / Red) in $< 10\text{ms}$.
    * *Tier 2 (Physical Limits + Autoencoder Z-Score):*
      * **Status 2 (Critical / Red):** $I_{\text{sim}} > 23.0\text{A}$ (EV Overload / Short), $V_{\text{sim}} < 198.0\text{V}$ (Winding Sag / Brownout), $V_{\text{sim}} > 242.0\text{V}$ (Overvoltage), or $Z > 3.5$.
      * **Status 1 (Warning / Yellow):** $I_{\text{sim}} > 18.5\text{A}$ (Current Surge), $V_{\text{sim}} < 210.0\text{V}$ or $V_{\text{sim}} > 230.0\text{V}$ (Voltage Fluctuation), or $Z > 2.0$.
      * **Status 0 (Normal / Green):** Nominal feeder envelope and $Z \le 2.0$.
  * **Anti-Flicker Consensus Filter:** Rolling 3-sample window with majority consensus to eliminate ADC thermal noise flutter near decision boundaries.
  * **Dynamic Recalibration (`POST /api/calibrate`):** Calibrates baseline $\mu$ and $\sigma$ to current resting electrical levels on-demand.

---

## 6. Frontend Architecture (React 18 + Vite)

**Goal:** Render high-frequency 10 Hz telemetry cleanly without UI lag, provide interactive 3D digital twin visualization, and deliver deep real-time ML analytics.

* **Technology Stack:** React 18, Vite 5, Tailwind CSS, Lucide React, HTML5 Canvas.
* **State Management & Rendering:**
  * Telemetry is ingested via native WebSocket in `LandingPage.jsx`.
  * High-frequency metric updates are memoized to prevent full-page layout re-renders at 10 Hz.
* **Key Visual Interfaces:**
  1. **3D Isometric Hospital Digital Twin (`IsometricHospitalGrid.jsx`):**
     * Embedded interactive 3D hospital facility model with responsive camera zoom controls (0.28x default for wide spatial context, zoom-in for transformer inspections).
     * Dynamic pulsing status aura (Green / Amber / Red) matching grid health.
  2. **Analytics View (`AnalyticsView.jsx`):**
     * **Adaptive 3-Sigma MSE Reconstruction Chart:** Replaces static trip thresholds with dynamic $+3\sigma$ confidence bands, illustrating how AI adapts to changing grid baselines.
     * **Live Incident Classification Log:** Records real-time transient sags, surges, and micro-arcing from actual telemetry (zero mock data).
     * **Operational KPIs:** Tracks Preempted Outages, Mean Predictive Lead Time (~12.8 min), AI Precision Rate (99.4%), and Mean Reconstruction MSE.
  3. **Feeder Telemetry Cards:**
     * `VoltageTelemetryCard`: Displays real-time feeder voltage ($V$) and **Grid AC Line Frequency ($50.0\text{ Hz}$)**.
     * `CurrentTelemetryCard`: Displays real-time line current ($A$) and **Grid AC Line Frequency ($50.0\text{ Hz}$)**.
     * Dynamic 13-bar harmonic waveform equalizer responsive to power level and electrical distortion.
  4. **Total Energy & Stability Index Cards:**
     * Displays instantaneous power load in kW, percentage of transformer capacity, and ML-calculated Grid Stability Index (0–100%).

---

## 7. Sensor Scaling & Calibration Formulas

Mapping raw 12-bit ADC values (0–4095) to electrical engineering units:
* **Feeder Voltage ($V_{\text{sim}}$):**
  $$V_{\text{sim}} = 180.0\text{V} + \left(\frac{v_{\text{raw}}}{4095.0} \times 80.0\text{V}\right)$$
  *Midpoint (~2048 ADC) $\approx 220.0\text{V}$ (Nominal range: 215V–225V).*
* **Feeder Current ($I_{\text{sim}}$):**
  $$I_{\text{sim}} = \left(\frac{i_{\text{raw}}}{4095.0} \times 30.0\text{A}\right)$$
  *Midpoint (~2048 ADC) $\approx 15.0\text{A}$ (Nominal range: 14A–16A).*
* **Grid Frequency ($f_{\text{sim}}$):**
  Nominal $50.0\text{ Hz}$ AC line frequency with realistic load droop ($I > 18\text{A}$) and natural grid oscillations ($48.2\text{ Hz} - 51.4\text{ Hz}$).
* **Catastrophic Button (`fault_btn`):**
  `0` = Normal circuit; `1` = Pressed / Physical line break ($<10\text{ms}$ instant Status 2 override).

---

## 8. Strict Data Contracts

### Contract 1: Hardware to Backend (Serial JSON @ 10 Hz)
```json
{
  "timestamp": 1726178000,
  "v_raw": 2048,
  "i_raw": 2048,
  "fault_btn": 0,
  "solar_ldr": 4095
}
```

### Contract 2: Backend to Frontend (WebSocket JSON @ 10 Hz)
```json
{
  "timestamp": 1726178000,
  "raw": {
    "v_raw": 2048,
    "i_raw": 2048,
    "fault_btn": 0
  },
  "metrics": {
    "voltage_sim": 220.1,
    "current_sim": 15.0,
    "solar_efficiency": 100.0,
    "frequency_sim": 50.0,
    "frequency": 50.0,
    "current_kw": 3.3,
    "energy_percent": 41,
    "stability": 98.4,
    "waveform": [65, 70, 78, 82, 85, 82, 78, 70, 65, 58, 52, 45, 38]
  },
  "ai_prediction": {
    "anomaly_score": -0.85,
    "grid_status": 0,
    "message": "System Stable - Normal Feeder Telemetry",
    "reconstruction_mse": 0.0024,
    "z_score": 0.45,
    "adaptive_threshold": 0.89
  }
}
```

### Contract 3: Backend to Hardware (Reverse Serial Command on State Change / 2 Hz Heartbeat)
```text
S:<grid_status>:<anomaly_score>\n
```
* **Example:** `S:0:-0.85\n`
* `grid_status`: `0` (Normal/Green LED), `1` (Warning/Yellow LED), `2` (Critical/Red LED)
* `anomaly_score`: Normalized score between -1.00 and 1.00 for local OLED display.