// Wall interaction test: mouse circles (swirl), hover chip, drag + fling. Screenshots each step.
// usage: BD=scheme,hero,mode node stir.mjs <url> <outPrefix> <w> <h>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, pre, w = 1920, h = 1080] = process.argv.slice(2);
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const p = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); const logs = [];
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') logs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push(JSON.stringify(m.params.args).slice(0, 300)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${pre}-${n}.png`, Buffer.from(r.result.data, 'base64')); };
const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: extra.button || 'none', buttons: extra.buttons || 0, clickCount: extra.clickCount || 0, pointerType: 'mouse' });
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await send('Page.enable'); await send('Runtime.enable');
if (process.env.BD) { const [s, hh, m] = process.env.BD.split(','); await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('bd-scheme','${s}');localStorage.setItem('bd-hero','${hh}');localStorage.setItem('bd-mode','${m}')}catch(e){}` }); }
const t0 = Date.now();
await send('Page.navigate', { url }); await sleep(6000);
await shot('0-rest');
const dupCheck = `(()=>{const W=innerWidth,H=innerHeight,m=W<960;const seen={},d=[];document.querySelectorAll('#wallPlane .tile').forEach(t=>{const r=t.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;if(t.style.visibility==='hidden'||r.right<0||r.left>W||r.bottom<0||r.top>H)return;if(m?cy<H*.45:cx<W*.4)return;const s=t.querySelector('img').getAttribute('src');if(seen[s])d.push(s);seen[s]=1});return d})()`;
let dups = [];
for (let k = 0; k < 6; k++) { const d = await ev(dupCheck); dups.push(...d); await sleep(1500); }
console.log('visible duplicates over 9s:', dups.length ? [...new Set(dups)] : 'none');
// projection check: projected tile centre vs its real on-screen box
console.log('projection', await ev(`(()=>{const t=document.querySelector('#wallPlane .tile:nth-child(3)');const r=t.getBoundingClientRect();return [Math.round(r.left+r.width/2),Math.round(r.top+r.height/2)]})()`));
// circles around a point on the wall
const cx = w * 0.72, cy = h * 0.5;
for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 4; await mouse('mouseMoved', cx + Math.cos(a) * 180, cy + Math.sin(a) * 180); await sleep(16); }
await shot('1-swirl');
// hold still over a tile: chip
await sleep(1200); await shot('2-hover');
console.log('chip', await ev(`document.getElementById('wallChip').className + ' | ' + document.getElementById('wallChip').textContent`));
// drag down and release (fling)
const before = await ev(`[...document.querySelectorAll('.wall-col')].map(c=>c.style.transform).join(' ')`);
await mouse('mousePressed', cx, cy - 200, { button: 'left', buttons: 1, clickCount: 1 });
for (let i = 1; i <= 12; i++) { await mouse('mouseMoved', cx, cy - 200 + i * 30, { buttons: 1 }); await sleep(16); }
await mouse('mouseReleased', cx, cy + 160, { button: 'left', clickCount: 1 });
await sleep(120); await shot('3-fling');
const after = await ev(`[...document.querySelectorAll('.wall-col')].map(c=>c.style.transform).join(' ')`);
console.log('drag moved cols:', before !== after);
// leave: tiles spring back
await mouse('mouseMoved', 5, h - 5); await sleep(50); await mouse('mouseMoved', -10, h + 10);
await sleep(2500); await shot('4-back');
console.log('errors', logs.length ? logs : 'none', 'overflowX', await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth'));
sock.close(); p.kill(); process.exit(0);
