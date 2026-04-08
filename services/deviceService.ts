/**
 * deviceService.ts
 *
 * Matches the actual Firebase Realtime DB structure:
 *
 *  /polyhouse/readings/   ← ESP8266 writes sensor data here
 *  /polyhouse/controls/   ← Dashboard writes actuator commands here; ESP8266 reads
 *  /polyhouse/settings/   ← Shared automation settings
 *  /devices/{id}/         ← Per-device registry (actuator state mirror)
 *
 *  Firestore /devices/{chipId} ← Claiming / ownership (separate from RTDB)
 */

import {
  doc, setDoc, updateDoc, deleteField,
  collection, query, where, onSnapshot
} from 'firebase/firestore';
import { ref, onValue, off, set, update, get } from 'firebase/database';
import { db, rtdb } from './firebase';
import { DeviceRecord, SensorData, ActuatorState } from '../types';

// ────────────────────────────────────────────────────────────────
// RTDB — Sensor Readings  (/polyhouse/readings/)
// ────────────────────────────────────────────────────────────────

export function subscribeToCloudTelemetry(
  chipId: string,
  callback: (data: SensorData | null) => void
): () => void {
  const readingsRef = ref(rtdb, `devices/${chipId}/readings`);
  const handler = (snapshot: any) => {
    if (!snapshot.exists()) { callback(null); return; }
    const r = snapshot.val();

    // Parse NPK string "20:15:25" into individual N, P, K values
    let nitrogen = 0, phosphorus = 0, potassium = 0;
    if (typeof r.npk === 'string') {
      const parts = r.npk.split(':').map(Number);
      [nitrogen, phosphorus, potassium] = parts;
    }

    callback({
      timestamp: new Date((r.lastUpdate ?? Date.now() / 1000) * 1000).toLocaleTimeString(),
      temperature: r.temperature ?? 0,
      humidity: r.humidity ?? 0,
      soilMoisture: r.soilMoisture ?? 0,
      lightIntensity: r.lightIntensity ?? 0,
      soilPH: r.soilPH ?? 0,
      co2: r.co2 ?? 0,
      nitrogen,
      phosphorus,
      potassium,
    });
  };
  onValue(readingsRef, handler);
  return () => off(readingsRef, 'value', handler);
}

// ────────────────────────────────────────────────────────────────
// RTDB — Actuator Controls  (/polyhouse/controls/)
// Dashboard writes here → ESP8266 reads and activates relays
// ────────────────────────────────────────────────────────────────

export async function sendActuatorCommand(
  chipId: string,
  key: keyof Omit<ActuatorState, 'automationEnabled'>,
  state: boolean
): Promise<void> {
  const controlRef = ref(rtdb, `devices/${chipId}/controls/${key}`);
  await set(controlRef, state ? 1 : 0);
}

export function subscribeToActuatorState(
  chipId: string,
  callback: (state: Partial<ActuatorState>) => void
): () => void {
  const controlsRef = ref(rtdb, `devices/${chipId}/controls`);
  const handler = (snapshot: any) => {
    if (!snapshot.exists()) return;
    const c = snapshot.val();
    callback({
      waterPump: Boolean(c.waterPump),
      fan: Boolean(c.fan),
      growLights: Boolean(c.growLights),
      shadeNet: Boolean(c.shadeNet),
    });
  };
  onValue(controlsRef, handler);
  return () => off(controlsRef, 'value', handler);
}

// ────────────────────────────────────────────────────────────────
// RTDB — Settings  (/polyhouse/settings/)
// ────────────────────────────────────────────────────────────────

import { AUTOMATION_THRESHOLDS } from './actuatorAutomation';

export type CloudSettings = Partial<typeof AUTOMATION_THRESHOLDS> & {
  automationEnabled?: boolean;
};

export async function updateSettings(
  chipId: string,
  settings: CloudSettings
): Promise<void> {
  await update(ref(rtdb, `devices/${chipId}/settings`), settings);
}

export function subscribeToSettings(
  chipId: string,
  callback: (s: CloudSettings) => void
): () => void {
  const settingsRef = ref(rtdb, `devices/${chipId}/settings`);
  const handler = (snapshot: any) => {
    if (!snapshot.exists()) return;
    callback(snapshot.val() as CloudSettings);
  };
  onValue(settingsRef, handler);
  return () => off(settingsRef, 'value', handler);
}

export function subscribeToDeviceStatus(
  chipId: string,
  callback: (status: { online: boolean; lastSeen: number; ip: string }) => void
): () => void {
  const statusRef = ref(rtdb, `devices/${chipId}/status`);
  const handler = (snapshot: any) => {
    if (!snapshot.exists()) return;
    const s = snapshot.val();
    callback({
      online: s.online ?? false,
      lastSeen: s.lastSeen ?? 0,
      ip: s.ip ?? ''
    });
  };
  onValue(statusRef, handler);
  return () => off(statusRef, 'value', handler);
}

// ────────────────────────────────────────────────────────────────
// RTDB — Device Discovery  (/devices/)
// ESP8266 registers itself here; dashboard reads for auto-discovery
// ────────────────────────────────────────────────────────────────

export function subscribeToOnlineDevices(
  callback: (devices: Array<{ chipId: string; ip: string; lastSeen: number; online: boolean }>) => void
): () => void {
  const devicesRef = ref(rtdb, 'devices');
  const handler = (snapshot: any) => {
    if (!snapshot.exists()) { callback([]); return; }
    const val = snapshot.val();
    const list = Object.entries(val).map(([chipId, data]: [string, any]) => ({
      chipId,
      ip: data.status?.ip ?? '',
      lastSeen: data.status?.lastSeen ?? 0,
      online: data.status?.online ?? false,
    }));
    callback(list.filter(d => d.online));
  };
  onValue(devicesRef, handler);
  return () => off(devicesRef, 'value', handler);
}

// ────────────────────────────────────────────────────────────────
// Firestore — Device Claiming  (Firestore: /devices/{chipId})
// Links a hardware chip ID to a Firebase Auth user account
// ────────────────────────────────────────────────────────────────

export async function claimDeviceWithOTP(
  chipId: string,
  otp: string,
  uid: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Fetch OTP from RTDB directly for one-time verification
    const otpRef = ref(rtdb, `devices/${chipId}/status/otp`);
    const snapshot = await get(otpRef);

    if (!snapshot.exists()) return { success: false, message: "Device has no active pairing session. Please restart your device." };

    const cloudOtp = String(snapshot.val());
    if (cloudOtp !== otp) return { success: false, message: "Invalid OTP. Check your Serial Monitor." };

    // 2. Claim in Firestore
    await setDoc(doc(db, 'devices', chipId), {
      chipId, uid, ownerEmail: email, name: 'My Polyhouse', claimedAt: Date.now(),
    }, { merge: true });

    // 3. Mark as CLAIMED and clear OTP in RTDB
    await update(ref(rtdb, `devices/${chipId}/status`), {
      online: true,
      claimed: true,
      otp: null,
      lastSeen: Math.floor(Date.now() / 1000)
    });

    return { success: true, message: "Device paired successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateDeviceName(chipId: string, newName: string): Promise<void> {
  await updateDoc(doc(db, 'devices', chipId), { name: newName });
}

export async function claimDevice(
  chipId: string,
  uid: string,
  email: string,
  name: string = 'My Polyhouse'
): Promise<void> {
  await setDoc(doc(db, 'devices', chipId), {
    chipId, uid, ownerEmail: email, name, claimedAt: Date.now(),
  }, { merge: true });
}

export async function releaseDevice(chipId: string): Promise<void> {
  // 1. Remove from Firestore
  await updateDoc(doc(db, 'devices', chipId), {
    uid: deleteField(), ownerEmail: deleteField(),
    claimedAt: deleteField(), name: deleteField(),
  });

  // 2. Mark as UNCLAIMED in RTDB (Signals hardware to stop telemetry)
  await update(ref(rtdb, `devices/${chipId}/status`), {
    claimed: false,
    online: false,
    otp: null // Force hardware to generate a new OTP on next boot if desired
  });
}

export function subscribeToUserDevices(
  uid: string,
  callback: (devices: DeviceRecord[]) => void
): () => void {
  const q = query(collection(db, 'devices'), where('uid', '==', uid));
  const unsub = onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.data() as DeviceRecord));
  });
  return unsub;
}

export async function tryLocalConnect(chipId: string): Promise<string | null> {
  const hostnames = [
    `polyguard-${chipId.toLowerCase()}.local`,
    `http://polyguard-${chipId.toLowerCase()}.local`
  ];

  for (const host of hostnames) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(host.startsWith('http') ? host : `http://${host}/`, {
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeout);
      if (res.ok) return host;
    } catch { /* try next */ }
  }
  return null;
}

/**
 * Pings multiple IPs/hostnames to find which ones are reachable on the local network.
 */
export async function scanLocalDevices(
  devices: Array<{ chipId: string; ip: string }>
): Promise<Array<{ chipId: string; localIp: string }>> {
  const results: Array<{ chipId: string; localIp: string }> = [];

  const promises = devices.map(async (d) => {
    // Collect potential local addresses for this device
    const targets = [];
    if (d.ip) targets.push(d.ip);
    if (d.chipId) targets.push(`polyguard-${d.chipId.toLowerCase()}.local`);

    if (targets.length === 0) return;

    for (const host of targets) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`http://${host}/`, { signal: controller.signal, mode: 'cors' });
        clearTimeout(timeout);
        
        if (res.ok) {
          results.push({ chipId: d.chipId, localIp: host });
          return; // Stop checking this device if we found a working host
        }
      } catch { /* not reachable, try next host */ }
    }
  });

  await Promise.all(promises);
  return results;
}
