// The landing's terrain map, drawn once in a browser by scripts/terrain/bake.mjs. Never shipped:
// the page loads the images this produces. Depends on src/app/pages/landing/runtime/terrain.js,
// which the bake inlines ahead of this file.
const SEA = .33, FT = 7000 / .44;
const feet = v => Math.max(0, (v - SEA) * FT);
function isochains(g, t) {
  const { nx, ny, W, vals } = g;
  const vBase = (ny + 1) * W;
  const pts = new Map();
  const segs = [];
  const pt = (id, x0, y0, a, x1, y1, b) => {
    if (!pts.has(id)) { const k = (t - a) / (b - a); pts.set(id, [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]); }
    return id;
  };
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const tl = vals[j * W + i], tr = vals[j * W + i + 1];
      const br = vals[(j + 1) * W + i + 1], bl = vals[(j + 1) * W + i];
      const c = (tl > t ? 8 : 0) | (tr > t ? 4 : 0) | (br > t ? 2 : 0) | (bl > t ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const x = i * CELL, y = j * CELL, X = x + CELL, Y = y + CELL;
      const T = () => pt(j * W + i, x, y, tl, X, y, tr);
      const R = () => pt(vBase + j * W + i + 1, X, y, tr, X, Y, br);
      const B = () => pt((j + 1) * W + i, x, Y, bl, X, Y, br);
      const L = () => pt(vBase + j * W + i, x, y, tl, x, Y, bl);
      const mid = (tl + tr + br + bl) / 4 > t;
      switch (c) {
        case 1: case 14: segs.push([L(), B()]); break;
        case 2: case 13: segs.push([B(), R()]); break;
        case 3: case 12: segs.push([L(), R()]); break;
        case 4: case 11: segs.push([T(), R()]); break;
        case 6: case 9: segs.push([T(), B()]); break;
        case 7: case 8: segs.push([T(), L()]); break;
        case 5: if (mid) segs.push([T(), L()], [B(), R()]); else segs.push([T(), R()], [L(), B()]); break;
        case 10: if (mid) segs.push([T(), R()], [L(), B()]); else segs.push([T(), L()], [B(), R()]); break;
      }
    }
  }
  const adj = new Map();
  segs.forEach((s, k) => s.forEach(id => { const l = adj.get(id); if (l) l.push(k); else adj.set(id, [k]); }));
  const used = new Uint8Array(segs.length);
  const extend = chain => {
    for (;;) {
      const end = chain[chain.length - 1];
      const next = (adj.get(end) || []).find(k => !used[k]);
      if (next === undefined) return;
      used[next] = 1;
      const s = segs[next];
      chain.push(s[0] === end ? s[1] : s[0]);
    }
  };
  const chains = [];
  for (let k = 0; k < segs.length; k++) {
    if (used[k]) continue;
    used[k] = 1;
    const chain = [segs[k][0], segs[k][1]];
    extend(chain);
    chain.reverse();
    extend(chain);
    const closed = chain.length > 3 && chain[0] === chain[chain.length - 1];
    if (closed) chain.pop();
    if (chain.length < 5) continue;
    chains.push({ p: chain.map(id => pts.get(id)), closed });
  }
  return chains;
}
function chainD(chains) {
  const m = (a, b) => `${r1((a[0] + b[0]) / 2)} ${r1((a[1] + b[1]) / 2)}`;
  const s = a => `${r1(a[0])} ${r1(a[1])}`;
  let d = '';
  for (const { p, closed } of chains) {
    const n = p.length;
    if (closed) {
      d += `M${m(p[0], p[1])}`;
      for (let i = 1; i <= n; i++) d += `Q${s(p[i % n])} ${m(p[i % n], p[(i + 1) % n])}`;
      d += 'Z';
    } else {
      d += `M${s(p[0])}`;
      for (let i = 1; i < n - 1; i++) d += `Q${s(p[i])} ${m(p[i], p[i + 1])}`;
      d += `L${s(p[n - 1])}`;
    }
  }
  return d;
}
// Shaded relief, light from the north-west, sampled finer than the contours and with a little ridge
// texture added. Shadows and highlights are separate images so each theme can weigh them differently.
const RES = 4;
function reliefURLs(w) {
  const field = makeField(11, 3);
  const nx = Math.ceil(w / RES), ny = PERIOD / RES, W = nx + 1;
  const h = new Float32Array(W * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < W; i++) {
    const x = i * RES, y = j * RES;
    h[j * W + i] = field(x, y) + .035 * (fbm(x, y, 24, 71) - .5);
  }
  const at = (i, j) => h[(((j % ny) + ny) % ny) * W + Math.max(0, Math.min(nx, i))];
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = ny; const x = c.getContext('2d'); return { c, x, img: x.createImageData(W, ny) }; };
  const sh = mk(), hi = mk();
  const Z = 1100;
  let lx = -.62, ly = -.62, lz = .48;
  const ll = Math.hypot(lx, ly, lz);
  lx /= ll; ly /= ll; lz /= ll;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < W; i++) {
      const dx = (at(i + 1, j) - at(i - 1, j)) / (2 * RES) * Z;
      const dy = (at(i, j + 1) - at(i, j - 1)) / (2 * RES) * Z;
      const s = (-dx * lx - dy * ly + lz) / Math.hypot(dx, dy, 1) - lz;
      const o = (j * W + i) * 4;
      if (at(i, j) < SEA) continue;
      if (s < 0) sh.img.data[o + 3] = Math.min(255, -s * 330);
      else { hi.img.data[o] = hi.img.data[o + 1] = hi.img.data[o + 2] = 255; hi.img.data[o + 3] = Math.min(255, s * 330); }
    }
  }
  sh.x.putImageData(sh.img, 0, 0);
  hi.x.putImageData(hi.img, 0, 0);
  return { sh: sh.c.toDataURL(), hi: hi.c.toDataURL(), w: W * RES, h: ny * RES };
}
// Rivers follow the steepest way down from high ground and are kept only if they reach a lake or another river.
function riverD(g, seed) {
  const { nx, ny, W, vals } = g;
  const wrap = j => ((j % ny) + ny) % ny;
  const at = (i, j) => vals[wrap(j) * W + i];
  const taken = new Uint8Array(W * ny);
  const rnd = mulberry(seed);
  const paths = [];
  for (let tries = 0; paths.length < 14 && tries < 900; tries++) {
    const i0 = 3 + Math.floor(rnd() * (nx - 6)), j0 = Math.floor(rnd() * ny);
    const v0 = at(i0, j0);
    if (v0 < .55 || v0 > .72 || taken[wrap(j0) * W + i0]) continue;
    let ci = i0, cj = j0, ok = false;
    const path = [[ci, cj]];
    for (let step = 0; step < 600; step++) {
      let bi = -1, bj = 0, best = 0;
      const here = at(ci, cj);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di;
        if (ni < 0 || ni > nx) continue;
        const drop = (here - at(ni, cj + dj)) / (di && dj ? Math.SQRT2 : 1);
        if (drop > best) { best = drop; bi = ni; bj = cj + dj; }
      }
      if (bi < 0) break;
      ci = bi; cj = bj;
      path.push([ci, cj]);
      if (at(ci, cj) < SEA || taken[wrap(cj) * W + ci]) { ok = true; break; }
    }
    if (!ok || path.length < 10) continue;
    path.forEach(([i, j]) => { taken[wrap(j) * W + i] = 1; });
    paths.push(path);
  }
  // Split each river where it crosses a tile edge, so stacked copies of the tile join up.
  const chains = [];
  for (const path of paths) {
    let k = Math.floor(path[0][1] / ny), cur = [];
    for (let n = 0; n < path.length; n++) {
      const [i, j] = path[n];
      const kk = Math.floor(j / ny);
      if (kk !== k && cur.length) {
        cur.push([i * CELL, (j - k * ny) * CELL]);
        if (cur.length > 2) chains.push({ p: cur, closed: false });
        const [pi, pj] = path[n - 1];
        cur = [[pi * CELL, (pj - kk * ny) * CELL]];
        k = kk;
      }
      cur.push([i * CELL, (j - k * ny) * CELL]);
    }
    if (cur.length > 2) chains.push({ p: cur, closed: false });
  }
  // Chaikin smoothing, then a gentle meander across the direction of flow.
  let d = '';
  chains.forEach(({ p }, n) => {
    let q = p;
    for (let it = 0; it < 3; it++) {
      const r = [q[0]];
      for (let k = 0; k < q.length - 1; k++) {
        const [a, b] = [q[k], q[k + 1]];
        r.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
      }
      r.push(q[q.length - 1]);
      q = r;
    }
    let len = 0;
    const phase = n * 1.7;
    const pts = q.map((c, k) => {
      if (k) len += Math.hypot(c[0] - q[k - 1][0], c[1] - q[k - 1][1]);
      const a = q[Math.max(0, k - 1)], b = q[Math.min(q.length - 1, k + 1)];
      const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const off = 4.5 * Math.sin(len / 26 + phase) * Math.min(1, len / 40);
      return [c[0] - (b[1] - a[1]) / tl * off, c[1] + (b[0] - a[0]) / tl * off];
    });
    d += 'M' + pts.map(c => `${r1(c[0])} ${r1(c[1])}`).join('L');
  });
  return d;
}
function peaks(g) {
  const { nx, ny, W, vals } = g;
  const found = [];
  for (let j = 3; j < ny - 3; j++) {
    for (let i = 3; i < nx - 3; i++) {
      const v = vals[j * W + i];
      if (v < .6) continue;
      let top = true;
      for (let dj = -3; dj <= 3 && top; dj++) for (let di = -3; di <= 3; di++) {
        if ((di || dj) && vals[(j + dj) * W + i + di] > v) { top = false; break; }
      }
      if (top) found.push({ x: i * CELL, y: j * CELL, v });
    }
  }
  found.sort((a, b) => b.v - a.v);
  const kept = [];
  for (const p of found) if (kept.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 130)) kept.push(p);
  return kept;
}
let terrainCache = null;
function terrainField(w) {
  if (!terrainCache || terrainCache.w !== w) terrainCache = { w, g: sample(makeField(11, 3), w) };
  return terrainCache.g;
}
function terrainFar(w) {
  const g = terrainField(w);
  // Band edges sit on round altitudes so the elevation key can name them.
  const bands = [1500, 2500, 4000, 5000, 6000].map((ft, n) => [SEA + ft / FT, n + 1]);
  let out = bands.map(([t, n]) => `<path class="c-hyp${n}" d="${fillArea(g, t, true)}"/>`).join('');
  const rel = reliefURLs(w);
  out += `<image class="c-relief-sh" href="${rel.sh}" x="0" y="0" width="${rel.w}" height="${rel.h}" preserveAspectRatio="none"/>`;
  out += `<image class="c-relief-hi" href="${rel.hi}" x="0" y="0" width="${rel.w}" height="${rel.h}" preserveAspectRatio="none"/>`;
  out += `<path class="c-lake" d="${fillArea(g, SEA, false)}"/><path class="c-shore" d="${isolines(g, SEA)}"/>`;
  let inter = '', index = '';
  const labels = [], taken = [];
  for (let ft = 500; ft <= 7000; ft += 500) {
    const chains = isochains(g, SEA + ft / FT);
    if (ft % 2000) { inter += chainD(chains); continue; }
    index += chainD(chains);
    for (const { p } of chains) {
      if (p.length < 40) continue;
      const a = p[Math.floor(p.length / 2) - 2], b = p[Math.floor(p.length / 2) + 2], c = p[Math.floor(p.length / 2)];
      if (c[1] < 40 || c[1] > PERIOD - 40 || taken.some(q => Math.hypot(q[0] - c[0], q[1] - c[1]) < 160)) continue;
      let ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      if (ang > 90) ang -= 180;
      if (ang < -90) ang += 180;
      taken.push(c);
      labels.push(`<text class="c-elev" text-anchor="middle" dy="3.5" transform="translate(${r1(c[0])} ${r1(c[1])}) rotate(${r1(ang)})">${ft}</text>`);
    }
  }
  out += `<path class="c-ctr" d="${inter}"/><path class="c-ctr c-ctr-i" d="${index}"/>`;
  out += `<path class="c-river" d="${riverD(g, 5)}"/>`;
  out += labels.join('');
  for (const p of peaks(g)) {
    if (taken.some(q => Math.hypot(q[0] - p.x, q[1] - p.y) < 60)) continue;
    out += `<circle class="c-peak" cx="${p.x}" cy="${p.y}" r="2.2"/><text class="c-spot" x="${p.x + 6}" y="${p.y + 4}">${Math.round(feet(p.v))}</text>`;
  }
  return out;
}
// Maximum elevation figures: the highest terrain in each graticule square plus 100 ft, rounded up,
// in thousands with the hundreds raised, as sectionals print them.
function mefTile(w) {
  const g = terrainField(w);
  const S = 256;
  let out = '';
  for (let y0 = 0; y0 < PERIOD; y0 += S) {
    for (let x0 = S / 2; x0 + S <= w; x0 += S) {
      let top = 0;
      for (let j = Math.floor(y0 / CELL); j < (y0 + S) / CELL; j++) for (let i = Math.floor(x0 / CELL); i < (x0 + S) / CELL; i++) top = Math.max(top, g.vals[j * g.W + i]);
      const ft = Math.ceil((feet(top) + 100) / 100) * 100;
      out += `<text class="c-mef" x="${x0 + S / 2}" y="${y0 + S / 2 + 12}" text-anchor="middle">${Math.floor(ft / 1000)}<tspan dy="-13" class="c-mef-h">${Math.floor(ft % 1000 / 100)}</tspan></text>`;
    }
  }
  return out;
}

// Bake entry point: renders every asset and leaves each one in the page as a data URL for bake.mjs.
const W = 2048, SCALE = 1.5;
const THEMES = {
  light: { paper: '#EEF3EC', water: '#4E8C95', grid: 'rgba(20,39,58,.16)', hyp: ['#E4EEDC', '#DAE7CE', '#E6E1C6', '#DED5B8', '#D5C7A5'], lake: '#CDE2E2', contour: '#8A6B47', sh: .32, hi: .3 },
  dark: { paper: '#0D1A24', water: '#3E8590', grid: 'rgba(231,238,241,.1)', hyp: ['#10212A', '#13282F', '#1B2C2B', '#242E28', '#2E3127'], lake: '#11303B', contour: '#C9A77A', sh: .55, hi: .1 }
};
const svgStyle = c => `<style>${c.hyp.map((h, i) => `.c-hyp${i + 1}{fill:${h}}`).join('')}
.c-relief-sh{opacity:${c.sh}}.c-relief-hi{opacity:${c.hi}}.c-lake{fill:${c.lake}}
.c-shore{fill:none;stroke:${c.water};stroke-width:1;opacity:.75}
.c-ctr{fill:none;stroke:${c.contour};stroke-width:.7;opacity:.32;stroke-linejoin:round}.c-ctr-i{stroke-width:1.3;opacity:.55}
.c-river{fill:none;stroke:${c.water};stroke-width:1.3;opacity:.85;stroke-linecap:round;stroke-linejoin:round}
.c-grid{fill:none;stroke:${c.grid};stroke-width:1}</style>`;
function emit(name, dataUrl) {
  const pre = document.createElement('pre');
  pre.dataset.name = name;
  pre.textContent = dataUrl;
  document.body.appendChild(pre);
}
async function svgToPng(svg) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas');
  c.width = Math.round(W * SCALE);
  c.height = Math.round(PERIOD * SCALE);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
async function bake() {
  const far = terrainFar(W);
  // Text stays live in the page, so it comes out of the image and is kept as positions.
  const labels = { elev: [], spot: [], mef: [] };
  far.replace(/<text class="c-elev" text-anchor="middle" dy="3.5" transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)">(\d+)<\/text>/g, (_, x, y, a, t) => { labels.elev.push([+x, +y, +a, t]); return ''; });
  far.replace(/<circle class="c-peak" cx="([-\d.]+)" cy="([-\d.]+)" r="2.2"\/><text class="c-spot" x="[-\d.]+" y="[-\d.]+">(\d+)<\/text>/g, (_, x, y, t) => { labels.spot.push([+x, +y, t]); return ''; });
  mefTile(W).replace(/<text class="c-mef" x="([-\d.]+)" y="([-\d.]+)" text-anchor="middle">(\d+)<tspan dy="-13" class="c-mef-h">(\d+)<\/tspan><\/text>/g, (_, x, y, a, b) => { labels.mef.push([+x, +y, a, b]); return ''; });
  const ground = far.replace(/<text[\s\S]*?<\/text>/g, '').replace(/<circle class="c-peak"[^>]*\/>/g, '');
  const grid = gridTile(W).replace(/<text[\s\S]*?<\/text>/g, '');
  for (const [name, c] of Object.entries(THEMES)) {
    emit(`ground-${name}.png`, await svgToPng(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${PERIOD}" viewBox="0 0 ${W} ${PERIOD}">${svgStyle(c)}<rect width="100%" height="100%" fill="${c.paper}"/>${ground}${grid}</svg>`));
  }
  emit('labels.json', JSON.stringify(labels));
  // Cumulus: a soft noise texture thresholded into blobs, with a dark copy for undersides and ground shadows.
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const PX = 6, cols = 320, rows = PERIOD / PX;
  const field = makeField(91, 6);
  const make = (w = cols) => { const c = document.createElement('canvas'); c.width = w; c.height = rows; return c; };
  const mask = make(), mctx = mask.getContext('2d'), img = mctx.createImageData(cols, rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const v = field(i * PX, j * PX), o = (j * cols + i) * 4, shade = 255 - Math.round(30 * smooth(.6, .78, v));
    img.data[o] = img.data[o + 1] = shade;
    img.data[o + 2] = Math.min(255, shade + 6);
    img.data[o + 3] = Math.round(smooth(.54, .7, v) * 240);
  }
  mctx.putImageData(img, 0, 0);
  const dark = make(), dctx = dark.getContext('2d');
  dctx.drawImage(mask, 0, 0);
  dctx.globalCompositeOperation = 'source-in';
  dctx.fillStyle = '#1b2733';
  dctx.fillRect(0, 0, cols, rows);
  // Drawn three rows high so blur wraps top to bottom, then beside its mirror image so it also repeats side to side.
  const tile = draw => { const c = make(), x = c.getContext('2d'); for (const dy of [-rows, 0, rows]) draw(x, dy); return c; };
  const mirrored = src => { const c = make(cols * 2), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.scale(-1, 1); x.drawImage(src, -cols * 2, 0); return c.toDataURL('image/png'); };
  emit('clouds.png', mirrored(tile((x, dy) => { x.filter = 'blur(1.5px)'; x.globalAlpha = .45; x.drawImage(dark, 1, dy + 2); x.filter = 'none'; x.globalAlpha = 1; x.drawImage(mask, 0, dy); })));
  emit('cloud-shadow.png', mirrored(tile((x, dy) => { x.filter = 'blur(3px)'; x.drawImage(dark, 0, dy); })));
}
bake().then(() => { document.body.dataset.done = '1'; }, e => { document.body.dataset.error = String(e && e.stack || e); });
