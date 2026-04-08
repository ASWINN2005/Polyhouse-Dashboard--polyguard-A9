import React from 'react';
import { ActuatorState } from '../types';
import { Fan, Droplets, Sun, Zap, Blinds } from 'lucide-react';

interface ControlPanelProps {
  state: ActuatorState;
  onToggle: (key: keyof ActuatorState) => void;
  searchQuery?: string;
  isShadeMoving?: boolean;
  isOffline?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  state, onToggle, searchQuery = '', isShadeMoving = false, isOffline = false 
}) => {
  
  const handleActuatorClick = (key: keyof ActuatorState) => {
    if (state.automationEnabled) {
      onToggle('automationEnabled'); // Switch to manual
      setTimeout(() => onToggle(key), 50); // Then toggle actuator
    } else {
      onToggle(key);
    }
  };

  const ActuatorButton = ({ 
    active, 
    onClick, 
    label, 
    icon: Icon,
    colorClass,
    isMoving = false
  }: { 
    active: boolean; 
    onClick: () => void; 
    label: string; 
    icon: any;
    colorClass: string;
    isMoving?: boolean;
  }) => {
    
    const isDimmed = searchQuery && !label.toLowerCase().includes(searchQuery.toLowerCase());
    
    const activeColors: Record<string, string> = {
      blue: 'bg-blue-500 border-blue-600 text-white shadow-blue-500/30',
      cyan: 'bg-cyan-500 border-cyan-600 text-white shadow-cyan-500/30',
      purple: 'bg-purple-500 border-purple-600 text-white shadow-purple-500/30',
      orange: 'bg-orange-500 border-orange-600 text-white shadow-orange-500/30',
    };

    const inactiveClass = "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50";

    return (
      <button
        onClick={onClick}
        disabled={isMoving || isOffline}
        className={`
          relative flex flex-col items-center justify-center p-5 xl:p-6 rounded-2xl border-2 transition-all duration-200 group w-full
          ${isDimmed || isOffline ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
          ${active ? `${activeColors[colorClass]} shadow-lg scale-[1.02]` : inactiveClass}
          ${isMoving ? 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 cursor-not-allowed opacity-90' : (isOffline ? 'cursor-not-allowed' : 'active:scale-95')}
        `}
      >
        <div className={`p-3 rounded-full mb-3 transition-colors duration-300 ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700 group-hover:bg-gray-200 dark:group-hover:bg-slate-600'}`}>
          <Icon size={28} className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
        </div>
        <span className="font-bold text-sm xl:text-base tracking-wide text-center whitespace-nowrap">
          {isMoving ? 'Moving...' : label}
        </span>
        
        <div className={`absolute top-3 right-3 xl:top-4 xl:right-4 w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-transparent ${active ? 'bg-white ring-white/30' : 'bg-gray-300 dark:bg-slate-600 ring-transparent'}`} />
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 lg:p-6 xl:p-8 border border-gray-100 dark:border-slate-700 shadow-sm h-full min-h-[500px] flex flex-col w-full overflow-hidden">
      
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4 w-full">
        <div className="flex-1 min-w-[150px]">
           <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Actuators
            {state.automationEnabled && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">System Control</p>
        </div>
        
        <div className="bg-gray-100 dark:bg-slate-700 p-1.5 rounded-xl flex items-center shadow-inner shrink-0">
           <button
             onClick={() => state.automationEnabled && onToggle('automationEnabled')}
             className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all duration-200 whitespace-nowrap ${!state.automationEnabled ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
           >
             Manual
           </button>
           <button
             onClick={() => !state.automationEnabled && onToggle('automationEnabled')}
             className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-lg transition-all duration-200 whitespace-nowrap ${state.automationEnabled ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
           >
             Auto AI
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:gap-6 flex-1 overflow-y-auto no-scrollbar pb-2 min-h-0">
        <ActuatorButton
          label="Water Pump"
          icon={Droplets}
          active={state.waterPump}
          colorClass="blue"
          onClick={() => handleActuatorClick('waterPump')}
        />
        <ActuatorButton
          label="Ventilation"
          icon={Fan}
          active={state.fan}
          colorClass="cyan"
          onClick={() => handleActuatorClick('fan')}
        />
        <ActuatorButton
          label="Grow Lights"
          icon={Sun}
          active={state.growLights}
          colorClass="purple"
          onClick={() => handleActuatorClick('growLights')}
        />
        <ActuatorButton
          label="Shade Net"
          icon={Blinds}
          active={state.shadeNet}
          colorClass="orange"
          onClick={() => handleActuatorClick('shadeNet')}
          isMoving={isShadeMoving}
        />
        
        {isOffline && (
          <div className="col-span-2 mt-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center justify-center gap-3 text-red-600 dark:text-red-400">
            <Zap size={20} className="animate-bounce" />
            <span className="font-bold text-sm">Hardware connection lost. Controls disabled.</span>
          </div>
        )}
      </div>

      <div className="mt-4 xl:mt-6 text-center h-8 flex items-center justify-center shrink-0">
        {state.automationEnabled && (
           <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/50">
             <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
             AI AUTOMATION ACTIVE
           </span>
        )}
      </div>
    </div>
  );
};
