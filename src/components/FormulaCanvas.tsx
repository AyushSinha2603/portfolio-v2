'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import F1Car from './F1Car';
import RaceTrack from './RaceTrack';

interface FormulaCanvasProps {
  scrollProgress: number;
}

function CameraController({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 4, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    // Camera follows car Z position with offset
    const carZ = scrollProgress * -100;

    targetPosition.current.set(
      Math.sin(scrollProgress * 0.5) * 2, // Subtle lateral sway
      3 + Math.sin(scrollProgress * Math.PI) * 1.5, // Height variation
      carZ + 10 // Behind the car
    );

    targetLookAt.current.set(0, 0.5, carZ - 5);

    // Smooth camera follow
    camera.position.lerp(targetPosition.current, 0.05);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    camera.lookAt(
      THREE.MathUtils.lerp(camera.position.x, targetLookAt.current.x, 0.05),
      THREE.MathUtils.lerp(
        camera.position.y - 2,
        targetLookAt.current.y,
        0.05
      ),
      THREE.MathUtils.lerp(camera.position.z - 10, targetLookAt.current.z, 0.05)
    );
  });

  return null;
}

export default function FormulaCanvas({ scrollProgress }: FormulaCanvasProps) {
  return (
    <div
      className="canvas-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 4, 8], fov: 60, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#0a0a0a' }}
      >
        {/* Dark fog matching background */}
        <fog attach="fog" args={['#0a0a0a', 15, 80]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={0.8}
          castShadow={false}
          color="#e0e0ff"
        />
        <directionalLight
          position={[-5, 10, -10]}
          intensity={0.3}
          color="#ff6666"
        />
        <pointLight
          position={[0, 3, 0]}
          intensity={0.5}
          color="#1B1464"
          distance={20}
        />

        {/* Environment for reflections */}
        <Environment preset="night" />

        {/* Camera controller */}
        <CameraController scrollProgress={scrollProgress} />

        {/* Race Track */}
        <RaceTrack scrollProgress={scrollProgress} />

        {/* F1 Car */}
        <Suspense fallback={null}>
          <F1Car scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
