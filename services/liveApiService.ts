import { SensorData, ActuatorState } from '../types';

export class ESP8266Service {
  private ipAddress: string;

  constructor(ip: string) {
    // accept with or without http://
    this.ipAddress = ip.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  // ---------- TELEMETRY ----------
  // Fetches from the root "/" endpoint served by the ESP8266 firmware.
  // The firmware JSON fields are: temperature, humidity, light_lux, soil_moisture
  async fetchSensorData(): Promise<SensorData | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `http://${this.ipAddress}/`,
        { signal: controller.signal, mode: 'cors' }
      );

      clearTimeout(timeout);
      if (!res.ok) throw new Error('Fetch failed with status: ' + res.status);

      const raw = await res.json();

      return {
        // Firmware doesn't provide a timestamp — use current time
        timestamp: new Date().toLocaleTimeString(),
        temperature: raw.temperature ?? 0,
        humidity: raw.humidity ?? 0,
        soilMoisture: raw.soil_moisture ?? 0,
        lightIntensity: raw.light_lux ?? 0,
        // Firmware doesn't have these sensors — default to 0
        soilPH: 0,
        co2: 0,
        nitrogen: 0,
        phosphorus: 0,
        potassium: 0
      };
    } catch (e) {
      console.error('ESP8266 Fetch Error:', e);
      return null;
    }
  }

  // ---------- ACTUATOR STATE ----------
  async fetchActuatorState(): Promise<ActuatorState | null> {
    try {
      const res = await fetch(`http://${this.ipAddress}/state`);
      if (!res.ok) throw new Error('State fetch failed');
      return await res.json();
    } catch (e) {
      console.error('ESP8266 State Error:', e);
      return null;
    }
  }

  // ---------- CONTROL ----------
  async toggleActuator(
    key: keyof ActuatorState,
    state: boolean
  ): Promise<ActuatorState | null> {
    try {
      const res = await fetch(`http://${this.ipAddress}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: state })
      });

      if (!res.ok) throw new Error('Control failed');
      return await res.json();
    } catch (e) {
      console.error('ESP8266 Control Error:', e);
      return null;
    }
  }
}
