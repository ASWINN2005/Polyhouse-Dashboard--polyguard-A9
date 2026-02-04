import { SensorData, ActuatorState } from '../types';

export class ESP8266Service {
  private ipAddress: string;

  constructor(ip: string) {
    // accept with or without http://
    this.ipAddress = ip.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  // ---------- TELEMETRY ----------
  async fetchSensorData(): Promise<SensorData | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(
        `http://${this.ipAddress}/telemetry`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      if (!res.ok) throw new Error('Telemetry failed');

      const raw = await res.json();

      return {
        timestamp: new Date(raw.ts * 1000).toLocaleTimeString(),
        temperature: raw.t ?? 0,
        humidity: raw.h ?? 0,
        soilMoisture: raw.sm ?? 0,
        lightIntensity: raw.lux ?? 0,
        soilPH: raw.ph ?? 0,
        co2: raw.co2 ?? 0,
        nitrogen: raw.n ?? 0,
        phosphorus: raw.p ?? 0,
        potassium: raw.k ?? 0
      };
    } catch (e) {
      console.error('ESP8266 Telemetry Error:', e);
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
      return await res.json(); // authoritative truth
    } catch (e) {
      console.error('ESP8266 Control Error:', e);
      return null;
    }
  }
}
