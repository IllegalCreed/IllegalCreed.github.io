---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 生成器：`function*` + `yield`；调用得生成器对象，`next()` 跑到下一个 `yield`；`yield*` 委托、`next(v)` / `return()` / `throw()` 双向与外控
- 自定义迭代器：给对象写 `*[Symbol.iterator]()`；可复用容器要「每次新建生成器」才能重复遍历
- 异步：`async function*` + `for await...of`（ES2018）；`Array.fromAsync`（ES2024）物化有限异步序列
- Proxy：`new Proxy(target, handler)`，**13 个陷阱**；没写的透传；多数陷阱返回 boolean；受不变量约束
- Reflect：与陷阱一一对应的默认实现；陷阱里 `Reflect.*(...)` 转发，`get`/`set` 传 `receiver` 保 `this`
- well-known symbols：`iterator` / `asyncIterator` / `toPrimitive` / `toStringTag` / `hasInstance` / `dispose` …
- 资源管理（ES2026·Stage 4·**非 Baseline**）：`using` → `[Symbol.dispose]`、`await using` → `[Symbol.asyncDispose]`、手动 `DisposableStack`
- `WeakRef` / `FinalizationRegistry`（ES2021）：弱引用 + GC 回调，**非确定、尽力而为**，不可托付关键清理

## 生成器方法速查

| 方法 | 作用 |
| --- | --- |
| `gen.next(v)` | 恢复执行到下一个 `yield`；`v` 成为当前 `yield` 表达式的值（首次调用的 `v` 被忽略） |
| `gen.return(v)` | 提前结束，返回 `{ value: v, done: true }`，触发 `try...finally` |
| `gen.throw(e)` | 在当前 `yield` 暂停点抛出 `e`，可被生成器内 `try...catch` 接住 |
| `yield x` | 产出 `x` 并暂停 |
| `yield* iterable` | 委托：逐个透传另一个可迭代对象 / 生成器的产出 |

## 迭代协议速查

| 协议 | 关键方法 | 用于 |
| --- | --- | --- |
| 可迭代（iterable） | `[Symbol.iterator]()` → 迭代器 | `for...of` / `...` / 解构 |
| 迭代器（iterator） | `next()` → `{ value, done }` | 被上面驱动 |
| 异步可迭代 | `[Symbol.asyncIterator]()` → 异步迭代器 | `for await...of` |
| 异步迭代器 | `next()` → `Promise<{ value, done }>` | 被 `for await...of` 驱动 |

## Proxy 13 个陷阱 ↔ Reflect ↔ 触发操作

| 陷阱 / `Reflect` 方法 | 内部方法 | 触发它的操作 |
| --- | --- | --- |
| `get(t, k, recv)` | `[[Get]]` | `obj.k` / `obj[k]` |
| `set(t, k, v, recv)` | `[[Set]]` | `obj.k = v` |
| `has(t, k)` | `[[HasProperty]]` | `k in obj` |
| `deleteProperty(t, k)` | `[[Delete]]` | `delete obj.k` |
| `ownKeys(t)` | `[[OwnPropertyKeys]]` | `Object.keys` / `getOwnPropertyNames` / `for...in` |
| `getOwnPropertyDescriptor(t, k)` | `[[GetOwnProperty]]` | `Object.getOwnPropertyDescriptor` |
| `defineProperty(t, k, desc)` | `[[DefineOwnProperty]]` | `Object.defineProperty` / 类字段 |
| `getPrototypeOf(t)` | `[[GetPrototypeOf]]` | `Object.getPrototypeOf` / `instanceof` |
| `setPrototypeOf(t, proto)` | `[[SetPrototypeOf]]` | `Object.setPrototypeOf` |
| `isExtensible(t)` | `[[IsExtensible]]` | `Object.isExtensible` |
| `preventExtensions(t)` | `[[PreventExtensions]]` | `Object.preventExtensions` |
| `apply(t, thisArg, args)` | `[[Call]]` | `proxy(...)` |
| `construct(t, args, newTarget)` | `[[Construct]]` | `new proxy(...)` |

> 返回值：`set` / `deleteProperty` / `defineProperty` / `has` / `preventExtensions` / `setPrototypeOf` 须返回 boolean；`get` 返回任意值；`apply` / `construct` 返回调用结果；`ownKeys` 返回键数组；`getOwnPropertyDescriptor` 返回描述符或 `undefined`。

## Reflect 优于旧写法的点

| 任务 | `Reflect` | 旧写法 | 优势 |
| --- | --- | --- | --- |
| 带 `this` 控制地读 | `Reflect.get(o, k, recv)` | `o[k]` | 唯一能控制 getter 的 `this`（`receiver`） |
| 安全删属性 | `Reflect.deleteProperty(o, k)` | `delete o[k]` | 返回 boolean，不抛错 |
| 安全定义属性 | `Reflect.defineProperty(o, k, d)` | `Object.defineProperty` | 返回 boolean，不抛错 |
| 自定义 `new.target` 构造 | `Reflect.construct(F, args, NT)` | `new F(...)` | 唯一能指定 `new.target` |
| 在陷阱内转发默认行为 | `Reflect.*` | 手写等价操作 | 与陷阱同名同参、返回值天然契合 |

## well-known symbols 速查

| symbol | 定制的内置操作 |
| --- | --- |
| `Symbol.iterator` / `Symbol.asyncIterator` | `for...of` / `for await...of`、扩展、解构 |
| `Symbol.toPrimitive` | 对象 → 原始值（`hint`：`number` / `string` / `default`） |
| `Symbol.toStringTag` | `Object.prototype.toString` 的 `[object Xxx]` |
| `Symbol.hasInstance` | `instanceof` 判定 |
| `Symbol.isConcatSpreadable` | `Array.prototype.concat` 是否展开 |
| `Symbol.match` / `replace` / `search` / `split` / `matchAll` | 对应 `String.prototype` 方法 |
| `Symbol.species` | 派生对象的构造器 |
| `Symbol.unscopables` | `with` 排除的属性 |
| `Symbol.dispose` / `Symbol.asyncDispose` | `using` / `await using` 的释放钩子（ES2026） |

> `Symbol(desc)` 每次唯一不可重得；`Symbol.for(key)` 走全局注册表、同 key 同值，`Symbol.keyFor` 反查。

## 资源管理速查

| | 同步 | 异步 |
| --- | --- | --- |
| 声明 | `using x = res` | `await using x = res` |
| 释放钩子 | `[Symbol.dispose]()` | `[Symbol.asyncDispose]()`（回退到 `dispose`） |
| 手动容器 | `DisposableStack` | `AsyncDisposableStack` |
| 释放方法 | `dispose()` | `await disposeAsync()` |
| 容器方法 | `use` / `adopt` / `defer` / `move` | 同左（异步变体） |

> 释放顺序「后声明先释放」；释放期异常聚合为 `SuppressedError`（`.error` 新错误、`.suppressed` 原错误）。

## Baseline / 版本状态（2026-06 核）

| 特性 | 版本 | 状态 | 建议 |
| --- | --- | --- | --- |
| 生成器 / 迭代协议 / `yield*` | ES2015 | ✅ Baseline 广泛可用 | 放心用 |
| 异步生成器 / `for await...of` | ES2018 | ✅ Baseline 广泛可用 | 放心用 |
| `Proxy` / `Reflect` / `Proxy.revocable` | ES2015 | ✅ Baseline 广泛可用 | 放心用；Proxy 不可完整 polyfill |
| well-known symbols（`toPrimitive` / `hasInstance` …） | ES2015 起 | ✅ Baseline 广泛可用 | 放心用 |
| `WeakRef` / `FinalizationRegistry` | ES2021 | ✅ 广泛可用 | 仅作辅助，**勿依赖回收时机** |
| `Array.fromAsync` | ES2024 | 🟡 Baseline 新近可用 | 老环境检测 / polyfill |
| Iterator Helpers（`take` / `map` …） | ES2025 | 🟡 Baseline 新近可用 | 老环境降级为 `[...it]` |
| `using` / `await using` / `Symbol.dispose` / `DisposableStack` | ES2026（Stage 4） | 🟠 **非 Baseline** | V8 / Node 24+ / TS 5.2+ 已支持；Safari / Firefox 跟进；投产前确认环境或降级（`core-js`） |

## 权威链接

**标准 / 规范**

- [MDN: Iterators and generators（指南）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators) · [Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)
- [MDN: `function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) · [`async function*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*) · [`for await...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
- [MDN: Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) · [Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect) · [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [MDN: `using` / `await using`（显式资源管理）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using) · [`WeakRef`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef) · [`FinalizationRegistry`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)
- [TC39: Explicit Resource Management 提案](https://github.com/tc39/proposal-explicit-resource-management)

**课程 / 指南**

- [javascript.info: Generators](https://javascript.info/generators) · [Async iteration and generators](https://javascript.info/async-iterators-generators)
- [javascript.info: Proxy and Reflect](https://javascript.info/proxy)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [core-js（资源管理等新特性 polyfill）](https://github.com/zloirock/core-js)

## 相关页

- [入门](./getting-started) · [生成器基础](./guide-line/generators) · [异步生成器](./guide-line/async-generators)
- [用生成器实现自定义迭代器](./guide-line/custom-iterators) · [Proxy 与 Reflect](./guide-line/proxy-reflect) · [元编程进阶与资源管理](./guide-line/metaprogramming-resources)
- 相关叶：[数组与可迭代协议](../js-arrays-iterables/) · [对象与原型继承](../js-objects-prototype/)
