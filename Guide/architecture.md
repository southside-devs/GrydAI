# SYSTEM ARCHITECTURE & DEVELOPMENT BLUEPRINT

This document is designed to provide immediate, definitive answers to any AI coding agent or developer working on the Smart Grid Anomaly Monitor project. It defines the exact file structures, port assignments, data shapes, and concurrency models required for the system to function.

## 1. Monorepo Directory Structure
The project should be organized as a monorepo to keep all team members synced.

```text
smart-grid-node/
├── /firmware                 # ESP32 C++ Code
│   └── smart_grid_node.ino   # Arduino IDE entry point
├── /backend                  # Python Ingestion & ML
│   ├── main.py               # FastAPI server & WebSocket endpoints
│   ├── serial_reader.py      # Background thread for PySerial
│   ├── ml_pipeline.py        # Scikit-Learn Autoencoder & Isolation Forest
│   ├── mock_generator.py     # 10Hz synthetic telemetry generator (--mock)
│   └── requirements.txt      # pyserial, fastapi, uvicorn, scikit-learn, pandas
└── /frontend                 # Next.js Web App (Managed by Frontend Team)
    ├── /src
    │   ├── /app              # Next.js App Router (layout.tsx, page.tsx)
    │   ├── /components       # MapLibre 3D UI, Charts, Status Indicators
    │   └── /hooks            # useWebSocket.ts (Custom telemetry hook)
    ├── package.json          
    └── tailwind.config.js

## 2. Target End-Users & Field Deployment Topology

*   **Primary End-User:** Regional Utility Distribution System Operators (DSOs) & Substation Engineers.
*   **Secondary End-User:** Critical Facility Microgrid Engineers (Hospitals, Data Centers, Semiconductor Fabs).
*   **Physical Deployment Point:** **Secondary Distribution Transformer** (the pole-mounted cylindrical "can" or ground pad-mount box stepped down from 11kV to 230V/120V, feeding a cluster of **10 to 50 households**).
*   **Instrumentation Tap:** Low-voltage secondary side (230V) via standard non-intrusive Potential Transformers (PTs) and Current Transformers (CTs).
*   **Simulated Node Identity:** **Transformer Node #TR-408 (Maple St. Feeder / Substation Alpha)**.

## 3. Port Assignments & Network Configuration
*   **Hackathon Environment Constraint:** Do NOT rely on external Wi-Fi for edge-to-backend communication.
*   **Hardware → Backend:** USB Serial connection at **115200 baud**.
*   **Backend Server:** FastAPI running via Uvicorn on `http://localhost:8000`.
*   **WebSocket Endpoint:** `ws://localhost:8000/ws`
*   **Frontend Server:** Next.js development server on `http://localhost:3000`.

## 4. Hardware Architecture (ESP32)
**Goal:** Read analog/digital pins, format as JSON, print to Serial. **No blocking delays.**

*   **Pin Mappings:**
    *   `Grid Voltage (Analog):` Pin 34
    *   `Line Current (Analog):` Pin 35
    *   `Solar Output (Analog):` Pin 33
    *   `Fault Button (Digital):` Pin 32 (Requires 390Ω pull-down resistor configuration)
    *   `LED Green (Digital):` Pin 25
    *   `LED Yellow (Digital):` Pin 26
    *   `LED Red (Digital):` Pin 27
    *   `I2C OLED (SSD1306):` Pin 21 (SDA), Pin 22 (SCL)
*   **Loop & Timing Constraints:** 
    *   Use `millis()` for timing the 10Hz (100ms) telemetry loop. Do not use `delay()` as it blocks incoming Serial commands and telemetry pacing.
    *   Update the SSD1306 OLED at **2Hz–3Hz** (every 300–500ms) or on immediate status change. This ensures the ~25ms I2C write time never throttles or disrupts the 10Hz serial stream.
    *   Parse incoming reverse serial commands non-blockingly (`S:<status>:<score>\n`).

## 5. Backend Architecture (Python / FastAPI)
**Goal:** Ingest Serial data, evaluate via ML, broadcast to WebSockets, and send reverse control to ESP32.

*   **CLI Execution Modes:**
    *   **Hardware Mode (Default):** `python main.py` connects to ESP32 via USB Serial (auto-detects port or takes `--port COM3`).
    *   **Mock / Simulation Mode:** `python main.py --mock` runs without physical hardware, generating realistic synthetic 10Hz sine-wave telemetry matching Contract 1/2 for frontend and ML testing.
*   **Concurrency Model:** 
    *   FastAPI runs asynchronously via Uvicorn.
    *   `pyserial.Serial` reader runs in a dedicated background `threading.Thread` or `asyncio.to_thread()` to prevent locking up the async WebSocket loop.
*   **ML Pipeline (Scikit-Learn Autoencoder & Hybrid Decision Engine):** 
    *   **Feature Extraction:** Telemetry window computing 4 core electrical features: $[V_{\text{sim}}, I_{\text{sim}}, \Delta V, \Delta I]$.
        *   *Solar Decoupling Note:* `solar_efficiency` is streamed as auxiliary telemetry but is decoupled from the core transformer Autoencoder vector. This prevents floating pin noise or natural nighttime solar drop-offs from triggering false transformer health alarms.
    *   **Autoencoder Architecture:** Lightweight Scikit-Learn `MLPRegressor` (`hidden_layer_sizes=(8, 3, 8)`, `relu`, `adam`) pre-trained on realistic grid distribution ($V \in [215\text{V}, 225\text{V}]$, $I \in [11\text{A}, 18\text{A}]$) for instant zero-wait startup.
    *   **Reconstruction Metric & Z-Score:** Computes Mean Squared Error (MSE) $\frac{1}{N}\sum (\mathbf{x} - \mathbf{\hat{x}})^2$ and standardizes to calibrated baseline: $Z = \frac{\text{MSE} - \mu_{\text{MSE}}}{\sigma_{\text{MSE}}}$.
    *   **Two-Tier Decision Engine:**
        *   *Tier 1: Instant Emergency Override:* `fault_btn == 1` trips Status 2 (Critical / Red) instantly with 0ms debouncing.
        *   *Tier 2: Physical Electrical Thresholds + Autoencoder Z-Score:*
            *   **Status 2 (Critical / Red):** $I_{\text{sim}} > 23.0\text{A}$ (Severe Overcurrent / EV Surge), $V_{\text{sim}} < 198.0\text{V}$ (Severe Winding Sag / Brownout), $V_{\text{sim}} > 242.0\text{V}$ (Overvoltage Surge), or $Z > 3.5$ (Severe Waveform Distortion).
            *   **Status 1 (Warning / Yellow):** $I_{\text{sim}} > 18.5\text{A}$ (Abnormal Current Surge), $V_{\text{sim}} < 210.0\text{V}$ or $V_{\text{sim}} > 230.0\text{V}$ (Voltage Fluctuation), or $Z > 2.0$ (Statistical Anomaly).
            *   **Status 0 (Normal / Green):** Nominal feeder band ($198\text{V} \le V \le 230\text{V}$, $I \le 18.5\text{A}$, $Z \le 2.0$).
    *   **Anti-Flicker Consensus Filter:** Uses a rolling 3-sample buffer with 2-sample majority consensus (`Counter`) to eliminate single-sample ADC thermal noise jitter at decision boundaries. Emergency button bypasses filter for immediate trip.
    *   **Continuous Anomaly Score Mapping:**
        *   *Normal:* Bounded between $-1.00$ and $-0.65$ (nominal resting ~ $-0.85$).
        *   *Warning:* Mapped between $+0.20$ and $+0.50$.
        *   *Critical:* Mapped between $+0.75$ and $+1.00$ ($1.00$ on physical button trip).
*   **Reverse Control to Hardware:**
    *   When status changes or at 2Hz heartbeat, backend sends `S:<grid_status>:<anomaly_score>\n` to ESP32 over serial.

## 6. Frontend Architecture (Next.js)
**Goal:** Connect to WebSocket, parse JSON, drive 3D map markers and Recharts graphs.

*   **Framework:** Next.js (App Router) with Tailwind CSS.
*   **State Management:** Use a custom hook (`useTelemetry`) to manage the WebSocket connection (`ws://localhost:8000/ws`) and store the latest incoming JSON payload.
*   **Performance Constraint:** Telemetry arrives at 10Hz. Do not trigger a full page re-render 10 times a second. Isolate the incoming data state exclusively to the components that need it (the Chart and the Map Marker).
*   **Map Engine (MapLibre GL JS):**
    *   Uses **MapLibre GL JS** (open-source, 100% token-free).
    *   Style: CartoDB Dark Matter vector style (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`).
    *   Zero token/credit card registration required; fully immune to hackathon API outages.
    *   Renders a 3D perspective grid with transmission lines and binds the primary substation node color directly to `ai_prediction.grid_status` (0 = Green, 1 = Yellow, 2 = Red pulsing).

## 7. Sensor Scaling & Calibration Formulas

To map raw 12-bit ADC values (0–4095) to realistic electrical engineering units:
*   **Grid Voltage ($V_{\text{sim}}$):** $180.0\text{V} + \left(\frac{v_{\text{raw}}}{4095.0} \times 80.0\text{V}\right)$
    *   Midpoint (~2048 ADC) $\approx 220.0\text{V}$ (Normal operational range: 215V–225V).
*   **Line Current ($I_{\text{sim}}$):** $\left(\frac{i_{\text{raw}}}{4095.0} \times 30.0\text{A}\right)$
    *   Midpoint (~2048 ADC) $\approx 15.0\text{A}$ (Normal operational range: 14A–16A).
*   **Catastrophic Button (`fault_btn`):** `0` = Closed/Normal, `1` = Pressed/Line Break (Instant Status 2 override).
*   **Solar LDR (`solar_ldr` & `solar_efficiency`) [OPTIONAL / STRETCH GOAL]:**
    *   If unwired/absent, defaults gracefully to `100.0%`.
    *   When wired: $\text{Efficiency} = \left(\frac{\text{solar\_ldr}}{4095.0} \times 100.0\%\right)$.
    *   Note: The core system prioritizes Voltage, Current, and Catastrophic Break; Solar is engaged only if time permits.

## 8. Strict Data Contracts (Immutable)

**Contract 1: ESP32 to Python (Serial String @ 10Hz)**
```json
{
  "timestamp": 1694451234,
  "v_raw": 3102, 
  "i_raw": 1840,
  "fault_btn": 0,
  "solar_ldr": 4095
}
```
*(Note: `solar_ldr` is optional; defaults to 4095 if unused).*

**Contract 2: Python to Next.js (WebSocket Message @ 10Hz)**
```json
{
  "timestamp": 1694451234,
  "metrics": {
    "voltage_sim": 220.5,
    "current_sim": 15.2,
    "solar_efficiency": 100.0
  },
  "ai_prediction": {
    "anomaly_score": -0.85,
    "grid_status": 0,
    "message": "System Stable"
  }
}
```

**Contract 3: Python to ESP32 (Reverse Serial String on Change / 2Hz Heartbeat)**
```text
S:<grid_status>:<anomaly_score>\n
```
* Example: `S:0:-0.85\n`
* `grid_status`: `0` (Normal/Green), `1` (Warning/Yellow), `2` (Critical/Red)
* `anomaly_score`: Float between -1.00 and 1.00 (or MSE score) for display on the OLED.