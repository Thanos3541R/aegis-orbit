import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Satellite, ScenarioId } from '../types';

interface SatelliteModelProps {
  satellite: Satellite;
  isTargeted?: boolean;
  activeScenario?: ScenarioId;
  isConjunctionTarget?: boolean;
}

export const SatelliteModel: React.FC<SatelliteModelProps> = ({
  satellite,
  isTargeted = false,
  activeScenario,
  isConjunctionTarget = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Group>(null);
  const plumeRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  // Position in scene units (km / 1000)
  const pos: [number, number, number] = [
    satellite.position.x / 1000,
    satellite.position.y / 1000,
    satellite.position.z / 1000
  ];

  // Dynamic orientation: calculate nadir (Earth-pointing) and along-track velocity
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();

    // Position vector from Earth center (0,0,0)
    const p = new THREE.Vector3(satellite.position.x, satellite.position.y, satellite.position.z).normalize();
    const v = new THREE.Vector3(satellite.velocity.x, satellite.velocity.y, satellite.velocity.z).normalize();

    // Construct local frame: Z points nadir (toward Earth = -p), Y points along-track (v), X = Y x Z
    const zAxis = p.clone().negate();
    const yAxis = v.clone();
    const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
    // Re-orthogonalize
    const adjustedY = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(xAxis, adjustedY, zAxis);
    groupRef.current.quaternion.setFromRotationMatrix(rotMatrix);

    // Gently articulate antenna dish
    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }

    // Animate CAM thruster plume if active maneuver
    if (plumeRef.current && activeScenario === 'C') {
      const scale = 0.8 + Math.sin(t * 20) * 0.3;
      plumeRef.current.scale.set(scale, scale * 1.5, scale);
      plumeRef.current.visible = true;
    }
  });

  // Calculate altitude and velocity magnitude for HUD
  const altitudeKm = useMemo(() => {
    const r = Math.sqrt(satellite.position.x ** 2 + satellite.position.y ** 2 + satellite.position.z ** 2);
    return (r - 6371).toFixed(1);
  }, [satellite.position]);

  const velocityKmS = useMemo(() => {
    const v = Math.sqrt(satellite.velocity.x ** 2 + satellite.velocity.y ** 2 + satellite.velocity.z ** 2);
    return v.toFixed(2);
  }, [satellite.velocity]);

  // Procedural Solar Cell texture (canvas grid pattern)
  const solarTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark metallic navy blue backing
    ctx.fillStyle = '#0a172e';
    ctx.fillRect(0, 0, 128, 256);

    // Grid lines for individual solar cells
    ctx.strokeStyle = '#1e3a6a';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#0f2952';

    const cols = 4;
    const rows = 12;
    const pad = 2;
    const cellW = (128 - (cols + 1) * pad) / cols;
    const cellH = (256 - (rows + 1) * pad) / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = pad + c * (cellW + pad);
        const y = pad + r * (cellH + pad);
        ctx.fillRect(x, y, cellW, cellH);
        ctx.strokeRect(x, y, cellW, cellH);

        // Thin silver busbar line
        ctx.fillStyle = '#6e8bb5';
        ctx.fillRect(x + cellW / 2 - 0.5, y, 1, cellH);
        ctx.fillStyle = '#0f2952';
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  // Multi-layer insulation (MLI) gold foil texture
  const goldFoilTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#c99726';
    ctx.fillRect(0, 0, 64, 64);

    // Subtle foil crinkle pattern
    ctx.fillStyle = '#e6b943';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const w = 4 + Math.random() * 12;
      const h = 4 + Math.random() * 12;
      ctx.fillRect(x, y, w, h);
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  const isCritical = (activeScenario === 'A' && satellite.id === 'aegis-1') || isConjunctionTarget;

  return (
    <group position={pos}>
      {/* Dynamic Satellite Oriented Group */}
      <group
        ref={groupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* ── 1. MAIN SATELLITE BUS (Hexagonal/Rectangular Chassis with Gold MLI Foil) ── */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.22, 0.32]} />
          <meshStandardMaterial
            map={goldFoilTexture}
            color="#e0a92e"
            roughness={0.28}
            metalness={0.88}
            bumpScale={0.05}
          />
        </mesh>

        {/* Chassis Top/Bottom Equipment Panels */}
        <mesh position={[0, 0, 0.165]}>
          <boxGeometry args={[0.20, 0.20, 0.01]} />
          <meshStandardMaterial color="#1a202c" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, -0.165]}>
          <boxGeometry args={[0.20, 0.20, 0.01]} />
          <meshStandardMaterial color="#1a202c" roughness={0.4} metalness={0.8} />
        </mesh>

        {/* ── 2. DUAL ARTICULATED SOLAR ARRAY WINGS ── */}
        {/* Left Solar Wing */}
        <group position={[-0.11, 0, 0]}>
          {/* Solar Boom Mount */}
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Main Solar Array Panel */}
          <mesh position={[-0.42, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.54, 0.24, 0.012]} />
            <meshStandardMaterial
              map={solarTexture}
              roughness={0.15}
              metalness={0.75}
              color="#ffffff"
            />
          </mesh>
          {/* Solar Panel Gold Edge Trim */}
          <mesh position={[-0.42, 0, 0]}>
            <boxGeometry args={[0.55, 0.25, 0.008]} />
            <meshStandardMaterial color="#e5b842" metalness={0.9} roughness={0.3} wireframe />
          </mesh>
        </group>

        {/* Right Solar Wing */}
        <group position={[0.11, 0, 0]}>
          {/* Solar Boom Mount */}
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Main Solar Array Panel */}
          <mesh position={[0.42, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.54, 0.24, 0.012]} />
            <meshStandardMaterial
              map={solarTexture}
              roughness={0.15}
              metalness={0.75}
              color="#ffffff"
            />
          </mesh>
          {/* Solar Panel Gold Edge Trim */}
          <mesh position={[0.42, 0, 0]}>
            <boxGeometry args={[0.55, 0.25, 0.008]} />
            <meshStandardMaterial color="#e5b842" metalness={0.9} roughness={0.3} wireframe />
          </mesh>
        </group>

        {/* ── 3. HIGH-GAIN PARABOLIC DISH ANTENNA (Top Zenit-Mounted) ── */}
        <group ref={dishRef} position={[0, 0.14, 0.12]} rotation={[-Math.PI / 4, 0, 0]}>
          {/* Antenna Feed Arm Truss */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.008, 0.012, 0.10, 8]} />
            <meshStandardMaterial color="#4a5568" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Parabolic Dish Bowl */}
          <mesh position={[0, 0.10, 0]} rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.8]} />
            <meshStandardMaterial
              color="#edf2f7"
              roughness={0.2}
              metalness={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Central Feed Horn / Transceiver */}
          <mesh position={[0, 0.13, 0]}>
            <coneGeometry args={[0.02, 0.04, 12]} />
            <meshStandardMaterial color="#3182ce" emissive="#3182ce" emissiveIntensity={0.6} />
          </mesh>
        </group>

        {/* ── 4. NADIR EARTH SENSOR / OPTICAL PAYLOAD (Facing Earth: +Z) ── */}
        <group position={[0, 0, 0.17]}>
          <mesh position={[0, 0, 0.03]}>
            <cylinderGeometry args={[0.04, 0.05, 0.06, 16]} />
            <meshStandardMaterial color="#1a202c" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Optical Aperture Lens */}
          <mesh position={[0, 0, 0.061]}>
            <circleGeometry args={[0.035, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} roughness={0.1} />
          </mesh>
        </group>

        {/* ── 5. RCS THRUSTER NOZZLES & PROPULSION POD (Facing -Y) ── */}
        <group position={[0, -0.12, 0]}>
          {/* Main Apogee / CAM Thruster Bell */}
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.035, 0.07, 16]} />
            <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Active Thruster Plume during Scenario C CAM */}
          <mesh ref={plumeRef} position={[0, -0.12, 0]} rotation={[0, 0, 0]} visible={activeScenario === 'C'}>
            <coneGeometry args={[0.045, 0.16, 16]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
          </mesh>

          {/* 4 Corner RCS Vernier Thrusters */}
          {[-0.09, 0.09].map((rx) =>
            [-0.09, 0.09].map((rz) => (
              <mesh key={`${rx}-${rz}`} position={[rx, -0.01, rz]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.01, 0.02, 8]} />
                <meshStandardMaterial color="#4a5568" metalness={0.8} />
              </mesh>
            ))
          )}
        </group>

        {/* ── 6. STAR TRACKERS & MAGNETORQUER BOOMS ── */}
        <mesh position={[0.09, 0.08, -0.08]} rotation={[0.4, 0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.018, 0.05, 12]} />
          <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.09, 0.08, -0.08]} rotation={[-0.4, -0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.018, 0.05, 12]} />
          <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Holographic targeting ring */}
        <mesh>
          <ringGeometry args={[0.65, 0.67, 32]} />
          <meshBasicMaterial
            color={isCritical ? '#ef4444' : satellite.color}
            transparent
            opacity={isTargeted || isCritical || hovered ? 0.8 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Pulsing glow point light */}
        <pointLight
          color={isCritical ? '#ef4444' : satellite.color}
          intensity={isCritical ? 1.2 : 0.6}
          distance={1.5}
        />
      </group>

      {/* ── 7. CRISP FIXED-SIZE FLOATING HUD BADGE (Constant Screen-Space Pixel Size) ── */}
      {(isTargeted || isCritical || hovered || satellite.id === 'aegis-1') && (
        <Html
          position={[0, 0.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <div
            className={`px-2 py-1 rounded-md backdrop-blur-md border font-mono text-[10px] whitespace-nowrap shadow-xl flex items-center gap-2 ${
              isCritical
                ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-space-900/90 border-space-600 text-gray-100'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: isCritical ? '#ef4444' : satellite.color }}
            />
            <span className="font-bold text-white text-[11px]">{satellite.name}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300 font-semibold">{altitudeKm} km</span>
            <span className="text-gray-400">|</span>
            <span className="text-cyan-300 font-semibold">{velocityKmS} km/s</span>
            {isCritical && (
              <span className="bg-red-500 text-black text-[9px] font-bold px-1 rounded animate-pulse">
                CONJUNCTION
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
