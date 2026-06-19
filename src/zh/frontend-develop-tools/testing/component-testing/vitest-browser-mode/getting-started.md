---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Vitest v4.x（Browser Mode）编写

## 速查

- 初始化：`npx vitest init browser`（或装 provider `@vitest/browser-playwright`）
- 配置：`test.browser: { enabled: true, provider: playwright(), instances: [{ browser: "chromium" }] }`
- 组件测试：`vitest-browser-vue` 的 `render(C)` → 返回带 locator 的 screen
- 查询：`screen.getByRole("button", { name: "..." })`（语义 locator，惰性 + 重试）
- 交互：`await screen.getByRole(...).click()` / `userEvent.fill(...)`（真实浏览器事件）
- 断言：`await expect.element(locator).toBeVisible()`（内置重试）
- 无头：`browser.headless`（CI 默认 true）
- import：从 `vitest/browser` 导入 `page` / `userEvent`（v4）

## 为什么用真实浏览器

jsdom / happy-dom 只是在 Node 里**模拟** DOM，没有真实布局引擎、部分 API 行为不一致，可能误报。Browser Mode 在**真实浏览器**里跑，渲染 / CSS / 浏览器 API 都真实，置信度最高。

> 二者不是替代关系——纯逻辑用 jsdom（快），组件交互 / CSS 关键路径用 Browser Mode（准）。

## 安装与配置

最快用脚手架：

```bash
npx vitest init browser
```

或手动装 provider（推荐 Playwright）+ 配置：

```bash
pnpm add -D @vitest/browser-playwright
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [vue()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true, // CI 默认无头
      instances: [{ browser: "chromium" }], // 至少一个实例
    },
  },
});
```

完整配置（provider 对比、多浏览器、headless）见 [配置](./guide-line/configuration.md)。

## 第一个组件测试

装 `vitest-browser-vue`，在 setupFiles 注册：

```ts
// vitest.config.ts → test.setupFiles: ["vitest-browser-vue"]
```

```ts
import { render } from "vitest-browser-vue";
import { expect, test } from "vitest";
import Counter from "./Counter.vue";

test("点击递增", async () => {
  const screen = await render(Counter, { props: { initialCount: 1 } });

  // 语义查询 + 真实点击
  await screen.getByRole("button", { name: "Increment" }).click();

  // 断言内置重试，无需手动等待
  await expect.element(screen.getByText("Count is 2")).toBeVisible();
});
```

注意三点和 jsdom 下 VTU 的差别：用**语义 locator**（`getByRole`）查、用 `await ...click()` 做**真实交互**、用 `expect.element` 做**带重试**的断言。

## 查询、交互、断言

```ts
import { page, userEvent } from "vitest/browser"; // v4 从 vitest/browser 导入

// 查询（语义 locator，惰性、可链式）
const btn = page.getByRole("button", { name: /submit/i });

// 交互（真实浏览器事件，由 CDP / WebDriver 驱动）
await btn.click();
await userEvent.fill(page.getByLabelText("用户名"), "Alice");

// 断言（内置重试）
await expect.element(page.getByText("成功")).toBeVisible();
```

详见 [Locators](./guide-line/locators.md) / [交互与断言](./guide-line/interactivity.md)。

## 下一步

- [配置](./guide-line/configuration.md)：`enabled`/`provider`/`instances`/`headless`、provider 对比、多浏览器
- [Locators](./guide-line/locators.md)：语义查询、链式、`filter`、`frameLocator`
- [交互与断言](./guide-line/interactivity.md)：`userEvent`、`expect.element` 与 matcher
- [视觉回归与对比](./guide-line/visual-vs-jsdom.md)：`toMatchScreenshot`、vs jsdom、vs Playwright CT
