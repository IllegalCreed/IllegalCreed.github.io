---
layout: doc
outline: [2, 3]
---

# 测试集成

> 基于 MSW v2.x 编写

## 速查

- Node 测试用 `setupServer`：`import { setupServer } from "msw/node"`
- 生命周期三步：`beforeAll(() => server.listen())` / `afterEach(() => server.resetHandlers())` / `afterAll(() => server.close())`
- 严格模式：`server.listen({ onUnhandledRequest: "error" })`
- 运行时覆盖：`server.use(http.get(...))`；一次性 `{ once: true }`
- 优先级：运行时 handler > 初始 handler；`resetHandlers` 只清运行时

## setupServer

Vitest / Jest 在 Node 进程里跑，用 `setupServer`（从 `msw/node` 导入）。它拦截 Node 的 `http`/`https`，**不启动真实服务器**、同步工作：

```ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

## 生命周期三步

```ts
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./src/mocks/node";

beforeAll(() => server.listen()); // 开始拦截
afterEach(() => server.resetHandlers()); // 每个测试后重置运行时 handler
afterAll(() => server.close()); // 关闭拦截、还原原生模块
```

- `listen()`：开始拦截，通常放 `beforeAll`。
- `resetHandlers()`：清除测试中用 `server.use` 添加的运行时 handler，**防止测试间互相污染**，放 `afterEach`。
- `close()`：停止拦截、还原 Node 原生模块，放 `afterAll`。

## onUnhandledRequest

Vitest 官方推荐开严格模式，未匹配的请求直接报错，避免悄悄发出真实网络：

```ts
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
```

| 值        | 行为                          |
| --------- | ----------------------------- |
| `"error"` | 抛错、测试失败（**测试推荐**）|
| `"warn"`  | 控制台警告，继续              |
| `"bypass"`| 静默放行、发真实请求（默认）  |

## 运行时覆盖：server.use

在单个测试里临时替换 handler，测异常路径（如 500、超时）：

```ts
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { server } from "./src/mocks/node";

test("接口 500 时显示错误", async () => {
  server.use(
    http.get("/api/user", () => new HttpResponse(null, { status: 500 })),
  );
  const res = await fetch("/api/user");
  expect(res.status).toBe(500);
  // afterEach 的 resetHandlers() 会自动清掉这个覆盖
});
```

一次性覆盖（只生效一次，之后回退到初始 handler）：

```ts
server.use(
  http.get("/api/user", () => HttpResponse.text("一次性"), { once: true }),
);
```

::: tip Handler 优先级
运行时 handler（`server.use` 添加）优先于初始 handler（`setupServer` 传入）。`resetHandlers()` 只清运行时 handler，初始 handler 不受影响。
:::

## 测试组件的数据加载

业务代码照常发请求，组件挂载后断言 UI——这正是 MSW 的典型用法（搭配组件测试章的 Vue Test Utils 或 Testing Library）：

```ts
test("用户名渲染到页面", async () => {
  // 初始 handler 已 mock /api/user 返回 { name: "John" }
  const wrapper = mount(UserCard);
  await flushPromises(); // 等异步请求与 DOM 更新
  expect(wrapper.text()).toContain("John");
});
```

::: warning 别断言「请求发了几次」
MSW 官方反模式：不推荐断言请求次数 / 参数。正确做法是在 handler 里体现业务校验（参数不对就返回 400），再通过 UI 行为（错误提示、按钮禁用）断言。详见 [迁移与对比](./migration.md#最佳实践)。
:::
