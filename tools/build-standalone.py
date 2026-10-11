# -*- coding: utf-8 -*-
"""把根目录「自我介绍站」打成单文件自包含 HTML，供扣子编程(code.coze.cn) 导入/部署。
输出到仓库外目录，避免污染仓库与 OneDrive 同步。
用法: python tools/build-standalone.py [输出目录]
"""
import base64, os, re, sys, pathlib

SRC = pathlib.Path(__file__).resolve().parent.parent
OUTDIR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(r"/tmp/deploy/coze-selfintro")
OUTDIR.mkdir(parents=True, exist_ok=True)

html = (SRC / "index.html").read_text(encoding="utf-8")
css  = (SRC / "css" / "style.css").read_text(encoding="utf-8")
js   = (SRC / "js" / "main.js").read_text(encoding="utf-8")
font = (SRC / "fonts" / "GeistMono-Variable.woff2").read_bytes()
bgm  = (SRC / "audio" / "bgm.m4a").read_bytes()

css = css.replace("url('../fonts/GeistMono-Variable.woff2')",
                  "url(data:font/woff2;base64," + base64.b64encode(font).decode() + ")")

assert '<link rel="stylesheet" href="css/style.css">' in html, "css link not found"
html = html.replace('<link rel="stylesheet" href="css/style.css">', "<style>\n" + css + "\n</style>")
assert '<script src="js/main.js"></script>' in html, "script tag not found"
html = html.replace('<script src="js/main.js"></script>', "<script>\n" + js + "\n</script>")
html = html.replace('src="audio/bgm.m4a"', 'src="data:audio/mp4;base64,' + base64.b64encode(bgm).decode() + '"')

leftover = [m for m in re.findall(r'(?:src|href)="([^"]+)"', html)
            if not m.startswith(("data:", "#", "http"))
            and not m.startswith("mailto:")]
assert not leftover, "仍有相对外链未内联: " + str(leftover)

out = OUTDIR / "index.html"
out.write_text(html, encoding="utf-8")
print(f"OK  -> {out}  ({out.stat().st_size/1048576:.2f} MB)")
print(f"    内联: font {len(font)/1024:.0f} KB, bgm {len(bgm)/1048576:.2f} MB, css {len(css)/1024:.0f} KB, js {len(js)/1024:.0f} KB")
