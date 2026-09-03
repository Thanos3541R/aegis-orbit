import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Satellite, ScenarioId } from '../types';

interface SatelliteModelProps {
  satellite: Satellite;
  isManeuvering?: boolean;
  isTargeted?: boolean;
  activeScenario?: ScenarioId;
  isConjunctionTarget?: boolean;
}

export const SatelliteModel: React.FC<SatelliteModelProps> = ({
  satellite,
  isManeuvering = false,
  isTargeted = false,
  activeScenario,
  isConjunctionTarget = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const plumeRef = useRef<THREE.Mesh>(null);

  const isBurn = isManeuvering || (activeScenario === 'C' && isConjunctionTarget);

  useFrame(() => {
    if (!groupRef.current) return;

    // Update position in scene units (km / 1000)
    groupRef.current.position.set(
      satellite.position.x / 1000,
      satellite.position.y / 1000,
      satellite.position.z / 1000
    );

    // Nadir-pointing Earth orientation
    const p = new THREE.Vector3(satellite.position.x, satellite.position.y, satellite.position.z).normalize();
    const v = new THREE.Vector3(satellite.velocity.x, satellite.velocity.y, satellite.velocity.z).normalize();
    
    // In model space: -Y is Nadir telescope, +Z is along-track velocity
    const yAxis = p.clone().negate();
    const zAxis = v.clone();
    const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
    const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
    groupRef.current.quaternion.setFromRotationMatrix(rotMatrix);

    // Pulse thruster exhaust plume if active burn is underway
    if (isBurn && plumeRef.current) {
      plumeRef.current.scale.set(
        1 + Math.sin(Date.now() * 0.03) * 0.2,
        1 + Math.cos(Date.now() * 0.04) * 0.25,
        1 + Math.sin(Date.now() * 0.03) * 0.2
      );
    }
  });

  const isHighlighted = isTargeted || isConjunctionTarget;

  return (
    <group
      ref={groupRef}
      position={[satellite.position.x / 1000, satellite.position.y / 1000, satellite.position.z / 1000]}
      scale={[0.18, 0.18, 0.18]}
    >
      {/* ── 1. MAIN SATELLITE BUS (Gold MLI Thermal Foil) ── */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.4, 1.2]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.88}
          roughness={0.22}
          bumpScale={0.05}
        />
      </mesh>

      {/* Equipment Collar / Service Ring */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.2, 24]} />
        <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ── 2. CARTOSAT-3 OPTICAL IMAGING TELESCOPE (Nadir-Pointing) ── */}
      <group position={[0, -0.9, 0]}>
        {/* Telescope Barrel */}
        <mesh>
          <cylinderGeometry args={[0.42, 0.48, 0.5, 32]} />
          <meshStandardMaterial color="#1a202c" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Optical Aperture Lens with Anti-Reflective Glare */}
        <mesh position={[0, -0.26, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.02, 32]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0284c7"
            emissiveIntensity={0.6}
            metalness={1.0}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* ── 3. SOLAR ARRAY WINGS (Left & Right Photovoltaic Arrays) ── */}
      {[-1, 1].map((dir) => (
        <group key={dir} position={[dir * 1.5, 0, 0]}>
          {/* Carbon Fiber Mounting Gimbal Arm */}
          <mesh position={[-dir * 0.5, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 12]} />
            <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Silicon Photovoltaic Panel Surface */}
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.9, 0.03]} />
            <meshStandardMaterial
              color="#0c2340"
              roughness={0.15}
              metalness={0.7}
            />
          </mesh>

          {/* Metallic Solar Panel Frame & Trim */}
          <mesh>
            <boxGeometry args={[1.64, 0.94, 0.02]} />
            <meshBasicMaterial color="#94a3b8" wireframe />
          </mesh>
        </group>
      ))}

      {/* ── 4. GIMBALED HIGH-GAIN COMMUNICATIONS ANTENNA ── */}
      <group position={[0, 0.8, 0.4]} rotation={[0.4, 0, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Feed Horn */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* ── 5. HYDRAZINE REACTION CONTROL SYSTEM (RCS) NOZZLES ── */}
      {[
        [-0.55, 0.65, -0.55],
        [0.55, 0.65, -0.55],
        [-0.55, 0.65, 0.55],
        [0.55, 0.65, 0.55]
      ].map(([nx, ny, nz], i) => (
        <mesh key={i} position={[nx, ny, nz]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.06, 0.14, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* ── 6. DYNAMIC ACTIVE CAM EXHAUST PLUME ── */}
      {isBurn && (
        <group position={[0, 0.95, 0]} rotation={[0, 0, 0]}>
          <mesh ref={plumeRef}>
            <coneGeometry args={[0.22, 0.9, 16]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight color="#06b6d4" intensity={4} distance={4} />
        </group>
      )}

      {/* ── 7. AEROSPACE HUD CALLOUT IDENTIFIER ── */}
      <Html style={{ pointerEvents: 'none' }}>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${
          isHighlighted 
            ? 'border-cyan-400 bg-space-950/90 shadow-[0_0_12px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400' 
            : 'border-emerald-500/40 bg-space-950/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
        } backdrop-blur-md whitespace-nowrap select-none`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isHighlighted ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
          <span className={`font-mono text-[10px] font-bold ${isHighlighted ? 'text-cyan-300' : 'text-emerald-300'} tracking-wider`}>
            {satellite.name}
          </span>
        </div>
      </Html>
    </group>
  );
};

export default SatelliteModel;
