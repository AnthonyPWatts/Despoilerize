import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const releaseVersion = manifest.version.match(/^\d+\.\d+/)?.[0];
if (!releaseVersion) {
  throw new Error(`Manifest version '${manifest.version}' is not a major.minor.patch version.`);
}

const releaseDir = join(root, "Releases", `v${releaseVersion}`);
const outputDir = join(releaseDir, "screenshots");
const workDir = join(releaseDir, ".generated");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

mkdirSync(outputDir, { recursive: true });
mkdirSync(workDir, { recursive: true });

const screenshots = [
  {
    name: "01-catch-up-mode-popup",
    html: page("Catch-up Mode popup", `
      <section class="browser chrome">
        ${browserTop("https://news.google.com/sports")}
        <main class="news-grid">
          ${newsCard("Latest football headlines", "Team news, fixture previews, and live blogs without showing scores.", "safe")}
          ${newsCard("Possible race result hidden", "A motorsport headline has been blurred while Catch-up Mode is on.", "hidden")}
          ${newsCard("Highlights queue", "Save stories for later and browse with less risk.", "safe")}
        </main>
      </section>
      ${popup({ on: true, packs: "Formula 1, MotoGP, World Cup 2026, Reality TV, +9 more", expires: "Expires: tonight at 23:59" })}
    `)
  },
  {
    name: "02-spoiler-hidden-on-page",
    html: page("Spoiler hidden on page", `
      <section class="browser chrome">
        ${browserTop("https://www.bbc.co.uk/sport")}
        <main class="content-page">
          <aside class="rail">
            <strong>Sport</strong>
            <span>Football</span>
            <span>Formula 1</span>
            <span>Cricket</span>
            <span>Tennis</span>
          </aside>
          <section class="feed">
            ${story("Race weekend build-up", "Practice analysis and qualifying reminders for later viewing.", false)}
            <div class="story shell">
              ${overlay("Matched Formula 1 result language")}
              <div class="blurred-story">
                <div class="thumb"></div>
                <div><h2>Grand Prix winner revealed after dramatic final lap</h2><p>Report, podium reaction, and championship standings.</p></div>
              </div>
            </div>
            ${story("Highlights guide", "Where to watch official highlights after the race.", false)}
          </section>
        </main>
      </section>
    `)
  },
  {
    name: "03-sports-pack-settings",
    html: page("Sports pack settings", `
      <section class="browser light">
        ${browserTop("chrome-extension://despoilerize/src/options/index.html")}
        <main class="settings-page">
          <h1>DeSpoilerize Settings</h1>
          <section class="settings-section">
            <h2>Topics to protect</h2>
            <p>Select the sports, shows, teams, leagues, and events you want DeSpoilerize to protect while Catch-up Mode is enabled.</p>
            <div class="save-panel"><strong>Changes will not persist unless you save them.</strong><button>Save settings</button></div>
            <div class="sports-groups">
              ${group("Motorsport", ["Formula 1", "MotoGP"], true)}
              ${group("Football", ["General football", "World Cup 2026", "Premier League", "Championship", "Champions League", "England football"], true)}
              ${group("Rugby", ["Rugby union", "Six Nations", "Rugby league"], false)}
              ${group("Cricket", ["Cricket", "England cricket", "The Ashes"], true)}
              ${group("Tennis", ["Tennis", "Wimbledon", "Grand Slams"], true)}
              ${group("US sports", ["NFL", "NBA"], false)}
              ${group("Entertainment", ["Reality TV"], true)}
            </div>
          </section>
        </main>
      </section>
    `)
  },
  {
    name: "04-custom-terms-trusted-sites",
    html: page("Custom terms and trusted sites", `
      <section class="browser light">
        ${browserTop("chrome-extension://despoilerize/src/options/index.html")}
        <main class="settings-page lower">
          <h1>DeSpoilerize Settings</h1>
          <section class="two-column">
            <div>
              <h2>Custom protected terms</h2>
              <p>Add one team, driver, show, event, or phrase per line.</p>
              <pre class="textarea">The Traitors
Love Island final
Strictly dance-off
British Grand Prix
Current contestant names</pre>
            </div>
            <div>
              <h2>Trusted sites</h2>
              <p>DeSpoilerize will not hide anything on these domains.</p>
              <pre class="textarea">f1tv.formula1.com
motogp.com
my-highlights.example</pre>
            </div>
          </section>
          <div class="save-panel bottom"><strong>Changes will not persist unless you save them.</strong><button>Save settings</button></div>
        </main>
      </section>
    `)
  },
  {
    name: "05-reveal-controls",
    html: page("Reveal controls", `
      <section class="browser chrome">
        ${browserTop("https://www.youtube.com/results?search_query=f1+highlights")}
        <main class="video-page">
          <section class="video-list">
            <div class="video hidden-video">
              ${overlay("Matched event, driver, and result vocabulary")}
              <div class="video-inner">
                <div class="video-thumb"></div>
                <div><h2>Possible spoiler hidden</h2><p>Reveal once when you are ready, or reveal all on this page.</p></div>
              </div>
            </div>
            ${video("Official highlights playlist", "Queue safe videos for later without browsing result-heavy recommendations.")}
            ${video("Race preview and setup", "Non-result coverage stays visible.")}
          </section>
          ${popup({ on: true, packs: "Formula 1, MotoGP, Cricket, Tennis", expires: "Expires: 24 hours from now" })}
        </main>
      </section>
    `)
  }
];

for (const shot of screenshots) {
  const htmlPath = join(workDir, `${shot.name}.html`);
  const pngPath = join(outputDir, `${shot.name}.png`);
  writeFileSync(htmlPath, shot.html);

  const result = spawnSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1280,800",
    "--virtual-time-budget=1000",
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href
  ], { stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`Failed to create ${pngPath}`);
  }
}

console.log(`Created ${screenshots.length} screenshots in ${outputDir}`);

function page(title, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${styles()}</style>
</head>
<body>${body}</body>
</html>`;
}

function browserTop(url) {
  return `<header class="browser-top"><div class="traffic"><i></i><i></i><i></i></div><div class="address">${url}</div></header>`;
}

function popup({ on, packs, expires }) {
  return `<aside class="popup-card">
    <h1>DeSpoilerize</h1>
    <p class="status ${on ? "on" : "off"}">Catch-up Mode: ${on ? "ON" : "OFF"}</p>
    <button class="primary">${on ? "Turn off" : "Turn on"}</button>
    <section><h2>Protect until</h2><div class="row"><button>2h</button><button>Tonight</button><button>24h</button><button>Manual</button></div></section>
    <section><h2>Sensitivity</h2><select><option>Lockdown</option></select></section>
    <section><h2>Protecting</h2><p class="pack-summary">${packs}</p><button>Change topics and settings</button></section>
    <section><button>Reveal all on this page</button></section>
    <p class="small">${expires}</p>
  </aside>`;
}

function newsCard(title, copy, state) {
  return `<article class="news-card ${state}"><div class="thumb"></div><h2>${title}</h2><p>${copy}</p></article>`;
}

function story(title, copy) {
  return `<article class="story"><div class="thumb"></div><div><h2>${title}</h2><p>${copy}</p></div></article>`;
}

function video(title, copy) {
  return `<article class="video"><div class="video-thumb"></div><div><h2>${title}</h2><p>${copy}</p></div></article>`;
}

function overlay(reason) {
  return `<div class="despoilerze-overlay"><div class="despoilerze-card"><div class="despoilerze-title">Possible spoiler hidden</div><div class="despoilerze-reason">${reason}</div><button>Reveal once</button><button>Reveal all on page</button></div></div>`;
}

function group(title, items, checked) {
  const rows = items.map((item, index) => `<label><input type="checkbox" ${checked || index === 0 ? "checked" : ""}><span>${item}</span><small>${description(item)}</small></label>`).join("");
  return `<section class="sports-group"><h3>${title}</h3><div class="group-actions"><button>Select all</button><button>Clear</button></div><div class="sports-pack-list">${rows}</div></section>`;
}

function description(item) {
  return `Protect headlines and cards mentioning ${item}.`;
}

function styles() {
  return `
    * { box-sizing: border-box; }
    body { width: 1280px; height: 800px; margin: 0; overflow: hidden; font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1f1f1f; background: #e8edf2; }
    button, select { border: 1px solid rgba(255,255,255,0.25); background: #2b2b2b; color: #fff; border-radius: 6px; padding: 7px 9px; font: inherit; }
    .browser { position: relative; width: 1280px; height: 800px; overflow: hidden; background: #f6f6f6; }
    .browser.chrome { background: #111827; color: #f5f5f5; }
    .browser.light { background: #f6f6f6; color: #1f1f1f; }
    .browser-top { height: 58px; display: flex; align-items: center; gap: 18px; padding: 0 22px; background: #222831; border-bottom: 1px solid rgba(255,255,255,0.08); color: #d8dee9; }
    .light .browser-top { background: #ffffff; border-bottom: 1px solid #dddddd; color: #3a3a3a; }
    .traffic { display: flex; gap: 7px; }
    .traffic i { width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; display: block; }
    .traffic i:nth-child(2) { background: #ffbd2e; }
    .traffic i:nth-child(3) { background: #28c840; }
    .address { flex: 1; height: 34px; line-height: 34px; padding: 0 16px; border-radius: 17px; background: rgba(255,255,255,0.12); font-size: 14px; }
    .light .address { background: #f0f2f4; }

    .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 92px 92px; }
    .news-card { min-height: 390px; padding: 18px; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; background: #202938; }
    .news-card .thumb, .story .thumb { height: 160px; border-radius: 6px; background: linear-gradient(135deg, #4f8bd6, #35b59f); margin-bottom: 18px; }
    .news-card.hidden { filter: blur(8px); opacity: 0.85; }
    h1 { margin: 0 0 14px; font-size: 30px; letter-spacing: 0; }
    h2 { margin: 0 0 8px; font-size: 22px; letter-spacing: 0; }
    h3 { margin: 0 0 8px; font-size: 18px; letter-spacing: 0; }
    p { line-height: 1.45; margin: 0 0 12px; }

    .popup-card { position: absolute; right: 86px; top: 86px; width: 312px; padding: 16px; border-radius: 8px; background: #191919; color: #f5f5f5; box-shadow: 0 24px 80px rgba(0,0,0,0.42); border: 1px solid rgba(255,255,255,0.16); }
    .popup-card h1 { font-size: 20px; margin-bottom: 8px; }
    .popup-card h2 { font-size: 13px; margin: 14px 0 6px; opacity: 0.9; }
    .popup-card .status { padding: 8px; border-radius: 6px; font-weight: 700; margin-bottom: 8px; }
    .status.on { background: #243b24; }
    .status.off { background: #3b2424; }
    .popup-card .primary { width: 100%; font-weight: 700; background: #343456; }
    .popup-card .row { display: flex; flex-wrap: wrap; gap: 4px; }
    .popup-card button, .popup-card select { margin: 3px; font-size: 13px; }
    .pack-summary { min-height: 1.2em; margin: 4px 0 8px; font-size: 12px; line-height: 1.35; opacity: 0.9; }
    .small { font-size: 11px; opacity: 0.8; margin-top: 8px; }

    .content-page { display: grid; grid-template-columns: 220px 1fr; gap: 28px; padding: 36px 70px; }
    .rail { display: flex; flex-direction: column; gap: 16px; padding: 20px; border-right: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; }
    .feed { display: flex; flex-direction: column; gap: 18px; }
    .story { position: relative; display: grid; grid-template-columns: 230px 1fr; gap: 20px; min-height: 190px; padding: 18px; border-radius: 8px; background: #202938; border: 1px solid rgba(255,255,255,0.12); }
    .shell { outline: 2px solid rgba(255,255,255,0.22); overflow: hidden; }
    .blurred-story, .video-inner { filter: blur(10px); user-select: none; pointer-events: none; display: grid; grid-template-columns: 230px 1fr; gap: 20px; }
    .despoilerze-overlay { position: absolute; left: 18px; top: 18px; z-index: 5; color: #fff; }
    .despoilerze-card { display: inline-block; max-width: 360px; background: rgba(0,0,0,0.88); border: 1px solid rgba(255,255,255,0.28); border-radius: 8px; padding: 10px 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); color: #fff; }
    .despoilerze-title { font-weight: 700; margin-bottom: 4px; font-size: 14px; }
    .despoilerze-reason { font-size: 12px; line-height: 1.35; opacity: 0.85; margin-bottom: 8px; }
    .despoilerze-card button { appearance: none; border: 1px solid rgba(255,255,255,0.35); border-radius: 5px; padding: 4px 8px; background: rgba(255,255,255,0.12); color: #fff; cursor: pointer; font-size: 12px; margin-right: 6px; }

    .settings-page { max-width: 960px; margin: 0 auto; padding: 26px 28px; }
    .settings-section h2, .lower h2 { font-size: 22px; margin-bottom: 6px; }
    .save-panel { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 16px 0; padding: 10px 12px; border: 1px solid #d4c47a; border-radius: 8px; background: #fff8d8; }
    .save-panel button, .group-actions button { background: #fff; color: #1f1f1f; border: 1px solid #999; }
    .sports-groups { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .sports-group { border: 1px solid #ddd; border-radius: 10px; background: #fff; padding: 14px; min-height: 178px; }
    .group-actions { display: flex; gap: 6px; margin-bottom: 8px; }
    .group-actions button { padding: 4px 8px; font-size: 12px; }
    .sports-pack-list { display: flex; flex-direction: column; gap: 7px; }
    .sports-pack-list label { display: grid; grid-template-columns: auto 1fr; gap: 0 8px; align-items: start; font-size: 13px; }
    .sports-pack-list small { grid-column: 2; color: #555; line-height: 1.25; }
    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 48px; }
    .textarea { width: 100%; min-height: 250px; white-space: pre-wrap; font: 19px/1.5 Consolas, ui-monospace, monospace; padding: 18px; border: 1px solid #c8c8c8; border-radius: 8px; background: #fff; color: #1f1f1f; }
    .bottom { margin-top: 36px; }

    .video-page { position: relative; padding: 42px 60px; }
    .video-list { width: 720px; display: flex; flex-direction: column; gap: 18px; }
    .video { position: relative; display: grid; grid-template-columns: 260px 1fr; gap: 20px; min-height: 164px; padding: 16px; border-radius: 8px; background: #202938; border: 1px solid rgba(255,255,255,0.12); }
    .video-thumb { height: 132px; border-radius: 6px; background: linear-gradient(135deg, #e5484d, #635bff); }
    .hidden-video { outline: 2px solid rgba(255,255,255,0.22); }
  `;
}
