import { getSettings, isCatchUpModeActive, saveSettings } from "../shared/storage";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
});

chrome.alarms?.onAlarm.addListener(async alarm => {
  if (alarm.name !== "despoilerze-expiry-check") return;

  const settings = await getSettings();
  if (!isCatchUpModeActive(settings) && settings.catchUpMode.enabled) {
    settings.catchUpMode.enabled = false;
    await saveSettings(settings);
    await notifyTabs();
  }
});

export async function notifyTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    chrome.tabs.sendMessage(tab.id, { type: "DESPOILERZE_SETTINGS_CHANGED" }).catch(() => {
      // Content script may not be available on internal/browser pages.
    });
  }
}
