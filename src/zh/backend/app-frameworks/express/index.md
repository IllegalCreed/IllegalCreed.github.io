---
layout: doc
---

# Express

**Express** 是 Node.js 上**最经典、生态最庞大**的 Web 应用框架——诞生于 2010 年（TJ Holowaychuk），凭借**极简的中间件管道**与**回调风格路由**，成为 Node 后端的事实标准。它不替你做决定（不绑定模板引擎、不绑 ORM、不强制目录结构），只提供 `app.use()` 中间件链 + `app.get/post()` 路由 + `req/res` 两个对象，把 HTTP 请求/响应的拼装、解析、分发彻底标准化。**2024 年 10 月 Express 5.0 正式发布**（告别长达 9 年的 4.x），引入 async 错误自动捕获、`req.query` 不再自动解析、移除老旧 API；npm **周下载约 1800 万**，仍是 Fastify/Hono 之外装机量最大的 Node 框架。

Express 的全部考点围绕**中间件机制**与**路由系统**展开：①**中间件（Middleware）**——`(req, res, next) => {}` 的函数链，`app.use()` 全局挂载或挂到某个路径，依次执行，决定请求如何被预处理（解析 body、鉴权、日志、CORS）；②**路由（Routing）**——`app.get/post/put/delete` 注册处理器，支持路径参数 `/users/:id`、正则路由、`express.Router()` 模块化拆分；③**回调风格**——基于 `req/res/next` 三参数回调，错误处理靠 `next(err)` 传递到错误中间件（与 Koa 的 async/await + Promise 链不同）；④**Express 5.0**——async 处理器抛错被自动捕获（4.x 会丢 promise rejection）、`req.query` 默认返回普通对象（4.x 的 `qs` 复杂解析被移除）、`res.send(status)` 等被废弃。本叶是 Node 后端框架选型的**基线参照**，与 [Fastify](../fastify/)（Schema 性能派）、[Hono](../hono/)（边缘跨运行时派）形成三角对比。

## 评价

**优点**

- **极简哲学**：核心只有中间件 + 路由，无内建模板/ORM/认证，可拼装任意技术栈，学习成本最低
- **生态无敌**：npm 上 express-* 中间件数以万计（passport、helmet、morgan、cors、multer...），任何需求都有现成方案
- **文档与社区**：中文/英文教程海量，StackOverflow 答案最全，新人入职最快上手
- **Express 5 补课**：async 自动捕获、移除老旧 API，现代兼容性回归

**缺点**

- **性能平庸**：无 Schema 验证、无序列化优化，基准测试比 Fastify 慢 2-3 倍（高 QPS 场景明显）
- **回调风格老化**：`req/res/next` 回调比 async/await 啰嗦，错误处理需手动 `next(err)`（4.x）
- **无内建 TS 支持**：需 `@types/express`，类型推断不如 Fastify/Hono 开箱即用
- **官方维护慢**：5.0 等了 9 年，期间核心团队几经更迭，更新节奏不及 Fastify/Hono

## 本叶地图

- [入门](./getting-started) —— Express 是什么、中间件管道、路由注册、回调风格、Express 5.0 变化、最小应用示例
- [中间件与路由详解](./guide-line/middleware-and-routing) —— 中间件类型与执行顺序、`express.Router` 模块化、路径参数/正则路由、错误处理中间件、5.0 变化清单
- [生态与对比](./guide-line/ecosystem) —— 必装中间件清单（passport/helmet/morgan/cors/multer）、与 Fastify/Hono/Koa 对比、何时选 Express、迁移建议
- [参考](./reference) —— API 速查、中间件清单、Express 4 vs 5 对照、易错点

## 幻灯片地址

<a href="/SlideStack/express-slide/" target="_blank">Express</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Express" target="_blank" rel="noopener noreferrer">Express 测试题</a>
