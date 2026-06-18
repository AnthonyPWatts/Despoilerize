import type { RiskResult } from "../shared/types";

const SHELL_CLASS = "despoilerze-shell";
const WRAPPER_CLASS = "despoilerze-wrapper";
const BLUR_CLASS = "despoilerze-blurred";
const OVERLAY_CLASS = "despoilerze-overlay";
const PROCESSED_ATTR = "data-despoilerze-processed";
const HIDDEN_ATTR = "data-despoilerze-hidden";
const SHELL_ATTR = "data-despoilerze-shell";
const TARGET_ID_ATTR = "data-despoilerze-target-id";
const DETACHED_OVERLAY_ATTR = "data-despoilerze-detached-overlay";
const REVEALED_ATTR = "data-despoilerze-revealed";
let nextTargetId = 1;

export function injectStyles(): void {
  if (document.getElementById("despoilerze-style")) return;

  const style = document.createElement("style");
  style.id = "despoilerze-style";
  style.textContent = `
    .${SHELL_CLASS} {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .${WRAPPER_CLASS} {
      outline: 2px solid rgba(255, 255, 255, 0.22) !important;
      border-radius: 8px !important;
      overflow: hidden !important;
    }

    .${BLUR_CLASS} {
      filter: blur(10px) !important;
      user-select: none !important;
      pointer-events: none !important;
    }

    .${OVERLAY_CLASS} {
      display: block !important;
      position: static !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
      padding: 0 !important;
      margin: 0 0 8px 0 !important;
      box-sizing: border-box !important;
      color: #fff !important;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif !important;
      text-align: left !important;
      transform: none !important;
      filter: none !important;
      direction: ltr !important;
      writing-mode: horizontal-tb !important;
    }

    .despoilerze-detached-overlay {
      position: absolute !important;
      z-index: 2147483647 !important;
      display: block !important;
      pointer-events: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      transform: none !important;
      filter: none !important;
      direction: ltr !important;
      writing-mode: horizontal-tb !important;
      text-align: left !important;
      color: #fff !important;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif !important;
    }

    .despoilerze-card {
      display: inline-block !important;
      max-width: min(360px, 100%) !important;
      background: rgba(0, 0, 0, 0.88) !important;
      border: 1px solid rgba(255,255,255,0.28) !important;
      border-radius: 8px !important;
      padding: 10px 12px !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.35) !important;
      box-sizing: border-box !important;
      color: #fff !important;
    }

    .despoilerze-title {
      font-weight: 700 !important;
      margin-bottom: 4px !important;
      font-size: 14px !important;
      line-height: 1.25 !important;
      color: #fff !important;
    }

    .despoilerze-reason {
      font-size: 12px !important;
      line-height: 1.35 !important;
      opacity: 0.85 !important;
      margin-bottom: 8px !important;
      color: #fff !important;
    }

    .despoilerze-button {
      appearance: none !important;
      border: 1px solid rgba(255,255,255,0.35) !important;
      border-radius: 5px !important;
      padding: 4px 8px !important;
      background: rgba(255,255,255,0.12) !important;
      color: #fff !important;
      cursor: pointer !important;
      font-size: 12px !important;
      line-height: 1.2 !important;
      margin: 0 6px 0 0 !important;
    }

    .despoilerze-button:hover {
      background: rgba(255,255,255,0.24) !important;
    }
  `;
  document.documentElement.appendChild(style);
}

export function markProcessed(element: HTMLElement): void {
  element.setAttribute(PROCESSED_ATTR, "true");
}

export function isProcessed(element: HTMLElement): boolean {
  return element.getAttribute(PROCESSED_ATTR) === "true";
}

export function isAlreadyHidden(element: HTMLElement): boolean {
  return element.getAttribute(HIDDEN_ATTR) === "true" || !!element.closest(`[${SHELL_ATTR}="true"]`);
}

export function obfuscate(container: HTMLElement, risk: RiskResult): void {
  if (isAlreadyHidden(container)) return;
  if (!container.parentElement) return;

  injectStyles();

  if (shouldUseDetachedOverlay()) {
    obfuscateWithDetachedOverlay(container, risk);
    return;
  }

  const shell = document.createElement("div");
  shell.className = SHELL_CLASS;
  shell.setAttribute(SHELL_ATTR, "true");

  const overlay = createOverlay(container, risk);

  container.parentElement.insertBefore(shell, container);
  shell.appendChild(overlay);
  shell.appendChild(container);

  hideContainer(container, risk);
}

function obfuscateWithDetachedOverlay(container: HTMLElement, risk: RiskResult): void {
  const targetId = getOrCreateTargetId(container);
  const overlay = createOverlay(container, risk);
  overlay.classList.add("despoilerze-detached-overlay");
  overlay.setAttribute(DETACHED_OVERLAY_ATTR, "true");
  overlay.setAttribute(TARGET_ID_ATTR, targetId);

  positionDetachedOverlay(overlay, container);
  document.body.appendChild(overlay);

  hideContainer(container, risk);
}

function createOverlay(container: HTMLElement, risk: RiskResult): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = OVERLAY_CLASS;
  overlay.innerHTML = `
    <div class="despoilerze-card">
      <div class="despoilerze-title">Possible spoiler hidden</div>
      <div class="despoilerze-reason">${escapeHtml(risk.reasons[0] ?? "Spoiler protection is active")}</div>
      <button class="despoilerze-button" data-action="reveal-once">Reveal once</button>
      <button class="despoilerze-button" data-action="reveal-all">Reveal all on page</button>
    </div>
  `;

  overlay.addEventListener("click", event => {
    event.stopPropagation();

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest<HTMLButtonElement>("button[data-action]");
    const action = button?.getAttribute("data-action");

    if (action === "reveal-once") {
      reveal(container);
      return;
    }

    if (action === "reveal-all") {
      revealAll();
    }
  });

  return overlay;
}

function hideContainer(container: HTMLElement, risk: RiskResult): void {
  container.classList.add(WRAPPER_CLASS, BLUR_CLASS);
  container.setAttribute(HIDDEN_ATTR, "true");
  container.setAttribute("data-despoilerze-score", String(risk.score));
  container.setAttribute("data-despoilerze-reasons", risk.reasons.join(" | "));
}

function positionDetachedOverlay(overlay: HTMLElement, container: HTMLElement): void {
  const rect = container.getBoundingClientRect();
  const top = Math.max(0, rect.top + window.scrollY + 8);
  const left = Math.max(0, rect.left + window.scrollX + 8);

  overlay.style.top = `${top}px`;
  overlay.style.left = `${left}px`;
  overlay.style.maxWidth = `${Math.max(220, Math.min(360, rect.width - 16))}px`;
}

function shouldUseDetachedOverlay(): boolean {
  return /(^|\.)google\./i.test(window.location.hostname) && window.location.pathname === "/search";
}

function getOrCreateTargetId(container: HTMLElement): string {
  const existing = container.getAttribute(TARGET_ID_ATTR);
  if (existing) return existing;

  const id = `despoilerze-target-${nextTargetId++}`;
  container.setAttribute(TARGET_ID_ATTR, id);
  return id;
}

export function reveal(container: HTMLElement): void {
  const shell = container.closest(`[${SHELL_ATTR}="true"]`);
  const targetId = container.getAttribute(TARGET_ID_ATTR);

  /*
   * Mark this item as deliberately revealed for the lifetime of the page.
   * Without this, the MutationObserver can immediately re-scan and re-hide
   * the same result after the overlay/shell DOM changes.
   */
  container.setAttribute(REVEALED_ATTR, "true");
  container.classList.remove(WRAPPER_CLASS, BLUR_CLASS);
  container.removeAttribute(HIDDEN_ATTR);

  if (targetId) {
    for (const overlay of Array.from(document.querySelectorAll(`[${DETACHED_OVERLAY_ATTR}="true"][${TARGET_ID_ATTR}="${targetId}"]`))) {
      overlay.remove();
    }
    container.removeAttribute(TARGET_ID_ATTR);
  }

  if (shell?.parentElement) {
    shell.parentElement.insertBefore(container, shell);
    shell.remove();
    return;
  }

  for (const overlay of Array.from(container.querySelectorAll(`.${OVERLAY_CLASS}`))) {
    overlay.remove();
  }
}

export function revealAll(): void {
  for (const element of Array.from(document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`))) {
    reveal(element as HTMLElement);
  }
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, char => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return char;
    }
  });
}
