---
layout: doc
outline: [2, 3]
---

# 选择器与命令

> 基于 WebdriverIO v9 编写

## 速查

- 查询：`await $(sel)` 单个 / `await $$(sel)` 多个（数组）；链式 `$(a).$(b)`
- 选择器优先级：`aria/名` > 文本（`button=Submit`）> `[data-testid]` > CSS > xpath
- 命令均异步：`await $(sel).click()` / `setValue()` / `getText()`
- **v9 内置自动等待**：交互前自动等元素可见、可滚入、未禁用
- 显式等待补充：`waitForDisplayed` / `waitForClickable` / `browser.waitUntil`
- v9 选择器自动穿透 Shadow DOM（open/closed 均支持）

## $ / $$ 查询

```ts
const btn = await $('button[data-testid="submit"]'); // 单个
const items = await $$("ul > li"); // 多个（数组）

// 链式：从父元素向下查
const addBtn = await $(".row .entry").$("button*=Add");
```

## 选择器类型

| 策略 | 写法 | 推荐 |
| ---- | ---- | ---- |
| 无障碍名 | `$("aria/Submit")` | ✅ 首选（模拟用户） |
| 元素文本 | `$("button=Submit")` | ✅ |
| 链接文本 | `$("=Submit")` / 部分 `$("*=Sub")` | ✅ |
| 测试属性 | `$('[data-testid="x"]')` | ✅ |
| CSS | `$("#id")` / `$(".cls")` | △ 耦合样式 |
| XPath | `$("//div[@id='app']")` | ⚠ 脆弱 |
| React | `browser.react$("MyComp", { props })` | React 专用 |

## 命令与交互

```ts
await browser.url("/dashboard"); // 导航（相对 baseUrl）
await $("#btn").click();
await $('input[name="email"]').setValue("a@test.com");
await $("input").addValue(" more"); // 追加不清空
await $("select").selectByVisibleText("选项 A");

const text = await $(".title").getText();
const href = await $("a").getAttribute("href");
```

> 所有命令都是异步的，必须 `await`。

## 自动等待（内置 + 显式）

v9 在执行 click / setValue 等交互前**自动等待元素可交互**（可见、可滚入视口、未禁用），无需手写等待：

```ts
// v9：自动等 button 从 disabled 变 enabled
await $('button[type="submit"]').click();
```

需要时用显式等待补充：

```ts
await $("#content").waitForDisplayed({ timeout: 5000 });
await $("#btn").waitForClickable();
await browser.waitUntil(
  async () => (await $(".status").getText()) === "完成",
  { timeout: 10000, timeoutMsg: "状态未变为完成" },
);
```

> 默认超时由 `waitforTimeout`（默认 10000ms）控制；WebDriver 隐式等待不推荐用。