/* Real runs of geofence-guard at 882828f (see the figcaptions and the research notes) */

/* Hero terminal: the repo's own example files, verbatim */
PAGE.terminal = {
  scenes: {
    shortcut: [
      ['cmd', 'geofence-guard check examples/field.fence examples/shortcut.csv'],
      ['out', 'leg 1   (10.0, 10.0, 0.0) -> (20.0, 20.0, 30.0)  ok'],
      ['out', 'leg 2   (20.0, 20.0, 30.0) -> (20.0, 230.0, 30.0)  ok'],
      ['err', 'leg 3   (20.0, 230.0, 30.0) -> (280.0, 100.0, 30.0)  REFUSED'],
      ['err', '        path_leaves_fence: path crosses the boundary of the fence'],
      ['out', ''], ['out', '2/3 legs ok'],
      ['cmd', 'echo $?'], ['out', '1']
    ],
    survey: [
      ['cmd', 'geofence-guard check examples/field.fence examples/survey.csv'],
      ['ok', 'leg 1   (10.0, 10.0, 0.0) -> (20.0, 20.0, 30.0)  ok'],
      ['ok', 'leg 2   (20.0, 20.0, 30.0) -> (20.0, 230.0, 30.0)  ok'],
      ['ok', 'leg 3   (20.0, 230.0, 30.0) -> (50.0, 230.0, 30.0)  ok'],
      ['ok', 'leg 4   (50.0, 230.0, 30.0) -> (50.0, 20.0, 30.0)  ok'],
      ['ok', 'leg 5   (50.0, 20.0, 30.0) -> (100.0, 20.0, 30.0)  ok'],
      ['ok', 'leg 6   (100.0, 20.0, 30.0) -> (280.0, 20.0, 30.0)  ok'],
      ['ok', 'leg 7   (280.0, 20.0, 30.0) -> (280.0, 100.0, 30.0)  ok'],
      ['ok', 'leg 8   (280.0, 100.0, 30.0) -> (140.0, 100.0, 30.0)  ok'],
      ['ok', 'leg 9   (140.0, 100.0, 30.0) -> (20.0, 20.0, 30.0)  ok'],
      ['out', ''], ['out', '9/9 legs ok'],
      ['cmd', 'echo $?'], ['out', '0']
    ],
    typo: [
      ['cmd', 'geofence-guard validate examples/field.fence'],
      ['out', 'envelope   examples/field.fence'],
      ['dim', 'frame      map'],
      ['dim', 'margin     5.0 m'],
      ['dim', 'altitude   2.0 to 120.0 m'],
      ['dim', 'state age  0.50 s max'],
      ['dim', 'max leg    300.0 m'],
      ['dim', 'fence      6 vertices, 51600 m^2'],
      ['dim', 'exclusion  mast, 4 vertices, 225 m^2'],
      ['out', ''],
      ['cmd', 'geofence-guard validate core/tests/data/typo.fence'],
      ['err', "error: core/tests/data/typo.fence: line 5: unknown key 'max_alitude'"],
      ['cmd', 'echo $?'], ['out', '2']
    ]
  },
  order: ['shortcut', 'survey', 'typo'],
  first: 'shortcut'
};

/* Tests per file: gtest cases counted from the sources, CLI tests from core/CMakeLists.txt; ctest ran all 93 */
PAGE.tests = [
  ['tests/test_guard.cpp', 35, 'var(--blue)'],
  ['tests/test_geometry.cpp', 26, 'var(--magenta)'],
  ['tests/test_envelope.cpp', 21, 'var(--water)'],
  ['CLI tests in CMakeLists.txt', 8, 'var(--yellow)'],
  ['tests/test_properties.cpp', 3, 'var(--green)']
];

/* The field from examples/field.fence, drawn north up in metres */
const GG_FENCE = [[0, 0], [300, 0], [300, 120], [120, 120], [120, 250], [0, 250]];
const GG_MAST = [[200, 40], [215, 40], [215, 55], [200, 55]];
const ggOut = (box, lines) => { box.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t)}</span>`).join(''); return $$('span', box); };
const ggSeg = (box, items, pick) => {
  box.innerHTML = items.map(([k, label]) => `<button type="button" data-k="${k}" aria-pressed="false">${esc(label)}</button>`).join('');
  const btns = $$('button', box);
  const mark = k => btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
  btns.forEach(b => b.addEventListener('click', () => pick(b.dataset.k)));
  return mark;
};
function ggField(svg, shift = 0, box = [-22, -22, 322, 272]) {
  const [x0, y0, x1, y1] = box;
  svg.setAttribute('viewBox', `${x0} ${-y1} ${x1 - x0} ${y1 - y0}`);
  svg.replaceChildren();
  const P = (x, y) => [x + shift, -(y + shift)];
  const pts = poly => poly.map(([x, y]) => P(x, y).join(',')).join(' ');
  const s = shift;
  svg.appendChild(svgEl('polygon', { class: 'gg-band', points: pts(GG_FENCE) }));
  // The 5 m inset: square at the convex corners, a 5 m arc around the inner corner.
  svg.appendChild(svgEl('path', {
    class: 'gg-in',
    d: `M${5 + s} ${-(5 + s)}H${295 + s}V${-(115 + s)}H${120 + s}A5 5 0 0 1 ${115 + s} ${-(120 + s)}V${-(245 + s)}H${5 + s}Z`
  }));
  svg.appendChild(svgEl('polygon', { class: 'gg-fence', points: pts(GG_FENCE) }));
  svg.appendChild(svgEl('rect', { class: 'gg-keep', x: 195 + s, y: -(60 + s), width: 25, height: 25, rx: 5 }));
  svg.appendChild(svgEl('polygon', { class: 'gg-mast', points: pts(GG_MAST) }));
  const layer = svgEl('g');
  svg.appendChild(layer);
  return { layer, P };
}
const ggLine = (layer, P, a, b, cls) => {
  const [x1, y1] = P(...a), [x2, y2] = P(...b);
  const l = svgEl('line', { class: `gg-leg ${cls}`, x1, y1, x2, y2 });
  layer.appendChild(l);
  return l;
};
const ggDot = (layer, P, p, cls, r = 4.5) => {
  const [cx, cy] = P(...p);
  const c = svgEl('circle', { class: cls, cx, cy, r });
  layer.appendChild(c);
  return c;
};
// Where a segment crosses a polygon's edges, in order along the segment (drawing only; the counts shown are the guard's).
function ggCrossings(a, b, poly) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const c = poly[i], d = poly[(i + 1) % poly.length];
    const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]);
    if (!den) continue;
    const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den;
    const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) out.push({ t, p: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])] });
  }
  return out.sort((m, n) => m.t - n.t).map(m => m.p);
}
const ggShow = (els, on) => els.forEach(e => e.classList.toggle('is-off', !on));

/* 1. Envelope: strict parsing */
(() => {
  const el = $('#d-envelope'), file = $('#gg-file'), out = $('#gg-env-out'), tally = $('#gg-env-tally');
  const F = ["# An L-shaped survey field with a radio mast near its south edge.", "# Local ENU frame, metres, origin at the launch point's south-west corner.", "", "frame map", "margin 5                 # metres kept from every boundary", "altitude 2 120           # z, metres above the origin", "max_state_age 0.5        # seconds", "max_leg 300              # metres from the vehicle to any one target", "", "fence", "  0   0", "  300 0", "  300 120", "  120 120                # the inner corner: the field is not convex", "  120 250", "  0   250", "end", "", "exclude mast", "  200 40", "  215 40", "  215 55", "  200 55", "end"];
  const edit = (pairs, ins) => { const l = F.slice(); for (const [n, t] of pairs) l[n - 1] = t; if (ins) l.splice(ins[0], 0, ins[1]); return l; };
  const V = {
    field: { label: 'field.fence', lines: F, mark: [], cmd: 'geofence-guard validate examples/field.fence', exit: 0,
      out: ['envelope   examples/field.fence', 'frame      map', 'margin     5.0 m', 'altitude   2.0 to 120.0 m', 'state age  0.50 s max', 'max leg    300.0 m', 'fence      6 vertices, 51600 m^2', 'exclusion  mast, 4 vertices, 225 m^2'] },
    units: { label: '5m', lines: edit([[5, 'margin 5m                # metres kept from every boundary']]), mark: [5], cmd: 'geofence-guard validate units.fence', exit: 2,
      out: ["error: units.fence: line 5: '5m' is not a finite number"] },
    nan: { label: 'nan', lines: edit([[6, 'altitude 2 nan          # z, metres above the origin']]), mark: [6], cmd: 'geofence-guard validate nan.fence', exit: 2,
      out: ["error: nan.fence: line 6: 'nan' is not a finite number"] },
    twice: { label: 'Set twice', lines: edit([], [8, 'margin 8']), mark: [9], cmd: 'geofence-guard validate twice.fence', exit: 2,
      out: ["error: twice.fence: line 9: 'margin' is set twice"] },
    bowtie: { label: 'Bow tie', lines: edit([[21, '  215 55'], [22, '  215 40']]), mark: [21, 22], cmd: 'geofence-guard validate bowtie.fence', exit: 2,
      out: ["error: bowtie.fence: line 19: exclusion zone 'mast' is not a simple polygon (an edge crosses or touches another, or a vertex repeats)"] },
    zero: { label: 'Zero margin', lines: edit([[5, 'margin 0                 # metres kept from every boundary']]), mark: [5], cmd: 'geofence-guard validate zero.fence', exit: 2,
      out: ['error: zero.fence: margin must be greater than zero: a vehicle tracking a setpoint on the fence line is outside it half the time'] },
    typo: { label: 'typo.fence', lines: ['frame map', 'margin 5', 'altitude 2 120', 'max_state_age 0.5', 'max_alitude 60', 'fence', '  0 0', '  100 0', '  100 100', 'end'], mark: [5], cmd: 'geofence-guard validate core/tests/data/typo.fence', exit: 2,
      out: ["error: core/tests/data/typo.fence: line 5: unknown key 'max_alitude'"] }
  };
  const ORDER = ['field', 'units', 'nan', 'twice', 'bowtie', 'zero', 'typo'];
  const ok = $('[data-k="ok"]', tally), bad = $('[data-k="bad"]', tally);
  const show = k => {
    const v = V[k];
    file.innerHTML = v.lines.map((t, i) => `<li${v.mark.includes(i + 1) ? ' class="is-mark"' : ''}><span>${i + 1}</span><code>${esc(t) || ' '}</code></li>`).join('');
    const spans = ggOut(out, [['cmd', v.cmd], ...v.out.map(t => [v.exit ? 'err' : 'dim', t]), ['cmd', 'echo $?'], ['', String(v.exit)]]);
    markSeg(k);
    return spans;
  };
  const count = n => {
    const seen = ORDER.slice(0, n);
    ok.textContent = String(seen.filter(k => !V[k].exit).length);
    bad.textContent = String(seen.filter(k => V[k].exit).length);
  };
  // A pick ends the run in progress at its next step and leaves the chosen file on screen.
  let picked = false;
  const markSeg = ggSeg($('#gg-env-seg'), ORDER.map(k => [k, V[k].label]), k => {
    picked = true;
    show(k);
    count(ORDER.length);
  });
  demo(el, {
    reset() { show('field'); count(0); ggShow($$('span', out), false); },
    final() { show('typo'); count(ORDER.length); },
    async play(me) {
      picked = false;
      for (let i = 0; i < ORDER.length; i++) {
        const spans = show(ORDER[i]);
        ggShow(spans, false);
        await wait(i ? 500 : 300, me);
        if (picked) return;
        for (const s of spans) { s.classList.remove('is-off'); await wait(160, me); }
        if (picked) return;
        count(i + 1);
        await wait(1100, me);
        if (picked) return;
      }
    }
  });
})();

/* 2. Every check, every failure; three of them end the decision */
(() => {
  const el = $('#d-checks'), list = $('#gg-checks'), out = $('#gg-chk-out');
  const CHECKS = [
    ['non_finite', 'Every coordinate and time is a number', true],
    ['frame_mismatch', 'Setpoint and position are in the envelope frame', true],
    ['stale_state', 'Position is fresh enough to reason from', true],
    ['altitude_out_of_range', 'Target altitude is inside the band'],
    ['leg_too_long', 'Target is within max_leg of the vehicle'],
    ['target_outside_fence', 'Target is inside the fence, clear of the margin'],
    ['path_leaves_fence', 'The whole path stays clear of the fence edge'],
    ['target_in_exclusion', 'Target is clear of each exclusion zone'],
    ['path_enters_exclusion', 'The whole path stays clear of each zone']
  ];
  const MODES = {
    fresh: { st: ['ok', 'ok', 'ok', 'bad', 'bad', 'ok', 'bad', 'ok', 'ok'], out: [
      ['err', 'altitude_out_of_range: target altitude 150.0 m is outside [2.0, 120.0] m'],
      ['err', 'leg_too_long: leg is 314.5 m; limit is 300.0 m'],
      ['err', 'path_leaves_fence: path crosses the boundary of the fence']] },
    stale: { st: ['ok', 'ok', 'bad', 'skip', 'skip', 'skip', 'skip', 'skip', 'skip'], out: [
      ['err', 'stale_state: vehicle state is 1.20 s from the setpoint; limit is 0.50 s'],
      ['dim', 'decision ends here: the other six checks are not run']] }
  };
  const WORD = { ok: 'pass', bad: 'refused', skip: 'not run' };
  list.innerHTML = CHECKS.map(([code, what, hard]) => `<li${hard ? ' class="is-hard"' : ''}><code>${code}</code><span>${what}</span><b></b></li>`).join('');
  const rows = $$('li', list);
  const btns = $$('.seg button', el);
  let mode = 'fresh';
  const setRow = (r, s) => { r.dataset.st = s || ''; $('b', r).textContent = s ? WORD[s] : ''; };
  const all = on => { const M = MODES[mode]; rows.forEach((r, i) => setRow(r, on ? M.st[i] : '')); const sp = ggOut(out, M.out); ggShow(sp, on); return sp; };
  const d = demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      const M = MODES[mode], spans = all(false);
      await wait(400, me);
      for (let i = 0; i < rows.length; i++) {
        setRow(rows[i], M.st[i]);
        await wait(M.st[i] === 'skip' ? 110 : 380, me);
      }
      await wait(300, me);
      for (const s of spans) { s.classList.remove('is-off'); await wait(300, me); }
    }
  });
  btns.forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    d.start();
  }));
})();

/* 3. The path, not just the target */
(() => {
  const el = $('#d-path'), svg = $('#gg-path-svg'), out = $('#gg-path-out'), note = $('#gg-path-note');
  const btns = $$('.seg button', el);
  const MODES = {
    shortcut: {
      pts: [[10, 10], [20, 20], [20, 230], [280, 100]], bad: 2,
      out: [['cmd', 'geofence-guard check examples/field.fence examples/shortcut.csv'],
        ['out', 'leg 1   (10.0, 10.0, 0.0) -> (20.0, 20.0, 30.0)  ok'],
        ['out', 'leg 2   (20.0, 20.0, 30.0) -> (20.0, 230.0, 30.0)  ok'],
        ['err', 'leg 3   (20.0, 230.0, 30.0) -> (280.0, 100.0, 30.0)  REFUSED'],
        ['err', '        path_leaves_fence: path crosses the boundary of the fence'],
        ['out', ''], ['out', '2/3 legs ok']],
      note: 'Leg 3 starts and ends 20 m inside the fence, so a check on the target alone accepts it. The straight line leaves the fence at (120, 180) and comes back in at (240, 120), cutting across the missing corner.'
    },
    near: {
      pts: [[100, 34], [280, 37]], bad: 0,
      out: [['cmd', 'geofence-guard check field.fence nearmiss.csv'],
        ['err', 'leg 1   (100.0, 34.0, 30.0) -> (280.0, 37.0, 30.0)  REFUSED'],
        ['err', "        path_enters_exclusion: path comes within 4.1 m of exclusion zone 'mast'; margin is 5.0 m"],
        ['out', ''], ['out', '0/1 legs ok']],
      note: 'Both ends are well clear and the line never touches the mast. It passes 4.1 m below its south-east corner, inside the 5 m margin, so it is refused with the measured distance in the reason.'
    }
  };
  let mode = 'shortcut', parts = null;
  function build() {
    const M = MODES[mode];
    const { layer, P } = ggField(svg);
    const legs = [], extras = [];
    for (let i = 1; i < M.pts.length; i++) legs.push(ggLine(layer, P, M.pts[i - 1], M.pts[i], i - 1 === M.bad ? 'is-bad' : 'is-ok'));
    const a = M.pts[M.bad], b = M.pts[M.bad + 1];
    if (mode === 'shortcut') {
      const [p, q] = ggCrossings(a, b, GG_FENCE);
      extras.push(ggLine(layer, P, p, q, 'gg-out-seg'));
      extras.push(ggDot(layer, P, p, 'gg-x'), ggDot(layer, P, q, 'gg-x'));
      const [tx, ty] = P(152, 140);
      const t = svgEl('text', { class: 'gg-lab gg-lab-bad', x: tx, y: ty, 'text-anchor': 'middle' });
      t.textContent = 'outside';
      layer.appendChild(t);
      extras.push(t);
    } else {
      const [x1, y1] = P(215, 40), [x2, y2] = P(215, 34 + 3 * 115 / 180);
      const tick = svgEl('line', { class: 'gg-gap', x1, y1, x2, y2 });
      const t = svgEl('text', { class: 'gg-lab gg-lab-bad', x: x1 + 4, y: y2 + 14 });
      t.textContent = '4.1 m';
      layer.append(tick, t);
      extras.push(tick, t);
    }
    const ends = M.pts.slice(1).map((p, i) => ggDot(layer, P, p, i === M.bad ? 'gg-tgt is-bad' : 'gg-tgt'));
    const start = ggDot(layer, P, M.pts[0], 'gg-veh', 5);
    note.textContent = M.note;
    parts = { legs, extras, ends, start, spans: ggOut(out, M.out) };
  }
  const all = on => {
    build();
    parts.legs.forEach(l => { l.style.opacity = on ? 1 : 0; });
    ggShow([...parts.extras, ...parts.ends, ...parts.spans], on);
    note.classList.toggle('is-off', !on);
  };
  const d = demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      all(false);
      const M = MODES[mode];
      await wait(400, me);
      for (let i = 0; i < parts.legs.length; i++) {
        const l = parts.legs[i];
        parts.ends[i].classList.remove('is-off');
        if (i === M.bad) await wait(700, me);
        l.style.opacity = 1;
        drawPath(l, i === M.bad ? 1300 : 700);
        await wait(i === M.bad ? 1350 : 750, me);
      }
      ggShow(parts.extras, true);
      await wait(600, me);
      for (const s of parts.spans) { s.classList.remove('is-off'); await wait(140, me); }
      note.classList.remove('is-off');
    }
  });
  btns.forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    d.start();
  }));
})();

/* 4. Recovery: the way back from the margin band */
(() => {
  const el = $('#d-recover'), svg = $('#gg-rec-svg'), out = $('#gg-rec-out'), stats = $('#gg-cross');
  const C = {
    in: { label: 'In the band, heading in', a: [2, 100], b: [40, 100], where: '2 m inside the edge', max: '0', ok: true, n: 0,
      line: ['ok', 'leg 1   (2.0, 100.0, 30.0) -> (40.0, 100.0, 30.0)  ok  (recovery)'], file: 'band-in.csv' },
    along: { label: 'In the band, along it', a: [2, 100], b: [2, 150], where: '2 m inside the edge', max: 'n/a', ok: false, n: null,
      line: ['err', 'leg 1   (2.0, 100.0, 30.0) -> (2.0, 150.0, 30.0)  REFUSED  (recovery)'],
      why: ['err', '        target_outside_fence: target is 2.0 m inside the fence; margin is 5.0 m'], file: 'band-along.csv' },
    back: { label: 'Outside, straight back', a: [-6, 200], b: [40, 200], where: '6 m outside the fence', max: '1', ok: true, n: 1,
      line: ['ok', 'leg 1   (-6.0, 200.0, 30.0) -> (40.0, 200.0, 30.0)  ok  (recovery)'], file: 'out-back.csv' },
    notch: { label: 'Outside, across the notch', a: [-6, 200], b: [200, 100], where: '6 m outside the fence', max: '1', ok: false, n: 3,
      line: ['err', 'leg 1   (-6.0, 200.0, 30.0) -> (200.0, 100.0, 30.0)  REFUSED  (recovery)'],
      why: ['err', '        path_leaves_fence: returning path crosses the boundary of the fence 3 times; at most 1 allowed'], file: 'out-notch.csv' }
  };
  const ORDER = ['in', 'along', 'back', 'notch'];
  const dd = k => $(`[data-k="${k}"]`, stats);
  let cur = 'in', parts = null;
  function build(k) {
    cur = k;
    const c = C[k];
    const { layer, P } = ggField(svg);
    const leg = ggLine(layer, P, c.a, c.b, c.ok ? 'is-ok' : 'is-bad');
    const xs = c.n ? ggCrossings(c.a, c.b, GG_FENCE).map(p => ggDot(layer, P, p, 'gg-x', 4)) : [];
    const tgt = ggDot(layer, P, c.b, c.ok ? 'gg-tgt' : 'gg-tgt is-bad');
    const veh = ggDot(layer, P, c.a, 'gg-veh', 5);
    dd('where').textContent = c.where;
    dd('max').textContent = c.max;
    const lines = [['cmd', `geofence-guard check field.fence ${c.file}`], c.line];
    if (c.why) lines.push(c.why);
    parts = { c, leg, xs, tgt, veh, spans: ggOut(out, lines) };
    markSeg(k);
  }
  const settle = on => {
    const { c, leg, xs, tgt, spans } = parts;
    leg.style.opacity = on ? 1 : 0;
    ggShow([...xs, tgt, ...spans], on);
    dd('n').textContent = on ? (c.n === null ? 'not counted' : String(c.n)) : '0';
    const v = dd('verdict');
    v.textContent = on ? (c.ok ? 'Accepted' : 'Refused') : '';
    v.className = on ? (c.ok ? 'is-pos' : 'is-neg') : '';
  };
  async function playOne(k, me) {
    const step = async ms => { await wait(ms, me); if (picked) throw STOP; };
    build(k);
    settle(false);
    const { c, leg, xs, tgt, spans } = parts;
    await step(350);
    tgt.classList.remove('is-off');
    await step(400);
    leg.style.opacity = 1;
    drawPath(leg, 1100);
    let n = 0;
    for (const x of xs) { await step(1100 / (xs.length + 1)); x.classList.remove('is-off'); dd('n').textContent = String(++n); }
    await step(500);
    if (c.n === null) dd('n').textContent = 'not counted';
    const v = dd('verdict');
    v.textContent = c.ok ? 'Accepted' : 'Refused';
    v.className = c.ok ? 'is-pos' : 'is-neg';
    for (const s of spans) { s.classList.remove('is-off'); await wait(160, me); }
  }
  let picked = false;
  const markSeg = ggSeg($('#gg-rec-seg'), ORDER.map(k => [k, C[k].label]), k => {
    picked = true;
    build(k);
    settle(true);
  });
  demo(el, {
    reset() { build('in'); settle(false); },
    final() { build('notch'); settle(true); },
    async play(me) {
      picked = false;
      for (const k of ORDER) {
        await playOne(k, me);
        await wait(1500, me);
        if (picked) return;
      }
    }
  });
})();

/* 5. What leaves the node: forward, hold or nothing */
(() => {
  const el = $('#d-hold'), list = $('#gg-events');
  const EV = [
    { in: '(20, 100, 30) in map', act: 'forward', out: '(20, 100, 30), unchanged',
      json: '{"accepted":true,"recovery":false,"action":"forward","target":[20.000,100.000,30.000],"violations":[]}' },
    { in: '(280, 100, 30) in map', act: 'hold', out: 'hold at (20, 230, 30)',
      json: '{"accepted":false,"recovery":false,"action":"hold","target":[280.000,100.000,30.000],"violations":[{"code":"path_leaves_fence","detail":"path crosses the boundary of the fence"}]}' },
    { in: '(5, 0, 0) in base_link', act: 'hold', out: 'hold at (20, 230, 30), same point',
      json: '{"accepted":false,"recovery":false,"action":"hold","target":[5.000,0.000,0.000],"violations":[{"code":"frame_mismatch","detail":"envelope is in \'map\', setpoint in \'base_link\', vehicle state in \'map\'"}]}' },
    { in: '(20, 100, 30), odometry stopped', act: 'drop', out: 'nothing; the autopilot failsafe decides',
      json: '{"accepted":false,"recovery":false,"action":"drop","target":[20.000,100.000,30.000],"violations":[{"code":"stale_state","detail":"vehicle state is 1.20 s from the setpoint; limit is 0.50 s"}]}' }
  ];
  list.innerHTML = EV.map(e => `<li class="gg-ev is-${e.act}"><div class="gg-row"><span class="gg-in">${esc(e.in)}</span><b class="gg-act">${e.act}</b><span class="gg-outv">${esc(e.out)}</span></div><code class="gg-json">${esc(e.json)}</code></li>`).join('');
  const items = $$('li', list);
  const parts = items.map(li => ['.gg-in', '.gg-act', '.gg-outv', '.gg-json'].map(s => $(s, li)));
  const all = on => { items.forEach(li => li.classList.toggle('is-off', !on)); parts.flat().forEach(p => p.classList.toggle('is-off', !on)); };
  demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('is-off');
        for (const p of parts[i]) { await wait(380, me); p.classList.remove('is-off'); }
        await wait(500, me);
      }
    }
  });
})();

/* 6. PX4 SITL: the committed run, without and with the guard */
(() => {
  const el = $('#d-sitl'), A = $('#gg-sitl-a'), B = $('#gg-sitl-b'), na = $('#gg-sitl-na'), nb = $('#gg-sitl-nb');
  const WP = [[0, 0], [10, 220], [270, 90], [60, 60], [0, 0]];
  const box = [-30, -30, 302, 252];
  // sitl/field.fence is examples/field.fence moved by (-10, -10); drawing in the example's coordinates keeps one field.
  const M = WP.map(([x, y]) => [x + 10, y + 10]);
  let pa = null, pb = null;
  function build() {
    const a = ggField(A, -10, box), b = ggField(B, -10, box);
    const ga = [ggLine(a.layer, a.P, M[0], M[1], 'is-ok'), ggLine(a.layer, a.P, M[1], M[2], 'is-flown'), ggLine(a.layer, a.P, M[2], M[3], 'is-ok'), ggLine(a.layer, a.P, M[3], M[4], 'is-ok')];
    const [p, q] = ggCrossings(M[1], M[2], GG_FENCE);
    const oa = ggLine(a.layer, a.P, p, q, 'gg-out-seg');
    ggDot(a.layer, a.P, M[0], 'gg-veh', 5);
    const gb = [ggLine(b.layer, b.P, M[0], M[1], 'is-ok'), ggLine(b.layer, b.P, M[1], M[2], 'is-bad is-refused'), ggLine(b.layer, b.P, M[1], M[3], 'is-ok is-next'), ggLine(b.layer, b.P, M[3], M[4], 'is-ok')];
    ggDot(b.layer, b.P, M[0], 'gg-veh', 5);
    const xb = ggDot(b.layer, b.P, M[1], 'gg-hold', 7);
    pa = { legs: ga, extra: [oa] };
    pb = { legs: gb, extra: [xb] };
  }
  const notes = [na, nb];
  const NA = 'Waypoint 3 flown across the notch: 11.8 s outside the fence, up to 42.7 m out.';
  const NB = 'Waypoint 3 refused (path_leaves_fence), held 3 s, skipped; the planner moved on to waypoint 4.';
  const grow = (l, ms) => { l.style.opacity = 1; if (!/is-refused|is-next/.test(l.getAttribute('class'))) drawPath(l, ms); };
  const all = on => {
    build();
    [pa, pb].forEach(r => { r.legs.forEach(l => { l.style.opacity = on ? 1 : 0; }); ggShow(r.extra, on); });
    na.textContent = NA;
    nb.textContent = NB;
    ggShow(notes, on);
  };
  demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      all(false);
      await wait(400, me);
      for (let i = 0; i < 4; i++) {
        grow(pa.legs[i], 800);
        grow(pb.legs[i], 800);
        await wait(850, me);
        if (i === 1) {
          ggShow([...pa.extra, ...pb.extra], true);
          await wait(500, me);
          ggShow(notes, true);
          await wait(1400, me);
        }
      }
    }
  });
})();
