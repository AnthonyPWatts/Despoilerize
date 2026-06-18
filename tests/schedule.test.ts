import { describe, expect, it } from "vitest";
import {
  describeSchedule,
  formatScheduleDateTime,
  getNextProtectionTransition,
  getNextProtectionWindow,
  isScheduledProtectionActive
} from "../src/shared/schedule";
import type { ProtectionSchedule, Settings } from "../src/shared/types";

function settings(schedule: ProtectionSchedule): Settings {
  return {
    catchUpMode: {
      enabled: true,
      schedule,
      sensitivity: "balanced"
    },
    enabledPacks: [],
    customTerms: [],
    trustedSites: []
  };
}

describe("protection schedules", () => {
  const weekend: ProtectionSchedule = {
    mode: "weekend",
    days: [6, 0],
    startTime: "00:00",
    endTime: "23:59"
  };

  it("keeps weekend protection inactive during the working week", () => {
    expect(isScheduledProtectionActive(settings(weekend), new Date(2026, 5, 18, 12, 0))).toBe(false);
  });

  it("activates weekend protection on Saturday and Sunday", () => {
    expect(isScheduledProtectionActive(settings(weekend), new Date(2026, 5, 20, 12, 0))).toBe(true);
    expect(isScheduledProtectionActive(settings(weekend), new Date(2026, 5, 21, 12, 0))).toBe(true);
  });

  it("finds the next weekend protection window", () => {
    const window = getNextProtectionWindow(settings(weekend), new Date(2026, 5, 18, 12, 0));

    expect(window?.start).toEqual(new Date(2026, 5, 20, 0, 0, 0, 0));
    expect(window?.end).toEqual(new Date(2026, 5, 21, 23, 59, 59, 999));
  });

  it("uses the current window end as the next active transition", () => {
    expect(getNextProtectionTransition(settings(weekend), new Date(2026, 5, 20, 12, 0)))
      .toEqual(new Date(2026, 5, 21, 23, 59, 59, 999));
  });

  it("supports always-on and paused schedules", () => {
    expect(isScheduledProtectionActive(settings({
      mode: "always",
      days: [],
      startTime: "00:00",
      endTime: "23:59"
    }))).toBe(true);

    expect(isScheduledProtectionActive(settings({
      mode: "paused",
      days: [],
      startTime: "00:00",
      endTime: "23:59"
    }))).toBe(false);
  });

  it("describes schedules for the popup", () => {
    expect(describeSchedule(weekend)).toBe("All day Saturday -> Sunday");
    expect(formatScheduleDateTime(new Date(2026, 5, 20, 0, 0), new Date(2026, 5, 18, 12, 0)))
      .toBe("This Saturday at 00:00");
  });
});
