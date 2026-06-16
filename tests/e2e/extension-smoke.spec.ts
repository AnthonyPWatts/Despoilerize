import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Settings } from "../../src/shared/types";

const extensionPath = resolve("dist");
const settingsKey = "despoilerze.settings";

type ExtensionHarness = {
  context: BrowserContext;
  extensionId: string;
  extensionPage: Page;
};

type PlaywrightApi = {
  chromium: {
    launchPersistentContext: typeof chromium.launchPersistentContext;
  };
};

test("sets the existing protect-until presets from the popup", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const harness = await launchExtension(playwright);

  try {
    const popup = await harness.context.newPage();
    await popup.goto(extensionUrl(harness.extensionId, "src/popup/index.html"));

    await popup.getByRole("button", { name: "Tonight" }).click();
    await expect(popup.locator("#status")).toHaveText("Catch-up Mode: ON");
    await expect(popup.locator("#expiry")).toHaveText("Expires tonight at 23:59");

    const tonightSettings = await readSettings(harness.extensionPage);
    const tonightDate = new Date(tonightSettings.catchUpMode.expiresAtUtc as string);
    expect(tonightDate.getHours()).toBe(23);
    expect(tonightDate.getMinutes()).toBe(59);

    await popup.getByRole("button", { name: "Manual" }).click();
    await expect(popup.locator("#expiry")).toHaveText("");

    const manualSettings = await readSettings(harness.extensionPage);
    expect(manualSettings.catchUpMode.enabled).toBe(true);
    expect(manualSettings.catchUpMode.expiresAtUtc).toBeUndefined();
  } finally {
    await harness.context.close();
  }
});

test("saves pack, custom term, and trusted site changes from options", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const harness = await launchExtension(playwright);

  try {
    const options = await harness.context.newPage();
    await options.goto(extensionUrl(harness.extensionId, "src/options/index.html"));

    const realityTvCheckbox = options.locator("input[data-pack-id='reality-tv']");
    await expect(realityTvCheckbox).toBeVisible();
    await realityTvCheckbox.check();

    await options.locator("#custom-terms").fill("The Traitors\nLove Island final");
    await options.locator("#trusted-sites").fill("example.com\nf1tv.formula1.com");
    await options.getByRole("button", { name: "Save settings" }).first().click();
    await expect(options.locator("#save-top-status")).toHaveText("Saved.");

    const saved = await readSettings(harness.extensionPage);
    expect(saved.enabledPacks).toContain("f1");
    expect(saved.enabledPacks).toContain("reality-tv");
    expect(saved.customTerms).toEqual(["The Traitors", "Love Island final"]);
    expect(saved.trustedSites).toEqual(["example.com", "f1tv.formula1.com"]);
  } finally {
    await harness.context.close();
  }
});

test("content script hides, reveals, and responds to settings changes", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const harness = await launchExtension(playwright);

  try {
    await writeSettings(harness.extensionPage, {
      catchUpMode: {
        enabled: true,
        expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
        sensitivity: "balanced"
      },
      enabledPacks: ["world-cup-2026"],
      customTerms: [],
      trustedSites: []
    });

    const page = await harness.context.newPage();
    await page.route("https://www.bbc.co.uk/sport", route => {
      route.fulfill({
        contentType: "text/html",
        body: bbcFixtureHtml()
      });
    });

    await page.goto("https://www.bbc.co.uk/sport", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(1);
    await expect(page.getByText("Possible spoiler hidden")).toBeVisible();

    await page.getByRole("button", { name: "Reveal once" }).click();
    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(0);

    await page.evaluate(() => {
      const fixture = document.createElement("article");
      fixture.id = "late-spoiler";
      fixture.className = "promo";
      fixture.style.width = "520px";
      fixture.style.minHeight = "96px";
      fixture.innerHTML = "<h2>Brazil top Group C with win over Morocco</h2>";
      document.body.appendChild(fixture);
    });
    await sendSettingsChanged(harness.extensionPage, "https://www.bbc.co.uk/*");

    await expect(page.locator("#late-spoiler[data-despoilerze-hidden='true']")).toHaveCount(1);

    const popup = await harness.context.newPage();
    await popup.goto(extensionUrl(harness.extensionId, "src/popup/index.html"));
    await expect(popup.locator("#status")).toHaveText("Catch-up Mode: ON");

    await page.bringToFront();
    await popup.evaluate(() => {
      document.getElementById("reveal-all")?.click();
    });

    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(0);

    await writeSettings(harness.extensionPage, {
      catchUpMode: {
        enabled: false,
        sensitivity: "balanced"
      },
      enabledPacks: ["world-cup-2026"],
      customTerms: [],
      trustedSites: []
    });
    await sendSettingsChanged(harness.extensionPage, "https://www.bbc.co.uk/*");
    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(0);
  } finally {
    await harness.context.close();
  }
});

async function launchExtension(playwright: PlaywrightApi): Promise<ExtensionHarness> {
  const userDataDir = await mkdtemp(join(tmpdir(), "despoilerize-e2e-"));
  const context = await playwright.chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const extensionId = await getExtensionId(context);
  const extensionPage = await context.newPage();
  await extensionPage.goto(extensionUrl(extensionId, "assets/storage.js"));

  return {
    context,
    extensionId,
    extensionPage
  };
}

async function getExtensionId(context: BrowserContext): Promise<string> {
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

function extensionUrl(extensionId: string, path: string): string {
  return `chrome-extension://${extensionId}/${path}`;
}

async function readSettings(extensionPage: ExtensionHarness["extensionPage"]): Promise<Settings> {
  return extensionPage.evaluate(async key => {
    const result = await chrome.storage.sync.get(key);
    return result[key] as Settings;
  }, settingsKey);
}

async function writeSettings(extensionPage: ExtensionHarness["extensionPage"], settings: Settings): Promise<void> {
  await extensionPage.evaluate(
    async ({ key, value }) => chrome.storage.sync.set({ [key]: value }),
    { key: settingsKey, value: settings }
  );
}

async function sendSettingsChanged(extensionPage: ExtensionHarness["extensionPage"], url: string): Promise<void> {
  await extensionPage.evaluate(async targetUrl => {
    const [tab] = await chrome.tabs.query({ url: targetUrl });
    if (!tab?.id) throw new Error(`Could not find tab for ${targetUrl}`);
    await chrome.tabs.sendMessage(tab.id, { type: "DESPOILERZE_SETTINGS_CHANGED" });
  }, url);
}

function bbcFixtureHtml(): string {
  return `<!doctype html>
    <html>
      <head>
        <title>BBC Sport fixture</title>
        <style>
          article { display: block; width: 520px; min-height: 96px; margin: 16px; }
        </style>
      </head>
      <body>
        <main>
          <article class="promo" id="spoiler-card">
            <h2>England through after dramatic stoppage-time winner</h2>
            <p>Reaction and analysis from the World Cup group stage.</p>
          </article>
          <article class="promo" id="safe-card">
            <h2>England World Cup fixture preview and team news</h2>
            <p>Everything to know before kick-off.</p>
          </article>
        </main>
      </body>
    </html>`;
}
