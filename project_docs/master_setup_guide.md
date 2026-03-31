# 🌿 PolyGuard Project — Complete Documentation Index

This folder contains all the technical details, setup guides, and development logs for the PolyGuard Smart Polyhouse Dashboard.

## 📁 Document Directory

| Document | Purpose |
|---|---|
| [**🛠️ Hardware Setup Guide**](./hardware_setup_guide.md) | Complete wiring diagram, pin mappings, and full hybrid firmware code for NodeMCU. |
| [**🔌 Relay Wiring Details**](./relay_wiring_details.md) | In-depth breakdown of the PCF8574 I/O expander and relay connections. |
| [**🚀 Project Walkthrough**](./project_walkthrough.md) | Summary of the recently polished features (Connection Management, Persistence, etc.). |
| [**📝 Development Log**](./development_log.md) | Historical task list and development progress for the entire project. |

---

## ⚡ Quick Start Checklist

### 1. Hardware Requirements
To build this system exactly as designed, you will need:
- **MCU**: NodeMCU ESP8266
- **Sensors**: SHT31 (I2C), BH1750 (I2C), Analog Soil Moisture Sensor
- **Actuators**: 4-Channel Relay Module, ULN2003 Stepper Driver + 28BYJ-48 Stepper Motor
- **I2C Bridge**: PCF8574 I/O Expander
- **Display**: 0.96" OLED (SSD1306)

### 2. Software Dependencies (Arduino IDE)
Ensure these libraries are installed to compile the firmware:
- `PCF8574` by Rob Tillaart
- `Adafruit SHT31`
- `BH1750` by Christopher Laws
- `Adafruit SSD1306` + `Adafruit GFX`
- `Stepper` (Built-in)

### 3. Dashboard Integration
The Polyhouse Dashboard supports three connection modes:
- **Demo Mode**: For testing the UI without hardware.
- **Local WiFi**: Direct connection via NodeMCU IP Address (fastest).
- **Global Cloud**: Controlled via Firebase and Google Cloud (requires ChipID + OTP pairing).

### 4. Recent Polishing
The latest version includes **Connection Persistence**. Once you connect to a device, the dashboard will remember the IP and Device Name even after you refresh the browser.

---

> [!TIP]
> **Pro-Tip**: Always check the [**Hardware Setup Guide**](./hardware_setup_guide.md) first before wiring, as the pin layout is critical for the I/O expander to work correctly.
