import { describe, expect, it } from "vitest";
import { scoreText } from "../src/rules/scoring";
import { f1RulePack } from "../src/rules/f1";

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
});
