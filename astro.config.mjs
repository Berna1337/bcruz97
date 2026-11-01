// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeYouTube from "./src/plugins/rehype-youtube.mjs";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://bcruz97.com",
	integrations: [mdx(), sitemap({ filter: page => !new URL(page).pathname.startsWith("/preview") })],
	markdown: { rehypePlugins: [rehypeYouTube] },
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
