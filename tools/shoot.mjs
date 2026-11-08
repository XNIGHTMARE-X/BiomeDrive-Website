// Headless Chrome screenshots over the DevTools protocol.
// usage: node shoot.mjs <url> <out.png> <width> <height> [waitMs] [scrollY]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, out, w = 1440, h = 900, wait = 6000, sy = 0] = process.argv.slice(2);
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = mkdtempSync(join(tmpdir(), 'cdp-'));
const p = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map();
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.enable'); await send('Runtime.enable');
if (process.env.BD) { const [s, h, m] = process.env.BD.split(','); await send('Page.addScriptToEvaluateOnNewDocument', { source: `/*BD_INIT*/try{localStorage.setItem('bd-scheme','${s}');localStorage.setItem('bd-hero','${h}');localStorage.setItem('bd-mode','${m}')}catch(e){}` }); }
await send('Page.navigate', { url });
await sleep(+wait);
if (+sy) { await send('Runtime.evaluate', { expression: `(window.__lenis? window.__lenis.scrollTo(${sy},{immediate:true,force:true}) : window.scrollTo(0,${sy}))` }); await sleep(1500); }
const r = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(r.result.data, 'base64'));
const errs = await send('Runtime.evaluate', { expression: 'document.title' });
console.log('ok', out, errs.result?.result?.value);
sock.close(); p.kill();
process.exit(0);
