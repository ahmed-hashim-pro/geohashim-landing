/* Every report, error and verdict below is verbatim output of admission-replay at commit 46bfbfb.
   CAP holds whole runs with their exit codes; MONTH is each candidate's verdict on every write, from --json. */
const CAP = /*@@DATA:captures@@*/;
const MONTH = /*@@DATA:month@@*/;

const toneOf = t => (/^admission-replay: |^LET THROUGH|^BLOCKED [1-9]|do not compile|^ {6}admitted: |^ {2}policy .*compilation failed|^ \| / .test(t) ? 'err' : /^CAUGHT|every expression compiles/.test(t) ? 'ok' : /^note: |^ {6}audit ID |^ {2}\.\.\. /.test(t) ? 'dim' : 'out');
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
      compare: [['dim', '# three candidate policies over a month of writes'], ...runLines(CAP.compare)],
      replay: [['dim', '# one candidate, write by write'], ...runLines(CAP.replayStrict)],
      gate: [['dim', '# the policy that holds, as a CI gate'], ...runLines(CAP.targetedGate), gap, ...exitLines(CAP.targetedGate)],
      check: [['dim', '# parse strictly, compile every CEL expression'], ...runLines(CAP.checkAll)]
    },
    order: ['compare', 'replay', 'gate', 'check'],
    first: 'compare'
  };
})();

/* Tests per package, from go test -count=1 -json ./... (subtests counted) */
PAGE.tests = [['policy', 15, 'var(--blue)'], ['engine', 7, 'var(--magenta)'], ['replay', 7, 'var(--yellow)'], ['history', 5, 'var(--water)'], ['cmd/admission-replay', 4, 'var(--green)']];

/* 1. Read: one event's fields light up and fill in the write they become */
(() => {
  const el = $('#d-read'), ev = $('#ar-ev'), card = $('#ar-w'), who = $('#ar-who');
  // examples/audit.log line 103, abridged; every value is verbatim
  const EVENT = [
    ['', '"level": "RequestResponse",'],
    ['id', '"auditID": "5e9a005a-0000-4000-8000-00000000005a",'],
    ['', '"stage": "ResponseComplete",'],
    ['what', '"verb": "update",'],
    ['', '"user": { "username": "kubernetes-admin", ... },'],
    ['who', '"impersonatedUser": { "username": "alice", "groups": ["shop-devs", ...] },'],
    ['what', '"objectRef": { "resource": "deployments", "namespace": "shop-prod", "name": "payments", "apiGroup": "apps" },'],
    ['then', '"responseStatus": { "code": 200 },'],
    ['obj', '"responseObject": { "kind": "Deployment", ... "image": "docker.io/alice-dev/payments:hotfix-2" ... },'],
    ['when', '"requestReceivedTimestamp": "2026-09-12T22:47:00.000000Z",']
  ];
  const FIELDS = [
    ['when', 'When', '2026-09-12 22:47'],
    ['who', 'Who', 'alice, not the admin credential she came through'],
    ['what', 'What', 'update deployments shop-prod/payments'],
    ['obj', 'Object', 'the Deployment as stored, image docker.io/alice-dev/payments:hotfix-2'],
    ['then', 'At the time', 'admitted (200)'],
    ['id', 'Audit ID', '5e9a005a-…-00000000005a']
  ];
  ev.innerHTML = EVENT.map(([k, t]) => `<li data-k="${k}"><code>${esc(t)}</code></li>`).join('');
  card.innerHTML = FIELDS.map(([k, label, v]) => `<div data-k="${k}"><dt>${label}</dt><dd>${esc(v)}</dd></div>`).join('');
  const counts = {};
  MONTH.writes.forEach(w => { const u = w[1].startsWith('sa:') ? 'controllers' : w[1]; counts[u] = (counts[u] || 0) + 1; });
  const refused = MONTH.writes.filter(w => w[5][0] === 'x').length;
  const order = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  who.innerHTML = order.map(([u, n]) => `<li><span>${esc(u)}</span><i class="ar-who-bar" style="--w:${(n / order[0][1]) * 100}%"></i><b>${n}</b></li>`).join('')
    + `<li class="ar-who-x"><span>refused by the cluster then</span><i class="ar-who-bar" style="--w:${(refused / order[0][1]) * 100}%"></i><b>${refused}</b></li>`;
  const pairs = FIELDS.map(([k]) => [$$(`li[data-k="${k}"]`, ev), $(`div[data-k="${k}"]`, card)]);
  const rows = $$('li', who);
  demo(el, {
    reset() { pairs.forEach(([ls, d]) => { ls.forEach(l => l.classList.remove('is-on')); d.classList.remove('in'); }); rows.forEach(r => r.classList.remove('in')); },
    final() { pairs.forEach(([ls, d]) => { ls.forEach(l => l.classList.add('is-on')); d.classList.add('in'); }); rows.forEach(r => r.classList.add('in')); },
    async play(me) {
      await wait(400, me);
      for (const [ls, d] of pairs) {
        ls.forEach(l => l.classList.add('is-on'));
        await wait(380, me);
        d.classList.add('in');
        await wait(420, me);
      }
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(140, me); }
    }
  });
})();

/* 2. Rebuild: the DaemonSet's three writes, old object against new, then the half-month log */
(() => {
  const el = $('#d-rebuild'), tl = $('#ar-tl'), oldEl = $('#ar-old'), newEl = $('#ar-new'), cut = $('#ar-cut');
  const WRITES = [
    ['Sep 1 15:30', 'dana', 'create', 'line 49'],
    ['Sep 19 03:12', 'bob', 'update', 'line 142, labelled bad'],
    ['Sep 19 09:40', 'dana', 'update', 'line 143']
  ];
  tl.innerHTML = WRITES.map(([t, u, v, n], i) => `<li data-i="${i}"><b>${t}</b><span>${u} ${v}s daemonsets monitoring/log-shipper</span><small>${n}</small></li>`).join('');
  // Abridged from the responseObjects of lines 49 and 142; [changed?, text]
  const OLD = [
    [0, 'containers:'],
    [0, '- name: shipper'],
    [0, '  image: registry.example.com/platform/log-shipper:3.2.0'],
    [0, '  volumeMounts:'],
    [0, '  - {name: varlog, mountPath: /var/log, readOnly: true}'],
    [0, 'volumes:'],
    [0, '- {name: varlog, hostPath: {path: /var/log}}']
  ];
  const NEW = [
    [0, 'containers:'],
    [0, '- name: shipper'],
    [0, '  image: registry.example.com/platform/log-shipper:3.2.0'],
    [1, '  securityContext: {privileged: true}'],
    [0, '  volumeMounts:'],
    [0, '  - {name: varlog, mountPath: /var/log, readOnly: true}'],
    [1, '  - {name: host, mountPath: /host}'],
    [0, 'volumes:'],
    [0, '- {name: varlog, hostPath: {path: /var/log}}'],
    [1, '- {name: host, hostPath: {path: /}}']
  ];
  const lines = arr => arr.map(([c, t]) => `<span${c ? ' class="ar-chg"' : ''}>${esc(t)}</span>`).join('');
  oldEl.innerHTML = lines(OLD);
  newEl.innerHTML = lines(NEW);
  const ROWS = [
    ['Whole month, Sep 15 to 30', [12, 2, 10, 0]],
    ['Log cut at Sep 15', [8, 1, 8, 25]],
    ['Cut log, with --initial', [12, 2, 10, 0]]
  ];
  cut.insertAdjacentHTML('beforeend', ROWS.map(([n, v], i) => `<div class="ar-cut-row" role="row" data-i="${i}"><span role="rowheader">${esc(n)}</span>${v.map((x, k) => `<span role="cell"${k === 3 && x ? ' class="ar-bad-n"' : ''}><small class="ar-cut-l">${['strict-baseline blocks', 'targeted blocks', 'targeted warns', 'Skipped'][k]} </small>${x}</span>`).join('')}</div>`).join(''));
  const items = $$('li', tl), chg = $$('.ar-chg', newEl), objs = $$('.ar-obj', el), cutRows = $$('.ar-cut-row:not(.ar-cut-head)', cut);
  const notes = CAP.cut.out.filter(t => t.startsWith('note: '));
  const term = miniTerm($('#ar-cut-term'), [['cmd', CAP.cut.cmd], ...notes.map(t => ['dim', t])]);
  demo(el, {
    reset() { items.forEach(i => i.classList.remove('in', 'is-now')); objs.forEach(o => o.classList.remove('in')); chg.forEach(c => c.classList.remove('on')); cutRows.forEach(r => r.classList.remove('in')); term.hide(); },
    final() { items.forEach(i => i.classList.add('in')); items[1].classList.add('is-now'); objs.forEach(o => o.classList.add('in')); chg.forEach(c => c.classList.add('on')); cutRows.forEach(r => r.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const i of items) { i.classList.add('in'); await wait(320, me); }
      items[1].classList.add('is-now');
      await wait(500, me);
      objs[0].classList.add('in');
      await wait(600, me);
      objs[1].classList.add('in');
      await wait(500, me);
      for (const c of chg) { c.classList.add('on'); await wait(320, me); }
      await wait(700, me);
      for (const r of cutRows) { r.classList.add('in'); await wait(650, me); }
      await term.play(me, 140);
    }
  });
})();

/* 3. Evaluate: which of strict-baseline's validations failed on five real writes; then three broken policies */
(() => {
  const el = $('#d-admit'), mx = $('#ar-mx');
  const VALS = ['images must come from registry.example.com', 'images must be pinned to a tag other than latest', 'every container needs CPU and memory limits', 'pods must run as non-root', 'privileged containers are not allowed'];
  const SHORT = ['Trusted registry', 'Pinned tag', 'CPU and memory limits', 'Non-root', 'Not privileged'];
  const WRITES = [
    ['ci-deploy', 'create', 'shop-staging/search', 'deployments', 'Sep 1 10:12'],
    ['dana', 'create', 'platform/ingress-proxy', 'deployments', 'Sep 1 15:00'],
    ['alice', 'update', 'shop-prod/payments', 'deployments', 'Sep 12 22:47'],
    ['bob', 'update', 'shop-prod/checkout', 'deployments', 'Sep 26 16:05'],
    ['bob', 'update', 'monitoring/log-shipper', 'daemonsets', 'Sep 19 03:12']
  ];
  const strict = MONTH.policies.indexOf('strict-baseline');
  const FAILS = {
    'shop-staging/search': ['every container needs CPU and memory limits'],
    'platform/ingress-proxy': ['images must come from registry.example.com', 'pods must run as non-root'],
    'shop-prod/payments': ['images must come from registry.example.com'],
    'shop-prod/checkout': [],
    'monitoring/log-shipper': null
  };
  const NOTE = { 'shop-prod/payments': 'labelled bad', 'shop-prod/checkout': 'labelled bad: privileged init container', 'monitoring/log-shipper': 'labelled bad' };
  // MONTH times are minutes after the first write, Sep 1 09:00
  const minutes = s => { const [, d, h, m] = s.match(/Sep (\d+) (\d+):(\d+)/).map(Number); return (d - 1) * 1440 + h * 60 + m - 540; };
  const verdict = w => {
    const row = MONTH.writes.find(x => x[4] === w[2] && x[1] === w[0] && Math.abs(x[0] - minutes(w[4])) <= 1);
    return row ? row[5][strict] : '?';
  };
  mx.innerHTML = `<thead><tr><th scope="col"><span class="vh">Validation</span></th>${WRITES.map(w => `<th scope="col"><b>${esc(w[0])}</b><small>${esc(w[1])} ${esc(w[3])}<br>${esc(w[2])}</small><small>${esc(w[4])}${NOTE[w[2]] ? `, ${NOTE[w[2]]}` : ''}</small></th>`).join('')}</tr></thead><tbody>`
    + VALS.map((v, i) => `<tr><th scope="row" title="${esc(v)}">${SHORT[i]}</th>${WRITES.map(w => {
      const f = FAILS[w[2]];
      const s = f === null ? 'skip' : f.includes(v) ? 'fail' : 'pass';
      return `<td data-v="${s}"><i class="ar-dot" data-v="${s}"></i><span class="vh">${s === 'skip' ? 'not matched' : s === 'fail' ? 'failed' : 'passed'}</span></td>`;
    }).join('')}</tr>`).join('')
    + `<tr class="ar-mx-v"><th scope="row">Verdict</th>${WRITES.map(w => {
      const v = verdict(w), f = FAILS[w[2]];
      const t = v === 'b' || v === 'c' ? `Denied${f.length > 1 ? `, ${f.length} failures listed` : ''}` : f === null ? 'Admitted, not matched' : 'Admitted';
      return `<td data-r="${v === 'b' || v === 'c' ? 'deny' : 'admit'}">${t}</td>`;
    }).join('')}</tr></tbody>`;
  const cols = WRITES.map((_, i) => $$(`tr > td:nth-child(${i + 2})`, mx));
  const POL = [
    { label: 'Misspelt field', lines: [...runLines(CAP.errMisspelt), ['dim', `# exit ${CAP.errMisspelt.exit}`]] },
    { label: 'CEL typo', lines: [...runLines(CAP.errCel), ['dim', `# exit ${CAP.errCel.exit}`]] },
    { label: 'Wrong key', lines: [...runLines(CAP.checkBadField), ['dim', `# exit ${CAP.checkBadField.exit}: it compiles`], ...runLines(CAP.replayBadField).slice(0, 8)] }
  ];
  const seg = $('#ar-pol-seg');
  seg.innerHTML = POL.map((p, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(p.label)}</button>`).join('');
  const btns = $$('button', seg);
  let term = null, d = null;
  const select = i => { btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); term = miniTerm($('#ar-pol-term'), POL[i].lines); };
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); term.show(); }));
  d = demo(el, {
    reset() { cols.flat().forEach(c => c.classList.remove('in')); select(0); term.hide(); },
    final() { cols.flat().forEach(c => c.classList.add('in')); select(POL.length - 1); term.show(); },
    async play(me) {
      d.stopAuto = false;
      await wait(300, me);
      for (const col of cols) {
        for (const c of col) { c.classList.add('in'); await wait(110, me); }
        await wait(260, me);
      }
      for (let i = 0; i < POL.length; i++) {
        if (d.stopAuto) return;
        await wait(500, me);
        if (d.stopAuto) return;
        select(i); term.hide();
        await term.play(me, 90);
        await wait(900, me);
      }
    }
  });
})();

/* 4. Score: every write on a September timeline, one lane per candidate, then compare's table */
(() => {
  const el = $('#d-score'), box = $('#ar-strip');
  const W = MONTH.writes, END = 30 * 24 * 60;
  const LABEL = { b: 'blocked', w: 'warned', c: 'caught', m: 'let through', x: 'refused by the cluster', '.': 'admitted' };
  const ORDER = ['targeted', 'registry-allowlist', 'strict-baseline'];
  const days = [1, 8, 15, 22, 29].map(d => `<span style="--x:${(Math.max(0, (d - 1) * 1440 - 540) / END) * 100}%">Sep ${d}</span>`).join('');
  box.innerHTML = ORDER.map(name => {
    const k = MONTH.policies.indexOf(name);
    const n = { b: 0, w: 0, c: 0, m: 0 };
    W.forEach(w => { if (w[5][k] in n) n[w[5][k]]++; });
    const sum = `${n.c} of ${n.c + n.m} bad caught, ${n.b} blocked, ${n.w} warned`;
    return `<div class="ar-lane" data-p="${name}" tabindex="0" aria-label="${name}: ${sum}"><p class="ar-lane-n"><code>${name}</code><small>${sum}</small></p><div class="ar-track">${W.map(w => {
      const v = w[5][k];
      return `<i class="ar-tk" data-v="${v}" style="--x:${(w[0] / END) * 100}%" title="${esc(`${w[1]} ${w[2]} ${w[3]} ${w[4]}: ${LABEL[v]}`)}"></i>`;
    }).join('')}</div></div>`;
  }).join('') + `<div class="ar-axis" aria-hidden="true">${days}</div><i class="ar-sweep" aria-hidden="true"></i>`;
  const ticks = $$('.ar-track', box).map(t => $$('.ar-tk', t));
  const sweep = $('.ar-sweep', box), lanes = $$('.ar-lane', box);
  const term = miniTerm($('#ar-score-term'), runLines(CAP.compare).slice(0, 9));
  const STEPS = 30;
  const showTo = f => ticks.forEach(ts => ts.forEach((t, i) => t.classList.toggle('in', W[i][0] / END <= f)));
  demo(el, {
    reset() { showTo(-1); sweep.style.transform = 'scaleX(0)'; sweep.classList.remove('on'); lanes.forEach(l => l.classList.remove('done')); term.hide(); },
    final() { showTo(2); sweep.style.transform = 'scaleX(1)'; lanes.forEach(l => l.classList.add('done')); term.show(); },
    async play(me) {
      await wait(300, me);
      sweep.classList.add('on');
      for (let s = 1; s <= STEPS; s++) {
        const f = s / STEPS;
        sweep.style.transform = `scaleX(${f})`;
        showTo(f);
        await wait(95, me);
      }
      sweep.classList.remove('on');
      lanes.forEach(l => l.classList.add('done'));
      await wait(500, me);
      await term.play(me, 110);
    }
  });
})();

/* 5. Label: the three audit IDs found in the log, then a typo and no labels at all */
(() => {
  const el = $('#d-label'), list = $('#ar-bad');
  const LABELS = [
    ['5e9a005a-0000-4000-8000-00000000005a', 'payments hotfix image from a personal Docker Hub account', 'alice, Sep 12 22:47, update deployments shop-prod/payments'],
    ['5e9a0081-0000-4000-8000-000000000081', "log-shipper DaemonSet made privileged with the host's / mounted read-write", 'bob, Sep 19 03:12, update daemonsets monitoring/log-shipper'],
    ['5e9a00a6-0000-4000-8000-0000000000a6', 'checkout gets a privileged init container (sysctl tweak)', 'bob, Sep 26 16:05, update deployments shop-prod/checkout']
  ];
  list.innerHTML = LABELS.map(([id, note, w]) => `<li><code class="ar-id">${id}</code><span class="ar-note">${esc(note)}</span><span class="ar-found">Found: ${esc(w)}</span></li>`).join('');
  const rows = $$('li', list);
  const noBad = CAP.compareNoBad.out;
  const term = miniTerm($('#ar-bad-term'), [...runLines(CAP.errBadId), ['dim', `# exit ${CAP.errBadId.exit}`], ['cmd', CAP.compareNoBad.cmd], ...noBad.slice(-1).map(t => ['out', t])]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-found')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in', 'is-found')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(380, me); r.classList.add('is-found'); await wait(520, me); }
      await wait(400, me);
      await term.play(me, 140);
    }
  });
})();

/* 6. Gate: two candidates through --fail-on-block --fail-on-miss; CI from GitHub's API for run 38611892810 */
(() => {
  const el = $('#d-gate'), box = $('#ar-gates'), list = $('#ar-jobs');
  const GATES = [['strict-baseline', CAP.strictGate], ['targeted', CAP.targetedGate]];
  box.innerHTML = GATES.map(([n, c], i) => `<div class="ar-gate" data-code="${c.exit}"><p class="ar-gate-h"><code>${n}</code><span class="ar-exit"><span>exit</span><b>${c.exit}</b></span></p><div class="mini-term ar-mt" id="ar-gate-${i}"></div></div>`).join('');
  const terms = GATES.map(([, c], i) => {
    const head = c.out.slice(0, c.out.findIndex(t => /^(LET THROUGH|CAUGHT)/.test(t)) + 1);
    return miniTerm($(`#ar-gate-${i}`), [['cmd', c.cmd], ...head.map(t => [toneOf(t), t]), ['dim', '  ...'], ...exitLines(c)]);
  });
  const exits = $$('.ar-exit', box);
  const JOBS = [
    ['test (1.24)', 'vet, gofmt, go test -race', 37],
    ['test (stable)', 'vet, gofmt, go test -race', 199],
    ['docs-fresh', 'make docs, then git diff --exit-code', 27],
    ['crosscheck', 'kind with Kubernetes 1.34, every candidate', 240]
  ];
  list.innerHTML = JOBS.map(([n, what, s]) => `<li class="ar-job"><span class="ar-tick" aria-hidden="true"></span><span class="ar-job-n"><b>${esc(n)}</b><small>${esc(what)}</small></span><span class="ar-job-bar"><i style="--w:${(s / 240) * 100}%"></i></span><span class="ar-job-s">${s} s</span></li>`).join('');
  const jobs = $$('.ar-job', list);
  demo(el, {
    reset() { terms.forEach(t => t.hide()); exits.forEach(x => x.classList.remove('in')); jobs.forEach(j => j.classList.remove('is-run', 'is-ok')); },
    final() { terms.forEach(t => t.show()); exits.forEach(x => x.classList.add('in')); jobs.forEach(j => { j.classList.remove('is-run'); j.classList.add('is-ok'); }); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < terms.length; i++) { await terms[i].play(me, 80); exits[i].classList.add('in'); await wait(700, me); }
      jobs.forEach(j => j.classList.add('is-run'));
      const order = JOBS.map((j, i) => [j[2], i]).sort((a, b) => a[0] - b[0]);
      let t = 0;
      for (const [s, i] of order) { await wait((s - t) * 9, me); t = s; jobs[i].classList.remove('is-run'); jobs[i].classList.add('is-ok'); }
    }
  });
})();
