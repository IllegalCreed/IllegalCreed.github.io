---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Playwright v1.61 编写

## 速查

- 安装：`npm init playwright@latest` → `npx playwright install`（装浏览器；CI 加 `--with-deps`）
- 配置：`playwright.config.ts` 的 `use.baseURL` / `projects`（多浏览器）/ `webServer` / `use.trace`
- 测试：`import { test, expect } from "@playwright/test"`；`test("...", async ({ page }) => {})`
- 定位：语义 Locator `page.getByRole("button", { name: "提交" })`
- 等待：动作前 auto-wait，断言用 web-first `await expect(locator).toBeVisible()`
- 隔离：每个 test 独立 BrowserContext（无痕会话）
- 跑：`npx playwright test`；`--ui` 可视化；`--debug` 调试；`show-trace` 看 trace

## 安装

```bash
npm init playwright@latest   # 交互式初始化，生成 config + 示例
npx playwright install       # 装 Chromium/Firefox/WebKit 二进制
# CI：npx playwright install --with-deps
```

## 配置 playwright.config.ts

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // CI 禁止 test.only
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry", // 失败首次重试录 trace（CI 黄金配置）
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev", // 测试前自动启动应用
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

## Browser / Context / Page 模型

```
Browser（浏览器进程，多 test 共享）
└── BrowserContext（隔离容器 = 无痕会话，每 test 独立）
    └── Page（标签页）
```

每个 test 默认获得**独立的 BrowserContext**——cookie / localStorage / IndexedDB 完全隔离，等价于全新无痕窗口，无需手动清理。`browser` 是 worker 级共享，`context` / `page` 是 test 级新建。

## 第一个测试

```ts
import { test, expect } from "@playwright/test";

test("成功登录跳转首页", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("用户名").fill("admin");
  await page.getByLabel("密码").fill("password123");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "欢迎" })).toBeVisible();
});
```

三个要点：用**语义 Locator**（getByLabel/getByRole）定位、动作**自动等待**可交互、断言用 **web-first**（自动重试）。

## 下一步

- [Locator 与自动等待](./guide-line/locators.md)：七大语义查询、链式过滤、actionability
- [Web-First 断言](./guide-line/assertions.md)：自动重试断言、soft 断言
- [网络与 Fixtures](./guide-line/network-fixtures.md)：`page.route` mock、内置/自定义 fixtures
- [并行与多浏览器](./guide-line/parallel-projects.md)：worker 并行、projects 矩阵、sharding
- [调试与 Trace](./guide-line/debugging-trace.md)：Trace Viewer、codegen、UI Mode、vs Cypress