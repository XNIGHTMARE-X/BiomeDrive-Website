// Finds headline letters cut off by their line masks. For every masked line (.ln, .tick, .wd) it measures
// the real ink of the text (canvas text metrics) against the box that clips it, at a given width.
//   node tools/studio/clipcheck.mjs <base-url> [width] [ids] [--pages]
// --pages checks the BiomeDrive pages instead of the templates.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const pagesMode = args.includes('--pages');
const [base, w = '1440', only] = args.filter(a => !a.startsWith('--'));
const W = +w, H = W < 700 ? 844 : 900;
const { TEMPLATES } = await import(pathToFileURL(join(here, '../../site/studio/data/templates.js')).href);
const urls = pagesMode
  ? ['/', '/studio/', '/pricing/', '/contact/', '/terms/'].map(p => [p, base + p])
  : (only ? TEMPLATES.filter(t => only.split(',').includes(t.id)) : TEMPLATES).map(t => [t.id, `${base}/studio/view/?t=${t.id}&shot=1`]);

const port = 9300 + Math.floor(Math.random() * 150);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'clip-'))}`, '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
const ws = new WebSocket(wsUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });

const PROBE = `(async () => {
  await document.fonts.ready; await new Promise(r => setTimeout(r, 600));
  document.documentElement.classList.add('ready');
  document.querySelectorAll('.reveal, [data-r]').forEach(e => e.classList.add('seen', 'in'));
  await new Promise(r => setTimeout(r, 1500));
  const cv = document.createElement('canvas').getContext('2d');
  const out = [];
  for (const box of document.querySelectorAll('.ln, .tick, .wd')) {
    const spans = box.matches('.tick') ? [box.querySelector('.on') || box.firstElementChild] : [box.firstElementChild];
    for (const sp of spans) {
      if (!sp || !sp.textContent.trim()) continue;
      const cs = getComputedStyle(sp);
      cv.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      if ('fontStretch' in cv) { const st = parseFloat(cs.fontStretch); cv.fontStretch = st <= 75 ? 'condensed' : st >= 125 ? 'expanded' : 'normal'; }
      cv.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      const txt = sp.textContent.trim();
      const m = cv.measureText(cs.textTransform === 'uppercase' ? txt.toUpperCase() : txt);
      const mk = () => { const i = document.createElement('i'); i.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;margin:0;padding:0'; return i; };
      const a = mk(), b = mk(); sp.prepend(a); sp.append(b);
      const top0 = a.getBoundingClientRect().bottom, bot0 = b.getBoundingClientRect().bottom;
      a.remove(); b.remove();
      const r = box.getBoundingClientRect(), s = sp.getBoundingClientRect();
      const fs = parseFloat(cs.fontSize);
      const over = {
        top: (r.top) - (top0 - m.actualBoundingBoxAscent),
        bottom: (bot0 + m.actualBoundingBoxDescent) - r.bottom,
        left: r.left - (s.left - m.actualBoundingBoxLeft),
      };
      const worst = Math.max(over.top, over.bottom, over.left);
      if (worst > 0.5) out.push({ text: txt.slice(0, 28), font: cs.fontFamily.split(',')[0], size: Math.round(fs), top: +over.top.toFixed(1), bottom: +over.bottom.toFixed(1), left: +over.left.toFixed(1) });
    }
  }
  return out;
})()`;

let total = 0, hit = 0;
for (const [name, url] of urls) {
  await send('Page.navigate', { url }); await sleep(1200);
  const res = await ev(PROBE) || [];
  total++;
  if (res.length) { hit++; console.log(`${name}: ${res.length} clipped`); res.slice(0, 4).forEach(r => console.log(`   "${r.text}" ${r.font} ${r.size}px  top ${r.top}  bottom ${r.bottom}  left ${r.left}`)); }
}
console.log(`${hit} of ${total} pages have clipped headline letters at ${W}px`);
ws.close(); chrome.kill();
