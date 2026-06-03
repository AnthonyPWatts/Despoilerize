import type { RulePack } from "../shared/types";
import { f1RulePack } from "./f1";
import { footballRulePack } from "./football";

const packs: Record<string, RulePack> = {
  [f1RulePack.id]: f1RulePack,
  [footballRulePack.id]: footballRulePack
};

export function getRulePacks(ids: string[]): RulePack[] {
  return ids.map(id => packs[id]).filter(Boolean);
}

export function getAllRulePacks(): RulePack[] {
  return Object.values(packs);
}
