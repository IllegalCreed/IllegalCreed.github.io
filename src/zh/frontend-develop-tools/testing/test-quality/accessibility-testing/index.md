---
layout: doc
---

# 可访问性测试

可访问性测试（Accessibility Testing，简称 a11y）验证 Web 界面是否能被残障用户（视障、听障、运动障碍、认知障碍）正常使用，事实标准是 W3C 的 **WCAG 2.2**（POUR 四原则、A/AA/AAA 三级，**AA 是法律与实践通行目标**）与 **WAI-ARIA 1.2**。前端工程化的主力引擎是 **axe-core**——一个对**渲染后 DOM** 运行的客户端 JS 规则引擎，可在单元（jest-axe / 直接 `axe.run()`）、组件（Storybook addon-a11y）、E2E（`@axe-core/playwright`、`cypress-axe`）、CI 批量（pa11y、Lighthouse / LHCI）各层接入。核心前提：**自动化只是「地板」不是「天花板」**——它能查的只是一部分（单工具/准则口径约 30-40%，问题实例口径约 57%），键盘可达、焦点可见、屏幕阅读器实测、alt 是否「有意义」仍须人工。

## 评价

**优点**

- **标准明确可量化**：WCAG 2.2 把「可访问」拆成可判定的成功准则（SC），axe 规则一一对应，违规可定位到具体 DOM 节点
- **全链路可接入**：同一个 axe-core 引擎贯穿单元 / 组件 / E2E / CI，无需为不同层学不同工具
- **左移成本低**：`eslint-plugin-vuejs-accessibility` 在编辑器 / pre-commit 静态扫 `<template>`，问题在写代码时就暴露
- **CI 门禁防回退**：按 `impact`（critical / serious / moderate / minor）分级设硬门禁，可阻断可访问性退化
- **与现有测试栈无缝**：Vitest / Jest / Playwright / Cypress 都有成熟封装，复用既有用例结构

**缺点**

- **覆盖率有天花板**：自动化约只覆盖一半甚至更少，**「零违规 ≠ 完全可访问」**是最大误区
- **渲染相关规则在 jsdom 不可靠**：颜色对比度需真实布局，jsdom 无布局，jest-axe 直接关闭该规则，必须放到浏览器层
- **生态版本错配多**：jest-axe 锁老 axe-core 4.10.2、vitest-axe 卡 0.1.0(2022)、`@lhci/cli` 内含的 Lighthouse 版本 ≠ 独立 Lighthouse，不留意就用了滞后规则
- **人工成本无法免除**：键盘、焦点、屏幕阅读器（NVDA/JAWS/VoiceOver）、ARIA 语义是否正确仍需人测，自动化无法替代

## 文档地址

[WCAG 2.2（W3C Recommendation）](https://www.w3.org/TR/WCAG22/) ｜ [axe-core API 文档](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)

## GitHub地址

[axe-core（Deque）](https://github.com/dequelabs/axe-core)

## 幻灯片地址

<a href="/SlideStack/accessibility-testing-slide/" target="_blank">可访问性测试</a>
