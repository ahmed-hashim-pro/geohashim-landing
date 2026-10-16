/* Every report, run and number below is from real runs of flaky-hunt 0.1.0 at commit ab062b0 on
   examples/planted. RUN.cols/cells, RUN.comps and RUN.bisect come from one hunt run through flaky-hunt's
   own code, with each pytest run and comparison recorded as it happened. REAL is docs/real in the repository. */
const RUN = /*@@DATA:run@@*/;
const REAL = /*@@DATA:real@@*/;

const toneOf = t => (/^(FAILED|E |\[exit [12]\]|Command exited)|\d+ failed|fails [1-9]\d*\/|^ {2}(no cause)/.test(t) ? 'err' : /^(· |\$)/.test(t) ? 'dim' : /caught|^\d+ passed/.test(t) ? 'ok' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];
const short = t => t.split('::').pop();

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
  const failedIn = r => r.out.filter(t => t.startsWith('FAILED ')).map(t => short(t.slice(7).split(' - ')[0]));
  const pyRun = RUN.pytestRuns[2];
  const tail = pyRun.out.slice(pyRun.out.findIndex(t => /short test summary/.test(t)));
  const lineup = RUN.pytestRuns.map((r, i) => ['dim', `#   run ${i + 1}: ${failedIn(r).join(', ')}`]);
  const real = REAL.humanize;
  PAGE.terminal = {
    scenes: {
      pytest: [['dim', '# examples/planted, plain pytest five times in a row; the third run:'], ['cmd', pyRun.cmd], ['dim', '# … tracebacks cut'], ...tail.map(t => [toneOf(t), t]), gap, ['dim', '# what failed in each of the five runs'], ...lineup],
      hunt: [['dim', '# the same suite, every factor'], ...runLines(RUN.run).filter(([, t]) => !/^wall /.test(t) && !/^Command exited/.test(t)), gap, ...exitLines(RUN.run)],
      factors: [['dim', '# every setting a hunt tries, one suite run each'], ...runLines(RUN.factors)],
      real: [['dim', '# humanize 4.10.0, from the repository\'s docs/real'], ['cmd', 'flaky-hunt run --workers 3 --json /out/humanize-4.10.0.json'], ...real.map(t => [toneOf(t), t])]
    },
    order: ['pytest', 'hunt', 'factors', 'real'],
    first: 'pytest'
  };
})();

/* Tests per file, from pytest --collect-only */
PAGE.tests = [['test_plugin.py', 13, 'var(--blue)'], ['test_narrow.py', 9, 'var(--magenta)'], ['test_hunt_logic.py', 6, 'var(--yellow)'], ['test_planted.py', 5, 'var(--red)'], ['test_probes.py', 5, 'var(--water)'], ['test_stats.py', 5, 'var(--green)'], ['test_report.py', 4, 'var(--ink-2)']];

/* 1. Probe: every suite run, test by test */
(() => {
  const el = $('#d-probe'), box = $('#fh-map');
  const n = RUN.cols.length;
  box.style.setProperty('--n', n);
  const groups = [];
  RUN.cols.forEach((c, j) => { const g = groups[groups.length - 1]; if (g && g.f === c.factor) g.n++; else groups.push({ f: c.factor, n: 1, j }); });
  const NAME = { control: 'as-is', order: 'order', time: 'time', timezone: 'zone', random: 'random', timing: 'timing', environment: 'env', network: 'net' };
  let html = `<div class="fh-map-cols" aria-hidden="true">${groups.map(g => `<span style="grid-column:${g.j + 1} / span ${g.n}" title="${g.f}">${NAME[g.f]}</span>`).join('')}</div>`;
  RUN.tests.forEach((t, i) => {
    html += `<span class="fh-map-name" data-flaky="${RUN.flaky.includes(t) ? 1 : 0}" title="${esc(t)}">${esc(short(t))}</span><span class="fh-map-row">${[...RUN.cells[i]].map((o, j) => `<i class="fh-cell" data-o="${o}" title="${esc(RUN.cols[j].label)}: ${o === 'f' ? 'failed' : 'passed'}"></i>`).join('')}</span>`;
  });
  box.innerHTML = html;
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', `${RUN.tests.length} tests by ${n} suite runs, ${RUN.cells.join('').split('f').length - 1} failures`);
  const byCol = Array.from({ length: n }, (_, j) => $$('.fh-map-row', box).map(r => r.children[j]));
  demo(el, {
    reset() { byCol.flat().forEach(c => c.classList.add('is-off')); },
    final() { byCol.flat().forEach(c => c.classList.remove('is-off')); },
    async play(me) {
      await wait(250, me);
      for (const col of byCol) { col.forEach(c => c.classList.remove('is-off')); await wait(85, me); }
    }
  });
})();

/* 2. Suspects: one pip per cause tried for each test, filled when stage 3 decides */
(() => {
  const el = $('#d-suspect'), list = $('#fh-sus');
  const per = {};
  RUN.comps.forEach(c => { (per[c.test] = per[c.test] || []).push(c); });
  const lab = s => `${s[0]}${s[1].length ? ` after ${short(s[1][0])}` : ''}`;
  list.innerHTML = RUN.tests.filter(t => per[t]).map(t => {
    const cs = per[t], yes = cs.filter(c => c.result).length;
    return `<li><span class="fh-sus-n"><code>${esc(short(t))}</code><small>${cs.length} suspect${cs.length > 1 ? 's' : ''}, ${yes} confirmed</small></span><span class="fh-pips">${cs.map(c => `<i class="fh-pip" data-r="${c.result ? 'yes' : 'no'}" title="${esc(lab(c.worse))} against ${esc(lab(c.better))}"></i>`).join('')}</span></li>`;
  }).join('');
  const rows = $$('li', list);
  demo(el, {
    reset() { rows.forEach(r => { r.classList.remove('in'); $$('.fh-pip', r).forEach(p => p.classList.remove('is-v')); }); },
    final() { rows.forEach(r => { r.classList.add('in'); $$('.fh-pip', r).forEach(p => p.classList.add('is-v')); }); },
    async play(me) {
      await wait(250, me);
      for (const r of rows) { r.classList.add('in'); await wait(140, me); }
      await wait(500, me);
      for (const r of rows) { for (const p of $$('.fh-pip', r)) { p.classList.add('is-v'); await wait(60, me); } await wait(120, me); }
    }
  });
})();

/* 3. Confirm: every cause tried for the hash-order test, run by run in the order they started */
(() => {
  const el = $('#d-confirm'), list = $('#fh-conf');
  const cs = RUN.comps.filter(c => c.test.endsWith('::test_render_tags'));
  const side = (lab, s) => `<div class="fh-side"><span>${esc(lab)}</span><span class="fh-dots" data-s="${s}"></span><b data-s="${s}">0/0</b></div>`;
  list.innerHTML = cs.map(c => `<li class="fh-conf-row" data-ok="${c.result ? 1 : 0}"><p class="fh-conf-h"><span>${esc(c.worse[0])}</span><small>against ${esc(c.better[0])}</small></p>${side('fails under it', 'a')}${side('the other side', 'b')}<p class="fh-verdict">${c.result ? `<b>Confirmed</b>: p = ${c.result.p.toExponential(1)}, under the ${c.level.toExponential(0)} needed` : `<b>Not confirmed</b>${c.seq.length > 16 ? ': leaned that way at 8 a side, so 32 a side, and still no' : ''}`}</p></li>`).join('');
  const rows = $$('li', list);
  rows.forEach((r, i) => {
    const a = $('.fh-dots[data-s="a"]', r), b = $('.fh-dots[data-s="b"]', r);
    cs[i].seq.forEach(([s, f]) => (s === 'a' ? a : b).insertAdjacentHTML('beforeend', `<i data-f="${f}"></i>`));
  });
  const fill = (row, c, upto) => {
    const dots = { a: [...$('.fh-dots[data-s="a"]', row).children], b: [...$('.fh-dots[data-s="b"]', row).children] };
    const k = { a: 0, b: 0 }, f = { a: 0, b: 0 };
    c.seq.forEach(([s, x], i) => {
      const on = i < upto;
      dots[s][k[s]++].classList.toggle('in', on);
      if (on) f[s] += x;
    });
    const n = s => c.seq.slice(0, upto).filter(x => x[0] === s).length;
    $('b[data-s="a"]', row).textContent = `${f.a}/${n('a')}`;
    $('b[data-s="b"]', row).textContent = `${f.b}/${n('b')}`;
  };
  demo(el, {
    reset() { rows.forEach((r, i) => { r.classList.remove('in', 'is-done'); fill(r, cs[i], 0); }); },
    final() { rows.forEach((r, i) => { r.classList.add('in', 'is-done'); fill(r, cs[i], cs[i].seq.length); }); },
    async play(me) {
      await wait(250, me);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i], c = cs[i];
        r.classList.add('in');
        const step = c.seq.length > 16 ? 22 : 45;
        for (let k = 1; k <= c.seq.length; k++) { fill(r, c, k); await wait(step, me); }
        r.classList.add('is-done');
        await wait(260, me);
      }
    }
  });
})();

/* 4. Order: the polluter search, one fresh pytest process per row */
(() => {
  const el = $('#d-order'), list = $('#fh-bis');
  const B = RUN.bisect;
  list.innerHTML = B.steps.map((s, i) => `<li><span class="fh-bis-l">Run ${i + 1}</span><span class="fh-bis-bar" title="${esc(s.prefix.map(short).join(', '))}">${B.before.map(t => `<i data-in="${s.prefix.includes(t) ? 1 : 0}" data-c="${s.prefix.length === 1 && t === B.culprit ? 1 : 0}"></i>`).join('')}</span><span class="fh-bis-r" data-b="${s.broke ? 1 : 0}">${s.broke ? 'fails' : 'passes'}</span></li>`).join('');
  const rows = $$('li', list);
  const d = RUN.run.out;
  const at = d.findIndex(t => t === B.victim);
  const term = miniTerm($('#fh-ord-term'), [['dim', '# … then confirmed, 8 runs a side, and reported'], ['out', B.victim], ...d.slice(at + 1, at + 5).map(t => [toneOf(t), t])]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(520, me); }
      await wait(300, me);
      await term.play(me, 110);
    }
  });
})();

/* 5. Reproduce: the report's commands, run by hand with plain pytest */
(() => {
  const el = $('#d-repro'), seg = $('#fh-rep-seg');
  const toLines = block => block.filter(t => !/^E\s+\+/.test(t)).map(t => (t.startsWith('$ ') ? ['cmd', t.slice(2)] : /^\[exit (\d)\]$/.test(t) ? ['dim', `# exit ${t.slice(6, 7)}`] : [toneOf(t), t]));
  const R = [
    { label: 'Order', file: 'tests/test_settings.py', code: 'def test_enable_debug_mode():  # changes a global and never puts it back\n    settings.DEBUG = True\n    assert settings.DEBUG', block: RUN.repro[0] },
    { label: 'Hash seed', file: 'shop/tags.py', code: 'def render(tags: set[str]) -> str:\n    return ", ".join(tags)  # bug: set order depends on PYTHONHASHSEED', block: RUN.repro[1] },
    { label: 'Race', file: 'shop/inventory.py', code: 'def reserve(self) -> bool:\n    current = self.stock  # read ...\n    if current <= 0:\n        return False\n    self.stock = self._after_reserving(current)  # ... then write: another thread\n    return True  # can get in between', block: RUN.repro[2] },
    { label: 'Clock', file: 'tests/test_coupons.py', code: 'test_short_coupon_expires_today\n# "expires today" breaks in the last ten minutes of the day', block: RUN.repro[3] }
  ];
  seg.innerHTML = R.map((r, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(r.label)}</button>`).join('');
  const btns = $$('button', seg);
  let term = null;
  const select = i => {
    const r = R[i];
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    $('#fh-rep-name').innerHTML = `<code>${esc(r.file)}</code>`;
    $('#fh-rep-code').textContent = r.code;
    term = miniTerm($('#fh-rep-term'), toLines(r.block));
  };
  let d = null;
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); term.show(); }));
  d = demo(el, {
    reset() { select(0); term.hide(); },
    final() { select(R.length - 1); term.show(); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < R.length; i++) {
        if (d.stopAuto) return;
        select(i); term.hide();
        await wait(400, me);
        if (d.stopAuto) return;
        await term.play(me, 60);
        await wait(1400, me);
      }
    }
  });
})();

/* 6. Checked: each planted cause against what this hunt blamed, then the mutants */
(() => {
  const el = $('#d-check'), list = $('#fh-plant');
  const what = d => (d.factor === 'order' ? `order: after ${short(d.culprit)}` : `${d.factor}: ${d.trigger}`);
  list.innerHTML = RUN.diagnoses.map(d => `<li><code>${esc(short(d.test))}</code><span>${esc(what(d))}</span><b role="img" aria-label="as expected"></b></li>`).join('');
  const rows = $$('li', list);
  const mut = miniTerm($('#fh-mut'), [['cmd', 'python scripts/mutants.py'], ...RUN.mutants.filter(t => !/^\[exit/.test(t)).map(t => [toneOf(t), t])]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); mut.hide(); },
    final() { rows.forEach(r => r.classList.add('in')); mut.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(200, me); }
      await wait(400, me);
      await mut.play(me, 260);
    }
  });
})();

/* Measured: the repository's real-project table */
$('#fh-real').innerHTML = REAL.table.map(([p, n, f, what, took]) => `<li class="fh-real-row"><span>${esc(p)}</span><span><small>tests </small>${n}</span><span data-n="${f}"><small>flaky </small>${f}</span><span>${what}</span><span><small>took </small>${took}</span></li>`).join('');
