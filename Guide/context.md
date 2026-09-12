## 1. Project Identity & Objective
* **Concept:** An edge-AI command portal for electrical utility operators and critical facility engineers that monitors power grid stability using unsupervised machine learning. It predicts voltage anomalies, winding overheating, and line faults **10 to 15 minutes before catastrophic failure** by identifying micro-fluctuations in electrical waveforms.
* **Physical Component:** A micro-hardware edge unit simulating a **Secondary Distribution Transformer Feeder Node** (protecting a cluster of 10–50 homes) that streams real-time, zero-latency telemetry to the backend.
* **Presentation Format:** A live, interactive demonstration where presenters manually trigger hardware faults (potentiometers simulating EV current surges and voltage sags, buttons simulating line breaks) to show the AI predicting failures on a 3D geospatial dashboard in real-time.

## 2. Target End-Users & Field Deployment Topology

### A. The Target Personas
1. **Primary: Regional Utility Distribution Operators (DSOs) & Substation Reliability Engineers**
   * Responsible for grid uptime, transformer health, and avoiding regulatory blackout penalties (SAIDI/SAIFI metrics).
2. **Secondary: Critical Facility Microgrid Managers (Hospitals, AI Data Centers, Semiconductor Fabs)**
   * Responsible for mission-critical power continuity. Cannot tolerate dirty power, voltage sags, or generator cold-start crashes.

### B. Deployment Topology: 1 Unit Per Distribution Transformer
* **The Physical Grid Gap:** Power travels down streets at 11kV/33kV and is stepped down to 230V/120V by **Distribution Transformers** (the grey cylindrical "cans" on utility poles or green ground pad-mount boxes). Each transformer feeds a local cluster of **10 to 50 households**.
* **The Connection Point:** The GrydAI edge unit connects directly to the low-voltage secondary side (230V) of this transformer via standardized non-intrusive Potential Transformers (PTs) and Current Transformers (CTs).
* **Why This Level Matters:**
  * **Smart meters at homes** only report billing data once an hour—completely useless for sub-second fault detection.
  * **Substations** are miles upstream and blind to localized neighborhood transformer stress.
  * **GrydAI bridges this blindspot** with a dedicated 10 Hz edge guardian at each neighborhood transformer.

## 3. Core Problem & Value Proposition: The "Airbag vs. Radar"

### A. The EV & Rooftop Solar Overload Crisis
Neighborhood transformers were designed 30–40 years ago for lightbulbs and refrigerators. Today:
* Simultaneous **Electric Vehicle (EV) fast charging** and air conditioning loads at 6:00 PM overload transformer windings, boiling cooling oil and causing explosive fires.
* **Rooftop solar backfeeding** causes reverse voltage spikes during peak sun.
* Utilities currently have **zero visibility**—they only discover a blown transformer when residents call customer service.

### B. Why Hospitals & Data Centers Need GrydAI (Beyond Generators & Inverters)
* **Generators Are Like Airbags (The 10-Second Cold-Start Gap):** Under the NFPA 110 standard, emergency diesel generators take **10 to 15 seconds** to crank and accept full load. During sudden cold-shock transfers, generators fail to start ~1–2% of the time. GrydAI is the **collision-avoidance radar**: by detecting line degradation 10 minutes early, it enables a smooth, synchronized "closed-transition" soft transfer before the municipal line dies.
* **Inverters Don't Stop "Dirty Power":** Inverters catch millisecond spikes and 0V blackouts, but are blind to sustained harmonic distortion and 190V brownout sags. These micro-distortions cause catastrophic MRI helium quenches (\$80,000+ in damages) and robotic surgical equipment resets.

### C. The Machine Learning Edge Advantage
1. **The Data Scarcity Problem:** Catastrophic grid failures are rare, making supervised ML impossible. We use **Unsupervised Autoencoders** trained purely on healthy resting baseline waveforms ($\mathbf{x} \rightarrow \mathbf{\hat{x}}$). Any deviation causes Reconstruction Mean Squared Error (MSE) to spike.
2. **The Bandwidth Bottleneck:** Streaming gigabytes of high-frequency PMU telemetry over rural networks is impossible. GrydAI performs local edge inference, transmitting only lightweight alerts and status codes upstream.

## 3. Technology Stack Overview
* **Frontend:** React / Next.js, Tailwind CSS, Mapbox GL JS (with MapLibre offline fallback for 3D geospatial grid mapping), Recharts / Chart.js (for live telemetry waveforms).
* **Backend:** Python FastAPI, WebSockets (for live streaming), NumPy / Pandas (for time-series data windowing).
* **Machine Learning:** Scikit-Learn. Pipeline utilizes a lightweight `MLPRegressor` Autoencoder (to establish the normal baseline and calculate live reconstruction MSE) paired with `IsolationForest` and calibrated dynamic standard deviation thresholds to trigger sub-second anomaly alerts.
* **Hardware/Embedded:** ESP32 (38-pin), programmed in C++ via Arduino IDE. PySerial handles the USB bridge with bidirectional command support.

## 4. Hardware Inventory & Physical Setup
The project explicitly avoids using live AC mains voltage (like ZMPT101B or ACS712 sensors) to comply with hackathon safety rules. The grid is simulated using 3.3V/5V DC components.
* **Microcontroller:** ESP32 Development Board (38-pin).
* **Sensors (The Simulators):**
  * 2x 10kΩ Rotary Potentiometers (Simulating "Grid Voltage" and "Line Current").
  * 1x Tactile Push Button (Simulating an instantaneous line break/catastrophic fault).
  * 1x Photoresistor/LDR [Optional / Stretch Goal] (Simulating solar grid drop-offs if time permits; defaults safely to 100% if unwired).
* **Visual Output (Hardware Side):**
  * 0.96" I2C OLED Display (SSD1306) to show local metrics and AI status (refreshed at 2–3Hz to prevent I2C blocking).
  * 3x 5mm LEDs (Green, Yellow, Red) to indicate local AI status (switched immediately on status change).
* **Prototyping Materials:** 830-point breadboard, 25x Male-to-Male (M-M) jumper wires, 15x Female-to-Male (F-M) jumper wires. Data-sync USB cable.
* **Hardware Quirk Note for Team:** We have four 390Ω resistors. Three will be used to protect the LEDs. The fourth 390Ω resistor will function as the pull-down resistor for the push button (standard is 10kΩ, but 390Ω is safely within the ESP32's current limits).

## 5. Machine Learning Strategy (Unsupervised Anomaly Detection & Hybrid Safeguards)
* **Feature Extraction:** Evaluates 4 core electrical parameters $[V_{\text{sim}}, I_{\text{sim}}, \Delta V, \Delta I]$ in real-time. Solar irradiance is tracked as auxiliary telemetry but is decoupled from the transformer health Autoencoder to prevent floating-pin or nightfall false alarms.
* **Pre-Trained & Dynamic Autoencoder:** Pre-trained on startup across nominal feeder operating bands ($215\text{V} - 225\text{V}$, $11\text{A} - 18\text{A}$) using a Scikit-Learn `MLPRegressor(hidden_layer_sizes=(8, 3, 8))`. Dynamic recalibration (`POST /api/calibrate`) is available on-demand.
* **Detection Phase (Reconstruction Error):** The Autoencoder reconstructs the live telemetry vector. Any voltage sag, over-current surge, or harmonic rate-of-change distortion causes Reconstruction Mean Squared Error (MSE) to spike immediately.
* **Dual-Tier Decision Engine:**
  * **Emergency Override:** Push button (`fault_btn == 1`) trips immediate Status 2 (Critical / Red) in $< 10\text{ms}$.
  * **Physical Safeguards + Statistical Z-Score ($Z = \frac{\text{MSE} - \mu}{\sigma}$):**
    * **Critical (Red):** $I > 23.0\text{A}$ (EV Overload/Short), $V < 198.0\text{V}$ (Winding Sag/Brownout), $V > 242.0\text{V}$ (Surge), or $Z > 3.5$.
    * **Warning (Yellow):** $I > 18.5\text{A}$ (Current Surge), $V < 210.0\text{V}$ or $V > 230.0\text{V}$ (Voltage Fluctuation), or $Z > 2.0$.
    * **Normal (Green):** Within nominal electrical envelope and $Z \le 2.0$.
* **Anti-Flicker Consensus Filter:** Requires 2 consecutive samples of agreement before shifting operational state, eliminating ADC thermal noise jitter at boundary transitions. Emergency button trips instantly.

## 6. Live Pitch Choreography & Judge Defense (For Context Alignment)

The software and hardware must be built to execute this strict 3-minute live pitch:

### A. Stage Choreography
1. **[0:00 - 0:45] The Hook & Blindspot:**
   * Introduce the problem: "Generators and smart meters are like airbags—they only react after a transformer explodes. Neighborhood transformers serving 20–50 homes are blind to EV charging surges and solar volatility."
2. **[0:45 - 1:30] The Technology:**
   * Explain the unsupervised Autoencoder running on edge hardware: "We learn healthy waveforms ($\mathbf{x} \rightarrow \mathbf{\hat{x}}$); when insulation degrades or coils overheat, reconstruction MSE spikes instantly."
3. **[1:30 - 2:30] The Live Hardware Action (The WOW Factor):**
   * **Step 1:** Show the MapLibre 3D command portal with stable 220V / 15A telemetry streaming at 10 Hz from **Transformer Node #TR-408**. AI Status is neon green.
   * **Step 2:** Presenter 2 turns the Current potentiometer dial (simulating 4 neighbor EVs fast-charging simultaneously).
   * **Step 3 (Under 300ms):** The live Reconstruction MSE curve shoots straight up, the 3D map node pulses amber warning (Status 1), and the physical hardware Yellow LED clicks ON.
   * **Step 4:** Presenter 2 taps the push button (instant line break) $\rightarrow$ emergency Neon Red lockdown (Status 2) in $< 50\text{ms}$.
4. **[2:30 - 3:00] Economic & Carbon Impact:**
   * Point to the Impact Calculator: "$48,500 saved in transformer replacement; 42 minutes of downtime avoided for 24 homes; 2.4 metric tons of $CO_2$ peaker emissions avoided."

### B. Inevitable Judge Questions & Instant Answers
* **Q: Why not simple threshold checks (`voltage > 240`)?**
  * *A:* "Thresholds catch failures at $T=0$ when it's already on fire. Micro-fluctuations, harmonic distortion, and thermal degradation occur 10 minutes earlier within standard voltage bounds. Our Autoencoder catches it at $T=-10\text{ minutes}$."
* **Q: Why don't hospital backup generators solve this?**
  * *A:* "By NFPA 110 code, emergency generators take 10–15 seconds to crank and take full load. Inverters don't stop dirty power or sustained 190V sags that trigger \$80,000 MRI helium quenches. GrydAI provides a 10-minute warning for a seamless, synchronized soft transfer."
* **Q: How do you scale across a city?**
  * *A:* "Local inference. The 10 Hz telemetry and autoencoder stay on the edge node. Only 1-byte status heartbeats and alert packets travel over the network, completely bypassing the bandwidth bottleneck."

## 7. System Architecture & Data Flow
* **Telemetry Path (Forward):** `ESP32` → `Potentiometers` → `USB Serial (115200 baud @ 10Hz)` → `Python PySerial (Background Thread)` → `FastAPI` → `Scikit-Learn ML Window` → `WebSockets (localhost)` → `Next.js 3D UI`
* **Control Path (Reverse):** `FastAPI / ML` → `USB Serial (Event-Driven / 2Hz Heartbeat)` → `ESP32` (Switches Green/Yellow/Red LEDs + updates OLED status).
* **Network Strategy (Hackathon Quirk):** We are intentionally bypassing public Wi-Fi to avoid AP (Access Point) isolation and latency. All hardware telemetry flows locally via the USB Serial bridge at 115200 baud rate.

## 8. Exact Hardware Pinout Map (ESP32 38-Pin)
* **Power:** 3.3V (`3V3`) and `GND` connected to breadboard rails.
* **Analog Input 1 (Grid Voltage):** 10kΩ Potentiometer on **Pin D34**.
* **Analog Input 2 (Line Current):** 10kΩ Potentiometer on **Pin D35**.
* **Analog Input 3 (Solar Drop):** Photoresistor (LDR) on **Pin D33**.
* **Digital Input (Catastrophic Fault):** Tactile Push Button on **Pin D32** (using 390Ω pull-down).
* **Digital Output (Status LEDs):** Green (**Pin D25**), Yellow (**Pin D26**), Red (**Pin D27**).
* **I2C Output (OLED):** SDA (**Pin D21**), SCL (**Pin D22**).

## 9. Data Contracts (Crucial for Parallel Development)
To allow Frontend, Backend, and Hardware to be developed simultaneously, all code must adhere exactly to these structures.

**Contract 1: Hardware to Backend (JSON via Serial @ 10Hz)**
```json
{
  "timestamp": 1694451234,
  "v_raw": 3102, 
  "i_raw": 1840,
  "fault_btn": 0,
  "solar_ldr": 1024
}
```

**Contract 2: Backend to Frontend (JSON via WebSocket ws://localhost:8000/ws @ 10Hz)**
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

**Contract 3: Backend to Hardware (Reverse Serial Command on State Change / 2Hz Heartbeat)**
```text
S:<grid_status>:<anomaly_score>\n
```
* Example: `S:0:-0.85\n`
* `grid_status`: `0` (Normal/Green), `1` (Warning/Yellow), `2` (Critical/Red)
* `anomaly_score`: Float between -1.00 and 1.00 for display on the OLED.

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