/* Every report, listing and state below is verbatim output of wal-crash at commit 436cd30, run in its dev image.
   CAP.statesBug and CAP.statesOk list every explored state ([cut, kind, op, distinct group, passed]) from a scratch
   program that calls wal-crash's own explorer; CAP.golden is the repository's golden strace log, hex decoded. */
const CAP = /*@@DATA:captures@@*/;

const toneOf = t => (/FAIL|LOST|^ {3}✗|^wal-crash: |^ {2}checker: |is missing|never synced/.test(t) ? 'err' : /PASS$/.test(t) ? 'ok' : /^warning: /.test(t) ? 'warn' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];

function miniTerm(el, lines) {
  el.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const spans = $$('span', el);
  return {
    hide() { spans.forEach(s => s.classList.add('is-off')); },
    show() { spans.forEach(s => s.classList.remove('is-off')); },
    async play(me, ms = 70) { for (const s of spans) { s.classList.remove('is-off'); await wait(s.classList.contains('cmd') ? 380 : ms, me); } }
  };
}
function segment(el, labels, onPick) {
  el.innerHTML = labels.map((l, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(l)}</button>`).join('');
  const btns = $$('button', el);
  btns.forEach((b, i) => b.addEventListener('click', () => onPick(i, true)));
  return i => btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
}
// "    5  rename   data.tmp -> data  (never synced)" -> { n, kind, rest, pending }
const parseOps = c => c.out.filter(t => /^\s+\d+ {2}\w/.test(t)).map(t => {
  const m = t.match(/^\s+(\d+) {2}(\S+)\s+(.*?)(\s+\(never synced\))?$/);
  return { n: +m[1], kind: m[2], rest: m[3], pending: !!m[4] };
});

/* Hero terminal */
(() => {
  const gap = ['out', ''];
  PAGE.terminal = {
    scenes: {
      bug: [['dim', '# the log store, acknowledging each put before its fsync'], ...runLines(CAP.abfAll), gap, ...exitLines(CAP.abfAll)],
      ok: [['dim', '# the same store, fsync first'], ...runLines(CAP.logAll), gap, ...exitLines(CAP.logAll)],
      full: [['dim', '# SQLite, journal_mode=delete, synchronous=FULL'], ...runLines(CAP.sqFull), gap, ...exitLines(CAP.sqFull)],
      extra: [['dim', '# the same workload at synchronous=EXTRA'], ...runLines(CAP.sqExtra), gap, ...exitLines(CAP.sqExtra)]
    },
    order: ['bug', 'ok', 'full', 'extra'],
    first: 'bug'
  };
})();

/* Tests per package, from go test -race -json in the dev image (subtests counted) */
PAGE.tests = [['internal/strace', 15, 'var(--blue)'], ['internal/crash', 7, 'var(--magenta)'], ['internal/check', 5, 'var(--yellow)'], ['internal/fsmodel', 4, 'var(--water)'], ['cmd/wal-crash', 4, 'var(--green)']];

/* 1. Record: strace lines of one put, and the operations the parser makes of them */
(() => {
  const el = $('#d-record'), sl = $('#wc-strace'), ol = $('#wc-rec-ops');
  // Which golden line (0-based, within lines 53-78) produced which operation; 21 and 23 are one fsync, split by strace.
  const MAP = { 0: 1, 1: 2, 10: 3, 11: 4, 14: 5, 21: 6, 23: 6, 25: 7 };
  const cut = t => (t.length > 104 ? t.slice(0, 103) + '…' : t);
  sl.innerHTML = CAP.golden.map((t, i) => `<li class="${i in MAP ? 'is-op' : 'is-noise'}" data-op="${MAP[i] || ''}"><code>${esc(cut(t))}</code></li>`).join('');
  const ops = CAP.goldenOps.slice(0, 7);
  ol.innerHTML = ops.map((t, i) => `<li data-op="${i + 1}"><code>${esc(t.trim())}</code></li>`).join('');
  const lines = $$('li', sl), outs = $$('li', ol);
  const refuse = miniTerm($('#wc-refuse'), [...runLines(CAP.refuseLink), ['dim', `# exit ${CAP.refuseLink.exit}`], ...runLines(CAP.refuseSym), ['dim', `# exit ${CAP.refuseSym.exit}`]]);
  const set = on => { lines.forEach(l => l.classList.toggle('in', on)); lines.forEach(l => l.classList.toggle('is-dim', on)); outs.forEach(o => o.classList.toggle('in', on)); };
  demo(el, {
    reset() { lines.forEach(l => l.classList.remove('in', 'is-dim', 'is-hot')); outs.forEach(o => o.classList.remove('in')); refuse.hide(); },
    final() { set(true); refuse.show(); },
    async play(me) {
      await wait(300, me);
      for (const l of lines) { l.classList.add('in'); await wait(45, me); }
      await wait(400, me);
      lines.forEach(l => l.classList.add('is-dim'));
      for (let n = 1; n <= 7; n++) {
        const src = lines.filter(l => l.dataset.op === String(n));
        src.forEach(l => l.classList.add('is-hot'));
        await wait(320, me);
        outs[n - 1].classList.add('in');
        await wait(260, me);
        src.forEach(l => l.classList.remove('is-hot'));
      }
      await wait(300, me);
      await refuse.play(me, 140);
    }
  });
})();

/* 2. What fsync promised: two puts of the correct snapshot store and of skip-dir-fsync */
(() => {
  const el = $('#d-force'), box = $('#wc-force');
  const COLS = [['Snapshot store', 'correct', CAP.snapOps, 14], ['Snapshot store', '-bug skip-dir-fsync', CAP.sdfOps, 12]];
  box.innerHTML = COLS.map(([t, bug, c, n]) => `<div class="wc-col"><p class="wc-col-h"><b>${t}</b><code>${esc(bug)}</code></p><ol class="wc-oplist">${parseOps(c).slice(0, n).map(o => {
    const cls = o.pending ? 'is-pend' : /^fsync|^sync/.test(o.kind) ? 'is-sync' : /^ACK /.test(o.rest) ? 'is-ack' : '';
    return `<li class="${cls}"><span class="wc-n">${o.n}</span><span class="wc-k">${esc(o.kind)}</span><span class="wc-r">${esc(o.rest)}</span>${o.pending ? '<span class="wc-pend">never synced</span>' : ''}</li>`;
  }).join('')}</ol></div>`).join('');
  const lists = $$('.wc-oplist', box).map(l => $$('li', l));
  const marks = $$('.is-pend', box);
  demo(el, {
    reset() { lists.flat().forEach(l => l.classList.remove('in')); marks.forEach(m => m.classList.remove('is-lit')); },
    final() { lists.flat().forEach(l => l.classList.add('in')); marks.forEach(m => m.classList.add('is-lit')); },
    async play(me) {
      await wait(300, me);
      const n = Math.max(...lists.map(l => l.length));
      for (let i = 0; i < n; i++) { lists.forEach(l => l[i] && l[i].classList.add('in')); await wait(150, me); }
      await wait(500, me);
      for (const m of marks) { m.classList.add('is-lit'); await wait(380, me); }
    }
  });
})();

/* 3. States: every explored crash state, by crash point and kind */
(() => {
  const el = $('#d-states'), grid = $('#wc-grid'), tally = $('#wc-st-tally');
  const WORK = [['Early ACK', CAP.statesBug, CAP.gridOpsBug], ['Correct', CAP.statesOk, CAP.gridOpsOk]];
  const MODELS = ['process', 'ordered', 'posix'];
  const KINDS = [['', 'Everything issued kept'], ['synced', 'Only what was synced'], ['drop', 'One pending op lost'], ['only', 'Only one pending op kept'], ['half', 'A write torn: half'], ['short', 'A write torn: short'], ['zeros', 'A write torn: zeros']];
  const KIND_ABBR = { create: 'cr', fsync: 'fs', stdout: 'out', write: 'wr', rename: 'mv', unlink: 'rm', truncate: 'tr', mkdir: 'md', sync: 'sy' };
  let w = 0, m = 2, cells = [];
  const draw = () => {
    pickW(w); pickM(m);
    const [, S, opsCap] = WORK[w], states = S[MODELS[m]], ops = parseOps(opsCap), N = ops.length;
    const kinds = KINDS.filter(([k]) => states.some(s => s[1] === k));
    const seen = new Set(), bad = new Set(), groups = new Set();
    for (const s of states) { groups.add(s[3]); if (!s[4]) bad.add(s[3]); }
    const at = {};
    for (const s of states) {
      const key = `${s[1]}|${s[0]}`, first = !seen.has(s[3]);
      seen.add(s[3]);
      (at[key] = at[key] || []).push({ ok: s[4], first, id: `c${s[0]}${s[1] ? '.' + s[1] + (s[2] > 0 ? s[2] : '') : ''}` });
    }
    grid.style.setProperty('--n', N + 1);
    const head = `<div class="wc-g-row wc-g-ops"><span class="wc-g-l">Crash after op</span>${Array.from({ length: N + 1 }, (_, c) => {
      const o = ops[c - 1];
      return `<span class="wc-g-h" title="${o ? esc(`${o.n} ${o.kind} ${o.rest}`) : 'before any operation'}"><b>${c}</b><i>${o ? (/^ACK /.test(o.rest) ? '<b class="wc-ack">A</b>' : KIND_ABBR[o.kind] || o.kind.slice(0, 2)) : ''}</i></span>`;
    }).join('')}</div>`;
    grid.innerHTML = head + kinds.map(([k, label]) => `<div class="wc-g-row"><span class="wc-g-l">${label}</span>${Array.from({ length: N + 1 }, (_, c) => {
      const v = at[`${k}|${c}`];
      if (!v) return '<span class="wc-g-c"></span>';
      const x = v[0];
      return `<span class="wc-g-c"><i class="wc-cell ${x.ok ? 'is-ok' : 'is-bad'}${x.first ? '' : ' is-dup'}" title="${x.id}: ${x.ok ? 'passed' : 'failed'}${x.first ? '' : ', same as another state'}" style="--c:${c}"></i></span>`;
    }).join('')}</div>`).join('');
    cells = $$('.wc-cell', grid);
    tally.innerHTML = [['States', states.length], ['Distinct', groups.size], ['Failing, distinct', bad.size]].map(([t, v], i) => `<div${i === 2 && v ? ' class="is-bad"' : ''}><dt>${t}</dt><dd>${v}</dd></div>`).join('');
  };
  const pickW = segment($('#wc-st-work'), WORK.map(x => x[0]), i => { if (d) d.stopAuto = true; w = i; draw(); grid.classList.add('in'); });
  const pickM = segment($('#wc-st-model'), MODELS, i => { if (d) d.stopAuto = true; m = i; draw(); grid.classList.add('in'); });
  let d = null;
  d = demo(el, {
    reset() { w = 0; m = 0; draw(); grid.classList.remove('in'); },
    final() { w = 0; m = 2; draw(); grid.classList.add('in'); },
    async play(me) {
      d.stopAuto = false;
      for (const [wi, mi] of [[0, 0], [0, 1], [0, 2], [1, 2]]) {
        if (d.stopAuto) return;
        w = wi; m = mi; draw(); grid.classList.remove('in');
        await wait(150, me);
        grid.classList.add('in');
        await wait(wi === 1 ? 1200 : 2300, me);
      }
      if (!d.stopAuto) { w = 0; m = 2; draw(); grid.classList.add('in'); }
    }
  });
})();

/* 4. The checker: its contract, and one state it judged */
(() => {
  const el = $('#d-checker'), env = $('#wc-env');
  const ENV = [
    ['$WAL_CRASH_ACKED', 'a file of the acknowledgements printed before the crash, ACK removed'],
    ['$WAL_CRASH_STDOUT', 'a file of every line printed before the crash'],
    ['$WAL_CRASH_DIR', 'the state\'s directory, also the working directory'],
    ['$WAL_CRASH_STATE', 'the state\'s name, such as c5.synced']
  ];
  env.innerHTML = ENV.map(([k, v]) => `<div><dt><code>${k}</code></dt><dd>${esc(v)}</dd></div>`).join('');
  const rows = $$('div', env);
  const term = miniTerm($('#wc-chk'), [...runLines(CAP.abfState), ...runLines(CAP.abfLs), ...runLines(CAP.abfCheck5), ...exitLines(CAP.abfCheck5), ['dim', '# a checker that cannot run: one try, then exit 2'], ...runLines(CAP.noCheckerCmd), ...exitLines(CAP.noCheckerCmd)]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(300, me); }
      await wait(300, me);
      await term.play(me, 90);
    }
  });
})();

/* 5. The simplest failure, for three stores */
(() => {
  const el = $('#d-simplest'), box = $('#wc-sm'), what = $('#wc-sm-what');
  const BUGS = Object.fromEntries(CAP.bugs.out.map(t => { const [e, n, ...w] = t.split(/\s{2,}/); return [`${e} ${n}`, w.join(' ')]; }));
  const RUNS = [
    ['Log store', CAP.abfCheck, `<b>log, ack-before-fsync</b> ${esc(BUGS['log ack-before-fsync'])}`],
    ['Snapshot store', CAP.sdfRun, `<b>snapshot, skip-dir-fsync</b> ${esc(BUGS['snapshot skip-dir-fsync'])}`],
    ['SQLite NORMAL', CAP.sqNormal, '<b>journal_mode=delete, synchronous=NORMAL</b> six transactions, each acknowledged when COMMIT returns']
  ];
  let term = null;
  const draw = i => { pick(i); what.innerHTML = RUNS[i][2]; term = miniTerm(box, [...runLines(RUNS[i][1]), ...exitLines(RUNS[i][1])]); };
  const pick = segment($('#wc-sm-seg'), RUNS.map(r => r[0]), i => { if (d) d.stopAuto = true; draw(i); term.show(); });
  let d = null;
  d = demo(el, {
    reset() { draw(0); term.hide(); },
    final() { draw(0); term.show(); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < RUNS.length; i++) {
        if (d.stopAuto) return;
        draw(i); term.hide();
        await wait(300, me);
        await term.play(me, 55);
        await wait(i === RUNS.length - 1 ? 300 : 1600, me);
      }
    }
  });
})();

/* 6. Look: the snapshot state written out, and the SQLite journal decoded */
(() => {
  const el = $('#d-state'), jr = $('#wc-jr');
  const term = miniTerm($('#wc-look'), [...runLines(CAP.sdfState), ...runLines(CAP.sdfLs), ...runLines(CAP.sdfCheck), ...exitLines(CAP.sdfCheck)]);
  const [head, ...recs] = CAP.journal;
  jr.innerHTML = `<p class="wc-jr-h">${esc(head)}</p><ol class="wc-jr-l">${recs.map(t => {
    const m = t.match(/^record (\d+)\s+page (\d+)\s+data all zeros: (\w+)\s+checksum ok: (\w+)/);
    const zero = m[3] === 'True';
    return `<li class="${zero ? 'is-zero' : ''}"><span class="wc-jr-pg"><small>record ${m[1]}</small>page ${m[2]}</span><span class="wc-jr-data" aria-label="${zero ? 'all zeros' : 'page data'}"></span><span class="wc-jr-ck">checksum ${m[4] === 'True' ? 'ok' : 'bad'}</span>${zero ? '<span class="wc-jr-why">op 16, lost: zeros</span>' : ''}</li>`;
  }).join('')}</ol>`;
  const items = $$('li', jr);
  demo(el, {
    reset() { term.hide(); jr.classList.remove('in'); items.forEach(x => x.classList.remove('in')); },
    final() { term.show(); jr.classList.add('in'); items.forEach(x => x.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      await term.play(me, 120);
      await wait(400, me);
      jr.classList.add('in');
      for (const x of items) { await wait(450, me); x.classList.add('in'); }
    }
  });
})();

/* Measured: the SQLite table with its state counts, the kvstore verdicts, and the cost */
(() => {
  const why = {};
  CAP.matrix.forEach(t => { const m = t.match(/^journal_mode=(\w+)\s+synchronous=(\w+)\s+\S+\s+\S+\s+\S+\s*(.*)$/); if (m) why[`${m[1]} ${m[2]}`] = m[3]; });
  const fmt = n => n.toLocaleString('en-US');
  $('#wc-mx').innerHTML = `<div class="wc-mx-row wc-mx-head" role="row"><span role="columnheader">journal_mode, synchronous</span><span role="columnheader">process</span><span role="columnheader">ordered</span><span role="columnheader">posix</span><span role="columnheader">posix states (distinct)</span><span role="columnheader">Simplest failure</span></div>` + CAP.sqlite.map(r => {
    const v = r.models.map(([name, , , bad]) => `<span role="cell" class="wc-v ${bad ? 'is-bad' : 'is-ok'}"><small>${name} </small>${bad ? 'FAIL' : 'pass'}</span>`).join('');
    const p = r.models[2];
    return `<div class="wc-mx-row" role="row"><span role="rowheader"><code>${r.mode}, ${r.sync}</code></span>${v}<span role="cell" class="wc-mx-n"><small>posix states </small>${fmt(p[1])} (${fmt(p[2])})</span><span role="cell" class="wc-mx-why">${esc(why[`${r.mode} ${r.sync}`] || '')}</span></div>`;
  }).join('');
  $('#wc-mx').setAttribute('role', 'table');
  $('#wc-mx').setAttribute('aria-label', 'SQLite under each journal mode and sync level');
  const kv = CAP.matrix.filter(t => /^(snapshot|log)\s/.test(t) && !/correct/.test(t));
  const fails = i => kv.filter(t => t.split(/\s+/)[2 + i] === 'FAIL').length;
  $('#wc-kv-tally').innerHTML = ['process', 'ordered', 'posix'].map((m, i) => `<span>${m}: ${fails(i)} of ${kv.length}</span>`).join('');
  const off = CAP.sqlite.find(r => r.mode === 'delete' && r.sync === 'off').models[2];
  const [mn, sec] = CAP.matrixTime.match(/(\d+)m([\d.]+)s/).slice(1);
  $('#wc-cost').innerHTML = [`make matrix: ${+mn ? `${mn} min ` : ''}${Math.round(+sec)} s`, `largest row: ${fmt(off[1])} states`].map(t => `<span>${esc(t)}</span>`).join('');
  $('#wc-cost-note').innerHTML = `Both tables, 16 workloads under three models, in the dev image; the README says one to two minutes and CI took 81 s. An earlier run here, with the machine busy, took 3 min 6 s. The largest row is <code>delete, off</code> under <code>posix</code>, ${fmt(off[2])} of them distinct.`;
})();
