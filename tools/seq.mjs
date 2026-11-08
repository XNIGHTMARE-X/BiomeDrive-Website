// Capture viewport frames down a page at given fractions of its scroll length.
// usage: node seq.mjs <url> <outPrefix> <w> <h> <firstWaitMs> <f1,f2,...>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, pre, w, h, wait, fr] = process.argv.slice(2);
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const p = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map();
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) console.log('ERR', JSON.stringify(r.result.exceptionDetails).slice(0,300)); return r.result?.result?.value; };
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url }); await sleep(+wait);
const H = await ev('(window.__lenis && window.__lenis.limit) || Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - innerHeight');
let n = 0;
for (const f of fr.split(',').map(Number)) {
  const y = Math.round(H * f);
  // walk there in steps so scroll-triggered reveals fire
  await ev(`(async()=>{const t=${y};let c=scrollY;while(Math.abs(c-t)>4){c+=Math.sign(t-c)*Math.min(400,Math.abs(t-c)); window.__lenis?window.__lenis.scrollTo(c,{immediate:true,force:true}):scrollTo(0,c); await new Promise(r=>setTimeout(r,60));}})()`);
  await sleep(2200);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${pre}-${n++}.png`, Buffer.from(r.result.data, 'base64'));
}
console.log('ok', pre, 'scrollable', H);
sock.close(); p.kill(); process.exit(0);
