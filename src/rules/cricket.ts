import type { RulePack } from "../shared/types";
import { cricketRegexes, cricketSafeTerms, cricketSpoilerTerms, englandMenSeptember2026, englandWomenSeptember2026 } from "./vocab/cricket";

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
    ...englandMenSeptember2026,
    ...englandWomenSeptember2026,
    // Retain established players absent from these September selections.
    "ben stokes",
    "mark wood",
    "phil salt",
    "jacob bethell"
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
