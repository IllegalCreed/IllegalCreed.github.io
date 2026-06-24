---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 图片最少两属性：`<img src alt>` —— `src` 必填，`alt` 必写（装饰图用 `alt=""`）
- 防抖动：`<img>` 必带 `width` / `height`（整数、无单位），让浏览器提前算出宽高比、预留空间，杜绝 CLS
- 懒加载：首屏外的图 `loading="lazy"`；首屏主图保持默认 `eager`，可加 `fetchpriority="high"`
- 响应式（同图不同尺寸）：`srcset` 给候选图 + `sizes` 给显示宽度，浏览器自己挑，**不要**用 JS
- 艺术化换图 / 格式回退：用 `<picture>` + `<source media>`（换裁切）或 `<source type>`（回退 AVIF / WebP）
- 视频：`<video controls poster preload>`，自动播放必须 `muted`（`autoplay muted`）
- 字幕：`<track kind="captions" srclang label default>` 指向 `.vtt`（WebVTT）文件
- 嵌入第三方：`<iframe>` 默认加 `sandbox` + `allow` 最小授权 + `loading="lazy"`，**绝不**同开 `allow-scripts allow-same-origin`（同源时等于没沙箱）
- 矢量优先：图标 / 插画用 SVG（`<img src=".svg">` 或内联 `<svg>`），无限缩放不糊
- 现代格式：照片优先 AVIF / WebP，用 `<picture type>` 回退到 JPEG / PNG 兜底

## 一份「正确且现代」的媒体模板

下面这段覆盖了图片、响应式、音视频、字幕、嵌入这几类真正常用的写法，本叶其余各页就是逐块拆解它：

```html
<!-- 1. 最基础的图片：src + alt + 尺寸（防 CLS） -->
<img src="hero.jpg" alt="团队在白板前讨论方案" width="1200" height="630" />

<!-- 2. 首屏外的图：懒加载 + 异步解码 -->
<img src="thumb.jpg" alt="文章封面缩略图" width="320" height="180"
     loading="lazy" decoding="async" />

<!-- 3. 响应式：同一张图的不同尺寸，浏览器按视口挑 -->
<img
  src="photo-800.jpg"
  srcset="photo-480.jpg 480w, photo-800.jpg 800w, photo-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="风景照"
  width="1200"
  height="800" />

<!-- 4. 格式回退 + 艺术化换图：现代格式优先，旧浏览器兜底 -->
<picture>
  <source type="image/avif" srcset="art.avif" />
  <source type="image/webp" srcset="art.webp" />
  <img src="art.jpg" alt="插画作品" width="1000" height="600" />
</picture>

<!-- 5. 视频：可控、带封面、按需预加载、多格式回退 -->
<video controls poster="poster.jpg" preload="metadata" width="640" height="360">
  <source src="movie.webm" type="video/webm" />
  <source src="movie.mp4" type="video/mp4" />
  <track default kind="captions" srclang="zh" label="中文" src="captions.vtt" />
  你的浏览器不支持视频，请 <a href="movie.mp4">下载观看</a>。
</video>

<!-- 6. 音频：可控、按需预加载、多格式回退 -->
<audio controls preload="metadata">
  <source src="song.opus" type="audio/ogg; codecs=opus" />
  <source src="song.mp3" type="audio/mpeg" />
  请 <a href="song.mp3" download>下载音频</a>。
</audio>

<!-- 7. 嵌入第三方页面：最小授权 + 懒加载 -->
<iframe
  src="https://example.com/widget"
  title="第三方小工具"
  sandbox="allow-scripts"
  allow="fullscreen"
  loading="lazy"
  referrerpolicy="strict-origin"
  width="600"
  height="400"></iframe>
```

::: tip 这份模板的取舍
真实项目里很少七块全用——图片站重点在 2~4，视频站重点在 5~6，仪表盘 / 文档站才常用 7。模板把「现在仍推荐」的写法集中展示，删掉了已淘汰的 `<applet>`、Flash `<embed>` 等历史包袱。
:::

## 逐块拆解

### ① 图片：`src` + `alt` + 尺寸

```html
<img src="hero.jpg" alt="团队在白板前讨论方案" width="1200" height="630" />
```

`src` 给出图片地址，`alt` 给出替代文字——读屏软件朗读它、图片加载失败时显示它、搜索引擎据它理解图意。`width` / `height` 看似可有可无，实则**防止布局抖动的关键**：浏览器据此提前算出宽高比、预留空间，图片到位时不再把下方内容挤跑（即 CLS）。详见 [`<img>` 基础与防抖](./guide-line/img-basics)。

### ② 性能：懒加载与解码

```html
<img src="thumb.jpg" alt="缩略图" width="320" height="180"
     loading="lazy" decoding="async" />
```

`loading="lazy"` 让首屏外的图等快进入视口时再下载，省流量、快首屏；`decoding="async"` 提示浏览器异步解码、不阻塞渲染。注意首屏**主图**别懒加载（会拖慢 LCP），反而可以 `fetchpriority="high"` 抢优先级。详见 [`<img>` 基础与防抖](./guide-line/img-basics)。

### ③ 响应式：让浏览器挑对尺寸

```html
<img srcset="photo-480.jpg 480w, photo-800.jpg 800w"
     sizes="(max-width: 600px) 100vw, 50vw"
     src="photo-800.jpg" alt="风景照" />
```

`srcset` 列出同一张图的多个尺寸（带 `w` 宽度描述符），`sizes` 告诉浏览器这张图在不同视口下占多宽，浏览器结合屏幕、像素密度、网络自动下最划算的那份。手机不会白下桌面大图。详见 [响应式图片](./guide-line/responsive-images)。

### ④ art direction 与格式回退

```html
<picture>
  <source type="image/avif" srcset="art.avif" />
  <source type="image/webp" srcset="art.webp" />
  <img src="art.jpg" alt="插画" />
</picture>
```

当你需要「窄屏换裁切」（art direction）或「现代格式优先、旧浏览器兜底」时，单个 `<img>` 不够用，要请出 `<picture>`：`<source media>` 按视口换图，`<source type>` 按格式支持挑图，浏览器选**第一个匹配的** source，都不匹配就用 `<img>` 兜底。详见 [art direction 与格式回退](./guide-line/art-direction)。

### ⑤ 音频与视频

```html
<video controls poster="poster.jpg" preload="metadata">
  <source src="movie.webm" type="video/webm" />
  <source src="movie.mp4" type="video/mp4" />
  <track default kind="captions" srclang="zh" label="中文" src="captions.vtt" />
</video>
```

`controls` 给出播放控件，`poster` 是加载前的封面图，`preload="metadata"` 只先取时长 / 尺寸不下整片。想自动播放？现代浏览器要求**静音**（`autoplay muted`），否则会被拦。无障碍上字幕用 `<track>` 指向 `.vtt` 文件。详见 [音频与视频](./guide-line/audio-video)。

### ⑥ 嵌入第三方：先关进沙箱

```html
<iframe src="https://example.com/widget" title="小工具"
        sandbox="allow-scripts" allow="fullscreen" loading="lazy"></iframe>
```

`<iframe>` 嵌入的是一整个独立文档，能力越大风险越大。默认就加 `sandbox`（空值=最严，再按需放开 token），用 `allow` 精确授予摄像头 / 全屏等权限，`loading="lazy"` 省资源。**红线**：同源内容别同时给 `allow-scripts` 和 `allow-same-origin`，那等于让它自己拆掉沙箱。详见 [`<iframe>` 嵌入与安全](./guide-line/iframe-embedding)。

## 图片该用位图还是矢量？

| 类型 | 代表格式 | 适合 | 不适合 |
| --- | --- | --- | --- |
| **位图（光栅）** | JPEG / PNG / WebP / AVIF | 照片、复杂渐变、真实场景 | 放大会糊、不能无损缩放 |
| **矢量** | SVG | 图标、Logo、插画、图表 | 照片级细节（文件会爆炸） |

经验法则：**照片用位图**（优先 AVIF / WebP，JPEG 兜底）、**图标 / Logo 用 SVG**（无限缩放都清晰，还能用 CSS 改色）。SVG 的内联用法见 [图像映射与 object / embed](./guide-line/image-map-embed)。

## 下一步

按本叶地图依次深入，或直接跳到你最关心的一页——[`<img>` 基础](./guide-line/img-basics)、[响应式图片](./guide-line/responsive-images)、[art direction](./guide-line/art-direction)、[音视频](./guide-line/audio-video)、[iframe 安全](./guide-line/iframe-embedding)、[image map / object](./guide-line/image-map-embed)。
