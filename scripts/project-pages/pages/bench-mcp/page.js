/* Every line below was captured from the real code: the demo's output and audit log, the repo's own test rig
   (a real MCP client, the real tools, simulated instruments on TCP) and bench-mcp check. */
const CAP = /*@@DATA:captures@@*/;
const D = CAP.demo;
const NS = 'http://www.w3.org/2000/svg';
const unError = (t, tool) => t.replace(`Error executing tool ${tool}: `, '');

/* Hero terminal: one run of bench-mcp demo, in three parts */
(() => {
  const at = text => D.findIndex(([, t]) => t.startsWith(text));
  const cut = at('▸ set_voltage(instrument="psu", channel=1, volts=3.3)');
  const stop = at('▸ emergency_stop()');
  PAGE.terminal = {
    scenes: {
      refused: [['cmd', 'bench-mcp demo'], ...D.slice(0, cut)],
      ramped: [['dim', '# the same run, continued'], ...D.slice(cut, stop)],
      stopped: [['dim', '# the same run, continued'], ...D.slice(stop)]
    },
    order: ['refused', 'ramped', 'stopped']
  };
})();

/* Tests per file, from pytest --collect-only -q (135 in all) */
PAGE.tests = [['test_adversarial.py', 39, 'var(--red)'], ['test_config.py', 33, 'var(--yellow)'], ['test_interlock.py', 24, 'var(--blue)'],
  ['test_sim.py', 17, 'var(--water)'], ['test_server.py', 11, 'var(--magenta)'], ['test_mutations.py', 6, 'var(--green)'],
  ['test_cli.py', 3, 'var(--ink-2)'], ['test_interlock_props.py', 2, 'var(--ink)']];

/* 1. The signed-off file: check's output, then six broken copies */
(() => {
  const el = $('#d-signoff'), out = $('#bm-check'), list = $('#bm-bad');
  out.innerHTML = CAP.check.map(t => `<span>${esc(t)}</span>`).join('');
  list.innerHTML = CAP.config.map(c => `<li class="bm-bad-row"><p class="bm-bad-edit">${esc(c.change)}</p>`
    + `<p class="bm-bad-out"><span>${esc(c.out)}</span><b>exit ${c.exit}</b></p></li>`).join('');
  const lines = $$('span', out), rows = $$('.bm-bad-row', list);
  const show = on => { lines.forEach(l => l.classList.toggle('in', on)); rows.forEach(r => r.classList.toggle('in', on)); };
  demo(el, {
    reset() { show(false); },
    final() { show(true); },
    async play(me) {
      await wait(300, me);
      for (const l of lines) { l.classList.add('in'); await wait(160, me); }
      await wait(500, me);
      for (const r of rows) { r.classList.add('in'); await wait(520, me); }
    }
  });
})();

/* 2. Hostile arguments: refused before the tool runs, nothing on the wire */
(() => {
  const el = $('#d-types'), list = $('#bm-adv'), sum = $('#bm-sum b');
  $('#bm-tools').innerHTML = CAP.tools.map(t => `<li><code>${esc(t)}</code></li>`).join('');
  const LABEL = { schema: 'Schema', unknown: 'No such tool', ok: 'Extra key ignored' };
  const CASES = CAP.adv.filter(c => c.kind !== 'interlock');
  const refused = CASES.filter(c => c.kind !== 'ok');
  list.innerHTML = CASES.map(c => {
    const wire = c.writes.length ? `${c.writes.length} change sent: <code>${esc(c.writes.join(', '))}</code>, the typed 1.2 V` : '0 changes sent';
    return `<li class="bm-adv-row" data-k="${c.kind}"><code class="bm-call">${esc(c.tool)} ${esc(c.args)}</code>`
      + `<span class="bm-badge">${LABEL[c.kind]}</span><span class="bm-msg">${esc(c.msg)}</span><span class="bm-wire-n">${wire}</span></li>`;
  }).join('');
  const rows = $$('.bm-adv-row', list);
  const total = refused.reduce((a, c) => a + c.writes.length, 0);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); sum.textContent = '0'; el.classList.remove('is-done'); },
    final() { rows.forEach(r => r.classList.add('in')); sum.textContent = String(total); el.classList.add('is-done'); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(480, me); }
      sum.textContent = String(total);
      el.classList.add('is-done');
    }
  });
})();

/* 3. The demo's calls placed on channel 1's voltage scale */
(() => {
  const el = $('#d-decide'), puck = $('#bm-puck'), log = $('#bm-dlog'), nEl = $('#bm-d-n'), callEl = $('#bm-d-call');
  const MAX = 7;
  const CALLS = [];
  D.forEach(([, t], i) => {
    if (!t.startsWith('▸ ') || /list_instruments|measure_|emergency_stop/.test(t)) return;
    if (i > D.findIndex(([, x]) => x.startsWith('▸ emergency_stop'))) return;
    const m = t.match(/volts=("?)([\d.]+)\1/);
    CALLS.push({ call: t.slice(2), reply: D[i + 1][1].trim(), v: m && !m[1] ? Number(m[2]) : null, text: !!(m && m[1]) });
  });
  const tone = r => (r.startsWith('✗') ? 'err' : 'ok');
  const line = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; log.appendChild(s); log.scrollTop = log.scrollHeight; };
  const place = (c, instant) => {
    if (instant) puck.style.transition = 'none';
    const on = c && c.v !== null;
    puck.style.setProperty('--x', on ? String(Math.min(c.v, MAX) / MAX) : '0');
    puck.dataset.t = c ? tone(c.reply) : '';
    puck.dataset.v = on ? (c.v > MAX ? `${c.v} V →` : `${c.v} V`) : '';
    puck.classList.toggle('is-on', on);
    if (instant) { puck.getBoundingClientRect(); puck.style.transition = ''; }
  };
  const show = i => { nEl.textContent = `Call ${i + 1} of ${CALLS.length}`; callEl.textContent = CALLS[i].call; };
  const logCall = c => { line('', `▸ ${c.call}`); line(tone(c.reply), `  ${c.reply}`); };
  demo(el, {
    reset() { log.replaceChildren(); show(0); place(null, true); },
    final() {
      log.replaceChildren(); CALLS.forEach(logCall);
      const last = CALLS.length - 1;
      show(last); place(CALLS[last], true);
    },
    async play(me) {
      await wait(350, me);
      for (let i = 0; i < CALLS.length; i++) {
        show(i);
        await wait(450, me);
        place(CALLS[i]);
        await wait(650, me);
        logCall(CALLS[i]);
        await wait(900, me);
      }
    }
  });
})();

/* Shared chart parts: voltage over time, drawn as separate steps that fade in */
const chart = (svg, { w, h, tMax, vMax, left = 56, right = 12, top = 18, bottom = 34, ticks }) => {
  const X = t => left + (t / tMax) * (w - left - right), Y = v => top + (1 - v / vMax) * (h - top - bottom);
  const g = (cls, parent = svg) => { const n = svgEl('g', cls ? { class: cls } : {}); parent.appendChild(n); return n; };
  const axis = g('bm-ax');
  for (let v = 0; v <= vMax; v += 1) {
    axis.appendChild(svgEl('line', { x1: left, x2: w - right, y1: Y(v), y2: Y(v), class: 'bm-grid' }));
    const t = svgEl('text', { x: left - 8, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = `${v} V`; axis.appendChild(t);
  }
  for (const ms of ticks) {
    const t = svgEl('text', { x: X(ms), y: h - 8, 'text-anchor': X(ms) > w - right - 40 ? 'end' : 'middle' }); t.textContent = `${ms} ms`; axis.appendChild(t);
  }
  const hline = (v, cls, label, below) => {
    const n = g(cls);
    n.appendChild(svgEl('line', { x1: left, x2: w - right, y1: Y(v), y2: Y(v) }));
    const t = svgEl('text', below ? { x: left + 6, y: Y(v) + 15 } : { x: w - right - 4, y: Y(v) - 5, 'text-anchor': 'end' });
    t.textContent = label; n.appendChild(t);
  };
  hline(6, 'bm-dmg', '6.0 V: board damaged');
  hline(5.5, 'bm-lim', '5.5 V: signed-off limit', true);
  return { X, Y, g };
};
const seg = (parent, d, cls) => { const p = svgEl('path', { d, class: cls }); parent.appendChild(p); return p; };

/* 4. The two ramps of the hero run, at their real times */
(() => {
  const el = $('#d-ramp'), svg = $('#bm-ramp'), log = $('#bm-wire');
  const R = CAP.ramps, END = R[1].at + R[1].end + 60;
  const { X, Y, g } = chart(svg, { w: 760, h: 280, tMax: END, vMax: 6.5, ticks: [0, 500, 1000, 1500] });
  const items = [];
  let v = 0, on = false, lastT = 0;
  const plot = g('bm-trace');
  R.forEach((r, k) => {
    r.steps.forEach(([ms, cmd, back]) => {
      const t = r.at + ms, node = g('bm-step', plot);
      if (on) seg(node, `M${X(lastT)} ${Y(v)}H${X(t)}`, 'bm-run');
      if (cmd.startsWith('VOLT')) {
        const nv = Number(cmd.split(' ')[1]);
        if (on) seg(node, `M${X(t)} ${Y(v)}V${Y(nv)}`, 'bm-run');
        v = nv;
      } else {
        on = true;
        const c = svgEl('circle', { cx: X(t), cy: Y(v), r: 4, class: 'bm-on' }); node.appendChild(c);
      }
      lastT = t;
      items.push({ node, t, k, text: `+${String(ms).padStart(3)} ms  > ${cmd.padEnd(14)} < ${back}` });
    });
    const hold = g('bm-step', plot);
    const until = k === 0 ? R[1].at : END - 20;
    seg(hold, `M${X(lastT)} ${Y(v)}H${X(until)}`, 'bm-run');
    items.push({ node: hold, t: r.at + r.end, k, text: null });
    lastT = until;
  });
  const head = r => `# ${r.reason}`;
  const line = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; log.appendChild(s); log.scrollTop = log.scrollHeight; };
  const fill = () => { log.replaceChildren(); R.forEach((r, k) => { line('dim', head(r)); items.filter(i => i.k === k && i.text).forEach(i => line('', i.text)); }); };
  demo(el, {
    reset() { items.forEach(i => i.node.classList.remove('in')); log.replaceChildren(); },
    final() { items.forEach(i => i.node.classList.add('in')); fill(); },
    async play(me) {
      const SLOW = 2.5;
      await wait(300, me);
      for (let k = 0; k < R.length; k++) {
        line('dim', head(R[k]));
        let prev = R[k].at;
        for (const i of items.filter(x => x.k === k)) {
          await wait(Math.max(60, (i.t - prev) * SLOW), me);
          prev = i.t;
          i.node.classList.add('in');
          if (i.text) line('', i.text);
        }
        if (k === 0) { line('dim', '# measure_dmm and measure_scope run here'); await wait(700, me); }
      }
    }
  });
})();

/* 5. A setpoint changed behind the server's back */
(() => {
  const el = $('#d-readback'), list = $('#bm-steps'), sync = $('#bm-sync');
  const B = CAP.behind;
  const ROWS = [['v', 'Voltage'], ['on', 'Output'], ['i', 'Current limit']];
  const fmt = s => ({ v: `${s.v} V`, on: s.on ? 'on' : 'off', i: s.i === null ? 'not set' : `${s.i} A` });
  const side = n => $(`[data-side="${n}"] dl`, sync);
  const set = (n, s, diff = []) => {
    const f = fmt(s);
    side(n).innerHTML = ROWS.map(([k, label]) => `<div${diff.includes(k) ? ' class="is-diff"' : ''}><dt>${label}</dt><dd>${f[k]}</dd></div>`).join('');
  };
  const up = { v: 2, on: true, i: 0.25 };
  const panel = B[3], after = B[5];
  const STATES = [
    () => { set('srv', up); set('psu', up); },
    () => { set('srv', up); set('psu', { ...up, v: panel.v_set, on: panel.on }, ['v']); },
    () => { const safe = { v: after.v_set, on: after.on, i: null }; set('srv', safe); set('psu', { ...safe, i: after.i_set }); }
  ];
  const call = s => `${s.tool}(${Object.entries(s.args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')})`;
  const STEPS = [
    { who: 'Agent', html: [B[0], B[1], B[2]].map(s => `<span class="bm-c">${esc(call(s))}</span><span class="ok">✓ ${esc(s.msg)}</span>`).join(''), state: 0 },
    { who: 'Front panel', html: `<span class="bm-c">${esc(panel.line)}</span>`, state: 1 },
    { who: 'Agent', html: `<span class="bm-c">${esc(call(B[4]))}</span><span class="dim">sent: ${esc(B[4].sent.join(' · '))}</span><span class="err">✗ ${esc(B[4].msg)}</span>`, state: 2 },
    { who: 'Agent', html: `<span class="bm-c">${esc(call(B[6]))}</span><span class="dim">sent: ${esc(B[6].sent.join(' · '))}</span><span class="err">✗ ${esc(B[6].msg)}</span>`, state: 2 }
  ];
  list.innerHTML = STEPS.map(s => `<li class="bm-ev" data-who="${s.who === 'Agent' ? 'agent' : 'panel'}"><p class="bm-who">${s.who}</p><pre>${s.html}</pre></li>`).join('');
  const evs = $$('.bm-ev', list);
  demo(el, {
    reset() { evs.forEach(e => e.classList.remove('in')); STATES[0](); },
    final() { evs.forEach(e => e.classList.add('in')); STATES[2](); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < STEPS.length; i++) {
        evs[i].classList.add('in');
        await wait(700, me);
        STATES[STEPS[i].state]();
        await wait(i === 1 ? 1500 : 1100, me);
      }
    }
  });
})();

/* 6. The emergency stop, 300 ms into a switch-on */
(() => {
  const el = $('#d-stop'), svg = $('#bm-stop'), log = $('#bm-slog');
  const E = CAP.estop.events, T_MAX = 1000;
  const { X, Y, g } = chart(svg, { w: 760, h: 240, tMax: T_MAX, vMax: 6.5, ticks: [0, 250, 500, 750, 1000] });
  const wires = E.filter(e => e[1] === 'wire');
  const stopAt = E.find(e => e[1] === 'estop')[0];
  const dec = E.find(e => e[1] === 'decision');
  const sent = wires.filter(e => e[2].startsWith('VOLT') && e[0] < stopAt).map(e => [e[0], Number(e[2].split(' ')[1])]);
  // The rest of the approved plan: 0.5 V steps, each after a 0.1 s wait (0.5 V at 5 V/s).
  const plan = g('bm-plan');
  let [pt, pv] = sent[sent.length - 1];
  for (let v = pv + 0.5; v <= 5 + 1e-9; v += 0.5) {
    const t = pt + 100;
    seg(plan, `M${X(pt)} ${Y(pv)}H${X(t)}V${Y(v)}`, 'bm-ghost');
    pt = t; pv = v;
  }
  seg(plan, `M${X(pt)} ${Y(pv)}H${X(T_MAX)}`, 'bm-ghost');
  const steps = [];
  let lv = 0, lt = 0;
  const trace = g('bm-trace');
  sent.forEach(([t, v], i) => {
    const node = g('bm-step', trace);
    if (i) seg(node, `M${X(lt)} ${Y(lv)}H${X(t)}V${Y(v)}`, 'bm-run');
    steps.push({ node, t });
    lt = t; lv = v;
  });
  const cut = g('bm-step bm-cut', trace);
  seg(cut, `M${X(lt)} ${Y(lv)}H${X(stopAt + 1)}`, 'bm-run');
  seg(cut, `M${X(stopAt + 1)} ${Y(lv)}V${Y(0)}H${X(T_MAX)}`, 'bm-off');
  cut.appendChild(svgEl('line', { x1: X(stopAt), x2: X(stopAt), y1: Y(6.5), y2: Y(0), class: 'bm-stopline' }));
  const lab = svgEl('text', { x: X(stopAt) + 6, y: Y(4.2), class: 'bm-stoplabel' }); lab.textContent = 'emergency_stop, 300 ms'; cut.appendChild(lab);
  steps.push({ node: cut, t: stopAt });

  const ms = t => `+${String(t).padStart(3)} ms  `;
  const LOG = [{ t: 0, l: ['dim', `# output_on: ${dec[2].reason}, ${dec[2].steps} steps approved`] }];
  const refusedAt = E.find(([, k, d]) => k === 'refused' && d.reason.includes('during'))[0];
  E.forEach(([t, kind, d]) => {
    if (t > refusedAt) return;
    if (kind === 'wire') LOG.push({ t, l: ['', `${ms(t)}> ${d}`] });
    else if (kind === 'call' && d.tool === 'emergency_stop') LOG.push({ t, l: ['dim', `${ms(t)}emergency_stop()`] });
    else if (kind === 'estop' && d.phase === 'latched') LOG.push({ t, l: ['err', `${ms(t)}latched`] });
    else if (kind === 'refused' && d.reason.includes('during')) LOG.push({ t, l: ['err', `${ms(t)}output_on ✗ ${d.reason}`] });
  });
  const tail = E[E.length - 1][0];
  CAP.estop.after.forEach(a => LOG.push({ t: tail, l: ['err', `then ${a.tool} ✗ ${a.text.replace('REFUSED: ', '')}`] }));
  LOG.push({ t: tail, l: ['ok', `then output_off ✓ ${CAP.estop.off.done}, the one change still allowed`] });
  const TIMELINE = [...steps.map(s => ({ t: s.t, node: s.node })), ...LOG].sort((a, b) => a.t - b.t);
  const line = ([cls, text]) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; log.appendChild(s); log.scrollTop = log.scrollHeight; };
  demo(el, {
    reset() { steps.forEach(s => s.node.classList.remove('in')); log.replaceChildren(); },
    final() { steps.forEach(s => s.node.classList.add('in')); log.replaceChildren(); LOG.forEach(x => line(x.l)); },
    async play(me) {
      let prev = 0;
      await wait(300, me);
      for (const x of TIMELINE) {
        await wait(x.t > prev ? (x.t - prev) * 4 : 140, me);
        prev = x.t;
        if (x.node) x.node.classList.add('in'); else line(x.l);
      }
    }
  });
})();

/* The board with and without bench-mcp, verbatim from the demo */
(() => {
  const okEl = $('#bm-vs-ok'), rawEl = $('#bm-vs-raw');
  const span = ([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`;
  const find = test => D.findIndex(([, t]) => test(t));
  const twelve = find(t => t.includes('volts=12)')), ramp = find(t => t.includes('ramped to 3.3 V'));
  okEl.innerHTML = [D[twelve], D[twelve + 1], D[ramp - 1], D[ramp], ['dim', '…'], D[find(t => t.startsWith('Simulated board after'))]].map(span).join('');
  rawEl.innerHTML = D.slice(find(t => t.startsWith('The same requests as raw SCPI'))).map(span).join('');
})();

/* Mutations of the interlock and the violation the property test found for each */
(() => {
  const list = $('#bm-muts');
  if (!list) return;
  list.innerHTML = CAP.mut.map(m => `<li><span>${esc(m.mutation)}</span><code>${esc(m.violation.replace(/^\[["']|["']\]$/g, ''))}</code></li>`).join('');
})();
