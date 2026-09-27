// The article kit's component registry: what each piece is, when to use it, and the HTML to paste.
// The reference article is "The Digital Front Door Nobody Walks Through"; every example is its
// published text. /ui renders each story in an isolated frame and prints the same string as the
// snippet, so the example and the code cannot disagree. The linter reads `classes` and `status`.
//
// level:  atom | molecule | organism | template (Brad Frost's atomic design)
// status: template  - the article template renders it; write front matter or markdown, not HTML
//         shared    - use in any article
//         signature - a device that identifies one piece; see SIGNATURE_DEVICES and the spacing rule
// stories[].wrap: body (inside .article-body, the default) | article (inside the article column,
//         outside the body) | page (the story is the whole article)
// stories[].motion: the frame's toolbar gets a Replay button; stories[].steps: step buttons.
import { stack, cols, units, grid, record, asof } from './build.mjs';

const BOOKING = 'https://cal.com/pauldrago/20-min-intro-call';
const CAL = 'data-cal-link="pauldrago/20-min-intro-call" data-cal-namespace="20-min-intro-call" data-cal-config=\'{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"auto"}\'';
export const REFERENCE = { slug: 'the-digital-front-door-nobody-walks-through', title: 'The Digital Front Door Nobody Walks Through' };

// One primary checking customer, one year: the front door's first pinned sequence.
const customer = (first) => ({
  eyebrow: 'One primary checking customer, one year',
  num: '$5,400',
  sub: 'median transaction balance, under 35',
  bars: [
    { name: 'A community bank, under $10B', at: first, segs: [{ word: 'spread', value: 206, at: first }, { word: 'interchange', value: 212, accent: true, at: first + 1 }], mark: { value: 350, label: '$350 to acquire', at: first + 2 } },
    { name: 'The same customer at a bank over $10B', at: first + 3, segs: [{ word: 'spread', value: 206, at: first + 3 }, { word: 'interchange', value: 95, accent: true, at: first + 3 }] },
  ],
  ledger: [
    { label: 'Deposit spread', sub: '$5,400 x 3.81% net interest margin', value: 206, at: first },
    { label: 'Interchange, gross', sub: '34.6 transactions a month x 12 x $0.51', value: 212, at: first + 1 },
    { label: 'A year of checking, before any loan', value: 418, total: true, at: first + 1 },
  ],
  note: 'Against a <strong>$350</strong> acquisition cost, that pays back in <strong>11 months</strong>.',
  noteAt: first + 2,
});
export const STACK_DEMO = {
  eyebrow: 'One primary checking customer, one year',
  num: '$5,400',
  sub: 'median transaction balance, under 35',
  bars: [{ name: 'A community bank, under $10B', at: 1, segs: [{ word: 'spread', value: 206, at: 1 }, { word: 'interchange', value: 212, accent: true, at: 2 }], mark: { value: 350, label: '$350 to acquire', at: 3 } }],
  ledger: [
    { label: 'Deposit spread', sub: '$5,400 x 3.81% net interest margin', value: 206, at: 1 },
    { label: 'Interchange, gross', sub: '34.6 transactions a month x 12 x $0.51', value: 212, at: 2 },
    { label: 'A year of checking, before any loan', value: 418, total: true, at: 2 },
  ],
};

// The fifteen-year wait: $400 a year from 25 to 39, and a $973 mortgage at 40.
export const COLS_DEMO = {
  eyebrow: 'The fifteen-year wait',
  values: Array.from({ length: 15 }, (_, i) => 400 * (i + 1)),
  start: 25,
  labelEvery: 5,
  prefix: '$',
  ticks: [0, 2000, 4000, 6000],
  max: 6000,
  event: { value: 973, label: '$973', sub: 'the mortgage', marker: 'Median first-time buyer' },
  total: { label: '$6,000 of checking', sub: 'gross, at $400 a year' },
};

export const UNITS_DEMO = { num: '95%', label: "of consumers rate their bank's online and mobile experience good, very good or excellent.", value: 19, of: 20, source: 'ABA and Morning Consult, 2025 Preferred Banking Methods survey, 4,403 U.S. adults.' };

// The front door's own sources for its two number sequences, rendered as the site's markdown renders
// footnotes, so the kit can move each one under the pinned graphic with its step.
const NOTES = {
  3: '<strong>Federal Reserve Board.</strong> 2022 Survey of Consumer Finances, Historic Tables, Table 6, family holdings of financial assets by age of reference person. Median transaction account holdings for families under 35 that hold such an account: $5,400 (mean $20,536). Transaction accounts include checking, savings, money market and call accounts, so the checking-only balance is lower and the figure here is generous to the bank. <a href="https://www.federalreserve.gov/econres/scfindex.htm">SCF index and tables</a>',
  4: '<strong>FDIC.</strong> Quarterly Banking Profile, Second Quarter 2026, released August 25, 2026. Community bank net interest margin 3.81%; industry NIM 3.32%. Applying NIM to a noninterest-bearing checking balance understates its value, since that balance costs the bank close to nothing to fund. <a href="https://www.fdic.gov/quarterly-banking-profile/quarterly-banking-profile-second-quarter-2026.pdf">Read the QBP</a>',
  5: '<strong>Federal Reserve Board.</strong> Regulation II, Average Debit Card Interchange Fee by Payment Card Network, 2024 data, published December 19, 2025. All-network average per transaction: $0.51 for exempt issuers, $0.23 for covered issuers. Interchange is gross revenue; network fees and processing costs come out of it. <a href="https://www.federalreserve.gov/paymentsystems/regii-average-interchange-fee.htm">Fed Regulation II data</a>',
  6: '<strong>PULSE.</strong> 2024 Debit Issuer Study (2023 data), as reported by ABA Banking Journal, August 9, 2024. Active cardholders completed 34.6 debit transactions per month. Not age-specific. <a href="https://bankingjournal.aba.com/2024/08/survey-debit-card-use-grew-in-2023/">ABA Banking Journal summary</a>',
  7: '<strong>Digital Onboarding, via The Financial Brand.</strong> May 28, 2021: banks and credit unions invest $350 or more to acquire a single checking account. A 2021 figure. <a href="https://thefinancialbrand.com/news/checking-accounts/how-to-maximize-checking-account-activation-rates-115242">Financial Brand article</a>',
  9: '<strong>National Association of Realtors.</strong> 2025 Profile of Home Buyers and Sellers, November 4, 2025. Median age of first-time homebuyers: 40, up from 38 the prior year. <a href="https://www.nar.realtor/press-releases/first-time-home-buyer-share-falls-to-historic-low-of-21-median-age-rises-to-40">NAR release</a>',
  10: '<strong>Mortgage Bankers Association.</strong> Quarterly Mortgage Bankers Performance Report, Second Quarter 2026, released August 18, 2026. Net production income of $973 per loan for independent mortgage banks and mortgage subsidiaries of chartered banks. <a href="https://www.mba.org/news-and-research/newsroom/news/2026/08/18/imbs-production-profits-increase-in-second-quarter-of-2026">MBA release</a>',
};
const ref = (n) => `<sup><a href="#user-content-fn-${n}" id="user-content-fnref-${n}" data-footnote-ref aria-describedby="footnote-label">${n}</a></sup>`;
const notesHtml = (ns) => `<section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2>\n<ol>\n${ns.map((n) => `<li id="user-content-fn-${n}"><p>${NOTES[n]} <a href="#user-content-fnref-${n}" data-footnote-backref class="data-footnote-backref" aria-label="Back to reference ${n}">&#8617;</a></p></li>`).join('\n')}\n</ol>\n</section>`;
const notesMd = (ns) => ns.map((n) => `[^${n}]: ${NOTES[n].replace(/<strong>(.*?)<\/strong>/, '**$1**').replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '[$2]($1)')}`).join('\n');

// Steps are [html, markdown] pairs; {n} marks where a footnote is cited.
const STEPS = [
  'The public numbers do not support that. The Fed\'s Survey of Consumer Finances puts the median transaction account balance for households under 35 at $5,400.{3}',
  'Community banks earned a 3.81% net interest margin in the second quarter of 2026,{4} which makes that balance worth a little over $200 a year in spread before the customer does anything else.',
  'Then the debit card. Banks under $10 billion in assets are exempt from the Durbin interchange cap, and the Fed\'s Regulation II data shows exempt issuers earning an average of $0.51 per debit transaction against $0.23 for covered banks.{5} At the 34.6 transactions a month PULSE measured for an active debit card,{6} that is roughly another $200 a year.',
  'Call it a little over $400 a year from a primary checking account alone, before a single loan. That covers a typical checking acquisition cost of around $350 in the first year.{7}',
  // slop-ok: tacked-on-tail-clause (published text from the reference article)
  'Chime\'s partner banks are small enough to have the exemption too, and it is most of how Chime makes money.',
];
const WAIT_STEPS = [
  'Which makes the standard pitch worse than distant. The median first-time homebuyer is now 40 years old.{9}',
  'A bank that tells a 25-year-old "we\'ll be there when you buy a house" is proposing a fifteen-year wait.',
  'And when that mortgage finally arrives, independent mortgage banks earned $973 per loan on it in the second quarter of 2026.{10}',
  'Banks are deferring a customer worth $400 a year for fifteen years so they can compete on rate, against Rocket, for a $973 event.',
];
const stepHtml = (t) => t.replace(/\{(\d+)\}/g, (_, n) => ref(n));
const stepMd = (t) => t.replace(/\{(\d+)\}/g, '[^$1]');
const citedIn = (steps) => [...new Set(steps.flatMap((t) => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]))))];
const sequence = ({ label, steps, graphic }, markdown) => [
  `<section class="pd-scrolly" data-pd="scrolly" data-rail="block" aria-label="${label}">`,
  '<div class="pd-steps">',
  ...steps.map((t, i) => (markdown ? `<div class="pd-step" data-step="${i + 1}">\n\n${stepMd(t)}\n\n</div>` : `<div class="pd-step" data-step="${i + 1}">\n<p>${stepHtml(t)}</p>\n</div>`)),
  '</div>',
  '<div class="pd-sticky">',
  '<div class="pd-graphic">',
  graphic,
  '</div>',
  '<div class="pd-sticky-notes"></div>',
  '</div>',
  '</section>',
  markdown ? `\n${notesMd(citedIn(steps))}` : notesHtml(citedIn(steps)),
].join('\n');
const MATH = { label: 'What one primary checking customer is worth in a year', steps: STEPS, graphic: stack({ ...customer(2), graphic: true }) };
const WAIT = { label: 'The fifteen-year wait', steps: WAIT_STEPS, graphic: cols({ ...COLS_DEMO, graphic: true }) };

// Twelve functions, one bank: the front door's third sequence.
const ORG = [['Marketing', 'owns the brand'], ['Digital', 'owns the app'], ['Retail', 'owns the branches'], ['Deposit Product', 'owns checking'], ['Cards', 'manages debit'], ['Consumer Lending', 'owns loans'], ['Mortgage', 'owns mortgages'], ['Operations', 'handles servicing'], ['IT', 'manages vendors'], ['Finance', 'pricing and margin'], ['Risk', 'sets the limits'], ['Compliance', 'sets the boundaries']];
const foldGraphic = [
  '<p class="pd-eyebrow pd-fold-cap" data-at="1" data-until="1">Twelve functions, every one on target</p>',
  '<p class="pd-eyebrow pd-fold-cap" data-at="2">What the customer sees</p>',
  '<div class="pd-fold" data-at="2">',
  '  <div class="pd-org">',
  ...ORG.map(([n, o]) => `    <div class="pd-org-box"><span class="pd-org-name">${n}</span><span class="pd-org-owns">${o}</span><span class="label pd-org-status">on target</span></div>`),
  '  </div>',
  '  <div class="pd-one">',
  '    <picture>',
  '      <source srcset="/assets/one-coat-dark.webp" type="image/webp" media="(prefers-color-scheme: dark)">',
  '      <img src="/assets/one-coat.png" width="883" height="1020" loading="lazy" alt="One long overcoat with a bank crest, many arms doing different things, and twelve pairs of legs in twelve kinds of shoes beneath the hem.">',
  '    </picture>',
  '    <p class="pd-one-cap">One bank on the outside. Twelve departments inside, each walking its own way.</p>',
  '  </div>',
  '</div>',
].join('\n');
const ORG_STEPS = [
  'Digital can deliver a respectable app while Retail provides excellent branch service. Marketing can run an effective campaign, Deposit Product can price competitive checking and Lending can meet its production goals.',
  '<p class="pd-pull">The customer experiences one bank while the organization manages twelve functions.</p>',
];
const orgSequence = (markdown) => [
  '<section class="pd-scrolly" data-pd="scrolly" data-rail="block" aria-label="Twelve functions, one bank">',
  '<div class="pd-steps">',
  `<div class="pd-step" data-step="1">\n${markdown ? `\n${ORG_STEPS[0]}\n` : `<p>${ORG_STEPS[0]}</p>`}\n</div>`,
  `<div class="pd-step" data-step="2">\n${markdown ? '\n' : ''}${ORG_STEPS[1]}${markdown ? '\n' : ''}\n</div>`,
  '</div>',
  '<div class="pd-sticky">',
  '<div class="pd-graphic">',
  foldGraphic,
  '</div>',
  '</div>',
  '</section>',
].join('\n');

const OPENER = {
  variant: 'opener', total: 100, on: 44, alt: 4,
  label: 'Of 100 new checking accounts opened in 2024, 44 went to digital banks and fintechs and 4 went to community banks.',
  legend: [
    { num: 44, label: 'of every 100 new checking accounts opened in 2024 went to digital banks and fintechs', kind: 'on' },
    { num: 4, label: 'went to community banks', kind: 'alt' },
    { num: 52, label: 'went to everyone else', kind: '' },
  ],
  source: 'Cornerstone Advisors, <a href="https://www.crnrstone.com/hubfs/Cornerstone-Advisors-2025-Research-Recap_Beyond-the-Paycheck-Motel.pdf">Beyond the Paycheck Motel</a>, 2025 research recap, Figure 6. New checking accounts across all ages; community banks defined as institutions under $100 billion in assets.',
};
export const GRID_DEMO = OPENER;
// The same 2024 shares as bars: one bar each, printed in percent.
export const SHARES_DEMO = {
  eyebrow: 'Where new checking accounts went, 2024',
  prefix: '',
  suffix: '%',
  max: 100,
  bars: [
    { name: 'Digital banks and fintechs', at: 1, segs: [{ value: 44, at: 1 }] },
    { name: 'Community banks', at: 2, segs: [{ value: 4, accent: true, at: 2 }] },
    { name: 'Everyone else', at: 3, segs: [{ value: 52, at: 3 }] },
  ],
  caption: 'Cornerstone Advisors, Beyond the Paycheck Motel, 2025 research recap. New checking accounts across all ages.',
};
const CALLBACK = { variant: 'callback', total: 100, on: 0, alt: 4, altFrom: 44, caption: 'Four of every 100 new checking accounts went to community banks.' };

const calcHtml = `<figure class="pd-figure pd-calc" data-pd="calc" data-rail="block" data-define="spread = bal * nim / 100; ic = txn * 12 * fee; total = round(spread) + round(ic); months = cac / (total / 12); scale = max(total, cac) * 1.12">
  <div class="pd-calc-head">
    <p class="pd-calc-title">Run your bank's numbers</p>
    <p class="pd-calc-lede">The five fields hold the public figures from the sequence above. Type over any of them and everything below the line recalculates.</p>
  </div>
  <div class="pd-calc-inputs">
    <label class="pd-field"><span class="label">Average checking balance</span><span class="pd-input-wrap"><span class="pd-affix">$</span><input class="pd-input" data-var="bal" type="number" inputmode="decimal" value="5400" min="0" step="100"></span><span class="pd-field-src">SCF median, under 35</span></label>
    <label class="pd-field"><span class="label">Net interest margin</span><span class="pd-input-wrap"><input class="pd-input" data-var="nim" type="number" inputmode="decimal" value="3.81" min="0" step="0.01"><span class="pd-affix">%</span></span><span class="pd-field-src">FDIC, community banks, Q2 2026</span></label>
    <label class="pd-field"><span class="label">Debit transactions a month</span><span class="pd-input-wrap"><input class="pd-input" data-var="txn" type="number" inputmode="decimal" value="34.6" min="0" step="0.1"></span><span class="pd-field-src">PULSE, active cards</span></label>
    <label class="pd-field"><span class="label">Interchange per transaction</span><span class="pd-input-wrap"><span class="pd-affix">$</span><input class="pd-input" data-var="fee" type="number" inputmode="decimal" value="0.51" min="0" step="0.01"></span><span class="pd-field-src">Fed Reg II, exempt issuers</span></label>
    <label class="pd-field"><span class="label">Cost to acquire one account</span><span class="pd-input-wrap"><span class="pd-affix">$</span><input class="pd-input" data-var="cac" type="number" inputmode="decimal" value="350" min="0" step="10"></span><span class="pd-field-src">Digital Onboarding, 2021</span></label>
  </div>
  <div class="pd-calc-row">
    <div>
      <p class="label">Interchange regime</p>
      <div class="pd-toggle" role="group" aria-label="Interchange regime">
        <button type="button" class="label pd-toggle-btn is-on" data-set="fee=0.51" aria-pressed="true">Under $10B, exempt ($0.51)</button>
        <button type="button" class="label pd-toggle-btn" data-set="fee=0.23" aria-pressed="false">Over $10B, capped ($0.23)</button>
      </div>
    </div>
    <button type="button" class="pd-text-btn" data-reset hidden>Reset to the public figures</button>
  </div>
  <div class="pd-bar" data-scale="scale" aria-hidden="true">
    <div class="pd-stack-track">
      <div class="pd-seg" data-w="spread"></div>
      <div class="pd-seg is-accent" data-w="ic"></div>
      <div class="pd-mark" data-x="cac"><span class="label">acquisition cost</span></div>
    </div>
    <p class="pd-key"><span><i class="pd-swatch is-ink"></i>Deposit spread</span><span><i class="pd-swatch is-accent"></i>Interchange</span></p>
  </div>
  <div class="pd-ledger">
    <div class="pd-ledger-row"><span class="pd-ledger-label">Deposit spread <span class="pd-ledger-src">balance x NIM</span></span><span class="pd-num pd-ledger-value" data-out="spread" data-format="money">$206</span></div>
    <div class="pd-ledger-row"><span class="pd-ledger-label">Interchange, gross <span class="pd-ledger-src">transactions x 12 x fee</span></span><span class="pd-num pd-ledger-value" data-out="ic" data-format="money">$212</span></div>
    <div class="pd-ledger-row pd-ledger-total"><span class="pd-ledger-label">A year of checking, before any loan</span><span class="pd-num is-l pd-ledger-value" data-out="total" data-format="money" aria-live="polite">$418</span></div>
    <div class="pd-ledger-row"><span class="pd-ledger-label">Payback on the acquisition cost</span><span class="pd-num pd-ledger-value" data-out="months" data-format="months" aria-live="polite">11 months</span></div>
  </div>
  <figcaption>Gross figures, before servicing, fraud and network costs. Switch the interchange regime to see what the same customer is worth at a bank over $10 billion.</figcaption>
</figure>`;

// The same calculator with two fields in the fold, for the story that shows it.
const FOLD_FIELDS = ['fee', 'cac'];
const foldLines = calcHtml.split('\n').filter((l) => FOLD_FIELDS.some((v) => l.includes(`data-var="${v}"`)));
const calcFoldHtml = calcHtml
  .split('\n').filter((l) => !foldLines.includes(l)).join('\n')
  .replace('The five fields hold the public figures from the sequence above.', 'The three fields hold the public figures from the sequence above, and the other two sit in the fold.')
  .replace('  <div class="pd-calc-row">', [
    '  <details class="pd-calc-more">',
    '    <summary>Change the other 2 numbers</summary>',
    '    <div class="pd-calc-inputs is-more">',
    '      <p class="label">Interchange and acquisition</p>',
    ...foldLines.map((l) => `    ${l}`),
    '    </div>',
    '  </details>',
    '  <div class="pd-calc-row">',
  ].join('\n'));

// The H2C fine from "Your Content Has No Parent".
export const RECORD_DEMO = {
  num: '$250,000',
  lead: 'FINRA fined H2C Securities for failing to preserve 1.25 million communications, mostly mass marketing emails.',
  quote: 'preserved at least one copy of many of the mass marketing communications, but it did not preserve a copy of each message sent to each recipient',
  source: 'FINRA Letter of Acceptance, Waiver and Consent, H2C Securities, March 2024.',
};

// The example disclosure from "Your Content Has No Parent": invented rates, a real question.
export const ASOF_DEMO = {
  eyebrow: 'What rendered on a given day',
  question: 'The customer saw the rate disclosure on',
  slider: 'Day the customer saw the disclosure',
  start: '2026-01-05',
  end: '2026-06-30',
  day: '2026-03-14',
  versions: [
    { from: '2026-01-05', to: '2026-02-26', band: '4.10%', copy: 'Earn 4.10% APY. $500 minimum to open. Rate may change after the account is opened.', meta: 'Version 1, live January 5 to February 26. Approved by deposit compliance.' },
    { from: '2026-02-27', to: '2026-04-02', band: '4.25%', copy: 'Earn 4.25% APY. $500 minimum to open. Rate may change after the account is opened.', meta: 'Version 2, live February 27 to April 2. Approved by deposit compliance.' },
    { from: '2026-04-03', to: '2026-05-20', band: '4.00%', copy: 'Earn 4.00% APY through June 30. $500 minimum to open. Rate may change after the account is opened.', meta: 'Version 3, live April 3 to May 20. Approved by deposit compliance.' },
    { from: '2026-05-21', band: '3.85%', copy: 'Earn 3.85% APY. $1,000 minimum to open. Rate may change after the account is opened.', meta: 'Version 4, live May 21 to today. Approved by deposit compliance.' },
  ],
  live: { label: 'A system that keeps every version', verdict: 'This is what the customer saw.' },
  latest: { label: 'A system that keeps only the current version', meta: 'Version 4, the one published today.', right: 'Correct, because the version you picked is still live.', wrong: 'Not what the customer saw.' },
  caption: 'An example disclosure for an example year. The rates, dates and versions are invented; the question is the one the rules ask.',
  label: 'An example rate disclosure with four versions. On March 14 the customer saw version 2, at 4.25% APY; a system that keeps only the current version answers with version 4, at 3.85%.',
};

// The layout grid, drawn with the real containers so it is true at whatever width the frame is.
const GRID_HTML = `<div class="ui-grid">
  <p class="ui-grid-now">At this width: <strong class="ui-grid-bp"></strong></p>
  <div class="container ui-grid-band ui-grid-site"><span class="ui-grid-tag">Page container: 1240px, gutters 32px (20px below 760)</span></div>
  <div class="article">
    <div class="container ui-grid-band ui-grid-art">
      <span class="ui-grid-tag">Article container: 1060px</span>
      <div class="article-body ui-grid-band ui-grid-col">
        <span class="ui-grid-tag">Reading column: 62 characters. Kit components answer to this width.</span>
        <p class="ui-grid-compact">The column is under 560px, so kit components here take their compact form.</p>
        <div class="ui-grid-band ui-grid-wide"><span class="ui-grid-tag">A calculator: the column, then the article container at 1040 and up</span></div>
        <div class="ui-grid-rail"><span class="ui-grid-tag">Source notes: 1180 and up</span></div>
      </div>
    </div>
  </div>
</div>`;

// The type scale: every font size on the site, and what each step is for. The sizes live in
// site-shell.css as --step--2 to --step-10; a test holds this list to them. Body text is step 0,
// and each step is 1.2 times the one below it, rounded to the pixel.
export const TYPE_SCALE = [
  { step: -2, px: 14, face: 'sans', sample: 'Labels, captions and sources', roles: 'Labels, captions, sources and notes; the text in bars, axes and tables; footnote markers. Nothing on the site is smaller.' },
  { step: -1, px: 17, face: 'sans', sample: 'Ledger lines, legends and the calculator lede', roles: 'Body text on phones and site text; ledger lines, legends, dialogue, the decisions, the short version and the calculator lede.' },
  { step: 0, px: 20, face: 'serif', sample: 'Body text, the size everything else is measured from', roles: 'Body text, the deck, the sentence beside a figure\'s number and the booking line. The lede, subheads and pull quotes on phones.' },
  { step: 1, px: 24, face: 'serif', sample: 'The lede and subheads', roles: 'The lede, subheads and the article intro. Section headings and pull quotes below 1040. A calculator\'s title and inputs. A number beside a label.' },
  { step: 2, px: 29, face: 'display', sample: 'Section headings', roles: 'Section headings and pull quotes from 1040. A number in a row.' },
  { step: 3, px: 35, face: 'display', sample: 'The title on a phone', roles: 'The article title on phones.' },
  { step: 4, px: 41, face: 'display', sample: '$1,800', roles: 'The article title from 760. A total or a count. The number a figure leads with, in a narrow column.' },
  { step: 5, px: 50, face: 'display', sample: 'Title', roles: 'The article title from 1040.' },
  { step: 6, px: 60, face: 'display', sample: '$5,400', roles: 'The article title from 1180. The number a figure leads with. The drop cap and the pull quote mark on phones.' },
  { step: 7, px: 72, face: 'display', sample: '72', roles: 'Not in articles. Kept for service page headlines, which move onto the scale next.' },
  { step: 8, px: 86, face: 'display', sample: '86', roles: 'The drop cap.' },
  { step: 9, px: 103, face: 'display', sample: '103', roles: 'Not in articles. Kept for service page headlines.' },
  { step: 10, px: 124, face: 'serif', sample: '“', roles: 'The pull quote\'s opening mark.' },
];
export const stepName = (n) => `--step-${n < 0 ? '-' + Math.abs(n) : n}`;
const stepClass = (n) => `ui-step-${n < 0 ? 'm' + Math.abs(n) : n}`;
// Every step at its size, in the face its main role uses.
const SCALE_HTML = `<div class="ui-scale">\n${TYPE_SCALE.map((t) => `  <div class="ui-scale-row"><span class="label">Step ${t.step < 0 ? '−' + Math.abs(t.step) : t.step}, ${t.px}px</span><span class="ui-scale-sample ui-scale-${t.face} ${stepClass(t.step)}">${t.sample}</span></div>`).join('\n')}\n</div>`;

// The layout grid. The page changes layout at four widths, and nowhere else; the linter holds every
// media query to them. Components answer to the column they sit in (container queries), so their
// own switch points are widths of the column, not the screen.
export const BREAKPOINTS = [
  { px: 480, name: 'Small phone', changes: 'The service pages take their smallest headlines and paddings, and small two-up blocks stack. Most pages need nothing here.' },
  { px: 760, name: 'Phone to tablet', changes: 'The main switch. Below it the page is one column, article type steps down, and a site ledger becomes labeled cards. From it two columns sit side by side, short items go three or four across, and a tool keeps its controls beside its result.' },
  { px: 1040, name: 'Tablet to desktop', changes: 'Heroes with a diagram go to two columns, and rows of three led by a big headline (the service rows) go side by side. The calculator widens past the article column.' },
  { px: 1180, name: 'Wide', changes: 'The article gains its source-notes rail, and pinned charts sit beside their steps instead of above them.' },
];
export const COLUMN_BREAKPOINTS = [
  { px: 560, name: 'Narrow column', changes: 'Under it, kit components take their compact form: stacked answers, smaller numbers. A calculator this narrow sets its fields two across, and three across from 560.' },
  { px: 900, name: 'Wide calculator', changes: 'A calculator this wide sets all its main fields in one row.' },
];

export const LEVELS = [
  { id: 'atom', name: 'Atoms', about: 'The smallest parts: the type scale, a label, a number, a swatch, a bar segment, a button.' },
  { id: 'molecule', name: 'Molecules', about: 'Atoms that work as a unit: a number head, a bar row, a ledger, a field, a pull quote.' },
  { id: 'organism', name: 'Organisms', about: 'Whole figures and page sections, built from atoms and molecules: a stacked bar, a calculator, a pinned sequence, the site header.' },
  { id: 'template', name: 'Templates', about: 'The article page the template assembles around the markdown.' },
];

export const STATUSES = [
  { id: 'template', name: 'Template', about: 'The article template renders it on every article. You write front matter or markdown, never its HTML.' },
  { id: 'shared', name: 'Shared', about: 'Use it in any article, as often as the argument needs it.' },
  { id: 'signature', name: 'Signature', about: 'A device that identifies one piece. Never in consecutive articles, and a month or more apart.' },
];

export const COMPONENTS = [
  // ---------------------------------------------------------------- Atoms
  {
    id: 'type-scale',
    name: 'Type scale',
    level: 'atom',
    status: 'shared',
    summary: 'Thirteen font sizes and no others. Body text is step 0 at 20px, each step is 1.2 times the one below it, and 14px is the smallest text anywhere.',
    use: ['Every font size in every stylesheet: `font-size: var(--step-1);`', 'Sizing something new: find its role on the scale and take that step.'],
    avoid: ['A size between steps, a clamp(), or anything under 14px. The linter rejects all three (type-scale).', 'Neighbouring steps for two things the reader has to tell apart. Skip a step, or change the face or the weight.'],
    rules: [
      'The steps are 14, 17, 20, 24, 29, 35, 41, 50, 60, 72, 86, 103 and 124px, named `--step--2` to `--step-10` in site-shell.css.',
      'Step −2, 14px, is the floor: labels, captions, sources and notes all sit there.',
      'Below 760, body text, the deck, the lede, subheads and pull quotes each take the step below: body text is 17px on a phone.',
      'Section headings and pull quotes move up a step at 1040. The article title climbs one step at each breakpoint: 35, then 41 at 760, 50 at 1040 and 60 at 1180.',
      'A size changes only at a breakpoint, so it is a step at every width.',
      'Numbers in the display face use four steps: 24, 29, 41 and 60. See Number.',
    ],
    a11y: ['Body text is never under 17px, and nothing is under 14px.', 'Each step is 20% larger than the one below, so neighbouring roles differ at a glance.'],
    classes: [],
    lint: ['type-scale'],
    stories: [{ id: 'steps', name: 'Every step, in the face its main role uses', html: SCALE_HTML }],
  },
  {
    id: 'body-text',
    name: 'Body text',
    level: 'atom',
    status: 'shared',
    summary: 'Source Serif 4 at 20px, step 0 of the type scale, on a 62-character measure, with old-style numerals and links underlined in the accent. 17px on phones.',
    use: ['Everything the reader reads straight through.'],
    avoid: ['Links on words like "here". The link text says where it goes.'],
    rules: ['Paragraphs are markdown. Raw HTML is for figures.', 'Footnote markers go after the punctuation: `across all ages.[^1]`', 'Straight quotes in the source; the build curls them.'],
    a11y: ['Body text holds 15.7 to 1 contrast in light mode and 15.5 to 1 in dark.'],
    classes: [],
    lint: ['link-text'],
    stories: [{
      id: 'paragraph',
      name: 'A paragraph with sources',
      html: `<p>Digital banks and fintechs took 44 of every 100 checking accounts opened in 2024. Community banks took 4, by Cornerstone Advisors' estimate, across all ages.<sup><a href="#fn-1" data-footnote-ref>1</a></sup> Younger customers did go digital: 63% of Gen Z respondents in the American Bankers Association's 2025 survey used mobile banking most often, and 3% used branches.<sup><a href="#fn-2" data-footnote-ref>2</a></sup></p>`,
      code: `Digital banks and fintechs took 44 of every 100 checking accounts opened in 2024. Community banks took 4, by Cornerstone Advisors' estimate, across all ages.[^1] Younger customers did go digital: 63% of Gen Z respondents in the American Bankers Association's 2025 survey used mobile banking most often, and 3% used branches.[^2]`,
      lang: 'markdown',
    }],
  },
  {
    id: 'lede',
    name: 'Lede',
    level: 'atom',
    status: 'template',
    summary: 'The first plain paragraph of the body, set larger with a drop cap in the accent.',
    use: ['Automatic: the template marks the first paragraph that has no class.'],
    avoid: ['Opening on a figure or a heading. The piece starts with a sentence.'],
    rules: ['The opening paragraph states the situation the piece starts from, in two or three sentences.'],
    a11y: ['The drop cap is a style on the first letter; the text reads normally.'],
    classes: ['article-lede'],
    lint: [],
    stories: [{
      id: 'opening',
      name: 'The opening paragraph',
      html: `<p class="article-lede">For most of a decade, community banks heard the same prescription. Make account opening digital. Put the bank in the customer's pocket. Add mobile deposit, card controls, digital wallets, person-to-person payments and a better app, and the trip to the branch stops being a reason to choose someone else.</p>`,
      code: `For most of a decade, community banks heard the same prescription. Make account opening digital. Put the bank in the customer's pocket.`,
      lang: 'markdown',
    }],
  },
  {
    id: 'deck',
    name: 'Deck',
    level: 'atom',
    status: 'shared',
    summary: 'One italic line under a section heading, in the secondary colour.',
    use: ['Under every numbered section heading.'],
    avoid: ['The heading again in more words.'],
    rules: ['One or two short sentences, 40 words at most.', 'It sits directly under the heading, before the first paragraph.'],
    a11y: ['An ordinary paragraph, read in order.'],
    classes: ['pd-deck'],
    lint: ['section-deck', 'deck-length'],
    stories: [{ id: 'default', name: 'Under a section heading', html: `<p class="pd-deck">Everyone's app is fine. Fine is where everyone already is.</p>` }],
  },
  {
    id: 'label',
    name: 'Label',
    level: 'atom',
    status: 'shared',
    summary: 'Small capitals in the sans face: 14px, semibold and tracked. The one label on the site, in the secondary colour or, with accent, in the accent.',
    use: ['Naming something in a few words: a bar, a field, a speaker, a group of fields, an answer, a line to clear, the kicker over a title.', 'Over a figure, in the accent, it is the eyebrow.'],
    avoid: ['A sentence. A label names; a sentence goes in a caption or a note.', 'A label style of its own. Add the class, and let the component set only its colour, margin and position.'],
    rules: ['`class="label"`, and `class="label accent"` for the accent.', 'A component never sets a label\'s size, weight, tracking or case.', 'Sentence case in the source; the style sets the capitals.', 'Markdown table headers and the eyebrow take the same style from the stylesheet, since neither carries the class.'],
    a11y: ['The capitals come from the stylesheet, so a screen reader reads words, not letters.', 'At 14px it is the smallest text on the page, so it keeps its colour at full strength, never faded.'],
    classes: ['label', 'accent'],
    lint: ['type-scale'],
    stories: [{ id: 'colours', name: 'In the secondary colour and in the accent', html: `<p class="label">Average checking balance</p>\n<p class="label accent">One primary checking customer, one year</p>` }],
  },
  {
    id: 'eyebrow',
    name: 'Eyebrow',
    level: 'atom',
    status: 'shared',
    summary: 'The label in the accent, over a figure, naming what it shows.',
    use: ['Over every stacked bar, column chart, pinned graphic and calculator.'],
    avoid: ['Over a unit stat; its number and sentence name it.'],
    rules: ['Names what the figure shows: "One primary checking customer, one year".', '`<p class="pd-eyebrow">`: the label, in the accent, with room under it.', 'Sentence case in the source; the style sets it in capitals.'],
    a11y: ['Text, so the figure has a name without an aria-label.'],
    classes: ['pd-eyebrow'],
    parts: ['label'],
    lint: ['figure-title'],
    stories: [{ id: 'default', name: 'Over a figure', html: `<p class="pd-eyebrow">One primary checking customer, one year</p>` }],
  },
  {
    id: 'caption',
    name: 'Caption',
    level: 'atom',
    status: 'shared',
    summary: 'The line under a figure: who measured it, the sample, and what the figure leaves out.',
    use: ['Under every figure that shows a number.'],
    avoid: ['A figure with no source behind it. Find the source or cut the figure.'],
    rules: ['Who measured it, what, the sample and the year: "ABA and Morning Consult, 2025 Preferred Banking Methods survey, 4,403 U.S. adults."', 'Say what the figure leaves out when a reader would assume it: "Gross figures, before servicing, fraud and network costs."', 'The full source goes in a footnote cited from the text.'],
    a11y: ['A figcaption, so it is read as the figure\'s caption.'],
    classes: [],
    lint: ['chart-source'],
    stories: [{ id: 'default', name: 'Under a figure', html: `<figure class="pd-figure"><figcaption>Gross figures, before servicing, fraud and network costs. Switch the interchange regime to see what the same customer is worth at a bank over $10 billion.</figcaption></figure>` }],
  },
  {
    id: 'link',
    name: 'Link',
    level: 'atom',
    status: 'shared',
    summary: 'Text in the reading colour, underlined in the accent.',
    use: ['Reports, rules and sources named in the text, and the booking line.'],
    avoid: ['Links on words like "here". The link text says where it goes.'],
    rules: ['A markdown link. The style underlines it in the accent, 3px under the text.', 'Name the destination: "FINRA Rule 2210", not "this rule".'],
    a11y: ['The underline, not colour alone, marks a link.'],
    classes: [],
    lint: ['link-text'],
    stories: [{ id: 'inline', name: 'In a sentence', html: `<p>FINRA's rule on communications with the public, <a href="https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210">FINRA Rule 2210</a>, covers every version a customer receives.</p>`, code: `FINRA's rule on communications with the public, [FINRA Rule 2210](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2210), covers every version a customer receives.`, lang: 'markdown' }],
  },
  {
    id: 'footnote-marker',
    name: 'Footnote marker',
    level: 'atom',
    status: 'template',
    summary: 'A small number in the accent, after the sentence it supports, that opens its source.',
    use: ['After every figure, rule and quotation that has a source.'],
    avoid: ['Before the punctuation.'],
    rules: ['`[^n]` in markdown, after the punctuation: `across all ages.[^1]`', '14px bold, the smallest step.', 'On wide screens the source sits in the rail beside the paragraph; on phones the marker opens it under the paragraph.'],
    a11y: ['A link. On phones it announces aria-expanded as it opens the note.', 'On phones its tap target is padded out past the number.'],
    classes: [],
    lint: ['footnote-refs'],
    stories: [{ id: 'inline', name: 'After a sentence', html: `<p>Community banks took 4, by Cornerstone Advisors' estimate, across all ages.<sup><a href="#fn-1" data-footnote-ref>1</a></sup></p>`, code: `Community banks took 4, by Cornerstone Advisors' estimate, across all ages.[^1]`, lang: 'markdown' }],
  },
  {
    id: 'number',
    name: 'Number',
    level: 'atom',
    status: 'shared',
    summary: 'A figure in Archivo Black with even-width numerals, in four sizes: beside a label, in a row, a total, and the number a figure leads with.',
    use: ['Every number a figure prints in the display face: a bar\'s value, ledger values and totals, legend counts, the day on an as-of slider, the number a figure leads with.'],
    avoid: ['Numbers in running text. They stay in the body face.', 'A size of its own. Pick one of the four.'],
    rules: ['`class="pd-num"` for a number in a row (29px). Add is-s beside a label (24px), is-l for a total or a count (41px), is-xl for the number a figure leads with (60px).', 'In a column narrower than 560px each size takes the step below: 24, 24, 29 and 41.', 'A component sets a number\'s colour and alignment, never its size.', 'The numerals are even width, so values in a column line up and a total that changes as the reader types does not jump.', 'The decisions\' numerals are the same number, drawn by the stylesheet.'],
    a11y: ['A number that changes as the reader types carries aria-live where it is the result.'],
    classes: ['pd-num'],
    lint: ['type-scale'],
    stories: [{ id: 'sizes', name: 'The four sizes', html: `<div class="ui-specimens">\n  <div><span class="pd-num is-xl">$5,400</span><p class="label">is-xl: the number a figure leads with</p></div>\n  <div><span class="pd-num is-l">$418</span><p class="label">is-l: a total or a count</p></div>\n  <div><span class="pd-num">$206</span><p class="label">A number in a row</p></div>\n  <div><span class="pd-num is-s">$350</span><p class="label">is-s: beside a label</p></div>\n</div>` }],
  },
  {
    id: 'swatch',
    name: 'Swatch',
    level: 'atom',
    status: 'shared',
    summary: 'A 12px square that keys a colour: ink, the accent, or empty with a hairline for the rest.',
    use: ['In a key or a legend, beside the name of what the colour marks.'],
    avoid: ['A colour with no name beside it.'],
    rules: ['`<i class="pd-swatch is-accent"></i>`, is-ink, or no modifier for the empty square.', 'Its fill matches the marks it keys: accent for accent segments and squares, ink for ink ones.'],
    a11y: ['Decorative: the name beside it carries the meaning.', 'In forced-colours mode it takes the same system colours as the marks it keys.'],
    classes: ['pd-swatch'],
    lint: [],
    stories: [{ id: 'three', name: 'Ink, accent and empty', html: `<p class="ui-row"><i class="pd-swatch is-ink"></i> <i class="pd-swatch is-accent"></i> <i class="pd-swatch"></i></p>` }],
  },
  {
    id: 'unit-square',
    name: 'Unit square',
    level: 'atom',
    status: 'shared',
    summary: 'One square of a unit stat or a unit grid: empty with a hairline, filled in the accent, or filled in ink.',
    use: ['Rows and grids of units that count a share.'],
    avoid: ['On its own. A square counts only in a row or a grid.'],
    rules: ['`<i class="pd-cell"></i>`; is-on fills it in the accent and is-alt in ink.', 'The finished state ships in the HTML, and the script fills the squares in order when the figure arrives.', 'A square that lands pops to 1.35 times its size for a moment (is-landing).'],
    a11y: ['The squares are aria-hidden; the figure\'s number and sentence carry the reading.', 'In forced-colours mode the two fills take two system colours.'],
    classes: ['pd-cell'],
    lint: ['units-count'],
    stories: [{ id: 'states', name: 'Accent, ink and empty', html: `<div class="pd-units-cells" data-cols="10" aria-hidden="true">${'<i class="pd-cell is-on"></i>'.repeat(4)}${'<i class="pd-cell is-alt"></i>'.repeat(2)}${'<i class="pd-cell"></i>'.repeat(4)}</div>` }],
  },
  {
    id: 'segment',
    name: 'Bar segment',
    level: 'atom',
    status: 'shared',
    summary: 'One part of a bar, in ink or the accent: solid, outlined for a figure the text doubts, or hatched for a range, with its value inside when there is room.',
    use: ['Inside a bar row\'s track, one per part.'],
    avoid: ['More than three in a bar; the labels stop fitting.'],
    rules: ['`<div class="pd-seg" style="left:…;width:…">`. Position and width are the one inline style, and the builders compute them.', 'is-accent for the part the sentence is about; is-outline for a figure the text doubts.', 'A range runs on from the last segment to its high end, hatched: pd-seg-range.', 'The value inside (pd-seg-label) is 14px bold. A segment too narrow for it hides it (is-tight), and the ledger carries the number.'],
    a11y: ['Every value a segment shows is printed in the bar row or the ledger as well.'],
    classes: ['pd-seg', 'pd-seg-label', 'pd-seg-word', 'pd-seg-range'],
    lint: ['stack-scale', 'inline-style'],
    stories: [{ id: 'kinds', name: 'Ink, accent and a range', html: `<div class="pd-stack-track">\n  <div class="pd-seg" style="left:0.0%;width:42.0%"><span class="pd-seg-label"><span class="pd-seg-word">spread </span>$206</span></div>\n  <div class="pd-seg is-accent" style="left:42.0%;width:43.2%"><span class="pd-seg-label"><span class="pd-seg-word">interchange </span>$212</span></div>\n  <div class="pd-seg-range is-accent" style="left:85.2%;width:10.0%"></div>\n</div>` }],
  },
  {
    id: 'mark',
    name: 'Line to clear',
    level: 'atom',
    status: 'shared',
    summary: 'A vertical line across a bar at the amount its total has to clear, named by a label under the bar.',
    use: ['A cost, a target or a threshold the parts are measured against: "$350 to acquire".'],
    avoid: ['More than one on a bar.'],
    rules: ['`<div class="pd-mark" style="left:…"><span class="label">$350 to acquire</span></div>`, inside the track.', 'It sits on the bar\'s scale, and the linter checks it.', 'The label hangs under the line, set to the left of it, or to the right (is-left) when the line falls in the first 40% of the bar.', 'It arrives at its own step, after the parts it is measured against.'],
    a11y: ['The label is text, and the amount is in the ledger or the note under the bar as well.'],
    classes: ['pd-mark'],
    lint: ['stack-scale'],
    stories: [{ id: 'cost', name: 'Across a bar', html: `<div class="pd-stack-track">\n  <div class="pd-seg" style="left:0.0%;width:44.0%"></div>\n  <div class="pd-seg is-accent" style="left:44.0%;width:45.3%"></div>\n  <div class="pd-mark" style="left:74.8%"><span class="label">$350 to acquire</span></div>\n</div>` }],
  },
  {
    id: 'button',
    name: 'Button',
    level: 'atom',
    status: 'template',
    summary: 'The filled accent button. It books a call, and nothing else on an article page uses it.',
    use: ['Booking the 20-minute call, in the header and the author box.'],
    avoid: ['Inside the body. The closing booking line is a link.'],
    rules: ['Square corners.', 'The label says what happens: "Book a call".', 'Keep the Cal.com data attributes so the booking opens in place.'],
    a11y: ['44px tall on phones; a 3px focus ring in the ink colour.'],
    classes: ['btn', 'btn-small'],
    lint: [],
    stories: [{
      id: 'sizes',
      name: 'Header and author box sizes',
      wrap: 'article',
      html: `<p class="ui-row"><a class="btn" href="${BOOKING}" ${CAL}>Book a call</a> <a class="btn btn-small" href="${BOOKING}" ${CAL}>Book a 20-minute call</a></p>`,
      code: `<a class="btn" href="${BOOKING}" ${CAL}>Book a call</a>\n<a class="btn btn-small" href="${BOOKING}" ${CAL}>Book a 20-minute call</a>`,
    }],
  },
  {
    id: 'text-button',
    name: 'Text button',
    level: 'atom',
    status: 'shared',
    summary: 'An action written as an underlined link in the accent: reset a calculator, open a whole source.',
    use: ['A small action inside a figure or a note: "Reset to the public figures", "Full note".'],
    avoid: ['Going somewhere. That is a link.', 'The booking call. That is the button.'],
    rules: ['`<button type="button" class="pd-text-btn">`, and the words say what happens.', 'One that appears later ships hidden and holds its line, so nothing moves when it shows.', 'Its target is 44px tall without making the line taller.'],
    a11y: ['A real button, so it takes focus and answers Enter and Space; a 3px focus ring in the accent.', 'One that opens something carries aria-expanded.'],
    classes: ['pd-text-btn'],
    lint: [],
    stories: [{ id: 'two', name: 'Reset and full note', html: `<p class="ui-row"><button type="button" class="pd-text-btn">Reset to the public figures</button> <button type="button" class="pd-text-btn" aria-expanded="false">Full note</button></p>` }],
  },
  {
    id: 'toggle-button',
    name: 'Toggle button',
    level: 'atom',
    status: 'shared',
    summary: 'An outlined button that names one case; the case in force fills with the accent.',
    use: ['Inside a toggle, one for each case.'],
    avoid: ['On its own. One case needs no switch.'],
    rules: ['`class="label pd-toggle-btn"`: its words are a label, in ink.', 'is-on and aria-pressed="true" on the case in force.', 'The words name the case and its number: "Under $10B, exempt ($0.51)".'],
    a11y: ['aria-pressed says which case is in force.', '44px tall, with a 3px focus ring in ink.'],
    classes: ['pd-toggle-btn'],
    lint: [],
    stories: [{ id: 'states', name: 'In force and not', html: `<p class="ui-row"><button type="button" class="label pd-toggle-btn is-on" aria-pressed="true">Under $10B, exempt ($0.51)</button> <button type="button" class="label pd-toggle-btn" aria-pressed="false">Over $10B, capped ($0.23)</button></p>` }],
  },
  {
    id: 'number-input',
    name: 'Number input',
    level: 'atom',
    status: 'shared',
    summary: 'A boxed number field with its unit inside the box, in the accent: $ before the number, % after it.',
    use: ['Inside a field.'],
    avoid: ['Text. The kit\'s inputs take numbers.'],
    rules: ['`<span class="pd-input-wrap"><span class="pd-affix">$</span><input class="pd-input" type="number" inputmode="decimal"></span>`', 'The number is 24px semibold, 20px in a narrow column.', 'The browser\'s spin buttons are hidden; the reader types.'],
    a11y: ['The box border turns accent on focus, with a 3px ring in ink.', 'inputmode="decimal" brings up the number pad on phones.'],
    classes: ['pd-input-wrap', 'pd-input', 'pd-affix'],
    lint: [],
    stories: [{ id: 'units', name: 'Dollars and percent', html: `<p class="ui-row"><span class="pd-input-wrap"><span class="pd-affix">$</span><input class="pd-input" type="number" inputmode="decimal" value="5400" aria-label="Average checking balance"></span> <span class="pd-input-wrap"><input class="pd-input" type="number" inputmode="decimal" value="3.81" aria-label="Net interest margin"><span class="pd-affix">%</span></span></p>` }],
  },
  {
    id: 'slider',
    name: 'Slider',
    level: 'atom',
    status: 'shared',
    summary: 'A range input in ink, the full width of its figure, that picks a day along a strip.',
    use: ['Under a strip of versions, to pick the day an as-of slider shows.'],
    avoid: ['An exact number. Use a number input.'],
    rules: ['`<input class="pd-asof-range" type="range">` with an aria-label that names what it picks.', 'Ink, so the accent marks only the result.', 'It ships hidden and holds its line until the script is ready.'],
    a11y: ['A native range input: the arrow keys move it a step, and it announces its value.'],
    classes: ['pd-asof-range'],
    lint: [],
    stories: [{ id: 'day', name: 'Picking a day', html: `<input class="pd-asof-range" type="range" min="0" max="176" step="1" value="68" aria-label="Day the customer saw the disclosure">` }],
  },
  {
    id: 'data-mark',
    name: 'Data mark',
    level: 'atom',
    status: 'shared',
    summary: 'Ties a figure, rule, story or term in the text to its record in the component registry. The build fails when a mark has no record or the marked text drifts from it.',
    use: ['On every figure the article repeats: in the short version, the body and a chart.'],
    avoid: ['Marking every number. Mark what has a record.'],
    rules: ['The record lives in src/data/components/<article>.ts with a status and its sources.', 'A record with match spellings requires the marked text to contain one of them, so the brief, the body and the charts cannot disagree.', 'Add the article registry to src/data/components/index.ts.'],
    a11y: ['No visual style; it reads as plain text.'],
    classes: [],
    lint: ['data-mark'],
    stories: [{
      id: 'inline',
      name: 'Inline, in a sentence',
      html: `<p>Chime's payments revenue was <data value="c:chime-payments">$430 million</data> of $670 million in the second quarter of 2026.</p>`,
      code: `Chime's payments revenue was <data value="c:chime-payments">$430 million</data> of $670 million in the second quarter of 2026.\n\n// src/data/components/your-article.ts\n{ id: 'chime-payments', kind: 'figure', label: 'Chime payments revenue, Q2 2026', value: '$430 million', status: 'sourced', sources: [8], match: ['$430 million'] },`,
      lang: 'markdown',
    }],
  },
  {
    id: 'reading-progress',
    name: 'Reading progress',
    level: 'atom',
    status: 'template',
    summary: 'A thin rail down the left edge of the screen that fills with the accent as the reader moves through the page.',
    use: ['Every page with a script; the base layout draws it.'],
    avoid: ['A percentage or a time-left counter.'],
    rules: ['2px wide, 16px from the left edge, the accent at 12% for the empty rail and full strength for the fill.', 'Driven by a scroll timeline where the browser has one, and by a scroll listener in article.js where it does not.', 'Hidden on phones.'],
    a11y: ['Decorative and aria-hidden.'],
    classes: ['trace-rail', 'trace-fill'],
    lint: [],
    stories: [{
      id: 'rail',
      name: 'Two fifths of the way down',
      wrap: 'page',
      html: `<div class="ui-rail-demo"><div class="trace-rail" aria-hidden="true"><div class="trace-fill"></div></div></div>`,
      code: `<!-- src/layouts/Base.astro draws it; site-shell.css styles it. -->\n<div class="trace-rail" aria-hidden="true"><div class="trace-fill"></div></div>`,
    }],
  },

  // ---------------------------------------------------------------- Molecules
  {
    id: 'section-heading',
    name: 'Section heading',
    level: 'molecule',
    status: 'shared',
    summary: 'A roman numeral, a hairline and the section\'s claim in the display face, with its deck under it; an italic subhead for a part of a section.',
    use: ['Every section opens with a ## heading and a deck.', 'A ### subhead for a named part inside a section, such as a pinned sequence.'],
    avoid: ['A label like "Background". The heading states the claim or asks the reader\'s question.', 'A fourth level of heading.'],
    rules: ['A claim or the reader\'s own question: "Chime has fewer levers", "So, why should I bank with you?"', 'Twelve words at most.', 'The stylesheet numbers the sections I, II, III; do not type numbers. "About the numbers" closes the piece unnumbered.', 'The template renders the h1 from the title; the body starts at ##.'],
    a11y: ['Headings step down one level at a time.'],
    classes: [],
    parts: ['deck'],
    lint: ['heading-h1', 'heading-order', 'heading-case', 'heading-length', 'section-deck'],
    stories: [{
      id: 'section',
      name: 'A section with its deck and a subhead',
      html: `<h2 id="chime-has-fewer-levers">Chime has fewer levers</h2>\n<p class="pd-deck">Fewer capabilities, one experience.</p>\n<p>Chime's offer centers on everyday money: checking, savings, credit-building products, early access to qualifying direct deposits and overdraft features for eligible members.</p>\n<h3 id="what-the-customer-is-worth">What the customer is worth</h3>\n<p>The public numbers do not support that.</p>`,
      code: `## Chime has fewer levers\n\n<p class="pd-deck">Fewer capabilities, one experience.</p>\n\nChime's offer centers on everyday money: checking, savings, credit-building products, early access to qualifying direct deposits and overdraft features for eligible members.\n\n### What the customer is worth\n\nThe public numbers do not support that.`,
      lang: 'markdown',
    }],
  },
  {
    id: 'pull-quote',
    name: 'Pull quote',
    level: 'molecule',
    status: 'shared',
    summary: 'A line from the argument set large in italic, with the opening quotation mark hung into the margin and an accent rule under it.',
    use: ['For the line a reader should carry out of the section.', 'Two to four per article.'],
    avoid: ['Quoting someone else. Quote sources in the text with their footnote.'],
    rules: ['40 words at most.', 'A markdown blockquote; the style draws the mark, hung into the left margin.', 'On phones the mark sits above the quote so the quote keeps the column.', 'Inside a pinned step, the line takes the same voice without the mark or the rule: <p class="pd-pull">.'],
    a11y: ['A blockquote, announced as a quotation. The mark is generated, so it is not read twice.'],
    classes: ['pd-pull'],
    lint: ['pullquote-length'],
    stories: [{
      id: 'default',
      name: 'A line from the argument',
      html: `<blockquote><p>Every department can be competent, every dashboard can be green, and the customer proposition can still be mediocre.</p></blockquote>`,
      code: `> Every department can be competent, every dashboard can be green, and the customer proposition can still be mediocre.`,
      lang: 'markdown',
    }, {
      id: 'in-step',
      name: 'Inside a pinned step',
      html: `<p class="pd-pull">The customer experiences one bank while the organization manages twelve functions.</p>`,
    }],
  },
  {
    id: 'number-head',
    name: 'Number head',
    level: 'molecule',
    status: 'shared',
    summary: 'The number a figure leads with and the sentence it belongs to. The sentence sits beside the number and wraps under it when the column has no room.',
    use: ['Leading a unit stat, a stacked bar or a record.'],
    avoid: ['Two in one figure.', 'A figure with no number to lead with. Say what its bars count under the eyebrow instead, with pd-stack-sub.'],
    rules: ['`<div class="pd-head"><span class="pd-num is-xl">95%</span><span class="pd-head-text">of consumers rate their bank\'s app good or better.</span></div>`', 'The sentence starts where the number leaves off, in the body face at 20px, 17px in a narrow column.', 'A record puts the record\'s own words under the sentence, inside pd-head-text.'],
    a11y: ['The number and the sentence read in order, as one statement.'],
    classes: ['pd-head', 'pd-head-text'],
    parts: ['number'],
    lint: [],
    stories: [{ id: 'balance', name: 'A number and its sentence', html: `<div class="pd-head"><span class="pd-num is-xl">$5,400</span><span class="pd-head-text">median transaction balance, under 35</span></div>` }],
  },
  {
    id: 'bar-row',
    name: 'Bar row',
    level: 'molecule',
    status: 'shared',
    summary: 'One bar: its name as a label, its value as a number at the end of the line, and a track that holds its segments and any line to clear.',
    use: ['Every bar in a stacked bar and in a calculator.'],
    avoid: ['A bar on a scale of its own. Every bar in a figure shares one.'],
    rules: ['`<div class="pd-stack-bar">` in a stacked bar; `<div class="pd-bar">` in a calculator, where the script sets the widths.', 'The name can carry a second line that says what the bar counts (pd-stack-what).', 'The value prints once, at the end of the name line, as a number (is-s).', 'Build it with the stacked bar controls so the widths are right.'],
    a11y: ['The name and the value are text, so the bar reads without its track.'],
    classes: ['pd-stack-bar', 'pd-stack-head', 'pd-stack-what', 'pd-stack-track', 'pd-bar'],
    parts: ['label', 'number', 'segment', 'mark'],
    lint: ['stack-scale'],
    stories: [{ id: 'one', name: 'A bar with a line to clear', html: stack({ bars: STACK_DEMO.bars.map(({ at, segs, mark, ...b }) => ({ ...b, segs: segs.map(({ at: _, ...sg }) => sg), mark: { value: mark.value, label: mark.label } })), graphic: true }) }],
  },
  {
    id: 'key',
    name: 'Key',
    level: 'molecule',
    status: 'shared',
    summary: 'A swatch and a name for each colour in a bar, in one row.',
    use: ['Beside a bar whose segments carry no words, as in a calculator.'],
    avoid: ['A figure whose parts are named inside it already.'],
    rules: ['`<p class="pd-key"><span><i class="pd-swatch is-ink"></i>Deposit spread</span>…</p>`', 'Names run in the order the segments do.'],
    a11y: ['The names are text; the swatches only repeat the colour.'],
    classes: ['pd-key'],
    parts: ['swatch'],
    lint: [],
    stories: [{ id: 'two', name: 'Two colours', html: `<p class="pd-key"><span><i class="pd-swatch is-ink"></i>Deposit spread</span><span><i class="pd-swatch is-accent"></i>Interchange</span></p>` }],
  },
  {
    id: 'legend-row',
    name: 'Legend row',
    level: 'molecule',
    status: 'shared',
    summary: 'A swatch, a count and what it counts: one row for each group of squares in a unit grid.',
    use: ['Under a unit grid.'],
    avoid: ['More than three rows.'],
    rules: ['The count is a number (is-l) that counts up with its squares (data-count).', 'A third row with an empty swatch names the rest.'],
    a11y: ['The grid states the counts in its aria-label; the rows repeat them as text.'],
    classes: ['pd-legend-row', 'pd-legend-label'],
    parts: ['swatch', 'number'],
    lint: [],
    stories: [{ id: 'three', name: 'Three groups', html: `<div class="pd-grid-legend">\n  <div class="pd-legend-row"><span class="pd-swatch is-accent"></span><span class="pd-num is-l">44</span><span class="pd-legend-label">of every 100 new checking accounts opened in 2024 went to digital banks and fintechs</span></div>\n  <div class="pd-legend-row"><span class="pd-swatch is-ink"></span><span class="pd-num is-l">4</span><span class="pd-legend-label">went to community banks</span></div>\n  <div class="pd-legend-row"><span class="pd-swatch"></span><span class="pd-num is-l">52</span><span class="pd-legend-label">went to everyone else</span></div>\n</div>` }],
  },
  {
    id: 'ledger',
    name: 'Ledger',
    level: 'molecule',
    status: 'shared',
    summary: 'Rows of named amounts with the arithmetic under each name, and the total in a box in the accent.',
    use: ['Under a calculator or a stacked bar, to show how the total is built.'],
    avoid: ['Amounts that do not add up to the total. The total is the sum of the rounded rows.'],
    rules: ['Each row names the amount and shows its arithmetic in small type: "balance x NIM".', 'The total is the sum of the rows as shown, so the ledger always adds up.', 'Values are numbers, and the total is is-l in the accent.', 'A value that changes flashes in the accent for a moment.'],
    a11y: ['The total and the payback carry aria-live, so a change is announced.'],
    classes: ['pd-ledger', 'pd-ledger-row', 'pd-ledger-label', 'pd-ledger-src', 'pd-ledger-value', 'pd-ledger-total'],
    parts: ['number'],
    lint: [],
    stories: [{
      id: 'rows',
      name: 'Two parts and a total',
      html: `<div class="pd-ledger">\n  <div class="pd-ledger-row"><span class="pd-ledger-label">Deposit spread <span class="pd-ledger-src">balance x NIM</span></span><span class="pd-num pd-ledger-value">$206</span></div>\n  <div class="pd-ledger-row"><span class="pd-ledger-label">Interchange, gross <span class="pd-ledger-src">transactions x 12 x fee</span></span><span class="pd-num pd-ledger-value">$212</span></div>\n  <div class="pd-ledger-row pd-ledger-total"><span class="pd-ledger-label">A year of checking, before any loan</span><span class="pd-num is-l pd-ledger-value">$418</span></div>\n</div>`,
    }],
  },
  {
    id: 'field',
    name: 'Field',
    level: 'molecule',
    status: 'shared',
    summary: 'A number input with its label, its unit in the accent, and the source of its default under it.',
    use: ['Inside a calculator.'],
    avoid: ['A placeholder in place of a label.'],
    rules: ['A label names the input: "Average checking balance". In a tool that asks readers about their own team, it asks a plain question instead: "How many assets do you ship a year?"', 'The line under it names the source of the default: "SCF median, under 35".', 'The unit sits in the box: $, %.', 'In a calculator, data-var names the value for the formulas.'],
    a11y: ['The label element wraps the input, so the label is its name.', 'inputmode="decimal" brings up the number pad on phones.'],
    classes: ['pd-field', 'pd-field-src'],
    parts: ['label', 'number-input'],
    lint: [],
    stories: [{
      id: 'set',
      name: 'Three fields',
      html: `<div class="pd-calc-inputs">\n  <label class="pd-field"><span class="label">Average checking balance</span><span class="pd-input-wrap"><span class="pd-affix">$</span><input class="pd-input" type="number" inputmode="decimal" value="5400"></span><span class="pd-field-src">SCF median, under 35</span></label>\n  <label class="pd-field"><span class="label">Net interest margin</span><span class="pd-input-wrap"><input class="pd-input" type="number" inputmode="decimal" value="3.81"><span class="pd-affix">%</span></span><span class="pd-field-src">FDIC, community banks, Q2 2026</span></label>\n  <label class="pd-field"><span class="label">Debit transactions a month</span><span class="pd-input-wrap"><input class="pd-input" type="number" inputmode="decimal" value="34.6"></span><span class="pd-field-src">PULSE, active cards</span></label>\n</div>`,
    }],
  },
  {
    id: 'toggle',
    name: 'Toggle',
    level: 'molecule',
    status: 'shared',
    summary: 'Two or three toggle buttons that switch a figure between cases; the case in force fills with the accent.',
    use: ['Switching a calculator between regimes: "Under $10B, exempt" and "Over $10B, capped".'],
    avoid: ['More than three cases. Use a field.'],
    rules: ['Each button names the case and its number.', 'In a calculator, data-set="name=value" sets that field, and the button in force follows the field.', 'A label above the group names what it switches: "Interchange regime".'],
    a11y: ['aria-pressed on each button and an aria-label on the group.'],
    classes: ['pd-toggle'],
    parts: ['toggle-button'],
    lint: [],
    stories: [{
      id: 'regime',
      name: 'Two cases',
      html: `<div class="pd-toggle" role="group" aria-label="Interchange regime">\n  <button type="button" class="label pd-toggle-btn is-on" aria-pressed="true">Under $10B, exempt ($0.51)</button>\n  <button type="button" class="label pd-toggle-btn" aria-pressed="false">Over $10B, capped ($0.23)</button>\n</div>`,
    }],
  },
  {
    id: 'fold',
    name: 'Fold',
    level: 'molecule',
    status: 'shared',
    summary: 'A closed section under a calculator\'s main fields that opens when the reader asks: "Change the other 2 numbers".',
    use: ['A calculator with more than six fields.'],
    avoid: ['Hiding a number the text discusses.'],
    rules: ['`<details class="pd-calc-more"><summary>Change the other 2 numbers</summary><div class="pd-calc-inputs is-more">…</div></details>`', 'Closed by default. Opening it is the one change in size the reader asks for.', 'The summary counts the fields it holds; labels across the row group them.'],
    a11y: ['A native details element, so the keyboard and screen readers treat it as a disclosure.'],
    classes: ['pd-calc-more'],
    parts: ['label', 'field'],
    lint: [],
    stories: [{ id: 'fold', name: 'Two fields in the fold', html: `<div class="pd-calc">\n${calcFoldHtml.slice(calcFoldHtml.indexOf('  <details'), calcFoldHtml.indexOf('</details>') + 10)}\n</div>` }],
  },
  {
    id: 'dialogue',
    name: 'Dialogue',
    level: 'molecule',
    status: 'signature',
    summary: 'A short exchange, each line labelled with its speaker, the other side indented.',
    use: ['An exchange the reader has heard before, where the rhythm makes the point.'],
    avoid: ['Invented quotes attributed to real people.'],
    rules: ['Four to eight lines.', 'Speakers are roles, set as labels: Bank, Customer. The reader\'s side is in the accent.', 'On phones the reader\'s side carries an accent rule instead of an indent.'],
    a11y: ['A group with an aria-label; each speaker label is text.'],
    classes: ['pd-dialogue', 'pd-us', 'pd-them'],
    parts: ['label'],
    lint: ['signature-spacing'],
    stories: [{
      id: 'exchange',
      name: 'Bank and customer',
      html: `<div class="pd-dialogue" role="group" aria-label="The conversation">\n  <p class="pd-us"><span class="label">Bank</span>Because we're local.</p>\n  <p class="pd-them"><span class="label">Customer</span>Okay. How does that make my life better?</p>\n  <p class="pd-us"><span class="label">Bank</span>Because we have great service.</p>\n  <p class="pd-them"><span class="label">Customer</span>So does every bank's advertising.</p>\n</div>`,
    }],
  },
  {
    id: 'decisions',
    name: 'Decisions',
    level: 'molecule',
    status: 'shared',
    summary: 'The changes to make, numbered in the display face, each opening on the change in capitals.',
    use: ['At the end, under "Where to start".'],
    avoid: ['Padding the list to a round number.'],
    rules: ['Each item opens with the change in bold, either as the finished state ("Someone owns the proposition.") or as an instruction ("Start with one journey."). The front door uses both; a deck that promises changes to make reads naturally with instructions.', 'The sentences after it say what the change involves and who has the authority.', 'On phones the number sits above the text.'],
    a11y: ['An ordered list; the numbers are generated.'],
    classes: ['pd-decisions'],
    parts: ['number'],
    lint: [],
    stories: [{
      id: 'three',
      name: 'Three changes',
      html: `<ol class="pd-decisions">\n  <li><strong>Someone owns the proposition.</strong> Give a senior leader responsibility for the chosen younger-customer proposition across product, digital, retail and marketing, with the budget and decision rights to resolve tradeoffs.</li>\n  <li><strong>The scorecard measures the relationship and its economics.</strong> Keep uptime and app satisfaction, but stop treating them as sufficient evidence of competitiveness.</li>\n  <li><strong>Start with one journey.</strong> Take the first paycheck arriving in a newly opened account and manage the surrounding experience as a single product for one quarter.</li>\n</ol>`,
    }],
  },
  {
    id: 'table',
    name: 'Table',
    level: 'molecule',
    status: 'shared',
    summary: 'A ruled table in the sans face for anything the reader scans across.',
    use: ['Comparisons with three or more attributes per row.'],
    avoid: ['Numbers the reader should compare at a glance; chart them.'],
    rules: ['The header row is set as labels, and the first column names the row.', 'Short cells; the detail goes in a footnote.', 'Markdown pipes. The table scrolls sideways on a phone.'],
    a11y: ['Markdown tables render a real header row.'],
    classes: [],
    parts: ['label'],
    lint: [],
    stories: [{
      id: 'figures',
      name: 'The figures behind a customer',
      html: `<table>\n  <thead><tr><th>Figure</th><th>Value</th><th>Source</th></tr></thead>\n  <tbody>\n    <tr><td>Median transaction balance, under 35</td><td>$5,400</td><td>Federal Reserve, Survey of Consumer Finances</td></tr>\n    <tr><td>Community bank net interest margin</td><td>3.81%</td><td>FDIC, Q2 2026</td></tr>\n    <tr><td>Interchange per debit transaction, exempt issuers</td><td>$0.51</td><td>Federal Reserve, Regulation II data</td></tr>\n  </tbody>\n</table>`,
      code: `| Figure | Value | Source |\n|---|---|---|\n| Median transaction balance, under 35 | $5,400 | Federal Reserve, Survey of Consumer Finances |\n| Community bank net interest margin | 3.81% | FDIC, Q2 2026 |\n| Interchange per debit transaction, exempt issuers | $0.51 | Federal Reserve, Regulation II data |`,
      lang: 'markdown',
    }],
  },
  {
    id: 'illustration',
    name: 'Illustration',
    level: 'molecule',
    status: 'shared',
    summary: 'A flat editorial illustration, one deadpan object gag, drawn in a light and a dark version that swap with the theme and rise into place when they arrive.',
    use: ['Three to six per article, at the turns in the argument.'],
    avoid: ['People, logos, stock photography, or text inside the image.', 'Explaining the joke in a caption.'],
    rules: ['Light: flat #F1F2F4 ground, navy #0A192F line, one terracotta #D9552B accent. Dark: navy ground, off-white #F4F0EA line, one brass #E0A938 accent.', 'The accent marks the one object the scene is about.', 'Both files share one aspect ratio, and the img carries that width and height.', 'Full width by default; is-tall for a portrait image (420px), is-spot for a small square one (520px).', 'A drawing whose ground is a shade off the page colour takes is-blend, which blends it into the page in light mode; better still, export it on the exact page colour.'],
    a11y: ['The alt text describes the scene in one or two sentences.', 'Reduced motion shows it in place.'],
    classes: ['pd-img'],
    lint: ['img-attrs', 'img-dark', 'img-files', 'img-aspect', 'img-weight'],
    stories: [
      { id: 'wide', name: 'Full width', motion: true, html: `<figure class="pd-img">\n  <picture>\n    <source srcset="/assets/front-door-dark.webp" type="image/webp" media="(prefers-color-scheme: dark)">\n    <img src="/assets/front-door.png" width="1200" height="681" loading="lazy" alt="A grand bank entrance with its doors standing open and velvet ropes slack. Footprints on the sidewalk walk past the steps.">\n  </picture>\n</figure>` },
      { id: 'spot', name: 'A spot illustration', motion: true, html: `<figure class="pd-img is-spot">\n  <picture>\n    <source srcset="/assets/bank-hoodie-dark.webp" type="image/webp" media="(prefers-color-scheme: dark)">\n    <img src="/assets/bank-hoodie.png" width="861" height="865" loading="lazy" alt="A century-old neoclassical bank, EST. 1907 on the pediment, wearing a hoodie with the hood pulled over the roof and the drawstrings hanging past the columns. A skateboard leans against the steps.">\n  </picture>\n</figure>` },
    ],
  },
  {
    id: 'sources',
    name: 'Sources and sidenotes',
    level: 'molecule',
    status: 'template',
    summary: 'Markdown footnotes that sit beside the paragraph that cites them on wide screens, under the graphic in a pinned sequence (shortened, with a "Full note" link), and open in place on phones.',
    use: ['Every figure, rule and quotation.'],
    avoid: ['Citing a secondary report when the primary exists.'],
    rules: ['Format: **Publisher.** Title, date. What was measured, the sample and the dates. What the figure does not show. [Report title](url)', 'Every footnote is cited, and every citation has a footnote.', 'Use notes: rail in the front matter; the template places them.'],
    a11y: ['Markers are links; on phones they announce aria-expanded.'],
    classes: ['sidenote', 'note-inline'],
    parts: ['footnote-marker', 'text-button'],
    lint: ['footnote-refs', 'footnote-format'],
    stories: [{
      id: 'inline',
      name: 'A source opened on a phone',
      html: `<p>Community banks took 4, by Cornerstone Advisors' estimate, across all ages.<sup><a href="#fn-1" data-footnote-ref class="is-active">1</a></sup></p>\n<div class="note-inline"><span class="sidenote-num">1</span><p><strong>Cornerstone Advisors.</strong> Where new checking accounts were opened in 2024, by type of provider. <a href="https://www.crnrstone.com/">Cornerstone Advisors</a></p></div>`,
      code: `Community banks took 4, by Cornerstone Advisors' estimate, across all ages.[^1]\n\n[^1]: **Cornerstone Advisors.** Where new checking accounts were opened in 2024, by type of provider. [Cornerstone Advisors](https://www.crnrstone.com/)`,
      lang: 'markdown',
    }],
  },
  {
    id: 'booking-line',
    name: 'Booking line',
    level: 'molecule',
    status: 'template',
    summary: 'The one closing offer, word for word the same on every article.',
    use: ['The template adds it after the body. You never write it.'],
    avoid: ['A second call to action in the body.'],
    rules: ['"If you want to see this with your organization\'s own numbers, book twenty minutes."', 'A piece-specific ask goes in the paragraph above it.'],
    a11y: ['A plain link that opens the booking in place.'],
    classes: ['article-cta'],
    parts: ['link'],
    lint: [],
    stories: [{
      id: 'line',
      name: 'As every article ends',
      html: `<p class="article-cta">If you want to see this with your organization's own numbers, <a href="${BOOKING}" ${CAL}>book twenty minutes</a>.</p>`,
      code: `<!-- src/components/BookingLine.astro renders it; articles do not include it. -->`,
    }],
  },
  {
    id: 'short-version',
    name: 'The short version',
    level: 'molecule',
    status: 'template',
    summary: 'The whole argument in numbered points at the top of every article, under the same heading on every piece.',
    use: ['Every article, from the brief list in the front matter.'],
    avoid: ['Teasers. Each point states a finding with its number.'],
    rules: ['Three to six points; five is typical.', 'The last point starts "What changes:" and names the changes.', 'Points are HTML strings in YAML, so marks and entities work.'],
    a11y: ['An aside labelled "The short version" holding an ordered list.'],
    classes: ['article-brief', 'article-brief-label'],
    parts: ['label'],
    lint: ['fm-brief'],
    stories: [{
      id: 'brief',
      name: 'Rendered from the brief',
      html: `<aside class="article-brief" aria-label="The short version">\n  <p class="label accent article-brief-label">The short version</p>\n  <ol>\n    <li>Community banks built the digital front door. In 2024 they took 4 of every 100 new checking accounts.</li>\n    <li>Nobody inside the bank owns that customer. Twelve departments own the pieces, every dashboard is green, and a third of new accounts are gone inside a year.</li>\n    <li>What changes: one senior owner for the younger-customer proposition, a scorecard that measures the relationship, and one journey run as a single product for a quarter.</li>\n  </ol>\n</aside>`,
      code: `brief:\n  - "Community banks built the digital front door. In 2024 they took 4 of every 100 new checking accounts."\n  - "Nobody inside the bank owns that customer. Twelve departments own the pieces, every dashboard is green, and a third of new accounts are gone inside a year."\n  - "What changes: one senior owner for the younger-customer proposition, a scorecard that measures the relationship, and one journey run as a single product for a quarter."`,
      lang: 'yaml',
    }],
  },

  // ---------------------------------------------------------------- Organisms
  {
    id: 'unit-stat',
    name: 'Unit stat',
    level: 'organism',
    status: 'signature',
    summary: 'The number, the sentence it belongs to, and a row of units whose share fills with the accent, one unit at a time, when the figure comes into view.',
    use: ['A single share the section turns on: 95%, 64%, 34%.'],
    avoid: ['Values that are not a share of a whole.', 'Two in a row.'],
    rules: ['The units match the number: 95% is 19 of 20, 64% is 16 of 25, 34% is 34 of 100.', 'The sentence starts where the number leaves off: "of consumers rate their bank\'s...".', 'Twenty or twenty-five units read at a glance; a hundred draw two rows of fifty.', 'The caption names the survey, the year and the sample.'],
    a11y: ['The units are aria-hidden; the number and sentence carry the reading.', 'Reduced motion shows the filled row at once.'],
    classes: ['pd-units', 'pd-units-cells'],
    parts: ['number-head', 'unit-square', 'caption'],
    lint: ['units-count', 'signature-spacing'],
    controls: 'units',
    stories: [
      { id: 'twenty', name: 'Nineteen of twenty', motion: true, html: units(UNITS_DEMO) },
      { id: 'hundred', name: 'A hundred units', motion: true, html: units({ num: '34%', label: "of activated new checking customers went inactive or left within their first year, by the institutions' own estimate.", value: 34, of: 100, source: 'Digital Banking Report for Pinwheel, The Power of Primacy, March 2024.' }) },
    ],
  },
  {
    id: 'record',
    name: 'Record',
    level: 'organism',
    status: 'signature',
    summary: 'One number from a primary record (a fine, a ruling, a filing), the sentence that says what it was for, and a line in the record\'s own words.',
    use: ['The one enforcement action, settlement or ruling a section rests on.'],
    avoid: ['A number that is a share of a whole; use a unit stat.', 'Numbers that add up to something; use a ledger.', 'More than one in a section.'],
    rules: ['The number is the record\'s own figure, printed the way the record prints it.', 'The sentence names who did what, and the quote is the record\'s words, not a summary of them.', 'The caption names the record: who issued it, what kind, and when.', 'The full source goes in a footnote cited from the text.'],
    a11y: ['The quotation marks come from the stylesheet, so a screen reader reads the quote as text.'],
    classes: ['pd-record', 'pd-record-quote'],
    parts: ['number-head', 'caption'],
    lint: ['chart-source', 'signature-spacing'],
    stories: [{ id: 'fine', name: 'One fine', html: record(RECORD_DEMO) }],
  },
  {
    id: 'stacked-bar',
    name: 'Stacked bar',
    level: 'organism',
    status: 'shared',
    summary: 'Parts that build a total, one segment at a time, with a line the total has to clear and the ledger under it. It builds when it comes into view, or step by step inside a pinned sequence.',
    use: ['Showing what a total is made of and whether it clears a cost.', 'Two bars when the same parts come out differently in two cases.', 'A few values on one scale, one bar each with one segment: shares, counts, durations or amounts.'],
    avoid: ['More than three segments; the labels stop fitting.', 'Parts measured in different units.'],
    rules: ['Every bar shares one scale: the longest bar or line, times 1.12. Shares of a whole run to 100% instead (max: 100), so the track reads as the whole.', 'A bar with one segment prints its value once, at the end of the bar. Only the parts of a bar with several segments carry labels inside them.', 'A figure the text doubts (a number with no published method) is drawn as an outline beside the measured ones (outline: true), and the caption says why.', 'Ink for the first part, the accent for the part the sentence is about.', 'Each part appears at its step (data-at): the first part, then the next, then the line, then the second case.', 'The bar\'s total is the sum of the parts as shown; the ledger repeats them with their arithmetic.', 'Every value prints with its unit. Dollars by default; set the prefix and suffix for percents, counts, weeks or millions.', 'A value known only as a range ("two to three months", "3 to 5") runs solid to the low end and hatched to the high end, on the bar\'s last segment, and prints the whole range.', 'Build it with the controls below so the widths and positions are right.'],
    a11y: ['Every amount is printed: at the end of the bar, inside each part of a bar with several, and in the ledger.', 'A segment too narrow for its label hides the label; the ledger still carries the number.', 'Reduced motion shows the finished bar.'],
    classes: ['pd-stack', 'pd-stack-sub', 'pd-stack-note'],
    parts: ['eyebrow', 'number-head', 'bar-row', 'ledger', 'caption'],
    lint: ['stack-scale', 'figure-title', 'inline-style'],
    controls: 'stack',
    stories: [
      { id: 'two-cases', name: 'Two cases, built in steps', motion: true, html: stack({ ...customer(1), caption: 'Gross figures, before servicing, fraud and network costs. The second bar is the same customer at a bank over $10 billion, where interchange is capped at $0.23.' }) },
      { id: 'one-bar', name: 'One bar and a line to clear', motion: true, html: stack({ ...STACK_DEMO, caption: 'Gross figures, before servicing, fraud and network costs.' }) },
      { id: 'shares', name: 'One bar each, in percent', motion: true, html: stack(SHARES_DEMO) },
      { id: 'range', name: 'A value given as a range', motion: true, html: stack({ eyebrow: 'The same postcard, made twice', prefix: '', suffix: ' weeks', decimals: 1, bars: [{ name: 'From a blank page, through every queue', at: 1, text: 'two to three months', segs: [{ value: 8.7, to: 13, text: 'two to three months', at: 1 }] }, { name: 'With the executive in every meeting', at: 2, text: 'two weeks', segs: [{ value: 2, accent: true, text: 'two weeks', at: 2 }] }], caption: 'One routine holiday postcard. The first run took two to three months, so its bar runs solid to two months and hatched to three.' }) },
    ],
  },
  {
    id: 'rising-columns',
    name: 'Rising columns',
    level: 'organism',
    status: 'shared',
    summary: 'One column per period rising left to right on one scale, with an event column in the accent that lands a beat after the rest.',
    use: ['Value that builds over years against one event at the end.'],
    avoid: ['Fewer than six periods; use a stacked bar.', 'Two series.'],
    rules: ['The dashed line through the event comes first, before anything has built: the wait.', 'The columns rise left to right in about 0.8 seconds; the event lands 0.4 seconds later.', 'The callouts name the two totals at the top: the build on the left, the event on the right.', 'Label every fifth period, with the first and the last in bold.'],
    a11y: ['The figure carries an aria-label that states the whole comparison in a sentence.'],
    classes: ['pd-cols', 'pd-cols-callouts', 'pd-cols-callout', 'pd-cols-plot', 'pd-cols-grid', 'pd-cols-bars', 'pd-col', 'pd-cols-x', 'pd-cols-marker'],
    parts: ['eyebrow', 'label', 'caption'],
    lint: ['figure-title', 'inline-style'],
    controls: 'cols',
    stories: [{ id: 'wait', name: 'Fifteen years against one event', motion: true, html: cols({ ...COLS_DEMO, label: 'Checking contribution accumulating from age 25 to 39, about $6,000 in total, beside a $973 mortgage at 40.', caption: 'About $400 a year of checking contribution from 25 to 39. National Association of Realtors, median first-time buyer age of 40, 2025; Mortgage Bankers Association, net production income per loan, Q2 2026.' }) }],
  },
  {
    id: 'pinned-sequence',
    name: 'Pinned sequence',
    level: 'organism',
    status: 'signature',
    summary: 'The argument in steps on the left and a graphic that holds still on the right; each part of the graphic appears as the reader reaches its step. On phones the graphic pins to the top and the steps scroll under it.',
    use: ['A calculation or comparison the text builds one number at a time.'],
    avoid: ['A graphic that shows nothing new at each step.', 'More than six steps.'],
    rules: ['Steps are markdown inside <div class="pd-step" data-step="n">, with a blank line after the opening tag.', 'Any part of the graphic with data-at="n" appears at step n: a bar, a segment, a line, a ledger row.', 'Sources cited in a step appear under the graphic with that step: the publisher and the first sentence, with a "Full note" link that opens the rest. On narrower screens they open under the paragraph instead.', 'Keep the graphic free of blank lines.', 'Any graphic can be pinned: a stacked bar, rising columns, an org fold.'],
    a11y: ['The section carries an aria-label naming the graphic.', 'Every step is readable text; the graphic repeats what the steps say.', 'Reduced motion shows the finished graphic.'],
    classes: ['pd-scrolly', 'pd-steps', 'pd-step', 'pd-sticky', 'pd-graphic', 'pd-sticky-notes'],
    parts: ['stacked-bar', 'rising-columns', 'org-fold', 'pull-quote', 'sources', 'text-button'],
    lint: ['scrolly-steps', 'signature-spacing'],
    stories: [
      { id: 'customer', name: 'A stacked bar built step by step, with its sources', steps: 5, notes: true, html: sequence(MATH, false), code: sequence(MATH, true), lang: 'markdown' },
      { id: 'wait', name: 'Rising columns built step by step', steps: 4, notes: true, html: sequence(WAIT, false), code: sequence(WAIT, true), lang: 'markdown' },
    ],
  },
  {
    id: 'unit-grid',
    name: 'Unit grid',
    level: 'organism',
    status: 'signature',
    summary: 'A hundred squares. The accent squares fill in order, then after a beat the few that matter land in ink, one at a time, while the legend counts up. As an opener it runs the full width of the screen; as a callback near the end it comes back small, with only the few filling.',
    use: ['An opening count out of 100 that the whole piece answers: 44 to fintechs, 4 to community banks.', 'The same hundred, small, near the end, to bring the number back.'],
    avoid: ['A share you can say in one number; use a unit stat.', 'More than two filled groups.'],
    rules: ['The accent squares fill left to right in about 0.7 seconds (16ms apart), a 520ms beat, then the ink squares land 140ms apart, each with a small pop.', 'Legend numbers count up with their squares and sit beside a swatch; a third row with an empty swatch names the rest.', 'The source sits under the legend with its link.', 'The callback is a 10 by 10 square, 200px wide, centred; only its ink squares fill, 300ms apart, and only when it arrives below the fold.', 'Above the headline, the article template renders the opener from a small component such as src/components/FrontDoorOpener.astro; in the body, paste it.', '25 across on wide screens, 20 across on phones.'],
    a11y: ['The squares are aria-hidden; the grid carries an aria-label that states the counts in a sentence.', 'The finished grid ships in the HTML, so it reads correctly with scripts off; reduced motion leaves it finished.'],
    classes: ['pd-grid', 'pd-grid-inner', 'pd-grid-cells', 'pd-grid-legend', 'pd-grid-source'],
    parts: ['unit-square', 'legend-row'],
    lint: ['signature-spacing'],
    stories: [
      { id: 'opener', name: 'The opener: 44 and 4 of every 100', motion: true, html: grid(OPENER) },
      { id: 'callback', name: 'The callback: the same hundred, small', motion: true, html: grid(CALLBACK) },
    ],
  },
  {
    id: 'org-fold',
    name: 'Org fold',
    level: 'organism',
    status: 'signature',
    summary: 'Twelve departments in a grid, each marked on target; at the next step they fold into the centre, the outer boxes first, and the one thing the customer actually sees takes their place.',
    use: ['Inside a pinned sequence, when the argument turns from how the organization is run to what the customer experiences.'],
    avoid: ['As a plain org chart. The point is the fold.'],
    rules: ['Two steps: the grid with its caption, then the fold with a new caption.', 'Each box names the function, what it owns, and its status: a label with a green dot.', 'The boxes fold 0.9 seconds toward the centre, outer ones up to 260ms earlier; the replacement arrives 520ms after.', 'The replacement is an illustration with a one-line italic caption.', 'Four across on wide screens, three on phones, where the "owns" line drops out.'],
    a11y: ['The section has an aria-label; the boxes are text, and the caption changes with the step.', 'Reduced motion switches between the two states without the fold.'],
    classes: ['pd-fold', 'pd-fold-cap', 'pd-org', 'pd-org-box', 'pd-org-name', 'pd-org-owns', 'pd-org-status', 'pd-one', 'pd-one-cap'],
    parts: ['label', 'illustration'],
    lint: ['scrolly-steps', 'signature-spacing'],
    stories: [{ id: 'twelve', name: 'Twelve functions, one bank', steps: 2, html: orgSequence(false), code: orgSequence(true), lang: 'markdown' }],
  },
  {
    id: 'calculator',
    name: 'Calculator',
    level: 'organism',
    status: 'shared',
    summary: 'The reader\'s own numbers in a shaded panel: fields in one row, a toggle for the case, a stacked bar that moves as they type, and the ledger under it.',
    use: ['After a sequence that built the number from public figures, so the reader can put in their own.'],
    avoid: ['Extra outputs the text does not discuss.'],
    rules: ['It opens on the public figures from the text, and each field names its source.', 'Formulas go in data-define on the figure: "spread = bal * nim / 100; ...". Names come from each input\'s data-var.', 'Outputs name their value with data-out and a format: money, millions ($5.4 million), months, int, percent or number.', 'The bar\'s segments take data-w and the line takes data-x; the kit stacks and scales them.', 'The reset is a text button that appears once a value changes, in a line the tool already holds, so nothing moves.', 'Past six fields, the main ones stay in the row and the rest go in a fold under it ("Change the other 12 numbers"), closed by default and grouped under labels. Opening it is the one change in size the reader asks for.', 'Formulas use + - * / and parentheses, with round, ceil, floor, min, max and abs.', 'Fields count their columns from the calculator\'s own width: two across under 560px, three to 900px, then one row. Fields in a row share their label, box and note lines, so the boxes line up however long a label runs.'],
    a11y: ['The total and the payback carry aria-live.', 'The bar\'s track is aria-hidden. Every number is in the ledger or in a bar\'s name line, which stays readable.'],
    classes: ['pd-calc', 'pd-calc-head', 'pd-calc-title', 'pd-calc-lede', 'pd-calc-inputs', 'pd-calc-row'],
    parts: ['field', 'toggle', 'fold', 'bar-row', 'key', 'ledger', 'text-button', 'caption'],
    lint: ['calc-names'],
    stories: [
      { id: 'customer', name: 'What a customer is worth at your bank', html: calcHtml },
      { id: 'fold', name: 'More fields in a fold', html: calcFoldHtml },
    ],
  },
  {
    id: 'as-of',
    name: 'As-of slider',
    level: 'organism',
    status: 'signature',
    summary: 'Pick a day and see the version of a piece that was live then: a slider over the versions, the live one in the accent, and the copy the customer saw. A second answer can show what a system that keeps only the newest version would say.',
    use: ['A record that changed over time, where the question is what was live on one day: a rate disclosure, a fee schedule, a policy.'],
    avoid: ['More than about eight versions; the bands get too thin to read.', 'A history the text never asks about.'],
    rules: ['Every version ships in the HTML as a list with its dates; the script reads it, adds the slider and hides the list.', 'The slider starts on the day the text is about.', 'The accent marks only what the customer saw: the live version\'s band and an answer that shows it. The slider is ink, the other bands are gray, and a wrong answer gets a faint rule.', 'Each band can print a short value (band: "4.25%"), so the strip reads as a history before anyone moves the slider.', 'Nothing changes size while the slider moves: the answers and the date hold the size of their largest state, measured again when the width changes.', 'The caption says whose versions they are, or that they are an example.'],
    a11y: ['The slider is a range input with a label; it announces each date as its value.', 'Without the script, every version is listed with its dates.', 'The bands and the months are aria-hidden; the answers carry the reading.'],
    classes: ['pd-asof', 'pd-asof-head', 'pd-asof-q', 'pd-asof-day', 'pd-asof-bands', 'pd-asof-band', 'pd-asof-band-label', 'pd-asof-months', 'pd-asof-answers', 'pd-asof-answer', 'pd-asof-copy', 'pd-asof-meta', 'pd-asof-verdict', 'pd-asof-versions'],
    parts: ['eyebrow', 'number', 'slider', 'label', 'caption'],
    lint: ['figure-title', 'chart-source', 'kit-assets', 'signature-spacing'],
    stories: [{ id: 'disclosure', name: 'What rendered on a given day', html: asof(ASOF_DEMO) }],
  },
  {
    id: 'article-header',
    name: 'Article header',
    level: 'organism',
    status: 'template',
    summary: 'Kicker, title, dek, date with reading time, and byline. The template builds it from the front matter.',
    use: ['Every article. You write front matter; the template writes this.'],
    avoid: ['A title that needs the dek to make sense.'],
    rules: ['The title is short and in title case: "The Digital Front Door Nobody Walks Through".', 'The description is the dek: one or two sentences, 70 to 200 characters. It is also the search snippet.', 'The kicker names the topic area: "Financial services". It is a label.', 'The title climbs one step of the type scale at each breakpoint: 35, 41, 50 and 60px.'],
    a11y: ['The title is the page\'s only h1.'],
    classes: ['article-header', 'article-kicker', 'article-title', 'article-intro', 'article-date', 'article-byline'],
    parts: ['label'],
    lint: ['fm-description', 'fm-kicker', 'fm-title-case'],
    stories: [{
      id: 'header',
      name: 'From front matter',
      wrap: 'article',
      html: `<header class="article-header">\n  <p class="label article-kicker"><a href="/articles">Articles</a><span class="article-kicker-sep" aria-hidden="true"> / </span><span>Financial services</span></p>\n  <h1 class="display-title article-title">The Digital Front Door Nobody Walks Through</h1>\n  <p class="article-intro">Community banks have branches, lenders and local relationships. So why can Chime feel like the more complete bank?</p>\n  <p class="article-date"><time datetime="2026-09-23">September 23, 2026</time><span class="article-meta-sep" aria-hidden="true"> / </span><span>14-minute read</span></p>\n  <p class="article-byline">By <a href="/">Paul Drago</a>, advisor to banks and credit unions</p>\n</header>`,
      code: `---\ntitle: "The Digital Front Door Nobody Walks Through"\ndescription: "Community banks have branches, lenders and local relationships. So why can Chime feel like the more complete bank?"\ndate: 2026-09-23\nkicker: "Financial services"\ntopics: ["Community banking", "Digital banking", "Checking account acquisition"]\n---`,
      lang: 'yaml',
    }],
  },
  {
    id: 'author-box',
    name: 'Author box',
    level: 'organism',
    status: 'template',
    summary: 'Who wrote the piece, with the booking button, LinkedIn and email, under every article.',
    use: ['The template renders it from src/data/author.ts.'],
    avoid: ['A per-article bio.'],
    rules: ['Firsthand stories name the kind of organization, never the employer.', 'One filled button: the booking call.'],
    a11y: ['An aside labelled "About the author".'],
    classes: ['article-author', 'article-author-label', 'article-author-bio', 'article-author-links', 'article-author-link'],
    parts: ['label', 'button', 'link'],
    lint: [],
    stories: [{
      id: 'box',
      name: 'Under the article',
      wrap: 'article',
      html: `<aside class="article-author" aria-label="About the author">\n  <p class="label accent article-author-label">About the author</p>\n  <p class="article-author-bio">Paul Drago advises banks and credit unions on marketing measurement, marketing operations and market decisions.</p>\n  <p class="article-author-links"><a class="btn btn-small" href="${BOOKING}" ${CAL}>Book a 20-minute call</a> <a class="article-author-link" href="https://www.linkedin.com/in/pauldrago" target="_blank" rel="noopener noreferrer">LinkedIn</a> <a class="article-author-link" href="mailto:paul@pauldrago.com">paul@pauldrago.com</a></p>\n</aside>`,
      code: `<!-- [slug].astro renders it from src/data/author.ts; articles do not include it. -->`,
    }],
  },
  {
    id: 'site-header',
    name: 'Site header',
    level: 'organism',
    status: 'template',
    summary: 'The name and one line on every page, the two sections, and the booking button. The current section is underlined in the accent.',
    use: ['Every page. The base layout renders it; articles mark Articles as the current section.'],
    avoid: ['A second navigation inside an article.'],
    rules: ['Two links and one button: Services, Articles, Book a call.', 'The line under the name says who the site serves: "Advisor to banks and credit unions".', 'On phones the line wraps under the name and the button shrinks to 44px tall.'],
    a11y: ['A nav labelled Primary; the current section carries aria-current="page".', 'A skip link to the content comes before it.'],
    classes: ['header-inner', 'brand-home', 'brand-group', 'brand-name', 'brand-subline', 'header-actions', 'header-link'],
    parts: ['label', 'button'],
    lint: [],
    stories: [{
      id: 'article',
      name: 'On an article',
      wrap: 'page',
      html: `<header data-c="site-header">\n  <div class="container">\n    <div class="header-inner">\n      <a class="brand-home" href="/"><span class="brand-group"><span class="brand-name">Paul Drago</span><span class="brand-subline">Advisor to banks and credit unions</span></span></a>\n      <nav class="header-actions" aria-label="Primary">\n        <a class="header-link" href="/financial-services">Services</a>\n        <a class="header-link" href="/articles" aria-current="page">Articles</a>\n        <a class="btn" href="${BOOKING}" ${CAL}>Book a call</a>\n      </nav>\n    </div>\n  </div>\n</header>`,
      code: `<!-- src/layouts/Base.astro renders it on every page. -->`,
    }],
  },
  {
    id: 'site-footer',
    name: 'Site footer',
    level: 'organism',
    status: 'template',
    summary: 'The name, the links every page carries, cookie settings, and one line about the page type.',
    use: ['Every page. The base layout renders it; articles pass their own line.'],
    avoid: ['A second call to action here; the header and the booking line carry it.'],
    rules: ['Links: Home, Services, Articles, the email address, LinkedIn, Privacy, and Cookie settings.', 'The line under the rule describes the section: "Writing on marketing measurement, markets, and accountable growth."'],
    a11y: ['Cookie settings is a button, since it opens a dialog rather than a page.'],
    classes: ['footer-top', 'footer-brand', 'footer-links', 'footer-link-button', 'footer-meta'],
    lint: [],
    stories: [{
      id: 'article',
      name: 'On an article',
      wrap: 'page',
      html: `<footer>\n  <div class="container">\n    <div class="footer-top">\n      <div class="footer-brand">Paul Drago</div>\n      <div class="footer-links"><a href="/">Home</a> <a href="/financial-services">Services</a> <a href="/articles">Articles</a> <a href="mailto:paul@pauldrago.com">paul@pauldrago.com</a> <a href="https://www.linkedin.com/in/pauldrago" target="_blank" rel="noopener noreferrer">LinkedIn</a> <a href="/privacy">Privacy</a> <button type="button" class="footer-link-button">Cookie settings</button></div>\n    </div>\n    <div class="footer-meta"><div>Writing on marketing measurement, markets, and accountable growth.</div></div>\n  </div>\n</footer>`,
      code: `<!-- src/layouts/Base.astro renders it; an article passes footerNote. -->`,
    }],
  },

  // ---------------------------------------------------------------- Templates
  {
    id: 'layout-grid',
    name: 'Layout grid',
    level: 'template',
    status: 'template',
    summary: 'The grid every page sits on: four breakpoints and no others, the page and article containers, the reading column the kit answers to, the source-notes rail, and the width a calculator widens to. Change the preview width to watch it move.',
    use: ['Deciding where a layout changes: pick the lowest step on the scale where every column still reads.', 'Laying out a component: let it answer to its column with a container query.'],
    avoid: ['A media query at any other width. The linter rejects it (css-breakpoint).', 'A component that measures the screen. The same figure has to read the same in an article, a /ui frame and a narrow sidebar.'],
    rules: [
      'The page changes layout at 480, 760, 1040 and 1180, and nowhere else.',
      'Two columns sit side by side from 760, and so do three or four short items (links, fields). Three columns led by a big headline stack until 1040.',
      'A tool whose controls sit beside its result keeps them there from 760, so the reader sees the result move. A table keeps its columns from 760; below it a site ledger becomes labeled cards and an article table scrolls inside its own frame.',
      'When a layout moves down to 760, ease it inside (760px <= width < 1040px): gaps and type take a smaller step of their scale there, so 761 still reads and the wide end looks as designed. Only a fixed track width may use clamp().',
      'Write media queries in range syntax: @media (width < 760px) and @media (width >= 1040px). There is no 759 or 761. Scripts use the same queries in matchMedia and listen for changes, since a phone turned sideways crosses 760.',
      'Components answer to the column they sit in: @container column (width < 560px) is their compact form. A calculator\'s fields count from the calculator\'s own width: two across under 560px, three to 900px, then one row.',
      'The page container is var(--container-page), 1240px, with var(--gutter) inside it: 32px, 20px below 760. Articles use var(--container-article), 1060px, and a reading column of var(--measure-0), 62 characters.',
      'At 1180 and up the article gains its source-notes rail, var(--rail-gap) to the right of the column and var(--rail) wide, and pinned charts sit beside their steps.',
      'At 1040 and up a calculator widens past the column to the article container.',
      'A rule scoped to a width range has to help across the whole range. Moving a query onto the scale changes its range, so check the page at both ends of the new one.',
      'Check a layout change before and after at both sides of each step it touches (759 and 760, 1039 and 1040) and inside the tablet range at 768, 820 and 960.',
    ],
    a11y: ['The page never scrolls sideways at any width from 320px up. A wide table scrolls inside its own frame.', 'Body text steps down below 760 and never goes under 17px.'],
    classes: [],
    lint: ['css-breakpoint'],
    stories: [{ id: 'grid', name: 'The grid at this width', wrap: 'page', html: GRID_HTML }],
  },
  {
    id: 'article-page',
    name: 'Article page',
    level: 'template',
    status: 'template',
    summary: 'The page the template assembles: header, the short version, the lede, numbered sections with their figures, the booking line and the author box.',
    use: ['Start every new article from the markdown on this page.'],
    avoid: ['Copying another article\'s stylesheet, or restyling a kit device in the article\'s own file. A device the kit has comes from the kit.', 'Building a new kind of figure without asking. It is a proposal for the kit, and Paul decides whether it joins.'],
    rules: ['Front matter loads the kit: stylesheets: ["/assets/article-kit.css"] and scripts: ["/assets/article-kit.js"], with notes: rail.', 'Order: the lede, numbered sections, "Where to start" with the decisions, then "About the numbers".', 'Run npm run lint:style before building.'],
    a11y: ['One h1, headings in order, every figure named, every image described.'],
    classes: [],
    parts: ['article-header', 'short-version', 'lede', 'section-heading', 'unit-stat', 'pull-quote', 'stacked-bar', 'decisions', 'booking-line', 'author-box'],
    lint: [],
    stories: [{
      id: 'specimen',
      name: 'A specimen built from the kit',
      wrap: 'page',
      motion: true,
      html: `<article class="article">\n<div class="container">\n<header class="article-header">\n  <p class="label article-kicker"><a href="/articles">Articles</a><span class="article-kicker-sep" aria-hidden="true"> / </span><span>Financial services</span></p>\n  <h1 class="display-title article-title">The Digital Front Door Nobody Walks Through</h1>\n  <p class="article-intro">Community banks have branches, lenders and local relationships. So why can Chime feel like the more complete bank?</p>\n  <p class="article-date"><time datetime="2026-09-23">September 23, 2026</time><span class="article-meta-sep" aria-hidden="true"> / </span><span>14-minute read</span></p>\n</header>\n<div class="article-body" data-notes="custom">\n<aside class="article-brief" aria-label="The short version"><p class="label accent article-brief-label">The short version</p><ol><li>Community banks built the digital front door. In 2024 they took 4 of every 100 new checking accounts.</li><li>What changes: one senior owner for the younger-customer proposition, a scorecard that measures the relationship, and one journey run as a single product for a quarter.</li></ol></aside>\n<p class="article-lede">For most of a decade, community banks heard the same prescription. Make account opening digital. Put the bank in the customer's pocket.</p>\n<h2 id="the-48-star-trap">The 4.8-star trap</h2>\n<p class="pd-deck">Everyone's app is fine. Fine is where everyone already is.</p>\n<p>Ask a community bank executive about the mobile experience and the answer is usually reassuring. The app is pretty good. It has 4.8 stars.</p>\n${units(UNITS_DEMO)}\n<blockquote><p>Every department can be competent, every dashboard can be green, and the customer proposition can still be mediocre.</p></blockquote>\n<h3 id="what-the-customer-is-worth">What the customer is worth</h3>\n${stack(STACK_DEMO)}\n<h2 id="where-to-start">Somebody has to own the whole bank</h2>\n<p class="pd-deck">Where to start.</p>\n<ol class="pd-decisions"><li><strong>Someone owns the proposition.</strong> Give a senior leader responsibility for the chosen younger-customer proposition across product, digital, retail and marketing.</li><li><strong>Start with one journey.</strong> Take the first paycheck arriving in a newly opened account and manage the surrounding experience as a single product for one quarter.</li></ol>\n<p class="article-cta">If you want to see this with your organization's own numbers, <a href="${BOOKING}">book twenty minutes</a>.</p>\n</div>\n</div>\n</article>`,
      code: `---\ntitle: "Your Title in Title Case"\ndescription: "One or two sentences that state the argument. They double as the search snippet."\ndate: 2026-10-15\ndraft: true\nkicker: "Financial services"\ntopics: ["Community banking"]\nnotes: "rail"\nstylesheets: ["/assets/article-kit.css"]\nscripts: ["/assets/article-kit.js"]\nbrief:\n  - "The finding, with its number."\n  - "What changes: the changes, in one sentence."\n---\n\nThe opening paragraph: the situation the piece starts from. It takes the drop cap.\n\n## A section heading that states a claim\n\n<p class="pd-deck">One line that says what this section finds.</p>\n\nBody paragraphs in markdown, with footnotes.[^1]\n\n> The line a reader should carry out of the section.\n\n## Somebody has to own it\n\n<p class="pd-deck">Where to start.</p>\n\n<ol class="pd-decisions">\n<li><strong>The first change.</strong> What it involves and who has the authority.</li>\n</ol>\n\n## About the numbers\n\nWhen the research was checked, and which figures are estimates.\n\n[^1]: **Publisher.** Title, date. What was measured. What it does not show. [Report title](https://example.com)`,
      lang: 'markdown',
    }],
  },
];

// Smallest first, so the pager walks atoms, then molecules, organisms and templates, and a class two
// entries list belongs to the smaller one. The sort is stable, so each level keeps its order above.
const LEVEL_ORDER = Object.fromEntries(LEVELS.map((l, i) => [l.id, i]));
COMPONENTS.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

/** What a component is built from, and what is built from it. */
export const partsOf = (c) => (c.parts ?? []).map((id) => COMPONENTS.find((x) => x.id === id)).filter(Boolean);
export const usedIn = (id) => COMPONENTS.filter((c) => (c.parts ?? []).includes(id));

// Devices that identify a piece. The spacing rule warns when one appears in two consecutive
// articles or in two articles less than a month apart. `classes` are how the linter finds them;
// the fd-, cd- and pd- names of one device count as the same device.
export const SIGNATURE_DEVICES = [
  { id: 'unit-stat', name: 'Unit stats', article: 'the-digital-front-door-nobody-walks-through', classes: ['pd-units', 'fd-stat'] },
  { id: 'pinned-sequence', name: 'Pinned sequences', article: 'the-digital-front-door-nobody-walks-through', classes: ['pd-scrolly', 'fd-scrolly'] },
  { id: 'dialogue', name: 'Scripted dialogue', article: 'the-digital-front-door-nobody-walks-through', classes: ['pd-dialogue', 'fd-dialogue', 'cd-dialogue'] },
  { id: 'unit-grid', name: 'Unit grids', article: 'the-digital-front-door-nobody-walks-through', classes: ['pd-grid', 'fd-opener-units', 'fd-grid-cells'] },
  { id: 'org-fold', name: 'The org fold', article: 'the-digital-front-door-nobody-walks-through', classes: ['pd-fold', 'fd-g-org'] },
  { id: 'record-card', name: 'Record cards', article: 'your-content-has-no-parent', classes: ['pd-record', 'cd-record'] },
  { id: 'small-multiples', name: 'Small multiples', article: 'your-content-has-no-parent', classes: ['cd-markets'] },
  { id: 'as-of', name: 'The as-of date slider', article: 'your-content-has-no-parent', classes: ['pd-asof'], selector: 'data-cd="asof"' },
  { id: 'chain', name: 'The content chain self-check', article: 'your-content-has-no-parent', classes: [], selector: 'data-cd="focus"' },
  { id: 'source-map', name: 'The source-to-sentence map', article: 'your-content-has-no-parent', classes: [], selector: 'data-cd="graph"' },
];

// Classes from articles written before the kit, and what happens to each. Paul's rule
// (2026-09-26): a device that repeats something we already built, in other classes or another
// form, moves onto the kit. A device that shows something new, a new visualization or a new type
// of information, is a proposal for the kit, and adding it is Paul's decision.
//   kind 'equivalent'  the same device: rebuild it from the kit component's snippet.
//   kind 'derivative'  the same information in another form: rebuild it on `kit`. `how` says how;
//                      `alt` lists other kit components that fit some cases; `gap` names what the
//                      kit component still lacks for it (a decision when it adds something visible).
//   kind 'novel'       new to the kit: ask Paul. `proposal` is the component it could become, and
//                      `otherwise` is where its content goes if he says no.
//   kind 'declined'    new, and Paul said no: use `how`, the fallback he chose.
//   kind 'remove'      does nothing: delete it.
// `match` tests a class. `attr` tests a figure's opening tag, for devices that share one frame
// and differ only by a data attribute; the audit checks `attr` entries first. The front door's
// fd- classes are the source the kit was taken from, so each has an equivalent.
export const LEGACY = [
  { match: '^fd-deck$', kind: 'equivalent', kit: 'deck' },
  { match: '^fd-eyebrow$', kind: 'equivalent', kit: 'eyebrow', part: true },
  { match: '^fd-figure$', kind: 'equivalent', kit: 'caption', part: true, note: 'The figure frame is pd-figure.' },
  { match: '^fd-pq$', kind: 'equivalent', kit: 'pull-quote', note: 'A markdown blockquote.' },
  { match: '^fd-pull$', kind: 'equivalent', kit: 'pull-quote', note: 'pd-pull inside a pinned step.' },
  { match: '^fd-stat', kind: 'equivalent', kit: 'unit-stat' },
  { match: '^fd-(scrolly|steps|step|sticky|sticky-notes|graphic)$', kind: 'equivalent', kit: 'pinned-sequence' },
  { match: '^fd-(g-math|g-bar|g-track|g-seg|g-cac|g-ledger|g-row|g-balance|g-payback)', kind: 'equivalent', kit: 'stacked-bar' },
  { match: '^fd-(g-timeline|tl-)', kind: 'equivalent', kit: 'rising-columns' },
  { match: '^fd-(g-org|org|one)', kind: 'equivalent', kit: 'org-fold' },
  { match: '^fd-(calc|field|input|affix|ledger|bar|durbin|toggle|accent)', kind: 'equivalent', kit: 'calculator' },
  { match: '^fd-(dialogue|who|bank|cust)$', kind: 'equivalent', kit: 'dialogue' },
  { match: '^fd-decisions$', kind: 'equivalent', kit: 'decisions' },
  { match: '^fd-(img|illo)', kind: 'equivalent', kit: 'illustration' },
  { match: '^fd-(grid|opener|cell|legend|swatch)', kind: 'equivalent', kit: 'unit-grid' },
  { match: '^fd-wide$', kind: 'remove', name: 'Wide figure class', why: 'No stylesheet defines it, so it does nothing; the kit widens a calculator or pinned sequence on its own.' },

  // Script-drawn figures in "Your Content Has No Parent" share one frame and differ by data-cd.
  { attr: 'data-cd="calc"', kind: 'equivalent', kit: 'calculator', note: 'Rebuild the formulas with data-define and keep data-rail="block".' },
  { attr: 'data-cd="asof"', kind: 'equivalent', kit: 'as-of', note: 'Paul added it to the kit on 2026-09-26. Rebuild it with asof() in build.mjs: the versions go in the HTML and the kit script adds the slider.' },
  { attr: 'data-cd="focus"', kind: 'declined', name: 'Self-check', why: 'Paul decided on 2026-09-26 not to add it to the kit.', how: 'Cut it, and let the decisions close the piece.' },
  { attr: 'data-cd="graph"', kind: 'declined', name: 'Source map', why: 'Paul decided on 2026-09-26 not to add it to the kit.', how: 'Cut it; the footnotes carry the sources. Move any sentence the article needs into About the numbers.' },

  { match: '^cd-deck$', kind: 'equivalent', kit: 'deck' },
  { match: '^cd-img$', kind: 'equivalent', kit: 'illustration' },
  { match: '^cd-actions$', kind: 'equivalent', kit: 'decisions' },
  { match: '^cd-widget-title$', kind: 'equivalent', kit: 'eyebrow', part: true },
  { match: '^cd-widget(-stage|-fallback)?$', kind: 'equivalent', kit: 'caption', part: true, note: 'The frame of a script-drawn figure is pd-figure; each figure is sorted on its own under Figures.' },
  { match: '^cd-(seg|btn|link-btn|opt)$', kind: 'equivalent', kit: 'toggle', part: true },
  { match: '^cd-(calc|field|input-wrap|affix|lane|total)', kind: 'equivalent', kit: 'calculator', note: 'Rebuild the formulas with data-define and keep data-rail="block".' },
  { match: '^cd-bars', kind: 'derivative', name: 'Static bar chart', kit: 'stacked-bar', alt: ['unit-stat'],
    why: 'The same bars the kit draws, without the build.',
    how: 'One bar per row on one scale, one segment each, with the accent on the row the text is about. Set the unit with the builder\'s prefix and suffix (%, weeks, million). A row given as a range (60 to 70%, 3 to 5) takes `to` for the range segment. The title becomes the eyebrow and the sub line the stack sub.' },
  { match: '^cd-tl', kind: 'derivative', name: 'Static timeline', kit: 'stacked-bar', alt: ['rising-columns', 'pinned-sequence'],
    why: 'Durations side by side, which the kit draws as bars.',
    how: 'One bar per case in the unit the text uses (weeks), on one scale; a duration given as a range (two to three months) takes `to` for the range segment. Rising columns fit six or more periods; a pinned sequence fits a story told in steps.' },
  { match: '^cd-stat$', kind: 'derivative', name: 'Stat line', kit: 'ledger',
    why: 'Arithmetic in a line, which the kit shows in a ledger.',
    how: 'The result is a ledger row with the arithmetic in pd-ledger-src. Next to a calculator, it becomes a row of the calculator\'s ledger.' },
  { match: '^cd-record', kind: 'equivalent', kit: 'record', note: 'Paul added it to the kit on 2026-09-26. Rebuild it with record() in build.mjs; the source line under it becomes the figcaption.' },
  { match: '^(cd-markets|cd-sheet|cd-slot|k$)', kind: 'declined', name: 'Small multiples', why: 'Paul decided on 2026-09-26 not to add it to the kit.', how: 'A table (/ui/components/table) with the cases as columns and the slots as rows; each cell names the status and the owner, which replaces the colour key.' },
  { match: '^cd-(fold|parts)', kind: 'equivalent', kit: 'calculator', part: true, note: 'The calculator fold (pd-calc-more), added to the kit on 2026-09-26.' },
  { match: '^cd-(focus|map|asof|answer|chain|rep)', kind: 'declined', part: true, name: 'Parts of a script-drawn figure', why: 'Drawn by the article\'s own script.', how: 'They go with their figure; see Figures for what each one becomes.' },
];

export function legacyFor(cls) {
  return LEGACY.find((l) => l.match && new RegExp(l.match).test(cls)) ?? null;
}

/** The LEGACY entry for a figure whose opening tag carries a distinguishing attribute. */
export function legacyForTag(tag) {
  return LEGACY.find((l) => l.attr && tag.includes(l.attr)) ?? null;
}

export const byId = (id) => COMPONENTS.find((c) => c.id === id);
