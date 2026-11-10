// BiomeDrive Studio: signature openings. One of a kind each: every interactive template opens with
// an interaction no other template has, chosen from the subject's own world (a thermostat for heating,
// a spirit level for a handyman, a receipt for an accountant). The headline is readable from the first
// frame, nothing moves across the words, loops pause off screen, and everything rests for reduced motion
// and thumbnails. Throwable things use GSAP's Draggable and Inertia, loaded only where needed.
import { H, addHeroes } from './kit.js?v=21';
import { tickers, pointer, onScroll, fine, lerp, clamp, ease } from './fx.js?v=21';

const { lines, photo, esc, icon, money, num, PHOTO_URL, ALT } = H;
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const rnd = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

/* ---------------- shells ---------------- */
const lede = x => `${icon(x.C.icon)}${esc(x.fill(x.t.lede || `${x.C.label} in {city} since {since}`))}`;
const copy = x => `<p class="h-lede" data-r="up">${lede(x)}</p><h1 class="d hl" data-r="lines" style="--i:1">${lines(x.t.head, x)}</h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(x.t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div>`;
// words on the left, the interaction on the right
const split = (x, k, stage, hidden = true) => `<section class="hero h-sig h-${k}" id="top"><div class="wrap grid"><div class="copy">${copy(x)}</div><div class="stage sg-${k}" data-sig="${k}" data-r="in"${hidden ? ' aria-hidden="true"' : ''}>${stage}</div></div></section>`;
// the interaction fills the screen behind the words
const over = (x, k, bg) => `<section class="hero h-terrain h-bgsig h-${k}" id="top"><div class="sg-bg sg-${k}" data-sig="${k}" aria-hidden="true">${bg}</div>
  <div class="wrap tr-in"><p class="h-lede" data-r="up">${lede(x)}</p><h1 class="d hl" data-r="lines" style="--i:1">${lines(x.t.head, x)}</h1>
  <div class="row" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(x.t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div></section>`;
const svcs = (x, n = 6) => x.C.services.slice(0, n).map(z => ({ n: x.fill(z.n), p: money(z.p, x), i: z.i }));

/* ---------------- the heroes ---------------- */
const HEROES = {
  // --- drawn on a canvas behind the words
  particles: x => over(x, 'particles', '<span class="sg-hint">Click anywhere</span>'),
  wave: x => over(x, 'wave', ''),
  petals: x => over(x, 'petals', ''),
  bubbles: x => over(x, 'bubbles', ''),
  pulse: x => over(x, 'pulse', '<span class="bpm"><b>62</b> beats a minute. Move to raise it.</span>'),
  grow: x => over(x, 'grow', ''),
  goo: x => over(x, 'goo', `<svg width="0" height="0" style="position:absolute"><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="16"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"/></filter></svg><div class="goo">${'<i></i>'.repeat(7)}</div>`),
  glitch: x => over(x, 'glitch', '<i class="gl-scan"></i><i class="gl-bar"></i>'),
  horizon: x => over(x, 'horizon', `<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice"><circle class="hz-sun" cx="1010" cy="330" r="120"/><path class="hz-1" d="M0 620 C 220 520, 420 560, 640 610 S 1080 520, 1440 600 V900 H0Z"/><path class="hz-2" d="M0 700 C 260 620, 520 700, 760 680 S 1180 620, 1440 700 V900 H0Z"/><path class="hz-3" d="M0 790 C 300 730, 640 800, 900 770 S 1260 740, 1440 790 V900 H0Z"/><rect class="hz-dusk" width="1440" height="900"/></svg>`),

  // --- an object beside the words
  switch: x => split(x, 'switch', `<svg class="lamp" viewBox="0 0 200 260"><g class="rays">${[...Array(9)].map((_, i) => `<path d="M100 96 L100 ${18 + (i % 2) * 10}" transform="rotate(${-80 + i * 20} 100 110)"/>`).join('')}</g><path class="bulb" d="M100 50a56 56 0 0 0-34 100c8 7 12 15 12 24v8h44v-8c0-9 4-17 12-24A56 56 0 0 0 100 50z"/><path class="base" d="M80 194h40M82 208h36M88 222h24"/></svg><button type="button" class="tog" role="switch" aria-checked="false" aria-label="Light switch"><i></i></button><p class="sg-note">Flip the switch</p>`, false),
  gauge: x => split(x, 'gauge', `<svg viewBox="0 0 300 300"><path class="g-track" pathLength="1" d="M61 239 A126 126 0 1 1 239 239"/><path class="g-fill" pathLength="1" d="M61 239 A126 126 0 1 1 239 239"/><circle class="g-knob" cx="150" cy="24" r="15"/></svg><div class="g-read"><b>21</b><span>°C</span><small>Drag the dial</small></div>`),
  blueprint: x => split(x, 'blueprint', `<svg viewBox="0 0 600 520">${[
    'M40 440 H560', 'M110 440 V220 H490 V440', 'M80 230 L300 80 L520 230', 'M395 142 V96 H430 V166', 'M260 440 V320 H340 V440',
    'M150 270 H220 V340 H150 Z M185 270 V340 M150 305 H220', 'M380 270 H450 V340 H380 Z M415 270 V340 M380 305 H450', 'M270 150 A30 30 0 1 1 330 150 A30 30 0 1 1 270 150',
  ].map(d => `<path class="bp" pathLength="1" d="${d}"/>`).join('')}<g class="bp-dim"><path d="M110 478 H490 M110 470 V486 M490 470 V486"/><text x="300" y="502" text-anchor="middle">11.4 m</text><path d="M548 220 V440 M540 220 H556 M540 440 H556"/><text x="566" y="336">6.2 m</text></g></svg>`),
  estimator(x) {
    const u = x.b.uk ? 'm²' : 'sq ft', max = x.b.uk ? 120 : 1200, rate = x.b.uk ? 1650 : 165;
    return split(x, 'estimator', `<div class="est" data-rate="${rate}" data-cur="${esc(x.cur)}"><p class="est-k">Rough cost, in ten seconds</p>
      <label>Size <b><output class="est-size">${max / 3 | 0}</output> ${u}</b><input type="range" min="${max / 12 | 0}" max="${max}" value="${max / 3 | 0}" step="${x.b.uk ? 1 : 10}" aria-label="Size"></label>
      <div class="est-fin" role="group" aria-label="Finish">${['Standard', 'Better', 'Best'].map((n, i) => `<button type="button" data-m="${1 + i * 0.28}" aria-pressed="${i === 1}">${n}</button>`).join('')}</div>
      <p class="est-out"><span>From</span><b class="d">${esc(x.cur)}0</b></p><small>A guide only. Your fixed quote follows a site visit.</small></div>`, false);
  },
  wipe: x => split(x, 'wipe', `${photo(x, null, 1100, 'fill', 'eager')}<span class="wp-pct"><b>0</b>% clean</span>`),
  swatches: x => split(x, 'swatches', `<div class="fan">${[['Brick', '#b5452e'], ['Marigold', '#e3a21a'], ['Sage', '#5f8a63'], ['Harbour', '#2b6f93'], ['Plum', '#6b3a5b'], ['Charcoal', '#2d2f33']].map(([n, c], i) => `<button type="button" class="chip" style="--c:${c};--k:${i}" data-c="${c}"><b>${n}</b><span>${c}</span></button>`).join('')}</div><p class="sg-note">Pick a colour: the whole page changes</p>`, false),
  scribble: x => split(x, 'scribble', `${photo(x, null, 1000, 'fill', 'eager')}<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><path class="sc" pathLength="1" d="M96 150c40-46 150-52 196-8 40 40 8 108-70 118-84 10-150-24-146-74 2-18 8-26 20-36"/><path class="sc" pathLength="1" d="M300 300c-30 18-52 44-62 80m0 0l-4-34m4 34l30-16"/><path class="sc" pathLength="1" d="M60 420c20-12 30 12 50 0s30 12 50 0 30 12 50 0"/><text class="sc-t" x="246" y="298">two coats</text><text class="sc-t" x="62" y="456">crisp edges</text></svg>`),
  level: x => split(x, 'level', `<div class="lv"><div class="lv-body"><div class="lv-vial"><i></i><i></i><span class="lv-bub"></span></div></div></div><p class="sg-note"><b class="lv-say">Nearly</b> Move your mouse to level it</p>`),
  route(x) {
    return split(x, 'route', `<svg viewBox="0 0 600 520"><g class="rt-st"><path d="M0 120H600M0 260H600M0 400H600M120 0V520M300 0V520M470 0V520"/><path d="M0 40L600 200M60 520L360 0"/></g><path class="rt-bg" d="M70 450 C 150 450, 120 330, 220 320 S 330 200, 300 150 S 440 60, 530 70"/><path class="rt-go" d="M70 450 C 150 450, 120 330, 220 320 S 330 200, 300 150 S 440 60, 530 70"/><circle class="rt-a" cx="70" cy="450" r="9"/><circle class="rt-b" cx="530" cy="70" r="9"/><g class="rt-van"><rect x="-17" y="-10" width="34" height="20" rx="5"/></g></svg><span class="rt-l a">${esc(x.town(0))}</span><span class="rt-l b">${esc(x.town(3))}</span>`);
  },
  boxes: x => split(x, 'boxes', svcs(x).map((z, i) => `<div class="bx" style="--k:${i}">${icon(z.i)}<b>${esc(z.n)}</b></div>`).join('') + '<p class="sg-note">Throw the boxes around</p>'),
  tacho: x => split(x, 'tacho', `<svg viewBox="0 0 300 300">${[...Array(41)].map((_, i) => `<path class="tk${i % 5 ? '' : ' big'}${i >= 33 ? ' red' : ''}" d="M150 ${i % 5 ? 34 : 28} V46" transform="rotate(${-120 + i * 6} 150 150)"/>`).join('')}${[...Array(9)].map((_, i) => { const a = (-120 + i * 30 - 90) * Math.PI / 180; return `<text x="${(150 + Math.cos(a) * 88).toFixed(1)}" y="${(156 + Math.sin(a) * 88).toFixed(1)}" text-anchor="middle">${i}</text>`; }).join('')}<path class="needle" d="M150 158 L146 150 L150 40 L154 150 Z"/><circle class="hub" cx="150" cy="150" r="10"/></svg><div class="tc-read"><b>900</b><span>rpm</span><small>Scroll to rev</small></div>`),
  card3d(x) {
    const b = x.b;
    return split(x, 'card3d', `<button type="button" class="c3" aria-label="Business card: click to turn over"><span class="c3-f front"><span class="mk">${icon(x.t.mark || x.C.icon)}</span><b class="d">${esc(b.short)}</b><small>${esc(x.C.label)} · ${esc(b.city)}</small><i class="c3-gl"></i></span><span class="c3-f back"><b class="d">${esc(b.owner)}</b><small>${esc(b.phone)}</small><small>${esc(b.addr || b.city)}</small><i class="c3-gl"></i></span></button><p class="sg-note">Click the card to turn it over</p>`, false);
  },
  slot(x) {
    const a = x.C.services.slice(0, 6).map(z => x.fill(z.n)), b = ['tonight', 'this weekend', 'for two', 'to share', 'after work', 'on the patio'], c = ['made fresh', 'with friends', 'by hand', 'done right', 'on the house', 'till late'];
    const reel = l => `<span class="reel"><span class="reel-in">${[...l, ...l, ...l, ...l].map(w => `<i>${esc(w)}</i>`).join('')}</span></span>`;
    return split(x, 'slot', `<div class="slot d">${reel(a)}${reel(b)}${reel(c)}</div><button type="button" class="btn ghost slot-go">Spin again</button>`, false);
  },
  clock: x => split(x, 'clock', `<svg viewBox="0 0 300 300"><circle class="ck-face" cx="150" cy="150" r="138"/>${[...Array(12)].map((_, i) => `<path class="ck-t" d="M150 24V${i % 3 ? 36 : 46}" transform="rotate(${i * 30} 150 150)"/>`).join('')}<path class="ck-h" d="M150 150V84"/><path class="ck-m" d="M150 150V46"/><path class="ck-s" d="M150 168V40"/><circle class="ck-c" cx="150" cy="150" r="6"/></svg><p class="sg-note ck-say"></p>`),
  typewriter(x) {
    const t = x.t, strip = s => x.fill(s || '').replace(/[*\[\]{}]/g, '').trim(), first = strip(t.head[1]);
    const more = (t.rot || x.C.services.slice(0, 3).map(z => x.fill(z.n).toLowerCase() + '.'));
    return `<section class="hero h-sig h-typewriter" id="top"><div class="wrap grid"><div class="copy"><p class="h-lede" data-r="up">${lede(x)}</p><h1 class="d hl" style="--i:1"><span class="ln"><span>${esc(strip(t.head[0]))}</span></span><span class="ln"><span><span class="ty" data-sig="typewriter" data-ty="${esc(JSON.stringify([first, ...more]))}">${esc(first)}</span><i class="caret"></i></span></span></h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div></div><div class="stage" data-r="clip">${photo(x, null, 1000, 'fill', 'eager')}</div></div></section>`;
  },
  deck(x) {
    const items = (x.C.menu ? x.C.menu.flatMap(g => g.items).slice(0, 5).map(m => [m.n, H.priceTag(m.p, x)]) : svcs(x, 5).map(z => [z.n, z.p]));
    return split(x, 'deck', items.map(([n, p], i) => `<div class="dk" style="--k:${i}"><span>${i + 1} of ${items.length}</span><b class="d">${esc(n)}</b><em>${esc(p)}</em></div>`).join('') + '<p class="sg-note">Drag the top card away</p>');
  },
  morph: x => split(x, 'morph', `<svg width="0" height="0" style="position:absolute"><clipPath id="mb" clipPathUnits="objectBoundingBox"><path d="M0.5 0.05 A0.45 0.45 0 1 1 0.49 0.05Z"/></clipPath></svg><div class="mb">${photo(x, null, 1000, 'fill', 'eager')}</div>`),
  carousel3d(x) {
    const s = svcs(x, 3);
    const faces = [0, 1, 2].flatMap(i => [`<div class="c3d-p">${photo(x, null, 600, 'fill', 'eager')}</div>`, `<div class="c3d-p txt">${icon(s[i].i)}<b class="d">${esc(s[i].n)}</b><span>${s[i].p}</span></div>`]);
    return split(x, 'carousel3d', `<div class="c3d">${faces.map((f, i) => f.replace('class="c3d-p', `style="--a:${i}" class="c3d-p`)).join('')}</div><p class="sg-note">Drag to turn</p>`);
  },
  flap(x) {
    const rows = svcs(x, 6).map(z => (z.n.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 13).padEnd(13) + ' ' + (z.p.replace(/[^0-9]/g, '').slice(0, 4) || '').padStart(4)));
    return split(x, 'flap', `<div class="fb" data-rows="${esc(JSON.stringify(rows))}">${[0, 1, 2, 3].map(() => `<div class="fb-r">${'<i> </i>'.repeat(18)}</div>`).join('')}</div>`);
  },
  dock: x => split(x, 'dock', `<ul class="dock d">${svcs(x).map(z => `<li><span>${esc(z.n)}</span><small>${z.p}</small></li>`).join('')}</ul>`),
  breathe: x => split(x, 'breathe', `<div class="br"><i></i><i></i><i></i><i></i><b class="br-say">Breathe in</b></div><p class="sg-note">Follow the circle for one slow breath</p>`),
  orbit: x => split(x, 'orbit', `<div class="ob"><span class="ob-c">${icon(x.C.icon)}</span>${svcs(x).map((z, i) => `<span class="ob-i" style="--k:${i}">${icon(z.i)}${esc(z.n)}</span>`).join('')}</div>`),
  balance: x => split(x, 'balance', `<svg viewBox="0 0 400 360"><path class="bl-post" d="M200 70V310M140 310H260"/><g class="bl-beam"><path d="M70 90H330"/><circle cx="200" cy="90" r="7"/></g><g class="bl-pan l"><path d="M0 0L-36 76M0 0L36 76M-44 76H44M-44 76A44 22 0 0 0 44 76"/></g><g class="bl-pan r"><path d="M0 0L-36 76M0 0L36 76M-44 76H44M-44 76A44 22 0 0 0 44 76"/></g></svg><p class="sg-note"><b class="bl-say">In balance</b> Move your mouse to tip the scales</p>`),
  chart(x) {
    const v = [...Array(12)].map((_, i) => Math.round(18 + i * 5.2 + rnd(i + 3) * 14));
    const pts = v.map((y, i) => `${40 + i * 47.5},${330 - y * 3.4}`).join(' ');
    return split(x, 'chart', `<svg viewBox="0 0 600 380" data-v="${v.join(',')}"><g class="ch-grid"><path d="M40 330H562M40 245H562M40 160H562M40 75H562"/></g><polygon class="ch-area" points="40,330 ${pts} 562.5,330"/><polyline class="ch-line" pathLength="1" points="${pts}"/><path class="ch-x" d="M0 40V330"/><circle class="ch-dot" r="7"/></svg><div class="ch-tip"><b>${esc(x.cur)}0k</b><span>January</span></div>`);
  },
  receipt(x) {
    const s = svcs(x, 5), cur = x.cur;
    const rows = s.map(z => `<li><span>${esc(z.n)}</span><b>${z.p.replace(/^From /, '') || 'Included'}</b></li>`).join('');
    return split(x, 'receipt', `<div class="rc-slot"></div><div class="rc"><b class="d">${esc(x.b.short)}</b><small>${esc(x.b.addr || x.b.city)}</small><ul>${rows}</ul><p><span>Fixed monthly fee</span><b>${cur}${x.C.prices ? x.C.prices[1].p : 240}</b></p><small>Thank you. No surprises, ever.</small></div><button type="button" class="btn ghost rc-go" tabindex="-1">Print again</button>`);
  },
  shutter: x => split(x, 'shutter', `<div class="sh">${photo(x, null, 1000, 'fill', 'eager')}<svg viewBox="-100 -100 200 200"><path class="sh-blades" fill-rule="evenodd"/><path class="sh-edges"/></svg><i class="sh-flash"></i></div><p class="sg-note">Come closer to open it. Click to shoot.</p>`),
  polaroids(x) {
    const s = svcs(x, 3);
    return split(x, 'polaroids', [0, 1, 2].map(i => `<figure class="plr" style="--k:${i}">${photo(x, '1 / 1', 560, '', 'eager')}<figcaption>${esc(s[i].n)}</figcaption></figure>`).join('') + '<p class="sg-note">Pick them up and move them</p>');
  },
  throughtext(x) {
    const id = x.nextPhoto(), url = id == null ? '' : PHOTO_URL(id, 2000, 1250);
    return `<section class="hero h-through" id="top" data-sig="throughtext"><div class="tt-stick">
  <div class="tt-photo" style="background-image:url('${url}')"></div>
  <div class="tt-top wrap"><p class="h-lede">${lede(x)}</p></div>
  <div class="wrap tt-nw"><p class="d tt-name" data-fit aria-hidden="true"><span class="tw-in tt-fill" style="background-image:url('${url}')">${esc(x.b.short)}</span></p></div>
  <div class="tt-end wrap"><h1 class="d hl">${lines(x.t.head, x)}</h1><div class="row"><p class="h-sub">${esc(x.fill(x.t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
  <p class="zm-hint tt-hint" aria-hidden="true">Scroll</p>
</div></section>`;
  },
};
addHeroes(HEROES);

/* ---------------- shared tools ---------------- */
let INK = '#000', ACC = '#f00', BG = '#fff';
const readCols = () => { const s = getComputedStyle(root); INK = s.getPropertyValue('--ink').trim(); ACC = s.getPropertyValue('--accent').trim(); BG = s.getPropertyValue('--bg').trim(); };
function canvas(box) {
  const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; box.prepend(c);
  const o = { c, g: c.getContext('2d'), W: 0, H: 0, d: 1 };
  const size = () => { o.d = Math.min(1.5, devicePixelRatio || 1); o.W = box.clientWidth; o.H = box.clientHeight; c.width = Math.round(o.W * o.d); c.height = Math.round(o.H * o.d); if (o.onsize) o.onsize(); };
  size(); addEventListener('resize', size);
  return o;
}
const begin = o => { o.g.setTransform(o.d, 0, 0, o.d, 0, 0); o.g.clearRect(0, 0, o.W, o.H); o.g.globalAlpha = 1; };
const local = box => { const r = box.getBoundingClientRect(); return { x: pointer.x - r.left, y: pointer.y - r.top, r, in: pointer.has && pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom }; };
// run draw every frame while the box is on screen; once, at rest, for thumbnails and reduced motion
function loop(box, still, draw) {
  box.dataset.live = '1';
  if (still) { draw(0, 0); addEventListener('resize', () => requestAnimationFrame(() => draw(0, 0))); return; }
  let on = true; new IntersectionObserver(e => (on = e[0].isIntersecting)).observe(box);
  tickers.push((dt, now) => { if (on) draw(dt, now); });
}
let scrollV = 0;
const lib = names => names.reduce((p, n) => p.then(() => (window[n] ? null : new Promise((res, rej) => { const s = document.createElement('script'); s.src = `/js/vendor/${n}.min.js`; s.onload = res; s.onerror = rej; document.head.appendChild(s); }))), Promise.resolve());
const heroP = box => { const r = box.closest('.hero').getBoundingClientRect(); return clamp(-r.top / (r.height * 0.7)); };

/* ---------------- behaviours ---------------- */
const RUN = {
  particles(box, still) {
    const o = canvas(box), P = [...Array(64)].map((_, i) => ({ x: rnd(i), y: rnd(i + 99), vx: (rnd(i + 7) - 0.5) * 0.02, vy: (rnd(i + 3) - 0.5) * 0.02, h: 0 }));
    let pulses = [];
    if (!still) addEventListener('click', () => { const m = local(box); if (m.in) pulses.push({ x: m.x, y: m.y, r: 0 }); });
    loop(box, still, dt => {
      begin(o); const g = o.g, m = local(box);
      for (const p of P) { p.x = (p.x + p.vx * dt + 1) % 1; p.y = (p.y + p.vy * dt + 1) % 1; p.h *= 0.965; }
      pulses = pulses.filter(q => (q.r += 520 * dt) < 1000);
      const pts = P.map(p => [p.x * o.W, p.y * o.H, p]);
      g.lineWidth = 1; g.strokeStyle = INK;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < 150) { g.globalAlpha = (1 - d / 150) * 0.3; g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[j][0], pts[j][1]); g.stroke(); } }
      for (const [x, y, p] of pts) {
        for (const q of pulses) if (Math.abs(Math.hypot(x - q.x, y - q.y) - q.r) < 28) p.h = 1;
        const dm = m.in ? Math.hypot(x - m.x, y - m.y) : 999;
        if (dm < 180) { g.globalAlpha = (1 - dm / 180) * 0.8; g.strokeStyle = ACC; g.beginPath(); g.moveTo(x, y); g.lineTo(m.x, m.y); g.stroke(); g.strokeStyle = INK; }
        g.globalAlpha = 0.45 + p.h * 0.55; g.fillStyle = p.h > 0.1 || dm < 180 ? ACC : INK; g.beginPath(); g.arc(x, y, 2 + p.h * 4, 0, 7); g.fill();
      }
      g.strokeStyle = ACC; g.lineWidth = 2;
      for (const q of pulses) { g.globalAlpha = Math.max(0, 1 - q.r / 1000) * 0.7; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.stroke(); }
    });
  },
  wave(box, still) {
    const o = canvas(box), N = 9, amp = Array(N).fill(0), vel = Array(N).fill(0), px = Array(N).fill(0.5); let ly = null;
    loop(box, still, (dt, now) => {
      begin(o); const g = o.g, m = local(box);
      for (let i = 0; i < N; i++) {
        const y0 = o.H * (0.1 + 0.34 * i / (N - 1));
        if (m.in && ly != null && (ly - y0) * (m.y - y0) < 0) { vel[i] += clamp((m.y - ly) * 12, -700, 700); px[i] = m.x / o.W; }
        vel[i] += (-amp[i] * 110 - vel[i] * 2.6) * dt; amp[i] += vel[i] * dt;
        g.beginPath();
        for (let xx = 0; xx <= o.W + 12; xx += 12) { const u = xx / o.W, y = y0 + Math.sin(u * 6 + now / 1500 + i * 0.7) * 5 + amp[i] * Math.exp(-Math.pow((u - px[i]) * 3, 2)); xx ? g.lineTo(xx, y) : g.moveTo(xx, y); }
        const hot = Math.min(1, Math.abs(amp[i]) / 30);
        g.strokeStyle = hot > 0.08 ? ACC : INK; g.globalAlpha = 0.26 + hot * 0.7; g.lineWidth = 1.5; g.stroke();
      }
      ly = m.in ? m.y : null;
    });
  },
  petals(box, still) {
    const o = canvas(box), P = [...Array(44)].map((_, i) => ({ x: rnd(i) * 1.05, y: rnd(i + 5) * 0.6 - 0.08, s: 7 + rnd(i + 9) * 12, a: rnd(i + 2) * 6, w: 0.4 + rnd(i + 4), ox: 0, oy: 0, c: i % 3 }));
    loop(box, still, (dt, now) => {
      begin(o); const g = o.g, m = local(box);
      for (const p of P) {
        p.y += dt * (0.02 + p.w * 0.022); p.a += dt * p.w; if (p.y > 0.56) p.y = -0.08;
        const x = p.x * o.W + Math.sin(now / 1300 + p.a) * 26 + p.ox, y = p.y * o.H + p.oy;
        if (m.in) { const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy) || 1; if (d < 160) { const k = (1 - d / 160) * 420 * dt; p.ox += dx / d * k; p.oy += dy / d * k; } }
        p.ox *= 0.975; p.oy *= 0.975;
        g.save(); g.translate(x, y); g.rotate(p.a); g.globalAlpha = (p.c === 1 ? 0.16 : p.c ? 0.5 : 0.9) * clamp((0.5 - p.y) / 0.14) * clamp((p.y + 0.08) / 0.1); g.fillStyle = p.c === 1 ? INK : ACC; g.beginPath(); g.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, 7); g.fill(); g.restore();
      }
    });
  },
  bubbles(box, still) {
    const o = canvas(box), B = [...Array(26)].map((_, i) => ({ x: rnd(i + 1), y: rnd(i + 40) * 0.6, r: 14 + rnd(i + 8) * 34, v: 0.03 + rnd(i + 2) * 0.05, pop: 0 }));
    loop(box, still, (dt, now) => {
      begin(o); const g = o.g, m = local(box); g.lineWidth = 1.5;
      for (const b of B) {
        const fade = clamp((0.56 - b.y) / 0.14);
        if (b.pop > 0) { b.pop += dt * 3; if (b.pop > 1) { b.pop = 0; b.y = 0.6; b.x = Math.random(); } }
        else { b.y -= b.v * dt; if (b.y < -0.1) b.y = 0.6; }
        const x = b.x * o.W + Math.sin(now / 1100 + b.r) * 14, y = b.y * o.H;
        if (!b.pop && fade > 0.5 && m.in && Math.hypot(x - m.x, y - m.y) < b.r + 8) b.pop = 0.01;
        if (b.pop) { g.strokeStyle = ACC; g.globalAlpha = 1 - b.pop; for (let k = 0; k < 8; k++) { const a = k * 0.785, r1 = b.r * (1 + b.pop * 0.5), r2 = b.r * (1.25 + b.pop * 0.9); g.beginPath(); g.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); g.stroke(); } }
        else { g.strokeStyle = INK; g.globalAlpha = 0.34 * fade; g.beginPath(); g.arc(x, y, b.r, 0, 7); g.stroke(); g.strokeStyle = ACC; g.globalAlpha = 0.8 * fade; g.beginPath(); g.arc(x, y, b.r * 0.68, 3.5, 4.5); g.stroke(); }
      }
    });
  },
  pulse(box, still) {
    const o = canvas(box), out = box.querySelector('.bpm b'); let bpm = 62, ph = 0, buf = [];
    const beat = u => (u < 0.1 ? Math.sin(u / 0.1 * Math.PI) * 0.12 : u < 0.16 ? -(u - 0.1) / 0.06 * 0.25 : u < 0.2 ? -0.25 + (u - 0.16) / 0.04 * 1.25 : u < 0.25 ? 1 - (u - 0.2) / 0.05 * 1.45 : u < 0.3 ? -0.45 + (u - 0.25) / 0.05 * 0.45 : u < 0.5 ? Math.sin((u - 0.3) / 0.2 * Math.PI) * 0.2 : 0);
    loop(box, still, dt => {
      bpm = lerp(bpm, clamp(62 + Math.hypot(pointer.vx, pointer.vy) * 2.4 + Math.abs(scrollV) * 3, 62, 178), 0.05);
      if (still) buf = [...Array(260)].map((_, i) => beat((i / 60) % 1));
      else { for (let s = Math.max(1, Math.round(dt * 120)); s > 0; s--) { ph += bpm / 60 / 120; buf.push(beat(ph % 1)); } while (buf.length > 260) buf.shift(); }
      begin(o); const g = o.g, nav = parseFloat(getComputedStyle(root).getPropertyValue('--navh')) || 72, y0 = nav + (o.W < 700 ? 74 : 104), A = o.W < 700 ? 30 : 48;
      g.beginPath(); buf.forEach((b, i) => { const x = o.W - (buf.length - 1 - i) * (o.W / 260), y = y0 - b * A; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.strokeStyle = ACC; g.lineWidth = 2.5; g.lineJoin = 'round'; g.stroke();
      if (out) out.textContent = Math.round(bpm);
    });
  },
  grow(box, still) {
    const o = canvas(box); let auto = 0, tNow = 0;
    const branch = (g, x, y, a, len, depth, budget) => {
      if (depth > 8 || budget <= 0) return;
      const l = Math.min(len, budget), x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l;
      g.globalAlpha = 0.72; g.strokeStyle = INK; g.lineWidth = Math.max(1, (9 - depth) * 0.85); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      const rest = budget - len;
      if (rest <= 0 || depth === 8) { if (depth > 3) { g.fillStyle = ACC; g.globalAlpha = 0.95; g.beginPath(); g.arc(x2, y2, 4, 0, 7); g.fill(); } return; }
      const sw = Math.sin(tNow / 1700 + depth) * 0.04;
      branch(g, x2, y2, a - 0.44 + sw + rnd(depth * 13 + a) * 0.22, len * 0.77, depth + 1, rest);
      branch(g, x2, y2, a + 0.38 + sw - rnd(depth * 7 + a) * 0.22, len * 0.73, depth + 1, rest);
    };
    loop(box, still, (dt, now) => {
      tNow = now; auto = Math.min(1, auto + dt * 0.45);
      const p = still ? 1 : clamp(ease(auto) * 0.62 + heroP(box) * 0.5);
      begin(o); const small = o.W < 700, len = o.H * (small ? 0.13 : 0.23);
      branch(o.g, o.W * (small ? 0.7 : 0.78), o.H * (small ? 0.54 : 0.86), -Math.PI / 2, len, 0, p * len * 4.2);
    });
  },
  goo(box, still) {
    const bl = $$('.goo i', box); const k = clamp(box.clientWidth / 1100, 0.5, 1); bl.forEach((b, i) => b.style.setProperty('--s', `${Math.round((110 + rnd(i) * 150) * k)}px`));
    let mx = 0.7, my = 0.3;
    loop(box, still, (dt, now) => {
      const m = local(box), W = box.clientWidth, Hh = box.clientHeight, t = now / 1000;
      if (m.in) { mx = lerp(mx, clamp(m.x / W, 0.42, 0.98), 0.08); my = lerp(my, clamp(m.y / Hh, 0.08, 0.44), 0.08); }
      bl.forEach((b, i) => {
        const x = i === 0 ? mx : 0.7 + 0.22 * Math.cos(t * (0.18 + i * 0.05) + i * 1.7), y = i === 0 ? my : 0.26 + 0.15 * Math.sin(t * (0.22 + i * 0.04) + i * 2.3);
        b.style.transform = `translate3d(${(x * W).toFixed(1)}px, ${(y * Hh).toFixed(1)}px, 0)`;
      });
    });
  },
  glitch(box, still) {
    const hero = box.closest('.hero'), hl = hero.querySelector('.hl'), bar = box.querySelector('.gl-bar'); box.dataset.live = '1';
    if (still) return;
    const src = hl.innerHTML, cl = ['a', 'b'].map(c => { const d = document.createElement('span'); d.className = 'gl-c ' + c; d.setAttribute('aria-hidden', 'true'); d.innerHTML = src; hl.appendChild(d); return d; });
    let busy = false, on = true; new IntersectionObserver(e => (on = e[0].isIntersecting)).observe(hero);
    const burst = () => {
      if (busy || !on || document.hidden) return; busy = true; let n = 0;
      const t = setInterval(() => {
        const last = ++n > 6;
        cl.forEach((d, i) => { const top = Math.random() * 70, h = 8 + Math.random() * 26; d.style.opacity = last ? 0 : 1; d.style.clipPath = `inset(${top.toFixed(0)}% 0 ${Math.max(0, 100 - top - h).toFixed(0)}% 0)`; d.style.transform = `translate3d(${((Math.random() - 0.5) * (i ? 26 : 44)).toFixed(0)}px, 0, 0)`; });
        bar.style.opacity = last ? 0 : 0.5; bar.style.top = `${(Math.random() * 90).toFixed(0)}%`; bar.style.height = `${(2 + Math.random() * 9).toFixed(0)}%`;
        if (last) { clearInterval(t); busy = false; }
      }, 55);
    };
    setTimeout(function again() { burst(); setTimeout(again, 2600 + Math.random() * 2600); }, 1900);
    hl.addEventListener('pointerenter', burst); addEventListener('click', burst);
  },
  horizon(box, still) {
    const sun = box.querySelector('.hz-sun'), dusk = box.querySelector('.hz-dusk'), hills = $$('path', box); let x = 0;
    loop(box, still, () => {
      const p = still ? 0 : heroP(box); x = lerp(x, pointer.has ? (pointer.x / innerWidth - 0.5) : 0, 0.06);
      sun.setAttribute('cy', (330 + p * 420).toFixed(1)); sun.setAttribute('cx', (1010 - x * 60).toFixed(1));
      dusk.style.opacity = (p * 0.42).toFixed(3);
      hills.forEach((h, i) => (h.style.transform = `translate3d(${(-x * (i + 1) * 26).toFixed(1)}px, ${(p * (i + 1) * -14).toFixed(1)}px, 0)`));
    });
  },
  switch(box, still) {
    const hero = box.closest('.hero'), tog = box.querySelector('.tog');
    const set = on => { hero.classList.toggle('on', on); hero.classList.toggle('fld', on); hero.classList.toggle('fld-1', on); tog.setAttribute('aria-checked', String(on)); };
    tog.addEventListener('click', () => set(!hero.classList.contains('on')));
    box.dataset.live = '1';
    if (still) set(true); else setTimeout(() => set(true), 1900);
  },
  gauge(box, still) {
    const hero = box.closest('.hero'), fill = box.querySelector('.g-fill'), knob = box.querySelector('.g-knob'), out = box.querySelector('.g-read b');
    let v = 0.45, target = 0.45, touched = false, drag = false;
    const at = e => { const r = box.querySelector('svg').getBoundingClientRect(); let a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI - 135; a = ((a % 360) + 360) % 360; target = clamp(a / 270); touched = true; };
    box.addEventListener('pointerdown', e => { drag = true; box.setPointerCapture(e.pointerId); at(e); });
    box.addEventListener('pointermove', e => { if (drag) at(e); });
    box.addEventListener('pointerup', () => (drag = false));
    loop(box, still, (dt, now) => {
      if (!touched && !still) target = 0.45 + Math.sin(now / 1800) * 0.22;
      v = still ? target : lerp(v, target, 0.14);
      const a = (135 + v * 270) * Math.PI / 180;
      fill.style.strokeDashoffset = (1 - v).toFixed(4);
      knob.setAttribute('cx', (150 + Math.cos(a) * 126).toFixed(1)); knob.setAttribute('cy', (150 + Math.sin(a) * 126).toFixed(1));
      out.textContent = Math.round(16 + v * 12);
      const c = [Math.round(lerp(61, 255, v)), Math.round(lerp(139, 106, v)), Math.round(lerp(255, 43, v))];
      hero.style.setProperty('--tint', `rgb(${c})`);
    });
  },
  blueprint(box, still) {
    const ps = $$('.bp', box); let auto = 0;
    loop(box, still, dt => {
      auto = Math.min(1, auto + dt * 0.5);
      const p = still ? 1 : clamp(ease(auto) * 0.55 + heroP(box) * 0.7);
      ps.forEach((el, i) => (el.style.strokeDashoffset = (1 - clamp(p * ps.length - i)).toFixed(3)));
      box.classList.toggle('done', p > 0.97);
    });
  },
  estimator(box) {
    const el = box.querySelector('.est'), range = el.querySelector('input'), size = el.querySelector('.est-size'), out = el.querySelector('.est-out b');
    let mult = 1.28, shown = 0;
    const calc = () => { size.textContent = range.value; const total = Math.round(range.value * el.dataset.rate * mult / 500) * 500; const from = shown, t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / 500); shown = from + (total - from) * (1 - Math.pow(1 - k, 3)); out.textContent = el.dataset.cur + num(Math.round(shown / 100) * 100); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
    range.addEventListener('input', calc);
    el.querySelector('.est-fin').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mult = +b.dataset.m; $$('.est-fin button', el).forEach(o => o.setAttribute('aria-pressed', String(o === b))); calc(); });
    box.dataset.live = '1'; calc();
  },
  wipe(box, still) {
    const o = canvas(box), out = box.querySelector('.wp-pct b'); o.c.style.zIndex = 1; box.appendChild(o.c);
    const cells = new Set(); let demo = 0;
    const paint = () => { const g = o.g; g.setTransform(o.d, 0, 0, o.d, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = BG; g.globalAlpha = 0.94; g.fillRect(0, 0, o.W, o.H); g.globalAlpha = 0.1; g.fillStyle = INK; for (let i = 0; i < 260; i++) { g.beginPath(); g.arc(rnd(i) * o.W, rnd(i + 500) * o.H, 1 + rnd(i + 9) * 3, 0, 7); g.fill(); } g.globalAlpha = 1; cells.clear(); };
    const rub = (x, y, r) => { const g = o.g; g.setTransform(o.d, 0, 0, o.d, 0, 0); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); cells.add(((x / o.W * 12) | 0) + ((y / o.H * 12) | 0) * 12); if (out) out.textContent = Math.min(100, Math.round(cells.size / 144 * 118)); };
    o.onsize = paint; paint();
    if (still) { const demoRub = () => { for (let i = 0; i < 40; i++) rub(o.W * (0.15 + i * 0.016), o.H * (0.25 + i * 0.012), 70); }; o.onsize = () => { paint(); demoRub(); }; demoRub(); box.dataset.live = '1'; return; }
    loop(box, false, dt => {
      const m = local(box);
      if (m.in && fine) rub(m.x, m.y, 46);
      else if (demo < 1) { demo += dt * 0.5; rub(o.W * (0.12 + demo * 0.76), o.H * (0.5 + Math.sin(demo * 9) * 0.26), 52); }
    });
    box.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') { const r = box.getBoundingClientRect(); rub(e.clientX - r.left, e.clientY - r.top, 46); } });
  },
  swatches(box) {
    const note = box.querySelector('.sg-note');
    box.addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      const hex = c.dataset.c, n = parseInt(hex.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
      root.style.setProperty('--accent', hex); root.style.setProperty('--accent-ink', l > 0.6 ? '#151515' : '#ffffff');
      $$('.chip', box).forEach(o => o.classList.toggle('on', o === c)); note.textContent = `${c.querySelector('b').textContent}: now on every button and link`;
    });
    box.dataset.live = '1';
  },
  scribble(box) {
    box.dataset.live = '1';
    box.addEventListener('pointerenter', () => { box.classList.add('rs'); void box.offsetWidth; box.classList.remove('rs'); });
  },
  level(box, still) {
    const body = box.querySelector('.lv-body'), bub = box.querySelector('.lv-bub'), say = box.querySelector('.lv-say'); let p = 0.6, v = 0;
    loop(box, still, (dt, now) => {
      const r = box.getBoundingClientRect(), tgt = still ? 0 : pointer.has && fine ? clamp((pointer.x - (r.left + r.width / 2)) / (innerWidth * 0.3), -1, 1) : Math.sin(now / 1500) * 0.7;
      v += ((tgt - p) * 60 - v * 7) * dt; p = still ? 0 : p + v * dt;
      body.style.transform = `rotate(${(p * 7).toFixed(2)}deg)`; bub.style.transform = `translate3d(${(-p * 150).toFixed(1)}%, 0, 0)`;
      const ok = Math.abs(p) < 0.07; box.classList.toggle('ok', ok); say.textContent = ok ? 'Level.' : p > 0 ? 'A touch left' : 'A touch right';
    });
  },
  route(box, still) {
    const go = box.querySelector('.rt-go'), van = box.querySelector('.rt-van'), L = go.getTotalLength(); go.style.strokeDasharray = L; let auto = 0;
    loop(box, still, dt => {
      const sc = heroP(box); auto = (auto + dt * 0.1) % 2;
      const p = still ? 0.62 : sc > 0.03 ? clamp(sc * 1.25) : ease(auto > 1 ? 2 - auto : auto);
      const a = go.getPointAtLength(p * L), b = go.getPointAtLength(Math.min(L, p * L + 2));
      go.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      van.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI).toFixed(1)})`);
    });
  },
  boxes(box, still) {
    const bx = $$('.bx', box); box.dataset.live = '1';
    bx.forEach((b, i) => { b.style.left = `${8 + (i % 3) * 30 + rnd(i) * 6}%`; b.style.top = `${10 + ((i / 3) | 0) * 40 + rnd(i + 4) * 10}%`; b.style.rotate = `${(rnd(i + 2) - 0.5) * 22}deg`; });
    if (still) return;
    lib(['gsap', 'Draggable', 'InertiaPlugin']).then(() => {
      const { gsap, Draggable, InertiaPlugin } = window; gsap.registerPlugin(Draggable, InertiaPlugin);
      gsap.from(bx, { y: -520, rotation: () => gsap.utils.random(-50, 50), duration: 1.1, ease: 'bounce.out', stagger: 0.09, delay: 0.3 });
      let z = 5;
      Draggable.create(bx, { type: 'x,y', bounds: box, inertia: true, edgeResistance: 0.75, onPress() { this.target.style.zIndex = ++z; }, onDrag() { gsap.to(this.target, { rotation: clamp(this.deltaX * 1.5, -24, 24), duration: 0.3 }); } });
    }).catch(() => {});
  },
  tacho(box, still) {
    const needle = box.querySelector('.needle'), out = box.querySelector('.tc-read b'); let rpm = 900;
    loop(box, still, (dt, now) => {
      const tgt = still ? 2400 : 900 + Math.sin(now / 300) * 40 + Math.min(6900, Math.abs(scrollV) * 520 + Math.hypot(pointer.vx, pointer.vy) * 70);
      rpm = lerp(rpm, tgt, tgt > rpm ? 0.2 : 0.045);
      needle.setAttribute('transform', `rotate(${(-120 + rpm / 8000 * 240).toFixed(2)} 150 150)`); out.textContent = num(Math.round(rpm / 50) * 50);
      box.classList.toggle('hot', rpm > 6500);
    });
  },
  card3d(box, still) {
    const card = box.querySelector('.c3'); let rx = 0, ry = 0, flip = 0, f = 0;
    card.addEventListener('click', () => (flip = flip ? 0 : 180));
    loop(box, still, (dt, now) => {
      const r = box.getBoundingClientRect(), on = pointer.has && fine;
      const tx = on ? clamp((pointer.x - (r.left + r.width / 2)) / r.width, -1, 1) : Math.sin(now / 1900) * 0.5, ty = on ? clamp((pointer.y - (r.top + r.height / 2)) / r.height, -1, 1) : Math.cos(now / 2300) * 0.4;
      rx = lerp(rx, -ty * 14, 0.08); ry = lerp(ry, tx * 20, 0.08); f = lerp(f, flip, 0.1);
      card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${(ry + f).toFixed(2)}deg)`;
      card.style.setProperty('--gx', `${(50 + tx * 60).toFixed(1)}%`); card.style.setProperty('--gy', `${(50 + ty * 60).toFixed(1)}%`);
    });
  },
  slot(box, still) {
    const reels = $$('.reel-in', box), n = 6; let turn = 0; box.dataset.live = '1';
    const spin = () => { turn++; reels.forEach((r, i) => { r.style.transition = 'none'; r.style.transform = `translateY(${-((turn * 7 + i * 2) % n) * 1.3}em)`; void r.offsetWidth; r.style.transition = `transform ${1.1 + i * 0.45}s cubic-bezier(.16, 1, .3, 1)`; r.style.transform = `translateY(${-(n * 2 + (turn * 5 + i * 3) % n) * 1.3}em)`; }); };
    box.querySelector('.slot-go').addEventListener('click', spin);
    if (still) reels.forEach((r, i) => (r.style.transform = `translateY(${-i * 1.3}em)`)); else setTimeout(spin, 900);
  },
  clock(box, still) {
    const h = box.querySelector('.ck-h'), m = box.querySelector('.ck-m'), s = box.querySelector('.ck-s'), say = box.querySelector('.ck-say');
    loop(box, still, () => {
      const d = new Date(), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
      h.setAttribute('transform', `rotate(${(hr * 30).toFixed(2)} 150 150)`); m.setAttribute('transform', `rotate(${(min * 6).toFixed(2)} 150 150)`); s.setAttribute('transform', `rotate(${(sec * 6).toFixed(2)} 150 150)`);
      const H24 = d.getHours(); say.textContent = `It’s ${String(H24).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} where you are. ${H24 < 7 ? 'We open at seven.' : H24 < 11 ? 'The first batch is still warm.' : H24 < 17 ? 'Still pouring.' : 'See you in the morning.'}`;
    });
  },
  typewriter(el, still) {
    el.dataset.live = '1'; if (still) return;
    const list = JSON.parse(el.dataset.ty); let i = 0;
    const type = (txt, done) => { let k = 0; const t = setInterval(() => { el.textContent = txt.slice(0, ++k); if (k >= txt.length) { clearInterval(t); setTimeout(done, 2200); } }, 55); };
    const erase = done => { const t = setInterval(() => { el.textContent = el.textContent.slice(0, -1); if (!el.textContent) { clearInterval(t); done(); } }, 28); };
    const next = () => erase(() => { i = (i + 1) % list.length; type(list[i], next); });
    setTimeout(next, 3200);   // the first line stays whole for a good moment before anything changes
  },
  deck(box, still) {
    let cards = $$('.dk', box); box.dataset.live = '1';
    const lay = () => cards.forEach((c, i) => { c.style.setProperty('--k', i); c.style.zIndex = 10 - i; c.style.transition = 'transform .55s cubic-bezier(.23,1,.32,1)'; c.style.transform = ''; });
    lay(); if (still) return;
    let drag = null, sx = 0, sy = 0;
    box.addEventListener('pointerdown', e => { const c = e.target.closest('.dk'); if (c !== cards[0]) return; drag = c; sx = e.clientX; sy = e.clientY; c.style.transition = 'none'; c.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - sx, dy = e.clientY - sy; drag.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${dx / 14}deg)`; });
    const up = e => { if (!drag) return; const dx = e.clientX - sx, c = drag; drag = null;
      if (Math.abs(dx) > 90) { c.style.transition = 'transform .4s cubic-bezier(.23,1,.32,1)'; c.style.transform = `translate3d(${Math.sign(dx) * 520}px, ${e.clientY - sy}px, 0) rotate(${Math.sign(dx) * 26}deg)`; setTimeout(() => { cards.push(cards.shift()); lay(); }, 300); } else lay(); };
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  },
  morph(box, still) {
    const path = document.querySelector('#mb path'); let k = 0;
    loop(box, still, (dt, now) => {
      const m = local(box); k = lerp(k, m.in ? 1 : 0, 0.05);
      const N = 9, t = now / 1000, P = [...Array(N)].map((_, i) => { const a = i / N * 6.2832, r = 0.38 + 0.05 * Math.sin(a * 2 + t * 0.9) + 0.035 * Math.sin(a * 3 - t * 1.3) + k * 0.03 * Math.sin(a * 5 + t * 3); return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r * 1.06]; });
      let d = ''; for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; d += i ? `Q${a[0].toFixed(4)} ${a[1].toFixed(4)} ${mx.toFixed(4)} ${my.toFixed(4)}` : `M${mx.toFixed(4)} ${my.toFixed(4)}`; }
      const a = P[0], b = P[1]; path.setAttribute('d', d + `Q${a[0].toFixed(4)} ${a[1].toFixed(4)} ${((a[0] + b[0]) / 2).toFixed(4)} ${((a[1] + b[1]) / 2).toFixed(4)}Z`);
    });
  },
  carousel3d(box, still) {
    const ring = box.querySelector('.c3d'); let rot = -20, vel = 0, drag = false, lx = 0;
    box.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; box.setPointerCapture(e.pointerId); });
    box.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; rot += dx * 0.35; vel = dx * 20; });
    const end = () => (drag = false); box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
    loop(box, still, dt => { if (!drag) { vel = lerp(vel, 10 + scrollV * 6, 0.04); rot += vel * dt; } ring.style.transform = `translateZ(-13.4em) rotateY(${rot.toFixed(2)}deg)`; });
  },
  flap(box, still) {
    const rows = JSON.parse(box.querySelector('.fb').dataset.rows), R = $$('.fb-r', box), ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '; let off = 0;
    box.dataset.live = '1';
    const show = (r, txt, quick) => [...r.children].forEach((c, i) => {
      const ch = txt[i] || ' '; if (quick) return (c.textContent = ch);
      if (c.textContent === ch) return; let n = 4 + ((i * 7) % 6);
      const t = setInterval(() => { c.textContent = n-- > 0 ? ABC[(Math.random() * ABC.length) | 0] : ch; c.classList.remove('f'); void c.offsetWidth; c.classList.add('f'); if (n < 0) clearInterval(t); }, 55 + i * 4);
    });
    const paint = quick => R.forEach((r, k) => show(r, rows[(off + k) % rows.length], quick));
    paint(still); if (still) return;
    setInterval(() => { if (document.hidden) return; const b = box.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) return; off = (off + 1) % rows.length; paint(false); }, 4200);
  },
  dock(box, still) {
    const items = $$('li', box), s = items.map(() => 1);
    loop(box, still, (dt, now) => {
      const m = local(box); let best = 0, bd = 1e9;
      items.forEach((li, i) => {
        const r = li.getBoundingClientRect(), cy = r.top + r.height / 2, d = m.in && fine ? Math.abs(pointer.y - cy) : Math.abs(((now / 900) % items.length) - i) * 60;
        if (d < bd) { bd = d; best = i; }
        s[i] = still ? 1 : lerp(s[i], 1 + 0.75 * Math.exp(-Math.pow(d / 80, 2)), 0.16);
        li.style.transform = `scale(${s[i].toFixed(3)})`;
      });
      items.forEach((li, i) => li.classList.toggle('on', !still && i === best));
    });
  },
  breathe(box, still) {
    const rings = $$('.br i', box), say = box.querySelector('.br-say');
    loop(box, still, (dt, now) => {
      const t = (now / 1000) % 12, k = still ? 0.6 : t < 4 ? ease(t / 4) : t < 6 ? 1 : 1 - ease((t - 6) / 6);
      rings.forEach((r, i) => (r.style.transform = `scale(${(0.34 + k * (0.3 + i * 0.12)).toFixed(3)})`));
      say.textContent = still || t < 4 ? 'Breathe in' : t < 6 ? 'Hold' : 'And out';
    });
  },
  orbit(box, still) {
    const it = $$('.ob-i', box); let a = 0, v = 14, hover = false, drag = false, lx = 0;
    box.addEventListener('pointerenter', () => (hover = true)); box.addEventListener('pointerleave', () => (hover = false));
    box.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; }); addEventListener('pointerup', () => (drag = false));
    box.addEventListener('pointermove', e => { if (drag) { a += (e.clientX - lx) * 0.4; lx = e.clientX; } });
    loop(box, still, dt => {
      v = lerp(v, hover ? 0 : 14 + Math.abs(scrollV) * 8, 0.06); a += v * dt;
      const W = box.clientWidth, Hh = box.clientHeight;
      it.forEach((el, i) => { const t = (a + i * 360 / it.length) * Math.PI / 180, z = Math.sin(t); el.style.transform = `translate(-50%, -50%) translate3d(${(Math.cos(t) * W * (W < 420 ? 0.29 : 0.36)).toFixed(1)}px, ${(z * Hh * 0.3).toFixed(1)}px, 0) scale(${(0.82 + (z + 1) * 0.14).toFixed(3)})`; el.style.zIndex = z > 0 ? 3 : 1; el.style.opacity = (0.55 + (z + 1) * 0.225).toFixed(2); });
    });
  },
  balance(box, still) {
    const beam = box.querySelector('.bl-beam'), L = box.querySelector('.bl-pan.l'), R = box.querySelector('.bl-pan.r'), say = box.querySelector('.bl-say'); let a = 0, v = 0;
    loop(box, still, (dt, now) => {
      const tgt = still ? 0 : pointer.has && fine ? (pointer.x / innerWidth - 0.5) * 28 : Math.sin(now / 1700) * 9;
      v += ((tgt - a) * 34 - v * 3.2) * dt; a = still ? 0 : a + v * dt;
      const r = a * Math.PI / 180;
      beam.setAttribute('transform', `rotate(${a.toFixed(2)} 200 90)`);
      L.setAttribute('transform', `translate(${(200 - Math.cos(r) * 130).toFixed(1)} ${(90 - Math.sin(r) * 130).toFixed(1)})`);
      R.setAttribute('transform', `translate(${(200 + Math.cos(r) * 130).toFixed(1)} ${(90 + Math.sin(r) * 130).toFixed(1)})`);
      say.textContent = Math.abs(a) < 1.5 ? 'In balance.' : a > 0 ? 'Tipping right' : 'Tipping left';
      box.classList.toggle('ok', Math.abs(a) < 1.5);
    });
  },
  chart(box, still) {
    const svg = box.querySelector('svg'), v = svg.dataset.v.split(',').map(Number), xl = box.querySelector('.ch-x'), dot = box.querySelector('.ch-dot'), tip = box.querySelector('.ch-tip');
    const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; let cur = 11;
    const cu = tip.querySelector('b').textContent.replace(/[0-9k]/g, '');
    loop(box, still, (dt, now) => {
      const r = svg.getBoundingClientRect(), m = local(svg);
      const i = m.in && fine ? clamp(Math.round(((pointer.x - r.left) / r.width * 600 - 40) / 47.5), 0, 11) : still ? 11 : Math.floor(now / 1400) % 12;
      if (i !== cur || !tip.dataset.on) { cur = i; tip.dataset.on = 1; const x = 40 + i * 47.5, y = 330 - v[i] * 3.4; xl.setAttribute('transform', `translate(${x} 0)`); dot.setAttribute('cx', x); dot.setAttribute('cy', y); tip.style.left = `${clamp(x / 600 * 100, 10, 90)}%`; tip.style.top = `${y / 380 * 100}%`; tip.querySelector('b').textContent = `${cu}${v[i]}k`; tip.querySelector('span').textContent = MO[i]; }
    });
  },
  receipt(box, still) {
    const rc = box.querySelector('.rc'); box.dataset.live = '1';
    const print = () => { rc.classList.remove('go'); void rc.offsetWidth; rc.classList.add('go'); };
    box.querySelector('.rc-go').addEventListener('click', print);
    if (still) rc.classList.add('rest'); else setTimeout(print, 500);
  },
  shutter(box, still) {
    const blades = box.querySelector('.sh-blades'), edges = box.querySelector('.sh-edges'), flash = box.querySelector('.sh-flash'); let open = 0.25, snap = 0;
    box.addEventListener('click', () => { snap = 1; flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); });
    loop(box, still, (dt, now) => {
      const m = local(box), r = box.getBoundingClientRect(), d = m.in ? Math.hypot(m.x - r.width / 2, m.y - r.height / 2) / (r.width / 2) : 1;
      snap = Math.max(0, snap - dt * 2.2);
      const tgt = still ? 0.62 : (m.in && fine ? clamp(1.05 - d * 0.75, 0.2, 1) : 0.45 + Math.sin(now / 1600) * 0.2) * (1 - Math.sin(snap * Math.PI));
      open = still ? tgt : lerp(open, tgt, 0.12);
      const rr = open * 92, rot = open * 50, P = [...Array(6)].map((_, i) => { const a = (i * 60 + rot) * Math.PI / 180; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
      blades.setAttribute('d', `M-100 -100H100V100H-100Z M${P.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L')}Z`);
      edges.setAttribute('d', P.map((p, i) => { const a = (i * 60 + rot + 118) * Math.PI / 180; return `M${p[0].toFixed(2)} ${p[1].toFixed(2)}L${(p[0] + Math.cos(a) * 160).toFixed(1)} ${(p[1] + Math.sin(a) * 160).toFixed(1)}`; }).join(''));
    });
  },
  polaroids(box, still) {
    const pl = $$('.plr', box); box.dataset.live = '1';
    pl.forEach((p, i) => { p.style.left = `${[6, 40, 22][i]}%`; p.style.top = `${[6, 14, 44][i]}%`; p.style.rotate = `${[-7, 5, -3][i]}deg`; });
    if (still) return;
    lib(['gsap', 'Draggable', 'InertiaPlugin']).then(() => {
      const { gsap, Draggable, InertiaPlugin } = window; gsap.registerPlugin(Draggable, InertiaPlugin); let z = 5;
      Draggable.create(pl, { type: 'x,y', bounds: box, inertia: true, edgeResistance: 0.8, onPress() { this.target.style.zIndex = ++z; gsap.to(this.target, { scale: 1.04, duration: 0.2 }); }, onRelease() { gsap.to(this.target, { scale: 1, duration: 0.3 }); } });
    }).catch(() => {});
  },
  throughtext(sec, still) {
    sec.dataset.live = '1';
    const set = p => { sec.style.setProperty('--tp', (p * p * 60).toFixed(3)); const e = clamp((p - 0.42) / 0.22); sec.style.setProperty('--te', e.toFixed(3)); sec.querySelector('.tt-end').classList.toggle('on', e > 0.6); };
    if (still) { if (!root.classList.contains('shot')) set(1); return; }
    set(0); onScroll(sec, ['start start', 'end end'], set);
  },
};

export function runSig(t, opts = {}, state = {}) {
  const still = state.still ?? !!opts.shot;
  readCols(); new MutationObserver(readCols).observe(root, { attributes: true, attributeFilter: ['style'] });
  let last = scrollY; tickers.push(() => { scrollV = window.__lenis ? window.__lenis.velocity : scrollY - last; last = scrollY; });
  $$('[data-sig]').forEach(el => { const f = RUN[el.dataset.sig]; if (f) try { f(el, still, t); } catch (e) { console.error('sig', el.dataset.sig, e); } });
}
