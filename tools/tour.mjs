// Scroll through a page in headless Chrome, screenshot at given positions, log console errors.
// usage: node tour.mjs <url> <outPrefix> <w> <h> <y1,y2,...|sel:...>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, pre, w, h, list] = process.argv.slice(2);
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const p = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); const logs = [];
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); if (m.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(m.params.type)) logs.push(m.params.type + ' ' + m.params.args.map(a => a.value || a.description).join(' ')); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url||'')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.enable'); await send('Runtime.enable');
if (process.env.BD) { const [s, h, m] = process.env.BD.split(','); await send('Page.addScriptToEvaluateOnNewDocument', { source: `/*BD_INIT*/try{localStorage.setItem('bd-scheme','${s}');localStorage.setItem('bd-hero','${h}');localStorage.setItem('bd-mode','${m}')}catch(e){}` }); } await send('Log.enable');
await send('Page.navigate', { url }); await sleep(3500);
const items = list.split(',');
let n = 0;
for (const it of items) {
  let y;
  if (it.startsWith('sel:')) y = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(it.slice(4))});return e.getBoundingClientRect().top+scrollY-60})()`);
  else if (it.startsWith('vh')) y = Math.round(parseFloat(it.slice(2)) * +h);
  else y = +it;
  await ev(`window.__lenis ? window.__lenis.scrollTo(${y},{immediate:true,force:true}) : scrollTo(0,${y})`);
  await sleep(1400);
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`${pre}-${String(n++).padStart(2,'0')}.jpg`, Buffer.from(r.result.data, 'base64'));
}
const ov = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
console.log('wide:', await ev(`JSON.stringify([...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(); return r.right>document.documentElement.clientWidth+2 && getComputedStyle(e).position!=='fixed'}).slice(0,8).map(e=>(e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().right)))`));
console.log('overflowX', ov, 'height', await ev('document.documentElement.scrollHeight'));
console.log(logs.join('\n') || 'no console errors');
sock.close(); p.kill(); process.exit(0);
