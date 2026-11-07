// Canvas templates. Each draw(ctx, W, H, d) paints a full post.
// d = {
//   text, headline, subtext, name, initials, rating, source, sourceLabel, handle,
//   brand: { businessName, primary, accent, text, font },
//   style: { stars: 'rounded'|'sharp', corners: 'rounded'|'square' },
//   logo: Image|null (Pro only), bg: Image|null
// }
// Sizes are based on u = min(W, H), so every template works at any resolution and aspect.

const APP_NAME = 'ReviewPost';

// Google Fonts, loaded in editor.html. `name` is what document.fonts.load() needs.
const FONTS = {
  inter: { label: 'Inter', name: 'Inter', family: '"Inter", system-ui, sans-serif' },
  jakarta: { label: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", system-ui, sans-serif' },
  grotesk: { label: 'Space Grotesk', name: 'Space Grotesk', family: '"Space Grotesk", system-ui, sans-serif' },
  poppins: { label: 'Poppins', name: 'Poppins', family: '"Poppins", system-ui, sans-serif' },
  playfair: { label: 'Playfair Display', name: 'Playfair Display', family: '"Playfair Display", Georgia, serif' },
  fraunces: { label: 'Fraunces', name: 'Fraunces', family: '"Fraunces", Georgia, serif' }
};

// Display faces that give the Pro designs their character, whatever the brand font is.
const DISPLAY = {
  heavy: '"Archivo Black", "Arial Black", sans-serif',
  condensed: '"Oswald", "Arial Narrow", sans-serif',
  script: '"Allura", cursive',
  caps: '"Cinzel", Georgia, serif',
  book: '"Cormorant Garamond", Georgia, serif',
  didone: '"Bodoni Moda", Georgia, serif'
};
const DISPLAY_LOADS = [
  '400 32px "Archivo Black"', '500 32px "Oswald"', '400 32px "Allura"', '500 32px "Cinzel"', '600 32px "Cinzel"',
  '500 32px "Cormorant Garamond"', '600 32px "Cormorant Garamond"', 'italic 500 32px "Cormorant Garamond"', '500 32px "Bodoni Moda"'
];

const SIZES = {
  post: { w: 1080, h: 1080, label: 'Instagram post (1080×1080)' },
  story: { w: 1080, h: 1920, label: 'Story / Reel (1080×1920)' },
  landscape: { w: 1200, h: 627, label: 'LinkedIn / Facebook (1200×627)' }
};

const fam = (d) => (FONTS[d.brand.font] || FONTS.inter).family;
const radius = (d, u, k = 0.045) => (d.style.corners === 'rounded' ? u * k : 0);
const pillRadius = (d, h) => (d.style.corners === 'rounded' ? h / 2 : 0);

/* ---------- colour ---------- */

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const readableOn = (hex) => (luminance(hex) > 0.45 ? '#111113' : '#ffffff');

/* ---------- text ---------- */

function wrapText(ctx, text, maxW) {
  const lines = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function setFont(ctx, size, weight, family, tracking = 0, italic = false) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
  ctx.letterSpacing = `${(size * tracking).toFixed(2)}px`;
}

// Largest font size whose wrapped text fits the box; truncates with an ellipsis at the minimum size.
function fitText(ctx, text, maxW, maxH, { max, min, family, weight = '600', lh = 1.3, tracking = -0.01, italic = false }) {
  const result = (size, lines) => ({ size, lines, lh, weight, family, tracking, italic });
  for (let size = Math.round(max); size >= min; size -= 2) {
    setFont(ctx, size, weight, family, tracking, italic);
    const lines = wrapText(ctx, text, maxW);
    // Also check width: a single long word can't wrap and would otherwise overflow.
    if (lines.length * size * lh <= maxH && lines.every((l) => ctx.measureText(l).width <= maxW)) return result(size, lines);
  }
  const size = Math.round(min);
  setFont(ctx, size, weight, family, tracking, italic);
  let lines = wrapText(ctx, text, maxW);
  const maxLines = Math.max(1, Math.floor(maxH / (size * lh)));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = last.trimEnd() + '…';
  }
  return result(size, lines);
}

function drawLines(ctx, fit, x, y, align, color) {
  setFont(ctx, fit.size, fit.weight, fit.family, fit.tracking, fit.italic);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  fit.lines.forEach((l, i) => ctx.fillText(l, x, y + i * fit.size * fit.lh));
  ctx.letterSpacing = '0px';
}

const blockHeight = (fit) => fit.lines.length * fit.size * fit.lh;

function drawText(ctx, str, x, y, { size, weight = '500', family, color, align = 'left', baseline = 'top', tracking = 0, italic = false }) {
  setFont(ctx, size, weight, family, tracking, italic);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
  ctx.letterSpacing = '0px';
}

function measure(ctx, str, size, weight, family, tracking = 0) {
  setFont(ctx, size, weight, family, tracking);
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return w;
}

/* ---------- shapes ---------- */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function starPath(ctx, cx, cy, r, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * inner : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
}

const starsWidth = (size) => size * 5 + size * 0.16 * 4;

// x is the left edge, centre or right edge depending on align; y is the top.
function drawStars(ctx, x, y, size, rating, color, align, style, { outline = false } = {}) {
  const gap = size * 0.16;
  let left = align === 'center' ? x - starsWidth(size) / 2 : align === 'right' ? x - starsWidth(size) : x;
  const rounded = style.stars === 'rounded';
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = rounded ? 'round' : 'miter';
  for (let i = 0; i < 5; i++) {
    const filled = i < rating;
    const cx = left + size / 2, cy = y + size * 0.54;
    if (outline) {
      ctx.globalAlpha = filled ? 1 : 0.4;
      ctx.lineWidth = size * 0.065;
      starPath(ctx, cx, cy, size * 0.46, rounded ? 0.5 : 0.42);
      ctx.stroke();
    } else {
      ctx.globalAlpha = filled ? 1 : 0.28;
      ctx.lineWidth = size * 0.13;
      if (rounded) {
        starPath(ctx, cx, cy, size * 0.43, 0.5);
        ctx.fill();
        ctx.stroke();
      } else {
        starPath(ctx, cx, cy, size * 0.5, 0.4);
        ctx.fill();
      }
    }
    left += size + gap;
  }
  ctx.restore();
}

function drawAvatar(ctx, x, y, s, d, bg, fg, { shape } = {}) {
  ctx.fillStyle = bg;
  if ((shape || (d.style.corners === 'rounded' ? 'circle' : 'square')) === 'circle') {
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2);
  } else {
    roundRect(ctx, x, y, s, s, shape === 'soft' ? s * 0.22 : 0);
  }
  ctx.fill();
  drawText(ctx, d.initials, x + s / 2, y + s / 2 + s * 0.02, {
    size: s * 0.38, weight: '700', family: fam(d), color: fg, align: 'center', baseline: 'middle'
  });
}

// Avatar with name and source stacked beside it. x is the left edge, or the centre when align is 'center'.
function drawPerson(ctx, x, y, s, d, { align = 'left', nameColor, subColor, avatarBg, avatarFg, nameWeight = '700' }) {
  const f = fam(d);
  const nameSize = s * 0.34, subSize = s * 0.27;
  const hasName = !!d.name;
  const textW = Math.max(
    hasName ? measure(ctx, d.name, nameSize, nameWeight, f) : 0,
    d.sourceLabel ? measure(ctx, d.sourceLabel, subSize, '500', f) : 0
  );
  const gap = hasName ? s * 0.28 : 0;
  const avatarW = hasName ? s : 0;
  const total = avatarW + gap + textW;
  const left = align === 'center' ? x - total / 2 : x;
  if (hasName) drawAvatar(ctx, left, y, s, d, avatarBg, avatarFg);
  const tx = left + avatarW + gap;
  if (hasName && d.sourceLabel) {
    drawText(ctx, d.name, tx, y + s * 0.46, { size: nameSize, weight: nameWeight, family: f, color: nameColor, baseline: 'bottom' });
    drawText(ctx, d.sourceLabel, tx, y + s * 0.56, { size: subSize, weight: '500', family: f, color: subColor });
  } else if (hasName || d.sourceLabel) {
    drawText(ctx, d.name || d.sourceLabel, tx, y + s / 2, {
      size: hasName ? nameSize : subSize, weight: hasName ? nameWeight : '500', family: f,
      color: hasName ? nameColor : subColor, baseline: 'middle'
    });
  }
}

// Logo plus business name on one row. x is the left edge, centre or right edge depending on align.
function drawBrandRow(ctx, x, y, h, d, color, align, { family, weight = '700', upper = false } = {}) {
  const name = upper ? d.brand.businessName.toUpperCase() : d.brand.businessName;
  if (!d.logo && !name) return;
  const f = family || fam(d);
  const logoW = d.logo ? (d.logo.width / d.logo.height) * h : 0;
  const nameSize = h * 0.46;
  const gap = d.logo && name ? h * 0.3 : 0;
  const nameW = name ? measure(ctx, name, nameSize, weight, f) : 0;
  const total = logoW + gap + nameW;
  let left = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  if (d.logo) {
    ctx.drawImage(d.logo, left, y, logoW, h);
    left += logoW + gap;
  }
  if (name) drawText(ctx, name, left, y + h / 2, { size: nameSize, weight, family: f, color, baseline: 'middle' });
}

function drawArrow(ctx, x1, y, x2, color, lw) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo((x1 + x2) / 2, y - lw * 1.2, x2, y);
  ctx.moveTo(x2 - lw * 4, y - lw * 3);
  ctx.lineTo(x2, y);
  ctx.lineTo(x2 - lw * 4, y + lw * 3);
  ctx.stroke();
  ctx.restore();
}

function drawSparkle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r * 0.62, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r * 0.62, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}

// Small uppercase labels in the four corners, editorial-style.
function cornerLabels(ctx, W, H, p, size, color, family, { tl, tr, bl, br }) {
  const opts = { size, weight: '500', family, color, tracking: 0.06 };
  if (tl) drawText(ctx, tl.toUpperCase(), p, p, opts);
  if (tr) drawText(ctx, tr.toUpperCase(), W - p, p, { ...opts, align: 'right' });
  if (bl) drawText(ctx, bl.toUpperCase(), p, H - p, { ...opts, baseline: 'bottom' });
  if (br) drawText(ctx, br.toUpperCase(), W - p, H - p, { ...opts, align: 'right', baseline: 'bottom' });
}

/* ---------- backgrounds & glass ---------- */

function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s, ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function blob(ctx, x, y, r, color, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Soft blurred colour blobs built from the brand colours.
function paintMesh(ctx, W, H, d) {
  const u = Math.min(W, H);
  const { primary, accent } = d.brand;
  ctx.fillStyle = mix(primary, '#000000', 0.55);
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = `blur(${Math.round(u * 0.12)}px)`;
  blob(ctx, W * 0.12, H * 0.18, u * 0.48, accent, 0.85);
  blob(ctx, W * 0.92, H * 0.3, u * 0.55, mix(primary, '#ffffff', 0.2), 1);
  blob(ctx, W * 0.45, H * 1.0, u * 0.62, mix(accent, primary, 0.5), 0.9);
  blob(ctx, W * 0.75, H * 0.75, u * 0.3, accent, 0.45);
  ctx.restore();
  // Keeps white text readable when the accent is pale.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(0, 0, W, H);
}

function paintBackdrop(ctx, W, H, d, { blur = 0 } = {}) {
  if (!d.bg) return paintMesh(ctx, W, H, d);
  ctx.save();
  if (blur) {
    ctx.filter = `blur(${Math.round(blur)}px)`;
    // Overscan so blurred edges don't fade to transparent.
    drawCover(ctx, d.bg, -blur * 2, -blur * 2, W + blur * 4, H + blur * 4);
  } else {
    drawCover(ctx, d.bg, 0, 0, W, H);
  }
  ctx.restore();
}

let grainTile;
function paintGrain(ctx, W, H, alpha) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = grainTile.height = 160;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function makeLayer(W, H, paint) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  paint(c.getContext('2d'));
  return c;
}

// Story/Reel (9:16): Instagram and Facebook cover roughly the top 14% and bottom 35% with the profile,
// caption and buttons, and about 6% at each side. Backgrounds still bleed to the edges; content stays inside.
function safeInsets(W, H) {
  if (H / W < 1.6) return { top: 0, bottom: 0, side: 0 };
  return { top: Math.round(H * 0.14), bottom: Math.round(H * 0.35), side: Math.round(W * 0.06) };
}

// Templates call this once the full-bleed background is painted. It moves the origin to the top of the
// safe zone and returns the height to lay content out in (the full height for posts and landscape).
// TEMPLATES' draw() wrapper restores the transform afterwards.
function contentArea(ctx, W, H) {
  const s = safeInsets(W, H);
  if (!s.top && !s.bottom) return H;
  ctx.translate(0, s.top);
  return H - s.top - s.bottom;
}

// Frosted glass panel: a blurred copy of `layer` clipped to the shape, tinted, with a hairline edge.
function glass(ctx, layer, x, y, w, h, r, u, { shadow = true, blur = 0.035, tint = 'dark' } = {}) {
  if (shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = u * 0.06;
    ctx.shadowOffsetY = u * 0.02;
    ctx.fillStyle = '#000';
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.filter = `blur(${Math.round(u * blur)}px)`;
  const m = ctx.getTransform();
  ctx.drawImage(layer, -m.e, -m.f);
  ctx.filter = 'none';
  ctx.fillStyle = tint === 'dark' ? 'rgba(16,16,22,0.22)' : 'rgba(16,16,22,0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tint === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)';
  ctx.fillRect(x, y, w, h);
  const sheen = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.20)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.lineWidth = Math.max(1, u * 0.0025);
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.stroke();
  ctx.restore();
}

/* ---------- templates ---------- */

const TEMPLATES = {
  spotlight: {
    label: 'Spotlight',
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.085, f = fam(d);
      const { primary, accent, text } = d.brand;
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W / 2, -u * 0.1, 0, W / 2, -u * 0.1, Math.max(W, H) * 0.9);
      glow.addColorStop(0, rgba(accent, 0.28));
      glow.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      H = contentArea(ctx, W, H);

      const star = u * 0.055;
      drawStars(ctx, W / 2, p, star, d.rating, accent, 'center', d.style);

      const footH = u * 0.06, footY = H - p - footH;
      const personS = u * 0.08, personY = footY - p * 0.6 - personS;
      const top = p + star + p * 0.7, bottom = personY - p * 0.55;

      drawText(ctx, '“', W / 2, top - u * 0.06, {
        size: u * 0.42, weight: '700', family: FONTS.playfair.family, color: rgba(accent, 0.14), align: 'center'
      });
      const fit = fitText(ctx, d.text, W - p * 2, bottom - top, { max: u * 0.072, min: u * 0.03, family: f, weight: '600', lh: 1.28, tracking: -0.015 });
      drawLines(ctx, fit, W / 2, top + (bottom - top - blockHeight(fit)) / 2, 'center', text);

      drawPerson(ctx, W / 2, personY, personS, d, {
        align: 'center', nameColor: text, subColor: rgba(text, 0.65), avatarBg: accent, avatarFg: readableOn(accent)
      });
      drawBrandRow(ctx, W / 2, footY, footH, d, text, 'center');
    }
  },

  card: {
    label: 'Card',
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.07, f = fam(d);
      const { primary, accent } = d.brand;
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, primary);
      bg.addColorStop(1, mix(primary, '#000000', 0.3));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      H = contentArea(ctx, W, H);

      const cx = p, cy = p, cw = W - p * 2, ch = H - p * 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = u * 0.05;
      ctx.shadowOffsetY = u * 0.015;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, cx, cy, cw, ch, radius(d, u, 0.05));
      ctx.fill();
      ctx.restore();

      const ip = u * 0.065;
      const personS = u * 0.085;
      // Avatar uses the darker of the two brand colours so initials stay legible on white.
      const avatarBg = luminance(primary) < luminance(accent) ? primary : accent;
      drawPerson(ctx, cx + ip, cy + ip, personS, d, {
        nameColor: '#18181b', subColor: '#71717a', avatarBg, avatarFg: readableOn(avatarBg)
      });
      const star = u * 0.042;
      const starColor = luminance(accent) > 0.6 ? primary : accent;
      drawStars(ctx, cx + cw - ip, cy + ip + (personS - star) / 2, star, d.rating, starColor, 'right', d.style);

      ctx.fillStyle = '#ececf0';
      ctx.fillRect(cx + ip, cy + ip + personS + ip * 0.55, cw - ip * 2, Math.max(1, u * 0.002));

      const footH = u * 0.055, footY = cy + ch - ip - footH;
      const top = cy + ip + personS + ip * 1.1, bottom = footY - ip * 0.6;
      const fit = fitText(ctx, `“${d.text}”`, cw - ip * 2, bottom - top, { max: u * 0.064, min: u * 0.028, family: f, weight: '500', lh: 1.36, tracking: -0.01 });
      drawLines(ctx, fit, cx + ip, top + (bottom - top - blockHeight(fit)) / 2, 'left', '#18181b');

      drawBrandRow(ctx, cx + ip, footY, footH, d, '#18181b', 'left');
    }
  },

  bold: {
    label: 'Bold',
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.09, f = fam(d);
      const { primary, accent, text } = d.brand;
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      H = contentArea(ctx, W, H);

      const star = u * 0.068;
      drawStars(ctx, p, p, star, d.rating, accent, 'left', d.style);

      const footH = u * 0.06, footY = H - p - footH;
      const chipH = u * 0.07, chipY = footY - p * 0.6 - chipH;
      const top = p + star + p * 0.6, bottom = chipY - p * 0.55;

      const barW = u * 0.018;
      const textX = p + barW + u * 0.045;
      const fit = fitText(ctx, d.text, W - textX - p, bottom - top, { max: u * 0.095, min: u * 0.032, family: f, weight: '800', lh: 1.12, tracking: -0.03 });
      const textY = top + (bottom - top - blockHeight(fit)) / 2;
      ctx.fillStyle = accent;
      roundRect(ctx, p, textY, barW, blockHeight(fit), pillRadius(d, barW));
      ctx.fill();
      drawLines(ctx, fit, textX, textY, 'left', text);

      const chipText = [d.name, d.sourceLabel].filter(Boolean).join('  ·  ');
      if (chipText) {
        const chipSize = chipH * 0.4;
        const chipW = measure(ctx, chipText, chipSize, '700', f) + chipH * 0.9;
        ctx.fillStyle = accent;
        roundRect(ctx, textX, chipY, chipW, chipH, pillRadius(d, chipH));
        ctx.fill();
        drawText(ctx, chipText, textX + chipH * 0.45, chipY + chipH / 2, {
          size: chipSize, weight: '700', family: f, color: readableOn(accent), baseline: 'middle'
        });
      }
      drawBrandRow(ctx, textX, footY, footH, d, text, 'left');
    }
  },

  // Big uppercase headline over a photo, small labels in the corners.
  editorial: {
    label: 'Editorial',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.065, f = fam(d);
      const { accent } = d.brand;
      paintBackdrop(ctx, W, H, d);
      const shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, 'rgba(0,0,0,0.38)');
      shade.addColorStop(0.5, 'rgba(0,0,0,0.22)');
      shade.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.12);
      H = contentArea(ctx, W, H);

      const lab = u * 0.024;
      cornerLabels(ctx, W, H, p, lab, 'rgba(255,255,255,0.88)', f, {
        tl: d.brand.businessName, tr: 'Customer review', bl: d.sourceLabel, br: d.handle
      });

      const regionTop = p + lab + p, regionBottom = H - p - lab - p;
      const star = u * 0.05, kicker = u * 0.042, subSize = u * 0.036;
      const sub = d.subtext
        ? fitText(ctx, d.subtext, W * 0.72, subSize * 1.3 * 2 + 1, { max: subSize, min: subSize, family: f, weight: '500', lh: 1.3 })
        : null;
      const subH = sub ? blockHeight(sub) + u * 0.035 : 0;
      const fixed = star + u * 0.035 + kicker + u * 0.03 + subH;
      const head = fitText(ctx, d.headline.toUpperCase(), W - p * 2, regionBottom - regionTop - fixed, {
        max: u * 0.15, min: u * 0.05, family: DISPLAY.heavy, weight: '400', lh: 0.98, tracking: -0.02
      });
      let y = regionTop + (regionBottom - regionTop - fixed - blockHeight(head)) / 2;

      drawStars(ctx, W / 2, y, star, d.rating, accent, 'center', d.style);
      y += star + u * 0.035;
      drawText(ctx, (d.name ? `${d.name} says` : 'Our customers say').toUpperCase(), W / 2, y, {
        size: kicker, weight: '500', family: DISPLAY.condensed, color: '#ffffff', align: 'center', tracking: 0.04
      });
      y += kicker + u * 0.03;
      drawLines(ctx, head, W / 2, y, 'center', '#ffffff');
      y += blockHeight(head) + u * 0.035;
      if (sub) drawLines(ctx, sub, W / 2, y, 'center', 'rgba(255,255,255,0.92)');
    }
  },

  // Flat accent colour with oversized type that fills the width.
  poster: {
    label: 'Poster',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.065, f = fam(d);
      const { accent } = d.brand;
      const ink = readableOn(accent);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.08);
      H = contentArea(ctx, W, H);

      const lab = u * 0.024;
      cornerLabels(ctx, W, H, p, lab, ink, f, { tl: d.brand.businessName, tr: 'Customer review', br: d.handle });
      const star = u * 0.034;
      drawStars(ctx, p, H - p - star * 0.95, star, d.rating, ink, 'left', d.style);
      if (d.sourceLabel) {
        drawText(ctx, d.sourceLabel.toUpperCase(), p + starsWidth(star) + u * 0.02, H - p, {
          size: lab, weight: '500', family: f, color: ink, baseline: 'bottom', tracking: 0.06
        });
      }

      // Balance the headline words over 1–4 lines, then size each line to fill the width.
      const words = d.headline.toUpperCase().split(/\s+/).filter(Boolean);
      const n = words.length <= 2 ? words.length : Math.min(4, Math.ceil(words.length / 2));
      const lines = [];
      for (let i = 0; i < n; i++) lines.push(words.slice(Math.round((i * words.length) / n), Math.round(((i + 1) * words.length) / n)).join(' '));
      const maxW = W - p * 2;
      let sizes = lines.map((l) => Math.min(u * 0.34, (maxW / measure(ctx, l, 100, '400', DISPLAY.heavy, -0.03)) * 100));

      const midSize = u * 0.032;
      const excerpt = fitText(ctx, `${d.text}${d.name ? `\n— ${d.name}` : ''}`, W * 0.4, midSize * 1.25 * 5 + 1, { max: midSize, min: midSize, family: f, weight: '600', lh: 1.25 });
      const midH = blockHeight(excerpt) + u * 0.07;
      const step = 0.86;
      const avail = H - 2 * (p + lab + p * 0.9);
      const typeH = sizes.reduce((a, s) => a + s * step, 0);
      if (typeH + midH > avail) sizes = sizes.map((s) => (s * (avail - midH)) / typeH);
      const total = sizes.reduce((a, s) => a + s * step, 0) + midH;

      let y = (H - total) / 2;
      const midAfter = Math.ceil(lines.length / 2) - 1;
      lines.forEach((l, i) => {
        drawText(ctx, l, p - sizes[i] * 0.04, y + sizes[i] * 0.74, {
          size: sizes[i], weight: '400', family: DISPLAY.heavy, color: ink, baseline: 'alphabetic', tracking: -0.03
        });
        y += sizes[i] * step;
        if (i === midAfter) {
          const ex = W * 0.2;
          drawLines(ctx, excerpt, ex, y + u * 0.035, 'left', ink);
          const ay = y + u * 0.035 + blockHeight(excerpt) / 2;
          drawArrow(ctx, ex + W * 0.42 + u * 0.03, ay, Math.min(W - p, ex + W * 0.42 + u * 0.2), ink, u * 0.006);
          y += midH;
        }
      });
    }
  },

  // A large frosted card that picks up the colours of the photo behind it.
  glass: {
    label: 'Glass',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.07, f = fam(d);
      const { accent } = d.brand;
      const layer = makeLayer(W, H, (c) => paintBackdrop(c, W, H, d));
      ctx.drawImage(layer, 0, 0);
      H = contentArea(ctx, W, H);

      const footH = u * 0.06, footY = H - p - footH;
      drawBrandRow(ctx, p, footY, footH, d, '#ffffff', 'left', { weight: '800' });
      if (d.handle) {
        drawText(ctx, d.handle, W - p, footY + footH / 2, { size: u * 0.026, weight: '500', family: f, color: '#ffffff', align: 'right', baseline: 'middle' });
      }

      const mx = Math.max(p * 1.3, W * 0.12);
      const cw = W - mx * 2;
      const availTop = p * 1.6, availBottom = footY - p * 1.1;
      const ch = Math.min(availBottom - availTop, cw * 1.25);
      const cx = mx, cy = availTop + (availBottom - availTop - ch) / 2;
      glass(ctx, layer, cx, cy, cw, ch, radius(d, u, 0.07), u, { blur: 0.06, tint: 'light' });

      const ip = u * 0.075;
      const personS = u * 0.075, personY = cy + ch - ip - personS;
      const top = cy + ip * 1.1, bottom = personY - ip * 0.7;
      const fit = fitText(ctx, d.text, cw - ip * 2, bottom - top, { max: u * 0.064, min: u * 0.028, family: f, weight: '500', lh: 1.22, tracking: -0.015 });
      drawLines(ctx, fit, cx + ip, top + (bottom - top - blockHeight(fit)) / 2, 'left', '#ffffff');

      ctx.save();
      ctx.globalAlpha = 0.85;
      drawPerson(ctx, cx + ip, personY, personS, d, {
        nameColor: '#ffffff', subColor: 'rgba(255,255,255,0.75)', avatarBg: 'rgba(255,255,255,0.22)', avatarFg: '#ffffff', nameWeight: '500'
      });
      ctx.restore();
      const star = u * 0.036;
      drawStars(ctx, cx + cw - ip, personY + (personS - star) / 2, star, d.rating, accent, 'right', d.style);
    }
  },

  // Soft neutral backdrop, serif + script title, white card with an overlapping avatar.
  testimonial: {
    label: 'Testimonial',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.075, f = fam(d);
      const { primary, accent } = d.brand;
      const ink = luminance(primary) < 0.2 ? primary : mix(primary, '#000000', 0.6);
      const soft = mix(ink, '#ffffff', 0.32);

      if (d.bg) {
        paintBackdrop(ctx, W, H, d, { blur: u * 0.035 });
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = mix(primary, '#ffffff', 0.86);
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.filter = `blur(${Math.round(u * 0.14)}px)`;
        blob(ctx, W * 0.15, H * 0.62, u * 0.35, mix(primary, '#ffffff', 0.65), 0.7);
        blob(ctx, W * 0.9, H * 0.3, u * 0.3, mix(accent, '#ffffff', 0.4), 0.6);
        blob(ctx, W * 0.7, H * 0.95, u * 0.3, mix(primary, '#ffffff', 0.7), 0.5);
        ctx.restore();
      }
      paintGrain(ctx, W, H, 0.1);
      H = contentArea(ctx, W, H);

      // Title: CUSTOMER in a didone, "Review" in script overlapping beneath.
      const titleSize = Math.min(u * 0.12, (W * 0.74 / measure(ctx, 'CUSTOMER', 100, '500', DISPLAY.didone, 0.02)) * 100);
      const titleY = p * 0.9;
      drawText(ctx, 'CUSTOMER', W / 2, titleY, { size: titleSize, weight: '500', family: DISPLAY.didone, color: ink, align: 'center', tracking: 0.02 });
      const scriptSize = titleSize * 1.15;
      drawText(ctx, 'Review', W / 2, titleY + titleSize * 0.62, { size: scriptSize, weight: '400', family: DISPLAY.script, color: ink, align: 'center' });
      const titleBottom = titleY + titleSize * 0.62 + scriptSize * 1.05;

      const handleSize = u * 0.026;
      const handleText = (d.handle || d.brand.businessName || '').toUpperCase();
      const regionTop = titleBottom + u * 0.02, regionBottom = H - p - (handleText ? handleSize + p * 0.6 : 0);

      const avatarS = u * 0.15;
      const cw = Math.min(W - p * 2.4, u * 0.78);
      const ip = u * 0.055;
      const nameSize = u * 0.045, star = u * 0.038;
      const chrome = avatarS * 0.55 + ip * 0.6 + ip * 0.5 + nameSize * 1.25 + ip * 0.3 + star + ip;
      const maxCard = regionBottom - regionTop - avatarS / 2;
      const fit = fitText(ctx, d.text, cw - ip * 2, Math.min(maxCard - chrome, u * 0.55), { max: u * 0.036, min: u * 0.022, family: f, weight: '500', lh: 1.45, tracking: 0 });
      const ch = chrome + blockHeight(fit);
      const cx = (W - cw) / 2;
      const cy = regionTop + avatarS / 2 + (maxCard - ch) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = u * 0.04;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, cx, cy, cw, ch, radius(d, u, 0.045));
      ctx.fill();
      ctx.restore();

      const ax = W / 2 - avatarS / 2, ay = cy - avatarS / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (d.style.corners === 'rounded') ctx.arc(W / 2, cy, avatarS / 2 + u * 0.01, 0, Math.PI * 2);
      else ctx.rect(ax - u * 0.01, ay - u * 0.01, avatarS + u * 0.02, avatarS + u * 0.02);
      ctx.fill();
      if (d.initials) drawAvatar(ctx, ax, ay, avatarS, d, mix(primary, '#ffffff', 0.55), ink);
      else drawAvatar(ctx, ax, ay, avatarS, { ...d, initials: '★' }, mix(primary, '#ffffff', 0.55), ink);

      let y = cy + avatarS * 0.55 + ip * 0.6;
      drawLines(ctx, fit, W / 2, y, 'center', soft);
      y += blockHeight(fit) + ip * 0.5;
      drawText(ctx, d.name || 'Happy customer', W / 2, y, { size: nameSize, weight: '500', family: DISPLAY.didone, color: ink, align: 'center' });
      y += nameSize * 1.25 + ip * 0.3;
      drawStars(ctx, W / 2, y, star, d.rating, ink, 'center', d.style);

      if (handleText) {
        drawText(ctx, handleText, W / 2, H - p, { size: handleSize, weight: '500', family: f, color: ink, align: 'center', baseline: 'bottom', tracking: 0.28 });
      }
    }
  },

  // Blurred warm photo, small caps and serif type, outline stars.
  luxe: {
    label: 'Luxe',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.08, f = fam(d);
      paintBackdrop(ctx, W, H, d, { blur: u * 0.014 });
      ctx.fillStyle = 'rgba(28,18,8,0.42)';
      ctx.fillRect(0, 0, W, H);
      const vig = ctx.createRadialGradient(W / 2, H / 2, u * 0.2, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.1);
      H = contentArea(ctx, W, H);

      const cream = '#fbf3e6';
      const small = u * 0.026;
      const pillH = d.handle ? u * 0.06 : 0;
      const footH = (d.sourceLabel ? small * 1.4 : 0) + (pillH ? pillH + u * 0.02 : 0);
      const regionTop = p, regionBottom = H - p - footH - p * 0.6;

      const sparkR = u * 0.026, labSize = u * 0.026, star = u * 0.05;
      const title = fitText(ctx, (d.brand.businessName || 'Kind words').toUpperCase(), W - p * 3, u * 0.24, {
        max: u * 0.1, min: u * 0.05, family: DISPLAY.caps, weight: '600', lh: 1.02, tracking: 0.01
      });
      const fixed = sparkR * 2 + u * 0.03 + labSize + u * 0.025 + blockHeight(title) + u * 0.05 + star + u * 0.05 + u * 0.05 + u * 0.04;
      const quote = fitText(ctx, `“${d.text}”`, W - p * 2.6, regionBottom - regionTop - fixed, {
        max: u * 0.048, min: u * 0.026, family: DISPLAY.book, weight: '500', lh: 1.3, tracking: 0
      });
      let y = regionTop + (regionBottom - regionTop - fixed - blockHeight(quote)) / 2;

      drawSparkle(ctx, W / 2, y + sparkR, sparkR, cream);
      y += sparkR * 2 + u * 0.03;
      drawText(ctx, 'CUSTOMER REVIEW', W / 2, y, { size: labSize, weight: '500', family: DISPLAY.caps, color: cream, align: 'center', tracking: 0.14 });
      y += labSize + u * 0.025;
      drawLines(ctx, title, W / 2, y, 'center', cream);
      y += blockHeight(title) + u * 0.05;
      drawStars(ctx, W / 2, y, star, d.rating, cream, 'center', d.style, { outline: true });
      y += star + u * 0.05;
      drawLines(ctx, quote, W / 2, y, 'center', cream);
      y += blockHeight(quote) + u * 0.03;
      if (d.name) drawText(ctx, `— ${d.name}`, W / 2, y, { size: u * 0.034, weight: '500', family: DISPLAY.book, color: cream, align: 'center', italic: true });

      let fy = H - p - footH;
      if (d.sourceLabel) {
        drawText(ctx, `Read more on ${d.source}`, W / 2, fy, { size: small, weight: '500', family: f, color: cream, align: 'center' });
        fy += small * 1.4 + u * 0.02;
      }
      if (pillH) {
        const pw = measure(ctx, d.handle, small, '500', f) + pillH * 1.2;
        ctx.save();
        ctx.strokeStyle = cream;
        ctx.lineWidth = Math.max(1, u * 0.0025);
        roundRect(ctx, (W - pw) / 2, fy, pw, pillH, pillRadius(d, pillH));
        ctx.stroke();
        ctx.restore();
        drawText(ctx, d.handle, W / 2, fy + pillH / 2, { size: small, weight: '500', family: f, color: cream, align: 'center', baseline: 'middle' });
      }
    }
  },

  aurora: {
    label: 'Aurora',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.085, f = fam(d);
      const { accent } = d.brand;
      const layer = makeLayer(W, H, (c) => paintMesh(c, W, H, d));
      ctx.drawImage(layer, 0, 0);
      H = contentArea(ctx, W, H);

      const star = u * 0.042, pillH = u * 0.09, pillPad = u * 0.034;
      const pillW = starsWidth(star) + pillPad * 2;
      glass(ctx, layer, (W - pillW) / 2, p, pillW, pillH, pillRadius(d, pillH), u, { shadow: false });
      drawStars(ctx, W / 2, p + (pillH - star) / 2, star, d.rating, accent, 'center', d.style);

      const footH = u * 0.06, footY = H - p - footH;
      const chipH = u * 0.12, chipY = footY - p * 0.55 - chipH;
      const top = p + pillH + p * 0.6, bottom = chipY - p * 0.55;
      const fit = fitText(ctx, d.text, W - p * 2, bottom - top, { max: u * 0.078, min: u * 0.03, family: f, weight: '700', lh: 1.2, tracking: -0.025 });
      drawLines(ctx, fit, W / 2, top + (bottom - top - blockHeight(fit)) / 2, 'center', '#ffffff');

      if (d.name || d.sourceLabel) {
        const personS = chipH * 0.62;
        const chipPad = (chipH - personS) / 2;
        const textW = Math.max(
          d.name ? measure(ctx, d.name, personS * 0.34, '700', f) : 0,
          measure(ctx, d.sourceLabel || '', personS * 0.27, '500', f)
        );
        const chipW = (d.name ? personS + personS * 0.28 : 0) + textW + chipPad * 2.4;
        const chipX = (W - chipW) / 2;
        glass(ctx, layer, chipX, chipY, chipW, chipH, pillRadius(d, chipH), u, { shadow: false });
        drawPerson(ctx, chipX + chipPad * 1.2, chipY + chipPad, personS, d, {
          nameColor: '#ffffff', subColor: 'rgba(255,255,255,0.72)', avatarBg: accent, avatarFg: readableOn(accent)
        });
      }
      drawBrandRow(ctx, W / 2, footY, footH, d, '#ffffff', 'center');
    }
  }
};

/* ---------- watermarks ---------- */

// Small "Made with [logo]" credit on free designs exported from the free plan.
function drawCornerMark(ctx, W, H, logo) {
  const u = Math.min(W, H), safe = safeInsets(W, H);
  const right = W - Math.max(u * 0.045, safe.side), bottom = H - safe.bottom - u * 0.04;
  const size = Math.round(u * 0.021);
  const lh = u * 0.026;
  const lw = logo ? (lh * logo.width) / logo.height : 0;
  ctx.save();
  ctx.globalAlpha = 0.8;
  // A faint shadow keeps the white mark visible on light backgrounds.
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = u * 0.008;
  if (logo) {
    ctx.drawImage(whiteMark(logo), right - lw, bottom - lh, lw, lh);
    drawText(ctx, 'Made with', right - lw - u * 0.012, bottom - lh * 0.12, {
      size, weight: '500', family: FONTS.inter.family, color: '#ffffff', align: 'right', baseline: 'alphabetic'
    });
  } else {
    drawText(ctx, `Made with ${APP_NAME}`, right, bottom, {
      size, weight: '600', family: FONTS.inter.family, color: '#ffffff', align: 'right', baseline: 'bottom'
    });
  }
  ctx.restore();
}

let whiteMarkCache;
function whiteMark(img) {
  if (whiteMarkCache?.img === img) return whiteMarkCache.canvas;
  const c = makeLayer(img.width, img.height, (g) => {
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, img.width, img.height);
  });
  whiteMarkCache = { img, canvas: c };
  return c;
}

// A few diagonal white ReviewPost logos at 50% over Pro designs previewed on the free plan.
function drawProWatermark(ctx, W, H, logo) {
  const u = Math.min(W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 7);
  ctx.globalAlpha = 0.5;
  // A faint shadow keeps the white marks visible on light designs.
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = u * 0.012;
  const mw = u * 0.4;
  const mh = logo ? (mw * logo.height) / logo.width : u * 0.06;
  const stepX = mw * 1.75;
  const stepY = Math.max(mh * 6, u * 0.3);
  const reach = Math.hypot(W, H) / 2 + stepX;
  for (let y = -reach, row = 0; y < reach; y += stepY, row++) {
    for (let x = -reach + (row % 2 ? stepX / 2 : 0); x < reach; x += stepX) {
      if (logo) ctx.drawImage(whiteMark(logo), x - mw / 2, y - mh / 2, mw, mh);
      else drawText(ctx, APP_NAME, x, y, { size: mh, weight: '800', family: FONTS.inter.family, color: '#ffffff', align: 'center', baseline: 'middle' });
    }
  }
  ctx.restore();
}
