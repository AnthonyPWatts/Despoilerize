// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.bbc.co.uk/sport"}

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scanDocument } from "../src/content/scanner";
import { worldCup2026RulePack } from "../src/rules/football";
import type { Settings } from "../src/shared/types";

function settings(sensitivity: Settings["catchUpMode"]["sensitivity"]): Settings {
  return {
    catchUpMode: {
      enabled: true,
      sensitivity
    },
    enabledPacks: ["world-cup-2026"],
    customTerms: [],
    trustedSites: []
  };
}

function loadFixture(path: string): void {
  document.body.innerHTML = readFileSync(join(process.cwd(), "tests", "fixtures", "sites", path), "utf8");
}

describe("scanDocument BBC fixtures", () => {
  beforeEach(() => {
    document.body.innerHTML = "";

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 560,
      height: 180,
      top: 0,
      right: 560,
      bottom: 180,
      left: 0,
      toJSON: () => ({})
    } as DOMRect);
  });

  it("hides a spoilery BBC promo without hiding safe or unrelated promos", () => {
    loadFixture("bbc/sport-index-football.html");

    scanDocument(settings("balanced"), [worldCup2026RulePack]);

    expect(document.getElementById("spoiler-card")?.getAttribute("data-despoilerze-hidden")).toBe("true");
    expect(document.getElementById("safe-card")?.getAttribute("data-despoilerze-hidden")).toBeNull();
    expect(document.getElementById("unrelated-card")?.getAttribute("data-despoilerze-hidden")).toBeNull();
  });
});
