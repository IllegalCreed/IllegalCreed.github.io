---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 mcollina/skills（Matteo Collina 个人）的 README 与各 `skills/*/SKILL.md` 编写。

## 速查

- **`fastify`**：核心是**封装（encapsulation）**——每个插件是隔离上下文；要跨上下文共享 decorator/hook 用 `fastify-plugin`（`fp`）包裹；Schema 优先、`inject()` 测试、Pino 日志
- **`node` / `nodejs-core` 分工**：`node` = 应用层现代 Node.js（type stripping、`pipeline()` 流、缓存、优雅关闭）；`nodejs-core` = 引擎层（V8 GC/JIT、libuv、N-API、node-gyp、core 贡献）
- **`typescript-magician`**：先 `tsc --noEmit` 抓全量错误 → 定位根因 → 用泛型约束/条件类型/`infer`/映射类型/品牌类型替换 `any` → 再 `tsc --noEmit` 验证
- **`oauth`**：授权码 + PKCE（S256）为默认，绑 `@fastify/oauth2`；每请求校验 `iss`/`aud`/`exp`；刷新令牌轮换；反模式：禁 localStorage 存 token、禁隐式流、禁 HS256 第三方 token
- **`linting-neostandard-eslint9`**：`neostandard()` 一行起 flat config；CI 跑非 `--fix`、本地才 `--fix`
- **`documentation`**：Diátaxis 四类不混——教程（学）/ 指南（做）/ 参考（查）/ 解释（懂）
- **`nodejs-core` 铁律**：改 `src/`/`lib/` 后**必须先 rebuild 再测**（`lib/` 编译期嵌入二进制），否则测的是旧代码

## fastify：封装是灵魂

`fastify` 由框架作者亲授，最核心的概念是**封装（encapsulation）**——每个用 `register` 注册的插件都是**独立上下文**，其内部的 decorator、hook、子插件对兄弟节点不可见：

```ts
import Fastify from 'fastify'

const app = Fastify()

// 这个插件是封装的——它的 decorator 对兄弟节点不可见
app.register(async function childPlugin (fastify) {
  fastify.decorate('privateUtil', () => 'only available here')
  fastify.get('/child', async function () {
    return this.privateUtil()   // ✅ 这里能用
  })
})

app.get('/parent', async function () {
  // this.privateUtil 在这里是 undefined —— 不同上下文
  return { status: 'ok' }
})
```

要**打破封装**、把 decorator/hook 共享给父级和兄弟，用 `fastify-plugin`（惯称 `fp`）包裹：

```ts
import fp from 'fastify-plugin'

// fp 包裹后，db decorator 对父级和兄弟都可见
export default fp(async function databasePlugin (fastify, options) {
  const db = await createConnection(options.connectionString)
  fastify.decorate('db', db)
  fastify.addHook('onClose', async () => { await db.close() })
}, { name: 'database-plugin', dependencies: [] })
```

其余核心原则：**Schema 优先**（用 JSON Schema 做校验 + 序列化，序列化提速明显）、**async/await** 全支持（handler 和 hook 都可 async）、**`inject()` 测试**（无需起真实端口即可测路由）、**Pino 日志**（`Fastify({ logger: true })`）。推荐阅读顺序技能里也给了：新手 `plugins → routes → schemas`，加认证 `plugins → hooks → authentication`，提性能 `schemas → serialization → performance`。

## node 与 nodejs-core：应用层 vs 引擎层

这两个技能常被混淆，分工清晰：

### node —— 应用层现代 Node.js

- **原生 type stripping**（Node 22.6+）：`node app.ts` 直接跑，替代 ts-node/tsx；用 `import type`、`as const` 替 `enum`、导入带 `.ts`
- **流优先 `pipeline()`**：处理 CSV/ETL/大文件时，用 `node:stream/promises` 的 `await pipeline(...)` 而非链式 `.pipe()`，背压自动处理；转换用 `async function*`
- **缓存策略**：单进程有界复用用 `lru-cache`；异步请求去重 / stale-while-revalidate 用 `async-cache-dedupe`（作者自家库）
- **优雅关闭**：注册 SIGTERM/SIGINT → 停收新活 → 排空在途请求 → 关外部连接（DB/缓存）→ 按码退出
- **错误处理**：共享错误基类 → 区分「操作型 vs 程序型」错误 → 加 `process.on('unhandledRejection')` 边界 → 带上下文日志

### nodejs-core —— 引擎层内核

面向 Node.js core 贡献者与原生插件开发者，覆盖：

- **V8**：Scavenger/Mark-Sweep/Mark-Compact GC、隐藏类与内联缓存、TurboFan JIT 的优化/去优化
- **libuv**：事件循环各阶段（timers/I/O/idle/check/close）、线程池（`UV_THREADPOOL_SIZE`）、异步 I/O
- **原生插件**：N-API（ABI 稳定）、node-addon-api（C++ 封装）、原生内存防泄漏
- **primordials**：`lib/internal/` 里必须用 primordials 防原型污染
- **core 贡献**：commit/PR 规范（子系统前缀、朴素陈述、DCO 签名）、reviewing PR

**铁律**：改 `src/` 或 `lib/` 后**必须先 `make -j$(nproc)` rebuild 再测**——因为 `lib/` 的 JS 通过 `js2c` 在编译期嵌入二进制，不 rebuild 测的是旧代码，结果无意义。诊断也系统化：段错误 → `node --napi-modules` 复现 + gdb `bt`；性能回归 → `--trace-opt --trace-deopt` 找去优化函数。

## typescript-magician：消除 any 的方法论

不是随手改，而是有固定流程：

1. 先跑 `tsc --noEmit` 抓**全量**错误输出（改之前）
2. 定位根因（不健全推断、缺约束、隐式 `any`）
3. 用高级特性给出类型安全解
4. 消除所有 `any`，每次替换都验证仍满足调用点
5. 再跑一遍 `tsc --noEmit` 确认干净编译

典型手法——用泛型约束替代 `any`：

```ts
// Before：obj 和返回都是 any
function getProperty (obj: any, key: string): any { return obj[key] }

// After：K 约束为 keyof T，返回精确到 T[K]
function getProperty<T, K extends keyof T> (obj: T, key: K): T[K] {
  return obj[key]
}
// getProperty({ name: 'Alice' }, 'name') → 推断为 string ✓
```

能力覆盖：条件类型、`infer` 提取、模板字面量类型、映射类型、品牌/名义类型、变体与分发规则、模块增强与声明合并。对每个挑战它会讲类型理论、给多方案、展示 before/after 类型表示。

## oauth：带 RFC 的 OAuth 2.0/2.1

绑定 Fastify 生态（`@fastify/oauth2` + `@fastify/cookie`/`@fastify/session` + `@fastify/jwt`），核心是**授权码 + PKCE**，每条要求都标 RFC。安全清单节选：

| 要求 | RFC |
| --- | --- |
| 校验 redirect URI 白名单 | RFC 6749 §3.1.2 |
| 公共客户端一律 PKCE（S256） | RFC 7636 §4.2 |
| 校验 `state` 防 CSRF | RFC 6749 §10.12 |
| 每个 JWT 校验 `iss`/`aud`/`exp` | RFC 7519 §4 |
| 每次使用轮换刷新令牌 | RFC 6749 §10.4 |
| 全程 HTTPS，拒 HTTP redirect | RFC 6749 §3.1.2.1 |

反模式清单（技能明确点名）：**用 localStorage 存 token**（应 `HttpOnly`+`Secure`+`SameSite=Strict` cookie）、**跳过 audience 校验**、**用隐式流**（OAuth 2.1 已废弃，改授权码 + PKCE）、**第三方 token 用对称 HS256 签名**（应 RS256/ES256 + JWKS）。

## linting-neostandard-eslint9 与 documentation

### linting-neostandard-eslint9

`neostandard` 是 Standard 风格的 ESLint v9 flat-config 基线。最小起步：

```js
// eslint.config.js
import neostandard from 'neostandard'
export default neostandard()
```

核心原则：pin 主版本保证可复现、config 极简显式、**CI 跑非 `--fix`（当质量门禁）、本地才开 `--fix`**。技能还覆盖从 `standard` 迁移、从旧 `.eslintrc*` 迁移到 flat config。

### documentation（Diátaxis）

按 Diátaxis 框架把文档分**四种互不混淆**的类型，按用户信号选型：

| 用户信号 | 类型 |
| --- | --- |
| 「我刚入门，带我走一遍」 | **教程**（学习导向） |
| 「我要怎么做到 X」 | **指南**（问题导向） |
| 「X 的参数/语法是什么」 | **参考**（信息导向） |
| 「X 为什么这样设计」 | **解释**（理解导向） |

铁律：**每篇只做一种类型**——别把教程步骤、参考表格、概念展开混在一页；类型间交叉链接而非混写。

## 反模式速览

- **Fastify**：不该共享的到处 `fp`（破坏封装本意）；不写 Schema（丢掉校验 + 序列化提速）；用真实端口而非 `inject()` 测试
- **node**：链式 `.pipe()` 不处理背压（应 `pipeline()`）；`enum`/namespace（破坏 type stripping）；无优雅关闭导致在途请求被切
- **nodejs-core**：改 `lib/`/`src/` 不 rebuild 就测；`lib/internal/` 不用 primordials
- **TypeScript**：留 `any` 当逃生舱；不先 `tsc --noEmit` 摸清全量错误就乱改
- **oauth**：localStorage 存 token、隐式流、跳过 `aud` 校验、HS256 签第三方 token

## 下一步

- [参考](./reference) —— 11 技能全表 + 安装、Diátaxis 四类、ESLint9、版本、许可、链接
- 上游：[mcollina/skills](https://github.com/mcollina/skills)
