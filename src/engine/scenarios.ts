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
      name: 'Aegis-1',
      color: '#10B981',
      elements: {
        semiMajorAxis: rE + 420,
        eccentricity: 0.001,
        inclination: 51.6 * (Math.PI / 180),
        raan: 45 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(420)
      }
    },
    {
      ...baseProps,
      id: 'aegis-2',
      name: 'Aegis-2',
      color: '#06B6D4',
      elements: {
        semiMajorAxis: rE + 430,
        eccentricity: 0.001,
        inclination: 51.6 * (Math.PI / 180),
        raan: 105 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(430)
      }
    },
    {
      ...baseProps,
      id: 'aegis-3',
      name: 'Aegis-3',
      color: '#8B5CF6',
      elements: {
        semiMajorAxis: rE + 440,
        eccentricity: 0.001,
        inclination: 97.4 * (Math.PI / 180),
        raan: 180 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(440)
      }
    },
    {
      ...baseProps,
      id: 'aegis-4',
      name: 'Aegis-4',
      color: '#3B82F6',
      elements: {
        semiMajorAxis: rE + 415,
        eccentricity: 0.001,
        inclination: 51.6 * (Math.PI / 180),
        raan: 225 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(415)
      }
    },
    {
      ...baseProps,
      id: 'aegis-5',
      name: 'Aegis-5',
      color: '#F59E0B',
      elements: {
        semiMajorAxis: rE + 450,
        eccentricity: 0.001,
        inclination: 97.4 * (Math.PI / 180),
        raan: 315 * (Math.PI / 180),
        argOfPerigee: Math.random() * 2 * Math.PI,
        trueAnomaly: Math.random() * 2 * Math.PI,
        meanMotion: getMeanMotion(450)
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
    const alt = 380 + Math.random() * 220; // 380-600 km
    const inc = 40 + Math.random() * 60; // 40-100 deg

    debris.push({
      id: isPrimary ? 'debris-cosmos-2251' : `debris-${i}`,
      name: isPrimary ? 'Cosmos-2251 Debris' : `Debris-${i}`,
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
