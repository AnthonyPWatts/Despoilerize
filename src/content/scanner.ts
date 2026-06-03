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
  "a",
  "[role='article']",
  "[data-testid*='post']",
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-reel-item-renderer"
];

const usefulContainerSelectors = [
  "article",
  "[role='article']",
  "[data-testid*='post']",
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-reel-item-renderer",
  "li",
  ".card",
  ".promo",
  ".media",
  ".gs-result",
  ".g"
];

export function scanDocument(settings: Settings, rulePacks: RulePack[], root: ParentNode = document): void {
  if (!isCatchUpModeActive(settings)) return;
  if (isTrustedSite(settings)) return;

  const candidates = findCandidates(root);

  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLElement)) continue;
    if (isProcessed(candidate) || isAlreadyHidden(candidate)) continue;
    if (!isVisible(candidate)) continue;

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
      obfuscate(container, risk);
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
  for (const selector of usefulContainerSelectors) {
    const container = element.closest(selector);
    if (container instanceof HTMLElement) {
      return container;
    }
  }

  return element;
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

function isTrustedSite(settings: Settings): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return settings.trustedSites.some(site =>
    hostname === site.toLowerCase() || hostname.endsWith(`.${site.toLowerCase()}`)
  );
}
