export function lightState(lux: number) {
  return lux < 800 ? "LOW" : "OK";
}
