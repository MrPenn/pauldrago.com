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
  lmiTractsWithoutBranch: number;
  largestBank: string;
  largestBankShare: number;
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

// Launch marketing per new branch, $ thousands, in its first and second year. Published first-year
// budgets run $50K to $150K (Chatter Buzz Media, 2026); the plan uses the high end. New-market
// branches need 18 to 24 months of marketing (ABA Banking Journal, August 2026), so the second year
// carries half again. The second-year figure is our assumption.
export const LAUNCH_MARKETING = [150, 75];

// A faster pace: every town that carries Deposits or Business, opened within three years.
export const AGGRESSIVE = [
  { site: 'Forney', opens: 1 },
  { site: 'Midlothian', opens: 1 },
  { site: 'Crandall', opens: 2 },
  { site: 'Waxahachie', opens: 2 },
  { site: 'Terrell', opens: 3 },
];

type Site = { site: string; opens: number };
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function branchEconomics(ramp: Ramp, rampKey: 'p25' | 'median' | 'p75' = 'median') {
  // Deposits by age: the metro ramp to year 5, then held at the year-5 level (the Dallas-Fort Worth
  // median is $60M at year 5 and $56M at year 7; the Fed puts the 15-year median near $50M).
  const d = [0, ...ramp.byAge.map((a) => a[rampKey])];
  const deposits = (age: number) => d[Math.min(age, d.length - 1)];
  // Margin on the year's average deposits, less the high end of published running cost ($ thousands).
  const operating = (age: number) => ((deposits(age - 1) + deposits(age)) / 2) * ramp.nim * 10 - ramp.branchCost[1];
  const marketing = (age: number) => -(LAUNCH_MARKETING[age - 1] ?? 0);
  return { deposits, operating, marketing };
}

export function runSites(ramp: Ramp, sites: Site[], years: number[], rampKey: 'p25' | 'median' = 'median') {
  const e = branchEconomics(ramp, rampKey);
  const branches = sites.map((b) => ({
    ...b,
    byYear: years.map((y) => {
      const age = y - b.opens + 1;
      return age < 1 ? null : { deposits: e.deposits(age), contribution: e.operating(age), marketing: e.marketing(age) };
    }),
  }));
  const operating = years.map((_, i) => sum(branches.map((b) => b.byYear[i]?.contribution ?? 0)));
  const marketing = years.map((_, i) => sum(branches.map((b) => b.byYear[i]?.marketing ?? 0)));
  const buildOut = years.map((y) => -sites.filter((b) => b.opens === y).length * ramp.buildOut * 1000);
  const cumulative = years.map((_, i) => sum(operating.slice(0, i + 1)) + sum(marketing.slice(0, i + 1)) + sum(buildOut.slice(0, i + 1)));
  const deposits = years.map((_, i) => sum(branches.map((b) => b.byYear[i]?.deposits ?? 0)));
  return { branches, operating, marketing, buildOut, cumulative, deposits };
}

export function planModel(ramp: Ramp) {
  const run = runSites(ramp, [...PLAN], YEARS);
  const median = [0, ...ramp.byAge.map((a) => a.median)];
  return {
    path: (key: 'p25' | 'median' | 'p75') => [0, ...ramp.byAge.map((a) => a[key])],
    expected: run.branches,
    operating: run.operating,
    marketing: run.marketing,
    downside: runSites(ramp, [...PLAN], YEARS, 'p25').operating,
    buildOut: run.buildOut,
    cumulative: run.cumulative,
    totalBuildOut: PLAN.length * ramp.buildOut,
    totalMarketing: PLAN.length * sum(LAUNCH_MARKETING),
    firstPositiveYear: YEARS[run.operating.findIndex((t) => t > 0)],
    medianFourYearAverage: sum([1, 2, 3, 4].map((a) => (median[a - 1] + median[a]) / 2)) / 4,
  };
}

// Two paces over ten years: the plan and the faster plan.
export const HORIZON = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function paceScenarios(ramp: Ramp) {
  const summarize = (label: string, sites: Site[]) => {
    const r = runSites(ramp, sites, HORIZON);
    const payback = r.cumulative.findIndex((c, i) => c >= 0 && i > 0);
    return {
      label,
      sites,
      run: r,
      by5: sites.filter((s) => s.opens <= 5).length,
      by10: sites.length,
      peak: Math.min(...r.cumulative),
      peakYear: HORIZON[r.cumulative.indexOf(Math.min(...r.cumulative))],
      paybackYear: payback === -1 ? null : HORIZON[payback],
      year10: r.operating[9] + r.marketing[9],
      deposits10: r.deposits[9],
    };
  };
  return [
    summarize('The plan', [...PLAN]),
    summarize('Faster', AGGRESSIVE),
  ];
}

// The hypothetical bank's own figures, for the brief's capital, earnings, and return lines. These are
// illustrative inputs, labelled as such wherever they appear.
export const BANK = { tier1: 200_000, pretaxIncome: 25_000, hurdle: 0.1 }; // $ thousands; hurdle is pre-tax

// Pre-tax return on a pace over the ten-year horizon: yearly cash (operating, marketing, build-out)
// plus a terminal value of year-10 earnings held flat, discounted at the hurdle rate.
export function returns(run: ReturnType<typeof runSites>, rate = BANK.hurdle) {
  const flows = run.operating.map((o, i) => o + run.marketing[i] + run.buildOut[i]);
  const last = run.operating[run.operating.length - 1];
  const withTerminal = flows.map((f, i) => (i === flows.length - 1 ? f + last / rate : f));
  const npvAt = (r: number) => withTerminal.reduce((s, f, i) => s + f / (1 + r) ** (i + 1), 0);
  let lo = -0.5, hi = 1;
  for (let k = 0; k < 100; k++) { const mid = (lo + hi) / 2; if (npvAt(mid) > 0) lo = mid; else hi = mid; }
  const npv10 = flows.reduce((s, f, i) => s + f / (1 + rate) ** (i + 1), 0);
  return { npv: npvAt(rate), irr: (lo + hi) / 2, npv10 };
}
