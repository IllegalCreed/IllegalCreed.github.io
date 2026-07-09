---
layout: doc
---

# CesiumJS

CesiumJS 是开源（Apache-2.0）的 JavaScript **全球尺度地理空间三维引擎**（数字地球 / WebGL 驱动）——围绕 **WGS84 椭球**提供真实地形、海量倾斜摄影 / BIM / 点云的 **3D Tiles 流式加载**、多源影像图层叠加，以及业界独有的**时间动态可视化**（Entity 属性系统 + CZML + Clock）一体化能力，是 GIS、数字孪生、BIM、航空航天、卫星轨迹仿真等严肃地理空间场景的事实标准之一。开发方 Cesium GS, Inc. 采用「商业公司 + 开源社区」双轨模式，配套 **Cesium Ion** 云平台提供资产托管 / 瓦片化服务，但并非强制依赖，可完全自建数据源。**本笔记覆盖版本 `cesium@1.143.0`**（npm registry 实测，2026-07；核心渲染引擎已拆分到独立的 `@cesium/engine`/`@cesium/widgets` 两个 monorepo 包），采用月度发布节奏（版本号形如 `1.14x` 逐月递增），是少见的高频稳定迭代型开源项目。

## 评价

**优点**

- 地理空间精度与真实感业界顶尖——真实地形高程 + 全球影像 + 3D Tiles LOD 流式渲染三者原生打通
- 时间动态可视化是**唯一**把「时间」作为一等公民的开源三维引擎：Entity 的每个属性都可以是「时间 → 值」的采样函数，CZML 是配套的时空数据交换格式
- 双 API 设计覆盖两端：Entity API 声明式易用，Primitive API 底层高性能，按场景切换
- 3D Tiles 规范由 Cesium 主导制定并已成为 OGC 标准，生态（倾斜摄影建模软件、BIM 转换工具）成熟

**缺点**

- 学习曲线陡：坐标系统（Cartesian3/Cartographic/ENU）、Entity vs Primitive 选型、属性系统（Property/SampledProperty/CallbackProperty）等概念远比通用 3D 库多
- 非地理场景（产品展示、游戏、通用可视化）用 Cesium 是「杀鸡用牛刀」，不如 Three.js 轻量，参见 [Three.js 笔记](../three/)
- 打包配置对新手不友好，`CESIUM_BASE_URL` 静态资源坑是社区高频提问
- Cesium Ion 商业化资产（Google Photorealistic 3D Tiles、World Terrain 高级层级）有免费额度限制，规模化使用需商业授权
- 包体积大（Build 后含 Workers/ThirdParty 等资源），非传统 tree-shaking 写法友好

## 本叶地图

- [入门](./getting-started) —— 定位（全球地理三维 / 数字地球 vs 通用 3D）、安装与 `CESIUM_BASE_URL` 配置坑、Ion token、第一个 Viewer
- [Viewer 与坐标系](./guide-line/viewer-and-coordinates) —— Viewer/Scene 结构、Cartesian3/Cartographic/经纬度换算、局部 ENU 坐标系、相机 setView/flyTo
- [Entity 与 Primitive](./guide-line/entity-and-primitive) —— Entity API 各图形类型、拾取与选中、Primitive 底层渲染、材质与外观、数据源 DataSource
- [影像·地形·3D Tiles](./guide-line/imagery-terrain-3dtiles) —— ImageryLayer/Provider、地形与垂直夸张、Cesium3DTileset 与 `Cesium3DTileStyle` 样式表达式、裁剪
- [时间动态与性能](./guide-line/time-dynamics-performance) —— Clock/JulianDate/SampledPositionProperty、CZML、`requestRenderMode` 性能优化、Cesium Ion 生态
- [参考](./reference) —— 类 / 坐标 / API 速查表 + 易错点清单 + 选型对比 + 资源链接

## 文档地址

[Cesium Learn](https://cesium.com/learn/)

## GitHub 地址

[CesiumGS/cesium](https://github.com/CesiumGS/cesium)

## 幻灯片地址

<a href="/SlideStack/cesium-slide/" target="_blank">CesiumJS</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=cesiumjs" target="_blank" rel="noopener noreferrer">CesiumJS 测试题</a>
