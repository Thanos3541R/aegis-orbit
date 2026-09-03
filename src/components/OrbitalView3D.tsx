import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { Earth } from './Earth';
import { OrbitPath } from './OrbitPath';
import { DebrisModel } from './DebrisModel';
import { CovarianceEllipsoid } from './CovarianceEllipsoid';
import { CameraControls } from './CameraControls';
import { CameraController } from './CameraController';
import { TargetTelemetryOverlay } from './TargetTelemetryOverlay';
import type { AppState } from '../types';

const RICTriad: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const lineR = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.5, 0, 0)
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    return new THREE.Line(geom, mat);
  }, []);

  const lineI = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.5, 0)
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x00ffff });
    return new THREE.Line(geom, mat);
  }, []);

  const lineC = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 1.5)
    ]);
    const mat = new THREE.LineBasicMaterial({ color: 0xff00ff });
    return new THREE.Line(geom, mat);
  }, []);

  return (
    <group position={position}>
      <primitive object={lineR} />
      <primitive object={lineI} />
      <primitive object={lineC} />
      <Html position={[1.5, 0, 0]} style={{ color: 'yellow', fontSize: '10px' }} distanceFactor={undefined}>R</Html>
      <Html position={[0, 1.5, 0]} style={{ color: 'cyan', fontSize: '10px' }} distanceFactor={undefined}>I</Html>
      <Html position={[0, 0, 1.5]} style={{ color: 'magenta', fontSize: '10px' }} distanceFactor={undefined}>C</Html>
    </group>
  );
};

export const OrbitalView3D: React.FC = () => {
  const satellites = useStore((state: AppState) => state.satellites);
  const debris = useStore((state: AppState) => state.debris);
  const activeScenario = useStore((state: AppState) => state.activeScenario);
  const conjunctions = useStore((state: AppState) => state.conjunctions);
  const cameraTarget = useStore((state: AppState) => state.cameraTarget);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const activeConjunction = conjunctions.find((c) => c.active);

  const primarySat = activeConjunction ? satellites.find(s => s.id === activeConjunction.primaryId) : null;
  const showTriad = Boolean(activeConjunction && (activeScenario === 'A' || activeScenario === 'C') && primarySat);

  return (
    <div className="relative w-full h-full select-none">
      {/* 2D Fixed HUD Telemetry Overlay (Always Visible & Never Hidden) */}
      <TargetTelemetryOverlay />

      <Canvas
        camera={{ position: [0, 8, 22], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#090D16' }}
      >
        {/* Space Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[60, 25, 60]} intensity={2.0} color="#fffcf0" />
        <directionalLight position={[-40, -20, -40]} intensity={0.35} color="#3b82f6" />
        <hemisphereLight intensity={0.25} color="#93c5fd" groundColor="#0f172a" />

        {/* Deep Space Starfield */}
        <Stars radius={300} depth={80} count={3500} factor={4} fade speed={0.5} />

        {/* 3D Earth */}
        <Earth />

        {/* Smooth OrbitControls Synchronized Camera Controller */}
        <CameraController controlsRef={controlsRef} />

        {/* Constellation Satellites with High-Fidelity 3D Models */}
        {satellites.map((sat) => (
          <OrbitPath
            key={sat.id}
            satellite={sat}
            isTargeted={cameraTarget === 'aegis1' && sat.id === 'aegis-1'}
            activeScenario={activeScenario}
            isConjunctionTarget={Boolean(
              activeConjunction &&
                (activeConjunction.primaryId === sat.id || activeConjunction.secondaryId === sat.id)
            )}
          />
        ))}

        {/* Trackable Space Debris Field */}
        {debris.map((d) => (
          <DebrisModel
            key={d.id}
            debris={d}
            isHighRisk={Boolean(activeConjunction && activeConjunction.secondaryId === d.id)}
            activeScenario={activeScenario}
          />
        ))}

        {/* 3D Covariance Ellipsoid */}
        {(activeScenario === 'A' || activeScenario === 'C') && activeConjunction && (
          <CovarianceEllipsoid
            conjunction={activeConjunction}
            satellites={[...satellites, ...debris]}
          />
        )}
        
        {/* RIC Triad Visualization */}
        {showTriad && primarySat && (
          <RICTriad position={[primarySat.position.x / 1000, primarySat.position.y / 1000, primarySat.position.z / 1000]} />
        )}

        {/* Orbit Controls with Ultra-Smooth Fluid Response */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={1.0}
          maxDistance={95}
          rotateSpeed={1.4}
          zoomSpeed={1.2}
          panSpeed={1.2}
          screenSpacePanning={true}
        />
      </Canvas>

      {/* Camera Preset Controls Overlay (Bottom-Left) */}
      <CameraControls />
    </div>
  );
};
