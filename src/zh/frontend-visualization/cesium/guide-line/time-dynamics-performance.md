---
layout: doc
outline: [2, 3]
---

# 时间动态与性能：Clock / CZML / requestRenderMode / Ion 生态

> 基于 CesiumJS 1.143（npm `cesium@1.143.0`，Apache-2.0）· 核于 2026-07

## 速查

- **时间动态可视化是 Cesium 区别于其它三维引擎最核心的能力**：Entity 的几乎每个属性都可以不是「固定值」而是「时间 → 值」的 `Property`。
- **`JulianDate`**：天文儒略日标准，内部用「整数天 + 秒数」两个分量存储以保证精度并正确处理闰秒，采用国际原子时（TAI）；`fromDate`/`fromIso8601`/`now`/`addHours`/`addSeconds` 是常用运算。
- **`Clock`**：驱动场景时间流。核心属性 `startTime`/`stopTime`/`currentTime`/`multiplier`（播放倍速，支持负数倒放）/`shouldAnimate`（是否推进，默认 `false`）/`clockRange`。
- **`ClockRange` 三值**：`UNBOUNDED`（默认，无限制）、`CLAMPED`（到边界即停）、`LOOP_STOP`（到终点循环回起点）。
- **`SampledPositionProperty`**：预知的时间序列采样点，引擎在采样点之间**自动插值**，实现平滑运动轨迹。
- **`CallbackProperty`**：每帧实时回调计算值，用于真正的动态 / 未知轨迹——与 `SampledPositionProperty`（预知序列）是两种互补的实现方式。
- ⚠️ **忘记设置 `availability`**：`TimeIntervalCollection` 没设对，实体在时间轴走到某个时刻后消失或从不出现，容易被误判成「数据没加载出来」的 bug。
- **`VelocityOrientationProperty`**：根据位置速度矢量自动计算模型朝向，配合 `SampledPositionProperty` 常用于飞机 / 车辆等运动实体。
- **CZML**：「用 JSON 描述随时间变化的图形化场景」的时空数据交换格式，本质是 Entity API 的**数据端序列化**（关系类似 Google Earth 与 KML）；一个 CZML 文档是 JSON 数组，第一个 packet 惯例是文档级元信息（`id: "document"`）。
- **`CzmlDataSource.load`**：从 Ion 资产 / 本地或远程 URL 加载 CZML，挂载到 `viewer.dataSources`；典型应用是多颗卫星轨道动画、大规模轨迹回放。
- **按需渲染 `requestRenderMode`**：默认 Cesium 每帧都重绘（60fps 持续消耗 GPU），静态展示场景应开启，仅在场景变化时才渲染。
- ⚠️ **开启 `requestRenderMode` 后忘记手动 `scene.requestRender()`**：性能优化方向对了，但改了数据 / 属性没有主动请求新一帧，画面会「卡住不动」，容易被误判成 bug 而不是优化副作用。
- **`maximumRenderTimeChange`**：配合 `requestRenderMode` 使用，控制多久允许因模拟时间推进而强制刷新一帧。
- **`Scene.clampToHeightMostDetailed`**：批量贴地查询用异步版本，避免同步版本 `clampToHeight` 卡主线程。
- **Cesium Ion**：官方云平台，提供 3D Tiles 瓦片化、地形处理、影像处理、资产托管（含倾斜摄影建模结果、BIM/CAD 转换、点云、3D 高斯溅射等新格式），免费额度可入门，也可完全自建瓦片服务替代。
- **Resium**：社区维护的 React 封装，把 `Viewer`/`Entity` 等包装成声明式 React 组件，自带 TypeScript 类型。
- **deck.gl 集成**：`@deck.gl/geo-layers` 的 `Tile3DLayer` 可在非 Cesium 宿主环境（如 Mapbox/MapLibre 底图上）渲染 3D Tiles/I3S 数据，见[Mapbox GL JS 与 MapLibre 笔记](../../mapbox-maplibre/guide-line/geojson-3d-ecosystem)。
- **进阶顺序**：[影像·地形·3D Tiles](./imagery-terrain-3dtiles) → 本页 → [参考](../reference)。

## 一、JulianDate：儒略日与时间运算

**JulianDate** 是天文儒略日标准，内部用「整数天 + 秒数」两个分量存储以保证精度并正确处理闰秒，采用国际原子时（TAI）。

```js
const t1 = Cesium.JulianDate.fromDate(new Date());
const t2 = Cesium.JulianDate.fromIso8601("2024-01-15T12:00:00Z");
const now = Cesium.JulianDate.now();
const future = Cesium.JulianDate.addHours(t1, 24, new Cesium.JulianDate());
```

## 二、Clock：驱动场景时间流

**Clock** 驱动场景时间流。核心属性 `startTime`/`stopTime`/`currentTime`/`multiplier`（播放倍速，支持负数倒放）/`shouldAnimate`（是否推进，默认 `false`）/`clockRange`。`ClockRange` 枚举：`UNBOUNDED`（默认，无限制）、`CLAMPED`（到边界即停）、`LOOP_STOP`（到终点循环回起点）。

```js
const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z");
const stop = Cesium.JulianDate.addSeconds(start, 3600, new Cesium.JulianDate());
viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.clock.multiplier = 50;       // 50 倍速播放
viewer.clock.shouldAnimate = true;  // 开始播放
viewer.timeline.zoomTo(start, stop);
```

## 三、时间动态位置：SampledPositionProperty 与 CallbackProperty

**`SampledPositionProperty`（时间采样属性，实现平滑运动轨迹）：**

```js
const positionProperty = new Cesium.SampledPositionProperty();
flightData.forEach((point, i) => {
  const time = Cesium.JulianDate.addSeconds(start, i * 30, new Cesium.JulianDate());
  positionProperty.addSample(time, Cesium.Cartesian3.fromDegrees(point.longitude, point.latitude, point.height));
});

const airplane = viewer.entities.add({
  availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start, stop })]),
  position: positionProperty, // 引擎在采样点之间自动插值
  model: { uri: "airplane.glb" },
  orientation: new Cesium.VelocityOrientationProperty(positionProperty), // 按速度矢量自动计算朝向
  path: new Cesium.PathGraphics({ width: 3 }), // 显示历史轨迹拖尾
});
viewer.trackedEntity = airplane;
```

`SampledPositionProperty`（预知的时间序列采样点，引擎自动插值）与 `CallbackProperty`（每帧实时回调计算值，用于真正的动态 / 未知轨迹）是两种互补的动态属性实现方式。

::: warning 忘记设置 availability 导致实体消失
`TimeIntervalCollection`/`availability` 控制实体在哪个时间段内「存在」，忘记设置常导致实体一直不出现或一直显示——容易被误判成「数据没加载出来」的 bug，而实际是时间区间配置问题。
:::

## 四、CZML：时空数据交换格式

CZML 是「用 JSON 描述随时间变化的图形化场景」的数据格式，本质上是 Entity API 的**数据端序列化**——关系类似于 Google Earth 与 KML。一个 CZML 文档是一个 JSON 数组，每个数组元素是一个「packet」，第一个 packet 惯例上是文档级元信息（`id: "document"`）：

```json
[
  {
    "id": "document",
    "version": "1.0"
  },
  {
    "id": "GroundControlStation",
    "position": { "cartographicDegrees": [-75.5, 40.0, 0.0] },
    "point": { "color": { "rgba": [0, 0, 255, 255] } }
  }
]
```

packet 支持的图形类型与 Entity 一一对应：`billboard`/`point`/`polyline`/`path`/`model`/`box`/`cylinder`/`corridor`/`ellipse`/`polygon`/`rectangle` 等，且每个属性天然支持时间动态取值。

```js
// 从 Cesium Ion 资产加载 CZML
Cesium.IonResource.fromAssetId(10890).then((resource) => {
  viewer.dataSources.add(Cesium.CzmlDataSource.load(resource));
});
// 从本地/远程 url 加载
viewer.dataSources.add(Cesium.CzmlDataSource.load("data.czml"));
```

典型应用：多颗卫星轨道动画、大规模轨迹回放——服务端只需吐 CZML 静态 / 流式数据，前端零自定义代码即可呈现。

## 五、性能优化

**按需渲染 `requestRenderMode`**：默认 Cesium 每帧都重绘（60fps 持续消耗 GPU），静态展示场景应开启：

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  requestRenderMode: true,       // 只在场景发生变化时才渲染
  maximumRenderTimeChange: Infinity, // 配合使用，控制多久允许因模拟时间推进而强制刷新一帧
});
// 手动触发一帧渲染（比如自己改了某个不会被自动感知的状态后）
viewer.scene.requestRender();
```

::: warning 开启 requestRenderMode 后忘记 requestRender
开启后若忘记在数据变化时调用 `requestRender()`，画面会「卡住不动」——是新手接入该优化项最容易踩的坑：性能优化方向没错，只是漏了配合调用。
:::

其余性能手段：**3D Tiles LOD 调优**（`maximumScreenSpaceError` 加大、`skipLevelOfDetail` 开启、限制 `cacheBytes`，见[影像·地形·3D Tiles](./imagery-terrain-3dtiles)）；**Primitive 合批**（静态海量几何体从 Entity 迁移到合批 Primitive，见[Entity 与 Primitive](./entity-and-primitive)的选型表）；**`Scene.clampToHeightMostDetailed`**（批量贴地查询用异步版本，避免同步版本 `clampToHeight` 卡主线程）。

## 六、Cesium Ion 与生态

**Cesium Ion**：官方云平台，提供 3D Tiles 瓦片化、地形处理、影像处理、资产托管（含倾斜摄影建模结果、BIM/CAD 转换、点云、3D 高斯溅射 3D Gaussian Splats 等新格式）。免费额度可入门，商业规模使用需要付费套餐；也可以完全不依赖 Ion，自建瓦片服务 + 自己的 `TerrainProvider`/`ImageryProvider` 实现。

**Resium**：社区维护的 React 封装，把 `Viewer`/`Entity` 等包装成声明式 React 组件（`<Viewer><Entity position={...} /></Viewer>`），自带 TypeScript 类型，方便在 React 技术栈里做状态驱动的 Cesium 应用，避免手写命令式代码与 React 生命周期打架。

**与 deck.gl 集成**：deck.gl 的 `@deck.gl/geo-layers` 提供 `Tile3DLayer`，可以在非 Cesium 的宿主环境（如挂载在 Mapbox/MapLibre 底图上，参见[Mapbox GL JS 与 MapLibre 笔记](../../mapbox-maplibre/guide-line/geojson-3d-ecosystem)）中渲染 3D Tiles / I3S 格式数据，是「只要 3D Tiles 数据格式、不要整个 Cesium 引擎」场景的替代路径。

掌握了时间动态与性能优化手段之后，前往[参考页](../reference)查阅完整的类 / 坐标 / API 速查表、易错点清单与选型对比。
