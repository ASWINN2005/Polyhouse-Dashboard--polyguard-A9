import React, { useState, useEffect } from 'react';
import { X, Cpu, Wifi, WifiOff, Thermometer, Droplets, Sun, Wind, Leaf, Zap, Save, RotateCcw } from 'lucide-react';
import { AUTOMATION_THRESHOLDS } from '../services/actuatorAutomation';
import { updateSettings } from '../services/deviceService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isLiveMode: boolean;
  espIp: string;
  onThresholdsChange: (t: typeof AUTOMATION_THRESHOLDS) => void;
  currentThresholds: typeof AUTOMATION_THRESHOLDS;
  deviceName: string | null;
  chipId: string | null;
  onDeviceNameChange: (chipId: string, newName: string) => Promise<void>;
}

interface ThresholdSlider {
  key: keyof typeof AUTOMATION_THRESHOLDS;
  label: string;
  icon: React.ReactNode;
  unit: string;
  min: number;
  max: number;
  step: number;
  color: string;
  description: string;
}

const SLIDERS: ThresholdSlider[] = [
  // PUMP
  {
    key: 'soilMoistureMin', label: 'Pump ON below', icon: <Droplets size={16} />,
    unit: '%', min: 0, max: 100, step: 1, color: 'blue', description: 'Pump activates when soil drops below this'
  },
  {
    key: 'soilMoistureMax', label: 'Pump OFF above', icon: <Droplets size={16} />,
    unit: '%', min: 0, max: 100, step: 1, color: 'blue', description: 'Pump stops when soil reaches this'
  },
  // FAN
  {
    key: 'tempFanOn', label: 'Fan ON above (Temp)', icon: <Thermometer size={16} />,
    unit: '°C', min: 0, max: 100, step: 0.5, color: 'orange', description: 'Fan turns on when temp exceeds this'
  },
  {
    key: 'tempFanOff', label: 'Fan OFF below (Temp)', icon: <Thermometer size={16} />,
    unit: '°C', min: 0, max: 100, step: 0.5, color: 'orange', description: 'Fan turns off when temp drops below this'
  },
  {
    key: 'humidityFanOn', label: 'Fan ON above (Hum)', icon: <Wind size={16} />,
    unit: '%', min: 0, max: 100, step: 1, color: 'cyan', description: 'Fan turns on when humidity exceeds this'
  },
  {
    key: 'humidityFanOff', label: 'Fan OFF below (Hum)', icon: <Wind size={16} />,
    unit: '%', min: 0, max: 100, step: 1, color: 'cyan', description: 'Fan turns off when humidity drops below this'
  },
  // GROW LIGHTS
  {
    key: 'lightMin', label: 'Lights ON below', icon: <Zap size={16} />,
    unit: ' lx', min: 1, max: 4000, step: 1, color: 'yellow', description: 'Grow lights activate when natural light is dim'
  },
  {
    key: 'lightMax', label: 'Lights OFF above', icon: <Zap size={16} />,
    unit: ' lx', min: 1, max: 4000, step: 1, color: 'yellow', description: 'Grow lights turn off when there is enough natural light'
  },
  // SHADE NET
  {
    key: 'tempShadeOn', label: 'Shade Net Close above (Temp)', icon: <Sun size={16} />,
    unit: '°C', min: 0, max: 100, step: 0.5, color: 'red', description: 'Shade net deploys (shades) when temperature exceeds this'
  },
  {
    key: 'tempShadeOff', label: 'Shade Net Open below (Temp)', icon: <Sun size={16} />,
    unit: '°C', min: 0, max: 100, step: 0.5, color: 'red', description: 'Shade net retracts (sunlight) when temperature drops below this'
  },
];

const colorMap: Record<string, string> = {
  blue:   'accent-blue-500',
  orange: 'accent-orange-500',
  cyan:   'accent-cyan-500',
  yellow: 'accent-yellow-500',
  red:    'accent-red-500',
  green:  'accent-emerald-500',
};

const bgMap: Record<string, string> = {
  blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30 text-orange-700 dark:text-orange-300',
  cyan:   'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  red:    'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300',
  green:  'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

export const SystemSettings: React.FC<Props> = ({
  isOpen, onClose, isLiveMode, espIp, onThresholdsChange, currentThresholds,
  deviceName, chipId, onDeviceNameChange
}) => {
  const [draft, setDraft] = useState({ ...currentThresholds });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Rename state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(deviceName || '');

  useEffect(() => {
    if (isOpen) {
      setDraft({ ...currentThresholds });
      setTempName(deviceName || '');
    }
  }, [isOpen, deviceName]);

  const handleSaveName = async () => {
    if (!chipId || !tempName.trim()) return;
    try {
      await onDeviceNameChange(chipId, tempName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to rename device", err);
    }
  };

  if (!isOpen) return null;

  const isDirty = JSON.stringify(draft) !== JSON.stringify(currentThresholds);

  const handleSave = async () => {
    setSaving(true);
    try {
      onThresholdsChange(draft);
      // Also persist to Firebase RTDB settings if in live mode
      if (isLiveMode && chipId) {
        await updateSettings(chipId, draft);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setDraft({ ...AUTOMATION_THRESHOLDS });

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">System Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Automation thresholds & device info</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* ── Hardware Device Section ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Connected Hardware</h3>
              {isLiveMode && (
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                      <input
                        autoFocus
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className="text-xs font-bold px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-500 rounded-lg focus:outline-none w-32"
                      />
                      <button onClick={handleSaveName} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Save size={14} />
                      </button>
                      <button onClick={() => { setIsEditingName(false); setTempName(deviceName || ''); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg transition-all active:scale-95"
                    >
                      <Save size={10} className="opacity-70" /> Rename Device
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className={`rounded-2xl border p-4 flex items-center gap-4 transition-all ${
              isLiveMode
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'
                : 'bg-gray-50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-700 opacity-60'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isLiveMode ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-400'
              }`}>
                <Cpu size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  {deviceName || (isLiveMode ? 'Linked Device' : 'No Hardware')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-mono opacity-70">
                  {isLiveMode ? espIp : 'Connect your NodeMCU'}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${
                isLiveMode
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
              }`}>
                {isLiveMode ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
                {isLiveMode ? 'Live' : 'No Link'}
              </div>
            </div>
          </section>

          {/* ── Automation Thresholds Section ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Automation Thresholds</h3>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <RotateCcw size={11} /> Reset defaults
              </button>
            </div>

            <div className="space-y-3">
              {SLIDERS.map(slider => (
                <div key={slider.key} className={`rounded-2xl border p-4 ${bgMap[slider.color]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {slider.icon}
                      <span className="text-sm font-bold">{slider.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={draft[slider.key] === 0 ? "0" : draft[slider.key]}
                        onChange={e => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val)) val = 0;
                          setDraft(prev => ({ ...prev, [slider.key]: val }));
                        }}
                        className={`w-20 text-right bg-transparent border-b-2 border-transparent hover:border-gray-200 dark:hover:border-slate-600 outline-none focus:border-current font-black text-lg tabular-nums px-1 transition-all ${colorMap[slider.color].replace('accent-', 'text- focus:border-')}`}
                      />
                      <span className="text-sm font-black opacity-60 min-w-8">{slider.unit}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={draft[slider.key]}
                    onChange={e => setDraft(prev => ({ ...prev, [slider.key]: Number(e.target.value) }))}
                    className={`w-full h-2 rounded-full cursor-pointer ${colorMap[slider.color]}`}
                  />
                  <div className="flex justify-between text-[10px] opacity-60 mt-1">
                    <span>{slider.min}{slider.unit}</span>
                    <span className="text-center opacity-70">{slider.description}</span>
                    <span>{slider.max}{slider.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-700 shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
