---
layout: doc
outline: [2, 3]
---

# 命令与重试能力

> 基于 Cypress v15.x 编写

## 速查

- 三类命令：**Queries**（查询，重试）/ **Assertions**（断言，重试）/ **Non-queries**（动作，不重试）
- 重试：断言失败时从**链顶**重跑所有 Query，直到通过或超时（`defaultCommandTimeout` 默认 4s）
- 别用 `const` 存命令结果；用 `.as()` 别名或 `.then()` 解包
- 动作（`click`/`type`）独立成行，query + assertion 自成一链
- 选择器优先 `[data-cy="..."]`，别依赖 CSS class / ID / 文本
- 单命令超时：`cy.get(sel, { timeout: 10000 })`

## 命令的三种类型

| 类型 | 是否重试 | 例子 |
| ---- | -------- | ---- |
| Queries（查询） | ✅ 整链重试 | `cy.get` / `cy.contains` / `.find` / `.eq` |
| Assertions（断言） | ✅ | `.should` / `.and` |
| Non-queries（动作） | ❌ 只执行一次 | `.click` / `.type` / `.submit` |

## 重试能力（retry-ability）

这是 Cypress 减少 flaky 的核心：

```ts
cy.get(".todo-list") // Query
  .find("li") // Query
  .should("have.length", 1); // Assertion：不满足则从 cy.get 重跑整链
```

断言失败时，Cypress 从**链顶**重新执行所有 Query（间隔约 50ms），直到通过或超过超时（默认 4s）。所以**不用手写 `cy.wait(固定时间)`**。

## 三大使用陷阱

```ts
// 陷阱 1：用变量存命令结果（命令异步入队，非立即执行）
const btn = cy.get("button"); // ❌ btn 是 Chainable
// ✅ 用别名
cy.get("button").as("btn");
cy.get("@btn").click();
```

```ts
// 陷阱 2：动作后跟断言会断开 query 重试
cy.get(".input").type("A{enter}").should("have.class", "active"); // ❌
// ✅ 动作独立成行，query + 断言自成链
cy.get(".input").type("A{enter}");
cy.get(".input").should("have.class", "active");
```

```ts
// 陷阱 3：.then() 打断重试（then 内不重试）
cy.get('[data-cy="count"]').invoke("text").then(parseFloat).should("be.gte", 1); // ❌
// ✅ 用 .should(callback) 整体可重试
cy.get('[data-cy="count"]').should(($el) => {
  expect(parseFloat($el.text())).to.be.gte(1);
});
```

## 选择器与 data-cy

官方强烈推荐用专用测试属性，**不依赖 CSS / ID / 文本**：

```ts
cy.get('[data-cy="submit-btn"]').click();
```

| 选择方式 | 推荐 | 原因 |
| -------- | ---- | ---- |
| `cy.get("button")` | ✗ | 太泛、无语义 |
| `cy.get(".btn-primary")` | ✗ | 耦合 CSS |
| `cy.contains("提交")` | △ | 文本变更即失败 |
| `cy.get('[data-cy="submit"]')` | ✓ | 稳定、语义清晰 |

常用查询：`cy.get` / `cy.contains` / `.find` / `.within` / `.first` / `.eq(n)` / `.filter`。

## 交互与断言

```ts
// 交互（Non-query，不重试）
cy.get('[data-cy="input"]').type("hello{enter}");
cy.get('[data-cy="input"]').clear();
cy.get('[data-cy="checkbox"]').check();
cy.get('[data-cy="select"]').select("选项文字");

// 断言（隐式 .should，自动重试）
cy.get('[data-cy="title"]').should("be.visible").and("have.text", "首页");

// 显式断言（expect，用于非 DOM 值）
cy.get("@resp").then((r) => {
  expect(r.status).to.equal(200);
});
```

常用断言：`be.visible` / `not.exist` / `have.text` / `contain` / `have.value` / `have.class` / `have.attr` / `have.length` / `be.disabled` / `be.checked`。