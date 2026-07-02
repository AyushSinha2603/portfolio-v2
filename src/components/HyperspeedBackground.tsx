'use client';

import dynamic from 'next/dynamic';
import { f1RedBullPreset } from './Hyperspeed';

// Dynamically import to avoid SSR - Three.js needs window
const Hyperspeed = dynamic(() => import('./Hyperspeed'), { ssr: false });

export default function HyperspeedBackground({ scrollSpeed = 0 }: { scrollSpeed?: number }) {
  return (
    <div className="canvas-container">
      <Hyperspeed effectOptions={f1RedBullPreset} scrollSpeed={scrollSpeed} />
    </div>
  );
}
