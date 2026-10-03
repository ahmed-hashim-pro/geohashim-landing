/* Hero terminal: scenes come from PAGE.terminal, typed out one line at a time */
(() => {
  const body = $('#term-body');
  const cfg = PAGE.terminal;
  if (!body || !cfg) return;
  const tabs = $$('.term-tab');
  const SCENES = cfg.scenes, ORDER = cfg.order || Object.keys(SCENES);
  let scene = cfg.first || ORDER[0], run = null, auto = true, visible = false;
  const select = name => { scene = name; tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.scene === name))); };
  const line = (kind, text) => { const s = document.createElement('span'); s.className = kind; s.textContent = text; return s; };
  const renderAll = name => {
    body.replaceChildren();
    for (const [k, t] of SCENES[name]) { body.appendChild(line(k, t)); body.appendChild(document.createTextNode('\n')); }
    body.scrollTop = 0;
  };
  async function type(name, me) {
    body.replaceChildren();
    const caret = document.createElement('span');
    caret.className = 'caret';
    for (const [k, t] of SCENES[name]) {
      const s = line(k, '');
      body.appendChild(s);
      if (k === 'cmd') {
        s.appendChild(caret);
        await wait(260, me);
        for (let i = 0; i < t.length; i += 2) {
          s.textContent = t.slice(0, i + 2);
          s.appendChild(caret);
          body.scrollTop = body.scrollHeight;
          await wait(t.length > 90 ? 9 : 22, me);
        }
        s.textContent = t;
        await wait(380, me);
      } else {
        s.textContent = t;
        await wait(t ? 70 : 30, me);
      }
      body.appendChild(document.createTextNode('\n'));
      body.scrollTop = body.scrollHeight;
    }
    body.appendChild(caret);
  }
  async function play(name) {
    if (run) run.alive = false;
    const me = run = { alive: true };
    select(name);
    if (reduce.matches) { renderAll(name); return; }
    try {
      await type(name, me);
      while (auto && ORDER.length > 1) {
        await wait(4200, me);
        while (!visible) await wait(400, me);
        const next = ORDER[(ORDER.indexOf(scene) + 1) % ORDER.length];
        select(next);
        await type(next, me);
      }
    } catch (e) { if (e !== STOP) throw e; }
  }
  tabs.forEach(t => t.addEventListener('click', () => { auto = false; play(t.dataset.scene); }));
  const replay = $('[data-replay="term"]');
  if (replay) replay.addEventListener('click', () => { auto = false; play(scene); });
  new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); }).observe(body);
  play(scene);
})();

/* Anything marked data-reveal starts reset and settles when it arrives (bars grow, for example) */
(() => {
  if (reduce.matches) return;
  $$('[data-reveal]').forEach(el => {
    el.classList.add('is-reset');
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); el.classList.remove('is-reset'); } }, ARRIVE);
    io.observe(el);
  });
})();

/* Tests: one dot per passing test, gathering into a cluster. PAGE.tests = [[label, count, cssColor], ...] */
(() => {
  const cv = $('#t-canvas');
  if (!cv || !PAGE.tests) return;
  const FILES = PAGE.tests;
  const legend = $('#t-legend');
  if (legend) legend.innerHTML = FILES.map(([f, n, c]) => `<li><i class="t-dot" style="--c:${c}"></i><code>${esc(f)}</code><b>${n}</b></li>`).join('');
  const ctx = cv.getContext('2d');
  const N = FILES.reduce((a, f) => a + f[1], 0), GOLD = Math.PI * (3 - Math.sqrt(5));
  const S = 240, s = 100 / Math.sqrt(N), dotR = Math.max(1.2, s * .375);
  let seed = N;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const dots = [];
  let k = 0;
  for (const [, n, c] of FILES) for (let j = 0; j < n; j++, k++) {
    const rr = Math.sqrt(k + .5), a = k * GOLD;
    const lr = Math.sqrt(rnd()) * Math.sqrt(N), la = rnd() * Math.PI * 2;
    dots.push({ ux: rr * Math.cos(a), uy: rr * Math.sin(a), lx: lr * Math.cos(la), ly: lr * Math.sin(la), dl: k / N * 520 + rnd() * 180, c });
  }
  const colorOf = v => getComputedStyle(cv).getPropertyValue(v.slice(4, -1)).trim() || '#888';
  let t0 = null, done = reduce.matches, raf = 0;
  function draw(now) {
    raf = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== S * dpr) { cv.width = S * dpr; cv.height = S * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);
    let busy = false;
    for (const d of dots) {
      let p = done ? 1 : t0 === null ? 0 : clamp((now - t0 - d.dl) / 900, 0, 1);
      if (p < 1 && t0 !== null) busy = true;
      p = ease(p);
      ctx.globalAlpha = .3 + .7 * p;
      ctx.fillStyle = colorOf(d.c);
      ctx.beginPath();
      ctx.arc(S / 2 + (d.lx + (d.ux - d.lx) * p) * s, S / 2 + (d.ly + (d.uy - d.ly) * p) * s, dotR * (.75 + .25 * p), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (busy) raf = requestAnimationFrame(draw);
    else if (t0 !== null) done = true;
  }
  themeHooks.push(() => { if (!raf) draw(performance.now()); });
  draw(0);
  if (done) return;
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    t0 = performance.now();
    raf = requestAnimationFrame(draw);
  }, ARRIVE);
  io.observe(cv);
})();

/* Guided run: every [data-stage] section in order, one demo at a time */
(() => {
  const btn = $('#tour-btn'), bar = $('#tour-bar');
  if (!btn || !bar) return;
  const btnLabel = $('span', btn), label = $('#tour-label'), stopBtn = $('#tour-stop'), ans = $('#tour-ans');
  const signs = $$('.signs .sign-link');
  const STAGES = $$('[data-stage]').map(sec => {
    const h = $('h2', sec), num = $('.num', h);
    return { demo: $('.demo[id]', sec), name: h.textContent.replace(num ? num.textContent : '', '').trim() };
  }).filter(s => s.demo);
  const N = STAGES.length;
  const idle = `Run all ${N} stages`;
  btnLabel.textContent = idle;
  $('#tour-progress').innerHTML = '<i></i>'.repeat(N);
  const ticks = $$('#tour-progress i');
  let tour = null, hideTimer = 0;
  const glide = el => new Promise(res => {
    const r = el.getBoundingClientRect(), head = header.offsetHeight + 16;
    const room = innerHeight - head;
    const top = Math.max(0, r.top + scrollY - head - (r.height < room ? (room - r.height) / 2 : 0));
    if (Math.abs(top - scrollY) < 4) { res(); return; }
    let settled = false;
    const done = () => { if (!settled) { settled = true; removeEventListener('scrollend', done); res(); } };
    addEventListener('scrollend', done);
    setTimeout(done, 1400);
    window.scrollTo({ top, behavior: reduce.matches ? 'instant' : 'smooth' });
  });
  const show = on => {
    clearTimeout(hideTimer);
    bar.classList.toggle('is-on', on);
    bar.inert = !on;
    btn.setAttribute('aria-pressed', String(on && !!tour));
    btnLabel.textContent = tour ? 'Stop the run' : idle;
  };
  const mark = i => {
    ticks.forEach((t, k) => { t.classList.toggle('done', k < i); t.classList.toggle('now', k === i); });
    signs.forEach((s, k) => { if (k === i) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current'); });
  };
  function stop() {
    if (!tour) return;
    tour.alive = false;
    tour = null;
    mark(-1);
    show(false);
  }
  async function start() {
    const me = tour = { alive: true };
    if (ans) ans.hidden = true;
    stopBtn.textContent = 'Stop';
    show(true);
    try {
      for (let i = 0; i < N; i++) {
        const { demo: el, name } = STAGES[i];
        mark(i);
        label.innerHTML = `<b>Stage ${i + 1} of ${N}</b> ${esc(name)}`;
        await glide(el);
        if (!me.alive) return;
        const d = DEMOS[el.id];
        if (d) {
          if (d.prepare) d.prepare();
          await d.run();
        }
        if (!me.alive) return;
        await wait(reduce.matches ? 2200 : 1300, me);
      }
      tour = null;
      mark(N);
      signs.forEach(s => s.removeAttribute('aria-current'));
      label.innerHTML = `<b>Done</b> All ${N} stages ran.`;
      if (ans) ans.hidden = false;
      stopBtn.textContent = 'Close';
      btnLabel.textContent = idle;
      btn.setAttribute('aria-pressed', 'false');
      hideTimer = setTimeout(() => show(false), 9000);
    } catch (e) { if (e !== STOP) throw e; }
  }
  btn.addEventListener('click', () => (tour ? stop() : start()));
  stopBtn.addEventListener('click', () => { if (tour) stop(); else show(false); });
  if (ans) ans.addEventListener('click', () => show(false));
  // Taking the wheel back ends the run, the way grabbing a scrolling page should.
  const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
  addEventListener('wheel', stop, { passive: true });
  addEventListener('touchstart', e => { if (!bar.contains(e.target) && !btn.contains(e.target)) stop(); }, { passive: true });
  addEventListener('keydown', e => {
    if (!tour) return;
    if (e.key === 'Escape' || (SCROLL_KEYS.has(e.key) && !e.target.closest('button, a, input, textarea, select, summary'))) stop();
  });
})();

/* Copy buttons inside code blocks */
$$('pre .copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.closest('pre').textContent.replace(btn.textContent, '').trim();
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; } catch (e) { btn.textContent = 'Select and copy'; }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
  });
});

/* Chart background, title width, header state and the route rail */
(() => {
  const ground = $('#ground'), mainEl = $('#main'), title = $('#p-title'), rail = $('#rail');
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

  const parallaxOn = () => !reduce.matches && innerWidth >= 700;
  let groundBottom = 0, headH = 60, lastW = -1, mainTop = 0;
  const setWidth = v => { v = Math.round(v * 2) / 2; if (v === lastW) return; lastW = v; title.style.fontVariationSettings = `"wdth" ${v}`; };

  const plan = rail && $('.r-plan', rail), strokes = rail ? $$('.r-stroke', rail) : [], marksG = rail && $('.r-marks', rail);
  const clipG = $('#clip-ground rect'), clipA = $('#clip-air rect');
  let route = null;
  function layoutRail() {
    route = null;
    if (!rail) return;
    marksG.replaceChildren();
    const stages = $$('[data-stage]');
    if (innerWidth < 900 || !stages.length) return;
    const mr = mainEl.getBoundingClientRect();
    mainTop = mr.top + scrollY;
    const wrap = $('.p-hero .wrap'), wr = wrap.getBoundingClientRect();
    const padL = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
    const x = r1(wr.left - mr.left + padL * .42);
    const ys = $$('.num[data-mark]').map(n => { const r = n.getBoundingClientRect(); return r1(r.top + r.height / 2 - mr.top); });
    const startAt = $('.signs') || $('.p-hero');
    const y0 = r1(startAt.getBoundingClientRect().bottom - mr.top + 28);
    const yEnd = r1(stages[stages.length - 1].getBoundingClientRect().bottom - mr.top);
    const split = ground ? r1(ground.getBoundingClientRect().bottom - mr.top - 7) : y0;
    const d = `M${x} ${y0}V${yEnd}`;
    const w = mr.width, h = mr.height;
    rail.setAttribute('width', w);
    rail.setAttribute('height', h);
    plan.setAttribute('d', d);
    strokes.forEach(p => p.setAttribute('d', d));
    clipG.setAttribute('width', w); clipG.setAttribute('height', split);
    clipA.setAttribute('width', w); clipA.setAttribute('y', split); clipA.setAttribute('height', Math.max(0, h - split));
    const total = yEnd - y0;
    strokes.forEach(p => { p.style.strokeDasharray = `${total} ${total}`; });
    const marks = ys.map(y => {
      const c = svgEl('circle', { class: `r-mk${y > split ? ' air' : ''}`, cx: x, cy: y, r: 7 });
      marksG.appendChild(c);
      return { c, L: y - y0 };
    });
    route = { y0, total, marks };
  }
  function drawRail() {
    if (!route) return;
    const len = reduce.matches ? route.total : clamp(scrollY + innerHeight * .62 - mainTop - route.y0, 0, route.total);
    const off = String(route.total - len);
    strokes.forEach(p => { p.style.strokeDashoffset = off; });
    route.marks.forEach(m => m.c.classList.toggle('on', len >= m.L - 1));
  }

  function measure() {
    title.style.minHeight = '';
    lastW = -1;
    setWidth(125);
    headH = header.offsetHeight;
    groundBottom = ground ? ground.getBoundingClientRect().bottom + scrollY : 0;
    if (!reduce.matches && innerWidth >= 700) title.style.minHeight = `${Math.ceil(title.getBoundingClientRect().height)}px`;
    layoutRail();
  }
  let ticking = false;
  function update() {
    ticking = false;
    const y = scrollY, par = parallaxOn();
    if (!reduce.matches && innerWidth >= 700) setWidth(125 - 50 * clamp(y / 420, 0, 1));
    for (const L of layers) L.el.style.transform = par ? `translate3d(0, ${r1(-((y * L.rate) % PERIOD))}px, 0)` : '';
    header.classList.toggle('is-air', y + headH >= groundBottom - 1);
    drawRail();
  }
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  let lq = false;
  const relayout = () => { lq = false; measure(); update(); };
  const requestLayout = () => { if (!lq) { lq = true; requestAnimationFrame(relayout); } };
  buildLayers();
  relayout();
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', () => { buildLayers(); requestLayout(); }, { passive: true });
  addEventListener('load', requestLayout);
  if ('ResizeObserver' in window) new ResizeObserver(requestLayout).observe(mainEl);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestLayout);
  reduce.addEventListener('change', requestLayout);
})();
