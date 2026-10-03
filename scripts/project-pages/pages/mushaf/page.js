/* Bundled data: line boxes for pages 1, 2 and 50 from the reader's ayahinfo.json, its juz table, and the API check */
const MU = /*@@DATA:geometry@@*/;

/* Hero terminal: real captures from the live site, and the reader's hit test run offline */
PAGE.terminal = {
  scenes: {
    link: [
      ['cmd', `curl -s https://mushaf.geohashim.com/tabs/mushaf/page/1 | grep -oE '<title>[^|]*|og:image" content="[^"]*'`],
      ['out', '<title>الفاتحة - صفحة 1 '],
      ['out', 'og:image" content="https://android.quran.com/data/width_1260/page001.png'],
      ['out', ''],
      ['cmd', `curl -s https://mushaf.geohashim.com/tabs/mushaf/page/2 | grep -oE '<title>[^|]*|og:image" content="[^"]*'`],
      ['out', '<title>البقرة - صفحة 2 '],
      ['out', 'og:image" content="https://android.quran.com/data/width_1260/page002.png']
    ],
    render: [
      ['cmd', "curl -sI https://mushaf.geohashim.com/tabs/mushaf | grep -iE '^HTTP|x-render-mode'"],
      ['out', 'HTTP/2 200 '],
      ['ok', 'x-render-mode: prerendered'],
      ['out', ''],
      ['cmd', "curl -sI https://mushaf.geohashim.com/tabs/mushaf/page/2 | grep -iE '^HTTP|x-render-mode'"],
      ['out', 'HTTP/2 200 '],
      ['ok', 'x-render-mode: ssr']
    ],
    tap: [
      ['cmd', 'node hittest.mjs ayahinfo.json'],
      ['out', '{"tap":[200,95],"page_xy":[630,299.3],"nearest":"1:1","dist":0,"accepted":true}'],
      ['out', '{"tap":[190,111],"page_xy":[598.5,349.6],"nearest":"1:2","dist":15.4,"accepted":true}'],
      ['out', '{"tap":[150,116],"page_xy":[472.5,365.4],"nearest":"1:2","dist":0,"accepted":true}'],
      ['err', '{"tap":[30,30],"page_xy":[94.5,94.5],"nearest":"1:2","dist":350.9,"accepted":false}'],
      ['dim', '1:7 boxes -> [{"left":21.19,"top":33.37,"width":26.35,"height":4.27},{"left":28.81,"top":39.11,"width":42.54,"height":4.51},{"left":37.46,"top":44.5,"width":25.08,"height":3.83}]']
    ]
  },
  order: ['link', 'render', 'tap'],
  first: 'link'
};

const MU_NAT_W = 1260, MU_NAT_H = 2038;
const MU_fmt = v => String(+v.toFixed(1));
const MU_onResize = fn => { let t = 0; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fn, 150); }); };

/* 1. Find the page: the juz table on a 604-page ruler, and four ways in */
(() => {
  const el = $('#d-find'), box = $('#mu-ruler'), svg = $('#mu-ruler-svg'), count = $('#mu-juz-count');
  const ways = $$('#mu-ways li');
  const AT = { juz: 582, jump: 300, bad: 605, link: 2 };
  let ticks = [], pins = {};
  function build() {
    const W = Math.max(280, box.clientWidth), wide = W >= 620;
    const L = 10, R = 26, H = 110, bandY = 40, bandH = 14;
    const x = p => L + (p - 1) / 603 * (W - L - R);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.replaceChildren();
    svg.appendChild(svgEl('rect', { class: 'mu-band', x: L, y: bandY, width: W - L - R, height: bandH }));
    const cap = svgEl('text', { class: 'mu-r-cap', x: L, y: 10 }); cap.textContent = 'Juz starts';
    svg.appendChild(cap);
    ticks = MU.juz.map((p, i) => {
      const g = svgEl('g', { class: 'mu-tick' });
      g.appendChild(svgEl('line', { x1: x(p), x2: x(p), y1: bandY - 12, y2: bandY + bandH }));
      if (wide ? true : (i === 0 || (i + 1) % 10 === 0)) {
        const t = svgEl('text', { x: x(p), y: bandY - 16, 'text-anchor': 'middle' }); t.textContent = String(i + 1); g.appendChild(t);
      }
      svg.appendChild(g);
      return g;
    });
    for (const p of [1, 100, 200, 300, 400, 500, 604]) {
      const t = svgEl('text', { class: 'mu-r-page', x: x(p), y: H - 4, 'text-anchor': p === 1 ? 'start' : p === 604 ? 'end' : 'middle' });
      t.textContent = p === 1 ? 'page 1' : String(p);
      svg.appendChild(t);
    }
    pins = {};
    for (const [k, p] of Object.entries(AT)) {
      const bad = k === 'bad';
      const g = svgEl('g', { class: `mu-pin${bad ? ' is-no' : ''}` });
      const px = x(p);
      g.appendChild(svgEl('line', { x1: px, x2: px, y1: bad ? bandY - 12 : bandY - 2, y2: bandY + bandH + 12 }));
      g.appendChild(svgEl('circle', { cx: px, cy: bandY + bandH + 16, r: 4.5 }));
      // 605 sits past the last page, so its label goes in the right margin, clear of 582's.
      const t = bad ? svgEl('text', { x: px + 4, y: bandY - 16, 'text-anchor': 'start' })
        : svgEl('text', { x: px, y: bandY + bandH + 36, 'text-anchor': p > 560 ? 'end' : p < 40 ? 'start' : 'middle' });
      t.textContent = String(p);
      g.appendChild(t);
      svg.appendChild(g);
      pins[k] = g;
    }
  }
  const setTicks = n => { ticks.forEach((g, i) => g.classList.toggle('is-off', i >= n)); count.textContent = `${n} of 30 juz start pages match the bundled geometry`; };
  const setWays = n => ways.forEach((li, i) => { li.classList.toggle('is-off', i >= n); pins[li.dataset.k].classList.toggle('is-off', i >= n); });
  let state = { t: 30, w: ways.length };
  const render = () => { setTicks(state.t); setWays(state.w); };
  build();
  MU_onResize(() => { build(); render(); });
  demo(el, {
    reset() { state = { t: 0, w: 0 }; render(); },
    final() { state = { t: 30, w: ways.length }; render(); },
    async play(me) {
      await wait(400, me);
      for (let i = 1; i <= 30; i++) { state.t = i; render(); await wait(55, me); }
      await wait(500, me);
      for (let i = 1; i <= ways.length; i++) { state.w = i; render(); await wait(850, me); }
    }
  });
})();

/* 2. The signature: taps against the bundled line boxes, with the reader's own hit test */
(() => {
  const el = $('#d-tap'), sheet = $('#mu-sheet'), svg = $('#mu-tap-svg'), log = $('#mu-log'), hlBox = $('#mu-hl'), thisDd = $('#mu-this');
  // Copied from quran-page.page.ts onImageTapCoords: nearest box, accepted only within 50 page px.
  function hitTest(pageData, imgX, imgY) {
    let bestMatch = null;
    let bestDist = Infinity;
    for (const [sura, ayah, x1, y1, x2, y2] of pageData) {
      if (imgX >= x1 && imgX <= x2 && imgY >= y1 && imgY <= y2) {
        bestMatch = { sura, ayah };
        bestDist = 0;
        break;
      }
      const cx = Math.max(x1, Math.min(imgX, x2));
      const cy = Math.max(y1, Math.min(imgY, y2));
      const dist = Math.sqrt((imgX - cx) ** 2 + (imgY - cy) ** 2);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = { sura, ayah };
      }
    }
    return { bestMatch, bestDist, accepted: !(!bestMatch || bestDist > 50) };
  }
  // For drawing only: the point on the chosen ayah's boxes closest to the tap.
  function closestPoint(pageData, m, imgX, imgY) {
    let best = null;
    for (const [s, a, x1, y1, x2, y2] of pageData) {
      if (s !== m.sura || a !== m.ayah) continue;
      const cx = Math.max(x1, Math.min(imgX, x2)), cy = Math.max(y1, Math.min(imgY, y2));
      const d = Math.hypot(imgX - cx, imgY - cy);
      if (!best || d < best.d) best = { cx, cy, d };
    }
    return best;
  }
  // Copied from updateImageHighlights: every box of the ayah, as percentages of the image.
  function highlights(pageData, sura, ayah) {
    const imgW = MU_NAT_W, imgH = MU_NAT_H, out = [];
    for (const [s, a, x1, y1, x2, y2] of pageData) {
      if (s === sura && a === ayah) {
        out.push({ x1pct: (x1 / imgW) * 100, y1pct: (y1 / imgH) * 100, wpct: ((x2 - x1) / imgW) * 100, hpct: ((y2 - y1) / imgH) * 100 });
      }
    }
    return out;
  }
  // Illustrative taps, given on a page drawn 400 px wide, as in the offline run.
  const SCRIPT = [[200, 95], [190, 111], [150, 116], [30, 30], [190, 300]];
  let page = '1', taps = [], sel = null, shown = Infinity, k = 1, pw = 300;
  const keyOf = m => `${m.sura}:${m.ayah}`;
  function apply(imgX, imgY) {
    const data = MU.pages[page];
    const r = hitTest(data, imgX, imgY);
    let outcome;
    if (!r.accepted) outcome = 'ignored';
    else if (sel && sel === keyOf(r.bestMatch)) { sel = null; outcome = 'dismissed'; }
    else { sel = keyOf(r.bestMatch); outcome = 'selected'; }
    const near = r.bestMatch ? closestPoint(data, r.bestMatch, imgX, imgY) : null;
    taps.push({ imgX, imgY, r, near, outcome });
    if (taps.length > 6) taps.shift();
  }
  function layout() {
    pw = Math.min(sheet.clientWidth || 300, 330);
    k = pw / MU_NAT_W;
    const ph = pw * MU_NAT_H / MU_NAT_W;
    svg.setAttribute('viewBox', `0 0 ${r1(pw)} ${r1(ph)}`);
    svg.setAttribute('width', r1(pw));
    svg.setAttribute('height', r1(ph));
  }
  function draw() {
    const data = MU.pages[page];
    svg.replaceChildren();
    svg.appendChild(svgEl('rect', { class: 'mu-page', x: .5, y: .5, width: pw - 1, height: pw * MU_NAT_H / MU_NAT_W - 1 }));
    const order = [];
    data.forEach(([s, a]) => { const kk = `${s}:${a}`; if (!order.includes(kk)) order.push(kk); });
    data.forEach(([s, a, x1, y1, x2, y2], i) => {
      const kk = `${s}:${a}`;
      const g = svgEl('g', { class: `mu-box t${order.indexOf(kk) % 2}${kk === sel ? ' is-sel' : ''}${i >= shown ? ' is-off' : ''}` });
      g.appendChild(svgEl('rect', { x: r1(x1 * k), y: r1(y1 * k), width: r1((x2 - x1) * k), height: r1((y2 - y1) * k) }));
      if ((x2 - x1) * k >= 26) {
        const t = svgEl('text', { x: r1((x1 + x2) / 2 * k), y: r1((y1 + y2) / 2 * k + 3.5), 'text-anchor': 'middle' });
        t.textContent = kk;
        g.appendChild(t);
      }
      svg.appendChild(g);
    });
    taps.forEach((t, i) => {
      const last = i === taps.length - 1;
      const g = svgEl('g', { class: `mu-tapmark ${t.r.accepted ? 'is-ok' : 'is-no'}${last ? ' is-last' : ''}` });
      const tx = t.imgX * k, ty = t.imgY * k;
      g.appendChild(svgEl('circle', { class: 'mu-ring', cx: r1(tx), cy: r1(ty), r: r1(50 * k) }));
      if (t.near && t.near.d > 0) g.appendChild(svgEl('line', { x1: r1(tx), y1: r1(ty), x2: r1(t.near.cx * k), y2: r1(t.near.cy * k) }));
      g.appendChild(svgEl('circle', { class: 'mu-dot', cx: r1(tx), cy: r1(ty), r: 3.5 }));
      svg.appendChild(g);
    });
    const ayahs = order.length;
    thisDd.textContent = `${data.length} boxes, ${ayahs} ayahs`;
    log.innerHTML = taps.length ? taps.map(t => {
      const at = `(${MU_fmt(t.imgX)}, ${MU_fmt(t.imgY)})`;
      if (!t.r.accepted) return `<span class="err">${at} nearest ${keyOf(t.r.bestMatch)}, ${MU_fmt(t.r.bestDist)} px: over 50, ignored</span>`;
      const where = t.r.bestDist === 0 ? `inside ${keyOf(t.r.bestMatch)}` : `nearest ${keyOf(t.r.bestMatch)}, ${MU_fmt(t.r.bestDist)} px`;
      return `<span class="${t.outcome === 'selected' ? 'ok' : 'dim'}">${at} ${where}: ${t.outcome}</span>`;
    }).join('') : '<span class="dim">Page coordinates of each tap appear here.</span>';
    if (sel) {
      const [s, a] = sel.split(':').map(Number);
      const hs = highlights(data, s, a);
      hlBox.innerHTML = `<p><b>${sel}</b> lights ${hs.length} box${hs.length === 1 ? '' : 'es'}, placed as percentages of the image</p>` +
        `<table><thead><tr><th>Left</th><th>Top</th><th>Width</th><th>Height</th></tr></thead><tbody>` +
        hs.map(h => `<tr>${[h.x1pct, h.y1pct, h.wpct, h.hpct].map(v => `<td>${v.toFixed(2)}%</td>`).join('')}</tr>`).join('') + '</tbody></table>';
    } else {
      hlBox.innerHTML = '<p class="mu-none">No ayah selected.</p>';
    }
  }
  const setPage = p => {
    page = p; taps = []; sel = null; shown = Infinity;
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.page === p)));
    draw();
  };
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => setPage(b.dataset.page)));
  svg.addEventListener('click', e => {
    const rect = svg.getBoundingClientRect();
    // As in the reader: one scale factor from the rendered width, for both axes.
    const scaleX = MU_NAT_W / rect.width;
    apply((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleX);
    shown = Infinity;
    draw();
  });
  const scripted = n => {
    if (page !== '1') setPage('1');
    taps = []; sel = null;
    const scaleX = MU_NAT_W / 400;
    for (const [x, y] of SCRIPT.slice(0, n)) apply(x * scaleX, y * scaleX);
  };
  layout();
  setPage('1');
  MU_onResize(() => { layout(); draw(); });
  const api = demo(el, {
    reset() { setPage('1'); shown = 0; draw(); },
    final() { setPage('1'); scripted(SCRIPT.length); draw(); },
    async play(me) {
      await wait(300, me);
      const n = MU.pages['1'].length;
      for (let i = 1; i <= n; i++) { shown = i; draw(); await wait(90, me); }
      await wait(500, me);
      for (let i = 1; i <= SCRIPT.length; i++) { scripted(i); draw(); await wait(1300, me); }
    }
  });
  api.prepare = () => setPage('1');
})();

/* 3. Turn the page: the reader's six-segment curl, seen from the side */
(() => {
  const el = $('#d-turn'), box = $('#mu-book'), svg = $('#mu-book-svg');
  const angleOut = $('#mu-angle'), spreadOut = $('#mu-spread'), urlOut = $('#mu-url'), say = $('#mu-turn-say');
  const SEGMENT_COUNT = 6, FLIP_DURATION = 500;
  // Copied from quran-page.page.ts segAngle, with the flip angle passed in.
  function segAngle(segIndex, A) {
    const N = SEGMENT_COUNT;
    const curlWeight = 0.8 + 0.4 * segIndex / (N - 1);
    const curlAngle = A * curlWeight / N;
    const spineWeight = 0.505;
    const restWeight = (1 - spineWeight) / (N - 1);
    const finalAngle = A * (segIndex === 0 ? spineWeight : restWeight);
    const blendStart = 140;
    if (A <= blendStart) return curlAngle;
    const t = (A - blendStart) / (180 - blendStart);
    return curlAngle + (finalAngle - curlAngle) * t * t;
  }
  const easeInOut = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const durationFor = (from, to) => Math.max(200, FLIP_DURATION * (Math.abs(to - from) / 180));
  let W = 300, H = 210, sx = 150, sy = 160, L = 120;
  let right = 3, angle = 0, dir = 'forward', playing = false, ghosts = false, playTok = 0;
  let sheetPath = null, edgeLabel = null, refPath = null;
  function pathFor(A, d) {
    const segW = L / SEGMENT_COUNT;
    let x = sx, y = sy, th = 0;
    const pts = [[x, y]];
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      th += segAngle(i, A);
      const r = th * Math.PI / 180;
      x += (d === 'forward' ? -1 : 1) * segW * Math.cos(r);
      y -= segW * Math.sin(r);
      pts.push([x, y]);
    }
    return { d: 'M' + pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join('L'), end: pts[pts.length - 1] };
  }
  function build() {
    W = Math.max(280, box.clientWidth);
    L = Math.min(W / 2 - 22, 210);
    // A sheet never rises above about three quarters of its length, so that sets the height.
    H = Math.round(L * 0.78 + 92);
    sx = W / 2; sy = H - 56;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.replaceChildren();
    for (let i = 0; i < 4; i++) {
      svg.appendChild(svgEl('line', { class: 'mu-stack', x1: sx - L, x2: sx - 2, y1: sy + 2 + i * 3, y2: sy + 2 + i * 3 }));
      svg.appendChild(svgEl('line', { class: 'mu-stack', x1: sx + 2, x2: sx + L, y1: sy + 2 + i * 3, y2: sy + 2 + i * 3 }));
    }
    svg.appendChild(svgEl('line', { class: 'mu-spine', x1: sx, x2: sx, y1: sy - 4, y2: sy + 14 }));
    const lt = svgEl('text', { class: 'mu-side', x: sx - L / 2, y: sy + 34, 'text-anchor': 'middle' });
    const rt = svgEl('text', { class: 'mu-side', x: sx + L / 2, y: sy + 34, 'text-anchor': 'middle' });
    lt.id = 'mu-left-lab'; rt.id = 'mu-right-lab';
    svg.append(lt, rt);
    const g = svgEl('g', { class: 'mu-ghosts' });
    for (const A of [30, 100, 140, 170]) g.appendChild(svgEl('path', { d: pathFor(A, 'forward').d }));
    svg.appendChild(g);
    refPath = svgEl('path', { class: 'mu-ref' });
    svg.appendChild(refPath);
    const rl = svgEl('text', { class: 'mu-ref-lab' }); rl.id = 'mu-ref-lab'; rl.textContent = '60°';
    svg.appendChild(rl);
    sheetPath = svgEl('path', { class: 'mu-leaf' });
    svg.appendChild(sheetPath);
    edgeLabel = svgEl('text', { class: 'mu-edge', 'text-anchor': 'middle' });
    svg.appendChild(edgeLabel);
    render();
  }
  function render() {
    const fwd = dir === 'forward';
    const left = right + 1;
    $('#mu-left-lab', svg).textContent = `Page ${left}`;
    $('#mu-right-lab', svg).textContent = `Page ${right}`;
    $('.mu-ghosts', svg).style.display = ghosts ? '' : 'none';
    const ref = pathFor(60, dir);
    refPath.setAttribute('d', ref.d);
    const rl = $('#mu-ref-lab', svg);
    rl.setAttribute('x', r1(ref.end[0] + (fwd ? -6 : 6)));
    rl.setAttribute('y', r1(ref.end[1] - 6));
    rl.setAttribute('text-anchor', fwd ? 'end' : 'start');
    const p = pathFor(angle, dir);
    sheetPath.setAttribute('d', p.d);
    sheetPath.classList.toggle('is-past', angle >= 60);
    // The sheet shows its front until it passes vertical, then its back: the next page.
    const front = fwd ? left : right, back = fwd ? right + 2 : right - 1;
    edgeLabel.textContent = angle > 2 ? String(angle < 90 ? front : back) : '';
    edgeLabel.setAttribute('x', r1(p.end[0]));
    edgeLabel.setAttribute('y', r1(p.end[1] - 8));
    angleOut.textContent = `${Math.round(angle)}°`;
    spreadOut.textContent = `Right ${right}, left ${left}`;
    urlOut.innerHTML = `<code>/tabs/mushaf/page/${right}</code>`;
  }
  const setAngle = A => { angle = A; render(); };
  const complete = () => { right += dir === 'forward' ? 2 : -2; angle = 0; render(); };
  async function tween(from, to, ms, me, fn) {
    const steps = Math.max(1, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) { await wait(16, me); setAngle(from + (to - from) * fn(i / steps)); }
  }
  // Viewer drags use animation frames; the guided play uses wait() so it can be cancelled.
  let uTok = 0;
  function animate(to, done) {
    const tok = ++uTok, from = angle, ms = durationFor(from, to), t0 = performance.now();
    const step = now => {
      if (tok !== uTok) return;
      const p = Math.min((now - t0) / ms, 1);
      setAngle(from + (to - from) * easeInOut(p));
      if (p < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  }
  let drag = null;
  svg.addEventListener('pointerdown', e => {
    if (playing) return;
    uTok++;
    drag = { x: e.clientX, y: e.clientY, live: false };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.live) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
      const d = dx > 0 ? 'forward' : 'backward';
      const dest = right + (d === 'forward' ? 2 : -2);
      if (dest < 1 || dest > 603) { drag = null; return; }
      dir = d; drag.live = true; ghosts = false;
    }
    setAngle(Math.min(Math.abs(dx) / (W / 2), 1) * 180);
    say.textContent = angle >= 60 ? 'Past 60°: let go and the turn completes.' : 'Under 60°: let go and it springs back.';
  });
  const release = () => {
    if (!drag) return;
    const was = drag.live;
    drag = null;
    if (!was) return;
    if (angle >= 60) {
      const ms = Math.round(durationFor(angle, 180));
      animate(180, () => { complete(); say.textContent = `Completed in ${ms} ms. The address was replaced, not added to history.`; });
    } else {
      const ms = Math.round(durationFor(angle, 0));
      animate(0, () => { say.textContent = `Sprang back in ${ms} ms.`; });
    }
  };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);
  build();
  MU_onResize(build);
  const linear = t => t;
  demo(el, {
    reset() { uTok++; playing = false; right = 3; dir = 'forward'; ghosts = false; setAngle(0); say.textContent = 'Drag across the book to turn the page.'; },
    final() { uTok++; playing = false; right = 3; dir = 'forward'; ghosts = true; setAngle(60); say.textContent = 'Each grey line is the sheet at another angle. The yellow one, at 60°, is where a drag commits. Drag across the book to try it.'; },
    async play(me) {
      const mine = ++playTok;
      playing = true;
      try {
        await wait(500, me);
        say.textContent = 'A drag to 45°.';
        await tween(0, 45, 650, me, linear);
        await wait(450, me);
        say.textContent = `Released under 60°: it springs back in ${Math.round(durationFor(45, 0))} ms.`;
        await tween(45, 0, durationFor(45, 0), me, easeInOut);
        await wait(900, me);
        say.textContent = 'A drag to 80°.';
        await tween(0, 80, 750, me, linear);
        await wait(450, me);
        const ms = Math.round(durationFor(80, 180));
        await tween(80, 180, ms, me, easeInOut);
        complete();
        say.textContent = `Released past 60°: it completes in ${ms} ms. The address was replaced, not added to history.`;
        await wait(1500, me);
        say.textContent = 'The next-page button: the full half circle in 500 ms.';
        await tween(0, 180, FLIP_DURATION, me, easeInOut);
        complete();
        await wait(300, me);
        say.textContent = 'Drag across the book to turn it yourself.';
      } finally {
        if (mine === playTok) playing = false;
      }
    }
  });
})();

/* 4. The text cache: the live worker's rules applied to an illustrative reading session */
(() => {
  const el = $('#d-cache'), slotsEl = $('#mu-slots'), req = $('#mu-req'), say = $('#mu-cache-say');
  const MAX = 100;
  slotsEl.innerHTML = '<i></i>'.repeat(MAX);
  const cells = $$('i', slotsEl);
  // performance strategy: serve a cached reply and mark it recently used; on a miss, fetch,
  // and if the cache is full drop the least recently used entry first.
  function session() {
    const lru = [], slotOf = new Map(), ev = [];
    let free = 0;
    const visit = p => {
      const i = lru.indexOf(p);
      if (i >= 0) { lru.splice(i, 1); lru.unshift(p); ev.push({ p, hit: true, slot: slotOf.get(p) }); return; }
      let evicted = null, slot;
      if (lru.length >= MAX) { evicted = lru.pop(); slot = slotOf.get(evicted); slotOf.delete(evicted); } else slot = free++;
      lru.unshift(p);
      slotOf.set(p, slot);
      ev.push({ p, hit: false, slot, evicted });
    };
    for (let p = 1; p <= 110; p++) visit(p);
    visit(105);
    visit(4);
    return ev;
  }
  const EV = session();
  let tally;
  const zero = () => { tally = { req: 0, hit: 0, miss: 0, out: 0 }; };
  const showTally = () => $$('#mu-tally dd').forEach(dd => { dd.textContent = String(tally[dd.dataset.k]); });
  const showReq = e => {
    const url = `<span class="mu-req-url"><code>/v1/page/${e.p}/quran-uthmani</code></span>`;
    const res = e.hit ? '<span class="mu-req-res is-hit">Served from this browser, no network</span>'
      : `<span class="mu-req-res is-miss">Fetched from alquran.cloud${e.evicted ? `, page ${e.evicted} evicted` : ''}</span>`;
    req.innerHTML = url + res;
  };
  function applyEv(e, flash) {
    tally.req++;
    if (e.hit) tally.hit++; else tally.miss++;
    if (e.evicted) tally.out++;
    const c = cells[e.slot];
    c.textContent = String(e.p);
    c.classList.add('is-full');
    if (flash) {
      c.classList.remove('is-hit', 'is-new', 'is-out');
      c.getBoundingClientRect();
      c.classList.add(e.hit ? 'is-hit' : e.evicted ? 'is-out' : 'is-new');
    }
  }
  const clear = () => { zero(); cells.forEach(c => { c.textContent = ''; c.className = ''; }); showTally(); };
  demo(el, {
    reset() { clear(); req.innerHTML = '<span class="mu-req-url"><code>/v1/page/1/quran-uthmani</code></span><span class="mu-req-res"></span>'; say.textContent = 'Single-page view, with the service worker running: read pages 1 to 110 in order, go back to page 105, then back to page 4.'; },
    final() {
      clear();
      EV.forEach(e => applyEv(e, false));
      cells[EV[EV.length - 2].slot].classList.add('is-hit');
      cells[EV[EV.length - 1].slot].classList.add('is-out');
      showTally(); showReq(EV[EV.length - 1]);
      say.textContent = 'Page 105 was still among the 100 most recent, so it came from this browser. Page 4 had been evicted when page 104 arrived, so it went back to alquran.cloud and pushed out page 11.';
    },
    async play(me) {
      await wait(400, me);
      for (let i = 0; i < EV.length; i++) {
        const e = EV[i];
        applyEv(e, true); showTally(); showReq(e);
        if (e.p === 2 && !e.hit) say.textContent = 'Pages 1 and 2 leave two entries, as on the live site.';
        if (e.p === 3 && !e.hit) say.textContent = 'Every new page is a miss: fetched once, then kept.';
        if (e.p === 101) say.textContent = 'The cache is full. Each new page now pushes out the least recently used one.';
        if (i === EV.length - 2) say.textContent = 'Back to page 105: still cached, so no request leaves the browser.';
        if (i === EV.length - 1) say.textContent = 'Back to page 4: evicted when page 104 arrived, so it goes back to alquran.cloud and pushes out page 11.';
        const ms = i >= EV.length - 2 ? 2200 : e.p <= 3 ? 700 : e.p <= 100 ? 22 : 260;
        await wait(ms, me);
      }
    }
  });
})();

/* 5. The text reply: fields kept, and page boundaries against the bundled geometry */
(() => {
  const el = $('#d-text'), fieldsEl = $('#mu-fields'), agreeEl = $('#mu-agree'), fail = $('#mu-fail');
  const FIELDS = [['number', true], ['numberInSurah', true], ['juz', true], ['surah', true], ['text', true],
    ['page', false], ['manzil', false], ['ruku', false], ['hizbQuarter', false], ['sajda', false]];
  fieldsEl.innerHTML = FIELDS.map(([f, keep]) => `<li data-keep="${keep}"><code>${f}</code>${f === 'text' ? '<span>elided here</span>' : ''}</li>`).join('');
  agreeEl.innerHTML = MU.agree.map(([p, n]) =>
    `<div class="mu-ag"><span class="mu-ag-p">Page ${p}</span><span class="mu-ag-rows"><span class="mu-ag-row"><small>API</small>${'<i></i>'.repeat(n)}</span><span class="mu-ag-row"><small>Geometry</small>${'<i></i>'.repeat(n)}</span></span><b>${n} = ${n}</b></div>`).join('');
  const items = $$('li', fieldsEl), rows = $$('.mu-ag', agreeEl);
  const set = (f, judged, r, failOn) => {
    items.forEach((li, i) => { li.classList.toggle('is-off', i >= f); li.classList.toggle('is-judged', judged); });
    rows.forEach((row, i) => row.classList.toggle('is-off', i >= r));
    fail.classList.toggle('is-off', !failOn);
  };
  demo(el, {
    reset() { set(0, false, 0, false); },
    final() { set(items.length, true, rows.length, true); },
    async play(me) {
      await wait(400, me);
      for (let i = 1; i <= items.length; i++) { set(i, false, 0, false); await wait(110, me); }
      await wait(700, me);
      set(items.length, true, 0, false);
      await wait(1200, me);
      for (let i = 1; i <= rows.length; i++) { set(items.length, true, i, false); await wait(380, me); }
      await wait(600, me);
      set(items.length, true, rows.length, true);
    }
  });
})();

/* 6. Draw the printed page: page 1 opened at three widths, with 1:7 highlighted */
(() => {
  const el = $('#d-draw'), host = $('#mu-screens'), pct = $('#mu-pct');
  const P1 = MU.pages['1'], P2 = MU.pages['2'];
  const SEL = [1, 7];
  const SCREENS = [
    { w: 390, h: 844, name: '390 px phone', note: 'Single page. Zoom and two-page buttons hidden at 768 px and below.' },
    { w: 800, h: 1280, name: '800 px tablet', note: 'Single page. The zoom and two-page buttons show.' },
    { w: 1280, h: 800, name: '1280 px desktop', note: 'Opens in two-page view: page 1 on the right, page 2 on the left.' }
  ];
  const hlFor = data => data.filter(([s, a]) => s === SEL[0] && a === SEL[1]).map(([, , x1, y1, x2, y2]) => [x1 / MU_NAT_W, y1 / MU_NAT_H, (x2 - x1) / MU_NAT_W, (y2 - y1) / MU_NAT_H]);
  function pageG(x, y, w, h, data, withHl) {
    const g = svgEl('g');
    g.appendChild(svgEl('rect', { class: 'mu-pg', x: r1(x), y: r1(y), width: r1(w), height: r1(h) }));
    for (const [, , x1, y1, x2, y2] of data) {
      g.appendChild(svgEl('rect', { class: 'mu-pg-line', x: r1(x + x1 / MU_NAT_W * w), y: r1(y + y1 / MU_NAT_H * h), width: r1((x2 - x1) / MU_NAT_W * w), height: r1((y2 - y1) / MU_NAT_H * h) }));
    }
    if (withHl) for (const [l, t, ww, hh] of hlFor(data)) {
      g.appendChild(svgEl('rect', { class: 'mu-pg-hl', x: r1(x + l * w), y: r1(y + t * h), width: r1(ww * w), height: r1(hh * h) }));
    }
    return g;
  }
  function screen(s) {
    const spread = s.w >= 1024, small = s.w <= 768;
    const svg = svgEl('svg', { viewBox: `0 0 ${s.w} ${s.h}`, width: r1(250 * s.w / s.h), height: 250, role: 'img', 'aria-label': `${s.name}: ${s.note}` });
    svg.appendChild(svgEl('rect', { class: 'mu-scr-bg', x: 2, y: 2, width: s.w - 4, height: s.h - 4, rx: 18 }));
    const bar = 64, foot = 64;
    svg.appendChild(svgEl('rect', { class: 'mu-scr-bar', x: 2, y: 2, width: s.w - 4, height: bar }));
    svg.appendChild(svgEl('rect', { class: 'mu-scr-bar', x: 2, y: s.h - foot - 2, width: s.w - 4, height: foot }));
    // Toolbar in image view: back, jump, download on one side; image, then the desktop-only controls, then bookmark.
    const b = 30, gap = 12, y0 = 2 + (bar - b) / 2;
    [0, 1, 2].forEach(i => svg.appendChild(svgEl('rect', { class: 'mu-btn', x: 18 + i * (b + gap), y: y0, width: b, height: b, rx: 6 })));
    const end = small ? ['', ''] : ['', 'd', 'd', 'd', 'd', ''];
    end.forEach((kind, i) => svg.appendChild(svgEl('rect', { class: `mu-btn${kind ? ' is-desk' : ''}`, x: s.w - 18 - b - (end.length - 1 - i) * (b + gap), y: y0, width: b, height: b, rx: 6 })));
    const top = bar + 18, avail = s.h - bar - foot - 36, pad = 16;
    const n = spread ? 2 : 1;
    let ph = avail, pw = ph * MU_NAT_W / MU_NAT_H;
    if (pw * n > s.w - pad * 2) { pw = (s.w - pad * 2) / n; ph = pw * MU_NAT_H / MU_NAT_W; }
    const x0 = (s.w - pw * n) / 2, y = top + (avail - ph) / 2;
    if (spread) {
      for (let i = 1; i <= 3; i++) svg.appendChild(svgEl('line', { class: 'mu-edge-line', x1: r1(x0 - i * 5), x2: r1(x0 - i * 5), y1: r1(y + 5 + i * 2), y2: r1(y + ph - 5) }));
      svg.appendChild(pageG(x0, y, pw, ph, P2, false));
      svg.appendChild(pageG(x0 + pw, y, pw, ph, P1, true));
    } else {
      svg.appendChild(pageG(x0, y, pw, ph, P1, true));
    }
    return svg;
  }
  host.innerHTML = '';
  const frames = SCREENS.map(s => {
    const fig = document.createElement('div');
    fig.className = 'mu-scr';
    fig.appendChild(screen(s));
    const cap = document.createElement('p');
    cap.innerHTML = `<b>${s.name}</b>${s.note}`;
    fig.appendChild(cap);
    host.appendChild(fig);
    return fig;
  });
  const hs = hlFor(P1);
  pct.innerHTML = `<p><b>1:7</b> on page 1, three line boxes, the same percentages on every screen and at every zoom</p><table><thead><tr><th>Left</th><th>Top</th><th>Width</th><th>Height</th></tr></thead><tbody>` +
    hs.map(h => `<tr>${h.map(v => `<td>${(v * 100).toFixed(2)}%</td>`).join('')}</tr>`).join('') + '</tbody></table>';
  const set = (n, hl, table) => {
    frames.forEach((f, i) => f.classList.toggle('is-off', i >= n));
    host.classList.toggle('is-hl', hl);
    pct.classList.toggle('is-off', !table);
  };
  demo(el, {
    reset() { set(0, false, false); },
    final() { set(3, true, true); },
    async play(me) {
      await wait(400, me);
      for (let i = 1; i <= 3; i++) { set(i, false, false); await wait(800, me); }
      await wait(300, me);
      set(3, true, false);
      await wait(900, me);
      set(3, true, true);
    }
  });
})();
