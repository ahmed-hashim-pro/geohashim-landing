/* Captured from real runs (see the figcaptions and the research notes) */
const CN_MUT = /*@@DATA:mutants@@*/;
const CN_WIRE = /*@@DATA:relay@@*/;

const cnAttr = s => esc(s).replace(/"/g, '&quot;');
const cnLine = (k, t) => { const s = document.createElement('span'); if (k) s.className = k; s.textContent = t || ' '; return s; };
// A segmented control that the demo animates through until someone picks a side.
const cnSeg = (el, onPick) => {
  const btns = $$('.seg button', el);
  const set = m => btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  btns.forEach(b => b.addEventListener('click', () => onPick(b.dataset.mode)));
  return set;
};

/* Hero terminal: real runs, verbatim apart from npm's banner lines */
PAGE.terminal = {
  scenes: {
    mutants: [
      ['cmd', 'npm run fuzz -- mutants --seeds 2000'],
      ['out', 'variant                   result   first seed  seeds failed  caught by'],
      ['ok', 'correct                   clean    -           0 of 2000     every check held'],
      ['err', 'arrival-order-tie-break   caught   1           95%           convergence'],
      ['err', 'no-causal-buffer          caught   1           100%          convergence'],
      ['err', 'forget-tombstones         caught   1           88%           convergence, order independence'],
      ['err', 'lww-by-arrival            caught   1           88%           convergence, order independence'],
      ['err', 'remove-unobserved         caught   1           70%           convergence, order independence'],
      ['err', 'accept-duplicates         caught   1           93%           convergence, local intent'],
      ['out', ''],
      ['dim', '76.0s. Replay one: npm run fuzz -- run --seed N --bug NAME']
    ],
    hunt: [
      ['cmd', 'npm run fuzz -- hunt --seeds 5000'],
      ['ok', '5000 seeds (1..5000) in 49.5s: 0 failed'],
      ['out', ''],
      ['cmd', 'npm test'],
      ['dim', ' RUN  v5.0.4 packages/crdt'],
      ['out', ' Test Files  2 passed (2)'],
      ['ok', '      Tests  30 passed (30)'],
      ['dim', ' RUN  v5.0.4 apps/relay'],
      ['out', ' Test Files  1 passed (1)'],
      ['ok', '      Tests  7 passed (7)']
    ],
    replay: [
      ['cmd', 'npm run fuzz -- run --seed 7'],
      ['out', 'seed 7: profile {"replicas":4,"steps":256,"dropRate":0.1,"dupRate":0,"maxDelay":5,"partitionRate":0.05}'],
      ['dim', '  {"replicas":4,"ops":258,"delivered":437,"dropped":323,"duplicated":0,"partitions":9}'],
      ['ok', '  converged: all checks hold'],
      ['out', ''],
      ['cmd', 'npm run fuzz -- run --seed 7 --bug arrival-order-tie-break'],
      ['out', 'seed 7, bug arrival-order-tie-break: profile {"replicas":4,"steps":256,"dropRate":0.1,"dupRate":0,"maxDelay":5,"partitionRate":0.05}'],
      ['dim', '  {"replicas":4,"ops":258,"delivered":437,"dropped":323,"duplicated":0,"partitions":9}'],
      ['err', '  FAILED: replicas r0 and r1 diverged: same visible notes, different tombstones or order underneath']
    ]
  },
  order: ['mutants', 'hunt', 'replay'],
  first: 'mutants'
};

/* Tests per file: vitest for the first three, Playwright for the last */
PAGE.tests = [
  ['packages/crdt/test/replica.test.ts', 20, 'var(--blue)'],
  ['packages/crdt/test/fuzz.test.ts', 10, 'var(--magenta)'],
  ['apps/relay/test/relay.test.ts', 7, 'var(--water)'],
  ['e2e/converge.spec.ts (Playwright)', 2, 'var(--yellow)']
];

/* 1. Every edit is an op */
(() => {
  const el = $('#d-ops'), list = $('#cn-ops'), seq = $('#cn-seq'), text = $('#cn-ops-text');
  const OPS = [
    ['Create a note', '{"t":"create","note":"1@a","id":{"c":1,"r":"a"},"seq":1,"deps":{}}'],
    ['Title it “Groceries”', '{"t":"set","note":"1@a","key":"title","value":"Groceries","id":{"c":2,"r":"a"},"seq":2,"deps":{"a":1}}'],
    ['Type “milk”', '{"t":"ins","note":"1@a","after":null,"text":"milk","id":{"c":3,"r":"a"},"seq":3,"deps":{"a":2}}'],
    ['Delete the “i”', '{"t":"del","note":"1@a","targets":["4@a"],"id":{"c":7,"r":"a"},"seq":4,"deps":{"a":3}}'],
    ['Tag it “weekly”', '{"t":"tag+","note":"1@a","tag":"weekly","id":{"c":8,"r":"a"},"seq":5,"deps":{"a":4}}']
  ];
  const CH = [['m', '3@a'], ['i', '4@a'], ['l', '5@a'], ['k', '6@a']];
  list.innerHTML = OPS.map(([w, j]) => `<li><span>${w}</span><code>${esc(j)}</code></li>`).join('');
  seq.innerHTML = CH.map(([c, k]) => `<span class="cn-ch"><b>${c}</b><i>${k}</i></span>`).join('');
  const rows = $$('li', list), chips = $$('.cn-ch', seq);
  const at = n => {
    rows.forEach((r, i) => r.classList.toggle('is-off', i >= n));
    chips.forEach(c => c.classList.toggle('is-off', n < 3));
    chips[1].classList.toggle('is-dead', n >= 4);
    text.textContent = n < 3 ? '""' : n < 4 ? '"milk"' : '"mlk"';
  };
  demo(el, {
    reset() { at(0); },
    final() { at(5); },
    async play(me) {
      await wait(350, me);
      for (let n = 1; n <= 5; n++) { at(n); await wait(n === 3 || n === 4 ? 1300 : 800, me); }
    }
  });
})();

/* Stages 2 and 3: cases run on the correct replica and with one deliberate bug */
function cnCases(id, wrapSel, CASES) {
  const el = $(id), wrap = $(wrapSel);
  wrap.innerHTML = CASES.map(c => `<div class="cn-case"><p class="cn-case-t">${c.title}</p><ul class="cn-opl">${
    c.ops.map(([who, op]) => `<li><b>${who}</b><code>${esc(op)}</code></li>`).join('')}</ul><div class="cn-res">${
    c.rows.map(([label, ok, bug]) => `<div class="cn-row"><span>${label}</span><span class="cn-val"><code data-ok="${cnAttr(ok[0])}" data-bug="${cnAttr(bug[0])}"></code><small data-ok="${cnAttr(ok[1] || '')}" data-bug="${cnAttr(bug[1] || '')}"></small></span></div>`).join('')
  }</div><p class="cn-verdict" data-ok="${cnAttr(c.ok)}" data-bug="${cnAttr(c.bug)}"></p></div>`).join('');
  const cases = $$('.cn-case', wrap);
  let picked = false;
  const show = m => {
    $$('[data-ok]', wrap).forEach(n => { n.textContent = n.dataset[m]; });
    $$('.cn-verdict', wrap).forEach(v => v.classList.toggle('is-bad', m === 'bug'));
    $$('.cn-row code', wrap).forEach(n => n.classList.toggle('cn-bad', m === 'bug' && n.dataset.bug !== n.dataset.ok));
    setSeg(m);
  };
  const setSeg = cnSeg(el, m => { picked = true; cases.forEach(c => c.classList.remove('is-off')); show(m); });
  demo(el, {
    reset() { picked = false; cases.forEach(c => c.classList.add('is-off')); show('ok'); },
    final() { cases.forEach(c => c.classList.remove('is-off')); if (!picked) show('ok'); },
    async play(me) {
      await wait(300, me);
      for (const c of cases) { c.classList.remove('is-off'); await wait(700, me); }
      await wait(1800, me);
      if (!picked) show('bug');
      await wait(3600, me);
      if (!picked) show('ok');
    }
  }).prepare = () => { picked = false; };
}

cnCases('#d-rga', '#cn-rga', [
  { title: 'A types “milk” and B types “eggs”, both at the start, at once',
    ops: [['a', 'ins "milk" after null, id 3@a'], ['b', 'ins "eggs" after null, id 3@b']],
    rows: [['Gets a’s op first', ['"eggsmilk"', '3@b 4@b 5@b 6@b 3@a 4@a 5@a 6@a'], ['"eggsmilk"', '3@b 4@b 5@b 6@b 3@a 4@a 5@a 6@a']],
      ['Gets b’s op first', ['"eggsmilk"', '3@b 4@b 5@b 6@b 3@a 4@a 5@a 6@a'], ['"milkeggs"', '3@a 4@a 5@a 6@a 3@b 4@b 5@b 6@b']]],
    ok: 'Same on both: 3@b is greater than 3@a, so “eggs” goes first', bug: 'Diverged: each replica kept the order things arrived in' },
  { title: 'A deletes the “b” of “abc” while B types “X” after it',
    ops: [['a', 'del targets ["4@a"], id 6@a'], ['b', 'ins "X" after "4@a", id 6@b']],
    rows: [['Replica a', ['"aXc"', '3@a ~4@a 6@b 5@a'], ['"acX"', '3@a 5@a 6@b']],
      ['Replica b', ['"aXc"', '3@a ~4@a 6@b 5@a'], ['"aXc"', '3@a 6@b 5@a']]],
    ok: 'Same on both: the tombstone ~4@a still anchors the X', bug: 'Diverged: a had already removed the “b”, so the X had no anchor and went to the end' }
]);

cnCases('#d-meta', '#cn-meta', [
  { title: 'Both rename the note at once',
    ops: [['a', 'set title "groceries", id 3@a'], ['b', 'set title "errands", id 3@b']],
    rows: [['Replica a', ['errands'], ['errands']], ['Replica b', ['errands'], ['groceries']]],
    ok: 'Same on both: the greatest id, 3@b, wins', bug: 'Diverged: each kept whichever title arrived last' },
  { title: 'B removes the tag “home” while A adds it again',
    ops: [['b', 'tag- "home", removes ["3@a"], id 4@b'], ['a', 'tag+ "home", id 4@a']],
    rows: [['Replica a', ['["home"]'], ['[]']], ['Replica b', ['["home"]'], ['["home"]']]],
    ok: 'Same on both: the removal cancels only the add it saw, 3@a', bug: 'Diverged: the removal also cancelled 4@a, which b had never seen' }
]);

/* 4. Causal delivery */
(() => {
  const el = $('#d-causal'), arr = $('#cn-arr'), waitBox = $('#cn-wait'), applied = $('#cn-applied'), log = $('#cn-causal-log'), bugs = $('#cn-cbugs');
  const IN = ['ins "x" 2@a, seq 2, deps {a:1}', 'create 1@a, seq 1', 'ins "x" 2@a, seq 2, again'];
  const LOG = [
    ['b.receive(ins)    → 0   pending 1', ''],
    ['b.receive(create) → 2   pending 0   text "x"', 'ok'],
    ['b.receive(ins)    → 0   ops 2       text "x"', 'dim']
  ];
  arr.innerHTML = IN.map(t => `<li><code>${esc(t)}</code></li>`).join('');
  const items = $$('li', arr);
  const chip = (t, cls = '') => { const c = document.createElement('code'); c.className = `cn-chip ${cls}`; c.textContent = t; return c; };
  const setLog = n => log.replaceChildren(...LOG.slice(0, n).map(([t, k]) => cnLine(k, t)));
  const state = n => {
    items.forEach((it, i) => { it.classList.toggle('is-now', i === n - 1); it.classList.toggle('is-done', i < n - 1); it.classList.toggle('is-dup', n >= 3 && i === 2); });
    waitBox.replaceChildren(...(n === 1 ? [chip('ins 2@a')] : []));
    applied.replaceChildren(...(n >= 2 ? [chip('create 1@a'), chip('ins 2@a')] : []));
    setLog(n);
    bugs.classList.toggle('is-off', n < 3);
  };
  demo(el, {
    reset() { state(0); },
    final() { state(3); items.forEach(it => it.classList.remove('is-now')); },
    async play(me) {
      for (let n = 1; n <= 3; n++) { await wait(n === 1 ? 500 : 1600, me); state(n); }
      await wait(900, me);
      items.forEach(it => it.classList.remove('is-now'));
    }
  });
})();

/* 5. The fuzzer: every variant against 2,000 seeds */
(() => {
  const el = $('#d-fuzz'), box = $('#cn-mut'), legend = $('#cn-legend');
  const COL = { convergence: 'var(--blue)', 'order independence': 'var(--magenta)', 'local intent': 'var(--yellow)' };
  const N = CN_MUT.seeds;
  legend.innerHTML = Object.entries(COL).map(([k, c]) => `<span><i class="cn-sw" style="--c:${c}"></i>Caught by ${k}</span>`).join('');
  box.innerHTML = CN_MUT.rows.map(([name, failed, by]) => {
    const segs = Object.entries(by).map(([k, n]) => `<i style="--c:${COL[k]};width:${(n / N * 100).toFixed(2)}%" title="${k}: ${n}"></i>`).join('');
    const pct = failed ? `${Math.round(failed / N * 100)}%` : 'clean';
    const tip = failed ? Object.entries(by).map(([k, n]) => `${k} ${n.toLocaleString('en-US')}`).join(', ') : 'every check held';
    return `<div class="cn-mrow${failed ? '' : ' is-clean'}" role="row"><code role="cell">${name}</code><span class="cn-track" role="cell"><span class="cn-fill">${segs}</span></span><b role="cell">${pct}</b><small role="cell">${failed ? `${failed.toLocaleString('en-US')} of ${N.toLocaleString('en-US')} seeds failed: ${tip}` : `0 of ${N.toLocaleString('en-US')} seeds failed, ${tip}`}</small></div>`;
  }).join('');
  const rows = $$('.cn-mrow', box);
  demo(el, {
    reset() { rows.forEach(r => r.classList.add('is-off')); },
    final() { rows.forEach(r => r.classList.remove('is-off')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.remove('is-off'); await wait(420, me); }
    }
  });
})();

/* 6. The relay: the captured message log */
(() => {
  const el = $('#d-relay'), list = $('#cn-wire'), stored = $('#cn-stored');
  list.innerHTML = CN_WIRE.map(([from, to, msg], i) => {
    if (from === 'note') return `<li class="cn-note">${esc(msg)}</li>`;
    const cls = msg === 'not json' || from === 'E' ? ' is-bad' : i === 11 ? ' is-dup' : '';
    const extra = i === 11 ? '<em>same op again: stored once, not forwarded</em>' : '';
    return `<li class="cn-msg${cls}${from === 'relay' ? ' is-down' : ''}"><span>${from} → ${to}</span><code>${esc(msg)}</code>${extra}</li>`;
  }).join('');
  const items = $$('li', list);
  const at = n => {
    items.forEach((it, i) => it.classList.toggle('is-off', i >= n));
    const s = n ? CN_WIRE[n - 1][3] : 0;
    stored.textContent = `${s} op${s === 1 ? '' : 's'}`;
  };
  demo(el, {
    reset() { at(0); },
    final() { at(items.length); },
    async play(me) {
      await wait(300, me);
      for (let n = 1; n <= items.length; n++) { at(n); await wait(CN_WIRE[n - 1][0] === 'note' ? 900 : 520, me); }
    }
  });
})();

/* 7. Two browsers: the end-to-end test's three steps */
(() => {
  const el = $('#d-browsers'), steps = $$('#cn-steps li'), tabs = $$('#cn-two .cn-tab');
  // [title, lines, new-line indexes, tags] per browser, per step
  const S = [
    { net: 'online', a: ['Groceries', ['milk', 'eggs'], [], ''], b: ['Groceries', ['milk', 'eggs'], [0, 1], ''] },
    { net: 'offline', a: ['Groceries', ['milk', 'eggs', 'bread'], [2], 'weekly'], b: ['Groceries for Sat', ['TODO milk', 'eggs', 'coffee'], [0, 2], ''] },
    { net: 'online', a: ['Groceries for Sat', ['TODO milk', 'eggs', 'coffee', 'bread'], [0, 2], 'weekly'], b: ['Groceries for Sat', ['TODO milk', 'eggs', 'coffee', 'bread'], [3], 'weekly'] }
  ];
  const fill = (tab, [title, lines, fresh, tags], net) => {
    $('[data-net]', tab).textContent = net;
    $('[data-net]', tab).classList.toggle('is-off-net', net === 'offline');
    $('[data-title]', tab).textContent = title;
    $('[data-body]', tab).replaceChildren(...lines.map((l, i) => cnLine(fresh.includes(i) ? 'cn-new' : '', l)));
    $('[data-tags]', tab).textContent = tags ? `# ${tags}` : '';
  };
  const at = n => {
    steps.forEach((s, i) => { s.classList.toggle('is-active', i === n); s.classList.toggle('is-pass', i < n || (n === 2 && i === 2)); });
    const s = S[n];
    fill(tabs[0], s.a, s.net);
    fill(tabs[1], s.b, s.net);
    tabs.forEach(t => { t.classList.remove('is-swap'); t.getBoundingClientRect(); t.classList.add('is-swap'); });
  };
  const blank = () => { steps.forEach(s => s.classList.remove('is-active', 'is-pass')); tabs.forEach(t => t.classList.add('is-off')); };
  demo(el, {
    reset() { blank(); },
    final() { tabs.forEach(t => t.classList.remove('is-off')); at(2); },
    async play(me) {
      await wait(300, me);
      tabs.forEach(t => t.classList.remove('is-off'));
      for (let n = 0; n < 3; n++) { at(n); await wait(2400, me); }
    }
  });
})();
