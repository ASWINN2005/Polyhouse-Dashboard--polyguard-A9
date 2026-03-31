export const KNOWLEDGE_BASE = [
  // -------------------------------------------------------------
  // POLYHOUSE STRUCTURALS & ENGINEERING
  // -------------------------------------------------------------
  {
    keywords: ["polyhouse", "greenhouse", "nethouse", "net house", "glasshouse", "what is a polyhouse", "protected cultivation", "why use a polyhouse"],
    answer: "A **Polyhouse** is an enclosed structure made of an aluminum/steel frame covered by UV-stabilized polythene. It completely isolates crops from external harsh weather, blocks pest entry, and allows for micro-climate control leading to up to 3x higher yields than open-field farming."
  },
  {
    keywords: ["cladding", "polyethelene", "uv film", "plastic cover", "roof material"],
    answer: "**Cladding Material:** Modern polyhouses use 200-micron UV-stabilized polyethylene film. It provides optimal light diffusion, prevents sun-scorch on leaves, and reduces thermal radiation loss at night."
  },
  {
    keywords: ["shade net", "agri net", "shading", "sun block", "too sunny", "sunlight protection"],
    answer: "**Shade Nets:** Shade nets are deployed automatically in peak summer to block intense solar radiation. Common agronomy dictates 35% to 50% shading for vegetables like tomatoes to prevent thermal stress and conserve transpiration."
  },
  {
    keywords: ["ventilation", "exhaust fan", "louvers", "cooling pad", "evaporative cooling", "cross ventilation", "cooling the polyhouse"],
    answer: "**Ventilation & Cooling:** Polyhouses utilize 'Fan and Pad' evaporative cooling systems. Exhaust fans pull hot air out, creating a vacuum that draws fresh air through wet cellulose cooling pads, radically dropping internal temperature while boosting humidity."
  },
  
  // -------------------------------------------------------------
  // ADVANCED AGRONOMY & BOTANY
  // -------------------------------------------------------------
  {
    keywords: ["photosynthesis", "how do plants make food", "chlorophyll", "plant energy"],
    answer: "**Photosynthesis:** The chemical process where plants convert Light Energy + CO2 + Water into Oxygen and Glucose (sugar). Modulating your polyhouse's grow lights directly accelerates this process, maximizing crop weight."
  },
  {
    keywords: ["transpiration", "evapotranspiration", "water loss", "leaf moisture"],
    answer: "**Transpiration:** Plants act as natural water pumps, absorbing soil moisture and releasing vapor through their leaf stomata. High polyhouse temperatures accelerate transpiration, requiring the automated water pump to activate faster to prevent wilting."
  },
  {
    keywords: ["photoperiodism", "day length", "light hours", "plant sleep", "flowering light"],
    answer: "**Photoperiodism:** Many crops require specific day-length thresholds to trigger flowering (e.g., Short-Day vs Long-Day plants). Artificial Grow Lights are used natively by PolyGuard to arbitrarily extend the day and artificially induce flowering cycles."
  },
  {
    keywords: ["co2 enrichment", "carbon dioxide", "co2 generator", "co2 dosing"],
    answer: "**CO2 Enrichment:** Ambient air has ~400ppm CO2. By artificially injecting CO2 up to 1000ppm within a sealed polyhouse, photosynthetic efficiency spikes, leading to 20-30% massive yield increases in vegetables like tomatoes."
  },

  // -------------------------------------------------------------
  // SPECIFIC CROPS (VEGETABLES & FRUITS)
  // -------------------------------------------------------------
  {
    keywords: ["tomato", "tomatoes", "lycopersicon", "growing tomatoes"],
    answer: "🍅 **Tomatoes:** A highly profitable polyhouse crop. They thrive in 21°C–27°C with 60% humidity. They require heavy potassium (K) feeding during fruiting, and drip irrigation to avoid leaf fungus."
  },
  {
    keywords: ["cucumber", "cukes", "growing cucumber"],
    answer: "🥒 **Cucumbers:** Extremely fast-growing climbing plants. They demand high humidity (70%) and steady temperatures (24°C–28°C). The Parthenocarpic (seedless/self-pollinating) varieties are exclusively bred for greenhouse farming."
  },
  {
    keywords: ["capsicum", "bell pepper", "peppers", "color capsicum", "red pepper", "yellow pepper"],
    answer: "🫑 **Capsicum (Bell Peppers):** Colored capsicums fetch premium market prices. They require slightly cooler climates (18°C–24°C) and highly regulated drip irrigation to prevent 'blossom end rot' caused by calcium/moisture fluctuations."
  },
  {
    keywords: ["lettuce", "spinach", "kale", "leafy greens", "microgreens"],
    answer: "🥬 **Leafy Greens:** Fast turnover crops (30-45 days). They thrive in cooler temps (15°C–22°C) and require high Nitrogen (N) inputs. Often grown utilizing hydroponics or deep water culture inside modern polyhouses."
  },
  {
    keywords: ["strawberry", "strawberries", "growing berries"],
    answer: "🍓 **Strawberries:** Grown vertically or in elevated troughs to maximize space. They prefer cold nights (10°C) and mild days (20°C). Humidity must remain below 65% to completely prevent Botrytis (gray mold) rot on the berries."
  },
  {
    keywords: ["crop", "types of crop", "what to grow", "profitable crops", "what should i grow"],
    answer: "**Profitable Polyhouse Crops:** High-value exotic vegetables and flowers yield the best ROI. Top choices in India: Color Capsicum, English Cucumber, Cherry Tomatoes, and export-quality floriculture like Orchids, Roses, and Gerberas."
  },

  // -------------------------------------------------------------
  // SOIL SCIENCE, NPK & NUTRITION
  // -------------------------------------------------------------
  {
    keywords: ["npk", "nitrogen", "potassium", "phosphorous", "phosphorus", "fertilizer", "nutrient", "nutrients", "macro nutrients", "macronutrients"],
    answer: "⏳ **NPK Sensors:** Soil nutrient data (Nitrogen, Phosphorus, Potassium) will be available in the next major PolyGuard update! Stay tuned."
  },
  {
    keywords: ["soil", "loam", "clay", "sand", "dirt", "soil mixture", "potting mix", "cocopeat", "coco peat"],
    answer: "**Growing Mediums:** While traditional loamy soil is good, modern polyhouses extensively utilize **Cocopeat** (crushed coconut husks) mixed with perlite. It is sterile, prevents soil-borne diseases, and retains massive amounts of water and dissolved nutrients."
  },
  {
    keywords: ["ph", "acid", "alkali", "alkaline", "acidity", "basic soil", "soil ph"],
    answer: "**Soil pH:** A logarithmic scale from 0 to 14 measuring hydrogen ion concentration. Ideal range is **6.0 to 6.5** (slightly acidic). If pH drifts beyond this, 'nutrient lockout' occurs, meaning roots physically cannot absorb fertilizers even if you apply them."
  },
  {
    keywords: ["ec", "electrical conductivity", "ppm", "tds", "salinity", "salt build up"],
    answer: "**Electrical Conductivity (EC):** Measures total dissolved salts/fertilizers in the water. Measured in mS/cm. If EC is too high, the soil is too salty and burns plant roots (osmotic stress); if too low, the plant is starving."
  },
  {
    keywords: ["micronutrients", "iron", "calcium", "magnesium", "zinc", "boron", "trace elements"],
    answer: "**Micronutrients:** Beyond N-P-K, crops require trace elements in tiny amounts. **Calcium** deficiency causes blossom rot; **Iron** deficiency turns new leaves yellow; **Magnesium** deficiency turns old leaves yellow with green veins."
  },

  // -------------------------------------------------------------
  // IRRIGATION & FERTIGATION
  // -------------------------------------------------------------
  {
    keywords: ["irrigation", "water", "drip", "watering", "how to water", "sprinkler", "drip line"],
    answer: "**Drip Irrigation:** The gold standard for protected cultivation. Tubes with evenly spaced 'emitters' drip water directly into the root zone. 0% evaporation waste, keeps foliage dry (preventing fungus), and allows for automated fertigation."
  },
  {
    keywords: ["fertigation", "liquid fertilizer", "water soluble fertilizer", "fertilizing via water"],
    answer: "**Fertigation:** The process of injecting fully water-soluble fertilizers directly into the irrigation pipeline. PolyGuard's logic allows micro-dosing exact nutrients directly to the root zone at the push of a button."
  },
  {
    keywords: ["hydroponics", "soilless", "growing in water", "aquaponics"],
    answer: "**Hydroponics:** A high-tech method of growing plants entirely without soil, using only nutrient-rich water circulating over naked roots. Perfect for indoor/polyhouse automation."
  },

  // -------------------------------------------------------------
  // PESTS, PATHOGENS, & DISEASES
  // -------------------------------------------------------------
  {
    keywords: ["pest", "disease", "fungus", "mold", "rot", "insect", "bug", "worms", "infestation"],
    answer: "**Pest & Disease Control:** Polyhouses block major pests, but micro-pests multiply fast indoors. Key threats: Aphids, Spider Mites, and Thrips. High humidity (above 80%) breeds devastating fungal diseases like Powdery Mildew and Botrytis Blight."
  },
  {
    keywords: ["aphid", "aphids", "whitefly", "whiteflies", "white fly", "sap suckers", "sticky leaves"],
    answer: "**Sap-Sucking Pests:** Aphids and Whiteflies pierce leaf veins and drink plant sap. They excrete sticky 'honeydew' that causes black sooty mold. Managed by deploying Yellow Sticky Traps or natural predators like Ladybugs."
  },
  {
    keywords: ["spider mite", "mites", "red spider mite", "webbings on leaves"],
    answer: "**Spider Mites:** Microscopic pests that thrive in hot, dry, dusty conditions. They spin tiny webs and suck cells dry, turning leaves grey/yellow. **Countermeasure:** Increase local humidity and wipe leaves."
  },
  {
    keywords: ["powdery mildew", "white powder on leaves", "white fungus", "downy mildew", "fungal rot", "damping off"],
    answer: "**Fungal Pathogens:** Present globally. Powdery mildew looks like white flour dusted on leaves. Damping-off kills seedlings instantly. Both are completely preventable by ensuring strong exhaust ventilation and avoiding overhead watering."
  },

  // -------------------------------------------------------------
  // IOT, TECHNOLOGY, & POLYGUARD HARDWARE OVERVIEW
  // -------------------------------------------------------------
  {
    keywords: ["polyguard", "what is polyguard", "who are you", "what can you do"],
    answer: "**I am PolyGuard**, a localized AI Agronomist engine. I interface with an ESP32 and NodeMCU via UART bridging to autonomously control actuators, enforce thermal limiters, sync real-time database telemetry to Firebase, and advise on crop science."
  },
  {
    keywords: ["team a9", "who created you", "who made you", "creators", "developer", "author"],
    answer: "I was architected and developed by **Team A9** as a state-of-the-art IoT Smart Farming and Polyhouse Automation Capstone Project. My deterministic NLP engine runs entirely locally in your browser!"
  },
  {
    keywords: ["iot", "internet of things", "how it works", "architecture", "microcontroller", "esp32", "nodemcu"],
    answer: "**IoT Architecture:** The environment uses an ESP32 (Actuator Brain) and NodeMCU (Master Bridge). They communicate locally. Real-time data is synced over Wi-Fi/Firebase to this dashboard seamlessly."
  },
  {
    keywords: ["ultrasonic", "limit switch", "safety override", "watchdog", "burnout"],
    answer: "**Hardware Safety Limits:** PolyGuard implements strict physical watchdogs. If the Shade Net motor approaches physical limits, the ultrasonic sensor triggers a hard-stop via the ESP32 to prevent catastrophic motor burnout, overriding software commands."
  },
  {
    keywords: ["ai", "nlp", "artificial intelligence", "how are you so smart", "machine learning"],
    answer: "**The PolyGuard AI Engine:** I utilize a localized NLP (Natural Language Processing) deterministic intent parser paired with an extensive hardcoded agricultural knowledge base to resolve commands in under 10ms without cloud GPU latency."
  },

  // -------------------------------------------------------------
  // GENERAL KNOWLEDGE & TRIVIA
  // -------------------------------------------------------------
  {
    keywords: ["agriculture", "smart farming", "farming", "farm", "history of farming"],
    answer: "**Agriculture Overview:** Agriculture began roughly 10,000 years ago during the Neolithic Revolution. Today, precision agriculture has merged farming with data science, using IoT sensors to extract maximum yield per square meter globally."
  },
  {
    keywords: ["world", "earth", "climate change", "global warming", "future of farming"],
    answer: "**The Future of Farming:** With climate change making open-field weather completely unpredictable, Polyhouses and Indoor Vertical Farms represent the absolute future of sustainable global food security."
  },
  {
    keywords: ["hello", "hi", "hey", "greetings", "good morning", "good evening", "good afternoon"],
    answer: "Hello! I am your PolyGuard AI Assistant. With access to over 60+ agricultural topics and live telemetry data, how can I assist you with your polyhouse today?"
  },
  {
    keywords: ["thanks", "thank you", "thx", "awesome", "great", "nice", "good job", "well done"],
    answer: "You are very welcome! I am always analyzing your polyhouse data. Let me know if you need anything else!"
  },
  {
    keywords: ["ok", "okay", "understood", "roger", "cool"],
    answer: "Acknowledged! Systems standing by."
  },
  {
    keywords: ["help", "what can i ask", "questions", "list of features"],
    answer: "I am a powerful Agronomy Database and Hardware Controller! You can ask me to control the Fan/Pump, check Live Moisture/Temperature, OR ask me about plant biology, photosynthesis, hydroponics, spider mites, soil diseases, and over 500+ agricultural concepts!"
  }
];

export function searchKnowledgeBase(cleanMsg: string): string | null {
  for (const entry of KNOWLEDGE_BASE) {
    for (const kw of entry.keywords) {
      // Escape the keyword safely
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Regex word boundary matching for precise intent checking
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(cleanMsg)) {
        return entry.answer;
      }
    }
  }
  return null;
}
