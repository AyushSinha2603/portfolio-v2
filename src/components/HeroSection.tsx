'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// F1 Lights-out countdown component
function LightsOut({ onComplete }: { onComplete: () => void }) {
  const [lit, setLit] = useState(0); // 0–5 lights lit up, then GO
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Light each red light every 400ms
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setLit(i), i * 400));
    }
    // After all 5 lights, go out — "LIGHTS OUT!"
    timers.push(
      setTimeout(() => {
        setLit(0);
        setShowGo(true);
        onComplete();
      }, 5 * 400 + 600)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showGo) return null;

  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: n <= lit ? '#DC0000' : '#1a1a1a',
            border: '1px solid rgba(220,0,0,0.3)',
            boxShadow: n <= lit ? '0 0 8px #DC0000, 0 0 16px rgba(220,0,0,0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        />
      ))}
    </div>
  );
}

// Scroll throttle gauge in corner
function ThrottleGauge({ scrollProgress }: { scrollProgress: number }) {
  const throttle = Math.round(scrollProgress * 100);
  const rpm = Math.round(3000 + scrollProgress * 9000);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 50,
        fontFamily: 'var(--font-mono)',
        background: 'rgba(8,8,12,0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(220,0,0,0.2)',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 120,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.15em', color: '#888', marginBottom: 6 }}>THROTTLE</div>
      {/* RPM bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${throttle}%`,
            background: throttle > 80 ? '#DC0000' : throttle > 50 ? '#ff6600' : '#1B1464',
            borderRadius: 2,
            transition: 'width 0.2s ease, background 0.3s ease',
            boxShadow: `0 0 6px ${throttle > 80 ? '#DC0000' : '#1B1464'}`,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: throttle > 80 ? '#DC0000' : '#e0e0e0' }}>
          {throttle}%
        </span>
        <span style={{ fontSize: 9, color: '#666', marginLeft: 8 }}>{rpm.toLocaleString()} RPM</span>
      </div>
    </div>
  );
}

// Speed indicator overlay — small corner badge
function SpeedBadge() {
  const [speed, setSpeed] = useState(0);
  const targetRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      targetRef.current = Math.min(342, Math.abs(window.scrollY / 10));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const animate = () => {
      setSpeed((prev) => {
        const next = prev + (targetRef.current - prev) * 0.08;
        return Math.round(next);
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        zIndex: 50,
        fontFamily: 'var(--font-mono)',
        background: 'rgba(8,8,12,0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 100,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.15em', color: '#888', marginBottom: 4 }}>SPEED</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#e0e0e0' }}>{speed}</span>
        <span style={{ fontSize: 9, color: '#666' }}>km/h</span>
      </div>
    </div>
  );
}

interface HeroSectionProps {
  scrollProgress?: number;
}

const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(
  ({ scrollProgress = 0 }, ref) => {
    const [started, setStarted] = useState(false);

    return (
      <div ref={ref} className="garage-section" id="hero">
        {/* Throttle gauge & speed badge (fixed, portal-style) */}
        <ThrottleGauge scrollProgress={scrollProgress} />
        <SpeedBadge />

        <section className="relative flex min-h-screen flex-col items-center justify-center px-6">
          {/* Race number — huge watermark */}
          <div
            className="absolute top-6 left-8 font-headline font-bold italic select-none"
            style={{ fontSize: 'clamp(80px, 18vw, 200px)', color: 'rgba(220,0,0,0.04)', lineHeight: 1, zIndex: 0 }}
          >
            01
          </div>

          {/* Section marker */}
          <div
            className="absolute top-8 right-8 font-mono text-xs tracking-[0.3em]"
            style={{ color: 'rgba(220,0,0,0.7)' }}
          >
            THE STARTING GRID
          </div>

          {/* Main content card */}
          <div
            className="relative z-10 flex flex-col items-center text-center"
            style={{
              background: 'rgba(8,8,12,0.45)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: 'clamp(32px, 6vw, 64px)',
              maxWidth: 700,
              width: '100%',
            }}
          >
            {/* Lights-out sequence */}
            <LightsOut onComplete={() => setStarted(true)} />

            {/* Name */}
            <h1
              className="font-headline font-bold tracking-tight text-white"
              style={{
                fontSize: 'clamp(48px, 10vw, 96px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                opacity: started ? 1 : 0,
                transform: started ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
              }}
            >
              AYUSH
            </h1>

            {/* Red accent line */}
            <div
              style={{
                width: started ? 80 : 0,
                height: 3,
                background: '#DC0000',
                borderRadius: 2,
                marginTop: 16,
                boxShadow: '0 0 12px rgba(220,0,0,0.5)',
                transition: 'width 0.5s ease 0.7s',
              }}
            />

            {/* Title */}
            <p
              className="mt-6 text-xl font-light"
              style={{
                fontFamily: 'var(--font-body)',
                color: '#888',
                opacity: started ? 1 : 0,
                transition: 'opacity 0.6s ease 0.8s',
              }}
            >
              Software Engineer
            </p>

            {/* Tagline */}
            <p
              className="font-mono mt-3 text-sm tracking-wider"
              style={{
                color: '#555',
                opacity: started ? 1 : 0,
                transition: 'opacity 0.6s ease 1s',
              }}
            >
              Precision-engineered software.{' '}
              <span style={{ color: '#DC0000' }}>Zero-latency</span> execution.
            </p>

            {/* Status row */}
            <div
              className="font-mono mt-8 flex items-center gap-6 text-xs"
              style={{
                color: '#555',
                opacity: started ? 1 : 0,
                transition: 'opacity 0.6s ease 1.1s',
              }}
            >
              <span className="flex items-center gap-2">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
                ALL SYSTEMS GO
              </span>
              <span style={{ color: '#333' }}>|</span>
              <span>SEASON 2025</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute bottom-10 flex flex-col items-center gap-3"
            style={{
              opacity: started ? 1 : 0,
              transition: 'opacity 0.6s ease 1.4s',
            }}
          >
            <ChevronDown
              className="animate-bounce"
              style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.3)' }}
            />
            <span className="font-mono text-xs tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              SCROLL TO START
            </span>
          </div>
        </section>
      </div>
    );
  }
);

HeroSection.displayName = 'HeroSection';

export default HeroSection;
