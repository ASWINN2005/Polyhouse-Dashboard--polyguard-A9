import { INTENTS, INTENTS_EXTENDED, PRIORITY_INTENTS } from "./intents";
import { generateMockData } from "./mockData";
import type { SensorData, WeatherData } from "../types";

// ============================================================================
// 🛠️ CONFIGURATION & UTILITIES
// ============================================================================

// 🧠 FUZZY MATCHING (Levenshtein Distance)
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function isFuzzyMatch(input: string, target: string, threshold = 2): boolean {
  if (Math.abs(input.length - target.length) > 3) return false; 
  return getLevenshteinDistance(input, target) <= threshold;
}

// 🧠 SMART INTENT DETECTOR
function detectIntentSmart(message: string): string | null {
  const clean = message.toLowerCase().trim();
  
  // 1. CONVERSATIONAL FILLERS
  if (["mm", "hmm", "hm", "uh", "um"].includes(clean)) return "SMALL_TALK_ACK";
  if (["ok", "k", "okay", "cool", "nice", "good", "great"].includes(clean)) return "SMALL_TALK_POS";
  if (["lol", "haha", "thanks", "thx", "thank you"].includes(clean)) return "SMALL_TALK_THANKS";

  // 2. HARDCODED SHORTCUTS
  if (clean.includes("humi")) return "HUMIDITY_QUERY"; 
  if (clean.includes("temp")) return "TEMP_QUERY";
  if (clean.includes("soil") || clean.includes("moist")) return "SOIL_QUERY";
  if (clean.includes("light") || clean.includes("lux")) return "LIGHT_QUERY";
  
  if (clean.includes("pump")) return "PUMP_QUERY";
  if (clean.includes("fan") || clean.includes("vent")) return "FAN_QUERY";
  
  if (clean.includes("weather")) return "WEATHER_QUERY";
  if (clean.includes("ping") || clean.includes("latency")) return "LATENCY_QUERY";

  // 3. DATE & TIME DISTINCTION
  if (clean === "time" || clean.includes("clock")) return "TIME_QUERY";
  if (clean === "date" || clean === "day" || clean.includes("today")) return "DATE_QUERY";

  // 4. CHECK HUGE INTENT FILE
  const allIntents = { ...INTENTS, ...INTENTS_EXTENDED };
  for (const [key, phrases] of Object.entries(allIntents)) {
    // @ts-ignore
    for (const phrase of phrases) {
      const p = phrase.toLowerCase();
      if (clean === p) return key;
      if (p.length < 3) continue; 
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(clean)) return key;
    }
  }

  // 5. FUZZY MATCH (Fallback)
  const words = clean.split(" ");
  for (const word of words) {
    if (word.length < 4) continue; 
    if (isFuzzyMatch(word, "phosphorus")) return "NPK_PHOSPHORUS";
    if (isFuzzyMatch(word, "nitrogen")) return "NPK_NITROGEN";
    if (isFuzzyMatch(word, "potassium")) return "NPK_POTASSIUM";
    if (isFuzzyMatch(word, "humidity")) return "HUMIDITY_QUERY";
  }

  return null;
}

// ============================================================================
// 💬 RESPONSE BANK
// ============================================================================
const RESPONSE_BANK: Record<string, string[]> = {
  UNKNOWN: [
    "I didn't quite catch that. Try 'Check Soil', 'Weather', or 'Turn on Pump'.",
    "System uncertain. You can ask about Sensors, Actuators, or Weather.",
    "Command not recognized."
  ],
  
  // --- SMALL TALK ---
  SMALL_TALK_ACK: ["I'm listening.", "Standing by.", "Systems active.", "Go ahead."],
  SMALL_TALK_POS: ["👍", "Understood.", "Copy that.", "Glad to hear."],
  SMALL_TALK_THANKS: ["You're welcome!", "Happy to help.", "Anytime."],

  GREETING: [
    "Hello! PolyGuard online. Monitoring Kuppam facility.",
    "Hi there! All sensors active. What do you need?",
    "Greetings. I am ready to assist."
  ],
  HELP: [
    "I can control Actuators, monitor NPK/Soil/Temp, and check Weather.",
    "Try: 'Show Analytics', 'Turn on Pump', 'Check Phosphorus'."
  ],
  
  // --- SENSORS ---
  TEMP_OK: ["✅ Temperature is optimal at {val}°C.", "Thermometers reading {val}°C."],
  TEMP_HIGH: ["⚠️ ALERT: High Temperature ({val}°C). Ventilation recommended."],
  
  SOIL_OK: ["✅ Soil moisture is healthy at {val}%.", "Ground sensors report {val}% moisture."],
  SOIL_DRY: ["💧 WARNING: Soil is DRY ({val}%). Irrigation required."],
  
  HUMIDITY_OK: ["💨 Humidity is {val}%, which is safe."],
  
  NPK_OK: ["🌱 Nutrients Balanced. Nitrogen: {n}mg, Phosphorus: {p}mg, Potassium: {k}mg."],
  NPK_P: ["🌱 Phosphorus level is {val}mg (Healthy)."],
  NPK_N: ["🌱 Nitrogen level is {val}mg (Healthy)."],
  
  CO2_OK: ["💨 CO2 levels are {val} ppm (Optimal)."],
  PH_OK: ["🧪 Soil pH is {val}. Neutral acidity."],

  // --- ACTUATORS ---
  PUMP_ON: ["🚰 Activating Water Pump... [CMD:PUMP_ON]", "Turning ON irrigation. [CMD:PUMP_ON]"],
  PUMP_OFF: ["🛑 Stopping Water Pump... [CMD:PUMP_OFF]", "Irrigation stopped. [CMD:PUMP_OFF]"],
  PUMP_STATUS: ["The Water Pump is currently {status}."],

  FAN_ON: ["🌀 Starting Ventilation... [CMD:FAN_ON]", "Cooling engaged. [CMD:FAN_ON]"],
  FAN_OFF: ["🛑 Stopping Ventilation... [CMD:FAN_OFF]", "Fans disabled. [CMD:FAN_OFF]"],

  // --- SYSTEM ---
  WEATHER_KUPPAM: [
    "🌤️ Kuppam Weather: {temp}°C, {cond}. Wind: {wind}. Humidity: {humid}.",
    "Outside: {cond}, {temp}°C. Forecast looks clear."
  ],
  TIME_CHECK: ["🕒 Current Time: {time}.", "It is {time}."],
  DATE_CHECK: ["📅 Today is {day}, {date}.", "Date: {date} ({day})."],
  
  LATENCY: ["⚡ System Latency: {val}. Connection Excellent."],
  STATUS_FULL: [
    "📊 **Kuppam Polyhouse Status**\n🌡️ Temp: {temp}°C | 💧 Soil: {soil}%\n🌱 NPK: {n}-{p}-{k} | 🧪 pH: {ph}\n⚡ Latency: {lat}"
  ]
};

// ============================================================================
// 🚀 MAIN LOGIC CONTROLLER
// ============================================================================
let lastMockData: SensorData | null = null;

export async function chatWithAgronomist(
  message: string,
  ctx: {
    sensors?: SensorData;
    environment: WeatherData;
    system: { time: string; date: string; demoMode: boolean; latency: string };
  }
): Promise<string> {

  // 1. LOAD DATA
  const sensors = ctx.sensors ?? (lastMockData = generateMockData(lastMockData));
  
  const safeSensors = {
    temp: sensors.temperature || 24,
    soil: sensors.soilMoisture || 45,
    humid: sensors.humidity || 60,
    light: sensors.lightIntensity || 500,
    n: sensors.nitrogen || 140,
    p: sensors.phosphorus || 40,
    k: sensors.potassium || 180,
    ph: sensors.soilPH || 6.5,
    co2: sensors.co2 || 450
  };

  const now = new Date();
  const system = {
    time: now.toLocaleTimeString('en-US', { hour12: false }), 
    date: now.toLocaleDateString('en-GB'),
    day: now.toLocaleDateString('en-US', { weekday: 'long' }),
    latency: ctx.system?.latency || "24ms"
  };

  // 🛠️ TYPE SAFETY FIX: 
  // We cast environment to 'any' to safely check for 'temp' OR 'temperature'
  // ensuring no TS errors regardless of how WeatherData is defined.
  const env: any = ctx.environment || {};

  const weather = {
    // Check both 'temperature' and 'temp' properties
    temp: env.temperature ?? env.temp ?? 28, 
    // Check both 'description' and 'condition' properties
    cond: env.description ?? env.condition ?? "Sunny",
    wind: env.windSpeed ?? "12 km/h",
    humidity: env.humidity ?? "45%"
  };

  // 2. DETECT INTENT
  const cleanMsg = message.toLowerCase();
  
  // A. Precise Actuator Commands
  if (cleanMsg.includes("pump")) {
    if (cleanMsg.includes("on") || cleanMsg.includes("start")) return getRandomResponse("PUMP_ON");
    if (cleanMsg.includes("off") || cleanMsg.includes("stop")) return getRandomResponse("PUMP_OFF");
    return getRandomResponse("PUMP_STATUS", { status: "OFF (Auto)" });
  }
  
  if (cleanMsg.includes("fan") || cleanMsg.includes("vent")) {
    if (cleanMsg.includes("on")) return getRandomResponse("FAN_ON");
    if (cleanMsg.includes("off")) return getRandomResponse("FAN_OFF");
    return "Fan Status: OFF";
  }

  // B. Smart Detection
  const detectedIntent = detectIntentSmart(message);

  // 3. EXECUTE RESPONSE
  if (!detectedIntent) return getRandomResponse("UNKNOWN");

  switch (detectedIntent) {
    // FILLERS
    case "SMALL_TALK_ACK": return getRandomResponse("SMALL_TALK_ACK");
    case "SMALL_TALK_POS": return getRandomResponse("SMALL_TALK_POS");
    case "SMALL_TALK_THANKS": return getRandomResponse("SMALL_TALK_THANKS");

    // SENSORS
    case "TEMP_QUERY":
    case "TEMP_HOT":
      return safeSensors.temp > 30 
        ? getRandomResponse("TEMP_HIGH", { val: safeSensors.temp.toString() })
        : getRandomResponse("TEMP_OK", { val: safeSensors.temp.toString() });

    case "SOIL_QUERY":
    case "SOIL_DRY":
      return safeSensors.soil < 35 
        ? getRandomResponse("SOIL_DRY", { val: safeSensors.soil.toString() })
        : getRandomResponse("SOIL_OK", { val: safeSensors.soil.toString() });

    case "HUMIDITY_QUERY": return getRandomResponse("HUMIDITY_OK", { val: safeSensors.humid.toString() });

    
    // CHEMISTRY
    case "NPK_QUERY":
      return getRandomResponse("NPK_OK", { n: safeSensors.n.toString(), p: safeSensors.p.toString(), k: safeSensors.k.toString() });
    case "NPK_PHOSPHORUS":
      return getRandomResponse("NPK_P", { val: safeSensors.p.toString() });
    case "NPK_NITROGEN":
      return getRandomResponse("NPK_N", { val: safeSensors.n.toString() });
    
    // SYSTEM
    case "WEATHER_QUERY":
      return getRandomResponse("WEATHER_KUPPAM", {
        temp: weather.temp.toString(),
        cond: weather.cond,
        wind: weather.wind,
        humid: weather.humidity
      });
    
    case "TIME_QUERY":
      return getRandomResponse("TIME_CHECK", { time: system.time });
    
    case "DATE_QUERY":
      return getRandomResponse("DATE_CHECK", { date: system.date, day: system.day });

    case "LATENCY_QUERY":
      return getRandomResponse("LATENCY", { val: system.latency });

    // SOCIAL
    case "GREETING": return getRandomResponse("GREETING");
    case "HELP": return getRandomResponse("HELP");

    default:
      if (detectedIntent.includes("NPK")) return getRandomResponse("NPK_OK", { n: safeSensors.n.toString(), p: safeSensors.p.toString(), k: safeSensors.k.toString() });
      return getRandomResponse("UNKNOWN");
  }
}

// Helper
function getRandomResponse(key: string, data?: Record<string, string>): string {
  const templates = RESPONSE_BANK[key] || RESPONSE_BANK['UNKNOWN'];
  const tmpl = templates[Math.floor(Math.random() * templates.length)];
  let out = tmpl;
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      out = out.replace(`{${k}}`, v);
    }
  }
  return out;
}

// Analytics Export
export function analyzePolyhouseData(data: SensorData) {
  const recommendations: string[] = [];
  if (data.temperature >= 30) recommendations.push("Enable ventilation.");
  if (data.soilMoisture < 35) recommendations.push("Start irrigation.");
  return {
    analysis: `Temp ${data.temperature}°C, Soil ${data.soilMoisture}%`,
    recommendations: recommendations.length ? recommendations : ["All systems stable."]
  };
}