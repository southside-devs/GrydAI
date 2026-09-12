/*
 ==============================================================================
  GRYDAI: AI-Powered Smart Grid Anomaly Monitor & Physical Node
  Target Hardware: ESP32 Development Board (38-Pin)
  Role: Secondary Distribution Transformer Edge Simulator (Node #TR-408)
  Firmware Version: 1.0.0
 ==============================================================================

  Pinout Configuration (ESP32 38-Pin):
  ------------------------------------
  * Analog Input 1 (Grid Voltage):   Pin D34 (ADC1_CH6)
  * Analog Input 2 (Line Current):   Pin D35 (ADC1_CH7)
  * Analog Input 3 (Solar LDR):      Pin D33 (ADC1_CH5) [Optional / Stretch]
  * Digital Input (Catastrophic):    Pin D32 (Push-Button with 390 Ohm pull-down)
  * Digital Output (Status Green):   Pin D25 (390 Ohm resistor to LED)
  * Digital Output (Status Yellow):  Pin D26 (390 Ohm resistor to LED)
  * Digital Output (Status Red):     Pin D27 (390 Ohm resistor to LED)
  * Digital Output (Alert Buzzer):   Pin D18 (Direct to KC-1206 Buzzer)
  * I2C Bus (SSD1306 128x64 OLED):   SDA on Pin D21, SCL on Pin D22

  Protocol Contracts:
  -------------------
  * Outgoing (Contract 1 @ 10 Hz via Serial 115200 baud):
    {"timestamp": 123456, "v_raw": 2048, "i_raw": 2048, "fault_btn": 0, "solar_ldr": 4095}
  
  * Incoming (Contract 3 Reverse Control):
    S:<grid_status>:<anomaly_score>\n  (e.g., "S:0:-0.85\n", "S:2:0.98\n")
 ==============================================================================
*/

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ----------------------------------------------------------------------------
// Pin Definitions
// ----------------------------------------------------------------------------
#define PIN_VOLTAGE     34
#define PIN_CURRENT     35
#define PIN_SOLAR       33
#define PIN_FAULT_BTN   32

#define PIN_LED_GREEN   25
#define PIN_LED_YELLOW  26
#define PIN_LED_RED     27
#define PIN_BUZZER      18  // KC-1206 Buzzer (1k Ohm series resistor to Pin D18)

#define OLED_SDA        21
#define OLED_SCL        22

// ----------------------------------------------------------------------------
// OLED Display Setup (SSD1306 128x64 I2C)
// ----------------------------------------------------------------------------
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1
#define SCREEN_ADDRESS  0x3C  // Default I2C address for 0.96" SSD1306

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool oledAvailable = false;

// ----------------------------------------------------------------------------
// Timing & Concurrency Variables (Strict Non-Blocking millis())
// ----------------------------------------------------------------------------
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 100; // 10 Hz (100 ms)

unsigned long lastOledTime = 0;
const unsigned long OLED_INTERVAL_MS = 350;      // ~3 Hz (Decoupled to prevent I2C bus lag)

unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_TIMEOUT_MS = 2500; // Standalone fail-safe timeout

// ----------------------------------------------------------------------------
// State Variables
// ----------------------------------------------------------------------------
int aiStatus = 0;             // 0 = Green/Stable, 1 = Yellow/Warning, 2 = Red/Critical
float aiScore = -0.85;        // Anomaly score from backend
String incomingSerialBuffer = "";

// Cached raw sensor readings
int cachedVRaw = 2048;
int cachedIRaw = 2048;
int cachedSolarRaw = 4095;
int cachedFaultBtn = 0;

// ----------------------------------------------------------------------------
// Helper: Update Physical LEDs
// ----------------------------------------------------------------------------
void setStatusLeds(int status) {
  aiStatus = status;
  if (status == 0) {
    // Normal / Healthy
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED, LOW);
    noTone(PIN_BUZZER);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (status == 1) {
    // Warning / Micro-Fluctuation
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
    noTone(PIN_BUZZER);
    digitalWrite(PIN_BUZZER, LOW);
  } else {
    // Critical / Fault / Line Break
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
  }
}

// ----------------------------------------------------------------------------
// Helper: Refresh OLED Display (Decoupled 2-3 Hz)
// ----------------------------------------------------------------------------
void updateOledDisplay() {
  if (!oledAvailable) {
    // Attempt auto-recovery if an I2C jumper wire was re-seated
    if (display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
      oledAvailable = true;
    } else {
      return;
    }
  }

  display.clearDisplay();

  // 1. Inverted Header Bar
  display.fillRect(0, 0, 128, 12, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setTextSize(1);
  display.setCursor(6, 2);
  display.print("GRYDAI NODE #TR-408");

  // Reset to normal text
  display.setTextColor(SSD1306_WHITE);

  // Approximate scaled readings for local operator display
  float vApprox = 180.0 + (cachedVRaw / 4095.0) * 80.0;
  float iApprox = (cachedIRaw / 4095.0) * 30.0;
  float solarApprox = (cachedSolarRaw / 4095.0) * 100.0;

  // 2. Electrical Telemetry
  display.setCursor(0, 16);
  display.printf("V: %5.1f V  I: %4.1f A", vApprox, iApprox);

  // Connection check
  bool isConnected = (millis() - lastHeartbeatTime < HEARTBEAT_TIMEOUT_MS);

  // 3. Link Mode Indicator (Replaces former Solar section)
  display.setCursor(0, 27);
  if (isConnected) {
    display.printf("Source: [LIVE] Btn:%d", cachedFaultBtn);
  } else {
    display.printf("Source: [MOCK] Btn:%d", cachedFaultBtn);
  }

  // 4. Divider Line
  display.drawFastHLine(0, 38, 128, SSD1306_WHITE);

  // 5. AI Prediction Status Badge
  display.setCursor(0, 42);

  if (!isConnected) {
    // Autonomous Edge Fallback when Backend is Offline
    int localStatus = 0;
    if (cachedFaultBtn == HIGH || vApprox >= 245.0 || vApprox <= 195.0 || iApprox >= 23.0) {
      localStatus = 2;
    } else if (vApprox >= 229.0 || vApprox <= 211.0 || iApprox >= 18.5) {
      localStatus = 1;
    }
    aiStatus = localStatus;
    setStatusLeds(localStatus);

    if (localStatus == 0) {
      display.print("STATUS: [STANDALONE]");
    } else if (localStatus == 1) {
      display.print("STATUS: [WARN-LOCAL]");
    } else {
      display.print("STATUS: [CRIT-LOCAL]");
    }

    display.setCursor(0, 53);
    display.print("AI Link: OFFLINE/MOCK");
  } else {
    if (aiStatus == 0) {
      display.print("STATUS: [ NORMAL ]");
    } else if (aiStatus == 1) {
      display.print("STATUS: [ WARNING ]");
    } else {
      display.print("STATUS: [ CRITICAL ]");
    }

    display.setCursor(0, 53);
    display.printf("AI Score: %+.2f", aiScore);
  }

  display.display();
}

// ----------------------------------------------------------------------------
// Helper: Parse Reverse Serial Commands (Contract 3)
// Format: S:<status>:<score>\n
// ----------------------------------------------------------------------------
void parseReverseCommand(String cmd) {
  cmd.trim();
  if (cmd.startsWith("S:")) {
    int firstColon = cmd.indexOf(':');
    int secondColon = cmd.indexOf(':', firstColon + 1);

    if (secondColon != -1) {
      String statusStr = cmd.substring(firstColon + 1, secondColon);
      String scoreStr = cmd.substring(secondColon + 1);

      int newStatus = statusStr.toInt();
      float newScore = scoreStr.toFloat();

      aiScore = newScore;
      lastHeartbeatTime = millis();
      setStatusLeds(newStatus);
    }
  }
}

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------
void setup() {
  // Initialize USB Serial at high-speed 115200 baud
  Serial.begin(115200);

  // Configure Analog Pins (ESP32 ADC is 12-bit: 0 - 4095)
  analogReadResolution(12);
  pinMode(PIN_VOLTAGE, INPUT);
  pinMode(PIN_CURRENT, INPUT);
  pinMode(PIN_SOLAR, INPUT);

  // Configure Digital Button Input
  pinMode(PIN_FAULT_BTN, INPUT);

  // Configure Status LEDs & Alert Buzzer
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  
  // Startup test chirp: Calibrated 2200 Hz tone on boot
  tone(PIN_BUZZER, 2200, 100);
  delay(130);
  noTone(PIN_BUZZER);
  digitalWrite(PIN_BUZZER, LOW);

  // Initial State: Green Active
  setStatusLeds(0);

  // Initialize I2C and OLED Display
  Wire.begin(OLED_SDA, OLED_SCL);
  if (display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    oledAvailable = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 20);
    display.println("GrydAI Edge Node");
    display.setCursor(10, 35);
    display.println("Initializing...");
    display.display();
    delay(500); // Brief splash screen delay during power-up
  }

  lastHeartbeatTime = millis();
}

// ----------------------------------------------------------------------------
// Main Loop (Strictly Non-Blocking)
// ----------------------------------------------------------------------------
void loop() {
  unsigned long currentMillis = millis();

  // 1. Process Incoming Reverse Serial Commands (Non-Blocking)
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      parseReverseCommand(incomingSerialBuffer);
      incomingSerialBuffer = "";
    } else if (c != '\r') {
      incomingSerialBuffer += c;
    }
  }

  // 2. Emit Telemetry Every 100ms (10 Hz - Contract 1)
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;

    // 8-sample oversampling to suppress contact wiper bounce and ADC thermal noise
    long vSum = 0;
    long iSum = 0;
    long sSum = 0;
    for (int k = 0; k < 8; k++) {
      vSum += analogRead(PIN_VOLTAGE);
      iSum += analogRead(PIN_CURRENT);
      sSum += analogRead(PIN_SOLAR);
    }
    cachedVRaw = vSum / 8;
    cachedIRaw = iSum / 8;
    cachedSolarRaw = sSum / 8;

    // Read catastrophic fault button (active HIGH with 390 Ohm pull-down)
    cachedFaultBtn = digitalRead(PIN_FAULT_BTN);

    // If catastrophic fault button is pressed physically, trip RED LED immediately
    if (cachedFaultBtn == HIGH) {
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_YELLOW, LOW);
      digitalWrite(PIN_LED_RED, HIGH);
      aiStatus = 2;
    }

    // Format Contract 1 JSON string
    // {"timestamp":123456,"v_raw":2048,"i_raw":2048,"fault_btn":0,"solar_ldr":4095}
    Serial.print("{\"timestamp\":");
    Serial.print(currentMillis / 1000);
    Serial.print(",\"v_raw\":");
    Serial.print(cachedVRaw);
    Serial.print(",\"i_raw\":");
    Serial.print(cachedIRaw);
    Serial.print(",\"fault_btn\":");
    Serial.print(cachedFaultBtn);
    Serial.print(",\"solar_ldr\":");
    Serial.print(cachedSolarRaw);
    Serial.println("}");
  }

  // 3. Refresh OLED Display Decoupled (~3 Hz / 350 ms)
  if (currentMillis - lastOledTime >= OLED_INTERVAL_MS) {
    lastOledTime = currentMillis;
    updateOledDisplay();
  }

  // 4. Fail-Safe Offline Keepalive Check
  // When backend heartbeat is not received, updateOledDisplay() manages autonomous local status.

  // 5. Critical Alert Buzzer: Softened 2200 Hz dual-chirp alarm pattern (-10% volume)
  if (aiStatus == 2 || cachedFaultBtn == HIGH) {
    unsigned long buzzerCycle = currentMillis % 1000;
    // Dual-chirp pattern: 0-75ms BEEP, 75-150ms SILENCE, 150-225ms BEEP, 225-1000ms SILENCE
    if ((buzzerCycle < 75) || (buzzerCycle >= 150 && buzzerCycle < 225)) {
      tone(PIN_BUZZER, 2200); // 2200 Hz softens acoustic volume by ~10% vs 2400 Hz peak
    } else {
      noTone(PIN_BUZZER);
      digitalWrite(PIN_BUZZER, LOW);
    }
  } else {
    noTone(PIN_BUZZER);
    digitalWrite(PIN_BUZZER, LOW);
  }
}
