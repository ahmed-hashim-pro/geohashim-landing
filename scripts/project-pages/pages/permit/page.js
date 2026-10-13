/* Every report, error and scan below is verbatim output of permit 0.1.0 at commit 8b23ecd.
   CAP.scans holds `permit scan` per version; the rest are whole runs with their exit codes. */
const CAP = /*@@DATA:captures@@*/;
const FIX = ' --fixtures ../../fixtures/packages';
// examples/monday/permit.json, as committed
const MONDAY_POLICY = [
  '{',
  '  "$comment": "fast-bundler ships a native binary and checks it on install, like esbuild.",',
  '  "allow": {',
  '    "fast-bundler": [',
  '      "install-script",',
  '      "binary"',
  '    ]',
  '  }',
  '}'
];

const toneOf = t => (/^ {2}NEW |^Blocked:|^permit: /.test(t) ? 'err' : /^ {2}allowed /.test(t) ? 'ok' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];
const capsOf = lines => (lines[0] === 'no capabilities found' ? [] : lines.map(l => {
  const [cap, where, ...rest] = l.split(/\s{2,}/);
  return { cap, where, detail: rest.join('  ') };
}));

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
      ua: [['dim', '# examples/ua-sniff: a patch release grows a preinstall step'], ...runLines(CAP.ua, CAP.ua.cmd + FIX), gap, ...exitLines(CAP.ua)],
      es: [['dim', '# examples/event-stream: a new transitive dependency'], ...runLines(CAP.es, CAP.es.cmd + FIX), gap, ...exitLines(CAP.es)],
      policy: [['dim', '# examples/monday, with the permit.json it ships'], ['cmd', 'cat permit.json'], ...MONDAY_POLICY.map(t => ['out', t]), gap, ...runLines(CAP.monday, CAP.monday.cmd + FIX), gap, ...exitLines(CAP.monday)],
      live: [['dim', '# esbuild 0.17.19 -> 0.18.20 and node-fetch 2.6.7 -> 3.3.2, live npm registry'], ...runLines(CAP.real), gap, ...exitLines(CAP.real)]
    },
    order: ['ua', 'es', 'policy', 'live'],
    first: 'ua'
  };
})();

/* Tests per file, from npm test (node --test dist/test/*.test.js) */
PAGE.tests = [['analyze.test.ts', 8, 'var(--blue)'], ['cli.test.ts', 7, 'var(--magenta)'], ['source.test.ts', 7, 'var(--yellow)'], ['diff.test.ts', 6, 'var(--water)'], ['lockfile.test.ts', 5, 'var(--green)'], ['policy.test.ts', 2, 'var(--ink-2)']];

/* 1. Lockfiles: the event-stream example's entries, then two refusals */
(() => {
  const el = $('#d-lock'), list = $('#pm-lk');
  const ROWS = [
    ['through-lite', '2.3.8', '2.3.8', 'same', 'Same version, skipped'],
    ['stream-pipe', '3.3.5', '3.3.6', 'changed', 'Changed, against 3.3.5'],
    ['flatmap-lite', '', '0.1.1', 'new', 'New: all of it counts']
  ];
  list.innerHTML = ROWS.map(([n, b, a, v, t]) => `<li class="pm-lk-row" data-v="${v}"><code class="pm-lk-n">${n}</code><span class="pm-lk-b"><span class="pm-lk-l">before </span>${b || '<i>not installed</i>'}</span><span class="pm-lk-a"><span class="pm-lk-l">after </span>${a}</span><span class="pm-lk-v">${t}</span></li>`).join('')
    + `<li class="pm-lk-sum">${esc(CAP.es.out[0])}</li>`;
  const rows = $$('li', list);
  const term = miniTerm($('#pm-lk-err'), [...runLines(CAP.errV1), ['dim', `# exit ${CAP.errV1.exit}`], ...runLines(CAP.errVer), ['dim', `# exit ${CAP.errVer.exit}`]]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-a', 'is-v')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in', 'is-a', 'is-v')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows.slice(0, -1)) { r.classList.add('in'); await wait(260, me); }
      for (const r of rows.slice(0, -1)) { r.classList.add('is-a'); await wait(380, me); r.classList.add('is-v'); await wait(420, me); }
      rows[rows.length - 1].classList.add('in', 'is-a', 'is-v');
      await wait(700, me);
      await term.play(me, 120);
    }
  });
})();

/* 2. Fetch: what happened to each package, step by step, then the report */
(() => {
  const el = $('#d-fetch'), grid = $('#pm-fx');
  const STEP = ['Download', 'Integrity', 'Unpack', 'Profile'];
  const ROWS = [
    ['hue-names', '1.1.3 -> 1.1.4', [['ok', '200'], ['ok', 'Matches'], ['ok', 'Unpacked'], ['ok', 'Nothing new']]],
    ['glob-lite', '0.2.8 -> 0.2.9', [['ok', '200'], ['bad', 'Mismatch'], ['skip', 'Not reached'], ['bad', 'unanalyzable']]],
    ['tick-ms', '2.1.2 -> 2.1.3', [['ok', '200'], ['ok', 'Matches'], ['bad', 'Refused: ../../.bashrc'], ['bad', 'unanalyzable']]],
    ['pad-start', '1.0.0, new', [['bad', '404'], ['skip', 'Not reached'], ['skip', 'Not reached'], ['bad', 'unanalyzable']]]
  ];
  grid.insertAdjacentHTML('beforeend', ROWS.map(([n, v, steps]) => `<div class="pm-fx-row" role="row"><span class="pm-fx-n" role="rowheader"><code>${n}</code><small>${v}</small></span>${steps.map(([s, t], i) => `<span class="pm-fx-c" role="cell" data-s="${s}"><small class="pm-fx-l">${STEP[i]} </small>${esc(t)}</span>`).join('')}</div>`).join(''));
  const cells = $$('.pm-fx-row:not(.pm-fx-head)', grid).map(r => $$('.pm-fx-c', r));
  const cols = [0, 1, 2, 3].map(i => cells.map(r => r[i]));
  const log = $('#pm-fx-log');
  log.innerHTML = runLines(CAP.reg).map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const lines = $$('span', log);
  demo(el, {
    reset() { cols.flat().forEach(c => c.classList.remove('in')); lines.forEach(l => l.classList.add('pm-off')); },
    final() { cols.flat().forEach(c => c.classList.add('in')); lines.forEach(l => l.classList.remove('pm-off')); },
    async play(me) {
      await wait(300, me);
      for (const col of cols) {
        for (const c of col) { c.classList.add('in'); await wait(170, me); }
        await wait(380, me);
      }
      for (const l of lines) { l.classList.remove('pm-off'); await wait(60, me); }
    }
  });
})();

/* 3. Parse, don't grep: the grep's matches, then permit's findings, on the same two files */
(() => {
  const el = $('#d-parse'), box = $('#pm-files'), score = $('#pm-score');
  const FILES = {
    'quiet.js': [
      '// Never touches child_process; see docs/https.md',
      'const note = "call eval() only in tests, never process.env";',
      "const name = 'child_process';",
      "/* require('https').get(url) */",
      'module.exports = { note, name };'
    ],
    'loud.js': [
      'var r = require, t = process;',
      "const plugin = r('./plugins/' + process.argv[2]);",
      "const key = t['e' + 'nv'].API_KEY;",
      "const { execFile } = require('node:child_process');",
      'module.exports = (url) => fetch(url, { headers: { key } });'
    ]
  };
  const GREP = { 'quiet.js': [1, 2, 3, 4], 'loud.js': [4] };
  const found = {};
  capsOf(CAP.scanLoud.out).forEach(({ cap, where, detail }) => {
    const [f, n] = where.split(':');
    (found[f] = found[f] || {})[n] = { cap, detail };
  });
  box.innerHTML = Object.entries(FILES).map(([f, src]) => `<div class="pm-file"><p class="pm-file-name"><code>pkg/${f}</code><span class="pm-none">${f in found ? '' : esc(CAP.scanQuiet.out[0])}</span></p><ol class="pm-code">${src.map((t, i) => {
    const hit = (found[f] || {})[i + 1];
    return `<li data-g="${GREP[f].includes(i + 1) ? 1 : 0}" data-p="${hit ? 1 : 0}"><span class="pm-ln">${i + 1}</span><code>${esc(t)}</code>${hit ? `<span class="pm-cap" title="${esc(hit.detail)}">${hit.cap}</span>` : ''}</li>`;
  }).join('')}</ol></div>`).join('');
  const g = $$('li[data-g="1"]', box), p = $$('li[data-p="1"]', box), none = $$('.pm-none', box);
  const k = n => $(`[data-k="${n}"]`, score);
  const set = (phase) => {
    g.forEach(li => li.classList.toggle('is-g', phase >= 1));
    p.forEach(li => li.classList.toggle('is-p', phase >= 2));
    none.forEach(x => x.classList.toggle('in', phase >= 2));
    k('grep').classList.toggle('in', phase >= 1);
    k('permit').classList.toggle('in', phase >= 2);
  };
  demo(el, {
    reset() { set(0); },
    final() { set(2); },
    async play(me) {
      await wait(400, me);
      for (const li of g) { li.classList.add('is-g'); await wait(260, me); }
      k('grep').classList.add('in');
      await wait(1300, me);
      for (const li of p) { li.classList.add('is-p'); await wait(420, me); }
      none.forEach(x => x.classList.add('in'));
      k('permit').classList.add('in');
    }
  });
})();

/* 4. Subtract: each version's capability set, before and after, from permit scan */
(() => {
  const el = $('#d-subtract'), list = $('#pm-sub');
  const S = CAP.scans;
  const ROWS = [
    ['esbuild', '0.17.19', '0.18.20', 'npm registry'],
    ['node-fetch', '2.6.7', '3.3.2', 'npm registry'],
    ['fast-bundler', '0.20.2', '0.21.0', 'fixture'],
    ['ua-sniff', '0.7.28', '0.7.29', 'fixture'],
    ['flatmap-lite', '', '0.1.1', 'fixture']
  ].map(([n, b, a, src]) => {
    const before = b ? capsOf(S[`${n}@${b}`]).map(c => c.cap) : null;
    const after = capsOf(S[`${n}@${a}`]);
    return { n, b, a, src, before, after, gains: after.filter(c => !(before || []).includes(c.cap)).length };
  });
  const chip = (cls, c, title) => `<span class="pm-chip ${cls}"${title ? ` title="${esc(title)}"` : ''}>${c}</span>`;
  list.innerHTML = ROWS.map(r => `<li class="pm-sub-row">
      <p class="pm-sub-n"><code>${r.n}</code><small>${r.b ? `${r.b} to ${r.a}` : `${r.a}, new`} · ${r.src}</small></p>
      <div class="pm-sub-b"><span class="pm-sub-l">Before</span>${r.before === null ? '<i>not installed</i>' : r.before.length ? r.before.map(c => chip('', c)).join('') : '<i>nothing</i>'}</div>
      <div class="pm-sub-a"><span class="pm-sub-l">After</span>${r.after.length ? r.after.map(c => chip((r.before || []).includes(c.cap) ? 'pm-chip-old' : 'pm-chip-new', c.cap, `${c.where}  ${c.detail}`)).join('') : '<i>nothing</i>'}</div>
      <p class="pm-sub-g" data-n="${r.gains}"><b>${r.gains}</b> new</p>
    </li>`).join('');
  const rows = $$('.pm-sub-row', list);
  const tail = CAP.ua.out.slice(CAP.ua.out.findIndex(t => t.startsWith('Blocked:')));
  const term = miniTerm($('#pm-sub-block'), [['dim', '# examples/ua-sniff, the end of the report'], ...tail.map(t => [toneOf(t), t]), ...exitLines(CAP.ua)]);
  const stage = (r, s) => { r.classList.toggle('is-b', s >= 1); r.classList.toggle('is-a', s >= 2); r.classList.toggle('is-g', s >= 3); };
  demo(el, {
    reset() { rows.forEach(r => stage(r, 0)); term.hide(); },
    final() { rows.forEach(r => stage(r, 3)); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) {
        stage(r, 1); await wait(420, me);
        stage(r, 2); await wait(520, me);
        stage(r, 3); await wait(560, me);
      }
      await wait(300, me);
      await term.play(me, 110);
    }
  });
})();

/* 5. Allow: the same upgrade under four policies */
(() => {
  const el = $('#d-allow'), seg = $('#pm-pol-seg'), nameEl = $('#pm-pol-name'), jsonEl = $('#pm-pol-json'), exitEl = $('#pm-exit');
  const NARROW = '{ "allow": { "fast-bundler": ["install-script", "binary"], "@acme/logger": ["network"] } }';
  const FULL = [
    '{',
    '  "$comment": "fast-bundler ships a native binary and checks it on install, like esbuild. @acme/logger 2.1 ships logs to our endpoint; reviewed.",',
    '  "allow": {',
    '    "fast-bundler": ["install-script", "binary"],',
    '    "@acme/logger": ["network", "env"]',
    '  }',
    '}'
  ].join('\n');
  const POL = [
    { label: 'None', name: 'No permit.json', json: '', c: CAP.mondayNoPolicy, cmd: CAP.mondayNoPolicy.cmd + FIX },
    { label: "The example's", name: 'examples/monday/permit.json', json: MONDAY_POLICY.join('\n'), c: CAP.monday, cmd: CAP.monday.cmd + FIX },
    { label: 'Narrow', name: 'narrow.json', json: NARROW, c: CAP.gitNarrow },
    { label: 'Reviewed', name: 'permit.json', json: FULL, c: CAP.gitAllow }
  ];
  seg.innerHTML = POL.map((p, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(p.label)}</button>`).join('');
  const btns = $$('button', seg);
  let term = null;
  const select = i => {
    const p = POL[i];
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    nameEl.textContent = p.name;
    jsonEl.textContent = p.json || 'No policy file: every gain blocks.';
    jsonEl.classList.toggle('is-empty', !p.json);
    exitEl.dataset.code = String(p.c.exit);
    $('b', exitEl).textContent = String(p.c.exit);
    term = miniTerm($('#pm-pol-term'), runLines(p.c, p.cmd));
  };
  const typo = miniTerm($('#pm-typo'), [['cmd', 'cat typo.json'], ['out', '{ "allow": { "ua-sniff": ["instal-script"] } }'], ...runLines(CAP.errTypo), ['dim', `# exit ${CAP.errTypo.exit}`]]);
  let d = null;
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); term.show(); exitEl.classList.add('in'); typo.show(); }));
  d = demo(el, {
    reset() { select(0); term.hide(); exitEl.classList.remove('in'); typo.hide(); },
    final() { select(POL.length - 1); term.show(); exitEl.classList.add('in'); typo.show(); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < POL.length; i++) {
        if (d.stopAuto) return;
        select(i); term.hide(); exitEl.classList.remove('in');
        await wait(500, me);
        if (d.stopAuto) return;
        await term.play(me, 45);
        exitEl.classList.add('in');
        await wait(1500, me);
      }
      await typo.play(me, 120);
    }
  });
})();

/* 6. CI: job results and durations from GitHub's API for run 38340979145; the self-check run locally */
(() => {
  const el = $('#d-ci'), list = $('#pm-jobs');
  const JOBS = [
    ['test (20)', 'npm ci, prettier and tsc, npm test', 14],
    ['test (22)', 'npm ci, prettier and tsc, npm test', 15],
    ['examples-fresh', 'scripts/examples.py, then git diff --exit-code', 6],
    ['self-check', 'uses: ./, the action on its own lockfile', 6]
  ];
  list.innerHTML = JOBS.map(([n, what, s]) => `<li class="pm-job"><span class="pm-tick" aria-hidden="true"></span><span class="pm-job-n"><b>${esc(n)}</b><small>${esc(what)}</small></span><span class="pm-job-bar"><i style="--w:${(s / 15) * 100}%"></i></span><span class="pm-job-s">${s} s</span></li>`).join('');
  const jobs = $$('.pm-job', list);
  const term = miniTerm($('#pm-self'), [['dim', '# what self-check runs on a push to main'], ...runLines(CAP.self), ...exitLines(CAP.self)]);
  demo(el, {
    reset() { jobs.forEach(j => j.classList.remove('is-run', 'is-ok')); term.hide(); },
    final() { jobs.forEach(j => { j.classList.remove('is-run'); j.classList.add('is-ok'); }); term.show(); },
    async play(me) {
      await wait(300, me);
      jobs.forEach(j => j.classList.add('is-run'));
      const order = JOBS.map((j, i) => [j[2], i]).sort((a, b) => a[0] - b[0]);
      let t = 0;
      for (const [s, i] of order) { await wait((s - t) * 110, me); t = s; jobs[i].classList.remove('is-run'); jobs[i].classList.add('is-ok'); }
      await wait(400, me);
      await term.play(me, 150);
    }
  });
})();
