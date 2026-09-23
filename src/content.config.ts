import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    kicker: z.string().optional(),
    topics: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
    ogImageAlt: z.string().optional(),
    opener: z.string().optional(),
    stylesheets: z.array(z.string()).default([]),
    scripts: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
