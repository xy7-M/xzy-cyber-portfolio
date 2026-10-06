# -*- coding: utf-8 -*-
"""
生成工牌背面 v2 设计稿 SVG。

尺寸 900 x 1256，与 card.glb 背面 UV 矩形（0.4986 x 0.755 -> 比例 0.716）同比例，
所以这张 SVG 可以直接当作 card-back.webp 的源。

内容：
  03 SYSTEM  能力系统  -> 3 张能力卡（Agent 驾驶员 / 全栈网站 / 本地交付）
  04 ARCHIVE 项目档案  -> 4 张项目卡（乔布斯艺术 / To-Do List / 全英视频摘录 / GitHub）

输出：
  card-back-v2.svg          900 宽主稿
  card-back-v2-inline.svg   680 宽，供对话内联预览
"""
from pathlib import Path
from xml.sax.saxutils import escape as esc

OUT_DIR = Path(__file__).resolve().parent.parent

W, H = 900, 1256
M = 84                      # 左右安全边距
CW = W - 2 * M              # 内容宽 = 732

# 调色板（沿用 front.html / back.html 的赛博配色）
CY = "#00e5ff"
PU = "#a855f7"
PK = "#ff2a6d"
GR = "#38f2a1"
T1 = "#dbe7ff"
T2 = "#8fa0c9"
T3 = "#4a5878"

FONT = "GeistMono, 'Microsoft YaHei UI', 'Microsoft YaHei', monospace"

P = []
A = P.append


def txt(x, y, s, size, fill, ls=0, anchor="start", weight=400, glow=None, opacity=None):
    a = f'x="{x}" y="{y}" font-size="{size}" fill="{fill}"'
    if ls:
        a += f' letter-spacing="{ls}"'
    if anchor != "start":
        a += f' text-anchor="{anchor}"'
    if weight != 400:
        a += f' font-weight="{weight}"'
    if glow:
        a += f' filter="url(#{glow})"'
    if opacity is not None:
        a += f' opacity="{opacity}"'
    return f'<text {a}>{esc(s)}</text>'


def rule(x1, y1, x2, y2, stroke, op=1.0, w=1, grad=None):
    s = f'stroke="url(#{grad})"' if grad else f'stroke="{stroke}" stroke-opacity="{op}"'
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {s} stroke-width="{w}"/>'


# ---------------------------------------------------------------- defs
A(f'''<defs>
  <radialGradient id="bg" cx="0.5" cy="0" r="1.2">
    <stop offset="0" stop-color="#17253f"/>
    <stop offset="0.44" stop-color="#131f34"/>
    <stop offset="1" stop-color="#121c30"/>
  </radialGradient>

  <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
    <path d="M0 0 H44 M0 0 V44" fill="none" stroke="{CY}" stroke-opacity="0.055" stroke-width="1"/>
  </pattern>
  <radialGradient id="fade" cx="0.5" cy="0.38" r="0.72">
    <stop offset="0.28" stop-color="#ffffff"/>
    <stop offset="0.88" stop-color="#000000"/>
  </radialGradient>
  <mask id="gridMask"><rect width="{W}" height="{H}" fill="url(#fade)"/></mask>

  <pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse">
    <rect width="4" height="1" fill="#000000" fill-opacity="0.30"/>
  </pattern>

  <radialGradient id="vig" cx="0.5" cy="0.4" r="0.72">
    <stop offset="0.54" stop-color="#000000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.34"/>
  </radialGradient>

  <linearGradient id="cardC" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{CY}" stop-opacity="0.10"/>
    <stop offset="1" stop-color="{CY}" stop-opacity="0.015"/>
  </linearGradient>
  <linearGradient id="cardP" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{PU}" stop-opacity="0.09"/>
    <stop offset="1" stop-color="{CY}" stop-opacity="0.02"/>
  </linearGradient>
  <linearGradient id="cardHot" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{PK}" stop-opacity="0.14"/>
    <stop offset="1" stop-color="{PK}" stop-opacity="0.02"/>
  </linearGradient>

  <linearGradient id="lineFade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{CY}" stop-opacity="0.55"/>
    <stop offset="1" stop-color="{CY}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="midGlow" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{CY}" stop-opacity="0"/>
    <stop offset="0.5" stop-color="{CY}" stop-opacity="1"/>
    <stop offset="1" stop-color="{CY}" stop-opacity="0"/>
  </linearGradient>

  <filter id="gS" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="2.4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="gM" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="gL" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="7" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="edgeGlow" x="-8%" y="-8%" width="116%" height="116%">
    <feGaussianBlur stdDeviation="26" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>''')

# ---------------------------------------------------------------- 背景
A(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
A(f'<rect width="{W}" height="{H}" fill="url(#grid)" mask="url(#gridMask)"/>')

# ---------------------------------------------------------------- 头部
# 注意：卡片顶部正中是金属卡扣的遮挡区（约占卡宽 0.42~0.60）。
# 顶栏文字必须收在左侧 0.37 以内，否则会被夹子压住——实测
# 「MENGXIAOYAO · 梦逍遥」的「梦逍遥」正好落在遮挡区里，所以只保留英文。
A(txt(M, 113, "MENGXIAOYAO", 29, CY, ls=5, glow="gS"))
A(f'<circle cx="672" cy="105" r="7" fill="{GR}" filter="url(#gM)"/>')
A(txt(W - M, 114, "ONLINE", 26, GR, ls=4, anchor="end", glow="gS"))
A(rule(M, 148, W - M, 148, CY, 0.62, 1, grad="lineFade"))

# ---------------------------------------------------------------- section 标题工具
def section(y, no, en, zh, color):
    """y = 方框顶边。返回该 section 的说明文字。"""
    out = []
    out.append(f'<rect x="{M}" y="{y}" width="38" height="38" fill="{color}" fill-opacity="0.08" '
               f'stroke="{color}" stroke-opacity="0.75" stroke-width="1.5"/>')
    out.append(txt(M + 19, y + 27, no, 22, color, ls=1, anchor="middle"))
    out.append(txt(M + 54, y + 30, en, 34, "#ffffff", ls=7, glow="gM"))
    en_w = len(en) * (34 * 0.62 + 7)
    zh_x = M + 54 + en_w + 16
    out.append(txt(zh_x, y + 28, zh, 22, CY, ls=2))
    zh_w = len(zh) * 24
    out.append(rule(zh_x + zh_w + 20, y + 19, W - M, y + 19, CY, 0.28))
    return "".join(out)


# ---------------------------------------------------------------- 03 SYSTEM 能力卡
SY = 252                    # 卡片顶
SH = 258                    # 卡片高
GAP = 18
COLW = (CW - 2 * GAP) / 3   # 232

CAPS = [
    ("Agent 驾驶员", "AGENT_DRIVER", CY,
     ["熟练使用 WorkBuddy、", "Trae、Codex 等 AI Agent，", "把人工智能变成自己的", "造物流水线。"],
     "terminal"),
    ("全栈网站", "FULLSTACK_BUILDER", CY,
     ["打通全栈网站，前端界面、", "后端逻辑、数据库存储", "都能独立交付。"],
     "code"),
    ("本地交付", "SHIPPER", CY,
     ["掌握电脑 exe 文件下载", "与打包交付，把工具做成", "开箱即用的本地应用。"],
     "download"),
]


def cap_icon(kind, cx, cy):
    c = CY
    if kind == "terminal":
        return (f'<rect x="{cx-15}" y="{cy-13}" width="30" height="26" fill="none" stroke="{c}" stroke-width="2"/>'
                f'<line x1="{cx-15}" y1="{cy-5}" x2="{cx+15}" y2="{cy-5}" stroke="{c}" stroke-width="2"/>'
                f'<path d="M{cx-9} {cy+2} l4 4 l-4 4" fill="none" stroke="{c}" stroke-width="2"/>'
                f'<line x1="{cx+1}" y1="{cy+10}" x2="{cx+9}" y2="{cy+10}" stroke="{c}" stroke-width="2"/>')
    if kind == "code":
        return (f'<path d="M{cx-6} {cy-7} L{cx-13} {cy} L{cx-6} {cy+7}" fill="none" stroke="{c}" stroke-width="2.2"/>'
                f'<path d="M{cx+6} {cy-7} L{cx+13} {cy} L{cx+6} {cy+7}" fill="none" stroke="{c}" stroke-width="2.2"/>'
                f'<line x1="{cx+3}" y1="{cy-9}" x2="{cx-3}" y2="{cy+9}" stroke="{c}" stroke-width="2.2"/>')
    # download
    return (f'<line x1="{cx}" y1="{cy-12}" x2="{cx}" y2="{cy+3}" stroke="{c}" stroke-width="2.2"/>'
            f'<path d="M{cx-7} {cy-3} L{cx} {cy+4} L{cx+7} {cy-3}" fill="none" stroke="{c}" stroke-width="2.2"/>'
            f'<line x1="{cx-12}" y1="{cy+11}" x2="{cx+12}" y2="{cy+11}" stroke="{c}" stroke-width="2.2"/>')


A(section(186, "03", "SYSTEM", "能力系统", PU))

for i, (title, en, col, desc, icon) in enumerate(CAPS):
    x = M + i * (COLW + GAP)
    cx = x + COLW / 2
    A(f'<rect x="{x}" y="{SY}" width="{COLW}" height="{SH}" fill="url(#cardC)" '
      f'stroke="{CY}" stroke-opacity="0.42" stroke-width="1.5"/>')
    A(f'<rect x="{x}" y="{SY}" width="{COLW}" height="2" fill="{CY}" fill-opacity="0.55"/>')
    # 图标
    A(f'<rect x="{cx-21}" y="{SY+28}" width="42" height="42" fill="{CY}" fill-opacity="0.06" '
      f'stroke="{CY}" stroke-opacity="0.55" stroke-width="1.5"/>')
    A(cap_icon(icon, cx, SY + 49))
    # 文字
    A(txt(cx, SY + 112, title, 24, "#ffffff", ls=2, anchor="middle", weight=500))
    A(txt(cx, SY + 138, en, 12.5, PU, ls=2.5, anchor="middle"))
    A(rule(cx - 22, SY + 156, cx + 22, SY + 156, CY, 0.28))
    for j, line in enumerate(desc):
        A(txt(cx, SY + 180 + j * 21, line, 13.5, T2, ls=0.5, anchor="middle"))

# ---------------------------------------------------------------- 04 ARCHIVE 项目卡
AY = 612
AH = 226
AGAP = 16
ACOL = (CW - GAP) / 2       # 357

PROJECTS = [
    ("PROJECT_01", "乔布斯艺术", "JOBS_ART", CY,
     ["把乔布斯的审美与产品思维做成", "可商用、可安装的软件系统。"], "hex"),
    ("PROJECT_02", "To-Do List 待办清单", "TODO_LIST", CY,
     ["以清单为载体，把目标、执行与", "复盘压缩成瞬间可用的效率工具。"], "check"),
    ("PROJECT_03", "全英视频的摘录", "EN_VIDEO_NOTES", PK,
     ["把全英文视频内容翻译成结构化", "笔记，让优质信息可被检索复用。"], "play"),
    ("PROJECT__", "GitHub 持续发布", "XY7-M", PK,
     ["多个项目已在 GitHub 发布，", "持续迭代，无限进步。"], "branch"),
]


def proj_icon(kind, cx, cy, col):
    if kind == "hex":
        return (f'<path d="M{cx} {cy-9} L{cx+8} {cy-4.5} L{cx+8} {cy+4.5} L{cx} {cy+9} '
                f'L{cx-8} {cy+4.5} L{cx-8} {cy-4.5} Z" fill="none" stroke="{col}" stroke-width="2"/>'
                f'<circle cx="{cx}" cy="{cy}" r="3" fill="{col}"/>')
    if kind == "check":
        return (f'<rect x="{cx-9}" y="{cy-10}" width="18" height="20" fill="none" stroke="{col}" stroke-width="2"/>'
                f'<path d="M{cx-5} {cy-2} l3 3 l7 -7" fill="none" stroke="{col}" stroke-width="2"/>'
                f'<line x1="{cx-4}" y1="{cy+5}" x2="{cx+5}" y2="{cy+5}" stroke="{col}" stroke-width="2"/>')
    if kind == "play":
        return (f'<rect x="{cx-11}" y="{cy-9}" width="22" height="18" fill="none" stroke="{col}" stroke-width="2"/>'
                f'<path d="M{cx-3} {cy-5} L{cx+5} {cy} L{cx-3} {cy+5} Z" fill="{col}"/>')
    # branch
    return (f'<circle cx="{cx-6}" cy="{cy-7}" r="3.2" fill="none" stroke="{col}" stroke-width="2"/>'
            f'<circle cx="{cx-6}" cy="{cy+8}" r="3.2" fill="none" stroke="{col}" stroke-width="2"/>'
            f'<circle cx="{cx+7}" cy="{cy}" r="3.2" fill="none" stroke="{col}" stroke-width="2"/>'
            f'<path d="M{cx-6} {cy-4} V {cy+5}" stroke="{col}" stroke-width="2"/>'
            f'<path d="M{cx-6} {cy+2} C {cx-6} {cy} {cx+7} {cy} {cx+7} {cy-3}" fill="none" stroke="{col}" stroke-width="2"/>')


A(section(546, "04", "ARCHIVE", "项目档案", PU))

for i, (tag, title, en, col, desc, icon) in enumerate(PROJECTS):
    x = M + (i % 2) * (ACOL + GAP)
    y = AY + (i // 2) * (AH + AGAP)
    hot = (icon == "branch")
    bg = "url(#cardHot)" if hot else "url(#cardP)"
    stroke = PK if hot else CY
    sop = 0.55 if hot else 0.34
    A(f'<rect x="{x}" y="{y}" width="{ACOL}" height="{AH}" fill="{bg}" '
      f'stroke="{stroke}" stroke-opacity="{sop}" stroke-width="1.5"/>')
    if hot:
        A(f'<rect x="{x}" y="{y}" width="{ACOL}" height="2" fill="{PK}" fill-opacity="0.7"/>')
    A(txt(x + 24, y + 32, tag, 12.5, T3, ls=2))
    A(proj_icon(icon, x + ACOL - 34, y + 40, PK))
    A(txt(x + 24, y + 94, title, 26, "#ffffff", ls=1, weight=500))
    A(txt(x + 24, y + 118, en, 12.5, PU, ls=2))
    A(rule(x + 24, y + 136, x + 64, y + 136, CY, 0.3))
    for j, line in enumerate(desc):
        A(txt(x + 24, y + 158 + j * 21, line, 13.5, T2, ls=0.5))
    if hot:
        A(f'<rect x="{x+24}" y="{y+186}" width="118" height="26" fill="{PK}" fill-opacity="0.14" '
          f'stroke="{PK}" stroke-opacity="0.8" stroke-width="1.5"/>')
        A(txt(x + 83, y + 204, "OPEN GITHUB", 12, PK, ls=1.5, anchor="middle"))
    else:
        A(txt(x + 24, y + 206, "VIEW_ARCHIVE  →", 12.5, CY, ls=2, glow="gS"))

# ---------------------------------------------------------------- 落款
A(rule(335, 1108, 565, 1108, CY, 1, 1.2, grad="midGlow"))
A(txt(W / 2, 1152, "梦逍遥", 32, "#ffffff", ls=10, anchor="middle", weight=600, glow="gM"))
A(txt(W / 2, 1188, "XY--M · 造物 · 求索 · 无限进步", 19, T3, ls=5, anchor="middle"))

# ---------------------------------------------------------------- 覆层：扫描线 / 暗角 / 边框
A(f'<rect width="{W}" height="{H}" fill="url(#scan)" opacity="0.55"/>')
A(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')
# 边框内侧再补一圈极淡的青色辉光（原版是 72px/0.20 从内侧压黑，这里压到 0.10、半径收到 56px：
# 保留"屏幕发光"的边缘感，但不再把四角的内容区吃掉）。
A(f'<rect x="1.5" y="1.5" width="{W-3}" height="{H-3}" fill="none" stroke="{CY}" '
  f'stroke-opacity="0.55" stroke-width="3" filter="url(#edgeGlow)"/>')

for cls, x, y, w, h in [("tl", 22, 22, 1, 1), ("tr", W - 80, 22, 1, 1),
                        ("bl", 22, H - 80, 1, 1), ("br", W - 80, H - 80, 1, 1)]:
    d = ""
    if cls == "tl":
        d = f'M{x} {y+58} V{y} H{x+58}'
    elif cls == "tr":
        d = f'M{x} {y} H{x+58} V{y+58}'
    elif cls == "bl":
        d = f'M{x} {y} V{y+58} H{x+58}'
    else:
        d = f'M{x} {y+58} V{y} H{x+58}'
    A(f'<path d="{d}" fill="none" stroke="{CY}" stroke-width="5" filter="url(#gM)"/>')

BODY = "\n".join(P)

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
       f'viewBox="0 0 {W} {H}" font-family="{FONT}">\n{BODY}\n</svg>\n')

(OUT_DIR / "card-back-v2.svg").write_text(svg, encoding="utf-8")

scale = 680 / W
inline = (f'<svg xmlns="http://www.w3.org/2000/svg" width="680" height="{round(H*scale)}" '
          f'viewBox="0 0 680 {round(H*scale)}" font-family="{FONT}">\n'
          f'<g transform="scale({scale:.6f})">\n{BODY}\n</g>\n</svg>\n')
(OUT_DIR / "card-back-v2-inline.svg").write_text(inline, encoding="utf-8")

# ---- 光栅化源：交给 tools/lanyard-assets/render_asset.js 渲染成 card-back.webp ----
BACK_HTML = OUT_DIR / "app/src/components/lanyard/source/back.html"
back_html = f'''<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@font-face{{
  font-family:'GeistMono';
  src:url(data:font/woff2;base64,__GEIST_B64__) format('woff2');
  font-weight:100 900;font-style:normal;font-display:block;
}}
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{W}px;height:{H}px;background:#050a12;overflow:hidden;}}
#target{{position:relative;width:{W}px;height:{H}px;overflow:hidden;}}
#target>svg{{display:block;width:{W}px;height:{H}px;}}
</style></head>
<body>
<div id="target">
{svg}</div>
</body></html>
'''
BACK_HTML.write_text(back_html, encoding="utf-8")

print("ok")
print("main   :", OUT_DIR / "card-back-v2.svg", len(svg), "bytes")
print("inline :", OUT_DIR / "card-back-v2-inline.svg", len(inline), "bytes")
print("back   :", BACK_HTML, len(back_html), "bytes")
