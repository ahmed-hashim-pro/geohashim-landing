/* Every report, chain and error below is verbatim output of authz-proof at commit 1e6e95e, run in examples/drive.
   CAP holds whole runs with their exit codes. GRIDS holds every check of a diff, both sides, from the engine package. */
const CAP = /*@@DATA:captures@@*/;
const GRIDS = /*@@DATA:grids@@*/;

const toneOf = t => (/^(GAINED|LOST|FAIL:|no: |warning: |authz-proof [a-z-]+: )/.test(t) ? 'err' : /^(OK:|yes: |no access changes)/.test(t) ? 'ok' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];

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
      refactor: [['dim', '# a refactor described as changing nothing'], ...runLines(CAP.refactor), gap, ...exitLines(CAP.refactor)],
      reordered: [['dim', '# the same union, reordered'], ...runLines(CAP.reordered), gap, ...exitLines(CAP.reordered)],
      why: [['dim', '# a no, and why; a yes, and how'], ...runLines(CAP.checkBob), ...exitLines(CAP.checkBob), gap, ...runLines(CAP.checkAlice), gap, ...runLines(CAP.lookupPayroll)],
      mutants: [['dim', '# seven deliberate bugs, each must be caught'], ...runLines(CAP.mutants)]
    },
    order: ['refactor', 'reordered', 'why', 'mutants'],
    first: 'refactor'
  };
})();

/* Tests per package, from go test -count=1 -json ./... with SPICEDB_ENDPOINT set for ./spicedb */
PAGE.tests = [['engine', 6, 'var(--blue)'], ['diff', 6, 'var(--magenta)'], ['schema', 5, 'var(--yellow)'], ['prop', 2, 'var(--water)'], ['spicedb', 2, 'var(--red)'], ['rel', 2, 'var(--green)'], ['gen', 2, 'var(--ink-2)'], ['cmd/authz-proof', 2, 'var(--pass)']];

const tokens = s => s.split(' ').map(t => `<span class="az-t${/^[+&-]$/.test(t) ? ` az-op${t === '-' ? ' az-minus' : ''}` : ''}">${esc(t)}</span>`).join(' ');

/* 1. Parse: the same tokens, grouped the way SpiceDB groups them; then what is refused */
(() => {
  const el = $('#d-parse'), a = $('#az-ex-a'), b = $('#az-ex-b'), c = $('#az-ex-c');
  a.innerHTML = tokens('(viewer + edit + parent->view) - restricted->contractor');
  b.innerHTML = tokens('viewer + edit - restricted->contractor + parent->view');
  // The grouping is validate's own warning: `(viewer + edit) - (restricted->contractor + parent->view)`
  c.innerHTML = `<span class="az-grp">${tokens('viewer + edit')}</span> ${tokens('-')} <span class="az-grp az-grp-x">${tokens('restricted->contractor + parent->view')}</span>`;
  const term = miniTerm($('#az-parse-term'), runLines(CAP.validateNoParens));
  const ERRS = ['errSelf', 'errCaveat', 'errNil', 'errTypo', 'errWrongType', 'errNoRel', 'errPerm'];
  const refuse = miniTerm($('#az-refuse-term'), ERRS.flatMap(k => [['cmd', CAP[k].cmd], ...CAP[k].out.map(t => [toneOf(t), t])]));
  const exs = [a, b, c], grps = $$('.az-grp', c);
  demo(el, {
    reset() { exs.forEach(x => x.classList.remove('in')); grps.forEach(g => g.classList.remove('on')); term.hide(); refuse.hide(); },
    final() { exs.forEach(x => x.classList.add('in')); grps.forEach(g => g.classList.add('on')); term.show(); refuse.show(); },
    async play(me) {
      await wait(300, me);
      for (const x of exs) { x.classList.add('in'); await wait(700, me); }
      for (const g of grps) { g.classList.add('on'); await wait(600, me); }
      await wait(300, me);
      await term.play(me, 120);
      await wait(500, me);
      await refuse.play(me, 90);
    }
  });
})();

/* 2. Check: each answer's chain, read from check's output */
(() => {
  const el = $('#d-check'), seg = $('#az-q-seg'), q = $('#az-q'), chain = $('#az-chain'), block = $('#az-block');
  const QS = [
    { label: 'alice, payroll', c: CAP.checkAlice },
    { label: 'bob, payroll', c: CAP.checkBob },
    { label: 'zoe, status page', c: CAP.checkZoe }
  ].map(x => {
    const out = x.c.out;
    const steps = out.slice(1).filter(t => /^\s+(user:|→ )/.test(t)).map(t => t.trim().replace(/^→ /, '').split(/\s{3,}/));
    const removed = out.find(t => /^\s+removed on /.test(t));
    return { ...x, head: out[0], steps, removed: removed ? removed.trim() : '' };
  });
  seg.innerHTML = QS.map((x, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(x.label)}</button>`).join('');
  const btns = $$('button', seg);
  let term = null, items = [], d = null;
  const select = i => {
    const x = QS[i];
    btns.forEach((bt, k) => bt.setAttribute('aria-pressed', String(k === i)));
    q.textContent = x.head;
    q.dataset.v = x.c.exit === 0 ? 'yes' : 'no';
    block.textContent = x.removed;
    block.hidden = !x.removed;
    chain.dataset.v = x.removed ? 'no' : 'yes';
    chain.innerHTML = x.steps.map(([n, note]) => `<li><code>${esc(n)}</code>${note ? `<small>${esc(note)}</small>` : ''}</li>`).join('');
    items = $$('li', chain);
    term = miniTerm($('#az-check-term'), [...runLines(x.c), ['dim', `# exit ${x.c.exit}`]]);
  };
  const shown = on => { [q, block].forEach(e => e.classList.toggle('in', on)); items.forEach(li => li.classList.toggle('in', on)); on ? term.show() : term.hide(); };
  btns.forEach((bt, i) => bt.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); shown(true); }));
  d = demo(el, {
    reset() { select(0); shown(false); },
    final() { select(0); shown(true); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < QS.length; i++) {
        if (d.stopAuto) return;
        select(i); shown(false);
        await wait(350, me);
        if (d.stopAuto) return;
        q.classList.add('in');
        await wait(400, me);
        if (QS[i].removed) { block.classList.add('in'); await wait(500, me); }
        for (const li of items) { li.classList.add('in'); await wait(300, me); }
        await wait(300, me);
        await term.play(me, 60);
        await wait(1300, me);
      }
    }
  });
})();

/* 3. Diff: every check, before and after, as a grid of subjects by object relations */
(() => {
  const el = $('#d-diff'), grid = $('#az-grid'), seg = $('#az-d-seg'), exprEl = $('#az-d-expr');
  const ROWS = GRIDS.rows, SUBS = GRIDS.subjects, NC = ROWS.length, NS = SUBS.length;
  const subLabel = s => (s.endsWith(':_unseen_') ? `any other ${s.split(':')[0]}` : s);
  $('#az-grid-subs').innerHTML = SUBS.map(s => `<li>${esc(subLabel(s))}</li>`).join('');
  const groups = [];
  ROWS.forEach((r, i) => { const o = r.split('#')[0]; if (!groups.length || groups[groups.length - 1].o !== o) groups.push({ o, n: 0, i }); groups[groups.length - 1].n++; });
  $('#az-grid-objs').innerHTML = groups.map(g => `<span style="grid-column:${g.i + 1} / span ${g.n}" title="${esc(g.o)}">${esc(g.o.split(':')[1])}</span>`).join('');
  grid.style.setProperty('--nc', NC);
  $('#az-grid-objs').style.setProperty('--nc', NC);
  // Row-major: subject by subject, then column by column. GRIDS strings are column-major, 14 subjects per column.
  let html = '';
  for (let s = 0; s < NS; s++) for (let c = 0; c < NC; c++) html += `<i class="az-c" title="${esc(`${ROWS[c]} @ ${subLabel(SUBS[s])}`)}"></i>`;
  grid.innerHTML = html;
  const cells = $$('.az-c', grid);
  const cols = Array.from({ length: NC }, (_, c) => Array.from({ length: NS }, (_, s) => cells[s * NC + c]));
  const V = [
    { key: 'refactor', label: 'The refactor', expr: '(viewer - restricted->contractor) + edit + parent->view', c: CAP.refactor, head: 6, tail: 12 },
    { key: 'reordered', label: 'Reordered', expr: '(parent->view + viewer + edit) - restricted->contractor', c: CAP.reordered },
    { key: 'noparens', label: 'No parentheses', expr: 'viewer + edit - restricted->contractor + parent->view', c: CAP.noparens, head: 9, tail: 0 }
  ];
  seg.innerHTML = V.map((v, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(v.label)}</button>`).join('');
  const btns = $$('button', seg);
  let cur = 0, term = null;
  const stateOf = (v, k) => { const o = GRIDS[v.key].old[k], n = GRIDS[v.key].new[k]; return o === n ? o : n === '1' ? 'g' : 'l'; };
  const paint = (v, phase) => {
    for (let c = 0; c < NC; c++) for (let s = 0; s < NS; s++) {
      const k = c * NS + s;
      cols[c][s].dataset.v = phase === 'old' ? GRIDS[v.key].old[k] : stateOf(v, k);
    }
  };
  const select = i => {
    cur = i;
    const v = V[i];
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    exprEl.innerHTML = `<span>document#view</span> ${tokens(v.expr)}`;
    const out = v.c.out;
    const lines = v.head ? [...out.slice(0, v.head), ['dim', '...'], ...(v.tail ? out.slice(out.length - v.tail) : [])] : out;
    term = miniTerm($('#az-diff-term'), [['cmd', v.c.cmd], ...lines.map(t => (Array.isArray(t) ? t : [toneOf(t), t])), ['dim', `# exit ${v.c.exit}`]]);
    const g = out[1];
    grid.setAttribute('aria-label', `${NC * NS} checks per side. ${g}`);
  };
  let d = null;
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); paint(V[i], 'new'); cells.forEach(x => x.classList.add('in')); term.show(); }));
  d = demo(el, {
    reset() { select(0); paint(V[0], 'old'); cells.forEach(x => x.classList.remove('in')); term.hide(); },
    final() { select(0); paint(V[0], 'new'); cells.forEach(x => x.classList.add('in')); term.show(); },
    async play(me) {
      d.stopAuto = false;
      await wait(300, me);
      for (let c = 0; c < NC; c++) { cols[c].forEach(x => x.classList.add('in')); if (c % 3 === 2) await wait(40, me); }
      await wait(900, me);
      if (d.stopAuto) return;
      paint(V[cur], 'new');
      await wait(900, me);
      await term.play(me, 45);
    }
  });
})();

/* 4. The twin: the mutant table, row by row, then the hunt */
(() => {
  const el = $('#d-twin'), list = $('#az-mut');
  const rows = CAP.mutants.out.slice(1).filter(t => /^\S+\s+(clean|caught)/.test(t)).map(t => t.split(/\s{2,}/));
  list.innerHTML = rows.map(([name, result, first, failed, by]) => {
    const pct = failed.endsWith('%') ? parseFloat(failed) : 0;
    return `<li class="az-m" data-r="${result}"><code>${esc(name)}</code><span class="az-m-r">${esc(result)}</span><span class="az-m-bar"><i style="--w:${pct}%"></i></span><span class="az-m-f">${esc(failed)}</span><small>${result === 'clean' ? esc(by) : `first at seed ${esc(first)}, by ${esc(by)}`}</small></li>`;
  }).join('');
  const items = $$('li', list);
  const term = miniTerm($('#az-hunt-term'), runLines(CAP.hunt));
  demo(el, {
    reset() { items.forEach(i => i.classList.remove('in')); term.hide(); },
    final() { items.forEach(i => i.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const i of items) { i.classList.add('in'); await wait(380, me); }
      await wait(400, me);
      await term.play(me, 120);
    }
  });
})();

/* 5. SpiceDB: the crosscheck's tallies, then one question asked in two orders */
(() => {
  const el = $('#d-spicedb'), xc = $('#az-xc'), cache = $('#az-cache');
  const X = CAP.crosscheck.out;
  const ex = X.filter(t => t.startsWith('examples/')).map(t => {
    const m = t.match(/^examples\/drive\/(\S+) \+ \S+: (\d+) checks \((\d+) yes\), (\d+) disagreements$/);
    return [m[1], m[2], m[3], m[4]];
  });
  const rnd = X.find(t => /random models/.test(t)).match(/^(\d+) random models: (\d+) checks \((\d+) yes\), (\d+) disagreements$/);
  const rows = [...ex, [`${rnd[1]} random models`, rnd[2], rnd[3], rnd[4]]];
  xc.innerHTML = `<div class="az-xc-row az-xc-head" aria-hidden="true"><span>Schema</span><span>Checks</span><span>Yes</span><span>Disagree</span></div>`
    + rows.map(([n, c, y, dis]) => `<div class="az-xc-row"><span><code>${esc(n)}</code></span><span>${Number(c).toLocaleString('en-US')}</span><span>${Number(y).toLocaleString('en-US')}</span><span class="az-xc-d">${dis}</span></div>`).join('')
    + `<p class="az-xc-note">${X.filter(t => t.startsWith('  ')).map(t => esc(t.trim())).join('<br>')}</p>`;
  const ask = c => c.out.slice(1).map(t => { const i = t.lastIndexOf(':'); return [t.slice(0, i), t.slice(i + 1).trim()]; });
  const on = ask(CAP.reproOn), off = ask(CAP.reproOff);
  cache.innerHTML = [['Default settings', on], ['--dispatch-cache-enabled=false', off]].map(([h, qs], k) => `<div class="az-cache-col"><p class="az-cache-h">${k ? `<code>${esc(h)}</code>` : esc(h)}</p><ol>${qs.map(([qq, a], i) => {
    const wrong = k === 0 && i === 2;
    return `<li${wrong ? ' class="az-wrong"' : ''}><span>${esc(qq)}</span><b data-a="${a === 'HAS_PERMISSION' ? 'has' : 'no'}">${esc(a)}</b></li>`;
  }).join('')}</ol></div>`).join('');
  const xrows = $$('.az-xc-row:not(.az-xc-head)', xc), note = $('.az-xc-note', xc), qs = $$('.az-cache-col li', cache);
  // Ask the two servers side by side, question by question
  const pairs = [0, 1, 2].map(i => [qs[i], qs[i + 3]]);
  demo(el, {
    reset() { xrows.forEach(r => r.classList.remove('in')); note.classList.remove('in'); qs.forEach(x => x.classList.remove('in')); },
    final() { xrows.forEach(r => r.classList.add('in')); note.classList.add('in'); qs.forEach(x => x.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      for (const r of xrows) { r.classList.add('in'); await wait(420, me); }
      note.classList.add('in');
      await wait(900, me);
      for (const [x, y] of pairs) { x.classList.add('in'); y.classList.add('in'); await wait(800, me); }
    }
  });
})();

/* 6. Allow: PR #213 as meant, and with folder:company for folder:eng */
(() => {
  const el = $('#d-allow'), seg = $('#az-a-seg'), line = $('#az-a-line'), gains = $('#az-gains'), exitEl = $('#az-exit');
  // examples/drive/allow-pr213.txt, as committed
  const ALLOW = [
    ['c', '// What PR #213 is meant to change (SEC-142): contractors may edit the'],
    ['c', '// engineering folder and the documents in it. Nothing else.'],
    ['', 'folder:eng#{editor,edit}@user:{bob,carol}                 SEC-142: contractors edit engineering'],
    ['', 'document:{roadmap,design-review}#edit@user:{bob,carol}    SEC-142: contractors edit engineering']
  ];
  $('#az-allow').innerHTML = ALLOW.map(([k, t]) => `<span${k ? ' class="c"' : ''}>${esc(t)}</span>`).join('\n');
  const PRS = [
    { label: 'PR #213', added: 'folder:eng#editor@team:contractors#member', c: CAP.pr213 },
    { label: 'The slip', added: 'folder:company#editor@team:contractors#member', c: CAP.slip }
  ];
  seg.innerHTML = PRS.map((p, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(p.label)}</button>`).join('');
  const btns = $$('button', seg);
  let items = [], term = null, d = null;
  const select = i => {
    const p = PRS[i];
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    line.innerHTML = `Adds one relationship: <code>${esc(p.added)}</code>`;
    const rows = p.c.out.filter(t => /^GAINED  /.test(t)).map(t => t.split(/\s{2,}/));
    gains.innerHTML = rows.map(([, grant, subs]) => `<li><code>${esc(grant)}</code><span>${subs.split(', ').map(s => `<i class="az-sub" data-a="${/\(allowed\)/.test(s) ? 'y' : 'n'}">${esc(s.replace(' (allowed)', ''))}</i>`).join('')}</span></li>`).join('');
    items = $$('li', gains);
    exitEl.dataset.code = String(p.c.exit);
    $('b', exitEl).textContent = String(p.c.exit);
    term = miniTerm($('#az-allow-term'), [['cmd', p.c.cmd.replace('relationships.txt --new-relationships', 'relationships.txt \\\n    --new-relationships')], [toneOf(p.c.out[1]), p.c.out[1]], ['dim', '...'], [toneOf(p.c.out[p.c.out.length - 1]), p.c.out[p.c.out.length - 1]]]);
  };
  const shown = on => { items.forEach(li => li.classList.toggle('in', on)); exitEl.classList.toggle('in', on); on ? term.show() : term.hide(); };
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); shown(true); }));
  d = demo(el, {
    reset() { select(0); shown(false); },
    final() { select(1); shown(true); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < PRS.length; i++) {
        if (d.stopAuto) return;
        select(i); shown(false);
        await wait(500, me);
        if (d.stopAuto) return;
        for (const li of items) { li.classList.add('in'); await wait(i ? 140 : 260, me); }
        await wait(300, me);
        await term.play(me, 120);
        exitEl.classList.add('in');
        await wait(1600, me);
      }
    }
  });
})();

/* 7. CI: the refactor failing its gate; jobs from GitHub's API for run 38658145655 */
(() => {
  const el = $('#d-ci'), list = $('#az-jobs');
  const out = CAP.refactor.out;
  const term = miniTerm($('#az-ci-term'), [['cmd', CAP.refactor.cmd], [toneOf(out[1]), out[1]], ['dim', '...'], [toneOf(out[out.length - 1]), out[out.length - 1]], ...exitLines(CAP.refactor)]);
  const JOBS = [
    ['test (1.22)', 'vet, gofmt, go test -race -short, go test', 38],
    ['test (stable)', 'vet, gofmt, go test -race -short, go test', 62],
    ['hunt', 'hunt --seeds 20000, mutants --seeds 500', 65],
    ['spicedb', 'go test ./spicedb, crosscheck --random 300', 47],
    ['spicedb-cache', 'repro.sh on a cached and an uncached server', 11]
  ];
  list.innerHTML = JOBS.map(([n, what, s]) => `<li class="az-job"><span class="az-tick" aria-hidden="true"></span><span class="az-job-n"><b>${esc(n)}</b><small>${esc(what)}</small></span><span class="az-job-bar"><i style="--w:${(s / 65) * 100}%"></i></span><span class="az-job-s">${s} s</span></li>`).join('');
  const jobs = $$('.az-job', list);
  demo(el, {
    reset() { term.hide(); jobs.forEach(j => j.classList.remove('is-run', 'is-ok')); },
    final() { term.show(); jobs.forEach(j => { j.classList.remove('is-run'); j.classList.add('is-ok'); }); },
    async play(me) {
      await wait(300, me);
      await term.play(me, 140);
      await wait(400, me);
      jobs.forEach(j => j.classList.add('is-run'));
      const order = JOBS.map((j, i) => [j[2], i]).sort((a, b) => a[0] - b[0]);
      let t = 0;
      for (const [s, i] of order) { await wait((s - t) * 35, me); t = s; jobs[i].classList.remove('is-run'); jobs[i].classList.add('is-ok'); }
    }
  });
})();
