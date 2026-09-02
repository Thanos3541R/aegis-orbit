import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { TelemetryChannel } from '../types';

interface TelemetryChartProps {
  channel: TelemetryChannel;
  data: { time: number; value: number }[];
  anomalyRegions?: { start: number; end: number }[];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ channel, data, anomalyRegions }) => {
  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
  
  let statusColor = '#10B981'; // nominal
  if (currentValue < channel.warningRange[0] || currentValue > channel.warningRange[1]) {
    statusColor = '#EF4444'; // critical
  } else if (currentValue < channel.nominalRange[0] || currentValue > channel.nominalRange[1]) {
    statusColor = '#F59E0B'; // warning
  }

  return (
    <div className="flex flex-col bg-space-800/80 rounded-lg border border-space-700/60 p-2 min-h-0 flex-1">
      <div className="flex justify-between items-center mb-1 px-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
          <span className="text-gray-300 text-[11px] font-medium truncate">{channel.label}</span>
        </div>
        <div className="text-xs font-mono flex-shrink-0">
          <span className="font-bold text-gray-100">{currentValue.toFixed(1)}</span>
          <span className="text-gray-500 text-[10px] ml-0.5">{channel.unit}</span>
        </div>
      </div>
      <div className="h-[75px] w-full min-h-[60px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: -22 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="time" hide={true} />
            <YAxis 
              domain={[
                channel.warningRange[0] - (channel.warningRange[1] - channel.warningRange[0]) * 0.1,
                channel.warningRange[1] + (channel.warningRange[1] - channel.warningRange[0]) * 0.1
              ]} 
              width={35} 
              tick={{ fill: '#6B7280', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.375rem', color: '#F3F4F6', fontSize: '11px', padding: '4px 8px' }}
              itemStyle={{ color: '#F3F4F6' }}
              formatter={(value: number) => [`${value.toFixed(2)} ${channel.unit}`, channel.label]}
            />
            <ReferenceLine y={channel.nominalRange[0]} stroke={channel.color} strokeDasharray="2 2" strokeOpacity={0.35} />
            <ReferenceLine y={channel.nominalRange[1]} stroke={channel.color} strokeDasharray="2 2" strokeOpacity={0.35} />
            {anomalyRegions && anomalyRegions.map((region, idx) => (
              <ReferenceArea key={idx} x1={region.start} x2={region.end} fill="#EF4444" fillOpacity={0.15} />
            ))}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={channel.color} 
              strokeWidth={1.5} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
