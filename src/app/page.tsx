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
        onUpdate: (self) => setScrollProgress(self.progress),
      });

      // ── Hero: fade + lift out ──────────────────────────────────────────────
      if (heroRef.current) {
        gsap.to(heroRef.current, {
          opacity: 0,
          y: -80,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // ── Garage sections: animate IN only (start visible, slide from side) ──
      const garageSections = [
        { ref: techRef,       fromX: -60 },
        { ref: projectsRef,   fromX:  60 },
        { ref: openSourceRef, fromX: -60 },
        { ref: footerRef,     fromX:   0 },
      ];

      garageSections.forEach(({ ref, fromX }) => {
        if (!ref.current) return;

        // Set initial state via CSS so it doesn't flicker
        gsap.set(ref.current, { opacity: 0, x: fromX, y: 30 });

        // Animate in on scroll
        gsap.to(ref.current, {
          opacity: 1,
          x: 0,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 88%',
            end: 'top 40%',
            scrub: 1,
            toggleActions: 'play none none reverse',
          },
        });
      });

    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ── Fixed racing background ─── */}
      <HyperspeedBackground />

      {/* ── Scroll runway (500vh) ─── */}
      <div
        ref={mainRef}
        style={{ position: 'relative', zIndex: 10, height: '500vh' }}
      >

        {/* 01 — Starting Grid (sticky hero) */}
        <div
          ref={heroRef}
          style={{
            height: '100vh',
            position: 'sticky',
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <HeroSection scrollProgress={scrollProgress} />
        </div>

        <div style={{ height: '30vh' }} />

        {/* 02 — Car Architecture */}
        <div
          ref={techRef}
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 16px',
          }}
        >
          <TechStackSection />
        </div>

        <div style={{ height: '20vh' }} />

        {/* 03 — Track Record */}
        <div
          ref={projectsRef}
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 16px',
          }}
        >
          <ProjectsSection />
        </div>

        <div style={{ height: '20vh' }} />

        {/* 04 — Constructor Collaborations */}
        <div
          ref={openSourceRef}
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 16px',
          }}
        >
          <OpenSourceSection />
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
