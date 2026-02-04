export function soilState(moisture: number) {
  return moisture < 35 ? "DRY" : "OK";
}
