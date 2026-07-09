---
layout: doc
---

# Vitest Browser Mode

Vitest v4 转正（脱离 experimental）的「在真实浏览器里跑测试」能力。它用 Playwright / WebdriverIO 驱动真实的 Chromium / Firefox / WebKit，取代 jsdom / happy-dom 的 DOM 模拟——配合 `vitest-browser-vue` 的 `render`、语义化 `locator` 查询、真实 `userEvent` 交互、内置重试的 `expect.element` 断言，以及 v4 新增的 `toMatchScreenshot` 视觉回归，在最接近用户的环境里测组件。

## 评价

**优点**

- **真实浏览器**：真实渲染 / CSS 布局 / 浏览器 API，置信度最高，规避 jsdom 的假阳 / 假阴
- **与 Vite 同源**：复用 `vite.config`，配置比独立 Playwright CT 轻
- **语义 locator + 自动重试**：`getByRole` 等惰性查询，交互与断言内置重试，免手写 `nextTick`
- **多浏览器并行**：`browser.instances` 共享一个 Vite server 同时跑 chromium / firefox / webkit
- **视觉回归**：内置 `toMatchScreenshot`，失败自动截图

**缺点**

- **更慢更重**：要启动真实浏览器进程，比 jsdom 慢，CI 需安装浏览器
- **v4 破坏性变更**：provider 拆成独立包、import 路径迁到 `vitest/browser`
- **不替代纯逻辑单测**：无 DOM 的工具函数用 jsdom 更快，二者应并存
- **与 Playwright CT 有边界**：页面级复杂流程仍更适合 Playwright E2E

## 文档地址

[Vitest Browser Mode](https://vitest.dev/guide/browser/)

## GitHub地址

[Vitest](https://github.com/vitest-dev/vitest)

## 幻灯片地址

<a href="/SlideStack/vitest-browser-mode-slide/" target="_blank">Vitest Browser Mode</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vitest-browser-mode" target="_blank" rel="noopener noreferrer">Vitest Browser Mode 测试题</a>
