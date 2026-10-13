/* strata. Every number below was printed by the release binary at 047ca52 (see the figcaptions). */
const SEC = /*@@DATA:section@@*/;
const ST_UNITS = ['topsoil', 'clay', 'sand', 'gravel', 'chalk'];
const ST_SURF = ['ground surface', 'base of topsoil', 'base of clay', 'base of sand', 'base of gravel'];
const ST_HEAD = 'surface               elevation        95% interval   sigma';
const stLines = (cls, text) => text.split('\n').map(t => [cls, t]);
const stPre = (pre, rows) => { pre.innerHTML = rows.map(([k, t]) => `<span class="${k}">${esc(t)}</span>`).join('\n'); };

const ST_Q = {
  near: `at (490, 440), max sigma 1.5 m
${ST_HEAD}
ground surface            63.63     63.28 .. 63.97       0.17
base of topsoil           62.64     62.28 .. 63.01       0.19
base of clay              59.34     58.65 .. 60.03       0.35
base of sand              56.79     55.99 .. 57.60       0.41
base of gravel            51.90     51.06 .. 52.74       0.43`,
  far: `at (600, 480), max sigma 1.5 m
${ST_HEAD}
ground surface            63.93     62.74 .. 65.13       0.61
base of topsoil           63.18     61.88 .. 64.48       0.66
base of clay              59.16     56.75 .. 61.57       1.23
base of sand              55.41     52.55 .. 58.26       1.45
base of gravel          REFUSED    sigma over limit    1.52`,
  far1: `at (600, 480), max sigma 1 m
${ST_HEAD}
ground surface            63.93     62.74 .. 65.13       0.61
base of topsoil           63.18     61.88 .. 64.48       0.66
base of clay            REFUSED    sigma over limit    1.23
base of sand            REFUSED    sigma over limit    1.45
base of gravel          REFUSED    sigma over limit    1.52`,
  far2: `at (600, 480), max sigma 2 m
${ST_HEAD}
ground surface            63.93     62.74 .. 65.13       0.61
base of topsoil           63.18     61.88 .. 64.48       0.66
base of clay              59.16     56.75 .. 61.57       1.23
base of sand              55.41     52.55 .. 58.26       1.45
base of gravel            51.07     48.09 .. 54.06       1.52`,
  farRaw: `at (600, 480), max sigma 1.5 m
${ST_HEAD}
ground surface            63.93     61.54 .. 66.32       1.22
base of topsoil           63.18     60.74 .. 65.62       1.24
base of clay            REFUSED    sigma over limit    1.66
base of sand            REFUSED    sigma over limit    1.88
base of gravel          REFUSED    sigma over limit    1.96`,
  json: '{"x":600,"y":480,"surfaces":[{"surface":"ground surface","status":"known","elevation":63.933,"sigma":0.609,"low95":62.739,"high95":65.128},{"surface":"base of topsoil","status":"known","elevation":63.178,"sigma":0.664,"low95":61.877,"high95":64.479},{"surface":"base of clay","status":"known","elevation":59.158,"sigma":1.229,"low95":56.748,"high95":61.567},{"surface":"base of sand","status":"known","elevation":55.406,"sigma":1.455,"low95":52.554,"high95":58.257},{"surface":"base of gravel","status":"too_uncertain","sigma":1.525,"max_sigma":1.5}]}',
  typo: "strata: tests/data/typo.csv: line 4: unit 'clya' is not in the units list (topsoil, clay, sand, chalk)"
};
const ST_BENCH = `50 synthetic sites with smooth contacts, 40 holes and 200 test points each, scored against the truth

surface                 n    bias   rmse   msse  inside95   refused inside95 ans.
ground surface      10000    0.02   0.55   0.87     95.5%      0.0%         95.5%
base of topsoil     10000    0.02   0.58   0.88     95.7%      0.0%         95.7%
base of clay        10000    0.03   1.10   0.84     95.9%      8.2%         96.0%
base of sand        10000    0.04   1.33   0.91     95.5%     22.7%         96.4%
base of gravel      10000    0.03   1.39   0.90     95.6%     31.9%         96.8%
all                 50000    0.03   1.06   0.88     95.6%     12.6%         96.0%

bias and rmse in metres; msse ~ 1 and inside95 ~ 95% when the stated intervals are honest;
refused = sigma over 1.5 m; the last column is coverage among the answers the model would give.`;
const stTone = t => (/REFUSED/.test(t) ? 'err' : 'out');
const stQuery = (cmd, text, code) => [['cmd', cmd], ...text.split('\n').map(t => [stTone(t), t]), ['cmd', 'echo $?'], [code ? 'err' : 'ok', String(code)]];

/* Hero terminal */
PAGE.terminal = {
  scenes: {
    near: stQuery('strata query examples/site.csv 490 440', ST_Q.near, 0),
    far: stQuery('strata query examples/site.csv 600 480', ST_Q.far, 1),
    bench: [['cmd', 'strata bench'], ...stLines('out', ST_BENCH)],
    typo: [['cmd', 'strata validate tests/data/typo.csv'], ['err', ST_Q.typo], ['cmd', 'echo $?'], ['err', '2']]
  },
  order: ['near', 'far', 'bench', 'typo']
};

/* cargo test: 27 unit tests in src/, then tests/cli.rs, properties.rs and calibration.rs */
PAGE.tests = [['tests/cli.rs', 11, 'var(--blue)'], ['src/kriging.rs, linalg.rs', 8, 'var(--magenta)'], ['src/synth.rs, rng.rs', 8, 'var(--water)'], ['src/logs.rs, model.rs', 7, 'var(--yellow)'], ['tests/properties.rs', 5, 'var(--green)'], ['src/variogram.rs', 4, 'var(--ink-2)'], ['tests/calibration.rs', 3, 'var(--red)']];

/* 1. Parse: eight files, each stopped at the line that is wrong */
(() => {
  const el = $('#d-parse'), chips = $('#st-chips'), csv = $('#st-csv'), pre = $('#st-parse-pre');
  const HEAD = ['units: topsoil, clay, sand, chalk', 'hole,x,y,collar,unit,from,to'];
  const F = [
    ['typo.csv', 'Misspelt unit', ['A,0,0,50,topsoil,0,1', 'A,0,0,50,clya,1,5'], [4], "line 4: unit 'clya' is not in the units list (topsoil, clay, sand, chalk)"],
    ['gap.csv', 'Gap', ['A,0,0,50,topsoil,0,1', 'A,0,0,50,clay,1.2,5'], [4], 'line 4: hole A: gap between 1 and 1.2 m'],
    ['overlap.csv', 'Overlap', ['A,0,0,50,topsoil,0,1', 'A,0,0,50,clay,1,5', 'A,0,0,50,sand,4.6,9'], [5], 'line 5: hole A: overlap between 5 and 4.6 m'],
    ['order.csv', 'Out of order', ['A,0,0,50,topsoil,0,1', 'A,0,0,50,sand,1,5', 'A,0,0,50,clay,5,9'], [5], 'line 5: hole A: clay below sand is out of stratigraphic order (topsoil, clay, sand, chalk)'],
    ['twice.csv', 'Logged twice', ['A,0,0,50,topsoil,0,1', 'A,0,0,50,clay,1,5', 'A,0,0,50,clay,5,7'], [5], 'line 5: hole A: clay below clay is out of stratigraphic order (topsoil, clay, sand, chalk)'],
    ['split.csv', 'Rows split', ['A,0,0,50,topsoil,0,1', 'B,100,0,48,topsoil,0,1', 'A,0,0,50,clay,1,5'], [5], "line 5: hole A already ended (its rows start at line 3); keep a hole's rows together"],
    ['moved.csv', 'Collar changes', ['A,0,0,50,topsoil,0,1', 'A,0,0,50.4,clay,1,5'], [4], 'line 4: hole A changes location or collar between rows'],
    ['same.csv', 'Same spot', ['A,120.0,40.0,50,topsoil,0,1', 'B,120.0,40.0,48,topsoil,0,1'], [3, 4], 'holes A and B are at the same location']
  ];
  chips.innerHTML = F.map(([f, label], i) => `<button type="button" data-i="${i}" aria-pressed="false"><b>${esc(label)}</b><span>${esc(f)}</span></button>`).join('');
  const btns = $$('button', chips);
  let cur = 0;
  const show = (i, lit) => {
    cur = i;
    const [f, , rows, bad, err] = F[i];
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    csv.innerHTML = [...HEAD, ...rows].map((r, k) => `<li class="${lit && bad.includes(k + 1) ? 'is-bad' : ''}"><code>${esc(r)}</code></li>`).join('');
    stPre(pre, lit ? [['cmd', `strata validate ${f}`], ['err', `strata: ${f}: ${err}`], ['dim', 'exit 2']] : [['cmd', `strata validate ${f}`]]);
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
        await wait(1150, me);
      }
      show(0, true);
    }
  });
})();

/* 2. Stack: two columns, ground minus each thickness */
(() => {
  const el = $('#d-stack'), host = $('#st-cols');
  const COLS = [
    ['Next to BH16, at (490, 440)', [63.625, 62.645, 59.339, 56.794, 51.898], [0.175, 0.188, 0.351, 0.409, 0.429]],
    ['At BH26, where clay is missing', [62.76, 61.66, 61.66, 57.56, 54.66], [0, 0, 0, 0, 0]]
  ];
  const PX = 21, f3 = v => v.toFixed(3);
  host.innerHTML = COLS.map(([title, z, sg]) => {
    const segs = ST_UNITS.slice(0, 4).map((u, k) => {
      const t = z[k] - z[k + 1];
      return `<div class="st-seg st-u${k}${t < 0.7 ? ' is-thin' : ''}" style="height:${Math.max(t * PX, 0)}px"><span>${u} ${t.toFixed(2)} m</span></div>`;
    }).join('');
    const rows = [`<li><span>ground surface</span><b>${f3(z[0])}</b><i>σ ${f3(sg[0])}</i></li>`].concat(ST_UNITS.slice(0, 4).map((u, k) =>
      `<li><span>− ${u} ${f3(z[k] - z[k + 1])}</span><b>= ${f3(z[k + 1])}</b><i>σ ${f3(sg[k + 1])}</i></li>`)).join('');
    return `<div class="st-col"><p class="st-k">${esc(title)}</p><div class="st-col-body"><div class="st-bar" aria-hidden="true">${segs}<div class="st-seg st-u4 st-base"><span>chalk, base never modelled</span></div></div><ol class="st-sum">${rows}</ol></div></div>`;
  }).join('');
  $('#st-units-key').innerHTML = ST_UNITS.map((u, k) => `<span class="key"><i class="sw st-u${k}"></i>${u}</span>`).join('');
  const cols = $$('.st-col', host);
  const parts = col => ({ segs: $$('.st-seg', col), rows: $$('.st-sum li', col) });
  const setAll = on => cols.forEach(c => { const p = parts(c); p.segs.concat(p.rows).forEach(e => e.classList.toggle('in', on)); });
  demo(el, {
    reset() { setAll(false); },
    final() { setAll(true); },
    async play(me) {
      await wait(300, me);
      for (let k = 0; k < 5; k++) {
        for (const c of cols) {
          const p = parts(c);
          p.rows[k].classList.add('in');
          if (k) p.segs[k - 1].classList.add('in');
        }
        await wait(620, me);
      }
      cols.forEach(c => parts(c).segs[4].classList.add('in'));
    }
  });
})();

/* The section: layers, 95% bands, holes, and optionally the truth and refused areas */
function stSection(svg, opt) {
  const W = Math.round(clamp(svg.parentNode.clientWidth || 900, 340, 1100)), H = W < 600 ? 300 : 390;
  const L = 44, R = 10, T = 26, B = 34, pw = W - L - R, ph = H - T - B;
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  const S = SEC.stations, z95 = 1.96;
  let top = -Infinity, bot = Infinity;
  for (const st of S) st[1].forEach(([v, s], k) => { top = Math.max(top, v + z95 * s, st[2][k]); bot = Math.min(bot, v - z95 * s, st[2][k]); });
  for (const h of SEC.holes) { top = Math.max(top, h.collar); bot = Math.min(bot, h.collar - h.logs[h.logs.length - 1][2]); }
  top += 1; bot -= 0.5;
  const x = t => r1(L + t / SEC.len * pw), y = z => r1(T + (top - z) / (top - bot) * ph);
  const line = (pts, cls) => svgEl('polyline', { class: cls, points: pts.map(p => p.join(',')).join(' ') });
  const poly = (pts, cls) => svgEl('polygon', { class: cls, points: pts.map(p => p.join(',')).join(' ') });
  const pid = `${svg.id}-hp`;
  const defs = svgEl('defs');
  const pat = svgEl('pattern', { id: pid, width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pat.appendChild(svgEl('rect', { class: 'st-hp-bg', width: 7, height: 7 }));
  pat.appendChild(svgEl('line', { class: 'st-hp-ln', x1: 0, y1: 0, x2: 0, y2: 7 }));
  defs.appendChild(pat);
  svg.appendChild(defs);
  for (let z = Math.ceil(bot / 5) * 5; z <= top; z += 5) {
    svg.appendChild(svgEl('line', { class: 'st-grid', x1: L, x2: W - R, y1: y(z), y2: y(z) }));
    const t = svgEl('text', { class: 'st-ax', x: L - 6, y: y(z) + 4, 'text-anchor': 'end' }); t.textContent = `${z} m`; svg.appendChild(t);
  }
  const est = k => S.map(st => [x(st[0]), y(st[1][k][0])]);
  const layers = svgEl('g', { class: 'st-layers' });
  for (let k = 0; k < 5; k++) {
    const upper = est(k), lower = k < 4 ? est(k + 1).reverse() : [[x(SEC.len), y(bot)], [x(0), y(bot)]];
    layers.appendChild(poly(upper.concat(lower), `st-u${k}`));
  }
  const bands = svgEl('g', { class: 'st-bands' });
  for (let k = 0; k < 5; k++) {
    const hi = S.map(st => [x(st[0]), y(st[1][k][0] + z95 * st[1][k][1])]);
    const lo = S.map(st => [x(st[0]), y(st[1][k][0] - z95 * st[1][k][1])]).reverse();
    bands.appendChild(poly(hi.concat(lo), 'st-band'));
    bands.appendChild(line(est(k), 'st-est'));
  }
  svg.append(layers, bands);
  const truth = svgEl('g', { class: 'st-truth' });
  if (opt.truth) for (let k = 0; k < 5; k++) truth.appendChild(line(S.map(st => [x(st[0]), y(st[2][k])]), 'st-true'));
  svg.appendChild(truth);
  const hatches = {};
  const hw = (x(S[1][0]) - x(S[0][0])) / 2;
  for (const lim of opt.limits || []) {
    const g = svgEl('g', { class: 'st-hatch' });
    let run = [];
    const flush = () => {
      if (!run.length) return;
      const pts = [];
      run.forEach(([xi, yi]) => { pts.push([r1(xi - hw), yi], [r1(xi + hw), yi]); });
      pts.push([r1(run[run.length - 1][0] + hw), y(bot)], [r1(run[0][0] - hw), y(bot)]);
      const p = poly(pts, 'st-hatch-area'); p.setAttribute('fill', `url(#${pid})`); g.appendChild(p);
      run = [];
    };
    S.forEach(st => {
      let a = 0;
      while (a < 5 && st[1][a][1] <= lim) a++;
      if (a < 5) run.push([x(st[0]), a ? y(st[1][a - 1][0]) : T]); else flush();
    });
    flush();
    hatches[lim] = g;
    svg.appendChild(g);
  }
  const curtain = opt.curtain ? svgEl('rect', { class: 'st-curtain', x: L, y: 0, width: pw + R, height: T + ph }) : null;
  if (curtain) svg.appendChild(curtain);
  svg.appendChild(svgEl('line', { class: 'st-axis', x1: L, x2: W - R, y1: T + ph, y2: T + ph }));
  for (let d = 0; d <= SEC.len; d += W < 600 ? 400 : 200) {
    const t = svgEl('text', { class: 'st-ax', x: x(d), y: T + ph + 16, 'text-anchor': d ? 'middle' : 'start' }); t.textContent = d ? `${d} m` : 'A'; svg.appendChild(t);
  }
  const tb = svgEl('text', { class: 'st-ax', x: W - R, y: T + ph + 16, 'text-anchor': 'end' }); tb.textContent = 'B'; svg.appendChild(tb);
  const holes = [];
  let lastX = -99, row = 0;
  for (const h of SEC.holes) {
    const g = svgEl('g', { class: 'st-hole' }), hx = x(h.t);
    h.logs.forEach(([u, a, b]) => g.appendChild(svgEl('rect', { class: `st-u${ST_UNITS.indexOf(u)} st-log`, x: r1(hx - 4), y: y(h.collar - a), width: 8, height: r1(y(h.collar - b) - y(h.collar - a)) })));
    row = hx - lastX < 44 ? 1 - row : 0;
    lastX = hx;
    const t = svgEl('text', { class: 'st-hid', x: hx, y: r1(Math.min(y(h.collar), T + 30) - 6 - row * 13), 'text-anchor': 'middle' }); t.textContent = h.id;
    g.appendChild(t);
    const tt = svgEl('title'); tt.textContent = `${h.id}, ${h.off} m off the line, collar ${h.collar} m`; g.appendChild(tt);
    svg.appendChild(g);
    holes.push(g);
  }
  return { holes, truth, curtain, hatches, pw };
}
const stOnResize = (el, fn) => {
  let w = el.clientWidth;
  new ResizeObserver(() => { if (Math.abs(el.clientWidth - w) > 8) { w = el.clientWidth; fn(); } }).observe(el);
};

/* 3. Krige: the holes drop in, then the bands sweep from A to B */
(() => {
  const el = $('#d-krige'), svg = $('#st-krige-svg'), seg = $$('[data-truth]', el);
  $('#st-krige-key').innerHTML = '<span class="key"><i class="sw st-key-band"></i>95% interval</span><span class="key"><i class="st-key-est"></i>Estimate</span><span class="key"><i class="st-key-true"></i>True contact</span><span class="key"><i class="sw st-key-log"></i>Hole, projected</span>';
  let truthOn = true, P = null, shown = true;
  const apply = () => {
    P.holes.forEach(g => g.classList.toggle('in', shown));
    P.curtain.style.transition = 'none';
    P.curtain.style.transform = shown ? `translateX(${P.pw + 20}px)` : 'none';
    P.truth.classList.toggle('in', shown && truthOn);
  };
  const build = () => { P = stSection(svg, { truth: true, curtain: true }); apply(); };
  build();
  stOnResize(svg.parentNode, build);
  const setTruth = on => { truthOn = on; seg.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.truth === 'on') === on))); P.truth.classList.toggle('in', shown && on); };
  seg.forEach(b => b.addEventListener('click', () => setTruth(b.dataset.truth === 'on')));
  demo(el, {
    reset() { shown = false; apply(); },
    final() { shown = true; apply(); },
    async play(me) {
      await wait(300, me);
      for (const g of P.holes) { g.classList.add('in'); await wait(170, me); }
      await wait(250, me);
      P.curtain.getBoundingClientRect();
      P.curtain.style.transition = '';
      P.curtain.style.transform = `translateX(${P.pw + 20}px)`;
      await wait(1900, me);
      shown = true;
      P.truth.classList.toggle('in', truthOn);
    }
  });
})();

/* Dot rows on a coverage axis; only the dots move, by transform */
function stDots(host, lo, hi, rows) {
  host.innerHTML = `<div class="st-axis-row"><span></span><div class="st-scale">${[lo, 95, hi].map(v => `<i style="left:${(v - lo) / (hi - lo) * 100}%">${v}%</i>`).join('')}</div><span></span></div>` +
    rows.map(r => `<div class="st-drow"><span class="st-dlab">${esc(r)}</span><div class="st-track"><b class="st-okband"></b><i class="st-target"></i><div class="st-pos"><i class="st-dot"></i></div></div><span class="st-dval"></span></div>`).join('');
  const track = $$('.st-track', host)[0];
  const at = v => clamp((v - lo) / (hi - lo), 0, 1) * 100;
  $$('.st-target', host).forEach(t => { t.style.left = `${at(95)}%`; });
  return {
    band(a, b) { $$('.st-okband', host).forEach(e => { e.style.left = `${at(a)}%`; e.style.width = `${at(b) - at(a)}%`; }); },
    set(vals, labels) {
      $$('.st-drow', host).forEach((row, i) => {
        $('.st-pos', row).style.transform = `translateX(${at(vals[i])}%)`;
        $('.st-dval', row).innerHTML = labels[i];
        row.classList.toggle('is-out', !!labels.out && labels.out[i]);
      });
    },
    track
  };
}

/* 4. Calibrate: the same bench with the factor fixed at 1, then measured */
(() => {
  const el = $('#d-cal'), seg = $$('[data-cal]', el), pre = $('#st-cal-pre');
  const CAL = { raw: [[98.2, 0.59], [93.7, 1.09]], fixed: [[95.3, 0.92], [94.0, 1.07]] };
  const dots = stDots($('#st-cal-dots'), 90, 100, ['Smooth contacts', 'Rough contacts']);
  dots.band(92, 98);
  stPre($('#st-cal-val'), stLines('out', `modelled as          holes   var. ×  variogram
ground elevation        40    0.25*  spherical, nugget 0.000, sill 9.709, range 1111 m
topsoil thickness       40    1.12   spherical, nugget 0.000, sill 0.088, range 281 m
clay thickness          40    0.89   spherical, nugget 0.000, sill 6.095, range 865 m
sand thickness          35    0.77   spherical, nugget 0.000, sill 1.277, range 316 m
gravel thickness        34    0.69   spherical, nugget 0.000, sill 1.022, range 590 m`));
  const show = mode => {
    seg.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cal === mode)));
    const d = CAL[mode];
    const lab = d.map(([c, m]) => `<b>${c.toFixed(1)}%</b> msse ${m.toFixed(2)}`);
    lab.out = d.map(([c]) => c > 98 || c < 92);
    dots.set(d.map(v => v[0]), lab);
    stPre(pre, [['cmd', 'strata query examples/site.csv 600 480'], ...(mode === 'raw' ? ST_Q.farRaw : ST_Q.far).split('\n').map(t => [stTone(t), t])]);
  };
  seg.forEach(b => b.addEventListener('click', () => show(b.dataset.cal)));
  demo(el, {
    reset() { show('raw'); },
    final() { show('fixed'); },
    async play(me) { show('raw'); await wait(1900, me); show('fixed'); await wait(900, me); }
  });
})();

/* 5. Refuse: the section hatched under each limit, and the real query at that limit */
(() => {
  const el = $('#d-refuse'), svg = $('#st-refuse-svg'), seg = $$('[data-lim]', el), pre = $('#st-ref-pre'), tally = $('#st-ref-tally');
  const LIMS = [1, 1.5, 2], TXT = { 1: ST_Q.far1, 1.5: ST_Q.far, 2: ST_Q.far2 };
  let P = null, lim = 1.5, on = true;
  const counts = l => ST_SURF.map((_, k) => SEC.stations.filter(st => st[1][k][1] > l).length);
  const apply = () => {
    seg.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lim === lim)));
    LIMS.forEach(l => P.hatches[l].classList.toggle('in', on && l === lim));
    P.holes.forEach(g => g.classList.add('in'));
    if (!on) { tally.textContent = ''; pre.replaceChildren(); return; }
    const c = counts(lim), parts = c.map((n, k) => (n ? `${ST_SURF[k]} at ${n}` : '')).filter(Boolean);
    tally.innerHTML = `At <b>--max-sigma ${lim}</b>, of 95 stations: ${parts.length ? `refused ${parts.join(', ')}` : 'nothing refused'}.`;
    stPre(pre, [['cmd', `strata query examples/site.csv 600 480${lim === 1.5 ? '' : ` --max-sigma ${lim}`}`], ...TXT[lim].split('\n').map(t => [stTone(t), t]), ['dim', `exit ${/REFUSED/.test(TXT[lim]) ? 1 : 0}`]]);
  };
  const build = () => { P = stSection(svg, { limits: LIMS }); apply(); };
  build();
  stOnResize(svg.parentNode, build);
  seg.forEach(b => b.addEventListener('click', () => { lim = +b.dataset.lim; on = true; apply(); }));
  demo(el, {
    reset() { on = false; lim = 1.5; apply(); },
    final() { on = true; apply(); },
    async play(me) {
      await wait(500, me);
      on = true;
      for (const l of [2, 1, 1.5]) { lim = l; apply(); await wait(1700, me); }
    }
  });
})();

/* 6. Answer: four runs and their exit codes */
(() => {
  const el = $('#d-answer'), host = $('#st-exits'), pre = $('#st-exit-pre');
  const RUNS = [
    ['Next to a hole', 0, 'strata query examples/site.csv 490 440', ST_Q.near.split('\n').map(t => ['out', t])],
    ['120 m out', 1, 'strata query examples/site.csv 600 480', ST_Q.far.split('\n').map(t => [stTone(t), t])],
    ['Same, as JSON', 1, 'strata query examples/site.csv 600 480 --json', [['out', ST_Q.json]]],
    ['Misspelt unit', 2, 'strata validate tests/data/typo.csv', [['err', ST_Q.typo]]]
  ];
  const NOTE = ['every surface answered', 'a partial answer', 'too_uncertain, with σ', 'bad input, line 4'];
  host.innerHTML = RUNS.map(([t, code], i) => `<button type="button" data-i="${i}" aria-pressed="false"><span>${esc(t)}</span><b class="st-code st-c${code}">${code}</b><small>${NOTE[i]}</small></button>`).join('');
  const btns = $$('button', host);
  const show = i => {
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    const [, code, cmd, out] = RUNS[i];
    pre.classList.toggle('st-wrap', i === 2);
    stPre(pre, [['cmd', cmd], ...out, ['cmd', 'echo $?'], [code ? 'err' : 'ok', String(code)]]);
  };
  btns.forEach(b => b.addEventListener('click', () => show(+b.dataset.i)));
  demo(el, {
    reset() { btns.forEach(b => b.setAttribute('aria-pressed', 'false')); pre.replaceChildren(); },
    final() { show(1); },
    async play(me) { for (let i = 0; i < RUNS.length; i++) { show(i); await wait(1500, me); } show(1); }
  });
})();

/* 7. Check: coverage of every surface, by cross-validation and against synthetic truth */
(() => {
  const el = $('#d-check'), seg = $$('[data-chk]', el), cmd = $('#st-chk-cmd');
  const CHK = {
    cv: ['strata cv examples/site.csv', [85, 99.5], [[97.5, 0, 0.95], [97.5, 0, 0.94], [100, 2.5, 0.8], [94.3, 22.9, 0.96], [97.1, 29.4, 0.98], [97.4, 10.1, 0.92]]],
    smooth: ['strata bench --sites 100', [92, 98], [[95.2, 0, 0.92], [94.9, 0, 0.94], [95.4, 7.2, 0.91], [95.5, 22.3, 0.92], [95.4, 31.6, 0.91], [95.3, 12.2, 0.92]]],
    rough: ['strata bench --sites 100 --rough', [92, 98], [[94.2, 6.6, 1.05], [94.2, 7.3, 1.04], [93.7, 82.5, 1.08], [93.9, 92.5, 1.07], [93.8, 94.8, 1.08], [94.0, 56.8, 1.07]]]
  };
  const dots = stDots($('#st-chk-dots'), 84, 100, [...ST_SURF, 'all']);
  let mode = 'cv';
  const show = m => {
    mode = m;
    seg.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chk === m)));
    const [c, band, rows] = CHK[m];
    cmd.innerHTML = `<code>${esc(c)}</code> accepts ${band[0]} to ${band[1]}% with <code>--check</code>`;
    dots.band(band[0], band[1]);
    dots.set(rows.map(r => r[0]), rows.map(([v, ref, ms]) => `<b>${v.toFixed(1)}%</b> refused ${ref.toFixed(1)}% · msse ${ms.toFixed(2)}`));
  };
  seg.forEach(b => b.addEventListener('click', () => show(b.dataset.chk)));
  demo(el, {
    reset() { show('cv'); $$('.st-drow', el).forEach(r => r.classList.add('is-reset')); },
    final() { $$('.st-drow', el).forEach(r => r.classList.remove('is-reset')); show(mode); },
    async play(me) {
      const rows = $$('.st-drow', el);
      for (const r of rows) { r.classList.remove('is-reset'); await wait(140, me); }
      await wait(1500, me);
      show('smooth');
      await wait(1900, me);
      show('rough');
      await wait(1900, me);
    }
  });
})();
