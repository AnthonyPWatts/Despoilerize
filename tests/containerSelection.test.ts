// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.google.com/search?q=f1+results"}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { findBestContainer, findGoogleSearchResultContainer, findYouTubeContainer, isSiteChrome } from "../src/content/containerSelection";

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

  it("prefers a YouTube rich item over its inner rich grid media", () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="rich-item">
        <ytd-rich-grid-media id="grid-media">
          <a id="video-title-link" href="/watch?v=spoiler">Hamilton P3 after Verstappen DNF</a>
        </ytd-rich-grid-media>
      </ytd-rich-item-renderer>
    `;

    const title = document.getElementById("video-title-link")!;

    expect(findYouTubeContainer(title)?.id).toBe("rich-item");
    expect(findBestContainer(title).id).toBe("rich-item");
  });

  it("selects a YouTube compact recommendation item", () => {
    document.body.innerHTML = `
      <ytd-compact-video-renderer id="compact-video">
        <a id="video-title" href="/watch?v=spoiler">Norris wins chaotic Monaco GP</a>
      </ytd-compact-video-renderer>
    `;

    const title = document.getElementById("video-title")!;

    expect(findYouTubeContainer(title)?.id).toBe("compact-video");
  });

  it("selects a YouTube Shorts reel item", () => {
    document.body.innerHTML = `
      <ytd-reel-item-renderer id="short">
        <a id="video-title" href="/shorts/spoiler">Norris wins chaotic Monaco GP</a>
      </ytd-reel-item-renderer>
    `;

    const title = document.getElementById("video-title")!;

    expect(findYouTubeContainer(title)?.id).toBe("short");
  });

  it("rejects YouTube masthead chrome", () => {
    document.body.innerHTML = `
      <ytd-masthead id="masthead">
        <ytd-video-renderer id="chrome-video">
          <a id="video-title" href="/watch?v=spoiler">Norris wins chaotic Monaco GP</a>
        </ytd-video-renderer>
      </ytd-masthead>
    `;

    const title = document.getElementById("video-title")!;

    expect(isSiteChrome(title)).toBe(true);
    expect(findYouTubeContainer(title)).toBeNull();
  });

  it("rejects oversized YouTube containers", () => {
    document.body.innerHTML = `
      <ytd-video-renderer id="huge-video">
        <a id="video-title" href="/watch?v=spoiler">Norris wins chaotic Monaco GP</a>
      </ytd-video-renderer>
    `;

    const hugeVideo = document.getElementById("huge-video")!;
    vi.spyOn(hugeVideo, "getBoundingClientRect").mockReturnValue(mockRect(900, 900));

    expect(findYouTubeContainer(document.getElementById("video-title")!)).toBeNull();
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
