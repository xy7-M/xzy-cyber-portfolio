# -*- coding: utf-8 -*-
"""一次性修复：portfolio/index.html 里 3D 工牌自包含块被重复追加、尾部粒子雨被覆盖的问题。

成因（app/scripts/standalone-html.mjs 已同步修复）：
  旧切分逻辑从自包含块首往后找【第一个】</script>，但块内先出现的是
  __MXY_BADGE__ 注入脚本自己的闭合标签 —— 于是 before 只切到那里，
  bundle 正文被当作 after 保留，紧接着又追加一份新的：
    · bundle 出现两份 → 体积 16.9MB 涨到 20MB
    · 原本跟在块后面的「粒子雨」脚本被挤掉/覆盖

修复策略：以 loader 收尾锚点精确定位【整个自包含块的末尾】，
        块之后的内容一律取自 git 的干净版本（HEAD），
        这样既去掉重复 bundle，也把粒子雨原样补回。
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "portfolio/index.html"

START_RE = re.compile(r"<!-- =+ 3D 工牌(?:按需加载|（自包含内联版）)")
ANCHOR = "io.observe(stage);"
END = "</script>"


def cut_block(html: str):
    """返回 (块起点, 块终点含闭合标签)。终点用锚点法，不用第一个 </script>。"""
    s = START_RE.search(html)
    if not s:
        return None
    s_idx = s.start()
    a_idx = html.find(ANCHOR, s_idx)
    if a_idx == -1:
        return None
    e_idx = html.find(END, a_idx)
    if e_idx == -1:
        return None
    return s_idx, e_idx + len(END)


def main() -> int:
    cur = INDEX.read_text(encoding="utf-8")
    head = subprocess.run(
        ["git", "show", "HEAD:portfolio/index.html"],
        cwd=ROOT, capture_output=True,
    )
    if head.returncode != 0:
        print("✗ 取不到 git HEAD 版本")
        return 1
    base = head.stdout.decode("utf-8")

    cur_cut = cut_block(cur)
    base_cut = cut_block(base)
    if not cur_cut or not base_cut:
        print("✗ 定位自包含块失败")
        return 1
    cs, ce = cur_cut
    bs, be = base_cut

    block = cur[cs:ce]                 # 当前的块（内容是新贴图，保留）
    tail = base[be:]                   # HEAD 的尾部（含粒子雨），原样补回
    prefix = cur[:cs]                  # 块之前的头部，保留当前版

    n_bundle = block.count('id="mxy-badge-bundle"')
    n_inject = block.count("window.__MXY_BADGE__ =")
    print(f"当前块 {cs}→{ce} ({len(block)} 字符)  bundle={n_bundle} 注入={n_inject}")
    if n_bundle != 1 or n_inject != 1:
        print("✗ 当前块不干净，中止")
        return 1

    print(f"补回的尾部 {be}→ 共 {len(tail)} 字符")
    print(f"  含粒子雨: {'badgeRain' in tail}")
    print(f"  含 </html>: {tail.rstrip().endswith('</html>')}")

    fixed = prefix + block + tail
    print(f"体积 {len(cur)/1048576:.1f} MB → {len(fixed)/1048576:.1f} MB")
    if len(fixed) >= len(cur):
        print("✗ 未变小，中止")
        return 1

    INDEX.write_text(fixed, encoding="utf-8")

    chk = INDEX.read_text(encoding="utf-8")
    print("✓ 已写回")
    print("  复检 bundle 段 =", chk.count('id="mxy-badge-bundle"'))
    print("  复检注入段   =", chk.count("window.__MXY_BADGE__ ="))
    print("  复检粒子雨   =", "badgeRain" in chk)
    print("  复检结尾完整 =", chk.rstrip().endswith("</html>"))
    print("  复检体积 MB  =", round(len(chk.encode()) / 1048576, 1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
