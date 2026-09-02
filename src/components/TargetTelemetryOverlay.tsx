import React from 'react';
import { useStore } from '../store/useStore';
import { Satellite, Radio, Compass, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { AppState } from '../types';

export const TargetTelemetryOverlay: React.FC = () => {
  const satellites = useStore((state: AppState) => state.satellites);
  const activeScenario = useStore((state: AppState) => state.activeScenario);
  const conjunctions = useStore((state: AppState) => state.conjunctions);
  const cameraTarget = useStore((state: AppState) => state.cameraTarget);
  const currentTelemetry = useStore((state: AppState) => state.currentTelemetry);

  const targetSat = satellites.find((s) => s.id === 'aegis-1') || satellites[0];
  if (!targetSat) return null;

  const altKm = (
    Math.sqrt(targetSat.position.x ** 2 + targetSat.position.y ** 2 + targetSat.position.z ** 2) - 6371
  ).toFixed(1);

  const velKmS = Math.sqrt(
    targetSat.velocity.x ** 2 + targetSat.velocity.y ** 2 + targetSat.velocity.z ** 2
  ).toFixed(2);

  const activeConj = conjunctions.find((c) => c.active);
  const isCritical = activeScenario === 'A' || Boolean(activeConj && activeConj.primaryId === targetSat.id);

  return (
    <div className="absolute top-4 left-4 z-10 bg-space-900/90 backdrop-blur-md border border-space-600/80 rounded-xl p-3 shadow-2xl min-w-[220px] font-mono text-xs text-gray-200 pointer-events-none select-none">
      {/* Target Title & Status */}
      <div className="flex items-center justify-between border-b border-space-700/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5 font-bold text-sm text-white">
          <Satellite size={16} className="text-emerald-400" />
          <span>{targetSat.name}</span>
        </div>
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
            isCritical
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {isCritical ? <ShieldAlert size={10} /> : <CheckCircle2 size={10} />}
          {isCritical ? 'ALERT' : 'NOMINAL'}
        </span>
      </div>

      {/* Primary Ephemeris Metrics */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mb-2">
        <div>
          <span className="text-[10px] text-gray-400 block">Altitude</span>
          <span className="font-bold text-white">{altKm} km</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 block">Velocity</span>
          <span className="font-bold text-cyan-300">{velKmS} km/s</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 block">Inclination</span>
          <span className="text-gray-300">51.6°</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 block">Downlink</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Radio size={10} /> 2.4 GHz
          </span>
        </div>
      </div>

      {/* Real-time Subsystem Snapshot */}
      {currentTelemetry && (
        <div className="border-t border-space-700/60 pt-1.5 flex justify-between text-[10px] text-gray-400">
          <span>Bus: <b className="text-amber-300">{currentTelemetry.busVoltage.toFixed(1)}V</b></span>
          <span>Bat: <b className="text-emerald-300">{currentTelemetry.batterySoc.toFixed(0)}%</b></span>
          <span>W2: <b className="text-cyan-300">{currentTelemetry.wheelSpeed2.toFixed(0)}</b></span>
        </div>
      )}
    </div>
  );
};
