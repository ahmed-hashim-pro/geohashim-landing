/* Every call, reply, command and log line below was captured from the real binary over stdio.
   CAP.cycle is the session in the hero and stage 4; CAP.broken comes from a scratch build with the classifier broken on purpose. */
const CAP = /*@@DATA:captures@@*/;
const AUDIT = /*@@DATA:audit@@*/;
const C = CAP.cycle;

const callLine = e => `agent → ${e.tool} ${e.args}`;
const decisionOf = reply => JSON.parse(reply).decision;
const tone = reply => ({ refused: 'err', error: 'err', allowed: 'ok', executed: 'ok' })[decisionOf(reply)] || 'out';
const cliLines = e => e.out.map(t => (t.startsWith('[stderr] ') ? ['err', t.slice(9)] : ['out', t]));
const sqlOf = e => JSON.parse(e.args).sql;

/* Hero terminal */
(() => {
  const ev = e => (e.k === 'call' ? [['out', callLine(e)], [tone(e.reply), e.reply]] : [['cmd', e.cmd], ...cliLines(e)]);
  const gap = ['out', ''];
  PAGE.terminal = {
    scenes: {
      read: [['dim', '# the agent, over MCP on stdio'], ...ev(C[0]), gap, ...ev(C[2]), gap, ...ev(C[4])],
      held: [['dim', '# the agent asks for the write'], ...ev(C[5]), gap, ...ev(C[6]), gap, ['dim', "# the operator, in their own terminal"], ...ev(C[7])],
      approved: [['dim', '# the operator approves'], ...ev(C[8]), gap, ['dim', '# the agent runs it, then tries again'], ...ev(C[11]), gap, ...ev(C[12])]
    },
    order: ['held', 'approved', 'read'],
    first: 'held'
  };
})();

/* Tests per package, from go test -race -count=1 -json ./... (65 tests plus 73 subtests) */
PAGE.tests = [['internal/policy', 47, 'var(--blue)'], ['internal/mcpsrv', 27, 'var(--magenta)'], ['internal/approval', 21, 'var(--yellow)'], ['cmd/sqlguard', 21, 'var(--water)'], ['internal/db', 17, 'var(--green)'], ['internal/audit', 5, 'var(--ink-2)']];

/* 1. The classifier: ten real replies, highlighted with the scan rules of internal/policy/classify.go */
(() => {
  const el = $('#d-classify'), list = $('#sg-cls'), tallyEl = $('#sg-tally');
  const R = CAP.refusals;
  const PICK = [R[8], R[2], R[7], CAP.real[2], R[3], R[4], R[5], R[6], R[0], R[1]];
  const WRITE = new Set(['INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'MERGE', 'UPSERT']);
  const DDL = new Set(['CREATE', 'DROP', 'ALTER', 'TRUNCATE', 'RENAME', 'GRANT', 'REVOKE', 'PRAGMA', 'ATTACH', 'DETACH', 'VACUUM', 'REINDEX']);
  const READ = new Set(['SELECT', 'WITH', 'VALUES', 'EXPLAIN', 'SHOW', 'DESCRIBE', 'DESC', 'TABLE']);
  const isWord = c => /[A-Za-z0-9_]/.test(c);
  const isSpace = c => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  function scan(sql) {
    const segs = [], words = [];
    let i = 0, ended = false, plain = '', err = false;
    const flush = () => { if (plain) { segs.push({ t: plain }); plain = ''; } };
    while (i < sql.length) {
      const c = sql[i];
      if (ended) {
        if (!isSpace(c)) { err = true; break; }
        plain += c; i++; continue;
      }
      if ((c === '-' && sql[i + 1] === '-') || (c === '/' && sql[i + 1] === '*')) { err = true; break; }
      if (c === "'" || c === '"' || c === '`' || c === '[') {
        const close = c === '[' ? ']' : c, doubling = c !== '[';
        let j = i + 1;
        for (; j < sql.length; j++) {
          if (sql[j] !== close) continue;
          if (doubling && sql[j + 1] === close) { j++; continue; }
          break;
        }
        flush(); segs.push({ t: sql.slice(i, j + 1), q: true }); i = j + 1; continue;
      }
      if (c === ';') { plain += c; ended = true; i++; continue; }
      if (isWord(c)) {
        let j = i;
        while (j < sql.length && isWord(sql[j])) j++;
        flush(); segs.push({ t: sql.slice(i, j), w: words.length }); words.push(sql.slice(i, j).toUpperCase()); i = j; continue;
      }
      plain += c; i++;
    }
    flush();
    if (err) segs.push({ t: sql.slice(i), x: true });
    let hit = -1, verdict;
    if (err) verdict = 'unparsed';
    else if ((hit = words.findIndex(w => WRITE.has(w))) >= 0) verdict = 'write';
    else if ((hit = words.findIndex(w => DDL.has(w))) >= 0) verdict = 'ddl';
    else { hit = 0; verdict = READ.has(words[0]) ? 'read' : 'unknown'; }
    return { segs, hit, verdict };
  }
  const LABEL = { read: 'Runs now', write: 'Held: needs approval', ddl: 'Never runs: schema', unknown: 'Refused: not a provable read', unparsed: 'Refused before classifying' };
  const TALLY = [['read', 'Run'], ['write', 'Held for approval'], ['ddl', 'Schema, never'], ['unknown', 'Unknown, refused'], ['unparsed', 'Comment or second statement']];
  const excerpt = reply => {
    const o = JSON.parse(reply), keys = ['decision', 'kind'];
    if (o.decision === 'allowed') keys.push(o.row_count === 1 ? 'rows' : 'row_count');
    else keys.push('reason');
    return keys.filter(k => k in o).map(k => `"${k}":${JSON.stringify(o[k])}`).join(',');
  };
  const expect = reply => { const o = JSON.parse(reply); return o.decision === 'allowed' ? 'read' : o.kind || 'unparsed'; };
  const rows = PICK.map(e => {
    const sql = sqlOf(e), s = scan(sql);
    if (expect(e.reply) !== s.verdict) console.warn('sqlguard page: scan disagrees with the server', sql);
    const html = s.segs.map(g => g.q ? `<span class="sg-q">${esc(g.t)}</span>` : g.x ? `<span class="sg-x">${esc(g.t)}</span>`
      : g.w !== undefined ? `<span class="sg-w${g.w === s.hit ? ' sg-hit' : ''}">${esc(g.t)}</span>` : esc(g.t)).join('');
    return `<li class="sg-row" data-v="${s.verdict}"><code class="sg-sql">${html}</code><span class="sg-v">${LABEL[s.verdict]}</span><span class="sg-row-out">${esc(excerpt(e.reply))}</span></li>`;
  });
  list.innerHTML = rows.join('');
  tallyEl.innerHTML = TALLY.map(([v, t]) => `<div data-v="${v}"><dt>${t}</dt><dd>0</dd></div>`).join('');
  const items = $$('.sg-row', list);
  const counts = () => Object.fromEntries(TALLY.map(([v]) => [v, 0]));
  const showTally = c => TALLY.forEach(([v]) => { $(`[data-v="${v}"] dd`, tallyEl).textContent = String(c[v]); });
  const finalCounts = () => { const c = counts(); items.forEach(li => c[li.dataset.v]++); return c; };
  demo(el, {
    reset() {
      items.forEach(li => { li.classList.remove('in', 'is-done'); $$('.sg-w', li).forEach(w => w.classList.remove('is-seen')); });
      list.classList.add('is-reset');
      showTally(counts());
    },
    final() {
      list.classList.remove('is-reset');
      items.forEach(li => { li.classList.add('in', 'is-done'); $$('.sg-w', li).forEach(w => w.classList.add('is-seen')); });
      showTally(finalCounts());
    },
    async play(me) {
      const c = counts();
      await wait(300, me);
      for (const li of items) {
        li.classList.add('in');
        await wait(160, me);
        for (const w of $$('.sg-w', li)) { w.classList.add('is-seen'); await wait(34, me); }
        await wait(200, me);
        li.classList.add('is-done');
        c[li.dataset.v]++;
        showTally(c);
        await wait(420, me);
      }
    }
  });
})();

/* 2. Two layers: the same three writes on the real build and on a build that trusts the first word */
(() => {
  const el = $('#d-read'), sqlEl = $('#sg-l-sql'), nEl = $('#sg-l-n'), log = $('#sg-l-log');
  const lane = n => $(`[data-lane="${n}"]`, el);
  const ST = [1, 2, 3].map(i => ({ sql: sqlOf(CAP.real[i]), real: CAP.real[i].reply, broken: CAP.broken[i].reply }));
  const countOf = e => JSON.parse(e.reply).rows[0][0];
  const before = countOf(CAP.real[0]), after = countOf(CAP.real[4]), bBefore = countOf(CAP.broken[0]), bAfter = countOf(CAP.broken[4]);
  const POS = { start: 0, cls: 1 / 6, ro: 3 / 6, db: 5 / 6 };
  const station = (n, s) => $(`[data-st="${s}"]`, lane(n));
  const say = (n, s, text, state = '') => { const li = station(n, s); li.dataset.state = state; $('.sg-say', li).textContent = text; };
  const puck = n => $('.sg-puck', lane(n));
  const move = (n, at, state = '', instant = false) => {
    const p = puck(n);
    if (instant) p.style.transition = 'none';
    p.style.setProperty('--x', String(POS[at]));
    p.dataset.state = state;
    if (instant) { p.getBoundingClientRect(); p.style.transition = ''; }
  };
  const short = r => { const o = JSON.parse(r); return `{"decision":${JSON.stringify(o.decision)},"kind":${JSON.stringify(o.kind)}, …}`; };
  const line = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; log.appendChild(s); log.scrollTop = log.scrollHeight; };
  const verdict = r => JSON.parse(r).reason.replace(/^query: /, '').replace(/ \(\d+\)$/, '');
  const setStatement = i => { nEl.textContent = `Statement ${i + 1} of 3`; sqlEl.textContent = ST[i].sql; };
  const clearLanes = () => {
    ['real', 'broken'].forEach(n => { say(n, 'cls', 'Waiting'); say(n, 'ro', 'Waiting'); move(n, 'start', '', true); });
    say('real', 'db', `${before} rows`); say('broken', 'db', `${bBefore} rows`);
  };
  const logStatement = i => {
    line('dim', `# statement ${i + 1}`);
    line('err', `real     ${short(ST[i].real)}`);
    line('err', `broken   ${ST[i].broken}`);
  };
  const endState = () => {
    say('real', 'cls', 'Refused all 3 as writes', 'stop'); say('real', 'ro', 'Never reached', 'idle');
    say('broken', 'cls', 'Passed all 3 as reads', 'pass'); say('broken', 'ro', `SQLite refused all 3: ${verdict(ST[0].broken)}`, 'stop');
    say('real', 'db', `${after} rows, unchanged`, 'pass'); say('broken', 'db', `${bAfter} rows, unchanged`, 'pass');
    move('real', 'cls', 'stop', true); move('broken', 'ro', 'stop', true);
  };
  const endLog = () => {
    line('dim', '# then, on both builds');
    line('ok', `query {"sql":"SELECT count(*) FROM orders"}   rows [[${after}]] and [[${bAfter}]], as before`);
  };
  demo(el, {
    reset() { log.replaceChildren(); setStatement(0); clearLanes(); },
    final() { log.replaceChildren(); setStatement(2); ST.forEach((_, i) => logStatement(i)); endLog(); endState(); },
    async play(me) {
      for (let i = 0; i < ST.length; i++) {
        setStatement(i); clearLanes();
        await wait(450, me);
        move('real', 'cls'); move('broken', 'cls');
        await wait(650, me);
        say('real', 'cls', 'Refused: write', 'stop'); move('real', 'cls', 'stop');
        say('broken', 'cls', 'Passed as a read', 'pass');
        await wait(500, me);
        move('broken', 'ro');
        await wait(650, me);
        say('broken', 'ro', verdict(ST[i].broken), 'stop'); move('broken', 'ro', 'stop');
        say('real', 'ro', 'Never reached', 'idle');
        logStatement(i);
        await wait(1200, me);
      }
      endState();
      endLog();
    }
  });
})();

/* 3. The request on the wire, and the file it writes */
(() => {
  const el = $('#d-request'), wire = $('#sg-wire'), file = $('#sg-file');
  const EX = [C[4], C[5], C[6]];
  wire.innerHTML = EX.map(e => `<li class="sg-ex"><p class="sg-call">${esc(callLine(e))}</p><pre class="sg-reply" data-t="${tone(e.reply)}">${esc(e.reply)}</pre></li>`).join('');
  const pending = JSON.parse(C[5].reply);
  const FILE = [
    '{',
    `  "token": "${pending.token}",`,
    `  "statement": ${JSON.stringify(pending.statement)},`,
    '  "fingerprint": "f7f41e152fb18caaf00a66da9be9337fd3a1577b0d7c490aecae8fb0ab623fbb",',
    '  "kind": "write",',
    '  "created_at": "2026-10-04T00:41:55.746462+03:00",',
    '  "expires_at": "2026-10-04T00:46:55.746462+03:00"',
    '}'
  ];
  file.innerHTML = FILE.map(l => `<span>${esc(l)}</span>`).join('') + '<span class="sg-file-gap">no approved_at yet: holding the token grants nothing</span>';
  const exs = $$('.sg-ex', wire), lines = $$('span', file), gapLine = $('.sg-file-gap', file);
  const show = (on) => {
    exs.forEach(x => { x.classList.toggle('in', on); $('.sg-reply', x).classList.toggle('in', on); });
    lines.forEach(l => l.classList.toggle('in', on));
    gapLine.classList.toggle('is-flash', false);
  };
  demo(el, {
    reset() { show(false); },
    final() { show(true); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < exs.length; i++) {
        exs[i].classList.add('in');
        await wait(520, me);
        $('.sg-reply', exs[i]).classList.add('in');
        await wait(700, me);
        if (i === 1) {
          for (const l of lines.slice(0, -1)) { l.classList.add('in'); await wait(150, me); }
          await wait(400, me);
        }
      }
      gapLine.classList.add('in', 'is-flash');
    }
  });
})();

/* 4. The token's life: the agent's calls and the operator's commands, in the order they happened */
(() => {
  const el = $('#d-approve'), card = $('#sg-card'), tl = $('#sg-tl');
  const field = f => $(`[data-f="${f}"]`, card);
  const STEPS = [
    { who: 'agent', e: C[6], fx: 'wait' },
    { who: 'op', e: C[7] },
    { who: 'op', e: C[8], fx: 'approved' },
    { who: 'agent', e: C[9], fx: 'miss' },
    { who: 'agent', e: C[11], fx: 'used' },
    { who: 'agent', e: C[12], fx: 'again' },
    { who: 'op', e: C[13], fx: 'again' }
  ];
  const WHO = { agent: 'Agent, over MCP', op: "Operator's terminal" };
  tl.innerHTML = STEPS.map(({ who, e }) => {
    const body = e.k === 'call'
      ? `<span class="sg-c">${esc(callLine(e))}</span><span class="sg-r" data-t="${tone(e.reply)}">${esc(e.reply)}</span>`
      : `<span class="sg-c sg-cmd">${esc(e.cmd)}</span>${cliLines(e).map(([k, t]) => `<span class="sg-o${k === 'err' ? ' sg-err' : ''}">${esc(t) || ' '}</span>`).join('')}`;
    return `<li class="sg-ev" data-who="${who}"><p class="sg-who">${WHO[who]}</p><pre>${body}</pre></li>`;
  }).join('');
  const evs = $$('.sg-ev', tl);
  const states = $$('.sg-states li', card);
  const setState = s => {
    card.dataset.state = s;
    const k = ['pending', 'approved', 'used'].indexOf(s);
    states.forEach((li, i) => li.classList.toggle('on', i <= k));
  };
  const flash = (node, cls) => { node.classList.remove(cls); node.getBoundingClientRect(); node.classList.add(cls); };
  const APPROVED_AT = '2026-10-04T00:41:55.777836+03:00', REDEEMED_AT = '2026-10-04T00:41:55.780973+03:00';
  const setTimes = (a, r) => {
    $('dd', field('approved')).textContent = a || 'not set';
    $('dd', field('redeemed')).textContent = r || 'not set';
    field('approved').classList.toggle('is-set', !!a);
    field('redeemed').classList.toggle('is-set', !!r);
  };
  const apply = (fx, animate) => {
    if (fx === 'approved') { setState('approved'); setTimes(APPROVED_AT, null); if (animate) flash(field('approved'), 'is-new'); }
    if (fx === 'used') { setState('used'); setTimes(APPROVED_AT, REDEEMED_AT); card.classList.add('has-marker'); if (animate) flash(field('redeemed'), 'is-new'); }
    if (animate && fx === 'wait') flash(field('approved'), 'is-miss');
    if (animate && fx === 'miss') flash(field('fp'), 'is-miss');
    if (animate && fx === 'again') flash($('#sg-marker'), 'is-miss');
  };
  const cleanFlash = () => $$('.is-new, .is-miss', card).forEach(n => n.classList.remove('is-new', 'is-miss'));
  demo(el, {
    reset() {
      evs.forEach(ev => { ev.classList.remove('in'); $$('pre > span', ev).forEach(s => s.classList.remove('in')); });
      tl.classList.add('is-reset');
      setState('pending'); setTimes(null, null); card.classList.remove('has-marker'); cleanFlash();
    },
    final() {
      tl.classList.remove('is-reset');
      evs.forEach(ev => { ev.classList.add('in'); $$('pre > span', ev).forEach(s => s.classList.add('in')); });
      cleanFlash();
      STEPS.forEach(s => apply(s.fx, false));
    },
    async play(me) {
      await wait(400, me);
      for (let i = 0; i < STEPS.length; i++) {
        const ev = evs[i], spans = $$('pre > span', ev);
        ev.classList.add('in');
        await wait(260, me);
        spans[0].classList.add('in');
        await wait(STEPS[i].who === 'op' ? 620 : 480, me);
        for (const s of spans.slice(1)) { s.classList.add('in'); await wait(STEPS[i].who === 'op' ? 90 : 60, me); }
        await wait(220, me);
        apply(STEPS[i].fx, true);
        await wait(1000, me);
      }
    }
  });
})();

/* 5. Exactly as approved: the landing hero's statement, every attempt in the order it was made */
(() => {
  const el = $('#d-redeem'), list = $('#sg-tries'), acct = $('#sg-acct');
  const H = CAP.hero, APPROVED = '529cb8f057e84cdf';
  const TRIES = [
    { e: H[4], html: "UPDATE accounts\nSET plan = 'pro'\nWHERE id = <mark class=\"sg-chg\">43</mark>;", fp: 'b23112977a08e211', note: "The landing hero's change" },
    { e: H[5], html: "UPDATE accounts SET plan = 'pro' WHERE id = 42<del class=\"sg-del\">;</del>", fp: '54460a9d7d75eaaf', note: 'No semicolon' },
    { e: H[6], html: "UPDATE accounts SET plan = 'pro'<del class=\"sg-del\"> WHERE id = 42</del>;", fp: '7a1d333c7aa72823', note: 'No WHERE' },
    { e: H[7], html: "UPDATE accounts SET plan = '<mark class=\"sg-chg\">enterprise</mark>' WHERE id = 42;", fp: '8d98cb891df2a097', note: 'Another value' },
    { e: H[8], html: "<mark class=\"sg-chg\">update</mark> accounts <mark class=\"sg-chg\">set</mark> plan = 'pro' <mark class=\"sg-chg\">where</mark> id = 42;", fp: 'b095d936fbc0bef9', note: 'Lower case' },
    { e: H[9], html: "UPDATE accounts SET plan = 'pro' WHERE id = 42;", fp: APPROVED, note: 'Reformatted onto one line' },
    { e: H[10], html: "UPDATE accounts\nSET plan = 'pro'\nWHERE id = 42;", fp: APPROVED, note: 'The original text, again' }
  ];
  const textOf = html => { const d = document.createElement('div'); d.innerHTML = html; $$('del', d).forEach(x => x.remove()); return d.textContent; };
  TRIES.forEach(t => { if (textOf(t.html) !== sqlOf(t.e)) console.warn('sqlguard page: attempt text differs from capture', sqlOf(t.e)); });
  const result = reply => {
    const o = JSON.parse(reply);
    if (o.decision === 'executed') return reply;
    return `"decision":"${o.decision}"  ${o.reason.split(': approved')[0]}`;
  };
  list.innerHTML = TRIES.map((t, i) => `<li class="sg-try" data-t="${tone(t.e.reply)}" data-m="${t.fp === APPROVED ? 1 : 0}">
      <span class="sg-try-n">${i + 1}</span>
      <div class="sg-try-main"><p class="sg-try-note">${esc(t.note)}</p><pre>${t.html}</pre></div>
      <p class="sg-try-fp"><b class="sg-eq">${t.fp === APPROVED ? '=' : '≠'}</b><code class="sg-hex" data-fp="${t.fp}">${t.fp}</code></p>
      <p class="sg-try-out">${esc(result(t.e.reply))}</p>
    </li>`).join('');
  const items = $$('.sg-try', list);
  const BEFORE = JSON.stringify(JSON.parse(H[0].reply).rows), AFTER = JSON.stringify(JSON.parse(H[11].reply).rows);
  const HEX = '0123456789abcdef';
  const setAcct = (v, animate) => { acct.textContent = v; if (animate) { acct.classList.remove('is-new'); acct.getBoundingClientRect(); acct.classList.add('is-new'); } };
  demo(el, {
    reset() { items.forEach(li => li.classList.remove('in', 'is-fp', 'is-done')); setAcct(BEFORE, false); el.classList.remove('is-used'); },
    final() { items.forEach(li => li.classList.add('in', 'is-fp', 'is-done')); $$('.sg-hex[data-fp]', list).forEach(h => { h.textContent = h.dataset.fp; }); setAcct(AFTER, false); el.classList.add('is-used'); },
    async play(me) {
      await wait(350, me);
      for (const li of items) {
        const hex = $('.sg-hex', li), fp = hex.dataset.fp;
        li.classList.add('in');
        await wait(380, me);
        for (let k = 0; k < 6; k++) {
          hex.textContent = Array.from({ length: 16 }, () => HEX[Math.floor(Math.random() * 16)]).join('');
          await wait(55, me);
        }
        hex.textContent = fp;
        li.classList.add('is-fp');
        await wait(380, me);
        li.classList.add('is-done');
        if (decisionOf(TRIES[items.indexOf(li)].e.reply) === 'executed') { setAcct(AFTER, true); el.classList.add('is-used'); }
        await wait(650, me);
      }
    }
  });
})();

/* 6. CI on a real cluster: step results and durations from GitHub's API; probe lines captured locally */
(() => {
  const el = $('#d-deploy'), list = $('#sg-steps'), probe = $('#sg-probe');
  const STEPS = [
    ['Build the image', 33], ['Image runs and is non-root', 0], ['Run azure/setup-helm@v4', 1], ['Lint and render the chart', 0],
    ['Run helm/kind-action@v1', 40], ['Load the image into the cluster', 3], ['The reference manifests are still valid', 0],
    ['Install the chart', 8], ['Verify the running deployment', 1], ['The approval boundary needs cluster access, not a tool call', 0]
  ];
  const MAX = 40;
  list.innerHTML = STEPS.map(([name, s]) => `<li class="sg-step"><span class="sg-tick" aria-hidden="true"></span><span class="sg-step-name">${esc(name)}</span><span class="sg-step-bar"><i style="--w:${(s / MAX) * 100}%"></i></span><span class="sg-step-s">${s} s</span></li>`).join('');
  const PROBE = [
    ['dim', '# the calls deploy/verify.sh makes, captured locally'],
    ['cmd', 'curl -s -i http://127.0.0.1:18099/healthz'], ['', 'HTTP/1.1 200 OK'], ['', 'ok'],
    ['cmd', 'curl -s -i http://127.0.0.1:18099/readyz'], ['', 'HTTP/1.1 200 OK'], ['', 'ready'],
    ['', 'POST /mcp  query {"sql":"SELECT count(*) FROM orders"}'], ['ok', '"decision":"allowed"'],
    ['', 'POST /mcp  query {"sql":"DELETE FROM orders"}'], ['err', '"decision":"refused"']
  ];
  probe.innerHTML = PROBE.map(([k, t]) => `<span class="${k}">${esc(t)}</span>`).join('');
  const steps = $$('.sg-step', list), lines = $$('span', probe);
  demo(el, {
    reset() { steps.forEach(s => s.classList.remove('is-run', 'is-ok')); lines.forEach(l => l.classList.add('is-off')); },
    final() { steps.forEach(s => { s.classList.remove('is-run'); s.classList.add('is-ok'); }); lines.forEach(l => l.classList.remove('is-off')); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < steps.length; i++) {
        steps[i].classList.add('is-run');
        await wait(Math.max(260, STEPS[i][1] * 55), me);
        steps[i].classList.remove('is-run');
        steps[i].classList.add('is-ok');
        if (i === 8) for (const l of lines) { l.classList.remove('is-off'); await wait(110, me); }
      }
    }
  });
})();

/* The audit log of the hero session, verbatim lines */
(() => {
  const list = $('#sg-log');
  if (!list) return;
  const rows = AUDIT.map(raw => JSON.parse(raw));
  const time = at => at.slice(11, at.indexOf('+'));
  const detail = r => [r.reason, r.rows !== undefined ? `rows ${r.rows}` : '', r.elapsed ? `elapsed ${r.elapsed}` : '', r.token ? `token ${r.token}` : ''].filter(Boolean).join(', ');
  const html = rows.map((r, i) => `<li class="sg-lg" data-d="${r.decision}" style="--i:${i}"><span class="sg-lg-t">${time(r.at)}</span><span class="sg-lg-tool">${r.tool}</span><span class="sg-lg-d">${r.decision}</span><span class="sg-lg-s">${r.statement ? esc(r.statement) : ''}</span><span class="sg-lg-x">${esc(detail(r))}</span></li>`);
  const gapAt = rows.findIndex(r => r.reason === 'request has not been approved') + 1;
  html.splice(gapAt, 0, `<li class="sg-lg sg-lg-gap" style="--i:${gapAt}"><span class="sg-lg-t">00:41:55.777836</span><span class="sg-lg-gapt">Not in this log: the operator ran <code>sqlguard pending</code> and <code>sqlguard approve 2798b3790c80</code>. The approval is written to the token's file as <code>approved_at</code>, at this time.</span></li>`);
  list.innerHTML = html.join('');
})();
