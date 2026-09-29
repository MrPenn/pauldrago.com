// The four services in the order the site lists them. The "other decisions" row, the router on
// /financial-services and the header's current-page mark all read from here. routerName is the
// fuller name the router shows, where it differs from the short one.
export const SERVICES = [
  { href: '/marketing-measurement-reset', name: 'Marketing Measurement Reset', question: 'Show what acquisition spend produced after account opening.' },
  { href: '/branch-market-expansion-analysis', name: 'Branch and Market Expansion Analysis', question: 'Compare markets before committing to a branch plan.' },
  { href: '/acquisition-footprint-analysis', name: 'Acquisition and Footprint Analysis', question: 'Test the market case for an acquisition target.' },
  { href: '/fractional-cmo-financial-services', name: 'Fractional CMO', routerName: 'Fractional CMO, Regulated Financial Services', question: 'Add senior marketing leadership without a full-time hire.' },
];
