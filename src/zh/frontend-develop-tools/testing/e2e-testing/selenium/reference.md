---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Selenium 4.x（selenium-webdriver）编写

## 速查

- 启动：`new Builder().forBrowser("chrome").build()`；收尾 `driver.quit()`
- 定位：`driver.findElement(By.css("..."))`，优先 id/css
- 等待：`driver.wait(until.elementLocated(By.x), 5000)`
- 完整说明见 [入门](./getting-started.md) / [定位与交互](./guide-line/locators-interactions.md) / [等待策略](./guide-line/waits.md) / [Grid 与 BiDi](./guide-line/grid-bidi.md) / [最佳实践](./guide-line/best-practices.md)

## WebDriver API

| API | 说明 |
| --- | ---- |
| `new Builder().forBrowser(b).build()` | 创建会话 |
| `driver.get(url)` | 导航 |
| `driver.getTitle()` / `getCurrentUrl()` | 标题 / URL |
| `driver.findElement(By.x)` / `findElements` | 定位单个 / 多个 |
| `driver.wait(cond, timeout)` | 显式等待 |
| `driver.manage().setTimeouts({ implicit })` | 隐式等待 |
| `driver.quit()` / `close()` | 关会话 / 关当前窗口 |

## By 定位器

`By.id` / `By.css` / `By.xpath` / `By.name` / `By.className` / `By.linkText` / `By.partialLinkText` / `By.tagName`

## until 条件

`elementLocated` / `elementIsVisible` / `elementIsNotVisible` / `elementIsEnabled` / `titleIs` / `titleContains` / `urlIs` / `urlContains` / `alertIsPresent`

## 多语言绑定

| 语言 | 包 |
| ---- | -- |
| JavaScript | `npm install selenium-webdriver` |
| Python | `pip install selenium` |
| Java | `org.seleniumhq.selenium:selenium-java` |
| C# | `Selenium.WebDriver`（NuGet） |
| Ruby | `gem install selenium-webdriver` |

## 版本变更

| 版本 | 变更 |
| ---- | ---- |
| 4.0 | 全面切到 W3C WebDriver 标准 |
| 4.6 | **Selenium Manager** 内置，driver 自动下载 |
| 4.11–4.14 | Manager 支持 Chrome for Testing / Firefox / Edge |
| 4.15+ | BiDi Network 模块趋稳（Firefox） |

## 官方资源

- 文档：[https://www.selenium.dev/documentation/](https://www.selenium.dev/documentation/)
- WebDriver：[https://www.selenium.dev/documentation/webdriver/](https://www.selenium.dev/documentation/webdriver/)
- Grid：[https://www.selenium.dev/documentation/grid/](https://www.selenium.dev/documentation/grid/)
- npm：[https://www.npmjs.com/package/selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver)
- GitHub：[https://github.com/SeleniumHQ/selenium](https://github.com/SeleniumHQ/selenium)