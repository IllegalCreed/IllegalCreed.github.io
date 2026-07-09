---
layout: doc
---

# Playwright

Playwright 是微软出品的跨浏览器端到端测试框架——**一套 API 同时驱动 Chromium、Firefox、WebKit 三大引擎**（真正覆盖 Safari），并支持 TS/JS/Python/Java/.NET 多语言。它以**语义化 Locator**（`getByRole` 等无障碍优先查询）+ **auto-wait**（动作前自动等待元素可交互）+ **web-first 断言**（`expect(locator)` 自动重试）大幅降低 flaky，配合杀手级 **Trace Viewer**（时间轴 + DOM 快照 + 网络回放）、codegen 录制、UI Mode 与**内置免费并行**，是 2026 年满意度第一、增长最快的 E2E 主流选择。

## 评价

**优点**

- **真跨浏览器**：Chromium / Firefox / WebKit 三引擎一等支持，覆盖 Safari，`projects` 矩阵一键多浏览器
- **多语言**：TS/JS/Python/Java/.NET，不局限前端技术栈
- **auto-wait + web-first 断言**：动作自动等可操作性、断言自动重试，flaky 少且免手写等待
- **语义 Locator**：`getByRole` / `getByLabel` 等无障碍优先，稳定且贴近用户
- **顶级调试**：Trace Viewer（事后时间旅行）、codegen 录制、UI Mode 可视化
- **内置免费并行**：worker 进程并行 + sharding，无需付费服务

**缺点**

- **包体积大**：每次装浏览器二进制（数百 MB），CI 需 `install --with-deps`
- **学习曲线略陡**：相比 Cypress 的即时可视化 DX，上手稍重
- **组件测试不成熟**：`experimental-ct-*` 仍实验性，不如 Cypress Component Testing 稳定
- **生态较新**：虽高速增长，部分细分插件仍少于 Cypress 老生态

## 文档地址

[Playwright 文档](https://playwright.dev)

## GitHub地址

[Playwright](https://github.com/microsoft/playwright)

## 幻灯片地址

<a href="/SlideStack/playwright-slide/" target="_blank">Playwright</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=playwright" target="_blank" rel="noopener noreferrer">Playwright 测试题</a>
