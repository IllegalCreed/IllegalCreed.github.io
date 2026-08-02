---
layout: doc
---

# Node.js

**Node.js** 是基于 **V8 引擎**与**事件循环**的**服务端 JavaScript 运行时**——它把浏览器里跑的 JS 拿到服务器上，靠**单线程 + 非阻塞 I/O + 回调**支撑高并发网络应用。Node.js 诞生于 2009 年（Ryan Dahl），最初的口号是「用一门语言写前后端」；如今它是**后端三大 JS 运行时之首**（Node.js / Deno / Bun），承载了全球最大的包生态 npm。理解 Node.js，关键是理解它的**并发模型**（事件循环 + Libuv 线程池，而非多线程）、它的**模块系统**（CommonJS 与 ESM 的长期共存）、以及它在 2024-2026 年的**现代化演进**（22.18+ 原生 TS 执行、内置 `node:test` 测试器、`--watch` 热重载、Permission Model 权限沙箱、Worker Threads 多核并行）——这些让 Node.js 既能守住生态护城河，又能回应 Deno/Bun 的挑战。

Node.js 的全部考点围绕**运行时核心与生态**展开：①**模块与执行**（ESM/CJS 互操作、原生 TS 类型剥离、`--watch` 文件监听）——回答"代码怎么跑起来"；②**并发与事件循环**（六阶段循环、`process.nextTick`/微任务、Libuv 线程池、Worker Threads）——回答"高并发怎么实现、CPU 密集任务怎么不阻塞"；③**工具链内置化**（`node:test` 测试器、`node --inspect` 调试、Permission Model 权限）——回答"不装第三方能不能测/调/管权限"；④**生态与包管理**（npm 注册表、`node_modules`、依赖解析、安全审计）——回答"复用什么、怎么管"。本叶是后端运行时章节的**基准与参照系**，讲清 Node.js 的定位、运行时机制、现代化特性——后续 Deno/Bun 两叶都以它为对比基准。

## 评价

**优点**

- **高并发 I/O**：单线程 + 事件循环 + 非阻塞 I/O，一台机器扛数万连接，内存占用远低于线程/进程模型
- **生态无敌**：npm 是全球最大包注册表（300 万+ 包），几乎所有需求都能找到现成库
- **同构全栈**：前后端同一门 JS/TS，类型、工具链、知识可复用，降低团队心智负担
- **现代化跟进快**：原生 TS 执行（22.18+）、内置测试器 `node:test`、`--watch` 热重载、Permission Model，逐步补齐 Deno/Bun 的差异化能力

**缺点**

- **CPU 密集任务会阻塞**：单线程事件循环，一个死循环或重计算会卡住所有请求，需用 Worker Threads 或子进程绕开
- **回调与错误处理历史包袱**：Error-First Callback、回调地狱催生了 Promise/async，但老代码与 `node_modules` 深处的回调风格难以根除
- **模块系统分裂**：CJS 与 ESM 长期共存，互操作（`require(ESM)`、命名导出探测）坑多，是新手最大绊脚石
- **依赖臃肿与安全风险**：`node_modules` 动辄成百上千个传递依赖，供应链攻击（如 event-stream 事件）与漏洞扫描是持续负担

## 本叶地图

- [入门](./getting-started) —— Node.js 定位、事件循环六阶段、ESM/CJS、原生 TS（22.18+）、`node:test`、`--watch`、Permission Model、Worker Threads 概览
- [运行时与特性](./guide-line/runtime-and-features) —— 事件循环详解（timers/poll/check/close callbacks）、`process.nextTick` 与微任务、Libuv 线程池、ESM/CJS 互操作规则、`node:test` 测试器、`--watch` 热重载机制
- [生态与回调](./guide-line/ecosystem-and-callbacks) —— npm 注册表与 `node_modules`、Error-First Callback 约定、Promise/async 演进、Permission Model 权限沙箱、Worker Threads 多核并行
- [参考](./reference) —— Node.js 版本特性速查、事件循环阶段清单、模块解析规则、易错点、CLI 命令速查

## 幻灯片地址

<a href="/SlideStack/nodejs-slide/" target="_blank">Node.js</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Node.js" target="_blank" rel="noopener noreferrer">Node.js 测试题</a>
