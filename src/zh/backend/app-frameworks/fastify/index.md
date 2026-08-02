---
layout: doc
---

# Fastify

**Fastify** 是 Node.js 上**以性能和 Schema 驱动**为核心的 Web 框架——由 Matteo Collina（Node.js TSC 成员、核心贡献者）和 Tomas Della Vedova 于 2016 年创建，专为高 QPS 场景设计。它的核心武器是 **JSON Schema**：用 `schema.querystring/body/params/response` 声明请求与响应结构，框架据此做**请求验证**（自动校验类型/必填，编译期生成校验函数）和**响应序列化**（预编译序列化器，比 Express 的通用 `res.json` 快得多）。**基准测试中 Fastify 比 Express 快约 2-3 倍**，是 Node 后端性能派的代表。**Fastify v5**（2024 发布）升级到 Node ≥ 20、改进类型推断、完善插件协议。

Fastify 的全部考点围绕**Schema 验证**与**插件系统**展开：①**JSON Schema 验证**——`schema` 选项声明路由的输入输出契约，Ajv（最快的 JSON Schema 校验器）编译成函数，请求到达即校验，校验失败自动返回 400；②**插件系统**——`fastify.register(plugin, opts)` 封装逻辑，每个插件有独立作用域（封装模式），通过 `fastify.decorate` 给实例添方法/属性，`fastify-plugin` 跳出封装；③**性能**——Schema 序列化 + 精简内核 + pino 日志（零配置高性能），比 Express 快 2-3 倍；④**TypeScript 支持**——开箱即用，Schema 可生成类型，`FastifyInstance/FastifyRequest/FastifyReply` 类型完善。本叶是 Node 后端性能选型的标杆，与 [Express](../express/)（生态派）、[Hono](../hono/)（边缘派）形成三角对比。

## 评价

**优点**

- **性能强悍**：基准测试比 Express 快 2-3 倍，Schema 预编译序列化 + 精简内核 + pino 日志
- **Schema 驱动**：声明输入输出契约，自动验证请求、加速响应序列化，减少手写校验代码
- **开箱即用 TS**：一等公民 TypeScript 支持，Schema 可生成类型，开发体验好
- **插件封装**：`register` + `decorate` 模式，逻辑可复用、作用域隔离，企业级友好

**缺点**

- **学习曲线**：要学 Schema 语法、插件封装模式、decorate 机制，比 Express 上手慢
- **生态规模小**：fastify-* 插件数千（Express 是数万），部分 Express 中间件需找适配或自写
- **仅支持 Node**：不像 Hono 跨运行时（Cloudflare Workers/Deno/Bun）
- **Schema 维护成本**：强 Schema 是优势也是负担，接口频繁变动时维护 Schema 有成本

## 本叶地图

- [入门](./getting-started) —— Fastify 是什么、JSON Schema 验证、插件系统、性能优势、TypeScript 支持、最小应用
- [Schema 与插件详解](./guide-line/schema-and-plugins) —— JSON Schema 语法、Ajv 编译、请求验证与响应序列化、register/decorate 封装模式、作用域与 fastify-plugin
- [性能与 TypeScript](./guide-line/performance) —— 为什么比 Express 快 2-3 倍、pino 日志、基准数据、TS 类型推断与 Schema 类型生成
- [参考](./reference) —— API 速查、Schema 速查、插件清单、与 Express/Hono 对比、易错点

## 幻灯片地址

<a href="/SlideStack/fastify-slide/" target="_blank">Fastify</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Fastify" target="_blank" rel="noopener noreferrer">Fastify 测试题</a>
