'use client';

import { forwardRef } from 'react';
import { GitFork, Globe, Mail, FileDown } from 'lucide-react';

const socialLinks = [
  { href: 'https://github.com/AyushSinha2603', label: 'GitHub', icon: GitFork },
  { href: 'https://www.linkedin.com/in/ayush-sinha-70046a319/', label: 'LinkedIn', icon: Globe },
  { href: 'mailto:ayushcodes26@gmail.com', label: 'Email', icon: Mail },
] as const;

const FooterSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="garage-section" id="footer">
      <section className="glass-panel mx-auto max-w-2xl p-8 text-center">
        {/* Section header */}
        <span className="font-mono text-xs tracking-[0.3em] text-redbull-red">
          SECTION 05
        </span>
        <h2 className="font-headline mt-2 text-2xl font-bold text-titanium">
          THE PIT WALL
        </h2>
        <p className="font-mono mt-1 text-sm text-silver">
          Communication Channels
        </p>
        <div className="accent-line mx-auto mt-4 mb-8" />

        {/* Social links */}
        <div className="flex items-center justify-center gap-6">
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] px-6 py-3 text-silver transition-colors duration-200 hover:border-white hover:text-white"
            >
              <Icon className="h-4 w-4" />
              <span className="font-mono text-sm">{label}</span>
            </a>
          ))}
        </div>

        {/* Resume Actions */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="/resume/123CE0125_AyushSinha.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-headline inline-flex items-center gap-2 rounded-full bg-redbull-red px-8 py-3 font-semibold tracking-wide text-white transition-[filter] duration-200 hover:brightness-110"
          >
            <FileDown className="h-4 w-4" />
            View Resume
          </a>
        </div>

        {/* Tagline */}
        <p className="font-mono mt-8 text-xs text-silver">
          Engineered with precision. Built to perform.
        </p>

        {/* Copyright */}
        <p className="font-mono mt-2 text-xs" style={{ color: 'rgba(136, 136, 136, 0.5)' }}>
          © 2025 Ayush. All systems operational.
        </p>
      </section>
    </div>
  );
});

FooterSection.displayName = 'FooterSection';

export default FooterSection;
