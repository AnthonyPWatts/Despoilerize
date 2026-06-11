import type { Settings } from "./types";

export const EXPIRY_ALARM_NAME = "despoilerze-expiry-check";

export function addHours(hours: number, now = new Date()): string {
  const date = new Date(now);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

export function endOfToday(now = new Date()): string {
  const date = new Date(now);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function getValidExpiryDate(expiresAtUtc?: string): Date | null {
  if (!expiresAtUtc) return null;

  const expiresAt = new Date(expiresAtUtc);
  if (Number.isNaN(expiresAt.getTime())) return null;

  return expiresAt;
}

export function isCatchUpModeActive(settings: Settings, now = new Date()): boolean {
  if (!settings.catchUpMode.enabled) return false;

  const expiresAt = getValidExpiryDate(settings.catchUpMode.expiresAtUtc);
  if (!expiresAt) return !settings.catchUpMode.expiresAtUtc;

  return expiresAt > now;
}

export async function syncExpiryAlarm(settings: Settings): Promise<void> {
  if (!chrome.alarms) return;

  await chrome.alarms.clear(EXPIRY_ALARM_NAME);

  if (!settings.catchUpMode.enabled) return;

  const expiresAt = getValidExpiryDate(settings.catchUpMode.expiresAtUtc);
  if (!expiresAt || expiresAt <= new Date()) return;

  await chrome.alarms.create(EXPIRY_ALARM_NAME, { when: expiresAt.getTime() });
}
