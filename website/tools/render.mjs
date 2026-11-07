// Renders designs.html in headless Chrome and saves each design to ../img/designs/<name>.webp.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const SET = process.argv[2] || ''; // 'options' renders carousel candidates
const outDir = process.argv[3] || join(here, '..', 'img', 'designs');
mkdirSync(outDir, { recursive: true });
const PORT = 9361;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rpw-'))}`, '--allow-file-access-from-files', '--disable-web-security', 'about:blank'], { stdio: 'ignore' });
let page;
for (let i = 0; i < 100 && !page; i++) { try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((x) => x.type === 'page'); } catch {} if (!page) await sleep(200); }
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Page.navigate', { url: pathToFileURL(join(here, 'designs.html')).href });
await sleep(2500);
const r = await send('Runtime.evaluate', { expression: `renderAll(${JSON.stringify(SET)})`, awaitPromise: true, returnByValue: true });
if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
for (const [name, url] of Object.entries(r.result.value)) writeFileSync(join(outDir, `${name}.webp`), Buffer.from(url.split(',')[1], 'base64'));
console.log(`Saved ${Object.keys(r.result.value).length} designs to ${outDir}`);
chrome.kill(); process.exit(0);
