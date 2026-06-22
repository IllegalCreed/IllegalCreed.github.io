---
layout: doc
outline: [2, 3]
---

# 其它工具对照

> 基于 BackstopJS 6.3.25（2024-09 停滞）/ @percy/cli 1.32 / @applitools/eyes-playwright 1.47 / @simonsmith/cypress-image-snapshot 10.0 编写

## 速查

- **BackstopJS**：曾经经典的 **OSS 本地像素 diff**，最新 **6.3.25 / 2024-09-07**，停滞约 21 个月——**作「停更反例」**，新项目优先 Playwright（本地）/ Chromatic（云）
- **Percy（BrowserStack）**：企业向云，`@percy/cli` 1.32；业界认知是「**DOM 快照云端重渲染**」（⚠️ 官方 overview 未明文确认，谨慎表述）
- **Applitools Eyes**：企业向 **Visual AI**（模拟人眼，少误报），`eyes-playwright` 1.47；**默认 Match Level = Strict**，`Exact`（逐像素）反而不推荐常规用
- **cypress-image-snapshot**：认准维护版 **`@simonsmith/cypress-image-snapshot` v10**；原版 jaredpalmer 4.0.1（2021）**已弃**；**Cypress 无原生视觉回归**，`cy.screenshot()` 只截图不比对
- **Storybook 视觉 = Chromatic**：Storybook 自身不内建像素 diff
- **选型轴**：要不要**云端跨端矩阵 + 团队签核 UI** → 要则云端（Chromatic/Percy/Applitools），不要则本地（Playwright/BackstopJS）

## BackstopJS —— 经典像素 diff，但已停滞（反例）

- **版本/状态**：`backstopjs` 最新 **6.3.25，发布于 2024-09-07**，距今约 21 个月无新版——**停滞**。
- **定位**：曾经非常经典的 **OSS 本地像素 diff** 工具——基于 Puppeteer/Playwright 截图 + 图像比对，用 `backstop.json` 配置「场景（scenarios）」，本地/自托管运行。

::: warning 别把 BackstopJS 当「当前推荐」
BackstopJS 是了解视觉回归历史的好样本，但**已长期停更**。新项目应优先选**活跃**的方案：**本地用 Playwright**（`toHaveScreenshot`）、**云端用 Chromatic**。把 BackstopJS 当「现役首选」是过时认知。
:::

## Percy（BrowserStack）—— 企业向云对照

- **版本**：`@percy/cli` **1.32.2**（活跃）。
- **定位**：BrowserStack 旗下云端视觉测试。捕获快照后在云端**跨多浏览器 / 多响应式宽度**比对、像素级高亮 diff、提供 Web UI 评审签核、CI 集成。SDK 覆盖 Selenium / Playwright / Cypress / Puppeteer / Storybook 等，`@percy/cli` 提供较无侵入的接入。

::: warning 「DOM 快照云端重渲染」是业界认知，官方页未明文
业界普遍认为 Percy 采集 **DOM 快照（DOM 序列化）后在 Percy 云端统一渲染**（区别于在浏览器本地直接截原始像素），以此保证跨环境一致。**但 BrowserStack 官方 overview 页本次核实未明文确认该机制**——引用时宜表述为「业界认知 / 待官方页确认」，不要当成板上钉钉的官方定义。
:::

## Applitools Eyes —— 企业向 Visual AI 对照

- **版本**：`@applitools/eyes-playwright` **1.47.9**（活跃）。
- **Visual AI**：十余年迭代的图像比对算法，**模拟人眼**，只报「人会注意到的有意义差异」，从而降低误报、跨浏览器/设备/OS 更稳——**不是逐像素硬比**。

**Match Level（匹配级别，默认 Strict）**：

| Match Level | 行为 | 适用 |
| ----------- | ---- | ---- |
| **Strict**（默认） | 人眼级一致，检测文本/字体/颜色/图形/位置变化 | 大多数场景 |
| **Layout** | 只验证元素**相对布局**一致，忽略内容/颜色 | 动态内容多 |
| **Content** | 类 Strict，但忽略颜色变化 | 关注内容不关注配色 |
| **Ignore Colors** | 忽略颜色差异，仍检测内容与布局 | 主题/换肤 |
| **Exact** | **逐像素硬比**，连人眼不可见的渲染差异也敏感 | **不推荐常规用** |
| **Dynamic**（较新） | 自动识别并抑制动态数据（邮箱/日期/卡号等）的差异 | 含动态字段页面 |

::: warning 默认是 Strict，不是 Exact
Applitools 默认 Match Level 是 **Strict（人眼级）**；`Exact`（逐像素）反而**不推荐常规用**，因为它对人眼无感的渲染差异也报。这与「视觉回归就该逐像素」的直觉相反。另：旧资料里的 "IgnoreColors" 现写作 "Ignore Colors"，"Dynamic" 是较新加入——以官方 Match Levels 页为准。
:::

::: tip Ultrafast Grid（术语谨慎）
Applitools 常被提到的 **Ultrafast Grid / Ultrafast Test Cloud**：把**单个 DOM 快照在云端并行渲染到多浏览器/视口/设备组合**，一次采集多端覆盖。该术语来自 Applitools 通用文档与业界共识，本次 core-concepts 页未直接展开，引用时谨慎。
:::

## cypress-image-snapshot —— 认准维护版

::: warning 认准 `@simonsmith/cypress-image-snapshot`（v10）
- **维护版**：`@simonsmith/cypress-image-snapshot` **10.0.4**（v10 主线，活跃）。
- **原版**：`cypress-image-snapshot`（jaredpalmer）**4.0.1，停在 2021，已弃**（README 明确 "active development has ceased"，simonsmith 版是其 rewrite/fork）。
- **结论**：装包认准 `@simonsmith/cypress-image-snapshot`，别装到 5 年没动的原版。
:::

- 提供 `cy.matchImageSnapshot()` 命令做视觉 diff。
- 底层基于 **jest-image-snapshot（其内部用 pixelmatch）**，支持透传 jest-image-snapshot 选项，如 `comparisonMethod: 'ssim'`（结构相似度，另一种比对法）。

::: warning Cypress 无原生视觉回归
**Cypress 自身不内建视觉回归**：只有 `cy.screenshot()`，那只**截图、不比对**。要做像素 diff 必须靠第三方插件（如 `@simonsmith/cypress-image-snapshot`）。把 `cy.screenshot()` 当视觉测试是误解。
:::

## Storybook 视觉测试 = Chromatic

Storybook **本身不内建像素 diff**。它的官方视觉测试方案就是 **Chromatic**（`@chromatic-com/storybook` addon + Chromatic 云端）。所以「给 Storybook 加视觉回归」实践上等于「接 Chromatic」——详见 [Chromatic 云端方案](./chromatic.md)。

## 选型小结

| 工具 | 类型 | 状态 | 一句话 |
| ---- | ---- | ---- | ---- |
| **Playwright** | 本地像素 diff | 活跃 | 免费、基线入库、并进 E2E（[详见](./playwright-visual.md)） |
| **Chromatic** | 云端 | 活跃 | Storybook 团队、story 即测试、托管基线 + 签核（[详见](./chromatic.md)） |
| **BackstopJS** | 本地像素 diff | **停滞** | 经典反例，新项目别选 |
| **Percy** | 云端 | 活跃 | BrowserStack，跨端矩阵 + 签核 UI |
| **Applitools** | 云端 Visual AI | 活跃 | 模拟人眼、Match Level 可调、默认 Strict |
| **@simonsmith/cypress-image-snapshot** | Cypress 插件 | 活跃 | 补 Cypress 无原生视觉的空缺 |

选型主轴：**要不要云端跨端矩阵 + 团队签核 UI**——要就上云端（Chromatic/Percy/Applitools），只想本地零依赖就用 Playwright。

## 下一步

- [Chromatic 云端方案](./chromatic.md)：本项目方向的云端主线
- [Playwright 视觉对比](./playwright-visual.md)：本地免费主线
- [Vue 实战与最佳实践](./best-practices.md)：选定工具后的工程落地与反模式
