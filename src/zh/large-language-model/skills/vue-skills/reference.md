---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 vuejs-ai/skills README 编写。社区项目，MIT。

## 速查

- **装**：`npx skills add vuejs-ai/skills` 或 Claude Code 插件市场
- **触发**：`Use vue skill, <prompt>` 显式触发最稳
- **8 技能**：best-practices / options-api / router / pinia / testing / jsx / debug-guides / create-adaptable-composable
- **方法论**：Capability（没它解不了）vs Efficiency（能解但不够好）；eval 筛选（Fail→Pass 保）
- **状态**：社区（org 标 Unofficial），Evan 表态成熟后可能转正式
- **分支**：dev 开发，main 只放已发布

## 8 技能全表

| 技能 | 何时用 | 描述 |
| --- | --- | --- |
| `vue-best-practices` | Vue 3 + Composition API + TS | 最佳实践、常见坑、SSR 指引、性能 |
| `vue-options-api-best-practices` | Options API（`data()`/`methods`） | `this` 上下文、生命周期、Options API + TS |
| `vue-router-best-practices` | Vue Router 4 | 导航守卫、路由参数、路由-组件生命周期 |
| `vue-pinia-best-practices` | Pinia 状态管理 | store 设置、响应式、状态模式 |
| `vue-testing-best-practices` | 组件/E2E 测试 | Vitest、Vue Test Utils、Playwright |
| `vue-jsx-best-practices` | Vue JSX | 与 React JSX 的语法差异 |
| `vue-debug-guides` | 调试 Vue 3 | 运行时错误、警告、异步错误处理、hydration |
| `create-adaptable-composable` | 可复用 composable | `MaybeRef`/`MaybeRefOrGetter` 输入模式 |

## 安装

```bash
# skills CLI
npx skills add vuejs-ai/skills

# Claude Code 插件市场
/plugin marketplace add vuejs-ai/skills
/plugin install vue-skills-bundle@vue-skills                  # 全部
/plugin install vue-best-practices@vue-skills                 # 单个
```

## 方法论

### 技能分类

| 类型 | 含义 |
| --- | --- |
| Capability | AI 没技能解不了：版本专有/未文档化/新特性/训练外边界 |
| Efficiency | AI 能解但不够好：最优模式、最佳实践、一致性 |

### eval 验证

| Baseline | With Skill | 处理 |
| --- | --- | --- |
| Fail | Pass | 保留 |
| Pass | Pass | 考虑移除 |

> 规则只有当它让模型解决原本解决不了的才保留——证据驱动策展。

## 状态说明（如实）

- org `vuejs-ai` 标注 "(Unofficial) Building AI tools for Vue"
- 作者计划成熟后提议转交 Vue 官方；Evan You 表态可能转正式
- README 警告：源自真实 issue，可能因幻觉不完整
- **当前是社区项目，非 Vue 官方出品**

## 相关项目

| 项目 | 说明 |
| --- | --- |
| [antfu/skills](https://github.com/antfu/skills) | Anthony Fu 集，vendored 本项目 vue-best-practices 等 |
| [vueuse/skills](https://github.com/vueuse/skills) | VueUse composition 工具技能 |
| [onmax/nuxt-skills](https://github.com/onmax/nuxt-skills) | Nuxt 技能 |
| [serkodev/vue-skills](https://github.com/serkodev/vue-skills) | create-adaptable-composable 的原型来源 |

## 资源链接

- 仓库：[vuejs-ai/skills](https://github.com/vuejs-ai/skills)
- Vue 官方提案讨论：[vuejs discussion #14334](https://github.com/orgs/vuejs/discussions/14334)
- Vue School 介绍：[Vue Agent Skills](https://vueschool.io/articles/vuejs-tutorials/vue-agent-skills-for-reliable-ai-development/)
- 相关叶：[Antfu Skills](../antfu-skills/) · [Agent Skills 规范与生态](../agent-skills-spec/)
