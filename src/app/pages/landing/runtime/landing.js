// Ported from docs/mockups/mockup-7-full-flight.html; logic unchanged.
import { $, $$, r1, clamp, svgEl, mulberry, ease, createScope } from './scope.js';
import { PERIOD, CELL, layerTile } from './terrain.js';
import { initHeader } from './header.js';
import { initGate } from './gate.js';
import { initMyStream } from './mystream.js';

// Runs once the prerendered page has hydrated. Everything attached outside the page's own
// DOM goes through the scope, so navigating away detaches it.
export function initLanding() {
  const scope = createScope();
  const root = document.documentElement;
  const requestAnimationFrame = fn => scope.raf(fn);
  const addEventListener = (type, fn, opts) => scope.on(window, type, fn, opts);
  const watch = scope.watch;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const { header, themeHooks } = initHeader(scope);
  const { stripCue } = initGate();

  /* Ground: concrete drift and the headline narrowing on the width axis */
  const hero = $('.hero');
  const heroWrap = $('.hero-inner');
  const h1 = $('#hero-title');
  const concrete = $('.g-concrete');
  const groundPaint = $('.g-paint');
  const heroMark = $('.hero-mark');
  const W_MAX = 125, W_MIN = 75, LAG = .7, PAINT_LAG = .4, TITLE_LEAD = .28;
  let typeMotion = false, range = 1, heroBottom = 0, headH = 60, lastW = -1;
  const parallaxOn = () => !reduce.matches && innerWidth >= 700;
  const setWidth = v => {
    v = Math.round(v * 2) / 2;
    if (v === lastW) return;
    lastW = v;
    h1.style.fontVariationSettings = `"wdth" ${v}`;
  };
  function measureHero() {
    typeMotion = !reduce.matches;
    concrete.style.transform = groundPaint.style.transform = h1.style.transform = '';
    h1.style.minHeight = '';
    lastW = -1;
    setWidth(W_MAX);
    const y = scrollY;
    headH = header.offsetHeight;
    heroBottom = hero.getBoundingClientRect().bottom + y;
    if (!typeMotion) return;
    // Narrower widths wrap into fewer lines on small screens; reserving the widest height stops the page jumping.
    const box = h1.getBoundingClientRect();
    h1.style.minHeight = `${Math.ceil(box.height)}px`;
    const h1Top = box.top + y;
    const lead = Math.max(24, h1Top - (heroMark.getBoundingClientRect().bottom + y)) + box.height * .5;
    range = parallaxOn() ? lead * 2.5 : h1Top + box.height * .5;
  }

  /* Air: the sectional chart behind everything below the hero */
  const layers = $$('.c-layer').map(el => ({ el, rate: +el.dataset.rate, kind: el.dataset.kind, svg: null, copies: 0 }));
  let builtWidth = 0;
  function buildLayers() {
    const w = Math.max(1440, innerWidth) + 4 * CELL;
    const copies = Math.ceil(innerHeight / PERIOD) + 1;
    if (w > builtWidth) {
      builtWidth = w;
      layers.forEach((L, i) => {
        const svg = svgEl('svg', { width: w });
        svg.style.marginLeft = `${-w / 2}px`;
        svg.innerHTML = `<g id="tile-${i}">${layerTile(L.kind, w)}</g>`;
        L.el.replaceChildren(svg);
        L.svg = svg;
        L.copies = 1;
      });
    }
    layers.forEach((L, i) => {
      if (L.copies === copies) return;
      L.svg.querySelectorAll('use').forEach(u => u.remove());
      for (let k = 1; k < copies; k++) L.svg.appendChild(svgEl('use', { href: `#tile-${i}`, y: k * PERIOD }));
      L.svg.setAttribute('height', copies * PERIOD);
      L.copies = copies;
    });
  }

  /* Waypoint clusters: one dot per passing test, every dot the same size */
  const mainEl = $('#main');
  const routeSvg = $('#route');
  const strokes = $$('.r-stroke', routeSvg);
  const plan = $('#route-plan'), ink = $('#route-ink'), head = $('#route-head');
  const clipG = $('#clip-g rect'), clipA = $('#clip-a rect');
  const marksG = $('#route-marks'), leadersG = $('#leaders');
  const flow = $('#open-source');
  const reposWrap = $('.repos-wrap');
  const startM = $('#route-start-m'), vor = $('#route-vor'), workFix = $('#work-fix'), legend = $('.legend');
  const compass = $('.compass');
  const probe = svgEl('path', { visibility: 'hidden' });
  routeSvg.appendChild(probe);

  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const rand = mulberry(1854);
  const repos = $$('.repo').map((li, k) => {
    const n = +li.dataset.n;
    const canvas = li.querySelector('canvas');
    const r = {
      k, li, n, air: li.classList.contains('repo--air'), side: li.dataset.side,
      wp: li.querySelector('.wp'), panel: li.querySelector('.repo-panel'), ring: li.querySelector('.ring'),
      canvas, ctx: canvas.getContext('2d'),
      ux: new Float32Array(n), uy: new Float32Array(n), lx: new Float32Array(n), ly: new Float32Array(n), dl: new Float32Array(n),
      state: 0, t0: 0, on: false, s: 1, R: 0, half: 0, rIn: 0, rOut: 0, ext: 0, L: Infinity, size: 0, dpr: 0, ringKey: '', vars: ''
    };
    const span = Math.sqrt(n);
    for (let j = 0; j < n; j++) {
      const rr = Math.sqrt(j + .5), a = j * GOLDEN;
      r.ux[j] = rr * Math.cos(a);
      r.uy[j] = rr * Math.sin(a);
      const lr = Math.sqrt(rand()) * span, la = rand() * Math.PI * 2;
      r.lx[j] = lr * Math.cos(la);
      r.ly[j] = lr * Math.sin(la);
      r.dl[j] = j / n * 520 + rand() * 180;
    }
    return r;
  });

  const colors = {};
  const readColors = () => {
    const cs = getComputedStyle(root);
    ['paper', 'pass', 'deep', 'ink', 'ink-2', 'blue', 'magenta', 'magenta-fill', 'panel'].forEach(k => { colors[k] = cs.getPropertyValue(`--${k}`).trim(); });
  };
  readColors();

  const SETTLE = 900;
  let mobile = false;

  function drawRepo(r, now) {
    const { ctx, half, s, n } = r;
    ctx.setTransform(r.dpr, 0, 0, r.dpr, 0, 0);
    ctx.clearRect(0, 0, 2 * half, 2 * half);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(half, half, r.R + 3, 0, Math.PI * 2);
    ctx.fillStyle = colors.paper;
    ctx.fill();
    ctx.fillStyle = r.on ? colors.deep : colors.pass;
    const dotR = s * (mobile ? .47 : .4);
    const LEVELS = 6;
    let busy = false;
    const progress = j => {
      if (r.state === 2) return 1;
      if (r.state === 0) return 0;
      const t = (now - r.t0 - r.dl[j]) / SETTLE;
      if (t < 1) busy = true;
      return t <= 0 ? 0 : t >= 1 ? 1 : ease(t);
    };
    const ps = new Float32Array(n);
    for (let j = 0; j < n; j++) ps[j] = progress(j);
    for (let lv = 0; lv < LEVELS; lv++) {
      let any = false;
      ctx.beginPath();
      for (let j = 0; j < n; j++) {
        const p = ps[j];
        if (Math.min(LEVELS - 1, Math.floor(p * LEVELS)) !== lv) continue;
        const x = half + (r.lx[j] + (r.ux[j] - r.lx[j]) * p) * s;
        const y = half + (r.ly[j] + (r.uy[j] - r.ly[j]) * p) * s;
        const rad = dotR * (.72 + .28 * p);
        ctx.moveTo(x + rad, y);
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        any = true;
      }
      if (!any) continue;
      ctx.globalAlpha = .3 + .7 * (lv / (LEVELS - 1));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (r.state === 1 && !busy) r.state = 2;
    return r.state === 1;
  }

  const animating = new Set();
  let animRaf = 0;
  function animate(now) {
    animRaf = 0;
    animating.forEach(r => { if (!drawRepo(r, now)) animating.delete(r); });
    if (animating.size) animRaf = requestAnimationFrame(animate);
  }
  const kick = r => {
    animating.add(r);
    if (!animRaf) animRaf = requestAnimationFrame(animate);
  };
  const drawAll = () => repos.forEach(r => drawRepo(r, performance.now()));
  themeHooks.push(() => { readColors(); drawAll(); });

  function ringMarkup(r) {
    const e = r.rOut ? r.rOut + 24 : r.rIn + 3;
    let svg = `<circle class="r1" r="${r1(r.rOut || r.rIn)}"/>`;
    if (r.rOut) {
      const ar = r.rOut + 7;
      const span = Math.min(150, 168 / ar * 180 / Math.PI);
      const a0 = r.side === 'left' ? 278 : 262 - span;
      const a1 = a0 + span;
      const pt = a => `${r1(ar * Math.cos(a * Math.PI / 180))} ${r1(ar * Math.sin(a * Math.PI / 180))}`;
      svg += `<circle class="r2" r="${r1(r.rIn)}"/><defs><path id="arc-${r.k}" d="M${pt(a0)}A${r1(ar)} ${r1(ar)} 0 0 1 ${pt(a1)}"/></defs>` +
        `<text><textPath href="#arc-${r.k}" startOffset="50%" text-anchor="middle">${r.li.dataset.ring}</textPath></text>`;
    }
    return { e, svg };
  }

  function layoutClusters() {
    mobile = innerWidth < 760;
    const f = mobile ? 1 : clamp(reposWrap.clientWidth / 1200, .55, 1);
    const s = mobile ? 1.4 : 4 * f;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    repos.forEach(r => {
      r.s = s;
      r.R = Math.sqrt(r.n) * s;
      r.half = Math.ceil(r.R + 4);
      if (mobile) {
        r.rIn = r.air ? r.R + 6 : 0;
        r.rOut = 0;
        r.ext = r.air ? r.R + 8 : r.R + 4;
      } else {
        r.rIn = r.air ? r.R + 8 * f : 0;
        r.rOut = r.air ? r.R + 20 * f : 0;
        r.ext = r.air ? r.rOut + 24 : r.R + 4;
      }
    });
    const lx = Math.ceil(Math.max(...repos.map(r => r.ext)));
    if (reposWrap.style.getPropertyValue('--lx') !== `${lx}px`) reposWrap.style.setProperty('--lx', `${lx}px`);
    repos.forEach(r => {
      const edge = r.rOut || r.rIn || r.R + 3;
      let vars;
      if (mobile) {
        vars = `--half:${r.half}px;--cy:${Math.ceil(r.ext) + 4}px;--top:${Math.ceil(2 * r.ext) + 12}px;--lab:${Math.ceil(edge - r.half + 10)}px`;
      } else {
        const cy = Math.max(64, Math.ceil(r.ext + 12));
        const minH = Math.ceil(cy + edge + 8 + 54);
        vars = `--half:${r.half}px;--cy:${cy}px;--lab:${Math.ceil(edge - r.half + 8)}px;min-height:${minH}px`;
      }
      if (vars !== r.vars) {
        r.vars = vars;
        const keep = r.li.getAttribute('style').split(';').filter(p => /^\s*--x/.test(p)).join(';');
        r.li.setAttribute('style', `${keep};${vars}`);
      }
      const px = 2 * r.half;
      if (r.size !== px || r.dpr !== dpr) {
        r.size = px;
        r.dpr = dpr;
        r.canvas.width = Math.round(px * dpr);
        r.canvas.height = Math.round(px * dpr);
      }
      if (r.ring) {
        const key = `${mobile}|${r1(r.rIn)}|${r1(r.rOut)}`;
        if (key !== r.ringKey) {
          r.ringKey = key;
          const { e, svg } = ringMarkup(r);
          r.ring.setAttribute('viewBox', `${r1(-e)} ${r1(-e)} ${r1(2 * e)} ${r1(2 * e)}`);
          r.ring.style.width = `${r1(2 * e)}px`;
          r.ring.style.height = `${r1(2 * e)}px`;
          r.ring.innerHTML = svg;
        }
      }
    });
    drawAll();
  }

  /* The route: from the hold line, off the runway edge, through every repo */
  let route = null;
  let mainTop = 0, edgeY = 0, compassAlign = 0, docH = 0;
  const leaders = new Map();

  function addMark(p, kind) {
    const g = svgEl('g', { class: kind === 'start' ? 'mark mark-g' : 'mark' });
    const x = r1(p.x), y = r1(p.y);
    if (kind === 'start') g.appendChild(svgEl('rect', { class: 'mk', x: r1(x - 5.5), y: r1(y - 5.5), width: 11, height: 11 }));
    else if (kind === 'edge') {
      g.appendChild(svgEl('circle', { class: 'mk-ring', cx: x, cy: y, r: 10 }));
      g.appendChild(svgEl('circle', { class: 'mk', cx: x, cy: y, r: 5 }));
    } else g.appendChild(svgEl('path', { class: 'mk', d: `M${x} ${r1(y - 10)}L${r1(x + 2.6)} ${r1(y - 2.6)}L${r1(x + 10)} ${y}L${r1(x + 2.6)} ${r1(y + 2.6)}L${x} ${r1(y + 10)}L${r1(x - 2.6)} ${r1(y + 2.6)}L${r1(x - 10)} ${y}L${r1(x - 2.6)} ${r1(y - 2.6)}Z` }));
    marksG.appendChild(g);
    return g;
  }

  function layoutRoute() {
    const mr = mainEl.getBoundingClientRect();
    const w = Math.round(mr.width), h = Math.round(mr.height);
    routeSvg.setAttribute('width', w);
    routeSvg.setAttribute('height', h);
    routeSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    mainTop = mr.top + scrollY;
    compassAlign = flow.getBoundingClientRect().top + scrollY - headH;
    docH = document.documentElement.scrollHeight;
    const rel = el => {
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2 - mr.left, y: b.top + b.height / 2 - mr.top };
    };
    edgeY = hero.getBoundingClientRect().bottom - mr.top;
    clipG.setAttribute('width', w);
    clipG.setAttribute('height', Math.max(0, r1(edgeY)));
    clipA.setAttribute('width', w);
    clipA.setAttribute('y', r1(edgeY));
    clipA.setAttribute('height', Math.max(0, r1(h - edgeY)));
    marksG.replaceChildren();
    leadersG.replaceChildren();
    leaders.clear();
    const pts = [];
    if (mobile) {
      pts.push(rel(startM));
    } else {
      const fix = rel(workFix);
      if (innerWidth >= 900) {
        const wr = heroWrap.getBoundingClientRect();
        const padL = parseFloat(getComputedStyle(heroWrap).paddingLeft) || 0;
        const x0 = wr.left - mr.left + padL * .42;
        pts.push({ x: x0, y: heroMark.getBoundingClientRect().bottom - mr.top + 9, mark: 'start' }, { x: x0, y: edgeY, mark: 'edge' });
      } else {
        pts.push({ x: fix.x, y: edgeY, mark: 'edge' });
      }
      pts.push({ x: fix.x, y: fix.y, mark: 'fix' });
      const lr = legend.getBoundingClientRect();
      const x2 = lr.right - mr.left;
      if (fix.x - 12 - x2 > 4) leadersG.appendChild(svgEl('path', { class: 'leader', d: `M${r1(fix.x - 12)} ${r1(fix.y)}H${r1(x2)}` }));
      pts.push(rel(vor));
    }
    const firstRepo = pts.length;
    repos.forEach(r => {
      const p = rel(r.canvas);
      pts.push(p);
      if (mobile) return;
      const pr = r.panel.getBoundingClientRect();
      const toRight = pr.left + pr.width / 2 - mr.left > p.x;
      const edge = (r.rOut || r.R + 3) + 5;
      const x1 = p.x + (toRight ? edge : -edge);
      const x2 = (toRight ? pr.left : pr.right) - mr.left;
      const y = clamp(p.y, pr.top - mr.top + 14, pr.bottom - mr.top - 14);
      if ((x2 - x1) * (toRight ? 1 : -1) <= 2) return;
      const path = svgEl('path', {
        class: 'leader',
        d: y === p.y ? `M${r1(x1)} ${r1(y)}H${r1(x2)}` : `M${r1(x1)} ${r1(p.y)}H${r1((x1 + x2) / 2)}V${r1(y)}H${r1(x2)}`
      });
      leadersG.appendChild(path);
      leaders.set(r, path);
    });
    repos.forEach(r => applyOn(r));
    let d = `M${r1(pts[0].x)} ${r1(pts[0].y)}`;
    const Ls = [0];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], k = (b.y - a.y) * .5;
      d += `C${r1(a.x)} ${r1(a.y + k)} ${r1(b.x)} ${r1(b.y - k)} ${r1(b.x)} ${r1(b.y)}`;
      probe.setAttribute('d', d);
      Ls.push(probe.getTotalLength());
    }
    repos.forEach((r, k) => { r.L = Ls[firstRepo + k]; });
    const marks = [];
    pts.forEach((p, i) => { if (p.mark) marks.push({ g: addMark(p, p.mark), L: Ls[i] }); });
    plan.setAttribute('d', d);
    strokes.forEach(p => p.setAttribute('d', d));
    const total = ink.getTotalLength();
    const n = Math.max(2, Math.ceil(total / 6));
    const xs = new Float32Array(n + 1), ys = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const q = ink.getPointAtLength(total * i / n);
      xs[i] = q.x;
      ys[i] = i ? Math.max(q.y, ys[i - 1]) : q.y;
    }
    route = { total, n, xs, ys, marks };
    strokes.forEach(p => { p.style.strokeDasharray = `${total} ${total + 20}`; });
  }

  function lengthAtY(y) {
    const { ys, n, total } = route;
    if (y <= ys[0]) return 0;
    if (y >= ys[n]) return total;
    let lo = 0, hi = n;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ys[m] < y) lo = m; else hi = m; }
    const f = ys[hi] === ys[lo] ? 0 : (y - ys[lo]) / (ys[hi] - ys[lo]);
    return (lo + f) / n * total;
  }

  let firstDraw = true;
  function drawRoute(now) {
    if (!route) return;
    const { total, n, xs, ys } = route;
    const atEnd = scrollY + innerHeight >= docH - 2;
    const len = reduce.matches || atEnd ? total : lengthAtY(scrollY + innerHeight * .62 - mainTop);
    const off = String(total - len);
    strokes.forEach(p => { p.style.strokeDashoffset = off; });
    route.marks.forEach(m => m.g.classList.toggle('on', len >= m.L - 1));
    repos.forEach(r => {
      if (r.state !== 0 || len < r.L - 2) return;
      if (reduce.matches || firstDraw) { r.state = 2; drawRepo(r, now); } else { r.state = 1; r.t0 = now; kick(r); }
    });
    firstDraw = false;
    if (reduce.matches || len >= total - 1) { head.setAttribute('visibility', 'hidden'); return; }
    const i = Math.min(n - 1, Math.floor(len / total * n));
    const f = len / total * n - i;
    const x = xs[i] + (xs[i + 1] - xs[i]) * f, y = ys[i] + (ys[i + 1] - ys[i]) * f;
    const j = Math.min(n, i + 2), b = Math.max(0, i - 1);
    const ang = Math.atan2(ys[j] - ys[b], xs[j] - xs[b]) * 180 / Math.PI;
    head.setAttribute('transform', `translate(${r1(x)} ${r1(y)}) rotate(${r1(ang)})`);
    head.classList.toggle('is-ground', y < edgeY);
    head.setAttribute('visibility', len > 2 ? 'visible' : 'hidden');
  }

  function applyOn(r) {
    const on = r.hov || r.foc || r.phov || r.pfoc || false;
    r.wp.classList.toggle('is-on', on);
    r.panel.classList.toggle('is-on', on);
    if (r.ring) r.ring.classList.toggle('is-on', on);
    const lead = leaders.get(r);
    if (lead) lead.classList.toggle('is-on', on);
    if (on !== r.on) { r.on = on; kick(r); }
  }
  repos.forEach(r => {
    const set = (k, v) => { r[k] = v; applyOn(r); };
    r.wp.addEventListener('pointerenter', () => set('hov', true));
    r.wp.addEventListener('pointerleave', () => set('hov', false));
    r.wp.addEventListener('focus', () => set('foc', true));
    r.wp.addEventListener('blur', () => set('foc', false));
    r.panel.addEventListener('pointerenter', () => set('phov', true));
    r.panel.addEventListener('pointerleave', () => set('phov', false));
    r.panel.addEventListener('focusin', () => set('pfoc', true));
    r.panel.addEventListener('focusout', e => { if (!r.panel.contains(e.relatedTarget)) set('pfoc', false); });
  });

  const ms = initMyStream({ colors, raf: requestAnimationFrame, observe: o => scope.observe(o) });
  themeHooks.push(ms.draw);

  /* Scheduling: one rAF per scroll, full relayout on size changes */
  let ticking = false;
  function update(now) {
    ticking = false;
    const par = parallaxOn();
    const y = scrollY;
    if (typeMotion) setWidth(W_MAX - (W_MAX - W_MIN) * clamp(y / range, 0, 1));
    if (par && y < heroBottom) {
      concrete.style.transform = `translate3d(0, ${r1(y * LAG)}px, 0)`;
      groundPaint.style.transform = `translate3d(0, ${r1(y * PAINT_LAG)}px, 0)`;
      h1.style.transform = `translate3d(0, ${r1(-y * TITLE_LEAD)}px, 0)`;
    }
    for (const L of layers) L.el.style.transform = par ? `translate3d(0, ${r1(-((y * L.rate) % PERIOD))}px, 0)` : '';
    compass.style.transform = par ? `translate3d(0, ${r1(.18 * (y - compassAlign))}px, 0)` : '';
    header.classList.toggle('is-air', y + headH >= heroBottom - 1);
    drawRoute(now || performance.now());
  }
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  let layoutQueued = false;
  const relayout = now => {
    layoutQueued = false;
    measureHero();
    layoutClusters();
    layoutRoute();
    ms.layout();
    stripCue();
    update(now);
  };
  const requestLayout = () => {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(relayout);
  };

  buildLayers();
  relayout();
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', () => { buildLayers(); requestLayout(); }, { passive: true });
  if (document.readyState === 'complete') requestLayout(); else addEventListener('load', requestLayout);
  if ('ResizeObserver' in window) scope.observe(new ResizeObserver(requestLayout)).observe(mainEl);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!scope.disposed) requestLayout(); });
  watch(reduce, () => {
    if (reduce.matches) repos.forEach(r => { if (r.state === 1) r.state = 2; });
    ms.reduce();
    requestLayout();
  });

  return () => scope.dispose();
}
