---
layout: doc
outline: [2, 3]
---

# 参考：Node.js 版本特性、事件循环与模块速查

> 基于 Node.js（V8 + Libuv）· 核于 2026-08

## 速查

- **是什么**：基于 V8 + Libuv 的服务端 JS 运行时，单线程事件循环 + 非阻塞 I/O。
- **并发模型**：单线程主循环（六阶段）+ Libuv 线程池（4 线程兜底 CPU/同步 I/O）+ Worker Threads（多核并行）。
- **模块**：CJS（`require`，同步，默认）与 ESM（`import`，异步，未来标准），`package.json` 的 `type` 切换。
- **原生 TS**：22.18+ 默认开启类型剥离，`node app.ts` 直接跑（只剥离不检查不转译）。
- **内置工具链**：`node:test`（测试）、`--watch`（热重载）、Permission Model（权限沙箱）、`worker_threads`（多线程）。
- **优先级**：`process.nextTick` > Promise 微任务 > `setImmediate` / `setTimeout`（I/O 回调里 setImmediate 先于 setTimeout）。

## 一、Node.js 关键版本特性

| 版本 | 年份 | 关键特性 |
| --- | --- | --- |
| **0.x** | 2009-2015 | 诞生，CommonJS、npm 上线 |
| **4.x** | 2015 | io.js 合并，ES6（let/const/arrow/Promise） |
| **8.x** | 2017 | async/await 原生、`util.promisify`、N-API |
| **10.x** | 2018 | `fs.promises`、ESM 实验支持 |
| **12.x** | 2019 | ESM（`--experimental-modules`）、worker_threads 稳定 |
| **14.x** | 2020 | ESM 默认可用（无 flag）、顶层 await 实验 |
| **16.x** | 2021 | Apple Silicon 原生、Corepack |
| **18.x** | 2022 | `node --test`、`--watch` 实验、Fetch API 全局 |
| **20.x** | 2023 | Permission Model 实验、`node:test` 稳定 |
| **22.x** | 2024 | `--watch` 稳定、WebSocket 客户端、require(esm) 实验 |
| **22.18** | 2025 | **原生 TS 类型剥离默认开启**（LTS，无警告） |
| **24.x** | 2025 | 类型剥离稳定、`require(esm)` 同步加载 ESM |

## 二、事件循环阶段清单

| 阶段 | 执行内容 | 典型 API |
| --- | --- | --- |
| **timers** | 到期的 setTimeout/setInterval | `setTimeout`、`setInterval` |
| **pending callbacks** | 系统级错误回调 | TCP errno |
| **idle/prepare** | Libuv 内部 | —— |
| **poll** | 新 I/O 事件回调（阻塞等待） | `fs.readFile`、`socket.on('data')` |
| **check** | setImmediate 回调 | `setImmediate` |
| **close callbacks** | 关闭事件 | `socket.on('close')` |

**阶段之间**：清空 `process.nextTick` 队列 → 清空 Promise 微任务队列 → 进下一阶段。

## 三、模块解析规则速查

| 维度 | CommonJS | ES Modules |
| --- | --- | --- |
| 语法 | `require`/`module.exports` | `import`/`export` |
| 加载方式 | 同步求值（立即执行） | 异步解析（构建期依赖图） |
| `.js` 默认走 | CJS（无 `"type"`） | ESM（`"type":"module"`） |
| 强制扩展名 | `.cjs` | `.mjs` |
| 顶层 await | ❌ | ✅ |
| 循环依赖 | 返回部分导出 | live binding（引用） |
| `require(ESM)` | ❌ 不支持 | —— |
| `import` CJS | —— | ✅（`module.exports` = default） |
| `this` 顶层 | `module.exports` | `undefined` |
| 缓存 | `require.cache` | 模块图缓存 |

## 四、内置模块与 CLI 速查

| 内置模块 | 用途 |
| --- | --- |
| `node:fs` / `node:fs/promises` | 文件系统（同步/回调/Promise） |
| `node:http` / `node:https` | HTTP 服务端与客户端 |
| `node:stream` | 流（Readable/Writable/Transform） |
| `node:crypto` | 加密（哈希/对称/非对称） |
| `node:worker_threads` | 多线程 |
| `node:test` | 内置测试器 |
| `node:assert` | 断言 |
| `node:child_process` | 子进程 |
| `node:events` | EventEmitter |
| `node:path` / `node:url` | 路径/URL 处理 |
| `node:os` | 操作系统信息 |
| `node:util` | 工具（promisify/format） |

| CLI 命令 | 用途 |
| --- | --- |
| `node app.js` | 运行 JS |
| `node app.ts` | 运行 TS（22.18+ 默认剥离类型） |
| `node --watch app.js` | 文件变化自动重启 |
| `node --test` | 跑测试（发现 `*.test.js`） |
| `node --test --watch` | 测试热重跑 |
| `node --inspect` | 开 Chrome DevTools 调试 |
| `--experimental-transform-types` | 转译 enum/参数属性等需变换语法 |
| `--allow-fs-read=/path` | Permission Model 限制文件读 |
| `UV_THREADPOOL_SIZE=8` | 调大 Libuv 线程池（默认 4） |

## 五、易错点清单

- **"Node.js 是单线程的"**：不完全对。**用户 JS 代码单线程**，但 Libuv 有线程池（默认 4）、有 I/O 多路复用、能开 Worker Threads。说"单线程"严格指 JS 执行。
- **"`setTimeout(fn,0)` 一定比 `setImmediate` 先"**：错。顶层代码里顺序不定（取决于启动耗时）；**I/O 回调里** `setImmediate` 一定先于 `setTimeout(fn,0)`。
- **"原生 TS 会做类型检查"**：错。22.18+ 的类型剥离只**删注释**级别的语法，**不做类型检查**（仍需 tsc/IDE），也不转译 enum/参数属性。
- **"require 能加载 ESM"**：错。`require(ESM)` 不被支持（同步 require 无法加载异步 ESM）。Node 24+ 实验性支持 `require(esm)` 但限制多。
- **"Promise.then 比 process.nextTick 先"**：错。`process.nextTick` 优先级**高于** Promise 微任务。
- **"事件循环所有 I/O 都异步"**：错。`fs`（老内核）、`crypto.pbkdf2`、`dns.lookup` 走**线程池**（本质同步包成异步）。
- **"Worker Threads 共享堆内存"**：错。每个 Worker 是独立 V8 isolate（独立堆），靠 `postMessage` 通信（默认深拷贝）。要共享用 `SharedArrayBuffer`。
- **"Node.js 默认安全"**：错。Node.js 默认有当前用户全部权限（能读写任意文件/起子进程），比 Deno（默认拒绝）宽松得多。需 Permission Model 收窄。
- **"`node_modules` 里的 postinstall 脚本无害"**：错。postinstall 能执行任意命令，是供应链攻击入口（event-stream/ua-parser-js 事件）。
- **"enum 能用原生 TS 跑"**：错。enum 需代码变换（不只是删类型），需 `--experimental-transform-types` 才能跑。

## 六、进阶方向（链接其他叶）

- [Deno](../deno/) —— 默认安全 + 原生 TS + JSR 的现代运行时
- [Bun](../bun/) —— 全能工具链 + Zig 性能的极速运行时

## 权威链接

- [Node.js 官网](https://nodejs.org/)
- [Node.js 22.18.0 发布说明（原生 TS）](https://nodejs.org/en/blog/release/v22.18.0)
- [Running TypeScript Natively - Node.js Learn](https://nodejs.org/learn/typescript/run-natively)
- [Node.js Test Runner 文档](https://nodejs.org/api/test.html)
- [Libuv 设计文档](https://docs.libuv.org/)
- [Node.js Permission Model](https://nodejs.org/api/permissions.html)
- 本站幻灯片：<a href="/SlideStack/nodejs-slide/" target="_blank">Node.js</a>
