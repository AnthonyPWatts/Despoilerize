import { chromium, expect } from "@playwright/test";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const extensionPath = join(root, "dist");
const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
const builtManifest = JSON.parse(await readFile(join(extensionPath, "manifest.json"), "utf8"));
if (builtManifest.version !== manifest.version) throw new Error("Rebuild dist before capturing screenshots.");
const releaseVersion = manifest.version.match(/^\d+\.\d+/)?.[0];
if (!releaseVersion) throw new Error(`Invalid version: ${manifest.version}`);
const outputDir = join(root, "Releases", `v${releaseVersion}`, "screenshots", "live");
const detailsDir = join(outputDir, "details");
const settingsKey = "despoilerze.settings";
const youtubeUrl = "https://www.youtube.com/results?search_query=formula+1+2024+race+highlights&sp=EgIQAQ%253D%253D";
const bigBrotherUrl = "https://www.youtube.com/results?search_query=Big+Brother+2026+Ep.11+Ep.12&sp=EgIQAQ%253D%253D";

// Always create a new profile. Never reuse a personal browser's cookies or history.
const userDataDir = await mkdtemp(join(tmpdir(), "despoilerize-public-screenshots-"));
await mkdir(detailsDir, { recursive: true });
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
  ignoreDefaultArgs: ["--enable-automation"],
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
});

try {
  const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
  const extensionId = new URL(worker.url()).hostname;
  const setup = await context.newPage();
  await setup.goto(`chrome-extension://${extensionId}/assets/storage.js`);
  await setup.waitForFunction(async key => !!(await chrome.storage.sync.get(key))[key], settingsKey);
  const settings = {
    catchUpMode: {
      enabled: true,
      schedule: { mode: "weekend", days: [6, 0], startTime: "00:00", endTime: "23:59" },
      override: { state: "off" },
      sensitivity: "lockdown"
    },
    enabledPacks: ["f1"], customTerms: [], trustedSites: []
  };
  await saveSettings(setup, settings);
  const page = await context.newPage();
  await page.goto(youtubeUrl, { waitUntil: "domcontentloaded" });
  const cards = page.locator("ytd-video-renderer");
  await cards.first().waitFor();
  // YouTube's consent control currently has text but no accessible button role.
  const rejectCookies = page.getByText("Reject all", { exact: true });
  try {
    await rejectCookies.waitFor({ state: "visible", timeout: 8000 });
  } catch (error) {
    if (error.name !== "TimeoutError") throw error;
  }
  if (await rejectCookies.isVisible()) {
    await rejectCookies.click();
    await expect(rejectCookies).toBeHidden();
  }
  await expect(page.getByText("Before you continue to YouTube", { exact: true })).toBeHidden();
  await expect(page.locator("#masthead").getByText("Sign in", { exact: true })).toBeVisible();
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll("ytd-video-renderer")].slice(0, 3);
    return cards.length === 3 && cards.every(card => [...card.querySelectorAll("img")].some(image => image.complete && image.naturalWidth > 100));
  });
  const visibleTitles = (await cards.locator("#video-title").allTextContents()).slice(0, 3).map(text => text.trim());
  await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(0);
  await capture(page, "01-youtube-protection-off.png");

  settings.catchUpMode.override = { state: "on" };
  await saveSettings(setup, settings);
  await expect(cards.nth(0)).toHaveAttribute("data-despoilerze-hidden", "true");
  await expect(cards.nth(1)).toHaveAttribute("data-despoilerze-hidden", "true");
  await capture(page, "02-youtube-protection-on.png");

  // The toolbar popup is a real browser target, not a recreation over the page.
  await page.bringToFront();
  await setup.evaluate(async () => chrome.action.openPopup());
  const cdp = await context.newCDPSession(setup);
  await expect.poll(async () => (await cdp.send("Target.getTargets")).targetInfos.some(target => target.url.endsWith("/src/popup/index.html"))).toBe(true);
  const popupTarget = (await cdp.send("Target.getTargets")).targetInfos.find(target => target.url.endsWith("/src/popup/index.html"));
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: popupTarget.targetId, flatten: false });
  const popup = targetCommands(cdp, sessionId);
  await expect.poll(async () => (await popup("Runtime.evaluate", { expression: "document.querySelector('#status-text')?.textContent", returnByValue: true })).result.value).toBe("Protection: ON");
  await capturePopup(popup, "protection-popup.png");
  await popup("Runtime.evaluate", { expression: "document.querySelector('#caught-up').click()" });
  await expect.poll(async () => (await popup("Runtime.evaluate", { expression: "document.querySelector('#status-text')?.textContent", returnByValue: true })).result.value).toBe("Protection: OFF");
  await capturePopup(popup, "caught-up-popup.png");
  await cdp.send("Target.closeTarget", { targetId: popupTarget.targetId });
  await cdp.detach();

  await saveSettings(setup, settings);
  await expect(cards.nth(0)).toHaveAttribute("data-despoilerze-hidden", "true");
  await page.getByRole("button", { name: "Reveal once", exact: true }).first().click();
  await expect(cards.nth(0)).not.toHaveAttribute("data-despoilerze-hidden", "true");
  await expect(cards.nth(1)).toHaveAttribute("data-despoilerze-hidden", "true");
  await expect(page.locator("#masthead").getByText("Sign in", { exact: true })).toBeVisible();
  await capture(page, "03-youtube-reveal-once.png");

  delete settings.catchUpMode.override;
  await saveSettings(setup, settings);
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/src/options/index.html`);
  await expect(options.getByRole("radio", { name: /Every weekend/ })).toHaveAttribute("aria-checked", "true");
  await capture(options, "04-protection-schedule.png");
  await options.locator("#topics-title").evaluate(element => element.closest("section").scrollIntoView({ block: "start" }));
  await capture(options, "05-protected-topics.png");
  await options.getByRole("button", { name: /Entertainment/ }).click();
  const traitorsPack = options.locator("input[data-pack-id='the-traitors']");
  await traitorsPack.check();
  await expect(options.locator("#autosave-status")).toHaveText("Saved.");
  await options.locator(".topic-card").filter({ has: traitorsPack }).screenshot({ path: join(detailsDir, "traitors-pack.png"), animations: "disabled" });

  await traitorsPack.uncheck();
  const bigBrotherPack = options.locator("input[data-pack-id='big-brother']");
  await bigBrotherPack.check();
  await expect(options.locator("#autosave-status")).toHaveText("Saved.");
  await options.locator(".topic-card").filter({ has: bigBrotherPack }).screenshot({ path: join(detailsDir, "big-brother-pack.png"), animations: "disabled" });

  settings.enabledPacks = ["big-brother"];
  settings.catchUpMode.override = { state: "off" };
  await saveSettings(setup, settings);
  await page.bringToFront();
  await page.goto(bigBrotherUrl, { waitUntil: "domcontentloaded" });
  await cards.first().waitFor();
  await expect(page.getByText("Before you continue to YouTube", { exact: true })).toBeHidden();
  await expect(page.locator("#masthead").getByText("Sign in", { exact: true })).toBeVisible();
  const latestCard = cards.filter({ has: page.locator("#video-title[href*='kfwKvIHhE7w']") });
  const watchedCard = cards.filter({ has: page.locator("#video-title[href*='onvI3kDcpww']") });
  await expect(latestCard).toHaveCount(1);
  await expect(watchedCard).toHaveCount(1);
  await expect(latestCard.locator("#video-title")).toContainText("Big Brother 2026 Ep.12");
  await expect(watchedCard.locator("#video-title")).toContainText("Big Brother 2026 Ep.11");
  for (const card of [latestCard, watchedCard]) {
    await expect(card.locator("#channel-name").first()).toContainText("ITV Reality");
  }
  // Fail if ranking changes move either official clip out of the scene.
  // Never rearrange results to manufacture a comparison.
  const latestIndex = await latestCard.evaluate(element => [...document.querySelectorAll("ytd-video-renderer")].indexOf(element));
  const watchedIndex = await watchedCard.evaluate(element => [...document.querySelectorAll("ytd-video-renderer")].indexOf(element));
  expect([latestIndex, watchedIndex].sort()).toEqual([0, 1]);
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll("ytd-video-renderer")].slice(0, 3);
    return cards.length === 3 && cards.every(card => [...card.querySelectorAll("img")].some(image => image.complete && image.naturalWidth > 100));
  });
  const bigBrotherTitles = (await cards.locator("#video-title").allTextContents()).slice(0, 3).map(text => text.trim());
  await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(0);
  await capture(page, "06-big-brother-protection-off.png");

  settings.catchUpMode.override = { state: "on" };
  await saveSettings(setup, settings);
  for (const card of [latestCard, watchedCard, cards.nth(2)]) {
    await expect(card).toHaveAttribute("data-despoilerze-hidden", "true");
  }
  await capture(page, "07-big-brother-protection-on.png");

  const targetId = await watchedCard.getAttribute("data-despoilerze-target-id");
  await page.locator(`.despoilerze-overlay[data-despoilerze-target-id='${targetId}']`).getByRole("button", { name: "Reveal once", exact: true }).click();
  await expect(watchedCard).not.toHaveAttribute("data-despoilerze-hidden", "true");
  await expect(latestCard).toHaveAttribute("data-despoilerze-hidden", "true");
  await expect(cards.nth(2)).toHaveAttribute("data-despoilerze-hidden", "true");
  await capture(page, "08-big-brother-reveal-once.png");

  const provenance = {
    capturedAtUtc: new Date().toISOString(), extensionVersion: manifest.version,
    browser: `Chrome for Testing ${context.browser()?.version() ?? ""}`.trim(),
    viewport: { width: 1280, height: 800 }, sourceUrl: youtubeUrl, signedOut: true,
    profile: "New temporary profile; no personal cookies, history or extensions reused",
    protection: "Formula 1 pack, Lockdown sensitivity", visibleTitles,
    bigBrother: {
      sourceUrl: bigBrotherUrl, protection: "Big Brother pack only, Lockdown sensitivity",
      visibleTitles: bigBrotherTitles, latestResultIndex: latestIndex, revealedResultIndex: watchedIndex,
      revealedExample: "ITV Reality episode 11 deliberately revealed by the viewer; episode 12 remains protected. Both from the 2026 UK series. No automatic episode or upload-date filtering.",
      verified: ["Thumbnails loaded", "Sign in visible", "Both clips from ITV Reality and the same 2026 series", "Protection off", "First three cards protected", "Reveal once restores episode 11 and leaves episode 12 and the third card protected"]
    },
    processing: "Direct browser page and toolbar-popup captures. No replacement thumbnails, text, blur, browser frame or compositing.",
    verified: ["Thumbnails loaded", "Sign in visible", "Protection off", "Protection on", "Reveal once leaves the next card protected", "I'm caught up ends the session", "The Traitors and Big Brother packs can be selected and saved"]
  };
  await writeFile(join(outputDir, "capture.json"), `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(`Captured 8 page images, 2 actual popup details and 2 Entertainment settings details in ${outputDir}`);
  console.log(JSON.stringify(provenance, null, 2));
} finally {
  await context.close();
  // Leave this disposable profile in the OS temporary directory for normal cleanup.
}

async function saveSettings(page, settings) {
  await page.evaluate(async ({ key, settings }) => {
    await chrome.storage.sync.set({ [key]: settings });
    const tabs = await chrome.tabs.query({});
    await Promise.allSettled(tabs.filter(tab => tab.id).map(tab => chrome.tabs.sendMessage(tab.id, { type: "DESPOILERZE_SETTINGS_CHANGED" })));
  }, { key: settingsKey, settings });
}

async function capture(page, filename) {
  await page.screenshot({ path: join(outputDir, filename), animations: "disabled" });
}

async function capturePopup(command, filename) {
  const result = await command("Page.captureScreenshot", { format: "png" });
  await writeFile(join(detailsDir, filename), Buffer.from(result.data, "base64"));
}

function targetCommands(cdp, sessionId) {
  let nextId = 0;
  return (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => finish(new Error(`Popup command timed out: ${method}`)), 10000);
    const listener = event => {
      if (event.sessionId !== sessionId) return;
      const message = JSON.parse(event.message);
      if (message.id !== id) return;
      finish(message.error ? new Error(message.error.message) : null, message.result);
    };
    function finish(error, result) {
      clearTimeout(timeout);
      cdp.off("Target.receivedMessageFromTarget", listener);
      if (error) reject(error); else resolve(result);
    }
    cdp.on("Target.receivedMessageFromTarget", listener);
    cdp.send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id, method, params }) }).catch(error => finish(error));
  });
}
