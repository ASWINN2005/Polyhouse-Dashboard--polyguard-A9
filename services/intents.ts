/**
 * POLYGUARD AI - PRO-HORTICULTURE INTENT ARCHITECTURE
 * --------------------------------------------------
 * A comprehensive semantic dataset for AI-driven Smart Greenhouses.
 * Features: 400+ lines, expanded vocabulary, and technical precision.
 */

export const INTENTS = {
  // -------- GENERAL & GREETINGS --------
  GREETING: [
    "hi", "hello", "hey", "h", "hh", "hhello", "greetings", "good morning", 
    "good afternoon", "good evening", "wake up", "hello bot", "hey assistant", 
    "is anyone there", "howdy", "top of the morning", "hi there", "hello assistant", 
    "hey polyguard", "start", "initialize", "hello system", "hi system", 
    "good day", "yo", "hello friend", "salutations", "hey buddy", "hi polyhouse"
  ],

  HELP: [
    "help", "what can you do", "i need assistance", "show commands", "guide me", 
    "how to use this", "instruction manual", "help me polyguard", "features", 
    "what are your capabilities", "give me a tour", "explain features", 
    "system help", "troubleshoot", "support", "command list", "what should i ask", 
    "how do i monitor sensors", "how do i control pumps", "tutorial", "guidance"
  ],

  // -------- TIME, DATE & SPATIAL --------
  TIME: [
    "time", "now", "current time", "what time is it", "the time please", 
    "clock", "check time", "local time", "hour", "minutes", "seconds", 
    "current hour", "exact time", "time update", "what is the hour", "time check"
  ],

  DATE: [
    "date", "day", "today", "what is today", "what is the date", "current date", 
    "today's date", "which day is it", "calendar", "day of the week", 
    "check the date", "what is the year", "month", "weekday", "date and time"
  ],

  TOMORROW: [
    "tomorrow", "next day", "upcoming day", "day after today", "tomorrow's forecast", 
    "what about tomorrow", "check tomorrow", "tomorrow's schedule", 
    "plans for tomorrow", "future date", "day 2", "next 24 hours"
  ],

  LOCATION: [
    "location", "where", "current coordinates", "where is the polyhouse", 
    "site location", "greenhouse position", "where am i", "polyhouse address", 
    "geographic location", "set location", "local position", "system site"
  ],

  // -------- SENSOR : TEMPERATURE (AMBIENT & SYSTEM) --------
  TEMP_QUERY: [
    "temp", "temperature", "heat", "degree", "how hot is it", "celsius", 
    "fahrenheit", "thermal reading", "ambient temperature", "current temp", 
    "inside temperature", "check heat", "is it hot inside", "heat level", 
    "temperature status", "what is the temperature", "thermal status", 
    "thermometer reading", "internal temp", "room temperature", "current degrees"
  ],

  TEMP_HOT: [
    "hot", "very hot", "overheating", "high temperature", "it's boiling", 
    "scorching", "too hot in here", "extreme heat", "temperature spike", 
    "heat warning", "is it too hot", "cooling needed", "thermal excess", 
    "critical heat", "max temp reached", "dangerously hot", "stifling"
  ],

  TEMP_COLD: [
    "cold", "cool", "freezing", "chilly", "low temperature", "frost risk", 
    "is it too cold", "temperature drop", "too cool", "cold warning", 
    "heating needed", "winter conditions", "low degrees", "frigid", 
    "ice risk", "thermal minimum", "critical cold", "bitterly cold"
  ],

  // -------- SENSOR : HUMIDITY (AIR MOISTURE) --------
  HUMIDITY_QUERY: [
    "humidity", "hum", "humid", "air moisture", "relative humidity", 
    "moisture level", "dampness", "hygrometer", "check humidity", 
    "how humid is the air", "humidity reading", "current moisture", 
    "atmospheric water", "vapor level", "humidity status", "air quality"
  ],

  HUMIDITY_HIGH: [
    "humid high", "too humid", "excessive moisture", "saturated air", 
    "high humidity alert", "is it too damp", "mold risk", "heavy air", 
    "humidity warning", "max humidity", "dehumidify needed", "tropical air"
  ],

  // -------- SENSOR : SOIL (HYDRATION & SUBSTRATE) --------
  SOIL_QUERY: [
    "soil", "moisture", "water level", "soil moisture", "dirt wetness", 
    "volumetric water content", "vwc", "soil hydration", "ground moisture", 
    "how wet is the dirt", "substrate status", "check soil", "soil reading", 
    "moisture sensor reading", "earth moisture", "underground moisture"
  ],

  SOIL_DRY: [
    "dry", "soil dry", "thirsty plants", "low moisture in soil", "parched", 
    "cracked earth", "water required", "soil dehydration", "is the soil dry", 
    "drought conditions", "wilting risk", "low hydration", "needs watering"
  ],

  // -------- IRRIGATION & WATER MANAGEMENT --------
  IRRIGATE_QUERY: [
    "irrigate", "irrigation", "water crops", "watering", "start irrigation", 
    "irrigation schedule", "water status", "check watering", "crop hydration", 
    "sprinklers", "drip system", "water supply", "irrigation flow", "watering mode"
  ],

  IRRIGATE_SHOULD: [
    "should i irrigate", "do plants need water", "is it time to water", 
    "watering recommendation", "advise on irrigation", "check water need", 
    "water plants now", "is the crop thirsty", "irrigation advice", 
    "suggest watering", "automated water check"
  ],

  // -------- LIGHTING & PHOTOSYNTHESIS --------
  LIGHT_QUERY: [
    "light", "lux", "brightness", "illumination", "photons", "par", 
    "light level", "solar radiation", "sunlight", "check light", 
    "how bright is it", "light intensity", "current lux", "brightness level", 
    "uv index", "lighting status", "grow lights", "is it sunny"
  ],

  LIGHT_LOW: [
    "low light", "dark", "cloudy", "insufficient light", "shadowy", 
    "needs more light", "dim", "light shortage", "gloomy", "not enough sun", 
    "photosynthesis drop", "low lux alert", "supplementary light needed"
  ],

  LIGHT_ON: [
    "turn on lights", "activate grow lights", "switch on lighting", 
    "need artificial light", "lighting toggle", "start supplemental light", 
    "lights up", "increase brightness", "engage lights", "lights on"
  ],

  // -------- ACTUATORS & HARDWARE CONTROL --------
  ACTUATOR_QUERY: [
    "actuator", "motor", "pump", "fan", "shade", "hardware", "switches", 
    "relays", "control units", "active systems", "mechanical parts", 
    "actuator status", "check motors", "is the shade working", "relay check"
  ],

  PUMP_QUERY: [
    "pump", "water pump", "start pump", "stop pump", "is pump running", 
    "pump status", "water pressure", "pump maintenance", "check relay 1", 
    "irrigation pump", "submersible pump", "main pump", "booster pump"
  ],

  FAN_QUERY: [
    "fan", "ventilation", "exhaust", "circulation", "fan speed", 
    "cooling fan", "vent fans", "air circulation", "start ventilation", 
    "stop fans", "is fan on", "check air flow", "vent status", "fan logic"
  ],

  SHADE_QUERY: [
    "shade", "shade net", "retractable shade", "curtain", "sun protection", 
    "shade status", "close shade", "open shade", "is shade active", 
    "light barrier", "thermal screen", "shade system", "shade motor"
  ],

  MODE_QUERY: [
    "manual", "auto", "ai mode", "switch mode", "automated control", 
    "manual override", "change logic", "set to auto", "enable ai", 
    "operational mode", "system logic", "control mode", "how is it running"
  ],

  // -------- WEATHER & EXTERNAL METRICS --------
  WEATHER_QUERY: [
    "weather", "climate", "outside", "external weather", "outdoor temp", 
    "is it raining", "local weather", "current conditions", "weather report", 
    "outside humidity", "outdoor environment", "sky status", "ambient weather"
  ],

  WIND_QUERY: [
    "wind", "wind speed", "wind direction", "gusts", "anemometer", 
    "is it windy", "breeze", "wind intensity", "check wind", "stormy wind", 
    "current wind", "wind velocity", "outdoor gusts"
  ],

  FORECAST_QUERY: [
    "forecast", "prediction", "upcoming weather", "weather outlook", 
    "rain prediction", "weather trends", "future weather", "is rain expected", 
    "expected temp", "storm warning", "forecast details", "weather probability"
  ],

  // -------- ANALYTICS, GRAPHS & TRENDS --------
  ANALYTICS_QUERY: [
    "analytics", "graph", "chart", "trend", "statistics", "data analysis", 
    "performance logs", "weekly trends", "show graphs", "visualize data", 
    "data points", "historical data", "sensor trends", "analytics report"
  ],

  CLIMATE_ANALYTICS: [
    "climate analytics", "temperature chart", "humidity graph", 
    "heat trends", "thermal history", "humidity patterns", "air stats", 
    "climate report", "greenhouse performance", "thermal analysis"
  ],

  SOIL_ANALYTICS: [
    "soil analytics", "moisture chart", "hydration trends", 
    "soil moisture history", "watering patterns", "soil health stats", 
    "ground report", "dirt analytics", "moisture graph"
  ],

  // -------- SYSTEM DIAGNOSTICS --------
  STATUS_QUERY: [
    "status", "overall", "condition", "system health", "is everything okay", 
    "polyhouse health", "overall summary", "current state", "system check", 
    "how are the crops", "is it safe", "general status", "dashboard summary"
  ],

  LATENCY_QUERY: [
    "latency", "delay", "ms", "ping", "connection speed", "response time", 
    "lag", "check latency", "network speed", "wifi strength", 
    "data delay", "system lag", "how fast is the data"
  ],

  DEMO_MODE: [
    "demo mode", "simulate data", "test mode", "dummy data", 
    "run simulation", "trial mode", "demo status", "start demo", 
    "is it in demo mode", "practice data", "example mode"
  ],

  // -------- NAVIGATION (UI CONTROL) --------
  NAVIGATE: [
    "navigate", "go", "open", "switch to", "show me", "take me to", 
    "access", "display", "change view", "view", "move to", "load"
  ],

  NAV_SENSORS: [
    "sensor", "sensors", "sensor dashboard", "monitoring view", 
    "data screen", "sensor page", "live data", "realtime sensors"
  ],

  NAV_CONTROLS: [
    "control", "controls", "actuators", "switches", "manual panel", 
    "control page", "remote control", "buttons", "toggle page"
  ],

  NAV_ANALYTICS: [
    "analytics", "graphs", "statistics page", "trends screen", 
    "data analytics", "history page", "charts view"
  ],

  NAV_AI: [
    "ai", "assistant", "ai bot", "chat assistant", "smart bot", 
    "ask ai", "agronomist assistant", "ai panel"
  ],

  // -------- WHY / EXPLANATION / LOGIC --------
  WHY: [
    "why", "should", "what happens", "explain", "reasoning", 
    "why is the pump on", "why is it hot", "explanation needed", 
    "logic check", "cause", "why is the light low", "give me a reason"
  ],

  // -------- CROP HEALTH & HORTICULTURE --------
  CROP_QUERY: [
    "crop", "plants", "vegetables", "health", "growth", "growth stage", 
    "harvest time", "plant health", "how are my plants", "foliage", 
    "pest check", "disease risk", "crop status", "leaf condition"
  ],

  NPK_QUERY: [
    "npk", "nitrogen", "phosphorus", "potassium", "fertilizer", 
    "nutrients", "soil nutrients", "nutrient level", "ec level", 
    "ph level", "soil chemistry", "chemical balance", "fertilization"
  ],

  // -------- ALERTS & NOTIFICATIONS --------
  ALERT_QUERY: [
    "alerts", "notifications", "warnings", "errors", "active alerts", 
    "recent notifications", "critical issues", "error logs", 
    "is there an alert", "security", "unusual activity", "alarm"
  ],

  // -------- USER PREFERENCES & ACCOUNT --------
  USER_QUERY: [
    "user", "profile", "settings", "my account", "preferences", 
    "login", "logout", "change name", "user settings", "config", 
    "personalize", "permissions"
  ],

  // -------- SYSTEM MAINTENANCE --------
  MAINTENANCE_QUERY: [
    "maintenance", "clean", "service", "calibration", "sensor fix", 
    "update firmware", "hardware update", "reset system", "reboot", 
    "fix sensor", "system maintenance", "hardware checkup"
  ]
};

/**
 * TOTAL LINE COUNT VERIFICATION:
 * Current structure contains approximately 400+ distinct semantic entries.
 * Dataset is ready for high-precision NLP mapping.
 */
/**
 * POLYGUARD AI - PRO-HORTICULTURE INTENT ARCHITECTURE (REDUCED SCOPE EXTENSION)
 * ------------------------------------------------------------------------
 * ⚠️ Original INTENTS object is left COMPLETELY UNTOUCHED.
 * ✅ This file safely appends extended semantic coverage.
 */

export const INTENTS_EXTENDED = {

  // ===== ENVIRONMENTAL RISK & STRESS =====
  TEMP_RISK: [
    "temperature is unsafe",
    "heat stress detected",
    "risk due to high temperature",
    "temperature crossed safe limit",
    "thermal danger for crops",
    "overheating risk",
    "heat affecting plant growth",
    "extreme temperature condition"
  ],

  HUMIDITY_RISK: [
    "humidity too high for plants",
    "risk of fungal disease",
    "mold risk due to humidity",
    "air too damp",
    "humidity causing disease",
    "excessive moisture in air",
    "unsafe humidity level"
  ],

  SOIL_RISK: [
    "soil too dry for roots",
    "soil moisture critically low",
    "risk of wilting",
    "root stress due to dryness",
    "dehydrated soil",
    "soil not suitable for growth",
    "risk to root health"
  ],

  // ===== DECISION & LOGIC QUERIES =====
  AI_DECISION_QUERY: [
    "why did ai take this action",
    "explain system decision",
    "logic behind this action",
    "why was irrigation started",
    "why did fan turn on",
    "reason for automation",
    "what rule was triggered"
  ],

  AI_CONTROL_OVERRIDE: [
    "stop automatic control",
    "override ai decision",
    "switch to manual mode",
    "disable automation",
    "manual intervention required",
    "human control requested"
  ],

  // ===== IRRIGATION ADVANCED =====
  IRRIGATION_LOGIC: [
    "should irrigation start now",
    "is watering required",
    "soil based irrigation decision",
    "irrigation timing logic",
    "water requirement check"
  ],

  IRRIGATION_ERROR: [
    "irrigation not working",
    "pump running but no water",
    "no water flow detected",
    "irrigation system fault",
    "watering failed"
  ],

  // ===== ACTUATOR CONFIRMATION & FAULTS =====
  ACTUATOR_CONFIRM: [
    "confirm pump is running",
    "check fan status",
    "verify actuator response",
    "did motor start",
    "confirm relay action"
  ],

  ACTUATOR_FAULT: [
    "motor not responding",
    "fan not working",
    "pump stuck",
    "hardware not responding",
    "relay failure detected"
  ],

  // ===== OPERATOR NATURAL LANGUAGE =====
  OPERATOR_FEELING_BASED: [
    "plants look stressed",
    "something feels wrong",
    "air feels heavy",
    "soil feels too dry",
    "system acting strange",
    "plants not looking healthy"
  ],

  // ===== TIME-BASED CONTEXT =====
  TEMP_TREND: [
    "temperature rising over time",
    "getting hotter since morning",
    "heat increasing gradually",
    "temperature trend analysis"
  ],

  MOISTURE_TREND: [
    "soil drying over time",
    "moisture decreasing steadily",
    "watering effect wearing off",
    "hydration trend check"
  ],

  // ===== SYSTEM CONFIDENCE & TRUST =====
  AI_CONFIDENCE: [
    "how confident is ai",
    "ai decision confidence",
    "is system sure",
    "confidence level of action"
  ]

};
export const PRIORITY_INTENTS = [
  "STATUS_QUERY",
  "SYSTEM_STATUS",
  "SUMMARY",
  "TIME",
  "DATE",

  // sensor-level
  "TEMP_QUERY",
  "TEMP_HOT",
  "TEMP_COLD",
  "HUMIDITY_QUERY",
  "SOIL_QUERY",
  "SOIL_DRY",
  "LIGHT_QUERY",

  // lower importance
  "ANALYTICS_QUERY",
  "WHY",
  "HELP",
  "GREETING"
];