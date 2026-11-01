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

## YouTube videos

In Pages CMS, put a YouTube link in its own paragraph, with a blank line before and after it:

```md
Here is the video I’m talking about:

https://www.youtube.com/watch?v=M7lc1UVf-VE

And here are my thoughts on it.
```

The blog turns the standalone link into a responsive video player. Regular watch links, `youtu.be` share links, Shorts, and live video links work. Shared timestamps are preserved. You can add several videos in one post. Links inside sentences stay as ordinary links.

Pages CMS may show a link rather than the player while editing; the video player appears on the blog after building. No video upload or API key is needed. Some videos have embedding disabled by their owner; the “Watch on YouTube” link remains available.

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
