export interface SensorData {
  timestamp: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightIntensity: number;
  soilPH: number;
  co2: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export interface ActuatorState {
  waterPump: boolean;
  fan: boolean;
  growLights: boolean;
  shadeNet: boolean;
  automationEnabled: boolean;
}

export interface WeatherData {
  current: {
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    day: string;
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
  }>;
}

// Firestore document under devices/{chipId}
export interface DeviceRecord {
  chipId: string;            // e.g. "PG-7A3B12"
  uid: string | null;        // Firebase Auth UID of the owner (null = unclaimed)
  ownerEmail: string | null; // Gmail of owner
  name: string;              // User-given nickname
  ip: string;                // Last known IP (set by ESP8266)
  online: boolean;           // Set by ESP8266 heartbeat
  lastSeen: number;          // Unix timestamp ms
  claimedAt: number | null;  // Unix timestamp ms
}
