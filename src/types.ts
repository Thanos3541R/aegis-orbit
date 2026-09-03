// ── AegisOrbit Shared Types ─────────────────────────────────────────────────

export type ScenarioId = 'A' | 'B' | 'C' | null;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Scenario Config ─────────────────────────────────────────────────────────

export interface ScenarioConfig {
  id: 'A' | 'B' | 'C';
  name: string;
  description: string;
  icon: string;
  color: string;
}

// ── Orbital Elements ────────────────────────────────────────────────────────

export interface OrbitalElements {
  semiMajorAxis: number;      // km (Earth radii + altitude)
  eccentricity: number;
  inclination: number;        // radians
  raan: number;               // Right Ascension of Ascending Node (radians)
  argOfPerigee: number;       // radians
  trueAnomaly: number;        // radians (time-evolving)
  meanMotion: number;         // rad/s
}

export interface Satellite {
  id: string;
  name: string;
  type: 'active' | 'debris';
  elements: OrbitalElements;
  position: Vec3;             // ECI km
  velocity: Vec3;             // ECI km/s
  color: string;
  visible: boolean;
}

// ── Telemetry ───────────────────────────────────────────────────────────────

export interface TelemetrySample {
  timestamp: number;           // seconds since sim start
  wheelSpeed1: number;         // RPM
  wheelSpeed2: number;         // RPM
  wheelSpeed3: number;         // RPM
  busVoltage: number;          // Volts
  solarCurrent: number;        // Amps
  batterySoc: number;          // %
  fuelMass: number;            // kg
  panelTemp: number;           // °C
  [key: string]: number;       // index signature for dynamic access
}

export interface TelemetryChannel {
  id: string;
  key: string;
  name: string;
  label: string;
  unit: string;
  nominalRange: [number, number];
  warningRange: [number, number];
  color: string;
}

// ── Anomaly Detection ───────────────────────────────────────────────────────

export type AnomalySeverity = 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

export interface AnomalyEvent {
  id: string;
  timestamp: number;
  severity: AnomalySeverity;
  score: number;              // reconstruction error score
  message: string;            // explanation string
  affectedChannels: string[];
  rootCause: string;          // XAI explanation string
  sigmaValues: Record<string, number>; // channel → sigma divergence
}

// ── Conjunction ─────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ConjunctionEvent {
  id: string;
  primaryId: string;
  primaryName: string;
  secondaryId: string;
  secondaryName: string;
  tca: number;                // seconds from now to TCA
  missDistance: number;        // meters
  collisionProbability: number; // Pc
  riskLevel: RiskLevel;
  relativeVelocity: number;   // km/s
  ricPosition: Vec3;          // Radial, In-track, Cross-track (m)
  covariancePrimary: number[];   // 6 elements for 3x3 symmetric matrix
  covarianceSecondary: number[];
  covariance: number[][];      // 3x3 covariance matrix (alternative format)
  active: boolean;
}

// ── Collision Avoidance Maneuver ─────────────────────────────────────────────

export interface CAMOption {
  id: string;
  label: string;
  description: string;
  burnDirection: 'along-track' | 'radial' | 'cross-track';
  deltaV: number;             // m/s
  fuelCost: number;           // grams of hydrazine
  postManeuverPc: number;
  orbitAltitudeChange: number; // km
  separationRate: number;      // m/s at TCA
  constellationLifetimeImpact: string;
  payloadBlackoutMinutes: number;
}

export interface ManeuverResult {
  executed: boolean;
  success: boolean;
  selectedOptionId: string;
  executedOptionId: string;
  executionTime: number;
  preManeuverPc: number;
  postManeuverPc: number;
  finalPc: number;
  deltaV: number;
  fuelUsed: number;
  newAltitude: number;
  message: string;
}

// ── CCSDS 508.0-B-1 Conjunction Data Message ────────────────────────────────

export type CDMFormat = 'JSON' | 'KVN';

export interface CDMMsg {
  CCSDS_CDM_VERS: string;
  CREATION_DATE: string;
  ORIGINATOR: string;
  MESSAGE_ID: string;
  TCA: string;
  MISS_DISTANCE: string;          // meters
  RELATIVE_SPEED: string;         // km/s
  COLLISION_PROBABILITY: string;
  EMERGENCY_REPORTABLE: string;
  OBJECT1_DESIGNATOR: string;
  OBJECT1_NAME: string;
  OBJECT1_CATALOG_NAME: string;
  OBJECT1_OBJECT_TYPE: string;
  OBJECT1_MANEUVERABLE: string;
  OBJECT2_DESIGNATOR: string;
  OBJECT2_NAME: string;
  OBJECT2_CATALOG_NAME: string;
  OBJECT2_OBJECT_TYPE: string;
  OBJECT2_MANEUVERABLE: string;
  COVARIANCE_METHOD: string;
  COVARIANCE_RTN_OBJECT1: number[];   // 6-element upper-triangle
  COVARIANCE_RTN_OBJECT2: number[];
}

// ── Pareto CAM Trade-Off ────────────────────────────────────────────────────

export interface ParetoPoint {
  riskTolerance: number;     // 1e-5 to 1e-8
  deltaV: number;            // m/s
  fuelCostGrams: number;     // g
  missionLifetimeLossDays: number;
}

// ── Decoupled Store Interfaces ──────────────────────────────────────────────

export interface TelemetryStoreState {
  // State
  rollingTelemetry: TelemetrySample[];  // last 120 samples
  anomalyScore: number;                 // current Mahalanobis D_M^2
  activeAnomalies: AnomalyEvent[];
  anomalyDetectionActive: boolean;

  // Actions
  pushSample: (sample: TelemetrySample) => void;
  setAnomalies: (anomalies: AnomalyEvent[]) => void;
  addAnomaly: (anomaly: AnomalyEvent) => void;
  setAnomalyDetectionActive: (active: boolean) => void;
  setAnomalyScore: (score: number) => void;
  resetTelemetry: () => void;
}

export interface ManeuverState {
  computedOptions: CAMOption[];
  selectedOptionIndex: number;
  executed: boolean;
  result: ManeuverResult | null;
}

export interface ConjunctionStoreState {
  // State
  activeScenario: ScenarioId;
  selectedSatId: string;
  conjunctions: ConjunctionEvent[];
  cdmData: CDMMsg | null;
  maneuverState: ManeuverState;
  soundEnabled: boolean;

  // Actions
  triggerScenario: (id: ScenarioId) => void;
  executeManeuver: (idx: number) => void;
  resetAll: () => void;
  toggleSound: () => void;
  setConjunctions: (conjunctions: ConjunctionEvent[]) => void;
  setCdmData: (cdm: CDMMsg | null) => void;
  setManeuverOptions: (options: CAMOption[]) => void;
  setSelectedSatId: (id: string) => void;
}

// ── Unified Store (Backwards-Compatible Orchestrator) ───────────────────────

export interface AppState {
  // Scenario
  activeScenario: ScenarioId;
  simulationTime: number;
  isRunning: boolean;

  // Orbital
  satellites: Satellite[];
  debris: Satellite[];

  // Telemetry
  telemetryHistory: TelemetrySample[];
  currentTelemetry: TelemetrySample | null;

  // Anomaly
  anomalies: AnomalyEvent[];
  anomalyDetectionActive: boolean;

  // Conjunction
  conjunctions: ConjunctionEvent[];

  // Maneuver
  camOptions: CAMOption[];
  maneuverResult: ManeuverResult | null;

  // UI & Playback
  cameraTarget: 'overview' | 'aegis1' | 'conjunction' | 'india' | null;
  showMissionReport: boolean;
  soundEnabled: boolean;
  simSpeed: number;
  isPaused: boolean;

  // Actions
  activateScenario: (id: ScenarioId) => void;
  resetSimulation: () => void;
  tick: (dt: number) => void;
  executeManeuver: (optionOrId: string | CAMOption) => void;
  setCameraTarget: (target: 'overview' | 'aegis1' | 'conjunction' | 'india' | null) => void;
  setShowMissionReport: (show: boolean) => void;
  toggleSound: () => void;
  setSimSpeed: (speed: number) => void;
  togglePause: () => void;
}
