export const RESPONSES = {
  greeting: "Hello 🙂 I’m here to help you monitor and manage your polyhouse.",

  temperature: (inside: number, outside?: number) =>
    outside
      ? `Inside temperature is ${inside}°C, while outside it is ${outside}°C.`
      : `Inside temperature is ${inside}°C.`,

  irrigation: (needed: boolean) =>
    needed
      ? "Soil is dry. Irrigation is recommended."
      : "Soil moisture is sufficient. Irrigation is not required.",

  light: (low: boolean) =>
    low
      ? "Light levels are low. Grow lights should be turned on."
      : "Light levels are adequate for crops.",

  summary: "Overall, the polyhouse environment is stable."
};
