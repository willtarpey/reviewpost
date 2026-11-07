// ReviewPost promo. Every frame is a pure function of time: seek(t) sets the whole scene,
// so capture.mjs can step through it frame by frame. Open the page normally to watch it play.

const DURATION = 37.5;

// ---------- easing ----------
const E = {
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2
};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
// Eased progress of t through [a, b].
const p = (t, a, b, ease = E.inOut) => ease(clamp((t - a) / (b - a)));
// A soft 0 → 1 → 0 pulse starting at c.
const bump = (t, c, d = 0.22) => (t < c || t > c + d ? 0 : Math.sin(Math.PI * (t - c) / d));

// Interpolates keyframes [[time, ...values]], easing in and out between each pair.
function track(t, keys) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    const [t0, ...a] = keys[i - 1];
    const [t1, ...b] = keys[i];
    if (t <= t1) {
      const k = E.inOut((t - t0) / (t1 - t0));
      return a.map((v, j) => lerp(v, b[j], k));
    }
  }
  return keys[keys.length - 1].slice(1);
}

const $ = (id) => document.getElementById(id);
const css = (el, o) => Object.assign(el.style, o);

// ---------- content ----------
const SAMPLE = {
  text: 'Best flat white in town, and the team remember your order after one visit. Our new favourite spot!',
  headline: 'Best flat white in town',
  subtext: 'The team remember your order after one visit. Our new favourite spot!',
  name: 'Sarah M.', initials: 'SM'
};
const BRAND_DEFAULT = { businessName: 'Harbour Coffee Co.', handle: '@harbourcoffee', primary: '#16170f', accent: '#eefca6', text: '#ffffff', font: 'jakarta' };
const BRAND_MATCHED = { ...BRAND_DEFAULT, primary: '#1d3b3a', accent: '#f3c27b' };
const SITE = 'harbourcoffee.co.uk';
const TILES = ['spotlight', 'card', 'bold', 'editorial', 'glass', 'aurora'];

const data = (brand) => ({
  ...SAMPLE, rating: 5, source: 'Google', sourceLabel: 'Google review', handle: brand.handle, brand,
  style: { stars: 'rounded', corners: 'rounded' }, logo: null, bg: null
});

function drawCanvas(design, brand, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  TEMPLATES[design].draw(c.getContext('2d'), w, h, data(brand));
  return c;
}

// ---------- timeline ----------
// Captions: [in, out]
const CAPS = [[0.5, 4.6], [5.0, 9.0], [9.4, 13.8], [14.2, 19.6], [20.0, 26.8], [27.6, 32.6]];

// Design picked in the editor: [time, design]
const PICKS = [[-1, 'spotlight'], [10.0, 'card'], [10.9, 'glass'], [11.8, 'editorial'], [12.7, 'aurora']];
const T_MATCH_CLICK = 16.55, T_MATCHED = 17.5;
const T_TYPE = [14.45, 15.8];
// Size tabs: [time, size]
const SIZES_AT = [[-1, 'post'], [20.35, 'story'], [22.05, 'landscape'], [23.75, 'all']];
const T_DOWNLOAD = 26.65;
const T_PHONES = 27.6;
const T_END = 32.6;

// Camera on the browser window: [time, scale, x, y]
const CAM = [
  [0, 1, 0, 0], [1.4, 1, 0, 0], [4.5, 1.04, 110, -10], [5.7, 1, 0, 0], [8.8, 1.02, -40, 0],
  [9.6, 1.06, 140, -20], [13.3, 1.06, 140, -20], [14.1, 1.07, 150, 10], [18.7, 1.07, 150, 10],
  [19.5, 1, 0, 0], [25.6, 1, 0, 0], [26.5, 1.04, 110, -30]
];

let T = {}; // cursor targets, measured once laid out
let CURSOR = [];
let CLICKS = [];

function centre(el, ax = 0.5, ay = 0.5) {
  let x = 0, y = 0, n = el;
  while (n && n.id !== 'content') { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return [x + el.offsetWidth * ax, y + el.offsetHeight * ay];
}

function buildTimeline() {
  const tile = (id) => centre(document.querySelector(`.tile[data-d="${id}"] .thumb`), 0.55, 0.6);
  const tab = (s) => centre(document.querySelector(`.sizes [data-size="${s}"]`), 0.55, 0.6);
  T = {
    start: [1000, 560], mp1: centre($('mp1'), 0.6, 0.62), rest: [980, 420],
    site: centre($('site'), 0.35, 0.6), match: centre($('match'), 0.5, 0.6), download: centre($('download'), 0.55, 0.6)
  };
  // [time, x, y]: the cursor eases between consecutive points and holds when they match.
  const at = (t, pt) => [t, ...pt];
  CURSOR = [
    at(3.0, T.start), at(3.2, T.start), at(4.35, T.mp1), at(5.6, T.mp1), at(6.6, T.rest),
    at(9.3, T.rest), at(9.85, tile('card')), at(10.25, tile('card')), at(10.75, tile('glass')),
    at(11.15, tile('glass')), at(11.65, tile('editorial')), at(12.05, tile('editorial')), at(12.55, tile('aurora')),
    at(13.4, tile('aurora')), at(14.1, T.site), at(15.9, T.site), at(16.4, T.match),
    at(19.4, T.match), at(20.2, tab('story')), at(21.4, tab('story')), at(21.9, tab('landscape')),
    at(23.1, tab('landscape')), at(23.6, tab('all')), at(25.6, tab('all')), at(26.5, T.download)
  ];
  CLICKS = [4.55, 10.0, 10.9, 11.8, 12.7, 14.25, T_MATCH_CLICK, 20.35, 22.05, 23.75, T_DOWNLOAD];
}

function cursorAt(t) {
  const keys = CURSOR;
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    const [t0, x0, y0] = keys[i - 1];
    const [t1, x1, y1] = keys[i];
    if (t <= t1) {
      const k = E.inOut((t - t0) / (t1 - t0));
      // A slight arc reads as a hand moving rather than a robot.
      const arc = Math.sin(Math.PI * k) * Math.hypot(x1 - x0, y1 - y0) * 0.07;
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      return [lerp(x0, x1, k) + ((y1 - y0) / len) * arc, lerp(y0, y1, k) - ((x1 - x0) / len) * arc];
    }
  }
  return keys[keys.length - 1].slice(1);
}

// ---------- scene ----------
const L = {}; // canvases

async function setup() {
  const families = ['Inter', 'Plus Jakarta Sans', 'Poppins', 'Fraunces', 'Playfair Display'];
  await Promise.all([
    ...families.flatMap((f) => ['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 32px "${f}"`))),
    ...DISPLAY_LOADS.map((f) => document.fonts.load(f)),
    ...['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 32px "DM Sans"`)),
    document.fonts.load('italic 600 64px "Playfair Display"')
  ]);
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));

  // Tiles: default colours with matched colours stacked on top.
  $('tiles').innerHTML = TILES.map((d) => `<div class="tile" data-d="${d}"><div class="tw"><div class="thumb"></div></div><div class="name">${TEMPLATES[d].label}</div></div>`).join('');
  document.querySelectorAll('.tile').forEach((el) => {
    const d = el.dataset.d;
    el.querySelector('.thumb').append(drawCanvas(d, BRAND_DEFAULT, 240, 240), drawCanvas(d, BRAND_MATCHED, 240, 240));
    el.querySelectorAll('canvas')[1].style.opacity = 0;
  });

  // Main preview layers.
  const area = $('postArea');
  for (const [, d] of PICKS) L[d] = drawCanvas(d, BRAND_DEFAULT, 1080, 1080);
  L.matched = drawCanvas('aurora', BRAND_MATCHED, 1080, 1080);
  L.story = drawCanvas('aurora', BRAND_MATCHED, 1080, 1920);
  L.landscape = drawCanvas('aurora', BRAND_MATCHED, 1200, 627);
  L.allStory = drawCanvas('aurora', BRAND_MATCHED, 1080, 1920);
  L.allPost = drawCanvas('aurora', BRAND_MATCHED, 1080, 1080);
  L.allLand = drawCanvas('aurora', BRAND_MATCHED, 1200, 627);
  const AW = area.offsetWidth, AH = area.offsetHeight;
  const place = (c, w, h, cx = AW / 2, cy = AH / 2) => {
    css(c, { width: w + 'px', height: h + 'px', left: cx - w / 2 + 'px', top: cy - h / 2 + 'px' });
    area.append(c);
  };
  for (const [, d] of PICKS) place(L[d], 560, 560);
  place(L.matched, 560, 560);
  place(L.story, 349, 620);
  place(L.landscape, 900, 470);
  // All sizes, side by side.
  const sizes = [[L.allStory, 225, 400], [L.allPost, 300, 300], [L.allLand, 420, 219]];
  const gap = 28, total = sizes.reduce((s, [, w]) => s + w, 0) + gap * 2;
  let x = (AW - total) / 2;
  for (const [c, w, h] of sizes) { place(c, w, h, x + w / 2, AH / 2); x += w + gap; }

  $('storySlot').append(drawCanvas('aurora', BRAND_MATCHED, 1080, 1920));
  $('feedSlot').append(drawCanvas('aurora', BRAND_MATCHED, 1080, 1080));

  buildTimeline();
}

function captions(t) {
  document.querySelectorAll('.cap').forEach((el, i) => {
    const [a, b] = CAPS[i];
    const kin = p(t, a, a + 0.9, E.outQuint);
    const kout = p(t, b, b + 0.55, E.inOut);
    css(el, {
      opacity: kin * (1 - kout),
      transform: `translateY(${(1 - kin) * 26 - kout * 14}px)`,
      filter: `blur(${(1 - kin) * 10 + kout * 8}px)`
    });
  });
}

// Which item in a [[time, value]] list is current, and how far its entrance has got.
function stepAt(list, t) {
  let i = 0;
  while (i + 1 < list.length && t >= list[i + 1][0]) i++;
  return i;
}

function editor(t) {
  // Designs stack in pick order; each new one fades up over the last.
  PICKS.forEach(([t0, d], i) => {
    // The new design fades up from a soft blur as the old one fades out underneath.
    const kin = i === 0 ? p(t, 5.35, 6.2, E.outQuint) : p(t, t0 + 0.08, t0 + 0.6);
    const next = PICKS[i + 1];
    const kout = next ? p(t, next[0], next[0] + 0.32) : p(t, T_MATCHED + 0.1, T_MATCHED + 0.75);
    css(L[d], {
      opacity: kin * (1 - kout),
      zIndex: i + 1,
      filter: i && kin < 1 ? `blur(${(1 - kin) * 10}px)` : 'none',
      transform: i === 0 ? `translateY(${(1 - kin) * 22}px) scale(${lerp(0.97, 1, kin)})` : `scale(${lerp(0.985, 1, kin)})`
    });
  });

  // Matched colours, then sizes.
  const kMatch = p(t, T_MATCHED + 0.1, T_MATCHED + 0.75);
  const sizeIdx = stepAt(SIZES_AT, t);
  const sizeLayer = (on, off, el, z) => {
    const kin = on == null ? 1 : p(t, on + 0.1, on + 0.65);
    const kout = off == null ? 0 : p(t, off, off + 0.35);
    css(el, { opacity: kin * (1 - kout), zIndex: z, transform: `scale(${lerp(0.96, 1, kin) * lerp(1, 0.98, kout)})` });
  };
  sizeLayer(null, SIZES_AT[1][0], L.matched, 10);
  L.matched.style.opacity = kMatch * (1 - p(t, SIZES_AT[1][0], SIZES_AT[1][0] + 0.35));
  L.matched.style.transform = `scale(${lerp(0.985, 1, kMatch)})`;
  sizeLayer(SIZES_AT[1][0], SIZES_AT[2][0], L.story, 11);
  sizeLayer(SIZES_AT[2][0], SIZES_AT[3][0], L.landscape, 12);
  [L.allStory, L.allPost, L.allLand].forEach((c, i) => {
    const k = p(t, SIZES_AT[3][0] + 0.15 + i * 0.09, SIZES_AT[3][0] + 0.8 + i * 0.09, E.outQuint);
    css(c, { opacity: k, zIndex: 13, transform: `translateY(${(1 - k) * 18}px) scale(${lerp(0.96, 1, k)})` });
  });

  // Size tab pill slides between tabs.
  const btns = [...document.querySelectorAll('.sizes button')];
  const geo = btns.map((b) => [b.offsetLeft, b.offsetWidth]);
  let left = geo[0][0], width = geo[0][1];
  SIZES_AT.forEach(([t0], i) => {
    if (i === 0) return;
    const k = p(t, t0, t0 + 0.45);
    left = lerp(left, geo[i][0], k);
    width = lerp(width, geo[i][1], k);
  });
  css($('sizePill'), { left: left + 'px', width: width + 'px' });
  btns.forEach((b, i) => {
    const on = 1 - clamp(Math.abs(b.offsetLeft - left) / 60);
    b.style.color = on > 0.5 ? '#16170f' : '#8e8e96';
  });

  // Tiles: selection ring, then recolour after matching.
  const pick = stepAt(PICKS, t);
  document.querySelectorAll('.tile').forEach((el, i) => {
    const d = el.dataset.d;
    const idx = PICKS.findIndex(([, x]) => x === d);
    let k = 0;
    if (idx >= 0) {
      const tin = idx === 0 ? -1 : PICKS[idx][0];
      const tout = PICKS[idx + 1] ? PICKS[idx + 1][0] : 1e9;
      k = p(t, tin, tin + 0.3) * (1 - p(t, tout, tout + 0.3));
    }
    el.querySelector('.thumb').style.outlineColor = `rgba(238, 252, 166, ${k})`;
    el.querySelectorAll('canvas')[1].style.opacity = p(t, T_MATCHED + 0.2 + i * 0.06, T_MATCHED + 0.7 + i * 0.06);
    const press = bump(t, PICKS[idx]?.[0] ?? -9, 0.25);
    el.querySelector('.thumb').style.transform = `scale(${1 - press * 0.04})`;
  });
  void pick;

  // Website field, Match button, swatches.
  const focus = t > 14.25 && t < 16.6;
  const n = Math.round(lerp(0, SITE.length, p(t, T_TYPE[0], T_TYPE[1], (x) => x)));
  $('siteText').textContent = SITE.slice(0, n);
  $('sitePh').style.opacity = n ? 0 : 1;
  $('caret').style.opacity = focus && (t < T_TYPE[1] + 0.1 || Math.floor((t - T_TYPE[1]) * 2) % 2 === 0) ? 1 : 0;
  $('site').style.borderColor = focus ? '#eefca6' : '';
  const spinning = p(t, T_MATCH_CLICK + 0.05, T_MATCH_CLICK + 0.25) * (1 - p(t, T_MATCHED - 0.15, T_MATCHED));
  css($('spin'), { opacity: spinning, transform: `rotate(${t * 520}deg)` });
  const label = $('matchLabel');
  label.textContent = t > T_MATCHED ? '✓ Done' : 'Match';
  label.style.opacity = t > T_MATCHED ? p(t, T_MATCHED, T_MATCHED + 0.3) : 1 - spinning;
  label.style.color = t > T_MATCHED ? '#eefca6' : '';
  $('match').style.transform = `scale(${1 - bump(t, T_MATCH_CLICK, 0.25) * 0.05})`;
  const ks = p(t, T_MATCHED, T_MATCHED + 0.4);
  $('status0').style.opacity = 1 - ks;
  css($('status1'), { opacity: ks, transform: `translateY(${(1 - ks) * 6}px)` });
  ['primary', 'accent', 'text'].forEach((key, i) => {
    const k = p(t, T_MATCHED + i * 0.12, T_MATCHED + 0.5 + i * 0.12);
    $('sw' + i).style.background = mix(BRAND_DEFAULT[key], BRAND_MATCHED[key], k);
    $('sw' + i).style.transform = `scale(${1 + bump(t, T_MATCHED + i * 0.12, 0.5) * 0.12})`;
  });

  // Download.
  $('download').style.transform = `scale(${1 - bump(t, T_DOWNLOAD, 0.25) * 0.04})`;
  const kt = p(t, T_DOWNLOAD + 0.15, T_DOWNLOAD + 0.6, E.outQuint) * (1 - p(t, T_DOWNLOAD + 1.5, T_DOWNLOAD + 1.9));
  css($('toast'), { opacity: kt, transform: `translateX(-50%) translateY(${(1 - kt) * 14}px)` });
}

function reviewsPage(t) {
  const hover = p(t, 4.15, 4.4);
  const btn = $('mp1');
  btn.style.background = mix('#eefca6', '#16170f', hover);
  btn.style.color = mix('#16170f', '#eefca6', hover);
  btn.style.transform = `scale(${1 - bump(t, 4.55, 0.25) * 0.06})`;
}

function seek(t) {
  // Backdrop drifts slowly.
  css(document.querySelector('.g1'), { transform: `translate(${Math.sin(t * 0.18) * 80}px, ${Math.cos(t * 0.15) * 40}px)` });
  css(document.querySelector('.g2'), { transform: `translate(${Math.cos(t * 0.16) * -70}px, ${Math.sin(t * 0.2) * 40}px)` });

  captions(t);

  // Window in, then out to the phones.
  const kin = p(t, 0, 1.5, E.outQuint);
  const kout = p(t, T_PHONES, T_PHONES + 1.0);
  css($('intro'), {
    opacity: kin * (1 - kout),
    transform: `translateY(${(1 - kin) * 70 + kout * 40}px) scale(${lerp(0.96, 1, kin) * lerp(1, 0.92, kout)})`,
    filter: kout > 0 ? `blur(${kout * 14}px)` : 'none'
  });
  const [s, x, y] = track(t, CAM);
  $('cam').style.transform = `translate(${x}px, ${y}px) scale(${s})`;

  // Reviews page → editor.
  // Fade through rather than cross: the light page clears before the dark editor arrives.
  const ka = p(t, 4.75, 5.2);
  const kp = p(t, 5.05, 5.75);
  css($('pageA'), { opacity: 1 - ka, transform: `scale(${lerp(1, 0.985, ka)})`, filter: ka > 0 && ka < 1 ? `blur(${ka * 8}px)` : 'none' });
  css($('pageB'), { opacity: kp, transform: `scale(${lerp(1.015, 1, kp)})`, filter: kp > 0 && kp < 1 ? `blur(${(1 - kp) * 8}px)` : 'none' });
  const ktab = p(t, 4.65, 5.25);
  css($('tab2'), { width: ktab * 250 + 'px', padding: `0 ${ktab * 14}px`, opacity: ktab });
  $('tab1').style.background = kp < 0.5 ? '#2a2a2f' : 'transparent';
  $('tab2').style.background = kp >= 0.5 ? '#2a2a2f' : 'transparent';
  $('tab1').style.color = kp < 0.5 ? '#fff' : '';
  $('tab2').style.color = kp >= 0.5 ? '#fff' : '';

  reviewsPage(t);
  editor(t);

  // Cursor.
  const [cx, cy] = cursorAt(t);
  const vis = p(t, 2.9, 3.3) * (1 - p(t, T_PHONES - 0.6, T_PHONES - 0.1));
  const press = Math.max(0, ...CLICKS.map((c) => bump(t, c, 0.2)));
  css($('cursor'), { opacity: vis, transform: `translate(${cx}px, ${cy}px)` });
  $('arrow').style.transform = `scale(${1 - press * 0.16})`;
  const last = CLICKS.filter((c) => t >= c).pop();
  const kr = last == null ? 1 : clamp((t - last) / 0.55);
  css($('ring'), { opacity: (1 - E.out(kr)) * 0.9, transform: `scale(${lerp(0.2, 1.1, E.out(kr))})` });

  // Phones.
  const phones = [$('phoneStory'), $('phoneFeed')];
  phones.forEach((ph, i) => {
    const k = p(t, T_PHONES + 0.35 + i * 0.18, T_PHONES + 1.6 + i * 0.18, E.outQuint);
    const ko = p(t, T_END, T_END + 0.6);
    const float = Math.sin(t * 1.1 + i * 1.7) * 6;
    css(ph, {
      opacity: k * (1 - ko),
      transform: `translateY(${(1 - k) * 90 + float - ko * 20 + (i ? 26 : 0)}px) rotate(${(i ? 1 : -1) * lerp(4, 1.5, k)}deg) scale(${lerp(0.94, 1, k) * lerp(1, 0.97, ko)})`,
      filter: ko > 0 ? `blur(${ko * 10}px)` : 'none'
    });
  });
  $('storyBar').style.width = p(t, T_PHONES + 1, T_END, (x) => x) * 100 + '%';
  $('likes').textContent = Math.round(lerp(212, 247, p(t, T_PHONES + 1.6, T_PHONES + 4.2)));
  $('heart').style.fill = t > T_PHONES + 2.4 ? '#ed4956' : 'none';
  $('heart').style.stroke = t > T_PHONES + 2.4 ? '#ed4956' : '';
  $('heart').parentNode.style.transform = `scale(${1 + bump(t, T_PHONES + 2.4, 0.35) * 0.25})`;

  // End card.
  ['endBadge', 'endLogo', 'endLine', 'endPill'].forEach((id, i) => {
    const k = p(t, T_END + 0.5 + i * 0.16, T_END + 1.6 + i * 0.16, E.outQuint);
    css($(id), { opacity: k, transform: `translateY(${(1 - k) * 22}px) scale(${lerp(0.97, 1, k)})`, filter: `blur(${(1 - k) * 8}px)` });
  });

  return new Promise((r) => requestAnimationFrame(() => r()));
}

window.seek = seek;
window.DURATION = DURATION;

setup().then(() => {
  const q = new URLSearchParams(location.search);
  if (q.has('t')) seek(Number(q.get('t')));
  else if (!q.has('capture')) {
    const t0 = performance.now();
    const loop = () => { seek(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
    loop();
  } else seek(0);
  window.ready = true;
});
