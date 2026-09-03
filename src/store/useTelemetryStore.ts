// ── Decoupled Telemetry Store ────────────────────────────────────────────────
// High-frequency (2 Hz) telemetry streaming isolated from R3F Canvas rendering.
// Prevents chart updates from triggering React reconciliation inside the 3D scene.

import { create } from 'zustand';
import type { TelemetryStoreState, TelemetrySample, AnomalyEvent } from '../types';

export const useTelemetryStore = create<TelemetryStoreState>((set) => ({
  // ── State ──
  rollingTelemetry: [],         // last 120 samples of 8 telemetry channels
  anomalyScore: 0,              // current Mahalanobis D_M^2
  activeAnomalies: [],
  anomalyDetectionActive: false,

  // ── Actions ──
  pushSample: (sample: TelemetrySample) => {
    set((state) => ({
      rollingTelemetry: [...state.rollingTelemetry, sample].slice(-120),
    }));
  },

  setAnomalies: (anomalies: AnomalyEvent[]) => {
    set({ activeAnomalies: anomalies });
  },

  addAnomaly: (anomaly: AnomalyEvent) => {
    set((state) => ({
      activeAnomalies: [anomaly, ...state.activeAnomalies].slice(0, 10),
    }));
  },

  setAnomalyDetectionActive: (active: boolean) => {
    set({ anomalyDetectionActive: active });
  },

  setAnomalyScore: (score: number) => {
    set({ anomalyScore: score });
  },

  resetTelemetry: () => {
    set({
      rollingTelemetry: [],
      anomalyScore: 0,
      activeAnomalies: [],
      anomalyDetectionActive: false,
    });
  },
}));
