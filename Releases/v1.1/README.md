# DeSpoilerize v1.1.0

## Submission status — 27 September 2026

**Submitted to the Chrome Web Store; pending review.** Automatic publication after approval is enabled. This package supersedes the unpublished v1.0.0 preparation and includes the dedicated Big Brother pack. The dashboard confirmed draft v1.1.0 and published v0.5.4 before submission. No v1.1.0 Git tag or GitHub release has been created; store approval and publication remain outstanding.

## Changes since v0.5.4

- Audited all 22 packs and refreshed sports data for September 2026: F1 and MotoGP grids, 2026/27 football leagues, England cricket, leading tennis players, Super League and complete NFL/NBA team names. Current and retained catch-up lists are separate. [Audit, sources and limitations](../../docs/pack-data.md).
- Added a dedicated **Big Brother** UK pack with all 16 published 2026 launch names, verified full names and aliases, companion-show wording, nominations, evictions, departures and twist reveals. Short names require programme context. [Coverage, sources and maintenance](../../docs/big-brother-pack.md).
- Added a dedicated **The Traitors** pack under Entertainment, with all 21 announced 2026 UK celebrities, the 2025 celebrity cast and all 22 UK series-four contestants. It covers banishments, murders, recruitment, role reveals and finale wording; common first names require programme context. [Coverage and cast sources](../../docs/traitors-pack.md).
- Added **I'm caught up** to the popup and settings. It ends the current protection session immediately, reveals protected content on open pages, and preserves the saved schedule, topics and sensitivity.
- Resumed protection automatically at the next scheduled start. Finishing a weekend session keeps protection off until next Saturday; daily and custom schedules resume at their next start. Always-on and manual protection require deliberate reactivation.
- Showed the upcoming session's start and end together after catching up. The separate confirmation identifies the session that has ended, and **Return to schedule** allows the choice to be undone.
- Preserved the ended-session choice across popup reopening and unrelated settings saves.
- Included the YouTube home-feed fixes prepared for v0.5.5: removed stale blur from reused cards and changed metadata, reassessed existing cards when settings change, and preserved deliberate reveals for the same video.

There are no new permissions, dependencies or data collection.

## Package

- [despoilerize-v1.1.0-chrome-web-store.zip](./despoilerize-v1.1.0-chrome-web-store.zip)

The [submission copy and reviewer instructions](./STORE-LISTING.md) include the final screenshot order, permissions text and public links. The [checksum file](./SHA256SUMS.txt) identifies the tested upload.

Package size: 130,401 bytes. SHA-256: `907ee94ac0592500af9a223afd72cdc9d8c3a996f5bb03315235932abc926b07`.

## Store assets

The current screenshots were captured on 27 September 2026 from the running v1.1.0 extension in a fresh, signed-out Chrome for Testing profile. They show real YouTube results and thumbnails. The captures preceded the sports vocabulary refresh; the subsequent data update does not change these screens. The [gallery and capture record](./screenshots/live/README.md) include the actual toolbar popup and explain how the captures were verified. Promotional tiles were regenerated using the existing design.

These five 1280 × 800 images were uploaded to the store in this order to show both reality TV and sport, with clear and protected content visible in each reveal example:

- [Big Brother: episode 11 deliberately revealed while episode 12 stays protected](./screenshots/live/08-big-brother-reveal-once.png)
- [Formula 1: reveal one highlights video while others stay protected](./screenshots/live/03-youtube-reveal-once.png)
- [Big Brother: protection on](./screenshots/live/07-big-brother-protection-on.png)
- [Protection schedule](./screenshots/live/04-protection-schedule.png)
- [Protected topics and custom terms](./screenshots/live/05-protected-topics.png)

Promotional images:

- [Small promo tile](./promo/small-promo-tile.png)
- [Marquee promo tile](./promo/marquee-promo-tile.png)

The earlier staged screenshots remain archived under [v1.0](../v1.0/screenshots/); they are superseded for documentation and store submission.

## Verification

Release verification completed on 27 September 2026 against v1.1.0 using the locked dependencies:

- `npm test`: all 652 unit tests passed, including 350 sports-data and alias regressions and 89 Big Brother cases covering every launch name, published aliases, spoiler wording, sensitivity settings and unrelated-news regressions.
- `npm run typecheck`: passed.
- `npm run build`: passed after the sports vocabulary refresh. Earlier in this preparation, `node scripts/generate-live-store-screenshots.mjs` captured eight page images, two actual toolbar-popup details and two Entertainment settings details. Verified loaded photographs, visible **Sign in**, protection off/on, selective reveals, **I'm caught up**, and saved dedicated pack selections.
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/package-chrome.ps1`: packaged the freshly built extension successfully.
- `npx playwright test`: all 19 Chromium extension tests passed against the packaged build, including independent Traitors and Big Brother selection and persistence, popup summary, hiding/revealing page cards, disabling the pack, session completion, upcoming-session dates and the existing YouTube regressions. Two additional checks load the v0.5.4 settings shape with on/off overrides, verify old preferences and new-pack opt-in behaviour, and preserve those preferences through selection and reload.
- Promotional tiles are unchanged from the previously verified v1.1.0 preparation; no new promotional rendering was needed.
- The ZIP contains a root v1.1.0 manifest and all referenced extension assets. All 44 archived files match the tested build byte for byte; source manifest, package metadata and lockfile versions agree.
- `node --check scripts/generate-live-store-screenshots.mjs`: passed.
- All twelve captures were visually inspected, the eight page images were confirmed as 1280 × 800, and local documentation links were checked. The live Big Brother capture deliberately reveals an ITV Reality episode 11 clip while episode 12 and the third result remain protected. The captions explain that this is a viewer action, not automatic filtering by episode or upload date. These checks supplement the synthetic browser tests; they do not establish complete coverage of YouTube layouts or episode spoilers.
- Final preparation re-ran all unit and browser tests and type-checking, checked the five selected screenshot dimensions, both promotional tiles and the store icon, and confirmed all manifest-referenced files exist. The manifest differs from v0.5.4 only in version; permissions are unchanged.
- Added ready-to-use store copy, reviewer steps and a SHA-256 checksum file. Clarified browser-managed settings sync in the privacy policy. No extension source changed in this final pass, so the tested ZIP and screenshot captures were retained.
- `git diff --check`: passed.

The local settings-compatibility checks do not simulate a store-managed automatic upgrade; that remains a post-publication check. The refreshed sports vocabulary was checked through the matching tests and rebuilt extension. Live screenshots were not recaptured for this data-only update, and each sport was not separately tested on live sites. Browser regression tests use synthetic fixtures. The popup's caught-up state and upcoming-session dates were also checked during local use. Broader live-site checks remain covered by the [manual smoke-test instructions](../../README.md#suggested-manual-test).

## Submission

Source, documentation and assets were committed and pushed as `211bc455852f62b3df150b12550d3d3ccf98fa5f` before submission. The verified ZIP was uploaded to the existing store item. The description, five screenshots, homepage and support links, single-purpose statement and permission explanations were updated, and reviewer instructions were saved. The existing icon and promotional tiles were retained; the promotional files match the v0.5 assets byte for byte. Category, language, distribution and data-collection declarations were preserved.

The dashboard confirmed successful submission and **Pending review** on 27 September 2026. **Publish automatically after review** was checked when submitting. Confirm store publication and an installed copy's version before publishing the corresponding GitHub release, following the existing release process. Store-managed upgrades remain unverified.
