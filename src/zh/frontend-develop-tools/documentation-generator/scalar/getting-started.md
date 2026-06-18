---
layout: doc
outline: [2, 3]
---

# 快速上手

> 基于 @scalar/api-reference 1.60.0 编写

## 速查

- Scalar **消费** OpenAPI/Swagger **渲染**交互式文档 + 内置可发请求客户端——**不生成 spec**，spec 靠上游（如 NestJS Swagger 模块）
- 最快接入：CDN 引 `@scalar/api-reference` 后 `Scalar.createApiReference('#app', { url })`
- ESM：`import { createApiReference } from '@scalar/api-reference'`，调用同名函数
- 后端框架：装对应集成包，用中间件 `apiReference({ url })`（NestJS / Express / Hono / Fastify…）
- 前端框架：React 用 `@scalar/api-reference-react` 组件，Vue 用官方 Vue 组件，配置作 props 传
- 跨域：内置客户端从浏览器直连接口，未开 CORS 时配 `proxyUrl`（默认 `https://proxy.scalar.com`，生产建议自建）
- **已弃用别用**：旧 `<script id="api-reference" data-url>` 标签写法、旧 `fetch` 选项（改 `customFetch`）
- **版本各自独立**：核心 `@scalar/api-reference` **1.60.0**；`nestjs` 1.2.4 / `hono` 0.11.4 / `express` 0.10.4 / `react` 0.9.47；仅 `fastify` 1.60.0 与核心同步

## Scalar 不是什么

把 Scalar 当成"能生成 OpenAPI 的工具"，是最常见的认知错误。三点澄清：

- **不生成 spec**：它只渲染已有的 OpenAPI/Swagger 规范；生成规范是上游框架的事（如 NestJS 的 `@nestjs/swagger` 从装饰器扫描出 spec）
- **不是 Swagger Editor**：它不承担在线编辑 / 创作规范的职责，方向与编辑器相反
- **不是只读渲染器**：与 Redoc 不同，Scalar 内置可发**真实请求**的 API 客户端

::: tip 一句话定位
Scalar = 拿现成的 OpenAPI spec，渲染成"现代、可直接发请求"的 API 参考文档。上游生成 spec，Scalar 消费 spec。
:::

## 最快接入：CDN

引入 CDN 脚本后，全局对象 `Scalar` 暴露入口函数 `createApiReference`，指向挂载点并传配置即可：

```html
<!DOCTYPE html>
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
  Scalar.createApiReference("#app", {
    url: "/openapi.json", // 指向你的 OpenAPI spec（推荐用 url，可缓存）
    proxyUrl: "https://proxy.scalar.com", // 内置客户端跨域时走代理
  });
</script>
```

ESM 写法等价，只是改为具名导入：

```ts
import { createApiReference } from "@scalar/api-reference";

createApiReference("#app", { url: "/openapi.json" });
```

::: warning 旧 data-url 写法已弃用
此前流传的 `<script id="api-reference" data-url="...">` 标签式接入属于 legacy API，已被 `createApiReference` 取代。跟随旧教程容易踩坑。
:::

## 谁来生成 spec、谁来渲染

| 角色 | 谁负责 | 产物 |
| --- | --- | --- |
| **生成 spec** | 上游框架 / 工具（如 `@nestjs/swagger` 扫描装饰器） | OpenAPI/Swagger 规范 |
| **渲染文档** | **Scalar**（消费 spec） | 交互式 API 参考 + 内置客户端 |

所以"Scalar build 通过 = spec 已生成"是个伪命题：Scalar 跑通只说明渲染层 OK，spec 仍由上游产出。

## 在框架里集成

各后端框架装对应集成包，普遍是"中间件挂路由"的范式（以 Express 为例）：

```ts
import { apiReference } from "@scalar/express-api-reference";

app.use("/docs", apiReference({ url: "/openapi.json" }));
```

前端框架用组件，配置作为 props 传入（React 为例）：

```tsx
import { ApiReferenceReact } from "@scalar/api-reference-react";

export default () => <ApiReferenceReact configuration={{ url: "/openapi.json" }} />;
```

::: warning 各集成包版本线不同
**不能**用核心包 `1.60.0` 去指代集成包：`@scalar/nestjs-api-reference` 约 1.2.4、`@scalar/express-api-reference` 约 0.10.4、`@scalar/hono-api-reference` 约 0.11.4、`@scalar/api-reference-react` 约 0.9.47；只有 `@scalar/fastify-api-reference` 与核心同步到 1.60.0。装包时各查各的版本。
:::

下一步：[接入方式与框架集成](./guide-line/integration.md) · [配置对象详解](./guide-line/configuration.md) · [内置客户端与 CORS](./guide-line/api-client-cors.md) · [主题与对比选型](./guide-line/themes-comparison.md)
