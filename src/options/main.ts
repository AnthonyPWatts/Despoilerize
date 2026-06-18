import type { ProtectionSchedule, ProtectionScheduleMode, RulePackGroup, Settings, Sensitivity } from "../shared/types";
import { defaultSettings } from "../shared/defaultSettings";
import { getRulePackGroups } from "../rules";
import { getSettings, saveSettings } from "../shared/storage";
import { supportedSites } from "../shared/supportedSites";
import { syncExpiryAlarm } from "../shared/expiry";
import {
  describeSchedule,
  formatScheduleDateTime,
  getNextProtectionWindow
} from "../shared/schedule";
import { cloneSchedule, defaultSchedule, scheduleForMode } from "../shared/schedulePresets";

let settings: Settings;
let saveTimeout: number | undefined;
let savedMessageTimeout: number | undefined;
let allExpanded = false;

const settingsIconRoot = "/public/settings-icons";

const groupMetadata: Record<string, { description: string; icon: string }> = {
  motorsport: {
    description: "Races, drivers, teams, and championship results.",
    icon: "motorsport"
  },
  football: {
    description: "Leagues, cups, and football results.",
    icon: "football"
  },
  rugby: {
    description: "Union, league, and international results.",
    icon: "rugby"
  },
  cricket: {
    description: "Matches, series, and cricket results.",
    icon: "cricket"
  },
  tennis: {
    description: "Tournaments, matches, and tennis results.",
    icon: "tennis"
  },
  "us-sports": {
    description: "NFL, NBA, and major US sports.",
    icon: "us-sports"
  },
  entertainment: {
    description: "Shows, reality TV, and entertainment spoilers.",
    icon: "entertainment"
  }
};

const sportsGroupsElement = mustGet<HTMLElement>("sports-groups");
const customTermsTextArea = mustGet<HTMLTextAreaElement>("custom-terms");
const supportedSitesElement = mustGet<HTMLElement>("supported-sites");
const customTermsCount = mustGet<HTMLElement>("custom-terms-count");
const trustedSitesCount = mustGet<HTMLElement>("trusted-sites-count");
const saveTopButton = mustGet<HTMLButtonElement>("save-top");
const saveTopStatus = mustGet<HTMLElement>("save-top-status");
const expandAllButton = mustGet<HTMLButtonElement>("expand-all");
const exportButton = mustGet<HTMLButtonElement>("export-settings");
const importButton = mustGet<HTMLButtonElement>("import-settings");
const resetButton = mustGet<HTMLButtonElement>("reset-settings");
const importFileInput = mustGet<HTMLInputElement>("import-file");
const sensitivitySelect = mustGet<HTMLSelectElement>("sensitivity");
const nextProtectionElement = mustGet<HTMLElement>("next-protection");
const protectionEndsElement = mustGet<HTMLElement>("protection-ends");
const scheduleStartInput = mustGet<HTMLInputElement>("schedule-start");
const scheduleEndInput = mustGet<HTMLInputElement>("schedule-end");
const timeControls = mustGet<HTMLElement>("time-controls");
const scheduleCards = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-schedule-mode]"));
const dayButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-schedule-day]"));

void initialise();

async function initialise(): Promise<void> {
  settings = await getSettings();
  customTermsTextArea.value = settings.customTerms.join("\n");
  renderSportsGroups();
  renderSupportedSites();
  renderSchedule();
  updateTextCounts();
  sensitivitySelect.value = settings.catchUpMode.sensitivity;

  saveTopButton.addEventListener("click", () => {
    void saveNow();
  });

  expandAllButton.addEventListener("click", () => {
    allExpanded = !allExpanded;
    renderSportsGroups();
  });

  customTermsTextArea.addEventListener("input", () => {
    updateTextCounts();
    queueSave();
  });

  for (const card of scheduleCards) {
    card.addEventListener("click", () => {
      const mode = card.dataset.scheduleMode as ProtectionScheduleMode;
      updateSchedule(scheduleForMode(mode, currentSchedule()));
    });
  }

  for (const button of dayButtons) {
    button.addEventListener("click", () => {
      const day = Number(button.dataset.scheduleDay);
      const schedule = scheduleForMode("custom", currentSchedule());
      schedule.days = toggleDay(schedule.days, day);
      updateSchedule(schedule);
    });
  }

  scheduleStartInput.addEventListener("change", updateScheduleTimes);
  scheduleEndInput.addEventListener("change", updateScheduleTimes);

  sensitivitySelect.addEventListener("change", () => {
    settings = {
      ...settings,
      catchUpMode: {
        ...settings.catchUpMode,
        sensitivity: sensitivitySelect.value as Sensitivity
      }
    };
    queueSave();
  });

  exportButton.addEventListener("click", exportSettings);
  importButton.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", () => {
    void importSettings();
  });
  resetButton.addEventListener("click", () => {
    void resetSettings();
  });
}

function renderSportsGroups(): void {
  sportsGroupsElement.innerHTML = "";
  expandAllButton.textContent = allExpanded ? "Collapse all" : "Expand all";

  for (const group of getRulePackGroups()) {
    sportsGroupsElement.appendChild(renderGroup(group));
  }
}

function renderGroup(group: RulePackGroup): HTMLElement {
  const metadata = groupMetadata[group.id] ?? {
    description: `${group.label} spoilers and results.`,
    icon: "topics-to-protect"
  };
  const selectedCount = group.packs.filter(pack => settings.enabledPacks.includes(pack.id)).length;
  const expanded = allExpanded || selectedCount > 0;

  const card = document.createElement("article");
  card.className = "topic-card";
  card.classList.toggle("expanded", expanded);

  const header = document.createElement("button");
  header.type = "button";
  header.className = "topic-card-header";
  header.setAttribute("aria-expanded", String(expanded));

  const icon = createIcon("section-icon purple", metadata.icon);

  const copy = document.createElement("span");
  copy.className = "topic-card-copy";
  const title = document.createElement("span");
  title.className = "topic-title";
  title.textContent = group.label;
  const description = document.createElement("p");
  description.className = "topic-description";
  description.textContent = metadata.description;
  copy.append(title);

  const count = document.createElement("span");
  count.className = "count-pill";
  count.dataset.groupCount = group.id;
  count.textContent = formatGroupCount(selectedCount, group.packs.length);

  const chevron = createIcon("chevron-icon", expanded ? "collapse-section" : "open-section");

  const meta = document.createElement("span");
  meta.className = "topic-meta-row";
  meta.append(description, count);

  header.append(icon, copy, chevron, meta);

  const list = document.createElement("div");
  list.className = "sports-pack-list";
  list.hidden = !expanded;

  header.addEventListener("click", () => {
    card.classList.toggle("expanded");
    const isExpanded = card.classList.contains("expanded");
    header.setAttribute("aria-expanded", String(isExpanded));
    setIcon(chevron, isExpanded ? "collapse-section" : "open-section");
    list.hidden = !isExpanded;
  });

  for (const pack of group.packs) {
    const label = document.createElement("label");
    label.className = "sports-pack";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = pack.id;
    checkbox.checked = settings.enabledPacks.includes(pack.id);
    checkbox.dataset.packId = pack.id;
    checkbox.dataset.groupId = group.id;
    checkbox.addEventListener("change", () => {
      updatePackSelection(pack.id, checkbox.checked);
      refreshGroupCount(group.id);
      queueSave();
    });

    const text = document.createElement("span");
    text.textContent = pack.label;

    const small = document.createElement("small");
    small.textContent = pack.description ?? "";

    label.append(checkbox, text, small);
    list.appendChild(label);
  }

  card.append(header, list);
  return card;
}

function updatePackSelection(packId: string, checked: boolean): void {
  settings = {
    ...settings,
    enabledPacks: checked
      ? Array.from(new Set([...settings.enabledPacks, packId]))
      : settings.enabledPacks.filter(id => id !== packId)
  };
}

function refreshGroupCount(groupId: string): void {
  const group = getRulePackGroups().find(value => value.id === groupId);
  const count = sportsGroupsElement.querySelector<HTMLElement>(`[data-group-count="${groupId}"]`);
  if (!group || !count) return;

  const selectedCount = group.packs.filter(pack => settings.enabledPacks.includes(pack.id)).length;
  count.textContent = formatGroupCount(selectedCount, group.packs.length);
}

function updateTextCounts(): void {
  customTermsCount.textContent = formatCount(lines(customTermsTextArea.value).length, "terms");
  trustedSitesCount.textContent = `${disabledSupportedSites().length} disabled`;
}

function renderSupportedSites(): void {
  supportedSitesElement.innerHTML = "";

  for (const site of supportedSites) {
    const label = document.createElement("label");
    label.className = "site-toggle-card";

    const copy = document.createElement("span");
    copy.className = "site-toggle-copy";

    const title = document.createElement("strong");
    title.textContent = site.label;

    const description = document.createElement("span");
    description.textContent = site.description;

    const domains = document.createElement("small");
    domains.textContent = site.domains.join(", ");

    copy.append(title, description, domains);

    const control = document.createElement("span");
    control.className = "toggle-control";

    const text = document.createElement("span");
    text.textContent = "Filter";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isSiteFilteringEnabled(site.domains);
    checkbox.addEventListener("change", () => {
      setSiteFiltering(site.domains, checkbox.checked);
      updateTextCounts();
      queueSave();
    });

    control.append(text, checkbox);
    label.append(copy, control);
    supportedSitesElement.appendChild(label);
  }

  updateTextCounts();
}

function isSiteFilteringEnabled(domains: string[]): boolean {
  const disabled = new Set(settings.trustedSites.map(site => site.toLowerCase()));
  return domains.every(domain => !disabled.has(domain.toLowerCase()));
}

function setSiteFiltering(domains: string[], enabled: boolean): void {
  const domainSet = new Set(domains.map(domain => domain.toLowerCase()));
  const existing = settings.trustedSites.filter(site => !domainSet.has(site.toLowerCase()));

  settings = {
    ...settings,
    trustedSites: enabled ? existing : [...existing, ...domains]
  };
}

function disabledSupportedSites(): typeof supportedSites {
  return supportedSites.filter(site => !isSiteFilteringEnabled(site.domains));
}

function renderSchedule(): void {
  const schedule = currentSchedule();
  const nextWindow = getNextProtectionWindow(settings);

  for (const card of scheduleCards) {
    const mode = card.dataset.scheduleMode as ProtectionScheduleMode;
    const selected = schedule.mode === mode;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-checked", String(selected));

    const copy = card.querySelector<HTMLElement>(".schedule-copy span:last-child");
    if (copy && selected) {
      copy.textContent = describeSchedule(schedule);
    }
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
    nextProtectionElement.textContent = formatScheduleDateTime(nextWindow.start);
    protectionEndsElement.textContent = formatScheduleDateTime(nextWindow.end);
  } else if (schedule.mode === "always") {
    nextProtectionElement.textContent = "Active now";
    protectionEndsElement.textContent = "When paused";
  } else {
    nextProtectionElement.textContent = "Not scheduled";
    protectionEndsElement.textContent = "Not scheduled";
  }
}

function currentSchedule(): ProtectionSchedule {
  return cloneSchedule(settings.catchUpMode.schedule ?? defaultSchedule);
}

function updateSchedule(schedule: ProtectionSchedule): void {
  settings = {
    ...settings,
    catchUpMode: {
      ...settings.catchUpMode,
      enabled: schedule.mode !== "paused",
      expiresAtUtc: undefined,
      schedule
    }
  };

  renderSchedule();
  queueSave();
}

function updateScheduleTimes(): void {
  const schedule = scheduleForMode(currentSchedule().mode, currentSchedule());
  schedule.startTime = scheduleStartInput.value || "00:00";
  schedule.endTime = scheduleEndInput.value || "23:59";
  updateSchedule(schedule);
}

function toggleDay(days: number[], day: number): number[] {
  const next = days.includes(day)
    ? days.filter(value => value !== day)
    : [...days, day];

  return next.length > 0 ? next : [day];
}

function queueSave(): void {
  saveTopStatus.textContent = "Saving...";
  saveTopStatus.classList.remove("saved");

  if (saveTimeout !== undefined) {
    window.clearTimeout(saveTimeout);
  }

  saveTimeout = window.setTimeout(() => {
    void saveNow();
  }, 500);
}

async function saveNow(): Promise<void> {
  if (saveTimeout !== undefined) {
    window.clearTimeout(saveTimeout);
    saveTimeout = undefined;
  }

  const next: Settings = {
    ...settings,
    customTerms: lines(customTermsTextArea.value),
    trustedSites: normaliseTrustedSites(settings.trustedSites)
  };

  await saveSettings(next);
  await syncExpiryAlarm(next);
  settings = next;
  renderSchedule();
  await notifyTabs();
  showSavedMessage();
}

function showSavedMessage(): void {
  if (savedMessageTimeout !== undefined) {
    window.clearTimeout(savedMessageTimeout);
  }

  saveTopStatus.textContent = "Saved.";
  saveTopStatus.classList.add("saved");

  savedMessageTimeout = window.setTimeout(() => {
    saveTopStatus.textContent = "Changes are saved automatically";
    saveTopStatus.classList.remove("saved");
    savedMessageTimeout = undefined;
  }, 2000);
}

function exportSettings(): void {
  const blob = new Blob([JSON.stringify(currentDraftSettings(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `despoilerize-settings-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importSettings(): Promise<void> {
  const [file] = Array.from(importFileInput.files ?? []);
  importFileInput.value = "";
  if (!file) return;

  const parsed = JSON.parse(await file.text()) as Partial<Settings>;
  settings = {
    ...defaultSettings,
    ...parsed,
    catchUpMode: {
      ...defaultSettings.catchUpMode,
      ...(parsed.catchUpMode ?? {})
    },
    enabledPacks: parsed.enabledPacks ?? defaultSettings.enabledPacks,
    customTerms: parsed.customTerms ?? defaultSettings.customTerms,
    trustedSites: parsed.trustedSites ?? defaultSettings.trustedSites
  };

  customTermsTextArea.value = settings.customTerms.join("\n");
  renderSportsGroups();
  renderSupportedSites();
  renderSchedule();
  updateTextCounts();
  sensitivitySelect.value = settings.catchUpMode.sensitivity;
  await saveNow();
}

async function resetSettings(): Promise<void> {
  if (!window.confirm("Reset DeSpoilerize settings to defaults?")) return;

  settings = structuredClone(defaultSettings);
  customTermsTextArea.value = settings.customTerms.join("\n");
  renderSportsGroups();
  renderSupportedSites();
  renderSchedule();
  updateTextCounts();
  sensitivitySelect.value = settings.catchUpMode.sensitivity;
  await saveNow();
}

function currentDraftSettings(): Settings {
  return {
    ...settings,
    catchUpMode: {
      ...settings.catchUpMode,
      sensitivity: sensitivitySelect.value as Sensitivity
    },
    customTerms: lines(customTermsTextArea.value),
    trustedSites: normaliseTrustedSites(settings.trustedSites)
  };
}

async function notifyTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(
    tabs
      .filter(tab => tab.id)
      .map(tab => chrome.tabs.sendMessage(tab.id!, { type: "DESPOILERZE_SETTINGS_CHANGED" }))
  );
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);
}

function formatCount(count: number, noun: string): string {
  const singular = noun.endsWith("s") ? noun.slice(0, -1) : noun;
  return `${count} ${count === 1 ? singular : noun}`;
}

function formatGroupCount(selected: number, total: number): string {
  return `${selected} of ${total} selected`;
}

function normaliseTrustedSites(sites: string[]): string[] {
  return Array.from(new Set(
    sites
      .map(site => site.trim().toLowerCase())
      .filter(Boolean)
  ));
}

function createIcon(className: string, name: string): HTMLSpanElement {
  const wrapper = document.createElement("span");
  wrapper.className = className;
  wrapper.setAttribute("aria-hidden", "true");
  setIcon(wrapper, name);
  return wrapper;
}

function setIcon(wrapper: HTMLElement, name: string): void {
  let image = wrapper.querySelector("img");
  if (!image) {
    image = document.createElement("img");
    image.alt = "";
    wrapper.appendChild(image);
  }

  image.src = `${settingsIconRoot}/${name}.svg`;
}

function mustGet<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing expected element #${id}`);
  }
  return element as T;
}
