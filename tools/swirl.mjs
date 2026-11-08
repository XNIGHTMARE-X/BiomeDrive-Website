// Stir the home terrain: mouse circles over the right-hand panel, screenshot before and during.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, pre, w = 1440, h = 900] = process.argv.slice(2);
const port = 9800 + Math.floor(Math.random() * 150);
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 75 }); writeFileSync(`${pre}-${n}.jpg`, Buffer.from(r.result.data, 'base64')); };
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await send('Page.enable'); await send('Page.navigate', { url }); await sleep(7000);
await shot('a-rest');
const cx = w * 0.74, cy = h * 0.62;
for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 6; await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx + Math.cos(a) * 140, y: cy + Math.sin(a) * 110 }); await sleep(16); }
await shot('b-stir');
sock.close(); p.kill(); process.exit(0);
