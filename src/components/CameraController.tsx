import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import type { AppState } from '../types';

interface CameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

export const CameraController: React.FC<CameraControllerProps> = ({ controlsRef }) => {
  const { camera } = useThree();
  const cameraTarget = useStore((state: AppState) => state.cameraTarget);
  const setCameraTarget = useStore((state: AppState) => state.setCameraTarget);
  const satellites = useStore((state: AppState) => state.satellites);
  const conjunctions = useStore((state: AppState) => state.conjunctions);

  const prevTargetRef = useRef<string | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const transitionProgressRef = useRef<number>(1);

  const startCamPos = useRef(new THREE.Vector3());
  const startTargetPos = useRef(new THREE.Vector3());
  const destCamPos = useRef(new THREE.Vector3());
  const destTargetPos = useRef(new THREE.Vector3());

  // Seamless User Drag Detection: When user manually interacts with OrbitControls,
  // cancel automatic transitions and allow completely free camera rotation
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      isTransitioningRef.current = false;
      const currentTarget = useStore.getState().cameraTarget;
      if (currentTarget === 'aegis1' || currentTarget === 'conjunction' || currentTarget === 'india') {
        setCameraTarget(null);
      }
    };

    controls.addEventListener('start', onStart);
    return () => {
      controls.removeEventListener('start', onStart);
    };
  }, [controlsRef, setCameraTarget]);

  // Trigger smooth transition whenever cameraTarget changes
  useEffect(() => {
    if (cameraTarget && cameraTarget !== prevTargetRef.current) {
      prevTargetRef.current = cameraTarget;
      isTransitioningRef.current = true;
      transitionProgressRef.current = 0;

      startCamPos.current.copy(camera.position);
      if (controlsRef.current) {
        startTargetPos.current.copy(controlsRef.current.target);
      } else {
        startTargetPos.current.set(0, 0, 0);
      }

      const aegis1 = satellites.find((s) => s.id === 'aegis-1');
      const activeConj = conjunctions.find((c) => c.active);

      if (cameraTarget === 'aegis1' && aegis1) {
        const satPos = new THREE.Vector3(
          aegis1.position.x / 1000,
          aegis1.position.y / 1000,
          aegis1.position.z / 1000
        );
        destTargetPos.current.copy(satPos);

        // Position camera at a comfortable 3.2-unit distance offset from satellite
        const radialOut = satPos.clone().normalize();
        const sideOffset = new THREE.Vector3(-radialOut.y, radialOut.x, 0.4).normalize().multiplyScalar(1.8);
        destCamPos.current.copy(satPos).add(radialOut.multiplyScalar(2.2)).add(sideOffset);
      } else if (cameraTarget === 'conjunction' && aegis1 && activeConj) {
        const satPos = new THREE.Vector3(
          aegis1.position.x / 1000,
          aegis1.position.y / 1000,
          aegis1.position.z / 1000
        );
        destTargetPos.current.copy(satPos);

        // Wider perspective framing the conflict geometry
        const radialOut = satPos.clone().normalize();
        destCamPos.current.copy(satPos).add(radialOut.multiplyScalar(3.8)).add(new THREE.Vector3(1.0, 1.2, 1.0));
      } else if (cameraTarget === 'india') {
        // Direct Nadir Focus over Indian Subcontinent & ISTRAC
        const latRad = 14.0 * (Math.PI / 180);
        const lonRad = 79.0 * (Math.PI / 180);
        const r = 6.371;
        const targetX = r * Math.cos(latRad) * Math.cos(lonRad);
        const targetY = r * Math.sin(latRad);
        const targetZ = r * Math.cos(latRad) * Math.sin(lonRad);
        destTargetPos.current.set(targetX * 0.4, targetY * 0.4, targetZ * 0.4);
        const normal = new THREE.Vector3(targetX, targetY, targetZ).normalize();
        destCamPos.current.copy(normal).multiplyScalar(14.0);
      } else {
        // Constellation Overview
        destTargetPos.current.set(0, 0, 0);
        destCamPos.current.set(0, 8, 22);
      }
    } else if (!cameraTarget) {
      prevTargetRef.current = null;
    }
  }, [cameraTarget, satellites, conjunctions, camera, controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isTransitioningRef.current) {
      // Smooth cubic ease-out transition
      transitionProgressRef.current += delta * 2.2;
      const t = Math.min(1, transitionProgressRef.current);
      const ease = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startCamPos.current, destCamPos.current, ease);
      controls.target.lerpVectors(startTargetPos.current, destTargetPos.current, ease);
      controls.update();

      if (t >= 1) {
        isTransitioningRef.current = false;
      }
    } else if (cameraTarget === 'aegis1') {
      // While locked to Aegis-1 tracking in orbit, gently sync controls target with orbital movement
      const aegis1 = satellites.find((s) => s.id === 'aegis-1');
      if (aegis1) {
        const satPos = new THREE.Vector3(
          aegis1.position.x / 1000,
          aegis1.position.y / 1000,
          aegis1.position.z / 1000
        );
        const shift = satPos.clone().sub(controls.target);
        controls.target.copy(satPos);
        camera.position.add(shift);
        controls.update();
      }
    } else if (cameraTarget === 'conjunction') {
      const aegis1 = satellites.find((s) => s.id === 'aegis-1');
      if (aegis1) {
        const satPos = new THREE.Vector3(
          aegis1.position.x / 1000,
          aegis1.position.y / 1000,
          aegis1.position.z / 1000
        );
        const shift = satPos.clone().sub(controls.target);
        controls.target.copy(satPos);
        camera.position.add(shift);
        controls.update();
      }
    }
  });

  return null;
};
