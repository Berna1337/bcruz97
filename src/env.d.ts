type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

// Runtime-only secret; configure it with Wrangler, never in tracked source.
interface Env {
  PREVIEW_PASSWORD?: string;
}
