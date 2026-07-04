---
layout: doc
outline: [2, 3]
---

# 参考：类 / 坐标 / API 速查

> 基于 CesiumJS 1.143（npm `cesium@1.143.0`，Apache-2.0）· 核于 2026-07

## 速查

- **核心类**：`Viewer`（复合控件）/ `Scene`（渲染场景）/ `Camera`（相机）/ `Entity`（声明式图形）/ `Primitive`（底层渲染）/ `Cesium3DTileset`（3D Tiles 容器）/ `Clock`/`JulianDate`（时间）。
- **坐标转换**：`Cartesian3.fromDegrees(经度, 纬度, 高度)`——**经度在前**是头号易错点；`Cartographic` 是经纬度弧度表示；`Transforms.eastNorthUpToFixedFrame` 构造 ENU 局部坐标系。
- **Entity 图形**：point/billboard/label/polyline/polygon/model/box/ellipse 等，`heightReference` 控制贴地方式。
- **Entity vs Primitive**：少量动态用 Entity，大批量静态（数千+）合批用 Primitive。
- **影像/地形/3D Tiles**：`ImageryLayer`+`ImageryProvider`；四类 `TerrainProvider`；`Cesium3DTileset.fromIonAssetId()`/`fromUrl()` 均为异步工厂方法。
- **样式**：`Cesium3DTileStyle` 的 `show`/`color.conditions`/`defines` 声明式表达式语言。
- **时间**：`JulianDate` 儒略日 + `Clock` 驱动 + `SampledPositionProperty`/`CallbackProperty` 动态属性 + CZML 数据交换格式。
- **性能**：`requestRenderMode` 按需渲染（配合 `scene.requestRender()`）、`maximumScreenSpaceError` 等 LOD 调优、Primitive 合批、`clampToHeightMostDetailed`。
- **生态**：Cesium Ion（资产托管）、Resium（React 封装）、deck.gl `Tile3DLayer`（非 Cesium 宿主渲染 3D Tiles）。
- **选型**：全球地理三维找 Cesium；通用 3D 找 [Three.js](../three/reference)；2.5D 矢量地图找 [Mapbox/MapLibre](../mapbox-maplibre/reference)；海量数据点位可视化找 deck.gl。

## 一、核心类速查

| 类 | 职责 |
| --- | --- |
| `Viewer` | 聚合标准控件的复合控件；`entities`/`dataSources`/`clock`/`scene`/`camera`/`selectedEntity`/`trackedEntity` |
| `Scene` | 渲染场景本体；`globe`/`camera`/`primitives`/`groundPrimitives`/`imageryLayers`；`pick`/`pickPosition`/`drillPick` |
| `Camera` | 相机；`setView`（瞬移）/`flyTo`（动画飞行）/`lookAtTransform`（锁定局部坐标系环绕） |
| `Entity` | 声明式图形对象：位置 + point/billboard/label/polyline/polygon/model 等图形定义 |
| `EntityCollection` | `viewer.entities`；`add`/`getById`/`remove`/`removeAll`/`collectionChanged` |
| `Primitive` | `GeometryInstance` + `Appearance` 组合，合批渲染大批量静态几何体 |
| `Cesium3DTileset` | 3D Tiles 流式加载容器；`fromIonAssetId()`/`fromUrl()` 异步工厂方法 |
| `Cesium3DTileStyle` | 3D Tiles 声明式样式：`show`/`color`/`defines` |
| `ImageryLayer` / `ImageryProvider` | 已显示的瓦片图层 / 负责请求瓦片的数据源 |
| `TerrainProvider` | 地形数据源：`CesiumTerrainProvider`/`EllipsoidTerrainProvider` 等 |
| `Clock` | 场景时钟：`startTime`/`stopTime`/`currentTime`/`multiplier`/`shouldAnimate`/`clockRange` |
| `JulianDate` | 儒略日时间戳：`fromDate`/`fromIso8601`/`now`/`addSeconds`/`addHours` |
| `SampledPositionProperty` | 时间采样位置属性，采样点间自动插值 |
| `CallbackProperty` | 每帧实时回调计算属性值 |
| `CzmlDataSource` / `GeoJsonDataSource` / `KmlDataSource` | 挂载到 `viewer.dataSources` 的数据源适配器 |
| `ClippingPolygonCollection` | 裁剪 tileset / 地形指定区域，`inverse` 反向裁剪 |
| `ParticleSystem` | 粒子系统：烟雾 / 火焰 / 雨雪 / 爆炸 |

## 二、坐标转换 API 速查

| API | 说明 |
| --- | --- |
| `Cartesian3.fromDegrees(lon, lat, height?, ellipsoid?, result?)` | 经纬度角度 → 世界坐标；**经度在前**是头号易错点 |
| `Cartesian3.fromRadians(lon, lat, height?, ...)` | 弧度版本 |
| `Cartesian3.fromDegreesArray([lon, lat, ...])` | 批量转换，交替数组 |
| `Cartesian3.fromDegreesArrayHeights([lon, lat, height, ...])` | 批量转换，带高度 |
| `Cartographic` | 经纬度弧度 + 高度的结构化表示 `{longitude, latitude, height}` |
| `Ellipsoid.default`（原 `Ellipsoid.WGS84`） | 默认椭球体，与 GPS 同一套模型 |
| `Transforms.eastNorthUpToFixedFrame(origin)` | 构造以某点为原点的东-北-天（ENU）局部坐标系变换矩阵 |

## 三、Entity 图形类型速查

| 图形属性 | 用途 | 关键子属性 |
| --- | --- | --- |
| `point` | 点标记 | `pixelSize`/`color`/`outlineColor`/`outlineWidth` |
| `billboard` | 图片公告牌 | `image`/`width`/`height` |
| `label` | 文字标签 | `text`/`font`/`style`/`verticalOrigin`/`pixelOffset` |
| `polyline` | 折线 | `positions`/`width`/`material` |
| `polygon` | 多边形 | `hierarchy`/`height`/`material`/`outline` |
| `model` | glTF/glb 3D 模型 | `uri` |
| `path` | 历史轨迹拖尾 | `width`（常配合 `SampledPositionProperty`） |
| `heightReference` | 高度参照 | `NONE`/`CLAMP_TO_GROUND`/`RELATIVE_TO_GROUND` |

## 四、Primitive / Geometry / Appearance 速查

| 概念 | 说明 |
| --- | --- |
| `GeometryInstance` | 几何形状实例，可带 `attributes`（如按实例着色） |
| `Appearance` | 外观定义：`EllipsoidSurfaceAppearance`/`PerInstanceColorAppearance` 等 |
| `vertexFormat` | 顶点格式，必须与所选 `Appearance` 的 `VERTEX_FORMAT` 要求匹配 |
| 合批 | 数千个 `GeometryInstance` 合并进一个 `Primitive`，大幅降低 draw call |
| `Material.fromType(type)` | 快捷创建基础材质 |
| Fabric | Cesium 材质的完整 JSON 描述规范，等价于 `fromType` 但可配置更复杂 `uniforms` |

**Entity vs Primitive 选型：**

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 少量 / 需要频繁更新的动态对象 | Entity | API 便捷，改属性即生效 |
| 大批量静态几何体（数千+） | Primitive | 合批减少 draw call，GPU 利用率高 |
| 需要自定义着色器 / 渲染状态 | Primitive | 更接近底层渲染管线 |
| 快速原型 / 常规产品开发 | Entity | 抽象层级适合业务代码 |

## 五、影像 / 地形 / 3D Tiles 速查

| 类别 | 类型 | 说明 |
| --- | --- | --- |
| 影像 Provider | `IonImageryProvider`/`SingleTileImageryProvider`/`OpenStreetMapImageryProvider`/`BingMapsImageryProvider`/`WebMapServiceImageryProvider`(WMS)/`TileMapServiceImageryProvider`(TMS)/`UrlTemplateImageryProvider`/`ArcGisMapServerImageryProvider` | 各类瓦片数据源 |
| 影像图层操作 | `layer.alpha`/`layer.brightness`/`layers.raise`/`lower`/`raiseToTop`/`lowerToBottom` | 透明度、亮度、层级顺序 |
| 地形 Provider | `CesiumTerrainProvider`（quantized-mesh）/`EllipsoidTerrainProvider`（默认无起伏）/`GoogleEarthEnterpriseTerrainProvider`/`VRTheWorldTerrainProvider` | 四类地形数据源 |
| 地形现行 API | `Cesium.Terrain.fromWorldTerrain({ requestVertexNormals, requestWaterMask })` | 取代历史写法 `createWorldTerrainAsync()` |
| 地形夸张现行 API | `scene.verticalExaggeration`/`scene.verticalExaggerationRelativeHeight`/`model.enableVerticalExaggeration` | 取代已移除的 `Globe.terrainExaggeration` |
| 3D Tiles 加载 | `Cesium3DTileset.fromIonAssetId(id)`/`fromUrl(url)`/`createGooglePhotorealistic3DTileset()` | 均返回 Promise，需 `await` |
| LOD 参数 | `maximumScreenSpaceError`（默认 16）/`skipLevelOfDetail`/`baseScreenSpaceError`/`skipScreenSpaceErrorFactor`/`cacheBytes`（默认 512MB） | 数值越小细节越高越耗性能 |
| tileset 事件 | `tileLoad`/`allTilesLoaded`/`initialTilesLoaded`/`tileFailed` | 自定义加载进度 UI |
| 样式表达式 | `Cesium3DTileStyle` 的 `show`/`color.conditions`/`defines` | `${property}` 取属性；`conditions` 顺序匹配，`true` 兜底放最后 |
| 裁剪 | `ClippingPolygonCollection`（`inverse` 反向裁剪） | 隐藏 / 隔离 tileset、地形指定区域 |

## 六、时间与时钟 API 速查

| API | 用途 |
| --- | --- |
| `JulianDate.fromDate`/`fromIso8601`/`now`/`addSeconds`/`addHours` | 时间构造与运算，内部整数天+秒双分量、TAI 计时 |
| `Clock.startTime`/`stopTime`/`currentTime`/`multiplier`/`shouldAnimate` | 时钟核心属性；`multiplier` 支持负数倒放 |
| `ClockRange.UNBOUNDED`/`CLAMPED`/`LOOP_STOP` | 时钟越界行为：无限制 / 到边界即停 / 循环回起点 |
| `SampledPositionProperty.addSample(time, position)` | 添加时间采样点，采样点间自动插值 |
| `CallbackProperty(fn, isConstant)` | 每帧实时回调计算属性值 |
| `TimeIntervalCollection` / `entity.availability` | 控制实体存在的时间区间，未设置常导致实体不出现 |
| `VelocityOrientationProperty(positionProperty)` | 按位置速度矢量自动计算模型朝向 |
| `CzmlDataSource.load(url 或 IonResource)` | 加载 CZML 时空数据交换格式文档 |

## 七、性能优化速查

| 手段 | 说明 |
| --- | --- |
| `requestRenderMode: true` | 只在场景变化时才渲染，需配合 `scene.requestRender()` 手动触发帧，否则画面卡住不动 |
| `maximumRenderTimeChange` | 配合 `requestRenderMode`，控制模拟时间推进强制刷新帧的间隔 |
| `maximumScreenSpaceError` 调优 | 3D Tiles LOD 精度 / 性能取舍第一旋钮 |
| `skipLevelOfDetail` 等 | 3D Tiles 跳级加载，减少请求数 |
| Primitive 合批 | 海量静态 Entity 迁移到合批 Primitive，降低 draw call |
| `Scene.clampToHeightMostDetailed` | 批量贴地查询用异步版本，避免同步 `clampToHeight` 卡主线程 |

## 八、易错点清单

| 坑 | 说明 |
| --- | --- |
| `CESIUM_BASE_URL` 未设置 / 设置太晚 | 必须在 `import`/`require` cesium 之前设置，且四个静态资源目录（Workers/ThirdParty/Assets/Widgets）少复制一个就运行时才报错 |
| `Cartesian3.fromDegrees` 参数顺序 | 经度在前、纬度在后，与国人口语习惯相反，抄错表现为定位到大洋中央 |
| Entity vs Primitive 选型不当 | 数千 + 静态对象用 Entity 会导致帧率骤降，应转 Primitive 合批 |
| 忘记 `await` 异步工厂方法 | `Cesium3DTileset.fromIonAssetId()`/`Terrain.fromWorldTerrain()`/`createGooglePhotorealistic3DTileset()` 均返回 Promise |
| `maximumScreenSpaceError` default 不一定适合 | 不能不调优就断言「卡」，也不能无脑调小追求清晰度而不顾性能 |
| 时间动态实体忘记 `availability` | `TimeIntervalCollection` 没设对，实体消失或不出现，易误判成 bug |
| 地形夸张 API 已迁移 | 老资料的 `globe.terrainExaggeration` 已不在当前版本 `Globe` 类上，现行是 `scene.verticalExaggeration` |
| `createWorldTerrainAsync()` 是历史写法 | 现行推荐 `Cesium.Terrain.fromWorldTerrain()`，两者能力等价但非同一套 API |
| 忘记手动 `scene.requestRender()` | 开启 `requestRenderMode` 后数据变了不主动请求新帧，画面卡住不刷新 |
| 直接操作 `camera.position`/`direction`/`up` | 需自己保证正交归一性，出错概率高，应优先用 `setView`/`flyTo`/`lookAtTransform` |
| 静态值 vs 动态 Property 混淆 | 给 `entity.position` 赋固定 `Cartesian3` 和赋 `SampledPositionProperty`/`CallbackProperty` 语义完全不同 |
| `Cesium3DTileStyle` conditions 顺序写反 | 数组按顺序从上到下匹配，第一个满足即生效，`true` 兜底应放最后 |

## 九、选型对比：CesiumJS vs Three.js / Mapbox-MapLibre / deck.gl

| 维度 | CesiumJS | [Three.js](../three/reference) | [Mapbox GL JS / MapLibre GL JS](../mapbox-maplibre/reference) | deck.gl |
| --- | --- | --- | --- | --- |
| 本质定位 | 全球尺度地理空间三维引擎（数字地球） | 通用 WebGL 3D 渲染引擎 | 2.5D 矢量地图引擎（Web Mercator 投影） | 大规模数据可视化图层框架 |
| 坐标系统 | WGS84 椭球 + 真实地心地固坐标，全球无缝 | 无内置地理坐标，需自行实现或用插件 | Web Mercator 投影（极地严重变形，globe 模式是视觉投影而非真实球体几何） | 依赖底图坐标系（常挂载在 Mapbox/MapLibre/Google Maps 上） |
| 地形 / 影像 / 3D Tiles | 原生一体化支持，是核心卖点 | 需要手工实现或第三方库拼装 | 有建筑挤出模拟高度，但非真正三维实体几何 | 有 `Tile3DLayer` 支持 3D Tiles/I3S，但场景管理不如 Cesium 完整 |
| 时间动态可视化 | Entity 属性系统 + CZML + Clock，业界独有 | 需要自行编写动画系统 | 较弱，非设计重点 | 较弱，非设计重点 |
| 典型场景 | GIS / 数字孪生 / BIM / 航空航天 / 卫星轨迹仿真 | 产品展示、游戏、通用可视化 | 常规 Web 地图（路线、POI、导航） | 海量数据点 / 热力图 / OD 流向分析 |
| 学习曲线 / 包体积 | 陡峭、体积大 | 中等、灵活小巧 | 平缓、轻量 | 中等，依赖底图生态 |

**何时选 Cesium**：需要真实地球几何（避免 Mercator 投影在极地的形变）、需要真实地形高程与倾斜摄影 / BIM 精细模型展示、需要 3D Tiles 海量流式加载、需要时间动态仿真（卫星轨迹 / 航班追踪 / 历史回放）——这些是 Cesium 的不可替代场景。

**何时选 Three.js**：非地理场景的通用 3D（产品展示、游戏、数据雕塑），需要对渲染管线 / 自定义 shader 有更细粒度控制，不需要真实地球坐标系统，详见 [Three.js 笔记](../three/)。

**何时选 Mapbox GL JS / MapLibre GL JS**：常规 Web 地图应用（路线规划、POI 检索、矢量数据可视化），追求轻量与成熟的地图 style 生态，不需要真实三维地形 / 倾斜摄影模型，详见 [Mapbox GL JS 与 MapLibre 笔记](../mapbox-maplibre/)。

**何时选 deck.gl**：核心诉求是海量数据点位的高性能可视化分析（数百万级散点 / 聚合 / 热力图），且可以接受挂载在 Mapbox/MapLibre 等 2.5D 底图之上，而非需要完整的地球场景管理能力。

## 十、权威链接

- [Cesium Learn 学习中心](https://cesium.com/learn/cesiumjs-learn/) —— Quickstart / Camera / Entities / Imagery / Terrain / 3D Tiles Styling 等全部教程
- [Cesium3DTileset API 参考](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html)
- [Cartesian3 API 参考](https://cesium.com/learn/cesiumjs/ref-doc/Cartesian3.html)
- [Scene API 参考](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html)
- [Viewer API 参考](https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html)
- [JulianDate API 参考](https://cesium.com/learn/cesiumjs/ref-doc/JulianDate.html)
- [Clock API 参考](https://cesium.com/learn/cesiumjs/ref-doc/Clock.html)
- [GeoJsonDataSource API 参考](https://cesium.com/learn/cesiumjs/ref-doc/GeoJsonDataSource.html)
- [CZML Guide（GitHub Wiki）](https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Guide)
- [Cesium Ion](https://cesium.com/learn/ion/)
- [Resium（React 封装）](https://resium.reearth.io/)
- [CesiumGS/cesium GitHub 仓库](https://github.com/CesiumGS/cesium)
- 本站幻灯片：<a href="/SlideStack/cesium-slide/" target="_blank">CesiumJS</a>
