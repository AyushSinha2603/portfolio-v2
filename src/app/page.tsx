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

// Hyperspeed background — SSR-safe via dynamic import
const HyperspeedBackground = dynamic(
  () => import('@/components/HyperspeedBackground'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-0" style={{ background: '#000' }} />
    ),
  }
);

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const openSourceRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Master scroll tracker ───────────────────────────────────────────
      ScrollTrigger.create({
        trigger: mainRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => setScrollProgress(self.progress),
      });

      // ── Hero: fade/lift out as user scrolls away ────────────────────────
      if (heroRef.current) {
        gsap.to(heroRef.current, {
          opacity: 0,
          y: -100,
          scale: 0.96,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      }

      // ── Garage sections: slide in from alternating sides ────────────────
      const sections = [
        { ref: techRef,       fromX: -80 },
        { ref: projectsRef,   fromX:  80 },
        { ref: openSourceRef, fromX: -80 },
        { ref: footerRef,     fromX:   0 },
      ];

      sections.forEach(({ ref, fromX }) => {
        if (!ref.current) return;

        // Entrance
        gsap.fromTo(
          ref.current,
          { opacity: 0, x: fromX, y: 40, scale: 0.96 },
          {
            opacity: 1, x: 0, y: 0, scale: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 85%',
              end: 'top 35%',
              scrub: 1.2,
            },
          }
        );

        // Exit (fade out upward)
        gsap.fromTo(
          ref.current,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: -60,
            scrollTrigger: {
              trigger: ref.current,
              start: 'bottom 45%',
              end: 'bottom 5%',
              scrub: 1,
            },
          }
        );
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ── Hyperspeed racing track background ── */}
      <HyperspeedBackground />

      {/* ── Scroll container (500vh runway) ── */}
      <div
        ref={mainRef}
        style={{ position: 'relative', zIndex: 10, height: '500vh' }}
      >
        {/* ── 01: The Starting Grid ── */}
        <section
          ref={heroRef}
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'sticky',
            top: 0,
          }}
        >
          <HeroSection scrollProgress={scrollProgress} />
        </section>

        <div style={{ height: '25vh' }} />

        {/* ── 02: The Car Architecture ── */}
        <section
          ref={techRef}
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
        >
          <TechStackSection />
        </section>

        <div style={{ height: '15vh' }} />

        {/* ── 03: The Track Record ── */}
        <section
          ref={projectsRef}
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
        >
          <ProjectsSection />
        </section>

        <div style={{ height: '15vh' }} />

        {/* ── 04: Constructor Collaborations ── */}
        <section
          ref={openSourceRef}
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
        >
          <OpenSourceSection />
        </section>

        <div style={{ height: '10vh' }} />

        {/* ── 05: The Pit Wall ── */}
        <section
          ref={footerRef}
          style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px 64px' }}
        >
          <FooterSection />
        </section>
      </div>
    </>
  );
}
