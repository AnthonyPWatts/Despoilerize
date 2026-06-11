import type { RulePack, RulePackGroup } from "../shared/types";
import { f1RulePack } from "./f1";
import { motoGpRulePack } from "./motorsport";
import {
  championshipRulePack,
  championsLeagueRulePack,
  englandFootballRulePack,
  footballRulePack,
  premierLeagueRulePack,
  worldCup2026RulePack
} from "./football";
import { ashesRulePack, cricketRulePack, englandCricketRulePack } from "./cricket";
import { grandSlamsRulePack, tennisRulePack, wimbledonRulePack } from "./tennis";
import { rugbyLeagueRulePack, rugbyUnionRulePack, sixNationsRulePack } from "./rugby";
import { nbaRulePack, nflRulePack } from "./usSports";

const allPacks: RulePack[] = [
  f1RulePack,
  motoGpRulePack,
  footballRulePack,
  worldCup2026RulePack,
  premierLeagueRulePack,
  championshipRulePack,
  championsLeagueRulePack,
  englandFootballRulePack,
  rugbyUnionRulePack,
  sixNationsRulePack,
  rugbyLeagueRulePack,
  cricketRulePack,
  englandCricketRulePack,
  ashesRulePack,
  tennisRulePack,
  wimbledonRulePack,
  grandSlamsRulePack,
  nflRulePack,
  nbaRulePack
];

const packs: Record<string, RulePack> = Object.fromEntries(
  allPacks.map(pack => [pack.id, pack])
);

export function getRulePacks(ids: string[]): RulePack[] {
  return ids.map(id => packs[id]).filter(Boolean);
}

export function getAllRulePacks(): RulePack[] {
  return allPacks;
}

export function getRulePackGroups(): RulePackGroup[] {
  const groups = new Map<string, RulePack[]>();

  for (const pack of allPacks) {
    const existing = groups.get(pack.group) ?? [];
    existing.push(pack);
    groups.set(pack.group, existing);
  }

  return Array.from(groups.entries()).map(([label, packs]) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label,
    packs
  }));
}
