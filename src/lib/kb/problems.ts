// What a big ticket actually holds: one problem per fix. Builds on causes.ts, and takes the
// reports the desk read as a one-day move (desk-notes.json) out of the cause their tenant gives them.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'move' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, moved: readonly string[]): Problem {
  if (moved.includes(r.id)) return 'move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = { problem: Problem; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

export function groupByProblem(reports: Report[], tenantOf: (r: Report) => Tenant | undefined, moved: readonly string[]): ProblemGroup[] {
  const byProblem = new Map<Problem, Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), moved);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
