"""Build one completely offline HTML file. Python standard library only."""
from pathlib import Path
import base64
import mimetypes
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "source"
OUTPUT = ROOT / "dist"


def asset_data(reference):
    asset = SOURCE / reference
    mime = {
            ".woff": "font/woff",
            ".ttf": "font/ttf",
            ".webp": "image/webp",
            ".mp3": "audio/mpeg",
            ".svg": "image/svg+xml",
        }.get(asset.suffix) or mimetypes.guess_type(asset.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(asset.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def embed_assets(text):
    for reference in set(re.findall(r"assets/[A-Za-z0-9_.-]+", text)):
        text = text.replace(reference, asset_data(reference))
    return text


def script_safe(text):
    return text.replace("</script", "<\\/script")


def main():
    html = (SOURCE / "index.html").read_text(encoding="utf-8")
    css = embed_assets((SOURCE / "styles.css").read_text(encoding="utf-8"))
    config = (SOURCE / "config.js").read_text(encoding="utf-8")
    app = (SOURCE / "app.js").read_text(encoding="utf-8")
    # Photographs are stored only once, even when used in both a heart and a
    # memory card. No network access is needed to resolve these local references.
    image_refs = set(re.findall(r'\bsrc="(assets/[^"]+)"', html))
    config_refs = set(re.findall(r"assets/[A-Za-z0-9_.-]+", config))
    assets = {reference: asset_data(reference) for reference in sorted(image_refs | config_refs)}
    manifest = "window.BIRTHDAY_ASSETS = " + json.dumps(assets, separators=(",", ":")) + ";"
    html = re.sub(r'\bsrc="(assets/[^"]+)"', r'data-asset="\1"', html)
    html = html.replace('href="assets/favicon.svg"', f'href="{asset_data("assets/favicon.svg")}"')
    html = html.replace('<html lang="en">', '<html lang="en" data-standalone="true">')
    html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
    html = html.replace('<script src="config.js" defer></script>', f'<script id="birthday-assets">{script_safe(manifest)}</script>\n<script id="base-config">\n{script_safe(config)}\n</script>\n<script id="personalised-config">/*PERSONALISATION*/</script>')
    html = html.replace('<script src="app.js" defer></script>', "")
    html = html.replace("</body>", f'<script id="birthday-app">\n{script_safe(app)}\n</script>\n</body>')
    OUTPUT.mkdir(exist_ok=True)
    destination = OUTPUT / "index.html"
    destination.write_text(html, encoding="utf-8")
    print(f"Built {destination} ({destination.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
