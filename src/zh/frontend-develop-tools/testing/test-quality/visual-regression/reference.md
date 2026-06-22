---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Chromatic CLI 17.5 / Playwright 1.61 / pixelmatch 7.2 编写（版本核实于 2026-06-22）

## 速查

- **两条主线**：Chromatic 云端（story 即测试 + 托管基线 + 签核）/ Playwright 本地（`toHaveScreenshot()` + pixelmatch + 基线入库）
- **Playwright threshold 默认 `0.2`**；**pixelmatch 库默认 `0.1`**（别混）
- **基线命名**：Playwright `{name}-{browser}-{platform}.png`；首跑必失败并生成基线
- **更新基线**：Playwright `--update-snapshots`；Chromatic 评审点 Accept
- **完整说明见** [入门](./getting-started.md) / [概念与原理](./guide-line/concepts-principles.md) / [Chromatic](./guide-line/chromatic.md) / [Playwright 视觉](./guide-line/playwright-visual.md) / [其它工具](./guide-line/tools-comparison.md) / [最佳实践](./guide-line/best-practices.md)

## 版本锚点表

> npm registry 实测，2026-06-22。

| 包 | 最新版 | 发布日期 | 备注 |
| ---- | ---- | ---- | ---- |
| `chromatic`（CLI） | **17.5.0** | 2026-06-17 | 17.x 主线，活跃 |
| `@chromatic-com/storybook`（addon） | **5.2.1** | 2026-05-14 | 项目装 `^5.1.2`，可升（同主线兼容） |
| `playwright` | **1.61.0** | 2026-06-15 | 1.6x 主线，活跃 |
| `pixelmatch` | **7.2.0** | 2026-04-29 | Playwright 的 diff 引擎 |
| `backstopjs` | **6.3.25** | **2024-09-07** | **停滞 ~21 个月**，作经典像素 diff「反例」 |
| `@percy/cli`（BrowserStack） | **1.32.2** | 2026-06-18 | 企业向云对照，活跃 |
| `@applitools/eyes-playwright` | **1.47.9** | 2026-06-18 | 企业向 Visual AI 对照，活跃 |
| `@simonsmith/cypress-image-snapshot` | **10.0.4** | 2026-05-16 | **维护版 fork（v10），认准它** |
| `cypress-image-snapshot`（原版 jaredpalmer） | **4.0.1** | **2021-01-22** | **已弃**，5 年未更新 |

## Playwright `toHaveScreenshot` 配置项

> 来自 `PageAssertions` 官方表。`expect.toHaveScreenshot` 也可在 `playwright.config.ts` 的 `expect` 里设全局默认。

| 选项 | 类型 | 默认 | 说明 |
| ---- | ---- | ---- | ---- |
| `threshold` | number | **`0.2`** | 单像素 YIQ 色差容忍（0 严格~1 宽松）；**覆盖 pixelmatch 默认 0.1** |
| `maxDiffPixels` | number | 未设 | 全图允许「不同」的像素数 |
| `maxDiffPixelRatio` | number | 未设 | 全图允许「不同」的像素比例（0~1） |
| `mask` | Locator[] | 未设 | 这些区域用 `maskColor` 盖住 |
| `maskColor` | string | `#FF00FF`（品红） | mask 区域填充色 |
| `stylePath` | string \| string[] | 未设 | 截图前注入的自定义 CSS |
| `animations` | `"disabled"` \| `"allow"` | **`"disabled"`** | 默认冻结 CSS 动画/过渡 |
| `caret` | `"hide"` \| `"initial"` | **`"hide"`** | 默认隐藏文本光标 |
| `scale` | `"css"` \| `"device"` | `"css"` | 截图缩放基准 |
| `fullPage` | boolean | `false` | 整页截图（**全站大图是反模式**） |
| `clip` | {x,y,width,height} | 未设 | 只截指定矩形 |
| `omitBackground` | boolean | `false` | 透明背景 |
| `timeout` | number | 取 `TestConfig.expect` 的 timeout | 断言超时 |

## pixelmatch 关键选项

| 选项 | 默认 | 说明 |
| ---- | ---- | ---- |
| `threshold` | **`0.1`** | 单像素色差阈值（YIQ 感知色差，0~1，越小越敏感） |
| `includeAA` | **`false`** | `false` = **自动忽略抗锯齿像素**；`true` 才把抗锯齿算进 diff |
| `diffColor` | `[255,0,0]`（红） | 不同像素的着色 |
| `aaColor` | `[255,255,0]`（黄） | 抗锯齿像素的着色 |
| `alpha` | `0.1` | 未变像素的底图淡化透明度 |

## Chromatic 配置与命令

```bash
# 直接跑（token 从 Chromatic 项目设置拿，勿硬编码进仓库）
npx chromatic --project-token=<CHROMATIC_PROJECT_TOKEN>

# 开 TurboSnap 增量（只拍受影响 story）
npx chromatic --project-token=<TOKEN> --only-changed

# 强制全量重建（绕过 TurboSnap）
npx chromatic --project-token=<TOKEN> --force-rebuild

# 在 Storybook 内装 Visual Tests addon
npx storybook@latest add @chromatic-com/storybook
```

```json
// chromatic.config.json
{
  "onlyChanged": true,
  "externals": ["public/**", "**/*.sass"]
}
```

```yaml
# .github/workflows/chromatic.yml —— CI 集成
- uses: actions/checkout@v6
  with: { fetch-depth: 0 } # TurboSnap 需完整 Git 历史
- uses: chromaui/action@latest
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
    onlyChanged: true
```

| 配置/命令 | 作用 |
| --------- | ---- |
| `--only-changed` / `onlyChanged: true` | 开 TurboSnap 增量（靠依赖图 + Git diff） |
| `--force-rebuild` | 强制全量重建 |
| `--externals` / `externals` | 声明打包器之外处理的文件，改动触发全量 |
| `projectToken` / `CHROMATIC_PROJECT_TOKEN` | 必填，标识 Chromatic 项目 |
| `fetch-depth: 0` | checkout 完整历史，TurboSnap 前置条件 |
| `.storybook/modes.ts` 的 `allModes` | 定义多视口/主题，每个 mode 名一条独立基线 |

## Playwright 视觉命令

```bash
npx playwright test                    # 比对（首跑生成基线并失败）
npx playwright test --update-snapshots # 更新基线（设计有意变更后）
```

## Applitools Match Level 速查

| Match Level | 行为 |
| ----------- | ---- |
| **Strict**（默认） | 人眼级一致，检测文本/字体/颜色/图形/位置 |
| Layout | 只验证相对布局，忽略内容/颜色 |
| Content | 类 Strict，忽略颜色 |
| Ignore Colors | 忽略颜色，仍检测内容与布局 |
| Exact | 逐像素硬比（**不推荐常规用**） |
| Dynamic | 自动抑制动态数据差异 |

## 官方资源

- Playwright 视觉对比指南：[https://playwright.dev/docs/test-snapshots](https://playwright.dev/docs/test-snapshots)
- Playwright PageAssertions（`toHaveScreenshot` 全选项）：[https://playwright.dev/docs/api/class-pageassertions](https://playwright.dev/docs/api/class-pageassertions)
- pixelmatch（YIQ / includeAA / 默认值）：[https://github.com/mapbox/pixelmatch](https://github.com/mapbox/pixelmatch)
- Chromatic 文档总览：[https://www.chromatic.com/docs/](https://www.chromatic.com/docs/)
- Chromatic TurboSnap：[https://www.chromatic.com/docs/turbosnap/](https://www.chromatic.com/docs/turbosnap/)
- Chromatic modes：[https://www.chromatic.com/docs/modes/](https://www.chromatic.com/docs/modes/)
- Chromatic GitHub Actions：[https://www.chromatic.com/docs/github-actions/](https://www.chromatic.com/docs/github-actions/)
- Storybook 视觉测试 + addon：[https://storybook.js.org/docs/writing-tests/visual-testing](https://storybook.js.org/docs/writing-tests/visual-testing)
- BackstopJS（停滞核实）：[https://www.npmjs.com/package/backstopjs](https://www.npmjs.com/package/backstopjs)
- Percy（BrowserStack）：[https://www.browserstack.com/docs/percy/get-started/overview](https://www.browserstack.com/docs/percy/get-started/overview)
- Applitools Match Levels：[https://applitools.com/docs/common/cmn-eyes-match-levels.html](https://applitools.com/docs/common/cmn-eyes-match-levels.html)
- @simonsmith/cypress-image-snapshot：[https://github.com/simonsmith/cypress-image-snapshot](https://github.com/simonsmith/cypress-image-snapshot)
