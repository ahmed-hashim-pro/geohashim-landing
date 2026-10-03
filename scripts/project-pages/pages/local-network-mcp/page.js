/* Real stdio captures: every tools/call and tools/list from four server starts, verbatim,
   with response times measured at the client (data/calls.json, from captures/lnmcp/raw.log). */
const CAP = /*@@DATA:calls@@*/;
const SES = Object.fromEntries(CAP.sessions.map(s => [s.name, s]));
const callOf = (s, tool, n = 0) => SES[s].calls.filter(c => c.tool === tool)[n];

// The shared tour bar links "See the answer" to #answer, which this page doesn't have.
{ const ta = $('#tour-ans'); if (ta) ta.remove(); }

// Request arguments printed the way the capture log printed them (Python json.dumps spacing).
const py = v => (v !== null && typeof v === 'object'
  ? '{' + Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${py(x)}`).join(', ') + '}'
  : JSON.stringify(v));
const reqLine = c => `→ tools/call ${c.tool} ${py(c.args)}`;
const markVars = html => html.replace(/LNMCP_ENABLE_[A-Z_]+/g, '<mark>$&</mark>');

/* Hero terminal */
(() => {
  const body = (c, okRe) => c.text.split('\n').map(l => [/"error":/.test(l) ? 'err' : okRe && okRe.test(l) ? 'ok' : 'out', l]);
  const deny = callOf('clean', 'execute_local_command', 0), override = callOf('clean', 'execute_local_command', 1);
  const ran = callOf('exec', 'execute_local_command'), sshNo = callOf('exec', 'ssh_execute');
  const open = callOf('clean', 'check_port', 0), shut = callOf('clean', 'check_port', 1);
  PAGE.terminal = {
    scenes: {
      deny: [['cmd', SES.clean.start], ['dim', reqLine(deny)], ...body(deny), ['out', ''], ['dim', reqLine(override)], ...body(override)],
      optin: [['cmd', SES.exec.start], ['dim', reqLine(ran)], ...body(ran, /"stdout"|"exit_code"/), ['out', ''], ['dim', reqLine(sshNo)], ...body(sshNo)],
      read: [['cmd', SES.clean.start], ['dim', reqLine(open)], ...body(open, /"status"/), ['out', ''], ['dim', reqLine(shut)], ...body(shut)]
    },
    order: ['deny', 'optin', 'read'],
    first: 'deny'
  };
})();

/* Passing tests per class, from pytest --collect-only (all in tests/test_policy.py) */
PAGE.tests = [['TestDefaultDeny', 50, 'var(--blue)'], ['TestTheGateIsReal', 5, 'var(--red)'], ['TestToolListing', 3, 'var(--water)'], ['TestNoDrift', 4, 'var(--magenta)']];

const miniHTML = (start, c, pick) => {
  const lines = pick ? c.text.split('\n').filter(pick) : c.text.split('\n');
  return [`<span class="cmd">${esc(start)}</span>`, `<span class="dim">→ ${esc(c.tool)} ${esc(py(c.args))}</span>`,
    ...lines.map(l => `<span>${esc(l)}</span>`)].join('');
};

/* 1. The switches: how a value is read */
(() => {
  const el = $('#d-switch'), chips = $('#sw-chips'), out = $('#sw-readout'), line = $('#sw-envline');
  const before = $('#sw-before'), after = $('#sw-after');
  const LINE = line.textContent;
  // The test suite's own parameters (tests/test_policy.py:47 and :53), interleaved for the animation.
  const VALUES = ['1', '', 'true', '0', 'TRUE', 'false', 'yes', 'no', 'on', 'off', ' 1 ', 'maybe', '2'];
  const TRUTHY = new Set(['1', 'true', 'yes', 'on']);
  const q = v => JSON.stringify(v);
  chips.innerHTML = VALUES.map(v => {
    const on = TRUTHY.has(v.trim().toLowerCase());
    return `<li class="lnm-chip" data-on="${on}"><code>${esc(q(v))}</code><span class="vh">${on ? ', turns the tool on' : ', leaves it off'}</span></li>`;
  }).join('');
  const items = $$('.lnm-chip', chips);
  const read = v => {
    const n = v.trim().toLowerCase(), on = TRUTHY.has(n);
    out.innerHTML = `<code>${esc(q(v))}</code><i aria-hidden="true">→</i><span>strip, lower</span><i aria-hidden="true">→</i><code>${esc(q(n))}</code><i aria-hidden="true">→</i><b class="${on ? 'is-on' : 'is-off'}">${on ? 'turns the tool on' : 'leaves it off'}</b>`;
  };
  before.innerHTML = miniHTML(SES.clean.start, callOf('clean', 'get_environment_variables'));
  after.innerHTML = miniHTML(SES.exec.start, callOf('exec', 'get_environment_variables'));
  const termLines = [...$$('span', before), ...$$('span', after)].filter(s => s.parentElement === before || s.parentElement === after);
  demo(el, {
    reset() {
      items.forEach(i => i.classList.remove('is-now', 'is-set'));
      out.innerHTML = '<span>Each value is stripped, lowercased and checked against 1, true, yes and on.</span>';
      line.textContent = '';
      termLines.forEach(s => s.classList.add('is-off'));
    },
    final() {
      items.forEach(i => { i.classList.remove('is-now'); i.classList.add('is-set'); });
      read(' 1 ');
      line.textContent = LINE;
      termLines.forEach(s => s.classList.remove('is-off'));
    },
    async play(me) {
      await wait(400, me);
      for (const [k, i] of items.entries()) {
        items.forEach(x => x.classList.remove('is-now'));
        i.classList.add('is-now');
        read(VALUES[k]);
        await wait(260, me);
        i.classList.add('is-set');
        await wait(70, me);
      }
      items.forEach(x => x.classList.remove('is-now'));
      await wait(500, me);
      for (let k = 2; k < LINE.length; k += 2) { line.textContent = LINE.slice(0, k).replace(/\n?$/, '\n'); await wait(22, me); }
      line.textContent = LINE;
      await wait(400, me);
      for (const s of termLines) { s.classList.remove('is-off'); await wait(55, me); }
    }
  });
})();

/* 2. The tool list, per server start */
(() => {
  const el = $('#d-list'), box = $('#tl-groups'), count = $('#tl-count'), table = $('#tl-table');
  const GROUPS = [['Network', 0, 5], ['SSH', 5, 9], ['Local system', 9, 18]];
  const STAMP = /^(\[DISABLED - set \w+=1 to enable\]) /;
  const names = SES.clean.tools.map(t => t[0]);
  const gated = new Set(SES.clean.tools.filter(t => STAMP.test(t[1])).map(t => t[0]));
  box.innerHTML = GROUPS.map(([g, a, b]) => `<div class="lnm-grp"><h3>${g} <span>${b - a}</span></h3><ul>` +
    names.slice(a, b).map(n => `<li class="lnm-tool${gated.has(n) ? ' is-gated' : ''}" data-name="${n}"><code>${n}</code><span class="lnm-stamp"><span></span></span></li>`).join('') +
    '</ul></div>').join('');
  const rows = $$('.lnm-tool', box);
  let userPicked = false;
  function setMode(m) {
    const desc = Object.fromEntries(SES[m].tools);
    let n = 0;
    rows.forEach(r => {
      const hit = desc[r.dataset.name].match(STAMP);
      r.classList.toggle('is-off', !!hit);
      if (hit) { $('.lnm-stamp > span', r).textContent = hit[1]; n++; }
    });
    count.innerHTML = `<b>${n} of 18</b> marked disabled`;
    table.innerHTML = SES[m].tools.map(([nm, d]) => `<tr><td><code>${nm}</code></td><td>${esc(d)}</td></tr>`).join('');
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  }
  const showAll = () => { rows.forEach(r => r.classList.remove('is-hidden')); box.classList.remove('is-pre'); };
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { userPicked = true; showAll(); setMode(b.dataset.mode); }));
  setMode('clean');
  const api = demo(el, {
    reset() { userPicked = false; setMode('clean'); rows.forEach(r => r.classList.add('is-hidden')); box.classList.add('is-pre'); },
    final() { showAll(); setMode('clean'); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.remove('is-hidden'); await wait(40, me); }
      await wait(400, me);
      box.classList.remove('is-pre');
      await wait(1500, me);
      for (const m of ['exec', 'kill', 'typo']) {
        if (userPicked) return;
        setMode(m);
        await wait(1700, me);
      }
      if (!userPicked) setMode('clean');
    }
  });
  api.prepare = () => { userPicked = false; };
})();

/* 3. Looking around: scan_network's probes, one address at a time */
(() => {
  const el = $('#d-look'), grid = $('#pr-grid'), clock = $('#pr-clock'), term = $('#pr-term');
  const PORTS = [80, 443, 22, 445, 8080];
  const EMPTY = ['127.0.0.2', '127.0.0.3', '127.0.0.4', '127.0.0.5'];
  const scanEmpty = callOf('clean', 'scan_network', 0), scanLo = callOf('clean', 'scan_network', 1);
  const open = callOf('clean', 'check_port', 0), shut = callOf('clean', 'check_port', 1);
  const row = (a, cls = '') => `<span class="lnm-addr${cls}">${a}</span>` + PORTS.map(() => `<span class="lnm-cell${cls}"><i></i></span>`).join('');
  grid.innerHTML = '<span class="lnm-ph">Port</span>' + PORTS.map(p => `<span class="lnm-ph">${p}</span>`).join('') +
    EMPTY.map(a => row(a)).join('') + row('127.0.0.1', ' lnm-gap');
  const cells = $$('.lnm-cell', grid);
  const secs = ms => `${(ms / 1000).toFixed(3)} s`;
  const keyLine = (c, re) => c.text.split('\n').filter(l => re.test(l)).map(l => l.trim()).join(' ');
  const rows = [
    [scanEmpty, /"total_found"/], [scanLo, /"total_found"/], [open, /"status"/], [shut, /"status"/]
  ];
  term.innerHTML = rows.map(([c, re]) =>
    `<span class="dim">${esc(reqLine(c))}</span><span class="lnm-kv">${esc(keyLine(c, re))}<em>${c.ms >= 1000 ? secs(c.ms) : `${c.ms} ms`}</em></span>`).join('');
  const lines = $$('#pr-term > span');
  const show = (a, b) => lines.slice(a, b).forEach(s => s.classList.remove('is-off'));
  demo(el, {
    reset() {
      cells.forEach(c => c.classList.remove('is-probe', 'is-wait', 'is-ref'));
      clock.textContent = '0.0 s'; clock.classList.remove('is-real');
      lines.forEach(s => s.classList.add('is-off'));
    },
    final() {
      cells.forEach((c, i) => { c.classList.remove('is-probe'); c.classList.add(i < 20 ? 'is-wait' : 'is-ref'); });
      clock.textContent = `${secs(scanEmpty.ms)} measured`; clock.classList.add('is-real');
      show(0, lines.length);
    },
    async play(me) {
      await wait(400, me);
      for (let i = 0; i < 20; i++) {
        cells[i].classList.add('is-probe');
        await wait(125, me);
        cells[i].classList.replace('is-probe', 'is-wait');
        clock.textContent = `${((i + 1) * 0.5).toFixed(1)} s`;
      }
      clock.textContent = `${secs(scanEmpty.ms)} measured`; clock.classList.add('is-real');
      show(0, 2);
      await wait(800, me);
      for (let i = 20; i < 25; i++) { cells[i].classList.add('is-ref'); await wait(50, me); }
      show(2, 4);
      await wait(700, me);
      show(4, 6);
      await wait(450, me);
      show(6, 8);
    }
  });
})();

/* 4 to 6. Call lanes: each request meets the check, then stops at the line or crosses it */
const GATE = {
  execute_local_command: { v: 'LNMCP_ENABLE_EXEC', at: ':317', past: [':326', 'subprocess.run(command, shell=shell, …)'] },
  ssh_execute: { v: 'LNMCP_ENABLE_SSH_EXEC', at: ':241', past: [':256', 'client.exec_command(command, timeout=timeout)'] },
  kill_process: { v: 'LNMCP_ENABLE_KILL', at: ':436', past: [':446', 'process.terminate()'] }
};
const argsHTML = a => '{' + Object.entries(a).map(([k, v]) => {
  const s = esc(`${JSON.stringify(k)}: ${py(v)}`);
  return k === 'env' ? `<span class="lnm-envarg">${s}</span>` : s;
}).join(', ') + '}';

function lanes(id, spec) {
  const el = $(`#${id}`), box = $('.lnm-lanes', el), resp = $('.lnm-resp', el), envs = $('.lnm-envs', el);
  const rows = spec.rows.map(r => {
    const g = GATE[r.call.tool], j = JSON.parse(r.call.text);
    const ran = j.policy !== 'default-deny';
    const val = r.env[g.v];
    let result = 'Not reached';
    if (ran) result = r.call.tool === 'kill_process' ? j.message : `exit_code ${j.exit_code}, stdout ${JSON.stringify(j.stdout)}`;
    return { ...r, g, ran, val, result };
  });
  if (envs) {
    const env = spec.env;
    envs.innerHTML = '<span class="lnm-envs-h">Server environment</span>' + Object.values(GATE).map(({ v }) =>
      `<span class="lnm-var" data-var="${v}"><code>${v}</code><b class="${env[v] ? 'is-set' : ''}">${env[v] ? esc(JSON.stringify(env[v])) : 'unset'}</b></span>`).join('');
  }
  box.innerHTML = '<div class="lnm-lh" aria-hidden="true"><span>tools/call from the agent</span><span>The check</span><span></span><span>Past the line</span></div>' +
    rows.map((r, i) => `<div class="lnm-row">
      <button type="button" class="lnm-req" aria-pressed="false" aria-controls="${resp.id}">
        ${r.server ? `<span class="lnm-srv">${esc(r.server)}</span>` : ''}<span class="lnm-tool-n"><b>${i + 1}</b>${r.call.tool}</span>
        <code class="lnm-args">${argsHTML(r.call.args)}</code>
        ${r.call.args.env ? '<span class="lnm-why">Not read by the gate: this goes to the child process.</span>' : ''}
      </button>
      <div class="lnm-check">
        <span class="lnm-reads"><span class="lnm-ln">${r.g.at}</span> reads <code>${r.g.v}</code></span>
        <span class="lnm-val">${r.val ? esc(JSON.stringify(r.val)) : 'unset'}</span>
        <span class="lnm-verdict">${r.ran ? 'Allowed' : 'Refused'}<small>${r.call.ms} ms</small></span>
      </div>
      <div class="lnm-line" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="lnm-past">
        <code><span class="lnm-ln">${r.g.past[0]}</span> ${esc(r.g.past[1])}</code>
        <span class="lnm-res">${esc(r.result)}</span>
        ${r.after ? `<span class="lnm-after">${esc(r.after)}</span>` : ''}
      </div>
    </div>`).join('');
  const rowEls = $$('.lnm-row', box);
  const chip = v => envs && $(`.lnm-var[data-var="${v}"]`, envs);
  function showResp(i) {
    const r = rows[i];
    resp.classList.remove('is-empty');
    resp.innerHTML = `<p class="lnm-resp-h">Response to call ${i + 1}, as the agent receives it</p><pre>${markVars(esc(r.call.text))}</pre>`;
    rowEls.forEach((x, k) => $('.lnm-req', x).setAttribute('aria-pressed', String(k === i)));
  }
  const finish = (x, i) => x.classList.add('is-in', 'is-sent', 'is-read', 'is-done', rows[i].ran ? 'is-ran' : 'is-refused');
  rowEls.forEach((x, i) => $('.lnm-req', x).addEventListener('click', () => { finish(x, i); showResp(i); if (spec.onRow) spec.onRow(i); }));
  const show = spec.show ?? rows.length - 1;
  return demo(el, {
    reset() {
      rowEls.forEach(x => { x.className = 'lnm-row'; $('.lnm-req', x).setAttribute('aria-pressed', 'false'); });
      if (envs) $$('.lnm-var', envs).forEach(c => c.classList.remove('is-read'));
      resp.classList.add('is-empty');
      resp.innerHTML = '<p class="lnm-resp-h">Responses appear here</p>';
      if (spec.onReset) spec.onReset();
    },
    final() {
      rowEls.forEach(finish);
      rows.forEach((r, i) => { if (spec.onRow) spec.onRow(i); });
      showResp(show);
    },
    async play(me) {
      await wait(350, me);
      for (const [i, x] of rowEls.entries()) {
        const r = rows[i], c = chip(r.g.v);
        x.classList.add('is-in');
        await wait(300, me);
        x.classList.add('is-sent');
        await wait(350, me);
        x.classList.add('is-read');
        if (c) c.classList.add('is-read');
        await wait(r.call.args.env ? 1300 : 600, me);
        if (c) c.classList.remove('is-read');
        finish(x, i);
        showResp(i);
        if (spec.onRow) spec.onRow(i);
        await wait(r.ran ? 1200 : 800, me);
      }
      if (show !== rows.length - 1) showResp(show);
    }
  });
}

/* 4. A server with no opt-ins. pid checks are the capture script's, after each call (captures/lnmcp/pretty.log). */
lanes('d-refuse', {
  env: {},
  show: 1,
  rows: [
    { call: callOf('clean', 'execute_local_command', 0), env: {} },
    { call: callOf('clean', 'execute_local_command', 1), env: {} },
    { call: callOf('clean', 'ssh_execute'), env: {} },
    { call: callOf('clean', 'kill_process'), env: {}, after: 'pid 11650 still running' }
  ]
});

/* 5. Restarted with LNMCP_ENABLE_EXEC=1 */
lanes('d-run', {
  env: { LNMCP_ENABLE_EXEC: '1' },
  show: 0,
  rows: [
    { call: callOf('exec', 'execute_local_command'), env: { LNMCP_ENABLE_EXEC: '1' } },
    { call: callOf('exec', 'ssh_execute'), env: { LNMCP_ENABLE_EXEC: '1' } },
    { call: callOf('exec', 'kill_process'), env: { LNMCP_ENABLE_EXEC: '1' }, after: 'pid 11650 still running' }
  ]
});

/* 6. The same pid against three servers */
(() => {
  const proc = $('#kl-proc'), state = $('#kl-state');
  const alive = on => { proc.classList.toggle('is-gone', !on); state.textContent = on ? 'running' : 'gone'; };
  lanes('d-kill', {
    show: 2,
    rows: [
      { server: 'No opt-ins', call: callOf('clean', 'kill_process'), env: {}, after: 'pid 11650 still running' },
      { server: 'LNMCP_ENABLE_EXEC=1', call: callOf('exec', 'kill_process'), env: { LNMCP_ENABLE_EXEC: '1' }, after: 'pid 11650 still running' },
      { server: 'LNMCP_ENABLE_KILL=1', call: callOf('kill', 'kill_process'), env: { LNMCP_ENABLE_KILL: '1' }, after: 'pid 11650 gone' }
    ],
    onReset: () => alive(true),
    onRow: i => { if (i === 2) alive(false); }
  });
})();
