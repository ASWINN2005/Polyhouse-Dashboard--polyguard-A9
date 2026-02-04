export function temperatureState(temp: number) {
  if (temp >= 30) return "HIGH";
  if (temp <= 15) return "LOW";
  return "NORMAL";
}
