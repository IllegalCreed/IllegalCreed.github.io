---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Chromatic 17.x / Playwright 1.61 编写

## 速查

- **本质**：渲染成**像素图（PNG）** → 与基线做**像素级 diff**，抓「肉眼可见的外观变化」（颜色/字体/间距/布局）
- **vs 快照测试（核心区分）**：快照测试比**序列化 DOM/文本**（`.snap`），DOM 不变样式变了抓不到；视觉回归比**渲染像素**，恰好补这块
- **流程五步**：capture（首跑生成基线）→ compare（与基线 diff）→ review（人工看 diff 图）→ approve（确认是预期变更则签核）→ update（更新基线）
- **首跑必「失败」**：没有基线 = 生成基线并报失败，这是设计而非 bug
- **两条主线**：**Chromatic** 云端（Storybook 团队，story 即测试、基线托管、团队签核）/ **Playwright** 本地（`toHaveScreenshot()`、基线入库、pixelmatch 引擎）
- **稳定化关键**：冻结动画、隐藏光标、mask 动态区域、按 OS/浏览器分别存基线、固定渲染环境（Docker）

## 视觉回归测试是什么

视觉回归测试统计「这次渲染出来的样子，和上次基线比有没有变」。它把组件/页面真正渲染成 **PNG**，再逐像素比对，专门盯住那些**肉眼能看出来、但 DOM 结构没动**的变化：

- 改了一行 CSS（`padding: 8px` → `12px`），DOM 一字未变，但视觉上挪位了
- 换了字体、调了颜色、动了阴影、布局在某个视口下漂了
- 第三方组件升级后默认样式悄悄变了

这些都不改 DOM 结构，因此 **DOM 快照测试看不到**，而视觉回归一比图就暴露。

## 和快照测试的区别（像素 vs DOM）

这是本叶最该记牢的一条区分。二者**名字像、定位完全不同**：

| 维度 | 快照测试（Snapshot Testing） | 视觉回归测试（本叶） |
| ---- | ---------------------------- | -------------------- |
| 比什么 | 序列化的 **DOM/组件树/数据结构**（文本） | 渲染后的**真实像素图（PNG）** |
| 存什么 | `.snap` 文本文件，逐字符比 | `.png` 图片，逐像素 diff |
| 能抓 | 结构/文本变化（标签增删、文案改动） | 外观变化（颜色、字体、间距、布局漂移） |
| 抓不到 | **CSS 级视觉变化**（DOM 不变样式变了） | 不渲染像素的纯结构断言 |
| 典型 API | Jest/Vitest `toMatchSnapshot()`、Playwright `expect(value).toMatchSnapshot()` | Chromatic story、Playwright `expect(page).toHaveScreenshot()` |

::: warning 别把两者当同义词
「快照测试」默认指 **DOM/序列化文本**快照；「视觉回归 = 像素级快照」。同样叫「快照」，一个比文本、一个比像素。Playwright 里甚至两个 API 并存：`toMatchSnapshot()` 比文本/二进制、`toHaveScreenshot()` 比截图——别用混。
:::

## 通用流程：capture → compare → review → approve → update

不管用哪条主线，视觉回归都是这套基线工作流：

1. **capture**：首次运行，渲染并落盘**基线（baseline / golden）**图。
2. **compare**：后续每次运行，渲染当前图，与基线做像素 diff，产出 diff 图（变化像素高亮）。
3. **review**：人工看 diff 图，判断这是「预期的改进」还是「意外的回归」。
4. **approve / accept**：确认是预期变更，则签核接受。
5. **update**：把基线更新为新图（Chromatic 点 Accept；Playwright 跑 `--update-snapshots`），提交。

::: tip 首跑「失败」是正常的
**首次运行没有基线 = 必然报「失败」并生成基线**，这是设计而非 bug。把基线提交后再跑，才会进入正常的 compare 阶段。
:::

## 两条主线

### 主线 A — Chromatic（云端，Storybook 生态）

Storybook 团队出品。每个 story 自动变成测试用例，**一次运行同时跑视觉 + 交互（play 函数）+ 可访问性（axe）**；基线托管在 Chromatic 云端，评审界面逐快照 Accept/Deny。适合已有 Storybook、想要团队签核与跨端矩阵的项目。详见 [Chromatic 云端方案](./guide-line/chromatic.md)。

### 主线 B — Playwright（本地，免费）

用 `expect(page).toHaveScreenshot()` 截图比对，引擎是 pixelmatch，自带连拍稳定化、默认冻结动画。基线 PNG 随仓库走（文件名含浏览器+平台，如 `*-chromium-darwin.png`）。适合不想接云、想把视觉测试并进现有 E2E 的项目。详见 [Playwright 视觉对比](./guide-line/playwright-visual.md)。

## 最小例

**Playwright（本地）**：

```ts
// some.spec.ts
import { test, expect } from "@playwright/test";

test("首页视觉", async ({ page }) => {
  await page.goto("/");
  // 首跑生成基线 home.png 并报失败；提交基线后再跑才会比对
  await expect(page).toHaveScreenshot("home.png");
});
```

```bash
npx playwright test                    # 比对（首跑生成基线）
npx playwright test --update-snapshots # 设计有意变更后更新基线
```

**Chromatic（云端，已有 Storybook）**：

```bash
# 把每个 story 送云端拍照比对，token 在 Chromatic 项目设置里拿
npx chromatic --project-token=<CHROMATIC_PROJECT_TOKEN>
```

> 本项目现状：`packages/ui` 已装 `@chromatic-com/storybook` addon 与 `playwright`，**只差 `CHROMATIC_PROJECT_TOKEN` + CI workflow** 就能真正跑 Chromatic（见 [Chromatic 云端方案](./guide-line/chromatic.md)）。

## 下一步

- [概念与像素 diff 原理](./guide-line/concepts-principles.md)：vs 序列化快照、pixelmatch + YIQ 色差 + 抗锯齿、baseline 工作流、flaky 来源与稳定化
- [Chromatic 云端方案](./guide-line/chromatic.md)：story 即测试、TurboSnap 增量、modes 多端、CI 与 `@chromatic-com/storybook` addon
- [Playwright 视觉对比](./guide-line/playwright-visual.md)：`toHaveScreenshot()` 全选项、threshold（默认 0.2）、连拍稳定化、按 OS 命名基线
- [其它工具对照](./guide-line/tools-comparison.md)：BackstopJS（停滞反例）、Percy/Applitools（企业云）、cypress-image-snapshot、Storybook 视觉 = Chromatic
- [Vue 实战与最佳实践](./guide-line/best-practices.md)：基线托管 vs 入库 + Docker、threshold 松紧、mask 动态内容、「全站截图」反模式、何时纳入 CI
