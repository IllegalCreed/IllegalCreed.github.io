---
layout: doc
outline: [2, 3]
---

# 入门：定位、分叉史与第一个地图

> 基于 **MapLibre GL JS 5.x**（npm latest 5.24.0，BSD-3-Clause）/ **Mapbox GL JS 3.x**（npm latest 3.25.0，专有许可证）· 核于 2026-07

## 速查

- **定位**：Mapbox GL JS / MapLibre GL JS 是同源的 **WebGL 矢量瓦片地图渲染库**——客户端 GPU 实时渲染矢量瓦片 + JSON 格式 Style Specification 上色排版，支持平滑缩放/旋转/倾斜/3D。
- **分叉史**：**2020 年 12 月** Mapbox 将 Mapbox GL JS 转为专有许可证，社区从其最后一个 BSD-3-Clause 版本（**v1.13**）分叉出 MapLibre GL JS；MapLibre v1 官方声明与 Mapbox GL JS v1 **API 完全向后兼容**。
- **许可证**：`mapbox-gl` npm 包 `license` 字段为 `SEE LICENSE IN LICENSE.txt`（专有）；`maplibre-gl` 为 **BSD-3-Clause**（开源）——两者 npm 元数据差异本身就是这条分叉史的实测证据。
- **包名**：`mapbox-gl`（命名空间 `mapboxgl`） vs `maplibre-gl`（命名空间 `maplibregl`），完全独立的两个 npm 包。
- ⚠️ **`accessToken` 是 Mapbox 专属概念**：Mapbox 必需，从 `account.mapbox.com` 获取；MapLibre **完全不需要** token。
- ⚠️ **CSS 必须单独引入**：`mapbox-gl.css` / `maplibre-gl.css`，漏引入会导致控件、弹窗、比例尺等 UI 样式错乱。
- ⚠️ **`center` 坐标顺序是 `[经度 lng, 纬度 lat]`**，与 Leaflet 的 `[纬度 lat, 经度 lng]` 相反（参见 [Leaflet 笔记](../leaflet/getting-started)的 LatLng 坑）。
- **Map 构造 options 高度一致**：`container`（容器 DOM id 或元素）、`style`（style URL）、`center`、`zoom`；`bearing`（旋转角 0-360°）、`pitch`（倾斜角 0-85°）、`minZoom`/`maxZoom`、`hash`、`attributionControl`、`maxBounds`、`transformRequest`（自定义请求拦截，常用于签名/代理瓦片请求）。
- **style URL 协议差异**：Mapbox 可用专有 `mapbox://styles/mapbox/streets-v12`；MapLibre 直接指向公开 style JSON URL，如免费开源的 OpenFreeMap（`https://tiles.openfreemap.org/styles/bright`）。
- ⚠️ **地图容器必须有明确高度**，否则地图不显示（白屏），与 Leaflet 同样的坑。
- **`accessToken` 设置方式的版本演变**：早期 UMD 版本用全局 `mapboxgl.accessToken = 'xxx'`；v3.x 起 ESM 具名导出（`import { Map } from 'mapbox-gl'`）没有默认导出对象可挂载，必须把 `accessToken` 直接放进 `Map` 的 options 里传入。
- **`map.on('load', callback)`**：必须等 style 与初始瓦片加载完成后才能安全 `addSource`/`addLayer`，这是最高频入门坑，详见[相机、图层与事件](./guide-line/camera-layers-events)。
- **计费 vs 开源**：Mapbox 每月 50,000 次免费 web map load，超额阶梯计费；MapLibre 完全免费无使用量限制（自建瓦片服务的带宽/存储成本自理），详细选型对比见[参考页](./reference)。
- **进阶顺序**：入门 → [Style 与 Sources](./guide-line/style-and-sources) → [paint/layout 与表达式](./guide-line/paint-layout-expressions) → [相机、图层与事件](./guide-line/camera-layers-events) → [GeoJSON、3D 与生态](./guide-line/geojson-3d-ecosystem) → [参考](./reference)。

## 一、定位：WebGL 矢量瓦片地图渲染库

Mapbox GL JS 与 MapLibre GL JS 是一对同源的 **WebGL 矢量瓦片地图渲染库**：在浏览器端用 GPU 实时渲染矢量瓦片（vector tiles），并按 JSON 格式的 **Style Specification** 上色排版，从而获得可平滑缩放/旋转/倾斜/3D 的交互地图。这与本站 [Leaflet 笔记](../leaflet/) 介绍的"栅格瓦片图片 + DOM/SVG/Canvas 叠加矢量图形"路线有本质区别——栅格瓦片路线换样式要换整套图源、旋转会糊、通常不支持真 3D；矢量瓦片路线换样式只需换 style JSON、原生支持平滑旋转倾斜与 3D，代价是必须有 WebGL 支持。两条路线不是新旧替代关系，而是面向不同产品复杂度的分层选型。

## 二、分叉史与许可证：Mapbox 计费 vs MapLibre 开源

**2020 年 12 月**，Mapbox 把 Mapbox GL JS 的许可证从 BSD-3-Clause 改为专有条款。社区随即从其最后一个开源版本（**v1.13**）分叉出 **MapLibre GL JS**，延续 BSD-3-Clause 开源路线。MapLibre 官方原话："MapLibre GL JS v1 is completely backward compatible with Mapbox GL JS v1"——并特意在 npm 上保留 `1.15.3` 这个兼容版本。

两者当前的 npm 包元数据，正是这条分叉史最直接的"实测证据"：

| 包 | npm 最新版本 | `license` 字段 |
| --- | --- | --- |
| `mapbox-gl` | 3.25.0 | `SEE LICENSE IN LICENSE.txt`（专有，需接受 Mapbox 服务条款） |
| `maplibre-gl` | 5.24.0 | `BSD-3-Clause`（标准开源许可证） |

选 Mapbox 意味着接受**按量计费**（每月 50,000 次免费 web map load，超额阶梯计价）但能用其专有底图与导航/搜索等配套服务；选 MapLibre 意味着**完全免费开源**、可自建瓦片服务、可魔改源码，但需要自己解决底图与配套服务。这是选型时首先要想清楚的分野，完整对比见[参考页](./reference)。

## 三、安装：CSS 必引与 token 差异

两者安装方式与 CSS 引入模式一致，但 **token 是否必需**是第一处代码差异：

```js
// Mapbox GL JS —— 需要 accessToken，可用 mapbox:// 协议 style
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // ⚠️ CSS 必须单独引入，否则控件/弹窗样式错乱

const map = new mapboxgl.Map({
  accessToken: "YOUR_MAPBOX_ACCESS_TOKEN", // 必需；从 account.mapbox.com 获取
  container: "map", // 容器 DOM id 或 HTMLElement
  style: "mapbox://styles/mapbox/streets-v12", // Mapbox 专有 style 协议
  center: [-74.5, 40], // [经度 lng, 纬度 lat]！顺序与 Leaflet 相反
  zoom: 9,
});
```

```js
// MapLibre GL JS —— 无需任何 token，直接指向免费开源 style
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css"; // ⚠️ 同样必须单独引入

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/bright", // 免费矢量瓦片 style，无 key
  center: [30.0222, -1.9596], // [lng, lat]，顺序与 Mapbox 完全一致
  zoom: 7,
});
```

::: warning accessToken 设置方式的版本演变（Mapbox 专属坑）
早期 UMD 版本用全局变量赋值：`mapboxgl.accessToken = 'xxx'` 后再 `new mapboxgl.Map({...})`；v3.x 起 ESM 入口改为具名导出（`import { Map } from 'mapbox-gl'`），此时没有 `mapboxgl` 这个默认导出对象可挂载，必须像上面例子一样把 `accessToken` 直接放进 `Map` 的 options 里传入。两种写法目前都有资料在用，实际项目要认准所用的导入方式对应哪种，沿用老代码的全局赋值写法在新版下会静默不生效。
:::

其余常用 options 两者共享：`bearing`（旋转角，0-360°）、`pitch`（倾斜角，0-85°）、`minZoom`/`maxZoom`、`hash`（把视图状态写入 URL hash）、`attributionControl`（是否显示归属信息控件）、`maxBounds`（地理范围限制）、`transformRequest`（自定义请求拦截，常用于给瓦片请求加签名/代理）。

## 四、第一个地图：`center` 经度在前坑

跑通上面任意一个 `Map` 构造之后，地图已经能显示底图。这里有一个贯穿全局的必考坑：

::: warning center 坐标顺序：[经度, 纬度]
Mapbox GL JS / MapLibre GL JS 的 `center` 统一是 **`[经度 lng, 纬度 lat]`**——这与 Leaflet 的 `L.latLng(纬度 lat, 经度 lng)` 顺序**完全相反**（参见 [Leaflet 入门笔记](../leaflet/getting-started)），但与 GeoJSON 标准坐标数组顺序一致。从 Leaflet 项目迁移过来，或手写坐标时最容易搞反，表现为地图定位到地球另一端。
:::

除了 `center`/`zoom`，容器同样**必须有明确的 CSS 高度**——不设置时容器高度为 0，地图区域完全不显示，是与 Leaflet 共通的"白屏"新手坑，父级若是 flex 布局也要把高度一路传递到底。

跑通第一个地图后，进入 [Style 与 Sources](./guide-line/style-and-sources)：Style Specification 根级结构、Sources 六种类型、Layers 图层类型总览。
