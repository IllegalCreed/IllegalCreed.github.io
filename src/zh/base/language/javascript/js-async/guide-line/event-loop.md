---
layout: doc
outline: [2, 3]
---

# 事件循环：调用栈与宏微任务

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- **调用栈（call stack）**：LIFO 的执行上下文栈；函数调用入栈、返回出栈；同一时刻只有一条栈在跑——这就是「单线程」
- **运行到完成（run-to-completion）**：一个任务一旦开始执行，中途不会被打断，必须跑完才轮到下一个任务
- **事件循环**：栈空时，从队列里取任务来跑的「无限循环」——取一个、跑完、再取
- **宏任务（task）**：`setTimeout`/`setInterval`、I/O、UI 事件、整段脚本；进**宏任务队列**
- **微任务（microtask）**：`Promise.then`/`catch`/`finally`、`queueMicrotask`、`MutationObserver`、Node 的 `queueMicrotask`；进**微任务队列**
- **铁律**：每跑完一个宏任务，就**清空整个微任务队列**（含其间新产生的微任务），再考虑渲染、再取下一个宏任务
- **`queueMicrotask(fn)`**：直接把 `fn` 排进微任务队列，不经过 `Promise`
- **渲染时机**：浏览器在**宏任务之间**可能渲染，**绝不会在微任务之间**渲染——微任务里疯狂改 DOM 用户一帧都看不到
- **`setTimeout(fn, 0)` ≠ 立即**：嵌套超过 5 层时浏览器强制**最小 4ms** 延迟；且它是宏任务，排在所有微任务后

## 调用栈：单线程的本体

JavaScript 引擎用一个**调用栈**追踪「现在执行到哪个函数」。函数被调用就压入一个执行上下文（栈帧），函数返回就弹出。栈是 LIFO（后进先出）：

```js
function foo(b) {
  const a = 10;
  return a + b + 11;
}
function bar(x) {
  const y = 3;
  return foo(x * y); // 调用 foo，foo 入栈
}
const baz = bar(7); // 调用 bar，bar 入栈；baz === 42
```

执行过程：全局帧 → `bar` 入栈（`x=7, y=3`）→ `foo` 入栈（`b=21, a=10`）→ `foo` 返回出栈 → `bar` 返回出栈。

关键在于：**整个引擎只有这一条栈**。栈在跑代码时，谁都插不进来——这既是「单线程」的含义，也是下面「运行到完成」的根源。

## 运行到完成：任务不可被打断

每个**任务**（一段被排队执行的代码）一旦开始，就会**完整跑完**，中途不会被其他任务打断。这带来确定性：你不必担心一个变量在两行代码之间被别的任务偷偷改掉。

```js
const promise = Promise.resolve();
let i = 0;
promise.then(() => {
  i += 1;
  console.log(i); // 1
});
promise.then(() => {
  i += 1;
  console.log(i); // 2
});
// 输出顺序恒定：1 → 2
```

代价是：如果某个任务很重（大循环），它会一直占着栈，**渲染和事件都得等它跑完**——这就是「长任务卡页面」的本质，后面有拆分方案。

## 事件循环：栈空时取任务

栈空之后，引擎进入**事件循环**——一个「等任务 → 取任务 → 执行 → 再等」的无限循环。耗时操作（定时器、网络、I/O）由宿主环境（浏览器 / Node）在后台处理，完成后把对应回调作为任务排进队列，事件循环再把它取出来放到栈上跑。

队列分两类，**优先级不同**，这是整页的核心。

### 宏任务与微任务

| 类别 | 来源 | 队列 |
| --- | --- | --- |
| 宏任务（task） | `setTimeout`/`setInterval`、I/O、UI 事件（click/scroll）、整段 `<script>` | 宏任务队列 |
| 微任务（microtask） | `Promise.then`/`catch`/`finally`、`queueMicrotask`、`MutationObserver` | 微任务队列 |

### 调度铁律

事件循环每一轮（每跑一个宏任务）的处理顺序是固定的：

1. 从宏任务队列取**一个**最老的宏任务，执行到完成；
2. **清空整个微任务队列**——一个接一个跑，**包括执行期间新产生的微任务**，直到队列彻底为空；
3. 如有需要，执行 `requestAnimationFrame` 回调并**渲染**；
4. 回到第 1 步。

一句话口诀：**一个宏任务 → 掏空所有微任务 →（可能渲染）→ 下一个宏任务**。

```js
console.log("start"); // 同步

setTimeout(() => console.log("task"), 0); // 宏任务

Promise.resolve()
  .then(() => console.log("microtask 1"))
  .then(() => console.log("microtask 2"));

console.log("end"); // 同步

// 输出：start → end → microtask 1 → microtask 2 → task
```

整段脚本本身就是第一个宏任务：先把同步的 `start`、`end` 跑完，然后清空微任务（`microtask 1`、`microtask 2`，第二个 `then` 产生的微任务也在本轮一并清掉），最后才取下一个宏任务 `task`。

### 一道经典排序题

```js
console.log(1); // 同步
setTimeout(() => console.log(2)); // 宏任务
Promise.resolve().then(() => console.log(3)); // 微任务
Promise.resolve().then(() => setTimeout(() => console.log(4))); // 微任务里再排一个宏任务
Promise.resolve().then(() => console.log(5)); // 微任务
setTimeout(() => console.log(6)); // 宏任务
console.log(7); // 同步

// 输出：1 7 3 5 2 6 4
```

拆解：

- `1 7`——同步代码最先，一口气跑完；
- `3 5`——清空微任务队列；注意中间那个微任务又排了一个打印 `4` 的**宏任务**，它进的是宏任务队列的队尾；
- `2 6 4`——开始逐个取宏任务：先是最早排的 `2`、`6`，最后才是微任务期间新排进来的 `4`。

## `queueMicrotask`：不借 Promise 排微任务

如果你只想把一小段逻辑「推迟到当前同步代码之后、但赶在任何宏任务之前」执行，又不想凭空造一个 `Promise`，用 `queueMicrotask`：

```js
console.log("A");
queueMicrotask(() => console.log("B 微任务"));
console.log("C");
// 输出：A → C → B 微任务
```

它和 `Promise.resolve().then(...)` 进的是同一个微任务队列、同样的时机，但语义更直白、开销更小。典型场景：库作者想保证「无论 API 同步还是异步调用，回调都恒定地异步触发」，以避免[同步/异步不一致的释放 Zalgo 问题](./callbacks-evolution)。

## 渲染时机：为什么微任务里改 DOM 用户看不到中间态

浏览器的绘制（渲染）只发生在**宏任务之间**，**永远不会插在微任务之间**。因为微任务队列要求被「一次性清空」，期间 DOM 即使变了也不会重绘——用户只会看到微任务全部跑完后的**最终状态**。

```js
const box = document.querySelector("#box");

// 这三次改色都在微任务里发生，用户看不到红、绿，只看到最后的蓝
Promise.resolve().then(() => (box.style.background = "red"));
Promise.resolve().then(() => (box.style.background = "green"));
Promise.resolve().then(() => (box.style.background = "blue"));
```

想让用户**逐帧看到中间过程**（比如进度条），必须把每一步放进**不同的宏任务**，给浏览器留出渲染的空隙——这正是下面「拆分长任务」的原理；而和渲染严格对齐的动画应使用 `requestAnimationFrame`（它在渲染前执行，不属于微任务队列）。

## `setTimeout(fn, 0)` 的两个真相

很多人以为 `setTimeout(fn, 0)` 是「立刻执行」，其实有两个坑：

1. **它是宏任务**：要等当前同步代码 + 所有微任务都跑完才轮到它（见上面的排序题）；
2. **最小 4ms 延迟**：当 `setTimeout` 嵌套调用超过 5 层后，浏览器规范强制把延迟钳到**至少 4ms**，即便你写的是 `0`：

> 正如 javascript.info 所述：浏览器对**多层嵌套**的 `setTimeout` 存在约 4ms 的最小延迟——即便你传入 `0`，实际也是 4ms（或略多）。

```js
let start = Date.now();
let times = [];
function loop() {
  times.push(Date.now() - start);
  if (Date.now() - start < 100) setTimeout(loop); // 嵌套调度
  else console.log(times); // 前几次间隔很小，之后趋于每次约 4ms
}
setTimeout(loop);
```

## 拆分长任务：让重计算不冻结页面

既然「运行到完成」会让长任务卡住渲染，解法是把大计算**切成小块**，每块结束用 `setTimeout(0)` 把控制权交还事件循环，给浏览器渲染与响应事件的机会：

```js
let i = 0;
const end = 1e9;

function countChunk() {
  do {
    i++;
    // …做一小批工作…
  } while (i % 1e6 !== 0); // 每 100 万次让一次出来

  if (i < end) {
    setTimeout(countChunk); // 交还控制权 → 浏览器得以渲染、响应点击
  } else {
    console.log("完成");
  }
}
countChunk();
```

这样页面在整个计算期间仍能响应交互、刷新进度。需要更精细切分而不被 4ms 拖累时，可用 `MessageChannel`（`postMessage`）调度宏任务；现代浏览器还提供 `scheduler.postTask` / `scheduler.yield`（渐进增强）来按优先级让出主线程。

## 小结

调用栈是单线程的本体，**运行到完成**保证任务不被打断，**事件循环**在栈空时取任务，而**微任务优先于宏任务、渲染只在宏任务之间**这两条规则，解释了本章几乎所有「为什么这样跑」。下一页回到历史起点，看第一代异步方案——回调，以及它带来的[回调与回调地狱](./callbacks-evolution)。
