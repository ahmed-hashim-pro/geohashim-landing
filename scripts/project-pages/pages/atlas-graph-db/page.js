/* atlas-graph-db. Every string and number below is captured output; see specs/atlas-graph-db.md. */

/* Hero terminal */
const COMMIT_PAYLOAD = 'payload (msgpack, decoded): {"txId":1,"ops":[{"op":"createNode","id":1,"labels":["Person"],"props":{"name":"Ada Lovelace","born":1815}},{"op":"createNode","id":2,"labels":["Document"],"props":{"title":"Notes on the Analytical Engine","year":1843}},{"op":"createEdge","id":1,"type":"WROTE","from":1,"to":2,"props":{}}]}';
const P409 = '{"type":"about:blank","title":"Conflict","status":409,"detail":"node 1 has 25 edge(s); pass { detach: true }","code":"DETACH_REQUIRED"}';
PAGE.terminal = {
  scenes: {
    commit: [
      ['dim', '# a script written for this page, calling the public API'],
      ['cmd', 'node scripts/commit.mjs'],
      ['dim', '$ ls data/   # after open'], ['out', '       0  wal-000001.log'], ['out', ''],
      ['ok', 'transact -> {"txId":1}'], ['out', 'stats     -> {"nodeCount":2,"edgeCount":1}'], ['out', ''],
      ['dim', '$ ls data/   # after commit'], ['out', '     222  wal-000001.log'], ['out', ''],
      ['out', 'frame @0: length=214 crc32=0x00f7902d'],
      ['out', 'header bytes (LE u32 len, LE u32 crc): d6000000 2d90f700'],
      ['out', COMMIT_PAYLOAD], ['out', ''],
      ['dim', 'file size=222 validBytes=222 trailing=0']
    ],
    recover: [
      ['dim', '# a script written for this page: SIGKILL a child that commits 2 nodes + 1 edge per transaction, then reopen'],
      ['cmd', 'node scripts/crash.mjs 1'],
      ['out', 'run 1: SIGKILL after 530 ms, last ACK printed = 192'],
      ['out', '     43372  wal-000001.log'],
      ['out', '  wal-000001.log: 193 whole frames, 0 trailing bytes'],
      ['out', '  reopen 5.2 ms, no warning'],
      ['ok', '  recovered: 386 nodes, 193 edges -> 193 whole transactions (nodes = 2 x edges: true; >= acked: true; invariants ok)'],
      ['out', ''],
      ['dim', '# same idea, damaging a closed three-transaction log by hand'],
      ['cmd', 'node scripts/torn.mjs'],
      ['out', 'clean WAL: 243 bytes, frames at offsets 0 (+8+71), 79 (+8+74), 161 (+8+74)'],
      ['cut', '[three cases cut here, all shown in stage 6]'],
      ['out', '[frame 2 removed] spliced frame 2 out; frames 1 and 3 are intact with valid CRCs'],
      ['err', '  openDatabase threw AtlasError WAL_CORRUPT: WAL replay: expected txId 2 but found 3 in segment 1']
    ],
    query: [
      ['dim', "# the repo's own server on localhost"],
      ['cut', '[login and database creation cut here]'],
      ['cmd', 'curl -s -b jar -X POST localhost:4849/api/db/science/seed/science-history'],
      ['ok', '{"committed":{"nodes":500,"edges":1196}}'], ['out', ''],
      ['cmd', 'curl -s -b jar -H content-type:application/json -d \'{"query":"MATCH (a:Person {name: $n})-[:INFLUENCED*1..3]->(b:Person) RETURN b.name, b.born ORDER BY b.born","params":{"n":"Isaac Newton"}}\' localhost:4849/api/db/science/query'],
      ['out', '{"columns":["b.name","b.born"],"rows":[["Leonhard Euler",1707],["Carl Friedrich Gauss",1777],["Bernhard Riemann",1826]],"stats":{"rowsExamined":30,"elapsedMs":2}}'], ['out', ''],
      ['cmd', 'curl -s -b jar -H content-type:application/json -d \'{"query":"MATCH (p:Person {name: \\"Ada Lovelace\\"}) DELETE p"}\' localhost:4849/api/db/science/query'],
      ['err', P409], ['out', ''],
      ['cmd', 'curl -s -b jar -H content-type:application/json -d \'{"query":"MATCH (p:Person RETURN p"}\' localhost:4849/api/db/science/query'],
      ['err', '{"type":"about:blank","title":"Query Error","status":400,"detail":"expected \\")\\", found \\"RETURN\\"","code":"PARSE_ERROR","line":1,"column":17,"snippet":"MATCH (p:Person RETURN p\\n                ^"}']
    ]
  },
  order: ['commit', 'recover', 'query'],
  first: 'commit'
};

/* Passing tests per package: Vitest JSON report and the Angular unit-test run */
PAGE.tests = [
  ['apps/web', 218, 'var(--magenta)'], ['packages/core', 197, 'var(--blue)'], ['packages/query', 130, 'var(--water)'],
  ['packages/server', 108, 'var(--green)'], ['packages/client', 18, 'var(--yellow)'], ['packages/datasets', 10, 'var(--ink-2)'],
  ['packages/protocol', 5, 'var(--deep)']
];

const lineEl = (cls, text) => { const s = document.createElement('span'); if (cls) s.className = cls; s.textContent = text; return s; };

/* 1. Parse and plan: the EXPLAIN tree before and after CREATE INDEX */
(() => {
  const el = $('#d-parse'), plan = $('#ag-plan'), cost = $('#ag-cost');
  const nodes = $$('.ag-pn', el), olds = $$('.ag-old', el), seek = $('.ag-new', el);
  const ddl = $$('#ag-ddl > span'), perr = $$('#ag-perr > span');
  const lines = [...ddl, ...perr];
  demo(el, {
    reset() {
      nodes.forEach(n => n.classList.add('is-off'));
      olds.forEach(n => n.classList.remove('is-gone'));
      seek.classList.remove('is-in');
      plan.classList.remove('is-indexed');
      cost.textContent = '24';
      lines.forEach(l => l.classList.add('is-off'));
    },
    final() {
      nodes.forEach(n => n.classList.remove('is-off'));
      olds.forEach(n => n.classList.add('is-gone'));
      seek.classList.add('is-in');
      plan.classList.add('is-indexed');
      cost.textContent = '1';
      lines.forEach(l => l.classList.remove('is-off'));
    },
    async play(me) {
      await wait(400, me);
      for (const n of nodes.slice(0, 4)) { n.classList.remove('is-off'); await wait(320, me); }
      await wait(900, me);
      for (const l of ddl) { l.classList.remove('is-off'); await wait(500, me); }
      olds.forEach(n => n.classList.add('is-gone'));
      await wait(450, me);
      seek.classList.remove('is-off');
      seek.classList.add('is-in');
      plan.classList.add('is-indexed');
      for (const v of [18, 12, 7, 3, 1]) { cost.textContent = String(v); await wait(70, me); }
      await wait(1100, me);
      for (const l of perr) { l.classList.remove('is-off'); await wait(260, me); }
    }
  });
})();

/* 2. Staged in memory: rejected transactions never reach the log */
(() => {
  const el = $('#d-stage'), list = $('#ag-tries'), wal = $('#ag-s-wal'), store = $('#ag-s-store'), ids = $('#ag-ids');
  const TRIES = [
    ['bad', 'Stage Mary Somerville, then throw', 'Error: changed my mind'],
    ['bad', 'Stage Charles Darwin and a second Ada Lovelace', 'AtlasError CONSTRAINT_VIOLATION: unique Person.name: value already taken by node 1'],
    ['bad', 'Delete Ada Lovelace, who still has an edge', 'AtlasError DETACH_REQUIRED: node 1 has 1 edge(s); pass { detach: true }'],
    ['bad', 'Stage Michael Faraday and an edge to node 999', 'AtlasError NOT_FOUND: node 999 not found in transaction view'],
    ['bad', 'An async callback', 'AtlasError VALIDATION: transact callback must be synchronous; it returned a thenable'],
    ['empty', 'An empty callback', 'committed {"txId":0}, nothing written'],
    ['ok', 'Stage Mary Somerville', 'committed {"txId":3}']
  ];
  list.innerHTML = TRIES.map(([k, code, res]) =>
    `<li class="ag-tr" data-kind="${k}"><span class="ag-tr-code">${esc(code)}</span><span class="ag-tr-line" aria-hidden="true"><i class="ag-pkt"></i></span><span class="ag-tr-res">${esc(res)}</span></li>`).join('');
  const rows = $$('.ag-tr', list);
  const setMeters = done => {
    wal.textContent = done ? '350 bytes' : '268 bytes';
    store.textContent = done ? '3 nodes, 1 edge' : '2 nodes, 1 edge';
    wal.classList.toggle('is-up', done); store.classList.toggle('is-up', done);
  };
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-try', 'is-done')); setMeters(false); ids.classList.add('is-off'); },
    final() { rows.forEach(r => { r.classList.remove('is-try'); r.classList.add('in', 'is-done'); }); setMeters(true); ids.classList.remove('is-off'); },
    async play(me) {
      await wait(350, me);
      for (const r of rows) {
        r.classList.add('in');
        await wait(220, me);
        r.classList.add('is-try');
        await wait(r.dataset.kind === 'ok' ? 650 : 420, me);
        r.classList.remove('is-try');
        r.classList.add('is-done');
        if (r.dataset.kind === 'ok') setMeters(true);
        else { wal.classList.add('is-ping'); await wait(60, me); wal.classList.remove('is-ping'); }
        await wait(r.dataset.kind === 'ok' ? 600 : 380, me);
      }
      ids.classList.remove('is-off');
    }
  });
})();

/* The log file, drawn byte by byte. Used by stages 3 and 6. */
const MAXB = 252;
function makeTape(svg, hatchId) {
  let st = { recs: [] };
  const content = svgEl('g');
  const scan = svgEl('line', { class: 'ag-scan' });
  svg.append(content, scan);
  let W = 0, H = 104;
  const TOP = 30, TH = 40;
  const bx = b => 4 + (b / MAXB) * (W - 8);
  function text(cls, x, y, s, anchor = 'middle') {
    const t = svgEl('text', { class: cls, x: r1(x), y, 'text-anchor': anchor });
    t.textContent = s;
    content.appendChild(t);
    return t;
  }
  function render() {
    W = Math.max(280, Math.round(svg.getBoundingClientRect().width));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    content.replaceChildren();
    const defs = svgEl('defs');
    defs.innerHTML = `<pattern id="${hatchId}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="ag-hatch-bg" width="6" height="6"/><line class="ag-hatch-ln" x1="0" y1="0" x2="0" y2="6"/></pattern>`;
    content.appendChild(defs);
    content.appendChild(svgEl('line', { class: 'ag-axis', x1: bx(0), x2: bx(MAXB), y1: TOP + TH + 6, y2: TOP + TH + 6 }));
    const ticks = new Set([0]);
    for (const r of st.recs) {
      if (r.state === 'gone') continue;
      const end = r.off + 8 + r.len;
      if (r.state !== 'ghost') { ticks.add(r.off); ticks.add(end); }
      const g = svgEl('g', { class: `ag-rec is-${r.state}${r.grow ? ' is-grow' : ''}` });
      const pay = svgEl('rect', { class: 'ag-pay', x: r1(bx(r.off + 8)), y: TOP, width: r1(Math.max(1, bx(end) - bx(r.off + 8))), height: TH });
      // Inline, so it beats the stylesheet's fill for the solid states.
      if (r.state === 'wr' || r.state === 'back' || r.state === 'syncbad') pay.style.fill = `url(#${hatchId})`;
      g.appendChild(pay);
      g.appendChild(svgEl('rect', { class: 'ag-head', x: r1(bx(r.off)), y: TOP, width: r1(Math.max(2, bx(r.off + 8) - bx(r.off))), height: TH }));
      content.appendChild(g);
      r.grow = false;
      const cx = (bx(r.off) + bx(end)) / 2;
      const top = r.top ?? `tx ${r.tx}`;
      if (top) text(`ag-t ag-top${r.check === 'bad' ? ' is-bad' : r.check === 'ok' ? ' is-ok' : ''}`, cx, TOP - 9, top);
      if (r.name && r.state !== 'ghost') {
        const t = text('ag-t ag-name', bx(r.off + 8) + 5, TOP + TH / 2 + 4, r.name, 'start');
        if (t.getComputedTextLength() > bx(end) - bx(r.off + 8) - 9) t.remove();
      }
    }
    if (st.cut) {
      content.appendChild(svgEl('rect', { class: 'ag-cutbox', x: r1(bx(st.cut[0])), y: TOP, width: r1(bx(st.cut[1]) - bx(st.cut[0])), height: TH }));
    }
    if (st.junk) {
      content.appendChild(svgEl('rect', { class: 'ag-junk', x: r1(bx(st.junk[0])), y: TOP, width: r1(bx(st.junk[1]) - bx(st.junk[0])), height: TH }));
      ticks.add(st.junk[1]);
    }
    if (st.flip != null) {
      const fx = bx(st.flip);
      content.appendChild(svgEl('line', { class: 'ag-flip', x1: r1(fx), x2: r1(fx), y1: TOP - 2, y2: TOP + TH + 2 }));
      content.appendChild(svgEl('path', { class: 'ag-flip-mk', d: `M${r1(fx - 5)} ${TOP + TH + 14}L${r1(fx)} ${TOP + TH + 7}L${r1(fx + 5)} ${TOP + TH + 14}Z` }));
    }
    if (st.trunc != null) {
      const tx = bx(st.trunc);
      content.appendChild(svgEl('line', { class: 'ag-trunc', x1: r1(tx), x2: r1(tx), y1: TOP - 20, y2: TOP + TH + 10 }));
      ticks.add(st.trunc);
    }
    if (st.refused) content.appendChild(svgEl('rect', { class: 'ag-refused', x: r1(bx(0) - 3), y: TOP - 3, width: r1(bx(st.refused) - bx(0) + 6), height: TH + 6 }));
    let lastX = -99;
    [...ticks].sort((a, b) => a - b).forEach(b => {
      const x = bx(b);
      content.appendChild(svgEl('line', { class: 'ag-tick', x1: r1(x), x2: r1(x), y1: TOP + TH + 3, y2: TOP + TH + 10 }));
      if (x - lastX < 26) return;
      lastX = x;
      text(`ag-t ag-tk${b === st.trunc ? ' is-bad' : ''}`, x, TOP + TH + 26, String(b));
    });
    placeScan();
  }
  function placeScan() {
    const on = st.scan != null;
    scan.classList.toggle('is-on', on);
    const x = bx(on ? st.scan : 0);
    scan.setAttribute('x1', 0); scan.setAttribute('x2', 0);
    scan.setAttribute('y1', TOP - 4); scan.setAttribute('y2', TOP + TH + 4);
    scan.style.transform = `translateX(${r1(x)}px)`;
  }
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  return {
    set(next) { st = next; render(); },
    get: () => st,
    render,
    scanTo(b) { st.scan = b; placeScan(); }
  };
}

/* The three single-node commits: header bytes and sizes read back from the log */
const RECS = [
  { tx: 1, name: 'Ada Lovelace', off: 0, len: 71, hdr: ['47 00 00 00', '8a fd bf 11'], crc: '0x11bffd8a' },
  { tx: 2, name: 'Charles Babbage', off: 79, len: 74, hdr: ['4a 00 00 00', '15 ca fa 98'], crc: '0x98faca15' },
  { tx: 3, name: 'Mary Somerville', off: 161, len: 74, hdr: ['4a 00 00 00', '88 77 53 8b'], crc: '0x8b537788' }
];
const rec = (i, extra = {}) => ({ ...RECS[i], ...extra });

/* 3. The hold line: write one record, fsync, then say yes */
(() => {
  const el = $('#d-log'), steps = $$('#ag-pipe li'), log = $('#ag-vlog'), verdict = $('#ag-verdict');
  const hdr = $('#ag-hdr'), hTx = $('.ag-hdr-tx', hdr), hBytes = $$('.ag-bytes i', hdr), hSay = $('.ag-hdr-say', hdr);
  const mWal = $('#ag-l-wal'), mStore = $('#ag-l-store');
  const tape = makeTape($('#ag-tape'), 'ag-hatch-a');
  const OKL = [
    'commit "Ada Lovelace" -> {"txId":1}   store={"nodeCount":1,"edgeCount":0} wal=79B fsyncs=1',
    'commit "Charles Babbage" -> {"txId":2}   store={"nodeCount":2,"edgeCount":0} wal=161B fsyncs=2',
    'commit "Mary Somerville" -> {"txId":3}   store={"nodeCount":3,"edgeCount":0} wal=243B fsyncs=3'
  ];
  const FAULT = {
    write: {
      head: '== write fails once ==',
      first: 'commit 1 ok                      store={"nodeCount":1,"edgeCount":0} wal=79B',
      rej: ['commit "Charles Babbage" rejected: EIO: injected write failure   store={"nodeCount":1,"edgeCount":0} wal=79B',
        'commit "Mary Somerville" rejected: EIO: injected write failure   store={"nodeCount":1,"edgeCount":0} wal=79B'],
      tail: ['on disk: 1 whole frames, 0 trailing bytes', 'reopen -> Ada Lovelace']
    },
    sync: {
      head: '== sync fails once ==',
      first: 'commit 1 ok                      store={"nodeCount":1,"edgeCount":0} wal=79B',
      rej: ['commit "Charles Babbage" rejected: EIO: injected sync failure   store={"nodeCount":1,"edgeCount":0} wal=161B',
        'commit "Mary Somerville" rejected: EIO: injected sync failure   store={"nodeCount":1,"edgeCount":0} wal=161B'],
      tail: ['on disk: 2 whole frames, 0 trailing bytes', 'reopen -> Ada Lovelace, Charles Babbage']
    }
  };
  const VERDICT = {
    ok: 'Each yes came only after its own record was fsynced: three commits, three records, 243 bytes.',
    write: 'The write failed, so the commit was rejected and nothing reached the file. The next commit was refused too, with the disk healthy again, because the writer stops until the database is reopened. After the reopen: Ada Lovelace only.',
    sync: 'The bytes reached the file but the fsync failed, so the caller was told no. After a reopen, Charles Babbage is there anyway. A commit rejected at this step has an unknown outcome; it was not rolled back.'
  };
  let scn = 'ok';
  const say = (cls, text) => { log.appendChild(lineEl(cls, text)); log.scrollTop = log.scrollHeight; };
  const clearSteps = () => steps.forEach(s => s.classList.remove('is-active', 'is-pass', 'is-fail'));
  const setHdr = (r, shown) => {
    hTx.textContent = r ? `Record for tx ${r.tx}` : 'Next record';
    hBytes[0].textContent = r && shown ? r.hdr[0] : '-- -- -- --';
    hBytes[1].textContent = r && shown ? r.hdr[1] : '-- -- -- --';
    hSay.textContent = r && shown ? `length ${r.len}, CRC-32 ${r.crc}, then ${r.len} payload bytes` : 'header: length, then CRC-32, little-endian';
  };
  const meters = (wal, store) => { mWal.textContent = `${wal} bytes`; mStore.textContent = store; };
  async function step(i, me, ms = 330) { steps[i].classList.add('is-active'); await wait(ms, me); steps[i].classList.remove('is-active'); steps[i].classList.add('is-pass'); }
  async function failStep(i, me) { steps[i].classList.add('is-active'); await wait(420, me); steps[i].classList.remove('is-active'); steps[i].classList.add('is-fail'); }
  const recs = [];
  const draw = () => tape.set({ recs });
  async function commitOne(i, me, line, storeTxt) {
    clearSteps();
    setHdr(RECS[i], false);
    await step(0, me);
    setHdr(RECS[i], true);
    await step(1, me);
    steps[2].classList.add('is-active');
    recs.push(rec(i, { state: 'wr', grow: true, top: `tx ${i + 1}` }));
    draw();
    meters(RECS[i].off + 8 + RECS[i].len, mStore.textContent);
    await wait(450, me);
    steps[2].classList.remove('is-active'); steps[2].classList.add('is-pass');
    await step(3, me, 420);
    recs[i].state = 'dur'; draw();
    await step(4, me, 260);
    recs[i].top = `yes, tx ${i + 1}`; draw();
    await step(5, me, 260);
    meters(RECS[i].off + 8 + RECS[i].len, storeTxt);
    say('', line);
    await wait(380, me);
  }
  const nodes = n => `${n} node${n === 1 ? '' : 's'}`;
  const SCN = {
    ok: async me => {
      for (let i = 0; i < 3; i++) await commitOne(i, me, OKL[i], nodes(i + 1));
      say('dim', 'file size=243 validBytes=243 trailing=0');
    },
    write: async me => fault('write', me),
    sync: async me => fault('sync', me)
  };
  async function fault(kind, me) {
    const F = FAULT[kind];
    say('dim', '# fault injected: the log file\'s ' + (kind === 'write' ? 'write' : 'fsync') + ' fails once');
    say('dim', F.head);
    await commitOne(0, me, F.first, '1 node');
    clearSteps(); setHdr(RECS[1], false);
    await step(0, me); setHdr(RECS[1], true); await step(1, me);
    if (kind === 'write') {
      await failStep(2, me);
      recs.push(rec(1, { state: 'ghost', top: 'rejected', check: 'bad' })); draw();
    } else {
      steps[2].classList.add('is-active');
      recs.push(rec(1, { state: 'wr', grow: true })); draw();
      meters(161, '1 node');
      await wait(450, me);
      steps[2].classList.remove('is-active'); steps[2].classList.add('is-pass');
      await failStep(3, me);
      recs[1].state = 'syncbad'; recs[1].top = 'rejected'; recs[1].check = 'bad'; draw();
    }
    say('err', F.rej[0]);
    await wait(700, me);
    clearSteps(); setHdr(RECS[2], false);
    await step(0, me);
    await failStep(2, me);
    hSay.textContent = 'the writer has stopped: refused before framing';
    say('err', F.rej[1]);
    await wait(800, me);
    say('dim', F.tail[0]);
    await wait(500, me);
    say('ok', F.tail[1]);
    if (kind === 'sync') { recs[1].state = 'back'; recs[1].top = 'back after reopen'; recs[1].check = null; draw(); meters(161, '2 nodes after reopen'); }
    else meters(79, '1 node after reopen');
  }
  const resetView = () => {
    clearSteps(); log.replaceChildren(); verdict.textContent = ''; verdict.className = 'ag-verdict';
    recs.length = 0; draw(); setHdr(null, false); meters(0, '0 nodes');
  };
  const showVerdict = () => { verdict.textContent = VERDICT[scn]; verdict.className = `ag-verdict is-${scn}`; };
  const finalView = () => {
    resetView();
    if (scn === 'ok') {
      RECS.forEach((r, i) => recs.push(rec(i, { state: 'dur', top: `yes, tx ${i + 1}` })));
      steps.forEach(s => s.classList.add('is-pass'));
      OKL.forEach(l => say('', l)); say('dim', 'file size=243 validBytes=243 trailing=0');
      setHdr(RECS[2], true); meters(243, '3 nodes');
    } else {
      const F = FAULT[scn];
      recs.push(rec(0, { state: 'dur', top: 'yes, tx 1' }));
      recs.push(scn === 'write' ? rec(1, { state: 'ghost', top: 'rejected', check: 'bad' }) : rec(1, { state: 'back', top: 'back after reopen' }));
      [0, 1].forEach(i => steps[i].classList.add('is-pass'));
      if (scn === 'write') steps[2].classList.add('is-fail'); else { steps[2].classList.add('is-pass'); steps[3].classList.add('is-fail'); }
      say('dim', '# fault injected: the log file\'s ' + (scn === 'write' ? 'write' : 'fsync') + ' fails once');
      [F.head, F.first].forEach(l => say(l === F.head ? 'dim' : '', l));
      F.rej.forEach(l => say('err', l));
      say('dim', F.tail[0]); say('ok', F.tail[1]);
      setHdr(RECS[1], true);
      meters(scn === 'write' ? 79 : 161, scn === 'write' ? '1 node after reopen' : '2 nodes after reopen');
    }
    draw();
    showVerdict();
  };
  const d = demo(el, { reset: resetView, final: finalView, play: async me => { await SCN[scn](me); await wait(300, me); showVerdict(); } });
  const choose = name => { scn = name; $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.scn === name))); };
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { choose(b.dataset.scn); d.start(); }));
  d.prepare = () => choose('ok');
})();

/* 4. Apply, then publish: one commit's events in order */
(() => {
  const el = $('#d-apply'), list = $('#ag-tl');
  const mS = $('#ag-a-store'), mW = $('#ag-a-wal'), mF = $('#ag-a-sync');
  const Z = ['0 nodes, 0 edges', '0 bytes', '0'], D = ['0 nodes, 0 edges', '200 bytes', '1'], A = ['2 nodes, 1 edge', '200 bytes', '1'];
  const TL = [
    ['0.1 ms', 'transact() called', Z],
    ['1.7 ms', 'callback staged 3 ops', Z],
    ['2.2 ms', 'wal.append(192 bytes) called', Z],
    ['7.6 ms', 'wal.append resolved (written + fsynced)', D],
    ['8.1 ms', 'subscriber gets txId 1: createNode, createNode, createEdge', A],
    ['8.2 ms', 'transact() resolved {"txId":1}', A]
  ];
  list.innerHTML = TL.map(([t, ev], i) =>
    `<li class="ag-ev${i > 3 ? ' is-air' : ''}"><time>${t}</time><span>${esc(ev)}</span></li>` +
    (i === 3 ? '<li class="ag-tl-line" aria-hidden="true"><i></i><span>The log said yes</span></li>' : '')).join('');
  const evs = $$('.ag-ev', list), bar = $('.ag-tl-line', list);
  const set = v => { [mS, mW, mF].forEach((m, k) => { if (m.textContent !== v[k]) { m.textContent = v[k]; m.classList.remove('is-up'); void m.offsetWidth; m.classList.add('is-up'); } }); };
  demo(el, {
    reset() { evs.forEach(e => e.classList.remove('in')); bar.classList.remove('in'); [mS, mW, mF].forEach(m => m.classList.remove('is-up')); [mS.textContent, mW.textContent, mF.textContent] = Z; },
    final() { evs.forEach(e => e.classList.add('in')); bar.classList.add('in'); [mS.textContent, mW.textContent, mF.textContent] = A; },
    async play(me) {
      await wait(400, me);
      for (let i = 0; i < TL.length; i++) {
        evs[i].classList.add('in');
        set(TL[i][2]);
        await wait(i === 3 ? 700 : 520, me);
        if (i === 3) { bar.classList.add('in'); await wait(800, me); }
      }
    }
  });
})();

/* 5. Checkpoint: the data directory before, during and after */
(() => {
  const el = $('#d-snap'), stepEl = $('#ag-step'), wal2 = $('#ag-wal2');
  const files = Object.fromEntries($$('.ag-file', el).map(f => [f.dataset.f, f]));
  $$('.ag-recs[data-n]', el).forEach(r => { r.innerHTML = '<i></i>'.repeat(+r.dataset.n); });
  const reopen = $$('#ag-reopen > span');
  const STEPS = [
    '$ ls data/   # 1 index tx + 3 data tx',
    '$ ls data/   # after db.checkpoint()',
    '$ ls data/   # 2 more tx after the checkpoint',
    'wal-000002.log holds 2 frames'
  ];
  const show = (k, on) => files[k].classList.toggle('is-off', !on);
  const fill = (k, n) => $$('.ag-recs i', files[k]).forEach((b, i) => b.classList.toggle('in', i < n));
  demo(el, {
    reset() {
      stepEl.textContent = STEPS[0];
      show('wal1', true); files.wal1.classList.remove('is-gone'); fill('wal1', 0);
      show('snap', false); show('wal2', false); fill('wal2', 0); wal2.textContent = '0 B';
      reopen.forEach(l => l.classList.add('is-off'));
    },
    final() {
      stepEl.textContent = STEPS[3];
      show('wal1', false); show('snap', true); show('wal2', true); fill('wal2', 2); wal2.textContent = '184 B';
      reopen.forEach(l => l.classList.remove('is-off'));
    },
    async play(me) {
      await wait(400, me);
      for (let i = 1; i <= 4; i++) { fill('wal1', i); await wait(260, me); }
      await wait(700, me);
      stepEl.textContent = STEPS[1];
      show('snap', true);
      await wait(500, me);
      files.wal1.classList.add('is-gone');
      show('wal2', true);
      await wait(800, me);
      show('wal1', false);
      await wait(400, me);
      stepEl.textContent = STEPS[2];
      for (let i = 1; i <= 2; i++) { fill('wal2', i); await wait(320, me); }
      wal2.textContent = '184 B';
      await wait(700, me);
      stepEl.textContent = STEPS[3];
      for (const l of reopen) { l.classList.remove('is-off'); await wait(420, me); }
    }
  });
})();

/* 6. Recovery: five kills, then a damaged log read back */
(() => {
  const el = $('#d-recover'), kills = $('#ag-kills'), sayEl = $('#ag-dmg-say'), out = $('#ag-rout');
  const KILLS = [[1, 989, 195, 196], [2, 974, 209, 210], [3, 650, 39, 40], [4, 723, 90, 91], [5, 512, 71, 72]];
  kills.innerHTML = KILLS.map(([n, ms, a, r]) =>
    `<li class="ag-kill"><span class="ag-kill-h">Run ${n}<small>killed after ${ms} ms</small></span><span class="ag-kbar"><i class="ag-ack" style="--w:${r1(a / 210 * 100)}%"></i><i class="ag-got" style="--w:${r1(r / 210 * 100)}%"></i></span><span class="ag-kill-n">${a} acked<br><b>${r} back</b></span></li>`).join('');
  const krows = $$('.ag-kill', kills);
  const tape = makeTape($('#ag-tape2'), 'ag-hatch-b');
  const HEAD = 'clean WAL: 243 bytes, frames at offsets 0 (+8+71), 79 (+8+74), 161 (+8+74)';
  const CLEAN = () => RECS.map((r, i) => rec(i, { state: 'dur' }));
  const D = {
    torn: {
      say: 'The last 5 bytes of record 3 are cut off, as if the write had stopped part way. Its header still promises 74 payload bytes.',
      lines: ['[torn last frame] cut the last 5 bytes off frame 3 (simulated torn write)',
        ['warn', '  console.warn: [atlas] recovery: truncated corrupt WAL tail of segment 1 at byte 161'],
        ['ok', '  WAL 238 -> 161 bytes; recovered 2 nodes: Ada Lovelace, Charles Babbage']],
      damage: s => { s.recs[2].len = 69; s.cut = [238, 243]; },
      checks: ['ok', 'ok', 'bad'], trunc: 161, drop: [2]
    },
    junk: {
      say: 'Six stray bytes after record 3: the start of a header whose write never finished.',
      lines: ['[junk after last frame] appended 6 bytes of a header that was never completed',
        ['warn', '  console.warn: [atlas] recovery: truncated corrupt WAL tail of segment 1 at byte 243'],
        ['ok', '  WAL 249 -> 243 bytes; recovered 3 nodes: Ada Lovelace, Charles Babbage, Mary Somerville']],
      damage: s => { s.junk = [243, 249]; },
      checks: ['ok', 'ok', 'ok'], trunc: 243, drop: [], junk: true
    },
    flip: {
      say: 'One bit flipped inside record 2, at byte 97. Its CRC no longer matches, and recovery cannot tell this from a torn tail.',
      lines: ['[bit flip in frame 2] flipped one bit inside frame 2\'s payload (byte 97)',
        ['warn', '  console.warn: [atlas] recovery: truncated corrupt WAL tail of segment 1 at byte 79'],
        ['ok', '  WAL 243 -> 79 bytes; recovered 1 nodes: Ada Lovelace']],
      damage: s => { s.flip = 97; },
      checks: ['ok', 'bad'], trunc: 79, drop: [1, 2], note: 'Record 3 was intact and is dropped with it.'
    },
    gap: {
      say: 'Record 2 is spliced out. Records 1 and 3 are intact, with valid CRCs, but transaction 2 is missing.',
      lines: ['[frame 2 removed] spliced frame 2 out; frames 1 and 3 are intact with valid CRCs',
        ['err', '  openDatabase threw AtlasError WAL_CORRUPT: WAL replay: expected txId 2 but found 3 in segment 1']],
      damage: s => { s.recs[1].state = 'gone'; s.recs[2].off = 79; },
      checks: ['ok', 'bad'], refuse: true
    }
  };
  let dmg = 'torn', skipKills = false;
  const choose = k => { dmg = k; $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dmg === k))); };
  const killsFinal = on => krows.forEach(r => r.classList.toggle('in', on));
  const outLine = l => { const [c, t] = Array.isArray(l) ? l : ['', l]; out.appendChild(lineEl(c, t)); };
  const live = recs => recs.filter(r => r.state !== 'gone');
  function applyDamage(s) { D[dmg].damage(s); return s; }
  function settle(s) {
    const c = D[dmg];
    const order = live(s.recs);
    c.checks.forEach((k, i) => { order[i].check = k; order[i].top = `tx ${order[i].tx} ${k === 'ok' ? '✓' : '✗'}`; });
    if (c.refuse) { s.refused = 161; order[1].top = `tx 3, not 2 ✗`; }
    if (c.trunc != null) s.trunc = c.trunc;
    (c.drop || []).forEach(i => { const r = s.recs[i]; r.state = 'drop'; r.top = r.check === 'bad' ? `tx ${r.tx} ✗` : 'intact, dropped'; });
    if (c.junk) s.junk = null;
    if (dmg === 'torn') s.cut = null;
    s.scan = null;
    return s;
  }
  function finalTape() {
    const s = settle(applyDamage({ recs: CLEAN() }));
    tape.set(s);
    out.replaceChildren(); outLine(['dim', HEAD]); D[dmg].lines.forEach(outLine);
    if (D[dmg].note) outLine(['dim', '# ' + D[dmg].note]);
    sayEl.textContent = D[dmg].say;
  }
  async function playTape(me) {
    const c = D[dmg];
    sayEl.textContent = c.say;
    out.replaceChildren(); outLine(['dim', HEAD]);
    const s = { recs: CLEAN() };
    tape.set(s);
    await wait(600, me);
    applyDamage(s); tape.set(s);
    await wait(900, me);
    outLine(c.lines[0]);
    const order = live(s.recs);
    s.scan = 0; tape.set(s);
    await wait(300, me);
    for (let i = 0; i < c.checks.length; i++) {
      const r = order[i];
      tape.scanTo(r.off + 8 + r.len);
      await wait(520, me);
      r.check = c.checks[i];
      r.top = `tx ${r.tx} ${c.checks[i] === 'ok' ? '✓' : '✗'}`;
      if (c.refuse && i === 1) r.top = 'tx 3, not 2 ✗';
      tape.set(s);
      await wait(320, me);
    }
    if (c.junk) { tape.scanTo(249); await wait(520, me); }
    await wait(300, me);
    tape.set(settle(s));
    for (const l of c.lines.slice(1)) { outLine(l); await wait(450, me); }
    if (c.note) outLine(['dim', '# ' + c.note]);
  }
  const d = demo(el, {
    reset() { killsFinal(false); tape.set({ recs: CLEAN() }); out.replaceChildren(); sayEl.textContent = D[dmg].say; },
    final() { killsFinal(true); finalTape(); },
    async play(me) {
      if (skipKills) { killsFinal(true); skipKills = false; }
      else {
        await wait(300, me);
        for (const r of krows) { r.classList.add('in'); await wait(260, me); }
        await wait(700, me);
      }
      await playTape(me);
    }
  });
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { choose(b.dataset.dmg); skipKills = !reduce.matches; d.start(); }));
  d.prepare = () => choose('torn');
})();
