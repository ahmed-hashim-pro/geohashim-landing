/* tsz. Every report below is verbatim output of the release binary at 511e505; ROWS is
   rows.json, the first values of two datasets with the bit costs of a port checked against the binary. */
const ROWS = /*@@DATA:rows@@*/;
const tzLines = (cls, text) => text.split('\n').map(t => [cls, t]);
const COMPARE = `file                          points     gorilla     chimp  chimp128      auto   bits/point; auto's value codecs
noaa-sf-air-temp.csv          87,637       34.10     32.85     14.29      4.36   decimal 22
noaa-sf-water-level.csv       73,661       62.47     53.83     34.16      8.35   decimal 18
noaa-sf-wind-speed.csv        87,637       62.03     49.42     21.31      7.65   decimal 22
uci-power-active-2007.csv    521,669       52.05     44.23     27.53      9.18   decimal 128
uci-power-voltage-2007.csv   521,669       52.43     49.14     22.33     10.63   decimal 128
wikipedia-hourly-views.csv     8,784       28.34     32.77     39.77     23.72   decimal 3`;
const ENCODE = `521,669 points, 128 blocks of up to 4096, codec auto
  timestamps       66,425 bytes    1.02 bits/point
  values          531,488 bytes    8.15 bits/point
  framing             901 bytes    0.01 bits/point
  total           598,814 bytes    9.18 bits/point  (13.9x smaller than 16 bytes/point)`;
const INSPECT = `power.tsz: 521,669 points in 128 blocks
  timestamps       66,425 bytes    1.02 bits/point
  values          531,488 bytes    8.15 bits/point
  framing             901 bytes    0.01 bits/point
  total           598,814 bytes    9.18 bits/point  (13.9x smaller than 16 bytes/point)
  timestamp codecs  delta-of-delta 126, adaptive 2
  value codecs      decimal 128`;
const SPECIALS = ['1.5', '-0', 'NaN', 'inf', '0x7ff8000000c0ffee', '5e-324'];
const SPEC_BITS = ['0x3ff8000000000000', '0x8000000000000000', '0x7ff8000000000000', '0x7ff0000000000000', '0x7ff8000000c0ffee', '0x0000000000000001'];
const SPEC_TEXT = ['1.5', '-0', 'NaN', 'inf', 'NaN', '0.' + '0'.repeat(323) + '5'];
const SPEC_ENCODE = `6 points, 1 blocks of up to 4096, codec auto
  timestamps           10 bytes   13.33 bits/point
  values               32 bytes   42.67 bits/point
  framing               9 bytes   12.00 bits/point
  total                51 bytes   68.00 bits/point  (1.9x smaller than 16 bytes/point)`;
const BAD = [
  ['tsz encode bad.csv -o bad.tsz', 'tsz: bad.csv:4: value "four" is not a number'],
  ['tsz encode bad2.csv', 'tsz: bad2.csv:2: timestamp "2.5" is not an integer'],
  ['tsz encode bad3.csv', 'tsz: bad3.csv:2: value "" is not a number'],
  ['tsz encode specials.csv --codec zstd', 'tsz: unknown codec "zstd" (expected gorilla, chimp, chimp128 or auto)'],
  ['tsz decode specials.csv', 'tsz: specials.csv: not a tsz stream (bad magic bytes)']
];

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
  const t = (cmd, out, code) => [['cmd', cmd], ...tzLines(code === 2 ? 'err' : 'out', out)];
  PAGE.terminal = {
    scenes: {
      compare: [['dim', '# the six datasets in data/, every codec, bits per point'], ...t('tsz compare *.csv', COMPARE)],
      encode: [['dim', '# a year of one-minute household power readings'], ...t('tsz encode uci-power-active-2007.csv -o power.tsz', ENCODE), gap, ...t('tsz inspect power.tsz', INSPECT), gap,
        ...t('tsz decode power.tsz | head -3', '1167609600,2.58\n1167609660,2.552\n1167609720,2.55')],
      bits: [['dim', '# Illustrative input: values that break naive float handling'], ['cmd', 'cat specials.csv'], ...SPECIALS.map((v, i) => ['out', `${1700000000 + 60 * i},${v}`]), gap,
        ...t('tsz encode specials.csv -o specials.tsz', SPEC_ENCODE), gap, ['cmd', 'tsz decode specials.tsz --bits'], ...SPEC_BITS.map((v, i) => ['ok', `${1700000000 + 60 * i},${v}`])],
      bad: [['dim', '# Illustrative input: bad files and bad flags, each exit 2'], ['cmd', 'cat bad.csv'], ...tzLines('out', 'time,kw\n1,2.5\n2,2.75\n3,four'), gap,
        ...BAD.flatMap(([c, e]) => [['cmd', c], ['err', e], ['cmd', 'echo $?'], ['out', '2']])]
    },
    order: ['compare', 'encode', 'bits', 'bad'],
    first: 'compare'
  };
})();

/* Tests per target, from cargo test --locked */
PAGE.tests = [['tests/roundtrip.rs', 7, 'var(--blue)'], ['tests/cli.rs', 5, 'var(--magenta)'], ['tests/corrupt.rs', 4, 'var(--yellow)'], ['src/bits.rs, unit', 3, 'var(--water)'], ['src/decimal.rs, unit', 1, 'var(--green)'], ['src/lib.rs, doc test', 1, 'var(--ink-2)']];

/* 1. Read: six values, their bit patterns, then the parser's refusals */
(() => {
  const el = $('#d-read'), list = $('#tz-bits');
  list.innerHTML = SPECIALS.map((v, i) => {
    const txt = SPEC_TEXT[i];
    const shown = txt.length > 24 ? `${txt.slice(0, 8)}…${txt.slice(-4)}<small>${txt.length} characters</small>` : esc(txt);
    return `<li class="tz-bit-row"><code class="tz-in">${esc(v)}</code><code class="tz-hex">${SPEC_BITS[i]}</code><span class="tz-out"><code>${shown}</code></span></li>`;
  }).join('');
  const rows = $$('li', list);
  const term = miniTerm($('#tz-read-err'), BAD.slice(0, 3).flatMap(([c, e]) => [['cmd', c], ['err', e]]).concat([['dim', '# each one exits 2']]));
  const set = (r, s) => { r.classList.toggle('in', s >= 1); r.classList.toggle('is-h', s >= 2); r.classList.toggle('is-t', s >= 3); };
  demo(el, {
    reset() { rows.forEach(r => set(r, 0)); term.hide(); },
    final() { rows.forEach(r => set(r, 3)); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { set(r, 1); await wait(140, me); }
      for (const r of rows) { set(r, 2); await wait(260, me); }
      for (const r of rows) { set(r, 3); await wait(200, me); }
      await wait(500, me);
      await term.play(me, 150);
    }
  });
})();

/* 2. Gorilla: each XOR as 64 cells, the stored window marked */
(() => {
  const el = $('#d-gorilla'), list = $('#tz-xor'), sum = $('#tz-gor-sum'), btns = $$('[data-ser]', el);
  const NAMES = { wl: 'water level, metres', at: 'air temperature, °C' };
  let rows = [];
  const why = r => (r.kind === 'zero' ? 'same value' : r.kind === 'reuse' ? 'window reused' : 'new window');
  const render = key => {
    const S = ROWS[key];
    let win = null;
    list.innerHTML = S.rows.map((r, i) => {
      if (!i) return `<li class="tz-x-row tz-first"><code class="tz-x-v">${r.text}</code><span class="tz-x-raw">First value of the block: all 64 bits, <code>0x${r.hex}</code></span><span class="tz-x-c"><b>64</b> bits</span></li>`;
      const b = r.xor;
      let lo = -1, hi = -1;
      if (r.kind === 'new') {
        const lz = Math.min(b.indexOf('1'), 31), tz = 63 - b.lastIndexOf('1');
        win = [lz, tz]; lo = lz; hi = 63 - tz;
      } else if (r.kind === 'reuse') { lo = win[0]; hi = 63 - win[1]; }
      const cells = Array.from(b, (c, k) => `<i class="${c === '1' ? 'b1' : ''}${k >= lo && k <= hi ? ' w' : ''}"></i>`).join('');
      return `<li class="tz-x-row" data-k="${r.kind}"><code class="tz-x-v">${r.text}</code><span class="tz-x-bits" role="img" aria-label="${b.split('1').length - 1} of 64 bits set">${cells}</span><span class="tz-x-c"><b>${r.g}</b> bit${r.g === 1 ? '' : 's'}<small>${why(r)}</small></span></li>`;
    }).join('');
    rows = $$('li', list);
    const block = Math.ceil(S.gsum / 8).toLocaleString('en-US');
    sum.innerHTML = `These ten: <b>${S.rows.reduce((a, r) => a + r.g, 0)} bits</b>. The whole first block of ${NAMES[key]}: <b>${block} bytes</b> of values, ${(S.gsum / 4096).toFixed(2)} bits each.`;
  };
  const pick = key => btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ser === key)));
  let d = null;
  btns.forEach(b => b.addEventListener('click', () => { if (d) d.stopAuto = true; pick(b.dataset.ser); render(b.dataset.ser); rows.forEach(r => r.classList.add('in', 'is-w')); sum.classList.add('in'); }));
  const show = async (me, key) => {
    pick(key); render(key); sum.classList.remove('in');
    for (const r of rows) { r.classList.add('in'); await wait(110, me); }
    await wait(300, me);
    for (const r of rows) { r.classList.add('is-w'); await wait(170, me); }
    sum.classList.add('in');
  };
  d = demo(el, {
    reset() { pick('wl'); render('wl'); sum.classList.remove('in'); },
    final() { pick('wl'); render('wl'); rows.forEach(r => r.classList.add('in', 'is-w')); sum.classList.add('in'); },
    async play(me) {
      d.stopAuto = false;
      await wait(250, me);
      await show(me, 'wl');
      await wait(2200, me);
      if (d.stopAuto) return;
      await show(me, 'at');
    }
  });
})();

/* 3. Chimp: bits per point under the three float codecs, with csv.gz marked */
const TZ_DATA = [
  ['noaa-sf-air-temp', 34.10, 32.85, 14.29, 4.36, 28.80, 3.61],
  ['noaa-sf-water-level', 62.47, 53.83, 34.16, 8.35, 37.39, 6.43],
  ['noaa-sf-wind-speed', 62.03, 49.42, 21.31, 7.65, 31.34, 6.16],
  ['uci-power-active-2007', 52.05, 44.23, 27.53, 9.18, 33.39, 6.75],
  ['uci-power-voltage-2007', 52.43, 49.14, 22.33, 10.63, 36.35, 8.56],
  ['wikipedia-hourly-views', 28.34, 32.77, 39.77, 23.72, 56.22, 21.22]
];
(() => {
  const el = $('#d-chimp'), box = $('#tz-chimp'), MAX = 72;
  const bar = (cls, v) => `<span class="tz-cb ${cls}" style="--s:${(v / MAX).toFixed(4)}"><i></i><b>${v.toFixed(2)}</b></span>`;
  box.innerHTML = TZ_DATA.map(([n, g, c, c128, , gz]) => `<div class="tz-crow"><p class="tz-cn"><code>${n}</code>${g > gz ? '<small>Gorilla bigger than csv.gz</small>' : ''}</p><div class="tz-cbars" style="--gz:${(gz / MAX).toFixed(4)}">${bar('tz-c-g', g)}${bar('tz-c-c', c)}${bar('tz-c-c128', c128)}<span class="tz-gz"><b>csv.gz ${gz.toFixed(2)}</b></span></div></div>`).join('')
    + `<div class="tz-axis" aria-hidden="true">${[0, 12, 24, 36, 48, 60, 72].map(v => `<span style="left:${(v / MAX * 100).toFixed(2)}%">${v}</span>`).join('')}</div>`;
  const rows = $$('.tz-crow', box);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('is-g', 'is-c', 'is-z')); },
    final() { rows.forEach(r => r.classList.add('is-g', 'is-c', 'is-z')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) { r.classList.add('is-g'); await wait(160, me); }
      await wait(500, me);
      for (const r of rows) { r.classList.add('is-z'); await wait(160, me); }
      await wait(700, me);
      for (const r of rows) { r.classList.add('is-c'); await wait(200, me); }
    }
  });
})();

/* 4. Decimal: the water levels as integers, then one broken value per block */
(() => {
  const el = $('#d-decimal'), list = $('#tz-dec'), tot = $('#tz-dec-tot'), seg = $('#tz-brk');
  const S = ROWS.wl;
  list.innerHTML = S.rows.map((r, i) => `<li class="tz-d-row"><code>${r.text}</code><span class="tz-d-n">${r.n}</span><span class="tz-d-r">${i ? r.res : 'first'}</span><span class="tz-d-c"><b>${i ? r.dc : 64}</b><span class="tz-d-l"> bits</span></span><span class="tz-d-g">${r.g}<span class="tz-d-l"> bits, Gorilla</span></span></li>`).join('');
  const rows = $$('li', list);
  const kb = b => Math.ceil(b / 8).toLocaleString('en-US');
  tot.innerHTML = `<div><dt>Gorilla, whole block</dt><dd>${kb(S.gsum)} bytes</dd><dd class="tz-sub">${(S.gsum / 4096).toFixed(2)} bits a value</dd></div><div class="tz-win"><dt>Decimal, whole block</dt><dd>${kb(S.dsum)} bytes</dd><dd class="tz-sub">${(S.dsum / 4096).toFixed(2)} bits a value, second differences, widths ${S.w1} and ${S.w2}</dd></div>`;
  const HEAD = "file     points     gorilla     chimp  chimp128      auto   bits/point; auto's value codecs";
  const BRK = [
    ['As logged', 'p.csv', '2.486', `${HEAD}\np.csv     8,192       55.62     46.52     27.00      9.01   decimal 2`],
    ['-0', 'negzero.csv', '-0', "file           points     gorilla     chimp  chimp128      auto   bits/point; auto's value codecs\nnegzero.csv     8,192       55.62     46.53     27.01     17.43   chimp128 1, decimal 1"],
    ['0.1 + 0.2', 'computed.csv', '0.30000000000000004', "file            points     gorilla     chimp  chimp128      auto   bits/point; auto's value codecs\ncomputed.csv     8,192       55.62     46.53     27.01     17.43   chimp128 1, decimal 1"],
    ['NaN', 'nan.csv', 'NaN', "file       points     gorilla     chimp  chimp128      auto   bits/point; auto's value codecs\nnan.csv     8,192       55.62     46.53     27.01     17.43   chimp128 1, decimal 1"],
    ['An extra digit', 'extra.csv', '2.5801', "file         points     gorilla     chimp  chimp128      auto   bits/point; auto's value codecs\nextra.csv     8,192       55.62     46.52     27.01     10.37   decimal 2"]
  ];
  const NOTE = ['Both blocks are printed decimals with three places.', 'A -0.0 is never n / 10^d, so its block falls back to Chimp128. The total nearly doubles.', 'A computed value is not the double any short decimal parses to. Same fallback.', 'NaN never matches. Same fallback.', 'Still a decimal, just with four places: the block stays decimal and costs a little more.'];
  seg.innerHTML = BRK.map((b, i) => `<button type="button" aria-pressed="false" data-i="${i}">${esc(b[0])}</button>`).join('');
  const bb = $$('button', seg), out = $('#tz-brk-out');
  let term = null;
  const select = i => {
    const [, f, v, txt] = BRK[i];
    bb.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    term = miniTerm(out, [['dim', `# line 10: 1167610140,${v}`], ['cmd', `tsz compare ${f}`], ...tzLines('out', txt), ['dim', `# ${NOTE[i]}`]]);
  };
  let d = null;
  bb.forEach((b, i) => b.addEventListener('click', () => { if (d) d.stopAuto = true; select(i); term.show(); }));
  const stage = (r, s) => { r.classList.toggle('in', s >= 1); r.classList.toggle('is-c', s >= 2); };
  d = demo(el, {
    reset() { rows.forEach(r => stage(r, 0)); tot.classList.remove('in'); select(0); term.hide(); },
    final() { rows.forEach(r => stage(r, 2)); tot.classList.add('in'); select(1); term.show(); },
    async play(me) {
      d.stopAuto = false;
      await wait(300, me);
      for (const r of rows) { stage(r, 1); await wait(120, me); }
      for (const r of rows) { stage(r, 2); await wait(180, me); }
      tot.classList.add('in');
      await wait(900, me);
      for (let i = 0; i < BRK.length; i++) {
        if (d.stopAuto) return;
        select(i); term.hide();
        await term.play(me, 90);
        await wait(1100, me);
      }
    }
  });
})();

/* 5. Auto: three blocks, every codec measured, the cheapest written */
(() => {
  const el = $('#d-auto'), box = $('#tz-blocks');
  const B = [
    ['Block 1', 'Printed, one decimal place', [['gorilla', 57.86], ['chimp', 50.48], ['chimp128', 25.44], ['decimal', 12.28]], 'decimal'],
    ['Block 2', 'A palette of 20 computed floats', [['gorilla', 63.77], ['chimp', 62.17], ['chimp128', 10.38], ['decimal', null]], 'chimp128'],
    ['Block 3', 'A computed sine, no repeats', [['gorilla', 66.96], ['chimp', 55.09], ['chimp128', 55.21], ['decimal', null]], 'chimp']
  ];
  box.innerHTML = B.map(([n, what, cs, win]) => `<div class="tz-blk"><p class="tz-blk-n"><b>${n}</b><small>${what}</small></p><ol class="tz-blk-bars">${cs.map(([c, v]) => `<li data-c="${c}"${c === win ? ' class="is-win"' : ''}><span>${c}</span>${v === null ? '<em>doesn’t apply</em>' : `<span class="tz-bb"><i style="--s:${(v / 72).toFixed(4)}"></i></span><b>${v.toFixed(2)}</b>`}</li>`).join('')}</ol></div>`).join('');
  const blocks = $$('.tz-blk', box);
  const term = miniTerm($('#tz-auto-term'), [['cmd', 'tsz inspect mixed.tsz'], ...tzLines('out', `mixed.tsz: 12,288 points in 3 blocks
  timestamps        1,563 bytes    1.02 bits/point
  values           38,207 bytes   24.87 bits/point
  framing              27 bytes    0.02 bits/point
  total            39,797 bytes   25.91 bits/point  (4.9x smaller than 16 bytes/point)
  timestamp codecs  delta-of-delta 3`), ['ok', '  value codecs      decimal 1, chimp128 1, chimp 1']]);
  demo(el, {
    reset() { blocks.forEach(b => b.classList.remove('in', 'is-m', 'is-p')); term.hide(); },
    final() { blocks.forEach(b => b.classList.add('in', 'is-m', 'is-p')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const b of blocks) {
        b.classList.add('in'); await wait(250, me);
        b.classList.add('is-m'); await wait(900, me);
        b.classList.add('is-p'); await wait(500, me);
      }
      await term.play(me, 90);
    }
  });
})();

/* 6. Decode: damaged streams, and the one damage it can't see */
(() => {
  const el = $('#d-decode'), list = $('#tz-dmg');
  const D = [
    ['cut.tsz', 'Cut in half, 2,686 of 5,373 bytes', 'tsz: cut.tsz: truncated tsz stream', 2],
    ['gzip.tsz', 'First four bytes swapped for gzip’s magic', 'tsz: gzip.tsz: not a tsz stream (bad magic bytes)', 2],
    ['v2.tsz', 'Version byte set to 2', 'tsz: v2.tsz: tsz format version 2 is not supported', 2],
    ['codec.tsz', 'First block’s codec byte set to 0x0f', 'tsz: codec.tsz: unknown codec byte 0x0f', 2],
    ['trail.tsz', 'One byte appended after the end marker', 'tsz: trail.tsz: corrupt tsz stream: bytes after the end marker', 2],
    ['huge.tsz', '13 bytes by hand: a block of 4,294,967,295 points', 'tsz: huge.tsz: corrupt tsz stream: block longer than MAX_BLOCK_LEN', 2],
    ['flip.tsz', 'One bit flipped in byte 2,686', 'No error. 5,000 points decoded; 1,925 values are wrong.', 0]
  ];
  list.innerHTML = D.map(([f, what, msg, code]) => `<li class="tz-dm" data-code="${code}"><p class="tz-dm-f"><code>${f}</code><small>${esc(what)}</small></p><p class="tz-dm-m"><code>${esc(msg)}</code></p><p class="tz-dm-x"><span>exit</span><b>${code}</b></p></li>`).join('');
  const rows = $$('li', list);
  demo(el, {
    reset() { rows.forEach(r => r.classList.remove('in', 'is-x')); },
    final() { rows.forEach(r => r.classList.add('in', 'is-x')); },
    async play(me) {
      await wait(300, me);
      for (const r of rows) {
        r.classList.add('in'); await wait(r.dataset.code === '0' ? 900 : 380, me);
        r.classList.add('is-x'); await wait(r.dataset.code === '0' ? 600 : 240, me);
      }
    }
  });
})();

/* 7. Verify: every dataset under every codec, then the soak */
(() => {
  const el = $('#d-verify'), grid = $('#tz-ver');
  const PTS = ['87,637', '73,661', '87,637', '521,669', '521,669', '8,784'];
  const C = ['gorilla', 'chimp', 'chimp128', 'auto'];
  grid.innerHTML = `<div class="tz-v-row tz-v-head" role="row"><span role="columnheader">File</span>${C.map(c => `<span role="columnheader">${c}</span>`).join('')}</div>`
    + TZ_DATA.map(([n], i) => `<div class="tz-v-row" role="row"><span class="tz-v-n" role="rowheader"><code>${n}.csv</code><small>${PTS[i]} points</small></span>${C.map(c => `<span class="tz-v-c" role="cell"><i aria-hidden="true"></i><span class="vh">${c} </span>ok</span>`).join('')}</div>`).join('');
  const cells = $$('.tz-v-row:not(.tz-v-head)', grid).map(r => $$('.tz-v-c', r));
  const term = miniTerm($('#tz-soak'), [
    ['dim', '# make soak: a million adversarial series, every codec, auto never bigger'],
    ['cmd', 'TSZ_SOAK=1000000 cargo test --release --locked --test roundtrip soak -- --ignored'],
    ['out', 'running 1 test'], ['out', 'test soak has been running for over 60 seconds'], ['ok', 'test soak ... ok'],
    ['out', 'test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 7 filtered out; finished in 156.46s']
  ]);
  demo(el, {
    reset() { cells.flat().forEach(c => c.classList.remove('in')); term.hide(); },
    final() { cells.flat().forEach(c => c.classList.add('in')); term.show(); },
    async play(me) {
      await wait(300, me);
      for (const row of cells) { for (const c of row) { c.classList.add('in'); await wait(70, me); } await wait(120, me); }
      await wait(400, me);
      await term.play(me, 260);
    }
  });
})();

/* Measured: auto against pco */
(() => {
  const list = $('#tz-pco');
  if (!list) return;
  list.innerHTML = TZ_DATA.map(([n, , , , a, , p]) => `<li><code>${n}</code><span>${a.toFixed(2)}</span><span>${p.toFixed(2)}</span><b>${Math.round((1 - p / a) * 100)}%</b></li>`).join('');
  list.insertAdjacentHTML('afterbegin', '<li class="tz-pco-h" aria-hidden="true"><span>Dataset</span><span>auto</span><span>pco</span><span>smaller</span></li>');
})();
