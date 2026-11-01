# bcruz97 — Bernardo Cruz

Bernardo Cruz’s personal blog. Built with Astro, with the supplied logo, responsive layouts, search, and an RSS feed.

## Run locally

```sh
npm install
npm run dev
```

If your computer reaches its file watcher limit, use `CHOKIDAR_USEPOLLING=true npm run dev`.

## Write a post

Add a Markdown file in `src/content/blog/`, for example `my-first-story.md`:

```md
---
title: "My first story"
description: "A short introduction to this entry."
pubDate: "2026-11-01"
readingTime: 3
draft: false
---

Your story starts here.
```

Set `draft: true` to hide a post from the site, direct article routes, and RSS. Home shows the three latest entries.

## Personalize

- Home: `src/pages/index.astro`
- About: `src/pages/about.astro`
- Site title and description: `src/consts.ts`
- Colors, typography, and responsive layouts: `src/styles/global.css`
- Logo: `public/logo.png`
- Canonical site URL and sitemap: `astro.config.mjs` (update when connecting a custom domain)

## Verify and publish

```sh
npm run build
npx tsc --noEmit
```

The existing Cloudflare setup is retained. `npm run check` also performs a Cloudflare deployment dry run; `npm run deploy` publishes to the configured Cloudflare account. Sites publication uses the project identity in `.openai/hosting.json` and the Sites source workflow. All current pages are prerendered, so Sites hosts the generated `dist` assets.
