import type { RulePack, Settings } from "../shared/types";
import { scoreText } from "../rules/scoring";
import { isCatchUpModeActive } from "../shared/storage";
import { findBestContainer, isGoogleSearchPage, isSiteChrome } from "./containerSelection";
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

export function scanDocument(settings: Settings, rulePacks: RulePack[], root: ParentNode = document): void {
  if (!isCatchUpModeActive(settings)) return;
  if (isTrustedSite(settings)) return;

  scanGoogleSportsModules(settings, rulePacks, root);
  scanGoogleSpoilerLinks(settings, rulePacks, root);

  const candidates = findCandidates(root);

  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLElement)) continue;
    if (isProcessed(candidate) || isAlreadyHidden(candidate)) continue;
    if (isSiteChrome(candidate)) {
      markProcessed(candidate);
      continue;
    }
    if (!isVisible(candidate)) continue;

    if (candidate.closest("[data-despoilerze-hidden='true'], [data-despoilerze-shell='true'], [data-despoilerze-revealed='true']")) {
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

      if (!container.closest("[data-despoilerze-hidden='true'], [data-despoilerze-shell='true'], [data-despoilerze-revealed='true']") && !isSiteChrome(container)) {
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

function scanGoogleSportsModules(settings: Settings, rulePacks: RulePack[], root: ParentNode): void {
  if (!isGoogleSearchPage()) return;

  for (const module of findGoogleSportsModules(root)) {
    if (isProcessed(module) || isAlreadyHidden(module)) continue;
    if (module.closest("[data-despoilerze-hidden='true'], [data-despoilerze-shell='true'], [data-despoilerze-revealed='true']")) continue;
    if (!isVisible(module)) continue;

    const text = extractText(module);
    if (!hasGoogleSportsModuleMarker(text)) {
      markProcessed(module);
      continue;
    }

    const risk = scoreText(
      text,
      rulePacks,
      settings.catchUpMode.sensitivity,
      settings.customTerms
    );

    if (risk.shouldHide && !isSiteChrome(module)) {
      obfuscate(module, risk);
    }

    markProcessed(module);
  }
}

function findGoogleSportsModules(root: ParentNode): HTMLElement[] {
  const modules = new Set<HTMLElement>();

  for (const selector of googleSportsModuleSelectors) {
    root.querySelectorAll?.(selector).forEach(element => {
      if (element instanceof HTMLElement && isUsableGoogleSportsModule(element)) {
        modules.add(element);
      }
    });
  }

  for (const element of findGoogleSportsModuleMarkerElements(root)) {
    const module = findGoogleSportsModuleContainer(element);
    if (module) {
      modules.add(module);
    }
  }

  return Array.from(modules);
}

const googleSportsModuleSelectors = [
  "[data-attrid*='sports' i]",
  "[class*='imso' i]",
  "[class*='sports-app' i]",
  "[data-hveid][aria-label*='sports' i]"
];

const googleSportsModuleMarkerSelectors = [
  "[role='tab']",
  "[role='button']",
  "[aria-label]",
  "span",
  "div"
];

const googleSportsModuleMarkers = [
  "results",
  "race details",
  "match details",
  "scorecard",
  "standings",
  "fixtures",
  "schedule",
  "table",
  "lineups",
  "match stats",
  "drivers",
  "constructors"
];

function scanGoogleSpoilerLinks(settings: Settings, rulePacks: RulePack[], root: ParentNode): void {
  if (!isGoogleSearchPage()) return;

  root.querySelectorAll?.("a[href]").forEach(element => {
    if (!(element instanceof HTMLElement)) return;
    if (isProcessed(element) || isAlreadyHidden(element) || isSiteChrome(element)) return;
    if (element.closest("[data-despoilerze-hidden='true'], [data-despoilerze-shell='true'], [data-despoilerze-revealed='true']")) return;
    if (!isVisible(element)) return;

    const text = extractText(element);
    if (!isPlausibleHeadlineText(text)) {
      markProcessed(element);
      return;
    }

    const risk = scoreText(
      text,
      rulePacks,
      settings.catchUpMode.sensitivity,
      settings.customTerms
    );

    if (risk.shouldHide) {
      const container = findGoogleTopStoriesContainer(element) ?? findBestContainer(element);

      if (!container.closest("[data-despoilerze-hidden='true'], [data-despoilerze-shell='true'], [data-despoilerze-revealed='true']") && !isSiteChrome(container)) {
        obfuscate(container, risk);
      }
    }

    markProcessed(element);
  });
}

function findGoogleTopStoriesContainer(element: HTMLElement): HTMLElement | null {
  const explicitContainer = element.closest("article, [role='article'], [data-news-cluster], [class*='SoaBEf'], [class*='dbsr']");
  if (explicitContainer instanceof HTMLElement && isUsableGoogleTopStoriesContainer(explicitContainer)) {
    return explicitContainer;
  }

  let best: HTMLElement | null = null;
  let current: HTMLElement | null = element;

  for (let depth = 0; current && depth < 6; depth += 1) {
    if (isUsableGoogleTopStoriesContainer(current)) {
      best = current;
    }

    const parent: HTMLElement | null = current.parentElement;
    if (!parent || isGoogleSearchPageLevelContainer(parent) || isLikelyGoogleTopStoriesSection(parent)) {
      break;
    }

    current = parent;
  }

  return best;
}

function isUsableGoogleTopStoriesContainer(container: HTMLElement): boolean {
  if (isSiteChrome(container)) return false;
  if (isGoogleSearchPageLevelContainer(container)) return false;

  const text = extractText(container);
  if (text.length < 12 || text.length > 900) return false;
  if (isLikelyGoogleTopStoriesSection(container)) return false;

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  if (rect.width < 120 || rect.height < 40) return false;

  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  if (viewportHeight > 0 && rect.height > viewportHeight * 0.45) return false;

  return true;
}

function isLikelyGoogleTopStoriesSection(element: HTMLElement): boolean {
  const text = extractText(element).toLowerCase().replace(/\s+/g, " ").trim();
  if (!text.includes("top stories")) return false;

  return element.querySelectorAll("a[href]").length > 1;
}

function findGoogleSportsModuleMarkerElements(root: ParentNode): HTMLElement[] {
  const markerElements = new Set<HTMLElement>();

  for (const selector of googleSportsModuleMarkerSelectors) {
    root.querySelectorAll?.(selector).forEach(element => {
      if (!(element instanceof HTMLElement)) return;

      const text = extractText(element);
      if (text.length > 120) return;
      if (hasGoogleSportsModuleMarker(text)) {
        markerElements.add(element);
      }
    });
  }

  return Array.from(markerElements);
}

function findGoogleSportsModuleContainer(element: HTMLElement): HTMLElement | null {
  const explicitModule = element.closest(googleSportsModuleSelectors.join(", "));
  if (explicitModule instanceof HTMLElement && isUsableGoogleSportsModule(explicitModule)) {
    return explicitModule;
  }

  let best: HTMLElement | null = null;
  let current: HTMLElement | null = element;

  for (let depth = 0; current && depth < 8; depth += 1) {
    if (isUsableGoogleSportsModule(current)) {
      best = current;
    }

    const parent: HTMLElement | null = current.parentElement;
    if (!parent || isGoogleSearchPageLevelContainer(parent)) {
      break;
    }

    current = parent;
  }

  return best;
}

function hasGoogleSportsModuleMarker(text: string): boolean {
  const normalised = text.toLowerCase().replace(/\s+/g, " ").trim();
  return googleSportsModuleMarkers.some(marker => normalised.includes(marker));
}

function isUsableGoogleSportsModule(container: HTMLElement): boolean {
  if (isSiteChrome(container)) return false;
  if (isGoogleSearchPageLevelContainer(container)) return false;

  const text = extractText(container);
  if (text.length < 20 || text.length > 3000) return false;
  if (!hasGoogleSportsModuleMarker(text)) return false;

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  if (rect.width < 160 || rect.height < 40) return false;

  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  if (viewportHeight > 0 && rect.height > viewportHeight * 0.85) return false;

  return true;
}

function isGoogleSearchPageLevelContainer(element: HTMLElement): boolean {
  if (element === document.body || element === document.documentElement) return true;

  const id = element.id.toLowerCase();
  if (["main", "search", "rso", "center_col"].includes(id)) return true;

  return element.getAttribute("role") === "main";
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
