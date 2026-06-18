import { defaultSettings } from "./defaultSettings";
import type { Settings } from "./types";
export { isCatchUpModeActive } from "./expiry";

export const SETTINGS_KEY = "despoilerze.settings";

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  const saved = result[SETTINGS_KEY] as Partial<Settings> | undefined;
  const savedCatchUpMode = saved?.catchUpMode;
  const hasSavedSchedule = !!savedCatchUpMode && "schedule" in savedCatchUpMode;
  const catchUpMode = {
    ...defaultSettings.catchUpMode,
    ...(savedCatchUpMode ?? {})
  };

  if (savedCatchUpMode && !hasSavedSchedule) {
    catchUpMode.schedule = undefined;
  }

  return {
    ...defaultSettings,
    ...saved,
    catchUpMode,
    enabledPacks: saved?.enabledPacks ?? defaultSettings.enabledPacks,
    customTerms: saved?.customTerms ?? defaultSettings.customTerms,
    trustedSites: saved?.trustedSites ?? defaultSettings.trustedSites
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}
