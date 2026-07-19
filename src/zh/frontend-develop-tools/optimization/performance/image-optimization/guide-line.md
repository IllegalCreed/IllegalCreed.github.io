---
layout: doc
outline: [2, 3]
---

# 核心模式

> 基于 MDN 官方文档（developer.mozilla.org）+ web.dev/articles/{choose-the-right-image-format, compress-images, serve-responsive-images, serve-images-webp, image-cdns} 编写

## 速查

- **响应式图片**：`srcset` 用「**宽度描述符（w，须配 sizes）**」或「**像素密度描述符（x，无需 sizes）**」，二者**不可在同一 srcset 混用**
- **sizes**：媒体条件描述**视口不是图片**；**取第一个为真的条件、其后全忽略**；槽宽**禁止百分比**，可用 px / vw / calc / em；最后一项省略条件作默认
- **漏写 sizes**：用 w 描述符时漏 sizes → 整个 srcset 被忽略、退回只加载 src
- **art direction** 用 `<picture media>`；**格式协商** 用 `<source type>`（MIME）；**`<img>` 必须最后且用通用格式（JPEG/PNG）兜底**，缺失则无图
- **AVIF/WebP 回退链**：`<source type=image/avif>` → `<source type=image/webp>` → `<img src=x.jpg>`；浏览器取第一个支持的 source
- **HTTP Accept 头协商** + **`Vary: Accept`**：防止缓存把 WebP 给到不支持 AVIF/WebP 的浏览器
- **压缩 quality**：0–100，人眼不敏感，**50–70 区间常用**；用 Butteraugli/SSIM 防过度压缩
- **SVG 压缩**：SVGO 去元数据 + 服务器 GZIP；web.dev 实测可省 58%
- **decoding** 三值：`async`（下一次绘制不等解码）/ `sync`（与 DOM 一起渲染）/ `auto`（默认，浏览器自决）；**async 对 JS 动态插入图效果最明显**
- **width/height**：写明固有宽高让浏览器提前算出 `aspect-ratio` 预留空间，避免/减轻 CLS
- **图片 CDN URL 四要素**：origin / image / security-key / transformations；auto 模式依据 Client Hints / Save-Data / User-Agent / Network Information API

## 响应式图片：srcset

`srcset` 让浏览器根据设备能力（视口宽度 / DPR）从候选列表里选最合适的图。两类描述符：

### 宽度描述符（w）—— 须配 sizes

```html
<img
  src="hero-800.jpg"
  srcset="hero-480.jpg 480w, hero-800.jpg 800w, hero-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="hero"
>
```

- 候选项格式：`URL 宽度w`，**数字后必须带 `w`**
- 用 w 描述符时 `src` 被当作 1x 候选
- **必须配 `sizes`**，否则整个 srcset 被忽略、退回只加载 src
- 适用于「同一张图不同尺寸」——分辨率切换场景

### 像素密度描述符（x）—— 无需 sizes

```html
<img
  src="logo.png"
  srcset="logo.png 1x, logo@2x.png 2x, logo@3x.png 3x"
  alt="logo"
>
```

- 候选项格式：`URL 像素密度x`（如 1x / 2x / 3x）
- **无需 sizes**，浏览器按设备 DPR 选
- 适用于「图标 / UI 小图」——按 DPR 切换

### 反模式（必避）

- **混用 w 和 x**（如 `a.jpg 480w, b.jpg 2x`）——规范非法，浏览器行为未定义
- **同 srcset 出现两个相同描述符**（两个 2x）——也无效
- **用 w 描述符却漏写 sizes**——整个 srcset 被忽略、退回 src
- **JS 检测视口后改 `src` 做响应式**——图片在 CSS/JS 执行前已被预加载，等于多下一次原图

> 这是 `srcset` 存在的根本原因：**浏览器在解析 HTML 时就开始预加载图片，早于 CSS/JS 执行**。JS 后改 `src` 等于多下一次原图，流量更糟。

## 响应式图片：sizes

`sizes` 描述「图片在不同视口下的真实 CSS 显示宽度」，让浏览器据此推算有效像素密度、从 srcset 里选哪张图。

### 语法

```text
sizes="media-condition slot, media-condition slot, default-slot"
```

- **媒体条件描述视口不是图片**（如 `(max-width: 600px)`）
- **取第一个为真的条件、其后全忽略**
- **槽宽禁止百分比**；可用 px / vw / calc / em（em 相对文档根字号不是图片）
- **最后一项省略媒体条件**作默认值

### 示例

```html
<img
  src="hero-800.jpg"
  srcset="hero-480.jpg 480w, hero-800.jpg 800w, hero-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
  alt="hero"
>
```

- 视口 ≤ 600px：图片占 100vw
- 视口 601–1200px：图片占 50vw
- 视口 > 1200px：图片占 33vw（默认）

### sizes 常见坑

- **偏大**：浏览器选过大图片浪费带宽
- **偏小**：选模糊图，视觉退化
- **百分比**：规范禁止
- **`sizes="auto"`**：较新，**须配 `loading="lazy"`**（语义归懒加载章），旧浏览器需在 auto 后跟回退值

> `sizes` 必须贴近真实 CSS 显示宽度——`srcset` 的 w 描述符仅告诉浏览器「原图多宽」，最终选哪张靠 sizes 推算有效像素密度。

## 响应式图片：picture

`<picture>` + `<source>` 用于两种不同场景：

### Art direction（media）—— 不同视口换不同裁切

```html
<picture>
  <source media="(max-width: 600px)" srcset="hero-mobile.jpg">
  <source media="(min-width: 601px)" srcset="hero-desktop.jpg">
  <img src="hero.jpg" alt="hero">
</picture>
```

- 手机看**竖裁切**（人物特写）
- 桌面看**横构图**（场景全景）
- 用 `media` 时**不要再在 sizes 里写媒体条件**

> 仅做分辨率切换不要套 `<picture>`，直接 `<img srcset sizes>` 更轻——`<picture>` 是 art direction（不同视口换不同裁切）专用。

### 格式协商（type）—— 写 MIME

```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source type="image/webp" srcset="hero.webp">
  <img src="hero.jpg" alt="hero">
</picture>
```

- `type` 写 MIME（如 `image/avif` / `image/webp` / `image/jpeg`）
- 浏览器用**第一个支持的 source**，都不支持才落到 `<img>`

### picture 的铁律

- **`<img>` 必须放在最后**——缺失则不渲染任何图
- **`<img>` 必须用通用格式（JPEG/PNG）兜底**——否则老浏览器显示破图
- **回退链顺序**：AVIF → WebP → JPEG（从最优到最兼容）

## 现代格式：WebP 与 AVIF

### WebP

- **压缩率**：比 JPEG 省 **25–35%** 字节（同视觉质量）
- **支持**：Chrome 32+ / Firefox 65+ / Safari 14+ / Edge 18+
- **支持有损 + 无损 + 透明 + 动画**
- 可视为「现代但已广泛可用」

### AVIF

- **压缩率**：比 JPEG 小约 **50%**、比 WebP 小 **20–30%**
- **Baseline 2026 newly available**（全球约 96%）
- Chrome 85+（2020-08）/ Edge 90+（2021-04）/ Firefox 93+（2021-10）/ Safari 16+（2022-09）
- 支持有损 + 无损 + 透明 + 动画 + 12-bit 色深
- 编码速度比 WebP 慢，但解码速度相当

### 服务端协商（HTTP Accept 头）

```apache
# Apache mod_rewrite 示例（web.dev）
RewriteCond %{HTTP_ACCEPT} image/webp
RewriteCond %{HTTP_ACCEPT} !image/avif
RewriteRule (.*)\.(jpg|png)$ $1.webp [L]
Header append Vary Accept
```

- 服务端读 `Accept: image/webp,image/avif…` 选最优格式返回
- **必须设响应头 `Vary: Accept`**——否则缓存把 WebP 给到不支持 AVIF/WebP 的浏览器（缓存串味）

> 推荐做法：**`<picture>` 在客户端协商 + CDN 在服务端协商** 二选一或并用；CDN 协商配合 `Vary: Accept` 更省 HTML 结构。

## 压缩

### quality 参数语义

- **0–100**，越高视觉质量越好、字节越大
- **人眼对质量损失不敏感**——大胆调低到 50–70 区间，视觉差异小但字节节省显著
- 用 **Butteraugli** 或 **SSIM** 算视觉差防止 overcompress
- 不同内容适合不同质量（**照片 65–75**，**UI 截图 80+**，**抽象图 50–60**）

### 工具链

```bash
# WebP（cwebp）
cwebp -q 65 input.jpg -o output.webp

# AVIF（avifenc / libavif）
avifenc --min 30 --max 50 input.jpg output.avif

# ImageMagick（resize）
convert input.jpg -resize 33% output.jpg
convert input.jpg -resize 300x200 output.jpg

# Node（sharp）
node -e "require('sharp')('in.jpg').resize(800).webp({quality:65}).toFile('out.webp')"

# Node（imagemin-webp）
node -e "const {default: Imagemin} = require('imagemin'); const imageminWebp = require('imagemin-webp'); Imagemin({plugins:[imageminWebp({quality:65})]})"

# SVG（SVGO）
svgo icon.svg -o icon.min.svg
```

### SVG 压缩

- 用 **SVGO** 去掉编辑器元数据（Illustrator / Sketch 都会塞垃圾）
- 服务器开 **GZIP / Brotli** 压缩传输
- web.dev 实测：Illustrator 导出的 SVG 经 SVGO 缩 58%

### 反模式（必避）

- **只在构建期压一次图就不管了**——不剥 EXIF / 相机 / 地理等元数据、不做按需变体
- **用 GIF 做动画**——调色板最多 256 色、体积远大于 `<video>`；APNG 也比视频大；改用 `<video>` 或 MP4/WebM
- **把文字烘进图片里（text-in-image）**——不可选、不可搜、不可缩放、对 HiDPI 不友好、无障碍差；该用 web font 表达
- **盲目压到 quality=20**——视觉损失过大，反而毁体验

## 解码与防 CLS

### decoding 属性

```html
<img src="hero.jpg" decoding="async" alt="hero">
```

- **`async`**：下一次绘制**不等图片解码完成**——给 JS 动态插入的图、或 LCP 之外的大图用
- **`sync`**：与其它 DOM 一起渲染（默认行为）
- **`auto`**（默认）：浏览器自决

### HTMLImageElement.decode() 方法

```js
const img = new Image();
img.src = "hero.jpg";
await img.decode();       // 下载 + 解码完成后 resolve
document.body.appendChild(img);  // 直接显示，避免「先空图再跳变」
```

返回 Promise，图片下载 + 解码完成后 resolve，常用于动态替换图片时避免「先显示空图再跳变」。

> **`decoding="async"` 别滥用**：首屏静态 `<img>` 上效果几乎不可感知（浏览器本就先渲空框再单独处理）；真正受益的是 JS 动态插入的图。

### width/height 防 CLS

```html
<img src="hero.jpg" width="800" height="600" alt="hero">
```

- 写明**固有宽高**让浏览器**提前算出 aspect-ratio** 预留空间
- 与 `srcset/sizes` 配合使用——图片真实显示尺寸由 CSS 控制，`width/height` 仅提供比例
- **CSS 替代写法**：`aspect-ratio: 4 / 3;` 或 `aspect-ratio: 800 / 600;`

> 所有视觉元素都给尺寸——大图被缩放时，写明 `width/height` 可显著降 CLS（布局偏移），尤其 LCP 元素。

## 图片 CDN

图片 CDN 通过 URL 参数（或 path）按需生成变体，配合 auto 模式自动选最优格式与尺寸。

### URL 形态

```text
https://cdn.example.com/image/secure-key/hero.jpg?width=800&quality=65&format=auto

        origin          /image/security-key/file   ?transformations
```

四要素：

- **origin**：自有域名（避免换 CDN 改 URL）；若必须跨源 CDN，**尽早 `preconnect`** 并对 LCP 图加 `fetchpriority="high"`（甚至 `rel=preload`）
- **image**：源图
- **security-key**：防他人生成新变体（被恶意刷爆流量）
- **transformations**：size / quality / format；可用 `auto` 由 CDN 按用户代理 / Save-Data / Network Information API / Client Hints 自动选最优

### auto 模式依据的信号

- **Client Hints**：视口宽 / DPR（`Sec-CH-Viewport-Width` / `Sec-CH-DPR`）
- **Save-Data 头**：用户开了「省流量」模式
- **User-Agent**：按浏览器能力给 Chrome 出 AVIF、给老浏览器出 JPEG
- **Network Information API**：`navigator.connection.effectiveType`（4g / 3g / 2g）

### 性能影响

- 切换到图片 CDN 通常能省 **40–80% 图片字节**
- 按需生成变体（不同于构建期一次性产物），适合高度个性化分端场景
- 图片尽量放主源（自托管或 CDN 代理回源），避免引入额外跨源增加连接建立时间

> 图片 CDN 的 auto 模式把「手写大量 `<source>`」自动化——综合 Client Hints、Save-Data、UA、Network Information API 自动给最优格式 + 尺寸。

## 反模式（避坑）

- **srcset 混用 w 和 x 描述符**（如 `a.jpg 480w, b.jpg 2x`）——规范非法，浏览器行为未定义
- **srcset 用 w 却漏写 sizes**——整个 srcset 被忽略、退回只加载 src（看似响应式实则没生效）
- **sizes 用百分比**（如 `50%`）——规范禁止；要用 px / vw / calc / em
- **`<picture>` 把 `<img>` 放在 `<source>` 之前或漏掉 `<img>`**——不渲染任何图
- **`<img>` 用 WebP 而非 JPEG/PNG**——老浏览器兜底失败显示破图
- **JS 检测视口再改 `<img src>` 做响应式**——图片在 CSS/JS 执行前已被预加载，等于多下一次原图
- **用 GIF 做动画**——改用 `<video>` 或 MP4 / WebM
- **把文字烘进图片里**——不可选、不可搜、不可缩放，改用 web font
- **只在构建期压一次图就不管了**——不剥 EXIF / 不做按需变体
- **盲目把所有 `<img>` `decoding="async"`**——首屏静态图几乎无收益；真正受益的是 JS 动态插入的图
- **跨源图片 CDN 不 `preconnect`、LCP 图不加 `fetchpriority="high"`**——连接建立和资源加载阶段被拉长，拖慢 LCP
- **只生成 1 张超大图靠 CSS 缩放**——下载字节远超所需（桌面图喂手机 2–4x 流量）

## 下一步

- [参考](./reference.md)：完整格式对比表、`srcset` 语法、属性表、官方资源
