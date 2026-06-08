import type { Settings, Sensitivity } from "../shared/types";
import { getAllRulePacks } from "../rules";
import { getSettings, saveSettings } from "../shared/storage";

let settings: Settings;

const statusElement = mustGet<HTMLElement>("status");
const toggleButton = mustGet<HTMLButtonElement>("toggle");
const sensitivitySelect = mustGet<HTMLSelectElement>("sensitivity");
const packSummaryElement = mustGet<HTMLElement>("enabled-packs-summary");
const manualButton = mustGet<HTMLButtonElement>("manual");
const revealAllButton = mustGet<HTMLButtonElement>("reveal-all");
const optionsButton = mustGet<HTMLButtonElement>("open-options");
const expiryElement = mustGet<HTMLElement>("expiry");

void initialise();

async function initialise(): Promise<void> {
  settings = await getSettings();
  render();

  toggleButton.addEventListener("click", () => {
    void update(draft => {
      draft.catchUpMode.enabled = !draft.catchUpMode.enabled;
      if (!draft.catchUpMode.enabled) {
        draft.catchUpMode.expiresAtUtc = undefined;
      }
    });
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-expiry-hours]")) {
    button.addEventListener("click", () => {
      const hours = Number(button.dataset.expiryHours);
      void update(draft => {
        draft.catchUpMode.enabled = true;
        draft.catchUpMode.expiresAtUtc = addHours(hours);
      });
    });
  }

  manualButton.addEventListener("click", () => {
    void update(draft => {
      draft.catchUpMode.enabled = true;
      draft.catchUpMode.expiresAtUtc = undefined;
    });
  });

  sensitivitySelect.addEventListener("change", () => {
    void update(draft => {
      draft.catchUpMode.sensitivity = sensitivitySelect.value as Sensitivity;
    });
  });

  revealAllButton.addEventListener("click", () => {
    void revealAllOnPage();
  });

  optionsButton.addEventListener("click", () => {
    void chrome.runtime.openOptionsPage();
  });
}

function render(): void {
  const enabled = settings.catchUpMode.enabled;

  statusElement.textContent = `Catch-up Mode: ${enabled ? "ON" : "OFF"}`;
  statusElement.classList.toggle("on", enabled);
  statusElement.classList.toggle("off", !enabled);

  toggleButton.textContent = enabled ? "Turn off" : "Turn on";

  sensitivitySelect.value = settings.catchUpMode.sensitivity;
  packSummaryElement.textContent = describeEnabledPacks(settings.enabledPacks);

  expiryElement.textContent = settings.catchUpMode.expiresAtUtc
    ? `Expires: ${new Date(settings.catchUpMode.expiresAtUtc).toLocaleString()}`
    : "";
}

function describeEnabledPacks(enabledPackIds: string[]): string {
  const packs = getAllRulePacks().filter(pack => enabledPackIds.includes(pack.id));

  if (packs.length === 0) {
    return "No sport packs selected. Add packs in Settings or use custom terms.";
  }

  if (packs.length <= 4) {
    return packs.map(pack => pack.label).join(", ");
  }

  const firstFew = packs.slice(0, 4).map(pack => pack.label).join(", ");
  return `${firstFew}, +${packs.length - 4} more`;
}

async function update(mutator: (draft: Settings) => void): Promise<void> {
  const next = structuredClone(settings);
  mutator(next);
  await saveSettings(next);
  settings = next;
  render();
  await notifyTabs();
}

function addHours(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

async function notifyTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(
    tabs
      .filter(tab => tab.id)
      .map(tab => chrome.tabs.sendMessage(tab.id!, { type: "DESPOILERZE_SETTINGS_CHANGED" }))
  );
}

async function revealAllOnPage(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { type: "DESPOILERZE_REVEAL_ALL" }).catch(() => {});
  }
}

function mustGet<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing expected element #${id}`);
  }
  return element as T;
}
