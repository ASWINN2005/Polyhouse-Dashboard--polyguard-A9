import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { SensorData } from '../types';

interface EnvironmentalChartProps {
  data: SensorData[];
}

export const EnvironmentalChart: React.FC<EnvironmentalChartProps> = ({ data }) => {
  const [activeTab, setActiveTab] =
    useState<'climate' | 'soil' | 'light'>('climate');

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-full flex flex-col transition-colors">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Environmental Data Analysis
        </h3>

        <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-lg flex gap-1">
          {['climate', 'soil', 'light'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'light' ? 'Light Intensity' : tab === 'soil' ? 'Soil Moisture' : 'Climate'}
            </button>
          ))}
        </div>
      </div>

      {/* CHART CONTAINER */}
      <div className="flex-1 w-full min-h-[350px]">
        {/* 🔥 FIX #1: numeric height, NOT "100%" */}
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              className="dark:stroke-slate-700"
            />

            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />

            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />

            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#1e293b'
              }}
              itemStyle={{ fontSize: '12px' }}
            />

            <Legend
              iconType="circle"
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '10px',
                color: '#94a3b8'
              }}
            />

            {activeTab === 'climate' && (
              <>
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#colorTemp)"
                  name="Temp (°C)"
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorHum)"
                  name="Humidity (%)"
                />
              </>
            )}

            {activeTab === 'soil' && (
              <>
                <Area
                  type="monotone"
                  dataKey="soilMoisture"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={0.1}
                  fill="#3b82f6"
                  name="Moisture (%)"
                />
              </>
            )}

            {activeTab === 'light' && (
              <>
                <Area
                  type="monotone"
                  dataKey="lightIntensity"
                  stroke="#eab308"
                  strokeWidth={2}
                  fill="url(#colorLight)"
                  name="Light (Lx)"
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
