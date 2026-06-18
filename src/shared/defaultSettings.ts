import type { Settings } from "./types";

export const defaultSettings: Settings = {
  catchUpMode: {
    enabled: true,
    schedule: {
      mode: "weekend",
      days: [6, 0],
      startTime: "00:00",
      endTime: "23:59"
    },
    sensitivity: "lockdown"
  },
  enabledPacks: ["f1"],
  customTerms: [],
  trustedSites: []
};
