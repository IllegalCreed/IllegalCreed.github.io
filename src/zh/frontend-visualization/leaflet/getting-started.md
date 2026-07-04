---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个地图

> 基于 Leaflet v1.9.4 · 核于 2026-07

## 速查

- **定位**：官方原话——"a JavaScript library for mobile-friendly interactive maps"（专为移动友好交互式地图设计的开源库），三大目标 simplicity（简洁）/ performance（性能）/ usability（易用性）。
- **技术路线**：栅格瓦片图片 + DOM/SVG/Canvas 叠加矢量图形，区别于 Mapbox GL JS/MapLibre GL JS 的矢量瓦片 + WebGL 路线（无原生 3D/倾斜/旋转），详见[参考页选型对比](./reference)。
- **体积**：核心库官方宣传约 **42KB**（min+gzip）；⚠️ npm 包本身 `unpackedSize` ≈ 3.7MB 是含源码/文档/构建脚本的非发行体积，不要与之混淆。
- **安装**：`npm install leaflet`。
- ⚠️ **CSS 必须单独引入**：`import "leaflet/dist/leaflet.css"`（或 `<link>`），漏引入会导致控件错位、弹窗样式坍塌、瓦片间出现缝隙。
- **地图三要素**：`L.map(containerId).setView([lat, lng], zoom)`，两者通常链式调用。
- ⚠️ **地图容器 `div` 必须显式设置 CSS 高度**（官方 Quick Start 第一条注意事项），否则容器高度为 0、地图空白不显示——新手最高频的"地图空白"问题；父级 flex 布局也要把高度一路传递到底。
- **瓦片图层**：`L.tileLayer(urlTemplate, options).addTo(map)` 添加底图。
- **URL 占位符**：`{z}` 缩放级别、`{x}{y}` 瓦片坐标、`{s}` 可用子域名（默认 `abc`，浏览器并行请求提速）、`{r}` Retina 高清屏后缀（如 `@2x`）。
- ⚠️ **`attribution` 是法律要求**，OpenStreetMap 等开放数据源明确要求署名，生产环境不可删除/隐藏。
- 配合 OSM 等开放瓦片源**无需申请 API Key**（区别于部分商用地图服务）。
- ⚠️ **LatLng 顺序坑**：`L.latLng(lat, lng)` 是**纬度在前、经度在后**；GeoJSON 标准坐标数组是 `[经度, 纬度]`，两者顺序相反，手写坐标或从 GeoJSON 转手写数组时最容易搞反。
- **默认坐标参考系**：`L.CRS.EPSG3857`（Web Mercator 投影，瓦片地图事实标准）；`EPSG4326`/`Simple` 等进阶选项见[地图与瓦片](./guide-line/map-and-tiles)。
- **加个标记**：`L.marker([lat, lng]).addTo(map)`，深入的 Icon/Popup/矢量图形见[标记与矢量图形](./guide-line/markers-and-vectors)。
- **常用 Map 方法速记**：`setView`/`panTo`/`flyTo`（带动画飞行）/`fitBounds`/`invalidateSize`（容器尺寸变化后必调）/`locate`（浏览器定位）。
- **常用 Map options 补充**：`minZoom`/`maxZoom`、`zoomControl`（默认 `true`）、`attributionControl`（默认 `true`）、`dragging`/`scrollWheelZoom` 等交互开关，完整表见[地图与瓦片](./guide-line/map-and-tiles)。
- **常用 Map 事件**：`click`/`zoomend`/`moveend`/`resize`/`locationfound` 等；事件基类 `Evented` 统一提供 `on`/`off`/`once`/`fire`，几乎所有核心类都继承它。
- **WMS 与 TMS**：`L.tileLayer.wms(url, {layers})` 对接 WMS 服务，服务端可一次合成多图层；TMS 瓦片 Y 轴原点在左下（普通瓦片在左上），需 `{tms: true}` 或 URL 模板里的 `{-y}` 修正。
- **缩放级别体系**：0 级 = 整个地球一张 256×256 瓦片，每升一级世界地图宽高翻倍（`256 · 2^n` 像素），常见瓦片源最高到约 18~19 级。
- **矢量图形速记**：`L.circle`（`radius` 单位米）/ `L.circleMarker`（`radius` 单位像素）两者极易混淆，详见[标记与矢量图形](./guide-line/markers-and-vectors)。
- **数据驱动地图**：`L.geoJSON(data, options)` 配 `style`/`onEachFeature` 可做分级着色（Choropleth）+ hover 高亮，坐标顺序与 LatLng 相反，完整范式见[GeoJSON 与图层](./guide-line/geojson-and-layers)。
- **性能提示**：矢量图形量大时 `preferCanvas: true` 或 `L.canvas()` 切 Canvas 渲染；标记数量上万用 `Leaflet.markercluster` 聚合。
- **命令式风格**：几乎所有 Leaflet API 都是"创建实例 → 链式调用/传 options → `.addTo(map)`"的统一范式，跨 TileLayer/Marker/Popup/Path/Control 通用。
- **多图层叠加**：多个 `L.tileLayer` 可叠加（如底图 + 路网标注层），用 `zIndex` 或添加顺序控制堆叠。
- **生态**：react-leaflet（`MapContainer`/`TileLayer`/`Marker` 等组件）与 Vue-Leaflet（`LMap`/`LTileLayer`/`LMarker`）是声明式框架封装，核心概念与本笔记完全通用。
- **插件生态**是 Leaflet 的核心特色：核心库刻意精简，聚合/绘制/热力图/实时数据靠 Leaflet.markercluster / Leaflet.draw / Leaflet.heat / Leaflet.Realtime 等三方插件，详见[事件、交互与插件](./guide-line/events-interaction-plugins)。
- **生产就绪度**：极高，是中小型项目、内容型网站位置展示需求的低风险选型。
- **进阶顺序**：入门 → [地图与瓦片](./guide-line/map-and-tiles) → [标记与矢量图形](./guide-line/markers-and-vectors) → [GeoJSON 与图层](./guide-line/geojson-and-layers) → [事件、交互与插件](./guide-line/events-interaction-plugins) → [参考](./reference)。

## 一、定位：轻量栅格瓦片地图 vs 矢量

Leaflet 官方一句话定位：**"a JavaScript library for mobile-friendly interactive maps"**（专为移动友好交互式地图设计的开源 JavaScript 库），三大设计目标是 **simplicity（简洁）**、**performance（性能）**、**usability（易用性）**。它是开源地图领域事实标准之一，长期与 Mapbox GL JS / MapLibre GL JS、OpenLayers 并列为三大主流选型。

技术路线上，Leaflet 走的是**栅格瓦片图片 + DOM/SVG/Canvas 叠加矢量图形**的经典路子：底图是服务端预先切好的一张张图片瓦片，标记、折线、多边形等矢量图形用浏览器原生的 DOM/SVG（或 Canvas）渲染叠加在瓦片之上。这与 Mapbox GL JS/MapLibre GL JS 的**矢量瓦片 + WebGL GPU 渲染**路线有本质区别——后者原生支持流畅旋转/倾斜/3D，Leaflet 则不支持（或需专门插件勉强实现）。两条路线不是新旧替代关系，而是面向不同产品复杂度的分层选型，详细对比见[参考页](./reference)。

换来的好处很直接：核心库官方宣传约 **42KB**（min+gzip）；API 10 年来高度向后兼容，1.0 → 1.9 语义几乎无破坏性变更；配合 OpenStreetMap 等开放瓦片源**无需申请 API Key**；学习曲线平缓，命令式 DOM 风格 API 对前端开发者友好。

## 二、安装：npm 与 CSS 引入

```bash
npm install leaflet
```

```js
import L from "leaflet";
// ⚠️ CSS 必须单独引入！Leaflet 的控件定位、弹窗样式、图标锚点都依赖这份样式表
import "leaflet/dist/leaflet.css";
```

如果不走打包工具、直接用 `<script>` 标签引入，同样要记得在 `<head>` 里手动加一份 `<link rel="stylesheet" href=".../leaflet.css" />`。**漏引入 CSS** 是另一个新手高频坑，表现为地图控件错位、弹窗样式坍塌、瓦片之间出现缝隙。

## 三、第一个地图：容器高度是第一坑

```html
<div id="map"></div>
```

```css
/* 地图容器必须显式设置高度，父级 flex 链路也要传递到底 */
#map {
  height: 400px;
}
```

```js
// L.map(容器 id, options) 创建地图实例
// .setView([纬度, 经度], 缩放级别) 设定初始中心点与缩放级别，两者通常链式调用
const map = L.map("map").setView([51.505, -0.09], 13);
```

::: warning 地图容器必须显式设置 CSS 高度
官方 Quick Start 教程原文强调的第一条注意事项——**确保地图容器具有定义的高度**。不设置高度时容器高度为 0，地图区域完全不显示，这是新手最高频的"地图空白"问题。父级若是 flex 布局，高度也要沿链路一路传递到底（如 `min-h-screen flex flex-col` → `flex-1` 这类写法），否则中间某一层高度塌陷，最终容器依旧是 0。
:::

## 四、瓦片图层与坐标系基础

光有地图实例还看不到任何底图，需要加一层瓦片图层，再加一个标记让地图上有内容可看：

```js
// L.tileLayer(URL 模板, options).addTo(map) 添加瓦片图层
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  // attribution 是法律要求，OpenStreetMap 等开放数据源明确要求署名展示
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// 加一个基础标记
L.marker([51.5, -0.09]).addTo(map);
```

URL 模板里的占位符：`{z}` 是缩放级别、`{x}{y}` 是瓦片坐标、`{s}` 是可用子域名（默认 `abc`，用于浏览器并行请求提速）、`{r}` 是 Retina 高清屏后缀（如 `@2x`）。**`attribution` 不可省略或隐藏**——OpenStreetMap 等开放数据源的使用条款明确要求署名展示，生产环境删除/隐藏版权控件属于违反数据源使用条款。

坐标系上有一个贯穿全局的必考坑：

::: warning LatLng 顺序 vs GeoJSON 坐标顺序相反
`L.latLng(lat, lng)` / `.setView([lat, lng], zoom)` 都是**纬度在前、经度在后**。而 GeoJSON 标准（RFC 7946）规定坐标数组是 `[经度, 纬度]`，**顺序相反**。手写坐标、或把 GeoJSON 数据转成手写坐标数组时最容易搞反，表现为标记/图形出现在地球另一端或海洋中央。
:::

地图默认使用 `L.CRS.EPSG3857`（Web Mercator 投影，瓦片地图事实标准）坐标参考系；`EPSG4326`（WGS84 经纬度直接映射）、`Simple`（无地理意义的简单笛卡尔坐标系，用于游戏地图/室内平面图）等进阶选项，以及缩放级别体系、WMS/TMS 差异，都在下一篇详细展开。

跑通第一个地图后，进入[地图与瓦片](./guide-line/map-and-tiles)：地图 options/methods/events 全貌、TileLayer 深入配置、WMS 与 TMS、坐标系与 CRS、缩放级别体系。
