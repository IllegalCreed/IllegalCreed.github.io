---
layout: doc
---

# Leaflet

Leaflet 是"专为移动友好交互式地图设计的开源 JavaScript 库"（官方原话），核心目标是 simplicity（简洁）、performance（性能）、usability（易用性）三者兼顾，是开源地图领域事实标准之一，长期与 Mapbox GL JS / MapLibre GL JS、OpenLayers 并列为三大主流选型。技术路线上，它走的是"栅格瓦片图片 + DOM/SVG/Canvas 叠加矢量图形"的经典路子——不像 Mapbox GL JS/MapLibre GL JS 那样用矢量瓦片 + WebGL，因此没有原生 3D/倾斜/旋转能力，但换来了核心库官方宣传约 **42KB**（min+gzip）的体积、10 年来几乎无破坏性变更的稳定 API，以及配合 OpenStreetMap 等开放瓦片源**无需 API Key** 的自由度。**本笔记覆盖版本 v1.9.4**（2023-05 发布，当前 npm `latest` 与官网展示版本，长期冻结但插件生态活跃）；npm 上另有一条独立的 `2.0.0-alpha.1` 预发布线（ES6 class 重构、可能移除全局 `L.` 命名空间），尚未正式发布，本笔记不涉及。

## 评价

**优点**

- 核心库轻量（约 42KB min+gzip），无强制依赖
- API 10 年高度向后兼容，1.0 → 1.9 语义几乎无破坏性变更
- 配合 OpenStreetMap 等开放瓦片源**无需 API Key**（区别于部分商用地图服务）
- 插件生态成熟：标记聚合、绘制编辑、热力图、实时数据等三方插件覆盖绝大多数扩展需求
- 学习曲线平缓，命令式 DOM 风格 API 对前端开发者友好

**缺点**

- 本质是栅格瓦片 + DOM/SVG/Canvas 的传统技术路线，大规模矢量数据渲染、3D 建筑/地形、地图旋转与倾斜视角等场景明显弱于 Mapbox GL JS / MapLibre GL JS
- 核心库刻意"克制"（不内置绘制编辑、热力图等能力），重度依赖质量参差的插件生态
- 生产就绪度极高，是中小型项目、内容型网站位置展示需求的低风险选型；但地图是核心产品能力（打车/地理分析类）时通常应考虑矢量瓦片路线

## 本叶地图

- [入门](./getting-started) —— 定位（栅格瓦片 vs 矢量）、安装与 CSS 引入、第一个地图（容器高度坑）、瓦片与坐标系基础
- [地图与瓦片](./guide-line/map-and-tiles) —— 地图初始化与 options/methods/events、TileLayer、WMS/TMS、坐标系与 CRS、缩放级别体系
- [标记与矢量图形](./guide-line/markers-and-vectors) —— Marker/Icon/DivIcon、Popup/Tooltip、Polyline/Polygon/Circle/CircleMarker、SVG vs Canvas 渲染器
- [GeoJSON 与图层](./guide-line/geojson-and-layers) —— GeoJSON 加载与 Choropleth 分级统计图、图层管理（LayerGroup/FeatureGroup）、控件家族与自定义 Control
- [事件、交互与插件](./guide-line/events-interaction-plugins) —— Evented 事件系统、性能与 invalidateSize、Leaflet.markercluster、插件生态、框架集成
- [参考](./reference) —— 类/方法速查表、选型对比、易错点清单、资源链接

## 文档地址

[Leaflet](https://leafletjs.com/)

## GitHub 地址

[Leaflet/Leaflet](https://github.com/Leaflet/Leaflet)

## 幻灯片地址

<a href="/SlideStack/leaflet-slide/" target="_blank">Leaflet</a>
