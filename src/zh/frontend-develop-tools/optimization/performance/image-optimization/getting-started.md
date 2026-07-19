---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN 官方文档（developer.mozilla.org）+ web.dev/articles 编写，对照 2026-07 AVIF Baseline 状态与 srcset / sizes / picture 稳定规范

## 速查

- 图片通常占整页字节 **50% 以上**，是性能优化最高性价比的杠杆
- 四条主线：**格式选型（WebP / AVIF / JPEG / PNG / SVG）+ 响应式图片（srcset + sizes + picture）+ 压缩与解码 + 图片 CDN**
- 现代格式状态：**AVIF** caniuse Baseline 2026（全球约 96%，Chrome 85+ / Edge 90+ / Firefox 93+ / Safari 16+）；**WebP** 普及更早（Chrome 32+ / Firefox 65+ / Safari 14+）
- 压缩率：AVIF 比 JPEG 小约 **50%**、比 WebP 小 **20–30%**；WebP 比 JPEG 省 **25–35%**
- 响应式图片：`srcset` 用「**宽度描述符（w）须配 sizes**」或「**像素密度描述符（x）无需 sizes**」，**不可混用**
- **sizes 必须贴近真实 CSS 显示宽度**；槽宽**禁止百分比**，可用 px / vw / calc / em
- `<picture>` 两种用途：**art direction（media）** 换裁切图；**格式协商（type）** 写 MIME
- `<img>` 必须放在 `<picture>` 最后、用 JPEG/PNG 通用格式兜底
- 防 CLS：写明 `width` + `height`（或 CSS `aspect-ratio`）预留空间
- `decoding="async"` 给 **JS 动态插入的图** 或 LCP 之外的大图，首屏静态图几乎无感
- 图片 CDN URL 四要素：**origin / image / security-key / transformations**
- 本叶边界：**懒加载（`loading="lazy"`）不在此处展开**，归【用户体验优化】章

## 图片优化解决什么问题

未优化的图片导致三类典型问题：

- **加载慢 / 流量贵**：桌面图喂手机浪费 **2–4 倍流量**，超大图被 CSS 缩放下载字节远超所需
- **CLS 高（布局抖动）**：图片无 `width/height`，加载完成后撑开布局推开已有内容
- **LCP 慢**：首屏 hero 图未压缩 / 未选最优格式 / 未 preconnect CDN，拖慢最大内容绘制

图片优化的目标：**用尽量少的字节传输视觉无损的图，并尽量快地完成加载**。

> 图片字节下降直接降低 LCP 时间与流量成本——单点改动可获 25–80% 收益，是整页性能中杠杆最大的优化项。

## 四条主线

| 主线 | 关键 API / 概念 | 核心目标 |
| --- | --- | --- |
| **格式选型** | WebP / AVIF / JPEG / PNG / SVG | 同等视觉质量下字节更小 |
| **响应式图片** | `srcset` + `sizes` + `<picture>` | 不同设备 / 视口喂不同尺寸 |
| **压缩与解码** | quality 调参 / 剥元数据 / `decoding` / `width·height` | 字节更小 + 加载更不卡 |
| **图片 CDN** | URL 变换 / auto 模式 / `Vary: Accept` | 自动按需生成最优变体 |

## 格式速览

| 格式 | 类型 | 适用 | 备注 |
| --- | --- | --- | --- |
| **AVIF** | 光栅 · 有损/无损 | 照片、复杂图 | 压缩率最高；Baseline 2026 |
| **WebP** | 光栅 · 有损/无损 | 照片、透明图 | 普及最广，现代但已稳定 |
| **JPEG** | 光栅 · 有损 | 照片（兜底） | 老浏览器兜底首选 |
| **PNG** | 光栅 · 无损 | 透明 / UI / 截图 | 字节偏大，新项目 UI 多被 SVG 替代 |
| **SVG** | 矢量 | 图标 / Logo / 图表 | 与分辨率无关；SVGO + GZIP |

> 优先用矢量格式（SVG）——与分辨率无关、HiDPI 屏永远清晰、体积小；用 SVGO 去掉编辑器元数据后再 GZIP 传输（web.dev 实测可省 58%）。

## 响应式图片速览

```html
<!-- 分辨率切换：w 描述符 + sizes -->
<img
  src="hero-800.jpg"
  srcset="hero-480.jpg 480w, hero-800.jpg 800w, hero-1200.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="hero"
  width="800" height="600"
  decoding="async"
>

<!-- 格式协商：type MIME -->
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source type="image/webp" srcset="hero.webp">
  <img src="hero.jpg" alt="hero">
</picture>

<!-- art direction：media 换裁切 -->
<picture>
  <source media="(max-width: 600px)" srcset="hero-mobile.jpg">
  <source media="(min-width: 601px)" srcset="hero-desktop.jpg">
  <img src="hero.jpg" alt="hero">
</picture>
```

> 用 `srcset` + `sizes` 而非 CSS/JS 切换：浏览器解析 HTML 时就开始预加载图片，早于 CSS/JS 执行；JS 后改 `src` 等于多下一次原图，反而更糟——这就是 `srcset` 存在的根本原因。

## 压缩速览

```bash
# cwebp 转 WebP（quality 50-70 区间视觉差异小但字节节省显著）
cwebp -q 65 input.jpg -o output.webp

# AVIF（需 libavif / avifenc）
avifenc --min 30 --max 50 input.jpg output.avif

# sharp 批处理（Node）
node -e "require('sharp')('in.jpg').resize(800).webp({quality:65}).toFile('out.webp')"

# SVGO 压缩 SVG
svgo icon.svg -o icon.min.svg
```

> 别怕调低 quality：人眼对质量损失不敏感，50–70 区间视觉差异小但字节节省显著；批量压完用 Butteraugli / SSIM 估视觉差防止 overcompress。

## 图片 CDN 速览

```text
https://cdn.example.com/image/secure-key/hero.jpg?width=800&quality=65&format=auto

        origin      /image/security-key/file   ?transformations
```

- **origin**：自有域名避免换 CDN 改 URL
- **security-key**：防他人生成新变体（被恶意刷爆流量）
- **transformations**：size / quality / format，`format=auto` 由 CDN 按用户代理 / Save-Data / Client Hints 选最优

> 切换到图片 CDN 通常能省 **40–80% 图片字节**，且按需生成变体（不同于构建期一次性产物）。

## 下一步

- [核心模式](./guide-line.md)：响应式 `srcset` / `sizes` / `<picture>` 深入 + WebP/AVIF 格式与回退 + 压缩 + `decoding`/`width·height` 防 CLS + 图片 CDN + 反模式
- [参考](./reference.md)：格式对比表、`srcset` 语法、属性表、官方资源
