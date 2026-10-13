/* Real runs of schema-drift 0.1.0 at 8fc0eab (see the figcaptions) */
const CAP = /*@@DATA:captures@@*/;

const sdLine = ([k, t]) => { const s = document.createElement('span'); if (k && k !== 'out') s.className = k; s.textContent = t || ' '; return s; };
const sdCmd = t => sdLine(['cmd', t]);
const sdExit = c => sdLine([c ? 'err' : 'ok', `exit ${c}`]);
const sdEg = lines => JSON.parse(lines.find(([, t]) => t.trim().startsWith('e.g.'))[1].trim().slice(5));
const sdShow = (els, on) => els.forEach(e => e.classList.toggle('is-off', !on));

/* Hero terminal: verbatim, with the exit code the shell reported */
(() => {
  const scene = (run, keep) => [['cmd', run.cmd], ...(keep ? keep(run.lines) : run.lines), ['out', ''], ['out', `exit ${run.exit}`]];
  const gate = CAP.gate.bad;
  PAGE.terminal = {
    scenes: {
      check: scene(CAP.pairs.orders23),
      gate: scene(gate, ls => {
        const at = t => ls.findIndex(([, x]) => x.startsWith(t));
        const v3 = at('orders v3'), pay = at('payments v2');
        return [...ls.slice(0, v3 + 1), ['cut', '[5 BREAKING reasons against v2 and v1, each with an e.g. event]'], ['out', ''], ...ls.slice(pay)];
      }),
      verify: scene(CAP.verify)
    },
    order: ['check', 'gate', 'verify'],
    first: 'check'
  };
})();

/* Tests per file, from go test -v ./... (29 in total) */
PAGE.tests = [
  ['gate/gate_test.go', 10, 'var(--blue)'],
  ['schema/schema_test.go', 8, 'var(--magenta)'],
  ['cmd/schema-drift/main_test.go', 6, 'var(--water)'],
  ['compat/property_test.go', 3, 'var(--green)'],
  ['infer/infer_test.go', 2, 'var(--yellow)']
];

/* 1. Strict: six refused schemas */
(() => {
  const el = $('#d-strict'), list = $('#sd-bad'), tally = $('#sd-tally');
  const MARK = { 'typo.json': '"minimun"', 'pattern.json': '"pattern"', 'nullable.json': '"nullable"', 'dupe.json': '"amount"', 'empty.json': '"maximum":5', 'forbidden.json': '"b"' };
  const hl = (src, m) => { const i = src.lastIndexOf(m); return `${esc(src.slice(0, i))}<mark>${esc(m)}</mark>${esc(src.slice(i + m.length))}`; };
  list.innerHTML = CAP.strict.map(s => `<li class="sd-b"><p class="sd-b-h"><b>${esc(s.why)}</b><code>${s.file}</code></p>`
    + `<code class="sd-src">${hl(s.src, MARK[s.file])}</code><p class="sd-err">${esc(s.err)}</p></li>`).join('');
  const items = $$('.sd-b', list), errs = $$('.sd-err', list);
  const all = on => { sdShow(items, on); sdShow(errs, on); items.forEach(i => i.classList.toggle('is-lit', on)); tally.classList.toggle('is-off', !on); };
  demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('is-off');
        await wait(420, me);
        items[i].classList.add('is-lit');
        await wait(300, me);
        errs[i].classList.remove('is-off');
        await wait(520, me);
      }
      tally.classList.remove('is-off');
    }
  });
})();

/* 2. Containment: the example pairs, both directions */
(() => {
  const el = $('#d-contain'), seg = $('#sd-pairs'), ctx = $('#sd-ctx'), body = $('#sd-tbl tbody'), pre = $('#sd-check-pre');
  const same = n => [`${n} other fields`, 'unchanged', 'unchanged', 'ok', 'ok'];
  const PAIRS = [
    { id: 'orders23', label: 'orders v2 to v3', o: 'v2', n: 'v3',
      ctx: 'orders v3 turns amount from integer cents into a decimal string and makes customer_id required. Both break consumers on v3 reading old events, and the type change also breaks consumers still on v2.',
      rows: [['amount', 'integer, minimum 0', 'string', 'br', 'br'], ['customer_id', 'optional string', 'required string', 'br', 'ok'], same(3)] },
    { id: 'payments', label: 'payments v1 to v2', o: 'v1', n: 'v2',
      ctx: 'payments v2 adds a refunded status. New consumers read old events fine, but a consumer still on v1 meets a status it has never heard of. Under FULL, that is a break.',
      rows: [['status', 'authorized, captured, failed', 'adds refunded', 'ok', 'br'], same(3)] },
    { id: 'shipments', label: 'shipments v1 to v2', o: 'v1', n: 'v2',
      ctx: 'shipments v2 declares a carrier field on an open schema. v1 allowed any value under any undeclared name, so a v1 producer could legally send a carrier v2 rejects. It looks harmless and breaks backward.',
      rows: [['carrier', 'undeclared, so any value', 'ups, dhl or fedex', 'br', 'ok'], same(3)] },
    { id: 'orders12', label: 'orders v1 to v2', o: 'v1', n: 'v2',
      ctx: 'orders v2 adds an optional customer_id to a closed schema. That is the safe way to grow a contract: backward compatible, so it passes the default mode. Only a consumer still on v1 would object.',
      rows: [['customer_id', 'not allowed', 'optional string', 'ok', 'br'], same(4)] }
  ];
  seg.innerHTML = PAIRS.map((p, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${p.label}</button>`).join('');
  const btns = $$('button', seg), oldTh = $('th[data-k="old"]', el), newTh = $('th[data-k="new"]', el);
  const cell = (v, l) => `<td class="sd-v ${v === 'br' ? 'sd-br' : 'sd-ok'}" data-l="${l}"><span>${v === 'br' ? 'breaks' : 'compatible'}</span></td>`;
  let cur = 0, ver = 0;
  function render(i, on) {
    const p = PAIRS[i], run = CAP.pairs[p.id];
    cur = i;
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    ctx.textContent = p.ctx;
    oldTh.textContent = `Old (${p.o})`;
    newTh.textContent = `New (${p.n})`;
    body.innerHTML = p.rows.map(([f, a, b, bk, fw]) => `<tr><th scope="row"><code>${esc(f)}</code></th><td data-l="${p.o}">${esc(a)}</td><td data-l="${p.n}">${esc(b)}</td>${cell(bk, 'Backward')}${cell(fw, 'Forward')}</tr>`).join('');
    pre.replaceChildren(sdCmd(run.cmd), ...run.lines.map(sdLine), sdLine(['', '']), sdExit(run.exit));
    sdShow($$('tr', body), on);
    sdShow($$('.sd-v span', body), on);
    sdShow($$('span', pre), on);
  }
  demo(el, {
    reset() { ver++; render(cur, false); },
    final() { render(cur, true); },
    async play(me) {
      const v = ver, rows = $$('tr', body), lines = $$('span', pre);
      const go = async ms => { await wait(ms, me); if (v !== ver) throw STOP; };
      await go(300);
      for (const r of rows) {
        r.classList.remove('is-off');
        await go(380);
        for (const m of $$('.sd-v span', r)) { m.classList.remove('is-off'); await go(260); }
      }
      await go(300);
      for (const l of lines) { l.classList.remove('is-off'); await go(l.classList.contains('cmd') ? 400 : 70); }
    }
  });
  btns.forEach((b, i) => b.addEventListener('click', () => { ver++; render(i, true); }));
})();

/* 3. Witness: the e.g. event, accepted by the writer and rejected by the reader */
(() => {
  const el = $('#d-witness'), ev = $('#sd-ev'), proof = $('#sd-proof'), sides = [$('#sd-w0'), $('#sd-w1')];
  const W = {
    orders: { ev: sdEg(CAP.pairs.orders23.lines), names: ['Writer: orders v2', 'Reader: orders v3'], runs: CAP.witness.orders },
    payments: { ev: sdEg(CAP.pairs.payments.lines), names: ['Writer: payments v2', 'Reader: payments v1'], runs: CAP.witness.payments }
  };
  const btns = $$('[data-w]', el);
  let cur = 'orders', ver = 0;
  function render(key, on) {
    const w = W[key];
    cur = key;
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.w === key)));
    ev.textContent = JSON.stringify(w.ev);
    sides.forEach((s, i) => {
      const run = w.runs[i];
      $('b', s).textContent = w.names[i];
      const mk = $('.sd-mark', s);
      mk.textContent = run.exit ? `rejects it, exit ${run.exit}` : 'accepts it, exit 0';
      mk.className = `sd-mark ${run.exit ? 'sd-br' : 'sd-ok'}`;
      $('pre', s).replaceChildren(sdCmd(run.cmd), ...run.lines.map(sdLine));
    });
    ev.classList.toggle('is-off', !on);
    sdShow(sides, on);
    sdShow($$('.sd-mark', el), on);
    proof.classList.toggle('is-off', !on);
  }
  demo(el, {
    reset() { ver++; render(cur, false); },
    final() { render(cur, true); },
    async play(me) {
      const v = ver;
      const go = async ms => { await wait(ms, me); if (v !== ver) throw STOP; };
      await go(300);
      ev.classList.remove('is-off');
      for (const s of sides) {
        await go(700);
        s.classList.remove('is-off');
        await go(700);
        $('.sd-mark', s).classList.remove('is-off');
      }
      await go(600);
      proof.classList.remove('is-off');
    }
  });
  btns.forEach(b => b.addEventListener('click', () => { ver++; render(b.dataset.w, true); }));
})();

/* 4. Gate: two pull requests against the same main */
(() => {
  const el = $('#d-gate'), files = $('#sd-files'), sum = $('#sd-sum'), probs = $('#sd-probs'), exit = $('#sd-exit');
  const PR = {
    bad: [['contracts/orders/v1.json', 'edited', 'adds "GBP" to currency'], ['contracts/orders/v3.json', 'added', 'amount becomes a decimal string'], ['contracts/payments/v2.json', 'added', 'adds a refunded status']],
    ok: [['contracts/orders/v1.json', 'edited', 'title reworded only'], ['contracts/orders/v3.json', 'added', 'one new optional field, channel']]
  };
  // Splits the gate output at its blank lines: summary rows, then one block per problem, then the total.
  const parse = lines => {
    const blocks = [[]];
    for (const l of lines) { if (l[1] === '') blocks.push([]); else blocks[blocks.length - 1].push(l); }
    return { head: blocks[0], probs: blocks.slice(1, -1), end: blocks[blocks.length - 1] };
  };
  const btns = $$('[data-pr]', el);
  let cur = 'bad', ver = 0;
  function render(key, on) {
    const run = CAP.gate[key], g = parse(run.lines);
    cur = key;
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pr === key)));
    files.innerHTML = PR[key].map(([f, st, what]) => `<li><span class="sd-st is-${st}">${st}</span><code>${f}</code><em>${esc(what)}</em></li>`).join('');
    sum.replaceChildren(...g.head.map(sdLine));
    probs.innerHTML = g.probs.map(b => `<li class="sd-pb"><p class="sd-pb-h">${esc(b[0][1])}</p><pre class="sd-t">${
      b.slice(1).filter(([, t]) => !t.trim().startsWith('e.g.')).map(([k, t]) => `<span class="${k}">${esc(t.replace(/^ {2}/, ''))}</span>`).join('')}</pre></li>`).join('')
      + g.end.map(([k, t]) => `<li class="sd-pend ${k}">${esc(t)}</li>`).join('');
    $('b', exit).textContent = `exit ${run.exit}`;
    $('span', exit).textContent = run.exit ? 'CI fails' : 'CI passes';
    exit.className = `sd-exit ${run.exit ? 'sd-br' : 'sd-ok'}`;
    sdShow($$('li', files), on);
    sdShow($$('span', sum), on);
    sdShow($$(':scope > li', probs), on);
    exit.classList.toggle('is-off', !on);
  }
  demo(el, {
    reset() { ver++; render(cur, false); },
    final() { render(cur, true); },
    async play(me) {
      const v = ver;
      const go = async ms => { await wait(ms, me); if (v !== ver) throw STOP; };
      await go(300);
      for (const f of $$('li', files)) { f.classList.remove('is-off'); await go(450); }
      for (const s of $$('span', sum)) { s.classList.remove('is-off'); await go(220); }
      for (const p of $$(':scope > li', probs)) { await go(500); p.classList.remove('is-off'); }
      await go(500);
      exit.classList.remove('is-off');
    }
  });
  btns.forEach(b => b.addEventListener('click', () => { ver++; render(b.dataset.pr, true); }));
})();

/* 5. Verify: captured events, line by line */
(() => {
  const el = $('#d-verify'), list = $('#sd-evs'), vsum = $('#sd-vsum');
  const probs = n => CAP.verify.lines.filter(([, t]) => t.startsWith(`line ${n}:`));
  list.innerHTML = CAP.events.map((e, i) => {
    const p = probs(i + 1);
    return `<li class="sd-e ${p.length ? 'sd-br' : 'sd-ok'}"><span class="sd-ln">${i + 1}</span><code class="sd-ej">${esc(e)}</code>`
      + `<span class="sd-badge">${p.length ? 'invalid' : 'valid'}</span>${p.length ? `<ul>${p.map(([, t]) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</li>`;
  }).join('');
  const last = CAP.verify.lines[CAP.verify.lines.length - 1][1];
  $('code', vsum).textContent = last;
  $('span', vsum).textContent = `exit ${CAP.verify.exit}`;
  const rows = $$('.sd-e', list), marks = $$('.sd-badge, .sd-e ul', list);
  const all = on => { sdShow(rows, on); sdShow(marks, on); vsum.classList.toggle('is-off', !on); };
  demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) {
        r.classList.remove('is-off');
        await wait(450, me);
        sdShow($$('.sd-badge, ul', r), true);
        await wait(r.classList.contains('sd-br') ? 650 : 350, me);
      }
      await wait(300, me);
      vsum.classList.remove('is-off');
    }
  });
})();

/* 6. Consumer: the example consumer on v2 and v3 events, then verify */
(() => {
  const el = $('#d-consumer'), list = $('#sd-steps');
  const TITLES = ['A consumer written against v2, reading v2 events', 'The same consumer, reading events from a v3 producer', 'The same v3 events, checked against v2 instead'];
  list.innerHTML = CAP.consumer.map((r, i) => `<li class="sd-step"><p class="sd-step-h"><b>${i + 1}</b>${TITLES[i]}</p><div class="cli"><pre></pre></div></li>`).join('');
  const steps = $$('.sd-step', list);
  steps.forEach((s, i) => { const r = CAP.consumer[i]; $('pre', s).replaceChildren(sdCmd(r.cmd), ...r.lines.map(sdLine), sdExit(r.exit)); });
  const lines = $$('pre span', list);
  const all = on => { sdShow(steps, on); sdShow(lines, on); };
  demo(el, {
    reset() { all(false); },
    final() { all(true); },
    async play(me) {
      await wait(300, me);
      for (const s of steps) {
        s.classList.remove('is-off');
        await wait(300, me);
        for (const l of $$('pre span', s)) { l.classList.remove('is-off'); await wait(l.classList.contains('cmd') ? 600 : 260, me); }
        await wait(700, me);
      }
    }
  });
})();
