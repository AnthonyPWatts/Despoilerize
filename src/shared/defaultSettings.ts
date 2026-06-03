import type { Settings } from "./types";

export const defaultSettings: Settings = {
  catchUpMode: {
    enabled: false,
    sensitivity: "lockdown"
  },
  enabledPacks: ["f1"],
  customTerms: [],
  trustedSites: []
};
