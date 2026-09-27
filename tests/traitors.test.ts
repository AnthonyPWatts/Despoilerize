import { describe, expect, it } from "vitest";
import { getRulePacks } from "../src/rules";
import { scoreText } from "../src/rules/scoring";
import { traitorsRulePack } from "../src/rules/traitors";
import {
  celebrityTraitors2025Cast, celebrityTraitors2026Cast, traitorsUk2026Cast
} from "../src/rules/vocab/traitors";

describe("The Traitors pack", () => {
  // Invented headlines exercise wording; none describe actual contestant outcomes.
  it.each([
    "The Traitors: a player banished after the round table",
    "Celebrity Traitors winner revealed in finale recap",
    "Traitors: a player murdered in plain sight",
    "Traitors finale: a player steals the prize pot",
    "Who won The Traitors?",
    "The Traitors contestant wins a shield",
    "The Traitors: the poisoned chalice and kiss of death explained",
    "The Traitors: recruit accepts an ultimatum in the turret",
    "The Traitors: Uncloaked reveals the secret traitor",
    "#CelebrityTraitors winner revealed",
    "#TheTraitorsUK: the final result",
    "Bella banished after shock roundtable vote",
    "Banished at the round table: James reacts",
    "Rachel murdered overnight",
    "Amol is a Faithful",
    "Netty Österberg was recruited",
    "Netty Osterberg was recruited",
    "Myha’la is a traitor",
    "Myhala was murdered",
    "Richard E Grant banished",
    "The Celebrity Traitors: Richard E. Grant wins",
    "Leigh–Anne Pinnock: banishment interview",
    "David 'Ben' Benassi was murdered",
    "Maz Bana was banished",
    "Michael Sheen wins £100,000",
    "Where to watch The Traitors: the winner revealed",
    "The Traitors cast: a secret traitor revealed",
    "Bella Ramsey voted out"
  ])("hides a clear spoiler in every sensitivity: %s", headline => {
    for (const sensitivity of ["gentle", "balanced", "lockdown"] as const) {
      const result = scoreText(headline, [traitorsRulePack], sensitivity);
      expect(result.shouldHide, sensitivity).toBe(true);
      expect(result.packIds).toContain("the-traitors");
      expect(result.reasons).toContain("Matched The Traitors spoiler wording");
    }
  });

  it.each([...celebrityTraitors2026Cast, ...celebrityTraitors2025Cast, ...traitorsUk2026Cast])(
    "recognises a cast-only spoiler without the show title: %s", name => {
      expect(scoreText(`${name} was banished`, [traitorsRulePack], "balanced").shouldHide).toBe(true);
      expect(scoreText(`Interview with ${name}`, [traitorsRulePack], "lockdown").shouldHide).toBe(true);
    }
  );

  it.each([
    "What time is The Traitors on tonight?",
    "What time is The Traitors final on tonight?",
    "The Celebrity Traitors 2026 cast and line-up announced",
    "The Celebrity Traitors cast revealed for new series",
    "BBC Traitors episode schedule and start time",
    "The Traitors trailer: a first look at Ardross Castle",
    "Claudia Winkleman returns to host The Traitors",
    "James Acaster announces a comedy tour",
    "Michael Sheen wins a theatre award",
    "Tom Daley wins Olympic gold",
    "Hannah Fry reveals her new science series"
  ])("keeps non-result coverage visible except in Lockdown: %s", headline => {
    expect(scoreText(headline, [traitorsRulePack], "balanced").shouldHide).toBe(false);
    expect(scoreText(headline, [traitorsRulePack], "gentle").shouldHide).toBe(false);
    expect(scoreText(headline, [traitorsRulePack], "lockdown").shouldHide).toBe(true);
  });

  it.each([
    "James wins a local charity raffle",
    "Police say Rachel Smith was murdered",
    "Faithful dog reunited with owner",
    "Minister calls opponents traitors after election victory",
    "Round table discussion on local housing",
    "Recruitment drive brings new jobs to town",
    "Murder investigation continues overnight",
    "Big Brother contestant evicted",
    "Love Island couple dumped after recoupling",
    "Jameson banished from the club",
    "Bella Ramseyson was banished",
    "Faithful dog greets Sam after school"
  ])("requires a recognised programme or cast reference: %s", headline => {
    for (const sensitivity of ["gentle", "balanced", "lockdown"] as const) {
      const result = scoreText(headline, [traitorsRulePack], sensitivity);
      expect(result.shouldHide, sensitivity).toBe(false);
      expect(result.packIds).toEqual([]);
    }
  });

  it("only protects the new pack when selected", () => {
    const headline = "Bella Ramsey was banished";
    expect(scoreText(headline, getRulePacks(["f1"]), "balanced").shouldHide).toBe(false);
    expect(scoreText(headline, getRulePacks(["the-traitors"]), "balanced").shouldHide).toBe(true);
  });
});
