import type { RulePack, Settings } from "../shared/types";
import { scoreText } from "../rules/scoring";
import { isCatchUpModeActive } from "../shared/storage";
import { isAlreadyHidden, isProcessed, markProcessed, obfuscate } from "./obfuscator";

const candidateSelectors = [
  "article",
  "h1",
  "h2",
  "h3",
  "h4",
  "[role='article']",
  "[data-testid*='post']",
  "[data-testid*='card']",
  "[class*='promo']",
  "[class*='media']",
  "[id='video-title']",
  "[id='video-title-link']",
  "ytd-rich-item-renderer",
  "ytd-rich-grid-media",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-reel-item-renderer",
  "ytd-reel-video-renderer",
  "yt-lockup-view-model",
  "ytm-shorts-lockup-view-model"
];

const usefulContainerSelectors = [
  "article",
  "[role='article']",
  "[data-testid*='post']",
  "[data-testid*='card']",
  "ytd-rich-item-renderer",
  "ytd-rich-grid-media",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-reel-item-renderer",
  "ytd-reel-video-renderer",
  "yt-lockup-view-model",
  "ytm-shorts-lockup-view-model",
  "li",
  ".card",
  ".promo",
  ".media",
  ".gs-result",
  ".g"
];

const googleSearchResultContainerSelectors = [
  /*
   * Modern Google Search result blocks. These sit high enough to include
   * favicon/site line, heading, snippet, thumbnails, and sitelinks.
   */
  ".MjjYud",
  ".hlcw0c",
  ".Ww4FFb",
  /*
   * Older/fallback Google result containers. Keep these after the newer
   * result wrappers so we do not stop at a small inner child first.
   */
  ".g",
  ".rc"
];

const ignoredChromeSelectors = [
  "nav",
  "header",
  "footer",
  "form",
  "button",
  "select",
  "textarea",
  "input",
  "[role='navigation']",
  "[role='banner']",
  "[role='search']",
  "[role='menubar']",
  "[role='menu']",
  "[aria-label*='breadcrumb' i]",
  "[class*='breadcrumb' i]",
  "[class*='navbar' i]",
  "[class*='nav-' i]",
  "[class*='masthead' i]",
  "#masthead",
  "ytd-masthead",
  "tp-yt-paper-dialog"
];

export function scanDocument(settings: Settings, rulePacks: RulePack[], root: ParentNode = document): void {
  if (!isCatchUpModeActive(settings)) return;
  if (isTrustedSite(settings)) return;

  const candidates = findCandidates(root);

  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLElement)) continue;
    if (isProcessed(candidate) || isAlreadyHidden(candidate)) continue;
    if (isSiteChrome(candidate)) {
      markProcessed(candidate);
      continue;
    }
    if (!isVisible(candidate)) continue;

    if (candidate.closest("[data-despoilerze-hidden='true'], [data-despoilerze-shell='true']")) {
      markProcessed(candidate);
      continue;
    }

    const text = extractText(candidate);
    if (!isPlausibleHeadlineText(text)) {
      markProcessed(candidate);
      continue;
    }

    const risk = scoreText(
      text,
      rulePacks,
      settings.catchUpMode.sensitivity,
      settings.customTerms
    );

    if (risk.shouldHide) {
      const container = findBestContainer(candidate);

      if (!container.closest("[data-despoilerze-hidden='true'], [data-despoilerze-shell='true']") && !isSiteChrome(container)) {
        obfuscate(container, risk);
      }
    }

    markProcessed(candidate);
  }
}

function findCandidates(root: ParentNode): Element[] {
  const candidates = new Set<Element>();

  if (root instanceof Element && matchesAny(root, candidateSelectors)) {
    candidates.add(root);
  }

  for (const selector of candidateSelectors) {
    root.querySelectorAll?.(selector).forEach(element => candidates.add(element));
  }

  return Array.from(candidates);
}

function findBestContainer(element: HTMLElement): HTMLElement {
  /*
   * Google Search has very nested result cards. If we blur the nearest generic
   * child, the headline/snippet siblings can remain visible. So, on Google
   * search pages, deliberately climb to the whole search-result block first.
   */
  if (isGoogleSearchPage()) {
    const googleContainer = findGoogleSearchResultContainer(element);
    if (googleContainer) {
      return googleContainer;
    }
  }

  for (const selector of usefulContainerSelectors) {
    const container = element.closest(selector);
    if (container instanceof HTMLElement && !isSiteChrome(container)) {
      return container;
    }
  }

  return element;
}

function findGoogleSearchResultContainer(element: HTMLElement): HTMLElement | null {
  for (const selector of googleSearchResultContainerSelectors) {
    const container = element.closest(selector);
    if (container instanceof HTMLElement && isUsableGoogleResultContainer(container)) {
      return container;
    }
  }

  return null;
}

function isUsableGoogleResultContainer(container: HTMLElement): boolean {
  if (isSiteChrome(container)) return false;

  /*
   * Avoid accidentally selecting huge page-level containers. A normal result
   * card should be visible and not occupy most of the document.
   */
  const rect = container.getBoundingClientRect();
  if (rect.width < 120 || rect.height < 40) return false;

  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  if (rect.height > viewportHeight * 0.8) return false;

  return true;
}

function isGoogleSearchPage(): boolean {
  return /(^|\.)google\./i.test(window.location.hostname) && window.location.pathname === "/search";
}

function matchesAny(element: Element, selectors: string[]): boolean {
  return selectors.some(selector => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  });
}

function extractText(element: HTMLElement): string {
  const aria = element.getAttribute("aria-label") ?? "";
  const title = element.getAttribute("title") ?? "";
  const text = element.innerText ?? element.textContent ?? "";
  return `${aria} ${title} ${text}`.replace(/\s+/g, " ").trim();
}

function isPlausibleHeadlineText(text: string): boolean {
  if (!text) return false;
  if (text.length < 4) return false;
  if (text.length > 500) return false;
  return /[a-zA-Z]/.test(text);
}

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 20 && rect.height > 10;
}

function isSiteChrome(element: HTMLElement): boolean {
  return ignoredChromeSelectors.some(selector => {
    try {
      return !!element.closest(selector);
    } catch {
      return false;
    }
  });
}

function isTrustedSite(settings: Settings): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return settings.trustedSites.some(site =>
    hostname === site.toLowerCase() || hostname.endsWith(`.${site.toLowerCase()}`)
  );
}
