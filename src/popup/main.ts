import type { ProtectionScheduleMode, Settings } from "../shared/types";
import { getAllRulePacks } from "../rules";
import { getSettings, saveSettings, SETTINGS_KEY } from "../shared/storage";
import { isCatchUpModeActive, syncExpiryAlarm } from "../shared/expiry";
import {
  describeSchedule,
  formatScheduleDateTime,
  getNextProtectionWindow
} from "../shared/schedule";
import { cloneSchedule, defaultSchedule, schedulePresets } from "../shared/schedulePresets";

let settings: Settings;

const statusElement = mustGet<HTMLElement>("status");
const statusTextElement = mustGet<HTMLElement>("status-text");
const titleElement = mustGet<HTMLHeadingElement>("popup-title");
const toggleButton = mustGet<HTMLButtonElement>("toggle");
const scheduleDescriptionElement = mustGet<HTMLElement>("schedule-description");
const sensitivitySummaryElement = mustGet<HTMLElement>("sensitivity-summary");
const packSummaryElement = mustGet<HTMLElement>("enabled-packs-summary");
const revealAllButton = mustGet<HTMLButtonElement>("reveal-all");
const optionsButton = mustGet<HTMLButtonElement>("open-options");
const nextProtectionElement = mustGet<HTMLElement>("next-protection");
const protectionEndsElement = mustGet<HTMLElement>("protection-ends");

void initialise();

async function initialise(): Promise<void> {
  renderTitle();
  settings = await getSettings();
  render();

  toggleButton.addEventListener("click", () => {
    void update(draft => {
      draft.catchUpMode.enabled = true;
      draft.catchUpMode.expiresAtUtc = undefined;
      draft.catchUpMode.schedule = isCatchUpModeActive(settings)
        ? cloneSchedule(schedulePresets.paused)
        : cloneSchedule(schedulePresets.always);
    });
  });

  revealAllButton.addEventListener("click", () => {
    void revealAllOnPage();
  });

  optionsButton.addEventListener("click", () => {
    void chrome.runtime.openOptionsPage();
  });

  chrome.storage.onChanged.addListener(changes => {
    if (!changes[SETTINGS_KEY]) return;

    void getSettings().then(next => {
      settings = next;
      render();
    });
  });
}

function renderTitle(): void {
  const title = `DeSpoilerize v${chrome.runtime.getManifest().version}`;
  titleElement.textContent = title;
  document.title = title;
}

function render(): void {
  const active = isCatchUpModeActive(settings);
  const schedule = currentSchedule();
  const nextWindow = getNextProtectionWindow(settings);

  statusTextElement.textContent = `Protection: ${active ? "ON" : "OFF"}`;
  statusElement.classList.toggle("on", active);
  statusElement.classList.toggle("off", !active);

  toggleButton.querySelector("span:last-child")!.textContent = active ? "Stop protection" : "Start protection";
  scheduleDescriptionElement.textContent = `${formatScheduleMode(schedule.mode)}: ${describeSchedule(schedule)}`;

  if (nextWindow && schedule.mode !== "always") {
    nextProtectionElement.textContent = active ? "Active now" : formatScheduleDateTime(nextWindow.start);
    protectionEndsElement.textContent = formatScheduleDateTime(nextWindow.end);
  } else if (schedule.mode === "always") {
    nextProtectionElement.textContent = "Active now";
    protectionEndsElement.textContent = "When paused";
  } else {
    nextProtectionElement.textContent = "Not scheduled";
    protectionEndsElement.textContent = "Not scheduled";
  }

  sensitivitySummaryElement.textContent = formatSensitivity(settings.catchUpMode.sensitivity);
  packSummaryElement.textContent = describeEnabledPacks(settings.enabledPacks);
}

function currentSchedule() {
  return cloneSchedule(settings.catchUpMode.schedule ?? defaultSchedule);
}

function describeEnabledPacks(enabledPackIds: string[]): string {
  const packs = getAllRulePacks().filter(pack => enabledPackIds.includes(pack.id));

  if (packs.length === 0) {
    return "custom terms only";
  }

  if (packs.length <= 4) {
    return packs.map(pack => pack.label).join(", ");
  }

  const firstFew = packs.slice(0, 4).map(pack => pack.label).join(", ");
  return `${firstFew}, +${packs.length - 4} more`;
}

function formatScheduleMode(mode: ProtectionScheduleMode): string {
  if (mode === "weekend") return "Every weekend";
  if (mode === "daily") return "Daily";
  if (mode === "custom") return "Custom days";
  if (mode === "always") return "Always on";
  return "Paused";
}

function formatSensitivity(value: string): string {
  if (value === "gentle") return "Gentle";
  if (value === "balanced") return "Balanced";
  return "Lockdown";
}

async function update(mutator: (draft: Settings) => void): Promise<void> {
  const next = structuredClone(settings);
  mutator(next);
  await saveSettings(next);
  await syncExpiryAlarm(next);
  settings = next;
  render();
  await notifyTabs();
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
