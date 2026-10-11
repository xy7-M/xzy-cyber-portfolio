# 个人赛博档案站 · 熊昭轶 / 梦逍遥

赛博风格自我介绍网站 — 造物 · 求索 · 无限进步

> 本仓库是**唯一源仓库**，同时承载三个站点（见「仓库与站点」）。历史上并存的
> `xzy-cyber-portfolio-page`、`xzy-cyber-profile-app` 两个仓库已归档，不再维护。

## 本地打开

直接双击根目录 `index.html` 即可，或运行：

```bash
python -m http.server 8000 --directory .
```

然后浏览器打开 http://localhost:8000

## 文件结构

- `index.html` — 页面结构（身份 / 征途 / 能力系统 / 项目档案 / 内核）
- `css/style.css` — 赛博视觉（矩阵雨、霓虹斜切面板、扫描线、故障字、HUD 信息轨）
- `js/main.js` — 矩阵雨、球形粒子云、开机引导、打字机、滚动入场
- `fonts/` — 本地化 Geist Mono 字体，无外部 CDN 依赖
- `audio/bgm.m4a` — 背景音乐
- `portfolio/` — 作品集页（单文件 `index.html` + `fonts/`），独立部署
- `app/` — 同步内容的 React/Vite 版本，`npm run build` 后产物在 `app/dist`
- `tools/` — 部署脚本（`deploy-*.sh`）与截图 / 校验脚本

## 仓库与站点

| 站点 | 源目录 | Vercel 项目 | Root Directory |
| --- | --- | --- | --- |
| https://xzy-self-intro.vercel.app | 仓库根：`index.html` + `css/` `js/` `audio/` `fonts/` | `xzy-self-intro` | `.` |
| https://xzy-cyber-profile.vercel.app | `portfolio/` | `xzy-cyber-profile` | `portfolio` |
| React/Vite 版 | `app/` | `app` | `app` |

- 自我介绍站只依赖 5 个文件：`index.html`、`css/style.css`、`js/main.js`、
  `fonts/GeistMono-Variable.woff2`、`audio/bgm.m4a`；仓库根其余内容（`app/` `tools/`
  `prompts/` `plugins/` 等）由根目录 `.vercelignore` 挡在公开发布之外。
- 作品集页只依赖 `portfolio/index.html` + `portfolio/fonts/*`。`cyber-rooftop-*.mp4` 与
  `portfolio/badge/` 按 `.gitignore` 设计不进 git（部署时由脚本从源目录拷入）；
  scrub 版视频缺失时，页面会自动回退到内联的循环视频。

## 部署

当前状态（2026-10-11）：三个站点仍靠**本地 CLI 上传**，Vercel 项目尚未与本仓库建立 Git 连接，
因此 push 到 `main` 不会自动上线。随时可手动部署：

```bash
bash tools/deploy-vercel-selfintro.sh    # 自我介绍站 → xzy-self-intro
bash tools/deploy-vercel-portfolio.sh    # 作品集页   → xzy-cyber-profile
```

`tools/deploy-vercel.sh` 是历史脚本（曾把根目录自我介绍站推到 `xzy-cyber-profile`，已被
`deploy-vercel-selfintro.sh` 取代），保留仅作追溯。

计划：把 Vercel 的 `xzy-self-intro`、`xzy-cyber-profile` 连接到本仓库并设置上表的
Root Directory，之后 push 即自动部署，脚本退为手动兜底。仓库根已加入 `.vercelignore`
作为该切换的前置保护。

## 仓库收敛记录（2026-10-11）

- `xzy-cyber-portfolio-page`（作品集页 GitHub Pages 镜像；内容过期、Pages 未开启）→ 已归档
- `xzy-cyber-profile-app`（React 版旧快照，`src/App.tsx` 与本仓 `app/` 同源）→ 已归档
- 本地 CLI 部署目录 `D:\Item AI\xzy-self-intro`、`xzy-cyber-profile-deploy`、
  `xzy-cyber-profile-portfolio` → 已打包备份后删除（脚本运行时会重建）

## 历史：专属字体「梦逍遥」（已下线）

早期版本用三个手写 SVG 笔画轮廓做「梦逍遥」艺术字（不依赖字体文件、可无损放大），
字形数据在 `js/mxy-glyph.js`，配 `tools/render-preview.js` 校字。2026-10-06 改版后该模块
整体移除，当前页面不再包含专属字体；如需恢复请查 git 历史。

## 内容要点

- 云南大学本科在读
- 爱好看书、研究 AI；阅读领域：心理学、理财、人物传记
- 熟练使用 WorkBuddy、Trae、Codex 等 AI Agent
- GitHub 已发布项目：jobs-art（乔布斯思维框架）、todo-list（待办清单）、
  lpt-wall（匿名留言墙）、video-translate-studio（视频快译）
- 掌握 UI 图设计、全栈网站打造、电脑 exe 文件下载交付
