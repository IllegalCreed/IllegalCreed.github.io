---
layout: doc
outline: [2, 3]
---

# 入门：Node.js 运行时、事件循环与现代特性

> 基于 Node.js（V8 + Libuv）· 核于 2026-08

## 速查

- **是什么**：Node.js 是基于 **V8 引擎**（Google，JS→机器码 JIT）与 **Libuv**（C 库，提供事件循环 + 线程池 + 跨平台异步 I/O）的服务端 JS 运行时。**单线程主循环 + 非阻塞 I/O + 回调**是其并发模型的全部。
- **事件循环（Event Loop）**：Node.js 的"心脏"。一个**单线程**循环，依次经过六个阶段——`timers`（到期的 setTimeout/setInterval）→ `pending callbacks` → `idle/prepare` → `poll`（取新 I/O 事件，执行回调）→ `check`（setImmediate）→ `close callbacks`。每个阶段都有一个回调队列，循环把队清空才进下一阶段。
- **微任务插队**：`process.nextTick` 与 Promise 的 `.then`（微任务）在**每个阶段之间**都会被清空——所以 nextTick 优先级最高，甚至高于 `setImmediate`。
- **Libuv 线程池**：并非所有 I/O 都异步——**CPU 密集或无异步 API 的操作**（如 `fs` 的同步底层、`crypto.pbkdf2`、`zlib`）会丢到 Libuv 的**线程池**（默认 4 线程，`UV_THREADPOOL_SIZE` 可调）执行，避免阻塞主循环。
- **模块系统**：Node.js **同时支持**两套——**CommonJS**（`require`/`module.exports`，同步、`.js` 默认）与 **ESM**（`import`/`export`，异步、`.mjs` 或 `"type":"module"` 的 `.js`）。CJS 是历史默认，ESM 是未来标准，二者通过 `package.json` 的 `type` 字段与扩展名切换。
- **原生 TS（22.18+）**：Node.js 22.18.0 LTS 起，**类型剥离默认开启**——直接 `node app.ts` 即可运行，无需 `ts-node`/`tsx`。它只**剥离类型注解**（文本级），**不做类型检查**（检查仍靠 `tsc`/IDE），也不转译 enum/参数属性等需变换的语法（需 `--experimental-transform-types`）。
- **node:test**：Node.js 18+ 内置测试器，`node --test` 即可跑测试，无需 Jest/Mocha。提供 `describe/it/test`、`assert`、`mock`、子测试、Watch 模式，是 Zero-Dependency 测试方案。
- **--watch**：Node.js 18.11+（22+ 稳定）内置文件监听，`node --watch app.js` 在文件改动时自动重启，替代 `nodemon`。
- **Permission Model**（实验）：Node.js 20+ 的权限沙箱，`--permission-fs=/tmp` 等可限制文件系统/子进程/环境变量访问，回应 Deno 的安全模型。
- **Worker Threads**：`worker_threads` 模块提供**真正的多线程**（基于 V8 isolates + MessagePort 通信），用于 CPU 密集任务并行，绕开单线程限制。
- **进阶顺序**：[运行时与特性](./guide-line/runtime-and-features) → [生态与回调](./guide-line/ecosystem-and-callbacks) → [参考](./reference)。

## 一、Node.js 是什么：V8 + Libuv + 事件循环

Node.js 把浏览器里执行 JS 的 **V8 引擎**搬到了服务器，再配上 **Libuv** 这个 C 语言写的异步 I/O 库，让它能读文件、开网络、做 DNS。三者分工：

```
        你的 JavaScript 代码
              │
   ┌──────────┴──────────┐
   │   Node.js 内置模块   │  http / fs / crypto / stream ...
   │   （C++ 绑定层）     │
   └──────────┬──────────┘
              │
      ┌───────┴────────┐
      │     V8 引擎     │  ← 解析/编译/执行 JS（JIT）
      └───────┬────────┘
              │
      ┌───────┴────────┐
      │     Libuv      │  ← 事件循环 + 线程池 + 跨平台异步 I/O
      └───────┬────────┘
              │
        操作系统（epoll/kqueue/IOCP）
```

- **V8** 负责"跑 JS"——把 JS 编译成机器码（JIT），管理堆内存与 GC。
- **Libuv** 负责"等 I/O"——它的事件循环是 Node.js 并发的核心，线程池兜底 CPU 密集任务。
- **关键点**：**JS 代码本身只在一个线程里跑**（主线程）。Node.js 的"高并发"不是因为多线程，而是因为**单线程不阻塞地等 I/O**——等数据库、等磁盘、等网络时，线程不闲着，去处理别的请求，I/O 完成后回调被推入队列。

## 二、事件循环：六阶段模型

事件循环是 Node.js 的心跳。它把工作分成**六个阶段**，循环往复：

```
   ┌───────────────────────────┐
   │   ┌─────────────────────┐ │
   │   │     timers          │ │  setTimeout / setInterval 到期的回调
   │   └─────────┬───────────┘ │
   │             ▼             │
   │   ┌─────────────────────┐ │
   │   │ pending callbacks   │ │  系统级回调（如 TCP errno）
   │   └─────────┬───────────┘ │
   │             ▼             │
   │   ┌─────────────────────┐ │
   │   │ idle, prepare       │ │  内部使用
   │   └─────────┬───────────┘ │
   │             ▼             │
   │   ┌─────────────────────┐ │
   │   │ poll                │ │  取新 I/O 事件，执行 I/O 回调（最重要）
   │   └─────────┬───────────┘ │  会阻塞等待定时器到期或新事件
   │             ▼             │
   │   ┌─────────────────────┐ │
   │   │ check               │ │  setImmediate 回调
   │   └─────────┬───────────┘ │
   │             ▼             │
   │   ┌─────────────────────┐ │
   │   │ close callbacks     │ │  socket.on('close', ...)
   │   └─────────┬───────────┘ │
   └─────────────┼─────────────┘
                 │
        每个【阶段之间】清空微任务：
        process.nextTick 队列 → Promise then 队列
```

- **timers**：到了 `setTimeout(fn, 1000)` 设定时间的回调在这里执行。注意"1000ms"是**下限**——事件循环忙时可能晚很多。
- **poll**：最关键阶段，向操作系统查询（epoll/kqueue）有没有 I/O 完成，完成则执行对应回调。如果 poll 队列空了，它会等到最近一个 timer 到期或新 I/O 事件。
- **check**：`setImmediate(fn)` 的回调在这里执行——它在 poll 之后、timers 之前，所以 `setImmediate` 比 `setTimeout(fn, 0)` 先（在 I/O 回调里）。
- **微任务插队**：**每个阶段结束、进入下一阶段前**，Node 会把 `process.nextTick` 队列和 Promise 微任务队列**全部清空**。`process.nextTick` 优先级高于 Promise 微任务。

## 三、模块系统：CommonJS 与 ESM

Node.js 有两套模块系统，理解它们的差异与互操作是 Node.js 的第一道门槛：

| 维度 | CommonJS（CJS） | ES Modules（ESM） |
| --- | --- | --- |
| 语法 | `require()` / `module.exports` | `import` / `export` |
| 加载 | **同步**（运行时求值） | **异步**（构建期解析依赖图） |
| 默认扩展名 | `.js`（无 `"type"`） | `.mjs`，或 `.js`+`"type":"module"` |
| `this` | 指向 `module.exports` | `undefined` |
| 顶层 await | 不支持 | 支持 |
| 循环依赖 | 返回部分导出（已执行的） | 返回绑定（live binding） |

- **如何选择**：新项目优先 ESM（未来标准、支持顶层 await、tree-shaking 友好）；维护老项目或依赖大量 CJS 第三方库时用 CJS。可在 `package.json` 设 `"type": "module"` 让 `.js` 走 ESM。
- **互操作坑**：`require(ESM)` **不被支持**（ESM 是异步的，require 是同步的）；反过来 ESM 里可以用 `import` 导入 CJS（把 `module.exports` 当 default）。命名导出探测（named export interop）是新手最容易踩的雷。

## 四、现代特性：原生 TS、内置测试、热重载、权限

Node.js 在 2024-2026 年大幅现代化，逐步补齐 Deno/Bun 的差异化能力：

- **原生 TypeScript（22.18+）**：22.18.0 LTS 起，**类型剥离默认开启**，直接 `node app.ts` 运行。原理是**文本级剥离类型注解**（删掉 `: number`、`interface`、`as T` 等），不做语义检查。**不做类型检查**——你需要 `tsc` 或 IDE 做检查。**不转译需变换的语法**（enum、参数属性、旧 decorator）——这些要 `--experimental-transform-types`。
- **node:test（18+）**：内置测试器，`node --test` 自动发现并跑 `*.test.js`。提供 `test/describe/it`、`node:assert`、`node:test` 的 `mock`，支持子测试与 Watch 模式——是 Zero-Dependency 测试方案，不再强依赖 Jest/Mocha。
- **--watch（18.11+，22 稳定）**：`node --watch app.js` 监听文件变化自动重启，替代 `nodemon`。配合 `node:test`：`node --test --watch` 实现测试热重跑。
- **Permission Model（20+，实验）**：`--allow-fs-read`/`--allow-fs-write`/`--allow-child-process`/`--allow-env` 等标志限制运行时的能力边界，防止第三方依赖越权读文件或起子进程——这是回应 Deno 默认安全模型的关键特性。

## 五、Worker Threads：突破单线程

Node.js 主线程是单线程，CPU 密集任务（图片处理、加解密、JSON 大文件解析）会**阻塞事件循环**，让所有请求卡住。解法是 **Worker Threads**：

```js
// 主线程 main.js
import { Worker } from 'node:worker_threads';
const worker = new Worker('./heavy.js');
worker.postMessage({ data: bigArray });
worker.on('message', (result) => console.log('完成', result));
```

```js
// 工作线程 heavy.js
import { parentPort } from 'node:worker_threads';
parentPort.on('message', (data) => {
  const result = heavyCompute(data); // CPU 密集计算
  parentPort.postMessage(result);
});
```

- **不是"轻量进程"**：每个 Worker 是一个独立的 V8 isolate（独立堆 + 独立事件循环），通过 `MessagePort` 用 `postMessage` 通信（结构化克隆，数据要拷贝/转移）。
- **适用场景**：CPU 密集（图像/加密/压缩/大数据计算）；**不适用**于 I/O 密集——I/O 用异步即可，开 Worker 反而增加通信开销。
- **替代方案**：对隔离要求更高的，用**子进程**（`child_process`/`cluster`），进程级隔离更彻底但开销更大。

## 下一步

理解了 Node.js 的总览后，下一步深入两个核心维度——[运行时与特性](./guide-line/runtime-and-features)（事件循环各阶段的执行顺序、`process.nextTick` 的插队、Libuv 线程池的作用、ESM/CJS 互操作、`node:test` 与 `--watch`）与[生态与回调](./guide-line/ecosystem-and-callbacks)（npm 注册表与依赖解析、Error-First Callback 约定、Promise/async 演进、Permission Model 权限沙箱、Worker Threads 多核并行）。
