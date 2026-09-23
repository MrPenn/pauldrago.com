// Scoring for the branch-analysis worked example. Used at build time (the page ships a ranked,
// readable result) and in the browser (readers re-weight the criteria and watch the ranking move).

export type Market = {
  county: string;
  deposits: number;
  depositGrowthPct: number;
  populationGrowthPct: number;
  medianIncome: number;
  householdsPerBranch: number;
  communityShare: number;
  medianCommunityBranch: number;
};

// The hypothetical bank. Its own customer file is the one input that isn't public, so it is
// labelled as illustrative wherever it appears.
export const INSTITUTION = {
  description: 'a $2 billion community bank headquartered in Dallas County, with 12 branches',
  nearbyHouseholds: { Collin: 600, Ellis: 900, Kaufman: 1400 } as Record<string, number>,
};

export const CRITERIA = [
  { key: 'deposits', label: 'Deposit market size', group: 'What the deposit map shows', value: (m: Market) => m.deposits },
  { key: 'income', label: 'Household income', group: 'What the deposit map shows', value: (m: Market) => m.medianIncome },
  { key: 'depositGrowth', label: 'Deposit growth', group: 'What the deposit map shows', value: (m: Market) => m.depositGrowthPct },
  { key: 'populationGrowth', label: 'Population growth', group: 'Where the market is going', value: (m: Market) => m.populationGrowthPct },
  { key: 'room', label: 'Households per branch', group: 'Where the market is going', value: (m: Market) => m.householdsPerBranch },
  { key: 'local', label: 'Community-bank share', group: 'Who wins the deposits', value: (m: Market) => m.communityShare },
  { key: 'branchSize', label: 'Typical community-bank branch', group: 'Who wins the deposits', value: (m: Market) => m.medianCommunityBranch },
  { key: 'customers', label: 'Your customers nearby', group: 'Your institution (illustrative)', value: (m: Market) => INSTITUTION.nearbyHouseholds[m.county] ?? 0 },
] as const;

export type Weights = Record<string, number>;

export const PRESETS: Record<string, { label: string; weights: Weights }> = {
  map: { label: 'What the deposit map shows', weights: { deposits: 5, income: 3, depositGrowth: 2, populationGrowth: 0, room: 0, local: 0, branchSize: 0, customers: 0 } },
  full: { label: 'The full case', weights: { deposits: 2, income: 2, depositGrowth: 2, populationGrowth: 3, room: 3, local: 3, branchSize: 3, customers: 2 } },
};

// Each criterion scores a market against the best of the three (best = 100); the total is the
// weighted average.
export function scoreMarkets(markets: Market[], weights: Weights) {
  const total = CRITERIA.reduce((sum, c) => sum + (weights[c.key] || 0), 0) || 1;
  return markets
    .map((m) => {
      const parts: Record<string, number> = {};
      let score = 0;
      for (const c of CRITERIA) {
        const best = Math.max(...markets.map((x) => c.value(x)));
        parts[c.key] = best > 0 ? Math.round((c.value(m) / best) * 100) : 0;
        score += (weights[c.key] || 0) * (best > 0 ? c.value(m) / best : 0);
      }
      return { county: m.county, score: Math.round((score / total) * 100), parts };
    })
    .sort((a, b) => b.score - a.score);
}
