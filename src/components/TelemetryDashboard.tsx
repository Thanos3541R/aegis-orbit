import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { TelemetryChart } from './TelemetryChart';
import { StatusBadge } from './StatusBadge';
import { TELEMETRY_CHANNELS } from '../engine/telemetrySimulator';

const IMPORTANT_CHANNEL_IDS = ['wheelSpeed1', 'wheelSpeed2', 'busVoltage', 'solarCurrent', 'batterySoc', 'panelTemp'];

export const TelemetryDashboard: React.FC = () => {
  const { telemetryHistory, activeScenario } = useStore();

  const channelData = useMemo(() => {
    const data: Record<string, { time: number; value: number }[]> = {};
    const anomalyRegions: Record<string, { start: number; end: number }[]> = {};

    IMPORTANT_CHANNEL_IDS.forEach(key => {
      data[key] = [];
      anomalyRegions[key] = [];
      let inAnomaly = false;
      let anomalyStart = 0;
      
      const channelConfig = TELEMETRY_CHANNELS.find(c => c.id === key);

      telemetryHistory.forEach(point => {
        const val = point[key] as number;
        data[key].push({ time: point.timestamp, value: val });

        if (channelConfig) {
          const isOutsideWarning = val < channelConfig.warningRange[0] || val > channelConfig.warningRange[1];
          if (isOutsideWarning && !inAnomaly) {
            inAnomaly = true;
            anomalyStart = point.timestamp;
          } else if (!isOutsideWarning && inAnomaly) {
            inAnomaly = false;
            anomalyRegions[key].push({ start: anomalyStart, end: point.timestamp });
          }
        }
      });

      if (inAnomaly && data[key].length > 0) {
        anomalyRegions[key].push({ start: anomalyStart, end: data[key][data[key].length - 1].time });
      }
    });
    return { data, anomalyRegions };
  }, [telemetryHistory]);

  const status = activeScenario === 'B' ? 'warning' : 'nominal';
  const statusLabel = activeScenario === 'B' ? 'ANOMALY DETECTED' : 'NOMINAL';

  return (
    <div className="panel flex flex-col h-full bg-space-900 border border-gray-800 rounded-xl overflow-hidden min-h-0">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800 bg-space-800/50 flex-shrink-0">
        <h2 className="text-xs font-bold text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
          📡 Subsystem Telemetry
        </h2>
        <StatusBadge status={status} label={statusLabel} />
      </div>
      <div className="p-2 grid grid-cols-2 grid-rows-3 gap-1.5 flex-grow overflow-hidden min-h-0">
        {IMPORTANT_CHANNEL_IDS.map(key => {
          const channel = TELEMETRY_CHANNELS.find(c => c.id === key);
          if (!channel) return null;
          return (
            <TelemetryChart 
              key={key} 
              channel={channel} 
              data={channelData.data[key]} 
              anomalyRegions={channelData.anomalyRegions[key]}
            />
          );
        })}
      </div>
    </div>
  );
};
