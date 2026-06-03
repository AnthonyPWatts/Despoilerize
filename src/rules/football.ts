import type { RulePack } from "../shared/types";

export const footballRulePack: RulePack = {
  id: "football",
  label: "Football",
  entities: [
    "football",
    "premier league",
    "championship",
    "fa cup",
    "league cup",
    "champions league",
    "europa league",
    "coventry city",
    "sky blues",
    "england"
  ],
  spoilerTerms: [
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
    "drew",
    "equaliser",
    "penalty shootout",
    "knocked out",
    "stunned",
    "comeback",
    "injury-time",
    "stoppage-time",
    "full-time",
    "ft",
    "score",
    "result",
    "promoted",
    "relegated",
    "title"
  ],
  safeTerms: [
    "preview",
    "fixtures",
    "schedule",
    "what time",
    "watch",
    "team news"
  ],
  regexes: [
    "\\b\\d{1,2}\\s*[-–:]\\s*\\d{1,2}\\b"
  ]
};
