/* Every table, run and report below is verbatim output of rate-proof at commit 38d4084.
   CAP holds whole runs with their exit codes; RUNS holds the live half of three Redis runs. */
const CAP = /*@@DATA:captures@@*/;
const RUNS = /*@@DATA:runs@@*/;

const ALGOS = ['fixed-window', 'sliding-log', 'sliding-counter', 'token-bucket', 'leaky-bucket', 'gcra'];
const toneOf = t => (/^rateproof: |DIFFERS/.test(t) ? 'err' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];
const cols = t => t.trim().split(/\s+/);
const pct = s => parseFloat(s);

/* The table: one row per algorithm, [ideal, then peak and over for four deployments, then honest] */
const TABLE = (() => {
  const rows = {};
  for (const t of CAP.table.out) {
    const c = cols(t);
    if (ALGOS.includes(c[0])) rows[c[0]] = { ideal: pct(c[1]), cells: [[c[2], c[3]], [c[4], c[5]], [c[6], c[7]], [c[8], c[9]]], honest: c[10] };
  }
  return rows;
})();
/* One run's per-key rows */
const keysOf = run => {
  const out = {};
  for (const t of run.out) {
    const c = cols(t);
    if (['flood', 'boundary', 'on-off', 'honest'].includes(c[0])) out[c[0]] = { req: +c[1], adm: +c[2], ideal: +c[3], over: c[4], peak: c[5], viol: +c[6], away: c[7] };
  }
  return out;
};
/* The Redis run: part 1 rows and part 2 rows */
const parseRedis = lines => {
  const diff = [], live = [];
  for (const t of lines) {
    let m = t.match(/^\s+([a-z-]+)\s+(\d+) calls\s+(\d+) admitted\s+(\d+) mismatches/);
    if (m) { diff.push({ algo: m[1], calls: +m[2], adm: +m[3], miss: +m[4] }); continue; }
    m = t.match(/^\s{3}(\S.*?)\s{2,}(peak|over)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+) \/ (\d+)/);
    if (m) live.push({ name: m[1], metric: m[2], redis: m[3], sim: m[4], mean: m[5], ar: +m[6], as: +m[7] });
  }
  return { diff, live };
};
const REDIS = parseRedis(CAP.redis.out);

/* A small terminal whose lines are revealed one at a time */
function miniTerm(el, lines) {
  el.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const spans = $$('span', el);
  return {
    hide() { spans.forEach(s => s.classList.add('is-off')); },
    show() { spans.forEach(s => s.classList.remove('is-off')); },
    async play(me, ms = 70) { for (const s of spans) { s.classList.remove('is-off'); await wait(s.classList.contains('cmd') ? 380 : ms, me); } }
  };
}

/* Hero terminal */
(() => {
  const gap = ['out', ''];
  PAGE.terminal = {
    scenes: {
      table: [...runLines(CAP.table)],
      tb: [['dim', '# the token bucket, node clocks 50 ms apart'], ...runLines(CAP.tb50), gap, ...exitLines(CAP.tb50)],
      store: [['dim', '# the same run, reading the store\'s clock'], ...runLines(CAP.tb50store), gap, ...exitLines(CAP.tb50store)],
      redis: [['dim', '# Redis 7.4.11 in Docker on this machine'], ...runLines(CAP.redis), gap, ...exitLines(CAP.redis)]
    },
    order: ['table', 'tb', 'store', 'redis'],
    first: 'table'
  };
})();

/* Tests per package, from go test -json ./... with RATEPROOF_REDIS set */
PAGE.tests = [['sim', 12, 'var(--blue)'], ['limiter', 11, 'var(--yellow)'], ['cmd/rateproof', 5, 'var(--magenta)'], ['redisx', 5, 'var(--water)']];

/* 1. The six algorithms, their peak on one node with a true clock */
(() => {
  const el = $('#d-algos'), list = $('#rp-al');
  const INFO = {
    'fixed-window': ['count per aligned window', 'count < 100', 'at most Limit per aligned window'],
    'sliding-log': ['admit times in the last window', 'fewer than 100 remain', 'at most Limit in any window'],
    'sliding-counter': ['this window\'s count and the last', 'weighted estimate + 1 ≤ 100', 'at most Limit per aligned window'],
    'token-bucket': ['tokens, last', 'a token after refilling', 'at most Limit + rate*t in any interval t'],
    'leaky-bucket': ['level, last', 'level + 1 ≤ 100 after draining', 'at most Limit + rate*t in any interval t'],
    gcra: ['theoretical arrival time', 'TAT − now ≤ 99 intervals', 'at most Limit + rate*t in any interval t']
  };
  const MAX = 2.2;
  list.innerHTML = ALGOS.map(a => {
    const [state, when, promise] = INFO[a], peak = TABLE[a].ideal;
    return `<li class="rp-al-row"><p class="rp-al-n"><code>${a}</code><small>Stores ${esc(state)}. Admits when ${esc(when)}.</small><small class="rp-al-p">Promise: ${esc(promise)}</small></p>
      <div class="rp-al-bar"><span class="rp-al-lim" style="--x:${(1 / MAX) * 100}%"></span><i style="--w:${(peak / MAX).toFixed(4)}"></i></div>
      <b class="rp-al-v">${peak.toFixed(2)}x</b></li>`;
  }).join('');
  const rows = $$('.rp-al-row', list);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); },
    final() { rows.forEach(r => r.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(520, me); }
    }
  });
})();

/* 2. Node clocks 50 ms apart: the one line, and what each bucket let through */
(() => {
  const el = $('#d-skew');
  const OFFS = ['−25.0', '−8.3', '+8.3', '+25.0'];
  $('#rp-clocks').innerHTML = '<span class="rp-k">Node clocks</span>' + OFFS.map((o, i) => `<span class="rp-clk"><small>node ${i + 1}</small>${o} ms</span>`).join('');
  const CODE = [
    ['token-bucket', 's.last = now', 'bad'],
    ['leaky-bucket', 's.last = max(s.last, now)', 'ok'],
    ['gcra', 'base := max(s.tat, now)', 'ok']
  ];
  $('#rp-code').innerHTML = CODE.map(([a, c, k]) => `<p class="rp-cl" data-k="${k}"><span>${a}</span><code>${esc(c)}</code></p>`).join('');
  const RUN = { 'token-bucket': CAP.tb50, 'leaky-bucket': CAP.lb50, gcra: CAP.gcra50 };
  const list = $('#rp-fl');
  list.innerHTML = Object.entries(RUN).map(([a, r]) => {
    const f = keysOf(r).flood;
    return `<li class="rp-fl-row" data-k="${f.adm === f.req ? 'bad' : 'ok'}"><code class="rp-fl-n">${a}</code>
      <span class="rp-fl-bar" title="${f.adm} of ${f.req}"><i style="--w:${(f.adm / f.req).toFixed(4)}"></i><span class="rp-fl-ideal" style="--x:${(f.ideal / f.req) * 100}%"></span></span>
      <span class="rp-fl-num"><b>${f.adm.toLocaleString('en-US')}</b> of ${f.req.toLocaleString('en-US')}</span>
      <span class="rp-fl-i"><small>ideal </small>${f.ideal.toLocaleString('en-US')}</span>
      <b class="rp-fl-o">${f.over}</b></li>`;
  }).join('');
  const rows = $$('.rp-fl-row', list), clocks = $$('.rp-clk', el), lines = $$('.rp-cl', el);
  const tail = CAP.tb50.out.slice(-3);
  const term = miniTerm($('#rp-skew-term'), [['dim', '# the end of the token bucket\'s run'], ...tail.map(t => [toneOf(t), t]), ...exitLines(CAP.tb50)]);
  const set = on => { [...clocks, ...lines, ...rows].forEach(x => x.classList.toggle('in', on)); };
  demo(el, {
    reset() { set(false); term.hide(); },
    final() { set(true); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const c of clocks) { c.classList.add('in'); await wait(200, me); }
      await wait(300, me);
      for (let i = 0; i < rows.length; i++) {
        lines[i].classList.add('in'); await wait(500, me);
        rows[i].classList.add('in'); await wait(900, me);
      }
      await term.play(me, 140);
    }
  });
})();

/* 3. The table as a grid, one deployment at a time */
(() => {
  const el = $('#d-table'), tbl = $('#rp-hm'), note = $('#rp-hm-note');
  const HEAD = ['Ideal', '50 ms skew, node clocks', '50 ms skew, store clock', 'Store wiped once', 'Local split, restarts', 'Honest client turned away'];
  const tone = p => (p <= 1.25 ? 1 : p <= 2.05 ? 2 : 3);
  tbl.innerHTML = `<thead><tr><th scope="col"><span class="vh">Algorithm</span></th>${HEAD.map((h, i) => `<th scope="col" data-c="${i}">${h}</th>`).join('')}</tr></thead><tbody>${ALGOS.map(a => {
    const r = TABLE[a];
    return `<tr><th scope="row"><code>${a}</code></th><td data-c="0" data-t="${tone(r.ideal)}"><b>${r.ideal.toFixed(2)}x</b></td>${r.cells.map(([p, o], i) => `<td data-c="${i + 1}" data-t="${tone(pct(p))}"><b>${p}</b><small>${o}</small></td>`).join('')}<td data-c="5" data-t="0" class="rp-hm-h"><b>${r.honest}</b></td></tr>`;
  }).join('')}</tbody>`;
  const byCol = c => $$(`td[data-c="${c}"], th[data-c="${c}"]`, tbl);
  const NOTES = [
    'One node, a true clock, no latency: what each algorithm does by design.',
    'Node clocks 50 ms apart. The token bucket lets the whole flood through, 5.79x.',
    'The same skew, but reading the store\'s clock: every peak is back to its ideal.',
    'The store loses every key once, 10.5 s in. Even the sliding log admits two full windows in one second.',
    'No store: each node allows 25 of the 100 and restarts every 5 s. 5.5% to 11.1% too much gets through.',
    'And the same split turns away up to 6.6% of a client that never exceeded its limit.'
  ];
  const show = n => { for (let c = 0; c < 6; c++) byCol(c).forEach(x => x.classList.toggle('in', c <= n)); note.textContent = NOTES[Math.max(0, n)]; };
  demo(el, {
    reset() { show(-1); note.textContent = ''; },
    final() { show(5); note.textContent = 'Every number in this grid is one cell of the real run, worst seed and worst attack pattern.'; },
    async play(me) {
      await wait(300, me);
      for (let c = 0; c < 6; c++) { show(c); await wait(c === 0 ? 1500 : 1900, me); }
    }
  });
})();

/* 4. Mutants: the correct deployments stay clean, every planted bug is caught */
(() => {
  const el = $('#d-mutants');
  const rows = CAP.mutants.out.map(t => t.match(/^(\S+(?: \/ \S+)?)\s+(clean|caught)\s+(\S+)\s+(\d+\/\d+)\s*(.*)$/)).filter(Boolean);
  $('#rp-ok').innerHTML = rows.filter(r => r[2] === 'clean').map(r => `<li class="rp-ok-c"><span class="rp-tick" aria-hidden="true"></span><code>${esc(r[1])}</code><small>clean, ${r[4]}</small></li>`).join('');
  $('#rp-bug').innerHTML = rows.filter(r => r[2] === 'caught').map(r => `<li class="rp-bug-c"><span class="rp-x" aria-hidden="true"></span><span class="rp-bug-n"><code>${esc(r[1])}</code><small>${esc(r[5])}</small></span><b>caught</b><span class="rp-bug-s">seed ${r[3]} · ${r[4]}</span></li>`).join('');
  const ok = $$('.rp-ok-c', el), bug = $$('.rp-bug-c', el);
  demo(el, {
    reset() { [...ok, ...bug].forEach(x => x.classList.remove('in')); },
    final() { [...ok, ...bug].forEach(x => x.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      for (const x of ok) { x.classList.add('in'); await wait(110, me); }
      await wait(400, me);
      for (const x of bug) { x.classList.add('in'); await wait(480, me); }
    }
  });
})();

/* 5. The leaky bucket in Go and in Lua, line for line, then part 1 of the Redis run */
(() => {
  const el = $('#d-diff');
  const GO = [
    'func (s *leakyBucket) Decide(now int64, c Config, _ string) (bool, int64) {',
    '\tif !s.init {',
    '\t\ts.init, s.level, s.last = true, 0, now',
    '\t}',
    '\ts.level = max(0, s.level-max(0, now-s.last)*c.Limit)',
    '\ts.last = max(s.last, now)',
    '\tif s.level+c.Window <= c.Limit*c.Window {',
    '\t\ts.level += c.Window',
    '\t\treturn true, s.level',
    '\t}',
    '\treturn false, s.level',
    '}'
  ];
  const LUA = [
    'local cap = L * W',
    'local s = redis.call("HMGET", KEYS[1], "level", "last")',
    'local level, last = 0, now',
    'if s[1] then level, last = tonumber(s[1]), tonumber(s[2]) end',
    'level = math.max(0, level - math.max(0, now - last) * L)',
    'last = math.max(last, now)',
    'local ok = 0',
    'if level + W <= cap then level, ok = level + W, 1 end',
    'redis.call("HSET", KEYS[1], "level", n(level), "last", n(last))',
    'redis.call("PEXPIRE", KEYS[1], n(ttl))',
    'return {ok, level, tnow}'
  ];
  const PAIRS = [[[2], [2, 3]], [[4], [4]], [[5], [5]], [[6, 7, 8, 9, 10], [6, 7, 10]]];
  const paint = (pre, src) => { pre.innerHTML = src.map(t => `<span>${esc(t) || ' '}</span>`).join(''); return $$('span', pre); };
  const g = paint($('#rp-go'), GO), l = paint($('#rp-lua'), LUA);
  const list = $('#rp-dx');
  list.innerHTML = REDIS.diff.map(d => `<li class="rp-dx-row"><code>${d.algo}</code><span class="rp-dx-c"><b data-to="${d.calls}">0</b> calls</span><span class="rp-dx-a">${d.adm.toLocaleString('en-US')} admitted</span><span class="rp-dx-m" data-n="${d.miss}"><b>${d.miss}</b> mismatches</span></li>`).join('');
  const rows = $$('.rp-dx-row', list);
  const hi = k => { g.forEach((s, i) => s.classList.toggle('hl', k >= 0 && PAIRS[k][0].includes(i))); l.forEach((s, i) => s.classList.toggle('hl', k >= 0 && PAIRS[k][1].includes(i))); };
  const fill = (r, v) => { const b = $('.rp-dx-c b', r); b.textContent = Math.round(v * +b.dataset.to).toLocaleString('en-US'); };
  demo(el, {
    reset() { hi(-1); rows.forEach(r => { r.classList.remove('in', 'done'); fill(r, 0); }); },
    final() { hi(-1); rows.forEach(r => { r.classList.add('in', 'done'); fill(r, 1); }); },
    async play(me) {
      await wait(300, me);
      for (let k = 0; k < PAIRS.length; k++) { hi(k); await wait(1100, me); }
      hi(-1);
      for (const r of rows) {
        r.classList.add('in');
        for (let s = 1; s <= 8; s++) { fill(r, s / 8); await wait(45, me); }
        r.classList.add('done');
        await wait(160, me);
      }
    }
  });
})();

/* 6. The live cases: Redis, the replay, and the mean-delay model */
(() => {
  const el = $('#d-live'), tbl = $('#rp-lv');
  tbl.innerHTML = `<thead><tr><th scope="col">Case</th><th scope="col">Redis</th><th scope="col">Replay</th><th scope="col">Mean delay</th><th scope="col">Admitted, Redis / replay</th></tr></thead><tbody>${REDIS.live.map(c => `<tr class="rp-lv-row">
      <th scope="row">${esc(c.name)}<small>${c.metric}</small></th>
      <td data-s="redis">${esc(c.redis)}</td>
      <td data-s="sim" data-eq="${c.sim === c.redis}">${esc(c.sim)}</td>
      <td data-s="mean" data-eq="${c.mean === c.redis}">${esc(c.mean)}</td>
      <td data-s="adm" data-eq="${c.ar === c.as}">${c.ar} / ${c.as}</td></tr>`).join('')}</tbody>`;
  const rows = $$('.rp-lv-row', tbl), sum = $('#rp-lv-sum');
  const exact = REDIS.live.filter(c => c.redis === c.sim && c.ar === c.as).length, rest = REDIS.live.length - exact;
  const SUM = `The replay matched Redis exactly in ${exact} of ${REDIS.live.length} cases${rest ? `, and within the check's tolerance in the other${rest > 1 ? 's' : ''}` : ''}. The run exited ${CAP.redis.exit}.`;
  sum.textContent = SUM;
  const set = (k, on) => rows.forEach(r => r.classList.toggle(k, on));
  demo(el, {
    reset() { ['in', 'is-s', 'is-m'].forEach(k => set(k, false)); sum.classList.remove('in'); },
    final() { ['in', 'is-s', 'is-m'].forEach(k => set(k, true)); sum.classList.add('in'); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(220, me); }
      await wait(500, me);
      for (const r of rows) { r.classList.add('is-s'); await wait(120, me); }
      await wait(900, me);
      for (const r of rows) { r.classList.add('is-m'); await wait(120, me); }
      await wait(500, me);
      sum.classList.add('in');
    }
  });
})();

/* Measured: the sweep as a chart, three Redis runs, and wall times */
(() => {
  const box = $('#rp-sweep');
  if (!box) return;
  const head = cols(CAP.sweep.out.find(t => t.startsWith('skew')));
  const skews = head.slice(1);
  const series = CAP.sweep.out.map(cols).filter(c => ALGOS.includes(c[0])).map(c => ({ a: c[0], v: c.slice(1).map(Number) }));
  const COLOR = { 'fixed-window': 'var(--ink-2)', 'sliding-log': 'var(--water)', 'sliding-counter': 'var(--blue)', 'token-bucket': 'var(--red)', 'leaky-bucket': 'var(--yellow)', gcra: 'var(--green)' };
  const W = 420, H = 230, L = 34, R = 10, T = 10, B = 28, YMAX = 6;
  const x = i => L + (i / (skews.length - 1)) * (W - L - R);
  const y = v => T + (1 - v / YMAX) * (H - T - B);
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Peak admitted in any one second against node clock skew, for six algorithms' });
  for (let v = 0; v <= YMAX; v++) {
    svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === 1 ? 'rp-sw-lim' : 'rp-sw-grid' }));
    const t = svgEl('text', { x: L - 6, y: y(v) + 3.5, class: 'rp-sw-t', 'text-anchor': 'end' }); t.textContent = `${v}x`; svg.appendChild(t);
  }
  skews.forEach((s, i) => { const t = svgEl('text', { x: x(i), y: H - 8, class: 'rp-sw-t', 'text-anchor': 'middle' }); t.textContent = s.replace('ms', ''); svg.appendChild(t); });
  const lines = series.map((s, k) => {
    const g = svgEl('g', { class: 'rp-sw-s', style: `--c:${COLOR[s.a]};--d:${k * 140}ms` });
    g.appendChild(svgEl('polyline', { points: s.v.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '), fill: 'none' }));
    s.v.forEach((v, i) => g.appendChild(svgEl('circle', { cx: x(i).toFixed(1), cy: y(v).toFixed(1), r: 2.6 })));
    const title = svgEl('title'); title.textContent = `${s.a}: ${s.v.map((v, i) => `${skews[i]} ${v.toFixed(2)}x`).join(', ')}`; g.appendChild(title);
    svg.appendChild(g);
    return g;
  });
  box.appendChild(svg);
  $('#rp-sweep-legend').innerHTML = series.map(s => `<span class="key"><i class="rp-key rp-sw-key" style="--c:${COLOR[s.a]}"></i>${s.a}</span>`).join('');

  const cell = v => { const [r, sim] = v.split(' / '); return sim ? `${esc(r)}<sup>*</sup>` : esc(r); };
  $('#rp-runs').innerHTML = `<table class="rp-rt"><thead><tr><th scope="col">Redis</th>${RUNS.map(r => `<th scope="col">${esc(r.label)}</th>`).join('')}</tr></thead><tbody>${RUNS[0].rows.map((row, i) => `<tr><th scope="row">${esc(row[0])}</th>${RUNS.map(r => `<td>${cell(r.rows[i][1])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  const COST = [['Redis check', 70.9], ['go test, with Redis', 12.8], ['mutants, 200 seeds', 8.3], ['sweep', 2.6], ['table', 1.8], ['go test, no Redis', 0.8]];
  const max = Math.max(...COST.map(c => c[1]));
  $('#rp-cost').innerHTML = COST.map(([n, s]) => `<div class="bar-row"><span>${n}</span><span class="bar"><i style="--w:${((s / max) * 100).toFixed(1)}%"></i></span><span>${s.toFixed(1)} s</span></div>`).join('');
})();
