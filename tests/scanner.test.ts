// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.google.com/search?q=f1+results"}

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

function renderGoogleSportsModule(tabLabel: string, body: string): HTMLElement {
  document.body.innerHTML = `
    <main id="main">
      <div id="sports-module" data-attrid="kc:/sports/formula_1">
        <div role="tab">${tabLabel}</div>
        <div>${body}</div>
      </div>
    </main>
  `;

  return document.getElementById("sports-module")!;
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
    const module = renderGoogleSportsModule(
      "Results",
      "Formula 1 Monaco GP results: Norris P1, Verstappen P2, Hamilton P3"
    );

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(module.getAttribute("data-despoilerze-hidden")).toBe("true");
  });

  it("does not blur a Google race details module in balanced mode without result indicators", () => {
    const module = renderGoogleSportsModule(
      "Race details",
      "Formula 1 Monaco GP race details, circuit length, lap count, and start time"
    );

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(module.getAttribute("data-despoilerze-hidden")).toBeNull();
  });

  it("blurs the whole Google race details module in lockdown mode for a protected sport", () => {
    const module = renderGoogleSportsModule(
      "Race details",
      "Formula 1 Monaco GP race details, circuit length, lap count, and start time"
    );

    scanDocument(settings("lockdown"), [f1RulePack]);

    expect(module.getAttribute("data-despoilerze-hidden")).toBe("true");
  });
});
