import type { ProtectionSchedule, ProtectionScheduleMode } from "./types";

export const defaultSchedule: ProtectionSchedule = {
  mode: "weekend",
  days: [6, 0],
  startTime: "00:00",
  endTime: "23:59"
};

export const schedulePresets: Record<ProtectionScheduleMode, ProtectionSchedule> = {
  weekend: defaultSchedule,
  daily: {
    mode: "daily",
    days: [0, 1, 2, 3, 4, 5, 6],
    startTime: "00:00",
    endTime: "23:59"
  },
  custom: {
    mode: "custom",
    days: [6, 0],
    startTime: "00:00",
    endTime: "23:59"
  },
  always: {
    mode: "always",
    days: [],
    startTime: "00:00",
    endTime: "23:59"
  },
  paused: {
    mode: "paused",
    days: [],
    startTime: "00:00",
    endTime: "23:59"
  }
};

export function cloneSchedule(schedule: ProtectionSchedule): ProtectionSchedule {
  return {
    ...schedule,
    days: [...schedule.days]
  };
}

export function scheduleForMode(
  mode: ProtectionScheduleMode,
  current: ProtectionSchedule
): ProtectionSchedule {
  const preset = cloneSchedule(schedulePresets[mode]);

  if (mode === "daily" || mode === "custom") {
    preset.startTime = current.startTime;
    preset.endTime = current.endTime;
  }

  if (mode === "custom" && current.days.length > 0) {
    preset.days = [...current.days];
  }

  return preset;
}
