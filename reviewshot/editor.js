// Editor page: loads the pending review and brand kit, renders the chosen template and tiles, exports PNG.

// chrome.storage when running as the extension, localStorage when the page is opened directly for design work.
const store = {
  async get(keys) {
    if (globalThis.chrome?.storage?.local) return chrome.storage.local.get(keys);
    const out = {};
    for (const k of keys) {
      try {
        const v = localStorage.getItem('rp:' + k);
        if (v != null) out[k] = JSON.parse(v);
      } catch {}
    }
    return out;
  },
  async set(obj) {
    if (globalThis.chrome?.storage?.local) return chrome.storage.local.set(obj);
    for (const [k, v] of Object.entries(obj)) {
      try { localStorage.setItem('rp:' + k, JSON.stringify(v)); } catch {}
    }
  },
  async remove(key) {
    if (globalThis.chrome?.storage?.local) return chrome.storage.local.remove(key);
    try { localStorage.removeItem('rp:' + key); } catch {}
  }
};

// ReviewPost's own palette, used until the business sets or matches its colours.
const DEFAULT_COLORS = { primary: '#16170f', accent: '#eefca6', text: '#ffffff' };

const DEFAULT_BRAND = {
  businessName: '',
  handle: '',
  website: '',
  logo: null, // data URL, downscaled; only drawn on the Pro plan
  ...DEFAULT_COLORS,
  colorsSet: false,
  font: 'inter'
};

// Custom design requests go here. Set REQUEST_ENDPOINT to a form service URL (e.g. Formspree)
// to send requests directly; when it's empty, the user's email app opens with the request filled in.
const CONTACT_EMAIL = 'hello@willtarpey.com';
const REQUEST_ENDPOINT = 'https://formspree.io/f/xnppgkzv';

const MAX_BRANDS = 5; // Agency plan
const VISIBLE_TILES = 9; // designs shown before "View more"; the rest sit under a fade
const EMPTY_REVIEW = { text: '', headline: '', name: '', rating: 5, source: 'Other', business: '' };

const SAMPLE_REVIEW = {
  text: 'Absolutely brilliant service from start to finish. The team went above and beyond and I’ve already recommended them to all my friends!',
  headline: '',
  name: 'Sarah Mitchell',
  rating: 5,
  source: 'Google',
  business: ''
};

const PLANS = [
  { id: 'free', name: 'Free', price: '£0', period: '', desc: 'Try it out with the essentials.' },
  { id: 'pro', name: 'Pro', price: '£8', period: ' / month', desc: `All ${Object.keys(TEMPLATES).length} designs, your logo, no watermarks.`, featured: true },
  { id: 'agency', name: 'Agency', price: '£29', period: ' / month', desc: 'For agencies posting for several clients.' }
];

// plans: [free, pro, agency]. Add `soon: true` to tag a feature that isn't built yet.
const FEATURES = [
  { label: `${Object.values(TEMPLATES).filter((t) => !t.pro).length} free designs`, plans: [1, 1, 1] },
  { label: 'Match colours from your website', plans: [1, 1, 1] },
  { label: 'Post, Story and LinkedIn sizes', plans: [1, 1, 1] },
  { label: 'No watermark on downloads', plans: [0, 1, 1] },
  { label: `${Object.values(TEMPLATES).filter((t) => t.pro).length} Pro designs, with more added`, plans: [0, 1, 1] },
  { label: 'Your logo on every post', plans: [0, 1, 1] },
  { label: 'Your own background images', plans: [0, 1, 1] },
  { label: 'Batch posts from reviews', plans: [0, 1, 1] },
  { label: '3 team seats', plans: [0, 0, 1] },
  { label: 'Up to 5 brand kits', plans: [0, 0, 1] },
  { label: 'Up to 3 bespoke templates', plans: [0, 0, 1] },
  { label: 'Priority support', plans: [0, 0, 1] }
];

const LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';

const state = {
  review: { ...SAMPLE_REVIEW },
  batch: null, // reviews sent together from a review page; state.review is one of them
  batchIndex: 0,
  brands: [{ ...DEFAULT_BRAND }],
  activeBrand: 0,
  brand: null, // the active entry of state.brands
  style: { stars: 'rounded', corners: 'rounded' },
  template: 'spotlight',
  size: 'post',
  firstOnly: true,
  tilesExpanded: false,
  plan: 'free', // cached; refreshed from ExtensionPay on load (see refreshPlan)
  bgImage: null, // data URL, downscaled
  logoImg: null,
  bgImg: null,
  markImg: null // ReviewPost wordmark for the Pro watermark
};

const $ = (id) => document.getElementById(id);
// Size keys being previewed and downloaded: one, or every size when "View all" is chosen.
const activeSizes = () => (state.size === 'all' ? Object.keys(SIZES) : [state.size]);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const planInfo = () => PLANS.find((p) => p.id === state.plan) || PLANS[0];
const isPro = () => state.plan !== 'free'; // any paid plan unlocks Pro features
const isAgency = () => state.plan === 'agency';
const isLocked = (key) => TEMPLATES[key].pro && !isPro();

function upgrade() {
  renderPlans();
  $('upgrade').showModal();
}

const icon = (yes) => yes
  ? '<svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-4.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  : '<svg viewBox="0 0 12 12"><path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

function renderPlans() {
  $('plans').innerHTML = PLANS.map((p, i) => {
    const current = p.id === state.plan;
    const action = current
      ? '<button type="button" class="current" disabled>Your current plan</button>'
      : p.id === 'free'
        ? '<button type="button" class="current" disabled>Included</button>'
        : `<button type="button" class="${p.featured ? 'primary' : 'secondary'}" data-plan="${p.id}">${isPro() ? 'Switch' : 'Upgrade'} to ${p.name}</button>`;
    const items = FEATURES.map(({ label, plans, soon }) => {
      const yes = plans[i];
      return `<li class="${yes ? 'yes' : 'no'}"><span class="icon">${icon(yes)}</span><span>${label}${soon && yes ? ' <span class="soon">Soon</span>' : ''}</span></li>`;
    }).join('');
    return `
      <div class="plan${p.featured ? ' featured' : ''}">
        ${p.featured ? '<span class="recommended">Recommended</span>' : ''}
        <h4>${p.name}</h4>
        <p class="desc">${p.desc}</p>
        <p class="price"><strong>${p.price}</strong>${p.period}</p>
        <div class="choose">${action}</div>
        <ul class="features">${items}</ul>
      </div>`;
  }).join('');
  $('restore').hidden = !extpay || isPro();
  $('manage').hidden = !extpay || !isPro();
  $('teamNote').hidden = !isAgency();
}

// Opens ExtensionPay's checkout in a new tab. Payment is confirmed in background.js,
// which saves the new plan; the storage listener in init() then unlocks everything here.
function startCheckout(planId, button) {
  if (!extpay) {
    button.textContent = 'Checkout works in the extension';
    button.disabled = true;
    return;
  }
  // People already paying change plan from ExtensionPay's billing page.
  extpay.openPaymentPage(isPro() ? undefined : PLAN_NICKNAMES[planId]);
}

function setPlan(plan) {
  if (!PLANS.some((p) => p.id === plan) || plan === state.plan) return;
  state.plan = plan;
  store.set({ plan });
  if ($('upgrade').open) renderPlans();
  // Extra brand kits are Agency-only; others stay saved but only the first is used.
  if (!isAgency() && state.activeBrand !== 0) switchBrand(0);
  else renderBrandSelect();
  render();
}

// Asks ExtensionPay who has paid. Keeps the last known plan if it can't be reached (e.g. offline).
async function refreshPlan() {
  if (!extpay) return;
  try {
    setPlan(planFromUser(await extpay.getUser()));
  } catch (err) {
    console.warn('ReviewPost: could not check plan', err);
  }
}

function cleanText(t) {
  return (t || '')
    .replace(/\(Translated by Google\)/gi, '')
    .replace(/\(Original\)[\s\S]*$/i, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/^["“”']+|["“”']+$/g, '')
    .trim();
}

const nameParts = (name) => (name || '').trim().split(/\s+/).filter(Boolean);

function displayName(name) {
  const parts = nameParts(name);
  if (!parts.length) return '';
  if (!state.firstOnly || parts.length === 1) return parts.join(' ');
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function initials(name) {
  const parts = nameParts(name);
  if (!parts.length) return '';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

const sentences = (text) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
const wordCount = (s) => s.split(/\s+/).length;

// A short, punchy line for the big-type designs: an exclamation if there is one, else the first short sentence.
function autoHeadline(text) {
  const short = sentences(text).filter((s) => wordCount(s) >= 3 && wordCount(s) <= 8);
  const pick = short.find((s) => s.endsWith('!')) || short[0] || text.split(/\s+/).slice(0, 6).join(' ');
  return pick.replace(/[.,;:]+$/, '');
}

function postData() {
  const text = cleanText(state.review.text) || 'Paste a review to get started.';
  const headline = state.review.headline.trim() || autoHeadline(text);
  const rest = sentences(text).filter((s) => s.replace(/[.,;:!]+$/, '') !== headline.replace(/[.,;:!]+$/, '')).join(' ');
  const source = state.review.source && state.review.source !== 'Other' ? state.review.source : '';
  return {
    text,
    headline,
    subtext: rest,
    name: displayName(state.review.name),
    initials: initials(state.review.name),
    rating: Number(state.review.rating) || 5,
    source,
    sourceLabel: source ? `${source} review` : '',
    handle: state.brand.handle.trim(),
    brand: state.brand,
    style: state.style,
    logo: isPro() ? state.logoImg : null,
    bg: state.bgImg
  };
}

/* ---------- fonts ---------- */

const fontLoads = {};
function ensureFont(key) {
  const name = (FONTS[key] || FONTS.inter).name;
  fontLoads[key] ||= Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 32px "${name}"`))).catch(() => {});
  return fontLoads[key];
}
const displayFonts = Promise.all(DISPLAY_LOADS.map((f) => document.fonts.load(f))).catch(() => {});

/* ---------- rendering ---------- */

function paint(target, key, w, h) {
  const c = target.getContext('2d');
  c.clearRect(0, 0, w, h);
  TEMPLATES[key].draw(c, w, h, postData());
  if (isLocked(key)) drawProWatermark(c, w, h, state.markImg);
  else if (!isPro()) drawCornerMark(c, w, h, state.markImg);
}

let renderSeq = 0;
let frame;
async function render() {
  const seq = ++renderSeq;
  await Promise.all([ensureFont(state.brand.font), ensureFont('inter'), ensureFont('playfair'), displayFonts]);
  if (seq !== renderSeq) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const all = state.size === 'all';
    canvas.hidden = all;
    $('multi').hidden = !all;
    if (all) {
      $('multi').querySelectorAll('canvas').forEach((c) => {
        const { w, h } = SIZES[c.dataset.size];
        c.width = w;
        c.height = h;
        paint(c, state.template, w, h);
      });
    } else {
      const { w, h } = SIZES[state.size];
      canvas.width = w;
      canvas.height = h;
      paint(canvas, state.template, w, h);
    }
    updateChrome();
    scheduleTiles();
  });
}

let tileTimer;
function scheduleTiles() {
  clearTimeout(tileTimer);
  tileTimer = setTimeout(renderTiles, 150);
}

function renderTiles() {
  const { w, h } = SIZES[activeSizes()[0]];
  const tw = 240, th = Math.round((tw * h) / w);
  document.querySelectorAll('.tile canvas').forEach((c) => {
    c.width = tw;
    c.height = th;
    paint(c, c.dataset.key, tw, th);
  });
  layoutTiles();
}

function layoutTiles() {
  const wrap = $('tilesWrap'), btn = $('viewMore');
  const extras = [...document.querySelectorAll('.tile.extra')];
  btn.hidden = !extras.length;
  if (!extras.length) return;
  wrap.classList.toggle('collapsed', !state.tilesExpanded);
  btn.classList.toggle('expanded', state.tilesExpanded);
  btn.innerHTML = state.tilesExpanded
    ? 'Show fewer designs'
    : `View ${extras.length} more designs <span class="pro-tag">PRO</span>`;
  // Collapsed, the top of the next row peeks out under the fade.
  wrap.style.maxHeight = state.tilesExpanded
    ? `${wrap.scrollHeight}px`
    : `${extras[0].offsetTop + extras[0].offsetHeight * 0.45}px`;
}

function updateChrome() {
  const locked = isLocked(state.template);
  $('proBanner').hidden = !locked;
  $('download').innerHTML = locked ? `${LOCK_SVG} Unlock Pro to download` : state.size === 'all' ? 'Download all 3 sizes' : 'Download PNG';
  $('upsell').hidden = isPro() || locked;
  $('sizeTabs').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === state.size)));
  const badge = $('plan-badge');
  badge.textContent = planInfo().name;
  badge.classList.toggle('pro', isPro());
  $('logoUpload').classList.toggle('locked', !isPro());
  const all = $('downloadAll');
  all.hidden = !state.batch;
  if (state.batch) {
    const n = state.batch.length;
    all.innerHTML = isLocked(state.template) || !isPro() ? `${LOCK_SVG} Download all ${n} (Pro)` : `Download all ${n}`;
  }
  document.querySelectorAll('.tile').forEach((t) => {
    t.setAttribute('aria-pressed', String(t.dataset.key === state.template));
    t.querySelector('.lock').hidden = !isLocked(t.dataset.key);
  });
}

/* ---------- images ---------- */

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Keep stored images small so the brand kit stays well under storage quotas.
async function downscale(file, maxSide, type, quality) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  URL.revokeObjectURL(url);
  if (!img) return null;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale) || maxSide;
  c.height = Math.round(img.height * scale) || maxSide;
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL(type, quality);
}

function setUploadLabel(id, labelId, has, emptyText, fullText) {
  $(labelId).textContent = has ? fullText : emptyText;
  $(labelId).parentElement.classList.toggle('has-file', has);
  $(id).hidden = !has;
}

/* ---------- form ---------- */

function saveBrand() {
  store.set({ brands: state.brands, activeBrand: state.activeBrand });
}

function normaliseBrand(b) {
  const brand = { ...DEFAULT_BRAND, ...b };
  if (!brand.colorsSet) Object.assign(brand, DEFAULT_COLORS);
  if (!FONTS[brand.font]) brand.font = 'inter';
  return brand;
}

// Free and Pro have one brand kit, so the switcher only appears on Agency.
function renderBrandSelect() {
  $('kitSwitcher').hidden = !isAgency();
  $('moreBrands').hidden = isAgency();
  const sel = $('brandSelect');
  sel.innerHTML = '';
  state.brands.forEach((b, i) => sel.append(new Option(b.businessName || `Brand kit ${i + 1}`, i, false, i === state.activeBrand)));
  sel.disabled = state.brands.length < 2;
  const btn = $('newBrand');
  btn.classList.toggle('locked', !isAgency());
  btn.disabled = isAgency() && state.brands.length >= MAX_BRANDS;
  btn.title = btn.disabled ? `Agency includes up to ${MAX_BRANDS} brand kits` : '';
  $('deleteBrand').hidden = !isAgency() || state.brands.length < 2;
}

async function switchBrand(i) {
  state.activeBrand = i;
  state.brand = state.brands[i];
  state.logoImg = await loadImage(state.brand.logo);
  $('matchStatus').hidden = true;
  saveBrand();
  fillForm();
  renderBrandSelect();
  render();
}

function newBrand() {
  if (!isAgency()) return upgrade();
  if (state.brands.length >= MAX_BRANDS) return;
  state.brands.push({ ...DEFAULT_BRAND });
  switchBrand(state.brands.length - 1);
}

function resetBrand() {
  const name = state.brand.businessName || state.brand.website;
  if (!confirm(name ? `Clear the “${name}” brand kit and start again?` : 'Clear this brand kit and start again?')) return;
  state.brands[state.activeBrand] = { ...DEFAULT_BRAND };
  $('logo').value = '';
  switchBrand(state.activeBrand);
}

// Offers the business name from the review page instead of saving it into the brand kit,
// since the page might be someone else's business (an agency client, a competitor, a test).
function renderBusinessSuggestion() {
  const found = (state.review.business || '').trim();
  const btn = $('useBusiness');
  btn.hidden = !found || !!state.brand.businessName.trim();
  btn.textContent = `Use “${found}” from the review page`;
}

function deleteBrand() {
  if (state.brands.length < 2) return;
  if (!confirm(`Delete the “${state.brand.businessName || 'untitled'}” brand kit?`)) return;
  state.brands.splice(state.activeBrand, 1);
  switchBrand(Math.max(0, state.activeBrand - 1));
}

/* ---------- batch ---------- */

function saveBatch() {
  if (state.batch) store.set({ batch: state.batch, batchIndex: state.batchIndex });
}

function renderBatch() {
  const bar = $('batchBar');
  bar.hidden = !state.batch;
  if (!state.batch) return;
  $('batchCount').textContent = `Batch · ${state.batch.length} reviews`;
  $('batchChips').innerHTML = state.batch.map((r, i) => {
    const who = nameParts(r.name)[0] || `Review ${i + 1}`;
    return `<button type="button" class="chip" data-i="${i}" aria-pressed="${i === state.batchIndex}"><b>${i + 1}</b>${who} · ${r.rating}★</button>`;
  }).join('');
}

function selectBatch(i) {
  state.batchIndex = i;
  state.review = state.batch[i];
  saveBatch();
  fillForm();
  renderBatch();
  render();
}

function clearBatch() {
  state.batch = null;
  store.remove('batch');
  renderBatch();
  render();
}

/* ---------- custom design requests ---------- */

// Chrome doesn't autofill forms on extension pages, so prefill what we know:
// details from the last request, or the email on the user's paid ExtensionPay account.
async function openRequest() {
  $('requestFields').hidden = false;
  $('requestDone').hidden = true;
  $('reqError').hidden = true;
  if (!$('reqBusiness').value) $('reqBusiness').value = state.brand.businessName || state.brand.website || '';
  $('request').showModal();
  const { contact } = await store.get(['contact']);
  if (!$('reqName').value && contact?.name) $('reqName').value = contact.name;
  if (!$('reqEmail').value && contact?.email) $('reqEmail').value = contact.email;
  if (!$('reqEmail').value && extpay && isPro()) {
    try {
      const user = await extpay.getUser();
      if (user.email && !$('reqEmail').value) $('reqEmail').value = user.email;
    } catch {} // offline: leave it for the user to type
  }
}

async function submitRequest(e) {
  e.preventDefault();
  const name = $('reqName').value.trim();
  const email = $('reqEmail').value.trim();
  const business = $('reqBusiness').value.trim();
  const message = $('reqMessage').value.trim();
  const error = (msg) => {
    $('reqError').textContent = msg;
    $('reqError').hidden = false;
  };
  if (!name || !message) return error('Please add your name and what you’d like.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Please enter a valid email address so we can reply.');

  store.set({ contact: { name, email } });
  const subject = `Custom design request: ${business || name}`;
  const body = `Name: ${name}\nEmail: ${email}\nBusiness: ${business || '-'}\nPlan: ${planInfo().name}\n\n${message}`;
  const done = (title, text) => {
    $('requestDone').querySelector('h4').textContent = title;
    $('requestDoneText').textContent = text;
    $('requestFields').hidden = true;
    $('requestDone').hidden = false;
  };

  if (REQUEST_ENDPOINT) {
    const btn = $('reqSubmit');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch(REQUEST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, business, plan: planInfo().name, message, _subject: subject })
      });
      if (!res.ok) throw new Error();
      $('reqMessage').value = '';
      return done('Request sent', `Thanks ${name.split(' ')[0]}! We'll reply to ${email}.`);
    } catch {
      // Fall through to email so the request isn't lost.
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send request';
    }
  }

  const a = document.createElement('a');
  a.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  a.click();
  done('Request ready to send', `Your email app should have opened with your request filled in. Just press send. If nothing opened, email ${CONTACT_EMAIL} directly.`);
}

function bindReview(id, key = id) {
  $(id).addEventListener('input', (e) => {
    state.review[key] = e.target.value;
    if (state.batch) {
      saveBatch();
      if (key === 'name' || key === 'rating') renderBatch();
    }
    if (key === 'text') $('headline').placeholder = autoHeadline(cleanText(e.target.value)) || 'Picked from the review automatically';
    render();
  });
}

function bindBrand(id, key = id) {
  $(id).addEventListener('input', (e) => {
    state.brand[key] = e.target.value;
    if (['primary', 'accent', 'text'].includes(key)) state.brand.colorsSet = true;
    if (key === 'businessName') {
      renderBrandSelect();
      renderBusinessSuggestion();
    }
    saveBrand();
    render();
  });
}

function fillForm() {
  $('text').value = state.review.text;
  $('headline').value = state.review.headline;
  $('headline').placeholder = autoHeadline(cleanText(state.review.text));
  $('name').value = state.review.name;
  $('rating').value = String(state.review.rating);
  $('source').value = state.review.source || 'Other';
  $('firstOnly').checked = state.firstOnly;
  $('website').value = state.brand.website;
  $('businessName').value = state.brand.businessName;
  $('handle').value = state.brand.handle;
  $('primary').value = state.brand.primary;
  $('accent').value = state.brand.accent;
  $('textColor').value = state.brand.text;
  $('font').value = state.brand.font;
  setUploadLabel('clearLogo', 'logoLabel', !!state.brand.logo, 'Upload logo', 'Logo added · replace');
  renderBusinessSuggestion();
  setUploadLabel('clearBg', 'bgLabel', !!state.bgImage, 'Upload image', 'Image added · replace');
  document.querySelectorAll('.segmented').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state.style[seg.dataset.style])));
  });
}

const SIZE_TABS = { post: 'Post', story: 'Story', landscape: 'LinkedIn', all: 'All sizes' };

function setSize(size) {
  state.size = size;
  $('size').value = size;
  store.set({ lastSize: size });
  render();
}

function buildControls() {
  const tiles = $('tiles');
  Object.entries(TEMPLATES).forEach(([key, t], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = i < VISIBLE_TILES ? 'tile' : 'tile extra';
    b.dataset.key = key;
    b.innerHTML = `
      <span class="thumb"><canvas data-key="${key}"></canvas><span class="lock" hidden>${LOCK_SVG}</span></span>
      <span class="name">${t.label}${t.pro ? ' <span class="pro-tag">PRO</span>' : ''}</span>`;
    b.addEventListener('click', () => {
      state.template = key;
      store.set({ lastTemplate: key });
      render();
    });
    tiles.append(b);
  });
  // Start expanded if the saved design is one of the extras.
  state.tilesExpanded = Object.keys(TEMPLATES).indexOf(state.template) >= VISIBLE_TILES;
  $('viewMore').addEventListener('click', () => {
    state.tilesExpanded = !state.tilesExpanded;
    layoutTiles();
    if (!state.tilesExpanded) $('tilesWrap').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  for (const [key, s] of Object.entries(SIZES)) $('size').append(new Option(s.label, key, false, key === state.size));
  $('size').append(new Option('View all sizes side by side', 'all', false, state.size === 'all'));
  $('multi').innerHTML = Object.entries(SIZES).map(([key, s]) =>
    `<figure style="flex:${s.w / s.h} 1 0"><canvas data-size="${key}"></canvas><figcaption>${s.label}</figcaption></figure>`
  ).join('');
  $('size').addEventListener('change', (e) => setSize(e.target.value));

  // Tabs above the preview mirror the Size dropdown.
  const shape = (w, h) => {
    const k = 14 / Math.max(w, h);
    return `<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="${8 - (w * k) / 2}" y="${8 - (h * k) / 2}" width="${w * k}" height="${h * k}" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  };
  $('sizeTabs').innerHTML = [
    ...Object.entries(SIZES).map(([key, sz]) => `<button type="button" data-size="${key}">${shape(sz.w, sz.h)}${SIZE_TABS[key]}</button>`),
    `<button type="button" data-size="all"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="4" width="5" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="7.5" y="2" width="3.5" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="11" width="14" height="3.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>${SIZE_TABS.all}</button>`
  ].join('');
  $('sizeTabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-size]');
    if (b) setSize(b.dataset.size);
  });

  for (const [key, f] of Object.entries(FONTS)) $('font').append(new Option(f.label, key));

  document.querySelectorAll('.segmented').forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.style[seg.dataset.style] = b.dataset.value;
      seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      store.set({ style: state.style });
      render();
    });
  });
}

function showStatus(html, error = false) {
  const el = $('matchStatus');
  el.hidden = false;
  el.classList.toggle('error', error);
  el.innerHTML = html;
}

async function matchColours() {
  const raw = $('website').value.trim();
  if (!raw) return showStatus('Enter your website first.', true);
  const btn = $('matchColours');
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const found = await detectSiteBrand(raw);
    Object.assign(state.brand, {
      primary: found.primary,
      accent: found.accent,
      text: found.text,
      colorsSet: true,
      website: raw
    });
    if (!state.brand.businessName && found.name) state.brand.businessName = found.name;
    if (!state.brand.handle) state.brand.handle = found.host;
    saveBrand();
    fillForm();
    renderBrandSelect();
    render();
    const sw = (c) => `<span class="swatch" style="background:${c}"></span>`;
    showStatus(`${sw(found.primary)}${sw(found.accent)} Matched colours from ${found.host}`);
  } catch (err) {
    showStatus(err.message || 'Couldn’t read that site.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Match';
  }
}

const fileSlug = () => (state.brand.businessName || 'review').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const toPng = (c) => new Promise((r) => c.toBlob(r, 'image/png'));

// Builds a .zip from [{ name, blob }]. Files are stored uncompressed: PNGs are already compressed.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
async function makeZip(files) {
  const enc = new TextEncoder();
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const name = enc.encode(f.name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local, name, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(12, time, true);
    cd.setUint16(14, date, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(cd, name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((n, p) => n + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

async function download() {
  if (isLocked(state.template)) return upgrade();
  if (state.size !== 'all') {
    canvas.toBlob((blob) => saveBlob(blob, `${fileSlug()}-${state.template}-${state.size}.png`), 'image/png');
    return;
  }
  const files = [];
  for (const c of $('multi').querySelectorAll('canvas')) {
    files.push({ name: `${fileSlug()}-${state.template}-${c.dataset.size}.png`, blob: await toPng(c) });
  }
  saveBlob(await makeZip(files), `${fileSlug()}-${state.template}-all-sizes.zip`);
}

// Renders every review in the batch with the current design, one PNG per review and size, in one zip.
async function downloadAll() {
  if (!isPro()) return upgrade();
  const btn = $('downloadAll');
  btn.disabled = true;
  const files = [];
  try {
    for (let i = 0; i < state.batch.length; i++) {
      btn.textContent = `Saving ${i + 1} of ${state.batch.length}…`;
      state.review = state.batch[i];
      for (const size of activeSizes()) {
        const { w, h } = SIZES[size];
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        paint(c, state.template, w, h);
        files.push({ name: `${fileSlug()}-${i + 1}-${state.template}-${size}.png`, blob: await toPng(c) });
      }
    }
    btn.textContent = 'Zipping…';
    saveBlob(await makeZip(files), `${fileSlug()}-${state.batch.length}-reviews-${state.template}.zip`);
  } finally {
    state.review = state.batch[state.batchIndex];
    btn.disabled = false;
    updateChrome();
  }
}

async function init() {
  const saved = await store.get([
    'brands', 'activeBrand', 'brand', 'pendingReview', 'pendingBatch', 'batch', 'batchIndex',
    'plan', 'lastTemplate', 'lastSize', 'style', 'bgImage'
  ]);
  if (saved.plan) state.plan = saved.plan;
  // `brand` is the single brand kit saved by earlier versions.
  const brands = saved.brands?.length ? saved.brands : saved.brand ? [saved.brand] : [{}];
  state.brands = brands.map(normaliseBrand);
  state.activeBrand = isAgency() ? Math.min(saved.activeBrand || 0, state.brands.length - 1) : 0;
  state.brand = state.brands[state.activeBrand];
  Object.assign(state.style, saved.style || {});
  if (saved.lastTemplate && TEMPLATES[saved.lastTemplate]) state.template = saved.lastTemplate;
  if (saved.lastSize && (SIZES[saved.lastSize] || saved.lastSize === 'all')) state.size = saved.lastSize;
  state.bgImage = saved.bgImage || null;
  const incoming = saved.pendingBatch?.[0] || saved.pendingReview;
  if (saved.pendingBatch?.length) {
    state.batch = saved.pendingBatch.map((r) => ({ ...EMPTY_REVIEW, ...r }));
    state.batchIndex = 0;
    state.review = state.batch[0];
    saveBatch();
  } else if (saved.pendingReview) {
    state.review = { ...SAMPLE_REVIEW, ...saved.pendingReview };
    store.remove('batch');
  } else if (saved.batch?.length) {
    state.batch = saved.batch;
    state.batchIndex = Math.min(saved.batchIndex || 0, saved.batch.length - 1);
    state.review = state.batch[state.batchIndex];
  }
  store.remove('pendingReview');
  store.remove('pendingBatch');
  store.remove('brand');
  [state.logoImg, state.bgImg, state.markImg] = await Promise.all([
    loadImage(state.brand.logo), loadImage(state.bgImage), loadImage('assets/logo.png')
  ]);

  buildControls();
  fillForm();
  renderBrandSelect();
  renderBatch();

  bindReview('text');
  bindReview('headline');
  bindReview('name');
  bindReview('rating');
  bindReview('source');
  bindBrand('website');
  bindBrand('businessName');
  bindBrand('handle');
  bindBrand('primary');
  bindBrand('accent');
  bindBrand('textColor', 'text');
  bindBrand('font');

  $('firstOnly').addEventListener('change', (e) => {
    state.firstOnly = e.target.checked;
    render();
  });

  $('website').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') matchColours();
  });
  $('matchColours').addEventListener('click', matchColours);

  // Logo upload is a Pro feature: free users get the upgrade dialog instead of the file picker.
  $('logo').addEventListener('click', (e) => {
    if (isPro()) return;
    e.preventDefault();
    upgrade();
  });
  $('logo').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    state.brand.logo = await downscale(file, 512, 'image/png');
    state.logoImg = await loadImage(state.brand.logo);
    saveBrand();
    fillForm();
    render();
  });
  $('clearLogo').addEventListener('click', () => {
    state.brand.logo = null;
    state.logoImg = null;
    $('logo').value = '';
    saveBrand();
    fillForm();
    render();
  });

  $('bgImage').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    state.bgImage = await downscale(file, 1920, 'image/jpeg', 0.86);
    state.bgImg = await loadImage(state.bgImage);
    store.set({ bgImage: state.bgImage });
    // Show the image straight away on a design that uses it.
    if (!['editorial', 'glass', 'testimonial', 'luxe', 'polaroid', 'duotone'].includes(state.template)) {
      state.template = 'glass';
      store.set({ lastTemplate: 'glass' });
    }
    fillForm();
    render();
  });
  $('clearBg').addEventListener('click', () => {
    state.bgImage = null;
    state.bgImg = null;
    $('bgImage').value = '';
    store.remove('bgImage');
    fillForm();
    render();
  });

  $('download').addEventListener('click', download);
  $('downloadAll').addEventListener('click', downloadAll);
  $('batchChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) selectBatch(Number(chip.dataset.i));
  });
  $('clearBatch').addEventListener('click', clearBatch);

  $('brandSelect').addEventListener('change', (e) => switchBrand(Number(e.target.value)));
  $('newBrand').addEventListener('click', newBrand);
  $('deleteBrand').addEventListener('click', deleteBrand);
  $('resetBrand').addEventListener('click', resetBrand);
  $('moreBrands').addEventListener('click', upgrade);
  $('useBusiness').addEventListener('click', () => {
    state.brand.businessName = (state.review.business || '').trim();
    saveBrand();
    fillForm();
    renderBrandSelect();
    render();
  });

  $('requestDesign').addEventListener('click', openRequest);
  $('requestForm').addEventListener('submit', submitRequest);
  document.querySelectorAll('#request [data-close]').forEach((b) => b.addEventListener('click', () => $('request').close()));
  $('contactLink').href = `mailto:${CONTACT_EMAIL}`;
  for (const id of ['goPro', 'bannerUnlock']) {
    $(id).addEventListener('click', (e) => {
      e.preventDefault();
      upgrade();
    });
  }
  $('plans').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-plan]');
    if (b) startCheckout(b.dataset.plan, b);
  });
  $('restore').addEventListener('click', () => extpay?.openLoginPage());
  $('manage').addEventListener('click', () => extpay?.openPaymentPage());

  if (extpay) {
    // background.js saves the plan when a payment goes through.
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.plan) setPlan(changes.plan.newValue);
    });
    // Re-check when the user comes back from the checkout or billing tab.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshPlan();
    });
    refreshPlan();
  } else {
    // Design preview outside the extension: shift-click the plan badge to cycle Free → Pro → Agency.
    $('plan-badge').addEventListener('click', (e) => {
      if (!e.shiftKey) return;
      const order = PLANS.map((p) => p.id);
      setPlan(order[(order.indexOf(state.plan) + 1) % order.length]);
    });
  }

  render();
}

init();
