---
layout: doc
outline: [2, 3]
---

# 参考：Leaflet 类与方法速查

> 基于 Leaflet v1.9.4 · 核于 2026-07

## 速查

- **核心类**：`Map`/`TileLayer`/`GridLayer`/`Marker`/`Icon`/`DivIcon`/`Popup`/`Tooltip`/`Polyline`/`Polygon`/`Rectangle`/`Circle`/`CircleMarker`/`GeoJSON`/`LayerGroup`/`FeatureGroup`/`Control`/`LatLng`/`LatLngBounds`/`Point`/`Bounds`/`CRS`/`Evented`。
- **地图**：`L.map(id, options).setView([lat, lng], zoom)`；容器必须显式设高度。
- **Map 常用 options**：`center`/`zoom`/`minZoom`/`maxZoom`/`zoomControl`(true)/`attributionControl`(true)/`layers`/`maxBounds`/`zoomSnap`/`zoomDelta`/`preferCanvas`/`dragging` 等交互开关。
- **Map 常用方法**：`setView`/`flyTo`/`fitBounds`/`invalidateSize`（容器变化必调）/`locate`/`remove`/`addLayer`/`removeLayer`。
- **Map 常用事件**：`click`/`zoomend`/`moveend`/`resize`/`locationfound`/`popupopen`/`layeradd` 等。
- **瓦片**：`L.tileLayer(urlTemplate, options).addTo(map)`；占位符 `{z}`/`{x}{y}`/`{s}`/`{r}`；`attribution` 法律要求不可删。
- ⚠️ **`maxZoom` vs `maxNativeZoom`**：后者是瓦片源真实提供的最高级别，超出会放大插值而非请求高精度图源。
- **WMS**：`L.tileLayer.wms(url, {layers})`，服务端合成渲染；**TMS** 坐标系 Y 轴原点在左下、向上，需 `{tms:true}` 或 `{-y}` 修正（普通瓦片原点左上、Y 向下）。
- **标记**：`L.marker([lat,lng]).addTo(map)`；`L.icon({iconUrl, iconSize, iconAnchor, popupAnchor})` 自定义图片图标；`L.Icon.extend()` 复用配置；`L.divIcon({html, className})` 用 HTML/CSS 渲染。
- **弹窗/提示**：`bindPopup()`/`bindTooltip()` + `openPopup()`/`openTooltip()`；Popup 点击触发常驻，Tooltip 默认 hover 显隐。
- **矢量图形**：`L.polyline`/`L.polygon`/`L.rectangle`(传 `LatLngBounds`)/`L.circle`(`radius` 单位【米】)/`L.circleMarker`(`radius` 单位【像素】)。
- **Path 通用样式**：`color`(`#3388ff`)/`weight`(3)/`opacity`(1.0)/`fillColor`/`fillOpacity`(0.2)/`dashArray`。
- **渲染器**：默认 SVG（独立 DOM 节点）；`preferCanvas`/`L.canvas()` 切 Canvas（大量图形性能更优）。
- **GeoJSON**：`L.geoJSON(data, {pointToLayer, style, onEachFeature, filter}).addTo(map)`；坐标 `[经度,纬度]`，与 `LatLng` 的 `[纬度,经度]` **顺序相反**。
- **Choropleth 三段式**：`getColor` 阶梯函数 + `style`（属性驱动着色）+ `onEachFeature`（`setStyle`/`bringToFront`/`resetStyle`/`fitBounds` 组合出 hover 高亮 + click 缩放）。
- **图层管理**：`L.layerGroup([...])`（打包增删，**不支持** bindPopup/事件）；`L.featureGroup(...)`（继承 LayerGroup，**支持**整体 bindPopup/事件）。
- **图层控件**：`L.control.layers(baseMaps, overlayMaps)`；baseMaps 互斥、overlayMaps 独立开关；`addBaseLayer`/`addOverlay` 动态追加。
- **控件家族**：`Control.Zoom`/`Control.Attribution`/`Control.Layers`/`Control.Scale`；自定义 Control 范式：`L.control(opts).onAdd = (map) => div`。
- **CRS 三选项**：`EPSG3857`（默认，Web Mercator）/`EPSG4326`（WGS84）/`Simple`（1 地图单位=1 像素，游戏地图/室内平面图）。
- **缩放级别**：0 级=整个地球一张 256×256 瓦片，每级世界地图宽高翻倍（`256 · 2^n` 像素）。
- **Overlays**：`L.imageOverlay`/`L.videoOverlay`(继承自 ImageOverlay)/`L.svgOverlay`，均用 `LatLngBounds` 校准媒体资源。
- **Map Panes**：默认堆叠（从下到上）`TileLayer` → `Path` → Marker 阴影 → Marker 图标 → `Popup`；`map.createPane()` + `zIndex` 自定义顺序。
- **Evented**：`on`/`off`/`once`/`fire`；`Map`/`Marker`/各 `Layer`/`Control`/`Popup`/`Tooltip` 几乎全部继承。
- **性能**：`invalidateSize()` 容器变化后必调；`Leaflet.markercluster` 支持 5 万+ 点位，全部 `addLayer` 到 cluster 后再整体 `map.addLayer`。
- **插件生态**：markercluster（聚合）/draw（绘制编辑）/heat（热力图）/Realtime（实时数据）/proj4leaflet（自定义投影）/leaflet-defaulticon-compatibility（构建工具图标修复）。
- **框架集成**：react-leaflet（`MapContainer`/`TileLayer`/`Marker`）/ Vue-Leaflet（`LMap`/`LTileLayer`/`LMarker`），均为命令式核心 API 的声明式外壳。
- **选型**：需求是"放地图+标点+画区域+叠 GeoJSON"、无 3D/复杂动态样式 → Leaflet；地图是核心产品能力、需要 3D/旋转倾斜/大规模矢量高频交互 → Mapbox GL JS/MapLibre GL JS。
- **版本**：本笔记基于 npm `latest` = **1.9.4**（2023-05 发布）；另有独立的 `alpha: 2.0.0-alpha.1`（ES6 class 重构线，未发布稳定版，不在本笔记范围）。

## 一、核心类速查表

| 类 | 职责 |
| --- | --- |
| `Map` | 地图实例：容器绑定、视图控制、图层容器 |
| `TileLayer` / `GridLayer` | 栅格瓦片图层 / 瓦片图层抽象基类 |
| `Marker` | 点标记；配 `Icon`/`DivIcon` 定义外观 |
| `Icon` / `DivIcon` | 图片图标 / HTML-CSS 图标 |
| `Popup` / `Tooltip` | 点击常驻弹窗 / hover 轻量提示 |
| `Polyline` / `Polygon` / `Rectangle` | 折线 / 多边形（自动闭合） / 矩形（传 `LatLngBounds`） |
| `Circle` / `CircleMarker` | 地理圆（半径单位米） / 屏幕圆点（半径单位像素） |
| `GeoJSON` | 加载/渲染 GeoJSON 数据，内置坐标转换 |
| `LayerGroup` / `FeatureGroup` | 图层打包 / 可交互图层打包（继承前者） |
| `Control` 家族 | Zoom / Attribution / Layers / Scale + 自定义 Control |
| `LatLng` / `LatLngBounds` | 地理坐标点 / 地理坐标范围 |
| `Point` / `Bounds` | 像素坐标点 / 像素坐标范围（底层渲染用） |
| `CRS` | 坐标参考系：`EPSG3857`/`EPSG4326`/`Simple` |
| `Evented` | 事件基类：`on`/`off`/`once`/`fire`，几乎所有类的父类 |

## 二、Map 常用 options / methods / events

**options**：

| 选项 | 说明 |
| --- | --- |
| `center` / `zoom` | 初始中心点 / 初始缩放级别 |
| `minZoom` / `maxZoom` | 允许的最小 / 最大缩放级别 |
| `zoomControl` | 是否显示缩放控件，默认 `true` |
| `attributionControl` | 是否显示版权控件，默认 `true` |
| `layers` | 初始化时即加入地图的图层数组 |
| `maxBounds` | 限制地图可平移查看的地理范围 |
| `zoomSnap` / `zoomDelta` | 缩放级别对齐粒度 / 每次缩放的增量 |
| `preferCanvas` | 矢量图形优先用 Canvas 而非 SVG 渲染 |
| `dragging` / `scrollWheelZoom` / `doubleClickZoom` / `boxZoom` / `touchZoom` / `keyboard` | 各类交互开关 |

**methods**：`setView` / `setZoom` / `zoomIn` / `zoomOut` / `panTo` / `panBy` / `fitBounds` / `flyTo`（带动画飞行）/ `flyToBounds` / `getBounds` / `getCenter` / `getZoom` / `invalidateSize`（容器尺寸变化后必调）/ `locate`（浏览器定位）/ `remove`（销毁地图）/ `addLayer` / `removeLayer` / `setMaxBounds`。

**events**：`load` / `click` / `dblclick` / `zoomstart` / `zoomend` / `movestart` / `moveend` / `zoom` / `move` / `resize` / `locationfound` / `locationerror` / `popupopen` / `popupclose` / `tooltipopen` / `tooltipclose` / `layeradd` / `layerremove`。

## 三、TileLayer / GridLayer options

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `attribution` | `null` | 版权/来源声明（法律要求，不可删） |
| `subdomains` | `'abc'` | 子域名列表，可为字符串或数组 |
| `tms` | `false` | 是否为 TMS 服务（Y 轴反转） |
| `opacity` | `1.0` | 瓦片透明度 |
| `zIndex` | `1` | 层级顺序 |
| `minZoom` / `maxZoom` | `0` / `18` | 地图允许该图层显示的缩放范围 |
| `minNativeZoom` / `maxNativeZoom` | `undefined` | 瓦片源实际提供瓦片的级别范围 |
| `bounds` | `undefined` | 仅在指定地理范围内加载瓦片 |
| `noWrap` | `false` | 低缩放级别下是否禁止世界地图重复平铺 |
| `errorTileUrl` | `''` | 瓦片加载失败时的占位图 |
| `detectRetina` | `false` | 是否为高 DPI 屏幕请求 Retina 瓦片 |
| `keepBuffer` | `2` | 平移时视口外保留的瓦片行列数（预加载） |

URL 模板占位符：`{z}`（缩放级别）/ `{x}{y}`（瓦片坐标）/ `{s}`（子域名）/ `{r}`（Retina 后缀）。

## 四、Path 通用 options 与构造函数

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `stroke` | `true` | 是否绘制描边 |
| `color` | `'#3388ff'` | 描边颜色 |
| `weight` | `3` | 描边宽度（像素） |
| `opacity` | `1.0` | 描边不透明度 |
| `fill` | 视形状而定 | 是否填充 |
| `fillColor` | 同 `color` | 填充颜色 |
| `fillOpacity` | `0.2` | 填充不透明度 |
| `fillRule` | `'evenodd'` | SVG fill-rule |
| `lineCap` / `lineJoin` | `'round'` | SVG 线帽/线连接样式 |
| `dashArray` | — | 虚线样式，如 `'5, 10'` |

```js
L.polyline(latlngsArray, options); // 折线：普通坐标数组
L.polygon(latlngsArray, options); // 多边形：自动闭合
L.rectangle(latLngBounds, options); // 矩形：传 LatLngBounds 而非坐标数组
L.circle([lat, lng], { radius: 500 }); // 圆：radius 单位【米】，随缩放保持真实地理尺寸
L.circleMarker([lat, lng], { radius: 5 }); // 圆点：radius 单位【像素】，不随缩放改变
```

## 五、GeoJSON 回调与方法速查

| 回调/方法 | 用途 |
| --- | --- |
| `pointToLayer(feature, latlng)` | 把 `Point` 要素转换为自定义 Marker/CircleMarker |
| `style(feature)` | 函数或对象，依据 `feature.properties` 动态返回样式 |
| `onEachFeature(feature, layer)` | 对每个要素执行回调（典型：绑定 popup、绑定 hover/click 事件） |
| `filter(feature, layer)` | 控制哪些要素被渲染 |
| `addData(data)` | 追量添加数据到已有图层 |
| `resetStyle(layer?)` | 重置为默认/初始样式 |
| `toGeoJSON()` | 导出当前图层为 GeoJSON |

## 六、CRS 与坐标系速查

| CRS | 用途 |
| --- | --- |
| `L.CRS.EPSG3857`（默认） | Web Mercator 投影，瓦片地图事实标准 |
| `L.CRS.EPSG4326` | WGS84 地理坐标，经纬度直接映射 |
| `L.CRS.Simple` | 简单笛卡尔坐标系（1 地图单位=1 像素），游戏地图/室内平面图 |

| 坐标系 | 顺序 |
| --- | --- |
| Leaflet `LatLng` | `[纬度, 经度]` |
| GeoJSON（RFC 7946） | `[经度, 纬度]` |

缩放级别体系：0 级 = 整个地球一张 **256×256** 瓦片；每升一级，世界地图宽高**翻倍**（第 n 级尺寸 `256 · 2^n` 像素，瓦片数按 4 的幂次增长）；常见瓦片源最高到约 18～19 级。

## 七、选型对比：Leaflet vs Mapbox GL JS / MapLibre GL JS

| 维度 | Leaflet | Mapbox GL JS / MapLibre GL JS |
| --- | --- | --- |
| 渲染技术路线 | 栅格瓦片图片 + DOM/SVG/Canvas 叠加矢量图形 | 矢量瓦片 + WebGL GPU 渲染 |
| 核心体积 | 官方宣传约 42KB（min+gzip） | 明显更大（数百 KB 级） |
| 3D / 倾斜 / 旋转 | 不支持（或需专门插件勉强实现） | 原生支持，性能表现好 |
| 动态样式 | 无内置表达式系统，样式需手写 JS 逻辑计算（如 Choropleth 的 `getColor` 阶梯函数） | 内置 style expression，可按 zoom/属性做声明式插值 |
| 是否需要 API Key/Token | 配合 OSM 等开放瓦片源**无需** Key | Mapbox 官方托管瓦片需要 token；MapLibre 本身不强制，但仍需自备瓦片源 |
| 许可证 | 全程 BSD-2-Clause 开源 | Mapbox GL JS v2 起改为非 OSI 开源的专有条款许可；MapLibre GL JS 是社区从 Mapbox GL JS 最后一个 BSD 版本（v1.13）fork 延续维护的开源分支 |
| 插件/生态成熟度 | 10+ 年生产验证，聚合/绘制/热力图/实时数据等插件齐全但质量参差 | 相对更新，官方生态（若用 Mapbox 全家桶）强，纯开源 MapLibre 插件相对更少 |
| 学习曲线 | 平缓，命令式 DOM 风格 API | 略陡，需理解 vector tile + style spec + expression |
| 典型适用场景 | 中小数据量的位置展示、内容型网站地图嵌入、无 3D/旋转诉求、追求轻量与快速上手 | 地图是核心产品能力（出行/地理可视化 BI）、需要旋转倾斜/3D、大规模矢量数据高频交互、强定制视觉风格 |

**何时选 Leaflet**：需求是"放一张地图 + 标几个点/画几个区域/叠一层 GeoJSON"，不涉及 3D 或复杂动态样式；团队想要最小体积、最快上手、最少概念负担；需要成熟稳定、久经生产验证的现成插件；希望规避商业地图服务的 Token/计费依赖。

**何时选 Mapbox GL JS / MapLibre GL JS**：地图渲染性能和大数据量矢量瓦片是产品核心竞争力；需要 3D 建筑/地形、倾斜视角、平滑旋转导航体验；需要高度定制、设计感强的地图视觉风格。

**本质结论**：Leaflet 代表"栅格瓦片 + 命令式 DOM API"技术路线的成熟收敛形态，Mapbox GL JS/MapLibre 代表"矢量瓦片 + WebGL + 声明式样式"的新一代路线；两者不是单纯的新旧替代关系，而是面向不同产品复杂度和性能需求的分层选型。

## 八、插件与框架集成速查

| 插件 | 用途 |
| --- | --- |
| Leaflet.markercluster | 海量标记聚合（支持 5 万+ 点位） |
| Leaflet.draw | 交互式绘制/编辑矢量图形 |
| Leaflet.heat | 热力图 |
| Leaflet.Realtime | 实时数据源自动刷新图层 |
| proj4leaflet | 对接任意自定义投影坐标系 |
| leaflet-defaulticon-compatibility | 修复构建工具下默认图标路径丢失 |

| 框架封装 | 组件示例 |
| --- | --- |
| react-leaflet | `MapContainer` / `TileLayer` / `Marker`，命令式操作走 `useMap()`/ref |
| Vue-Leaflet（`@vue-leaflet/vue-leaflet`） | `LMap` / `LTileLayer` / `LMarker` |

## 九、易错点清单

- **地图容器高度未设置** → 地图空白不显示；父级 flex 链路也要传递到底。
- **LatLng 顺序 vs GeoJSON 坐标顺序相反** → `L.latLng(lat, lng)` 纬度在前，GeoJSON 是 `[经度, 纬度]`，手写/转换时最容易搞反。
- **瓦片 `attribution` 不可省略** → 生产环境删除/隐藏版权控件属于违反数据源使用条款。
- **`invalidateSize()` 遗漏** → 容器尺寸变化后不调用，导致瓦片错位、留白、坐标偏移。
- **webpack/vite 下默认 Marker 图标丢失（404）** → 需 `mergeOptions` 重设图标 URL，或引入 `leaflet-defaulticon-compatibility`。
- **TMS 瓦片 Y 轴方向搞反** → 需 `{tms: true}` 或 URL 模板 `{-y}` 修正。
- **`maxZoom` 设置超过瓦片源真实精度** → 未设 `maxNativeZoom` 时超出级别的瓦片会被放大插值（糊化）。
- **`LayerGroup` 与 `FeatureGroup` 混淆** → 对 `LayerGroup` 调用 `bindPopup()`/事件监听不会生效。
- **`Circle` 与 `CircleMarker` 半径单位混淆** → 前者米（随缩放变屏幕大小），后者像素（屏幕固定）。
- **自定义 Pane 层级顺序理解不到位** → 多图层复杂场景需显式 `map.createPane()` + `zIndex` 才能精确控制堆叠。

## 十、版本说明：v1.9.4 稳定线与 2.0.0-alpha 预发布线

npm `dist-tags` 显示：`latest` = **1.9.4**（2023-05-18 发布，距今约 3 年未出新 stable 版本，说明 API 已高度稳定/冻结，非维护停滞——issue/插件生态仍活跃），另有独立的 `alpha: 2.0.0-alpha.1`（ES6 class 重构线，可能移除全局 `L.` 命名空间）。两者并行存在，`2.0.0-alpha.1` 尚未发布稳定版，**本笔记全程采用 v1.9.4 的 `L.` 全局命名空间写法**，不涉及未发布的 v2 API。包元信息：`license: BSD-2-Clause`，仓库 `github.com/Leaflet/Leaflet`，维护者含原作者 `mourner`（Vladimir Agafonkin）。⚠️ npm 包 `unpackedSize` ≈ 3.7MB 是含源码/文档/构建脚本的非发行体积，不要与官网宣传的核心库 "42KB"（min+gzip 后的实际体积）混淆。

## 十一、权威链接

- [Leaflet 官网](https://leafletjs.com/) —— 首页定位、Quick Start、全部教程示例导航
- [Leaflet API Reference](https://leafletjs.com/reference.html) —— 全量 API 参考
- [GitHub Leaflet/Leaflet](https://github.com/Leaflet/Leaflet) —— 源码仓库
- [npm leaflet](https://registry.npmjs.org/leaflet) —— 版本与 dist-tags 查询
- [MapLibre](https://maplibre.org/) —— 选型对比一节涉及的 MapLibre GL JS 定位来源
- 本站幻灯片：<a href="/SlideStack/leaflet-slide/" target="_blank">Leaflet</a>
