---
layout: doc
outline: [2, 3]
---

# 最佳实践与对比

> 基于 Selenium 4.x（selenium-webdriver）编写

## 速查

- Page Object：定位器 + 操作封装成页面类，测试只关注业务
- 显式等待优先、绝不 sleep、CSS 优先于 XPath
- 每测试独立 driver：beforeEach 建、afterEach `quit()`；用 finally 防泄漏
- vs 现代框架：标准/跨语言/全浏览器 vs 慢/底层/需手写等待
- 适用：企业 Java/Python 栈、Safari/旧浏览器、存量资产；前端新项目选 Playwright/Cypress

## Page Object 模式

把定位器和页面操作封装进页面类，页面结构变更只改一处：

```js
const { By, until } = require("selenium-webdriver");

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.username = By.id("username");
    this.password = By.id("passwd");
    this.loginBtn = By.css("button[type='submit']");
  }

  async loginAs(user, pass) {
    await this.driver.findElement(this.username).sendKeys(user);
    await this.driver.findElement(this.password).sendKeys(pass);
    await this.driver.findElement(this.loginBtn).click();
    await this.driver.wait(until.urlContains("/dashboard"), 5000);
  }
}
```

## 最佳实践清单

- **显式等待优先**，避免隐式等待，**绝不用 `sleep`**（固定等待脆弱且慢）
- **不混用隐式 + 显式**（超时不可预测）
- **CSS 选择器优先于 XPath**（性能好、不易因 DOM 变化而断）
- **Page Object 模式**：测试与页面细节解耦
- **每测试独立 driver**：`beforeEach` 建、`afterEach` 调 `driver.quit()`，保证隔离
- **`finally` 里 `driver.quit()`**：防测试失败时 driver 进程泄漏
- 用 `driver.quit()` 而非 `driver.close()`（后者只关当前窗口、不释放会话）

## vs Playwright / Cypress / WebdriverIO

| 工具 | 协议 | 速度 | 标准性 |
| ---- | ---- | ---- | ------ |
| Selenium | W3C WebDriver（HTTP） | 慢 | W3C 标准 |
| WebdriverIO | WebDriver / BiDi（封装） | 中 | W3C 标准 |
| Playwright | CDP / 自有协议 | 快 | 非标准 |
| Cypress | 浏览器内运行 | 最快（同域） | 非标准 |

> WebdriverIO 基于 WebDriver/BiDi（更现代的封装）；Playwright 用 CDP 更快但非标准；Cypress 架构完全不同。

## 适用场景

**选 Selenium**：团队主力 Java/Python、需测 Safari 或旧浏览器、存量 Selenium 资产大、需 W3C 标准跨语言协作、已有 Grid 基础设施。

**前端 JS 新项目选 Playwright/Cypress**：只需现代浏览器、追求速度与简洁 API、不需跨语言、要内置自动等待 / 报告 / Mock。