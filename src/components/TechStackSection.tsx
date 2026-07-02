'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface TechCard {
  name: string;
  description: string;
  proficiency: number;
}

const frontendStack: TechCard[] = [
  { name: 'React & Next.js', description: 'Component architecture & server-side rendering', proficiency: 92 },
  { name: 'JavaScript & TS', description: 'Type-safe engineering at scale', proficiency: 90 },
  { name: 'Tailwind CSS', description: 'Utility-first styling & design systems', proficiency: 88 },
];

const backendStack: TechCard[] = [
  { name: 'Java & Spring Boot', description: 'Enterprise-grade microservices & REST APIs', proficiency: 90 },
  { name: 'Python', description: 'Machine learning & automation scripting', proficiency: 85 },
  { name: 'SQL & PostgreSQL', description: 'Relational data modeling & optimization', proficiency: 88 },
  { name: 'MongoDB', description: 'NoSQL document storage', proficiency: 80 },
];

function TechCardItem({ tech, index }: { tech: TechCard; index: number }) {
  const isEven = index % 2 === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
      viewport={{ once: false, amount: 0.2 }}
      className="glass-card p-4 relative overflow-hidden group"
    >
      {/* Subtle hover gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(220,0,0,0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <h4 className="font-headline text-lg text-titanium">{tech.name}</h4>
      <p className="mt-1 text-sm text-silver" style={{ fontFamily: 'var(--font-body)' }}>
        {tech.description}
      </p>
      <div className="proficiency-bar mt-3">
        <div
          className="proficiency-bar-fill"
          style={{ width: `${tech.proficiency}%` }}
        />
      </div>
      <span className="font-mono mt-1 inline-block text-xs text-silver">
        {tech.proficiency}%
      </span>
    </motion.div>
  );
}

const TechStackSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="garage-section" id="tech-stack">
      <motion.section 
        initial={{ x: -150, opacity: 0, skewX: -15 }}
        whileInView={{ x: 0, opacity: 1, skewX: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        viewport={{ once: false, amount: 0.1 }}
        className="glass-panel telemetry-grid relative mx-auto max-w-2xl p-5 md:p-8 max-h-[55vh] md:max-h-none overflow-y-auto md:overflow-visible scrollbar-hide"
      >
        {/* Section header */}
        <span className="font-mono text-xs tracking-[0.3em] text-redbull-red">
          SECTION 02
        </span>
        <h2 className="font-headline mt-2 text-3xl font-bold text-titanium">
          THE CAR ARCHITECTURE
        </h2>
        <p className="font-mono mt-1 text-sm text-silver">
          Technical Specification Sheet
        </p>
        <div className="accent-line mt-4 mb-8" />

        {/* Two-column grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Frontend column */}
          <div>
            <h3 className="font-mono mb-4 text-xs tracking-wider text-silver">
              AERODYNAMICS // FRONTEND
            </h3>
            <div className="flex flex-col gap-4">
              {frontendStack.map((tech, i) => (
                <TechCardItem key={tech.name} tech={tech} index={i} />
              ))}
            </div>
          </div>

          {/* Backend column */}
          <div>
            <h3 className="font-mono mb-4 text-xs tracking-wider text-silver">
              ENGINE &amp; TELEMETRY // BACKEND
            </h3>
            <div className="flex flex-col gap-4">
              {backendStack.map((tech, i) => (
                <TechCardItem key={tech.name} tech={tech} index={i + frontendStack.length} />
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
});

TechStackSection.displayName = 'TechStackSection';

export default TechStackSection;
