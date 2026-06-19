---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Vitest v4.x（Browser Mode）编写

## 速查

- 配置：`test.browser: { enabled, provider, instances, headless }`
- 查询：`page.getByRole(...)`（语义、惰性、重试）
- 交互：`await locator.click()` / `userEvent.fill(...)`
- 断言：`await expect.element(locator).toBeVisible()`
- 完整说明见 [入门](./getting-started.md) / [配置](./guide-line/configuration.md) / [Locators](./guide-line/locators.md) / [交互与断言](./guide-line/interactivity.md) / [视觉回归与对比](./guide-line/visual-vs-jsdom.md)

## 配置项

| 配置 | 默认 | 说明 |
| ---- | ---- | ---- |
| `browser.enabled` | `false` | 启用 browser mode |
| `browser.provider` | — | `playwright()` / `webdriverio()` / `preview()` |
| `browser.instances` | — | 浏览器实例列表（至少一个） |
| `browser.headless` | `process.env.CI` | 无头模式 |
| `browser.screenshotFailures` | `!browser.ui` | 失败自动截图 |
| `browser.locators.testIdAttribute` | `data-testid` | `getByTestId` 属性名 |

## Locator API

| API | 说明 |
| --- | --- |
| `getByRole(role, opts)` | ARIA 角色（首选） |
| `getByLabelText` / `getByPlaceholder` | 表单 |
| `getByText` / `getByAltText` / `getByTitle` | 文本 / alt / title |
| `getByTestId` | data-testid 兜底 |
| `.nth/.first/.last` | 位置 |
| `.filter({ hasText })` | 过滤 |
| `.and()` / `.or()` | 逻辑组合 |
| `page.frameLocator(...)` | iframe（Playwright） |

## userEvent

| API | 说明 |
| --- | --- |
| `click` / `dblClick` / `tripleClick` | 点击 |
| `fill` / `type` / `clear` | 输入 |
| `keyboard` / `tab` | 键盘 |
| `hover` / `selectOptions` / `upload` | 悬停 / 选择 / 上传 |
| `dragAndDrop` / `dropTo` | 拖放 |

## expect.element matcher（部分）

| matcher | 说明 |
| ------- | ---- |
| `toBeVisible` / `toBeInViewport` | 可见 / 在视口 |
| `toBeDisabled` / `toBeChecked` / `toHaveFocus` | 表单状态 |
| `toHaveTextContent` / `toHaveValue` / `toHaveClass` | 内容 / 属性 |
| `toHaveRole` / `toHaveAccessibleName` | 无障碍 |
| `toMatchScreenshot` | 视觉回归 |

## 官方资源

- 文档：[https://vitest.dev/guide/browser/](https://vitest.dev/guide/browser/)
- Locators：[https://vitest.dev/guide/browser/locators](https://vitest.dev/guide/browser/locators)
- v4 博客：[https://vitest.dev/blog/vitest-4](https://vitest.dev/blog/vitest-4)
- GitHub：[https://github.com/vitest-dev/vitest](https://github.com/vitest-dev/vitest)
