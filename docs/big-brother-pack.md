# Big Brother protection pack

Choose **Entertainment → Big Brother** in settings. Selection saves automatically and uses your existing schedule. The pack works independently of **Reality TV** and **The Traitors**.

For a series airing through the week, choose **Daily** with times that suit your catch-up routine, or **Always on** for continuous protection. Selecting the pack does not change your schedule. **I'm caught up** ends a scheduled session until its next start; Always on needs deliberate reactivation.

## Coverage

The pack targets **UK Big Brother**, with cast data checked on **27 September 2026** for the current civilian series (UK series 23 / ITV series four). It recognises all 16 published launch names, including participants who have since left. Keeping their names protects viewers catching up from the beginning.

| Published name | Full name or alias included |
| --- | --- |
| Yasmin | First name with programme context |
| Harry | Harry Symonds |
| Chelsey | Chelsey Ammari |
| Philip | Philip Regan; Queen of Scotty Road; guarded variant Phillip |
| Lynx | Lynx Noumey |
| Charlotte | Charlotte Nott |
| Pauline | Pauline Adeyemo |
| Tays | First name with programme context; guarded Michael Taylor |
| Rochelle | Rochelle Rackham |
| Millie | Millie Jarrett |
| Frankie | Frankie Taber |
| Samuel | Samuel Keen; guarded Sam |
| Rob | Rob Stirzaker |
| Rhianna | Rhianna Collins |
| Omar | Omar El Mayer |
| Johanne | Johanne Cade |

Programme names, `#BBUK`, `#BBUK2026`, `#BigBrother2026`, Celebrity Big Brother wording and the companion shows **The Group Chat** and **Late & Live** are recognised. AJ Odudu, Will Best, Kate Lawler, GK Barry and confirmed guest Jedward require programme context; ordinary coverage of their other work remains visible.

Spoiler wording includes nominations, public votes, evictions, immunity, ejections, voluntary departures, rule-breaking punishments, secret tasks, mole reveals, winners and prize money. Full cast names can identify an item without the show title. First names require nearby wording such as **housemate**, **Diary Room** or **up for eviction**. Plain `Harry`, `Rob`, `Lynx`, `BB` and `CBB` are not standalone keywords. Ordinary sibling and Orwell references should remain visible.

**Balanced** and **Gentle** leave ordinary cast announcements, viewing schedules and unrelated cast coverage visible when there is no spoiler wording. **Lockdown** also hides recognised programme coverage and full cast names without result wording. Select **Reveal once** to restore a particular item; DeSpoilerize does not infer which episodes you have watched or filter by upload date.

This is text matching on supported sites. Text burnt into thumbnails and faces are not analysed. Short-name-only posts without programme context can be missed. Older UK, celebrity and international editions can match programme wording, but their complete casts are not included. No later entrant was confirmed by the sources checked; unconfirmed replacements and guest rumours have not been added.

## See it in use

This signed-out YouTube example uses only the Big Brother pack in Lockdown. The viewer selected **Reveal once** on an episode 11 clip; episode 12 remains protected. Both are official ITV Reality clips from the same 2026 series.

![An episode 11 clip deliberately revealed while episode 12 remains protected](../Releases/v1.1/screenshots/live/08-big-brother-reveal-once.png)

The [gallery](../Releases/v1.1/screenshots/live/README.md) includes the same results before protection and with both clips hidden.

## Sources and maintenance

Checked on **27 September 2026**. Source pages can themselves contain spoilers.

- [Royal Television Society: 2026 contestant introductions, credited to ITV](https://rts.org.uk/article/meet-contestants-big-brother-2026): all 16 launch names and Philip's full name/alias.
- [Freely: 2026 line-up](https://www.freely.co.uk/what-to-watch/trending/big-brother-date-housemates-itv-2026): cross-check of the launch names and current series.
- [Oddschecker: 26 September cast-name table](https://www.oddschecker.com/insight/tv/20260926-big-brother-2026-odds-philip-regan-favourite-after-chelsey-eviction): published full names, cross-checked where available with [Media Mole's contestant profiles](https://mediamole.co.uk/entertainment/big-brother/). Only names were used; odds and outcomes are not shipped.
- [Capital: Millie Jarrett profile](https://www.capitalfm.com/news/tv-film/big-brother/uk-millie-jarrett-age-job-where-from-boyfriend-child/): full-name spelling.
- [Tom's Guide: current-series guide](https://www.tomsguide.com/entertainment/streaming/how-to-watch-big-brother-uk-2026): Michael Taylor/Tays alias.
- [ITV: The Group Chat announcement](https://www.itv.com/presscentre/media-releases/kate-lawler-and-gk-barry-announced-hosts-big-brother-group-chat): current companion show and presenters.
- [ITV: current-series update](https://www.itv.com/presscentre/media-releases/big-brother-streaming-32-new-series-keeps-viewers-hooked) and [ITVX episode listings](https://www.itv.com/watch/big-brother/10a4928): current run and programme terminology.
- [The Group Chat: official Jedward episode](https://podcasts.apple.com/gb/podcast/we-werent-bringing-the-trouble-jedward-explain-splashgate/id6812015795?i=1000791189069): confirmed guest appearance. Rumoured future guests are excluded.

Update the season-labelled [vocabulary](../src/rules/vocab/bigBrother.ts) when entrants or aliases are confirmed, then update this date and source list. Retain departed participants for catch-up viewers. Do not infer surnames, import private profiles, or store roles, nominations, finishing positions or results. All matching data ships locally; the extension does not scrape sites, fetch cast updates or read viewing history at runtime.

## Verification

[Matching tests](../tests/bigBrother.test.ts) cover every included name, aliases, show/result wording, sensitivities and unrelated news. Test outcomes are invented. The browser regression checks independent selection, saved settings, popup summary, hiding/revealing cards and disabling the pack.

The [live capture record](../Releases/v1.1/screenshots/live/capture.json) checks signed-out browsing, loaded thumbnails, protection off/on and a deliberate reveal within the same series. For a manual smoke test, enable only Big Brother in a fresh signed-out profile, compare Balanced and Lockdown on a supported site, reveal one card, and use **I'm caught up** to end protection while retaining your schedule and pack selection.
