---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 antfu/skills（2026-06-23）的 README 与 `skills/antfu/SKILL.md` 编写。

## 速查

- **装**：`pnpx skills add antfu/skills --skill='*'`（全部）；`-g` 全局
- **三类技能**：①手工维护 antfu / antfu-design（opinionated）②官方文档生成 vue/nuxt/pinia/vite/vitepress/vitest/unocss/pnpm ③vendored slidev/tsdown/turborepo/vueuse/vue-best-practices
- **核心创新**：用 git submodule **直接引用各工具的源文档**，可靠上下文 + 随上游同步
- **antfu 约定**：显式 import（关 auto-import）、默认无 path alias、isomorphic + `@env` 注释、types.ts/constants.ts 分离
- **antfu-design**：UnoCSS-first、语义 token、双 light/dark、anti-slop
- **作者**：Anthony Fu（Vue/Nuxt/Vite 核心 + UnoCSS/Vitest/Slidev 作者），MIT

## 安装

```bash
# 装全部（本地）
pnpx skills add antfu/skills --skill='*'

# 装全部（全局）
pnpx skills add antfu/skills --skill='*' -g
```

CLI 用法见 [vercel-labs/skills](https://github.com/vercel-labs/skills)（即 `npx skills` 生态）。

## 三类技能

### ① 手工维护（opinionated）

Anthony Fu 亲手维护，用他偏好的工具、约定、最佳实践：

| 技能 | 内容 |
| --- | --- |
| `antfu` | 他对 app/库项目的偏好（eslint、pnpm、vitest、vue 等） |
| `antfu-design` | UnoCSS 为中心的设计原则、语义 token、UI 呈现模式 |

### ② 从官方文档生成（unopinionated，倾向现代栈）

从官方文档生成、Anthony 微调，随各自 docs repo submodule 同步：

`vue`（vuejs/docs）· `nuxt`（nuxt/nuxt）· `pinia`（vuejs/pinia）· `vite`（vitejs/vite）· `vitepress`（vuejs/vitepress）· `vitest`（vitest-dev/vitest）· `unocss`（unocss/unocss）· `pnpm`（pnpm/pnpm.io）

### ③ vendored（同步自外部维护自己技能的仓库）

`slidev`(官方) · `tsdown`(官方) · `turborepo`(官方) · `vueuse-functions`(官方，来自 vueuse/skills) · `vue-best-practices`/`vue-router-best-practices`/`vue-testing-best-practices`（来自 [vuejs-ai/skills](../vue-skills/)）· `web-design-guidelines`（来自 [vercel-labs](../vercel-agent-skills/)）

## antfu 约定速览

`antfu` 技能凝练 Anthony Fu 的 opinionated 约定（部分）：

- **代码组织**：单一职责/文件，大文件拆分，类型进 `types.ts`，常量进 `constants.ts`
- **运行时**：优先 isomorphic 代码（Node/浏览器/worker 都能跑）；环境专有时文件顶加 `// @env node` / `// @env browser`
- **TypeScript**：显式返回类型，复杂类型抽成 `type`/`interface`
- **显式性（核心）**：偏好可追溯代码而非隐式「魔法」——
  - **显式 import**：避免 auto-import；框架提供时（Nuxt/Nitro）**新项目也关掉**
  - **默认无 path alias**：用相对导入（`./foo`），只在项目**已配置**时才用 alias，别为绿地代码新引入

> 核心哲学：读者（人或 agent）应能**不跑工具就追溯每个名字从哪来**。

## 下一步

- [指南](./guide-line) —— submodule 引源创新、三类拆解、antfu 约定、Skills vs AGENTS.md 观点
- [参考](./reference) —— 全技能表 + 来源、安装、生成自己的技能集、许可
