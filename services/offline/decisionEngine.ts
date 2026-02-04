import type { SystemContext } from "../context/systemContext";

export function evaluateDecisions(ctx: SystemContext) {
  return {
    isHot: ctx.sensors.temperature >= 30,
    shouldIrrigate: ctx.sensors.soilMoisture < 35,
    lightLow: ctx.sensors.lightIntensity < 800,
    humidityHigh: ctx.sensors.humidity > 80,
    cropSafe:
      ctx.sensors.temperature < 32 &&
      ctx.sensors.soilMoisture >= 35 &&
      ctx.sensors.lightIntensity >= 500
  };
}
