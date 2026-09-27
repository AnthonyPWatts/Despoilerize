# The Traitors protection pack

Choose **Entertainment → The Traitors** in settings. It saves automatically and uses the existing protection schedule. Select it independently of the broader **Reality TV** pack when only The Traitors needs protecting.

## Coverage

The pack recognises UK and Celebrity Traitors titles, common hashtags, Uncloaked references, Claudia Winkleman and Ardross Castle. Its cast vocabulary includes:

- All 21 announced contestants for Celebrity Traitors UK series two (2026).
- All 19 contestants from Celebrity Traitors UK series one (2025).
- All 22 contestants from The Traitors UK series four (2026).

Names include accented and unaccented spellings, curly and straight apostrophes, Richard E. Grant without the full stop, Myha’la/Myhala, and Ben and Maz's full-name variants. Common first names require nearby game wording; they are not standalone keywords. No contestant roles, finishing positions or actual outcomes are stored.

Banishments, murders, role reveals, recruitment, round-table votes, the poisoned chalice, shields, prize money and finale wording can trigger protection. A known contestant's full name can identify a spoiler even when the headline omits the programme title. Generic words such as `faithful`, `murdered` and `winner` cannot trigger this pack by themselves.

**Balanced** and **Gentle** leave ordinary cast announcements, viewing schedules and unrelated celebrity coverage visible when there is no spoiler wording. **Lockdown** also hides recognised titles and full cast names without result wording, including their other work. Use Balanced if that is too broad. First-name-only headlines without enough programme context can be missed; Lockdown does not treat every mention of `James`, `Rachel` or `Joe` as a contestant.

The pack uses text available to the extension on supported sites. It cannot read text burnt into thumbnails, recognise faces, or guarantee protection from every spoiler. International versions and older UK series can match programme wording, but their complete casts are not included. New contestants require a vocabulary update or a distinctive custom term.

## Sources and maintenance

Cast membership checked on **27 September 2026**:

- [Studio Lambert: 2026 news, Celebrity Traitors S2 cast announcement](https://studiolambert.com/news-2026/).
- [Studio Lambert: 2025 news, Celebrity Traitors cast announcement](https://studiolambert.com/news-2025/).
- [Royal Television Society: UK series-four contestant introductions](https://rts.org.uk/article/meet-contestants-traitors-series-four-ages-professions-and-more).
- [TraitorBase: UK series-four cast](https://traitorbase.com/uk/season-4), used to cross-check full names. Source pages can themselves contain spoilers.

Update the season-labelled arrays in [the vocabulary](../src/rules/vocab/traitors.ts) when a cast is confirmed. Keep existing names for viewers catching up on earlier series, add published aliases where useful, and record the check date here. Use announced cast membership rather than rumours; do not add roles or outcomes. The extension ships this data locally and does not fetch cast lists or viewing history.

## Verification

The [matching tests](../tests/traitors.test.ts) cover every included cast member, aliases, programme and result wording, sensitivity settings and unrelated news. Example outcomes in tests are invented.

The browser regression enables the pack in settings, reopens settings to check persistence, checks the popup summary, hides synthetic BBC cards, reveals one card, and disables the pack to restore the others.

For a live smoke test, use a signed-out profile on a supported site, enable this pack and compare the same results in Balanced and Lockdown. Confirm titles and thumbnails are hidden together, **Reveal once** affects only one item, and **I'm caught up** ends protection without changing the saved selection or schedule. Avoid live results if the programme itself still needs catching up on.
