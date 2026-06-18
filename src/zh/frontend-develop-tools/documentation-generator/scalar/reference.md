---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 @scalar/api-reference 1.60.0 编写

## 速查

- Scalar **消费** OpenAPI/Swagger **渲染**交互式文档 + 内置可发请求客户端，**不生成 spec**
- 入口：CDN `Scalar.createApiReference('#app', { url })` / ESM `import { createApiReference }` / 框架 `apiReference({ url })`
- 加载 spec：`url`（可缓存，推荐）/ `content`（内联，大文档影响性能）/ `sources[]`（多 spec，`slug`+`title`）
- 主题 11 套 + `none`；`layout` `modern`/`classic`；明暗 `darkMode` / `forceDarkModeState`
- 跨域配 `proxyUrl`（默认 `https://proxy.scalar.com`，生产自建）；旧 `fetch` 选项弃用→`customFetch`
- **版本各自独立**：核心 `1.60.0`；`fastify` 1.60.0（唯一同步）/ `nestjs` 1.2.4 / `hono` 0.11.4 / `express` 0.10.4 / `react` 0.9.47；`api-client` 3.10.4
- 许可：Scalar **MIT**；vs Swagger UI（Apache-2.0，弱 Try it out）/ Redoc（MIT，只读）

## 接入入口速查

| 方式 | 入口 |
| --- | --- |
| CDN 脚本 | `Scalar.createApiReference(selector, config)` |
| ESM | `import { createApiReference } from '@scalar/api-reference'` |
| 后端中间件 | `apiReference(config)` 挂路由（Express/Hono/NestJS/Fastify） |
| 前端组件 | React `<ApiReferenceReact configuration={...} />` / Vue 组件 |

## 配置字段速查

| 字段 | 作用 |
| --- | --- |
| `url` | spec 地址（可缓存，**推荐**） |
| `content` | 内联 spec 对象 / 字符串（大文档影响性能） |
| `sources` | 多 spec 数组，每项 `slug` + `title` |
| `theme` | 11 套配色 + `none` |
| `layout` | `modern`（默认）/ `classic` |
| `darkMode` / `forceDarkModeState` | 默认明暗 / 锁定明暗（`'dark'`\|`'light'`） |
| `showSidebar` | 是否显示侧边栏 |
| `hideModels` | 隐藏 Models/Schemas 区块 |
| `hideTestRequestButton` / `hideClientButton` | 隐藏发请求 / 调起客户端按钮 |
| `servers` | 覆盖 spec 的 servers |
| `authentication` | 预填鉴权凭据 |
| `proxyUrl` | CORS 代理地址 |
| `defaultHttpClient` / `hiddenClients` | 代码片段默认项 / 隐藏项 |
| `customCss` | 注入自定义 CSS |
| `searchHotKey` | 自定义搜索热键 |

## 主题取值速查

`default` · `alternate` · `moon` · `purple` · `solarized` · `bluePlanet` · `saturn` · `kepler` · `mars` · `deepSpace` · `laserwave` · `none`（共 11 套 + none）

## 版本与生态

| 包 | 版本 | 角色 |
| --- | --- | --- |
| `@scalar/api-reference` | 1.60.0 | 核心渲染器（消费 spec，内置客户端） |
| `@scalar/api-client` | 3.10.4 | API 客户端核心（发请求 / 环境变量 / 历史 / 桌面 app） |
| `@scalar/fastify-api-reference` | 1.60.0 | Fastify 集成（**唯一与核心同步**） |
| `@scalar/nestjs-api-reference` | 1.2.4 | NestJS 集成 |
| `@scalar/hono-api-reference` | 0.11.4 | Hono 集成 |
| `@scalar/express-api-reference` | 0.10.4 | Express 集成 |
| `@scalar/api-reference-react` | 0.9.47 | React 集成 |

> 集成包**版本线各自独立**，只有 fastify 与核心包同步；落地按目标框架的包名各查各的版本，别用核心 `1.60.0` 一概而论。

## Scalar vs Swagger UI vs Redoc

| 维度 | Scalar | Swagger UI | Redoc |
| --- | --- | --- | --- |
| 发真实请求 | **能（完整客户端）** | 能但弱 | 不能（只读） |
| UI 现代度 | 高（11 主题 / 2 布局） | 偏老 | 简洁静态 |
| 许可 | MIT | Apache-2.0 | MIT |

## 常见坑

- 以为 Scalar 能生成 OpenAPI——它**只渲染**，生成靠上游（如 NestJS Swagger 模块）
- 用核心包版本 `1.60.0` 指代集成包——集成包版本线分裂（仅 fastify 同步）
- 以为像 Redoc 只读——实则内置可发**真实请求**的客户端
- 忘配 `proxyUrl` 致内置客户端**跨域失败**（默认走 `proxy.scalar.com`，生产建议自建）
- 沿用已弃用的 legacy API（`data-url` 标签、旧 `fetch` 选项→改 `customFetch`）
- 混淆开源渲染器（MIT，免费）与托管平台（Registry/Dashboard，freemium）

## 文档与 GitHub 链接

- 官网：[https://scalar.com/](https://scalar.com/)
- 文档：[https://guides.scalar.com/scalar/introduction](https://guides.scalar.com/scalar/introduction)
- 配置参考：[https://scalar.com/products/api-references/configuration](https://scalar.com/products/api-references/configuration)
- GitHub 仓库：[https://github.com/scalar/scalar](https://github.com/scalar/scalar)

返回：[接入方式](./guide-line/integration.md) · [配置对象详解](./guide-line/configuration.md) · [内置客户端与 CORS](./guide-line/api-client-cors.md) · [主题与对比选型](./guide-line/themes-comparison.md)
