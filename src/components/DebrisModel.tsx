import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Satellite, ScenarioId } from '../types';

interface DebrisModelProps {
  debris: Satellite;
  isPrimaryThreat?: boolean;
  isHighRisk?: boolean;
  activeScenario?: ScenarioId;
}

export const DebrisModel: React.FC<DebrisModelProps> = ({
  debris,
  isPrimaryThreat = false,
  isHighRisk = false,
  activeScenario,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const rotSpeed = useRef({
    x: (Math.random() - 0.5) * 0.04,
    y: (Math.random() - 0.5) * 0.05,
    z: (Math.random() - 0.5) * 0.03,
  });

  const isThreat = isPrimaryThreat || isHighRisk || Boolean(activeScenario === 'A' && debris.id === 'debris-cosmos-2251');

  useFrame(() => {
    // Dynamic position update in scene units (km / 1000)
    if (groupRef.current) {
      groupRef.current.position.set(
        debris.position.x / 1000,
        debris.position.y / 1000,
        debris.position.z / 1000
      );
    }

    // Dynamic multi-axis tumbling rotation
    if (meshRef.current) {
      meshRef.current.rotation.x += rotSpeed.current.x;
      meshRef.current.rotation.y += rotSpeed.current.y;
      meshRef.current.rotation.z += rotSpeed.current.z;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[debris.position.x / 1000, debris.position.y / 1000, debris.position.z / 1000]}
    >
      {/* ── FRACTURED IRREGULAR DEBRIS SHARD ── */}
      <mesh
        ref={meshRef}
        scale={isThreat ? [0.14, 0.08, 0.2] : [0.06, 0.04, 0.08]}
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={isThreat ? "#ef4444" : "#64748b"}
          roughness={0.65}
          metalness={0.75}
          flatShading
        />
      </mesh>

      {/* ── THREAT RADAR TARGET LOCK RETICLE (Scenario A Primary Debris) ── */}
      {isThreat && (
        <>
          {/* Pulsing Collision Hazard Aura */}
          <mesh scale={[0.35, 0.35, 0.35]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              color="#ef4444"
              wireframe
              transparent
              opacity={0.25}
            />
          </mesh>

          <Html style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center select-none -translate-y-8">
              <div className="w-5 h-5 border border-red-500/80 rounded flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                <span className="w-1 h-1 bg-red-400 rounded-full" />
              </div>
              <div className="mt-1 px-1.5 py-0.5 rounded bg-red-950/90 border border-red-500/60 font-mono text-[9px] font-bold text-red-200 tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)] whitespace-nowrap">
                {debris.name} [TCA: &lt;45m]
              </div>
            </div>
          </Html>
        </>
      )}
    </group>
  );
};

export default DebrisModel;
