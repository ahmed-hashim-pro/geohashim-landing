/* Hero terminal: real README output */
const Q_FLAG = 'A Meridian-3 has stopped reporting. How long will it keep working, which telemetry field tells me how long it has been offline, and what does it do when that window expires?';
const files = [['api-reference.md', 10], ['faq.md', 10], ['onboarding-guide.md', 9], ['product-specs.md', 9], ['support-runbook.md', 6]];
const SCENES = {
  index: [
    ['cmd', 'rag ingest sample_corpus'],
    ['dim', 'Indexing sample_corpus into chroma_db …'],
    ...files.map(([f, n]) => ['out', `  + sample_corpus/${f}: ${n} chunks (indexed)`]),
    ['out', ''], ['out', '5 file(s): 5 indexed, 0 updated, 0 unchanged, 0 failed.'], ['ok', 'Collection now holds 44 chunks.'], ['out', ''],
    ['cmd', 'rag ingest sample_corpus'],
    ['dim', 'Indexing sample_corpus into chroma_db …'],
    ...files.map(([f, n]) => ['dim', `  = sample_corpus/${f}: ${n} chunks (unchanged)`]),
    ['out', ''], ['out', '5 file(s): 0 indexed, 0 updated, 5 unchanged, 0 failed.'], ['ok', 'Collection now holds 44 chunks.']
  ],
  refuse: [
    ['cmd', 'rag ask "How do I submit an expense report for travel?"'],
    ['out', "I don't know — the indexed documents don't contain enough relevant information to answer that."],
    ['out', ''], ['out', 'Confidence: low'], ['out', ''],
    ['cmd', 'rag ask "How do I submit an expense report for travel?" 2>&1 >/dev/null'],
    ['err', 'note: refused locally — no chunk cleared the 0.35 similarity floor, so no model call was made.'], ['out', ''],
    ['cmd', 'rag ask --json "How do I submit an expense report for travel?"'],
    ['out', '{'],
    ['out', '  "answer": "I don\'t know — the indexed documents don\'t contain enough relevant information to answer that.",'],
    ['out', '  "citations": [],'], ['out', '  "confidence": "low"'], ['out', '}']
  ],
  answer: [
    ['cmd', `rag ask --show-sources \\\n    "${Q_FLAG}"`],
    ['out', 'Here is a complete answer drawn from the supplied documents:'], ['out', ''],
    ['out', '**How long it keeps working**'],
    ['out', 'A Meridian-3 continues executing its buffered task queue for up to **12 minutes** after losing its network link — this is the offline autonomy window, fixed in firmware and not configurable. [sample_corpus/product-specs.md:Acme Robotics — Product Specifications > Meridian-3 Autonomous Mobile Robot > Offline Autonomy]'],
    ['out', ''], ['out', '**The telemetry field to watch**'],
    ['out', 'The field `offline_seconds` counts up from the moment of the last successful report. Watch this value against the 12-minute window; when it crosses that threshold, a safe-park has almost certainly occurred. [sample_corpus/api-reference.md:Fleet Control API Reference > Fleet Telemetry > GET /robots/{robot_id}/telemetry]'],
    ['out', ''], ['cut', '[two more cited paragraphs, shown in full further down]'], ['out', ''],
    ['out', 'Sources:'],
    ['dim', '  - sample_corpus/faq.md:Frequently Asked Questions > Fleet Operations > What happens during a network outage?  (score 0.603)'],
    ['dim', '  - sample_corpus/product-specs.md:Acme Robotics — Product Specifications > Meridian-3 Autonomous Mobile Robot > Offline Autonomy  (score 0.532)'],
    ['dim', '  - sample_corpus/support-runbook.md:Support Runbook > Many Robots Offline at Once  (score 0.501)'],
    ['dim', '  - sample_corpus/support-runbook.md:Support Runbook > Single Robot Offline  (score 0.427)'],
    ['dim', '  - sample_corpus/api-reference.md:Fleet Control API Reference > Fleet Telemetry > GET /robots/{robot_id}/telemetry  (score 0.406)'],
    ['out', ''], ['ok', 'Confidence: high']
  ]
};
PAGE.terminal = { scenes: SCENES, order: ['refuse', 'answer', 'index'], first: 'refuse' };

/* Passing tests per file, from pytest --collect-only */
PAGE.tests = [['tests/test_retrieve.py', 33, 'var(--blue)'], ['tests/test_agent.py', 31, 'var(--magenta)'], ['tests/test_lexical.py', 20, 'var(--water)'], ['tests/test_ingest.py', 14, 'var(--green)'], ['tests/test_chunking.py', 11, 'var(--ink-2)']];

/* Measured data: per-question best support from scripts/calibrate.py, re-run offline */
const PROBES = /*@@DATA:probes@@*/;
const FLOOR = 0.35;

const FILE = {
  'faq.md': 'var(--f-faq)', 'product-specs.md': 'var(--f-specs)', 'support-runbook.md': 'var(--f-runbook)',
  'api-reference.md': 'var(--f-api)', 'onboarding-guide.md': 'var(--f-onb)'
};

/* 1. Chunking */
(() => {
  const el = $('#d-chunk'), list = $('.chunks', el), cks = $$('.ck', el), lines = $$('#chunk-term > span');
  demo(el, {
    reset() { list.classList.add('is-doc'); cks.forEach(c => c.classList.remove('is-cut')); lines.forEach(l => l.classList.add('is-off')); },
    final() { list.classList.remove('is-doc'); cks.forEach(c => c.classList.remove('is-cut')); lines.forEach(l => l.classList.remove('is-off')); },
    async play(me) {
      await wait(600, me);
      for (const c of cks.slice(1)) { c.classList.add('is-cut'); await wait(130, me); }
      await wait(350, me);
      list.classList.remove('is-doc');
      cks.forEach(c => c.classList.remove('is-cut'));
      await wait(1100, me);
      for (const [i, l] of lines.entries()) { l.classList.remove('is-off'); await wait(i === 1 ? 900 : 420, me); }
    }
  });
})();

/* 2. Indexing */
(() => {
  const el = $('#d-index');
  const files = [['api-reference.md', 10], ['faq.md', 10], ['onboarding-guide.md', 9], ['product-specs.md', 9], ['support-runbook.md', 6]];
  $('#ix-files').innerHTML = files.map(([f, n]) => `<span><i class="sw" style="--c:${FILE[f]}"></i>${f} <b>${n}</b></span>`).join('');
  const grids = $$('.ix-grid', el);
  grids.forEach(g => {
    g.innerHTML = files.map(([f, n]) => Array.from({ length: n }, () => `<i class="tile" style="--c:${FILE[f]}"></i>`).join('')).join('');
  });
  const pairs = $$('.tile', grids[0]).map((t, i) => [t, $$('.tile', grids[1])[i]]);
  const count = $('#ix-count');
  demo(el, {
    reset() { grids.forEach(g => g.classList.add('is-empty')); pairs.flat().forEach(t => t.classList.remove('in')); count.textContent = '0 of 44 chunks indexed'; },
    final() { grids.forEach(g => g.classList.remove('is-empty')); pairs.flat().forEach(t => t.classList.add('in')); count.textContent = '44 of 44 chunks indexed'; },
    async play(me) {
      await wait(500, me);
      let k = 0;
      for (const [, n] of files) {
        for (let j = 0; j < n; j++, k++) {
          pairs[k][0].classList.add('in');
          pairs[k][1].classList.add('in');
          count.textContent = `${k + 1} of 44 chunks indexed`;
          await wait(34, me);
        }
        await wait(160, me);
      }
    }
  });
})();

/* 3. Retrieval and fusion: the step 3 question, ranked by each retriever */
(() => {
  const el = $('#d-fuse'), fuse = $('#fuse'), links = $('#fz-links');
  const VEC = [
    ['faq.md#1', 'faq.md', 'What happens during a network outage?', '0.603'],
    ['product-specs.md#4', 'product-specs.md', 'Offline Autonomy', '0.532'],
    ['support-runbook.md#1', 'support-runbook.md', 'Many Robots Offline at Once', '0.501'],
    ['support-runbook.md#2', 'support-runbook.md', 'Single Robot Offline', '0.417'],
    ['product-specs.md#1', 'product-specs.md', 'Meridian-3 Autonomous Mobile Robot', '0.407'],
    ['api-reference.md#3', 'api-reference.md', 'GET /robots/{robot_id}/telemetry', '0.406'],
    ['faq.md#8', 'faq.md', 'Can I use our existing Meridian-2 docks?', '0.395'],
    ['api-reference.md#8', 'api-reference.md', 'Webhooks', '0.356'],
    ['product-specs.md#3', 'product-specs.md', 'Power and Charging', '0.339'],
    ['faq.md#2', 'faq.md', 'Can I make robots keep working longer without a network?', '0.335']
  ];
  const BM = [
    ['faq.md#1', 'faq.md', 'What happens during a network outage?', '9.09'],
    ['support-runbook.md#2', 'support-runbook.md', 'Single Robot Offline', '5.97'],
    ['faq.md#2', 'faq.md', 'Can I make robots keep working longer without a network?', '5.22'],
    ['faq.md#7', 'faq.md', 'Does rotating an API key break running integrations?', '5.02'],
    ['api-reference.md#3', 'api-reference.md', 'GET /robots/{robot_id}/telemetry', '4.93'],
    ['support-runbook.md#3', 'support-runbook.md', 'Dock Fault', '4.62'],
    ['onboarding-guide.md#3', 'onboarding-guide.md', 'Local Setup', '4.19'],
    ['product-specs.md#4', 'product-specs.md', 'Offline Autonomy', '3.83'],
    ['support-runbook.md#1', 'support-runbook.md', 'Many Robots Offline at Once', '3.42'],
    ['faq.md#0', 'faq.md', 'Frequently Asked Questions', '3.23']
  ];
  const FUSED = [['faq.md#1', '0.0328', 1, 1], ['support-runbook.md#2', '0.0318', 4, 2], ['product-specs.md#4', '0.0308', 2, 8], ['api-reference.md#3', '0.0305', 6, 5], ['support-runbook.md#1', '0.0304', 3, 9]];
  const STAR = 'api-reference.md#3';
  const byId = Object.fromEntries([...VEC, ...BM].map(r => [r[0], r]));
  const inFused = new Set(FUSED.map(f => f[0]));
  const row = (rank, id, file, name, score, extra = '') =>
    `<li class="fz-row" data-id="${id}" style="--c:${FILE[file]}"><span class="fz-rank">${rank}</span><span class="fz-name"><small>${file}</small>${esc(name)}${extra}</span><span class="fz-score">${score}</span></li>`;
  $('[data-col="v"] ol', fuse).innerHTML = VEC.map((r, i) => row(i + 1, ...r)).join('');
  $('[data-col="b"] ol', fuse).innerHTML = BM.map((r, i) => row(i + 1, ...r)).join('');
  $('[data-col="f"] ol', fuse).innerHTML = FUSED.map(([id, rrf, v, b], i) =>
    row(i + 1, id, byId[id][1], byId[id][2], rrf, `<span class="fz-via">vector #${v} + BM25 #${b}</span>`)).join('');
  const rows = col => $$(`[data-col="${col}"] .fz-row`, fuse);
  const find = (col, id) => rows(col).find(r => r.dataset.id === id);
  let paths = [];
  function layoutLinks() {
    links.replaceChildren();
    paths = [];
    if (innerWidth < 900) return;
    links.setAttribute('viewBox', `0 0 ${fuse.offsetWidth} ${fuse.offsetHeight}`);
    // Offsets ignore the entry transforms, so lines land where the rows will settle.
    const rect = r => ({ left: r.offsetLeft, right: r.offsetLeft + r.offsetWidth, mid: r.offsetTop + r.offsetHeight / 2 });
    FUSED.forEach(([id], i) => {
      const f = rect(find('f', id));
      const fy = f.mid;
      const group = [];
      for (const col of ['v', 'b']) {
        const r = rect(find(col, id));
        const ry = r.mid;
        const x1 = col === 'v' ? r.right : r.left;
        const x2 = col === 'v' ? f.left : f.right;
        const mx = (x1 + x2) / 2;
        const d = `M${r1(x1)} ${r1(ry)}C${r1(mx)} ${r1(ry)} ${r1(mx)} ${r1(fy)} ${r1(x2)} ${r1(fy)}`;
        if (id === STAR) {
          const c = svgEl('path', { d, class: 'is-star' }), k = svgEl('path', { d, class: 'is-star-in' });
          links.append(c, k);
          group.push(c, k);
        } else {
          const p = svgEl('path', { d });
          links.appendChild(p);
          group.push(p);
        }
      }
      paths[i] = group;
    });
  }
  const all = () => $$('.fz-row', fuse);
  const finish = () => {
    all().forEach(r => {
      r.classList.add('in');
      r.classList.toggle('is-cut', r.closest('[data-col="f"]') === null && !inFused.has(r.dataset.id));
      r.classList.toggle('is-star', r.dataset.id === STAR);
    });
  };
  const hidePath = p => { const len = p.getTotalLength(); p.style.transition = 'none'; p.style.strokeDasharray = `${len} ${len}`; p.style.strokeDashoffset = String(len); };
  demo(el, {
    reset() {
      layoutLinks();
      el.classList.add('is-reset'); fuse.classList.add('is-reset');
      all().forEach(r => r.classList.remove('in', 'is-cut', 'is-star'));
    },
    final() {
      layoutLinks();
      el.classList.remove('is-reset'); fuse.classList.remove('is-reset');
      finish();
    },
    async play(me) {
      layoutLinks();
      paths.flat().forEach(hidePath);
      await wait(400, me);
      const v = rows('v'), b = rows('b');
      for (let i = 0; i < 10; i++) { v[i].classList.add('in'); b[i].classList.add('in'); await wait(55, me); }
      await wait(500, me);
      fuse.classList.remove('is-reset');
      const f = rows('f');
      for (let i = 0; i < FUSED.length; i++) {
        (paths[i] || []).forEach(p => drawPath(p, 650));
        await wait(420, me);
        f[i].classList.add('in');
        await wait(260, me);
      }
      await wait(350, me);
      finish();
      await wait(500, me);
      el.classList.remove('is-reset');
    }
  });
  let t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layoutLinks, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutLinks);
})();

/* 4. The gate: 19 probe questions against the floor */
(() => {
  const el = $('#d-gate'), plot = $('#plot'), svg = $('#gate-svg'), tip = $('#tip');
  const MODES = ['vector', 'bm25', 'hybrid'];
  const qs = [
    ...PROBES.on.map(([q, ...s]) => ({ q, on: true, s: { vector: s[0], bm25: s[1], hybrid: s[2] } })),
    ...PROBES.off.map(([q, ...s]) => ({ q, on: false, s: { vector: s[0], bm25: s[1], hybrid: s[2] } }))
  ];
  const HARD = qs.find(d => !d.on && /parental leave/.test(d.q));
  let mode = 'hybrid', W = 0, L = 0, R = 24, geo = null, userPicked = false;
  const fmt = v => v.toFixed(3);
  const signed = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(3);
  const stats = m => {
    const on = qs.filter(d => d.on).map(d => d.s[m]), off = qs.filter(d => !d.on).map(d => d.s[m]);
    const onMin = Math.min(...on), offMax = Math.max(...off);
    return { onMin, offMax, gap: onMin - offMax, fa: off.filter(v => v >= FLOOR).length, fr: on.filter(v => v < FLOOR).length, nOn: on.length, nOff: off.length };
  };
  $('#gate-table tbody').innerHTML = qs.map(d =>
    `<tr><td>${esc(d.q)}${d.on ? '' : ' <span class="tag-ill" style="border-style:solid">not in the documents</span>'}</td>` +
    MODES.map(m => `<td class="n${d.s[m] < FLOOR ? ' below' : ''}">${fmt(d.s[m])}</td>`).join('') + '</tr>').join('');

  function build() {
    W = Math.max(300, plot.clientWidth - 16);
    const wide = W >= 700;
    L = wide ? 176 : 12;
    const top = wide ? 40 : 58, LH = 108, GAP = wide ? 44 : 62;
    const lanes = [top, top + LH + GAP];
    const axisY = lanes[1] + LH + 16;
    const H = axisY + 34;
    const x = s => L + (s / .8) * (W - L - R);
    geo = { x, lanes, LH, wide, GAP };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('height', H);
    svg.replaceChildren();
    const fx = x(FLOOR);
    [['Answerable', '12 questions'], ['Not answerable', '7 questions']].forEach(([t, sub], i) => {
      svg.appendChild(svgEl('rect', { class: 'p-lane', x: L, y: lanes[i], width: W - L - R, height: LH }));
      if (wide) {
        const lab = svgEl('text', { class: 'p-lane-label', x: 0, y: lanes[i] + LH / 2 - 4 }); lab.textContent = t; svg.appendChild(lab);
        const s2 = svgEl('text', { class: 'p-lane-sub', x: 0, y: lanes[i] + LH / 2 + 14 }); s2.textContent = sub; svg.appendChild(s2);
      } else {
        const lab = svgEl('text', { class: 'p-lane-label', x: L, y: lanes[i] - 8 }); lab.textContent = t; svg.appendChild(lab);
      }
    });
    for (let s = 0; s <= .8001; s += .2) {
      const tx = x(s);
      svg.appendChild(svgEl('line', { class: 'p-axis', x1: tx, x2: tx, y1: axisY - 4, y2: axisY + 4 }));
      if (Math.abs(tx - x(FLOOR)) < 30) continue;
      const t = svgEl('text', { class: 'p-tick', x: tx, y: axisY + 20, 'text-anchor': 'middle' }); t.textContent = s.toFixed(1); svg.appendChild(t);
    }
    svg.appendChild(svgEl('line', { class: 'p-axis', x1: L, x2: W - R, y1: axisY, y2: axisY }));
    const zl = svgEl('text', { class: 'p-zone', x: fx - 22, y: wide ? 24 : 18, 'text-anchor': 'end' }); zl.textContent = wide ? 'Refused here, no API call' : 'Refused, no call'; svg.appendChild(zl);
    const zr = svgEl('text', { class: 'p-zone', x: fx + 22, y: wide ? 24 : 18 }); zr.textContent = 'Sent to the model'; svg.appendChild(zr);
    const hold = svgEl('g', { 'aria-hidden': 'true' });
    const y1 = top - 8, y2 = axisY;
    [-12, -5.5].forEach(o => hold.appendChild(svgEl('rect', { class: 'paint', x: fx + o, y: y1, width: 4.5, height: y2 - y1, 'stroke-width': 1.2 })));
    [1.5, 8].forEach(o => {
      for (let y = y1; y < y2; y += 13) hold.appendChild(svgEl('rect', { class: 'paint', x: fx + o, y, width: 4.5, height: Math.min(7, y2 - y), 'stroke-width': 1.2 }));
    });
    const fl = svgEl('text', { class: 'p-tick', x: fx, y: axisY + 20, 'text-anchor': 'middle', style: 'font-weight:700;fill:var(--ink)' }); fl.textContent = '0.35';
    svg.append(hold, fl);
    const gap = svgEl('g', { class: 'p-gap' });
    gap.innerHTML = '<rect width="1" height="1" style="transform-box:view-box;transform-origin:0 0"/><text text-anchor="middle"></text>';
    svg.appendChild(gap);
    geo.gap = gap;
    const note = svgEl('g', { class: 'p-note-g' });
    note.innerHTML = '<path class="p-note-line"/><text class="p-note"></text>';
    svg.appendChild(note);
    geo.note = note;
    qs.forEach((d, i) => {
      const g = svgEl('g', { class: `dot ${d.on ? 'on' : 'off'}`, tabindex: '0', role: 'img' });
      g.appendChild(svgEl('circle', { r: 9 }));
      g.addEventListener('pointerenter', () => showTip(d, g));
      g.addEventListener('pointerleave', hideTip);
      g.addEventListener('focus', () => showTip(d, g));
      g.addEventListener('blur', hideTip);
      d.g = g;
      d.i = i;
      svg.appendChild(g);
    });
    place(false);
  }
  function swarm(list, lane) {
    const placed = [];
    const offs = [0, -22, 22, -44, 44, -33, 33, -11, 11];
    list.slice().sort((a, b) => a.s[mode] - b.s[mode]).forEach(d => {
      const px = geo.x(d.s[mode]);
      const o = offs.find(o => !placed.some(p => p.o === o && Math.abs(p.x - px) < 19)) ?? 0;
      placed.push({ x: px, o });
      d.px = px;
      d.py = geo.lanes[lane] + geo.LH / 2 + o;
    });
  }
  function place(animate) {
    swarm(qs.filter(d => d.on), 0);
    swarm(qs.filter(d => !d.on), 1);
    qs.forEach(d => {
      d.g.style.transition = animate ? '' : 'none';
      d.g.style.transform = `translate(${r1(d.px)}px, ${r1(d.py)}px)`;
      const wrong = d.on ? d.s[mode] < FLOOR : d.s[mode] >= FLOOR;
      d.g.classList.toggle('is-wrong', wrong);
      d.g.setAttribute('aria-label', `${d.q} ${mode} score ${fmt(d.s[mode])}, ${d.s[mode] >= FLOOR ? 'sent to the model' : 'refused locally'}`);
      if (!animate) d.g.getBoundingClientRect();
      d.g.style.transition = '';
    });
    const st = stats(mode);
    const xa = geo.x(st.offMax), xb = geo.x(st.onMin);
    const gy = geo.lanes[0] + geo.LH + 6, gh = geo.GAP - 12;
    const [rect, text] = geo.gap.children;
    geo.gap.classList.toggle('is-neg', st.gap < 0);
    rect.style.transition = animate ? 'transform .9s cubic-bezier(.3, .8, .25, 1)' : 'none';
    rect.style.transform = `translate(${r1(Math.min(xa, xb))}px, ${gy}px) scale(${r1(Math.max(2, Math.abs(xb - xa)))}, ${gh})`;
    text.setAttribute('text-anchor', 'start');
    text.setAttribute('x', r1(Math.max(xa, xb) + 10));
    text.setAttribute('y', gy + gh / 2 + 4.5);
    text.textContent = geo.wide ? `${signed(st.gap)} separation` : signed(st.gap);
    const h = HARD, t = geo.note.lastChild;
    const ny = geo.wide ? geo.lanes[1] + 18 : geo.lanes[1] + geo.LH - 10;
    t.setAttribute('text-anchor', 'end');
    t.setAttribute('x', W - R - 4);
    t.setAttribute('y', ny);
    t.textContent = geo.wide ? 'Parental leave: caught by the second gate' : 'Second gate catches it';
    const tx0 = W - R - 4 - t.getComputedTextLength();
    geo.note.firstChild.setAttribute('d', `M${r1(h.px + 10)} ${r1(h.py)}L${r1(tx0 - 6)} ${ny - 4}`);
    for (const dd of $$('#gstats dd')) {
      const k = dd.dataset.k;
      if (k === 'onMin') dd.textContent = fmt(st.onMin);
      if (k === 'offMax') dd.textContent = fmt(st.offMax);
      if (k === 'gap') { dd.textContent = signed(st.gap); dd.className = st.gap < 0 ? 'is-neg' : 'is-pos'; }
      if (k === 'fa') dd.textContent = `${st.fa} of ${st.nOff}`;
      if (k === 'fr') { dd.textContent = `${st.fr} of ${st.nOn}`; dd.className = st.fr ? 'is-neg' : ''; }
    }
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  }
  function showTip(d, g) {
    const pr = plot.getBoundingClientRect(), gr = g.getBoundingClientRect();
    const s = d.s[mode];
    tip.innerHTML = `<b>${esc(d.q)}</b><span>vector ${fmt(d.s.vector)}, BM25 ${fmt(d.s.bm25)}, hybrid ${fmt(d.s.hybrid)}</span><span>${mode}: ${s >= FLOOR ? 'sent to the model' : 'refused locally, no API call'}</span>`;
    tip.classList.add('is-on');
    const tw = tip.offsetWidth;
    let left = gr.left - pr.left + gr.width / 2 - tw / 2;
    left = clamp(left, 0, pr.width - tw);
    tip.style.left = `${left}px`;
    tip.style.top = `${gr.top - pr.top - tip.offsetHeight - 10}px`;
  }
  function hideTip() { tip.classList.remove('is-on'); }
  const setMode = (m, animate = true) => { mode = m; place(animate); };
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { userPicked = true; setMode(b.dataset.mode); }));
  build();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });
  demo(el, {
    reset() { userPicked = false; qs.forEach(d => { d.g.style.opacity = '0'; }); setMode('vector', false); },
    final() { qs.forEach(d => { d.g.style.opacity = ''; }); setMode('hybrid', false); },
    async play(me) {
      await wait(300, me);
      for (const d of qs) { d.g.style.opacity = ''; await wait(45, me); }
      await wait(1900, me);
      if (!userPicked) setMode('bm25');
      await wait(2200, me);
      if (!userPicked) setMode('hybrid');
    }
  });
})();

/* 5. The envelope */
(() => {
  const el = $('#d-envelope'), pre = $('#envelope'), bar = $('#budget-bar'), used = $('#budget-used');
  const DOCS = [
    ['sample_corpus/faq.md', 'Frequently Asked Questions > Fleet Operations > What happens during a network outage?', '0.603', 292, 'Meridian-3 robots keep working from their on-board task buffer for the duration of the offline autonomy window, then safe-park and wait. …'],
    ['sample_corpus/support-runbook.md', 'Support Runbook > Single Robot Offline', '0.427', 231, '**Trigger:** one robot reports `link_state = offline` for more than two minutes. **Diagnosis.** Read its last telemetry. …'],
    ['sample_corpus/product-specs.md', 'Acme Robotics — Product Specifications > Meridian-3 Autonomous Mobile Robot > Offline Autonomy', '0.532', 274, 'Every Meridian-3 buffers its current task queue on board. If the robot loses its network link to Fleet Control it continues executing the buffered queue for up to **12 minutes**. …'],
    ['sample_corpus/api-reference.md', 'Fleet Control API Reference > Fleet Telemetry > GET /robots/{robot_id}/telemetry', '0.406', 308, 'Returns the current state of one robot. This is the endpoint to poll when you need to know whether a robot is reachable. …'],
    ['sample_corpus/support-runbook.md', 'Support Runbook > Many Robots Offline at Once', '0.501', 307, '**Trigger:** more than 20 % of a fleet reports `link_state = offline` within a two-minute span. …']
  ];
  const Q = 'A Meridian-3 has stopped reporting. How long will it keep working, which telemetry field tells me how long it has been offline, and what does it do when that window expires?';
  const at = (k, v) => `<span class="at">${k}=</span>"${esc(v)}"`;
  pre.innerHTML = '<span class="el">Retrieved documents:\n</span>' + DOCS.map(([src, h, sc, , body], i) =>
    `<span class="el"><span class="tg">&lt;document</span> ${at('index', String(i + 1))} ${at('source', src)} ${at('heading', h)} ${at('score', sc)}<span class="tg">&gt;</span>\n<span class="body">${esc(body)}</span>\n<span class="tg">&lt;/document&gt;</span>\n</span>`).join('') +
    `<span class="el">Answer this question using only the documents above, citing each claim as [source:heading].\n\n<span class="q">Question: ${esc(Q)}</span></span>`;
  bar.innerHTML = DOCS.map(([src, , , tok]) => `<span style="--c:${FILE[src.split('/')[1]]};width:${(tok / 6000) * 100}%"></span>`).join('');
  const els = $$('.el', pre), segs = $$('span', bar);
  segs.forEach(s => { s.dataset.w = s.style.width; });
  const mark = $('#esc-mark'), n = $('#esc-n'), say = $('#esc-say');
  const total = DOCS.reduce((a, d) => a + d[3], 0);
  const setEsc = safe => {
    mark.textContent = safe ? '<\\/document>' : '</document>';
    mark.classList.toggle('is-safe', safe);
    n.textContent = safe ? '1' : '2';
    say.style.visibility = safe ? 'visible' : 'hidden';
  };
  demo(el, {
    reset() {
      pre.classList.add('is-reset'); els.forEach(e => e.classList.remove('in'));
      segs.forEach(s => { s.style.width = '0'; });
      used.textContent = `0 of 6,000 estimated tokens`;
      setEsc(false);
    },
    final() {
      pre.classList.remove('is-reset'); els.forEach(e => e.classList.add('in'));
      segs.forEach(s => { s.style.width = s.dataset.w; });
      used.textContent = `${total.toLocaleString('en-US')} of 6,000 estimated tokens`;
      setEsc(true);
    },
    async play(me) {
      await wait(400, me);
      let sum = 0;
      for (let i = 0; i < els.length; i++) {
        els[i].classList.add('in');
        if (i >= 1 && i <= DOCS.length) {
          const s = segs[i - 1];
          s.style.width = s.dataset.w;
          sum += DOCS[i - 1][3];
          used.textContent = `${sum.toLocaleString('en-US')} of 6,000 estimated tokens`;
          pre.scrollTop = els[i].offsetTop - 20;
        }
        await wait(i === 0 ? 300 : 520, me);
      }
      pre.scrollTop = pre.scrollHeight;
      await wait(1200, me);
      setEsc(true);
    }
  });
})();

/* 6. Validate */
(() => {
  const el = $('#d-validate'), nodes = $$('#pipe li'), log = $('#vlog'), cites = $('#cites');
  const ERR = 'Expecting value: line 1 column 1 (char 0)';
  const OUT = ['{', '  "answer": "A Meridian-3 will keep working from its on-board task buffer for up to **12 minutes** …",', '  "citations": [', '    { "source": "sample_corpus/product-specs.md", "heading": "… > Offline Autonomy", "score": 0.5323 },', '    { "source": "sample_corpus/api-reference.md", "heading": "… > GET /robots/{robot_id}/telemetry", "score": 0.406 },', '    { "source": "sample_corpus/faq.md", "heading": "… > What happens during a network outage?", "score": 0.6028 }', '  ],', '  "confidence": "high"', '}'];
  let scn = 'ok';
  const say = (cls, text) => { const s = document.createElement('span'); s.className = cls; s.textContent = text; log.appendChild(s); log.scrollTop = log.scrollHeight; };
  const clearNodes = () => nodes.forEach(n => n.classList.remove('is-active', 'is-pass', 'is-fail'));
  async function pass(i, me, ms = 360) { nodes[i].classList.add('is-active'); await wait(ms, me); nodes[i].classList.remove('is-active'); nodes[i].classList.add('is-pass'); }
  async function failAt(i, me) { nodes[i].classList.add('is-active'); await wait(420, me); nodes[i].classList.remove('is-active'); nodes[i].classList.add('is-fail'); }
  async function goodRun(me) {
    for (let i = 0; i < 4; i++) await pass(i, me);
    nodes[4].classList.add('is-active');
    cites.classList.remove('is-reset');
    await wait(900, me);
    nodes[4].classList.remove('is-active'); nodes[4].classList.add('is-pass');
    await pass(5, me);
    say('dim', '# stdout');
    for (const l of OUT) { say('', l); await wait(40, me); }
    say('dim', '# exit status 0');
  }
  async function badReply(me) {
    say('dim', '# Claude replied with prose before the JSON (illustrative)');
    await pass(0, me); await pass(1, me); await failAt(2, me);
    await wait(250, me);
    say('dim', '# stderr');
    say('err', `warning: invalid JSON from model (${ERR}); retrying once with an error-correction prompt`);
  }
  const SCN = {
    ok: async me => { await goodRun(me); },
    retry: async me => {
      await badReply(me);
      await wait(700, me);
      say('dim', '# sent back as the next user turn');
      say('', `Your previous reply could not be parsed as the required JSON object. The error was:\n\n${ERR}\n\nReply again with only the JSON object described in your instructions — no prose, no markdown fence, no trailing text.`);
      await wait(1300, me);
      clearNodes();
      await goodRun(me);
    },
    fail: async me => {
      await badReply(me);
      await wait(700, me);
      say('dim', '# retried once; the second reply also starts with prose (illustrative)');
      clearNodes();
      await pass(0, me); await pass(1, me); await failAt(2, me);
      await wait(300, me);
      say('dim', '# stderr');
      say('err', `error: The model did not return schema-valid JSON after one retry. Last error: ${ERR}`);
      say('dim', '# exit status 1, nothing printed to stdout');
    }
  };
  const resetView = () => { clearNodes(); log.replaceChildren(); cites.classList.add('is-reset'); };
  const finalView = () => {
    clearNodes(); log.replaceChildren();
    if (scn === 'fail') {
      [0, 1].forEach(i => nodes[i].classList.add('is-pass')); nodes[2].classList.add('is-fail');
      say('err', `warning: invalid JSON from model (${ERR}); retrying once with an error-correction prompt`);
      say('err', `error: The model did not return schema-valid JSON after one retry. Last error: ${ERR}`);
      cites.classList.add('is-reset');
    } else {
      nodes.forEach(n => n.classList.add('is-pass'));
      if (scn === 'retry') say('err', `warning: invalid JSON from model (${ERR}); retrying once with an error-correction prompt`);
      OUT.forEach(l => say('', l));
      cites.classList.remove('is-reset');
    }
  };
  const d = demo(el, { reset: resetView, final: finalView, play: me => SCN[scn](me) });
  const choose = name => {
    scn = name;
    $$('.seg button', el).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.scn === name)));
  };
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { choose(b.dataset.scn); d.start(); }));
  // The tour shows the retry path: it exercises every guard on the way to a valid answer.
  d.prepare = () => choose('retry');
})();

/* The answer: citations point at the chunks they came from */
(() => {
  const cites = $$('.cite');
  const refOf = c => $(`#ref-${c.dataset.ref}`);
  const on = (c, v) => { c.classList.toggle('is-on', v); refOf(c).classList.toggle('is-on', v); };
  cites.forEach(c => {
    c.addEventListener('pointerenter', () => on(c, true));
    c.addEventListener('pointerleave', () => on(c, false));
    c.addEventListener('focus', () => on(c, true));
    c.addEventListener('blur', () => on(c, false));
    c.addEventListener('click', e => { e.preventDefault(); refOf(c).scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' }); });
  });
  if (reduce.matches) return;
  const io = new IntersectionObserver(async es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    for (const c of cites) { on(c, true); await new Promise(r => setTimeout(r, 650)); on(c, false); await new Promise(r => setTimeout(r, 120)); }
  }, ARRIVE);
  io.observe($('#ans-text'));
})();
