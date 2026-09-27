# DeSpoilerize v1.0.0

## Preparation status — 27 September 2026

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

Package size: 121,333 bytes. SHA-256: `66d1de8a8e7d41a9b6e2ce4efc7812f8989530addf459a6f8b04dcf18d2165ff`.

## Store assets

The current screenshots were captured on 27 September 2026 from the running v1.0.0 extension in a fresh, signed-out Chrome for Testing profile. They show real YouTube results and thumbnails. The [gallery and capture record](./screenshots/live/README.md) include the actual toolbar popup and explain how the captures were verified. Promotional tiles were regenerated using the existing design.

Use these five 1280 × 800 images for the store, starting with the reveal example so both clear and protected content are visible:

- [Reveal one video while others stay protected](./screenshots/live/03-youtube-reveal-once.png)
- [The same results with protection off](./screenshots/live/01-youtube-protection-off.png)
- [The same results with protection on](./screenshots/live/02-youtube-protection-on.png)
- [Protection schedule](./screenshots/live/04-protection-schedule.png)
- [Protected topics and custom terms](./screenshots/live/05-protected-topics.png)
- [Small promo tile](./promo/small-promo-tile.png)
- [Marquee promo tile](./promo/marquee-promo-tile.png)

The earlier staged screenshots remain archived in the parent screenshots directory; they are superseded for documentation and store submission.

## Verification

Release verification completed on 27 September 2026 against v1.0.0 using the locked dependencies:

- `npm test`: all 99 unit tests passed.
- `npm run typecheck`: passed.
- `npm run screenshots:store`: built the extension and captured five page images and two actual toolbar-popup details. Verified loaded photographs, the visible **Sign in** control, protection off/on, **Reveal once** leaving the next card protected, and **I'm caught up** ending the session.
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/package-chrome.ps1`: packaged the freshly built extension successfully.
- `npx playwright test`: all 15 Chromium extension tests passed against the packaged build, including session completion, upcoming-session dates and the existing YouTube regressions.
- `npm run promo:store`: regenerated both promotional tiles, byte-identical to the previously inspected images.
- The ZIP contains a root v1.0.0 manifest and all referenced extension assets. All 44 archived files match the tested build byte for byte; source manifest, package metadata and lockfile versions agree.
- `node --check scripts/generate-live-store-screenshots.mjs`: passed.
- All seven captures were visually inspected, the five store images were confirmed as 1280 × 800, and local documentation links were checked. Live captures supplement the synthetic browser tests; they do not establish complete coverage of YouTube layouts.
- `git diff --check`: passed.

Browser automation uses synthetic fixtures. The popup's caught-up state and upcoming-session dates were also checked during local use. Broader live-site checks remain covered by the [manual smoke-test instructions](../../README.md#suggested-manual-test).

## Submission

Upload the ZIP to the existing Chrome Web Store item and use the included store assets as needed. Record the actual review and publication status after submission. Confirm store publication before publishing the corresponding GitHub release, following the existing release process.
