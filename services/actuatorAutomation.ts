import { SensorData, ActuatorState } from '../types';

// ────────────────────────────────────────────────────────────────
// ACTUATOR AUTOMATION — Polyhouse AI Thresholds
//
// Edit the values below to tune when each actuator turns ON/OFF.
// ────────────────────────────────────────────────────────────────

export const AUTOMATION_THRESHOLDS = {
  // 💧 Water Pump
  soilMoistureMin: 35,   // % — pump ON below this
  soilMoistureMax: 60,   // % — pump OFF above this

  // 💨 Ventilation Fan
  tempFanOn: 30,         // °C — fan ON above this
  tempFanOff: 25,        // °C — fan OFF below this
  humidityFanOn: 80,     // %  — fan ON above this
  humidityFanOff: 60,    // %  — fan OFF below this

  // 💡 Grow Lights
  lightMin: 50,          // lx — lights ON below this
  lightMax: 200,         // lx — lights OFF above this

  // 🌿 Shade Net
  tempShadeOn: 34,       // °C — shade ON above this
  tempShadeOff: 28,      // °C — shade OFF below this
};

// ── Core Logic ───────────────────────────────────────────────────
// Given live sensor data, returns the desired ON/OFF state for each actuator.
export function computeDesiredActuators(
  data: SensorData,
  currentState: ActuatorState,
  thresholdOverrides?: typeof AUTOMATION_THRESHOLDS
): Omit<ActuatorState, 'automationEnabled'> {
  const t = thresholdOverrides || AUTOMATION_THRESHOLDS;
  
  // Start with exactly the current state so we don't accidentally toggle 
  // if values are in the hysteresis deadband.
  let { waterPump, fan, growLights, shadeNet } = currentState;

  // Pump Logic
  if (data.soilMoisture < t.soilMoistureMin) waterPump = true;
  else if (data.soilMoisture > t.soilMoistureMax) waterPump = false;

  // Fan Logic (Turns ON for either High Temp OR High Hum)
  if (data.temperature > t.tempFanOn || data.humidity > t.humidityFanOn) fan = true;
  else if (data.temperature < t.tempFanOff && data.humidity < t.humidityFanOff) fan = false;

  // Lights Logic
  if (data.lightIntensity < t.lightMin) growLights = true;
  else if (data.lightIntensity > t.lightMax) growLights = false;

  // Shade Net Logic
  if (data.temperature > t.tempShadeOn) shadeNet = true;
  else if (data.temperature < t.tempShadeOff) shadeNet = false;

  return { waterPump, fan, growLights, shadeNet };
}

// ── Diff Helper ──────────────────────────────────────────────────
// Returns only the keys whose desired state differs from current state.
// Used to avoid sending unnecessary relay commands every poll cycle.
export function getChangedActuators(
  current: ActuatorState,
  desired: Omit<ActuatorState, 'automationEnabled'>
): Partial<Omit<ActuatorState, 'automationEnabled'>> {
  const changes: Partial<Omit<ActuatorState, 'automationEnabled'>> = {};
  (Object.keys(desired) as (keyof typeof desired)[]).forEach(key => {
    if (current[key] !== desired[key]) changes[key] = desired[key];
  });
  return changes;
}
