import { expect, test } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const extensionPath = resolve("dist");

test("hides and reveals a spoiler card when catch-up mode expires", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");
  test.fixme(true, "The extension loads in Playwright, but content scripts are not injected into host pages yet.");

  const userDataDir = await mkdtemp(join(tmpdir(), "despoilerize-e2e-"));
  const context = await playwright.chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    const extensionId = await getExtensionId(context);
    const settingsUrl = `chrome-extension://${extensionId}/assets/storage.js`;

    const extensionPage = await context.newPage();
    await extensionPage.goto(settingsUrl);
    await extensionPage.evaluate(() => {
      return chrome.storage.sync.set({
        "despoilerze.settings": {
          catchUpMode: {
            enabled: true,
            expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
            sensitivity: "balanced"
          },
          enabledPacks: ["football"],
          customTerms: [],
          trustedSites: []
        }
      });
    });

    const page = await context.newPage();
    await page.goto("https://www.bbc.co.uk/sport", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const fixture = document.createElement("article");
      fixture.style.width = "480px";
      fixture.style.minHeight = "80px";
      fixture.innerHTML = "<h2>World Cup: England beat Brazil after late winner</h2>";
      document.body.appendChild(fixture);
    });
    await extensionPage.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ url: "https://www.bbc.co.uk/*" });
      if (!tab?.id) throw new Error("Could not find fixture tab.");
      await chrome.tabs.sendMessage(tab.id, { type: "DESPOILERZE_SETTINGS_CHANGED" });
    });
    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(1);

    await extensionPage.evaluate(() => {
      return chrome.storage.sync.set({
        "despoilerze.settings": {
          catchUpMode: {
            enabled: false,
            sensitivity: "balanced"
          },
          enabledPacks: ["football"],
          customTerms: [],
          trustedSites: []
        }
      });
    });

    await extensionPage.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ url: "https://www.bbc.co.uk/*" });
      if (!tab?.id) throw new Error("Could not find fixture tab.");
      await chrome.tabs.sendMessage(tab.id, { type: "DESPOILERZE_SETTINGS_CHANGED" });
    });

    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("sets the existing protect-until presets from the popup", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const userDataDir = await mkdtemp(join(tmpdir(), "despoilerize-e2e-"));
  const context = await playwright.chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    const extensionId = await getExtensionId(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    await popup.getByRole("button", { name: "Tonight" }).click();
    await expect(popup.locator("#status")).toHaveText("Catch-up Mode: ON");
    await expect(popup.locator("#expiry")).toHaveText("Expires tonight at 23:59");

    const tonightExpiry = await popup.evaluate(async () => {
      const result = await chrome.storage.sync.get("despoilerze.settings");
      return result["despoilerze.settings"].catchUpMode.expiresAtUtc as string;
    });
    const tonightDate = new Date(tonightExpiry);
    expect(tonightDate.getHours()).toBe(23);
    expect(tonightDate.getMinutes()).toBe(59);

    await popup.getByRole("button", { name: "Manual" }).click();
    await expect(popup.locator("#expiry")).toHaveText("");

    const manualSettings = await popup.evaluate(async () => {
      const result = await chrome.storage.sync.get("despoilerze.settings");
      return result["despoilerze.settings"].catchUpMode;
    });
    expect(manualSettings.enabled).toBe(true);
    expect(manualSettings.expiresAtUtc).toBeUndefined();
  } finally {
    await context.close();
  }
});

async function getExtensionId(context: Awaited<ReturnType<typeof import("@playwright/test").chromium.launchPersistentContext>>): Promise<string> {
  let [serviceWorker] = context.serviceWorkers();

  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  const extensionUrl = serviceWorker.url();
  const [, extensionId] = extensionUrl.match(/^chrome-extension:\/\/([^/]+)/) ?? [];

  if (!extensionId) {
    throw new Error(`Could not determine extension ID from ${extensionUrl}`);
  }

  return extensionId;
}
