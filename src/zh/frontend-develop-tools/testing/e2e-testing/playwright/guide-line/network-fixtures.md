---
layout: doc
outline: [2, 3]
---

# 网络与 Fixtures

> 基于 Playwright v1.61 编写

## 速查

- mock：`page.route(url, route => route.fulfill({ json }))` stub 响应
- 改真实响应：`route.fetch()` 拿到再改；`route.abort()` 阻止；`route.continue()` 透传
- 等响应：`page.waitForResponse("**/api/x")`
- 纯 API：`request` fixture（不开浏览器）：`request.post(url, { data })`
- 内置 fixtures：`page` / `context` / `browser` / `request` / `browserName`
- 自定义：`base.extend({...})`，test-scoped（每 test）或 worker-scoped

## page.route 网络 mock

```ts
// stub 静态响应（Mock API）
await page.route("**/api/users", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, name: "张三" }]),
  });
});

// 改真实响应（先 fetch 再改）
await page.route("**/api/products", async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json[0].price = 0;
  await route.fulfill({ response, json });
});

// 阻止请求（如拦图片加速）
await page.route("**/*.{png,jpg,svg}", (route) => route.abort());

// 透传 + 改请求头
await page.route("**/api/**", (route) =>
  route.continue({ headers: { ...route.request().headers(), "X-Test": "1" } }),
);
```

## 等待响应

```ts
const respPromise = page.waitForResponse("**/api/login");
await page.getByRole("button", { name: "登录" }).click();
const resp = await respPromise;
expect(resp.status()).toBe(200);
```

## request fixture（纯 API）

不开浏览器、直接发 HTTP 请求，适合 API 测试或测试前置数据准备：

```ts
test("API 验证", async ({ request }) => {
  const resp = await request.post("/api/login", {
    data: { username: "admin", password: "secret" },
  });
  expect(resp.ok()).toBeTruthy();
  expect((await resp.json()).token).toBeDefined();
});
```

## 内置 fixtures

`test(async ({ page, context, browser, request, browserName }) => {})`：

- `page` / `context`：test 级，每个 test 独立
- `browser`：worker 级，跨 test 共享
- `request`：API 请求上下文
- `browserName`：当前 project 浏览器名

## 自定义 fixtures

用 `test.extend` 封装登录态、Page Object 等，自动 setup/teardown：

```ts
// fixtures.ts
import { test as base, type Page } from "@playwright/test";

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: "playwright/.auth/admin.json", // 复用登录态
    });
    const page = await ctx.newPage();
    await use(page); // test 在此执行
    await ctx.close(); // teardown
  },
});
export { expect } from "@playwright/test";
```

```ts
// 用法
import { test, expect } from "./fixtures";
test("管理员操作", async ({ adminPage }) => {
  await adminPage.goto("/admin");
});
```

> worker 级 fixture（`{ scope: "worker" }`）适合昂贵资源（如启动一次服务器），一个 worker 只初始化一次。