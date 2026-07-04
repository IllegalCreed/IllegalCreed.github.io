---
layout: doc
outline: [2, 3]
---

# paint/layout 与表达式：数据驱动样式

> 基于 **MapLibre GL JS 5.x**（npm latest 5.24.0，BSD-3-Clause）/ **Mapbox GL JS 3.x**（npm latest 3.25.0，专有许可证）· 核于 2026-07

## 速查

- **layout（布局属性）**：决定要素的几何放置方式与是否显示，如 `visibility`、`icon-image`、`text-field`、`text-size`、`text-anchor`、`symbol-placement`、`line-cap`、`line-join`。改动代价更高——需重新计算符号碰撞检测、文字排版等几何布局。
- **paint（绘制属性）**：决定最终视觉呈现，如 `fill-color`、`fill-opacity`、`line-width`、`line-color`、`circle-radius`、`circle-color`、`fill-extrusion-height`、`heatmap-radius`、`raster-opacity`。改动只触发重绘（repaint），开销小很多。
- ⚠️ **性能经验法则**：样式若要频繁动态变化（悬停高亮、按滑块调不透明度），优先设计成只改 **paint** 属性，避免频繁触发 layout 重算。
- **动态修改 API**：`map.setLayoutProperty(layerId, name, value)` / `map.setPaintProperty(layerId, name, value)`。
- **Expressions** 是 JSON 数组形式的公式，可引用 feature 属性、缩放级别、地图状态动态计算 paint/layout 值——矢量瓦片相较传统栅格瓦片最核心的能力差异之一。
- **常用表达式**：`get`（读属性）、`interpolate`（连续插值，常配合 `zoom`）、`case`（条件分支）、`match`（枚举分类着色）、`step`（阶跃函数，常用于聚合点分级）。
- **feature-state**：无需修改源数据即可给某个 feature 挂临时状态（如 `hover: true`），用于交互式高亮；依赖 feature 有稳定 `id`（GeoJSON 需 `generateId: true` 或数据自带 `id`）。
- **filter（图层过滤）**：与表达式同语法，返回布尔值决定要素是否渲染，`map.setFilter(layerId, expr)` 动态调整。
- ⚠️ **legacy filter 语法已过时**：`["==", "class", "river"]` 是早期非 expression 写法；现代写法统一为 `["==", ["get", "class"], "river"]`，规范文档专门列入 Deprecations 章节。
- **代表性图层**：`fill`（`fill-color`/`fill-opacity`）、`circle`（`circle-radius`/`circle-color`，常配合 `interpolate` 按数值分级）——更多含 3D 的 `fill-extrusion` 见 [GeoJSON、3D 与生态](./geojson-3d-ecosystem)。
- **进阶顺序**：[Style 与 Sources](./style-and-sources) → 本页 → [相机、图层与事件](./camera-layers-events) → [GeoJSON、3D 与生态](./geojson-3d-ecosystem)。

## 一、paint vs layout：本质区别

每种图层类型的属性分为两组，语义和性能含义完全不同：

- **layout（布局属性）**：决定要素的几何放置方式与是否显示，例如 `visibility`、`icon-image`、`text-field`、`text-size`、`text-anchor`、`symbol-placement`、`line-cap`、`line-join`。改动 layout 属性代价更高——引擎需要重新计算符号碰撞检测、文字排版等几何布局。
- **paint（绘制属性）**：决定最终视觉呈现，例如 `fill-color`、`fill-opacity`、`line-width`、`line-color`、`circle-radius`、`circle-color`、`fill-extrusion-height`、`heatmap-radius`、`raster-opacity`。改动 paint 属性只触发重绘（repaint），不动布局，开销小很多。

```js
// layout：改变文字内容/图标——较重
map.setLayoutProperty("poi-labels", "text-field", ["get", "name_en"]);

// paint：只改颜色/透明度——较轻
map.setPaintProperty("poi-labels", "text-color", "#ff0000");
```

::: tip 性能优化经验法则
如果样式要频繁动态变化（悬停高亮、按滑块调不透明度等），优先设计成只改 **paint** 属性，避免频繁触发 layout 重算。
:::

代表性图层的 paint/layout 属性举例：

```js
// fill 填充层
map.addLayer({
  id: "provinces",
  type: "fill",
  source: "provinces",
  layout: {},
  paint: { "fill-color": "#088", "fill-opacity": 0.6 },
});

// circle 圆点层（常用于渲染大量 GeoJSON 点）
map.addLayer({
  id: "quakes",
  type: "circle",
  source: "earthquakes",
  paint: {
    "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 1, 4, 6, 20],
    "circle-color": "#f28cb1",
  },
});
```

## 二、Expressions：数据驱动样式（必考进阶）

Expressions 是 JSON 数组形式的公式，可以引用 feature 属性、缩放级别、地图状态来动态计算 paint/layout 属性值，这是矢量瓦片渲染相较传统栅格瓦片最核心的能力差异之一。

```js
// 以下每行都是 paint/layout 对象里的一条属性，按表达式类型分别举例
const paintExamples = {
  // get：读取属性值
  "fill-color": ["get", "temperature"],

  // interpolate：连续插值（常配合 zoom 做"随缩放级别变化"）
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 1, 10, 5],

  // case：条件分支（常配合 feature-state 做悬停高亮）
  "circle-opacity": [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    1,
    0.5,
  ],

  // match：按枚举值分类着色
  "building-fill-color": [
    "match",
    ["get", "building_type"],
    "residential",
    "#f00",
    "commercial",
    "#0f0",
    /* 默认值 */ "#000",
  ],

  // step：阶跃函数（常用于聚合点按数量分级变大小）
  "cluster-circle-radius": [
    "step",
    ["get", "point_count"],
    20,
    100,
    30,
    750,
    40,
  ],
};
```

## 三、feature-state：无需改数据的交互高亮

**feature-state** 无需修改源数据即可给某个 feature 挂一个临时状态（如 `hover: true`），用于交互式高亮：

```js
map.on("mousemove", "provinces", (e) => {
  if (e.features.length > 0) {
    map.setFeatureState(
      { source: "provinces", id: e.features[0].id },
      { hover: true },
    );
  }
});
```

::: warning feature-state 依赖稳定 id
`feature-state` 依赖 `feature.id`。GeoJSON source 默认没有稳定 `id` 字段时需要设置 `generateId: true`，否则 `setFeatureState` 会设置失败或状态错位。
:::

## 四、filter：图层过滤

**filter（图层过滤）** 用同样的表达式语法，返回布尔值决定要素是否渲染：

```js
map.setFilter("quakes", [
  "all",
  [">=", ["get", "magnitude"], 4],
  ["<", ["get", "magnitude"], 5],
]);
```

::: warning legacy filter 语法已过时
早期 filter 语法是 `["==", "class", "river"]` 这种非 expression 的紧凑写法，现代写法统一改为 `["==", ["get", "class"], "river"]`，规范文档专门有 Deprecations 章节记录这类过时语法，继续使用旧写法在新版本中可能行为不一致。
:::

跑通数据驱动样式后，进入[相机、图层与事件](./camera-layers-events)：相机控制、图层动态增删改查、要素拾取、Marker/Popup、事件系统。
