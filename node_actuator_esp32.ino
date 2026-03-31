#include <Stepper.h>

// ── Shared Protocol Struct (29 bytes) ─────────────────────────────────────────
struct __attribute__((packed)) SyncPacket {
  int16_t temp;      // scaled by 10
  uint8_t hum;       // 0-100
  int16_t lux;
  uint8_t soil;      // 0-100
  uint8_t flags;     // bit 0:auto, 1:pump, 2:fan, 3:light, 4:shade
  uint8_t sMin, sMax;
  int16_t tOn, tOff;
  uint8_t hOn, hOff;
  int16_t lMin, lMax;
  int16_t tsOn, tsOff;
};

SyncPacket pkt;

// ── Pin Assignments ──────────────────────────────────────────────────────────
#define RELAY_PUMP     32
#define RELAY_FAN      22
#define RELAY_LIGHTS   23
#define TRIG_PIN       25
#define ECHO_PIN       26
#define IN1            27
#define IN2            14
#define IN3            12
#define IN4            13
#define RX2            16
#define TX2            17
Stepper shadeStepper(2048, IN1, IN3, IN2, IN4);

// ── State Variables ──────────────────────────────────────────────────────────
bool pumpOn = false, fanOn = false, lightOn = false, targetShadeOpen = false;
bool currentShadeOpen = false;
unsigned long lastPacket = 0, lastSerial = 0;

// ─────────────────────────────────────────────────────────────────────────────
//  ACTUATOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────
void applyRelay(uint8_t pin, bool state) {
  digitalWrite(pin, state ? LOW : HIGH); // Active LOW relays
}

int getDistance() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH, 30000);
  return (dur == 0) ? 999 : (int)(dur * 0.034 / 2);
}

void moveShade(bool open) {
  int d = getDistance();
  if (open) { // OPEN: if distance > 15, we assume it's already retracted or out of way
    if (d > 15 && d != 999) return;
    shadeStepper.step(9216); // 4.5 rotations
  } else { // CLOSE: if distance < 10, we assume it's reached the end
    if (d < 10 && d > 0) return;
    shadeStepper.step(-9216);
  }
  // Turn off stepper coils to prevent heat
  digitalWrite(IN1,LOW); digitalWrite(IN2,LOW); digitalWrite(IN3,LOW); digitalWrite(IN4,LOW);
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI BRAIN: DISTRIBUTED HYSTERESIS ENGINE
// ─────────────────────────────────────────────────────────────────────────────
void runLogic() {
  // 1. Water Pump
  if (pkt.soil < pkt.sMin) pumpOn = true;
  else if (pkt.soil > pkt.sMax) pumpOn = false;

  // 2. Fan (Temp or Humidity) - Using scaled comparison
  if (pkt.temp > pkt.tOn || (pkt.hum * 10) > (pkt.hOn * 10)) fanOn = true;
  else if (pkt.temp < pkt.tOff && (pkt.hum * 10) < (pkt.hOff * 10)) fanOn = false;

  // 3. Grow Lights
  if (pkt.lux < pkt.lMin) lightOn = true;
  else if (pkt.lux > pkt.lMax) lightOn = false;

  // 4. Shade Net (ONLY Temperature based)
  if (pkt.temp > pkt.tsOn) targetShadeOpen = true;
  else if (pkt.temp < pkt.tsOff) targetShadeOpen = false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  UART RECEIVE LOGIC
// ─────────────────────────────────────────────────────────────────────────────
void handleSerial() {
  while (Serial2.available() > sizeof(SyncPacket)) {
    if (Serial2.read() == 0xAA) {
      Serial2.readBytes((uint8_t*)&pkt, sizeof(SyncPacket));
      lastPacket = millis();

      // If Manual Mode (bit 0 is 0), override with cloud bits
      if (!(pkt.flags & (1 << 0))) {
        pumpOn = (pkt.flags & (1 << 1));
        fanOn  = (pkt.flags & (1 << 2));
        lightOn = (pkt.flags & (1 << 3));
        targetShadeOpen = (pkt.flags & (1 << 4));
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX2, TX2);
  
  pinMode(RELAY_PUMP, OUTPUT); applyRelay(RELAY_PUMP, false);
  pinMode(RELAY_FAN, OUTPUT); applyRelay(RELAY_FAN, false);
  pinMode(RELAY_LIGHTS, OUTPUT); applyRelay(RELAY_LIGHTS, false);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  shadeStepper.setSpeed(12);

  Serial.println(F("🚀 ESP32 BRAIN V4.4 (UART) READY."));
}

void loop() {
  handleSerial();
  bool isAuto = (pkt.flags & (1 << 0));
  if (isAuto) runLogic();

  applyRelay(RELAY_PUMP, pumpOn);
  applyRelay(RELAY_FAN, fanOn);
  applyRelay(RELAY_LIGHTS, lightOn);

  if (targetShadeOpen != currentShadeOpen) {
    moveShade(targetShadeOpen);
    currentShadeOpen = targetShadeOpen;
  }

  if (millis() - lastSerial >= 5000) {
    lastSerial = millis();
    bool linked = (millis() - lastPacket < 10000);
    Serial.println(F("\n╔══════════════════════════════════════════════════════════════╗"));
    Serial.printf(     "║ BRAIN: %-13s | LINK: %-13s | MODE: %-10s ║\n", "ESP32 WROOM", linked?"CONNECTED ✅":"TIMEOUT ❌", isAuto?"AUTO🤖":"MANUAL🎮");
    Serial.println(F(  "╠══════════════════════════╦═══════════════════════════════════╣"));
    Serial.printf(     "║ LIVE SENSORS             ║ LIVE ACTUATORS & POSITIONS        ║\n");
    Serial.printf(     "║ Temp : %4.1f C          ║ Pump  : %-4s                      ║\n", pkt.temp/10.0, pumpOn?"ON":"OFF");
    Serial.printf(     "║ Hum  : %2d %%             ║ Fan   : %-4s                      ║\n", pkt.hum, fanOn?"ON":"OFF");
    Serial.printf(     "║ Light: %5d Lux        ║ Light : %-4s                      ║\n", pkt.lux, lightOn?"ON":"OFF");
    Serial.printf(     "║ Soil : %2d %%             ║ Shade : %-4s (%s)           ║\n", pkt.soil, currentShadeOpen?"OPEN":"CLSD", currentShadeOpen?"RETRACT":"CLOSED");
    Serial.println(F(  "╠══════════════════════════╩═══════════════════════════════════╣"));
    Serial.println(F(  "║ AUTOMATION THRESHOLDS & CONDITIONS                           ║"));
    Serial.printf(     "║ SOIL : %2d%% (MIN) - %2d%% (MAX)                             ║\n", pkt.sMin, pkt.sMax);
    Serial.printf(     "║ TEMP : %2d C (ON)  - %2d C (OFF)                             ║\n", pkt.tOn/10, pkt.tOff/10);
    Serial.printf(     "║ HUM  : %2d%% (ON)  - %2d%% (OFF)                             ║\n", pkt.hOn, pkt.hOff);
    Serial.printf(     "║ LIGHT: %5d (MIN) - %5d (MAX)                             ║\n", pkt.lMin, pkt.lMax);
    Serial.printf(     "║ SHADE: %2d C (OPEN) - %2d C (CLOSE)                          ║\n", pkt.tsOn/10, pkt.tsOff/10);
    Serial.println(F(  "╚══════════════════════════════════════════════════════════════╝"));
  }
  delay(20);
}
