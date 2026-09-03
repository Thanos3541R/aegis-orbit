import { ScenarioConfig, Satellite } from '../types';
import { elementsToECI } from './orbitalMechanics';

export const SCENARIOS: ScenarioConfig[] = [
  { id: 'A', name: 'Debris Conjunction', description: 'Imminent close approach — Aegis-1 vs Cosmos-2251 debris', icon: '🔴', color: 'critical' },
  { id: 'B', name: 'Telemetry Fault', description: 'ADCS wheel saturation + EPS voltage cascade', icon: '⚡', color: 'warning' },
  { id: 'C', name: 'Execute CAM', description: 'Compute and execute optimal collision avoidance burn', icon: '🚀', color: 'accent-blue' }
];

export function createConstellationSatellites(): Satellite[] {
  const rE = 6371;
  const mu = 398600.4418;

  const getMeanMotion = (alt: number) => Math.sqrt(mu / Math.pow(rE + alt, 3));

  const configs = [
    {
      id: 'aegis-1',
      name: 'Aegis-1 (Cartosat-3)',
      color: '#10B981',
      alt: 505,
      inc: 97.4 * (Math.PI / 180),
      raan: 45 * (Math.PI / 180),
      argP: Math.random() * 2 * Math.PI,
      anomaly: Math.random() * 2 * Math.PI,
      ecc: 0.001,
    },
    {
      id: 'cartosat-3',
      name: 'Cartosat-3 Replica',
      color: '#06B6D4',
      alt: 505,
      inc: 97.5 * (Math.PI / 180),
      raan: 105 * (Math.PI / 180),
      argP: Math.random() * 2 * Math.PI,
      anomaly: Math.random() * 2 * Math.PI,
      ecc: 0.001,
    },
    {
      id: 'eos-04',
      name: 'EOS-04 Replica',
      color: '#8B5CF6',
      alt: 529,
      inc: 97.5 * (Math.PI / 180),
      raan: 180 * (Math.PI / 180),
      argP: Math.random() * 2 * Math.PI,
      anomaly: Math.random() * 2 * Math.PI,
      ecc: 0.001,
    },
    {
      id: 'insat-3ds',
      name: 'INSAT-3DS Replica',
      color: '#3B82F6',
      alt: 35786,
      inc: 0.1 * (Math.PI / 180),
      raan: 225 * (Math.PI / 180),
      argP: Math.random() * 2 * Math.PI,
      anomaly: Math.random() * 2 * Math.PI,
      ecc: 0.001,
    },
    {
      id: 'aegis-relay',
      name: 'Aegis-Relay',
      color: '#F59E0B',
      alt: 550,
      inc: 53.0 * (Math.PI / 180),
      raan: 315 * (Math.PI / 180),
      argP: Math.random() * 2 * Math.PI,
      anomaly: Math.random() * 2 * Math.PI,
      ecc: 0.001,
    },
  ];

  return configs.map(c => {
    const elements = {
      semiMajorAxis: rE + c.alt,
      eccentricity: c.ecc,
      inclination: c.inc,
      raan: c.raan,
      argOfPerigee: c.argP,
      trueAnomaly: c.anomaly,
      meanMotion: getMeanMotion(c.alt),
    };
    const eci = elementsToECI(elements);
    return {
      id: c.id,
      name: c.name,
      type: 'active' as const,
      color: c.color,
      visible: true,
      elements,
      position: eci.position,
      velocity: eci.velocity,
    };
  });
}

export function createDebrisField(primarySatellite?: Satellite): Satellite[] {
  const rE = 6371;
  const mu = 398600.4418;
  const debris: Satellite[] = [];

  for (let i = 0; i < 65; i++) {
    const isPrimary = i === 0;
    const isCosmos = i < 33;
    
    let id = `debris-${i}`;
    let name = `Debris-${i}`;
    let alt = 350 + Math.random() * 300; // 350-650 km
    let inc = (40 + Math.random() * 60) * (Math.PI / 180); // 40-100 deg
    let raan = Math.random() * 2 * Math.PI;
    let argP = Math.random() * 2 * Math.PI;
    let anomaly = Math.random() * 2 * Math.PI;
    let ecc = Math.random() * 0.05;

    if (isPrimary) {
      id = 'debris-cosmos-2251';
      name = 'Cosmos-2251 Debris';
      alt = 505.05;
      inc = primarySatellite ? primarySatellite.elements.inclination + 0.0002 : 97.4 * (Math.PI / 180) + 0.0002;
      raan = primarySatellite ? primarySatellite.elements.raan : 45 * (Math.PI / 180);
      argP = primarySatellite ? primarySatellite.elements.argOfPerigee : 0.5;
      anomaly = primarySatellite ? primarySatellite.elements.trueAnomaly + 0.00035 : 0.50035;
      ecc = 0.001;
    } else if (isCosmos) {
      name = `Cosmos-2251 Debris-${i}`;
    } else {
      name = `FY-1C Debris-${i}`;
    }

    const elements = {
      semiMajorAxis: rE + alt,
      eccentricity: ecc,
      inclination: inc,
      raan,
      argOfPerigee: argP,
      trueAnomaly: anomaly,
      meanMotion: Math.sqrt(mu / Math.pow(rE + alt, 3)),
    };

    const eci = elementsToECI(elements);

    debris.push({
      id,
      name,
      type: 'debris',
      color: '#4B5563',
      visible: true,
      elements,
      position: eci.position,
      velocity: eci.velocity,
    });
  }

  return debris;
}
