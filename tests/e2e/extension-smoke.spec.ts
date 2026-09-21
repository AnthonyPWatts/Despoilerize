import { chromium, expect, test, type BrowserContext, type Page } from "@playwright/test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Settings } from "../../src/shared/types";

const extensionPath = resolve("dist");
const settingsKey = "despoilerze.settings";
const manifest = JSON.parse(await readFile("manifest.json", "utf8")) as { version: string };

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

test("sets protection schedules and sensitivity from options", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const harness = await launchExtension(playwright);

  try {
    const options = await harness.context.newPage();
    await options.goto(extensionUrl(harness.extensionId, "src/options/index.html"));

    await expect(options.getByRole("heading", { name: "DeSpoilerize Settings" })).toBeVisible();
    await expect(options.getByRole("radio", { name: /Every weekend/i })).toHaveAttribute("aria-checked", "true");

    await options.getByRole("radio", { name: /Always on/i }).click();
    await expect(options.locator("#autosave-status")).toHaveText("Saved.");

    const alwaysOnSettings = await readSettings(harness.extensionPage);
    expect(alwaysOnSettings.catchUpMode.schedule?.mode).toBe("always");

    const popup = await harness.context.newPage();
    await popup.goto(extensionUrl(harness.extensionId, "src/popup/index.html"));
    await expect(popup.getByRole("heading", { name: `DeSpoilerize v${manifest.version}` })).toBeVisible();
    await expect(popup.locator("#schedule-description")).toContainText("Always on");
    await expect(popup.locator("#status-text")).toHaveText("Protection: ON");

    await options.getByRole("radio", { name: /Paused/i }).click();
    await expect(options.locator("#autosave-status")).toHaveText("Saved.");
    await expect(popup.locator("#status-text")).toHaveText("Protection: OFF");

    const pausedSettings = await readSettings(harness.extensionPage);
    expect(pausedSettings.catchUpMode.schedule?.mode).toBe("paused");

    await options.locator("#sensitivity").selectOption("balanced");
    await expect(options.locator("#autosave-status")).toHaveText("Saved.");

    const sensitivitySettings = await readSettings(harness.extensionPage);
    expect(sensitivitySettings.catchUpMode.sensitivity).toBe("balanced");
  } finally {
    await harness.context.close();
  }
});

test("popup protects now without replacing the saved schedule", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const harness = await launchExtension(playwright);

  try {
    const inactiveDay = (new Date().getDay() + 1) % 7;
    await writeSettings(harness.extensionPage, {
      catchUpMode: {
        enabled: true,
        schedule: {
          mode: "custom",
          days: [inactiveDay],
          startTime: "00:00",
          endTime: "23:59"
        },
        sensitivity: "lockdown"
      },
      enabledPacks: ["f1"],
      customTerms: [],
      trustedSites: []
    });

    const popup = await harness.context.newPage();
    await popup.goto(extensionUrl(harness.extensionId, "src/popup/index.html"));
    await expect(popup.locator("#status-text")).toHaveText("Protection: OFF");

    await popup.getByRole("button", { name: "Protect now" }).click();
    await expect(popup.locator("#status-text")).toHaveText("Protection: ON");
    await expect(popup.getByRole("button", { name: "Return to schedule" })).toBeVisible();

    const overrideSettings = await readSettings(harness.extensionPage);
    expect(overrideSettings.catchUpMode.schedule?.mode).toBe("custom");
    expect(overrideSettings.catchUpMode.override?.state).toBe("on");

    await popup.getByRole("button", { name: "Return to schedule" }).click();
    await expect(popup.locator("#status-text")).toHaveText("Protection: OFF");

    const restoredSettings = await readSettings(harness.extensionPage);
    expect(restoredSettings.catchUpMode.schedule?.mode).toBe("custom");
    expect(restoredSettings.catchUpMode.override).toBeUndefined();
  } finally {
    await harness.context.close();
  }
});

test("auto-saves pack, custom term, and supported site filtering changes from options", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const harness = await launchExtension(playwright);

  try {
    const options = await harness.context.newPage();
    await options.goto(extensionUrl(harness.extensionId, "src/options/index.html"));

    await options.getByRole("button", { name: /Entertainment/ }).click();
    const realityTvCheckbox = options.locator("input[data-pack-id='reality-tv']");
    await expect(realityTvCheckbox).toBeVisible();
    await realityTvCheckbox.check();

    await options.locator("#custom-terms").fill("The Traitors\nLove Island final");
    await options.locator(".site-toggle-card", { hasText: "BBC" }).locator("input").uncheck();
    await expect(options.getByRole("button", { name: "Save settings" })).toHaveCount(0);
    await expect(options.locator("#autosave-status")).toHaveText("Saved.");

    const saved = await readSettings(harness.extensionPage);
    expect(saved.enabledPacks).toContain("f1");
    expect(saved.enabledPacks).toContain("reality-tv");
    expect(saved.customTerms).toEqual(["The Traitors", "Love Island final"]);
    expect(saved.trustedSites).toEqual(["www.bbc.co.uk", "www.bbc.com"]);
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
    await expect(popup.locator("#status")).toHaveText("Protection: ON");

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

test("content script runs on The Guardian and hides Guardian story cards", async ({ browserName, playwright }) => {
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
    await page.route("https://www.theguardian.com/football", route => {
      route.fulfill({
        contentType: "text/html",
        body: guardianFixtureHtml()
      });
    });

    await page.goto("https://www.theguardian.com/football", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#guardian-spoiler[data-despoilerze-hidden='true']")).toHaveCount(1);
    await expect(page.locator("#guardian-safe[data-despoilerze-hidden='true']")).toHaveCount(0);
    await expect(page.getByText("Possible spoiler hidden")).toBeVisible();
  } finally {
    await harness.context.close();
  }
});

test("content script hides YouTube F1 cards populated after initial render", async ({ browserName, playwright }) => {
  test.skip(browserName !== "chromium", "Chrome extensions can only be loaded in Chromium.");

  const harness = await launchExtension(playwright);

  try {
    await writeSettings(harness.extensionPage, {
      catchUpMode: {
        enabled: true,
        schedule: {
          mode: "always",
          days: [],
          startTime: "00:00",
          endTime: "23:59"
        },
        sensitivity: "lockdown"
      },
      enabledPacks: ["f1"],
      customTerms: [],
      trustedSites: []
    });

    const page = await harness.context.newPage();
    await page.route("https://www.youtube.com/", route => {
      route.fulfill({
        contentType: "text/html",
        body: youtubeHydrationFixtureHtml()
      });
    });

    await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#qualifying-card[data-despoilerze-hidden='true']")).toHaveCount(1);
    await expect(page.locator("#sprint-card[data-despoilerze-hidden='true']")).toHaveCount(1);
  } finally {
    await harness.context.close();
  }
});

test("YouTube home grid keeps card and thumbnail geometry through hiding and both reveal actions", async ({ playwright }, testInfo) => {
  const harness = await launchExtension(playwright);

  try {
    const settings: Settings = {
      catchUpMode: { enabled: false, sensitivity: "lockdown" },
      enabledPacks: ["f1"],
      customTerms: [],
      trustedSites: []
    };
    await writeSettings(harness.extensionPage, settings);

    const page = await harness.context.newPage();
    await page.setViewportSize({ width: 1600, height: 1000 });
    const fixture = await readFile("tests/fixtures/sites/youtube/home-grid-layout.html", "utf8");
    await page.route("https://www.youtube.com/", route => route.fulfill({ contentType: "text/html", body: fixture }));
    await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });
    await sendSettingsChanged(harness.extensionPage, "https://www.youtube.com/*");

    const originalGeometry = await youtubeCardGeometry(page);
    await page.screenshot({ path: testInfo.outputPath("youtube-original.png") });
    await writeSettings(harness.extensionPage, { ...settings, catchUpMode: { enabled: true, sensitivity: "lockdown" } });
    await sendSettingsChanged(harness.extensionPage, "https://www.youtube.com/*");
    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(2);
    await page.screenshot({ path: testInfo.outputPath("youtube-hidden.png") });

    expect(await youtubeCardGeometry(page)).toEqual(originalGeometry);
    await expect(page.locator("#contents > ytd-rich-item-renderer")).toHaveCount(6);
    await expect(page.locator("#fp2-card")).toHaveCSS("filter", "blur(10px)");
    await expect(page.locator("#gaming-card")).toHaveCSS("filter", "none");

    await page.getByRole("button", { name: "Reveal once", exact: true }).first().click();
    await expect(page.locator("#fp2-card[data-despoilerze-hidden='true']")).toHaveCount(0);
    await expect(page.locator("#qualifying-card[data-despoilerze-hidden='true']")).toHaveCount(1);
    expect(await youtubeCardGeometry(page)).toEqual(originalGeometry);

    await page.getByRole("button", { name: "Reveal all on page", exact: true }).click();
    await expect(page.locator("[data-despoilerze-hidden='true'], .despoilerze-overlay")).toHaveCount(0);
    expect(await youtubeCardGeometry(page)).toEqual(originalGeometry);
    await expect(page.locator("#fp2-card")).toHaveCSS("filter", "none");
    await page.screenshot({ path: testInfo.outputPath("youtube-revealed.png") });

    // A subsequent scan must respect both explicit reveal choices.
    await sendSettingsChanged(harness.extensionPage, "https://www.youtube.com/*");
    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(0);
  } finally {
    await harness.context.close();
  }
});

test("YouTube reveal controls follow resizing, scrolling and feed changes without leaving orphaned controls", async ({ playwright }) => {
  const harness = await launchExtension(playwright);

  try {
    await writeSettings(harness.extensionPage, {
      catchUpMode: { enabled: true, sensitivity: "lockdown" },
      enabledPacks: ["f1"],
      customTerms: [],
      trustedSites: []
    });
    const page = await harness.context.newPage();
    await page.setViewportSize({ width: 1600, height: 1000 });
    const fixture = await readFile("tests/fixtures/sites/youtube/home-grid-layout.html", "utf8");
    await page.route("https://www.youtube.com/", route => route.fulfill({ contentType: "text/html", body: fixture }));
    await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-despoilerze-hidden='true']")).toHaveCount(2);
    await expectYouTubeOverlayAligned(page, "fp2-card");

    for (const width of [1100, 420, 1600]) {
      await page.setViewportSize({ width, height: 1000 });
      await expectYouTubeOverlayAligned(page, "fp2-card");
    }
    await page.evaluate(() => window.scrollTo(0, 260));
    await expectYouTubeOverlayAligned(page, "fp2-card");

    // Move the card without changing its size, as when content arrives above the feed.
    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.style.height = "120px";
      document.getElementById("feed-spacer")!.appendChild(spacer);
    });
    await expectYouTubeOverlayAligned(page, "fp2-card");

    // YouTube can scroll a feed within a container, independently of the document.
    await page.evaluate(() => {
      const main = document.querySelector("main")!;
      main.style.height = "500px";
      main.style.overflow = "auto";
      main.scrollTop = 180;
    });
    await expectYouTubeOverlayAligned(page, "fp2-card");
    await page.evaluate(() => document.querySelector("main")!.removeAttribute("style"));
    await expectYouTubeOverlayAligned(page, "fp2-card");

    // Retain the detached node to exercise a virtualised feed reusing a card.
    await page.evaluate(() => {
      const card = document.getElementById("fp2-card")!;
      const template = document.createElement("template");
      template.id = "removed-card";
      document.body.appendChild(template);
      template.content.appendChild(card);
    });
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(1);
    await page.evaluate(() => {
      const template = document.querySelector<HTMLTemplateElement>("#removed-card")!;
      document.getElementById("contents")!.appendChild(template.content);
      template.remove();
    });
    await expect(page.locator("#fp2-card[data-despoilerze-hidden='true']")).toHaveCount(1);
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(2);
    await expectYouTubeOverlayAligned(page, "fp2-card");

    await page.getByRole("button", { name: "Reveal all on page", exact: true }).first().click();
    await expect(page.locator("[data-despoilerze-hidden='true'], .despoilerze-overlay")).toHaveCount(0);
    await page.setViewportSize({ width: 1100, height: 1000 });
    await sendSettingsChanged(harness.extensionPage, "https://www.youtube.com/*");
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(0);
  } finally {
    await harness.context.close();
  }
});

test("YouTube Shorts reassesses reused players and remembers reveals by video", async ({ playwright }) => {
  const harness = await launchExtension(playwright);

  try {
    const page = await openShortsFixture(harness);
    const player = page.locator("ytd-reel-video-renderer");
    await expect(player).toHaveCSS("filter", "blur(10px)");

    await changeShort(page, "safe", "A walk along the coast");
    await expect(player).toHaveCSS("filter", "none");
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(0);
    await changeShort(page, "another-safe", "Making chocolate at home");
    await expect(player).toHaveCSS("filter", "none");

    await changeShort(page, "second-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "blur(10px)");
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(1);
    await page.getByRole("button", { name: "Reveal once", exact: true }).click();
    await expect(player).toHaveCSS("filter", "none");
    await page.locator("#likes").evaluate(element => element.textContent = "11 likes");
    await sendSettingsChanged(harness.extensionPage, "https://www.youtube.com/*");
    await expect(player).toHaveCSS("filter", "none");

    // A different video can have the same title. Only its ID distinguishes it.
    await page.evaluate(() => {
      history.pushState({}, "", "/shorts/third-spoiler");
      document.querySelector<HTMLAnchorElement>(".ytp-title-link")!.href = "/shorts/third-spoiler";
    });
    await expect(player).toHaveCSS("filter", "blur(10px)");
    await changeShort(page, "second-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "none");

    // Updating the title of an explicitly revealed video must preserve that choice.
    await changeShort(page, "second-spoiler", "Hamilton wins dramatic Grand Prix");
    await expect(player).toHaveCSS("filter", "none");
    await changeShort(page, "third-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "blur(10px)");
    expect(await page.evaluate(() => document.querySelector("ytd-reel-video-renderer")
      === (window as Window & { originalShort?: Element }).originalShort)).toBe(true);

    await page.getByRole("button", { name: "Reveal all on page", exact: true }).click();
    await changeShort(page, "fourth-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "blur(10px)");
    await changeShort(page, "third-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "none");
    // Remember the video even if YouTube replaces the renderer entirely.
    await player.evaluate(element => element.replaceWith(element.cloneNode(true)));
    await sendSettingsChanged(harness.extensionPage, "https://www.youtube.com/*");
    await expect(player).toHaveCSS("filter", "none");
  } finally {
    await harness.context.close();
  }
});

test("YouTube Shorts waits for matching metadata and handles adverts and rapid changes", async ({ playwright }) => {
  const harness = await launchExtension(playwright);

  try {
    const page = await openShortsFixture(harness);
    const player = page.locator("ytd-reel-video-renderer");
    await expect(player).toHaveCSS("filter", "blur(10px)");

    await page.evaluate(() => {
      history.pushState({}, "", "/shorts/delayed-safe");
      document.querySelector("h1")!.textContent = "A walk along the coast";
    });
    // The player link still describes the previous spoiler. A scan must keep it hidden.
    await sendSettingsChanged(harness.extensionPage, "https://www.youtube.com/*");
    await expect(player).toHaveCSS("filter", "blur(10px)");
    await changeShort(page, "delayed-safe", "A walk along the coast");
    await expect(player).toHaveCSS("filter", "none");

    await changeShort(page, "delayed-spoiler", "");
    await changeShort(page, "delayed-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "blur(10px)");
    const frames = await page.evaluate(async () => {
      history.pushState({}, "", "/shorts/another-spoiler");
      document.querySelector("h1")!.textContent = "Hamilton wins dramatic Grand Prix";
      const link = document.querySelector<HTMLAnchorElement>(".ytp-title-link")!;
      link.href = "/shorts/another-spoiler";
      link.textContent = "Hamilton wins dramatic Grand Prix";
      const filters: string[] = [];
      for (let frame = 0; frame < 6; frame += 1) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        filters.push(getComputedStyle(document.querySelector("ytd-reel-video-renderer")!).filter);
      }
      return filters;
    });
    expect(frames).toEqual(Array(6).fill("blur(10px)"));
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(1);

    // Adverts can omit the ordinary Shorts heading; the player link supplies the title.
    await page.locator("h1").evaluate(element => element.remove());
    await changeShort(page, "advert", "Sponsored chocolate advert");
    await expect(player).toHaveCSS("filter", "none");
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(0);
    await changeShort(page, "advert-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "blur(10px)");

    for (const [id, title] of [["fast-one", "Making chocolate"], ["fast-two", shortsSpoilerTitle], ["fast-three", "A walk along the coast"]]) {
      await changeShort(page, id, title);
    }
    await expect(player).toHaveCSS("filter", "none");
    await expect(page.locator(".despoilerze-overlay")).toHaveCount(0);
    // A malformed temporary link must not break subsequent observer callbacks.
    await page.locator(".ytp-title-link").evaluate(element => element.setAttribute("href", "https://["));
    await changeShort(page, "final-spoiler", shortsSpoilerTitle);
    await expect(player).toHaveCSS("filter", "blur(10px)");
  } finally {
    await harness.context.close();
  }
});

const shortsSpoilerTitle = "Norris wins chaotic Monaco GP after late safety car";

async function openShortsFixture(harness: ExtensionHarness): Promise<Page> {
  await writeSettings(harness.extensionPage, {
    catchUpMode: { enabled: true, sensitivity: "balanced" },
    enabledPacks: ["f1"], customTerms: [], trustedSites: []
  });
  const page = await harness.context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("https://www.youtube.com/shorts/**", route => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><title>Shorts player reuse fixture</title>
      <style>ytd-reel-video-renderer { display: block; width: 600px; height: 700px; margin: 40px; }</style>
      <ytd-reel-video-renderer id="reel-video-renderer">
        <h1>${shortsSpoilerTitle}</h1>
        <a class="ytp-title-link" href="/shorts/first-spoiler">${shortsSpoilerTitle}</a>
        <span id="likes">10 likes</span>
      </ytd-reel-video-renderer>`
  }));
  await page.goto("https://www.youtube.com/shorts/first-spoiler");
  await page.evaluate(() => {
    (window as Window & { originalShort?: Element }).originalShort = document.querySelector("ytd-reel-video-renderer")!;
  });
  return page;
}

async function changeShort(page: Page, id: string, title: string): Promise<void> {
  await page.evaluate(({ id, title }) => {
    history.pushState({}, "", `/shorts/${id}`);
    const heading = document.querySelector("h1");
    if (heading) heading.textContent = title;
    const link = document.querySelector<HTMLAnchorElement>(".ytp-title-link")!;
    link.href = `/shorts/${id}`;
    link.textContent = title;
  }, { id, title });
}

async function expectYouTubeOverlayAligned(page: Page, cardId: string): Promise<void> {
  await expect.poll(() => page.evaluate(id => {
    const card = document.getElementById(id)!;
    const targetId = card.getAttribute("data-despoilerze-target-id");
    const overlay = document.querySelector(`.despoilerze-overlay[data-despoilerze-target-id='${targetId}']`);
    if (!overlay) return false;
    const cardRect = card.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    return Math.abs(overlayRect.left - cardRect.left - 8) < 1
      && Math.abs(overlayRect.top - cardRect.top - 8) < 1
      && overlayRect.right <= cardRect.right
      && overlayRect.bottom <= cardRect.bottom
      && Array.from(overlay.querySelectorAll("button")).every(button => button.getBoundingClientRect().right <= cardRect.right);
  }, cardId)).toBe(true);
}

async function youtubeCardGeometry(page: Page) {
  return page.locator("ytd-rich-item-renderer, .thumbnail").evaluateAll(elements => elements.map(element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  }));
}

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
  await expect.poll(async () => (await readSettings(extensionPage))?.catchUpMode.schedule?.mode).toBe("weekend");

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
  await expect.poll(async () => readSettings(extensionPage)).toEqual(settings);
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

function guardianFixtureHtml(): string {
  return `<!doctype html>
    <html>
      <head>
        <title>Guardian fixture</title>
        <style>
          [data-component='card'], li { display: block; width: 520px; min-height: 96px; margin: 16px; }
        </style>
      </head>
      <body>
        <main id="maincontent">
          <section data-component="front-container">
            <div data-component="card" data-link-name="article" id="guardian-spoiler">
              <a data-link-name="article" href="/football/2026/jun/16/england-through-after-dramatic-stoppage-time-winner">
                <h3>England through after dramatic stoppage-time winner</h3>
                <p>Reaction and analysis from the World Cup group stage.</p>
              </a>
            </div>
            <div data-component="card" data-link-name="article" id="guardian-safe">
              <a data-link-name="article" href="/football/2026/jun/16/world-cup-preview">
                <h3>World Cup fixture preview and team news</h3>
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>`;
}

function youtubeHydrationFixtureHtml(): string {
  return `<!doctype html>
    <html>
      <head>
        <title>YouTube hydration fixture</title>
        <style>
          ytd-rich-item-renderer, yt-lockup-view-model, a {
            display: block;
            width: 520px;
            min-height: 48px;
            margin: 16px;
          }
        </style>
      </head>
      <body>
        <main>
          <ytd-rich-item-renderer id="qualifying-card">
            <yt-lockup-view-model>
              <h3><a class="yt-lockup-metadata-view-model__title"><span id="qualifying-title">Loading video...</span></a></h3>
            </yt-lockup-view-model>
          </ytd-rich-item-renderer>
          <ytd-rich-item-renderer id="sprint-card">
            <yt-lockup-view-model>
              <h3><a class="yt-lockup-metadata-view-model__title"><span id="sprint-title">Loading video...</span></a></h3>
            </yt-lockup-view-model>
          </ytd-rich-item-renderer>
        </main>
        <script>
          window.setTimeout(() => {
            document.getElementById("qualifying-title").textContent = "Qualifying Highlights | 2026 Dutch Grand Prix";
            document.getElementById("sprint-title").textContent = "Sprint Highlights | 2026 Dutch Grand Prix";
          }, 1_000);
        </script>
      </body>
    </html>`;
}
