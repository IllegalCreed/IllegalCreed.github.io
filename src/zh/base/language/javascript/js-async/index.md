---
layout: doc
---

# JavaScript 异步编程

JavaScript 是**单线程**的——同一时刻只有一条调用栈在跑代码，可它却要同时应付网络请求、定时器、用户点击、文件读写。这套「单线程却不卡死」的魔法，靠的是**事件循环**：耗时操作交给宿主环境（浏览器 / Node）在后台跑，完成后把回调排进队列，引擎在栈空时一个个取出来执行。本叶从事件循环这块地基讲起，一路走过回调、`Promise`、`async`/`await`，到 ES2024 的 `Promise.withResolvers` 与 `AbortController` 取消机制，把「异步代码为什么这样跑、该怎么写」讲透。

## 概述

- **它管什么**：让单线程引擎在不阻塞的前提下处理并发——发起一个请求后不傻等，而是登记一个「完成后做什么」的回调，引擎继续跑别的，等结果就绪再回来执行；以及如何把这些回调组织得可读、可组合、错误可控、可取消。
- **为什么值得认真学**：异步是前端的**默认形态**——`fetch`、定时器、事件、动画帧无一不是异步。看不懂事件循环，就解释不了「为什么 `setTimeout(fn, 0)` 不是立刻执行」「为什么 `Promise.then` 总比 `setTimeout` 先跑」；写不好 `Promise`，就会掉进回调地狱、漏掉错误、把本可并行的请求写成串行白白慢一倍。
- **现代化关注点**：宏任务 / 微任务的执行次序与渲染时机、`queueMicrotask`；`Promise` 状态机与链式错误冒泡；`all` / `race` / `allSettled` / `any` 四个组合器的取舍；`async`/`await` 的本质与**顶层 await**（ES2022 模块）；**ES2024** 的 `Promise.withResolvers` 与 `AbortController` / `AbortSignal.timeout` 超时取消。

## 本叶地图

- [入门](./getting-started) —— 一页看懂「同步阻塞 → 回调 → Promise → async/await」这条异步演进主线
- [事件循环：调用栈与宏微任务](./guide-line/event-loop) —— 调用栈、宏任务 / 微任务队列、`queueMicrotask`、渲染时机与执行次序
- [回调与回调地狱](./guide-line/callbacks-evolution) —— 回调模式、错误优先约定、金字塔嵌套与**控制反转**信任问题
- [Promise 基础与状态机](./guide-line/promise-basics) —— 三态机、`then`/`catch`/`finally`、链式扁平化与错误冒泡
- [Promise 组合器](./guide-line/promise-combinators) —— `all` / `race` / `allSettled` / `any` 全谱与并发控制
- [async/await](./guide-line/async-await) —— `await` 的暂停本质、`try`/`catch`、顺序 vs 并行、顶层 await
- [取消、超时与竞态](./guide-line/cancellation-timeout) —— `AbortController` / `AbortSignal`、`Promise.withResolvers`、超时与竞态防护
- [参考](./reference) —— API 速查表 + 执行次序口诀 + 标准 / Baseline / 调试链接

## 文档地址

- [MDN: Using promises（使用 Promise）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN: JavaScript execution model（执行模型）](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [javascript.info: 事件循环](https://javascript.info/event-loop)
- [javascript.info: async/await](https://javascript.info/async-await)

## 幻灯片地址

<a href="/SlideStack/js-async-slide/" target="_blank">JavaScript 异步编程</a>
