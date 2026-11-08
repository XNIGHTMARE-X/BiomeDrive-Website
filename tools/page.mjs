// Film the whole page: the loader, then screenshots at scroll positions (fractions of the page),
// with a mouse swirl over the work covers. Logs errors and sideways overflow.
// usage: BD=scheme,hero,mode node page.mjs <url> <outPrefix> <w> <h> <f1,f2,...>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, pre, w = 1440, h = 900, fr = '0,0.05,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1'] = process.argv.slice(2);
const port = 9700 + Math.floor(Math.random() * 250);
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); const errs = [];
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(JSON.stringify(m.params.args).slice(0, 300)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
let n = 0; const shot = async tag => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 }); writeFileSync(`${pre}-${String(n++).padStart(2, '0')}-${tag}.jpg`, Buffer.from(r.result.data, 'base64')); };
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.enable'); await send('Runtime.enable');
if (process.env.BD) { const [s, hh, m] = process.env.BD.split(','); await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('bd-scheme','${s}');localStorage.setItem('bd-hero','${hh}');localStorage.setItem('bd-mode','${m}');localStorage.setItem('bd-work','index')}catch(e){}` }); }
await send('Page.navigate', { url });
for (let i = 0; i < 6; i++) { await sleep(600); await shot('load'); }
await sleep(1800);
const H = await ev('(window.__lenis && window.__lenis.limit) || document.documentElement.scrollHeight - innerHeight');
for (const f of fr.split(',').map(Number)) {
  const y = Math.round(H * f);
  await ev(`(async()=>{const t=${y};let c=scrollY;while(Math.abs(c-t)>4){c+=Math.sign(t-c)*Math.min(300,Math.abs(t-c)); window.__lenis?window.__lenis.scrollTo(c,{immediate:true,force:true}):scrollTo(0,c); await new Promise(r=>setTimeout(r,40));}})()`);
  await sleep(1200);
  await shot('f' + f);
}
// work covers: scroll to the index and stir the mouse across the middle cover
const top = await ev(`(()=>{const e=document.getElementById('ix');return e?e.getBoundingClientRect().top+scrollY:-1})()`);
if (top >= 0) {
  await ev(`window.__lenis.scrollTo(${top + 2},{immediate:true,force:true})`); await sleep(1500);
  for (let i = 0; i <= 40; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: w * 0.25 + i * (w * 0.5 / 40), y: h * 0.45 + Math.sin(i / 3) * h * 0.12 }); await sleep(16); }
  await shot('trail');
  await ev(`(async()=>{for(let i=0;i<8;i++){window.__lenis.scrollTo(scrollY+70,{immediate:true,force:true});await new Promise(r=>setTimeout(r,16))}})()`);
  await shot('bend');
  console.log('gl on?', await ev(`document.querySelector('.ix-stage').classList.contains('gl')`));
}
console.log('errors', errs.length ? errs : 'none', 'overflowX', await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth'));
sock.close(); p.kill(); process.exit(0);
