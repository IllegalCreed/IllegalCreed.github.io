---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 React 19.2 / Vue 3.5 / Lodash 4.17.15 / MDN 官方文档编写

## 速查

- **两条主线**：① 事件回调频率（防抖节流 / 委托 / passive）② 框架重渲染次数（React 记忆化 / Vue 浅响应）
- **防抖 vs 节流**：搜索框、resize、表单校验用 **debounce**（停手后才执行）；滚动、拖拽、mousemove 用 **throttle**（固定频率跟手）
- **实例管理**：`useRef`/`useMemo` 只创建一次 debounce/throttle；卸载时 `useEffect cleanup` 调 `.cancel()`
- **事件委托**：父容器单个监听器 + `event.target.closest('[data-id]')` 定位；动态子项无需重绑
- **passive**：`addEventListener('scroll', fn, { passive: true })` 显式不调 `preventDefault`，浏览器并行滚动不卡顿
- **React useMemo**：仅 3 类场景值得用——昂贵计算、传给 memo 子组件、作其他 Hook 依赖
- **React useCallback(fn, deps) ≡ useMemo(() => fn, deps)**：前者缓存函数本身不调用，后者缓存调用结果
- **React.memo**：props 浅比较（`Object.is`）跳过重渲染；接内联对象/函数 prop 会失效
- **React Compiler**：2026 正式可用，编译期自动 memoize 值/函数/组件，多数场景可移除手动 Hook
- **Vue shallowRef**：仅 `.value` 访问响应；`state.value.count++` 不触发，需整体替换或 `triggerRef`
- **Vue shallowReactive**：根级响应、嵌套不响应；不可嵌套进深 reactive
- **Vue v-memo="[deps]"**：依赖全等则跳过子树；`v-memo="[]"` 等价 `v-once`；必须与 v-for 同元素

## 这是什么，解决什么问题

「事件及属性优化」处理两类高频性能问题：

1. **用户操作触发的主线程压力**：滚动一秒触发数十次 scroll、拖拽时 mousemove 几乎每帧都来、输入框每次按键都校验，若每次都跑完整业务逻辑，主线程被吃满 → 卡顿、掉帧、INP劣化。
2. **框架的过度重渲染**：React / Vue 是「状态变化 → 子树重渲染」，但很多重渲染是无效的——`<List items={filter(x)} />` 每次引用都变、`<Button onClick={() => ...} />` 每次新函数、父组件 state 变化连带所有子组件渲染。属性引用频繁变化是「明明没动也重渲染」的根因。

两条主线看似无关，本质都是**减少主线程上不必要的计算与渲染工作**。

## 两条主线一张图

```text
┌─────────────────────────── 主线程负载 ───────────────────────────┐
│                                                                  │
│  用户操作 ─→ 高频事件回调 ─→ 业务逻辑 ─→ 状态变化 ─→ 框架重渲染  │
│             ┕─ 防抖/节流     ┕─ 委托       ┕─ memo / Compiler /    │
│                 passive                              shallow / v-memo │
└──────────────────────────────────────────────────────────────────┘
```

- **左侧（事件侧）**：debounce / throttle / 委托 / passive 降低回调**频率**
- **右侧（渲染侧）**：React 记忆化、Vue 浅响应降低渲染**范围**

## 心智模型：什么时候该优化

> 不是所有事件都需要防抖，不是所有组件都需要 memo。**先 Profiler，再优化**——错误的优化比不优化更糟。

**事件侧常见信号**

- 滚动 / 拖拽时 FPS 明显下降、Profiler 看到大量 Long Task
- 输入框每按一个字都触发昂贵校验或网络请求
- 监听器数量随列表项线性增长（万级子项 = 万级监听器）

**渲染侧常见信号**

- React DevTools Profiler 看到组件「why did this render?」 = 「props changed」 但实际内容没变
- Vue DevTools 看到大对象（千级表格、地图数据）初次 reactive 包装很慢
- 父组件 state 变化时，明显无关的子组件也重渲染

## 优化的两条原则

**原则一：从源头减负，而不是堆 Hook**

- React 官方在 `useMemo` Deep Dive 明确：「**最小化 props 比加 memo 更有效**」——传原始值而非整个对象（`<Profile name={name} age={age}/>` 优于 `<Profile person={person}/>`)
- Vue 官方在 `shallowRef` 警告：「**只用于组件根级 state**」，不要嵌套进深 reactive
- 与其给每个回调加 throttle，不如先看能否用事件委托把监听器从 N 个降到 1 个

**原则二：测量驱动，警惕反模式**

- 没用 Profiler 录制就加 `useMemo`，很可能只增加首屏开销没收益
- `useCallback(fn)` 忘了传 deps 数组 = 完全没缓存
- `v-memo` 依赖漏写真正变化的值 → UI 不刷新

## 浏览器与框架版本

| 依赖 | 稳定版本 | 关键说明 |
| --- | --- | --- |
| React | 19.2 | React Compiler 正式可用并推荐；`useMemo`/`useCallback`/`memo` 三页均注明启用 Compiler 后通常无需手动 memoize |
| Vue | 3.5 | `shallowRef`/`shallowReactive`/`triggerRef`/`customRef`/`markRaw`/`toRaw`/`v-memo`（3.2+）全部稳定 |
| Lodash | 4.17.15 | `_.debounce` / `_.throttle` 自 0.1.0 起 API 稳定，多年未变 |
| Web 标准 | — | 事件冒泡 / 捕获 / 委托 / passive listener 长期稳定 |

## 下一步

- [核心手段](./guide-line.md)：防抖 / 节流 / 事件委托 / passive / React 记忆化 / Vue 浅响应 / 反模式
- [参考](./reference.md)：API 表 / 版本 / 官方资源链接
