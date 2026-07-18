---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 pbakaus/impeccable（Paul Bakaus 个人出品，Apache-2.0）的 README 与 `skill/SKILL.md`（v3.9.1）编写。个人/产品，非组织官方，但作者知名、项目极流行。

## 速查

- **装**：`npx impeccable install` → `/impeccable init`；更新 `npx impeccable update`
- **命令**：23 个（Build 5 / Evaluate 2 / Refine 6 / Enhance 6 / Fix 3 / Iterate 1）+ 管理命令 `pin`/`unpin`/`hooks`
- **检测**：46 条（27 AI slop + 19 通用质量，后者含 4 条 DESIGN.md 设计系统检查）
- **CLI**：`detect` / `ignores` / `install` / `update` / `link` / `pin`
- **多 agent**：Claude Code / Cursor / Gemini / Codex / GitHub Copilot / Grok / OpenCode / Pi / Kiro / Trae / Rovo Dev / Qoder
- **产物文件**：`PRODUCT.md` + `DESIGN.md`（`init`/`document` 写）；工作文件在 `.impeccable/`
- **许可**：Apache-2.0 ｜ 站点 [impeccable.style](https://impeccable.style) ｜ 作者 Paul Bakaus

## 23 命令全表

| 命令 | 类别 | 作用 |
| --- | --- | --- |
| `craft [feature]` | Build | shape 再 build，端到端做一个功能（含视觉迭代） |
| `shape [feature]` | Build | 写码前先规划 UX/UI |
| `init` | Build | 一次性设置：收集设计上下文，写 `PRODUCT.md`/`DESIGN.md`，配 live，荐下一步 |
| `document` | Build | 从现有代码生成根 `DESIGN.md` |
| `extract [target]` | Build | 把可复用组件与 token 抽进设计系统 |
| `critique [target]` | Evaluate | UX 设计评审：层级、清晰度、情感共鸣（启发式打分） |
| `audit [target]` | Evaluate | 技术质量检查（a11y、性能、响应式） |
| `polish [target]` | Refine | 上线前最后一道、设计系统对齐、就绪度 |
| `bolder [target]` | Refine | 放大平淡/保守的设计 |
| `quieter [target]` | Refine | 收敛过于张扬/过刺激的设计 |
| `distill [target]` | Refine | 削到本质，去繁 |
| `harden [target]` | Refine | 生产就绪：错误处理、i18n、文本溢出、边界 |
| `onboard [target]` | Refine | 首次使用流、空状态、激活路径 |
| `animate [target]` | Enhance | 加有目的的动效 |
| `colorize [target]` | Enhance | 给单色 UI 引入策略性颜色 |
| `typeset [target]` | Enhance | 修字体选择、层级、字号 |
| `layout [target]` | Enhance | 修间距、节奏、视觉层级 |
| `delight [target]` | Enhance | 加个性与记忆点 |
| `overdrive [target]` | Enhance | 推过常规上限的技术级效果 |
| `clarify [target]` | Fix | 改 UX 文案、标签、错误信息 |
| `adapt [target]` | Fix | 适配不同设备/屏幕 |
| `optimize [target]` | Fix | 诊断并修 UI 性能 |
| `live` | Iterate | 视觉变体模式：浏览器里选元素、生成变体 |

管理命令：`pin <command>`（建 `/<command>` 独立快捷方式）· `unpin <command>` · `hooks <on\|off\|status\|ignore-rule\|ignore-file\|ignore-value\|reset>`。

## 46 检测清单

### AI slop（27）

| 类别 | 规则 id |
| --- | --- |
| 边框/结构 | `side-tab` · `border-accent-on-rounded` · `nested-cards` · `gpt-thin-border-wide-shadow` |
| 字体/排版 | `overused-font` · `single-font` · `flat-type-hierarchy` · `italic-serif-display` · `oversized-h1` · `extreme-negative-tracking` |
| 色彩 | `gradient-text` · `ai-color-palette` · `cream-palette` · `dark-glow` |
| 装饰/间距 | `monotonous-spacing` · `icon-tile-stack` · `repeating-stripes-gradient` · `codex-grid-background` · `image-hover-transform` |
| 段标/eyebrow | `hero-eyebrow-chip` · `repeated-section-kickers` · `numbered-section-markers` |
| 动效 | `bounce-easing` |
| 文案 | `em-dash-overuse` · `marketing-buzzword` · `aphoristic-cadence` · `theater-slop-phrase` |

### 通用质量（19，含 4 条 DESIGN.md 设计系统检查）

| 类别 | 规则 id |
| --- | --- |
| 对比/图像 | `low-contrast` · `gray-on-color` · `broken-image` |
| 排版可读性 | `line-length` · `tight-leading` · `tiny-text` · `all-caps-body` · `wide-tracking` · `justified-text` |
| 布局/溢出 | `cramped-padding` · `body-text-viewport-edge` · `text-overflow` · `clipped-overflow-container` · `layout-transition` |
| 结构语义 | `skipped-heading` |
| 设计系统（需 DESIGN.md） | `design-system-font` · `design-system-color` · `design-system-radius` · `design-system-font-size` |

## 安装方式

| 方式 | 命令 | 适用 |
| --- | --- | --- |
| **CLI 安装器（推荐）** | `npx impeccable install` / `update` | 自动检测 harness，选 provider/scope |
| **Git submodule** | `git submodule add … .impeccable` + `npx impeccable link` | 团队 vendored、随 Git 更新 |
| **Plugin** | Claude Code `/plugin marketplace add pbakaus/impeccable`；Grok `grok plugin install pbakaus/impeccable --trust` | 插件市场 |
| **官网下载** | 到 [impeccable.style](https://impeccable.style) 下 ZIP | 手动 |
| **仓库复制** | `cp -r dist/<tool>/… your-project/` | 各工具目录 |

`link` 的 provider 可选：`claude`、`cursor`、`gemini`、`codex`、`github`、`opencode`、`pi`、`qoder`、`trae`、`trae-cn`、`rovo-dev`。

## 多 agent 与安装位置

技能跨 agent 安装到各自的 skills 目录（`.{agent}/skills/impeccable/`）。支持的工具：

Cursor · Claude Code · GitHub Copilot · Gemini CLI · Codex CLI · Grok Build · OpenCode · Pi · Kiro · Trae（国内/国际两版）· Rovo Dev · Qoder。

- **Codex**：用 skills 而非 `/prompts:` 命令，打开 `/skills` 或输 `$impeccable`；repo-local 装在 `.agents/skills/`，用户级在 `~/.agents/skills/`；install/update 后要在 `/hooks` 批准项目 hook
- **GitHub Copilot**：用 `.github/skills/`

## design hook

在 Claude Code / GitHub Copilot / Codex / Cursor 上，`install`/`update` 会装 provider 原生 hook manifest：编辑 UI 文件后自动跑 detector 并把 findings 回灌 agent 流。**Claude Code / Copilot / Codex 在编辑后提示，Cursor 在坏写入落地前拦截**。hook 生命周期设置在 `.impeccable/config.json` 的 `hook` 键，detector 忽略项在 `detector` 键（与 `detect` 共享）。

## 产物与工作目录

- `PRODUCT.md` / `DESIGN.md`：`init`/`document` 生成的设计上下文（后续命令都读）
- `.impeccable/`：运行时工作文件（截图、live 会话/预览、缓存、config）。**追踪** `config.json`/`live/config.json`/`design.json`/`critique/*.md`；**忽略** 截图、`config.local.json`、`hook.cache.json` 等（README 提供成块 `.gitignore`，含 `# impeccable-ignore-start/end` 标记）

## 资源链接

- 仓库：[pbakaus/impeccable](https://github.com/pbakaus/impeccable)（Apache-2.0）
- 站点/文档：[impeccable.style](https://impeccable.style) · [detector](https://impeccable.style/docs/detector) · [hooks](https://impeccable.style/docs/hooks)
- npm：[impeccable](https://www.npmjs.com/package/impeccable)
- 案例：[Neo Mirai 前后对比](https://impeccable.style/cases/neo-mirai)
- 作者：[Paul Bakaus](https://www.paulbakaus.com)（[@pbakaus](https://github.com/pbakaus)）
- 相关叶：[Vercel Agent Skills](../vercel-agent-skills/) · [Anthropic Agent Skills 规范](../agent-skills-spec/)
