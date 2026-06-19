---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MSW v2.x 编写

## 速查

- 安装：`pnpm add -D msw`
- 浏览器 Service Worker 文件：`npx msw init public/ --save`
- 定义 handler：`http.get(url, () => HttpResponse.json(data))`
- Node / 测试：`import { setupServer } from "msw/node"` → `setupServer(...handlers)`
- 浏览器 / 开发：`import { setupWorker } from "msw/browser"`
- Vitest 三步：`beforeAll(() => server.listen())` / `afterEach(() => server.resetHandlers())` / `afterAll(() => server.close())`
- 运行时覆盖：`server.use(http.get(...))`
- 未匹配请求报错：`server.listen({ onUnhandledRequest: "error" })`

## 安装

```bash
pnpm add -D msw
```

只在浏览器里 mock（开发 / Storybook）时，还要生成 Service Worker 文件到 Vite 的 `public/`：

```bash
npx msw init public/ --save
```

::: tip 测试场景不需要 Service Worker 文件
在 Vitest / Jest（Node 环境）跑测试用的是 `setupServer`，它通过拦截 Node 的 `http`/`https` 工作，**不需要** `mockServiceWorker.js`。只有浏览器里的 `setupWorker` 才需要 `msw init`。
:::

## 定义 handler

handler 描述「拦截哪个请求、返回什么」。一组 handler 放一个文件，浏览器与测试共用：

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/user", () => {
    return HttpResponse.json({ id: "1", name: "John" });
  }),
  http.post("/api/login", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ token: "abc-123" });
  }),
];
```

完整的 handler 写法（路径 / 查询参数、请求体、cookie、TS 泛型）见 [Handler](./guide-line/handlers.md)。

## 在 Vitest 里集成

新建 setup 文件，用 `setupServer` + 生命周期三步：

```ts
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./src/mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" })); // 开始拦截
afterEach(() => server.resetHandlers()); // 重置运行时 handler，防污染
afterAll(() => server.close()); // 还原原生模块
```

```ts
// vitest.config.ts
export default defineConfig({
  test: { setupFiles: ["./vitest.setup.ts"] },
});
```

::: warning setupServer 不是真服务器
名字带 server，但它**不启动任何真实服务器**，完全在当前进程内同步拦截。`onUnhandledRequest: "error"` 让未 mock 的请求直接报错，避免遗漏。
:::

## 第一个 mock 测试

```ts
import { expect, test } from "vitest";

test("加载用户", async () => {
  const res = await fetch("/api/user");
  const user = await res.json();
  expect(user.name).toBe("John"); // 命中 handlers 里的 mock
});
```

业务代码照常 `fetch`，MSW 在网络层返回 mock 数据——无需改任何请求调用。

## 下一步

- [Handler](./guide-line/handlers.md)：`http.*`、`HttpResponse`、路径 / 查询参数、请求体、cookie、TS 泛型
- [测试集成](./guide-line/testing.md)：`setupServer` 生命周期、`server.use` 运行时覆盖、`onUnhandledRequest`
- [网络行为](./guide-line/network-behavior.md)：错误 / 网络错误、`delay`、`passthrough` / `bypass`、GraphQL
- [迁移与对比](./guide-line/migration.md)：1.x → 2.x、与 axios-mock-adapter / `vi.mock` 的取舍
