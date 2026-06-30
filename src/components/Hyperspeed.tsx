'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from 'postprocessing';

// ─── Type definitions ────────────────────────────────────────────────────────

interface DistortionUniforms {
  [key: string]: { value: THREE.Vector2 | THREE.Vector3 | THREE.Vector4 | number };
}

interface Distortion {
  uniforms: DistortionUniforms;
  getDistortion: string;
  getJS: (progress: number, time: number) => THREE.Vector3;
}

export interface HyperspeedOptions {
  onSpeedUp?: () => void;
  onSlowDown?: () => void;
  distortion?: string;
  length?: number;
  roadWidth?: number;
  islandWidth?: number;
  lanesPerRoad?: number;
  fov?: number;
  fovSpeedUp?: number;
  speedUp?: number;
  carLightsFade?: number;
  totalSideLightSticks?: number;
  lightPairsPerRoadWay?: number;
  shoulderLinesWidthPercentage?: number;
  brokenLinesWidthPercentage?: number;
  brokenLinesLengthPercentage?: number;
  lightStickWidth?: [number, number];
  lightStickHeight?: [number, number];
  movingAwaySpeed?: [number, number];
  movingCloserSpeed?: [number, number];
  carLightsLength?: [number, number];
  carLightsRadius?: [number, number];
  carWidthPercentage?: [number, number];
  carShiftX?: [number, number];
  carFloorSeparation?: [number, number];
  colors?: {
    roadColor?: number;
    islandColor?: number;
    background?: number;
    shoulderLines?: number;
    brokenLines?: number;
    leftCars?: number[];
    rightCars?: number[];
    sticks?: number;
  };
}

// ─── F1 Red Bull Preset ───────────────────────────────────────────────────────

export const f1RedBullPreset: HyperspeedOptions = {
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 140,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.03, 400 * 0.2],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x0a0a0a,
    islandColor: 0x080808,
    background: 0x000000,
    shoulderLines: 0x1B1464,   // Red Bull blue
    brokenLines: 0x222222,
    leftCars:  [0xDC0000, 0xff2200, 0xaa0000],  // Red Bull red — oncoming (tail lights)
    rightCars: [0x3366ff, 0x1B1464, 0x0044cc],  // Red Bull blue — same-direction (headlights)
    sticks: 0xDC0000,
  },
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

const random = (base: number | [number, number], spread?: number): number => {
  if (Array.isArray(base)) return base[0] + Math.random() * (base[1] - base[0]);
  return base - (spread ?? 0) / 2 + Math.random() * (spread ?? 0);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─── Distortion definitions ───────────────────────────────────────────────────

function buildDistortions() {
  const nsin = (val: number) => Math.sin(val) * 0.5 + 0.5;

  const turbulentUniforms: DistortionUniforms = {
    uFreq: { value: new THREE.Vector4(4, 8, 8, 1) },
    uAmp: { value: new THREE.Vector4(25, 5, 10, 10) },
  };

  const distortions: Record<string, Distortion> = {
    turbulentDistortion: {
      uniforms: turbulentUniforms,
      getDistortion: `
        uniform vec4 uFreq;
        uniform vec4 uAmp;
        float nsin(float val){ return sin(val) * 0.5 + 0.5; }
        #define PI 3.14159265358979
        float getDistortionX(float progress){
          return (
            cos(PI * progress * uFreq.r + uTime) * uAmp.r +
            pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)), 2.) * uAmp.g
          );
        }
        float getDistortionY(float progress){
          return (
            -nsin(PI * progress * uFreq.b + uTime) * uAmp.b +
            -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a)), 2.) * uAmp.a
          );
        }
        vec3 getDistortion(float progress){
          return vec3(getDistortionX(progress), getDistortionY(progress), 0.);
        }
      `,
      getJS: (progress: number, time: number) => {
        const uFreq = (turbulentUniforms.uFreq.value as THREE.Vector4);
        const uAmp = (turbulentUniforms.uAmp.value as THREE.Vector4);
        const dx =
          Math.cos(Math.PI * progress * uFreq.x + time) * uAmp.x +
          Math.pow(Math.cos(Math.PI * progress * uFreq.y + time * (uFreq.y / uFreq.x)), 2) * uAmp.y;
        const dy =
          -nsin(Math.PI * progress * uFreq.z + time) * uAmp.z +
          -Math.pow(nsin(Math.PI * progress * uFreq.w + time / (uFreq.z / uFreq.w)), 2) * uAmp.w;
        return new THREE.Vector3(dx, dy, 0).multiply(new THREE.Vector3(2, 0.4, 0)).add(new THREE.Vector3(0, 0, -3));
      },
    },
  };

  return distortions;
}

// ─── App class (Three.js scene) ───────────────────────────────────────────────

class HyperspeedApp {
  private options: Required<HyperspeedOptions>;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private clock: THREE.Timer;
  private distortions: Record<string, Distortion>;
  private distortion: Distortion;
  private speedUpTarget = 0;
  private speedUp = 0;
  private timeOffset = 0;
  private animId = 0;
  private road!: THREE.Mesh;
  private island!: THREE.Mesh;
  private leftCarLights!: THREE.Mesh;
  private rightCarLights!: THREE.Mesh;
  private leftSticks!: THREE.InstancedMesh;
  private rightSticks!: THREE.InstancedMesh;
  private carInstances: Array<{
    mesh: THREE.Mesh;
    speed: number;
    progress: number;
    offset: number;
    laneIndex: number;
    side: 'left' | 'right';
  }> = [];
  private disposed = false;

  constructor(container: HTMLElement, options: HyperspeedOptions) {
    const colors = options.colors ?? {};
    this.options = {
      onSpeedUp: options.onSpeedUp ?? (() => {}),
      onSlowDown: options.onSlowDown ?? (() => {}),
      distortion: options.distortion ?? 'turbulentDistortion',
      length: options.length ?? 400,
      roadWidth: options.roadWidth ?? 9,
      islandWidth: options.islandWidth ?? 2,
      lanesPerRoad: options.lanesPerRoad ?? 3,
      fov: options.fov ?? 90,
      fovSpeedUp: options.fovSpeedUp ?? 140,
      speedUp: options.speedUp ?? 2,
      carLightsFade: options.carLightsFade ?? 0.4,
      totalSideLightSticks: options.totalSideLightSticks ?? 20,
      lightPairsPerRoadWay: options.lightPairsPerRoadWay ?? 40,
      shoulderLinesWidthPercentage: options.shoulderLinesWidthPercentage ?? 0.05,
      brokenLinesWidthPercentage: options.brokenLinesWidthPercentage ?? 0.1,
      brokenLinesLengthPercentage: options.brokenLinesLengthPercentage ?? 0.5,
      lightStickWidth: options.lightStickWidth ?? [0.12, 0.5],
      lightStickHeight: options.lightStickHeight ?? [1.3, 1.7],
      movingAwaySpeed: options.movingAwaySpeed ?? [60, 80],
      movingCloserSpeed: options.movingCloserSpeed ?? [-120, -160],
      carLightsLength: options.carLightsLength ?? [12, 80],
      carLightsRadius: options.carLightsRadius ?? [0.05, 0.14],
      carWidthPercentage: options.carWidthPercentage ?? [0.3, 0.5],
      carShiftX: options.carShiftX ?? [-0.8, 0.8],
      carFloorSeparation: options.carFloorSeparation ?? [0, 5],
      colors: {
        roadColor: colors.roadColor ?? 0x080808,
        islandColor: colors.islandColor ?? 0x0a0a0a,
        background: colors.background ?? 0x000000,
        shoulderLines: colors.shoulderLines ?? 0xffffff,
        brokenLines: colors.brokenLines ?? 0xffffff,
        leftCars: colors.leftCars ?? [0xd856bf, 0x6750a2, 0xc247ac],
        rightCars: colors.rightCars ?? [0x03b3c3, 0x0e5ea5, 0x324555],
        sticks: colors.sticks ?? 0x03b3c3,
      },
    };

    this.clock = new THREE.Timer();
    this.distortions = buildDistortions();
    this.distortion = this.distortions[this.options.distortion] ?? this.distortions.turbulentDistortion;

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.colors.background);

    this.camera = new THREE.PerspectiveCamera(this.options.fov, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 1.5, 5);
    this.camera.lookAt(0, 0, -1);

    this.buildScene();
    this.buildPostProcessing();
    this.addEventListeners(container);
    this.animate();
  }

  private buildScene() {
    const opts = this.options;
    const L = opts.length;
    const rw = opts.roadWidth;
    const iw = opts.islandWidth;
    const totalWidth = rw * 2 + iw;

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(totalWidth + 20, L);
    const groundMat = new THREE.MeshBasicMaterial({ color: opts.colors.islandColor });
    this.island = new THREE.Mesh(groundGeo, groundMat);
    this.island.rotation.x = -Math.PI / 2;
    this.island.position.z = -L / 2;
    this.scene.add(this.island);

    // Road (left)
    const roadGeo = new THREE.PlaneGeometry(rw, L);
    const roadMat = new THREE.MeshBasicMaterial({ color: opts.colors.roadColor });
    const leftRoad = new THREE.Mesh(roadGeo, roadMat);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.position.set(-(rw / 2 + iw / 2), 0, -L / 2);
    this.road = leftRoad;
    this.scene.add(leftRoad);

    // Road (right)
    const rightRoad = new THREE.Mesh(roadGeo.clone(), roadMat.clone());
    rightRoad.rotation.x = -Math.PI / 2;
    rightRoad.position.set(rw / 2 + iw / 2, 0, -L / 2);
    this.scene.add(rightRoad);

    // Car lights - simple tubes representing streaming light trails
    this.buildCarLights();

    // Side sticks (glowing poles on the roadside)
    this.buildSideSticks();
  }

  private buildCarLights() {
    const opts = this.options;
    const colors = opts.colors;
    const roadX = opts.roadWidth / 2 + opts.islandWidth / 2;

    // Left side (oncoming — red headlights)
    for (let i = 0; i < opts.lightPairsPerRoadWay; i++) {
      const progress = i / opts.lightPairsPerRoadWay;
      const z = -progress * opts.length;
      const lane = Math.floor(Math.random() * opts.lanesPerRoad);
      const laneWidth = opts.roadWidth / opts.lanesPerRoad;
      const x = -roadX + lane * laneWidth + laneWidth / 2;
      const len = random(opts.carLightsLength);
      const radius = random(opts.carLightsRadius);
      const geo = new THREE.CylinderGeometry(radius, radius, len, 6);
      const color = colors.leftCars![Math.floor(Math.random() * colors.leftCars!.length)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(x, 0.05, z);
      this.scene.add(mesh);
      this.carInstances.push({
        mesh,
        speed: random(opts.movingCloserSpeed),
        progress: Math.random(),
        offset: z,
        laneIndex: lane,
        side: 'left',
      });
    }

    // Right side (same direction — blue tail lights)
    for (let i = 0; i < opts.lightPairsPerRoadWay; i++) {
      const progress = i / opts.lightPairsPerRoadWay;
      const z = -progress * opts.length;
      const lane = Math.floor(Math.random() * opts.lanesPerRoad);
      const laneWidth = opts.roadWidth / opts.lanesPerRoad;
      const x = roadX - lane * laneWidth - laneWidth / 2;
      const len = random(opts.carLightsLength);
      const radius = random(opts.carLightsRadius);
      const geo = new THREE.CylinderGeometry(radius, radius, len, 6);
      const color = colors.rightCars![Math.floor(Math.random() * colors.rightCars!.length)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(x, 0.05, z);
      this.scene.add(mesh);
      this.carInstances.push({
        mesh,
        speed: random(opts.movingAwaySpeed),
        progress: Math.random(),
        offset: z,
        laneIndex: lane,
        side: 'right',
      });
    }

    this.leftCarLights = this.carInstances[0].mesh; // placeholder
    this.rightCarLights = this.carInstances[opts.lightPairsPerRoadWay].mesh; // placeholder
  }

  private buildSideSticks() {
    const opts = this.options;
    const stickColor = new THREE.Color(opts.colors.sticks);
    const roadX = opts.roadWidth / 2 + opts.islandWidth / 2 + 0.5;

    for (let i = 0; i < opts.totalSideLightSticks; i++) {
      const progress = i / opts.totalSideLightSticks;
      const z = -progress * opts.length;
      const height = random(opts.lightStickHeight);
      const geo = new THREE.CylinderGeometry(0.03, 0.03, height, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: stickColor,
        transparent: true,
        opacity: 0.6,
      });

      // Left stick
      const left = new THREE.Mesh(geo.clone(), mat.clone());
      left.position.set(-roadX, height / 2, z);
      this.scene.add(left);

      // Right stick
      const right = new THREE.Mesh(geo.clone(), mat.clone());
      right.position.set(roadX, height / 2, z);
      this.scene.add(right);
    }
    this.leftSticks = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 1);
    this.rightSticks = this.leftSticks;
  }

  private buildPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new BloomEffect({ intensity: 1.2, luminanceThreshold: 0.1, luminanceSmoothing: 0.3 });
    const smaa = new SMAAEffect({ preset: SMAAPreset.LOW });
    this.composer.addPass(new EffectPass(this.camera, bloom, smaa));
  }

  private addEventListeners(container: HTMLElement) {
    const onMouseDown = () => {
      this.speedUpTarget = this.options.speedUp;
      this.options.onSpeedUp?.();
    };
    const onMouseUp = () => {
      this.speedUpTarget = 0;
      this.options.onSlowDown?.();
    };
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onMouseDown, { passive: true });
    container.addEventListener('touchend', onMouseUp);

    const onResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.composer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);
  }

  private animate = () => {
    if (this.disposed) return;
    this.animId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    this.timeOffset += delta;
    const time = this.timeOffset;

    // Smooth speed up
    this.speedUp = lerp(this.speedUp, this.speedUpTarget, delta * 2);
    const currentFov = lerp(this.options.fov, this.options.fovSpeedUp, this.speedUp / this.options.speedUp);
    this.camera.fov = currentFov;
    this.camera.updateProjectionMatrix();

    // Move car light trails
    this.carInstances.forEach((car) => {
      car.progress += delta * (Math.abs(car.speed) / this.options.length) * (1 + this.speedUp);
      if (car.progress > 1) car.progress = 0;
      const z = -car.progress * this.options.length;
      car.mesh.position.z = z;
      (car.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.9, car.progress * 3);
    });

    // Apply camera distortion
    const distOffset = this.distortion.getJS(0.02, time);
    this.camera.position.set(distOffset.x * 0.02, 1.5 + distOffset.y * 0.02, 5);
    this.camera.lookAt(distOffset.x * 0.01, distOffset.y * 0.01, -5);

    this.composer.render(delta);
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.composer.dispose();
  }
}

// ─── React Component ──────────────────────────────────────────────────────────

interface HyperspeedProps {
  effectOptions?: HyperspeedOptions;
  className?: string;
}

export default function Hyperspeed({ effectOptions = f1RedBullPreset, className }: HyperspeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HyperspeedApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing app
    if (appRef.current) {
      appRef.current.dispose();
      appRef.current = null;
    }

    // Clear DOM children
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
      className={className}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'absolute', inset: 0 }}
    />
  );
}
