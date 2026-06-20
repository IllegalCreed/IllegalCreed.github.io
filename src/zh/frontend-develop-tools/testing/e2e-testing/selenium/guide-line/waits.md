---
layout: doc
outline: [2, 3]
---

# 等待策略

> 基于 Selenium 4.x（selenium-webdriver）编写

## 速查

- 隐式等待：`driver.manage().setTimeouts({ implicit: ms })`，全局，找不到元素时轮询
- 显式等待（推荐）：`driver.wait(until.elementLocated(By.x), 超时, 错误信息)`
- `until.*` 条件：`elementLocated` / `elementIsVisible` / `titleContains` / `urlContains` 等
- **绝不混用隐式 + 显式**（超时可能不可预测地叠加）
- **绝不用 sleep**（固定等待脆弱且慢）
- Selenium 需手写等待，是它相对 Playwright/Cypress 自动等待的主要差距

## 隐式等待（Implicit Wait）

全局设置，影响所有 `findElement`——找不到元素时最多轮询等待指定时间，超时才抛异常。默认 0（立即报错）：

```js
await driver.manage().setTimeouts({ implicit: 2000 }); // 全局 2s
```

缺点：全局生效、无法针对特定操作，且与显式等待混用会出问题（见下）。

## 显式等待（Explicit Wait，推荐）

针对**特定条件**等待，更精准可靠：

```js
const { until, By } = require("selenium-webdriver");

// 等元素出现在 DOM
const el = await driver.wait(
  until.elementLocated(By.id("result")),
  5000,
  "等待 #result 超时",
);

// 等元素可见 / 可交互
await driver.wait(until.elementIsVisible(el), 5000);
await driver.wait(until.elementIsEnabled(el), 3000);

// 等标题 / URL
await driver.wait(until.titleContains("成功"), 5000);
await driver.wait(until.urlContains("/dashboard"), 5000);

// 自定义条件（返回布尔的 async 函数）
await driver.wait(async () => {
  const t = await driver.findElement(By.id("status")).getText();
  return t === "已完成";
}, 10000);
```

常用 `until.*`：`elementLocated` / `elementIsVisible` / `elementIsNotVisible` / `elementIsEnabled` / `titleIs` / `titleContains` / `urlIs` / `urlContains` / `alertIsPresent`。

## 别混用隐式 + 显式

::: danger 官方明确警告
同时设置隐式等待 + 显式等待**可能导致不可预测的超时叠加**（如隐式 10s + 显式 15s 可能等到 20s+）。二选一，推荐只用显式等待。
:::

## vs 现代框架自动等待

| 框架 | 等待机制 | 需手写等待 |
| ---- | -------- | ---------- |
| Selenium | 手动（隐式/显式） | 大多数场景需要 |
| Playwright | 内置 auto-wait | 极少 |
| Cypress | 内置重试 | 基本不需要 |

> 需手写等待是 Selenium 与现代框架开发效率差距的核心原因之一。