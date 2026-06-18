import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const releaseVersion = manifest.version.match(/^\d+\.\d+/)?.[0];
if (!releaseVersion) {
  throw new Error(`Manifest version '${manifest.version}' is not a major.minor.patch version.`);
}

const releaseDir = join(root, "Releases", `v${releaseVersion}`);
const outputDir = join(releaseDir, "promo");
const workDir = join(releaseDir, ".generated");
const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
];
const browserPath = browserCandidates.find(existsSync);
if (!browserPath) {
  throw new Error("Could not find Chrome, Edge, or Brave to render store promo assets.");
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(workDir, { recursive: true });

const assets = [
  {
    name: "small-promo-tile",
    width: 440,
    height: 280,
    html: promoPage({
      width: 440,
      height: 280,
      titleSize: 38,
      subtitleSize: 18,
      iconSize: 76,
      layout: "small"
    })
  },
  {
    name: "marquee-promo-tile",
    width: 1400,
    height: 560,
    html: promoPage({
      width: 1400,
      height: 560,
      titleSize: 82,
      subtitleSize: 32,
      iconSize: 148,
      layout: "marquee"
    })
  }
];

for (const asset of assets) {
  const htmlPath = join(workDir, `${asset.name}.html`);
  const pngPath = join(outputDir, `${asset.name}.png`);
  writeFileSync(htmlPath, asset.html);

  const result = spawnSync(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${asset.width},${asset.height}`,
    "--virtual-time-budget=1000",
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href
  ], { stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`Failed to create ${pngPath}: ${result.error?.message ?? `browser exited with status ${result.status}`}`);
  }
}

console.log(`Created ${assets.length} promo assets in ${outputDir}`);

function promoPage({ width, height, titleSize, subtitleSize, iconSize, layout }) {
  const text = layout === "marquee"
    ? `<h1>DeSpoilerize</h1><p>Scheduled spoiler protection for sport and entertainment</p>`
    : `<h1>DeSpoilerize</h1><p>Spoiler protection for sport and entertainment</p>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>DeSpoilerize ${layout} promo tile</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      margin: 0;
      overflow: hidden;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background: #101827;
      color: #ffffff;
    }
    body {
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 78% 20%, rgba(79, 139, 214, 0.42), transparent 35%),
        linear-gradient(135deg, #101827 0%, #172238 54%, #1d2f35 100%);
    }
    main {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: ${layout === "marquee" ? "220px 1fr" : "1fr"};
      align-items: center;
      gap: ${layout === "marquee" ? "38px" : "16px"};
      padding: ${layout === "marquee" ? "72px 96px" : "34px 42px"};
    }
    .icon {
      width: ${iconSize}px;
      height: ${iconSize}px;
      border: ${Math.max(7, Math.round(iconSize * 0.08))}px solid #ffffff;
      border-radius: 50%;
      position: relative;
      background: rgba(255,255,255,0.06);
      box-shadow: 0 24px 80px rgba(0,0,0,0.38);
      ${layout === "small" ? "margin-bottom: 14px;" : ""}
    }
    .icon::before {
      content: "";
      position: absolute;
      width: 14%;
      height: 14%;
      left: 30%;
      top: 28%;
      border-radius: 50%;
      background: #ffffff;
    }
    .icon::after {
      content: "";
      position: absolute;
      inset: 19%;
      border-radius: 50%;
      border: ${Math.max(3, Math.round(iconSize * 0.035))}px solid rgba(53, 181, 159, 0.92);
      border-left-color: transparent;
      transform: rotate(-25deg);
    }
    h1 {
      margin: 0 0 ${layout === "marquee" ? "18px" : "10px"};
      font-size: ${titleSize}px;
      line-height: 0.96;
      letter-spacing: 0;
      font-weight: 800;
    }
    p {
      max-width: ${layout === "marquee" ? "850px" : "330px"};
      margin: 0;
      font-size: ${subtitleSize}px;
      line-height: 1.25;
      color: #dbeafe;
      font-weight: 650;
    }
    .small main {
      align-content: center;
    }
  </style>
</head>
<body class="${layout}">
  <main>
    <div class="icon" aria-hidden="true"></div>
    <section>${text}</section>
  </main>
</body>
</html>`;
}
