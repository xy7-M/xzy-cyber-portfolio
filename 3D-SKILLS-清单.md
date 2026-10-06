# 3D 渲染 Agent Skills 安装清单

> 安装时间：2026-10-05 10:45
> 对应任务：步骤 4 | 个人博客：集成 3D 物理交互组件
> 技术栈：WebGL → Three.js → React Three Fiber (R3F)，物理 `@react-three/rapier`，组件源 React Bits **Lanyard**

## 安装位置（双份，内容一致）

| 目录 | 装前 | 装后 |
|---|---|---|
| `C:\Users\__USER__\.workbuddy-ai\skills\` | 9 | 35 |
| `C:\Users\__USER__\.agents\skills\` | 122 | 148 |

每个 skill 均为一级子目录 + `SKILL.md`，已扁平化处理（原仓库为嵌套结构）。

## 来源仓库

| 仓库 | ★ | License | 装入 skill 数 |
|---|---|---|---|
| [emalorenzo/three-agent-skills](https://github.com/emalorenzo/three-agent-skills) | 55 | MIT | 2 |
| [Impertio-Studio/Three.js-Claude-Skill-Package](https://github.com/Impertio-Studio/Three.js-Claude-Skill-Package) | 19 | MIT | 24 |

## 一、emalorenzo 2 件套（直接命中本任务）

| Skill | 内容 | 对本任务的作用 |
|---|---|---|
| `r3f-best-practices` | 70+ 规则 / 12 类。frontmatter 明确覆盖 `@react-three/fiber`、`@react-three/drei`、`zustand`、`@react-three/postprocessing`、**`@react-three/rapier`**、`leva` | Lanyard 的 R3F 写法、GLTF 加载（`drei-use-gltf`）、Suspense 加载态、re-render 性能 |
| `three-best-practices` | 120+ 规则 / 18 类。含 **physics-integration（Rapier / Cannon-es）**、gltf-loading-optimization、raycasting-optimization、memory-dispose-geometry | 绳索物理、GLB 加载与 DRACO/Meshopt/KTX2、指针拾取、GPU 资源释放 |

## 二、Impertio 24 件套（颗粒度最细，按需激活）

| 分类 | Skill |
|---|---|
| core | `threejs-core-math`、`threejs-core-raycaster`、`threejs-core-renderer`、`threejs-core-scene-graph` |
| impl | `threejs-impl-react-three-fiber`、`threejs-impl-physics`、`threejs-impl-drei`、`threejs-impl-animation`、`threejs-impl-lighting`、`threejs-impl-shadows`、`threejs-impl-post-processing`、`threejs-impl-audio`、`threejs-impl-webgpu`、`threejs-impl-xr`、`threejs-impl-ifc-viewer` |
| syntax | `threejs-syntax-loaders`、`threejs-syntax-geometries`、`threejs-syntax-materials`、`threejs-syntax-controls`、`threejs-syntax-shaders` |
| errors | `threejs-errors-performance`、`threejs-errors-rendering` |
| agents | `threejs-agents-scene-builder`、`threejs-agents-model-optimizer` |

**与本任务最相关的 5 个**：`threejs-impl-react-three-fiber`、`threejs-impl-physics`、`threejs-core-raycaster`、`threejs-syntax-loaders`、`threejs-impl-drei`。

## 安全审计结果：P2（安全）

- 零可执行脚本（仅 `.md` / 冗余 `.zip`），无 `.sh` / `.py` / `.js`
- frontmatter 无 `allowed-tools`、无 `hooks`、无权限声明
- 无 `curl|bash`、无 `eval/exec`、无密钥/凭证读取、无破坏性命令
- 226 个 http 链接全部为文档引用（three.js 官方文档 / npm / credits）
- 26 个 `SKILL.md` 的 `name` / `description` 全部完整

## 校验

- 26 个 skill 在两个目录均存在且含 `SKILL.md`：**26 / 26 通过**
- 两目录文件数一致：**134 / 134**
- 逐 skill 目录树 diff：**无差异**
- 已清理 `.gitkeep` 占位文件

## 注意事项

- **新装的 skill 需重启 WorkBuddy 会话**才会出现在可用列表里。
- 卸载 = 删除对应目录，无残留注册表。
- 更新 = 重新执行本文档的 tarball 下载 + 覆盖安装流程。

## 本次安装踩到的坑（已沉淀为 skill）

新增 skill `install-github-agent-skills`（`~/.workbuddy-ai/skills/` 与 `~/.agents/skills/` 各一份），记录了：

1. `npx add-skill` / `npx skills add` 在 cmcc 网络下不可靠 → 改用 `gh api .../tarball/HEAD` + `tar -xzf --strip-components=1`
2. Bash 工具跑批量 `cp -r` 循环会在第 2~4 次后 SIGTERM → 写成脚本按参数分批（每批 4 个）
3. Impertio 仓库 skill 是嵌套结构 → 安装时必须扁平化
4. PIL/Pillow 本机装不上（pip 报 `from versions: none`）→ 长截图改用 Playwright + base64 data URI + `page.screenshot({clip})`
