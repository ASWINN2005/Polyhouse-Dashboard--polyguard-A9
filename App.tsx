import React, { useState, useEffect, useRef } from 'react';
import { SensorData, ActuatorState, DeviceRecord } from './types';
import { generateMockData } from './services/mockData';
import { getMockWeather, getLocalWeather } from './services/weatherService';
import { saveSensorHistory, loadSensorHistory } from './services/storageService';
import { ESP8266Service } from './services/liveApiService';
import { computeDesiredActuators, getChangedActuators, AUTOMATION_THRESHOLDS } from './services/actuatorAutomation';
import {
  claimDevice, claimDeviceWithOTP, releaseDevice, updateDeviceName,
  subscribeToUserDevices, subscribeToOnlineDevices, subscribeToCloudTelemetry,
  subscribeToActuatorState, sendActuatorCommand, tryLocalConnect, scanLocalDevices, updateSettings,
  subscribeToDeviceStatus
} from './services/deviceService';
import { SensorCard } from './components/SensorCard';
import { ControlPanel } from './components/ControlPanel';
import { EnvironmentalChart } from './components/EnvironmentalChart';
import { PolyhouseAIAdvisor } from "./components/PolyhouseAIAdvisor";
import { WeatherWidget } from './components/WeatherWidget';
import { PolyhouseVisualizer } from './components/PolyhouseVisualizer';
import { SystemSettings } from './components/SystemSettings';
import { UserProfile } from './components/UserProfile';
import LoginPage from './Login';
import {
  Thermometer, Droplets, Sun, Wind, Sprout, FlaskConical, CloudFog,
  Search, Bell, Moon, X, ChevronDown, ChevronUp, User, LogOut, Settings, LayoutDashboard, Wifi, Activity, BrainCircuit, BarChart3, Zap, MapPin, Calendar, Cloud, Link, History, ChevronRight,
  Download
} from 'lucide-react';
import { auth, googleProvider, db, rtdb } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { goOffline, goOnline } from 'firebase/database';
import { doc, setDoc } from 'firebase/firestore';




// --- Reusable Section Header ---
const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="h-10 w-1.5 bg-emerald-500 rounded-full shadow-sm"></div>
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
      <Icon size={28} className="text-gray-400 dark:text-slate-500" />
      {title}
    </h2>
  </div>
);

// --- Profile Modal ---
const ProfileModal = ({
  isOpen, onClose, user, onSignIn, onSignOut, onOpenSystemSettings, onOpenMyProfile,
  onInstallApp, installPromptAvailable
}: {
  isOpen: boolean;
  onClose: () => void;
  user: import('firebase/auth').User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSystemSettings: () => void;
  onOpenMyProfile: () => void;
  onInstallApp: () => void;
  installPromptAvailable: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 p-6 animate-in fade-in slide-in-from-top-4 duration-200 ring-1 ring-black/5">
      {user ? (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20 overflow-hidden shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User Profile" className="w-full h-full object-cover" />
              ) : (
                (user.displayName || user.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate" title={user.displayName || 'User'}>{user.displayName || 'User'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={user.email || ''}>{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { onClose(); onOpenMyProfile(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors text-base font-medium"
            >
              <User size={20} /> My Profile
            </button>
            <button
              onClick={() => { onClose(); onOpenSystemSettings(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors text-base font-medium"
            >
              <Settings size={20} /> System Settings
            </button>
            <button
              onClick={() => { onClose(); onInstallApp(); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold transition-colors text-base hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <Download size={20} /> Download Webapp
            </button>
            <div className="h-px bg-gray-100 dark:bg-slate-700 my-2"></div>
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-base font-medium"
            >
              <LogOut size={20} /> Sign Out
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center text-center mb-6 mt-2">
            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-400 mb-4 shadow-inner ring-1 ring-gray-100 dark:ring-slate-600">
              <User size={40} />
            </div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Welcome to PolyGuard</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to save settings, view history, and govern your smart system natively.</p>
          </div>
          <button
            onClick={onSignIn}
            className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors text-base font-bold shadow-lg shadow-blue-500/30"
          >
            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </>
      )}
      <button onClick={onClose} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

// --- Connection Modal ---
const ConnectionModal = ({
  isOpen, onClose, onConnect, currentIp, firebaseUser, setSelectedDeviceId, connectionType, onlineDevices
}: {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (ip: string, name?: string, type?: 'local' | 'cloud' | 'demo') => void;
  currentIp: string;
  firebaseUser: import('firebase/auth').User | null;
  setSelectedDeviceId: (id: string | null) => void;
  connectionType: 'local' | 'cloud' | 'demo' | null;
  onlineDevices: Array<{ chipId: string; ip: string; online: boolean; lastSeen: number }>;
}) => {
  const [ip, setIp] = useState(currentIp);
  const [mode, setMode] = useState<'demo' | 'local' | 'cloud'>(connectionType || 'demo');

  // Sync mode if connectionType changes externally
  useEffect(() => {
    if (connectionType) setMode(connectionType);
  }, [connectionType]);

  // Cloud tab state
  const [claimedDevices, setClaimedDevices] = useState<DeviceRecord[]>([]);
  const [foundLocalDevices, setFoundLocalDevices] = useState<Array<{ chipId: string; localIp: string }>>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [pairingStep, setPairingStep] = useState<'id' | 'otp'>('id');
  const [targetChipId, setTargetChipId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen || mode !== 'cloud') return;
    const unsubClaimed = firebaseUser
      ? subscribeToUserDevices(firebaseUser.uid, setClaimedDevices)
      : () => { };
    return () => { unsubClaimed(); };
  }, [isOpen, mode, firebaseUser]);

  if (!isOpen) return null;

  const modes = [
    { id: 'demo', label: 'Demo Mode', icon: '🎮', desc: 'Simulated sensor data' },
    { id: 'local', label: 'Local Network', icon: '📡', desc: 'ESP8266 on same WiFi' },
    { id: 'cloud', label: 'Cloud / Link', icon: '☁️', desc: 'Claim & manage devices' },
  ] as const;

  const handleConnect = () => {
    if (mode === 'demo') { onConnect('', 'Demo Mode', 'demo'); onClose(); }
    else if (mode === 'local' && ip.trim()) { onConnect(ip, 'Local Device', 'local'); onClose(); }
  };

  const handleDisconnect = () => {
    onConnect('', '', undefined);
  };

  const handleLocalScan = async () => {
    setIsScanning(true);
    try {
      if (ip.trim()) {
        const ok = await scanLocalDevices([{ chipId: 'unknown', ip }]);
        if (ok.length > 0) {
          setStatusMsg({ type: 'success', text: `Device reachable at ${ip}` });
          setIsScanning(false);
          return;
        }
      }

      const found = await scanLocalDevices(onlineDevices);
      setFoundLocalDevices(found);
      if (found.length > 0) {
        setIp(found[0].localIp);
        setStatusMsg({ type: 'success', text: `Found ${found.length} device(s) locally!` });
      } else {
        setStatusMsg({ type: 'error', text: "No local devices found. Check WiFi." });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleStartPairing = () => {
    if (!targetChipId.trim()) return;
    setPairingStep('otp');
    setStatusMsg(null);
  };

  const handleVerifyOTP = async () => {
    if (!firebaseUser || !targetChipId || !otpValue) return;
    setClaimingId(targetChipId);
    setStatusMsg(null);
    try {
      const result = await claimDeviceWithOTP(targetChipId, otpValue, firebaseUser.uid, firebaseUser.email ?? '');
      if (result.success) {
        setStatusMsg({ type: 'success', text: result.message });
        setPairingStep('id');
        setTargetChipId('');
        setOtpValue('');
      } else {
        setStatusMsg({ type: 'error', text: result.message });
      }
    } finally {
      setClaimingId(null);
    }
  };

  const handleConnectDevice = async (device: DeviceRecord) => {
    try {
      setConnectingId(device.chipId);
      const localHost = await tryLocalConnect(device.chipId);
      if (localHost) {
        onConnect(localHost, device.name, 'local');
      } else {
        onConnect(device.ip || 'cloud', device.name, 'cloud');
      }
      setSelectedDeviceId(device.chipId);
      onClose();
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-700 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1 pr-8">Hardware Integration</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Choose how you want to connect to your polyhouse system.</p>

        {connectionType && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
                {connectionType === 'local' ? '📡' : connectionType === 'cloud' ? '☁️' : '🎮'}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Currently Active</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {connectionType === 'demo' ? 'Demo Mode' : 'Polyhouse Linked'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-red-500/20"
            >
              Disconnect
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-6">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => {
                if (connectionType) return;
                setMode(m.id);
              }}
              disabled={!!connectionType && mode !== m.id}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center relative ${mode === m.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500'} 
                ${connectionType && mode !== m.id ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl">{m.icon}</span>
              <span className="text-xs font-bold">{m.label}</span>
              <span className="text-[10px] opacity-70">{m.desc}</span>
              {connectionType && mode === m.id && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] ring-2 ring-white dark:ring-slate-800">✓</div>
              )}
            </button>
          ))}
        </div>

        {connectionType && (
          <p className="text-center text-xs text-amber-600 dark:text-amber-400 mb-4 bg-amber-50 dark:bg-amber-900/20 py-2 rounded-lg font-medium">
            ⚠️ Please disconnect before switching modes.
          </p>
        )}

        {mode === 'demo' && (
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-6 text-center">
            <div className="text-3xl mb-2">🎮</div>
            <p className="font-bold text-gray-800 dark:text-white mb-1">Demo Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Simulated sensor data for exploring the dashboard without hardware.</p>
          </div>
        )}

        {mode === 'local' && (
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Local Discovery</p>
                </div>
                <button
                  onClick={handleLocalScan}
                  disabled={isScanning || !!connectionType}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  <Activity size={12} className={isScanning ? "animate-spin" : ""} />
                  {isScanning ? 'Scanning...' : 'Refresh Search'}
                </button>
              </div>

              <div className="space-y-3">
                {localStorage.getItem('polyguard_ip') && (
                  <div className="animate-in fade-in slide-in-from-left-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 tracking-wider">Last Connected</p>
                    <button
                      onClick={() => setIp(localStorage.getItem('polyguard_ip') || '')}
                      className="w-full text-left p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs flex justify-between items-center transition-all hover:border-emerald-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                          <History size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-700 dark:text-gray-200">{localStorage.getItem('polyguard_name') || 'Local Device'}</span>
                          <span className="text-[10px] opacity-60 font-mono">{localStorage.getItem('polyguard_ip')}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  </div>
                )}

                {foundLocalDevices.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-right-2 mt-4">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-2 ml-1 tracking-wider">Discovered Nearby</p>
                    <div className="space-y-3">
                      {foundLocalDevices.map(d => (
                        <div
                          key={d.chipId}
                          className="w-full flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500" />
                              <span className="font-bold text-blue-900 dark:text-blue-100">{d.chipId}</span>
                            </div>
                            <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 pl-4">{d.localIp}</span>
                          </div>

                          <button
                            onClick={() => {
                              onConnect(d.localIp, 'Local Device', 'local');
                              onClose();
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            Connect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1 tracking-wider">Manual Configuration</label>
              <div className="relative">
                <input
                  type="text" value={ip} onChange={e => setIp(e.target.value)}
                  placeholder="Enter IP (e.g. 192.168.1.50)"
                  className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  <Wifi size={20} />
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === 'cloud' && (
          <div className="space-y-4 mb-6">
            {!firebaseUser ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center text-sm text-amber-700 dark:text-amber-300">
                <div className="text-2xl mb-2">🔐</div>
                <p className="font-bold mb-1">Sign in required</p>
                <p>Sign in with Google to claim and manage your devices.</p>
              </div>
            ) : (
              <>
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Link size={16} className="text-purple-600" />
                    <p className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Add New Device</p>
                  </div>

                  {pairingStep === 'id' ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={targetChipId}
                        onChange={e => setTargetChipId(e.target.value)}
                        placeholder="Enter Device ID (e.g. PG-7A4B22)"
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:text-white font-mono"
                      />
                      <button
                        onClick={handleStartPairing}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-500/20"
                      >
                        Pair Device
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg mb-2">
                        Enter the 6-digit code shown on your <strong>Serial Monitor</strong>.
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpValue}
                        onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-Digit OTP"
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-xl text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPairingStep('id')}
                          className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleVerifyOTP}
                          disabled={otpValue.length < 6 || claimingId === targetChipId}
                          className="flex-[2] py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
                        >
                          {claimingId === targetChipId ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    </div>
                  )}

                  {statusMsg && (
                    <div className={`mt-3 p-2.5 rounded-xl text-xs font-medium text-center ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                      {statusMsg.text}
                    </div>
                  )}
                </div>

                {claimedDevices.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-2 ml-1">My Linked Devices</p>
                    <div className="space-y-2">
                      {claimedDevices.map(device => (
                        <div key={device.chipId} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                          <div>
                            <p className="font-bold text-gray-800 dark:text-white text-sm">{device.name}</p>
                            <p className="font-mono text-[10px] text-gray-400">{device.chipId}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConnectDevice(device)}
                              disabled={connectingId === device.chipId}
                              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {connectingId === device.chipId ? '...' : '📡 Connect'}
                            </button>
                            <button
                              onClick={() => releaseDevice(device.chipId)}
                              className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 text-xs shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-400">
                    <Zap size={14} className="fill-indigo-500/20" />
                    <strong className="font-bold uppercase tracking-wider">💡 How Cloud Sync Works:</strong>
                  </div>
                  <ul className="space-y-2 text-indigo-600 dark:text-indigo-300">
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-400">01.</span>
                      <span>Power on your NodeMCU. It will broadcast its <strong>Chip ID</strong> and a 6-digit <strong>OTP</strong> to the cloud.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-400">02.</span>
                      <span>Enter those credentials above to claim ownership. This securely links the device to your account.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-indigo-400">03.</span>
                      <span>Once linked, you can control your Polyhouse from **anywhere in the world** using our Google Cloud backend.</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {mode !== 'cloud' && (
          <button
            onClick={handleConnect}
            disabled={mode === 'local' && !ip.trim()}
            className={`w-full py-4 font-bold rounded-xl transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${mode === 'demo'
                ? 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
              }`}
          >
            {mode === 'demo' ? '▶ Launch Demo Mode' : '📡 Connect to Local Device'}
          </button>
        )}
      </div>
    </div>
  );
};


// --- Animated Digital Clock ---
const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return { hours, minutes, seconds };
  };

  const { hours, minutes, seconds } = formatTime(time);

  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 pl-3 pr-4 py-2 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm overflow-hidden group">
      <div className="flex items-center gap-1 font-mono text-sm tracking-widest text-gray-800 dark:text-gray-100">
        <span className="text-base font-bold">{hours}</span>
        <span className="animate-pulse text-emerald-500">:</span>
        <span className="text-base font-bold">{minutes}</span>
        <span className="animate-pulse text-emerald-500">:</span>
        <div className="relative h-6 w-6 overflow-hidden flex items-center justify-center">
          <span key={seconds} className="absolute animate-slide-up font-bold text-emerald-600 dark:text-emerald-400 text-base">
            {seconds}
          </span>
        </div>
      </div>
      <div className="w-px h-5 bg-gray-300 dark:bg-slate-600"></div>
      <div className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase tracking-wider">
        <Calendar size={14} className="text-indigo-500" />
        <span>{time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>
  );
};

// --- Search Highlighter Helper ---
const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/40 rounded px-0.5">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};


const App: React.FC = () => {
  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('polyguard_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const [showAllSensors, setShowAllSensors] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll Nav State
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Dropdown & Modal Management
  const [activeDropdown, setActiveDropdown] = useState<'none' | 'profile' | 'notifications'>('none');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(() => {
    return localStorage.getItem('polyguard_id');
  });

  // Connection State
  const [connectionType, setConnectionType] = useState<'demo' | 'local' | 'cloud' | null>(() => {
    return (localStorage.getItem('polyguard_type') as any) || null;
  });
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(() => {
    return localStorage.getItem('polyguard_name') || null;
  });
  const [espIp, setEspIp] = useState(() => {
    return localStorage.getItem('polyguard_ip') || '';
  });
  const [manualLocation, setManualLocation] = useState(() => {
    return localStorage.getItem('polyguard_manual_location') || null;
  });
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(() => {
    const type = localStorage.getItem('polyguard_type');
    return type === 'local' || type === 'cloud';
  });
  const [latency, setLatency] = useState(24);
  const [locationLabel, setLocationLabel] = useState('Locating...');
  const espService = useRef<ESP8266Service | null>(null);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [sessionStart] = useState(() => new Date());
  const [thresholds, setThresholds] = useState({ ...AUTOMATION_THRESHOLDS });

  const [actuators, setActuators] = useState<ActuatorState>({
    waterPump: false,
    fan: false,
    growLights: false,
    shadeNet: false,
    automationEnabled: false
  });
  const [isShadeMoving, setIsShadeMoving] = useState(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(0);
  const [isBrowserOnline, setIsBrowserOnline] = useState(window.navigator.onLine);

  const [onlineDevices, setOnlineDevices] = useState<Array<{ chipId: string; ip: string; online: boolean; lastSeen: number }>>([]);

  const [notifications, setNotifications] = useState<{ id: number; type: string; msg: string; time: string }[]>([]);
  const shadeNetTarget = useRef<boolean | null>(null);

  // 1. Initial State Load (Persistence)
  useEffect(() => {
    const savedIp = localStorage.getItem('polyguard_ip');
    const savedType = localStorage.getItem('polyguard_type') as any;
    const savedId = localStorage.getItem('polyguard_id');
    const savedName = localStorage.getItem('polyguard_name');

    if (savedType || savedIp) {
      // Still call handleConnect to initialize services (espService.current, etc.)
      handleConnect(savedIp || '', savedName || undefined, savedType || undefined);
      if (savedId) setSelectedDeviceId(savedId);
    } else {
      // Default to demo if nothing saved
      handleConnect('', 'Demo Mode', 'demo');
    }
  }, []);

  // 2. Global Subscription to Online Devices
  useEffect(() => {
    return subscribeToOnlineDevices(setOnlineDevices);
  }, []);

  // 3. Auth Effects & Handlers
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setAuthLoading(false);
    });

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert('💡 To download: Click your browser menu (⋮ or ⎙) and select "Add to Home Screen" or "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // --- 🌐 INTERNET CONNECTIVITY & FIREBASE SUPPRESSION ───
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      goOnline(rtdb);
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
      goOffline(rtdb);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!window.navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;

      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        name: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });

      setActiveDropdown('none');
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveDropdown('none');
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // Effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('polyguard_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('polyguard_theme', 'light');
    }
  }, [darkMode]);
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const scrollToRealTop = () => {
      // Scroll to absolute top
      window.scrollTo({ top: 0, behavior: "instant" });

      // Then force again after layout stabilizes (navbar height applied)
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    };

    scrollToRealTop();

    const timeout = setTimeout(scrollToRealTop, 150); // double guarantee

    return () => clearTimeout(timeout);
  }, []);



  const autoDiscoverLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (response.ok) {
              const data = await response.json();
              const placeName = data.address.city || data.address.town || data.address.village || data.address.suburb || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
              setLocationLabel(placeName);
            } else {
              throw new Error("Reverse geocoding failed");
            }
          } catch (error) {
            setLocationLabel(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`);
          }
        },
        () => setLocationLabel("N/A"),
        { timeout: 10000 }
      );
    } else {
      setLocationLabel("N/A");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Escape: Close open menus
      if (e.key === 'Escape') {
        setActiveDropdown('none');
        setShowConnectionModal(false);
        setShowSuggestions(false);
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }

      // 2. Search Shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Stop execution for letters if actively typing in an input field
      if (document.activeElement instanceof HTMLInputElement) return;

      // 3. Quick Actions
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        setDarkMode(prev => !prev);
      }
      if (e.shiftKey && e.key.toLowerCase() === 'p') {
        setActiveDropdown(prev => prev === 'profile' ? 'none' : 'profile');
      }
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        setActiveDropdown(prev => prev === 'notifications' ? 'none' : 'notifications');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (!manualLocation) {
      autoDiscoverLocation();
    } else {
      setLocationLabel(manualLocation);
    }

    getLocalWeather(manualLocation || undefined).then(setWeatherData);

    const savedHistory = loadSensorHistory();
    if (savedHistory.length > 0) {
      setDataHistory(savedHistory);
      setCurrentData(savedHistory[savedHistory.length - 1]);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- ☁️ FIREBASE CLOUD TELEMETRY SUBSCRIPTION ───
  useEffect(() => {
    if (!selectedDeviceId || connectionType !== 'cloud') return;

    const unsubscribe = subscribeToCloudTelemetry(selectedDeviceId, (data) => {
      if (data) {
        setCurrentData(data);
        setDataHistory(prev => {
          const updated = [...prev, data].slice(-20);
          saveSensorHistory(updated);
          return updated;
        });
      }
    });
    return () => {
      unsubscribe();
      setIsLiveMode(false);
    };
  }, [selectedDeviceId, connectionType]);

  // --- 📡 REAL CLOUD PING (RTT Measurement) ───
  useEffect(() => {
    if (connectionType !== 'cloud' || !selectedDeviceId) return;

    const ping = async () => {
      if (!isBrowserOnline || connectionType !== 'cloud') return;
      const start = Date.now();
      try {
        // Use a more robust, standard connectivity-check URL
        // Gstatic is widely used for this and reliably allows no-cors requests
        await fetch('https://www.gstatic.com/generate_204', { 
          mode: 'no-cors', 
          cache: 'no-store',
          priority: 'low'
        });
        setLatency(Date.now() - start);
      } catch (e) {
        console.warn("Ping failed, retrying...", e);
        // Fallback: If gstatic fails, show a simulated "healthy" cloud latency 
        // to prevent UI frustration while we await the next heartbeat
        setLatency(prev => prev === 999 ? 120 : prev); 
      }
    };

    const interval = setInterval(ping, 10000);
    ping();
    return () => clearInterval(interval);
  }, [connectionType, selectedDeviceId]);

  // --- ☁️ FIREBASE CLOUD ACTUATOR SYNC ───
  useEffect(() => {
    if (!selectedDeviceId) return;

    const unsubscribeState = subscribeToActuatorState(selectedDeviceId, (state) => {
      setActuators(prev => {
        // Strict Hardware ACK: Only clear "moving" if the state matches our target
        if (state.shadeNet !== undefined && state.shadeNet === shadeNetTarget.current) {
          setIsShadeMoving(false);
          shadeNetTarget.current = null;
        }
        return { ...prev, ...state };
      });
    });

    const unsubscribeStatus = subscribeToDeviceStatus(selectedDeviceId, (status) => {
      setIsDeviceOnline(status.online);
      setLastHeartbeat(Date.now()); // Use local time instead of device uptime
    });

    return () => {
      unsubscribeState();
      unsubscribeStatus();
    };
  }, [selectedDeviceId]);

  // --- 🛡️ UX SAFETY FAILSAFES ───
  useEffect(() => {
    if (!isShadeMoving) return;
    // Safety timeout: Reset "Moving..." after 60s if hardware fails to ACK
    const timer = setTimeout(() => {
      setIsShadeMoving(false);
      shadeNetTarget.current = null;
    }, 60000);
    return () => clearTimeout(timer);
  }, [isShadeMoving]);

  // --- 🔌 LOCAL HARDWARE ACTUATOR SYNC ───
  useEffect(() => {
    if (connectionType !== 'local' || !espService.current) return;

    // Fetch initial state from hardware when we first connect locally
    espService.current.fetchActuatorState().then(state => {
      if (state) {
        console.log("🔌 [LOCAL SYNC] Fetching initial actuator state:", state);
        setActuators(prev => ({ ...prev, ...state }));
      }
    }).catch(e => console.error("🔌 [LOCAL SYNC] Failed to fetch initial state:", e));
  }, [connectionType, espService.current]);

  // --- Deferred Manual Override Notifications ---
  const conditionStats = useRef<Record<string, { startTime: number; hasSentAlert: boolean }>>({});
  
  useEffect(() => {
    if (!currentData) return;
    
    // Rule: only alert if AUTOMATION IS DISABLED
    if (actuators.automationEnabled) {
       conditionStats.current = {};
       return;
    }

    const now = Date.now();
    const newAlerts: any[] = [];
    const FIVE_MINUTES = 5 * 60 * 1000;
    
    const checkCondition = (
      key: string, 
      needsAction: boolean, 
      actuatorIsRunning: boolean, 
      type: string, 
      msg: string
    ) => {
      // Is action needed but the actuator is OFF?
      if (needsAction && !actuatorIsRunning) {
        if (!conditionStats.current[key]) {
          conditionStats.current[key] = { startTime: now, hasSentAlert: false };
        } else if (
          !conditionStats.current[key].hasSentAlert && 
          now - conditionStats.current[key].startTime >= FIVE_MINUTES
        ) {
           newAlerts.push({ 
             id: now + Math.random(), 
             type, 
             msg, 
             time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
           });
           conditionStats.current[key].hasSentAlert = true;
        }
      } else {
        // Condition resolved OR actuator was manually turned on
        delete conditionStats.current[key];
      }
    };

    checkCondition(
      'temp_hot', 
      currentData.temperature > thresholds.tempFanOn, 
      actuators.fan, 
      'warning', 
      `Action Needed: Temp High (${currentData.temperature.toFixed(1)}°C) for 5 mins. Please turn ON Fans.`
    );
    
    checkCondition(
      'soil_dry', 
      currentData.soilMoisture < thresholds.soilMoistureMin, 
      actuators.waterPump, 
      'warning', 
      `Action Needed: Soil Dry (${currentData.soilMoisture.toFixed(0)}%) for 5 mins. Please start Pump.`
    );

    if (newAlerts.length > 0) {
      setNotifications(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  }, [currentData, actuators, thresholds]);

  // --- Scroll Direction Hook ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false); // scrolling down
      } else {
        setIsNavVisible(true); // scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (dataHistory.length > 0) {
      saveSensorHistory(dataHistory);
    }
  }, [dataHistory]);

  const handleConnect = (ip: string, name?: string, type?: 'local' | 'cloud' | 'demo') => {
    // 1. Reset / Disconnect
    if (!ip && !type) {
      setEspIp('');
      setIsLiveMode(false);
      espService.current = null;
      setSelectedDeviceId(null);
      setConnectionType(null);
      setConnectedDeviceName(null);

      localStorage.removeItem('polyguard_ip');
      localStorage.removeItem('polyguard_type');
      localStorage.removeItem('polyguard_id');
      localStorage.removeItem('polyguard_name');
      return;
    }

    // Persist
    if (ip !== undefined) localStorage.setItem('polyguard_ip', ip);
    if (type) localStorage.setItem('polyguard_type', type);
    if (name) localStorage.setItem('polyguard_name', name);

    // 2. Local IP Connection
    if (type === 'local' || (!type && ip.length > 5)) {
      setEspIp(ip);
      setIsLiveMode(true);
      setConnectionType('local');
      setConnectedDeviceName(name || 'Local ESP8266');
      espService.current = new ESP8266Service(ip);
      setDataHistory([]);
      setSelectedDeviceId(null);
      localStorage.removeItem('polyguard_id');
      localStorage.setItem('polyguard_type', 'local'); // Ensure type is saved
    }
    // 3. Demo Mode
    else if (type === 'demo' || (type === null && !ip)) {
      setEspIp('');
      setIsLiveMode(false);
      setConnectionType('demo');
      setConnectedDeviceName('Demo Mode');
      espService.current = null;
      setSelectedDeviceId(null);
      localStorage.setItem('polyguard_type', 'demo'); // Ensure type is saved
    }
    // 4. Cloud Mode
    else if (type === 'cloud') {
      setIsLiveMode(true);
      setConnectionType('cloud');
      setConnectedDeviceName(name || 'Cloud Device');
      setEspIp('');
      espService.current = null;
      localStorage.setItem('polyguard_type', 'cloud'); // Ensure type is saved
    }
  };

  useEffect(() => {
    if (selectedDeviceId) {
      localStorage.setItem('polyguard_id', selectedDeviceId);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    const tick = async () => {
      let newData: SensorData | null = null;
      const start = Date.now();

      if (isLiveMode && espService.current) {
        // Fetch Live Data
        try {
          const res = await espService.current.fetchSensorData();
          if (res) {
            newData = res.sensors;
            const latencyVal = Date.now() - start;
            setLatency(latencyVal);

            // Local Actuator Sync (Acknowledgement for Local Mode)
            if (res.actuators) {
              setActuators(prev => {
                // If we match target state, stop moving
                if (res.actuators.shadeNet !== undefined && res.actuators.shadeNet === shadeNetTarget.current) {
                  setIsShadeMoving(false);
                  shadeNetTarget.current = null;
                }
                return { ...prev, ...res.actuators };
              });
            }
          }
        } catch (e) {
          console.error("Live fetch failed", e);
        }
      }

      // Fallback to Mock if live fails or disabled
      if (!newData) {
        if (connectionType === 'local') {
          setLatency(999); // Indication of failure for Local network
        } else if (connectionType === 'demo') {
          setLatency(Math.max(12, Math.min(60, 24 + (Math.random() - 0.5) * 10)));
        }
        // In Cloud mode, we let the stream callback manage the latency from updates

        if (!isLiveMode) {
          newData = generateMockData(currentData);
        }
      }

      if (newData) {
        setCurrentData(prev => {
          setDataHistory(history => {
            const newHistory = [...history, newData!];
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
          });
          return newData;
        });
      }
    };

    if (!currentData) tick();
    const interval = setInterval(tick, isLiveMode ? 4000 : 3000);
    return () => clearInterval(interval);
  }, [actuators.automationEnabled, isLiveMode, espIp]);

  // --- 🤖 AUTO AI CONTROLLER (Works for Local & Cloud) ---
  useEffect(() => {
    if (!actuators.automationEnabled || !currentData) return;

    const desired = computeDesiredActuators(currentData, actuators, thresholds);
    const changes = getChangedActuators(actuators, desired);
    const changeKeys = Object.keys(changes) as (keyof typeof changes)[];

    if (changeKeys.length > 0) {
      console.log("🤖 Auto AI Checking...", { current: currentData, desired, changes });

      // Update local state immediately for snappy UI
      setActuators(prev => ({ ...prev, ...desired }));

      // Dispatch commands
      changeKeys.forEach(async (key) => {
        const val = changes[key] as boolean;
        console.log(`📡 AI Dispatching: ${key} -> ${val}`);

        // Mode A: Local Network
        if (connectionType === 'local' && espService.current) {
          try { await espService.current.toggleActuator(key, val); }
          catch (e) { console.error(`Local Auto-AI failed for ${key}:`, e); }
        }

        // Mode B: Cloud / Global
        else if (connectionType === 'cloud' && selectedDeviceId) {
          try { await sendActuatorCommand(selectedDeviceId, key as any, val); }
          catch (e) { console.error(`Cloud Auto-AI failed for ${key}:`, e); }
        }
      });
    }
  }, [currentData, actuators, connectionType, selectedDeviceId, thresholds]);

  const handleUpdateLocation = async (newLocation: string) => {
    setIsEditingLocation(false);
    if (!newLocation.trim()) {
      setManualLocation(null);
      localStorage.removeItem('polyguard_manual_location');
      autoDiscoverLocation();
      const w = await getLocalWeather();
      setWeatherData(w);
      return;
    }

    setManualLocation(newLocation);
    localStorage.setItem('polyguard_manual_location', newLocation);
    setLocationLabel(newLocation);
    
    try {
      const w = await getLocalWeather(newLocation);
      setWeatherData(w);
    } catch (e) {
      console.error("Failed to update manual weather:", e);
    }
  };

  const toggleActuator = async (key: keyof ActuatorState, forceState?: boolean) => {
    const newState = forceState !== undefined ? forceState : !actuators[key];

    // 1. Optimistic UI update
    setActuators(prev => ({ ...prev, [key]: newState }));

    // 2. Intercept global Automation toggle to save to Settings instead of Controls
    if (key === 'automationEnabled') {
      if (selectedDeviceId) { // Works in both Cloud and Local so long as a device is claimed
        try { await updateSettings(selectedDeviceId, { automationEnabled: newState }); }
        catch (e) { console.error("Failed to sync automation setting to cloud:", e); }
      }
      return;
    }

    // 3. Dispatch physical relay commands based on active connection mode
    try {
      if (connectionType === 'local' && espService.current) {
        console.log(`🔌 [LOCAL CONTROL] Sending: ${key} -> ${newState}`);
        await espService.current.toggleActuator(key, newState);
      }
      else if (connectionType === 'cloud' && selectedDeviceId) {
        console.log(`☁️ [CLOUD CONTROL] Sending: ${key} -> ${newState} to ${selectedDeviceId}`);
        await sendActuatorCommand(selectedDeviceId, key as any, newState);
      }
      else {
        console.log(`🧪 [OFFLINE MODE] State toggled locally`);
      }
    } catch (err) {
      console.error("Manual control failed, reverting state", err);
      // Revert state if the command fails
      setActuators(prev => ({ ...prev, [key]: !newState }));
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 180;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const toggleDropdown = (type: 'profile' | 'notifications') => {
    setActiveDropdown(prev => prev === type ? 'none' : type);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // --- RENDERING GATE ---

  // 1. Check Auth Loading
  if (authLoading) return (
    <div className="h-screen flex flex-col gap-4 items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="font-bold text-base tracking-widest animate-pulse">AUTHENTICATING...</div>
    </div>
  );

  // 2. Enforce Login Screen
  if (!firebaseUser) {
    return <LoginPage onSignIn={handleGoogleSignIn} />;
  }

  // 3. System Data Loading
  if (!currentData || !weatherData) return (
    <div className="h-screen flex flex-col gap-4 items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="font-bold text-base tracking-widest animate-pulse">CONNECTING SYSTEM...</div>
    </div>
  );

  const sensorsConfig = [
    { label: "Temperature", value: currentData.temperature, unit: "°C", icon: Thermometer, color: "orange", trend: "up", isAdvanced: false },
    { label: "Humidity", value: currentData.humidity, unit: "%", icon: Wind, color: "blue", trend: "stable", isAdvanced: false },
    { label: "Soil Moisture", value: currentData.soilMoisture, unit: "%", icon: Droplets, color: "blue", trend: "down", isAdvanced: false },
    { label: "Light Intensity", value: currentData.lightIntensity, unit: "Lx", icon: Sun, color: "yellow", trend: "stable", isAdvanced: false }
  ];

  const searchSuggestions = [
    ...sensorsConfig.map(s => ({ type: 'Sensor', label: s.label, id: 'sensors', icon: s.icon })),
    { type: 'Control', label: 'Water Pump', id: 'controls', icon: Droplets },
    { type: 'Control', label: 'Fan', id: 'controls', icon: Wind },
    { type: 'Control', label: 'Grow Lights', id: 'controls', icon: Sun },
    { type: 'Data', label: 'Charts', id: 'data', icon: BarChart3 },
    { type: 'AI', label: 'Crop Doctor', id: 'ai', icon: BrainCircuit },
  ].filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedSensors = [...sensorsConfig].sort((a, b) => {
    if (!searchQuery) return 0;
    const aMatch = a.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const bMatch = b.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => Math.min(prev + 1, searchSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && searchSuggestions[activeSuggestionIndex]) {
        const item = searchSuggestions[activeSuggestionIndex];
        setSearchQuery(item.label);
        scrollToSection(item.id);
      }
    }
  };

  const navItems = [
    { name: 'Home', id: 'home', icon: LayoutDashboard },
    { name: 'Controls', id: 'controls', icon: Zap },
    { name: 'Sensors', id: 'sensors', icon: FlaskConical },
    { name: 'Environmental Data', id: 'data', icon: BarChart3 },
    { name: 'AI Assistant', id: 'ai', icon: BrainCircuit }
  ];

  const handleUpdateDeviceName = async (id: string, newName: string) => {
    try {
      await updateDeviceName(id, newName);
      setConnectedDeviceName(newName);
      localStorage.setItem('polyguard_name', newName);
    } catch (err) {
      console.error("Renaming failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300 font-sans text-gray-800 dark:text-gray-100 flex flex-col overflow-x-hidden">

      {/* --- CONNECTION MODAL --- */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onConnect={handleConnect}
        currentIp={espIp}
        firebaseUser={firebaseUser}
        setSelectedDeviceId={setSelectedDeviceId}
        connectionType={connectionType}
        onlineDevices={onlineDevices}
      />

      {/* --- SYSTEM SETTINGS --- */}
      <SystemSettings
        isOpen={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
        isLiveMode={isLiveMode}
        espIp={espIp}
        currentThresholds={thresholds}
        onThresholdsChange={setThresholds}
        deviceName={connectedDeviceName}
        chipId={selectedDeviceId}
        onDeviceNameChange={handleUpdateDeviceName}
      />


      {/* --- USER PROFILE --- */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={firebaseUser}
        installPromptAvailable={!!deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      {/* --- NAVBAR --- */}
      <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-wrap items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700/50 gap-y-3 gap-x-4">

            <div className="flex items-center gap-4 shrink-0 cursor-pointer group" onClick={() => scrollToSection('home')}>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <Sprout className="text-white" size={28} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">PolyGuard</h1>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Smart IoT System</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 lg:gap-5 text-sm font-medium text-gray-500 dark:text-gray-400 grow md:grow-0">

              <div className="hidden lg:flex items-center gap-3 bg-white dark:bg-slate-700/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm transition-all hover:border-emerald-200 dark:hover:border-emerald-800">
                <div className="flex items-center gap-2 border-r border-gray-200 dark:border-slate-600 pr-3">
                  <MapPin size={16} className={`${manualLocation ? 'text-emerald-500' : 'text-indigo-500'}`} />
                  {isEditingLocation ? (
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter City..."
                      className="bg-transparent border-none outline-none text-[12px] font-bold text-gray-800 dark:text-white w-[100px]"
                      onBlur={(e) => handleUpdateLocation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateLocation((e.target as HTMLInputElement).value);
                        if (e.key === 'Escape') setIsEditingLocation(false);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 group/loc">
                      <span 
                        className="font-bold text-gray-700 dark:text-gray-300 tabular-nums truncate max-w-[120px] cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" 
                        onClick={() => setIsEditingLocation(true)}
                        title={manualLocation ? "Manual Location: Click to Change" : "Automatic Location: Click to Override"}
                      >
                        {locationLabel}
                      </span>
                      {manualLocation && (
                        <button 
                          onClick={() => handleUpdateLocation('')}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Clear Manual Location"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-1">
                  <Cloud size={16} className="text-sky-500" />
                  <span className="font-bold text-gray-800 dark:text-white">{weatherData?.current?.temp ?? '--'}°C</span>
                </div>
              </div>

              <div className="hidden md:block">
                <DigitalClock />
              </div>

              {/* Connection Status Button */}
              <button
                onClick={() => setShowConnectionModal(true)}
                className={`flex items-center gap-4 px-4 py-2.5 rounded-2xl border shadow-sm transition-all hover:scale-[1.02] active:scale-95 group ${connectionType === 'demo' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 text-amber-600' :
                    connectionType === 'cloud' ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20 text-purple-600' :
                      connectionType === 'local' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-600' :
                        'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-500'
                  } ${latency > 500 && connectionType ? '!bg-red-50 dark:!bg-red-900/10 !border-red-100 dark:!border-red-900/20 !text-red-600' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shadow-sm ring-1 ring-black/5 transition-all duration-300 ${isDeviceOnline
                      ? (Date.now() - lastHeartbeat > 15000 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse')
                      : 'bg-red-500'
                    } text-white`}>
                    {connectionType === 'cloud' ? <Cloud size={16} /> : <Wifi size={16} />}
                  </div>
                  <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${!isDeviceOnline ? 'text-red-500' :
                        (Date.now() - lastHeartbeat > 15000 ? 'text-amber-500' : 'text-emerald-500')
                      }`}>
                      {!isDeviceOnline ? 'Device Offline' :
                        (Date.now() - lastHeartbeat > 15000 ? 'Stale Connection' : (connectionType === 'cloud' ? 'Cloud Online' : 'Local Link'))
                      }
                    </span>
                    <span className="hidden xl:inline font-extrabold text-sm tracking-tight text-gray-800 dark:text-gray-100">
                      {connectedDeviceName || 'Disconnected'}
                    </span>
                  </div>
                </div>
                {connectionType && connectionType !== 'demo' && (
                  <>
                    <div className="hidden sm:block w-px h-6 bg-current opacity-10 mx-1"></div>
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-lg">
                      <Activity size={14} className="opacity-70" />
                      <span className="tabular-nums font-bold text-xs">{isDeviceOnline ? Math.min(latency, 999) : 999}ms</span>
                    </div>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-slate-700">
                <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-600 dark:text-gray-300 ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-slate-600" title="Toggle Theme">
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('notifications')}
                    className={`p-2.5 rounded-full transition-colors ${activeDropdown === 'notifications' ? 'bg-gray-100 dark:bg-slate-700 text-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    title="Notifications"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>}
                  </button>
                  {activeDropdown === 'notifications' && (
                    <div className="absolute top-14 right-0 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 p-2 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Alerts</h4>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearNotifications}
                            className="text-[11px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 flex items-center gap-1.5 px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                          >
                            <X size={14} /> Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                          <div key={n.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors group mb-1 last:mb-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${n.type === 'warning' ? 'bg-orange-100 text-orange-600' : n.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{n.type}</span>
                              <span className="text-[11px] text-gray-400">{n.time}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{n.msg}</p>
                          </div>
                        )) : (
                          <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('profile')}
                    className={`w-10 h-10 rounded-full ${firebaseUser ? 'bg-gray-100 dark:bg-slate-700' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400'} border-2 border-white dark:border-slate-700 font-bold text-sm flex items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-sm overflow-hidden`}
                  >
                    {firebaseUser?.photoURL ? (
                      <img src={firebaseUser.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : firebaseUser?.displayName ? (
                      firebaseUser.displayName.charAt(0).toUpperCase()
                    ) : (
                      'PG'
                    )}
                  </button>
                  <ProfileModal
                    isOpen={activeDropdown === 'profile'}
                    onClose={() => setActiveDropdown('none')}
                    user={firebaseUser}
                    onSignIn={handleGoogleSignIn}
                    onSignOut={handleSignOut}
                    onOpenSystemSettings={() => setShowSystemSettings(true)}
                    onOpenMyProfile={() => setShowUserProfile(true)}
                    onInstallApp={handleInstallApp}
                    installPromptAvailable={!!deferredPrompt}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            <nav className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-start">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all whitespace-nowrap group active:scale-95 border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
                >
                  <item.icon size={18} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  {item.name}
                </button>
              ))}
            </nav>

            <div className="relative w-full md:w-auto md:min-w-[400px] group z-40">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search sensors, controls... (Cmd+K)"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setActiveSuggestionIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                className="block w-full pl-11 pr-12 py-3 bg-gray-100 dark:bg-slate-700/50 border border-transparent focus:border-emerald-500/30 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:text-white shadow-inner focus:shadow-lg"
                autoComplete="off"
              />

              {!searchQuery && (
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <span className="text-xs text-gray-400 border border-gray-200 dark:border-slate-600 rounded px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700">⌘K</span>
                </div>
              )}

              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}

              {showSuggestions && searchQuery && searchSuggestions.length > 0 && (
                <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                  <div className="max-h-80 overflow-y-auto">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-700">Best Matches</div>
                    {searchSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item.label);
                          scrollToSection(item.id);
                        }}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0 group 
                               ${idx === activeSuggestionIndex ? 'bg-emerald-50 dark:bg-slate-700 ring-inset ring-l-4 ring-emerald-500' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                      >
                        <div className={`p-2.5 rounded-xl transition-colors shadow-sm ${idx === activeSuggestionIndex ? 'bg-white dark:bg-slate-600 text-emerald-500' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                          <item.icon size={18} />
                        </div>
                        <div>
                          <div className={`text-base font-semibold transition-colors ${idx === activeSuggestionIndex ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-800 dark:text-gray-200'}`}>
                            <HighlightMatch text={item.label} query={searchQuery} />
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">{item.type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* --- OFFLINE NOTIFICATION --- */}
      {!isBrowserOnline && connectionType === 'cloud' && (
        <div className="bg-red-600 text-white py-3 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300 relative z-50">
          <Zap size={18} className="animate-pulse" />
          <p className="text-sm font-bold tracking-wide">
            Internet Disconnected. Cloud Mode is paused. 
            <span className="hidden sm:inline opacity-80 font-medium ml-2">Connect to Wi-Fi to resume sync.</span>
          </p>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-24 flex-grow">

        {/* 1. VISUALIZER & CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* HOME (VISUALIZER) */}
          <section id="home" className="lg:col-span-2 scroll-mt-48 flex flex-col h-full">
            <SectionHeader title="Polyhouse Command Center" icon={LayoutDashboard} />
            <div className="flex-1 min-h-[500px] transition-all duration-300">
              <PolyhouseVisualizer
                actuators={actuators}
                lightIntensity={currentData.lightIntensity}
                weatherCondition={weatherData.current.condition}
                timestamp={new Date()}
                darkMode={darkMode}
              />
            </div>
          </section>

          {/* CONTROLS */}
          <section id="controls" className="lg:col-span-1 scroll-mt-48 flex flex-col h-full">
            <SectionHeader title="Actuator Controls" icon={Zap} />
            <div className="flex-1">
              <ControlPanel 
                state={actuators} 
                onToggle={toggleActuator} 
                searchQuery={searchQuery} 
                isShadeMoving={isShadeMoving} 
                isOffline={!isDeviceOnline || (Date.now() - lastHeartbeat > 20000)}
              />
            </div>
          </section>
        </div>

        {/* 2. SENSORS (Focus Mode) */}
        <section id="sensors" className="scroll-mt-48 transition-all">
          <div className="flex items-center justify-between mb-8">
            <SectionHeader title="Sensor Metrics" icon={FlaskConical} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedSensors.map((s, idx) => {
              const matchesSearch = searchQuery && s.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
              const blurClass = searchQuery && !matchesSearch ? 'opacity-20 blur-sm grayscale scale-95' : 'opacity-100 scale-100';

              return (
                <div key={idx} className={`transition-all duration-500 ease-out ${blurClass}`}>
                  <SensorCard
                    label={s.label}
                    value={s.value}
                    unit={s.unit}
                    icon={s.icon}
                    color={s.color}
                    trend={s.trend as any}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. ANALYTICS & DATA */}
        <section id="data" className="scroll-mt-48">
          <SectionHeader title="Environmental Data Analysis" icon={BarChart3} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">

            {/* LEFT SIDE — CHART */}
            <div className="lg:col-span-2 mb-8 lg:mb-0">
              <div className="w-full h-[450px] min-h-[350px]">
                <EnvironmentalChart data={dataHistory} />
              </div>
            </div>

            {/* RIGHT SIDE — WEATHER */}
            <div className="lg:col-span-1 h-[450px]">
              <WeatherWidget data={weatherData} />
            </div>

          </div>
        </section>


        {/* 4. AI SECTION */}
        <section id="ai" className="scroll-mt-48 pb-12">
          <SectionHeader title="Agronomist AI Assistant" icon={BrainCircuit} />
          <PolyhouseAIAdvisor 
            currentData={currentData} 
            weather={weatherData} 
            actuators={actuators} 
            thresholds={thresholds} 
            onToggleActuator={toggleActuator} 
            isDeviceOnline={isDeviceOnline}
            locationName={locationLabel}
            latency={latency}
          />
        </section>

      </main>

      <footer className="border-t border-gray-200 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Sprout size={24} />
            </div>
            <div>
              <p className="text-base font-black text-gray-800 dark:text-gray-100 italic tracking-tight">Automated Smart Polyhouse Control System</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mt-1">Management Dashboard: PolyGuard</p>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 dark:border-slate-800/50">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
              Developed & Engineered by <a href="/Team-A9-Details.html" className="text-emerald-600 hover:text-emerald-700 underline decoration-2 decoration-emerald-500/30 underline-offset-4 transition-all">Team A9 @ KEC</a>
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-4 tracking-widest uppercase">
              © 2026 PolyGuard IoT Core. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
export interface WeatherData {
  current: {
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
    humidity: number;
    windSpeed: number;
  };
  forecast: {
    day: string;
    temp: number;
    condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
  }[];
}
