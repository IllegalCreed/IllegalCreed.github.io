---
layout: doc
outline: [2, 3]
---

# 配测试与对比

> 基于 Puppeteer v25.x 编写

## 速查

- Puppeteer 自身无断言/runner，做测试配 `jest-puppeteer`（Jest preset，注入 page/browser 全局）
- 断言来自 Jest 的 `expect`，runner/并行/报告来自 Jest
- `puppeteer.connect({ browserWSEndpoint })`：连远程/已有浏览器（disconnect 不关浏览器）
- `page.createCDPSession()`：原生 CDP 直达（性能、限速等）
- vs Playwright：同源但 PW 是完整测试框架 + 跨浏览器；新项目测试选 PW/Cypress

## 配 jest-puppeteer 做测试

Puppeteer 没有断言与 runner，要做 E2E 测试需配 `jest-puppeteer`——它是 Jest preset，注入 `page` / `browser` 全局，断言用 Jest 的 `expect`：

```js
// jest.config.js
module.exports = { preset: "jest-puppeteer" };
```

```js
// __tests__/home.test.js
describe("首页", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:3000"); // page 由 jest-puppeteer 注入
  });

  it("标题含品牌名", async () => {
    expect(await page.title()).toContain("My App"); // 断言来自 Jest
  });
});
```

> 这是「Puppeteer（自动化）+ Jest（runner + 断言）」的组合——印证了 Puppeteer 本身不是测试框架。

## connect 与 CDPSession

```js
// 连接已有浏览器（Serverless / 浏览器池）
const browser = await puppeteer.connect({
  browserWSEndpoint: "ws://127.0.0.1:9222/devtools/browser/xxx",
});
browser.disconnect(); // 不关浏览器；close() 才关

// 原生 CDP 会话（性能采集、网络限速）
const client = await page.createCDPSession();
await client.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 100,
  downloadThroughput: (1.5 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
```

## vs Playwright / Cypress / Selenium

| 维度 | Puppeteer | Playwright | Cypress | Selenium |
| ---- | --------- | ---------- | ------- | -------- |
| 类型 | 自动化库 | 测试框架 | 测试框架 | 自动化库/框架 |
| 内置 runner/断言 | 无 | 有 | 有 | 无 |
| 并行 | 无（配 Jest） | 有 | 有 | 有（Grid） |
| 浏览器 | Chrome 为主 | 全引擎 | Chrome 系 | 全部 |
| CDP 控制 | 最强 | 较强 | 有限 | 无 |
| 适合 | 爬虫/截图/PDF | E2E 测试首选 | E2E（前端友好） | 企业跨平台 |

## 适用场景决策

- **E2E 测试** → Playwright（新项目）/ Cypress（Vue/React 前端）——别用 Puppeteer
- **Chrome 爬虫 / 动态抓取** → Puppeteer（轻量、CDP 直控）
- **截图服务 / 全页截图** → Puppeteer（screenshot 最成熟）
- **PDF 生成（报表/发票）** → Puppeteer（page.pdf 企业最广用）
- **最小依赖自动化脚本** → Puppeteer
- **需 Safari/WebKit** → Playwright