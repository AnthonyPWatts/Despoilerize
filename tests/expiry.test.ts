import { describe, expect, it, vi } from "vitest";
import { addHours, endOfToday, formatExpiryLabel, isCatchUpModeActive, syncExpiryAlarm } from "../src/shared/expiry";
import type { Settings } from "../src/shared/types";

function settings(expiresAtUtc?: string, enabled = true): Settings {
  return {
    catchUpMode: {
      enabled,
      expiresAtUtc,
      sensitivity: "balanced"
    },
    enabledPacks: [],
    customTerms: [],
    trustedSites: []
  };
}

describe("catch-up mode expiry", () => {
  const now = new Date("2026-06-11T12:00:00.000Z");

  it("keeps manual catch-up mode active without an expiry", () => {
    expect(isCatchUpModeActive(settings(undefined), now)).toBe(true);
  });

  it("keeps catch-up mode active before its expiry", () => {
    expect(isCatchUpModeActive(settings("2026-06-11T13:00:00.000Z"), now)).toBe(true);
  });

  it("treats catch-up mode as inactive after its expiry", () => {
    expect(isCatchUpModeActive(settings("2026-06-11T11:59:59.999Z"), now)).toBe(false);
  });

  it("treats malformed expiry values as inactive", () => {
    expect(isCatchUpModeActive(settings("not a date"), now)).toBe(false);
  });

  it("does not activate catch-up mode when disabled", () => {
    expect(isCatchUpModeActive(settings(undefined, false), now)).toBe(false);
  });

  it("lets a protection override turn protection on temporarily", () => {
    const value = settings(undefined, false);
    value.catchUpMode.override = { state: "on" };

    expect(isCatchUpModeActive(value, now)).toBe(true);
  });

  it("lets a protection override pause protection temporarily", () => {
    const value = settings(undefined, true);
    value.catchUpMode.override = { state: "off" };

    expect(isCatchUpModeActive(value, now)).toBe(false);
  });

  it("ignores expired protection overrides", () => {
    const value = settings(undefined, false);
    value.catchUpMode.override = {
      state: "on",
      untilUtc: "2026-06-11T11:59:59.999Z"
    };

    expect(isCatchUpModeActive(value, now)).toBe(false);
  });

  it("calculates fixed hour presets from the current time", () => {
    expect(addHours(2, now)).toBe("2026-06-11T14:00:00.000Z");
    expect(addHours(24, now)).toBe("2026-06-12T12:00:00.000Z");
  });

  it("calculates tonight as the end of the local day", () => {
    const tonight = new Date(endOfToday(now));

    expect(tonight.getFullYear()).toBe(2026);
    expect(tonight.getMonth()).toBe(5);
    expect(tonight.getDate()).toBe(11);
    expect(tonight.getHours()).toBe(23);
    expect(tonight.getMinutes()).toBe(59);
  });
});

describe("expiry alarm scheduling", () => {
  it("schedules a future expiry alarm", async () => {
    const clear = vi.fn().mockResolvedValue(true);
    const create = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", { alarms: { clear, create } });

    await syncExpiryAlarm(settings("2999-06-11T13:00:00.000Z"));

    expect(clear).toHaveBeenCalledWith("despoilerze-expiry-check");
    expect(create).toHaveBeenCalledWith("despoilerze-expiry-check", {
      when: new Date("2999-06-11T13:00:00.000Z").getTime()
    });

    vi.unstubAllGlobals();
  });

  it("clears the expiry alarm when catch-up mode has no timed expiry", async () => {
    const clear = vi.fn().mockResolvedValue(true);
    const create = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", { alarms: { clear, create } });

    await syncExpiryAlarm(settings(undefined));

    expect(clear).toHaveBeenCalledWith("despoilerze-expiry-check");
    expect(create).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("schedules override expiry before schedule transitions", async () => {
    const clear = vi.fn().mockResolvedValue(true);
    const create = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("chrome", { alarms: { clear, create } });

    const value = settings(undefined);
    value.catchUpMode.override = {
      state: "off",
      untilUtc: "2999-06-11T13:00:00.000Z"
    };

    await syncExpiryAlarm(value);

    expect(clear).toHaveBeenCalledWith("despoilerze-expiry-check");
    expect(create).toHaveBeenCalledWith("despoilerze-expiry-check", {
      when: new Date("2999-06-11T13:00:00.000Z").getTime()
    });

    vi.unstubAllGlobals();
  });
});

describe("expiry display labels", () => {
  const now = new Date(2026, 5, 11, 12, 0, 0, 0);

  it("describes same-day expiries as today", () => {
    const expiry = new Date(2026, 5, 11, 14, 30, 0, 0).toISOString();

    expect(formatExpiryLabel(expiry, now)).toBe("Expires today at 14:30");
  });

  it("describes end-of-day expiries as tonight", () => {
    const expiry = new Date(2026, 5, 11, 23, 59, 59, 999).toISOString();

    expect(formatExpiryLabel(expiry, now)).toBe("Expires tonight at 23:59");
  });

  it("describes next-day expiries as tomorrow", () => {
    const expiry = new Date(2026, 5, 12, 12, 0, 0, 0).toISOString();

    expect(formatExpiryLabel(expiry, now)).toBe("Expires tomorrow at 12:00");
  });

  it("uses UK-style text dates for later expiries in the same year", () => {
    const expiry = new Date(2026, 5, 18, 9, 5, 0, 0).toISOString();

    expect(formatExpiryLabel(expiry, now)).toBe("Expires Thu 18 Jun at 09:05");
  });

  it("includes the year for expiries outside the current year", () => {
    const expiry = new Date(2027, 0, 2, 8, 15, 0, 0).toISOString();

    expect(formatExpiryLabel(expiry, now)).toBe("Expires Sat 2 Jan 2027 at 08:15");
  });

  it("returns an empty label without a valid expiry", () => {
    expect(formatExpiryLabel(undefined, now)).toBe("");
    expect(formatExpiryLabel("not a date", now)).toBe("");
  });
});
