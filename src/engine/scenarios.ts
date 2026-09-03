import { ScenarioConfig, Satellite } from '../types';

export const SCENARIOS: ScenarioConfig[] = [
  { id: 'A', name: 'Debris Conjunction', description: 'Imminent close approach — Aegis-1 vs Cosmos-2251 debris', icon: '🔴', color: 'critical' },
  { id: 'B', name: 'Telemetry Fault', description: 'ADCS wheel saturation + EPS voltage cascade', icon: '⚡', color: 'warning' },
  { id: 'C', name: 'Execute CAM', description: 'Compute and execute optimal collision avoidance burn', icon: '🚀', color: 'accent-blue' }
];

export function createConstellationSatellites(): Satellite[] {
  const rE = 6371;
  const mu = 398600.4418;

  const baseProps = {
    type: 'active' as const,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    visible: true,
  };

  const getMeanMotion = (alt: number) => Math.sqrt(mu / Math.pow(rE + alt, 3));

  return [
    {
      ...baseProps,
      id: 'aegis-1',
      name: 'Aegis-1 (Cartosat-3)',
      color: '#10B981',
      elements: {
        semiMajorAxis: rE + 505,
        eccentricity: 0.001,
        inclination: 97.4 * (Math.PI / 180),
        raan: 45 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(505)
      }
    },
    {
      ...baseProps,
      id: 'cartosat-3',
      name: 'Cartosat-3 Replica',
      color: '#06B6D4',
      elements: {
        semiMajorAxis: rE + 505,
        eccentricity: 0.001,
        inclination: 97.5 * (Math.PI / 180),
        raan: 105 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(505)
      }
    },
    {
      ...baseProps,
      id: 'eos-04',
      name: 'EOS-04 Replica',
      color: '#8B5CF6',
      elements: {
        semiMajorAxis: rE + 529,
        eccentricity: 0.001,
        inclination: 97.5 * (Math.PI / 180),
        raan: 180 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(529)
      }
    },
    {
      ...baseProps,
      id: 'insat-3ds',
      name: 'INSAT-3DS Replica',
      color: '#3B82F6',
      elements: {
        semiMajorAxis: rE + 35786,
        eccentricity: 0.001,
        inclination: 0.1 * (Math.PI / 180),
        raan: 225 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(35786)
      }
    },
    {
      ...baseProps,
      id: 'aegis-relay',
      name: 'Aegis-Relay',
      color: '#F59E0B',
      elements: {
        semiMajorAxis: rE + 550,
        eccentricity: 0.001,
        inclination: 53.0 * (Math.PI / 180),
        raan: 315 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(550)
      }
    }
  ];
}

export function createDebrisField(): Satellite[] {
  const rE = 6371;
  const mu = 398600.4418;
  const debris: Satellite[] = [];

  for (let i = 0; i < 65; i++) {
    const isPrimary = i === 0;
    const isCosmos = i < 33;
    const alt = 350 + Math.random() * 300; // 350-650 km
    const inc = 40 + Math.random() * 60; // 40-100 deg
    
    let id = `debris-${i}`;
    let name = `Debris-${i}`;
    if (isPrimary) {
      id = 'debris-cosmos-2251';
      name = 'Cosmos-2251 Debris';
    } else if (isCosmos) {
      name = `Cosmos-2251 Debris-${i}`;
    } else {
      name = `FY-1C Debris-${i}`;
    }

    debris.push({
      id,
      name,
      type: 'debris',
      color: '#4B5563',
      visible: true,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      elements: {
        semiMajorAxis: rE + alt,
        eccentricity: Math.random() * 0.05,
        inclination: inc * (Math.PI / 180),
        raan: Math.random() * 2 * Math.PI,
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: Math.sqrt(mu / Math.pow(rE + alt, 3))
      }
    });
  }

  return debris;
}
