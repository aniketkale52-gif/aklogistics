# AK Logistics

Marketing website for AK Logistics. Plain HTML, CSS and JavaScript, no build step.

## Structure

```
ak-logistics/
├── index.html              Landing page
├── css/style.css           All styles
├── js/main.js              Interactions and animations
├── assets/
│   ├── images/             Hero, section photos, logo, partner logos, world map
│   └── icons/              Brand icons and small SVG graphics
├── package.json            `npm run dev` local server
├── vercel.json             Vercel settings
└── .cursor/rules/          Project notes Cursor's AI reads automatically
```

Some SVGs in `assets/` (logo, arrow, triangles) are also written directly into
`index.html` so their colours can change on hover and scroll. Those files are kept as the source copies.

## Run locally (Cursor / VS Code)

Needs Node.js 18 or newer (https://nodejs.org).

```
npm install
npm run dev
```

Then open http://localhost:3000. You can also just double-click `index.html`.
An internet connection is needed for the Google Fonts (Nunito Sans and Source Sans 3).

## Push to GitHub

Create an empty repository on GitHub (no README), then in the project folder:

```
git init
git add .
git commit -m "AK Logistics website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ak-logistics.git
git push -u origin main
```

## Deploy on Vercel

1. Go to https://vercel.com/new and import the GitHub repository.
2. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
3. Click Deploy.

Every later `git push` to `main` redeploys automatically.

## Landing page sections

1. Header (sticky; turns white on scroll, hides at the footer)
2. Hero with Track Order / Ship Order card
3. Our Partners
4. Why AK + stats (scroll text reveal)
5. Suite of Solutions (floating box with animated lines)
6. Our Services
7. Testimonials slider
8. Our Offices (world map with hover pins)
9. We Are In News
10. Most Asked Questions (FAQ accordion)
11. Footer

Faint dashed lines with moving orange markers run behind the sections.

## Placeholder content still to replace

- Testimonials: names, roles, photos, company logos, quotes, result numbers
- Our Offices: body text, pin positions, city and address for each pin
- We Are In News: post titles, dates, authors, photos and links
- FAQs: questions and answers (currently copied from a reference design)
- Footer: tagline, address, email, links
- Stats: confirm "120+" global destinations vs "220+" on the Cross-Border card

Placeholders are marked with HTML comments in `index.html`.

## Not connected yet

The Track Order, Ship Order and newsletter forms only check input in the browser.
They are not connected to a backend (see the `TODO` comments in `js/main.js`).
