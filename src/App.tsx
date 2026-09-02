import React, { useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { DemoController } from './components/DemoController';
import { OrbitalView3D } from './components/OrbitalView3D';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { AnomalyCard } from './components/AnomalyCard';
import { ConjunctionQueue } from './components/ConjunctionQueue';
import { ManeuverPlanner } from './components/ManeuverPlanner';
import { MissionReport } from './components/MissionReport';

export default function App() {
  const store = useStore();
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      let dt = (time - lastTimeRef.current) / 1000;
      if (dt > 0.05) dt = 0.05; 
      store.tick(dt);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-space-900 text-gray-100 font-sans flex flex-col overflow-hidden select-none">
      {/* ── TOP UNIFIED MISSION CONTROL HEADER ── */}
      <DemoController />

      {/* ── MAIN ONE-PAGE 3-COLUMN DASHBOARD GRID (100% Viewport, Zero Scrolling) ── */}
      <main className="flex-1 flex gap-2.5 p-2.5 min-h-0 h-[calc(100vh-48px)] overflow-hidden">
        
        {/* ── COLUMN 1: SUBSYSTEM TELEMETRY & XAI ANOMALY DETECTION (30% WIDTH) ── */}
        <section className="w-[30%] h-full flex flex-col gap-2 min-h-0 min-w-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <TelemetryDashboard />
          </div>
          {store.anomalies.length > 0 && (
            <div className="flex-shrink-0 animate-in slide-in-from-bottom duration-300">
              <AnomalyCard />
            </div>
          )}
        </section>

        {/* ── COLUMN 2: 3D ORBITAL SITUATIONAL AWARENESS (42% WIDTH) ── */}
        <section className="w-[42%] h-full relative rounded-xl border border-space-700 bg-space-900 overflow-hidden shadow-2xl min-h-0">
          <OrbitalView3D />
        </section>

        {/* ── COLUMN 3: CONJUNCTION TRIAGE QUEUE & CAM PLANNER (28% WIDTH) ── */}
        <section className="w-[28%] h-full flex flex-col gap-2 min-h-0 min-w-0">
          <div className="h-[46%] min-h-0 overflow-hidden">
            <ConjunctionQueue />
          </div>
          <div className="h-[54%] min-h-0 overflow-hidden">
            <ManeuverPlanner />
          </div>
        </section>

      </main>

      {/* ── MISSION REPORT / CDM EXPORTER MODAL ── */}
      {store.showMissionReport && <MissionReport />}
    </div>
  );
}
