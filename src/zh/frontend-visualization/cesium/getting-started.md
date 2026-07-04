---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个 Viewer

> 基于 CesiumJS 1.143（npm `cesium@1.143.0`，Apache-2.0）· 核于 2026-07

## 速查

- **定位**：CesiumJS 是**全球尺度地理空间三维引擎**（数字地球），区别于 Three.js 这类**通用 3D 库**——原生打通真实地形、全球影像、3D Tiles 流式加载与时间动态可视化，非地理场景不应该选它，详见[参考页选型对比](./reference)。
- **版本与许可**：`cesium@1.143.0`（npm 实测），**Apache-2.0**；开发方 Cesium GS, Inc. 商业公司 + 开源社区双轨；月度发布节奏，版本号形如 `1.14x` 逐月递增。
- **CDN 与 npm 版本一致性**：官方 Quickstart 的 CDN 地址版本号与 npm registry 实测版本**完全对齐**，无版本漂移，是交叉验证的信号。
- **monorepo 依赖拆分**：`@cesium/engine`（渲染引擎核心，Scene/Camera/3D Tiles/Entity 全在这）+ `@cesium/widgets`（Viewer 及 UI 控件）+ `protobufjs`（3D Tiles/矢量瓦片解码）。
- **包类型**：`"type": "module"`，`main` 为 CJS 入口 `index.cjs`，`module` 为 ESM 入口 `./Source/Cesium.js`，自带 `Source/Cesium.d.ts` 类型声明，**无需**额外装 `@types/cesium`。
- **默认椭球**：**WGS84**（`Ellipsoid.default`，历史上的 `Ellipsoid.WGS84`），与 GPS 使用的同一套地球椭球模型。
- **两种接入方式**：CDN `<script>` 标签直接引入 `Cesium.js` + `widgets.css`，或 `npm install cesium` 后按模块导入；两者能力等价，生产项目通常选 npm。
- ⚠️ **`CESIUM_BASE_URL` 是打包工具下的第一大坑**：CesiumJS 运行时要异步加载 Worker 脚本 / 纹理 / SVG 等静态资源，webpack/vite 默认处理不对这些路径。
- **两步走**：① 用插件（`vite-plugin-cesium` 或手动 `copy-webpack-plugin`）把 `node_modules/cesium/Build/Cesium/{Workers,ThirdParty,Assets,Widgets}` 四个目录复制到产物目录；② 在**导入 cesium 之前**显式设置 `window.CESIUM_BASE_URL`，告诉引擎去哪找这些资源。
- ⚠️ **忘记设置的典型报错是运行时才出现**：Worker 加载失败 / 图标空白 / `Failed to obtain worker` 一类错误，而不是编译期报错，排查成本高于普通配置错误。
- **Cesium Ion accessToken**：World Terrain、OSM Buildings、Bing 影像等许多能力默认走 Ion 托管，需要到 `https://ion.cesium.com/tokens` 申请免费 token。
- **token 设置时机**：必须在 `new Cesium.Viewer(...)` **之前**设置 `Cesium.Ion.defaultAccessToken`，否则地形/影像资源请求会因鉴权失败而报错。
- **`Viewer` 是复合控件**：聚合了 timeline、animation、baseLayerPicker、geocoder、sceneModePicker、homeButton、navigationHelpButton、fullscreenButton、selectionIndicator、infoBox 等标准控件，构造 options 均为布尔开关（`vrButton` 默认 `false`，其余默认 `true`）。
- **纯静态展示场景**常见做法：`new Cesium.Viewer(id, { timeline: false, animation: false, baseLayerPicker: false, geocoder: false })` 关闭不需要的控件。
- **`Viewer` 常用属性预告**（详见下一页）：`viewer.entities`/`dataSources`/`clock`/`scene`/`camera`/`selectedEntity`/`trackedEntity`。
- **地形现行 API**：`Cesium.Terrain.fromWorldTerrain()` 是当前官方 Quickstart 展示的写法；`requestVertexNormals`（地形光照法线）、`requestWaterMask`（水体掩膜）是常用 options。
- ⚠️ **`Cesium.createWorldTerrainAsync()` 是历史写法**：网络上不少旧教程仍在用，与现行的 `Cesium.Terrain.fromWorldTerrain()` 功能等价但不是同一套 API，写新代码应以后者为准。
- **容器要求**：`Viewer` 容器 DOM 元素必须有**明确的 CSS 高度**，否则区域高度为 0、整个白屏——与地图库常见的容器高度坑一致。
- **核心能力预告**：真实地形 + 影像图层叠加（[影像·地形·3D Tiles](./guide-line/imagery-terrain-3dtiles)）、Entity/Primitive 双 API（[Entity 与 Primitive](./guide-line/entity-and-primitive)）、时间动态 + CZML（[时间动态与性能](./guide-line/time-dynamics-performance)）。
- **不强制依赖 Ion**：可完全自建瓦片服务 + 自己的 `TerrainProvider`/`ImageryProvider`，Ion 只是官方托管的便利选项，免费额度可入门，商业规模化资产托管需付费套餐。
- **WebGL 依赖**：与 Three.js、Mapbox GL JS/MapLibre GL JS 一样依赖浏览器 WebGL 支持，老旧设备/浏览器可能不支持，这是三者共通的技术前提。
- **Scene 与 Camera 预告**：`Viewer` 内部真正做渲染的是 `viewer.scene`，相机挂在 `viewer.camera`，坐标系统与相机控制详见下一页。
- **打包体积提示**：Build 产物含 Workers/ThirdParty 等资源，包体积偏大，非传统 tree-shaking 友好写法，评估技术选型时需纳入考量。
- **CDN 适用场景**：快速原型 / 课堂演示 / 简单静态页面；npm + 打包工具是生产项目的标准路径，也是 `CESIUM_BASE_URL` 坑真正会遇到的场景。
- **典型应用领域**：GIS、数字孪生、BIM、航空航天、卫星轨迹仿真——这些场景对真实地形/影像/3D Tiles 与时间动态仿真有硬需求，是 Cesium 的核心受众。
- **学习曲线提醒**：坐标系统（Cartesian3/Cartographic/ENU）、Entity vs Primitive 选型、属性系统（Property/SampledProperty/CallbackProperty）等概念比通用 3D 库多，入门后建议按本笔记顺序逐页深入。
- **与生态的关系**：Resium（React 声明式封装）、deck.gl `Tile3DLayer`（非 Cesium 宿主渲染 3D Tiles）都是可选的上层生态，详见[时间动态与性能](./guide-line/time-dynamics-performance)末尾。
- **进阶顺序**：入门 → [Viewer 与坐标系](./guide-line/viewer-and-coordinates) → [Entity 与 Primitive](./guide-line/entity-and-primitive) → [影像·地形·3D Tiles](./guide-line/imagery-terrain-3dtiles) → [时间动态与性能](./guide-line/time-dynamics-performance) → [参考](./reference)。

## 一、定位：全球尺度地理空间三维引擎 vs 通用 3D 库

CesiumJS 与 Three.js 这类通用 WebGL 3D 库的本质区别，在于坐标系统与场景管理的地理属性：Cesium 内部的「世界坐标」直接是**地心地固坐标（ECEF）**，围绕 WGS84 椭球体建模整个地球，真实地形高程、全球影像、3D Tiles（倾斜摄影 / BIM / 点云）流式加载与时间动态仿真都是引擎原生打通的一等能力；而 Three.js 没有内置地理坐标系统，场景管理面向的是「任意三维空间」，做地球场景需要自己实现或引入插件。

选型上：**GIS、数字孪生、BIM、航空航天、卫星轨迹仿真**等需要真实地球几何与地形的严肃地理空间场景，Cesium 是不可替代的选择；**产品展示、游戏、通用数据可视化**等非地理场景，Cesium 的坐标系统与体积都是负担，通用 3D 库（见 [Three.js 笔记](../three/)）会更轻量灵活。完整的多库选型对比见[参考页](./reference)。

## 二、安装：CDN 与 npm 两种方式

**CDN 方式**（快速原型 / 简单页面）：

```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.143/Build/Cesium/Cesium.js"></script>
<link href="https://cesium.com/downloads/cesiumjs/releases/1.143/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
```

**npm 方式**（生产项目首选，配合打包工具）：

```bash
npm install cesium
```

包本身 `"type": "module"`，`module` 字段指向 ESM 入口 `./Source/Cesium.js`，`main` 字段指向 CJS 入口 `index.cjs`；类型声明随包自带（`Source/Cesium.d.ts`），TypeScript 项目无需再装 `@types/cesium`。

## 三、`CESIUM_BASE_URL` 配置坑（打包工具必考）

CesiumJS 运行时需要异步加载 Web Worker 脚本、纹理、SVG 等静态资源，webpack/vite 默认不会把这些资源路径处理正确，必须手动完成两步：

1. 用插件（如 `vite-plugin-cesium`，或手动配置 `copy-webpack-plugin`）把 `node_modules/cesium/Build/Cesium/{Workers,ThirdParty,Assets,Widgets}` 四个目录复制到最终产物目录；
2. 在**导入 cesium 之前**显式设置全局变量，告诉 Cesium 去哪里找这些资源：

```js
// 若资源被复制到产物的 /static/Cesium/ 目录下，必须先设置再 import
window.CESIUM_BASE_URL = "/static/Cesium/";
import * as Cesium from "cesium";
```

::: warning 忘记设置 CESIUM_BASE_URL 的典型症状
若忘记这一步，典型报错是 Worker 加载失败 / 图标空白 / `Failed to obtain worker` 一类的**运行时**错误，而不是编译期报错——四个目录（Workers/ThirdParty/Assets/Widgets）只要少复制一个，问题就要等到运行时才暴露，是社区最高频的入门提问。
:::

## 四、Cesium Ion accessToken 配置

很多能力（World Terrain、OSM Buildings、Bing 影像默认）都走 **Cesium Ion** 托管，需要先到 `https://ion.cesium.com/tokens` 申请一个 accessToken：

```js
// 必须在创建 Viewer 之前设置默认 token
Cesium.Ion.defaultAccessToken = "你的_access_token";

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(), // 使用 Ion 托管的全球地形（现行 API）
});
```

Cesium Ion 提供免费额度供入门与中小规模使用；也可以完全不依赖 Ion，自建瓦片服务 + 自己的 `TerrainProvider`/`ImageryProvider`，详见[影像·地形·3D Tiles](./guide-line/imagery-terrain-3dtiles)与[时间动态与性能](./guide-line/time-dynamics-performance)末尾的生态小节。

## 五、第一个 Viewer

`Viewer` 是「聚合了所有标准 Cesium 控件的复合控件」，构造函数常用 options 均为布尔开关，默认几乎全部为 `true`：

| 选项 | 作用 |
| --- | --- |
| `timeline` | 时间轴控件 |
| `animation` | 左下角播放 / 速率控制表盘 |
| `baseLayerPicker` | 右上角底图 / 地形选择器 |
| `geocoder` | 地址搜索框 |
| `sceneModePicker` | 2D / 2.5D（Columbus View）/ 3D 切换 |
| `homeButton` / `navigationHelpButton` / `fullscreenButton` | 首页视角 / 帮助 / 全屏按钮 |
| `selectionIndicator` / `infoBox` | 选中实体的绿框指示器 / 信息弹窗 |
| `vrButton` | VR 按钮（默认 `false`） |

纯静态展示场景（不需要时间轴、不需要切换底图）常见写法是关闭这些控件：

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  timeline: false, // 关闭时间轴（纯静态展示场景常见）
  baseLayerPicker: false,
  geocoder: false,
});
```

容器 DOM 元素只需要一个有明确高度的 `<div>`（与地图库常见的「白屏」坑一致，容器高度为 0 会导致 Viewer 区域不可见）。跑通第一个 Viewer 之后，进入 [Viewer 与坐标系](./guide-line/viewer-and-coordinates)：深入 `Viewer`/`Scene` 的核心属性方法、Cesium 三套坐标概念、相机 `setView`/`flyTo`。
