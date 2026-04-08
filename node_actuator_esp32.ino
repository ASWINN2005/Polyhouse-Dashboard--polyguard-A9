// ── Shared Protocol Struct (23 bytes) ─────────────────────────────────────────
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

#define DIST_BOUNDARY 10.0
#define MOTOR_STEPS_ACTION 12288 // Exactly 3 full rotations
#define STEP_DELAY_MS 3 // Optimal torque for 28BYJ-48

// ── Manual Stepper Driver (8-state Half-Step) ────────────────────────────────
const int stepsArray[8][4] = {
  {1, 0, 0, 0}, {1, 1, 0, 0}, {0, 1, 0, 0}, {0, 1, 1, 0},
  {0, 0, 1, 0}, {0, 0, 1, 1}, {0, 0, 0, 1}, {1, 0, 0, 1}
};

void writeStep(int state) {
  digitalWrite(IN1, stepsArray[state][0]);
  digitalWrite(IN2, (IN2 == 14) ? stepsArray[state][1] : 0); // Safe check
  digitalWrite(IN3, stepsArray[state][2]);
  digitalWrite(IN4, stepsArray[state][3]);
}

// Fixed writeStep to actually use the pins correctly
void writeStepPins(int state) {
  digitalWrite(IN1, stepsArray[state][0]);
  digitalWrite(IN2, stepsArray[state][1]);
  digitalWrite(IN3, stepsArray[state][2]);
  digitalWrite(IN4, stepsArray[state][3]);
}

void stepManual(int steps) {
  static int currentState = 0;
  for (int i = 0; i < abs(steps); i++) {
    if (steps > 0) { // CW: 0->7
       currentState++;
       if (currentState > 7) currentState = 0;
    } else { // CCW: 7->0
       currentState--;
       if (currentState < 0) currentState = 7;
    }
    writeStepPins(currentState);
    delay(STEP_DELAY_MS); // Speed control
  }
}

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

// Direction: CW is Opening (Iter 0-7), CCW is Closing (Iter 7-0)

int getDistance() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH, 30000);
  float cm = (dur * 0.034 / 2);
  
  // Boundary Error Handling: If sensor reads ≤ 0 or > 400 cm, return 999 ("Open")
  if (cm <= 0 || cm > 400) return 999;
  return (int)cm;
}

void moveShade(bool open) {
  int d = getDistance();
  
  // Failsafe: If sensor fails (999), do not move to avoid mechanical damage
  if (d == 999) {
    Serial.println(F("⚠️ SHADE ERROR: Sensor Range/Fail (999). Movement aborted."));
    return;
  }

  // Ultrasonic Distance Logic: "Closed" < DIST_BOUNDARY, "Open" >= DIST_BOUNDARY
  if (open) { // OPEN requested
    if (d >= DIST_BOUNDARY) { 
      Serial.printf("ℹ️ SHADE: Already OPEN (dist: %d cm >= %.1f). No move needed.\n", d, DIST_BOUNDARY);
      return;
    }
    Serial.printf("🚀 SHADE: Moving to OPEN (dist: %d cm)...\n", d);
    stepManual(MOTOR_STEPS_ACTION); // Opening: CW (Positive)
    Serial2.write('S'); // ACK: OPEN
  } else { // CLOSE requested
    if (d < DIST_BOUNDARY) { 
      Serial.printf("ℹ️ SHADE: Already CLOSED (dist: %d cm < %.1f). No move needed.\n", d, DIST_BOUNDARY);
      return;
    }
    Serial.printf("🚀 SHADE: Moving to CLOSED (dist: %d cm)...\n", d);
    stepManual(-MOTOR_STEPS_ACTION); // Closing: CCW (Negative)
    Serial2.write('s'); // ACK: CLOSED
  }
  
  // Post-move cleanup
  digitalWrite(IN1,LOW); digitalWrite(IN2,LOW); digitalWrite(IN3,LOW); digitalWrite(IN4,LOW);
  
  // ⚡ CRITICAL: Flush stale UART data that arrived during the move
  while (Serial2.available()) Serial2.read(); 
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI BRAIN: DISTRIBUTED HYSTERESIS ENGINE
// ─────────────────────────────────────────────────────────────────────────────
void runLogic() {
  // 1. Water Pump
  if (pkt.soil < pkt.sMin) pumpOn = true;
  else if (pkt.soil > pkt.sMax) pumpOn = false;

  // 2. Fan (Temp or Humidity) - Using scaled comparison
  if (pkt.temp > pkt.tOn || pkt.hum > pkt.hOn) fanOn = true;
  else if (pkt.temp < pkt.tOff && pkt.hum < pkt.hOff) fanOn = false;

  // 3. Grow Lights
  if (pkt.lux < pkt.lMin) lightOn = true;
  else if (pkt.lux > pkt.lMax) lightOn = false;

  // 4. Shade Net (ONLY Temperature based)
  // Logic: Close (Shade) when Hot, Open (Retract) when Cool
  if (pkt.temp > pkt.tsOn) targetShadeOpen = false; // Hot = Close Shade
  else if (pkt.temp < pkt.tsOff) targetShadeOpen = true; // Cool = Open Shade
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
  
  // Initialize Stepper Pins as OUTPUT
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT); 
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);

  Serial.println(F("🚀 ESP32 BRAIN V5.1 (PIN-INIT FIX) READY."));
  
  // Initial Position Check
  int initialDist = getDistance();
  if (initialDist != 999) {
    currentShadeOpen = (initialDist > 15);
    Serial.printf("🛰️ SHADE INITIAL: %s (dist: %d cm)\n", currentShadeOpen?"OPEN":"CLSD", initialDist);
  }
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
    int liveDist = getDistance();
    Serial.printf(     "║ Temp : %4.1f C          ║ Pump  : %-4s                      ║\n", pkt.temp/10.0, pumpOn?"ON":"OFF");
    Serial.printf(     "║ Hum  : %2d %%             ║ Fan   : %-4s                      ║\n", pkt.hum, fanOn?"ON":"OFF");
    Serial.printf(     "║ Light: %5d Lux        ║ Light : %-4s                      ║\n", pkt.lux, lightOn?"ON":"OFF");
    Serial.printf(     "║ Soil : %2d %%             ║ Shade : %-4s (%s)           ║\n", pkt.soil, currentShadeOpen?"OPEN":"CLSD", currentShadeOpen?"RETRACT":"CLOSED");
    Serial.printf(     "║ Dist : %3d cm          ║ Boundary: %2.1f cm (%s)      ║\n", liveDist, DIST_BOUNDARY, (liveDist >= DIST_BOUNDARY)?"OPEN":"CLOSED");
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
