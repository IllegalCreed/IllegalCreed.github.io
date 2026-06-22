---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 axe-core 4.12 / WCAG 2.2 编写

## 速查

- **a11y 测试目标**：界面是否可被残障用户使用，事实标准 **WCAG 2.2**（POUR 四原则、A/AA/AAA，**AA 通行**）+ **WAI-ARIA 1.2**
- **核心引擎 axe-core**：对**渲染后 DOM**（非源码）跑规则，输出违规节点，可贯穿单元 / 组件 / E2E / CI 全链路
- **自动化覆盖边界（双口径，勿合并）**：单工具/准则约 **30-40%（GDS）**、问题实例约 **57%（Deque）**——**约一半甚至更多仍需人工**
- **最小例**：`const r = await axe.run(document); expect(r.violations).toEqual([])`
- **分层接入**：lint 静态左移 → 组件层 `axe.run()`（跳对比度）→ E2E `@axe-core/playwright` / `cypress-axe`（对比度可靠）→ CI pa11y / Lighthouse
- **核心认知**：自动化是「**地板**」非「天花板」，**零违规 ≠ 完全可访问**

## 什么是可访问性测试

可访问性测试验证界面是否能被残障用户（视障、听障、运动障碍、认知障碍）正常使用。判定依据是 W3C 的 **WCAG 2.2**（Web Content Accessibility Guidelines），它把「可访问」拆成四类原则与可判定的成功准则（SC）：

| 原则 | 英文 | 一句话 |
| ---- | ---- | ------ |
| 可感知 | **P**erceivable | 信息要能被感官接收（替代文本、对比度、字幕） |
| 可操作 | **O**perable | 界面要能被操作（键盘可达、足够时间、可导航） |
| 可理解 | **U**nderstandable | 内容与操作要可预期、可读 |
| 健壮 | **R**obust | 能被各种 AT（辅助技术）稳定解析 |

合规级别分 **A / AA / AAA** 三级，**AA 是法律与实践通行目标**（EN 301 549、Section 508、ADA 均引 AA），AAA 不要求全站达成。概念与标准详见 [概念与标准](./guide-line/concepts-standards.md)。

## 自动化能覆盖多少：两个口径都要知道

自动化测试**只能覆盖一部分**可访问性问题，业界两个权威口径**结论不同、口径不同，必须分别理解，不要合并成一个数字**：

- **Deque（axe-core）约 57%**：基于 2000+ 次审计 / 13000+ 页 / ~30 万问题，**57.38% 的问题「实例」**能被自动命中——口径是**按实例数**。
- **GOV.UK / GDS 约 30-40%**：对 143 个已知障碍的「最不可访问网页」跑 10 个工具，最佳单工具命中 37%(Tenon) / 41%(Asqatasun)，29% 的障碍全工具漏检——口径是**按单工具 / 准则**。

安全的表述是：**「自动化只覆盖一部分——单工具/准则口径约 30-40%(GDS)，问题实例口径约 57%(Deque)；无论哪种，约一半甚至更多仍需人工。」** 键盘可达、焦点可见、屏幕阅读器实测、alt 是否「有意义」、ARIA 语义是否正确，自动化都查不了。

::: warning 别把数字简化成一个
30-40% 和 57% 不是矛盾，而是两套口径。把「axe 覆盖 57%」当成「自动化能搞定大半」是常见误读——GDS 口径下单工具甚至到不了一半。
:::

## axe.run 最小例

axe-core 是浏览器内运行的客户端引擎，核心 API 就一个 `axe.run()`，返回 **Promise**，默认对整个 `document` 跑规则：

```js
import axe from "axe-core";

// 默认 context = 整个 document，跑除 experimental 外所有规则（含 best-practice）
const results = await axe.run(document);

// results.violations 为空数组即「本次自动化检查无违规」
console.log(results.violations); // 确定失败的规则
console.log(results.incomplete); // ⚠️ 需人工复核（有元素但无法判定）
```

只跑某些标签（如只要 WCAG 2.0 A 级）用 `runOnly`，注意标签是 **OR（并集）过滤**，要 A + AA 必须**两个都列**：

```js
const r = await axe.run(document, {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, // A 和 AA 都要 → 都列
});
```

引擎原理、`run()` 返回的四个数组（violations / passes / **incomplete** / **inapplicable**）、impact 四级、标签体系详见 [axe-core 引擎](./guide-line/axe-core.md)。

## 分层接入概览

a11y 是横切关注点，可在测试金字塔的每一层跑 axe，向上延伸到人工 / AT 审计：

| 层级 | 工具 | 说明 |
| ---- | ---- | ---- |
| 静态（左移） | `eslint-plugin-vuejs-accessibility` | lint 扫 `<template>`，无浏览器，进编辑器 / pre-commit |
| 单元 / 组件 | jest-axe（锁 4.10.2）/ 直接 `axe.run()` / Storybook addon-a11y | jsdom 无布局，**对比度不可靠，须关或放浏览器层** |
| 端到端 | `@axe-core/playwright`、`cypress-axe` | 真实浏览器，**对比度可靠** |
| CI 批量 | pa11y / pa11y-ci、Lighthouse / LHCI | 多 URL / sitemap 扫描、评分门禁 |
| 人工 / AT | 键盘、焦点、NVDA / JAWS / VoiceOver | **自动化永远无法替代** |

::: tip 对比度只信浏览器层
颜色对比度需要真实布局计算，jsdom 没有布局，jest-axe 已默认关闭 `color-contrast`。所以对比度检查只在 Playwright / Cypress / pa11y / Lighthouse 这些跑真浏览器的层才可靠。
:::

## 下一步

- [概念与标准](./guide-line/concepts-standards.md)：WCAG 2.2 / POUR / 级别、WAI-ARIA 1.2、自动化覆盖边界双口径、哪些只能人工
- [axe-core 引擎](./guide-line/axe-core.md)：原理、tags、impact 四级、`axe.run()` 四个返回数组、默认含 best-practice 纠偏
- [单元 / 组件接入](./guide-line/unit-component.md)：jest-axe / vitest-axe、推荐直接 `axe.run()`、Testing Library、Storybook
- [端到端接入](./guide-line/e2e.md)：`@axe-core/playwright`（AxeBuilder）、`cypress-axe`（injectAxe / checkA11y）
- [CI 与批量扫描](./guide-line/ci-scanning.md)：pa11y / pa11y-ci、Lighthouse a11y / LHCI 门禁
- [Vue 实战与最佳实践](./guide-line/best-practices.md)：eslint 左移、坏组件修复例、违规分级、反模式清单
