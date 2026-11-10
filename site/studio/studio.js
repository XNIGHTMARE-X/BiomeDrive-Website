// BiomeDrive · Studio page: the drifting wall, filters and cards, the template viewer and the colour lab.
// Templates render inside an iframe (studio/view/); this page only sends it a palette or a font.
import { TEMPLATES } from './data/templates.js?v=21';
import { PALETTES } from './data/palettes.js?v=21';
import { FONTS } from './data/fonts.js?v=21';
import { CATS, GROUPS, MOODS } from './data/content.js?v=21';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PAL = Object.fromEntries(PALETTES.map(p => [p.id, p]));
const FNT = Object.fromEntries(FONTS.map(f => [f.id, f]));
const TPL = Object.fromEntries(TEMPLATES.map(t => [t.id, t]));
const MOOD = Object.fromEntries(MOODS.map(m => [m.id, m.label]));
const VER = new URL(import.meta.url).searchParams.get('v') || '1';   // same version as the imports (tools/studio/bump.py)
const thumb = t => `/studio/thumbs/${t.id}.webp?v=${VER}`;
const viewUrl = q => `/studio/view/?${q}&v=${VER}`;
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

$('#nTpl').textContent = $('#nTpl2').textContent = TEMPLATES.length;
$('#nCat').textContent = new Set(TEMPLATES.map(t => t.cat)).size;
$('#nPal').textContent = PALETTES.length;
$('#nFont').textContent = FONTS.length;

/* =========================================================
   COLOUR MATHS: contrast (WCAG 2) and OKLCH, for the generator
   ========================================================= */
const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const toLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const lum = h => { const [r, g, b] = rgb(h).map(v => toLin(v / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const toHex = arr => '#' + arr.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
function lchRgb(L, C, h) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(toGam);
}
function lch(L, C, h) {
  L = Math.max(0, Math.min(1, L));
  for (let c = C; c >= 0; c -= 0.004) { const v = lchRgb(L, c, h); if (v.every(x => x >= -1e-4 && x <= 1 + 1e-4)) return toHex(v); }
  return toHex(lchRgb(L, 0, h));
}
function toLch(hex) {
  const [r, g, b] = rgb(hex).map(v => toLin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return [L, Math.hypot(A, B), (Math.atan2(B, A) * 180 / Math.PI + 360) % 360];
}
// move a colour's lightness until it reaches the contrast it needs against bg
function reach(hex, bg, need) {
  if (contrast(hex, bg) >= need) return hex;
  const [L, C, h] = toLch(hex), dir = lum(bg) > 0.18 ? -1 : 1;
  for (let k = 1; k <= 50; k++) { const c = lch(L + dir * k * 0.015, C, h); if (contrast(c, bg) >= need) return c; }
  return dir < 0 ? '#111111' : '#f5f5f5';
}
const R = (a, b) => a + Math.random() * (b - a);
const one = a => a[Math.floor(Math.random() * a.length)];
const RECIPES = {
  calm: { dark: 0.1, h: [170, 260], bgC: [0.006, 0.02], acC: [0.06, 0.11], off: [150, 190, 0] },
  bold: { dark: 0.35, h: [0, 360], bgC: [0.004, 0.02], acC: [0.17, 0.25], off: [180, 150, 210] },
  warm: { dark: 0.15, h: [30, 85], bgC: [0.015, 0.035], acC: [0.11, 0.17], off: [0, -20, 20, 180] },
  fresh: { dark: 0.05, h: [135, 215], bgC: [0.01, 0.03], acC: [0.11, 0.17], off: [0, 30, -30] },
  luxe: { dark: 0.65, h: [20, 95], bgC: [0.006, 0.02], acC: [0.08, 0.12], off: [0, 10, 330] },
  playful: { dark: 0.12, h: [0, 360], bgC: [0.03, 0.08], acC: [0.18, 0.26], off: [120, 180, 240] },
  minimal: { dark: 0.2, h: [0, 360], bgC: [0, 0.006], acC: [0.12, 0.2], off: [0, 90, 200] },
  dark: { dark: 1, h: [0, 360], bgC: [0.005, 0.02], acC: [0.12, 0.19], off: [180, 150, 30] },
  classic: { dark: 0.1, h: [60, 100], bgC: [0.012, 0.025], acC: [0.08, 0.14], off: [180, 200, 160], inkHue: [255, 20, 150] },
};
export function generate(mood = 'any', cur = null, locks = new Set()) {
  const r = RECIPES[mood] || RECIPES[one(Object.keys(RECIPES))];
  const keep = k => cur && locks.has(k);
  let dark, h0;
  if (keep('bg')) { const [L, , h] = toLch(cur.bg); dark = L < 0.5; h0 = h; }
  else { dark = Math.random() < r.dark; h0 = R(r.h[0], r.h[1]) % 360; }
  const p = {};
  p.bg = keep('bg') ? cur.bg : lch(dark ? R(0.15, 0.21) : R(0.955, 0.985), R(r.bgC[0], r.bgC[1]), h0);
  const bL = toLch(p.bg)[0];
  p.surface = keep('surface') ? cur.surface : lch(dark ? bL + 0.045 : bL - 0.04, R(r.bgC[0], r.bgC[1]) * 1.1, h0);
  const inkH = r.inkHue ? one(r.inkHue) : (Math.random() < 0.6 ? h0 : h0 + 180);
  p.ink = keep('ink') ? cur.ink : reach(lch(dark ? R(0.93, 0.97) : R(0.17, 0.25), dark ? R(0.005, 0.02) : R(0.02, 0.06), inkH), p.bg, 7);
  p.muted = keep('muted') ? cur.muted : reach(lch(dark ? 0.72 : 0.54, 0.02, inkH), p.bg, 4.6);
  if (keep('accent')) p.accent = cur.accent;
  else {
    p.accent = lch(dark ? R(0.7, 0.82) : R(0.47, 0.62), R(r.acC[0], r.acC[1]), (h0 + one(r.off) + 360) % 360);
    if (contrast(p.accent, p.bg) < 2.2) p.accent = reach(p.accent, p.bg, 2.2);
  }
  if (keep('accentInk')) p.accentInk = cur.accentInk;
  else {
    p.accentInk = ['#ffffff', '#111111', p.ink, p.bg].sort((a, b) => contrast(b, p.accent) - contrast(a, p.accent))[0];
    if (contrast(p.accentInk, p.accent) < 4.5 && !keep('accent')) p.accent = reach(p.accent, p.accentInk, 4.5);
  }
  return withId(p);
}
const ROLES = [['bg', 'Background'], ['surface', 'Surface'], ['ink', 'Text'], ['muted', 'Soft text'], ['accent', 'Accent'], ['accentInk', 'On accent']];
const withId = p => Object.assign(p, { id: 'c-' + ROLES.map(([k]) => p[k].slice(1)).join('-'), name: p.name || 'Your palette' });
const fromId = id => {
  if (PAL[id]) return PAL[id];
  if (!/^c-([0-9a-f]{6}-){5}[0-9a-f]{6}$/i.test(id || '')) return null;
  const h = id.slice(2).split('-');
  return withId(Object.fromEntries(ROLES.map(([k], i) => [k, '#' + h[i]])));
};
const swatches = p => `<span class="pal-sw"><i style="background:${p.bg}"></i><i style="background:${p.surface}"></i><i style="background:${p.ink}"></i><i style="background:${p.accent}"></i></span>`;
const lookName = (t, pal, font) => `${t.name}, in ${String(pal).startsWith('c-') ? 'my own colours' : (PAL[pal] ? PAL[pal].name : pal)}, with ${FNT[font] ? FNT[font].name : font}`;
const palChip = (p, on) => `<button type="button" class="pal" data-p="${p.id}" aria-pressed="${!!on}">${swatches(p)}<span class="pal-n">${esc(p.name)}</span></button>`;

/* =========================================================
   THE WALL: three columns of template pictures drifting past
   ========================================================= */
(function wall() {
  const box = $('#wall');
  const cols = [[], [], []];
  // a mixed set of 48: interactive and still templates taking turns
  const moving = TEMPLATES.filter(t => t.fx && t.fx.length), still = TEMPLATES.filter(t => !(t.fx && t.fx.length));
  const pool = []; for (let i = 0; pool.length < 48 && (i < moving.length || i < still.length); i++) { if (moving[i]) pool.push(moving[i]); if (still[i * 2]) pool.push(still[i * 2]); }
  pool.forEach((t, i) => cols[i % 3].push(t));
  box.innerHTML = cols.map(c => { const items = c.map(t => `<div class="wt"><img src="${thumb(t)}" alt="" loading="lazy" decoding="async" onerror="this.remove()" style="background:${(PAL[t.pal] || {}).bg}"></div>`).join(''); return `<div class="wcol">${items}${items}</div>`; }).join('');
  if (calm) return;
  const el = $$('.wcol', box), speed = [0.32, -0.24, 0.4], off = [0, 0, 0];
  let on = true;
  new IntersectionObserver(es => (on = es[0].isIntersecting)).observe($('.st-wall'));
  let last = performance.now();
  const step = now => {
    const dt = Math.min(48, now - last); last = now;
    if (on) el.forEach((c, i) => {
      const half = c.scrollHeight / 2 || 1;
      off[i] = (off[i] + speed[i] * dt * 0.06) % half;
      const y = speed[i] > 0 ? -off[i] : -(half - Math.abs(off[i]) % half);
      c.style.transform = `translate3d(0, ${y}px, 0)`;
    });
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})();

/* =========================================================
   FILTERS AND CARDS
   ========================================================= */
const F = { group: 'all', cat: 'all', mood: 'all', fx: false };
const live = t => !!(t.fx && t.fx.length);
let shown = TEMPLATES;
const inGroup = t => F.group === 'all' || CATS[t.cat].group === F.group;
const chip = (v, label, on, n) => `<button type="button" data-v="${v}" aria-pressed="${on}">${esc(label)}${n != null ? `<small>${n}</small>` : ''}</button>`;
function drawFilters() {
  $('#fGroup').innerHTML = chip('all', 'Everything', F.group === 'all', TEMPLATES.length) + GROUPS.map(g => { const n = TEMPLATES.filter(t => CATS[t.cat].group === g.id).length; return n ? chip(g.id, g.label, F.group === g.id, n) : ''; }).join('');
  const cats = [...new Set(TEMPLATES.filter(inGroup).map(t => t.cat))];
  $('#fCat').innerHTML = `<option value="all">Every kind of business</option>` + cats.map(c => `<option value="${c}"${F.cat === c ? ' selected' : ''}>${esc(CATS[c].label)}</option>`).join('');
  const moods = MOODS.filter(m => TEMPLATES.some(t => t.moods.includes(m.id)));
  $('#fMood').innerHTML = `<button type="button" class="fx-chip" data-fx aria-pressed="${F.fx}">Interactive<small>${TEMPLATES.filter(live).length}</small></button>` + chip('all', 'Any mood', F.mood === 'all') + moods.map(m => chip(m.id, m.label, F.mood === m.id)).join('');
}
function card(t, k) {
  const p = PAL[t.pal], C = CATS[t.cat];
  return `<button type="button" class="tc" data-id="${t.id}" style="--k:${k};--c-bg:${p.bg};--c-ink:${p.ink}">
    <span class="tc-shot">${live(t) ? '<span class="tc-fx">Interactive</span>' : ''}<img src="${thumb(t)}" alt="" loading="${k < 6 ? 'eager' : 'lazy'}" decoding="async" onerror="this.outerHTML='<span class=&quot;ph-fill&quot;>${esc(t.name)}</span>'"><span class="tc-open">Open ↗</span></span>
    <span class="tc-meta"><b>${esc(t.name)}</b><span>${esc(C.label)}</span></span>
    <span class="tc-foot"><span class="sw5"><i style="background:${p.bg}"></i><i style="background:${p.surface}"></i><i style="background:${p.ink}"></i><i style="background:${p.accent}"></i><i style="background:${(p.fields && p.fields[0] ? p.fields[0].bg : p.muted)}"></i></span><span class="tc-moods">${t.moods.map(m => MOOD[m]).join(' · ')}</span></span>
  </button>`;
}
function drawGrid() {
  shown = TEMPLATES.filter(t => inGroup(t) && (F.cat === 'all' || t.cat === F.cat) && (F.mood === 'all' || t.moods.includes(F.mood)) && (!F.fx || live(t)));
  shown.sort((a, b) => live(b) - live(a));   // the interactive ones first
  $('#grid').innerHTML = shown.map(card).join('');
  $('#empty').hidden = shown.length > 0;
  $('#fCount').textContent = `${shown.length} of ${TEMPLATES.length} templates`;
}
// hover: scroll the picture through the whole page
$('#grid').addEventListener('pointerenter', e => {
  const c = e.target.closest?.('.tc'); if (!c) return;
  const img = $('img', c), box = $('.tc-shot', c); if (!img) return;
  const s = Math.max(0, img.offsetHeight - box.clientHeight);
  box.style.setProperty('--scroll', s + 'px'); box.style.setProperty('--sdur', Math.max(1.8, s / 260).toFixed(2) + 's');
}, true);
$('#grid').addEventListener('click', e => { const c = e.target.closest('.tc'); if (c) openViewer(c.dataset.id); });
$('#fGroup').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; F.group = b.dataset.v; F.cat = 'all'; drawFilters(); drawGrid(); });
$('#fCat').addEventListener('change', e => { F.cat = e.target.value; drawGrid(); });
$('#fMood').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-fx')) F.fx = !F.fx; else F.mood = b.dataset.v; drawFilters(); drawGrid(); });
$('#clear').addEventListener('click', () => { F.group = F.cat = F.mood = 'all'; F.fx = false; drawFilters(); drawGrid(); });
drawFilters(); drawGrid();

/* =========================================================
   FRAMES: a template page scaled into a box
   ========================================================= */
const DEV = { desk: [1440, 900], tab: [834, 1112], phone: [390, 844] };
function fitFrame(box, frame, dev, stage, fill) {
  const [W, H] = DEV[dev];
  const pad = parseFloat(getComputedStyle(stage).paddingLeft) || 0;
  const aw = stage.clientWidth - pad * 2, ah = stage.clientHeight - pad * 2;
  let s, bw, bh, fh;
  if (dev === 'desk' && fill) { s = Math.min(1, aw / W); bw = W * s; bh = ah; fh = ah / s; }
  else if (dev === 'desk') { s = aw / W; bw = aw; bh = aw * 0.65; fh = bh / s; }
  else { s = Math.min(1, aw / W, ah / H); bw = W * s; bh = H * s; fh = H; }
  box.style.width = bw + 'px'; box.style.height = bh + 'px';
  frame.style.width = W + 'px'; frame.style.height = fh + 'px';
  frame.style.transform = `scale(${s})`;
  box.className = box.className.replace(/\b(desk|tab|phone)\b/g, '').trim() + ' ' + dev;
}
const send = (frame, msg) => { try { frame.contentWindow && frame.contentWindow.postMessage(msg, location.origin); } catch (e) {} };

/* =========================================================
   THE VIEWER
   ========================================================= */
const vw = $('#vw'), vFrame = $('#vwFrame'), vBox = $('#vwFrameBox'), vStage = $('#vwStage');
const V = { id: null, pal: null, font: null, dev: innerWidth < 900 ? 'phone' : 'desk', mood: 'all' };
let mine = [];
function suggest(t) {
  const own = PAL[t.pal], dark = lum(own.bg) < 0.2;
  const score = p => (p.moods || []).filter(m => t.moods.includes(m)).length * 2 + ((lum(p.bg) < 0.2) === dark ? 1 : 0) + (p.id.length % 3) * 0.01;
  return [own, ...PALETTES.filter(p => p.id !== own.id).sort((a, b) => score(b) - score(a)).slice(0, 7)];
}
function drawSide() {
  const t = TPL[V.id];
  const cur = V.pal || t.pal;
  $('#vwSug').innerHTML = suggest(t).map((p, i) => palChip(i === 0 ? { ...p, name: p.name + ' (original)' } : p, p.id === cur)).join('');
  $('#vwMineBox').hidden = !mine.length;
  $('#vwMine').innerHTML = mine.map(p => palChip(p, p.id === cur)).join('');
  $('#vwMood').innerHTML = chip('all', 'All', V.mood === 'all') + MOODS.map(m => chip(m.id, m.label, V.mood === m.id)).join('');
  $('#vwAll').innerHTML = PALETTES.filter(p => V.mood === 'all' || (p.moods || []).includes(V.mood)).map(p => palChip(p, p.id === cur)).join('');
  const fc = V.font || t.font;
  $('#vwFonts').innerHTML = FONTS.map(f => `<button type="button" class="fnt" data-f="${f.id}" aria-pressed="${f.id === fc}"><span class="aa" style="font-family:'${f.d}';font-weight:${f.w};font-style:${f.it ? 'italic' : 'normal'};font-stretch:${f.wdth || '100%'}">Aa</span><span><b>${esc(f.name)}</b><small>${f.id === t.font ? 'Original · ' : ''}${esc(f.cls)}</small></span></button>`).join('');
}
function links() {
  const t = TPL[V.id];
  const q = new URLSearchParams({ t: V.id }); if (V.pal && V.pal !== t.pal) q.set('p', V.pal); if (V.font && V.font !== t.font) q.set('f', V.font);
  $('#vwOpen').href = `/studio/view/?${q}`;
  const c = new URLSearchParams({ look: V.id, palette: V.pal || t.pal, font: V.font || t.font, name: lookName(t, V.pal || t.pal, V.font || t.font) });
  $('#vwGo').href = `/contact/?${c}`;
  history.replaceState(null, '', `/studio/?${q}`);
}
function loadFrame() {
  const t = TPL[V.id];
  const q = new URLSearchParams({ t: V.id }); if (V.pal) q.set('p', V.pal); if (V.font) q.set('f', V.font);
  vFrame.src = viewUrl(q);
}
function openViewer(id, opt = {}) {
  const t = TPL[id]; if (!t) return;
  V.id = id; V.pal = opt.pal || null; V.font = opt.font || null;
  $('#vwName').textContent = t.name;
  $('#vwCat').textContent = `${CATS[t.cat].label} · ${t.moods.map(m => MOOD[m]).join(', ')}${live(t) ? ' · Interactive: move your mouse and scroll' : ''}`;
  drawSide(); loadFrame(); links();
  if (!vw.open) { vw.showModal(); root.classList.add('vw-on'); window.__lenis?.stop(); }
  requestAnimationFrame(() => fitFrame(vBox, vFrame, V.dev, vStage, true));
  $$('#vwDev button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dev === V.dev)));
}
function closeViewer() {
  if (!vw.open) return;
  const done = () => { vw.classList.remove('out'); vw.close(); root.classList.remove('vw-on'); window.__lenis?.start(); vFrame.src = 'about:blank'; history.replaceState(null, '', '/studio/'); };
  if (calm) return done();
  vw.classList.add('out'); setTimeout(done, 260);
}
$('#vwClose').addEventListener('click', closeViewer);
vw.addEventListener('cancel', e => { e.preventDefault(); closeViewer(); });
$('#vwDev').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; V.dev = b.dataset.dev; $$('button', e.currentTarget).forEach(x => x.setAttribute('aria-pressed', String(x === b))); fitFrame(vBox, vFrame, V.dev, vStage, true); });
$('.vw-step').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const list = shown.length ? shown : TEMPLATES; const i = list.findIndex(t => t.id === V.id);
  openViewer(list[(i + (+b.dataset.step) + list.length) % list.length].id);
});
$('.vw-side .tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('.vw-side .tabs button').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  $$('.vw-pane').forEach(p => (p.hidden = p.dataset.pane !== b.dataset.tab));
  if (b.dataset.tab === 'font') loadAllFonts();
});
function setPal(id, p) {
  V.pal = id;
  send(vFrame, { type: 'palette', palette: p || fromId(id) });
  $$('.vw-side .pal').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.p === id)));
  links();
}
$('.vw-side').addEventListener('click', e => {
  const p = e.target.closest('.pal'), f = e.target.closest('.fnt'), m = e.target.closest('#vwMood button');
  if (p) setPal(p.dataset.p);
  if (f) { V.font = f.dataset.f; send(vFrame, { type: 'font', id: V.font }); $$('.fnt').forEach(x => x.setAttribute('aria-pressed', String(x === f))); links(); }
  if (m) { V.mood = m.dataset.v; drawSide(); }
});
$('#vwShuffle').addEventListener('click', () => {
  const t = TPL[V.id];
  const p = generate(t.moods[0]); p.name = `Shuffled ${mine.filter(x => x.name.startsWith('Shuffled')).length + 1}`;
  mine = [p, ...mine].slice(0, 6); drawSide(); setPal(p.id, p);
});
let fontsLoaded = false;
function loadAllFonts() {
  if (fontsLoaded) return; fontsLoaded = true;
  const hrefs = new Set(FONTS.flatMap(f => f.href));
  hrefs.forEach(h => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); });
}
addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data) return;
  // a palette or font picked while the frame was still loading would be lost: send the current ones again
  if (e.data.type === 'ready' && e.source === vFrame.contentWindow) {
    if (V.pal) { const p = fromId(V.pal) || mine.find(m => m.id === V.pal); if (p) send(vFrame, { type: 'palette', palette: p }); }
    if (V.font) send(vFrame, { type: 'font', id: V.font });
  }
  if (e.data.type === 'ready' && e.source === lFrame.contentWindow) send(lFrame, { type: 'palette', palette: L.pal });
});
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (vw.open) fitFrame(vBox, vFrame, V.dev, vStage, true); fitLab(); }, 120); });

/* =========================================================
   THE COLOUR LAB
   ========================================================= */
const lFrame = $('#labFrame'), lStage = $('#labStage');
const L = { pal: null, locks: new Set(), mood: 'any', tpl: 'freshly', back: [] };
const lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const onCol = c => (contrast(c, '#ffffff') > contrast(c, '#111111') ? '#ffffff' : '#111111');
function drawLab(flash = []) {
  const p = L.pal;
  $('#labSw').innerHTML = ROLES.map(([k, label]) => `<label class="sw${flash.includes(k) ? ' flash' : ''}" style="--c:${p[k]};--on:${onCol(p[k])}"><span class="top"><span class="role">${label}</span><button type="button" class="lock" data-k="${k}" aria-pressed="${L.locks.has(k)}" aria-label="${L.locks.has(k) ? 'Unlock' : 'Lock'} ${label.toLowerCase()}">${lockIcon}</button></span><span class="hex">${p[k]}</span><input type="color" value="${p[k]}" data-k="${k}" aria-label="Change ${label.toLowerCase()}"></label>`).join('');
  const checks = [
    ['Text on background', contrast(p.ink, p.bg), 7, 4.5],
    ['Soft text on background', contrast(p.muted, p.bg), 4.5, 4.5],
    ['Button text', contrast(p.accentInk, p.accent), 4.5, 4.5],
    ['Buttons stand out', contrast(p.accent, p.bg), 3, 2],
  ];
  $('#labChecks').innerHTML = checks.map(([n, c, best, ok]) => `<li><span>${n}</span><b class="${c < ok ? 'no' : ''}">${c.toFixed(1)}:1 ${c >= best ? 'Great' : c >= ok ? 'Good' : 'Too low'}</b></li>`).join('');
  $('#labBack').disabled = !L.back.length;
  const lt = TPL[L.tpl];
  const c = new URLSearchParams({ look: L.tpl, palette: p.id, font: lt.font, name: lookName(lt, p.id, lt.font) });
  $('#labGo').href = `/contact/?${c}`;
  send(lFrame, { type: 'palette', palette: p });
  store.set('bd-lab', { pal: p, mood: L.mood, tpl: L.tpl });
  const i = mine.findIndex(x => x.name === 'Colour lab');
  const mp = { ...p, name: 'Colour lab' };
  if (i >= 0) mine[i] = mp; else mine = [mp, ...mine].slice(0, 6);
}
function shuffle() {
  const before = L.pal;
  L.back = [before, ...L.back].slice(0, 30);
  L.pal = generate(L.mood, before, L.locks);
  drawLab(ROLES.map(([k]) => k).filter(k => L.pal[k] !== before[k]));
}
$('#labShuffle').addEventListener('click', shuffle);
$('#labBack').addEventListener('click', () => { if (!L.back.length) return; L.pal = L.back.shift(); drawLab(); });
$('#labSw').addEventListener('click', e => {
  const b = e.target.closest('.lock'); if (!b) return;
  e.preventDefault(); const k = b.dataset.k;
  L.locks.has(k) ? L.locks.delete(k) : L.locks.add(k);
  b.setAttribute('aria-pressed', String(L.locks.has(k))); b.setAttribute('aria-label', (L.locks.has(k) ? 'Unlock ' : 'Lock ') + k);
});
$('#labSw').addEventListener('input', e => {
  const k = e.target.dataset.k; if (!k) return;
  L.pal = withId({ ...L.pal, [k]: e.target.value, name: 'Your palette' });
  const sw = e.target.closest('.sw'); sw.style.setProperty('--c', e.target.value); sw.style.setProperty('--on', onCol(e.target.value)); $('.hex', sw).textContent = e.target.value;
  send(lFrame, { type: 'palette', palette: L.pal });
});
$('#labSw').addEventListener('change', e => { if (e.target.dataset.k) { L.locks.add(e.target.dataset.k); drawLab(); } });
const moodChips = (el, cur, any) => (el.innerHTML = chip('any', any, cur === 'any') + MOODS.map(m => chip(m.id, m.label, cur === m.id)).join(''));
$('#labMood').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; L.mood = b.dataset.v; moodChips($('#labMood'), L.mood, 'Surprise me'); shuffle(); });
// templates to try it on, grouped by business
$('#labTpl').innerHTML = GROUPS.map(g => { const ts = TEMPLATES.filter(t => CATS[t.cat].group === g.id); return ts.length ? `<optgroup label="${esc(g.label)}">${ts.map(t => `<option value="${t.id}">${esc(t.name)} · ${esc(CATS[t.cat].label)}</option>`).join('')}</optgroup>` : ''; }).join('');
$('#labTpl').addEventListener('change', e => { L.tpl = e.target.value; lFrame.src = viewUrl(`t=${L.tpl}&p=${L.pal.id}`); drawLab(); });
$('#labOpen').addEventListener('click', () => openViewer(L.tpl, { pal: L.pal.id }));
function fitLab() { if (lFrame.src) fitFrame(lStage, lFrame, 'desk', lStage.parentElement, false); }
// the library of ready-made palettes
let libMood = 'any';
function drawLib() {
  moodChips($('#libMood'), libMood, 'All');
  $('#libWall').innerHTML = PALETTES.filter(p => libMood === 'any' || (p.moods || []).includes(libMood)).map(p => palChip(p, p.id === L.pal.id)).join('');
}
$('#libMood').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; libMood = b.dataset.v; drawLib(); });
$('#libWall').addEventListener('click', e => {
  const b = e.target.closest('.pal'); if (!b) return;
  L.back = [L.pal, ...L.back].slice(0, 30); L.pal = { ...PAL[b.dataset.p] }; L.locks.clear();
  drawLab(ROLES.map(([k]) => k)); drawLib();
});
// space bar shuffles while the lab is on screen and nothing else has focus
let labOn = false;
new IntersectionObserver(es => (labOn = es[0].intersectionRatio > 0.25), { threshold: [0, 0.25, 0.5] }).observe($('#colour'));
addEventListener('keydown', e => {
  if (e.code !== 'Space' || !labOn || vw.open || e.target.closest('input, select, textarea, button, a')) return;
  e.preventDefault(); shuffle();
});
// start: last palette from this browser, or a fresh one
const saved = store.get('bd-lab');
L.pal = saved && saved.pal && saved.pal.bg ? withId(saved.pal) : { ...PAL['sky-sand'] };
if (saved && TPL[saved.tpl]) L.tpl = saved.tpl;
if (saved && saved.mood) L.mood = saved.mood;
$('#labTpl').value = L.tpl;
moodChips($('#labMood'), L.mood, 'Surprise me');
drawLab(); drawLib();
// load the lab's template when it comes near the screen
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { lFrame.src = viewUrl(`t=${L.tpl}&p=${L.pal.id}`); fitLab(); o.disconnect(); } }, { rootMargin: '600px 0px' }).observe($('#colour'));

/* ---------- open a template straight from the address ---------- */
const q = new URLSearchParams(location.search);
if (q.get('t') && TPL[q.get('t')]) openViewer(q.get('t'), { pal: q.get('p') || null, font: q.get('f') || null });
