---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 React 19.2 / Vue 3.5 / Lodash 4.17.15 / MDN 官方文档编写

## 速查

- **防抖**：`_.debounce(fn, wait?, { leading:false, trailing:true, maxWait? })` —— 搜索框 / resize / 校验
- **节流**：`_.throttle(fn, wait?, { leading:true, trailing:true })` —— 滚动 / 拖拽 / mousemove
- **委托**：父监听 + `event.target.closest('[data-id]')`；`event.target` ≠ `event.currentTarget`
- **passive**：`addEventListener('scroll', fn, { passive: true })`
- **React 值缓存**：`useMemo(fn, deps)`；箭头返回对象用 `() => ({...})`
- **React 函数缓存**：`useCallback(fn, deps)` ≡ `useMemo(() => fn, deps)`
- **React 组件缓存**：`memo(Component, arePropsEqual?)`；默认 `Object.is` 浅比较
- **React Compiler**：编译期自动 memoize，启用后通常移除手动三者
- **Vue 浅响应**：`shallowRef` / `shallowReactive` / `triggerRef` / `customRef` / `markRaw` / `toRaw`
- **Vue 模板缓存**：`v-memo="[deps]"`（v-for 同元素）/ `v-once`
- 完整说明见 [入门](./getting-started.md) / [核心手段](./guide-line.md)

## React 记忆化 API

| API | 签名 | 作用 |
| --- | --- | --- |
| `useMemo` | `useMemo(calculateValue, dependencies)` | 缓存计算值；依赖用 `Object.is` 比较 |
| `useCallback` | `useCallback(fn, dependencies)` | 缓存函数本身（不调用） |
| `memo` | `memo(Component, arePropsEqual?)` | HOC，props 浅比较跳过重渲染 |
| React Compiler | 编译期自动 memoize | 自动缓存值 / 函数 / 组件，包括中间值 |

**useMemo 三类有效场景**：① 计算昂贵且依赖少变 ② 作为 prop 传给 memo 子组件 ③ 作为其他 Hook 的依赖。

## Vue Reactivity: Advanced

| API | 签名 | 作用 |
| --- | --- | --- |
| `shallowRef` | `shallowRef(value): ShallowRef<T>` | 仅 `.value` 访问响应 |
| `triggerRef` | `triggerRef(ref)` | 强制触发 shallowRef 依赖的 effect |
| `shallowReactive` | `shallowReactive(target)` | 根级属性响应；嵌套不响应；ref 不解包 |
| `customRef` | `customRef(factory)` | 自定义 track/trigger（可实现 debounce ref） |
| `markRaw` | `markRaw(value)` | 永不转响应式 |
| `toRaw` | `toRaw(proxy)` | 取原始对象 |
| `v-memo` | `v-memo="[depA, depB]"` | 模板子树记忆化；与 v-for 同元素 |
| `v-once` | `v-once` | 只渲染一次（等价 `v-memo="[]"`） |

## Lodash debounce / throttle

| API | 签名 | 默认选项 |
| --- | --- | --- |
| `_.debounce` | `_.debounce(func, [wait=0], [options={}])` | `{ leading:false, trailing:true }` |
| `_.throttle` | `_.throttle(func, [wait=0], [options={}])` | `{ leading:true, trailing:true }`（=debounce + `maxWait=wait`） |

**返回值**：函数带 `.cancel()` / `.flush()` 方法。

**选项取值行为**

| leading | trailing | 序列首次连续调用 N 次（wait=200） |
| --- | --- | --- |
| false | true | 停手 200ms 后执行 1 次（debounce 默认）|
| true | true | 首次立即 + 停手补 1 次（throttle 默认，共 2 次）|
| true | false | 仅首次立即（按钮防连点）|
| false | false | 不执行（无意义）|

## DOM 事件 API

| API | 作用 |
| --- | --- |
| `addEventListener(type, fn, { capture?, passive?, once? })` | 注册监听器；`capture:true` 捕获阶段、`passive:true` 不 preventDefault、`once:true` 自动解绑 |
| `event.target` | 实际触发事件的元素（最深） |
| `event.currentTarget` | 当前绑定监听器的元素 |
| `event.stopPropagation()` | 阻止冒泡 / 捕获 |
| `event.preventDefault()` | 阻止默认行为（passive 监听器内无效） |

**事件流顺序**：捕获阶段（由外向内）→ 目标阶段 → 冒泡阶段（由内向外）。

## 完整依赖版本

| 依赖 | 版本 | 关键说明 |
| --- | --- | --- |
| React | 19.2 稳定 | React Compiler 正式可用并推荐 |
| Vue | 3.5 稳定 | shallowRef/shallowReactive/triggerRef/customRef/markRaw/toRaw 全稳定；v-memo 3.2+ |
| Lodash | 4.17.15 | debounce/throttle 自 0.1.0 API 稳定 |
| Web 标准 | 长期稳定 | 事件冒泡 / 捕获 / 委托 / passive listener |

## 官方资源

- [React useMemo](https://react.dev/reference/react/useMemo)
- [React useCallback](https://react.dev/reference/react/useCallback)
- [React memo](https://react.dev/reference/react/memo)
- [React Compiler 指南](https://react.dev/learn/react-compiler)
- [Vue Reactivity: Advanced](https://vuejs.org/api/reactivity-advanced.html)
- [Vue v-memo 指南](https://vuejs.org/api/built-in-directives.html#v-memo)
- [Lodash debounce](https://lodash.com/docs/4.17.15#debounce)
- [Lodash throttle](https://lodash.com/docs/4.17.15#throttle)
- [MDN 事件冒泡](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- [MDN addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [MDN passive 优化滚动](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scroll_performance_using_passive_listeners)
