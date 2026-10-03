/* Captured output, shared by the hero terminal and the hold-line demo.
   Refuse and Plan: runon 0.14.0 on the repo's examples workspace, with an illustrative destructive
   program `migrate` added. Run: the quickstart step in CI for commit b01049e. */
const MIG = 'runon -C examples group --group production run-program migrate';
const BANNER = 'Migrate the database — Applies pending schema migrations';
const WARN = 'DESTRUCTIVE: Locks tables while it runs and cannot be rolled back.';
const REFUSE = ['runon: migrate is marked destructive and there is no terminal to confirm on.', 'Pass --yes, or set RUNON_ASSUME_YES=1, if you mean it.'];
const PLAN_PROD = ['  web-1  (deploy@web-1.example.com)', '  web-2  (deploy@web-2.example.com)', '  db-1  (deploy@10.0.0.9)'];

PAGE.terminal = {
  scenes: {
    refuse: [
      ['cmd', `${MIG} < /dev/null`],
      ['out', BANNER], ['out', ''], ['out', WARN],
      ['err', REFUSE[0]], ['err', REFUSE[1]],
      ['dim', '# exit status 2, and no ssh process was started'], ['out', ''],
      ['cmd', MIG],
      ['dim', '# on a terminal, answering n'],
      ['out', BANNER], ['out', ''], ['out', WARN],
      ['out', 'Run migrate anyway? [y/N]: n'], ['out', ''], ['out', 'cancelled'],
      ['dim', '# exit status 130']
    ],
    plan: [
      ['cmd', 'runon -C examples group --group production run-program disk-report --dry-run'],
      ['out', 'would run-program disk-report on:'], ...PLAN_PROD.map(l => ['out', l]), ['out', ''],
      ['cmd', 'runon -C examples host --host root@10.0.0.4 run-program disk-report --dry-run'],
      ['out', 'would run-program disk-report on:'], ['out', '  root@10.0.0.4  (root@10.0.0.4)'], ['out', ''],
      ['cmd', 'runon -C examples list groups'],
      ['out', '  production           web-1, web-2, db-1'], ['out', '  web                  web-1, web-2']
    ],
    run: [
      ['dim', '# the quickstart step in CI, run from /'],
      ['cmd', 'runon list programs'],
      ['dim', 'runon: bash completion installed at /home/runner/.local/share/bash-completion/completions/runon'],
      ['dim', 'runon: Open a new shell to pick it up — this one has already decided runon has no completion.'],
      ['dim', 'runon: created /home/runner/.runon/workspace'],
      ['out', '  hello-world  Prints a greeting from each host.'],
      ['cmd', 'runon local run-program hello-world --verbose'],
      ['ok', 'local                    ok'],
      ['out', '    program : hello-world'], ['out', '    host    : local'], ['out', '    [local] hello from runnervmejwal']
    ]
  },
  order: ['refuse', 'plan', 'run'],
  first: 'refuse'
};

/* Collected tests per file (pytest --collect-only), coloured by what they guard */
PAGE.tests = [
  ['tests/test_cli.py', 84, 'var(--blue)'], ['tests/test_transport.py', 29, 'var(--blue)'], ['tests/test_runner.py', 15, 'var(--blue)'],
  ['tests/test_hosts.py', 44, 'var(--magenta)'], ['tests/test_persist.py', 35, 'var(--magenta)'], ['tests/test_askpass.py', 17, 'var(--magenta)'],
  ['tests/test_programs_describe_themselves.py', 39, 'var(--yellow)'], ['tests/test_inventory.py', 25, 'var(--yellow)'],
  ['tests/test_parity.py', 90, 'var(--water)'], ['tests/test_screen.py', 24, 'var(--water)'], ['tests/test_doctor_completion.py', 17, 'var(--water)']
];

/* Writes [kind, text] lines into a dark pre. Kinds: cmd, err, dim, ok, ill, or '' for plain output. */
const CLS = { cmd: 'cmd', err: 'err', dim: 'dim', ok: 'ok', ill: 'ro-ill', out: '' };
function lineEl(kind, text) {
  const s = document.createElement('span');
  if (CLS[kind]) s.className = CLS[kind];
  s.textContent = text;
  return s;
}
function fillPre(pre, lines) {
  pre.replaceChildren();
  lines.forEach(([k, t], i) => { if (i) pre.appendChild(document.createTextNode('\n')); pre.appendChild(lineEl(k, t)); });
}
async function typePre(pre, lines, me, gap = 90) {
  for (const [k, t] of lines) {
    if (pre.childNodes.length) pre.appendChild(document.createTextNode('\n'));
    const s = lineEl(k, '');
    pre.appendChild(s);
    if (k === 'cmd') {
      for (let i = 0; i < t.length; i += 3) { s.textContent = t.slice(0, i + 3); await wait(12, me); }
      s.textContent = t;
      await wait(260, me);
    } else {
      s.textContent = t;
      await wait(t ? gap : 40, me);
    }
  }
}
const pressed = (el, attr, v) => $$(`.seg button[data-${attr}]`, el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[attr] === v)));

/* 1. The workspace: files appear, then each comment line becomes a description */
(() => {
  const el = $('#d-dir'), rows = $$('#dir-tree li', el), cmd = $('#dir-list .cmd', el), lines = $$('.ro-ln', el), chips = $$('#dir-env li', el);
  const all = [...rows, cmd, ...lines, ...chips];
  const cool = () => [...rows, ...lines].forEach(x => x.classList.remove('is-hot'));
  demo(el, {
    reset() { cool(); all.forEach(x => x.classList.add('ro-off')); },
    final() { cool(); all.forEach(x => x.classList.remove('ro-off')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.remove('ro-off'); await wait(90, me); }
      await wait(350, me);
      cmd.classList.remove('ro-off');
      await wait(500, me);
      for (const k of ['a', 'b']) {
        const f = rows.find(r => r.dataset.k === k), l = lines.find(x => x.dataset.k === k);
        f.classList.add('is-hot');
        await wait(500, me);
        l.classList.remove('ro-off');
        l.classList.add('is-hot');
        await wait(900, me);
        cool();
      }
      await wait(300, me);
      for (const c of chips) { c.classList.remove('ro-off'); await wait(110, me); }
    }
  });
})();

/* 2. Targets: the real inventory, four edits and five commands, each run for real */
(() => {
  const el = $('#d-targets'), file = $('#inv-file'), toml = file.closest('.ro-toml'), res = $('#inv-res'), out = $('#inv-out');
  const BASE = [
    '[hosts.web-1]', 'address = "web-1.example.com"', 'user = "deploy"', 'vars = { role = "web", datacentre = "eu-west" }', '',
    '[hosts.web-2]', 'address = "web-2.example.com"', 'user = "deploy"', 'vars = { role = "web", datacentre = "eu-west" }', '',
    '[hosts.db-1]', 'address = "10.0.0.9"', 'user = "deploy"', 'port = 2222', 'vars = { role = "database" }', '',
    '[groups.web]', 'hosts = ["web-1", "web-2"]', '',
    '[groups.production]', 'hosts = ["web-1", "web-2", "db-1"]'
  ];
  const BLOCK = { 'web-1': [0, 3], 'web-2': [5, 8], 'groups.web': [16, 17] };
  const WEB = 'runon -C examples group --group web run-program disk-report --dry-run';
  const SCN = {
    clean: {
      cmd: WEB, exit: 0,
      out: [['out', 'would run-program disk-report on:'], ['out', '  web-1  (deploy@web-1.example.com)'], ['out', '  web-2  (deploy@web-2.example.com)']],
      res: [['web-1', 'deploy@web-1.example.com', 'web-1'], ['web-2', 'deploy@web-2.example.com', 'web-2']]
    },
    addr: {
      cmd: 'runon -C examples host --host root@10.0.0.4 run-program disk-report --dry-run', exit: 0,
      out: [['out', 'would run-program disk-report on:'], ['out', '  root@10.0.0.4  (root@10.0.0.4)']],
      adhoc: ['root@10.0.0.4', 'root@10.0.0.4', 'Not in the file, but shaped like an address, so it is used as given. There is no allowlist.']
    },
    name: {
      cmd: 'runon -C examples host --host web-3 run-program disk-report --dry-run', exit: 2,
      out: [['err', "runon: no host named 'web-3' in the inventory, and it does not look like an address."], ['err', 'Known hosts: db-1, web-1, web-2'], ['err', "If 'web-3' is a Host alias from your ~/.ssh/config, add it:"], ['err', '  runon add-host web-3 --address web-3']],
      stop: ['web-3', 'A bare word the file does not have is treated as a typo.']
    },
    secret: {
      cmd: WEB, exit: 2, add: ['', '[hosts.legacy]', 'address = "10.0.0.20"', 'password = "hunter2"'], bad: 3,
      out: [['err', "runon: examples/inventory.toml: host 'legacy' has an inline 'password'."], ['err', 'The inventory is committed, so a password here becomes a password in git.'], ['err', 'Use password_env = "VAR" or password_file = "/path" (0600) instead.']],
      stop: ['No targets', 'The file did not load, so no command can use it until the password moves out.']
    },
    typo: {
      cmd: WEB, exit: 2, add: ['', '[groups.canary]', 'hosts = ["web-1", "web-3"]'], bad: 2,
      out: [['err', "runon: examples/inventory.toml: group 'canary' refers to unknown hosts: web-3"]],
      stop: ['No targets', 'The file did not load, even though the group asked for, web, is fine.']
    }
  };
  const ORDER = ['clean', 'addr', 'name', 'secret', 'typo'], TOUR = ['clean', 'typo'];
  let cur = 'clean', cycle = true, set = ORDER;
  function drawFile(s) {
    const lines = BASE.map(t => ({ t, add: false })).concat((s.add || []).map(t => ({ t, add: true })));
    file.innerHTML = lines.map(({ t, add }, i) =>
      `<span class="ro-tl${add && t ? ' is-add' : ''}" data-i="${i}">${esc(t) || ' '}${add && t && i === BASE.length + 1 ? ' <span class="tag-ill">Illustrative input</span>' : ''}</span>`).join('');
    toml.classList.remove('is-dim');
  }
  const tl = i => $(`.ro-tl[data-i="${i}"]`, file);
  const hl = ([a, b], on) => { for (let i = a; i <= b; i++) tl(i).classList.toggle('is-hl', on); };
  const resLi = (name, target, note, cls) => {
    const li = document.createElement('li');
    if (cls) li.className = cls;
    li.innerHTML = `<b>${esc(name)}</b>${target ? `<span>${esc(target)}</span>` : ''}${note ? `<small>${esc(note)}</small>` : ''}`;
    return li;
  };
  const exitLine = s => ['dim', `# exit status ${s.exit}`];
  function finalOf(name) {
    const s = SCN[name];
    drawFile(s);
    res.replaceChildren();
    if (s.res) s.res.forEach(([n, t]) => res.appendChild(resLi(n, t)));
    if (s.adhoc) res.appendChild(resLi(s.adhoc[0], s.adhoc[1], s.adhoc[2], 'is-adhoc'));
    if (s.stop) res.appendChild(resLi(s.stop[0], '', s.stop[1], 'is-stop'));
    if (s.bad) { tl(BASE.length + s.bad).classList.add('is-bad'); toml.classList.add('is-dim'); }
    fillPre(out, [['cmd', s.cmd], ...s.out, exitLine(s)]);
    pressed(el, 'scn', name);
  }
  async function playOne(name, me) {
    const s = SCN[name];
    cur = name;
    pressed(el, 'scn', name);
    drawFile(s);
    res.replaceChildren();
    out.replaceChildren();
    const added = $$('.ro-tl.is-add', file);
    added.forEach(x => x.classList.add('ro-off'));
    await typePre(out, [['cmd', s.cmd]], me);
    for (const a of added) { a.classList.remove('ro-off'); await wait(160, me); }
    if (s.res) {
      hl(BLOCK['groups.web'], true);
      await wait(500, me);
      for (const [n, t, key] of s.res) {
        hl(BLOCK[key], true);
        await wait(380, me);
        res.appendChild(resLi(n, t));
        await wait(240, me);
        hl(BLOCK[key], false);
      }
      hl(BLOCK['groups.web'], false);
    }
    if (s.adhoc) { await wait(300, me); res.appendChild(resLi(s.adhoc[0], s.adhoc[1], s.adhoc[2], 'is-adhoc')); await wait(400, me); }
    if (s.bad) { tl(BASE.length + s.bad).classList.add('is-bad'); await wait(500, me); toml.classList.add('is-dim'); }
    if (s.stop) { await wait(200, me); res.appendChild(resLi(s.stop[0], '', s.stop[1], 'is-stop')); }
    await typePre(out, [...s.out, exitLine(s)], me, 110);
  }
  const d = demo(el, {
    reset() { finalOf(cycle ? set[0] : cur); out.replaceChildren(); res.replaceChildren(); },
    final() { finalOf(cur); },
    async play(me) {
      if (!cycle) { await playOne(cur, me); return; }
      for (const name of set) { await playOne(name, me); if (name !== set[set.length - 1]) await wait(1000, me); }
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { cycle = false; cur = b.dataset.scn; d.start(); }));
  d.prepare = () => { cycle = true; set = TOUR; };
})();

/* 3. Program checks: five real commands, four refused on this machine */
(() => {
  const el = $('#d-program'), list = $('#prog-list');
  const ROWS = [
    ['run-program ../../etc --dry-run', 'Its name', [['err', "runon: '../../etc' is not a valid program name. Use letters, digits, dot, dash or underscore, starting with a letter or digit."]], 2],
    ['run-program winbox --dry-run', 'Its line endings', [['err', "runon: examples/programs/winbox/main.sh has Windows (CRLF) line endings, so the shell cannot run it — it reports 'not found' for the interpreter."], ['err', "Fix it with:  sed -i 's/\\r$//' examples/programs/winbox/main.sh"]], 2, true],
    ['run-program --program "" --dry-run', 'An empty name', [['err', 'runon: --program was given an empty value']], 2],
    ['run-program < /dev/null', 'Nobody to choose one', [['err', 'runon: --program was not given and there is no terminal to ask on.'], ['err', 'Pass --program explicitly. Choices: disk-report, hello-world']], 2],
    ['copy-run-program disk-report --dry-run', 'Every check', [['out', 'would copy-run-program disk-report on:'], ['out', '  web-1  (deploy@web-1.example.com)']], 0]
  ];
  list.innerHTML = ROWS.map(([cmd, what, , code, ill]) =>
    `<li><div class="ro-chk-h"><code>${esc(cmd)}</code>${ill ? '<span class="tag-ill">Illustrative input</span>' : ''}<span class="ro-what">${esc(what)}</span>` +
    `<span class="ro-verdict">${code ? `Refused, exit ${code}` : 'Cleared to the line, exit 0'}</span></div><pre></pre></li>`).join('');
  const items = $$('li', list).map((li, i) => ({ li, pre: $('pre', li), row: ROWS[i] }));
  const settle = ({ li, pre, row }) => { li.classList.remove('is-pending', 'is-checking', 'ro-off'); li.classList.add(row[3] ? 'is-stop' : 'is-pass'); fillPre(pre, row[2]); };
  demo(el, {
    reset() { items.forEach(({ li, pre }) => { li.className = 'is-pending ro-off'; pre.replaceChildren(); }); },
    final() { items.forEach(settle); },
    async play(me) {
      await wait(250, me);
      for (const it of items) {
        it.li.classList.remove('ro-off');
        await wait(250, me);
        it.li.classList.add('is-checking');
        await wait(450, me);
        settle(it);
        await wait(it.row[3] ? 650 : 400, me);
      }
    }
  });
})();

/* 4. The hold line: one destructive program, four ways to send it */
(() => {
  const el = $('#d-hold'), suf = $('#hold-suf'), note = $('#hold-note'), steps = $$('#hold-steps li'), consent = $('#hold-consent');
  const line = $('#hold-line'), hosts = $$('#hold-hosts li'), n = $('#hold-n'), exitEl = $('#hold-exit'), out = $('#hold-out');
  const HEAD = [['out', BANNER], ['out', ''], ['out', WARN]];
  const MODES = {
    plan: {
      suf: ' --dry-run < /dev/null', consent: 'Not asked: the dry run returned first', st: 'skip', gate: 'plan', tag: 'A dry run stops here',
      body: [['out', 'would run-program migrate on:'], ...PLAN_PROD.map(l => ['out', l])],
      exit: 'Exit status 0. Nothing ran, and the plan does not say migrate is destructive.', hostNote: 'would run here'
    },
    notty: {
      suf: ' < /dev/null', consent: 'Refused: no terminal to confirm on', st: 'fail', gate: 'stop', tag: 'Refused',
      head: HEAD, body: [['err', REFUSE[0]], ['err', REFUSE[1]]], exit: 'Exit status 2', bad: true
    },
    no: {
      suf: '', note: 'on a terminal, answering n', consent: 'Declined at the prompt', st: 'fail', gate: 'stop', tag: 'Declined',
      head: HEAD, ask: true, body: [['out', ''], ['out', 'cancelled']], exit: 'Exit status 130', bad: true
    },
    yes: {
      suf: ' --yes < /dev/null', consent: 'Given in advance: --yes', st: 'ok', gate: 'open', tag: 'Cleared',
      head: HEAD, body: [['out', 'proceeding: --yes'], ['dim', '# past the line, ssh was a recorder: one call per host, nothing connected']],
      exit: 'Host results not shown: the recorder, not a server, answered them.', hostNote: 'ssh call recorded', calls: 3
    }
  };
  const ORDER = ['plan', 'notty', 'no', 'yes'];
  let mode = 'notty', cycle = true;
  const setN = v => { n.textContent = String(v); };
  function base(m) {
    const M = MODES[m];
    mode = m;
    pressed(el, 'mode', m);
    suf.textContent = M.suf;
    note.textContent = M.note || '';
    steps.forEach(s => s.removeAttribute('data-st'));
    consent.textContent = 'Not asked yet';
    line.className = 'ro-line';
    line.removeAttribute('data-tag');
    hosts.forEach(h => { h.className = ''; $('em', h).textContent = ''; });
    setN(0);
    exitEl.textContent = '';
    exitEl.classList.remove('is-bad');
    out.replaceChildren();
  }
  const cmdLine = M => ['cmd', `${MIG}${M.suf}`];
  const preLines = M => {
    const lines = [cmdLine(M)];
    if (M.note) lines.push(['dim', `# ${M.note}`]);
    if (M.head) lines.push(...M.head);
    if (M.ask) lines.push(['out', 'Run migrate anyway? [y/N]: n']);
    return lines.concat(M.body);
  };
  function finalOf(m) {
    const M = MODES[m];
    base(m);
    steps[0].dataset.st = 'ok';
    steps[1].dataset.st = 'ok';
    steps[2].dataset.st = M.st;
    consent.textContent = M.consent;
    line.classList.add(`is-${M.gate}`);
    line.dataset.tag = M.tag;
    if (M.hostNote) hosts.forEach(h => { h.classList.add(M.gate === 'open' ? 'is-hit' : 'is-plan'); $('em', h).textContent = M.hostNote; });
    setN(M.calls || 0);
    exitEl.textContent = M.exit;
    exitEl.classList.toggle('is-bad', !!M.bad);
    fillPre(out, preLines(M));
  }
  async function playOne(m, me) {
    const M = MODES[m];
    base(m);
    await typePre(out, [cmdLine(M)], me);
    if (M.note) await typePre(out, [['dim', `# ${M.note}`]], me);
    steps[0].dataset.st = 'ok';
    await wait(320, me);
    steps[1].dataset.st = 'ok';
    await wait(380, me);
    if (M.head) await typePre(out, M.head, me, 120);
    if (M.ask) {
      if (out.childNodes.length) out.appendChild(document.createTextNode('\n'));
      const s = lineEl('out', 'Run migrate anyway? [y/N]: ');
      out.appendChild(s);
      await wait(900, me);
      s.textContent += 'n';
      await wait(300, me);
    }
    steps[2].dataset.st = M.st;
    consent.textContent = M.consent;
    await wait(250, me);
    line.classList.add(`is-${M.gate}`);
    line.dataset.tag = M.tag;
    await wait(500, me);
    if (M.gate === 'plan') {
      await typePre(out, M.body.slice(0, 1), me);
      for (let i = 0; i < hosts.length; i++) {
        hosts[i].classList.add('is-plan');
        $('em', hosts[i]).textContent = M.hostNote;
        await typePre(out, [M.body[i + 1]], me, 160);
      }
    } else if (M.gate === 'open') {
      await typePre(out, M.body.slice(0, 1), me);
      for (let i = 0; i < hosts.length; i++) {
        await wait(320, me);
        hosts[i].classList.add('is-hit');
        $('em', hosts[i]).textContent = M.hostNote;
        setN(i + 1);
        n.classList.add('is-bump');
        await wait(200, me);
        n.classList.remove('is-bump');
      }
      await typePre(out, M.body.slice(1), me);
    } else {
      await typePre(out, M.body, me, 140);
    }
    exitEl.textContent = M.exit;
    exitEl.classList.toggle('is-bad', !!M.bad);
  }
  const d = demo(el, {
    reset() { base(cycle ? ORDER[0] : mode); },
    final() { finalOf(mode); },
    async play(me) {
      if (!cycle) { await playOne(mode, me); return; }
      for (const m of ORDER) { await playOne(m, me); if (m !== 'yes') await wait(1200, me); }
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { cycle = false; mode = b.dataset.mode; d.start(); }));
  d.prepare = () => { cycle = true; };
})();

/* 5. Shipping: the four calls ssh and scp received for web-1 */
(() => {
  const el = $('#d-ship'), list = $('#ship-calls'), saw = $('#ship-saw ul');
  const T = 'deploy@web-1.example.com';
  const AUTH = { key: '-o BatchMode=yes', pw: '-o NumberOfPasswordPrompts=1' };
  const SHARED = ['-o ConnectTimeout=10', null, '-o ControlMaster=auto', '-o ControlPath=/home/you/.runon/sockets/%C', '-o ControlPersist=60s'];
  const RUN = 'env RUNON_ADDRESS=web-1.example.com RUNON_FUNCTIONS="$HOME/.runon"/functions RUNON_HOST=web-1 RUNON_PROGRAM=migrate RUNON_VAR_DATACENTRE=eu-west RUNON_VAR_ROLE=web /bin/sh -c \'cd ~/.runon/programs/migrate && chmod +x main.sh 2>/dev/null; ./main.sh\'';
  const CALLS = [
    ['ssh', 'Make the directory', [], T, "env /bin/sh -c 'mkdir -p ~/.runon/programs'"],
    ['scp', 'Copy the program', ['-r', 'examples/programs/migrate'], `${T}:~/.runon/programs/`, null],
    ['scp', 'Copy the functions', ['-r', 'examples/functions'], `${T}:~/.runon/`, null],
    ['ssh', 'Run it', [], T, RUN]
  ];
  const SAW = {
    key: [
      'No password in play, so <code>BatchMode=yes</code>: a host that refuses the key fails at once.',
      'No askpass helper in its environment.',
      'It kept the terminal, as ssh normally does.'
    ],
    pw: [
      '<code>NumberOfPasswordPrompts=1</code>: one attempt per host, so a mistyped password fails once, not three times on every machine.',
      '<code>SSH_ASKPASS_REQUIRE=force</code>, pointing at a helper that is <code>-rwx------</code> inside a <code>drwx------</code> directory.',
      'Asked for <code>user@host\'s password:</code>, the helper answered with the password.',
      'Asked <code>Are you sure you want to continue connecting (yes/no)?</code>, it exited 1 without answering.',
      'No terminal, so ssh could not prompt the operator instead of using the helper.',
      'After the run, the helper\'s directory was gone.'
    ]
  };
  const payload = p => esc(p).replace(/(RUNON_[A-Z_]+=)/g, '<span class="v">$1</span>');
  list.innerHTML = CALLS.map(([bin, why, pre, target, pay], i) => {
    const opts = i === 0
      ? SHARED.map(o => (o ? `<span class="o">${esc(o)}</span>` : '<span class="o a"></span>')).join(' ')
      : '<span class="o a"></span> <span class="m">and the same four options as above</span>';
    const tail = pay
      ? ` <span class="t">${esc(target)}</span><span class="p">${payload(pay)}</span>`
      : ` <span class="o">${pre.map(esc).join(' ')}</span> <span class="t">${esc(target)}</span>`;
    return `<li class="ro-call"><div class="ro-call-h"><span class="ro-bin">${bin}</span><b>${esc(why)}</b><small>${i + 1} of 4</small></div>` +
      `<code class="ro-argv">${opts}${tail}</code>${i === 3 ? '<p class="ro-small">The last argument is one string. The account\'s login shell runs <code>env</code>, which sets the variables and hands the command to <code>/bin/sh</code>.</p>' : ''}</li>`;
  }).join('');
  const cards = $$('.ro-call', list), auths = $$('.a', list);
  let auth = 'key', cycle = true;
  const setAuth = (a, flash) => {
    auth = a;
    pressed(el, 'auth', a);
    auths.forEach(x => { x.textContent = AUTH[a]; x.classList.toggle('is-flash', !!flash); });
    saw.innerHTML = SAW[a].map(t => `<li>${t}</li>`).join('');
  };
  const items = () => $$('li', saw);
  const d = demo(el, {
    reset() { setAuth(cycle ? 'key' : auth); cards.forEach(c => c.classList.add('ro-off')); items().forEach(x => x.classList.add('ro-off')); },
    final() { setAuth(auth); cards.forEach(c => c.classList.remove('ro-off')); },
    async play(me) {
      await wait(300, me);
      for (const c of cards) { c.classList.remove('ro-off'); await wait(c === cards[3] ? 900 : 520, me); }
      for (const x of items()) { x.classList.remove('ro-off'); await wait(260, me); }
      if (!cycle) return;
      await wait(1400, me);
      setAuth('pw', true);
      items().forEach(x => x.classList.add('ro-off'));
      await wait(500, me);
      auths.forEach(x => x.classList.remove('is-flash'));
      for (const x of items()) { x.classList.remove('ro-off'); await wait(300, me); }
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { cycle = false; auth = b.dataset.auth; d.start(); }));
  d.prepare = () => { cycle = true; };
})();

/* 6. The report: three hosts, step by step, then the lines runon printed */
(() => {
  const el = $('#d-report'), lanes = $('#rep-lanes'), key = $('.ro-lkey', el), cli = $('#rep-cli'), out = $('#rep-out'), ci = $('#rep-ci');
  const HOSTS = ['web-1', 'web-2', 'db-1'];
  const OK = ['ok', 'ok', 'ok', 'ok'];
  const SCN = {
    run: {
      steps: { 'web-1': OK, 'web-2': OK, 'db-1': ['ok', 'ok', 'ok', 'fail'] },
      ill: ['    [db-1] checking disks (threshold 90%)', '    [db-1] highest usage: 94% on /var', '    [db-1] OVER THRESHOLD']
    },
    copy: {
      steps: { 'web-1': OK, 'web-2': OK, 'db-1': ['ok', 'fail', 'ok', 'skip'] },
      ill: ['    scp: write remote "/home/deploy/.runon/programs/disk-report/main.sh": No space left on device']
    }
  };
  const LABEL = { ok: 'done', fail: 'failed', skip: 'skipped', wait: 'not yet', busy: 'running' };
  lanes.insertAdjacentHTML('beforeend', HOSTS.map(h =>
    `<div class="ro-lrow" role="row" data-h="${h}"><span role="rowheader">${h}</span>` +
    [0, 1, 2, 3].map(() => '<span class="ro-cell" role="cell" data-st="wait"><span class="vh">not yet</span></span>').join('') +
    '<span class="ro-rcell" role="cell"></span></div>').join(''));
  const row = h => $(`.ro-lrow[data-h="${h}"]`, lanes);
  const setCell = (c, st) => { c.dataset.st = st; $('.vh', c).textContent = LABEL[st]; };
  const report = s => [
    ['cmd', 'runon -C examples group --group production copy-run-program disk-report'],
    ['ok', 'web-1                    ok'], ['ok', 'web-2                    ok'], ['err', 'db-1                     FAILED (1)'],
    ...s.ill.map(l => ['ill', l]), ['out', ''], ['out', '2/3 ok'], ['dim', '# exit status 1']
  ];
  const ORDER = ['run', 'copy', 'ci'], TOUR = ['run', 'copy'];
  let cur = 'run', cycle = true, set = ORDER;
  function clear(name) {
    cur = name;
    pressed(el, 'scn', name);
    const isCi = name === 'ci';
    lanes.hidden = isCi; key.hidden = isCi; cli.hidden = isCi; ci.hidden = !isCi;
    HOSTS.forEach(h => { $$('.ro-cell', row(h)).forEach(c => setCell(c, 'wait')); const r = $('.ro-rcell', row(h)); r.textContent = ''; r.className = 'ro-rcell'; });
    out.replaceChildren();
    $$(':scope > div', ci).forEach(x => x.classList.remove('ro-off'));
  }
  const result = (h, failed) => { const r = $('.ro-rcell', row(h)); r.textContent = failed ? 'FAILED (1)' : 'ok'; r.classList.add(failed ? 'is-fail' : 'is-ok'); };
  function finalOf(name) {
    clear(name);
    if (name === 'ci') return;
    const s = SCN[name];
    HOSTS.forEach(h => { $$('.ro-cell', row(h)).forEach((c, i) => setCell(c, s.steps[h][i])); result(h, s.steps[h].includes('fail')); });
    fillPre(out, report(s));
  }
  async function playOne(name, me) {
    clear(name);
    if (name === 'ci') {
      const blocks = $$(':scope > div', ci);
      blocks.forEach(x => x.classList.add('ro-off'));
      for (const b of blocks) { await wait(350, me); b.classList.remove('ro-off'); await wait(900, me); }
      return;
    }
    const s = SCN[name];
    for (const h of HOSTS) {
      const cells = $$('.ro-cell', row(h));
      for (let i = 0; i < 4; i++) {
        const st = s.steps[h][i];
        if (st !== 'skip') { setCell(cells[i], 'busy'); await wait(170, me); }
        setCell(cells[i], st);
        await wait(st === 'fail' ? 380 : 90, me);
      }
      result(h, s.steps[h].includes('fail'));
      await wait(200, me);
    }
    await wait(300, me);
    await typePre(out, report(s), me, 110);
  }
  const d = demo(el, {
    reset() { clear(cycle ? set[0] : cur); },
    final() { finalOf(cur); },
    async play(me) {
      if (!cycle) { await playOne(cur, me); return; }
      for (const name of set) { await playOne(name, me); if (name !== set[set.length - 1]) await wait(1100, me); }
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { cycle = false; cur = b.dataset.scn; d.start(); }));
  d.prepare = () => { cycle = true; set = TOUR; };
})();

/* Measured: the 18 stopped commands, each run with a recorder in place of ssh and scp */
(() => {
  const STOPPED = [
    ['runon -C examples group --group production run-program disk-report --dry-run', 'Dry run', 0],
    ['runon -C examples host --host web-1 copy-run-program disk-report --dry-run', 'Dry run', 0],
    ['runon -C examples host --host root@10.0.0.4 run-program disk-report --dry-run', 'Dry run', 0],
    ['runon -C examples group --group production run-program migrate --dry-run < /dev/null', 'Dry run', 0],
    ['runon -C creds host --host db-2 run-program disk-report --dry-run < /dev/null', 'Dry run', 0],
    ['runon -C examples host --host web-1 --ask-password run-program disk-report --dry-run < /dev/null', 'Dry run', 0],
    ['runon -C examples host --host web-1 run-program ../../etc --dry-run', 'Program name', 2],
    ['runon -C examples host --host web-1 run-program winbox --dry-run', 'CRLF line endings', 2],
    ['runon -C examples host --host web-1 run-program --program "" --dry-run', 'Empty program name', 2],
    ['runon -C examples group --group web run-program disk-report --dry-run (with a group naming web-3 added)', 'Unknown host in a group', 2],
    ['runon -C examples host --host web-3 run-program disk-report --dry-run', 'Unknown host name', 2],
    ['runon -C examples group run-program disk-report < /dev/null', 'No terminal to choose a group', 2],
    ['runon -C examples host run-program disk-report < /dev/null', 'No terminal to choose a host', 2],
    ['runon -C examples group --group production run-program migrate < /dev/null', 'Consent, no terminal', 2],
    ['runon -C examples group --group production run-program migrate (on a terminal, answered n)', 'Consent, declined', 130],
    ['runon -C examples host --host web-1 --persist 10 minutes run-program disk-report --dry-run', 'Flag value', 2],
    ['runon -C examples host --host web-1 --persist 10min run-program disk-report', 'Flag value', 2],
    ['runon -C creds host --host db-2 run-program disk-report < /dev/null (password file mode 0644)', 'Password file mode 0644', 1]
  ];
  $('#stop-table tbody').innerHTML = STOPPED.map(([c, why, code]) => `<tr><td>${esc(c)}</td><td>${esc(why)}</td><td class="n">${code}</td></tr>`).join('');
})();
