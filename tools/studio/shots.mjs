// Screenshots Studio templates in headless Chrome (one Chrome, one tab, one template at a time).
//   node tools/studio/shots.mjs <base-url> <out-dir> [width] [ids,comma,separated] [--full | --thumb]
// Thumbnails for the Studio gallery: node tools/studio/shots.mjs http://localhost:5198 site/studio/thumbs 1440 "" --thumb
// Without --full it saves the first 2.4 screens (what a gallery card shows); with --full, the whole page.
// Pages load with ?shot=1, so every reveal is already at rest and pictures load eagerly.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const full = args.includes('--full');
const thumbMode = args.includes('--thumb');   // gallery thumbnails: 4 screens, 0.4 scale, WebP
const [base, out, w = '1440', only] = args.filter(a => !a.startsWith('--'));
const W = +w, H = W < 700 ? 844 : 900;
const { TEMPLATES } = await import(pathToFileURL(join(here, '../../site/studio/data/templates.js')).href);
const list = only ? TEMPLATES.filter(t => only.split(',').includes(t.id)) : TEMPLATES;
mkdirSync(out, { recursive: true });

const port = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'studio-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', `--window-size=${W},${H}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
const ws = new WebSocket(wsUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); let errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200) || 'exception'); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/picsum|favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text.slice(0, 200)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });

for (const t of list) {
  errs = [];
  await send('Page.navigate', { url: `${base}/studio/view/?t=${t.id}&shot=1` });
  await sleep(600);
  // wait for fonts and every picture (or 12 s)
  const info = await ev(`(async () => {
    const t0 = Date.now();
    while (!window.__ready && Date.now() - t0 < 6000) await new Promise(r => setTimeout(r, 100));
    await document.fonts.ready;
    while (Date.now() - t0 < 12000) { const imgs = [...document.images]; if (imgs.every(i => i.complete)) break; await new Promise(r => setTimeout(r, 150)); }
    await new Promise(r => setTimeout(r, 400));
    const broken = [...document.images].filter(i => i.complete && !i.naturalWidth).length;
    const wide = [...document.querySelectorAll('main *, header *, footer *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 2 && !e.closest('.mq,.gal .row,.h-collage,.hl .ln'); }).slice(0, 4).map(e => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]);
    return { H: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, broken, wide };
  })()`);
  const h = thumbMode ? Math.min(info.H, H * 4) : full ? Math.min(info.H, 16000) : Math.min(info.H, Math.round(H * 2.4));
  const r = await send('Page.captureScreenshot', { format: thumbMode ? 'webp' : 'jpeg', quality: thumbMode ? 70 : 72, captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: h, scale: thumbMode ? 0.4 : 1 } });
  writeFileSync(join(out, `${t.id}.${thumbMode ? 'webp' : 'jpg'}`), Buffer.from(r.result.data, 'base64'));
  const flag = [info.over > 0 ? `OVERFLOW ${info.over}px ${info.wide.join(' ')}` : '', info.broken ? `${info.broken} broken img` : '', errs.length ? 'ERR ' + errs.join(' | ') : ''].filter(Boolean).join('  ');
  console.log(`${t.id.padEnd(14)} ${String(info.H).padStart(6)}px  ${flag || 'ok'}`);
}
ws.close(); chrome.kill();
