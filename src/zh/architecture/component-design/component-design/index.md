---
layout: doc
---

# 组件分类与设计原则

「组件分类与设计原则」是前端组件化开发的**通用方法论**——不绑定具体框架（React/Vue 通用），回答两个工程问题：① 组件**按角色**该怎么分类（展示型/容器型/受控/非受控/复合/HOC/自定义 Hook）？② 组件**按 API 表面**该怎么设计（props/events 向下向上、children/slot、render props、compound、Context）？前者来自 Dan Abramov 2015 年《Presentational and Container Components》原始定义（作者在 Hooks 发布后已声明该严格分离不再必要），后者由 react.dev 的「Composition vs Inheritance」「Sharing State」与 vuejs.org 的「Component Basics」「Slots」共同确立。横贯其上的，是 Robert C. Martin 等重定义的**开闭原则（OCP，对扩展开放对修改关闭）**、Refactoring.Guru 的**组合优于继承（has-a 优于 is-a）**、以及「props 向下、events 向上」的单向数据流契约。

React 19（2024-12 发布，当前主线）的新文档已把 **Hooks 定为逻辑复用首选**，HOC 与 Render Props 从主推荐位置移除，仅保留在 legacy.reactjs.org；HOC 官方原文明确「Higher-order components are not commonly used in modern React code」。`React.Children` API 在新文档标注「Pitfall: Using Children is uncommon and can lead to fragile code」，给出三种替代（暴露多个具名子组件 / 结构化数组 prop / render prop）。Vue 3.x（当前 3.5+）以 `<script setup>` + `defineProps/defineEmits/defineSlots` 编译时宏为标准写法，Composition API + Composable 取代了 Options API 时代的 mixin（mixin 不再推荐）；作用域插槽仍是「同时封装逻辑 + 组合视图」的官方方案，纯逻辑封装则由 Composable 承担。本章边界 = 组件分类与 API 表面 + 横向组合原则；不含状态管理（Pinia/Redux）、组件通信实现细节（provide/inject 仅到契约原则）、响应式原理、性能优化（memo/useMemo）、表单库方案。

## 评价

**优点**

- **抽象稳定**：分类与原则与框架版本解绑（SRP/OCP/组合优于继承源自 1988-1990s 软件工程经典），跨 React/Vue/Angular/任何组件化框架通用
- **决策清单化**：受控/非受控、Container/Presentational、Hook/HOC 的取舍都有明确判据（协调需求、复用粒度、嵌套深度）
- **避坑指南清晰**：prop drilling、render 中调 HOC、Children.map 注入、mixin/继承等反模式都有官方替代方案
- **现代化路径明确**：Hooks/Composable 以更低结构成本替代了 HOC/mixin/容器组件，关注点分离的思维模型仍可用
- **组合优于继承官方背书**：Facebook 在上万组件开发中从未发现需要继承构建层次

**缺点**

- **历史包袱**：Dan Abramov 已声明 Container/Presentational 严格分离不再必要，但行业仍有大量教程/面试题延续旧模式
- **HOC 仍常见于旧代码**：legacy 文档保留，迁移成本不低，新人易混淆三大约定（不改原型/透传 props/displayName）
- **Children API 不透明**：children 是不透明数据结构，Children.map 看不到自定义组件内部渲染，pitfall 不易察觉
- **原则边界有灰色地带**：SRP 拆分粒度无量化标准，过度拆分会制造 prop drilling；OCP 的多态版本与 Meyer 原始版本语义不同，需注意引用语境
- **作用域插槽 vs Composable**：Vue 在「同时封装逻辑 + 组合视图」与「纯逻辑封装」之间需做选型，新手容易选错

## 文档地址

- [react.dev：Thinking in React](https://react.dev/learn/thinking-in-react)
- [react.dev：Sharing State Between Components（受控/非受控/状态提升）](https://react.dev/learn/sharing-state-between-components)
- [react.dev：Composition vs Inheritance](https://react.dev/learn/passing-props-to-a-component)
- [react.dev：Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [legacy.reactjs.org：Higher-Order Components](https://legacy.reactjs.org/docs/higher-order-components.html)
- [legacy.reactjs.org：Render Props](https://legacy.reactjs.org/docs/render-props.html)
- [vuejs.org：Component Basics](https://vuejs.org/guide/essentials/component-basics.html)
- [vuejs.org：Slots](https://vuejs.org/guide/components/slots.html)
- [patterns.dev：Container/Presentational Pattern](https://www.patterns.dev/react/container-presentational-pattern)
- [patterns.dev：Compound Pattern](https://www.patterns.dev/react/compound-pattern)
- [Refactoring.Guru：Composite](https://refactoring.guru/design-patterns/composite)
- [Dan Abramov：Presentational and Container Components（原文）](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f105a7bc)

## 幻灯片地址

<a href="/SlideStack/component-design-slide/" target="_blank">组件分类与设计原则</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=702" target="_blank" rel="noopener noreferrer">组件分类与设计原则 测试题</a>
