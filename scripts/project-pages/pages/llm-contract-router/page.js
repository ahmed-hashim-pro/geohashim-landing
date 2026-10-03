/* Captured strings shared by several demos. Model ids are the example's; the problems are its hand-written contract's. */
const LC_PRIMARY = 'claude-opus-5', LC_BACKUP = 'claude-haiku-4-5-20251001';
const LC_ENUM = 'sentiment: must be positive, negative or neutral';
const LC_SCORE = 'score: must be a number between 0 and 1';
const LC_BAD = (model, tier, repair) => `${model} (${tier}) repair=${repair}: contract — ${LC_ENUM}; ${LC_SCORE}`;
const LC_SHOW = (el, on = true) => el.classList.toggle('is-off', !on);

/* Hero terminal: npm run example verbatim; the other two are my runs (mock providers, no key set) */
PAGE.terminal = {
  scenes: {
    example: [
      ['cmd', 'npm run example'],
      ['dim', ''],
      ['dim', '> llm-contract-router@0.1.0 example'],
      ['dim', '> npm run build && node --experimental-strip-types examples/degrade.ts'],
      ['dim', ''], ['dim', ''],
      ['dim', '> llm-contract-router@0.1.0 build'],
      ['dim', '> tsc -p tsconfig.build.json'],
      ['out', ''],
      ['out', "answer   : { sentiment: 'positive', score: 0.91 }"],
      ['out', `served by: ${LC_BACKUP} (compact)`],
      ['out', 'degraded : true'],
      ['out', 'repairs  : 1'],
      ['out', 'cost     : $0.000700'],
      ['out', ''],
      ['out', 'attempts:'],
      ['err', `  ${LC_PRIMARY} (frontier) repair=0: rate_limit`],
      ['err', `  ${LC_BAD(LC_BACKUP, 'compact', 0)}`],
      ['ok', `  ${LC_BACKUP} (compact) repair=1: accepted`]
    ],
    refused: [
      ['cmd', 'node scenarios.mjs exhausted'],
      ['out', 'ok       : false'],
      ['err', 'error    : chain_exhausted: every model in the chain failed (2 tried)'],
      ['out', 'degraded : false'],
      ['out', 'repairs  : 2'],
      ['out', 'cost     : $0.011200'],
      ['out', ''],
      ['out', 'attempts:'],
      ['err', `  ${LC_BAD(LC_PRIMARY, 'frontier', 0)}`],
      ['err', `  ${LC_BAD(LC_PRIMARY, 'frontier', 1)}`],
      ['err', `  ${LC_BACKUP} (compact) repair=0: contract — the response did not contain a parseable JSON value`],
      ['err', `  ${LC_BACKUP} (compact) repair=1: contract — ${LC_SCORE}`],
      ['out', ''],
      ['out', 'calls: primary 2 backup 2']
    ],
    nokey: [
      ['cmd', `node --input-type=module -e 'import { createAnthropicProvider } from "./dist/providers/anthropic.js"; createAnthropicProvider()'`],
      ['cut', '[source excerpt trimmed]'],
      ['err', 'Error: anthropic: no API key. Pass { apiKey } or set ANTHROPIC_API_KEY. The router never reads keys from anywhere else.'],
      ['cut', '[stack trace trimmed]'],
      ['out', ''],
      ['cmd', `node --input-type=module -e 'await import("llm-contract-router/anthropic")'`],
      ['cut', '[source excerpt trimmed]'],
      ['err', "Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@anthropic-ai/sdk' imported from …/node_modules/llm-contract-router/dist/providers/anthropic.js"],
      ['cut', '[stack trace trimmed]']
    ]
  },
  order: ['example', 'refused', 'nokey'],
  first: 'example'
};

/* Passing tests per file, from vitest's JSON reporter */
PAGE.tests = [['tests/providers.test.ts', 26, 'var(--blue)'], ['tests/calibration.test.ts', 23, 'var(--magenta)'], ['tests/router.test.ts', 23, 'var(--water)'], ['tests/extract.test.ts', 17, 'var(--green)'], ['tests/contract.test.ts', 12, 'var(--ink-2)'], ['tests/zod.test.ts', 4, 'var(--yellow)']];

/* 1. Tier: buildSystemPrompt's output size per tier for the example's contract */
(() => {
  const el = $('#d-tier'), bars = $('#tier-bars'), blocks = $$('.lc-blk', el), nameEl = $('#tier-name'), tempEl = $('#tier-temp');
  const MAX = 814;
  const TIERS = [
    ['frontier', 'Frontier', 395, '0.2', ['task', 'schema']],
    ['balanced', 'Balanced', 699, '0.1', ['task', 'schema', 'rules']],
    ['compact', 'Compact', 814, '0', ['task', 'schema', 'rules', 'example']]
  ];
  const PARTS = [['schema', 395, 'var(--ink)'], ['rules', 304, 'var(--blue)'], ['example', 115, 'var(--magenta)']];
  bars.innerHTML = TIERS.map(([k, label, n, t, has]) =>
    `<div class="lc-trow" data-tier="${k}"><span class="lc-tname">${label}</span><span class="lc-tbar">` +
    PARTS.filter(([p]) => has.includes(p)).map(([, w, c]) => `<i style="--c:${c};--w:${(w / MAX * 100).toFixed(2)}%"></i>`).join('') +
    `</span><span class="lc-tval">${n} characters, temperature ${t}</span></div>`).join('');
  const rows = $$('.lc-trow', bars);
  const btns = $$('.seg button', el);
  let userPicked = false;
  const view = k => {
    const T = TIERS.find(t => t[0] === k);
    nameEl.textContent = k;
    tempEl.textContent = T[3];
    blocks.forEach(b => LC_SHOW(b, T[4].includes(b.dataset.b)));
    rows.forEach(r => r.classList.toggle('is-cur', r.dataset.tier === k));
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tier === k)));
  };
  const fill = (k, on) => LC_SHOW(rows.find(r => r.dataset.tier === k), on);
  demo(el, {
    reset() {
      userPicked = false;
      TIERS.forEach(([k]) => fill(k, false));
      view('frontier');
      blocks.forEach(b => LC_SHOW(b, false));
      tempEl.textContent = '…';
      nameEl.textContent = '…';
    },
    final() { TIERS.forEach(([k]) => fill(k, true)); view('compact'); },
    async play(me) {
      await wait(400, me);
      for (const [k] of TIERS) {
        if (userPicked) return;
        view(k);
        fill(k, true);
        await wait(k === 'compact' ? 1200 : 1700, me);
      }
    }
  });
  btns.forEach(b => b.addEventListener('click', () => {
    userPicked = true;
    TIERS.forEach(([k]) => fill(k, true));
    view(b.dataset.tier);
  }));
})();

/* 2. Call: classifyStatus's mapping, then the timeout run (my script, mock providers) */
(() => {
  const el = $('#d-call'), lanes = $('#call-lanes'), term = $('#call-term');
  const LANES = [
    ['rate_limit', ['429'], 'Retry later; the model itself is fine.'],
    ['unavailable', ['500', '503'], 'Provider fault: 5xx, connection reset.'],
    ['timeout', ['408', 'no reply in time'], 'The request exceeded its deadline.'],
    ['auth', ['401', '403'], 'Bad key, no credit, permission denied.'],
    ['invalid_request', ['400', '404', '422'], 'The request was malformed or too large for this model.'],
    ['unknown', ['unrecognised error'], 'Anything an adapter could not classify.']
  ];
  lanes.innerHTML = LANES.map(([k, chips, d]) =>
    `<li class="lc-lane"><span class="lc-kind"><code>${k}</code><small>${esc(d)}</small></span>` +
    `<span class="lc-chips">${chips.map(c => `<i class="lc-chip">${esc(c)}</i>`).join('')}</span>` +
    `<span class="lc-next">Next model</span></li>`).join('');
  const laneEls = $$('.lc-lane', lanes);
  const chip = (l, c) => $$('.lc-chip', laneEls[l])[c];
  const ORDER = [[0, 0], [1, 1], [3, 0], [4, 0], [2, 1], [1, 0], [3, 1], [4, 1], [2, 0], [4, 2], [5, 0]];
  const TL = [
    ['cmd', 'node scenarios.mjs timeout'],
    ['', "answer   : { sentiment: 'positive', score: 0.91 }"],
    ['', `served by: ${LC_BACKUP} (compact)`],
    ['', 'degraded : true'],
    ['', 'repairs  : 0'],
    ['', 'cost     : $0.000350'],
    ['', ''],
    ['', 'attempts:'],
    ['lc-bad', `  ${LC_PRIMARY} (frontier) repair=0: timeout (no response within 20ms)`],
    ['lc-good', `  ${LC_BACKUP} (compact) repair=0: accepted`]
  ];
  term.innerHTML = TL.map(([c, t]) => `<span class="${c}">${esc(t) || ' '}</span>`).join('');
  const lines = $$('span', term);
  const all = on => {
    ORDER.forEach(([l, c]) => chip(l, c).classList.toggle('in', on));
    laneEls.forEach(x => x.classList.toggle('is-hit', on));
    lines.forEach(x => x.classList.toggle('is-off', !on));
  };
  demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      await wait(300, me);
      for (const [l, c] of ORDER) {
        chip(l, c).classList.add('in');
        laneEls[l].classList.add('is-hit');
        await wait(210, me);
      }
      await wait(400, me);
      for (const [i, x] of lines.entries()) {
        x.classList.remove('is-off');
        await wait(i === 0 ? 520 : 150, me);
      }
    }
  });
})();

/* 3. Parse: extractJson on seven made-up replies; states and verdicts are its real output */
(() => {
  const el = $('#d-parse'), list = $('#parse-rows');
  const NAMES = ['whole', 'fence', '{…}', '[…]'];
  const ROWS = [
    ['{"sentiment":"positive","score":0.91}', ['ok', '', '', ''], true, '{"sentiment":"positive","score":0.91}', ''],
    ['Sure! ```json\n{"sentiment":"elated","score":7}\n```', ['no', 'ok', '', ''], true, '{"sentiment":"elated","score":7}', 'The wrong values are the contract\'s job, in stage 4.'],
    ['Here you go:\n{"sentiment":"positive","score":0.91}\nHope that helps!', ['no', 'none', 'ok', ''], true, '{"sentiment":"positive","score":0.91}', ''],
    ['Here: {"note":"}"} done', ['no', 'none', 'ok', ''], true, '{"note":"}"}', ''],
    ["I'd say it's very positive!", ['no', 'none', 'none', 'none'], false, 'the response did not contain a parseable JSON value', ''],
    ['', ['', '', '', ''], false, 'the model returned an empty response', 'Caught before any reading is tried.'],
    ['{"sentiment":', ['no', 'none', 'none', 'none'], false, 'the response did not contain a parseable JSON value', 'The brace never closes, so there is no balanced span to try.']
  ];
  const show = t => t === '' ? '<em class="lc-empty">empty reply</em>' : esc(t).replace(/\n/g, '<span class="lc-nl" aria-label="line break">↵</span>');
  list.innerHTML = ROWS.map(([t, st, ok, v, note]) =>
    `<li class="lc-prow"><code class="lc-ptext">${show(t)}</code>` +
    `<span class="lc-pills">${NAMES.map((n, i) => `<i class="lc-p" data-s="${st[i]}">${n}</i>`).join('')}</span>` +
    `<span class="lc-pv ${ok ? 'is-ok' : 'is-no'}"><b>${ok ? 'Parsed' : 'Problem'}</b> <code>${esc(v)}</code>${note ? ` <small>${esc(note)}</small>` : ''}</span></li>`).join('');
  const rows = $$('.lc-prow', list);
  const settle = (row, on) => {
    row.classList.toggle('in', on);
    $$('.lc-p', row).forEach(p => p.classList.toggle('is-' + (p.dataset.s || 'skip'), on));
    $('.lc-pv', row).classList.toggle('in', on);
  };
  demo(el, {
    reset() { rows.forEach(r => settle(r, false)); },
    final() { rows.forEach(r => settle(r, true)); },
    async play(me) {
      await wait(300, me);
      for (const row of rows) {
        row.classList.add('in');
        await wait(110, me);
        for (const p of $$('.lc-p', row)) {
          if (!p.dataset.s) continue;
          p.classList.add('is-' + p.dataset.s);
          await wait(130, me);
        }
        $('.lc-pv', row).classList.add('in');
        await wait(300, me);
      }
      rows.forEach(r => settle(r, true));
    }
  });
})();

/* 4. The contract: three made-up replies through the example's hand-written contract and zod 4 (real messages) */
(() => {
  const el = $('#d-contract'), gate = $('#gate'), replyEl = $('#gate-reply'), probs = $('#gate-probs'), probList = $('ul', probs);
  const recv = $('#gate-recv'), light = $('#gate-light'), exits = $$('#gate-exits li');
  const RULE = { sentiment: 'one of positive, negative, neutral', score: 'a number from 0 to 1' };
  const REPLIES = {
    wrong: { fields: [['sentiment', '"elated"'], ['score', '7']], probs: { hand: [LC_ENUM, LC_SCORE], zod: ['sentiment: Invalid option: expected one of "positive"|"negative"|"neutral"', 'score: Too big: expected number to be <=1'] } },
    missing: { fields: [['sentiment', '"positive"'], ['score', null]], probs: { hand: [LC_SCORE], zod: ['score: Invalid input: expected number, received undefined'] } },
    valid: { fields: [['sentiment', '"positive"'], ['score', '0.91']], probs: { hand: [], zod: [] } }
  };
  let reply = 'wrong', rules = 'hand', userPicked = false;
  const sync = () => {
    $$('[data-reply]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.reply === reply)));
    $$('[data-rules]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rules === rules)));
  };
  const problems = () => REPLIES[reply].probs[rules];
  const rowsOf = () => $$('.lc-field', replyEl);
  function render() {
    const F = REPLIES[reply].fields;
    replyEl.innerHTML = '<span class="lc-brace">{</span>' + F.map(([f, v], i) => {
      const comma = i < F.length - 1 && F[i + 1][1] !== null ? ',' : '';
      const kv = v === null ? `<span class="lc-gone">no "${f}" field</span>` : `"${f}": ${esc(v)}${comma}`;
      return `<div class="lc-field" data-f="${f}"><code class="lc-kv">${kv}</code><span class="lc-rule">Schema: ${RULE[f]}; required</span><span class="lc-mark" aria-hidden="true"></span></div>`;
    }).join('') + '<span class="lc-brace">}</span>';
    probList.replaceChildren();
    probs.classList.remove('is-clear');
    replyEl.classList.remove('is-bounce');
    gate.classList.remove('is-pass', 'is-fail');
    light.textContent = 'contract.validate()';
    recv.innerHTML = '<p class="lc-wait">Waiting for the check.</p>';
    exits.forEach(x => x.classList.remove('is-on'));
  }
  const addProblem = p => { const li = document.createElement('li'); li.textContent = `- ${p}`; probList.appendChild(li); };
  const judge = row => {
    const bad = problems().filter(p => p.startsWith(row.dataset.f + ':'));
    row.classList.add(bad.length ? 'is-fail' : 'is-pass');
    $('.lc-mark', row).textContent = bad.length ? '✗' : '✓';
    return bad;
  };
  function outcome(animate) {
    const ok = problems().length === 0;
    gate.classList.add(ok ? 'is-pass' : 'is-fail');
    light.textContent = ok ? 'passed' : 'rejected';
    exits.forEach(x => x.classList.toggle('is-on', x.dataset.x === (ok ? 'pass' : 'repair')));
    if (ok) {
      probs.classList.add('is-clear');
      recv.innerHTML = `<div class="lc-data"><code>result.ok</code><b>true</b></div><div class="lc-data"><code>result.data</code><b>{ sentiment: 'positive', score: 0.91 }</b></div><p class="lc-typed">Typed as <code>Sentiment</code> and validated.</p>`;
    } else {
      recv.innerHTML = '<p class="lc-wait is-held">Nothing crossed. Your code is still waiting while the router repairs or moves on.</p>';
      if (animate) replyEl.classList.add('is-bounce');
    }
    if (animate) recv.firstElementChild.classList.add('lc-drop');
  }
  async function runOne(me) {
    sync();
    render();
    const rows = rowsOf();
    rows.forEach(r => r.classList.add('is-wait'));
    await wait(350, me);
    for (const r of rows) { r.classList.remove('is-wait'); await wait(160, me); }
    light.textContent = 'checking';
    for (const r of rows) {
      r.classList.add('is-check');
      await wait(450, me);
      r.classList.remove('is-check');
      for (const p of judge(r)) { addProblem(p); await wait(280, me); }
      await wait(150, me);
    }
    await wait(250, me);
    outcome(true);
  }
  const d = demo(el, {
    reset() { sync(); render(); rowsOf().forEach(r => r.classList.add('is-wait')); },
    final() { sync(); render(); rowsOf().forEach(r => judge(r)); problems().forEach(addProblem); outcome(false); },
    async play(me) {
      if (userPicked) { await runOne(me); return; }
      reply = 'wrong';
      await runOne(me);
      await wait(2600, me);
      if (userPicked) return;
      reply = 'valid';
      await runOne(me);
    }
  });
  $$('[data-reply]', el).forEach(b => b.addEventListener('click', () => { userPicked = true; reply = b.dataset.reply; d.start(); }));
  $$('[data-rules]', el).forEach(b => b.addEventListener('click', () => { userPicked = true; rules = b.dataset.rules; d.start(); }));
  d.prepare = () => { userPicked = false; reply = 'wrong'; rules = 'hand'; };
})();

/* 5. Repair: the prompts the mock providers recorded, in the example run and in a run where the repair fails */
(() => {
  const el = $('#d-repair'), ledger = $('#rp-ledger'), promptEl = $('#rp-prompt'), note = $('#rp-note');
  const ASK = "Classify the sentiment of: 'the food was genuinely wonderful'";
  const RUNS = {
    works: {
      before: [['prov', `${LC_PRIMARY} (frontier) repair=0: rate_limit`], ['bad', LC_BAD(LC_BACKUP, 'compact', 0)]],
      produced: 'Sure! ```json\n{"sentiment":"elated","score":7}\n```',
      after: [['good', `${LC_BACKUP} (compact) repair=1: accepted`]],
      note: 'The backup\'s answer to this prompt, {"sentiment":"positive","score":0.91}, passed the contract and crossed the line.'
    },
    fails: {
      before: [['bad', LC_BAD(LC_PRIMARY, 'frontier', 0)]],
      produced: '{"sentiment":"elated","score":7}',
      after: [['bad', LC_BAD(LC_PRIMARY, 'frontier', 1)], ['good', `${LC_BACKUP} (compact) repair=0: accepted`]],
      note: 'The primary repeated its mistake, so the router stopped spending on it. The backup was sent the original ask alone, with no trace of the failed repair, and its first answer passed.'
    }
  };
  let run = 'works';
  const segs = r => [
    ['The original ask', [ASK], 'ask'],
    ['', ['', 'Your previous answer did not satisfy the schema.', '', 'You produced:'], 'fix'],
    ['Its own reply, verbatim', r.produced.split('\n'), 'prod'],
    ['', ['', 'These constraints were not met:'], 'fix'],
    ['One line per broken rule', [`- ${LC_ENUM}`, `- ${LC_SCORE}`], 'prob'],
    ['', ['', 'Return corrected JSON only.'], 'fix']
  ];
  const line = ([kind, text]) => `<li class="lc-l-${kind}">${esc(text)}</li>`;
  function render() {
    const R = RUNS[run];
    ledger.innerHTML = [...R.before, ...R.after].map(line).join('');
    promptEl.innerHTML = segs(R).map(([tag, lines, cls]) =>
      `<div class="lc-rseg lc-r-${cls}"><span class="lc-rtag">${tag}</span><pre>${esc(lines.join('\n'))}</pre></div>`).join('');
    note.textContent = R.note;
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.run === run)));
  }
  const parts = () => ({ lines: $$('li', ledger), segs: $$('.lc-rseg', promptEl) });
  const hideAll = () => { const p = parts(); [...p.lines, ...p.segs, note].forEach(x => LC_SHOW(x, false)); };
  const d = demo(el, {
    reset() { render(); hideAll(); },
    final() { render(); },
    async play(me) {
      const { lines, segs: S } = parts();
      const nBefore = RUNS[run].before.length;
      await wait(300, me);
      for (const l of lines.slice(0, nBefore)) { LC_SHOW(l); await wait(700, me); }
      for (const s of S) { LC_SHOW(s); await wait(s.classList.contains('lc-r-prob') ? 700 : 380, me); }
      await wait(400, me);
      for (const l of lines.slice(nBefore)) { LC_SHOW(l); await wait(700, me); }
      LC_SHOW(note);
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { run = b.dataset.run; d.start(); }));
  d.prepare = () => { run = 'works'; };
})();

/* 6. Result: four real runs (mock providers; costs from 100 in / 50 out tokens at the example's prices) */
(() => {
  const el = $('#d-result'), atts = $('#res-atts'), cbar = $('#res-cbar'), total = $('#res-total'), fields = $('#res-fields');
  const MAXC = 0.0112;
  const P = [LC_PRIMARY, 'frontier'], B = [LC_BACKUP, 'compact'];
  const A = ([m, t], r, out, cost) => ({ m, t, r, out, cost });
  const DATA = "{ sentiment: 'positive', score: 0.91 }";
  const RUNS = {
    pass: { atts: [A(P, 0, 'accepted', 0.00525)], ok: true, served: `${LC_PRIMARY} (frontier)`, degraded: 'false', repairs: '0', cost: 0.00525 },
    example: { atts: [A(P, 0, 'rate_limit', 0), A(B, 0, 'contract', 0.00035), A(B, 1, 'accepted', 0.00035)], ok: true, served: `${LC_BACKUP} (compact)`, degraded: 'true', repairs: '1', cost: 0.0007 },
    fallover: { atts: [A(P, 0, 'contract', 0.00525), A(P, 1, 'contract', 0.00525), A(B, 0, 'accepted', 0.00035)], ok: true, served: `${LC_BACKUP} (compact)`, degraded: 'true', repairs: '1', cost: 0.01085 },
    exhausted: { atts: [A(P, 0, 'contract', 0.00525), A(P, 1, 'contract', 0.00525), A(B, 0, 'contract', 0.00035), A(B, 1, 'contract', 0.00035)], ok: false, degraded: 'false', repairs: '2', cost: 0.0112 }
  };
  let run = 'example';
  const usd = v => '$' + v.toFixed(6);
  const kindOf = out => out === 'accepted' ? 'ok' : out === 'contract' ? 'bad' : 'prov';
  function render() {
    const R = RUNS[run];
    atts.innerHTML = R.atts.map(a =>
      `<li class="lc-att lc-a-${kindOf(a.out)}"><span class="lc-am"><b>${a.m}</b> ${a.t}, repair ${a.r}</span><span class="lc-ao">${a.out}</span><span class="lc-ac">${usd(a.cost)}</span></li>`).join('');
    $$('.lc-cseg', cbar).forEach(s => s.remove());
    cbar.insertAdjacentHTML('afterbegin', R.atts.map(a =>
      `<span class="lc-cseg lc-a-${kindOf(a.out)}" style="--w:${(a.cost / MAXC * 100).toFixed(3)}%"></span>`).join(''));
    const F = R.ok
      ? [['ok', 'true'], ['data', DATA], ['meta.servedBy', R.served]]
      : [['ok', 'false'], ['error', 'chain_exhausted: every model in the chain failed (2 tried)'], ['meta.servedBy', 'not set: nothing was served']];
    F.push(['meta.degraded', R.degraded], ['meta.repairs', R.repairs], ['meta.costUsd', usd(R.cost)]);
    fields.innerHTML = F.map(([k, v]) => `<div class="${k === 'ok' ? (R.ok ? 'is-ok' : 'is-no') : ''}"><dt><code>${k}</code></dt><dd>${esc(v)}</dd></div>`).join('');
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.run === run)));
  }
  const parts = () => ({ cards: $$('.lc-att', atts), segs: $$('.lc-cseg', cbar), rows: $$('div', fields) });
  const d = demo(el, {
    reset() {
      render();
      const p = parts();
      [...p.cards, ...p.segs, ...p.rows].forEach(x => LC_SHOW(x, false));
      total.textContent = usd(0);
    },
    final() { render(); total.textContent = usd(RUNS[run].cost); },
    async play(me) {
      const R = RUNS[run], p = parts();
      await wait(300, me);
      let sum = 0;
      for (let i = 0; i < R.atts.length; i++) {
        LC_SHOW(p.cards[i]);
        LC_SHOW(p.segs[i]);
        sum += R.atts[i].cost;
        total.textContent = usd(sum);
        await wait(650, me);
      }
      total.textContent = usd(R.cost);
      await wait(300, me);
      for (const r of p.rows) { LC_SHOW(r); await wait(150, me); }
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { run = b.dataset.run; d.start(); }));
  d.prepare = () => { run = 'example'; };
})();

/* The README's run, traced: each output line points at the script line that caused it */
(() => {
  const out = $('#trace-out'), note = $('#trace-note'), pre = $('#trace-src');
  const SRC = [
    ['', 'const router = createRouter({'],
    ['', '  providers: {'],
    ['p', '    primary: createMockProvider("primary", [{ fail: "rate_limit", message: "429 from the primary" }]),'],
    ['', '    backup: createMockProvider("backup", ['],
    ['b1', '      { text: \'Sure! ```json\\n{"sentiment":"elated","score":7}\\n```\' }, // wrong enum, out of range'],
    ['b2', '      { text: \'{"sentiment":"positive","score":0.91}\' },                // after being told why'],
    ['', '    ]),'],
    ['', '  },'],
    ['', '  chain: ['],
    ['c1', '    withPricing({ ...models.anthropic.opus5, provider: "primary" }, { inputPerMTok: 15, outputPerMTok: 75 }),'],
    ['c2', '    withPricing({ ...models.anthropic.haiku45, provider: "backup" }, { inputPerMTok: 1, outputPerMTok: 5 }),'],
    ['', '  ],'],
    ['', '});']
  ];
  pre.innerHTML = SRC.map(([k, t]) => `<span${k ? ` data-k="${k}"` : ''}>${esc(t)}</span>`).join('');
  const src = $$('span[data-k]', pre);
  const LINES = [
    ["answer   : { sentiment: 'positive', score: 0.91 }", 'b2', "The backup's second reply, accepted after the repair and handed to your code as typed data."],
    [`served by: ${LC_BACKUP} (compact)`, 'c2', 'The second model in the chain. As a compact model it got the output rules and the worked example, at temperature 0.'],
    ['degraded : true', 'c1 c2', 'A model other than the primary served the answer.'],
    ['repairs  : 1', 'b1', 'One repair call, after this reply failed the contract.'],
    ['cost     : $0.000700', 'c2', "Two backup calls at the mock's 100 input and 50 output tokens each, priced at $1 and $5 per million. The rate-limited call cost nothing."],
    ['', '', ''],
    ['attempts:', '', ''],
    [`  ${LC_PRIMARY} (frontier) repair=0: rate_limit`, 'p', 'A provider error, so the router moved straight to the next model without a repair.'],
    [`  ${LC_BAD(LC_BACKUP, 'compact', 0)}`, 'b1', 'Read out of the markdown fence, then rejected by the contract, which named both rules.'],
    [`  ${LC_BACKUP} (compact) repair=1: accepted`, 'b2', 'The answer to the repair prompt passed the contract and crossed the line.']
  ];
  const IDLE = note.textContent;
  out.innerHTML = LINES.map(([t, k], i) => k
    ? `<li class="lc-oline" tabindex="0" data-i="${i}">${esc(t)}</li>`
    : `<li class="lc-oline is-plain">${esc(t) || ' '}</li>`).join('');
  const items = $$('.lc-oline[data-i]', out);
  const on = (li, v) => {
    const [, k, n] = LINES[+li.dataset.i];
    li.classList.toggle('is-on', v);
    src.forEach(s => s.classList.toggle('is-on', v && k.split(' ').includes(s.dataset.k)));
    note.textContent = v ? n : IDLE;
  };
  items.forEach(li => {
    li.addEventListener('pointerenter', () => on(li, true));
    li.addEventListener('pointerleave', () => on(li, false));
    li.addEventListener('focus', () => on(li, true));
    li.addEventListener('blur', () => on(li, false));
  });
  if (reduce.matches) return;
  const io = new IntersectionObserver(async es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    for (const li of items) {
      on(li, true);
      await new Promise(r => setTimeout(r, 1300));
      on(li, false);
      await new Promise(r => setTimeout(r, 120));
    }
  }, ARRIVE);
  io.observe(out);
})();
