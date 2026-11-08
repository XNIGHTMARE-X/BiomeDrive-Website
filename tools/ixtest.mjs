// Film the loader, step through the project index, open and close the modal. Logs errors.
// usage: BD=scheme,hero,mode node ixtest.mjs <url> <outPrefix> <w> <h>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, pre, w = 1440, h = 900] = process.argv.slice(2);
const port = 9600 + Math.floor(Math.random() * 300);
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); const errs = [];
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(JSON.stringify(m.params.args).slice(0, 300)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
let n = 0; const shot = async tag => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync(`${pre}-${String(n++).padStart(2, '0')}-${tag}.jpg`, Buffer.from(r.result.data, 'base64')); };
const mobile = +w < 700;
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile });
await send('Page.enable'); await send('Runtime.enable');
if (process.env.BD) { const [s, hh, m] = process.env.BD.split(','); await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('bd-scheme','${s}');localStorage.setItem('bd-hero','${hh}');localStorage.setItem('bd-mode','${m}')}catch(e){}` }); }
await send('Page.navigate', { url });
for (let i = 0; i < 10; i++) { await sleep(400); await shot('load'); }
await sleep(1500); await shot('hero');
console.log('loading class left?', await ev(`document.documentElement.classList.contains('loading')`), 'loader in DOM?', await ev(`!!document.getElementById('loader')`));
// go to the index
const top = await ev(`document.getElementById('ix').getBoundingClientRect().top + scrollY`);
const go = async y => { await ev(`window.__lenis ? window.__lenis.scrollTo(${y},{immediate:true,force:true}) : scrollTo(0,${y})`); };
const range = await ev(`document.getElementById('ix').offsetHeight - innerHeight`);
for (const f of [0, 0.4, 1.0, 2.5, 4.0, 7.0]) { await go(top + (f / 8) * range); await sleep(1300); await shot('ix' + f); }
console.log('state', await ev(`[document.getElementById('ixN').textContent, document.getElementById('ixCount').textContent, document.querySelector('#ixNames li.on')?.textContent]`));
// mid-scroll motion frame
await go(top + (2 / 8) * range); await sleep(900);
await ev(`(async()=>{for(let i=0;i<6;i++){window.__lenis.scrollTo(scrollY+90,{immediate:true,force:true});await new Promise(r=>setTimeout(r,16))}})()`);
await shot('moving'); await sleep(1500);
// open the middle shot
const c = await ev(`(()=>{const r=document.querySelector('.ix-shot.cur').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c[0], y: c[1] });
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: c[0], y: c[1], button: 'left', buttons: 1, clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c[0], y: c[1], button: 'left', clickCount: 1 });
await sleep(250); await shot('modal-opening'); await sleep(1600); await shot('modal');
console.log('modal open', await ev(`document.getElementById('pm').open`), await ev(`document.getElementById('pmName').textContent`));
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await sleep(700);
console.log('modal closed', !(await ev(`document.getElementById('pm').open`)));
console.log('errors', errs.length ? errs : 'none', 'overflowX', await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth'));
sock.close(); p.kill(); process.exit(0);
