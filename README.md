# 个人赛博档案站 · 熊昭轶 / 梦逍遥

赛博风格自我介绍网站 — 造物 · 求索 · 无限进步

代码以 MIT 许可开源；自制品内容保留所有权利（详见文末「授权与来源」）。

> 本仓库是**唯一源仓库**，承载「自我介绍站 + 作品集页 + React 版」三部分。
> 两个旧仓库（`xzy-cyber-portfolio-page`、`xzy-cyber-profile-app`）已归档，不再维护。

## 本地打开

直接双击根目录 `index.html` 即可，或运行：

```bash
python -m http.server 8000 --directory .
```

然后浏览器打开 http://localhost:8000
（作品集页在 http://localhost:8000/portfolio/ ，与线上 `/works` 对应）

## 文件结构

- `index.html` — 自我介绍站页面结构（封面 / 身份 / 身份工牌 / 征途 / 能力系统 / 项目档案 / 内核）
- `css/style.css` — 赛博视觉（矩阵雨、霓虹斜切面板、扫描线、故障字、HUD 信息轨；含封面与身份工牌样式）
- `js/main.js` — 矩阵雨、球形粒子云、开机引导、打字机、滚动入场
- `fonts/` — 本地化 Geist Mono 字体，无外部 CDN 依赖
- `portfolio/` — 作品集页（`index.html` + `fonts/` + `badge/` + 两段无人机视频）
- `redirect/` — 旧域名 `xzy-cyber-profile.vercel.app` 的 301 存根
- `vercel.json` — 路由：`/works` → `portfolio/index.html`，`/portfolio/*` → 301 到 `/works`
- `app/` — 同步内容的 React/Vite 版本，`npm run build` 后产物在 `app/dist`
- `tools/` — 部署脚本与截图 / 校验脚本（已废弃项隔离在 `_deprecated/`）

> `index.html` 的**封面**与**身份工牌**直接复用 `portfolio/` 下的资源，不重复内联：
> 封面视频为 `portfolio/cyber-rooftop-dolly-6s.mp4`；工牌为 `portfolio/badge/badge.js`
> （自包含 bundle，贴图按自身 URL 解析到 `portfolio/badge/assets/`）。
> ⚠️ `file://` 直开时浏览器禁止 ES module 导入，3D 工牌会**降级为静态平面图**；
> 需要 3D 交互请走 http（本地 `python -m http.server` 或线上部署）。

## 站点与路由（合并域名后）

| 地址 | 内容 | 来源 |
| --- | --- | --- |
| https://xzy-self-intro.vercel.app/ | 自我介绍站 | 仓库根 `index.html` + `css/` `js/` `audio/` `fonts/` |
| https://xzy-self-intro.vercel.app/works | 作品集页 | `portfolio/index.html`（经根 `vercel.json` 重写） |
| https://xzy-self-intro.vercel.app/portfolio/* | 302/301 跳转到 `/works/*` | 根 `vercel.json` 的 redirects |
| https://xzy-cyber-profile.vercel.app/* （旧域名） | 301 跳转到 `…/works` | `redirect/` 目录（独立 Vercel 项目，Root Directory = `redirect`） |
| React/Vite 版 | — | `app/`（Vercel 项目 `app`，Root Directory = `app`） |

- 仓库根其余内容（`app/` `tools/` `prompts/` `plugins/` `preview-dark/` 等）由根 `.vercelignore`
  挡在公开发布之外；`portfolio/` **不能**屏蔽，`/works` 依赖它。
- 作品集页的视频走**绝对路径**（`/portfolio/cyber-rooftop-*.mp4`）。`/works` 是 rewrite 出来的地址，
  相对路径会被解析到站点根而 404（2026-10-16 实测确认），所以不能用相对引用；
  scrub 版加载失败时会自动回退到循环版。

## 部署（Git 自动部署）

`xzy-self-intro`、`xzy-cyber-profile` 两个 Vercel 项目均已连接本仓库，**push 到 `main` 即自动部署**：
前者 Root Directory = `.`（站点本体），后者 Root Directory = `redirect`（旧域名 301 存根）。

补推送（本机直连 GitHub 会被 cmcc 掐断，走 Clash 代理）：

```bash
git -c http.proxy=http://127.0.0.1:7897 push origin main
```

`tools/` 里的脚本状态：

- `deploy-vercel-selfintro.sh` — 已由 Git 部署接管，**仅作手动兜底**
- `_deprecated/` — 已废弃的 `deploy-vercel.sh` 与 `deploy-vercel-portfolio.sh`（2026-10-16 移入）。
  运行会覆盖旧域名项目、破坏 301 跳转，**请勿运行**；文件保留在 git 历史中以便追溯

## 仓库收敛记录（2026-10-11）

1. 归档 `xzy-cyber-portfolio-page`（作品集页 GitHub Pages 旧镜像）、`xzy-cyber-profile-app`
   （React 版旧快照，`src/App.tsx` 与本仓 `app/` 同源）；归档前给两份 README 加了归档指引。
2. 新增根 `.vercelignore`，把私有目录从公开发布中隔离。
3. `portfolio/cyber-rooftop-scrub.mp4` 纳入 git（+12 MB），保证 Git 部署后作品集页的 scrub 交互可用。
4. 合并域名：作品集页从独立域名搬到 `/works`，旧域名保留 301 跳转，旧分享链接不失效。
5. 删除本地冗余副本：`D:\Item AI\xzy-self-intro`、`xzy-cyber-profile-deploy`、
   `xzy-cyber-profile-portfolio`（备份为 `_backup-vercel-deploy-20261011.zip`）、扣子编程包
   `coze-selfintro`（扣子包）、旧版自介绍副本 `xzy-cloudstudio-deploy`、以及 `To do list/intro-site`（2026-09 最早一版）。

6. 开源准备（2026-10-11）：移除第三方背景音乐（`audio/bgm.m4a` 与 `app/public/audio/` 副本）及页面上的
   音乐开关与播放逻辑；抹掉历史与本机路径；提交作者邮箱统一为 noreply；新增 `LICENSE`（代码 MIT）。

## 变更记录（2026-10-16）

1. **`portfolio/index.html` 瘦身**：把内联的 base64 循环视频（12.58 MB，实为
   `cyber-rooftop-dolly-6s.mp4` 的一份副本）改为引用外部文件，单文件从 **16.46 MB 降到 3.88 MB**。
2. **视频路径改用绝对路径** `/portfolio/cyber-rooftop-*.mp4`：`/works` 由 rewrite 提供，
   相对路径会被解析到站点根并 404（已实测），故不能再依赖相对引用。
3. **废弃部署脚本隔离**：两个已废弃的 Vercel 部署脚本移入 `tools/_deprecated/`，避免误运行破坏 301。

## 授权与来源

- **代码**：MIT 许可，见 [`LICENSE`](LICENSE)。
- **自制品内容**（页面文案、影像、图片、视频等）：除另有说明外**保留所有权利**，转载或商用请先联系作者。
- **字体**：Geist Mono（Vercel 开源，SIL Open Font License 1.1）。
- **背景音乐**：早期版本使用第三方曲目 *it's 6pm but I miss u already.*；为公开仓库的合规考虑**已整体移除**
  （文件、页面上的音乐开关与播放逻辑）。如需背景音乐，请换用免版权或自产曲目。

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

