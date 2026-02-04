import React, { useState, useEffect, useRef } from 'react';
import { SensorData, ActuatorState } from './types';
import { generateMockData } from './services/mockData';
import { getMockWeather } from './services/weatherService';
import { saveSensorHistory, loadSensorHistory } from './services/storageService';
import { ESP8266Service } from './services/liveApiService';
import { SensorCard } from './components/SensorCard';
import { ControlPanel } from './components/ControlPanel';
import { EnvironmentalChart } from './components/EnvironmentalChart';
import { PolyhouseAIAdvisor } from "./components/PolyhouseAIAdvisor";
import { WeatherWidget } from './components/WeatherWidget';
import { PolyhouseVisualizer } from './components/PolyhouseVisualizer';
import { 
  Thermometer, Droplets, Sun, Wind, Sprout, FlaskConical, CloudFog, 
  Search, Bell, Moon, X, ChevronDown, ChevronUp, User, LogOut, Settings, LayoutDashboard, Wifi, Activity, BrainCircuit, BarChart3, Zap, MapPin, Calendar, Cloud, Link
} from 'lucide-react';


 

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
const ProfileModal = ({ isOpen, onClose, darkMode }: { isOpen: boolean; onClose: () => void; darkMode: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute top-14 right-0 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 p-6 animate-in fade-in slide-in-from-top-4 duration-200 ring-1 ring-black/5">
      <div className="flex items-center gap-4 mb-6">
         <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
           PG
         </div>
         <div>
           <h3 className="font-bold text-lg text-gray-800 dark:text-white">Admin User</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400">polyhouse_admin@iot.com</p>
         </div>
      </div>
      
      <div className="space-y-3">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors text-base font-medium">
          <User size={20} /> My Profile
        </button>
        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors text-base font-medium">
          <Settings size={20} /> System Settings
        </button>
        <div className="h-px bg-gray-100 dark:bg-slate-700 my-2"></div>
        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-base font-medium">
          <LogOut size={20} /> Sign Out
        </button>
      </div>
      <button onClick={onClose} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

// --- Connection Modal ---
const ConnectionModal = ({ isOpen, onClose, onConnect, currentIp }: { isOpen: boolean, onClose: () => void, onConnect: (ip: string) => void, currentIp: string }) => {
  const [ip, setIp] = useState(currentIp);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Connect to Hardware</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Enter the IP address shown on your Arduino Serial Monitor (e.g., 192.168.1.15).
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">ESP32 IP Address</label>
            <input 
              type="text" 
              value={ip} 
              onChange={(e) => setIp(e.target.value)} 
              placeholder="192.168.x.x"
              className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-mono text-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
            />
          </div>
          
          <button 
            onClick={() => { onConnect(ip); onClose(); }}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/30"
          >
            Connect to Device
          </button>
          
          <button 
            onClick={() => { onConnect(''); onClose(); }}
            className="w-full py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium"
          >
            Use Demo Mode (Mock Data)
          </button>
        </div>
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
  // State
  const [darkMode, setDarkMode] = useState(false);
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  const [showAllSensors, setShowAllSensors] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Dropdown & Modal Management
  const [activeDropdown, setActiveDropdown] = useState<'none' | 'profile' | 'notifications'>('none');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  
  // Connection State
  const [espIp, setEspIp] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [latency, setLatency] = useState(24);
  const [locationLabel, setLocationLabel] = useState('Locating...');
const espService = useRef<ESP8266Service | null>(null);
  
  const [actuators, setActuators] = useState<ActuatorState>({
    waterPump: false,
    fan: false,
    growLights: false,
    shadeNet: false,
    automationEnabled: false
  });

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', msg: 'High temperature detected (32°C)', time: '2m ago' },
    { id: 2, type: 'info', msg: 'Irrigation cycle completed', time: '1h ago' },
    { id: 3, type: 'success', msg: 'System backed up to cloud', time: '3h ago' },
  ]);

  // Effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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



  useEffect(() => {
    window.scrollTo(0, 0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

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

    setWeatherData(getMockWeather());
    const savedHistory = loadSensorHistory();
    if (savedHistory.length > 0) {
      setDataHistory(savedHistory);
      setCurrentData(savedHistory[savedHistory.length - 1]);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (dataHistory.length > 0) {
      saveSensorHistory(dataHistory);
    }
  }, [dataHistory]);

  const handleConnect = (ip: string) => {
    if (ip && ip.length > 5) {
      setEspIp(ip);
      setIsLiveMode(true);
espService.current = new ESP8266Service(ip);
      // Clear history when switching modes for clean graph
      setDataHistory([]); 
    } else {
      setEspIp('');
      setIsLiveMode(false);
      espService.current = null;
    }
  };

  useEffect(() => {
    const tick = async () => {
      let newData: SensorData | null = null;
      const start = Date.now();

      if (isLiveMode && espService.current) {
        // Fetch Live Data
        try {
          newData = await espService.current.fetchSensorData();
          const latencyVal = Date.now() - start;
          setLatency(latencyVal);
        } catch (e) {
          console.error("Live fetch failed", e);
        }
      } 
      
      // Fallback to Mock if live fails or disabled
      if (!newData) {
        if (isLiveMode) setLatency(999); // Indication of failure
        else setLatency(Math.max(12, Math.min(60, 24 + (Math.random() - 0.5) * 10)));
        
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

          // Automation Logic (runs on Frontend for Demo, but in Live mode, ESP32 handles safety usually)
          if (actuators.automationEnabled && !isLiveMode) {
            setActuators(prev => ({
              ...prev,
              waterPump: newData!.soilMoisture < 30, 
              fan: newData!.temperature > 30 || newData!.humidity > 80, 
              growLights: newData!.lightIntensity < 800, 
              shadeNet: newData!.temperature > 35 || newData!.lightIntensity > 45000 
            }));
          }
          return newData;
        });
      }
    };

    if (!currentData) tick();
    const interval = setInterval(tick, isLiveMode ? 2000 : 3000); // Poll faster in live mode
    return () => clearInterval(interval);
  }, [actuators.automationEnabled, isLiveMode, espIp]); 

  const toggleActuator = async (key: keyof ActuatorState) => {
    const newState = !actuators[key];
    
    if (isLiveMode && espService.current) {
      // Send command to ESP32
      const success = await espService.current.toggleActuator(key, newState);
      if (success) {
        setActuators(prev => ({ ...prev, [key]: newState }));
      } else {
        alert("Failed to communicate with device.");
      }
    } else {
      // Mock Mode
      setActuators(prev => ({ ...prev, [key]: newState }));
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
    { label: "Light Intensity", value: currentData.lightIntensity, unit: "Lx", icon: Sun, color: "yellow", trend: "stable", isAdvanced: false },
    { label: "Soil pH", value: currentData.soilPH, unit: "pH", icon: FlaskConical, color: "purple", trend: "stable", isAdvanced: true },
    { label: "CO2 Level", value: currentData.co2, unit: "ppm", icon: CloudFog, color: "green", trend: "up", isAdvanced: true },
    { label: "Nitrogen", value: currentData.nitrogen, unit: "mg", icon: Sprout, color: "green", trend: "stable", isAdvanced: true },
    { label: "Phosphorus", value: currentData.phosphorus, unit: "mg", icon: Sprout, color: "green", trend: "stable", isAdvanced: true },
    { label: "Potassium", value: currentData.potassium, unit: "mg", icon: Sprout, color: "green", trend: "stable", isAdvanced: true },
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

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 transition-colors duration-300 font-sans text-gray-800 dark:text-gray-100 flex flex-col overflow-x-hidden">
      
      {/* --- CONNECTION MODAL --- */}
      <ConnectionModal 
        isOpen={showConnectionModal} 
        onClose={() => setShowConnectionModal(false)} 
        onConnect={handleConnect} 
        currentIp={espIp}
      />

      {/* --- NAVBAR --- */}
      <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 transition-colors shadow-md">
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
               
               <div className="hidden lg:flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                  <div className="flex items-center gap-2 border-r border-gray-200 dark:border-slate-600 pr-3">
                    <MapPin size={16} className="text-indigo-500 group-hover:animate-bounce" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300 tabular-nums truncate max-w-[150px]" title={locationLabel}>{locationLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    <Cloud size={16} className="text-sky-500" />
                    <span className="font-bold text-gray-800 dark:text-white">{weatherData.current.temp}°C</span>
                  </div>
               </div>

               <div className="hidden md:block">
                 <DigitalClock />
               </div>

               {/* Connection Status Button */}
               <button 
                  onClick={() => setShowConnectionModal(true)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm transition-all hover:scale-105 ${
                    isLiveMode 
                      ? latency > 500 
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-600' 
                        : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-600'
                      : 'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-500'
                  }`}
               >
                  <div className="flex items-center gap-2">
                    <Wifi size={16} className={isLiveMode ? "animate-pulse" : ""} /> 
                    <span className="hidden xl:inline font-bold">
                       {isLiveMode ? (latency > 500 ? 'Offline' : 'Live') : 'Demo Mode'}
                    </span>
                  </div>
                  <div className={`w-px h-4 ${isLiveMode ? 'bg-current opacity-20' : 'bg-gray-300'}`}></div>
                  <div className="flex items-center gap-1.5">
                    <Activity size={16} /> 
                    <span className="tabular-nums font-bold">{Math.floor(latency)}ms</span>
                  </div>
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
                            <button onClick={clearNotifications} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Clear All</button>
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
                      className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 border-2 border-white dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-sm"
                    >
                      PG
                    </button>
                    <ProfileModal isOpen={activeDropdown === 'profile'} onClose={() => setActiveDropdown('none')} darkMode={darkMode} />
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
               <ControlPanel state={actuators} onToggle={toggleActuator} searchQuery={searchQuery} />
             </div>
          </section>
        </div>

        {/* 2. SENSORS (Focus Mode) */}
        <section id="sensors" className="scroll-mt-48 transition-all">
           <div className="flex items-center justify-between mb-8">
              <SectionHeader title="Sensor Metrics" icon={FlaskConical} />
              <button 
                onClick={() => setShowAllSensors(!showAllSensors)}
                className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 py-2.5 rounded-xl transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900"
              >
                {showAllSensors ? 'Compact View' : 'Show All Metrics'}
                {showAllSensors ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {sortedSensors.map((s, idx) => {
               const matchesSearch = searchQuery && s.label.toLowerCase().includes(searchQuery.toLowerCase().trim());
               
               const isVisible = matchesSearch || showAllSensors || !s.isAdvanced;
               
               const blurClass = searchQuery && !matchesSearch ? 'opacity-20 blur-sm grayscale scale-95' : 'opacity-100 scale-100';

               if (!isVisible) return null;

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
  
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    {/* LEFT SIDE — CHART */}
    <div className="lg:col-span-2 space-y-8">
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
           <PolyhouseAIAdvisor currentData={currentData} weather={weatherData} />
        </section>

      </main>
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
