---
layout: doc
---

# Cypress

Cypress 是**运行在浏览器内部**的端到端测试框架——测试代码与被测应用跑在同一个事件循环里，因此能直接访问 DOM、网络与运行时。它以「开发者体验」为标杆：可视化 Test Runner、**时间旅行调试**（每步操作前后留快照）、实时重载，配合 `cy` 命令链的**自动重试能力（retry-ability）**大幅减少 flaky test，以及强大的 `cy.intercept` 网络拦截让前端能脱离后端独立测试。本项目 `quiz-app` / `quiz-admin` 的 E2E 套件均基于 Cypress（`^15.x`）。

## 评价

**优点**

- **开发者体验标杆**：可视化 Test Runner + 时间旅行调试 + 实时重载，前端上手极快
- **命令自动重试**：查询与断言内置重试直到通过或超时，免手写等待，flaky 更少
- **浏览器内运行**：与应用同事件循环，DOM / 网络 / 存储访问直接、可控
- **`cy.intercept` 强大**：拦截 / stub / spy 网络请求，配 fixtures 做 Mock API，前端独立测试
- **生态成熟**：自定义命令、`cy.session`、Component Testing、Cypress Cloud（录制 / 并行 / flaky 分析）

**缺点**

- **架构局限**：单测试只能操作一个超域，跨域要 `cy.origin`；不支持多浏览器实例同时、无原生多标签
- **仅 JS/TS**：无法用 Python / Java 等语言写测试（对比 Selenium / Playwright）
- **跨浏览器弱**：Chrome 系一等支持，Firefox 跟随，**Safari/WebKit 仅实验性**
- **并行需付费**：原生并行化依赖 Cypress Cloud 商业服务
- **增长停滞**：满意度与下载量被 Playwright 赶超，2026 退为存量次选

## 文档地址

[Cypress 文档](https://docs.cypress.io)

## GitHub地址

[Cypress](https://github.com/cypress-io/cypress)

## 幻灯片地址

<a href="/SlideStack/cypress-slide/" target="_blank">Cypress</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=cypress" target="_blank" rel="noopener noreferrer">Cypress 测试题</a>
