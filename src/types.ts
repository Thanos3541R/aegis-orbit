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

// ── Store ───────────────────────────────────────────────────────────────────

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
  
  // UI
  cameraTarget: 'overview' | 'aegis1' | 'conjunction' | null;
  showMissionReport: boolean;
  
  // Actions
  activateScenario: (id: ScenarioId) => void;
  resetSimulation: () => void;
  tick: (dt: number) => void;
  executeManeuver: (optionId: string) => void;
  setCameraTarget: (target: 'overview' | 'aegis1' | 'conjunction' | null) => void;
  setShowMissionReport: (show: boolean) => void;
}
