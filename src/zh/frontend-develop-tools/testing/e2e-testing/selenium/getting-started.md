---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Selenium 4.x（selenium-webdriver npm）编写

## 速查

- 安装：`npm install selenium-webdriver`；**Selenium Manager（4.6+）自动下载匹配 driver**，免手动管理
- 启动：`const driver = await new Builder().forBrowser("chrome").build()`
- 导航：`await driver.get(url)`；标题 `driver.getTitle()`
- 定位：`driver.findElement(By.css("..."))`，优先 `By.id` / `By.css`
- 交互：`el.sendKeys(text)` / `el.click()` / `el.getText()`
- 等待：显式 `driver.wait(until.elementLocated(By.x), 5000)`，优先于隐式
- 收尾：**必须 `await driver.quit()`** 释放浏览器 + driver 进程

## 安装

```bash
npm install selenium-webdriver
```

Selenium 4.6+ 内置 **Selenium Manager**——启动时自动检测浏览器版本、下载匹配的 chromedriver / geckodriver 等并缓存，**无需再手动管理 driver 版本**（这是 4.x 最重要的 DX 改进）。

## 第一个测试

```js
const { Builder, Browser } = require("selenium-webdriver");

(async function firstTest() {
  let driver;
  try {
    // Builder 创建 WebDriver 会话（Selenium Manager 自动备好 driver）
    driver = await new Builder().forBrowser(Browser.CHROME).build();

    await driver.get("https://www.example.com");
    const title = await driver.getTitle();
    console.log(title); // "Example Domain"
  } finally {
    await driver.quit(); // 必须释放资源
  }
})();
```

## WebDriver 通信模型

Selenium **在浏览器外部**通过 WebDriver 协议（W3C 标准，HTTP/JSON）控制浏览器：

```
测试代码 → 语言绑定 → WebDriver HTTP 协议 → 浏览器驱动 → 浏览器
```

每个命令（定位、点击、截图）都是一次 HTTP 往返到驱动进程——这带来标准性与跨语言能力，但也是它**比 Playwright（CDP）/ Cypress（浏览器内）慢**的根因。

## 下一步

- [定位与交互](./guide-line/locators-interactions.md)：8 种 `By` 定位器、`findElement(s)`、元素操作
- [等待策略](./guide-line/waits.md)：隐式 vs 显式等待、`until.*` 条件、混用警告
- [Grid 与 BiDi](./guide-line/grid-bidi.md)：分布式并行、WebDriver BiDi 双向协议
- [最佳实践与对比](./guide-line/best-practices.md)：Page Object、vs 现代框架、适用场景