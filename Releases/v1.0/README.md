# DeSpoilerize v1.0.0

## Preparation status — 26 September 2026

**Prepared for Chrome Web Store submission; not submitted or published.** This package supersedes the unpublished v0.5.5 preparation. The last verified published store version is v0.5.4. No v1.0.0 Git tag or GitHub release has been created.

## Changes since v0.5.4

- Added **I'm caught up** to the popup and settings. It ends the current protection session immediately, reveals protected content on open pages, and preserves the saved schedule, topics and sensitivity.
- Resumed protection automatically at the next scheduled start. Finishing a weekend session keeps protection off until next Saturday; daily and custom schedules resume at their next start. Always-on and manual protection require deliberate reactivation.
- Showed the upcoming session's start and end together after catching up. The separate confirmation identifies the session that has ended, and **Return to schedule** allows the choice to be undone.
- Preserved the ended-session choice across popup reopening and unrelated settings saves.
- Included the YouTube home-feed fixes prepared for v0.5.5: removed stale blur from reused cards and changed metadata, reassessed existing cards when settings change, and preserved deliberate reveals for the same video.

There are no new permissions, dependencies or data collection.

## Package

- [despoilerize-v1.0.0-chrome-web-store.zip](./despoilerize-v1.0.0-chrome-web-store.zip)

Package size: 121,333 bytes. SHA-256: `0a784ec6c94450643ecab1a9aa435321427dfa62cc73d2b765c3400a62a83673`.

## Store assets

The five screenshots were captured from the running v1.0.0 extension. On-page examples use a clearly labelled synthetic fixture. Promotional tiles are unchanged from v0.5 and copied here for submission.

- [Protection popup](./screenshots/01-protection-popup.png)
- [Settings schedule and sensitivity](./screenshots/02-settings-schedule-topics.png)
- [Supported sites settings](./screenshots/03-supported-sites-settings.png)
- [Spoiler hidden on page](./screenshots/04-spoiler-hidden-on-page.png)
- [Reveal controls](./screenshots/05-reveal-controls.png)
- [Small promo tile](./promo/small-promo-tile.png)
- [Marquee promo tile](./promo/marquee-promo-tile.png)

## Verification

Release verification completed against v1.0.0 using the locked dependencies:

- `npm test`: all 99 unit tests passed.
- `npm run typecheck`: passed.
- `npm run package:chrome`: built and packaged successfully.
- `npx playwright test`: all 15 Chromium extension tests passed against the packaged build, including session completion, upcoming-session dates and the existing YouTube regressions.
- `node scripts/generate-store-screenshots.mjs`: captured five screenshots from the running build and exercised the on-page reveal control. All screenshots and both copied promo tiles were visually inspected.
- The ZIP contains a root v1.0.0 manifest and all referenced extension assets. All 44 archived files match the tested build byte for byte; source manifest, package metadata and lockfile versions agree.
- `git diff --check`: passed.

Browser automation uses synthetic fixtures. The popup's caught-up state and upcoming-session dates were also checked during local use. Broader live-site checks remain covered by the [manual smoke-test instructions](../../README.md#suggested-manual-test).

## Submission

Upload the ZIP to the existing Chrome Web Store item and use the included store assets as needed. Record the actual review and publication status after submission. Confirm store publication before publishing the corresponding GitHub release, following the existing release process.
