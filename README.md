# BiomeDrive website (v7)

Portfolio site for BiomeDrive, Naheel and Jaya's two-person web studio, aimed at small businesses in the US and Europe. It shows off the websites we've built.

v7 is one black design after osply.co (its home and About pages). There are no colour schemes, no light mode and no review panel any more.

## The page, top to bottom
1. **Loader:** a thin bar counts up, then the giant "BiomeDrive" rises and flies into the home header. Once per visit (add `?intro` to the URL to see it again); it clears itself after 9 s if anything fails.
2. **Home** (after osply.co/about): the giant wordmark with a white bar under it (the nav), contour lines across the whole screen, tilted back so the distance fades into the dark, shaded calmer behind the wordmark and the copy, with film grain (`js/topo.js`; the mouse stirs a swirl in it), "We design, build and host websites…", and a white card that peeks from the bottom and flutters down through the intro as you scroll.
3. **About:** two big statements whose words brighten as you read.
4. **What we do:** a drum of services that turns as you scroll.
5. **Work** (after osply.co): one pinned screen with an endless strip of covers, one per site (its home page, `img/<site>.webp`): ArshGroup, Triptych, Jayaditya G Nair, Naheel N Akhtar and NodeCraft Docs. Drawn with WebGL: a fluid mouse trail ripples the cover edges and leaves a faint smoke, and covers bend while scrolling. Click the middle cover to open the project window, which grows out of it and shows the site's screens (`img/<site>-long.webp`).
6. **Studio, contact, footer:** the two of us, the contact form, and a giant wordmark footer.
- A fixed nav slides in once the home header has scrolled away.
- Type: Inter Tight for text, Anybody for the wordmarks, Spline Sans Mono for small labels.

## Inner pages (added 2026-11-08)
Same black look, for Razorpay's website review and for clients who want the details:
- `site/pricing/`: the three plans (Starter $79/month, Growth $149/month, Own it $999 once) with a USD / GBP / EUR switch (it guesses from the browser language and remembers the choice), how paying works, and questions. Prices live in the `data-usd`, `data-gbp` and `data-eur` attributes.
- `site/contact/`: the address with the mail picker, the same form plus a plan picker (`/contact/?plan=growth` pre-picks it), and the company details.
- `site/terms/`, `site/refunds/`, `site/privacy/`, `site/delivery/`: the legal pages, each with a short summary and an index that follows your reading.
- `site/404.html`, `site/robots.txt`, `site/sitemap.xml`. Without a `404.html`, Cloudflare Pages served the home page for every unknown address.
- Shared: `css/pages.css` (after `style.css`), `js/page.js` (smooth scroll, entrances, reveals, the index, the currency switch, the mail picker), `js/config.js` (contact settings, also used by `main.js`).
- Pages are folders (`pricing/index.html`) and use root paths (`/css/...`), so `/pricing/` works both locally and on Cloudflare.

## Run locally
From the repo folder:

```
python -m http.server 5196 -d site
```

Then open http://localhost:5196 (`biomedrive` in `.claude/launch.json`).

## Files
- `site/index.html`, `site/css/style.css`, `site/js/main.js`: plain HTML/CSS/JS, no build step. The projects are listed in `PROJECTS` at the top of `main.js`.
- Logo: Naheel's B with the BiomeDrive signature. Originals in `brand/` (`biomedrive-logo-dark.png`, `biomedrive-logo-light.png`, not part of the site). `site/img/logo-b.png` is the B cut out as a transparent mark (the nav uses it as a CSS mask, so it takes the text colour); `site/img/favicon.png` and `apple-touch-icon.png` use the dark version. The tagline under the B in the originals is left off the site.
- `site/js/topo.js`: the contour terrain, ported from ReactDrops "Topographic Flow" (ReactDrops Component License 1.0: free to use on sites, not to be redistributed as a library).
- `site/js/vendor/`: Lenis 1.1.13 and Motion 11.11.13 (both MIT), hosted with the site.
- `tools/`: headless Chrome scripts. `pages.mjs` screenshots every inner page full length and reports sideways overflow and script errors (`node tools/pages.mjs http://localhost:5196 out/d 1440`). `page.mjs` films the loader and screenshots down the page (and stirs the work covers); `ixtest.mjs` steps through the index and opens the project window; `swirl.mjs` stirs the home terrain; `seq.mjs` and `shoot.mjs` capture other sites. Run one Chrome at a time: parallel runs starve animation frames and give false failures.
- `_v1/`, `_v2/`, `_v5/`: earlier versions, kept for reference. `_v5/` has the colour schemes, the Wall / Pile / Fan heroes and the unique-picture wall.

## Before going live
- **Fill the yellow placeholders** on the contact and legal pages: `{{CIN}}`, `{{REGISTERED_ADDRESS}}`, `{{PHONE}}` and `{{CITY}}` (courts for disputes). Search the `site/` folder for `{{`.
- The legal pages are a draft, not legal advice: have the CA or a lawyer read them. The 14-day first-payment refund and the buy-out price ($499 / £399 / €449) are business promises; confirm both.
- The full company name appears only on the contact and legal pages (Razorpay needs it there); everywhere else the site says only "BiomeDrive".
- Contact (`CONFIG` in `site/js/config.js`): the page shows `hello@biomedrive.com`, but clicking it, or sending the form, opens a picker (Gmail, Outlook or the visitor's mail app). The email it starts goes to everyone in `CONFIG.team` (jay@ and naheel@). Those addresses are assembled only when an option is picked, so they never appear on the page. Create `hello@` in Cloudflare Email Routing as well, for anyone who types the address by hand.
- The services in the drum (`#drum` in `index.html`) are a first draft; keep only what we offer.
- To add a project: add it to `PROJECTS` in `main.js`, add a 1440x900 home-page screenshot as `img/<site>.webp` and a tall stacked screenshot as `img/<site>-long.webp`, and add it to the hidden `#workList` in `index.html`.

## Deploy
It's a static folder: point Vercel, Netlify, Cloudflare Pages or GitHub Pages at `site/` and add the domain.
