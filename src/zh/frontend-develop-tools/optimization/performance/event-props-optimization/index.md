---
layout: doc
---

# 事件及属性优化

「事件及属性优化」是前端运行时性能优化的横切主题：它处理的不是「网络」或「打包」层面的延迟，而是**用户操作触发的频繁回调**与**框架的过度重渲染**这两类问题。一方面，滚动、拖拽、输入、resize 等高频事件若每次都全量执行业务逻辑，会迅速吃满主线程；通过**防抖（debounce）**、**节流（throttle）**、**事件委托（event delegation）**、**被动事件（passive）** 等手段可显著降低主线程压力。另一方面，React、Vue 这类声明式框架默认「状态变化 → 整棵子树重渲染」，但真正影响性能的往往是**属性引用变化导致的无效渲染**：React 用 `useMemo` / `useCallback` / `memo`、以及 2026 年正式可用的 **React Compiler** 在编译期自动 memoize；Vue 用 `shallowRef` / `shallowReactive` / `v-memo` 降低深层响应式开销。本页基于 React 19.2、Vue 3.5、Lodash 4.17.15 与 MDN 官方文档，把这两条线（事件回调频率 + 框架渲染次数）的核心 API、机制、最佳实践与反模式整理成一份可直接对照实践的参考。

## 评价

**优点**

- **覆盖面广**：从用户输入到框架渲染，一条主线把高频场景的优化手段串起来
- **门槛低收益大**：防抖节流与事件委托几行代码就能解决 60% 的卡顿问题
- **React Compiler 减负**：编译期自动 memoize，多数场景无需手写 `useMemo`/`useCallback`
- **Vue 浅响应可控**：`shallowRef`/`shallowReactive` 给大列表、第三方数据源一个低开销出口
- **跨框架心智一致**：「减少不必要的计算与渲染」是所有声明式 UI 的通用思路

**缺点**

- **易误用**：`useMemo` 滥用、`shallowRef` 误触发、`v-memo` 依赖漏写都会埋下难调的 bug
- **需理解机制**：不清楚「为什么 `memo` 没生效」「为什么 `shallowRef.value.count++` 不更新」就解决不了问题
- **历史包袱**：手写记忆化代码与 React Compiler 共存期间，新旧范式需谨慎切换
- **测得才有收益**：优化前若不 Profiler 录制，很可能优化错地方，反而劣化性能

## 文档地址

- [React useMemo](https://react.dev/reference/react/useMemo)
- [React useCallback](https://react.dev/reference/react/useCallback)
- [React memo](https://react.dev/reference/react/memo)
- [Vue Reactivity: Advanced（shallowRef / shallowReactive / triggerRef / customRef / markRaw / toRaw）](https://vuejs.org/api/reactivity-advanced.html)
- [Vue v-memo / v-once](https://vuejs.org/api/built-in-directives.html#v-memo)
- [Lodash debounce](https://lodash.com/docs/4.17.15#debounce) / [throttle](https://lodash.com/docs/4.17.15#throttle)
- [MDN 事件冒泡与委托](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)

## GitHub 地址

- [React 核心](https://github.com/facebook/react)
- [Vue 核心](https://github.com/vuejs/core)
- [Lodash](https://github.com/lodash/lodash)

## 幻灯片地址

<a href="/SlideStack/event-props-optimization-slide/" target="_blank">事件及属性优化</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=669" target="_blank" rel="noopener noreferrer">事件及属性优化 测试题</a>

