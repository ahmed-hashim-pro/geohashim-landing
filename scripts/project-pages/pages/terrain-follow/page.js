/* terrain-follow. Every number below was printed by the CLI or the library at cd490b4 (see the figcaptions). */
const TF = /*@@DATA:flight@@*/;
const tfPre = (pre, rows) => { pre.innerHTML = rows.map(([k, t]) => `<span class="${k}">${esc(t)}</span>`).join('\n'); };
const tfTone = t => (/REFUSED|refused|cannot|terrain-follow:/.test(t) ? 'err' : 'out');
const tfOut = text => text.split('\n').map(t => [tfTone(t), t]);
const DEMF = 'data/zurich-cop30.asc';
const TF_HEAD = `DEM     ${DEMF}: 180 x 288 posts about 31 x 21 m apart, elevation 399-729 m
home    47.397742 N 8.545594 E, 488.5 m AMSL (from the plan)
budget  30 m clearance required, after 4 m DEM error, 5 m altitude error and 10 m cross-track error
`;
const TF_COLS = 'leg          length  altitude AMSL       proven  centre line  verdict';
const TF_PLAN_OK = `${TF_COLS}
1 -> 3        1306 m   548.5 ->  548.5    42.1 m       51.9 m  ok
3 -> 4        1734 m   548.5 ->  655.9    31.7 m       43.0 m  ok
4 -> 5         700 m   655.9 ->  670.0    30.1 m       39.9 m  ok`;
const TF_CHECK = `${TF_COLS}
1 -> 3        1306 m   548.5 ->  548.5    42.1 m       51.9 m  ok
3 -> 4        2434 m   548.5 ->  548.5   -88.9 m      -79.4 m  REFUSED

  leg 3 -> 4: proven clearance -88.9 m is below the required 30 m; the line itself goes into the terrain 842 m into the leg

1 of 2 legs refused. \`terrain-follow plan\` raises the mission until every leg is proven.`;
const TF_TERRAIN = "terrain-follow: terrain-frame.plan: item 3 (waypoint) uses a terrain-relative altitude frame; its real altitude depends on the terrain data the ground station had, so it cannot be checked. Use an absolute or relative-to-home altitude.";
const TF_MUT = [
  ['correct', 'clean', '-', 0, 'never above the brute-force minimum; 1.5 m below it on average'],
  ['waypoints-only', 'caught', '1', 806, 'terrain checked under each waypoint only'],
  ['centre-line-30m', 'caught', '1', 802, 'the centre line sampled every 30 m (the DEM spacing)'],
  ['no-corridor', 'caught', '3', 500, 'exact maximum, but on the centre line only: no cross-track error'],
  ['nearest-post', 'caught', '1', 345, 'the corridor box, but only the DEM posts inside it, not the surface'],
  ['no-vertical-error', 'caught', '1', 618, 'DEM and altitude errors left out'],
  ['midpoint-altitude', 'caught', '1', 205, '50 m pieces with the altitude at their middle']
];
const tfMutTable = () => ['variant             result    first seed    overstated   what it does',
  ...TF_MUT.map(([n, r, f, o, w]) => `${n.padEnd(20)}${r.padEnd(9)}${f.padStart(11)}${`${o}/1000`.padStart(14)}   ${w}`),
  '', '1000 random cases (seeds 1..1000) in 11.5s'].join('\n');
const tfRun = (cmd, text, code) => [['cmd', cmd], ...tfOut(text), ['cmd', 'echo $?'], [code ? 'err' : 'ok', String(code)]];

/* Hero terminal */
PAGE.terminal = {
  scenes: {
    check: tfRun(`terrain-follow check examples/delivery.plan --dem ${DEMF}`, TF_HEAD + '\n' + TF_CHECK, 1),
    plan: tfRun(`terrain-follow plan examples/delivery.plan --dem ${DEMF} -o safe.plan`, `${TF_HEAD}
planned with climbs and descents no steeper than 0.15 m per metre flown
  item 4 of the original (waypoint): 548.5 -> 670.0 m AMSL
  1 waypoint added; all altitudes written AMSL
wrote safe.plan (6 items)

${TF_PLAN_OK}

every leg proven clear; highest point above the terrain on the centre line: 79 m.`, 0),
    mutants: [['cmd', 'terrain-follow mutants --seeds 1000'], ...tfMutTable().split('\n').map(t => ['out', t])],
    bad: tfRun(`terrain-follow check terrain-frame.plan --dem ${DEMF}`, TF_TERRAIN, 2)
  },
  order: ['check', 'plan', 'mutants', 'bad']
};

/* pytest -q: 237 items across five files */
PAGE.tests = [['tests/test_check.py', 159, 'var(--blue)'], ['tests/test_dem.py', 50, 'var(--water)'], ['tests/test_plan.py', 14, 'var(--magenta)'], ['tests/test_mission.py', 9, 'var(--yellow)'], ['tests/test_cli.py', 5, 'var(--green)']];

/* 1. Read: six missions, the item that stops each one */
(() => {
  const el = $('#d-read'), chips = $('#tf-chips'), list = $('#tf-items'), pre = $('#tf-read-pre');
  const WP3 = '47.386, 8.545', WP4 = '47.378, 8.575';
  const base = ['takeoff, 60 m above home', 'speed 12 m/s', `waypoint ${WP3}, 60 m above home`, `waypoint ${WP4}, 60 m above home`, `land ${WP4}`];
  const swap = (a, i, v) => a.map((x, k) => (k === i ? v : x));
  const F = [
    ['delivery.plan', 'The example', base, [4], TF_CHECK, 1],
    ['terrain-frame.plan', 'Terrain frame', swap(base, 2, `waypoint ${WP3}, 60 m above terrain`), [3], TF_TERRAIN, 2],
    ['survey.plan', 'Survey item', [...base.slice(0, 2), 'survey (a QGC complex item)', ...base.slice(2)], [3], 'terrain-follow: survey.plan: item 3 is a survey; only simple items are supported (QGC can convert a survey into waypoints)', 2],
    ['land-away.plan', 'Landing away', swap(base, 4, 'land 47.380, 8.570'), [5], `${TF_COLS}
1 -> 3        1306 m   548.5 ->  548.5    42.1 m       51.9 m  ok
3 -> 4        2434 m   548.5 ->  548.5   -88.9 m      -79.4 m  REFUSED
4 -> 5         438 m   548.5 ->  548.5         -            -  REFUSED

  leg 4 -> 5: the landing point is away from the previous waypoint, and how PX4 descends on the way is not modelled; put a waypoint above the landing point (plan does this)

2 of 3 legs refused. \`terrain-follow plan\` raises the mission until every leg is proven.`, 1],
    ['waypoint-first.plan', 'No takeoff yet', [base[2], base[1], 'takeoff, 60 m above home', base[3], base[4]], [1], 'terrain-follow: item 1 (waypoint) comes before any takeoff', 2],
    ['rtl.csv', 'Return home', ['takeoff, 60 m above home', `waypoint ${WP3}, 60 m above home`, `waypoint ${WP4}, 60 m above home`, 'rtl'], [4], `${TF_COLS}
1 -> 2        1306 m   548.5 ->  548.5    42.1 m       51.9 m  ok
2 -> 3        2434 m   548.5 ->  548.5   -88.9 m      -79.4 m  REFUSED
3 -> 4        3122 m   548.5 ->  548.5  -151.9 m     -141.6 m  REFUSED

  leg 3 -> 4: proven clearance -151.9 m is below the required 30 m; the line itself goes into the terrain 0 m into the leg

2 of 3 legs refused. \`terrain-follow plan\` raises the mission until every leg is proven.`, 1]
  ];
  chips.innerHTML = F.map(([f, label], i) => `<button type="button" data-i="${i}" aria-pressed="false"><b>${esc(label)}</b><span>${esc(f)}</span></button>`).join('');
  const btns = $$('button', chips);
  let cur = 0;
  const show = (i, lit) => {
    cur = i;
    const [f, , items, bad, out, code] = F[i];
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    list.innerHTML = items.map((r, k) => `<li class="${lit && bad.includes(k + 1) ? 'is-bad' : ''}"><code>${esc(r)}</code></li>`).join('');
    // The rtl.csv run trims one of its two notes to fit; the other is shown for the delivery example.
    tfPre(pre, lit ? [['cmd', `terrain-follow check ${f} --dem ${DEMF}`], ...tfOut(out), ['dim', `exit ${code}`]] : [['cmd', `terrain-follow check ${f} --dem ${DEMF}`]]);
  };
  btns.forEach(b => b.addEventListener('click', () => { b.classList.add('is-seen'); show(+b.dataset.i, true); }));
  demo(el, {
    reset() { btns.forEach(b => b.classList.remove('is-seen')); show(0, false); },
    final() { btns.forEach(b => b.classList.add('is-seen')); show(cur, true); },
    async play(me) {
      for (let i = 0; i < F.length; i++) {
        show(i, false);
        await wait(i ? 380 : 500, me);
        show(i, true);
        btns[i].classList.add('is-seen');
        await wait(1500, me);
      }
      show(0, true);
    }
  });
})();

/* 2. Terrain: the posts around one piece, its corridor box and the corners evaluated */
(() => {
  const el = $('#d-max'), svg = $('#tf-max-svg'), read = $('#tf-max-read'), seg = $$('[data-max]', el);
  // A 4 x 4 window of the 6 x 6 posts the data holds, enough to frame the box.
  const T0 = TF.patch, O = 1, N = 4, DX = T0.post_dx_m, DY = T0.post_dy_m;
  const sh = ([u, v, ...r]) => [u - O, v - O, ...r];
  const P = { ...T0, posts: T0.posts.slice(O, O + N).map(r => r.slice(O, O + N)), box_uv: [T0.box_uv[0] - O, T0.box_uv[1] - O, T0.box_uv[2] - O, T0.box_uv[3] - O],
    seg_uv: T0.seg_uv.map(sh), corners: T0.corners.map(sh), argmax_uv: sh(T0.argmax_uv) };
  const padL = 24, padR = 54, padT = 26, W = 420;
  const sx = (W - padL - padR) / ((N - 1) * DX), x = u => r1(padL + u * DX * sx), y = v => r1(padT + v * DY * sx);
  svg.setAttribute('viewBox', `0 0 ${W} ${r1(y(N - 1) + 16)}`);
  const all = P.posts.flat(), lo = Math.min(...all), hi = Math.max(...all);
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) {
    const m = (P.posts[i][j] + P.posts[i][j + 1] + P.posts[i + 1][j] + P.posts[i + 1][j + 1]) / 4;
    svg.appendChild(svgEl('rect', { class: 'tf-cell', x: x(j), y: y(i), width: r1(x(1) - x(0)), height: r1(y(1) - y(0)), style: `--k:${((m - lo) / (hi - lo)).toFixed(3)}` }));
  }
  const posts = svgEl('g', { class: 'tf-posts' });
  P.posts.forEach((row, i) => row.forEach((z, j) => {
    posts.appendChild(svgEl('circle', { cx: x(j), cy: y(i), r: 3.2 }));
    const t = svgEl('text', { x: x(j) + 5, y: y(i) - 5 }); t.textContent = z.toFixed(1); posts.appendChild(t);
  }));
  svg.appendChild(posts);
  const [u0, v0, u1, v1] = P.box_uv;
  const box = svgEl('rect', { class: 'tf-box', x: x(u0), y: y(v0), width: r1(x(u1) - x(u0)), height: r1(y(v1) - y(v0)) });
  const [[a0, b0], [a1, b1]] = P.seg_uv;
  const piece = svgEl('line', { class: 'tf-piece', x1: x(a0), y1: y(b0), x2: x(a1), y2: y(b1) });
  const near = svgEl('circle', { class: 'tf-near', cx: x(Math.round((u0 + u1) / 2)), cy: y(Math.round((v0 + v1) / 2)), r: 8 });
  const corners = svgEl('g', { class: 'tf-corners' });
  const seen = new Set();
  P.corners.forEach(([u, v, z]) => {
    const k = `${u},${v}`; if (seen.has(k)) return; seen.add(k);
    const best = u === P.argmax_uv[0] && v === P.argmax_uv[1];
    corners.appendChild(svgEl('rect', { class: best ? 'tf-corner is-max' : 'tf-corner', x: x(u) - 4, y: y(v) - 4, width: 8, height: 8, transform: `rotate(45 ${x(u)} ${y(v)})` }));
  });
  const ends = svgEl('g', { class: 'tf-ends' });
  [[a0, b0], [a1, b1]].forEach(([u, v]) => ends.appendChild(svgEl('circle', { cx: x(u), cy: y(v), r: 4.5 })));
  svg.append(box, piece, corners, near, ends);
  const TXT = {
    exact: `Exact maximum over the box: <b>${P.top.toFixed(2)} m</b>, at a corner of the box. The bound for this piece is ${P.alt.toFixed(2)} - ${P.top.toFixed(2)} - 9 = <b>${P.bound.toFixed(2)} m</b>.`,
    post: `Nearest post: <b>${P.nearest_post.toFixed(2)} m</b>, ${(P.top - P.nearest_post).toFixed(2)} m lower. No post lies inside a box this small.`,
    line: `Centre line at the piece's ends: <b>${Math.max(...P.centre_ends).toFixed(2)} m</b>, ${(P.top - Math.max(...P.centre_ends)).toFixed(2)} m lower. The higher ground is beside the line.`
  };
  let mode = 'exact';
  const show = m => {
    mode = m;
    seg.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.max === m)));
    corners.classList.toggle('in', m === 'exact');
    near.classList.toggle('in', m === 'post');
    ends.classList.toggle('in', m === 'line');
    read.innerHTML = TXT[m];
  };
  seg.forEach(b => b.addEventListener('click', () => show(b.dataset.max)));
  const parts = [box, piece];
  demo(el, {
    reset() { parts.forEach(p => p.classList.remove('in')); [corners, near, ends].forEach(p => p.classList.remove('in')); read.innerHTML = '&nbsp;'; },
    final() { parts.forEach(p => p.classList.add('in')); show(mode); },
    async play(me) {
      await wait(300, me); piece.classList.add('in');
      await wait(600, me); box.classList.add('in');
      await wait(700, me);
      for (const m of ['line', 'post', 'exact']) { show(m); await wait(1700, me); }
    }
  });
})();

/* The side view: terrain, flight line and optional layers, in one SVG */
function tfSide(svg, { lines = [], top = 760 } = {}) {
  const W = Math.round(clamp(svg.parentNode.clientWidth || 900, 320, 1100)), H = W < 600 ? 280 : 360;
  const L = 46, R = 12, T = 16, B = 30, pw = W - L - R, ph = H - T - B;
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  const LEN = TF.orig.len, lo = 380;
  const x = d => r1(L + d / LEN * pw), y = z => r1(T + (top - z) / (top - lo) * ph);
  for (let z = 400; z <= top; z += 50) {
    svg.appendChild(svgEl('line', { class: 'tf-gl', x1: L, x2: W - R, y1: y(z), y2: y(z) }));
    const t = svgEl('text', { class: 'tf-ax', x: L - 6, y: y(z) + 4, 'text-anchor': 'end' }); t.textContent = z; svg.appendChild(t);
  }
  for (let d = 0; d <= LEN; d += W < 600 ? 1000 : 500) {
    const t = svgEl('text', { class: 'tf-ax', x: x(d), y: H - 10, 'text-anchor': d ? 'middle' : 'start' }); t.textContent = `${d / 1000} km`; svg.appendChild(t);
  }
  const P = TF.orig.pts, pts = f => P.map(p => `${x(p[0])},${y(f(p))}`).join(' ');
  svg.appendChild(svgEl('polygon', { class: 'tf-ground', points: `${x(0)},${y(lo)} ${pts(p => p[2])} ${x(LEN)},${y(lo)}` }));
  const out = { x, y, W, pw, L };
  for (const [name, f, cls] of lines) out[name] = svg.appendChild(svgEl('polyline', { class: cls, points: pts(f) }));
  return out;
}
const tfLine = (S, wp, cls) => svgEl('polyline', { class: cls, points: wp.map(([d, z]) => `${S.x(d)},${S.y(z)}`).join(' ') });
const tfCurtain = (svg, S) => { const c = svgEl('rect', { class: 'tf-curtain', x: S.L, y: 0, width: S.pw + 20, height: '100%' }); svg.appendChild(c); return c; };
const tfSweep = (c, S, on) => { c.style.transition = 'none'; c.style.transform = on ? `translateX(${S.pw + 20}px)` : 'none'; };
const tfOnResize = (el, fn) => { let w = el.clientWidth; new ResizeObserver(() => { if (Math.abs(el.clientWidth - w) > 8) { w = el.clientWidth; fn(); } }).observe(el); };
const tfKey = (host, items) => { host.innerHTML = items.map(([c, t]) => `<span class="key"><i class="${c}"></i>${t}</span>`).join(''); };

/* 3. Bound: the layers that turn the centre line into the proven figure */
(() => {
  const el = $('#d-bound'), svg = $('#tf-bound-svg'), seg = $$('[data-lay]', el), legs = $('#tf-bound-legs');
  tfKey($('#tf-bound-key'), [['tf-k-ground', 'Terrain under the line'], ['tf-k-flight', 'Planned altitude'], ['tf-k-top', 'Highest ground within 10 m'], ['tf-k-err', '+ 9 m of errors'], ['tf-k-floor', '+ 30 m: lowest provable altitude']]);
  const NAMES = ['centre line', 'with the corridor', 'with the errors', 'against 30 m'];
  let S = null, lay = 3, cur = null;
  const LEGS = TF.orig.legs;
  const apply = () => {
    seg.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lay === lay)));
    ['top', 'err', 'floor'].forEach((k, i) => S[k].classList.toggle('in', lay > i));
    legs.innerHTML = LEGS.map(l => {
      const v = [l.nominal, l.proven + 9, l.proven, l.proven][lay];
      const bad = lay === 3 ? !l.ok : v < 0;
      return `<div class="${bad ? 'is-bad' : ''}"><span>Leg ${esc(l.label.replace('->', 'to'))}</span><b>${v.toFixed(1)} m</b><small>${lay === 3 ? (l.ok ? 'ok, at least 30 m' : 'REFUSED, below 30 m') : NAMES[lay]}</small></div>`;
    }).join('');
  };
  const build = () => {
    S = tfSide(svg, { lines: [['top', p => p[3], 'tf-top'], ['err', p => p[3] + 9, 'tf-err'], ['floor', p => p[3] + 39, 'tf-floor'], ['flight', p => p[1], 'tf-flight']] });
    cur = tfCurtain(svg, S); tfSweep(cur, S, true); apply();
  };
  build();
  tfOnResize(svg.parentNode, build);
  seg.forEach(b => b.addEventListener('click', () => { lay = +b.dataset.lay; apply(); }));
  demo(el, {
    reset() { tfSweep(cur, S, false); lay = 0; apply(); },
    final() { tfSweep(cur, S, true); lay = 3; apply(); },
    async play(me) {
      lay = 0; apply();
      await wait(200, me);
      cur.getBoundingClientRect(); cur.style.transition = ''; cur.style.transform = `translateX(${S.pw + 20}px)`;
      await wait(1900, me);
      for (let k = 1; k < 4; k++) { lay = k; apply(); await wait(1300, me); }
    }
  });
})();

/* 4. Test: overstated cases per variant */
(() => {
  const el = $('#d-test'), host = $('#tf-mut');
  host.innerHTML = TF_MUT.map(([n, r, f, o, w]) => `<div class="tf-mrow${o ? '' : ' is-clean'}"><span class="tf-mname"><code>${esc(n)}</code><small>${esc(w)}</small></span><span class="tf-mbar"><i style="transform:scaleX(${o / 1000})"></i></span><span class="tf-mval"><b>${o}</b>/1000 ${o ? `caught at seed ${f}` : 'clean'}</span></div>`).join('');
  const rows = $$('.tf-mrow', host);
  demo(el, {
    reset() { rows.forEach(r => r.classList.add('is-reset')); },
    final() { rows.forEach(r => r.classList.remove('is-reset')); },
    async play(me) { await wait(250, me); for (const r of rows) { r.classList.remove('is-reset'); await wait(330, me); } await wait(900, me); }
  });
})();

/* 5. Refuse: the planned mission under four budgets */
(() => {
  const el = $('#d-refuse'), seg = $$('[data-bud]', el), pre = $('#tf-ref-pre');
  const FLAG = ['', ' --clearance 40', ' --dem-error 10', ' --horizontal-error 30'];
  const R = [
    [`${TF_PLAN_OK}

every leg proven clear; the least margin is 30.1 m on leg 4 -> 5.`, 0],
    [`${TF_COLS}
1 -> 3        1306 m   548.5 ->  548.5    42.1 m       51.9 m  ok
3 -> 4        1734 m   548.5 ->  655.9    31.7 m       43.0 m  REFUSED
4 -> 5         700 m   655.9 ->  670.0    30.1 m       39.9 m  REFUSED

  leg 3 -> 4: proven clearance 31.7 m is below the required 40 m
  leg 4 -> 5: proven clearance 30.1 m is below the required 40 m`, 1],
    [`${TF_COLS}
1 -> 3        1306 m   548.5 ->  548.5    36.1 m       51.9 m  ok
3 -> 4        1734 m   548.5 ->  655.9    25.7 m       43.0 m  REFUSED
4 -> 5         700 m   655.9 ->  670.0    24.1 m       39.9 m  REFUSED

  leg 3 -> 4: proven clearance 25.7 m is below the required 30 m
  leg 4 -> 5: proven clearance 24.1 m is below the required 30 m`, 1],
    [`${TF_COLS}
1 -> 3        1306 m   548.5 ->  548.5    40.6 m       51.9 m  ok
3 -> 4        1734 m   548.5 ->  655.9    22.3 m       43.0 m  REFUSED
4 -> 5         700 m   655.9 ->  670.0    29.6 m       39.9 m  REFUSED

  leg 3 -> 4: proven clearance 22.3 m is below the required 30 m
  leg 4 -> 5: proven clearance 29.6 m is below the required 30 m`, 1]
  ];
  const TAIL = '\n\n2 of 3 legs refused. `terrain-follow plan` raises the mission until every leg is proven.';
  let cur = 0;
  const show = i => {
    cur = i;
    seg.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.bud === i)));
    const [text, code] = R[i];
    tfPre(pre, [['cmd', `terrain-follow check examples/delivery-planned.plan --dem ${DEMF}${FLAG[i]}`], ...tfOut(text + (code ? TAIL : '')), ['cmd', 'echo $?'], [code ? 'err' : 'ok', String(code)]]);
  };
  seg.forEach(b => b.addEventListener('click', () => show(+b.dataset.bud)));
  demo(el, {
    reset() { pre.replaceChildren(); },
    final() { show(cur); },
    async play(me) { for (let i = 0; i < 4; i++) { show(i); await wait(1500, me); } show(0); }
  });
})();

/* 6. Raise: the planned line over the lowest provable altitude, at three slacks */
(() => {
  const el = $('#d-raise'), svg = $('#tf-raise-svg'), seg = $$('[data-slack]', el), read = $('#tf-raise-read');
  tfKey($('#tf-raise-key'), [['tf-k-flight is-old', 'As planned'], ['tf-k-floor', 'Lowest provable altitude'], ['tf-k-plan', 'After plan'], ['tf-k-wp', 'Waypoint']]);
  const SL = TF.slack;
  let S = null, k = 1, cur = null, g = null;
  const draw = () => {
    if (g) g.remove();
    g = svgEl('g', { class: 'tf-planned' });
    const wp = SL[k].wp;
    g.appendChild(tfLine(S, wp, 'tf-plan'));
    wp.forEach(([d, z]) => g.appendChild(svgEl('circle', { class: 'tf-wp', cx: S.x(d), cy: S.y(z), r: 3.6 })));
    svg.insertBefore(g, cur);
    seg.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.slack === k)));
    const s = SL[k];
    read.innerHTML = `<b>--slack ${s.slack}</b>: ${s.added} waypoint${s.added === 1 ? '' : 's'} added, drop point raised from 548.5 to <b>${s.drop.toFixed(1)} m</b> AMSL, least proven clearance ${s.min.toFixed(1)} m. Exit 0.`;
  };
  const build = () => {
    S = tfSide(svg, { lines: [['floor', p => p[3] + 39, 'tf-floor in'], ['flight', p => p[1], 'tf-flight is-old']] });
    cur = tfCurtain(svg, S); tfSweep(cur, S, true); draw();
  };
  build();
  tfOnResize(svg.parentNode, build);
  seg.forEach(b => b.addEventListener('click', () => { k = +b.dataset.slack; draw(); }));
  demo(el, {
    reset() { k = 1; draw(); tfSweep(cur, S, false); },
    final() { tfSweep(cur, S, true); },
    async play(me) {
      await wait(200, me);
      cur.getBoundingClientRect(); cur.style.transition = ''; cur.style.transform = `translateX(${S.pw + 20}px)`;
      await wait(2000, me);
      for (const s of [0, 2, 1]) { k = s; draw(); await wait(1500, me); }
    }
  });
})();

/* 7. Fly: the SITL tracks over the same side view */
(() => {
  const el = $('#d-fly'), svg = $('#tf-fly-svg'), seg = $$('[data-fly]', el), stats = $('#tf-fly-stats');
  const RES = TF.sitl.results, PLAN = { original: [[0, 548.49], [TF.orig.len, 548.49]], planned: TF.planned_wp };
  const f1 = v => v.toFixed(1);
  const STATS = {
    original: [['Outcome', `Hit the hillside ${(RES.original.contact_at_m / 1000).toFixed(2)} km along`, true], ['Lowest clearance', `${f1(RES.original.min_clearance_m)} m, at contact`, true], ['Furthest off the line', `${RES.original.max_cross_track_m.toFixed(2)} m`], ['Furthest below plan', `${RES.original.max_below_plan_m.toFixed(2)} m`]],
    planned: [['Outcome', `Landed ${f1(RES.planned.end_distance_to_drop_m)} m from the drop point`], ['Lowest clearance', `${f1(RES.planned.min_clearance_m)} m, proven 30.1 m`], ['Furthest off the line', `${RES.planned.max_cross_track_m.toFixed(2)} m, budget 10 m`], ['Furthest below plan', `${RES.planned.max_below_plan_m.toFixed(2)} m, budget 5 m`]]
  };
  let S = null, which = 'planned', cur = null, g = null;
  const draw = () => {
    if (g) g.remove();
    g = svgEl('g');
    g.appendChild(tfLine(S, PLAN[which], 'tf-flight is-old'));
    const pts = TF.sitl[which].pts;
    g.appendChild(tfLine(S, pts.map(p => [p[0], p[1]]), 'tf-track'));
    if (which === 'original') { const p = pts[pts.length - 1]; g.appendChild(svgEl('circle', { class: 'tf-hit', cx: S.x(p[0]), cy: S.y(p[1]), r: 6 })); }
    svg.insertBefore(g, cur);
    seg.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fly === which)));
    stats.innerHTML = STATS[which].map(([k, v, bad]) => `<div><dt>${k}</dt><dd class="${bad ? 'is-bad' : ''}">${esc(v)}</dd></div>`).join('');
  };
  const build = () => { S = tfSide(svg); cur = tfCurtain(svg, S); tfSweep(cur, S, true); draw(); };
  tfKey($('#tf-fly-key'), [['tf-k-ground', 'Terrain under the path'], ['tf-k-flight is-old', 'Mission as uploaded'], ['tf-k-track', 'Flown, from telemetry']]);
  build();
  tfOnResize(svg.parentNode, build);
  seg.forEach(b => b.addEventListener('click', () => { which = b.dataset.fly; draw(); }));
  const sweep = async (me, ms) => { tfSweep(cur, S, false); cur.getBoundingClientRect(); cur.style.transition = `transform ${ms}ms linear`; cur.style.transform = `translateX(${S.pw + 20}px)`; await wait(ms + 200, me); };
  demo(el, {
    reset() { which = 'original'; draw(); tfSweep(cur, S, false); },
    final() { tfSweep(cur, S, true); },
    async play(me) {
      which = 'original'; draw(); await sweep(me, 2200);
      await wait(900, me);
      which = 'planned'; draw(); await sweep(me, 2600);
    }
  });
  $('#tf-fly-note').innerHTML = 'Run on this machine with the repo\'s <code>sitl/run.sh</code> and <code>analyze.py --check</code>, which passed all six of its checks, with PX4 on its own Docker network. One local change, in a scratch copy only: <code>fly.py</code> ends a run 30 s after the vehicle last moved sideways, and the 60 m takeoff climb takes about 31 s, so an unchanged run stopped the original mission at its first waypoint. Here climbing counts as movement too. The tracks are the vehicle\'s own position estimate, every 2 s, projected onto the path as <code>analyze.py</code> does.';
  $('#tf-fly-why').textContent = `The checker said the original line enters the terrain 2.15 km along. This run made contact at ${(RES.original.contact_at_m / 1000).toFixed(2)} km, the same place as the README's run, and the planned mission's lowest clearance came out at ${f1(RES.planned.min_clearance_m)} m in both.`;
})();
