#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <BH1750.h>

// ── WiFi & Firebase Config ────────────────────────────────────
const char* ssid     = "POCO F5";
const char* password = "12345678";
const String firebaseHost = "https://polyguard-iot-default-rtdb.asia-southeast1.firebasedatabase.app";
const String firebaseAuth = "AIzaSyD4Bzjd81Gr4tjT5P0ayh6QVKORRMj30aw";

// ── Hardware Config ───────────────────────────────────────────
#define RELAY_PUMP    D5
#define RELAY_FAN     D6
#define RELAY_LIGHTS  D7
#define RELAY_SHADE   D8

ESP8266WebServer server(80);
Adafruit_SHT31 sht30 = Adafruit_SHT31();
BH1750 lightMeter;
const int SOIL_PIN = A0;
WiFiClientSecure client;

// ── State & Provisioning ──────────────────────────────────────
String chipId;
String pairingOtp;
float temp, hum, lux;
int soil;
bool pumpOn = false, fanOn = false, lightsOn = false, shadeOn = false;

unsigned long lastTelemetryTime = 0;
unsigned long lastCloudPollTime = 0;

// ── Helpers ───────────────────────────────────────────────────
void applyRelay(uint8_t pin, bool state) {
  digitalWrite(pin, state ? LOW : HIGH);
}

void addCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin",  "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

String buildStateJson() {
  String json = "{";
  json += "\"waterPump\":"  + String(pumpOn   ? "true" : "false") + ",";
  json += "\"fan\":"        + String(fanOn    ? "true" : "false") + ",";
  json += "\"growLights\":" + String(lightsOn ? "true" : "false") + ",";
  json += "\"shadeNet\":"   + String(shadeOn  ? "true" : "false");
  json += "}";
  return json;
}

// ── Firebase Sync ─────────────────────────────────────────────
void registerDevice() {
  HTTPClient http;
  String path = firebaseHost + "/devices/" + chipId + "/status.json?auth=" + firebaseAuth;
  
  // Status includes IP, Online state, and the temporary Pairing OTP
  String json = "{";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"online\":true,";
  json += "\"otp\":\"" + pairingOtp + "\",";
  json += "\"lastSeen\":" + String(millis() / 1000);
  json += "}";

  http.begin(client, path);
  int httpCode = http.PUT(json);
  http.end();
  
  Serial.println("\n[CLOUD] Device registered successfully.");
}

void pushTelemetry() {
  HTTPClient http;
  String path = firebaseHost + "/polyhouse/readings.json?auth=" + firebaseAuth;
  String json = "{\"temperature\":" + String(temp,1) + ",\"humidity\":" + String(hum,1) + 
                ",\"lightIntensity\":" + String(lux,0) + ",\"soilMoisture\":" + String(soil) + "}";
  http.begin(client, path);
  http.PUT(json);
  http.end();
}

void fetchCommands() {
  HTTPClient http;
  String path = firebaseHost + "/polyhouse/controls.json?auth=" + firebaseAuth;
  http.begin(client, path);
  if (http.GET() == 200) {
    String p = http.getString();
    if (p.indexOf("\"waterPump\":1") != -1 && !pumpOn) { pumpOn = true; applyRelay(RELAY_PUMP, true); }
    if (p.indexOf("\"waterPump\":0") != -1 && pumpOn)  { pumpOn = false; applyRelay(RELAY_PUMP, false); }
    if (p.indexOf("\"fan\":1") != -1 && !fanOn) { fanOn = true; applyRelay(RELAY_FAN, true); }
    if (p.indexOf("\"fan\":0") != -1 && fanOn)  { fanOn = false; applyRelay(RELAY_FAN, false); }
    if (p.indexOf("\"growLights\":1") != -1 && !lightsOn) { lightsOn = true; applyRelay(RELAY_LIGHTS, true); }
    if (p.indexOf("\"growLights\":0") != -1 && lightsOn)  { lightsOn = false; applyRelay(RELAY_LIGHTS, false); }
    if (p.indexOf("\"shadeNet\":1") != -1 && !shadeOn) { shadeOn = true; applyRelay(RELAY_SHADE, true); }
    if (p.indexOf("\"shadeNet\":0") != -1 && shadeOn)  { shadeOn = false; applyRelay(RELAY_SHADE, false); }
  }
  http.end();
}

// ── Handlers ──────────────────────────────────────────────────
void handleControl() {
  addCORSHeaders();
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    if (body.indexOf("\"waterPump\":true")  != -1) { pumpOn = true; applyRelay(RELAY_PUMP, true); }
    if (body.indexOf("\"waterPump\":false") != -1) { pumpOn = false; applyRelay(RELAY_PUMP, false); }
    // ... repeat process for others
    
    // Sync to cloud immediately on local change
    HTTPClient http;
    http.begin(client, firebaseHost + "/polyhouse/controls.json?auth=" + firebaseAuth);
    http.PATCH("{\"waterPump\":" + String(pumpOn?1:0) + "}"); // etc
    http.end();
  }
  server.send(200, "application/json", buildStateJson());
}

// ── Setup ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  chipId = "PG-" + String(ESP.getChipId(), HEX);
  chipId.toUpperCase();
  
  // Generate a random 6-digit OTP for secure pairing
  randomSeed(analogRead(0) + ESP.getCycleCount());
  pairingOtp = String(random(100000, 999999));

  digitalWrite(RELAY_PUMP, HIGH); pinMode(RELAY_PUMP, OUTPUT);
  digitalWrite(RELAY_FAN, HIGH); pinMode(RELAY_FAN, OUTPUT);
  digitalWrite(RELAY_LIGHTS, HIGH); pinMode(RELAY_LIGHTS, OUTPUT);
  digitalWrite(RELAY_SHADE, HIGH); pinMode(RELAY_SHADE, OUTPUT);

  Wire.begin(D2, D1);
  sht30.begin(0x44);
  lightMeter.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }

  client.setInsecure();
  registerDevice();

  Serial.println("\n\n==============================");
  Serial.println("   POLYGUARD PROVISIONING     ");
  Serial.println("==============================");
  Serial.print("  DEVICE ID: "); Serial.println(chipId);
  Serial.print("  PAIRING OTP: "); Serial.println(pairingOtp);
  Serial.print("  IP ADDRESS: "); Serial.println(WiFi.localIP());
  Serial.println("==============================");
  Serial.println("Enter these in your Dashboard to Link.");

  server.on("/control", HTTP_POST, handleControl);
  server.begin();
}

void loop() {
  server.handleClient();
  
  if (millis() - lastTelemetryTime > 15000) {
    temp = sht30.readTemperature(); hum = sht30.readHumidity();
    lux = lightMeter.readLightLevel();
    soil = map(analogRead(SOIL_PIN), 800, 300, 0, 100);
    pushTelemetry();
    lastTelemetryTime = millis();
  }

  if (millis() - lastCloudPollTime > 5000) {
    fetchCommands();
    lastCloudPollTime = millis();
  }
}
