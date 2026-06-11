# DeSpoilerize

**DeSpoilerize** is a local-first browser extension that hides likely sports-result spoilers while you are in Catch-up Mode.

The first version focuses on my own personal highest-risk use case:

> Wake up, plan to watch F1 highlights later, scroll headlines, and accidentally see the result.

## What this version does

- Chrome/Edge Manifest V3 extension
- Catch-up Mode toggle
- Expiry shortcuts: 2h, Tonight, 24h, Manual
- Browser alarm support for timed Catch-up Mode expiry
- Sensitivity modes: Gentle, Balanced, Lockdown
- Grouped sport packs for motorsport, football, rugby, cricket, tennis, and US sports
- Custom protected terms
- Trusted sites
- Headline/card scanning
- Thumbnail/card blurring
- Reveal once
- Reveal all on current page
- MutationObserver support for dynamic feeds

## Privacy stance

This version is local-first.

- No account
- No server
- No AI API
- No analytics
- Page content is scanned locally in the browser

## Install for local development

```bash
npm install
npm run build
```

Then in Chrome or Edge:

1. Open `chrome://extensions` or `edge://extensions`
2. Enable Developer mode
3. Click **Load unpacked**
4. Select the generated `dist` folder

## Development

```bash
npm run dev
```

Then reload the extension from the browser's extensions page after each rebuild.

## Tests

```bash
npm test
```

For browser-level extension checks:

```bash
npx playwright install chromium
npm run test:e2e
```

## Chrome Web Store package

```bash
npm run package:chrome
```

This builds the extension and creates `Releases/v0.3/despoilerize-v0.3.0-chrome-web-store.zip` with `manifest.json` at the archive root.

Release packages and store listing assets are kept under [`Releases`](./Releases/).

## Current limitations

- Host permissions are currently scoped to Google Search, Google News, BBC, and YouTube.
- The scanner is intentionally aggressive in Lockdown mode.
- Site-specific adapters are basic; YouTube/BBC/Google will need refinement after real browsing tests.
- It does not yet use official race calendars or event windows.
- It does not yet provide a "safe route to highlights" workflow.

## Suggested manual test

1. Build and load the extension.
2. Turn on Catch-up Mode.
3. Set sensitivity to Lockdown.
4. Visit YouTube, Google News, BBC Sport, or Google Search.
5. Search or browse for F1-related content.
6. Confirm likely spoiler cards are blurred.
7. Use Reveal once or Reveal all on page.


## Supported Sites

This version only runs on sites covered by the extension's host permissions:

- Google Search
- Google News
- BBC
- YouTube

## Sport Packs

The options page now supports grouped sport packs, including:

- Motorsport: Formula 1, MotoGP
- Football: general football, World Cup 2026, Premier League, Championship, Champions League, England football
- Rugby: rugby union, Six Nations, rugby league
- Cricket: cricket, England cricket, The Ashes
- Tennis: tennis, Wimbledon, Grand Slams
- US sports: NFL, NBA
