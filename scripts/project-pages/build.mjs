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
const SITE = 'https://geohashim.com';

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
  : '<p class="mock"><a href="/pricing/">My Stream pricing</a> <a href="/privacy/">Privacy</a> <a href="/terms/">Terms</a></p>';

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

// The five groups on the landing's open-source route, each with its own page listing its repos.
const GROUPS = JSON.parse(read(join(SHARED, 'groups.json')));
const groupOf = slug => GROUPS.find(g => g.repos.some(r => r.slug === slug));
const groupLink = g => (mockups ? `group-${g.slug}.html` : `/open-source/${g.slug}/`);
// The group symbols are the landing's, so a page copies the ones it uses from landing.page.html.
const LANDING = read(join(REPO, 'src/app/pages/landing/landing.page.html'));
const symbol = id => {
  const m = LANDING.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`));
  if (!m) throw new Error(`landing.page.html: symbol ${id} not found`);
  return m[0];
};

function headTags(path, meta) {
  if (mockups) return '';
  const url = SITE + path;
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

const crumbsOf = items => `<nav class="crumbs" aria-label="Breadcrumb">
          <ol>
${items.map(([label, href]) => `            <li>${href ? `<a href="${href}">${label}</a>` : `<span aria-current="page"><bdi>${label}</bdi></span>`}</li>`).join('\n')}
          </ol>
        </nav>`;

// Shared by project and group pages: the chrome, styles and runtime around a page's own main, script and CSS.
function writePage({ name, path, meta, main, pageJs, pageCss, section, dest, defs = '', note }) {
  const top = read(join(SHARED, 'chrome-top.html'))
    .replace('{{CUR_OS}}', section === 'open-source' ? ' aria-current="page"' : '')
    .replace('{{CUR_PR}}', section === 'products' ? ' aria-current="page"' : '')
    .replace('{{TERRAIN_SPOTS}}', SPOTS)
    .replace('{{TERRAIN_MEF}}', MEF)
    .replace('  </defs>\n</svg>', `  </defs>\n</svg>${defs ? `\n<svg class="defs" aria-hidden="true" focusable="false"><defs>\n${defs}\n</defs></svg>` : ''}`)
    .replaceAll('href="/', `href="${BASE}/`);
  // The tour bar's closing link points at the page's payoff section, if the page names one.
  const end = meta.tour_end;
  const bottom = read(join(SHARED, 'chrome-bottom.html'))
    .replace('{{TOUR_END}}', end ? `    <a class="tour-ans" id="tour-ans" href="${end.href}" hidden>${end.label}</a>\n` : '')
    .replace('{{FOOT_NOTE}}', FOOT_NOTE);

  const helpers = read(join(SHARED, 'core-helpers.js'));
  const script = `(() => {\n${helpers}\nconst PAGE = {};\n\n${pageJs}\n${read(join(SHARED, 'core-runtime.js'))}\n})();\n`;
  new Script(script, { filename: `${name}/page.js` });
  if (/<\/script/i.test(script)) throw new Error(`${name}: script contains "</script", which would end the inline tag early`);

  const css = `${tokens()}\n${terrainCss()}\n${read(join(SHARED, 'base.css'))}\n/* This page */\n${pageCss}`;
  const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(meta.title)}</title>
<meta name="description" content="${attr(meta.description)}">
${headTags(path, meta)}<meta name="color-scheme" content="light dark">
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
  if (left) throw new Error(`${name}: unfilled placeholders ${[...new Set(left)].join(', ')}`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log(`Wrote ${dest.replace(`${REPO}/`, '')}${note ? ` (${note})` : ''}`);
}

function build(slug) {
  const dir = join(PAGES, slug);
  const meta = JSON.parse(read(join(dir, 'meta.json')));
  const i = REGISTRY.findIndex(p => p.slug === slug);
  if (i < 0) throw new Error(`${slug}: missing from shared/projects.json`);
  const entry = REGISTRY[i], prev = REGISTRY[i - 1], next = REGISTRY[i + 1];
  const repo = entry.kind === 'repo';
  const group = repo && groupOf(slug);
  if (repo && !group) throw new Error(`${slug}: in no group in shared/groups.json`);

  let main = read(join(dir, 'main.html'));
  const stages = (main.match(/data-stage/g) || []).length;
  const crumbs = crumbsOf(repo
    ? [['Open source', `${BASE}/#open-source`], [group.name, groupLink(group)], [entry.name]]
    : [['Products', `${BASE}/#products`], [entry.name]]);
  const tour = '<button type="button" class="btn btn-ink" id="tour-btn" aria-pressed="false" aria-controls="tour-bar" aria-describedby="tour-hint">'
    + `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg><span>Run all ${stages} stages</span></button>`;
  const card = (p, cls, label) => `<a class="panel ${cls}" href="${linkTo(p)}"><small>${label}</small><strong><bdi>${p.name}</bdi></strong><span>${p.blurb}</span></a>`;
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

  let pageJs = read(join(dir, 'page.js'));
  pageJs = pageJs.replace(/\/\*@@DATA:([\w-]+)@@\*\//g, (_, name) => JSON.stringify(JSON.parse(read(join(dir, 'data', `${name}.json`)))));
  writePage({
    name: slug, path: pagePath(entry), meta, main, pageJs,
    pageCss: existsSync(join(dir, 'page.css')) ? read(join(dir, 'page.css')) : '',
    section: sectionOf(entry), note: `${stages} stages`,
    dest: mockups ? join(REPO, 'docs/mockups', `project-${slug}.html`) : join(REPO, 'www', sectionOf(entry), slug, 'index.html')
  });
}

function buildGroup(g, k) {
  const prev = GROUPS[k - 1], next = GROUPS[k + 1];
  const tests = g.repos.reduce((a, r) => a + r.tests, 0);
  const langs = [...new Set(g.repos.map(r => r.facts.find(([dt]) => dt === 'Language')[1]))];
  const repoOf = slug => {
    const p = REGISTRY.find(e => e.slug === slug);
    if (!p) throw new Error(`groups.json: ${slug} missing from shared/projects.json`);
    return p;
  };
  const cards = g.repos.map(r => {
    const p = repoOf(r.slug);
    const dl = r.facts.map(([dt, dd]) => `                <dt>${dt}</dt><dd>${dd}</dd>`).join('\n');
    return `          <li class="panel gc${r.featured ? ' gc--feat' : ''}" id="repo-${r.slug}">
            <div class="gc-head">
              <h3><a class="gc-link" href="${linkTo(p)}">${r.slug}</a></h3>
              <p class="gc-n"><strong>${r.tests}</strong> passing tests</p>
            </div>
            <p class="gc-tag">${r.featured ? '<span class="gc-badge">Featured</span> ' : ''}${r.tag}</p>
            <p>${p.blurb}</p>
            <dl class="gc-data">
${dl}
            </dl>
            <p class="gc-actions"><span class="gc-go" aria-hidden="true">How it works</span><a class="gc-gh" href="https://github.com/ahmed-hashim-pro/${r.slug}">GitHub<span class="vh">: ${r.slug}</span></a></p>
          </li>`;
  }).join('\n');
  const card = (o, cls, label) => `<a class="panel ${cls}" href="${groupLink(o)}"><small>${label}</small><strong>${o.name}</strong><span>${o.repos.length} repos, ${o.repos.reduce((a, r) => a + r.tests, 0).toLocaleString('en-US')} passing tests</span></a>`;
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const main = `  <div class="ground" id="ground">
    ${HOLD_MARK}

    <section class="p-hero" aria-labelledby="p-title">
      <div class="wrap">
        ${crumbsOf([['Open source', `${BASE}/#open-source`], [g.name]])}
        <h1 class="p-title g-title" id="p-title"><svg class="g-sym" aria-hidden="true" focusable="false"><use href="#${g.symbol}"/></svg>${g.name}</h1>
        <div class="grid p-row">
          <div class="p-intro">
            <p class="lede">${g.lead}</p>
            <p>${g.intro}</p>
            <div class="ctas">
              <a class="btn btn-ink" href="#repos">See the ${words[g.repos.length]} repos</a>
              <a class="btn" href="${BASE}/#leg-${g.key}">On the landing route</a>
            </div>
            <dl class="facts">
              <dt>Repos</dt><dd>${g.repos.length}</dd>
              <dt>Passing tests</dt><dd>${tests.toLocaleString('en-US')}, one dot each, run in October 2026 the way each repo's CI runs them</dd>
              <dt>Languages</dt><dd>${langs.join(', ')}</dd>
            </dl>
          </div>
          <div class="term-wrap">
            <div class="panel t-cluster g-cluster">
              <canvas id="t-canvas" width="240" height="240" aria-hidden="true"></canvas>
              <ul class="t-legend" id="t-legend"></ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    ${RUNWAY_EDGE}
  </div>

  <div class="air">
    <section class="sec" id="repos" aria-labelledby="h-repos">
      <div class="wrap">
        <div class="sec-head panel">
          <h2 id="h-repos">The ${words[g.repos.length]} repos</h2>
          <p>Open a repo for its project page: what it does stage by stage, with real runs.</p>
        </div>
        <ul class="g-cards">
${cards}
        </ul>
      </div>
    </section>

    <nav class="pn" aria-label="More groups">
      <div class="wrap pn-grid">
        ${prev ? card(prev, 'prev', 'Previous group') : '<span></span>'}
        ${next ? card(next, 'next', 'Next group') : '<span></span>'}
      </div>
    </nav>
  </div>
`;
  const pageJs = `PAGE.tests = ${JSON.stringify(g.repos.map((r, j) => [r.slug, r.tests, j % 2 ? 'var(--deep)' : 'var(--pass)']))};\n`;
  const desc = `${g.repos.length} open-source repos by Ahmed Hashim with ${tests.toLocaleString('en-US')} passing tests: ${g.lead.replace(/\.$/, '')}.`;
  writePage({
    name: g.slug, path: `/open-source/${g.slug}/`, main, pageJs, section: 'open-source',
    meta: { title: `${g.name} · Ahmed Hashim`, description: desc },
    pageCss: read(join(SHARED, 'group.css')), defs: symbol(g.symbol), note: `${g.repos.length} repos`,
    dest: mockups ? join(REPO, 'docs/mockups', `group-${g.slug}.html`) : join(REPO, 'www', 'open-source', g.slug, 'index.html')
  });
}

if (!mockups && !existsSync(join(REPO, 'www', 'index.html'))) {
  throw new Error('www/index.html not found: run ng build first, the project pages are written into its output');
}
const slugs = only.length ? only.filter(s => !GROUPS.some(g => g.slug === s)) : readdirSync(PAGES).filter(s => existsSync(join(PAGES, s, 'main.html'))).sort();
for (const s of slugs) build(s);
GROUPS.forEach((g, k) => { if (!only.length || only.includes(g.slug)) buildGroup(g, k); });
