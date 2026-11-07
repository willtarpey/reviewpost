// Opens the editor with a review, from the injected button, the right-click menu or the toolbar icon.
// Also runs ExtensionPay, which confirms payments here and saves the new plan for the editor to pick up.

importScripts('vendor/ExtPay.js', 'billing.js');
extpay.startBackground();
extpay.onPaid.addListener((user) => {
  chrome.storage.local.set({ plan: planFromUser(user) });
});

const MENU_ID = 'reviewshot-selection';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Make a ReviewPost from this review',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;
  let source = 'Other';
  try {
    const host = new URL(info.pageUrl).hostname;
    if (host.includes('google.')) source = 'Google';
    else if (host.includes('trustpilot.')) source = 'Trustpilot';
    else if (host.includes('facebook.')) source = 'Facebook';
    else if (host.includes('tripadvisor.')) source = 'Tripadvisor';
    else if (host.includes('etsy.')) source = 'Etsy';
  } catch {}
  openEditor({ pendingReview: { text: info.selectionText, name: '', rating: 5, source, business: '' } });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'open-editor') openEditor({ pendingReview: msg.review });
  if (msg?.type === 'open-editor-batch') openEditor({ pendingBatch: msg.reviews });
});

chrome.action.onClicked.addListener(() => openEditor());

async function openEditor(pending) {
  if (pending) await chrome.storage.local.set(pending);
  chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') });
}
