---
layout: doc
outline: [2, 3]
---

# 异步生成器

> 基于现代 JavaScript（ES2025 · 核于 2026-06）

## 速查

- 声明：`async function*` —— 函数体内既能 `yield`、又能 `await`，二者自由组合
- 产出的是**异步迭代器**：`next()` 返回 `Promise<{ value, done }>`（同步生成器返回的是裸 `{ value, done }`）
- 消费：用 `for await (const x of asyncIterable)`，它**逐个 await** 每次 `next()` 的 Promise（**ES2018**）
- `for await...of` 还能消费**同步可迭代对象**：会自动 `await` 其中的每个元素（即便元素是 Promise）
- 异步可迭代协议：对象实现 `[Symbol.asyncIterator]()`、返回带异步 `next()` 的迭代器（与同步的 `Symbol.iterator` 平行）
- 典型场景：分页 API、读 `ReadableStream`、数据库游标、事件流——把「逐批异步到达」的数据写成顺序代码
- 早退：`break` / `return` / 抛错会调用迭代器的 `return()`，触发 `try...finally` 清理（**同步生成器 yield 出 rejected Promise 时 finally 不执行**，需在循环内显式 `await`）
- 整体物化为数组：`await Array.fromAsync(asyncIterable)`（**ES2024**），返回 `Promise<Array>`
- `for await...of` 只能用在 `async` 函数或模块顶层（任何能 `await` 的地方）

## 当每个值都需要等待

同步生成器逐个**立即**吐值。但真实数据常常是**异步逐批到达**的：一页页拉取的接口、一块块读出的流、一行行游标取出的查询结果。把这类「等一会儿、来一批、再等一会儿」的过程写成命令式的 `while + await + 收集` 既啰嗦又易错。**异步生成器**让你用顺序代码直接描述它。

异步生成器用 `async function*` 声明，函数体里 `yield` 与 `await` 可以混用：

```js
async function* fetchUsers() {
  let page = 1;
  while (true) {
    const res = await fetch(`/api/users?page=${page}`); // 等待请求
    const { users, hasNext } = await res.json(); // 等待解析
    yield* users; // 把这一页的每个 user 逐个产出
    if (!hasNext) return; // 没有下一页就结束
    page++;
  }
}
```

它产出的是**异步迭代器**——区别在于 `next()` 返回的是一个 **Promise**，解析后才是 `{ value, done }`：

```js
const it = fetchUsers();
it.next(); // Promise<{ value: <第一个 user>, done: false }>
```

## `for await...of`：逐个等待的循环

手动对异步迭代器反复 `await it.next()` 太繁琐。`for await...of`（ES2018）是它的专用语法——每轮循环自动 `await` 一次 `next()` 的 Promise，拿到值再进入循环体：

```js
async function main() {
  for await (const user of fetchUsers()) {
    console.log(user.name); // 一个个到达、一个个处理，绝不一次性把所有页拉进内存
  }
}
```

与同步 `for...of` 的对照很直接：

| | `for...of` | `for await...of` |
| --- | --- | --- |
| 消费同步可迭代 | ✅ | ✅（并 `await` 每个元素） |
| 消费异步可迭代 | ❌ | ✅ |
| 自动解包 Promise | ❌ | ✅ |
| 可用位置 | 任何地方 | 仅 `async` 函数 / 模块顶层 |

::: tip `for await...of` 也吃「同步的 Promise 序列」
它不挑食：对一个**同步**可迭代对象，它会逐个 `await` 其中的元素。所以「一个装着 Promise 的数组」也能这样顺序解包：

```js
const tasks = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
for await (const n of tasks) console.log(n); // 1 2 3（按序等待）
```

注意这是**串行**等待（一个解析完才等下一个）。若想并发，仍该用 `Promise.all`。
:::

## 异步可迭代协议：`Symbol.asyncIterator`

`async function*` 只是语法糖，底层落到**异步可迭代协议**——与同步那套平行：对象实现 `[Symbol.asyncIterator]()`、返回一个带**异步 `next()`** 的迭代器。手写一个把流式数据封装成异步可迭代对象的典型例子，是包装 `ReadableStream`：

```js
async function* streamChunks(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value; // 逐块产出 Uint8Array
    }
  } finally {
    reader.releaseLock(); // break / 抛错时也会执行——这正是 finally 的价值
  }
}

async function downloadSize(url) {
  const res = await fetch(url);
  let bytes = 0;
  for await (const chunk of streamChunks(res.body)) {
    bytes += chunk.length;
  }
  return bytes;
}
```

`for...of`、扩展、解构走 `Symbol.iterator`；`for await...of` 优先走 `Symbol.asyncIterator`，找不到才回退到 `Symbol.iterator` 并把同步迭代器包成异步的。

## 整体收集：`Array.fromAsync`（ES2024）

`Array.from` 只认同步源。当你确实想把一个异步可迭代对象**一次性物化成数组**（数据量有限时），用 **ES2024** 的 `Array.fromAsync`——它逐个 `await` 并返回一个 `Promise<Array>`：

```js
async function* threeAsync() {
  yield await Promise.resolve("a");
  yield await Promise.resolve("b");
  yield await Promise.resolve("c");
}

const all = await Array.fromAsync(threeAsync()); // ["a", "b", "c"]
```

> `Array.fromAsync` 会**等待全部产出完成**，因此**不要**对无限异步生成器使用它（会永不解析）。需要「流式逐个处理」时仍用 `for await...of`。

## 清理与早退的陷阱

`for await...of` 中途 `break` / `return` / 抛错时，引擎会调用迭代器的 `return()`，从而触发异步生成器内部的 `try...finally`：

```js
async function* withCleanup() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } finally {
    console.log("清理"); // break 也会跑到这里
  }
}

for await (const n of withCleanup()) {
  console.log(n);
  if (n === 2) break; // → 打印 1, 2, 清理
}
```

::: warning 同步生成器 yield 出 rejected Promise 时，`finally` 不执行
有一个细微但常被踩的坑：若用 `for await...of` 消费一个**同步**生成器，而它 `yield` 出了一个**会 reject 的 Promise**，那么错误会中断循环，但生成器里的 `finally` **不会**被调用（因为 `for await...of` 是在循环外 `await` 那个 Promise，并未驱动同步生成器走到 `return()`）。

稳妥写法是改用同步 `for...of` 并在循环体内**显式 `await`**：

```js
for (const p of syncGenYieldingPromises()) {
  console.log(await p); // 显式 await，错误在循环体内抛出 → finally 正常执行
}
```
:::

## Baseline 与版本

| 特性 | 版本 | 状态（2026-06 核） |
| --- | --- | --- |
| 异步生成器 `async function*` / `for await...of` / `Symbol.asyncIterator` | ES2018 | ✅ Baseline 广泛可用（2020 起） |
| `Array.fromAsync` | ES2024 | 🟡 Baseline 新近可用 |

## 小结

异步生成器（`async function*`）把「逐批异步到达」的数据写成顺序代码：它产出异步迭代器（`next()` 返回 Promise），用 `for await...of` 逐个等待消费；底层是与同步平行的 `Symbol.asyncIterator` 协议，特别适合分页、流、游标等场景；`Array.fromAsync`（ES2024）可一次性物化有限的异步序列；清理逻辑放 `try...finally`，但要警惕「同步生成器 yield rejected Promise 时 finally 不跑」的陷阱。下一页回到同步世界，看怎样用生成器把**任意对象**变成可迭代的——[用生成器实现自定义迭代器](./custom-iterators)。
