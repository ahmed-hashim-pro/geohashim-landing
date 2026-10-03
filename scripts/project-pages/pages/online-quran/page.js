/* Data from running the app's own code offline (published 13.0.0 tree):
   resolve.json  rows returned by the verbatim LnaguageClass.GuranAya(), [surah, name, state, source]
                 afs and maher_m on the illustrative phone; dlAfter after two downloads land.
   reciters.json [id, server, surahs, hand-picked] from serverNumber() and autherRanageDetermine(). */
const RES = /*@@DATA:resolve@@*/;
const RECITERS = /*@@DATA:reciters@@*/;
const isUrl = s => s.startsWith('http');
const kindOf = src => (isUrl(src) ? 'url' : src.startsWith('content:') ? 'ms' : 'file');
const pad3 = n => String(n).padStart(3, '0');
const rowOf = (list, n) => list.find(r => r[0] === n);
const stateClass = src => (isUrl(src) ? 'is-online' : 'is-phone');

/* Hero: the drawn phone. The rule mirrors MediaPlayerService.kt:357: a URL with no network is refused. */
(() => {
  const el = $('#d-hero');
  const SHOW = [1, 2, 18, 36, 67, 114];
  const rows = SHOW.map(n => rowOf(RES.afs, n));
  const list = $('#oq-rows');
  list.innerHTML = rows.map(([n, name, state, src]) =>
    `<li><button type="button" class="oq-row" data-n="${n}"><span class="oq-med">${n}</span><span class="oq-nm">${esc(name)}</span><span class="oq-st ${stateClass(src)}">${esc(state)}</span></button></li>`).join('');
  const btns = $$('.oq-row', list), net = $('#oq-net'), netLabel = $('#oq-net-label');
  const title = $('#oq-pl-title'), badge = $('#oq-badge'), toast = $('#oq-toast'), steps = $('#oq-steps');
  const netBtns = $$('[data-net]', el);
  let online = true, toastT = 0, touched = false;
  const setNet = on => {
    online = on;
    net.classList.toggle('is-off', !on);
    netLabel.textContent = on ? 'Wi-Fi' : 'Airplane mode';
    netBtns.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.net === 'on') === on)));
  };
  const log = (cls, html) => {
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = html;
    steps.appendChild(li);
    while (steps.children.length > 5) steps.firstElementChild.remove();
  };
  const host = src => src.replace(/^https:\/\/([^/]+).*$/, '$1');
  const stopPlayer = () => { btns.forEach(b => b.classList.remove('is-playing')); title.textContent = 'Nothing playing'; badge.hidden = true; };
  const tap = (n, keepToast) => {
    const [, name, , src] = rowOf(rows, n);
    clearTimeout(toastT);
    toast.classList.remove('is-on');
    stopPlayer();
    if (!online && isUrl(src)) {
      toast.classList.add('is-on');
      if (!keepToast) toastT = setTimeout(() => toast.classList.remove('is-on'), 2600);
      log('is-no', `<b>${esc(name)}</b> resolves to a URL and there is no network: “Network Error”, and the player stops.`);
      return;
    }
    $(`.oq-row[data-n="${n}"]`, list).classList.add('is-playing');
    title.textContent = name;
    badge.hidden = false;
    badge.textContent = isUrl(src) ? 'Streaming' : 'Offline';
    badge.className = `oq-badge ${isUrl(src) ? 'is-stream' : 'is-offline'}`;
    log('is-ok', isUrl(src)
      ? `<b>${esc(name)}</b> streams from ${host(src)}.`
      : `<b>${esc(name)}</b> plays from the phone${src.startsWith('content:') ? ', found through MediaStore' : ''}. No network needed.`);
  };
  const flip = on => { setNet(on); log('is-net', on ? 'Back online.' : 'Airplane mode on.'); };
  btns.forEach(b => b.addEventListener('click', () => { touched = true; tap(+b.dataset.n); }));
  netBtns.forEach(b => b.addEventListener('click', () => {
    touched = true;
    const on = b.dataset.net === 'on';
    if (on !== online) flip(on);
  }));
  const blank = () => { clearTimeout(toastT); toast.classList.remove('is-on'); stopPlayer(); steps.replaceChildren(); setNet(true); };
  demo(el, {
    reset() { touched = false; blank(); },
    final() { blank(); tap(2); flip(false); tap(18); tap(67); tap(2, true); },
    async play(me) {
      await wait(800, me);
      if (touched) return;
      tap(2);
      await wait(2000, me);
      if (touched) return;
      flip(false);
      await wait(1100, me);
      if (touched) return;
      tap(18);
      await wait(1900, me);
      if (touched) return;
      tap(67);
      await wait(1900, me);
      if (touched) return;
      tap(2, true);
    }
  });
})();

/* 1. Reciters: one tile per reciter, filled by the share of the 114 surahs it has */
(() => {
  const el = $('#d-reciters'), host = $('#oq-tiles'), tip = $('#oq-tile-tip');
  host.innerHTML = RECITERS.map(([, , n, hand], i) =>
    `<span class="oq-tile${n < 114 ? ' is-part' : ''}${hand ? ' is-hand' : ''}" style="--f:${r1(n / 114 * 100)}%" data-i="${i}"></span>`).join('');
  const tiles = $$('.oq-tile', host);
  const describe = i => {
    const [id, srv, n, hand] = RECITERS[i];
    tip.innerHTML = `<b>${esc(id)}</b>  server${srv}  ${n === 114 ? 'all 114 surahs' : `${n} of 114 surahs, ${hand ? 'hand-picked list' : 'one span'}`}`;
  };
  host.addEventListener('pointerover', e => { const t = e.target.closest('.oq-tile'); if (t) describe(+t.dataset.i); });
  const per = {};
  RECITERS.forEach(r => { per[r[1]] = (per[r[1]] || 0) + 1; });
  const servers = Object.keys(per).map(Number).sort((a, b) => a - b);
  const top = Math.max(...Object.values(per));
  $('#oq-servers').innerHTML = '<div class="bars">' + servers.map(s =>
    `<div class="bar-row"><span>server${s}</span><span class="bar"><i style="--w:${r1(per[s] / top * 100)}%"></i></span><span>${per[s]}</span></div>`).join('') + '</div>';
  $('#oq-part-table tbody').innerHTML = RECITERS.filter(r => r[2] < 114).map(([id, s, n, h]) =>
    `<tr><td><code>${esc(id)}</code></td><td class="n">${s}</td><td class="n">${n}</td><td>${h ? 'Hand-picked' : 'One span'}</td></tr>`).join('');
  const bars = $$('#oq-servers .bar i');
  const nFull = $('#oq-n-full'), nPart = $('#oq-n-part'), nHand = $('#oq-n-hand');
  const tally = upto => {
    let f = 0, p = 0, h = 0;
    for (let i = 0; i < upto; i++) { const [, , n, hand] = RECITERS[i]; if (n === 114) f++; else p++; if (hand) h++; }
    nFull.textContent = f; nPart.textContent = p; nHand.textContent = h;
  };
  demo(el, {
    reset() { tiles.forEach(t => t.classList.remove('in')); bars.forEach(b => { b.style.width = '0'; }); tally(0); tip.textContent = 'Hover a tile for its reciter.'; },
    final() { tiles.forEach(t => t.classList.add('in')); bars.forEach(b => { b.style.width = ''; }); tally(RECITERS.length); },
    async play(me) {
      await wait(400, me);
      for (let i = 0; i < tiles.length; i++) {
        tiles[i].classList.add('in');
        if (i % 3 === 2 || i === tiles.length - 1) { tally(i + 1); await wait(28, me); }
      }
      describe(RECITERS.findIndex(r => r[0] === 'maher_m'));
      await wait(500, me);
      for (const b of bars) { b.style.width = ''; await wait(90, me); }
    }
  });
})();

/* 2. Phone first: each surah checked against the folder, then MediaStore, then turned into a URL */
(() => {
  const el = $('#d-lookup'), host = $('#oq-chips'), out = $('#oq-row-out');
  const steps = $$('#oq-ladder li'), nums = Object.fromEntries($$('#oq-ladder em').map(e => [e.dataset.n, e]));
  const urlCode = $('#oq-ladder [data-step="url"] code');
  host.innerHTML = Array.from({ length: 114 }, (_, i) => `<span class="oq-chip" data-n="${i + 1}">${i + 1}</span>`).join('');
  const chips = $$('.oq-chip', host);
  const SERVER = { afs: 'https://server8.mp3quran.net/…', maher_m: 'https://server12.mp3quran.net/…' };
  const SLOW = { afs: new Set([1, 2, 18, 36, 67, 114]), maher_m: new Set([78, 79, 114]) };
  let rec = 'afs';
  // The same format the capture printed: "%s %-14s %-10s %s"
  const line = r => `${pad3(r[0])} ${r[1].padEnd(14)} ${r[2].padEnd(10)} ${r[3]}`;
  const summary = rows => {
    const phone = rows.filter(r => !isUrl(r[3])).length;
    return `surahs ${rows.length}  from phone ${phone}  online ${rows.length - phone}`;
  };
  const show = (lines, sum) => {
    out.replaceChildren(...lines.map(t => { const s = document.createElement('span'); s.textContent = t; return s; }));
    if (sum) { const s = document.createElement('span'); s.className = 'is-sum'; s.textContent = sum; out.appendChild(s); }
  };
  const setCounts = c => { for (const k in nums) nums[k].textContent = c[k]; };
  const clearSteps = () => steps.forEach(s => s.classList.remove('is-check', 'is-hit', 'is-miss'));
  function prime() {
    const have = new Set(RES[rec].map(r => r[0]));
    chips.forEach(c => { c.className = 'oq-chip'; c.classList.toggle('is-out', !have.has(+c.dataset.n)); });
    urlCode.textContent = SERVER[rec];
    clearSteps();
    setCounts({ file: 0, ms: 0, url: 0 });
    show([], '');
  }
  function settleAll() {
    prime();
    const c = { file: 0, ms: 0, url: 0 };
    for (const r of RES[rec]) { const k = kindOf(r[3]); c[k]++; chips[r[0] - 1].classList.add(`is-${k}`); }
    setCounts(c);
    show(RES[rec].filter(r => SLOW[rec].has(r[0])).slice(-4).map(line), summary(RES[rec]));
  }
  const d = demo(el, {
    reset: prime,
    final: settleAll,
    async play(me) {
      prime();
      await wait(400, me);
      const c = { file: 0, ms: 0, url: 0 }, lines = [];
      for (const r of RES[rec]) {
        const k = kindOf(r[3]), chip = chips[r[0] - 1], slow = SLOW[rec].has(r[0]);
        chip.classList.add('is-cur');
        if (slow) {
          for (const s of ['file', 'ms', 'url']) {
            const li = steps.find(x => x.dataset.step === s);
            li.classList.add('is-check');
            await wait(260, me);
            li.classList.remove('is-check');
            li.classList.add(s === k ? 'is-hit' : 'is-miss');
            if (s === k) break;
          }
        }
        chip.classList.remove('is-cur');
        chip.classList.add(`is-${k}`);
        c[k]++;
        setCounts(c);
        if (slow) {
          lines.push(line(r));
          show(lines.slice(-4), '');
          await wait(520, me);
          clearSteps();
        } else {
          await wait(16, me);
        }
      }
      show(lines.slice(-4), summary(RES[rec]));
    }
  });
  const choose = name => {
    rec = name;
    $$('[data-rec]', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rec === name)));
  };
  $$('[data-rec]', el).forEach(b => b.addEventListener('click', () => { choose(b.dataset.rec); d.start(); }));
  d.prepare = () => choose('afs');
})();

/* 3. The network check, as MediaPlayerService.kt:357-365 writes it */
(() => {
  const el = $('#d-gate'), gate = $('#oq-gate'), toast = $('#oq-g-toast');
  const rows = $$('.oq-g-row', gate), btns = $$('[data-gnet]', el), toks = rows.map(r => $('.oq-g-tok', r));
  const still = fn => { toks.forEach(t => { t.style.transition = 'none'; }); fn(); gate.getBoundingClientRect(); toks.forEach(t => { t.style.transition = ''; }); };
  const OK = { file: 'prepare(), plays offline', ms: 'prepare(), plays offline', url: 'prepare(), streams' };
  let online = false, userPicked = false;
  const setNet = on => { online = on; btns.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.gnet === 'on') === on))); };
  const refused = row => !online && row.dataset.src === 'url';
  const clear = () => still(() => {
    rows.forEach(r => { r.classList.remove('is-ok', 'is-no'); r.style.setProperty('--p', '0'); $('.oq-g-out', r).textContent = ''; });
    toast.classList.remove('is-on');
  });
  const settle = row => {
    const no = refused(row);
    row.style.setProperty('--p', no ? '.36' : '1');
    row.classList.add(no ? 'is-no' : 'is-ok');
    $('.oq-g-out', row).textContent = no ? '“Network Error”, service stopped' : OK[row.dataset.src];
    if (no) toast.classList.add('is-on');
  };
  const instant = on => { setNet(on); clear(); still(() => rows.forEach(settle)); };
  async function pass(on, me) {
    setNet(on);
    clear();
    await wait(450, me);
    for (const r of rows) { settle(r); await wait(650, me); }
  }
  btns.forEach(b => b.addEventListener('click', async () => {
    userPicked = true;
    setNet(b.dataset.gnet === 'on');
    clear();
    await new Promise(res => setTimeout(res, 60));
    rows.forEach(settle);
  }));
  demo(el, {
    reset() { userPicked = false; setNet(true); clear(); },
    final() { instant(false); },
    async play(me) {
      await pass(true, me);
      await wait(1300, me);
      if (userPicked) return;
      await pass(false, me);
    }
  });
})();

/* 4. Download two surahs, then the lookup runs again */
(() => {
  const el = $('#d-keep'), wrap = $('.oq-dl', el), list = $('#oq-dl-rows'), bar = $('#oq-dl-bar'), label = $('#oq-dl-label');
  const SHOW = [1, 2, 18, 36, 67, 114], PICK = [18, 36];
  // Captured before any file exists: every row is a stream URL.
  const BEFORE = {
    1: 'https://server8.mp3quran.net/afs/001.mp3', 2: 'https://server8.mp3quran.net/afs/002.mp3',
    18: 'https://server8.mp3quran.net/afs/018.mp3', 36: 'https://server8.mp3quran.net/afs/036.mp3',
    67: 'https://server8.mp3quran.net/afs/067.mp3', 114: 'https://server8.mp3quran.net/afs/114.mp3'
  };
  const AFTER = Object.fromEntries(SHOW.map(n => [n, rowOf(RES.dlAfter, n)]));
  const phoneAfter = RES.dlAfter.filter(r => !isUrl(r[3])).length;
  list.innerHTML = SHOW.map(n =>
    `<li data-n="${n}"><span class="oq-box" aria-hidden="true"></span><span class="oq-med">${n}</span><span class="oq-dl-name">${esc(AFTER[n][1])}<span class="oq-dl-src"></span></span><span class="oq-st"></span><i class="oq-prog" aria-hidden="true"></i></li>`).join('');
  const items = Object.fromEntries($$('li', list).map(li => [+li.dataset.n, li]));
  const nPhone = $('#oq-dl-phone'), nOnline = $('#oq-dl-online'), nAll = $('#oq-dl-all');
  const paint = (n, after) => {
    const li = items[n], src = after ? AFTER[n][3] : BEFORE[n], st = $('.oq-st', li);
    st.className = `oq-st ${stateClass(src)}`;
    st.textContent = after ? AFTER[n][2] : 'online';
    $('.oq-dl-src', li).textContent = src;
  };
  const stats = phone => { nPhone.textContent = phone; nOnline.textContent = 114 - phone; nAll.textContent = 114 - phone; };
  const start = () => {
    wrap.classList.remove('is-select');
    bar.classList.remove('is-press');
    label.textContent = 'Download all list';
    SHOW.forEach(n => { paint(n, false); items[n].classList.remove('is-picked', 'is-flip', 'is-done'); });
    const bars = SHOW.map(n => $('.oq-prog', items[n]));
    bars.forEach(b => { b.style.transition = 'none'; });
    SHOW.forEach(n => items[n].style.setProperty('--p', '0'));
    list.getBoundingClientRect();
    bars.forEach(b => { b.style.transition = ''; });
    stats(0);
  };
  demo(el, {
    reset: start,
    final() {
      start();
      SHOW.forEach(n => paint(n, true));
      stats(phoneAfter);
    },
    async play(me) {
      start();
      await wait(500, me);
      bar.classList.add('is-press');
      await wait(250, me);
      bar.classList.remove('is-press');
      wrap.classList.add('is-select');
      label.textContent = 'Select surahs to download';
      await wait(700, me);
      for (const [i, n] of PICK.entries()) {
        items[n].classList.add('is-picked');
        label.textContent = `Download selected (${i + 1})`;
        await wait(550, me);
      }
      bar.classList.add('is-press');
      await wait(300, me);
      bar.classList.remove('is-press');
      wrap.classList.remove('is-select');
      label.textContent = 'Download all list';
      let phone = 0;
      for (const n of PICK) {
        items[n].style.setProperty('--p', '1');
        await wait(1200, me);
        items[n].classList.add('is-done');
        items[n].classList.remove('is-picked');
        paint(n, true);
        items[n].classList.add('is-flip');
        stats(++phone);
        await wait(350, me);
      }
    }
  });
})();

/* 5. Eight prints, then the first open of the default one */
(() => {
  const el = $('#d-mushaf'), shelf = $('#oq-shelf'), open = $('#oq-open');
  // [app title, pages, host, single-page downloads, default], from the published providers
  const PRINTS = [
    ['Classic Madani Mushaf', 604, 'android.quran.com', true, false],
    ['Madani Mushaf (new print)', 604, 'android.quran.com', true, false],
    ['Tajweed Mushaf', 604, 'android.quran.com', false, false],
    ['Naskh Mushaf', 612, 'android.quran.com', true, false],
    ['Shemerly Mushaf', 521, 'android.quran.com', true, false],
    ['Qaloon Mushaf', 604, 'android.quran.com', true, false],
    ['Warsh Mushaf', 604, 'android.quran.com', true, false],
    ['Madinah Colored', 604, 'own S3 bucket', false, true]
  ];
  shelf.innerHTML = PRINTS.map(([t, p, h, per, def]) =>
    `<div class="oq-print${def ? ' is-default' : ''}${per ? '' : ' is-zip'}"><span class="oq-spine" style="--h:${Math.round(p / 612 * 130)}">${p}</span><b>${esc(t)}</b><small>${esc(h)}${per ? '' : ', zip only'}${def ? ', default' : ''}</small></div>`).join('');
  const spines = $$('.oq-spine', shelf), steps = $$('li', open), ask = $('.oq-ask', open), zip = $('#oq-zip-bar');
  const reset = () => {
    shelf.classList.add('is-reset');
    open.classList.add('is-reset');
    steps.forEach(s => s.classList.remove('in', 'is-now'));
    ask.classList.remove('is-yes');
    zip.style.transition = 'none';
    zip.style.setProperty('--p', '0');
    zip.getBoundingClientRect();
    zip.style.transition = '';
  };
  demo(el, {
    reset,
    final() {
      reset();
      shelf.classList.remove('is-reset');
      open.classList.remove('is-reset');
      steps.forEach(s => s.classList.add('in'));
      ask.classList.add('is-yes');
      zip.style.setProperty('--p', '1');
    },
    async play(me) {
      await wait(300, me);
      spines.forEach((s, i) => { s.style.transitionDelay = `${i * 70}ms`; });
      shelf.classList.remove('is-reset');
      await wait(900, me);
      spines.forEach(s => { s.style.transitionDelay = ''; });
      const step = async (i, ms) => { steps.forEach(s => s.classList.remove('is-now')); steps[i].classList.add('in', 'is-now'); await wait(ms, me); };
      await step(0, 900);
      await step(1, 600);
      ask.classList.add('is-yes');
      await wait(500, me);
      await step(2, 150);
      zip.style.setProperty('--p', '1');
      await wait(1500, me);
      await step(3, 700);
      steps.forEach(s => s.classList.remove('is-now'));
    }
  });
})();

/* Keeping your place: LastPage.sq run in SQLite, verbatim output */
(() => {
  const el = $('#d-recent'), slots = $$('.oq-slot', el), log = $('#oq-sql'), dropped = $('#oq-dropped');
  // [page added, resulting rows as [page, _ID], newest first]
  const RUN = [
    [1, [[1, 1]]],
    [50, [[50, 2], [1, 1]]],
    [293, [[293, 3], [50, 2], [1, 1]]],
    [582, [[582, 4], [293, 3], [50, 2]]],
    [50, [[50, 5], [582, 4], [293, 3]]]
  ];
  const text = (p, rows) => `addLastPage(${p}, 3)  ->  last_pages: ${rows.map(([pg, id]) => `page ${pg} (_ID ${id})`).join(', ')}`;
  const render = (k, animate) => {
    const [p, rows] = RUN[k];
    slots.forEach((s, i) => {
      const r = rows[i];
      s.classList.remove('is-new');
      s.classList.toggle('is-full', !!r);
      s.innerHTML = r ? `<b>${r[0]}</b><small>_ID ${r[1]}</small>` : '';
      if (animate && r && i === 0) { s.getBoundingClientRect(); s.classList.add('is-new'); }
    });
    const prev = k > 0 ? RUN[k - 1][1].map(r => r[0]) : [];
    const gone = prev.filter(pg => pg !== p && !rows.some(r => r[0] === pg));
    dropped.textContent = gone.length ? `Page ${gone.join(', ')} fell out: only the newest 3 are kept.` : k === 4 ? 'Page 50 moved to the front with a new _ID.' : '';
  };
  const lineEl = (cls, t) => { const s = document.createElement('span'); if (cls) s.className = cls; s.textContent = t; return s; };
  const blank = () => { slots.forEach(s => { s.className = 'oq-slot'; s.innerHTML = ''; }); dropped.textContent = ''; log.replaceChildren(lineEl('cmd', 'python3 run_lastpage.py LastPage.sq 1 50 293 582 50')); };
  demo(el, {
    reset: blank,
    final() { blank(); RUN.forEach(([p, rows]) => log.appendChild(lineEl('', text(p, rows)))); render(RUN.length - 1, false); },
    async play(me) {
      blank();
      await wait(500, me);
      for (let k = 0; k < RUN.length; k++) {
        render(k, true);
        log.appendChild(lineEl('', text(...RUN[k])));
        await wait(k === 3 || k === 4 ? 1500 : 900, me);
      }
    }
  });
})();
