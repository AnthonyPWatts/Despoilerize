# DeSpoilerze v0.1 — no React

**DeSpoilerze** is a local-first browser extension that hides likely sports-result spoilers while you are in Catch-up Mode.


This variant intentionally avoids React. The popup and options pages use plain HTML, CSS, and TypeScript.

The first version focuses on the highest-risk use case:

> Wake up, plan to watch F1 highlights later, scroll headlines, and accidentally see the result.

## What this version does

- Chrome/Edge Manifest V3 extension
- Catch-up Mode toggle
- Expiry shortcuts: 2h, Tonight, 24h, Manual
- Sensitivity modes: Gentle, Balanced, Lockdown
- F1 rule pack
- Basic football rule pack
- Custom protected terms
- Trusted sites
- Headline/card scanning
- Thumbnail/card blurring
- Reveal once
- Reveal all on current page
- MutationObserver support for dynamic feeds

## Privacy stance

This version is local-first.

- No account
- No server
- No AI API
- No analytics
- Page content is scanned locally in the browser

## Install for local development

```bash
npm install
npm run build
```

Then in Chrome or Edge:

1. Open `chrome://extensions` or `edge://extensions`
2. Enable Developer mode
3. Click **Load unpacked**
4. Select the generated `dist` folder

## Development

```bash
npm run dev
```

Then reload the extension from the browser's extensions page after each rebuild.

## Tests

```bash
npm test
```

## Current limitations

- Uses broad `<all_urls>` host permission for v0.1 simplicity.
- The scanner is intentionally aggressive in Lockdown mode.
- Site-specific adapters are basic; YouTube/BBC/Google/Reddit will need refinement after real browsing tests.
- It does not yet use official race calendars or event windows.
- It does not yet provide a "safe route to highlights" workflow.

## Suggested manual test

1. Build and load the extension.
2. Turn on Catch-up Mode.
3. Set sensitivity to Lockdown.
4. Visit YouTube, Google News, BBC Sport, Reddit, or any headline-heavy page.
5. Search or browse for F1-related content.
6. Confirm likely spoiler cards are blurred.
7. Use Reveal once or Reveal all on page.
