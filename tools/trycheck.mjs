// Checks the home page's "try the Studio" section in headless Chrome: scrolls to it, screenshots the fan
// of template windows, points at one window and screenshots again, then reports script errors and
// sideways overflow.   node tools/trycheck.mjs <base-url> <out-dir> [width]
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [base, out, w = '1440'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const W = +w, H = W < 700 ? 844 : 900;
const port = 9300 + Math.floor(Math.random() * 150);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'try-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', `--window-size=${W},${H}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
const ws = new WebSocket(wsUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails?.exception?.description || 'exception').slice(0, 220)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(m.params.args.map(a => a.value || a.description).join(' ').slice(0, 220)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync(join(out, `${name}-${W}.jpg`), Buffer.from(r.result.data, 'base64')); };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });
await send('Page.navigate', { url: `${base}/` });
await ev(`new Promise(r => { const t0 = Date.now(); (function w() { if (!document.documentElement.classList.contains("loading") || Date.now() - t0 > 15000) r(1); else setTimeout(w, 200); })(); })`); await sleep(800);   // wait for the loader to finish
const top = await ev(`(() => { const r = document.querySelector('#try').getBoundingClientRect(); return Math.round(r.top + scrollY - ${W < 700 ? 40 : 90}); })()`);
await ev(`(window.__lenis ? window.__lenis.scrollTo(${top}, { immediate: true, force: true }) : scrollTo(0, ${top}), 1)`);
await sleep(1600);
await shot('try');
const info = await ev(`(() => { const lis = [...document.querySelectorAll('#tryFan li')]; const r = lis[1].getBoundingClientRect();
  return { n: lis.length, imgs: lis.filter(l => l.querySelector('img').naturalWidth > 0).length, spread: Math.round(lis[4].getBoundingClientRect().left - lis[0].getBoundingClientRect().left),
    hx: Math.round(r.left + r.width * .3), hy: Math.round(r.top + r.height * .5), overflow: document.documentElement.scrollWidth - innerWidth }; })()`);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: info.hx, y: info.hy, pointerType: 'mouse' });
await sleep(900);
const hot = await ev(`[...document.querySelectorAll('#tryFan li')].findIndex(l => l.classList.contains('hot'))`);
await shot('try-hover');
console.log(JSON.stringify({ width: W, ...info, hot }), errs.length ? 'ERRORS: ' + [...new Set(errs)].join(' | ') : 'no script errors');
ws.close(); chrome.kill();
