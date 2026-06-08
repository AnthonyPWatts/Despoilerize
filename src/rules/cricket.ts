import type { RulePack } from "../shared/types";
import { cricketRegexes, cricketSafeTerms, cricketSpoilerTerms } from "./vocab/cricket";

export const cricketRulePack: RulePack = {
  id: "cricket",
  label: "Cricket",
  group: "Cricket",
  description: "General cricket results and score spoilers.",
  entities: [
    "cricket",
    "test match",
    "odi",
    "t20",
    "t20i",
    "world cup",
    "county championship",
    "the hundred"
  ],
  spoilerTerms: cricketSpoilerTerms,
  safeTerms: cricketSafeTerms,
  regexes: cricketRegexes
};

export const englandCricketRulePack: RulePack = {
  id: "england-cricket",
  label: "England cricket",
  group: "Cricket",
  description: "England cricket results across formats.",
  entities: [
    "england cricket",
    "england",
    "ben stokes",
    "joe root",
    "jos buttler",
    "jofra archer",
    "harry brook",
    "ollie pope",
    "mark wood"
  ],
  spoilerTerms: cricketSpoilerTerms,
  safeTerms: cricketSafeTerms,
  regexes: cricketRegexes
};

export const ashesRulePack: RulePack = {
  id: "ashes",
  label: "The Ashes",
  group: "Cricket",
  description: "Ashes Test series spoilers.",
  entities: [
    "ashes",
    "the ashes",
    "england",
    "australia",
    "baggy greens",
    "test match"
  ],
  spoilerTerms: cricketSpoilerTerms,
  safeTerms: cricketSafeTerms,
  regexes: cricketRegexes
};
