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
│   ├── ml_pipeline.py        # Scikit-Learn Isolation Forest logic
│   └── requirements.txt      # pyserial, fastapi, uvicorn, scikit-learn, pandas
└── /frontend                 # Next.js Web App
    ├── /src
    │   ├── /components       # Mapbox UI, Charts, Status Indicators
    │   ├── /hooks            # useWebSocket.js (Custom telemetry hook)
    │   └── /pages            # index.tsx (Main dashboard)
    ├── package.json          
    └── tailwind.config.js

## 2. Port Assignments & Network Configuration
*   **Hackathon Environment Constraint:** Do NOT rely on external Wi-Fi for edge-to-backend communication.
*   **Hardware → Backend:** USB Serial connection at **115200 baud**.
*   **Backend Server:** FastAPI running via Uvicorn on `http://localhost:8000`.
*   **WebSocket Endpoint:** `ws://localhost:8000/ws`
*   **Frontend Server:** Next.js development server on `http://localhost:3000`.

## 3. Hardware Architecture (ESP32)
**Goal:** Read analog/digital pins, format as JSON, print to Serial. **No blocking delays.**

*   **Pin Mappings:**
    *   `Grid Voltage (Analog):` Pin 34
    *   `Line Current (Analog):` Pin 35
    *   `Solar Output (Analog):` Pin 33
    *   `Fault Button (Digital):` Pin 32 (Requires 390Ω pull-down resistor configuration)
    *   `LED Green (Digital):` Pin 25
    *   `LED Yellow (Digital):` Pin 26
    *   `LED Red (Digital):` Pin 27
*   **Agent Constraint:** Use `millis()` for timing the 10Hz (100ms) loop. Do not use `delay(100)` as it will block incoming Serial commands (like LED state updates) from the backend.

## 4. Backend Architecture (Python / FastAPI)
**Goal:** Ingest Serial data, evaluate via ML, broadcast to WebSockets.

*   **Concurrency Model:** 
    *   FastAPI runs asynchronously. 
    *   `pyserial.Serial.readline()` is blocking. It MUST be run in a separate Python `Thread` or using `asyncio.to_thread()` to prevent locking up the WebSocket event loop.
*   **ML Data Window:** 
    *   Maintain a rolling window (e.g., `collections.deque(maxlen=50)` or Pandas DataFrame).
    *   The Isolation Forest `predict()` function requires a 2D array: `[[v1, i1], [v2, i2], ...]`.
*   **Anomaly State Machine:**
    *   Status `0`: MSE is within normal standard deviations.
    *   Status `1`: MSE exceeds 2nd standard deviation (Warning/Yellow).
    *   Status `2`: MSE exceeds 3rd standard deviation or Button == 1 (Critical/Red).

## 5. Frontend Architecture (Next.js)
**Goal:** Connect to WebSocket, parse JSON, drive 3D Mapbox markers and Recharts graphs.

*   **State Management:** Use a single React context or a custom hook (`useTelemetry`) to manage the WebSocket connection and store the latest incoming JSON payload.
*   **Performance Constraint:** Telemetry arrives at 10Hz. Do not trigger a full page re-render 10 times a second. Isolate the incoming data state exclusively to the components that need it (the Chart and the Map Marker).
*   **Mapbox Integration:** Use Mapbox GL JS to render a 3D dark-mode map. Bind the color of the grid node marker directly to the `ai_prediction.grid_status` integer (0 = Green, 1 = Yellow, 2 = Red).

## 6. Strict Data Contracts (Immutable)

**Contract 1: ESP32 to Python (Serial String)**
```json
{
  "timestamp": 1694451234,
  "v_raw": 3102, 
  "i_raw": 1840,
  "solar_ldr": 1024,
  "fault_btn": 0
}
```

**Contract 2: Python to Next.js (WebSocket Message)**
```json
{
  "timestamp": 1694451234,
  "metrics": {
    "voltage_sim": 220.5,
    "current_sim": 15.2,
    "solar_efficiency": 98.5
  },
  "ai_prediction": {
    "anomaly_score": -0.85,
    "grid_status": 0,
    "message": "System Stable"
  }
}
```