# DeSpoilerize

**DeSpoilerize** is a local-first browser extension that hides likely catch-up spoilers while you are in Catch-up Mode.

The project began with my own highest-risk use case:

> Wake up, plan to watch F1 highlights later, scroll headlines, and accidentally see the result.

## What this version does

- Chrome/Edge Manifest V3 extension
- Catch-up Mode toggle
- Expiry shortcuts: 2h, Tonight, 24h, Manual
- Browser alarm support for timed Catch-up Mode expiry
- Sensitivity modes: Gentle, Balanced, Lockdown
- Grouped protection packs for sport and Reality TV topics
- Custom protected terms
- Trusted sites
- Headline/card scanning
- Thumbnail/card blurring
- Reveal once
- Reveal all on current page
- MutationObserver support for dynamic feeds
- Friendlier hidden-card reason text

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
npm run typecheck
```

For browser-level extension smoke checks:

```bash
npx playwright install chromium
npm run test:e2e
```

The e2e smoke suite builds the extension and checks popup presets, options-page saving, and content-script hide/reveal/settings refresh behaviour in Chromium.

## Chrome Web Store package

```bash
npm run package:chrome
```

This builds the extension and creates `Releases/v0.4/despoilerize-v0.4.2-chrome-web-store.zip` with `manifest.json` at the archive root.

Release packages and store listing assets are kept under [`Releases`](./Releases/).

## Current limitations

- Host permissions are currently scoped to Google Search, Google News, BBC, and YouTube.
- The scanner is intentionally aggressive in Lockdown mode.
- Site reliability is improving through fixtures and e2e smoke tests, but YouTube/BBC/Google still need broader real browsing checks before v1.0.
- It does not yet use official race calendars or event windows.
- It does not yet provide a dedicated "safe route to highlights" workflow.

## Suggested manual test

1. Build and load the extension.
2. Turn on Catch-up Mode.
3. Set sensitivity to Lockdown.
4. Visit YouTube, Google News, BBC Sport, or Google Search.
5. Search or browse for protected topics such as F1, World Cup 2026, or Reality TV.
6. Confirm likely spoiler cards are blurred while safe preview/how-to-watch pages remain usable in Balanced mode.
7. Use Reveal once or Reveal all on page.

## Supported Sites

This version only runs on sites covered by the extension's host permissions:

- Google Search
- Google News
- BBC
- YouTube

## Protection Packs

The options page now supports grouped protection packs, including:

- Motorsport: Formula 1, MotoGP
- Football: general football, World Cup 2026, Premier League, Championship, Champions League, England football
- Rugby: rugby union, Six Nations, rugby league
- Cricket: cricket, England cricket, The Ashes
- Tennis: tennis, Wimbledon, Grand Slams
- US sports: NFL, NBA
- Entertainment: Reality TV

## Custom protected terms

Custom terms can protect topics that do not yet have a dedicated pack. Add one show, contestant, team, event, or phrase per line. Good examples are:

- `The Traitors`
- `Love Island final`
- `Strictly dance-off`
- Current contestant names
- A one-off event you plan to catch up on later

Use distinctive terms where possible. Very broad words such as `winner` or `final` can hide unrelated pages.
