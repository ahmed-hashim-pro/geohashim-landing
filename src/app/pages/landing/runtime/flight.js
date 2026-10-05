// The terrain flight behind everything below the hero: the page is a flight that climbs out of the
// hero, cruises through the middle and lands on the footer.
// The ground and clouds are images drawn ahead of time (scripts/terrain/bake.mjs). Nothing here
// repaints while scrolling: each moving part is its own layer, moved by transform or faded by
// opacity, and a style is only written when its value changes.
import { $, r1, clamp } from './scope.js';
import { TERRAIN_LABELS } from './terrain-labels.js';

const TILE = 1536, GROUND_RATE = .5, CLOUD_RATE = 1.15;
const CRUISE = 8500, CLOUD = 4500, CLOUD_DEPTH = 700;
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

function phaseFor(y, t, alt, start, heroBottom) {
  if (y < start) return y < heroBottom * .35 ? 'Holding short' : 'Takeoff roll';
  if (t >= .998) return 'Landed';
  if (Math.abs(alt - CLOUD) < CLOUD_DEPTH) return 'In cloud';
  if (t > .84) return alt < 1800 ? 'Final approach' : 'Descending';
  if (alt < 400) return 'Rotate';
  if (alt < CLOUD - CLOUD_DEPTH) return 'Climbing';
  if (alt < CLOUD + CLOUD_DEPTH + 1100) return 'On top';
  if (alt < CRUISE - 60) return 'Climbing';
  return 'Cruise';
}

const vsText = v => {
  const r = Math.round(v / 100) * 100;
  return Math.abs(r) < 100 ? 'Level' : `${r > 0 ? '↑' : '↓'} ${Math.abs(r).toLocaleString('en-US')} ft/min`;
};

export function initFlight(scope, reduce) {
  const zoom = $('.tm-zoom'), ground = $('.tm-ground'), spots = $('.tm-spots'), mef = $('.tm-mef');
  const haze = $('.tm-haze'), cloudZoom = $('.tm-czoom'), cloudPan = $('.tm-cpan'), fog = $('.tm-fog');
  const altiVal = $('.alti-val'), altiNote = $('.alti-note'), altiTape = $('.alti-tape'), altiVs = $('.alti-vs');

  // Labels stay live text so they are sharp; their positions come from the bake. Three tiles cover any viewport.
  const thrice = inner => [0, 1, 2].map(n => `<g transform="translate(0 ${n * TILE})">${inner}</g>`).join('');
  spots.innerHTML = thrice(
    TERRAIN_LABELS.elev.map(([x, y, a, t]) => `<text class="c-elev" text-anchor="middle" dy="3.5" transform="translate(${x} ${y}) rotate(${a})">${t}</text>`).join('') +
    TERRAIN_LABELS.spot.map(([x, y, t]) => `<circle class="c-peak" cx="${x}" cy="${y}" r="2.2"/><text class="c-spot" x="${x + 6}" y="${y + 4}">${t}</text>`).join(''));
  mef.innerHTML = thrice(TERRAIN_LABELS.mef.map(([x, y, a, b]) => `<text class="c-mef" x="${x}" y="${y}" text-anchor="middle">${a}<tspan dy="-13" class="c-mef-h">${b}</tspan></text>`).join(''));

  // The images are only requested once the page has loaded, so they never compete with the first paint.
  const ready = () => document.documentElement.classList.add('map-ready');
  if (document.readyState === 'complete') ready(); else scope.on(window, 'load', ready, { once: true });

  const written = new WeakMap();
  function put(el, prop, value) {
    let seen = written.get(el);
    if (!seen) written.set(el, seen = {});
    if (seen[prop] === value) return;
    seen[prop] = value;
    el.style[prop] = value;
  }
  const putText = (el, text) => { if (el.textContent !== text) el.textContent = text; };

  // The aircraft's shadow sits on the ground beside the route's arrowhead and drifts away as it climbs.
  const head = $('#route-head');
  const shadow = head.cloneNode(true);
  shadow.removeAttribute('id');
  shadow.setAttribute('class', 'route-head route-shadow');
  head.parentNode.insertBefore(shadow, head);

  let alt = 0, lastAlt = 0, lastT = 0, vs = 0, vsTimer = 0;
  // Leaving the page disposes the scope, which also drops a pending vertical-speed reset.
  scope.observe({ disconnect: () => clearTimeout(vsTimer) });

  function update(y, heroBottom, docH) {
    const motion = !reduce.matches;
    const start = heroBottom - innerHeight * .6, end = Math.max(start + 1, docH - innerHeight);
    const t = clamp((y - start) / (end - start), 0, 1);
    alt = y < start ? 0 : CRUISE * Math.min(smooth(0, .22, t), 1 - smooth(.84, 1, t));
    const k = alt / CRUISE;
    if (motion) {
      put(zoom, 'transform', `scale(${(1.9 - .9 * k).toFixed(3)})`);
      put(ground, 'transform', `translate3d(0, ${(-((y * GROUND_RATE) % TILE)).toFixed(1)}px, 0)`);
      // Below the cloud deck you look past it, in it everything fogs, above it the tops shrink with distance.
      const above = alt - CLOUD;
      const seen = above > -CLOUD_DEPTH ? smooth(-CLOUD_DEPTH, CLOUD_DEPTH * .4, above) : 0;
      // Never fully transparent: a hidden layer is first painted when the clouds appear, a long task mid-scroll.
      put(cloudZoom, 'opacity', String(Math.max(.01, Math.round(seen * 68) / 100)));
      if (seen > 0) {
        put(cloudZoom, 'transform', `scale(${clamp(4300 / Math.max(above + 900, 1), .95, 3.2).toFixed(3)})`);
        put(cloudPan, 'transform', `translate3d(0, ${(-((y * CLOUD_RATE) % TILE)).toFixed(1)}px, 0)`);
      }
      put(fog, 'opacity', String(Math.round(Math.max(0, 1 - Math.abs(above) / CLOUD_DEPTH) * 62) / 100));
    } else {
      put(zoom, 'transform', 'none');
      put(ground, 'transform', 'none');
      put(cloudZoom, 'opacity', '0');
      put(fog, 'opacity', '0');
    }
    put(haze, 'opacity', String(Math.round(45 * k) / 100));
    // Charts are read differently by height: spot heights low down, the big maximum-elevation figures up high.
    put(spots, 'opacity', clamp(1 - k * 1.7, 0, 1).toFixed(2));
    put(mef, 'opacity', Math.min(1, .35 + k * 1.5).toFixed(2));

    putText(altiVal, `${(Math.round(alt / 100) * 100).toLocaleString('en-US')} ft`);
    const phase = phaseFor(y, t, alt, start, heroBottom);
    if (altiNote.textContent !== phase) {
      altiNote.textContent = phase;
      altiNote.classList.remove('is-new');
      void altiNote.offsetWidth;
      altiNote.classList.add('is-new');
    }
    put(altiTape, 'transform', `translateY(${r1(alt % 1000 / 1000 * 40)}px)`);
    // Vertical speed comes from how fast the page is scrolled, eased so it reads like a needle.
    const now = performance.now();
    if (lastT && now - lastT < 500) vs += (clamp((alt - lastAlt) / ((now - lastT) / 60000), -9000, 9000) - vs) * .25;
    lastAlt = alt;
    lastT = now;
    putText(altiVs, vsText(vs));
    clearTimeout(vsTimer);
    vsTimer = setTimeout(() => { vs = 0; putText(altiVs, 'Level'); }, 260);
  }

  // Runs after the route is drawn, so the shadow can follow the arrowhead.
  function afterRoute(at) {
    if (reduce.matches || alt < 30 || !at.on) {
      put(shadow, 'visibility', 'hidden');
      return;
    }
    const k = alt / CRUISE, off = 8 + 64 * k;
    put(shadow, 'visibility', 'visible');
    put(shadow, 'transform', `translate3d(${r1(at.x + off * .75)}px, ${r1(at.y + off)}px, 0) rotate(${at.ang}deg) scale(${(1 - .4 * k).toFixed(2)})`);
    put(shadow, 'opacity', String(Math.round((.42 - .18 * k) * 100) / 100));
  }

  return { update, afterRoute };
}
