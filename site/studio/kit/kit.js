// BiomeDrive Studio: the template engine. Turns one template definition (data/templates.js)
// into a full page: nav, hero, sections and footer, dressed by a palette and a type pairing.
// Used by studio/view/ (which the Studio shows in an iframe) and by the thumbnail tool.
import { PALETTES } from '../data/palettes.js?v=17';
import { FONTS } from '../data/fonts.js?v=17';
import { PHOTOS, PHOTO_URL } from '../data/photos.js?v=17';
import { CATS } from '../data/content.js?v=17';
import { icon } from './icons.js?v=17';

const ALT = Object.fromEntries(PHOTOS.map(p => [p.id, p.alt]));
const YEAR = new Date().getFullYear();
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = (arr, key) => arr[hash(key) % arr.length];
const tel = p => 'tel:' + String(p).replace(/[^\d+]/g, '');
const initials = n => String(n).split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 2).join('');

/* ---------------- palettes and type ---------------- */
export const findPalette = id => {
  if (id && id.startsWith('c-')) {
    const h = id.slice(2).split('-').map(x => '#' + x);
    if (h.length >= 6 && h.every(x => /^#[0-9a-f]{6}$/i.test(x))) return { id, name: 'Your palette', bg: h[0], surface: h[1], ink: h[2], muted: h[3], accent: h[4], accentInk: h[5], moods: [] };
  }
  return PALETTES.find(p => p.id === id);
};
export const findFont = id => FONTS.find(f => f.id === id);

export function paletteVars(p) {
  const f = p.fields || [];
  const f1 = f[0] || { bg: p.ink, ink: p.bg }, f2 = f[1] || { bg: p.accent, ink: p.accentInk }, f3 = f[2] || { bg: p.surface, ink: p.ink };
  return { '--bg': p.bg, '--surface': p.surface, '--ink': p.ink, '--muted': p.muted, '--accent': p.accent, '--accent-ink': p.accentInk,
    '--f1-bg': f1.bg, '--f1-ink': f1.ink, '--f2-bg': f2.bg, '--f2-ink': f2.ink, '--f3-bg': f3.bg, '--f3-ink': f3.ink };
}
export function applyPalette(p, root = document.documentElement) {
  for (const [k, v] of Object.entries(paletteVars(p))) root.style.setProperty(k, v);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = p.bg;
}
export function applyFont(f, root = document.documentElement) {
  for (const h of f.href) {
    if (!document.querySelector(`link[data-font="${h}"]`)) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; l.dataset.font = h; document.head.appendChild(l);
    }
  }
  const q = n => `'${n}'`;
  const set = { '--f-d': q(f.d), '--f-t': q(f.t), '--d-w': f.w, '--d-track': f.track, '--d-lead': f.lead, '--d-case': f.upper ? 'uppercase' : 'none', '--d-style': f.it ? 'italic' : 'normal', '--d-stretch': f.wdth || '100%', '--k': f.k || 1 };
  for (const [k, v] of Object.entries(set)) root.style.setProperty(k, v);
}

/* ---------------- words used across sections ---------------- */
const HEADS = {
  services: [['What we do'], ['Our services'], ['How we can *help*'], ['Everything,', 'done properly'], ['The work']],
  about: [['A local firm,', 'built on *trust*'], ['Who we are'], ['Our story'], ['Since {since}'], ['Small team,', 'high standards']],
  reviews: [['What {city} says'], ['Kind words'], ['Rated {rating} by our clients'], ['Don’t take our word for it']],
  process: [['How it works'], ['Simple from start to finish'], ['Four easy steps']],
  area: [['Where we work'], ['Areas we cover'], ['Close to home']],
  faq: [['Questions,', '*answered*'], ['Good to know'], ['Common questions']],
  gallery: [['Recent work'], ['From the portfolio'], ['A look around']],
  prices: [['Simple pricing'], ['Prices'], ['Choose a plan']],
  menu: [['The menu'], ['On the menu'], ['Prices']],
  visit: [['Come and see us'], ['Visit us'], ['Find us']],
  team: [['The team'], ['Meet the team'], ['The people']],
  book: [['Book a time'], ['Pick a slot'], ['Book online']],
  contact: [['Get in touch'], ['Say hello'], ['Talk to us']],
};
const INTROS = {
  services: 'Clear prices, careful work and a guarantee on everything we do.',
  area: 'We cover {city} and the towns around it. Not sure if we reach you? Ask.',
  gallery: 'A few recent pieces of work. Drag to see more.',
  book: 'Choose a day and time and we’ll confirm by text within the hour.',
};
const ROLES = { trades: ['Founder', 'Operations lead', 'Senior technician', 'Customer care'], food: ['Owner', 'Head chef', 'Front of house', 'Pastry'], care: ['Founder', 'Senior practitioner', 'Practitioner', 'Client care'], pro: ['Founding partner', 'Partner', 'Senior associate', 'Client manager'], shops: ['Founder', 'Studio lead', 'Assistant', 'Client care'] };
const FIRST = ['Maya', 'Leo', 'Ana', 'Sam', 'Iris', 'Theo', 'Nina', 'Omar', 'Ruth', 'Jonah', 'Elena', 'Kai', 'Grace', 'Felix', 'Zara', 'Hugo', 'Lena', 'Max'];
const LAST = ['Reyes', 'Novak', 'Hart', 'Bishop', 'Lund', 'Carver', 'Okafor', 'Price', 'Moreau', 'Walsh', 'Kim', 'Duarte', 'Ellis', 'Byrne'];

/* ---------------- building blocks ---------------- */
function makeCtx(t) {
  const C = CATS[t.cat];
  const b = t.biz;
  const years = YEAR - b.since;
  const rate = C.stats.find(s => s.d === 1) || { v: 4.9, l: 'average rating' };
  const fill = s => String(s ?? '').replace(/\{(\w+)\}/g, (m, k) => ({ name: b.name, short: b.short, city: b.city, since: b.since, years, owner: b.owner, rating: rate.v }[k] ?? m));
  const cur = b.cur || '$';
  let pi = 0;
  const x = {
    t, C, b, years, fill, cur, rate,
    reviews: (k => [...C.reviews.slice(k), ...C.reviews.slice(0, k)])(hash(t.id) % C.reviews.length),
    nextPhoto: () => (t.photos && pi < t.photos.length ? t.photos[pi++] : null),
    town: i => (b.area && b.area.length ? b.area[i % b.area.length] : b.city),
    shot: false,
  };
  const g = C.group;
  x.act1 = t.act || (C.emergency ? `Call ${b.phone}` : g === 'food' ? (C.booking ? 'Book a table' : 'Order ahead') : g === 'pro' ? (t.cat === 'realestate' ? 'Free valuation' : 'Book a free call') : C.booking ? 'Book online' : t.cat === 'florist' ? 'Order flowers' : 'Get a free quote');
  x.href1 = C.emergency ? tel(b.phone) : '#' + (t.secs.includes('book') ? 'book' : t.secs.includes('contact') ? 'contact' : t.secs.includes('visit') ? 'visit' : 'contact');
  x.act2 = g === 'food' ? 'See the menu' : t.secs.includes('prices') ? 'See prices' : 'Our services';
  x.href2 = '#' + (t.secs.includes('menu') || t.hero === 'menu' ? 'menu' : t.secs.includes('prices') ? 'prices' : 'services');
  x.b1 = (cls = '') => `<a class="btn ${cls}" href="${x.href1}">${C.emergency ? icon('phone') : ''}<span>${esc(x.act1)}</span>${C.emergency ? '' : '<span class="arr">→</span>'}</a>`;
  x.b2 = (cls = 'ghost') => `<a class="btn ${cls}" href="${x.href2}">${esc(x.act2)}</a>`;
  return x;
}

function inline(s, x) {
  return esc(x.fill(s)).replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[\]/g, () => `<span class="pill">${photo(x, null, 320, '', 'eager')}</span>`)
    .replace(/\{\}/g, () => `<span class="tick" data-tick>${(x.t.rot || ['']).map((w, i) => `<span class="${i ? '' : 'on'}">${esc(w)}</span>`).join('')}</span>`);
}
function lines(arr, x) {
  return arr.map((l, i) => `<span class="ln" style="--l:${i}"><span>${inline(l, x)}</span></span>`).join('');
}
function photo(x, ar, w, cls = '', load = 'lazy') {
  const id = x.nextPhoto();
  const style = ar ? ` style="--ar:${ar}"` : '';
  if (id == null) return `<figure class="ph drawn ${cls}"${style}>${icon(x.C.icon)}</figure>`;
  const r = ar ? ar.split('/').map(Number) : [16, 9];
  const ratio = r[0] / (r[1] || 1);
  const h = Math.round(w / ratio);
  const w2 = Math.round(w / 2), h2 = Math.round(h / 2);
  const ld = x.shot ? 'eager' : load;
  return `<figure class="ph ${cls}"${style}><img src="${PHOTO_URL(id, w, h)}" srcset="${PHOTO_URL(id, w2, h2)} ${w2}w, ${PHOTO_URL(id, w, h)} ${w}w" sizes="(max-width: 700px) 100vw, ${Math.round(w / 2)}px" alt="${esc(ALT[id] || '')}" loading="${ld}" decoding="async" width="${w}" height="${h}"></figure>`;
}
const num = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
function statVal(s, x) {
  const v = s.v === '{years}' ? x.years : s.v;
  return `<span data-count="${v}" data-d="${s.d || 0}">${num(v, s.d || 0)}</span>${esc(s.s || '')}`;
}
function money(p, x) {
  if (p === '' || p == null) return '';
  if (typeof p === 'number') return p === 0 ? 'Free' : `From ${x.cur}${num(p)}`;
  return /^\d/.test(p) ? `From ${x.cur}${p}` : esc(p);
}
const priceTag = (p, x) => `${x.cur}${p % 1 ? p.toFixed(2) : p}`;
function head(sec, x) {
  const arr = x.t.heads?.[sec] || pick(HEADS[sec] || [['']], x.t.id + sec);
  return `<h2 class="d sec-h" data-r="lines">${lines(arr, x)}</h2>`;
}
function todayHours(x) {
  const h = x.C.hours || [];
  return h[0] ? `${h[0][0]} ${h[0][1]}` : '';
}
function mapSvg(x, seed) {
  const r = rng(hash(seed || x.t.id));
  const W = 600, H = 540, cx = 300 + (r() - .5) * 60, cy = 270 + (r() - .5) * 40;
  let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" preserveAspectRatio="xMidYMid slice">`;
  // water: a river or a coast
  const y0 = 80 + r() * 380;
  s += `<path class="water" d="M-20 ${y0} C 150 ${y0 - 120 + r() * 80}, 260 ${y0 + 140 - r() * 80}, 420 ${y0 + 30} S 620 ${y0 - 60}, 640 ${y0 - 40} L 640 ${y0 + 34} C 560 ${y0 + 4}, 520 ${y0 + 96}, 420 ${y0 + 72} S 140 ${y0 + 12 + r() * 50}, -20 ${y0 + 46} Z"/>`;
  for (let i = 0; i < 4; i++) { const px = r() * 520, py = r() * 460; s += `<rect class="park" x="${px}" y="${py}" width="${40 + r() * 70}" height="${30 + r() * 50}" rx="6"/>`; }
  const ang = (r() - .5) * 0.5;
  s += `<g transform="rotate(${ang * 57.3} 300 270)">`;
  for (let i = -2; i < 18; i++) { const y = i * 36 + r() * 10; s += `<path class="st" stroke-width="${r() > .85 ? 3 : 1.4}" d="M-60 ${y} L 660 ${y + (r() - .5) * 40}"/>`; }
  for (let i = -2; i < 20; i++) { const xx = i * 38 + r() * 12; s += `<path class="st" stroke-width="${r() > .85 ? 3 : 1.4}" d="M${xx} -60 L ${xx + (r() - .5) * 50} 600"/>`; }
  s += `</g>`;
  s += `<path class="st main" stroke-width="5" d="M-20 ${120 + r() * 300} Q 300 ${r() * 540} 620 ${100 + r() * 340}"/>`;
  s += `<path class="st main" stroke-width="4" d="M${100 + r() * 400} -20 Q ${r() * 600} 270 ${100 + r() * 400} 560"/>`;
  s += `<circle class="ring" cx="${cx}" cy="${cy}" r="150"/><circle class="pulse" cx="${cx}" cy="${cy}" r="22"/><path class="pin" d="M${cx} ${cy + 2} c -12 -14 -18 -22 -18 -30 a 18 18 0 0 1 36 0 c 0 8 -6 16 -18 30z"/><circle cx="${cx}" cy="${cy - 28}" r="6.5" fill="var(--bg)"/>`;
  s += `</svg>`;
  const towns = (x.b.area || []).slice(0, 3);
  const spots = [[14, 18], [62, 74], [70, 16]];
  return s + towns.map((n, i) => `<span class="lbl" style="left:${spots[i][0]}%;top:${spots[i][1]}%">${esc(n)}</span>`).join('');
}

/* ---------------- nav ---------------- */
const LINKS = { hscroll: 'Services', stack: 'Services', accordion: 'Services', follow: 'Services', services: 'Services', menu: 'Menu', about: 'About', reviews: 'Reviews', quote: 'Reviews', area: 'Areas', prices: 'Prices', gallery: 'Work', listings: 'Homes', visit: 'Visit', faq: 'FAQ', team: 'Team', book: 'Book', contact: 'Contact', process: 'How it works' };
const IDS = { hscroll: 'services', stack: 'services', accordion: 'services', follow: 'services', quote: 'reviews', gallery: 'work', listings: 'work', process: 'how', servicesGrid: 'services' };
const OVER = new Set(['cover', 'card', 'liquid', 'zoom']);
function nav(x) {
  const { t, C, b } = x;
  const keys = t.secs.map(s => (s === 'servicesGrid' ? 'services' : s)).filter(s => LINKS[s]);
  const order = ['services', 'hscroll', 'stack', 'accordion', 'follow', 'menu', 'prices', 'gallery', 'listings', 'about', 'process', 'area', 'reviews', 'quote', 'team', 'visit', 'faq'];
  let links = order.filter(k => keys.includes(k)).slice(0, 4).map(k => [IDS[k] || k, LINKS[k]]);
  const logo = `<a class="logo${t.logoRound ? ' round' : ''}" href="#top">${t.mark === false ? '' : `<span class="mk">${icon(t.mark || C.icon)}</span>`}<span>${esc(b.short)}</span></a>`;
  const cta = C.emergency
    ? `<a class="btn sm nav-cta" href="${tel(b.phone)}">${icon('phone')}<span>${esc(b.phone)}</span></a>`
    : `<a class="btn sm nav-cta" href="${x.href1}">${esc(x.act1)}</a>`;
  const burger = `<button class="nav-burger" type="button" aria-label="Menu" aria-expanded="false"><i></i><i></i></button>`;
  const L = l => l.map(([h, n]) => `<a href="#${h}">${n}</a>`).join('');
  const util = t.nav === 'util' ? `<div class="util"><div class="wrap"><span><span class="dot"></span><b>${C.emergency ? 'Open 24/7' : 'Open today'}</b> · ${esc(todayHours(x))}</span><span>${esc(b.city)} · <a href="${tel(b.phone)}">${esc(b.phone)}</a></span></div></div>` : '';
  let inner;
  if (t.nav === 'center') {
    const h = Math.ceil(links.length / 2);
    inner = `<nav class="nav-links" aria-label="Main">${L(links.slice(0, h))}</nav>${logo}<nav class="nav-links r" aria-label="More">${L(links.slice(h))}</nav>${burger}`;
  } else if (t.nav === 'min') {
    inner = `${logo}<span style="margin-left:auto"></span>${cta}${burger.replace('nav-burger', 'nav-burger" style="display:block;margin-left:0')}`;
  } else {
    inner = `${logo}<nav class="nav-links" aria-label="Main">${L(links)}</nav>${cta}${burger}`;
  }
  const over = OVER.has(t.hero) ? ' over' : '';
  return `<header class="nav nav-${t.nav || 'bar'}${over}${t.nav === 'util' ? ' has-util' : ''}" data-nav>${util}<div class="wrap nav-in">${inner}</div></header>
<div class="sheet" data-sheet>${L(links)}<a class="btn" href="${x.href1}">${esc(x.act1)}</a></div>`;
}

/* ---------------- heroes ---------------- */
const HERO = {
  split(x) {
    const { C, b, t } = x;
    const badge = C.emergency ? `<b><span class="dot"></span>Open now</b><small>Average arrival ${C.stats[2]?.v || 45} min</small>`
      : C.booking ? `<b>${icon('cal')} Next free slot</b><small>Today at 3:30 pm</small>`
      : `<b>${icon('star')} ${x.rate.v} rating</b><small>${esc(x.fill(x.rate.l))}</small>`;
    return `<section class="hero h-split" id="top"><div class="wrap grid">
  <div class="copy">
    <p class="h-lede" data-r="up">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p>
    <h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1>
    <p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p>
    <div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div>
    <ul class="proof" data-r="up" style="--i:5"><li><span class="stars">★★★★★</span><b>${x.rate.v}</b> ${esc(x.fill(x.rate.l).replace(/^average( rating)? /, ''))}</li><li>${icon(C.badges[0].i)}${esc(C.badges[0].t)}</li></ul>
  </div>
  <div class="media"><div data-r="clip" style="--i:2">${photo(x, '4 / 5', 1000, '', 'eager')}</div><div class="h-badge" data-r="up" style="--i:6">${badge}</div></div>
</div></section>`;
  },
  monument(x) {
    const { t } = x;
    return `<section class="hero h-monu" id="top">
  <div class="top" data-r="clip">${photo(x, null, 2000, 'fill', 'eager')}</div>
  <div class="wrap">
    <h1 class="d name" data-fit data-r="lines"><span class="ln"><span>${esc(x.b.short)}</span></span></h1>
    <div class="row"><p data-r="up" style="--i:2">${t.head.map(l => inline(l, x)).join(' ')} <span>${esc(x.fill(t.sub))}</span></p><div class="acts" data-r="up" style="--i:3">${x.b1()}${x.b2()}</div></div>
  </div>
</section>`;
  },
  cover(x) {
    const { t } = x;
    return `<section class="hero h-cover" id="top">
  <div class="bg" data-par="0.14"><div data-r="zoom">${photo(x, null, 2200, 'fill', 'eager')}</div></div>
  <div class="scrim"></div>
  <div class="wrap in">
    <h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1>
    <div class="row"><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div></div>
  </div>
</section>`;
  },
  poster(x) {
    const { t, C, b } = x;
    const ring = `${C.badges[0].t} · ${C.label} · since ${b.since} · `;
    const items = C.services.map(s => `<span class="it d">${esc(s.n)}${icon(C.icon)}</span>`).join('');
    return `<section class="hero h-poster" id="top"><div class="wrap">
  <h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1>
  <div class="foot"><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div>
  <div class="rot" data-r="scale" style="--i:5"><svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="rp" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs><text textLength="236" lengthAdjust="spacing"><textPath href="#rp">${esc(ring)}</textPath></text></svg><span class="c">${icon(C.icon)}</span></div></div>
</div>
<div class="mq band fld fld-2" aria-hidden="true"><div class="mq-track">${items}${items}</div></div>
</section>`;
  },
  rescue(x) {
    const { t, C, b } = x;
    const uk = b.uk;
    const slots = [['8:00', 'Booked'], ['10:30', 'Booked'], [uk ? '13:00' : '1:00 pm', 'Free · book it'], [uk ? '15:30' : '3:30 pm', 'Free']];
    return `<section class="hero h-rescue" id="top"><div class="wrap grid">
  <div class="copy">
    <p class="live" data-r="up"><span class="dot"></span>Answering now · ${esc(C.label)} in ${esc(b.city)}</p>
    <h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1>
    <a class="h-phone d" href="${tel(b.phone)}" data-r="up" style="--i:3">${esc(b.phone)}</a>
    <p class="h-sub" data-r="up" style="--i:4">${esc(x.fill(t.sub))}</p>
    <form class="zip" data-zip data-r="up" style="--i:5"><input aria-label="Your ${uk ? 'postcode' : 'ZIP code'}" placeholder="Your ${uk ? 'postcode' : 'ZIP code'}" maxlength="10" autocomplete="postal-code"><button class="btn" type="submit">Check my area</button><output></output></form>
  </div>
  <aside class="media" data-r="up" style="--i:3">${photo(x, '3 / 2', 900, '', 'eager')}
    <div class="board"><p class="board-h"><span>Today in ${esc(b.city)}</span><span class="mute">${C.emergency ? 'Live' : ''}</span></p><ul>${slots.map(([a, s], i) => `<li class="${i > 1 ? 'free' : ''}"><span>${a}</span><span>${s}</span></li>`).join('')}</ul><p class="board-foot">Average arrival <b>${statVal(C.stats[2], x)}</b></p></div>
  </aside>
</div></section>`;
  },
  arch(x) {
    const { t, b } = x;
    return `<section class="hero h-arch" id="top"><div class="wrap">
  <h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1>
  <div class="row">
    <div class="side" data-r="up" style="--i:3"><p><b>Open today</b>${esc(todayHours(x))}</p><p><b>Find us</b>${esc(b.addr || b.city)}</p></div>
    <div data-r="clip" style="--i:2">${photo(x, '4 / 5', 900, 'arch', 'eager')}</div>
    <div class="side r" data-r="up" style="--i:4"><p class="h-sub">${esc(x.fill(t.sub))}</p>${x.b1()}</div>
  </div>
</div></section>`;
  },
  editorial(x) {
    const { t, C, b } = x;
    return `<section class="hero h-edit" id="top"><div class="wrap">
  <div class="mast" data-r="fade"><span>Est. ${b.since}</span><span>${esc(C.label)} · ${esc(b.city)}</span><span>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
  <p class="d mast-name" data-fit data-r="lines"><span class="ln"><span>${esc(b.name)}</span></span></p>
  <div class="edit-grid">
    <div class="left"><h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1><div class="acts" data-r="up" style="--i:3">${x.b1()}${x.b2()}</div></div>
    <div class="col2"><figure data-r="clip" style="--i:2">${photo(x, '5 / 4', 900, '', 'eager')}<figcaption>${esc(x.fill(t.caption || 'In {city} since {since}.'))}</figcaption></figure><p class="lead drop" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p></div>
  </div>
</div></section>`;
  },
  inline(x) {
    const { t } = x;
    return `<section class="hero h-inline" id="top"><div class="wrap">
  <h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1>
  <div class="foot" data-r="up" style="--i:4"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div>
</div></section>`;
  },
  collage(x) {
    const { t } = x;
    const pics = [0, 1, 2].map(i => `<div class="cp" data-r="tilt" style="--i:${i + 1}">${photo(x, '4 / 5', 700, '', 'eager')}</div>`).join('');
    return `<section class="hero h-collage" id="top"><div class="wrap"><div class="stage">
  <div class="pics">${pics}</div>
  <div class="words"><h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1><div class="row" data-r="up" style="--i:4"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
</div></div></section>`;
  },
  menu(x) {
    const { t, C } = x;
    return `<section class="hero h-menu" id="top"><div class="wrap grid">
  <div class="copy"><h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}</div><div data-r="clip" style="--i:3">${photo(x, '5 / 4', 900, '', 'eager')}</div></div>
  <div class="menu-list" id="menu">${menuGroups(C.menu || [], x)}</div>
</div></section>`;
  },
  numbers(x) {
    const { t, C } = x;
    return `<section class="hero h-num" id="top"><div class="wrap">
  <div class="top"><h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1><div class="r" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
  <div class="figs" data-r="list">${C.stats.map((s, j) => `<div style="--j:${j}"><div class="v">${statVal(s, x)}</div><div class="l">${esc(x.fill(s.l))}</div></div>`).join('')}</div>
  <div data-r="clip" style="--i:2">${photo(x, '21 / 8', 2000, 'wide', 'eager')}</div>
</div></section>`;
  },
  spotlight(x) {
    const { t } = x;
    return `<section class="hero h-spot" id="top">
  <div class="light" data-r="fade" data-par="0.1">${photo(x, null, 2000, 'fill', 'eager')}</div>
  <div class="wrap"><span class="rule" data-r="clipx"></span><h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div></div>
</section>`;
  },
  map(x) {
    const { t, C } = x;
    return `<section class="hero h-map" id="top"><div class="wrap grid">
  <div class="copy"><p class="h-lede" data-r="up">${icon('pin')}${esc(x.fill(t.lede || `${C.label} across {city}`))}</p><h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div></div>
  <div class="map" data-r="clip" style="--i:2">${mapSvg(x)}</div>
</div></section>`;
  },
  compare(x) {
    const { t } = x;
    const id = x.nextPhoto();
    const fig = cls => id == null ? '' : `<figure class="ph ${cls}"><img src="${PHOTO_URL(id, 1800, 772)}" alt="${cls === 'before' ? '' : esc(ALT[id] || '')}" loading="eager" decoding="async"></figure>`;
    return `<section class="hero h-cmp" id="top"><div class="wrap">
  <div class="top"><h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1><div class="r" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
  <div class="cmp" data-cmp data-r="up" style="--i:2;--ar:21 / 9">${fig('after')}${fig('before')}<div class="bar"><span class="knob" aria-hidden="true">↔</span></div><span class="tag b">Before</span><span class="tag a">After</span></div>
</div></section>`;
  },
  splitR(x) {
    return HERO.split(x).replace('class="hero h-split"', 'class="hero h-split rev"');
  },
  card(x) {
    const { t, C } = x;
    return `<section class="hero h-card" id="top">
  <div class="bg" data-par="0.12"><div data-r="zoom">${photo(x, null, 2200, 'fill', 'eager')}</div></div>
  <div class="wrap"><div class="card" data-r="up" style="--i:1">
    <p class="h-lede">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p>
    <h1 class="d hl" data-r="lines" style="--i:2">${lines(t.head, x)}</h1>
    <p class="h-sub">${esc(x.fill(t.sub))}</p>
    <div class="acts">${x.b1()}${x.b2()}</div>
  </div></div>
</section>`;
  },
  ticker(x) {
    const { t, C } = x;
    return `<section class="hero h-tick" id="top"><div class="wrap">
  <p class="h-lede" data-r="up">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p>
  <h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1>
  <div class="row">
    <div class="l" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div><ul class="proof"><li><span class="stars">★★★★★</span><b>${x.rate.v}</b> ${esc(x.fill(x.rate.l).replace(/^average( rating)? /, ''))}</li></ul></div>
    <div class="pic" data-r="clip" style="--i:2">${photo(x, '16 / 10', 1200, '', 'eager')}</div>
  </div>
</div></section>`;
  },
  index(x) {
    const { t, C } = x;
    const rows = C.services.slice(0, 5);
    const pics = [0, 1, 2].map(i => photo(x, null, 900, i ? '' : 'on', 'eager')).join('');
    return `<section class="hero h-index" id="top"><div class="wrap">
  <div class="top"><h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1><div class="r" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
  <div class="grid">
    <ul class="ix-rows" data-r="list">${rows.map((s, j) => `<li><a href="${x.href1}" data-ix="${j % 3}" class="${j ? '' : 'on'}"><span>${esc(x.fill(s.n))}</span><small>${money(s.p, x)}</small></a></li>`).join('')}</ul>
    <div class="ix-frame" data-r="up" style="--i:2">${pics}</div>
  </div>
</div></section>`;
  },
  banner(x) {
    const { t } = x;
    return `<section class="hero h-banner" id="top">
  <div class="wrap top"><h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1><div class="r" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
  <div class="band" data-r="clip" style="--i:2"><div class="par" data-par="0.12">${photo(x, null, 2200, 'fill', 'eager')}</div></div>
</section>`;
  },
  zoom(x) {
    const { t } = x;
    return `<section class="hero h-zoom" id="top" data-zoom><div class="zm-stick">
  <div class="zm-win">${photo(x, null, 2200, 'fill', 'eager')}<div class="zm-scrim"></div></div>
  <h1 class="d hl zm-head" data-r="lines">${lines(t.head, x)}</h1>
  <div class="zm-end wrap"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div>
  <p class="zm-hint" aria-hidden="true">Scroll</p>
</div></section>`;
  },
  terrain(x) {
    const { t, C } = x;
    return `<section class="hero h-terrain" id="top"><canvas class="topo" data-topo aria-hidden="true"></canvas>
  <div class="wrap tr-in"><p class="h-lede" data-r="up">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p><h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1>
  <div class="row" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
</section>`;
  },
  liquid(x) {
    const { t } = x;
    return `<section class="hero h-cover h-liquid" id="top">
  <div class="bg"><div class="lq" data-liquid>${photo(x, null, 2000, 'fill', 'eager')}</div></div>
  <div class="scrim"></div>
  <div class="wrap in">
    <h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1>
    <div class="row"><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div></div>
  </div>
</section>`;
  },
  depth(x) {
    const { t, C } = x;
    const p1 = photo(x, '3 / 4', 640, '', 'eager'), p2 = photo(x, '4 / 5', 640, '', 'eager');
    const st = C.stats.find(z => z.v !== '{years}') || C.stats[0];
    return `<section class="hero h-depth" id="top">
  <div class="dp-field" aria-hidden="true">
    <div class="dp dp-a" data-depth="0.5"><div class="dp-in" data-r="up" style="--i:2">${p1}</div></div>
    <div class="dp dp-b" data-depth="1"><div class="dp-in" data-r="up" style="--i:3">${p2}</div></div>
    <div class="dp dp-c" data-depth="1.6"><div class="dp-card" data-r="scale" style="--i:4"><b>${statVal(st, x)}</b><small>${esc(x.fill(st.l))}</small></div></div>
    <div class="dp dp-d" data-depth="0.8"><div class="dp-chip" data-r="scale" style="--i:5">${icon(C.badges[0].i)}${esc(C.badges[0].t)}</div></div>
  </div>
  <div class="wrap dp-words"><p class="h-lede" data-r="up">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p><h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div></div>
</section>`;
  },
  slices(x) {
    const { t, C } = x;
    const id = x.nextPhoto(), N = 5;
    const url = id == null ? '' : PHOTO_URL(id, 1400, 1100);
    const sl = Array.from({ length: N }, (_, i) => `<span class="sl" style="--k:${i};--n:${N};background-image:url('${url}')"></span>`).join('');
    return `<section class="hero h-slices" id="top"><div class="wrap grid">
  <div class="copy"><p class="h-lede" data-r="up">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p><h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div></div>
  <div class="slices" data-slices data-r="in" role="img" aria-label="${esc(ALT[id] || '')}">${sl}</div>
</div></section>`;
  },
  typewave(x) {
    const { t, C, b } = x;
    const letters = [...b.short].map((ch, i) => (ch === ' ' ? '<span class="tw-sp"> </span>' : `<span class="tw-l" style="--k:${i}">${esc(ch)}</span>`)).join('');
    return `<section class="hero h-type" id="top"><div class="wrap">
  <p class="h-lede" data-r="up">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p>
  <p class="d tw-name" data-fit data-typewave aria-label="${esc(b.short)}"><span class="tw-in">${letters}</span></p>
  <div class="tw-row"><h1 class="d tw-head hl" data-r="lines" style="--i:2">${lines(t.head, x)}</h1><div class="r" data-r="up" style="--i:3"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div></div>
</div></section>`;
  },
  reel(x) {
    const { t, C } = x;
    const pics = C.services.slice(0, 3).map((z, i) => `<figure class="rl-pan rl-pic">${photo(x, null, 1400, 'fill', i ? 'lazy' : 'eager')}<figcaption><b>${esc(x.fill(z.n))}</b><span>${money(z.p, x) || esc(C.label)}</span></figcaption></figure>`).join('');
    return `<section class="hero h-reel" id="top" data-hreel><div class="rl-stick"><div class="rl-track">
  <div class="rl-pan rl-copy"><p class="h-lede" data-r="up">${icon(C.icon)}${esc(x.fill(t.lede || `${C.label} in {city} since {since}`))}</p><h1 class="d hl" data-r="lines" style="--i:1">${lines(t.head, x)}</h1><p class="h-sub" data-r="up" style="--i:3">${esc(x.fill(t.sub))}</p><div class="acts" data-r="up" style="--i:4">${x.b1()}${x.b2()}</div><p class="rl-hint" data-r="up" style="--i:5">Keep scrolling ${icon('arrow')}</p></div>
  ${pics}
</div></div></section>`;
  },
  stack(x) {
    const { t } = x;
    return `<section class="hero h-stack" id="top"><div class="wrap">
  <div class="stage"><h1 class="d hl" data-r="lines">${lines(t.head, x)}</h1><div class="float" data-par="-0.1"><div data-r="clip" style="--i:2">${photo(x, '3 / 4', 800, '', 'eager')}</div></div></div>
  <div class="row" data-r="up" style="--i:4"><p class="h-sub">${esc(x.fill(t.sub))}</p><div class="acts">${x.b1()}${x.b2()}</div></div>
</div></section>`;
  },
};

function menuGroups(menu, x) {
  return menu.map(g => `<div data-r="list"><h3>${esc(g.h)}</h3>${g.items.map((m, j) => `<div class="mi" style="--j:${j}"><b>${esc(m.n)}</b><i></i><span>${priceTag(m.p, x)}</span>${m.d ? `<small>${esc(m.d)}</small>` : ''}</div>`).join('')}</div>`).join('');
}

/* ---------------- sections ---------------- */
const SEC = {
  trust(x) {
    return `<section class="trust"><div class="wrap"><ul data-r="list">${x.C.badges.map((b, j) => `<li style="--j:${j}">${icon(b.i)}${esc(b.t)}</li>`).join('')}</ul></div></section>`;
  },
  services(x) {
    const { C } = x;
    return `<section class="sec svc" id="services"><div class="wrap">
  <div class="sec-top">${head('services', x)}<p data-r="up">${esc(x.fill(x.t.svcIntro || INTROS.services))}</p></div>
  <ul class="svc-list" data-r="list">${C.services.map((s, j) => `<li style="--j:${j}"><a class="svc-row" href="${x.href1}">${icon(s.i)}<h3>${esc(x.fill(s.n))}</h3><p>${esc(x.fill(s.d))}</p><span class="pr">${money(s.p, x)}<span class="arr">${icon('arrow')}</span></span></a></li>`).join('')}</ul>
</div></section>`;
  },
  servicesGrid(x) {
    const { C } = x;
    return `<section class="sec svc" id="services"><div class="wrap">
  <div class="sec-top">${head('services', x)}<p data-r="up">${esc(x.fill(x.t.svcIntro || INTROS.services))}</p></div>
  <div class="svc-tiles" data-r="list">${C.services.map((s, j) => `<a class="tile" href="${x.href1}" style="--j:${j}">${icon(s.i)}<h3>${esc(x.fill(s.n))}</h3><p>${esc(x.fill(s.d))}</p>${s.p !== '' ? `<span class="pr">${money(s.p, x)}</span>` : ''}</a>`).join('')}</div>
</div></section>`;
  },
  about(x, opt = {}) {
    const { C, b, t } = x;
    const role = b.role || ROLES[C.group][0];
    return `<section class="sec about${opt.flip ? ' flip' : ''}" id="about"><div class="wrap grid">
  <div class="since"><div data-r="clip">${photo(x, '4 / 5', 900)}</div><div class="yr" data-r="scale" style="--i:3"><span><b>${x.years}</b>years in ${esc(b.city)}</span></div></div>
  <div class="txt">${head('about', x)}<p class="lead" data-r="up">${esc(x.fill(C.about[0]))}</p><p data-r="up" style="--i:1">${esc(x.fill(C.about[1]))}</p>
  <div class="sig" data-r="up" style="--i:2"><span class="mono">${esc(initials(b.owner))}</span><span><b>${esc(b.owner)}</b><small>${esc(role)}, ${esc(b.short)}</small></span></div></div>
</div></section>`;
  },
  stats(x, opt = {}) {
    return `<section class="sec stats fld ${opt.fld || 'fld-1'}"><div class="wrap grid" data-r="list">${x.C.stats.map((s, j) => `<div class="stat" style="--j:${j}"><div class="v">${statVal(s, x)}</div><p class="l">${esc(x.fill(s.l))}</p></div>`).join('')}</div></section>`;
  },
  reviews(x) {
    const { C } = x;
    const card = (r, i) => `<article class="rv"><p>“${esc(r.q)}”</p><footer><b>${esc(r.who)}</b><span>${esc(x.town(i))}</span></footer></article>`;
    const a = x.reviews.slice(0, 3).map(card).join(''), bb = x.reviews.slice(3).map((r, i) => card(r, i + 3)).join('');
    return `<section class="sec reviews" id="reviews"><div class="wrap sec-top">${head('reviews', x)}<div class="rv-score" data-r="up"><span class="big">${x.rate.v}</span><span><span class="stars">★★★★★</span><br><small class="mute">${esc(x.fill(x.rate.l))}</small></span></div></div>
  <div class="rv-rows"><div class="mq"><div class="mq-track" data-copies="3" style="--mq:64s">${a}${a.replace(/<article/g, '<article aria-hidden="true"')}${a.replace(/<article/g, '<article aria-hidden="true"')}</div></div><div class="mq rev"><div class="mq-track" data-copies="3" style="--mq:74s">${bb}${bb.replace(/<article/g, '<article aria-hidden="true"')}${bb.replace(/<article/g, '<article aria-hidden="true"')}</div></div></div>
</section>`;
  },
  quote(x, opt = {}) {
    const rs = x.reviews.slice(0, 4);
    return `<section class="sec quote fld ${opt.fld || 'fld-3'}" id="reviews"><div class="wrap"><span class="marks d" aria-hidden="true">“</span>
  <div class="qslides" data-quotes data-r="up">${rs.map((r, i) => `<figure class="${i ? '' : 'on'}"><blockquote class="d">${esc(r.q)}</blockquote><figcaption class="who"><b>${esc(r.who)}</b> · ${esc(x.town(i))}</figcaption></figure>`).join('')}</div>
  <div class="qdots" role="tablist">${rs.map((r, i) => `<button type="button" class="${i ? '' : 'on'}" aria-label="Review ${i + 1}"></button>`).join('')}</div>
</div></section>`;
  },
  process(x) {
    return `<section class="sec process" id="how"><div class="wrap"><div class="sec-top">${head('process', x)}</div>
  <ol class="steps" data-r="in">${x.C.steps.map((s, i) => `<li style="--i:${i}"><h3>${esc(s.n)}</h3><p>${esc(x.fill(s.d))}</p></li>`).join('')}</ol>
</div></section>`;
  },
  area(x) {
    return `<section class="sec area" id="area"><div class="wrap grid">
  <div>${head('area', x)}<p class="mute" data-r="up" style="margin-top:22px;max-width:44ch">${esc(x.fill(INTROS.area))}</p><ul class="towns" data-r="list">${(x.b.area || []).map((n, j) => `<li style="--j:${j}">${esc(n)}</li>`).join('')}</ul></div>
  <div class="map" data-r="clip">${mapSvg(x, x.t.id + 'area')}</div>
</div></section>`;
  },
  faq(x) {
    const { C, b } = x;
    return `<section class="sec faq" id="faq"><div class="wrap grid">
  <div>${head('faq', x)}<p class="mute" data-r="up" style="margin-top:22px">Still not sure? <a class="ulink" href="${tel(b.phone)}" style="color:var(--ink)">Call ${esc(b.phone)}</a></p></div>
  <div class="qa" data-r="list">${C.faq.map((f, j) => `<details style="--j:${j}"><summary>${esc(x.fill(f.q))}</summary><div class="a"><p>${esc(x.fill(f.a))}</p></div></details>`).join('')}</div>
</div></section>`;
  },
  cta(x, opt = {}) {
    const { C, b } = x;
    const right = C.emergency ? `<a class="h-phone d" href="${tel(b.phone)}">${esc(b.phone)}</a>` : `<a class="btn ink" href="${x.href1}">${esc(x.act1)} <span class="arr">→</span></a>`;
    return `<section class="sec cta fld ${opt.fld || 'fld-2'}"><div class="wrap in"><h2 class="d sec-h" data-r="lines">${lines([C.cta], x)}</h2><div class="r" data-r="up" style="--i:2"><p class="lead">${esc(x.fill(C.ctaSub))}</p>${right}</div></div></section>`;
  },
  statement(x) {
    const words = x.fill(x.t.statement || x.C.about[1]).split(/\s+/).map(w => `<span class="w">${esc(w)}</span>`).join(' ');
    return `<section class="sec stmt"><div class="wrap"><p class="d" data-ink>${words}</p></div></section>`;
  },
  gallery(x) {
    const { C } = x;
    const items = C.listings
      ? C.listings.map((l, i) => [l.n, `${x.cur}${l.p}`, l.d])
      : C.services.slice(0, 4).map((s, i) => [s.n, x.town(i + 2), '']);
    return `<section class="sec gal" id="work"><div class="wrap sec-top">${C.listings ? `<h2 class="d sec-h" data-r="lines">${lines(['For sale now'], x)}</h2>` : head('gallery', x)}<p data-r="up">${esc(C.listings ? 'A few of the homes on our books this week.' : INTROS.gallery)}</p></div>
  <div class="row" data-drag>${items.slice(0, x.t.galleryCount || 3).map(([n, s, d], i) => `<figure data-r="up" style="--i:${i}">${photo(x, '4 / 5', 820)}<figcaption><b>${esc(n)}</b><span>${esc(s)}</span></figcaption>${d ? `<p class="mute" style="font-size:14px;margin-top:2px">${esc(d)}</p>` : ''}</figure>`).join('')}</div>
</section>`;
  },
  prices(x) {
    const { C } = x;
    const list = C.prices || C.services.slice(0, 3).map((s, i) => ({ n: s.n, p: s.p, per: 'job', items: [s.d], hot: i === 1 }));
    return `<section class="sec prices" id="prices"><div class="wrap"><div class="sec-top">${head('prices', x)}<p data-r="up">No hidden fees. Prices include materials unless we say otherwise.</p></div>
  <div class="grid" data-r="list">${list.map((p, j) => `<div class="price-card${p.hot ? ' hot' : ''}" style="--j:${j}"><h3>${esc(p.n)}</h3><div class="amt">${typeof p.p === 'number' ? `${x.cur}${num(p.p)}` : esc(p.p)}<small> / ${esc(p.per)}</small></div><ul>${p.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul><a class="btn${p.hot ? '' : ' ghost'}" href="${x.href1}">${esc(C.booking ? 'Book now' : 'Get started')}</a></div>`).join('')}</div>
</div></section>`;
  },
  menu(x) {
    return `<section class="sec menu-sec" id="menu"><div class="wrap"><div class="sec-top">${head('menu', x)}<p data-r="up">A taste of what’s on. It changes with the seasons.</p></div><div class="grid menu-list">${menuGroups(x.C.menu || [], x)}</div></div></section>`;
  },
  visit(x) {
    const { C, b } = x;
    const day = new Date().getDay();
    return `<section class="sec visit" id="visit"><div class="wrap grid">
  <div>${head('visit', x)}<ul class="hours" data-r="list" style="margin-top:30px">${(C.hours || []).map((h, j) => `<li class="${j === 0 && day > 0 && day < 6 ? 'today' : ''}" style="--j:${j}"><span>${esc(h[0])}</span><span>${esc(h[1])}</span></li>`).join('')}</ul>
  <div class="addr" data-r="up"><b>${esc(b.addr || b.city)}</b><a class="ulink" href="#visit" style="justify-self:start">Get directions</a></div></div>
  <div class="map" data-r="clip">${mapSvg(x, x.t.id + 'visit')}</div>
</div></section>`;
  },
  team(x) {
    const { C, b, t } = x;
    const r = rng(hash(t.id + 'team'));
    const names = [b.owner];
    while (names.length < 4) { const n = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`; if (!names.includes(n)) names.push(n); }
    return `<section class="sec team" id="team"><div class="wrap"><div class="sec-top">${head('team', x)}</div>
  <div class="grid" data-r="list">${names.map((n, j) => `<div class="mate" style="--j:${j}"><div class="av">${esc(initials(n))}</div><div><b>${esc(n)}</b><small>${esc(ROLES[C.group][j])}</small></div></div>`).join('')}</div>
</div></section>`;
  },
  book(x) {
    const days = [];
    const d = new Date();
    while (days.length < 6) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days.push(new Date(d)); }
    const times = x.b.uk ? ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'] : ['9:00 am', '10:30 am', '12:00 pm', '1:30 pm', '3:00 pm', '4:30 pm'];
    return `<section class="sec book" id="book"><div class="wrap"><div class="card" data-r="up">
  <div>${head('book', x)}<p class="mute" style="margin-top:20px;max-width:38ch">${esc(INTROS.book)}</p></div>
  <div class="pick" data-book>
    <div><p class="lbl">Choose a day</p><div class="days">${days.map((dd, i) => `<button type="button" class="${i ? '' : 'on'}" data-v="${dd.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}">${dd.toLocaleDateString('en-GB', { weekday: 'short' })}<small>${dd.getDate()} ${dd.toLocaleDateString('en-GB', { month: 'short' })}</small></button>`).join('')}</div></div>
    <div><p class="lbl">Choose a time</p><div class="slots">${times.map((tm, i) => `<button type="button" data-v="${tm}"${i === 1 ? ' disabled' : ''} class="${i === 3 ? 'on' : ''}">${tm}</button>`).join('')}</div></div>
    <div><button type="button" class="btn" data-book-go>Request this time <span class="arr">→</span></button><p class="done" aria-live="polite"></p></div>
  </div>
</div></div></section>`;
  },
  contact(x) {
    const { C, b } = x;
    const email = b.email || `hello@${b.short.toLowerCase().replace(/[^a-z]/g, '')}.example`;
    return `<section class="sec contact" id="contact"><div class="wrap grid">
  <div class="cdet">${head('contact', x)}<a class="big" href="${tel(b.phone)}" data-r="up">${esc(b.phone)}</a><a class="ulink" href="mailto:${esc(email)}" data-r="up" style="justify-self:start">${esc(email)}</a><p class="mute" data-r="up">${esc(b.addr || b.city)}</p></div>
  <form class="form" data-form data-r="up" style="--i:1">
    <div class="fl"><label for="f-n">Name</label><input id="f-n" autocomplete="name" required></div>
    <div class="fl"><label for="f-p">Phone</label><input id="f-p" type="tel" autocomplete="tel"></div>
    <div class="fl full"><label for="f-e">Email</label><input id="f-e" type="email" autocomplete="email" required></div>
    <div class="fl full"><label for="f-s">What do you need?</label><select id="f-s">${C.services.map(s => `<option>${esc(x.fill(s.n))}</option>`).join('')}<option>Something else</option></select></div>
    <div class="fl full"><label for="f-m">Message</label><textarea id="f-m" rows="3"></textarea></div>
    <button class="btn" type="submit">Send <span class="arr">→</span></button><p class="sent" aria-live="polite"></p>
  </form>
</div></section>`;
  },
  feature(x) {
    const r = x.reviews[4] || x.reviews[0];
    return `<section class="feature"><div class="bg" data-par="0.12">${photo(x, null, 2200, 'fill')}</div><div class="scrim"></div><div class="wrap cap"><p class="d" data-r="lines">${lines([`“${r.q}”`], x)}</p><small data-r="up" style="--i:2">${esc(r.who)}, ${esc(x.town(4))}</small></div></section>`;
  },
  hscroll(x) {
    const { C } = x;
    const cards = C.services.map((z, j) => `<article class="hs-card${j % 3 === 1 ? ' fld fld-2' : j % 3 === 2 ? ' fld fld-1' : ''}">${icon(z.i)}<div><h3 class="d">${esc(x.fill(z.n))}</h3><p>${esc(x.fill(z.d))}</p></div>${z.p !== '' ? `<span class="pr">${money(z.p, x)}</span>` : '<span></span>'}</article>`).join('');
    return `<section class="hsx" id="services" data-hscroll><div class="hs-stick"><div class="wrap hs-top">${head('services', x)}<p class="mute">${esc(x.fill(x.t.svcIntro || INTROS.services))}</p></div><div class="hs-track">${cards}<div class="hs-end"><a class="btn" href="${x.href1}">${esc(x.act1)} <span class="arr">→</span></a></div></div></div></section>`;
  },
  stack(x) {
    const { C } = x;
    const cards = C.services.slice(0, 5).map((z, j) => `<article class="sk-card fld ${j % 2 ? 'fld-1' : 'fld-3'}" style="--j:${j}"><div class="sk-top"><span class="sk-ico">${icon(z.i)}</span><span class="pr">${money(z.p, x)}</span></div><div><h3 class="d">${esc(x.fill(z.n))}</h3><p>${esc(x.fill(z.d))}</p></div><a class="ulink" href="${x.href1}">${esc(x.act1)}</a></article>`).join('');
    return `<section class="sec sk" id="services"><div class="wrap"><div class="sec-top">${head('services', x)}<p data-r="up">${esc(x.fill(x.t.svcIntro || INTROS.services))}</p></div><div class="sk-list" data-stack>${cards}</div></div></section>`;
  },
  pushline(x, opt = {}) {
    const a = x.C.services.map(z => x.fill(z.n)).join('  ·  ');
    return `<section class="push fld ${opt.fld || ''}" data-push aria-hidden="true"><p class="d pl a">${esc(a)}  ·  ${esc(a)}</p><p class="d pl b">${esc(x.fill(x.C.cta))}  ${esc(x.fill(x.C.cta))}</p></section>`;
  },
  odometer(x, opt = {}) {
    const cells = x.C.stats.map((z, j) => {
      const v = z.v === '{years}' ? x.years : z.v, str = num(v, z.d || 0);
      const digits = [...str].map((ch, q) => (/\d/.test(ch) ? `<span class="od-d" data-n="${ch}" style="--q:${q}"><span>${'0123456789'.split('').map(n => `<i>${n}</i>`).join('')}</span></span>` : `<span class="od-p">${esc(ch)}</span>`)).join('');
      return `<div class="stat od" style="--j:${j}"><div class="v" aria-label="${esc(str + (z.s || ''))}">${digits}<span class="od-p">${esc(z.s || '')}</span></div><p class="l">${esc(x.fill(z.l))}</p></div>`;
    }).join('');
    return `<section class="sec stats odo fld ${opt.fld || 'fld-1'}" data-odo><div class="wrap grid">${cells}</div></section>`;
  },
  accordion(x) {
    const { C } = x;
    const panels = C.services.slice(0, 5).map((z, j) => `<button type="button" class="ac-p${j ? '' : ' on'}" aria-expanded="${!j}"><span class="ac-n d">${esc(x.fill(z.n))}</span><span class="ac-body">${icon(z.i)}<span class="ac-d">${esc(x.fill(z.d))}</span>${z.p !== '' ? `<b>${money(z.p, x)}</b>` : ''}</span></button>`).join('');
    return `<section class="sec acc" id="services"><div class="wrap"><div class="sec-top">${head('services', x)}<p data-r="up">${esc(x.fill(x.t.svcIntro || INTROS.services))}</p></div><div class="ac-row" data-acc data-r="up">${panels}</div></div></section>`;
  },
  follow(x) {
    const { C } = x;
    const rows = C.services.map((z, j) => `<li><a class="fw-row" href="${x.href1}" data-fw="${j}"><span class="d fw-n">${esc(x.fill(z.n))}</span><span class="fw-d">${esc(x.fill(z.d))}</span><span class="fw-p">${money(z.p, x)}</span></a></li>`).join('');
    const cards = C.services.map((z, j) => `<div class="fw-card" data-k="${j}">${icon(z.i)}<b>${esc(x.fill(z.n))}</b><span>${money(z.p, x) || esc(C.label)}</span></div>`).join('');
    return `<section class="sec fw" id="services"><div class="wrap"><div class="sec-top">${head('services', x)}<p data-r="up">${esc(x.fill(x.t.svcIntro || INTROS.services))}</p></div><ul class="fw-list" data-r="list">${rows}</ul></div><div class="fw-float" data-follow aria-hidden="true">${cards}</div></section>`;
  },
  bigband(x, opt = {}) {
    const items = x.C.services.map(s => `<span class="it d">${esc(x.fill(s.n))}${icon('sparkle')}</span>`).join('');
    return `<section class="bigband fld ${opt.fld || 'fld-1'}" aria-hidden="true"><div class="mq"><div class="mq-track" style="--mq:46s">${items}${items}</div></div></section>`;
  },
};

/* ---------------- footers ---------------- */
function footer(x) {
  const { t, C, b } = x;
  const email = b.email || `hello@${b.short.toLowerCase().replace(/[^a-z]/g, '')}.example`;
  const cols = `<div class="cols">
    <div><a class="logo${t.logoRound ? ' round' : ''}" href="#top">${t.mark === false ? '' : `<span class="mk">${icon(t.mark || C.icon)}</span>`}<span>${esc(b.short)}</span></a><p class="lead mute" style="margin-top:20px">${esc(x.fill(t.tagline || C.ctaSub))}</p></div>
    <div><h4>Visit</h4><ul><li>${esc(b.addr || b.city)}</li></ul></div>
    <div><h4>Hours</h4><ul>${(C.hours || []).slice(0, 3).map(h => `<li>${esc(h[0])}: ${esc(h[1])}</li>`).join('')}</ul></div>
    <div><h4>Contact</h4><ul><li><a class="ulink" href="${tel(b.phone)}">${esc(b.phone)}</a></li><li><a class="ulink" href="mailto:${esc(email)}">${esc(email)}</a></li></ul></div>
  </div>`;
  const base = `<div class="base"><span>© ${YEAR} ${esc(b.name)}</span><span class="made">A BiomeDrive Studio template: ${esc(t.name)}</span></div>`;
  const kind = t.foot || 'cols';
  const fld = t.footFld === false ? '' : ` fld ${t.footFld || 'fld-1'}`;
  if (kind === 'big') return `<footer class="foot${fld}"><div class="wrap">${cols}<p class="d word" data-fit aria-hidden="true">${esc(b.short)}</p>${base}</div></footer>`;
  return `<footer class="foot${fld}"><div class="wrap">${cols}${base}</div></footer>`;
}

/* ---------------- render ---------------- */
export function render(t, opts = {}) {
  const x = makeCtx(t);
  x.shot = !!opts.shot;
  const C = x.C;
  const parts = [nav(x), '<main>', HERO[t.hero](x)];
  for (const s of t.secs) {
    const [name, arg] = s.split(':');
    const fn = SEC[name];
    if (!fn) continue;
    const opt = {};
    if (arg === 'flip') opt.flip = true; else if (arg) opt.fld = arg;
    parts.push(fn(x, opt));
  }
  parts.push('</main>', footer(x));
  if (C.emergency || t.callbar) parts.push(`<a class="callbar" href="${tel(x.b.phone)}">${icon('phone')}Call ${esc(x.b.phone)}</a>`);
  return parts.join('\n');
}

export function dress(t, opts = {}) {
  const root = document.documentElement;
  const pal = findPalette(opts.palette || t.pal) || findPalette(t.pal);
  const font = findFont(opts.font || t.font) || findFont(t.font);
  applyPalette(pal, root);
  applyFont(font, root);
  root.style.setProperty('--r', (t.r ?? 0) + 'px');
  root.style.setProperty('--br', t.btn === 'pill' ? '999px' : t.btn === 'soft' ? '10px' : (t.r ?? 0) + 'px');
  root.style.setProperty('--t', t.motion === 'calm' ? 1.25 : t.motion === 'lively' ? 0.85 : 1);
  root.dataset.img = t.img || 'color';
  root.dataset.fx = (t.fx || []).join(' ');
  root.classList.toggle('has-util', t.nav === 'util');
  document.title = `${t.biz.name} · ${t.name} template · BiomeDrive Studio`;
}

/* ---------------- motion and behaviour ---------------- */
export function animate(opts = {}) {
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  if (opts.shot) root.classList.add('shot');
  if (calm) root.classList.add('calm');
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // fit giant words to their row
  const fit = () => $$('[data-fit]').forEach(el => {
    el.style.fontSize = '100px';
    const inner = el.querySelector('.ln > span, .tw-in') || el;
    const w = inner.getBoundingClientRect().width || inner.scrollWidth || 1;
    const ps = getComputedStyle(el.parentElement);
    const room = el.parentElement.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
    el.style.fontSize = Math.max(28, Math.floor(100 * room / w * 0.995)) + 'px';
  });
  fit();
  addEventListener('resize', fit);
  document.fonts && document.fonts.ready.then(fit);

  // list stagger index
  $$('[data-r="list"]').forEach(l => [...l.children].forEach((c, j) => c.style.getPropertyValue('--j') || c.style.setProperty('--j', j)));

  // counters
  const count = el => {
    const v = parseFloat(el.dataset.count), d = +el.dataset.d || 0;
    if (opts.shot || calm || !(v > 0)) return;
    const t0 = performance.now(), dur = 1600;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = num(v * e, d); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  const show = el => { el.classList.add('in'); $$('[data-count]', el).forEach(count); if (el.matches('[data-count]')) count(el); };
  const start = () => {
    if (opts.shot || calm) { $$('[data-r]').forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > 0) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    // a part clipped shut has no visible area, so Chrome never reports it on screen: watch its parent instead
    const held = new Map();
    const ioClip = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > 0) { (held.get(e.target) || []).forEach(show); ioClip.unobserve(e.target); } }), { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    $$('[data-r]').forEach(el => {
      if (!/^clip/.test(el.dataset.r)) return io.observe(el);
      const p = el.parentElement; held.set(p, [...(held.get(p) || []), el]); ioClip.observe(p);
    });
    $$('.stats [data-count], .figs [data-count]').forEach(el => { const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { count(el); o.disconnect(); } }, { threshold: 0.5 }); o.observe(el); });
  };
  // wait (briefly) for the fonts so lines don't reflow mid-reveal
  Promise.all([Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1200))]), opts.gate || Promise.resolve()]).then(() => requestAnimationFrame(start));

  // smooth scroll
  let lenis = null;
  if (!calm && !opts.shot && window.Lenis) { lenis = new Lenis({ lerp: 0.1 }); window.__lenis = lenis; }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const el = id.length > 1 && document.querySelector(id);
    if (!el) return; e.preventDefault(); closeSheet();
    lenis ? lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
  }));

  // nav: solid once scrolled, hidden while scrolling down
  const navEl = document.querySelector('[data-nav]'), sheet = document.querySelector('[data-sheet]'), burger = document.querySelector('.nav-burger');
  const closeSheet = () => { navEl?.classList.remove('open'); sheet?.classList.remove('open'); burger?.setAttribute('aria-expanded', 'false'); };
  burger?.addEventListener('click', () => { const o = !navEl.classList.contains('open'); navEl.classList.toggle('open', o); sheet.classList.toggle('open', o); burger.setAttribute('aria-expanded', String(o)); });
  const callbar = document.querySelector('.callbar');
  if (callbar) document.body.classList.add('has-callbar');
  let lastY = 0;
  const pars = $$('[data-par]');
  const ink = $$('[data-ink]');
  const tick = () => {
    const y = scrollY;
    navEl?.classList.toggle('scrolled', y > 30);
    if (!navEl?.classList.contains('open')) navEl?.classList.toggle('hide', y > 500 && y > lastY + 2);
    if (y < lastY - 2) navEl?.classList.remove('hide');
    lastY = y;
    callbar?.classList.toggle('show', y > innerHeight * 0.7);
    if (!calm && !opts.shot) {
      for (const el of pars) { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue; el.style.transform = `translate3d(0, ${((r.top + r.height / 2) - innerHeight / 2) * -parseFloat(el.dataset.par)}px, 0)`; }
    }
    for (const p of ink) {
      const r = p.getBoundingClientRect(); const k = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      const ws = p.querySelectorAll('.w'); const on = opts.shot || calm ? ws.length : Math.round(ws.length * k);
      ws.forEach((w, i) => w.classList.toggle('on', i < on));
    }
  };
  const loop = time => { lenis?.raf(time); tick(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  // the word that keeps changing
  $$('[data-tick]').forEach(tk => {
    const ws = [...tk.children]; if (ws.length < 2 || calm || opts.shot) return;
    let i = 0;
    setInterval(() => {
      const a = ws[i]; i = (i + 1) % ws.length; const b = ws[i];
      a.classList.remove('on'); a.classList.add('out'); b.classList.remove('out'); b.classList.add('on');
      setTimeout(() => a.classList.remove('out'), 700);
    }, 2400);
  });
  // index rows: pointing at a service brings up its picture
  $$('.h-index').forEach(h => {
    const rows = $$('.ix-rows a', h), pics = $$('.ix-frame .ph', h);
    let cur = 0, timer;
    const go = j => {
      const k = +rows[j].dataset.ix; rows.forEach((r, n) => r.classList.toggle('on', n === j));
      if (pics[k] && !pics[k].classList.contains('on')) { pics.forEach(p => p.classList.remove('was')); const old = pics.find(p => p.classList.contains('on')); if (old) old.classList.replace('on', 'was'); pics[k].classList.add('on'); }
      cur = j;
    };
    rows.forEach((r, j) => r.addEventListener('pointerenter', () => { clearInterval(timer); go(j); }));
    if (!calm && !opts.shot) timer = setInterval(() => go((cur + 1) % rows.length), 2600);
  });
  // area check
  $$('[data-zip]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault(); const v = f.querySelector('input').value.trim(); const out = f.querySelector('output');
    out.textContent = v.length >= 3 ? `Good news: we cover ${v}. Call now and we can usually be there today.` : 'Type your code first and we’ll check it.';
    f.classList.add('done');
  }));
  // booking
  $$('[data-book]').forEach(b => {
    b.addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn || btn.disabled) return;
      if (btn.closest('.days, .slots')) { btn.parentElement.querySelectorAll('button').forEach(o => o.classList.toggle('on', o === btn)); }
      if (btn.matches('[data-book-go]')) {
        const d = b.querySelector('.days .on')?.dataset.v, s = b.querySelector('.slots .on')?.dataset.v;
        b.querySelector('.done').textContent = `Requested ${d} at ${s}. This is a template preview, so nothing was booked.`;
      }
    });
  });
  // forms
  $$('[data-form]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); f.querySelector('.sent').textContent = 'Thanks! This is a template preview, so the message wasn’t sent anywhere.'; }));
  // rotating quotes
  $$('[data-quotes]').forEach(q => {
    const slides = [...q.children], dots = [...q.parentElement.querySelectorAll('.qdots button')];
    let i = 0, timer;
    const go = n => { i = n; slides.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); clearInterval(timer); }));
    if (!calm && !opts.shot) timer = setInterval(() => go((i + 1) % slides.length), 6000);
  });
  // FAQ: animate open and close
  $$('.qa details').forEach(d => {
    const s = d.querySelector('summary'), a = d.querySelector('.a');
    s.addEventListener('click', e => {
      if (calm) return; e.preventDefault();
      if (d.open) { const h = a.offsetHeight; a.animate([{ height: h + 'px' }, { height: '0px' }], { duration: 320, easing: 'cubic-bezier(.23,1,.32,1)' }).onfinish = () => { d.open = false; }; }
      else { d.open = true; const h = a.offsetHeight; a.animate([{ height: '0px' }, { height: h + 'px' }], { duration: 380, easing: 'cubic-bezier(.23,1,.32,1)' }); }
    });
  });
  // drag rows with the mouse
  $$('[data-drag]').forEach(row => {
    let down = false, sx = 0, sl = 0;
    row.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = row.scrollLeft; row.style.scrollSnapType = 'none'; });
    addEventListener('pointerup', () => { if (!down) return; down = false; row.style.scrollSnapType = ''; });
    row.addEventListener('pointermove', e => { if (down) row.scrollLeft = sl - (e.clientX - sx); });
  });
  // before and after
  $$('[data-cmp]').forEach(c => {
    const set = v => c.style.setProperty('--x', Math.max(0, Math.min(100, v)) + '%');
    const at = e => { const r = c.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    let drag = false;
    c.addEventListener('pointerdown', e => { drag = true; at(e); });
    addEventListener('pointerup', () => (drag = false));
    c.addEventListener('pointermove', e => { if (drag || e.pointerType === 'mouse') at(e); });
    if (!calm && !opts.shot) {
      const o = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; o.disconnect();
        const t0 = performance.now(); const sweep = now => { const k = Math.min(1, (now - t0) / 2200); set(50 + Math.sin(k * Math.PI * 2) * 28 * (1 - k)); if (k < 1) requestAnimationFrame(sweep); }; setTimeout(() => requestAnimationFrame(sweep), 500);
      }, { threshold: 0.5 });
      o.observe(c);
    }
  });
  return { lenis, fit };
}
