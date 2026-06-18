import type { ProtectionSchedule, ProtectionScheduleMode, Settings, Sensitivity } from "../shared/types";
import { getAllRulePacks } from "../rules";
import { getSettings, saveSettings } from "../shared/storage";
import { isCatchUpModeActive, syncExpiryAlarm } from "../shared/expiry";
import {
  describeSchedule,
  formatScheduleDateTime,
  getNextProtectionWindow
} from "../shared/schedule";

let settings: Settings;

const defaultSchedule: ProtectionSchedule = {
  mode: "weekend",
  days: [6, 0],
  startTime: "00:00",
  endTime: "23:59"
};

const schedulePresets: Record<ProtectionScheduleMode, ProtectionSchedule> = {
  weekend: defaultSchedule,
  daily: {
    mode: "daily",
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: "00:00",
    endTime: "23:59"
  },
  custom: {
    mode: "custom",
    days: [6, 0],
    startTime: "00:00",
    endTime: "23:59"
  },
  always: {
    mode: "always",
    days: [],
    startTime: "00:00",
    endTime: "23:59"
  },
  paused: {
    mode: "paused",
    days: [],
    startTime: "00:00",
    endTime: "23:59"
  }
};

const statusElement = mustGet<HTMLElement>("status");
const statusTextElement = mustGet<HTMLElement>("status-text");
const titleElement = mustGet<HTMLHeadingElement>("popup-title");
const toggleButton = mustGet<HTMLButtonElement>("toggle");
const sensitivitySelect = mustGet<HTMLSelectElement>("sensitivity");
const packSummaryElement = mustGet<HTMLElement>("enabled-packs-summary");
const revealAllButton = mustGet<HTMLButtonElement>("reveal-all");
const optionsButton = mustGet<HTMLButtonElement>("open-options");
const nextProtectionElement = mustGet<HTMLElement>("next-protection");
const protectionEndsElement = mustGet<HTMLElement>("protection-ends");
const scheduleStartInput = mustGet<HTMLInputElement>("schedule-start");
const scheduleEndInput = mustGet<HTMLInputElement>("schedule-end");
const timeControls = mustGet<HTMLElement>("time-controls");
const scheduleCards = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-schedule-mode]"));
const dayButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-schedule-day]"));

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

  for (const card of scheduleCards) {
    card.addEventListener("click", event => {
      const cardMode = card.dataset.scheduleMode as ProtectionScheduleMode;
      const clickedAction = event.target instanceof Element && !!event.target.closest(".card-action");
      const mode = cardMode === "weekend" && clickedAction ? "custom" : cardMode;

      void update(draft => {
        draft.catchUpMode.enabled = true;
        draft.catchUpMode.expiresAtUtc = undefined;
        draft.catchUpMode.schedule = scheduleForMode(mode, currentSchedule());
      }).then(() => {
        if (mode === "daily" || mode === "custom") {
          scheduleStartInput.focus();
        }
      });
    });
  }

  for (const button of dayButtons) {
    button.addEventListener("click", () => {
      const day = Number(button.dataset.scheduleDay);
      void update(draft => {
        const schedule = scheduleForMode("custom", currentSchedule());
        schedule.days = toggleDay(schedule.days, day);
        draft.catchUpMode.enabled = true;
        draft.catchUpMode.expiresAtUtc = undefined;
        draft.catchUpMode.schedule = schedule;
      });
    });
  }

  scheduleStartInput.addEventListener("change", () => {
    updateScheduleTimes();
  });

  scheduleEndInput.addEventListener("change", () => {
    updateScheduleTimes();
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

function renderTitle(): void {
  const title = `DeSpoilerize v${chrome.runtime.getManifest().version}`;
  titleElement.textContent = title;
  document.title = title;
}

function render(): void {
  const active = isCatchUpModeActive(settings);
  const schedule = currentSchedule();
  const nextWindow = getNextProtectionWindow(settings);

  statusTextElement.textContent = `Catch-up Mode: ${active ? "ON" : "OFF"}`;
  statusElement.classList.toggle("on", active);
  statusElement.classList.toggle("off", !active);

  toggleButton.querySelector("span:last-child")!.textContent = active ? "Turn off" : "Turn on";

  for (const card of scheduleCards) {
    const mode = card.dataset.scheduleMode as ProtectionScheduleMode;
    const selected = schedule.mode === mode;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-checked", String(selected));
    card.querySelector<HTMLElement>(".active-badge")?.toggleAttribute("hidden", !(selected && active));
  }

  for (const button of dayButtons) {
    const day = Number(button.dataset.scheduleDay);
    const selected = schedule.mode === "daily" || schedule.days.includes(day);
    button.classList.toggle("selected", selected);
  }

  timeControls.hidden = schedule.mode !== "daily" && schedule.mode !== "custom";
  scheduleStartInput.value = schedule.startTime;
  scheduleEndInput.value = schedule.endTime;

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

  sensitivitySelect.value = settings.catchUpMode.sensitivity;
  packSummaryElement.textContent = describeEnabledPacks(settings.enabledPacks);

  for (const card of scheduleCards) {
    const mode = card.dataset.scheduleMode as ProtectionScheduleMode;
    const copy = card.querySelector<HTMLElement>(".schedule-copy span:last-child");
    if (copy && mode === schedule.mode) {
      copy.textContent = describeSchedule(schedule);
    }
  }
}

function currentSchedule(): ProtectionSchedule {
  return cloneSchedule(settings.catchUpMode.schedule ?? defaultSchedule);
}

function scheduleForMode(mode: ProtectionScheduleMode, current: ProtectionSchedule): ProtectionSchedule {
  const preset = cloneSchedule(schedulePresets[mode]);

  if (mode === "daily" || mode === "custom") {
    preset.startTime = current.startTime;
    preset.endTime = current.endTime;
  }

  if (mode === "custom" && current.days.length > 0) {
    preset.days = [...current.days];
  }

  return preset;
}

function updateScheduleTimes(): void {
  void update(draft => {
    const schedule = scheduleForMode(currentSchedule().mode, currentSchedule());
    schedule.startTime = scheduleStartInput.value || "00:00";
    schedule.endTime = scheduleEndInput.value || "23:59";
    draft.catchUpMode.enabled = true;
    draft.catchUpMode.expiresAtUtc = undefined;
    draft.catchUpMode.schedule = schedule;
  });
}

function toggleDay(days: number[], day: number): number[] {
  const next = days.includes(day)
    ? days.filter(value => value !== day)
    : [...days, day];

  return next.length > 0 ? next : [day];
}

function cloneSchedule(schedule: ProtectionSchedule): ProtectionSchedule {
  return {
    ...schedule,
    days: [...schedule.days]
  };
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
