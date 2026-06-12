// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.google.com/search?q=f1+results"}

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scanDocument } from "../src/content/scanner";
import { f1RulePack } from "../src/rules/f1";
import { worldCup2026RulePack } from "../src/rules/football";
import type { Settings } from "../src/shared/types";

function settings(sensitivity: Settings["catchUpMode"]["sensitivity"]): Settings {
  return {
    catchUpMode: {
      enabled: true,
      sensitivity
    },
    enabledPacks: ["f1"],
    customTerms: [],
    trustedSites: []
  };
}

function loadFixture(path: string): void {
  document.body.innerHTML = readFileSync(join(process.cwd(), "tests", "fixtures", "sites", path), "utf8");
}

describe("scanDocument Google sports modules", () => {
  beforeEach(() => {
    document.body.innerHTML = "";

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 640,
      height: 240,
      top: 0,
      right: 640,
      bottom: 240,
      left: 0,
      toJSON: () => ({})
    } as DOMRect);
  });

  it("blurs the whole Google sports module in balanced mode when result indicators appear", () => {
    loadFixture("google-search/sports-module-f1.html");
    const module = document.getElementById("sports-module")!;

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(module.getAttribute("data-despoilerze-hidden")).toBe("true");
  });

  it("does not blur a Google race details module in balanced mode without result indicators", () => {
    document.body.innerHTML = `
      <main id="main">
        <div id="sports-module" data-attrid="kc:/sports/formula_1">
          <div role="tab">Race details</div>
          <div>Formula 1 Monaco GP race details, circuit length, lap count, and start time</div>
        </div>
      </main>
    `;
    const module = document.getElementById("sports-module")!;

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(module.getAttribute("data-despoilerze-hidden")).toBeNull();
  });

  it("blurs the whole Google race details module in lockdown mode for a protected sport", () => {
    document.body.innerHTML = `
      <main id="main">
        <div id="sports-module" data-attrid="kc:/sports/formula_1">
          <div role="tab">Race details</div>
          <div>Formula 1 Monaco GP race details, circuit length, lap count, and start time</div>
        </div>
      </main>
    `;
    const module = document.getElementById("sports-module")!;

    scanDocument(settings("lockdown"), [f1RulePack]);

    expect(module.getAttribute("data-despoilerze-hidden")).toBe("true");
  });
});

describe("scanDocument Google Top stories", () => {
  beforeEach(() => {
    document.body.innerHTML = "";

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 480,
      height: 180,
      top: 0,
      right: 480,
      bottom: 180,
      left: 0,
      toJSON: () => ({})
    } as DOMRect);
  });

  it("blurs a Google Top stories card when a protected scoreline appears in a link", () => {
    loadFixture("google-search/top-stories-world-cup.html");
    const card = document.getElementById("spoiler-card")!;
    const safeCard = document.getElementById("safe-card")!;

    scanDocument(settings("balanced"), [worldCup2026RulePack]);

    expect(card.getAttribute("data-despoilerze-hidden")).toBe("true");
    expect(safeCard.getAttribute("data-despoilerze-hidden")).toBeNull();
  });
});
