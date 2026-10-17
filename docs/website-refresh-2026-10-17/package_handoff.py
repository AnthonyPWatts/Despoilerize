"""Verify prepared images and package the website-agent handoff."""

from hashlib import sha256
from html import escape
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from PIL import Image


HERE = Path(__file__).resolve().parent
CAPTIONS = {
    "despoilerize-f1-reveal.png": "Formula 1 in Lockdown: one result deliberately revealed while others remain protected.",
    "despoilerize-big-brother-reveal.png": "Big Brother in Lockdown: episode 11 deliberately revealed; episode 12 stays protected. This is a viewer choice, not automatic episode tracking.",
    "despoilerize-settings-schedule.png": "The weekend schedule and I'm caught up in settings. Changes save automatically.",
    "despoilerize-settings-topics.png": "Grouped protection packs and custom terms. Entertainment is collapsed; dedicated choices appear in the detail captures.",
    "despoilerize-popup-active.png": "Native popup: temporary protection active, saved weekend schedule unchanged, I'm caught up available.",
    "despoilerize-popup-caught-up.png": "Native popup: session ended, protection off and next scheduled session shown. Relative dates belong to the September capture.",
    "despoilerize-traitors-pack.png": "The Traitors selected independently in Entertainment settings.",
    "despoilerize-big-brother-pack.png": "Big Brother selected independently in Entertainment settings.",
    "despoilerize-protection-social.png": "Formula 1 search results protected in Lockdown. Suggested 1280 by 800 social preview.",
    "despoilerize-protection-preview.png": "Crop of the genuine warning and reveal controls over a protected Formula 1 thumbnail. Suggested homepage and directory preview.",
    "despoilerize-popup-states.png": "Side-by-side comparison of two real v1.1 popup captures: protection active, then session ended. This image is a labelled composition.",
}


def main():
    manifest = json.loads((HERE / "asset-manifest.json").read_text(encoding="utf-8"))
    files = manifest["assets"]
    for entry in files:
        path = HERE / entry["file"]
        assert sha256(path.read_bytes()).hexdigest() == entry["sha256"], path
        with Image.open(path) as image:
            image.load()
            assert image.size == (entry["width"], entry["height"]), path

    (HERE / "asset-captions.json").write_text(json.dumps(CAPTIONS, indent=2) + "\n", encoding="utf-8")
    originals = [entry for entry in files if entry["file"].endswith(".png")]
    figures = []
    for entry in originals:
        path = Path(entry["file"])
        caption = CAPTIONS[path.name]
        variants = [asset for asset in files if asset["file"].startswith(f"assets/responsive/{path.stem}-")]
        srcset = ", ".join(f'{asset["file"]} {asset["width"]}w' for asset in variants)
        figures.append(f'''<figure>
          <a href="{entry['file']}"><img src="{entry['file']}" srcset="{srcset}"
            sizes="(max-width: 700px) 90vw, 960px" width="{entry['width']}" height="{entry['height']}"
            loading="lazy" alt="{escape(caption, quote=True)}"></a>
          <figcaption><strong>{escape(path.name)}</strong> · {entry['width']} × {entry['height']}<br>
            {escape(caption)}<br><small>{escape(entry['processing'])}</small></figcaption>
        </figure>''')

    page = '''<!doctype html><html lang="en-GB"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>DeSpoilerize website refresh handoff — 17 October 2026</title>
    <style>
      *{box-sizing:border-box}body{margin:0;background:#f5f2eb;color:#182c33;font:18px/1.55 system-ui,sans-serif}
      main{max-width:1024px;margin:auto;padding:40px 24px}h1{font-size:clamp(28px,5vw,42px);line-height:1.15}
      a{color:#075d72;text-underline-offset:3px}li{margin:10px 0}figure{margin:40px 0;padding-top:24px;border-top:1px solid #a2afb0}
      img{display:block;max-width:100%;height:auto;margin:0 auto 16px}figcaption{overflow-wrap:anywhere}small{font-size:15px}
      code{overflow-wrap:anywhere}header{border-bottom:2px solid #a05f40;padding-bottom:20px}
    </style><main><header><h1>DeSpoilerize website refresh</h1>
    <p>Audit and asset handoff · 17 October 2026</p>
    <p>The live Chrome Web Store shows v1.1.0, updated 28 September 2026. The website's popup image still shows v0.5.1.
    Its current page lacks an install link, dedicated entertainment-pack details and the session-completion workflow.</p></header>
    <h2>Work raised</h2><ul>
      <li><a href="https://github.com/AnthonyPWatts/AnthonyPWatts.co.uk/issues/35">Website #35: release status, installation, current controls, pack coverage, limitations and metadata</a></li>
      <li><a href="https://github.com/AnthonyPWatts/AnthonyPWatts.co.uk/issues/36">Website #36: gallery, captions, thumbnails, responsive files and social previews</a></li>
      <li><a href="https://github.com/AnthonyPWatts/Despoilerize/issues/7">DeSpoilerize #7: stale pending-review and current-release documentation</a></li>
    </ul><p>The existing website issue #20 already covers a regression case study. No duplicate was raised.</p>
    <h2>Files and provenance</h2><p><a href="despoilerize-website-refresh.zip">Download the complete handoff ZIP</a> ·
    <a href="asset-manifest.json">Image manifest and hashes</a> · <a href="asset-captions.json">Suggested captions</a> ·
    <a href="issues.json">Full issue specifications</a></p>
    <p>11 PNGs and 31 WebP variants. Nine PNGs are unchanged genuine v1.1 captures from 27 September 2026.
    The thumbnail is a documented crop; the popup comparison places two native screenshots side by side with labels.
    No product UI was redrawn. Click each image to open its full-size PNG.</p>
    <p>The sources are pinned to the audited remote commit in the manifest. Copy the required files into the website's
    existing asset structure and update all consumers. The website checkout was left untouched.</p>
    <p>These are retained September captures, not a new October live-site test. No installed-store upgrade or YouTube
    behaviour was tested. No extension code changed, so extension build/tests were not rerun. All 42 images were
    decoded, dimensions and SHA-256 hashes checked; originals were verified byte for byte.</p>
    <h2>Prepared images</h2>''' + "\n".join(figures) + "</main></html>\n"
    (HERE / "handoff.html").write_text(page, encoding="utf-8")

    # Explicit input list prevents the archive including itself or incidental files.
    inputs = [HERE / entry["file"] for entry in files]
    inputs += [HERE / name for name in (
        "asset-manifest.json", "asset-captions.json", "issues.json",
        "prepare_assets.py", "package_handoff.py", "handoff.html",
    )]
    target = HERE / "despoilerize-website-refresh.zip"
    with ZipFile(target, "w", compression=ZIP_DEFLATED) as archive:
        for path in inputs:
            archive.write(path, path.relative_to(HERE).as_posix())
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(inputs) == 48
        for entry in files:
            assert sha256(archive.read(entry["file"])).hexdigest() == entry["sha256"]
    print(f"Verified {len(files)} decoded images and all hashes; ZIP contains {len(inputs)} valid entries ({target.stat().st_size:,} bytes).")


if __name__ == "__main__":
    main()
