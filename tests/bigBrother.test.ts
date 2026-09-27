import { describe, expect, it } from "vitest";
import { getRulePacks } from "../src/rules";
import { bigBrotherRulePack } from "../src/rules/bigBrother";
import { scoreText } from "../src/rules/scoring";
import { bigBrotherUk2026Cast } from "../src/rules/vocab/bigBrother";

const sensitivities = ["gentle", "balanced", "lockdown"] as const;

describe("Big Brother pack", () => {
  // Invented examples test wording, not actual participant outcomes.
  it.each([
    "Big Brother: a housemate evicted after the public vote",
    "Who won Big Brother?", "Big Brother winner revealed in finale recap",
    "Big Brother: shock exit as a player quits", "Big Brother contestant has walked",
    "Big Brother nominations revealed", "Big Brother: two players gain immunity",
    "Big Brother: a housemate ejected for rule-breaking",
    "Big Brother: the secret mole revealed", "Big Brother: a player becomes the deputy mole",
    "Big Brother contestant removed from the house", "Big Brother: a player wins £100,000",
    "Celebrity Big Brother runner-up revealed", "#BBUK2026 winner revealed",
    "Winner revealed #BigBrother2026", "#CBBUK contestant quits",
    "The Group Chat: eviction interview with Kate Lawler and GK Barry",
    "Big Brother: Late & Live eviction interview",
    "Philip Regan was evicted", "Queen of Scotty Road was nominated",
    "Harry faces the public vote", "Up for eviction: Yasmin and Rob",
    "Tays is a secret mole", "Tays is the mole", "Philip Regan quits",
    "Sam wins immunity from nominations as a housemate",
    "Phillip faces the public vote", "Jedward reveal a secret task to the housemates",
    "Housemate Charlotte quits the house", "Omar El Mayer walked out",
    "Watch Big Brother: the cast reacts to nominations results"
  ])("hides spoiler wording in every sensitivity: %s", headline => {
    for (const sensitivity of sensitivities) {
      const result = scoreText(headline, [bigBrotherRulePack], sensitivity);
      expect(result.shouldHide, sensitivity).toBe(true);
      expect(result.packIds).toEqual(["big-brother"]);
      expect(result.reasons).toContain("Matched Big Brother spoiler wording");
    }
  });

  it.each(bigBrotherUk2026Cast)("recognises $name with programme context", person => {
    for (const sensitivity of sensitivities) {
      expect(scoreText(`${person.name} faces the public vote`, [bigBrotherRulePack], sensitivity).shouldHide).toBe(true);
      expect(scoreText(`${person.name} wins a charity raffle`, [bigBrotherRulePack], sensitivity).shouldHide).toBe(false);
    }
  });

  it.each(bigBrotherUk2026Cast.flatMap(person => person.aliases))(
    "recognises a published full name or alias without the title: %s", alias => {
      for (const sensitivity of sensitivities) {
        expect(scoreText(`${alias} was evicted`, [bigBrotherRulePack], sensitivity).shouldHide).toBe(true);
      }
      expect(scoreText(`Interview with ${alias}`, [bigBrotherRulePack], "lockdown").shouldHide).toBe(true);
    }
  );

  it.each([
    "What time is Big Brother on tonight?", "Big Brother final: how to watch on ITVX",
    "Big Brother 2026 cast and line-up announced", "Big Brother cast revealed for 2026", "Big Brother trailer: house tour", "Noah's Ark | Big Brother 2026 Ep.11",
    "AJ Odudu and Will Best return to host Big Brother",
    "Big Brother: The Group Chat launch date", "#BBUK episode schedule",
    "Interview with Philip Regan", "Charlotte Nott wins a school award"
  ])("leaves previews visible except in Lockdown: %s", headline => {
    expect(scoreText(headline, [bigBrotherRulePack], "gentle").shouldHide).toBe(false);
    expect(scoreText(headline, [bigBrotherRulePack], "balanced").shouldHide).toBe(false);
    expect(scoreText(headline, [bigBrotherRulePack], "lockdown").shouldHide).toBe(true);
  });

  it.each([
    "Big Brother is watching: Orwell and state surveillance",
    "My big brother is getting married", "Lynx released into the wild",
    "Harry evicted from his flat", "Charlotte wins a scholarship",
    "Rob nominated for a radio award", "Omar wins a council election",
    "The group chat revealed our holiday plans", "Secret mole damages a garden",
    "AJ Odudu announces a new fashion collection", "Jedward win a music award",
    "Love Island contestant evicted", "The Traitors winner revealed",
    "Chelsey Ammarison evicted", "Yasmina faces the public vote"
  ])("keeps unrelated coverage visible: %s", headline => {
    for (const sensitivity of sensitivities) {
      expect(scoreText(headline, [bigBrotherRulePack], sensitivity).shouldHide).toBe(false);
    }
  });

  it("only activates when selected", () => {
    const headline = "Philip Regan was evicted";
    expect(scoreText(headline, getRulePacks(["big-brother"]), "balanced").shouldHide).toBe(true);
    expect(scoreText(headline, getRulePacks(["the-traitors", "f1"]), "balanced").shouldHide).toBe(false);
  });
});
