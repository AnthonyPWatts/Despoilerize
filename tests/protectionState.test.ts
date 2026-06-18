import { describe, expect, it } from "vitest";
import { getProtectionState, isTrustedHostname } from "../src/shared/protectionState";
import type { Settings } from "../src/shared/types";

function settings(enabled = true, trustedSites: string[] = []): Settings {
  return {
    catchUpMode: {
      enabled,
      sensitivity: "balanced"
    },
    enabledPacks: ["f1"],
    customTerms: [],
    trustedSites
  };
}

describe("protection state", () => {
  it("uses the disabled icon state when Catch-up Mode is off", () => {
    expect(getProtectionState(settings(false), "www.bbc.co.uk")).toBe("disabled");
  });

  it("uses the enabled icon state when Catch-up Mode protects the page", () => {
    expect(getProtectionState(settings(true), "www.bbc.co.uk")).toBe("enabled");
  });

  it("uses the paused icon state for trusted sites", () => {
    expect(getProtectionState(settings(true, ["f1tv.formula1.com"]), "f1tv.formula1.com")).toBe("paused");
  });
});

describe("trusted hostnames", () => {
  it("matches exact trusted hostnames", () => {
    expect(isTrustedHostname(settings(true, ["example.com"]), "example.com")).toBe(true);
  });

  it("matches subdomains of trusted hostnames", () => {
    expect(isTrustedHostname(settings(true, ["example.com"]), "www.example.com")).toBe(true);
  });

  it("does not match sibling domains", () => {
    expect(isTrustedHostname(settings(true, ["example.com"]), "notexample.com")).toBe(false);
  });
});
