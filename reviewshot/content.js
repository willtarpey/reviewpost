// Adds a "Make post" button under each review on supported sites, plus a floating button
// that sends every review on the page to the editor at once (batch mode).
// Review sites change their markup often: if buttons stop appearing, update the selectors in SITES.

(() => {
  const MAX_BATCH = 10;

  const SITES = [
    {
      name: 'Trustpilot',
      host: /(^|\.)trustpilot\.com$/,
      card: 'article[data-service-review-card-paper]',
      text: '[data-service-review-text-typography]',
      author: '[data-consumer-name-typography]',
      rating: (card) =>
        Number(card.querySelector('[data-service-review-rating]')?.getAttribute('data-service-review-rating')) || 5,
      business: () => document.querySelector('h1')?.innerText.split('\n')[0].trim() || ''
    },
    {
      // Google Maps place panel (google.com/maps)
      name: 'Google',
      host: /(^|\.)google\.(com|co\.uk)$/,
      card: 'div.jftiEf',
      text: '.wiI7pd',
      author: '.d4r55',
      rating: (card) => parseInt(card.querySelector('.kvMYJc')?.getAttribute('aria-label') || '', 10) || 5,
      business: () => document.querySelector('h1.DUwDvf')?.innerText.trim() || ''
    }
  ];

  const site = SITES.find((s) => s.host.test(location.hostname));
  if (!site) return;

  // Read at click time so text expanded with "More" is included.
  function readCard(card) {
    return {
      text: card.querySelector(site.text)?.innerText.trim() || '',
      name: card.querySelector(site.author)?.innerText.trim() || '',
      rating: site.rating(card),
      source: site.name,
      business: site.business()
    };
  }

  const reviewCards = () => [...document.querySelectorAll(site.card)].filter((c) => c.querySelector(site.text));

  function addButtons() {
    reviewCards().forEach((card) => {
      if (card.dataset.rsDone) return;
      card.dataset.rsDone = '1';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rs-btn';
      btn.textContent = '✦ Make post';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: 'open-editor', review: readCard(card) });
      });
      card.querySelector(site.text).after(btn);
    });
  }

  let batchBtn;
  function updateBatchButton() {
    const count = Math.min(reviewCards().length, MAX_BATCH);
    if (count < 2) {
      batchBtn?.remove();
      batchBtn = null;
      return;
    }
    if (!batchBtn) {
      batchBtn = document.createElement('button');
      batchBtn.type = 'button';
      batchBtn.className = 'rs-batch';
      batchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Best-rated first, keeping page order within each rating.
        const reviews = reviewCards().map(readCard).filter((r) => r.text)
          .sort((a, b) => b.rating - a.rating).slice(0, MAX_BATCH);
        chrome.runtime.sendMessage({ type: 'open-editor-batch', reviews });
      });
      document.body.append(batchBtn);
    }
    batchBtn.textContent = `✦ Make posts from ${count} reviews`;
  }

  function scan() {
    addButtons();
    updateBatchButton();
  }

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(scan, 400);
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
