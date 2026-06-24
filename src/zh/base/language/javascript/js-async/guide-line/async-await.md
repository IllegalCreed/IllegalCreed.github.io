---
layout: doc
outline: [2, 3]
---

# async/await

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **本质**：建立在 `Promise` 之上的语法糖——把链式 `then` 写成「看起来同步」的顺序代码，底层仍是 `Promise` + 微任务
- **`async` 函数**：**总是返回 `Promise`**；`return 值` → 兑现为该值，`throw` → 拒绝为该原因；返回 `Promise` 则被展开
- **`await expr`**：**暂停** `async` 函数体直到 `expr`（通常是 Promise）敲定，取出兑现值；拒绝则在 `await` 处**抛出**
- **暂停不阻塞**：`await` 挂起的只是当前 `async` 函数，引擎照常跑别的——`await` 后续代码相当于排进微任务
- **错误处理**：直接用 `try`/`catch` 包 `await`，像同步代码一样捕获拒绝；终结于函数边界外则用 `.catch()`
- **await thenable**：`await` 不止认原生 Promise，任何带 `.then` 方法的对象都能 await
- **顺序 vs 并行**：相互独立的任务别逐个 `await`（串行）；用 `await Promise.all([...])` 同时发起
- **顶层 await**：ES2022 起，**ES 模块**顶层可直接 `await`（无需包 async 函数）；CommonJS / 普通脚本不支持

## async 函数：永远返回 Promise

给函数加 `async`，它就**一定返回 `Promise`**——这是理解一切的起点。函数里 `return` 的普通值会被自动包进一个兑现的 Promise；`throw` 出的错误会变成拒绝的 Promise：

```js
async function f() {
  return 42; // 普通值被包成 Promise
}
f().then((v) => console.log(v)); // 42——必须用 then/await 取，f() 是 Promise 不是 42

async function g() {
  throw new Error("炸了"); // 抛错 → 返回拒绝的 Promise
}
g().catch((e) => console.error(e.message)); // "炸了"
```

类的方法同样可加 `async`，行为一致：

```js
class Api {
  async getUser(id) {
    // 返回 Promise
    const res = await fetch(`/api/user/${id}`);
    return res.json();
  }
}
```

## await：暂停直到敲定

`await` 放在 `async` 函数体内，它会**暂停函数的执行**，等右侧的 Promise 敲定，再把**兑现值**作为表达式的结果交出来；继续往下跑：

```js
async function showUser() {
  const res = await fetch("/api/user"); // 暂停，直到响应到达；res 是 Response
  const user = await res.json(); // 暂停，直到解析完成；user 是对象
  console.log(user.name); // 两次 await 都敲定后才执行
}
```

「暂停」只针对**这个 async 函数自己**——引擎不会傻等，它会去跑调用栈上其他代码、处理别的任务。本质上，`await` 把「后续代码」登记为「该 Promise 敲定后的微任务」，所以下面这段的顺序和上一页的微任务规则完全一致：

```js
async function demo() {
  console.log("1");
  await null; // await 一个非 Promise，也会让出到微任务
  console.log("3"); // 被排进微任务，晚于同步的 "2"
}
demo();
console.log("2");
// 输出：1 → 2 → 3
```

## 同样的逻辑，then 链 vs async/await

`async`/`await` 不引入新能力，只是把 `Promise` 写得更顺。同一段逻辑两种写法对比：

```js
// then 链版
function loadUser() {
  return fetch("/api/user")
    .then((res) => res.json())
    .then((user) => fetch(`/api/orders/${user.id}`))
    .then((res) => res.json());
}

// async/await 版：读起来像同步，且天然避免「忘了 return」的坑
async function loadUser() {
  const res = await fetch("/api/user");
  const user = await res.json();
  const ordersRes = await fetch(`/api/orders/${user.id}`);
  return ordersRes.json();
}
```

后者的优势：没有层层 `.then` 缩进、中间变量是普通局部变量、可以用普通的 `if`/`for`/`try` 控制流，且不存在 `then` 里「漏写 `return`」的隐患。

## 错误处理：回归 try/catch

`async`/`await` 最大的体验提升，是让异步错误能被**普通的 `try`/`catch`** 捕获——这是回调时代办不到的（同步 `try` 抓不到异步回调的错）。`await` 的 Promise 若拒绝，就在 `await` 处像 `throw` 一样抛出：

```js
async function showUser() {
  try {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // 自己抛的也能被抓
    const user = await res.json(); // 这里拒绝同样落入 catch
    console.log(user.name);
  } catch (err) {
    console.error("加载失败：", err); // 任意一步的错误都到这
  } finally {
    hideLoading(); // 可选：无论成败的清理
  }
}
```

如果错误要跨出 async 函数边界，在调用处用 `.catch()`（因为外层若非 async 就不能 `await`）：

```js
showUser().catch((err) => report(err));
```

::: warning fetch 不会因 4xx/5xx 而拒绝
`fetch` 只在**网络层失败**（断网、CORS、DNS）时才拒绝 Promise；服务器返回 404/500 时它**仍然兑现**。务必自己检查 `res.ok` 并手动 `throw`，否则错误会被 `try`/`catch` 漏掉。
:::

## await 接受 thenable

`await` 不要求右侧是原生 `Promise`——任何**带 `.then(resolve, reject)` 方法的对象**（thenable）都能被 await，引擎会调用它的 `then` 来取值。这让 `await` 能兼容各种「类 Promise」实现：

```js
const thenable = {
  then(resolve) {
    setTimeout(() => resolve("来自 thenable"), 100);
  },
};
const value = await thenable; // 引擎调用其 then；value === "来自 thenable"
```

## 顺序 vs 并行：最重要的性能取舍

这是 `async`/`await` 最容易写错的地方。**逐个 `await` 会让本可并行的任务变成串行**，平白拉长总时间：

```js
// ❌ 串行：总耗时 ≈ t1 + t2 + t3，第二个请求干等第一个结束才发
async function loadSlow() {
  const a = await fetch("/api/a"); // 等 a 完成…
  const b = await fetch("/api/b"); // …才开始 b
  const c = await fetch("/api/c"); // …才开始 c
  return [a, b, c];
}

// ✅ 并行：三个请求同时发起，总耗时 ≈ max(t1, t2, t3)
async function loadFast() {
  const [a, b, c] = await Promise.all([
    fetch("/api/a"),
    fetch("/api/b"),
    fetch("/api/c"),
  ]);
  return [a, b, c];
}
```

诀窍：**先把所有 `Promise` 都发起（不加 `await`），再一起 `await`**：

```js
async function loadFast2() {
  const pA = fetch("/api/a"); // 立刻发起，不等
  const pB = fetch("/api/b"); // 立刻发起
  const [a, b] = await Promise.all([pA, pB]); // 统一等
  return [a, b];
}
```

只有当后一步**真的依赖**前一步的结果时（如先拿 `user.id` 才能查订单），才该串行 `await`；相互独立就并行。需要「部分失败也继续」用 `Promise.allSettled`，详见 [Promise 组合器](./promise-combinators)。

### 循环里的陷阱

`for` 循环里 `await` 是**串行**的（每轮等上一轮）；要并行处理一个数组，用 `map` 造 Promise 数组再 `Promise.all`：

```js
// ❌ 串行：一个接一个，慢
for (const id of ids) {
  await fetchUser(id);
}

// ✅ 并行：全部同时发起
await Promise.all(ids.map((id) => fetchUser(id)));
```

> 注意：`forEach` **不会**等待其中的 `async` 回调，别用 `arr.forEach(async ...)` 做需要等待的批处理——用 `for...of`（串行）或 `Promise.all(map)`（并行）。

## 顶层 await（ES2022）

过去 `await` 必须裹在 `async` 函数里。**ES2022** 起，**ES 模块**（`<script type="module">` 或 `.mjs`）的**顶层**可以直接写 `await`，无需包装：

```js
// 仅在 ES 模块顶层有效
const config = await fetch("/config.json").then((r) => r.json());
const { renderer } = await import(config.rendererModule); // 配合动态 import
export const ready = renderer.init(config);
```

要点与限制：

- **只在 ES 模块可用**：CommonJS（`require`）、普通 `<script>`、Worker 的经典脚本都不支持，会语法报错；
- **会阻塞模块图**：一个模块的顶层 `await` 未敲定前，**依赖它的模块**会等待——用得不当会拖慢启动，适合「应用启动必需的初始化」而非随处使用；
- 老环境若不支持，仍需退回 IIFE 包装：`(async () => { await ... })()`。

## 小结

`async`/`await` 是 `Promise` 的语法糖：`async` 函数必返 Promise，`await` 暂停到敲定、拒绝即抛，从而把异步写成可读的顺序代码、把错误交还给 `try`/`catch`；用好它的前提是分清**顺序与并行**，并记住顶层 await 仅限 ES 模块。最后一块拼图是**主动取消与超时**——Promise 本身无法取消，需要 `AbortController`：[取消、超时与竞态](./cancellation-timeout)。
