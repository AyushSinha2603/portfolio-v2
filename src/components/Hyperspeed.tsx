'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
} from 'postprocessing';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HyperspeedOptions {
  onSpeedUp?: () => void;
  onSlowDown?: () => void;
  length?: number;
  roadWidth?: number;
  islandWidth?: number;
  lanesPerRoad?: number;
  fov?: number;
  fovSpeedUp?: number;
  speedUp?: number;
  totalSideLightSticks?: number;
  lightPairsPerRoadWay?: number;
  movingAwaySpeed?: [number, number];
  movingCloserSpeed?: [number, number];
  carLightsLength?: [number, number];
  carLightsRadius?: [number, number];
  colors?: {
    roadColor?: number;
    islandColor?: number;
    background?: number;
    leftCars?: number[];
    rightCars?: number[];
    sticks?: number;
  };
}

// ─── F1 Red Bull Preset ───────────────────────────────────────────────────────

export const f1RedBullPreset: HyperspeedOptions = {
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 130,
  speedUp: 2,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 50,
  movingAwaySpeed: [70, 100],
  movingCloserSpeed: [130, 180],
  carLightsLength: [15, 100],
  carLightsRadius: [0.06, 0.16],
  colors: {
    roadColor: 0x0a0a0a,
    islandColor: 0x080808,
    background: 0x000000,
    leftCars: [0xdc0000, 0xff2200, 0xbb0000],   // Red — oncoming
    rightCars: [0x1b1464, 0x3366ff, 0x0044cc],  // Blue — away
    sticks: 0xdc0000,
  },
};

// ─── Random helper ────────────────────────────────────────────────────────────

const rnd = ([min, max]: [number, number]) => min + Math.random() * (max - min);

// ─── Main App class ───────────────────────────────────────────────────────────

interface CarInstance {
  mesh: THREE.Mesh;
  speed: number;   // units/sec
  z: number;       // current z
  xPos: number;
  side: 'left' | 'right';
}

class HyperspeedApp {
  private opts: Required<HyperspeedOptions>;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private cars: CarInstance[] = [];
  private stickMeshes: THREE.Mesh[] = [];

  private rafId = 0;
  private lastTime = 0;   // ms, from performance.now()
  private timeElapsed = 0; // seconds
  private disposed = false;

  // Interactive speedup
  private speedMultiplier = 1;

  constructor(container: HTMLElement, opts: HyperspeedOptions) {
    const c = opts.colors ?? {};
    this.opts = {
      onSpeedUp: opts.onSpeedUp ?? (() => {}),
      onSlowDown: opts.onSlowDown ?? (() => {}),
      length: opts.length ?? 400,
      roadWidth: opts.roadWidth ?? 9,
      islandWidth: opts.islandWidth ?? 2,
      lanesPerRoad: opts.lanesPerRoad ?? 3,
      fov: opts.fov ?? 90,
      fovSpeedUp: opts.fovSpeedUp ?? 130,
      speedUp: opts.speedUp ?? 2,
      totalSideLightSticks: opts.totalSideLightSticks ?? 20,
      lightPairsPerRoadWay: opts.lightPairsPerRoadWay ?? 50,
      movingAwaySpeed: opts.movingAwaySpeed ?? [70, 100],
      movingCloserSpeed: opts.movingCloserSpeed ?? [130, 180],
      carLightsLength: opts.carLightsLength ?? [15, 100],
      carLightsRadius: opts.carLightsRadius ?? [0.06, 0.16],
      colors: {
        roadColor: c.roadColor ?? 0x0a0a0a,
        islandColor: c.islandColor ?? 0x080808,
        background: c.background ?? 0x000000,
        leftCars: c.leftCars ?? [0xdc0000, 0xff2200, 0xbb0000],
        rightCars: c.rightCars ?? [0x1b1464, 0x3366ff, 0x0044cc],
        sticks: c.sticks ?? 0xdc0000,
      },
    };

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.opts.colors.background ?? 0x000000);
    this.scene.fog = new THREE.Fog(this.opts.colors.background ?? 0x000000, 50, 300);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      this.opts.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    this.camera.position.set(0, 2, 6);
    this.camera.lookAt(0, 0.5, -10);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new BloomEffect({
      intensity: 1.6,
      luminanceThreshold: 0.08,
      luminanceSmoothing: 0.25,
    });
    const smaa = new SMAAEffect({ preset: SMAAPreset.LOW });
    this.composer.addPass(new EffectPass(this.camera, bloom, smaa));

    this.buildScene();
    this.addListeners(container);
    this.lastTime = performance.now();
    this.animate();
  }

  // ── Build static scene elements ─────────────────────────────────────────────

  private buildScene() {
    const { length, roadWidth, islandWidth, colors } = this.opts;
    const L = length;
    const totalW = roadWidth * 2 + islandWidth;

    // Ground / island strip
    const groundGeo = new THREE.PlaneGeometry(totalW + 16, L);
    this.scene.add(
      Object.assign(
        new THREE.Mesh(groundGeo, new THREE.MeshBasicMaterial({ color: colors.islandColor })),
        { rotation: { x: -Math.PI / 2, y: 0, z: 0 }, position: { x: 0, y: -0.02, z: -L / 2 } }
      )
    );

    // Left road lane
    const laneGeo = new THREE.PlaneGeometry(roadWidth, L);
    const laneMat = new THREE.MeshBasicMaterial({ color: colors.roadColor });
    const leftRoad = new THREE.Mesh(laneGeo, laneMat);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.position.set(-(roadWidth / 2 + islandWidth / 2), -0.01, -L / 2);
    this.scene.add(leftRoad);

    // Right road lane
    const rightRoad = new THREE.Mesh(laneGeo.clone(), laneMat.clone());
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.position.set(roadWidth / 2 + islandWidth / 2, -0.01, -L / 2);
    this.scene.add(rightRoad);

    // Center island markings (dashed)
    for (let z = 0; z > -L; z -= 8) {
      const dashGeo = new THREE.PlaneGeometry(0.12, 3);
      const dash = new THREE.Mesh(
        dashGeo,
        new THREE.MeshBasicMaterial({ color: 0x1b1464, transparent: true, opacity: 0.5 })
      );
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0, z - 1.5);
      this.scene.add(dash);
    }

    // Roadside light sticks
    const stickColor = new THREE.Color(colors.sticks);
    const sideX = roadWidth / 2 + islandWidth / 2 + 0.7;
    for (let i = 0; i < this.opts.totalSideLightSticks; i++) {
      const z = -(i / this.opts.totalSideLightSticks) * L;
      const height = 1.2 + Math.random() * 0.6;
      const geo = new THREE.CylinderGeometry(0.04, 0.04, height, 4);
      const mat = new THREE.MeshBasicMaterial({ color: stickColor, transparent: true, opacity: 0.7 });

      const left = new THREE.Mesh(geo.clone(), mat.clone());
      left.position.set(-sideX, height / 2, z);
      this.scene.add(left);
      this.stickMeshes.push(left);

      const right = new THREE.Mesh(geo.clone(), mat.clone());
      right.position.set(sideX, height / 2, z);
      this.scene.add(right);
      this.stickMeshes.push(right);
    }

    // Initial car light trails
    this.spawnCars();
  }

  private spawnCars() {
    const { length, roadWidth, islandWidth, lanesPerRoad,
            lightPairsPerRoadWay, carLightsLength, carLightsRadius,
            movingAwaySpeed, movingCloserSpeed, colors } = this.opts;

    const laneW = roadWidth / lanesPerRoad;
    const roadX = roadWidth / 2 + islandWidth / 2;

    // Left road — oncoming (moving toward camera, z increases to 0)
    for (let i = 0; i < lightPairsPerRoadWay; i++) {
      const lane = Math.floor(Math.random() * lanesPerRoad);
      const xPos = -(roadX - lane * laneW - laneW / 2);
      const trailLen = rnd(carLightsLength);
      const radius = rnd(carLightsRadius);
      const color = (colors.leftCars as number[])[Math.floor(Math.random() * (colors.leftCars as number[]).length)];

      const geo = new THREE.CylinderGeometry(radius, radius * 0.3, trailLen, 6);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;

      const startZ = -Math.random() * length;
      mesh.position.set(xPos, 0.05, startZ);
      this.scene.add(mesh);

      this.cars.push({
        mesh,
        speed: rnd(movingCloserSpeed), // positive = moves toward +z
        z: startZ,
        xPos,
        side: 'left',
      });
    }

    // Right road — same direction (moving away, z decreases)
    for (let i = 0; i < lightPairsPerRoadWay; i++) {
      const lane = Math.floor(Math.random() * lanesPerRoad);
      const xPos = roadX - lane * laneW - laneW / 2;
      const trailLen = rnd(carLightsLength);
      const radius = rnd(carLightsRadius);
      const color = (colors.rightCars as number[])[Math.floor(Math.random() * (colors.rightCars as number[]).length)];

      const geo = new THREE.CylinderGeometry(radius, radius * 0.3, trailLen, 6);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;

      const startZ = -Math.random() * length;
      mesh.position.set(xPos, 0.05, startZ);
      this.scene.add(mesh);

      this.cars.push({
        mesh,
        speed: -rnd(movingAwaySpeed), // negative = moves toward -z
        z: startZ,
        xPos,
        side: 'right',
      });
    }
  }

  private addListeners(container: HTMLElement) {
    const speedUp = () => {
      this.speedMultiplier = this.opts.speedUp;
      this.opts.onSpeedUp?.();
    };
    const slowDown = () => {
      this.speedMultiplier = 1;
      this.opts.onSlowDown?.();
    };
    container.addEventListener('mousedown', speedUp);
    container.addEventListener('mouseup', slowDown);
    container.addEventListener('touchstart', speedUp, { passive: true });
    container.addEventListener('touchend', slowDown);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  // ── Animation loop ────────────────────────────────────────────────────────

  private animate = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.animate);

    const now = performance.now();
    // Cap delta at 100ms to avoid huge jumps after tab switch
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.timeElapsed += delta;

    const t = this.timeElapsed;
    const speed = this.speedMultiplier;

    // ── Move car light trails ──────────────────────────────────────────────
    this.cars.forEach((car) => {
      car.z += car.speed * speed * delta;

      // Wrap around
      if (car.side === 'left' && car.z > 8) {
        car.z = -this.opts.length;
      } else if (car.side === 'right' && car.z < -this.opts.length) {
        car.z = 0;
      }

      car.mesh.position.z = car.z;

      // Fade in near camera, fade at far end
      const distFromCam = Math.abs(car.z);
      const alpha = Math.min(1, Math.max(0.1, 1 - distFromCam / (this.opts.length * 0.85)));
      (car.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * (car.side === 'left' ? 0.9 : 0.8);
    });

    // ── Camera gentle sway (road distortion effect) ────────────────────────
    const swayX = Math.sin(t * 0.3) * 0.15;
    const swayY = Math.cos(t * 0.2) * 0.08 + 2;
    this.camera.position.set(swayX, swayY, 6);
    this.camera.lookAt(swayX * 0.3, 0.5, -20);

    // ── Smooth FOV for speedup ─────────────────────────────────────────────
    const targetFov = speed > 1 ? this.opts.fovSpeedUp : this.opts.fov;
    this.camera.fov += (targetFov - this.camera.fov) * 0.05;
    this.camera.updateProjectionMatrix();

    this.composer.render(delta);
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
    this.composer.dispose();
  }
}

// ─── React Component ──────────────────────────────────────────────────────────

interface HyperspeedProps {
  effectOptions?: HyperspeedOptions;
}

export default function Hyperspeed({ effectOptions = f1RedBullPreset }: HyperspeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HyperspeedApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing
    appRef.current?.dispose();
    const container = containerRef.current;
    while (container.firstChild) container.removeChild(container.firstChild);

    appRef.current = new HyperspeedApp(container, effectOptions);

    return () => {
      appRef.current?.dispose();
      appRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
}
