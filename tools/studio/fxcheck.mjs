// Tests the interactive templates in headless Chrome: loads each one normally (not as a thumbnail),
// moves the mouse, scrolls through the page and checks that every effect it uses actually ran.
// Saves a screenshot at the top and one part-way down.
//   node tools/studio/fxcheck.mjs <base-url> <out-dir> [ids]
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [base, out, only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const { TEMPLATES } = await import(pathToFileURL(join(here, '../../site/studio/data/templates.js')).href);
const list = TEMPLATES.filter(t => (only === 'all' ? true : only === 'still' ? !(t.fx && t.fx.length) : only ? only.split(',').includes(t.id) : t.fx && t.fx.length));
const SIG = new Set('switch gauge blueprint estimator wipe swatches scribble level route boxes tacho card3d slot clock typewriter deck goo glitch morph carousel3d flap dock wave breathe bubbles pulse orbit balance particles chart receipt throughtext horizon shutter polaroids petals grow'.split(' '));
const W = +process.env.W || 1440, H = +process.env.H || 900;   // W=390 H=844 for a phone
const port = 9100 + Math.floor(Math.random() * 150);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'fxc-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', `--window-size=${W},${H}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
const ws = new WebSocket(wsUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); let errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails?.exception?.description || 'exception').slice(0, 220)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(m.params.args.map(a => a.value || a.description).join(' ').slice(0, 220)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 62 }); writeFileSync(join(out, name + '.jpg'), Buffer.from(r.result.data, 'base64')); };
const mouse = (x, y) => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, pointerType: 'mouse' });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });

let bad = 0;
for (const t of list) {
  errs = [];
  await send('Page.navigate', { url: `${base}/studio/view/?t=${t.id}` });
  await sleep(3800);   // preloader + reveals
  for (let i = 0; i < 12; i++) { await mouse(300 + i * 70, 300 + (i % 4) * 60); await sleep(40); }
  await sleep(500);
  await shot(`${t.id}-a`);
  const top = await ev(`(() => {
    const q = s => document.querySelector(s), r = {};
    r.loaderGone = !q('.ldr');
    r.chars = document.querySelectorAll('.hero .ch').length; r.words = document.querySelectorAll('.wv').length;
    r.lens = q('.ls.top') ? parseFloat(q('.ls.top').style.getPropertyValue('--lr')) || 0 : null;
    r.dotsInk = (() => { const c = q('[data-dots]'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4 * 53) if (d[i] > 10) n++; return n; })();
    r.wall = q('.tw2-track') ? q('.tw2-track').style.transform : null;
    r.drum = q('.drum-in') ? q('.drum-in').style.getPropertyValue('--rot') : null;
    r.mosaic = q('[data-mosaic]') ? q('[data-mosaic]').classList.contains('in') : null;
    r.hidden = [...document.querySelectorAll('.hero [data-r].in')].filter(e => { const c = getComputedStyle(e); return c.opacity === '0' || (e.dataset.r.startsWith('clip') && !['none', 'inset(0px)', 'inset(0px round 0px)', 'circle(75% at 50% 50%)'].includes(c.clipPath)); }).length;
    r.sig = (() => { const e = q('[data-sig]'); return e ? { k: e.dataset.sig, live: e.dataset.live === '1', w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null; })();
    r.cursor = !!q('.cur-ring');
    r.topoInk = (() => { const c = q('[data-topo]'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 10) n++; return n; })();
    r.liquidGL = q('[data-liquid]') ? q('[data-liquid]').classList.contains('gl') : null;
    r.typeLift = q('[data-typewave]') ? Math.max(...[...document.querySelectorAll('.tw-l')].map(l => +l.style.getPropertyValue('--lift') || 0)).toFixed(2) : null;
    r.depth = q('.h-depth') ? q('.h-depth').style.getPropertyValue('--dx') : null;
    r.slices = q('[data-slices]') ? q('[data-slices]').classList.contains('in') : null;
    return r;
  })()`);
  // scroll down through the page in steps, recording pinned pieces as they move
  const H2 = await ev('document.documentElement.scrollHeight');
  const marks = {};
  for (let y = 0; y <= H2; y += 450) {
    await ev(`(window.__lenis ? window.__lenis.scrollTo(${y}, { immediate: true, force: true }) : scrollTo(0, ${y}), 1)`);
    await sleep(110);
    const m = await ev(`(() => { const q = s => document.querySelector(s); return {
      doors: q('[data-doors]') ? q('[data-doors]').style.getPropertyValue('--dp') : null,
      zoom: q('[data-zoom]') ? +q('[data-zoom]').style.getPropertyValue('--zw') : null,
      reel: q('.rl-track') ? q('.rl-track').style.transform : null,
      hs: q('.hs-track') ? q('.hs-track').style.transform : null,
      push: q('.pl.a') ? q('.pl.a').style.transform : null,
      stack: q('.sk-card') ? q('.sk-card').style.getPropertyValue('--sk-s') : null,
      odo: q('.od-d') ? q('.od-d').style.getPropertyValue('--n') : null,
      skew: getComputedStyle(document.documentElement).getPropertyValue('--sk'),
      prog: q('.prog') ? q('.prog').style.getPropertyValue('--pg') : null } })()`);
    for (const [k, v] of Object.entries(m)) if (v != null && v !== '' && v !== 0 && v !== 'none') (marks[k] ||= new Set()).add(String(v));
    if (y === 900) await shot(`${t.id}-b`);
  }
  const has = (sel) => ev(`!!document.querySelector('${sel}')`);
  const checks = [];
  const need = (ok, what) => { if (!ok) checks.push(what); };
  t.fx = t.fx || [];
  if (t.fx.includes('loader')) need(top.loaderGone, 'preloader still up');
  if (t.m.h === 'chars' && !['throughtext', 'typewriter'].includes(t.hero)) need(top.chars > 0, 'letters not split');
  if (t.m.h === 'words') need(top.words > 0, 'words not split');
  need(top.hidden === 0, top.hidden + ' revealed hero parts still invisible');
  if (SIG.has(t.hero)) need(top.sig && top.sig.k === t.hero && top.sig.live && (t.hero === 'typewriter' || (top.sig.w > 200 && top.sig.h > 150)), 'signature opening not running ' + JSON.stringify(top.sig));
  if (t.hero === 'lens') need(top.lens > 40, 'lens closed');
  if (t.hero === 'dots') need(top.dotsInk > 50, 'dots not drawn');
  if (t.hero === 'typewall') need(!!top.wall, 'type wall idle');
  if (t.hero === 'drum') need(Math.abs(parseFloat(top.drum)) > 1, 'drum not turning');
  if (t.hero === 'mosaic') need(top.mosaic, 'mosaic not shown');
  if (t.hero === 'doors') need((marks.doors?.size || 0) > 2, 'doors not opening');
  if (t.fx.includes('cursor')) need(top.cursor, 'no cursor');
  if (t.hero === 'terrain') need(top.topoInk > 20, `contours not drawn (${top.topoInk})`);
  if (t.hero === 'liquid') need(top.liquidGL, 'WebGL ripple not running');
  if (t.hero === 'typewave') need(+top.typeLift > 0.05, 'letters not lifting');
  if (t.hero === 'depth') need(top.depth !== '', 'depth not moving');
  if (t.hero === 'slices') need(top.slices, 'slices not shown');
  if (t.hero === 'zoom') need((marks.zoom?.size || 0) > 2, 'window not growing');
  if (t.hero === 'reel') need((marks.reel?.size || 0) > 2, 'reel not moving');
  if (t.secs.includes('hscroll')) need((marks.hs?.size || 0) > 2, 'services row not moving');
  if (t.secs.some(s => s.startsWith('pushline'))) need((marks.push?.size || 0) > 2, 'lines not pushed');
  if (t.secs.includes('stack')) need((marks.stack?.size || 0) > 1, 'cards not stacking');
  if (t.secs.some(s => s.startsWith('odometer'))) need((marks.odo?.size || 0) > 0, 'odometer not rolling');
  if (t.fx.includes('progress')) need((marks.prog?.size || 0) > 2, 'progress bar idle');
  if (errs.length) checks.push('ERRORS: ' + [...new Set(errs)].join(' | '));
  if (checks.length) bad++;
  console.log(`${t.id.padEnd(13)} ${t.hero.padEnd(9)} ${checks.length ? 'FAIL ' + checks.join('; ') : 'ok'}`);
}
console.log(`${list.length - bad} of ${list.length} interactive templates passed`);
ws.close(); chrome.kill();
