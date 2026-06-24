---
layout: doc
outline: [2, 3]
---

# 取消、超时与竞态

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **Promise 不可取消**：一旦发起就没有内建「中止」开关；取消要靠外部信号机制 `AbortController` / `AbortSignal`
- **`AbortController`**：`const c = new AbortController()` → `c.signal` 传给可取消的 API → `c.abort(reason)` 触发取消
- **`AbortSignal`**：`signal.aborted`（是否已中止）、`signal.reason`（中止原因）、`abort` 事件、`signal.throwIfAborted()`
- **`fetch` 消费信号**：`fetch(url, { signal })`；被中止时请求拒绝为 `AbortError`（`err.name === "AbortError"`）
- **`AbortSignal.timeout(ms)`**（Baseline 2024）：返回一个 `ms` 后自动中止的信号，超时拒绝为 `TimeoutError`
- **`AbortSignal.any([s1, s2])`**：合并多个信号，任一中止则整体中止（如「超时」或「用户手动取消」二选一）
- **`Promise.withResolvers()`**（ES2024）：返回 `{ promise, resolve, reject }`，把 resolve/reject 提到外部作用域，替代手写 deferred
- **竞态防护**：快速连续请求要丢弃过期响应——用「取消上一个」或「比对最新请求标记」防止旧结果覆盖新结果

## Promise 为什么不能取消

`Promise` 表示「一个已经发生的异步过程的未来结果」——它一旦被创建，底层操作就已在跑，`Promise` 对象上**没有** `.cancel()`。`Promise.race` 那种「超时」也只是**不再等待**结果，底层请求仍在后台跑完。要真正**中止**操作（停掉网络请求、不再触发回调），需要一套独立的信号机制：`AbortController` 与 `AbortSignal`。

## AbortController / AbortSignal 基础

模式固定三步：**建控制器 → 把它的 `signal` 交给可取消的 API → 在需要时 `abort()`**。

```js
const controller = new AbortController();
const { signal } = controller; // 把信号交给下游

// 监听中止（可选）
signal.addEventListener("abort", () => {
  console.log("被中止了，原因：", signal.reason);
});

// 某处触发取消（如用户点了「取消」按钮）
controller.abort(); // 也可传原因：controller.abort(new Error("用户取消"))

console.log(signal.aborted); // true
console.log(signal.reason); // 默认是一个 AbortError；或你传入的原因
```

`AbortSignal` 的关键成员：

| 成员 | 含义 |
| --- | --- |
| `signal.aborted` | 布尔值，是否已中止 |
| `signal.reason` | 中止原因（默认 `AbortError`，或 `abort(reason)` 传入的值） |
| `abort` 事件 | 中止时在 signal 上触发，可 `addEventListener` 监听 |
| `signal.throwIfAborted()` | 若已中止则立即抛出 `signal.reason`，便于在自定义异步里主动检查 |

## 用 AbortController 取消 fetch

`fetch` 原生支持 `signal`——把信号传进去，调用 `abort()` 就能真正中断请求，请求随之拒绝为 `AbortError`：

```js
const controller = new AbortController();

const promise = fetch("/api/large-file", { signal: controller.signal })
  .then((res) => res.blob())
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("请求已取消"); // 区分「主动取消」与「真正出错」
    } else {
      throw err; // 其他错误照常处理
    }
  });

// 3 秒后用户切走了页面，取消请求
setTimeout(() => controller.abort(), 3000);
```

`signal` 还能传给 `addEventListener`（`{ signal }` 选项可在中止时自动解绑监听）、`AbortSignal` 兼容的各种 Web API，是统一的「取消令牌」。

## AbortSignal.timeout：声明式超时（Baseline 2024）

手写 `setTimeout` + `abort` 能做超时，但 ES 提供了更简洁的 `AbortSignal.timeout(ms)`——它直接返回一个「`ms` 毫秒后自动中止」的信号，超时拒绝为 **`TimeoutError`**（注意不是 `AbortError`）：

```js
try {
  const res = await fetch("/api/slow", { signal: AbortSignal.timeout(5000) });
  const data = await res.json();
} catch (err) {
  if (err.name === "TimeoutError") {
    console.error("超过 5 秒没响应"); // 超时
  } else if (err.name === "AbortError") {
    console.error("被手动取消"); // 用户主动中止
  } else {
    console.error("其他错误：", err);
  }
}
```

特点：超时计的是**活动时间**（页面进入后退/前进缓存 bfcache、或在挂起的 Worker 中时会暂停计时），Worker 中也可用。它比 `Promise.race` 的超时更优——能**真正中止**底层请求，而非只是放弃等待。

## AbortSignal.any：合并多个取消源

常见需求：一个请求**既要有超时、又要能被用户手动取消**。`AbortSignal.any([...])` 把多个信号合并成一个，**任一中止则合并信号中止**：

```js
const userCancel = new AbortController();

const signal = AbortSignal.any([
  userCancel.signal, // 用户点取消
  AbortSignal.timeout(10000), // 或者 10 秒超时
]);

const res = await fetch("/api/data", { signal }); // 两个条件谁先到都会中止
// 按钮：userCancel.abort();
```

## Promise.withResolvers：更优雅的 deferred（ES2024）

有时你需要在 `Promise` 的执行器**之外**手动控制 resolve/reject——比如把一个事件回调「兑现」成 Promise。过去要手写 deferred 模式，把 `resolve`/`reject` 从执行器里「漏」到外层变量；ES2024 的 `Promise.withResolvers()` 把这件事一步到位，返回 `{ promise, resolve, reject }`：

```js
// 旧写法：手动 deferred，啰嗦
let resolve, reject;
const promise = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});

// 新写法（ES2024）：一行解构
const { promise, resolve, reject } = Promise.withResolvers();
```

它特别适合「监听器只挂一次、却要为多次事件分别 resolve」的场景，比如把基于事件的流包装成异步迭代：

```js
// 把 EventEmitter 风格的流转成「等下一条消息」的 Promise
function createMessageStream(socket) {
  let { promise, resolve } = Promise.withResolvers();
  socket.on("message", (msg) => {
    resolve(msg); // 兑现当前这条
    ({ promise, resolve } = Promise.withResolvers()); // 立刻为下一条续上新的
  });
  return {
    next: () => promise, // 每次 await next() 拿下一条消息
  };
}
```

`Promise.withResolvers` 自 2024 年起在主流浏览器 Baseline 可用，老环境需 polyfill。

## 竞态条件：丢弃过期的响应

异步最隐蔽的 bug 之一是**竞态**：用户在搜索框快速输入，先后发出请求 A、B；若 A 比 B 晚返回，**旧结果 A 会覆盖新结果 B**，界面显示错乱。

```js
// ❌ 有竞态：哪个先回来就显示哪个，可能是过期的
async function search(keyword) {
  const res = await fetch(`/api/search?q=${keyword}`);
  showResults(await res.json()); // A 晚于 B 返回时会覆盖 B 的结果
}
```

**方案一：取消上一个请求**（首选，连带省流量）：

```js
let controller = null;
async function search(keyword) {
  controller?.abort(); // 取消上一次还没回来的请求
  controller = new AbortController();
  try {
    const res = await fetch(`/api/search?q=${keyword}`, { signal: controller.signal });
    showResults(await res.json()); // 只有最新这次能走到这
  } catch (err) {
    if (err.name !== "AbortError") throw err; // 被取消的忽略
  }
}
```

**方案二：标记最新请求，丢弃过期响应**（适合无法取消的场景）：

```js
let latestId = 0;
async function search(keyword) {
  const requestId = ++latestId; // 本次请求的序号
  const res = await fetch(`/api/search?q=${keyword}`);
  const data = await res.json();
  if (requestId === latestId) {
    // 只有「我仍是最新」才渲染，过期的直接丢弃
    showResults(data);
  }
}
```

## 小结

`Promise` 不可取消，但 `AbortController` / `AbortSignal` 提供了统一的「取消令牌」：`fetch` 等 API 消费 `signal`，`AbortSignal.timeout` 做声明式超时、`AbortSignal.any` 合并多源取消；`Promise.withResolvers`（ES2024）让外部控制 Promise 变得优雅；而快速连续请求要用「取消上一个」或「比对最新标记」防竞态。至此异步全链路打通——从事件循环到取消机制的速查与链接，汇总在 [参考](../reference)。
