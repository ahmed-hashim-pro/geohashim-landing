#!/usr/bin/env node
// Builds the project pages, one standalone HTML file each, from shared/ and pages/<slug>/.
//   node scripts/project-pages/build.mjs             site pages into www/open-source/<slug>/ and www/products/<slug>/
//   node scripts/project-pages/build.mjs --mockups   review copies into docs/mockups/project-<slug>.html
// Optional slugs after the flags limit the build to those pages.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const SHARED = join(HERE, 'shared');
const PAGES = join(HERE, 'pages');
const SITE = 'https://landing.geohashim.com';

const args = process.argv.slice(2);
const mockups = args.includes('--mockups');
const only = args.filter(a => !a.startsWith('--'));
// Mockups open from disk, so their site links point at the live landing page.
const BASE = mockups ? SITE : '';

const read = p => readFileSync(p, 'utf8');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const REGISTRY = JSON.parse(read(join(SHARED, 'projects.json')));
const sectionOf = p => (p.kind === 'repo' ? 'open-source' : 'products');
const pagePath = p => `/${sectionOf(p)}/${p.slug}/`;
const linkTo = p => (mockups ? `project-${p.slug}.html` : pagePath(p));

const REPLAY = '<button type="button" class="replay"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 8A5.5 5.5 0 1 1 11.9 4.1M12 1.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Replay</button>';
const HOLD_MARK = `<div class="hold-mark" aria-hidden="true">
      <svg focusable="false">
        <rect class="paint" x="-4" y=".75" width="110%" height="6.5" stroke-width="1.5"/>
        <rect class="paint" x="-4" y="13.75" width="110%" height="6.5" stroke-width="1.5"/>
        <rect y="26" width="100%" height="8" fill="url(#dash-top)"/>
        <rect y="39" width="100%" height="8" fill="url(#dash-top)"/>
      </svg>
    </div>`;
const RUNWAY_EDGE = `<div class="runway-edge" aria-hidden="true">
      <svg focusable="false"><rect class="edge-paint" x="-4" y=".75" width="110%" height="12.5" stroke-width="1.5"/></svg>
    </div>`;
const FOOT_NOTE = mockups
  ? '<p class="mock">Design mockup. Not the live site.</p>'
  : '<p class="mock"><a href="/privacy/">Privacy</a> <a href="/terms/">Terms</a></p>';

// The landing page's stylesheet owns the design tokens; every project page reuses them as they are.
function tokens() {
  const css = read(join(REPO, 'src/styles/site/site-a.css'));
  const start = css.indexOf(':root {');
  const end = css.indexOf('\n*, *::before');
  if (start < 0 || end < start) throw new Error('site-a.css: token block not found');
  return css.slice(start, end).trim();
}

// The terrain background is the landing's: its stylesheet block, its pre-drawn images and its label positions.
function terrainCss() {
  const css = read(join(REPO, 'src/styles/site/site-a.css'));
  const start = css.indexOf('/* Terrain flight');
  const end = css.indexOf('/* Altimeter');
  if (start < 0 || end < start) throw new Error('site-a.css: terrain block not found');
  return css.slice(start, end).trim().replaceAll('url(/assets/', `url(${BASE}/assets/`);
}
// bake.mjs writes the label positions as one JSON object after `TERRAIN_LABELS =`.
const TERRAIN_LABELS = JSON.parse(read(join(REPO, 'src/app/pages/landing/runtime/terrain-labels.js')).replace(/^[\s\S]*?TERRAIN_LABELS = /, '').replace(/;\s*$/, ''));
const TILE = 1536;
const thrice = inner => [0, 1, 2].map(n => `<g transform="translate(0 ${n * TILE})">${inner}</g>`).join('');
const SPOTS = thrice(
  TERRAIN_LABELS.elev.map(([x, y, a, t]) => `<text class="c-elev" text-anchor="middle" dy="3.5" transform="translate(${x} ${y}) rotate(${a})">${t}</text>`).join('') +
  TERRAIN_LABELS.spot.map(([x, y, t]) => `<circle class="c-peak" cx="${x}" cy="${y}" r="2.2"/><text class="c-spot" x="${x + 6}" y="${y + 4}">${t}</text>`).join(''));
const MEF = thrice(TERRAIN_LABELS.mef.map(([x, y, a, b]) => `<text class="c-mef" x="${x}" y="${y}" text-anchor="middle">${a}<tspan dy="-13" class="c-mef-h">${b}</tspan></text>`).join(''));

function headTags(entry, meta) {
  if (mockups) return '';
  const url = SITE + pagePath(entry);
  const title = attr(meta.title), desc = attr(meta.description);
  return `<link rel="canonical" href="${url}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate icon" type="image/png" href="/assets/icon/favicon.png">
<link rel="apple-touch-icon" href="/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:site_name" content="geohashim">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}/og-image.png">
`;
}

function build(slug) {
  const dir = join(PAGES, slug);
  const meta = JSON.parse(read(join(dir, 'meta.json')));
  const i = REGISTRY.findIndex(p => p.slug === slug);
  if (i < 0) throw new Error(`${slug}: missing from shared/projects.json`);
  const entry = REGISTRY[i], prev = REGISTRY[i - 1], next = REGISTRY[i + 1];
  const repo = entry.kind === 'repo';

  let main = read(join(dir, 'main.html'));
  const stages = (main.match(/data-stage/g) || []).length;
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="${BASE}/#${repo ? 'open-source' : 'products'}">${repo ? 'Open source' : 'Products'}</a></li>
            <li><span aria-current="page">${entry.name}</span></li>
          </ol>
        </nav>`;
  const tour = '<button type="button" class="btn btn-ink" id="tour-btn" aria-pressed="false" aria-controls="tour-bar" aria-describedby="tour-hint">'
    + `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg><span>Run all ${stages} stages</span></button>`;
  const card = (p, cls, label) => `<a class="panel ${cls}" href="${linkTo(p)}"><small>${label}</small><strong>${p.name}</strong><span>${p.blurb}</span></a>`;
  const pn = `<nav class="pn" aria-label="More projects">
      <div class="wrap pn-grid">
        ${prev ? card(prev, 'prev', 'Previous project') : '<span></span>'}
        ${next ? card(next, 'next', 'Next project') : '<span></span>'}
      </div>
    </nav>`;
  const fills = {
    '{{HOLD_MARK}}': HOLD_MARK, '{{RUNWAY_EDGE}}': RUNWAY_EDGE, '{{REPLAY}}': REPLAY, '{{CRUMBS}}': crumbs,
    '{{TOUR_BUTTON}}': tour, '{{PREV_NEXT}}': pn, '@@TOUR_SECONDS@@': meta.tour_seconds || ''
  };
  for (const [k, v] of Object.entries(fills)) main = main.split(k).join(v);

  const top = read(join(SHARED, 'chrome-top.html'))
    .replace('{{CUR_OS}}', repo ? ' aria-current="page"' : '')
    .replace('{{CUR_PR}}', repo ? '' : ' aria-current="page"')
    .replace('{{TERRAIN_SPOTS}}', SPOTS)
    .replace('{{TERRAIN_MEF}}', MEF)
    .replaceAll('href="/', `href="${BASE}/`);
  // The tour bar's closing link points at the page's payoff section, if the page names one.
  const end = meta.tour_end;
  const bottom = read(join(SHARED, 'chrome-bottom.html'))
    .replace('{{TOUR_END}}', end ? `    <a class="tour-ans" id="tour-ans" href="${end.href}" hidden>${end.label}</a>\n` : '')
    .replace('{{FOOT_NOTE}}', FOOT_NOTE);

  let pageJs = read(join(dir, 'page.js'));
  pageJs = pageJs.replace(/\/\*@@DATA:([\w-]+)@@\*\//g, (_, name) => JSON.stringify(JSON.parse(read(join(dir, 'data', `${name}.json`)))));
  const helpers = read(join(SHARED, 'core-helpers.js'));
  const script = `(() => {\n${helpers}\nconst PAGE = {};\n\n${pageJs}\n${read(join(SHARED, 'core-runtime.js'))}\n})();\n`;
  new Script(script, { filename: `${slug}/page.js` });
  if (/<\/script/i.test(script)) throw new Error(`${slug}: script contains "</script", which would end the inline tag early`);

  const pageCss = existsSync(join(dir, 'page.css')) ? read(join(dir, 'page.css')) : '';
  const css = `${tokens()}\n${terrainCss()}\n${read(join(SHARED, 'base.css'))}\n/* This project */\n${pageCss}`;
  const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(meta.title)}</title>
<meta name="description" content="${attr(meta.description)}">
${headTags(entry, meta)}<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#DCDFDB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1E2328" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=JetBrains+Mono:wght@400;500&display=swap">
<script>
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  let chosen = null;
  try { chosen = localStorage.getItem('geohashim-theme'); } catch (e) { chosen = null; }
  if (chosen !== 'light' && chosen !== 'dark') chosen = null;
  root.setAttribute('data-theme', chosen || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
})();
</script>
<style>
${css}
</style>
</head>
`;
  const html = `${head}${top}${main}${bottom}<script>\n${script}</script>\n</body>\n</html>\n`;
  const left = html.match(/\{\{[A-Z_]+\}\}|@@[A-Z_:]+@@/g);
  if (left) throw new Error(`${slug}: unfilled placeholders ${[...new Set(left)].join(', ')}`);

  const dest = mockups ? join(REPO, 'docs/mockups', `project-${slug}.html`) : join(REPO, 'www', sectionOf(entry), slug, 'index.html');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log(`Wrote ${dest.replace(`${REPO}/`, '')} (${stages} stages)`);
}

if (!mockups && !existsSync(join(REPO, 'www', 'index.html'))) {
  throw new Error('www/index.html not found: run ng build first, the project pages are written into its output');
}
const slugs = only.length ? only : readdirSync(PAGES).filter(s => existsSync(join(PAGES, s, 'main.html'))).sort();
for (const s of slugs) build(s);
