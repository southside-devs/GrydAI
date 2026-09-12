## Hackathon Execution Plan: Smart Grid Node

To maximize parallel development for a 2-Frontend, 1-Backend team, the absolute priority is decoupling your work streams immediately. The frontend team cannot wait for the hardware and machine learning to be finished.

Here is your end-to-end 36-hour sprint plan based on the strict data contracts we defined.

### Phase 1: Unblocking & Infrastructure (Hours 0–4)

**Goal:** Establish the data pipeline so the frontend can build against a moving data stream while you build the physical hardware.

* **Backend/Hardware (You):**
* Initialize the Python `FastAPI` repository.
* Build the WebSocket endpoint (`ws://localhost:8000/ws`).
* **Crucial Step:** Write a temporary background script that generates "fake" sine-wave JSON data matching **Contract 2** and blasts it over the WebSocket at 10Hz.
* Verify the frontend team can connect to it. Once they are receiving data, your streams are decoupled.


* **Frontend 1 (Mapping & Architecture):**
* Initialize the Next.js frontend and Tailwind CSS configuration.
* Create the central `useWebSocket` hook to ingest your mock JSON stream into global React state.
* Initialize the Mapbox GL JS component and render the base dark-mode map.


* **Frontend 2 (Data Viz & Layout):**
* Set up Recharts or Chart.js components.
* Wire the charts to the global WebSocket state so they instantly plot the mock sine-wave data.
* Design the skeleton of the "Financial/Carbon Loss Avoided" impact dashboard.



### Phase 2: Hardware Reality & Core UI (Hours 4–12)

**Goal:** Replace the fake data with real physical telemetry, and map the UI to react to state changes.

* **Backend/Hardware (You):**
* Write the C++ firmware for the ESP32. Read the analog potentiometers, the push-button, and format it into **Contract 1**.
* Write the Python `serial_reader.py` script running on a background thread to ingest the USB data.
* Update FastAPI to broadcast the real ESP32 data over the WebSocket instead of the fake sine waves.


* **Frontend 1 (Mapping & Architecture):**
* Place a 3D marker on the Mapbox instance representing the "Grid Substation".
* Tie the marker's color to the `ai_prediction.grid_status` integer (0 = Green, 1 = Yellow, 2 = Red/Pulsing).


* **Frontend 2 (Data Viz & Layout):**
* Build out the layout UI (sidebar, header, status alerts).
* Implement conditional rendering: If `grid_status == 2`, flash critical warning banners across the dashboard.



### Phase 3: The Brains & Integration (Hours 12–24)

**Goal:** Implement the Machine Learning pipeline and finalize the end-to-end loop.

* **Backend/Hardware (You):**
* **Data Collection:** Run the ESP32 for 15 minutes with the dials untouched. Save this to a CSV.
* **Training:** Train the Scikit-Learn Autoencoder and Isolation Forest on this "healthy" CSV to establish the baseline.
* **Integration:** Inject the ML `.predict()` function into the FastAPI WebSocket loop.
* Test the hardware trigger: When you turn the physical potentiometer, the Python terminal should instantly output an anomaly.


* **Frontend 1 & 2 (Polish & Impact):**
* Smooth out the Recharts animations so they don't stutter at 10Hz updates.
* Finalize the Impact Calculator: Build the math logic that shows exactly how much money and CO2 is saved by catching the specific fault being broadcast.
* Implement high-contrast, professional styling for the final presentation.



### Phase 4: Hardware Sync & Pitch Rehearsal (Hours 24–36)

**Goal:** Freeze all feature development. The focus shifts entirely to the physical demonstration.

* **Whole Team Task: End-to-End Latency Tuning:**
* You turn the physical dial. The team times exactly how long it takes for the Mapbox node to turn red. If it takes longer than 1 second, optimize the Python rolling window or the Next.js re-render cycles.


* **Whole Team Task: Pitch Choreography:**
* Script exactly what the presenter is saying when you trigger the potentiometer.
* Ensure the "Solar Drop" (covering the photoresistor) and the "Catastrophic Fault" (hitting the push button) trigger distinct, visually impressive alerts on the dashboard.


* **Code Freeze:** Stop adding features. Fix only critical bugs that break the live demo loop.