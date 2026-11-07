# ReviewPost

A Chrome extension that turns Google Maps and Trustpilot reviews into branded social posts (Instagram post, Story/Reel and LinkedIn sizes) in one click. Made by [Will Tarpey](https://willtarpey.com).

| Folder | What's in it |
|---|---|
| `reviewshot/` | The extension itself (Manifest V3). Load it unpacked from `chrome://extensions`. |
| `website/` | The landing page, guides, `llms.txt`, sitemap and privacy policy. Deployed to GitHub Pages by `.github/workflows/pages.yml`. |
| `store-listing/` | Chrome Web Store listing copy (`STORE_LISTING.md`) and the screenshot and promo tile sources. |
| `video/` | The promo video's source page and the scripts that capture and encode it. |
| `TRACTION_PLAN.md` | The plan for getting organic traffic through the Web Store, search and AI assistants. |

To package the extension for the Web Store, zip the contents of `reviewshot/` without `README.md` and `icons/icon-source.png`.
