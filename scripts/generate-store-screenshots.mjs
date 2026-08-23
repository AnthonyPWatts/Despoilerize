import { chromium } from "@playwright/test";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const extensionPath = join(root, "dist");
const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
const releaseVersion = manifest.version.match(/^\d+\.\d+/)?.[0];

if (!releaseVersion) {
  throw new Error(`Manifest version '${manifest.version}' is not a major.minor.patch version.`);
}

try {
  await readFile(join(extensionPath, "manifest.json"), "utf8");
} catch {
  throw new Error("The unpacked extension is missing. Run 'npm run build' before capturing screenshots.");
}

const viewport = { width: 1280, height: 800 };
const outputDir = join(root, "Releases", `v${releaseVersion}`, "screenshots");
const fixtureHtml = await readFile(
  join(root, "tests", "fixtures", "store", "capture-page.html"),
  "utf8"
);
const userDataDir = await mkdtemp(join(tmpdir(), "despoilerize-store-capture-"));

await mkdir(outputDir, { recursive: true });

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport,
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "reduce",
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`
  ]
});

try {
  const extensionId = await getExtensionId(context);
  const extensionPage = await context.newPage();
  await extensionPage.goto(extensionUrl(extensionId, "assets/storage.js"));
  await waitForInitialSettings(extensionPage);
  await writeCaptureSettings(extensionPage);

  await capturePopup(context, extensionId);
  await captureOptions(context, extensionId);
  await captureProtectedPage(context);

  console.log(`Captured 5 screenshots from the running extension in ${outputDir}`);
} finally {
  await context.close();
  await rm(userDataDir, { recursive: true, force: true });
}

async function capturePopup(browserContext, extensionId) {
  const page = await browserContext.newPage();
  await page.goto(extensionUrl(extensionId, "src/popup/index.html"));
  await page.locator("#status-text", { hasText: "Protection: ON" }).waitFor();

  // The popup DOM and styles are the built extension's own. This capture-only
  // layout centres it in the store viewport without imitating browser chrome.
  await page.addStyleTag({
    content: `
      html, body { width: 100%; height: 100%; }
      body {
        min-width: 0 !important;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at 50% 36%, rgba(141, 120, 255, 0.22), transparent 30%),
          #0d1016 !important;
      }
      .popup {
        zoom: 1.2;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 10px;
        box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);
      }
    `
  });

  await capture(page, "01-protection-popup.png");
  await page.close();
}

async function captureOptions(browserContext, extensionId) {
  const page = await browserContext.newPage();
  await page.goto(extensionUrl(extensionId, "src/options/index.html"));
  await page.locator("#autosave-status").waitFor();
  await page.addStyleTag({
    content: `
      html {
        scroll-behavior: auto !important;
        scrollbar-width: none;
      }
      html::-webkit-scrollbar { display: none; }
      body { zoom: 0.85; }
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
    `
  });

  const motorsport = page.locator(".topic-card-header", { hasText: "Motorsport" });
  await motorsport.evaluate(element => element.click());
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture(page, "02-settings-schedule-topics.png");

  const supportedSites = page.locator("#supported-sites");
  await supportedSites.evaluate(element => element.closest("section")?.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -24));
  await capture(page, "03-supported-sites-settings.png");
  await page.close();
}

async function captureProtectedPage(browserContext) {
  const page = await browserContext.newPage();
  const fixtureUrl = "https://www.bbc.co.uk/despoilerize-capture-fixture";

  await page.route(fixtureUrl, route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: fixtureHtml
  }));
  await page.goto(fixtureUrl, { waitUntil: "domcontentloaded" });
  await page.locator("#overview-card[data-despoilerze-hidden='true']").waitFor();
  await page.locator("#reveal-card[data-despoilerze-hidden='true']").waitFor();
  await page.getByRole("button", { name: "Reveal once" }).first().waitFor();
  await page.getByRole("button", { name: "Reveal all on page" }).first().waitFor();

  await page.evaluate(() => window.scrollTo(0, 0));
  await capture(page, "04-spoiler-hidden-on-page.png");

  await page.locator("#reveal-showcase").evaluate(element => element.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, -20));
  await capture(page, "05-reveal-controls.png");

  // Exercise the captured control so a successful command also proves that the
  // screenshot is backed by the extension's live reveal behaviour.
  await page.locator("#reveal-showcase [data-action='reveal-once']").click();
  await page.locator("#reveal-card[data-despoilerze-hidden='true']").waitFor({ state: "detached" });
  await page.close();
}

async function capture(page, filename) {
  await page.screenshot({
    path: join(outputDir, filename),
    type: "png",
    animations: "disabled"
  });
}

async function getExtensionId(browserContext) {
  let [serviceWorker] = browserContext.serviceWorkers();

  if (!serviceWorker) {
    serviceWorker = await browserContext.waitForEvent("serviceworker");
  }

  const [, extensionId] = serviceWorker.url().match(/^chrome-extension:\/\/([^/]+)/) ?? [];
  if (!extensionId) {
    throw new Error(`Could not determine extension ID from ${serviceWorker.url()}`);
  }

  return extensionId;
}

function extensionUrl(extensionId, path) {
  return `chrome-extension://${extensionId}/${path}`;
}

async function writeCaptureSettings(extensionPage) {
  const settings = {
    catchUpMode: {
      enabled: true,
      schedule: {
        mode: "always",
        days: [],
        startTime: "00:00",
        endTime: "23:59"
      },
      sensitivity: "balanced"
    },
    enabledPacks: ["f1"],
    customTerms: ["The Traitors", "Love Island final", "British Grand Prix"],
    trustedSites: ["www.theguardian.com"]
  };

  await extensionPage.evaluate(
    async ({ key, value }) => chrome.storage.sync.set({ [key]: value }),
    { key: "despoilerze.settings", value: settings }
  );

  await extensionPage.waitForFunction(async key => {
    const result = await chrome.storage.sync.get(key);
    return result[key]?.catchUpMode?.schedule?.mode === "always";
  }, "despoilerze.settings");
}

async function waitForInitialSettings(extensionPage) {
  await extensionPage.waitForFunction(async key => {
    const result = await chrome.storage.sync.get(key);
    return result[key]?.catchUpMode?.schedule?.mode === "weekend";
  }, "despoilerze.settings");
}
