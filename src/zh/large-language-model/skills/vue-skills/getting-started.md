---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 vuejs-ai/skills（提交 `c9d355f`，2026-03-26）的 README 编写。**社区项目**，非 Vue 官方。

## 速查

- **装**：`npx skills add vuejs-ai/skills`（或 Claude Code 插件市场 `/plugin marketplace add vuejs-ai/skills`）
- **触发**：前缀 `Use vue skill, <你的 prompt>` 显式触发最稳
- **8 技能**：best-practices · options-api · router · pinia · testing · jsx · debug-guides · create-adaptable-composable
- **方法论**：Capability（AI 没它解不了）vs Efficiency（能解但不够好）；每规则经 eval 验证保留
- **状态**：社区项目（org 标 Unofficial），Evan You 表态成熟后可能转 Vue 官方
- **诚实警告**：技能源自真实 issue，可能因幻觉不完整，欢迎反馈

## 安装

```bash
npx skills add vuejs-ai/skills
```

Claude Code 插件市场（替代方案）：

```text
/plugin marketplace add vuejs-ai/skills
/plugin install vue-skills-bundle@vue-skills          # 装全部
/plugin install vue-best-practices@vue-skills         # 单装某个
/plugin install vue-best-practices@vue-skills vue-router-best-practices@vue-skills   # 装多个
```

## 触发：加前缀最稳

```text
Use vue skill, <你的 prompt>
```

前缀 `Use vue skill` **显式触发**技能，确保 AI 遵循文档化的模式。不加前缀时，触发取决于你的 prompt 与技能描述关键词的匹配度，可能不一致。

## 8 个技能速览

| 技能 | 何时用 | 覆盖 |
| --- | --- | --- |
| `vue-best-practices` | Vue 3 + Composition API + TS | 最佳实践、常见坑、SSR 指引、性能 |
| `vue-options-api-best-practices` | Options API（`data()`/`methods`）| `this` 上下文、生命周期、Options API + TS |
| `vue-router-best-practices` | Vue Router 4 | 导航守卫、路由参数、路由-组件生命周期 |
| `vue-pinia-best-practices` | Pinia 状态管理 | store 设置、响应式、状态模式 |
| `vue-testing-best-practices` | 写组件/E2E 测试 | Vitest、Vue Test Utils、Playwright |
| `vue-jsx-best-practices` | Vue 里用 JSX | 与 React JSX 的语法差异 |
| `vue-debug-guides` | 调试 Vue 3 | 运行时错误、警告、异步错误处理、hydration |
| `create-adaptable-composable` | 建可复用 composable | `MaybeRef`/`MaybeRefOrGetter` 输入模式 |

## demo：技能带来什么改善

README 给了前后对比 demo。以 `vue-best-practices` 的 todo app 为例，装技能后：

- 代码更可读
- 组件被合理拆分
- 状态移进 composable（`useTodos.ts`）
- 对原始响应式数据用 `shallowRef`（见 Reactivity 参考）

`create-adaptable-composable` 的 useHidden demo：

```ts
export interface UseHiddenOptions {
  hidden?: MaybeRef<boolean>
  initialHidden?: MaybeRefOrGetter<boolean>
  syncAria?: boolean
}

export function useHidden(
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseHiddenOptions = {},
)
```

> 用 `MaybeRef` 和 `MaybeRefOrGetter` 作输入参数，让 composable 的响应式输入更灵活——传 ref、传值、传 getter 都行。

## 下一步

- [指南](./guide-line) —— Capability/Efficiency 分类、eval 驱动筛选、各技能、社区/官方状态
- [参考](./reference) —— 8 技能全表、安装、方法论、相关项目
