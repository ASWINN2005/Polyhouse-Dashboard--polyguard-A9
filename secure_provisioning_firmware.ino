// ─────────────────────────────────────────────────────────────────────────────
//  PolyGuard – ESP8266 Master Gateway V4.2
//  Features: Distributed AI, Persistent Offline Thresholds, Refined OLED
// ─────────────────────────────────────────────────────────────────────────────
#include <Adafruit_GFX.h>
#include <Adafruit_SHT31.h>
#include <Adafruit_SSD1306.h>
#include <BH1750.h>
#include <ESP8266WebServer.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <Wire.h>

#include <EEPROM.h>
#include <SoftwareSerial.h>

// ── Shared Protocol Struct (23 bytes) - EXACT MATCH WITH ESP32 ───────────────
struct __attribute__((packed)) SyncPacket {
  int16_t temp;  // temp * 10
  uint8_t hum;   // hum (0-100)
  int16_t lux;   // lux
  uint8_t soil;  // soil (0-100)
  uint8_t flags; // bit 0:auto, 1:pump, 2:fan, 3:light, 4:shade

  // ALL 12 THRESHOLDS PACKED
  uint8_t sMin, sMax;
  int16_t tOn, tOff;
  uint8_t hOn, hOff;
  int16_t lMin, lMax;
  int16_t tsOn, tsOff;
};

// ── Configuration ────────────────────────────────────────────────────────────
#define WIFI_SSID "ESP"
#define WIFI_PASSWORD "nayana123"
#define FIREBASE_HOST                                                          \
  "polyguard-iot-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "AIzaSyD4Bzjd81Gr4tjT5P0ayh6QVKORRMj30aw"
#define SOIL_PIN A0

// ── UART Communication ───────────────────────────────────────────────────────
// NodeMCU D5 (GPIO 14) -> ESP32 G16 (RX2)
// NodeMCU D6 (GPIO 12) -> ESP32 G17 (TX2)
SoftwareSerial espSerial(12, 14); // RX=D6, TX=D5

// ── Hardware Globals ─────────────────────────────────────────────────────────
Adafruit_SSD1306 display(128, 64, &Wire, -1);
FirebaseData fbData;
FirebaseAuth auth;
FirebaseConfig config;
ESP8266WebServer server(80);
Adafruit_SHT31 sht30;
BH1750 lightMeter;

// ── Global State ─────────────────────────────────────────────────────────────
String chipId, pairingOtp, basePath;
float tempVal = 0.0, humVal = 0.0, luxVal = 0.0;
int soilVal = 0;
bool pumpOn = false, fanOn = false, lightOn = false, shadeOn = false;
bool uartConnected = false;
int cloudLatency = 0;
unsigned long lastFast = 0, lastMed = 0, lastSlow = 0, lastOled = 0;
int oledPage = 0;

// ── Offline Threshold Cache (Pre-loaded with defaults) ───────────────────────
bool autoEnabled = false;
uint8_t sMin = 35, sMax = 60;
int16_t tOn = 300, tOff = 250; // 30.0C, 25.0C
uint8_t hOn = 80, hOff = 60;
int16_t lMin = 50, lMax = 200;
int16_t tsOn = 340, tsOff = 280; // 34.0C, 28.0C

struct Settings {
  uint32_t magic; // 0x50475634 (PGV4)
  bool autoEnabled;
  uint8_t sMin, sMax;
  int16_t tOn, tOff;
  uint8_t hOn, hOff;
  int16_t lMin, lMax;
  int16_t tsOn, tsOff;
} settings;

void saveSettings() {
  settings.magic = 0x50475634;
  settings.autoEnabled = autoEnabled;
  settings.sMin = sMin;
  settings.sMax = sMax;
  settings.tOn = tOn;
  settings.tOff = tOff;
  settings.hOn = hOn;
  settings.hOff = hOff;
  settings.lMin = lMin;
  settings.lMax = lMax;
  settings.tsOn = tsOn;
  settings.tsOff = tsOff;
  EEPROM.put(0, settings);
  EEPROM.commit();
  Serial.println(F("💾 Settings saved to EEPROM"));
}

void loadSettings() {
  EEPROM.get(0, settings);
  if (settings.magic == 0x50475634) {
    autoEnabled = settings.autoEnabled;
    sMin = settings.sMin;
    sMax = settings.sMax;
    tOn = settings.tOn;
    tOff = settings.tOff;
    hOn = settings.hOn;
    hOff = settings.hOff;
    lMin = settings.lMin;
    lMax = settings.lMax;
    tsOn = settings.tsOn;
    tsOff = settings.tsOff;
    Serial.println(F("✅ Settings loaded from EEPROM"));
  } else {
    Serial.println(F("⚠️ No valid settings in EEPROM, using defaults"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SYNC: Transmit Sensors + All Thresholds to ESP32 Brain via UART
// ─────────────────────────────────────────────────────────────────────────────
void syncToBrain() {
  SyncPacket p;
  p.temp = (int16_t)(tempVal * 10);
  p.hum = (uint8_t)humVal;
  p.lux = (int16_t)luxVal;
  p.soil = (uint8_t)soilVal;

  p.flags = 0;
  if (autoEnabled)
    p.flags |= (1 << 0);
  if (pumpOn)
    p.flags |= (1 << 1);
  if (fanOn)
    p.flags |= (1 << 2);
  if (lightOn)
    p.flags |= (1 << 3);
  if (shadeOn)
    p.flags |= (1 << 4);

  // Send Cached Thresholds (ESP32 works perfectly even if cloud fails)
  p.sMin = sMin;
  p.sMax = sMax;
  p.tOn = tOn;
  p.tOff = tOff;
  p.hOn = hOn;
  p.hOff = hOff;
  p.lMin = lMin;
  p.lMax = lMax;
  p.tsOn = tsOn;
  p.tsOff = tsOff;

  espSerial.write(0xAA); // Sync byte
  espSerial.write((uint8_t *)&p, sizeof(SyncPacket));
  uartConnected = true; // UART is connectionless, assume OK if we can write
}

// ─────────────────────────────────────────────────────────────────────────────
//  OLED: REFINED VISUALS
// ─────────────────────────────────────────────────────────────────────────────
void updateOLED() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  // Draw outer table frame
  display.drawRect(0, 0, 128, 64, SSD1306_WHITE);
  // Draw header separator
  display.drawLine(0, 12, 128, 12, SSD1306_WHITE);

  if (oledPage == 0) { // Page 1: POLYGUARD CONNECTIONS
    const char *title = "PolyGuard Connections";
    display.setCursor((128 - strlen(title) * 6) / 2, 3);
    display.print(title);

    display.setCursor(4, 16);
    display.printf("1.WiFi SSID: %s", WIFI_SSID);
    display.setCursor(4, 26);
    display.printf("2.WiFi Stat: %s",
                   WiFi.status() == WL_CONNECTED ? "CONN" : "DISC");
    display.setCursor(4, 36);
    display.printf("3.Cloud Spd: %dms", cloudLatency);
    display.setCursor(4, 46);
    display.printf("4.ESP32    : %s", uartConnected ? "CONN" : "FAIL");
  } else if (oledPage == 1) { // Page 2: PAIR TO DEVICE
    const char *title = "Pair to Device";
    display.setCursor((128 - strlen(title) * 6) / 2, 3);
    display.print(title);

    display.setCursor(4, 16);
    display.printf("1.Dev-ID: %s", chipId.c_str());
    display.setCursor(4, 26);
    display.printf("2.OTP   : %s", pairingOtp.c_str());
    display.setCursor(4, 36);
    display.printf("3.IP: %s", WiFi.localIP().toString().c_str());
    display.setCursor(4, 46);
    display.printf("4.WiFi Spd:%d ms", cloudLatency);
  } else if (oledPage == 2) { // Page 3: LIVE STATUS
    const char *title = "Sensors & Actuators";
    display.setCursor((128 - strlen(title) * 6) / 2, 3);
    display.print(title);

    display.setCursor(4, 16);
    display.printf("T:%.1f H:%d L:%d", tempVal, (int)humVal, (int)luxVal);
    display.setCursor(4, 25);
    display.printf("Soil:%d%% Mode:%s", soilVal, autoEnabled ? "AUTO" : "MAN");
    display.setCursor(4, 35);
    display.printf("PMP:%s FAN:%s", pumpOn ? "ON" : "OFF",
                   fanOn ? "ON" : "OFF");
    display.setCursor(4, 45);
    display.printf("LGT:%s SHD:%s", lightOn ? "ON" : "OFF",
                   shadeOn ? "OPEN" : "CLSD");
  } else { // Page 4: THRESHOLDS
    const char *title = "Thresholds";
    display.setCursor((128 - strlen(title) * 6) / 2, 3);
    display.print(title);

    display.setCursor(4, 16);
    display.printf("PumpOn Abv: %d%% S", sMin);
    display.setCursor(4, 26);
    display.printf("FanOn Abv: %dC,%d%%", tOn / 10, hOn);
    display.setCursor(4, 36);
    display.printf("LgtOn Abv: %d Lux", lMin);
    display.setCursor(4, 46);
    display.printf("ShdOp Abv: %dC Tmp", tsOn / 10);
  }

  // Page indicator in bottom right
  display.fillRect(106, 53, 22, 11, SSD1306_WHITE); // Highlight box
  display.setTextColor(SSD1306_BLACK);
  display.setCursor(109, 55);
  display.printf("%d/4", oledPage + 1);

  display.display();
}

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP & MAIN LOOP
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  espSerial.begin(9600);
  Wire.begin(D1, D2);
  EEPROM.begin(sizeof(Settings));
  loadSettings();
  syncToBrain(); // Ensure ESP32 gets loaded thresholds immediately
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);

  // ── CUSTOM BOOT SCREEN ───────────────────────────────────────────────────
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(10, 15);
  display.println(F("PolyGuard Booting Up"));
  display.setTextSize(1);
  display.setCursor(15, 35);
  display.println(F("Powered by Team A9"));
  display.display();
  delay(2000);

  // ── WIFI CONNECTING ────────────────────────────────────────────────────────
  display.clearDisplay();
  display.setCursor(0, 10);
  display.printf("WiFi: %s\nConnecting...", WIFI_SSID);
  display.display();

  chipId = "PG-" + String(ESP.getChipId(), HEX);
  chipId.toUpperCase();
  pairingOtp = String(random(100000, 999999));
  basePath = "/devices/" + chipId;

  sht30.begin(0x44);

  // BH1750 Setup with Error Handling
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println(F("BH1750 configured!"));
  } else {
    Serial.println(F("BH1750 error!"));
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
    delay(500);
    Serial.print(".");
    display.print(".");
    display.display();
    retry++;
  }

  // ── ESP32 LINK STATUS ──────────────────────────────────────────────────────
  display.clearDisplay();
  display.setCursor(0, 20);
  display.println(F("Connecting to:"));
  display.println(F("ESP32 WROOM..."));
  display.display();
  delay(1500);

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  display.clearDisplay();
  display.setCursor(15, 25);
  display.setTextSize(1);
  display.println(F("Successfully Booted!"));
  display.display();
  delay(1000);

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Online Status: Simple set, removed onDisconnect for compatibility
  Firebase.setBool(fbData, basePath + "/status/online", true);

  // CORS-Enabled Local API (Works locally instantly)
  server.on("/", []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String j = "{\"temperature\":" + String(tempVal, 1) +
               ",\"humidity\":" + String(humVal, 1) +
               ",\"light_lux\":" + String(luxVal, 0) +
               ",\"soil_moisture\":" + String(soilVal) +
               ",\"shade_net\":" + String(shadeOn ? "true" : "false") +
               ",\"auto\":" + String(autoEnabled ? "true" : "false") + "}";
    server.send(200, "application/json", j);
  });
  server.on("/state", []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String j = "{\"fan\":" + String(fanOn ? "true" : "false") +
               ",\"waterPump\":" + String(pumpOn ? "true" : "false") +
               ",\"growLights\":" + String(lightOn ? "true" : "false") +
               ",\"shadeNet\":" + String(shadeOn ? "true" : "false") + "}";
    server.send(200, "application/json", j);
  });
  server.on("/control", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });
  server.on("/control", HTTP_POST, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    String b = server.arg("plain");
    // Change states instantly, push to Firebase so Cloud doesn't overwrite it
    if (b.indexOf("\"waterPump\"") >= 0) {
      pumpOn = b.indexOf("\"waterPump\":true") >= 0;
      Firebase.setBool(fbData, basePath + "/controls/waterPump", pumpOn);
    }
    if (b.indexOf("\"fan\"") >= 0) {
      fanOn = b.indexOf("\"fan\":true") >= 0;
      Firebase.setBool(fbData, basePath + "/controls/fan", fanOn);
    }
    if (b.indexOf("\"growLights\"") >= 0) {
      lightOn = b.indexOf("\"growLights\":true") >= 0;
      Firebase.setBool(fbData, basePath + "/controls/growLights", lightOn);
    }
    if (b.indexOf("\"shadeNet\"") >= 0) {
      shadeOn = b.indexOf("\"shadeNet\":true") >= 0;
      Firebase.setBool(fbData, basePath + "/controls/shadeNet", shadeOn);
    }
    syncToBrain();
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });
  server.begin();
}

void loop() {
  server.handleClient();
  unsigned long now = millis();

  // OLED Refresh (Page 1: 10s, Pages 2-4: 15s)
  if (lastOled == 0) {
    updateOLED(); // Render initial page
    lastOled = now;
  } else {
    unsigned long oledDelay = (oledPage == 0) ? 10000 : 15000;
    if (now - lastOled >= oledDelay) {
      lastOled = now;
      oledPage = (oledPage + 1) % 4;
      updateOLED();
    }
  }

  // Actuator Acknowledgement Sync
  if (espSerial.available()) {
    char c = espSerial.read();
    if (c == 'S') {
      shadeOn = true;
      Firebase.setBool(fbData, basePath + "/controls/shadeNet", true);
      Serial.println(
          F("✅ ACK: Shade Net OPENED physically. Syncing to Cloud."));
    }
    if (c == 's') {
      shadeOn = false;
      Firebase.setBool(fbData, basePath + "/controls/shadeNet", false);
      Serial.println(
          F("✅ ACK: Shade Net CLOSED physically. Syncing to Cloud."));
    }
  }

  // Fast Cloud Sync (500ms) - Only pull controls from Dashboard if in MANUAL
  // mode
  if (!autoEnabled && now - lastFast >= 500) {
    lastFast = now;
    if (Firebase.getJSON(fbData, basePath + "/controls")) {
      FirebaseJsonData r;
      FirebaseJson *j = fbData.jsonObjectPtr();
      if (j->get(r, "fan"))
        fanOn = r.boolValue;
      if (j->get(r, "waterPump"))
        pumpOn = r.boolValue;
      if (j->get(r, "growLights"))
        lightOn = r.boolValue;
      if (j->get(r, "shadeNet"))
        shadeOn = r.boolValue;
      syncToBrain();
    }
  }

  // Medium Cloud Sync (5s) - Read Sensors & Push to Cloud
  if (now - lastMed >= 5000) {
    lastMed = now;
    tempVal = sht30.readTemperature();
    humVal = sht30.readHumidity();
    luxVal = lightMeter.readLightLevel();
    soilVal = constrain(map(analogRead(SOIL_PIN), 800, 200, 0, 100), 0, 100);

    unsigned long s = millis();
    FirebaseJson r;
    r.set("temperature", tempVal);
    r.set("humidity", humVal);
    r.set("lightIntensity", (int)luxVal);
    r.set("soilMoisture", soilVal);
    Firebase.setJSON(fbData, basePath + "/readings", r);
    cloudLatency = millis() - s; // Track network speed

    Firebase.setBool(fbData, basePath + "/status/online", true);
    Firebase.setString(fbData, basePath + "/status/otp", pairingOtp);
    syncToBrain(); // Ensure ESP32 always gets live data
  }

  // Medium-Fast Cloud Sync (5s) - Fetch ALL Thresholds for Dynamic Updating
  if (now - lastSlow >= 5000) {
    lastSlow = now;
    if (Firebase.getJSON(fbData, basePath + "/settings")) {
      FirebaseJsonData r;
      FirebaseJson *j = fbData.jsonObjectPtr();
      bool changed = false;

      if (j->get(r, "automationEnabled")) {
        if (autoEnabled != r.boolValue) {
          autoEnabled = r.boolValue;
          changed = true;
        }
      }

      if (j->get(r, "soilMoistureMin")) {
        if (sMin != r.intValue) {
          sMin = r.intValue;
          changed = true;
        }
      }
      if (j->get(r, "soilMoistureMax")) {
        if (sMax != r.intValue) {
          sMax = r.intValue;
          changed = true;
        }
      }

      if (j->get(r, "tempFanOn")) {
        int16_t val = (int16_t)(r.doubleValue * 10);
        if (tOn != val) {
          tOn = val;
          changed = true;
        }
      }
      if (j->get(r, "tempFanOff")) {
        int16_t val = (int16_t)(r.doubleValue * 10);
        if (tOff != val) {
          tOff = val;
          changed = true;
        }
      }

      if (j->get(r, "humidityFanOn")) {
        if (hOn != r.intValue) {
          hOn = r.intValue;
          changed = true;
        }
      }
      if (j->get(r, "humidityFanOff")) {
        if (hOff != r.intValue) {
          hOff = r.intValue;
          changed = true;
        }
      }

      if (j->get(r, "lightMin")) {
        if (lMin != r.intValue) {
          lMin = r.intValue;
          changed = true;
        }
      }
      if (j->get(r, "lightMax")) {
        if (lMax != r.intValue) {
          lMax = r.intValue;
          changed = true;
        }
      }

      if (j->get(r, "tempShadeOn")) {
        int16_t val = (int16_t)(r.doubleValue * 10);
        if (tsOn != val) {
          tsOn = val;
          changed = true;
        }
      }
      if (j->get(r, "tempShadeOff")) {
        int16_t val = (int16_t)(r.doubleValue * 10);
        if (tsOff != val) {
          tsOff = val;
          changed = true;
        }
      }

      if (changed) {
        saveSettings();
        syncToBrain(); // Pass new thresholds immediately to ESP32
      }
    }
  }

  // Serial status report (Table-like structure)
  static unsigned long lastSerialReport = 0;
  if (now - lastSerialReport >= 10000) {
    lastSerialReport = now;
    Serial.println(F(
        "\n╔══════════════════════════════════════════════════════════════╗"));
    Serial.printf("║ MASTER: %-12s | CLOUD: %-12s | MODE: %-10s ║\n",
                  chipId.c_str(),
                  Firebase.ready() ? "CONNECTED ✅" : "OFFLINE ❌",
                  autoEnabled ? "AUTO🤖" : "MANUAL🎮");
    Serial.println(
        F("╠══════════════════════════╦═══════════════════════════════════╣"));
    Serial.printf(
        "║ DEVICE INFO              ║ SYSTEM CONNECTIONS                ║\n");
    Serial.printf("║ ID  : %-18s ║ WiFi : %-13s (RSSI)   ║\n", chipId.c_str(),
                  WiFi.SSID());
    Serial.printf("║ IP  : %-18s ║ Speed: %4d ms            ║\n",
                  WiFi.localIP().toString().c_str(), cloudLatency);
    Serial.printf("║ OTP : %-18s ║ Brain: %-10s (UART)   ║\n",
                  pairingOtp.c_str(), uartConnected ? "OK ✅" : "FAIL ❌");
    Serial.println(
        F("╠══════════════════════════╬═══════════════════════════════════╣"));
    Serial.printf(
        "║ SENSOR READINGS          ║ ACTUATOR STATES                   ║\n");
    Serial.printf(
        "║ Temp : %4.1f C          ║ Pump  : %-4s                      ║\n",
        tempVal, pumpOn ? "ON" : "OFF");
    Serial.printf(
        "║ Hum  : %2d %%             ║ Fan   : %-4s                      ║\n",
        (int)humVal, fanOn ? "ON" : "OFF");
    Serial.printf(
        "║ Light: %5d Lux        ║ Light : %-4s                      ║\n",
        (int)luxVal, lightOn ? "ON" : "OFF");
    Serial.printf(
        "║ Soil : %2d %%             ║ Shade : %-4s                      ║\n",
        soilVal, shadeOn ? "OPEN" : "CLSD");
    Serial.println(
        F("╠══════════════════════════╩═══════════════════════════════════╣"));
    Serial.println(
        F("║ AUTOMATION THRESHOLDS                                        ║"));
    Serial.printf(
        "║ Pump On Above  : %2d %% Soil Moisture                       ║\n",
        sMin);
    Serial.printf(
        "║ Fan On Above   : %2d C Temp / %2d %% Hum                   ║\n",
        tOn / 10, hOn);
    Serial.printf(
        "║ Lights On Above: %5d Lux                                 ║\n", lMin);
    Serial.printf(
        "║ Shade Open Over: %2d C Temp                              ║\n",
        tsOn / 10);
    Serial.println(
        F("╚══════════════════════════════════════════════════════════════╝"));
  }
}
