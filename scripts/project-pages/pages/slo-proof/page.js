/* Data extracted from the committed example month with slo-proof's own code (see the figcaptions) */
const SP_OUT = /*@@DATA:outage@@*/;
const SP_AFTER = /*@@DATA:after@@*/;
const SP_MONTH = /*@@DATA:month@@*/;
const SP_SLOW = /*@@DATA:slow@@*/;

const SP_EX = 'examples/sli.csv examples/incidents.csv examples/rules.toml';
const spText = (x, y, txt, cls, anchor) => {
  const t = svgEl('text', { class: cls, x: r1(x), y: r1(y) });
  if (anchor) t.setAttribute('text-anchor', anchor);
  t.textContent = txt;
  return t;
};
const spClock = (start, m) => {
  const [h, mm] = start.split(':').map(Number), t = h * 60 + mm + m;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
// Rebuilds an SVG demo on resize and once the fonts are in, so label widths are measured right.
const spLive = build => {
  build();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
};
// A curtain the colour of the panel that slides off the plot to reveal it, left to right.
const spCurtain = (cur, on, ms) => {
  cur.style.transition = 'none';
  cur.style.transform = on ? 'translateX(0)' : 'translateX(100%)';
  if (ms) {
    cur.getBoundingClientRect();
    cur.style.transition = `transform ${ms}ms linear`;
    cur.style.transform = 'translateX(100%)';
  }
};

/* Hero terminal: real runs, verbatim */
const SP_REPLAY_FAST = [
  ['out', '28.0 days of data, 7 incidents, SLO 99.9%'], ['out', ''],
  ['out', 'fast-burn-only: burn > 14.4x over 1h & 5m'],
  ['dim', '  incident               severity started           paged after  budget spent before / in all'],
  ['out', '  hard outage            page     2026-03-04 13:41  1m             3.7% /  14.7%'],
  ['out', '  sharp spike            page     2026-03-07 09:49  4m             2.0% /   5.1%'],
  ['out', '  partial outage         page     2026-03-11 02:50  9m             1.1% /   5.1%'],
  ['out', '  flapping dependency    page     2026-03-14 16:23  23m            2.2% /   4.8%'],
  ['err', '  slow burn              page     2026-03-18 07:06  MISSED        10.2% /  10.2%'],
  ['dim', '  very slow burn         ticket   2026-03-21 23:09  not paged      9.5% /   9.5%'],
  ['out', '  short blip             page     2026-03-27 20:45  2m             2.6% /   2.6%'],
  ['out', '  8 pages: 8 during incidents, 0 after one ended, 0 with no incident; firing 20m with no incident open'],
  ['out', ''], ['dim', 'budget spent is a share of the 30-day error budget at this traffic.']
];
const SP_REPLAY_WB = [
  ['out', '28.0 days of data, 7 incidents, SLO 99.9%'], ['out', ''],
  ['out', 'workbook-multiwindow: burn > 14.4x over 1h & 5m OR burn > 6x over 6h & 30m'],
  ['dim', '  incident               severity started           paged after  budget spent before / in all'],
  ['out', '  hard outage            page     2026-03-04 13:41  1m             3.7% /  14.7%'],
  ['out', '  sharp spike            page     2026-03-07 09:49  4m             2.0% /   5.1%'],
  ['out', '  partial outage         page     2026-03-11 02:50  9m             1.1% /   5.1%'],
  ['out', '  flapping dependency    page     2026-03-14 16:23  23m            2.2% /   4.8%'],
  ['out', '  slow burn              page     2026-03-18 07:06  4h53m          5.5% /  10.2%'],
  ['dim', '  very slow burn         ticket   2026-03-21 23:09  not paged      9.5% /   9.5%'],
  ['out', '  short blip             page     2026-03-27 20:45  2m             2.6% /   2.6%'],
  ['out', '  10 pages: 10 during incidents, 0 after one ended, 0 with no incident; firing 1h39m with no incident open'],
  ['out', ''], ['dim', 'budget spent is a share of the 30-day error budget at this traffic.']
];
const SP_GAP_ERR = 'slo-proof: gappy.csv: line 3: gap of 4 minutes after 2026-03-02 00:00; write a row of zeros for a minute with no traffic';
const SP_COMPARE = [
  ['out', '28.0 days, 6 incidents that deserved a page, SLO 99.9%'], ['out', ''],
  ['dim', '    rule                      caught  median delay  false/week  late  precision  firing, no incident'],
  ['ok', '1   workbook-multiwindow         6/6            6m         0.0     0       100%                1h39m'],
  ['out', '2   fast-burn-only               5/6            4m         0.0     0       100%                  20m'],
  ['out', '3   6x-over-6h                   4/6           17m         0.2     0        80%               18h43m'],
  ['out', '4   static-1pct                  3/6            6m         0.8     2        62%                1h56m'],
  ['out', ''], ['dim', 'ranked by incidents caught, then false pages per week, then median delay.'],
  ['out', 'missed:'], ['err', '  static-1pct: hard outage, slow burn, short blip'],
  ['err', '  fast-burn-only: slow burn'], ['err', '  6x-over-6h: flapping dependency, short blip']
];
PAGE.terminal = {
  scenes: {
    compare: [['cmd', `slo-proof compare ${SP_EX}`], ...SP_COMPARE, ['out', ''], ['out', 'exit 0']],
    gate: [['cmd', `slo-proof replay ${SP_EX} --rule fast-burn-only --fail-on-miss`], ...SP_REPLAY_FAST, ['out', ''], ['err', 'exit 1']],
    refused: [
      ['cmd', 'slo-proof compare gappy.csv examples/incidents.csv examples/rules.toml'], ['err', SP_GAP_ERR], ['out', 'exit 2'], ['out', ''],
      ['cmd', 'slo-proof check typo.toml'],
      ['err', "slo-proof: typo.toml: line 8: rule 'fast-burn' when 1: unknown key 'window' (allowed: burn, error_ratio, windows)"], ['out', 'exit 2']
    ]
  },
  order: ['compare', 'gate', 'refused'],
  first: 'compare'
};

/* Tests per file, from pytest --collect-only (71 in total) */
PAGE.tests = [
  ['tests/test_rules.py', 18, 'var(--blue)'],
  ['tests/test_series.py', 14, 'var(--magenta)'],
  ['tests/test_evaluate.py', 8, 'var(--water)'],
  ['tests/test_incidents.py', 8, 'var(--green)'],
  ['tests/test_prom.py', 8, 'var(--yellow)'],
  ['tests/test_cli.py', 8, 'var(--red)'],
  ['tests/test_score.py', 4, 'var(--ink-2)'],
  ['tests/test_synth.py', 3, 'var(--pass)']
];

/* 1. Five inputs it refuses */
(() => {
  const el = $('#d-input'), list = $('#sp-refs');
  const R = [
    ['gappy.csv', ['timestamp,good,total', '2026-03-02T00:00:00Z,598,600', '2026-03-02T00:05:00Z,611,611'], 2, SP_GAP_ERR],
    ['notz.csv', ['timestamp,good,total', '2026-03-02T00:00:00,598,600'], 1,
      "slo-proof: notz.csv: line 2: '2026-03-02T00:00:00' has no timezone; add Z or an offset"],
    ['typo.toml', ['name = "fast-burn"', '  [[rule.when]]', '  burn = 14.4', '  window = ["1h", "5m"]'], 3,
      "slo-proof: typo.toml: line 8: rule 'fast-burn' when 1: unknown key 'window' (allowed: burn, error_ratio, windows)"],
    ['burn.toml', ['name = "too-hot"', '  [[rule.when]]', '  burn = 2000', '  windows = ["1h"]'], 2,
      "slo-proof: burn.toml: line 7: rule 'too-hot' when 1: burn 2000x needs an error ratio of 2, which is impossible"],
    ['overlap.csv', ['start,end,severity,name', '2026-03-04T13:41:00Z,2026-03-04T13:45:00Z,page,checkout outage', '2026-03-04T13:43:00Z,2026-03-04T14:10:00Z,page,payments down'], 2,
      "slo-proof: overlap.csv: line 3: 'payments down' overlaps 'checkout outage'; a page could not be attributed"]
  ];
  list.innerHTML = R.map(([f, lines, bad, err]) => `<li class="sp-ref"><div class="sp-file"><span class="sp-fname">${f}</span><code>${
    lines.map((l, i) => `<span${i === bad ? ' class="is-bad"' : ''}>${esc(l)}</span>`).join('')}</code></div><p class="sp-err"><span>${esc(err)}</span><b>exit 2</b></p></li>`).join('');
  const items = $$('.sp-ref', list);
  const set = (n, lit) => items.forEach((it, i) => { it.classList.toggle('is-off', i >= n); it.classList.toggle('is-lit', i < lit); });
  demo(el, {
    reset() { set(0, 0); },
    final() { set(items.length, items.length); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < items.length; i++) {
        set(i + 1, i);
        await wait(650, me);
        set(i + 1, i + 1);
        await wait(700, me);
      }
    }
  });
})();

/* 2. Evaluate every minute: static-1pct against the hard outage */
(() => {
  const el = $('#d-eval'), grid = $('#sp-ev'), verdict = $('#sp-ev-verdict');
  const rows = SP_OUT.rows;
  const evalAt = i => spClock(rows[0][0], i + 1);
  const inside = t => t >= SP_OUT.incident[0] && t <= SP_OUT.incident[1];
  const state = (alerts, holdsAt) => rows.map((r, i) => {
    const t = evalAt(i);
    for (const [a, b] of alerts) if (t >= a && t < b) return t === a ? ['fire', 'page'] : ['fire', ''];
    if (alerts.some(([a]) => t < a) && holdsAt(i)) {
      const since = rows.findIndex((x, k) => k <= i && x[4] && rows.slice(k, i + 1).every(y => y[4]));
      return ['pend', `${i - since}m`];
    }
    return ['', ''];
  });
  const st = state(SP_OUT.static, i => rows[i][4]);
  const fast = state(SP_OUT.fast, () => false);
  const cell = (c, txt) => `<span class="sp-c ${c ? `sp-${c}` : ''}">${txt}</span>`;
  grid.innerHTML = [
    `<span class="sp-rh">Evaluation</span>${rows.map((r, i) => `<span class="sp-t${inside(evalAt(i)) ? ' is-inc' : ''}">${evalAt(i)}</span>`).join('')}`,
    `<span class="sp-rh">Last minute failed</span>${rows.map(([, bad, tot], i) => `<span class="sp-bar${inside(evalAt(i)) ? ' is-inc' : ''}"><i style="--h:${Math.max(bad / tot, .004)}"></i></span>`).join('')}`,
    `<span class="sp-rh">5m ratio</span>${rows.map(r => cell(r[3] > 0.01 ? 'over' : '', r[3] ? `${(r[3] * 100).toFixed(r[3] < .01 ? 2 : 0)}%` : '0')).join('')}`,
    `<span class="sp-rh"><code>static-1pct</code></span>${st.map(([c, t]) => cell(c, t)).join('')}`,
    `<span class="sp-rh"><code>fast-burn-only</code></span>${fast.map(([c, t]) => cell(c, t)).join('')}`
  ].join('');
  const cols = rows.map((_, i) => $$(`:scope > :nth-child(${rows.length + 1}n + ${i + 2})`, grid));
  const VERDICT = 'static-1pct paged at 13:47, two minutes after the outage ended: a late page, so the outage counts as missed. fast-burn-only paged at 13:42, one minute in.';
  const show = n => cols.forEach((c, i) => c.forEach(x => x.classList.toggle('is-off', i >= n)));
  demo(el, {
    reset() { show(0); verdict.textContent = ''; verdict.classList.add('is-off'); },
    final() { show(rows.length); verdict.textContent = VERDICT; verdict.classList.remove('is-off'); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < rows.length; i++) { show(i + 1); await wait(st[i][0] || fast[i][0] ? 420 : 240, me); }
      await wait(400, me);
      verdict.textContent = VERDICT;
      verdict.classList.remove('is-off');
    }
  });
})();

/* 3. Windows: the long window remembers the outage */
(() => {
  const el = $('#d-window'), box = $('#sp-win-plot'), svg = $('#sp-win-svg'), stats = $('#sp-win-stats');
  const D = SP_AFTER, LO = -4, HI = 0;
  let cur = null;
  function build() {
    const W = Math.max(300, box.clientWidth), L = 44, R = 12, T = 14, PH = 170, LANE = 34, H = T + PH + 26 + LANE * 2 + 4;
    const x = m => L + m / D.minutes * (W - L - R);
    const y = v => T + (HI - Math.log10(Math.max(v, 1e-4))) / (HI - LO) * PH;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.replaceChildren();
    svg.appendChild(svgEl('rect', { class: 'sp-incband', x: r1(x(D.incident[0])), y: T, width: Math.max(3, r1(x(D.incident[1]) - x(D.incident[0]))), height: PH }));
    for (let p = LO; p <= HI; p++) {
      svg.appendChild(svgEl('line', { class: 'sp-grid', x1: L, x2: W - R, y1: r1(y(10 ** p)), y2: r1(y(10 ** p)) }));
      svg.appendChild(spText(L - 6, y(10 ** p) + 4, `${+(100 * 10 ** p).toPrecision(1)}%`, 'sp-tick', 'end'));
    }
    const th = r1(y(D.threshold6));
    svg.appendChild(svgEl('line', { class: 'sp-th', x1: L, x2: W - R, y1: th, y2: th }));
    svg.appendChild(spText(W - R, th - 6, '6x burn = 0.6%', 'sp-thlab', 'end'));
    const line = (k, cls) => svgEl('path', { class: cls, d: D.pts.map((p, i) => `${i ? 'L' : 'M'}${r1(x(p[0]))} ${r1(y(p[k]))}`).join('') });
    svg.appendChild(line(1, 'sp-l6'));
    svg.appendChild(line(2, 'sp-l30'));
    const lanes = [['6x-over-6h', D.lanes['6x-over-6h']], ['workbook-multiwindow', D.lanes['workbook-multiwindow']]];
    const top = T + PH + 26;
    lanes.forEach(([name, spans], i) => {
      const ly = top + i * LANE + 16;
      svg.appendChild(svgEl('rect', { class: 'sp-lane', x: L, y: ly, width: W - L - R, height: 13 }));
      spans.forEach(([a, b]) => svg.appendChild(svgEl('rect', { class: 'sp-fire', x: r1(x(a)), y: ly, width: Math.max(2, r1(x(b) - x(a))), height: 13 })));
    });
    cur = svgEl('rect', { class: 'sp-curtain', x: L + 1, y: 0, width: W - L, height: H });
    svg.appendChild(cur);
    lanes.forEach(([name, spans], i) => svg.appendChild(spText(L, top + i * LANE + 11, `${name}, firing ${spans.map(([a, b]) => `${spClock(D.start, a)} to ${spClock(D.start, b)}`).join(', ')}`, 'sp-lanelab')));
    for (let h = 0; h <= D.minutes; h += 120) svg.appendChild(spText(x(h), T + PH + 18, spClock(D.start, h), 'sp-tick', h ? (h === D.minutes ? 'end' : 'middle') : 'start'));
    const key = svgEl('g', { class: 'sp-key' });
    key.append(svgEl('line', { class: 'sp-l6', x1: L + 8, x2: L + 26, y1: T + 12, y2: T + 12 }), spText(L + 31, T + 16, 'last 6h', 'sp-keylab'),
      svgEl('line', { class: 'sp-l30', x1: L + 92, x2: L + 110, y1: T + 12, y2: T + 12 }), spText(L + 115, T + 16, 'last 30m', 'sp-keylab'));
    svg.appendChild(key);
    spCurtain(cur, false);
  }
  spLive(build);
  demo(el, {
    reset() { spCurtain(cur, true); stats.classList.add('is-off'); },
    final() { spCurtain(cur, false); stats.classList.remove('is-off'); },
    async play(me) {
      await wait(300, me);
      spCurtain(cur, true, 2600);
      await wait(2700, me);
      stats.classList.remove('is-off');
    }
  });
})();

/* 4. Score: every page static-1pct would have sent, then the first false one up close */
(() => {
  const el = $('#d-score'), strip = $('#sp-month'), tally = $$('#sp-tally dd'), dip = $('#sp-dip'), bars = $('#sp-dipbars'), note = $('#sp-dipnote');
  const M = SP_MONTH, pct = m => `${(m / M.minutes * 100).toFixed(3)}%`;
  const days = [0, 7, 14, 21, 28].map(d => `<span class="sp-day" style="left:${pct(d * 1440)}">${d === 28 ? '30 Mar' : `${2 + d} Mar`}</span>`).join('');
  strip.innerHTML = `<div class="sp-incs">${M.incidents.map(([a, b, sev, name]) => `<i class="sp-inc${sev === 'ticket' ? ' is-ticket' : ''}" style="left:${pct(a)};width:max(3px, ${pct(b - a)})" title="${esc(name)} (${sev})"></i>`).join('')}</div>`
    + `<div class="sp-axis">${days}</div><div class="sp-pages">${M.pages.map(([a, , k, when, owner]) => `<i class="sp-pg is-${k}" style="left:${pct(a)}" title="${when}: ${k}${owner ? `, ${esc(owner)}` : ''}"></i>`).join('')}</div>`;
  const ticks = $$('.sp-pg', strip);
  const D = M.dip, peak = Math.max(...D.total);
  bars.innerHTML = D.total.map((t, i) => `<span><i class="sp-tot" style="--h:${t / peak}"></i><i class="sp-bad" style="--h:${D.bad[i] / peak}"></i></span>`).join('');
  note.textContent = `${D.total_sum} requests in 40 minutes, ${D.bad_sum} of them failed: a ${Math.round(D.bad_sum / D.total_sum * 100)}% error ratio, and ${(D.budget_share * 100).toFixed(2)}% of the month's error budget. An average minute in this month carries ${Math.round(D.normal_per_min)}.`;
  const firstFalse = ticks[M.pages.findIndex(p => p[2] === 'false')];
  const count = n => {
    const c = [0, 0, 0];
    M.pages.slice(0, n).forEach(p => { c[['true', 'late', 'false'].indexOf(p[2])]++; });
    tally.forEach((d, i) => { d.textContent = c[i]; });
  };
  const show = n => { ticks.forEach((t, i) => t.classList.toggle('is-off', i >= n)); count(n); };
  demo(el, {
    reset() { show(0); dip.classList.add('is-off'); firstFalse.classList.remove('is-pick'); },
    final() { show(ticks.length); dip.classList.remove('is-off'); firstFalse.classList.add('is-pick'); },
    async play(me) {
      await wait(400, me);
      for (let i = 0; i < ticks.length; i++) { show(i + 1); await wait(260, me); }
      await wait(600, me);
      firstFalse.classList.add('is-pick');
      await wait(500, me);
      dip.classList.remove('is-off');
    }
  });
})();

/* 5. Budget: the slow burn, spent before each rule paged */
(() => {
  const el = $('#d-budget'), box = $('#sp-slow-plot'), svg = $('#sp-slow-svg');
  const D = SP_SLOW, NAMES = ['static-1pct', 'fast-burn-only', '6x-over-6h', 'workbook-multiwindow'], TOP = .12;
  let cur = null, mark = null;
  function build() {
    const W = Math.max(300, box.clientWidth), L = 40, R = 12, T = 12, PH = 160, LANE = 24, top = T + PH + 30, H = top + LANE * 4 + 6;
    const x = m => L + m / D.minutes * (W - L - R), y = v => T + (1 - v / TOP) * PH;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.replaceChildren();
    svg.appendChild(svgEl('rect', { class: 'sp-incband', x: r1(x(D.incident[0])), y: T, width: r1(x(D.incident[1]) - x(D.incident[0])), height: PH }));
    for (let v = 0; v <= TOP + 1e-9; v += .04) {
      svg.appendChild(svgEl('line', { class: 'sp-grid', x1: L, x2: W - R, y1: r1(y(v)), y2: r1(y(v)) }));
      svg.appendChild(spText(L - 6, y(v) + 4, `${Math.round(v * 100)}%`, 'sp-tick', 'end'));
    }
    svg.appendChild(spText(x(D.incident[0]) + 6, T + 16, 'slow burn, 07:06 to 15:06', 'sp-keylab'));
    const pts = [[0, 0], ...D.pts.map(([m, v]) => [m + 5, v])];
    svg.appendChild(svgEl('path', { class: 'sp-spent', d: pts.map(([m, v], i) => `${i ? 'L' : 'M'}${r1(x(m))} ${r1(y(v))}`).join('') }));
    NAMES.forEach((n, i) => {
      const ly = top + i * LANE;
      svg.appendChild(svgEl('rect', { class: 'sp-lane', x: L, y: ly, width: W - L - R, height: LANE - 7 }));
      D.lanes[n].forEach(([a, b]) => svg.appendChild(svgEl('rect', { class: 'sp-fire', x: r1(x(a)), y: ly, width: Math.max(2, r1(x(b) - x(a))), height: LANE - 7 })));
    });
    cur = svgEl('rect', { class: 'sp-curtain sp-curtain-air', x: L + 1, y: 0, width: W - L, height: H });
    svg.appendChild(cur);
    NAMES.forEach((n, i) => {
      const d = D.detect[n];
      svg.appendChild(spText(L + 6, top + i * LANE + 12, d[0] === null ? `${n}: missed, 10.2% spent` : n, d[0] === null ? 'sp-lanelab is-miss' : 'sp-lanelab'));
    });
    const dm = D.detect['workbook-multiwindow'][0] + D.incident[0], dx = r1(x(dm)), dy = r1(y(D.detect['workbook-multiwindow'][1]));
    mark = svgEl('g', { class: 'sp-mark' });
    mark.append(svgEl('line', { x1: dx, x2: dx, y1: dy, y2: top + LANE * 4 - 7 }), svgEl('circle', { cx: dx, cy: dy, r: 5 }));
    const lab = spText(dx - 8, dy - 10, W < 560 ? '11:59: 5.5% spent' : 'two rules page at 11:59, 4h53m in: 5.5% spent', 'sp-marklab', 'end');
    mark.appendChild(lab);
    svg.appendChild(mark);
    if (lab.getComputedTextLength() > dx - 8 - L) { lab.setAttribute('text-anchor', 'start'); lab.setAttribute('x', dx + 8); lab.setAttribute('y', dy + 20); }
    for (let h = 0; h <= D.minutes; h += 180) svg.appendChild(spText(x(h), T + PH + 18, spClock(D.start, h), 'sp-tick', h ? (h === D.minutes ? 'end' : 'middle') : 'start'));
    spCurtain(cur, false);
  }
  spLive(build);
  demo(el, {
    reset() { spCurtain(cur, true); mark.classList.add('is-off'); },
    final() { spCurtain(cur, false); mark.classList.remove('is-off'); },
    async play(me) {
      await wait(300, me);
      spCurtain(cur, true, 3200);
      await wait(1650, me);
      mark.classList.remove('is-off');
      await wait(1600, me);
    }
  });
})();

/* 6. Rank: compare's table, rows sorting into its order */
(() => {
  const el = $('#d-rank'), table = $('#sp-rank'), missed = $('#sp-missed pre');
  const HEAD = ['', 'rule', 'caught', 'median delay', 'false/week', 'late', 'precision', 'firing, no incident'];
  const ROWS = [
    ['static-1pct', '3/6', '6m', '0.8', '2', '62%', '1h56m', 4],
    ['fast-burn-only', '5/6', '4m', '0.0', '0', '100%', '20m', 2],
    ['6x-over-6h', '4/6', '17m', '0.2', '0', '80%', '18h43m', 3],
    ['workbook-multiwindow', '6/6', '6m', '0.0', '0', '100%', '1h39m', 1]
  ];
  table.innerHTML = `<div class="sp-rrow sp-rhead" role="row">${HEAD.map(h => `<span role="columnheader">${h}</span>`).join('')}</div>`
    + ROWS.map(([name, ...v]) => `<div class="sp-rrow sp-rbody" role="row"><span role="cell" class="sp-rk">${v[6]}</span><span role="cell"><code>${name}</code></span>${
      v.slice(0, 6).map(c => `<span role="cell">${c}</span>`).join('')}</div>`).join('');
  const rows = $$('.sp-rbody', table);
  const MISSED = SP_COMPARE.slice(-4);
  missed.innerHTML = MISSED.map(([k, t]) => `<span class="${k === 'out' ? '' : k}">${esc(t)}</span>`).join('');
  const lines = $$('span', missed);
  const place = ranked => rows.forEach((r, i) => {
    r.style.setProperty('--y', String(ranked ? ROWS[i][7] - 1 : i));
    r.classList.toggle('is-top', ranked && ROWS[i][7] === 1);
  });
  demo(el, {
    reset() { place(false); rows.forEach(r => r.classList.add('is-off')); table.classList.remove('is-ranked'); lines.forEach(l => l.classList.add('is-off')); },
    final() { place(true); rows.forEach(r => r.classList.remove('is-off')); table.classList.add('is-ranked'); lines.forEach(l => l.classList.remove('is-off')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.remove('is-off'); await wait(260, me); }
      await wait(900, me);
      table.classList.add('is-ranked');
      place(true);
      await wait(1100, me);
      for (const l of lines) { l.classList.remove('is-off'); await wait(300, me); }
    }
  });
})();

/* 7. Gate: three real runs, three exit codes */
(() => {
  const el = $('#d-gate'), wrap = $('#sp-exits'), pre = $('#sp-exit-pre');
  const S = [
    { code: 0, title: 'Caught everything', ci: 'CI passes', what: 'The multiwindow rule, with --fail-on-miss.',
      lines: [['cmd', `slo-proof replay ${SP_EX} --rule workbook-multiwindow --fail-on-miss`], ...SP_REPLAY_WB, ['', ''], ['', 'exit 0']] },
    { code: 1, title: 'Missed one', ci: 'CI fails', what: 'fast-burn-only sleeps through the slow burn.',
      lines: [['cmd', `slo-proof replay ${SP_EX} --rule fast-burn-only --fail-on-miss`], ...SP_REPLAY_FAST, ['', ''], ['err', 'exit 1']] },
    { code: 2, title: 'Bad input', ci: 'CI fails', what: 'A minute is missing from the SLI file.',
      lines: [['cmd', 'slo-proof compare gappy.csv examples/incidents.csv examples/rules.toml'], ['err', SP_GAP_ERR], ['', ''], ['err', 'exit 2']] }
  ];
  wrap.innerHTML = S.map((s, i) => `<button type="button" class="sp-ex ${s.code ? 'is-fail' : 'is-pass'}" data-i="${i}" aria-pressed="false"><span class="sp-code">${s.code}</span><b>${s.title}</b><span class="sp-what">${esc(s.what)}</span><span class="sp-ci">${s.ci}</span></button>`).join('');
  const cards = $$('.sp-ex', wrap);
  const line = ([k, t]) => { const sp = document.createElement('span'); if (k && k !== 'out') sp.className = k; sp.textContent = t || ' '; return sp; };
  let userPicked = false;
  const select = i => cards.forEach((c, k) => c.setAttribute('aria-pressed', String(k === i)));
  const render = i => pre.replaceChildren(...S[i].lines.map(line));
  demo(el, {
    reset() { userPicked = false; cards.forEach(c => c.classList.remove('in')); select(-1); pre.replaceChildren(); },
    final() { cards.forEach(c => c.classList.add('in')); select(1); render(1); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < S.length; i++) {
        if (userPicked) return;
        select(i);
        cards[i].classList.add('in');
        pre.replaceChildren();
        for (const l of S[i].lines) {
          if (userPicked) return;
          pre.appendChild(line(l));
          await wait(l[0] === 'cmd' ? 380 : 50, me);
        }
        await wait(1300, me);
      }
    }
  });
  cards.forEach((c, i) => c.addEventListener('click', () => { userPicked = true; cards.forEach(x => x.classList.add('in')); select(i); render(i); }));
})();

/* Measured: 6x-over-6h's firing with no incident open, slo-proof compare on synth seeds 1 to 8 */
(() => {
  const box = $('#sp-seed-bars');
  if (!box) return;
  const SEEDS = [['20h13m', 1213], ['19h16m', 1156], ['18h32m', 1112], ['18h57m', 1137], ['18h27m', 1107], ['18h44m', 1124], ['18h43m', 1123], ['19h10m', 1150]];
  const max = Math.max(...SEEDS.map(s => s[1]));
  box.innerHTML = SEEDS.map(([t, m], i) => `<div class="bar-row"><span>Seed ${i + 1}</span><span class="bar"><i style="--w:${(m / max * 100).toFixed(1)}%"></i></span><span>${t}</span></div>`).join('');
})();
