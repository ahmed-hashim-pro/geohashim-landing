#!/usr/bin/env node
// Writes the landing's open-source route and its test totals from scripts/project-pages/shared/groups.json,
// the same file the group pages are built from, so every count on the site has one source.
//   node scripts/landing-repos.mjs           rewrite the landing files
//   node scripts/landing-repos.mjs --check   exit 1 if they are out of date
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(REPO, 'scripts/project-pages/shared');
const OS = join(REPO, 'src/app/pages/landing/sections/open-source.component.html');
const WORK = join(REPO, 'src/app/pages/landing/sections/work.component.html');
const check = process.argv.includes('--check');

const GROUPS = JSON.parse(readFileSync(join(SHARED, 'groups.json'), 'utf8'));
const BLURB = Object.fromEntries(JSON.parse(readFileSync(join(SHARED, 'projects.json'), 'utf8')).map(p => [p.slug, p.blurb]));
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const TENS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty' };
const word = n => (n <= 20 ? WORDS[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${WORDS[n % 10]}` : ''));
const cap = s => s[0].toUpperCase() + s.slice(1);
const num = n => n.toLocaleString('en-US');
const lang = r => r.facts.find(([dt]) => dt === 'Language')[1];
const blurb = slug => {
  if (!BLURB[slug]) throw new Error(`${slug}: missing from projects.json`);
  return BLURB[slug];
};

const featured = GROUPS.flatMap(g => g.repos.filter(r => r.featured));
const featuredHtml = featured.map(r => {
  const l = r.landing;
  const dl = r.facts.map(([dt, dd]) => `                <dt>${dt}</dt><dd>${dd}</dd>`).join('\n');
  return `          <li class="repo repo--air" data-side="${l.side}" data-n="${r.tests}" data-ring="${l.ring}" style="${l.x}">
            <svg class="ring" aria-hidden="true" focusable="false"></svg>
            <a class="wp" href="#repo-${r.slug}">
              <canvas aria-hidden="true"></canvas>
              <span class="wp-label"><span class="wp-name">${r.slug}</span><span class="wp-data">${lang(r)}, ${r.tests} tests</span></span>
              <span class="vh">, details</span>
            </a>
            <article class="panel repo-panel" id="repo-${r.slug}" tabindex="-1" aria-labelledby="h-${r.slug}">
              <header class="rp-head">
                <div class="rp-title">
                  <h3 id="h-${r.slug}">${r.slug}</h3>
                  <p class="tag"><svg aria-hidden="true" focusable="false"><use href="#${l.tag[0]}"/></svg>${l.tag[1]}</p>
                </div>
                <p class="rp-count"><strong>${r.tests}</strong> passing tests</p>
              </header>
              <p>${blurb(r.slug)}</p>
              <dl class="rp-data">
${dl}
              </dl>
              <div class="rp-actions"><a class="btn btn-ink" href="/open-source/${r.slug}/">How it works<span class="vh">: ${r.slug}</span></a> <a class="btn" href="https://github.com/ahmed-hashim-pro/${r.slug}">View on GitHub<span class="vh">: ${r.slug}</span></a></div>
            </article>
          </li>`;
}).join('\n');

const legsHtml = GROUPS.map((g, i) => {
  const rest = g.repos.filter(r => !r.featured);
  const n = rest.reduce((a, r) => a + r.tests, 0);
  const side = i % 2 ? 'left' : 'right';
  const x = side === 'right' ? '--x:22%;--x-md:20%' : '--x:76%;--x-md:79%';
  const cards = rest.map(r => {
    blurb(r.slug);
    return `                <li class="rc" id="repo-${r.slug}">
                  <h4><a href="/open-source/${r.slug}/">${r.slug}</a></h4>
                  <p class="rc-n"><strong>${r.tests}</strong> tests</p>
                  <p class="rc-tag">${r.tag}</p>
                  <p class="rc-meta"><span>${lang(r)}</span> <a href="https://github.com/ahmed-hashim-pro/${r.slug}">GitHub<span class="vh">: ${r.slug}</span></a></p>
                </li>`;
  }).join('\n');
  return `          <li class="repo repo--leg" data-side="${side}" data-n="${n}" style="${x}">
            <a class="wp" href="#leg-${g.key}">
              <canvas aria-hidden="true"></canvas>
              <span class="wp-label"><span class="wp-name">${g.name}</span><span class="wp-data">${rest.length} repos, ${num(n)} tests</span></span>
              <span class="vh">, repos</span>
            </a>
            <article class="panel repo-panel leg-panel" id="leg-${g.key}" tabindex="-1" aria-labelledby="h-leg-${g.key}">
              <header class="rp-head">
                <div class="rp-title">
                  <h3 id="h-leg-${g.key}"><svg class="leg-sym" aria-hidden="true" focusable="false"><use href="#${g.symbol}"/></svg>${g.name}</h3>
                  <p class="leg-lead">${g.lead}</p>
                  <a class="leg-page" href="/open-source/${g.slug}/">Open the group page<span aria-hidden="true"> →</span></a>
                </div>
                <p class="rp-count"><strong>${num(n)}</strong> passing tests in ${word(rest.length)} repos</p>
              </header>
              <ul class="leg-cards">
${cards}
              </ul>
            </article>
          </li>`;
}).join('\n');

const repos = GROUPS.reduce((a, g) => a + g.repos.length, 0);
const tests = GROUPS.reduce((a, g) => a + g.repos.reduce((b, r) => b + r.tests, 0), 0);

function swap(text, re, value, file) {
  if (!re.test(text)) throw new Error(`${file}: ${re} not found`);
  return text.replace(re, value);
}
const os0 = readFileSync(OS, 'utf8');
let os = swap(os0, /(<ol class="repos">\n)[\s\S]*?(\n {8}<\/ol>)/, `$1${featuredHtml}\n\n${legsHtml}$2`, 'open-source');
os = swap(os, /<p class="os-lead">[A-Z][a-z-]+ public repos with [\d,]+ passing tests/, `<p class="os-lead">${cap(word(repos))} public repos with ${num(tests)} passing tests`, 'open-source');
const work0 = readFileSync(WORK, 'utf8');
const work = swap(work0, /[\d,]+ passing tests across <a href="#open-source">[a-z-]+ public repos<\/a>/, `${num(tests)} passing tests across <a href="#open-source">${word(repos)} public repos</a>`, 'work');

const stale = [[OS, os0, os], [WORK, work0, work]].filter(([, a, b]) => a !== b);
if (check) {
  if (stale.length) { console.error(`Out of date with groups.json: ${stale.map(([f]) => f.replace(`${REPO}/`, '')).join(', ')}. Run node scripts/landing-repos.mjs`); process.exit(1); }
  console.log(`Landing matches groups.json: ${repos} repos, ${num(tests)} tests`);
} else {
  for (const [f, , b] of stale) writeFileSync(f, b);
  console.log(`Landing ${stale.length ? 'updated' : 'already matches'}: ${repos} repos, ${num(tests)} tests`);
}
