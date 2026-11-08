// Go to one project in the index, screenshot it, then open its project window.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, pre, idx = '4', w = 1440, h = 900] = process.argv.slice(2);
const port = 9850 + Math.floor(Math.random() * 100);
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); const errs = [];
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78 }); writeFileSync(`${pre}-${n}.jpg`, Buffer.from(r.result.data, 'base64')); };
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url }); await sleep(6500);
await ev(`(async()=>{const ix=document.getElementById('ix');const top=ix.getBoundingClientRect().top+scrollY;const r=ix.offsetHeight-innerHeight;window.__lenis.scrollTo(top+(${idx}/5)*r+2,{immediate:true,force:true});})()`);
await sleep(2000); await shot('index');
console.log('index shows', await ev(`[document.getElementById('ixN').textContent, document.querySelector('#ixNames li.on').textContent, document.getElementById('ixCount').textContent]`));
const c = await ev(`(()=>{const r=document.querySelector('.ix-shot.cur').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
for (const t of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type: t, x: c[0], y: c[1], button: t === 'mouseMoved' ? 'none' : 'left', buttons: t === 'mousePressed' ? 1 : 0, clickCount: t === 'mouseMoved' ? 0 : 1 });
await sleep(1800); await shot('window');
console.log('window', await ev(`[document.getElementById('pm').open, document.getElementById('pmName').textContent, document.getElementById('pmVisit').href]`));
console.log('errors', errs.length ? errs : 'none');
sock.close(); p.kill(); process.exit(0);
