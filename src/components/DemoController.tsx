import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  FileText,
  Volume2,
  VolumeX,
  Play,
  Pause,
  HelpCircle,
  X,
  FastForward,
  Keyboard
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { SCENARIOS } from '../engine/scenarios';
import type { ScenarioId } from '../types';
import { resumeAudio, playClickTone, playScenarioSweep, playCriticalAlert } from './AudioController';

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
  const soundEnabled = useStore(state => state.soundEnabled);
  const toggleSound = useStore(state => state.toggleSound);

  const simSpeed = useStore(state => state.simSpeed);
  const setSimSpeed = useStore(state => state.setSimSpeed);
  const isPaused = useStore(state => state.isPaused);
  const togglePause = useStore(state => state.togglePause);

  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleToggle = useCallback((id: ScenarioId) => {
    resumeAudio();
    if (activeScenario === id) {
      activateScenario(null);
    } else {
      activateScenario(id);
      if (id === 'A') {
        playCriticalAlert();
      } else {
        playScenarioSweep();
      }
    }
  }, [activeScenario, activateScenario]);

  const handleReset = useCallback(() => {
    resumeAudio();
    resetSimulation();
    playClickTone();
  }, [resetSimulation]);

  useEffect(() => {
    const handleGlobalInteraction = () => {
      resumeAudio();
      document.removeEventListener('click', handleGlobalInteraction);
    };
    document.addEventListener('click', handleGlobalInteraction);
    
    return () => {
      document.removeEventListener('click', handleGlobalInteraction);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      resumeAudio();

      if (e.key === '1') {
        handleToggle('A');
      } else if (e.key === '2') {
        handleToggle('B');
      } else if (e.key === '3') {
        handleToggle('C');
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePause();
        playClickTone();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setShowHelpModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle, handleReset, togglePause, toggleSound]);

  const statusColor = activeScenario === 'A' ? 'text-critical' : activeScenario === 'B' ? 'text-warning' : 'text-nominal';
  const statusText = activeScenario === 'A' ? 'CRITICAL ALERT' : activeScenario === 'B' ? 'ANOMALY DETECTED' : 'NOMINAL';

  return (
    <>
      <header className="h-12 w-full bg-space-800/95 backdrop-blur-md border-b border-space-700 flex items-center justify-between px-3 z-40 flex-shrink-0 select-none">
        {/* ── LEFT: BRANDING & MET CLOCK ── */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <h1 className="text-base font-bold text-white tracking-wider font-mono">
              Aegis<span className="text-cyan-400">Orbit</span>
            </h1>
          </div>

          <div className="h-4 w-px bg-space-600 hidden sm:block" />

          {/* MET Clock */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
            <span className="text-gray-400 text-[10px]">MET:</span>
            <span className="text-cyan-300 font-bold bg-space-900/80 px-1.5 py-0.5 rounded border border-space-700">
              {formatMET(simulationTime)}
            </span>
          </div>

          {/* ── QoL: PLAY/PAUSE & TIME ACCELERATION CONTROLS ── */}
          <div className="flex items-center gap-1 bg-space-900/90 p-0.5 rounded-lg border border-space-700">
            <button
              onClick={() => {
                togglePause();
                playClickTone();
              }}
              className={`p-1 rounded transition-colors ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={isPaused ? "Resume Simulation (Space)" : "Pause Simulation (Space)"}
            >
              {isPaused ? <Play size={13} className="fill-amber-400" /> : <Pause size={13} className="fill-gray-400" />}
            </button>

            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  setSimSpeed(speed);
                  playClickTone();
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                  simSpeed === speed && !isPaused
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title={`Set Simulation Speed to ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: ONE-CLICK DEMO SUITE SCENARIO BUTTONS ── */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-gray-400 uppercase hidden xl:inline tracking-wider font-bold">
            Demo Suite:
          </span>

          {SCENARIOS.map((s, index) => {
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold transition-all duration-200 relative ${colorClasses}`}
                title={s.description}
              >
                <span className="text-sm">{s.icon}</span>
                <span className="hidden md:inline">{s.name}</span>
                <sup className="text-[8px] opacity-70 ml-0.5 font-mono">[{index + 1}]</sup>
              </button>
            );
          })}

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-space-700/80 hover:bg-space-600 border border-space-600 text-gray-300 text-xs transition-colors relative"
            title="Reset Simulation to Nominal State [R]"
          >
            <RotateCcw size={12} />
            <span className="hidden md:inline font-mono text-[11px]">RESET</span>
            <sup className="text-[8px] opacity-70 ml-0.5 font-mono">[R]</sup>
          </button>
        </div>

        {/* ── RIGHT: STATUS BADGE, QoL CONTROLS & MISSION REPORT TRIGGER ── */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs">
            <span className={`w-2 h-2 rounded-full ${activeScenario === 'A' ? 'bg-red-500 animate-ping' : activeScenario === 'B' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className={`font-bold ${statusColor}`}>{statusText}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="flex items-center justify-center p-1.5 rounded-md border border-space-600 bg-space-700/50 hover:bg-space-600 text-gray-300 hover:text-white transition-colors"
            title={soundEnabled ? "Mute Procedural Audio (M)" : "Enable Procedural Audio (M)"}
          >
            {soundEnabled ? <Volume2 size={14} className="text-cyan-400" /> : <VolumeX size={14} className="text-gray-500" />}
          </button>

          {/* Keyboard Shortcuts Help Guide */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center justify-center p-1.5 rounded-md border border-space-600 bg-space-700/50 hover:bg-space-600 text-gray-300 hover:text-white transition-colors"
            title="Keyboard Shortcuts Guide (?)"
          >
            <HelpCircle size={14} />
          </button>

          {/* CDM Report Trigger */}
          <button
            onClick={() => setShowMissionReport(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded border border-indigo-500/50 text-xs font-semibold shadow-[0_0_10px_rgba(99,102,241,0.25)] transition-colors"
          >
            <FileText size={13} />
            <span className="hidden sm:inline">CDM Report</span>
          </button>
        </div>
      </header>

      {/* ── QoL: KEYBOARD SHORTCUTS CHEAT SHEET MODAL ── */}
      {showHelpModal && (
        <div
          className="fixed inset-0 bg-space-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-space-900 border border-cyan-500/30 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-space-700 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono uppercase tracking-wider">
                <Keyboard size={18} className="text-cyan-400" />
                Mission Control Hotkeys
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-space-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-space-800/80 p-2 rounded border border-space-700">
                <span className="text-gray-300">Debris Conjunction</span>
                <kbd className="px-2 py-0.5 rounded bg-space-900 font-mono font-bold text-red-400 border border-red-500/40">1</kbd>
              </div>
              <div className="flex items-center justify-between bg-space-800/80 p-2 rounded border border-space-700">
                <span className="text-gray-300">Telemetry Anomaly</span>
                <kbd className="px-2 py-0.5 rounded bg-space-900 font-mono font-bold text-amber-400 border border-amber-500/40">2</kbd>
              </div>
              <div className="flex items-center justify-between bg-space-800/80 p-2 rounded border border-space-700">
                <span className="text-gray-300">Execute CAM Burn</span>
                <kbd className="px-2 py-0.5 rounded bg-space-900 font-mono font-bold text-cyan-400 border border-cyan-500/40">3</kbd>
              </div>
              <div className="flex items-center justify-between bg-space-800/80 p-2 rounded border border-space-700">
                <span className="text-gray-300">Reset Simulation</span>
                <kbd className="px-2 py-0.5 rounded bg-space-900 font-mono font-bold text-gray-300 border border-space-600">R</kbd>
              </div>
              <div className="flex items-center justify-between bg-space-800/80 p-2 rounded border border-space-700">
                <span className="text-gray-300">Pause / Resume</span>
                <kbd className="px-2 py-0.5 rounded bg-space-900 font-mono font-bold text-emerald-400 border border-emerald-500/40">Space</kbd>
              </div>
              <div className="flex items-center justify-between bg-space-800/80 p-2 rounded border border-space-700">
                <span className="text-gray-300">Toggle Audio Mute</span>
                <kbd className="px-2 py-0.5 rounded bg-space-900 font-mono font-bold text-cyan-400 border border-cyan-500/40">M</kbd>
              </div>
            </div>

            <div className="bg-space-950/70 p-3 rounded-lg border border-space-800 text-[11px] text-gray-400 space-y-1">
              <div className="font-bold text-cyan-300 font-mono">🖱️ 3D Viewport Navigation:</div>
              <div>• <b>Left Click + Drag:</b> Fluid, silky-smooth Earth orbit rotation</div>
              <div>• <b>Right Click / Middle Drag:</b> Smooth screen-space pan</div>
              <div>• <b>Scroll Wheel:</b> Precision altitude zoom</div>
              <div>• <b>Camera HUD Buttons:</b> Instant focus on India, Cartosat-3, or close approach</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
