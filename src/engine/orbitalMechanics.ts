import { OrbitalElements, Vec3 } from '../types';

export const EARTH_RADIUS = 6371; // km
export const EARTH_MU = 398600.4418; // km³/s²
export const J2 = 1.08263e-3;

export function elementsToECI(elements: OrbitalElements): { position: Vec3; velocity: Vec3 } {
  const a = elements.semiMajorAxis;
  const e = elements.eccentricity;
  const i = elements.inclination;
  const raan = elements.raan;
  const argP = elements.argOfPerigee;
  const v = elements.trueAnomaly;

  const p = a * (1 - e * e);
  const r = p / (1 + e * Math.cos(v));

  // Position in perifocal coordinates
  const pX = r * Math.cos(v);
  const pY = r * Math.sin(v);
  const pZ = 0;

  // Velocity in perifocal coordinates
  const h = Math.sqrt(EARTH_MU * p);
  const vX = -(EARTH_MU / h) * Math.sin(v);
  const vY = (EARTH_MU / h) * (e + Math.cos(v));
  const vZ = 0;

  // Rotation matrices
  const ci = Math.cos(i);
  const si = Math.sin(i);
  const co = Math.cos(raan);
  const so = Math.sin(raan);
  const cw = Math.cos(argP);
  const sw = Math.sin(argP);

  const r11 = co * cw - so * sw * ci;
  const r12 = -co * sw - so * cw * ci;
  const r21 = so * cw + co * sw * ci;
  const r22 = -so * sw + co * cw * ci;
  const r31 = sw * si;
  const r32 = cw * si;

  return {
    position: {
      x: r11 * pX + r12 * pY,
      y: r21 * pX + r22 * pY,
      z: r31 * pX + r32 * pY,
    },
    velocity: {
      x: r11 * vX + r12 * vY,
      y: r21 * vX + r22 * vY,
      z: r31 * vX + r32 * vY,
    }
  };
}

export function propagateElements(elements: OrbitalElements, dt: number): OrbitalElements {
  const a = elements.semiMajorAxis;
  const e = elements.eccentricity;
  const i = elements.inclination;
  let raan = elements.raan;
  let argP = elements.argOfPerigee;

  // Mean motion
  const n = Math.sqrt(EARTH_MU / Math.pow(a, 3));
  
  // Convert true anomaly to eccentric anomaly
  const E0 = Math.acos((e + Math.cos(elements.trueAnomaly)) / (1 + e * Math.cos(elements.trueAnomaly))) * Math.sign(Math.sin(elements.trueAnomaly));
  
  // Convert eccentric anomaly to mean anomaly
  const M0 = E0 - e * Math.sin(E0);
  
  // Advance mean anomaly
  const M = M0 + n * dt;

  // Newton's method for E
  let E = M;
  for (let iter = 0; iter < 5; iter++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }

  // True anomaly
  const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));

  // J2 Perturbations
  const p = a * (1 - e * e);
  const j2Factor = (3 / 2) * J2 * Math.pow(EARTH_RADIUS / p, 2) * n;
  
  const raanDot = -j2Factor * Math.cos(i);
  const argPDot = j2Factor * (2 - (5 / 2) * Math.pow(Math.sin(i), 2));

  raan += raanDot * dt;
  argP += argPDot * dt;

  return {
    ...elements,
    trueAnomaly: v,
    raan: (raan + 2 * Math.PI) % (2 * Math.PI),
    argOfPerigee: (argP + 2 * Math.PI) % (2 * Math.PI),
  };
}

export function eciToRIC(refPos: Vec3, refVel: Vec3, targetPos: Vec3): Vec3 {
  // R vector
  const rMag = Math.sqrt(refPos.x * refPos.x + refPos.y * refPos.y + refPos.z * refPos.z);
  const rHat = { x: refPos.x / rMag, y: refPos.y / rMag, z: refPos.z / rMag };

  // C vector (Angular momentum)
  const c = {
    x: refPos.y * refVel.z - refPos.z * refVel.y,
    y: refPos.z * refVel.x - refPos.x * refVel.z,
    z: refPos.x * refVel.y - refPos.y * refVel.x
  };
  const cMag = Math.sqrt(c.x * c.x + c.y * c.y + c.z * c.z);
  const cHat = { x: c.x / cMag, y: c.y / cMag, z: c.z / cMag };

  // I vector (In-track)
  const iHat = {
    x: cHat.y * rHat.z - cHat.z * rHat.y,
    y: cHat.z * rHat.x - cHat.x * rHat.z,
    z: cHat.x * rHat.y - cHat.y * rHat.x
  };

  const dr = {
    x: targetPos.x - refPos.x,
    y: targetPos.y - refPos.y,
    z: targetPos.z - refPos.z
  };

  return {
    x: dr.x * rHat.x + dr.y * rHat.y + dr.z * rHat.z,
    y: dr.x * iHat.x + dr.y * iHat.y + dr.z * iHat.z,
    z: dr.x * cHat.x + dr.y * cHat.y + dr.z * cHat.z
  };
}

export function distance(a: Vec3, b: Vec3): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}

export function eciToLatLon(pos: Vec3, gmst: number): { lat: number; lon: number; alt: number } {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const lat = Math.asin(pos.z / r);
  let lon = Math.atan2(pos.y, pos.x) - gmst;
  
  // Normalize lon to -PI to PI
  lon = lon % (2 * Math.PI);
  if (lon > Math.PI) lon -= 2 * Math.PI;
  if (lon < -Math.PI) lon += 2 * Math.PI;

  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI,
    alt: r - EARTH_RADIUS
  };
}
