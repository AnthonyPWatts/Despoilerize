import type { RulePack } from "../shared/types";
import { footballRegexes, footballSafeTerms, footballSpoilerTerms } from "./vocab/football";

export const footballRulePack: RulePack = {
  id: "football",
  label: "General football",
  group: "Football",
  description: "General football headlines and score/result language.",
  entities: [
    "football",
    "fa cup",
    "league cup",
    "carabao cup",
    "world cup",
    "euros",
    "euro 2028",
    "uefa",
    "fifa"
  ],
  spoilerTerms: footballSpoilerTerms,
  safeTerms: footballSafeTerms,
  regexes: footballRegexes
};

export const premierLeagueRulePack: RulePack = {
  id: "premier-league",
  label: "Premier League",
  group: "Football",
  description: "Premier League clubs and results.",
  entities: [
    "premier league",
    "arsenal",
    "aston villa",
    "bournemouth",
    "brentford",
    "brighton",
    "burnley",
    "chelsea",
    "crystal palace",
    "everton",
    "fulham",
    "leeds united",
    "liverpool",
    "manchester city",
    "man city",
    "manchester united",
    "man utd",
    "newcastle united",
    "nottingham forest",
    "sunderland",
    "tottenham",
    "spurs",
    "west ham",
    "wolves",
    "wolverhampton wanderers"
  ],
  spoilerTerms: footballSpoilerTerms,
  safeTerms: footballSafeTerms,
  regexes: footballRegexes
};

export const championshipRulePack: RulePack = {
  id: "championship",
  label: "Championship",
  group: "Football",
  description: "EFL Championship clubs and results.",
  entities: [
    "championship",
    "efl championship",
    "birmingham city",
    "blackburn rovers",
    "bristol city",
    "charlton athletic",
    "coventry city",
    "sky blues",
    "derby county",
    "hull city",
    "ipswich town",
    "leicester city",
    "middlesbrough",
    "millwall",
    "norwich city",
    "portsmouth",
    "preston north end",
    "qpr",
    "queens park rangers",
    "sheffield united",
    "sheffield wednesday",
    "southampton",
    "stoke city",
    "swansea city",
    "watford",
    "west brom",
    "west bromwich albion",
    "wrexham"
  ],
  spoilerTerms: footballSpoilerTerms,
  safeTerms: footballSafeTerms,
  regexes: footballRegexes
};

export const championsLeagueRulePack: RulePack = {
  id: "champions-league",
  label: "Champions League",
  group: "Football",
  description: "UEFA Champions League results and knockout stories.",
  entities: [
    "champions league",
    "uefa champions league",
    "ucl",
    "real madrid",
    "barcelona",
    "bayern munich",
    "borussia dortmund",
    "psg",
    "paris saint-germain",
    "inter milan",
    "ac milan",
    "juventus",
    "benfica",
    "porto",
    "ajax",
    "atletico madrid",
    "sporting cp"
  ],
  spoilerTerms: footballSpoilerTerms,
  safeTerms: footballSafeTerms,
  regexes: footballRegexes
};

export const englandFootballRulePack: RulePack = {
  id: "england-football",
  label: "England football",
  group: "Football",
  description: "England men's and women's national football results.",
  entities: [
    "england",
    "england football",
    "three lions",
    "lionesses",
    "euro 2028",
    "world cup qualifier",
    "nations league"
  ],
  spoilerTerms: footballSpoilerTerms,
  safeTerms: footballSafeTerms,
  regexes: footballRegexes
};

export const coventryCityRulePack: RulePack = {
  id: "coventry-city",
  label: "Coventry City",
  group: "Football",
  description: "Coventry City and Sky Blues results.",
  entities: [
    "coventry city",
    "coventry",
    "sky blues",
    "ccfc"
  ],
  spoilerTerms: footballSpoilerTerms,
  safeTerms: footballSafeTerms,
  regexes: footballRegexes
};
