import { temperatureState } from "./rules/temperature.rules";
import { soilState } from "./rules/soil.rules";
import { lightState } from "./rules/light.rules";
import { loadOfflineKnowledge } from "./trainer";
import type { SensorData, WeatherData } from "../../types";

export function offlineEngine(
  data: SensorData,
  weather?: WeatherData | null
): string {

  const { agronomy } = loadOfflineKnowledge();
  const responses: string[] = [];

  const temp = temperatureState(data.temperature);
  const soil = soilState(data.soilMoisture);
  const light = lightState(data.lightIntensity);

  // Inside vs outside
  if (weather?.current?.temp !== undefined) {
    responses.push(
      `Inside temperature is ${data.temperature}°C while outside it is ${weather.current.temp}°C.`
    );
  } else {
    responses.push(`Inside temperature is ${data.temperature}°C.`);
  }

  if (temp === "HIGH") {
    responses.push(agronomy.heatStress.action);
  }

  if (soil === "DRY") {
    responses.push(agronomy.drySoil.action);
  }

  if (light === "LOW") {
    responses.push(agronomy.lowLight.action);
  }

  return responses.join(" ");
}
