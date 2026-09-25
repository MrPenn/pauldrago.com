import type { Registry } from './types';

// "Your Content Has No Parent": every figure, rule, story and term the article reuses.
// `sources` are the article's footnote numbers. `match` lists the spellings the text may use.
export const YOUR_CONTENT_HAS_NO_PARENT: Registry = {
  article: 'your-content-has-no-parent',
  components: [
    // Stories and the article's own terms
    { id: 'postcard', kind: 'story', label: 'The postcard', status: 'firsthand' },
    { id: 'plane', kind: 'story', label: "The reviewer's plane", status: 'firsthand' },
    { id: 'mexico', kind: 'story', label: 'The Mexico disclosure', status: 'firsthand' },
    { id: 'march-14', kind: 'story', label: 'March 14', status: 'hypothetical', note: 'An invented date standing in for any day a regulator asks about.' },
    { id: 'lineage', kind: 'term', label: 'Lineage', status: 'sourced', sources: [7] },
    { id: 'version-history', kind: 'term', label: 'Version history', status: 'sourced', sources: [8] },
    { id: 'master-data', kind: 'term', label: 'Master data', status: 'firsthand', note: 'Standard data vocabulary; applying it to content is the author\'s analysis.' },
    { id: 'pipeline', kind: 'term', label: 'The chain as a pipeline', status: 'firsthand' },
    { id: 'dark-content', kind: 'term', label: 'Dark content', status: 'sourced', sources: [21] },
    { id: 'triage', kind: 'term', label: 'Triage at intake', status: 'firsthand' },
    { id: 'variant-lane', kind: 'term', label: 'The variant lane', status: 'firsthand' },
    { id: 'twenty-components', kind: 'term', label: 'Model 20 components', status: 'firsthand', match: ['20 components'] },

    // The author's own observations
    { id: 'routine-wait', kind: 'figure', label: 'One to two months per routine asset', status: 'firsthand', match: ['one to two months'] },
    { id: 'audited-reuse', kind: 'figure', label: 'A fifth to two fifths reused', status: 'firsthand', match: ['a fifth and two fifths'] },

    // Surveys and measured data
    { id: 'adobe-approval-stages', kind: 'figure', label: 'Three or more approval stages', value: '89%', status: 'sourced', sources: [1], match: ['89%'] },
    { id: 'adobe-review-time', kind: 'figure', label: 'Over 40% of time on reviews', value: '58%', status: 'sourced', sources: [1], match: ['58%'] },
    { id: 'adobe-people', kind: 'figure', label: '51 to 200 people per asset', value: '47%', status: 'sourced', sources: [1], match: ['47%'] },
    { id: 'adobe-asset-volume', kind: 'figure', label: 'At least 1,000 assets a year', value: '70%', status: 'sourced', sources: [1], match: ['70 percent'] },
    { id: 'review-versions', kind: 'figure', label: 'Marketing review versions', value: '4 versions (Filestage); 3 to 5, 6 or more (Ziflow)', status: 'sourced', sources: [2, 10], match: ['3 to 5', 'six or more', '6 or more', '4 versions', '4 to 6'] },
    { id: 'ziflow-compliance', kind: 'figure', label: 'Compliance issues from review', value: '88%', status: 'sourced', sources: [2], match: ['88%'] },
    {
      id: 'creativex-unactivated', kind: 'figure', label: 'Core assets never activated', value: '52%', status: 'sourced', sources: [3], match: ['52', 'half'],
      versions: [
        { value: '90 percent of toolkits unused', from: '2026-09-01', to: '2026-09-23', note: 'Earlier draft, from a secondary report of a different cut.' },
        { value: '52 percent', from: '2026-09-23', note: 'CreativeX primary analysis.' },
      ],
    },
    { id: 'gartner-ai-ready', kind: 'figure', label: 'Data practices not ready for AI', value: '63%', status: 'sourced', sources: [6], match: ['63 percent', '60 percent'] },
    { id: 'veeva-approval-days', kind: 'figure', label: 'Pharma approval time', value: '21 days', status: 'sourced', sources: [9], match: ['21 days'] },
    { id: 'veeva-review-cycles', kind: 'figure', label: 'Pharma review cycles per asset', value: '1.3', status: 'sourced', sources: [9], match: ['1.3'] },
    { id: 'veeva-modular-results', kind: 'figure', label: 'Modular content early results', value: '+40% reuse', status: 'sourced', sources: [11], match: ['40'] },
    { id: 'sanofi-breakdown', kind: 'figure', label: 'Three weeks to market', value: '3 weeks', status: 'sourced', sources: [12], match: ['three weeks'] },
    { id: 'veeva-2016-traceability', kind: 'figure', label: 'Could not trace claims, 2016', value: '81%', status: 'sourced', sources: [13], match: ['81 percent'] },
    {
      id: 'veeva-unused', kind: 'figure', label: 'Approved content rarely used', value: 'nearly 80%', status: 'sourced', sources: [14], match: ['77', '80'],
      versions: [
        { value: '77 percent', from: '2023-04-04', to: '2025-05-29', note: 'Veeva Pulse Field Trends, Q4 2022.' },
        { value: 'nearly 80 percent', from: '2025-05-29', note: 'Veeva Pulse, 2025.' },
      ],
    },
    { id: 'splunk-dark-data', kind: 'figure', label: 'Share of data that is dark', value: '55%', status: 'sourced', sources: [22], match: ['55 percent'] },
    { id: 'translation-throughput', kind: 'figure', label: 'Translation words per hour', value: '1,100 / 2,460', status: 'sourced', sources: [23], match: ['1,100', '2,460', '60%', '2.2x'] },
    { id: 'csa-own-language', kind: 'figure', label: 'Prefer their own language', value: '76%', status: 'sourced', sources: [24], match: ['76 percent'] },
    { id: 'typeface-speed', kind: 'figure', label: 'Campaigns taking one to two months', value: '34%', status: 'sourced', sources: [27], match: ['34', '92', 'Typeface'] },
    { id: 'cmi-ai-use', kind: 'figure', label: 'B2B teams using AI', value: '95%', status: 'sourced', sources: [28], match: ['95 percent'] },
    { id: 'gartner-cmo-ai', kind: 'figure', label: 'Marketing budget on AI', value: '15.3%', status: 'sourced', sources: [29], match: ['15.3 percent'] },

    // Rules and enforcement
    { id: 'finra-2210', kind: 'rule', label: 'FINRA Rule 2210', status: 'sourced', sources: [15] },
    { id: 'sec-17a-4', kind: 'rule', label: 'SEC Rule 17a-4', status: 'sourced', sources: [15] },
    { id: 'advisers-204-2', kind: 'rule', label: 'Advisers Act 204-2', status: 'sourced', sources: [15] },
    { id: 'fdic-328', kind: 'rule', label: 'FDIC Part 328', status: 'sourced', sources: [15] },
    { id: 'reg-dd', kind: 'rule', label: 'Regulation DD', status: 'sourced', sources: [16] },
    { id: 'reg-z', kind: 'rule', label: 'Regulation Z', status: 'sourced', sources: [17] },
    { id: 'cfpb-lep', kind: 'rule', label: 'CFPB statement on limited English', status: 'sourced', sources: [38] },
    { id: 'h2c-fine', kind: 'figure', label: 'H2C Securities fine', value: '$250,000', status: 'sourced', sources: [18], match: ['$250,000', 'H2C'] },
    { id: 'm1-fine', kind: 'figure', label: 'M1 Finance fine', value: '$850,000', status: 'sourced', sources: [19], match: ['$850,000'] },
    { id: 'off-channel-sweep', kind: 'figure', label: 'Off-channel recordkeeping penalties', value: '$2 billion', status: 'sourced', sources: [20], match: ['$2 billion'] },


    // The worked example: three placeholders and what they produce
    { id: 'worked-assets', kind: 'figure', label: 'Assets a year', value: '5,000', status: 'placeholder', derivedFrom: ['adobe-asset-volume'], match: ['5,000'], note: 'A conservative volume informed by Adobe; replace with your own.' },
    { id: 'worked-lineage', kind: 'figure', label: 'Share with a parent on file', value: '40%', status: 'placeholder', derivedFrom: ['creativex-unactivated', 'veeva-unused'], match: ['40 percent', '60%'], note: 'A generous guess for a shop that has never recorded parents; replace with your own.' },
    { id: 'worked-cost', kind: 'figure', label: 'Cost per asset', value: '$1,800', status: 'placeholder', match: ['$1,800'], note: 'No public benchmark exists; finance builds this number.' },
    { id: 'dark-content-cost', kind: 'figure', label: 'Spent outside the system', value: '$5.4 million', status: 'derived', derivedFrom: ['worked-assets', 'worked-lineage', 'worked-cost'], match: ['$5.4 million'] },

    // Orphans: figures in circulation that the article names and refuses to use
    { id: 'folklore-60-70', kind: 'figure', label: '60 to 70% of B2B content unused', status: 'orphan', note: 'A 2013 conference remark; no method or sample was ever published.' },
    { id: 'folklore-80-dark', kind: 'figure', label: '80% of data is dark', status: 'orphan', note: 'Traces to a 1998 analyst estimate about unstructured data.' },
    { id: 'folklore-gartner-share', kind: 'figure', label: 'A Gartner dark-data percentage', status: 'orphan', note: 'Gartner publishes no percentage.' },
  ],
};
