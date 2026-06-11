import { getSettings, isCatchUpModeActive, saveSettings } from "../shared/storage";
import { EXPIRY_ALARM_NAME, syncExpiryAlarm } from "../shared/expiry";

chrome.runtime.onInstalled.addListener(async () => {
  await reconcileExpiryState();
});

chrome.runtime.onStartup?.addListener(async () => {
  await reconcileExpiryState();
});

chrome.alarms?.onAlarm.addListener(async alarm => {
  if (alarm.name !== EXPIRY_ALARM_NAME) return;

  await reconcileExpiryState();
});

async function reconcileExpiryState(): Promise<void> {
  const settings = await getSettings();

  if (!isCatchUpModeActive(settings) && settings.catchUpMode.enabled) {
    settings.catchUpMode.enabled = false;
    settings.catchUpMode.expiresAtUtc = undefined;
    await saveSettings(settings);
    await syncExpiryAlarm(settings);
    await notifyTabs();
    return;
  }

  await saveSettings(settings);
  await syncExpiryAlarm(settings);
}

export async function notifyTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    chrome.tabs.sendMessage(tab.id, { type: "DESPOILERZE_SETTINGS_CHANGED" }).catch(() => {
      // Content script may not be available on internal/browser pages.
    });
  }
}
