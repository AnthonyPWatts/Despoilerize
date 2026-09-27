import type { RulePack } from "../shared/types";
import { f1CatchUpNames, f1Drivers2026, f1Teams2026, motorsportRegexes, motorsportSafeTerms, motorsportSpoilerTerms } from "./vocab/motorsport";

export const f1RulePack: RulePack = {
  id: "f1",
  label: "Formula 1",
  group: "Motorsport",
  description: "Formula 1 races, qualifying, sprints, drivers, and teams.",
  entities: [
    "f1",
    "formula 1",
    "formula one",
    "grand prix",
    "gp",
    "qualifying",
    "sprint race",
    "sprint",
    "race",
    "paddock",
    "grid",
    "fia",
    ...f1Drivers2026,
    ...f1Teams2026,
    ...f1CatchUpNames
  ],
  spoilerTerms: motorsportSpoilerTerms,
  safeTerms: motorsportSafeTerms,
  regexes: motorsportRegexes
};
