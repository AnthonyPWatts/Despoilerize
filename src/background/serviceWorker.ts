import type { ProtectionState } from "../shared/protectionState";
import type { Settings } from "../shared/types";
import { getProtectionState } from "../shared/protectionState";
import { getSettings, isCatchUpModeActive, saveSettings, SETTINGS_KEY } from "../shared/storage";
import { clearExpiredProtectionOverride, EXPIRY_ALARM_NAME, syncExpiryAlarm } from "../shared/expiry";

const actionIconPaths: Record<ProtectionState, Record<number, string>> = {
  enabled: {
    16: "public/enabled-16.png",
    48: "public/enabled-48.png",
    128: "public/enabled-128.png"
  },
  disabled: {
    16: "public/disabled-16.png",
    48: "public/disabled-48.png",
    128: "public/disabled-128.png"
  },
  paused: {
    16: "public/paused-16.png",
    48: "public/paused-48.png",
    128: "public/paused-128.png"
  }
};

const actionIconData = new Map<ProtectionState, Promise<Record<number, ImageData>>>();

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

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes[SETTINGS_KEY]) return;

  void refreshActionState();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "DESPOILERZE_PAGE_STATE_CHANGED") return;
  const tabId = sender.tab?.id;
  if (!tabId || !isProtectionState(message.state)) {
    sendResponse({ ok: false });
    return;
  }

  void (async () => {
    await setActionIcon(message.state, tabId);
    sendResponse({ ok: true });
  })().catch(error => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
  });

  return true;
});

async function reconcileExpiryState(): Promise<void> {
  const settings = await getSettings();
  const removedExpiredOverride = clearExpiredProtectionOverride(settings);

  if (!settings.catchUpMode.schedule && !isCatchUpModeActive(settings) && settings.catchUpMode.enabled) {
    settings.catchUpMode.enabled = false;
    settings.catchUpMode.expiresAtUtc = undefined;
    await saveSettings(settings);
    await syncExpiryAlarm(settings);
    await refreshActionState(settings);
    await notifyTabs();
    return;
  }

  if (removedExpiredOverride) {
    await saveSettings(settings);
    await syncExpiryAlarm(settings);
    await refreshActionState(settings);
    await notifyTabs();
    return;
  }

  await saveSettings(settings);
  await syncExpiryAlarm(settings);
  await refreshActionState(settings);
}

async function refreshActionState(settings?: Settings): Promise<void> {
  const currentSettings = settings ?? await getSettings();
  await setActionIcon(getProtectionState(currentSettings));
  await notifyTabs();
}

async function setActionIcon(state: ProtectionState, tabId?: number): Promise<void> {
  const details = tabId
    ? { imageData: await getActionIconData(state), tabId }
    : { imageData: await getActionIconData(state) };

  await chrome.action.setIcon(details);
}

function getActionIconData(state: ProtectionState): Promise<Record<number, ImageData>> {
  const cached = actionIconData.get(state);
  if (cached) return cached;

  const loading = loadActionIconData(state);
  actionIconData.set(state, loading);
  return loading;
}

async function loadActionIconData(state: ProtectionState): Promise<Record<number, ImageData>> {
  const entries = await Promise.all(
    Object.entries(actionIconPaths[state]).map(async ([size, path]) => [
      Number(size),
      await loadImageData(path)
    ] as const)
  );

  return Object.fromEntries(entries) as Record<number, ImageData>;
}

async function loadImageData(path: string): Promise<ImageData> {
  const response = await fetch(chrome.runtime.getURL(path));
  if (!response.ok) {
    throw new Error(`Failed to load action icon ${path}: ${response.status}`);
  }

  const bitmap = await createImageBitmap(await response.blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(`Could not create canvas context for action icon ${path}`);
  }

  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

function isProtectionState(value: unknown): value is ProtectionState {
  return value === "enabled" || value === "disabled" || value === "paused";
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
