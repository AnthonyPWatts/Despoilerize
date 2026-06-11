import { defaultSettings } from "./defaultSettings";
import type { Settings } from "./types";
export { isCatchUpModeActive } from "./expiry";

const SETTINGS_KEY = "despoilerze.settings";

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  const saved = result[SETTINGS_KEY] as Partial<Settings> | undefined;

  return {
    ...defaultSettings,
    ...saved,
    catchUpMode: {
      ...defaultSettings.catchUpMode,
      ...(saved?.catchUpMode ?? {})
    },
    enabledPacks: saved?.enabledPacks ?? defaultSettings.enabledPacks,
    customTerms: saved?.customTerms ?? defaultSettings.customTerms,
    trustedSites: saved?.trustedSites ?? defaultSettings.trustedSites
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}
