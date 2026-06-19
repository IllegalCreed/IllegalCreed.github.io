---
layout: doc
outline: [2, 3]
---

# Locators

> 基于 Vitest v4.x（Browser Mode）编写

## 速查

- 来源：`import { page } from "vitest/browser"`，或 `render()` 返回的 screen
- 语义查询：`getByRole` > `getByLabelText` > `getByPlaceholder` > `getByText` > `getByAltText` > `getByTitle` > `getByTestId`
- 特性：**惰性**（用时才查）、**自动重试**、**可链式**
- 链式：`.nth(0)` / `.first()` / `.last()` / `.filter({ hasText })` / `.and()` / `.or()`
- iframe：`page.frameLocator(...)`（仅 Playwright）

## 三大特性

1. **惰性（lazy）**：创建 locator 时不立即查 DOM，只在交互 / 断言时查找——避免竞态。
2. **自动重试**：交互和断言会在超时前不断重试，无需手写 `nextTick` / `waitFor`。
3. **可链式**：`getByRole("list").getByRole("listitem").nth(0)`。

## 语义查询 API

```ts
import { page } from "vitest/browser";

// ARIA 角色（首选，语义最强）
page.getByRole("button", { name: /submit/i });
page.getByRole("textbox", { name: "用户名" });
page.getByRole("heading", { level: 1 });
page.getByRole("checkbox", { checked: true });

// 表单标签
page.getByLabelText("邮箱");

// 文本 / placeholder / alt / title
page.getByText("Hello", { exact: true });
page.getByPlaceholder("请输入姓名");
page.getByAltText(/logo/i);
page.getByTitle("关闭");

// data-testid（最后手段）
page.getByTestId("submit-btn");
```

优先级与 Testing Library 一致：`getByRole` 最高、`getByTestId` 兜底。

## 链式、过滤、组合

```ts
// 位置选择
page.getByRole("listitem").nth(0); // 零基索引
page.getByRole("listitem").first();
page.getByRole("listitem").last();

// filter（类似 within）
page
  .getByRole("article")
  .filter({ hasText: "Vitest" })
  .getByRole("button", { name: "Edit" });

// 逻辑组合
page.getByRole("button").and(page.getByText("Submit"));
page.getByRole("textbox").or(page.getByRole("searchbox"));
```

## iframe

仅 Playwright provider 支持 `frameLocator`：

```ts
const frame = page.frameLocator(page.getByTestId("my-iframe"));
await frame.getByRole("button").click();
```

## 直接访问 DOM 元素

需要原生元素时：

```ts
const el = locator.element(); // 同步，无匹配抛错
const maybe = locator.query(); // 同步，无匹配返回 null
const all = locator.elements(); // 同步，返回数组
const found = await locator.findElement(); // 异步，等待出现（v4.1+）
locator.length; // 等价 elements().length
```

交互（`click` / `fill` 等）与断言（`expect.element`）见 [交互与断言](./interactivity.md)。
