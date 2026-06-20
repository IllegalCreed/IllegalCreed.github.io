---
layout: doc
outline: [2, 3]
---

# 调试与 Trace

> 基于 Playwright v1.61 编写

## 速查

- Trace Viewer：`trace: "on-first-retry"` 录制，`npx playwright show-trace x.zip` 回放
- trace 含每步动作 + DOM 三态快照 + 网络 + console + 源码行
- codegen：`npx playwright codegen <url>` 录制操作生成测试代码
- UI Mode：`npx playwright test --ui` 可视化运行 + 时间旅行 + watch
- 调试：`--debug`（Inspector 逐步）/ `page.pause()`
- vs Cypress：跨浏览器/多语言/免费并行/Trace vs Cypress 的即时 DX/组件测试

## Trace Viewer（杀手锏）

记录测试每步的完整上下文，事后时间旅行回放：

```ts
// playwright.config.ts —— CI 黄金配置
use: {
  trace: "on-first-retry", // 失败首次重试时录（最省资源）
}
// 其他：'on' 全录 / 'retain-on-failure' 保留失败 / 'off'
```

```bash
npx playwright test --trace on                       # 本地强制录
npx playwright show-trace test-results/.../trace.zip # 打开 GUI
# 或拖 trace.zip 到 https://trace.playwright.dev（数据不上传）
```

Trace Viewer 面板：Actions 时间轴、DOM 三态快照（Before/Action/After，可交互）、截图胶卷、网络、Console、对应源码行。

## Codegen 录制

录制真实操作，自动生成测试代码（优先推荐语义 locator）：

```bash
npx playwright codegen http://localhost:3000
npx playwright codegen --device="iPhone 13" <url>     # 移动端
npx playwright codegen --save-storage=auth.json <url> # 保存登录态
```

## UI Mode

可视化运行与调试，集时间旅行、watch、locator 拾取于一体：

```bash
npx playwright test --ui
```

- 树状筛选 test、悬停时间轴看各步 DOM 快照
- watch 模式：代码变更自动重跑
- 交互式选元素即时显示对应 locator

## 命令行调试

```bash
npx playwright test --debug   # Inspector 逐步执行
```

```ts
test("调试", async ({ page }) => {
  await page.goto("/");
  await page.pause(); // 暂停并打开 Inspector
});
```

## vs Cypress

| 维度 | Playwright | Cypress |
| ---- | ---------- | ------- |
| 跨浏览器 | Chromium/FF/WebKit 正式 | Chrome 系，Safari 实验 |
| 多语言 | TS/JS/Py/Java/.NET | 仅 JS/TS |
| 并行 | 内置免费 | 需 Cloud 付费 |
| 运行位置 | 进程外（CDP/协议） | 浏览器内 |
| 调试 | Trace Viewer 事后回放 | 时间旅行即时 |
| 组件测试 | 实验性 | 成熟 |

> 一句话：Playwright 能力天花板高、跨浏览器 + 免费并行 + 多语言 → 新项目首选；Cypress DX 更丝滑、组件测试更成熟 → 存量项目继续用。