---
layout: doc
outline: [2, 3]
---

# 影像·地形·3D Tiles：Cesium 的地理数据三驾马车

> 基于 CesiumJS 1.143（npm `cesium@1.143.0`，Apache-2.0）· 核于 2026-07

## 速查

- **`ImageryProvider` vs `ImageryLayer`**：前者负责向某个服务请求瓦片，后者代表已显示的瓦片图层（可控制透明度 / 顺序），实践上常合并调用。
- **常见 Provider**：`IonImageryProvider`（Ion 托管资产）、`SingleTileImageryProvider`（单张静态图片叠加）、`OpenStreetMapImageryProvider`、`BingMapsImageryProvider`、`WebMapServiceImageryProvider`(WMS)、`TileMapServiceImageryProvider`(TMS)、`UrlTemplateImageryProvider`、`ArcGisMapServerImageryProvider`。
- **图层操作**：`layer.alpha`（透明度 0~1）、`layer.brightness`（亮度）、`layers.raise/lower/raiseToTop/lowerToBottom` 调整层级顺序。
- **四类 `TerrainProvider`**：`CesiumTerrainProvider`（quantized-mesh 格式，为流式传输优化，Cesium World Terrain 即此格式）、`EllipsoidTerrainProvider`（无起伏纯椭球体，默认值）、`GoogleEarthEnterpriseTerrainProvider`、`VRTheWorldTerrainProvider`。
- **地形现行 API**：`Cesium.Terrain.fromWorldTerrain({ requestVertexNormals, requestWaterMask })` 是当前官方 Quickstart 展示的写法。
- ⚠️ **`Cesium.createWorldTerrainAsync()` 是历史写法**，当前官方现行推荐是 `Cesium.Terrain.fromWorldTerrain()`，两者功能等价但不是同一套 API，写新代码不应把旧写法当作最新用法来抄。
- ⚠️ **地形夸张 API 已迁移**：官方 `Globe` 参考文档页**已不包含** `terrainExaggeration`/`terrainExaggerationRelativeHeight` 属性，当前版本该能力搬到了 `Scene` 上——`scene.verticalExaggeration`/`scene.verticalExaggerationRelativeHeight`；`model.enableVerticalExaggeration = false` 可让指定模型不受场景夸张影响。
- **`Cesium3DTileset`**：海量倾斜摄影 / BIM / 点云的流式加载容器，核心是屏幕空间误差（SSE）驱动的 LOD 机制；`fromIonAssetId()`/`fromUrl()` 均为异步工厂方法，**返回 Promise 需要 `await`**。
- **Google Photorealistic 3D Tiles**：`Cesium.createGooglePhotorealistic3DTileset()`，Cesium 与 Google Maps Platform 集成的全球实景三维底座。
- **LOD 第一旋钮**：`maximumScreenSpaceError`（默认 `16`）——tile 的屏幕空间误差超过该值就继续细化加载子节点，数值越小细节越高但越耗性能，越大越粗糙但越流畅。
- **跳级加载优化**：`skipLevelOfDetail`/`baseScreenSpaceError`/`skipScreenSpaceErrorFactor` 允许跳过中间 LOD 层级直接读取更细节的瓦片，减少请求数；`cacheBytes`（默认 512MB）控制 GPU 显存缓存上限。
- **tileset 事件**：`tileLoad`（单 tile 加载完成）、`allTilesLoaded`（当前视图所需 tile 全部加载完）、`initialTilesLoaded`、`tileFailed`。
- **`Cesium3DTileStyle`**（必考）：声明式样式语言，`show` 用条件表达式控制显隐，`color` 的 `conditions` 数组按顺序像 if-else 匹配，`true` 兜底放最后；`defines` 可预计算派生变量供表达式复用。
- ⚠️ **`conditions` 顺序写反会导致样式全部命中第一条**——数组按顺序从上到下匹配，第一个满足的条件生效。
- **裁剪**：`ClippingPolygonCollection` 隐藏 tileset / 地形指定区域，`inverse = true` 反向裁剪（只保留多边形内部，用于隔离单体建筑做剖切展示）。
- **进阶顺序**：[Entity 与 Primitive](./entity-and-primitive) → 本页 → [时间动态与性能](./time-dynamics-performance) → [参考](../reference)。

## 一、影像图层：Provider 与 Layer 两个概念

`ImageryProvider`（负责向某个服务请求瓦片）与 `ImageryLayer`（代表已显示的瓦片图层，可控制透明度 / 顺序）是两个概念，实践上常合并调用：

```js
// 用 Ion 托管的影像资产作为底图
const viewer = new Cesium.Viewer("cesiumContainer", {
  baseLayer: Cesium.ImageryLayer.fromProviderAsync(
    Cesium.IonImageryProvider.fromAssetId(3830183)
  ),
});

// 单张静态图片叠加图层
const overlay = Cesium.ImageryLayer.fromProviderAsync(
  Cesium.SingleTileImageryProvider.fromUrl("../images/logo.png", {
    rectangle: Cesium.Rectangle.fromDegrees(-75.0, 28.0, -67.0, 29.75),
  })
);
viewer.scene.imageryLayers.add(overlay);

// OpenStreetMap
const osm = new Cesium.OpenStreetMapImageryProvider({ url: "https://a.tile.openstreetmap.org/" });
```

其余常见 Provider：`BingMapsImageryProvider`、`WebMapServiceImageryProvider`(WMS)、`TileMapServiceImageryProvider`(TMS)、`UrlTemplateImageryProvider`、`ArcGisMapServerImageryProvider`。

图层操作：

```js
layer.alpha = 0.5;          // 透明度 0~1
layer.brightness = 2.0;     // 亮度
layers.lower(layer);        // 降低层级
layers.raise(layer);
layers.raiseToTop(layer);
layers.lowerToBottom(layer);
```

## 二、地形 Terrain

四类主要 `TerrainProvider`：`CesiumTerrainProvider`（quantized-mesh 格式，为流式传输优化，Cesium World Terrain 即此格式）、`EllipsoidTerrainProvider`（无起伏的纯椭球体，默认值）、`GoogleEarthEnterpriseTerrainProvider`、`VRTheWorldTerrainProvider`（对接第三方地形服务）。

```js
// 现行推荐写法（v1.143 Quickstart 教程实际展示的用法）
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain({
    requestVertexNormals: true, // 请求法线数据，用于地形光照
    requestWaterMask: true,     // 请求水体掩膜，用于水面特效
  }),
});
```

::: warning 版本演进：createWorldTerrainAsync 是历史写法
网络上不少旧教程 / 博客用的是 `Cesium.createWorldTerrainAsync()`，当前官方 Quickstart 展示的现行写法是 `Cesium.Terrain.fromWorldTerrain()`，两者功能等价但 API 已迁移，写新代码应以后者为准。
:::

**地形夸张（垂直夸张）**：官方 Globe 参考文档页**已不包含** `terrainExaggeration`/`terrainExaggerationRelativeHeight` 属性，当前版本该能力搬到了 `Scene` 上：

```js
scene.verticalExaggeration = 2.0;                 // 地形整体夸张 2 倍
scene.verticalExaggerationRelativeHeight = 0.0;   // 夸张的参照高度基准，0 表示相对椭球面
model.enableVerticalExaggeration = false;         // 可让指定模型不受场景夸张影响
```

::: tip 老资料的地形夸张写法已过时
老资料写 `viewer.scene.globe.terrainExaggeration`，当前（1.143）官方参考文档该属性已不在 `Globe` 类上，现行 API 是 `scene.verticalExaggeration`/`scene.verticalExaggerationRelativeHeight`（`Model` 上还有独立的 `enableVerticalExaggeration` 开关）。查旧博客 / SO 答案时需要意识到这层版本漂移。
:::

## 三、3D Tiles（必考重点）

`Cesium3DTileset` 是海量倾斜摄影 / BIM / 点云的流式加载容器，核心是屏幕空间误差（SSE）驱动的 LOD 机制。

```js
// 从 Cesium Ion 资产加载（异步工厂方法，返回 Promise，注意要 await）
const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(assetId);
viewer.scene.primitives.add(tileset);

// 从任意 URL 加载自建 3D Tiles
const tileset2 = await Cesium.Cesium3DTileset.fromUrl("https://example.com/tileset.json");

// Google Photorealistic 3D Tiles（Cesium 与 Google Maps Platform 集成的全球实景三维底座）
const photorealistic = await Cesium.createGooglePhotorealistic3DTileset();
viewer.scene.primitives.add(photorealistic);
```

::: warning 忘记 await 异步工厂方法
`Cesium3DTileset.fromIonAssetId()`、`Cesium.Terrain.fromWorldTerrain()`、`createGooglePhotorealistic3DTileset()` 均返回 Promise，直接当同步对象使用会拿到 pending 状态而非可用实例。
:::

**LOD 关键参数：**

- `maximumScreenSpaceError`（默认 `16`）：tile 的屏幕空间误差超过该值就继续细化加载子节点；数值越小细节越高但越耗性能，数值越大越粗糙但越流畅。这是 3D Tiles 性能调优的**第一旋钮**，默认值不一定适合所有场景，需要按实际项目调优判断。
- `skipLevelOfDetail` / `baseScreenSpaceError` / `skipScreenSpaceErrorFactor`：跳级加载优化，允许跳过中间 LOD 层级直接读取更细节的瓦片，减少请求数。
- `cacheBytes`（默认 512MB）：GPU 显存缓存上限。

**事件：** `tileset.tileLoad`（单 tile 加载完成）、`tileset.allTilesLoaded`（当前视图所需 tile 全部加载完）、`tileset.initialTilesLoaded`、`tileset.tileFailed`——常用于自定义加载进度 UI。

**样式 `Cesium3DTileStyle`（声明式样式语言，必考）：**

```js
tileset.style = new Cesium.Cesium3DTileStyle({
  // show: 条件表达式控制显隐（按属性筛选）
  show: "${feature['building']} === 'residential' || ${feature['building']} === 'apartments'",
  // color: conditions 数组按顺序像 if-else 匹配，true 作为兜底
  color: {
    conditions: [
      ["${Classification} === 2", "color('brown')"],       // 地面
      ["${Classification} === 3", "color('greenyellow')"], // 低植被
      ["true", "color('white')"],                            // 默认
    ],
  },
});

// defines：可预计算派生变量（如到某点的距离），供 color/show 表达式复用
tileset.style = new Cesium.Cesium3DTileStyle({
  defines: {
    distanceFromComplex:
      "distance(vec2(${feature['cesium#longitude']}, ${feature['cesium#latitude']}), vec2(144.96, -37.82))",
  },
  color: { conditions: [["${distanceFromComplex} > 0.01", "color('#d65c5c')"], ["true", "color('#ffffff')"]] },
});
```

表达式语法支持 `${property}` 取属性、比较运算符、逻辑运算符 `||`/`&&`，可用于按属性高亮、隐藏指定建筑（如 `${elementId} === 332469316` 隐藏某栋 OSM 建筑腾出位置放新方案模型）。

::: warning conditions 是按顺序匹配的 if-else 链
`Cesium3DTileStyle` 的 `conditions` 数组按顺序从上到下匹配，第一个满足的条件生效，`true` 兜底应放在最后；顺序写反会导致样式全部命中第一条。
:::

## 四、裁剪：隐藏指定区域

```js
// 裁剪多边形：隐藏 tileset/地形的指定区域（v1.117+）
const clippingPolygons = new Cesium.ClippingPolygonCollection({
  polygons: [new Cesium.ClippingPolygon({ positions: Cesium.Cartesian3.fromDegreesArray([/* ... */]) })],
});
tileset.clippingPolygons = clippingPolygons;
clippingPolygons.inverse = true; // 反向裁剪：只保留多边形内部，隔离单体建筑做剖切展示
```

掌握了影像 / 地形 / 3D Tiles 这三类地理数据加载方式之后，进入 [时间动态与性能](./time-dynamics-performance)：Cesium 独有的时间动态可视化能力，以及大规模场景的性能优化手段。
