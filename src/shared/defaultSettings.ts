import type { Settings } from "./types";
import { defaultSchedule } from "./schedulePresets";

export const defaultSettings: Settings = {
  catchUpMode: {
    enabled: true,
    schedule: defaultSchedule,
    sensitivity: "lockdown"
  },
  enabledPacks: ["f1"],
  customTerms: [],
  trustedSites: []
};
