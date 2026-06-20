---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Puppeteer v25.x 编写

## 速查

- 定位：浏览器**自动化库**（非测试框架，无内置 runner/断言/并行）
- 安装：`puppeteer`（自动下载 Chrome）vs `puppeteer-core`（不下载，需自带）
- 启动：`const browser = await puppeteer.launch({ headless: true })`
- 页面：`const page = await browser.newPage()`；`await page.goto(url)`
- 定位（推荐）：`page.locator(sel)` 自动等待；低层 `page.$(sel)` / `$$(sel)`
- 跑 JS：`page.evaluate(() => ...)` 在浏览器上下文执行
- 强项：`page.screenshot()` / `page.pdf()`
- 收尾：`await browser.close()`

## 安装

```bash
npm i puppeteer        # 自动下载兼容的 Chrome for Testing
npm i puppeteer-core   # 不下载浏览器，需自带（指定 executablePath）
```

`puppeteer` 开箱即用（含 Chrome，约 170-280MB，缓存到 `~/.cache/puppeteer`）；`puppeteer-core` 适合连接远程 / 自带浏览器。

## launch 与第一个脚本

```js
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true, // v21+ 默认新无头（完整 Chrome 无界面）
  args: ["--no-sandbox"], // Linux/CI 常用
});

const page = await browser.newPage();
await page.goto("https://example.com", { waitUntil: "networkidle2" });
await page.screenshot({ path: "out.png", fullPage: true });

await browser.close();
```

> headless：v21 起 `true` = 新无头（与有头同内核）；`"shell"` = 旧的 chrome-headless-shell。

## Browser / Context / Page 模型

```js
const browser = await puppeteer.launch();
const page = await browser.newPage(); // 默认 context

// 隔离 context（独立 cookie/storage，适合多账号）
const ctx = await browser.createBrowserContext();
const page2 = await ctx.newPage();
await ctx.close();

await browser.close();
```

## 自动化库 vs 测试框架（关键边界）

Puppeteer 是**浏览器自动化库**，**没有内置 test runner、断言、并行与报告**。做 E2E 测试必须配外部 runner（如 `jest-puppeteer`）。这是它与 Playwright / Cypress 的根本区别——后两者是完整测试框架。

> 与 Playwright 同源（Playwright 是原 Puppeteer 团队在微软的重写）。新项目做 E2E 测试选 Playwright/Cypress；Puppeteer 更适合爬虫、截图、PDF、自动化脚本。

## 下一步

- [Page 与选择器](./guide-line/page-selectors.md)：导航、`$`/`$$`、`$eval`、`page.evaluate`
- [Locator 与交互](./guide-line/locator-interactions.md)：Locator API 自动等待、交互、等待
- [截图、PDF 与网络](./guide-line/screenshot-network.md)：`screenshot`/`pdf`、网络拦截、反检测
- [配测试与对比](./guide-line/testing-comparison.md)：`jest-puppeteer`、vs Playwright/Cypress、适用场景