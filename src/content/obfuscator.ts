import type { RiskResult } from "../shared/types";

const WRAPPER_CLASS = "despoilerze-wrapper";
const BLUR_CLASS = "despoilerze-blurred";
const OVERLAY_CLASS = "despoilerze-overlay";
const PROCESSED_ATTR = "data-despoilerze-processed";
const HIDDEN_ATTR = "data-despoilerze-hidden";

export function injectStyles(): void {
  if (document.getElementById("despoilerze-style")) return;

  const style = document.createElement("style");
  style.id = "despoilerze-style";
  style.textContent = `
    .${WRAPPER_CLASS} {
      position: relative !important;
    }

    .${BLUR_CLASS} {
      filter: blur(10px) !important;
      user-select: none !important;
    }

    .${OVERLAY_CLASS} {
      position: absolute !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: auto !important;
      padding: 8px !important;
      box-sizing: border-box !important;
      background: rgba(20, 20, 20, 0.72) !important;
      color: #fff !important;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif !important;
      text-align: center !important;
      border-radius: 8px !important;
    }

    .despoilerze-card {
      max-width: 340px !important;
      background: rgba(0, 0, 0, 0.72) !important;
      border: 1px solid rgba(255,255,255,0.28) !important;
      border-radius: 8px !important;
      padding: 10px 12px !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.35) !important;
    }

    .despoilerze-title {
      font-weight: 700 !important;
      margin-bottom: 4px !important;
      font-size: 14px !important;
    }

    .despoilerze-reason {
      font-size: 12px !important;
      opacity: 0.85 !important;
      margin-bottom: 8px !important;
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
      margin: 0 3px !important;
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
  return element.getAttribute(HIDDEN_ATTR) === "true";
}

export function obfuscate(container: HTMLElement, risk: RiskResult): void {
  if (isAlreadyHidden(container)) return;

  injectStyles();

  container.classList.add(WRAPPER_CLASS);
  container.setAttribute(HIDDEN_ATTR, "true");
  container.setAttribute("data-despoilerze-score", String(risk.score));
  container.setAttribute("data-despoilerze-reasons", risk.reasons.join(" | "));

  const children = Array.from(container.children).filter(
    child => !(child as HTMLElement).classList.contains(OVERLAY_CLASS)
  );

  for (const child of children) {
    child.classList.add(BLUR_CLASS);
  }

  if (children.length === 0) {
    container.classList.add(BLUR_CLASS);
  }

  const overlay = document.createElement("div");
  overlay.className = OVERLAY_CLASS;
  overlay.innerHTML = `
    <div class="despoilerze-card">
      <div class="despoilerze-title">Possible sports result hidden</div>
      <div class="despoilerze-reason">${escapeHtml(risk.reasons[0] ?? "Catch-up Mode is active")}</div>
      <button class="despoilerze-button" data-action="reveal-once">Reveal once</button>
      <button class="despoilerze-button" data-action="hide-again">Keep hidden</button>
    </div>
  `;

  overlay.addEventListener("click", event => {
    event.stopPropagation();
    const target = event.target as HTMLElement;
    const action = target.getAttribute("data-action");

    if (action === "reveal-once") {
      reveal(container);
    }
  });

  container.appendChild(overlay);
}

export function reveal(container: HTMLElement): void {
  container.classList.remove(WRAPPER_CLASS, BLUR_CLASS);
  container.removeAttribute(HIDDEN_ATTR);

  for (const child of Array.from(container.children)) {
    const element = child as HTMLElement;
    if (element.classList.contains(OVERLAY_CLASS)) {
      element.remove();
    } else {
      element.classList.remove(BLUR_CLASS);
    }
  }
}

export function revealAll(): void {
  for (const element of document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`)) {
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
