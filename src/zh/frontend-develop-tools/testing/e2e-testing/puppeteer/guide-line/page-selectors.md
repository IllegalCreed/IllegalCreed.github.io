---
layout: doc
outline: [2, 3]
---

# Page 与选择器

> 基于 Puppeteer v25.x 编写

## 速查

- 导航：`page.goto(url, { waitUntil })`（load/domcontentloaded/networkidle0/networkidle2）
- 低层选择：`page.$(css)` 单个 / `page.$$(css)` 多个（ElementHandle）
- 取值：`page.$eval(sel, el => ...)` / `page.$$eval(sel, els => ...)`
- 扩展选择器：`::-p-xpath(...)` / `::-p-text(...)` / `::-p-aria(...)` / `>>>` shadow 穿透
- `page.evaluate(fn, ...args)`：在**浏览器上下文**跑 JS，结果序列化回 Node
- ElementHandle 用完要 `.dispose()` 防泄漏（Locator 自动管理）

## 导航

```js
// waitUntil: load | domcontentloaded | networkidle0 | networkidle2
await page.goto("https://example.com", { waitUntil: "networkidle2" });

// 点击触发跳转时，等导航完成
await Promise.all([page.waitForNavigation(), page.click("a#next")]);
```

## $ / $$ 选择器 + $eval

```js
const btn = await page.$("button.submit"); // 单个 ElementHandle | null
const items = await page.$$("ul > li"); // 多个

// 在页面上下文对元素取值（直接返回序列化结果）
const title = await page.$eval(".titleline > a", (el) => el.textContent);
const all = await page.$$eval("a", (els) => els.map((a) => a.href));
```

## 扩展选择器

Puppeteer 的 `::-p-` 伪选择器扩展 CSS：

```js
await page.$("::-p-xpath(//button[@data-id='1'])"); // XPath
await page.$("::-p-text(提交)"); // 文本
await page.$("::-p-aria(Submit button)"); // ARIA label
await page.$("div >>> .shadow-child"); // 穿透 Shadow DOM
```

## page.evaluate（两个上下文）

`page.evaluate` 在**浏览器上下文**执行 JS，结果序列化后返回 **Node 上下文**。两个上下文隔离——函数不能闭包引用 Node 变量，只能通过参数传：

```js
// 在页面里抓数据
const quotes = await page.evaluate(() =>
  [...document.querySelectorAll(".quote")].map((q) => q.textContent),
);

// 传参（必须可序列化）
const sel = ".price";
const price = await page.evaluate(
  (s) => document.querySelector(s)?.textContent,
  sel,
);

// 每个新页面加载前注入（如反检测）
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
});
```