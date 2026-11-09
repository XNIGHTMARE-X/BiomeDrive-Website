/* BiomeDrive v7 · main.js
   One black page after osply.co: a loader, the home header with a contour terrain you can stir,
   a card that flutters down the intro, statements that brighten as you read, a services drum,
   the project index (WebGL covers with a mouse trail) and its project window. Contact lives on /contact/.
   Lenis and Motion are optional: the page works without them. */

// ---- Contact settings live in js/config.js (shared with the other pages) ----

// ---- The projects (the index shows each site's home page as its cover) ----
const PROJECTS = [
  { k: 'arsh', name: 'ArshGroup', tags: ['Construction', 'Website', '2026'], url: 'arsh-group.in', href: 'https://arsh-group.in', link: 'Visit arsh-group.in',
    p: 'A design-build firm’s site. Rendered concept homes, a scroll-driven build film that goes from blueprint to lights-on, and a cost estimator that turns a few answers into a quote.',
    credit: 'Built by Naheel with Mohamed Nasheen', cover: 'img/arsh.webp', long: 'img/arsh-long.webp' },
  { k: 'triptych', name: 'Triptych', tags: ['Fashion', 'Web app', '2026'], url: 'triptych-atelier.vercel.app', href: 'https://triptych-atelier.vercel.app', link: 'Open Triptych',
    p: 'An outfit builder in three panels: top, bottom and shoes. Swipe one piece and the rest of the look stays put, with a running total at the bottom.',
    credit: 'Built by Naheel, Jaya and Mohamed Nasheen', cover: 'img/triptych.webp', long: 'img/triptych-long.webp' },
  { k: 'jgn', name: 'Jayaditya G Nair', tags: ['Portfolio', 'Website', '2026'], url: 'jgn-portfolio.vercel.app', href: 'https://jgn-portfolio.vercel.app', link: 'Visit the site',
    p: 'A portfolio for an AI engineer. A signal network you can click, a command menu, and case studies that each come with an interactive walkthrough.',
    credit: 'Built by Jaya', cover: 'img/jgn.webp', long: 'img/jgn-long.webp' },
  { k: 'naheel', name: 'Naheel N Akhtar', tags: ['Portfolio', 'WebGL', '2026'], url: 'naheel-n-akhtar.vercel.app', href: 'https://naheel-n-akhtar.vercel.app/index.html', link: 'Visit the site',
    p: 'A portfolio made of live liquid glass, ported from an Unreal Engine plugin. Throw the lens around and watch the panels bend the page behind them.',
    credit: 'Built by Naheel', cover: 'img/naheel.webp', long: 'img/naheel-long.webp' },
  { k: 'nodecraft', name: 'NodeCraft Docs', tags: ['Game dev tools', 'Docs site', '2026'], url: 'biomedrive.github.io/nodecraft-docs', href: 'https://biomedrive.github.io/nodecraft-docs/', link: 'Read the docs',
    p: 'The docs site for NodeCraft, an Unreal Engine plugin on Fab. A landing page that shows off every theme, then guides, a settings reference, an FAQ and a changelog, all searchable.',
    credit: 'Built by Naheel', cover: 'img/nodecraft.webp', long: 'img/nodecraft-long.webp' },
];

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2, '0');
  const root = document.documentElement;
  const calm = root.classList.contains('calm');
  const M = window.Motion || null;
  let vh = innerHeight;

  /* A tiny damped spring. k = stiffness, c = damping (per second). Underdamped = overshoot. */
  class Spring {
    constructor(k = 120, c = 14, x = 0) { this.k = k; this.c = c; this.x = x; this.v = 0; this.t = x; }
    step(dt) { const a = this.k * (this.t - this.x) - this.c * this.v; this.v += a * dt; this.x += this.v * dt; return this.x; }
    snap(v) { this.x = this.t = v; this.v = 0; }
  }

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  if (!calm && window.Lenis) { lenis = new Lenis({ lerp: 0.1 }); window.__lenis = lenis; }
  const scrollY = () => (lenis ? lenis.scroll : window.scrollY);
  const scrollTo = (y, o = {}) => (lenis ? lenis.scrollTo(y, o) : window.scrollTo({ top: y, behavior: o.immediate ? 'auto' : 'smooth' }));
  const absTop = el => el.getBoundingClientRect().top + scrollY();
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    scrollTo(id === '#top' ? 0 : absTop(t));
  }));

  /* ---------------- giant wordmarks fill their row; --hh is where the home header ends ---------------- */
  const homeHead = $('.home-head');
  const fitWords = () => {
    $$('.home-word span, .foot-word span, .ld-word span').forEach(el => {
      el.style.fontSize = '100px';
      const w = el.scrollWidth, box = el.parentElement.clientWidth;
      if (w && box) el.style.fontSize = `${((100 * box) / w).toFixed(2)}px`;
    });
    root.style.setProperty('--hh', `${homeHead.offsetTop + homeHead.offsetHeight}px`);
  };
  fitWords();
  document.fonts.ready.then(fitWords);
  if (window.ResizeObserver) { let lw = 0; new ResizeObserver(() => { const w = document.body.clientWidth; if (w !== lw) { lw = w; fitWords(); } }).observe(document.body); }

  /* ---------------- loader: a bar counts up, then the wordmark rises and flies into the header ---------------- */
  let introGo = () => {};
  const intro = new Promise(r => (introGo = r));
  (() => {
    const ld = $('#loader');
    if (!ld || !root.classList.contains('loading')) return introGo();
    const bar = $('.ld-bar', ld), pct = $('#ldPct'), word = $('.ld-word span', ld), bg = $('.ld-bg', ld);
    const target = $('.home-word span');
    const t0 = performance.now();
    let shown = 0;
    document.fonts.load('900 100px Anybody').then(fitWords, fitWords);
    const step = () => {
      const time = (performance.now() - t0) / 1000;
      const fontsIn = document.fonts.status === 'loaded';
      const goal = time > 6 ? 1 : Math.min(fontsIn ? 1 : 0.8, time / 1.3);  // at least 1.3 s, at most 6 s
      shown += (goal - shown) * 0.12;
      if (goal >= 1 && shown > 0.995) shown = 1;
      ld.style.setProperty('--p', shown.toFixed(4));
      pct.textContent = `${Math.round(shown * 100)}%`;
      if (shown >= 1) return reveal();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    async function reveal() {
      const end = () => { root.classList.remove('loading'); ld.remove(); try { sessionStorage.setItem('bd-intro', '1'); } catch (e) {} };
      if (!M) { end(); return introGo(); }
      M.animate(bar, { opacity: [1, 0] }, { duration: 0.3 });
      await M.animate(word, { transform: ['translateY(105%)', 'translateY(0%)'] }, { duration: 0.75, ease: [0.16, 1, 0.3, 1] });
      await new Promise(r => setTimeout(r, 160));
      $('.ld-word', ld).style.overflow = 'visible';
      const a = word.getBoundingClientRect(), b = target.getBoundingClientRect();
      const fly = M.animate(word, { transform: ['translate(0px, 0px) scale(1)', `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.height / a.height})`] }, { duration: 1.05, ease: [0.76, 0, 0.18, 1] });
      M.animate(bg, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, { duration: 1.0, delay: 0.12, ease: [0.76, 0, 0.18, 1] });
      setTimeout(introGo, 600);
      await fly;
      end();
    }
  })();

  // the home copy arrives once the loader has gone
  if (!calm && M) {
    const els = $$('.home-bar, .home-copy > *, .home-scroll');
    els.forEach(e => (e.style.opacity = '0'));
    intro.then(() => M.animate(els, { opacity: [0, 1], transform: ['translateY(22px)', 'translateY(0px)'] }, { duration: 0.9, delay: M.stagger ? M.stagger(0.07) : 0, ease: [0.16, 1, 0.3, 1] }));
  }

  /* =========================================================
     HOME · contour terrain (js/topo.js) tilted into the mist; the mouse stirs a swirl in it
     ========================================================= */
  const home = $('.home'), art = $('.home-art'), terrainEl = $('#terrain');
  let homeVisible = true;
  new IntersectionObserver(es => es.forEach(e => (homeVisible = e.isIntersecting))).observe(home);
  let terrain = null, Hi = null;
  if (terrainEl && window.Topo) {
    terrain = Topo.create(terrainEl, { scale: 400, density: 3.4, speed: 0.8, line: '#ffffff', major: '#ffffff', lineAlpha: 0.17, majorAlpha: 0.36, lineWidth: 1.8, maxDpr: 1.25 });
  }
  // the canvas's on-screen projection (its own tilt plus the panel's perspective) as a 2D homography,
  // so a mouse position can be mapped back onto the terrain
  function measureTerrain() {
    if (!terrainEl) return;
    const cs = getComputedStyle(terrainEl), ps = getComputedStyle(art);
    const T = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform);
    const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
    const [px, py] = ps.perspectiveOrigin.split(' ').map(parseFloat);
    const d = parseFloat(ps.perspective) || 0;
    const P = d ? new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / d, 0, 0, 0, 1]) : new DOMMatrix();
    const m = new DOMMatrix().translate(px, py).multiply(P).translate(-px, -py).translate(terrainEl.offsetLeft, terrainEl.offsetTop).translate(ox, oy).multiply(T).translate(-ox, -oy);
    const a = m.m11, b = m.m21, c = m.m41, e2 = m.m12, f = m.m22, g = m.m42, h = m.m14, i2 = m.m24, j = m.m44;
    const A = f * j - g * i2, B = -(e2 * j - g * h), C = e2 * i2 - f * h;
    const det = a * A + b * B + c * C || 1;
    Hi = [A / det, -(b * j - c * i2) / det, (b * g - c * f) / det, B / det, (a * j - c * h) / det, -(a * g - c * e2) / det, C / det, -(a * i2 - b * h) / det, (a * f - b * e2) / det];
  }
  const toTerrain = (u, v) => {
    if (!Hi) return null;
    const X = Hi[0] * u + Hi[1] * v + Hi[2], Y = Hi[3] * u + Hi[4] * v + Hi[5], W = Hi[6] * u + Hi[7] * v + Hi[8];
    return W > 0 ? [X / W, Y / W] : null;
  };
  measureTerrain();

  // stir: moving the mouse winds a swirl up; circling one way or the other sets its direction
  const stir = { x: 0, y: 0, inside: false, vx: 0, vy: 0, curl: 0, dir: 1, energy: 0, amp: new Spring(46, 8.5), a: 0, has: false };
  if (!calm) {
    home.addEventListener('pointermove', e => {
      const r = art.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (stir.has) {
        const vx = x - stir.x, vy = y - stir.y;
        stir.curl = clamp(stir.curl * 0.92 + (stir.vx * vy - stir.vy * vx) * 0.0006, -1, 1);
        if (stir.curl > 0.12) stir.dir = 1; else if (stir.curl < -0.12) stir.dir = -1;
        stir.energy = Math.min(1, stir.energy + Math.hypot(vx, vy) / 260);
        stir.vx = vx; stir.vy = vy;
      }
      stir.x = x; stir.y = y; stir.has = true;
      stir.inside = x >= 0 && x <= r.width && y >= 0 && y <= r.height;
    });
    home.addEventListener('pointerleave', () => { stir.inside = false; stir.has = false; });
  }
  function tickTerrain(dt) {
    if (!terrain) return;
    stir.energy *= Math.exp(-dt * 1.5);
    stir.amp.t = stir.inside ? stir.dir * (0.25 + 0.95 * stir.energy) : 0;
    stir.a = stir.amp.step(dt);
    const p = toTerrain(stir.x, stir.y);
    terrain.setSwirl(p ? p[0] : -9999, p ? p[1] : -9999, p ? stir.a : 0, 300);
    terrain.tick(dt, homeVisible && !calm);
  }

  /* =========================================================
     The card that flutters down through the intro
     ========================================================= */
  const introEl = $('#intro'), card = $('#card3d');
  const cs = { x: new Spring(36, 10), y: new Spring(36, 10), rx: new Spring(55, 9), ry: new Spring(40, 10), rz: new Spring(55, 9) };
  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  // Where it rests: peeking at the bottom of the home screen (A), in the empty column to the right of
  // statement (1) (B), then flipped over in the empty space to the left of statement (2) (C), which it
  // follows up and away. On phones there is no free column, so it flies off after the home screen.
  const say1 = $('.say .say-p'), say2 = $('.say .say-2');
  const ease = t => t * t * (3 - 2 * t);
  const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, ry: a.ry + (b.ry - a.ry) * t, rz: a.rz + (b.rz - a.rz) * t });
  let floatT = 0;
  const cardTarget = vel => {
    const W = innerWidth, ch = card.offsetHeight;
    const r1 = say1.getBoundingClientRect(), r2 = say2.getBoundingClientRect();
    const tB = ease(clamp((vh - (r1.top + r1.height / 2)) / (vh * 0.5)));   // statement (1) rises from the bottom to the middle
    const tC = ease(clamp((vh - (r2.top + r2.height / 2)) / (vh * 0.5)));   // then statement (2)
    const A = { x: 0, y: vh - ch * 0.62, ry: 0, rz: 0 };
    let B, C;
    if (W < 760) {
      B = C = { x: W * 0.32, y: -ch - 80, ry: 160, rz: 24 };
    } else {
      const bL = r1.right + 30, bR = W - r1.left;                        // free column right of (1)
      B = { x: (bL + bR) / 2 - W / 2, y: clamp(r1.top + r1.height / 2 - ch / 2, 90, vh - ch - 30), ry: -14, rz: -5 };
      const cL = r1.left, cR = r2.left - 30;                             // free space left of (2)
      C = { x: (cL + cR) / 2 - W / 2, y: r2.top + r2.height / 2 - ch / 2, ry: 194, rz: 6 };
    }
    const P = mix(mix(A, B, tB), C, tC);
    cs.x.t = P.x; cs.y.t = P.y;
    cs.ry.t = P.ry + mx * 18;
    cs.rz.t = P.rz + mx * 4;
    cs.rx.t = -my * 12 + Math.sin(floatT * 1.3) * 3 + clamp(vel * 0.7, -22, 22);
  };
  cardTarget(0); Object.values(cs).forEach(s => s.snap(s.t));
  function tickCard(dt, vel) {
    floatT += dt;
    const ir = introEl.getBoundingClientRect();
    if (ir.bottom < 0 || ir.top > vh) return;
    cardTarget(vel);
    if (calm) Object.values(cs).forEach(s => s.snap(s.t));
    const X = cs.x.step(dt), Y = cs.y.step(dt), RX = cs.rx.step(dt), RY = cs.ry.step(dt), RZ = cs.rz.step(dt);
    card.style.transform = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, 0) rotateX(${RX.toFixed(2)}deg) rotateY(${RY.toFixed(2)}deg) rotateZ(${RZ.toFixed(2)}deg)`;
  }

  /* ---------------- statements: every word brightens as it passes the lower part of the screen ---------------- */
  const wordSets = $$('[data-words]').map(p => {
    const ws = [];
    [...p.childNodes].forEach(n => {
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) return frag.appendChild(document.createTextNode(t));
        const sp = document.createElement('span'); sp.className = 'w'; sp.textContent = t; frag.appendChild(sp); ws.push(sp);
      });
      n.replaceWith(frag);
    });
    return { p, ws };
  });
  function tickWords() {
    if (calm) return;
    wordSets.forEach(({ p, ws }) => {
      const r = p.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      ws.forEach(w => { const o = clamp((vh * 0.9 - w.getBoundingClientRect().top) / (vh * 0.32)); w.style.opacity = (0.22 + 0.78 * o).toFixed(3); });
    });
  }

  /* ---------------- services drum ---------------- */
  const drumEl = $('#services'), drumItems = $$('#drum li');
  let drumFs = 0, drumCur = -1;
  function tickDrum() {
    const dr = drumEl.getBoundingClientRect();
    if (dr.bottom < 0 || dr.top > vh) return;
    if (!drumFs) drumFs = parseFloat(getComputedStyle(drumItems[0]).fontSize) || 100;
    const n = drumItems.length, f = clamp(-dr.top / Math.max(1, drumEl.offsetHeight - vh)) * (n - 1);
    const R = drumFs * 2.3, step = 0.4;
    drumItems.forEach((li, i) => {
      const th = (i - f) * step, show = Math.abs(th) < 1.5;
      li.style.visibility = show ? '' : 'hidden';
      if (!show) return;
      li.style.transform = `translate3d(-50%, calc(-50% + ${(Math.sin(th) * R).toFixed(1)}px), ${((Math.cos(th) - 1) * R).toFixed(1)}px) rotateX(${(-th).toFixed(3)}rad)`;
      const on = Math.abs(i - f) < 0.5, c = Math.cos(th);
      li.style.opacity = (on ? 1 : 0.12 + 0.34 * c * c).toFixed(3);
      li.style.color = on ? 'var(--text)' : 'var(--mute)';
    });
    const now = Math.round(f);
    if (now !== drumCur) { drumCur = now; $('#drumCount').textContent = `${pad(now + 1)} / ${pad(n)}`; }
  }

  /* =========================================================
     WebGL for the work covers: a fluid mouse trail that ripples the covers' edges
     and leaves a faint smoke behind, plus a bend while scrolling.
     ========================================================= */
  function coverGL(stage, imgs) {
    if (calm) return null;
    const cv = document.createElement('canvas'); cv.className = 'ix-gl';
    stage.appendChild(cv);
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) { cv.remove(); return null; }
    const VS = `attribute vec2 a; uniform vec4 uQuad; uniform vec2 uRes; varying vec2 vP;
      void main() { vec2 p = uQuad.xy + a * uQuad.zw; vP = p; gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0); }`;
    const FS = `precision highp float;
      uniform sampler2D uTex, uTrail; uniform vec2 uRes; uniform vec4 uBox, uClip;
      uniform float uImgA, uGray, uBright, uAlpha, uBend, uMode;
      varying vec2 vP;
      float tr(vec2 p) { float v = texture2D(uTrail, clamp(p / uRes, 0.0, 1.0)).r; return max(0.0, v - 0.05) / 0.95; }
      void main() {
        float t = tr(vP);
        if (uMode < 0.5) { float a = t * 0.12; gl_FragColor = vec4(vec3(0.95) * a, a); return; }
        vec2 g = vec2(tr(vP + vec2(9.0, 0.0)) - tr(vP - vec2(9.0, 0.0)), tr(vP + vec2(0.0, 9.0)) - tr(vP - vec2(0.0, 9.0)));
        vec2 q = vP - g * 80.0;
        float ux = clamp((q.x - uBox.x) / uBox.z, 0.0, 1.0);
        q.y -= uBend * sin(ux * 3.14159);
        if (q.x < uClip.x || q.x > uClip.x + uClip.z || q.y < uClip.y || q.y > uClip.y + uClip.w) discard;
        vec2 uv = (q - uBox.xy) / uBox.zw, tuv = uv;
        float rb = uBox.z / uBox.w;
        if (uImgA > rb) tuv.x = 0.5 + (uv.x - 0.5) * (rb / uImgA); else tuv.y = uv.y * (uImgA / rb);
        float k = length(g) * 0.02;
        vec3 c = vec3(texture2D(uTex, tuv + vec2(k, 0.0)).r, texture2D(uTex, tuv).g, texture2D(uTex, tuv - vec2(k, 0.0)).b);
        c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), uGray) * uBright;
        gl_FragColor = vec4(c * uAlpha, uAlpha);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return null; }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uQuad', 'uRes', 'uTex', 'uTrail', 'uBox', 'uClip', 'uImgA', 'uGray', 'uBright', 'uAlpha', 'uBend', 'uMode'].forEach(n => (U[n] = gl.getUniformLocation(pr, n)));
    gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uTrail, 1);
    const mkTex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(w => gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE)); [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(f => gl.texParameteri(gl.TEXTURE_2D, f, gl.LINEAR)); return t; };
    const texs = imgs.map(() => null);
    let ready = 0;
    imgs.forEach((img, i) => {
      const up = () => { const t = mkTex(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); texs[i] = { t, aspect: img.naturalWidth / img.naturalHeight }; if (++ready === imgs.length) stage.classList.add('gl'); };
      img.complete && img.naturalWidth ? up() : img.addEventListener('load', up, { once: true });
    });
    const trailTex = mkTex();
    // the trail: soft dots painted along the mouse path on a small canvas that fades every frame
    const tc = document.createElement('canvas'), tx = tc.getContext('2d'), TS = 0.2;
    let pts = [], last = null;
    stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); pts.push([e.clientX - r.left, e.clientY - r.top]); }, { passive: true });
    stage.addEventListener('pointerleave', () => (last = null));
    let W = 0, H = 0;
    function size() {
      W = stage.clientWidth; H = stage.clientHeight;
      const dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      tc.width = Math.max(2, Math.round(W * TS)); tc.height = Math.max(2, Math.round(H * TS));
    }
    size();
    function paintTrail() {
      tx.globalCompositeOperation = 'source-over';
      tx.fillStyle = 'rgba(0,0,0,0.055)'; tx.fillRect(0, 0, tc.width, tc.height);
      tx.globalCompositeOperation = 'lighter';
      pts.forEach(p => {
        if (last) {
          const dx = p[0] - last[0], dy = p[1] - last[1], d = Math.hypot(dx, dy), n = Math.min(24, Math.ceil(d / 6));
          const a = Math.min(0.42, 0.05 + d * 0.006), rad = 64 * TS;
          for (let i = 1; i <= n; i++) {
            const x = (last[0] + (dx * i) / n) * TS, y = (last[1] + (dy * i) / n) * TS;
            const gr = tx.createRadialGradient(x, y, 0, x, y, rad);
            gr.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
            tx.fillStyle = gr; tx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
          }
        }
        last = p;
      });
      pts = [];
    }
    return {
      resize: size,
      draw(list, bend) {
        if (ready < imgs.length) return;
        paintTrail();
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, trailTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
        gl.viewport(0, 0, cv.width, cv.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform2f(U.uRes, W, H);
        gl.uniform1f(U.uMode, 0); gl.uniform4f(U.uQuad, 0, 0, W, H); gl.drawArrays(gl.TRIANGLES, 0, 6);  // smoke
        gl.uniform1f(U.uMode, 1); gl.uniform1f(U.uBend, bend);
        gl.activeTexture(gl.TEXTURE0);
        list.forEach(s => {
          const tex = texs[s.i]; if (!tex) return;
          gl.bindTexture(gl.TEXTURE_2D, tex.t);
          const m = 110;
          gl.uniform4f(U.uQuad, s.box[0] - m, s.box[1] - m, s.box[2] + 2 * m, s.box[3] + 2 * m);
          gl.uniform4f(U.uBox, s.box[0], s.box[1], s.box[2], s.box[3]);
          gl.uniform4f(U.uClip, s.clip[0], s.clip[1], s.clip[2], s.clip[3]);
          gl.uniform1f(U.uImgA, tex.aspect); gl.uniform1f(U.uGray, s.gray); gl.uniform1f(U.uBright, s.bright); gl.uniform1f(U.uAlpha, s.alpha);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        });
      },
    };
  }

  /* =========================================================
     WORK · the index: one pinned screen, a strip of covers from the first project to the last. The middle cover opens up
     wide and in colour; its neighbours stay narrow and grey. Click the middle one to open it.
     ========================================================= */
  let openProject = () => {};
  const ix = $('#ix'), stage = $('.ix-stage', ix), strip = $('#ixStrip'), S = PROJECTS.length;
  ix.style.setProperty('--s', S);
  const names = $('#ixNames');
  names.innerHTML = PROJECTS.map((p, i) => `<li><button type="button" data-i="${i}">${p.name}</button></li>`).join('');
  let cur = -1, fPrev = 0, v = 0, idle = 0, snapped = true;
  const range = () => ix.offsetHeight - vh;
  const goShot = j => scrollTo(absTop(ix) + (j / Math.max(1, S - 1)) * range() + 1);
  const shots = PROJECTS.map((p, i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'ix-shot'; el.tabIndex = -1;
    el.innerHTML = `<img src="${p.cover}" alt="" draggable="false" decoding="async">`;
    strip.appendChild(el);
    el.addEventListener('click', () => (i === cur ? openProject(i, el) : goShot(i)));
    return { el, i };
  });
  const glr = coverGL(stage, shots.map(s => $('img', s.el)));
  $$('button', names).forEach(b => b.addEventListener('click', () => goShot(+b.dataset.i)));
  $('#ixOpen').addEventListener('click', () => cur >= 0 && openProject(cur, shots[cur].el));

  const setText = (id, text) => { const el = $(id); if (el.textContent !== text) { el.textContent = text; if (!calm) { el.classList.remove('roll'); void el.offsetWidth; el.classList.add('roll'); } } };
  function setProject(i) {
    const p = PROJECTS[i];
    setText('#ixN', pad(i + 1));
    setText('#ixTags', `${p.tags[1]}, ${p.tags[2]}`);
    setText('#ixKind', p.tags[0]);
    setText('#ixSay', p.p);
    setText('#ixCount', `${pad(i + 1)} / ${pad(S)}`);
    $$('li', names).forEach((li, j) => li.classList.toggle('on', j === i));
  }

  function tickIndex(dt) {
    const r = ix.getBoundingClientRect();
    if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) return;
    const f = clamp(-r.top / range()) * (S - 1);            // 0 = first project, S-1 = last; no loop
    v += (((f - fPrev) / dt) - v) * 0.2; fPrev = f;          // covers per second, smoothed
    const near = Math.round(f);
    if (near !== cur) { cur = near; setProject(cur); }
    // settle on the nearest cover once scrolling stops
    if (Math.abs(v) > 0.05) { idle = 0; snapped = false; }
    else if (!snapped && r.top <= 1 && r.bottom >= vh - 1 && (idle += dt) > 0.18) { snapped = true; if (Math.abs(f - Math.round(f)) > 0.02) goShot(Math.round(f)); }
    const wa = strip.offsetWidth, hs = strip.offsetHeight, step = hs + Math.max(8, hs * 0.03);
    const cx = strip.offsetLeft + wa / 2, cy = strip.offsetTop + hs / 2;
    const stretch = calm ? 0 : clamp(Math.abs(v) * 0.05, 0, 0.22), useGL = glr && stage.classList.contains('gl');
    const list = [];
    shots.forEach(s => {
      const d = s.i - f, ad = Math.abs(d);
      const alpha = clamp((2.6 - ad) / 0.5);                     // far-off covers fade out
      if (alpha <= 0) { if (s.on !== false) { s.el.style.visibility = 'hidden'; s.on = false; } return; }
      if (s.on !== true) { s.el.style.visibility = ''; s.on = true; }
      const a = clamp(1 - ad), side = (1 - a) * 17, sy = 1 + stretch * (0.6 + 0.4 * a);
      s.el.style.transform = `translate3d(0, ${(d * step).toFixed(1)}px, 0) scaleY(${sy.toFixed(3)})`;
      s.el.style.clipPath = `inset(0 ${side.toFixed(2)}% 0 ${side.toFixed(2)}% round 2px)`;
      s.el.style.opacity = useGL ? '' : alpha.toFixed(3);
      if (!useGL) s.el.style.filter = a > 0.995 ? 'none' : `grayscale(${(1 - a).toFixed(2)}) brightness(${(0.5 + 0.5 * a).toFixed(2)})`;
      s.el.classList.toggle('cur', a > 0.5);
      const bh = hs * sy, y = cy + d * step - bh / 2, x = cx - wa / 2;
      list.push({ i: s.i, a, box: [x, y, wa, bh], clip: [x + (wa * side) / 100, y, wa * (1 - side / 50), bh], gray: 1 - a, bright: 0.5 + 0.5 * a, alpha });
    });
    if (useGL) { list.sort((p, q) => p.a - q.a); glr.draw(list, calm ? 0 : clamp(v * 14, -34, 34)); }
  }

  /* ---------------- project window (grows out of the cover you clicked) ---------------- */
  {
    const pm = $('#pm'), fig = $('.pm-fig', pm), scr = $('.pm-screen', pm), img = $('#pmImg');
    let open = -1, auto = 0, user = false, raf = 0;
    const fill = i => {
      const p = PROJECTS[i];
      $('#pmN').textContent = `${pad(i + 1)} / ${pad(S)}`;
      $('#pmName').textContent = p.name;
      $('#pmTags').innerHTML = p.tags.map(t => `<li>${t}</li>`).join('');
      $('#pmP').textContent = p.p;
      $('#pmCredit').textContent = p.credit;
      const a = $('#pmVisit'); a.href = p.href; a.innerHTML = `${p.link} <span class="arr">↗</span>`;
      $('#pmUrl').textContent = p.url;
      img.src = p.long; img.alt = `${p.name}, several screens`;
      scr.scrollTop = 0; auto = 0; user = false;
    };
    // the long screenshot drifts down by itself until you scroll it
    const drift = () => {
      if (open < 0) return;
      if (!user && !calm) { auto += 0.5; scr.scrollTop = auto; }
      raf = requestAnimationFrame(drift);
    };
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(t => scr.addEventListener(t, () => (user = true), { passive: true }));
    openProject = (i, fromEl) => {
      fill(i);
      open = i;
      pm.showModal();
      if (lenis) lenis.stop();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(drift);
      if (calm || !M) return;
      if (fromEl) {
        fig.style.transformOrigin = '0 0';
        const a = fromEl.getBoundingClientRect(), b = fig.getBoundingClientRect();
        M.animate(fig, { transform: [`translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, 'translate(0px, 0px) scale(1, 1)'] }, { duration: 0.75, ease: [0.76, 0, 0.18, 1] });
      }
      M.animate(pm, { opacity: [0, 1] }, { duration: 0.3 });
      M.animate($$('.pm-text > *', pm), { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] }, { duration: 0.6, delay: M.stagger ? M.stagger(0.05, { startDelay: 0.15 }) : 0.15, ease: [0.16, 1, 0.3, 1] });
    };
    const close = () => {
      if (open < 0) return;
      const done = () => { pm.close(); open = -1; cancelAnimationFrame(raf); if (lenis) lenis.start(); pm.style.opacity = ''; };
      if (calm || !M) return done();
      M.animate(pm, { opacity: [1, 0] }, { duration: 0.22 }).then(done);
    };
    $('#pmX').addEventListener('click', close);
    pm.addEventListener('click', e => { if (e.target === pm) close(); });
    pm.addEventListener('cancel', e => { e.preventDefault(); close(); });
    $('#pmPrev').addEventListener('click', () => fill((open = (open + S - 1) % S)));
    $('#pmNext').addEventListener('click', () => fill((open = (open + 1) % S)));
  }

  /* ---------------- nav: shows once the home header has scrolled away ---------------- */
  const nav = $('#nav');
  const updateNav = () => nav.classList.toggle('solid', homeHead.getBoundingClientRect().bottom < 0);

  $('#year').textContent = new Date().getFullYear();

  /* ---------------- one loop ---------------- */
  let lastT = performance.now(), lastY = scrollY(), vel = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000) || 0.016;
    lastT = t;
    if (lenis) lenis.raf(t);
    const y = scrollY();
    vel += ((y - lastY) / (dt * 60) - vel) * 0.25; // px per 60 Hz frame, smoothed
    lastY = y;
    tickTerrain(dt);
    tickCard(dt, vel);
    tickWords();
    tickDrum();
    tickIndex(dt);
    updateNav();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      vh = innerHeight;
      fitWords(); drumFs = 0;
      if (terrain) terrain.resize();
      measureTerrain();
      if (glr) glr.resize();
    }, 200);
  });
})();
