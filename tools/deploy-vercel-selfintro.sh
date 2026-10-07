#!/usr/bin/env bash
# 把根目录的旧版「自我介绍站」部署成一个【独立】的 Vercel 项目，
# 与作品集页 xzy-cyber-profile 分开，互不覆盖。
#
# 背景：根目录 index.html（熊昭轶 · 梦逍遥）本来也部署在 xzy-cyber-profile 上，
# 后来被 portfolio/ 的作品集页覆盖掉了。现在把它单独放进 xzy-self-intro，
# 作品集页里的「01 WHO AM I」就指向这个地址。
#
# 依赖文件（只有这 4 个，plugins/ 属另一个项目不部署）：
#   index.html / css/style.css / js/main.js
#   fonts/GeistMono-Variable.woff2 / audio/bgm.m4a
#
# 沿用同一套坑规避：
#   1. 部署源必须放 git 仓库【外】—— 仓库内 deploy 会被 TEAM_ACCESS_REQUIRED 拦下。
#   2. token 从 .secrets 读进环境变量，不出现在命令行文本里，也不落盘到仓库。
#   3. 本机直连 *.vercel.app 会超时（cmcc 宽带），核验走 Clash 代理 7897。
#
# 用法：bash tools/deploy-vercel-selfintro.sh

set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="/tmp/deploy/xzy-self-intro"
# 凭据路径：优先读环境变量 VERCEL_CRED，未设置时回退到用户主目录下的约定位置。
# 不在仓库里写死本机绝对路径（避免泄露用户名与目录结构）。
CRED="${VERCEL_CRED:-$HOME/.secrets/vercel/credentials.env}"
PROJECT="xzy-self-intro"
LIVE="https://xzy-self-intro.vercel.app"

VERCEL_TOKEN="$(sed -n 's/^VERCEL_TOKEN=//p' "$CRED" | tr -d '\r' | tr -d '"' | tr -d "'")"
if [ -z "$VERCEL_TOKEN" ]; then
  echo "✗ 未读到 VERCEL_TOKEN，检查 $CRED" >&2
  exit 1
fi

echo "→ 同步自我介绍站到 $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/css" "$DEPLOY_DIR/js" "$DEPLOY_DIR/fonts" "$DEPLOY_DIR/audio"
cp "$SRC/index.html" "$DEPLOY_DIR/"
cp "$SRC/css/style.css" "$DEPLOY_DIR/css/"
cp "$SRC/js/main.js" "$DEPLOY_DIR/js/"
cp "$SRC/fonts/GeistMono-Variable.woff2" "$DEPLOY_DIR/fonts/"
cp "$SRC/audio/bgm.m4a" "$DEPLOY_DIR/audio/"

echo "→ 部署内容"
du -sh "$DEPLOY_DIR" 2>/dev/null || true
find "$DEPLOY_DIR" -type f -not -path '*/.vercel/*' | sed "s|$DEPLOY_DIR|   .|"

cd "$DEPLOY_DIR"
if [ ! -d .vercel ]; then
  echo "→ 首次链接项目 $PROJECT"
  vercel link --project "$PROJECT" --yes --token "$VERCEL_TOKEN"
fi

echo "→ 部署到生产环境"
vercel deploy --prod --yes --token "$VERCEL_TOKEN"

rm -f "$DEPLOY_DIR/.env.local"
echo "✓ 完成。生产地址：$LIVE"
