// Ported from docs/mockups/mockup-7-full-flight.html; logic unchanged.
import { $, createScope } from './scope.js';

const KEY = 'geohashim-theme';

export function initHeader(scope) {
  const root = document.documentElement;
  const on = scope.on, watch = scope.watch;
  const narrowQ = matchMedia('(max-width: 899px)');
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  let chosen = null;
  try { chosen = localStorage.getItem(KEY); } catch (e) { chosen = null; }
  if (chosen !== 'light' && chosen !== 'dark') chosen = null;

  const themeHooks = [];

  /* Header: menu disclosure and theme */
  const header = $('.site-header');
  const menuBtn = $('#menu-btn');
  const nav = $('#site-nav');
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
  on(document, 'click', e => { if (menuOpen && !header.contains(e.target)) setMenu(false); });
  on(document, 'keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false, true); });
  watch(narrowQ, syncMenu);
  syncMenu();

  const themeBtn = $('#theme-btn');
  const syncThemeBtn = () => themeBtn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  const setTheme = (t, remember) => {
    root.setAttribute('data-theme', t);
    if (remember) {
      chosen = t;
      try { localStorage.setItem(KEY, t); } catch (e) { /* not persisted; the switch still applies */ }
    }
    syncThemeBtn();
    themeHooks.forEach(fn => fn());
  };
  themeBtn.hidden = false;
  themeBtn.addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true));
  watch(darkMQ, e => { if (!chosen) setTheme(e.matches ? 'dark' : 'light', false); });
  syncThemeBtn();

  return { header, themeHooks };
}

// Header behaviour for pages without the landing runtime (privacy, terms, 404).
export function initSiteChrome() {
  const scope = createScope();
  initHeader(scope);
  return () => scope.dispose();
}
