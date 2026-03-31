# Identity-Based Device Provisioning — Task

## Phase 1: Firebase & Services
- [x] Review firebase.ts, types.ts, .env
- [ ] Update `types.ts` — add `DeviceRecord` type
- [ ] Update `services/firebase.ts` — export RTDB instance
- [ ] Create `services/deviceService.ts` — claim, list, release devices

## Phase 2: Firmware
- [ ] Update ESP8266 sketch — add mDNS, ChipID registration, RTDB push

## Phase 12: Cloud Actuator Implementation
- [x] Integrate `sendActuatorCommand` into `App.tsx`
- [x] Add `subscribeToActuatorState` to `App.tsx` for cloud sync
- [x] Update `toggleActuator` to prefer cloud commands when a device is selected

## Phase 3: Dashboard — Connection Modal
- [ ] Update Cloud tab in `App.tsx` ConnectionModal — replace ngrok UI with:
  - Auto-discovered devices list (from RTDB)
  - One-click claim to user account
  - Gmail compose link with device ID

## Phase 11: Cloud Data Implementation
- [x] Integrate `subscribeToCloudTelemetry` into `App.tsx`
- [x] Fix `App.tsx` state management for selected cloud devices
- [x] Enable auto-switch to Live Mode upon cloud connection

## Phase 13: Advanced Connection Management
  - [x] Implement exclusive connection modes (Local vs Cloud)
  - [x] Add real-time status UI in header (Name + Latency)
  - [x] Implement local network discovery/scanning
  - [x] Persist last known IP and connection type

## Phase 14: Final Walkthrough & Documentation
  - [x] Generate comprehensive walkthrough.md
  - [x] Final UI/UX polish

## Phase 5: App.tsx
- [x] Update connection state to support chipId mode
- [x] Connection badge shows Local / Cloud / IP
## Phase 6: Stepper Motor (Shade Net)
- [x] Update ESP8266 sketch — move Stepper motor to native pins (D5, D6, D7, D8)
- [x] Implement `rotateStepper(int turns, bool clockwise)` logic (10 turn open/close)
- [x] Local state tracking (Open/Closed) to avoid repeated rotations
## Phase 10: Secure Device Provisioning (OTP)
- [x] Update ESP8266: Generate 6-digit OTP, display in Serial, sync to RTDB `/devices/{id}/status`
- [x] Update `deviceService.ts`: Add `claimDeviceWithOTP(deviceId, otp, uid)`
- [x] Add "Add Device" Modal to Dashboard with OTP verification
- [x] Update Firestore security rules to allow OTP-verified claiming
