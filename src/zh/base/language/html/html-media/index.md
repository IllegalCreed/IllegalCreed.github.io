---
layout: doc
---

# HTML 图片与多媒体

网页里最重的资源往往不是脚本而是图片与音视频——它们直接决定首屏多快出来、用户花多少流量、布局会不会在加载途中「跳一下」。本叶讲透 `<img>` 怎样写才不抖动、`srcset` / `sizes` / `<picture>` 怎样让浏览器自动挑对图、`<audio>` / `<video>` 的自动播放与字幕规则，以及 `<iframe>` 嵌入第三方内容时如何用 `sandbox` / `allow` 把风险关进笼子。

## 概述

- **它管什么**：把图像（位图 / 矢量）、音频、视频、外部页面嵌进文档，并让每一份资源在不同屏幕尺寸、不同分辨率、不同网络下都用「最合适的那一份」。
- **为什么值得认真学**：媒体是页面的流量与性能大头。`<img>` 漏写 `width` / `height` 会引发布局抖动（CLS），`srcset` 写错会白下大图，`<iframe>` 不加 `sandbox` 会把整页安全敞开——这些坑大多**不报错**，只在真机和慢网下才暴露。
- **现代化关注点**：`loading="lazy"`（原生懒加载，Baseline 广泛可用）、`decoding="async"`、`fetchpriority`（新近可用）、AVIF / WebP 格式回退、`<picture>` 的 art direction，以及 `<iframe sandbox>` / `allow`（权限策略）的最小授权原则。

## 本叶地图

- [入门](./getting-started) —— 一份覆盖图片 / 音视频 / 嵌入的「正确且现代」模板，逐块拆解
- [`<img>` 基础与防抖](./guide-line/img-basics) —— `alt` 怎么写、`loading` / `decoding`、`width` / `height` 防 CLS
- [响应式图片](./guide-line/responsive-images) —— `srcset` 宽度 / 密度描述符、`sizes`、浏览器选图逻辑
- [art direction 与格式回退](./guide-line/art-direction) —— `<picture>` / `<source>`、`media` 换图、`type` 回退 AVIF / WebP
- [音频与视频](./guide-line/audio-video) —— `controls` / `preload` / `poster` / 自动播放策略与 `<track>` 字幕
- [`<iframe>` 嵌入与安全](./guide-line/iframe-embedding) —— `sandbox` / `allow` / `loading` / `referrerpolicy` 最小授权
- [图像映射与 object / embed](./guide-line/image-map-embed) —— `<map>` / `<area>`、`<object>` / `<embed>`、内联 SVG / MathML
- [参考](./reference) —— 速查表 + 元素 / 属性 + 图片格式对照 + Baseline / 权威链接

## 文档地址

- [web.dev: Learn HTML — Images](https://web.dev/learn/html/images)
- [web.dev: Learn HTML — Audio and video](https://web.dev/learn/html/audio-video)
- [MDN: Responsive images（学习）](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images)
- [WHATWG HTML Standard — Images / Embedded content](https://html.spec.whatwg.org/multipage/images.html)

## 幻灯片地址

<a href="/SlideStack/html-media-slide/" target="_blank">HTML 图片与多媒体</a>
