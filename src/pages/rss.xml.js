import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date - a.data.date);
  return rss({
    title: 'Paul Drago, articles',
    description: 'Essays on bank marketing measurement, market expansion, acquisitions, and marketing leadership.',
    site: context.site,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.date,
      link: `/articles/${a.id}`,
    })),
  });
}
