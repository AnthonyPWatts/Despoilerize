import type { RulePack } from "../shared/types";
import { tennisRegexes, tennisSafeTerms, tennisSpoilerTerms } from "./vocab/tennis";

export const tennisRulePack: RulePack = {
  id: "tennis",
  label: "Tennis",
  group: "Tennis",
  description: "General tennis results and tournament spoilers.",
  entities: [
    "tennis",
    "atp",
    "wta",
    "djokovic",
    "alcaraz",
    "sinner",
    "nadal",
    "federer",
    "swiatek",
    "sabalenka",
    "gauff",
    "raducanu",
    "murray",
    "british number one"
  ],
  spoilerTerms: tennisSpoilerTerms,
  safeTerms: tennisSafeTerms,
  regexes: tennisRegexes
};

export const wimbledonRulePack: RulePack = {
  id: "wimbledon",
  label: "Wimbledon",
  group: "Tennis",
  description: "Wimbledon results and draw spoilers.",
  entities: [
    "wimbledon",
    "all england club",
    "centre court",
    "no 1 court",
    "ladies' singles",
    "gentlemen's singles"
  ],
  spoilerTerms: tennisSpoilerTerms,
  safeTerms: tennisSafeTerms,
  regexes: tennisRegexes
};

export const grandSlamsRulePack: RulePack = {
  id: "grand-slams",
  label: "Grand Slams",
  group: "Tennis",
  description: "Grand Slam tennis tournaments.",
  entities: [
    "grand slam",
    "australian open",
    "french open",
    "roland garros",
    "wimbledon",
    "us open"
  ],
  spoilerTerms: tennisSpoilerTerms,
  safeTerms: tennisSafeTerms,
  regexes: tennisRegexes
};
