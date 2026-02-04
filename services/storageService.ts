
import { SensorData } from '../types';

const STORAGE_KEY = 'polyguard_sensor_history_v1';
const MAX_HISTORY_POINTS = 50; // Store last 50 points

export const saveSensorHistory = (history: SensorData[]) => {
  try {
    const serialized = JSON.stringify(history.slice(-MAX_HISTORY_POINTS));
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.warn('Failed to save sensor history to local storage', e);
  }
};

export const loadSensorHistory = (): SensorData[] => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return [];
    return JSON.parse(serialized);
  } catch (e) {
    console.warn('Failed to load sensor history', e);
    return [];
  }
};
