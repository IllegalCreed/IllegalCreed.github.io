---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN 官方文档（developer.mozilla.org）+ web.dev/articles 编写，对照 2026-07 AVIF Baseline 状态

## 速查

- 格式优先级：**AVIF → WebP → JPEG/PNG → SVG（矢量优先）**
- 压缩率：AVIF 比 JPEG 小约 **50%**、比 WebP 小 **20–30%**；WebP 比 JPEG 省 **25–35%**
- AVIF 支持：Chrome 85+ / Edge 90+ / Firefox 93+ / Safari 16+；**Baseline 2026 newly available**
- WebP 支持：Chrome 32+ / Firefox 65+ / Safari 14+ / Edge 18+
- `srcset` 两类描述符：**w（须配 sizes）vs x（无需 sizes）**，**不可混用**
- `sizes` 媒体条件描述**视口**，槽宽**禁止百分比**
- 回退链：`<source type=image/avif>` → `<source type=image/webp>` → `<img src=x.jpg>`
- `decoding` 三值：`async`（不阻塞绘制）/ `sync`（与 DOM 一起渲染）/ `auto`（默认）
- 压缩 quality 常用区间：**50–70**
- 图片 CDN URL 四要素：origin / image / security-key / transformations
- 本叶边界：**懒加载归【用户体验优化】章**

## 格式对比表

| 格式 | 类型 | 压缩 | 透明 | 动画 | 典型节省 | 浏览器支持 |
| --- | --- | --- | --- | --- | --- | --- |
| **AVIF** | 光栅 | 有损/无损 | ✓ | ✓ | 比 JPEG **−50%** / 比 WebP **−20~30%** | Chrome 85+ / Edge 90+ / Firefox 93+ / Safari 16+ |
| **WebP** | 光栅 | 有损/无损 | ✓ | ✓ | 比 JPEG **−25~35%** | Chrome 32+ / Firefox 65+ / Safari 14+ / Edge 18+ |
| **JPEG** | 光栅 | 有损 | ✗ | ✗ | 基准 | 全浏览器（兜底首选） |
| **PNG** | 光栅 | 无损 | ✓ | ✗ | 基准（偏大） | 全浏览器 |
| **GIF** | 光栅 | 无损（256 色） | ✓ | ✓ | 字节远大于 `<video>` | 全浏览器（建议弃用动画） |
| **SVG** | 矢量 | — | ✓ | ✓（SMIL/CSS） | SVGO 后可省 58% | 全浏览器（除老 IE 局限） |

> 优先用矢量格式（SVG）——与分辨率无关、HiDPI 屏永远清晰；光栅图首选 AVIF/WebP，老格式 JPEG/PNG 仅作 `<picture>` 兜底。

## srcset 语法速查

### 宽度描述符（w，须配 sizes）

```html
<img
  src="hero-800.jpg"
  srcset="hero-480.jpg 480w, hero-800.jpg 800w, hero-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="hero"
>
```

| 段 | 含义 |
| --- | --- |
| `URL 宽度w` | 候选项，**数字后必须带 `w`** |
| `src` | 用 w 描述符时被当作 1x 候选 |
| `sizes` | **必须存在**，否则 srcset 被忽略 |

### 像素密度描述符（x，无需 sizes）

```html
<img
  src="logo.png"
  srcset="logo.png 1x, logo@2x.png 2x, logo@3x.png 3x"
  alt="logo"
>
```

| 段 | 含义 |
| --- | --- |
| `URL 密度x` | 候选项，**数字后必须带 `x`**（1x 可省略） |
| `sizes` | 无需 |

### 合法性规则

| 规则 | 说明 |
| --- | --- |
| 不可混用 w 和 x | `a.jpg 480w, b.jpg 2x` 非法，浏览器行为未定义 |
| 同描述符不可重复 | 两个 `2x` 也无效 |
| 用 w 必须有 sizes | 否则整个 srcset 被忽略、退回 src |

## sizes 语法速查

```text
sizes="media-condition slot, media-condition slot, default-slot"
```

| 段 | 含义 |
| --- | --- |
| `media-condition` | 媒体条件，**描述视口不是图片**（如 `(max-width: 600px)`） |
| `slot` | 槽宽；**禁止百分比**；可用 px / vw / calc / em |
| 取值逻辑 | **取第一个为真的条件、其后全忽略** |
| 默认 | 最后一项省略媒体条件 |

> `sizes` 必须贴近真实 CSS 显示宽度——偏大选浪费带宽、偏小选模糊图。

## picture 语法速查

### Art direction（media）

```html
<picture>
  <source media="(max-width: 600px)" srcset="hero-mobile.jpg">
  <source media="(min-width: 601px)" srcset="hero-desktop.jpg">
  <img src="hero.jpg" alt="hero">
</picture>
```

### 格式协商（type）

```html
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source type="image/webp" srcset="hero.webp">
  <img src="hero.jpg" alt="hero">
</picture>
```

### `<source>` 通用属性

| 属性 | 作用 |
| --- | --- |
| `srcset` | 候选图（同 `<img>` 的 srcset 语法） |
| `media` | 媒体条件（art direction 用） |
| `type` | MIME 类型（格式协商用，如 `image/avif`） |
| `sizes` | 同 `<img>` 的 sizes（与 srcset w 描述符配合） |

### 铁律

- **`<img>` 必须放在最后**——缺失则不渲染任何图
- **`<img>` 必须用通用格式（JPEG/PNG）兜底**——否则老浏览器显示破图
- **回退链顺序**：AVIF → WebP → JPEG（从最优到最兼容）

## img 关键属性速查

| 属性 | 作用 | 取值 / 备注 |
| --- | --- | --- |
| `src` | 主图 URL | 必填 |
| `srcset` | 候选图列表 | w 或 x 描述符，**不可混用** |
| `sizes` | 真实 CSS 显示宽度 | 与 w 描述符配合；**禁百分比** |
| `width` / `height` | 固有宽高 | 防 CLS（浏览器算 aspect-ratio） |
| `alt` | 替代文本 | 无障碍必填；装饰图给 `alt=""` |
| `decoding` | 解码提示 | `async` / `sync` / `auto`（默认） |
| `loading` | 懒加载 | `lazy` / `eager`（默认）；**归懒加载章** |
| `fetchpriority` | 优先级提示 | `high` / `low` / `auto`；LCP 图设 `high` |

## 压缩工具速查

| 工具 | 用途 | 典型命令 |
| --- | --- | --- |
| **cwebp** | JPEG/PNG → WebP | `cwebp -q 65 in.jpg -o out.webp` |
| **avifenc** | JPEG/PNG → AVIF | `avifenc --min 30 --max 50 in.jpg out.avif` |
| **sharp**（Node） | resize / 转 WebP/AVIF | `sharp('in.jpg').resize(800).webp({quality:65}).toFile('out.webp')` |
| **imagemin** | 批处理 pipeline | `imagemin(['*.jpg'], {plugins: [imageminWebp({quality:65})]})` |
| **ImageMagick** | resize / 格式转换 | `convert in.jpg -resize 300x200 out.jpg` |
| **SVGO** | SVG 压缩 | `svgo icon.svg -o icon.min.svg` |

> quality 常用区间 **50–70**；人眼不敏感，调低收益大；用 Butteraugli / SSIM 防过度压缩。

## 图片 CDN URL 形态

```text
https://cdn.example.com/image/secure-key/hero.jpg?width=800&quality=65&format=auto

        origin          /image/security-key/file   ?transformations
```

| 段 | 作用 |
| --- | --- |
| `origin` | 自有域名（避免换 CDN 改 URL） |
| `image` | 源图路径 |
| `security-key` | 防他人生成新变体 |
| `transformations` | size / quality / format；`auto` 由 CDN 按信号自动选 |

### auto 模式依据的信号

| 信号 | 来源 |
| --- | --- |
| Client Hints | `Sec-CH-Viewport-Width` / `Sec-CH-DPR` |
| Save-Data 头 | `Save-Data: on` |
| User-Agent | 浏览器能力 |
| Network Information API | `navigator.connection.effectiveType`（4g/3g/2g） |

## HTTP Accept 头协商

```apache
# Apache mod_rewrite 示例（web.dev）
RewriteCond %{HTTP_ACCEPT} image/webp
RewriteCond %{HTTP_ACCEPT} !image/avif
RewriteRule (.*)\.(jpg|png)$ $1.webp [L]
Header append Vary Accept
```

| 头 | 作用 |
| --- | --- |
| `Accept` | 客户端告知支持哪些图片格式（`image/webp,image/avif`） |
| `Vary: Accept` | **必须**——否则缓存把 WebP 给到不支持 AVIF/WebP 的浏览器（串味） |

## 浏览器支持状态（2026-07）

| 特性 | 状态 | 备注 |
| --- | --- | --- |
| **AVIF** | Baseline 2026 newly available（约 96%） | Chrome 85+ / Edge 90+ / Firefox 93+ / Safari 16+ |
| **WebP** | 全浏览器稳定 | Chrome 32+ / Firefox 65+ / Safari 14+ / Edge 18+ |
| `srcset` / `sizes` / `<picture>` | modern desktop & mobile 全支持 | 已多年稳定 |
| `<img decoding>` | Baseline「Widely available」 | 自 2020-01 起跨浏览器可用 |
| `HTMLImageElement.decode()` | Widely available | 返回 Promise |
| `sizes="auto"` | 较新 | **须配 `loading="lazy"`**；旧浏览器需跟回退值 |

> 本文涉及的所有 HTML 属性均为稳定规范、无即将废弃项。

## 反模式速查表

| 反模式 | 后果 | 正解 |
| --- | --- | --- |
| srcset 混用 w 和 x | 浏览器行为未定义 | 同一 srcset 只用一种 |
| 用 w 漏写 sizes | srcset 被忽略、退回 src | 必须配 sizes |
| sizes 用百分比 | 规范禁止 | 用 px / vw / calc / em |
| `<picture>` 漏 `<img>` 或顺序错 | 不渲染任何图 | `<img>` 必须放最后 |
| `<img>` 用 WebP 兜底 | 老浏览器显示破图 | 用 JPEG/PNG 兜底 |
| JS 检测视口改 `src` | 多下一次原图 | 用 `srcset` / `sizes` |
| 用 GIF 做动画 | 体积远大于 `<video>` | 改用 `<video>` 或 MP4/WebM |
| 文字烘进图片 | 不可选 / 不可搜 / 不可缩放 | 用 web font |
| 构建期压一次就不管 | 未剥 EXIF / 无按需变体 | 自动化管线 + CDN 按需生成 |
| 滥用 `decoding="async"` | 首屏静态图几乎无收益 | 仅给 JS 动态插入的图 |
| 跨源 CDN 不 preconnect | 拖慢 LCP | `preconnect` + `fetchpriority="high"` |
| 只生成 1 张超大图靠 CSS 缩放 | 桌面图喂手机 2–4x 流量 | 多尺寸 + `srcset`/`sizes` |

## 官方资源

- MDN 响应式图片：[https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)
- MDN `<img>`：[https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)
- MDN `HTMLImageElement.decoding`：[https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding)
- web.dev 选格式：[https://web.dev/articles/choose-the-right-image-format](https://web.dev/articles/choose-the-right-image-format)
- web.dev 压缩：[https://web.dev/articles/compress-images](https://web.dev/articles/compress-images)
- web.dev 响应式：[https://web.dev/articles/serve-responsive-images](https://web.dev/articles/serve-responsive-images)
- web.dev WebP：[https://web.dev/articles/serve-images-webp](https://web.dev/articles/serve-images-webp)
- web.dev 图片 CDN：[https://web.dev/articles/image-cdns](https://web.dev/articles/image-cdns)
- caniuse AVIF：[https://caniuse.com/AVIF](https://caniuse.com/AVIF)
- GitHub：[sharp](https://github.com/lovell/sharp) · [SVGO](https://github.com/svg/svgo) · [imagemin](https://github.com/imagemin/imagemin) · [squoosh](https://github.com/GoogleChromeLabs/squoosh)
