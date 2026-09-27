import type { RulePack } from "../shared/types";
import { motoGpRiders2026, motoGpTeams2026, motorsportRegexes, motorsportSafeTerms, motorsportSpoilerTerms } from "./vocab/motorsport";

export const motoGpRulePack: RulePack = {
  id: "motogp",
  label: "MotoGP",
  group: "Motorsport",
  description: "MotoGP races, riders, teams, and championship results.",
  entities: [
    "motogp",
    "moto gp",
    "motorcycle grand prix",
    ...motoGpRiders2026,
    ...motoGpTeams2026,
    "marquez",
    "bagnaia",
    "martin",
    "quartararo",
    "acosta",
    "binder",
    "bastianini",
    "zarco",
    "razgatlioglu",
    "razgatlıoğlu",
    "moreira",
    "vinales",
    "morbidelli",
    "di giannantonio",
    "aldeguer",
    "bezzecchi",
    "ogura",
    "rins"
  ],
  spoilerTerms: motorsportSpoilerTerms,
  safeTerms: motorsportSafeTerms,
  regexes: motorsportRegexes
};
