import React from 'react';
import { useStore } from '../store/useStore';
import { Globe, Satellite, AlertTriangle, Eye } from 'lucide-react';
import type { AppState } from '../types';

export const CameraControls: React.FC = () => {
  const cameraTarget = useStore((state: AppState) => state.cameraTarget);
  const setCameraTarget = useStore((state: AppState) => state.setCameraTarget);
  const conjunctions = useStore((state: AppState) => state.conjunctions);
  const activeConjunction = conjunctions.find((c) => c.active);

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-space-900/90 backdrop-blur-md border border-space-600/80 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 min-w-[170px]">
      <div className="text-[10px] uppercase font-mono text-gray-400 px-2 py-0.5 border-b border-space-700/60 flex items-center justify-between">
        <span className="flex items-center gap-1 font-bold">
          <Eye size={12} className="text-cyan-400" /> CAMERA HUD
        </span>
        <span className="text-[9px] text-cyan-400 font-bold">3D TRACK</span>
      </div>

      {/* Button 1: Constellation Overview */}
      <button
        onClick={() => setCameraTarget('overview')}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          cameraTarget === 'overview'
            ? 'bg-space-700 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
            : 'text-gray-300 hover:bg-space-800 hover:text-white border border-transparent'
        }`}
      >
        <Globe size={15} className={cameraTarget === 'overview' ? 'text-cyan-400' : 'text-gray-400'} />
        <span>Constellation</span>
      </button>

      {/* Button 2: Aegis-1 3D Model Close-Up */}
      <button
        onClick={() => setCameraTarget('aegis1')}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          cameraTarget === 'aegis1'
            ? 'bg-space-700 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'text-gray-300 hover:bg-space-800 hover:text-white border border-transparent'
        }`}
      >
        <Satellite size={15} className={cameraTarget === 'aegis1' ? 'text-emerald-400' : 'text-gray-400'} />
        <span>Aegis-1 Model</span>
      </button>

      {/* Button 3: Conjunction Encounter */}
      <button
        onClick={() => setCameraTarget('conjunction')}
        disabled={!activeConjunction}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          !activeConjunction
            ? 'opacity-40 cursor-not-allowed text-gray-500 border border-transparent'
            : cameraTarget === 'conjunction'
            ? 'bg-red-950/80 text-red-200 border border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
            : 'text-red-400 hover:bg-red-950/40 border border-red-500/30'
        }`}
      >
        <AlertTriangle size={15} className={activeConjunction ? 'text-red-400' : 'text-gray-600'} />
        <span>Close Approach</span>
      </button>
    </div>
  );
};
