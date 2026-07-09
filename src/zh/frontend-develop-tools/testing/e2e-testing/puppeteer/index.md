---
layout: doc
---

# Puppeteer

Puppeteer 是 Google 出品的 Node.js **浏览器自动化库**——注意它**不是测试框架**：没有内置 test runner、断言、并行与报告。它通过 **CDP（Chrome DevTools Protocol）**直接、底层地控制 Chrome / Chromium（也支持 Firefox），对 CDP 的控制力最强；用 `page` API 操作页面、`page.evaluate` 在页面上下文跑 JS，并以强大的 `screenshot` / `pdf` 生成著称，常用于爬虫、自动化脚本、截图与 PDF。它与 **Playwright 同源**（Playwright 是原 Puppeteer 核心团队转到微软后的重写），但 Playwright 是完整测试框架 + 跨浏览器，Puppeteer 偏 Chrome 自动化。做 E2E 测试需配 `jest-puppeteer` 等外部 runner；新项目做测试几乎无理由选它，但 Chrome 爬虫 / 截图 / PDF 追求最小依赖时仍有位置。

## 评价

**优点**

- **CDP 控制最直接**：对 Chrome DevTools Protocol 的底层控制力最强
- **截图 / PDF 强项**：`page.pdf` / `page.screenshot` 是最常用、最被认可的能力
- **爬虫 / 自动化轻量首选**：抓取、表单自动化、`puppeteer-extra` + stealth 规避检测
- **Google 官方**：与 Chrome 同步迭代；现代 **Locator API**（v20+）带自动等待
- **生态丰富**：插件与社区资源充足

**缺点**

- **不是测试框架**：无内置 runner / 断言 / 并行，做 E2E 测试须配 Jest（`jest-puppeteer`）等
- **浏览器窄**：以 Chrome / Chromium 为主，Firefox 支持有限，无 WebKit / Safari
- **测试领域被替代**：被同团队的 Playwright（完整测试框架 + 跨浏览器）在 E2E 领域取代
- **E2E 定位弱**：新项目做测试应选 Playwright / Cypress，Puppeteer 更适合自动化脚本

## 文档地址

[Puppeteer 文档](https://pptr.dev)

## GitHub地址

[Puppeteer](https://github.com/puppeteer/puppeteer)

## 幻灯片地址

<a href="/SlideStack/puppeteer-slide/" target="_blank">Puppeteer</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=puppeteer" target="_blank" rel="noopener noreferrer">Puppeteer 测试题</a>
