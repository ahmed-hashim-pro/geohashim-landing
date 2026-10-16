/* Captures are verbatim output of ops-console at 6aedde9 and readings from the running app.
   PERF.readme is perf/results-*.json as committed; PERF.local is the same script re-run for this page. */
const CAP = /*@@DATA:captures@@*/;
const PERF = /*@@DATA:perf@@*/;
const SHOTS = /*@@DATA:shots@@*/;
const fmt = n => Math.round(n).toLocaleString('en-US');
const MODES = ['batched', 'eager', 'naive', 'zone'];

function miniTerm(el, lines) {
  el.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const spans = $$('span', el);
  return {
    hide() { spans.forEach(s => s.classList.add('is-off')); },
    show() { spans.forEach(s => s.classList.remove('is-off')); },
    async play(me, ms = 70) { for (const s of spans) { s.classList.remove('is-off'); await wait(s.classList.contains('cmd') ? 380 : ms, me); } }
  };
}

/* Screenshots: decoded when their demo comes near; the dashboard shows the one for the current theme */
(() => {
  const imgs = $$('img[data-shot]');
  const theme = () => root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const wanted = img => !['light', 'dark'].includes(img.dataset.shot) || img.dataset.shot === theme();
  const near = new Set();
  const load = () => imgs.forEach(img => { if (near.has(img) && wanted(img) && !img.src) img.src = SHOTS[img.dataset.shot]; });
  const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { near.add(e.target); io.unobserve(e.target); } }); load(); }, { rootMargin: '800px 0px' });
  imgs.forEach(i => io.observe(i));
  themeHooks.push(load);
  PAGE.loadShots = el => { $$('img[data-shot]', el).forEach(i => near.add(i)); load(); };
})();

/* Hero terminal */
(() => {
  const gap = ['out', ''];
  const sse = CAP.sse.filter(t => t !== '');
  const firstBad = sse.findIndex(t => t.includes('rate=500000'));
  const events = sse.slice(0, firstBad).filter(t => !t.startsWith('$ '));
  PAGE.terminal = {
    scenes: {
      perf: [['dim', '# what CI\'s perf job runs: batched and naive at 10,000 events/s'], ['cmd', 'node perf/run.mjs --modes batched,naive --rates 10000 --seconds 15 --warmup 5 --out perf/check.json --check'],
        ...CAP.perfCheck.map(t => [/^load/.test(t) ? 'dim' : /passed/.test(t) ? 'ok' : 'out', t])],
      test: [['cmd', 'npm test'], ['dim', '> ng test --watch=false && node --test server/*.test.mjs test/*.test.mjs'], ...CAP.vitest.slice(1).filter(t => !/Start at/.test(t)).map(t => ['out', t.trim()]), gap,
        ...CAP.tap.map(t => [/^ok/.test(t) ? 'ok' : 'out', t])],
      e2e: [['cmd', 'npx playwright test'], ...CAP.e2e.map(t => [/passed \(/.test(t) ? 'ok' : 'out', t.trim()])],
      sse: [['cmd', 'curl -sN "localhost:8093/events?seed=1&n=5000&rate=200" --max-time 0.12'], ...events.slice(0, 14).map(t => ['out', t]), ['dim', `# ... ${events.length - 14} more lines, then curl stops`], gap,
        ...sse.slice(firstBad, firstBad + 4).map(t => (t.startsWith('$ ') ? ['cmd', t.slice(2)] : /^\d{3}$/.test(t) ? ['dim', `# HTTP ${t}`] : ['out', t]))]
    },
    order: ['perf', 'test', 'e2e', 'sse'],
    first: 'perf'
  };
})();

/* Tests per file */
PAGE.tests = [['store.spec.ts', 9, 'var(--blue)'], ['view.spec.ts', 5, 'var(--water)'], ['misc.spec.ts', 4, 'var(--ink-2)'], ['announcer.spec.ts', 3, 'var(--green)'], ['fleet-table.spec.ts', 2, 'var(--magenta)'], ['model.spec.ts', 1, 'var(--red)'],
  ['server.test.mjs', 5, 'var(--yellow)'], ['contrast.test.mjs', 3, 'var(--pass)'], ['e2e: keyboard', 14, 'var(--blue)'], ['e2e: a11y', 10, 'var(--magenta)'], ['e2e: modes', 4, 'var(--water)']];

/* 1. The stream: SSE lines, then the mix of a million events */
(() => {
  const el = $('#d-stream');
  const sse = CAP.sse.filter(t => t !== '');
  const end = sse.findIndex((t, i) => i > 0 && t.startsWith('$ '));
  const lines = sse.slice(1, end);
  const box = $('#oc-sse');
  box.innerHTML = `<span class="cmd">${esc(sse[0].slice(2))}</span>` + lines.slice(0, 15).map(t => {
    const m = t.match(/^data: \[(\d)/);
    return `<span class="${m ? `k${m[1]}` : 'meta'}">${esc(t)}</span>`;
  }).join('') + `<span class="dim"># ${lines.length - 15} more lines</span>`;
  const spans = $$('span', box);
  const MIX = [['Metric samples', 992511, 'var(--blue)'], ['Status changes', 6980, 'var(--yellow)'], ['Alerts raised', 376, 'var(--red)'], ['Alerts resolved', 133, 'var(--pass)']];
  const total = MIX.reduce((a, m) => a + m[1], 0);
  $('#oc-mix').innerHTML = `<div class="oc-mix-bar">${MIX.map(([, n, c]) => `<i style="--c:${c};flex-grow:${n}"></i>`).join('')}</div>`
    + `<ul class="oc-mix-l">${MIX.map(([l, n, c]) => `<li><i class="sw" style="--c:${c}"></i>${l}<b>${fmt(n)}</b><small>${(n / total * 100).toFixed(2)}%</small></li>`).join('')}</ul>`;
  const mix = $('#oc-mix');
  demo(el, {
    reset() { spans.forEach(s => s.classList.add('is-off')); mix.classList.add('is-off'); },
    final() { spans.forEach(s => s.classList.remove('is-off')); mix.classList.remove('is-off'); },
    async play(me) {
      await wait(250, me);
      for (const s of spans) { s.classList.remove('is-off'); await wait(s.classList.contains('cmd') ? 420 : 90, me); }
      await wait(300, me);
      mix.classList.remove('is-off');
    }
  });
})();

/* 2. Renders a second per store, log scale */
const readmeAt = (rate, throttle) => MODES.map(m => PERF.readme.find(r => r.mode === m && r.rate === rate && r.throttle === throttle));
const logW = (v, lo, hi) => clamp(Math.log10(Math.max(v, lo) / lo) / Math.log10(hi / lo), 0, 1);
(() => {
  const el = $('#d-store'), box = $('#oc-renders');
  const rows = readmeAt(10000, 1);
  const WHAT = { batched: 'one update per frame', eager: 'signals per event, renders coalesced', naive: 'a new list per event', zone: 'change detection per event' };
  box.innerHTML = rows.map(r => `<div class="oc-rrow" role="row"><span role="rowheader"><b>${r.mode}</b><small>${WHAT[r.mode]}</small></span><span class="oc-track" role="cell"><i style="--s:${logW(r.rendersPerSec, 1, 20000).toFixed(4)}"></i></span><b role="cell">${fmt(r.rendersPerSec)}/s</b></div>`).join('');
  $$('.oc-scale span', el).forEach((s, i) => { s.style.left = `${(logW(10 ** i, 1, 20000) * 100).toFixed(2)}%`; });
  const b = rows[0];
  $('#oc-fold').innerHTML = `Batched folds <b>${Math.round(b.achievedPerSec / b.rendersPerSec)}</b> events into each render: ${fmt(b.achievedPerSec)} events a second, ${fmt(b.rendersPerSec)} renders. Zone renders once per event.`;
  const rr = $$('.oc-rrow', box), fold = $('#oc-fold');
  demo(el, {
    reset() { rr.forEach(r => r.classList.add('is-off')); fold.classList.add('is-off'); },
    final() { rr.forEach(r => r.classList.remove('is-off')); fold.classList.remove('is-off'); },
    async play(me) {
      await wait(250, me);
      for (const r of rr) { r.classList.remove('is-off'); await wait(650, me); }
      fold.classList.remove('is-off');
    }
  });
})();

/* 3. Every store, every condition, in either run */
(() => {
  const el = $('#d-break'), grid = $('#oc-grid'), env = $('#oc-env');
  const CONDS = [[10000, 1], [20000, 1], [40000, 1], [2000, 4], [5000, 4], [10000, 4]];
  const label = ([r, t]) => `${fmt(r)}/s${t > 1 ? ', 4x CPU' : ''}`;
  const RUNS = [['readme', "README's run"], ['local', 'Busy re-run']];
  const have = (run, [r, t]) => PERF[run].some(x => x.rate === r && x.throttle === t);
  const condSeg = $('#oc-cond'), runSeg = $('#oc-run');
  condSeg.innerHTML = CONDS.map((c, i) => `<button type="button" aria-pressed="false" data-i="${i}">${label(c)}</button>`).join('');
  runSeg.innerHTML = RUNS.map(([k, l]) => `<button type="button" aria-pressed="false" data-k="${k}">${l}</button>`).join('');
  grid.innerHTML = `<div class="oc-grow oc-ghead" role="row"><span role="columnheader">Store</span><span role="columnheader">Dropped frames</span><span role="columnheader">Input delay, p95</span><span role="columnheader">Data age, p95</span></div>`
    + MODES.map(m => `<div class="oc-grow" role="row" data-mode="${m}"><span role="rowheader"><b>${m}</b></span><span class="oc-cell" role="cell"><span class="oc-track"><i data-k="drop"></i></span><b data-v="drop"></b></span><span class="oc-cell" role="cell"><span class="oc-track oc-log"><i data-k="input"></i></span><b data-v="input"></b></span><span class="oc-cell oc-age" role="cell"><b data-v="age"></b></span></div>`).join('');
  const ms = v => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);
  let cur = { run: 'readme', c: 0 };
  const set = (run, c) => {
    if (!have(run, CONDS[c])) c = CONDS.findIndex(x => have(run, x));
    cur = { run, c };
    const [rate, thr] = CONDS[c];
    $$('button', condSeg).forEach((b, i) => { b.setAttribute('aria-pressed', String(i === c)); b.disabled = !have(run, CONDS[i]); });
    $$('button', runSeg).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === run)));
    for (const m of MODES) {
      const r = PERF[run].find(x => x.mode === m && x.rate === rate && x.throttle === thr);
      const row = $(`[data-mode="${m}"]`, grid);
      $('[data-k="drop"]', row).style.transform = `scaleX(${(r.droppedPct / 100).toFixed(4)})`;
      $('[data-k="input"]', row).style.transform = `scaleX(${logW(r.inputP95, 10, 20000).toFixed(4)})`;
      $('[data-v="drop"]', row).textContent = `${r.droppedPct.toFixed(1)}%`;
      $('[data-v="input"]', row).textContent = ms(r.inputP95);
      $('[data-v="age"]', row).textContent = ms(r.staleP95);
      row.classList.toggle('is-bad', r.droppedPct >= 10);
    }
    const e = PERF.env[run][thr > 1 ? 1 : 0];
    env.textContent = `${label(CONDS[c])}. ${run === 'readme' ? 'Measured' : 'Re-run'} ${e.date.slice(0, 10)} in Chromium ${e.chromium}, load average ${e.loadBefore.toFixed(1)} before and ${e.loadAfter.toFixed(1)} after the series.`;
  };
  let d = null;
  $$('button', condSeg).forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; set(cur.run, i); }));
  $$('button', runSeg).forEach(b => b.addEventListener('click', () => { if (d) d.stopAuto = true; set(b.dataset.k, cur.c); }));
  d = demo(el, {
    reset() { set('readme', 0); },
    final() { set('readme', 5); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < CONDS.length; i++) { if (d.stopAuto) return; set('readme', i); await wait(1500, me); }
      if (d.stopAuto) return;
      set('local', 5);
    }
  });
})();

/* 4. The table: screenshot and DOM counts */
(() => {
  const el = $('#d-table'), ui = CAP.ui;
  const soakNodes = CAP.soak.filter(t => /DOM nodes \d/.test(t)).map(t => +t.match(/DOM nodes (\d+)/)[1]);
  const STATS = [['Rows in the DOM', `${ui.trInDom - ui.trPad} of 5,000`], ['aria-rowcount', fmt(+ui.rowcount)], ['Elements in the page', fmt(ui.domNodes)], ['DOM nodes, 10 min', `${fmt(Math.min(...soakNodes))} to ${fmt(Math.max(...soakNodes))}`], ['Row height', '36 px']];
  const box = $('#oc-dom');
  box.innerHTML = STATS.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const parts = [$('#oc-shot'), ...$$('div', box)];
  demo(el, {
    reset() { parts.forEach(p => p.classList.add('is-off')); },
    final() { PAGE.loadShots(el); parts.forEach(p => p.classList.remove('is-off')); },
    async play(me) {
      PAGE.loadShots(el);
      await wait(200, me);
      for (const p of parts) { p.classList.remove('is-off'); await wait(p.id ? 700 : 260, me); }
    }
  });
})();

/* 5. The order held under focus */
(() => {
  const el = $('#d-focus'), ui = CAP.ui;
  const cols = { unfocused: ui.unfocused, focused: ui.focused };
  for (const [k, v] of Object.entries(cols)) {
    const col = $(`[data-col="${k}"]`, el);
    $('[data-note]', col).textContent = v.note;
    $('[data-t="0"]', col).innerHTML = v.before.map(n => `<li>${esc(n)}</li>`).join('');
    $('[data-t="1"]', col).innerHTML = v.after.map((n, i) => `<li class="${n === v.before[i] ? 'is-same' : 'is-moved'}">${esc(n)}</li>`).join('');
  }
  const parse = t => { const f = t.split(' '); return { name: f[0], status: f[3], cpu: f[4] }; };
  const v0 = ui.focused.vals0.map(parse), v1 = ui.focused.vals1.map(parse);
  $('#oc-vals').innerHTML = `<p class="oc-k">Meanwhile, on the held rows</p><ul>${v0.map((a, i) => `<li><code>${esc(a.name)}</code><span>CPU ${a.cpu} to ${v1[i].cpu}</span><span>${a.status === v1[i].status ? a.status : `${a.status} to ${v1[i].status}`}</span></li>`).join('')}</ul>`;
  const t0 = $$('[data-t="0"]', el), t1 = $$('[data-t="1"]', el), notes = $$('[data-note]', el), vals = $('#oc-vals');
  const show = s => {
    t0.forEach(o => o.classList.toggle('is-off', s < 1));
    t1.forEach(o => o.classList.toggle('is-off', s < 2));
    t1.forEach(o => o.classList.toggle('is-marked', s >= 3));
    notes.forEach(n => n.classList.toggle('is-off', s < 3));
    vals.classList.toggle('is-off', s < 4);
  };
  demo(el, {
    reset() { show(0); },
    final() { show(4); },
    async play(me) { for (let s = 1; s <= 4; s++) { await wait(s === 1 ? 250 : 1100, me); show(s); } }
  });
})();

/* 6. Thirty-one seconds of announcements */
(() => {
  const el = $('#d-announce'), a = CAP.ui.announce, T = 31000;
  const head = $('#oc-tl-head'), said = $('#oc-said');
  $('#oc-tl-marks').innerHTML = a.out.map(o => `<i style="left:${(o.at / T * 100).toFixed(2)}%"></i>`).join('');
  $$('.oc-tl-scale span', el).forEach((s, i) => { s.style.left = `${(i * 10000 / T * 100).toFixed(2)}%`; });
  said.innerHTML = a.out.map(o => `<li><span>${(o.at / 1000).toFixed(1)} s</span>${esc(o.text)}</li>`).join('');
  const announced = a.out.reduce((n, o) => n + +o.text.match(/^(\d+)/)[1], 0);
  $('#oc-alerts').innerHTML = [['Open alerts at 0 s', a.open0], ['Open alerts at 31 s', a.open1], ['Announcements', a.out.length], ['Critical alerts in them', announced], ['The test allows', 'at most 3 in 21 s']].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const marks = $$('#oc-tl-marks i', el), items = $$('li', said);
  const at = ms => {
    head.style.transform = `translateX(${(ms / T * 100).toFixed(2)}%)`;
    a.out.forEach((o, i) => { const on = ms >= o.at; marks[i].classList.toggle('on', on); items[i].classList.toggle('is-off', !on); });
  };
  demo(el, {
    reset() { at(0); },
    final() { at(T); },
    async play(me) {
      const SPEED = 5;
      const start = performance.now();
      for (;;) {
        const ms = Math.min(T, (performance.now() - start) * SPEED);
        at(ms);
        if (ms >= T) break;
        await wait(50, me);
      }
    }
  });
})();

/* 7. The 28 browser tests, the dialog and the pause */
(() => {
  const el = $('#d-keys'), list = $('#oc-e2e');
  const rows = CAP.e2e.filter(t => /✓/.test(t)).map(t => {
    const m = t.match(/✓\s+(\d+) \[chromium\] › e2e\/(\w+)\.spec\.ts:\d+:\d+ › (.*) \(([\d.]+m?s)\)$/);
    return { n: +m[1], file: m[2], name: m[3].replace(/ › /g, ': '), dur: m[4] };
  }).sort((a, b) => a.n - b.n);
  const FILES = [['a11y', 'e2e/a11y.spec.ts'], ['keyboard', 'e2e/keyboard.spec.ts'], ['modes', 'e2e/modes.spec.ts']];
  list.innerHTML = FILES.map(([f, path]) => `<li class="oc-e2e-f"><code>${path}</code></li>` + rows.filter(r => r.file === f).map(r => `<li class="oc-e2e-t"><span class="oc-tick" aria-hidden="true"></span><span class="oc-tn">${esc(r.name)}</span><small>${r.dur}</small></li>`).join('')).join('');
  const items = $$('li.oc-e2e-t', list);
  const P = CAP.ui.paused, tiles = xs => xs.slice(0, 5).join(' · ');
  const term = miniTerm($('#oc-pause'), [['dim', '# the tiles, then two seconds after p'], ['out', tiles(P.before)], ['dim', '# pressed p'], ['out', tiles(P.after)], ['ok', `${P.chip} chip shown; status region: "${P.status}"`]]);
  demo(el, {
    reset() { items.forEach(i => i.classList.remove('is-ok')); term.hide(); },
    final() { PAGE.loadShots(el); items.forEach(i => i.classList.add('is-ok')); term.show(); },
    async play(me) {
      PAGE.loadShots(el);
      await wait(250, me);
      for (const i of items) { i.classList.add('is-ok'); await wait(110, me); }
      await wait(300, me);
      await term.play(me, 500);
    }
  });
})();

/* CI jobs, run 38671231509 */
(() => {
  const JOBS = [['Build and unit tests', 28], ['Playwright', 91], ['Perf check', 99], ['Ten-minute soak', 690]];
  $('#oc-ci').innerHTML = JOBS.map(([n, s]) => `<div class="bar-row"><span>${n}</span><span class="bar"><i style="--w:${(s / 690 * 100).toFixed(1)}%"></i></span><span>${s} s</span></div>`).join('');
})();
