---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 WebdriverIO v9 编写

## 速查

- 安装：`npm init wdio@latest .`（向导生成 wdio.conf）；Node ≥ 18.20
- 配置：`wdio.conf.ts` 的 `capabilities` / `services` / `framework` / `specs` / `baseUrl`
- 查询：`await $(sel)` 单个 / `await $$(sel)` 多个；优先 `aria/名` 与文本选择器
- 交互：`await $(sel).click()` / `setValue()`，**命令内置自动等待**
- 断言：`await expect($(sel)).toBeDisplayed()`（expect-webdriverio，web-first）
- 跑：`npx wdio run ./wdio.conf.ts`；`--spec` 单文件、`--watch` 调试
- 协议：W3C WebDriver + **BiDi（v9 默认开启）**

## 安装

```bash
npm init wdio@latest .   # 配置向导：选测试模式/框架/services/reporters
```

向导生成 `wdio.conf.ts` 与示例测试。v9 要求 **Node.js ≥ 18.20**，用 tsx 编译 TS。

## 配置 wdio.conf.ts

```ts
export const config: WebdriverIO.Config = {
  runner: "local",
  specs: ["./test/specs/**/*.e2e.ts"],
  baseUrl: "http://localhost:3000",
  capabilities: [{ browserName: "chrome" }], // 浏览器/设备
  framework: "mocha", // mocha | jasmine | cucumber
  services: ["chromedriver"], // 生命周期插件
  reporters: ["spec"],
  waitforTimeout: 10000, // waitForXxx 默认超时
};
```

## 第一个测试

```ts
describe("登录", () => {
  it("成功登录", async () => {
    await browser.url("/login");
    await $("aria/用户名").setValue("admin");
    await $("aria/密码").setValue("secret");
    await $("button=登录").click(); // 内置自动等待
    await expect(browser).toHaveUrl(expect.stringContaining("/dashboard"));
  });
});
```

## 协议（WebDriver + BiDi）

WebdriverIO 基于 **W3C WebDriver Classic + WebDriver BiDi** 标准协议——与 Selenium 同阵营。**v9 起所有会话默认启用 BiDi**（双向通信，带来跨浏览器网络 mock、Shadow DOM 自动穿透、设备模拟等现代能力），`browser.isBidi` 可检查；需强制 Classic 用 `wdio:enforceWebDriverClassic` capability。

## 下一步

- [选择器与命令](./guide-line/selectors-commands.md)：`$`/`$$`、选择器类型、交互、自动等待
- [断言](./guide-line/assertions.md)：expect-webdriverio web-first 断言
- [配置与 services](./guide-line/config-services.md)：`wdio.conf`、services 生态、reporters、hooks
- [Appium 与组件测试](./guide-line/appium-component.md)：移动端一体、browser runner、vs Selenium