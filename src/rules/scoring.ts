import type { RiskResult, RulePack, Sensitivity } from "../shared/types";

const thresholds: Record<Sensitivity, number> = {
  gentle: 9,
  balanced: 6,
  lockdown: 3
};

function normaliseText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
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

function topicReason(pack: RulePack): string {
  return `Matched ${pack.label} protected topic`;
}

function spoilerReason(pack: RulePack): string {
  if (pack.id === "reality-tv") {
    return "Matched Reality TV spoiler wording";
  }

  if (pack.id === "world-cup-2026") {
    return "Matched World Cup tournament progress wording";
  }

  return `Matched ${pack.label} result wording`;
}

function patternReason(pack: RulePack): string {
  if (pack.id === "reality-tv") {
    return "Matched Reality TV spoiler wording";
  }

  if (pack.id === "world-cup-2026") {
    return "Matched World Cup tournament pattern";
  }

  return `Matched ${pack.label} result pattern`;
}

function safeContextReason(pack: RulePack): string {
  return `Possible safe context for ${pack.label}`;
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
    const packReasons: string[] = [];

    packScore += sensitivity === "lockdown" ? 4 : 3;

    if (spoilerMatches.length > 0) {
      packScore += spoilerMatches.length >= 2 ? 6 : 5;
      packReasons.push(spoilerReason(pack));
    }

    if (regexMatches.length > 0) {
      packScore += 6;
      packReasons.push(patternReason(pack));
    }

    if (safeMatches.length > 0 && sensitivity !== "lockdown") {
      packScore -= 2;
      packReasons.push(safeContextReason(pack));
    }

    if (packScore > 0) {
      packIds.push(pack.id);
      score += packScore;
      reasons.push(...(packReasons.length > 0 ? packReasons : [topicReason(pack)]));
    }
  }

  const customMatches = customTerms.filter(term => containsTerm(text, term));
  if (customMatches.length > 0) {
    score += sensitivity === "lockdown" ? 4 : 3;
    reasons.push("Matched custom protected term");
  }

  return {
    shouldHide: score >= thresholds[sensitivity],
    score,
    packIds,
    reasons,
    sensitivity
  };
}
