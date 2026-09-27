import { describe, expect, it } from "vitest";
import { getRulePacks } from "../src/rules";
import { scoreText } from "../src/rules/scoring";
import { englandMenSeptember2026, englandWomenSeptember2026 } from "../src/rules/vocab/cricket";
import { championshipClubs2026, championsLeagueClubs2026, premierLeagueClubs2026 } from "../src/rules/vocab/football";
import { f1Drivers2026, f1Teams2026, motoGpRiders2026, motoGpTeams2026 } from "../src/rules/vocab/motorsport";
import { superLeagueClubs2026 } from "../src/rules/vocab/rugby";
import { tennisPlayersSeptember2026 } from "../src/rules/vocab/tennis";
import { nbaTeams2026, nflTeams2026 } from "../src/rules/vocab/usSports";

// Invented result wording exercises matching without storing actual outcomes.
const rosters: [string, string[], number][] = [
  ["f1", f1Drivers2026, 22],
  ["f1", f1Teams2026, 11],
  ["motogp", motoGpRiders2026, 22],
  ["premier-league", premierLeagueClubs2026, 20],
  ["championship", championshipClubs2026, 24],
  ["champions-league", championsLeagueClubs2026, 36],
  ["rugby-league", superLeagueClubs2026, 14],
  ["england-cricket", englandMenSeptember2026, 26],
  ["england-cricket", englandWomenSeptember2026, 20],
  ["nfl", nflTeams2026, 32],
  ["nba", nbaTeams2026, 30]
];

describe("September 2026 pack data", () => {
  it.each(rosters)("keeps the confirmed %s list complete and unique (%#)", (_id, entries, count) => {
    expect(entries).toHaveLength(count);
    expect(new Set(entries).size).toBe(count);
  });

  const cases = [...rosters.map(([id, names]) => [id, names] as const),
    ["motogp", motoGpTeams2026] as const,
    ["tennis", tennisPlayersSeptember2026] as const
  ].flatMap(([id, names]) => names.map(name => ({ id, name })));

  it.each(cases)("protects $name through the selected $id pack", ({ id, name }) => {
    const packs = getRulePacks([id]);
    const result = scoreText(`${name} wins`, packs, "balanced");
    expect(result.shouldHide).toBe(true);
    expect(result.packIds).toEqual([id]);
    expect(scoreText(`Preview: ${name}`, packs, "balanced").shouldHide).toBe(false);
    expect(scoreText(`Preview: ${name}`, packs, "lockdown").shouldHide).toBe(true);
  });

  it.each([
    ["f1", "Sergio Pérez takes pole and wins"],
    ["f1", "Arvid Lindblad takes pole and wins"],
    ["f1", "Franco Colapinto takes pole and wins"],
    ["f1", "Cadillac takes pole and wins"],
    ["motogp", "Toprak Razgatlıoğlu takes pole and wins"],
    ["motogp", "Maverick Viñales takes pole and wins"],
    ["motogp", "Raúl Fernández takes pole and wins"],
    ["champions-league", "Bodø/Glimt wins 3-0"],
    ["champions-league", "Bodo/Glimt wins 3-0"],
    ["champions-league", "Fenerbahçe wins 3-0"],
    ["champions-league", "Slavia Prague wins 3-0"],
    ["world-cup-2026", "Cabo Verde wins 3-0"],
    ["world-cup-2026", "Congo DR wins 3-0"],
    ["rugby-union", "Gallagher PREM result: hosts won"],
    ["rugby-league", "St. Helens wins 24-6"],
    ["england-cricket", "Tilly Corteen–Coleman takes wickets as her team wins"],
    ["tennis", "Félix Auger-Aliassime wins in straight sets"],
    ["tennis", "Karolína Muchová wins in straight sets"],
    ["grand-slams", "Roland-Garros: outsider wins in straight sets"],
    ["nba", "Los Angeles Clippers wins 110-102"],
    ["reality-tv", "The Celebrity Traitors winner revealed"]
  ])("recognises current names and aliases in %s: %s", (id, headline) => {
    for (const sensitivity of ["gentle", "balanced", "lockdown"] as const) {
      expect(scoreText(headline, getRulePacks([id]), sensitivity).shouldHide, sensitivity).toBe(true);
    }
  });

  it.each([
    ["f1", "Tsunoda wins for Sauber"],
    ["premier-league", "West Ham wins"],
    ["premier-league", "Burnley wins"],
    ["premier-league", "Wolves wins"],
    ["championship", "Coventry City wins"],
    ["championship", "Leicester City wins"],
    ["championship", "Sheffield Wednesday wins"],
    ["champions-league", "Ajax wins"],
    ["champions-league", "Juventus wins"],
    ["tennis", "Federer wins"],
    ["tennis", "Nadal wins"],
    ["tennis", "Murray wins"],
    ["england-cricket", "Ben Stokes wins"]
  ])("preserves catch-up coverage in %s: %s", (id, headline) => {
    expect(scoreText(headline, getRulePacks([id]), "balanced").shouldHide).toBe(true);
  });

  it.each([
    ["champions-league", "Camera lens wins an award"],
    ["champions-league", "Viking exhibition wins an award"],
    ["champions-league", "Como wins tourism award"],
    ["nba", "Jazz wins new fans"],
    ["nba", "Magic wins talent contest"],
    ["nba", "Thunder beats against the windows"],
    ["nfl", "Titans wins a television award"],
    ["nfl", "Jets score well in emissions tests"],
    ["motogp", "Miller wins a council election"],
    ["motogp", "Mir wins a photography award"],
    ["england-cricket", "Grace wins a scholarship"],
    ["england-cricket", "Brook wins a literary award"],
    ["tennis", "Ben wins a scholarship"]
  ])("leaves unrelated words visible in %s: %s", (id, headline) => {
    for (const sensitivity of ["gentle", "balanced", "lockdown"] as const) {
      expect(scoreText(headline, getRulePacks([id]), sensitivity).shouldHide, sensitivity).toBe(false);
    }
  });

  it("keeps changed competitors in their intended packs", () => {
    expect(scoreText("Colapinto wins", getRulePacks(["motogp"]), "lockdown").shouldHide).toBe(false);
    expect(scoreText("Diogo Moreira wins", getRulePacks(["f1"]), "lockdown").shouldHide).toBe(false);
    expect(scoreText("Lincoln City wins", getRulePacks(["premier-league"]), "lockdown").shouldHide).toBe(false);
    expect(scoreText("Lincoln City wins", getRulePacks(["championship"]), "balanced").shouldHide).toBe(true);
    expect(scoreText("Coventry City wins", getRulePacks(["premier-league"]), "balanced").shouldHide).toBe(true);
  });
});
