// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.youtube.com/results?search_query=f1+highlights"}

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scanDocument } from "../src/content/scanner";
import { f1RulePack } from "../src/rules/f1";
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

describe("scanDocument YouTube fixtures", () => {
  beforeEach(() => {
    document.body.innerHTML = "";

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 720,
      height: 120,
      top: 0,
      right: 720,
      bottom: 120,
      left: 0,
      toJSON: () => ({})
    } as DOMRect);
  });

  it("hides a spoilery YouTube video result without hiding safe catch-up routes", () => {
    loadFixture("youtube/search-results-f1.html");

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(document.getElementById("spoiler-video")?.getAttribute("data-despoilerze-hidden")).toBe("true");
    expect(document.getElementById("safe-video")?.getAttribute("data-despoilerze-hidden")).toBeNull();
    expect(document.getElementById("unrelated-video")?.getAttribute("data-despoilerze-hidden")).toBeNull();
  });
});
