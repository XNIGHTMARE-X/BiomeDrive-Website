// Checks for the v7 fixes: where the card rests beside each statement, the index's first and last
// covers (nothing above the first or below the last), and that the footer links can be clicked.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
const [url, pre, w = 1440, h = 900] = process.argv.slice(2);
const port = 9900 + Math.floor(Math.random() * 90);
const p = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', `--window-size=${w},${h}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 50; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = j.find(t => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await sleep(200); }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pend = new Map(); const errs = [];
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 }); writeFileSync(`${pre}-${n}.jpg`, Buffer.from(r.result.data, 'base64')); };
const go = async y => { await ev(`(async()=>{const t=${y};let c=scrollY;while(Math.abs(c-t)>4){c+=Math.sign(t-c)*Math.min(260,Math.abs(t-c));window.__lenis.scrollTo(c,{immediate:true,force:true});await new Promise(r=>setTimeout(r,30));}})()`); await sleep(1600); };
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 700 });
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url }); await sleep(6500);
await shot('1-home');
// card overlap with the statement words, measured when each statement is centred
const overlap = `(()=>{const c=document.getElementById('card3d').getBoundingClientRect();let n=0;document.querySelectorAll('.say .w').forEach(w=>{const r=w.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight&&r.right>c.left&&r.left<c.right&&r.bottom>c.top&&r.top<c.bottom)n++});return n})()`;
for (const [sel, tag] of [['.say .say-p', '2-say1'], ['.say .say-2', '3-say2']]) {
  const y = await ev(`(()=>{const e=document.querySelector('${sel}');const r=e.getBoundingClientRect();return Math.round(r.top+scrollY+r.height/2-innerHeight/2)})()`);
  await go(y); await shot(tag);
  console.log(tag, 'words under the card:', await ev(overlap));
}
// index: first and last covers
const ix = await ev(`(()=>{const e=document.getElementById('ix');return [Math.round(e.getBoundingClientRect().top+scrollY), e.offsetHeight-innerHeight]})()`);
const vis = `[...document.querySelectorAll('.ix-shot')].map((s,i)=>s.style.visibility==='hidden'?null:[i,Math.round(s.getBoundingClientRect().top)]).filter(Boolean)`;
await go(ix[0] + 2); await shot('4-ix-first');
console.log('first: shown', JSON.stringify(await ev(vis)), 'label', await ev(`document.getElementById('ixN').textContent`));
await go(ix[0] + ix[1] - 2); await shot('5-ix-last');
console.log('last: shown', JSON.stringify(await ev(vis)), 'label', await ev(`document.getElementById('ixN').textContent`));
// footer links
await go(await ev('Math.round((window.__lenis && window.__lenis.limit) || document.documentElement.scrollHeight - innerHeight)')); await shot('6-foot');
console.log('footer links clickable:', await ev(`[...document.querySelectorAll('.foot-row a')].map(a=>{const r=a.getBoundingClientRect();const el=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return a.textContent.trim()+':'+(el===a||a.contains(el))})`));
console.log('errors', errs.length ? errs : 'none');
sock.close(); p.kill(); process.exit(0);
