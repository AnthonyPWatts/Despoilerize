import { getRulePacks } from "../rules";
import type { Settings } from "../shared/types";
import { getSettings, isCatchUpModeActive } from "../shared/storage";
import { scanDocument } from "./scanner";
import { revealAll } from "./obfuscator";

let settings: Settings | null = null;
let scanQueued = false;

async function initialise(): Promise<void> {
  settings = await getSettings();

  if (!isCatchUpModeActive(settings)) {
    return;
  }

  runScan();

  const observer = new MutationObserver(mutations => {
    if (!settings || !isCatchUpModeActive(settings)) return;

    const addedNodes: ParentNode[] = [];

    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          addedNodes.push(node);
        }
      }
    }

    if (addedNodes.length > 0) {
      queueScan(addedNodes);
    }
  });

  observer.observe(document.body, {
    childList: true,
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
  if (scanQueued) return;
  scanQueued = true;

  window.setTimeout(() => {
    scanQueued = false;
    runScan(roots);
  }, 250);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    if (message?.type === "DESPOILERZE_SETTINGS_CHANGED") {
      settings = await getSettings();
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
