// ReviewPost website.

// Every "Add to Chrome" / plan button points here. Replace with the Chrome Web Store link once the
// extension is published: https://chromewebstore.google.com/detail/<your-store-item-id>
const STORE_URL = 'https://chromewebstore.google.com/search/ReviewPost';

const FORM_ENDPOINT = 'https://formspree.io/f/xnppgkzv';

document.querySelectorAll('[data-store]').forEach((a) => {
  a.href = STORE_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});
document.getElementById('year').textContent = new Date().getFullYear();

/* Nav: frosted background once scrolled, and a menu on small screens. */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// The home page has a menu; guide pages have a simpler header without one.
const toggle = document.getElementById('navToggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.getElementById('navLinks').addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* Fade sections in as they scroll into view. */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      // Stagger cards that appear together.
      const siblings = [...en.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
      en.target.style.transitionDelay = `${Math.min(siblings.indexOf(en.target), 5) * 70}ms`;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

/* Parallax: images with data-speed drift up or down as their section scrolls past. */
const drifters = document.querySelectorAll('[data-speed]');
if (drifters.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const mid = innerHeight / 2;
    drifters.forEach((el) => {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > innerHeight + 200) return;
      const offset = box.top + box.height / 2 - mid; // 0 when the section is centred on screen
      el.style.setProperty('--py', `${(offset * Number(el.dataset.speed)).toFixed(1)}px`);
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* Designs carousel: drifts on its own (hover doesn't stop it) and can be swiped, dragged,
   scrolled or stepped with the arrow buttons and keys. A second copy of the images makes it loop. */
const marquee = document.querySelector('.marquee');
const track = marquee?.querySelector('.marquee-track');
if (marquee && track) {
  [...track.children].forEach((img) => {
    const copy = img.cloneNode(true);
    copy.alt = '';
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  });

  const SPEED = 32; // px per second
  const autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
  const loopWidth = () => (track.scrollWidth + gap()) / 2; // width of one set of images
  const step = () => (track.children[0]?.getBoundingClientRect().width || 260) + gap();
  let pos = 0, last = 0, holdUntil = 0, visible = true, dragging = false, glide = null;

  const wrap = (x) => { const w = loopWidth(); return w ? ((x % w) + w) % w : x; };
  const apply = () => { pos = wrap(pos); marquee.scrollLeft = pos; };
  const hold = (ms = 1800) => { holdUntil = performance.now() + ms; };

  // Keep scroll position in sync when the visitor scrolls natively (touch swipe, trackpad).
  marquee.addEventListener('scroll', () => {
    if (Math.abs(marquee.scrollLeft - Math.round(pos)) > 2 && !glide) {
      hold();
      pos = marquee.scrollLeft;
      const w = loopWidth();
      // Near either end, jump to the matching spot in the other copy so swiping never runs out.
      if (pos < 4) pos += w; else if (pos > w + 4) pos -= w; else return;
      marquee.scrollLeft = pos;
    }
  }, { passive: true });
  marquee.addEventListener('touchstart', () => hold(60000), { passive: true });
  marquee.addEventListener('touchend', () => hold(), { passive: true });

  // Mouse drag (touch uses native scrolling).
  let startX = 0, startPos = 0;
  marquee.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; glide = null; startX = e.clientX; startPos = pos;
    marquee.classList.add('dragging');
    marquee.setPointerCapture(e.pointerId);
  });
  marquee.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    pos = startPos - (e.clientX - startX);
    hold(); apply();
  });
  const endDrag = () => { if (!dragging) return; dragging = false; marquee.classList.remove('dragging'); hold(); };
  marquee.addEventListener('pointerup', endDrag);
  marquee.addEventListener('pointercancel', endDrag);

  // Buttons and arrow keys glide by one design.
  const nudge = (dir) => {
    glide = { from: pos, to: pos + dir * step(), start: performance.now() };
    hold(2500);
  };
  document.getElementById('designsPrev')?.addEventListener('click', () => nudge(-1));
  document.getElementById('designsNext')?.addEventListener('click', () => nudge(1));
  marquee.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); nudge(e.key === 'ArrowLeft' ? -1 : 1); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(marquee);
  }

  const tick = (now) => {
    const dt = Math.min(now - (last || now), 64) / 1000;
    last = now;
    if (glide) {
      const t = Math.min((now - glide.start) / 450, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      pos = glide.from + (glide.to - glide.from) * ease;
      apply();
      if (t === 1) glide = null;
    } else if (autoplay && visible && !dragging && now > holdUntil) {
      pos += SPEED * dt;
      apply();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* Video: big play button that hands over to the native controls. */
const video = document.getElementById('promo');
if (video) {
const frame = video.closest('.video-frame');
video.controls = false; // the big play button starts it; native controls appear once it's playing
document.getElementById('play').addEventListener('click', () => video.play());
video.addEventListener('play', () => {
  frame.classList.add('playing');
  video.controls = true;
});
video.addEventListener('ended', () => frame.classList.remove('playing'));
}

/* Contact form: sends to Formspree without leaving the page. */
const form = document.getElementById('contactForm');
if (form) {
const statusEl = document.getElementById('formStatus');
const sendBtn = document.getElementById('sendBtn');
const setStatus = (msg, kind) => {
  statusEl.textContent = msg;
  statusEl.className = `form-status ${kind || ''}`;
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const required = [...form.querySelectorAll('[required]')];
  let firstBad = null;
  required.forEach((el) => {
    const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value.trim()));
    el.classList.toggle('invalid', bad);
    if (bad && !firstBad) firstBad = el;
  });
  if (firstBad) {
    setStatus('Please add your name, a valid email and a message.', 'err');
    firstBad.focus();
    return;
  }
  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending…';
  setStatus('');
  try {
    const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    setStatus('Thanks! Your message is on its way. We’ll be in touch soon.', 'ok');
  } catch {
    setStatus('Sorry, that didn’t send. Please email hello@willtarpey.com instead.', 'err');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send message';
  }
});
form.addEventListener('input', (e) => e.target.classList.remove('invalid'));
}
