---
layout: doc
outline: [2, 3]
---

# 迁移与对比

> 基于 MSW v2.x 编写

## 速查

- 1.x → 2.x：`rest` → `http`、`res(ctx.json())` → `HttpResponse.json()`、`req.params` → 解构 `params`、`req.body` → `await request.json()`
- 环境要求：Node ≥ 18、TypeScript ≥ 4.7
- 选型：网络 mock 用 MSW；纯函数 / 模块级 mock 用 `vi.mock`；axios-mock-adapter 已停滞、勿选
- 反模式：别断言「请求发了几次」，改在 handler 里体现校验 + UI 行为断言

## 1.x → 2.x 迁移

v2 是一次拥抱 Fetch API 标准的破坏性重构。核心对照：

| 场景         | 1.x                              | 2.x                                   |
| ------------ | -------------------------------- | ------------------------------------- |
| 命名空间     | `rest.get(...)`                  | `http.get(...)`                       |
| 浏览器导入   | `setupWorker` from `"msw"`       | from `"msw/browser"`                  |
| resolver     | `(req, res, ctx) => ...`         | `({ request, params }) => ...`        |
| JSON 响应    | `res(ctx.json(data))`            | `HttpResponse.json(data)`             |
| 状态码       | `res(ctx.status(201))`           | `new HttpResponse(null, { status: 201 })` |
| 路径参数     | `req.params.id`                  | `params.id`（解构）                   |
| 查询参数     | `req.url.searchParams`           | `new URL(request.url).searchParams`   |
| 请求体       | `req.body`（自动解析）           | `await request.json()`（Fetch 标准）  |
| 一次性       | `res.once(...)`                  | 第三参数 `{ once: true }`             |
| 网络错误     | `res.networkError(...)`          | `HttpResponse.error()`                |
| passthrough  | `req.passthrough()`              | `return passthrough()`                |

```ts
// 1.x
rest.get("/user", (req, res, ctx) => {
  return res(ctx.json({ id: req.params.id }));
});

// 2.x
http.get("/user/:id", ({ params }) => {
  return HttpResponse.json({ id: params.id });
});
```

> 官方合作的 Codemod 可自动迁移大部分 1.x 代码。

## 与 axios-mock-adapter 对比

| 维度         | MSW v2                          | axios-mock-adapter        |
| ------------ | ------------------------------- | ------------------------- |
| 拦截层       | 网络层（SW / Node interceptor） | axios adapter 层          |
| 客户端兼容   | fetch / axios / ky / got 通吃   | **仅 axios**              |
| 多环境复用   | 测试 / 开发 / Storybook 共享    | 仅测试                    |
| Web 标准     | 完全基于 Fetch Request/Response | 私有 API                  |
| 维护状态     | 活跃                            | **2024-10 起零 commit，停滞** |

::: tip 新项目无条件选 MSW
axios-mock-adapter 已停止维护且只服务 axios。新项目应选 MSW，或对纯函数用 Vitest 内置 `vi.mock`。
:::

## 与 vi.mock 的取舍

- **`vi.mock`**（见 [Vitest](../../vitest/guide-line/mocking.md)）：模块级 mock，适合**无网络**的纯函数 / 依赖隔离单测，最轻量。
- **MSW**：网络层 mock，适合**有 HTTP 调用**的集成 / 组件测试，业务代码不动、跨环境复用。

二者互补：纯逻辑用 `vi.mock`，凡涉及真实 HTTP 请求用 MSW。

## 最佳实践

- **handler 复用**：一套 `handlers` 跨 Vitest / Storybook / Playwright；`node.ts` 用 `setupServer`、`browser.ts` 用 `setupWorker`。
- **正常路径放初始 handler，异常路径用 `server.use` 覆盖**。
- **开 `onUnhandledRequest: "error"`**：确保没有遗漏的真实请求悄悄发出。
- **别断言请求次数 / 参数**（官方反模式）：在 handler 内体现校验（参数不对返回 400），通过 UI 行为（错误提示、按钮禁用）断言；第三方打点类请求可用 `server.events` 生命周期 API。
