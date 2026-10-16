/* Every line below is verbatim output of fieldlog at bcb9199, or a line from the op log of a real
   emulator run. SHOTS are screenshots of the debug APK on an API 36 emulator. */
const CAP = /*@@DATA:captures@@*/;
const SHOTS = /*@@DATA:shots@@*/;

const toneOf = t => (/^-- /.test(t) ? 'dim' : /refused|FAILED|REFUSED|DISAGREE/.test(t) ? 'err' : /identical|ready; wrote|^ok:|clean|converged/.test(t) ? 'ok' : 'out');

/* strata's own output, from scripts/strata-check.sh and strata built at 047ca52 */
const STRATA = {
  before: `at (600, 480), max sigma 1.5 m
surface               elevation        95% interval   sigma
ground surface            63.93     62.74 .. 65.13       0.61
base of topsoil           63.18     61.88 .. 64.48       0.66
base of clay              59.16     56.75 .. 61.57       1.23
base of sand              55.41     52.55 .. 58.26       1.45
base of gravel          REFUSED    sigma over limit    1.52`,
  after: `at (600, 480), max sigma 1.5 m
surface               elevation        95% interval   sigma
ground surface            64.62     64.62 .. 64.62       0.00
base of topsoil           63.72     63.72 .. 63.72       0.00
base of clay              58.42     58.42 .. 58.42       0.00
base of sand              54.32     54.32 .. 54.32       0.00
base of gravel            51.42     51.42 .. 51.42       0.00`,
  checks: [
    'ok: strata validate accepts the merged export (198 rows)',
    'ok: at (600, 480) strata refused the base of gravel before BH41, answers after',
    'ok: strata cv is byte-identical on examples/site.csv and on it after import -> export',
    'ok: strata refuses a gap with the same words fieldlog uses: strata: build/strata-check/gap.csv: line 4: hole BH01: gap between 1 and 1.5 m'
  ]
};
/* A small terminal whose lines are revealed one at a time */
function miniTerm(el, lines) {
  el.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const spans = $$('span', el);
  return {
    hide() { spans.forEach(s => s.classList.add('is-off')); },
    show() { spans.forEach(s => s.classList.remove('is-off')); },
    async play(me, ms = 70) { for (const s of spans) { s.classList.remove('is-off'); await wait(s.classList.contains('cmd') ? 380 : ms, me); } }
  };
}

/* Screenshots are decoded only when their demo comes near */
(() => {
  const shots = $$('.fl-shot[data-shot]');
  const load = f => { const img = $('img', f); if (!img.src) img.src = SHOTS[f.dataset.shot]; };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: '800px 0px' });
  shots.forEach(f => io.observe(f));
  PAGE.loadShots = el => $$('.fl-shot[data-shot]', el).forEach(load);
})();

/* Hero terminal */
(() => {
  const gap = ['out', ''];
  const relay = CAP.relay.map(t => (t.startsWith('$ ') ? ['cmd', t.slice(2)] : /^\d{3}$/.test(t) ? ['dim', `# HTTP ${t}`] : ['out', t]));
  const sq = q => q.split('\n');
  PAGE.terminal = {
    scenes: {
      demo: [['cmd', 'fieldlog demo -o merged.csv'], ...CAP.demo.map(t => [toneOf(t), t])],
      mutants: [['cmd', 'fieldlog fuzz mutants --seeds 2000'], ...CAP.mutants.map(t => [/^correct/.test(t) ? 'ok' : 'out', t]), gap, ['cmd', 'fieldlog fuzz run --seed 1 --bug clock-no-bump'], ...CAP.runs['clock-no-bump'].map(t => [toneOf(t), t])],
      relay: [['dim', '# fieldlog relay --port 8791 --data relay.ops, in another terminal'], ...relay],
      strata: [['dim', '# before: strata\'s example site, nearest hole 120 m away'], ['cmd', 'strata query examples/site.csv 600 480'], ...sq(STRATA.before).map(t => [toneOf(t), t]), ['dim', '# exit 1'], gap,
        ['dim', '# after: the merged export, with BH41 logged offline'], ['cmd', 'strata query build/strata-check/merged.csv 600 480'], ...sq(STRATA.after).map(t => ['out', t])]
    },
    order: ['demo', 'mutants', 'relay', 'strata'],
    first: 'demo'
  };
})();

/* Tests per suite, from the JUnit XML of each Gradle task and the instrumentation run */
PAGE.tests = [['core: ReplicaTest', 9, 'var(--blue)'], ['core: StrataTest', 9, 'var(--water)'], ['core: FuzzTest', 4, 'var(--magenta)'], ['core: CodecTest', 2, 'var(--ink-2)'], ['cli: RelayTest', 5, 'var(--yellow)'], ['cli: CliTest', 4, 'var(--green)'], ['app: FieldStoreTest', 3, 'var(--red)'], ['app on a device: LoggingTest', 3, 'var(--pass)']];

/* 1. The phone: two screenshots, then its op lines as they were typed */
(() => {
  const el = $('#d-phone'), list = $('#fl-lines'), shots = $$('#fl-ph1 .fl-shot');
  const OPS = CAP.phoneOps.slice(0, 21);
  list.innerHTML = OPS.map(([k, id, ...rest]) => `<li><b class="fl-kind" data-k="${k}">${k}</b><span class="fl-id">${id}</span><span class="fl-rest">${esc(rest.join('  ')) || ' '}</span></li>`).join('');
  const items = $$('li', list);
  demo(el, {
    reset() { shots.forEach(s => s.classList.add('is-off')); items.forEach(i => i.classList.add('is-off')); },
    final() { PAGE.loadShots(el); shots.forEach(s => s.classList.remove('is-off')); items.forEach(i => i.classList.remove('is-off')); },
    async play(me) {
      PAGE.loadShots(el);
      await wait(250, me);
      shots[0].classList.remove('is-off');
      for (const i of items) { i.classList.remove('is-off'); await wait(110, me); }
      await wait(500, me);
      shots[1].classList.remove('is-off');
    }
  });
})();

/* 2. Op kinds, keystrokes and the note's chain of inserts */
(() => {
  const el = $('#d-ops');
  const byId = Object.fromEntries(CAP.phoneOps.map(o => [o[1], o]));
  const line = o => o.join('  ');
  const KINDS = [
    ['S', 'Set a field', line(byId['105@pixel-a'])],
    ['A', 'Add to a set', line(byId['151@pixel-a'])],
    ['R', 'Remove from a set', 'R  <id>  <set>  <elem>  <tags it had seen>'],
    ['I', 'Insert a character', line(byId['153@pixel-a'])],
    ['D', 'Delete a character', 'D  <id>  <text>  <target>']
  ];
  $('#fl-kinds').innerHTML = KINDS.map(([k, what, ex]) => `<li class="${ex.includes('<') ? 'is-fmt' : ''}"><b class="fl-kind" data-k="${k}">${k}</b><span class="fl-what">${what}</span><code>${esc(ex)}</code></li>`).join('');
  const keys = ['102', '103', '104', '105'].map(n => byId[`${n}@pixel-a`]);
  $('#fl-keys').innerHTML = keys.map(o => `<li><span class="fl-key">${esc(o[4])}</span><small>${o[1].replace('@pixel-a', '')}</small></li>`).join('');
  const chain = CAP.phoneOps.filter(o => o[0] === 'I').slice(0, 10);
  $('#fl-chain').innerHTML = chain.map(o => `<li title="${esc(line(o))}"><span class="fl-ch">${o[4] === ' ' ? '␣' : esc(o[4])}</span><small>${o[1].replace('@pixel-a', '')}</small></li>`).join('');
  const rows = $$('#fl-kinds li'), ks = $$('#fl-keys li'), cs = $$('#fl-chain li');
  const all = [...rows, ...ks, ...cs];
  demo(el, {
    reset() { all.forEach(x => x.classList.add('is-off')); ks.forEach(k => k.classList.remove('is-win')); },
    final() { all.forEach(x => x.classList.remove('is-off')); ks.forEach((k, i) => k.classList.toggle('is-win', i === ks.length - 1)); },
    async play(me) {
      await wait(250, me);
      for (const r of rows) { r.classList.remove('is-off'); await wait(260, me); }
      await wait(300, me);
      for (const [i, k] of ks.entries()) { k.classList.remove('is-off'); ks.forEach((x, j) => x.classList.toggle('is-win', j === i)); await wait(380, me); }
      await wait(300, me);
      for (const c of cs) { c.classList.remove('is-off'); await wait(150, me); }
    }
  });
})();

/* 3. The merge: the demo's two phones, step by step */
(() => {
  const el = $('#d-merge'), devs = { a: $('[data-dev="a"]'), b: $('[data-dev="b"]') };
  const D = CAP.demo, at = s => D.indexOf(D.find(t => t.includes(s)));
  const notes = D[at('BH16 notes on both')].match(/"(.*)"/)[1];
  const hash = D[at('pixel-a  42 holes')].split('state ')[1];
  const STEPS = [
    { net: 'online', holes: ['40', '40'], hash: ['', ''], note: ['', ''], lines: [at('desk     imports'), at('pixel-a has 40')] },
    { net: 'offline', holes: ['40, plus BH41', '40, plus its BH41'], hash: ['', ''], note: ['Clay firm, fissured.', 'Recheck collar level.'], lines: [at('-- both phones lose'), at('pixel-b  types in')] },
    { net: 'synced', holes: ['42', '42'], hash: [hash, hash], note: [notes, notes], lines: [at('-- back in signal'), at('BH16 notes on both')] }
  ];
  const term = $('#fl-merge-term');
  const lo = STEPS[0].lines[0];
  term.innerHTML = D.slice(lo, STEPS[2].lines[1] + 1).map(t => `<span class="${toneOf(t)}">${esc(t) || ' '}</span>`).join('');
  const lines = $$('span', term);
  const show = (i, upTo = STEPS[i].lines[1]) => {
    const s = STEPS[i];
    ['a', 'b'].forEach((k, j) => {
      const d = devs[k];
      $('[data-net]', d).textContent = s.net;
      d.dataset.net = s.net;
      $('[data-holes]', d).textContent = s.holes[j];
      $('[data-hash]', d).textContent = s.hash[j] || 'not compared yet';
      $('[data-hash]', d).classList.toggle('is-same', !!s.hash[j]);
      $('[data-note]', d).textContent = s.note[j] || 'empty';
    });
    lines.forEach((l, k) => l.classList.toggle('is-off', lo + k > upTo));
  };
  demo(el, {
    reset() { show(0); },
    final() { show(2); },
    async play(me) {
      for (let i = 0; i < STEPS.length; i++) {
        const [a, b] = STEPS[i].lines;
        for (let n = a; n <= b; n++) { show(i, n); await wait(260, me); }
        await wait(1100, me);
      }
    }
  });
})();

/* 4. The relay: the curl session, with what the relay holds */
(() => {
  const el = $('#d-relay'), held = $('#fl-held');
  let n = 0;
  const lines = CAP.relay.map(t => {
    const m = t.match(/total (\d+)/);
    if (m) n = +m[1];
    return [t.startsWith('$ ') ? 'cmd' : /^\d{3}$/.test(t) || /^bad operation|^need /.test(t) ? 'err' : 'out', t.startsWith('$ ') ? t.slice(2) : /^\d{3}$/.test(t) ? `# HTTP ${t}` : t, n];
  });
  const box = $('#fl-relay-term');
  box.innerHTML = lines.map(([k, t]) => `<span class="${k}">${esc(t) || ' '}</span>`).join('');
  const spans = $$('span', box);
  const at = k => {
    spans.forEach((s, i) => s.classList.toggle('is-off', i >= k));
    const h = k ? lines[k - 1][2] : 0;
    held.textContent = `${h} operation${h === 1 ? '' : 's'}`;
  };
  demo(el, {
    reset() { at(0); },
    final() { at(spans.length); },
    async play(me) {
      await wait(250, me);
      for (let k = 1; k <= spans.length; k++) { at(k); await wait(lines[k - 1][0] === 'cmd' ? 520 : 140, me); }
    }
  });
})();

/* 5. The fuzzer: the mutant table, then single runs */
(() => {
  const el = $('#d-fuzz'), box = $('#fl-mut');
  const COL = { convergence: 'var(--blue)', 'order independence': 'var(--magenta)', 'local intent': 'var(--yellow)' };
  $('#fl-mut-legend').innerHTML = Object.entries(COL).map(([k, c]) => `<span class="key"><i class="sw" style="--c:${c}"></i>Caught by ${k}</span>`).join('');
  const ROWS = CAP.mutants.slice(1).map(t => {
    const [name, result, first, ...rest] = t.trim().split(/\s{2,}/);
    const failed = rest[0], by = rest[1];
    const pct = result === 'clean' ? 0 : parseInt(failed, 10);
    return { name, pct, failed, checks: result === 'clean' ? [] : by.split(', ') };
  });
  box.innerHTML = ROWS.map(r => `<div class="fl-mrow${r.pct ? '' : ' is-clean'}" role="row"><code role="cell">${r.name}</code><span class="fl-track" role="cell"><i style="transform:scaleX(${r.pct / 100})"></i></span><b role="cell">${r.pct ? `${r.pct}%` : 'clean'}</b><span class="fl-by" role="cell">${r.checks.length ? r.checks.map(c => `<i class="sw" style="--c:${COL[c]}" title="${c}"></i>`).join('') : '<small>every check held</small>'}</span></div>`).join('');
  const rows = $$('.fl-mrow', box);
  const RUNS = [['clock-no-bump', 'clock-no-bump'], ['lww-by-arrival', 'lww-by-arrival'], ['rga-no-skip', 'rga-no-skip'], ['remove-unobserved', 'remove-unobserved'], ['correct', 'Correct, seed 7']];
  const seg = $('#fl-run-seg'), runBox = $('#fl-run');
  seg.innerHTML = RUNS.map(([k, label], i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(label)}</button>`).join('');
  const btns = $$('button', seg);
  let term = null, d = null;
  const pick = i => {
    const [k] = RUNS[i];
    btns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    const cmd = k === 'correct' ? 'fieldlog fuzz run --seed 7' : `fieldlog fuzz run --seed 1 --bug ${k}`;
    term = miniTerm(runBox, [['cmd', cmd], ...CAP.runs[k].map(t => [toneOf(t), t])]);
  };
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; pick(i); term.show(); }));
  d = demo(el, {
    reset() { rows.forEach(r => r.classList.add('is-off')); pick(0); term.hide(); },
    final() { rows.forEach(r => r.classList.remove('is-off')); pick(0); term.show(); },
    async play(me) {
      d.stopAuto = false;
      await wait(250, me);
      for (const r of rows) { r.classList.remove('is-off'); await wait(320, me); }
      for (let i = 0; i < RUNS.length; i++) {
        if (d.stopAuto) return;
        pick(i); term.hide();
        await wait(200, me);
        await term.play(me, 260);
        await wait(1100, me);
      }
    }
  });
})();

/* 6. The name clash: four emulator frames, then the demo's export lines */
(() => {
  const el = $('#d-clash'), frames = $$('#fl-seq .fl-shot');
  const D = CAP.demo, from = D.indexOf('-- export for strata --');
  const term = miniTerm($('#fl-clash-term'), [['dim', '# the end of fieldlog demo'], ...D.slice(from + 1).map(t => [toneOf(t), t])]);
  demo(el, {
    reset() { frames.forEach(f => f.classList.add('is-off')); term.hide(); },
    final() { PAGE.loadShots(el); frames.forEach(f => f.classList.remove('is-off')); term.show(); },
    async play(me) {
      PAGE.loadShots(el);
      await wait(250, me);
      for (const f of frames) { f.classList.remove('is-off'); await wait(900, me); }
      await term.play(me, 420);
    }
  });
})();

/* 7. strata: the query at (600, 480) before and after, then the four checks */
(() => {
  const el = $('#d-strata'), grid = $('#fl-q');
  const parse = s => s.split('\n').slice(2).map(l => {
    const m = l.match(/^(.+?)\s{2,}(REFUSED|[\d.]+)\s+(sigma over limit|[\d.]+ \.\. [\d.]+)\s+([\d.]+)$/);
    return { name: m[1], value: m[2], range: m[3], sigma: m[4] };
  });
  const B = parse(STRATA.before), A = parse(STRATA.after);
  const cell = (r, side) => r.value === 'REFUSED'
    ? `<span class="fl-q-c is-ref" role="cell" data-side="${side}"><b>Refused</b><small>sigma ${r.sigma} m, over 1.5</small></span>`
    : `<span class="fl-q-c" role="cell" data-side="${side}"><b>${r.value} m</b><small>${r.range === `${r.value} .. ${r.value}` ? 'logged at BH41' : `${r.range}, sigma ${r.sigma}`}</small></span>`;
  grid.insertAdjacentHTML('beforeend', B.map((b, i) => `<div class="fl-q-row${b.value === 'REFUSED' ? ' is-key' : ''}" role="row"><span class="fl-q-n" role="rowheader">${esc(b.name)}</span>${cell(b, 'b')}${cell(A[i], 'a')}</div>`).join(''));
  const before = $$('[data-side="b"]', grid), after = $$('[data-side="a"]', grid);
  const term = miniTerm($('#fl-check-term'), [['cmd', './scripts/strata-check.sh'], ...STRATA.checks.map(t => ['ok', t])]);
  demo(el, {
    reset() { [...before, ...after].forEach(c => c.classList.add('is-off')); term.hide(); },
    final() { [...before, ...after].forEach(c => c.classList.remove('is-off')); term.show(); },
    async play(me) {
      await wait(250, me);
      for (const c of before) { c.classList.remove('is-off'); await wait(200, me); }
      await wait(700, me);
      for (const c of after) { c.classList.remove('is-off'); await wait(260, me); }
      await wait(500, me);
      await term.play(me, 380);
    }
  });
})();

/* CI jobs, run 38620812427 */
(() => {
  const JOBS = [['core + CLI, fuzz', 133], ['strata check', 122], ['APK + unit tests', 72], ['UI tests, emulator', 249], ['make test, make apk', 238]];
  $('#fl-ci').innerHTML = JOBS.map(([n, s]) => `<div class="bar-row"><span>${n}</span><span class="bar"><i style="--w:${(s / 249 * 100).toFixed(1)}%"></i></span><span>${s} s</span></div>`).join('');
})();
