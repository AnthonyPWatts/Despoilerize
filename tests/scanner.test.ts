// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.google.com/search?q=f1+results"}

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

function renderGoogleTopStoriesCard(headline: string): HTMLElement {
  document.body.innerHTML = `
    <main id="main">
      <section>
        <h2>Top stories</h2>
        <div class="story-card" id="spoiler-card">
          <a href="https://example.com/live">
            <span>The Guardian</span>
            <span>${headline}</span>
            <span>36 minutes ago</span>
          </a>
        </div>
        <div class="story-card">
          <a href="https://example.com/preview">World Cup opening ceremony timings and performers</a>
        </div>
      </section>
    </main>
  `;

  return document.getElementById("spoiler-card")!;
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
    const card = renderGoogleTopStoriesCard("Mexico 2-0 South Africa: World Cup 2026 opening match live reaction");

    scanDocument(settings("balanced"), [worldCup2026RulePack]);

    expect(card.getAttribute("data-despoilerze-hidden")).toBe("true");
  });
});
