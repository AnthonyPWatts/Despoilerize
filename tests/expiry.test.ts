import { describe, expect, it, vi } from "vitest";
import { addHours, endOfToday, isCatchUpModeActive, syncExpiryAlarm } from "../src/shared/expiry";
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
});
