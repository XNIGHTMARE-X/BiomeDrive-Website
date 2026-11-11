/* BiomeDrive · footword.js
   The giant footer wordmark answers the pointer: letters near it stretch up in a soft bulge that follows
   the mouse and lean the way it moves, then spring back. A wave runs through the word the first time it
   comes into view (phones get this too). Transforms only, so the fitted word never changes width.
   Off for reduced motion. Shared by every page that has the footer. */
(() => {
  const wrap = document.querySelector('.foot-word');
  const word = wrap && wrap.querySelector('span');
  if (!word || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // split the word into letters (the fit code measures the span, so its width is unchanged)
  const text = word.textContent;
  word.textContent = '';
  const L = [...text].map(ch => { const i = document.createElement('i'); i.textContent = ch; word.appendChild(i); return { el: i, s: 1, sv: 0, k: 0, kv: 0 }; });

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let px = -1e4, py = -1e4, vx = 0, lastX = null, onScreen = false, waveT = -1, waved = false, last = 0, running = false;
  const wake = () => { if (running || !onScreen) return; running = true; last = 0; requestAnimationFrame(tick); };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (lastX !== null) vx += (e.clientX - lastX - vx) * 0.35;
    lastX = px = e.clientX; py = e.clientY;
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { px = py = -1e4; lastX = null; });
  // a tap on the word on a touch screen sends a wave through it
  wrap.parentElement.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { const r = word.getBoundingClientRect(); if (e.clientY > r.top - 40) { waveT = performance.now(); wake(); } } });

  new IntersectionObserver(es => {
    onScreen = es[0].isIntersecting;
    if (onScreen && !waved) { waved = true; waveT = performance.now() + 250; }
    wake();
  }, { threshold: 0.4 }).observe(wrap);

  function tick(now) {
    const dt = Math.min(0.04, (now - (last || now)) / 1000) || 0.016;
    last = now;
    const r = word.getBoundingClientRect(), W = r.width, near = px > r.left - 60 && px < r.right + 60 && py > r.top - r.height * 0.6 && py < r.bottom + 30;
    vx *= 0.9;
    const wave = waveT > 0 && now > waveT ? (now - waveT) / 1100 : -1;   // 0..1 as the wave crosses
    if (wave > 1.3) waveT = -1;
    let rest = true;
    L.forEach(l => {
      const cx = l.el.offsetLeft + l.el.offsetWidth / 2;
      let f = near ? Math.exp(-Math.pow((px - r.left - cx) / (W * 0.085), 2)) : 0;
      if (wave >= 0 && wave <= 1.3) f = Math.max(f, Math.exp(-Math.pow((wave * 1.4 - 0.2 - cx / W) / 0.09, 2)) * 0.85);
      const ts = 1 + 0.17 * f, tk = near ? clamp(-vx * 0.9, -14, 14) * f : 0;
      // springs: a little overshoot, settles fast
      l.sv += ((ts - l.s) * 210 - l.sv * 15) * dt; l.s += l.sv * dt;
      l.kv += ((tk - l.k) * 170 - l.kv * 14) * dt; l.k += l.kv * dt;
      const moving = Math.abs(l.s - 1) > 0.001 || Math.abs(l.sv) > 0.01 || Math.abs(l.k) > 0.02 || Math.abs(l.kv) > 0.05;
      if (moving) rest = false;
      l.el.style.transform = moving ? `scaleY(${l.s.toFixed(4)}) skewX(${l.k.toFixed(2)}deg)` : '';
    });
    if (onScreen && (!rest || near || waveT > 0)) requestAnimationFrame(tick);
    else running = false;
  }
})();
