// The five-year branch plan behind the sample deliverable. Candidate towns are tagged by what a
// branch there would do for the bank. Deposits and Business pick the sites; CRA is a check the
// network has to pass, not a reason to pick one. The economics run each branch on the metro's
// measured new-branch ramp (src/data/dfw-markets.json, ramp).

export type Town = {
  town: string;
  county: string;
  deposits: number;
  depositGrowthPct: number;
  branches: number;
  depositsPerBranch: number;
  communityShare: number;
  jobs: number;
  jobGrowthPct: number;
  businesses: number;
  businessGrowthPct: number;
  lmiPopulationShare: number;
  minorityPopulationShare: number;
  lmiTracts: number;
};

// What a branch is for, and the public evidence that a town supports it. Thresholds are stated so
// they can be argued with.
export const TAGS = [
  { key: 'deposits', label: 'Deposits', rule: 'Deposits in town grew 20% or more, 2021 to 2026', test: (t: Town) => t.depositGrowthPct >= 20 },
  { key: 'business', label: 'Business', rule: 'Jobs in town grew 15% or more, 2019 to 2023', test: (t: Town) => t.jobGrowthPct >= 15 },
  { key: 'cra', label: 'CRA', rule: 'A third or more of residents within five miles live in low- or moderate-income tracts', test: (t: Town) => t.lmiPopulationShare >= 33 },
] as const;

export const tagsFor = (t: Town) => TAGS.filter((tag) => tag.test(t)).map((tag) => tag.key);
export const PICKING_TAGS = ['deposits', 'business'];

export type Ramp = {
  branchCost: number[];
  nim: number;
  buildOut: number;
  byAge: { age: number; p25: number; median: number; p75: number }[];
};

// Each branch opens at the start of its plan year and follows a ramp from the metro data.
export const PLAN = [
  { site: 'Forney', opens: 1, ramp: 'median' },
  { site: 'Midlothian', opens: 2, ramp: 'median' },
  { site: 'Crandall', opens: 3, ramp: 'median' },
] as const;

// Decided at the year 5 review, on how the first three branches ramp.
export const REVIEW_SITES = ['Terrell', 'Waxahachie'];

export const YEARS = [1, 2, 3, 4, 5];

export function planModel(ramp: Ramp) {
  const path = (key: 'p25' | 'median' | 'p75') => [0, ...ramp.byAge.map((a) => a[key])];
  // Margin on the year's average deposits, less the high end of published running cost ($ thousands).
  const contribution = (avgDeposits: number) => avgDeposits * ramp.nim * 10 - ramp.branchCost[1];
  const run = (rampFor: (b: (typeof PLAN)[number]) => 'p25' | 'median') => PLAN.map((b) => {
    const d = path(rampFor(b));
    return {
      ...b,
      byYear: YEARS.map((y) => {
        const age = y - b.opens + 1;
        return age < 1 ? null : { deposits: d[age], contribution: contribution((d[age - 1] + d[age]) / 2) };
      }),
    };
  });
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const totals = (m: ReturnType<typeof run>) => YEARS.map((_, i) => sum(m.map((b) => b.byYear[i]?.contribution ?? 0)));
  const expected = run((b) => b.ramp);
  const downside = run(() => 'p25');
  const operating = totals(expected);
  const buildOut = YEARS.map((y) => -PLAN.filter((b) => b.opens === y).length * ramp.buildOut * 1000);
  const cumulative = YEARS.map((_, i) => sum(operating.slice(0, i + 1)) + sum(buildOut.slice(0, i + 1)));
  const median = path('median');
  return {
    path,
    expected,
    operating,
    downside: totals(downside),
    buildOut,
    cumulative,
    totalBuildOut: PLAN.length * ramp.buildOut,
    firstPositiveYear: YEARS[operating.findIndex((t) => t > 0)],
    medianFourYearAverage: sum([1, 2, 3, 4].map((a) => (median[a - 1] + median[a]) / 2)) / 4,
  };
}
