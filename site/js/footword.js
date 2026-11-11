/* BiomeDrive · footword.js (v5)
   The giant footer wordmark, flat and in the site's own text colour, drawn with WebGL over the fitted
   word so each letter can move on its own. No depth, no grey, no shading: just the letters, in motion.
   - The letters stand up one after another the first time the footer comes into view, and the word
     settles flat as you scroll to it.
   - Desktop: the word tilts a little toward the mouse; letters near the pointer lift toward you and
     turn to face it.
   - Drag across the word (mouse or finger) to spin the letters like a flip board: the ones nearest
     the pointer spin hardest, coast, then settle facing front.
   - Click or tap a letter: it rolls over once and its neighbours hop.
   All motion eases smoothly with no overshoot (Naheel's rule). The plain <span> stays in place,
   hidden, so the fit code in main.js / page.js keeps measuring it, and it comes back if WebGL is
   missing or lost. Reduced motion: the plain word, still. Shared by every page with the footer. */
(() => {
  const wrap = document.querySelector('.foot-word');
  const word = wrap && wrap.querySelector('span');
  if (!word || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return; // no WebGL: the plain word stays

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 4);

  /* ---------- 4x4 matrices, column-major, with CSS's axis conventions (y down, z toward you) ---------- */
  const mul = (a, b) => {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  };
  const T = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
  const RX = d => { const a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };
  const RY = d => { const a = d * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; };

  /* ---------- letters of the hidden word, for measuring ---------- */
  const text = word.textContent;
  word.textContent = '';
  const L = [...text].map((ch, i) => {
    const el = document.createElement('i');
    el.textContent = ch;
    word.appendChild(el);
    return { ch, el, i, x: 0, w: 0, z: 0, rx: 0, ry: 0, sy: 0, sv: 0, flipT: -1, flipDir: 1, hopT: -1, hopA: 0, start: 0 };
  });
  const probe = document.createElement('i'); // a zero-size box that sits on the baseline
  probe.style.cssText = 'display:inline-block;width:0;height:0';
  word.appendChild(probe);

  const hit = document.createElement('div'); // takes the pointer over the word
  hit.className = 'fw3';
  hit.setAttribute('aria-hidden', 'true');
  canvas.className = 'fw3-c';
  canvas.setAttribute('aria-hidden', 'true');

  /* ---------- shaders: one flat colour, cut out by the letter shapes ---------- */
  const VS = `
    attribute vec2 aPos; attribute vec2 aUv;
    uniform mat4 uM; uniform float uD; uniform vec2 uO; uniform vec4 uCanvas;
    varying vec2 vUv;
    void main() {
      vec4 p = uM * vec4(aPos, 0.0, 1.0);
      float w = (uD - p.z) / uD;
      vec2 c = uO + (p.xy - uO) / w + uCanvas.xy;
      vec2 ndc = vec2(c.x / uCanvas.z * 2.0 - 1.0, 1.0 - c.y / uCanvas.w * 2.0);
      gl_Position = vec4(ndc * w, 0.0, w);
      vUv = aUv;
    }`;
  const FS = `
    precision highp float;
    uniform sampler2D uTex; uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float a = texture2D(uTex, vUv).a;
      if (a < 0.004) discard;
      gl_FragColor = vec4(uColor * a, a);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const U = {};
  ['uM', 'uD', 'uO', 'uCanvas', 'uTex', 'uColor'].forEach(n => (U[n] = gl.getUniformLocation(prog, n)));
  const aPos = gl.getAttribLocation(prog, 'aPos'), aUv = gl.getAttribLocation(prog, 'aUv');
  const buf = gl.createBuffer(), tex = gl.createTexture();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* ---------- measure the word, draw the letters into a texture, one quad per letter ---------- */
  let W = 1, H = 1, fs = 100, baseY = 0, CW = 1, CH = 1, padL = 0, padT = 0, built = false, dead = false, color = [0.945, 0.941, 0.925];
  const FONT = s => `900 expanded ${s}px Anybody, "Arial Black", sans-serif`;
  function build() {
    if (dead) return;
    const cs = getComputedStyle(word);
    fs = parseFloat(cs.fontSize) || 100;
    const rgb = (cs.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    if (rgb.length === 3) color = rgb.map(v => v / 255); // the page's own text colour (--text)
    const sx0 = word.offsetLeft, sy0 = word.offsetTop;
    W = word.offsetWidth || 1; H = word.offsetHeight || 1;
    baseY = probe.offsetTop - sy0;
    L.forEach(l => { l.x = l.el.offsetLeft - sx0; l.w = l.el.offsetWidth; });
    padL = Math.round(W * 0.12); padT = Math.round(H * 1.2);
    CW = W + 2 * padL; CH = H + padT + Math.round(H * 0.6);
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.style.cssText = `left:${sx0 - padL}px;top:${sy0 - padT}px;width:${CW}px;height:${CH}px`;
    canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
    hit.style.cssText = `left:${sx0}px;top:${sy0}px;width:${W}px;height:${H}px`;

    // the letters, packed into rows of an atlas (sharp enough for a lifted letter)
    const res = Math.min(2.5, dpr * 1.25), MAXW = Math.floor(2040 / res), pad = Math.ceil(fs * 0.04);
    const m2 = document.createElement('canvas').getContext('2d');
    m2.font = FONT(fs);
    let ax = 0, ay = 0, rowH = 0, aw = 0;
    const cells = L.map(l => {
      const m = m2.measureText(l.ch);
      const sx = (l.w + 0.045 * fs) / (m.width || 1); // match the page's wider cut (wdth 128)
      const bl = m.actualBoundingBoxLeft || 0, br = m.actualBoundingBoxRight || m.width, as = m.actualBoundingBoxAscent || fs * 0.75, ds = m.actualBoundingBoxDescent || 0;
      const c = { l, sx, bl, as, w: Math.ceil((bl + br) * sx + 2 * pad), h: Math.ceil(as + ds + 2 * pad) };
      if (ax + c.w > MAXW) { ax = 0; ay += rowH; rowH = 0; }
      c.cx = ax; c.cy = ay; ax += c.w; aw = Math.max(aw, ax); rowH = Math.max(rowH, c.h);
      return c;
    });
    const ac = document.createElement('canvas');
    ac.width = Math.ceil(aw * res); ac.height = Math.ceil((ay + rowH) * res);
    const a = ac.getContext('2d');
    a.scale(res, res); a.font = FONT(fs); a.fillStyle = '#fff'; a.textBaseline = 'alphabetic';
    const data = [];
    cells.forEach(c => {
      a.save(); a.translate(c.cx + pad + c.bl * c.sx, c.cy + pad + c.as); a.scale(c.sx, 1); a.fillText(c.l.ch, 0, 0); a.restore();
      const l = c.l;
      const x0 = l.x - c.bl * c.sx - pad, x1 = x0 + c.w, y0 = baseY - c.as - pad, y1 = y0 + c.h;
      const u0 = (c.cx * res) / ac.width, u1 = ((c.cx + c.w) * res) / ac.width, v0 = (c.cy * res) / ac.height, v1 = ((c.cy + c.h) * res) / ac.height;
      l.start = data.length / 4;
      data.push(x0, y0, u0, v0, x1, y0, u1, v0, x0, y1, u0, v1, x0, y1, u0, v1, x1, y0, u1, v0, x1, y1, u1, v1);
    });
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ac);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    if (!built) {
      built = true;
      wrap.appendChild(canvas); wrap.appendChild(hit);
      wrap.classList.add('fw-on');
    }
    draw(performance.now());
    wake();
  }
  // rebuild (once per frame at most) when the fit code changes the size, or the window resizes
  let queued = false;
  const rebuild = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; build(); }); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dead = true; wrap.classList.remove('fw-on'); canvas.remove(); hit.remove(); });
  const start = () => {
    build();
    new MutationObserver(rebuild).observe(word, { attributes: true, attributeFilter: ['style'] });
    addEventListener('resize', rebuild);
  };
  if (document.fonts && document.fonts.load) Promise.race([document.fonts.load(FONT(100)), new Promise(r => setTimeout(r, 3000))]).then(start, start);
  else start();

  /* ---------- state ---------- */
  let onScreen = false, enterT = -1, running = false, last = 0;
  let px = -1e4, py = -1e4, mouse = false, drag = null;
  let wrx = 26, wry = 0;

  /* ---------- draw one frame ---------- */
  function draw(now) {
    if (!built || dead) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uD, W * 1.3);
    gl.uniform2f(U.uO, W * 0.5, H * 0.3);
    gl.uniform4f(U.uCanvas, padL, padT, CW, CH);
    gl.uniform3f(U.uColor, color[0], color[1], color[2]);
    gl.uniform1i(U.uTex, 0);
    const Mw = mul(mul(mul(T(W / 2, H * 0.6, 0), RX(wrx)), RY(wry)), T(-W / 2, -H * 0.6, 0));
    const cy = baseY - 0.36 * fs;
    const list = L.map(l => {
      let ent = -92, roll = 0, hop = 0;
      if (enterT > 0) ent = -92 * (1 - easeOut(clamp((now - enterT - l.i * 65) / 950, 0, 1)));
      if (l.flipT > 0) roll = 360 * easeInOut(clamp((now - l.flipT) / 900, 0, 1)) * l.flipDir;
      if (l.hopT > 0 && now > l.hopT) hop = Math.sin(Math.PI * clamp((now - l.hopT) / 520, 0, 1)) * l.hopA * 0.3 * fs;
      const cx = l.x + l.w / 2;
      const Ml = mul(mul(mul(mul(T(cx, cy, 0), T(0, -hop * 0.35, l.z + hop)), RX(l.rx + ent + roll)), RY(l.ry + l.sy)), T(-cx, -cy, 0));
      const M = mul(Mw, Ml);
      return { l, M, z: M[2] * cx + M[6] * cy + M[14] };
    });
    list.sort((p, q) => p.z - q.z); // a lifted letter draws over its neighbours
    list.forEach(o => {
      gl.uniformMatrix4fv(U.uM, false, o.M);
      gl.drawArrays(gl.TRIANGLES, o.l.start, 6);
    });
  }

  /* ---------- input ---------- */
  addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') { mouse = true; px = e.clientX; py = e.clientY; wake(); }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { if (!drag) { px = py = -1e4; mouse = false; wake(); } });

  const letterAt = x => { const r = hit.getBoundingClientRect(), bx = x - r.left; return L.find(l => bx >= l.x && bx < l.x + l.w); };
  const flip = l => {
    if (!l || l.flipT > 0) return;
    const now = performance.now();
    l.flipT = now; l.flipDir = -l.flipDir;
    L.forEach(o => { const k = Math.abs(o.i - l.i); if (k && k < 4) { o.hopT = now + k * 70; o.hopA = 1 / k; } });
    wake();
  };
  hit.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    drag = { id: e.pointerId, x0: e.clientX, x: e.clientX, t: performance.now(), moved: false, l: letterAt(e.clientX) };
    try { hit.setPointerCapture(e.pointerId); } catch (err) {}
    px = e.clientX; py = e.clientY;
    hit.classList.add('drag');
    wake();
  });
  hit.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now(), dx = e.clientX - drag.x, dt = Math.max(8, now - drag.t);
    if (Math.abs(e.clientX - drag.x0) > 6) drag.moved = true;
    // the letters near the pointer pick up spin from its speed
    const r = hit.getBoundingClientRect(), v = clamp(dx / (dt / 1000), -4000, 4000);
    L.forEach(l => { const k = (e.clientX - r.left - (l.x + l.w / 2)) / (W * 0.16); l.sv = clamp(l.sv + v * 0.35 * Math.exp(-k * k), -1400, 1400); });
    drag.x = e.clientX; drag.t = now;
    px = e.clientX; py = e.clientY;
    wake();
  });
  const endDrag = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && !cancelled) flip(drag.l);
    if (e.pointerType !== 'mouse') px = py = -1e4;
    drag = null;
    hit.classList.remove('drag');
    wake();
  };
  hit.addEventListener('pointerup', e => endDrag(e, false));
  hit.addEventListener('pointercancel', e => endDrag(e, true));
  hit.addEventListener('lostpointercapture', e => endDrag(e, true));

  /* ---------- runs only while the footer is on screen and something moves ---------- */
  new IntersectionObserver(es => {
    onScreen = es[0].isIntersecting;
    if (onScreen && enterT < 0) enterT = performance.now() + 120;
    wake();
  }, { threshold: 0.25 }).observe(wrap);
  addEventListener('scroll', wake, { passive: true }); // the scroll-driven tilt follows
  function wake() { if (running || !onScreen || !built || dead) return; running = true; last = 0; requestAnimationFrame(tick); }

  function tick(now) {
    const dt = Math.min(0.04, (now - (last || now)) / 1000) || 0.016;
    last = now;
    const r = hit.getBoundingClientRect(), vh = innerHeight;
    const has = px > -1e3;
    const near = has && px > r.left - 80 && px < r.right + 80 && py > r.top - H * 0.9 && py < r.bottom + 60;

    // the word: leans back while you scroll up to it and settles flat, tilts a little toward the mouse
    const prog = clamp((vh - r.bottom + H * 3) / (H * 3), 0, 1); // flat once the whole word is on screen
    const tx = mouse && has ? px / innerWidth - 0.5 : 0, ty = mouse && has ? py / vh - 0.5 : 0;
    const a = 1 - Math.exp(-dt * 6);
    const twx = 26 * (1 - prog) - ty * 12, twy = tx * 20;
    wrx = lerp(wrx, twx, a); wry = lerp(wry, twy, a);

    let busy = !!drag || Math.abs(wrx - twx) > 0.02 || Math.abs(wry - twy) > 0.02;
    const b = 1 - Math.exp(-dt * 9);
    L.forEach(l => {
      const k = px - r.left - (l.x + l.w / 2);
      const f = near ? Math.exp(-Math.pow(k / (W * 0.085), 2)) : 0;
      const tz = f * 0.34 * fs, tRy = clamp(k / (W * 0.07), -1, 1) * 26 * f, tRx = -10 * f;
      l.z = lerp(l.z, tz, b); l.ry = lerp(l.ry, tRy, b); l.rx = lerp(l.rx, tRx, b);
      if (Math.abs(l.z - tz) > 0.05 || Math.abs(l.ry - tRy) > 0.02 || Math.abs(l.rx - tRx) > 0.02) busy = true;
      // flip-board spin: coast, then ease to the nearest full turn (no overshoot)
      l.sy += l.sv * dt; l.sv *= Math.exp(-dt * 2.6);
      if (Math.abs(l.sv) < 160) { const rest = Math.round(l.sy / 360) * 360; l.sy = lerp(l.sy, rest, 1 - Math.exp(-dt * 5)); if (Math.abs(l.sy - rest) < 0.05) { l.sy = 0; l.sv = 0; } }
      if (l.sv || l.sy) busy = true;
      if (enterT > 0 && now < enterT + l.i * 65 + 950) busy = true;
      if (l.flipT > 0) { if (now - l.flipT >= 900) l.flipT = -1; busy = true; }
      if (l.hopT > 0) { if (now - l.hopT >= 520) l.hopT = -1; busy = true; }
    });
    draw(now);

    if (onScreen && (busy || near)) requestAnimationFrame(tick);
    else running = false;
  }
})();
