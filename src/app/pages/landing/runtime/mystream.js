// Ported from docs/mockups/mockup-7-full-flight.html; logic unchanged.
import { $, $$, clamp, ease, mulberry } from './scope.js';

// colors is the landing runtime's live palette object; raf and observe come from its scope.
export function initMyStream({ colors, raf: requestAnimationFrame, observe }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const box = $('#my-stream');
  const flight = $('.ms-flight', box), cv = $('.ms-canvas', box), cx = cv.getContext('2d');
  const stages = $$('.ms-stage', box), ol = $('.ms-stages', box);
  const sel = $('#ms-model'), thr = $('#ms-thr');
  const texts = $$('.ms-text', box), voices = $$('input[name="ms-voice"]', box);
  const nums = ['in', 'scored', 'drafted', 'queued'].map(k => $(`#ms-n-${k}`));
  const summary = $('#ms-summary');
  const vertQ = matchMedia('(max-width: 999px)');
  const STAR = new Path2D('M0 -11L2.8 -2.8L11 0L2.8 2.8L0 11L-2.8 2.8L-11 0L-2.8 -2.8Z');
  const D = 1.05, P1 = .3, P3 = .6, PEEL = .75, DOCK = .35, T4 = 4 * D + P1 + P3;
  const smooth = t => t * t * (3 - 2 * t);
  const counts = [0, 0, 0, 0], drawn = [-1, -1, -1, -1];
  let G = null, items = [], simT = 0, last = 0, raf = 0, running = false, visible = true, runNo = 0, rej = 0;
  let eff = 70, shown = 70, typeAt = -1, typed = -1, off = 0;

  const P = (u, v) => (G.vert ? [G.c + v, u] : [u, G.c - v]);
  const vOf = s => clamp((s - 60) / 40, -1, 1) * G.B;
  // A model's offset shifts every score it gives, so a cheaper model scores the same item lower.
  const scoreOf = it => (it.sc != null ? it.sc : clamp(it.base + off, 0, 100));
  const uAt = s => { const i = Math.min(3, Math.floor(s)); return G.u[i] + (G.u[i + 1] - G.u[i]) * (s - i); };
  const sOf = a => (a < D ? a / D : a < D + P1 ? 1 : a < 3 * D + P1 ? 1 + (a - D - P1) / D : a < 3 * D + P1 + P3 ? 3 : Math.min(4, 3 + (a - 3 * D - P1 - P3) / D));
  const edge = v => Math.sqrt(Math.max(0, G.R * G.R - v * v));
  const slotXY = k => (G.vert ? [G.c - 25 + (k % 6) * 10, G.u[4] + 24 + Math.floor(k / 6) * 10] : [G.u[4] + 28 + (k % 8) * 10, G.c - 20 + Math.floor(k / 8) * 10]);
  // Held-back items file into a faint grid under the gate; the vertical layout has no room, so there they just fade.
  function rejXY(k) {
    const x0 = G.u[2] - G.R - 10, cols = clamp(Math.floor((x0 - G.u[1] - 20) / 10) + 1, 5, 10);
    return [x0 - (k % cols) * 10, G.c + 20 + Math.floor(k / cols) * 10];
  }
  function vAt(it, s) {
    const v = vOf(scoreOf(it));
    if (s <= 1) return it.jit;
    if (s < 1.5) return it.jit + (v - it.jit) * smooth((s - 1) / .5);
    const out = 2 + G.R / (G.u[3] - G.u[2]);
    if (s <= out) return v;
    return s < 3 ? v * (1 - smooth((s - out) / (3 - out))) : 0;
  }

  function layout() {
    const fr = flight.getBoundingClientRect();
    const w = Math.round(fr.width), h = Math.round(fr.height), dpr = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const vert = vertQ.matches;
    const pad = parseFloat(getComputedStyle(ol)[vert ? 'paddingLeft' : 'paddingTop']) || 0;
    const u = stages.map(li => {
      const n = li.firstElementChild.getBoundingClientRect();
      return vert ? n.top + n.height / 2 - fr.top : n.left + 13 - fr.left;
    });
    const c = vert ? pad / 2 - 2 : pad * .48;
    const R = vert ? Math.min(38, c - 10) : Math.min(68, Math.min(u[2] - u[1], u[3] - u[2]) * .36);
    const tail = stages[4].lastElementChild.getBoundingClientRect().bottom - fr.top;
    G = { w, h, dpr, vert, u, c, R, B: R - (vert ? 10 : 13), pad, tail };
    draw();
  }

  function line(a, b, c, d) { cx.beginPath(); cx.moveTo(a, b); cx.lineTo(c, d); cx.stroke(); }
  function label(t, x, y, col, align) {
    cx.textAlign = align;
    cx.lineWidth = 4;
    cx.strokeStyle = colors.panel;
    cx.strokeText(t, x, y);
    cx.fillStyle = col;
    cx.fillText(t, x, y);
  }
  function chord(score, col, width, dash) {
    const v = vOf(score), e = edge(v);
    const [ax, ay] = P(G.u[2] - e, v), [bx, by] = P(G.u[2] + e, v);
    cx.setLineDash(dash);
    cx.strokeStyle = col;
    cx.lineWidth = width;
    line(ax, ay, bx, by);
    cx.setLineDash([]);
    return [bx, by];
  }
  function draw() {
    if (!G) return;
    const C = colors, tau = Math.PI * 2;
    cx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    cx.clearRect(0, 0, G.w, G.h);
    cx.lineCap = 'round';
    const [x0, y0] = P(G.u[0], 0), [x4, y4] = P(G.u[4], 0), [sx, sy] = P(G.u[2], 0);
    cx.strokeStyle = C.ink;
    cx.globalAlpha = .55;
    cx.lineWidth = 2;
    line(x0, y0, x4, y4);
    cx.globalAlpha = .8;
    cx.lineWidth = 1;
    cx.setLineDash([1, 4]);
    G.u.forEach((u, i) => {
      const a = i === 2 ? G.R + 6 : 17;
      if (G.vert) { if (G.pad - 8 - (G.c + a) > 4) line(G.c + a, u, G.pad - 8, u); } else line(u, G.c + a, u, G.pad - 10);
    });
    cx.setLineDash([]);
    cx.globalAlpha = 1;
    cx.beginPath();
    cx.arc(sx, sy, G.R, 0, tau);
    cx.fillStyle = C['magenta-fill'];
    cx.fill();
    cx.lineWidth = 2.4;
    cx.strokeStyle = C.magenta;
    cx.stroke();
    const yours = +thr.value, showYours = Math.abs(shown - yours) > .5;
    const ye = showYours ? chord(yours, C.ink, 1.5, [4, 4]) : null;
    const ee = chord(shown, C.magenta, 3, []);
    [0, 1, 3].forEach(i => {
      const [x, y] = P(G.u[i], 0);
      cx.setTransform(G.dpr, 0, 0, G.dpr, G.dpr * x, G.dpr * y);
      cx.lineWidth = 3;
      cx.strokeStyle = C.panel;
      cx.stroke(STAR);
      cx.fillStyle = C.blue;
      cx.fill(STAR);
    });
    cx.setTransform(G.dpr, 0, 0, G.dpr, G.dpr * x4, G.dpr * y4);
    cx.strokeStyle = C.blue;
    cx.lineWidth = 2.6;
    cx.lineCap = 'butt';
    [[0, -11, 0, -15.5], [11, 0, 15.5, 0], [0, 11, 0, 15.5], [-11, 0, -15.5, 0]].forEach(l => line(...l));
    cx.beginPath();
    cx.arc(0, 0, 11, 0, tau);
    cx.fillStyle = C.blue;
    cx.fill();
    cx.rotate(35 * Math.PI / 180);
    cx.fillStyle = C.panel;
    cx.fillRect(-4.4, -7.5, 2.8, 15);
    cx.fillRect(1.6, -7.5, 2.8, 15);
    cx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);

    const r = G.vert ? 3.2 : 3.6;
    for (const it of [...items.filter(i => i.peel != null), ...items.filter(i => i.peel == null)]) {
      if (!it.seen) continue;
      let x, y, col, ghost = 0;
      if (it.peel != null) {
        const p = ease(clamp((simT - it.peel) / PEEL, 0, 1)), v = vOf(it.sc);
        if (G.vert && p >= 1) continue;
        const [hx, hy] = P(G.u[2] - edge(v), v), [tx, ty] = G.vert ? [hx - 8, hy - 10] : rejXY(it.rj);
        x = hx + (tx - hx) * p;
        y = hy + (ty - hy) * p;
        col = C.magenta;
        ghost = p;
      } else if (it.slot != null) {
        const p = ease(clamp((simT - it.dock) / DOCK, 0, 1)), q = slotXY(it.slot);
        x = x4 + (q[0] - x4) * p;
        y = y4 + (q[1] - y4) * p;
        col = C.pass;
      } else {
        const s = sOf(simT - it.t0);
        [x, y] = P(uAt(s), vAt(it, s));
        col = s < 1 ? C['ink-2'] : it.pass ? C.pass : C.blue;
      }
      cx.beginPath();
      cx.arc(x, y, r, 0, tau);
      cx.lineWidth = 2;
      cx.strokeStyle = C.panel;
      cx.stroke();
      cx.globalAlpha = 1 - ghost * (G.vert ? 1 : .85);
      cx.fillStyle = col;
      cx.fill();
      if (ghost) {
        cx.globalAlpha = G.vert ? .6 * (1 - ghost) : .45 + .4 * (1 - ghost);
        cx.lineWidth = 1.3;
        cx.strokeStyle = col;
        cx.stroke();
      }
      cx.globalAlpha = 1;
    }

    cx.font = '650 13px Archivo, system-ui, sans-serif';
    cx.textBaseline = 'middle';
    const effT = `Effective ${Math.round(shown)}`;
    if (G.vert) {
      label(effT, clamp(ee[0], 44, G.pad - 46), sy + G.R + 13, C.magenta, 'center');
      if (counts[3]) label('Queued for your review', G.pad, G.tail + 16, C.ink, 'left');
    } else {
      let a = ee[1], b = ye ? ye[1] : 0;
      if (ye && Math.abs(a - b) < 16) {
        const m = (a + b) / 2, s = a < b ? -8 : 8;
        a = m + s;
        b = m - s;
      }
      label(effT, sx + G.R + 8, a, C.magenta, 'left');
      if (ye) label(`Yours ${yours}`, sx + G.R + 8, b, C['ink-2'], 'left');
      if (counts[3]) label('Queued for your review', x4 + 24, G.c - 34, C.ink, 'left');
    }
  }

  function setTyped(n) {
    const p = texts.find(t => t.classList.contains('on'));
    texts.forEach(t => t.classList.toggle('typing', n >= 0 && t === p));
    if (n >= 0) $('.ms-typed', p).textContent = $('.ms-full', p).textContent.slice(0, n);
    typed = n;
  }
  function typeStep() {
    if (typeAt < 0 || typed < 0) return;
    const full = $('.ms-full', texts.find(t => t.classList.contains('on'))).textContent.length;
    const n = Math.floor((simT - typeAt) * 120);
    if (n >= full) setTyped(-1); else if (n !== typed) setTyped(n);
  }
  function step(it) {
    if (it.done) return;
    const a = simT - it.t0;
    if (a < 0) return;
    if (!it.seen) { it.seen = 1; counts[0]++; }
    if (it.peel != null) { if (simT - it.peel >= PEEL) it.done = 1; return; }
    const s = sOf(a);
    if (it.pass == null) {
      const v = vOf(scoreOf(it));
      if (s < 1 + (G.u[2] - edge(v) - G.u[1]) / (G.u[2] - G.u[1])) return;
      counts[1]++;
      it.sc = scoreOf(it);
      it.pass = it.sc >= eff;
      if (!it.pass) { it.peel = simT; it.rj = rej++; return; }
    }
    if (!it.dr && s >= 3) {
      it.dr = 1;
      counts[2]++;
      if (typeAt < 0) { typeAt = simT; setTyped(0); }
    }
    if (it.slot == null && a >= T4) { it.slot = counts[3]++; it.dock = simT; }
    if (it.slot != null && simT - it.dock >= DOCK) it.done = 1;
  }
  function writeCounts() {
    counts.forEach((v, i) => { if (v !== drawn[i]) { drawn[i] = v; nums[i].textContent = v; } });
  }
  function finish(instant) {
    if (instant) {
      let q = 0;
      rej = 0;
      items.forEach(it => {
        const sc = clamp(it.base + off, 0, 100);
        Object.assign(it, { seen: 1, done: 1, sc, pass: sc >= eff, peel: null, slot: null });
        if (it.pass) { it.slot = q++; it.dock = -1e9; } else { it.peel = -1e9; it.rj = rej++; }
      });
      counts.splice(0, 4, items.length, items.length, q, q);
      shown = eff;
      setTyped(-1);
    }
    running = false;
    writeCounts();
    draw();
    const model = sel.selectedOptions[0].textContent.replace(/ \(.*/, '');
    summary.textContent = `Simulated run finished: ${counts[0]} made-up items in, ${counts[1]} scored, ${counts[2]} drafted and ${counts[3]} queued for your review, at an effective threshold of ${eff} with ${model}, per-model adjustment ${$('#ms-adj').checked ? 'on' : 'off'}.`;
  }
  function frame(now) {
    raf = 0;
    if (!visible || !running) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    simT += dt;
    items.forEach(step);
    shown += (eff - shown) * Math.min(1, dt * 9);
    if (Math.abs(eff - shown) < .05) shown = eff;
    typeStep();
    writeCounts();
    if (typed < 0 && items.every(it => it.done)) { finish(false); return; }
    draw();
    raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && running) { last = 0; raf = requestAnimationFrame(frame); } };

  // Seeded per run number, so the first run after a page load is always the same made-up batch.
  function start() {
    const rnd = mulberry(17 + runNo * 101);
    runNo++;
    const n = 24 + Math.floor(rnd() * 17);
    items = Array.from({ length: n }, (_, i) => ({
      t0: i * 3.2 / n + rnd() * .06, base: Math.min(99, Math.round(20 + 40 * (rnd() + rnd()))), sc: null,
      jit: (rnd() - .5) * 6, seen: 0, done: 0, pass: null, peel: null, dr: 0, slot: null, dock: 0
    }));
    counts.fill(0);
    simT = rej = 0;
    typeAt = -1;
    setTyped(-1);
    summary.textContent = '';
    if (reduce.matches) { finish(true); return; }
    running = true;
    writeCounts();
    kick();
  }
  function sync() {
    const o = sel.selectedOptions[0], t = +thr.value, adj = $('#ms-adj').checked;
    off = +o.dataset.off;
    eff = adj ? clamp(Math.round(t + off), 20, 95) : t;
    $('#ms-thr-val').textContent = t;
    $('#ms-eff').textContent = eff;
    $('#ms-calc').textContent = adj ? `= clamp(${t} ${off < 0 ? '-' : '+'} ${Math.abs(off)}, 20, 95)` : `= ${t}`;
    $('#ms-rule').textContent = adj ? 'effective = clamp(threshold + model offset, 20, 95)' : 'effective = threshold (no per-model adjustment)';
    const own = !o.parentElement.label.includes('built in');
    const badge = $('#ms-badge');
    badge.textContent = own ? 'Your key' : 'Built in';
    badge.classList.toggle('is-own', own);
    if (!running) { shown = eff; draw(); }
  }
  $('#ms-adj').addEventListener('change', sync);
  function pickVoice() {
    const v = (voices.find(r => r.checked) || voices[0]).value, wasTyping = typed >= 0;
    texts.forEach(t => t.classList.toggle('on', t.dataset.voice === v));
    if (wasTyping) { typeAt = simT; setTyped(0); }
  }
  sel.addEventListener('change', sync);
  thr.addEventListener('input', sync);
  voices.forEach(r => r.addEventListener('change', pickVoice));
  $('#ms-go').addEventListener('click', start);
  if ('IntersectionObserver' in window) {
    observe(new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; kick(); })).observe(flight);
  }
  pickVoice();
  sync();
  return { layout, draw, reduce: () => { if (reduce.matches && running) finish(true); } };
}
