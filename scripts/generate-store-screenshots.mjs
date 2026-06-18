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
const outputDir = join(releaseDir, "screenshots");
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
  throw new Error("Could not find Chrome, Edge, or Brave to render store screenshots.");
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(workDir, { recursive: true });

const screenshots = [
  {
    name: "01-protection-popup",
    html: page("Protection popup", `
      <section class="browser chrome">
        ${browserTop("https://news.google.com/sports")}
        <main class="news-grid">
          ${newsCard("Race weekend build-up", "Practice analysis and reminders for later viewing.", "safe")}
          ${newsCard("Possible result hidden", "A motorsport headline has been blurred while protection is active.", "hidden")}
          ${newsCard("Highlights queue", "Save stories for later and browse with less risk.", "safe")}
        </main>
      </section>
      ${popup({ status: "Protection: ON", statusState: "on", action: "Return to schedule", schedule: "Temporary protection until 23:59", next: "Saved schedule resumes", ends: "Tonight at 23:59" })}
    `)
  },
  {
    name: "02-settings-schedule-topics",
    html: page("Settings schedule and topics", `
      <section class="browser dark-ui">
        ${browserTop("chrome-extension://despoilerize/src/options/index.html")}
        ${settingsShell(`
          <section class="panel schedule-panel">
            ${sectionHeader("Protection schedule", "Choose when DeSpoilerize should automatically protect you from spoilers.", "protection")}
            <div class="schedule-list">
              ${scheduleCard("Every weekend", "All day Saturday -> Sunday", "WE", true, "Recommended")}
              ${scheduleCard("Daily", "Protect every day", "24")}
              ${scheduleCard("Custom days", "Pick specific days and times", "Sel")}
              ${scheduleCard("Always on", "Protect 24/7 until I turn it off", "All")}
              ${scheduleCard("Paused", "Do not protect automatically", "II")}
            </div>
            <div class="day-grid"><button>Mon</button><button>Tue</button><button>Wed</button><button>Thu</button><button>Fri</button><button class="selected">Sat</button><button class="selected">Sun</button></div>
            <div class="summary-row wide"><div><span>Next protection:</span><strong>This Saturday at 00:00</strong></div><div><span>Ends:</span><strong>Next Sunday at 23:59</strong></div></div>
          </section>
          <section class="panel compact-panel">
            ${sectionHeader("Sensitivity", "Adjust how strictly spoilers are hidden.", "shield", '<button class="select-button">Lockdown</button>')}
          </section>
          <section class="panel topics-panel">
            ${sectionHeader("Topics to protect", "Select the sports, shows, teams, leagues, and events you want DeSpoilerize to protect while spoiler protection is active.", "topics", '<button class="ghost">Expand all</button>')}
            <div class="topic-grid">
              ${topicCard("Motorsport", "Races, drivers, teams, and championship results.", "1 of 2 selected", true, ["Formula 1", "MotoGP"])}
              ${topicCard("Football", "Leagues, cups, and football results.", "0 of 6 selected")}
              ${topicCard("Rugby", "Union, league, and international results.", "0 of 3 selected")}
              ${topicCard("Cricket", "Matches, series, and cricket results.", "0 of 3 selected")}
              ${topicCard("Tennis", "Tournaments, matches, and tennis results.", "0 of 3 selected")}
              ${topicCard("US sports", "NFL, NBA, and major US sports.", "0 of 2 selected")}
            </div>
          </section>
        `)}
      </section>
    `)
  },
  {
    name: "03-supported-sites-settings",
    html: page("Supported sites settings", `
      <section class="browser dark-ui">
        ${browserTop("chrome-extension://despoilerize/src/options/index.html")}
        ${settingsShell(`
          <section class="panel text-panel">
            ${sectionHeader("Custom protected terms", "Add one team, driver, show, event, or phrase per line.", "tag", '<span class="count-pill">5 terms</span>')}
            <pre class="textarea">The Traitors
Love Island final
Strictly dance-off
British Grand Prix
Current contestant names</pre>
            <p class="helper">These will be hidden wherever possible across supported sites.</p>
          </section>
          <section class="panel text-panel">
            ${sectionHeader("Supported sites", "Choose which supported sites DeSpoilerize should filter.", "sites", '<span class="count-pill">1 disabled</span>')}
            <div class="site-toggle-list">
              ${siteToggle("Google Search", "Search result pages on Google.", "www.google.com, www.google.co.uk", true)}
              ${siteToggle("Google News", "News feeds and topic pages.", "news.google.com", true)}
              ${siteToggle("BBC", "BBC Sport and related BBC pages.", "www.bbc.co.uk, www.bbc.com", true)}
              ${siteToggle("The Guardian", "Guardian sport and article lists.", "www.theguardian.com", false)}
              ${siteToggle("YouTube", "Video lists, search, and recommendations.", "www.youtube.com", true)}
            </div>
            <p class="helper">Turning filtering off for a supported site keeps it visible even while protection is active.</p>
          </section>
          <section class="footer-panel"><strong>You are in control</strong><span>Your settings stay on your device and are only used to protect you from spoilers.</span><a>Read the user guide</a></section>
        `)}
      </section>
    `)
  },
  {
    name: "04-spoiler-hidden-on-page",
    html: page("Spoiler hidden on page", `
      <section class="browser chrome">
        ${browserTop("https://www.bbc.co.uk/sport")}
        <main class="content-page">
          <aside class="rail"><strong>Sport</strong><span>Football</span><span>Formula 1</span><span>Cricket</span><span>Tennis</span></aside>
          <section class="feed">
            ${story("Race weekend build-up", "Practice analysis and qualifying reminders for later viewing.")}
            <div class="story shell">
              ${overlay("Matched Formula 1 result language")}
              <div class="blurred-story">
                <div class="thumb"></div>
                <div><h2>Grand Prix winner revealed after dramatic final lap</h2><p>Report, podium reaction, and championship standings.</p></div>
              </div>
            </div>
            ${story("Highlights guide", "Where to watch official highlights after the race.")}
          </section>
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
                <div><h2>Possible spoiler hidden</h2><p>Reveal once when you are ready, or reveal everything on this page.</p></div>
              </div>
            </div>
            ${video("Official highlights playlist", "Queue safe videos for later without browsing result-heavy recommendations.")}
            ${video("Race preview and setup", "Non-result coverage stays visible.")}
          </section>
          ${popup({ status: "Protection: ON", statusState: "on", action: "Pause protection", schedule: "Every weekend: all day Saturday -> Sunday", next: "This Saturday at 00:00", ends: "Next Sunday at 23:59" })}
        </main>
      </section>
    `)
  }
];

for (const shot of screenshots) {
  const htmlPath = join(workDir, `${shot.name}.html`);
  const pngPath = join(outputDir, `${shot.name}.png`);
  writeFileSync(htmlPath, shot.html);

  const result = spawnSync(browserPath, [
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
    throw new Error(`Failed to create ${pngPath}: ${result.error?.message ?? `browser exited with status ${result.status}`}`);
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

function settingsShell(content) {
  return `<main class="settings-page">
    <header class="page-header">
      <div><h1>DeSpoilerize Settings</h1><p>Choose what you want protected and how DeSpoilerize works for you.</p></div>
      <div class="save-stack"><button class="save-button">Save settings</button><span>Changes are saved automatically</span></div>
    </header>
    ${content}
  </main>`;
}

function popup({ status, statusState, action, schedule, next, ends }) {
  return `<aside class="popup-card">
    <h1>DeSpoilerize v${manifest.version}</h1>
    <p class="status ${statusState}"><span></span>${status}</p>
    <button class="primary"><span class="power-icon"></span>${action}</button>
    <section class="popup-panel">
      <div class="popup-panel-head"><span class="mini-icon">Cal</span><div><h2>Protection schedule</h2><p>${schedule}</p></div></div>
      <div class="summary-row"><div><span>Next protection:</span><strong>${next}</strong></div><div><span>Ends:</span><strong>${ends}</strong></div></div>
    </section>
    <section class="setup-grid"><div><span>Protecting</span><strong>Formula 1</strong></div><div><span>Sensitivity</span><strong>Lockdown</strong></div></section>
    <div class="popup-actions"><button>Manage protection <b>></b></button><button class="danger">Reveal page</button></div>
    <p class="timezone-note">All times are based on your local time zone.</p>
  </aside>`;
}

function sectionHeader(title, copy, icon, extra = "") {
  return `<header class="section-header">
    <span class="section-icon ${icon}"></span>
    <div><h2>${title}</h2><p>${copy}</p></div>
    ${extra}
  </header>`;
}

function scheduleCard(title, copy, icon, selected = false, badge = "") {
  return `<button class="schedule-card ${selected ? "selected" : ""}">
    <span class="radio-dot"></span><span class="schedule-icon">${icon}</span>
    <span class="schedule-copy"><strong>${title}${badge ? ` <em>${badge}</em>` : ""}</strong><span>${copy}</span></span>
  </button>`;
}

function topicCard(title, copy, count, expanded = false, items = []) {
  const list = items.length
    ? `<div class="topic-items">${items.map((item, index) => `<label><input type="checkbox" ${index === 0 ? "checked" : ""}><span><strong>${item}</strong><small>${item === "Formula 1" ? "Formula 1 races, qualifying, sprints, drivers, and teams." : "Races, riders, teams, and championship results."}</small></span></label>`).join("")}</div>`
    : "";

  return `<article class="topic-card ${expanded ? "expanded" : ""}">
    <div class="topic-card-head"><span class="topic-icon"></span><div><h3>${title}</h3><p>${copy}</p></div><span class="count-pill">${count}</span><span class="chevron">⌄</span></div>
    ${list}
  </article>`;
}

function siteToggle(title, copy, domains, enabled) {
  return `<label class="site-toggle-card">
    <span class="switch ${enabled ? "enabled" : ""}"><i></i></span>
    <span class="site-copy"><strong>${title}</strong><span>${copy}</span><small>${domains}</small></span>
    <span class="site-state">${enabled ? "Filtering on" : "Filtering off"}</span>
  </label>`;
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

function styles() {
  return `
    * { box-sizing: border-box; }
    body { width: 1280px; height: 800px; margin: 0; overflow: hidden; font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #f7f7fb; background: #101115; }
    button, select { appearance: none; border: 1px solid rgba(255,255,255,0.18); background: #1d2027; color: #fff; border-radius: 7px; padding: 9px 13px; font: inherit; }
    h1, h2, h3, p { margin: 0; letter-spacing: 0; }
    h1 { font-size: 27px; line-height: 1.05; }
    h2 { font-size: 18px; line-height: 1.15; }
    h3 { font-size: 17px; line-height: 1.15; }
    p { line-height: 1.38; }

    .browser { position: relative; width: 1280px; height: 800px; overflow: hidden; background: #111827; }
    .browser.chrome { color: #f5f5f5; }
    .browser.dark-ui { background: radial-gradient(circle at 30% 0%, rgba(101,78,209,0.18), transparent 34%), #11141b; }
    .browser-top { height: 54px; display: flex; align-items: center; gap: 16px; padding: 0 20px; background: #222831; border-bottom: 1px solid rgba(255,255,255,0.08); color: #d8dee9; }
    .dark-ui .browser-top { background: #171a22; }
    .traffic { display: flex; gap: 7px; }
    .traffic i { width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; display: block; }
    .traffic i:nth-child(2) { background: #ffbd2e; }
    .traffic i:nth-child(3) { background: #28c840; }
    .address { flex: 1; height: 32px; line-height: 32px; padding: 0 16px; border-radius: 16px; background: rgba(255,255,255,0.10); font-size: 14px; color: #cfd5df; }

    .popup-card { position: absolute; right: 76px; top: 76px; width: 430px; padding: 18px; border-radius: 8px; background: rgba(18,20,25,0.98); color: #f6f6fb; box-shadow: 0 24px 80px rgba(0,0,0,0.46); border: 1px solid rgba(255,255,255,0.16); }
    .popup-card h1 { margin-bottom: 14px; }
    .status { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 7px; font-weight: 800; margin-bottom: 12px; }
    .status span { width: 20px; height: 20px; border: 2px solid currentColor; border-radius: 50%; display: inline-block; }
    .status.on { background: #1f381f; color: #f2fff2; }
    .status.off { background: #3c2425; color: #fff2f2; }
    .primary { width: 100%; display: flex; justify-content: center; align-items: center; gap: 10px; min-height: 48px; border-color: #8177ee; background: #35315d; font-weight: 800; font-size: 17px; }
    .power-icon { width: 18px; height: 22px; border: 3px solid currentColor; border-top-color: transparent; border-radius: 0 0 14px 14px; display: inline-block; position: relative; }
    .power-icon::before { content: ""; position: absolute; left: 6px; top: -9px; width: 3px; height: 15px; background: currentColor; border-radius: 3px; }
    .popup-panel, .setup-grid, .popup-actions { margin-top: 12px; }
    .popup-panel { padding: 14px; border: 1px solid rgba(255,255,255,0.16); border-radius: 8px; background: rgba(255,255,255,0.03); }
    .popup-panel-head { display: grid; grid-template-columns: 46px 1fr; gap: 12px; align-items: center; margin-bottom: 12px; }
    .mini-icon, .schedule-icon { width: 40px; height: 40px; display: grid; place-items: center; border: 2px solid #8b7dff; border-radius: 8px; color: #a89cff; font-weight: 900; font-size: 12px; }
    .popup-panel h2 { margin-bottom: 5px; }
    .popup-panel p, .timezone-note { color: #cfd2da; font-size: 14px; }
    .summary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px; border-radius: 7px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); }
    .summary-row span, .setup-grid span { display: block; color: #b7bac5; font-size: 13px; margin-bottom: 3px; }
    .summary-row strong, .setup-grid strong { color: #9589ff; font-size: 14px; }
    .setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .setup-grid div { padding: 12px; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; background: rgba(255,255,255,0.03); }
    .popup-actions { display: grid; grid-template-columns: 1fr 128px; gap: 10px; }
    .popup-actions button { display: flex; justify-content: center; gap: 8px; font-weight: 700; }
    .popup-actions .danger { border-color: #a85f6d; color: #ff9ba9; background: rgba(120,45,62,0.18); }
    .timezone-note { margin-top: 12px; }

    .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 96px 92px; }
    .news-card { min-height: 390px; padding: 18px; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; background: #202938; }
    .news-card .thumb, .story .thumb { height: 160px; border-radius: 6px; background: linear-gradient(135deg, #4f8bd6, #35b59f); margin-bottom: 18px; }
    .news-card.hidden { filter: blur(8px); opacity: 0.85; }
    .news-card h2, .story h2, .video h2 { margin-bottom: 8px; }
    .news-card p, .story p, .video p { color: #cbd5e1; }

    .settings-page { max-width: 1130px; margin: 0 auto; padding: 24px 28px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
    .page-header p { color: #c7cad5; margin-top: 6px; }
    .save-stack { display: grid; justify-items: end; gap: 8px; color: #b9bdc8; font-size: 12px; }
    .save-button { background: #6852d6; border-color: #806df0; font-weight: 800; min-width: 170px; }
    .panel { border: 1px solid rgba(255,255,255,0.14); background: rgba(22,25,32,0.86); border-radius: 8px; padding: 16px; margin-bottom: 14px; box-shadow: 0 14px 44px rgba(0,0,0,0.22); }
    .section-header { display: grid; grid-template-columns: 48px 1fr auto; align-items: center; gap: 14px; margin-bottom: 13px; }
    .section-header p { color: #c7cad5; margin-top: 4px; font-size: 14px; max-width: 760px; }
    .section-icon, .topic-icon { width: 36px; height: 36px; display: block; border-radius: 11px; background: #3f347c; position: relative; }
    .section-icon::after, .topic-icon::after { content: ""; position: absolute; inset: 9px; border: 2px solid #9a8dff; border-radius: 50%; }
    .section-icon.sites { background: #214d3e; }
    .section-icon.sites::after { border-color: #73d69e; }
    .ghost, .select-button { font-weight: 700; min-width: 132px; }
    .schedule-list { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .schedule-card { display: grid; grid-template-columns: 20px 42px 1fr; align-items: center; gap: 10px; text-align: left; padding: 14px; min-height: 94px; background: rgba(255,255,255,0.03); }
    .schedule-card.selected { border-color: #8276ff; background: rgba(85,76,163,0.18); }
    .radio-dot { width: 18px; height: 18px; border: 2px solid #858895; border-radius: 50%; }
    .selected .radio-dot { border: 5px solid #8c80ff; background: #fff; }
    .schedule-copy strong, .schedule-copy span { display: block; }
    .schedule-copy span { color: #c9ccd4; font-size: 13px; margin-top: 4px; }
    em { display: inline-block; margin-left: 6px; font-size: 10px; font-style: normal; text-transform: uppercase; color: #c9c3ff; background: rgba(117,104,217,0.55); padding: 3px 7px; border-radius: 999px; }
    .day-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin: 12px 0; }
    .day-grid button.selected { background: #7364de; border-color: #8f82ff; }
    .summary-row.wide { grid-template-columns: 1fr 1fr; }
    .compact-panel .section-header { margin-bottom: 0; }
    .topic-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .topic-card { min-height: 112px; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; padding: 14px; background: #151922; }
    .topic-card.expanded { border-color: #8c7dff; min-height: 250px; }
    .topic-card-head { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto 18px; align-items: start; gap: 12px; }
    .topic-card p { color: #d3d6dd; font-size: 14px; line-height: 1.35; max-width: none; }
    .count-pill { align-self: start; white-space: nowrap; border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; padding: 5px 10px; background: rgba(255,255,255,0.06); color: #d9dce6; font-size: 12px; }
    .chevron { color: #ccd0dc; }
    .topic-items { display: grid; gap: 11px; margin: 18px 0 0 52px; }
    .topic-items label { display: grid; grid-template-columns: 18px 1fr; gap: 10px; align-items: start; }
    .topic-items input { accent-color: #8d80ff; }
    .topic-items small { display: block; color: #c7cad5; font-size: 12px; margin-top: 3px; line-height: 1.35; }
    .textarea { min-height: 170px; white-space: pre-wrap; font: 15px/1.55 Consolas, ui-monospace, monospace; padding: 15px; border: 1px solid rgba(255,255,255,0.16); border-radius: 8px; background: #121720; color: #dfe3ef; }
    .helper { color: #aeb3c0; font-size: 13px; margin-top: 9px; }
    .site-toggle-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .site-toggle-card { display: grid; grid-template-columns: 46px 1fr auto; gap: 12px; align-items: center; padding: 14px; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; background: #151922; }
    .switch { width: 42px; height: 24px; border-radius: 999px; background: #3b3e47; padding: 3px; }
    .switch i { display: block; width: 18px; height: 18px; border-radius: 50%; background: #c9ccd4; }
    .switch.enabled { background: #5a50bd; }
    .switch.enabled i { margin-left: 18px; background: #fff; }
    .site-copy strong, .site-copy span, .site-copy small { display: block; }
    .site-copy span { color: #cbd0db; font-size: 13px; margin-top: 3px; }
    .site-copy small { color: #9ca3b1; font-size: 12px; margin-top: 5px; }
    .site-state { color: #cbd0db; font-size: 12px; }
    .footer-panel { display: flex; justify-content: space-between; align-items: center; color: #c9c6ff; background: rgba(92,75,184,0.25); border-color: #6656d8; }
    .footer-panel span { flex: 1; margin-left: 12px; color: #d8d6ff; }
    .footer-panel a { color: #d8d6ff; font-weight: 800; }

    .content-page { display: grid; grid-template-columns: 220px 1fr; gap: 28px; padding: 36px 70px; }
    .rail { display: flex; flex-direction: column; gap: 16px; padding: 20px; border-right: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; }
    .feed { display: flex; flex-direction: column; gap: 18px; }
    .story { position: relative; display: grid; grid-template-columns: 230px 1fr; gap: 20px; min-height: 190px; padding: 18px; border-radius: 8px; background: #202938; border: 1px solid rgba(255,255,255,0.12); }
    .shell { outline: 2px solid rgba(255,255,255,0.22); overflow: hidden; }
    .blurred-story, .video-inner { filter: blur(10px); user-select: none; pointer-events: none; display: grid; grid-template-columns: 230px 1fr; gap: 20px; }
    .despoilerze-overlay { position: absolute; left: 18px; top: 18px; z-index: 5; color: #fff; }
    .despoilerze-card { display: inline-block; max-width: 360px; background: rgba(0,0,0,0.88); border: 1px solid rgba(255,255,255,0.28); border-radius: 8px; padding: 10px 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); color: #fff; }
    .despoilerze-title { font-weight: 800; margin-bottom: 4px; font-size: 14px; }
    .despoilerze-reason { font-size: 12px; line-height: 1.35; opacity: 0.85; margin-bottom: 8px; }
    .despoilerze-card button { border: 1px solid rgba(255,255,255,0.35); border-radius: 5px; padding: 4px 8px; background: rgba(255,255,255,0.12); color: #fff; cursor: pointer; font-size: 12px; margin-right: 6px; }
    .video-page { position: relative; padding: 42px 60px; }
    .video-list { width: 720px; display: flex; flex-direction: column; gap: 18px; }
    .video { position: relative; display: grid; grid-template-columns: 260px 1fr; gap: 20px; min-height: 164px; padding: 16px; border-radius: 8px; background: #202938; border: 1px solid rgba(255,255,255,0.12); }
    .video-thumb { height: 132px; border-radius: 6px; background: linear-gradient(135deg, #e5484d, #635bff); }
    .hidden-video { outline: 2px solid rgba(255,255,255,0.22); }
  `;
}
