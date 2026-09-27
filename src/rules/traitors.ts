import type { RulePack } from "../shared/types";
import {
  celebrityTraitors2025Cast, celebrityTraitors2026Cast, traitorsNameAliases,
  traitorsShortNames, traitorsUk2026Cast
} from "./vocab/traitors";

const shortName = `\\b(?:${traitorsShortNames.join("|")})\\b`;
const gameContext = "\\b(?:banish(?:ed|ment|ments)?|round[ -]?table|traitors?|faithfuls?|murder shortlist|murdered overnight|murdered in plain sight|death row|traitors?' turret)\\b";
const title = "\\b(?:the\\s*)?(?:celebrity\\s*)?traitors(?:uk)?\\b";
const outcome = "\\b(?:win(?:s|ner|ners)?|won|victory|finalists?|results?|eliminat(?:ed|ion)|evicted|exit|leaves|left|unmask(?:ed|s)?|recruit(?:ed|ment)?|betray(?:ed|al)|shield|immunity|poisoned|kiss of death|prize pot|endgame|end game|split the money|stole the money|takes it all)\\b";
// Full stops can be name initials (Richard E. Grant), not sentence boundaries.
const nearby = "[^!?]{0,100}";
const roleLink = "(?:'s)?\\s+(?:(?:is|was|gets?|has|been|a|the|secret|revealed|as|not|actually|now|still|really|confirmed|to|be|chosen|selected|remains?|finally)\\s+){0,6}";

export const traitorsRulePack: RulePack = {
  id: "the-traitors",
  label: "The Traitors",
  group: "Entertainment",
  description: "UK and Celebrity Traitors: cast, banishments, murders and reveals. Includes the 2026 celebrity line-up.",
  entities: [
    "the traitors", "celebrity traitors", "traitors uk", "uk traitors",
    "traitors uncloaked", "thetraitors", "celebritytraitors", "thecelebritytraitors",
    "traitorsuk", "traitorsuncloaked", "ardross castle", "claudia winkleman",
    ...celebrityTraitors2026Cast, ...celebrityTraitors2025Cast,
    ...traitorsUk2026Cast, ...traitorsNameAliases
  ],
  entityRegexes: [
    `${shortName}${roleLink}${gameContext}`,
    `${gameContext}(?:\\s*[:,-]|\\s+(?:is|was|revealed|as|a|the|secret)){0,4}\\s+${shortName}`,
    `${title}${nearby}${gameContext}`,
    `${gameContext}${nearby}${title}`,
    `${title}${nearby}\\b(?:bbc|iplayer|series|season|episode|recap|uncloaked|cast|line[ -]?up|tonight|final(?:e|ist|ists)?|winner)\\b`,
    `\\b(?:bbc|iplayer)\\b${nearby}${title}`
  ],
  spoilerTerms: [
    "banished", "banishment", "banishments", "murdered", "murder", "murders",
    "traitor", "faithful", "faithfuls", "recruited", "recruitment", "betrayed",
    "round table", "roundtable", "round-table", "death row", "murder shortlist",
    "kiss of death", "poisoned chalice", "secret traitor", "turret", "conclave"
  ],
  // Topic-only previews already fall below Gentle/Balanced thresholds. Words
  // such as "cast", "watch" and "recap" must not weaken an actual role reveal.
  safeTerms: [],
  regexes: [
    "\\b(?:banish(?:ed|ment|ments)?|murder(?:ed|s)?|faithfuls?|recruit(?:ed|ment)?|betray(?:ed|al)|round[ -]?table|death row|murder shortlist|kiss of death|poisoned chalice|turret|conclave)\\b",
    "\\btraitor\\b",
    "\\bvoted\\s+(?:off|out)\\b",
    `${title}${nearby}${outcome}`,
    `${outcome}${nearby}${title}`,
    // A cast member winning another award is not a programme result.
    "\\b(?:win(?:s)?|won|takes? home|scoops?|steals?|splits?)\\b[^.!?]{0,40}(?:£|prize pot|prize money|the money)"
  ]
};
