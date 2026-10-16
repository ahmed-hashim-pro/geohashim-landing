/* Every report below is verbatim output of migrate-safe at commit 88abaec, run against
   PostgreSQL 17.11 in Docker. CAP holds whole runs (stdout in out, progress on stderr in err). */
const CAP = /*@@DATA:captures@@*/;

const toneOf = t => (/^ {2}(DANGER|RISK) /.test(t) ? 'err' : /^ {10}fix: /.test(t) ? 'ok' : /not analysed/.test(t) ? 'warn' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...(c.err || []).map(t => ['dim', t]), ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];
const secs = s => { const m = String(s).match(/([\d.]+)\s*(ms|s)/); return m ? +m[1] / (m[2] === 'ms' ? 1000 : 1) : 0; };
const fmt = v => (v >= 1 ? `${v.toFixed(2)} s` : `${Math.round(v * 1000)} ms`);

/* One statement's block in a lint -v or measure report: from "line N" to the blank line after it */
const blocks = lines => {
  const out = [];
  let cur = null;
  for (const t of lines) {
    const m = t.match(/^line (\d+)\s+(.*)$/);
    if (m) { cur = { line: +m[1], sql: m[2], rest: [] }; out.push(cur); continue; }
    if (!t.trim()) { cur = null; continue; }
    if (cur) cur.rest.push(t);
  }
  return out;
};
const verdictOf = b => (b.rest.some(t => /^ {2}DANGER/.test(t)) ? 'danger' : b.rest.some(t => /^ {2}RISK/.test(t)) ? 'risk' : b.rest.some(t => /not analysed/.test(t)) ? 'unknown' : 'ok');

/* A small terminal whose lines are revealed one at a time */
function miniTerm(el, lines) {
  el.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const spans = $$('span', el);
  return {
    hide() { spans.forEach(s => s.classList.add('is-off')); },
    show() { spans.forEach(s => s.classList.remove('is-off')); },
    async play(me, ms = 70) { for (const s of spans) { s.classList.remove('is-off'); await wait(s.classList.contains('cmd') ? 380 : ms, me); } }
  };
}

/* Hero terminal */
(() => {
  const gap = ['out', ''];
  PAGE.terminal = {
    scenes: {
      lint: [['dim', '# static analysis, no database'], ...runLines(CAP.lintHero), gap, ...exitLines(CAP.lintHero)],
      idx: [['dim', '# the same CREATE INDEX, on a copy with 5 million orders and live traffic'], ...runLines(CAP.idx)],
      queue: [['dim', '# a metadata-only ALTER behind an 8 s report'], ...runLines(CAP.queue)],
      examples: [['dim', '# all six examples, as written and rewritten, 5 million orders'], ...runLines(CAP.examples)]
    },
    order: ['lint', 'idx', 'queue', 'examples'],
    first: 'lint'
  };
})();

/* Tests per package, from go test -json ./... against PostgreSQL 17 (the same on 16) */
PAGE.tests = [['internal/measure', 20, 'var(--blue)'], ['internal/lint', 10, 'var(--yellow)'], ['cmd/migrate-safe', 5, 'var(--magenta)'], ['internal/sqlparse', 5, 'var(--water)']];

/* 1. Lint: the same migration with and without --schema */
(() => {
  const el = $('#d-lint'), seg = $('#ms-lt-seg'), list = $('#ms-lt'), sum = $('#ms-lt-sum');
  const MODES = [
    { label: 'With --schema', c: CAP.lintSchema },
    { label: 'Without a schema', c: CAP.lintNoSchema }
  ];
  const TAG = { danger: 'DANGER', risk: 'RISK', unknown: 'Not analysed', ok: 'No finding' };
  seg.innerHTML = MODES.map((m, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(m.label)}</button>`).join('');
  const btns = $$('button', seg);
  let rows = [];
  const select = i => {
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    const bs = blocks(MODES[i].c.out);
    list.innerHTML = bs.map(b => {
      const v = verdictOf(b);
      return `<li class="ms-lt-row" data-v="${v}"><p class="ms-lt-top"><span class="ms-ln">line ${b.line}</span><code>${esc(b.sql)}</code><b class="ms-v">${TAG[v]}</b></p><div class="ms-lt-out">${b.rest.map(t => `<span class="${toneOf(t)}">${esc(t.replace(/^ {10}/, '').replace(/^ {2}/, ''))}</span>`).join('')}</div></li>`;
    }).join('');
    sum.textContent = MODES[i].c.out[MODES[i].c.out.length - 1];
    rows = $$('.ms-lt-row', list);
  };
  let d = null;
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); rows.forEach(r => r.classList.add('in', 'is-v')); sum.classList.add('in'); }));
  d = demo(el, {
    reset() { select(0); rows.forEach(r => r.classList.remove('in', 'is-v')); sum.classList.remove('in'); },
    final() { select(0); rows.forEach(r => r.classList.add('in', 'is-v')); sum.classList.add('in'); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < MODES.length; i++) {
        if (d.stopAuto) return;
        select(i); sum.classList.remove('in');
        await wait(300, me);
        for (const r of rows) {
          if (d.stopAuto) return;
          r.classList.add('in'); await wait(230, me);
          r.classList.add('is-v'); await wait(i ? 180 : 420, me);
        }
        sum.classList.add('in');
        await wait(i ? 900 : 2200, me);
      }
      if (!d.stopAuto) { select(0); rows.forEach(r => r.classList.add('in', 'is-v')); sum.classList.add('in'); }
    }
  });
})();

/* 2. The eight lock modes against a reader (ACCESS SHARE) and a writer (ROW EXCLUSIVE), from modes.go */
(() => {
  const el = $('#d-locks'), list = $('#ms-lk');
  const MODES = ['ACCESS SHARE', 'ROW SHARE', 'ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'];
  const CONFLICTS = {
    'ACCESS SHARE': ['ACCESS EXCLUSIVE'],
    'ROW SHARE': ['EXCLUSIVE', 'ACCESS EXCLUSIVE'],
    'ROW EXCLUSIVE': ['SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
    'SHARE UPDATE EXCLUSIVE': ['SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
    SHARE: ['ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
    'SHARE ROW EXCLUSIVE': ['ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
    EXCLUSIVE: ['ROW SHARE', 'ROW EXCLUSIVE', 'SHARE UPDATE EXCLUSIVE', 'SHARE', 'SHARE ROW EXCLUSIVE', 'EXCLUSIVE', 'ACCESS EXCLUSIVE'],
    'ACCESS EXCLUSIVE': MODES
  };
  const BY = {
    'ACCESS SHARE': 'SELECT: the workload\'s reads, and the read probe',
    'ROW SHARE': 'VALIDATE of a foreign key, on the table it references',
    'ROW EXCLUSIVE': 'UPDATE and INSERT: the workload\'s writes, and a batched backfill',
    'SHARE UPDATE EXCLUSIVE': 'CREATE INDEX CONCURRENTLY, VALIDATE CONSTRAINT',
    SHARE: 'CREATE INDEX',
    'SHARE ROW EXCLUSIVE': 'ADD FOREIGN KEY, on both tables; CREATE TRIGGER',
    EXCLUSIVE: 'LOCK TABLE ... IN EXCLUSIVE MODE',
    'ACCESS EXCLUSIVE': 'Most ALTER TABLE: SET NOT NULL, ADD COLUMN, TYPE, RENAME, DROP COLUMN'
  };
  const blocks = (m, req) => CONFLICTS[m].includes(req);
  list.innerHTML = MODES.map(m => {
    const r = blocks(m, 'ACCESS SHARE'), w = blocks(m, 'ROW EXCLUSIVE');
    return `<li class="ms-lk-row" data-r="${r}" data-w="${w}"><code class="ms-lk-m">${m}</code><span class="ms-lk-by">${esc(BY[m])}</span>
      <span class="ms-lk-c" data-on="${r}"><small>Reads </small>${r ? 'Blocked' : 'Pass'}</span><span class="ms-lk-c" data-on="${w}"><small>Writes </small>${w ? 'Blocked' : 'Pass'}</span></li>`;
  }).join('');
  const rows = $$('.ms-lk-row', list);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-c')); },
    final() { rows.forEach(r => r.classList.add('in', 'is-c')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(150, me); }
      await wait(400, me);
      for (const r of rows) { r.classList.add('is-c'); await wait(260, me); }
    }
  });
})();

/* 3. The copy: the workload file, its workers, and the run's first lines */
(() => {
  const el = $('#d-copy');
  const WORKLOAD = [
    ['c', '-- param: id = orders.id'],
    ['c', '-- param: account = accounts.id'],
    ['c', '-- think: 2ms'],
    ['', ''],
    ['c', '-- class: read workers=4'],
    ['', 'SELECT id, status, amount_cents FROM orders WHERE id = :id;'],
    ['', ''],
    ['c', '-- class: write workers=4'],
    ['', "UPDATE orders SET status = 'shipped' WHERE id = :id;"],
    ['', ''],
    ['c', '-- class: insert workers=2'],
    ['', 'INSERT INTO orders (account_id, amount_cents, status, note)'],
    ['', "VALUES (:account, 1999, 'new', 'placed during the migration');"]
  ];
  $('#ms-wl').innerHTML = WORKLOAD.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const WK = [['read', 4], ['write', 4], ['insert', 2]];
  $('#ms-wk').innerHTML = WK.map(([n, k]) => `<div class="ms-wk-g"><span>${n}</span><span class="ms-wk-d">${'<i></i>'.repeat(k)}</span></div>`).join('');
  const dots = $$('#ms-wk i');
  const head = CAP.idx.out.slice(0, 3);
  const term = miniTerm($('#ms-cp-term'), [['cmd', CAP.idx.cmd], ...CAP.idx.err.slice(0, 2).map(t => ['dim', t]), ['out', ''], ...head.map(t => ['out', t])]);
  demo(el, {
    reset() { dots.forEach(d => d.classList.remove('on')); term.hide(); },
    final() { dots.forEach(d => d.classList.add('on')); term.show(); },
    async play(me) {
      await wait(300, me);
      const spans = $$('#ms-cp-term span');
      for (let i = 0; i < spans.length; i++) {
        spans[i].classList.remove('is-off');
        if (i === 2) for (const d of dots) { d.classList.add('on'); await wait(70, me); }
        await wait(i === 0 ? 500 : 420, me);
      }
    }
  });
})();

/* Timelines for stages 4 and 5: tracks of [label, from, to, kind] in seconds, on a shared axis */
function timeline(box, runs, max, ticks) {
  box.innerHTML = runs.map(r => `<div class="ms-run"><p class="ms-run-h">${r.title}<b class="ms-run-v" data-k="${r.tone}">${esc(r.verdict)}</b></p>
    <div class="ms-tracks">${r.tracks.map(([label, a, b, kind, note]) => `<div class="ms-tr"><span class="ms-tr-l">${esc(label)}</span><span class="ms-tr-a"><i class="ms-seg" data-k="${kind}" style="--x:${(a / max) * 100}%;--w:${((b - a) / max).toFixed(4)}"></i></span>${note ? `<em class="ms-tr-n" style="--f:${(Math.min(b, max * .62) / max).toFixed(4)}">${esc(note)}</em>` : ''}</div>`).join('')}</div></div>`).join('')
    + `<div class="ms-axis" aria-hidden="true"><span></span><span class="ms-axis-a">${ticks.map(t => `<i style="--x:${(t / max) * 100}%">${t} s</i>`).join('')}</span></div>`;
  const runEls = $$('.ms-run', box);
  return {
    set(n) { runEls.forEach((r, i) => r.classList.toggle('in', i < n)); },
    async play(me) { for (const r of runEls) { r.classList.add('in'); await wait(2600, me); } }
  };
}

/* 4. Measure: CREATE INDEX as written and CONCURRENTLY */
(() => {
  const el = $('#d-measure');
  const parse = c => {
    const b = blocks(c.out)[0], first = b.rest[0];
    const took = secs(first.match(/took ([\d.]+ m?s)/)[1]);
    const lo = c.out.find(t => t.startsWith('locked out (lock probes)'));
    const w = lo.match(/orders reads ([\d.]+ m?s), writes ([\d.]+ m?s)/);
    const lq = c.out.find(t => t.startsWith('longest query during it')).replace('longest query during it: ', '');
    return { took, reads: secs(w[1]), writes: secs(w[2]), lock: first.split(' · ')[1], lq };
  };
  const u = parse(CAP.idx), s = parse(CAP.idxSafe);
  const MAX = 5;
  const tl = timeline($('#ms-mx'), [
    { title: '<code>CREATE INDEX</code>', verdict: `writes locked out ${fmt(u.writes)}`, tone: 'bad', tracks: [['Statement', 0, u.took, 'stmt', `${u.lock}, ${fmt(u.took)}`], ['Reads', 0, u.reads, 'block'], ['Writes', 0, u.writes, 'block', fmt(u.writes)]] },
    { title: '<code>CREATE INDEX CONCURRENTLY</code>', verdict: 'nothing locked out', tone: 'ok', tracks: [['Statement', 0, s.took, 'stmt', `${s.lock}, ${fmt(s.took)}`], ['Reads', 0, s.reads, 'block'], ['Writes', 0, s.writes, 'block']] }
  ], MAX, [0, 1, 2, 3, 4, 5]);
  const facts = $('#ms-mx-facts');
  const F = [
    ['Lock, from pg_locks', u.lock, s.lock],
    ['Rewrote orders', 'no', 'no'],
    ['Scanned orders', 'yes', 'yes'],
    ['Longest query during it', u.lq, s.lq]
  ];
  facts.innerHTML = `<div class="ms-f-h"><dt></dt><dd>As written</dd><dd>Concurrently</dd></div>` + F.map(([k, a, b]) => `<div><dt>${k}</dt><dd>${esc(a)}</dd><dd>${esc(b)}</dd></div>`).join('');
  demo(el, {
    reset() { tl.set(0); facts.classList.remove('in'); },
    final() { tl.set(2); facts.classList.add('in'); },
    async play(me) { await wait(300, me); await tl.play(me); facts.classList.add('in'); }
  });
})();

/* 5. The lock queue: as written, and with lock_timeout = '200ms' */
(() => {
  const el = $('#d-queue');
  const parse = c => {
    const b = blocks(c.out).find(x => /ALTER/.test(x.sql));
    const t = b.rest.join('\n');
    return { took: secs(t.match(/took ([\d.]+ m?s)/)[1]), waited: secs(t.match(/waited ([\d.]+ m?s)/)[1]), out: secs(t.match(/orders reads ([\d.]+ m?s)/)[1]), b };
  };
  const u = parse(CAP.queue), s = parse(CAP.queueSafe);
  const MAX = 8;
  const tl = timeline($('#ms-qx'), [
    { title: 'As written', verdict: `reads and writes stuck ${fmt(u.out)}`, tone: 'bad', tracks: [['Report', 0, 7, 'reader', 'ACCESS SHARE, held 8 s from 1 s before'], ['ALTER', 0, u.took, 'wait', `waited ${fmt(u.waited)}`], ['Traffic', 0, u.out, 'block', `locked out ${fmt(u.out)}`]] },
    { title: "<code>lock_timeout = '200ms'</code>", verdict: 'gave up with 55P03', tone: 'ok', tracks: [['Report', 0, 7, 'reader'], ['ALTER', 0, s.took, 'wait', `55P03 after ${fmt(s.took)}`], ['Traffic', 0, s.out, 'block', `locked out ${fmt(s.out)}`]] }
  ], MAX, [0, 2, 4, 6, 8]);
  const term = miniTerm($('#ms-q-term'), [['dim', '# the rewritten run, its ALTER'], ['out', `line ${s.b.line}    ${s.b.sql}`], ...s.b.rest.map(t => [/failed as expected/.test(t) ? 'ok' : 'out', t])]);
  demo(el, {
    reset() { tl.set(0); term.hide(); },
    final() { tl.set(2); term.show(); },
    async play(me) { await wait(300, me); await tl.play(me); await term.play(me, 110); }
  });
})();

/* 6. Agree: predicted against measured, for every statement of the rewritten type change */
(() => {
  const el = $('#d-agree'), tbl = $('#ms-ag'), sum = $('#ms-ag-sum');
  const lockStr = o => (Object.keys(o).length ? Object.entries(o).map(([t, m]) => m).join(', ') : 'none');
  const fx = (rw, sc) => [rw.length ? 'rewrite' : '', sc.length ? 'scan' : ''].filter(Boolean).join(', ') || '-';
  const short = s => { const one = s.replace(/\s+/g, ' '); return one.length > 46 ? `${one.slice(0, 45)}…` : one; };
  tbl.innerHTML = `<thead><tr><th scope="col">Line</th><th scope="col">Statement</th><th scope="col">Lint predicted</th><th scope="col">pg_locks showed</th><th scope="col">Took</th></tr></thead><tbody>${CAP.agree.map(r => {
    const ok = lockStr(r.held) === lockStr(r.meas) && fx(r.pRewrite, r.pScan) === fx(r.mRewrite, r.mScan);
    return `<tr class="ms-ag-row" data-ok="${ok}"><td class="ms-ag-l">${r.line}</td><td><code>${esc(short(r.sql))}</code>${r.batches ? `<small>${r.batches} batches</small>` : ''}</td>
      <td class="ms-ag-p">${esc(lockStr(r.held))}<small>${fx(r.pRewrite, r.pScan)}</small></td>
      <td class="ms-ag-m">${esc(lockStr(r.meas))}<small>${fx(r.mRewrite, r.mScan)}</small></td>
      <td class="ms-ag-t">${fmt(r.took / 1000)}${r.wait > 100 ? `<small>waited ${fmt(r.wait / 1000)}</small>` : ''}</td></tr>`;
  }).join('')}</tbody>`;
  const rows = $$('.ms-ag-row', tbl);
  const same = rows.filter(r => r.dataset.ok === 'true').length;
  sum.textContent = `${same} of ${rows.length} statements: the predicted lock and effects match what the server did. The run's own check: "${CAP.examples.out[CAP.examples.out.length - 1]}".`;
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-m')); sum.classList.remove('in'); },
    final() { rows.forEach(r => r.classList.add('in', 'is-m')); sum.classList.add('in'); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(140, me); }
      await wait(500, me);
      for (const r of rows) { r.classList.add('is-m'); await wait(260, me); }
      sum.classList.add('in');
    }
  });
})();

/* 7. Ship: locked out as written and rewritten, from the 5 million row examples run */
const EXAMPLES = (lines => {
  const rows = [];
  let name = '';
  for (const t of lines) {
    const m = t.match(/^(\d\d-\S+)?\s+(unsafe|safe)\s+(DANGER|RISK|ok)\s+(.+?)\s{2,}([\d.]+ m?s)\s+([\d.]+ m?s)\s+([\d.]+ m?s)\s+(\S+)\s+(yes|no)$/);
    if (!m) continue;
    if (m[1]) name = m[1];
    rows.push({ ex: name, v: m[2], lint: m[3], took: m[4], reads: secs(m[5]), writes: secs(m[6]), longest: m[7], agree: m[9] });
  }
  return rows;
});
(() => {
  const el = $('#d-ship'), list = $('#ms-sh');
  const rows = EXAMPLES(CAP.examples.out);
  const LO = Math.log10(0.01), HI = Math.log10(60);
  const pos = v => clamp((Math.log10(Math.max(v, 0.01)) - LO) / (HI - LO), 0, 1);
  const names = [...new Set(rows.map(r => r.ex))];
  list.innerHTML = names.map(n => {
    const u = rows.find(r => r.ex === n && r.v === 'unsafe'), s = rows.find(r => r.ex === n && r.v === 'safe');
    const lu = Math.max(u.reads, u.writes), ls = Math.max(s.reads, s.writes);
    return `<li class="ms-sh-row"><p class="ms-sh-n"><code>${n}</code><small>lint as written: <b data-v="${u.lint}">${u.lint}</b> · rewritten: ${s.lint === 'ok' ? 'nothing found' : s.lint}</small></p>
      <div class="ms-sh-bars"><span class="ms-sh-b" data-k="bad"><i style="--w:${pos(lu).toFixed(4)}"></i><b>${lu ? fmt(lu) : 'none'}</b></span><span class="ms-sh-b" data-k="ok"><i style="--w:${pos(ls).toFixed(4)}"></i><b>${ls ? fmt(ls) : 'none'}</b><small>${esc(s.took.replace(' (timed out, as intended)', ', timed out as intended'))} in all</small></span></div></li>`;
  }).join('');
  const items = $$('.ms-sh-row', list);
  const term = miniTerm($('#ms-sh-term'), [...runLines(CAP.failOn), ...exitLines(CAP.failOn)]);
  demo(el, {
    reset() { items.forEach(r => r.classList.remove('in', 'is-s')); term.hide(); },
    final() { items.forEach(r => r.classList.add('in', 'is-s')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of items) { r.classList.add('in'); await wait(330, me); }
      await wait(500, me);
      for (const r of items) { r.classList.add('is-s'); await wait(330, me); }
      await wait(400, me);
      await term.play(me, 90);
    }
  });
})();

/* Measured: as written, the README's 5M run against this one */
(() => {
  const box = $('#ms-cmp');
  if (!box) return;
  const a = EXAMPLES(CAP.examplesReadme.out).filter(r => r.v === 'unsafe'), b = EXAMPLES(CAP.examples.out).filter(r => r.v === 'unsafe');
  const max = Math.max(...a.concat(b).map(r => Math.max(r.reads, r.writes)));
  box.innerHTML = a.map((r, i) => {
    const x = Math.max(r.reads, r.writes), y = Math.max(b[i].reads, b[i].writes);
    return `<div class="ms-cmp-row"><span>${r.ex.replace(/^\d\d-/, '')}</span><span class="bar ms-cmp-bar"><i style="--w:${((x / max) * 100).toFixed(1)}%"></i></span><span>${fmt(x)}</span><span></span><span class="bar ms-cmp-bar is-here"><i style="--w:${((y / max) * 100).toFixed(1)}%"></i></span><span>${fmt(y)}</span></div>`;
  }).join('') + '<div class="legend-row"><span class="key"><i class="ms-key ms-key-readme"></i>README</span><span class="key"><i class="ms-key ms-key-here"></i>This run</span></div>';
})();
