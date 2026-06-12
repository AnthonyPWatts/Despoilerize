import type { RulePack } from "../shared/types";

const realityTvEntities = [
  "reality tv",
  "reality television",
  "love island",
  "the traitors",
  "big brother",
  "celebrity big brother",
  "i'm a celebrity",
  "i'm a celebrity get me out of here",
  "strictly",
  "strictly come dancing",
  "the apprentice",
  "britain's got talent",
  "bgt",
  "the masked singer",
  "race across the world",
  "married at first sight",
  "mafs",
  "the great british bake off",
  "bake off",
  "gbbo"
];

const realityTvSpoilerTerms = [
  "winner",
  "wins",
  "won",
  "crowned",
  "champion",
  "finalist",
  "finalists",
  "final",
  "finale",
  "eliminated",
  "elimination",
  "voted off",
  "voted out",
  "dumped",
  "evicted",
  "sent home",
  "left the show",
  "quit",
  "walked out",
  "revealed",
  "unmasked",
  "traitor revealed",
  "faithful",
  "banished",
  "murdered",
  "recoupling",
  "coupled up",
  "stolen",
  "bottom two",
  "dance-off",
  "star baker",
  "handshake",
  "fired"
];

const realityTvSafeTerms = [
  "preview",
  "recap",
  "when is",
  "what time",
  "watch",
  "how to watch",
  "line-up",
  "lineup",
  "cast",
  "contestants",
  "start date",
  "episode guide",
  "trailer",
  "odds"
];

export const realityTvRulePack: RulePack = {
  id: "reality-tv",
  label: "Reality TV",
  group: "Entertainment",
  description: "Reality TV eliminations, winners, reveals, and finale spoilers.",
  entities: realityTvEntities,
  spoilerTerms: realityTvSpoilerTerms,
  safeTerms: realityTvSafeTerms,
  regexes: [
    "\\bvoted\\s+(?:off|out)\\b",
    "\\bleft\\s+the\\s+show\\b",
    "\\btraitor\\s+revealed\\b"
  ]
};
