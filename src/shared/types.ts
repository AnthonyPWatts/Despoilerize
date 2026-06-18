export type Sensitivity = "gentle" | "balanced" | "lockdown";

export type ProtectionScheduleMode = "weekend" | "daily" | "custom" | "always" | "paused";

export type ProtectionSchedule = {
  mode: ProtectionScheduleMode;
  days: number[];
  startTime: string;
  endTime: string;
};

export type CatchUpMode = {
  enabled: boolean;
  expiresAtUtc?: string;
  schedule?: ProtectionSchedule;
  sensitivity: Sensitivity;
};

export type Settings = {
  catchUpMode: CatchUpMode;
  enabledPacks: string[];
  customTerms: string[];
  trustedSites: string[];
};

export type RulePack = {
  id: string;
  label: string;
  group: string;
  description?: string;
  entities: string[];
  spoilerTerms: string[];
  safeTerms: string[];
  regexes: string[];
};

export type RulePackGroup = {
  id: string;
  label: string;
  packs: RulePack[];
};

export type RiskResult = {
  shouldHide: boolean;
  score: number;
  packIds: string[];
  reasons: string[];
  sensitivity: Sensitivity;
};
