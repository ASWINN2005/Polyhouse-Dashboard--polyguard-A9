
import React from 'react';
import { ActuatorState } from '../types';

interface PolyhouseVisualizerProps {
  actuators: ActuatorState;
  lightIntensity: number;
  weatherCondition?: string; 
  timestamp?: Date;
  darkMode?: boolean;
}

export const PolyhouseVisualizer: React.FC<PolyhouseVisualizerProps> = ({ 
  actuators, 
  darkMode = false
}) => {
  
  // Colors for visualization states
  const colors = {
    glass: darkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.4)',
    frame: darkMode ? '#475569' : '#cbd5e1',
    ground: darkMode ? '#271c19' : '#5d4037',
    waterOn: '#3b82f6',
    waterOff: darkMode ? '#334155' : '#cbd5e1',
    lightOn: '#d946ef',
    lightOff: 'transparent',
    // Updated Fan Colors
    fanOn: '#22c55e',
    fanOff: '#64748b',
    fanBladeActive: '#22c55e',
    fanBladeInactive: '#64748b',
  };

  return (
    <div className={`relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm transition-colors duration-500`}>
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-800 dark:to-slate-900" />
      
      {/* Ground Level */}
      <div className="absolute bottom-0 w-full h-[25%] bg-gradient-to-t from-emerald-50/50 to-transparent dark:from-emerald-900/10 border-t border-dashed border-emerald-100 dark:border-emerald-900/30"></div>

      <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        
        <defs>
          <linearGradient id="glassGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={darkMode ? '#94a3b8' : '#e2e8f0'} stopOpacity="0.1"/>
            <stop offset="100%" stopColor={darkMode ? '#94a3b8' : '#3b82f6'} stopOpacity="0.05"/>
          </linearGradient>
          <filter id="softGlow">
             <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        {/* --- Back Structure --- */}
        <path d="M200 450 L600 450 L600 250 L400 150 L200 250 Z" 
              fill="none" stroke={colors.frame} strokeWidth="2" />
        
        {/* --- Ventilation Fan (Refined Geometry) --- */}
        <g transform="translate(400, 320)">
           {/* Industrial Frame */}
           <rect x="-44" y="-44" width="88" height="88" rx="6" fill={darkMode ? '#1e293b' : '#f1f5f9'} stroke={colors.frame} strokeWidth="3" />
           <circle cx="0" cy="0" r="40" fill={darkMode ? '#0f172a' : '#e2e8f0'} stroke={colors.frame} strokeWidth="1" opacity="0.5" />
           
           {/* Spinning Blades Group */}
           {/* transformOrigin '0px 0px' is crucial for perfect centering */}
           <g style={{ 
               transformOrigin: '0px 0px', 
               animation: actuators.fan ? 'fanSpin 0.4s linear infinite' : 'fanSpin 2s linear infinite paused',
               transition: 'all 1s ease-out' // Simulates spin-down momentum
           }}>
             <style>
               {`@keyframes fanSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
             </style>
             
             {/* Hub */}
             <circle cx="0" cy="0" r="8" fill={colors.frame} className="transition-colors duration-500" />
             
             {/* Blades - Perfectly Symmetric Quadratic Curves */}
             {[0, 120, 240].map(angle => (
               <path 
                 key={angle}
                 // Symmetric blade: M(0,0) -> Curve to Tip(0,-38) -> Curve back to (0,0)
                 d="M 0 0 Q 8 -20 0 -38 Q -8 -20 0 0"
                 fill={actuators.fan ? colors.fanBladeActive : colors.fanBladeInactive} 
                 stroke={darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)'}
                 strokeWidth="1"
                 transform={`rotate(${angle})`}
                 className="transition-colors duration-700 ease-in-out" 
               />
             ))}
           </g>

           {/* Static Safety Grill Overlay */}
           <circle cx="0" cy="0" r="40" fill="none" stroke={colors.frame} strokeWidth="2" opacity="0.8" />
           <circle cx="0" cy="0" r="25" fill="none" stroke={colors.frame} strokeWidth="1" opacity="0.3" />
           {/* Cross bars */}
           <path d="M-28 -28 L28 28 M-28 28 L28 -28" stroke={colors.frame} strokeWidth="1" opacity="0.4" />
        </g>

        {/* --- Crops --- */}
        <g transform="translate(0, 40)">
             <g transform="translate(250, 480)"><PlantIcon darkMode={darkMode} /></g>
             <g transform="translate(320, 500)"><PlantIcon darkMode={darkMode} scale={1.1} /></g>
             <g transform="translate(400, 480)"><PlantIcon darkMode={darkMode} /></g>
             <g transform="translate(480, 500)"><PlantIcon darkMode={darkMode} scale={1.1} /></g>
             <g transform="translate(550, 480)"><PlantIcon darkMode={darkMode} /></g>
        </g>

        {/* --- Irrigation --- */}
        <g className="transition-colors duration-500">
          <line x1="200" y1="260" x2="600" y2="260" stroke={actuators.waterPump ? colors.waterOn : colors.waterOff} strokeWidth="4" />
          <line x1="400" y1="260" x2="400" y2="480" stroke={actuators.waterPump ? colors.waterOn : colors.waterOff} strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
          {[280, 360, 440, 520].map((x, i) => (
             <circle key={i} cx={x} cy="265" r="3" fill={actuators.waterPump ? colors.waterOn : colors.waterOff} />
          ))}
          {actuators.waterPump && (
             <path d="M250 270 L550 270 L550 450 L250 450 Z" fill="url(#glassGradient)" opacity="0.3" />
          )}
        </g>

        {/* --- Lights --- */}
        <g className="transition-all duration-700">
            <rect x="250" y="180" width="300" height="6" fill="#333" rx="3" />
            {actuators.growLights && (
               <>
                 <path d="M260 190 L220 450 L580 450 L540 190 Z" fill={colors.lightOn} opacity="0.1" />
                 <rect x="260" y="186" width="280" height="2" fill={colors.lightOn} filter="url(#softGlow)" />
               </>
            )}
        </g>

        {/* --- Structure Frame --- */}
        <path d="M100 600 L100 250 L400 80 L700 250 L700 600" 
              fill="url(#glassGradient)" stroke={colors.frame} strokeWidth="3" strokeLinejoin="round" />
        <line x1="400" y1="80" x2="400" y2="250" stroke={colors.frame} strokeWidth="1" />
        <line x1="250" y1="250" x2="250" y2="600" stroke={colors.frame} strokeWidth="1" />
        <line x1="550" y1="250" x2="550" y2="600" stroke={colors.frame} strokeWidth="1" />

        {/* --- Shade Net --- */}
        <g clipPath="url(#roofClip)">
           <rect x="100" y="0" width="600" height="400" 
                 fill={darkMode ? '#000' : '#333'} 
                 opacity={actuators.shadeNet ? 0.7 : 0}
                 className="transition-opacity duration-1000" />
           {actuators.shadeNet && (
             <path d="M100 250 L400 80 L700 250" stroke="white" strokeWidth="1" strokeDasharray="2 4" opacity="0.2" fill="none" />
           )}
        </g>
        <defs>
           <clipPath id="roofClip">
              <path d="M100 250 L400 80 L700 250 L600 250 L400 150 L200 250 Z" />
           </clipPath>
        </defs>

      </svg>
    </div>
  );
};

const PlantIcon = ({ darkMode, scale = 1 }: { darkMode: boolean, scale?: number }) => (
  <g transform={`scale(${scale})`}>
     <path d="M0 0 Q-8 -15 -15 -20" stroke={darkMode ? '#15803d' : '#22c55e'} strokeWidth="3" fill="none" />
     <path d="M0 0 Q8 -15 15 -20" stroke={darkMode ? '#15803d' : '#22c55e'} strokeWidth="3" fill="none" />
     <path d="M0 0 V-25" stroke={darkMode ? '#15803d' : '#22c55e'} strokeWidth="3" fill="none" />
     <circle cx="-15" cy="-20" r="4" fill={darkMode ? '#166534' : '#4ade80'} />
     <circle cx="15" cy="-20" r="4" fill={darkMode ? '#166534' : '#4ade80'} />
     <circle cx="0" cy="-28" r="4" fill={darkMode ? '#166534' : '#4ade80'} />
  </g>
);
