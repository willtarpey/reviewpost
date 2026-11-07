# ReviewPost traction plan

How people will find ReviewPost, in order of what pays off soonest. It builds on section 8 of `store-listing/STORE_LISTING.md`, which covers first ratings and replying to reviews.

**The three places people look:**
1. **The Chrome Web Store search**, where people already want an extension.
2. **Google**, for searches like "turn Google reviews into Instagram posts".
3. **AI assistants** (ChatGPT, Gemini, Perplexity, Claude), for questions like "what's the easiest way to post my reviews on Instagram?". This is AEO.

All three reward the same things: a clear, consistent description of what ReviewPost does, pages that answer real questions, and other sites mentioning you.

---

## Already done on the website

- **Structured data** (`index.html`): it tells Google and AI assistants what ReviewPost is, what it costs and what it does, plus the FAQ. The FAQ data is generated from the visible FAQ, so update both together.
- **`llms.txt`**: a plain-English summary of ReviewPost for AI assistants to read.
- **`robots.txt`**: allows every crawler, including AI ones, so assistants can read and cite the site.
- **`sitemap.xml`**: lists the pages for Google and Bing.
- **First guide page**: `guides/turn-google-reviews-into-instagram-posts.html`. It targets the main search people make before they know ReviewPost exists, with a direct answer up top, which is what AI assistants quote.

---

## Week 1: foundations (about 2 hours)

1. **Choose the site's address and put it live.** A dedicated domain like reviewpost.co.uk builds search authority faster than a subfolder or a netlify.app address. Check what's free at a registrar. Then replace `YOUR-DOMAIN` in `robots.txt` and `sitemap.xml`, and set `STORE_URL` in `main.js` once the listing is approved.
2. **Google Search Console.** Add the domain, verify it, and submit `sitemap.xml`. This is also how you verify the domain for the Web Store's Official URL.
3. **Bing Webmaster Tools.** Import from Search Console in one click. ChatGPT's search and Microsoft Copilot use Bing's index, so this matters for AEO as much as for Bing.
4. **Link everything together.** Add the site to the Web Store listing (Homepage URL), the YouTube channel and video description, and your Instagram, LinkedIn and willtarpey.com. Use the same one-line description everywhere: *"ReviewPost turns Google and Trustpilot reviews into branded social posts in one click."* Repeating the same description is how AI assistants learn what ReviewPost is.
5. **Upload the promo video to YouTube.** Title it with the search phrase, for example *"Turn Google Reviews into Instagram Posts in One Click (ReviewPost)"*. Add chapters and the site link in the description. YouTube videos show up in Google results and are often cited by AI assistants.

## Weeks 2–4: launch and listings

6. **Get your first 10 genuine ratings** on the Web Store (section 8 of the listing pack). Don't offer anything in return: Chrome's policies ban incentivised reviews.
7. **List ReviewPost in the free directories** AI assistants and comparison articles draw from: Product Hunt (launch on a Tuesday to Thursday), AlternativeTo (list it as an alternative to design tools and review widgets), SaaSHub, BetaList and Indie Hackers. Each is a link and a mention.
8. **Post where business owners ask the question.** Answer real questions in r/smallbusiness, r/socialmedia and local business Facebook groups ("how do I share my reviews?"). Give a useful answer first and mention ReviewPost as one option. Read each group's rules on self-promotion. AI assistants lean heavily on Reddit threads.
9. **Show it working on LinkedIn and Instagram.** Post one before-and-after a week: a plain Google review next to the finished post. Build-in-public posts about making the extension also do well on LinkedIn.

## Month 2 onwards: content that compounds

10. **One guide a fortnight**, each answering one search. Copy the structure of the first guide: quick answer, steps, sizes, FAQ. Suggested next titles:
    - How to share Trustpilot reviews on social media
    - Instagram Story sizes and safe zones for 2026 (a reference people link to)
    - How to get more Google reviews (and what to do with them)
    - Testimonial post ideas for salons / cafés / trades (one page per industry, each with real examples)
    - How to add customer reviews to LinkedIn
    - Canva vs ReviewPost for review posts (a fair comparison; people search "X vs Y" before deciding)
11. **Ask to be included in "best tools" articles.** Search "best testimonial tools", "tools to share Google reviews" and similar, and email the authors with a one-paragraph pitch and a free Pro month for testing. These articles are a main source for AI assistants' recommendations.
12. **Partner with social media managers and agencies.** They post for many businesses, so one agency means many brands. Offer a referral or a discounted first month on Agency.
13. **Update the extension every few weeks** and announce each new design. Recently updated extensions rank better in the Web Store, and each update is a reason to post.

---

## Built-in growth you already have

- **The "Made with ReviewPost" mark on free posts.** Every free post shared is an ad. Consider making it link to the site when it appears in a caption, for example by suggesting "Made with @reviewpost" in a copyable caption.
- **The Ticket design's QR code** sends viewers to the business's own website, which makes Ticket posts more useful and more likely to be shared.

## What to measure (monthly)

| Where | What to watch |
|---|---|
| Chrome Web Store dashboard | Impressions, installs, uninstalls, rating count |
| Search Console and Bing | Searches you appear for, clicks, which guides bring visitors |
| ExtensionPay | Free → Pro upgrades |
| AI assistants | Ask ChatGPT, Gemini and Perplexity "how do I turn Google reviews into Instagram posts?" once a month and note whether ReviewPost is mentioned |

Expect search and AI traffic to take 2–4 months to build. Directory listings, Reddit and LinkedIn bring the first visitors while it does.
