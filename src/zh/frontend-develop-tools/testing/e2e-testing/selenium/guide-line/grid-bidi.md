---
layout: doc
outline: [2, 3]
---

# Grid 与 BiDi

> 基于 Selenium 4.x（selenium-webdriver）编写

## 速查

- Selenium Grid：分布式测试，跨机器跨浏览器并行，企业大规模场景
- Grid 4 架构：Router / Distributor / Session Queue / Session Map / Node 组件化
- 连接 Grid：`new Builder().usingServer("http://host:4444/wd/hub").forBrowser("chrome").build()`
- WebDriver BiDi：基于 WebSocket 的**双向**协议，支持事件订阅（区别于单向 WebDriver）
- BiDi 能力：console 日志、JS 异常、网络拦截、认证；Firefox 支持最完整
- Selenium 目标从 CDP 迁向标准 BiDi（CDP 支持是临时方案）

## Selenium Grid（分布式）

Grid 让测试跨多台机器、多浏览器并行执行，是企业级大规模测试基础设施。Grid 4 把经典的 Hub-Node 拆成组件：

```
请求 → Router（入口）
        ├── Distributor（分配会话，维护 Node 注册表）
        ├── Session Queue（排队等待的会话）
        └── Session Map（会话 → Node 映射）
              ↓
        Node ×N（实际跑浏览器的机器）
```

## 连接 Grid（JS）

```js
const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const options = new chrome.Options().addArguments("--headless=new");

const driver = await new Builder()
  .usingServer("http://grid-host:4444/wd/hub") // Grid 地址
  .forBrowser("chrome")
  .setChromeOptions(options)
  .build();
```

## WebDriver BiDi（双向协议）

经典 WebDriver 是单向请求-响应（HTTP），无法主动推送事件；**WebDriver BiDi** 基于 WebSocket 双向通信，支持实时事件订阅。它是跨浏览器标准，Selenium 官方目标是从 CDP 迁移到 BiDi（CDP 支持标记为临时方案）。

```js
// console 日志监听（Firefox 的 BiDi 支持最完整）
const { LogInspector } = require("selenium-webdriver/bidi/logInspector");

const inspector = await LogInspector(driver);
await inspector.onConsoleEntry((log) => {
  console.log(`[${log.method}] ${log.text}`);
});
await inspector.onJavascriptException((log) => {
  console.error(`[JS 异常] ${log.text}`);
});
```

BiDi 模块涵盖：浏览上下文、日志（console / 异常）、网络（拦截 / 认证）、脚本注入、输入模拟——这是 Selenium 现代化、向 Playwright 这类能力靠拢的方向。