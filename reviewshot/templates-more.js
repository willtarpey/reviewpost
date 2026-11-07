// Twelve more Pro designs, added to TEMPLATES from templates.js (load this file after it).
// In the editor they sit behind "View more" below the first nine designs.

const paperOf = (primary) => mix(primary, '#ffffff', 0.93);
const inkOf = (primary) => (luminance(primary) < 0.2 ? primary : mix(primary, '#000000', 0.6));
// A star colour that stays visible on white.
const starOnWhite = (d) => (luminance(d.brand.accent) > 0.6 ? d.brand.primary : d.brand.accent);
const STAR_WORDS = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];

// Repeats `label` evenly around a full circle.
function drawCircleText(ctx, label, cx, cy, r, size, family, color) {
  setFont(ctx, size, '700', family, 0.16);
  const reps = Math.max(1, Math.floor((Math.PI * 2 * r) / ctx.measureText(label).width));
  const chars = [...label.repeat(reps)];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const scale = (Math.PI * 2 * r) / widths.reduce((a, b) => a + b, 0);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let a = -Math.PI / 2;
  chars.forEach((c, i) => {
    const step = (widths[i] * scale) / r;
    a += step / 2;
    ctx.save();
    ctx.translate(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    a += step / 2;
  });
  ctx.letterSpacing = '0px';
}

// Stable number from the review text, so the ticket number and barcode don't change between renders.
function hashText(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function drawBarcode(ctx, x, y, w, h, seed, color) {
  let s = hashText(seed) || 1;
  ctx.fillStyle = color;
  for (let cx = x; ;) {
    s = (s * 1103515245 + 12345) >>> 0;
    const bar = w * (0.008 + ((s >> 8) % 4) * 0.007);
    if (cx + bar > x + w) break;
    ctx.fillRect(cx, y, bar, h);
    cx += bar + w * (0.01 + ((s >> 12) % 3) * 0.007);
  }
}

// QR code linking to the brand kit's website (vendor/qrcode.js). Returns false when there's nothing to link to.
function drawQr(ctx, x, y, size, website, color) {
  const raw = (website || '').trim();
  if (!raw || typeof qrcode !== 'function') return false;
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const cell = size / n;
  ctx.fillStyle = color;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // Slight overlap stops hairline gaps between modules when scaled.
      if (qr.isDark(r, c)) ctx.fillRect(x + c * cell, y + r * cell, cell + 0.5, cell + 0.5);
    }
  }
  return true;
}

Object.assign(TEMPLATES, {
  // Paper background, serif quote, hairline rule.
  minimal: {
    label: 'Minimal',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.09, f = fam(d);
      const paper = paperOf(d.brand.primary), ink = inkOf(d.brand.primary);
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.06);
      H = contentArea(ctx, W, H);

      const star = u * 0.038;
      drawStars(ctx, p, p, star, d.rating, ink, 'left', d.style);
      if (d.sourceLabel) {
        drawText(ctx, d.sourceLabel.toUpperCase(), W - p, p + star / 2, {
          size: u * 0.022, weight: '600', family: f, color: rgba(ink, 0.6), align: 'right', baseline: 'middle', tracking: 0.12
        });
      }

      const personS = u * 0.075, personY = H - p - personS;
      const ruleY = personY - p * 0.5;
      const top = p + star + p * 0.8, bottom = ruleY - p * 0.6;
      const fit = fitText(ctx, `“${d.text}”`, W - p * 2, bottom - top, {
        max: u * 0.075, min: u * 0.03, family: FONTS.playfair.family, weight: '500', lh: 1.25, tracking: -0.01
      });
      drawLines(ctx, fit, p, top + (bottom - top - blockHeight(fit)) / 2, 'left', ink);

      ctx.fillStyle = rgba(ink, 0.18);
      ctx.fillRect(p, ruleY, W - p * 2, Math.max(1, u * 0.002));
      drawPerson(ctx, p, personY, personS, d, { nameColor: ink, subColor: rgba(ink, 0.6), avatarBg: ink, avatarFg: paper });
      const bh = u * 0.05;
      drawBrandRow(ctx, W - p, personY + (personS - bh) / 2, bh, d, ink, 'right');
    }
  },

  // Colour panel with the score, white panel with the quote.
  split: {
    label: 'Split',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), f = fam(d);
      const { primary, accent, text } = d.brand;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      // On Story/Reel the colour panel bleeds up to the top edge.
      const bleed = safeInsets(W, H).top;
      H = contentArea(ctx, W, H);
      const wide = W > H * 1.2;
      const panel = wide ? { x: 0, y: 0, w: W * 0.38, h: H } : { x: 0, y: 0, w: W, h: H * 0.4 };
      const area = wide ? { x: panel.w, y: 0, w: W - panel.w, h: H } : { x: 0, y: panel.h, w: W, h: H - panel.h };
      ctx.fillStyle = primary;
      ctx.fillRect(panel.x, panel.y - bleed, panel.w, panel.h + bleed);

      const numSize = Math.min(panel.h * 0.42, panel.w * 0.32);
      const star = numSize * 0.24, lab = u * 0.024;
      const blockH = numSize * 0.78 + star * 0.5 + star + (d.sourceLabel ? lab * 1.9 : 0);
      const cx = panel.x + panel.w / 2;
      let y = panel.y + (panel.h - blockH) / 2;
      drawText(ctx, `${d.rating}.0`, cx, y + numSize * 0.74, { size: numSize, weight: '800', family: f, color: text, align: 'center', baseline: 'alphabetic', tracking: -0.03 });
      y += numSize * 0.78 + star * 0.5;
      drawStars(ctx, cx, y, star, d.rating, accent, 'center', d.style);
      y += star + lab * 0.9;
      if (d.sourceLabel) drawText(ctx, d.sourceLabel.toUpperCase(), cx, y, { size: lab, weight: '600', family: f, color: rgba(text, 0.75), align: 'center', tracking: 0.12 });

      const p = u * 0.075, personS = u * 0.075;
      const personY = area.y + area.h - p - personS;
      const top = area.y + p, bottom = personY - p * 0.6;
      const fit = fitText(ctx, `“${d.text}”`, area.w - p * 2, bottom - top, { max: u * 0.06, min: u * 0.026, family: f, weight: '500', lh: 1.35, tracking: -0.01 });
      drawLines(ctx, fit, area.x + p, top + (bottom - top - blockHeight(fit)) / 2, 'left', '#18181b');
      drawPerson(ctx, area.x + p, personY, personS, d, { nameColor: '#18181b', subColor: '#71717a', avatarBg: primary, avatarFg: readableOn(primary) });
      const bh = u * 0.05;
      drawBrandRow(ctx, area.x + area.w - p, personY + (personS - bh) / 2, bh, d, '#18181b', 'right');
    }
  },

  // Speech bubble with a tail pointing at the reviewer.
  bubble: {
    label: 'Bubble',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.08, f = fam(d);
      const { primary, accent, text } = d.brand;
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.2, H * 0.1, Math.max(W, H));
      glow.addColorStop(0, rgba(accent, 0.2));
      glow.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      H = contentArea(ctx, W, H);

      const personS = u * 0.09, personY = H - p - personS, tail = u * 0.065;
      const bx = p, by = p, bw = W - p * 2, bh = personY - tail - p * 0.35 - by;
      const tx = bx + u * 0.1;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = u * 0.05;
      ctx.shadowOffsetY = u * 0.015;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, bx, by, bw, bh, radius(d, u, 0.06));
      ctx.moveTo(tx, by + bh - 1);
      ctx.lineTo(tx + u * 0.09, by + bh - 1);
      ctx.lineTo(tx - u * 0.015, by + bh + tail);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const ip = u * 0.07, star = u * 0.045;
      drawStars(ctx, bx + ip, by + ip, star, d.rating, starOnWhite(d), 'left', d.style);
      const top = by + ip + star + ip * 0.6, bottom = by + bh - ip;
      const fit = fitText(ctx, d.text, bw - ip * 2, bottom - top, { max: u * 0.066, min: u * 0.028, family: f, weight: '600', lh: 1.3, tracking: -0.012 });
      drawLines(ctx, fit, bx + ip, top + (bottom - top - blockHeight(fit)) / 2, 'left', '#18181b');

      drawPerson(ctx, bx + u * 0.035, personY, personS, d, { nameColor: text, subColor: rgba(text, 0.7), avatarBg: accent, avatarFg: readableOn(accent) });
      const brandH = u * 0.05;
      drawBrandRow(ctx, W - p, personY + (personS - brandH) / 2, brandH, d, text, 'right');
    }
  },

  // Dark background with glowing type and a glowing frame.
  neon: {
    label: 'Neon',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.09, f = fam(d);
      const glowC = luminance(d.brand.accent) < 0.15 ? mix(d.brand.accent, '#ffffff', 0.5) : d.brand.accent;
      ctx.fillStyle = '#0b0b0f';
      ctx.fillRect(0, 0, W, H);
      const halo = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      halo.addColorStop(0, rgba(glowC, 0.14));
      halo.addColorStop(1, rgba(glowC, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      const fi = p * 0.5;
      ctx.save();
      ctx.shadowColor = glowC;
      ctx.shadowBlur = u * 0.04;
      ctx.strokeStyle = glowC;
      ctx.lineWidth = u * 0.006;
      roundRect(ctx, fi, fi, W - fi * 2, H - fi * 2, radius(d, u, 0.05));
      ctx.stroke();
      ctx.stroke();
      ctx.restore();
      H = contentArea(ctx, W, H);

      const star = u * 0.055, starY = p + u * 0.02;
      ctx.save();
      ctx.shadowColor = glowC;
      ctx.shadowBlur = u * 0.03;
      drawStars(ctx, W / 2, starY, star, d.rating, glowC, 'center', d.style);
      ctx.restore();

      const footH = u * 0.055, footY = H - p - footH;
      const nameSize = u * 0.03, nameY = footY - p * 0.55 - nameSize;
      const top = starY + star + p * 0.6, bottom = nameY - p * 0.5;
      const fit = fitText(ctx, d.text, W - p * 2.2, bottom - top, { max: u * 0.07, min: u * 0.03, family: f, weight: '700', lh: 1.22, tracking: -0.015 });
      ctx.save();
      ctx.shadowColor = rgba(glowC, 0.9);
      ctx.shadowBlur = u * 0.025;
      drawLines(ctx, fit, W / 2, top + (bottom - top - blockHeight(fit)) / 2, 'center', '#ffffff');
      const attr = [d.name, d.sourceLabel].filter(Boolean).join('  ·  ').toUpperCase();
      drawText(ctx, attr, W / 2, nameY, { size: nameSize, weight: '600', family: f, color: glowC, align: 'center', tracking: 0.12 });
      ctx.restore();
      drawBrandRow(ctx, W / 2, footY, footH, d, '#ffffff', 'center');
    }
  },

  // Tilted instant photo with the quote written in the caption.
  polaroid: {
    label: 'Polaroid',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.07, f = fam(d);
      ctx.fillStyle = d.brand.primary;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.1);
      H = contentArea(ctx, W, H);

      const footH = u * 0.055;
      const availTop = p, availBottom = H - p - footH - p * 0.5, availH = availBottom - availTop;
      let pw = Math.min(W * 0.78, u * 0.74), m = pw * 0.06, photo = pw - m * 2, capH = pw * 0.36;
      const s = Math.min(1, availH / (m + photo + capH));
      pw *= s; m *= s; photo *= s; capH *= s;
      const ph = m + photo + capH;

      ctx.save();
      ctx.translate(W / 2, availTop + availH / 2);
      ctx.rotate(-0.04);
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = u * 0.05;
      ctx.shadowOffsetY = u * 0.02;
      ctx.fillStyle = '#fbfaf6';
      roundRect(ctx, -pw / 2, -ph / 2, pw, ph, d.style.corners === 'rounded' ? u * 0.012 : 0);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      const px = -pw / 2 + m, py = -ph / 2 + m, side = Math.max(1, Math.round(photo));
      ctx.drawImage(makeLayer(side, side, (c) => paintBackdrop(c, side, side, d)), px, py, photo, photo);
      const star = photo * 0.075;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = u * 0.015;
      drawStars(ctx, px + photo * 0.06, py + photo * 0.94 - star, star, d.rating, '#ffffff', 'left', d.style);
      ctx.shadowColor = 'transparent';

      const capY = py + photo + m * 0.55, nameS = capH * 0.14;
      const fit = fitText(ctx, `“${d.text}”`, pw - m * 2, capH - m * 0.55 - nameS * 1.7 - m * 0.4, {
        max: capH * 0.2, min: capH * 0.09, family: DISPLAY.book, weight: '500', lh: 1.15, tracking: 0, italic: true
      });
      drawLines(ctx, fit, 0, capY, 'center', '#2a2622');
      if (d.name) drawText(ctx, `— ${d.name}`, 0, capY + blockHeight(fit) + nameS * 0.35, { size: nameS, weight: '600', family: f, color: '#6b645c', align: 'center' });
      ctx.restore();

      drawBrandRow(ctx, W / 2, H - p - footH, footH, d, d.brand.text, 'center');
    }
  },

  // Round seal with the score and repeating text around the edge.
  badge: {
    label: 'Badge',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.08, f = fam(d);
      const { primary, accent, text } = d.brand;
      const onA = readableOn(accent);
      const rounded = d.style.corners === 'rounded';
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.06);
      H = contentArea(ctx, W, H);

      const wide = W > H * 1.2;
      const R = wide ? Math.min(H * 0.34, W * 0.17) : u * 0.19;
      const bcx = wide ? p + R : W / 2, bcy = wide ? H / 2 : p + R;
      ctx.fillStyle = accent;
      ctx.beginPath();
      if (rounded) ctx.arc(bcx, bcy, R, 0, Math.PI * 2);
      else ctx.rect(bcx - R, bcy - R, R * 2, R * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(onA, 0.35);
      ctx.lineWidth = Math.max(1, u * 0.003);
      ctx.beginPath();
      if (rounded) ctx.arc(bcx, bcy, R * 0.76, 0, Math.PI * 2);
      else ctx.rect(bcx - R * 0.76, bcy - R * 0.76, R * 1.52, R * 1.52);
      ctx.stroke();

      const ring = `${STAR_WORDS[d.rating] || 'FIVE'}-STAR REVIEW • `;
      if (rounded) {
        drawCircleText(ctx, ring, bcx, bcy, R * 0.88, R * 0.1, f, onA);
      } else {
        const lab = R * 0.1;
        drawText(ctx, ring.replace(' • ', ''), bcx, bcy - R * 0.88, { size: lab, weight: '700', family: f, color: onA, align: 'center', baseline: 'middle', tracking: 0.16 });
        drawText(ctx, d.source ? d.source.toUpperCase() : 'VERIFIED', bcx, bcy + R * 0.88, { size: lab, weight: '700', family: f, color: onA, align: 'center', baseline: 'middle', tracking: 0.16 });
      }
      drawText(ctx, `${d.rating}.0`, bcx, bcy + R * 0.08, { size: R * 0.5, weight: '800', family: f, color: onA, align: 'center', baseline: 'alphabetic', tracking: -0.03 });
      drawStars(ctx, bcx, bcy + R * 0.18, R * 0.13, d.rating, onA, 'center', d.style);

      const personS = u * 0.075;
      if (wide) {
        const x0 = bcx + R + p * 1.1, w = W - x0 - p;
        const personY = H - p - personS;
        const top = p, bottom = personY - p * 0.55;
        const fit = fitText(ctx, `“${d.text}”`, w, bottom - top, { max: u * 0.07, min: u * 0.03, family: f, weight: '600', lh: 1.28, tracking: -0.012 });
        drawLines(ctx, fit, x0, top + (bottom - top - blockHeight(fit)) / 2, 'left', text);
        drawPerson(ctx, x0, personY, personS, d, { nameColor: text, subColor: rgba(text, 0.7), avatarBg: accent, avatarFg: onA });
        const bh = u * 0.05;
        drawBrandRow(ctx, W - p, personY + (personS - bh) / 2, bh, d, text, 'right');
      } else {
        const footH = u * 0.05, footY = H - p - footH;
        const personY = footY - p * 0.55 - personS;
        const top = bcy + R + p * 0.7, bottom = personY - p * 0.55;
        const fit = fitText(ctx, `“${d.text}”`, W - p * 2, bottom - top, { max: u * 0.06, min: u * 0.026, family: f, weight: '600', lh: 1.28, tracking: -0.012 });
        drawLines(ctx, fit, W / 2, top + (bottom - top - blockHeight(fit)) / 2, 'center', text);
        drawPerson(ctx, W / 2, personY, personS, d, { align: 'center', nameColor: text, subColor: rgba(text, 0.7), avatarBg: accent, avatarFg: onA });
        drawBrandRow(ctx, W / 2, footY, footH, d, text, 'center');
      }
    }
  },

  // Event-ticket card with notches, a perforation line and a QR code to the website on the stub.
  ticket: {
    label: 'Ticket',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.075, f = fam(d);
      const { primary } = d.brand;
      const ink = '#18181b';
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.08);
      H = contentArea(ctx, W, H);

      const tx = p, ty = p, tw = W - p * 2, th = H - p * 2;
      const stubH = Math.min(th * 0.26, u * 0.24), divY = ty + th - stubH, notch = u * 0.035;
      const card = makeLayer(W, H, (c) => {
        c.fillStyle = '#ffffff';
        roundRect(c, tx, ty, tw, th, radius(d, u, 0.035));
        c.fill();
        c.globalCompositeOperation = 'destination-out';
        for (const nx of [tx, tx + tw]) {
          c.beginPath();
          c.arc(nx, divY, notch, 0, Math.PI * 2);
          c.fill();
        }
      });
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = u * 0.05;
      ctx.shadowOffsetY = u * 0.015;
      ctx.drawImage(card, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#c8c8cc';
      ctx.lineWidth = Math.max(1, u * 0.003);
      ctx.setLineDash([u * 0.014, u * 0.012]);
      ctx.beginPath();
      ctx.moveTo(tx + notch * 1.6, divY);
      ctx.lineTo(tx + tw - notch * 1.6, divY);
      ctx.stroke();
      ctx.restore();

      const ip = u * 0.065, lab = u * 0.024;
      drawText(ctx, (d.brand.businessName || 'Customer review').toUpperCase(), tx + ip, ty + ip, { size: lab, weight: '700', family: f, color: ink, tracking: 0.1 });
      drawText(ctx, `No. ${String((hashText(d.text) % 999) + 1).padStart(3, '0')}`, tx + tw - ip, ty + ip, { size: lab, weight: '500', family: f, color: '#71717a', align: 'right', tracking: 0.06 });
      const star = u * 0.06, starY = ty + ip + lab + ip * 0.6;
      drawStars(ctx, tx + ip, starY, star, d.rating, starOnWhite(d), 'left', d.style);
      const top = starY + star + ip * 0.6, bottom = divY - ip * 0.7;
      const fit = fitText(ctx, `“${d.text}”`, tw - ip * 2, bottom - top, { max: u * 0.064, min: u * 0.026, family: f, weight: '600', lh: 1.26, tracking: -0.012 });
      drawLines(ctx, fit, tx + ip, top + (bottom - top - blockHeight(fit)) / 2, 'left', ink);

      const personS = Math.min(u * 0.08, stubH * 0.5);
      drawPerson(ctx, tx + ip, divY + (stubH - personS) / 2, personS, d, { nameColor: ink, subColor: '#71717a', avatarBg: primary, avatarFg: readableOn(primary) });
      // QR to the business's website; a decorative barcode if no website is set.
      const qs = Math.min(stubH * 0.72, tw * 0.3);
      if (!drawQr(ctx, tx + tw - ip - qs, divY + (stubH - qs) / 2, qs, d.brand.website, ink)) {
        const bw = Math.min(tw * 0.3, u * 0.28), bh = personS * 0.95;
        drawBarcode(ctx, tx + tw - ip - bw, divY + (stubH - bh) / 2, bw, bh, d.text, ink);
      }
    }
  },

  // Photo turned into two brand colours, quote set over the bottom.
  duotone: {
    label: 'Duotone',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.08, f = fam(d);
      const { primary, accent } = d.brand;
      const base = makeLayer(W, H, (c) => paintBackdrop(c, W, H, d));
      ctx.save();
      ctx.filter = 'grayscale(1) contrast(1.15)';
      ctx.drawImage(base, 0, 0);
      ctx.restore();
      // Shadows take the primary colour, highlights take the accent.
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = mix(primary, '#000000', 0.15);
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = mix(accent, '#ffffff', 0.15);
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      const shade = ctx.createLinearGradient(0, H * 0.3, 0, H);
      shade.addColorStop(0, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, W, H);
      H = contentArea(ctx, W, H);

      const star = u * 0.045, brandH = u * 0.05;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = u * 0.015;
      drawStars(ctx, p, p, star, d.rating, '#ffffff', 'left', d.style);
      drawBrandRow(ctx, W - p, p + (star - brandH) / 2, brandH, d, '#ffffff', 'right');
      ctx.restore();

      const personS = u * 0.08, personY = H - p - personS;
      const textBottom = personY - p * 0.55, textTop = Math.max(H * 0.4, p + star + p);
      const fit = fitText(ctx, d.text, W - p * 2, textBottom - textTop, { max: u * 0.075, min: u * 0.03, family: f, weight: '800', lh: 1.12, tracking: -0.02 });
      drawLines(ctx, fit, p, textBottom - blockHeight(fit), 'left', '#ffffff');
      drawPerson(ctx, p, personY, personS, d, { nameColor: '#ffffff', subColor: 'rgba(255,255,255,0.75)', avatarBg: accent, avatarFg: readableOn(accent) });
    }
  },

  // Geometric shapes in the accent colour around the quote.
  shapes: {
    label: 'Shapes',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.085, f = fam(d);
      const { primary, accent, text } = d.brand;
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(W * 0.96, H * 0.96, u * 0.34, 0, Math.PI * 2);
      ctx.fill();
      H = contentArea(ctx, W, H);

      const sq = u * 0.15;
      ctx.save();
      ctx.translate(W - p - sq * 0.55, p + sq * 0.55);
      ctx.rotate(0.22);
      ctx.strokeStyle = accent;
      ctx.lineWidth = u * 0.012;
      roundRect(ctx, -sq / 2, -sq / 2, sq, sq, radius(d, u, 0.03));
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = rgba(accent, 0.5);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.arc(W - p - u * 0.1 + i * u * 0.028, p + sq + u * 0.08 + j * u * 0.028, u * 0.005, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const star = u * 0.055;
      drawStars(ctx, p, p, star, d.rating, accent, 'left', d.style);
      const footH = u * 0.05, footY = H - p - footH;
      const personS = u * 0.08, personY = footY - p * 0.55 - personS;
      const top = p + star + p * 0.7, bottom = personY - p * 0.6;
      const fit = fitText(ctx, d.text, W - p * 2 - u * 0.14, bottom - top, { max: u * 0.08, min: u * 0.03, family: f, weight: '700', lh: 1.18, tracking: -0.02 });
      drawLines(ctx, fit, p, top + (bottom - top - blockHeight(fit)) / 2, 'left', text);
      drawPerson(ctx, p, personY, personS, d, { nameColor: text, subColor: rgba(text, 0.7), avatarBg: accent, avatarFg: readableOn(accent) });
      drawBrandRow(ctx, p, footY, footH, d, text, 'left');
    }
  },

  // A white card on top of two tilted cards in the brand colours.
  stack: {
    label: 'Stack',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.08, f = fam(d);
      const { primary, accent, text } = d.brand;
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      H = contentArea(ctx, W, H);

      const footH = u * 0.055, footY = H - p - footH;
      const availTop = p * 1.3, availBottom = footY - p * 0.9;
      const cw = W - p * 2.8, ch = Math.min(availBottom - availTop, cw * 1.1);
      const cx = W / 2, cy = availTop + (availBottom - availTop) / 2;
      const r = radius(d, u, 0.05);
      const card = (angle, fill) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = u * 0.04;
        ctx.shadowOffsetY = u * 0.012;
        ctx.fillStyle = fill;
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, r);
        ctx.fill();
        ctx.restore();
      };
      card(-0.09, accent);
      card(0.06, mix(accent, '#ffffff', 0.5));
      card(0, '#ffffff');

      const x0 = cx - cw / 2, y0 = cy - ch / 2, ip = u * 0.065;
      const star = u * 0.045;
      drawStars(ctx, x0 + ip, y0 + ip, star, d.rating, starOnWhite(d), 'left', d.style);
      const personS = u * 0.075, personY = y0 + ch - ip - personS;
      const top = y0 + ip + star + ip * 0.6, bottom = personY - ip * 0.6;
      const fit = fitText(ctx, `“${d.text}”`, cw - ip * 2, bottom - top, { max: u * 0.06, min: u * 0.026, family: f, weight: '600', lh: 1.3, tracking: -0.012 });
      drawLines(ctx, fit, x0 + ip, top + (bottom - top - blockHeight(fit)) / 2, 'left', '#18181b');
      drawPerson(ctx, x0 + ip, personY, personS, d, { nameColor: '#18181b', subColor: '#71717a', avatarBg: primary, avatarFg: readableOn(primary) });
      drawBrandRow(ctx, W / 2, footY, footH, d, text, 'center');
    }
  },

  // The score, huge, then the quote.
  score: {
    label: 'Score',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.085, f = fam(d);
      const { primary, accent, text } = d.brand;
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.06);
      H = contentArea(ctx, W, H);

      const num = `${d.rating}.0`, numSize = u * 0.3;
      const numW = measure(ctx, num, numSize, '400', DISPLAY.heavy, -0.03);
      drawText(ctx, num, p - numSize * 0.03, p + numSize * 0.74, { size: numSize, weight: '400', family: DISPLAY.heavy, color: accent, baseline: 'alphabetic', tracking: -0.03 });
      const sx = p + numW + u * 0.04, star = u * 0.045, sy = p + numSize * 0.16;
      drawStars(ctx, sx, sy, star, d.rating, accent, 'left', d.style);
      drawText(ctx, 'out of 5', sx, sy + star + u * 0.022, { size: u * 0.03, weight: '600', family: f, color: text });
      if (d.sourceLabel) drawText(ctx, d.sourceLabel, sx, sy + star + u * 0.066, { size: u * 0.026, weight: '500', family: f, color: rgba(text, 0.65) });

      const divY = p + numSize * 0.92;
      ctx.fillStyle = rgba(text, 0.2);
      ctx.fillRect(p, divY, W - p * 2, Math.max(1, u * 0.002));
      const footH = u * 0.05, footY = H - p - footH;
      const personS = u * 0.075, personY = footY - p * 0.55 - personS;
      const top = divY + p * 0.6, bottom = personY - p * 0.55;
      const fit = fitText(ctx, `“${d.text}”`, W - p * 2, bottom - top, { max: u * 0.06, min: u * 0.026, family: f, weight: '500', lh: 1.32, tracking: -0.01 });
      drawLines(ctx, fit, p, top + (bottom - top - blockHeight(fit)) / 2, 'left', text);
      drawPerson(ctx, p, personY, personS, d, { nameColor: text, subColor: rgba(text, 0.7), avatarBg: accent, avatarFg: readableOn(accent) });
      drawBrandRow(ctx, p, footY, footH, d, text, 'left');
    }
  },

  // Headline picked out with highlighter strokes on paper.
  marker: {
    label: 'Marker',
    pro: true,
    draw(ctx, W, H, d) {
      const u = Math.min(W, H), p = u * 0.09, f = fam(d);
      const paper = '#fbfaf6', ink = inkOf(d.brand.primary);
      const hl = luminance(d.brand.accent) > 0.35 ? d.brand.accent : mix(d.brand.accent, '#ffffff', 0.6);
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, W, H);
      paintGrain(ctx, W, H, 0.05);
      H = contentArea(ctx, W, H);

      const star = u * 0.045;
      drawStars(ctx, p, p, star, d.rating, ink, 'left', d.style);
      const personS = u * 0.075, personY = H - p - personS;
      const subSize = u * 0.034;
      const sub = d.subtext
        ? fitText(ctx, d.subtext, W - p * 2, subSize * 1.4 * 3 + 1, { max: subSize, min: subSize, family: f, weight: '500', lh: 1.4, tracking: 0 })
        : null;
      const subH = sub ? blockHeight(sub) + p * 0.4 : 0;
      const top = p + star + p * 0.7, bottom = personY - p * 0.6;
      const head = fitText(ctx, d.headline, W - p * 2 - u * 0.03, bottom - top - subH, { max: u * 0.1, min: u * 0.04, family: f, weight: '800', lh: 1.22, tracking: -0.025 });
      let y = top + (bottom - top - subH - blockHeight(head)) / 2;

      setFont(ctx, head.size, head.weight, head.family, head.tracking);
      head.lines.forEach((line, i) => {
        const w = ctx.measureText(line).width;
        ctx.save();
        ctx.translate(p, y + i * head.size * head.lh);
        ctx.rotate(i % 2 ? 0.008 : -0.008);
        ctx.fillStyle = hl;
        roundRect(ctx, -u * 0.012, head.size * 0.2, w + u * 0.024, head.size * 0.86, d.style.corners === 'rounded' ? head.size * 0.18 : 0);
        ctx.fill();
        ctx.restore();
      });
      ctx.letterSpacing = '0px';
      drawLines(ctx, head, p, y, 'left', ink);
      y += blockHeight(head) + p * 0.4;
      if (sub) drawLines(ctx, sub, p, y, 'left', rgba(ink, 0.75));

      drawPerson(ctx, p, personY, personS, d, { nameColor: ink, subColor: rgba(ink, 0.6), avatarBg: ink, avatarFg: paper });
      const bh = u * 0.05;
      drawBrandRow(ctx, W - p, personY + (personS - bh) / 2, bh, d, ink, 'right');
    }
  }
});

// contentArea() moves the origin for Story/Reel, so every draw restores the canvas state when it's done.
for (const t of Object.values(TEMPLATES)) {
  const draw = t.draw;
  t.draw = function (ctx, ...args) {
    ctx.save();
    try { draw.call(this, ctx, ...args); } finally { ctx.restore(); }
  };
}
