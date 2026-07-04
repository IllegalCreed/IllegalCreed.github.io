---
layout: doc
---

# SVG

SVG（Scalable Vector Graphics，可缩放矢量图形）是基于 XML 的二维矢量图形语言，1999 年起就是 W3C 开放标准——「SVG 之于图形，如同 HTML 之于文本」。它以**保留模式**渲染：每个图形都是真实的 DOM 节点，可被 CSS 样式化、JS 操作、无限缩放不失真，天然获得 DOM 事件、无障碍树与搜索引擎索引。本叶覆盖坐标系统（viewport/viewBox/preserveAspectRatio）、path 的 d 命令、填充描边与描边动画、渐变图案、结构复用（`defs`/`symbol`/`use`）、clipPath 与 mask、滤镜管道、SMIL/CSS/JS 三路动画，以及 SVGO 优化与无障碍实践。

**简评**：图标、LOGO、插画、中小规模交互可视化的事实标准——声明式、可访问、可缓存、文本可压缩（gzip 后常比 PNG 小）；代价是每个图形都是 DOM 节点，节点数千级后性能陡降，大数据量渲染需让位 Canvas/WebGL。这也是面试考察密度极高的区块：viewBox 映射、A 命令七参数、描边动画原理、clipPath vs mask、`use` 的影子树、createElementNS 都是高频题。规范层面，SVG 1.1（2011）是最后一个正式 Recommendation，SVG 2 长期停在 Candidate Recommendation，浏览器按特性零散落地增量——写代码按「SVG 1.1 + 已实现的 SVG 2 增量」把握即可。

## 本叶地图

- [入门](./getting-started) —— 保留模式 vs Canvas 立即模式、五种引入方式对比、第一个 SVG 文档、规范版本现状
- [坐标与形状](./guide-line/coordinates-and-shapes) —— viewport/viewBox/preserveAspectRatio 映射机制、六个基本形状元素
- [路径](./guide-line/paths) —— d 命令全解（M/L/H/V/C/S/Q/T/A/Z）、A 命令七参数、fill-rule
- [填充描边与渐变](./guide-line/fills-strokes-gradients) —— fill/stroke 体系、dasharray 描边动画原理、线性/径向渐变、pattern 双坐标系
- [结构与复用](./guide-line/structure-and-reuse) —— g/defs/symbol/use 与影子树、marker、clipPath vs mask、滤镜原语管道
- [动画与优化](./guide-line/animation-and-optimization) —— SMIL/CSS/JS 三路动画选型、transform 坑、SVGO、性能阈值、无障碍、createElementNS
- [参考](./reference) —— 元素/属性/d 命令速查表 + 权威链接

## 文档地址

- [MDN SVG 文档](https://developer.mozilla.org/zh-CN/docs/Web/SVG) —— 教程 + 指南 + 元素/属性参考，中文完整
- [W3C SVG 2（Candidate Recommendation）](https://www.w3.org/TR/SVG2/) —— 现行规范文本

## 幻灯片地址

- <a href="/SlideStack/svg-slide/" target="_blank">SVG</a>
