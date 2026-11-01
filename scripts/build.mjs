import { spawnSync } from 'node:child_process';
import { prepareMedia } from './media.mjs';
await prepareMedia();
const preview = process.argv.includes('--preview');
const result = spawnSync(process.execPath, ['node_modules/astro/astro.js', 'build', '--outDir', preview ? 'dist-preview' : 'dist'], {
  stdio: 'inherit', env: { ...process.env, PUBLIC_BLOG_PREVIEW: preview ? 'true' : 'false' },
});
process.exit(result.status ?? 1);
