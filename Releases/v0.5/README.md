# DeSpoilerize v0.5

Chrome Web Store release assets for DeSpoilerize v0.5.x.

## v0.5.4 bug fix

- Fixed spoiler blur carrying over to unrelated YouTube Shorts when scrolling between videos.
- Kept later spoilers protected after using **Reveal once** or **Reveal all on page**, while remembering deliberate reveals when revisiting the same video during that page session.
- Kept existing protection in place while YouTube updates the next video's metadata, and removed stale warning controls once a safe video is ready.
- Added browser regressions for reused players, delayed metadata, identical titles with different video IDs, adverts, rapid changes and reveal behaviour.

### Submission status — 21 September 2026

v0.5.4 was uploaded to the existing [Chrome Web Store item](https://chromewebstore.google.com/detail/ekckhdeeoilbnocmcpnhbcocbapjpmof) and submitted for review. The dashboard confirmed **Pending review**, with automatic publication enabled after approval. v0.5.3 was confirmed as the published version at submission; v0.5.4 is not yet confirmed live.

The fix and release package are on `main` in commits `7125e6e` and `ee6d6fc`. The [v0.5.4 GitHub release](https://github.com/AnthonyPWatts/Despoilerize/releases) remains a draft pending store approval. Its uploaded ZIP has the same size and SHA-256 as the verified local package. Once Google confirms publication, check that the store lists v0.5.4 and publish that existing GitHub draft.

There are no new permissions, dependencies or data collection. Existing screenshots and promotional assets remain applicable to this bug-fix release.

The source change was verified on live YouTube in an isolated Brave profile: scrolling to an unrelated Short cleared its blur, a subsequent protected video remained hidden, and revisiting an explicitly revealed video preserved that choice. Live advert transitions were not observed; adverts and rapid metadata changes are covered by synthetic browser fixtures. See [the Shorts smoke test](../../README.md#youtube-shorts-regression).

Release verification completed using the locked dependencies, including Vite 8.0.16:

- `vitest run`: 80 tests passed.
- `tsc --noEmit`: passed.
- `playwright test`: all ten Chromium extension tests passed against the v0.5.4 build.
- `npm run package:chrome`: built and packaged successfully. The archive has a root v0.5.4 manifest, all referenced extension assets are present, and all 44 archived files match the tested build byte for byte.
- Package size: 120,052 bytes. SHA-256: `9cfc0669bf6b359fb7394cf1182782b439ea11f2f08438afff49c0b921c0f447`.

## v0.5.3 bug fix

- Fixed hidden YouTube home cards expanding to the full feed width. Cards and thumbnails now retain their original sizes and grid positions when hidden or revealed.
- Kept reveal controls aligned with their cards during resizing, scrolling and feed changes, and removed controls when their cards leave the page.
- Added Chromium regressions for layout preservation, both reveal actions, responsive layouts and card removal/reinsertion.

See [issue #4](https://github.com/AnthonyPWatts/Despoilerize/issues/4) for the investigation and [the YouTube smoke test](../../README.md#youtube-home-grid-regression) for live browser checks. The blur strength is unchanged; this fix corrects the unintended enlargement.

### Submission status — 12 September 2026

v0.5.3 was uploaded to the existing [Chrome Web Store item](https://chromewebstore.google.com/detail/ekckhdeeoilbnocmcpnhbcocbapjpmof) and submitted for review. The dashboard confirmed **Pending review**, with automatic publication enabled after approval. v0.5.2 was the published version at submission. On 21 September 2026, the dashboard confirmed v0.5.3 as published.

The fix and release package are on `main` in commits `13d2fb4` and `ae9bf79`. Issue #4 is closed. The prepared [GitHub release](https://github.com/AnthonyPWatts/Despoilerize/releases) remains a draft; store publication has now been confirmed.

Release verification completed:

- `npm test`: 80 tests passed.
- `npm run typecheck`: passed.
- `npx playwright test`: all eight Chromium extension tests passed against the v0.5.3 build.
- `npm run package:chrome`: built and packaged successfully; the root manifest reports v0.5.3 and all 44 archived files match the tested build.
- The GitHub release asset's SHA-256 matches the local ZIP: `527a4546e44afd77e316f14e582681491ba88a1edf8b25d2b6c9bd5af8caa47f`.

Browser regression tests use synthetic fixtures. Live YouTube behaviour and thumbnail readability still require the documented manual smoke test.

## Highlights

- Added schedule-led protection controls for weekend, daily, custom, always-on, and paused protection.
- Added popup overrides that temporarily protect now or pause protection without replacing the saved schedule.
- Added supported-site filtering controls for Google, Google News, BBC, The Guardian, and YouTube.
- Added enabled, paused, and disabled extension action icons so the toolbar reflects the current protection state.
- Refreshed the Chrome Web Store screenshots from the running extension rather than staged copies of its UI.
- Removed the manual settings save button because settings changes are saved automatically.
- Fixed YouTube cards that populate their titles after the initial page render so F1 spoilers are still hidden.

## Package

- [despoilerize-v0.5.4-chrome-web-store.zip](./despoilerize-v0.5.4-chrome-web-store.zip)
- [despoilerize-v0.5.3-chrome-web-store.zip](./despoilerize-v0.5.3-chrome-web-store.zip)
- [despoilerize-v0.5.2-chrome-web-store.zip](./despoilerize-v0.5.2-chrome-web-store.zip)
- [despoilerize-v0.5.1-chrome-web-store.zip](./despoilerize-v0.5.1-chrome-web-store.zip)
- [despoilerize-v0.5.0-chrome-web-store.zip](./despoilerize-v0.5.0-chrome-web-store.zip)

## Screenshots

- [Protection popup](./screenshots/01-protection-popup.png)
- [Settings schedule and topics](./screenshots/02-settings-schedule-topics.png)
- [Supported sites settings](./screenshots/03-supported-sites-settings.png)
- [Spoiler hidden on page](./screenshots/04-spoiler-hidden-on-page.png)
- [Reveal controls](./screenshots/05-reveal-controls.png)

Run `npm run screenshots:store` to rebuild the extension and reproduce all five images in Playwright Chromium. The popup and settings images use the built extension pages. The on-page images serve the clearly labelled [`capture-page.html`](../../tests/fixtures/store/capture-page.html) fixture through a locally intercepted supported URL, allowing the real content script to inject its blur, spoiler reason, and reveal controls without presenting the fixture as a live third-party page. The capture also activates `Reveal once` and fails if the protected card is not restored.

## Promo tiles

- [Small promo tile](./promo/small-promo-tile.png)
- [Marquee promo tile](./promo/marquee-promo-tile.png)

## Verification

- `npm test`
- `npm run typecheck`
- `npm run test:e2e`
- `npm run screenshots:store`
- `npm run package:chrome`
