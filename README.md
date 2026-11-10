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
- `site/pricing/`: a one-time build fee plus an optional monthly care plan (since 2026-11-09). One page $499 (care $29/month), business site $999 (care $49/month), bigger projects from $1,499 (quoted). Half to start, half at launch; the site is the client's once paid. A USD / GBP / EUR switch (it guesses from the browser language and remembers the choice), how paying works, and questions. Prices live in the `data-usd`, `data-gbp` and `data-eur` attributes.
- `site/contact/`: the address with the mail picker, the same form plus a plan picker (`/contact/?plan=business` pre-picks it; also `one-page` and `custom`), and the company details.
- `site/terms/`, `site/refunds/`, `site/privacy/`, `site/delivery/`: the legal pages, each with a short summary and an index that follows your reading.
- `site/404.html`, `site/robots.txt`, `site/sitemap.xml`. Without a `404.html`, Cloudflare Pages served the home page for every unknown address.
- Shared: `css/pages.css` (after `style.css`), `js/page.js` (smooth scroll, entrances, reveals, the index, the currency switch, the mail picker), `js/config.js` (contact settings, also used by `main.js`).
- Pages are folders (`pricing/index.html`) and use root paths (`/css/...`), so `/pricing/` works both locally and on Cloudflare.

## Studio (added 2026-11-09)
`/studio/` lets visitors try on a website before we build it. "Studio" in the nav now opens it; the team section stays on the home page.
- **The page** (`site/studio/index.html`, `studio.css`, `studio.js`): a drifting wall of template pictures, a gallery filtered by kind of business and mood (cards scroll through the page on hover), a full-screen viewer (desktop, tablet and phone frames; every palette and font pairing, applied live; previous and next), and a colour lab (shuffle palettes by mood, lock or edit any colour, contrast checks, live preview on any template). "Start with this look" opens `/contact/?look=…&palette=…&font=…` and fills in the message (`js/page.js`).
- **Templates** render from data: `site/studio/view/?t=<id>` draws one template with the kit (`kit/kit.js` and `kit/kit.css`: 33 heroes, 27 sections, 4 navs, 2 footers, motion). Add `&p=<palette>` and `&f=<font>` to re-dress it; the Studio sends palette and font changes to the frame with `postMessage`.
- **Data** (`site/studio/data/`): 100 templates, four for each kind of business. `content.js` (25 kinds of business: services, steps, reviews, questions, figures), `palettes.js` (76), `fonts.js` (39 pairings, Google Fonts and Fontshare), `photos.js` (420 Unsplash photographs served by Lorem Picsum), `templates.js` (generated, see below).
- **Interactive templates** (50 of the 150, marked "Interactive" in the gallery): `kit/fx.js` and `kit/fx.css` add motion-led heroes (an opening window that grows with the scroll, contour lines you stir with the mouse using BiomeDrive's `js/topo.js`, a WebGL ripple on the photo, layers that move with the mouse, a sliced photo, the name's letters lifting toward the cursor, a sideways reel), sections (pinned sideways services, stacking cards, scroll-pushed lines, odometers, expanding panels, a card that follows the cursor) and effects listed in each template's `fx` (preloader, cursor, magnetic buttons, scroll skew, tilt, split letters, scramble, glow, grain, reactive marquees, progress bar, curtain footer). Built with Motion (`js/vendor/motion.js`) and Lenis. Everything lies still for reduced motion and for thumbnails, and the pointer effects are off on touch screens.
- **Motion styles** (2026-11-10): no two templates move alike. Each carries its own combination in `m` (`kit/motion.css`): 10 heading entrances (rise, drop, fade, wipe, tilt, zoom, slide, flip, word by word, letter by letter), 8 photo reveals, 6 list entrances, 4 text entrances, 6 button hovers, 5 service-row hovers, 4 tile hovers, 3 nav hovers and 4 easings. `templates.py` assigns them: headings, photos, easing and buttons from what suits the template's moods, every axis spread evenly, and templates for the same kind of business never share a heading or photo style. Reviews and process sections each come in three layouts (`rv`, `ps`). The 50 interactive templates use 13 openings (added lens, dots, doors, type wall, drum, mosaic), four or fewer each, and no two share the same opening, effects and sections.
- `templates.py` keeps every template's photos as they are: they only change when a template needs more or fewer, or gets a new pin.
- Headline masks (`.ln`, `.tick`, and `.wd` on the BiomeDrive pages) leave room above, below and to the left of the text, so tall capitals, descenders and italic overhangs are never cut (fixed 2026-11-09; `tools/studio/clipcheck.mjs` measures it).
- **Tools** (`tools/studio/`): `templates.py` defines every template, checks it and gives each its own photos (no photo is used twice in the Studio), then writes `templates.js`. `build_data.py` rebuilds palettes and photos from the Taste skill library. `shots.mjs` screenshots templates (`--full`) and makes the gallery thumbnails (`--thumb`, into `site/studio/thumbs/`). `check.mjs` drives the whole Studio page. `fxcheck.mjs` loads every interactive template (or `still`, `all`, or a list of ids), moves the mouse, scrolls and checks each effect ran and nothing revealed stays hidden. `clipcheck.mjs` measures every headline's letters against its mask (`--pages` for the BiomeDrive pages). `bump.py` raises the `?v=` on every Studio import after a change, so browsers and Cloudflare fetch the new files.
- After changing templates: `python tools/studio/templates.py`, then `node tools/studio/shots.mjs http://localhost:5198 site/studio/thumbs 1440 "" --thumb`, then `python tools/studio/bump.py`.
- Credits: palettes and type pairings partly from the Taste skill library by Leonxlnx (MIT); photographs from Unsplash via Lorem Picsum (Unsplash licence). Both are credited in the Studio footer.

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
- **Fill the last yellow placeholder:** `{{PHONE}}` on the contact page. The CIN, registered office and courts city (Bengaluru) are filled in from the MCA record (2026-11-09).
- The legal pages are a draft, not legal advice: have the CA or a lawyer read them. The refundable first build payment, the 14-day care plan refund and the build times on the delivery page (5 business days for one page, 10 for a business site) are business promises; confirm them.
- The full company name appears only on the contact and legal pages (Razorpay needs it there); everywhere else the site says only "BiomeDrive".
- Contact (`CONFIG` in `site/js/config.js`): the page shows `hello@biomedrive.com`, but clicking it, or sending the form, opens a picker (Gmail, Outlook or the visitor's mail app). The email it starts goes to everyone in `CONFIG.team` (jay@ and naheel@). Those addresses are assembled only when an option is picked, so they never appear on the page. Create `hello@` in Cloudflare Email Routing as well, for anyone who types the address by hand.
- The services in the drum (`#drum` in `index.html`) are a first draft; keep only what we offer.
- To add a project: add it to `PROJECTS` in `main.js`, add a 1440x900 home-page screenshot as `img/<site>.webp` and a tall stacked screenshot as `img/<site>-long.webp`, and add it to the hidden `#workList` in `index.html`.

## Deploy
It's a static folder: point Vercel, Netlify, Cloudflare Pages or GitHub Pages at `site/` and add the domain.
