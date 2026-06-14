---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **es-toolkit 1.47+**。深入边界与现代特性：compat 兼容边界、`Mutex`/`Semaphore` 并发原语、`AbortSignal` 集成、ESM/CJS 双格式、从 compat 切主包的逐点核对清单。

## 一、compat 兼容边界：哪些 lodash 特性不支持

`es-toolkit/compat` 自 v1.39.3 起对「能写成 lodash 测试用例」「能从 `@types/lodash`/`@types/lodash-es` 类型推断」的特性做到 **100% 兼容**。但有一批 lodash 历史包袱**明确不支持**（设计范围之外）：

- **隐式类型转换**（如把空字符串当 0）
- **特化的数组实现**与**修改 JS 原型**的行为
- **JavaScript realm 管理**：`runInContext`、`noConflict`
- **方法链式**的隐式形态（虽提供了 `_(arr).chunk().value()` 显式兼容写法）
- 个别函数直接不支持：`sortedUniq`、`sortedUniqBy`、`mixin`

> 实务含义：迁移时若代码依赖了上述任意一项，需手动改写——它们既不在主包、（部分）也不在 compat。

## 二、现代异步与并发原语（lodash 没有）

es-toolkit 在 `es-toolkit/promise` 与 `es-toolkit/util` 提供了一批面向现代异步编程的工具，是相对 lodash 的扩展。

### timeout / withTimeout

```ts
import { timeout } from 'es-toolkit/promise';

// 给异步操作设时限：超时抛 TimeoutError
async function fetchWithTimeout(url: string) {
  return Promise.race([
    fetch(url),
    timeout(5000), // 5s 后 reject(TimeoutError)
  ]);
}
```

`timeout(ms)` 返回一个在 `ms` 毫秒后抛出 `TimeoutError` 的 `Promise<never>`；捕获时可用 `error.name === 'TimeoutError'` 判断。`withTimeout(promise, ms)` 是直接包裹一个 Promise 的便捷形式。

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
import { attempt } from 'es-toolkit/util';

// 以 [error, value] 元组安全执行，错误处理变成解构返回值
const [err, value] = attempt(() => JSON.parse(input));
if (err) {
  // 处理解析失败
}
```

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
| 链式 `_(x).f().value()` | 支持 | 无 | 改函数组合 / 原生数组方法 |
| 隐式类型转换 | 有 | 无（更严格） | 显式转换入参 |
| `debounce` 选项 | `leading/trailing/maxWait` | `edges` + `signal` | 换算选项 |
| `merge` 可变性 | 原地改 | 原地改（同） | 不可变场景改 `toMerged` |

> 核对通过即可切；切完该处就吃到主包的最小体积与最快性能。

## 六、可变性与不可变数据流

强调一条贯穿全篇的工程要点：区分**会修改入参**的函数。`merge`、`pull`、`remove`、`fill` 等原地修改；在 React/Redux 等不可变场景应改用**返回新值**的 `toMerged`、`cloneDeep`、`difference`、`without`。这与 lodash 同源的陷阱一致，迁移时要心里有数。

---

回到 [入门](../getting-started) 复习命令，或查 [参考](../reference) 速览函数清单与 compat 差异。
