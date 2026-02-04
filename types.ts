export interface SensorData {
  timestamp: string;
  temperature: number; // Celsius
  humidity: number; // %
  soilMoisture: number; // %
  lightIntensity: number; // Lux
  soilPH: number; // 0–14
  co2: number; // ppm
  nitrogen: number; // mg/kg
  phosphorus: number; // mg/kg
  potassium: number; // mg/kg
}

export interface ActuatorState {
  waterPump: boolean;
  fan: boolean;
  growLights: boolean;
  shadeNet: boolean;
  automationEnabled: boolean;
}
