import { Satellite, ConjunctionEvent, RiskLevel } from '../types';

export function assessRisk(pc: number): RiskLevel {
  if (pc > 1e-4) return 'CRITICAL';
  if (pc > 1e-5) return 'HIGH';
  if (pc > 1e-7) return 'MEDIUM';
  return 'LOW';
}

export function screenConjunctions(
  satellites: Satellite[],
  debris: Satellite[],
  simTime: number
): ConjunctionEvent[] {
  const events: ConjunctionEvent[] = [];

  // Always generate the high-priority conjunction
  events.push({
    id: 'conj-1',
    primaryId: 'aegis-1',
    primaryName: 'Aegis-1',
    secondaryId: 'debris-cosmos-2251',
    secondaryName: 'Cosmos-2251 Debris',
    tca: Math.max(0, 2700 - simTime),
    missDistance: 147,
    collisionProbability: 4.2e-3,
    riskLevel: 'CRITICAL',
    relativeVelocity: 14.2,
    ricPosition: { x: 45, y: -130, z: 28 },
    covariancePrimary: [100, 10, 5, 200, -15, 50],
    covarianceSecondary: [80, 5, 3, 150, -10, 40],
    covariance: [
      [100, 10, 5],
      [10, 200, -15],
      [5, -15, 50]
    ],
    active: true,
  });

  // Background conjunction 2
  events.push({
    id: 'conj-2',
    primaryId: 'aegis-3',
    primaryName: 'Aegis-3',
    secondaryId: 'debris-10',
    secondaryName: 'Debris-10',
    tca: Math.max(0, 15000 - simTime),
    missDistance: 3200,
    collisionProbability: 1.5e-6,
    riskLevel: assessRisk(1.5e-6),
    relativeVelocity: 9.8,
    ricPosition: { x: 1200, y: -2500, z: 800 },
    covariancePrimary: [500, 0, 0, 500, 0, 500],
    covarianceSecondary: [500, 0, 0, 500, 0, 500],
    covariance: [[500, 0, 0], [0, 500, 0], [0, 0, 500]],
    active: true,
  });

  // Background conjunction 3
  events.push({
    id: 'conj-3',
    primaryId: 'aegis-4',
    primaryName: 'Aegis-4',
    secondaryId: 'debris-42',
    secondaryName: 'Debris-42',
    tca: Math.max(0, 43200 - simTime),
    missDistance: 8500,
    collisionProbability: 2.1e-8,
    riskLevel: assessRisk(2.1e-8),
    relativeVelocity: 12.1,
    ricPosition: { x: -4000, y: 7000, z: 2000 },
    covariancePrimary: [1000, 0, 0, 1000, 0, 1000],
    covarianceSecondary: [1000, 0, 0, 1000, 0, 1000],
    covariance: [[1000, 0, 0], [0, 1000, 0], [0, 0, 1000]],
    active: true,
  });

  // Background conjunction 4
  events.push({
    id: 'conj-4',
    primaryId: 'aegis-2',
    primaryName: 'Aegis-2',
    secondaryId: 'debris-27',
    secondaryName: 'Debris-27',
    tca: Math.max(0, 72000 - simTime),
    missDistance: 12400,
    collisionProbability: 8.7e-9,
    riskLevel: assessRisk(8.7e-9),
    relativeVelocity: 11.3,
    ricPosition: { x: 5000, y: -10000, z: 3500 },
    covariancePrimary: [2000, 0, 0, 2000, 0, 2000],
    covarianceSecondary: [2000, 0, 0, 2000, 0, 2000],
    covariance: [[2000, 0, 0], [0, 2000, 0], [0, 0, 2000]],
    active: true,
  });

  return events;
}

export function calculatePc(
  missDistance: number,
  combinedCovariance: number,
  objectRadius: number
): number {
  const u = (objectRadius * objectRadius) / combinedCovariance;
  const v = (missDistance * missDistance) / combinedCovariance;
  return Math.exp(-v / 2) * (1 - Math.exp(-u / 2));
}

export function generateCDM(
  conjunction: ConjunctionEvent,
  satellites: Satellite[]
): Record<string, unknown> {
  const primary = satellites.find(s => s.id === conjunction.primaryId);
  const secondary = [...satellites].find(s => s.id === conjunction.secondaryId);

  return {
    CCSDS_CDM_VERS: '1.0',
    CREATION_DATE: new Date().toISOString(),
    ORIGINATOR: 'AegisOrbit SSA System',
    MESSAGE_FOR: conjunction.primaryName,
    MESSAGE_ID: `CDM-${conjunction.id}-${Date.now()}`,
    TCA: `T-${Math.floor(conjunction.tca / 60)}min ${Math.floor(conjunction.tca % 60)}s`,
    MISS_DISTANCE: `${conjunction.missDistance} m`,
    RELATIVE_SPEED: `${conjunction.relativeVelocity} km/s`,
    COLLISION_PROBABILITY: conjunction.collisionProbability,
    COLLISION_PROBABILITY_METHOD: "FOSTER-1992",
    OBJECT1: {
      OBJECT_DESIGNATOR: primary?.id || conjunction.primaryId,
      OBJECT_NAME: conjunction.primaryName,
      INTERNATIONAL_DESIGNATOR: '2024-001A',
      OBJECT_TYPE: 'PAYLOAD',
      EPHEMERIS_NAME: 'AegisOrbit Propagator v1.0',
      COVARIANCE_METHOD: 'CALCULATED',
      MANEUVERABLE: 'YES',
      ORBIT_CENTER: 'EARTH',
      REF_FRAME: 'EME2000',
    },
    OBJECT2: {
      OBJECT_DESIGNATOR: secondary?.id || conjunction.secondaryId,
      OBJECT_NAME: conjunction.secondaryName,
      INTERNATIONAL_DESIGNATOR: '1993-036PL',
      OBJECT_TYPE: 'DEBRIS',
      EPHEMERIS_NAME: 'AegisOrbit Propagator v1.0',
      COVARIANCE_METHOD: 'CALCULATED',
      MANEUVERABLE: 'N/A',
      ORBIT_CENTER: 'EARTH',
      REF_FRAME: 'EME2000',
    },
  };
}
