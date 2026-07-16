---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 antfu/skills 的 README 与 `skills/antfu/SKILL.md`、`skills/antfu-design/SKILL.md` 编写。

## 速查

- **核心创新**：git submodule 直引各工具**源文档**→ 可靠上下文 + 随上游更新，不像手抄那样过时
- **三类**：手工维护（opinionated）/ 官方文档生成（unopinionated）/ vendored（同步外部技能）
- **antfu 约定**：显式 import（关 auto-import 连 Nuxt）、默认无 path alias、isomorphic + `@env`、types/constants 分离、显式返回类型
- **antfu-design**：UnoCSS-first、语义 token、双 light/dark、design-read + anti-slop + 微交互 polish
- **Anthony 论 Skills vs AGENTS.md**：skills 价值=shareable + on-demand；承认 AGENTS.md 更稳，视为工具 gap
- **可 fork 作模板**生成你自己的技能集；MIT

## 核心创新：submodule 引源文档

Antfu Skills 与其它技能集最大的不同——**它用 git submodule 直接引用各工具的官方源文档**：

- vue 技能引 vuejs/docs、vite 引 vitejs/vite、pinia 引 vuejs/pinia……
- 好处一：**上下文可靠**——技能内容基于真实官方文档，不是二手转述
- 好处二：**随上游更新**——submodule 一 sync，技能就跟着新，不像手抄的技能会随版本过时

> 这解决了「技能内容会过时」的老问题：与其手写一份很快过时的最佳实践，不如直接引官方文档源、让它自动同步。这也是它自称「proof-of-concept for generating agent skills from source documentation and keeping them in sync」的含义。

## 三类技能

### ① 手工维护（opinionated）

Anthony Fu 亲手维护、带他个人偏好的：`antfu`（工具约定）、`antfu-design`（UnoCSS 设计）。这些是「他的一套」，opinionated。

### ② 从官方文档生成（unopinionated，倾向现代栈）

从官方文档生成、Anthony 微调，随 docs submodule 同步：vue / nuxt / pinia / vite / vitepress / vitest / unocss / pnpm。这些相对中性（unopinionated），但有「倾斜焦点」——TypeScript、ESM、Composition API 等现代栈。

### ③ vendored（同步自维护自己技能的外部仓库）

从别的仓库同步来的：slidev/tsdown/turborepo/vueuse（各自官方）、vue-best-practices 等（来自 [Vue Skills](../vue-skills/)）、web-design-guidelines（来自 [Vercel Agent Skills](../vercel-agent-skills/)）。这体现技能生态的**互相借用**——好技能不重复造，直接 vendored。

## antfu 约定：显式、可追溯

`antfu` 技能凝练 Anthony Fu 的 opinionated 约定，核心是**显式性**——「读者（人或 agent）应能不跑工具就追溯每个名字从哪来」：

| 约定 | 内容 |
| --- | --- |
| **代码组织** | 单一职责/文件、大文件拆、类型进 `types.ts`、常量进 `constants.ts` |
| **运行时** | 优先 isomorphic（Node/浏览器/worker）；环境专有加 `// @env node` / `// @env browser` |
| **TypeScript** | 显式返回类型、复杂类型抽 `type`/`interface` |
| **显式 import** | 避免 auto-import；框架提供时（Nuxt/Nitro）**新项目也关掉** |
| **无 path alias（默认）** | 用相对导入 `./foo`；只在项目**已配置**时才用 alias，绿地代码别新引入 |

> 「关掉 Nuxt 的 auto-import」是个有争议但一致的立场——Anthony 认为可追溯性（能一眼看出 import 从哪来）比少写几行 import 更重要。这是 opinionated 的典型。

## antfu-design：UnoCSS 设计约定

`antfu-design` 是 UnoCSS-first 的设计规范，用于任何框架（React/Vue/Svelte/Solid/纯 HTML）建界面，从密集的 devtools 面板到落地页：

- **class-based 语义化 token**：双 light/dark，为工具/devtools UI 设计
- **design-read**：先读方向再动手
- **anti-slop**：反 AI「糊弄感」的规则
- **微交互 polish**：落地页/产品面的打磨

> 用法：先读 core-design-read 定方向，再套 token 系统 + polish + anti-slop 规则。

## Anthony 论 Skills vs AGENTS.md

Anthony Fu 在 README 给了一段有见地的看法：

> skills 的价值在于**shareable**（可分享、跨项目复用）+ **on-demand**（按需拉取，规模远超单个上下文窗口）。
>
> 你可能听说「AGENTS.md outperforms skills」——我认为**是真的**：AGENTS.md 全量前置加载、agent 总遵守；skills 会有「假阴性」（该拉时没拉）。但我更把它看成**工具集成的 gap，会随时间改善**。skills 说到底就是标准化的 markdown 格式、给 agent 的知识库。**想让某些技能总生效，直接在 AGENTS.md 里引用它们。**

> 这与 [Next.js 那叶](../nextjs-workflow-skills/) 的分工不谋而合，还给出一个实用技巧：把想「总生效」的 skill 在 AGENTS.md 里点名引用，兼得两者之长。

## 生成你自己的技能集

Antfu Skills 设计成模板——可 fork 生成自己的：

1. fork/clone → `pnpm install`
2. 改 `meta.ts` 填你的项目和技能源
3. `pnpm start cleanup`（清旧 submodule/技能）→ `pnpm start init`（clone submodule）→ `pnpm start sync`（同步 vendored）
4. 让 agent「Generate skills for `<project>`」（建议一次一个管理 token）

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 把 antfu 技能当普适规范 | 它是 Anthony 个人偏好，opinionated |
| 把它当 Vue 官方 | 是核心成员的个人精选，非官方 |
| 期望 PoC 无懈可击 | 自承是概念验证、实战待反馈 |
| 手抄各工具文档进技能 | 不如用 submodule 引源、自动同步 |

## 下一步

- [参考](./reference) —— 全技能表 + 来源、安装、生成自己的技能集、许可
- 上游：[antfu/skills](https://github.com/antfu/skills) · [Anthony Fu 主页](https://antfu.me/)
