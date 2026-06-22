---
layout: doc
outline: [2, 3]
---

# 概念与像素 diff 原理

> 基于 pixelmatch 7.2 编写

## 速查

- **视觉回归 vs 序列化快照**：前者比**渲染像素图（PNG）**、后者比**序列化 DOM/文本**（`.snap`）；DOM 不变样式变了只有视觉回归抓得到
- **pixelmatch 色差**：用 **YIQ NTSC 色彩空间的感知色差**（Kotsarenko & Ramos 2010），不是 RGB 直接相减
- **`threshold`**：单像素判「不同」的色差阈值，0~1，**pixelmatch 库默认 0.1**（Playwright `toHaveScreenshot` 覆盖为 0.2，别混）
- **抗锯齿**：`includeAA` **默认 false** = **自动检测并忽略抗锯齿边缘像素**，是「少误报」的关键机制；设 `true` 才把抗锯齿算进 diff
- **diff 着色**：`diffColor` 默认红 `[255,0,0]`、`aaColor` 默认黄 `[255,255,0]`、`alpha` 默认 0.1（未变像素淡化底图）
- **基线流程**：capture → compare → review → approve → update；**首跑无基线必「失败」并落盘**
- **flaky 主因**：跨 OS/浏览器字体渲染、动画未冻结、动态内容、滚动条/光标、子像素抗锯齿差异 → 基线须按 OS/浏览器分文件存

## 视觉回归 ≠ 序列化快照

两者都叫「快照」，但比的东西根本不同——这是理解视觉回归的起点：

- **快照测试（Snapshot Testing）**：把组件渲染树 / DOM 结构 / 数据结构**序列化成文本**，存进 `.snap` 文件，下次**逐字符**比对。Jest/Vitest 的 `toMatchSnapshot()`、Playwright 的 `expect(value).toMatchSnapshot()` 都属此类——比的是**结构/文本**，**不渲染像素**。
- **视觉回归测试**：把组件/页面渲染成**真实像素图（PNG）**，做**像素级 diff**。捕捉的是「肉眼可见的外观变化」。

```
改了 CSS：.btn { padding: 8px → 12px }

DOM 序列化快照：  <button class="btn">OK</button>   ← 一字未变，快照测试「通过」（漏掉了！）
渲染后的像素：    [按钮变大、文字挪位]              ← 像素 diff 报红，视觉回归「抓到」
```

::: warning 一句话纠偏
**「快照测试」默认指 DOM/序列化文本快照；「视觉回归 = 像素级快照」，二者不是同义词。** DOM 不变但 CSS 变了，只有视觉回归能抓到。
:::

## 像素 diff 原理（pixelmatch）

pixelmatch 是 Playwright、jest-image-snapshot 等工具底层的像素比对引擎，理解它就理解了大半个「视觉 diff」。

### YIQ 感知色差，而非 RGB 相减

pixelmatch **不是**把两个像素的 RGB 直接相减取差，而是先转到 **YIQ（NTSC 电视）色彩空间**，用其中的**感知色差**度量（基于 Kotsarenko & Ramos 2010 论文）。YIQ 的 Y 分量贴近人眼对亮度的敏感度，因此这个度量比 RGB 欧氏距离**更接近「人眼看不看得出差异」**的判断，能在「数值有差但人眼无感」时少报。

### threshold：单像素的「算不算不同」阈值

```ts
// pixelmatch 签名
pixelmatch(img1, img2, output, width, height, { threshold: 0.1 });
```

- `threshold`（0~1）：每个像素被判定为「不同」的**色差阈值**，**越小越敏感**。
- **pixelmatch 库自身默认是 `0.1`**。

::: warning threshold 默认值「双标」——高频易错
**pixelmatch 库默认 `threshold = 0.1`；但 Playwright `toHaveScreenshot` 把它覆盖成 `0.2`。** 二者都用 YIQ 色差，默认数值却不同。被问「默认 threshold」时务必区分「谁的默认」——pixelmatch 是 0.1，Playwright 视觉对比是 0.2。详见 [Playwright 视觉对比](./playwright-visual.md)。
:::

### 抗锯齿处理：默认忽略边缘像素（少误报的关键）

文字、圆角、斜线的边缘会有**抗锯齿（anti-aliasing）**——半透明过渡像素。它们在不同渲染环境下极易有细微差，是误报大户。pixelmatch 对此有专门处理：

- `includeAA` **默认 `false`** = **自动检测并忽略抗锯齿边缘像素**（基于 Vyšniauskas "Anti-aliased Pixel and Intensity Slope Detector" 算法）。
- 设 `includeAA: true` 才把抗锯齿像素也算进 diff。

::: warning 别把 `includeAA: false` 理解反了
`includeAA` 默认 `false` 表示**默认忽略抗锯齿像素**（检测到就跳过），**不是**「默认包含抗锯齿」。这正是视觉回归「少误报」的核心机制之一。
:::

### diff 输出的着色约定

pixelmatch 输出一张 diff 图，用颜色标出差异类型（默认值）：

| 选项 | 默认 | 含义 |
| ---- | ---- | ---- |
| `diffColor` | `[255, 0, 0]`（红） | 判定为**不同**的像素 |
| `aaColor` | `[255, 255, 0]`（黄） | 被识别为**抗锯齿**的像素 |
| `alpha` | `0.1` | 未变像素的底图淡化透明度（让差异更醒目） |

看 diff 图时：**红 = 真不同，黄 = 抗锯齿（通常无害）**。

## baseline / golden 基线工作流

「基线（baseline）」也叫「golden（黄金图）」，是判断「变没变」的参照。五步循环：

1. **capture**：首跑渲染并落盘基线图。
2. **compare**：后续渲染当前图，与基线 pixelmatch diff，超阈值即失败并产出 diff 图。
3. **review**：人工看 diff 图，分辨「改进」与「回归」。
4. **approve / accept**：确认是预期变更，签核接受。
5. **update**：基线更新为新图，提交。

::: tip 首跑必「失败」并落盘基线
**首次运行没有基线 = 必然报「失败」并生成基线**——这是设计而非 bug。必须把基线提交后再跑，才进入正常 compare。CI 里若漏提交基线，会一直「首跑失败」。
:::

## 为何视觉回归易 flaky（不稳定）

视觉回归天生比单元/快照测试更易「无故变红」，常见来源：

- **跨 OS/浏览器字体渲染不一致**：同一文字在 macOS / Linux / Windows 上抗锯齿、字形微调不同（**最大坑**）。
- **动画/过渡未冻结**：CSS 动画、loading 转圈在截图瞬间停在不同帧。
- **动态内容**：时间/日期、随机数、随机头像、广告、轮播。
- **滚动条、光标闪烁、`requestAnimationFrame` 时序**：截图时机差一点，像素就不同。
- **子像素抗锯齿差异、GPU/无头模式差异**：硬件与渲染管线带来的细微抖动。

### 稳定化手段

| 来源 | 对策 |
| ---- | ---- |
| 字体跨 OS | **按 OS/浏览器分别存基线**（如 Playwright 文件名带 `-chromium-darwin`）；本地基线用与 CI 一致的 **Docker** 渲染环境生成 |
| 动画/过渡 | 冻结动画（Playwright `animations: 'disabled'` 默认就冻结） |
| 光标 | 隐藏文本光标（Playwright `caret: 'hide'` 默认） |
| 动态内容 | **mask 动态区域**（用纯色块盖住），而非放松全局 threshold |
| 截图时机 | **连拍直到两帧一致再比**（Playwright 内建此稳定化） |
| 阈值噪声 | 适度调 `threshold` + 用 `maxDiffPixelRatio` 兜底容忍少量像素 |

这些机制大多在 [Playwright 视觉对比](./playwright-visual.md) 与 [Vue 实战与最佳实践](./best-practices.md) 里有具体配置。

## 下一步

- [Chromatic 云端方案](./chromatic.md)：云端如何托管基线、用依赖图做增量、按 mode 分独立基线
- [Playwright 视觉对比](./playwright-visual.md)：`toHaveScreenshot` 各选项默认值、连拍稳定化、pixelmatch 在 Playwright 里的体现
- [Vue 实战与最佳实践](./best-practices.md)：稳定化与反模式的工程落地
