# DeSpoilerize v0.4

Chrome Web Store release assets for DeSpoilerize v0.4.0.

## Highlights

- Added a dedicated Reality TV protection pack under Entertainment.
- Broadened the UI from sport-only wording to topic-based protection.
- Expanded Reality TV spoiler and safe-context wording for UK-facing catch-up browsing.
- Improved hidden-card reason text so users see friendlier spoiler explanations.
- Added README guidance for custom protected terms beyond sport.
- Added fixture-backed scanner coverage and active e2e smoke tests for popup, options, and content-script flows.

## Package

- [despoilerize-v0.4.0-chrome-web-store.zip](./despoilerize-v0.4.0-chrome-web-store.zip)

## Screenshots

- [Catch-up Mode popup](./screenshots/01-catch-up-mode-popup.png)
- [Spoiler hidden on page](./screenshots/02-spoiler-hidden-on-page.png)
- [Topic pack settings](./screenshots/03-sports-pack-settings.png)
- [Custom terms and trusted sites](./screenshots/04-custom-terms-trusted-sites.png)
- [Reveal controls](./screenshots/05-reveal-controls.png)

## Promo tiles

- [Small promo tile](./promo/small-promo-tile.png)
- [Marquee promo tile](./promo/marquee-promo-tile.png)

## Verification

- `npm test`
- `npm run typecheck`
- `npm run test:e2e`
