# ReviewPost: Chrome Web Store submission pack

Every field in the Chrome Web Store Developer Dashboard, in the order you'll meet them, with copy to paste. Google renames labels from time to time, so match by meaning if one differs.

Fields marked **(from the zip)** can't be typed in the dashboard. They come from `manifest.json`, so they're already set in the package.

---

## 1. Account tab (one-off, before your first item)

| Field | What to enter | Why it matters |
|---|---|---|
| Publisher name | **Will Tarpey** (or **ReviewPost** if you'd rather the brand show) | Shown as "Offered by" on the listing. |
| Contact email | hello@willtarpey.com, then click the verification link Google sends | You can't publish until it's verified. |
| Trader / non-trader | **Trader** | You charge subscriptions, so you're a trader under the EU Digital Services Act. |
| Trader details | Business name, address, phone, email | Shown to EU users. Use a business or virtual address if you don't want your home address public. |
| Verified publisher (domain) | Verify **willtarpey.com** in Google Search Console with the same Google account | Lets you set willtarpey.com as the Official URL and adds a "verified" link on the listing, which builds trust. |

---

## 2. Package tab

Upload `../dist/reviewpost-1.0.0.zip`.

For each later update, bump `"version"` in `manifest.json` (1.0.1, 1.1.0 …), rebuild the zip, and upload again.

---

## 3. Store listing tab

### Title (from the zip)
```
ReviewPost: Turn Reviews into Social Posts
```
42 of 75 characters. The words after the colon are what people search for ("reviews", "social posts"), which helps the listing show up in search. Your toolbar and menus still say plain **ReviewPost** through `short_name`.

### Summary (from the zip)
```
Turn Google & Trustpilot reviews into branded Instagram, Story and LinkedIn posts in one click. 21 designs that match your brand.
```
129 of 132 characters. This line shows in search results, so it carries the main keywords: Google, Trustpilot, reviews, Instagram, Story, LinkedIn, posts, branded.

### Description
```
Your happiest customers are already doing your marketing. ReviewPost turns their Google and Trustpilot reviews into social media posts people stop scrolling for, in seconds, without opening a design app.

✦ ONE CLICK FROM YOUR REVIEWS
A "Make post" button appears under every review on Google Maps and Trustpilot. Click it and the review opens in the ReviewPost editor, ready to download. On any other site, highlight a review, right-click and choose "Make a ReviewPost from this review".

✦ DESIGNS THAT LOOK LIKE YOUR BRAND
• Type in your website and ReviewPost matches your brand colours automatically
• Pick your font, rounded or sharp stars, rounded or square corners
• Add your logo and your own background photos (Pro)

✦ 21 TESTIMONIAL DESIGNS, EVERY SIZE
Spotlight, Card and Bold are free. Pro unlocks 18 more: Editorial, Poster, Glass, Testimonial, Luxe, Aurora, Minimal, Split, Bubble, Neon, Polaroid, Badge, Ticket, Duotone, Shapes, Stack, Score and Marker, with more on the way.
Every design works as:
• an Instagram or Facebook post (1080×1080)
• an Instagram Story, Reel or TikTok cover (1080×1920)
• a LinkedIn or Facebook link post (1200×627)
Switch sizes with one tap, preview all three side by side and download them together.

✦ BATCH MODE
Got lots of great reviews? Send up to 10 from a page to the editor at once and download a post for each in one go (Pro).

✦ BUILT FOR AGENCIES AND SOCIAL MEDIA MANAGERS
Manage up to 5 client brand kits, share your plan with 3 teammates and get up to 3 bespoke templates designed for your clients.

✦ PRIVATE BY DESIGN
Your reviews, brand kits and images stay in your browser. ReviewPost only reads a page when you click one of its buttons. No tracking, no ads, no account needed to start.

PLANS
• Free: 3 designs, brand colour matching, every size (small "Made with ReviewPost" mark)
• Pro (£8/month): all 21 designs, no watermark, your logo, background images, batch mode
• Agency (£29/month): everything in Pro, plus 5 brand kits, 3 team seats, 3 bespoke templates and priority support

Perfect for cafés, salons, trades, clinics, gyms, shops, estate agents, restaurants and anyone who gets great reviews and wants more people to see them.

Need a design made just for you? Use "Request a custom design" in the editor.

Questions or ideas? hello@willtarpey.com
```

Why it's written this way:
- The first two lines show before "Read more", so they say what it does and who it's for straight away.
- Keywords people search for appear naturally: Google reviews, Trustpilot, testimonial, Instagram, Story, LinkedIn, Facebook, social media, brand.
- The business-type line at the end helps with searches like "salon reviews" without keyword stuffing, which Google penalises.

### Category
**Productivity → Workflow & Planning**. **Lifestyle → Art & Design** is the alternative: smaller, so you'd rank higher in the category, but fewer business owners browse it. Start with Workflow & Planning and switch if installs are slow.

### Language
English (UK)

### Graphic assets (in `images/`)

| Field | File | Size | Notes |
|---|---|---|---|
| Store icon | `../reviewshot/icons/icon-128.png` | 128×128 | The wavy RP badge. |
| Screenshots (up to 5) | `screenshot-1-hero.png` … `screenshot-5-brand.png` | 1280×800 | Upload in this order. The first one shows in search results, so it's the hero. |
| Global promo video (optional) | A YouTube link | n/a | **Strongly recommended.** See the video plan below. |
| Small promo tile | `promo-small.png` | 440×280 | Used in category pages and search. |
| Marquee promo tile | `promo-marquee.png` | 1400×560 | Only used if Google features you, but upload it so you're eligible. |

### Additional fields

| Field | What to enter |
|---|---|
| Official URL | willtarpey.com (only selectable once the domain is verified in Search Console) |
| Homepage URL | https://willtarpey.com, or a ReviewPost landing page if you make one (it's worth it: link it from your socials and the listing) |
| Support URL | mailto:hello@willtarpey.com (or a contact page on willtarpey.com) |
| Mature content | **No** |

---

## 4. Privacy practices tab

### Single purpose
```
ReviewPost turns customer reviews into branded social media images. Users click a button under a review (or right-click selected review text), then design and download the post in the extension's editor.
```

### Permission justifications

| Permission | Justification to paste |
|---|---|
| `contextMenus` | Adds a "Make a ReviewPost from this review" option to the right-click menu, so users can turn highlighted review text on any website into a post. |
| `storage` | Saves the user's brand kits, design settings, the review being edited and their plan locally in the browser. Also used by our payment provider (ExtensionPay) to remember the user's subscription. |
| Host permissions (content scripts on google.com, google.co.uk, trustpilot.com, uk.trustpilot.com) | Adds a "Make post" button under each review on Google Maps and Trustpilot. The script reads a review's text, author name and rating only when the user clicks that button. |
| Host permission: extensionpay.com | Required by ExtensionPay, our payment provider, to confirm when a user's payment has completed so their plan unlocks. |
| Optional host permissions (`https://*/*`, `http://*/*`) | Requested at run time for one site only, when the user enters their own website and clicks "Match", so the extension can read that site's public pages to detect their brand colours. Never requested automatically. |

### Remote code
**No, I am not using remote code.**
```
All JavaScript is bundled in the package, including ExtPay.js and the qrcode-generator library. Google Fonts provides stylesheets and font files only, not code.
```

### Data usage
Tick only what leaves the user's device:
- ☑ **Personally identifiable information**: email address, collected by ExtensionPay when a user upgrades, and the name and email in custom design requests the user chooses to send (delivered via Formspree).
- ☑ **Financial and payment information**: payments are processed by Stripe through ExtensionPay. ReviewPost never sees card details, but the payment flow is part of the extension, so declaring it is the safer choice.
- ☐ Everything else (health, authentication information, personal communications, location, web history, user activity, website content). Review text and website colours are processed in the browser and not sent anywhere.

Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL
```
https://reviewpost-privacy.netlify.app
```
This is the same file as `../reviewshot/privacy.html`. If you change the policy, update both and re-upload to Netlify.

---

## 5. Distribution tab

| Field | What to choose |
|---|---|
| Payments / pricing | **Free** (the extension is free to install; subscriptions are handled by ExtensionPay, not the Chrome Web Store). If there's an "in-app purchases" option, tick it. |
| Visibility | **Public**. Use **Unlisted** for a soft launch if you want friends to test via the link first; switching to Public later doesn't need another review. |
| Regions | **All regions**. Prices are in £, which Stripe converts at checkout, so there's no reason to limit it. |

---

## 6. Test instructions tab (for Google's reviewers)

Clear instructions mean a faster review and fewer rejections. 500 characters max; this is 476.

```
No login needed.
1. On Google Maps, open a business's Reviews tab and click "✦ Make post" under a review. (Also works on uk.trustpilot.com, or highlight text on any site, right-click, "Make a ReviewPost".)
2. Change design, size, colours and font, then click "Download PNG".
3. "Your website" → "Match" asks to read that one site and fills in its brand colours.
Pro designs preview with a watermark. Upgrading opens ExtensionPay's Stripe checkout; no payment needed to review.
```

---

## 7. Promo video plan (30–45 seconds, screen recording)

Listings with a video tend to convert better. Record on a Mac with ⌘⇧5, no voiceover needed, and add captions:

1. **0–5s:** Google Maps reviews. Caption: "Got great reviews?"
2. **5–12s:** Click "✦ Make post". Editor opens. Caption: "One click."
3. **12–22s:** Click through 4–5 designs, then type your website and hit Match. Caption: "Matched to your brand."
4. **22–30s:** Click the Story and LinkedIn tabs, then All sizes. Caption: "Every size."
5. **30–40s:** Download, then show the post on an Instagram mockup. End card: ReviewPost logo + "Free on the Chrome Web Store".

Upload to YouTube as Public or Unlisted and paste the link.

---

## 8. After you submit: getting traction

- **First reviews matter most.** Ask 5–10 friendly business owners to install it, make a post and leave an honest rating. Listings with a few ratings rank much higher than ones with none.
- **Reply to every review**, good or bad. It shows as active support.
- **Use the product to market itself.** Post ReviewPost-made images of your own reviews, and the "Made with ReviewPost" mark on free posts advertises for you.
- **Share where business owners are:** local business Facebook groups, r/smallbusiness, LinkedIn, and Product Hunt on launch day.
- **Update regularly.** New designs every few weeks give you something to post about, and recently updated extensions rank better.
