---
layout: doc
outline: [2, 3]
---

# Vue 实战与最佳实践

> 基于 Vue 3 + Vite + Storybook 10.x + Chromatic / Playwright 1.61 编写

## 速查

- **两条落地路线**：Playwright 截组件页（**本地、基线入库**）/ Storybook + Chromatic（**云端、基线托管**）
- **基线该不该入库**：本地工具（Playwright/BackstopJS）**入库**但**必须固定渲染环境**；云端工具（Chromatic/Percy）**托管云端不入库**
- **跨 OS 分歧 → Docker**：macOS（`*-darwin.png`）与 Linux CI（`*-linux.png`）字体/抗锯齿不同会误报；**用与 CI 一致的 Docker 镜像生成基线**
- **threshold 松紧**：太紧（→0）抗锯齿噪声海量误报、太松（→1）漏真实回归；配 `maxDiffPixelRatio` 兜底
- **动态内容用 mask**：时间戳/随机头像/广告/轮播 → `mask`（Playwright）/ ignore region（Applitools），**别放松全局 threshold**
- **分工**：单元（逻辑）/ 快照（DOM 结构）/ 视觉回归（外观）互补，**视觉回归不能替代**单元/快照
- **反模式**：「全站/整页截图」噪声大难定位，应**按组件/story 粒度截小图**
- **何时纳入 CI**：组件库/设计系统稳定后，PR 触发、reviewer 签核 diff

## Vue 3 组件做视觉回归：两条路

### 路线 A — Playwright 截组件页（本地免费）

把 Vue 组件挂到一个独立页面（或直接截 Storybook 的 iframe 页 / 应用页），用 `toHaveScreenshot()` 拍图比对。基线随仓库走（`*-chromium-darwin.png`）。**适合**不想接云、想把视觉测试并进现有 Playwright E2E 的场景。

```ts
// component-visual.spec.ts
import { test, expect } from "@playwright/test";

test("Button 主色态视觉", async ({ page }) => {
  // 截 Storybook 的 story iframe（也可挂独立预览页）
  await page.goto("/iframe.html?id=button--primary");
  await expect(page).toHaveScreenshot("button-primary.png");
});
```

配置与选项见 [Playwright 视觉对比](./playwright-visual.md)。

### 路线 B — Storybook + Chromatic（云端，项目方向）

每个 `*.stories.ts` 就是一个测试用例；`@chromatic-com/storybook` addon 在 Storybook 内跑/看 diff，CI 用 `chromaui/action` 跑。基线托管云端、团队签核。

```bash
npx chromatic --project-token=<CHROMATIC_PROJECT_TOKEN> --only-changed
```

::: tip 本项目接 Chromatic 只差两步
`packages/ui` 已装 `@chromatic-com/storybook` addon，**只差**：① 配 `CHROMATIC_PROJECT_TOKEN`；② 加 `chromaui/action` workflow。addon 已就位，无需改组件代码。详见 [Chromatic 云端方案](./chromatic.md)。
:::

## 基线该不该入库

| 工具类型 | 基线去向 | 注意 |
| -------- | -------- | ---- |
| **本地像素**（Playwright / BackstopJS） | **入库**，随 PR 一起 review | **必须固定渲染环境**，否则跨机噪声大 |
| **云端**（Chromatic / Percy） | **托管云端，不入库** | 避免大二进制污染仓库 + 跨机渲染分歧 |

本地路线把 PNG 提交进仓库，好处是 diff 随 PR 可见、零云依赖；代价是仓库里多一堆二进制，且**对渲染环境一致性要求极高**。

## 跨 OS 基线分歧 → Docker 固定渲染环境

本地视觉测试**最大的坑**：开发机（macOS，生成 `*-darwin.png`）与 CI（Linux，找 `*-linux.png`）的**字体、抗锯齿不同**，导致同一组件在两边渲染出不同像素 → 误报或基线缺失。

**对策**：

- **用与 CI 完全一致的 Docker 镜像生成基线**（Playwright 官方提供容器镜像），让基线的渲染环境与 CI 一致。
- 或者**干脆只在 CI 容器内生成/更新基线**，开发机不直接落盘基线。

::: warning 别在 macOS 上更新基线又指望 Linux CI 通过
直接在 macOS 跑 `--update-snapshots` 提交的是 `-darwin` 基线，Linux CI 用不上。**视觉测试的基线生成环境必须 = CI 渲染环境**。
:::

## threshold 设太松 / 太紧

- **太紧（threshold → 0）**：抗锯齿、亚像素噪声就能触发海量误报，测试变 flaky，没人信。
- **太松（threshold → 1）**：放过真实的视觉回归，等于没测。

需按项目实际调，并**配合 `maxDiffPixelRatio` 兜底**——容忍少量像素不同，但限制差异占全图的总比例。参数语义区别见 [Playwright 视觉对比](./playwright-visual.md#threshold-与-maxdiffpixels-ratio-不是一回事)。

## 动态内容用 mask，而非放松全局 threshold

时间戳、随机头像、广告位、动画、轮播——这些区域天生每次都变。正确做法是**局部遮掉**：

- Playwright：`mask: [page.locator('.timestamp')]`（用 `maskColor` 盖住）。
- Applitools：ignore region / `Layout` Match Level。
- jest-image-snapshot 系：调 `comparisonMethod` 等。

::: warning 别用「放松全局 threshold」对付动态内容
为了让一块动态区域过测而把全局 `threshold` 调大，会**同时放过整张图里真实的回归**——捡了芝麻丢了西瓜。动态区域要**局部 mask**，全局阈值保持严格。
:::

## 视觉回归 ≠ 单元 ≠ 快照（分工）

三类测试互补，各管一段：

| 测试 | 管什么 | 特点 |
| ---- | ------ | ---- |
| **单元测试** | 逻辑 / 纯函数 / 状态 | 快、定位准 |
| **快照测试（DOM/序列化）** | 组件输出**结构**没乱 | 比文本，无像素噪声 |
| **视觉回归（像素）** | 外观 / 样式 / 布局没坏 | 抓 CSS 级肉眼可见变化 |

::: warning 视觉回归不能替代单元/快照测试
视觉回归**慢、易 flaky、定位粗**（只告诉你「哪块变红」，不告诉你「为什么」）。它只负责「外观没坏」，**替代不了**单元测试的逻辑验证与快照测试的结构校验。三者是互补，不是取代。
:::

## 反模式：「全站截图」

::: warning 整页 `fullPage` 大图做视觉回归 = 反模式
对整页大图做视觉回归，**任意一处小改动都触发整图 diff**：噪声爆炸、难定位（不知道是哪个组件变的）、审图累。**应按组件/区块粒度截小图**——Storybook 的 story 级正好是这个粒度，稳定且可定位「是哪个组件回归了」。
:::

## 何时纳入 CI

- **时机**：组件库 / 设计系统**稳定后**再纳入——早期 UI 频繁变动会让视觉测试天天「红」。
- **触发**：PR 触发视觉测试，diff 由 reviewer 签核（Chromatic Accept/Deny；Playwright 审 PR 里的 PNG 变化）。
- **层级**：视觉测试更适合放在**组件/设计系统层**（story 级），而非堆进单元测试里。

### 设计有意变更后如何更新基线

设计**有意**改动 → 跑测试出 diff → 人工确认是「改进」→ 更新基线：

- **Chromatic**：评审界面点 **Accept**。
- **Playwright**：跑 `npx playwright test --update-snapshots`。

**别手改 PNG**——让工具重新生成基线再提交。

## 下一步

- [概念与像素 diff 原理](./concepts-principles.md)：flaky 来源与稳定化机制的原理
- [Chromatic 云端方案](./chromatic.md)：云端托管 + 签核 + TurboSnap 增量
- [Playwright 视觉对比](./playwright-visual.md)：本地路线的全部配置项与默认值
