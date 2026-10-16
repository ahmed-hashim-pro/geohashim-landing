/* Every report, listing and error below is verbatim output of agent-replay 0.1.0 at commit 0e76d20,
   captured by one script; align, matrix and noiseRows were worked out with agent-replay's own diff and report code. */
const CAP = /*@@DATA:captures@@*/;

const ROW = /^ [+\-~↕] /;
const toneOf = t => {
  if (ROW.test(t)) return /DESTRUCTIVE$| destructive$/.test(t) ? 'tbl err' : 'tbl';
  if (/^ {3}change /.test(t)) return 'tbl dim';
  if (/^ {2,4}\d+ {2}/.test(t)) return / destructive$/.test(t) ? 'tbl err' : 'tbl';
  if (/^not in the recording:|^ {22}\S/.test(t)) return 'tbl dim';
  if (/^(FAIL|WARN):|^agent-replay: /.test(t)) return 'err';
  if (/^ok:/.test(t)) return 'ok';
  return 'out';
};
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];
const SHOW = /^\s+(\d+) {2}(.*?)\s{2,}(read-only|write|destructive|unknown)$/;
const listing = c => c.out.map(t => t.match(SHOW)).filter(Boolean).map(m => ({ label: m[2], cls: m[3] }));
const CC_CMD = 'agent-replay compare examples/claude-code/v1-run1.json --candidate examples/claude-code/v2-run*.json --unchanged examples/claude-code/v1-run{2,3,4,5}.json';

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
      show: [['dim', '# the recorded session: the example agent with the original prompt'], ...runLines(CAP.show)],
      one: [['dim', '# one replay with the edited prompt, seed 1'], ...runLines(CAP.one), gap, ...exitLines(CAP.one)],
      head: [['dim', '# 20 runs with the edit, 20 without; unrecorded calls get a stub'], ...runLines(CAP.head), gap, ...exitLines(CAP.head)],
      cc: [['dim', '# ten Claude Code sessions recorded through the MCP proxy; no model call'], ...runLines(CAP.cc, CC_CMD), gap, ...exitLines(CAP.cc)]
    },
    order: ['show', 'one', 'head', 'cc'],
    first: 'show'
  };
})();

/* Tests per file, from pytest --collect-only with the optional SDKs installed */
PAGE.tests = [
  ['session, models, record', 20, 'var(--blue)'],
  ['diff, stats', 13, 'var(--magenta)'],
  ['cli', 12, 'var(--yellow)'],
  ['replay', 10, 'var(--water)'],
  ['report', 8, 'var(--green)'],
  ['mcp, mcp_sdk, anthropic_sdk', 8, 'var(--red)'],
  ['classify', 7, 'var(--ink-2)']
];

const clsOfAnn = a => (!a ? 'unknown' : a.readOnlyHint ? 'read-only' : a.destructiveHint === false ? 'write' : 'destructive');
const chip = cls => `<span class="ar-cls" data-c="${cls}">${cls}</span>`;
const callLabel = (name, args) => `${name}(${Object.entries(args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')})`;

/* 1. Record: the proxy's log of a real Claude Code run, then the import */
(() => {
  const el = $('#d-record'), list = $('#ar-log');
  const tools = {};
  list.innerHTML = CAP.mcpLog.map(e => {
    if (e.event === 'tools') {
      e.tools.forEach(t => { tools[t.name] = clsOfAnn(t.annotations); });
      return `<li class="ar-ev"><span class="ar-ev-k">tools/list</span><span class="ar-ev-tools">${e.tools.map(t => `<span class="ar-tool"><code>${t.name}</code>${chip(clsOfAnn(t.annotations))}</span>`).join('')}</span></li>`;
    }
    return `<li class="ar-ev"><span class="ar-ev-k">tools/call</span><span class="ar-ev-call"><code class="ar-ev-l" data-c="${tools[e.name]}">${esc(callLabel(e.name, e.arguments))}</code><span class="ar-ev-r" title="${esc(e.text)}">${esc(e.text)}</span></span></li>`;
  }).join('');
  const rows = $$('li', list);
  const term = miniTerm($('#ar-rec-term'), [...runLines(CAP.import), ...runLines(CAP.v2show, 'agent-replay show examples/claude-code/v2-run1.json')]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(420, me); }
      await wait(300, me);
      await term.play(me, 90);
    }
  });
})();

/* 2. Replay: one candidate run under stop, error and stub */
(() => {
  const el = $('#d-replay'), box = $('#ar-pol');
  const NOTE = { stop: 'Not recorded: the run stops here', error: 'Not recorded: gets an error result', stub: 'Not recorded: gets the stub {"deleted": true}' };
  box.innerHTML = ['stop', 'error', 'stub'].map(p => {
    const c = CAP.policy[p], r = c.run;
    const calls = r.calls.map((call, i) => {
      const src = r.stubbed.includes(i) ? 'stub' : r.unrecorded.includes(i) ? 'none' : 'rec';
      return `<li class="ar-call" data-s="${src}"><code>${esc(callLabel(call.name, call.input))}</code><small>${src === 'rec' ? 'Recorded result' : NOTE[p]}</small></li>`;
    }).join('');
    const sim = c.out.find(t => t.startsWith('final reply'));
    const end = r.stop === 'diverged'
      ? '<p class="ar-end"><b>Run ended:</b> diverged, no reply</p>'
      : `<p class="ar-end"><b>Reply:</b> ${esc(r.final_text)}</p><p class="ar-sim">${esc(sim.replace(/^final reply\s+/, ''))}</p>`;
    return `<div class="ar-pol-col"><p class="ar-pol-h"><code>--on-unrecorded ${p}</code></p><ol class="ar-calls">${calls}</ol>${end}<p class="ar-v">${esc(c.out[c.out.length - 1])}</p></div>`;
  }).join('');
  const cols = $$('.ar-pol-col', box);
  const parts = cols.map(c => [...$$('.ar-call', c), ...$$('.ar-end, .ar-sim, .ar-v', c)]);
  demo(el, {
    reset() { parts.flat().forEach(p => p.classList.remove('in')); },
    final() { parts.flat().forEach(p => p.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      for (const ps of parts) {
        for (const p of ps) { p.classList.add('in'); await wait(p.dataset.s === 'none' || p.dataset.s === 'stub' ? 700 : 300, me); }
        await wait(500, me);
      }
    }
  });
})();

/* 3. Diff: both sides, linked pass by pass the way diff_calls aligns them */
(() => {
  const el = $('#d-diff'), seg = $('#ar-diff-seg'), bl = $('#ar-al-b'), al = $('#ar-al-a'), svg = $('#ar-al-links'), wrap = $('#ar-al');
  const kEl = $('#ar-diff-k'), passes = $$('#ar-pass li');
  const SETS = {
    ill: { k: 'before.json and after.json <span class="tag-ill">Illustrative input</span>', a: CAP.align.ill, d: CAP.diffIll },
    cc: { k: '<code>examples/claude-code/v1-run1.json</code> and <code>v2-run1.json</code>', a: CAP.align.cc, d: CAP.ccDiff }
  };
  const PASS = { same: 1, moved: 2, changed: 3, removed: 3, added: 3 };
  const MARK = { same: '=', moved: '↕', changed: '~', removed: '-', added: '+' };
  let cur = 'ill', term = null, links = [];
  const row = (c, i) => `<li data-st="${c.st}" data-p="${PASS[c.st]}"><span class="ar-al-i">${i + 1}</span><code>${esc(c.label)}</code><span class="ar-al-m" title="${c.st}">${MARK[c.st]}</span></li>`;
  function render(k) {
    cur = k;
    const s = SETS[k];
    $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    kEl.innerHTML = s.k;
    bl.innerHTML = s.a.before.map(row).join('');
    al.innerHTML = s.a.after.map(row).join('');
    term = miniTerm($('#ar-diff-term'), [...runLines(s.d), ['dim', `# exit ${s.d.exit}`]]);
    layout();
  }
  function layout() {
    const s = SETS[cur], box = svg.getBoundingClientRect();
    svg.replaceChildren();
    const lb = $$('li', bl), la = $$('li', al);
    links = [];
    s.a.before.forEach((c, i) => {
      if (c.to === null) return;
      const ra = lb[i].getBoundingClientRect(), rb = la[c.to].getBoundingClientRect();
      const y1 = ra.top + ra.height / 2 - box.top, y2 = rb.top + rb.height / 2 - box.top, w = box.width;
      const p = svgEl('path', { d: `M0 ${r1(y1)}C${r1(w / 2)} ${r1(y1)} ${r1(w / 2)} ${r1(y2)} ${r1(w)} ${r1(y2)}`, class: `ar-link ar-link-${c.st}`, 'data-p': PASS[c.st] });
      svg.appendChild(p);
      links.push(p);
    });
    svg.setAttribute('viewBox', `0 0 ${r1(box.width)} ${r1(box.height)}`);
    show(phase);
  }
  let phase = 0;
  function show(n) {
    phase = n;
    $$('li', wrap).forEach(li => li.classList.toggle('in', +li.dataset.p <= n));
    links.forEach(p => p.classList.toggle('in', +p.dataset.p <= n));
    passes.forEach(p => { p.classList.toggle('done', +p.dataset.p < n || n > 3); p.classList.toggle('now', +p.dataset.p === n && n <= 3); });
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(wrap);
  let d = null;
  $$('button', seg).forEach(b => b.addEventListener('click', () => { if (d) d.stopAuto = true; render(b.dataset.k); show(4); term.show(); }));
  render('ill');
  d = demo(el, {
    reset() { render('ill'); show(0); term.hide(); },
    final() { show(4); term.show(); },
    async play(me) {
      d.stopAuto = false;
      for (const k of ['ill', 'cc']) {
        if (d.stopAuto) return;
        render(k); show(0); term.hide();
        await wait(400, me);
        for (let n = 1; n <= 3; n++) { if (d.stopAuto) return; show(n); await wait(1100, me); }
        show(4);
        if (d.stopAuto) return;
        await term.play(me, 60);
        await wait(k === 'ill' ? 1600 : 400, me);
      }
    }
  });
})();

/* 4. Classify: annotations alone, then with rules.toml */
(() => {
  const el = $('#d-classify'), list = $('#ar-cl');
  const base = listing(CAP.classes), ruled = listing(CAP.classesRules);
  const ann = Object.fromEntries(CAP.classesTools.map(t => [t.name, t.annotations]));
  const annText = a => (!a ? 'none' : Object.entries(a).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', '));
  list.innerHTML = base.map((c, i) => {
    const name = c.label.slice(0, c.label.indexOf('('));
    const flip = ruled[i].cls !== c.cls;
    return `<li class="ar-cl-row${flip ? ' is-flip' : ''}"><code class="ar-cl-n">${esc(c.label)}</code><span class="ar-cl-a"><span class="ar-cl-l">Annotations </span>${esc(annText(ann[name]))}</span><span class="ar-cl-c"><span class="ar-cl-x ar-cl-old">${chip(c.cls)}</span>${flip ? `<span class="ar-cl-x ar-cl-new">${chip(ruled[i].cls)}<small>by rule</small></span>` : ''}</span></li>`;
  }).join('');
  const rows = $$('li', list), flips = rows.filter(r => r.classList.contains('is-flip'));
  const toml = $('#ar-toml');
  toml.textContent = CAP.rulesToml.join('\n');
  const term = miniTerm($('#ar-cl-term'), [['cmd', "cat bad.toml"], ['out', '[[rule]]'], ['out', 'tool = "http_*"'], ['out', 'class = "dangerous"'], ...runLines(CAP.badRules), ['dim', `# exit ${CAP.badRules.exit}`]]);
  const set = n => {
    rows.forEach(r => r.classList.toggle('in', n >= 1));
    toml.classList.toggle('in', n >= 2);
    flips.forEach(r => r.classList.toggle('is-ruled', n >= 2));
  };
  demo(el, {
    reset() { set(0); term.hide(); },
    final() { set(2); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(280, me); }
      await wait(900, me);
      toml.classList.add('in');
      await wait(700, me);
      for (const r of flips) { r.classList.add('is-ruled'); await wait(600, me); }
      await wait(500, me);
      await term.play(me, 120);
    }
  });
})();

/* 5. Noise: which change each run made, then the counts, p and verdict */
(() => {
  const el = $('#d-noise'), box = $('#ar-mx');
  const R = CAP.noiseRows, M = CAP.matrix;
  const cells = (runs, key, g) => runs.map((r, i) => `<i class="ar-cell${r.includes(key) ? ' on' : ''}" data-g="${g}" data-i="${i}"></i>`).join('');
  box.innerHTML = `<div class="ar-mx-row ar-mx-head" role="row"><span role="columnheader">Change</span><span role="columnheader">Edited prompt, runs 1 to 20</span><span role="columnheader">Unchanged, runs 1 to 20</span><span role="columnheader" class="ar-mx-n">p</span><span role="columnheader">Verdict</span></div>`
    + R.map(r => `<div class="ar-mx-row" role="row" data-v="${r.verdict}">
      <span class="ar-mx-c" role="rowheader"><b>${esc(r.mark)}</b><code>${esc(r.label)}</code>${chip(r.cls)}</span>
      <span class="ar-mx-g" role="cell" aria-label="${r.n} of 20"><span class="ar-mx-cells">${cells(M.candidate, r.key, 'c')}</span><b class="ar-mx-k">${r.n}/20</b></span>
      <span class="ar-mx-g" role="cell" aria-label="${r.m} of 20"><span class="ar-mx-cells">${cells(M.unchanged, r.key, 'u')}</span><b class="ar-mx-k">${r.m}/20</b></span>
      <span class="ar-mx-p" role="cell"><span class="ar-mx-pl">p </span>${esc(r.p)}</span>
      <span class="ar-mx-v" role="cell"><span class="ar-vd" data-v="${r.verdict}">${r.verdict}</span></span>
    </div>`).join('');
  const verdict = $('#ar-mx-verdict');
  verdict.textContent = CAP.head.out[CAP.head.out.length - 1];
  const all = $$('.ar-cell', box), cols = [...Array(20)].map((_, i) => all.filter(c => +c.dataset.i === i));
  const ks = $$('.ar-mx-k', box), ps = $$('.ar-mx-p', box), vs = $$('.ar-mx-v', box);
  const set = n => {
    all.forEach(c => c.classList.toggle('in', n >= 1));
    [...ks, ...ps].forEach(x => x.classList.toggle('in', n >= 2));
    vs.forEach(x => x.classList.toggle('in', n >= 3));
    verdict.classList.toggle('in', n >= 3);
  };
  demo(el, {
    reset() { set(0); },
    final() { set(3); },
    async play(me) {
      await wait(300, me);
      for (const col of cols) { col.forEach(c => c.classList.add('in')); await wait(110, me); }
      await wait(400, me);
      ks.forEach(x => x.classList.add('in'));
      await wait(700, me);
      ps.forEach(x => x.classList.add('in'));
      await wait(800, me);
      for (const v of vs) { v.classList.add('in'); await wait(260, me); }
      await wait(300, me);
      verdict.classList.add('in');
    }
  });
})();

/* 6. Gate: exit codes by report and --fail-on; CI from GitHub's API for run 38618285929 */
(() => {
  const el = $('#d-gate'), grid = $('#ar-gate'), list = $('#ar-jobs');
  const ROWS = [
    ['Headline replay', 'DESTRUCTIVE rows', [CAP.head, CAP.headChanged, CAP.headNever]],
    ['Stage 3 pair', 'changed rows only', [CAP.compareIll, CAP.compareIllChanged, CAP.compareIllNever]]
  ];
  const FAIL = ['destructive', 'changed', 'never'];
  grid.innerHTML = `<div class="ar-gate-row ar-gate-head" role="row"><span role="columnheader">Report</span>${FAIL.map(f => `<span role="columnheader"><code>--fail-on ${f}</code>${f === 'destructive' ? ' <small>default</small>' : ''}</span>`).join('')}</div>`
    + ROWS.map(([n, sub, cs]) => `<div class="ar-gate-row" role="row"><span class="ar-gate-n" role="rowheader"><b>${n}</b><small>${sub}</small></span>${cs.map((c, i) => {
      const v = c.out[c.out.length - 1];
      return `<span class="ar-gate-c" role="cell" data-x="${c.exit}"><span class="ar-gate-l">--fail-on ${FAIL[i]}</span><b>exit ${c.exit}</b><small>${esc(v.slice(0, v.indexOf(':')))}</small></span>`;
    }).join('')}</div>`).join('');
  const cells = $$('.ar-gate-c', grid);
  const strictTail = CAP.compareIllStrict.out.filter(t => ROW.test(t) || /^ {3}change /.test(t) || /^FAIL/.test(t));
  const term = miniTerm($('#ar-gate-term'), [
    ['dim', '# unknown tools count as destructive under --strict'], ['cmd', CAP.compareIllStrict.cmd], ...strictTail.map(t => [toneOf(t), t]), ['dim', `# exit ${CAP.compareIllStrict.exit}`],
    ['dim', '# a person speaks again mid-session'], ...runLines(CAP.twoPeople), ['dim', `# exit ${CAP.twoPeople.exit}`]
  ]);
  const JOBS = [
    ['test (3.11)', 'pytest with both SDKs; the headline replay must exit 1', 25],
    ['test (3.13)', 'the same on Python 3.13', 42],
    ['bare', 'pytest with no optional SDK installed', 21],
    ['lint', 'ruff check, ruff format --check, mypy', 19],
    ['example-fresh', 'make example, then git diff --exit-code', 6]
  ];
  list.innerHTML = JOBS.map(([n, what, s]) => `<li class="ar-job"><span class="ar-tick" aria-hidden="true"></span><span class="ar-job-n"><b>${esc(n)}</b><small>${esc(what)}</small></span><span class="ar-job-bar"><i style="--w:${(s / 42) * 100}%"></i></span><span class="ar-job-s">${s} s</span></li>`).join('');
  const jobs = $$('.ar-job', list);
  demo(el, {
    reset() { cells.forEach(c => c.classList.remove('in')); term.hide(); jobs.forEach(j => j.classList.remove('is-run', 'is-ok')); },
    final() { cells.forEach(c => c.classList.add('in')); term.show(); jobs.forEach(j => { j.classList.remove('is-run'); j.classList.add('is-ok'); }); },
    async play(me) {
      await wait(300, me);
      for (const c of cells) { c.classList.add('in'); await wait(380, me); }
      await wait(400, me);
      await term.play(me, 90);
      jobs.forEach(j => j.classList.add('is-run'));
      const order = JOBS.map((j, i) => [j[2], i]).sort((a, b) => a[0] - b[0]);
      let t = 0;
      for (const [s, i] of order) { await wait((s - t) * 45, me); t = s; jobs[i].classList.remove('is-run'); jobs[i].classList.add('is-ok'); }
    }
  });
})();

/* 7. A real model: one block per call in each committed Claude Code session, then compare */
(() => {
  const el = $('#d-real'), box = $('#ar-runs');
  const KEYS = ['v1-run1', 'v1-run2', 'v1-run3', 'v1-run4', 'v1-run5', 'v2-run1', 'v2-run2', 'v2-run3', 'v2-run4', 'v2-run5'];
  box.innerHTML = KEYS.map((k, i) => {
    const calls = listing(CAP.ccShow[k]);
    const del = calls.some(c => c.cls === 'destructive');
    const head = i === 0 ? '<p class="ar-runs-h">Original prompt, <code>prompt-v1.txt</code></p>' : i === 5 ? '<p class="ar-runs-h">Edited prompt, <code>prompt-v2.txt</code></p>' : '';
    return `${head}<div class="ar-run" data-del="${del}"><span class="ar-run-n">Run ${i % 5 + 1}</span><span class="ar-run-b">${calls.map(c => `<i class="ar-blk" data-c="${c.cls}" title="${esc(c.label)}"></i>`).join('')}</span><span class="ar-run-k">${calls.length} calls</span><span class="ar-run-o">${del ? 'Deleted' : 'Archived'}</span></div>`;
  }).join('');
  const runs = $$('.ar-run', box);
  const term = miniTerm($('#ar-real-term'), [...runLines(CAP.cc, CC_CMD), ['dim', `# exit ${CAP.cc.exit}`]]);
  demo(el, {
    reset() { runs.forEach(r => r.classList.remove('in', 'is-o')); term.hide(); },
    final() { runs.forEach(r => r.classList.add('in', 'is-o')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of runs) { r.classList.add('in'); await wait(260, me); r.classList.add('is-o'); await wait(120, me); }
      await wait(500, me);
      await term.play(me, 70);
    }
  });
})();
