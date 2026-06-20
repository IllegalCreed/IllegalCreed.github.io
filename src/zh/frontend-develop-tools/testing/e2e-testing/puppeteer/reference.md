---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Puppeteer v25.x 编写

## 速查

- 启动：`puppeteer.launch({ headless })` → `browser.newPage()` → `page.goto(url)`
- 定位：`page.locator(sel)`（自动等待，推荐）/ `page.$(sel)` / `$$(sel)`（低层）
- 跑 JS：`page.evaluate(fn, ...args)`
- 强项：`page.screenshot()` / `page.pdf()`
- 完整说明见 [入门](./getting-started.md) / [Page 与选择器](./guide-line/page-selectors.md) / [Locator 与交互](./guide-line/locator-interactions.md) / [截图PDF与网络](./guide-line/screenshot-network.md) / [配测试与对比](./guide-line/testing-comparison.md)

## 核心 API

| API | 说明 |
| --- | ---- |
| `puppeteer.launch(opts)` | 启动浏览器 |
| `puppeteer.connect({ browserWSEndpoint })` | 连接已有浏览器 |
| `browser.newPage()` / `createBrowserContext()` | 新 tab / 隔离上下文 |
| `page.goto(url, { waitUntil })` | 导航 |
| `page.locator(sel)` | 自动等待定位器（推荐） |
| `page.$(sel)` / `$$(sel)` | 单/多元素（ElementHandle） |
| `page.$eval` / `$$eval` | 页面上下文取值 |
| `page.evaluate(fn)` | 浏览器上下文跑 JS |
| `page.screenshot(opts)` | 截图 |
| `page.pdf(opts)` | 生成 PDF |
| `page.setRequestInterception(true)` | 启用网络拦截 |
| `page.createCDPSession()` | 原生 CDP 会话 |

## 选择器

CSS / `::-p-xpath(...)` / `::-p-text(...)` / `::-p-aria(...)` / `>>>`（Shadow DOM）

## 截图 / PDF 选项

- screenshot：`path` / `fullPage` / `type`(png/jpeg/webp) / `quality` / `clip` / `omitBackground`
- pdf：`format`(A4...) / `printBackground` / `margin` / `landscape` / `scale`；先 `emulateMediaType("screen")`

## vs 其他框架

| | Puppeteer | Playwright | Cypress |
| --- | --- | --- | --- |
| 类型 | 自动化库 | 测试框架 | 测试框架 |
| runner/断言 | 无（配 Jest） | 内置 | 内置 |
| 浏览器 | Chrome 为主 | 全引擎 | Chrome 系 |

## 官方资源

- 文档：[https://pptr.dev](https://pptr.dev)
- Locators：[https://pptr.dev/guides/locators](https://pptr.dev/guides/locators)
- 网络拦截：[https://pptr.dev/guides/network-interception](https://pptr.dev/guides/network-interception)
- GitHub：[https://github.com/puppeteer/puppeteer](https://github.com/puppeteer/puppeteer)