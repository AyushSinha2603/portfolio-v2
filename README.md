<div align="center">
  <h1 align="center">🏎️ Ayush Sinha — Portfolio v2</h1>
  <p align="center">
    <strong>A high-octane, interactive 3D web experience built for speed and precision.</strong>
  </p>
  
  <p align="center">
    <a href="https://github.com/AyushSinha2603/portfolio-v2/stargazers"><img src="https://img.shields.io/github/stars/AyushSinha2603/portfolio-v2?style=for-the-badge&color=DC0000" alt="Stars" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js" alt="Three.js" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  </p>
</div>

<br />

Welcome to the open-source repository for my **motorsport-inspired 3D web portfolio**. Designed to push the limits of creative web engineering, this project merges clean software architecture with an immersive, high-performance WebGL environment. 

Inspired by the Formula 1 paddock, the UI features data-telemetry aesthetics, advanced glassmorphism, and seamless scroll-driven physics.

---

## ✨ Key Features

- **🏎️ Immersive 3D Environment:** A fully interactive 3D Formula 1 car seamlessly integrated into the DOM using `three.js` and `@react-three/fiber`. 
- **🎛️ Motorsport Telemetry UI:** A bespoke design system utilizing advanced glassmorphism, carbon-fiber color palettes, and subtle data telemetry grid patterns to mimic F1 pit-wall screens.
- **📜 Scroll-Driven Physics:** Connected directly to user scroll via `GSAP (ScrollTrigger)` to manipulate 3D camera angles, car velocity, steering telemetry, and lighting conditions dynamically.
- **⚡ Adaptive Performance:** Carefully tuned WebGL rendering pipeline. Dynamically scales pixel ratios, Bloom intensities, and SMAA (anti-aliasing) based on device capabilities (mobile vs. desktop) ensuring a buttery-smooth **60fps** experience across devices.

## 🛠️ Technology Stack

| Category | Technology | Description |
|---|---|---|
| **Framework** | [Next.js (App Router)](https://nextjs.org/) | Server & Client component architecture |
| **Core** | [React 18+](https://react.dev/) | UI component orchestration |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe engineering |
| **3D Engine** | [Three.js](https://threejs.org/) + [R3F](https://docs.pmnd.rs/react-three-fiber/) | WebGL graphics rendering |
| **Postprocessing**| [React Postprocessing](https://docs.pmnd.rs/react-postprocessing/) | Bloom effects, anti-aliasing |
| **Animation** | [GSAP](https://gsap.com/) + ScrollTrigger | Complex scroll-linked timelines |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first glassmorphism styling |

## ⚙️ Under the Hood: Architecture

### 1. **Scroll-Driven 3D Canvas (`Hyperspeed.tsx`)**
The background canvas doesn't just play a video; it renders a full WebGL scene in real-time. As the user scrolls, `GSAP` calculates the scroll velocity and maps it directly to the 3D scene. This controls:
- The speed of the particle streaks (hyperspeed effect).
- The camera FOV and Z-axis depth tracking.
- The car's pitch, yaw, and lateral sway on the track.

### 2. **UI Layer Separation**
To ensure the 3D canvas doesn't bottleneck the DOM, the application uses strict layering:
- **`z-index: 0`**: The WebGL `<canvas>` runs continuously in the background, decoupled from standard React renders using Three.js imperative loops.
- **`z-index: 10`**: The DOM UI overlay (built with Tailwind CSS and Next.js) scrolls independently, driving the telemetry data via React state.

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AyushSinha2603/portfolio-v2.git
   cd portfolio-v2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Experience the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```text
src/
├── app/                  # Next.js App Router (page.tsx, layout.tsx, globals.css)
├── components/           # Modular UI & 3D components
│   ├── F1Car.tsx         # 3D F1 Car Model loader
│   ├── Hyperspeed.tsx    # Core WebGL Scene & Postprocessing Pipeline
│   ├── HeroSection.tsx   # Starting Grid UI
│   ├── TechStackSection.tsx # Car Architecture UI
│   └── ProjectsSection.tsx  # Track Record UI
public/
├── models/               # Contains optimized .glb 3D assets
└── ...
```

## 📜 Authorship

Designed, architected, and developed by **[Ayush Sinha](https://github.com/AyushSinha2603)**.
