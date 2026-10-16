/* ota-safe. Every number below was printed by ota-sim, or read from its flash snapshots, at 79b2335 (see the figcaptions). */
const SIM = /*@@DATA:sim@@*/;
const osPre = (pre, rows) => { pre.innerHTML = rows.map(([k, t]) => `<span class="${k}">${esc(t)}</span>`).join('\n'); };
const osTone = t => (/BRICK|UNSAFE|STUCK|POWER CUT|crashes|refused/.test(t) ? 'err' : /confirmed$|^ok$/.test(t.trim()) ? 'ok' : 'out');
const osOut = text => text.split('\n').map(t => [osTone(t), t]);
const osRun = (cmd, text, code) => [['cmd', cmd], ...osOut(text), ['cmd', 'echo $?'], [code ? 'err' : 'ok', String(code)]];
const OS_HEAD = 'scheme             no cut flash ops       cuts       ok  bricked    stuck   unsafe';
const OS_MATRIX = `good: v1 installs v2, v2 installs v3; every version healthy
${OS_HEAD}
naive in-place         ok        91        443        6      437        0        0   98.6% bricked
naive A/B              ok        95        459      445       14        0        0   3.1% bricked
ota-safe               ok       103        491      491        0        0        0   every cut ok

bad-update: the same, but v3 crashes before it can confirm itself
${OS_HEAD}
naive in-place      STUCK        91        443        0      437        6        0   98.6% bricked, 1.4% stuck
naive A/B           STUCK        95        459        0       14      445        0   3.1% bricked, 96.9% stuck
ota-safe               ok       107        507      507        0        0        0   every cut ok

depth 1. A cut is one erase or program interrupted one way; replay one with:
  ota-sim life --scheme NAME --workload W --cut AT:TEAR`;
const OS_V2 = `  op    0  boot v1 from slot A
  op    0  v1 installs v2`;
const OS_GOOD_REST = `  op   46  v2 written; reboot into trial
  op   48  boot v2 from slot B
  op   50  v2 confirmed
  op   50  v2 installs v3
  op   99  v3 written; reboot into trial
  op  101  boot v3 from slot A
  op  103  v3 confirmed`;
const OS_LIFE = {
  naive: `naive A/B / good workload / cut 44:erase-0
power on
${OS_V2}
  op   44  POWER CUT at op 44 (erase sector 0x00000)
power on (#2)
  op    0  boot: BRICK (active-slot flag is neither A nor B)
BRICKED: active-slot flag is neither A nor B`,
  safe: `ota-safe / good workload / cut 44:erase-0
power on
${OS_V2}
  op   44  POWER CUT at op 44 (erase sector 0x01000)
power on (#2)
${OS_V2}
${OS_GOOD_REST}
ok`,
  good: `ota-safe / good workload
power on
${OS_V2}
${OS_GOOD_REST}
ok`,
  bad: `ota-safe / bad-update workload
power on
${OS_V2}
  op   46  v2 written; reboot into trial
  op   48  boot v2 from slot B
  op   50  v2 confirmed
  op   50  v2 installs v3
  op   99  v3 written; reboot into trial
  op  101  boot v3 from slot A
  op  101  v3 crashes before confirming
  op  103  boot v3 from slot A
  op  103  v3 crashes before confirming
  op  105  boot v3 from slot A
  op  105  v3 crashes before confirming
  op  107  boot v2 from slot B
  op  107  v2 installs v3
  op  107  v3 refused (rolled back before); settle on v2
ok`
};
const OS_MUT = [
  ['none (ota-safe)', 'clean', 'ok', '0/998', '-'],
  ['single-meta-copy', 'caught', 'ok', '98/998', 'good 44:erase-0: BRICKED: no valid metadata record'],
  ['no-crc', 'caught', 'ok', '3/998', 'bad-update 102:prefix-2: UNSAFE: unconfirmed v3 booted 4 times (limit 3)'],
  ['ignore-seq', 'caught', 'STUCK', '7104/7104', 'good no cut: STUCK: still rebooting after 16 boots'],
  ['decrement-after-boot', 'caught', 'UNSAFE', '467/942', 'bad-update no cut: UNSAFE: unconfirmed v3 booted 4 times (limit 3)'],
  ['rollback-without-reject', 'caught', 'UNSAFE', '752/1243', 'bad-update no cut: UNSAFE: unconfirmed v3 booted 4 times (limit 3)'],
  ['trial-before-image', 'caught', 'ok', '651/998', 'good 2:before: STUCK: settled on v1, expected v3']
];
const osMutTable = () => ['planted bug              result       no cut  failing cuts   first failure',
  ...OS_MUT.map(([n, r, u, f, w]) => `${n.padEnd(24)} ${r.padEnd(10)} ${u.padStart(8)} ${f.padStart(13)}   ${w}`),
  '', 'both workloads, depth 1. Replay one: ota-sim life --scheme NAME --workload W [--cut AT:TEAR]'].join('\n');

/* Hero terminal */
PAGE.terminal = {
  scenes: {
    matrix: [['cmd', 'ota-sim matrix'], ...osOut(OS_MATRIX)],
    naive: osRun('ota-sim life --scheme naive-ab --cut 44:erase-0', OS_LIFE.naive, 1),
    safe: osRun('ota-sim life --cut 44:erase-0', OS_LIFE.safe, 0),
    mutants: [['cmd', 'ota-sim mutants'], ...osMutTable().split('\n').map(t => ['out', t])]
  },
  order: ['matrix', 'naive', 'safe', 'mutants']
};

/* cargo test --locked: 33 passed, 1 ignored (the depth-2 search) */
PAGE.tests = [['sim/tests/protocol.rs', 11, 'var(--blue)'], ['sim/tests/search.rs', 7, 'var(--magenta)'], ['sim/src/flash.rs', 6, 'var(--water)'], ['sim/tests/cli.rs', 5, 'var(--yellow)'], ['core/src/lib.rs', 4, 'var(--green)']];

const osRec = m => (m ? `seq ${m.seq} · confirmed ${m.conf} v${m.cv} · ${m.trial ? `trial ${m.trial.slot} v${m.trial.v}, ${m.trial.left} left` : 'no trial'}${m.rej ? ` · rejected v${m.rej}` : ''}` : 'no valid record');

/* 1. Flash: the 32 bytes at 0x01000 under each tear */
(() => {
  const el = $('#d-flash'), host = $('#os-tears'), grid = $('#os-bytes'), read = $('#os-flash-read');
  const T = SIM.tears, goal = T[T.length - 1].bytes;
  const label = t => (t.at === 50 ? 'Finished record' : `op ${t.at}: ${t.tear}`);
  host.innerHTML = T.map((t, i) => `<button type="button" data-i="${i}" aria-pressed="false">${esc(label(t))}</button>`).join('');
  $('#os-bytes-key').innerHTML = '<span class="key"><i class="sw os-k-ok"></i>As the record should be</span><span class="key"><i class="sw os-k-ff"></i>Still erased, FF</span><span class="key"><i class="sw os-k-bad"></i>Anything else</span>';
  const btns = $$('button', host);
  grid.innerHTML = Array.from({ length: 32 }, (_, k) => `<span class="os-b"><i>${k}</i><b></b></span>`).join('');
  const cells = $$('.os-b', grid);
  let cur = 3;
  const show = i => {
    cur = i;
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    const t = T[i];
    cells.forEach((c, k) => {
      const h = t.bytes.slice(k * 2, k * 2 + 2);
      $('b', c).textContent = h;
      c.className = `os-b ${h === goal.slice(k * 2, k * 2 + 2) ? 'is-ok' : h === 'ff' ? 'is-ff' : 'is-bad'}`;
    });
    const boot = t.boot.replace(/Slot \{ slot: (\w), version: (\d) \}/, 'v$2 from slot $1');
    read.innerHTML = t.valid
      ? `<b>A valid record</b>: seq 4, v2 confirmed in slot B. The next power-on boots ${esc(boot)}.`
      : `<b>Not a record</b>: <code>Meta::decode</code> rejects it. Sector 0 still holds seq 3, so the next power-on boots ${esc(boot)} as a trial, and the life ends ${esc(t.outcome)}.`;
  };
  btns.forEach(b => b.addEventListener('click', () => show(+b.dataset.i)));
  demo(el, {
    reset() { show(2); },
    final() { show(cur); },
    async play(me) { for (let i = 0; i < T.length; i++) { show(i); await wait(i === T.length - 1 ? 900 : 1100, me); } show(3); }
  });
})();

/* 2. Commit: two sectors, a record written into whichever one isn't current */
(() => {
  const el = $('#d-commit'), secs = $('#os-secs'), steps = $('#os-steps');
  const R = SIM.records.good;
  const WHY = ['provisioned with v1', 'v2 written: trial starts', 'bootloader spends a boot', 'v2 confirms itself', 'v3 written: trial starts', 'bootloader spends a boot', 'v3 confirms itself'];
  secs.innerHTML = [0, 1].map(s => `<div class="os-sec" data-s="${s}"><small>metadata sector ${s}, 0x0${s}000</small><p></p></div>`).join('');
  const box = $$('.os-sec', secs);
  steps.innerHTML = R.map(([op, sec, m], i) => `<li><span>${op < 0 ? 'factory' : `ops ${op - 1}-${op}`}</span><b>${esc(WHY[i])}</b><small>sector ${sec} · ${esc(osRec(m))}</small></li>`).join('');
  const lis = $$('li', steps);
  const state = [null, null];
  const show = upto => {
    state[0] = state[1] = null;
    for (let i = 0; i <= upto; i++) state[R[i][1]] = R[i];
    box.forEach((b, s) => {
      const r = state[s];
      $('p', b).textContent = r ? osRec(r[2]) : 'erased';
      b.classList.toggle('is-cur', !!r && r === R[upto]);
      b.classList.toggle('is-new', !!r && r === R[upto] && upto > 0);
    });
    lis.forEach((l, k) => { l.classList.toggle('in', k <= upto); l.classList.toggle('is-now', k === upto); });
  };
  demo(el, {
    reset() { show(0); lis.forEach((l, k) => l.classList.toggle('in', k === 0)); },
    final() { show(R.length - 1); },
    async play(me) { for (let i = 0; i < R.length; i++) { show(i); await wait(i ? 1000 : 600, me); } }
  });
})();

/* 3. Trial: the bad-update life from v3 on, with the record each step leaves */
(() => {
  const el = $('#d-trial'), pre = $('#os-trial-pre'), rec = $('#os-trial-rec');
  const lines = OS_LIFE.bad.split('\n'), from = lines.findIndex(l => l.includes('op   99'));
  const R = SIM.records['bad-update'];
  const at = op => { let r = R[0]; for (const x of R) if (x[0] < op) r = x; return r; };
  const opOf = l => { const m = l.match(/op\s+(\d+)/); return m ? +m[1] : 999; };
  const show = n => {
    const shown = lines.slice(from, from + n);
    osPre(pre, [['cmd', 'ota-sim life --workload bad-update'], ['dim', '  ...'], ...shown.map(t => [osTone(t), t])]);
    const last = shown[shown.length - 1] || lines[from];
    const r = at(opOf(last));
    const m = r[2];
    rec.innerHTML = `<small>current record, sector ${r[1]}</small><b>seq ${m.seq}</b><dl><dt>confirmed</dt><dd>${m.conf}, v${m.cv}</dd><dt>trial</dt><dd>${m.trial ? `slot ${m.trial.slot}, v${m.trial.v}` : 'none'}</dd><dt>boots left</dt><dd class="os-left">${m.trial ? m.trial.left : 'none'}</dd><dt>rejected</dt><dd>${m.rej ? `v${m.rej}` : 'none'}</dd></dl>`;
  };
  const N = lines.length - from;
  demo(el, {
    reset() { show(1); },
    final() { show(N); },
    async play(me) { for (let n = 1; n <= N; n++) { show(n); await wait(620, me); } }
  });
})();

/* 4. Cut: one column per operation, coloured by the worst tear */
(() => {
  const el = $('#d-cut'), host = $('#os-strips'), read = $('#os-cut-read'), seg = $$('[data-wl]', el);
  const NAME = { o: 'ok', s: 'stuck', b: 'bricked', u: 'unsafe' };
  const TEARS = { e: ['before', 'erase-0', 'erase-1'], p: ['before', 'prefix-1', 'prefix-2', 'prefix-3', 'scatter'] };
  const opText = o => { const [, k, a, n] = o.match(/^(\w)([0-9a-f]+):(\d+)$/); const ad = `0x${a.padStart(5, '0')}`; return k === 'e' ? `erase sector ${ad}` : `program ${n} B at ${ad}`; };
  $('#os-strip-key').innerHTML = ['o', 's', 'b', 'u'].map(k => `<span class="key"><i class="sw os-c-${k}"></i>${NAME[k]}</span>`).join('');
  let wl = 'good', pick = null;
  const render = () => {
    seg.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.wl === wl)));
    host.innerHTML = SIM.strips[wl].map((s, si) => {
      const n = s.tears.join('').length, bad = s.tears.join('').replace(/o/g, '').length;
      return `<div class="os-strip"><p><b>${esc(s.scheme)}</b><span>${bad} of ${n} cuts fail</span></p><div class="os-cols" style="--n:${s.ops.length}">${[...s.worst].map((w, i) => `<button type="button" class="os-c-${w}" data-s="${si}" data-i="${i}" aria-label="op ${i}, ${NAME[w]}"></button>`).join('')}</div></div>`;
    }).join('');
    $$('.os-cols button', host).forEach(b => b.addEventListener('click', () => { pick = [+b.dataset.s, +b.dataset.i]; tell(); }));
    tell();
  };
  const tell = () => {
    $$('.os-cols button', host).forEach(b => b.classList.toggle('is-pick', !!pick && +b.dataset.s === pick[0] && +b.dataset.i === pick[1]));
    if (!pick) { read.innerHTML = 'Choose a column to see what each tear at that operation led to.'; return; }
    const s = SIM.strips[wl][pick[0]], o = s.ops[pick[1]], t = s.tears[pick[1]];
    read.innerHTML = `<b>${esc(s.scheme)}, op ${pick[1]}</b>: ${opText(o)}. ${TEARS[o[0]].map((n, k) => `<span class="os-t os-c-${t[k]}">${n}: ${NAME[t[k]]}</span>`).join(' ')}`;
  };
  seg.forEach(b => b.addEventListener('click', () => { wl = b.dataset.wl; render(); }));
  render();
  demo(el, {
    reset() { wl = 'good'; pick = null; render(); host.classList.add('is-reset'); },
    final() { host.classList.remove('is-reset'); },
    async play(me) {
      await wait(200, me); host.classList.remove('is-reset');
      await wait(1500, me); pick = [1, 44]; tell();
      await wait(1800, me); pick = [2, 44]; tell();
      await wait(1800, me); wl = 'bad-update'; pick = null; render();
      await wait(1600, me); pick = [2, 106]; tell(); await wait(1200, me);
    }
  });
})();

/* 5. Plant: the mutants table, and each bug's first failing life */
(() => {
  const el = $('#d-plant'), host = $('#os-muts'), pre = $('#os-mut-pre');
  const LIVES = [
    ['ota-sim life --cut 44:erase-0', OS_LIFE.safe, 0],
    ['ota-sim life --scheme single-meta-copy --cut 44:erase-0', `single-meta-copy / good workload / cut 44:erase-0
power on
${OS_V2}
  op   44  POWER CUT at op 44 (erase sector 0x00000)
power on (#2)
  op    0  boot: BRICK (no valid metadata record)
BRICKED: no valid metadata record`, 1],
    ['ota-sim life --scheme no-crc --workload bad-update --cut 102:prefix-2', `no-crc / bad-update workload / cut 102:prefix-2
power on
${OS_V2}
  op   46  v2 written; reboot into trial
  op   48  boot v2 from slot B
  op   50  v2 confirmed
  op   50  v2 installs v3
  op   99  v3 written; reboot into trial
  op  101  boot v3 from slot A
  op  101  v3 crashes before confirming
  op  102  POWER CUT at op 102 (program 32 B at 0x00000)
power on (#2)
  op    2  boot v2 from slot B
  op    2  v2 installs v3
  op   51  v3 written; reboot into trial
  op   53  boot v3 from slot A
  op   53  v3 crashes before confirming
  op   55  boot v3 from slot A
  op   55  v3 crashes before confirming
  op   57  boot v3 from slot A
UNSAFE: unconfirmed v3 booted 4 times (limit 3)`, 1],
    ['ota-sim life --scheme ignore-seq', `ignore-seq / good workload
power on
${OS_V2}
  op   46  v2 written; reboot into trial
  op   46  boot v1 from slot A
  op   46  v1 installs v2
  op   92  v2 written; reboot into trial
  op   92  boot v1 from slot A
@@ 39 lines left out: the same three lines, op 92 to op 690
  op  690  v1 installs v2
  op  736  v2 written; reboot into trial
STUCK: still rebooting after 16 boots`, 1],
    ['ota-sim life --scheme decrement-after-boot --workload bad-update', `decrement-after-boot / bad-update workload
power on
${OS_V2}
  op   46  v2 written; reboot into trial
  op   46  boot v2 from slot B
  op   48  v2 confirmed
  op   48  v2 installs v3
  op   97  v3 written; reboot into trial
  op   97  boot v3 from slot A
  op   97  v3 crashes before confirming
  op   97  boot v3 from slot A
  op   97  v3 crashes before confirming
  op   97  boot v3 from slot A
  op   97  v3 crashes before confirming
  op   97  boot v3 from slot A
UNSAFE: unconfirmed v3 booted 4 times (limit 3)`, 1],
    ['ota-sim life --scheme rollback-without-reject --workload bad-update', `rollback-without-reject / bad-update workload
power on
${OS_V2}
  op   46  v2 written; reboot into trial
  op   48  boot v2 from slot B
  op   50  v2 confirmed
  op   50  v2 installs v3
  op   99  v3 written; reboot into trial
  op  101  boot v3 from slot A
  op  101  v3 crashes before confirming
  op  103  boot v3 from slot A
  op  103  v3 crashes before confirming
  op  105  boot v3 from slot A
  op  105  v3 crashes before confirming
  op  107  boot v2 from slot B
  op  107  v2 installs v3
  op  156  v3 written; reboot into trial
  op  158  boot v3 from slot A
UNSAFE: unconfirmed v3 booted 4 times (limit 3)`, 1],
    ['ota-sim life --scheme trial-before-image --cut 2:before', `trial-before-image / good workload / cut 2:before
power on
${OS_V2}
  op    2  POWER CUT at op 2 (erase sector 0x06000)
power on (#2)
  op    2  boot v1 from slot A
  op    2  v1 installs v2
  op    2  v2 refused (rolled back before); settle on v1
STUCK: settled on v1, expected v3`, 1]
  ];
  const CUT_ONLY = new Set([1, 2, 6]);
  host.innerHTML = OS_MUT.map(([n, r, u, f], i) => {
    const [a, b] = f.split('/').map(Number);
    return `<button type="button" data-i="${i}" aria-pressed="false"><code>${esc(n)}</code><span class="os-mbar"><i style="transform:scaleX(${(a / b).toFixed(4)})"></i></span><span class="os-mval"><b>${esc(f)}</b> ${i ? (CUT_ONLY.has(i) ? 'only under a cut' : `power on: ${u}`) : 'clean'}</span></button>`;
  }).join('');
  const btns = $$('button', host);
  let cur = 2;
  const show = i => {
    cur = i;
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    const [cmd, text, code] = LIVES[i];
    osPre(pre, [['cmd', cmd], ...text.split('\n').map(t => (t.startsWith('@@') ? ['dim', `  (${t.slice(3)})`] : [osTone(t), t])), ['cmd', 'echo $?'], [code ? 'err' : 'ok', String(code)]]);
  };
  btns.forEach(b => b.addEventListener('click', () => show(+b.dataset.i)));
  demo(el, {
    reset() { btns.forEach(b => b.classList.add('is-reset')); show(0); },
    final() { btns.forEach(b => b.classList.remove('is-reset')); show(cur); },
    async play(me) {
      for (const b of btns) { b.classList.remove('is-reset'); await wait(160, me); }
      for (const i of [1, 2, 6]) { show(i); await wait(2000, me); }
    }
  });
})();

/* 6. Cortex-M3: the host's decision and the board's, line for line */
(() => {
  const el = $('#d-m3'), host = $('#os-m3'), pre = $('#os-m3-pre');
  const ROWS = [
    ['good-020-scatter.bin', 'boot slot=A version=1 trial=false meta=Meta { seq: 1, confirmed: A, confirmed_version: 1, trial: None, rejected_version: 0 }'],
    ['good-044-erase-0.bin', 'boot slot=A version=1 trial=false meta=Meta { seq: 1, confirmed: A, confirmed_version: 1, trial: None, rejected_version: 0 }'],
    ['good-049-prefix-2.bin', 'boot slot=B version=2 trial=true meta=Meta { seq: 4, confirmed: A, confirmed_version: 1, trial: Some(Trial { slot: B, version: 2, attempts_left: 1 }), rejected_version: 0 }'],
    ['good-098-scatter.bin', 'boot slot=B version=2 trial=false meta=Meta { seq: 4, confirmed: B, confirmed_version: 2, trial: None, rejected_version: 0 }'],
    ['bad-update-102-prefix-2.bin', 'boot slot=A version=3 trial=true meta=Meta { seq: 7, confirmed: B, confirmed_version: 2, trial: Some(Trial { slot: A, version: 3, attempts_left: 1 }), rejected_version: 0 }'],
    ['bad-update-104-prefix-3.bin', 'boot slot=A version=3 trial=true meta=Meta { seq: 8, confirmed: B, confirmed_version: 2, trial: Some(Trial { slot: A, version: 3, attempts_left: 0 }), rejected_version: 0 }'],
    ['bad-update-105-before.bin', 'boot slot=B version=2 trial=false meta=Meta { seq: 9, confirmed: B, confirmed_version: 2, trial: None, rejected_version: 3 }'],
    ['bad-update-106-scatter.bin', 'boot slot=B version=2 trial=false meta=Meta { seq: 9, confirmed: B, confirmed_version: 2, trial: None, rejected_version: 3 }']
  ];
  host.innerHTML = ROWS.map(([f, d]) => `<li><code class="os-f">${esc(f)}</code><span class="os-d"><i>host</i><code>${esc(d)}</code></span><span class="os-d os-q"><i>board</i><code>${esc(d)}</code></span><b class="os-tick" aria-label="same">=</b></li>`).join('');
  const lis = $$('li', host);
  const sum = () => osPre(pre, [['cmd', 'make qemu'], ['dim', '...'], ['ok', '998 flash images: the Cortex-M3 build decided as the host did on 998 of 998']]);
  demo(el, {
    reset() { lis.forEach(l => l.classList.remove('in', 'is-q')); pre.replaceChildren(); },
    final() { lis.forEach(l => l.classList.add('in', 'is-q')); sum(); },
    async play(me) {
      for (const l of lis) { l.classList.add('in'); await wait(260, me); l.classList.add('is-q'); await wait(240, me); }
      sum();
    }
  });
})();

/* 7. Firmware: each call and the life lines it produced */
(() => {
  const el = $('#d-fw'), seg = $$('[data-fw]', el), code = $('#os-fw-code'), pre = $('#os-fw-pre');
  const C = [
    ['// Bootloader: decide, then jump.\nmatch ota_safe::boot(&mut nor, &LAYOUT, &KEY, &Config::default())? {\n    Boot::Slot { slot, .. } => jump_to(LAYOUT.slots[slot.index()] + ota_safe::HEADER_LEN),\n    Boot::Brick(_) => recovery_mode(),\n}',
      'ota-sim life --workload bad-update', ['  op  101  boot v3 from slot A', '  op  103  boot v3 from slot A', '  op  105  boot v3 from slot A', '  op  107  boot v2 from slot B']],
    ['// Application, once it is healthy:\nota_safe::confirm(&mut nor, &LAYOUT, &Config::default(), running_slot)?;',
      'ota-sim life', ['  op   48  boot v2 from slot B', '  op   50  v2 confirmed', '  op  101  boot v3 from slot A', '  op  103  v3 confirmed']],
    ['// Application, with a downloaded image in memory:\nota_safe::update(&mut nor, &LAYOUT, &KEY, &Config::default(), &image)?;',
      'ota-sim life --workload bad-update', ['  op   50  v2 installs v3', '  op   99  v3 written; reboot into trial', '  op  107  v2 installs v3', '  op  107  v3 refused (rolled back before); settle on v2']]
  ];
  let cur = 0;
  const show = i => {
    cur = i;
    seg.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.fw === i)));
    const [src, cmd, lines] = C[i];
    code.innerHTML = esc(src).replace(/(\/\/[^\n]*)/g, '<span class="c">$1</span>');
    osPre(pre, [['cmd', cmd], ...lines.map(t => [osTone(t), t])]);
  };
  seg.forEach(b => b.addEventListener('click', () => show(+b.dataset.fw)));
  demo(el, {
    reset() { show(0); pre.replaceChildren(); },
    final() { show(cur); },
    async play(me) { for (let i = 0; i < 3; i++) { show(i); await wait(1700, me); } show(0); }
  });
})();
