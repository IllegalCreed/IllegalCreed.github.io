---
layout: doc
outline: [2, 3]
---

# 入门

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **单线程 + 事件循环**：引擎只有一条调用栈；耗时操作交给宿主后台跑，完成后回调排队，栈空时取出执行——所以「不阻塞」
- **同步阻塞**：长循环 / 同步 `XHR` 会卡住整条栈，页面冻结、无法响应点击，这是异步要解决的核心问题
- **回调**：把「完成后做什么」作为函数传入；多层嵌套即**回调地狱**，错误难捕获、**控制反转**信任难保证
- **Promise**：表示「未来的值」的对象，三态 `pending` → `fulfilled` / `rejected`，一旦敲定不可逆；用 `then`/`catch`/`finally` 链式组织，扁平化嵌套、错误统一冒泡
- **async/await**：`Promise` 的语法糖；`async` 函数**必返回 Promise**，`await` 暂停函数体直到 `Promise` 敲定，用 `try`/`catch` 像同步代码一样处理错误
- **微任务 > 宏任务**：`Promise.then` 是微任务，`setTimeout` 是宏任务；当前同步代码跑完先清空**所有微任务**，再取一个宏任务——`then` 永远比 `setTimeout(0)` 先跑
- **并行**：相互独立的异步任务用 `Promise.all` 同时发起，别用 `await` 一个接一个串行等
- **新特性**：顶层 `await`（ES2022 模块）、`Promise.withResolvers`（ES2024）、`AbortSignal.timeout`（Baseline 2024）

## 异步演进：一条主线四个阶段

JavaScript 处理「现在发起、未来才有结果」的操作，经历了清晰的四个阶段。理解这条演进线，就理解了整章的脉络。

### ① 同步阻塞：问题所在

JavaScript 引擎只有**一条调用栈**，代码自上而下逐行执行，一行不结束下一行不开始。如果某行很慢，整条栈就被堵死：

```js
// 假想的同步「睡眠」：这 3 秒里页面完全冻结
function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {} // 死循环占着调用栈
}

console.log("开始");
sleepSync(3000); // 这 3 秒：点击无响应、动画卡住、滚动僵住
console.log("结束");
```

浏览器渲染、事件处理与 JS 共用这一条线程，所以**同步的耗时操作 = 页面假死**。异步编程要解决的，就是「发起耗时操作时不阻塞这条线程」。

### ② 回调：把「之后做什么」传进去

第一代解法：不等结果，而是把「结果就绪后做什么」打包成一个函数（回调）交出去，引擎继续往下跑，等结果好了由宿主环境调用这个回调：

```js
console.log("开始");

// setTimeout 把回调交给浏览器，3 秒后排队执行，期间不阻塞
setTimeout(() => {
  console.log("3 秒后才执行");
}, 3000);

console.log("结束"); // 立刻打印——不会等那 3 秒
// 输出：开始 → 结束 →（3 秒后）3 秒后才执行
```

回调能用，但一旦多个异步操作有先后依赖，嵌套就会层层加深成**回调地狱**，且错误处理分散、难以组合。详见 [回调与回调地狱](./guide-line/callbacks-evolution)。

### ③ Promise：用「未来的值」拉平嵌套

`Promise` 是一个**代表未来结果的对象**，它有三种状态，且一旦敲定（settled）便不可逆：

```js
// fetch 返回一个 Promise，代表「未来的响应」
fetch("/api/user")
  .then((res) => res.json()) // 上一步的结果传进来，返回新 Promise
  .then((user) => console.log(user.name)) // 链式：扁平不嵌套
  .catch((err) => console.error("出错了：", err)); // 任何一步出错都到这
```

链式 `then` 把回调地狱拉成一条直线，错误沿链冒泡到 `catch` 统一处理。详见 [Promise 基础与状态机](./guide-line/promise-basics)。

### ④ async/await：让异步读起来像同步

`async`/`await` 是建立在 `Promise` 之上的语法糖。`async` 函数总是返回 `Promise`，`await` 会**暂停函数体**直到 `Promise` 敲定，再把结果当作普通返回值拿到：

```js
async function showUser() {
  try {
    const res = await fetch("/api/user"); // 暂停，直到响应到达
    const user = await res.json(); // 暂停，直到解析完成
    console.log(user.name);
  } catch (err) {
    console.error("出错了：", err); // 像同步代码一样 try/catch
  }
}
```

代码读起来像同步，实际仍是非阻塞的异步。详见 [async/await](./guide-line/async-await)。

## 一个必须看懂的执行次序

下面这段几乎是异步面试的「必考题」，看懂它就摸到了事件循环的门：

```js
console.log("1 同步");

setTimeout(() => console.log("4 宏任务"), 0);

Promise.resolve().then(() => console.log("3 微任务"));

console.log("2 同步");

// 输出顺序：1 同步 → 2 同步 → 3 微任务 → 4 宏任务
```

规则：**同步代码全部跑完 → 清空所有微任务（`Promise.then`） → 才取一个宏任务（`setTimeout`）**。所以即便 `setTimeout` 写了 `0`，它也排在微任务之后。这条「微任务优先」的铁律，详见 [事件循环：调用栈与宏微任务](./guide-line/event-loop)。

## 串行还是并行：一个常见的性能坑

`await` 用错会把本可并行的请求拖成串行，平白多花一倍时间：

```js
// ❌ 串行：总耗时 ≈ t1 + t2（第二个请求干等第一个）
const a = await fetch("/api/a");
const b = await fetch("/api/b");

// ✅ 并行：两个请求同时发起，总耗时 ≈ max(t1, t2)
const [a2, b2] = await Promise.all([fetch("/api/a"), fetch("/api/b")]);
```

只有当 `b` 真的依赖 `a` 的结果时才该串行；相互独立就用 `Promise.all` 一起发。组合器的全谱见 [Promise 组合器](./guide-line/promise-combinators)。

## 下一步

地基是事件循环——它解释了上面所有「为什么这样跑」。下一页就从**调用栈与宏 / 微任务**开始：[事件循环：调用栈与宏微任务](./guide-line/event-loop)。
