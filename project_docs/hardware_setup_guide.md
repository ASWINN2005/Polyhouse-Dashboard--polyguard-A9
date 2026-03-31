# PolyGuard — Instant Hybrid Firmware Setup

This guide covers the advanced **Instant Cloud** firmware using the `FirebaseESP8266` library. This version supports real-time command streaming (no polling delay) and a local web server for direct control.

## 🏗️ Hardware Architecture (Direct Pin)

| Actuator / Sensor | NodeMCU Pin | Dashboard Key |
|---|---|---|
| **Water Pump** | **D5** | `waterPump` |
| **Ventilation Fan** | **D6** | `fan` |
| **Grow Lights** | **D7** | `growLights` |
| **Shade Net (Relay)** | **D8** | `shadeNet` |
| **Soil Moisture** | **A0** | `soilMoisture` |
| **I2C SCL** | **D1** | (SHT31, BH1750) |
| **I2C SDA** | **D2** | (SHT31, BH1750) |

---

## 💾 Firebase Realtime Database (RTDB) Schema

To ensure perfect sync between the dashboard and hardware, configure your RTDB with this structure:

### 1. Telemetry Path: `/polyhouse/readings`
*   `temperature` (float): Live air temperature.
*   `humidity` (float): Live air humidity.
*   `lightIntensity` (int): Live lux measurement.
*   `soilMoisture` (int): Live moisture percent (0-100).
*   `soilPH` (float): pH level (Default: 6.5).
*   `co2` (int): PPM (Default: 400).
*   `npk` (string): Format `"N:P:K"` (e.g. `"20:15:25"`).

### 2. Control Path: `/polyhouse/controls`
*   `waterPump` (0/1): Pump relay state.
*   `fan` (0/1): Ventilation fan state.
*   `growLights` (0/1): Light relay state.
*   `shadeNet` (0/1): Shutter motor/relay state.

### 3. Settings Path: `/polyhouse/settings`
*   `automationEnabled` (bool): Master Auto-AI toggle.
*   `tempFanOn` (float): Threshold to activate the fan.
*   `soilMoistureMin` (float): Threshold to start the pump.
*   `lightMin` (float): Threshold for grow lights.

---

## 💻 Hybrid Firmware (Instant Sync)

> [!IMPORTANT]
> **Required Libraries**:
> 1. `Firebase ESP8266 Client` by Mobizt
> 2. `Adafruit SHT31`
> 3. `BH1750` by Christopher Laws
> 4. `Adafruit SSD1306` + `Adafruit GFX` (Optional for OLED)

```cpp
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <BH1750.h>

// ── WiFi & Firebase Setup ─────────────────────────────────────
#define WIFI_SSID "POCO F5"
#define WIFI_PASSWORD "12345678"
#define FIREBASE_HOST "polyguard-iot-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "AIzaSyD4Bzjd81Gr4tjT5P0ayh6QVKORRMj30aw"

// ── Relay Pins ────────────────────────────────────────────────
#define RELAY_PUMP    D5
#define RELAY_FAN     D6
#define RELAY_LIGHTS  D7
#define RELAY_SHADE   D8

// ── Globals ───────────────────────────────────────────────────
FirebaseData fbData;
FirebaseData fbStream; 
FirebaseAuth auth;
FirebaseConfig config;

ESP8266WebServer server(80);
Adafruit_SHT31 sht30 = Adafruit_SHT31();
BH1750 lightMeter;
const int SOIL_PIN = A0;

String chipId;
String pairingOtp;
float temp, hum, lux;
int soil;
bool pumpOn = false, fanOn = false, lightsOn = false, shadeOn = false;

unsigned long lastTelemetry = 0;
unsigned long lastStatusUpdate = 0;

// ── Helpers ───────────────────────────────────────────────────
void applyRelay(uint8_t pin, bool state) {
  digitalWrite(pin, state ? LOW : HIGH); // Active-Low Relay
}

void updateLocalState(String key, bool val) {
  if (key == "/waterPump")      { pumpOn = val;   applyRelay(RELAY_PUMP,   val); }
  else if (key == "/fan")       { fanOn = val;    applyRelay(RELAY_FAN,    val); }
  else if (key == "/growLights") { lightsOn = val; applyRelay(RELAY_LIGHTS, val); }
  else if (key == "/shadeNet")   { shadeOn = val;  applyRelay(RELAY_SHADE,  val); }
}

// ── Stream Callback (Instant Cloud Commands) ──────────────────
void streamCallback(StreamData data) {
  String path = data.dataPath();
  String type = data.dataType();
  bool val = false;
  
  // Debug Logging - Critical for finding the Cloud-to-Hardware mismatch
  Serial.print("[STREAM] Path: "); Serial.print(path);
  Serial.print(" | Type: "); Serial.print(type);

  if (type == "boolean") {
    val = data.boolData();
  } else if (type == "int") {
    val = (data.intData() == 1);
  } else if (type == "string") {
    String s = data.stringData();
    val = (s == "true" || s == "1" || s == "ON");
  }

  Serial.print(" | Value: "); Serial.println(val ? "ON" : "OFF");

  // Resilient Path Matching (handles "/waterPump" or "waterPump")
  if (path.indexOf("waterPump")  != -1) updateLocalState("/waterPump", val);
  else if (path.indexOf("fan")   != -1) updateLocalState("/fan", val);
  else if (path.indexOf("lights")!= -1) updateLocalState("/growLights", val);
  else if (path.indexOf("shade") != -1) updateLocalState("/shadeNet", val);
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) Serial.println("[STREAM] Refreshing connection...");
}

// ── Local Web Server Handlers ──────────────────────────────────
void handleRoot() {
  String json = "{";
  json += "\"temperature\":" + String(temp, 1) + ",";
  json += "\"humidity\":" + String(hum, 1) + ",";
  json += "\"light_lux\":" + String(lux, 0) + ",";
  json += "\"soil_moisture\":" + String(soil);
  json += "}";
  server.send(200, "application/json", json);
}

void handleControl() {
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    Serial.println("[LOCAL] Command: " + body);
    
    if (body.indexOf("\"waterPump\":true")  != -1) updateLocalState("/waterPump", true);
    if (body.indexOf("\"waterPump\":false") != -1) updateLocalState("/waterPump", false);
    if (body.indexOf("\"fan\":true")        != -1) updateLocalState("/fan", true);
    if (body.indexOf("\"fan\":false")       != -1) updateLocalState("/fan", false);
    if (body.indexOf("\"growLights\":true") != -1) updateLocalState("/growLights", true);
    if (body.indexOf("\"growLights\":false")!= -1) updateLocalState("/growLights", false);
    if (body.indexOf("\"shadeNet\":true")   != -1) updateLocalState("/shadeNet", true);
    if (body.indexOf("\"shadeNet\":false")  != -1) updateLocalState("/shadeNet", false);

    // Sync back to cloud
    FirebaseJson controls;
    controls.set("waterPump", pumpOn ? 1 : 0);
    controls.set("fan", fanOn ? 1 : 0);
    controls.set("growLights", lightsOn ? 1 : 0);
    controls.set("shadeNet", shadeOn ? 1 : 0);
    Firebase.setJSON(fbData, "/polyhouse/controls", controls);
  }
  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

// ── SETUP ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  digitalWrite(RELAY_PUMP, HIGH); pinMode(RELAY_PUMP, OUTPUT);
  digitalWrite(RELAY_FAN, HIGH);  pinMode(RELAY_FAN, OUTPUT);
  digitalWrite(RELAY_LIGHTS, HIGH); pinMode(RELAY_LIGHTS, OUTPUT);
  digitalWrite(RELAY_SHADE, HIGH); pinMode(RELAY_SHADE, OUTPUT);

  chipId = "PG-" + String(ESP.getChipId(), HEX);
  chipId.toUpperCase();

  randomSeed(analogRead(0) + ESP.getCycleCount());
  pairingOtp = String(random(100000, 999999));

  Wire.begin(D2, D1);
  sht30.begin(0x44);
  lightMeter.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected!");

  MDNS.begin("polyguard-" + String(ESP.getChipId(), HEX));

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (!Firebase.beginStream(fbStream, "/polyhouse/controls")) {
    Serial.println("Stream Error: " + fbStream.errorReason());
  }
  Firebase.setStreamCallback(fbStream, streamCallback, streamTimeoutCallback);

  FirebaseJson status;
  status.set("ip", WiFi.localIP().toString());
  status.set("online", true);
  status.set("otp", pairingOtp);
  status.set("lastSeen", (int)(millis() / 1000));
  Firebase.setJSON(fbData, "/devices/" + chipId + "/status", status);

  server.on("/", HTTP_GET, handleRoot);
  server.on("/control", HTTP_POST, handleControl);
  server.begin();

  Serial.println("\n==============================");
  Serial.println("   POLYGUARD HYBRID FIRMWARE  ");
  Serial.print("   DEVICE ID: "); Serial.println(chipId);
  Serial.print("   PAIRING OTP: "); Serial.println(pairingOtp);
  Serial.println("==============================\n");
}

// ── LOOP ──────────────────────────────────────────────────────
void loop() {
  server.handleClient();
  MDNS.update();

  // 1. Push Telemetry every 3 seconds for smooth dashboard charts
  if (millis() - lastTelemetry >= 3000) {
    temp = sht30.readTemperature();
    hum = sht30.readHumidity();
    lux = lightMeter.readLightLevel();
    soil = map(analogRead(SOIL_PIN), 800, 200, 0, 100);
    soil = constrain(soil, 0, 100);

    FirebaseJson readings;
    readings.set("temperature", temp);
    readings.set("humidity", hum);
    readings.set("lightIntensity", (int)lux);
    readings.set("soilMoisture", soil);
    readings.set("lastUpdate", (int)(millis() / 1000));

    Firebase.setJSON(fbData, "/polyhouse/readings", readings);
    lastTelemetry = millis();
  }

  // 2. Heartbeat status update (every 1 minute)
  if (millis() - lastStatusUpdate > 60000) {
     Firebase.setBool(fbData, "/devices/" + chipId + "/status/online", true);
     Firebase.setInt(fbData, "/devices/" + chipId + "/status/lastSeen", (int)(millis() / 1000));
     lastStatusUpdate = millis();
  }

  // 3. Periodic System Status Dashboard (every 10 seconds)
  static unsigned long lastDashboard = 0;
  if (millis() - lastDashboard >= 10000) {
    Serial.println("\n--- 🛠️ POLYGUARD SYSTEM DASHBOARD ---");
    Serial.print("   DEVICE ID   : "); Serial.println(chipId);
    Serial.print("   PAIRING OTP : "); Serial.println(pairingOtp);
    Serial.print("   LOCAL IP    : "); Serial.println(WiFi.localIP());
    Serial.print("   FIREBASE    : "); Serial.println(Firebase.ready() ? "CONNECTED ✅" : "CONNECTING... ⏳");
    
    Serial.println("\n   >> ACTUATORS <<");
    Serial.print("   Pump: ");   Serial.print(pumpOn   ? " [ ON ]  " : " [ OFF ] ");
    Serial.print(" Fan: ");    Serial.print(fanOn    ? " [ ON ]  " : " [ OFF ] ");
    Serial.print(" Lights: "); Serial.print(lightsOn ? " [ ON ]  " : " [ OFF ] ");
    Serial.print(" Shade: ");  Serial.println(shadeOn  ? " [ OPEN ] " : " [ CLOSED ]");

    Serial.println("\n   >> SENSORS <<");
    Serial.print("   Temp: ");   Serial.print(temp, 1);   Serial.print("°C | Hum: "); Serial.print(hum, 1); Serial.println("%");
    Serial.print("   Lux: ");    Serial.print(lux, 0);    Serial.print(" lx | Soil: "); Serial.print(soil);   Serial.println("%");
    Serial.println("-------------------------------------\n");
    lastDashboard = millis();
  }
}
```
