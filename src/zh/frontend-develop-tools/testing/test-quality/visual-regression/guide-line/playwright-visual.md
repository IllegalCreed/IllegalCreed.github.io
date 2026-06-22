---
layout: doc
outline: [2, 3]
---

# Playwright 视觉对比

> 基于 Playwright 1.61 编写

## 速查

- **`toHaveScreenshot()` vs `toMatchSnapshot()`**：前者**截图做视觉比对**、自带连拍稳定化；后者比**文本/二进制**、**无**截图稳定化。视觉回归用 `toHaveScreenshot`
- **`threshold` 默认 `0.2`**（⚠️ 高频易错）：单像素 YIQ 色差容忍（0 严格~1 宽松）；**pixelmatch 库自身默认 0.1，Playwright 覆盖成 0.2**
- **`maxDiffPixels` / `maxDiffPixelRatio`**：全图允许差异的**像素数 / 比例**——和 `threshold`（单像素色差）语义不同，常被混
- **稳定化默认**：`animations: 'disabled'`（冻结动画）、`caret: 'hide'`（隐藏光标）、`maskColor: '#FF00FF'`（品红遮罩）
- **连拍稳定化**：连续截图直到**两帧一致**才落盘/比对，减少 flaky
- **基线命名**：`{testName}-{browserName}-{platform}.png`（如 `home-chromium-darwin.png`）——**按浏览器+平台分文件**
- **更新基线**：`npx playwright test --update-snapshots`；**首跑无基线必失败并生成图**
- **引擎**：pixelmatch；`mask` 遮动态区域、`stylePath` 注入 CSS 中和易变元素

## `toHaveScreenshot()` vs `toMatchSnapshot()`

Playwright 里有两个名字像、用途不同的断言，**别用混**：

| 断言 | 比什么 | 稳定化 | 用于 |
| ---- | ------ | ------ | ---- |
| `expect(page).toHaveScreenshot()` | **截图**做像素视觉比对 | **有**（连拍直到两帧一致） | 视觉回归 |
| `expect(value).toMatchSnapshot()` | **文本 / 任意二进制数据** | **无**截图稳定化 | 文本/数据快照 |

::: warning 不是同名同义
**视觉回归用 `toHaveScreenshot`，文本/数据快照用 `toMatchSnapshot`。** 只有前者会反复截图、等画面稳定；后者拿到啥比啥。把视觉测试写成 `toMatchSnapshot()` 会失去全部稳定化能力。
:::

## `toHaveScreenshot` 全部配置项与默认值

来自 Playwright `PageAssertions` 官方表：

| 选项 | 类型 | 默认 | 说明 |
| ---- | ---- | ---- | ---- |
| `threshold` | number | **`0.2`** | 单像素 YIQ 色差容忍（0 严格~1 宽松） |
| `maxDiffPixels` | number | 未设 | 全图允许「不同」的**像素数** |
| `maxDiffPixelRatio` | number | 未设 | 全图允许「不同」的**像素比例**（0~1） |
| `mask` | Locator[] | 未设 | 这些区域用 `maskColor` 盖住（遮动态内容） |
| `maskColor` | string | `#FF00FF`（品红） | mask 区域的填充色 |
| `stylePath` | string \| string[] | 未设 | 截图前注入的自定义 CSS 文件 |
| `animations` | `"disabled"` \| `"allow"` | **`"disabled"`** | 默认冻结 CSS 动画/过渡 |
| `caret` | `"hide"` \| `"initial"` | **`"hide"`** | 默认隐藏文本输入光标 |
| `scale` | `"css"` \| `"device"` | `"css"` | 截图缩放基准 |
| `fullPage` | boolean | `false` | 是否整页截图 |
| `clip` | {x,y,width,height} | 未设 | 只截指定矩形 |
| `omitBackground` | boolean | `false` | 是否透明背景 |
| `timeout` | number | 取 `TestConfig.expect` 的 timeout | 断言超时 |

## ⚠️ threshold 默认 0.2，不是 0.1

这是本叶最容易答错的一点：

- **Playwright `toHaveScreenshot` 的 `threshold` 默认 `0.2`**。
- **底层 pixelmatch 库自己的默认是 `0.1`**。
- **Playwright 覆盖了 pixelmatch 的默认值**：二者都用 YIQ 色彩空间，但默认数值不同。

> 被问「Playwright 视觉对比默认 threshold 是多少」答 **0.2**；被问「pixelmatch 库默认 threshold」答 **0.1**。出题/排错时务必区分「谁的默认」。pixelmatch 原理见 [概念与像素 diff 原理](./concepts-principles.md)。

### threshold 与 maxDiffPixels/Ratio 不是一回事

这两类参数语义不同，常被混：

- **`threshold`**：判定**单个像素**「算不算变了」的色差容忍（0~1，YIQ）。
- **`maxDiffPixels` / `maxDiffPixelRatio`**：在「已判定为不同的像素」总数/比例上设上限——**全图层面**的兜底。`maxDiffPixels` 即喂给 pixelmatch 的那个阈值。

典型组合：`threshold` 控单像素灵敏度，`maxDiffPixelRatio` 容忍「少量像素不同但限制总比例」。

## 内建稳定化：连拍 + 冻结动画 + 隐藏光标

`toHaveScreenshot()` 默认就做了几件减 flaky 的事：

- **连拍直到两帧一致**：官方描述为 "took a bunch of screenshots until two consecutive screenshots matched, and saved the last screenshot to file system"——**连续截图直到两帧一致**才落盘/比对，避开动画/异步渲染造成的抖动。
- **`animations: 'disabled'`（默认）**：把 CSS 动画/过渡设为有限态（冻结），不让它停在随机帧。
- **`caret: 'hide'`（默认）**：隐藏文本输入光标，避免光标闪烁导致像素差。

::: tip 首跑必失败，是设计
和所有视觉回归一样，**首次运行没有基线 = 失败并生成基线图**。须提交基线后再跑才会通过。
:::

## golden 基线按「浏览器+平台」命名

Playwright 基线文件名形如：

```
{testName}-{browserName}-{platform}.png
例：home-chromium-darwin.png、example-test-1-chromium-darwin.png
```

**按浏览器 + 平台分文件**，因为渲染/字体跨平台不一致（见 [概念与原理 · flaky](./concepts-principles.md#为何视觉回归易-flaky-不稳定)）。

::: warning macOS 基线在 Linux CI 上找不到/不一致
本地（macOS）生成的是 `*-chromium-darwin.png`，CI（Linux）找的是 `*-chromium-linux.png`——**后缀不同**，CI 上要么没有对应基线（首跑失败），要么即便有也因字体/抗锯齿渲染不同而误报。对策：**在与 CI 一致的 Docker 环境生成/更新基线**（Playwright 官方提供容器镜像），或只在 CI 容器内更新。详见 [Vue 实战与最佳实践](./best-practices.md)。
:::

## 更新基线

```bash
npx playwright test                    # 比对（首跑生成基线并失败）
npx playwright test --update-snapshots # 设计有意变更后更新基线
```

**别手改 PNG**——设计有意改动时跑 `--update-snapshots` 让 Playwright 重新生成，再提交。

## 最小配置示例

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 允许全图 1% 像素不同（兜底）
      threshold: 0.2, // 单像素 YIQ 色差阈值（默认值，写出来更清晰）
      animations: "disabled", // 冻结动画（默认）
    },
  },
});
```

```ts
// some.spec.ts
import { test, expect } from "@playwright/test";

test("首页视觉", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("home.png", {
    mask: [page.locator(".timestamp")], // 遮动态时间戳，避免误报
    maxDiffPixels: 100, // 容忍最多 100 个不同像素
  });
});
```

要点回顾：

- **`mask`**：传 Locator 数组，对应区域用 `maskColor`（默认 `#FF00FF`）覆盖，遮时间戳/头像/广告等动态内容——**优于放松全局 threshold**（后者会同时放过真实回归）。
- **`stylePath`**：注入自定义 CSS（如对易变元素设 `visibility: hidden`）来中和它们。
- **引擎是 pixelmatch**：`maxDiffPixels` 即喂给 pixelmatch 的阈值，`threshold` 即 pixelmatch 的单像素阈值（但默认被覆盖为 0.2）。

## 下一步

- [概念与像素 diff 原理](./concepts-principles.md)：pixelmatch 的 YIQ 色差与抗锯齿处理（threshold 的来历）
- [Chromatic 云端方案](./chromatic.md)：不想入库基线、想要团队签核时的云端路线
- [Vue 实战与最佳实践](./best-practices.md)：Docker 固定渲染、mask 动态内容、「全站截图」反模式
