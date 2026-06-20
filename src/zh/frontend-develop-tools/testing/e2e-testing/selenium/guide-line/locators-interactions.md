---
layout: doc
outline: [2, 3]
---

# 定位与交互

> 基于 Selenium 4.x（selenium-webdriver）编写

## 速查

- 定位：`driver.findElement(By.x)` 单个（找不到抛异常）/ `findElements` 多个（返回数组）
- 8 种 `By`：`id` / `css` / `xpath` / `name` / `className` / `linkText` / `partialLinkText` / `tagName`
- 优先级：`By.id` > `By.css` > 慎用 `By.xpath`
- 交互：`sendKeys` / `click` / `clear` / `getText` / `getAttribute`
- 范围查询：在父元素上 `.findElements(By.x)` 缩小作用域

## By 定位器

```js
const { By, Key } = require("selenium-webdriver");

await driver.findElement(By.id("username")); // 最可靠（id 唯一）
await driver.findElement(By.css("button[type='submit']")); // 推荐，快且强
await driver.findElement(By.xpath("//button[text()='登录']")); // 强但脆弱，慎用
await driver.findElement(By.name("newsletter")); // 表单 name
await driver.findElement(By.linkText("官网")); // 精确链接文本
await driver.findElements(By.tagName("a")); // 多个，常配 findElements
```

## findElement vs findElements

```js
// 单个：找不到抛 NoSuchElementException
const el = await driver.findElement(By.css(".item"));

// 多个：找不到返回空数组，不抛异常
const items = await driver.findElements(By.css(".item"));
for (const item of items) console.log(await item.getText());

// 在父元素范围内搜索（缩小作用域）
const container = await driver.findElement(By.css("div.container"));
const children = await container.findElements(By.css("p"));
```

## 元素交互

```js
const input = await driver.findElement(By.name("username"));

await input.sendKeys("Alice"); // 输入文本
await input.sendKeys(Key.RETURN); // 特殊键（回车）
await input.clear(); // 清空

// 点击（Selenium 会先把元素滚动进视口）
await driver.findElement(By.css("button[type='submit']")).click();

const text = await driver.findElement(By.id("msg")).getText(); // innerText
const href = await driver.findElement(By.css("a")).getAttribute("href"); // 属性

const enabled = await input.isEnabled(); // 是否可交互
const visible = await input.isDisplayed(); // 是否可见
```

常用交互：`sendKeys` / `click` / `clear` / `submit` / `getText` / `getAttribute` / `getCssValue` / `isEnabled` / `isSelected` / `isDisplayed`。

## 定位器选择建议

| 优先级 | 策略 | 理由 |
| ------ | ---- | ---- |
| 首选 | `By.id` | 唯一、语义清晰 |
| 次选 | `By.css` | 性能好、表达力强、浏览器原生 |
| 慎用 | `By.xpath` | 强依赖 DOM 结构，重构易断 |
| 避免 | 单独 `By.className` | 多 class 时语义模糊 |