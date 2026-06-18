import { isCatchUpModeActive } from "./expiry";
import type { Settings } from "./types";

export type ProtectionState = "enabled" | "disabled" | "paused";

export function getProtectionState(settings: Settings, hostname?: string): ProtectionState {
  if (!isCatchUpModeActive(settings)) return "disabled";
  if (hostname && isTrustedHostname(settings, hostname)) return "paused";
  return "enabled";
}

export function isTrustedHostname(settings: Settings, hostname: string): boolean {
  const normalisedHostname = hostname.toLowerCase();
  return settings.trustedSites.some(site => {
    const normalisedSite = site.toLowerCase();
    return normalisedHostname === normalisedSite || normalisedHostname.endsWith(`.${normalisedSite}`);
  });
}
