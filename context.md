# Project Context: AI-Powered Smart Grid Anomaly Monitor & Physical Node

## 1. Project Identity & Objective
* **Concept:** A real-time command portal for utility operators that monitors power grid stability using unsupervised machine learning. It detects voltage anomalies and line faults before outages happen by identifying micro-fluctuations in the electrical signal.
* **Physical Component:** A micro-hardware unit simulating a power grid node streams real-time, zero-latency telemetry to the backend.
* **Presentation Format:** A live, interactive demo where presenters manually trigger hardware faults (via potentiometers and sensors) to watch the AI predict failures on a 3D geospatial web dashboard in real-time.

## 2. Core Problem & Value Proposition
Power grids rely on legacy SCADA systems that are fundamentally reactive—they alert operators *after* a threshold is breached or a transformer blows. Our project shifts grid management from reactive diagnostics to predictive pre-emption. 
* **The Bandwidth Bottleneck:** Real grid sensors (PMUs) generate massive data. Sending this to a centralized cloud is impossible over rural networks. We solve this by bridging edge-hardware directly to local inference.
* **The Data Scarcity Problem:** Machine learning struggles with grid monitoring because catastrophic failures are rare, meaning there is little "failure data" to train on. We bypass this by using unsupervised learning (Autoencoders) trained only on "healthy" data, allowing the system to flag any deviation.
* **The "Black Box" Problem:** Grid operators are risk-averse. Our UI maps complex anomaly scores to intuitive visual alerts (green/yellow/red 3D nodes) tied to clear financial and carbon-impact metrics.

## 3. Technology Stack Overview
* **Frontend:** React / Next.js, Tailwind CSS, Mapbox GL JS (for 3D geospatial grid mapping), Recharts / Chart.js (for live telemetry waveforms).
* **Backend:** Python FastAPI, WebSockets (for live streaming), NumPy / Pandas (for time-series data windowing).
* **Machine Learning:** Scikit-Learn. Pipeline utilizes an Autoencoder (to establish the normal baseline) feeding into an Isolation Forest (to trigger the anomaly alert based on reconstruction error).
* **Hardware/Embedded:** ESP32 (38-pin), programmed in C++ via Arduino IDE. PySerial handles the USB bridge.

## 4. Hardware Inventory & Physical Setup
The project explicitly avoids using live AC mains voltage (like ZMPT101B or ACS712 sensors) to comply with hackathon safety rules. The grid is simulated using 3.3V/5V DC components.
* **Microcontroller:** ESP32 Development Board (38-pin).
* **Sensors (The Simulators):**
  * 2x 10kΩ Rotary Potentiometers (Simulating "Grid Voltage" and "Line Current").
  * 1x Photoresistor/LDR (Simulating solar grid drop-offs when covered by a hand).
  * 1x Tactile Push Button (Simulating an instantaneous line break/catastrophic fault).
* **Visual Output (Hardware Side):**
  * 0.96" I2C OLED Display (SSD1306) to show local metrics.
  * 3x 5mm LEDs (Green, Yellow, Red) to indicate local AI status.
* **Prototyping Materials:** 830-point breadboard, 25x Male-to-Male (M-M) jumper wires, 15x Female-to-Male (F-M) jumper wires. Data-sync USB cable.
* **Hardware Quirk Note for Team:** We have four 390Ω resistors. Three will be used to protect the LEDs. The fourth 390Ω resistor will function as the pull-down resistor for the push button (standard is 10kΩ, but 390Ω is safely within the ESP32's current limits).

## 5. Machine Learning Strategy (Unsupervised Anomaly Detection)
* **Training Phase:** The model is trained dynamically. The hardware runs normally (without turning the dials) to stream a "perfectly healthy" baseline. 
* **Detection Phase:** An Autoencoder attempts to reconstruct the live time-series data. When a dial is turned (simulating a fault), the Autoencoder fails to reconstruct the new pattern, causing the Mean Squared Error (MSE) to spike. 
* **The Trigger:** An Isolation Forest isolates this MSE spike and returns a status flag before a complete failure occurs.

## 6. Demo Script Strategy (For Context Alignment)
The software and hardware must be built to support a strict 3-minute live pitch:
1. Show the Mapbox UI with stable, healthy baseline data streaming from the hardware.
2. Presenter manually turns a potentiometer (introducing a micro-fluctuation).
3. System must react in <1 second: The ML detects the anomaly, the frontend 3D node pulses red, and the hardware LED switches to red.
4. Pitch concludes by showing an impact dashboard calculating the estimated financial/carbon losses avoided by catching the fault 10 minutes early.

## 7. System Architecture & Data Flow
* **Path:** `ESP32` → `Potentiometers` → `USB Cable` → `Python PySerial (Background Thread)` → `FastAPI` → `Scikit-Learn ML Window` → `WebSockets (localhost)` → `Next.js 3D UI`
* **Network Strategy (Hackathon Quirk):** We are intentionally bypassing the public hackathon Wi-Fi to avoid AP (Access Point) isolation and latency. All hardware telemetry flows locally via the USB Serial bridge at a 115200 baud rate.

## 8. Exact Hardware Pinout Map (ESP32 38-Pin)
* **Power:** 3.3V (`3V3`) and `GND` connected to breadboard rails.
* **Analog Input 1 (Grid Voltage):** 10kΩ Potentiometer on **Pin D34**.
* **Analog Input 2 (Line Current):** 10kΩ Potentiometer on **Pin D35**.
* **Analog Input 3 (Solar Drop):** Photoresistor (LDR) on **Pin D33**.
* **Digital Input (Catastrophic Fault):** Tactile Push Button on **Pin D32** (using 390Ω pull-down).
* **Digital Output (Status LEDs):** Green (**Pin D25**), Yellow (**Pin D26**), Red (**Pin D27**).
* **I2C Output (OLED):** SDA (**Pin D21**), SCL (**Pin D22**).

## 9. Data Contracts (Crucial for Parallel Development)
To allow Frontend, Backend, and Hardware to be developed simultaneously, all code must adhere exactly to these JSON structures.

**Contract 1: Hardware to Backend (JSON via Serial @ 10Hz)**
```json
{
  "timestamp": 1694451234,
  "v_raw": 3102, 
  "i_raw": 1840,
  "fault_btn": 0,
  "solar_ldr": 1024
}

**Contract 2: Backend to Frontend (JSON via WebSocket ws://localhost:8000/ws)**
```json
{
  "timestamp": 1694451234,
  "metrics": {
    "voltage_sim": 220.5,
    "current_sim": 15.2
  },
  "ai_prediction": {
    "anomaly_score": -0.85,
    "grid_status": 0,
    "message": "System Stable"
  }
}

## 10. The 36-Hour Execution Plan
* **Hours 0–4 (The Skeleton):** Frontend sets up basic Next.js app with blank Mapbox. Backend builds FastAPI WebSocket endpoint emitting fake sine-wave data. (Goal: UI plots fake data before hardware is touched).
* **Hours 4–12 (Hardware Pipeline):** Wire the ESP32 flat on the breadboard. Write C++ to read analog pins. Build the Python `pyserial` script to ingest USB data and replace the fake backend data.
* **Hours 12–24 (The Brains):** Train the ML pipeline on a collected CSV of the simulated normal hardware data. Hook live ESP32 data into the `.predict()` function.
* **Hours 24–30 (The Visualization):** Map the ML output flags to the Mapbox UI (green vs pulsing red node). Build the "Financial/Carbon Loss Avoided" impact slider UI.
* **Hours 30–36 (Polish & Rehearsal):** Stop coding. Sync physical dial turning with sub-second screen reactions.

## 11. Division of Labor
* **[Insert Name]:** Next.js Frontend & Mapbox integration.
* **[Insert Name]:** FastAPI Backend & Scikit-Learn integration.
* **[Insert Name]:** ESP32 C++ Firmware & Hardware wiring.