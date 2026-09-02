import React from 'react';
import { Satellite, RotateCcw, FileText, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SCENARIOS } from '../engine/scenarios';
import type { ScenarioId } from '../types';

const formatMET = (time: number) => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = Math.floor(time % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const DemoController: React.FC = () => {
  const activeScenario = useStore(state => state.activeScenario);
  const activateScenario = useStore(state => state.activateScenario);
  const resetSimulation = useStore(state => state.resetSimulation);
  const simulationTime = useStore(state => state.simulationTime);
  const setShowMissionReport = useStore(state => state.setShowMissionReport);

  const handleToggle = (id: ScenarioId) => {
    if (activeScenario === id) {
      activateScenario(null);
    } else {
      activateScenario(id);
    }
  };

  const statusColor = activeScenario === 'A' ? 'text-critical' : activeScenario === 'B' ? 'text-warning' : 'text-nominal';
  const statusText = activeScenario === 'A' ? 'CRITICAL ALERT' : activeScenario === 'B' ? 'ANOMALY DETECTED' : 'NOMINAL';

  return (
    <header className="h-12 w-full bg-space-800/95 backdrop-blur-md border-b border-space-700 flex items-center justify-between px-4 z-40 flex-shrink-0 select-none">
      {/* ── LEFT: BRANDING & MET CLOCK ── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <h1 className="text-base font-bold text-white tracking-wider font-mono">
            Aegis<span className="text-cyan-400">Orbit</span>
          </h1>
        </div>

        <div className="h-4 w-px bg-space-600 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
          <span className="text-gray-400 text-[10px]">MET:</span>
          <span className="text-cyan-300 font-bold bg-space-900/80 px-1.5 py-0.5 rounded border border-space-700">
            {formatMET(simulationTime)}
          </span>
        </div>
      </div>

      {/* ── CENTER: ONE-CLICK DEMO SUITE SCENARIO BUTTONS ── */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-400 uppercase hidden md:inline tracking-wider font-bold">
          Demo Suite:
        </span>

        {SCENARIOS.map((s) => {
          const isActive = activeScenario === s.id;
          let colorClasses = '';
          if (s.id === 'A') {
            colorClasses = isActive 
              ? 'border-critical bg-critical/20 text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse' 
              : 'border-space-600/80 text-gray-300 hover:border-critical/60 hover:text-white';
          } else if (s.id === 'B') {
            colorClasses = isActive 
              ? 'border-warning bg-warning/20 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
              : 'border-space-600/80 text-gray-300 hover:border-warning/60 hover:text-white';
          } else if (s.id === 'C') {
            colorClasses = isActive 
              ? 'border-cyan-500 bg-cyan-500/20 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.5)]' 
              : 'border-space-600/80 text-gray-300 hover:border-cyan-500/60 hover:text-white';
          }

          return (
            <button
              key={s.id}
              onClick={() => handleToggle(s.id as ScenarioId)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all duration-200 ${colorClasses}`}
              title={s.description}
            >
              <span className="text-sm">{s.icon}</span>
              <span className="hidden lg:inline">{s.name}</span>
            </button>
          );
        })}

        <button
          onClick={resetSimulation}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-space-700/80 hover:bg-space-600 border border-space-600 text-gray-300 text-xs transition-colors"
          title="Reset Simulation to Nominal State"
        >
          <RotateCcw size={12} />
          <span className="hidden md:inline font-mono text-[11px]">RESET</span>
        </button>
      </div>

      {/* ── RIGHT: STATUS BADGE & MISSION REPORT MODAL TRIGGER ── */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
          <span className={`w-2 h-2 rounded-full ${activeScenario === 'A' ? 'bg-red-500 animate-ping' : activeScenario === 'B' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className={`font-bold ${statusColor}`}>{statusText}</span>
        </div>

        <button
          onClick={() => setShowMissionReport(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded border border-indigo-500/50 text-xs font-semibold shadow-[0_0_10px_rgba(99,102,241,0.25)] transition-colors"
        >
          <FileText size={13} />
          <span>CDM Report</span>
        </button>
      </div>
    </header>
  );
};
