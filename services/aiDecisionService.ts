import { INTENTS, INTENTS_EXTENDED, PRIORITY_INTENTS } from "./intents";
import { generateMockData } from "./mockData";
import { AUTOMATION_THRESHOLDS } from "./actuatorAutomation";
import { searchKnowledgeBase } from "./knowledgeBase";
import type { SensorData, WeatherData, ActuatorState } from "../types";

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
  // 1. NORMALIZE (Lower, trim, remove extra internal spaces for "softwar e team")
  let clean = message.toLowerCase().trim().replace(/\s+/g, ' ');

  // 2. CONVERSATIONAL FILLERS
  if (["mm", "hmm", "hm", "uh", "um"].includes(clean)) return "SMALL_TALK_ACK";
  if (["ok", "k", "okay", "cool", "nice", "good", "great"].includes(clean)) return "SMALL_TALK_POS";
  if (["lol", "haha", "thanks", "thx", "thank you"].includes(clean)) return "SMALL_TALK_THANKS";

  // 3. HARDCODED SHORTCUTS
  if (clean.includes("humi") && !clean.includes("explain") && !clean.includes("what is humidity")) return "HUMIDITY_QUERY";
  if (clean.includes("temp") && !clean.includes("explain") && !clean.includes("what is temperature")) return "TEMP_QUERY";
  if ((clean.includes("soil") && !clean.includes("what is soil") && !clean.includes("explain")) || clean.includes("moist")) return "SOIL_QUERY";
  if (clean.includes("light") || clean.includes("lux")) return "LIGHT_QUERY";

  if (clean.includes("pump")) return "PUMP_QUERY";
  if (clean.includes("fan") || clean.includes("vent")) return "FAN_QUERY";

  if (clean.includes("weather")) return "WEATHER_QUERY";
  if (clean.includes("ping") || clean.includes("latency")) return "LATENCY_QUERY";

  // 4. DATE & TIME DISTINCTION
  if (clean === "time" || clean.includes("clock")) return "TIME_QUERY";
  if (clean === "date" || clean === "day" || clean.includes("today")) return "DATE_QUERY";

  // 5. CHECK HUGE INTENT FILE
  const allIntents = { ...INTENTS, ...INTENTS_EXTENDED };
  for (const [key, phrases] of Object.entries(allIntents)) {
    // @ts-ignore
    for (const phrase of phrases) {
      const p = phrase.toLowerCase();
      // Exact or simple inclusion
      if (clean === p || clean.includes(p)) return key;
      // Word boundary regex
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(clean)) return key;
    }
  }

  // 6. FUZZY MATCH (Fallback for typos like "hardarew")
  const words = clean.split(" ");
  for (const word of words) {
    if (word.length < 4) continue;
    // Hardware typos
    if (isFuzzyMatch(word, "hardware", 2)) return "TEAM_QUERY";
    if (isFuzzyMatch(word, "software", 2)) return "TEAM_QUERY";
    if (isFuzzyMatch(word, "college", 2)) return "ACADEMIC_QUERY";
    if (isFuzzyMatch(word, "founders", 2)) return "TEAM_QUERY";
    
    // Original NPK fuzzy
    if (isFuzzyMatch(word, "phosphorus")) return "NPK_PHOSPHORUS";
    if (isFuzzyMatch(word, "nitrogen")) return "NPK_NITROGEN";
    if (isFuzzyMatch(word, "potassium")) return "NPK_POTASSIUM";
    if (isFuzzyMatch(word, "humidity")) return "HUMIDITY_QUERY";
  }

  // 7. BRUTE FORCE KEYWORD CHECK (No boundary)
  if (clean.includes("softwar")) return "TEAM_QUERY";
  if (clean.includes("hardwar") && !clean.includes("test")) return "TEAM_QUERY";
  if (clean.includes("test") || clean.includes("vamsi")) return "TESTING_QUERY";

  return null;
}

// ============================================================================
// 💬 RESPONSE BANK
// ============================================================================
const RESPONSE_BANK: Record<string, string[]> = {
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

  // --- SYSTEM  // System
  WEATHER_KUPPAM: [
    "🌤️ Local Weather update: {temp}°C, {cond}. Wind: {wind}. Humidity: {humid}.",
    "Outside conditions: {cond}, {temp}°C. Forecast running locally."
  ],
  TIME_CHECK: ["🕒 Current Time: {time}."],
  DATE_CHECK: ["📅 Today is {day}, {date}."],
  
  LATENCY: ["⚡ System Latency: {val}. Connection Excellent."],
  TEAM_QUERY: [
    "I was developed by **Team A9**. The founding members are **H Umesh**, **K Aswin**, **K Adithya**, and **M Vamsi**. The Project Heads are **M Gopi Krishna** and **H Umesh**.",
    "The PolyGuard team consists of M Gopi Krishna & H Umesh (Project Heads), Aswin & Adithya (Software), and Umesh & Vamsi (Testing). Our mentor is M Gopi Krishna sir."
  ],
  THANKS: [
    "You are very welcome! I am always analyzing your polyhouse data.",
    "Happy to help! Let me know if you need any more agronomy advice.",
    "My pleasure! Systems are standing by for your next command.",
    "I live to serve the Polyhouse! Thank you for the kind words."
  ],
  STATUS_FULL: [
    "📊 **Polyhouse Status**\n🌡️ Temp: {temp}°C | 💧 Soil: {soil}%\n⚡ Latency: {lat}"
  ],
  TESTING_TEAM: [
    "The **Testing Team** consists of **H Umesh** and **M Vamsi**. They performed rigorous unit testing on the hardware and software.",
    "Meet our project testers: **H Umesh** and **M Vamsi**. They ensured 100% reliability through exhaustive hardware and software stress testing.",
    "**H Umesh** and **M Vamsi** are our lead testers. Every line of code and every sensor link was rigorously validated for PolyGuard's production launch.",
    "The reliability of Polyhouse automation is thanks to **H Umesh** and **M Vamsi**. They conducted thorough unit testing on both the firmware and dashboard."
  ],
  UNKNOWN: [
    "🤖 I didn't quite catch that. Try 'Check Soil', 'Weather', or 'Turn on Pump'.",
    "Hmm, I don't have that in my database yet. Want to talk about tomatoes or irrigation?",
    "I'm still learning! Try asking about photosythensis, NPK, or the team."
  ]
};

const FUTURE_RESPONSES = [
  "⏳ That feature is currently under implementation and will be available in the next major update!",
  "🔮 We are actively developing advanced chemical analysis. This will be applied in the future.",
  "🚀 Soil nutrient and pH tracking is arriving in our upcoming 2.0 release!",
  "🛠️ Our engineers are perfecting the chemistry sensors. Stay tuned for the next update.",
  "📈 This advanced data metric is under active development and deployed soon.",
  "🧪 Chemical breakdowns (NPK/pH/CO2) are slated for our next firmware patch.",
  "📅 We've logged your interest! This feature is officially on the roadmap for the future.",
  "⚙️ Those specific sensors are currently undergoing calibration and will be unlocked soon.",
  "🌱 Advanced agronomy metrics like that are coming in the next software rollout.",
  "🔍 We are currently building out that capability. It will be available in the future updates!",
  "✨ Your requested feature is currently being tested in the lab and will launch shortly.",
  "📡 We are waiting on the hardware bridge for those specific sensors. Arriving in a future update."
];

const BUTTON_POOL = [
  "What is the temperature?",
  "Check soil moisture", 
  "Turn on the Water Pump",
  "Turn off the Water Pump",
  "Check outside weather",
  "Turn on the Fan",
  "Turn off the Fan",
  "Current latency?",
  "Check humidity levels",
  "Is the Shade Net deployed?",
  "What's the system time?", 
  "Is it too hot in here?",
  "Do the plants need water?"
];

function getRandomButtons(count: number = 4) {
  const shuffled = [...BUTTON_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const GREETING_TEXTS = [
  "👋 Hello! I am your PolyGuard Agronomist Assistant. I am monitoring your dashboard locally. How can I help you today?",
  "🤖 PolyGuard AI active. All sensors are being tracked locally. What would you like to know?",
  "🌿 Welcome back! I'm here to assist you with the polyhouse environment. What's on your mind?",
  "👋 Hi there! The autonomous system is standing by. Feel free to ask me anything.",
  "✨ Greetings! Your local crop doctor is ready to analyze the data. What do you need?",
  "👨‍🌾 PolyGuard Assistant online. I'm keeping a close eye on your plants. Need an update?",
  "🚀 Systems are green. How can I assist you with your polyhouse today?",
  "👋 Good day! The local telemetry engine is up and running. Ask away!",
  "☀️ Hello! I've been monitoring the environment. What should we check first?",
  "🌱 Hi! Your farm data is perfectly synced. Looking for a specific reading?",
  "🤖 Local AI at your service. Want to check the temperature or control a pump?",
  "👋 Welcome to the command center. I can control the actuators or read the sensors. What's the plan?",
  "🌿 PolyGuard is fully operational. Tap a button or type a command to get started.",
  "✨ Hi! I'm your dedicated local farm assistant. Everything is running smoothly. What do you want to see?",
  "👨‍🌾 Howdy! Looking to tweak the climate or check the soil? Let me know.",
  "🚀 Ready when you are! You can ask about moisture, temperature, or the weather.",
  "👋 Hello again! Want to turn on the fan or check the latest humidity reading?",
  "☀️ Systems perfectly nominal. Need help managing the greenhouse today?",
  "🌱 PolyGuard AI listening. Let's make sure the crops are happy. What do you need?",
  "🤖 Hi! Ask me anything about your dashboard and I'll pull the exact numbers for you immediately."
];

export interface ChatAssistantResponse {
  text: string;
  buttons?: string[];
  commands?: { actuator: keyof ActuatorState; state: boolean }[];
}

// ============================================================================
// 🚀 MAIN LOGIC CONTROLLER
// ============================================================================
let lastMockData: SensorData | null = null;

export async function chatWithAgronomist(
  message: string,
  ctx: {
    sensors?: SensorData;
    actuators: ActuatorState;
    thresholds: typeof AUTOMATION_THRESHOLDS;
    environment: WeatherData;
    system: { time: string; date: string; demoMode: boolean; latency: string };
  }
): Promise<ChatAssistantResponse> {

  const sensors = ctx.sensors ?? (lastMockData = generateMockData(lastMockData));
  const { actuators, thresholds } = ctx;
  const autoMode = actuators.automationEnabled ? "Enabled (Auto)" : "Disabled (Manual)";

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

  const env: any = ctx.environment || {};

  const weather = {
    temp: env.temperature ?? env.temp ?? 28,
    cond: env.description ?? env.condition ?? "Sunny",
    wind: env.windSpeed ?? "12 km/h",
    humidity: env.humidity ?? "45%"
  };

  const cleanMsg = message.toLowerCase();
  
  const npkKeywords = ["npk", "nitrogen", "potassium", "phosphorous", "phosphorus", "nutrient"];
  if (npkKeywords.some(kw => cleanMsg.includes(kw))) {
    return { text: "⏳ **NPK Sensors:** Soil nutrient data (Nitrogen, Phosphorus, Potassium) will be available in the next major PolyGuard update! Stay tuned." };
  }
  
  // Handle Multi-Actuator Control Commands
  const cmds: { actuator: keyof ActuatorState; state: boolean }[] = [];
  const actions: string[] = [];
  
  const isTurnOn = cleanMsg.includes("on") || cleanMsg.includes("start") || cleanMsg.includes("deploy") || cleanMsg.includes("open");
  const isTurnOff = cleanMsg.includes("off") || cleanMsg.includes("stop") || cleanMsg.includes("retract") || cleanMsg.includes("close");
  const isStatus = cleanMsg.includes("status");
  const isEdu = cleanMsg.includes("what is a ") || cleanMsg.includes("what are ") || cleanMsg.includes("explain ") || cleanMsg.includes("define ");

  if (cleanMsg.includes("pump") && !isEdu) {
    if (isStatus) return { text: `🚰 Water Pump Status: **${actuators.waterPump ? 'ON 🟢' : 'OFF 🔴'}** (Automation: ${autoMode}).` };
    if (isTurnOn) { cmds.push({ actuator: 'waterPump', state: true }); actions.push("🚰 Activating Water Pump..."); }
    else if (isTurnOff) { cmds.push({ actuator: 'waterPump', state: false }); actions.push("🛑 Stopping Water Pump..."); }
    else if (!cleanMsg.includes("and")) return { text: `🚰 Water Pump is **${actuators.waterPump ? 'ON' : 'OFF'}**.` };
  }
  
  if ((cleanMsg.includes("fan") || cleanMsg.includes("vent")) && !isEdu) {
    if (isStatus) return { text: `🌀 Fan Status: **${actuators.fan ? 'ON 🟢' : 'OFF 🔴'}** (Automation: ${autoMode}).` };
    if (isTurnOn) { cmds.push({ actuator: 'fan', state: true }); actions.push("🌀 Starting Ventilation..."); }
    else if (isTurnOff) { cmds.push({ actuator: 'fan', state: false }); actions.push("🛑 Stopping Ventilation..."); }
    else if (!cleanMsg.includes("and") && actions.length === 0) return { text: `🌀 Fans are **${actuators.fan ? 'ON' : 'OFF'}**.` };
  }
  
  if ((cleanMsg.includes("light") || cleanMsg.includes("grow")) && !isEdu) {
    if (isStatus) return { text: `💡 Grow Lights Status: **${actuators.growLights ? 'ON 🟢' : 'OFF 🔴'}** (Automation: ${autoMode}).` };
    if (isTurnOn) { cmds.push({ actuator: 'growLights', state: true }); actions.push("💡 Turning ON Grow Lights..."); }
    else if (isTurnOff) { cmds.push({ actuator: 'growLights', state: false }); actions.push("🌑 Turning OFF Grow Lights..."); }
    else if (!cleanMsg.includes("and") && actions.length === 0) return { text: `💡 Grow Lights are **${actuators.growLights ? 'ON' : 'OFF'}**.` };
  }
  
  if ((cleanMsg.includes("shade") || cleanMsg.includes("net")) && !isEdu) {
    if (isStatus) return { text: `🌤️ Shade Net Status: **${actuators.shadeNet ? 'DEPLOYED 🟢' : 'RETRACTED 🔴'}** (Automation: ${autoMode}).` };
    if (isTurnOn) { cmds.push({ actuator: 'shadeNet', state: true }); actions.push("🌤️ Deploying Shade Net..."); }
    else if (isTurnOff) { cmds.push({ actuator: 'shadeNet', state: false }); actions.push("☀️ Retracting Shade Net..."); }
    else if (!cleanMsg.includes("and") && actions.length === 0) return { text: `🌤️ Shade Net is **${actuators.shadeNet ? 'DEPLOYED' : 'RETRACTED'}**.` };
  }

  // If any direct actuator commands were extracted!
  if (cmds.length > 0) {
    return { text: actions.join("\n"), commands: cmds };
  }

  const detectedIntent = detectIntentSmart(message);
  if (!detectedIntent) {
    const kbResponse = searchKnowledgeBase(cleanMsg);
    if (kbResponse) return { text: kbResponse };
    return { text: getRandomResponse("UNKNOWN") };
  }

  switch (detectedIntent) {
    case "SMALL_TALK_ACK": return { text: getRandomResponse("SMALL_TALK_ACK") };
    case "SMALL_TALK_POS": return { text: getRandomResponse("SMALL_TALK_POS") };
    case "SMALL_TALK_THANKS": return { text: getRandomResponse("SMALL_TALK_THANKS") };

    case "TEMP_QUERY":
    case "TEMP_HOT":
      return { text: `🌡️ **Temperature Report:**\n` + 
             `• Current Temp: **${safeSensors.temp}°C**\n` +
             `• Fan Target (> ${thresholds.tempFanOn}°C): **${actuators.fan ? 'ON 🟢' : 'OFF 🔴'}**\n` +
             `• Shade Target (> ${thresholds.tempShadeOn}°C): **${actuators.shadeNet ? 'DEPLOYED 🟢' : 'RETRACTED 🔴'}**\n` +
             `• Automation: **${autoMode}**\n` +
             (safeSensors.temp > thresholds.tempFanOn ? `\n⚠️ Temperature is HIGH. System is waiting for action.`  : `\n✅ Temperature is within safe limits.`)
      };

    case "SOIL_QUERY":
    case "SOIL_DRY":
      return { text: `💧 **Soil Moisture Report:**\n` + 
             `• Current Moisture: **${safeSensors.soil}%**\n` +
             `• Irrigation Threshold (Pump ON below): **${thresholds.soilMoistureMin}%**\n` +
             `• Pump Status: **${actuators.waterPump ? 'ON 🟢' : 'OFF 🔴'}**\n` +
             `• Automation: **${autoMode}**\n` +
             (safeSensors.soil < thresholds.soilMoistureMin ? `\n⚠️ Soil is too DRY. System is currently ${actuators.waterPump ? 'irrigating the crops' : 'WAITING for manual Pump activation'}.` : `\n✅ Soil moisture is healthy and stable.`)
      };

    case "HUMIDITY_QUERY": 
      return { text: `💨 **Humidity Report:**\n` + 
             `• Current Humidity: **${safeSensors.humid}%**\n` +
             `• Max Limit (Fan ON above): **${thresholds.humidityFanOn}%**\n` +
             `• Fan Status: **${actuators.fan ? 'ON 🟢' : 'OFF 🔴'}**\n` +
             `• Automation: **${autoMode}**\n` +
             (safeSensors.humid > thresholds.humidityFanOn ? `\n⚠️ Humidity is HIGH. Ventilation is recommended to prevent fungal growth.` : `\n✅ Humidity is excellent.`)
      };

    case "LIGHT_QUERY": 
      return { text: `☀️ **Light Intensity Report:**\n` + 
             `• Current Light: **${safeSensors.light} lux**\n` +
             `• Grow Lights Status: **${actuators.growLights ? 'ON 🟢' : 'OFF 🔴'}**\n` +
             `• Automation: **${autoMode}**` 
      };

    case "NPK_QUERY":
    case "NPK_PHOSPHORUS": 
    case "NPK_NITROGEN": {
      return { text: "⏳ **NPK Sensors:** Soil nutrient data (Nitrogen, Phosphorus, Potassium) will be available in the next major PolyGuard update! Stay tuned." };
    }
    
    case "WEATHER_QUERY":
      return { text: getRandomResponse("WEATHER_KUPPAM", {
        temp: weather.temp.toString(),
        cond: weather.cond,
        wind: weather.wind.toString(),
        humid: weather.humidity.toString()
      })};
    
    case "TIME_QUERY": return { text: getRandomResponse("TIME_CHECK", { time: system.time }) };
    case "DATE_QUERY": return { text: getRandomResponse("DATE_CHECK", { date: system.date, day: system.day }) };
    case "LATENCY_QUERY": return { text: getRandomResponse("LATENCY", { val: system.latency }) };
    case "TEAM_QUERY": {
      const kb = searchKnowledgeBase(cleanMsg);
      if (kb) return { text: kb };
      return { text: getRandomResponse("TEAM_QUERY") };
    }

    case "TESTING_QUERY":
      return { text: getRandomResponse("TESTING_TEAM") };
    
    case "GREETING": {
      const gText = GREETING_TEXTS[Math.floor(Math.random() * GREETING_TEXTS.length)];
      return {
        text: gText,
        buttons: getRandomButtons(3 + Math.floor(Math.random() * 2)) // 3 or 4 buttons
      };
    }
             
    case "HELP": 
      return {
        text: `I can control Actuators, monitor Sensors, and check Weather.`,
        buttons: getRandomButtons(4)
      };

    default: {
      const defaultKb = searchKnowledgeBase(cleanMsg);
      if (defaultKb) return { text: defaultKb };
      return { text: getRandomResponse("UNKNOWN") };
    }
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

export function analyzePolyhouseData(
  data: SensorData, 
  actuators?: ActuatorState, 
  thresholds: typeof AUTOMATION_THRESHOLDS = AUTOMATION_THRESHOLDS
) {
  const recommendations: string[] = [];
  let analysis = "Data analyzed successfully.";
  let issues = 0;
  
  const manualMode = actuators && !actuators.automationEnabled;

  // Temperature Rules
  if (data.temperature >= thresholds.tempFanOn) {
    if (manualMode && !actuators?.fan) {
      recommendations.push(`High temperature detected (${data.temperature.toFixed(1)}°C). Action Needed: Turn ON Fans.`);
      issues++;
    } else if (manualMode && actuators?.fan) {
      recommendations.push(`High temperature detected. Fans are cooling the polyhouse.`);
      issues++;
    } else {
      recommendations.push("High temperature detected. Automation is managing cooling.");
      issues++;
    }
  } else if (data.temperature <= 15) {
    recommendations.push("Low temperature. Consider closing shade net or turning off fans.");
    issues++;
  }

  // Shade Net Rules
  if (data.temperature > thresholds.tempShadeOn) {
    if (manualMode && !actuators?.shadeNet) {
      recommendations.push(`High temperature exposure (${data.temperature.toFixed(1)}°C). Action Needed: Deploy Shade Nets.`);
      issues++;
    } else if (manualMode && actuators?.shadeNet) {
      recommendations.push(`High temperature exposure. Shade Net is currently deployed.`);
      issues++;
    } else {
      recommendations.push(`High temperature exposure. Shade Net is handled by automation.`);
      issues++;
    }
  }

  // Moisture Rules
  if (data.soilMoisture < thresholds.soilMoistureMin) {
    if (manualMode && !actuators?.waterPump) {
      recommendations.push(`Dry soil detected (${data.soilMoisture.toFixed(0)}%). Action Needed: Start Water Pump.`);
      issues++;
    } else if (manualMode && actuators?.waterPump) {
      recommendations.push(`Dry soil condition. Water Pump is currently irrigating.`);
      issues++;
    } else {
      recommendations.push("Dry soil detected. Automation is managing irrigation.");
      issues++;
    }
  } else if (data.soilMoisture > 80) {
    recommendations.push("Soil is overly saturated. Pause watering to prevent root rot.");
    issues++;
  }

  // Humidity Rules
  if (data.humidity > thresholds.humidityFanOn) {
    if (manualMode && !actuators?.fan) {
      recommendations.push(`High humidity (${data.humidity.toFixed(0)}%). Action Needed: Increase airflow via Fans.`);
      issues++;
    } else if (manualMode && actuators?.fan) {
       recommendations.push(`High humidity. Fans are actively circulating air.`);
       issues++;
    } else {
       recommendations.push(`High humidity. Automation is circulating air.`);
       issues++;
    }
  }

  // Light Rules
  if (data.lightIntensity < 100) {
    if (manualMode && !actuators?.growLights) {
      recommendations.push("Low light conditions. Action Needed: Turn ON Grow Lights.");
      issues++;
    } else if (manualMode && actuators?.growLights) {
      recommendations.push("Low light conditions. Grow Lights are actively supplementing light.");
      issues++;
    } else {
      recommendations.push("Low light conditions. Automation is managing Grow Lights.");
      issues++;
    }
  }

  if (issues > 2) {
    analysis = "Multiple critical parameters are outside optimal ranges. Immediate action required.";
  } else if (issues > 0) {
    if (manualMode) {
      analysis = "Minor deviations detected. Review 'Action Needed' recommendations below to restore optimal conditions since automation is OFF.";
    } else {
      analysis = "Deviations detected. Review recommendations to ensure the automated system resolves them.";
    }
  } else {
    analysis = "All polyhouse parameters are currently within optimal healthy ranges. No active intervention is required.";
  }

  return {
    analysis: analysis,
    recommendations: recommendations.length ? recommendations : ["Maintain current automation settings and monitor."]
  };
}