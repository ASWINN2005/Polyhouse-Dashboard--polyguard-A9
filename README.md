<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white" alt="C++" />
  <img src="https://img.shields.io/badge/-Arduino-00979D?style=for-the-badge&logo=Arduino&logoColor=white" alt="Arduino" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  
  <h1>🌿 PolyGuard</h1>
  <p><strong>Intelligent Dual-Node Precision Agriculture & Local Edge Automation</strong></p>
</div>

---

**PolyGuard** is a state-of-the-art, entirely custom-built intelligent Polyhouse management system. Moving beyond standard single-board IoT architectures, PolyGuard employs a **Master/Worker dual-node computing framework**, ensuring that cloud telemetry and heavy-duty motor actuation are physically decoupled. 

By pushing intensive automation hysteresis loops to the physical edge, the PolyHouse reacts to environmental danger instantly (in under a millisecond) regardless of backend Cloud latency, while simultaneously broadcasting live telemetry to a high-speed React web dashboard.

## 📑 Table of Contents
1. [Core Features & Innovations](#1-core-features--innovations)
2. [Hardware Integration Stack](#2-hardware-integration-stack)
3. [Software & Frontend Stack](#3-software--frontend-stack)
4. [Advanced Firmware Protocols](#4-advanced-firmware-protocols-the-uart-bridge)
5. [The Local AI & Chatbot Engine](#5-the-local-ai--chatbot-engine)
6. [Dashboard Security & 2FA](#6-dashboard-security--2fa)
7. [Installation & Deployment](#7-installation--deployment)
8. [Hardware Flashing Guide](#8-hardware-flashing-guide)

---

## 1. Core Features & Innovations
*   **Decoupled Dual-Node Execution**: Physical safety relies on an ESP32 WROOM, while cloud-syncing relies on a separate NodeMCU V3.
*   **Zero-Latency Hysteresis**: Temperature, Moisture, and Light parameters are computed physically on the actuator node, decoupling critical crop survival from local Wi-Fi outages.
*   **Serverless AI Agronomist**: An embedded, completely serverless React AI engine that detects physical hardware breaches, tracks manual/auto modes, initiates a 5-minute delayed notification watchdog, and features a fuzzy-matching NLP chatbot to execute remote hardware commands (e.g., *"Deploy shade net"*).
*   **Ultrasonic Stepper Limit Switches**: Highly intelligent Shade Net retraction sequence driven by an HC-SR04 sonar sensor that calculates physical clearance limits under milliseconds to halt stepper coil thermal runway.
*   **Physical 2FA Security**: Secures cloud API pairing by requiring the PolyHouse owner to physically read a locally-generated `ChipID` and `OTP` code straight from the Polyhouse OLED screen.

---

## 2. Hardware Integration Stack

### The Master Sensor Node (NodeMCU V3 - ESP8266)
The Master node acts as the eyes and ears of the Polyhouse, dedicated entirely to fetching high-precision inputs and pushing them to tracking databases.
- **`SHT-31`**: I2C high-precision Temperature & Humidity.
- **`BH1750`**: I2C calibrated ambient Light Intensity (Lux).
- **`Capacitive Soil Moisture`**: Polled via the Analog `A0` pin.
- **`128x64 SSD1306 OLED`**: I2C physical diagnostic interface actively rendering 4 distinct pages (Connections, Pairing 2FA, Live Status, Local Memory Thresholds).

### The Worker Actuator Node (ESP32 WROOM)
The Worker node receives targets from the Master via a dedicated wire and executes heavy power switching for high-voltage and stepper hardware.
- **`Relay 1 (Pin 22)`**: Exhaust Fan switching.
- **`Relay 2 (Pin 32)`**: Water Irrigation Pump switching.
- **`Relay 3 (Pin 23)`**: Photosynthesis Grow Lights switching.
- **`Stepper Motor Driver`**: Deploying the ceiling Shade Net via pins `IN1-IN4`.
- **`HC-SR04 Ultrasonic Sensor`**: Safety limit switch tied to the Stepper Motor, pinging distance locally via `TRIG 25` and `ECHO 26` to safely stop physical obstruction.

---

## 3. Software & Frontend Stack
*   **Frontend Framework**: `React.js (v18)`
*   **Build Tool**: `Vite` — Chosen for its uncompromised compiling speed and Hot Module Replacement (HMR).
*   **Type Safety**: `TypeScript` — Enforces strict `SensorData` and `ActuatorState` payloads, completely eliminating backend parsing errors.
*   **Styling**: `Tailwind CSS` — Utility-first framework providing seamless glassmorphism and LocalStorage-backed Dark Mode.
*   **External APIs**: `OpenWeatherMap / Geo APIs` (correlating internal micro-climates against external macro-weather).
*   **Time-Series Plotting**: `Recharts` module.
*   **Cloud Operations**: `Google Firebase Realtime Database` (Sub-100ms bidirectional JSON data mapping) & `Firebase Auth`.

---

## 4. Advanced Firmware Protocols (The UART Bridge)
Rather than formatting inefficient, heavy JSON text across external servers, the NodeMCU packages all telemetry into a mathematically precise **29-byte C++ Struct** named the `SyncPacket`. 

This tight memory block contains formatted fixed-point integers (`temp` * 10), raw 8-bit soil registers, bit-shifted `flags` (Automation Enabled, Manual Fan States), and all 12 configurable Threshold Limits extracted from Firebase.

It fires a literal `0xAA` header byte followed immediately by the struct stream over 9600-baud SoftwareSerial UART (NodeMCU pins `D5/D6` to ESP32 pins `G16/G17`). The ESP32 unpacks these 29 bytes and instantly leverages the parameters for offline hysteresis bounds.

### Threshold Hysteresis Breakdown
The internal ESP32 logic relies on disjointed threshold bounds to prevent hardware "jittering" (where a sensor floating at exactly 30°C causes a fan to rapidly flicker ON and OFF, destroying the relay).
- **Fan**: ON > `tOn` / OFF < `tOff`
- **Pump**: ON < `sMin` / OFF > `sMax`
- **Shade Net**: TARGET OPEN > `tsOn` / TARGET CLOSED < `tsOff` (Movement executed via Stepper sequences dynamically halted by Ultrasonic limit distances).

---

## 5. The Local AI & Chatbot Engine
PolyGuard pioneers a fully localized, deterministic Ruleset Native Language Processor (NLP) explicitly avoiding expensive external API usage (like OpenAI).
1.  **Levenshtein Distance Spell-Checking**: The chatbot mathmatically autocorrects user typos ("turn on puamp") to route them natively to actuator intents.
2.  **Smart Actuator Control Array**: The NLP engine isolates strings for specific actuators (Pump, Fan, Lights, Shade Net). It intercepts compound commands (`"turn on the pump and the lights"`) to simultaneously override Firebase arrays globally in an instant.
3.  **The Watchdog (`useEffect`)**: The AI constantly evaluates `ActuatorState`. If a user disables `Automation Mode` and manually restricts an actuator while a threshold is breached (e.g., Temp is 36°C but the fan is manually switched off), the React dashboard triggers a 5-minute continuous background cooldown. If action is not taken, an intrusive "Action Needed" Notification spawns globally for the Agronomist.

---

## 6. Dashboard Security & 2FA
The Polyhouse cannot be trivially brute-forced via network attacks. When registering a new NodeMCU Master Node, Firebase creates an entirely clean registry loop.
1. The user powers the hardware physically onsite.
2. The NodeMCU OLED randomly derives a uniquely secure `Chip-ID` and single-use `OTP` token, displaying them sequentially on Page 2 ("Pair to Device").
3. The registered Firebase Author account must physically type these exact strings into their React dashboard. 
4. Upon successful handshake, full bi-directional control channels are unlocked.

---

## 7. Installation & Deployment

### Local Dashboard Setup
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/your-username/PolyGuard.git
   cd PolyGuard
   ```
2. Install dependencies (Requires Node.js 18+):
   ```bash
   npm install
   ```
3. Boot the lightning-fast Vite dev server:
   ```bash
   npm run dev
   ```

### Global Vercel Deployment
Because the architecture relies entirely on a modern Firebase Serverless implementation and deterministic Local AI handling, there is no physical NodeJS express backend to deploy!
1. Push your clone to a free GitHub repository.
2. Link the repository directly via **Vercel** or **Netlify**.
3. Vite will compile the static HTML/JS frontend within 60 seconds natively, placing it on a global CDN. It will immediately begin parsing Firebase DB updates from your physical hardware anywhere on earth.

---

## 8. Hardware Flashing Guide
You must flash the two discrete `.ino` payloads to their respective microcontrollers.
1. Make sure you have the Arduino IDE installed.
2. Install the necessary libraries via the Library Manager: `ESP8266WiFi`, `FirebaseESP8266`, `Adafruit_SHT31`, `BH1750`, `Adafruit_SSD1306`, `Stepper`.
3. Open `secure_provisioning_firmware.ino`. Select the **NodeMCU V3 (ESP8266)** board profile and hit Upload.
4. Next, plug in the **ESP32 WROOM**. Open `node_actuator_esp32.ino`. Select the **ESP32 Dev Module** board profile and hit Upload.
5. Apply 5V power and bind **D5** (TX) / **D6** (RX) on the NodeMCU to **G16** (RX) / **G17** (TX) on the ESP32. Ensure both boards share a common Ground (`GND`).
