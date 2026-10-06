/* Data generated offline from the deployed code at commit 9dabcfc */
const RUN = /*@@DATA:run@@*/;
const MINUS = n => (n < 0 ? `−${-n}` : n > 0 ? `+${n}` : '0');


/* Hero terminal: verbatim lines from the offline runs at commit 9dabcfc */
const ORC = '[Orchestrator]';
const SC = {
  city: `| "City council approves new cycle lanes for the river district"`,
  plants: `| "Winter care for houseplants: less water, more light"`,
  solar: `| "10 Things You Won't Believe About Solar Panels!!"`,
  library: `| "Local library extends weekend opening hours"`,
  rail: `| "Rail operator publishes revised spring timetable"`
};
PAGE.terminal = {
  scenes: {
    held: [
      ['cmd', 'node offline-cycle.js --no-offset'],
      ['out', `${ORC} ⛔ Blocked: "Sponsored: the best mattress deals this week" matches title contains "sponsored"`],
      ['out', `${ORC} Pre-filter: skipped 1 already-drafted URL(s)`],
      ['out', `${ORC} Pre-filter: skipped 1 URL(s) matching admin blocklist`],
      ['out', `[AI Analyzer] ⚠ Quality issues found (2), applied -20 penalty: Potential clickbait title: matches pattern "you won'?t believe", Multiple exclamation marks in title`],
      ['cut', '[queue, enrichment and scoring lines trimmed]'],
      ['out', `${ORC} ── Article Scores (threshold: 60) ──`],
      ['out', `${ORC} ✗ FAIL | Overall: 56.2 | R:62 Q:58 T:20 ${SC.city}`],
      ['out', `${ORC} ✗ FAIL | Overall: 54.0 | R:58 Q:60 T:10 ${SC.plants}`],
      ['out', `${ORC} ✗ FAIL | Overall: 42.0 | R:50 Q:35 T:30 ${SC.solar}`],
      ['out', `${ORC} ✗ FAIL | Overall: 43.8 | R:45 Q:52 T:5 ${SC.library}`],
      ['out', `${ORC} ✗ FAIL | Overall: 45.2 | R:50 Q:48 T:10 ${SC.rail}`],
      ['err', `${ORC} No articles meet quality threshold for drafting`],
      ['dim', `${ORC} No more unanalyzed articles in the queue to top up from`],
      ['out', `${ORC}   Unique to draft   : 0 / 1 max`],
      ['out', `${ORC}   Exit reason       : queue exhausted`],
      ['out', `${ORC} No non-duplicate articles available to draft`],
      ['out', 'Drafted: 0 articles'],
      ['dim', '[harness] articleGenerator.generateDraft calls: []']
    ],
    cleared: [
      ['cmd', 'node offline-cycle.js'],
      ['cut', '[the same scrape, pre-filter and scoring as the held run, trimmed]'],
      ['out', `${ORC} ── Article Scores (threshold: 50) ──`],
      ['ok', `${ORC} ✓ PASS | Overall: 54.0 | R:58 Q:60 T:10 ${SC.plants}`],
      ['out', `${ORC} ✗ FAIL | Overall: 42.0 | R:50 Q:35 T:30 ${SC.solar}`],
      ['out', `${ORC} ✗ FAIL | Overall: 43.8 | R:45 Q:52 T:5 ${SC.library}`],
      ['out', `${ORC} ✗ FAIL | Overall: 45.2 | R:50 Q:48 T:10 ${SC.rail}`],
      ['ok', `${ORC} ✓ PASS | Overall: 56.2 | R:62 Q:58 T:20 ${SC.city}`],
      ['out', `${ORC} Per-model threshold: 60 -10 = 50 (model: claude-haiku-4-5)`],
      ['out', `${ORC}   Unique to draft   : 1 / 1 max`],
      ['out', `${ORC}   Exit reason       : filled draft slots`],
      ['out', `${ORC} Generating 1 drafts...`],
      ['ok', '[Article Generator] ✓ Generated 1/1 drafts'],
      ['cut', '[save lines from the stubbed database trimmed]'],
      ['ok', `${ORC} ✓ Generated 1/1 drafts`],
      ['out', 'Drafted: 1 articles'],
      ['dim', '[harness] articleGenerator.generateDraft calls: ["City council approves new cycle lanes for the river district"]']
    ],
    quota: [
      ['cmd', 'node offline-quota.js'],
      ['dim', 'period 2026-10'],
      ['ok', 'Pro, 499 used: allowed, counter now 500'],
      ['err', 'Pro, 500 used: QuotaExceededError: AI generation cap reached (500/500 this period). Upgrade the plan to continue.'],
      ['err', 'No plan, 10 used: QuotaExceededError: AI generation cap reached (10/10 this period). Upgrade the plan to continue.'],
      ['ok', 'Enterprise, 9999 used: allowed, counter now 10000']
    ]
  },
  order: ['held', 'cleared', 'quota'],
  first: 'held'
};

/* 1. The one-token probe */
(() => {
  const el = $('#d-start'), list = $('#ms-probe'), job = $$('#ms-jobline > span');
  const TRANSIENT = '[AI Analyzer] Model probe transient (continuing): overloaded_error';
  list.innerHTML = RUN.probe.map(p => `<li class="ms-pr${p.stop ? ' is-stop' : ''}">
      <div class="ms-pr-top"><code>${esc(p.model)}</code><span class="ms-pr-wire" aria-hidden="true"><i></i></span><span class="ms-pr-code">${p.status}</span></div>
      <div class="ms-pr-out"><span class="ms-pr-kind">${p.kind}</span><b>${p.stop ? 'Job fails before any article is scored' : 'Run continues'}</b></div>
      <p class="ms-pr-msg">${esc(p.msg || TRANSIENT)}</p>
    </li>`).join('');
  const rows = $$('.ms-pr', list);
  const show = (r, step) => { r.classList.toggle('is-sent', step >= 1); r.classList.toggle('is-back', step >= 2); r.classList.toggle('is-done', step >= 3); };
  demo(el, {
    reset() { rows.forEach(r => show(r, 0)); job.forEach(s => s.classList.add('is-off')); },
    final() { rows.forEach(r => show(r, 3)); job.forEach(s => s.classList.remove('is-off')); },
    async play(me) {
      for (const s of job) { s.classList.remove('is-off'); await wait(260, me); }
      await wait(300, me);
      for (const r of rows) {
        show(r, 1); await wait(420, me);
        show(r, 2); await wait(300, me);
        show(r, 3); await wait(650, me);
      }
    }
  });
})();

/* 2. Scrape and pre-filter */
(() => {
  const el = $('#d-scrape'), list = $('#ms-feed'), bins = $('#ms-bins'), lines = $$('#ms-scrape-term > span');
  const short = u => u.replace(/^https?:\/\//, '');
  const SAY = {
    queued: () => 'Queued for scoring',
    drafted: s => `Normalised to <code>${esc(short(s.norm))}</code>, the source URL of an existing article`,
    blocked: s => `Matches ${esc(s.match)}`
  };
  list.innerHTML = RUN.scraped.map(s => `<li class="ms-it" data-out="${s.out}">
      <p class="ms-it-t">${esc(s.title)}</p>
      <p class="ms-it-u">${esc(short(s.url))}</p>
      <p class="ms-it-why">${SAY[s.out](s)}</p>
    </li>`).join('');
  const items = $$('.ms-it', list);
  const count = { queued: $('[data-bin="queued"] dd', bins), drafted: $('[data-bin="drafted"] dd', bins), blocked: $('[data-bin="blocked"] dd', bins) };
  const tally = upto => {
    const n = { queued: 0, drafted: 0, blocked: 0 };
    RUN.scraped.slice(0, upto).forEach(s => { n[s.out]++; });
    for (const k in n) count[k].textContent = n[k];
  };
  demo(el, {
    reset() { items.forEach(i => i.classList.remove('in', 'is-judged')); tally(0); lines.forEach(l => l.classList.add('is-off')); },
    final() { items.forEach(i => i.classList.add('in', 'is-judged')); tally(items.length); lines.forEach(l => l.classList.remove('is-off')); },
    async play(me) {
      for (const i of items) { i.classList.add('in'); await wait(110, me); }
      await wait(500, me);
      for (const [k, i] of items.entries()) {
        i.classList.add('is-judged');
        tally(k + 1);
        await wait(i.dataset.out === 'queued' ? 280 : 900, me);
      }
      await wait(300, me);
      for (const l of lines) { l.classList.remove('is-off'); await wait(320, me); }
    }
  });
})();

/* 3. Scoring: three numbers become one */
(() => {
  const el = $('#d-score'), list = $('#ms-scores');
  const W = { r: .5, q: .4, t: .1 };
  const ISSUE = { 'Multiple exclamation marks in title': 'more than one exclamation mark' };
  const why = i => i.issues.map(s => (/^Potential clickbait/.test(s) ? 'clickbait phrasing' : ISSUE[s] || s)).join(', ');
  const fmt = v => (Math.round(v * 10) / 10).toFixed(1);
  list.innerHTML = RUN.items.map(i => `<li class="ms-sc">
      <p class="ms-sc-t">${esc(i.title)}</p>
      <div class="ms-sc-bars">
        <span class="ms-sb" style="--c:var(--blue);--v:${i.r}"><i></i><b>${i.r}</b></span>
        <span class="ms-sb${i.penalty ? ' has-pen' : ''}" style="--c:var(--magenta);--v:${i.q};--a:${i.qa}"><i></i><s></s><b>${i.penalty ? `<del>${i.q}</del> ${i.qa}` : i.q}</b></span>
        <span class="ms-sb" style="--c:var(--water);--v:${i.t}"><i></i><b>${i.t}</b></span>
      </div>
      ${i.penalty ? `<p class="ms-pen">−${i.penalty} quality: ${esc(why(i))}</p>` : ''}
      <p class="ms-sc-calc"><span>0.5 × ${i.r} + 0.4 × ${i.qa} + 0.1 × ${i.t}</span> = <b data-v="${i.overall}">${fmt(i.overall)}</b></p>
    </li>`).join('');
  const rows = $$('.ms-sc', list);
  const check = RUN.items.map(i => Math.abs(W.r * i.r + W.q * i.qa + W.t * i.t - i.overall) < .05);
  if (check.includes(false)) console.warn('score data mismatch');
  const setNum = (b, v) => { b.textContent = fmt(v); };
  demo(el, {
    reset() { rows.forEach(r => { r.classList.remove('in', 'is-pen', 'is-sum'); setNum($('.ms-sc-calc b', r), 0); }); },
    final() { rows.forEach(r => { r.classList.add('in', 'is-pen', 'is-sum'); const b = $('.ms-sc-calc b', r); setNum(b, +b.dataset.v); }); },
    async play(me) {
      for (const r of rows) {
        r.classList.add('in');
        await wait(520, me);
        if ($('.has-pen', r)) { r.classList.add('is-pen'); await wait(900, me); }
        r.classList.add('is-sum');
        const b = $('.ms-sc-calc b', r), target = +b.dataset.v;
        for (let k = 1; k <= 8; k++) { setNum(b, target * ease(k / 8)); await wait(32, me); }
        setNum(b, target);
        await wait(280, me);
      }
    }
  });
})();

/* 4. The gate: the platform threshold, moved by the model's offset and clamped */
(() => {
  const el = $('#d-hold'), chart = $('#ms-chart'), sel = $('#ms-model'), base = $('#ms-base'), baseV = $('#ms-base-v'), chk = $('#ms-off');
  const formula = $('#ms-formula'), verdict = $('#ms-verdict');
  const S = { off: $('#ms-s-off'), eff: $('#ms-s-eff'), clr: $('#ms-s-clr'), dr: $('#ms-s-dr'), calls: $('#ms-s-calls') };
  const PROV = { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google', xai: 'xAI', deepseek: 'DeepSeek', mistral: 'Mistral', groq: 'Groq' };
  const byId = Object.fromEntries(RUN.models.map(m => [m.id, m]));
  const groups = {};
  RUN.models.forEach(m => { (groups[m.provider] = groups[m.provider] || []).push(m); });
  sel.innerHTML = Object.entries(groups).map(([p, ms]) => `<optgroup label="${PROV[p]}">${ms.map(m => `<option value="${m.id}">${esc(m.label)} (${MINUS(m.offset)})</option>`).join('')}</optgroup>`).join('');
  // The Lambda's effectiveModelParams() for every model at 0, 5, … 100; Sonnet 4.6's row has offset 0.
  const NO_OFFSET = RUN.table['claude-sonnet-4-6'];
  const items = RUN.items.map((it, k) => ({ ...it, k })).sort((a, b) => b.overall - a.overall);
  const scores = RUN.items.map(i => i.overall).sort((a, b) => a - b);
  const p75 = scores[Math.min(scores.length - 1, Math.floor(scores.length * .75))];
  const median = scores[Math.floor(scores.length / 2)], best = scores[scores.length - 1];
  const st = { model: 'claude-haiku-4-5', base: 60, on: true };
  let touched = false;

  chart.innerHTML = `<div class="ms-plotwrap">
      <div class="ms-zones" aria-hidden="true"><i class="ms-zone lo"></i><i class="ms-zone hi"></i></div>
      <div class="ms-shift" aria-hidden="true"><i></i></div>
      <div class="ms-baseline" aria-hidden="true"></div>
      <div class="ms-hold" aria-hidden="true"><i></i><i></i><i class="d"></i><i class="d"></i><span></span></div>
      <ol class="ms-rows">${items.map(i => `<li class="ms-row" data-k="${i.k}"><p class="ms-row-t"><span>${esc(i.title)}</span></p>
        <div class="ms-track"><i class="ms-bar" style="--v:${i.overall}"></i><span class="ms-tag"><b>${i.overall.toFixed(1)}</b><em></em></span></div></li>`).join('')}</ol>
      <div class="ms-axis" aria-hidden="true">${[0, 20, 40, 60, 80, 100].map(v => `<span style="left:${v}%">${v}</span>`).join('')}</div>
    </div>`;
  const wrapEl = $('.ms-plotwrap', chart), hold = $('.ms-hold', chart), holdLab = $('span', hold), baseLine = $('.ms-baseline', chart), shift = $('.ms-shift', chart);
  const rowEls = items.map(i => $(`.ms-row[data-k="${i.k}"]`, chart));

  function render(showBars = true) {
    const m = byId[st.model];
    const off = st.on ? m.offset : 0;
    const eff = (st.on ? RUN.table[st.model] : NO_OFFSET)[st.base / 5];
    sel.value = st.model;
    base.value = String(st.base);
    baseV.textContent = st.base;
    chk.checked = st.on;
    formula.innerHTML = `<span>${esc(m.label)}${st.on ? '' : ', offset off'}</span><code>clamp(round(${st.base} + ${off < 0 ? `(${MINUS(off)})` : off}), 20, 95) = <b>${eff}</b></code>`;
    hold.style.left = `${eff}%`;
    holdLab.textContent = eff;
    baseLine.style.left = `${st.base}%`;
    baseLine.classList.toggle('is-on', eff !== st.base);
    shift.style.left = `${Math.min(eff, st.base)}%`;
    shift.style.width = `${Math.abs(eff - st.base)}%`;
    shift.classList.toggle('is-on', eff !== st.base);
    shift.classList.toggle('is-up', eff > st.base);
    const cleared = items.filter(i => i.overall >= eff);
    const drafted = cleared.slice(0, 1);
    rowEls.forEach((r, n) => {
      const it = items[n], ok = it.overall >= eff, top = drafted.includes(it);
      r.classList.toggle('is-clear', showBars && ok);
      r.classList.toggle('is-held', showBars && !ok);
      r.classList.toggle('is-top', showBars && top);
      $('.ms-tag em', r).textContent = !showBars ? '' : top ? 'Drafted' : ok ? 'Cleared' : 'Held';
    });
    S.off.textContent = st.on ? MINUS(off) : '0, off';
    S.eff.textContent = eff;
    S.clr.textContent = `${cleared.length} of ${items.length}`;
    S.dr.textContent = drafted.length;
    S.calls.textContent = drafted.length ? '3 to 6' : '0';
    const rec = Math.max(30, Math.min(eff - 5, Math.floor(p75) - 5));
    if (!showBars) verdict.innerHTML = '';
    else if (!cleared.length) {
      verdict.className = 'ms-verdict is-held';
      verdict.innerHTML = `<p class="ms-log">[Orchestrator] No articles meet quality threshold for drafting</p>` +
        (rec < eff ? `<p><b>Quality threshold may be too high.</b> Across the 5 articles analyzed, the median score was ${median} (top quartile ${p75}, best ${best}). Try lowering Min quality score to <b>${rec}</b> in Platform → Automation Defaults to let some articles through.</p>` : '');
    } else {
      verdict.className = 'ms-verdict is-clear';
      verdict.innerHTML = (off !== 0 ? `<p class="ms-log">[Orchestrator] Per-model threshold: ${st.base} ${off >= 0 ? '+' : ''}${off} = ${eff} (model: ${esc(st.model)})</p>` : '') +
        `<p class="ms-log">[Orchestrator]   Unique to draft   : 1 / 1 max</p><p>The top item goes to the drafter${cleared.length > 1 ? `; the other ${cleared.length - 1 === 1 ? 'one stays' : `${cleared.length - 1} stay`} in the queue, analysed but not drafted` : ''}.</p>`;
    }
  }
  const user = fn => () => { touched = true; fn(); render(true); };
  sel.addEventListener('change', user(() => { st.model = sel.value; }));
  base.addEventListener('input', user(() => { st.base = +base.value; }));
  chk.addEventListener('change', user(() => { st.on = chk.checked; }));
  demo(el, {
    reset() {
      touched = false;
      Object.assign(st, { model: 'claude-haiku-4-5', base: 60, on: false });
      wrapEl.classList.add('is-reset');
      rowEls.forEach(r => r.classList.remove('in'));
      render(false);
    },
    final() {
      Object.assign(st, { model: 'claude-haiku-4-5', base: 60, on: true });
      wrapEl.classList.remove('is-reset');
      rowEls.forEach(r => r.classList.add('in'));
      render(true);
    },
    async play(me) {
      await wait(300, me);
      wrapEl.classList.remove('is-reset');
      await wait(500, me);
      for (const r of rowEls) { r.classList.add('in'); await wait(240, me); }
      await wait(500, me);
      if (!touched) render(true);
      await wait(2600, me);
      if (!touched) { st.on = true; render(true); }
    }
  });
})();

/* 5. Drafting: the voice is one phrase in the system prompt */
(() => {
  const el = $('#d-draft'), seg = $('#ms-voices'), pre = $('#ms-prompt'), calls = $$('#ms-calls li');
  const VOICES = Object.keys(RUN.voices);
  seg.innerHTML = VOICES.map(v => `<button type="button" data-v="${v}" aria-pressed="false">${v[0].toUpperCase() + v.slice(1)}</button>`).join('');
  const btns = $$('button', seg);
  let voice = 'journalistic';
  const paint = (v, typed = null) => {
    const txt = RUN.voices[v], phrase = `Editorial voice: ${v}.`, at = txt.indexOf(phrase);
    const shown = typed === null ? v : v.slice(0, typed);
    pre.innerHTML = `${esc(txt.slice(0, at))}<mark>Editorial voice: ${esc(shown)}${typed === null ? '.' : ''}</mark>${esc(txt.slice(at + phrase.length))}`;
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
  };
  async function typeVoice(v, me) {
    voice = v;
    for (let k = 0; k <= v.length; k++) { paint(v, k); await wait(38, me); }
    paint(v);
  }
  const d = demo(el, {
    reset() { voice = 'journalistic'; paint(voice); calls.forEach(c => c.classList.remove('on')); },
    final() { paint(voice); calls.forEach(c => c.classList.add('on')); },
    async play(me) {
      await wait(700, me);
      for (const v of ['casual', 'academic', 'opinion']) { await typeVoice(v, me); await wait(900, me); }
      for (const c of calls) { c.classList.add('on'); await wait(380, me); }
    }
  });
  btns.forEach(b => b.addEventListener('click', () => { voice = b.dataset.v; paint(voice); calls.forEach(c => c.classList.add('on')); }));
  d.prepare = () => { voice = 'journalistic'; };
})();

/* 6. Publishing: only an editor's decision changes the status */
(() => {
  const el = $('#d-publish'), pub = $('#ms-pub'), stEl = $('#ms-st'), say = $('#ms-ed-say'), dest = $$('#ms-dest li');
  let act = 'approve';
  const set = (status, line, lit) => {
    stEl.textContent = status;
    pub.dataset.status = status;
    say.textContent = line;
    dest.forEach((li, k) => {
      li.classList.toggle('on', k < lit);
      $('span', li).textContent = status === 'published' && k < lit ? 'includes it' : 'leaves it out';
    });
  };
  const END = { approve: ['published', 'An editor approved it', 3], reject: ['rejected', 'An editor rejected it; it is hidden', 0] };
  const d = demo(el, {
    reset() { pub.classList.remove('is-acting'); set('drafted', 'Waiting for an editor', 0); },
    final() { pub.classList.remove('is-acting'); set(...END[act]); },
    async play(me) {
      await wait(700, me);
      pub.classList.add('is-acting');
      say.textContent = act === 'approve' ? 'Editor clicks Approve' : 'Editor clicks Reject';
      await wait(900, me);
      pub.classList.remove('is-acting');
      const [status, line, lit] = END[act];
      set(status, line, 0);
      await wait(500, me);
      for (let k = 1; k <= lit; k++) { set(status, line, k); await wait(380, me); }
    }
  });
  const choose = a => { act = a; $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.act === a))); };
  $$('.seg button', el).forEach(b => b.addEventListener('click', () => { choose(b.dataset.act); d.start(); }));
  d.prepare = () => choose('approve');
})();
