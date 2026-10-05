// Ported from docs/mockups/mockup-7-full-flight.html; logic unchanged.
import { $, $$ } from './scope.js';

export function initGate() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* The gate: seven scenarios, one hold line */
  const tabs = $$('.tab');
  const strip = $('.tabs'), stripWrap = $('.tabs-wrap');
  const scenes = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  const stripCue = () => {
    const max = strip.scrollWidth - strip.clientWidth;
    stripWrap.classList.toggle('more-l', max > 2 && strip.scrollLeft > 2);
    stripWrap.classList.toggle('more-r', max > 2 && strip.scrollLeft < max - 2);
  };
  strip.addEventListener('scroll', stripCue, { passive: true });
  const selectTab = (i, focus) => {
    tabs.forEach((t, k) => {
      const sel = k === i;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
      scenes[k].hidden = !sel;
    });
    // scrollIntoView would also scroll the page vertically, so the strip is scrolled by hand.
    if (focus) tabs[i].focus({ preventScroll: true });
    if (strip.scrollWidth > strip.clientWidth + 2) {
      const a = tabs[i].getBoundingClientRect(), b = strip.getBoundingClientRect();
      const d = a.left < b.left + 30 ? a.left - b.left - 30 : a.right > b.right - 30 ? a.right - b.right + 30 : 0;
      if (d) strip.scrollBy({ left: d, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i, false));
    t.addEventListener('keydown', e => {
      const n = tabs.length;
      const k = { ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      selectTab(k, true);
    });
  });
  selectTab(0, false);

  const COPY = {
    write: {
      chip: { held: 'Held', crossed: 'Approved once', refused: 'Refused' },
      held: 'Held: writes need a human to approve this exact statement.',
      crossed: 'Approved once, for this exact statement.',
      changed: 'Held: this is a different statement, so it needs its own approval.',
      editing: 'Held: edit the statement, then approve or refuse it.',
      refused: 'Refused. Nothing ran.',
      empty: 'Held: there is no statement to approve.'
    },
    commit: {
      chip: { held: 'Held', crossed: 'Committed' },
      held: 'Held: a commit is applied only after it is written to the write-ahead log.',
      crossed: 'Committed. It was logged and synced to disk before being applied, so a crash replays it from the log.'
    },
    release: {
      chip: { held: 'Held', crossed: 'Published' },
      held: 'Held: a release publishes only after its tests pass.',
      crossed: 'Published to PyPI with Trusted Publishing. No stored PyPI token.'
    },
    tests: {
      chip: { held: 'Held', crossed: 'Unchanged' },
      held: 'Held: a difference counts as a regression only if it clears the run-to-run noise.',
      crossed: 'Unchanged. The difference stayed inside the noise measured across repeated runs, so nothing is flagged.'
    },
    draft: {
      chip: { held: 'Held', crossed: 'Cleared' },
      held: "Held: it is drafted only if it clears the quality threshold, adjusted for the model your workspace picked.",
      crossed: 'Cleared the threshold. It is now in line for drafting in your editorial voice.'
    },
    answer: {
      chip: { held: 'Held', declined: 'Refused locally' },
      held: 'Held: it answers only if retrieved evidence clears its confidence floor.',
      declined: 'Refused locally. No passage cleared the 0.35 similarity floor, so no model call was made.'
    },
    incident: {
      chip: { held: 'Held', crossed: 'Approved', refused: 'Rejected' },
      held: 'Held: the remediation waits for a human to approve, edit or reject it.',
      crossed: 'Executed scale_up on checkout-api (dry run).',
      refused: 'Rejected. Nothing ran.'
    }
  };
  const hl0 = $('.hl');
  $$('.hl:empty').forEach(h => { h.innerHTML = hl0.innerHTML; });
  const gates = {};
  scenes.forEach(sc => {
    const g = {
      copy: COPY[sc.dataset.scene], apron: $('.apron', sc), chip: $('.chip', sc), status: $('.status', sc),
      btns: $$('[data-when]', sc), act: a => $(`[data-act="${a}"]`, sc)
    };
    g.show = (state, msg, focusEl) => {
      g.apron.dataset.state = state;
      g.status.dataset.state = state;
      g.chip.textContent = g.copy.chip[state];
      g.status.textContent = msg;
      g.btns.forEach(b => { b.hidden = !b.dataset.when.split(' ').includes(state); });
      if (focusEl) focusEl.focus();
    };
    gates[sc.dataset.scene] = g;
  });
  const gw = gates.write;
  const stmt = $('#stmt');
  const ORIGINAL = stmt.value;
  gw.act('cross').addEventListener('click', () => {
    if (!stmt.value.trim()) { gw.status.textContent = gw.copy.empty; stmt.focus(); return; }
    stmt.readOnly = true;
    gw.show('crossed', gw.copy.crossed, gw.act('change'));
  });
  gw.act('refuse').addEventListener('click', () => {
    stmt.readOnly = true;
    gw.show('refused', gw.copy.refused, gw.act('reset'));
  });
  gw.act('change').addEventListener('click', () => {
    const before = stmt.value;
    stmt.value = before.replace(/(\bid\s*=\s*)(\d+)/i, (_, lhs, n) => lhs + (Number(n) + 1));
    stmt.readOnly = false;
    gw.show('held', stmt.value !== before ? gw.copy.changed : gw.copy.editing, stmt);
    const end = stmt.value.length;
    stmt.setSelectionRange(end, end);
  });
  gw.act('reset').addEventListener('click', () => {
    stmt.value = ORIGINAL;
    stmt.readOnly = true;
    gw.show('held', gw.copy.held, gw.act('cross'));
  });
  const ACTS = { cross: 'crossed', refuse: 'refused', decline: 'declined' };
  Object.keys(gates).forEach(k => {
    if (k === 'write') return;
    const g = gates[k];
    Object.keys(ACTS).forEach(a => {
      const b = g.act(a);
      if (b) b.addEventListener('click', () => g.show(ACTS[a], g.copy[ACTS[a]], g.act('reset')));
    });
    g.act('reset').addEventListener('click', () => g.show('held', g.copy.held, g.btns[0]));
  });

  return { stripCue };
}
