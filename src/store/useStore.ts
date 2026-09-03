// ── Unified Store Orchestrator ───────────────────────────────────────────────
// Backwards-compatible proxy that delegates to useTelemetryStore and
// useConjunctionStore while preserving the AppState interface.
// All existing components importing useStore continue operating without changes.

import { create } from 'zustand';
import type { AppState, ScenarioId } from '../types';
import { createConstellationSatellites, createDebrisField } from '../engine/scenarios';
import { propagateElements, elementsToECI } from '../engine/orbitalMechanics';
import { generateTelemetrySample, detectAnomaly, calculateAnomalyScore } from '../engine/telemetrySimulator';
import { screenConjunctions } from '../engine/conjunctionEngine';
import { generateCAMOptions, executeCAM } from '../engine/camPlanner';
import { useTelemetryStore } from './useTelemetryStore';
import { useConjunctionStore } from './useConjunctionStore';

export const useStore = create<AppState>((set, get) => ({
  activeScenario: null,
  simulationTime: 0,
  isRunning: true,
  satellites: createConstellationSatellites(),
  debris: createDebrisField(),
  telemetryHistory: [],
  currentTelemetry: null,
  anomalies: [],
  anomalyDetectionActive: false,
  conjunctions: [],
  camOptions: [],
  maneuverResult: null,
  cameraTarget: 'overview',
  showMissionReport: false,
  soundEnabled: true,

  activateScenario: (id: ScenarioId | null) => {
    // Reset telemetry store
    useTelemetryStore.getState().resetTelemetry();
    // Reset conjunction store
    useConjunctionStore.getState().triggerScenario(id);

    set({
      activeScenario: id,
      simulationTime: 0,
      anomalies: [],
      conjunctions: [],
      camOptions: [],
      maneuverResult: null,
      telemetryHistory: [],
      currentTelemetry: null,
      anomalyDetectionActive: false,
    });

    if (id === 'A') {
      set({ cameraTarget: 'conjunction' });
      const state = get();
      const conjunctions = screenConjunctions(state.satellites, state.debris, 0);
      set({ conjunctions });
      useConjunctionStore.getState().setConjunctions(conjunctions);
    } else if (id === 'B') {
      set({ anomalyDetectionActive: true, cameraTarget: 'overview' });
      useTelemetryStore.getState().setAnomalyDetectionActive(true);
    } else if (id === 'C') {
      set({ cameraTarget: 'conjunction' });
      const state = get();
      const newConjunctions = screenConjunctions(state.satellites, state.debris, 0);
      set({ conjunctions: newConjunctions });
      useConjunctionStore.getState().setConjunctions(newConjunctions);
      if (newConjunctions.length > 0) {
        const options = generateCAMOptions(newConjunctions[0]);
        set({ camOptions: options });
        useConjunctionStore.getState().setManeuverOptions(options);
      }
    } else {
      set({
        satellites: createConstellationSatellites(),
        debris: createDebrisField(),
        cameraTarget: 'overview'
      });
    }
  },

  tick: (dt: number) => {
    set((state) => {
      const newTime = state.simulationTime + dt;

      // ── Orbital propagation ──
      const newSatellites = state.satellites.map(sat => {
        const newElements = propagateElements(sat.elements, dt);
        const eci = elementsToECI(newElements);
        return { ...sat, elements: newElements, position: eci.position, velocity: eci.velocity };
      });

      const newDebris = state.debris.map(deb => {
        const newElements = propagateElements(deb.elements, dt);
        const eci = elementsToECI(newElements);
        return { ...deb, elements: newElements, position: eci.position, velocity: eci.velocity };
      });

      // ── Telemetry generation ──
      const newTelemetry = generateTelemetrySample(newTime, state.activeScenario, state.currentTelemetry);
      const newHistory = [...state.telemetryHistory, newTelemetry].slice(-120);

      // Push to decoupled telemetry store
      useTelemetryStore.getState().pushSample(newTelemetry);

      // ── Anomaly detection ──
      let newAnomalies = state.anomalies;
      if (state.anomalyDetectionActive) {
        // Compute Mahalanobis D_M^2 score
        const scoreResult = calculateAnomalyScore(newTelemetry, newHistory);
        useTelemetryStore.getState().setAnomalyScore(scoreResult.score);

        const anomaly = detectAnomaly(newTelemetry, newHistory, newTime);
        if (anomaly && !state.anomalies.find(a => a.timestamp === anomaly.timestamp && a.severity === anomaly.severity)) {
          newAnomalies = [anomaly, ...state.anomalies].slice(0, 10);
          useTelemetryStore.getState().addAnomaly(anomaly);
        }
      }

      // ── Conjunction screening ──
      let newConjunctions = state.conjunctions;
      let newCamOptions = state.camOptions;

      if (state.activeScenario === 'A' || state.activeScenario === 'C') {
        newConjunctions = screenConjunctions(newSatellites, newDebris, newTime);
        useConjunctionStore.getState().setConjunctions(newConjunctions);
      }

      if (state.activeScenario === 'C' && newCamOptions.length === 0 && newConjunctions.length > 0) {
        newCamOptions = generateCAMOptions(newConjunctions[0]);
        useConjunctionStore.getState().setManeuverOptions(newCamOptions);
      }

      return {
        simulationTime: newTime,
        satellites: newSatellites,
        debris: newDebris,
        currentTelemetry: newTelemetry,
        telemetryHistory: newHistory,
        anomalies: newAnomalies,
        conjunctions: newConjunctions,
        camOptions: newCamOptions,
      };
    });
  },

  executeManeuver: (optionId: string) => {
    set((state) => {
      const option = state.camOptions.find(o => o.id === optionId);
      if (!option || state.conjunctions.length === 0) return state;

      const maneuverResult = executeCAM(option, state.conjunctions[0]);
      return {
        maneuverResult,
        camOptions: [],
        conjunctions: state.conjunctions.map(c => ({ ...c, active: false })),
      };
    });
  },

  resetSimulation: () => {
    get().activateScenario(null);
  },

  setCameraTarget: (target) => {
    set({ cameraTarget: target });
  },

  setShowMissionReport: (show) => {
    set({ showMissionReport: show });
  },

  toggleSound: () => {
    const newState = !get().soundEnabled;
    set({ soundEnabled: newState });
    useConjunctionStore.getState().toggleSound();
  },
}));
