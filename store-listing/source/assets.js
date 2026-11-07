// Draws real ReviewPost designs (from the extension's templates.js) into store listing mockups.

const SAMPLES = [
  {
    text: 'Absolutely brilliant service from start to finish. The team went above and beyond and I’ve already recommended them to all my friends!',
    headline: 'Absolutely brilliant service from start to finish',
    subtext: 'The team went above and beyond and I’ve already recommended them to all my friends!',
    name: 'Sarah M.', initials: 'SM'
  },
  {
    text: 'Plenty of parking, a gorgeous café and staff who really know their plants. Our new favourite weekend spot!',
    headline: 'Our new favourite weekend spot',
    subtext: 'Plenty of parking, a gorgeous café and staff who really know their plants.',
    name: 'Chris H.', initials: 'CH'
  },
  {
    text: 'Friendly, fast and fairly priced. Couldn’t ask for more. Will definitely be back!',
    headline: 'Friendly, fast and fairly priced',
    subtext: 'Couldn’t ask for more. Will definitely be back!',
    name: 'Amira K.', initials: 'AK'
  }
];

const BRANDS = {
  reviewpost: { businessName: 'Greenleaf Garden Centre', handle: '@greenleafgardens', primary: '#16170f', accent: '#eefca6', text: '#ffffff', font: 'inter' },
  garden: { businessName: 'Greenleaf Garden Centre', handle: '@greenleafgardens', primary: '#22412f', accent: '#f2c46d', text: '#ffffff', font: 'jakarta' },
  bakery: { businessName: 'Crumb & Co.', handle: '@crumbandco', primary: '#7a2e2a', accent: '#f7d9c4', text: '#ffffff', font: 'fraunces' },
  salon: { businessName: 'Studio Nine', handle: '@studionine', primary: '#1d2a4d', accent: '#ff9e7a', text: '#ffffff', font: 'poppins' }
};

function postData(sample, brand, style = {}) {
  return {
    ...sample,
    rating: 5,
    source: 'Google',
    sourceLabel: 'Google review',
    handle: brand.handle,
    brand,
    style: { stars: 'rounded', corners: 'rounded', ...style },
    logo: null,
    bg: null
  };
}

// <canvas class="post" data-design="glass" data-sample="0" data-brand="garden" data-w="1080" data-h="1080">
async function drawPosts() {
  const families = ['Inter', 'Plus Jakarta Sans', 'Poppins', 'Fraunces', 'Playfair Display'];
  await Promise.all([
    ...families.flatMap((f) => ['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 32px "${f}"`))),
    ...DISPLAY_LOADS.map((f) => document.fonts.load(f)),
    document.fonts.load('700 32px "DM Sans"')
  ]);
  document.querySelectorAll('canvas[data-design]').forEach((c) => {
    const w = Number(c.dataset.w || 1080), h = Number(c.dataset.h || 1080);
    c.width = w;
    c.height = h;
    const sample = SAMPLES[Number(c.dataset.sample || 0)];
    const brand = BRANDS[c.dataset.brand || 'reviewpost'];
    const style = {};
    if (c.dataset.corners) style.corners = c.dataset.corners;
    if (c.dataset.stars) style.stars = c.dataset.stars;
    TEMPLATES[c.dataset.design].draw(c.getContext('2d'), w, h, postData(sample, brand, style));
  });
  document.body.dataset.ready = '1';
}

drawPosts();
