# Chrome Web Store submission copy — v1.1.0

Submitted on 27 September 2026. The dashboard confirmed **Pending review**, with automatic publication after approval enabled. The existing item, category, language and distribution settings were preserved. This file records the submitted copy and assets; store publication remains outstanding.

## Short description

Spoiler protection for sport and entertainment browsing.

## Detailed description

DeSpoilerize hides likely spoilers while you catch up on your favourite shows and sports.

Choose what to protect, set a schedule and browse supported sites with likely spoiler headlines and their thumbnails blurred. Dedicated Big Brother and The Traitors packs sit alongside Formula 1, football, rugby, cricket, tennis, NFL, NBA and broader reality TV coverage. Add custom terms for other shows, teams, contestants or events.

PROTECTION THAT FITS YOUR VIEWING

- Schedule protection for weekends, daily or custom times, or keep it always on.
- Start temporary protection from the toolbar popup whenever you need it.
- Select "I'm caught up" to end the current session. Your saved schedule and topics stay in place, ready for the next scheduled session.
- Reveal one hidden item or reveal everything on the current page.
- Choose Gentle, Balanced or Lockdown sensitivity. Lockdown also hides recognised topics without explicit result wording.
- Choose which supported sites to filter. Settings save automatically.

SUPPORTED SITES

Google Search, Google News, BBC, The Guardian and YouTube.

PRIVACY

Page text is checked locally in your browser. DeSpoilerize does not send page content to a server, use analytics or require an account. Preferences use the browser's extension storage and may sync through your browser account if enabled.

WHAT'S NEW IN 1.1.0

- Dedicated UK Big Brother and The Traitors packs with published cast names and programme-specific spoiler wording.
- "I'm caught up", with the next scheduled protection session clearly shown.
- Refreshed sports names and league membership, checked in September 2026.
- Improved handling of YouTube cards as feeds load and change.

LIMITATIONS

Protection is based on text and configured topics. It can miss spoilers or hide unrelated items, especially in Lockdown. It cannot read text inside images or recognise faces. It does not track watched episodes, filter by upload date or follow live event calendars. Cast and sports data are bundled with the extension; older names remain for catch-up viewing. Website layout changes can affect coverage.

## Single purpose

Hide likely sport and entertainment spoilers on supported websites while the user's chosen protection schedule or temporary protection is active.

## Permission explanations

- **storage:** Save the user's protection schedule, temporary overrides, caught-up state, selected packs, sensitivity, custom terms and site preferences using browser extension sync storage.
- **alarms:** Update protection and the toolbar icon when a scheduled session or temporary override starts or ends, including resuming after "I'm caught up".
- **Host access:** Read page text and modify matching cards on Google Search, Google News, BBC, The Guardian and YouTube to blur potential spoilers and provide reveal controls. Content is processed locally. Access is limited to the seven HTTPS host patterns in the manifest.
- **Remote code:** None. The extension's scripts and rule data are included in the package. No external script, remote rule feed or AI service is used.

The privacy declarations should continue to reflect local page processing and no developer data collection. Browser-managed settings sync is explained in the [privacy policy](../../PRIVACY.md); this release adds no permissions or telemetry.

## Links

- Store item: <https://chromewebstore.google.com/detail/despoilerize/ekckhdeeoilbnocmcpnhbcocbapjpmof>
- Homepage: <https://github.com/AnthonyPWatts/Despoilerize>
- Support: <https://github.com/AnthonyPWatts/Despoilerize/issues>
- Privacy policy: <https://github.com/AnthonyPWatts/Despoilerize/blob/main/PRIVACY.md>

The prepared source and documentation were committed and pushed before submission so the public privacy and feature documentation match the candidate.

## Upload assets

Uploaded [the v1.1.0 ZIP](despoilerize-v1.1.0-chrome-web-store.zip). Its digest is recorded in [SHA256SUMS.txt](SHA256SUMS.txt). The existing [128 × 128 icon](../../public/icon-128.png) was retained.

Uploaded these five screenshots in this order:

1. [Big Brother — reveal an episode 11 clip](screenshots/live/08-big-brother-reveal-once.png).
2. [Formula 1 — reveal one highlights video](screenshots/live/03-youtube-reveal-once.png).
3. [Big Brother — protection on](screenshots/live/07-big-brother-protection-on.png).
4. [Protection schedule](screenshots/live/04-protection-schedule.png).
5. [Protected topics and custom terms](screenshots/live/05-protected-topics.png).

Each screenshot is 1280 × 800. The clear video in each reveal example was explicitly revealed by the viewer; the extension did not infer that it had been watched.

Promotional assets: [440 × 280 small tile](promo/small-promo-tile.png) and [1400 × 560 marquee tile](promo/marquee-promo-tile.png). Dimensions and the five-image selection follow the [Chrome Web Store image guidance](https://developer.chrome.com/docs/webstore/images).

## Reviewer steps

No login or account is required.

1. Open settings, choose **Always on**, select **Big Brother** and choose **Lockdown**. Deselect Formula 1 if testing the show pack by itself.
2. In a signed-out browser, search YouTube for `Big Brother 2026`. Matching text cards should be hidden together with their thumbnails. Some unrelated results may remain visible.
3. Use **Reveal once** on one card, then **Reveal all on page** to check both controls.
4. Open the toolbar popup and select **I'm caught up**. Protection should turn off while the saved topics and schedule remain unchanged. With Always on, deliberate reactivation is needed because there is no next scheduled start.
5. Select **Return to schedule** to reactivate protection. In settings, select **Every weekend** to inspect the scheduled behaviour and its next-session summary.

## Publication hand-off

The dashboard's 500-character reviewer field contains this condensed version of the steps above:

> No account needed. In settings choose Always on, Big Brother and Lockdown; deselect Formula 1. Search signed-out YouTube for "Big Brother 2026". Matching cards and thumbnails blur. Test Reveal once and Reveal all on page. In the popup, "I'm caught up" turns protection off without changing saved settings. With Always on, use Return to schedule to reactivate. Select Every weekend in settings to inspect the next-session summary.

The dashboard accepted the submission and confirmed **Pending review**. Following approval, verify that the public store listing and an installed copy both report v1.1.0. Then update publication status in the repository and create the corresponding Git tag and GitHub release when authorised. Store-managed automatic upgrades have not been exercised by the local fixture tests.
