---
layout: doc
outline: [2, 3]
---

# Web-First 断言

> 基于 Playwright v1.61 编写

## 速查

- web-first 断言：`await expect(locator).toBeVisible()` 自动轮询重试到通过或超时（默认 5s）
- 必须 `await`——漏掉 await 断言会静默失效
- 常用：`toBeVisible` / `toHaveText` / `toHaveValue` / `toBeEnabled` / `toHaveCount` / `toHaveURL`
- soft 断言：`expect.soft(...)` 失败不中断，最终统一标记失败
- 普通 `expect(value).toBe(x)` 同步、不重试，用于纯值比较

## web-first 断言（自动重试）

针对 DOM 的断言会自动轮询，直到满足或超时，消除异步 flakiness：

```ts
import { test, expect } from "@playwright/test";

test("断言示例", async ({ page }) => {
  await page.goto("/");

  // 页面级
  await expect(page).toHaveTitle(/首页/);
  await expect(page).toHaveURL("/dashboard");

  // 可见性（等待出现/消失）
  await expect(page.getByText("欢迎")).toBeVisible();
  await expect(page.getByTestId("loading")).toBeHidden();

  // 文本（等待文本就位）
  await expect(page.getByRole("heading")).toHaveText("用户管理");
  await expect(page.getByRole("status")).toContainText("成功");
});
```

::: warning 必须 await
web-first 断言是异步的，**漏掉 `await` 会静默失效**（断言不会真正等待和校验）。
:::

## 常用断言

| 断言 | 说明 |
| ---- | ---- |
| `toBeVisible` / `toBeHidden` | 可见 / 隐藏 |
| `toHaveText` / `toContainText` | 精确 / 包含文本 |
| `toHaveValue` | 表单值 |
| `toBeEnabled` / `toBeDisabled` | 可用 / 禁用 |
| `toBeChecked` | 勾选状态 |
| `toHaveCount` | 元素数量 |
| `toHaveAttribute` | 属性值 |
| `toContainClass` | 含 class（v1.52+，比 toHaveClass 简洁） |
| `toHaveURL` / `toHaveTitle` | 页面 URL / 标题 |

```ts
await expect(page.getByRole("row")).toHaveCount(5);
await expect(page.getByLabel("用户名")).toHaveValue("admin");
await expect(page.getByRole("button", { name: "提交" })).toBeEnabled();
```

## soft 断言

`expect.soft` 失败后不中断测试，继续执行剩余断言，最终统一标记 test 失败——适合一次校验多个独立点：

```ts
await expect.soft(page.getByTestId("count")).toHaveText("5");
await expect.soft(page.getByTestId("status")).toBeVisible();
// 两个都会执行，任一失败则 test 最终失败
```

## 普通 expect vs web-first

| | `expect(value).toBe(x)` | `await expect(locator).toHaveText(x)` |
| --- | --- | --- |
| 自动重试 | 无 | 有（默认 5s） |
| 同步/异步 | 同步 | 异步（必须 await） |
| 用途 | 纯值 / 逻辑比较 | DOM 状态 / 内容 / 可见性 |