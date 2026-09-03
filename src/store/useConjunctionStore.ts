// ── Decoupled Conjunction & Maneuver Store ───────────────────────────────────
// Manages scenario state, conjunction screening results, CDM data, and CAM planning.
// Separated from telemetry to prevent cross-domain re-renders.

import { create } from 'zustand';
import type {
  ConjunctionStoreState,
  ScenarioId,
  ConjunctionEvent,
  CAMOption,
  CDMMsg,
  ManeuverState,
} from '../types';

const initialManeuverState: ManeuverState = {
  computedOptions: [],
  selectedOptionIndex: 0,
  executed: false,
  result: null,
};

export const useConjunctionStore = create<ConjunctionStoreState>((set, get) => ({
  // ── State ──
  activeScenario: null,
  selectedSatId: 'aegis-1',
  conjunctions: [],
  cdmData: null,
  maneuverState: { ...initialManeuverState },
  soundEnabled: true,

  // ── Actions ──
  triggerScenario: (id: ScenarioId) => {
    set({
      activeScenario: id,
      conjunctions: [],
      cdmData: null,
      maneuverState: { ...initialManeuverState },
    });
  },

  executeManeuver: (idx: number) => {
    set((state) => {
      const option = state.maneuverState.computedOptions[idx];
      if (!option) return state;
      return {
        maneuverState: {
          ...state.maneuverState,
          selectedOptionIndex: idx,
          executed: true,
        },
      };
    });
  },

  resetAll: () => {
    set({
      activeScenario: null,
      selectedSatId: 'aegis-1',
      conjunctions: [],
      cdmData: null,
      maneuverState: { ...initialManeuverState },
    });
  },

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  setConjunctions: (conjunctions: ConjunctionEvent[]) => {
    set({ conjunctions });
  },

  setCdmData: (cdm: CDMMsg | null) => {
    set({ cdmData: cdm });
  },

  setManeuverOptions: (options: CAMOption[]) => {
    set((state) => ({
      maneuverState: {
        ...state.maneuverState,
        computedOptions: options,
        selectedOptionIndex: 0,
        executed: false,
        result: null,
      },
    }));
  },

  setSelectedSatId: (id: string) => {
    set({ selectedSatId: id });
  },
}));
