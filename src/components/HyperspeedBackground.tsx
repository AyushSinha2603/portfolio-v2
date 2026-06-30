'use client';

import dynamic from 'next/dynamic';
import { f1RedBullPreset } from './Hyperspeed';

// Dynamically import to avoid SSR - Three.js needs window
const Hyperspeed = dynamic(() => import('./Hyperspeed'), { ssr: false });

export default function HyperspeedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Hyperspeed effectOptions={f1RedBullPreset} />
    </div>
  );
}
