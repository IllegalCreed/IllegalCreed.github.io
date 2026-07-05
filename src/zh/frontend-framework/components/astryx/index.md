---
layout: doc
outline: [2, 3]
---

# Astryx

**Meta 出品、内部沉淀 8 年、驱动 13000+ 应用后于 2026 年 6 月开源的 React 设计系统**——样式引擎是同门的 [StyleX](https://stylexjs.com)（**编译期原子化 CSS**），提供 **150+ 无障碍组件**、**品牌级 token 主题**、**内建暗色**、**开箱即用页面模板**，并且**从底层为 AI agent 可操作而设计**（CLI + 托管 MCP server + 机器可读 manifest 契约）。当前 **v0.1.3（Beta，核于 2026-07）**，[MIT](https://github.com/facebook/astryx) 许可。

Astryx 的独特之处不在「又一个组件库」，而在它把三条线拧成一股：

1. **StyleX 编译期样式**——组件样式在**构建期**被编译成原子化 CSS，运行时**零样式计算**、SSR 天然友好、相同声明全局去重。而这层 StyleX **对使用者完全不可见**：你用组件时无需写一行 StyleX，要覆盖样式时用 `className`（Tailwind / CSS Modules / 纯 CSS 皆可）。
2. **受管 npm 依赖 + 一体化 CLI**——组件来自真正的 npm 包 `@astryxdesign/core`（区别于 shadcn 的「复制源码」），配套 `@astryxdesign/cli` 覆盖 `init / component / docs / template / search / hook / swizzle / upgrade / theme build / doctor` 全生命周期；升级走 `upgrade` 的 codemod，深度定制才用 `swizzle` 把源码「换出」。
3. **AI 原生一等公民**——CLI 全局 `--json` 输出**类型化信封** `{ type, data }`、`manifest` 命令返回**自描述的机器可读契约**（每条命令/参数/flag 的类型·choices·默认值，堪称「**命令行的 OpenAPI**」）；配套一个**托管 MCP server**（`https://astryx.atmeta.com/mcp`，暴露 `search`/`get` 两个工具），让 Cursor / Claude Desktop / Windsurf / Cline 等 agent 用统一协议结构化访问，而非抓网页猜 API。

**技术定位对照**（客观差异，非优劣）：

| 维度 | Astryx | shadcn/ui | 经典 MUI | Radix Primitives |
| --- | --- | --- | --- | --- |
| 分发方式 | **npm 受管依赖**（`@astryxdesign/core`），`swizzle` 才复制源码 | **复制源码**进项目（默认） | npm 包 | npm 包 |
| 样式方案 | **StyleX 编译期原子 CSS**（零运行时） | Tailwind + CSS 变量 | Emotion **运行时** CSS-in-JS | **无样式**（headless） |
| 是否带样式 | ✅ 带品牌样式 + 主题 | ✅ 带样式 | ✅ 带主题 | ❌ 只给行为 |
| AI/agent | **托管 MCP + manifest 契约 + dense/json** | CLI + MCP Server | 无原生 | 无原生 |
| 出身 | Meta 内部 8 年 / 13000+ 应用 | 独立作者（Vercel） | 独立公司 | WorkOS |

**npm 包一览**：`@astryxdesign/core`（组件 + 主题系统 + 工具）、`@astryxdesign/cli`（命令行）、`@astryxdesign/build`（StyleX 源码构建插件）、`@astryxdesign/theme-*`（7 个开箱主题：`neutral` / `butter` / `chocolate` / `matcha` / `stone` / `gothic` / `y2k`）。

> **一句话总结**：如果你想要「**Meta 大厂长期背书 + 编译期零运行时样式 + 受管依赖与版本化升级 + 原生 AI/MCP 工作流**」，Astryx 是当前唯一把这几点集齐的 React 设计系统；但它 **2026-06 才开源、仍是 0.1.x Beta**，生态与稳定性尚早，生产采用宜**小范围试点 + 锁版本 + 跟踪破坏性变更**。样式引擎细节（原子化机制、编译）见本站语言章 [StyleX 叶](/zh/web-advanced/language/stylex/)，本叶只讲 Astryx 组件层与其关系。

## 评价

**优点**

- **Meta 8 年内部沉淀 + 13000+ 应用实战验证**：不是一夜攒出的实验项目，而是被 Meta 内部设计师/工程师/产品团队每天使用打磨后开源，bus factor 与工程成熟度远高于个人项目。
- **StyleX 编译期原子化 CSS**：样式在**构建期**编译成原子类，**运行时零样式序列化开销**；相同声明整站**只落一份**（原子去重），CSS 体积随「不同声明数」而非「组件数×用法数」增长，超大规模下近**次线性**；对 **SSR / RSC** 天然友好（无运行时样式注入、无样式相关 hydration 闪烁）。
- **150+ 无障碍组件开箱即用**：a11y（键盘可达、ARIA 语义）是**默认属性**而非额外配置，官网首页称「Over 160」。
- **品牌级 token 主题**：7 个开箱主题（`neutral`…`y2k`）+ `defineTheme` 自定义 + `astryx theme build` 编译为生产 CSS/JS；改一组 token 即让**全部组件统一换肤**，兼顾品牌一致性与可升级性。**内建暗色 + 内建 spacing**。
- **AI 原生一等公民**：托管 **MCP server**（`search`/`get`）+ `manifest` **机器可读 JSON 契约**（命令行的 OpenAPI）+ `--dense` token 高效输出 + `--json` 类型化信封 + `astryx init --features agents` 生成 `CLAUDE.md` / `.cursorrules` / `AGENTS.md`——**结构化接口内生于系统**，而非在旧系统外贴一层抓取。
- **受管 npm 依赖 + 版本化升级**：组件在 `@astryxdesign/core`，升级走 `astryx upgrade` 的 **codemod**、配置排障有 `astryx doctor`——相对「复制粘贴组件」有**明确升级路径**。
- **`swizzle` 逃生口**：需要超出 `className`/token 的深度定制时，才把组件源码复制进项目（opt-in），默认仍享受受管依赖。
- **CLI 一体化**：`init / component / search / docs / template / hook / swizzle / upgrade / theme build / discover / doctor` 覆盖装、查、注模板、迁移、诊断全生命周期。
- **StyleX 对使用者不可见 + 覆盖自由**：无需学 StyleX 即可用组件，覆盖样式用 `className`（Tailwind / CSS Modules / 纯 CSS 任选），不锁死样式方案。
- **开箱模板 ready-to-ship**：`astryx template` 注入 dashboard、Kanban Board 等整段页面模板（可 `--skeleton` 取骨架）。
- **MIT + Meta 背书**：宽松许可，商用无顾虑；与 React、StyleX 同源同许可。

**缺点**

- **仍是 0.1.x Beta**：2026-06 刚开源，**API 在演进、官方文档偏薄**，部分组件 props 属早期形态，生产采用需评估版本风险（本叶存疑处均标注「早期/待观察」）。
- **生态与社区尚新**：相比 MUI / shadcn 的成熟生态与海量第三方组件/模板，Astryx 的周边（第三方主题、区块、教程）还很少。
- **仅 React 系**：没有 Vue / Svelte / Solid 版本。
- **托管 MCP 需联网**：`type: url` 的远程服务接入极简，但对**强隔离 / 数据不出网 / 离线**环境不适用，这类场景只能退回离线 CLI。
- **绑定 StyleX 工具链**：接入打包器需配 `@astryxdesign/build`（StyleX 构建插件），构建配置有一定学习成本；`swizzle` 或排查原子类冲突时，StyleX 抽象会**泄漏**到你面前。
- **默认是依赖而非「代码归己」**：若你更想要 shadcn 那种「源码完全属于我、随意魔改」的哲学，Astryx 需要显式 `swizzle`，且过度 swizzle 会阻断 codemod 升级。
- **组件数量标注不一**：README/blog 称「150+」、官网首页写「160+」，量级一致但精确数字随版本变动。

## 文档地址

[Astryx 官网](https://astryx.atmeta.com/) | [文档 Docs](https://astryx.atmeta.com/docs) | [组件 Components](https://astryx.atmeta.com/) | [模板 Templates](https://astryx.atmeta.com/) | [主题 Themes](https://astryx.atmeta.com/) | [Playground](https://astryx.atmeta.com/) | [博客：Introducing Astryx](https://astryx.atmeta.com/blog/introducing-astryx) | [博客：How Astryx Works](https://astryx.atmeta.com/blog/how-astryx-works) | [Changelog](https://astryx.atmeta.com/changelog) | [托管 MCP](https://astryx.atmeta.com/mcp)

## GitHub 地址

[facebook/astryx](https://github.com/facebook/astryx)（主仓库，MIT） | [StyleX（样式引擎）](https://github.com/facebook/stylex) | [Model Context Protocol](https://modelcontextprotocol.io)（MCP 标准）

## 幻灯片地址

<a href="/SlideStack/astryx-slide/" target="_blank">Astryx</a>

## 学习路径

- [入门](./getting-started.md)：**概念**（Meta 设计系统 / StyleX 编译期样式 / 受管依赖 vs 复制粘贴）→ **安装**（`@astryxdesign/core` + 主题 + CLI，三行 CSS 导入）→ **`astryx init`** → **第一个组件**（`Button` + `VStack` + `gap`）→ **主题与暗色**（导入 `theme-*/theme.css`）→ **覆盖样式**（`className`）→ **接入 AI**（`init --features agents` + 托管 MCP 配置）。
- [指南](./guide-line.md)：**深入**——StyleX 关系与编译期原子 CSS / 组件与 Layout 体系 / **主题系统**（`defineTheme` + `theme build` + foundations tokens）/ **CLI 全命令与全局 flag** / **AI-agent-ready 全景**（MCP `search`/`get` + `manifest` 契约 + `--dense`/`--json` + agent 文档）/ **模板系统** / **升级与排障**（`upgrade` codemod + `doctor` + `swizzle`）/ **选型对比**（vs shadcn / MUI / Radix / Chakra）/ **常见坑**。
- [参考](./reference.md)：**速查**——npm 包表 / CLI 命令表 + 全局 flag / MCP 配置 + 工具 / 7 主题表 / foundations token 清单 / 三行 CSS 导入 / `init --features agents` 对照 / 版本与链接。
