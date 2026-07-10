---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **es-toolkit 1.49.0**。深入边界与现代特性：compat 兼容边界、`Mutex`/`Semaphore` 并发原语、`AbortSignal` 集成、ESM/CJS 双格式、从 compat 切主包的逐点核对清单。

## 速查

- **兼容不是无边界**：v1.39.3 的里程碑指通过 Lodash 测试套件；方法链、跨 realm、修改内建原型及部分特化行为仍在官方范围外。
- **默认导出**：`es-toolkit/compat` 的默认函数只返回传入值并挂载静态方法，不会创建 wrapper；不要写 `_(x).map().value()`。
- **超时 API**：`timeout(ms)` 返回最终拒绝的 `Promise<never>`；`withTimeout(run, ms)` 接收返回 Promise 的函数，不接收已经启动的 Promise。
- **AbortSignal 语义**：对 `timeout` / `withTimeout` 调用 `abort()` 是取消计时限制、继续等待；它不会拒绝结果，也不会停止底层工作。
- **并发原语**：`Mutex` / `Semaphore` 都是 `await acquire()` 后在 `finally` 中 `release()`；Semaphore 按 FIFO 等待并暴露 `capacity` / `available`。
- **错误元组**：同步函数用 `attempt`，异步函数必须用 `await attemptAsync`；成功 `[null, value]`，失败 `[error, null]`。
- **函数取消**：主包 debounce / throttle 可用 `AbortSignal`、`cancel()`、`flush()`，并以 `edges` 控制首尾沿。
- **发布格式**：1.49.0 的 exports 为主入口和领域子路径分别提供 ESM / CJS 产物及对应类型声明。

## 一、compat 兼容边界：哪些 lodash 特性不支持

`es-toolkit/compat` 自 v1.39.3 起对「能写成 lodash 测试用例」「能从 `@types/lodash`/`@types/lodash-es` 类型推断」的特性做到 **100% 兼容**。但有一批 lodash 历史包袱**明确不支持**（设计范围之外）：

- **部分隐式类型转换**（官方示例包括把空字符串转换为 0 或 false）
- **特化的数组实现**与**修改内建原型**后的行为
- **跨 JavaScript realm** 的处理；`runInContext`、`noConflict` 也不在当前导出中
- **方法链式**：`_(arr).map(...).filter(...)` 不受支持，默认调用函数只返回原值
- 个别函数直接不支持：`sortedUniq`、`sortedUniqBy`、`mixin`

> 实务含义：官方页面一方面用「1:1」概括 compat，另一方面又给出上述范围外清单。工程上应以**具体函数文档 + 类型 + 本地回归**为契约，不把宣传语扩张成所有历史边界都等价。

## 二、现代异步与并发原语（lodash 没有）

es-toolkit 在 `es-toolkit/promise` 与 `es-toolkit/util` 提供了一批面向现代异步编程的工具，是相对 lodash 的扩展。

### timeout / withTimeout

```ts
import { timeout, withTimeout } from 'es-toolkit/promise';

// 给异步操作设时限：超时抛 TimeoutError
async function fetchWithTimeout(url: string) {
  return Promise.race([
    fetch(url),
    timeout(5000), // 5s 后 reject(TimeoutError)
  ]);
}

// 便捷形式接收「尚未执行的异步函数」，不是 Promise 本身
const response = await withTimeout(() => fetch('/api/data'), 5000);
```

`timeout(ms)` 返回一个在 `ms` 毫秒后以 `TimeoutError` 拒绝的 `Promise<never>`；捕获时可用 `error.name === 'TimeoutError'` 判断。`withTimeout(run, ms, options?)` 接收 `() => Promise<T>` 并返回 `Promise<T>`。

两者的 `signal` 有一个反直觉边界：`abort()` **取消的是超时计时器**，让返回值继续等待，而不是取消任务。要终止 `fetch` 等底层工作，必须把同一个 signal 也传给底层 API。

### Mutex / Semaphore：并发控制

```ts
import { Semaphore, Mutex } from 'es-toolkit/promise';

// Semaphore：最多 3 个任务并发，其余排队（如限并发请求）
const sem = new Semaphore(3);
async function task() {
  await sem.acquire();
  try {
    await doWork();
  } finally {
    sem.release();
  }
}

// Mutex 是容量 1 的特例（互斥锁）
const mutex = new Mutex();
```

### attempt / attemptAsync：免 try/catch 的错误处理

```ts
import { attempt, attemptAsync } from 'es-toolkit/util';

// 以 [error, value] 元组安全执行，错误处理变成解构返回值
const [err, value] = attempt(() => JSON.parse(input));
if (err) {
  // 处理解析失败
}

const [requestError, data] = await attemptAsync(() => fetchData());
```

> `attempt` 不会等待 Promise；把 async 函数传给它会得到 `[null, Promise]`，后续 rejection 也捕获不到。异步任务必须用 `attemptAsync`。

## 三、AbortSignal 集成（现代标准 API）

主包的 `debounce`/`throttle` 支持传入 **AbortSignal**，`abort()` 时取消 pending 执行——lodash 没有这个能力：

```ts
import { debounce } from 'es-toolkit';

const controller = new AbortController();
const onInput = debounce(
  (q: string) => search(q),
  300,
  { signal: controller.signal },
);

// 组件卸载 / 路由切换时一键取消
controller.abort();
```

返回的函数同时带 `cancel()`（取消待执行）和 `flush()`（立即执行）方法。结合 `edges` 选项控制开头/结尾执行：

```ts
debounce(fn, 300, { edges: ['leading'] });             // 只在开头执行
throttle(fn, 1000, { edges: ['leading', 'trailing'] }); // 开头和结尾都执行（throttle 默认）
```

> 对照 compat：`es-toolkit/compat` 的 `debounce`/`throttle` 为对齐 lodash 用 `{ leading, trailing, maxWait }`，二者语义可换算但 API 名不同。

## 四、ESM / CommonJS 双格式

es-toolkit 的 `package.json` `exports` 为每个入口同时声明两套产物：

```text
es-toolkit/
├── dist/index.mjs   # import（ESM）—— module 字段
├── dist/index.js    # require（CommonJS）—— main 字段
├── dist/index.d.mts # ESM 类型
└── dist/index.d.ts  # CJS 类型
```

因此它在 ESM 与 CommonJS 下都能用，覆盖 **Node 18+ / Deno（JSR）/ Bun / 浏览器（CDN）**。配 `"sideEffects": false`，ESM 摇树彻底。

```js
// CommonJS 也可用
const { chunk } = require('es-toolkit');
```

浏览器 CDN 的 UMD 构建把函数挂在全局 `_`（沿用 lodash 惯例）；现代浏览器更推荐 importmap + esm.sh 做 ESM 具名导入。

## 五、从 compat 切主包：逐点核对清单

把某处从 `es-toolkit/compat` 切到主包 `es-toolkit` 前，逐项核对是否依赖了被舍弃的 lodash 行为：

| 检查项 | compat | 主包 | 切换动作 |
|---|---|---|---|
| `pick`/`omit` 点号深路径 | 支持 | 不支持 | 改用嵌套解构 / 原生 |
| `get(obj, 'a.b')` | 支持 | 无 `get` | 改用可选链 `obj?.a?.b` |
| 链式 `_(x).f().value()` | **不支持** | 无 | 切 compat 前先改函数组合 / 原生数组方法 |
| 隐式类型转换 | 部分属于官方范围外 | 无（更严格） | 显式转换入参并加边界测试 |
| `debounce` 选项 | `leading/trailing/maxWait` | `edges` + `signal` | 换算选项 |
| `merge` 可变性 | 原地改 | 原地改（同） | 不可变场景改 `toMerged` |

> 核对通过即可切；切完该处就吃到主包的最小体积与最快性能。

## 六、可变性与不可变数据流

强调一条贯穿全篇的工程要点：区分**会修改入参**的函数。`merge`、`pull`、`remove`、`fill` 等原地修改；在 React/Redux 等不可变场景应改用**返回新值**的 `toMerged`、`cloneDeep`、`difference`、`without`。这与 lodash 同源的陷阱一致，迁移时要心里有数。

---

回到 [入门](../getting-started) 复习命令，或查 [参考](../reference) 速览函数清单与 compat 差异。
