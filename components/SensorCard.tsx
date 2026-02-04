import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

export const SensorCard: React.FC<SensorCardProps> = ({ label, value, unit, icon: Icon, color, trend }) => {
  // Dark mode aware classes
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  const activeColor = colorClasses[color] || colorClasses.green;

  return (
    <div className={`p-7 rounded-3xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg dark:hover:shadow-slate-700/50 transition-all duration-300 h-full flex flex-col justify-between group`}>
      <div className="flex items-start justify-between mb-5">
        <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider mt-1">{label}</h3>
        <div className={`p-3 rounded-2xl ${activeColor} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-5xl font-bold text-gray-800 dark:text-gray-50 tracking-tight">{value}</span>
        <span className="text-gray-400 dark:text-gray-500 font-semibold text-lg">{unit}</span>
      </div>
      <div className="pt-4 border-t border-gray-50 dark:border-slate-700/50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Real-time</span>
        {trend && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        )}
      </div>
    </div>
  );
};