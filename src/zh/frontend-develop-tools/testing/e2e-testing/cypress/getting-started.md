---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Cypress v15.x 编写

## 速查

- 安装：`pnpm add -D cypress` → `npx cypress open`（配置向导）
- 配置：`cypress.config.ts` 的 `e2e.baseUrl` / `specPattern` / `setupNodeEvents`
- 结构：`describe` / `it` + `beforeEach` + `cy.visit("/")`
- 命令异步入队：`cy.get(...).click()` 链式，**不能用 `const` 存返回值**
- 查询自动重试：`cy.get` / `.should` 重试到通过或超时（默认 4s）
- 选择器：用 `[data-cy="..."]`，别依赖 CSS / 文本
- 网络：`cy.intercept(...).as("x")` + `cy.wait("@x")`
- 跑：`npx cypress run`（CI 无头）/ `npx cypress open`（可视化调试）

## Cypress 是什么

Cypress 把测试代码**跑在浏览器内部**，与被测应用同一个事件循环——不像 Selenium 在浏览器外通过协议远程控制。这带来两个核心好处：

- **直接访问** DOM / 网络 / 存储，无序列化开销
- **自动等待 + 重试**：查询与断言内置重试，免手写 `sleep`

代价是架构受限（仅 JS/TS、单浏览器实例、跨域要 `cy.origin`），详见[最佳实践与局限](./guide-line/best-practices.md)。

## 安装与配置

```bash
pnpm add -D cypress
npx cypress open   # 首次进配置向导，自动建目录
```

```ts
// cypress.config.ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:10000", // cy.visit("/") 的前缀
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on, config) {
      // 注册 Node 端事件（task 等）
      return config;
    },
  },
});
```

> 配置文件自 v10 起从 `cypress.json` 改为 `cypress.config.{js,ts}`；v15 默认 `video: false`、`testIsolation: true`（每测试清 cookie/localStorage）。

## 第一个 E2E 测试

```ts
// cypress/e2e/login.cy.ts
describe("登录功能", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("正确凭据可以登录", () => {
    cy.get('[data-cy="username"]').type("admin");
    cy.get('[data-cy="password"]').type("secret");
    cy.get('[data-cy="login-btn"]').click();
    cy.url().should("include", "/dashboard");
  });
});
```

## 命令是异步入队的（关键认知）

`cy` 命令**不是立即执行**，而是排进队列依次跑。所以不能像同步代码那样用变量接返回值：

```ts
// ❌ 错：btn 是 Chainable，不是 DOM 元素
const btn = cy.get("button");
btn.click();

// ✅ 对：用别名或 .then()
cy.get("button").as("btn");
cy.get("@btn").click();
```

理解这一点是用好 Cypress 的前提，详见[命令与重试](./guide-line/commands-retry.md)。

## 下一步

- [命令与重试](./guide-line/commands-retry.md)：三类命令、retry-ability、选择器、交互、断言
- [网络拦截](./guide-line/network-intercept.md)：`cy.intercept`、fixtures、别名、`cy.wait`
- [自定义命令与会话](./guide-line/custom-commands-session.md)：`Cypress.Commands.add`、`cy.session`、`cy.origin`
- [组件测试](./guide-line/component-testing.md)：挂载 Vue 组件、事件 spy
- [最佳实践与局限](./guide-line/best-practices.md)：架构 Trade-offs、反模式、vs Playwright、CI