---
layout: doc
outline: [2, 3]
---

# 视觉回归与对比

> 基于 Vitest v4.x（Browser Mode）编写

## 速查

- 视觉回归：`await expect.element(el).toMatchScreenshot("名字")`（v4 新增）
- 更新基准：`vitest --update`；失败自动截图：`browser.screenshotFailures`
- vs jsdom：真实浏览器（准、慢） vs 模拟 DOM（快、可能误报）——并存
- vs Playwright CT：组件级用 Browser Mode、页面级流程用 Playwright E2E
- import：v4 从 `vitest/browser` 导入（旧 `@vitest/browser/context` 已废弃）

## 视觉回归 toMatchScreenshot

```ts
import { expect, test } from "vitest";
import { page } from "vitest/browser";

test("hero 外观回归", async () => {
  await expect.element(page.getByTestId("hero")).toMatchScreenshot("hero-section");
});
```

工作流：

1. **首次运行**：生成基准图（存到 `__screenshots__/`）。
2. **后续运行**：与基准对比，超出阈值则失败并生成 diff 图。
3. **更新基准**：`vitest --update`。

Vitest 会自动多次截图直到稳定（防动画误判）。可全局配阈值：

```ts
browser: {
  expect: {
    toMatchScreenshot: {
      comparatorName: "pixelmatch",
      comparatorOptions: { allowedMismatchedPixelRatio: 0.01 },
    },
  },
}
```

> `browser.screenshotFailures`（默认 `!browser.ui`）是另一回事——测试**失败时自动截图**用于调试，不是视觉回归。

## 与 jsdom 的取舍

| | jsdom / happy-dom | Browser Mode |
| --- | --- | --- |
| 环境 | Node 内模拟 DOM | 真实浏览器 |
| CSS 布局 | 不支持 | 完整支持 |
| 速度 | 快 | 慢（启动浏览器） |
| 误报 | 较高 | 低 |

::: tip 并存，不是二选一
纯逻辑 / 工具函数 → jsdom（快）；组件交互、CSS 关键路径、浏览器 API → Browser Mode（准）。同一项目可分层使用。
:::

## 与 Playwright Component Testing

| | Vitest Browser Mode | Playwright CT |
| --- | --- | --- |
| 框架 | Vitest（Vite 原生） | Playwright（独立） |
| 配置 | 复用 vite.config，轻 | 独立 config，重 |
| 与单测整合 | 同一 vitest 命令 | 独立运行 |
| 适合 | 单组件行为、视觉回归 | 多组件 / 页面级流程 |

推荐分层：纯逻辑 → jsdom 单测；单组件 → Vitest Browser Mode；多页面流程 → Playwright E2E（见「端到端测试」章）。

## headless / headed

```bash
# CI：无头（browser.headless 默认 = process.env.CI）
# 本地调试：有头，看到浏览器窗口
vitest --browser.headless=false
```

VSCode v4 新增 "Debug Test" 按钮，自动以 headed + pause 启动，可在浏览器里设断点。

## v4 import 路径变更

```ts
// v4：统一从 vitest/browser 导入
import { page, userEvent, commands, cdp, server } from "vitest/browser";
// 旧的 @vitest/browser/context 已废弃
```
