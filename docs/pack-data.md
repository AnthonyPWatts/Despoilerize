# Protection-pack data

Audited on **27 September 2026** for the unpublished v1.1.0 build. All 22 packs were reviewed for dated names, membership and coverage gaps. This is a bundled vocabulary snapshot, not a live sporting database.

## Coverage and changes

| Pack | Audit result |
| --- | --- |
| Formula 1 | All 22 current drivers and 11 teams. Added Colapinto, Lindblad, Pérez, Bottas, Audi and Cadillac. Tsunoda and Sauber remain in a separate catch-up list. |
| MotoGP | All 22 current riders, manufacturers and team names. Added the missing riders, including Razgatlıoğlu and Moreira, and independent teams. |
| General football | Competition vocabulary reviewed; no player or club membership is stored here. No change needed. |
| World Cup 2026 | All 48 tournament participants were already covered. Added Cabo Verde and Congo DR spellings. The completed tournament remains available for catch-up viewing. |
| Premier League | Updated the current list to the 20 clubs for 2026/27, including Coventry City, Hull City and Ipswich Town. |
| Championship | Updated the current list to the 24 clubs for 2026/27, including Bolton Wanderers, Cardiff City, Lincoln City, Burnley, West Ham United and Wolverhampton Wanderers. |
| Champions League | Expanded the small club sample to all 36 league-phase clubs for 2026/27. Qualified names such as RC Lens, Como 1907 and Viking FK avoid matching ordinary words. |
| England football | National-team and competition wording reviewed; no individual squad or manager data is stored. No change needed. |
| Rugby union | Added PREM Rugby and Gallagher PREM terminology; retained Premiership Rugby for older coverage. |
| Six Nations | Competition and six national-team terms reviewed; no individual squad data is stored. No change needed. |
| Rugby league | Expanded the six-club sample to all 14 men's Super League clubs for 2026, including Bradford Bulls, Toulouse Olympique and York Knights. This is not a complete list of women's, wheelchair or other rugby league clubs. |
| Cricket | Format and competition vocabulary reviewed; no club membership is stored. No change needed. |
| England cricket | Expanded to the combined September men's Test, ODI and IT20 selections (26 players), plus the women's Ireland squad and established players omitted for rest or injury (20 players). Retained Stokes and Wood; also included Salt and Bethell. Selection does not mean fitness or availability for a particular match. |
| The Ashes | Series, national-team and format vocabulary reviewed; no individual squad data is stored. No change needed. |
| Tennis | Added missing players from the men's and women's top ten on 21 September, retaining Djokovic and Raducanu. Federer, Nadal and Murray remain separately labelled catch-up names. This remains a selection of players, not a full ATP/WTA roster. |
| Wimbledon | Event and court names reviewed. No change needed. |
| Grand Slams | Added the hyphenated Roland-Garros spelling; all four events remain covered. |
| NFL | Expanded the partial nickname list to all 32 current franchises using their full names. Existing nicknames remain supported. |
| NBA | Expanded the partial nickname list to all 30 current teams using their full names, with both LA Clippers and Los Angeles Clippers. Existing nicknames remain supported. |
| Reality TV | Reviewed the show-title list and added Celebrity Traitors. This broad pack does not store seasonal casts. |
| The Traitors | UK and celebrity cast lists were already checked on the audit date. See the [cast coverage and sources](traitors-pack.md). |
| Big Brother | Dedicated UK pack added during this preparation, with all 16 published 2026 launch names. See the [cast coverage and sources](big-brother-pack.md). |

## Sources

Sources were checked on the audit date. Live directories may change after this snapshot; linked result pages can contain spoilers.

- **F1:** official [driver directory](https://www.formula1.com/en/drivers) and [team directory](https://www.formula1.com/en/teams).
- **MotoGP:** official [rider and team directory](https://www.motogp.com/en/riders/). Stable team names are used without requiring every title sponsor. Normalisation covers accented spellings such as Márquez and Viñales; Latin transliterations are also used where needed.
- **Premier League:** the league's [2026/27 membership announcement](https://www.premierleague.com/en/news/4673099/the-202627-premier-league-season-officially-starts).
- **Championship:** West Bromwich Albion's [confirmed 24-club line-up](https://www.wba.co.uk/news/202627-sky-bet-championship-line-confirmed).
- **Champions League:** UEFA's [2026/27 league-phase draw](https://www.uefa.com/uefachampionsleague/news/02a8-216cd740d41f-fd3b45ac4a0f-1000--champions-league-league-phase-draw-all-36-teams-learn-their/).
- **World Cup:** FIFA's [confirmed tournament participants](https://www.fifa.com/fr/tournaments/mens/worldcup/canadamexicousa2026/articles/coupe-du-monde-2026-equipes-qualifiees?searchOverlay=1).
- **Rugby:** [PREM Rugby's competition names](https://www.premrugby.com/about/about-prem-rugby) and [Super League's 2026 membership](https://www.superleague.co.uk/about).
- **England cricket:** ECB's [September men's white-ball squads](https://www.ecb.co.uk/news/4572089/england-men-announce-squads-for-odis-and-it20s-against-sri-lanka), [final Pakistan Test squad](https://www.ecb.co.uk/news/4570010/england-men-name-squad-for-final-rothesay-test-against-pakistan), and [women's Ireland squad and absences](https://www.ecb.co.uk/news/4561064).
- **Tennis:** official [WTA singles rankings](https://www.wtatennis.com/rankings/singles), dated 21 September 2026. Direct ATP access returned HTTP 403; the men's top-ten names were cross-checked against the dated lists from [TennisCompanion](https://tenniscompanion.org/rankings/mens/) and [Tennis DB](https://tennis-db.com/seasons-and-rankings). Men's rankings were therefore not independently verified against an accessible official ATP table. Rankings and points are not stored in the extension.
- **US sport:** official [NFL franchise directory](https://www.nfl.com/teams/) and [NBA team directory](https://www.nba.com/teams/).
- **Reality TV:** the [Traitors source record](traitors-pack.md#sources-and-maintenance) and [Big Brother source record](big-brother-pack.md) cover the current programme and cast additions. Other existing titles were retained for catch-up viewing; this audit does not claim that each programme is currently airing.

## Current membership and catch-up viewing

Season-labelled arrays distinguish current entries from retained names in the [vocabulary files](../src/rules/vocab/football.ts). Previous Premier League names Burnley, West Ham and Wolves remain recognised there. The Championship retains Coventry, Hull, Ipswich, Leicester and Sheffield Wednesday; the Champions League retains AC Milan, Juventus, Benfica and Ajax.

These retained entries are deliberate protection for older coverage, not claims about current league membership. Packs do not inspect a story's season, fixture, competition or publication date: a moved club can consequently match both its current and former competition packs. Similarly, a driver moving between F1 teams does not require a driver-to-team update because no such mapping is stored.

No finishing positions, contestant roles, injury status, rankings, live results or watched-episode history are stored. Eliminated contestants and absent competitors are not removed simply because they have left the current competition. Broader coverage in Lockdown also hides non-result stories about recognised names.

New ambiguous entries use qualified names, for example Orlando Magic, Utah Jazz, Jack Miller and Joan Mir. A headline containing only an omitted short name may be missed; this is preferable to adding every common name or word as a standalone entity. Existing broad terms and nicknames have not been reworked in this data update.

## Maintenance and verification

Before each release, check official grids, confirmed promotion/relegation and European qualification lists, current national selections and programme cast announcements. Keep current and retained lists separate, record the source and date, and avoid treating a predicted line-up as confirmed. Updates ship with the extension; it does not fetch these sources at runtime.

The [data regression tests](../tests/packData.test.ts) check current-list sizes and uniqueness, matching through the selected public packs, new names and spelling variants, retained catch-up coverage, sensitivity behaviour and unrelated-word regressions. Test outcomes are invented and are not sporting results.

For a live check, reload the built extension in a signed-out profile, select one changed pack and compare known matching headlines with unrelated neighbouring cards on a supported site. Check Balanced and Lockdown, then **Reveal once** and **I'm caught up**. Automated fixture tests do not establish complete coverage of current live sites or every abbreviated headline.
