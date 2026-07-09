---
layout: doc
---

# WebdriverIO

WebdriverIO 是 Node.js 生态的**现代 WebDriver / BiDi 测试框架**，由 **OpenJS 基金会托管**（社区中立、非单一商业公司控制）。它基于 W3C WebDriver Classic + WebDriver BiDi 协议——与 Selenium 同属标准阵营，但封装更现代、**内置自动等待**，用 `$` / `$$` 简洁查询、`expect-webdriverio` web-first 断言。最大的差异化在 **Web + Mobile 一体**：通过 Appium 用同一套框架测 iOS / Android 原生 app、混合 app 与移动 Web；还能用 browser runner 跑组件测试（集成 Vitest 语法 + Storybook）。它是「需同时覆盖 Web 与移动端」场景的首选。

## 评价

**优点**

- **Web + Mobile 一体**：通过 Appium 同框架测移动原生 / 混合 app，这是相对 Playwright / Cypress 的独特利基
- **现代 WebDriver / BiDi**：基于标准协议，API 比 Selenium 现代、**命令内置自动等待**
- **简洁查询**：`$(sel)` / `$$(sel)`，链式、支持 CSS / xpath / `aria/` 无障碍名
- **services 生态**：Appium、各云平台（BrowserStack / Sauce Labs）等服务即插即用
- **OpenJS 托管**：社区中立；可跑组件测试（browser runner 集成 Vitest / Storybook）

**缺点**

- **社区规模较小**：stars / 下载量比 Playwright / Cypress 低一个数量级
- **配置较重**：`wdio.conf` + services 体系上手成本高于 Cypress
- **Appium 复杂度**：移动端测试引入额外的 Appium 配置
- **速度**：基于 WebDriver，整体快于 Selenium 但慢于 Playwright（CDP）

## 文档地址

[WebdriverIO 文档](https://webdriver.io)

## GitHub地址

[WebdriverIO](https://github.com/webdriverio/webdriverio)

## 幻灯片地址

<a href="/SlideStack/webdriverio-slide/" target="_blank">WebdriverIO</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=webdriverio" target="_blank" rel="noopener noreferrer">WebdriverIO 测试题</a>
