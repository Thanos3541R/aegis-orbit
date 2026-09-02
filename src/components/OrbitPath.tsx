import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Satellite, ScenarioId } from '../types';
import { SatelliteModel } from './SatelliteModel';

interface OrbitPathProps {
  satellite: Satellite;
  isTargeted?: boolean;
  activeScenario?: ScenarioId;
  isConjunctionTarget?: boolean;
}

export const OrbitPath: React.FC<OrbitPathProps> = ({
  satellite,
  isTargeted = false,
  activeScenario,
  isConjunctionTarget = false
}) => {
  const orbitPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const { semiMajorAxis, eccentricity, inclination, raan, argOfPerigee } = satellite.elements;

    const a = semiMajorAxis;
    const e = eccentricity;
    const i = inclination;
    const O = raan;
    const w = argOfPerigee;

    for (let j = 0; j <= 128; j++) {
      const trueAnomaly = (j / 128) * Math.PI * 2;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));

      const xPlane = r * Math.cos(trueAnomaly);
      const yPlane = r * Math.sin(trueAnomaly);

      const cosO = Math.cos(O), sinO = Math.sin(O);
      const cosw = Math.cos(w), sinw = Math.sin(w);
      const cosi = Math.cos(i), sini = Math.sin(i);

      const xEci = xPlane * (cosO * cosw - sinO * sinw * cosi) - yPlane * (cosO * sinw + sinO * cosw * cosi);
      const yEci = xPlane * (sinO * cosw + cosO * sinw * cosi) - yPlane * (sinO * sinw - cosO * cosw * cosi);
      const zEci = xPlane * (sinw * sini) + yPlane * (cosw * sini);

      points.push(new THREE.Vector3(xEci / 1000, yEci / 1000, zEci / 1000));
    }

    return points;
  }, [
    satellite.elements.semiMajorAxis,
    satellite.elements.eccentricity,
    satellite.elements.inclination,
    satellite.elements.raan,
    satellite.elements.argOfPerigee
  ]);

  const orbitGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(orbitPoints);
  }, [orbitPoints]);

  const isCritical = (activeScenario === 'A' && satellite.id === 'aegis-1') || isConjunctionTarget;

  return (
    <group>
      {/* Orbital Path Track Line */}
      <primitive
        object={
          new THREE.Line(
            orbitGeometry,
            new THREE.LineBasicMaterial({
              color: isCritical ? '#ef4444' : satellite.color,
              opacity: isCritical ? 0.9 : 0.45,
              transparent: true,
              linewidth: isCritical ? 2 : 1
            })
          )
        }
      />

      {/* Realistic 3D Satellite Model */}
      {satellite.type === 'active' && (
        <SatelliteModel
          satellite={satellite}
          isTargeted={isTargeted}
          activeScenario={activeScenario}
          isConjunctionTarget={isConjunctionTarget}
        />
      )}
    </group>
  );
};
