# ReviewPost — first version

Turns a customer review into a branded social post in one click.

## Try it in Chrome

1. Go to `chrome://extensions` and switch on **Developer mode** (top right).
2. Click **Load unpacked** and pick this folder.
3. Use it in any of three ways:
   - **Google Maps** (a business's Reviews tab) or **Trustpilot**: click **✦ Make post** under a review.
   - **Any site**: highlight the review text, right-click, then **Make a ReviewPost from this review**.
   - **Toolbar icon**: opens the editor with a sample review.
4. Pick a design tile, set the star and corner styles, then **Download PNG**. Choose **View all sizes side by side** under Size to preview and download all three sizes at once.

To work on the editor design without reloading the extension, open `editor.html` through any local web server. It falls back to localStorage outside Chrome.

**Previewing plans:** when `editor.html` is opened outside the extension, shift-click the plan badge to cycle Free → Pro → Agency.

## Designs

| Design | Plan | Inspired by |
|---|---|---|
| Spotlight | Free | Centred quote with an accent glow |
| Card | Free | White card with avatar, stars and a divider |
| Bold | Free | Heavy type, accent bar and name chip |
| Editorial | Pro | Agency posts: giant uppercase headline over a photo, corner labels |
| Poster | Pro | "FREE GUIDE" post: flat accent colour, type filling the width, arrow |
| Glass | Pro | Studuo testimonial: big frosted card over a photo |
| Testimonial | Pro | Serif + script "Customer Review" title, white card, overlapping avatar |
| Luxe | Pro | Organic soap post: blurred warm photo, small caps, outline stars |
| Aurora | Pro | Blurred brand-colour glow with glass pill and chip |
| Minimal | Pro | Paper background, serif quote, hairline rule |
| Split | Pro | Colour panel with the score beside a white quote panel |
| Bubble | Pro | Speech bubble with a tail pointing at the reviewer |
| Neon | Pro | Dark background, glowing type and frame |
| Polaroid | Pro | Tilted instant photo (uses the background image), quote in the caption |
| Badge | Pro | Round seal with the score and repeating text around the edge |
| Ticket | Pro | Event ticket with notches, perforation and a barcode stub |
| Duotone | Pro | Background image recoloured in the two brand colours |
| Shapes | Pro | Geometric accent shapes around the quote |
| Stack | Pro | White card on two tilted brand-colour cards |
| Score | Pro | Huge rating number, then the quote |
| Marker | Pro | Headline with highlighter strokes on paper |

- **Total:** 21 designs, 3 free and 18 Pro. The first nine show in the editor; the other twelve (from `templates-more.js`) sit under a fade behind **View 12 more designs**. Change `VISIBLE_TILES` in `editor.js` to show more or fewer before the fade.
- **Stars:** every design shows the star rating.
- **Style options:** every design follows the **Stars** (Rounded / Sharp) and **Corners** (Rounded / Square) settings.
- **Headline:** the big-type designs pick a short headline from the review automatically. Users can override it with the Headline field.
- **Display fonts:** Pro designs use their own display fonts (Archivo Black, Oswald, Allura, Cinzel, Cormorant Garamond, Bodoni Moda) alongside the brand font.
- **Free plan:** free designs get a small "Made with" + white ReviewPost logo in the bottom-right corner.
- **Locked designs:** Pro designs show a few diagonal white ReviewPost logos at 50% opacity, and the download button opens the upgrade dialog.

## Brand kit

- **Default colours:** until a business sets its own, everything uses the ReviewPost palette (`#16170f` dark, `#eefca6` lime).
- **Match colours:** the user enters their website and clicks **Match**.
  - The extension asks permission to read that one site, then picks the main colours from its CSS variables, `theme-color` tag, stylesheets and icon (see `palette.js`).
  - It also fills in the business name and handle if they're empty.
- **Logo upload:** Pro only. On the free plan the upload opens the upgrade dialog, and saved logos aren't drawn.

## Files

| File | What it does |
|---|---|
| `manifest.json` | Extension config (name, permissions, which sites get buttons) |
| `content.js` / `content.css` | Injects the "Make post" button on review sites. Selectors are in `SITES` at the top |
| `background.js` | Right-click menu and toolbar icon; opens the editor |
| `editor.html` / `editor.css` / `editor.js` | The editor UI: tiles, style toggles, brand kit, upgrade dialog |
| `templates.js` | The first nine designs, plus fonts, sizes, glass effect, watermarks and drawing helpers |
| `templates-more.js` | The twelve extra Pro designs (loads after `templates.js`) |
| `palette.js` | Website colour matching |
| `privacy.html` | Privacy policy (built in; also uploadable to your site) |
| `billing.js` | ExtensionPay ID, plan nicknames and plan lookup |
| `vendor/ExtPay.js` | ExtensionPay library (3.1.2) |
| `icons/` | Extension icons made from the RP mark (`icon-source.png` is the original) |
| `assets/logo.png` | ReviewPost wordmark |

## For the designer

- **New designs:** each design is a `draw()` function in `templates.js`, marked `pro: true` if it's paid. Mock new ones up at 1080×1080 and 1080×1920. Sizes scale off the shorter side, so one design covers every format.
- **Fonts:** post fonts come from Google Fonts (link in `editor.html`, list in `FONTS` in `templates.js`). To add one, add it to both.
- **Colours:** the editor's colours are CSS variables at the top of `editor.css`. The lime is `--lime: #eefca6`.
- **Still to design:**
  - the injected button
  - Chrome Web Store screenshots (1280×800) and a promo tile (440×280)

## Known limits

- **More sites:** Facebook, Tripadvisor and Etsy work through right-click only for now.
- **Upkeep:** the Google and Trustpilot selectors break when those sites change their pages, so check them before launch.

## Plan features

- **Batch mode (Pro):** on Google Maps or Trustpilot, a floating **✦ Make posts from N reviews** button sends up to 10 reviews (best-rated first) to the editor. Switch between them in the batch bar, then **Download all** saves one PNG per review in the current design and size. Chrome may ask once to allow multiple downloads.
- **Brand kits (Agency):** up to 5, switched from the dropdown at the top of the Brand kit section. On other plans only the first kit is used. Kits are stored in `brands`/`activeBrand`, and the single `brand` key from earlier versions is migrated automatically.
- **Team seats (Agency):** teammates install ReviewPost and use **Already paid? Restore your plan** with the Agency account email. The plan window explains this to Agency users. ExtensionPay doesn't enforce a seat limit, so "3 seats" is a fair-use term.
- **Custom design requests:** the **Request a custom design** card under the designs opens a form. Requests are sent through Formspree (`REQUEST_ENDPOINT` at the top of `editor.js`) and forwarded to the email on your Formspree account. If Formspree can't be reached, the user's email app opens with the request to hello@willtarpey.com instead.
- **Privacy policy:** `privacy.html` is built in and linked from the editor footer and the plan window. It's a single self-contained file, so the same file can be uploaded to your website for the Web Store's privacy policy URL.

## Releasing

- Store listing copy, permission justifications and images: `../store-listing/` (see `STORE_LISTING.md`).
- To rebuild the images, start the `store-listing` preview server and run `../store-listing/source/render.sh`.
- Package: `../dist/reviewpost-1.0.0.zip` (excludes this README and the icon source). Bump `version` in `manifest.json` for each update.

## Payments

Payments run through [ExtensionPay](https://extensionpay.com), which uses Stripe and handles checkout, sign-in and who has paid, so there's no server to run. The code is in place; it needs your account to switch on.

### Setting it up

1. Sign up at extensionpay.com and register the extension. Note the extension ID it gives you.
2. Connect your Stripe account in the ExtensionPay dashboard.
3. Create two monthly plans with these nicknames: `pro` (£8) and `agency` (£29).
4. `EXTPAY_ID` in `billing.js` is set to `reviewpost`. If you used different plan nicknames, update `PLAN_NICKNAMES` there too.
5. Reload the extension at `chrome://extensions`.

While the extension is loaded unpacked, ExtensionPay treats it as a development install, so you can test checkout with Stripe test cards. Check ExtensionPay's docs for current details.

### How it works

| Step | What happens | Code |
|---|---|---|
| Upgrade | "Upgrade to Pro/Agency" opens ExtensionPay's checkout for that plan in a new tab | `startCheckout()` in `editor.js` |
| Payment confirmed | The background script hears about it and saves the new plan | `onPaid` in `background.js` |
| Unlock | The editor sees the saved plan and unlocks immediately | storage listener in `editor.js` |
| Re-checks | Each time the editor opens or comes back into focus, it asks ExtensionPay for the current plan (so cancellations take effect). If it can't reach ExtensionPay, it keeps the last known plan | `refreshPlan()` |
| Restore | **Already paid? Restore your plan** lets people sign in with their email on a new device | `openLoginPage()` |
| Manage | Paying users get **Manage billing** to switch plan or cancel | `openPaymentPage()` |

### Other notes

- The plan is also cached in storage. Someone could edit their local storage to unlock Pro features, which is a normal trade-off for extensions without their own server.
- The shift-click plan switcher only works when `editor.html` is opened outside the extension for design work.
- `vendor/ExtPay.js` is ExtPay 3.1.2 from npm. It's bundled locally because Chrome extensions can't load remote code.
