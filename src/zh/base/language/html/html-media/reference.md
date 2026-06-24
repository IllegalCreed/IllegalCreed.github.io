---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 HTML Living Standard · 核于 2026-06

## 速查

- 图片三件套：`<img src alt width height>` —— `alt` 必写、`width` / `height` 防 CLS
- 性能：首屏外 `loading="lazy"`，首屏主图 `fetchpriority="high"`，配 `decoding="async"`
- 响应式：`srcset` + `sizes`（换尺寸，`w` 描述符）或 `srcset` `2x`（换清晰度，不配 `sizes`），两者不混用
- 换图 / 换格式用 `<picture>`：`<source media>` 换裁切、`<source type>` 回退 AVIF / WebP，`<img>` 兜底必写
- 音视频：`controls` 必给、`autoplay` 必配 `muted`、`preload="metadata"` 折中、字幕用 `<track>` 指 `.vtt`
- iframe 安全：`sandbox` 默认全禁按需放，**同源别同开 `allow-scripts` + `allow-same-origin`**，`allow` 最小授权
- 图像映射 `<map>` / `<area>` 可用性弱；`<object>` 带兜底、`<embed>` 已遗留；SVG 优先内联，公式用 MathML
- 现代格式：照片 AVIF / WebP 优先（JPEG 兜底），图标 / Logo 用 SVG

## 完整媒体模板

```html
<!-- 图片：防抖 + 懒加载 -->
<img src="thumb.jpg" alt="缩略图" width="320" height="180"
     loading="lazy" decoding="async" />

<!-- 响应式 + 格式回退（完全体） -->
<picture>
  <source type="image/avif"
          srcset="p-480.avif 480w, p-800.avif 800w, p-1200.avif 1200w"
          sizes="(max-width: 600px) 100vw, 50vw" />
  <source type="image/webp"
          srcset="p-480.webp 480w, p-800.webp 800w, p-1200.webp 1200w"
          sizes="(max-width: 600px) 100vw, 50vw" />
  <img src="p-800.jpg"
       srcset="p-480.jpg 480w, p-800.jpg 800w, p-1200.jpg 1200w"
       sizes="(max-width: 600px) 100vw, 50vw"
       alt="照片" width="1200" height="800" />
</picture>

<!-- 视频：可控 + 封面 + 字幕 + 多格式 -->
<video controls poster="poster.jpg" preload="metadata" width="640" height="360">
  <source src="movie.webm" type="video/webm" />
  <source src="movie.mp4" type="video/mp4" />
  <track default kind="captions" srclang="zh" label="中文" src="captions.vtt" />
</video>

<!-- 音频：可控 + 多格式 -->
<audio controls preload="metadata">
  <source src="song.opus" type="audio/ogg; codecs=opus" />
  <source src="song.mp3" type="audio/mpeg" />
</audio>

<!-- iframe：最小授权 -->
<iframe src="https://example.com/widget" title="小工具"
        sandbox="allow-scripts" allow="fullscreen"
        loading="lazy" referrerpolicy="strict-origin"
        width="600" height="400"></iframe>
```

## 元素速查

| 元素 | 用途 | 关键点 |
| --- | --- | --- |
| `<img>` | 嵌入图像（空元素） | `src` / `alt` 必备，`width` / `height` 防抖 |
| `<picture>` | 多版本图像选择容器 | `<source>` × N + `<img>` 兜底（必写） |
| `<source>` | `<picture>` / `<video>` / `<audio>` 的候选源 | `srcset` / `media` / `type` / `sizes` |
| `<audio>` | 嵌入音频 | 无 `poster` / `width` / `height` / `playsinline` |
| `<video>` | 嵌入视频 | `controls` / `poster` / `preload` / `playsinline` |
| `<track>` | 字幕 / 文本轨 | 指向 `.vtt`，`kind` / `srclang` / `default` |
| `<iframe>` | 嵌入完整文档 | `sandbox` / `allow` / `loading` / `title` |
| `<map>` / `<area>` | 图像映射热区 | `usemap` 关联，`shape` / `coords` |
| `<object>` | 嵌外部资源（带兜底） | `data` / `type`，标签间内容兜底 |
| `<embed>` | 嵌插件（空元素、无兜底） | 历史遗留，多被替代 |
| `<svg>` | 内联矢量图 | 可被 CSS / JS 操作 |
| `<math>` | 内联数学公式（MathML） | 浏览器原生排版 |

## `<img>` 属性速查

| 属性 | 取值 | 用途 |
| --- | --- | --- |
| `src` | URL | 图片地址（`src` / `srcset` 至少一个） |
| `srcset` | `URL 描述符, …` | 候选图集（`480w` 宽度 / `2x` 密度，不混用） |
| `sizes` | `条件 长度, …` | 各条件下的显示宽度（配 `w` 描述符；不能用百分比） |
| `alt` | 文本 | 替代文字；装饰图 `alt=""` |
| `width` / `height` | 整数（无单位） | 固有尺寸，防 CLS |
| `loading` | `eager`（默认）/ `lazy` | 首屏外用 `lazy` |
| `decoding` | `sync` / `async` / `auto`（默认） | 解码调度 |
| `fetchpriority` | `high` / `low` / `auto`（默认） | 下载优先级，给 LCP 主图 `high` |
| `crossorigin` | `anonymous` / `use-credentials` | CORS（canvas / 跨域需） |
| `referrerpolicy` | 见下表 | 请求图时的 `Referer` 策略 |
| `usemap` | `#名字` | 关联图像映射 |

## `<video>` / `<audio>` 属性速查

| 属性 | 取值 | 适用 |
| --- | --- | --- |
| `controls` | 布尔 | 二者；显示控件 |
| `autoplay` | 布尔（须配 `muted`） | 二者；自动播放 |
| `muted` | 布尔 | 二者；初始静音 |
| `loop` | 布尔 | 二者；循环 |
| `preload` | `none` / `metadata` / `auto` | 二者；预加载策略 |
| `crossorigin` | `anonymous` / `use-credentials` | 二者；CORS |
| `controlslist` | `nodownload` / `nofullscreen` / `noremoteplayback` | 二者；收敛控件 |
| `poster` | URL | **仅** `<video>`；封面图 |
| `width` / `height` | CSS 像素 | **仅** `<video>` |
| `playsinline` | 布尔 | **仅** `<video>`；移动端内联 |

## `<track>` `kind` 速查

| `kind` | 用途 |
| --- | --- |
| `subtitles` | 字幕：对白转写 / 翻译（默认值） |
| `captions` | 闭合字幕：对白 + 音效 + 音乐提示（听障 / 静音） |
| `descriptions` | 视觉描述：画面转可朗读文本（视障） |
| `chapters` | 章节标题：供导航跳转 |
| `metadata` | 脚本用，不展示给用户 |

## `<iframe sandbox>` token 速查

| token | 解除的限制 |
| --- | --- |
| 空值 | 施加全部限制（最严，基线） |
| `allow-scripts` | 允许脚本 |
| `allow-same-origin` | 保留源身份（**别与 `allow-scripts` 同源共用**） |
| `allow-forms` | 允许提交表单 |
| `allow-popups` | 允许弹窗 |
| `allow-modals` | 允许 `alert` / `confirm` / `prompt` |
| `allow-downloads` | 允许下载 |
| `allow-top-navigation-by-user-activation` | 用户手势触发才能导航顶层 |
| `allow-pointer-lock` / `allow-presentation` | 指针锁定 / 演示 |

## `referrerpolicy` 速查（`<img>` / `<iframe>` 通用）

| 取值 | 行为 |
| --- | --- |
| `no-referrer` | 不发 `Referer` |
| `origin` | 只发源（无路径） |
| `strict-origin` | 同等安全级才发源，降级不发 |
| `strict-origin-when-cross-origin` | **默认**：同源全 URL，跨域发源，降级不发 |
| `no-referrer-when-downgrade` | 不向非 TLS 源发 |
| `unsafe-url` | 总带完整 URL（**不安全**） |

## 图片格式对照

| 格式 | 类型 | MIME | 适合 | 现状 |
| --- | --- | --- | --- | --- |
| **AVIF** | 位图 | `image/avif` | 照片（压缩率最高） | ✅ Baseline 广泛可用，优先 |
| **WebP** | 位图 | `image/webp` | 照片 / 透明图 | ✅ 广泛可用，AVIF 之后的回退 |
| **JPEG** | 位图 | `image/jpeg` | 照片（兜底） | ✅ 万能兜底 |
| **PNG** | 位图 | `image/png` | 透明 / 锐利边缘 / 截图 | ✅ 万能兜底 |
| **SVG** | 矢量 | `image/svg+xml` | 图标 / Logo / 图表 | ✅ 矢量无限缩放 |
| **GIF** | 位图 | `image/gif` | 简单动图（已过时） | 🟡 动图改用 `<video>` 更省 |

## 音视频格式对照

| 媒体 | 推荐双发 | MIME |
| --- | --- | --- |
| 视频 | WebM（VP9 / AV1）+ MP4（H.264） | `video/webm` / `video/mp4` |
| 音频 | Opus + MP3 | `audio/ogg; codecs=opus` / `audio/mpeg` |

## 现代特性 Baseline 状态（2026-06 核）

| 特性 | 状态 | 用法建议 |
| --- | --- | --- |
| `<picture>` / `srcset` / `sizes` | ✅ Baseline 广泛可用（2016 起） | 放心用 |
| `loading="lazy"`（img / iframe） | ✅ Baseline 广泛可用 | 放心用 |
| WebP / AVIF（配 `<picture>` 回退） | ✅ 广泛可用 | 优先用，留 JPEG 兜底 |
| `decoding` | ✅ 广泛可用 | 放心用 |
| `<track>` / WebVTT | ✅ 广泛可用 | 放心用 |
| `iframe sandbox` / `allow` | ✅ 广泛可用 | 放心用，遵循最小授权 |
| `fetchpriority` | 🟡 Baseline 新近可用（2024） | 锦上添花，老浏览器忽略 |
| MathML（`<math>`） | 🟡 现代浏览器原生 | 渐进增强 |
| `<embed>` / 插件 | 🟠 多数浏览器已移除插件 | 历史遗留，改用现代元素 |

## 无障碍红线

- `<img>` 内容图**必写有意义的 `alt`**，装饰图用 `alt=""`，别省略属性；
- `<video>` / `<audio>` 提供 `controls`，视频配 `<track>` 字幕；
- 别让关键信息只靠背景视频 / 纯装饰图传达；
- `<iframe>` 必写 `title`；图像映射 `<area>` 有 `href` 时必写 `alt`；
- 自动播放别外放声音（`autoplay` 必配 `muted`）。

## 权威链接

**标准 / 规范**

- [WHATWG HTML Standard — Images](https://html.spec.whatwg.org/multipage/images.html) · [Media elements](https://html.spec.whatwg.org/multipage/media.html) · [iframe / embed / object](https://html.spec.whatwg.org/multipage/iframe-embed-object.html)
- [MDN: `<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) · [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) · [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) · [`<audio>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio) · [`<track>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track) · [`<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- [WebVTT 规范](https://www.w3.org/TR/webvtt1/) · [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)

**课程 / 指南**

- [web.dev: Learn HTML — Images](https://web.dev/learn/html/images) · [Audio and video](https://web.dev/learn/html/audio-video)
- [MDN: Responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images) · [Multimedia and embedding](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content)

**兼容性 / 工具**

- [Baseline 浏览器兼容查询：webstatus.dev](https://webstatus.dev/) · [caniuse.com](https://caniuse.com/)
- [Squoosh（图片压缩 / 转 AVIF / WebP）](https://squoosh.app/) · [RespImageLint（响应式图片体检）](https://ausi.github.io/respimagelint/)

## 相关页

- [入门](./getting-started) · [`<img>` 基础与防抖](./guide-line/img-basics) · [响应式图片](./guide-line/responsive-images)
- [art direction 与格式回退](./guide-line/art-direction) · [音频与视频](./guide-line/audio-video)
- [`<iframe>` 嵌入与安全](./guide-line/iframe-embedding) · [图像映射与 object / embed](./guide-line/image-map-embed)
