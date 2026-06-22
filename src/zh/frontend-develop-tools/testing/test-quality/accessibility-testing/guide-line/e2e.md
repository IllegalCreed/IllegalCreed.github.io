---
layout: doc
outline: [2, 3]
---

# 端到端接入

> 基于 @axe-core/playwright 4.11.3 / cypress-axe 1.7.0 编写

## 速查

- **`@axe-core/playwright` 4.11.3**：bundle axe-core ~4.11.4；`AxeBuilder({ page })` → `.withTags()`（**按标签**过滤）/ `.withRules()` / `.disableRules()` / `.include()` / `.exclude()` → `.analyze()` 返**完整 `axe.Results`**（自动注入所有 iframe），断言 `r.violations`
- **`cypress-axe` 1.7.0**：axe-core 是 **peer（`^3||^4`，需自装）**；`cy.injectAxe()`（**必须 visit 后、checkA11y 前**）→ `cy.checkA11y(context?, options?, violationCallback?, skipFailures?)`
- **`checkA11y` 四参顺序**：context → options → violationCallback → **`skipFailures`（默认 false；true = 关断言只 console 记录，用于渐进整改）**
- **E2E 跑真浏览器，对比度可靠**（不像 jsdom）；两者都只是 axe **封装**，非独立引擎
- ⚠️ Deque README 把 `.withTags()` 误写「按 rule ID」——**以 Playwright 官方为准：withTags 按标签**

## @axe-core/playwright

**`@axe-core/playwright` 4.11.3（2026-04-30）** 内部 **bundle 了 axe-core ~4.11.4**（按所 bundle 的版本命名，故略滞后于独立的 4.12.1），peer `playwright-core >= 1`。用法是构造 `AxeBuilder`（**默认导出**）并传入 `{ page }`：

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright"; // 默认导出

test("首页无 A/AA 违规", async ({ page }) => {
  await page.goto("/");
  // withTags 按标签过滤；A + AA 都列；analyze() 返回完整 axe.Results
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(r.violations).toEqual([]);
});
```

`AxeBuilder` 的方法（可链式累加）：

| 方法 | 作用 |
| ---- | ---- |
| `.include(sel)` / `.exclude(sel)` | 按 **CSS selector** 限定 / 排除范围，可链式累加 |
| `.withTags(tags)` | **按标签**过滤「哪些规则跑」（如 `wcag2aa`） |
| `.withRules(ids)` | **仅跑指定规则 ID** |
| `.disableRules(ids)` | 跳过指定规则（压制已知违规） |
| `.options(opts)` | 覆盖其它所有配置 |
| `.analyze()` | 运行检查，返回**完整 `axe.Results`**，自动注入所有 iframe |

::: warning withTags 按标签，不是按 rule ID
Deque 的 README 因复制粘贴把 `.withTags()` 误描述成「按 rule ID 过滤」——**这是文档 bug**。**以 Playwright 官方文档为准：`.withTags()` 按标签，要按规则 ID 用 `.withRules()` / `.disableRules()`**。
:::

因为 `.analyze()` 返回的是**完整 Results**，所以断言取 `r.violations`：

```ts
// 局部检查：只扫导航区
const nav = await new AxeBuilder({ page }).include("#nav").analyze();
expect(nav.violations).toEqual([]);

// 压制已知问题：暂时跳过对比度
const r = await new AxeBuilder({ page })
  .disableRules(["color-contrast"])
  .analyze();
```

::: tip 跑在 vite preview 上，对比度可靠
E2E 在真实浏览器（Chromium / Firefox / WebKit）里运行，**有真实布局，对比度等渲染相关规则可靠**——这正是 jsdom 层做不到的（见 [单元 / 组件接入](./unit-component.md)）。通常让 Playwright 跑在 `vite preview` 起的生产构建服务器上。
:::

## cypress-axe

**`cypress-axe` 1.7.0（2025-08）** 把 axe 封装成 Cypress 命令，**零运行时依赖**——`axe-core` 是 **peer（`^3 || ^4`，需自己装）**，peer `cypress ^10–^15`。三个命令：

| 命令 | 作用 |
| ---- | ---- |
| `cy.injectAxe()` | 注入 axe 运行时，**必须在 `cy.visit()` 后、`checkA11y` 前** |
| `cy.configureAxe(opts)` | 配置 axe（规则 / 标签等） |
| `cy.checkA11y(...)` | 运行检查，**有违规即断言失败** |

```js
beforeEach(() => {
  cy.visit("/"); // 顺序关键：必须先 visit
  cy.injectAxe(); // 再注入 axe 运行时
});

it("无可访问性违规", () => {
  cy.checkA11y("#main", null); // context = #main，options = null
});
```

::: warning injectAxe 必须在 visit 之后
`cy.injectAxe()` 是往**当前页面**注入 axe 脚本，页面还没 `visit` 就注入会失败。固定顺序：**`visit` → `injectAxe` → `checkA11y`**。
:::

### checkA11y 的四个参数

`cy.checkA11y(context?, options?, violationCallback?, skipFailures?)`，**顺序不能错**：

| 位置 | 参数 | 说明 |
| ---- | ---- | ---- |
| 1 | `context` | 检查范围（CSS selector / 元素） |
| 2 | `options` | axe options + 扩展：`includedImpacts`、`retries`、`interval`（默认 1000ms） |
| 3 | `violationCallback` | `(violations) => {}` 副作用回调（如打印 / 上报） |
| 4 | **`skipFailures`** | **默认 `false`**；`true` = **关闭断言、只 console 记录**，用于**渐进整改** |

```js
it("渐进整改：先记录不阻断", () => {
  cy.checkA11y(
    null, // 全页
    { includedImpacts: ["critical", "serious"] }, // 只关注高严重度
    (violations) => {
      // 副作用：把违规打到日志
      cy.log(`发现 ${violations.length} 条违规`);
    },
    true // skipFailures：不让测试失败，仅记录
  );
});
```

## 两者对比

| 维度 | `@axe-core/playwright` | `cypress-axe` |
| ---- | ---------------------- | ------------- |
| axe-core 来源 | **bundle**（~4.11.4，随包升级） | **peer，需自装**（`^3 \|\| ^4`） |
| 入口 | `AxeBuilder({ page }).analyze()` | `cy.injectAxe()` + `cy.checkA11y()` |
| 标签过滤 | `.withTags()` | `options` 里配 |
| 断言 | 手动 `expect(r.violations)` | `checkA11y` 自动断言 |
| 渐进整改 | `.disableRules()` 缩范围 | `skipFailures: true` |
| 本质 | **都是 axe 封装，非独立引擎** | 同左 |

> 两者都**只是 axe-core 的封装**，规则来源都是 axe-core——区别只在「怎么注入、怎么断言」。`@axe-core/playwright` 的 4.11.3 滞后于独立 axe-core 4.12.1，正是因为它 bundle 的是 ~4.11.4。
