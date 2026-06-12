import { describe, expect, it } from "vitest";
import { scoreText } from "../src/rules/scoring";
import { f1RulePack } from "../src/rules/f1";
import {
  championshipRulePack,
  footballRulePack,
  premierLeagueRulePack,
  worldCup2026RulePack
} from "../src/rules/football";
import { motoGpRulePack } from "../src/rules/motorsport";
import { englandCricketRulePack } from "../src/rules/cricket";
import { wimbledonRulePack } from "../src/rules/tennis";
import { sixNationsRulePack } from "../src/rules/rugby";
import { nflRulePack } from "../src/rules/usSports";
import { realityTvRulePack } from "../src/rules/entertainment";

describe("scoreText", () => {
  it("flags a clear F1 winner headline", () => {
    const result = scoreText(
      "Norris wins chaotic Monaco GP after late safety car",
      [f1RulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("does not hide a harmless highlights timing headline in balanced mode", () => {
    const result = scoreText(
      "What time are the Monaco GP highlights on Channel 4?",
      [f1RulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(false);
  });

  it("does hide a harmless F1 headline in lockdown mode", () => {
    const result = scoreText(
      "What time are the Monaco GP highlights on Channel 4?",
      [f1RulePack],
      "lockdown"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags DNF and position-style F1 result language", () => {
    const result = scoreText(
      "Hamilton P3 after Verstappen DNF in dramatic race",
      [f1RulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags a MotoGP race winner headline", () => {
    const result = scoreText(
      "Bagnaia wins dramatic MotoGP sprint after Marquez crash",
      [motoGpRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("does not hide general news just because it says crash", () => {
    const result = scoreText(
      "Police chief says arrest footage was difficult to watch after crash investigation",
      [f1RulePack],
      "lockdown"
    );

    expect(result.shouldHide).toBe(false);
  });

  it("does not hide arbitrary videos just because they contain result-like numbers", () => {
    const result = scoreText(
      "Amazing restoration project part 2 - 1 hour special",
      [footballRulePack],
      "lockdown"
    );

    expect(result.shouldHide).toBe(false);
  });

  it("does not trigger on City alone in football context", () => {
    const result = scoreText(
      "City centre traffic changes confirmed by council",
      [premierLeagueRulePack],
      "lockdown"
    );

    expect(result.shouldHide).toBe(false);
  });

  it("does trigger on a full Championship club result", () => {
    const result = scoreText(
      "Coventry City beat Sunderland after late winner",
      [championshipRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags a Championship scoreline when a protected club is mentioned", () => {
    const result = scoreText(
      "West Brom 2-1 Coventry City: Baggies win thriller",
      [championshipRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags a World Cup 2026 tournament elimination headline", () => {
    const result = scoreText(
      "Scotland knocked out of the 2026 World Cup after penalty shootout",
      [worldCup2026RulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
    expect(result.packIds).toContain("world-cup-2026");
  });

  it("flags World Cup 2026 headlines with accented team names", () => {
    const result = scoreText(
      "Curaçao eliminated from group stage after late VAR call",
      [worldCup2026RulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags World Cup 2026 tournament state changes", () => {
    const headlines = [
      "England through after dramatic stoppage-time winner",
      "Scotland eliminated from World Cup after draw",
      "Brazil top Group C with win over Morocco",
      "Argentina reach quarter-finals after extra time",
      "Penalty heartbreak for Ghana as Panama advance"
    ];

    for (const headline of headlines) {
      const result = scoreText(headline, [worldCup2026RulePack], "balanced");

      expect(result.shouldHide, headline).toBe(true);
    }
  });

  it("does not hide a football preview in balanced mode", () => {
    const result = scoreText(
      "Coventry City preview: team news before Sunderland fixture",
      [championshipRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(false);
  });

  it("does hide a football preview in lockdown mode", () => {
    const result = scoreText(
      "Coventry City preview: team news before Sunderland fixture",
      [championshipRulePack],
      "lockdown"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags a Wimbledon result headline", () => {
    const result = scoreText(
      "Raducanu knocked out of Wimbledon in straight sets",
      [wimbledonRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags an England cricket result headline", () => {
    const result = scoreText(
      "England beat Australia by 42 runs after Root century",
      [englandCricketRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags a Six Nations result headline", () => {
    const result = scoreText(
      "England rugby defeated by Ireland in Six Nations thriller",
      [sixNationsRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags an NFL result headline", () => {
    const result = scoreText(
      "Chiefs beat Eagles in overtime to win Super Bowl",
      [nflRulePack],
      "balanced"
    );

    expect(result.shouldHide).toBe(true);
  });

  it("flags Reality TV elimination and reveal spoilers", () => {
    const headlines = [
      "The Traitors finalist revealed after dramatic round table",
      "Love Island couple dumped after recoupling",
      "Strictly star voted out after dance-off",
      "Bake Off contestant crowned winner in emotional final"
    ];

    for (const headline of headlines) {
      const result = scoreText(headline, [realityTvRulePack], "balanced");

      expect(result.shouldHide, headline).toBe(true);
      expect(result.packIds).toContain("reality-tv");
    }
  });

  it("does not hide Reality TV safe context in balanced mode", () => {
    const headlines = [
      "The Apprentice 2026 line-up confirmed",
      "What time is The Traitors on tonight?"
    ];

    for (const headline of headlines) {
      const result = scoreText(headline, [realityTvRulePack], "balanced");

      expect(result.shouldHide, headline).toBe(false);
    }
  });

  it("does hide Reality TV safe context in lockdown mode", () => {
    const result = scoreText(
      "What time is The Traitors on tonight?",
      [realityTvRulePack],
      "lockdown"
    );

    expect(result.shouldHide).toBe(true);
  });
});
