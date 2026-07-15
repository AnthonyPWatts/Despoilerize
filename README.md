# DeSpoilerize

**DeSpoilerize** is a local-first browser extension that hides likely catch-up spoilers while spoiler protection is active.

The project began with my own highest-risk use case:

> Wake up, plan to watch F1 highlights later, scroll headlines, and accidentally see the result.

## What this version does

- Chrome/Edge Manifest V3 extension
- Compact popup for current protection state, quick toggle, page reveal, and settings navigation
- Temporary popup overrides that return to the saved schedule without replacing it
- Settings page for schedule, sensitivity, topic, custom term, supported-site filtering, export/import, and reset configuration
- Browser alarm support for scheduled protection transitions
- Sensitivity modes: Gentle, Balanced, Lockdown
- Grouped protection packs for sport and Reality TV topics
- Custom protected terms
- Per-site filtering toggles for supported sites
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

The e2e smoke suite builds the extension and checks schedule/sensitivity settings, options-page auto-save behaviour, popup state summaries, and content-script hide/reveal/settings refresh behaviour in Chromium.

## Chrome Web Store package

```bash
npm run package:chrome
```

This builds the extension and creates a Chrome Web Store zip under `Releases/v0.5` with `manifest.json` at the archive root.

Release packages and store listing assets are kept under [`Releases`](./Releases/).

## Chrome Web Store screenshots

```bash
npm run screenshots:store
```

This builds and loads the unpacked extension in Playwright Chromium, then captures the real popup, options page, injected spoiler overlay, and reveal controls at 1280 × 800. The on-page images use current public content from BBC Football and its World Cup page. The command fails if the live extension does not hide content or expose its real reveal controls. These sources can change over time, so the screenshots record the public pages available when the command is run rather than a deterministic fixture.

## Current limitations

- Host permissions are currently scoped to Google Search, Google News, BBC, YouTube, and The Guardian.
- The scanner is intentionally aggressive in Lockdown mode.
- Site reliability is improving through fixtures and e2e smoke tests, but YouTube/BBC/Guardian/Google still need broader real browsing checks before v1.0.
- It does not yet use official race calendars or event windows.
- It does not yet provide a dedicated "safe route to highlights" workflow.

## Suggested manual test

1. Build and load the extension.
2. Open settings and choose a protection schedule.
3. Set sensitivity to Lockdown.
4. Confirm settings changes save automatically without a separate save step.
5. Visit YouTube, Google News, BBC Sport, The Guardian, or Google Search.
6. Search or browse for protected topics such as F1, World Cup 2026, or Reality TV.
7. Confirm likely spoiler cards are blurred while safe preview/how-to-watch pages remain usable in Balanced mode.
8. Use Reveal once or Reveal all on page.

## Supported Sites

This version only runs on sites covered by the extension's host permissions:

- Google Search
- Google News
- BBC
- The Guardian
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
