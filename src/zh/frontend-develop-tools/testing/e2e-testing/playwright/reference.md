---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Playwright v1.61 编写

## 速查

- 定位：`page.getByRole("button", { name })`，优先语义 locator
- 动作：`.click()` / `.fill()` / `.check()`，自动等待可操作性
- 断言：`await expect(locator).toBeVisible()`，web-first 自动重试
- 网络：`page.route(url, route => route.fulfill(...))`
- 完整说明见 [入门](./getting-started.md) / [Locator](./guide-line/locators.md) / [断言](./guide-line/assertions.md) / [网络与 Fixtures](./guide-line/network-fixtures.md) / [并行与多浏览器](./guide-line/parallel-projects.md) / [调试与 Trace](./guide-line/debugging-trace.md)

## Locator

| API | 说明 |
| --- | ---- |
| `getByRole(role, { name })` | ARIA role + 名称（首选） |
| `getByLabel` / `getByPlaceholder` | 表单 |
| `getByText` / `getByTestId` | 文本 / data-testid |
| `.filter({ hasText, has })` | 过滤 |
| `.and()` / `.or()` / `.nth(n)` | 组合 / 位置 |

## 常用断言

`toBeVisible` / `toBeHidden` / `toHaveText` / `toContainText` / `toHaveValue` / `toBeEnabled` / `toBeChecked` / `toHaveCount` / `toHaveAttribute` / `toHaveURL` / `toHaveTitle`

## CLI

```bash
npx playwright test                  # 跑全部
npx playwright test --project=webkit # 指定浏览器
npx playwright test --ui             # UI Mode
npx playwright test --debug          # 调试
npx playwright test --workers=50%    # 并行度
npx playwright test --shard=1/4      # 分片
npx playwright codegen <url>         # 录制生成代码
npx playwright show-trace x.zip      # 看 trace
npx playwright install --with-deps   # 装浏览器（CI）
```

## 常用配置项

| 配置 | 说明 |
| ---- | ---- |
| `testDir` | 测试目录 |
| `use.baseURL` | page.goto 前缀 |
| `use.trace` | trace 录制策略 |
| `fullyParallel` | 文件内并行 |
| `forbidOnly` | CI 禁止 test.only |
| `retries` | 失败重试 |
| `projects` | 多浏览器矩阵 |
| `webServer` | 自动启动应用 |

## 近期版本特性

| 版本 | 特性 |
| ---- | ---- |
| v1.61 | `page.localStorage` / `sessionStorage`；video 新模式 |
| v1.59 | `page.ariaSnapshot()` ARIA 树快照 |
| v1.57 | 改用 Chrome for Testing 构建 |
| v1.52 | `toContainClass()`；per-project workers |

## 官方资源

- 文档：[https://playwright.dev](https://playwright.dev)
- Locators：[https://playwright.dev/docs/locators](https://playwright.dev/docs/locators)
- 断言：[https://playwright.dev/docs/test-assertions](https://playwright.dev/docs/test-assertions)
- Release notes：[https://playwright.dev/docs/release-notes](https://playwright.dev/docs/release-notes)
- GitHub：[https://github.com/microsoft/playwright](https://github.com/microsoft/playwright)