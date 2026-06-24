---
layout: doc
outline: [2, 3]
---

# 参考

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **执行次序口诀**：同步全跑完 → **清空所有微任务** →（可能渲染）→ 取**一个**宏任务 → 再清空微任务……循环
- **微任务**：`Promise.then`/`catch`/`finally`、`queueMicrotask`、`MutationObserver`；**宏任务**：`setTimeout`/`setInterval`、I/O、UI 事件
- **Promise 三态**：`pending` → `fulfilled`(值) / `rejected`(原因)，敲定后不可逆；`then` 返回新 Promise，错误冒泡到最近 `catch`
- **组合器**：`all`（全成 / 速败）、`allSettled`（收齐结局 / 不拒绝）、`race`（最快敲定）、`any`（最快成功 / 全败为 `AggregateError`）
- **async/await**：`async` 必返 Promise；`await` 暂停到敲定、拒绝即抛；独立任务并行用 `await Promise.all([...])`，别串行
- **取消**：`AbortController` + `signal`；`AbortSignal.timeout(ms)`（`TimeoutError`）；`AbortSignal.any([...])`
- **避坑**：`then` 里发起的 Promise 必 `return`；`fetch` 对 4xx/5xx **不拒绝**要查 `res.ok`；`forEach(async)` 不等待
- **新特性版本**：顶层 await（ES2022 模块）、`Promise.any`/`allSettled`（ES2021/ES2020）、`Promise.withResolvers`（ES2024）

## 事件循环执行次序

```js
console.log("1"); // 同步
setTimeout(() => console.log("4"), 0); // 宏任务
Promise.resolve().then(() => console.log("3")); // 微任务
console.log("2"); // 同步
// 输出：1 → 2 → 3 → 4
```

每轮：取一个宏任务执行 → **清空整个微任务队列**（含其间新增的微任务）→ 可能渲染 → 下一个宏任务。**渲染只在宏任务之间，绝不在微任务之间**。

## Promise 实例方法

| 方法 | 签名 | 返回 | 说明 |
| --- | --- | --- | --- |
| `then` | `then(onF?, onR?)` | 新 Promise | 注册兑现 / 拒绝回调；回调恒异步（微任务） |
| `catch` | `catch(onR)` | 新 Promise | `then(null, onR)` 的简写 |
| `finally` | `finally(onFinally)` | 新 Promise | 无论成败都执行，不接收值、不改结果 |

## Promise 静态方法

| 方法 | 兑现条件 | 拒绝条件 | 结果 |
| --- | --- | --- | --- |
| `Promise.all(it)` | 全部兑现 | 任一拒绝（fail-fast） | 有序值数组 |
| `Promise.allSettled(it)` | 全部敲定 | 永不拒绝 | `{status, value/reason}[]` |
| `Promise.race(it)` | 首个敲定是兑现 | 首个敲定是拒绝 | 单个值 |
| `Promise.any(it)` | 首个兑现 | 全部拒绝 | 单个值 / `AggregateError` |
| `Promise.resolve(v)` | — | — | 立即兑现（或同化 thenable） |
| `Promise.reject(e)` | — | — | 立即拒绝 |
| `Promise.withResolvers()` | — | — | `{ promise, resolve, reject }`（ES2024） |

## async / await 速记

```js
async function load() {
  try {
    // 串行（有依赖时）：
    const user = await getUser();
    const orders = await getOrders(user.id);

    // 并行（相互独立时）：
    const [a, b] = await Promise.all([fetchA(), fetchB()]);

    return { user, orders, a, b };
  } catch (err) {
    handle(err); // 捕获任意一步的拒绝
  } finally {
    cleanup(); // 必做的清理
  }
}
```

- `async` 函数 `return v` → 兑现为 `v`；`throw e` → 拒绝为 `e`；
- 循环并行：`await Promise.all(arr.map(fn))`；循环串行：`for...of` 内 `await`；
- 顶层 `await` 仅限 **ES 模块**，会阻塞依赖它的模块图。

## 取消与超时速记

```js
// 手动取消
const c = new AbortController();
fetch(url, { signal: c.signal });
c.abort(); // → 请求拒绝为 AbortError

// 声明式超时（Baseline 2024）
fetch(url, { signal: AbortSignal.timeout(5000) }); // → 超时拒绝为 TimeoutError

// 合并取消源：超时 或 手动
const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
```

| 成员 | 含义 |
| --- | --- |
| `controller.abort(reason?)` | 触发中止 |
| `signal.aborted` / `signal.reason` | 是否已中止 / 中止原因 |
| `signal.throwIfAborted()` | 已中止则抛 `signal.reason` |
| `AbortSignal.timeout(ms)` | `ms` 后自动中止（`TimeoutError`） |
| `AbortSignal.any([...])` | 任一中止则整体中止 |

## 常见陷阱清单

| 陷阱 | 后果 | 正解 |
| --- | --- | --- |
| `then` 里漏写 `return` | 链不等内部 Promise，拿到 `undefined` | 始终 `return` 内部 Promise（或用 `await`） |
| 同步 `try/catch` 包异步回调 | 抓不到错误 | 用 `Promise.catch` 或 `async` + `try/catch` |
| `fetch` 不检查 `res.ok` | 404/500 被当成功 | `if (!res.ok) throw …` |
| 逐个 `await` 独立任务 | 串行，平白变慢 | `await Promise.all([...])` |
| `arr.forEach(async …)` | 不会等待，时序错乱 | `for...of`（串行）/ `Promise.all(map)`（并行） |
| 用 `Promise.race` 做超时 | 底层请求未真正取消 | `AbortSignal.timeout` |
| 快速连续请求 | 旧响应覆盖新响应（竞态） | 取消上一个 / 比对最新请求标记 |

## 现代特性版本与 Baseline（2026-06 核）

| 特性 | 引入 | 状态 |
| --- | --- | --- |
| `Promise` / `then`/`catch`/`finally` | ES2015 / `finally` ES2018 | ✅ Baseline 广泛可用 |
| `async` / `await` | ES2017 | ✅ Baseline 广泛可用 |
| `Promise.allSettled` | ES2020 | ✅ Baseline 广泛可用 |
| `Promise.any` / `AggregateError` | ES2021 | ✅ Baseline 广泛可用 |
| 顶层 `await`（ES 模块） | ES2022 | ✅ Baseline 广泛可用 |
| `AbortController` / `AbortSignal` | WHATWG（非 ES） | ✅ Baseline 广泛可用 |
| `AbortSignal.timeout` / `AbortSignal.any` | WHATWG | 🟡 Baseline 新近可用（2024） |
| `Promise.withResolvers` | ES2024 | 🟡 Baseline 新近可用（2024，老环境需 polyfill） |
| `scheduler.postTask` / `scheduler.yield` | WHATWG（调度） | 🟠 渐进增强，注意降级 |

## 权威链接

**标准 / 规范**

- [WHATWG HTML — Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [TC39 ECMAScript — Execution Contexts](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html)
- [MDN: `Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) · [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) · [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)

**指南 / 课程**

- [MDN: Using promises（使用 Promise）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) · [JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [javascript.info: 事件循环](https://javascript.info/event-loop) · [Promise 链](https://javascript.info/promise-chaining) · [async/await](https://javascript.info/async-await)

**兼容性 / 调试**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- Chrome DevTools — Performance 面板可视化主线程任务 / 微任务时序

## 相关页

- [入门](./getting-started) · [事件循环：调用栈与宏微任务](./guide-line/event-loop) · [回调与回调地狱](./guide-line/callbacks-evolution)
- [Promise 基础与状态机](./guide-line/promise-basics) · [Promise 组合器](./guide-line/promise-combinators)
- [async/await](./guide-line/async-await) · [取消、超时与竞态](./guide-line/cancellation-timeout)
