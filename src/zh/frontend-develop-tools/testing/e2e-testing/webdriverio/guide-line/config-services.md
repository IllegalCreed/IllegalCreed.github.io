---
layout: doc
outline: [2, 3]
---

# 配置与 services

> 基于 WebdriverIO v9 编写

## 速查

- `wdio.conf.ts` 核心：`capabilities` / `framework` / `services` / `reporters` / `specs` / `baseUrl`
- 并发：`maxInstances`；超时：`waitforTimeout`
- framework：`mocha` / `jasmine` / `cucumber`
- services：`chromedriver` / `@wdio/appium-service` / 云平台（BrowserStack/Sauce）
- reporters：`spec` / `allure` / `junit`
- hooks：`onPrepare` / `before` / `beforeTest` / `after` / `onComplete`

## wdio.conf 核心字段

```ts
export const config: WebdriverIO.Config = {
  runner: "local",
  specs: ["./test/specs/**/*.e2e.ts"],
  baseUrl: "http://localhost:3000",
  maxInstances: 10, // 最大并发
  capabilities: [
    { browserName: "chrome", "goog:chromeOptions": { args: ["--headless"] } },
  ],
  framework: "mocha",
  mochaOpts: { ui: "bdd", timeout: 60000 },
  services: ["chromedriver"],
  reporters: ["spec"],
  waitforTimeout: 10000,
  logLevel: "info",
};
```

| 字段 | 说明 |
| ---- | ---- |
| `capabilities` | 浏览器/设备列表，每项一个会话 |
| `framework` | mocha / jasmine / cucumber |
| `services` | 生命周期插件 |
| `reporters` | 报告输出 |
| `specs` | 测试文件 glob |
| `waitforTimeout` | 默认等待超时 ms |

## services 生态

services 在测试生命周期注入能力，即插即用：

| Service | 用途 |
| ------- | ---- |
| `chromedriver` / `geckodriver` | 本地驱动自动管理 |
| `@wdio/appium-service` | 启动 Appium、移动端测试 |
| `@wdio/browserstack-service` / `@wdio/sauce-service` | 云平台集成 |
| `@wdio/visual-service` | 视觉截图对比 |
| `@wdio/lighthouse-service` | 性能测试（v9 从 devtools 拆分） |

```ts
services: [
  "chromedriver",
  ["appium", { args: { address: "localhost", port: 4723 } }],
];
```

## reporters

`spec`（控制台，默认）/ `allure`（可视化）/ `junit`（CI XML）/ `html`。

## 生命周期 hooks

wdio.conf 提供丰富钩子，覆盖测试全生命周期：

```ts
onPrepare(config, caps) {}, // 所有 worker 启动前一次
before(caps, specs, browser) {}, // 每 worker 测试前（注册自定义命令）
beforeTest(test) {}, // 每用例前
afterTest(test, ctx, { passed }) {}, // 每用例后
after(result) {}, // worker 结束
onComplete(exitCode) {}, // 全部结束、进程退出前
```