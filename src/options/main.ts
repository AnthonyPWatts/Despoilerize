import type { RulePackGroup, Settings } from "../shared/types";
import { defaultSettings } from "../shared/defaultSettings";
import { getRulePackGroups } from "../rules";
import { getSettings, saveSettings } from "../shared/storage";

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
const trustedSitesTextArea = mustGet<HTMLTextAreaElement>("trusted-sites");
const customTermsCount = mustGet<HTMLElement>("custom-terms-count");
const trustedSitesCount = mustGet<HTMLElement>("trusted-sites-count");
const saveTopButton = mustGet<HTMLButtonElement>("save-top");
const saveTopStatus = mustGet<HTMLElement>("save-top-status");
const expandAllButton = mustGet<HTMLButtonElement>("expand-all");
const exportButton = mustGet<HTMLButtonElement>("export-settings");
const importButton = mustGet<HTMLButtonElement>("import-settings");
const resetButton = mustGet<HTMLButtonElement>("reset-settings");
const importFileInput = mustGet<HTMLInputElement>("import-file");

void initialise();

async function initialise(): Promise<void> {
  settings = await getSettings();
  customTermsTextArea.value = settings.customTerms.join("\n");
  trustedSitesTextArea.value = settings.trustedSites.join("\n");
  renderSportsGroups();
  updateTextCounts();

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

  trustedSitesTextArea.addEventListener("input", () => {
    updateTextCounts();
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
  const title = document.createElement("span");
  title.className = "topic-title";
  title.textContent = group.label;
  const description = document.createElement("p");
  description.textContent = metadata.description;
  copy.append(title, description);

  const count = document.createElement("span");
  count.className = "count-pill";
  count.dataset.groupCount = group.id;
  count.textContent = formatCount(selectedCount, "selected");

  const chevron = createIcon("chevron-icon", expanded ? "collapse-section" : "open-section");

  header.append(icon, copy, count, chevron);

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
  count.textContent = formatCount(selectedCount, "selected");
}

function updateTextCounts(): void {
  customTermsCount.textContent = formatCount(lines(customTermsTextArea.value).length, "terms");
  trustedSitesCount.textContent = formatCount(lines(trustedSitesTextArea.value).length, "sites");
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
    trustedSites: lines(trustedSitesTextArea.value)
  };

  await saveSettings(next);
  settings = next;
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
  trustedSitesTextArea.value = settings.trustedSites.join("\n");
  renderSportsGroups();
  updateTextCounts();
  await saveNow();
}

async function resetSettings(): Promise<void> {
  if (!window.confirm("Reset DeSpoilerize settings to defaults?")) return;

  settings = structuredClone(defaultSettings);
  customTermsTextArea.value = settings.customTerms.join("\n");
  trustedSitesTextArea.value = settings.trustedSites.join("\n");
  renderSportsGroups();
  updateTextCounts();
  await saveNow();
}

function currentDraftSettings(): Settings {
  return {
    ...settings,
    customTerms: lines(customTermsTextArea.value),
    trustedSites: lines(trustedSitesTextArea.value)
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
