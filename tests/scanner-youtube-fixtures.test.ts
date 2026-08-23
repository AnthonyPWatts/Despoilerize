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

  it("hides a spoilery YouTube home grid item at the outer rich item", () => {
    loadFixture("youtube/home-grid-f1.html");

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(document.getElementById("spoiler-rich-item")?.getAttribute("data-despoilerze-hidden")).toBe("true");
    expect(document.querySelector("ytd-rich-grid-media")?.getAttribute("data-despoilerze-hidden")).toBeNull();
    expect(document.getElementById("safe-rich-item")?.getAttribute("data-despoilerze-hidden")).toBeNull();
  });

  it("rescans a YouTube lockup when hydration replaces placeholder text", () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="reported-rich-item">
        <yt-lockup-view-model id="reported-lockup">
          <h3>
            <a class="yt-lockup-metadata-view-model__title" href="/watch?v=qualifying">
              <span id="reported-title">Loading video...</span>
            </a>
          </h3>
        </yt-lockup-view-model>
      </ytd-rich-item-renderer>`;

    const lockup = document.getElementById("reported-lockup")!;
    scanDocument(settings("lockdown"), [f1RulePack], lockup);
    expect(document.getElementById("reported-rich-item")?.getAttribute("data-despoilerze-hidden")).toBeNull();

    const title = document.getElementById("reported-title")!;
    title.textContent = "Qualifying Highlights | 2026 Dutch Grand Prix";

    scanDocument(settings("lockdown"), [f1RulePack], title);

    expect(document.getElementById("reported-rich-item")?.getAttribute("data-despoilerze-hidden")).toBe("true");
  });

  it("hides a spoilery YouTube watch recommendation at the compact renderer", () => {
    loadFixture("youtube/watch-recommendations-f1.html");

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(document.getElementById("spoiler-compact-video")?.getAttribute("data-despoilerze-hidden")).toBe("true");
    expect(document.getElementById("safe-compact-video")?.getAttribute("data-despoilerze-hidden")).toBeNull();
  });

  it("hides a spoilery YouTube Shorts result at the reel item", () => {
    loadFixture("youtube/shorts-f1.html");

    scanDocument(settings("balanced"), [f1RulePack]);

    expect(document.getElementById("spoiler-short")?.getAttribute("data-despoilerze-hidden")).toBe("true");
    expect(document.getElementById("safe-short")?.getAttribute("data-despoilerze-hidden")).toBeNull();
  });
});
