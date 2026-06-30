'use client';

import { forwardRef } from 'react';

interface ProjectMetric {
  label: string;
  value: string;
}

interface Project {
  position: string;
  name: string;
  description: string;
  details: string;
  metrics: ProjectMetric[];
  tags: string[];
}

const projects: Project[] = [
  {
    position: 'P1',
    name: 'Monaco GP // Portfolio Engine',
    description: 'Full-stack web application with 3D rendering pipeline',
    details:
      'Engineered a scroll-driven 3D portfolio with optimized model loading and GSAP-coordinated animations. Strategic resource loading minimizes time-to-interactive.',
    metrics: [
      { label: 'Load Time', value: '<2s' },
      { label: 'Lighthouse', value: '95+' },
      { label: 'Bundle', value: '-40%' },
    ],
    tags: ['React', 'Three.js', 'GSAP', 'Next.js'],
  },
  {
    position: 'P2',
    name: 'Silverstone GP // Data Pipeline Architect',
    description: 'Real-time data processing and analytics platform',
    details:
      'Designed high-throughput microservice architecture processing millions of daily events. Applied strategic resource management principles for optimal system allocation.',
    metrics: [
      { label: 'Throughput', value: '10K req/s' },
      { label: 'Latency', value: '<50ms' },
      { label: 'Uptime', value: '99.9%' },
    ],
    tags: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis'],
  },
  {
    position: 'P3',
    name: 'Suzuka GP // Strategic Resource Manager',
    description: 'Resource optimization and scheduling system',
    details:
      'Built intelligent resource allocation system. Applied macro strategy optimization principles — efficiency through calculated, data-driven decision-making.',
    metrics: [
      { label: 'Efficiency', value: '+35%' },
      { label: 'Cost', value: '-28%' },
      { label: 'Scale', value: '50K users' },
    ],
    tags: ['Python', 'FastAPI', 'SQL', 'Docker'],
  },
];

function PositionBadge({ position }: { position: string }) {
  return (
    <div
      className="font-headline flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
      style={{
        background:
          position === 'P1'
            ? 'linear-gradient(135deg, var(--redbull-red), #a00)'
            : position === 'P2'
              ? 'linear-gradient(135deg, #555, #333)'
              : 'linear-gradient(135deg, #7c5c2e, #4a3518)',
      }}
    >
      {position}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-lg border border-[var(--glass-border)] bg-carbon-light p-6">
      <div className="flex items-start gap-4">
        <PositionBadge position={project.position} />
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-xl font-bold text-titanium">
            {project.name}
          </h3>
          <p className="mt-1 text-sm text-silver" style={{ fontFamily: 'var(--font-body)' }}>
            {project.description}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-silver" style={{ fontFamily: 'var(--font-body)' }}>
        {project.details}
      </p>

      {/* Metrics row */}
      <div className="mt-4 flex flex-wrap gap-6">
        {project.metrics.map((metric) => (
          <div key={metric.label} className="font-mono text-xs">
            <span className="text-silver">{metric.label}: </span>
            <span className="metric-value">{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Tech tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="tech-tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

const ProjectsSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="garage-section" id="projects">
      <section className="glass-panel mx-auto max-w-4xl p-8">
        {/* Section header */}
        <span className="font-mono text-xs tracking-[0.3em] text-redbull-red">
          SECTION 03
        </span>
        <h2 className="font-headline mt-2 text-3xl font-bold text-titanium">
          THE TRACK RECORD
        </h2>
        <p className="font-mono mt-1 text-sm text-silver">
          Completed Grand Prix Results
        </p>
        <div className="accent-line mt-4 mb-8" />

        {/* Project cards */}
        <div className="flex flex-col gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.position} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
});

ProjectsSection.displayName = 'ProjectsSection';

export default ProjectsSection;
