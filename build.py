#!/usr/bin/env python3
"""
Zmrzlinový domek — build pro nasazení.

Vezme zdrojové soubory ze složky zmrzlinovy-domek/, zminifikuje HTML, CSS i JS
(vyhodí komentáře a zalomení řádků) a výsledek uloží do zmrzlinovy-domek-v4/dist/.
Z dist/ pak sestaví zmrzlinovy-domek-v4-web.zip připravený pro Netlify Drop.

Spuštění:  python zmrzlinovy-domek-v4/build.py
Potřebuje: Node.js (npx si nástroje stáhne sám)

Pozn.: minifikace není ochrana kódu — zdroj je v prohlížeči vždy dostupný.
Jde o rychlost načtení a o to, aby se ve zdroji neválely interní komentáře.
"""

import hashlib
import os
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

SRC = Path(__file__).resolve().parent
DIST = SRC / "dist"
ZIP = SRC.parent / "zmrzlinovy-domek-v4-web.zip"

# co na web nepatří
SKIP_DIRS = {"_zdroje", "dist", ".claude", "__pycache__", ".git"}
SKIP_FILES = {
    "README.md", "build.py",
    ".DS_Store", "Thumbs.db", "desktop.ini",
}


def run(args):
    """Spustí npx nástroj a vrátí jeho výstup."""
    res = subprocess.run(args, capture_output=True, text=True, shell=True, encoding="utf-8")
    if res.returncode != 0:
        sys.exit(f"CHYBA: {args}\n{res.stderr}")
    return res.stdout


def collect(root):
    out = []
    for base, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for n in names:
            if n in SKIP_FILES:
                continue
            out.append(Path(base) / n)
    return out


def otisky():
    """K adrese každého assetu přidá ?v=<otisk obsahu>.

    Bez toho si prohlížeč po úpravě webu klidně nechá starou fotku nebo starý
    styl — adresa se totiž nezměnila. Otisk se mění s obsahem, takže změněný
    soubor se vždy stáhne znovu a nezměněný zůstane v cache.
    """
    def otisk(p):
        return hashlib.sha1(p.read_bytes()).hexdigest()[:8]

    # obrázky a fonty nejdřív — odkazuje na ně styl i HTML
    obrazky = {}
    for p in (DIST / "assets/img").glob("*"):
        if p.is_file():
            obrazky[p.name] = otisk(p)

    css = DIST / "assets/style.css"
    text = css.read_text(encoding="utf-8")
    for jmeno, h in obrazky.items():
        text = text.replace(f"img/{jmeno}", f"img/{jmeno}?v={h}")
    css.write_text(text, encoding="utf-8")

    # styl a skripty až teď, kdy je jejich obsah konečný
    statika = {"assets/style.css": otisk(css)}
    for js in sorted((DIST / "assets").glob("*.js")):
        statika[f"assets/{js.name}"] = otisk(js)

    for html in DIST.glob("*.html"):
        t = html.read_text(encoding="utf-8")
        for jmeno, h in obrazky.items():
            t = t.replace(f"assets/img/{jmeno}", f"assets/img/{jmeno}?v={h}")
        for cesta, h in statika.items():
            t = t.replace(cesta, f"{cesta}?v={h}")
        html.write_text(t, encoding="utf-8")

    print(f"otisky: {len(obrazky)} obrázků + styl + skript")


def main():
    # 1) čistá kopie zdrojů
    if DIST.exists():
        shutil.rmtree(DIST)
    for src in collect(SRC):
        rel = src.relative_to(SRC)
        dst = DIST / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    before = sum(f.stat().st_size for f in collect(DIST))

    # 2) CSS
    css = DIST / "assets/style.css"
    run(["npx", "--yes", "clean-css-cli", "-O2", "-o", str(css), str(css)])

    # 3) JS
    for js in sorted((DIST / "assets").glob("*.js")):
        run([
            "npx", "--yes", "terser", str(js),
            "--compress", "--mangle",
            "--output", str(js),
        ])

    # 4) HTML
    for html in sorted(DIST.glob("*.html")):
        run([
            "npx", "--yes", "html-minifier-terser",
            "--collapse-whitespace",
            "--remove-comments",
            "--remove-redundant-attributes",
            "--minify-css", "true",
            "--minify-js", "true",
            "-o", str(html), str(html),
        ])

    otisky()

    after = sum(f.stat().st_size for f in collect(DIST))

    # 5) ZIP pro Netlify (soubory v kořeni archivu)
    if ZIP.exists():
        ZIP.unlink()
    files = sorted(collect(DIST), key=lambda p: p.relative_to(DIST).as_posix())
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in files:
            z.write(f, f.relative_to(DIST).as_posix())

    print(f"dist/  {before/1024:.0f} kB -> {after/1024:.0f} kB "
          f"({100 - after/before*100:.0f} % úspora)")
    print(f"{ZIP.name}  {len(files)} souborů, {ZIP.stat().st_size/1024:.0f} kB")


if __name__ == "__main__":
    main()
