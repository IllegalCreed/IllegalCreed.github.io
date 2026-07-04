---
layout: doc
outline: [2, 3]
---

# Style 与 Sources：Style Specification、数据源、图层类型

> 基于 **MapLibre GL JS 5.x**（npm latest 5.24.0，BSD-3-Clause）/ **Mapbox GL JS 3.x**（npm latest 3.25.0，专有许可证）· 核于 2026-07

## 速查

- **Style 是什么**：一份 JSON 文档，定义地图的完整视觉外观，规范版本号固定为 `"version": 8`。
- **root 级属性**：`sources`（数据字典）、`layers`（渲染数组，**顺序即层叠顺序**）、`sprite`（精灵图）、`glyphs`（字体 URL 模板，含 `{fontstack}`/`{range}` 占位符）、`light`/`sky`/`terrain`/`projection`（全局光照/天空/地形/投影）、`center`/`zoom`/`bearing`/`pitch`（默认相机位置）、`transition`（属性过渡默认时长）。
- **Style Spec 分叉关系**：Mapbox 与 MapLibre 共享同一份祖先规范，分叉后各自演进——Mapbox 有专有的 `mapbox://styles/mapbox/standard`；MapLibre 在 `maplibre-style-spec` 独立维护规范文本，但核心结构（sources/layers/paint/layout）仍保持一致。
- **Sources 六种类型**：`vector`（矢量瓦片）、`raster`（栅格瓦片）、`raster-dem`（地形高程）、`geojson`（动态 GeoJSON）、`image`（静态图片）、`video`（视频叠加）。
- ⚠️ **矢量瓦片托管差异**：Mapbox 侧常走 `mapbox://` 协议引用官方托管瓦片集；MapLibre 侧通常直接给可公开访问的 TileJSON/瓦片模板 URL（自建 tileserver-gl 或第三方如 MapTiler、OpenFreeMap）——这是选型时"是否被绑定在 Mapbox 托管服务上"的直接体现。
- **geojson source** 关键字段：`data`（对象或 URL）、`cluster`、`clusterRadius`（默认 50px）、`clusterMaxZoom`、`clusterMinPoints`、`clusterProperties`、`buffer`、`lineMetrics`；聚合详细用法见 [GeoJSON、3D 与生态](./geojson-3d-ecosystem)。
- **raster-dem** 关键字段：`encoding`（`terrarium`/`mapbox`/`custom`）及自定义解码用的 `redFactor`/`greenFactor`/`blueFactor`/`baseShift`，用于地形起伏渲染。
- **Layers 图层类型**（MapLibre 当前文档列出）：`background`/`fill`/`line`/`symbol`/`circle`/`heatmap`/`fill-extrusion`/`raster`/`hillshade`，以及较新的 `color-relief`（高程分层设色）。
- ⚠️ **`color-relief` 等较新图层类型待确认**：是否已同步出现在 Mapbox 当前规范里未逐一核对，标记为分叉后独立演进的待确认点，不作为两者差异的定论。
- **addLayer 基本结构**：`{ id, type, source, layout: {...}, paint: {...} }`，`layout`/`paint` 两个子对象的语义差异见[下一篇](./paint-layout-expressions)。
- **`beforeId` 参数**：`addLayer(layer, beforeId)` 决定新图层插入到哪个已有图层之前，决定"盖住谁/被谁盖住"，遗漏时默认插到最顶层。
- **进阶顺序**：本页（Style/Sources/Layers 总览）→ [paint/layout 与表达式](./paint-layout-expressions) → [相机、图层与事件](./camera-layers-events) → [GeoJSON、3D 与生态](./geojson-3d-ecosystem)。

## 一、Style Specification：地图外观的 JSON 描述

Style 是一份 JSON 文档，定义地图的完整视觉外观，规范版本号固定为 `"version": 8`。root 级属性：

| 属性 | 作用 |
| --- | --- |
| `version` | 规范版本，必须为 8 |
| `name` / `metadata` | 描述性信息，不影响渲染 |
| `sources` | 数据源字典（决定"有什么数据"） |
| `layers` | 图层数组（决定"数据怎么画"，**数组顺序即渲染层叠顺序**） |
| `sprite` | 精灵图 URL，供 `icon-image`/`fill-pattern` 等引用小图标 |
| `glyphs` | 字体 URL 模板（含 `{fontstack}`、`{range}` 占位符），供 `text-field` 文字渲染取字形 |
| `light` / `sky` / `terrain` / `projection` | 全局光照、天空盒、地形、投影配置 |
| `center` / `zoom` / `bearing` / `pitch` | 该 style 的默认相机位置（仅 Map 构造时未显式传入才生效） |
| `transition` | 属性过渡动画的全局默认时长 |

Mapbox 与 MapLibre 都遵循这份规范的共同祖先（Mapbox Style Spec），分叉后两边各自演进：Mapbox 有专有的 `mapbox://styles/mapbox/standard`（Mapbox Standard，内置 3D 光照/大气效果，属专有能力）；MapLibre 一侧则由社区在 `maplibre-style-spec` 独立维护规范文本，两者措辞和小版本会逐渐出现细微差异，但核心结构（sources/layers/paint/layout）仍保持一致——这也是"API 高度兼容、迁移基本只改 import"的规范基础。

## 二、Sources：六种数据源类型

| 类型 | 用途 | 关键字段 |
| --- | --- | --- |
| `vector` | 矢量瓦片 | `url`（TileJSON）或 `tiles`（URL 模板数组）、`bounds`、`minzoom`/`maxzoom`、`scheme`（xyz/tms）、`encoding`（`mvt` 或 MapLibre 新探索的 `mlt` 格式） |
| `raster` | 栅格瓦片（卫星图等） | `tiles`、`tileSize`（默认 512）、`minzoom`/`maxzoom`、`bounds` |
| `raster-dem` | 地形高程数据 | `encoding`：`terrarium` / `mapbox` / `custom`，及自定义解码用的 `redFactor`/`greenFactor`/`blueFactor`/`baseShift` |
| `geojson` | 动态 GeoJSON 数据 | `data`（对象或 URL）、`cluster`、`clusterRadius`（默认 50px）、`clusterMaxZoom`、`clusterMinPoints`、`clusterProperties`（自定义聚合表达式）、`buffer`、`lineMetrics` |
| `image` | 静态图片叠加 | `url` + `coordinates`（四角经纬度，顺时针） |
| `video` | 视频叠加 | `urls`（多格式数组）+ `coordinates` |

```js
// geojson source：动态数据 + 聚合开关
map.addSource("earthquakes", {
  type: "geojson",
  data: "https://maplibre.org/maplibre-gl-js/docs/assets/earthquakes.geojson",
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
});
```

Mapbox 侧矢量瓦片常见写法是走 `mapbox://` 协议引用官方托管瓦片集（如 `mapbox://mapbox.mapbox-streets-v8`），MapLibre 侧则通常直接给一个可公开访问的 TileJSON/瓦片模板 URL（自建 tileserver-gl 或第三方如 MapTiler、OpenFreeMap）——这也是选型时"是否被绑定在 Mapbox 托管服务上"的直接体现，完整选型见 [GeoJSON、3D 与生态](./geojson-3d-ecosystem)。

## 三、Layers：图层类型总览

MapLibre 当前文档列出的图层类型：`background`、`fill`、`line`、`symbol`、`circle`、`heatmap`、`fill-extrusion`、`raster`、`hillshade`，以及较新的 `color-relief`（基于高程做分层设色，用于地形着色）。

::: warning color-relief 等较新图层类型待确认
`color-relief` 等较新图层类型是否已同步出现在 Mapbox 当前规范里未逐一核对，标记为分叉后独立演进的待确认点，不作为两者差异的定论。
:::

每个图层都由 `id`/`type`/`source` 加上两个子对象 `layout`/`paint` 构成基本骨架：

```js
map.addLayer(
  {
    id: "provinces", // 图层 id，全局唯一
    type: "fill", // 图层类型
    source: "provinces", // 引用已 addSource 的数据源 id
    layout: {}, // 布局属性：决定放置方式与是否显示
    paint: { "fill-color": "#088", "fill-opacity": 0.6 }, // 绘制属性：决定视觉呈现
  },
  "beforeLayerId", // 可选：插入到该已有图层之前，遗漏则插到最顶层
);
```

`layout` 与 `paint` 两个子对象语义和性能含义完全不同，这是矢量瓦片样式系统的核心机制，下一篇[paint/layout 与表达式](./paint-layout-expressions)详细展开。
