# 提示词 1 · 集成 React Bits 官方 Lanyard 组件（赛博风格版）

> 用途：在当前项目「个人赛博档案站」的 React 版（`app/`）中直接集成 React Bits 官方 Lanyard 3D 工牌组件。
> 本版已把原提示词里模糊的「保持风格和质感」替换为下方**第六节「梦逍遥赛博风格规范」**，其余功能性要求全部保留。
> 目标页面：视频区块之后的**下一页**（下滑进入的个人介绍页），**严禁插入视频区域内**。

---

## 一、任务

请在我当前项目「个人赛博档案站」中直接集成 React Bits 官方 Lanyard 组件：

https://reactbits.dev/components/lanyard

**项目定位（重要，别搞错目录）**：本站有两套实现 —— 根目录的纯 HTML 版（`index.html` + `css/style.css` + `js/main.js`）和 `app/` 目录下的 **React + Vite 版**。**Lanyard 是 React 组件，本次集成只针对 `app/`**，关键目录：

| 路径 | 用途 |
|---|---|
| `app/src/sections/` | 页面区块（每个区块一个 tsx 文件） |
| `app/src/components/lanyard/` | Lanyard 3D 组件与素材 |
| `app/src/config.ts` | 全站文案配置（含 `personalCardConfig`） |
| `app/src/App.tsx` | 区块编排与路由 |

先检查当前项目技术栈、目录结构、package.json 和现有 3D 相关依赖，选择与当前项目最匹配的 React Bits 官方版本。不要自己仿写吊绳、物理摆动或 3D 工程效果，不要 iframe，直接用 React Bits 官方 Lanyard 组件源码，并按照当前项目结构进行集成。

## 二、依赖

如果缺少依赖，请自动安装并检查版本兼容性，重点检查：three、@react-three/fiber、@react-three/drei、@react-three/rapier、meshline。已有依赖不要重复安装，也不要为了安装 Lanyard 随意升级或降级整个项目依赖。

**当前项目已确认的版本基线（以此为准，不要擅自变更）：**

| 依赖 | 版本 |
|---|---|
| react / react-dom | ^19.2.0 |
| three / @types/three | ^0.183.2 / ^0.183.1 |
| @react-three/fiber | ^9.8.1 |
| @react-three/drei | ^10.7.9 |
| @react-three/rapier | ^2.2.0 |
| meshline | ^3.3.1 |
| vite / typescript | ^7.2.4 / ~5.9.3 |
| tailwindcss | ^3.4.19 |
| gsap | ^3.14.2 |

## 三、资源

Lanyard 需要使用的 GLB 模型、纹理 PNG 等资源，请正确放到当前项目的 public 或 assets 目录，并修改资源路径确保可以正常加载，不要出现模型或纹理 404。

> 现有素材位置：`app/src/components/lanyard/` 下的 `card.glb`（工牌模型）与 `lanyard.png`（挂绳纹理），集成时先复用，不要重复下载。

## 四、定位与交互

Lanyard 作为我页面中的一个独立 3D 元素使用，不修改我现有页面的布局、文字、图片、导航、背景、动画和交互。保留官方的拖拽、摆动、绳子效果，鼠标拖拽工牌时要自然，松开后有真实回弹和摆动。

根据我自己页面结构，确保 Lanyard 容器尺寸和位置，让它可以在正常嵌入现有设计，而不是全屏覆盖页面。处理好 z-index、pointer-events 和 Canvas 尺寸，保证不会阻挡页面其他按钮、滚动和 hover。

如果当前项目已经使用 Three.js、React Three Fiber 或其他 Canvas，请优先避免重复创建不必要的 3D 环境，并确保不会和现有 3D 内容冲突。

## 五、页面位置（重要，别搞错）

本项目 `app/` 版的区块顺序是：

`Navigation → Hero → Curriculum → CinematicVision（id="cinematic"，内含 <video> 影像区）→ PersonalCard（id="card"）→ AlumniArchives → Footer`

这个组件是放在**视频区块（CinematicVision）的下一页**，也就是 `app/src/sections/PersonalCard.tsx`（`id="card"`），**千万不要插入到 CinematicVision 的视频区域内** —— 下滑才是这个个人介绍页。

该页现有布局（**已实现，请沿用而非重建**）：

- **右侧 `md:w-[54%]`**：3D 工牌，现有调用为 `<Lanyard position={[0, 0, 30]} gravity={[0, -40, 0]} fov={20} transparent />`，容器高度 `clamp(480px, 64vh, 680px)`；
- **左侧 `md:w-[46%]`**：个人博客文案区，内容取自 `app/src/config.ts` 的 `personalCardConfig`（`sectionLabel` / `title` / `paragraphs` / `hint` / `fallbackText`）—— **改文案改 config，不要硬编码进组件**；
- 组件通过 `React.lazy` 按需加载，外层有 `<Suspense>` 降级文案；
- 左右两块用 `gsap` + `IntersectionObserver` 做滚动入场（`opacity 0→1`、`y 40→0`、`stagger 0.12`），新元素需接入同一套入场逻辑；
- 左右两侧与整站保持同一套赛博风格与质感（见第六节）。

## 六、梦逍遥赛博风格规范（本项目视觉基准，必须严格遵循）

> 以下参数取自本站现有设计系统（`css/style.css` 的 `:root` 与 `portfolio/index.html` 的视觉语言）。**任何新增元素都必须与之一致，禁止引入其他风格**（尤其禁止暖琥珀 / 橙黄 / 衬线字体那套模板原始风格）。

### 6.1 色彩令牌

| 用途 | 变量 | 色值 |
|---|---|---|
| 页面底色 | `--bg` | `#04060d` |
| 次级底色 | `--bg-2` | `#070b16` |
| 面板 / 卡片底 | `--panel` | `rgba(8,13,27,.94)` |
| 主色 · 青 | `--cyan` | `#00e5ff` |
| 强调 · 洋红 | `--pink` | `#ff2a6d` |
| 次强调 · 紫 | `--purple` | `#a855f7` |
| 点缀 · 黄 | `--yellow` | `#fde047` |
| 状态 · 绿 | `--green` | `#38f2a1` |
| 正文 | `--text` | `#dbe7ff` |
| 次要文字 | `--dim` | `#8fa0c9` |
| 描边 | `--line` | `rgba(0,229,255,.28)` |

**配色比例**：深色底绝对主导；青 `#00e5ff` 为第一主色；洋红 `#ff2a6d` 只做点睛（高亮 / 强调 / 故障色散）；紫 `#a855f7` 用于次级标签与序号。禁止大面积渐变铺色，禁止暖色（琥珀 / 橙 / 黄褐）作为主色。

> **底色注意**：上表取自根目录纯 HTML 版 `css/style.css` 的 `:root`。`app/` 版各区块的实底底色为 `#050a12`（见 `app/src/App.tsx` 与各 section 的 `background`），与 `--bg #04060d` 同色系。**新增元素请沿用所在区块的现有底色**，不要另起第三种黑。

### 6.2 字体

- 唯一字体族：**GeistMono**（等宽），中文回退 `Microsoft YaHei UI`；
- **必须本地自托管**（`@font-face` 指向本地 woff2），禁止引用任何外部 CDN / Google Fonts；
- 标题用大字号 + 宽字距（`letter-spacing: .1em ~ .4em`），英文标签统一大写。

### 6.3 视觉语言（赛博 HUD）

必须沿用以下元素，不得替换成其他风格：

- **一律直角，无圆角**（`border-radius: 0`）；
- 扫描线覆盖层（`repeating-linear-gradient`，1px 间隔，低透明度）；
- 细噪点 / 颗粒感（低透明度，可选）；
- 暗角 `vignette`；
- 青色细网格背景（44px 栅格，可缓慢平移）；
- 角落括号框（四角 L 形描边）用于强调块；
- 故障字效果（chromatic split：青 / 洋红双层偏移 + `steps()` 硬切闪烁）；
- HUD 信息轨（左右侧竖向等宽小字，含状态 / 时钟 / 索引）；
- 霓虹辉光（`text-shadow` / `box-shadow` 用青色，模糊半径 8~28px，低透明度）。

### 6.4 动效

- 以**滚动驱动**为主，避免自动播放的花哨动画；
- 故障闪烁用 `steps()` 硬切，不做平滑渐变；
- 所有动效必须响应 `prefers-reduced-motion: reduce` 并降级为静态；
- 过渡时长 .15s ~ .9s，缓动 `cubic-bezier(.22,.61,.36,1)`。

### 6.5 组件落位要求（Lanyard 专属）

- Canvas 背景必须**透明**（`gl={{ alpha: true }}`，clearColor alpha 设为 0），让页面底色、网格与扫描线透出；**禁止**给 Canvas 铺白底或纯黑实底；
- 工牌容器定位在右侧栏，尺寸自适应右侧栏宽度，**不得全屏覆盖**；
- `pointer-events` 只作用于工牌本身 —— 页面滚动、左侧博客文案区的 hover 与按钮点击都不得被遮挡；
- 右侧若需要边框 / 发光，使用 `--line` 描边 + 青色 `box-shadow` 辉光；禁止圆角卡片、禁止毛玻璃 `backdrop-filter` 模糊阴影。

## 七、执行流程

先分析项目再实施改造。不需要让我手动复制代码。

## 八、完成后的自检

完成后运行项目并检查：

- Lanyard 是否正常显示；
- GLB 和 PNG 是否加载成功；
- 拖拽是否正常；
- 绳子是否自然；
- 物理摆动是否正常；
- 控制台是否报错；
- 页面布局是否被改变；
- 移动端是否正常；
- `cd app && npm run build` 是否通过（TypeScript + Vite 构建无报错）。

有问题再修复。

## 九、最终汇报

最终告诉我：

1. 新增了哪些文件；
2. 修改了哪些文件；
3. 安装了哪些依赖；
4. Lanyard 在哪里调用（给出文件路径与行号）；
5. 模型和纹理资源放在哪里。

## 十、补充说明

- 素材现状：`app/src/components/lanyard/` 下已有默认素材 `card.glb`（工牌模型）与 `lanyard.png`（挂绳纹理），集成时先复用；
- 若后续要换成自己的工牌正面 / 背面 / 挂绳图，走「提示词 2」；
- 集成完成后请在 `app/` 下执行 `npm run build` 验证构建通过。
