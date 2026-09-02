import React from 'react';
import { useStore } from '../store/useStore';
import { StatusBadge } from './StatusBadge';
import { CheckCircle } from 'lucide-react';

export const ConjunctionQueue: React.FC = () => {
  const { conjunctions, setCameraTarget } = useStore();

  const sortedConjunctions = [...conjunctions].sort((a, b) => a.tca - b.tca);

  const formatCountdown = (tca: number) => {
    if (tca <= 0) return 'T+00:00';
    const totalSeconds = Math.floor(tca);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `T-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `T-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRiskStatus = (risk: string): 'critical' | 'warning' | 'info' | 'nominal' => {
    switch (risk) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      default: return 'nominal';
    }
  };

  const formatPc = (pc: number): string => {
    if (pc === 0) return '0';
    const exp = Math.floor(Math.log10(pc));
    const mantissa = pc / Math.pow(10, exp);
    return `${mantissa.toFixed(1)}×10⁻${Math.abs(exp)}`;
  };

  return (
    <div className="panel bg-space-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800 bg-space-800/50 flex-shrink-0">
        <h2 className="text-xs font-bold text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
          ⚠️ Conjunction Triage Queue
        </h2>
        <span className="bg-space-700 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
          {conjunctions.length} ACTIVE
        </span>
      </div>
      
      <div className="flex-grow overflow-y-auto p-2 min-h-0">
        {conjunctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-4">
            <CheckCircle className="w-8 h-8 mb-1 text-emerald-500/50" />
            <p className="text-xs">No active conjunction events</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase border-b border-gray-800 font-mono">
                <th className="pb-1 font-medium px-1">Pair</th>
                <th className="pb-1 font-medium px-1">TCA</th>
                <th className="pb-1 font-medium px-1">Miss Dist</th>
                <th className="pb-1 font-medium px-1">Pc</th>
                <th className="pb-1 font-medium px-1 text-right">Risk</th>
              </tr>
            </thead>
            <tbody>
              {sortedConjunctions.map((conj) => {
                const isCritical = conj.riskLevel === 'CRITICAL';
                const isHigh = conj.riskLevel === 'HIGH';
                const rowClass = isCritical 
                  ? 'bg-red-500/10 border-l-2 border-red-500 text-red-200' 
                  : isHigh 
                    ? 'bg-amber-500/10 border-l-2 border-amber-500' 
                    : 'border-l-2 border-transparent';

                let tcaClass = 'text-gray-300';
                if (conj.tca < 1800) {
                  tcaClass = 'text-red-400 font-bold';
                } else if (conj.tca < 3600) {
                  tcaClass = 'text-amber-400 font-bold';
                }

                return (
                  <tr 
                    key={conj.id} 
                    className={`${rowClass} hover:bg-space-800/80 cursor-pointer transition-colors border-b border-gray-800/40`}
                    onClick={() => setCameraTarget('conjunction')}
                  >
                    <td className="py-1.5 px-1 font-medium text-gray-100 truncate max-w-[90px]">
                      {conj.primaryName} <span className="text-gray-500">v</span> {conj.secondaryName.replace('Debris-', 'D-')}
                    </td>
                    <td className={`py-1.5 px-1 font-mono ${tcaClass}`}>
                      {formatCountdown(conj.tca)}
                    </td>
                    <td className="py-1.5 px-1 font-mono text-gray-300">
                      {conj.missDistance.toFixed(0)}m
                    </td>
                    <td className="py-1.5 px-1 text-gray-300 font-mono">
                      {formatPc(conj.collisionProbability)}
                    </td>
                    <td className="py-1.5 px-1 text-right">
                      <StatusBadge status={getRiskStatus(conj.riskLevel)} label={conj.riskLevel} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
