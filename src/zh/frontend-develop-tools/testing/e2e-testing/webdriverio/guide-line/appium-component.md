---
layout: doc
outline: [2, 3]
---

# Appium 与组件测试

> 基于 WebdriverIO v9 编写

## 速查

- Appium：同一框架测 iOS/Android 原生 + 混合 app + 移动 Web（独特利基）
- 移动选择器：`~accessibilityId`（跨平台首选）/ `android=UiSelector` / `-ios predicate`
- context 切换：`driver.getContexts()` + `switchContext()` 切 Web/Native
- 组件测试：`@wdio/browser-runner` 真实浏览器跑组件，集成 Vitest 语法 + Testing Library
- vs Selenium：同 WebDriver 阵营但 API 现代、内置自动等待、Appium 一体

## Appium 移动端（差异化优势）

WebdriverIO 通过 Appium 用**同一套框架与 API 风格**测 Web + iOS 原生 + Android 原生 + 混合 app——这是相对 Playwright / Cypress 的独特利基。

```ts
// wdio.conf.ts capabilities（Android）
capabilities: [
  {
    platformName: "Android",
    "appium:deviceName": "emulator-5554",
    "appium:automationName": "UiAutomator2",
    "appium:app": "/path/to/app.apk",
  },
];
```

## 移动端选择器

```ts
// Accessibility ID（跨 iOS/Android 推荐）
await $("~login_button").click();

// Android UiAutomator
await $('android=new UiSelector().text("确定")').click();

// iOS predicate string
const sw = await $("-ios predicate string:type == 'XCUIElementTypeSwitch'");
```

## context 切换（混合 app）

```ts
const contexts = await driver.getContexts(); // 列出 NATIVE_APP / WEBVIEW_xxx
const webview = contexts.find((c) => c.startsWith("WEBVIEW"));
await driver.switchContext(webview); // 切到 WebView，可用 Web 选择器
await driver.switchContext("NATIVE_APP"); // 切回原生
```

## 组件测试（browser runner）

`@wdio/browser-runner` 用 Vite 在**真实浏览器**渲染组件，相比 Vitest/JSDOM 模拟能测真实 Web API、`:hover`、触摸等。语法与 Vitest 兼容、可配 Testing Library：

```ts
// wdio.conf.ts
runner: ["browser", { preset: "vue" }], // react | vue | svelte | solid
```

```ts
// Counter.test.ts
import { $, expect } from "@wdio/globals";
import { render } from "@testing-library/vue";
import Counter from "./Counter.vue";

it("点击递增", async () => {
  const { getByText } = render(Counter);
  await $(getByText("increment")).click();
  await expect($("p=Times clicked: 1")).toExist();
});
```

> 目前 browser runner 框架支持 Mocha（Jasmine/Cucumber 在路线图）。

## v9 新特性与 vs Selenium

v9 亮点：BiDi 默认开启、命令内置自动等待、选择器自动穿透 Shadow DOM、跨浏览器网络 mock、`emulate("device", "iPhone 15")` 设备模拟、假时钟。

| | WebdriverIO | Selenium |
| --- | --- | --- |
| 协议 | WebDriver + BiDi | WebDriver Classic |
| 自动等待 | 内置 | 需手写 |
| Appium 一体 | 顺畅集成 | 分离工具链 |
| API 风格 | 现代 async + services | 偏底层 |

> 同属 WebDriver 标准阵营，但 WebdriverIO 封装更现代、Web+Mobile 一体；纯 Web 前端项目 Playwright/Cypress 社区更成熟。