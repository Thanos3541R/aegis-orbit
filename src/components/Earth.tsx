import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export const Earth: React.FC = () => {
  const earthRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.00012;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.00018; // Clouds drift slightly faster
    }
  });

  // High-fidelity procedural Earth shader
  const earthShader = useMemo(() => {
    return {
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

        // Hash function for procedural land generation
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        // 2D Value Noise
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // Multi-octave fractal noise
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.02 + vec2(1.7, 9.2);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 nPos = normalize(vPosition);
          float lat = asin(nPos.y);
          float lon = atan(nPos.z, nPos.x);

          // Procedural continental shapes
          vec2 coord = vec2(lon * 2.5, lat * 3.5);
          float n = fbm(coord);

          // Continental threshold with recognizable landmass distribution
          float continent = smoothstep(0.46, 0.52, n);

          // India & South Asia feature boost (approx lon: 1.2 to 1.6 rad, lat: 0.15 to 0.55 rad)
          float inLon = smoothstep(1.0, 1.35, lon) * (1.0 - smoothstep(1.6, 1.85, lon));
          float inLat = smoothstep(0.08, 0.22, lat) * (1.0 - smoothstep(0.50, 0.65, lat));
          float indiaSubcontinent = inLon * inLat;
          continent = max(continent, smoothstep(0.25, 0.65, indiaSubcontinent));

          // Polar Ice Caps
          float polarCap = smoothstep(1.15, 1.45, abs(lat));
          
          // Ocean colors: shallow coastal turquoise to deep oceanic sapphire
          vec3 deepOcean = vec3(0.015, 0.05, 0.16);
          vec3 shallowOcean = vec3(0.02, 0.28, 0.42);
          vec3 oceanColor = mix(deepOcean, shallowOcean, smoothstep(0.35, 0.46, n));

          // Land colors: lush lowlands to arid mountain plateaus
          vec3 lowland = vec3(0.06, 0.18, 0.12);
          vec3 mountain = vec3(0.24, 0.19, 0.13);
          vec3 landColor = mix(lowland, mountain, fbm(coord * 2.0));

          vec3 baseSurface = mix(oceanColor, landColor, continent);
          baseSurface = mix(baseSurface, vec3(0.95, 0.98, 1.0), polarCap);

          // Orbital Sun Lighting
          vec3 sunDir = normalize(vec3(60.0, 25.0, 60.0));
          float sunDiff = max(dot(vNormal, sunDir), 0.0);
          
          // Specular Glint on Ocean (water shines, land is matte)
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 halfVec = normalize(sunDir + viewDir);
          float specIntensity = pow(max(dot(vNormal, halfVec), 0.0), 32.0);
          vec3 sunSpecular = vec3(0.4, 0.7, 1.0) * specIntensity * (1.0 - continent) * (1.0 - polarCap) * sunDiff;

          // Night-Side Golden City Lights (emerge on dark side of continents)
          float nightFactor = smoothstep(0.15, -0.25, dot(vNormal, sunDir));
          float cityNoise = noise(vec2(lon * 18.0, lat * 18.0));
          float cities = smoothstep(0.68, 0.85, cityNoise) * continent * (1.0 - polarCap) * nightFactor;
          vec3 cityLights = vec3(1.0, 0.82, 0.45) * cities * 2.2;

          // Lat/Lon Tactical Grid Lines
          float gridLat = smoothstep(0.02, 0.0, abs(fract(lat * 5.73) - 0.5) - 0.485);
          float gridLon = smoothstep(0.02, 0.0, abs(fract(lon * 5.73) - 0.5) - 0.485);
          vec3 gridColor = vec3(0.0, 0.9, 1.0);
          baseSurface = mix(baseSurface, gridColor, max(gridLat, gridLon) * 0.25);

          // Atmosphere ambient & diffuse
          vec3 finalColor = baseSurface * (sunDiff * 0.95 + 0.12) + sunSpecular + cityLights;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    };
  }, []);

  // Atmospheric cloud layer shader
  const cloudShader = useMemo(() => {
    return {
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;

        float hash(vec2 p) {
          p = fract(p * vec2(345.67, 890.12));
          p += dot(p, p + 23.45);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          vec2 p = vUv * vec2(8.0, 4.0);
          float c = noise(p) * 0.5 + noise(p * 2.2) * 0.35 + noise(p * 4.4) * 0.15;
          float alpha = smoothstep(0.48, 0.75, c) * 0.38;

          vec3 sunDir = normalize(vec3(60.0, 25.0, 60.0));
          float sunDiff = max(dot(vNormal, sunDir), 0.15);

          gl_FragColor = vec4(vec3(0.95, 0.98, 1.0) * sunDiff, alpha);
        }
      `
    };
  }, []);

  // Outer Fresnel atmospheric glow
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
          float intensity = pow(0.70 - dot(vNormal, vPositionNormal), 3.8);
          gl_FragColor = vec4(0.12, 0.45, 1.0, 1.0) * intensity * 1.5;
        }
      `
    };
  }, []);

  // ISRO Ground Station Radar Beacons
  const stations = [
    { name: 'ISTRAC Bengaluru', tag: 'ISTRAC [BLR]', lat: 12.97, lon: 77.57 },
    { name: 'Sriharikota SDSC', tag: 'SDSC [SHAR]', lat: 13.72, lon: 80.23 },
    { name: 'Port Blair', tag: 'IN-PBL [A&N]', lat: 11.67, lon: 92.73 },
  ].map(station => {
    const latRad = station.lat * Math.PI / 180;
    const lonRad = station.lon * Math.PI / 180;
    const r = 6.375;
    const x = r * Math.cos(latRad) * Math.cos(lonRad);
    const y = r * Math.sin(latRad);
    const z = r * Math.cos(latRad) * Math.sin(lonRad);
    return { ...station, position: [x, y, z] as [number, number, number] };
  });

  return (
    <group ref={earthRef}>
      {/* ── 1. MAIN EARTH SPHERE (Procedural Continents, Specular Glint & City Lights) ── */}
      <mesh>
        <sphereGeometry args={[6.371, 64, 64]} />
        <shaderMaterial 
          vertexShader={earthShader.vertexShader}
          fragmentShader={earthShader.fragmentShader}
          side={THREE.FrontSide}
          transparent={false}
        />
      </mesh>

      {/* ── 2. DYNAMIC PROCEDURAL CLOUD LAYER ── */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[6.40, 48, 48]} />
        <shaderMaterial
          vertexShader={cloudShader.vertexShader}
          fragmentShader={cloudShader.fragmentShader}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* ── 3. ATMOSPHERIC FRESNEL GLOW ── */}
      <mesh>
        <sphereGeometry args={[6.52, 64, 64]} />
        <shaderMaterial 
          vertexShader={atmosphereShader.vertexShader}
          fragmentShader={atmosphereShader.fragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
      
      {/* ── 4. ISRO GROUND STATIONS RADAR BEACONS ── */}
      {stations.map((station, i) => (
        <group key={i} position={station.position}>
          {/* Station Core Node */}
          <mesh>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>

          {/* Pulsing Radar Ring */}
          <mesh>
            <ringGeometry args={[0.06, 0.08, 16]} />
            <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.65} />
          </mesh>

          {/* Tactical Station Callout Tag */}
          <Html style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-space-950/85 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)] backdrop-blur-sm select-none -translate-y-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-[8px] font-bold text-cyan-200 tracking-wider whitespace-nowrap">
                {station.tag}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
};

export default Earth;
