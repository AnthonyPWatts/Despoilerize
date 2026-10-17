"""Prepare website assets from the retained, genuine v1.1 browser captures.

Requires Pillow. Run from any directory; output is confined to this handoff.
Original release captures and the website checkout are never modified.
"""

from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageFont


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SOURCE = REPO / "Releases/v1.1/screenshots/live"
OUTPUT = HERE / "assets"
# Pin the audited main ref so remote source links remain reproducible.
SOURCE_REF = "0a57c9e954bc2d83cd9582bdbfa843751f9506f7"

COPIES = {
    "despoilerize-f1-reveal.png": "03-youtube-reveal-once.png",
    "despoilerize-big-brother-reveal.png": "08-big-brother-reveal-once.png",
    "despoilerize-settings-schedule.png": "04-protection-schedule.png",
    "despoilerize-settings-topics.png": "05-protected-topics.png",
    "despoilerize-popup-active.png": "details/protection-popup.png",
    "despoilerize-popup-caught-up.png": "details/caught-up-popup.png",
    "despoilerize-traitors-pack.png": "details/traitors-pack.png",
    "despoilerize-big-brother-pack.png": "details/big-brother-pack.png",
    "despoilerize-protection-social.png": "02-youtube-protection-on.png",
}


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def describe(path, sources, processing):
    with Image.open(path) as image:
        image.load()
        width, height = image.size
    return {
        "file": str(path.relative_to(HERE)).replace("\\", "/"),
        "width": width,
        "height": height,
        "bytes": path.stat().st_size,
        "sha256": digest(path),
        "sources": sources,
        "processing": processing,
    }


def source_record(relative):
    path = SOURCE / relative
    repo_path = str(path.relative_to(REPO)).replace("\\", "/")
    return {
        "path": repo_path,
        "sha256": digest(path),
        "url": f"https://raw.githubusercontent.com/AnthonyPWatts/Despoilerize/{SOURCE_REF}/{repo_path}",
    }


def main():
    OUTPUT.mkdir(exist_ok=True)
    records = []
    for name, relative in COPIES.items():
        destination = OUTPUT / name
        shutil.copyfile(SOURCE / relative, destination)
        assert digest(destination) == digest(SOURCE / relative)
        records.append(describe(destination, [source_record(relative)], "Byte-for-byte copy; no processing."))

    # A crop, at original scale, of a fully protected F1 result. Retains the
    # complete real warning and both reveal controls; no unblurred result.
    thumbnail = OUTPUT / "despoilerize-protection-preview.png"
    with Image.open(SOURCE / "02-youtube-protection-on.png") as original:
        original.crop((88, 104, 664, 352)).save(thumbnail)
    records.append(describe(thumbnail, [source_record("02-youtube-protection-on.png")],
                            "Crop rectangle [88, 104, 664, 352], left/top inclusive, right/bottom exclusive. No resize or retouching."))

    # A labelled presentation of two untouched native-size popup captures.
    # This is a comparison composition, not one browser screenshot.
    panel = Image.new("RGB", (1280, 800), "#0e1118")
    draw = ImageDraw.Draw(panel)
    font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 25)
    for filename, x, label in (
        ("protection-popup.png", 140, "Protection active"),
        ("caught-up-popup.png", 690, "Session ended"),
    ):
        draw.text((x, 49), label, font=font, fill="#f3f1ed")
        with Image.open(SOURCE / "details" / filename) as popup:
            panel.paste(popup.convert("RGB"), (x, 100))
    comparison = OUTPUT / "despoilerize-popup-states.png"
    panel.save(comparison)
    records.append(describe(comparison,
                            [source_record("details/protection-popup.png"), source_record("details/caught-up-popup.png")],
                            "Labelled side-by-side comparison on a plain background. Both popup screenshots pasted at native size without retouching."))

    # Match the website's existing quality-90-or-smaller-lossless convention.
    responsive = OUTPUT / "responsive"
    responsive.mkdir(exist_ok=True)
    for record in list(records):
        source = HERE / record["file"]
        with Image.open(source) as original:
            image = original.convert("RGB")
            steps = (240, 480) if source.name.endswith("-preview.png") else (480, 640, 960)
            widths = sorted({step for step in steps if step < image.width} | {image.width})
            for width in widths:
                height = round(image.height * width / image.width)
                resized = image.resize((width, height), Image.Resampling.LANCZOS)
                lossy, lossless = BytesIO(), BytesIO()
                resized.save(lossy, "WEBP", quality=90, method=6)
                resized.save(lossless, "WEBP", lossless=True, method=6)
                target = responsive / f"{source.stem}-{width}.webp"
                target.write_bytes(min((lossy.getvalue(), lossless.getvalue()), key=len))
                records.append(describe(target, [{"path": record["file"], "sha256": record["sha256"]}],
                                        "Proportional Lanczos resize; smaller of quality-90 and lossless WebP. Never upscaled."))

    manifest = {
        "preparedOn": "2026-10-17",
        "extensionVersion": "1.1.0",
        "originalCaptureDate": "2026-09-27",
        "sourceRef": SOURCE_REF,
        "note": "Historical v1.1 captures reused for the website. No fresh live-site or installed-extension checks were performed.",
        "assets": records,
    }
    (HERE / "asset-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared and decoded {len(records)} image files; nine originals verified byte for byte.")


if __name__ == "__main__":
    main()
