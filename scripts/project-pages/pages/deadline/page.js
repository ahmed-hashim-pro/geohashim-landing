/* deadline. Every run below is verbatim output of the jar built from b9c7d7e on OpenJDK 21.
   TL is read back out of the SVG that `deadline demo --svg` wrote for the same run as DEMO. */
const TL = /*@@DATA:timeline@@*/;
const dlLines = (cls, text) => text.split('\n').map(t => [cls, t]);
const DEMO = `user -> gateway -> orders -> inventory, each a separate JVM. The user waits 2.0 s.
gateway calls orders: 3.5 s timeout, 3 attempts. orders calls inventory: 1.0 s timeout, 3 attempts.
inventory is having a slow day: every call takes 1.5 s.

without deadlines  user gave up at 2.00 s; services kept working until 9.69 s
                   12 calls between services, 9 after the user left; 13.60 s of worker time, 11.15 s after
with deadlines     user got a 504 at 1.87 s; services kept working until 1.86 s
                   3 calls between services, 0 after the user left; 1.80 s of worker time, 0.00 s after

where the budget went, from the Deadline-Trace header the user got back (ms):
hop                          try   start     end  queue  outcome
gateway                        -       0    1861      0  deadline_exceeded (orders ran out of budget)
  orders                       1       0    1843      0  deadline_exceeded (inventory ran out of budget)
    inventory                  1      20     966      0  deadline_exceeded (work stopped after 939 of 1500 ms)
    inventory                  2     980    1817      0  deadline_exceeded (work stopped after 837 of 1500 ms)
    inventory                  3    1829       -      -  not_started (49 ms left, needs 100)
  orders                       2    1855       -      -  not_started (84 ms left, needs 100)`;
const LOAD = `30 requests/s for 20 s. inventory: 8 workers, 100 ms per call, 5% of calls 1.5 s.
same timeouts as the demo; the user waits 2.0 s.

                    answered      p50      p99   worker time    after user   for no answer   drain
without deadlines      15.0%    142 ms    911 ms       923.4 s       883.7 s         912.5 s  91.8 s
with deadlines         94.5%    142 ms    417 ms       129.5 s         0.0 s          59.9 s   0.0 s

answered       the user got a 2xx within their wait
worker time    total time services spent holding a worker
after user     worker time after the user had their answer or had given up
for no answer  worker time on requests that never answered the user in time
drain          how long services kept working after the last user stopped waiting

check: ok`;
// curl -si against one inventory service; [header sent, status line, trace header or '', body]
const HDR = [
  ['', 'HTTP/1.1 200 OK', 'inventory;0;0;1508;0;ok;', 'ok from inventory', 'No header: no deadline, the full 1.5 s'],
  ['600', 'HTTP/1.1 504 Gateway Timeout', 'inventory;0;0;593;0;deadline_exceeded;work+stopped+after+589+of+1500+ms', 'work stopped after 589 of 1500 ms', 'Work cut short when the budget ran out'],
  ['-20', 'HTTP/1.1 504 Gateway Timeout', 'inventory;0;0;0;0;deadline_exceeded;arrived+with+-20+ms', 'arrived with no budget left', 'Already late: not worked on'],
  ['0', 'HTTP/1.1 504 Gateway Timeout', 'inventory;0;0;0;0;deadline_exceeded;arrived+with+0+ms', 'arrived with no budget left', 'Nothing left: not worked on'],
  ['soon', 'HTTP/1.1 400 Bad Request', '', "bad Deadline-Budget-Ms: 'soon'", 'Not a number'],
  ['1.5', 'HTTP/1.1 400 Bad Request', '', "bad Deadline-Budget-Ms: '1.5'", 'Not whole milliseconds'],
  ['999999999999', 'HTTP/1.1 200 OK', 'inventory;0;0;1500;0;ok;', 'ok from inventory', 'Clamped to an hour, so the work finishes']
];
const curlCmd = h => `curl -si ${h ? `-H 'Deadline-Budget-Ms: ${h}' ` : ''}localhost:47313/`;
const CHAIN = 'gateway;0;0;1909;0;deadline_exceeded;orders+ran+out+of+budget,gateway%3Eorders;1;0;1876;0;deadline_exceeded;inventory+ran+out+of+budget,gateway%3Eorders%3Einventory;1;20;979;0;deadline_exceeded;work+stopped+after+939+of+1500+ms,gateway%3Eorders%3Einventory;2;1029;1818;0;deadline_exceeded;work+stopped+after+788+of+1500+ms,gateway%3Eorders%3Einventory;3;1868;1868;0;not_started;10+ms+left%2C+needs+100,gateway%3Eorders;2;1894;1894;0;not_started;45+ms+left%2C+needs+100';
const dec = s => decodeURIComponent(s.replace(/\+/g, ' '));

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
  const tone = t => (/deadline_exceeded|not_started|504|400/.test(t) ? 'err' : /^check: ok|200 OK/.test(t) ? 'ok' : 'out');
  const reply = h => {
    const r = HDR.find(x => x[0] === h);
    return [['cmd', curlCmd(h)], [tone(r[1]), r[1]], ...(r[2] ? [['out', `Deadline-trace: ${r[2]}`]] : []), gap, ['out', r[3]], gap];
  };
  PAGE.terminal = {
    scenes: {
      demo: [['cmd', 'java -jar target/deadline.jar demo'], ...DEMO.split('\n').map(t => [/^with deadlines/.test(t) ? 'ok' : /^without/.test(t) ? 'err' : 'out', t])],
      load: [['cmd', 'java -jar target/deadline.jar load --rate 30 --seconds 20 --check'], ...LOAD.split('\n').map(t => [tone(t), t])],
      curl: [['dim', '# deadline service --name inventory --work 1500 --slots 1 --margin 50'], ...reply(''), ...reply('600'), ...reply('-20'), ...reply('soon')],
      trace: [['dim', '# gateway -> orders -> inventory, started by hand with the demo settings'], ['cmd', "curl -si -H 'Deadline-Budget-Ms: 1950' localhost:47311/"], ['err', 'HTTP/1.1 504 Gateway Timeout'], ['out', `Deadline-trace: ${CHAIN}`], gap, ['out', 'orders ran out of budget']]
    },
    order: ['demo', 'load', 'curl', 'trace'],
    first: 'demo'
  };
})();

/* Tests per class, from Surefire */
PAGE.tests = [['BudgetTest', 13, 'var(--yellow)'], ['HttpTest', 10, 'var(--blue)'], ['PlanTest', 7, 'var(--magenta)'], ['DeadlineTest', 5, 'var(--water)'], ['TraceTest', 5, 'var(--green)'], ['SlotsTest', 4, 'var(--red)'], ['ClusterTest', 3, 'var(--ink)'], ['AnalysisTest', 2, 'var(--ink-2)']];

/* 1. Budget: seven headers against one service */
(() => {
  const el = $('#d-budget'), list = $('#dl-hdr');
  list.innerHTML = HDR.map(([h, st, tr, body, why]) => {
    const code = st.split(' ')[1];
    const end = tr ? tr.split(';')[3] : null;
    return `<li class="dl-h" data-c="${code[0]}"><p class="dl-h-in"><span>Deadline-Budget-Ms</span><code>${h === '' ? 'absent' : esc(h)}</code></p><p class="dl-h-st"><b>${code}</b><span>${esc(why)}</span></p><p class="dl-h-out"><code>${esc(body)}</code>${end !== null ? `<small>trace: ended at ${end} ms</small>` : '<small>no trace: rejected before the handler</small>'}</p></li>`;
  }).join('');
  const rows = $$('li', list);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-r')); },
    final() { rows.forEach(r => r.classList.add('in', 'is-r')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(280, me); r.classList.add('is-r'); await wait(420, me); }
    }
  });
})();

/* 2. Plan: the orders hop on a virtual clock */
(() => {
  const el = $('#d-plan'), box = $('#dl-plan'), steps = $('#dl-steps');
  const D = 1890, pct = v => `${(v / D * 100).toFixed(2)}%`;
  const A = [
    { t0: 0, wait: 1000, budget: 950, txt: 'Attempt 1: 1,890 ms left. Wait min(1,000, 1,890) = 1,000; tell inventory 1,000 − 50 = <b>950</b>.' },
    { t0: 950, wait: 940, budget: 890, txt: 'Attempt 2: 940 ms left. Wait min(1,000, 940) = 940; tell inventory <b>890</b>.' },
    { t0: 1840, skip: true, txt: 'Attempt 3: 50 ms left, 100 needed (50 minimum + 50 margin). <b>Not sent.</b>' }
  ];
  box.innerHTML = `<div class="dl-p-axis"><span style="left:0">0</span><span style="left:${pct(1000)}">1,000</span><span style="left:100%">1,890 ms, the deadline</span></div>
    <div class="dl-p-lane">${A.map((a, i) => a.skip ? `<span class="dl-p-skip" data-i="${i}" style="left:${pct(a.t0)}"><b>3</b> skipped</span>` : `<span class="dl-p-att" data-i="${i}" style="left:${pct(a.t0)};width:${pct(a.wait)}"><i class="dl-p-b" style="--s:${(a.budget / a.wait).toFixed(4)}"></i><b>${i + 1}</b></span>`).join('')}<span class="dl-p-dl"></span></div>`;
  steps.innerHTML = A.map(a => `<li>${a.txt}</li>`).join('') + '<li class="dl-p-end">Finished at 1,840 ms, before the deadline. Without the deadline, orders would have waited the full 1,000 ms three times.</li>';
  const atts = $$('[data-i]', box), items = $$('li', steps);
  demo(el, {
    reset() { atts.forEach(a => a.classList.remove('in')); items.forEach(i => i.classList.remove('in')); },
    final() { atts.forEach(a => a.classList.add('in')); items.forEach(i => i.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      for (let i = 0; i < atts.length; i++) { atts[i].classList.add('in'); items[i].classList.add('in'); await wait(1300, me); }
      items[items.length - 1].classList.add('in');
    }
  });
})();

/* 3. Enforce: two requests, one worker */
(() => {
  const el = $('#d-enforce'), box = $('#dl-q');
  const MAX = 1300, pct = v => `${(v / MAX * 100).toFixed(2)}%`;
  // From each reply's Deadline-Trace: start, end, queue; b arrived 0.1 s after a.
  const R = [
    { n: 'a', budget: 1200, off: 0, end: 1203, queue: 0, note: 'work stopped after 1185 of 1500 ms' },
    { n: 'b', budget: 500, off: 100, end: 482, queue: 481, note: 'budget ran out in the queue' }
  ];
  box.innerHTML = `<div class="dl-q-axis">${[0, 250, 500, 750, 1000, 1250].map(v => `<span style="left:${pct(v)}">${v}</span>`).join('')}</div>`
    + R.map(r => `<div class="dl-q-row"><p><b>${r.n}</b><small>${r.budget} ms budget</small></p><div class="dl-q-lane"><span class="dl-q-bud" style="left:${pct(r.off)};width:${pct(r.budget)}"></span>${r.queue ? `<span class="dl-q-wait" style="left:${pct(r.off)};width:${pct(r.queue)}"><em>waiting for the worker</em></span>` : `<span class="dl-q-work" style="left:${pct(r.off)};width:${pct(r.end)}"><em>holding the worker</em></span>`}<span class="dl-q-x" style="left:${pct(r.off + r.end)}">504</span></div><p class="dl-q-note">${r.note}</p></div>`).join('');
  const rows = $$('.dl-q-row', box);
  const term = miniTerm($('#dl-q-term'), [
    ['dim', '# a: 1,200 ms; b, 0.1 s later: 500 ms'],
    ['err', '[b] HTTP/1.1 504 Gateway Timeout'], ['out', '[b] Deadline-trace: inventory;0;0;482;481;deadline_exceeded;budget+ran+out+in+the+queue'], ['out', '[b] budget ran out waiting for a worker'],
    ['err', '[a] HTTP/1.1 504 Gateway Timeout'], ['out', '[a] Deadline-trace: inventory;0;0;1203;0;deadline_exceeded;work+stopped+after+1185+of+1500+ms'], ['out', '[a] work stopped after 1185 of 1500 ms']
  ]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-x')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in', 'is-x')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(500, me); }
      await wait(900, me);
      rows[1].classList.add('is-x'); await wait(700, me);
      rows[0].classList.add('is-x'); await wait(500, me);
      await term.play(me, 120);
    }
  });
})();

/* 4. Trace: the raw header, then each span decoded */
(() => {
  const el = $('#d-trace'), raw = $('#dl-raw'), tree = $('#dl-tree');
  const spans = CHAIN.split(',');
  raw.innerHTML = `<span class="dl-raw-k">Deadline-trace:</span> ${spans.map(s => `<span class="dl-raw-s">${esc(s)}</span>`).join('<span class="dl-raw-c">,</span>')}`;
  tree.innerHTML = spans.map(s => {
    const [path, att, start, end, , outcome, detail] = s.split(';');
    const p = dec(path), depth = p.split('>').length - 1, hop = p.split('>').pop();
    const skip = outcome === 'not_started';
    return `<li class="dl-t" style="--d:${depth}" data-o="${outcome}"><span class="dl-t-hop">${hop}${+att ? `<small>try ${att}</small>` : ''}</span><span class="dl-t-time">${skip ? `at ${start}` : `${start} to ${end}`} ms</span><span class="dl-t-out"><b>${outcome}</b> ${esc(dec(detail))}</span></li>`;
  }).join('');
  const segs = $$('.dl-raw-s', raw), rows = $$('li', tree);
  demo(el, {
    reset() { raw.classList.remove('in'); segs.forEach(s => s.classList.remove('is-on')); rows.forEach(r => r.classList.remove('in')); },
    final() { raw.classList.add('in'); rows.forEach(r => r.classList.add('in')); },
    async play(me) {
      await wait(300, me);
      raw.classList.add('in');
      await wait(900, me);
      for (let i = 0; i < rows.length; i++) {
        segs.forEach((s, k) => s.classList.toggle('is-on', k === i));
        rows[i].classList.add('in');
        await wait(650, me);
      }
      segs.forEach(s => s.classList.remove('is-on'));
    }
  });
})();

/* 5. One request: the two timelines */
(() => {
  const el = $('#d-demo'), box = $('#dl-tl');
  const SPAN = 10000, pct = v => `${(v / SPAN * 100).toFixed(2)}%`;
  const LANES = ['gateway', 'orders', 'inventory'];
  const stopAt = txt => Math.round(parseFloat(txt.match(/([\d.]+) s/)[1]) * 1000);
  // Overlapping bars in one lane go on separate rows, first fit.
  const pack = bars => {
    const rows = [];
    return bars.map(b => {
      let r = rows.findIndex(end => end <= b.start);
      if (r < 0) { r = rows.length; rows.push(0); }
      rows[r] = b.end;
      return { ...b, row: r };
    });
  };
  const panel = (key, title) => {
    const stop = stopAt(TL[`${key}Stop`]);
    const lanes = LANES.map((n, li) => {
      const bars = pack(TL[key].filter(b => b.lane === li).sort((a, b) => a.start - b.start));
      const h = Math.max(1, ...bars.map(b => b.row + 1));
      return `<div class="dl-lane" style="--rows:${h}"><span class="dl-lane-n">${n}</span><div class="dl-lane-t">${bars.map(b => {
        const redFrom = b.red === null ? b.end : b.red;
        return `<span class="dl-bar" style="left:${pct(b.start)};width:${pct(b.end - b.start)};top:calc(${b.row} * 15px)"><i class="ok" style="width:${((redFrom - b.start) / (b.end - b.start) * 100).toFixed(2)}%"></i><i class="bad" style="left:${((redFrom - b.start) / (b.end - b.start) * 100).toFixed(2)}%;right:0"></i></span>`;
      }).join('')}</div></div>`;
    }).join('');
    return `<div class="dl-pan" data-k="${key}"><p class="dl-pan-t">${title}</p><div class="dl-pan-b">${lanes}<span class="dl-stop" style="left:${pct(stop)}"><b>${esc(TL[`${key}Stop`])}</b></span></div></div>`;
  };
  box.innerHTML = panel('naive', 'Without deadlines') + panel('deadline', 'With deadlines')
    + `<div class="dl-tl-axis">${[0, 2, 4, 6, 8, 10].map(s => `<span style="left:${s * 10}%">${s} s</span>`).join('')}</div>`;
  const pans = $$('.dl-pan', box);
  const lines = DEMO.split('\n');
  const term = miniTerm($('#dl-demo-term'), lines.slice(4, 8).map(t => [/^with /.test(t) ? 'ok' : /^without/.test(t) ? 'err' : 'out', t]));
  demo(el, {
    reset() { pans.forEach(p => p.classList.remove('in', 'is-s')); term.hide(); },
    final() { pans.forEach(p => p.classList.add('in', 'is-s')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const p of pans) { p.classList.add('in'); await wait(1900, me); p.classList.add('is-s'); await wait(700, me); }
      await term.play(me, 160);
    }
  });
})();

/* 6. Under load: the load table as bars */
(() => {
  const el = $('#d-load'), box = $('#dl-ld');
  const M = [
    ['Answered in time', 15.0, 94.5, 100, '%'],
    ['Worker time', 923.4, 129.5, 923.4, ' s'],
    ['After the user left', 883.7, 0.0, 923.4, ' s'],
    ['Drain after the traffic stopped', 91.8, 0.0, 91.8, ' s']
  ];
  box.innerHTML = M.map(([n, a, b, max, u]) => `<div class="dl-ld-m"><p>${n}</p>${[['Without', a, 'bad'], ['With', b, 'ok']].map(([k, v, c]) => `<div class="dl-ld-r"><span>${k}</span><span class="dl-ld-bar ${c}"><i style="--s:${(v / max).toFixed(4)}"></i></span><b>${v.toFixed(1)}${u}</b></div>`).join('')}</div>`).join('');
  const ms = $$('.dl-ld-m', box);
  const term = miniTerm($('#dl-ld-term'), LOAD.split('\n').slice(3, 6).map(t => [/^with /.test(t) ? 'ok' : /^without/.test(t) ? 'err' : 'out', t]).concat([['ok', 'check: ok']]));
  demo(el, {
    reset() { ms.forEach(m => m.classList.remove('in')); term.hide(); },
    final() { ms.forEach(m => m.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const m of ms) { m.classList.add('in'); await wait(650, me); }
      await wait(300, me);
      await term.play(me, 140);
    }
  });
})();
