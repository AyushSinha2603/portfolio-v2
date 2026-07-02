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
    leftStreaks:  [0xE30118, 0xff1100, 0xcc0000, 0xff3300], // Racing Red
    rightStreaks: [0xffffff, 0xE0E0E0, 0xC0BFBF, 0x888888], // Subtle White/Grey
    sideSticks: 0xE30118, // Racing Red
    shoulderLine: 0xffffff, // White track outer lines
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

  // Shader Uniforms
  private uniforms = { uTime: { value: 0 } };

  // State
  private rafId = 0;
  private lastTime = 0;
  private elapsed  = 0;
  private disposed = false;
  
  // External scroll speed injected from React
  public scrollSpeedMultiplier = 0;

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

    const isMobile = window.innerWidth < 768;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // Hard cap pixel ratio on mobile to save GPU fill-rate
    this.renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5));
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
    
    // Scale down bloom intensity and completely disable SMAA (anti-aliasing) on mobile
    const bloomIntensity = isMobile ? 1.2 : 2.2;
    const bloom = new BloomEffect({ intensity: bloomIntensity, luminanceThreshold: 0.05, luminanceSmoothing: 0.3 });
    
    if (isMobile) {
      this.composer.addPass(new EffectPass(this.camera, bloom));
    } else {
      const smaa = new SMAAEffect({ preset: SMAAPreset.LOW });
      this.composer.addPass(new EffectPass(this.camera, bloom, smaa));
    }

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

    // Neon Rim Lights to match the track
    const leftRedLight = new THREE.PointLight(0xE30118, 50, 20); // Racing Red
    leftRedLight.position.set(-3, 1, -6);
    this.scene.add(leftRedLight);

    const rightBlueLight = new THREE.PointLight(0xffffff, 30, 20); // White
    rightBlueLight.position.set(3, 1, -6);
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
      const targetLength = 7.0; // Slightly scaled down from 7.5 to fit frame better
      const scaleFactor = targetLength / size.z;
      
      this.f1Car.scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Position car centrally on the road in front of camera
      // Pushed back to -6.5 so the rear doesn't clip the camera/screen edges
      this.f1Car.position.set(0, 0.05, -6.5);
      
      // Face forward (down the -Z axis)
      this.f1Car.rotation.set(0, Math.PI, 0); 
      
      // Convert realistic PBR materials into a Neon "Tron" aesthetic to match track
      this.f1Car.traverse((child) => {
        if (child instanceof THREE.Mesh) {
           // 1. Give the car a pitch-black solid body so we don't see through it
           child.material = new THREE.MeshBasicMaterial({ 
             color: 0x020202,
           });
           
           // 2. Add glowing neon edges on top of the geometry (Electric Blue to catch Bloom)
           const edges = new THREE.EdgesGeometry(child.geometry, 15);
           const lineNavy = new THREE.LineSegments(
             edges, 
             new THREE.LineBasicMaterial({ 
               color: 0x00A3E0, // Vibrant Electric Cyan/Blue for the wireframe pop
               transparent: true,
               opacity: 1.0
             })
           );
           child.add(lineNavy);
        }
      });
      
      this.scene.add(this.f1Car);
    });

    this.lastTime = performance.now();
    this.animate();
  }

  // ── Road: scrolling chunks ────────────────────────────────────────────────

  private attachDistortion(mat: THREE.Material) {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 wPos = modelMatrix * vec4(position, 1.0);
        float dz = max(0.0, -wPos.z - 8.0); // Bends start smoothly past the car
        
        // Loop and twisting curve math (Increased for more extreme curves)
        float xOff = sin(dz * 0.02 + uTime * 3.0) * dz * 0.3;
        float yOff = (cos(dz * 0.015 + uTime * 2.0) * dz * 0.25) - (dz * dz * 0.002);
        
        transformed.x += xOff;
        transformed.y += yOff;
        `
      );
    };
    return mat;
  }

  private makeLaneMat(color: number, opacity = 1.0) {
    const mat = new THREE.MeshBasicMaterial({ 
      color, 
      transparent: opacity < 1.0, 
      opacity 
    });
    return this.attachDistortion(mat);
  }

  private makeRoadChunk(offsetZ: number): THREE.Group {
    const { roadWidth, colors } = this.opts;
    const group = new THREE.Group();
    group.position.z = offsetZ;

    // Road surface (subdivided for smooth curve)
    const roadPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, CHUNK_LEN, 1, 24).rotateX(-Math.PI / 2),
      this.makeLaneMat(colors.road)
    );
    roadPlane.position.z = -CHUNK_LEN / 2;
    group.add(roadPlane);

    // Shoulder lines
    const shw = 0.18;
    [-(roadWidth / 2 - shw / 2), roadWidth / 2 - shw / 2].forEach((x) => {
      const sh = new THREE.Mesh(
        new THREE.PlaneGeometry(shw, CHUNK_LEN, 1, 24).rotateX(-Math.PI / 2),
        this.makeLaneMat(colors.shoulderLine)
      );
      sh.position.set(x, 0.005, -CHUNK_LEN / 2);
      group.add(sh);
    });

    // Center dashed line
    const dashCount = 6;
    const dashLen = CHUNK_LEN / dashCount / 2;
    for (let i = 0; i < dashCount; i++) {
      const d = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, dashLen, 1, 4).rotateX(-Math.PI / 2),
        this.makeLaneMat(0xE30118, 0.6) // Racing Red telemetry line
      );
      d.position.set(0, 0.005, -i * (CHUNK_LEN / dashCount) - dashLen / 2 - CHUNK_LEN / dashCount / 4);
      group.add(d);
    }

    // Red/white curbs
    const curbW = 0.55;
    const curbSeg = 6;
    for (let i = 0; i < curbSeg; i++) {
      const cLen = CHUNK_LEN / curbSeg;
      const cColor = i % 2 === 0 ? 0xE30118 : 0xdddddd; // Racing Red & White
      [-(roadWidth / 2 + curbW / 2), roadWidth / 2 + curbW / 2].forEach((cx) => {
        const cb = new THREE.Mesh(
          new THREE.PlaneGeometry(curbW, cLen * 0.9, 1, 4).rotateX(-Math.PI / 2),
          this.makeLaneMat(cColor)
        );
        cb.position.set(cx, 0.003, -i * cLen - cLen / 2);
        group.add(cb);
      });
    }

    // Ground (island)
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(120, CHUNK_LEN, 1, 24).rotateX(-Math.PI / 2),
      this.makeLaneMat(colors.island)
    );
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

      const geo = new THREE.CylinderGeometry(rad, rad * 0.25, len, 5, 8).rotateX(Math.PI / 2);
      const mat = this.makeLaneMat(color as number, 0.85);
      const mesh = new THREE.Mesh(geo, mat);

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

      const geo = new THREE.CylinderGeometry(rad, rad * 0.3, len, 5, 8).rotateX(Math.PI / 2);
      const mat = this.makeLaneMat(color as number, 0.75);
      const mesh = new THREE.Mesh(geo, mat);

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
      const geo    = new THREE.CylinderGeometry(0.05, 0.05, height, 5, 4);
      const mat    = this.makeLaneMat(colors.sideSticks, 0.8);

      const left  = new THREE.Mesh(geo.clone(), mat.clone());
      const right = new THREE.Mesh(geo.clone(), mat.clone());
      left.position.set(-sideX, height / 2, z);
      right.position.set(sideX, height / 2, z);
      this.scene.add(left, right);

      // Tiny glowing cap on top
      const capGeo = new THREE.SphereGeometry(0.1, 4, 4);
      const capMat = this.makeLaneMat(colors.sideSticks, 1.0);
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
    // Base speed is 1x. Scrolling adds up to 1.5x (from the normalized page.tsx velocity)
    const currentBoost = 1 + this.scrollSpeedMultiplier * (this.opts.boostSpeed - 1);
    const speed = this.opts.baseSpeed * currentBoost;

    // Move road toward camera
    this.scrollRoad(delta, speed);

    // Animate streaks
    this.updateStreaks(delta, currentBoost);

    // Move side sticks with road
    this.updateSideSticks(delta, speed);

    // Update global shader time for the 3D loop distortion
    this.uniforms.uTime.value = t;

    // Camera: gentle sinusoidal sway — road-warp illusion
    const swayX = Math.sin(t * 0.18) * 0.35;
    const swayY = 2.5 + Math.sin(t * 0.12) * 0.12;
    this.camera.position.set(swayX, swayY, 0);
    this.camera.lookAt(swayX * 0.4, 1.6, -100);

    // FOV pulse on boost
    const targetFov = currentBoost > 1.1 ? this.opts.fov! + 12 * currentBoost : this.opts.fov!;
    this.camera.fov += (targetFov - this.camera.fov) * 0.06;
    this.camera.updateProjectionMatrix();

    // Animate F1 Car
    if (this.f1Car) {
      // Calculate upcoming track curve based on the shader math logic
      const trackCurveX = Math.sin(t * 3.0); 
      const trackCurveY = Math.cos(t * 2.0);

      // Car position sways with track steering
      this.f1Car.position.x = swayX * 0.8 + trackCurveX * 0.4;
      // High-speed vibration + bouncing with the road
      this.f1Car.position.y = 0.01 + Math.sin(t * 35) * 0.01 * (speed / this.opts.baseSpeed) + trackCurveY * 0.1;
      
      // Dynamic orientation (Steering, Leaning, Pitching)
      this.f1Car.rotation.y = Math.PI - trackCurveX * 0.15; // Yaw (Steer into the curve)
      this.f1Car.rotation.z = -trackCurveX * 0.1;           // Roll (Lean into the curve)
      this.f1Car.rotation.x = trackCurveY * 0.05;           // Pitch (Nose up/down on hills)
      
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
  scrollSpeed?: number;
}

export default function Hyperspeed({ effectOptions = f1RedBullPreset, scrollSpeed = 0 }: HyperspeedProps) {
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

  // Update app speed when scroll speed changes
  useEffect(() => {
    if (appRef.current) {
      appRef.current.scrollSpeedMultiplier = scrollSpeed;
    }
  }, [scrollSpeed]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
}
