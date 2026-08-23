import { getRulePacks } from "../rules";
import type { Settings } from "../shared/types";
import { getSettings, isCatchUpModeActive } from "../shared/storage";
import { getProtectionState } from "../shared/protectionState";
import { scanDocument } from "./scanner";
import { clearProcessed, revealAll } from "./obfuscator";

let settings: Settings | null = null;
let scanQueued = false;
const pendingScanRoots = new Set<ParentNode>();

async function initialise(): Promise<void> {
  settings = await getSettings();
  void updateActionIcon();

  observeDocumentChanges();

  if (!isCatchUpModeActive(settings)) {
    return;
  }

  runScan();
}

function observeDocumentChanges(): void {
  const observer = new MutationObserver(mutations => {
    if (!settings || !isCatchUpModeActive(settings)) return;

    const changedRoots = new Set<ParentNode>();

    for (const mutation of mutations) {
      if (mutation.target instanceof Element) {
        changedRoots.add(mutation.target);
      } else if (mutation.target.parentElement) {
        changedRoots.add(mutation.target.parentElement);
      }

      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          changedRoots.add(node);
        }
      }
    }

    if (changedRoots.size > 0) {
      queueScan(Array.from(changedRoots));
    }
  });

  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true
  });
}

function runScan(roots: ParentNode[] = [document]): void {
  if (!settings) return;

  const rulePacks = getRulePacks(settings.enabledPacks);
  for (const root of roots) {
    scanDocument(settings, rulePacks, root);
  }
}

function queueScan(roots: ParentNode[] = [document]): void {
  for (const root of roots) {
    pendingScanRoots.add(root);
  }

  if (scanQueued) return;
  scanQueued = true;

  window.setTimeout(() => {
    scanQueued = false;
    const queuedRoots = Array.from(pendingScanRoots);
    pendingScanRoots.clear();
    runScan(queuedRoots);
  }, 250);
}

async function updateActionIcon(): Promise<void> {
  if (!settings) return;

  const response = await chrome.runtime.sendMessage({
    type: "DESPOILERZE_PAGE_STATE_CHANGED",
    state: getProtectionState(settings, window.location.hostname)
  }).catch(() => {
    // The background service worker may be unavailable during extension reloads.
  });

  if (response?.ok === false) {
    console.warn(`DeSpoilerize could not update the action icon: ${response.error ?? "unknown error"}`);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    if (message?.type === "DESPOILERZE_SETTINGS_CHANGED") {
      settings = await getSettings();
      void updateActionIcon();
      clearProcessed();
      if (!isCatchUpModeActive(settings)) {
        revealAll();
        sendResponse({ ok: true });
        return;
      }
      runScan();
      sendResponse({ ok: true });
      return;
    }

    if (message?.type === "DESPOILERZE_REVEAL_ALL") {
      revealAll();
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false });
  })();

  return true;
});

void initialise();
