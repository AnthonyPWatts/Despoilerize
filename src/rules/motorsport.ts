import type { RulePack } from "../shared/types";
import { motorsportRegexes, motorsportSafeTerms, motorsportSpoilerTerms } from "./vocab/motorsport";

export const motoGpRulePack: RulePack = {
  id: "motogp",
  label: "MotoGP",
  group: "Motorsport",
  description: "MotoGP races, riders, teams, and championship results.",
  entities: [
    "motogp",
    "moto gp",
    "motorcycle grand prix",
    "marquez",
    "bagnaia",
    "martin",
    "quartararo",
    "acosta",
    "binder",
    "bastianini",
    "zarco",
    "ducati",
    "yamaha",
    "honda",
    "ktm",
    "aprilia"
  ],
  spoilerTerms: motorsportSpoilerTerms,
  safeTerms: motorsportSafeTerms,
  regexes: motorsportRegexes
};
