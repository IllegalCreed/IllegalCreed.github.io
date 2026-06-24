---
layout: doc
outline: [2, 3]
---

# art direction 与格式回退

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- `<picture>` = 零个或多个 `<source>` + **一个必需的 `<img>`** 兜底；浏览器选**第一个匹配的 source**，都不匹配用 `<img>`
- art direction（艺术化换图）：`<source media="(...)">` 按视口 / 主题换**不同裁切**的图（窄屏突出主体）
- 格式回退：`<source type="image/avif">` / `type="image/webp">`，浏览器跳过不支持的格式、选第一个能解码的
- 顺序原则：现代格式在前（AVIF → WebP → JPEG / PNG 兜底），`media` source 从窄到宽
- `<img>` 兜底**必须写**且带 `alt`：既是不支持 `<picture>` 的旧浏览器回退，也承载尺寸 / `alt`
- `media` 与 `sizes` **不要同时用**：`media` 是 art direction 场景，用了 `media` 就别在 `sizes` 里再写媒体条件
- 纯「换清晰度」（视网膜）别用 `<picture media>`，用 `<img srcset>` 的 `x` 描述符即可
- `object-fit` / `object-position` 写在**子 `<img>`** 上，不是 `<picture>` 上
- AVIF / WebP 比 JPEG 同质量小很多，`type` 回退能让浏览器**只下能解码的那份**，不浪费请求

## `<picture>` 的工作方式

单个 `<img>` 只能「换尺寸」。当你需要**换裁切**或**换格式**时，请出 `<picture>`：

```html
<picture>
  <source srcset="..." media="..." />
  <source srcset="..." type="..." />
  <img src="fallback.jpg" alt="..." />
</picture>
```

`<picture>` 本身不渲染任何东西，它的角色是「**选择器**」：浏览器自上而下检查每个 `<source>` 的 `srcset` / `media` / `type`，挑出**第一个匹配当前布局与设备能力**的那张去加载；如果所有 `<source>` 都不匹配、或浏览器根本不认识 `<picture>`，就回落到末尾 `<img>` 的 `src`。

::: warning `<img>` 兜底必须写
`<picture>` 里的 `<img>` 不是可选项——它有双重身份：① 给所有 `<source>` 都不匹配时兜底，也给不支持 `<picture>` 的旧浏览器兜底；② 承载图片的 `alt`、`width` / `height` 等属性。**漏写 `<img>`，整个 `<picture>` 不显示任何图。** 它必须放在所有 `<source>` 之后、`</picture>` 之前。
:::

## 用法一：art direction（按视口换裁切）

「艺术化方向」要解决的问题：一张横构图的风景照，桌面看主体清楚；缩到手机就成了「画面中央一个小小的人」。理想做法是**窄屏换成裁过的竖图、突出主体**。用 `<source media>`：

```html
<picture>
  <source media="(max-width: 600px)" srcset="hero-portrait.jpg" />
  <source media="(min-width: 601px)" srcset="hero-landscape.jpg" />
  <img src="hero-landscape.jpg" alt="团队在山顶合影" width="1200" height="800" />
</picture>
```

`media` 是媒体条件，浏览器选**第一个为真**的 `<source>`：窄屏用竖图、宽屏用横图。注意这与 `srcset` 的尺寸切换不同——这里换的是**不同的图（不同裁切）**，而非同一张图的大小。

`media` 也能按**主题**换图，比如亮暗模式各用一张 Logo：

```html
<picture>
  <source srcset="logo-dark.png" media="(prefers-color-scheme: dark)" />
  <source srcset="logo-light.png" media="(prefers-color-scheme: light)" />
  <img src="logo-light.png" alt="产品 Logo" width="160" height="40" />
</picture>
```

::: tip `media` 与 `sizes` 不要同时上
官方明确：`media` 只用于 art direction 场景；一旦用了 `media`，就**别再在 `sizes` 里写媒体条件**。两者都想表达「按视口选」会互相打架。纯粹的「同图换尺寸」请回到 [响应式图片](./responsive-images) 的 `<img srcset sizes>`，不必动用 `<picture media>`。
:::

## 用法二：格式回退（AVIF / WebP 优先，旧格式兜底）

现代图片格式 **AVIF** 和 **WebP** 在同等画质下比 JPEG / PNG 小得多（AVIF 通常最省），能显著降流量。但不是所有浏览器都支持，于是用 `<source type>` 做「优先用新格式、不支持就回退」：

```html
<picture>
  <source type="image/avif" srcset="photo.avif" />
  <source type="image/webp" srcset="photo.webp" />
  <img src="photo.jpg" alt="产品照片" width="1000" height="600" />
</picture>
```

`type` 是资源的 MIME 类型。浏览器从上往下看：支持 AVIF 就下 `photo.avif`，不支持就跳过、看 WebP，再不支持就用 `<img>` 的 `photo.jpg`。

::: tip 为什么 `type` 比「直接给 .webp」更省
浏览器的预加载扫描器在跑任何脚本前就开始请求图片。如果你只写 `<img src="photo.webp">`，**所有**浏览器都会去请求它（不支持的那些请求后才失败）。而 `<picture type>` 让浏览器**仅凭格式支持就决定要不要发请求**——不支持的格式直接跳过、不发请求，零浪费。这正是 `<picture>` 相比 JS 方案的关键优势：决策发生在请求**之前**。
:::

格式回退的顺序铁律：**最现代的格式放最前**（AVIF → WebP → JPEG / PNG 兜底），让支持的浏览器优先拿到最省的那份。

## 用法三：格式回退 + 响应式尺寸（合体）

实战常把「换格式」和「换尺寸」叠在一起——每种格式各给多个尺寸。`<source>` 上同样能写 `srcset` + `sizes`：

```html
<picture>
  <source
    type="image/avif"
    srcset="photo-480.avif 480w, photo-800.avif 800w, photo-1200.avif 1200w"
    sizes="(max-width: 600px) 100vw, 50vw" />
  <source
    type="image/webp"
    srcset="photo-480.webp 480w, photo-800.webp 800w, photo-1200.webp 1200w"
    sizes="(max-width: 600px) 100vw, 50vw" />
  <img
    src="photo-800.jpg"
    srcset="photo-480.jpg 480w, photo-800.jpg 800w, photo-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw, 50vw"
    alt="产品照片"
    width="1200"
    height="800" />
</picture>
```

浏览器先按 `type` 选定能解码的格式分支，再在该分支的 `srcset` / `sizes` 里按视口挑尺寸。这是「认真做图片优化」的完全体——通常由构建工具或图片 CDN 自动产出，理解结构才能排错。

## art direction vs 分辨率切换：别用错工具

| 需求 | 用什么 | 关键属性 |
| --- | --- | --- |
| 同一张图，不同**尺寸**（省流量） | `<img>` | `srcset` 宽度描述符 + `sizes` |
| 同一张图，不同**清晰度**（视网膜） | `<img>` | `srcset` 像素密度描述符（`2x`） |
| **不同裁切 / 不同图**（窄屏突出主体） | `<picture>` | `<source media>` |
| **不同格式**（AVIF / WebP 回退） | `<picture>` | `<source type>` |

::: warning 视网膜屏别滥用 `<picture media>`
仅仅为高 DPI 屏提供更大图，**不要**用 `<picture>` 写一堆 `media` 条件——用 `<img srcset>` 的 `x` 描述符即可。好处是省流量模式下浏览器能自动降级到低密度版，你也不必手写媒体查询。`<picture>` 留给「真的要换图 / 换格式」的场景。
:::

## `object-fit` 写在 `<img>` 上

当 `<picture>` 各 source 的图比例不一、又想统一显示框时，用 CSS 的 `object-fit` / `object-position` 控制图在框内如何裁剪定位——但要写在**子 `<img>`** 上，不是 `<picture>` 上：

```css
picture img {
  width: 100%;
  height: 240px;
  object-fit: cover; /* 填满框、超出部分裁掉，保持比例不变形 */
  object-position: center;
}
```

`<picture>` 自身只是个逻辑容器，真正被渲染、被 CSS 作用的是里面那个 `<img>`。

## 小结

`<picture>` 用 `media` 换裁切（art direction）、用 `type` 换格式（AVIF / WebP 回退），`<img>` 兜底不可省。记住分工：换**尺寸 / 清晰度**用 `<img srcset>`，换**图 / 格式**用 `<picture>`。图片讲完了——下一页转向另一类大流量媒体：[音频与视频](./audio-video)。
