import { SensorData } from '../types';

// Helper to generate realistic fluctuating data
export const generateMockData = (prevData: SensorData | null): SensorData => {
  const now = new Date();
  const hour = now.getHours();

  // Day / night influence (diurnal cycle)
  const isDay = hour >= 6 && hour <= 18;

  if (!prevData) {
    return {
      timestamp: now.toLocaleTimeString(),
      temperature: 24,
      humidity: 60,
      soilMoisture: 45,
      lightIntensity: 500,
      soilPH: 6.5,
      co2: 450,
      nitrogen: 140,
      phosphorus: 40,
      potassium: 180
    };
  }

  // Controlled random drift
  const drift = (value: number, range: number) => {
    const change = (Math.random() - 0.5) * range;
    return value + change;
  };

  // Slow trend memory (prevents flatlining)
  const trend = (value: number, strength: number) => {
    return value + (Math.random() - 0.5) * strength;
  };

  return {
    timestamp: now.toLocaleTimeString(),

    temperature: Number(
      Math.max(
        15,
        Math.min(
          45,
          trend(
            drift(prevData.temperature, isDay ? 0.8 : 0.4),
            isDay ? 0.3 : -0.1
          )
        )
      ).toFixed(1)
    ),

    humidity: Number(
      Math.max(
        30,
        Math.min(
          90,
          trend(
            drift(prevData.humidity, 1.5),
            isDay ? -0.3 : 0.4
          )
        )
      ).toFixed(1)
    ),

    soilMoisture: Number(
      Math.max(
        10,
        Math.min(
          90,
          trend(
            drift(prevData.soilMoisture, 1.2),
            -0.15 // gradual drying
          )
        )
      ).toFixed(1)
    ),

    lightIntensity: Math.max(
      0,
      Math.min(
        5000,
        Math.floor(
          isDay
            ? drift(prevData.lightIntensity, 120)
            : drift(prevData.lightIntensity * 0.2, 50)
        )
      )
    ),

    soilPH: Number(
      Math.max(
        5.0,
        Math.min(
          8.5,
          drift(prevData.soilPH, 0.15)
        )
      ).toFixed(2)
    ),

    co2: Math.max(
      300,
      Math.min(
        1000,
        Math.floor(
          trend(drift(prevData.co2, 25), isDay ? -5 : 8)
        )
      )
    ),

    nitrogen: Math.max(
      100,
      Math.min(
        200,
        Math.floor(
          trend(drift(prevData.nitrogen, 4), -0.3)
        )
      )
    ),

    phosphorus: Math.max(
      20,
      Math.min(
        80,
        Math.floor(
          trend(drift(prevData.phosphorus, 2), -0.15)
        )
      )
    ),

    potassium: Math.max(
      100,
      Math.min(
        300,
        Math.floor(
          trend(drift(prevData.potassium, 5), -0.25)
        )
      )
    ),
  };
};
