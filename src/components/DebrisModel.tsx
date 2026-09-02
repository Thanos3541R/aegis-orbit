import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Satellite, ScenarioId } from '../types';

interface DebrisModelProps {
  debris: Satellite;
  isHighRisk?: boolean;
  activeScenario?: ScenarioId;
}

export const DebrisModel: React.FC<DebrisModelProps> = ({
  debris,
  isHighRisk = false,
  activeScenario,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const isCosmos = debris.id === 'debris-cosmos-2251';

  // Random tumbling rotation rates
  const tumbleSpeed = useRef({
    x: (Math.random() - 0.5) * 0.02 + 0.005,
    y: (Math.random() - 0.5) * 0.02 + 0.005,
    z: (Math.random() - 0.5) * 0.02 + 0.005,
  });

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += tumbleSpeed.current.x;
      meshRef.current.rotation.y += tumbleSpeed.current.y;
      meshRef.current.rotation.z += tumbleSpeed.current.z;
    }
  });

  const pos: [number, number, number] = [
    debris.position.x / 1000,
    debris.position.y / 1000,
    debris.position.z / 1000,
  ];

  const showHazardLabel = isCosmos && (activeScenario === 'A' || activeScenario === 'C' || isHighRisk);

  return (
    <group position={pos}>
      <group ref={meshRef}>
        {isCosmos ? (
          /* ── COSMOS-2251 DERELICT/DEBRIS (Broken satellite with damaged solar array & charred bus) ── */
          <group scale={[1.2, 1.2, 1.2]}>
            {/* Charred/Damaged Bus */}
            <mesh>
              <boxGeometry args={[0.16, 0.16, 0.22]} />
              <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.4} />
            </mesh>
            {/* Broken solar wing on one side */}
            <group position={[0.18, 0, 0]} rotation={[0.2, 0.3, 0.1]}>
              <mesh>
                <boxGeometry args={[0.25, 0.12, 0.01]} />
                <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.5} wireframe />
              </mesh>
            </group>
            {/* Snapped boom on other side */}
            <mesh position={[-0.10, 0, 0]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.008, 0.008, 0.06, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            {/* Warning Ring */}
            <mesh>
              <ringGeometry args={[0.35, 0.38, 16]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ) : (
          /* ── GENERIC SPACE DEBRIS SHARDS & ROCKET BODIES ── */
          <mesh>
            <dodecahedronGeometry args={[0.035, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.7} metalness={0.6} />
          </mesh>
        )}
      </group>

      {/* High-Risk Threat Label (Constant screen-space pixel size) */}
      {showHazardLabel && (
        <Html
          position={[0, 0.35, 0]}
          center
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="px-2 py-0.5 rounded bg-red-950/90 border border-red-500 font-mono text-[10px] text-red-200 whitespace-nowrap shadow-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <b className="text-white font-bold">COSMOS-2251</b>
            <span className="text-[8px] bg-red-600 text-white font-bold px-1 rounded">THREAT</span>
          </div>
        </Html>
      )}
    </group>
  );
};
