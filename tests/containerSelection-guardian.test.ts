// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.theguardian.com/football"}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBestContainer, findGuardianContainer } from "../src/content/containerSelection";

function mockRect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    toJSON: () => ({})
  } as DOMRect;
}

describe("Guardian container selection", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(mockRect(480, 120));
  });

  it("selects a Guardian front card around nested story text", () => {
    document.body.innerHTML = `
      <div data-component="card" data-link-name="article" id="guardian-card">
        <a href="/football/2026/jun/16/spoiler">
          <h3 id="headline">England through after dramatic stoppage-time winner</h3>
        </a>
      </div>
    `;

    const headline = document.getElementById("headline")!;

    expect(findGuardianContainer(headline)?.id).toBe("guardian-card");
    expect(findBestContainer(headline).id).toBe("guardian-card");
  });

  it("selects a Guardian most-viewed list row around a plain story link", () => {
    document.body.innerHTML = `
      <section data-component="most-viewed">
        <ol>
          <li id="guardian-row">
            <a id="story-link" data-link-name="article" href="/football/2026/jun/16/spoiler">
              Brazil top Group C with win over Morocco
            </a>
          </li>
        </ol>
      </section>
    `;

    const link = document.getElementById("story-link")!;

    expect(findGuardianContainer(link)?.id).toBe("guardian-row");
    expect(findBestContainer(link).id).toBe("guardian-row");
  });
});
