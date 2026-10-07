#!/usr/bin/env bash
# 把「WHO AM I」作品集页（portfolio/，含 3D 工牌）部署到 Vercel 生产环境。
#
# 与 tools/deploy-vercel.sh 的区别：
#   那个部署仓库根目录的旧版静态站（index.html + css/js/fonts/audio）；
#   这个部署 portfolio/ 目录下的作品集页，会覆盖同一个线上地址。
#
# 沿用同一套坑规避（原脚本注释里记录的）：
#   1. 部署源必须放 git 仓库【外】—— 在仓库内直接 deploy 会被 TEAM_ACCESS_REQUIRED 拦下。
#   2. token 从 .secrets 读进环境变量，不出现在命令行文本里，也不落盘到仓库。
#   3. 本机直连 *.vercel.app 会超时（cmcc 宽带），验证走 Clash 代理 7897。
#
# 用法：bash tools/deploy-vercel-portfolio.sh

set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="/tmp/deploy/xzy-cyber-profile-portfolio"
# 凭据路径：优先读环境变量 VERCEL_CRED，未设置时回退到用户主目录下的约定位置。
# 不在仓库里写死本机绝对路径（避免泄露用户名与目录结构）。
CRED="${VERCEL_CRED:-$HOME/.secrets/vercel/credentials.env}"
PROJECT="xzy-cyber-profile"

VERCEL_TOKEN="$(sed -n 's/^VERCEL_TOKEN=//p' "$CRED" | tr -d '\r' | tr -d '"' | tr -d "'")"
if [ -z "$VERCEL_TOKEN" ]; then
  echo "✗ 未读到 VERCEL_TOKEN，检查 $CRED" >&2
  exit 1
fi

echo "→ 同步 portfolio 到 $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cp "$SRC/portfolio/index.html" "$DEPLOY_DIR/"
# index.html 现在是自包含版：bundle 源码以 text/plain 内联、3 张 webp 以
# data URL 注入宿主，单文件即可完整跑 3D 工牌。所以不再需要 badge/ 目录
# （远程不再发 3.7MB 的 badge.js 和 180KB 素材，部署更轻）。
rm -rf "$DEPLOY_DIR/fonts" "$DEPLOY_DIR/badge"
cp -r "$SRC/portfolio/fonts" "$DEPLOY_DIR/"
# 循环版本（base: 9.6MB）已 base64 内联进 index.html（单文件预览用），
# 部署版不再单独发。
cp "$SRC/portfolio/cyber-rooftop-scrub.mp4" "$DEPLOY_DIR/"

echo "→ 部署内容"
du -sh "$DEPLOY_DIR" 2>/dev/null || true
find "$DEPLOY_DIR" -maxdepth 1 -mindepth 1 | sed 's|.*/|   |'

cd "$DEPLOY_DIR"
if [ ! -d .vercel ]; then
  echo "→ 首次链接项目 $PROJECT"
  vercel link --project "$PROJECT" --yes --token "$VERCEL_TOKEN"
fi

echo "→ 部署到生产环境"
vercel deploy --prod --yes --token "$VERCEL_TOKEN"

rm -f "$DEPLOY_DIR/.env.local"
echo "✓ 完成。生产地址：https://xzy-cyber-profile.vercel.app"
