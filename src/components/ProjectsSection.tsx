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
    name: 'MailSense AI',
    description: 'AI-powered email assistant integrating Gemini API',
    details:
      'Designed a layered backend architecture focused on secure email processing. Implemented REST APIs for workflow automation, successfully parsing 40+ emails during system evaluation.',
    metrics: [
      { label: 'Latency', value: '<500ms' },
      { label: 'Concurrent Req', value: '100+' },
      { label: 'Stack', value: 'Spring Boot' },
    ],
    tags: ['Java', 'Spring Boot', 'React', 'Gemini API'],
  },
  {
    position: 'P2',
    name: 'Sleepyhead Studios',
    description: 'Official landing platform with dynamic game showcases',
    details:
      'Developed and deployed using Next.js 14 and React 19. Leveraged Server Components to optimize frontend rendering performance and configured custom domains with DNS routing.',
    metrics: [
      { label: 'Scroll', value: 'Lenis' },
      { label: 'Animations', value: 'Framer Motion' },
      { label: 'Version', value: 'Next.js 14' },
    ],
    tags: ['Next.js', 'React', 'Framer Motion', 'Tailwind'],
  },
  {
    position: 'P3',
    name: 'Opening Forge',
    description: 'Chess opening analysis and representation system',
    details:
      'Engineered an optimized data model integrating the complete Lichess ECO dataset. Designed system workflows for FEN-indexed position generation and engine evaluation processing.',
    metrics: [
      { label: 'Openings', value: '3,700+' },
      { label: 'Dataset', value: 'Lichess ECO' },
      { label: 'Index', value: 'FEN-based' },
    ],
    tags: ['System Design', 'Algorithms', 'Data Modeling'],
  },
  {
    position: 'P4',
    name: 'Accident Severity Prediction',
    description: 'Machine learning system for traffic risk assessment',
    details:
      'Trained and evaluated on a robust dataset of real-world traffic records. Performed data cleaning, feature engineering, and exploratory data analysis to develop predictive models.',
    metrics: [
      { label: 'Dataset', value: '300,000+ records' },
      { label: 'Stack', value: 'Python' },
      { label: 'Tools', value: 'Pandas' },
    ],
    tags: ['Machine Learning', 'Python', 'Pandas', 'EDA'],
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
