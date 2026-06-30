'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface RaceTrackProps {
  scrollProgress: number;
}

function TrackSurface() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -60]}>
      <planeGeometry args={[8, 140]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function CenterLine() {
  const dashes = useMemo(() => {
    const items = [];
    for (let i = 0; i > -130; i -= 3) {
      items.push(
        <mesh key={`dash-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, i]}>
          <planeGeometry args={[0.1, 1.5]} />
          <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
      );
    }
    return items;
  }, []);

  return <>{dashes}</>;
}

function Curbs({ side }: { side: 'left' | 'right' }) {
  const xPos = side === 'left' ? -4.2 : 4.2;

  const segments = useMemo(() => {
    const items = [];
    for (let i = 0; i > -130; i -= 1.5) {
      const isRed = Math.abs(i / 1.5) % 2 === 0;
      items.push(
        <mesh
          key={`curb-${side}-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[xPos, 0.002, i]}
        >
          <planeGeometry args={[0.6, 1.5]} />
          <meshStandardMaterial
            color={isRed ? '#DC0000' : '#ffffff'}
            roughness={0.8}
          />
        </mesh>
      );
    }
    return items;
  }, [side, xPos]);

  return <>{segments}</>;
}

function StartingGrid() {
  const gridLines = useMemo(() => {
    const items = [];
    // Grid boxes (starting positions)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = col === 0 ? -1.5 : 1.5;
        const z = -row * 3;
        items.push(
          <mesh
            key={`grid-${row}-${col}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.003, z]}
          >
            <planeGeometry args={[2, 2.5]} />
            <meshStandardMaterial
              color="#ffffff"
              opacity={0.08}
              transparent
            />
          </mesh>
        );
        // Grid border lines
        items.push(
          <mesh
            key={`grid-line-${row}-${col}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.004, z - 1.25]}
          >
            <planeGeometry args={[2, 0.05]} />
            <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
          </mesh>
        );
      }
    }
    return items;
  }, []);

  return <>{gridLines}</>;
}

function PitMarkers() {
  const markers = useMemo(() => {
    const positions = [-20, -40, -65, -85]; // Section trigger points
    return positions.map((z, i) => (
      <group key={`pit-${i}`}>
        {/* Pit entry line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, z]}>
          <planeGeometry args={[8, 0.08]} />
          <meshStandardMaterial color="#DC0000" opacity={0.4} transparent />
        </mesh>
        {/* Pit marker block */}
        <mesh position={[4.8, 0.15, z]}>
          <boxGeometry args={[0.3, 0.3, 1]} />
          <meshStandardMaterial
            color="#DC0000"
            opacity={0.6}
            transparent
            emissive="#DC0000"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    ));
  }, []);

  return <>{markers}</>;
}

function GroundGrid() {
  const gridLines = useMemo(() => {
    const items = [];
    // Horizontal grid lines
    for (let z = 10; z > -140; z -= 10) {
      items.push(
        <mesh
          key={`hgrid-${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.02, z]}
        >
          <planeGeometry args={[40, 0.02]} />
          <meshStandardMaterial color="#ffffff" opacity={0.03} transparent />
        </mesh>
      );
    }
    // Vertical grid lines
    for (let x = -20; x <= 20; x += 5) {
      items.push(
        <mesh
          key={`vgrid-${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, -0.02, -60]}
        >
          <planeGeometry args={[0.02, 140]} />
          <meshStandardMaterial color="#ffffff" opacity={0.03} transparent />
        </mesh>
      );
    }
    return items;
  }, []);

  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, -60]}>
        <planeGeometry args={[60, 160]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1} />
      </mesh>
      {gridLines}
    </>
  );
}

function AtmosphereParticles({ scrollProgress }: { scrollProgress: number }) {
  const particles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 5 + 0.5;
      positions[i * 3 + 2] = Math.random() * -130;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  return (
    <points geometry={particles}>
      <pointsMaterial
        color="#ffffff"
        size={0.03}
        transparent
        opacity={0.15}
        sizeAttenuation
      />
    </points>
  );
}

export default function RaceTrack({ scrollProgress }: RaceTrackProps) {
  return (
    <group>
      <GroundGrid />
      <TrackSurface />
      <CenterLine />
      <Curbs side="left" />
      <Curbs side="right" />
      <StartingGrid />
      <PitMarkers />
      <AtmosphereParticles scrollProgress={scrollProgress} />
    </group>
  );
}
