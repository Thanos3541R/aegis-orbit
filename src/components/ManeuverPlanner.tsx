import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Rocket, Fuel, Target, Shield, CheckCircle } from 'lucide-react';
import { ParetoSlider } from './ParetoSlider';

export const ManeuverPlanner: React.FC = () => {
  const { camOptions, maneuverResult, executeManeuver, conjunctions } = useStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (camOptions.length === 0 && !maneuverResult) {
    return (
      <div className="panel bg-space-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full items-center justify-center p-4 text-gray-500">
        <Rocket className="w-8 h-8 mb-2 text-indigo-400/40" />
        <p className="text-xs font-mono text-center">No active CAM calculation required</p>
        <p className="text-[10px] text-gray-600 mt-1">Activate Scenario A or C to compute burn</p>
      </div>
    );
  }

  const showPareto = camOptions.length > 0 && !maneuverResult && conjunctions.length > 0;

  return (
    <div className="panel bg-space-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800 bg-space-800/50 flex-shrink-0">
        <h2 className="text-xs font-bold text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
          <Rocket className="w-3.5 h-3.5 text-indigo-400" />
          CAM Trade-Off Planner
        </h2>
        {maneuverResult ? (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
            EXECUTED
          </span>
        ) : (
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
            {camOptions.length} OPTIONS
          </span>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-2.5 min-h-0 flex flex-col">
        {maneuverResult ? (
          <div className="space-y-2">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold text-emerald-300">Burn Executed — Orbit Raised +0.8 km</div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-space-800/80 p-1.5 rounded border border-space-700/60">
                <span className="text-[9px] text-gray-400 block uppercase">ΔV</span>
                <span className="text-xs font-mono font-bold text-white">{maneuverResult.deltaV.toFixed(2)} m/s</span>
              </div>
              <div className="bg-space-800/80 p-1.5 rounded border border-space-700/60">
                <span className="text-[9px] text-gray-400 block uppercase">Fuel</span>
                <span className="text-xs font-mono font-bold text-amber-300">{maneuverResult.fuelUsed.toFixed(0)}g</span>
              </div>
              <div className="bg-space-800/80 p-1.5 rounded border border-space-700/60">
                <span className="text-[9px] text-gray-400 block uppercase">Post Pc</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{maneuverResult.postManeuverPc.toExponential(1)}</span>
              </div>
              <div className="bg-space-800/80 p-1.5 rounded border border-space-700/60">
                <span className="text-[9px] text-gray-400 block uppercase">New Alt</span>
                <span className="text-xs font-mono font-bold text-white">{maneuverResult.newAltitude.toFixed(0)} km</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {camOptions.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`bg-space-800/90 rounded-lg p-2.5 border flex flex-col justify-between relative ${
                    idx === 0 ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-gray-700'
                  }`}
                >
                  {idx === 0 && (
                    <span className="absolute -top-2 left-2 bg-emerald-500 text-space-900 px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wider">
                      RECOMMENDED
                    </span>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-gray-100 mb-0.5 mt-0.5 truncate">{opt.label}</h3>
                    <p className="text-[10px] text-gray-400 leading-tight mb-2 line-clamp-2">{opt.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono mb-2 bg-space-900/60 p-1.5 rounded">
                    <div>
                      <span className="text-gray-500 text-[9px] block">Δv Applied</span>
                      <span className="text-white font-bold">{opt.deltaV.toFixed(2)} m/s</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[9px] block">Hydrazine</span>
                      <span className="text-amber-300 font-bold">{opt.fuelCost.toFixed(0)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[9px] block">Post Pc</span>
                      <span className="text-emerald-400 font-bold">{opt.postManeuverPc.toExponential(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[9px] block">Orbit ΔAlt</span>
                      <span className="text-cyan-300 font-bold">+{opt.orbitAltitudeChange.toFixed(1)}km</span>
                    </div>
                  </div>

                  <button
                    className={`w-full py-1.5 rounded text-xs font-bold transition-all ${
                      confirmId === opt.id
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : idx === 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                    onClick={() => {
                      if (confirmId === opt.id) {
                        executeManeuver(opt.id);
                      } else {
                        setConfirmId(opt.id);
                      }
                    }}
                  >
                    {confirmId === opt.id ? 'Confirm Execute?' : 'Execute Burn'}
                  </button>
                </div>
              ))}
            </div>

            {showPareto && (
              <ParetoSlider 
                conjunction={conjunctions[0]} 
                onCommitBurn={(point) => {
                  if (camOptions.length > 0) {
                    executeManeuver(camOptions[0].id);
                  }
                }} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
