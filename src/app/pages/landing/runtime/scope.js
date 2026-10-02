// Helpers shared by the landing runtime modules, copied from docs/mockups/mockup-7-full-flight.html.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
export const r1 = v => Math.round(v * 10) / 10;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const svgEl = (tag, attrs) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
};
export const mulberry = seed => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const ease = x => 1 - Math.pow(1 - x, 3);

// The mockup ran once per page load; in the app the page can be left and re-entered, so
// everything attached outside the page's own DOM (window, document, media queries,
// observers, animation frames) is recorded here and detached by dispose().
export function createScope() {
  const offs = [];
  const frames = new Set();
  let disposed = false;
  return {
    get disposed() { return disposed; },
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      offs.push(() => target.removeEventListener(type, fn, opts));
    },
    watch(q, fn) {
      if (q.addEventListener) {
        q.addEventListener('change', fn);
        offs.push(() => q.removeEventListener('change', fn));
      } else {
        q.addListener(fn);
        offs.push(() => q.removeListener(fn));
      }
    },
    raf(fn) {
      const id = requestAnimationFrame(t => { frames.delete(id); if (!disposed) fn(t); });
      frames.add(id);
      return id;
    },
    observe(observer) {
      offs.push(() => observer.disconnect());
      return observer;
    },
    dispose() {
      disposed = true;
      frames.forEach(id => cancelAnimationFrame(id));
      frames.clear();
      offs.splice(0).forEach(off => off());
    }
  };
}
