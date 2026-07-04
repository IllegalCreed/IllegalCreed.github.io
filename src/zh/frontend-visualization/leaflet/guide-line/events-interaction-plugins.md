---
layout: doc
outline: [2, 3]
---

# 事件、交互与插件：性能优化与生态

> 基于 Leaflet v1.9.4 · 核于 2026-07

## 速查

- **Evented 基类**：`on(type, fn, context?)` / `off(type, fn?, context?)` / `once(...)`（触发一次后自动移除）/ `fire(type, data?, propagate?)`（主动触发/派发自定义事件）。
- **几乎所有核心类都继承 Evented**：`Map`、`Marker`、各类 `Layer`（含 Path 系列、TileLayer、GeoJSON）、`Control`、`Popup`、`Tooltip`、`FeatureGroup` 等，因此都能 `.on('click', fn)` 统一使用事件 API。
- **性能：渲染器切换**：`preferCanvas: true`（地图级）或按图层传 `{renderer: L.canvas()}`，用单一 Canvas 取代逐个 SVG DOM 节点，图形数量大（成百上千条 Path）时显著提升性能。
- ⚠️ **`invalidateSize()` 必调场景**：地图容器尺寸变化后（flex 布局重排、Tab 切换显隐、侧边栏收起展开、弹窗内嵌地图初次显示）必须手动调用，否则 Leaflet 不知道容器已变化，会出现瓦片错位、留白、点击坐标偏移。
- **Leaflet.markercluster**：应对海量 Marker 场景，官方特性描述支持 **5 万+** 点位。
- **markercluster 最佳实践**：全部 `addLayer` 到 cluster group 后再整体 `map.addLayer(markers)`，而非先加地图再逐个插入。
- **markercluster 特性**：缩放时聚合/展开动画、视口外标记不渲染（省资源）、最低缩放级别下点击聚合点"蜘蛛化"展开重叠标记、桌面/移动端通用。
- ⚠️ **更新单个 marker 位置**：需先从组里移除、改坐标、再重新添加，才能被聚合逻辑正确追踪；大批量更新更推荐整体移除→批量改→整体重新加入。
- **插件生态**（Leaflet 核心刻意精简，进阶能力靠插件）：Leaflet.markercluster（聚合）/ Leaflet.draw（交互绘制编辑）/ Leaflet.heat（热力图）/ Leaflet.Realtime（实时数据自动刷新）/ proj4leaflet（自定义投影）/ leaflet-defaulticon-compatibility（修复打包工具默认图标丢失）。
- 插件质量参差、部分不再维护，是团队选型 Leaflet 时需要额外评估的成本项。
- **react-leaflet**：`MapContainer`/`TileLayer`/`Marker` 等组件对应 Leaflet 核心类，版本需与核心 `leaflet` 包对齐；命令式操作通常需 `useMap()`/ref 拿到底层原生实例。
- **Vue-Leaflet（`@vue-leaflet/vue-leaflet`）**：Vue 3 生态等价封装，组件命名思路一致（`LMap`/`LTileLayer`/`LMarker`）。
- 两者本质都是"给 Leaflet 命令式核心 API 包一层框架声明式外壳"，核心概念（瓦片/标记/图层/事件）与本笔记完全通用。
- ⚠️ **webpack/vite 打包后默认 Marker 图标丢失（404）**：需手动重设 `L.Icon.Default` 的 `iconUrl`/`iconRetinaUrl`/`shadowUrl`（import 图片资源 + `mergeOptions`），或引入 `leaflet-defaulticon-compatibility` 插件。
- **事件 vs 派发**：`on`/`off`/`once` 管监听，`fire` 用于**主动**触发（常用于组件间用自定义事件类型解耦通信）。
- **`once` 典型场景**：只关心"第一次缩放结束"或"地图首次加载完成"这类只需触发一次的时机。
- **性能根因**：SVG 渲染下每个矢量图形都是一个 DOM 节点，图形数量越多、浏览器排版/重绘开销越大——这是切 Canvas 渲染器的根本原因。
- **`invalidateSize()` 常见触发点**：容器 `display: none → block`、CSS 过渡动画结束、侧边栏宽度变化、Tab 切换到含地图的面板，紧跟一次调用即可。
- **markercluster 安装**：核心库之外的独立插件（`leaflet.markercluster`），需要额外安装并引入对应的 CSS 文件（默认样式 + 聚合图标样式）。
- **Leaflet.draw 能力**：在地图上交互式绘制点/线/面，并提供编辑（拖动顶点）与删除操作，是"可编辑矢量图形"场景的标准插件。
- **Leaflet.heat 与 Leaflet.Realtime**：前者用点位密度渲染热力图，后者按轮询/推送持续刷新图层数据，都不改变核心 API 心智模型，只是新增图层类型。
- **proj4leaflet 适用场景**：需要对接 EPSG3857/EPSG4326/Simple 之外的自定义投影坐标系时使用，突破 CRS 三选一的默认限制。
- **leaflet-defaulticon-compatibility 原理**：不改业务代码，而是从打包后的 CSS 里读取正确的图标 URL，专门适配 webpack/Rails Asset Pipeline/Django pipeline 等构建管线。
- **框架封装版本对齐**：react-leaflet/Vue-Leaflet 的大版本通常与核心 `leaflet` 包的大版本强绑定，升级其一时要同步检查另一方兼容性。
- **命令式逃生舱**：两种框架封装的声明式生命周期之外，仍可能需要直接调用原生方法（如 `flyTo`），此时用 `useMap()`（React）或模板 ref（Vue）拿到底层地图实例。
- **插件成本评估**：引入任何三方插件前，检查其最近维护时间、issue 活跃度、与当前 Leaflet 大版本的兼容性——插件质量参差是 Leaflet 生态选型的常规尽调项。
- **性能与插件互补**：markercluster 本质也是"用聚合图层替代海量单独图层"的性能优化手段，与切换 Canvas 渲染器是互补而非互斥的两条优化路径。
- **下一步**：吃透事件/性能/插件后，进[参考页](../reference)查完整速查表、选型对比与易错点清单。

## 一、事件系统 Evented

```js
// on/off/once/fire 是 Evented 基类统一提供的事件 API
map.on("click", onMapClick);
map.once("zoomend", () => console.log("只触发一次的缩放结束回调"));
map.off("click", onMapClick); // 显式移除监听

// 主动派发自定义事件
marker.fire("custom-event", { foo: "bar" });
marker.on("custom-event", (e) => console.log(e.foo));
```

`on(type, fn, context?)` / `off(type, fn?, context?)` / `once(...)`（触发一次后自动移除）/ `fire(type, data?, propagate?)`（主动触发/派发自定义事件）。

**几乎所有 Leaflet 核心类都继承自 Evented**：`Map`、`Marker`、各类 `Layer`（含 Path 系列、TileLayer、GeoJSON）、`Control`、`Popup`、`Tooltip`、`FeatureGroup` 等，因此都可以 `.on('click', fn)` 这样统一使用事件 API，是 Leaflet 架构一致性的核心设计。

## 二、性能优化：渲染器与 invalidateSize

矢量图形数量大时，切换渲染器是最直接的性能手段（详见[标记与矢量图形](./markers-and-vectors)的 SVG vs Canvas 对比）：

```js
// 地图级全局切换，或按图层传 { renderer: L.canvas() }
const map = L.map("map", { preferCanvas: true });
```

::: warning invalidateSize() 遗漏
地图容器尺寸变化后（Tab 切换显隐、侧边栏折叠、flex 布局重排、弹窗内嵌地图初次显示）如果不手动调用 `map.invalidateSize()`，Leaflet 内部尺寸缓存与实际 DOM 尺寸不一致，导致瓦片错位、留白、拖拽/点击坐标偏移。典型触发点：`el.style.display = "block"` 显示地图容器之后、CSS 过渡动画结束之后、侧边栏宽度变化之后，都应紧跟一次 `map.invalidateSize()`。
:::

## 三、Leaflet.markercluster：海量标记聚合

标记数量上到几千甚至几万时，逐个渲染会拖垮性能，`Leaflet.markercluster` 插件（官方特性描述支持 **5 万+** 点位）是标准解法：

```js
const markers = L.markerClusterGroup();
markers.addLayer(L.marker([lat1, lng1]));
markers.addLayer(L.marker([lat2, lng2]));
// ... 继续 addLayer 更多 marker

// 最佳实践：全部 addLayer 到 cluster group 后再整体加入地图，而非先加地图再逐个插入
map.addLayer(markers);
```

特性：缩放时聚合/展开动画、视口外标记不渲染（节省资源）、最低缩放级别下点击聚合点"蜘蛛化"展开重叠标记、桌面/移动端通用。

::: warning 更新单个 marker 需要先移除再重新添加
更新单个 marker 位置需先从组里移除、改坐标、再重新添加，才能被聚合逻辑正确追踪；大批量更新时更推荐整体从地图移除 → 批量改 → 整体重新加入，而不是逐个 `setLatLng`。
:::

## 四、插件生态全景

Leaflet 核心刻意保持精简，绝大多数进阶能力靠插件：

| 插件 | 用途 |
| --- | --- |
| **Leaflet.markercluster** | 海量标记聚合（见上） |
| **Leaflet.draw** | 地图上交互式绘制/编辑矢量图形（画点/线/面 + 编辑/删除） |
| **Leaflet.heat** | 热力图 |
| **Leaflet.Realtime** | 实时数据源自动刷新图层 |
| **proj4leaflet** | 对接任意自定义投影坐标系（超出 EPSG3857/EPSG4326/Simple 三选一） |
| **leaflet-defaulticon-compatibility** | 修复 webpack/Rails Asset Pipeline/Django pipeline 等构建工具下默认图标路径丢失问题，从 CSS 直接读取图标 URL |

插件质量参差、部分不再维护，是团队选型 Leaflet 时需要额外评估的成本项。

## 五、框架集成：react-leaflet 与 Vue-Leaflet

- **react-leaflet**：React 声明式封装，提供 `MapContainer`/`TileLayer`/`Marker` 等组件对应 Leaflet 核心类，版本需与核心 `leaflet` 包版本对齐；命令式 API（如动态调用地图方法）通常需要通过 `useMap()`/ref 拿到底层原生 Leaflet 实例。
- **Vue-Leaflet（`@vue-leaflet/vue-leaflet`）**：Vue 3 生态下的等价声明式封装，组件命名和用法与 react-leaflet 思路一致（`LMap`/`LTileLayer`/`LMarker` 等）。

两者本质都是"给 Leaflet 命令式核心 API 包一层框架的声明式外壳"，核心概念（瓦片/标记/图层/事件）与本笔记完全通用。

## 六、打包工具坑：默认 Marker 图标丢失

webpack/vite 等打包工具下，Leaflet 默认图标 `L.Icon.Default` 依赖运行时拼接图片 URL 路径，构建工具的资源哈希/路径重写机制会打断这一逻辑，表现为默认 Marker 图标 404 不显示。典型修复：

```js
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// 先删掉依赖运行时拼接路径的默认实现
delete L.Icon.Default.prototype._getIconUrl;
// 再用打包工具正确解析出的图片 URL 覆盖默认 options
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
```

或直接引入 `leaflet-defaulticon-compatibility` 插件（从 CSS 读取图标 URL，专门适配 webpack/Rails/Django 等构建管线），无需手写上述代码。

吃透事件、性能与插件生态后，进入[参考页](../reference)：类/方法速查表、Leaflet vs Mapbox GL JS/MapLibre GL JS 的完整选型对比、易错点清单。
