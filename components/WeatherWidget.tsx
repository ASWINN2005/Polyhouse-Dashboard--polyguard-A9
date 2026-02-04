import React from 'react';
import { WeatherData } from '../types';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Droplets } from 'lucide-react';

interface WeatherWidgetProps {
  data: WeatherData;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ data }) => {
  const getWeatherIcon = (condition: string, size: number = 24) => {
    switch (condition) {
      case 'Sunny': return <Sun size={size} className="text-yellow-500 animate-spin-slow" />;
      case 'Rainy': return <CloudRain size={size} className="text-blue-500 animate-pulse" />;
      case 'Stormy': return <CloudLightning size={size} className="text-purple-500 animate-pulse" />;
      default: return <Cloud size={size} className="text-gray-400 dark:text-slate-400 animate-float" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm transition-colors h-full">
      <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-4">External Weather</h3>
      
      {/* Current Conditions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-full">
            {getWeatherIcon(data.current.condition, 32)}
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{data.current.temp}°C</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{data.current.condition}</div>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-end gap-1">
            <Wind size={12} /> {data.current.windSpeed} km/h
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-end gap-1">
            <Droplets size={12} /> {data.current.humidity}%
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
        {data.forecast.map((day, idx) => (
          <div key={idx} className="text-center p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors group">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1">{day.day}</div>
            <div className="flex justify-center mb-1 group-hover:scale-110 transition-transform">
              {getWeatherIcon(day.condition, 16)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.temp}°C</div>
          </div>
        ))}
      </div>
    </div>
  );
};