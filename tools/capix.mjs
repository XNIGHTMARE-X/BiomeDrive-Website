// One capture with an optional action first. usage: node capix.mjs <url> <out.png> <action> <scrollFrac> [w h]
// action: none | theme (click the site's theme toggle) | cmdk (open the command menu)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, out, action = 'none', frac = '0', w = 1440, h = 900] = process.argv.slice(2);
const port = 9500 + Math.floor(Math.random() * 300);
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url }); await sleep(6000);
if (+frac) {
  const H = await ev('(window.__lenis && window.__lenis.limit) || document.documentElement.scrollHeight - innerHeight');
  await ev(`(async()=>{const t=${Math.round(+frac * 1)}*${0}+Math.round(${H}*${+frac});let c=scrollY;while(Math.abs(c-t)>4){c+=Math.sign(t-c)*Math.min(400,Math.abs(t-c)); window.__lenis?window.__lenis.scrollTo(c,{immediate:true,force:true}):scrollTo(0,c); await new Promise(r=>setTimeout(r,60));}})()`);
  await sleep(2200);
}
if (action === 'theme') {
  console.log('theme btn', await ev(`(()=>{const b=[...document.querySelectorAll('button,[role=button]')].find(b=>/theme|mode|dark|light/i.test((b.getAttribute('aria-label')||'')+(b.title||'')+(b.className||'')));if(b){b.click();return (b.getAttribute('aria-label')||b.title||b.className)}return 'none'})()`));
  await sleep(2500);
}
if (action === 'cmdk') {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, modifiers: 2 });
  await sleep(1500);
}
const r = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(r.result.data, 'base64'));
console.log('ok', out);
sock.close(); p.kill(); process.exit(0);
