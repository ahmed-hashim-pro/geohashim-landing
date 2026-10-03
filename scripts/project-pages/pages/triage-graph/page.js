/* triage-graph. Every line of program output below was captured from the real CLI or the
   repo's own code on the bundled fixtures, with the fake model. */

// The CLI pads the speaker to 21 characters (cli.py, Progress.line).
const tgLine = (who, text) => who.padEnd(21) + text;

/* Hero terminal */
(() => {
  const L = tgLine;
  PAGE.terminal = {
    order: ['pause', 'approve', 'refuse'],
    first: 'pause',
    scenes: {
      pause: [
        ['cmd', 'uv run triage run --alert fixtures/alerts/high-latency.json --thread-id demo'],
        ['dim', 'triage run: thread demo, model fake, state in .triage'],
        ['out', L('intake', 'ALERT-1042 [high] checkout-api: checkout-api p99 latency above 1s')],
        ['out', L('supervisor', 'step 1/6 -> log_investigator: errors and warnings around the alert, and recent changes')],
        ['dim', L('log_investigator', "search_logs(start='2026-09-14T09:30:00Z', end='2026-09-14T10:35:00Z', min_level='WARN')")],
        ['cut', '[a second log search and four log groups]'],
        ['out', L('supervisor', 'step 2/6 -> metrics_investigator: which metrics moved, and when')],
        ['out', L('metrics_investigator', 'found: rps anomalous: baseline 400.62, peak 1013.11 (2.53x), onset 2026-09-14T10:00:00Z')],
        ['cut', '[cpu_pct and latency_p99_ms also anomalous]'],
        ['out', L('supervisor', 'step 3/6 -> runbook_agent: runbook guidance for these symptoms')],
        ['out', L('runbook_agent', 'found: best match: checkout-api.md > High latency with CPU saturation (score 8.88), suggested action: scale_up')],
        ['out', L('supervisor', 'enough evidence -> proposer (all specialists reported)')],
        ['out', L('proposer', 'proposes scale_up on checkout-api (proposal 8bedf438cdeb)')],
        ['out', L('approval', 'paused: waiting for a human decision')],
        ['out', ''],
        ['out', '=== Waiting for approval (thread demo) ==='],
        ['out', 'Proposal 8bedf438cdeb: scale_up on checkout-api'],
        ['out', 'Diagnosis: Request rate and CPU rose together with no memory growth: the service is short of capacity.'],
        ['out', 'Rationale: Exactly one rule matched the evidence. The top runbook section agrees.'],
        ['out', ''],
        ['dim', '  triage resume demo --approve'],
        ['dim', '  triage resume demo --reject --reason "..."'],
        ['dim', '  triage resume demo --edit {page_human|restart_service|rollback_deploy|scale_up}']
      ],
      approve: [
        ['cmd', 'uv run triage resume demo --approve --approver ahmed'],
        ['out', L('approval', 'approved by ahmed')],
        ['out', L('executor', 'would raise the replica ceiling of checkout-api by 50% (dry run)')],
        ['out', L('report', 'incident report written')],
        ['out', ''],
        ['ok', '=== Outcome: executed (would raise the replica ceiling of checkout-api by 50%)'],
        ['out', 'Report: .triage/reports/demo.md'],
        ['cut', '[the report follows; it is further down the page]'],
        ['out', ''],
        ['cmd', 'uv run triage resume demo --approve --approver ahmed'],
        ['err', "error: thread 'demo' is not waiting for approval (outcome: executed)"]
      ],
      refuse: [
        ['cmd', 'uv run triage resume load-test --edit drop_database --approver ahmed'],
        ['err', 'error: --edit must be one of: page_human, restart_service, rollback_deploy, scale_up'],
        ['out', ''],
        ['cmd', 'uv run triage show load-test'],
        ['out', ''],
        ['out', '=== Waiting for approval (thread load-test) ==='],
        ['out', 'Proposal d446c37dc585: scale_up on checkout-api'],
        ['cut', '[diagnosis, rationale and the three resume commands]'],
        ['out', ''],
        ['cmd', 'uv run triage resume load-test --reject --reason "traffic is a load test" --approver ahmed'],
        ['out', L('approval', 'rejected by ahmed: traffic is a load test')],
        ['out', L('report', 'incident report written')],
        ['out', ''],
        ['err', '=== Outcome: rejected (traffic is a load test)'],
        ['out', 'Report: .triage/reports/load-test.md']
      ]
    }
  };
})();

/* Passing tests per file, from the full run (133 passed, 1 skipped) */
PAGE.tests = [
  ['tests/test_approval.py', 26, 'var(--yellow)'],
  ['tests/test_graph.py', 18, 'var(--blue)'],
  ['tests/test_tools.py', 18, 'var(--water)'],
  ['tests/test_cli.py', 14, 'var(--magenta)'],
  ['tests/test_actions.py', 13, 'var(--green)'],
  ['tests/test_crewai_port.py, test_crewai_resume.py', 15, 'var(--ink-2)'],
  ['evals/test_evals.py', 10, 'var(--deep)'],
  ['tests/test_fixtures.py, fake_model, docs, crash_resume', 19, 'var(--ink)']
];

/* The tour ends with a link to "#answer" on the reference page; here the end result is the report. */
(() => {
  const ta = $('#tour-ans');
  if (ta) { ta.href = '#report'; ta.textContent = 'See the report'; }
})();

/* 1. Dispatch: the step counter, with the default limit and with 2 */
(() => {
  const el = $('#d-steps'), host = $('#tg-lanes');
  const LANES = [
    {
      flag: '--max-steps 6', sub: 'The default', max: 6, labels: ['logs', 'metrics', 'runbooks'],
      calls: [4, 7, 10], end: 12, go: true,
      exit: 'Enough evidence: on to the proposer, then the approval gate.',
      lines: [
        tgLine('supervisor', 'step 1/6 -> log_investigator: errors and warnings around the alert, and recent changes'),
        tgLine('supervisor', 'step 2/6 -> metrics_investigator: which metrics moved, and when'),
        tgLine('supervisor', 'step 3/6 -> runbook_agent: runbook guidance for these symptoms'),
        tgLine('supervisor', 'enough evidence -> proposer (all specialists reported)')
      ]
    },
    {
      flag: '--max-steps 2', sub: 'A short leash', max: 2, labels: ['logs', 'metrics'],
      calls: [4, 7], end: 7, go: false,
      exit: 'Escalated, straight to the report. The gate is never reached, so nothing runs.',
      lines: [
        tgLine('supervisor', 'step 1/2 -> log_investigator: errors and warnings around the alert, and recent changes'),
        tgLine('supervisor', 'step 2/2 -> metrics_investigator: which metrics moved, and when'),
        tgLine('supervisor', 'stop: insufficient evidence, escalating: no proposal after 2 supervisor steps (limit 2)')
      ]
    }
  ];
  host.innerHTML = LANES.map((ln, k) => {
    const cells = Array.from({ length: 6 }, (_, i) => {
      const cls = i >= ln.max ? 'tg-slot is-limit' : 'tg-slot';
      const label = i < ln.labels.length ? ln.labels[i] : i < ln.max ? 'unused' : '';
      return `<li class="${cls}"${i === ln.max ? ' data-wall' : ''}><b>${i + 1}</b><span>${label}</span></li>`;
    }).join('');
    return `<div class="tg-lane" data-lane="${k}">
      <div class="tg-lane-head"><code>${ln.flag}</code><span>${ln.sub}</span><span class="tg-calls">Model calls <b>0</b></span></div>
      <ol class="tg-slots">${cells}</ol>
      <p class="tg-exit ${ln.go ? 'is-go' : 'is-stop'}">${ln.exit}</p>
      <div class="mini-term tg-lt">${ln.lines.map(t => `<span>${esc(t)}</span>`).join('')}</div>
    </div>`;
  }).join('');
  const lanes = $$('.tg-lane', host).map((node, k) => ({
    ...LANES[k], node, slots: $$('.tg-slot', node), lines: $$('.tg-lt > span', node),
    count: $('.tg-calls b', node), exitEl: $('.tg-exit', node)
  }));
  const setCount = (ln, n) => { ln.count.textContent = String(n); };
  const fillStep = (ln, i) => {
    ln.slots[i].classList.add('is-on');
    ln.lines[i].classList.remove('is-off');
    setCount(ln, ln.calls[i]);
  };
  const finishLane = ln => {
    ln.slots.forEach((s, i) => { if (i >= ln.labels.length && i < ln.max) s.classList.add('is-unused'); });
    if (!ln.go) ln.node.classList.add('is-hit');
    ln.lines[ln.lines.length - 1].classList.remove('is-off');
    ln.exitEl.classList.add('in');
    setCount(ln, ln.end);
  };
  demo(el, {
    reset() {
      lanes.forEach(ln => {
        ln.slots.forEach(s => s.classList.remove('is-on', 'is-unused'));
        ln.lines.forEach(l => l.classList.add('is-off'));
        ln.node.classList.remove('is-hit');
        ln.exitEl.classList.remove('in');
        setCount(ln, 0);
      });
    },
    final() {
      lanes.forEach(ln => {
        ln.labels.forEach((_, i) => fillStep(ln, i));
        finishLane(ln);
      });
    },
    async play(me) {
      const [a, b] = lanes;
      await wait(450, me);
      for (let i = 0; i < 2; i++) { fillStep(a, i); fillStep(b, i); await wait(850, me); }
      fillStep(a, 2);
      finishLane(b);
      await wait(1000, me);
      finishLane(a);
      await wait(400, me);
    }
  });
})();

/* 2. Evidence: log groups, then each metric against the two tests */
(() => {
  const el = $('#d-metrics'), logsEl = $('#tg-logs'), mx = $('#tg-mx');
  const LOGS = [
    ['ERROR', 'app', 'upstream timeout calling pricing-service after 2000ms', 8],
    ['WARN', 'app', 'worker pool saturated: 64/64 busy, queue depth 26', 28],
    ['WARN', 'app', 'slow request POST /api/checkout took 1160ms', 7],
    ['WARN', 'autoscaler', 'checkout-api at max replicas (6/6); cannot scale further', 1]
  ];
  // [metric, baseline, peak, ratio, rise, floor, anomalous, onset]
  const MX = [
    ['rps', '400.62', '1013.11', 2.53, '612.49', '50', true, '10:00'],
    ['cpu_pct', '38.65', '98.63', 2.55, '59.98', '15', true, '10:01'],
    ['latency_p99_ms', '180.47', '1727.16', 9.57, '1546.69', '150', true, '10:13'],
    ['memory_pct', '54.43', '56.94', 1.05, '2.51', '15', false],
    ['error_rate_pct', '0.2', '0.64', 3.2, '0.44', '1', false]
  ];
  logsEl.innerHTML = LOGS.map(([lv, src, msg, n]) =>
    `<li><span class="tg-lv${lv === 'ERROR' ? ' is-err' : ''}">${lv}</span><span class="tg-msg"><small>${src}</small>${esc(msg)}</span><span class="tg-cnt"><span class="tg-cbar"><i style="--w:${r1(n / 28 * 100)}%"></i></span><b>${n}</b></span></li>`).join('');
  logsEl.insertAdjacentHTML('afterend', '<p class="tg-foot">44 matching lines, 4 templates</p>');
  mx.insertAdjacentHTML('beforeend', MX.map(([m, b, p, r, rise, floor, yes, onset]) => {
    const rOk = r >= 1.5, dOk = yes;
    return `<div class="tg-mrow${yes ? ' is-anom' : ''}${m === 'error_rate_pct' ? ' is-note' : ''}">
      <span class="tg-mname"><code>${m}</code></span>
      <span class="tg-track"><i class="tg-fill" style="--w:${r1(Math.min(r / 10, 1) * 100)}%"></i></span>
      <span class="tg-mnum">${b} → ${p}${onset ? `, from ${onset}` : ''}</span>
      <span class="tg-mchk"><span class="tg-c ${rOk ? 'ok' : 'no'}">${r.toFixed(2)}x</span><span class="tg-c ${dOk ? 'ok' : 'no'}">+${rise}, needs ${floor}</span></span>
      <span class="tg-verdict ${yes ? 'is-yes' : 'is-no'}">${yes ? 'Anomalous' : 'Within baseline'}</span>
      ${m === 'error_rate_pct' ? '<span class="tg-mnote">3.2x clears the ratio, but a rise of 0.44 is under the 1-point floor, so it is not flagged.</span>' : ''}
    </div>`;
  }).join(''));
  const logRows = $$('li', logsEl), rows = $$('.tg-mrow', mx);
  demo(el, {
    reset() {
      el.classList.add('tg-m-reset');
      logRows.forEach(r => r.classList.remove('in'));
      rows.forEach(r => r.classList.remove('in', 'is-judged'));
    },
    final() {
      el.classList.remove('tg-m-reset');
      logRows.forEach(r => r.classList.add('in'));
      rows.forEach(r => r.classList.add('in', 'is-judged'));
    },
    async play(me) {
      el.classList.remove('tg-m-reset');
      await wait(350, me);
      for (const r of logRows) { r.classList.add('in'); await wait(260, me); }
      await wait(400, me);
      for (const r of rows) {
        r.classList.add('in');
        await wait(700, me);
        r.classList.add('is-judged');
        await wait(r.classList.contains('is-note') ? 900 : 350, me);
      }
    }
  });
})();

/* 3. Runbooks: every runbook, then only this service's */
(() => {
  const el = $('#d-runbooks'), host = $('#tg-rb');
  const COLS = [
    ['Every runbook', 'An unscoped search', [
      ['orders-api.md', 'Intermittent 5xx errors', 13.54, 'page_human', true],
      ['payments-api.md', 'Error rate spike after a deploy', 13.43, 'rollback_deploy', false],
      ['checkout-api.md', 'Elevated errors after a release', 9.01, 'rollback_deploy', false]
    ], '<b>13.54</b> against <b>13.43</b>: the right section wins by 0.11, over a rollback runbook for another service.', 'is-close'],
    ['orders-api and the general policy', 'What the runbook agent searches', [
      ['orders-api.md', 'Intermittent 5xx errors', 10.99, 'page_human', true],
      ['orders-api.md', 'Overview', 3.17, null, false],
      ['general.md', 'Allowed automated actions', 1.92, null, false]
    ], '<b>10.99</b> against <b>3.17</b>: one clear winner, which suggests <code>page_human</code>.', 'is-clear']
  ];
  host.innerHTML = COLS.map(([h, sub, list, call, cls]) => `<div class="tg-rb-col">
      <h3>${h}</h3><p>${sub}</p>
      <ol>${list.map(([f, head, s, act, top], i) => `<li class="tg-rb-row${top ? ' is-top' : ''}">
        <span class="tg-rb-rank">${i + 1}</span>
        <span class="tg-rb-name"><small>${f}</small>${esc(head)}</span>
        <span class="tg-rb-score">${s.toFixed(2)}</span>
        <span class="tg-rb-bar"><i style="--w:${r1(s / 14 * 100)}%"></i></span>
        <span class="tg-rb-act">${act ? `suggests <code>${act}</code>` : 'no suggested action'}</span>
      </li>`).join('')}</ol>
      <p class="tg-rb-call ${cls}">${call}</p>
    </div>`).join('');
  const cols = $$('.tg-rb-col', host);
  const show = (c, on) => { $$('.tg-rb-row', c).forEach(r => r.classList.toggle('in', on)); $('.tg-rb-call', c).classList.toggle('in', on); };
  demo(el, {
    reset() { cols.forEach(c => show(c, false)); },
    final() { cols.forEach(c => show(c, true)); },
    async play(me) {
      await wait(350, me);
      for (const c of cols) {
        for (const r of $$('.tg-rb-row', c)) { r.classList.add('in'); await wait(340, me); }
        await wait(300, me);
        $('.tg-rb-call', c).classList.add('in');
        await wait(900, me);
      }
    }
  });
})();

/* 4. Propose: the model's ask against the allow-list and the alerting service */
(() => {
  const el = $('#d-propose'), host = $('#tg-props');
  const ROWS = [
    {
      who: 'Fake model, high-latency fixture', alert: 'checkout-api', ask: ['scale_up', 'checkout-api'],
      checks: ['pass', 'pass'], shown: ['scale_up', 'checkout-api'],
      note: 'Exactly one rule matched the evidence. The top runbook section agrees.', refused: false
    },
    {
      who: '<code>ProposesAction(action="drop_database")</code>', alert: 'checkout-api', ask: ['drop_database', 'checkout-api'],
      checks: ['fail', 'skip'], shown: ['page_human', 'checkout-api'],
      note: "the model proposed 'drop_database', which is not on the allow-list; refused", refused: true
    },
    {
      who: '<code>ProposesAction(action="restart_service", target="inventory-api")</code>', alert: 'orders-api', ask: ['restart_service', 'inventory-api'],
      checks: ['pass', 'fail'], shown: ['page_human', 'orders-api'],
      note: "the model proposed restart_service on 'inventory-api', but only the alerting service (orders-api) may be acted on; refused", refused: true
    }
  ];
  const WORD = { pass: 'yes', fail: 'no', skip: 'not checked' };
  host.innerHTML = ROWS.map(r => `<div class="tg-prow${r.refused ? ' is-refused' : ''}">
      <div class="tg-pask"><small>Alert on ${r.alert}. Model: ${r.who}</small><b><code>${r.ask[0]}</code> on <code>${r.ask[1]}</code></b></div>
      <ol class="tg-pchk">
        <li data-s="${r.checks[0]}"><i aria-hidden="true"></i>On the allow-list <em>${WORD[r.checks[0]]}</em></li>
        <li data-s="${r.checks[1]}"><i aria-hidden="true"></i>Aimed at ${r.alert} <em>${WORD[r.checks[1]]}</em></li>
      </ol>
      <div class="tg-pshow"><small>The human is shown</small><b><code>${r.shown[0]}</code> on <code>${r.shown[1]}</code></b><span class="tg-pnote">${r.refused ? 'Note: ' : 'Rationale: '}${esc(r.note)}</span></div>
    </div>`).join('');
  const rows = $$('.tg-prow', host);
  const parts = r => ({ ask: $('.tg-pask', r), checks: $$('.tg-pchk li', r), show: $('.tg-pshow', r) });
  demo(el, {
    reset() { rows.forEach(r => { const p = parts(r); p.ask.classList.remove('in'); p.show.classList.remove('in'); p.checks.forEach(c => c.classList.remove('in', 'is-active')); }); },
    final() { rows.forEach(r => { const p = parts(r); p.ask.classList.add('in'); p.show.classList.add('in'); p.checks.forEach(c => c.classList.add('in')); }); },
    async play(me) {
      await wait(350, me);
      for (const r of rows) {
        const p = parts(r);
        p.ask.classList.add('in');
        await wait(450, me);
        for (const c of p.checks) {
          c.classList.add('is-active');
          await wait(380, me);
          c.classList.remove('is-active');
          c.classList.add('in');
        }
        await wait(250, me);
        p.show.classList.add('in');
        await wait(700, me);
      }
    }
  });
})();

/* 5. The gate: one paused proposal, six decisions */
(() => {
  const el = $('#d-gate'), checks = $$('#g-checks li'), hold = $('#g-hold'), holdSay = $('#g-hold-say');
  const pidEl = $('#g-pid'), dec = $('#g-dec'), via = $('#g-via'), cmdEl = $('#g-cmd');
  const exec = $('#g-exec'), ledger = $('#g-ledger'), out = $('#g-out'), term = $('#g-term');
  const L = tgLine;
  const OK = ['pass', 'ok'], NOT_EDIT = ['skip', 'not an edit'], NR = ['unreached', 'not reached'];
  const MODES = {
    approve: {
      pid: '8bedf438cdeb', via: 'From the CLI', cmd: 'uv run triage resume demo --approve --approver ahmed',
      checks: [OK, OK, NOT_EDIT, ['pass', 'approve']], cross: true,
      exec: 'would raise the replica ceiling of checkout-api by 50% (dry run)',
      ledger: '{"proposal_id":"8bedf438cdeb","action":"scale_up","target":"checkout-api","dry_run":true,"detail":"would raise the replica ceiling of checkout-api by 50%","recorded_at":"2026-10-03T21:41:27.169971Z"}',
      out: 'Outcome: executed, as a dry run',
      term: [['', L('approval', 'approved by ahmed')], ['', L('executor', 'would raise the replica ceiling of checkout-api by 50% (dry run)')], ['', L('report', 'incident report written')], ['ok', '=== Outcome: executed (would raise the replica ceiling of checkout-api by 50%)']]
    },
    edit: {
      pid: 'f4fbe915d9d5', via: 'From the CLI', cmd: 'uv run triage resume edit --edit restart_service --approver ahmed',
      checks: [OK, OK, ['pass', 'restart_service is allowed'], ['pass', 'edit']], cross: true,
      exec: 'would perform a rolling restart of checkout-api (dry run)',
      ledger: '{"proposal_id":"f4fbe915d9d5","action":"restart_service","target":"checkout-api","dry_run":true,"detail":"would perform a rolling restart of checkout-api","recorded_at":"2026-10-03T21:55:49.067323Z"}',
      out: 'Outcome: executed the edit, not the proposal',
      term: [['', L('approval', 'edited by ahmed, action changed to restart_service')], ['', L('executor', 'would perform a rolling restart of checkout-api (dry run)')], ['', L('report', 'incident report written')], ['ok', '=== Outcome: executed (would perform a rolling restart of checkout-api)']]
    },
    reject: {
      pid: 'd446c37dc585', via: 'From the CLI', cmd: 'uv run triage resume load-test --reject --reason "traffic is a load test" --approver ahmed',
      checks: [OK, OK, NOT_EDIT, ['stop', 'rejected']], cross: false, say: 'Held',
      out: 'Outcome: rejected, nothing executed. The run is over.',
      term: [['', L('approval', 'rejected by ahmed: traffic is a load test')], ['', L('report', 'incident report written')], ['err', '=== Outcome: rejected (traffic is a load test)']]
    },
    offlist: {
      pid: 'd446c37dc585', via: 'From the CLI', cmd: 'uv run triage resume load-test --edit drop_database --approver ahmed',
      cli: true, checks: [NR, NR, NR, NR], cross: false, say: 'Not sent',
      out: 'Still paused: the CLI refused the edit before resuming, exit 2.',
      term: [['err', 'error: --edit must be one of: page_human, restart_service, rollback_deploy, scale_up'], ['cmd', 'uv run triage show load-test'], ['', '=== Waiting for approval (thread load-test) ==='], ['', 'Proposal d446c37dc585: scale_up on checkout-api']]
    },
    wrong: {
      pid: '75aac299019e', via: 'Through the API, as the tests do', cmd: '{"decision": "approve", "proposal_id": "5f0c1d2e9a41"}',
      checks: [OK, ['fail', '5f0c1d2e9a41 is not 75aac299019e'], NR, NR], cross: false, say: 'Held',
      out: 'Outcome: refused, nothing executed. The run is over.',
      term: [['err', L('approval', "refused: decision is for proposal '5f0c1d2e9a41', but the pending proposal is '75aac299019e'")], ['', L('report', 'incident report written')]]
    },
    extra: {
      pid: 'e2db1e5e00a9', via: 'Through the API, as the tests do', cmd: '{"decision": "approve", "proposal_id": "e2db1e5e00a9", "execute_now": true}',
      checks: [['fail', 'extra field'], NR, NR, NR], cross: false, say: 'Held',
      out: 'Outcome: refused, nothing executed. The run is over.',
      term: [['err', L('approval', 'refused: malformed decision, treated as a rejection: Extra inputs are not permitted')], ['', L('report', 'incident report written')]]
    }
  };
  let mode = 'reject', userPicked = false;
  const line = (cls, text) => { const s = document.createElement('span'); if (cls) s.className = cls; s.textContent = text; term.appendChild(s); };
  const head = m => {
    const d = MODES[m];
    pidEl.textContent = d.pid;
    via.textContent = d.via;
    cmdEl.textContent = d.cmd;
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  };
  const setCheck = (li, [s, word]) => { li.dataset.s = s; $('em', li).textContent = word; };
  const clear = () => {
    checks.forEach(li => { li.dataset.s = 'idle'; $('em', li).textContent = ''; });
    hold.classList.remove('is-open', 'is-held');
    holdSay.textContent = '';
    dec.classList.remove('in', 'is-bad');
    exec.className = 'tg-card tg-exec';
    exec.textContent = '';
    ledger.textContent = '';
    out.textContent = '';
    out.className = 'tg-outcome';
    term.replaceChildren();
  };
  const settle = d => {
    if (d.cross) {
      hold.classList.add('is-open');
      holdSay.textContent = 'Cleared';
      exec.classList.add('is-run');
      exec.textContent = d.exec;
      ledger.textContent = d.ledger;
      out.classList.add('is-go');
    } else {
      hold.classList.add('is-held');
      holdSay.textContent = d.say;
      exec.classList.add('is-none');
      exec.textContent = 'Not executed';
      ledger.textContent = '(no new line)';
      out.classList.add('is-stop');
    }
    out.textContent = d.out;
  };
  const startTerm = d => {
    if (d.cmd.startsWith('uv')) line('cmd', d.cmd);
    else { line('dim', '# resume value, sent with runner.resume()'); line('', d.cmd); }
  };
  const renderFinal = m => {
    const d = MODES[m];
    clear();
    head(m);
    dec.classList.add('in');
    if (d.cli) dec.classList.add('is-bad');
    d.checks.forEach((c, i) => setCheck(checks[i], c));
    settle(d);
    startTerm(d);
    d.term.forEach(([c, t]) => line(c, t));
  };
  async function playMode(m, me) {
    const d = MODES[m];
    clear();
    head(m);
    await wait(250, me);
    dec.classList.add('in');
    startTerm(d);
    await wait(600, me);
    if (d.cli) {
      dec.classList.add('is-bad');
      line(...d.term[0]);
      await wait(500, me);
      checks.forEach((li, i) => setCheck(li, d.checks[i]));
      settle(d);
      for (const t of d.term.slice(1)) { line(...t); await wait(260, me); }
      return;
    }
    for (let i = 0; i < checks.length; i++) {
      const c = d.checks[i];
      if (c[0] === 'unreached') { setCheck(checks[i], c); continue; }
      checks[i].dataset.s = 'active';
      await wait(420, me);
      setCheck(checks[i], c);
    }
    await wait(350, me);
    settle(d);
    for (const t of d.term) { line(...t); await wait(240, me); }
    await wait(300, me);
  }
  const d = demo(el, {
    reset() { clear(); head(mode); },
    final() { renderFinal(mode); },
    async play(me) {
      if (userPicked) { await playMode(mode, me); return; }
      await playMode('approve', me);
      await wait(1800, me);
      if (userPicked) return;
      await playMode('reject', me);
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { userPicked = true; mode = b.dataset.mode; d.start(); }));
  // The tour shows a decision crossing the line, then one being held at it.
  d.prepare = () => { userPicked = false; mode = 'reject'; };
})();

/* 6. After the gate: kill and resume, or forged state handed to the executor */
(() => {
  const el = $('#d-act'), nodes = $$('#tg-pipe li'), log = $('#tg-vlog');
  const proc = $('#tg-proc'), cards = $$('.tg-pc', proc), forged = $('#tg-forged');
  const L = tgLine;
  const LEDGER = '{"proposal_id":"9e269d82445f","action":"restart_service","target":"inventory-api","dry_run":true,"detail":"would perform a rolling restart of inventory-api","recorded_at":"2026-10-03T21:43:19.432790Z"}';
  const RUN = [
    ['dim', '$ triage run --alert fixtures/alerts/memory-leak.json --thread-id crash --wait'],
    ['dim', '[the investigation, cut]'],
    ['', L('proposer', 'proposes restart_service on inventory-api (proposal 9e269d82445f)')],
    ['', L('approval', 'paused: waiting for a human decision')],
    ['dim', '[the proposal and the resume commands, cut]'],
    ['', 'Decision: approve | reject [reason] | edit ACTION | Enter to decide later'],
    ['', '> ']
  ];
  const KILL = ['err', '# killed with kill -9 while it waits: exit status -9, no ledger file'];
  const RESUME = [['dim', '$ triage resume crash --approve --approver ahmed'], ['', L('approval', 'approved by ahmed')]];
  const AFTER = [
    ['', L('executor', 'would perform a rolling restart of inventory-api (dry run)')],
    ['', L('report', 'incident report written')],
    ['ok', '=== Outcome: executed (would perform a rolling restart of inventory-api)'],
    ['dim', '# dry_run_ledger.jsonl'],
    ['', LEDGER]
  ];
  const FORGED = [
    [1, '# decision: reject', "ApprovalRequiredError: decision is 'reject', not an approval"],
    [2, '# approve, but for proposal p2 while p1 is pending', 'ApprovalRequiredError: the approval is for a different proposal'],
    [3, '# approved, but the action is drop_database', "ActionNotAllowedError: 'drop_database' is not an allowed action; allowed: ['page_human', 'restart_service', 'rollback_deploy', 'scale_up']"],
    [4, '# approved scale_up, but aimed at payments-api while checkout-api is alerting', 'ApprovalRequiredError: the proposal targets a service other than the alerting one']
  ];
  let scn = 'crash';
  const say = ([cls, text]) => { const s = document.createElement('span'); if (cls) s.className = cls; s.textContent = text; log.appendChild(s); };
  const clearNodes = () => nodes.forEach(n => n.classList.remove('is-active', 'is-pass', 'is-fail'));
  const pass = async (i, me, ms = 330) => { nodes[i].classList.add('is-active'); await wait(ms, me); nodes[i].classList.remove('is-active'); nodes[i].classList.add('is-pass'); };
  const view = () => {
    const isCrash = scn === 'crash';
    proc.hidden = !isCrash;
    forged.hidden = isCrash;
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scn === scn)));
  };
  const resetView = () => {
    view();
    clearNodes();
    log.replaceChildren();
    cards.forEach(c => c.classList.remove('in', 'is-dead', 'is-done'));
  };
  const finalView = () => {
    resetView();
    if (scn === 'crash') {
      cards.forEach(c => c.classList.add('in'));
      cards[0].classList.add('is-dead');
      cards[2].classList.add('is-done');
      nodes.forEach(n => n.classList.add('is-pass'));
      [...RUN, KILL, ...RESUME, ...AFTER].forEach(say);
    } else {
      const [k] = FORGED[FORGED.length - 1];
      nodes.forEach((n, i) => { if (i < k) n.classList.add('is-pass'); });
      nodes[k].classList.add('is-fail');
      FORGED.forEach(([, c, e]) => { say(['dim', c]); say(['err', e]); });
      say(['dim', '# ledger after all four: empty']);
    }
  };
  const SCN = {
    async crash(me) {
      await wait(300, me);
      cards[0].classList.add('in');
      for (const l of RUN) { say(l); await wait(230, me); }
      await wait(450, me);
      cards[0].classList.add('is-dead');
      say(KILL);
      await wait(700, me);
      cards[1].classList.add('in');
      await wait(900, me);
      cards[2].classList.add('in');
      for (const l of RESUME) { say(l); await wait(260, me); }
      for (let i = 0; i < 5; i++) await pass(i, me);
      await pass(5, me, 450);
      for (const l of AFTER) { say(l); await wait(220, me); }
      cards[2].classList.add('is-done');
      await wait(300, me);
    },
    async forged(me) {
      await wait(300, me);
      for (const [k, c, e] of FORGED) {
        clearNodes();
        say(['dim', c]);
        for (let i = 0; i < k; i++) await pass(i, me, 200);
        nodes[k].classList.add('is-active');
        await wait(380, me);
        nodes[k].classList.remove('is-active');
        nodes[k].classList.add('is-fail');
        say(['err', e]);
        await wait(800, me);
      }
      say(['dim', '# ledger after all four: empty']);
    }
  };
  const d = demo(el, { reset: resetView, final: finalView, play: me => SCN[scn](me) });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { scn = b.dataset.scn; d.start(); }));
  d.prepare = () => { scn = 'crash'; };
})();

/* The report from the Approve tab, as written to .triage/reports/demo.md */
(() => {
  const pre = $('#tg-report');
  if (!pre) return;
  const MD = [
    '# Incident report: checkout-api p99 latency above 1s',
    '',
    '- Alert: ALERT-1042 (high) on `checkout-api`, fired 2026-09-14T10:30:00Z',
    '- Outcome: **executed** `scale_up` on `checkout-api` (dry run)',
    '- Model: fake',
    '- Supervisor steps: 3 of 6',
    '- Model calls: 12; tokens in/out: 9536/747 (estimated: chars / 4, fake model)',
    '',
    '## Diagnosis',
    '',
    'Request rate and CPU rose together with no memory growth: the service is short of capacity.',
    '',
    '## Proposed action',
    '',
    '`scale_up` on `checkout-api` (proposal 8bedf438cdeb)',
    '',
    'Exactly one rule matched the evidence. The top runbook section agrees.',
    '',
    '## Human decision',
    '',
    '- Decision: **approve**',
    '- Decided by: ahmed',
    '',
    '## Execution',
    '',
    '- would raise the replica ceiling of checkout-api by 50%',
    '- Recorded at 2026-10-03T21:41:27.169971Z',
    '',
    '## Evidence',
    '',
    '[### Logs: cut here]',
    '',
    '### Metrics',
    '',
    'Focus: which metrics moved, and when',
    '',
    "Specialist's summary:",
    '',
    '> rps anomalous: baseline 400.62, peak 1013.11 (2.53x), onset 2026-09-14T10:00:00Z',
    '> cpu_pct anomalous: baseline 38.65, peak 98.63 (2.55x), onset 2026-09-14T10:01:00Z',
    '> latency_p99_ms anomalous: baseline 180.47, peak 1727.16 (9.57x), onset 2026-09-14T10:13:00Z',
    '> within baseline: memory_pct, error_rate_pct',
    '',
    'What the tools returned:',
    '',
    "- `detect_metric_anomalies(start='2026-09-14T07:30:00Z', end='2026-09-14T10:35:00Z')`",
    '  - **rps**: 400.62 -> 1013.11 (2.53x), onset 2026-09-14T10:00:00Z',
    '  - **cpu_pct**: 38.65 -> 98.63 (2.55x), onset 2026-09-14T10:01:00Z',
    '  - **latency_p99_ms**: 180.47 -> 1727.16 (9.57x), onset 2026-09-14T10:13:00Z',
    '  - within baseline: memory_pct, error_rate_pct',
    '',
    '[### Runbooks: cut here]',
    '',
    '## Supervisor decisions',
    '',
    '1. -> log_investigator: no findings from log_investigator yet',
    '2. -> metrics_investigator: no findings from metrics_investigator yet',
    '3. -> runbook_agent: no findings from runbook_agent yet',
    '4. -> propose: all specialists reported'
  ];
  pre.innerHTML = MD.map(l => {
    if (l.startsWith('[')) return `<span class="tg-md-cut">${esc(l)}</span>`;
    if (l.startsWith('#')) return `<span class="tg-md-h">${esc(l)}</span>`;
    return esc(l);
  }).join('\n');
})();
