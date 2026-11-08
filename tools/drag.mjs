import { spawn } from 'node:child_process'; import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const port = 9933; const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--window-size=1440,900', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms)); let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r); let id = 0; const pend = new Map(); sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }); await send('Page.navigate', { url: 'http://localhost:5196/' }); await sleep(7000);
await ev(`(()=>{const b=[...document.querySelectorAll('.body.on')].sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0]; const r=b.getBoundingClientRect(); const top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); window.__t=(top&&top.closest('.body'))||b; return 1})()`);
const pos = () => ev(`(()=>{const r=window.__t.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),k:window.__t.className}})()`);
const a = await pos(); console.log('before', a);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x, y: a.y });
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: a.x, y: a.y, button: 'left', clickCount: 1 });
for (let i = 1; i <= 12; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x - i * 30, y: a.y - i * 32, button: 'left', buttons: 1 }); await sleep(16); }
const held = await pos(); console.log('while held', held);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: a.x - 360, y: a.y - 384, button: 'left', clickCount: 1 });
await sleep(250); const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync('v2/throw.jpg', Buffer.from(r.result.data, 'base64'));
await sleep(3000); console.log('after landing', await pos(), 'scrollY', await ev('scrollY'));
p.kill(); process.exit(0);
