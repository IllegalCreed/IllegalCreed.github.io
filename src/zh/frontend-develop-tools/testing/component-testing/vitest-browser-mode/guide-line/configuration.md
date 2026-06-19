---
layout: doc
outline: [2, 3]
---

# 配置

> 基于 Vitest v4.x（Browser Mode）编写

## 速查

- `browser.enabled`：开启 browser mode
- `browser.provider`：`playwright()`（推荐）/ `webdriverio()` / `preview()`，v4 改为函数调用
- `browser.instances`：浏览器实例列表，**至少一个**
- `browser.headless`：无头模式（默认 `process.env.CI`）
- `browser.screenshotFailures`：失败自动截图（默认 `!browser.ui`）
- `browser.locators.testIdAttribute`：`getByTestId` 用的属性名（默认 `data-testid`）

## browser 配置

```ts
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true, // CI 默认 true，本地调试设 false 看窗口
      screenshotFailures: true, // 失败自动截图（调试用）
      instances: [{ browser: "chromium" }],
    },
  },
});
```

## provider 对比

| provider | 安装包 | 浏览器 | 适用 |
| -------- | ------ | ------ | ---- |
| `playwright`（推荐） | `@vitest/browser-playwright` | chromium / firefox / webkit | 主流；支持 CDP、Trace、`frameLocator` |
| `webdriverio` | `@vitest/browser-webdriverio` | chrome / firefox / edge / safari | 需 Selenium 兼容 / 真机 |
| `preview` | `@vitest/browser-preview` | Vite dev server 内嵌 iframe | **仅本地预览**，事件为模拟、不适合 CI |

```ts
import { playwright } from "@vitest/browser-playwright";

provider: playwright({
  launchOptions: { slowMo: 50 },
  actionTimeout: 5000, // 单次操作超时
});
```

::: warning headless 要用 test.browser.headless
provider 的 `launchOptions.headless` 会被 Vitest 忽略，必须用 `test.browser.headless` 控制无头。
:::

## 多浏览器：browser.instances

v4 的核心特性——`instances` 共享单个 Vite server 同时跑多个浏览器（优于旧的多 projects）：

```ts
browser: {
  instances: [
    { browser: "chromium" },
    { browser: "firefox" },
    { browser: "webkit" },
  ];
}
```

每个实例可独立配置（同一 browser 多次需指定 `name`）：

```ts
instances: [
  {
    browser: "chromium",
    name: "chromium-ratio1",
    setupFiles: ["./setup.ratio.ts"],
    provide: { ratio: 1 }, // 向测试注入不同值
  },
  { browser: "chromium", name: "chromium-ratio2", provide: { ratio: 2 } },
];
```

按实例过滤运行：

```bash
vitest --project=chromium
vitest --project=firefox
```

## 组件测试配置

测 Vue 组件需装 `vitest-browser-vue` 并在 setupFiles 注册（自动清理钩子）：

```ts
export default defineConfig({
  plugins: [vue()],
  test: {
    setupFiles: ["vitest-browser-vue"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
```
