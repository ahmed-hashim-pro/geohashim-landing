'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const r1 = v => Math.round(v * 10) / 10;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
};
const ease = x => 1 - Math.pow(1 - x, 3);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* Header: menu disclosure and theme, as on the landing page */
const KEY = 'geohashim-theme';
const header = $('.site-header');
const themeHooks = [];
(() => {
  const narrowQ = matchMedia('(max-width: 899px)');
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  let chosen = null;
  try { chosen = localStorage.getItem(KEY); } catch (e) { chosen = null; }
  if (chosen !== 'light' && chosen !== 'dark') chosen = null;
  const menuBtn = $('#menu-btn'), nav = $('#site-nav');
  let menuOpen = false;
  const syncMenu = () => {
    const narrow = narrowQ.matches;
    if (!narrow) menuOpen = false;
    menuBtn.hidden = !narrow;
    nav.hidden = narrow && !menuOpen;
    menuBtn.setAttribute('aria-expanded', String(menuOpen));
  };
  const setMenu = (open, refocus) => { menuOpen = open; syncMenu(); if (!open && refocus) menuBtn.focus(); };
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  nav.addEventListener('click', e => { if (menuOpen && e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', e => { if (menuOpen && !header.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false, true); });
  narrowQ.addEventListener('change', syncMenu);
  syncMenu();
  const themeBtn = $('#theme-btn');
  const syncThemeBtn = () => themeBtn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  const setTheme = (t, remember) => {
    root.setAttribute('data-theme', t);
    if (remember) { chosen = t; try { localStorage.setItem(KEY, t); } catch (e) { /* not persisted */ } }
    syncThemeBtn();
    themeHooks.forEach(fn => fn());
  };
  themeBtn.hidden = false;
  themeBtn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true));
  darkMQ.addEventListener('change', e => { if (!chosen) setTheme(e.matches ? 'dark' : 'light', false); });
  syncThemeBtn();
})();

/* Demo plumbing: each demo plays once when it scrolls into view, replays on request,
   and jumps straight to its final state when motion is reduced. */
const STOP = Symbol('stop');
// Position-based, not a visible fraction: tall demos stacked on a phone never reach a fraction of the viewport.
const ARRIVE = { threshold: 0, rootMargin: '0px 0px -30% 0px' };
const wait = (ms, run) => new Promise((res, rej) => setTimeout(() => (run.alive ? res() : rej(STOP)), ms));
const DEMOS = {};
function demo(el, { reset, final, play }) {
  let run = null;
  const start = async () => {
    if (run) run.alive = false;
    const me = run = { alive: true };
    if (reduce.matches) { final(); return; }
    reset();
    try { await play(me); } catch (e) { if (e !== STOP) throw e; }
  };
  const replay = $('.replay', el);
  if (replay) replay.addEventListener('click', start);
  if (!reduce.matches) reset(); else final();
  const io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); }
  }, ARRIVE);
  io.observe(el);
  // `run` is for the guided tour: it takes over from the scroll trigger and resolves when the demo ends.
  return (DEMOS[el.id] = { start, run: () => { io.disconnect(); return start(); } });
}
const drawPath = (p, ms) => {
  const len = p.getTotalLength();
  p.style.transition = 'none';
  p.style.strokeDasharray = `${len} ${len}`;
  p.style.strokeDashoffset = String(len);
  p.getBoundingClientRect();
  p.style.transition = `stroke-dashoffset ${ms}ms cubic-bezier(.3, .7, .3, 1)`;
  p.style.strokeDashoffset = '0';
};

