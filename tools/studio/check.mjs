// Drives the Studio page in headless Chrome and screenshots it: the intro, the gallery, the viewer
// (desktop and phone frames, a palette swap, a font swap) and the colour lab (with a shuffle).
//   node tools/studio/check.mjs http://localhost:5198 <out-dir> [width]
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [base, out, w = '1440'] = process.argv.slice(2);
const W = +w, H = W < 700 ? 844 : 900;
mkdirSync(out, { recursive: true });
const port = 9500 + Math.floor(Math.random() * 150);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'stc-'))}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', `--window-size=${W},${H}`, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) { try { const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); wsUrl = j.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {} if (!wsUrl) await sleep(200); }
const ws = new WebSocket(wsUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails?.exception?.description?.slice(0, 300) || 'exception'); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/picsum|favicon/.test(m.params.entry.url || '')) errs.push(m.params.entry.text.slice(0, 200)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync(join(out, name + '.jpg'), Buffer.from(r.result.data, 'base64')); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });
const scrollTo = sel => ev(`(async () => { const el = document.querySelector('${sel}'); const y = el.getBoundingClientRect().top + scrollY - 70; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); await new Promise(r => setTimeout(r, 1500)); return Math.round(scrollY); })()`);

await send('Page.navigate', { url: `${base}/studio/` }); await sleep(3500);
await shot('1-intro');
await scrollTo('#templates'); await sleep(1500); await shot('2-gallery');
console.log('cards:', await ev(`document.querySelectorAll('.tc').length`), 'thumbs loaded:', await ev(`[...document.querySelectorAll('.tc img')].filter(i => i.complete && i.naturalWidth).length`));
// filter: food and drink, then a mood
await ev(`document.querySelector('#fGroup [data-v="food"]').click()`); await sleep(700);
console.log('food filter:', await ev(`document.querySelector('#fCount').textContent`));
await ev(`document.querySelector('#fGroup [data-v="all"]').click()`); await sleep(400);
// viewer
await ev(`document.querySelector('.tc[data-id="ember"]').click()`); await sleep(4500);
const frameState = () => ev(`(() => { const d = document.getElementById('vwFrame').contentDocument; return { clipsIn: [...d.querySelectorAll('[data-r^="clip"]')].map(e => e.classList.contains('in')).join(','), bg: getComputedStyle(d.body).backgroundColor, font: getComputedStyle(d.documentElement).getPropertyValue('--f-d') }; })()`);
console.log('viewer:', JSON.stringify(await frameState()), 'url:', await ev('location.search'));
await shot('3-viewer');
await ev(`document.querySelector('#vwSug .pal:nth-child(4)').click()`); await sleep(1200);
console.log('after palette:', JSON.stringify(await frameState()), 'go:', await ev(`document.getElementById('vwGo').getAttribute('href')`));
await shot('4-viewer-palette');
await ev(`document.querySelector('.vw-side .tabs [data-tab="font"]').click()`); await sleep(1500);
await ev(`document.querySelector('.fnt[data-f="anton-work"]').click()`); await sleep(2000);
console.log('after font:', JSON.stringify(await frameState()));
await shot('5-viewer-font');
if (W >= 900) { await ev(`document.querySelector('#vwDev [data-dev="phone"]').click()`); await sleep(1500); await shot('6-viewer-phone'); }
await ev(`document.getElementById('vwClose').click()`); await sleep(800);
// pick a palette the instant the viewer opens, before its frame has loaded: it must still apply
await ev(`document.querySelector('.tc[data-id="tidewater"]').click(); setTimeout(() => document.querySelector('#vwSug .pal:nth-child(3)').click(), 30); 1`);
await sleep(5000);
console.log('quick pick:', await ev(`(() => { const p = document.querySelector('#vwSug .pal[aria-pressed="true"]')?.dataset.p; const bg = getComputedStyle(document.getElementById('vwFrame').contentDocument.body).backgroundColor; return p + ' -> frame ' + bg; })()`));
await ev(`document.getElementById('vwClose').click()`); await sleep(800);
console.log('closed:', await ev(`!document.getElementById('vw').open`), await ev('location.pathname + location.search'));
// colour lab
await scrollTo('#colour'); await sleep(4000);
await shot('7-lab');
const before = await ev(`document.querySelector('#labSw .hex').textContent`);
await ev(`document.getElementById('labShuffle').click()`); await sleep(1500);
console.log('lab shuffle:', before, '->', await ev(`document.querySelector('#labSw .hex').textContent`), '| checks:', await ev(`[...document.querySelectorAll('#labChecks b')].map(b => b.textContent).join(' / ')`));
console.log('lab frame bg:', await ev(`getComputedStyle(document.getElementById('labFrame').contentDocument.body).backgroundColor`));
await shot('8-lab-shuffled');
await ev(`window.__lenis ? window.__lenis.scrollTo(document.body.scrollHeight, { immediate: true, force: true }) : scrollTo(0, 1e6)`); await sleep(1200);
await shot('9-end');
console.log('page overflow:', await ev(`document.documentElement.scrollWidth - innerWidth`));
// "Start with this look" fills in the contact form
const go = await ev(`document.getElementById('labGo').getAttribute('href')`);
await send('Page.navigate', { url: base + go }); await sleep(2500);
console.log('contact message:', JSON.stringify(await ev(`document.getElementById('f-msg').value`)));
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no script errors');
ws.close(); chrome.kill();
