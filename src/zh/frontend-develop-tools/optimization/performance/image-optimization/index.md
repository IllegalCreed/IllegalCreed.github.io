---
layout: doc
---

# 图片优化

图片通常是网页字节大头（HTTP Archive 长期统计图片占**整页字节 50% 以上**），是性能与体验优化的最高性价比抓手。前端图片优化围绕四条主线展开：**格式选型**（WebP / AVIF / JPEG / PNG / SVG）、**响应式图片**（`srcset` + `sizes` + `<picture>`）、**压缩与解码**（quality 调参、剥元数据、`decoding=async`、`width/height` 防 CLS）、**图片 CDN**（URL 变换、auto 模式、`Vary: Accept`）。AVIF 已于 2026 年进入 [Baseline newly available](https://caniuse.com/AVIF)（全球支持约 96%、Chrome 85+ / Edge 90+ / Firefox 93+ / Safari 16+），WebP 普及更早（Chrome 32+ / Firefox 65+ / Safari 14+），可视为「现代但已广泛可用」。`srcset` / `sizes` / `<picture>` 在主流桌面与移动浏览器上多年全支持；`<img decoding>` 自 2020-01 起跨浏览器可用，是稳定规范、无即将废弃项。本叶不展开「懒加载」（`loading="lazy"` / `IntersectionObserver` / `content-visibility`）——它归【用户体验优化】章；Core Web Vitals（LCP / CLS / INP）指标本身的定义与测量归【Web Vitals】章，本叶仅在「影响」层面引用。

## 评价

**优点**

- **杠杆最大**：图片字节下降直接降低 LCP 时间与流量成本，单点改动收益 25–80%
- **工具链成熟**：`srcset` / `sizes` / `<picture>` 全浏览器稳定支持；cwebp / sharp / SVGO 等工具免费开源
- **现代格式红利仍在**：AVIF 比 JPEG 小约 50%、比 WebP 小 20–30%，且 Baseline 2026 已落地
- **CDN 自动化**：Cloudflare Images / Cloudinary / Imgix 等支持按 Client Hints / Save-Data / User-Agent 自动选最优格式与尺寸
- **降 CLS 直观**：写明 `width/height` 即可预留 aspect-ratio，几乎零成本防布局抖动

**缺点**

- **手写回退链繁琐**：AVIF → WebP → JPEG 三层 `<source>` 易写错顺序、`<img>` 兜底易漏
- **`sizes` 易写偏**：偏大选浪费带宽、偏小选模糊图；规则复杂（媒体条件描述视口非图片、禁百分比）
- **构建期压一次不够**：剥 EXIF、按需生成多尺寸变体需自动化管线，否则存储和 HTML 长度难平衡
- **跨源 CDN 有连接成本**：不 preconnect / LCP 图不加 `fetchpriority="high"` 会拖慢 LCP
- **AVIF 编码慢**：高压缩率伴随高 CPU 成本，批量压需考虑机器预算

## 文档地址

- [MDN — Using responsive images in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)
- [MDN — &lt;img&gt;: The Image Embed element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)
- [MDN — HTMLImageElement.decoding](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decoding)
- [web.dev — Choose the right image format](https://web.dev/articles/choose-the-right-image-format)
- [web.dev — Compress images](https://web.dev/articles/compress-images)
- [web.dev — Serve responsive images](https://web.dev/articles/serve-responsive-images)
- [web.dev — Serve images in next-gen formats](https://web.dev/articles/serve-images-webp)
- [web.dev — Use image CDNs to optimize images](https://web.dev/articles/image-cdns)
- [caniuse — AVIF](https://caniuse.com/AVIF)

## GitHub 地址

- [sharp](https://github.com/lovell/sharp) · [SVGO](https://github.com/svg/svgo) · [imagemin](https://github.com/imagemin/imagemin) · [squoosh](https://github.com/GoogleChromeLabs/squoosh)

## 幻灯片地址

<a href="/SlideStack/image-optimization-slide/" target="_blank">图片优化</a>

## 测试题


<a href="https://quiz.illegalscreed.cn/?category=678" target="_blank" rel="noopener noreferrer">图片优化 测试题</a>
