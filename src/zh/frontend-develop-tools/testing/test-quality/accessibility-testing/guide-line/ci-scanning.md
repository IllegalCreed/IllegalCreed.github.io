---
layout: doc
outline: [2, 3]
---

# CI 与批量扫描

> 基于 pa11y 9.x / lighthouse 13.4.0 / @lhci/cli 0.15.1 编写

## 速查

- **pa11y 9.x**：CLI + Node，两引擎 **htmlcs（HTML_CodeSniffer）+ axe**，**默认 runner = htmlcs、默认标准 WCAG2AA**，驱动 headless Puppeteer；切 axe 用 `--runner axe`
- **pa11y-ci 4.x**：扫多 URL / sitemap，配置 `.pa11yci`（JSON：`defaults` + `urls[]`），`--threshold`（默认 0，超出退出码 2）、`--sitemap`
- **Lighthouse 13.4.0**：a11y 类别**底层就是 axe-core**（依赖 `axe-core ^4.12.0`）；约 **73 条计分审计（axe 子集）** + 独立手动审计区；**评分 = 所有 a11y 审计 pass/fail（二元无部分分）的加权平均，权重取自 axe impact**
- **`@lhci/cli` 0.15.1**：**内含 Lighthouse 12.6.1 ≠ 独立 13.4.0**；断言 `off | warn | error`，门禁用 `'categories:accessibility': ['error', { minScore: 0.9 }]`

## pa11y

**`pa11y` 9.x**（9.1.1，~2026-02，Node 20+，Puppeteer `^24`）是命令行 + Node API 的可访问性扫描器，扫单个 URL 或本地 HTML。关键默认值：

- **两个引擎**：`htmlcs`（HTML_CodeSniffer）和 `axe`；
- **默认 runner = `htmlcs`**（不是 axe！）；
- **默认标准 = `WCAG2AA`**；
- 底层驱动 **headless Puppeteer / Chromium**。

```bash
# 默认用 htmlcs runner、WCAG2AA 标准
pa11y https://example.com

# 切换到 axe 引擎
pa11y https://example.com --runner axe

# JSON 报告 + 阈值（违规数 > 9 才算失败）
pa11y https://example.com --reporter json --threshold 9
```

::: warning pa11y 默认是 htmlcs，不是 axe
和前面各层（jest-axe / Playwright / Cypress 都基于 axe）不同，**pa11y 默认 runner 是 htmlcs**。要用 axe 规则得显式 `--runner axe`。这是 pa11y 与本笔记其它工具最大的引擎差异。
:::

## pa11y-ci

**`pa11y-ci` 4.x**（4.1.1，~2026-05）面向 CI，扫**多个 URL / sitemap**，用 `.pa11yci`（JSON）配置：

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "runners": ["axe"],
    "timeout": 30000
  },
  "urls": [
    "https://example.com/",
    "https://example.com/about",
    { "url": "https://example.com/login", "threshold": 2 }
  ]
}
```

```bash
# 跑配置里的 URL；超阈值退出码非 0
pa11y-ci

# 全局阈值（默认 0，超出退出码 2）
pa11y-ci --threshold 5

# 从 sitemap 批量抓 URL
pa11y-ci --sitemap https://example.com/sitemap.xml
```

> `--threshold` 默认 **0**（任何违规都失败），超出阈值时**退出码 2**，CI 据此阻断。`--sitemap` 适合站点页面多、不想手列 URL 的场景。

## Lighthouse 可访问性

**`lighthouse` 13.4.0**（~2026-06，依赖 `axe-core ^4.12.0`）的 **Accessibility 类别底层就是 axe-core**——`package.json` 依赖 `axe-core ^4.12.0` 是**最硬的证据**，评分文档也称权重「based on axe user impact」。

评分机制：

- 约 **73 条计分审计**（是 axe 规则的**子集**）+ 一个**独立的手动审计区**（提示哪些要人工测）；
- **评分 = 所有 a11y 审计 pass / fail（二元，无部分分）的加权平均**；
- **每条审计的权重取自 axe 的 impact**（impact 越高权重越大）。

::: warning 约 73 条是子集，仍需手动测
Lighthouse a11y 只跑约 73 条（axe 子集），且只给 pass/fail 二元结果——**得 100 分也不等于完全可访问**，键盘 / 焦点 / 屏幕阅读器仍要人工。Chrome 文档没有逐字的「powered by axe-core」「需手动测试」原文，但论点由 `axe-core ^4.12.0` 依赖与手动审计区成立。
:::

## LHCI（Lighthouse CI）门禁

**`@lhci/cli` 0.15.1**（~2025-06）把 Lighthouse 跑进 CI 并做断言门禁：

```js
// lighthouserc.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        // 可访问性低于 0.9 即 error（阻断 CI）
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },
  },
};
```

断言级别三档：**`off`（不检查）/ `warn`（警告不阻断）/ `error`（阻断 CI）**。

::: warning @lhci/cli 内含的 Lighthouse ≠ 独立 lighthouse
**`@lhci/cli` 0.15.1 内含的是 Lighthouse 12.6.1，不是独立的 lighthouse 13.4.0**。两者版本不同步——本地 `npx lighthouse` 用的是 13.4.0，CI 里 LHCI 跑的是 12.6.1，规则与评分可能有细微差异。排查「本地和 CI 分数对不上」时先看这点。
:::

## 小结

| 工具 | 引擎 | 适用 | 门禁方式 |
| ---- | ---- | ---- | -------- |
| pa11y | **htmlcs（默认）/ axe** | 单页扫描 | `--threshold` |
| pa11y-ci | 同上 | 多 URL / sitemap | `.pa11yci` + `--threshold`，退出码 2 |
| Lighthouse | **axe-core 子集（~73 条）** | 综合评分 | 本地查看 |
| LHCI | Lighthouse 12.6.1（≠ 13.4） | CI 门禁 | `['error', { minScore }]` |
