---
layout: doc
outline: [2, 3]
---

# 接入方式与框架集成

> 基于 @scalar/api-reference 1.60.0 编写

## 速查

- 四类接入：**CDN 脚本** / **ESM 导入** / **后端框架中间件** / **前端框架组件**，都消费同一套通用配置对象
- CDN：`<script src=".../@scalar/api-reference">` + `Scalar.createApiReference('#app', { url })`
- ESM：`import { createApiReference } from '@scalar/api-reference'`
- 后端中间件范式：`apiReference({ url })` 挂到路由（Express / Hono / NestJS / Fastify…）
- 前端组件范式：React `<ApiReferenceReact configuration={...} />`、Vue 官方组件，配置作 props
- **集成包版本线分裂**：核心 1.60.0；`nestjs` 1.2.4 / `hono` 0.11.4 / `express` 0.10.4 / `react` 0.9.47；仅 `fastify` 与核心同步至 1.60.0
- 旧 `data-url` 标签写法已弃用，统一用 `createApiReference` / `apiReference`

## 四类接入方式

Scalar 的妙处在于"配置对象通用"——无论从哪种方式挂载，传的都是同一组字段（`url` / `theme` / `proxyUrl`…），学一次处处可用。

| 方式 | 入口 | 适用 |
| --- | --- | --- |
| **CDN 脚本** | `Scalar.createApiReference(sel, cfg)` | 静态页 / 最快验证 |
| **ESM 导入** | `import { createApiReference }` | 打包的前端项目 |
| **后端中间件** | `apiReference(cfg)` 挂路由 | 后端直接暴露文档路由 |
| **前端组件** | React / Vue 组件，props 传 cfg | SPA 内嵌文档 |

## CDN 与 ESM

```html
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
  Scalar.createApiReference("#app", { url: "/openapi.json" });
</script>
```

```ts
// 打包项目里用 ESM
import { createApiReference } from "@scalar/api-reference";

createApiReference("#app", { url: "/openapi.json" });
```

## 后端框架中间件

后端集成包普遍导出 `apiReference(config)`，返回一个中间件挂到某路由。各包仅安装名与少量适配不同，配置对象一致。

```ts
// Express：@scalar/express-api-reference（约 0.10.4）
import { apiReference } from "@scalar/express-api-reference";
app.use("/docs", apiReference({ url: "/openapi.json" }));
```

```ts
// Hono：@scalar/hono-api-reference（约 0.11.4）
import { apiReference } from "@scalar/hono-api-reference";
app.get("/docs", apiReference({ url: "/openapi.json" }));
```

NestJS 则配合其 Swagger 模块：`@nestjs/swagger` 生成 spec，`@scalar/nestjs-api-reference`（约 1.2.4）消费 spec 渲染，Scalar **只替换渲染层**。

## 前端框架组件

```tsx
// React：@scalar/api-reference-react（约 0.9.47）
import { ApiReferenceReact } from "@scalar/api-reference-react";

export default function Docs() {
  return <ApiReferenceReact configuration={{ url: "/openapi.json" }} />;
}
```

Vue 用官方提供的 Vue 组件，同样把 `configuration` 作为 prop 传入即可挂载。

## 版本线分裂是头号坑

各框架集成包**各自独立发布版本**，不与核心包绑定：

| 包 | 版本 | 与核心同步？ |
| --- | --- | --- |
| `@scalar/api-reference` | 1.60.0 | —（核心） |
| `@scalar/fastify-api-reference` | 1.60.0 | **是**（唯一同步） |
| `@scalar/nestjs-api-reference` | 1.2.4 | 否 |
| `@scalar/hono-api-reference` | 0.11.4 | 否 |
| `@scalar/express-api-reference` | 0.10.4 | 否 |
| `@scalar/api-reference-react` | 0.9.47 | 否 |

::: warning 别用核心版本号指代集成包
看到核心包是 `1.60.0` 就去装 `@scalar/express-api-reference@1.60.0` 必然失败——它的版本线在 `0.10.x`。落地时**按目标框架的包名各查各的版本**。
:::

下一步：[配置对象详解](./configuration.md) · [内置客户端与 CORS](./api-client-cors.md) · [主题与对比选型](./themes-comparison.md)
