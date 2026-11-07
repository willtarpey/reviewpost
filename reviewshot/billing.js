// Payments through ExtensionPay (https://extensionpay.com), shared by background.js and the editor.

// Extension ID registered on extensionpay.com.
const EXTPAY_ID = 'reviewpost';

// Plan nicknames as set up in the ExtensionPay dashboard, keyed by ReviewPost plan id.
const PLAN_NICKNAMES = { pro: 'pro', agency: 'agency' };

// Null when the editor is opened outside the extension (local design previews).
const extpay = typeof ExtPay === 'function' && globalThis.chrome?.runtime?.id ? ExtPay(EXTPAY_ID) : null;

// Maps an ExtensionPay user to a ReviewPost plan id: 'free', 'pro' or 'agency'.
function planFromUser(user) {
  if (!user?.paid) return 'free';
  return user.plan?.nickname === PLAN_NICKNAMES.agency ? 'agency' : 'pro';
}
