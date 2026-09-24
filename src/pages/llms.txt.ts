// llms.txt: a plain-text guide to the site for AI models (https://llmstxt.org), built from the
// same pages and articles as the sitemap so it never goes stale.
import { getCollection } from 'astro:content';

const SITE = 'https://pauldrago.com';

export async function GET() {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const body = `# Paul Drago

> Paul Drago advises banks and credit unions on marketing measurement, marketing operations, and market decisions. He works through Glass Vase, LLC, his advisory company, and spent eight years in digital and marketing at a community bank holding company.

Services are for U.S. banks and credit unions. Engagements are scoped on a 20-minute introductory call, booked from any page on the site, or by email to paul@pauldrago.com.

## Services

- [Services overview](${SITE}/financial-services): marketing measurement, branch and market analysis, acquisition footprint analysis, and fractional CMO leadership.
- [Marketing Measurement Reset](${SITE}/marketing-measurement-reset): connects acquisition spend to retained accounts, funded balances, and board reporting in four to six weeks.
- [Branch and Market Expansion Analysis](${SITE}/branch-market-expansion-analysis): compares markets on deposits, customer geography, branch economics, CRA context, and fair-access risk, and turns the result into a five-year branch plan. [Sample plan](${SITE}/branch-market-expansion-analysis/sample-plan) for a hypothetical Dallas bank on public data.
- [Acquisition and Footprint Analysis](${SITE}/acquisition-footprint-analysis): separates what an acquisition target adds from branch overlap, attrition, and concentration risk.
- [Fractional CMO for Regulated Financial Services](${SITE}/fractional-cmo-financial-services): senior marketing leadership on a monthly retainer, six-month minimum.

## Articles

${articles.map((a) => `- [${a.data.title}](${SITE}/articles/${a.id}): ${a.data.description}`).join('\n')}

## About this site

- [Privacy notice](${SITE}/privacy): what the site collects, why, and visitors' choices.
- [Sitemap](${SITE}/sitemap-index.xml)
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
