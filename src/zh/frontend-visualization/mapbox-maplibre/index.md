---
layout: doc
---

# Mapbox GL JS 与 MapLibre

**一句话定位**：Mapbox GL JS / MapLibre GL JS 是一对同源的 **WebGL 矢量瓦片地图渲染库**——在浏览器端用 GPU 实时渲染矢量瓦片（vector tiles），并按 JSON 格式的 Style Specification 上色排版，从而获得可平滑缩放/旋转/倾斜/3D 的交互地图。**分叉史一句话**：MapLibre 是社区在 **2020 年 12 月** Mapbox 把 Mapbox GL JS 转为专有许可证之前，从其最后一个 BSD-3-Clause 开源版本（**v1.13**）分叉而来的完全开源替代品——MapLibre v1 与 Mapbox GL JS v1 API 官方声明"完全向后兼容"，二者可视为"同一套技能，两个发行版"。

## 评价

**优点**

- 矢量瓦片 + WebGL 路线相比传统栅格瓦片（Leaflet 常见形态）核心优势明显：同一份数据换 style JSON 即可实时重绘换肤、原生支持平滑旋转/倾斜/3D，且体积更小、缩放不糊
- Style Specification 提供 JSON 数组形式的**声明式表达式（Expressions）**，可按缩放级别/要素属性动态计算样式，无需手写命令式着色逻辑
- MapLibre 完全开源、零许可成本、可自建瓦片服务、可魔改源码；Mapbox 提供专有底图质量与导航/搜索等配套 API，开箱体验更完整
- 两者 API 高度一致，从 Mapbox 迁移到 MapLibre 通常只需换包名、去 accessToken、换 CSS 类名前缀，业务代码基本不用大改

**缺点**

- 依赖 WebGL，比栅格瓦片方案（Leaflet）兼容性要求更高，老旧设备/浏览器可能不支持
- 选 Mapbox 意味着接受按量计费（超出免费额度后阶梯计价）；选 MapLibre 意味着需要自己解决底图与配套服务（自建或第三方托管）
- 分叉后两边渐进式分化：MapLibre 官方声明"不可反向移植 Mapbox 分叉后新增的非 BSD 代码"，导致部分新能力（如地形、投影方案）只能独立实现，实现细节可能出现差异

## 本叶地图

- [入门](./getting-started) —— 定位（WebGL 矢量瓦片）、分叉史与许可证、安装与 CSS/token 差异、第一个地图（`center` 坐标顺序坑）
- [Style 与 Sources](./guide-line/style-and-sources) —— Style Specification 根级结构、Sources 六种类型、Layers 图层类型总览
- [paint/layout 与表达式](./guide-line/paint-layout-expressions) —— paint vs layout 本质区别、数据驱动表达式、feature-state、filter
- [相机、图层与事件](./guide-line/camera-layers-events) —— 相机控制、图层动态增删改查、要素拾取、Marker/Popup、事件系统与 `load` 坑
- [GeoJSON、3D 与生态](./guide-line/geojson-3d-ecosystem) —— GeoJSON/cluster 聚合、3D 挤出建筑与地形、性能与瓦片来源、deck.gl/react-map-gl 生态、Mapbox vs MapLibre 选型
- [参考](./reference) —— Style/Sources/Layers/Expressions/API 速查表 + 易错点清单 + 选型对比 + 资源链接

## 文档地址

- [MapLibre GL JS 文档](https://maplibre.org/maplibre-gl-js/docs/) —— MapLibre 官方文档首页
- [Mapbox GL JS 文档](https://docs.mapbox.com/mapbox-gl-js/) —— Mapbox 官方文档首页

## GitHub 地址

[maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js)

## 幻灯片地址

<a href="/SlideStack/mapbox-maplibre-slide/" target="_blank">Mapbox GL JS 与 MapLibre</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=mapbox-gl-js-%E4%B8%8E-maplibre" target="_blank" rel="noopener noreferrer">Mapbox GL JS 与 MapLibre 测试题</a>
