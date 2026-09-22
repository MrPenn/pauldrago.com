---
title: "Example article"
description: "A draft that shows the front matter an article needs. Set draft to false to publish."
date: 2026-09-22
draft: true
---

Articles are markdown files in `src/content/articles`. The file name becomes the URL, so this file would publish at `/articles/example-article`.

The front matter needs a title, a description, and a date. `updated` is optional. While `draft` is true the article is left out of the index, the feed, and the sitemap.

## Headings use two hashes

Body copy is plain markdown. Links, lists, and block quotes are styled. Images go in `public/assets` and are referenced as `/assets/name.png`.
