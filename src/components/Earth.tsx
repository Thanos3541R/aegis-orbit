import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Earth: React.FC = () => {
  const earthRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0001;
    }
  });

  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Base ocean
    ctx.fillStyle = '#1a3a5c';
    ctx.fillRect(0, 0, 512, 256);
    
    // Procedural continents
    ctx.fillStyle = '#2c5e3d';
    ctx.beginPath();
    ctx.ellipse(150, 80, 40, 20, 0.2, 0, Math.PI * 2);
    ctx.ellipse(350, 100, 50, 30, -0.2, 0, Math.PI * 2);
    ctx.ellipse(250, 180, 40, 30, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Polar caps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 15);
    ctx.fillRect(0, 241, 512, 15);
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  const atmosphereShader = useMemo(() => {
    return {
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vPositionNormal), 4.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `
    };
  }, []);

  return (
    <group ref={earthRef}>
      {/* Solid Sphere */}
      <mesh>
        <sphereGeometry args={[6.371, 64, 64]} />
        <meshStandardMaterial map={earthTexture} roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Wireframe Overlay */}
      <mesh>
        <sphereGeometry args={[6.38, 32, 32]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.08} />
      </mesh>
      
      {/* Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[6.5, 64, 64]} />
        <shaderMaterial 
          vertexShader={atmosphereShader.vertexShader}
          fragmentShader={atmosphereShader.fragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
      
      {/* Coordinate grid */}
      <mesh>
        <sphereGeometry args={[6.375, 12, 12]} />
        <meshBasicMaterial color="#1F2937" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default Earth;
