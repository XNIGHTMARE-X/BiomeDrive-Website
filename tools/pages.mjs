// Inner pages check: loads each page, scrolls to the bottom so every reveal runs, then takes one
// full-length screenshot and reports sideways overflow and script errors.
// node tools/pages.mjs http://localhost:5196 <out-prefix> [width]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [base, pre, w = 1440] = process.argv.slice(2);
const PAGES = ['/pricing/', '/contact/', '/terms/', '/refunds/', '/privacy/', '/delivery/', '/404.html', '/'];
const h = +w < 700 ? 844 : 900;
const port = 9900 + Math.floor(Math.random() * 90);
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); let errs = [];
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push(m.params.args.map(a => a.value).join(' ')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.enable'); await send('Runtime.enable');
for (const path of PAGES) {
  errs = [];
  await send('Page.navigate', { url: base + path }); await sleep(path === '/' ? 7000 : 2500);
  // walk down the page so reveals fire, then back to the top
  await ev(`(async()=>{const L=window.__lenis;const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=300){L?L.scrollTo(y,{immediate:true,force:true}):scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}L?L.scrollTo(0,{immediate:true,force:true}):scrollTo(0,0);})()`);
  await sleep(1500);
  const info = await ev(`({ H: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, wide: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.foot-word,.home-art,.card-track,.drum,.ix,.loader')).slice(0, 5).map(e => e.tagName + '.' + e.className) })`);
  const name = path === '/' ? 'home' : path.replace(/\W+/g, '') || 'x';
  if (path !== '/') {
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: +w, height: Math.min(info.H, 9000), scale: 1 } });
    writeFileSync(`${pre}-${name}.jpg`, Buffer.from(r.result.data, 'base64'));
  }
  console.log(name, 'height', info.H, 'overflow', info.over, info.wide.length ? info.wide : '', errs.length ? errs : 'no errors');
}
sock.close(); p.kill(); process.exit(0);
