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

const youtubeContainerSelectors = [
  "ytd-video-renderer",
  "ytd-rich-item-renderer",
  "ytd-rich-grid-media",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-reel-item-renderer",
  "ytd-reel-video-renderer",
  "yt-lockup-view-model",
  "ytm-shorts-lockup-view-model"
];

const bbcContainerSelectors = [
  "[data-testid='liverpool-card']",
  "[data-testid='edinburgh-card']",
  "[data-testid='manchester-card']",
  "[data-testid='promo']",
  "[data-testid*='promo' i]",
  "[data-testid$='-card' i]",
  "[data-component='card']",
  "[data-component*='card' i]",
  "[class*='promo' i]",
  "article"
];

const guardianContainerSelectors = [
  "article",
  "[role='article']",
  "[data-component*='card' i]",
  "[data-component*='trail' i]",
  "[class*='fc-item' i]",
  "[class*='content-card' i]",
  "[class*='trail' i]",
  "[class*='card' i]",
  "li",
  "[data-link-name*='article' i]",
  "[data-link-name*='card' i]",
  "[data-link-name*='trail' i]"
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

export function findBestContainer(element: HTMLElement): HTMLElement {
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

  if (isYouTubePage()) {
    const youtubeContainer = findYouTubeContainer(element);
    if (youtubeContainer) {
      return youtubeContainer;
    }
  }

  if (isBBCPage()) {
    const bbcContainer = findBBCContainer(element);
    if (bbcContainer) {
      return bbcContainer;
    }
  }

  if (isGuardianPage()) {
    const guardianContainer = findGuardianContainer(element);
    if (guardianContainer) {
      return guardianContainer;
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

export function findYouTubeContainer(element: HTMLElement): HTMLElement | null {
  for (const selector of youtubeContainerSelectors) {
    const container = element.closest(selector);
    if (container instanceof HTMLElement && isUsableYouTubeContainer(container)) {
      return container;
    }
  }

  return null;
}

export function findBBCContainer(element: HTMLElement): HTMLElement | null {
  for (const selector of bbcContainerSelectors) {
    const container = element.closest(selector);
    if (container instanceof HTMLElement && isUsableBBCContainer(container)) {
      return container;
    }
  }

  return null;
}

export function findGuardianContainer(element: HTMLElement): HTMLElement | null {
  for (const selector of guardianContainerSelectors) {
    const container = element.closest(selector);
    if (container instanceof HTMLElement && isUsableGuardianContainer(container)) {
      return container;
    }
  }

  return findGuardianLinkContainer(element);
}

export function findGoogleSearchResultContainer(element: HTMLElement): HTMLElement | null {
  for (const selector of googleSearchResultContainerSelectors) {
    const container = element.closest(selector);
    if (container instanceof HTMLElement && isUsableGoogleResultContainer(container)) {
      return container;
    }
  }

  return null;
}

export function isSiteChrome(element: HTMLElement): boolean {
  return ignoredChromeSelectors.some(selector => {
    try {
      return !!element.closest(selector);
    } catch {
      return false;
    }
  });
}

export function isGoogleSearchPage(): boolean {
  return /(^|\.)google\./i.test(window.location.hostname) && window.location.pathname === "/search";
}

export function isYouTubePage(): boolean {
  return /(^|\.)youtube\.com$/i.test(window.location.hostname);
}

export function isBBCPage(): boolean {
  return /(^|\.)bbc\.(co\.uk|com)$/i.test(window.location.hostname);
}

export function isGuardianPage(): boolean {
  return /(^|\.)theguardian\.com$/i.test(window.location.hostname);
}

function isUsableYouTubeContainer(container: HTMLElement): boolean {
  if (isSiteChrome(container)) return false;

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  if (rect.width < 120 || rect.height < 40) return false;

  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  if (viewportHeight > 0 && rect.height > viewportHeight * 0.8) return false;

  return true;
}

function isUsableBBCContainer(container: HTMLElement): boolean {
  if (isSiteChrome(container)) return false;
  if (container === document.body || container === document.documentElement) return false;
  if (container.getAttribute("role") === "main") return false;

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  if (rect.width < 120 || rect.height < 40) return false;

  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  if (viewportHeight > 0 && rect.height > viewportHeight * 0.65) return false;

  return true;
}

function findGuardianLinkContainer(element: HTMLElement): HTMLElement | null {
  const link = element.closest("a[href]");
  let current = link?.parentElement ?? element.parentElement;

  for (let depth = 0; current && depth < 6; depth += 1) {
    if (isUsableGuardianContainer(current)) {
      return current;
    }

    if (current === document.body || current === document.documentElement || current.getAttribute("role") === "main") {
      break;
    }

    current = current.parentElement;
  }

  return null;
}

function isUsableGuardianContainer(container: HTMLElement): boolean {
  if (isSiteChrome(container)) return false;
  if (container === document.body || container === document.documentElement) return false;
  if (container.getAttribute("role") === "main") return false;
  if (container.matches("section, [data-component*='container' i]") && container.querySelectorAll("a[href]").length > 1) return false;

  const text = (container.innerText ?? container.textContent ?? "").replace(/\s+/g, " ").trim();
  if (text.length < 8 || text.length > 1400) return false;

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  if (rect.width < 100 || rect.height < 24) return false;

  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  if (viewportHeight > 0 && rect.height > viewportHeight * 0.7) return false;

  return true;
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
