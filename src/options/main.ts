import type { Settings } from "../shared/types";
import { getRulePackGroups } from "../rules";
import { getSettings, saveSettings } from "../shared/storage";

let settings: Settings;

const sportsGroupsElement = mustGet<HTMLElement>("sports-groups");
const customTermsTextArea = mustGet<HTMLTextAreaElement>("custom-terms");
const trustedSitesTextArea = mustGet<HTMLTextAreaElement>("trusted-sites");
const saveTopButton = mustGet<HTMLButtonElement>("save-top");
const saveBottomButton = mustGet<HTMLButtonElement>("save-bottom");
const saveTopStatus = mustGet<HTMLElement>("save-top-status");
const saveBottomStatus = mustGet<HTMLElement>("save-bottom-status");
const saveButtons = [saveTopButton, saveBottomButton];
const saveStatuses = [saveTopStatus, saveBottomStatus];
const saveButtonText = "Save settings";
const savedButtonText = "Saved";
let savedMessageTimeout: number | undefined;

void initialise();

async function initialise(): Promise<void> {
  settings = await getSettings();

  renderSportsGroups(settings.enabledPacks);
  customTermsTextArea.value = settings.customTerms.join("\n");
  trustedSitesTextArea.value = settings.trustedSites.join("\n");

  for (const saveButton of saveButtons) {
    saveButton.addEventListener("click", () => {
      void save();
    });
  }
}

function renderSportsGroups(enabledPackIds: string[]): void {
  sportsGroupsElement.innerHTML = "";

  for (const group of getRulePackGroups()) {
    const section = document.createElement("section");
    section.className = "sports-group";
    section.setAttribute("aria-labelledby", `group-${group.id}`);

    const heading = document.createElement("h3");
    heading.id = `group-${group.id}`;
    heading.textContent = group.label;
    section.appendChild(heading);

    const actions = document.createElement("div");
    actions.className = "group-actions";

    const selectAll = document.createElement("button");
    selectAll.type = "button";
    selectAll.textContent = "Select all";
    selectAll.addEventListener("click", () => setGroupChecked(group.packs.map(pack => pack.id), true));

    const selectNone = document.createElement("button");
    selectNone.type = "button";
    selectNone.textContent = "Clear";
    selectNone.addEventListener("click", () => setGroupChecked(group.packs.map(pack => pack.id), false));

    actions.append(selectAll, selectNone);
    section.appendChild(actions);

    const list = document.createElement("div");
    list.className = "sports-pack-list";

    for (const pack of group.packs) {
      const label = document.createElement("label");
      label.className = "sports-pack";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = pack.id;
      checkbox.checked = enabledPackIds.includes(pack.id);
      checkbox.dataset.packId = pack.id;

      const text = document.createElement("span");
      text.textContent = pack.label;

      const description = document.createElement("small");
      description.textContent = pack.description ?? "";

      label.append(checkbox, text, description);
      list.appendChild(label);
    }

    section.appendChild(list);
    sportsGroupsElement.appendChild(section);
  }
}

function setGroupChecked(packIds: string[], checked: boolean): void {
  for (const packId of packIds) {
    const checkbox = sportsGroupsElement.querySelector<HTMLInputElement>(`input[data-pack-id="${packId}"]`);
    if (checkbox) {
      checkbox.checked = checked;
    }
  }
}

async function save(): Promise<void> {
  const selectedPacks = Array.from(
    sportsGroupsElement.querySelectorAll<HTMLInputElement>("input[data-pack-id]:checked")
  ).map(checkbox => checkbox.value);

  const next: Settings = {
    ...settings,
    enabledPacks: selectedPacks,
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

  for (const saveButton of saveButtons) {
    saveButton.textContent = savedButtonText;
  }

  for (const saveStatus of saveStatuses) {
    saveStatus.textContent = "Saved.";
  }

  savedMessageTimeout = window.setTimeout(() => {
    for (const saveButton of saveButtons) {
      saveButton.textContent = saveButtonText;
    }

    for (const saveStatus of saveStatuses) {
      saveStatus.textContent = "";
    }

    savedMessageTimeout = undefined;
  }, 2000);
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

function mustGet<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing expected element #${id}`);
  }
  return element as T;
}
