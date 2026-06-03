import type { Settings } from "../shared/types";
import { getSettings, saveSettings } from "../shared/storage";

let settings: Settings;

const customTermsTextArea = mustGet<HTMLTextAreaElement>("custom-terms");
const trustedSitesTextArea = mustGet<HTMLTextAreaElement>("trusted-sites");
const saveButton = mustGet<HTMLButtonElement>("save");
const savedMessage = mustGet<HTMLElement>("saved-message");

void initialise();

async function initialise(): Promise<void> {
  settings = await getSettings();

  customTermsTextArea.value = settings.customTerms.join("\n");
  trustedSitesTextArea.value = settings.trustedSites.join("\n");

  saveButton.addEventListener("click", () => {
    void save();
  });
}

async function save(): Promise<void> {
  const next: Settings = {
    ...settings,
    customTerms: lines(customTermsTextArea.value),
    trustedSites: lines(trustedSitesTextArea.value)
  };

  await saveSettings(next);
  settings = next;

  savedMessage.textContent = "Saved.";
  window.setTimeout(() => {
    savedMessage.textContent = "";
  }, 1800);
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
