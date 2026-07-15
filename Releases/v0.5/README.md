# DeSpoilerize v0.5

Chrome Web Store release assets for DeSpoilerize v0.5.x.

## Highlights

- Added schedule-led protection controls for weekend, daily, custom, always-on, and paused protection.
- Added popup overrides that temporarily protect now or pause protection without replacing the saved schedule.
- Added supported-site filtering controls for Google, Google News, BBC, The Guardian, and YouTube.
- Added enabled, paused, and disabled extension action icons so the toolbar reflects the current protection state.
- Refreshed the Chrome Web Store screenshots from the running extension rather than staged copies of its UI.
- Removed the manual settings save button because settings changes are saved automatically.

## Package

- [despoilerize-v0.5.1-chrome-web-store.zip](./despoilerize-v0.5.1-chrome-web-store.zip)
- [despoilerize-v0.5.0-chrome-web-store.zip](./despoilerize-v0.5.0-chrome-web-store.zip)

## Screenshots

- [Protection popup](./screenshots/01-protection-popup.png)
- [Settings schedule and topics](./screenshots/02-settings-schedule-topics.png)
- [Supported sites settings](./screenshots/03-supported-sites-settings.png)
- [Spoiler hidden on page](./screenshots/04-spoiler-hidden-on-page.png)
- [Reveal controls](./screenshots/05-reveal-controls.png)

Run `npm run screenshots:store` to rebuild the extension and reproduce all five images in Playwright Chromium. The popup and settings images use the built extension pages. The on-page images browse current public content on BBC Football and its World Cup page, then fail unless the live content script injects its blur, spoiler reason, and reveal controls. The World Cup capture also activates `Reveal once` and fails if the protected result is not restored. Live page content can change over time, so regenerated images may differ.

## Promo tiles

- [Small promo tile](./promo/small-promo-tile.png)
- [Marquee promo tile](./promo/marquee-promo-tile.png)

## Verification

- `npm test`
- `npm run typecheck`
- `npm run test:e2e`
- `npm run screenshots:store`
- `npm run package:chrome`
