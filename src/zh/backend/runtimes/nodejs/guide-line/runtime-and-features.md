---
layout: doc
outline: [2, 3]
---

# 运行时与特性：事件循环、ESM/CJS、测试与热重载

> 基于 Node.js（V8 + Libuv）· 核于 2026-08

## 速查

- **事件循环六阶段**：`timers`（setTimeout/setInterval 到期）→ `pending callbacks` → `idle/prepare` → `poll`（I/O 回调，会阻塞等事件）→ `check`（setImmediate）→ `close callbacks`。每阶段清空一个回调队列后进入下一阶段。
- **微任务插队**：`process.nextTick` 与 Promise 微任务在**每个阶段之间**被清空——`process.nextTick` 优先级**高于** Promise 微任务，二者都高于 `setImmediate`/`setTimeout`。
- **`setTimeout(fn,0)` vs `setImmediate`**：在主模块顶层，顺序**不确定**（取决于进程启动耗时）；但在 **I/O 回调里**，`setImmediate` **一定先于** `setTimeout(fn,0)`——因为 I/O 回调在 poll 阶段执行完，下一个是 check（setImmediate），再下一轮才是 timers。
- **Libuv 线程池**：默认 4 线程（`UV_THREADPOOL_SIZE` 可调到 1024）。承担**无异步 API 的重活**——`fs` 底层、`crypto.pbkdf2/scrypt`、`zlib`、`dns.lookup`（非 `dns.resolve`）。线程池满则后续任务排队，会拖慢所有依赖它的工作。
- **事件循环是单线程，Node 不是单线程**：JS 在主线程单线程跑；但 Libuv 有线程池、有 I/O 多路复用、Worker Threads 能开新 V8 isolate。说"Node 单线程"严格指**用户 JS 代码的执行**。
- **CJS 加载是同步求值**：`require()` 立即执行目标文件并缓存到 `require.cache`，第二次 `require` 返回缓存。
- **ESM 加载是异步解析**：`import` 在构建期解析依赖图，导出是 **live binding**（引用，会随源更新）。顶层 `await` 只在 ESM 支持。
- **`require(ESM)` 不被支持**：ESM 异步、CJS 同步，无法在同步 require 里加载异步模块。反向（ESM `import` CJS）可行，CJS 的 `module.exports` 成为 ESM 的 default 导出。
- **node:test**：`node --test` 跑测试，提供 `test/describe/it`、子测试、`mock`、`--watch`。无需第三方依赖。
- **--watch**：监听入口文件及 `require`/`import` 能解析到的所有依赖，变化时**重启进程**（不是热模块替换）。

## 一、事件循环各阶段详解

事件循环是 Libuv 提供的一个无限循环，每轮依次进入六个阶段：

| 阶段 | 干什么 | 典型回调来源 |
| --- | --- | --- |
| **timers** | 执行到期的 `setTimeout`/`setInterval` 回调 | `setTimeout(fn, 1000)` |
| **pending callbacks** | 推迟到下一轮的系统级回调 | TCP `ECONNREFUSED` 错误回调 |
| **idle, prepare** | Libuv 内部使用 | —— |
| **poll** | 向 OS 取新 I/O 事件，执行 I/O 回调；若队列空且无 timer，阻塞等待 | `fs.readFile`、`socket.on('data')` |
| **check** | 执行 `setImmediate` 回调 | `setImmediate(fn)` |
| **close callbacks** | 关闭事件的回调 | `socket.on('close')` |

**关键细节**：

1. **timer 的延迟是下限不是精确值**：`setTimeout(fn, 1000)` 至少等 1000ms，但如果 poll 阶段在处理一个长回调，timer 会推迟到当前阶段结束。
2. **poll 的阻塞策略**：poll 队列空时，Libuv 计算最近一个 timer 的到期时间，阻塞等待那么久（让出 CPU），有 I/O 事件或 timer 到期就唤醒。
3. **每阶段之间清空微任务**：执行完一个阶段的所有宏任务回调后，Node 会**先把 `process.nextTick` 队列清空，再清空 Promise 微任务队列**，然后才进下一阶段。

## 二、process.nextTick 与微任务优先级

`process.nextTick` 是 Node.js **独有**的（浏览器没有），优先级**最高**：

```js
console.log('1 start');

setImmediate(() => console.log('6 setImmediate'));
setTimeout(() => console.log('5 setTimeout'));

Promise.resolve().then(() => console.log('4 promise then'));
process.nextTick(() => console.log('3 nextTick'));

console.log('2 end');
// 输出顺序：1 → 2 → 3(nextTick) → 4(promise) → 5/6(setTimeout 与 setImmediate 顺序不定)
```

- **优先级**：`process.nextTick` > Promise 微任务 > `setImmediate` / `setTimeout`。
- **慎用 nextTick**：递归 `process.nextTick` 会**饿死事件循环**——nextTick 队列永远清不完，I/O 回调永远没机会执行，进程"假死"。所以不要在 nextTick 里递归调度 nextTick。
- **用途**：在事件循环继续前同步清理资源、在 Promise 链之后但在任何 I/O 之前执行回调（如 Emit 事件让监听器在当前阶段就处理）。

## 三、Libuv 线程池的作用

很多人误以为"Node.js 全异步"——其实**有些操作没法异步**，Libuv 用**线程池**兜底：

- **进线程池的操作**：`fs` 的文件读写底层（Linux 老内核无真正异步 fs）、`crypto.pbkdf2/scrypt`（CPU 密集）、`zlib` 压缩、`dns.lookup`（getaddrinfo 是同步的）。
- **不进线程池的操作**：真正的异步 I/O（网络 socket 用 epoll/kqueue/IOCP）、`dns.resolve`（直接走 c-ares 异步 DNS 库）。
- **默认 4 线程**：`UV_THREADPOOL_SIZE=8 node app.js` 可调大（最大 1024）。如果你的服务大量 `fs.readFile` + `crypto.pbkdf2`，4 线程可能成为瓶颈——并发请求排队等线程池。
- **启示**：CPU 密集任务即便"看起来异步"（回调风格），本质还是占了线程池的一个线程；真正 CPU 重活应该用 **Worker Threads** 而非依赖线程池。

## 四、ESM 与 CJS 互操作

Node.js 同时支持两套模块系统，互操作规则是核心难点：

| 操作 | 是否可行 | 说明 |
| --- | --- | --- |
| CJS 里 `require(CJS)` | ✅ | 最经典，同步加载 |
| CJS 里 `require(ESM)` | ❌ | **不支持**，ESM 异步无法同步 require（用动态 `import()`） |
| ESM 里 `import CJS` | ✅ | CJS 的 `module.exports` 成为 ESM 的 **default** 导出 |
| ESM 里 `import {named}` from CJS | ⚠️ | 需 CJS 通过静态分析暴露命名导出，否则只能拿 default |
| ESM 里 `import(ESm)` 动态 | ✅ | 返回 Promise |

- **package.json 的 `type` 字段**：`"type": "commonjs"`（默认）让 `.js` 走 CJS；`"type": "module"` 让 `.js` 走 ESM。`.cjs` 强制 CJS，`.mjs` 强制 ESM，覆盖 `type`。
- **`.js` vs `.mjs`**：维护老项目想局部迁移，保留 `.js` 为 CJS，新文件用 `.mjs`；或反过来全切 ESM，老文件改 `.cjs`。
- **循环依赖差异**：CJS 返回**部分导出**（已执行的部分，可能 undefined）；ESM 返回**引用绑定**（live binding，等模块执行完会更新）。

## 五、node:test 与 --watch

Node.js 内置工具链让"零依赖开发"成为可能：

```js
// math.test.js（用 node:test）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add } from './math.js';

test('加法', async (t) => {
  await t.test('正数', () => assert.equal(add(1, 2), 3));
  await t.test('负数', () => assert.equal(add(-1, -2), -3));
});
```

```bash
node --test                 # 跑所有 *.test.js / *.spec.js
node --test --watch         # 监听文件变化自动重跑
node --watch app.js         # 运行 app.js，文件变化自动重启（替代 nodemon）
```

- **node:test 优势**：零依赖、与 Node 同步升级、原生支持子测试与 mock、与 ESM/CJS 都兼容。
- **--watch 机制**：它监听**入口文件 + require/import 能解析到的所有依赖**，变化时**重启整个进程**（不是 HMR 热替换）。适合开发期；生产环境用 PM2/systemd 的进程管理。
- **局限性**：`node:test` 的断言库是 `node:assert`（比 Jest 的 `expect` 简陋）；无内置覆盖率（需 `--experimental-test-coverage`）；mock API 较新。

## 交互演示

本叶无专门可视化。事件循环的"阶段切换 + 微任务插队"建议手写几段 `setTimeout`/`setImmediate`/`Promise.then`/`process.nextTick` 的代码观察输出顺序，最能体会优先级。

## 下一步

运行时机制讲完后，下一站进入[生态与回调](./ecosystem-and-callbacks)——npm 注册表如何解析依赖、Error-First Callback 约定如何演进到 Promise/async、Permission Model 如何给 Node.js 加上安全边界、Worker Threads 如何实现多核并行。
