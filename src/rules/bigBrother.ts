import type { RulePack } from "../shared/types";
import { bigBrotherContextNames, bigBrotherUk2026Cast } from "./vocab/bigBrother";

const name = `\\b(?:${bigBrotherContextNames.join("|")})\\b`;
const title = "\\b(?:celebrity\\s+)?big\\s*brother(?:\\s*uk)?\\b";
const nearby = "[^.!?]{0,100}";
const gameContext = "\\b(?:housemates?|diary room|up for eviction|faces? (?:the )?public vote|facing (?:the )?public vote|eviction (?:night|interview)|nominations? (?:results?|twist)|secret (?:task|mission|mole)|deputy mole|house of (?:chaos|double trouble|nothing)|head of house|shopping task)\\b";
const outcome = "\\b(?:evict(?:ed|ion|ions|ee|ees)?|nominat(?:ed|ions?)|ejected|expelled|eliminat(?:ed|ion)|voted (?:off|out)|public vote|immun(?:e|ity)|secret (?:task|mission|mole)|deputy mole|mole reveal|rule[ -]?break(?:s|ing)?|punish(?:ed|ment)|removed from the house|(?:walks?|walked|walking) out|(?:leaves?|left|quits?|quit|quitting) (?:the )?(?:house|show)|exit interview|shock(?:ing)? exit)\\b";
const result = "\\b(?:win(?:s|ner|ners)?|won|crowned|finalists?|results?|quits?|walked|exit|leaves|left|runner[ -]?up|first out|last out)\\b";
const tvContext = "\\b(?:itv2?|itvx|channel 4|channel 5|series|season|episodes?|ep\\.?\\s*\\d+|20\\d{2}|recap|cast|line[ -]?up|trailer|tonight|finale?|the group chat|late (?:&|and) live)\\b";

export const bigBrotherRulePack: RulePack = {
  id: "big-brother",
  label: "Big Brother",
  group: "Entertainment",
  description: "UK Big Brother: 2026 housemates, nominations, evictions and twist reveals.",
  entities: [
    "big brother uk", "celebrity big brother", "bigbrother", "bigbrotheruk",
    "bbuk", "bbuk2026", "celebritybigbrother", "cbbuk",
    "big brother: the group chat", "big brother: late & live",
    ...bigBrotherUk2026Cast.flatMap(person => person.aliases)
  ],
  // First names and the ambiguous title need nearby programme wording.
  // A pet lynx, a sibling or Orwell coverage must not become a protected topic.
  entityRegexes: [
    `${name}${nearby}${gameContext}`, `${gameContext}${nearby}${name}`,
    `${name}${nearby}${title}`, `${title}${nearby}${name}`,
    `${name}\\s+(?:(?:is|was|the|a|secret|deputy|revealed|as|chosen|becomes?)\\s+){1,5}mole\\b`,
    `${title}${nearby}(?:${gameContext}|${tvContext}|${outcome}|${result})`,
    `(?:${gameContext}|${tvContext}|${outcome}|${result})${nearby}${title}`,
    "\\bbigbrother(?:uk)?20\\d{2}\\b",
    // Companion-show titles are often shortened in podcast headlines.
    "\\bthe group chat\\b[^.!?]{0,100}\\b(?:gk barry|kate lawler|housemates?|eviction)\\b",
    "\\b(?:gk barry|kate lawler)\\b[^.!?]{0,100}\\bthe group chat\\b"
  ],
  spoilerTerms: [
    "evicted", "eviction", "evictee", "nominated", "nominations", "public vote",
    "immunity", "immune", "ejected", "secret task", "secret mission",
    "secret mole", "deputy mole", "rule break", "punishment", "exit interview"
  ],
  safeTerms: [],
  regexes: [
    outcome,
    "\\b(?:quits?|quitting|walked)\\b",
    `${title}${nearby}${result}`, `${result}${nearby}${title}`,
    "\\b(?:bbuk(?:2026)?|cbbuk|bigbrother(?:uk)?(?:2026)?|celebritybigbrother)\\b[^.!?]{0,100}" + result,
    result + "[^.!?]{0,100}\\b(?:bbuk(?:2026)?|cbbuk|bigbrother(?:uk)?(?:2026)?|celebritybigbrother)\\b",
    "\\b(?:win(?:s)?|won|takes? home|scoops?)\\b[^.!?]{0,40}(?:£|prize money|the money)",
    "\\b(?:is|was|revealed as|chosen as|becomes?)\\s+(?:the |a )?(?:secret |deputy )?mole\\b"
  ]
};
