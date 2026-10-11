# 个人赛博档案站 · 熊昭轶 / 梦逍遥

赛博风格自我介绍网站 — 造物 · 求索 · 无限进步

## 本地打开

直接双击根目录 `index.html` 即可，或运行：

```bash
python -m http.server 8000 --directory .
```

然后浏览器打开 http://localhost:8000

## 文件结构

- `index.html` — 页面结构（身份 / 征途 / 能力系统 / 项目档案 / 数据面板 / 阅读域 / 内核 / 专属字体）
- `css/style.css` — 赛博视觉（矩阵雨、霓虹斜切面板、扫描线、故障字、HUD 信息轨）
- `js/main.js` — 矩阵雨、球形粒子云、开机引导、打字机、滚动入场、专属字体渲染
- `js/mxy-glyph.js` — 专属艺术字体「梦逍遥」的字形数据（手写 SVG 笔画轮廓）
- `tools/render-preview.js` — 字形校字脚本，渲出 PNG 供人工挑形（`node tools/render-preview.js`）
- `fonts/` — 本地化 Geist Mono 字体，无外部 CDN 依赖
- `app/` — 同步内容的 React/Vite 版本，`npm run build` 后产物在 `app/dist`

## 专属字体「梦逍遥」

三个字是**手写的 SVG 笔画轮廓**，不是字体文件，因此不依赖任何系统字体、可无损放大。

设计对应：飘逸洒脱（横画右端统一起翘、长撇长捺越界收锋）· 无拘无束（包围结构不闭合、
辶底一笔连续不做点断）· 向往自由（舒展越界）· 浪漫主义（青→紫→粉三层渐变 + 霓虹辉光）·
坚定追求（骨架仍是正楷，中轴不动、重心稳定）。

改字形只需编辑 `js/mxy-glyph.js` 的路径数据，然后跑 `node tools/render-preview.js`
在 `tools/` 下生成校字图。注意：**每个字形只能有一个 `<path>`**，渐变才能逐字上色。

## 内容要点

- 云南大学本科在读
- 爱好看书、研究 AI；阅读领域：心理学、理财、人物传记
- 熟练使用 WorkBuddy、Trae、Codex 等 AI Agent
- GitHub 已发布项目：乔布斯艺术、To-Do List 待办清单、全英视频的摘录
- 掌握 UI 图设计、全栈网站打造、电脑 exe 文件下载交付
