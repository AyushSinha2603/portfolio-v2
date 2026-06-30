'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface F1CarProps {
  scrollProgress: number;
}

export default function F1Car({ scrollProgress }: F1CarProps) {
  const { scene } = useGLTF('/models/f1car-transformed.glb');
  const carRef = useRef<THREE.Group>(null);
  const prevProgress = useRef(0);

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useFrame((_, delta) => {
    if (!carRef.current) return;

    // Move car along Z axis based on scroll
    const targetZ = scrollProgress * -100;
    carRef.current.position.z = THREE.MathUtils.lerp(
      carRef.current.position.z,
      targetZ,
      0.1
    );

    // Calculate scroll velocity for wheel spin
    const safeDelta = Math.max(delta, 0.001);
    const velocity =
      Math.abs(scrollProgress - prevProgress.current) / safeDelta;
    prevProgress.current = scrollProgress;

    // Subtle pitch based on velocity (nose down when driving)
    const targetPitch = Math.min(velocity * 0.02, 0.03);
    carRef.current.rotation.x = THREE.MathUtils.lerp(
      carRef.current.rotation.x,
      -targetPitch,
      0.05
    );

    // Rotate wheels if they exist in the model
    clonedScene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.name.toLowerCase().includes('wheel')
      ) {
        child.rotation.x += velocity * safeDelta * 5;
      }
    });
  });

  return (
    <group ref={carRef} scale={[0.8, 0.8, 0.8]} rotation={[0, Math.PI, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/models/f1car-transformed.glb');
