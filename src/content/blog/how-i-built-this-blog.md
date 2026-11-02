---
title: How I built this blog
description: From a logo and a rough idea to a blog I can write, preview, and publish from my phone.
pubDate: 2026-11-02
category: Development
draft: true
---
In my [first post](/blog/hello-internet/), I talked about wanting somewhere to put the things I feel like sharing. Getting that place built turned into its own little project, so it seems like a reasonable thing to write about next.

The starting point was simple: I had a logo, a domain, and an idea of what I wanted. A personal site, with a blog, that felt like mine. I also wanted to be able to actually use it without turning every post into a development task.

I built it with help from Codex. A lot of the process was me looking at what we had, deciding what didn’t feel right, and asking for changes. The first design felt too much like a template. Keeping the header and footer while reworking the rest got it closer to what I had in mind.

## Keeping the site simple

The blog is built with [Astro](https://astro.build/). Posts live in the repository as Markdown files, with a small block of information at the top for the title, description, date, category, and draft status.

A post starts roughly like this:

```yaml
---
title: Something I wanted to share
description: A short description of the post.
pubDate: 2026-11-02
category: Development
draft: true
---
```

The writing goes underneath. Astro uses those files to build the home page, the blog list, and the individual articles. The public pages are generated ahead of time, and the content doesn’t need a database.

That also means the writing stays in a format I can open in a text editor. Changes have Git history, and the site’s layout can change without having to rewrite the posts.

For the design, I kept coming back to the logo. It already had the greys and black I liked, so those became the basis for the site. There are light and dark modes, with a proper black background in dark mode. Mostly, I wanted the writing to be comfortable to read on both a computer and a phone.

## Writing without opening a terminal

Markdown files are fine when I’m at my desk. On my phone, I’d rather have an editor with fields and an upload button.

That’s where [Pages CMS](https://pagescms.org/docs/) comes in. It gives me an interface for editing the files in GitHub. A `.pages.yml` file defines the post fields, the categories, and where uploaded media belongs. Saving a post saves a change back to the repository.

I can choose a thumbnail, add images within the writing, and put audio or short video clips between paragraphs. Standalone YouTube links become embedded players when the blog is built. Reading time is calculated automatically.

Local photos also get smaller WebP versions during the build. The page gives the browser a choice of sizes, so a small thumbnail doesn’t need to load the full original photo. The uploaded original stays unchanged.

Categories have their own little collection in the CMS. I can add one there and reuse it across posts. Readers can then filter the blog without me having to commit the whole site to a single subject.

## A preview I can actually check

One thing I wanted early on was a way to see an unfinished post in the real layout.

We first made a dedicated draft area inside the site. After working through the publishing flow, we replaced that with a separate preview site. It looks like the blog, but includes drafts alongside published posts, with labels to make the difference clear.

There are two branches involved:

- `preview` is where I write and check changes.
- `main` is what gets published to the live site.

GitHub Actions builds and deploys the `preview` branch to a separate Cloudflare Worker. That Worker checks for a signed login cookie before serving pages or uploaded files. If the password hasn’t been configured, it refuses access.

There’s an important distinction here: the preview site is password-protected, but [the repository is public](https://github.com/Berna1337/bcruz97). Draft text committed there can still be read on GitHub. This setup is useful for reviewing unfinished writing; it isn’t a place to store confidential material.

## From a saved draft to a published post

The workflow I ended up with is:

1. Open Pages CMS on the `preview` branch.
2. Write or edit a post and save it.
3. Wait for the preview deployment, then check it in the browser.
4. Turn off Draft when the post is ready.
5. Open a pull request from `preview` to `main`, review it, and merge.

Cloudflare’s Git integration handles the production deployment after the merge. The live site is hosted on [Cloudflare Workers with static assets](https://developers.cloudflare.com/workers/static-assets/), using my own domain.

Posts that still have Draft enabled stay out of the public post lists, article routes, and RSS feed, even if their files have been merged into `main`.

## The bits that needed sorting out

It wasn’t all a straight line from idea to working blog.

The category picker needed an adjustment to read the saved category names correctly. The workflow that opens publishing pull requests also needed a GitHub repository setting enabled before it was allowed to create them.

Then there were two systems trying to handle preview builds: our GitHub Action and Cloudflare’s own branch preview integration. The extra Cloudflare build was failing on a command we weren’t using for our separate preview Worker. That took some untangling, including learning that an old failed check can remain attached to a commit when you open another pull request for it.

Those were useful reminders that the editor, repository, build, and deployment are separate pieces. A successful build doesn’t necessarily mean a successful deployment, and a saved post doesn’t appear on the site until the deployment has finished.

I’ll probably keep adjusting things as I use it. For now, I have somewhere to write, a way to check how it looks, and a publishing flow I can use from my phone. Time to put it to use.
