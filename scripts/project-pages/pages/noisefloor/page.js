/* Measured data, extracted from real runs (see the figcaptions) */
const RAG = /*@@DATA:rag@@*/;
const PI = /*@@DATA:pi@@*/;
const MATRIX = /*@@DATA:matrix@@*/;

const nfAvg = a => a.reduce((s, v) => s + v, 0) / a.length;
const nfF3 = v => v.toFixed(3);
const nfText = (x, y, txt, cls, anchor) => {
  const t = svgEl('text', { class: cls, x: r1(x), y: r1(y) });
  if (anchor) t.setAttribute('text-anchor', anchor);
  t.textContent = txt;
  return t;
};
// Keeps a label inside [lo, hi]: flips it to end-anchored at `alt` when it would overflow.
const nfFit = (t, hi, alt) => {
  const len = t.getComputedTextLength();
  if (+t.getAttribute('x') + len > hi) { t.setAttribute('text-anchor', 'end'); t.setAttribute('x', r1(alt)); }
};
const nfSettle = svg => { svg.getBoundingClientRect(); svg.classList.remove('nf-static'); };

/* Hero terminal: real runs, verbatim */
const NF_RAG_A = '20260903T014508.400182Z-rag-knowledge-agent-3dbc2f92';
const NF_RAG_B = '20260903T014835.696525Z-rag-knowledge-agent-3dbc2f92';
const NF_QS = '20261003T214204.924011Z-quickstart-4d8f5e91';
PAGE.terminal = {
  scenes: {
    unchanged: [
      ['cmd', 'noisefloor --root examples/rag-knowledge-agent/baseline diff'],
      ['out', `rag-knowledge-agent: ${NF_RAG_A} → ${NF_RAG_B}`],
      ['out', '  5 unchanged'], ['out', ''],
      ['ok', '        ok  charging-bays'],
      ['dim', '            0:json_valid: 3/3 → 3/3'],
      ['dim', '            1:json_path_in: 3/3 → 3/3'],
      ['out', '            2:json_path_number: 0.543 [0.437–0.597] n=3 → 0.597 [0.597–0.597] n=3'],
      ['ok', '        ok  error-code-409'],
      ['dim', '            0:json_valid: 3/3 → 3/3'],
      ['dim', '            1:contains: 3/3 → 3/3'],
      ['dim', '            2:json_path_subset: 3/3 → 3/3'],
      ['cut', '[3 more cases, offline-behaviour, refuses-off-domain and refuses-parental-leave: every scorer 3/3 → 3/3]'],
      ['out', ''], ['out', 'exit 0']
    ],
    regressed: [
      ['cmd', 'noisefloor check suite.yaml'],
      ['out', 'estimate-pi: 20261003T214425.289052Z-estimate-pi-2e2c4f0e → 20261003T214453.320961Z-estimate-pi-2e2c4f0e'],
      ['out', '  1 regressed'], ['out', ''],
      ['err', ' REGRESSED  monte-carlo'],
      ['err', '            1:json_path_number: mean 0.017 (n=5) → 0.100 (n=5), outside the baseline band [0.004–0.033]'],
      ['dim', '            0:json_valid: 5/5 → 5/5'],
      ['out', '            1:json_path_number: 0.017 [0.004–0.033] n=5 → 0.100 [0.002–0.238] n=5'],
      ['out', ''], ['out', 'exit 1']
    ],
    first: [
      ['cmd', 'noisefloor check examples/quickstart/suite.yaml'],
      ['out', NF_QS],
      ['out', '  2 cases × 3 repeats — 2 ok'],
      ['dim', `no baseline for 'quickstart' yet — adopted ${NF_QS} as the baseline. Re-run check after a change to compare against it.`],
      ['out', ''],
      ['cmd', 'noisefloor check examples/quickstart/suite.yaml'],
      ['out', `quickstart: ${NF_QS} → 20261003T214205.386617Z-quickstart-4d8f5e91`],
      ['out', '  2 unchanged'], ['out', ''],
      ['ok', '        ok  capital-of-france'],
      ['dim', '            0:json_valid: 3/3 → 3/3'],
      ['dim', '            1:contains: 3/3 → 3/3'],
      ['dim', '            2:json_path_equals: 3/3 → 3/3'],
      ['ok', '        ok  refuses-unknown'],
      ['dim', '            0:json_valid: 3/3 → 3/3'],
      ['dim', '            1:json_path_equals: 3/3 → 3/3'],
      ['out', ''], ['out', 'exit 0']
    ]
  },
  order: ['unchanged', 'regressed', 'first'],
  first: 'unchanged'
};

/* Tests per file, from pytest --collect-only (202 in total) */
PAGE.tests = [
  ['tests/test_stats.py', 38, 'var(--blue)'],
  ['tests/test_cli.py', 32, 'var(--magenta)'],
  ['tests/test_diff.py', 25, 'var(--water)'],
  ['tests/test_scoring.py', 24, 'var(--green)'],
  ['tests/test_run.py', 19, 'var(--yellow)'],
  ['tests/test_report.py', 16, 'var(--red)'],
  ['tests/test_jsonpath.py', 15, 'var(--ink-2)'],
  ['tests/test_target.py', 13, 'var(--pass)'],
  ['tests/test_suite.py', 13, 'var(--label)'],
  ['tests/test_example_baseline.py, test_config.py', 7, 'var(--ink)']
];

/* 1. Argv: one hostile input stays one argument */
(() => {
  const el = $('#d-argv'), marks = $$('#nf-input mark'), slot = $('#nf-slot'), recv = $('#nf-recv'), ls = $$('#nf-ls > span'), tally = $('#nf-tally');
  const set = on => {
    marks.forEach(m => m.classList.toggle('on', on));
    slot.classList.toggle('is-filled', on);
    recv.classList.toggle('is-off', !on);
    ls.forEach(s => s.classList.toggle('is-off', !on));
    tally.classList.toggle('is-off', !on);
  };
  demo(el, {
    reset() { set(false); },
    final() { set(true); },
    async play(me) {
      await wait(500, me);
      for (const m of marks) { m.classList.add('on'); await wait(260, me); }
      await wait(500, me);
      slot.classList.add('is-filled');
      await wait(1100, me);
      recv.classList.remove('is-off');
      await wait(900, me);
      for (const s of ls) { s.classList.remove('is-off'); await wait(320, me); }
      await wait(300, me);
      tally.classList.remove('is-off');
    }
  });
})();

/* 2. Repeat and store: the committed capture, call by call */
(() => {
  const el = $('#d-store'), tl = $('#nf-tl'), files = $('#nf-files'), clock = $('#nf-clock'), stored = $('#nf-stored');
  const COL = {
    'offline-behaviour': 'var(--blue)', 'charging-bays': 'var(--magenta)', 'error-code-409': 'var(--water)',
    'refuses-parental-leave': 'var(--yellow)', 'refuses-off-domain': 'var(--green)'
  };
  const calls = RAG.calls;
  const total = calls.reduce((a, c) => a + c[2], 0);
  const SPEED = 25; // ms of playback per second of capture: 40 times faster
  tl.innerHTML = calls.map(([c, , d]) => `<i style="--c:${COL[c]};--w:${(d / total * 100).toFixed(3)}%"></i>`).join('');
  const cases = [...new Set(calls.map(c => c[0]))];
  files.innerHTML = cases.map(c => `<div class="nf-frow"><span class="nf-fname"><i class="nf-sw" style="--c:${COL[c]}"></i>${c}/</span><span class="nf-fchips">${
    calls.filter(x => x[0] === c).map(([, r, d]) => `<span class="nf-chip" data-k="${c}:${r}"><b>${r}.json</b><em>${d.toFixed(1)} s</em></span>`).join('')}</span></div>`).join('');
  const segs = $$('i', tl), chips = calls.map(([c, r]) => $(`.nf-chip[data-k="${c}:${r}"]`, files));
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const setAll = on => calls.forEach((_, k) => {
    segs[k].style.transition = 'none';
    segs[k].classList.toggle('in', on);
    chips[k].classList.remove('is-run');
    chips[k].classList.toggle('in', on);
  });
  demo(el, {
    reset() { setAll(false); clock.textContent = '0:00'; stored.textContent = '0 of 15 repeats stored'; },
    final() { setAll(true); clock.textContent = '3:09'; stored.textContent = '15 of 15 repeats stored, all ok'; },
    async play(me) {
      tl.getBoundingClientRect();
      await wait(400, me);
      let t = 0;
      for (let k = 0; k < calls.length; k++) {
        const ms = Math.round(calls[k][2] * SPEED);
        segs[k].style.transition = `width ${ms}ms linear`;
        segs[k].classList.add('in');
        chips[k].classList.add('is-run');
        await wait(ms, me);
        chips[k].classList.remove('is-run');
        chips[k].classList.add('in');
        t += calls[k][2];
        clock.textContent = mmss(Math.round(t));
        stored.textContent = `${k + 1} of 15 repeats stored`;
      }
      stored.textContent = '15 of 15 repeats stored, all ok';
    }
  });
})();

/* 3. Score each repeat, then measure the band */
(() => {
  const el = $('#d-band'), reps = $('#nf-reps'), box = $('#nf-line'), svg = $('#nf-line-svg'), outs = $$('#nf-bandout > span');
  const BASE = RAG.charging.base;
  const vals = BASE.map(r => Math.min(...r.map(c => c[1])));
  reps.innerHTML = BASE.map((r, i) => `<div class="nf-rep"><b>Repeat ${i}</b><ul>${
    r.map(([s, sc]) => `<li${sc === vals[i] ? ' class="is-min"' : ''}><span>${esc(s)}</span><em>${sc}</em></li>`).join('')
  }</ul><p>Lowest score, the value: <strong>${vals[i]}</strong></p></div>`).join('');
  const cards = $$('.nf-rep', reps);
  const DOM = [0.35, 0.65];
  let placed = 3, bandOn = true, dots = [], bandG = null;
  function build() {
    const W = Math.max(280, box.clientWidth), L = 16, R = 18, H = 128;
    const x = v => L + (v - DOM[0]) / (DOM[1] - DOM[0]) * (W - L - R);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.classList.add('nf-static');
    svg.replaceChildren();
    const mn = Math.min(...vals), mx = Math.max(...vals), mu = nfAvg(vals);
    const yT = 30, yB = 88, axisY = 100;
    bandG = svgEl('g', { class: 'nf-bandg' });
    bandG.appendChild(svgEl('rect', { class: 'nf-bandrect', x: r1(x(mn)), y: yT, width: r1(x(mx) - x(mn)), height: yB - yT }));
    const fz = svgEl('g', { class: 'nf-fade' });
    const bl = nfText(x(mn), 20, `Band ${nfF3(mn)} to ${nfF3(mx)}`, 'nf-bandlab');
    const mg = svgEl('g', { class: 'nf-bmean' });
    mg.appendChild(svgEl('line', { x1: r1(x(mu)), x2: r1(x(mu)), y1: yT + 4, y2: yB - 18 }));
    const ml = nfText(x(mu) + 5, yB - 6, `mean ${nfF3(mu)}`, 'nf-mlab');
    fz.append(bl, mg, ml);
    bandG.appendChild(fz);
    svg.appendChild(bandG);
    svg.appendChild(svgEl('rect', { class: 'nf-bound', x: r1(x(0.35) - 1.5), y: yT - 4, width: 3, height: axisY - yT + 4 }));
    svg.appendChild(nfText(x(0.35) + 7, 20, 'min 0.35', 'nf-tick'));
    svg.appendChild(svgEl('line', { class: 'nf-axis', x1: L, x2: W - R, y1: axisY, y2: axisY }));
    for (let v = 0.35; v < 0.6501; v += 0.05) {
      const tx = r1(x(v));
      svg.appendChild(svgEl('line', { class: 'nf-axis', x1: tx, x2: tx, y1: axisY - 4, y2: axisY + 4 }));
      svg.appendChild(nfText(tx, axisY + 19, v.toFixed(2), 'nf-tick', 'middle'));
    }
    const used = [];
    dots = vals.map((v, i) => {
      const px = x(v);
      const o = [0, -15, 15].find(o => !used.some(u => u.o === o && Math.abs(u.x - px) < 15)) ?? 0;
      used.push({ x: px, o });
      const g = svgEl('g', { class: 'nf-dot base' });
      g.appendChild(svgEl('circle', { cx: r1(px), cy: 60 + o, r: 7 }));
      const t = svgEl('title'); t.textContent = `Repeat ${i}: ${v}`; g.appendChild(t);
      svg.appendChild(g);
      return g;
    });
    nfFit(bl, W - R, W - R);
    nfFit(ml, W - R, x(mu) - 5);
    apply();
    nfSettle(svg);
  }
  function apply() {
    dots.forEach((d, i) => d.classList.toggle('is-off', i >= placed));
    bandG.classList.toggle('is-off', !bandOn);
  }
  const setCards = n => cards.forEach((c, i) => { c.classList.toggle('is-off', i >= n); c.classList.toggle('is-lit', i < n); });
  build();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  demo(el, {
    reset() { placed = 0; bandOn = false; apply(); setCards(0); outs.forEach(o => o.classList.add('is-off')); },
    final() { placed = 3; bandOn = true; apply(); setCards(3); outs.forEach(o => o.classList.remove('is-off')); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < cards.length; i++) {
        cards[i].classList.remove('is-off');
        await wait(450, me);
        cards[i].classList.add('is-lit');
        await wait(350, me);
        placed = i + 1;
        apply();
        await wait(500, me);
      }
      bandOn = true;
      apply();
      await wait(900, me);
      for (const o of outs) { o.classList.remove('is-off'); await wait(350, me); }
    }
  });
})();

/* 4. The hold line: a candidate's mean against the baseline's band */
(() => {
  const el = $('#d-gate'), plot = $('#nf-plot'), svg = $('#nf-gate-svg'), ctx = $('#nf-ctx'), reasonEl = $('#nf-reason'), noteEl = $('#nf-gnote');
  const low = rep => Math.min(...rep.map(c => c[1]));
  const ILL = '<span class="tag-ill">Illustrative input</span> ';
  const PI_CTX = 'A script written for this page estimates pi from random points and reports its error. Five repeats a side. ';
  const PI_TICKS = [0, 0.05, 0.10, 0.15, 0.20, 0.25];
  const PI_AXIS = ['Error of the estimate in each repeat, lower is better', 'Error per repeat, lower is better'];
  const MODES = {
    real: {
      base: RAG.charging.base.map(low), cand: RAG.charging.cand.map(low), dir: 'higher', dom: [0.40, 0.62], ticks: [0.40, 0.45, 0.50, 0.55, 0.60],
      axis: ['Lowest citation score in each repeat, higher is better', 'Lowest citation score, higher is better'],
      ctx: '<b>Real data.</b> rag-knowledge-agent on <code>charging-bays</code>, captured twice with nothing changed in between. Three repeats a side.',
      lines: [['ok', 'ok  charging-bays'], ['', '    2:json_path_number: 0.543 [0.437–0.597] n=3 → 0.597 [0.597–0.597] n=3']],
      verdict: 'Within noise', exit: '0', bad: false, edge: true,
      note: "All three candidate repeats scored 0.5965, exactly the baseline's best repeat, so the mean sits on the band's edge. The comparison is strict, so on the edge counts as inside. This is the pair the old rule got wrong; see stage 5."
    },
    small: {
      base: PI.base, cand: PI.small, dir: 'lower', dom: [0, 0.25], ticks: PI_TICKS, axis: PI_AXIS,
      ctx: ILL + PI_CTX + 'The change: 18,000 points per run instead of 20,000.',
      lines: [['ok', 'ok  monte-carlo'], ['', '    1:json_path_number: 0.017 [0.004–0.033] n=5 → 0.009 [0.002–0.023] n=5']],
      verdict: 'Within noise', exit: '0', bad: false,
      note: 'With fewer points the mean error still went down, from 0.017 to 0.009. That is run-to-run noise, not the change, and the mean stays inside the band, so nothing is claimed either way.'
    },
    large: {
      base: PI.base, cand: PI.large, dir: 'lower', dom: [0, 0.25], ticks: PI_TICKS, axis: PI_AXIS,
      ctx: ILL + PI_CTX + 'The change: 200 points per run instead of 20,000.',
      lines: [['err', 'REGRESSED  monte-carlo'], ['err', '    1:json_path_number: mean 0.017 (n=5) → 0.100 (n=5), outside the baseline band [0.004–0.033]']],
      verdict: 'Regressed', exit: '1', bad: true,
      note: 'One repeat, at 0.0016, beat every baseline repeat, but the rule judges the mean, and the mean landed far outside the band. Diffing the stored run again with <code>--min-effect 0.05</code> still says regressed; with <code>--min-effect 0.1</code> it says unchanged, because the mean moved by 0.083.'
    }
  };
  let mode = 'real', step = 5, pinned = null, geo = null;

  function build() {
    const M = MODES[mode];
    const W = Math.max(300, plot.clientWidth - 16), wide = W >= 640;
    const L = wide ? 112 : 10, R = 18, top = wide ? 54 : 76, LH = 66, GAP = wide ? 18 : 32;
    const lanes = [top, top + LH + GAP], axisY = lanes[1] + LH + 12, H = axisY + 50;
    const x = v => L + (v - M.dom[0]) / (M.dom[1] - M.dom[0]) * (W - L - R);
    const r = wide ? 8 : 7;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.classList.add('nf-static');
    svg.replaceChildren();
    const bmin = Math.min(...M.base), bmax = Math.max(...M.base), bmu = nfAvg(M.base), cmu = nfAvg(M.cand);
    ['Baseline', 'Candidate'].forEach((t, i) => {
      svg.appendChild(svgEl('rect', { class: 'nf-lane', x: L, y: lanes[i], width: W - L - R, height: LH }));
      if (wide) {
        svg.appendChild(nfText(0, lanes[i] + LH / 2 - 3, t, 'nf-lab'));
        svg.appendChild(nfText(0, lanes[i] + LH / 2 + 15, i ? 'after the change' : 'before the change', 'nf-sub'));
      } else svg.appendChild(nfText(L, lanes[i] - 8, t, 'nf-lab'));
    });
    const bg = svgEl('g', { class: 'nf-bandg' });
    const y0 = lanes[0] - 4, y1 = lanes[1] + LH + 4;
    const zx0 = M.dir === 'higher' ? L : x(bmax), zx1 = M.dir === 'higher' ? x(bmin) : W - R;
    const zone = svgEl('g', { class: 'nf-fade' });
    zone.appendChild(svgEl('rect', { class: 'nf-zone', x: r1(zx0), y: y0, width: r1(Math.max(0, zx1 - zx0)), height: y1 - y0 }));
    const zl = M.dir === 'higher'
      ? nfText(x(bmin) - 6, 40, wide ? 'Worse side' : 'Worse', 'nf-zonelab', 'end')
      : nfText(x(bmax) + 6, 40, 'Worse side', 'nf-zonelab');
    zone.appendChild(zl);
    bg.appendChild(zone);
    bg.appendChild(svgEl('rect', { class: 'nf-bandrect', x: r1(x(bmin)), y: y0, width: r1(Math.max(2, x(bmax) - x(bmin))), height: y1 - y0 }));
    const labels = svgEl('g', { class: 'nf-fade' });
    const bl = nfText(x(bmin), 20, `${wide ? 'Baseline band' : 'Band'} ${nfF3(bmin)} to ${nfF3(bmax)}`, 'nf-bandlab');
    const bm = svgEl('g', { class: 'nf-bmean' });
    bm.appendChild(svgEl('line', { x1: r1(x(bmu)), x2: r1(x(bmu)), y1: lanes[0] + 4, y2: lanes[0] + LH - 18 }));
    const bml = nfText(x(bmu) + 5, lanes[0] + LH - 6, `mean ${nfF3(bmu)}`, 'nf-mlab');
    labels.append(bl, bm, bml);
    bg.appendChild(labels);
    svg.appendChild(bg);
    const swarm = (vals, lane, cls, who) => {
      const used = [];
      const order = vals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
      const out = [];
      for (const { v, i } of order) {
        const px = x(v);
        const o = [0, -15, 15].find(o => !used.some(u => u.o === o && Math.abs(u.x - px) < 2 * r)) ?? 0;
        used.push({ x: px, o });
        const g = svgEl('g', { class: `nf-dot ${cls}` });
        g.appendChild(svgEl('circle', { cx: r1(px), cy: lane + 27 + o, r }));
        const t = svgEl('title'); t.textContent = `${who} repeat ${i}: ${+v.toFixed(4)}`; g.appendChild(t);
        out[i] = g;
      }
      return out;
    };
    const baseDots = swarm(M.base, lanes[0], 'base', 'Baseline');
    const cg = svgEl('g', { class: 'nf-cmean' });
    cg.appendChild(svgEl('line', { x1: 0, x2: 0, y1: lanes[1] + 3, y2: lanes[1] + LH - 18 }));
    const cl = nfText(6, lanes[1] + LH - 6, `mean ${nfF3(cmu)}${M.edge ? ', on the edge' : ''}`, 'nf-mlab nf-fade');
    cg.appendChild(cl);
    const candDots = swarm(M.cand, lanes[1], 'cand', 'Candidate');
    svg.append(...baseDots, cg, ...candDots);
    svg.appendChild(svgEl('line', { class: 'nf-axis', x1: L, x2: W - R, y1: axisY, y2: axisY }));
    M.ticks.forEach(v => {
      const tx = r1(x(v));
      svg.appendChild(svgEl('line', { class: 'nf-axis', x1: tx, x2: tx, y1: axisY - 4, y2: axisY + 4 }));
      svg.appendChild(nfText(tx, axisY + 19, v.toFixed(2), 'nf-tick', 'middle'));
    });
    svg.appendChild(nfText(L, axisY + 42, M.axis[wide ? 0 : 1], 'nf-cap'));
    nfFit(bl, W - R, W - R);
    nfFit(bml, W - R, x(bmu) - 5);
    if (x(cmu) + 6 + cl.getComputedTextLength() > W - R) { cl.setAttribute('text-anchor', 'end'); cl.setAttribute('x', -6); }
    geo = { bg, baseDots, candDots, cg, cl, xb: x(bmu), xc: x(cmu), bmin, bmax, bmu, cmu };
    apply();
    nfSettle(svg);
  }

  function apply() {
    const M = MODES[mode], done = step >= 5;
    geo.baseDots.forEach(d => d.classList.toggle('is-off', step < 1));
    geo.bg.classList.toggle('is-off', step < 2);
    geo.candDots.forEach(d => d.classList.toggle('is-off', step < 3));
    geo.cg.classList.toggle('is-off', step < 3);
    geo.cl.classList.toggle('is-off', step < 4);
    geo.cg.style.transform = `translate(${r1(step >= 4 ? geo.xc : geo.xb)}px, 0px)`;
    geo.cg.classList.toggle('is-good', done && !M.bad);
    geo.cg.classList.toggle('is-bad', done && M.bad);
    ctx.innerHTML = M.ctx;
    noteEl.innerHTML = M.note;
    const set = (k, v, cls, always) => { const dd = $(`#nf-gstats dd[data-k="${k}"]`); const on = done || always; dd.textContent = on ? v : '…'; dd.className = on ? cls : 'nf-wait'; };
    set('band', `${nfF3(geo.bmin)}–${nfF3(geo.bmax)}`, '', true);
    set('mean', nfF3(geo.cmu), '');
    set('effect', nfF3(Math.abs(geo.cmu - geo.bmu)), '');
    set('verdict', M.verdict, M.bad ? 'is-neg' : 'is-pos');
    set('exit', M.exit, M.bad ? 'is-neg' : 'is-pos');
    reasonEl.replaceChildren(...(done ? M.lines : []).map(([k, t]) => { const s = document.createElement('span'); s.className = k; s.textContent = t; return s; }));
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }

  async function runMode(m, me, keepBase) {
    mode = m;
    step = keepBase ? 2 : 0;
    build();
    if (!keepBase) {
      await wait(300, me);
      for (const d of geo.baseDots) { d.classList.remove('is-off'); await wait(120, me); }
      step = 1;
      await wait(250, me);
      step = 2; apply();
      await wait(750, me);
    } else await wait(450, me);
    for (const d of geo.candDots) { d.classList.remove('is-off'); await wait(120, me); }
    step = 3; apply();
    await wait(450, me);
    step = 4; apply();
    await wait(1050, me);
    step = 5; apply();
  }

  /* Binary scorers: every pass-count pair at N=5, verdicts from the project's own compare() */
  const grid = $('#nf-grid'), tip = $('#nf-tip');
  const RAN = new Set(['5,4', '4,3']), WAS = new Set(MATRIX.prefix_changed.map(([k, j]) => `${k},${j}`));
  const SYM = { regressed: '−', improved: '+', unchanged: '·' };
  const CLS = { regressed: ' is-reg', improved: ' is-imp', unchanged: '' };
  const WORD = { regressed: 'regressed', improved: 'improved', unchanged: 'within noise' };
  let html = '<span aria-hidden="true"></span><span class="nf-gcap" aria-hidden="true">Candidate passes</span><span class="nf-corner" aria-hidden="true">Baseline</span>';
  for (let j = 0; j <= 5; j++) html += `<span class="nf-gh" aria-hidden="true">${j}/5</span>`;
  for (let k = 5; k >= 0; k--) {
    html += `<span class="nf-gh is-row" aria-hidden="true">${k}/5</span>`;
    for (let j = 0; j <= 5; j++) {
      const [v, why] = MATRIX.cells[k][j], key = `${k},${j}`;
      html += `<button type="button" class="nf-cell${CLS[v]}${RAN.has(key) ? ' is-ran' : ''}${WAS.has(key) ? ' is-was' : ''}" data-k="${k}" data-j="${j}" aria-label="Baseline ${k}/5, candidate ${j}/5: ${WORD[v]}. ${esc(why)}">${SYM[v]}</button>`;
    }
  }
  grid.innerHTML = html;
  const cells = $$('.nf-cell', grid);
  const showTip = c => {
    const k = +c.dataset.k, j = +c.dataset.j, [v, why] = MATRIX.cells[k][j];
    tip.innerHTML = `<b>Baseline ${k}/5, candidate ${j}/5: ${WORD[v]}</b><span>${esc(why)}</span>${WAS.has(`${k},${j}`) ? '<span>Before issue #7 was fixed, this read improved.</span>' : ''}`;
    tip.classList.add('is-on');
    const wrapW = tip.parentElement.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = `${clamp(c.offsetLeft + c.offsetWidth / 2 - tw / 2, 0, Math.max(0, wrapW - tw))}px`;
    const above = c.offsetTop - th - 8;
    tip.style.top = `${above >= 0 ? above : c.offsetTop + c.offsetHeight + 8}px`;
  };
  const hideTip = () => tip.classList.remove('is-on');
  cells.forEach(c => {
    c.addEventListener('pointerenter', () => showTip(c));
    c.addEventListener('pointerleave', hideTip);
    c.addEventListener('focus', () => showTip(c));
    c.addEventListener('blur', hideTip);
  });
  const gridOn = on => cells.forEach(c => c.classList.toggle('is-off', !on));

  build();
  // Rebuilding mid-play would hide dots revealed one by one, so wait for a resting state.
  const rebuild = () => { if (step === 0 || step >= 5) build(); };
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(rebuild, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  const d = demo(el, {
    reset() { if (!pinned) gridOn(false); mode = pinned || 'real'; step = 0; build(); },
    final() { mode = pinned || 'large'; step = 5; build(); gridOn(true); },
    async play(me) {
      if (pinned) { await runMode(pinned, me, false); gridOn(true); return; }
      await runMode('real', me, false);
      await wait(2200, me);
      await runMode('small', me, false);
      await wait(1800, me);
      await runMode('large', me, true);
      await wait(700, me);
      for (let k = 0; k < 6; k++) {
        cells.slice(k * 6, k * 6 + 6).forEach(c => c.classList.remove('is-off'));
        await wait(110, me);
      }
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { pinned = b.dataset.mode; d.start(); }));
  // The tour plays all three candidates in order, not whichever one was last picked.
  d.prepare = () => { pinned = null; };
})();

/* 5. Verdicts: the committed capture under today's rule and the rule before the fix */
(() => {
  const el = $('#d-verdict'), board = $('#nf-board'), head = $('#nf-headline');
  const CASES = [
    ['charging-bays', ['0:json_valid: 3/3 → 3/3', '1:json_path_in: 3/3 → 3/3', '2:json_path_number: 0.543 [0.437–0.597] n=3 → 0.597 [0.597–0.597] n=3']],
    ['error-code-409', ['0:json_valid: 3/3 → 3/3', '1:contains: 3/3 → 3/3', '2:json_path_subset: 3/3 → 3/3']],
    ['offline-behaviour', ['0:json_valid: 3/3 → 3/3', '1:json_path_in: 3/3 → 3/3', '2:json_path_subset: 3/3 → 3/3', '3:contains: 3/3 → 3/3']],
    ['refuses-off-domain', ['0:json_valid: 3/3 → 3/3', '1:json_path_equals: 3/3 → 3/3', '2:not_contains: 3/3 → 3/3']],
    ['refuses-parental-leave', ['0:json_valid: 3/3 → 3/3', '1:contains: 3/3 → 3/3', '2:json_path_equals: 3/3 → 3/3']]
  ];
  const OLD = '2:json_path_number: mean 0.597 (n=3) → 0.543 (n=3), outside the baseline band [0.597–0.597]';
  board.innerHTML = CASES.map(([id, sc], i) => `<li class="nf-case"><div class="nf-case-top"><code>${id}</code><span class="nf-vchip">Unchanged</span></div>${
    i === 0 ? `<p class="nf-why"><code>${esc(OLD)}</code></p>` : ''}<ul>${
    sc.map(s => `<li${s.startsWith('2:json_path_number') ? ' class="nf-num"' : ''}>${esc(s)}</li>`).join('')}</ul></li>`).join('');
  const rows = $$('.nf-case', board), first = rows[0], chip = $('.nf-vchip', first);
  let userPicked = false;
  const setRule = r => {
    const old = r === 'old';
    first.classList.toggle('is-imp', old);
    chip.textContent = old ? 'Improved' : 'Unchanged';
    head.textContent = old ? '1 improved, 4 unchanged' : '5 unchanged';
    head.classList.toggle('is-imp', old);
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rule === r)));
  };
  const rowsOn = on => rows.forEach(r => r.classList.toggle('is-off', !on));
  demo(el, {
    reset() { userPicked = false; rowsOn(false); setRule('now'); },
    final() { rowsOn(true); if (!userPicked) setRule('now'); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.remove('is-off'); await wait(140, me); }
      await wait(1300, me);
      if (!userPicked) setRule('old');
      await wait(3600, me);
      if (!userPicked) setRule('now');
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { userPicked = true; rowsOn(true); setRule(b.dataset.rule); }));
})();

/* 6. Exit codes: four illustrative changes, real runs */
(() => {
  const el = $('#d-exit'), wrap = $('#nf-exits'), pre = $('#nf-exit-pre');
  const BASE5 = 'flaky-answer: 20261003T214518.256978Z-flaky-answer-37ae7bc1';
  const S = [
    { code: 0, title: 'No regression', ci: 'CI passes', what: 'Baseline 4/5. The change fails one more repeat: 3/5.', key: '1:contains: 4/5 → 3/5',
      lines: [['cmd', 'noisefloor --root .nf-flaky check suite.yaml'],
        ['', 'flaky-answer: 20261003T214519.976300Z-flaky-answer-37ae7bc1 → 20261003T214520.864839Z-flaky-answer-37ae7bc1'],
        ['', '  1 unchanged'], ['', ''], ['ok', '        ok  capital-of-france'], ['dim', '            0:json_valid: 5/5 → 5/5'],
        ['', '            1:contains: 4/5 → 3/5'], ['', ''], ['', 'exit 0']] },
    { code: 1, title: 'Regressed', ci: 'CI fails', what: 'Baseline 5/5. The change makes one repeat fail: 4/5.', key: 'unanimous baseline 5/5 → 4/5',
      lines: [['cmd', 'noisefloor check suite.yaml'], ['', `${BASE5} → 20261003T214519.204876Z-flaky-answer-37ae7bc1`],
        ['', '  1 regressed'], ['', ''], ['err', ' REGRESSED  capital-of-france'],
        ['err', '            1:contains: unanimous baseline 5/5 → 4/5; a clean baseline showed no variance, so any failure is new'],
        ['dim', '            0:json_valid: 5/5 → 5/5'], ['', '            1:contains: 5/5 → 4/5'], ['', ''], ['', 'exit 1']] },
    { code: 2, title: 'Broke', ci: 'CI fails', what: 'The change makes the target crash on every repeat.', key: 'every repeat failed: error:exit',
      lines: [['cmd', 'noisefloor check suite.yaml'], ['', `${BASE5} → 20261003T214545.085330Z-flaky-answer-37ae7bc1`],
        ['', '  1 broke'], ['', ''], ['err', '     BROKE  capital-of-france'], ['err', '            every repeat failed: error:exit'], ['', ''], ['', 'exit 2']] },
    { code: 3, title: 'Refused', ci: 'CI fails', what: "The suite's target command gained a -u flag.", key: 'error: target command changed',
      lines: [['cmd', 'noisefloor check suite.yaml'],
        ['err', "error: target command changed: ['python', 'target.py', '{{input}}', '{{repeat}}'] → ['python', '-u', 'target.py', '{{input}}', '{{repeat}}']. Re-baseline, or pass --allow-target-change."]] }
  ];
  wrap.innerHTML = S.map((s, i) => `<button type="button" class="nf-ex ${s.code ? 'is-fail' : 'is-pass'}" data-i="${i}" aria-pressed="false"><span class="nf-code">${s.code}</span><b>${s.title}</b><span class="nf-what">${esc(s.what)}</span><code>${esc(s.key)}</code><span class="nf-ci">${s.ci}</span></button>`).join('');
  const cards = $$('.nf-ex', wrap);
  const line = ([k, t]) => { const sp = document.createElement('span'); if (k) sp.className = k; sp.textContent = t || ' '; return sp; };
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
          await wait(l[0] === 'cmd' ? 380 : 60, me);
        }
        await wait(1100, me);
      }
    }
  });
  cards.forEach((c, i) => c.addEventListener('click', () => { userPicked = true; cards.forEach(x => x.classList.add('in')); select(i); render(i); }));
})();
