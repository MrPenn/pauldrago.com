import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { must } from '../data/must.ts';

export async function GET(context: APIContext) {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: 'Paul Drago, articles',
    description: 'Essays on bank marketing measurement, market expansion, acquisitions, and marketing leadership.',
    site: must(context.site, 'the site address in astro.config.ts'),
    // Item links match the canonical URLs, which have no trailing slash.
    trailingSlash: false,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.date,
      link: `/articles/${a.id}`,
    })),
  });
}
