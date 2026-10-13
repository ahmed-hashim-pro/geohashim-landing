/* Every run, trace line and timeline below was captured from quorumlab 0.1.0 at commit 4e365b0.
   RUNS holds CLI output verbatim; TL holds the runs' own timeline records; READY is a hand-driven raft.Node session. */
const RUNS = /*@@DATA:runs@@*/;
const TL = /*@@DATA:timeline@@*/;
const READY = /*@@DATA:ready@@*/;

const qlTone = t => (/^VIOLATION|^first:|VIOLATION/.test(t) ? 'err' : /no violation|: 0 with a violation|clean/.test(t) ? 'ok' : 'out');
const qlMs = line => parseInt(line, 10);

/* Hero terminal */
(() => {
  const ev = r => [['cmd', r.cmd], ...r.out.map(t => [qlTone(t), t]), ['dim', `# exit ${r.exit}`]];
  PAGE.terminal = {
    scenes: {
      run: [['dim', '# one seed of the correct build'], ...ev(RUNS.run2)],
      hunt: [['dim', '# the correct build, then one deliberate bug'], ...ev(RUNS.hunt2000), ['out', ''], ...ev(RUNS.huntbug)],
      replay: [['dim', '# the failing seed, replayed'], ...ev(RUNS.run258bug)]
    },
    order: ['run', 'hunt', 'replay'],
    first: 'run'
  };
})();

/* Tests per package, from go test -count=1 -json ./... (32 tests plus 6 subtests) */
PAGE.tests = [['sim', 13, 'var(--magenta)'], ['raft', 10, 'var(--blue)'], ['linz', 6, 'var(--yellow)'], ['cmd/quorumlab', 6, 'var(--water)'], ['kv', 3, 'var(--green)']];

/* 1. Three nodes driven by hand: inputs in, Ready out */
(() => {
  const el = $('#d-node'), list = $('#ql-steps'), stateEl = $('#ql-nstate');
  const rows = READY.map(t => {
    let m;
    if ((m = t.match(/^node (\d)\s+(.*)$/))) return { k: m[2].startsWith('role ') ? 'state' : 'in', node: +m[1], text: m[2] };
    if ((m = t.match(/^\s+(persist|send|apply)\s+(.*)$/))) return { k: m[1], text: m[2] };
    return { k: 'state', text: t };
  });
  list.innerHTML = rows.map(r => `<li class="ql-step" data-k="${r.k}">${r.node ? `<b>node ${r.node}</b>` : `<i>${r.k}</i>`}<code>${esc(r.text)}</code></li>`).join('');
  stateEl.innerHTML = [1, 2, 3].map(n => `<li data-n="${n}"><b>node ${n}</b><span data-f="role"></span><span data-f="term"></span><span data-f="commit"></span></li>`).join('');
  const items = $$('.ql-step', list);
  const fresh = () => ({ 1: { role: 'follower', term: 0, commit: 0 }, 2: { role: 'follower', term: 0, commit: 0 }, 3: { role: 'follower', term: 0, commit: 0 } });
  let st = fresh(), cur = 0;
  const step = r => {
    if (r.node) cur = r.node;
    const s = st[cur];
    let m;
    if (r.k === 'in' && (m = r.text.match(/role (\w+)/))) s.role = m[1];
    if (r.k === 'state' && (m = r.text.match(/role (\w+), term (\d+), commit (\d+)/))) { s.role = m[1]; s.term = +m[2]; s.commit = +m[3]; }
    if (r.k === 'persist' && (m = r.text.match(/term (\d+)/))) s.term = +m[1];
    if (r.k === 'send' && /^RequestVote \d→/.test(r.text)) s.role = 'candidate';
    if (r.k === 'send' && /^AppendEntries \d→/.test(r.text)) s.role = 'leader';
    if (r.k === 'apply' && (m = r.text.match(/index (\d+)/))) s.commit = +m[1];
  };
  const paint = (flash) => {
    for (const n of [1, 2, 3]) {
      const li = $(`[data-n="${n}"]`, stateEl), s = st[n];
      li.dataset.role = s.role;
      $('[data-f="role"]', li).textContent = s.role;
      $('[data-f="term"]', li).textContent = `term ${s.term}`;
      $('[data-f="commit"]', li).textContent = `commit ${s.commit}`;
      li.classList.toggle('is-cur', flash && n === cur);
    }
  };
  demo(el, {
    reset() { st = fresh(); cur = 0; items.forEach(li => li.classList.remove('in')); list.classList.add('is-reset'); list.scrollTop = 0; paint(false); },
    final() { st = fresh(); rows.forEach(step); list.classList.remove('is-reset'); items.forEach(li => li.classList.add('in')); paint(false); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < rows.length; i++) {
        step(rows[i]);
        items[i].classList.add('in');
        paint(true);
        list.scrollTop = items[i].offsetTop + items[i].offsetHeight - list.clientHeight + 8;
        await wait(rows[i].k === 'in' ? 300 : 150, me);
      }
      paint(false);
    }
  });
})();

/* 2. Four partition shapes, connectivity computed from the trace labels with the rules in sim/sim.go */
(() => {
  const el = $('#d-faults'), box = $('#ql-shapes');
  const SHAPES = [
    ['547 ms', 'ring 4-2-5-1-3', 'Ring'],
    ['1165 ms', 'bridge: node 1 alone links {4,5} and {3,2}', 'Bridge'],
    ['2142 ms', 'node 4 isolated', 'Isolated'],
    ['9079 ms', 'split {2,3,5} | {1,4}', 'Clean split']
  ];
  const ids = [1, 2, 3, 4, 5];
  const set = s => s.split(',').map(Number);
  function linkRule(label) {
    let m;
    if ((m = label.match(/^node (\d) isolated/))) { const v = +m[1]; return { ok: (a, b) => a !== v && b !== v }; }
    if ((m = label.match(/^split \{([\d,]+)\} \| \{([\d,]+)\}/))) { const L = set(m[1]); return { ok: (a, b) => L.includes(a) === L.includes(b) }; }
    if ((m = label.match(/^bridge: node (\d) alone links \{([\d,]+)\} and \{([\d,]+)\}/))) {
      const br = +m[1], A = set(m[2]);
      return { bridge: br, ok: (a, b) => a === br || b === br || A.includes(a) === A.includes(b) };
    }
    const order = label.replace('ring ', '').split('-').map(Number);
    return { ok: (a, b) => { const d = (order.indexOf(a) - order.indexOf(b) + 5) % 5; return d <= 1 || d === 4; } };
  }
  const P = ids.map(i => { const a = -Math.PI / 2 + (i - 1) * 2 * Math.PI / 5; return [r1(60 + 44 * Math.cos(a)), r1(58 + 44 * Math.sin(a))]; });
  box.innerHTML = SHAPES.map(([at, label, name]) => {
    const rule = linkRule(label);
    const reach = ids.map(a => ids.filter(b => a === b || rule.ok(a, b)).length);
    let lines = '';
    for (const a of ids) for (const b of ids) if (a < b) {
      const [x1, y1] = P[a - 1], [x2, y2] = P[b - 1], ok = rule.ok(a, b);
      lines += `<line class="ql-l ql-l-on" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${ok ? '' : ' data-cut'}/>`;
      if (!ok) lines += `<line class="ql-l ql-l-cut" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    const nodes = ids.map(i => {
      const [x, y] = P[i - 1], minor = reach[i - 1] * 2 <= 5;
      return `<g class="ql-nd${minor ? ' is-minor' : ''}${rule.bridge === i ? ' is-bridge' : ''}"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y + 4.5}" text-anchor="middle">${i}</text></g>`;
    }).join('');
    const minors = ids.filter(i => reach[i - 1] * 2 <= 5);
    const verdict = minors.length ? `Cut off from a majority: node${minors.length > 1 ? 's' : ''} ${minors.join(' and ')}` : 'Every node still reaches a majority, itself included';
    return `<figure class="ql-shape"><p class="ql-shape-name">${name}<span>${at}</span></p><svg viewBox="0 0 120 116" role="img" aria-label="${esc(label)}">${lines}${nodes}</svg><code class="ql-shape-lbl">${esc(label)}</code><p class="ql-shape-v">${verdict}</p></figure>`;
  }).join('');
  const cards = $$('.ql-shape', box);
  demo(el, {
    reset() { cards.forEach(c => c.classList.remove('is-cut', 'is-done')); },
    final() { cards.forEach(c => c.classList.add('is-cut', 'is-done')); },
    async play(me) {
      await wait(350, me);
      for (const c of cards) {
        c.classList.add('is-cut');
        await wait(700, me);
        c.classList.add('is-done');
        await wait(500, me);
      }
    }
  });
})();

/* A run's timeline: one lane per node, built once; playing grows each segment with transform only */
function qlTimeline(host, data, { ticks, marks = [] }) {
  const span = data.to - data.from, pct = t => `${r1((t - data.from) / span * 1000) / 10}%`;
  const KIND = { 1: 'cand', 2: 'lead', 3: 'down' };
  const lanes = [1, 2, 3, 4, 5].map(n => `<div class="ql-lane"><span class="ql-ln">node ${n}</span><div class="ql-track" data-n="${n}"></div></div>`).join('');
  host.innerHTML = `<div class="ql-tl-in"><div class="ql-bands"></div>${lanes}<div class="ql-axis">${ticks.map(t => `<span style="left:${pct(t)}">${r1(t / 1000)} s</span>`).join('')}</div><div class="ql-head"><i></i></div></div>`;
  const bands = $('.ql-bands', host);
  bands.innerHTML = data.parts.map(([a, b, label, cut]) => `<i class="ql-band" style="left:${pct(a)};width:${pct(data.from + b - a)}" title="${esc(label)}">${cut.map(n => `<b style="top:${(n - 1) * 20}%"></b>`).join('')}</i>`).join('')
    + marks.map(([t, text, cls]) => `<span class="ql-mark ${cls}" style="left:${pct(t)}"><em>${esc(text)}</em></span>`).join('');
  const segs = data.segs.map(([n, a, b, k, term]) => {
    const s = document.createElement('i');
    s.className = `ql-seg ql-${KIND[k]}`;
    s.style.left = pct(a);
    s.style.width = pct(data.from + Math.max(b - a, span / 600));
    if (k === 2 && b - a > span / 14) s.textContent = `t${term}`;
    $(`.ql-track[data-n="${n}"]`, host).appendChild(s);
    return { s, a, b };
  });
  const head = $('.ql-head', host), parts = $$('.ql-band, .ql-mark', host);
  const partAt = data.parts.map(p => p[0]).concat(marks.map(m => m[0]));
  const setHead = (p, ms) => { head.style.transition = ms ? `transform ${ms}ms linear` : 'none'; head.style.transform = `translateX(${p * 100}%)`; };
  return {
    reset() {
      setHead(0, 0); head.classList.remove('is-on');
      segs.forEach(({ s }) => { s.style.transition = 'none'; s.classList.remove('in'); });
      parts.forEach(p => p.classList.remove('in'));
    },
    final() {
      setHead(1, 0); head.classList.remove('is-on');
      segs.forEach(({ s }) => { s.style.transition = 'none'; s.classList.add('in'); });
      parts.forEach(p => p.classList.add('in'));
    },
    // onTime(t) fires as simulated time passes each of `times`; the playhead itself is one CSS transition.
    async play(me, slow, times, onTime) {
      head.getBoundingClientRect();
      head.classList.add('is-on');
      setHead(1, span * slow);
      const evs = segs.map(g => [g.a, () => { g.s.style.transition = `transform ${Math.max(60, (g.b - g.a) * slow)}ms linear, opacity .2s`; g.s.classList.add('in'); }])
        .concat(partAt.map((t, i) => [t, () => parts[i].classList.add('in')]))
        .concat(times.map(t => [t, () => onTime(t)]))
        .sort((x, y) => x[0] - y[0]);
      let now = data.from;
      for (const [t, fn] of evs) {
        if (t > now) { await wait((t - now) * slow, me); now = t; }
        fn();
      }
      if (data.to > now) await wait((data.to - now) * slow, me);
      head.classList.remove('is-on');
    }
  };
}

/* A trace log that fills as simulated time passes */
const qlLog = (logEl, lines) => {
  const add = l => { const s = document.createElement('span'); s.className = /VIOLATION/.test(l) ? 'err' : /chaos ends/.test(l) ? 'ok' : ''; s.textContent = l; logEl.appendChild(s); logEl.scrollTop = logEl.scrollHeight; };
  return { clear: () => logEl.replaceChildren(), add, all: () => { logEl.replaceChildren(); lines.forEach(add); } };
};

/* 3. Seed 2 from start to finish */
(() => {
  const el = $('#d-run'), D = TL.seed2;
  const tl = qlTimeline($('#ql-run-tl'), D, { ticks: [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000], marks: [[D.chaos, 'chaos ends', 'is-heal']] });
  const log = qlLog($('#ql-run-log'), D.trace), stats = $('#ql-run-stats');
  const KEYS = [['Partitions', / partition: /, 9], ['Crashes', / crashes$/, 10], ['Leaders elected', / is leader of /, 13], ['Highest term', null, 27], ['Client ops done', null, 240]];
  stats.innerHTML = KEYS.map(([k]) => `<div><dt>${k}</dt><dd>0</dd></div>`).join('');
  const dds = $$('dd', stats);
  const show = c => c.forEach((v, i) => { dds[i].textContent = String(v); });
  const finalVals = KEYS.map(k => k[2]);
  demo(el, {
    reset() { tl.reset(); log.clear(); show([0, 0, 0, 0, 0]); },
    final() { tl.final(); log.all(); show(finalVals); },
    async play(me) {
      const c = [0, 0, 0, 0, 0];
      const byTime = new Map();
      D.trace.forEach(l => { const t = qlMs(l); if (!byTime.has(t)) byTime.set(t, []); byTime.get(t).push(l); });
      await wait(250, me);
      await tl.play(me, .5, [...byTime.keys()], t => {
        for (const l of byTime.get(t)) {
          log.add(l);
          KEYS.forEach(([, re], i) => { if (re && re.test(l)) c[i]++; });
          const m = l.match(/leader of term (\d+)/);
          if (m) c[3] = +m[1];
        }
        show(c);
      });
      show(finalVals);
    }
  });
})();

/* 4. The same seed with and without no-dedup: identical events, a different end-of-run verdict */
(() => {
  const el = $('#d-check'), twin = $('#ql-twin'), checks = $('#ql-checks');
  const A = RUNS.run2.out, B = RUNS.run2nodedup.out.slice(0, RUNS.run2nodedup.out.indexOf(''));
  const fill = (col, lines, other) => {
    $(`[data-col="${col}"] pre`, twin).innerHTML = lines.map((l, i) => {
      const same = i > 0 && l === other[i];
      return `<span class="${same ? 'is-same' : qlTone(l)}">${esc(l)}</span>`;
    }).join('');
  };
  fill('a', A, B); fill('b', B, A);
  const CHECKS = [
    ['Election safety', 'every event', 1, 1], ['Log matching', 'every event', 1, 1], ['Leader completeness', 'every event', 1, 1],
    ['State machine safety', 'every event', 1, 1], ['Monotonicity', 'every event', 1, 1], ['No panics', 'every event', 1, 1],
    ['Liveness', 'end of run', 1, 1], ['Linearizability', 'end of run', 1, 0]
  ];
  checks.innerHTML = '<li class="ql-ck ql-ck-h"><span>Property</span><span>Checked</span><span>Correct</span><span>no-dedup</span></li>'
    + CHECKS.map(([n, w, a, b]) => `<li class="ql-ck" data-end="${w === 'end of run' ? 1 : 0}"><span>${n}</span><span>${w}</span><b data-ok="${a}">${a ? 'held' : 'failed'}</b><b data-ok="${b}">${b ? 'held' : 'failed'}</b></li>`).join('');
  const lines = [0, 1].map(k => $$(`[data-col="${'ab'[k]}"] pre > span`, twin)), rows = $$('.ql-ck:not(.ql-ck-h)', checks);
  demo(el, {
    reset() { lines.flat().forEach(s => s.classList.remove('in')); rows.forEach(r => r.classList.remove('in')); twin.classList.add('is-reset'); checks.classList.add('is-reset'); },
    final() { twin.classList.remove('is-reset'); checks.classList.remove('is-reset'); lines.flat().forEach(s => s.classList.add('in')); rows.forEach(r => r.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < lines[0].length; i++) {
        lines[0][i].classList.add('in'); lines[1][i].classList.add('in');
        await wait(i === lines[0].length - 2 ? 900 : 480, me);
      }
      for (const r of rows) { r.classList.add('in'); await wait(r.dataset.end === '1' ? 520 : 200, me); }
    }
  });
})();

/* 5. The mutant table, then each bug's rate over 3,000 seeds */
(() => {
  const el = $('#d-mutants'), list = $('#ql-muts'), foot = $('#ql-mut-foot');
  const out = RUNS.mutants.out, desc = Object.fromEntries(RUNS.bugs.out.map(l => [l.slice(0, 24).trim(), l.slice(25)]));
  const rows = out.slice(1).filter(l => l.trim() && !/^\d/.test(l)).map(l => {
    const name = l.slice(0, 25).trim(), result = l.slice(25, 37).trim(), first = l.slice(37, 50).trim(), as = l.slice(50).trim();
    const h = RUNS.hunt3000[name], n = h ? +h.match(/: (\d+) with a violation/)[1] : 0;
    return { name, result, first, as, n };
  });
  list.innerHTML = rows.map(r => `<li class="ql-mut" data-r="${r.result}">
      <p class="ql-mut-name"><code>${esc(r.name)}</code><span class="ql-mut-badge">${esc(r.result)}</span></p>
      <p class="ql-mut-desc">${r.name === 'correct build' ? 'No switch on: the build every other row is measured against.' : esc(desc[r.name] || '')}</p>
      <p class="ql-mut-as">${r.first === '-' ? esc(r.as) : `first at seed <b>${esc(r.first)}</b>, as ${esc(r.as)}`}</p>
      ${r.name === 'correct build' ? '<span></span><span></span>' : `<span class="ql-mut-bar"><i style="--s:${Math.max(r.n / 3000, .004)}"></i></span><span class="ql-mut-n">${r.n.toLocaleString('en')} of 3,000</span>`}
    </li>`).join('');
  const items = $$('.ql-mut', list);
  demo(el, {
    reset() { items.forEach(li => li.classList.remove('in', 'is-done')); list.classList.add('is-reset'); foot.textContent = ''; },
    final() { list.classList.remove('is-reset'); items.forEach(li => li.classList.add('in', 'is-done')); foot.textContent = out[out.length - 1]; },
    async play(me) {
      await wait(300, me);
      for (const li of items) {
        li.classList.add('in');
        await wait(420, me);
        li.classList.add('is-done');
        await wait(520, me);
      }
      foot.textContent = out[out.length - 1];
    }
  });
})();

/* 6. Seed 258 with commit-previous-term: the last 1.8 s before the violation */
(() => {
  const el = $('#d-replay'), D = TL.fig8;
  const tl = qlTimeline($('#ql-fig-tl'), D, { ticks: [3000, 3500, 4000, 4500], marks: [[4823, 'violation, 4823 ms', 'is-bad']] });
  const log = qlLog($('#ql-fig-log'), D.trace), same = $('#ql-same');
  const times = [...new Set(D.trace.map(qlMs))];
  demo(el, {
    reset() { tl.reset(); log.clear(); same.classList.remove('in'); },
    final() { tl.final(); log.all(); same.classList.add('in'); },
    async play(me) {
      await wait(250, me);
      await tl.play(me, 3, times, t => D.trace.filter(l => qlMs(l) === t).forEach(log.add));
      await wait(500, me);
      same.classList.add('in');
    }
  });
})();
