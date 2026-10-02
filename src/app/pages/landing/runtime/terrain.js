// Ported from docs/mockups/mockup-7-full-flight.html; logic unchanged.
import { r1 } from './scope.js';

export const PERIOD = 1536;
export const CELL = 12;
const hash = (x, y, s) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
// n lattice cells per PERIOD keeps every octave periodic in y, so tiles repeat seamlessly.
function vnoise(x, y, n, seed) {
  const gx = x * n / PERIOD, gy = y * n / PERIOD;
  const ix = Math.floor(gx), iy = Math.floor(gy);
  const u = fade(gx - ix), v = fade(gy - iy);
  const y0 = ((iy % n) + n) % n, y1 = (y0 + 1) % n;
  const a = hash(ix, y0, seed), b = hash(ix + 1, y0, seed);
  const c = hash(ix, y1, seed), d = hash(ix + 1, y1, seed);
  return a + (b - a) * u + (c - a + (a - b - c + d) * u) * v;
}
function fbm(x, y, n, seed) {
  let sum = 0, amp = 1, norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += amp * vnoise(x, y, n << o, seed + o * 17);
    norm += amp;
    amp *= .5;
  }
  return sum / norm;
}
function makeField(seed, n) {
  return (x, y) => {
    const wx = (fbm(x, y, 2, seed + 101) - .5) * 260;
    const wy = (fbm(x + 400, y, 2, seed + 211) - .5) * 260;
    return fbm(x + wx, y + wy, n, seed);
  };
}
function sample(fn, w, h = PERIOD) {
  const nx = Math.ceil(w / CELL), ny = Math.ceil(h / CELL), W = nx + 1;
  const vals = new Float32Array(W * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) vals[j * W + i] = fn(i * CELL, j * CELL);
  return { nx, ny, W, vals };
}
function isolines(g, t) {
  const { nx, ny, W, vals } = g;
  const vBase = (ny + 1) * W;
  const pts = new Map();
  const segs = [];
  const pt = (id, x0, y0, a, x1, y1, b) => {
    if (!pts.has(id)) {
      const k = (t - a) / (b - a);
      pts.set(id, [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]);
    }
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
  let d = '';
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
    const p = chain.map(id => pts.get(id));
    const m = (a, b) => `${r1((a[0] + b[0]) / 2)} ${r1((a[1] + b[1]) / 2)}`;
    const s = a => `${r1(a[0])} ${r1(a[1])}`;
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
function fillArea(g, t, above) {
  const { nx, ny, W, vals } = g;
  const ins = v => (above ? v > t : v < t);
  let d = '';
  for (let j = 0; j < ny; j++) {
    const y = j * CELL, Y = y + CELL;
    let run = -1;
    for (let i = 0; i <= nx; i++) {
      let tl, tr, br, bl, all = false;
      if (i < nx) {
        tl = vals[j * W + i]; tr = vals[j * W + i + 1];
        br = vals[(j + 1) * W + i + 1]; bl = vals[(j + 1) * W + i];
        all = ins(tl) && ins(tr) && ins(br) && ins(bl);
      }
      if (all) { if (run < 0) run = i; continue; }
      if (run >= 0) { d += `M${run * CELL} ${y}H${i * CELL}V${Y}H${run * CELL}Z`; run = -1; }
      if (i === nx || !(ins(tl) || ins(tr) || ins(br) || ins(bl))) continue;
      const x = i * CELL, X = x + CELL;
      const cs = [[x, y, tl], [X, y, tr], [X, Y, br], [x, Y, bl]];
      const poly = [];
      for (let k = 0; k < 4; k++) {
        const a = cs[k], b = cs[(k + 1) % 4];
        if (ins(a[2])) poly.push(`${a[0]} ${a[1]}`);
        if (ins(a[2]) !== ins(b[2])) {
          const r = (t - a[2]) / (b[2] - a[2]);
          poly.push(`${r1(a[0] + (b[0] - a[0]) * r)} ${r1(a[1] + (b[1] - a[1]) * r)}`);
        }
      }
      d += `M${poly.join('L')}Z`;
    }
  }
  return d;
}
const WORDS = ['Worn ridge', 'Dry basin', 'Low saddle', 'Long spur', 'High ground', 'Stony flats'];
function gridTile(w) {
  const S = 256, T = 32;
  let d = '';
  for (let x = S / 2; x < w; x += S) {
    d += `M${x} 0V${PERIOD}`;
    for (let y = T; y < PERIOD; y += T) { const l = y % 128 ? 4 : 9; d += `M${x - l} ${y}H${x + l}`; }
  }
  for (let y = 0; y < PERIOD; y += S) {
    d += `M0 ${y}H${w}`;
    for (let x = S / 2 % T; x < w; x += T) { const l = (x - S / 2) % 128 ? 4 : 9; d += `M${x} ${y - l}V${y + l}`; }
  }
  let words = '';
  let k = 0;
  for (let y = 120, row = 0; y < PERIOD; y += 300, row++) {
    const jy = Math.round(hash(row, 3, 9) * 90);
    words += `<text class="c-word" x="${w / 2 - 626}" y="${y + jy}" text-anchor="end">${WORDS[k++ % WORDS.length]}</text>`;
  }
  return `<path class="c-grid" d="${d}"/>${words}`;
}
export function layerTile(kind, w) {
  if (kind === 'grid') return gridTile(w);
  if (kind === 'far') {
    const g = sample(makeField(11, 3), w);
    return `<path class="c-tint" d="${fillArea(g, .56, true)}"/>` +
      `<path class="c-water" d="${fillArea(g, .33, false)}"/>` +
      `<path class="c-shore" d="${isolines(g, .33)}"/>` +
      `<path class="c-line c-far" d="${isolines(g, .56)}${isolines(g, .66)}"/>`;
  }
  if (kind === 'mid') {
    const g = sample(makeField(23, 4), w);
    return `<path class="c-line c-mid" d="${[.38, .45, .52, .59, .66].map(t => isolines(g, t)).join('')}"/>`;
  }
  const g = sample(makeField(37, 3), w);
  return `<path class="c-line c-near" d="${[.44, .6].map(t => isolines(g, t)).join('')}"/>`;
}
