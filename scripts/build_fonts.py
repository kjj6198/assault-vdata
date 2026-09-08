"""Subset LINE Seed TW to the characters this site renders.

All visible text comes from the repository: UI copy in src/ and labels in data/.
The subset therefore stays complete as long as this script runs after copy or
data changes:

    .venv/bin/python scripts/build_fonts.py

The official release zip is downloaded from seed.line.me when it is not cached.
LINE Seed TW is licensed under the SIL Open Font License 1.1; the license text
ships next to the font files.
"""

from __future__ import annotations

import io
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
ZIP_URL = "https://seed.line.me/src/images/fonts/LINE_Seed_TW.zip"
CACHE = ROOT / ".context" / "LINE_Seed_TW.zip"
OUT = ROOT / "public" / "fonts"
WEIGHTS = {"Rg": "Regular", "Bd": "Bold"}
TEXT_SOURCES = [*ROOT.glob("src/**/*.ts"), *ROOT.glob("src/**/*.tsx")]
DATA_SOURCES = [ROOT / "data" / "clean.json", ROOT / "data" / "population" / "clean.json"]
FIXED_RANGES = [
    (0x20, 0x7E),  # ASCII
    (0x2000, 0x206F),  # general punctuation: dashes, ellipsis, quotes
    (0x2190, 0x2199),  # arrows
    (0x3000, 0x303F),  # CJK punctuation
    (0xFF00, 0xFF5E),  # full-width forms
]


def strings_in(value: object, out: set[str]) -> None:
    if isinstance(value, str):
        out.update(value)
    elif isinstance(value, dict):
        for item in value.values():
            strings_in(item, out)
    elif isinstance(value, list):
        for item in value:
            strings_in(item, out)


def characters() -> set[str]:
    chars: set[str] = set()
    for path in TEXT_SOURCES:
        chars.update(path.read_text(encoding="utf-8"))
    for path in DATA_SOURCES:
        strings_in(json.loads(path.read_text(encoding="utf-8")), chars)
    for start, end in FIXED_RANGES:
        chars.update(chr(code) for code in range(start, end + 1))
    return {c for c in chars if ord(c) >= 0x20 and c not in "  "}


def load_zip() -> zipfile.ZipFile:
    if not CACHE.exists():
        CACHE.parent.mkdir(exist_ok=True)
        print(f"downloading {ZIP_URL}")
        urllib.request.urlretrieve(ZIP_URL, CACHE)
    return zipfile.ZipFile(CACHE)


def main() -> int:
    chars = characters()
    archive = load_zip()
    OUT.mkdir(parents=True, exist_ok=True)
    license_name = next(n for n in archive.namelist() if n.endswith("license.txt") and "__MACOSX" not in n)
    (OUT / "LINESeedTW-LICENSE.txt").write_bytes(archive.read(license_name))
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    for code, name in WEIGHTS.items():
        source = next(
            n for n in archive.namelist() if n.endswith(f"WOFF2/LINESeedTW_OTF_{code}.woff2") and "__MACOSX" not in n
        )
        font = TTFont(io.BytesIO(archive.read(source)))
        subsetter = subset.Subsetter(options)
        subsetter.populate(text="".join(sorted(chars)))
        subsetter.subset(font)
        target = OUT / f"LINESeedTW-{name}.woff2"
        font.save(target)
        print(f"{target.relative_to(ROOT)}: {target.stat().st_size // 1024} KB, {len(chars)} characters requested")
    return 0


if __name__ == "__main__":
    sys.exit(main())
