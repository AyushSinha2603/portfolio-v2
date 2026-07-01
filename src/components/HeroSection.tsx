'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// ─── F1 Lights-Out Sequence (purely decorative) ──────────────────────────────
function LightsOut() {
  const [phase, setPhase] = useState<'idle' | 'lighting' | 'out'>('idle');
  const [lit, setLit] = useState(0);

  useEffect(() => {
    // Start lighting sequence after brief pause
    const t0 = setTimeout(() => setPhase('lighting'), 200);
    return () => clearTimeout(t0);
  }, []);

  useEffect(() => {
    if (phase !== 'lighting') return;
    // Light up 1 LED every 500ms
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setLit(count);
      if (count >= 5) {
        clearInterval(interval);
        // After all 5 lit, go dark after 600ms
        setTimeout(() => {
          setLit(0);
          setPhase('out');
        }, 600);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 'out') return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
        height: 22,
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: n <= lit ? '#DC0000' : '#1a1a1a',
            border: '1px solid rgba(220,0,0,0.25)',
            boxShadow: n <= lit ? '0 0 10px #DC0000, 0 0 20px rgba(220,0,0,0.35)' : 'none',
            transition: 'background 0.1s, box-shadow 0.15s',
            flexShrink: 0,
          }}
        />
      ))}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'rgba(220,0,0,0.5)',
          marginLeft: 4,
        }}
      >
        {phase === 'lighting' ? 'ARMED' : 'STANDBY'}
      </span>
    </div>
  );
}

// ─── Throttle Gauge (fixed bottom-right) ─────────────────────────────────────
function ThrottleGauge({ scrollProgress }: { scrollProgress: number }) {
  const throttle = Math.round(scrollProgress * 100);
  const rpm = Math.round(3000 + scrollProgress * 9000);
  const isHot = throttle > 75;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 100,
        fontFamily: 'var(--font-mono, monospace)',
        background: 'rgba(6,6,10,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${isHot ? 'rgba(220,0,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 130,
        pointerEvents: 'none',
        transition: 'border-color 0.3s',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#555', marginBottom: 6 }}>THROTTLE</div>
      <div
        style={{
          height: 2,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${throttle}%`,
            background: isHot ? '#DC0000' : throttle > 40 ? '#ff6600' : '#1B1464',
            borderRadius: 2,
            transition: 'width 0.15s ease, background 0.3s ease',
            boxShadow: `0 0 8px ${isHot ? 'rgba(220,0,0,0.6)' : 'rgba(27,20,100,0.5)'}`,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: isHot ? '#DC0000' : '#e0e0e0', transition: 'color 0.3s' }}>
          {throttle}%
        </span>
        <span style={{ fontSize: 9, color: '#555' }}>{rpm.toLocaleString()} RPM</span>
      </div>
    </div>
  );
}

// ─── Speed Readout (fixed bottom-left) ───────────────────────────────────────
function SpeedBadge() {
  const [speed, setSpeed] = useState(0);
  const target = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      target.current = Math.min(342, Math.round(Math.abs(window.scrollY) * 0.12));
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = () => {
      setSpeed((prev) => {
        const diff = target.current - prev;
        return Math.abs(diff) < 0.5 ? target.current : prev + diff * 0.1;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 100,
        fontFamily: 'var(--font-mono, monospace)',
        background: 'rgba(6,6,10,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 100,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#555', marginBottom: 4 }}>SPEED</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e0', lineHeight: 1 }}>
          {Math.round(speed)}
        </span>
        <span style={{ fontSize: 9, color: '#555' }}>km/h</span>
      </div>
    </div>
  );
}

// ─── Main HeroSection ─────────────────────────────────────────────────────────
interface HeroSectionProps {
  scrollProgress?: number;
}

const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(
  ({ scrollProgress = 0 }, ref) => {
    return (
      <>
        {/* Fixed telemetry overlays — rendered outside the scroll flow */}
        <ThrottleGauge scrollProgress={scrollProgress} />
        <SpeedBadge />

        <div ref={ref} id="hero" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          {/* Huge watermark race number */}
          {/* Section label */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              right: 28,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'rgba(220,0,0,0.6)',
            }}
          >
            THE STARTING GRID
          </div>

          {/* Central glassmorphic card */}
          <div
            className="max-h-[55vh] overflow-y-auto md:max-h-none md:overflow-visible scrollbar-hide"
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              background: 'rgba(6,6,10,0.6)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              padding: 'clamp(28px, 5vw, 56px) clamp(24px, 6vw, 64px)',
              maxWidth: 680,
              width: '100%',
            }}
          >
            {/* Lights-out countdown */}
            <LightsOut />

            {/* Name */}
            <h1
              style={{
                fontFamily: 'var(--font-headline, "Space Grotesk", sans-serif)',
                fontWeight: 800,
                fontSize: 'clamp(52px, 10vw, 84px)',
                lineHeight: 0.92,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              AYUSH SINHA
            </h1>

            {/* Red accent underline */}
            <div
              style={{
                width: 72,
                height: 3,
                background: '#DC0000',
                borderRadius: 2,
                marginTop: 18,
                boxShadow: '0 0 14px rgba(220,0,0,0.55)',
              }}
            />

            {/* Title */}
            <p
              style={{
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                fontSize: 18,
                fontWeight: 300,
                color: '#777',
                marginTop: 20,
                marginBottom: 0,
              }}
            >
              Software Engineer | Backend & System Design Enthusiast
            </p>

            {/* Tagline */}
            <p
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 13,
                letterSpacing: '0.05em',
                color: '#888',
                marginTop: 14,
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              Focused on building scalable web apps and optimizing backend systems.<br/>
              🎓 B.Tech in Civil Engineering @ NIT Rourkela ('27)<br/>
              🏎️ F1 fan, AoE2 strategist, amateur photographer, speed chess enthusiast.
            </p>

            {/* Status row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginTop: 28,
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 10,
                letterSpacing: '0.15em',
                color: '#444',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                    boxShadow: '0 0 8px rgba(34,197,94,0.7)',
                    flexShrink: 0,
                  }}
                />
                ALL SYSTEMS GO
              </span>
              <span style={{ color: '#222' }}>|</span>
              <span>SEASON 2025</span>
            </div>
          </div>

        </div>
      </>
    );
  }
);

HeroSection.displayName = 'HeroSection';
export default HeroSection;
