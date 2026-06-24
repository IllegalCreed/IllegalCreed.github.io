---
layout: doc
---

# HTML 文档结构与元数据

每个 HTML 页面都从同一套骨架开始——`<!DOCTYPE html>` + `<html lang>` + `<head>` + `<body>`——而真正决定页面「怎样被解析、被搜索引擎收录、被社交平台呈现、首屏多快出来」的，是 `<head>` 里那些不可见的元数据：字符编码、视口、SEO 描述、社交分享卡片、图标、资源提示。本叶讲透这套「看不见、却最先执行」的基础设施。

## 概述

- **它管什么**：用什么编码与渲染模式解析文档、页面主题是什么（给搜索引擎）、分享出去长什么样（给社交平台）、优先加载哪些资源（给浏览器）。
- **为什么值得认真学**：`<head>` 配错的代价几乎都是隐性的——乱码、移动端不缩放、搜索摘要难看、分享没缩略图、首屏白屏更久——而且大多**不会报错**，错了你也未必察觉。
- **现代化关注点**：`viewport-fit=cover`（刘海屏）、`color-scheme` / `theme-color`（暗色 UI）、Open Graph / Twitter Card（社交卡片）、`preload` / `preconnect` / `modulepreload`（加载性能）、Speculation Rules（预测加载，目前 Chromium-only 需降级）。

## 本叶地图

- [入门](./getting-started) —— 一份「正确且现代」的 `<head>` 模板，逐行讲清每一行为什么在
- [文档骨架与渲染模式](./guide-line/document-skeleton) —— `DOCTYPE`、`<html lang>`、标准模式 vs 怪异模式
- [字符编码与视口](./guide-line/charset-viewport) —— `<meta charset>` 的 1024 字节规则、viewport 全取值与刘海屏
- [标题与 SEO 元数据](./guide-line/title-seo-meta) —— `<title>`、description、robots、canonical、theme-color、color-scheme
- [社交分享元数据](./guide-line/social-metadata) —— Open Graph 与 Twitter Card 全谱、调试工具
- [`<link>` 关系全谱](./guide-line/link-relations) —— stylesheet、icon、alternate、canonical、manifest 等 rel 取值
- [资源提示](./guide-line/resource-hints) —— preload / preconnect / prefetch / dns-prefetch / modulepreload 的取舍
- [参考](./reference) —— 速查表 + 标准 / Baseline / 调试工具链接

## 文档地址

- [web.dev: Learn HTML — Document structure](https://web.dev/learn/html/document-structure)
- [web.dev: Learn HTML — Metadata](https://web.dev/learn/html/metadata)
- [MDN: Webpage metadata（学习）](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Webpage_metadata)
- [WHATWG HTML Standard — Document metadata](https://html.spec.whatwg.org/multipage/semantics.html#document-metadata)

## 幻灯片地址

<a href="/SlideStack/html-document-metadata-slide/" target="_blank">HTML 文档结构与元数据</a>
