import { isYouTubePage } from "./containerSelection";
import { resetProtection, reveal } from "./obfuscator";

type ShortIdentity = {
  videoId: string;
  title: string;
};

const pendingAttribute = "data-despoilerze-shorts-pending";
const protectedSelector = "[data-despoilerze-hidden], [data-despoilerze-revealed]";

export class YouTubeShortsTracker {
  private readonly identities = new WeakMap<HTMLElement, ShortIdentity>();
  private readonly revealedVideoIds = new Set<string>();

  update(): HTMLElement[] {
    if (!isYouTubePage()) return [];
    const videoId = shortsVideoId(window.location.pathname);
    if (!videoId) return [];

    const changed: HTMLElement[] = [];
    for (const renderer of document.querySelectorAll<HTMLElement>("ytd-reel-video-renderer")) {
      const previous = this.identities.get(renderer);
      if (previous && (renderer.hasAttribute("data-despoilerze-revealed")
        || renderer.querySelector("[data-despoilerze-revealed]"))) {
        this.revealedVideoIds.add(previous.videoId);
      }

      const identity = readIdentity(renderer, videoId);
      if (!identity) {
        // YouTube updates the address, player link and heading separately.
        // Keep the previous protection until they describe the same video.
        renderer.setAttribute(pendingAttribute, "true");
        continue;
      }

      const wasPending = renderer.hasAttribute(pendingAttribute);
      renderer.removeAttribute(pendingAttribute);
      if (!wasPending && previous?.videoId === identity.videoId && previous.title === identity.title) continue;

      this.identities.set(renderer, identity);
      for (const target of [renderer, ...renderer.querySelectorAll<HTMLElement>(protectedSelector)]) {
        resetProtection(target);
      }
      if (this.revealedVideoIds.has(identity.videoId)) {
        reveal(renderer);
      }
      changed.push(renderer);
    }
    return changed;
  }
}

function readIdentity(renderer: HTMLElement, videoId: string): ShortIdentity | null {
  const link = renderer.querySelector<HTMLAnchorElement>("a.ytp-title-link[href]");
  if (!link) return null;

  let url: URL;
  try {
    url = new URL(link.href, window.location.origin);
  } catch {
    return null;
  }
  if (!/(^|\.)youtube\.com$/i.test(url.hostname)) return null;
  const playerVideoId = shortsVideoId(url.pathname)
    ?? (url.pathname === "/watch" ? url.searchParams.get("v") : null);
  if (playerVideoId !== videoId) return null;

  const playerTitle = normaliseTitle(link.textContent);
  const heading = renderer.querySelector("h1");
  const headingTitle = normaliseTitle(heading?.textContent);
  if (!playerTitle || (heading && headingTitle !== playerTitle)) return null;

  // Advertisements may have a player title without an ordinary Shorts heading.
  return { videoId, title: headingTitle || playerTitle };
}

function shortsVideoId(pathname: string): string | null {
  return /^\/shorts\/([^/]+)\/?$/.exec(pathname)?.[1] ?? null;
}

function normaliseTitle(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
