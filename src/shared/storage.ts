import { defaultSettings } from "./defaultSettings";
import type { Settings } from "./types";

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

export function isCatchUpModeActive(settings: Settings, now = new Date()): boolean {
  if (!settings.catchUpMode.enabled) return false;
  if (!settings.catchUpMode.expiresAtUtc) return true;

  const expiresAt = new Date(settings.catchUpMode.expiresAtUtc);
  return expiresAt > now;
}
