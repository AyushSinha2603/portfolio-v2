'use client';

import { forwardRef } from 'react';

interface TechCard {
  name: string;
  description: string;
  proficiency: number;
}

const frontendStack: TechCard[] = [
  { name: 'React', description: 'Component architecture & state management', proficiency: 95 },
  { name: 'Next.js', description: 'Server-side rendering & app routing', proficiency: 90 },
  { name: 'TypeScript', description: 'Type-safe engineering at scale', proficiency: 92 },
  { name: 'Tailwind CSS', description: 'Utility-first styling & design systems', proficiency: 88 },
];

const backendStack: TechCard[] = [
  { name: 'Java', description: 'Enterprise-grade application development', proficiency: 90 },
  { name: 'Spring Boot', description: 'Microservice architecture & REST APIs', proficiency: 85 },
  { name: 'Python', description: 'Data pipelines & automation scripting', proficiency: 88 },
  { name: 'SQL / PostgreSQL', description: 'Relational data modeling & optimization', proficiency: 85 },
];

function TechCardItem({ tech }: { tech: TechCard }) {
  return (
    <div className="rounded-lg border border-[var(--glass-border)] bg-carbon-light p-4">
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
    </div>
  );
}

const TechStackSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="garage-section" id="tech-stack">
      <section className="glass-panel mx-auto max-w-4xl p-8">
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
              {frontendStack.map((tech) => (
                <TechCardItem key={tech.name} tech={tech} />
              ))}
            </div>
          </div>

          {/* Backend column */}
          <div>
            <h3 className="font-mono mb-4 text-xs tracking-wider text-silver">
              ENGINE &amp; TELEMETRY // BACKEND
            </h3>
            <div className="flex flex-col gap-4">
              {backendStack.map((tech) => (
                <TechCardItem key={tech.name} tech={tech} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

TechStackSection.displayName = 'TechStackSection';

export default TechStackSection;
