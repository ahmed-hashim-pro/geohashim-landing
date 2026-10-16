/* Every report, tree and summary below is verbatim output of trace-diff 0.1.0 at commit 49f4da3.
   CAP['tests-*'] lists the hypothesis tests of three comparisons, from a scratch test in a copy of the repository. */
const CAP = /*@@DATA:captures@@*/;

const toneOf = t => (/^(FAIL|trace-diff: )/.test(t) ? 'err' : /^WARN/.test(t) ? 'warn' : /^no structural changes/.test(t) ? 'ok' : /^ {6}trace (after|before)/.test(t) ? 'dim' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];
const noIds = lines => lines.filter(t => !/^ {6}trace (after|before) /.test(t));
const firstFinding = c => {
  const i = c.out.findIndex(t => /^(FAIL|WARN|INFO) /.test(t));
  const j = c.out.indexOf('', i);
  return noIds(c.out.slice(i, j < 0 ? undefined : j));
};
const shortCmd = c => c.cmd.replace(/examples\/shop\//g, '');

function miniTerm(el, lines) {
  el.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const spans = $$('span', el);
  return {
    hide() { spans.forEach(s => s.classList.add('is-off')); },
    show() { spans.forEach(s => s.classList.remove('is-off')); },
    async play(me, ms = 70) { for (const s of spans) { s.classList.remove('is-off'); await wait(s.classList.contains('cmd') ? 380 : ms, me); } }
  };
}
function segment(el, labels, onPick) {
  el.innerHTML = labels.map((l, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(l)}</button>`).join('');
  const btns = $$('button', el);
  const set = i => btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  btns.forEach((b, i) => b.addEventListener('click', () => onPick(i, true)));
  return set;
}

/* Hero terminal */
(() => {
  const gap = ['out', ''];
  PAGE.terminal = {
    scenes: {
      report: [['dim', '# the change: lazy item loading, and retries on pricing'], ...runLines(CAP.report), gap, ...exitLines(CAP.report)],
      rerun: [['dim', '# the same code, run twice'], ...runLines(CAP.rerun), gap, ...exitLines(CAP.rerun)],
      show: [['dim', '# the retry-storm finding\'s worst request'], ...runLines(CAP.showRetry)],
      summary: [['dim', '# what each request calls, after the change'], ...runLines(CAP.summaryAfter)]
    },
    order: ['report', 'rerun', 'show', 'summary'],
    first: 'report'
  };
})();

/* Tests per package, from go test -race -json (subtests counted) and the demo module against Postgres */
PAGE.tests = [['internal/bench', 14, 'var(--blue)'], ['internal/analyze', 7, 'var(--magenta)'], ['internal/otlp', 5, 'var(--yellow)'], ['internal/stats', 4, 'var(--water)'], ['cmd/trace-diff', 3, 'var(--green)'], ['demo/cmd/shop', 3, 'var(--ink-2)'], ['demo/otlpcheck', 1, 'var(--red)']];

/* 1. Read: the three committed runs, then the receiver */
(() => {
  const el = $('#d-read'), list = $('#td-runs');
  const head = c => c.out.slice(0, 2).map(t => t.match(/^(before|after):\s+(\S+), (\d+) traces, (\d+) spans/));
  const [b] = head(CAP.report), [, r] = head(CAP.rerun), [, a] = head(CAP.report);
  const SIZE = { 'before.jsonl.gz': '114,599', 'rerun.jsonl.gz': '116,152', 'after.jsonl.gz': '174,319' };
  const ROWS = [[b, 'The code before the change'], [r, 'The same code, run again'], [a, 'The change under review']].map(([m, what]) => ({ file: m[2].split('/').pop(), what, traces: +m[3], spans: +m[4] }));
  const max = Math.max(...ROWS.map(x => x.spans));
  list.innerHTML = ROWS.map(x => `<li class="td-run"><p class="td-run-n"><code>${x.file}</code><small>${x.what} · ${SIZE[x.file]} bytes</small></p><span class="td-run-bar"><i style="--w:${(x.spans / max * 100).toFixed(1)}%"></i></span><p class="td-run-v"><b>${x.spans.toLocaleString('en-US')}</b> spans<small>${x.traces} traces</small></p></li>`).join('');
  const rows = $$('li', list);
  const c = CAP.collect;
  const term = miniTerm($('#td-collect'), [['cmd', c.cmd + ' &'], ['dim', `# five Collector batches posted as OTLP/HTTP JSON: ${c.posts.join(' ')}`], ['cmd', 'kill -INT %1'], ...c.out.map(t => ['out', t]), ...runLines(CAP.collectSummary).slice(0, 2), ...runLines(CAP.errFile)]);
  demo(el, {
    reset() { rows.forEach(x => x.classList.remove('in')); term.hide(); },
    final() { rows.forEach(x => x.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const x of rows) { x.classList.add('in'); await wait(650, me); }
      await wait(400, me);
      await term.play(me, 110);
    }
  });
})();

/* 2. Match: recorded spans and the operation each becomes */
(() => {
  const el = $('#d-match'), list = $('#td-mt');
  const ROWS = [
    ['frontend', 'client', 'url.full', 'http://orders:8080/orders/158', 'frontend · client · GET orders:8080 /orders/{n}'],
    ['frontend', 'client', 'url.full', 'http://pricing:8080/quote/158?total=10872', 'frontend · client · GET pricing:8080 /quote/{n}'],
    ['frontend', 'server', 'http.route', '/orders/{id}', 'frontend · server · GET /orders/{id}'],
    ['orders', 'db', 'db.query.text', 'SELECT id, sku, qty, price_cents FROM order_items WHERE id = $1', 'orders · db · SELECT id, sku, qty, price_cents FROM order_items WHERE id = ?'],
    ['catalog', 'db', 'db.query.text', 'SELECT id, title, image FROM products WHERE id = 4816', 'catalog · db · SELECT id, title, image FROM products WHERE id = ?'],
    ['catalog', 'db', 'db.query.text', 'SELECT id, title, image FROM products WHERE id = 2448', 'catalog · db · SELECT id, title, image FROM products WHERE id = ?'],
    ['pricing', 'db', 'db.query.text', 'SELECT sku, price_cents FROM prices WHERE sku IN (1, 4963, 5091)', 'pricing · db · SELECT sku, price_cents FROM prices WHERE sku IN (?)'],
    ['orders', 'db', 'db.query.text', "INSERT INTO order_items (order_id, sku, qty) VALUES (1, 'SKU-00001', 1), (954462, 'SKU-16157', 1), (13235, 'SKU-06335', 3)", 'orders · db · INSERT INTO order_items (order_id, sku, qty) VALUES (?)'],
    ['pricing', 'db', 'db.query.text (redis)', 'GET quote:40934', 'pricing · db · GET quote:?']
  ];
  list.innerHTML = ROWS.map(([svc, kind, key, val, op], i) => `<li class="td-mt-row${i === 4 ? ' td-mt-split' : ''}"><p class="td-mt-raw"><small>${svc} · ${kind} · ${esc(key)}</small><code>${esc(val)}</code></p><span class="td-mt-arrow" aria-hidden="true">→</span><p class="td-mt-op"><code>${esc(op)}</code></p></li>`).join('');
  const rows = $$('li', list);
  const fails = c => c.out.filter(t => /^(FAIL|WARN) /.test(t) || /failing, /.test(t));
  const k = CAP.retryKeepLiterals, d = CAP['sc-retry-storm'];
  const term = miniTerm($('#td-keep'), [['dim', '# synthetic retry-storm scenario, finding headers only'], ['cmd', d.cmd], ...fails(d).map(t => [toneOf(t), t]), ['cmd', k.cmd], ...fails(k).map(t => [toneOf(t), t])]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-op')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in', 'is-op')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(260, me); r.classList.add('is-op'); await wait(300, me); }
      await wait(500, me);
      await term.play(me, 140);
    }
  });
})();

/* 3. Per request: waterfalls parsed from `trace-diff show` */
(() => {
  const el = $('#d-request'), wf = $('#td-wf'), cap = $('#td-tr-cap'), feat = $('#td-feat');
  const ITEM = 'orders · db · SELECT id, sku, qty, price_cents FROM order_items WHERE id = ?';
  const EAGER = 'orders · db · SELECT id, sku, qty, price_cents FROM order_items WHERE order_id = ? ORDER BY id';
  const PRICE = 'frontend · client · GET pricing:8080 /quote/{n}';
  const parse = c => {
    const m = c.out[0].match(/^trace (\w+)\s+(.+?)\s+([\d.]+) ms, (\d+) spans/);
    const rows = c.out.slice(1).map(t => {
      const rest = t.slice(19), depth = (rest.length - rest.trimStart().length) / 2;
      const err = / {2}ERROR$/.test(rest);
      return { start: +t.slice(0, 8), dur: +t.slice(9, 17), depth, op: rest.trim().replace(/ {2}ERROR$/, ''), err };
    });
    return { id: m[1], total: +m[3], spans: +m[4], rows };
  };
  const TRACES = [
    { label: 'Before, median', c: CAP.showBefore, hl: [EAGER, PRICE], note: 'the median request before the change' },
    { label: 'After, typical', c: CAP.showTypical, hl: [ITEM], note: 'a typical request after it, 5 items' },
    { label: 'After, 50 items', c: CAP.showN1, hl: [ITEM], note: 'the n-plus-one finding\'s worst request' },
    { label: 'After, retried', c: CAP.showRetry, hl: [PRICE], note: 'the retry-storm finding\'s worst request' }
  ].map(t => ({ ...t, ...parse(t.c) }));
  let cur = 0;
  const draw = i => {
    const t = TRACES[cur = i];
    pick(i);
    cap.innerHTML = `<code>${t.id.slice(0, 8)}</code> ${esc(t.note)}: <b>${t.total} ms</b>, ${t.spans} spans`;
    // Runs of more than six identical sibling spans are drawn as six and one bar for the rest, as the README's pictures do.
    const out = [];
    for (let k = 0; k < t.rows.length;) {
      let j = k;
      while (j < t.rows.length && t.rows[j].op === t.rows[k].op && t.rows[j].depth === t.rows[k].depth) j++;
      const run = t.rows.slice(k, j);
      if (run.length > 8) {
        out.push(...run.slice(0, 6));
        const rest = run.slice(6), s = rest[0].start, e = Math.max(...rest.map(r => r.start + r.dur));
        out.push({ ...rest[0], start: s, dur: e - s, more: rest.length });
      } else out.push(...run);
      k = j;
    }
    // Spans can outlive the request: pricing keeps working on an attempt the frontend gave up on. The scale covers them, and a line marks the response.
    const span = Math.max(t.total, ...t.rows.map(r => r.start + r.dur));
    wf.style.setProperty('--end', `${(t.total / span * 100).toFixed(2)}%`);
    wf.classList.toggle('is-past', span > t.total * 1.01);
    wf.innerHTML = out.map(r => {
      const hl = t.hl.includes(r.op), l = r.start / span * 100, w = Math.max(r.dur / span * 100, .35);
      const label = r.more ? `${r.more} more of the same` : r.op;
      return `<div class="td-wf-row${hl ? ' is-hl' : ''}${r.err ? ' is-err' : ''}${r.more ? ' is-more' : ''}" style="--d:${r.depth}"><span class="td-wf-l" title="${esc(r.op)}">${esc(label)}</span><span class="td-wf-t"><i style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></i></span><span class="td-wf-ms">${r.dur}</span></div>`;
    }).join('');
    const n = op => t.rows.filter(r => r.op === op).length, errs = t.rows.filter(r => r.op === PRICE && r.err).length;
    const F = [['Item queries, one per item', n(ITEM)], ['Eager query for all items', n(EAGER)], ['Calls to pricing', n(PRICE)], ['Of those, failed and retried', errs]];
    feat.innerHTML = F.map(([k, v]) => `<div${v ? ' class="is-on"' : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  };
  const pick = segment($('#td-tr-seg'), TRACES.map(t => t.label), i => { if (d) d.stopAuto = true; draw(i); wf.classList.add('in'); });
  let d = null;
  d = demo(el, {
    reset() { draw(0); wf.classList.remove('in'); },
    final() { draw(3); wf.classList.add('in'); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < TRACES.length; i++) {
        if (d.stopAuto) return;
        draw(i); wf.classList.remove('in');
        await wait(120, me);
        wf.classList.add('in');
        await wait(i === TRACES.length - 1 ? 600 : 2100, me);
      }
    }
  });
})();

/* 4. Is it real: every test of a comparison, raw and corrected */
(() => {
  const el = $('#d-stats'), list = $('#td-st'), sum = $('#td-st-sum');
  const WHAT = { 'pres-up': 'made in more requests', 'pres-down': 'made in fewer requests', 'count-up': 'more calls per request', 'count-down': 'fewer calls per request', 'retry-up': 'retried in more requests', slower: 'requests slower', faster: 'requests faster', tail: 'more requests past the old p95' };
  const SETS = [
    ['The change', CAP['tests-shop'], CAP.report],
    ['Same code twice', CAP['tests-rerun'], CAP.rerun],
    ['Drift, 3,000 a side', CAP['tests-drift'], CAP['sc-drift']]
  ];
  const fmt = p => (p >= .001 ? p.toPrecision(2) : p.toExponential(1).replace('e', '×10^'));
  let rows = [];
  const draw = i => {
    pick(i);
    const [, tests, rep] = SETS[i];
    const sorted = [...tests].sort((a, b) => a.Adj - b.Adj || a.P - b.P);
    const sig = sorted.filter(t => t.Adj <= .001).length, found = rep.out.filter(t => /^(FAIL|WARN|INFO) /.test(t)).length;
    sum.innerHTML = `<b>${tests.length}</b> tests · <b>${sig}</b> significant after correction · <b>${found}</b> ${found === 1 ? 'finding' : 'findings'} in the report`;
    list.innerHTML = sorted.map(t => {
      const op = t.Op.replace(/^ · {2}· $/, '').trim(), x = Math.min(-Math.log10(Math.max(t.Adj, 1e-300)), 12) / 12;
      return `<li class="td-st-row${t.Adj <= .001 ? ' is-sig' : ''}"><p class="td-st-l"><b>${WHAT[t.What] || esc(t.What)}</b><small>${op ? esc(op) : esc(t.Ep)}</small></p><span class="td-st-bar"><i style="--x:${x.toFixed(3)}"></i></span><span class="td-st-p">${esc(fmt(t.Adj)).replace(/\^(-?\d+)/, '<sup>$1</sup>')}</span></li>`;
    }).join('');
    rows = $$('li', list);
  };
  const pick = segment($('#td-st-seg'), SETS.map(s => s[0]), i => { if (d) d.stopAuto = true; draw(i); rows.forEach(r => r.classList.add('in')); });
  let d = null;
  d = demo(el, {
    reset() { draw(0); },
    final() { draw(0); rows.forEach(r => r.classList.add('in')); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < SETS.length; i++) {
        if (d.stopAuto) return;
        draw(i);
        await wait(200, me);
        for (const r of rows) { r.classList.add('in'); await wait(rows.length > 14 ? 60 : 120, me); }
        await wait(i === SETS.length - 1 ? 400 : 1900, me);
      }
      if (!d.stopAuto) { draw(0); rows.forEach(r => r.classList.add('in')); }
    }
  });
})();

/* 5. Big enough: drift with and without the floors */
(() => {
  const el = $('#d-floor'), box = $('#td-fl');
  const RUNS = [['With the floors', CAP['sc-drift']], ['--mutant no-floors', CAP.driftNoFloors]];
  let term = null;
  const draw = i => {
    pick(i);
    const c = RUNS[i][1];
    term = miniTerm(box, [...runLines({ ...c, out: noIds(c.out.slice(3)) }), ...exitLines(c)]);
    box.className = 'mini-term td-fl';
  };
  const pick = segment($('#td-fl-seg'), RUNS.map(r => r[0]), i => { if (d) d.stopAuto = true; draw(i); term.show(); });
  let d = null;
  d = demo(el, {
    reset() { draw(0); term.hide(); },
    final() { draw(0); term.show(); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < RUNS.length; i++) {
        if (d.stopAuto) return;
        draw(i); term.hide();
        await wait(300, me);
        await term.play(me, 60);
        await wait(i ? 500 : 1800, me);
      }
    }
  });
})();

/* 6. Shape: the order classify() names a change in, on five planted scenarios */
(() => {
  const el = $('#d-shape'), rules = $('#td-rules'), what = $('#td-sh-what'), box = $('#td-sh-term');
  const RULES = [
    ['retry-storm', 'Repeated after a failed attempt', 'fail'],
    ['fan-out', 'Repeated under one parent, at the same time', 'fail'],
    ['n-plus-one', 'Repeated under one parent, one after another', 'fail'],
    ['new-sync-call', 'New, and the request waits on it', 'fail'],
    ['new-call', 'New, and the request does not wait on it', 'warn'],
    ['more-frequent', 'Made in more requests', 'warn'],
    ['more-calls', 'Otherwise: more calls per request', 'fail'],
    ['latency', 'The whole request got slower', 'fail']
  ];
  rules.innerHTML = RULES.map(([k, t, s], i) => `<li class="td-rule${i === 7 ? ' td-rule-sep' : ''}" data-k="${k}"><span class="td-rule-t">${t}</span><code class="td-sev td-sev-${s}">${k}</code></li>`).join('');
  const items = $$('li', rules);
  const DESC = Object.fromEntries(CAP.synthList.out.slice(1).map(t => t.trim().split(/\s{2,}/)));
  const SC = ['n-plus-one', 'fan-out', 'retry-storm', 'new-hop', 'latency'];
  let term = null;
  const draw = (i, lit) => {
    pick(i);
    const name = SC[i], c = CAP['sc-' + name], f = firstFinding(c), kind = f[0].split(/\s+/)[1];
    what.innerHTML = `<b>${name}</b> ${esc(DESC[name])}`;
    term = miniTerm(box, f.map(t => [toneOf(t), t]));
    items.forEach(li => li.classList.toggle('is-hit', lit && li.dataset.k === kind));
    return kind;
  };
  const pick = segment($('#td-sh-seg'), SC, i => { if (d) d.stopAuto = true; draw(i, true); term.show(); });
  let d = null;
  d = demo(el, {
    reset() { draw(0, false); term.hide(); },
    final() { draw(0, true); term.show(); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < SC.length; i++) {
        if (d.stopAuto) return;
        const kind = draw(i, false); term.hide();
        await wait(300, me);
        for (const li of items) {
          li.classList.add('is-scan');
          await wait(140, me);
          li.classList.remove('is-scan');
          if (li.dataset.k === kind) { li.classList.add('is-hit'); break; }
        }
        await term.play(me, 50);
        await wait(i === SC.length - 1 ? 300 : 1500, me);
      }
    }
  });
})();

/* 7. The gate: six real runs and their exit codes */
(() => {
  const el = $('#d-gate'), list = $('#td-exits');
  const last = c => c.out[c.out.length - 1];
  const ROWS = [
    ['Same code twice', CAP.rerun], ['The change', CAP.report], ['The change, with diff', CAP.diffAfter],
    ['Drift: one warning', CAP['sc-drift']], ['Drift, --fail-on warn', CAP.driftWarn], ['Not a trace file', CAP.errFile]
  ];
  list.innerHTML = ROWS.map(([t, c]) => `<li class="td-exit" data-code="${c.exit}"><p class="td-exit-n"><b>${esc(t)}</b><code>${esc(shortCmd(c))}</code><small>${esc(last(c))}</small></p><span class="td-exit-c" aria-label="exit ${c.exit}">${c.exit}</span></li>`).join('');
  const rows = $$('li', list);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-done')); },
    final() { rows.forEach(r => r.classList.add('in', 'is-done')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(420, me); r.classList.add('is-done'); await wait(360, me); }
    }
  });
})();

/* 8. The real shop: make demo on this machine, the load generator's lines and the two checks */
(() => {
  const el = $('#d-shop'), box = $('#td-shop');
  const L = CAP.shopLoad, runs = [];
  for (let i = 0; i < L.length; i += 3) {
    const m = L[i + 1].match(/(\d+) requests, (\d+) errors, (\d+) without a quote; latency p50 ([\d.]+) ms, p95 ([\d.]+) ms, p99 ([\d.]+) ms/);
    runs.push({ name: L[i].match(/== (\w+)/)[1], req: m[1], err: m[2], noq: m[3], p50: m[4], p95: m[5], p99: m[6], spans: L[i + 2].match(/(\d+) spans/)[1] });
  }
  const COLS = [['name', 'Run'], ['req', 'Requests'], ['noq', 'Without a quote'], ['p50', 'p50 ms'], ['p95', 'p95 ms'], ['p99', 'p99 ms'], ['spans', 'Spans']];
  box.innerHTML = `<div class="td-shop-row td-shop-head" role="row">${COLS.map(([, h]) => `<span role="columnheader">${h}</span>`).join('')}</div>` + runs.map(r => `<div class="td-shop-row" role="row">${COLS.map(([k, h]) => `<span role="cell"${k === 'p95' ? ' class="td-p95"' : ''}><small>${h} </small>${r[k]}</span>`).join('')}</div>`).join('');
  box.setAttribute('role', 'table');
  box.setAttribute('aria-label', 'The load generator\'s summary for each run');
  const rows = $$('.td-shop-row:not(.td-shop-head)', box);
  const heads = c => c.out.filter(t => /^(FAIL|WARN) /.test(t) || /failing, |^no structural/.test(t));
  const term = miniTerm($('#td-shop-term'), [['cmd', 'trace-diff check demo/out/before.jsonl demo/out/rerun.jsonl'], ...heads(CAP.shopRerun).map(t => [toneOf(t), t]), ['cmd', 'trace-diff check demo/out/before.jsonl demo/out/after.jsonl'], ...heads(CAP.shopAfter).map(t => [toneOf(t), t])]);
  $('#td-shop-note').innerHTML = 'Run here on 2026-10-16 with the steps of CI\'s demo job: the shop\'s tests against the demo\'s Postgres, <code>demo/run.sh</code> (Postgres 17, Collector contrib 0.161.0, 72 s), then both checks; only the finding headers are shown. The table is the load generator\'s own summary. The latencies differ from the README\'s run, on a machine busy with other work, and one page after the change came back without a quote: all three attempts at pricing timed out. The findings are the same three.';
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(550, me); }
      await wait(300, me);
      await term.play(me, 150);
    }
  });
})();

/* Measured: the 200-seed benchmark, rerun here */
(() => {
  const B = CAP.bench;
  if (!B) return;
  $('#td-bench').innerHTML = B.rows.filter(r => r.found !== '-').map(r => {
    const [n, d] = r.found.split('/').map(Number);
    return `<div class="bar-row"><span>${esc(r.name)}</span><span class="bar"><i style="--w:${(n / d * 100).toFixed(1)}%"></i></span><span>${r.found}</span></div>`;
  }).join('');
  $('#td-mut').innerHTML = B.mutants.map(m => `<li><code>${esc(m.name)}</code><b>${esc(m.result)}</b><small><strong>${esc(m.what)}:</strong> ${esc(m.changed)}</small></li>`).join('');
  const [mm, ss] = B.wall.split(':');
  $('#td-cost').innerHTML = [`${mm} min ${Math.round(+ss)} s wall`, `${B.cpuMin} CPU-minutes`, 'Same output as docs/bench.txt'].map(t => `<span>${esc(t)}</span>`).join('');
})();
