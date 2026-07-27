---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 react.dev / vuejs.org / legacy.reactjs.org / patterns.dev / Refactoring.Guru + Dan Abramov 2015 原文编写，对照 React 19 / Vue 3.5

## 速查

- 两大契约：**props 向下、events 向上**（React `onChange` / Vue `defineEmits` + `update:modelValue`）
- 六种角色：展示型 / 容器型 / 受控 / 非受控 / 复合 / HOC
- 三种逻辑复用：**自定义 Hook（推荐）/ HOC（legacy）/ Render Props**
- 设计原则：**SRP（单一职责）/ OCP（开闭）/ 组合优于继承（has-a 优于 is-a）/ SSoT（单一数据源）/ state 最小化（DRY）**
- state 三条过滤：① 不随时间变化 ② 可从 props 传入 ③ 可从已有 state/props 计算（任一满足即不是 state）
- 受控/非受控：独立运用 = 非受控；多个组件需协调 = 受控
- 复合组件实现：**Context（任意嵌套深度）**，不要用 `Children.map + cloneElement`
- `React.Children` = Pitfall，children 不透明 → 改用「具名子组件 / 结构化数组 / render prop」
- Vue 插槽：默认 + 后备 / 具名（`v-slot` / `#`）/ 作用域（`v-slot="{ item }"`）/ 渲染作用域（父只访问父作用域）
- HOC 三约定：不改原型（用组合）/ 透传无关 props / `displayName = WithX(Name)`
- 反模式黑名单：prop drilling / render 中调 HOC / Children.map 注入 / 改 Vue props / 派生值存 state / mixin / useX 命名违规
- 完整说明见 [入门](./getting-started.md) / [核心规则与反模式](./guide-line.md)

## 角色分类完整表

| 角色 | 别名 | 数据来源 | 状态归属 | 推荐度 | 现代化替代 |
| --- | --- | --- | --- | --- | --- |
| **展示型**（Presentational） | 木偶 / Dumb | 全部 props | 无 | 思维模型仍可用 | 通用组件 |
| **容器型**（Container） | 智能 / Smart | 取数据 + 状态 | 自身 | 不再严格推荐 | 自定义 Hook |
| **受控**（Controlled） | - | 父 props 驱动 | 父组件 | 推荐用于协调场景 | Controllable（双模式） |
| **非受控**（Uncontrolled） | - | 自身 useState | 自身 | 推荐用于独立组件 | Controllable（双模式） |
| **复合**（Compound） | - | Context 隐式共享 | 父组件 Provider | 推荐（声明式 API） | Context |
| **高阶**（HOC） | - | wrapper 注入 | wrapper | legacy 不推荐 | 自定义 Hook |
| **Renderless**（Vue） | 无渲染 | 作用域插槽 | 自身 | 部分场景 | Composable |

## 设计原则速查表

| 原则 | 全称 | 含义 | 来源 | 落点 |
| --- | --- | --- | --- | --- |
| **SRP** | Single Responsibility Principle | 一个组件只做一件事 | SOLID（Robert C. Martin） | 复杂度增长时再拆 |
| **OCP** | Open/Closed Principle | 对扩展开放对修改关闭 | Meyer 1988（继承版）/ Martin 1990s（多态版） | 前端用多态版本 |
| **组合优于继承** | Composition over Inheritance | has-a 优于 is-a | Refactoring.Guru / react.dev | children + props |
| **SSoT** | Single Source of Truth | 单一数据源 | react.dev | state 唯一归属 |
| **DRY** | Don't Repeat Yourself | 派生值不存 state | react.dev State 最小化 | 实时计算 |
| **状态提升** | Lifting State Up | 兄弟共享 state 提到共同父 | react.dev | 共同父 + props 下传 |
| **单向数据流** | Unidirectional Data Flow | props 向下、events 向上 | react.dev / vuejs.org | 不直接改 props |

## API 模式对比表

| 模式 | 框架 | 适用场景 | 嵌套层级 | 现代化替代 |
| --- | --- | --- | --- | --- |
| **children** | React/Vue | 父塞任意子节点 | 扁平 | children 本身仍推荐 |
| **具名 children / slot** | React `<X.Header>` / Vue `<slot name="header">` | 多区域组合 | 扁平 | 推荐 |
| **作用域插槽** | Vue `<slot :item="x">` + `v-slot="{item}"` | 同时封装逻辑 + 组合视图 | 扁平 | Composable（纯逻辑） |
| **Render Props** | React `render={(x)=>...}` | 注入 index / 动态渲染 | 多层 render | Hook（多数场景） |
| **Compound** | React `<Tabs><Tabs.List/></Tabs>` | 声明式 API（接近原生） | 扁平 | Context 实现 |
| **Context** | React `createContext + useContext` | 跨层共享状态 | 任意深度 | 推荐 |
| **provide/inject** | Vue `provide() / inject()` | 跨层共享状态 | 任意深度 | 推荐 |
| **HOC** | React `withX(Component)` | legacy 逻辑复用 / 拦截 props | wrapper 嵌套 | 自定义 Hook |
| **自定义 Hook / Composable** | React `useX` / Vue `useX` | 状态逻辑复用 | 扁平 | **首选** |

## State 三条过滤规则

| 规则 | 例子 | 结论 |
| --- | --- | --- |
| ① 不随时间变化 | 列表项（来自父 props，固定） | 不是 state |
| ② 可从 props 传入 | `initialValue`（父控制） | 不是 state |
| ③ 可从已有 state/props 计算（派生值 DRY） | 过滤后列表 = `list.filter(...)` | 不是 state，实时计算 |

> 三条任一满足即**不是 state**。三条都不满足才能作为 state。

## 受控 vs 非受控对比

| 维度 | 非受控 | 受控 |
| --- | --- | --- |
| 状态归属 | 组件内部 `useState` | 父组件 props |
| 配置复杂度 | 低（开箱即用） | 高（父需管理 value + onChange） |
| 协调灵活性 | 低 | 高（父可任意编排） |
| 典型场景 | 独立 Panel / Tooltip | Accordion / 表单整体提交 |
| React API | `defaultValue` + `useState` 内部 | `value` + `onChange` |
| Vue API | `defineProps` + `ref` 内部 | `modelValue` + `update:modelValue` |

## HOC 速查

| 约定 | 含义 |
| --- | --- |
| ① 不改原组件原型 | 用组合 `return <WrappedComponent {...props}/>` |
| ② 透传无关 props | `const { extra, ...rest } = props; <Wrapped injected={...} {...rest}/>` |
| ③ displayName 包裹 | `WithTheme.displayName = "WithTheme(" + getDisplayName(Wrapped) + ")"` |
| ④ ref 用 forwardRef | 16.3+ `React.forwardRef` 透传 |
| ⑤ 顶层应用一次 | 绝不在 render 中调 HOC |

## Vue 插槽速查

| 类型 | 写法 | 用途 |
| --- | --- | --- |
| 默认插槽 | `<slot />` | 父塞任意内容 |
| 后备内容 | `<slot>默认</slot>` | 父未传时显示 |
| 具名插槽 | `<slot name="header" />` + `<template #header>` | 多区域组合 |
| 作用域插槽 | `<slot :item="x" />` + `<template #default="{ item }">` | 子数据传父，父决定渲染 |
| 废弃写法 | `slot-scope`（Vue 2 旧语法） | Vue 3 已废弃，用 `v-slot` / `#` |

## 版本与现状

| 项 | 取值 |
| --- | --- |
| 当前 React 主线 | **React 19**（2024-12 发布） |
| HOC 现状 | legacy，react.dev 明确「not commonly used in modern React code」 |
| Render Props 现状 | 大幅被 Hook 取代，部分场景仍用 |
| `React.Children` 现状 | Pitfall 警告，给出三种替代 |
| `React.forwardRef` | 16.3+ 引入，HOC ref 透传用 |
| Hooks 引入版本 | React 16.8（2019） |
| 当前 Vue 主线 | **Vue 3.5+** |
| Vue `<script setup>` | Vue 3 标准写法（编译时宏） |
| Vue `slot-scope` | 已废弃，统一 `v-slot` / `#` |
| Vue mixin | 不再推荐，用 Composable |
| Container/Presentational 现状 | Dan Abramov 已声明不再严格推荐 |

## 历史脉络

| 时间 | 事件 |
| --- | --- |
| 1988 | Bertrand Meyer 提出 OCP（基于继承） |
| 1990s | Robert C. Martin 等重定义 OCP（多态版本，前端用此版） |
| 2014 | React 0.13 引入 ES6 class 组件，组件层次初步成型 |
| 2015 | Dan Abramov 发表《Presentational and Container Components》 |
| 2016 | React 15.x 时期 HOC、Render Props 流行 |
| 2018-03 | React 16.3 引入 `forwardRef`、新 Context API |
| 2019-02 | React 16.8 引入 Hooks，逻辑复用范式转移 |
| 2020-09 | Vue 3.0 发布 Composition API + Composable |
| 2023-03 | react.dev 新文档上线，HOC/Render Props 移至 legacy |
| 2024-12 | React 19 发布，Hooks 完全主流化 |

## 官方资源

- react.dev：[Thinking in React](https://react.dev/learn/thinking-in-react)
- react.dev：[Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- react.dev：[Passing Props to a Component（含 children）](https://react.dev/learn/passing-props-to-a-component)
- react.dev：[Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- react.dev：[Composition vs Inheritance（legacy 路径）](https://react.dev/reference/react/Children)
- legacy.reactjs.org：[Higher-Order Components](https://legacy.reactjs.org/docs/higher-order-components.html)
- legacy.reactjs.org：[Render Props](https://legacy.reactjs.org/docs/render-props.html)
- vuejs.org：[Component Basics](https://vuejs.org/guide/essentials/component-basics.html)
- vuejs.org：[Slots](https://vuejs.org/guide/components/slots.html)
- vuejs.org：[Provide / Inject](https://vuejs.org/guide/components/provide-inject.html)
- patterns.dev：[Container/Presentational Pattern](https://www.patterns.dev/react/container-presentational-pattern)
- patterns.dev：[Compound Pattern](https://www.patterns.dev/react/compound-pattern)
- Refactoring.Guru：[Composite](https://refactoring.guru/design-patterns/composite)
- Refactoring.Guru：[Decorator（OCP 体现）](https://refactoring.guru/design-patterns/decorator)
- Dan Abramov 原文：[Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f105a7bc)
