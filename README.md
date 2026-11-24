# Lorenzo Mariotto — Portfolio

Static portfolio built with plain HTML, CSS and JavaScript. No build step: open `index.html` in a browser.

## Files

- `index.html` — home: hero, work, visuals, about, experience, contact
- `soma.html` — SOMA website redesign case study
- `style.css`, `script.js` — shared styles and behaviour

## Password-protected Night Mode case study

`night-mode.html` is encrypted and only opens with the password. The readable
version lives in `private/night-mode.src.html`, which is git-ignored and never
published. To change the page:

1. Edit `private/night-mode.src.html`.
2. Re-encrypt it (PowerShell):

   ```
   $env:PAGE_PASSWORD = "your-password"; node tools/encrypt-page.mjs private/night-mode.src.html night-mode.html
   ```

3. Commit and push `night-mode.html`.

To change the password, run step 2 with a new one. Note: images and the demo
video are not encrypted, and the repo is public.

## Images to add

Missing images show a styled placeholder until you add them.

- `images/soma-cover.jpg` — case study cover (16:9 works best)
- `images/portrait.jpg` — about photo (4:5)
- `images/visuals/01.jpg` … `08.jpg` — visuals gallery
- `images/soma/01.jpg` … `04.jpg` — final SOMA screens
- `resume.pdf` — CV download

## Deploying to lorenzomariotto.com

Upload the folder to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages) and point the domain's DNS at it. The site is currently a Google Sites page, so DNS must be changed away from Google.
