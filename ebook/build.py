"""Build the King's Wisdom ebooks: self-contained HTML + PDF for each book.

Usage:  node ebook/covers/make-covers.js   (only when cover designs change)
        python3 ebook/build.py
Needs:  Python 3, and Node.js with Playwright + Chromium for the PDF step (ebook/pdf.js).
"""
import base64
import html
import re
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"

BOOKS = [
    {
        "slug": "why-you-cant-save-her",
        "title": "Why You Can't Save Her",
        "description": "A King's Wisdom ebook on the savior trap, King's Wisdom's First Law, and what to do instead.",
        "cover_bg": "#0d0c0d",
    },
    {
        "slug": "how-men-choose-a-wife",
        "title": "How Men Choose a Wife",
        "description": "A King's Wisdom ebook for women: a straight-talk guide for women who want more than attention.",
        "cover_bg": "#1d0d16",
    },
]

FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700'
    '&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400'
    '&display=swap" rel="stylesheet">'
)

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
{fonts}
<style>
{css}
</style>
</head>
<body>
{body}
</body>
</html>
"""


def build_html(book):
    css = (SRC / "style.css").read_text()
    body = (SRC / f"{book['slug']}.html").read_text()
    body = body.replace("{{PDF}}", f"{book['slug']}.pdf")
    art = ROOT / "covers" / f"{book['slug']}-cover.jpg"
    if art.exists():
        # Swap the text cover for the cover artwork, embedded so the HTML stays one file.
        data = base64.b64encode(art.read_bytes()).decode()
        cover = (f'<section class="cover-art" style="--cover-bg:{book["cover_bg"]}">'
                 f'<img src="data:image/jpeg;base64,{data}" alt="{html.escape(book["title"])} by King\'s Wisdom">'
                 f'<a class="btn" href="{book["slug"]}.pdf" download>Download PDF</a></section>')
        body = re.sub(r'<section class="cover">.*?</section>', lambda m: cover, body, count=1, flags=re.S)
    out = ROOT / f"{book['slug']}.html"
    out.write_text(TEMPLATE.format(
        title=html.escape(book["title"]),
        description=html.escape(book["description"]),
        fonts=FONTS, css=css, body=body))
    return out


def build_pdfs(paths):
    subprocess.run(["node", str(ROOT / "pdf.js"), *map(str, paths)], check=True)


if __name__ == "__main__":
    built = [build_html(b) for b in BOOKS]
    for b in built:
        print("wrote", b.name)
    build_pdfs(built)
