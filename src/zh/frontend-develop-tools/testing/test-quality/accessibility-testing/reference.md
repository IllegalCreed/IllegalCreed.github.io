---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 axe-core 4.12.1 / WCAG 2.2 / WAI-ARIA 1.2 编写

## 速查

- **标准**：WCAG 2.2（定稿 2023-10-05，POUR，A/AA/AAA，**AA 通行**，**总 86 条**）+ WAI-ARIA 1.2（roles/states/properties，第一法则 → 4.1.2）
- **引擎**：axe-core 对**渲染后 DOM** 跑规则，返 `violations / passes / incomplete / inapplicable`；**库默认含 best-practice**
- **覆盖边界**：GDS 约 **30-40%**（单工具/准则）、Deque 约 **57%**（问题实例）——**零违规 ≠ 完全可访问**
- **接入**：lint（`eslint-plugin-vuejs-accessibility`）→ 组件（jest-axe / 直接 `axe.run()`）→ E2E（`@axe-core/playwright` / `cypress-axe`）→ CI（pa11y / Lighthouse / LHCI）
- 各页详解：[概念与标准](./guide-line/concepts-standards.md) / [axe-core 引擎](./guide-line/axe-core.md) / [单元组件](./guide-line/unit-component.md) / [端到端](./guide-line/e2e.md) / [CI 批量](./guide-line/ci-scanning.md) / [最佳实践](./guide-line/best-practices.md)

## 版本锚点

| 库 / 标准 | 版本 | 备注 |
| --------- | ---- | ---- |
| axe-core | **4.12.1**（2026-06-10） | 独立库最新 |
| jest-axe | **10.0.0**（2025-03） | **精确锁 axe-core 4.10.2**，重装不升 |
| vitest-axe | **0.1.0**（2022-10-21） | 依赖 `^4.4.2`；`1.0.0-pre.5` 从未正式发；jest-axe fork，半停滞 |
| @axe-core/playwright | **4.11.3**（2026-04-30） | **bundle axe-core ~4.11.4**，故滞后 4.12.1 |
| cypress-axe | **1.7.0**（2025-08） | axe-core 为 **peer（`^3\|\|^4` 需自装）**；peer cypress `^10–^15` |
| pa11y | **9.1.1**（~2026-02） | Node 20+，Puppeteer `^24` |
| pa11y-ci | **4.1.1**（~2026-05） | 多 URL / sitemap |
| lighthouse | **13.4.0**（~2026-06） | 依赖 `axe-core ^4.12.0` |
| @lhci/cli | **0.15.1**（~2025-06） | **内含 Lighthouse 12.6.1 ≠ 独立 13.4.0** |
| eslint-plugin-vuejs-accessibility | **2.5.0**（2026-02） | peer eslint `^5–^10`，~22 条规则 |
| @storybook/addon-a11y | 10.4.6 | 内置 axe-core |
| @testing-library/vue | 8.1.0 | role/label 查询促进 a11y |

## impact 四级（低 → 高）

| impact | 等级 | 示例规则 |
| ------ | ---- | -------- |
| `minor` | 轻微 | `empty-heading` |
| `moderate` | 中等 | `region`、`heading-order` |
| `serious` | 严重 | `aria-hidden-focus` |
| `critical` | 致命 | `button-name`、`aria-required-attr`、`aria-roles` |

> 规则 impact = 其失败检查中**最高**；通过结果 impact 为 `null`。CI 通常对 `critical` / `serious` 设硬门禁。

## tags（OR 并集过滤）

| 标签 | 含义 |
| ---- | ---- |
| `wcag2a` / `wcag2aa` / `wcag2aaa` | WCAG 2.0 各级 |
| `wcag21a` / `wcag21aa` | WCAG 2.1 新增各级 |
| `wcag22aa` | WCAG 2.2 新增 AA |
| `best-practice` | 非 WCAG 最佳实践（**库默认开启**） |
| `wcag111`（SC 号） | 对应成功准则 |
| `ACT` / `section508` / `EN-301-549` | 其它合规体系 |
| `experimental` | **默认禁用** |
| `cat.aria` / `cat.color` / `cat.forms` / `cat.keyboard` / `cat.semantics` / `cat.structure` | 类别分组 |

> 标签取**并集**：`['wcag2aa']` 不含 `wcag2a`，要 A+AA 必须**都列**。

## axe.run() 返回数组

| 数组 | 含义 | 断言 |
| ---- | ---- | ---- |
| `violations` | 确定失败 | 常用 `violations.toEqual([])` |
| `passes` | 通过 | — |
| `incomplete` | **有元素但判不了，需人工复核** | **不能当通过** |
| `inapplicable` | **无匹配元素，规则未运行** | **不是通过** |

## API 速查

```js
// axe-core（库本身，浏览器 / jsdom）
const r = await axe.run(document); // 返回 Promise，默认整个 document
await axe.run(c, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } });
await axe.run(c, { rules: { "color-contrast": { enabled: false } } }); // 关对比度

// jest-axe（需 expect.extend）
expect.extend(toHaveNoViolations);
expect(await axe(container)).toHaveNoViolations();

// @axe-core/playwright
const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
expect(r.violations).toEqual([]);

// cypress-axe（顺序：visit → injectAxe → checkA11y）
cy.visit("/"); cy.injectAxe();
cy.checkA11y(context, options, violationCallback, skipFailures);
```

## 命令对照

```bash
# pa11y（默认 htmlcs runner / WCAG2AA）
pa11y https://example.com                       # 单页扫描
pa11y https://example.com --runner axe          # 切 axe 引擎
pa11y https://example.com --reporter json --threshold 9

# pa11y-ci（多 URL / sitemap）
pa11y-ci                                         # 读 .pa11yci
pa11y-ci --threshold 5                           # 超阈值退出码 2
pa11y-ci --sitemap https://example.com/sitemap.xml

# Lighthouse / LHCI
npx lighthouse https://example.com --only-categories=accessibility  # 独立 13.4.0
lhci autorun                                     # LHCI（内含 LH 12.6.1）
```

## 官方资源

- WCAG 2.2：[https://www.w3.org/TR/WCAG22/](https://www.w3.org/TR/WCAG22/) ｜ 2.2 新增：[https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- WAI-ARIA 1.2：[https://www.w3.org/TR/wai-aria-1.2/](https://www.w3.org/TR/wai-aria-1.2/)
- axe-core：[https://github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core) ｜ API：[https://github.com/dequelabs/axe-core/blob/develop/doc/API.md](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)
- 覆盖率研究：[Deque 57%](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/) ｜ [GOV.UK / GDS](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/)
- jest-axe：[https://github.com/nickcolley/jest-axe](https://github.com/nickcolley/jest-axe) ｜ vitest-axe：[https://github.com/chaance/vitest-axe](https://github.com/chaance/vitest-axe)
- @axe-core/playwright：[https://playwright.dev/docs/accessibility-testing](https://playwright.dev/docs/accessibility-testing) ｜ cypress-axe：[https://github.com/component-driven/cypress-axe](https://github.com/component-driven/cypress-axe)
- pa11y：[https://github.com/pa11y/pa11y](https://github.com/pa11y/pa11y) ｜ pa11y-ci：[https://github.com/pa11y/pa11y-ci](https://github.com/pa11y/pa11y-ci)
- Lighthouse a11y 评分：[https://developer.chrome.com/docs/lighthouse/accessibility/scoring](https://developer.chrome.com/docs/lighthouse/accessibility/scoring) ｜ LHCI：[https://github.com/GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)
- eslint-plugin-vuejs-accessibility：[https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility](https://github.com/vue-a11y/eslint-plugin-vuejs-accessibility) ｜ Vue Testing Library：[https://testing-library.com/docs/vue-testing-library/intro](https://testing-library.com/docs/vue-testing-library/intro)
