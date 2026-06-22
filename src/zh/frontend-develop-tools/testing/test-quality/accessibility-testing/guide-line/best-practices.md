---
layout: doc
outline: [2, 3]
---

# Vue 实战与最佳实践

> 基于 eslint-plugin-vuejs-accessibility 2.5.0 / axe-core 4.12.1 编写

## 速查

- **静态左移**：`eslint-plugin-vuejs-accessibility 2.5.0`（~22 条规则）lint 扫 `<template>`，无浏览器，与 runtime axe **互补**
- **坏组件修复**：`<div @click>` → 报 `click-events-have-key-events` + `no-static-element-interactions`，改真 `<button>` 由 axe **`button-name`** 保证；图标按钮无名触发 **`aria-command-name`**；`<img>` 无 alt → **`image-alt`**
- **分层门禁**：lint（编辑器/pre-commit）→ 组件 axe（跳对比度）→ E2E + Lighthouse/pa11y-ci（CI 关键页回归）；**对比度只信浏览器层**
- **违规分级**：`critical` / `serious` 设**硬门禁**（CI fail）；`moderate` / `minor` 先 warn；**`incomplete` 单独输出转人工**，不当通过
- **核心认知**：**「零违规 ≠ 完全可访问」**——自动化只覆盖约一半，自动化是地板非天花板

## 静态左移：eslint-plugin-vuejs-accessibility

**`eslint-plugin-vuejs-accessibility` 2.5.0**（2026-02，peer eslint `^5–^10`，约 22-23 条规则，源自 axe-core + WCAG 2.1 + ARIA）**对 `<template>` 做静态分析**——**不跑浏览器、不渲染**，所以能在编辑器 / pre-commit 阶段就抓问题，与 runtime 的 axe **互补**（一个查源码模板、一个查渲染 DOM）。

```js
// eslint.config.js（flat config）
import pluginVueA11y from "eslint-plugin-vuejs-accessibility";

export default [
  // 一次性启用推荐规则集
  ...pluginVueA11y.configs["flat/recommended"],
];
```

常用规则：`alt-text`、`form-control-has-label`、`click-events-have-key-events`、`no-autofocus`、`interactive-supports-focus`、`aria-role`、`aria-props`、`no-static-element-interactions`、`label-has-for`、`tabindex-no-positive`。

## 坏组件 → 修复教学例

### 例 1：div 假按钮 + 图标按钮无名

```vue
<!-- BAD：div 当按钮——不可聚焦 / 无 role / 无键盘 / 图标无可访问名 -->
<div class="icon-btn" @click="$emit('remove')">
  <i class="i-carbon-trash-can" />
</div>
```

这段会被**两道门**抓住：

1. **lint 静态**：`eslint-plugin-vuejs-accessibility` 报 `click-events-have-key-events`（有 click 无键盘）+ `no-static-element-interactions`（静态元素挂交互）；
2. **axe runtime**：即使改用元素但没有可访问名，图标按钮会触发 **`aria-command-name`**。

修复——用**真实 `<button>`**（自带焦点 + 键盘 + 角色），并给图标按钮显式可访问名；`<button>` 的存在与命名由 axe 的 **`button-name`** 规则保证：

```vue
<!-- GOOD：真按钮 + aria-label 提供可访问名 + 装饰图标 aria-hidden -->
<button type="button" aria-label="删除该项" @click="$emit('remove')">
  <i class="i-carbon-trash-can" aria-hidden="true" />
</button>
```

### 例 2：图片缺 alt

```vue
<!-- BAD：无 alt → axe image-alt -->
<img src="logo.png" />
```

```vue
<!-- GOOD：有意义图给描述性 alt；纯装饰图给空 alt="" -->
<img src="logo.png" alt="公司 Logo" />
```

::: tip 装饰性图片用 alt=""
有信息的图给**描述性 alt**；**纯装饰图用 `alt=""`**（明确告诉 AT 跳过），而不是不写 `alt`。工具只能查 alt **是否存在**，**「是否有意义」仍要人工判断**（见 [概念与标准](./concepts-standards.md)）。
:::

## Testing Library 促进可访问性

`@testing-library/vue` 的查询比 `@vue/test-utils` 更 a11y 友好——`getByRole('button', { name })` / `getByLabelText()` **仅在标记可访问时才匹配**：

```ts
// div@click 用 getByRole('button') 根本找不到 → 测试即 a11y 检查
const btn = getByRole("button", { name: "删除该项" });
```

这把「能不能查到元素」和「元素是否可访问」绑定在一起，写测试的同时就在驱动可访问的标记。组件层接入细节见 [单元 / 组件接入](./unit-component.md)。

## 分层门禁

| 层 | 工具 | 落点 | 要点 |
| ---- | ---- | ---- | ---- |
| 静态左移 | `eslint-plugin-vuejs-accessibility` | 编辑器 / pre-commit | 模板级，最快反馈 |
| 组件级 | 直接 `axe.run()`（跳对比度） | 单元测试 | jsdom 无布局，**关 color-contrast** |
| 端到端 | `@axe-core/playwright` / `cypress-axe` | CI | 真浏览器，**对比度可靠** |
| 综合评分 | Lighthouse / pa11y-ci | CI 关键页回归 | 多页 / sitemap |

::: tip 对比度只信浏览器层
对比度需要真实布局，**只在 Playwright / Cypress / pa11y / Lighthouse 这些跑真浏览器的层才可靠**，jsdom 层一律关掉避免假阳性。
:::

## 违规分级与处置

| 类别 | 处置 |
| ---- | ---- |
| `critical` / `serious` | **硬门禁**：CI fail，必须修 |
| `moderate` / `minor` | 先 `warn` / 排期，逐步清 |
| **`incomplete`** | **单独输出供人工复核**，**绝不当通过** |
| 渐进整改 | 用 `skipFailures`（Cypress）/ `.disableRules()`（Playwright）临时缩范围，但**必须留 backlog** |

> `incomplete` 是「有元素但判不了」，不是「通过」。把它当通过会漏真问题（详见 [axe-core 引擎](./axe-core.md) 的三态区分）。

## 「零违规 ≠ 完全可访问」

这是 a11y 测试**最该刻在脑子里的一条**：axe 只覆盖约 **30-40%（GDS 单工具/准则口径）/ 57%（Deque 问题实例口径）**，**键盘可达、焦点可见、屏幕阅读器实测、alt 是否有意义、ARIA 语义是否正确、颜色是否唯一信息载体**都需要人工。**自动化是「地板」，不是「天花板」**——它减少人工量，永不替代人工。

## 反模式清单

1. **jsdom 信 `color-contrast`**——jsdom 无布局，对比度不可靠（jest-axe 已关闭），放浏览器层。
2. **把 `inapplicable` 当通过 / 把 `incomplete` 当通过**——前者是「没元素没跑」，后者是「判不了需人工」，都不是「通过」。
3. **用 jest-axe（锁 4.10.2）/ vitest-axe（0.1.0, 2022）不知规则滞后**——Vitest 直接用最新 axe-core。
4. **`withTags` 只列一个标签以为覆盖 A+AA**——标签是 OR 过滤，要 A+AA 必须 `['wcag2a','wcag2aa']` 都列。
5. **`injectAxe` 漏在 `visit` 之后**——必须 `visit` → `injectAxe` → `checkA11y`。
6. **以为 axe 默认不含 best-practice**——**axe-core 库本身默认含 best-practice**，「不含」只对包装工具 / 老 2.x 3.x 成立。
7. **把 `@lhci/cli`（含 LH 12.6.1）当独立 lighthouse 13.x**——两者版本不同步，分数会对不上。
8. **`<div @click>` 假按钮 / 图标按钮无 `aria-label` / `tabindex` 用正值乱序**——用原生 `<button>`、给图标按钮命名、`tabindex` 不用正值。
