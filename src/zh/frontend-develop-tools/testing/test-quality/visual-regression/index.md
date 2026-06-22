---
layout: doc
---

# 视觉回归测试

视觉回归测试（Visual Regression Testing）把组件或页面**渲染成真实像素图（PNG）**，与历史基线做**像素级 diff**，专门捕捉「肉眼可见的外观变化」——颜色、字体、间距、布局漂移。它和「快照测试」不是同义词：快照测试比的是序列化的 **DOM/文本**结构，DOM 没变但 CSS 改了它抓不到；视觉回归比的是**渲染后的像素**，恰好补上这块盲区。流程统一是 **capture（首跑生成基线）→ compare（后续与基线 diff）→ review（人工看 diff 图）→ approve（确认是预期变更则签核）→ update（更新基线）**。前端两条主线：**Chromatic**（Storybook 团队的云端方案，story 即测试、基线托管云端、团队签核）与 **Playwright**（本地免费，`toHaveScreenshot()` + pixelmatch 引擎、基线随仓库走）；像素 diff 的底层算法多基于 **pixelmatch**（YIQ 感知色差 + 自动忽略抗锯齿）。

## 评价

**优点**

- **抓 CSS 级肉眼可见变化**：DOM 不变、样式变了也能发现，是 DOM 快照与单元测试都覆盖不到的维度
- **回归防线直观**：diff 图直接高亮变红的像素，reviewer 看图即可判断「改进 vs 回归」
- **与组件库天然契合**：每个 Storybook story 就是一个测试用例，组件/设计系统改动一跑全知
- **两条成熟路线**：云端（Chromatic/Percy/Applitools，托管基线 + 跨端矩阵 + 签核 UI）与本地（Playwright/BackstopJS，基线入库、零云依赖）各取所需
- **增量与稳定化成熟**：Chromatic TurboSnap 按依赖图只拍受影响 story；Playwright 内建连拍稳定化、冻结动画、mask 动态区域

**缺点**

- **天生易 flaky**：跨 OS/浏览器字体渲染、抗锯齿、动画、动态内容都会触发误报，需要刻意稳定化
- **跨环境基线分歧**：macOS 开发机生成的基线在 Linux CI 上常因字体/抗锯齿不一致而误报，本地路线几乎必须固定渲染环境（Docker）
- **慢且定位粗**：要真渲染再比图，比单元/快照测试慢；diff 只告诉你「哪里变了」，不告诉你「为什么」，**不能替代**单元/快照测试
- **阈值难调 + 反模式诱惑**：`threshold` 太紧致海量误报、太松致漏报；「整页全站截图」是高噪声反模式，应按组件/story 粒度截小图

## 文档地址

[Chromatic 文档](https://www.chromatic.com/docs/) ｜ [Playwright 视觉对比](https://playwright.dev/docs/test-snapshots)

## GitHub地址

[pixelmatch（像素 diff 引擎）](https://github.com/mapbox/pixelmatch)

## 幻灯片地址

<a href="/SlideStack/visual-regression-slide/" target="_blank">视觉回归测试</a>
