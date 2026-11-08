/* BiomeDrive · topo.js
   A slow topographic flow on a canvas, with a swirl you can stir with the mouse.
   Ported to plain JS from ReactDrops "Topographic Flow" (https://reactdrops.dev,
   ReactDrops Component License 1.0: free to use on sites, not to be redistributed as a library).
   How it works: contour lines are traced once from a noise field, then every frame each line
   bends along its normal (two shared time terms), so nothing is re-traced while it animates. */
(() => {
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- noise field ---------- */
  function createElevationField(seed) {
    const perm = new Uint8Array(512);
    const values = Array.from({ length: 256 }, (_, i) => i);
    let state = (Math.round(seed) ^ 0x9e3779b9) >>> 0;
    const random = () => {
      state += 0x6d2b79f5;
      let n = Math.imul(state ^ (state >>> 15), state | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 255; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = values[i & 255];
    const gx = new Float64Array(256), gy = new Float64Array(256);
    for (let i = 0; i < 256; i++) { const a = random() * Math.PI * 2; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
    const grad = (h, x, y, c, s) => (gx[h] * c - gy[h] * s) * x + (gx[h] * s + gy[h] * c) * y;
    const noise = (x, y, c, s) => {
      const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      const a = perm[ix & 255] + (iy & 255), b = perm[(ix + 1) & 255] + (iy & 255);
      return lerp(
        lerp(grad(perm[a], fx, fy, c, s), grad(perm[b], fx - 1, fy, c, s), fade(fx)),
        lerp(grad(perm[a + 1], fx, fy - 1, c, s), grad(perm[b + 1], fx - 1, fy - 1, c, s), fade(fx)),
        fade(fy));
    };
    const rot = p => { const a = 0.3 * Math.sin(p), b = 0.3 * Math.cos(p); return [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)]; };
    const phase = (18 * 0.02) % (Math.PI * 2);
    const mainR = rot(phase), layerR = rot(phase + 0.7), crossR = rot(phase - 1.3);
    const oX = Math.cos(phase), oY = Math.sin(phase), sX = Math.cos(2 * phase), sY = Math.sin(2 * phase);
    const pX = 0.32 * (sX - 1), pY = 0.32 * sY;
    const morph = (x, y, r) => 0.96 * noise(x, y, r[0], r[1]) + 0.12 * noise(0.8 * x - 0.6 * y + 29, 0.6 * x + 0.8 * y - 17, r[2], r[3]);
    return (x, y, distortion) => {
      const f = 1.25, reach = 0.23 * distortion;
      let bx = 0, by = 0;
      for (let layer = 0; layer < 2; layer++) {
        const px = x * f + bx + 17 * layer, py = y * f + by - 9 * layer;
        const ox = layer ? sX : oX, oy = layer ? sY : oY;
        bx = reach * morph(px + 0.55 * ox, py + 0.55 * oy, layer ? layerR : mainR);
        by = reach * morph(0.6 * px - 0.8 * py - 13 - 0.42 * ox, 0.8 * px + 0.6 * py + 8 - 0.42 * oy, crossR);
      }
      return 1.6 * morph(x * f + bx + pX, y * f + by + pY, mainR);
    };
  }

  /* ---------- marching squares, stitched into whole curves ---------- */
  function traceContours(field, cols, rows, width, height, density) {
    const out = [];
    const stepX = width / (cols - 1), stepY = height / (rows - 1);
    const hCount = (cols - 1) * rows, spacing = 1 / density;
    const ranges = new Float32Array((cols - 1) * (rows - 1) * 2);
    for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
      const i = y * cols + x, a = field[i], b = field[i + 1], c = field[i + cols + 1], d = field[i + cols];
      const k = (y * (cols - 1) + x) * 2;
      ranges[k] = Math.min(a, b, c, d); ranges[k + 1] = Math.max(a, b, c, d);
    }
    for (let li = -Math.ceil(density); li <= Math.ceil(density); li++) {
      const level = li * spacing + 0.037;
      const nodes = new Map();
      const connect = (a, b) => { nodes.get(a).nb.push(b); nodes.get(b).nb.push(a); };
      for (let y = 0; y < rows - 1; y++) for (let x = 0; x < cols - 1; x++) {
        const k = (y * (cols - 1) + x) * 2;
        if (level <= ranges[k] || level > ranges[k + 1]) continue;
        const i = y * cols + x;
        const cn = [field[i], field[i + 1], field[i + cols + 1], field[i + cols]];
        const ids = [y * (cols - 1) + x, hCount + y * cols + x + 1, (y + 1) * (cols - 1) + x, hCount + y * cols + x];
        const co = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
        const crossed = [];
        for (let e = 0; e < 4; e++) {
          const n = (e + 1) % 4;
          if ((cn[e] >= level) === (cn[n] >= level)) continue;
          const id = ids[e];
          crossed.push(id);
          if (!nodes.has(id)) {
            const t = (level - cn[e]) / (cn[n] - cn[e]);
            nodes.set(id, { p: { x: lerp(co[e][0], co[n][0], t) * stepX, y: lerp(co[e][1], co[n][1], t) * stepY }, nb: [] });
          }
        }
        if (crossed.length === 2) connect(crossed[0], crossed[1]);
        else if (crossed.length === 4) {
          const q = (cn[0] - level) * (cn[2] - level) - (cn[1] - level) * (cn[3] - level);
          if (q >= 0) { connect(crossed[0], crossed[1]); connect(crossed[2], crossed[3]); }
          else { connect(crossed[0], crossed[3]); connect(crossed[1], crossed[2]); }
        }
      }
      const seen = new Set();
      const walk = start => {
        const pts = []; let id = start, closed = false;
        while (id !== undefined && !seen.has(id)) {
          seen.add(id);
          const node = nodes.get(id);
          pts.push(node.p);
          if (pts.length > 2 && node.nb.includes(start)) { closed = true; break; }
          id = node.nb.find(n => !seen.has(n));
        }
        if (pts.length > 2) {
          if (closed) {
            let area = 0;
            for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a.x * b.y - b.x * a.y; }
            if (area < 0) pts.reverse();
          }
          out.push({ points: pts, closed, level: li });
        }
      };
      for (const [id, node] of nodes) if (node.nb.length === 1 && !seen.has(id)) walk(id);
      for (const id of nodes.keys()) if (!seen.has(id)) walk(id);
    }
    return out;
  }

  /* resample by distance and round, so grid crossings never form pinched tips */
  function roundContour(points, closed, spacing, radius) {
    const lengths = [0], count = points.length + (closed ? 1 : 0);
    for (let i = 1; i < count; i++) { const a = points[i - 1], b = points[i % points.length]; lengths.push(lengths[i - 1] + Math.hypot(b.x - a.x, b.y - a.y)); }
    const length = lengths[lengths.length - 1];
    if (length < 0.01) return points;
    const segs = Math.max(closed ? 8 : 2, Math.ceil(length / spacing));
    const samples = [];
    let edge = 1;
    for (let i = 0; i < segs + (closed ? 0 : 1); i++) {
      const d = (i / segs) * length;
      while (edge < lengths.length - 1 && lengths[edge] < d) edge++;
      const a = points[edge - 1], b = points[edge % points.length];
      const t = (d - lengths[edge - 1]) / Math.max(1e-10, lengths[edge] - lengths[edge - 1]);
      samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    let r = samples;
    const passes = Math.max(2, Math.min(128, Math.round(2 * (radius / spacing) ** 2)));
    for (let p = 0; p < passes; p++) {
      r = r.map((pt, i, all) => {
        if (!closed && (i === 0 || i === all.length - 1)) return pt;
        const b = all[(i + all.length - 1) % all.length], a = all[(i + 1) % all.length];
        return { x: (b.x + 2 * pt.x + a.x) / 4, y: (b.y + 2 * pt.y + a.y) / 4 };
      });
    }
    return r;
  }

  /* uniform cubic B-spline: smooth joins everywhere */
  function spline(points, closed) {
    const at = i => points[closed ? (i + points.length) % points.length : Math.max(0, Math.min(points.length - 1, i))];
    const knot = (a, b, c) => ({ x: (a.x + 4 * b.x + c.x) / 6, y: (a.y + 4 * b.y + c.y) / 6 });
    const s0 = closed ? 0 : -1;
    const start = knot(at(s0 - 1), at(s0), at(s0 + 1));
    const segs = [];
    for (let i = s0; i < points.length; i++) {
      const a = at(i), b = at(i + 1), c = at(i + 2);
      segs.push({ c1: { x: (2 * a.x + b.x) / 3, y: (2 * a.y + b.y) / 3 }, c2: { x: (a.x + 2 * b.x) / 3, y: (a.y + 2 * b.y) / 3 }, end: knot(a, b, c) });
    }
    return { start, segs };
  }

  /* how far each point travels along its normal as the terrain "breathes" */
  function motionSpline(curve, scale, distortion, seed, height) {
    const offset = ((((Math.round(seed) * 0.61803398875) % 1) + 1) % 1) * Math.PI * 2;
    const P = curve.points, L = P.length;
    const at = i => P[curve.closed ? (i + L) % L : Math.max(0, Math.min(L - 1, i))];
    const normals = P.map((_, i) => {
      const b = at(i - 1), a = at(i + 1), len = Math.hypot(a.x - b.x, a.y - b.y);
      return { x: len > 1e-8 ? -(a.y - b.y) / len : 0, y: len > 1e-8 ? (a.x - b.x) / len : 0 };
    });
    let basis = P.map((pt, i) => {
      const b = at(i - 1), a = at(i + 1), tx = a.x - b.x, ty = a.y - b.y, len = Math.hypot(tx, ty);
      if (len < 1e-8) return { c: { x: 0, y: 0 }, s: { x: 0, y: 0 } };
      const nx = -ty / len, ny = tx / len;
      const ax = pt.x - b.x, ay = pt.y - b.y, bx = a.x - pt.x, by = a.y - pt.y;
      const turn = Math.abs(ax * by - ay * bx);
      const radius = turn < 1e-8 ? Infinity : (Math.hypot(ax, ay) * Math.hypot(bx, by) * len) / (2 * turn);
      const x = pt.x / scale, y = pt.y / scale, eps = 2 / scale;
      const slope = (height(x + nx * eps, y + ny * eps, distortion) - height(x - nx * eps, y - ny * eps, distortion)) / (2 * eps);
      const gain = (-scale * slope) / (slope * slope + 0.25);
      const hS = (0.11 + 0.02 * distortion) * (0.7 + 0.3 * Math.cos(0.6 * x - 0.4 * y + offset));
      const hC = 0.035 * Math.sin(0.3 * x + 0.55 * y + offset + 0.7);
      const maxT = Math.abs(gain) * (Math.abs(hS) + 2 * Math.abs(hC));
      let limit = Math.min(scale * 0.14, radius * 0.22);
      for (let o = 0; o < L; o++) {
        let sep = Math.abs(i - o);
        if (curve.closed) sep = Math.min(sep, L - sep);
        if (sep < 5 || nx * normals[o].x + ny * normals[o].y > -0.7) continue;
        limit = Math.min(limit, 0.18 * Math.hypot(pt.x - P[o].x, pt.y - P[o].y));
      }
      const w = maxT > 0 ? Math.min(1, limit / maxT) : 0;
      const s = gain * hS * w, c = gain * hC * w;
      return { c: { x: nx * c, y: ny * c }, s: { x: nx * s, y: ny * s } };
    });
    const passes = Math.max(4, Math.min(18, Math.round(2 * ((scale * 0.035) / 8) ** 2)));
    for (let p = 0; p < passes; p++) {
      basis = basis.map((pt, i) => {
        if (!curve.closed && (i === 0 || i === basis.length - 1)) return pt;
        const b = basis[(i + basis.length - 1) % basis.length], a = basis[(i + 1) % basis.length];
        return { c: { x: (b.c.x + 2 * pt.c.x + a.c.x) / 4, y: (b.c.y + 2 * pt.c.y + a.c.y) / 4 }, s: { x: (b.s.x + 2 * pt.s.x + a.s.x) / 4, y: (b.s.y + 2 * pt.s.y + a.s.y) / 4 } };
      });
    }
    return { rest: spline(P, curve.closed), cos: spline(basis.map(b => b.c), curve.closed), sin: spline(basis.map(b => b.s), curve.closed) };
  }

  /* flatten to a buffer: per cubic 4 points × [rest x,y, cos x,y, sin x,y] + a move flag */
  function compile(m) {
    const cmd = [];
    const pt = (r, c, s) => [r.x, r.y, c.x, c.y, s.x, s.y];
    for (let i = 0; i < m.rest.segs.length; i++) {
      const prev = k => (i ? m[k].segs[i - 1].end : m[k].start);
      cmd.push(...pt(prev('rest'), prev('cos'), prev('sin')));
      for (const key of ['c1', 'c2', 'end']) cmd.push(...pt(m.rest.segs[i][key], m.cos.segs[i][key], m.sin.segs[i][key]));
      cmd.push(i === 0 ? 1 : 0);
    }
    return new Float64Array(cmd);
  }

  /* ---------- the renderer ---------- */
  function create(canvas, opts = {}) {
    const o = Object.assign({ scale: 340, density: 5, distortion: 2.4, seed: 42, speed: 1, line: '#fff', major: '#fff', lineAlpha: 0.12, majorAlpha: 0.2, lineWidth: 1 }, opts);
    const ctx = canvas.getContext('2d');
    const height = createElevationField(o.seed);
    let W = 0, H = 0, ratio = 1, curves = [], time = 0, dirty = true;
    const swirl = { x: -9999, y: -9999, a: 0, r: 220 };

    function rebuild() {
      // layout size, not the on-screen box: the canvas may be tilted with a CSS transform
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      ratio = Math.min(o.maxDpr || 2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(W * ratio)); canvas.height = Math.max(1, Math.round(H * ratio));
      if (!W || !H) { curves = []; return; }
      const margin = o.scale * 0.45, spanX = W + margin * 2, spanY = H + margin * 2;
      const cell = Math.max(3, Math.sqrt((spanX * spanY) / 60000));
      const cols = Math.max(2, Math.ceil(spanX / cell) + 1), rows = Math.max(2, Math.ceil(spanY / cell) + 1);
      const field = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
        field[y * cols + x] = height(((x * spanX) / (cols - 1) - margin) / o.scale, ((y * spanY) / (rows - 1) - margin) / o.scale, o.distortion);
      curves = traceContours(field, cols, rows, spanX, spanY, o.density).map(c => {
        const rounded = { closed: c.closed, points: roundContour(c.points.map(p => ({ x: p.x - margin, y: p.y - margin })), c.closed, 8, Math.min(16, Math.max(8, o.scale * 0.035))) };
        return { cmd: compile(motionSpline(rounded, o.scale, o.distortion, o.seed, height)), closed: c.closed, major: c.level % 4 === 0 };
      });
      dirty = true;
    }

    function draw() {
      if (!W || !H) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const pace = (0.18 + 0.27 * Math.log2(1 + Math.max(W, H) / 320)) / 0.63;
      const ph = time * pace * 0.12, C = Math.cos(ph) - 1, S = Math.sin(ph);
      const sw = Math.abs(swirl.a) > 0.002, sx = swirl.x, sy = swirl.y, r2 = swirl.r * swirl.r, sa = swirl.a;
      let px = 0, py = 0;
      // position of one control point now, plus the mouse swirl (a rotation that fades with distance)
      const P = (b, i) => {
        let x = b[i] + b[i + 2] * C + b[i + 4] * S, y = b[i + 1] + b[i + 3] * C + b[i + 5] * S;
        if (sw) {
          const dx = x - sx, dy = y - sy, d2 = dx * dx + dy * dy;
          if (d2 < r2 * 6) {
            const t = sa * Math.exp(-d2 / r2), c = Math.cos(t), s = Math.sin(t);
            x = sx + dx * c - dy * s; y = sy + dx * s + dy * c;
          }
        }
        px = x; py = y;
      };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = o.lineWidth;
      for (const pass of [false, true]) {
        ctx.strokeStyle = pass ? o.major : o.line;
        ctx.globalAlpha = pass ? o.majorAlpha : o.lineAlpha;
        ctx.beginPath();
        for (const cv of curves) {
          if (cv.major !== pass) continue;
          const b = cv.cmd;
          for (let i = 0; i < b.length; i += 25) {
            if (b[i + 24]) { P(b, i); ctx.moveTo(px, py); }
            P(b, i + 6); const x1 = px, y1 = py;
            P(b, i + 12); const x2 = px, y2 = py;
            P(b, i + 18);
            ctx.bezierCurveTo(x1, y1, x2, y2, px, py);
          }
          if (cv.closed) ctx.closePath();
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      dirty = false;
    }

    rebuild();
    return {
      tick(dt, animate) {
        if (animate) { time += dt * o.speed; dirty = true; }
        if (dirty) draw();
      },
      setSwirl(x, y, a, r) { swirl.x = x; swirl.y = y; swirl.a = a; if (r) swirl.r = r; if (Math.abs(a) > 0.002) dirty = true; },
      setColors(line, major) { if (line !== o.line || major !== o.major) { o.line = line; o.major = major; dirty = true; } },
      resize: rebuild,
    };
  }

  window.Topo = { create };
})();
