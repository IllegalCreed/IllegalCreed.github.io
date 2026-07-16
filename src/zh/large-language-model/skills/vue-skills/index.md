---
layout: doc
---

# Vue Skills

Vue Skills（`vuejs-ai/skills`）是一组面向 Vue 3 开发的 AI agent 技能——把 Vue 3 + Composition API + TypeScript 的最佳实践、常见坑、SSR/性能指引，以及 Router/Pinia/测试/JSX/调试/可复用 composable 的模式编码成 8 个技能。它最有价值的不只是内容，而是**方法论**：技能被分为 **Capability**（AI 没它就解不了）和 **Efficiency**（能解但不够好）两类，且每条规则都经 **eval 验证**——只有当「装了技能」比「没装」真的解决了原本解决不了的问题，规则才保留。

> ⚠️ **状态如实说明**：`vuejs-ai/skills` 目前是**社区项目**（GitHub 组织 `vuejs-ai` 明确标注 "(Unofficial)"），由社区维护。作者计划在成熟后提议转交给 Vue 官方组织，Evan You 也表态「等它更成熟、测试更充分后可能转正式」。README 自带诚实警告：技能源自真实 issue，但可能因幻觉不完整，欢迎反馈。**它不是 Vue 官方出品，选型时请知悉。**

## 评价

**优点**

- **eval 驱动的规则筛选**：每条规则跑 Baseline（无技能）vs With-skill，仅当技能让模型解决原本解决不了的才保留——证据驱动，不堆无用规则
- **Capability / Efficiency 分类**：清楚区分「AI 没它解不了」（版本专有/未文档化/新特性/边界）vs「能解但不够好」（最优模式），帮你判断哪些技能真正必要
- **覆盖 Vue 3 主栈**：best-practices（Composition API + TS）、options-api、router、pinia、testing、jsx、debug、可复用 composable
- **显式触发更稳**：前缀 `Use vue skill` 显式触发，避免描述匹配不准导致的漏触发
- **有 demo 佐证**：README 给出 todo app、useHidden 等前后对比 demo，能看到技能带来的具体改善
- **可组合装**：`npx skills add vuejs-ai/skills` 或 Claude Code 插件市场，可整包或单技能

**缺点 / 诚实提示**

- **非官方**：目前是社区项目（org 标 Unofficial），未来可能转 Vue 官方但现在不是
- **可能不完整**：README 自承技能源自真实 issue、可能因幻觉不完整，需反馈迭代
- **触发可能不一致**：不加 `Use vue skill` 前缀时，触发取决于 prompt 与描述关键词的匹配度
- **偏 Composition API + TS**：Options API 单列一技能，但整体倾向现代 Vue 3 栈
- **dev 分支开发**：main 只放已发布技能，最新在 dev 分支

## 适用场景

- 用 Vue 3 + Composition API + TypeScript，想让 agent 照最佳实践写（best-practices）
- 用 Vue Router 4 / Pinia，想要正确的导航守卫、store 模式（router/pinia）
- 写 Vue 组件/E2E 测试（testing：Vitest/VTU/Playwright）
- 调试 Vue 3 运行时错误/警告/hydration（debug-guides）
- 创建响应式灵活的可复用 composable（create-adaptable-composable：MaybeRef/MaybeRefOrGetter）

## 边界

- **不是 Vue 官方**：社区项目，Evan 表态成熟后可能转正式，现在不是
- **不是 API 文档封装**：靠 eval 筛选、聚焦 AI 真正需要的 Capability/Efficiency
- **与 Antfu Skills 有交集但不同**：[Antfu Skills](../antfu-skills/) 是 Anthony Fu 的全工具链集（还 vendored 了本项目的 vue-best-practices）；本叶专注 Vue 开发
- **VueUse 另有专技能**：vueuse/skills（本叶不含）

## 官方文档

[vuejs-ai/skills README](https://github.com/vuejs-ai/skills#readme) ｜ [Vue 官方 AI/Skills 提案讨论](https://github.com/orgs/vuejs/discussions/14334) ｜ [Vue Agent Skills（Vue School）](https://vueschool.io/articles/vuejs-tutorials/vue-agent-skills-for-reliable-ai-development/)

## GitHub 地址

[vuejs-ai/skills](https://github.com/vuejs-ai/skills)（社区项目，MIT）

## 内容地图

- [入门](./getting-started) —— `npx skills add` 安装、8 技能速览、`Use vue skill` 触发、demo
- [指南](./guide-line) —— Capability/Efficiency 分类、eval 驱动筛选方法论、各技能、社区/官方状态
- [参考](./reference) —— 8 技能全表 + 触发条件、安装（含插件市场）、方法论、相关项目

## 幻灯片地址

<a href="/SlideStack/vue-skills-slide/" target="_blank">Vue Skills</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=599" target="_blank" rel="noopener noreferrer">Vue Skills 测试题</a>
