/* Every report, error and file below is verbatim: paramguard 0.1.0 at commit dfc1443, run in
   examples/survey-quad and in scratch copies of it. FLY is the SITL telemetry, thinned to one point a second. */
const CAP = /*@@DATA:captures@@*/;
const FLY = /*@@DATA:flight@@*/;

const toneOf = t => (/^(BLOCK|blocked:|paramguard: |::error)/.test(t) ? 'err' : /^(ALLOW|ok:)/.test(t) ? 'ok' : /^(WARN|::warning)/.test(t) ? 'warn' : /^note /.test(t) ? 'dim' : 'out');
const runLines = (c, cmd = c.cmd) => [['cmd', cmd], ...c.out.map(t => [toneOf(t), t])];
const exitLines = c => [['cmd', 'echo $?'], ['out', String(c.exit)]];
const fileLines = (name, lines) => [['cmd', `cat ${name}`], ...lines.map(t => ['out', t])];

// The findings in a text report: a header line, then the message, then "why:".
function findingsOf(out) {
  const list = [];
  let f = null, inWhy = false;
  for (const t of out) {
    const h = t.match(/^(BLOCK|WARN |note |ALLOW)\s+(\S+)\s+(\S+)$/);
    if (h) { f = { sev: h[1].trim().toLowerCase(), check: h[2], where: h[3], msg: [], why: [] }; list.push(f); inWhy = false; continue; }
    if (!f || !t.startsWith('       ')) { f = null; continue; }
    const s = t.trim();
    if (s.startsWith('why: ')) { inWhy = true; f.why.push(s.slice(5)); } else (inWhy ? f.why : f.msg).push(s);
  }
  return list.map(x => ({ ...x, msg: x.msg.join(' '), why: x.why.join(' ') }));
}

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

/* Hero terminal */
(() => {
  const gap = ['out', ''];
  PAGE.terminal = {
    scenes: {
      cleanup: [['dim', '# a pull request that deletes 17 lines "already at their defaults"'], ...runLines(CAP.cleanup), gap, ...exitLines(CAP.cleanup)],
      tuning: [['dim', '# the survey tuning pull request: five changed values'], ...runLines(CAP.tuning), gap, ...exitLines(CAP.tuning)],
      explain: [['dim', '# what the metadata and the rules say; a typo gets a suggestion'], ...runLines(CAP.explain), gap, ...exitLines(CAP.explain)],
      lint: [['dim', '# one file on its own, firmware defaults included'], ...runLines(CAP.lint), gap, ...exitLines(CAP.lint)]
    },
    order: ['cleanup', 'tuning', 'explain', 'lint'],
    first: 'cleanup'
  };
})();

/* Tests per file, from pytest --collect-only (67 with the ArduCopter metadata present) */
PAGE.tests = [['test_rules.py', 20, 'var(--blue)'], ['test_params.py', 13, 'var(--magenta)'], ['test_check.py', 12, 'var(--yellow)'], ['test_cli.py', 10, 'var(--water)'], ['test_properties.py', 7, 'var(--green)'], ['test_meta.py', 5, 'var(--ink-2)']];

/* 1. Read: the same values in other formats, then three files it refuses */
(() => {
  const el = $('#d-read');
  const data = CAP.vehicleLines.filter(t => !t.startsWith('#'));
  const left = data.slice(0, 8), right = CAP.respelledLines.slice(0, 9);
  const li = t => `<li><code>${esc(t.replace(/\t/g, '  '))}</code></li>`;
  $('#pg-left').innerHTML = left.map(li).join('') + `<li class="pg-more">… ${data.length - left.length} more</li>`;
  $('#pg-right').innerHTML = right.map(li).join('') + `<li class="pg-more">… ${CAP.respelledLines.length - right.length} more</li>`;
  const rows = [...$$('#pg-left li'), ...$$('#pg-right li')];
  const ok = miniTerm($('#pg-read-ok'), [...runLines(CAP.respelled), ['dim', `# exit ${CAP.respelled.exit}`]]);
  const FILES = {
    twice: ['GF_ACTION 3', 'NAV_DLL_ACT 2', 'GF_ACTION 1'],
    word: ['NAV_DLL_ACT 2', 'MPC_XY_CRUISE fast'],
    qgcint: ['1\t1\tNAV_DLL_ACT\t2.5\t6']
  };
  const err = miniTerm($('#pg-read-err'), ['twice', 'word', 'qgcint'].flatMap(k => [...fileLines(`${k}.params`, FILES[k].map(t => t.replace(/\t/g, '  '))), ...runLines(CAP[k]), ['dim', `# exit ${CAP[k].exit}`]]));
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in')); ok.hide(); err.hide(); },
    final() { rows.forEach(r => r.classList.add('in')); ok.show(); err.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(70, me); }
      await wait(300, me);
      await ok.play(me, 120);
      await wait(600, me);
      await err.play(me, 90);
    }
  });
})();

/* 2. Effective values: each deleted line against the firmware default */
(() => {
  const el = $('#d-effective'), list = $('#pg-eff');
  list.innerHTML = CAP.removed.map(([n, file, def, moved]) => `<li class="pg-eff-row" data-moved="${moved ? 1 : 0}"><code class="pg-eff-n">${n}</code><span class="pg-eff-f"><span class="pg-eff-l">In the file </span>${esc(file)}</span><span class="pg-eff-d"><span class="pg-eff-l">Default </span>${esc(def)}</span><span class="pg-eff-v">${moved ? `${esc(file)} to ${esc(def)}` : 'None'}</span></li>`).join('');
  const rows = $$('li', list);
  const head = CAP.cleanup.out.slice(0, 3).concat(['', CAP.cleanup.out[4]]);
  const term = miniTerm($('#pg-eff-term'), [['cmd', CAP.cleanup.cmd], ...head.map(t => [toneOf(t), t]), ['dim', '# … the full report is the first tab above']]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-v')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in', 'is-v')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(60, me); }
      await wait(400, me);
      for (const r of rows) { r.classList.add('is-v'); await wait(r.dataset.moved === '1' ? 900 : 120, me); }
      await wait(400, me);
      await term.play(me, 140);
    }
  });
})();

/* 3. Metadata: the lines it rejects, with the check and paramguard's message */
(() => {
  const el = $('#d-meta'), list = $('#pg-meta');
  const tuning = findingsOf(CAP.tuning.out), values = findingsOf(CAP.values.out);
  const pick = (fs, check, param) => fs.find(f => f.check === check && f.msg.startsWith(param));
  const ROWS = [
    ['tuning.params', '1  1  MPC_XY_CRUSIE  8  9', [pick(tuning, 'unknown-param', 'MPC_XY_CRUSIE')]],
    ['tuning.params', '1  1  MPC_Z_VEL_MAX_DN  5  9', [pick(tuning, 'out-of-range', 'MPC_Z_VEL_MAX_DN')]],
    ['values.params', '1  1  NAV_DLL_ACT  4  6', [pick(values, 'not-in-values', 'NAV_DLL_ACT')]],
    ['values.params', 'COM_DL_LOSS_T 10.5', [pick(values, 'not-integer', 'COM_DL_LOSS_T')]],
    ['values.params', 'EKF2_GPS_CTRL 31', [pick(values, 'out-of-range', 'EKF2_GPS_CTRL'), pick(values, 'unknown-bits', 'EKF2_GPS_CTRL')]],
    ['values.params', '1  1  MPC_TILTMAX_AIR  95  9', [pick(values, 'out-of-range', 'MPC_TILTMAX_AIR')]]
  ];
  list.innerHTML = ROWS.map(([file, line, fs]) => `<li class="pg-meta-row"><p class="pg-meta-line"><code>${esc(line)}</code><small>${esc(fs[0].where.replace(/^[^:]*/, file))}</small></p>${fs.map(f => `<p class="pg-meta-f"><i class="pg-sev" data-s="${f.sev}">${f.sev === 'note' ? 'note' : 'BLOCK'}</i><b>${f.check}</b><span>${esc(f.msg)}</span></p>`).join('')}</li>`).join('');
  const rows = $$('li', list);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-f')); },
    final() { rows.forEach(r => r.classList.add('in', 'is-f')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(300, me); r.classList.add('is-f'); await wait(800, me); }
    }
  });
})();

/* 4. Rules: the tuning findings, the step bar, then a team's own rule and its mistakes */
(() => {
  const el = $('#d-rules'), list = $('#pg-rules');
  const fs = findingsOf(CAP.tuning.out).filter(f => !['unknown-param', 'out-of-range'].includes(f.check));
  const step = (0.25 - 0.15) / 0.15;
  list.innerHTML = fs.map(f => `<li class="pg-rule" data-s="${f.sev}"><p class="pg-rule-h"><i class="pg-sev" data-s="${f.sev}">${f.sev === 'warn' ? 'WARN' : 'BLOCK'}</i><b>${f.check}</b><small>${esc(f.where)}</small></p><p class="pg-rule-m">${esc(f.msg)}</p>${f.check === 'rate-gain-step' ? `<div class="pg-step" aria-hidden="true"><span class="pg-step-bar"><i style="--w:${(step / 1) * 100}%"></i><b style="--x:50%"></b></span><span class="pg-step-l"><span style="--x:0">0%</span><span style="--x:50%">limit 50%</span><span class="is-v" style="--x:${step * 100}%">${Math.round(step * 100)}%</span><span>100%</span></span></div>` : ''}<p class="pg-rule-why">${esc(f.why)}</p></li>`).join('');
  const rows = $$('li', list);
  $('#pg-toml').textContent = ['version = 1', 'firmware = "px4"', '', '[[rule]]', 'id = "survey-speed"', 'params = ["MPC_XY_CRUISE", "MPC_XY_VEL_MAX"]', 'max = 8', 'severity = "block"', 'reason = "The survey camera blurs above 8 m/s; site permit caps speed at 10 m/s."'].join('\n');
  const survey = CAP.survey.out.filter(t => /^(faster|1 eff|  MPC|BLOCK|blocked)/.test(t) || /^ {7}MPC/.test(t));
  const term = miniTerm($('#pg-rule-err'), [
    ['cmd', CAP.survey.cmd], ...survey.map(t => [toneOf(t), t]), ['dim', `# exit ${CAP.survey.exit}`],
    ['dim', '# the same rule with a misspelt parameter, without a reason, with a misspelt key'],
    ...runLines(CAP.ruleTypo), ...runLines(CAP.ruleNoReason), ...runLines(CAP.ruleKey), ['dim', '# exit 2, each time']
  ]);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-s')); term.hide(); },
    final() { rows.forEach(r => r.classList.add('in', 'is-s')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('in'); await wait(500, me); r.classList.add('is-s'); await wait(900, me); }
      await wait(300, me);
      await term.play(me, 100);
    }
  });
})();

/* 5. Allow: the same retune with no allowance, with one, and after the value moves on */
(() => {
  const el = $('#d-allow'), seg = $('#pg-allow-seg'), nameEl = $('#pg-allow-name'), tomlEl = $('#pg-allow-toml'), exitEl = $('#pg-exit');
  const ALLOW = ['[[allow]]', 'rule = "rate-gain-step"', 'param = "MC_ROLLRATE_P"', 'value = 0.25', 'by = "A. Pilot"', 'reason = "Retuned for 13-inch props; step response checked in flight log 2026-10-02."'].join('\n');
  const RUNS = [
    { label: 'No allowance', name: 'MC_ROLLRATE_P 0.15 to 0.25', toml: '', c: CAP.retuneBlock },
    { label: 'Allowed', name: 'retune.allow.toml', toml: ALLOW, c: CAP.retuneAllowed },
    { label: 'Moved to 0.3', name: 'retune.allow.toml, unchanged', toml: ALLOW, c: CAP.retuneMoved }
  ];
  seg.innerHTML = RUNS.map((r, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(r.label)}</button>`).join('');
  const btns = $$('button', seg);
  let term = null;
  const select = i => {
    const r = RUNS[i];
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    nameEl.textContent = r.name;
    tomlEl.textContent = r.toml || 'No allowance file: the block stands.';
    tomlEl.classList.toggle('is-empty', !r.toml);
    exitEl.dataset.code = String(r.c.exit);
    $('b', exitEl).textContent = String(r.c.exit);
    term = miniTerm($('#pg-allow-term'), runLines(r.c));
  };
  const noby = miniTerm($('#pg-noby'), [['dim', '# the same allowance without its "by" line'], ...runLines(CAP.allowNoBy), ['dim', `# exit ${CAP.allowNoBy.exit}`]]);
  let d = null;
  btns.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); term.show(); exitEl.classList.add('in'); noby.show(); }));
  d = demo(el, {
    reset() { select(0); term.hide(); exitEl.classList.remove('in'); noby.hide(); },
    final() { select(RUNS.length - 1); term.show(); exitEl.classList.add('in'); noby.show(); },
    async play(me) {
      d.stopAuto = false;
      for (let i = 0; i < RUNS.length; i++) {
        if (d.stopAuto) return;
        select(i); term.hide(); exitEl.classList.remove('in');
        await wait(500, me);
        if (d.stopAuto) return;
        await term.play(me, 45);
        exitEl.classList.add('in');
        await wait(1500, me);
      }
      await noby.play(me, 120);
    }
  });
})();

/* 6. CI: the branch's file with the --format github annotations placed on their lines; CI jobs from GitHub's API */
(() => {
  const el = $('#d-ci'), box = $('#pg-diff');
  const notes = {};
  CAP.gitGithub.out.forEach(t => {
    const m = t.match(/^::(error|warning) file=[^,]+,line=(\d+),title=paramguard ([^:]+)::(.*)$/);
    if (m) (notes[m[2]] = notes[m[2]] || []).push({ level: m[1], check: m[3], msg: m[4].replace(/%25/g, '%') });
  });
  const before = CAP.vehicleLines;
  const lines = CAP.tuningLines;
  const from = 17, to = 28;
  let html = `<p class="pg-diff-name"><code>vehicle.params</code><span>branch survey-tuning against main</span></p><ol class="pg-diff-lines">`;
  for (let n = from; n <= to; n++) {
    const t = lines[n - 1], changed = t !== before[n - 1];
    html += `<li class="pg-dl${changed ? ' is-ch' : ''}"><span class="pg-ln">${n}</span><span class="pg-sign">${changed ? '+' : ''}</span><code>${esc(t.replace(/\t/g, '  '))}</code></li>`;
    (notes[n] || []).forEach(a => {
      const [msg] = a.msg.split(/(?<=[a-z0-9?)]\.) (?=[A-Z])/);
      html += `<li class="pg-ann" data-l="${a.level}"><b>${a.level === 'error' ? 'Error' : 'Warning'}: paramguard ${esc(a.check)}</b><span>${esc(msg)}</span></li>`;
    });
  }
  box.innerHTML = html + '</ol>';
  const anns = $$('.pg-ann', box);
  const JOBS = [
    ['test (3.11)', 'ruff, mypy, pytest', 31],
    ['test (3.12)', 'ruff, mypy, pytest', 35],
    ['test (3.13)', 'ruff, mypy, pytest', 18],
    ['ardupilot-rules', 'make ap-meta: ArduCopter 4.6.3 metadata', 24],
    ['action', 'uses: ./ on the example, then the cleanup must fail', 13],
    ['sitl', 'PX4 SITL, both files flown and measured', 700]
  ];
  const fmt = s => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s} s`);
  $('#pg-jobs').innerHTML = JOBS.map(([n, what, s]) => `<li class="pg-job"><span class="pg-tick" aria-hidden="true"></span><span class="pg-job-n"><b>${esc(n)}</b><small>${esc(what)}</small></span><span class="pg-job-bar"><i style="--w:${Math.max(2, (s / 700) * 100)}%"></i></span><span class="pg-job-s">${fmt(s)}</span></li>`).join('');
  const jobs = $$('.pg-job', el);
  demo(el, {
    reset() { anns.forEach(a => a.classList.remove('in')); jobs.forEach(j => j.classList.remove('is-run', 'is-ok')); },
    final() { anns.forEach(a => a.classList.add('in')); jobs.forEach(j => { j.classList.remove('is-run'); j.classList.add('is-ok'); }); },
    async play(me) {
      await wait(400, me);
      for (const a of anns) { a.classList.add('in'); await wait(650, me); }
      await wait(300, me);
      jobs.forEach(j => j.classList.add('is-run'));
      const order = JOBS.map((j, i) => [j[2], i]).sort((a, b) => a[0] - b[0]);
      for (const [, i] of order) { await wait(i === 5 ? 900 : 260, me); jobs[i].classList.remove('is-run'); jobs[i].classList.add('is-ok'); }
    }
  });
})();

/* Measured: distance from home after the link loss, both runs, drawn from the logged telemetry */
(() => {
  const svg = $('#pg-chart'), fig = $('#pg-fly');
  const W = 720, H = 260, L = 46, R = 14, T = 14, B = 34, X0 = -10, X1 = 215, Y1 = 320;
  const x = s => L + (s - X0) / (X1 - X0) * (W - L - R), y = d => T + (1 - d / Y1) * (H - T - B);
  let g = '';
  for (let d = 0; d <= 300; d += 100) g += `<line class="pg-grid" x1="${L}" x2="${W - R}" y1="${y(d)}" y2="${y(d)}"/><text class="pg-ax" x="${L - 8}" y="${y(d) + 4}" text-anchor="end">${d}</text>`;
  for (let s = 0; s <= 210; s += 30) g += `<text class="pg-ax" x="${x(s)}" y="${H - 12}" text-anchor="middle">${s} s</text>`;
  g += `<line class="pg-zero" x1="${x(0)}" x2="${x(0)}" y1="${T}" y2="${H - B}"/>`;
  const path = pts => pts.map(([s, d], i) => `${i ? 'L' : 'M'}${x(s).toFixed(1)} ${y(d).toFixed(1)}`).join('');
  const b = FLY.before, a = FLY.after;
  const fsX = x(b.failsafe_after_s), ldX = x(b.landed_after_s);
  g += `<defs><clipPath id="pg-clip"><rect class="pg-wipe" x="${L}" y="0" width="${W - L - R + 2}" height="${H}"/></clipPath></defs>`;
  g += `<g clip-path="url(#pg-clip)"><path class="pg-run" data-r="after" d="${path(a.track)}"/><path class="pg-run" data-r="before" d="${path(b.track)}"/></g>`;
  g += `<g class="pg-evt"><line x1="${fsX}" x2="${fsX}" y1="${T}" y2="${H - B}"/><text x="${fsX + 6}" y="${T + 12}">Return mode, ${b.failsafe_after_s} s</text>`;
  g += `<line x1="${ldX}" x2="${ldX}" y1="${T}" y2="${H - B}"/><text x="${ldX - 6}" y="${T + 12}" text-anchor="end">landed, ${b.landed_after_s} s</text></g>`;
  g += `<text class="pg-ax pg-ax-l" x="${x(0) + 6}" y="${H - B - 8}">link lost</text>`;
  svg.innerHTML = g;
  $('#pg-fly-before').innerHTML = `With <code>vehicle.params</code>, PX4 read back <code>NAV_DLL_ACT = ${b.on_vehicle.NAV_DLL_ACT}</code>. ${b.failsafe_after_s} s after the last heartbeat it switched to Return mode, flew home and landed ${b.landed_distance_from_home_m} m from where it took off, ${b.landed_after_s} s after the loss.`;
  $('#pg-fly-tally').innerHTML = `<span>${b.distance_at_link_loss_m} m out at the loss</span><span>${a.observed_for_s} s watched after</span>`;
  $('#pg-fly-after').innerHTML = `After the cleanup it read back <code>NAV_DLL_ACT = ${a.on_vehicle.NAV_DLL_ACT}</code>, took no failsafe action at all, and at the end of the window was still ${a.distance_at_end_m} m out and ${a.altitude_at_end_m} m up, armed and holding.`;
})();
