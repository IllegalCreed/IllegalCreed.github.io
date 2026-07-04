---
layout: doc
outline: [2, 3]
---

# GeoJSON、3D 与生态：聚合、地形、性能与选型

> 基于 **MapLibre GL JS 5.x**（npm latest 5.24.0，BSD-3-Clause）/ **Mapbox GL JS 3.x**（npm latest 3.25.0，专有许可证）· 核于 2026-07

## 速查

- **GeoJSON 动态更新**：`map.getSource(id).setData(newGeoJsonObject)` 整体替换数据；增量更新的常见做法是重新拉取接口后整体 `setData`，而不是逐要素增删。
- **聚合三件套**：`cluster: true` 自动附加 `point_count` 属性；`clusterMaxZoom` 控制多大缩放级别之后不再聚合；`clusterRadius` 控制聚合像素半径；`clusterProperties` 自定义聚合运算（如对某数值属性求和）。
- **3D 挤出建筑**：`fill-extrusion` 图层，`fill-extrusion-height`/`fill-extrusion-base` 常配合 `['get', ...]` 表达式读取要素属性。
- **地形起伏**：`raster-dem` 类型 source 提供高程数据，`map.setTerrain({ source, exaggeration })` 启用，`exaggeration` 控制夸张系数（>1 视觉放大高程差）。
- **sky/light**：Style 根级 `sky` 配置大气/天空盒效果，`light` 控制全局光照（影响 `fill-extrusion` 等 3D 图层明暗）。
- ⚠️ **Mapbox Standard 专有能力**：`mapbox://styles/mapbox/standard` 把光照/天空/3D 建筑材质做成内置专有配置项（白天/夜晚预设、3D 地标），MapLibre 无对应托管实现，需自己拼 style 或用社区开源 3D 风格。
- **性能优势**：矢量瓦片同一份数据配合任意 style 实时重绘（换肤不用换瓦片源）、体积更小、缩放旋转不糊；代价是客户端渲染开销更高、依赖 WebGL。
- **免费/自建瓦片来源**：MapLibre 官方演示 style（`demotiles.maplibre.org`）、**OpenFreeMap**（完全免费无需 key）、商业托管 **MapTiler**、自建开源 **tileserver-gl**；Mapbox 侧默认走官方托管矢量瓦片，是计费主要来源。
- **deck.gl**：`@deck.gl/mapbox` 模块叠加大规模数据可视化图层，支持 **overlaid**（独立 canvas，兼容性好）与 **interleaved**（渲染进地图 WebGL2 上下文，可严格按高度插值排序，需 `maplibre-gl` 版本 > 3 且需 WebGL2）两种模式。
- **react-map-gl**：官方推荐 React 封装，v8 起拆分为 `react-map-gl/mapbox`（适配 `mapbox-gl>=3.5.0`）与 `react-map-gl/maplibre`（适配 `maplibre-gl>=4`），需按底层库分别导入不能混用。
- **选型口诀**：能接受计费、要 Mapbox 专属底图与配套服务 → Mapbox；追求零许可成本、可自主托管、可魔改源码 → MapLibre；完整对比见下方选型表。
- **进阶顺序**：[相机、图层与事件](./camera-layers-events) → 本页 → [参考](../reference)。

## 一、GeoJSON 数据源与运行时更新

GeoJSON source 支持运行时用 `setData()` 整体替换数据（增量更新的常见做法是重新拉取接口后整体 `setData`，而不是逐要素增删）：

```js
map.getSource("points").setData(newGeoJsonObject);
```

## 二、聚合 Cluster 三件套

聚合（cluster）三件套：`cluster: true` 开启后，MapLibre/Mapbox 会自动给聚合点附加 `point_count` 属性；`clusterMaxZoom` 控制多大缩放级别之后不再聚合（展开成单点）；`clusterRadius` 控制聚合的像素半径；`clusterProperties` 可以自定义聚合时对属性做的运算（例如对某数值属性求和）：

```js
map.addSource("earthquakes", {
  type: "geojson",
  data: "./data.geojson",
  cluster: true,
  clusterRadius: 50,
  clusterMaxZoom: 14,
  clusterProperties: { sum: ["+", ["get", "value"]] }, // 聚合内某属性求和
});
```

配合 `step` 表达式（见 [paint/layout 与表达式](./paint-layout-expressions)）按 `point_count` 分级显示不同大小/颜色的聚合圆点，是最经典的聚合可视化组合拳。

## 三、3D 挤出建筑：fill-extrusion

`fill-extrusion` 图层实现 3D 挤出建筑，`height`/`base` 常配合 `['get', ...]` 表达式读取每个要素自身的高度属性：

```js
map.addLayer({
  id: "building-3d",
  type: "fill-extrusion",
  source: "buildings",
  paint: {
    "fill-extrusion-color": "#aaa",
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["get", "min_height"],
    "fill-extrusion-opacity": 0.6,
  },
});
```

## 四、地形：raster-dem 与 setTerrain

地形能力通过 `raster-dem` 类型的 source 提供高程数据，再用 `map.setTerrain({ source, exaggeration })` 启用地形起伏渲染：

```js
map.setTerrain({ source: "terrain-source-id", exaggeration: 1.5 }); // exaggeration 控制夸张系数，>1 会视觉放大高程差
```

Style 根级的 `sky` 属性可以配置大气/天空盒效果，`light` 属性控制全局光照（影响 `fill-extrusion` 等 3D 图层的明暗）。

::: warning Mapbox Standard 是专有能力
Mapbox 一侧的 `mapbox://styles/mapbox/standard`（Mapbox Standard 风格）把光照、天空、3D 建筑材质做成了内置的专有配置项（如白天/夜晚光照预设、3D 地标），这部分属于 Mapbox 专有能力，**MapLibre 没有对应的托管实现**，需要自己拼 style 或用社区提供的开源 3D 风格。
:::

## 五、性能与瓦片来源

矢量瓦片相比栅格瓦片的核心优势：同一份瓦片可以配合任意 style 实时重绘（换肤不用换瓦片源）、体积更小、缩放旋转不糊；代价是客户端渲染开销更高、依赖 WebGL。海量点位场景优先用 `symbol`/`circle` 图层而非成千上万个 `Marker` DOM 元素（详见[相机、图层与事件](./camera-layers-events)）；海量 GeoJSON 场景 MapLibre 官方有专门的性能优化指南（Optimising MapLibre Performance: Tips for Large GeoJSON Datasets）。

免费/自建瓦片来源：MapLibre 官方演示 style `https://demotiles.maplibre.org/style.json`；社区免费矢量瓦片服务 **OpenFreeMap**（`https://tiles.openfreemap.org/styles/bright`，完全免费无需 key）；商业托管服务 **MapTiler**；自建可用开源的 **tileserver-gl**。Mapbox 一侧则默认走其官方托管的矢量瓦片（`mapbox://mapbox.mapbox-streets-v8` 等），是计费的主要来源。

## 六、生态：deck.gl 与 react-map-gl

**deck.gl** 提供 `@deck.gl/mapbox` 模块把大规模数据可视化图层叠加在 Mapbox/MapLibre 地图上，支持两种模式：**overlaid**（在独立 canvas 里叠加渲染，兼容性好）和 **interleaved**（直接渲染进地图的 WebGL2 上下文，可与底图图层严格按高度插值排序，但要求 `maplibre-gl` 版本 > 3，需 WebGL2）。

**react-map-gl** 是官方推荐的 React 封装，v8 起彻底拆分为两个独立子包：`react-map-gl/mapbox`（适配 `mapbox-gl>=3.5.0`）与 `react-map-gl/maplibre`（适配 `maplibre-gl>=4`），同时支持两者但需要按用哪个底层库分别导入，不能混用。

## 七、选型：Mapbox GL JS vs MapLibre GL JS

| 维度 | Mapbox GL JS | MapLibre GL JS |
| --- | --- | --- |
| 许可证 | 专有许可证（`SEE LICENSE IN LICENSE.txt`），需接受 Mapbox 服务条款 | BSD-3-Clause 完全开源 |
| 计费 | 每月 50,000 次免费 web map load，超额阶梯计费（约 $5/1000 起步，随量下降） | 完全免费，无使用量限制（自建瓦片服务的带宽/存储成本自理） |
| 底图/服务 | 可用 Mapbox 官方托管矢量瓦片、Mapbox Standard 专有 style、导航/搜索等配套 API | 需自建瓦片服务或使用第三方（MapTiler/OpenFreeMap 等），无官方托管服务与配套 API |
| API 兼容性 | 基线 API | 与 Mapbox v1 API 完全兼容，v2+ 之后两边渐进分化，但核心 API（Map/Style/Expressions）仍高度一致 |
| 迁移成本 | — | 从 Mapbox 迁移过来通常只需换包名、去掉 `accessToken`、换 CSS 类名前缀，业务代码基本不用大改 |
| 适用场景 | 需要 Mapbox 专属底图质量/配套服务，且能接受按量计费 | 追求零许可成本、可自主托管、可魔改源码、或纯预算敏感项目 |

**选型口诀**：需要 Mapbox 专属底图质量（Standard style 的 3D 光照/地标）与导航/搜索等配套服务、能接受按量计费 → 选 Mapbox；追求零许可成本、可自建/自主托管瓦片服务、可魔改源码 → 选 MapLibre。这与本站 [Leaflet 参考页](../../leaflet/reference)"矢量瓦片 vs 栅格瓦片"选型是两层不同的决策：先决定要不要矢量瓦片（Leaflet vs Mapbox/MapLibre），再决定矢量瓦片阵营内部选谁（Mapbox vs MapLibre）。

完整 API 速查、易错点清单与资源链接见[参考页](../reference)。
