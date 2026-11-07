// Steps promo.html through time in headless Chrome and saves one JPEG per frame.
// node capture.mjs <outDir> <fps>            every frame
// node capture.mjs <outDir> stills 3 9.5 17  just those times (for checking)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_ = 'http://localhost:8766/video/promo.html?capture';
const PORT = 9341;
const [out, mode, ...rest] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rp-'))}`,
  '--hide-scrollbars', '--window-size=1920,1080', '--force-device-scale-factor=1', '--no-first-run', 'about:blank'
], { stdio: 'ignore' });

let page;
for (let i = 0; i < 100 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((x) => x.type === 'page'); } catch {}
  if (!page) await sleep(200);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
  }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pending.set(i, { res, rej });
  ws.send(JSON.stringify({ id: i, method, params }));
});

await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: URL_ });
for (;;) {
  const r = await send('Runtime.evaluate', { expression: 'window.ready === true', returnByValue: true }).catch(() => null);
  if (r?.result?.value) break;
  await sleep(250);
}
const duration = (await send('Runtime.evaluate', { expression: 'DURATION', returnByValue: true })).result.value;

async function shot(t, file) {
  await send('Runtime.evaluate', { expression: `seek(${t})`, awaitPromise: true });
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
  writeFileSync(join(out, file), Buffer.from(data, 'base64'));
}

if (mode === 'stills') {
  for (const t of rest) await shot(Number(t), `t${String(t).padStart(5, '0')}.jpg`);
} else {
  const fps = Number(mode || 60);
  const frames = Math.round(duration * fps);
  const started = Date.now();
  for (let f = 0; f < frames; f++) {
    await shot(f / fps, `f${String(f).padStart(5, '0')}.jpg`);
    if (f % 300 === 0) console.log(`frame ${f}/${frames} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  console.log(`done: ${frames} frames`);
}
ws.close();
chrome.kill();
process.exit(0);
