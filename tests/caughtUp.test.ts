import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../src/shared/defaultSettings";
import {
  clearExpiredProtectionOverride,
  endProtectionSession,
  EXPIRY_ALARM_NAME,
  getActiveProtectionOverride,
  isCatchUpModeActive,
  syncExpiryAlarm
} from "../src/shared/expiry";
import { schedulePresets } from "../src/shared/schedulePresets";
import type { ProtectionScheduleMode, Settings } from "../src/shared/types";

function settings(mode: ProtectionScheduleMode = "weekend"): Settings {
  const value = structuredClone(defaultSettings);
  value.catchUpMode.schedule = structuredClone(schedulePresets[mode]);
  return value;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ending a protection session", () => {
  it.each([20, 21])("ends the whole weekend on June %i and resumes next Saturday", day => {
    const value = settings();
    const original = structuredClone(value);
    endProtectionSession(value, new Date(2026, 5, day, 15));

    expect(value.catchUpMode.override?.reason).toBe("caught-up");
    expect(value.catchUpMode.override?.untilUtc).toBe(new Date(2026, 5, 27).toISOString());
    expect(value.catchUpMode.schedule).toEqual(original.catchUpMode.schedule);
    expect(value.catchUpMode.enabled).toBe(true);
    expect(isCatchUpModeActive(value, new Date(2026, 5, day, 15))).toBe(false);
    expect(isCatchUpModeActive(value, new Date(2026, 5, 21, 23, 59, 59, 999))).toBe(false);
    expect(isCatchUpModeActive(value, new Date(2026, 5, 26, 23, 59, 59, 999))).toBe(false);
    expect(isCatchUpModeActive(value, new Date(2026, 5, 27))).toBe(true);
    expect(getActiveProtectionOverride(value, new Date(2026, 5, 27))).toBeUndefined();
    expect(clearExpiredProtectionOverride(value, new Date(2026, 5, 27))).toBe(true);
  });

  it("preserves the ended session through storage and a later restart", () => {
    const value = settings();
    endProtectionSession(value, new Date(2026, 5, 20, 15));
    const restored = JSON.parse(JSON.stringify(value)) as Settings;

    expect(isCatchUpModeActive(restored, new Date(2026, 5, 21, 12))).toBe(false);
    expect(isCatchUpModeActive(restored, new Date(2026, 6, 4, 12))).toBe(true);
  });

  it("resumes an all-day daily schedule exactly at midnight", () => {
    const value = settings("daily");
    endProtectionSession(value, new Date(2026, 5, 20, 15));

    expect(value.catchUpMode.override?.untilUtc).toBe(new Date(2026, 5, 21).toISOString());
    expect(isCatchUpModeActive(value, new Date(2026, 5, 20, 23, 59, 59, 999))).toBe(false);
    expect(isCatchUpModeActive(value, new Date(2026, 5, 21))).toBe(true);
  });

  it("ends an overnight custom session and resumes on the next selected evening", () => {
    const value = settings("custom");
    value.catchUpMode.schedule = { mode: "custom", days: [5, 0], startTime: "22:00", endTime: "06:00" };
    const now = new Date(2026, 5, 20, 1);
    expect(isCatchUpModeActive(value, now)).toBe(true);
    endProtectionSession(value, now);

    expect(value.catchUpMode.override?.untilUtc).toBe(new Date(2026, 5, 21, 22).toISOString());
    expect(isCatchUpModeActive(value, new Date(2026, 5, 20, 5))).toBe(false);
    expect(isCatchUpModeActive(value, new Date(2026, 5, 21, 22))).toBe(true);
  });

  it("ends a Protect now override outside the schedule without skipping its next session", () => {
    const value = settings();
    value.catchUpMode.override = { state: "on" };
    endProtectionSession(value, new Date(2026, 5, 18, 15));

    expect(value.catchUpMode.override?.untilUtc).toBe(new Date(2026, 5, 20).toISOString());
    expect(isCatchUpModeActive(value, new Date(2026, 5, 18, 15))).toBe(false);
    expect(isCatchUpModeActive(value, new Date(2026, 5, 20))).toBe(true);
  });

  it("does nothing when there is no active session", () => {
    const value = settings();
    const original = structuredClone(value);
    endProtectionSession(value, new Date(2026, 5, 18, 15));
    expect(value).toEqual(original);
  });

  it("keeps always-on protection off until deliberately restored", () => {
    const value = settings("always");
    endProtectionSession(value, new Date(2026, 5, 20, 15));

    expect(value.catchUpMode.override?.untilUtc).toBeUndefined();
    expect(isCatchUpModeActive(value, new Date(2026, 5, 27))).toBe(false);
    delete value.catchUpMode.override;
    expect(isCatchUpModeActive(value, new Date(2026, 5, 27))).toBe(true);
  });

  it("ends legacy manual protection without inventing a schedule", () => {
    const value = settings();
    delete value.catchUpMode.schedule;
    endProtectionSession(value, new Date(2026, 5, 20, 15));

    expect(value.catchUpMode.override?.untilUtc).toBeUndefined();
    expect(value.catchUpMode.schedule).toBeUndefined();
    expect(isCatchUpModeActive(value, new Date(2026, 5, 27))).toBe(false);
  });

  it("preserves a temporary pause if there is no active session to end", () => {
    const value = settings();
    value.catchUpMode.override = { state: "off" };
    endProtectionSession(value, new Date(2026, 5, 20, 15));
    expect(value.catchUpMode.override).toEqual({ state: "off" });
  });

  it("sets the browser alarm for the next session start", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 20, 15));
    const clear = vi.fn().mockResolvedValue(true);
    const create = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", { alarms: { clear, create } });
    const value = settings();
    endProtectionSession(value);
    await syncExpiryAlarm(value);

    expect(create).toHaveBeenLastCalledWith(EXPIRY_ALARM_NAME, { when: new Date(2026, 5, 27).getTime() });

    vi.setSystemTime(new Date(2026, 5, 27));
    clearExpiredProtectionOverride(value);
    await syncExpiryAlarm(value);
    expect(isCatchUpModeActive(value)).toBe(true);
    expect(create).toHaveBeenLastCalledWith(EXPIRY_ALARM_NAME, { when: new Date(2026, 5, 28, 23, 59, 59, 999).getTime() });
  });
});
