import type { RiskResult, RulePack, Sensitivity } from "../shared/types";

const thresholds: Record<Sensitivity, number> = {
  gentle: 9,
  balanced: 6,
  lockdown: 3
};

function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(text: string, term: string): boolean {
  const normalisedTerm = normaliseText(term);
  if (!normalisedTerm) return false;

  const escaped = normalisedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return pattern.test(text);
}

export function scoreText(
  rawText: string,
  packs: RulePack[],
  sensitivity: Sensitivity,
  customTerms: string[] = []
): RiskResult {
  const text = normaliseText(rawText);
  const reasons: string[] = [];
  const packIds: string[] = [];
  let score = 0;

  if (!text || text.length < 3) {
    return { shouldHide: false, score: 0, packIds: [], reasons: [], sensitivity };
  }

  for (const pack of packs) {
    const entityMatches = pack.entities.filter(term => containsTerm(text, term));
    const spoilerMatches = pack.spoilerTerms.filter(term => containsTerm(text, term));
    const safeMatches = pack.safeTerms.filter(term => containsTerm(text, term));
    const regexMatches = pack.regexes.filter(pattern => new RegExp(pattern, "i").test(text));

    // Avoid blocking general news just because it contains words such as "crash",
    // "beats", "loss", or a result-looking number. A sport pack should only fire
    // when the item also mentions a protected entity from that pack.
    if (entityMatches.length === 0) {
      continue;
    }

    let packScore = 0;

    packScore += sensitivity === "lockdown" ? 4 : 3;
    reasons.push(`${pack.label}: entity match (${entityMatches.slice(0, 3).join(", ")})`);

    if (spoilerMatches.length > 0) {
      packScore += spoilerMatches.length >= 2 ? 6 : 5;
      reasons.push(`${pack.label}: spoiler wording (${spoilerMatches.slice(0, 3).join(", ")})`);
    }

    if (regexMatches.length > 0) {
      packScore += 6;
      reasons.push(`${pack.label}: result-like pattern`);
    }

    if (safeMatches.length > 0 && sensitivity !== "lockdown") {
      packScore -= 2;
      reasons.push(`${pack.label}: possible safe context (${safeMatches.slice(0, 2).join(", ")})`);
    }

    if (packScore > 0) {
      packIds.push(pack.id);
      score += packScore;
    }
  }

  const customMatches = customTerms.filter(term => containsTerm(text, term));
  if (customMatches.length > 0) {
    score += sensitivity === "lockdown" ? 4 : 3;
    reasons.push(`Custom term match (${customMatches.slice(0, 3).join(", ")})`);
  }

  return {
    shouldHide: score >= thresholds[sensitivity],
    score,
    packIds,
    reasons,
    sensitivity
  };
}
