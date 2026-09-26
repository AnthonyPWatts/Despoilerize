# DeSpoilerize

**DeSpoilerize** is a local-first browser extension that hides likely catch-up spoilers while spoiler protection is active.

The project began with my own highest-risk use case:

> Wake up, plan to watch F1 highlights later, scroll headlines, and accidentally see the result.

## Current release

**v0.5.4** is the current published extension, confirmed in the [Chrome Web Store](https://chromewebstore.google.com/detail/despoilerize/ekckhdeeoilbnocmcpnhbcocbapjpmof) on 26 September 2026. See the [release notes and publication status](./Releases/v0.5/README.md) for the corresponding GitHub release status and archived packages.

**v0.5.5** is prepared for release but has not been submitted or published. The source and local builds use v0.5.5; the [release notes and package](./Releases/v0.5/README.md#v055-bug-fix) describe the YouTube home-feed and settings fixes.

Install from the store to receive automatic updates. Unpacked development installations use the local `dist` folder and require a rebuild and extension reload to pick up changes.

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

The e2e smoke suite builds the extension and checks schedule/sensitivity settings, options-page auto-save behaviour, popup state summaries, and content-script hide/reveal/settings refresh behaviour in Chromium. YouTube checks include delayed card hydration, unchanged card/thumbnail geometry when hiding and revealing, and reveal controls following responsive layouts, scrolling and feed changes.

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

This builds and loads the unpacked extension in Playwright Chromium, then captures the real popup, options page, injected spoiler overlay, and reveal controls at 1280 × 800. The on-page images use a clearly labelled deterministic fixture from [`tests/fixtures/store/capture-page.html`](./tests/fixtures/store/capture-page.html); they do not imitate a third-party site or browser chrome.

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

### YouTube home grid regression

For [issue #4](https://github.com/AnthonyPWatts/Despoilerize/issues/4), test in the browser used for normal YouTube browsing after rebuilding and reloading the unpacked extension:

1. Enable Formula 1 protection, choose Lockdown, and ensure protection is active.
2. Refresh the YouTube home page with a matching highlights card in the feed. Check that its thumbnail and metadata are blurred within one normal tile, with neighbouring cards still beside it.
3. Resize the window, expand/collapse YouTube's sidebar, and scroll the feed. Confirm reveal controls remain on their card, fit within it, and are clickable.
4. Select **Reveal once**. Confirm the card and its neighbours keep their sizes and positions, and other matching cards remain hidden.
5. Refresh, then select **Reveal all on page**. Confirm the grid stays in place, all currently hidden cards are revealed, and their controls disappear. Also check the popup's page-reveal control.
6. Browse to another YouTube page and load more recommendations. Confirm controls do not remain where removed cards used to be.

The automated layout fixture uses synthetic content and parent-dependent tile widths to reproduce the original expansion. It is not a capture of YouTube's live DOM. Check embedded thumbnail text at normal size during the live smoke test; blur reduces readability but cannot guarantee that every large word or recognisable image is concealed.

### YouTube home feed updates and sensitivity regression

For [issue #5](https://github.com/AnthonyPWatts/Despoilerize/issues/5), use the current development build and reload the YouTube tab once after reloading the extension:

1. Enable Formula 1 protection and choose Balanced. Browse and scroll the home feed. Unrelated athletics and music recommendations should remain visible beside protected F1 result cards.
2. Without refreshing the page, switch between Lockdown, Balanced and Gentle. Topic-only F1 cards should clear when leaving Lockdown; clear result cards should remain protected in Balanced. Re-enable Lockdown and confirm protection returns.
3. Disable and re-enable Formula 1, YouTube filtering, and protection itself. Existing cards should respond without a page refresh.
4. Reveal a protected card and continue browsing. The reveal should survive metadata updates for the same video, but a different video reusing its card must be assessed independently.

Synthetic browser regressions reproduce card reuse, accessible-label updates and settings changes. A page refresh cleared the original reported false positives, but their exact live DOM update sequence was not captured.

### YouTube Shorts regression

After rebuilding and reloading the unpacked extension, reload the YouTube tab:

1. Choose **Always on** and **Lockdown**, then add one distinctive Short title as a custom protected term.
2. Open that Short and confirm it is blurred. Scroll to unrelated Shorts and confirm their blur and warning controls clear.
3. Return to the protected Short and select **Reveal once**. Visit another video, then return; the deliberate reveal should be remembered until the page is reloaded.
4. Visit a different protected Short. Confirm it is still hidden, including when it has the same title as a revealed video.
5. Repeat using **Reveal all on page**. Later protected videos should still be hidden.
6. Check several quick scrolls and, when available, an advert between videos. Confirm warning controls do not carry over to unrelated content.

The browser regressions also cover metadata arriving in stages, player replacement and like-count changes. Live checks cover the current YouTube layout; the synthetic fixtures do not represent every layout or network condition.

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
