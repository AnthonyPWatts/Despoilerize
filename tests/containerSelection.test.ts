// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.google.com/search?q=f1+results"}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBestContainer, findGoogleSearchResultContainer, isSiteChrome } from "../src/content/containerSelection";

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

describe("container selection", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(mockRect(480, 120));
  });

  it("selects a semantic article around a nested headline", () => {
    document.body.innerHTML = `
      <article id="card">
        <a href="/story"><h2 id="headline">Norris wins chaotic Monaco GP</h2></a>
      </article>
    `;

    const headline = document.getElementById("headline")!;

    expect(findBestContainer(headline).id).toBe("card");
  });

  it("selects a YouTube video renderer around a title link", () => {
    document.body.innerHTML = `
      <ytd-video-renderer id="video">
        <a id="video-title" href="/watch?v=spoiler">Norris wins chaotic Monaco GP</a>
      </ytd-video-renderer>
    `;

    const title = document.getElementById("video-title")!;

    expect(findBestContainer(title).id).toBe("video");
  });

  it("prefers the whole Google result wrapper over a nested generic card", () => {
    document.body.innerHTML = `
      <div class="MjjYud" id="google-result">
        <article id="inner-card">
          <a href="/story"><h3 id="headline">England through after late winner</h3></a>
          <p>Snippet that should blur with the headline.</p>
        </article>
      </div>
    `;

    const headline = document.getElementById("headline")!;

    expect(findBestContainer(headline).id).toBe("google-result");
  });

  it("rejects oversized Google result wrappers", () => {
    document.body.innerHTML = `
      <div class="MjjYud" id="huge-result">
        <h3 id="headline">England through after late winner</h3>
      </div>
    `;

    const hugeResult = document.getElementById("huge-result")!;
    vi.spyOn(hugeResult, "getBoundingClientRect").mockReturnValue(mockRect(900, 900));

    expect(findGoogleSearchResultContainer(document.getElementById("headline")!)).toBeNull();
  });

  it("does not select site chrome as a useful container", () => {
    document.body.innerHTML = `
      <nav id="site-nav">
        <article id="nav-card"><h2 id="headline">Norris wins chaotic Monaco GP</h2></article>
      </nav>
    `;

    const headline = document.getElementById("headline")!;

    expect(isSiteChrome(headline)).toBe(true);
    expect(findBestContainer(headline)).toBe(headline);
  });
});
