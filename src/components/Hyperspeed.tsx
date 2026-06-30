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
import { GLTFLoader, DRACOLoader } from 'three-stdlib';

export interface HyperspeedOptions {
  onSpeedUp?: () => void;
  onSlowDown?: () => void;
  roadWidth?: number;
  lanesPerRoad?: number;
  fov?: number;
  baseSpeed?: number;      // units / second at normal pace
  boostSpeed?: number;     // multiplier on mouse-hold
  lightStreakCount?: number;
  sideStickCount?: number;
  colors?: {
    road?: number;
    island?: number;
    sky?: number;
    leftStreaks?: number[]; // oncoming (toward camera)
    rightStreaks?: number[]; // going away
    sideSticks?: number;
    shoulderLine?: number;
  };
}

export const f1RedBullPreset: HyperspeedOptions = {
  roadWidth: 12,
  lanesPerRoad: 3,
  fov: 85,
  baseSpeed: 60,
  boostSpeed: 3,
  lightStreakCount: 80,
  sideStickCount: 30,
  colors: {
    road: 0x080808,
    island: 0x050505,
    sky: 0x000000,
    leftStreaks:  [0xdc0000, 0xff1100, 0xcc0000, 0xff3300],
    rightStreaks: [0x1b1464, 0x2244cc, 0x0033ff, 0x334488],
    sideSticks: 0xdc0000,
    shoulderLine: 0x1b1464,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// ─── Road chunk system ────────────────────────────────────────────────────────

const CHUNK_LEN  = 40;   // length of one road tile
const CHUNK_CNT  = 20;   // number of tiles kept in scene
const ROAD_DEPTH = CHUNK_LEN * CHUNK_CNT;   // total road depth

interface LightStreak {
  mesh: THREE.Mesh;
  speed: number;      // units/sec, positive = toward camera (+z), negative = away (-z)
  z: number;
  lane: number;
  side: 'left' | 'right';
}

interface SideStick {
  left: THREE.Mesh;
  right: THREE.Mesh;
  z: number;
}

// ─── App ──────────────────────────────────────────────────────────────────────

class HyperspeedApp {
  private opts: Required<HyperspeedOptions> & { colors: Required<NonNullable<HyperspeedOptions['colors']>> };
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;

  // Road chunks (recycled)
  private roadChunks: THREE.Group[] = [];
  private roadScrollZ = 0;        // how far the road has scrolled (accumulates)

  // Light streaks
  private streaks: LightStreak[] = [];

  // Side sticks
  private sideSticks: SideStick[] = [];
  private sticksScrollZ = 0;

  // F1 Car
  private f1Car: THREE.Group | null = null;

  // State
  private rafId = 0;
  private lastTime = 0;
  private elapsed  = 0;
  private disposed = false;
  private boost = 1;

  constructor(container: HTMLElement, opts: HyperspeedOptions) {
    const c = opts.colors ?? {};
    this.opts = {
      onSpeedUp:        opts.onSpeedUp ?? (() => {}),
      onSlowDown:       opts.onSlowDown ?? (() => {}),
      roadWidth:        opts.roadWidth       ?? 12,
      lanesPerRoad:     opts.lanesPerRoad    ?? 3,
      fov:              opts.fov             ?? 85,
      baseSpeed:        opts.baseSpeed       ?? 60,
      boostSpeed:       opts.boostSpeed      ?? 3,
      lightStreakCount: opts.lightStreakCount ?? 80,
      sideStickCount:   opts.sideStickCount  ?? 30,
      colors: {
        road:         c.road         ?? 0x080808,
        island:       c.island       ?? 0x050505,
        sky:          c.sky          ?? 0x000000,
        leftStreaks:  c.leftStreaks  ?? [0xdc0000, 0xff1100],
        rightStreaks: c.rightStreaks ?? [0x1b1464, 0x2244cc],
        sideSticks:   c.sideSticks  ?? 0xdc0000,
        shoulderLine: c.shoulderLine ?? 0x1b1464,
      },
    };

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.opts.colors.sky);
    this.scene.fog = new THREE.Fog(this.opts.colors.sky, 80, 350);

    // Camera — driver's eye, low and looking forward along -Z axis
    this.camera = new THREE.PerspectiveCamera(
      this.opts.fov,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    // Camera sits at z=0, looking into the -z tunnel
    this.camera.position.set(0, 2.5, 0);
    this.camera.lookAt(0, 1.8, -100);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new BloomEffect({ intensity: 2.2, luminanceThreshold: 0.05, luminanceSmoothing: 0.3 });
    const smaa  = new SMAAEffect({ preset: SMAAPreset.LOW });
    this.composer.addPass(new EffectPass(this.camera, bloom, smaa));

    this.buildRoad();
    this.buildStreaks();
    this.buildSideSticks();
    this.addListeners(container);

    // Add Lights for the 3D Model (glTF uses PBR materials which need light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // reduced white ambient
    this.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(0, 10, -5);
    this.scene.add(dirLight);

    // Neon Rim Lights to match the track (Red on left, Blue on right)
    const leftRedLight = new THREE.PointLight(0xdc0000, 50, 20);
    leftRedLight.position.set(-3, 1, -4);
    this.scene.add(leftRedLight);

    const rightBlueLight = new THREE.PointLight(0x0044cc, 50, 20);
    rightBlueLight.position.set(3, 1, -4);
    this.scene.add(rightBlueLight);

    // Load F1 Car
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);

    loader.load('/models/f1car-transformed.glb', (gltf) => {
      this.f1Car = gltf.scene;
      
      // Calculate original size to scale appropriately
      const box = new THREE.Box3().setFromObject(this.f1Car);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // If max dimension is very small or large, we normalize it to roughly 7 units long
      const targetLength = 7.5; // Made the car significantly larger
      const scaleFactor = targetLength / size.z;
      
      this.f1Car.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Position car centrally on the road in front of camera
      // Bring the car much closer to the camera so it looks bigger
      this.f1Car.position.set(0, 0.05, -4.5);
      
      // Face forward (down the -Z axis)
      this.f1Car.rotation.set(0, Math.PI, 0); 
      
      // Enhance materials to look metallic and reflect the neon lights
      this.f1Car.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
             // Improve PBR material look without environment map
             child.material.roughness = 0.2;
             child.material.metalness = 0.8;
             // Remove the artificial gray emissive which causes fading
             if (child.material.emissive) {
               child.material.emissive.setHex(0x000000); 
             }
             child.material.needsUpdate = true;
          }
        }
      });
      
      this.scene.add(this.f1Car);
    });

    this.lastTime = performance.now();
    this.animate();
  }

  // ── Road: scrolling chunks ────────────────────────────────────────────────

  private makeLaneMat(color: number) {
    return new THREE.MeshBasicMaterial({ color });
  }

  private makeRoadChunk(offsetZ: number): THREE.Group {
    const { roadWidth, colors } = this.opts;
    const group = new THREE.Group();
    group.position.z = offsetZ;

    // Road surface
    const roadPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, CHUNK_LEN),
      this.makeLaneMat(colors.road)
    );
    roadPlane.rotation.x = -Math.PI / 2;
    roadPlane.position.z = -CHUNK_LEN / 2;
    group.add(roadPlane);

    // Shoulder lines (left & right edges)
    const shw = 0.18;
    [-(roadWidth / 2 - shw / 2), roadWidth / 2 - shw / 2].forEach((x) => {
      const sh = new THREE.Mesh(
        new THREE.PlaneGeometry(shw, CHUNK_LEN),
        this.makeLaneMat(colors.shoulderLine)
      );
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(x, 0.005, -CHUNK_LEN / 2);
      group.add(sh);
    });

    // Center dashed line
    const dashCount = 6;
    const dashLen = CHUNK_LEN / dashCount / 2;
    for (let i = 0; i < dashCount; i++) {
      const d = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, dashLen),
        new THREE.MeshBasicMaterial({ color: 0x222244, transparent: true, opacity: 0.6 })
      );
      d.rotation.x = -Math.PI / 2;
      d.position.set(0, 0.005, -i * (CHUNK_LEN / dashCount) - dashLen / 2 - CHUNK_LEN / dashCount / 4);
      group.add(d);
    }

    // Red/white curb strips on both sides
    const curbW = 0.55;
    const curbSeg = 6;
    for (let i = 0; i < curbSeg; i++) {
      const cLen = CHUNK_LEN / curbSeg;
      const cColor = i % 2 === 0 ? 0xdc0000 : 0x333333;
      [-(roadWidth / 2 + curbW / 2), roadWidth / 2 + curbW / 2].forEach((cx) => {
        const cb = new THREE.Mesh(
          new THREE.PlaneGeometry(curbW, cLen * 0.9),
          this.makeLaneMat(cColor)
        );
        cb.rotation.x = -Math.PI / 2;
        cb.position.set(cx, 0.003, -i * cLen - cLen / 2);
        group.add(cb);
      });
    }

    // Ground (island) beyond road
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(80, CHUNK_LEN),
      this.makeLaneMat(colors.island)
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.set(0, -0.01, -CHUNK_LEN / 2);
    group.add(gnd);

    return group;
  }

  private buildRoad() {
    for (let i = 0; i < CHUNK_CNT; i++) {
      const chunk = this.makeRoadChunk(-i * CHUNK_LEN);
      this.scene.add(chunk);
      this.roadChunks.push(chunk);
    }
  }

  private scrollRoad(delta: number, speed: number) {
    const move = speed * delta;
    this.roadScrollZ += move;

    this.roadChunks.forEach((chunk) => {
      chunk.position.z += move;
      // If chunk passed the camera, teleport it to the back
      if (chunk.position.z > CHUNK_LEN * 0.5) {
        chunk.position.z -= CHUNK_CNT * CHUNK_LEN;
      }
    });
  }

  // ── Light streaks ─────────────────────────────────────────────────────────

  private buildStreaks() {
    const { roadWidth, lanesPerRoad, lightStreakCount, colors } = this.opts;
    const laneW = roadWidth / lanesPerRoad;

    // Left road (oncoming — rush TOWARD camera, so positive speed)
    for (let i = 0; i < lightStreakCount / 2; i++) {
      const lane  = Math.floor(Math.random() * lanesPerRoad);
      const xBase = -(roadWidth / 2);
      const x     = xBase + lane * laneW + laneW / 2 + rnd(-0.3, 0.3);
      const len   = rnd(20, 80);
      const rad   = rnd(0.05, 0.14);
      const color = pick(colors.leftStreaks as number[]);

      const geo = new THREE.CylinderGeometry(rad, rad * 0.25, len, 5);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;

      const z = -rnd(5, ROAD_DEPTH * 0.9);
      mesh.position.set(x, rnd(0.1, 0.35), z);
      this.scene.add(mesh);

      this.streaks.push({ mesh, speed: rnd(120, 220), z, lane, side: 'left' });
    }

    // Right road (going away — negative speed)
    for (let i = 0; i < lightStreakCount / 2; i++) {
      const lane  = Math.floor(Math.random() * lanesPerRoad);
      const xBase = roadWidth / 2;
      const x     = xBase - lane * laneW - laneW / 2 + rnd(-0.3, 0.3);
      const len   = rnd(15, 60);
      const rad   = rnd(0.05, 0.12);
      const color = pick(colors.rightStreaks as number[]);

      const geo = new THREE.CylinderGeometry(rad, rad * 0.3, len, 5);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;

      const z = -rnd(5, ROAD_DEPTH * 0.9);
      mesh.position.set(x, rnd(0.1, 0.35), z);
      this.scene.add(mesh);

      this.streaks.push({ mesh, speed: -rnd(60, 120), z, lane, side: 'right' });
    }
  }

  private updateStreaks(delta: number, speedMul: number) {
    this.streaks.forEach((s) => {
      s.z += s.speed * speedMul * delta;
      s.mesh.position.z = s.z;

      if (s.side === 'left' && s.z > 8) {
        s.z = -rnd(ROAD_DEPTH * 0.3, ROAD_DEPTH * 0.95);
        s.mesh.position.z = s.z;
      }
      if (s.side === 'right' && s.z < -ROAD_DEPTH * 0.95) {
        s.z = -rnd(2, ROAD_DEPTH * 0.2);
        s.mesh.position.z = s.z;
      }

      // Fade by distance
      const dist = Math.abs(s.z);
      const alpha = Math.max(0.05, Math.min(0.9, 1 - dist / (ROAD_DEPTH * 0.7)));
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * (s.side === 'left' ? 0.85 : 0.7);
    });
  }

  // ── Side sticks (glow poles lining the road) ──────────────────────────────

  private buildSideSticks() {
    const { roadWidth, sideStickCount, colors } = this.opts;
    const spacing = ROAD_DEPTH / sideStickCount;
    const sideX   = roadWidth / 2 + 1.2;

    for (let i = 0; i < sideStickCount; i++) {
      const z      = -i * spacing;
      const height = rnd(1.4, 2.2);
      const geo    = new THREE.CylinderGeometry(0.05, 0.05, height, 5);
      const mat    = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.sideSticks),
        transparent: true,
        opacity: 0.8,
      });

      const left  = new THREE.Mesh(geo.clone(), mat.clone());
      const right = new THREE.Mesh(geo.clone(), mat.clone());
      left.position.set(-sideX, height / 2, z);
      right.position.set(sideX, height / 2, z);
      this.scene.add(left, right);

      // Tiny glowing cap on top
      const capGeo = new THREE.SphereGeometry(0.1, 4, 4);
      const capMat = new THREE.MeshBasicMaterial({ color: colors.sideSticks });
      const capL   = new THREE.Mesh(capGeo, capMat);
      const capR   = new THREE.Mesh(capGeo.clone(), capMat.clone());
      capL.position.set(-sideX, height, z);
      capR.position.set(sideX, height, z);
      this.scene.add(capL, capR);

      this.sideSticks.push({ left, right, z });
    }
  }

  private updateSideSticks(delta: number, speed: number) {
    const move  = speed * delta;
    this.sticksScrollZ += move;

    this.sideSticks.forEach((s) => {
      s.z += move;
      if (s.z > 5) {
        s.z -= ROAD_DEPTH;
      }
      s.left.position.z  = s.z;
      s.right.position.z = s.z;
    });
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private addListeners(container: HTMLElement) {
    const dn = () => { this.boost = this.opts.boostSpeed; this.opts.onSpeedUp?.(); };
    const up = () => { this.boost = 1;                   this.opts.onSlowDown?.(); };
    container.addEventListener('mousedown',  dn);
    container.addEventListener('mouseup',    up);
    container.addEventListener('touchstart', dn, { passive: true });
    container.addEventListener('touchend',   up);

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  // ── Animate ───────────────────────────────────────────────────────────────

  private animate = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.animate);

    const now   = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.elapsed += delta;

    const t     = this.elapsed;
    const speed = this.opts.baseSpeed * this.boost;

    // Move road toward camera
    this.scrollRoad(delta, speed);

    // Animate streaks
    this.updateStreaks(delta, this.boost);

    // Move side sticks with road
    this.updateSideSticks(delta, speed);

    // Camera: gentle sinusoidal sway — road-warp illusion
    const swayX = Math.sin(t * 0.18) * 0.35;
    const swayY = 2.5 + Math.sin(t * 0.12) * 0.12;
    this.camera.position.set(swayX, swayY, 0);
    this.camera.lookAt(swayX * 0.4, 1.6, -100);

    // FOV pulse on boost
    const targetFov = this.boost > 1 ? this.opts.fov! + 18 : this.opts.fov!;
    this.camera.fov += (targetFov - this.camera.fov) * 0.06;
    this.camera.updateProjectionMatrix();

    // Animate F1 Car
    if (this.f1Car) {
      // Car sways with camera but leads slightly ahead
      this.f1Car.position.x = swayX * 0.85;
      // High-speed vibration
      this.f1Car.position.y = 0.01 + Math.sin(t * 35) * 0.01 * (speed / this.opts.baseSpeed);
      // Subtle roll when turning
      this.f1Car.rotation.z = -swayX * 0.05;
      
      // Rotate wheels
      this.f1Car.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name.toLowerCase().includes('wheel')) {
          child.rotation.x -= delta * speed * 0.15;
        }
      });
    }

    this.composer.render(delta);
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
    this.composer.dispose();
  }
}

// ─── React component ──────────────────────────────────────────────────────────

interface HyperspeedProps {
  effectOptions?: HyperspeedOptions;
}

export default function Hyperspeed({ effectOptions = f1RedBullPreset }: HyperspeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef       = useRef<HyperspeedApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    appRef.current?.dispose();

    const el = containerRef.current;
    while (el.firstChild) el.removeChild(el.firstChild);

    appRef.current = new HyperspeedApp(el, effectOptions);

    return () => { appRef.current?.dispose(); appRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
}
