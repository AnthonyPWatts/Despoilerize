import type { RulePack } from "../shared/types";
import { footballRegexes } from "./vocab/football";

const rugbySpoilerTerms = [
  "wins",
  "won",
  "winner",
  "beat",
  "beats",
  "beaten",
  "defeat",
  "defeats",
  "defeated",
  "lose",
  "loses",
  "lost",
  "draw",
  "try",
  "tries",
  "conversion",
  "penalty",
  "drop goal",
  "grand slam",
  "triple crown",
  "wooden spoon",
  "score",
  "result"
];

const rugbySafeTerms = [
  "preview",
  "fixtures",
  "schedule",
  "what time",
  "watch",
  "team news",
  "squad"
];

export const rugbyUnionRulePack: RulePack = {
  id: "rugby-union",
  label: "Rugby union",
  group: "Rugby",
  description: "General rugby union result spoilers.",
  entities: [
    "rugby union",
    "rugby",
    "premiership rugby",
    "urc",
    "united rugby championship",
    "champions cup",
    "world cup"
  ],
  spoilerTerms: rugbySpoilerTerms,
  safeTerms: rugbySafeTerms,
  regexes: footballRegexes
};

export const sixNationsRulePack: RulePack = {
  id: "six-nations",
  label: "Six Nations",
  group: "Rugby",
  description: "Six Nations and international rugby results.",
  entities: [
    "six nations",
    "guinness six nations",
    "england rugby",
    "wales rugby",
    "scotland rugby",
    "ireland rugby",
    "france rugby",
    "italy rugby",
    "grand slam",
    "triple crown"
  ],
  spoilerTerms: rugbySpoilerTerms,
  safeTerms: rugbySafeTerms,
  regexes: footballRegexes
};

export const rugbyLeagueRulePack: RulePack = {
  id: "rugby-league",
  label: "Rugby league",
  group: "Rugby",
  description: "General rugby league result spoilers.",
  entities: [
    "rugby league",
    "super league",
    "challenge cup",
    "wigan warriors",
    "st helens",
    "leeds rhinos",
    "warrington wolves",
    "hull kr",
    "catalans dragons"
  ],
  spoilerTerms: rugbySpoilerTerms,
  safeTerms: rugbySafeTerms,
  regexes: footballRegexes
};
