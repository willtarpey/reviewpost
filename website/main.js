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

/* Designs marquee: a second copy of the images makes the loop seamless. */
const track = document.querySelector('.marquee-track');
[...(track?.children || [])].forEach((img) => {
  const copy = img.cloneNode(true);
  copy.alt = '';
  copy.setAttribute('aria-hidden', 'true');
  track.append(copy);
});

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
