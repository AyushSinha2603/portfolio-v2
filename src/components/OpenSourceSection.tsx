'use client';

import { forwardRef, useMemo } from 'react';
import { GitBranch, Star, Users } from 'lucide-react';

interface Contribution {
  repo: string;
  description: string;
  stars: string;
  role: 'Contributor' | 'Maintainer';
}

const contributions: Contribution[] = [
  {
    repo: 'lichess-org/chess-openings',
    description:
      'Contributed 2 merged pull requests improving opening classification and transposition mapping for Lichess, one of the largest open-source chess platforms.',
    stars: '1.5K',
    role: 'Contributor',
  },
];

function RoleBadge({ role }: { role: 'Contributor' | 'Maintainer' }) {
  const isContributor = role === 'Contributor';
  return (
    <span
      className="font-mono inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
      style={{
        background: isContributor
          ? 'rgba(27, 20, 100, 0.3)'
          : 'rgba(220, 0, 0, 0.15)',
        border: `1px solid ${isContributor ? 'rgba(27, 20, 100, 0.5)' : 'rgba(220, 0, 0, 0.3)'}`,
        color: isContributor ? '#a5a0ff' : '#ff6b6b',
      }}
    >
      <Users className="h-3 w-3" />
      {role}
    </span>
  );
}

function ContributionCard({ contribution }: { contribution: Contribution }) {
  return (
    <div className="rounded-lg border border-[var(--glass-border)] bg-carbon-light p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 shrink-0 text-silver" />
            <h4 className="font-headline text-lg text-titanium">
              {contribution.repo}
            </h4>
          </div>
          <p className="mt-2 text-sm text-silver" style={{ fontFamily: 'var(--font-body)' }}>
            {contribution.description}
          </p>
        </div>
        <RoleBadge role={contribution.role} />
      </div>

      <div className="mt-3 flex items-center gap-1">
        <Star className="h-3.5 w-3.5 text-yellow-500" />
        <span className="font-mono text-xs text-silver">{contribution.stars}</span>
      </div>
    </div>
  );
}

function ContributionGrid() {
  const rows = 5;
  const cols = 20;

  // Deterministic grid — same on server and client, no hydration mismatch
  const grid = useMemo(() => {
    const opacityLevels = [0, 0, 0.1, 0.1, 0.25, 0.4, 0.7];
    const cells: number[][] = [];
    // Simple seeded pattern based on row/col position
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        // Deterministic pseudo-random using position math
        const seed = (r * 37 + c * 17 + r * c * 7) % opacityLevels.length;
        row.push(opacityLevels[seed]);
      }
      cells.push(row);
    }
    return cells;
  }, []);

  return (
    <div className="mt-8">
      <h4 className="font-mono mb-3 text-xs tracking-wider text-silver">
        CONTRIBUTION TELEMETRY
      </h4>
      <div className="flex flex-col gap-[3px]">
        {grid.map((row, ri) => (
          <div key={ri} className="flex gap-[3px]">
            {row.map((opacity, ci) => (
              <div
                key={ci}
                className="h-3 w-3 rounded-sm"
                style={{
                  background:
                    opacity === 0
                      ? 'rgba(255, 255, 255, 0.04)'
                      : `rgba(34, 197, 94, ${opacity})`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const OpenSourceSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="garage-section" id="open-source">
      <section className="glass-panel mx-auto max-w-2xl p-5 md:p-8 max-h-[55vh] md:max-h-none overflow-y-auto md:overflow-visible scrollbar-hide">
        {/* Section header */}
        <span className="font-mono text-xs tracking-[0.3em] text-redbull-red">
          SECTION 04
        </span>
        <h2 className="font-headline mt-2 text-3xl font-bold text-titanium">
          CONSTRUCTOR COLLABORATIONS
        </h2>
        <p className="font-mono mt-1 text-sm text-silver">
          Open Source Engineering Contributions
        </p>
        <div className="accent-line mt-4 mb-8" />

        {/* Contribution cards */}
        <div className="flex flex-col gap-4">
          {contributions.map((c) => (
            <ContributionCard key={c.repo} contribution={c} />
          ))}
        </div>

        {/* GitHub-style contribution grid */}
        <ContributionGrid />
      </section>
    </div>
  );
});

OpenSourceSection.displayName = 'OpenSourceSection';

export default OpenSourceSection;
