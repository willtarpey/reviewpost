// Reads a business's website and works out its brand colours.
// Sources, strongest first: CSS variables named like brand/primary/accent, the theme-color meta tag,
// colours used in the page's CSS, and the site's icon. Greys, near-white and near-black are ignored.

function parseColor(str) {
  str = str.trim().toLowerCase();
  let m = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})\b/);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return '#' + h;
  }
  m = str.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?/);
  if (m) {
    if (m[4] != null && parseFloat(m[4]) / (m[4].endsWith('%') ? 100 : 1) < 0.5) return null;
    return '#' + [m[1], m[2], m[3]].map((v) => Math.min(255, +v).toString(16).padStart(2, '0')).join('');
  }
  return null;
}

function toHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const dlt = max - min;
  const s = l > 0.5 ? dlt / (2 - max - min) : dlt / (max + min);
  const h = max === r ? (g - b) / dlt + (g < b ? 6 : 0) : max === g ? (b - r) / dlt + 2 : (r - g) / dlt + 4;
  return { h: h * 60, s, l };
}

const isBrandish = (hex) => {
  const { s, l } = toHsl(hex);
  return s >= 0.2 && l >= 0.1 && l <= 0.92;
};

const hueGap = (a, b) => {
  const d = Math.abs(toHsl(a).h - toHsl(b).h);
  return Math.min(d, 360 - d);
};

function scanCss(css, add) {
  const varRe = /--([\w-]*(?:primary|brand|accent|main|theme|highlight|secondary)[\w-]*)\s*:\s*([^;}{]+)/gi;
  for (const m of css.matchAll(varRe)) {
    const c = parseColor(m[2]);
    if (c) add(c, /secondary|accent|highlight/i.test(m[1]) ? 12 : 20);
  }
  const colorRe = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)/gi;
  for (const m of css.matchAll(colorRe)) {
    const c = parseColor(m[0]);
    if (c) add(c, 1);
  }
}

async function iconColors(url, add) {
  const res = await fetch(url);
  if (!res.ok) return;
  const bmp = await createImageBitmap(await res.blob());
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  g.drawImage(bmp, 0, 0, 32, 32);
  const px = g.getImageData(0, 0, 32, 32).data;
  const counts = new Map();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue;
    // Quantise so near-identical pixels count together.
    const hex = '#' + [px[i], px[i + 1], px[i + 2]].map((v) => Math.min(240, Math.round(v / 16) * 16).toString(16).padStart(2, '0')).join('');
    if (isBrandish(hex)) counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  for (const [hex, n] of counts) add(hex, (n / 1024) * 40);
}

// Groups similar colours and returns them strongest first.
function rankColors(counts) {
  const groups = [];
  for (const [hex, w] of [...counts].sort((a, b) => b[1] - a[1])) {
    if (!isBrandish(hex)) continue;
    const hsl = toHsl(hex);
    const g = groups.find((x) => hueGap(x.hex, hex) < 14 && Math.abs(toHsl(x.hex).l - hsl.l) < 0.15);
    if (g) g.weight += w;
    else groups.push({ hex, weight: w });
  }
  return groups.sort((a, b) => b.weight - a.weight).map((g) => g.hex);
}

async function detectSiteBrand(raw) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : 'https://' + raw.trim());
  } catch {
    throw new Error('That doesn’t look like a web address.');
  }
  if (globalThis.chrome?.permissions) {
    // Ask for both www. and the bare domain, since sites often redirect from one to the other.
    const bare = url.hostname.replace(/^www\./, '');
    const origins = [...new Set([`${url.protocol}//${bare}/*`, `${url.protocol}//www.${bare}/*`, `${url.origin}/*`])];
    let ok;
    try {
      ok = await chrome.permissions.request({ origins });
    } catch {
      // Chrome throws this when the installed copy predates optional_host_permissions in manifest.json.
      throw new Error('Chrome is using an older copy of ReviewPost. Click the reload icon on ReviewPost at chrome://extensions, then try again.');
    }
    if (!ok) throw new Error('ReviewPost needs your OK to read that site.');
  }

  let html;
  try {
    const res = await fetch(url.href);
    if (!res.ok) throw new Error();
    html = await res.text();
  } catch {
    throw new Error('Couldn’t reach that site. Check the address and try again.');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const counts = new Map();
  const add = (hex, w) => counts.set(hex, (counts.get(hex) || 0) + w);

  const theme = parseColor(doc.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '');
  if (theme) add(theme, 30);

  let css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  css += [...doc.querySelectorAll('[style]')].map((e) => e.getAttribute('style')).join(';');
  const sheets = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')].slice(0, 6);
  await Promise.all(sheets.map(async (l) => {
    try {
      const res = await fetch(new URL(l.getAttribute('href'), url));
      if (res.ok) css += '\n' + (await res.text());
    } catch {} // stylesheets on other domains may be blocked; that's fine
  }));
  scanCss(css, add);

  const iconHref =
    doc.querySelector('link[rel~="apple-touch-icon"]')?.getAttribute('href') ||
    doc.querySelector('link[rel~="icon"]')?.getAttribute('href') ||
    '/favicon.ico';
  try { await iconColors(new URL(iconHref, url), add); } catch {}

  const ranked = rankColors(counts);
  if (!ranked.length) throw new Error('Couldn’t spot any brand colours on that site.');

  const primary = ranked[0];
  const accent =
    ranked.slice(1).find((c) => hueGap(c, primary) > 30 || Math.abs(toHsl(c).l - toHsl(primary).l) > 0.3) ||
    mix(primary, '#ffffff', 0.7);

  const siteName =
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    (doc.title || '').split(/\s[|\-–—:·]\s/)[0];

  return {
    primary,
    accent,
    text: readableOn(primary),
    name: (siteName || '').trim(),
    host: url.hostname.replace(/^www\./, '')
  };
}
