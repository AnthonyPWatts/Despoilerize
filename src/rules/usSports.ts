import type { RulePack } from "../shared/types";
import { usSportsRegexes, usSportsSafeTerms, usSportsSpoilerTerms } from "./vocab/usSports";

export const nflRulePack: RulePack = {
  id: "nfl",
  label: "NFL",
  group: "US sports",
  description: "NFL results, playoffs, and Super Bowl spoilers.",
  entities: [
    "nfl",
    "super bowl",
    "american football",
    "chiefs",
    "eagles",
    "cowboys",
    "packers",
    "patriots",
    "ravens",
    "49ers",
    "niners",
    "bills",
    "dolphins",
    "steelers"
  ],
  spoilerTerms: usSportsSpoilerTerms,
  safeTerms: usSportsSafeTerms,
  regexes: usSportsRegexes
};

export const nbaRulePack: RulePack = {
  id: "nba",
  label: "NBA",
  group: "US sports",
  description: "NBA results, playoffs, and Finals spoilers.",
  entities: [
    "nba",
    "basketball",
    "nba finals",
    "lakers",
    "celtics",
    "warriors",
    "bulls",
    "knicks",
    "heat",
    "nuggets",
    "bucks",
    "mavericks",
    "suns"
  ],
  spoilerTerms: usSportsSpoilerTerms,
  safeTerms: usSportsSafeTerms,
  regexes: usSportsRegexes
};
