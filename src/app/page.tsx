'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroSection from '@/components/HeroSection';
import TechStackSection from '@/components/TechStackSection';
import ProjectsSection from '@/components/ProjectsSection';
import OpenSourceSection from '@/components/OpenSourceSection';
import FooterSection from '@/components/FooterSection';

const HyperspeedBackground = dynamic(
  () => import('@/components/HyperspeedBackground'),
  {
    ssr: false,
    loading: () => <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#000' }} />,
  }
);

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(0);

  const mainRef        = useRef<HTMLDivElement>(null);
  const heroRef        = useRef<HTMLDivElement>(null);
  const techRef        = useRef<HTMLDivElement>(null);
  const projectsRef    = useRef<HTMLDivElement>(null);
  const openSourceRef  = useRef<HTMLDivElement>(null);
  const footerRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── Master progress tracker (drives throttle / speed gauges) ──────────
      ScrollTrigger.create({
        trigger: mainRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          
          // Get velocity from GSAP (usually between -3000 and 3000)
          // We normalize it to a 0-1 multiplier range for the 3D scene
          const v = Math.abs(self.getVelocity());
          const normalizedSpeed = Math.min(v / 1500, 1.5); // Cap at 1.5x boost
          setScrollSpeed(normalizedSpeed);
        },
      });

      // Garage sections (Tech, Projects, Open Source) now scroll naturally without JS animations
      // to ensure maximum visibility and no ScrollTrigger conflicts.

    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ── Fixed racing background ─── */}
      <HyperspeedBackground scrollSpeed={scrollSpeed} />

      {/* ── Scroll container ─── */}
      <div
        ref={mainRef}
        style={{ position: 'relative', zIndex: 10 }}
      >
        {/* 01 — Starting Grid (Hero) */}
        <div
          ref={heroRef}
          className="flex min-h-screen items-center justify-center px-4 md:justify-start md:px-[5%] overflow-hidden"
        >
          <div className="w-full md:max-w-[40vw]">
            <HeroSection scrollProgress={scrollProgress} />
          </div>
        </div>

        <div style={{ height: '30vh' }} />

        {/* 02 — Car Architecture (Tech Stack) */}
        <div
          ref={techRef}
          className="flex min-h-screen items-center justify-center px-4 md:justify-end md:px-[5%]"
        >
          <div className="w-full md:max-w-[40vw]">
            <TechStackSection />
          </div>
        </div>

        <div style={{ height: '20vh' }} />

        {/* 03 — Track Record (Projects) */}
        <div
          ref={projectsRef}
          className="flex min-h-screen items-center justify-center px-4 md:justify-start md:px-[5%]"
        >
          <div className="w-full md:max-w-[40vw]">
            <ProjectsSection />
          </div>
        </div>

        <div style={{ height: '20vh' }} />

        {/* 04 — Telemetry (Open Source) */}
        <div
          ref={openSourceRef}
          className="flex min-h-screen items-center justify-center px-4 md:justify-end md:px-[5%]"
        >
          <div className="w-full md:max-w-[40vw]">
            <OpenSourceSection />
          </div>
        </div>

        <div style={{ height: '15vh' }} />

        {/* 05 — Pit Wall */}
        <div
          ref={footerRef}
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 16px 80px',
          }}
        >
          <FooterSection />
        </div>

      </div>
    </>
  );
}
