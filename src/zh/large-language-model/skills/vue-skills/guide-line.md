---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 vuejs-ai/skills README 编写。**社区项目**，Evan You 表态成熟后可能转 Vue 官方，现在不是。

## 速查

- **两类技能**：Capability（AI 没它解不了：版本专有/未文档化/新特性/边界）vs Efficiency（能解但不够好：最优模式/一致性）
- **eval 驱动筛选**：Baseline（无技能）vs With-skill；Fail→Pass 保留，Pass→Pass 考虑删——只留真正让模型「从不会到会」的规则
- **8 技能** 覆盖 Vue 3 主栈；`Use vue skill` 前缀显式触发最稳
- **状态诚实**：社区项目（org 标 Unofficial），README 自承可能因幻觉不完整
- **dev/main 分支**：dev 开发，main 只放已发布
- 装 `npx skills add vuejs-ai/skills`；MIT

## 方法论：Capability vs Efficiency

Vue Skills 把技能分两类——这个分类本身就很有价值，帮你判断哪些技能真正必要：

| 类型 | 含义 | 针对 |
| --- | --- | --- |
| **Capability** | AI **没有**技能就**解不了**的问题 | 版本专有问题、未文档化的行为、近期新特性、训练数据外的边界 |
| **Efficiency** | AI **能**解但**不够好** | 提供最优模式、最佳实践、一致的做法，提升解法质量 |

> 这个区分很实用：Capability 类技能是「非装不可」（不装 AI 就错/不会），Efficiency 类是「装了更好」（不装也能跑但不够优）。它让你理解一个技能的价值到底在哪。

## eval 驱动的规则筛选

这是 Vue Skills 最硬核的地方——**每条规则都经自动 eval 验证**，不是拍脑袋写：

1. **Baseline**：不装技能跑一遍
2. **With-skill**：装技能跑一遍

| Baseline | With Skill | 处理 |
| --- | --- | --- |
| Fail | Pass | **保留**（技能让模型从不会到会） |
| Pass | Pass | **考虑移除**（模型本来就会，技能没增量） |

> 一条规则**只有当它让模型解决了原本解决不了的问题才保留**。这是证据驱动的技能策展——避免堆一堆「模型本来就会」的无用规则，让每条规则都真正有增量。这与「反合理化」「证据要求」是同一种工程严谨。

## 8 个技能

| 技能 | 覆盖 |
| --- | --- |
| `vue-best-practices` | Vue 3 + Composition API + TS：最佳实践、常见坑、SSR、性能（demo：用 shallowRef、状态入 composable、组件拆分） |
| `vue-options-api-best-practices` | Options API：`this` 上下文、生命周期、Options API + TS |
| `vue-router-best-practices` | Vue Router 4：导航守卫、路由参数、路由-组件生命周期 |
| `vue-pinia-best-practices` | Pinia：store 设置、响应式、状态模式 |
| `vue-testing-best-practices` | Vitest、Vue Test Utils、Playwright |
| `vue-jsx-best-practices` | Vue JSX：与 React JSX 的语法差异 |
| `vue-debug-guides` | 运行时错误、警告、异步错误处理、hydration 问题 |
| `create-adaptable-composable` | 可复用 composable：`MaybeRef`/`MaybeRefOrGetter` 输入模式（源自 serkodev/vue-skills 的 create-agnostic-composable） |

## 触发：Use vue skill 前缀

为最可靠的结果，prompt 前缀 `Use vue skill`：

```text
Use vue skill, create a todo app
```

这**显式触发**技能，确保 AI 遵循文档化的模式。不加前缀时，触发取决于 prompt 与技能描述关键词的匹配度——可能不一致。这也印证了 [Next.js 那叶](../nextjs-workflow-skills/) 讲的「skills 按需触发可能有假阴性」，用显式前缀是绕过办法之一。

## 社区 / 官方状态（务必如实）

- GitHub 组织 `vuejs-ai` 描述为 **"(Unofficial) Building AI tools for Vue"**——明确非官方
- 作者计划在项目**有价值且成熟后提议转交给 Vue 官方组织**
- **Evan You 表态**：等它更成熟、测试更充分后**可能转正式**，但目前仍是社区倡议
- README 诚实警告：技能源自真实 issue，但**可能因幻觉不完整**，请给反馈

> 选型时：把它当作「高质量、eval 驱动、有官方转正路径的社区 Vue 技能」，而非「Vue 官方出品」。这个区分很重要——别把半官方说成官方。

## 与相邻项目的关系

| 项目 | 关系 |
| --- | --- |
| [antfu/skills](../antfu-skills/) | Anthony Fu 的全工具链集，**vendored 了本项目的 vue-best-practices/router/testing** |
| vueuse/skills | VueUse（200+ composition 工具）专技能，被 antfu vendored |
| onmax/nuxt-skills | Nuxt 专技能 |

## 反模式

| 反模式 | 问题 |
| --- | --- |
| 把它当 Vue 官方出品宣传 | 目前是社区项目，别夸大 |
| 不加 `Use vue skill` 又抱怨没触发 | 描述匹配不准时用显式前缀 |
| 盲信每条规则 | README 自承可能因幻觉不完整，需验证 |
| 忽略 Capability/Efficiency 区分 | 该分类帮你判断技能价值，别浪费 |

## 下一步

- [参考](./reference) —— 8 技能全表、安装（含插件市场）、方法论、相关项目
- 上游：[vuejs-ai/skills](https://github.com/vuejs-ai/skills) · [Vue 官方提案讨论](https://github.com/orgs/vuejs/discussions/14334)
