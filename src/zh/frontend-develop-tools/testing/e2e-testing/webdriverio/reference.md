---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 WebdriverIO v9 编写

## 速查

- 查询：`await $(sel)` / `await $$(sel)`，优先 `aria/名`、文本选择器
- 交互：`.click()` / `.setValue()`，内置自动等待
- 断言：`await expect($(sel)).toBeDisplayed()`（web-first）
- 配置：`wdio.conf.ts` 的 capabilities / services / framework
- 完整说明见 [入门](./getting-started.md) / [选择器与命令](./guide-line/selectors-commands.md) / [断言](./guide-line/assertions.md) / [配置与 services](./guide-line/config-services.md) / [Appium 与组件测试](./guide-line/appium-component.md)

## $ / $$ 与选择器

| 写法 | 说明 |
| ---- | ---- |
| `$(sel)` / `$$(sel)` | 单个 / 多个 |
| `$("aria/名")` | 无障碍名（首选） |
| `$("button=文本")` | 元素文本 |
| `$("=链接")` / `$("*=部分")` | 链接文本 |
| `$("~accId")` | 移动 Accessibility ID |
| `browser.react$("Comp")` | React 组件 |

## 命令

`browser.url` / `$.click` / `$.setValue` / `$.addValue` / `$.getText` / `$.getAttribute` / `$.selectByVisibleText` / `$.waitForDisplayed` / `browser.waitUntil`

## 断言

`toExist` / `toBeDisplayed` / `toBeEnabled` / `toBeClickable` / `toBeChecked` / `toHaveText` / `toHaveValue` / `toHaveAttribute` / `toHaveElementClass` / `toBeElementsArrayOfSize` / `toHaveUrl` / `toHaveTitle`

## 常用配置项

| 字段 | 说明 |
| ---- | ---- |
| `capabilities` | 浏览器/设备 |
| `services` | 生命周期插件 |
| `framework` | mocha/jasmine/cucumber |
| `reporters` | spec/allure/junit |
| `specs` | 测试文件 glob |
| `maxInstances` | 并发数 |
| `waitforTimeout` | 默认等待超时 |

## v9 新特性

| 特性 | 说明 |
| ---- | ---- |
| BiDi 默认 | 所有会话默认启用 WebDriver BiDi |
| 自动等待可交互 | click/setValue 前自动等元素可交互 |
| Shadow DOM 穿透 | 选择器自动穿透 open/closed shadow root |
| `emulate` | 设备/时钟模拟 |
| tsx 编译 | 替代 ts-node |

## 官方资源

- 文档：[https://webdriver.io](https://webdriver.io)
- 选择器：[https://webdriver.io/docs/selectors](https://webdriver.io/docs/selectors)
- 配置：[https://webdriver.io/docs/configuration](https://webdriver.io/docs/configuration)
- Appium：[https://webdriver.io/docs/api/appium](https://webdriver.io/docs/api/appium)
- GitHub：[https://github.com/webdriverio/webdriverio](https://github.com/webdriverio/webdriverio)