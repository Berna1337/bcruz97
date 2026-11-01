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

## Categories

The optional **Category** field in Pages CMS groups related posts, such as `Gaming`, `Food`, or `Development`. You can enter any category; use consistent names for related posts. Leave it blank for an uncategorized post.

Categories appear beside each post and as filters on the Blog page once posts are published. Filters and text search work together. Click a category on an article to see related writing, or share a filtered URL such as `/blog/?category=Gaming`. Draft-only categories stay out of the public filters.

## Private draft previews

Drafts have a password-protected preview area at `https://bcruz97.com/preview/`. It uses the same article layout and YouTube embeds as public posts.

### One-time setup

Set a unique password of at least 16 characters using Cloudflare’s secret prompt (do not put it in Git or paste it into chat):

```sh
npx wrangler secret put PREVIEW_PASSWORD
npm run deploy
```

The password stays in Cloudflare. Changing it signs out existing sessions. Preview pages remain unavailable if the password is missing or shorter than 16 characters. Sign-in attempts are throttled using a Workers rate limiting binding.

### From your phone

1. Save the post in Pages CMS with **Draft** enabled.
2. Wait for the connected Cloudflare build to finish successfully. Without Git auto-deployment, deploy the latest repository changes manually.
3. Open `/preview/`, sign in, and select the draft.
4. After reviewing it, turn **Draft** off in Pages CMS and save. The next successful deployment publishes it.

The browser remembers the preview sign-in for seven days. You can sign out on the draft list. Draft text is excluded from public blog routes, RSS, and the sitemap. Preview responses are never cached and are marked `noindex`.

This protects the preview pages, not the source repository: drafts saved to a public GitHub repository are still publicly readable there. Uploaded files in `public/images` also have public URLs. Use a private repository for confidential drafts.

### Local preview development

Create an ignored `.dev.vars` file containing `PREVIEW_PASSWORD="your-long-local-test-password"`. Then run `npm run preview` to test the built Worker locally. Do not commit that file. `npx wrangler types` regenerates the rate limiting binding types when the Worker configuration changes.

## Thumbnails, images, and audio

Pages CMS has a **Post thumbnail** upload field and a **Thumbnail description** for accessible image text. The thumbnail appears in the post header, post lists, and sharing previews. Leave it empty for a text-only post. Use the body editor’s image control to add images within the writing.

The optional **Audio clip above post** field uploads MP3, M4A, OGG, or WAV files and adds a player above the writing. For clips anywhere in the body, upload them in **Media → Audio**, copy the public URL (such as `/audio/my-clip.mp3`), and paste it in its own paragraph. Each link becomes a player with controls and a download link. You can use several clips; none autoplay. Images are stored in `public/images`; audio is stored in `public/audio`.

The draft `a-small-experiment.md` tests these features with the site logo and a generated three-second test sound. It stays a draft. Uploaded media files have public URLs, even when the post itself is a draft.

### Place media between paragraphs

In Pages CMS, put the cursor where the image belongs and use the image button. Add a description for the image. In Markdown source, the equivalent is:

```md
A paragraph before the image.

![A description of the image](/images/my-image.jpg)

A paragraph before an audio clip.

[Listen to this clip](/audio/my-clip.mp3)

A paragraph after the audio clip.
```

Standalone image URLs and audio URLs also embed automatically. Links within a sentence stay as ordinary links. MP3, M4A, OGG, and WAV audio files are supported, including HTTPS links. For inline audio, leave **Audio clip above post** empty to avoid a second player at the top. The rich-text editor may show the audio link; the player appears in the built blog and draft preview.

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

The existing Cloudflare setup is retained. `npm run check` also performs a Cloudflare deployment dry run; `npm run deploy` publishes to the configured Cloudflare account. Sites publication uses the project identity in `.openai/hosting.json` and the Sites source workflow. Public pages are prerendered. Private preview routes require the Cloudflare Worker at runtime and must not be published as a static-only export.
