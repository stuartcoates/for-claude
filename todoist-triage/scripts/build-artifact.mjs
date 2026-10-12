// Packs the Vite build into one self-contained page for publishing as a claude.ai
// artifact: the page's CSS and JS inlined, Google Fonts linked (the only
// stylesheet host artifacts allow), and no <html>/<head>/<body> of its own,
// because the artifact host wraps the page in its own skeleton.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const scriptSrc = html.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1];
const styleHref = html.match(/<link rel="stylesheet"[^>]*href="(\.\/assets\/[^"]+)"/)?.[1];
if (!scriptSrc || !styleHref) throw new Error('Could not find the built script and stylesheet in dist/index.html');

const js = readFileSync(join(dist, scriptSrc), 'utf8').replaceAll('</script', '<\\/script');
const css = readFileSync(join(dist, styleHref), 'utf8');
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]+>/)?.[0] ?? '';
const title = html.match(/<title>[^<]*<\/title>/)?.[0] ?? '<title>The Pass</title>';

const page = [
  title,
  '<link rel="preconnect" href="https://fonts.googleapis.com" />',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  fonts,
  `<style>${css}</style>`,
  '<div id="root"></div>',
  `<script type="module">${js}</script>`,
  '',
].join('\n');

const out = join(root, 'dist-artifact', 'the-pass.html');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page);
console.log(`Wrote ${out} (${(page.length / 1024).toFixed(0)} KB)`);
