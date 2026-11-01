# bcruz97 — Bernardo Cruz

A personal blog built with Astro, Pages CMS, and Cloudflare Workers.

## Writing from your phone

1. Open the repository in Pages CMS and select the **preview** branch.
2. Create or edit a post. Keep **Draft** enabled while writing, then save.
3. GitHub Actions builds the private preview. Wait for **Deploy private preview** to finish.
4. Open https://bcruz97-preview.bcruz97.workers.dev and sign in. Browse the normal site: it includes drafts, labelled **Draft**, alongside published posts.
5. When ready, turn **Draft** off and save. Check the preview, then use **Open publishing pull request** in Pages CMS.
6. Review and merge the pull request on GitHub. Cloudflare Builds deploys `main` to https://bcruz97.com.

Merging a post with Draft still enabled keeps it unpublished. Saving on `main` bypasses this review flow and triggers the existing production deployment. Reading time is calculated from the writing, so there is no reading-time field to maintain.

The CMS **Rebuild private preview** action retries a preview deployment if needed. Both CMS actions run only on the `preview` branch. They require the workflows to have been merged into the default branch first. GitHub must allow the Pages CMS app to dispatch workflows.

## One-time preview setup

The separate Worker has a stable URL and protects **every request**, including HTML, RSS, images, audio and video. It uses the existing password mechanism, signed seven-day cookies, login throttling, no-cache responses and `noindex`. Missing or short passwords fail closed. Changing the password signs out existing sessions.

1. Commit these changes to `main`, then create a `preview` branch from it on GitHub (or `git switch -c preview` and `git push -u origin preview`).
2. In GitHub **Settings → Secrets and variables → Actions**, add:
   - `CLOUDFLARE_API_TOKEN`: a Cloudflare **Edit Cloudflare Workers** API token, scoped to your account. Do not use your global API key.
   - `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.
   - `PREVIEW_PASSWORD`: the same password you use now, at least 16 characters long. Cloudflare secrets cannot be read back or copied automatically, so enter the value yourself here. Never commit it.
3. In GitHub **Settings → Actions → General**, enable **Allow GitHub Actions to create and approve pull requests** for the CMS publishing button. The workflow only opens a request; it never approves or merges it.
4. Keep the existing Cloudflare Builds connection deploying **main**. Disable its non-production/preview branch builds: GitHub Actions handles the separate preview Worker, avoiding duplicate deployments.
5. Push to `preview` or run **Deploy private preview** manually with `preview` selected. The workflow deploys `bcruz97-preview` and sets its password from the GitHub secret. On first deployment it returns 503 until that secret is set.

Production stays on the existing Cloudflare build flow; no second production deployment workflow is added. The old `/preview/` address redirects to the separate preview site. Old per-post `/preview/...` URLs are retired; preview articles now use the same `/blog/...` paths as production.

The preview Worker uses Workers Free allowances if your account is on Free. Password checks run for every request, including media requests, and count against your account's Workers request allowance. There is no paid image service or storage service involved. See [Cloudflare pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [limits](https://developers.cloudflare.com/workers/platform/limits/).

The repository remains public: draft Markdown and uploaded originals committed to GitHub are publicly readable there. Preview protection does not make Git history private. Files merged into production's `public/` directory also get public URLs.

## Categories

Choose a category from the post's **Category** field. To add a new one, open **Categories** in Pages CMS, create an entry, and save; it becomes available to other posts. This keeps names consistent without fixing the blog to a set of topics. Leave the field blank if no category fits.

Published categories appear as filters on the Blog page and links on articles. Search and category filters work together. A filtered URL such as `/blog/?category=Gaming` can be shared. Draft-only categories appear only on the private preview.

## Images and thumbnails

Use **Post thumbnail** and **Thumbnail description** for the post header and list image. Use the body editor's image button to put images anywhere in the writing.

Builds automatically create WebP versions of local JPEG, PNG, WebP and AVIF images, up to 320, 768 and 1440 pixels wide. Browsers select a suitable size for thumbnails and article images; dimensions prevent layout jumps. Originals remain unchanged. Animated GIFs, SVGs and remote images are preserved. Generated variants are ignored by Git and recreated during each build.

## Audio, video and YouTube

Upload under **Media → Audio** or **Media → Video clips**, copy the URL, then put a link in its own paragraph:

```md
A paragraph before the clip.

[Listen to this clip](/audio/my-clip.mp3)

[Watch this clip](/videos/my-clip.mp4)

![A description of the image](/images/my-image.jpg)

https://www.youtube.com/watch?v=M7lc1UVf-VE
```

Audio supports MP3, M4A, OGG and WAV. Video clips support MP4 and WebM; MP4 with H.264/AAC is a practical choice for phones. Players have controls and never autoplay. For video accessibility, include a description/transcript in the writing, and captions in the video where appropriate. Use YouTube for longer videos.

Every uploaded file must be at most **25 MiB**, Cloudflare's per-asset limit. The build fails with the filename if a file is too large; compress it and upload again. Large original photos also count toward this limit even though readers get optimized versions.

Standalone HTTPS media links work too. Links inside sentences remain ordinary links. Pages CMS may show links instead of players; use the preview to check the result. The optional **Audio clip above post** field remains available; leave it empty when using inline audio to avoid duplication.

## Local development and verification

```sh
npm ci
npm run dev
```

For the complete private preview, create an ignored `.dev.vars` file with a local test password:

```dotenv
PREVIEW_PASSWORD="a-long-local-test-password"
```

Then run `npm run preview:site`. `npm run preview` still runs the production build locally.

```sh
npm run check
npm run build:preview
node scripts/verify-builds.mjs
npx wrangler deploy --config wrangler.preview.json --dry-run
```

`npm test` checks reading-time calculation, media embedding and preview authentication, including direct asset protection. The GitHub check workflow builds both variants and verifies draft separation. Regenerate Worker types with `npm run cf-typegen` after changing bindings; the preview Worker declares its smaller environment separately.

Manual deployments: `npm run deploy` for production; `npm run deploy:preview` for preview. When deploying preview manually, also set its secret with `npx wrangler secret put PREVIEW_PASSWORD --config wrangler.preview.json`.

## Markdown posts

Create a `.md` or `.mdx` file in `src/content/blog/`:

```md
---
title: My first story
description: A short introduction.
pubDate: 2026-11-01
category: Gaming
draft: true
---

Your story starts here.
```

Home shows the three latest visible posts. Public RSS always excludes drafts, even in preview builds.
