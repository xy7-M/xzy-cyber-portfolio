#!/usr/bin/env bash
#
# ⚠️ 已废弃（2026-10-11）：本脚本曾把根目录自我介绍站推到旧域名项目 xzy-cyber-profile。
#    该域名现改作 301 存根（redirect/），请勿再运行，否则会覆盖存根、破坏跳转。
# 一键部署「赛博档案站」到 Vercel
# 目标项目：xzy-cyber-profile  →  https://xzy-cyber-profile.vercel.app
#
# 用法：bash tools/deploy-vercel.sh
#
# 设计要点（都是踩过的坑）：
#  1. 部署源必须放在 git 仓库【外】的临时目录 —— 在 git 仓库内直接 deploy
#     会被 TEAM_ACCESS_REQUIRED 拦下（本地提交者未验证为 Vercel 成员）。
#  2. 只复制静态产物（index.html / css / js / fonts / audio），
#     天然排除 app/（React 版，3 万+ 文件）和一堆 preview*.png。
#  3. token 从 .secrets 读进环境变量，不出现在命令行文本里，也不落盘到仓库。
#  4. 本机直连 *.vercel.app 会超时（cmcc 宽带），但部署走 api.vercel.com 是通的，
#     所以能部署、只是部署后没法从本机 curl 验证 —— 用 vercel inspect 核验。

set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="${DEPLOY_ROOT:-$HOME/deploy}/xzy-cyber-profile-deploy"
# 凭据路径：优先读环境变量 VERCEL_CRED，未设置时回退到用户主目录下的约定位置。
# 不在仓库里写死本机绝对路径（避免泄露用户名与目录结构）。
CRED="${VERCEL_CRED:-$HOME/.secrets/vercel/credentials.env}"
PROJECT="xzy-cyber-profile"

VERCEL_TOKEN="$(sed -n 's/^VERCEL_TOKEN=//p' "$CRED" | tr -d '\r' | tr -d '"' | tr -d "'")"
if [ -z "$VERCEL_TOKEN" ]; then
  echo "✗ 未读到 VERCEL_TOKEN，检查 $CRED" >&2
  exit 1
fi

echo "→ 同步静态文件到 $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cp "$SRC/index.html" "$DEPLOY_DIR/"
rm -rf "$DEPLOY_DIR/css" "$DEPLOY_DIR/js" "$DEPLOY_DIR/fonts"
cp -r "$SRC/css" "$SRC/js" "$SRC/fonts" "$DEPLOY_DIR/"

cd "$DEPLOY_DIR"
if [ ! -d .vercel ]; then
  echo "→ 首次链接项目 $PROJECT"
  vercel link --project "$PROJECT" --yes --token "$VERCEL_TOKEN"
fi

echo "→ 部署到生产环境"
vercel deploy --prod --yes --token "$VERCEL_TOKEN"

rm -f "$DEPLOY_DIR/.env.local"   # 清掉 link 生成的 OIDC token
echo "✓ 完成。生产地址：https://xzy-cyber-profile.vercel.app"