---
layout: doc
outline: [2, 3]
---

# Locator 与交互

> 基于 Puppeteer v25.x 编写

## 速查

- Locator API（v20+ 推荐）：`page.locator(sel)`，**自动等待**元素可见/enabled/位置稳定
- 交互：`locator.click()` / `fill(v)` / `hover()` / `scroll()` / `wait()`
- 函数 locator：`page.locator(() => 条件)` 等待任意条件
- 过滤/超时：`.filter(fn)` / `.setTimeout(ms)`
- 低层等待：`page.waitForSelector` / `waitForFunction`（需手动管理 ElementHandle）

## Locator API（自动等待）

Locator 是 v20 引入的现代 API，操作前**自动等待前置条件**：元素在视口内、可见、enabled、位置稳定（连续两帧不动）。优先用它，免手写等待：

```js
await page.locator("input[name='email']").fill("user@example.com");
await page.locator("button[type='submit']").click();
await page.locator(".dashboard-title").wait(); // 等待可见
```

## 交互

```js
await page.locator("#btn").click();
await page.locator("input").fill("文本"); // 自动清空再输入
await page.locator("nav").hover();
await page.locator(".content").scroll({ scrollTop: 300 });
```

## 函数 locator + 过滤 + 超时

```js
// 函数 locator：等待任意自定义条件
const ids = await page
  .locator(() => {
    const els = document.querySelectorAll(".product-card");
    if (els.length > 0) return [...els].map((el) => el.dataset.id);
  })
  .wait();

// 过滤 + 自定义超时
await page
  .locator("li")
  .filter((el) => el.textContent.includes("目标"))
  .click();
await page.locator(".slow").setTimeout(10000).click();
```

## 低层等待

Locator 之前的低层 API（需手动管理 ElementHandle 生命周期）：

```js
// 等元素出现（返回 ElementHandle，用完 dispose）
await page.waitForSelector(".result", { visible: true, timeout: 5000 });

// 等自定义条件（页面上下文轮询）
await page.waitForFunction(
  () => document.querySelectorAll(".item").length >= 10,
);
```

> Locator 自动管理元素生命周期、内置重试，比 `waitForSelector` + `ElementHandle` 更安全，应优先使用。