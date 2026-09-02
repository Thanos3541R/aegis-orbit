import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConjunctionEvent, Satellite } from '../types';

interface CovarianceEllipsoidProps {
  conjunction: ConjunctionEvent;
  satellites: Satellite[];
}

export const CovarianceEllipsoid: React.FC<CovarianceEllipsoidProps> = ({ conjunction, satellites }) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      const time = clock.getElapsedTime();
      materialRef.current.opacity = 0.1 + (Math.sin(time * 5) * 0.5 + 0.5) * 0.15;
    }
  });

  const primary = satellites.find(s => s.id === conjunction.primaryId);
  if (!primary) return null;

  const pos: [number, number, number] = [
    primary.position.x / 1000, 
    primary.position.y / 1000, 
    primary.position.z / 1000
  ];
  
  const cov = conjunction.covariancePrimary;
  const sx = Math.max(0.1, Math.sqrt(Math.abs(cov[0] || 100)) / 100);
  const sy = Math.max(0.1, Math.sqrt(Math.abs(cov[3] || 200)) / 100);
  const sz = Math.max(0.1, Math.sqrt(Math.abs(cov[5] || 50)) / 100);
  
  const secondary = satellites.find(s => s.id === conjunction.secondaryId);
  const secP: [number, number, number] = secondary 
    ? [secondary.position.x / 1000, secondary.position.y / 1000, secondary.position.z / 1000]
    : pos;

  const missLine = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...pos),
      new THREE.Vector3(...secP)
    ]);
    const mat = new THREE.LineDashedMaterial({ color: '#EF4444', dashSize: 0.3, gapSize: 0.1 });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    return line;
  }, [pos[0], pos[1], pos[2], secP[0], secP[1], secP[2]]);

  return (
    <group>
      <mesh position={pos} scale={[sx, sy, sz]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          ref={materialRef} 
          color="#EF4444" 
          transparent 
          opacity={0.15} 
          wireframe 
        />
      </mesh>
      
      {secondary && (
        <primitive object={missLine} />
      )}
    </group>
  );
};
