---
layout: doc
outline: [2, 3]
---

# 交互与断言

> 基于 Vitest v4.x（Browser Mode）编写

## 速查

- 交互：`import { userEvent } from "vitest/browser"`，由 CDP / WebDriver 驱动**真实事件**
- 两种风格：`userEvent.click(el)` 或 `el.click()`（链式，更简洁）
- 输入：`fill`（快速设值）/ `type`（逐键 + 特殊键）/ `clear`
- 断言：`await expect.element(locator).toBeVisible()`——**内置重试**
- 常用 matcher：`toBeVisible` / `toBeDisabled` / `toBeChecked` / `toHaveText` / `toHaveValue` / `toHaveClass`

## userEvent

底层由真实浏览器驱动（不是模拟事件）。两种等价风格：

```ts
import { page, userEvent } from "vitest/browser";

// 函数风格
await userEvent.click(page.getByRole("button", { name: "Submit" }));
// 链式风格（推荐，更简洁）
await page.getByRole("button", { name: "Submit" }).click();
```

常用 API：

```ts
// 点击
await userEvent.click(el, { modifiers: ["Shift"] });
await userEvent.dblClick(el);
await userEvent.tripleClick(el); // 三连击常用于全选文本

// 输入
await userEvent.fill(input, "hello"); // 快速设值，不触发每个按键
await userEvent.type(input, "{Shift}Hello"); // 逐键 + 特殊键语法
await userEvent.clear(input);

// 键盘
await userEvent.keyboard("{Control}a"); // 全选
await userEvent.tab(); // Tab 导航；{ shift: true } 反向

// 鼠标 / 选择 / 上传 / 拖放
await userEvent.hover(el);
await userEvent.selectOptions(select, ["选项1", "选项2"]);
await userEvent.upload(input, new File(["x"], "a.png", { type: "image/png" }));
await source.dropTo(target); // 拖放（需 draggable，preview provider 不支持）
```

::: tip fill 还是 type
`fill` 直接设值、快、不触发逐个按键事件；`type` 逐键模拟、支持 `{Shift}`/`{Control}` 等特殊键、触发完整键盘事件链。一般填表用 `fill`，要测键盘交互用 `type` / `keyboard`。
:::

## expect.element 与重试

Browser Mode 的断言用 `expect.element(locator)`，**内置重试**——等待条件满足、超时才失败，免去手动 `nextTick` / `waitFor`：

```ts
// ✅ 带重试（推荐）
await expect.element(locator).toBeVisible();
// 可配超时
await expect.element(locator, { timeout: 3000, interval: 100 }).toBeVisible();

// ⚠️ 不带 await 则立即判断、无重试，不推荐
```

## 常用 matcher

```ts
// 可见性 / 视口
await expect.element(el).toBeVisible();
await expect.element(el).toBeInViewport(); // v4，支持 ratio：toBeInViewport(0.5)
await expect.element(el).toBeInTheDocument();

// 表单状态
await expect.element(el).toBeDisabled();
await expect.element(el).toBeChecked();
await expect.element(el).toHaveFocus();
await expect.element(el).toBeRequired();

// 内容 / 属性
await expect.element(el).toHaveTextContent(/hello/i);
await expect.element(el).toHaveValue("Alice");
await expect.element(el).toHaveClass("btn", "btn--primary");
await expect.element(el).toHaveAttribute("href", "/about");

// 无障碍
await expect.element(el).toHaveRole("button");
await expect.element(el).toHaveAccessibleName("提交");
```

::: tip TypeScript
在测试文件加 `/// <reference types="vitest/browser" />` 获得 `expect.element` 的 matcher 类型。
:::

`render` 返回值还带 `emitted()`（读组件事件）、`rerender(props)`、`unmount()`。视觉回归 `toMatchScreenshot` 见 [视觉回归与对比](./visual-vs-jsdom.md)。
