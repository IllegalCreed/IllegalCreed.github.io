---
layout: doc
---

# Antfu Skills

Antfu Skills（`antfu/skills`）是 Anthony Fu（antfu，Vue / Nuxt / Vite 核心团队 + Vercel）精选的一组 agent 技能——反映他的偏好、经验和最佳实践。它最与众不同的地方是**用 git submodule 直接引用各工具的源文档**，从而提供可靠上下文、并随上游更新保持同步。技能分三类：**手工维护**（他 opinionated 的工具约定，如 antfu / antfu-design）、**从官方文档生成**（vue/nuxt/pinia/vite/vitest/unocss/pnpm 等，随各自 docs repo submodule 同步）、**vendored**（slidev/tsdown/turborepo/vueuse 官方技能、以及 vue-best-practices 借自 vuejs-ai）。如果你主力 Vite/Vue/Nuxt，这是一站式集合。

## 评价

**优点**

- **submodule 引源文档**：核心创新——技能直接引用各工具的官方文档 submodule，上下文可靠、随上游更新，不会像手抄那样过时
- **Anthony Fu 的实战偏好**：antfu 技能凝练他 opinionated 的约定——显式 import（关掉 auto-import，连 Nuxt/Nitro 新项目也关）、默认不用 path alias（用相对导入）、isomorphic 代码 + `@env` 注释、types.ts/constants.ts 分离
- **一站式 Vite/Vue 栈**：覆盖 vue/nuxt/pinia/vite/vitepress/vitest/unocss/pnpm/tsdown/turborepo/slidev/vueuse——你的整条工具链
- **antfu-design**：UnoCSS-first、语义化 token、双 light/dark、anti-slop、微交互 polish——从 devtools 面板到落地页
- **可作模板**：设计成可 fork 生成你自己的技能集（改 meta.ts + submodule）
- **权威身份**：作者是 Vue/Nuxt/Vite 核心 + 众多流行工具（UnoCSS/Vitest/Slidev/tsdown）的作者

**缺点 / 提示**

- **proof-of-concept**：README 自承是「从源文档生成技能并保持同步」的概念验证，作者未充分测试实战表现，欢迎反馈
- **强 opinionated**：antfu 技能是 Anthony 个人偏好（关 auto-import、无 alias），不一定契合你的习惯
- **偏 Vite/Vue 生态**：主力其它栈（如 React）时覆盖有限
- **vendored 技能保留原许可**：不同技能目录许可可能不同（核心 MIT）

## 适用场景

- 主力 Vite / Vue / Nuxt，想要一站式覆盖整条工具链的技能集
- 想照 Anthony Fu 的约定写代码（显式、可追溯、isomorphic）
- 用 UnoCSS 做界面，想要语义 token + 双主题 + anti-slop 设计规范（antfu-design）
- 想 fork 一个「从源文档生成 + submodule 同步」的技能集模板

## 边界

- **不是 Vue 官方**：是 Anthony Fu 个人精选（他是核心成员但这是个人项目）
- **antfu 技能是个人偏好**：opinionated，非普适规范
- **与 Vue Skills 有交集**：vendored 了 [Vue Skills](../vue-skills/) 的 vue-best-practices 等
- **是概念验证**：submodule 生成同步的 PoC，实战表现待反馈打磨

## 官方文档

[antfu/skills README](https://github.com/antfu/skills#readme) ｜ [Anthony Fu 主页](https://antfu.me/) ｜ [Skills vs AGENTS.md（README FAQ）](https://github.com/antfu/skills#skills-vs-llmstxt-vs-agentsmd)

## GitHub 地址

[antfu/skills](https://github.com/antfu/skills)（MIT；vendored 保留原许可）

## 内容地图

- [入门](./getting-started) —— `pnpx skills add` 安装、三类技能、antfu 约定速览
- [指南](./guide-line) —— submodule 引源创新、三类技能拆解、antfu opinionated 约定、Skills vs AGENTS.md
- [参考](./reference) —— 全技能表（三类）+ 来源、安装、生成自己的技能集、许可

## 幻灯片地址

<a href="/SlideStack/antfu-skills-slide/" target="_blank">Antfu Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=600" target="_blank" rel="noopener noreferrer">Antfu Skills 测试题</a>
