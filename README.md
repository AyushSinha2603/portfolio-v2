# Ayush Sinha — Portfolio v2 🏎️

![Portfolio Preview](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-Black?logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-Black?logo=three.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

A highly interactive, motorsport-inspired 3D web portfolio. Engineered to combine clean software architecture with immersive web experiences, featuring a Formula 1 paddock aesthetic, scroll-driven animations, and a high-performance WebGL environment.

## ✨ Key Features

- **Immersive 3D Environment:** Features a 3D Formula 1 car seamlessly integrated into the DOM using `three.js` and `@react-three/fiber`.
- **Motorsport Telemetry UI:** A bespoke design system utilizing advanced glassmorphism, carbon-fiber color palettes, and subtle data telemetry grid patterns.
- **Scroll-Driven Physics:** Connected directly to user scroll via `GSAP (ScrollTrigger)` to manipulate 3D camera angles, car velocity, and lighting conditions dynamically.
- **Optimized Performance:** Carefully tuned WebGL rendering pipeline. Dynamically scales pixel ratios, Bloom intensities, and SMAA (anti-aliasing) based on device capabilities for a butter-smooth 60fps experience on mobile and desktop.

## 🛠️ Technology Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Core Library:** [React 18+](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics:** [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) + [React Postprocessing](https://docs.pmnd.rs/react-postprocessing/)
- **Animations:** [GSAP (GreenSock)](https://gsap.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

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
├── app/                  # Next.js App Router setup, global layout, and CSS
├── components/           # UI and 3D components (Hero, Tech Stack, Projects)
│   ├── F1Car.tsx         # 3D F1 Car Model loader and logic
│   ├── Hyperspeed.tsx    # Core WebGL Scene & Postprocessing
│   └── ...
public/
├── models/               # Contains optimized .glb 3D assets
└── ...
```

## 📜 Authorship

Designed and developed by [Ayush Sinha](https://github.com/AyushSinha2603).
