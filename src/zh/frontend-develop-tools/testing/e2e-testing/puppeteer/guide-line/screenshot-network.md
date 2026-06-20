---
layout: doc
outline: [2, 3]
---

# 截图、PDF 与网络

> 基于 Puppeteer v25.x 编写

## 速查

- 截图：`page.screenshot({ path, fullPage, type, clip })`
- PDF：`page.pdf({ path, format, printBackground, margin })`（先 `emulateMediaType("screen")` 保留网页颜色）
- 网络拦截：`page.setRequestInterception(true)` + `page.on("request", ...)`
- 请求处理：`request.continue()` 放行 / `abort()` 阻断 / `respond()` Mock
- 反检测：`evaluateOnNewDocument` 改 `navigator.webdriver`，或 `puppeteer-extra` + stealth

## 截图（强项）

```js
// 全页 PNG
await page.screenshot({ path: "full.png", fullPage: true });

// 视口区域 JPEG（裁剪 + 质量）
await page.screenshot({
  type: "jpeg",
  quality: 85,
  clip: { x: 0, y: 0, width: 800, height: 600 },
});
```

## PDF 生成（强项）

`page.pdf` 是 Puppeteer 最被认可的能力之一（企业广泛用于报表/发票）：

```js
await page.emulateMediaType("screen"); // 保留网页颜色（默认用 print 媒体）
const pdf = await page.pdf({
  format: "A4",
  printBackground: true, // 含背景色/图
  margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
});
```

## 网络拦截

```js
await page.setRequestInterception(true);

page.on("request", (request) => {
  if (request.isInterceptResolutionHandled()) return; // 多 handler 安全检查

  // 屏蔽图片加速
  if (request.resourceType() === "image") return request.abort();

  // Mock API
  if (request.url().includes("/api/products")) {
    return request.respond({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 1, name: "测试商品" }]),
    });
  }

  request.continue(); // 放行
});
```

## 爬虫与反检测

Puppeteer 常用于爬虫——CDP 直控 + 反检测：

```js
// 手动注入
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
});
await page.setUserAgent("Mozilla/5.0 ...");

// 或用插件
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());
```

> 抓取 / 截图 / PDF 是 Puppeteer 最被认可的场景；CDPSession（`page.createCDPSession()`）还能直达原生 CDP 做性能采集、网络限速等。