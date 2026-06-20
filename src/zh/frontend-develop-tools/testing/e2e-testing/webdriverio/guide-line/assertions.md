---
layout: doc
outline: [2, 3]
---

# 断言 expect-webdriverio

> 基于 WebdriverIO v9 编写

## 速查

- 内置 `expect-webdriverio`，**web-first 自动重试**（默认 100ms 间隔轮询，最长等待）
- Element：`toBeDisplayed` / `toHaveText` / `toBeEnabled` / `toExist` / `toHaveAttribute`
- Browser：`toHaveUrl` / `toHaveTitle`
- 列表：`toBeElementsArrayOfSize` / `toHaveText([...])`
- 网络：`browser.mock` + `toBeRequested` / `toBeRequestedWith`
- 配重试时长：`before` 钩子里 `setOptions({ wait: 5000 })`

## web-first 断言（自动重试）

断言会自动轮询重试直到满足或超时，消除异步 flakiness：

```ts
import { expect } from "@wdio/globals";

const btn = await $('[data-testid="submit"]');
await expect(btn).toBeDisplayed(); // 等待出现
await expect(btn).toHaveText("提交");
await expect(btn).toBeEnabled();
```

## Element 断言

```ts
await expect($("#el")).toExist(); // 在 DOM
await expect($("#el")).toBeDisplayed(); // 可见
await expect($("#el")).toBeClickable();
await expect($("input")).toBeChecked(); // checkbox/radio
await expect($("h1")).toHaveText("控制台");
await expect($("h1")).toHaveText(expect.stringContaining("控制"));
await expect($("input")).toHaveValue("admin");
await expect($("a")).toHaveAttribute("href", "https://webdriver.io");
await expect($("div")).toHaveElementClass("active");
// 无障碍
await expect($("button")).toHaveComputedRole("button");
await expect($("button")).toHaveComputedLabel("提交表单");
```

## Browser 断言

```ts
await expect(browser).toHaveUrl(expect.stringContaining("/dashboard"));
await expect(browser).toHaveTitle(/webdriverio/i);
```

## 列表与网络断言

```ts
// $$ 数组
const items = await $$("ul > li");
await expect(items).toBeElementsArrayOfSize(5);
await expect(items).toHaveText(["咖啡", "茶", "牛奶"]);

// 网络 mock 断言
const mock = browser.mock("**/api/todo*", { method: "POST" });
await expect(mock).toBeRequested();
await expect(mock).toBeRequestedTimes(2);
```

::: warning v9 破坏性变更
`toHaveTextContaining` 已移除，改用 `toHaveText(expect.stringContaining(...))`。
:::