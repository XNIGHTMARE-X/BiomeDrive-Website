// BiomeDrive Studio: the interaction layer. Motion (motion.dev) and Lenis drive the scroll and pointer
// effects of the interactive templates; the topo engine and a small WebGL shader come from the
// BiomeDrive site itself. prepare() runs before the page reveals itself, run() after.
// Every effect is skipped for reduced motion and for thumbnails (?shot), and the pointer ones on touch.
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const root = document.documentElement;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tickers = [];
const pointer = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, has: false };
addEventListener('pointermove', e => { pointer.vx = e.clientX - pointer.x; pointer.vy = e.clientY - pointer.y; pointer.x = e.clientX; pointer.y = e.clientY; pointer.has = true; }, { passive: true });
const add = html => { const d = document.createElement('div'); d.innerHTML = html; const el = d.firstElementChild; document.body.appendChild(el); return el; };
// progress of an element through its own pinned scroll (0 at its top, 1 when its end reaches the screen's end)
const pinProgress = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
// Motion's scroll() when it is there, otherwise our own loop
function onScroll(el, offset, fn) {
  const M = window.Motion;
  if (M && M.scroll) { try { M.scroll((p, info) => fn(p, info), { target: el, offset }); return; } catch (e) {} }
  tickers.push(() => { const r = el.getBoundingClientRect(); const p = offset[0] === 'start end' ? clamp((innerHeight - r.top) / (innerHeight + r.height)) : pinProgress(el); fn(p); });
}

/* =========================================================
   prepare: things that must exist before the reveals start
   ========================================================= */
export function prepare(t, opts = {}) {
  const fx = new Set(t.fx || []);
  const still = calm || !!opts.shot;
  let gate = Promise.resolve();
  let seen = false; try { seen = !!sessionStorage.getItem('bd-ldr-' + t.id); } catch (e) {}
  if (fx.has('loader') && !still && !seen) gate = loader(t);
  if (!still) {
    if (fx.has('cursor') && fine) cursor();
    if (fx.has('glow') && fine) { const g = add('<div class="glow" aria-hidden="true"></div>'); tickers.push(() => { g.style.setProperty('--gx', pointer.x + 'px'); g.style.setProperty('--gy', pointer.y + 'px'); }); }
    if (fx.has('grain')) add('<div class="grain" aria-hidden="true"></div>');
    if (fx.has('progress')) { const p = add('<div class="prog" aria-hidden="true"></div>'); tickers.push(() => p.style.setProperty('--pg', clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4))); }
  }
  return { fx, gate, still };
}

// headline letters, each in its own span, rising one after another (CSS in fx.css)
function splitChars() {
  $$('.hero [data-r="lines"] .ln > span').forEach(span => {
    let c = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
          const w = document.createElement('span'); w.className = 'w';
          for (const ch of part) { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--c', c++); s.textContent = ch; w.appendChild(s); }
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.matches('.tick, .pill, .ph, svg')) walk(n);
    });
    walk(span);
  });
}

// a short branded preloader: the name rises, a counter runs, the screen lifts away (once per visit)
function loader(t) {
  const el = add(`<div class="ldr" aria-hidden="true"><span class="ldr-name"><span>${esc(t.biz.short)}</span></span><div class="ldr-foot"><span>${esc(t.biz.city)}</span><span class="ldr-n">0</span></div><i class="ldr-bar"></i></div>`);
  const n = el.querySelector('.ldr-n'), name = el.querySelector('.ldr-name span');
  try { sessionStorage.setItem('bd-ldr-' + t.id, '1'); } catch (e) {}
  return new Promise(resolve => {
    const M = window.Motion;
    if (!M) { el.remove(); return resolve(); }
    let done = false;
    const lift = () => { if (done) return; done = true; resolve(); M.animate(el, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, { duration: 0.85, ease: [0.77, 0, 0.175, 1] }).then(() => el.remove()); };
    M.animate(name, { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 0.8, ease: [0.23, 1, 0.32, 1] });
    M.animate(0, 100, { duration: 1.15, ease: [0.65, 0, 0.35, 1], onUpdate: v => { n.textContent = Math.round(v); el.style.setProperty('--lp', (v / 100).toFixed(3)); } }).then(lift);
    el.addEventListener('pointerdown', lift);
  });
}

// a dot and a ring that trails it; the ring grows over links and names what a click does
function cursor() {
  root.classList.add('cur-on');
  const dot = add('<div class="cur" aria-hidden="true"></div>'), ring = add('<div class="cur-ring" aria-hidden="true"><span></span></div>');
  const label = ring.querySelector('span');
  let rx = pointer.x, ry = pointer.y;
  document.addEventListener('pointerover', e => {
    const tel = e.target.closest('a[href^="tel:"]'), pic = e.target.closest('.ph, .rl-pic, .slices, [data-liquid], .cmp'), act = e.target.closest('a, button, summary, select, .fw-row, .ac-p');
    const word = tel ? 'Call' : e.target.closest('.cmp') ? 'Drag' : pic && !act ? 'View' : '';
    ring.classList.toggle('lbl', !!word); label.textContent = word;
    ring.classList.toggle('big', !word && !!act);
  });
  document.addEventListener('pointerleave', () => { dot.classList.add('hide'); ring.classList.add('hide'); });
  document.addEventListener('pointerenter', () => { dot.classList.remove('hide'); ring.classList.remove('hide'); });
  tickers.push(() => {
    rx = lerp(rx, pointer.x, 0.18); ry = lerp(ry, pointer.y, 0.18);
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
  });
}

/* =========================================================
   run: behaviours once the page is on screen
   ========================================================= */
export function run(t, opts = {}, state = {}) {
  const fx = state.fx || new Set(t.fx || []);
  const still = state.still ?? (calm || !!opts.shot);
  const gate = state.gate || Promise.resolve();

  heroZoom(still); reel('[data-hreel]', '.rl-track', still, true); reel('[data-hscroll]', '.hs-track', still, false);
  stackCards(still); pushLines(still); odometers(still); accordions(); follow(still);
  terrain(still); liquid(still); depth(still); slices(still); typewave(still, gate);
  lens(still); dots(still); doors(still); typewall(still); drum(still); mosaic(still);
  if (!still) {
    if (fx.has('magnet') && fine) magnets();
    if (fx.has('tilt') && fine) tilts();
    if (fx.has('skew')) skew();
    if (fx.has('velomarquee')) marquees();
    if (fx.has('scramble')) scramble();
  }
  let last = performance.now();
  const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; for (const f of tickers) f(dt, now); pointer.vx *= 0.86; pointer.vy *= 0.86; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

/* ---------- opening window ---------- */
function heroZoom(still) {
  const sec = document.querySelector('[data-zoom]'); if (!sec) return;
  const end = sec.querySelector('.zm-end');
  const set = p => {
    const phone = innerWidth < 700;
    const e = ease(clamp(p / 0.72));
    sec.style.setProperty('--zw', lerp(phone ? 72 : 34, 100, e).toFixed(2));
    sec.style.setProperty('--zh', lerp(phone ? 42 : 46, 100, e).toFixed(2));
    sec.style.setProperty('--zr', (1 - e).toFixed(3));
    sec.style.setProperty('--ze0', e.toFixed(3));
    sec.style.setProperty('--zt', clamp(p / 0.4).toFixed(3));
    const z = clamp((p - 0.62) / 0.22); sec.style.setProperty('--ze', z.toFixed(3)); end.classList.toggle('on', z > 0.5);
  };
  set(calm ? 1 : 0);
  if (!still) onScroll(sec, ['start start', 'end end'], set);
}

/* ---------- sideways reels (hero and services) ---------- */
function reel(sel, trackSel, still, parallax) {
  $$(sel).forEach(sec => {
    const track = sec.querySelector(trackSel);
    let dist = 0;
    const size = () => { dist = Math.max(0, track.scrollWidth - innerWidth); sec.style.setProperty(sel === '[data-hreel]' ? '--rl-h' : '--hs-h', `${dist + innerHeight}px`); };
    if (still) return;
    size(); addEventListener('resize', size); document.fonts && document.fonts.ready.then(size);
    const pics = $$('.rl-pic', sec);
    onScroll(sec, ['start start', 'end end'], p => {
      track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px, 0, 0)`;
      if (parallax) pics.forEach((f, i) => f.style.setProperty('--rp', (p * pics.length - i).toFixed(3)));
    });
  });
}

/* ---------- service cards that stack ---------- */
function stackCards(still) {
  $$('[data-stack]').forEach(list => {
    const cards = $$('.sk-card', list); if (still) return;
    tickers.push(() => cards.forEach((c, j) => {
      const next = cards[j + 1]; if (!next) return;
      const d = next.getBoundingClientRect().top - c.getBoundingClientRect().top;
      const k = clamp(1 - d / Math.max(1, c.offsetHeight));
      c.style.setProperty('--sk-s', (1 - k * 0.06).toFixed(4));
    }));
  });
}

/* ---------- giant lines pushed by the scroll ---------- */
function pushLines(still) {
  $$('[data-push]').forEach(sec => {
    const a = sec.querySelector('.pl.a'), b = sec.querySelector('.pl.b'); if (still) return;
    onScroll(sec, ['start end', 'end start'], p => { a.style.transform = `translate3d(${(-p * 30).toFixed(2)}%, 0, 0)`; b.style.transform = `translate3d(${(-30 + p * 30).toFixed(2)}%, 0, 0)`; });
  });
}

/* ---------- odometers ---------- */
function odometers(still) {
  $$('[data-odo]').forEach(sec => {
    const go = () => $$('.od-d', sec).forEach(d => d.style.setProperty('--n', d.dataset.n));
    if (still) return go();
    const M = window.Motion;
    if (M && M.inView) M.inView(sec, () => { go(); }, { amount: 0.4 });
    else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { go(); o.disconnect(); } }, { threshold: 0.4 }).observe(sec);
  });
}

/* ---------- expanding panels ---------- */
function accordions() {
  $$('[data-acc]').forEach(row => {
    const ps = $$('.ac-p', row);
    const open = p => ps.forEach(q => { q.classList.toggle('on', q === p); q.setAttribute('aria-expanded', String(q === p)); });
    ps.forEach(p => { p.addEventListener('pointerenter', () => fine && open(p)); p.addEventListener('focus', () => open(p)); p.addEventListener('click', () => open(p)); });
  });
}

/* ---------- a card following the cursor over the services ---------- */
function follow(still) {
  $$('[data-follow]').forEach(fl => {
    if (still || !fine) return;
    const sec = fl.closest('.fw'), cards = $$('.fw-card', fl);
    let x = pointer.x, y = pointer.y, s = 0, target = 0, rot = 0;
    sec.addEventListener('pointerover', e => { const r = e.target.closest('[data-fw]'); if (!r) return; target = 1; cards.forEach((c, i) => c.classList.toggle('on', String(i) === r.dataset.fw)); });
    sec.querySelector('.fw-list').addEventListener('pointerleave', () => (target = 0));
    tickers.push(() => {
      x = lerp(x, pointer.x, 0.14); y = lerp(y, pointer.y, 0.14); s = lerp(s, target, 0.16); rot = lerp(rot, clamp(pointer.vx * 0.6, -14, 14), 0.1);
      fl.style.setProperty('--fx', `${(x + 28).toFixed(1)}px`); fl.style.setProperty('--fy', `${(y - 140).toFixed(1)}px`);
      fl.style.setProperty('--fs', s.toFixed(3)); fl.style.setProperty('--fr', `${rot.toFixed(2)}deg`);
    });
  });
}

/* ---------- contour lines you can stir ---------- */
function terrain(still) {
  const cv = document.querySelector('[data-topo]'); if (!cv) return;
  const start = () => {
    const css = () => { const s = getComputedStyle(root); return [s.getPropertyValue('--ink').trim(), s.getPropertyValue('--accent').trim()]; };
    const [ink, acc] = css();
    const topo = window.Topo.create(cv, { scale: 380, density: 4.2, speed: 0.9, line: ink, major: acc, lineAlpha: 0.2, majorAlpha: 0.55, lineWidth: 1.5, maxDpr: 1.5, seed: 7 });
    new MutationObserver(() => { const [i, a] = css(); topo.setColors(i, a); }).observe(root, { attributes: true, attributeFilter: ['style'] });
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => topo.resize(), 200); });
    if (still) { topo.tick(0, true); return; }
    let on = true; new IntersectionObserver(es => (on = es[0].isIntersecting)).observe(cv);
    let a = 0;
    tickers.push(dt => {
      if (!on) return;
      const r = cv.getBoundingClientRect();
      const speed = Math.hypot(pointer.vx, pointer.vy); pointer.vx *= 0.8; pointer.vy *= 0.8;
      a = a * 0.94 + clamp(speed * 0.0016, 0, 0.05) * Math.sign(pointer.vx || 1);
      topo.setSwirl(pointer.x - r.left, pointer.y - r.top, a, 240);
      topo.tick(dt, true);
    });
  };
  if (window.Topo) return start();
  const s = document.createElement('script'); s.src = '/js/topo.js'; s.onload = start; document.head.appendChild(s);
}

/* ---------- liquid photo: WebGL ripple from a fading trail of the cursor ---------- */
function liquid(still) {
  const box = document.querySelector('[data-liquid]'); if (!box || still || !fine) return;
  const img = box.querySelector('img'); if (!img) return;
  const cv = document.createElement('canvas'); box.appendChild(cv);
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return cv.remove();
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;varying vec2 v;uniform sampler2D img,trail;uniform vec2 res,isz;uniform float time;
  vec2 cover(vec2 u){float rs=res.x/res.y,ri=isz.x/isz.y;vec2 s=rs>ri?vec2(1.,ri/rs):vec2(rs/ri,1.);return (u-.5)*s+.5;}
  void main(){vec2 uv=vec2(v.x,1.-v.y);float e=1./128.;
  float t=texture2D(trail,uv).r;
  float gx=texture2D(trail,uv+vec2(e,0.)).r-texture2D(trail,uv-vec2(e,0.)).r;
  float gy=texture2D(trail,uv+vec2(0.,e)).r-texture2D(trail,uv-vec2(0.,e)).r;
  vec2 off=vec2(gx,gy)*.11+vec2(sin(uv.y*28.+time*3.),cos(uv.x*28.+time*3.))*.006*t;
  float r=texture2D(img,cover(uv+off*1.5)).r;float g=texture2D(img,cover(uv+off)).g;float b=texture2D(img,cover(uv+off*.55)).b;
  gl_FragColor=vec4(r,g,b,1.);}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return cv.remove();
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n);
  const tex = unit => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const tImg = tex(0), tTrail = tex(1);
  gl.uniform1i(U('img'), 0); gl.uniform1i(U('trail'), 1);
  const tc = document.createElement('canvas'); tc.width = tc.height = 128; const tx = tc.getContext('2d'); tx.fillStyle = '#000'; tx.fillRect(0, 0, 128, 128);
  let ready = false, on = true;
  const src = new Image(); src.crossOrigin = 'anonymous';
  src.onload = () => { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tImg); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.uniform2f(U('isz'), src.naturalWidth, src.naturalHeight); ready = true; size(); box.classList.add('gl'); };
  src.src = img.currentSrc || img.src;
  cv.style.filter = getComputedStyle(img).filter;
  const size = () => { const d = Math.min(1.5, devicePixelRatio || 1); cv.width = Math.round(box.clientWidth * d); cv.height = Math.round(box.clientHeight * d); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U('res'), cv.width, cv.height); };
  addEventListener('resize', size);
  new IntersectionObserver(es => (on = es[0].isIntersecting)).observe(box);
  const hero = box.closest('.hero');
  let lx = null, ly = null;
  hero.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 128, y = (e.clientY - r.top) / r.height * 128;
    const sp = lx == null ? 0 : Math.hypot(x - lx, y - ly); lx = x; ly = y;
    const rad = 7 + Math.min(16, sp * 1.6);
    const g = tx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    tx.fillStyle = g; tx.beginPath(); tx.arc(x, y, rad, 0, Math.PI * 2); tx.fill();
  });
  tickers.push((dt, now) => {
    if (!ready || !on) return;
    tx.fillStyle = 'rgba(0,0,0,.045)'; tx.fillRect(0, 0, 128, 128);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tTrail); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
    gl.uniform1f(U('time'), now / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });
}

/* ---------- depth: layers drift with the mouse and the scroll ---------- */
function depth(still) {
  const h = document.querySelector('.h-depth'); if (!h) return;
  $$('.dp', h).forEach(d => d.style.setProperty('--dd', d.dataset.depth));
  if (still) return;
  let x = 0, y = 0;
  tickers.push(() => {
    const tx = fine && pointer.has ? (pointer.x / innerWidth - 0.5) * -46 : Math.sin(performance.now() / 2400) * 10;
    const ty = (fine && pointer.has ? (pointer.y / innerHeight - 0.5) * -34 : Math.cos(performance.now() / 2600) * 8) - Math.min(scrollY, innerHeight) * 0.12;
    x = lerp(x, tx, 0.07); y = lerp(y, ty, 0.07);
    h.style.setProperty('--dx', x.toFixed(2)); h.style.setProperty('--dy', y.toFixed(2));
  });
}

/* ---------- strips of a photo waving with the mouse ---------- */
function slices(still) {
  const box = document.querySelector('[data-slices]'); if (!box || still) return;
  const sl = $$('.sl', box), cur = sl.map(() => 0);
  tickers.push(() => {
    const r = box.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const px = fine && pointer.has ? clamp((pointer.x - r.left) / r.width) : 0.5 + Math.sin(performance.now() / 1600) * 0.4;
    const py = fine && pointer.has ? clamp((pointer.y - r.top) / r.height) - 0.5 : 0;
    sl.forEach((s, k) => {
      const near = Math.exp(-Math.pow((k + 0.5) / sl.length - px, 2) / 0.02);
      const tgt = near * (py * 70 - 18) + (k - (sl.length - 1) / 2) * Math.min(scrollY, innerHeight) * 0.05;
      cur[k] = lerp(cur[k], tgt, 0.09); s.style.setProperty('--sy', cur[k].toFixed(2));
    });
  });
}

/* ---------- letters of the name lift toward the cursor ---------- */
function typewave(still, gate) {
  const name = document.querySelector('[data-typewave]'); if (!name) return;
  if (still) return name.classList.add('in');
  gate.then(() => setTimeout(() => name.classList.add('in'), 250));
  const ls = $$('.tw-l', name), cur = ls.map(() => 0);
  let centers = [];
  const measure = () => { centers = ls.map(l => { const r = l.getBoundingClientRect(); return r.left + r.width / 2; }); };
  measure(); addEventListener('resize', measure); document.fonts && document.fonts.ready.then(measure); setTimeout(measure, 1500);
  tickers.push((dt, now) => {
    const r = name.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const near = fine && pointer.has && pointer.y > r.top - 200 && pointer.y < r.bottom + 200;
    const sig = Math.max(60, r.width * 0.07);
    ls.forEach((l, i) => {
      const tgt = near ? Math.exp(-Math.pow(centers[i] - pointer.x, 2) / (2 * sig * sig)) : (Math.sin(now / 520 - i * 0.55) + 1) * 0.14;
      cur[i] = lerp(cur[i], tgt, 0.12); l.style.setProperty('--lift', cur[i].toFixed(3));
    });
  });
}

/* ---------- magnetic buttons ---------- */
function magnets() {
  $$('.btn, .nav-cta, .h-phone').forEach(el => {
    el.classList.add('mag');
    let tx = 0, ty = 0, x = 0, y = 0;
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); tx = (e.clientX - (r.left + r.width / 2)) * 0.32; ty = (e.clientY - (r.top + r.height / 2)) * 0.42; });
    el.addEventListener('pointerleave', () => { tx = ty = 0; });
    tickers.push(() => {
      x = lerp(x, tx, 0.16); y = lerp(y, ty, 0.16);
      el.style.transform = Math.abs(x) + Math.abs(y) < 0.05 ? '' : `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    });
  });
}

/* ---------- 3D tilt with a glare ---------- */
function tilts() {
  $$('.tile, .price-card, .hs-card, .mate .av, .dp-card, .book .card').forEach(el => {
    el.classList.add('tilt');
    let rx = 0, ry = 0, x = 0, y = 0;
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; ry = (px - 0.5) * 12; rx = (0.5 - py) * 10; el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%'); el.classList.add('live'); });
    el.addEventListener('pointerleave', () => { rx = ry = 0; el.classList.remove('live'); });
    tickers.push(() => {
      x = lerp(x, rx, 0.12); y = lerp(y, ry, 0.12);
      el.style.transform = Math.abs(x) + Math.abs(y) < 0.02 ? '' : `perspective(900px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
    });
  });
}

/* ---------- skew with the speed of the scroll ---------- */
function skew() {
  let sk = 0, lastY = scrollY;
  tickers.push(() => {
    const v = window.__lenis ? window.__lenis.velocity : scrollY - lastY; lastY = scrollY;
    sk = lerp(sk, clamp(-v * 0.14, -5, 5), 0.12);
    root.style.setProperty('--sk', `${sk.toFixed(2)}deg`);
  });
}

/* ---------- marquees that speed up and turn with the scroll ---------- */
function marquees() {
  $$('.mq-track').forEach(tr => {
    tr.style.animation = 'none';
    const copies = +(tr.dataset.copies || 2);
    let x = 0, dir = tr.closest('.mq')?.classList.contains('rev') ? -1 : 1, lastY = scrollY;
    tickers.push(dt => {
      const v = window.__lenis ? window.__lenis.velocity : scrollY - lastY; lastY = scrollY;
      if (Math.abs(v) > 0.5) dir = Math.sign(v) * (tr.closest('.mq')?.classList.contains('rev') ? -1 : 1);
      const period = tr.scrollWidth / copies || 1;
      x -= (55 + Math.min(900, Math.abs(v) * 28)) * dir * dt;
      if (x <= -period) x += period; if (x > 0) x -= period;
      tr.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    });
  });
}

/* ---------- headings that unscramble as they arrive ---------- */
function scramble() {
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=';
  $$('.sec-h, .cta .sec-h').forEach(h => {
    const nodes = []; const walk = n => n.childNodes.forEach(c => (c.nodeType === 3 ? c.textContent.trim() && nodes.push([c, c.textContent]) : walk(c))); walk(h);
    let done = false;
    new MutationObserver(() => {
      if (done || !h.classList.contains('in')) return; done = true;
      const t0 = performance.now(), dur = 900;
      const step = now => {
        const p = clamp((now - t0) / dur);
        nodes.forEach(([n, txt]) => { const k = Math.floor(txt.length * p); n.textContent = txt.slice(0, k) + [...txt.slice(k)].map(ch => (/\s/.test(ch) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(''); });
        if (p < 1) requestAnimationFrame(step); else nodes.forEach(([n, txt]) => (n.textContent = txt));
      };
      requestAnimationFrame(step);
    }).observe(h, { attributes: true, attributeFilter: ['class'] });
  });
}

/* =========================================================
   More openings
   ========================================================= */
const cssColor = n => getComputedStyle(root).getPropertyValue(n).trim();

/* ---------- lens ---------- */
function lens(still) {
  const h = document.querySelector('[data-lens]'); if (!h || still) return;
  const top = h.querySelector('.ls.top');
  let x = innerWidth * 0.7, y = innerHeight * 0.42, r = 0;
  tickers.push((dt, now) => {
    const b = h.getBoundingClientRect(); if (b.bottom < 0) return;
    const auto = !(fine && pointer.has);
    const tx = auto ? b.width * (0.5 + 0.3 * Math.cos(now / 1900)) : pointer.x - b.left;
    const ty = auto ? b.height * (0.45 + 0.22 * Math.sin(now / 1500)) : pointer.y - b.top;
    x = lerp(x, tx, 0.12); y = lerp(y, ty, 0.12);
    r = lerp(r, 150 + Math.min(150, Math.hypot(pointer.vx, pointer.vy) * 4) + Math.sin(now / 700) * 8, 0.08);
    top.style.setProperty('--lx', x.toFixed(1) + 'px'); top.style.setProperty('--ly', y.toFixed(1) + 'px'); top.style.setProperty('--lr', r.toFixed(1) + 'px');
  });
}

/* ---------- dots ---------- */
function dots(still) {
  const cv = document.querySelector('[data-dots]'); if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, d = 1, ink = '#000', acc = '#f00';
  const colors = () => { ink = cssColor('--ink'); acc = cssColor('--accent'); };
  const size = () => { d = Math.min(1.5, devicePixelRatio || 1); W = cv.offsetWidth; H = cv.offsetHeight; cv.width = Math.round(W * d); cv.height = Math.round(H * d); };
  colors(); size(); addEventListener('resize', size);
  new MutationObserver(colors).observe(root, { attributes: true, attributeFilter: ['style'] });
  const GAP = 30, R = 180;
  const draw = now => {
    const b = cv.getBoundingClientRect(), px = pointer.has ? pointer.x - b.left : -999, py = pointer.has ? pointer.y - b.top : -999;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    const hot = [];
    ctx.fillStyle = ink; ctx.globalAlpha = 0.3; ctx.beginPath();
    for (let j = 0, y = GAP / 2; y < H; y += GAP, j++) for (let i = 0, x = GAP / 2; x < W; x += GAP, i++) {
      const dx = x - px, dy = y - py, dist = Math.hypot(dx, dy);
      if (dist < R) { const k = 1 - dist / R; hot.push([x + (dx / (dist || 1)) * k * k * 26, y + (dy / (dist || 1)) * k * k * 26, 1.5 + k * 3.4, k]); continue; }
      const rad = 1.4 + Math.sin(now / 900 + (i + j) * 0.45) * 0.55;
      ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, 6.2832);
    }
    ctx.fill();
    ctx.fillStyle = acc;
    for (const [x, y, rad, k] of hot) { ctx.globalAlpha = 0.35 + k * 0.65; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  if (still) return draw(0);
  let on = true; new IntersectionObserver(es => (on = es[0].isIntersecting)).observe(cv);
  tickers.push((dt, now) => { if (on) draw(now); });
}

/* ---------- doors ---------- */
function doors(still) {
  const sec = document.querySelector('[data-doors]'); if (!sec || still) return;
  onScroll(sec, ['start start', 'end end'], p => sec.style.setProperty('--dp', ease(clamp(p / 0.75)).toFixed(4)));
}

/* ---------- type wall ---------- */
function typewall(still) {
  const sec = document.querySelector('[data-typewall]'); if (!sec) return;
  const rows = $$('.tw2-row', sec).map((row, k) => ({ tr: row.firstElementChild, dir: +row.dataset.dir, x: -k * 140 }));
  if (still) return rows.forEach(r => (r.tr.style.transform = `translate3d(${r.x}px, 0, 0)`));
  let lastY = scrollY;
  tickers.push(dt => {
    const v = window.__lenis ? window.__lenis.velocity : scrollY - lastY; lastY = scrollY;
    const lean = fine && pointer.has ? (pointer.x / innerWidth - 0.5) * 90 : 0;
    rows.forEach(r => {
      const period = r.tr.scrollWidth / 2 || 1;
      r.x -= (38 + Math.abs(v) * 24 + lean * r.dir) * r.dir * dt;
      if (r.x <= -period) r.x += period; if (r.x > 0) r.x -= period;
      r.tr.style.transform = `translate3d(${r.x.toFixed(1)}px, 0, 0)`;
    });
  });
}

/* ---------- drum ---------- */
function drum(still) {
  const box = document.querySelector('[data-drum]'); if (!box) return;
  const inner = box.firstElementChild, faces = $$('.df', box);
  let rot = 0, vel = 0, drag = false, ly = 0, lastY = scrollY;
  const paint = () => {
    inner.style.setProperty('--rot', rot.toFixed(2));
    faces.forEach((f, i) => { const a = (((rot - i * 30) % 360) + 540) % 360 - 180, c = Math.cos(a * Math.PI / 180); f.style.setProperty('--o', (c > 0 ? 0.1 + c * c * 0.9 : 0).toFixed(3)); f.classList.toggle('on', Math.abs(a) < 15); });
  };
  paint(); if (still) return;
  box.addEventListener('pointerdown', e => { drag = true; ly = e.clientY; box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', e => { if (!drag) return; const dy = e.clientY - ly; ly = e.clientY; rot -= dy * 0.5; vel = -dy * 30; });
  const end = () => (drag = false); box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  tickers.push(dt => {
    const v = window.__lenis ? window.__lenis.velocity : scrollY - lastY; lastY = scrollY;
    if (!drag) { vel = lerp(vel, 16 + v * 14, 0.06); rot += vel * dt; }
    paint();
  });
}

/* ---------- mosaic ---------- */
function mosaic(still) {
  const box = document.querySelector('[data-mosaic]'); if (!box || still) return;
  const tiles = $$('.mz', box);
  // now and then a few tiles turn over on their own
  setInterval(() => {
    if (!box.classList.contains('done') || document.hidden) return;
    const r = box.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const start = (Math.random() * tiles.length) | 0;
    [0, 1, 7].forEach((o, n) => { const t = tiles[(start + o) % tiles.length]; setTimeout(() => { t.classList.add('fl'); setTimeout(() => t.classList.remove('fl'), 1300); }, n * 140); });
  }, 2600);
}

export { tickers, pointer, onScroll, fine, calm, lerp, clamp, ease };
