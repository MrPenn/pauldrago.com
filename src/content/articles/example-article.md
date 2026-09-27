---
title: "Example Article"
description: "A draft that shows what a new article needs: front matter, the kit stylesheet, a numbered section with its deck. Copy it to start a piece."
date: 2026-09-22
draft: true
kicker: "Example"
stylesheets: ["/assets/article-kit.css"]
scripts: ["/assets/article-kit.js"]
brief:
  - 'Articles are markdown files in src/content/articles, and the file name becomes the URL.'
  - 'The front matter carries the title, the description, the date and these points, which print as the short version.'
  - 'Components come from the article kit. The styleguide at /ui has the HTML for each one and the rules the linter checks.'
---

Articles are markdown files in `src/content/articles`. The file name becomes the URL, so this file would publish at `/articles/example-article`. While `draft` is true the article is left out of the index, the feed and the sitemap; `npm run build:drafts` builds it for a preview.

## Every section opens with a claim

<p class="pd-deck">The heading states what the section argues, and the deck under it states what the section finds.</p>

Body copy is plain markdown. Figures are raw HTML from the styleguide at `/ui`: paste the snippet, keep it free of blank lines, give it a figcaption that says who measured it, and cite the full source as a footnote from the text. Images go in `public/assets` as a light and a dark WebP of the same shape.

Run `npm run lint:style` before building. It checks the front matter, the headings, every chart's scale, the images and the classes against the rules at `/ui/lint`.
