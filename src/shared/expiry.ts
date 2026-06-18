import type { ProtectionOverride, Settings } from "./types";
import { getNextProtectionTransition, isScheduledProtectionActive } from "./schedule";

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
  const override = getActiveProtectionOverride(settings, now);
  if (override) return override.state === "on";

  if (settings.catchUpMode.schedule) {
    return isScheduledProtectionActive(settings, now);
  }

  if (!settings.catchUpMode.enabled) return false;

  const expiresAt = getValidExpiryDate(settings.catchUpMode.expiresAtUtc);
  if (!expiresAt) return !settings.catchUpMode.expiresAtUtc;

  return expiresAt > now;
}

export function getActiveProtectionOverride(settings: Settings, now = new Date()): ProtectionOverride | undefined {
  const override = settings.catchUpMode.override;
  if (!override) return undefined;

  if (!override.untilUtc) return override;

  const until = getValidExpiryDate(override.untilUtc);
  if (!until || until <= now) return undefined;

  return override;
}

export function getProtectionOverrideTransition(settings: Settings, now = new Date()): Date | null {
  const override = getActiveProtectionOverride(settings, now);
  if (!override?.untilUtc) return null;

  return getValidExpiryDate(override.untilUtc);
}

export function clearExpiredProtectionOverride(settings: Settings, now = new Date()): boolean {
  if (!settings.catchUpMode.override?.untilUtc) return false;
  if (getActiveProtectionOverride(settings, now)) return false;

  delete settings.catchUpMode.override;
  return true;
}

export function formatExpiryLabel(expiresAtUtc?: string, now = new Date()): string {
  const expiresAt = getValidExpiryDate(expiresAtUtc);
  if (!expiresAt) return "";

  const time = formatTime(expiresAt);

  if (isSameLocalDate(expiresAt, now)) {
    return isEndOfLocalDay(expiresAt)
      ? `Expires tonight at ${time}`
      : `Expires today at ${time}`;
  }

  if (isSameLocalDate(expiresAt, addLocalDays(now, 1))) {
    return `Expires tomorrow at ${time}`;
  }

  return `Expires ${formatDate(expiresAt, now)} at ${time}`;
}

export async function syncExpiryAlarm(settings: Settings): Promise<void> {
  if (!chrome.alarms) return;

  await chrome.alarms.clear(EXPIRY_ALARM_NAME);

  const overrideTransition = getProtectionOverrideTransition(settings);
  if (overrideTransition && overrideTransition > new Date()) {
    await chrome.alarms.create(EXPIRY_ALARM_NAME, { when: overrideTransition.getTime() });
    return;
  }

  if (settings.catchUpMode.schedule) {
    const nextTransition = getNextProtectionTransition(settings);
    if (nextTransition && nextTransition > new Date()) {
      await chrome.alarms.create(EXPIRY_ALARM_NAME, { when: nextTransition.getTime() });
    }
    return;
  }

  if (!settings.catchUpMode.enabled) return;

  const expiresAt = getValidExpiryDate(settings.catchUpMode.expiresAtUtc);
  if (!expiresAt || expiresAt <= new Date()) return;

  await chrome.alarms.create(EXPIRY_ALARM_NAME, { when: expiresAt.getTime() });
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(date: Date, now: Date): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const year = date.getFullYear() === now.getFullYear() ? "" : ` ${date.getFullYear()}`;

  return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}${year}`;
}

function isSameLocalDate(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isEndOfLocalDay(date: Date): boolean {
  return date.getHours() === 23 && date.getMinutes() === 59;
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
