import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export const Earth: React.FC = () => {
  const earthRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0001;
    }
  });

  const earthShader = useMemo(() => {
    return {
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 nPos = normalize(vPosition);
          float lat = asin(nPos.y);
          float lon = atan(nPos.z, nPos.x);

          float continent = smoothstep(0.0, 0.1, sin(lon * 3.0) * sin(lat * 2.5) * 0.5 + 0.3);
          
          vec3 ocean = vec3(0.04, 0.12, 0.25);
          vec3 land = vec3(0.08, 0.22, 0.15);
          vec3 baseColor = mix(ocean, land, continent);
          
          float polarCap = smoothstep(1.2, 1.5, abs(lat));
          baseColor = mix(baseColor, vec3(1.0), polarCap);
          
          float gridLat = smoothstep(0.02, 0.0, abs(fract(lat * 5.73) - 0.5) - 0.48);
          float gridLon = smoothstep(0.02, 0.0, abs(fract(lon * 5.73) - 0.5) - 0.48);
          vec3 gridColor = vec3(0.0, 1.0, 1.0);
          baseColor = mix(baseColor, gridColor, max(gridLat, gridLon) * 0.3);

          float lighting = dot(vNormal, normalize(vec3(1.0, 0.5, 0.8)));
          lighting = max(0.2, lighting); // ambient

          gl_FragColor = vec4(baseColor * lighting, 1.0);
        }
      `
    };
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
          gl_FragColor = vec4(0.15, 0.4, 1.0, 1.0) * intensity;
        }
      `
    };
  }, []);

  const stations = [
    { name: 'ISTRAC Bengaluru', lat: 12.97, lon: 77.57 },
    { name: 'Sriharikota', lat: 13.72, lon: 80.23 },
    { name: 'Port Blair', lat: 11.67, lon: 92.73 },
  ].map(station => {
    const latRad = station.lat * Math.PI / 180;
    const lonRad = station.lon * Math.PI / 180;
    const r = 6.38;
    const x = r * Math.cos(latRad) * Math.cos(lonRad);
    const y = r * Math.sin(latRad);
    const z = r * Math.cos(latRad) * Math.sin(lonRad);
    return { ...station, position: [x, y, z] as [number, number, number] };
  });

  return (
    <group ref={earthRef}>
      <mesh>
        <sphereGeometry args={[6.371, 64, 64]} />
        <shaderMaterial 
          vertexShader={earthShader.vertexShader}
          fragmentShader={earthShader.fragmentShader}
          side={THREE.FrontSide}
          transparent={false}
        />
      </mesh>
      
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
      
      {stations.map((station, i) => (
        <mesh key={i} position={station.position}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#00ffff" />
          <Html style={{ color: 'white', fontSize: '8px', pointerEvents: 'none', whiteSpace: 'nowrap' }} distanceFactor={undefined}>
            {station.name}
          </Html>
        </mesh>
      ))}
    </group>
  );
};

export default Earth;
