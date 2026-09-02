import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { StatusBadge } from './StatusBadge';
import { Activity, AlertOctagon } from 'lucide-react';

export const AnomalyCard: React.FC = () => {
  const { anomalies } = useStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (anomalies.length > 0) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [anomalies]);

  if (!show || anomalies.length === 0) return null;

  const anomaly = anomalies[0];
  
  const severityColors = {
    NOMINAL: 'nominal',
    WATCH: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical'
  } as const;

  const statusType = severityColors[anomaly.severity] || 'info';
  const glowClass = anomaly.severity === 'CRITICAL' ? 'glow-critical border-red-500/80 bg-red-950/40' : 'border-gray-800 bg-space-900/95';

  const maxScore = 10;
  const scorePercent = Math.min((anomaly.score / maxScore) * 100, 100);

  return (
    <div className={`panel border rounded-xl overflow-hidden shadow-2xl transition-all duration-300 p-2.5 flex flex-col gap-2 ${glowClass}`}>
      <div className="flex justify-between items-center border-b border-gray-800/80 pb-1.5 flex-shrink-0">
        <h2 className="text-xs font-bold text-red-200 flex items-center gap-1.5 uppercase font-mono">
          <AlertOctagon size={14} className="text-red-400 animate-pulse" />
          XAI Root Cause Analysis
        </h2>
        <StatusBadge status={statusType} label={anomaly.severity} pulse={anomaly.severity === 'CRITICAL'} />
      </div>

      <div className="space-y-1.5 text-xs">
        <div>
          <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider">Identified Root Cause</p>
          <p className="text-xs font-bold text-white leading-tight">{anomaly.rootCause}</p>
        </div>

        {/* Reconstruction Error Progress Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-mono text-gray-400">
            <span>Reconstruction Error</span>
            <span className="text-red-400 font-bold">{anomaly.score.toFixed(2)} / 10.0</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div 
              className="bg-red-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {/* Top Channel Deviations */}
        <div className="flex flex-wrap gap-1 pt-1">
          {Object.entries(anomaly.sigmaValues).slice(0, 4).map(([channel, sigma]) => {
            const isHigh = sigma > 3;
            return (
              <span
                key={channel}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                  isHigh
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                    : 'bg-space-800 text-gray-400 border-gray-700'
                }`}
              >
                {channel}: {sigma.toFixed(1)}σ
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
