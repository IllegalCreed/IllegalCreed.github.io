---
layout: doc
outline: [2, 3]
---

# Viewer 与坐标系：Scene / Cartesian3 / 相机

> 基于 CesiumJS 1.143（npm `cesium@1.143.0`，Apache-2.0）· 核于 2026-07

## 速查

- **`Viewer`**：聚合标准控件的复合控件；核心属性 `entities`（未挂 DataSource 的实体集合）、`dataSources`、`clock`、`scene`、`camera`、`selectedEntity`（当前选中）、`trackedEntity`（相机跟随目标）。
- **`Scene`**：渲染场景本体，`Viewer` 只是围绕它包了一层标准 UI；核心子对象 `scene.globe`（地球本体，深度测试用）、`scene.camera`（与 `viewer.camera` 同一对象）、`scene.primitives`、`scene.groundPrimitives`（贴地图元）、`scene.imageryLayers`。
- **拾取方法**：`scene.pick(windowPosition)`（拾取顶层对象）、`scene.pickPosition(windowPosition)`（从深度缓冲区反算世界坐标，需场景已渲染出几何体）、`scene.drillPick()`（穿透拾取多个对象，返回堆叠的多个结果而非只取最顶层）。
- **三套坐标概念**（必考）：**Cartesian3**（地心地固笛卡尔坐标 ECEF，单位米，引擎内部真正的「世界坐标」）、**Cartographic**（经纬度弧度 + 高度）、**经纬度角度**（人类习惯输入，需转换）。
- ⚠️ **`Cartesian3.fromDegrees(longitude, latitude, height)` 参数顺序是「经度在前」**，与国人日常「纬度经度」口语习惯相反，是抄错坐标最常见的原因（表现为定位到大洋中央或对跖点附近）。
- **批量转换**：`fromDegreesArray`（交替 `[lon, lat, lon, lat, ...]`）、`fromDegreesArrayHeights`（带高度 `[lon, lat, height, ...]`）；也有对应的 `fromRadians`/`fromRadiansArray` 弧度版本。
- **`result` 参数惯例**：转换函数末位的 `result` 参数用于传入可复用对象、避免每次调用都新分配内存，是 Cesium 全局的高频调用性能约定。
- **默认椭球体**：WGS84（`Ellipsoid.default`，历史上的 `Ellipsoid.WGS84`），与 GPS 使用的同一套地球椭球模型。
- **局部坐标系 ENU（东北天）**：`Transforms.eastNorthUpToFixedFrame(origin)` 以某经纬度点为原点构造变换矩阵，用于「以某点为原点摆放模型 / 图元」的场景。
- **相机 `orientation` 三个欧拉角**：`heading`（偏航，绕天顶轴，0 为正北）、`pitch`（俯仰，0 为水平，负值向下看）、`roll`（横滚）；该心智模型同样适用于 Entity 的模型朝向。
- **`Cesium.Math.toRadians`/`toDegrees`**：角度与弧度互转的高频工具方法，`orientation` 里的角度参数几乎都要经它转换。
- **`setView` vs `flyTo`**（必考）：`setView` 瞬移无动画；`flyTo` 带缓动动画飞行，可配置 `duration`/`easingFunction`，产品级应用几乎总是用 `flyTo`。
- **快捷定位**：`viewer.flyTo(entityOrDataSource)` / `viewer.zoomTo(entity)` 自动计算合适视角缩放到目标范围，无需手算 `destination`。
- **`lookAtTransform`**：锁定相机相对某个局部坐标系（如 ENU）的位置，常用于跟随 / 环绕效果，配合 `HeadingPitchRange`（heading、pitch、range 三参数，range 是环绕距离）指定环绕半径。
- **相机事件**：`viewer.clock.onTick.addEventListener(fn)` 每帧回调，常用于旋转相机实现自动环绕（如 `camera.rotateRight(0.005)`）。
- **点击拾取世界坐标**：`ScreenSpaceEventHandler` 监听 `LEFT_CLICK` 等事件，回调里用 `scene.pickPosition(movement.position)` 换算世界坐标，依赖深度缓冲区。
- ⚠️ **直接操作 `camera.position`/`direction`/`up` 底层字段**需要自己保证正交归一性等约束，出错概率高，绝大多数业务场景应使用 `setView`/`flyTo`/`lookAtTransform` 等高层 API。
- **贴地图元 vs 普通图元**：`scene.groundPrimitives` 专门管理贴地渲染的图元（自动处理与地形/3D Tiles 的遮挡关系），`scene.primitives` 管理普通空间图元，二者渲染排序策略不同。
- ⚠️ **`HeadingPitchRoll` 与 `HeadingPitchRange` 是两个不同类型**：前者 `(heading, pitch, roll)` 描述朝向欧拉角，用于 `orientation`；后者 `(heading, pitch, range)` 描述相对目标的环绕位置，用于 `lookAtTransform` 第二参数——名字相近容易搞混。
- **`scene.pick` 返回值判空**：命中对象需配合 `Cesium.defined()` 判断是否为空，具体到 Entity 的类型判断（`instanceof Cesium.Entity`）详见下一页。
- **Viewer 与 Scene 的关系**：`Viewer` 是外壳 UI，`Scene` 才是真正的渲染场景本体，二者的 `camera` 指向同一对象，读代码时不必纠结「到底该用 `viewer.camera` 还是 `scene.camera`」。
- **矩形范围 `Rectangle.fromDegrees`**：与点坐标的 `fromDegrees` 系列同源，用于表达一个经纬度矩形范围，下一页的静态图片图层、影像裁剪范围会用到。
- **进阶顺序**：[入门](../getting-started) → 本页 → [Entity 与 Primitive](./entity-and-primitive) → [影像·地形·3D Tiles](./imagery-terrain-3dtiles) → [时间动态与性能](./time-dynamics-performance) → [参考](../reference)。

## 一、Viewer：聚合控件的复合组件

`Viewer` 是「聚合了所有标准 Cesium 控件的复合控件」，除了[入门](../getting-started)提到的构造 options（`timeline`/`animation`/`baseLayerPicker` 等布尔开关），业务代码里更常用的是它暴露出的核心属性：

```js
viewer.entities;       // 未挂 DataSource 的实体集合（EntityCollection）
viewer.dataSources;    // 已挂载的数据源集合（CZML/GeoJSON/KML 等）
viewer.clock;          // 场景时钟，驱动时间动态属性
viewer.scene;          // 渲染场景本体
viewer.camera;         // 当前相机（scene.camera 的快捷方式）
viewer.selectedEntity; // 当前选中实体（触发绿色选中框 + infoBox）
viewer.trackedEntity;  // 相机跟随目标（设置后相机自动跟随该实体运动）
```

## 二、Scene：渲染场景本体

`Scene` 是真正的渲染场景，`Viewer` 只是围绕它包了一层标准 UI。核心子对象与方法：

- `scene.globe`：地球本体，深度测试与地形都挂在这里；
- `scene.camera`：相机（与 `viewer.camera` 是同一个对象）；
- `scene.primitives` / `scene.groundPrimitives`：普通图元集合 / 贴地图元集合；
- `scene.imageryLayers`：影像图层集合，详见[影像·地形·3D Tiles](./imagery-terrain-3dtiles)；
- `scene.pick(windowPosition)`：拾取该屏幕坐标下的顶层对象；
- `scene.pickPosition(windowPosition)`：从深度缓冲区反算该屏幕坐标对应的世界坐标（`Cartesian3`），前提是该位置已经渲染出了几何体；
- `scene.drillPick(windowPosition)`：穿透拾取——返回该坐标下堆叠的多个对象，而不只是最顶层的一个。

## 三、坐标系统（必考）

CesiumJS 涉及三套坐标概念，是新手最容易犯迷糊的地方：

- **Cartesian3**：地心地固笛卡尔坐标（ECEF），单位米，`{x, y, z}`，是引擎内部真正的「世界坐标」。
- **Cartographic**：经纬度弧度表示，`{longitude, latitude, height}`（弧度制 + 米）。
- **经纬度角度（度数）**：人类习惯的输入形式，需要通过工厂方法转换成 Cartesian3。

核心转换 API，参数顺序是必考点：

```js
// 经度在前、纬度在后、高度可选（默认 0），这是反直觉的高频记忆点
Cesium.Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid, result);
Cesium.Cartesian3.fromRadians(longitude, latitude, height, ellipsoid, result);

// 批量版本：交替的 [lon, lat, lon, lat, ...] 数组
Cesium.Cartesian3.fromDegreesArray(coordinates, ellipsoid, result);
// 带高度：[lon, lat, height, lon, lat, height, ...]
Cesium.Cartesian3.fromDegreesArrayHeights(coordinates, ellipsoid, result);
```

::: warning 经度在前是抄错坐标的头号原因
`Cartesian3.fromDegrees(longitude, latitude, height)` 参数顺序是「经度在前、纬度在后」，与国人日常「纬度经度」的口语习惯相反。抄错顺序不会报错，只会把地图定位到大洋中央或地球对跖点附近，排查时容易先怀疑数据源而不是参数顺序。
:::

默认椭球体是 WGS84（`Ellipsoid.default`，历史上的 `Ellipsoid.WGS84`），即 GPS 使用的同一套地球椭球模型。

局部坐标系（东北天，ENU）用于「以某点为原点，摆放模型 / 图元」的场景：

```js
// 以经纬度点为原点构造东-北-天(East-North-Up)坐标系变换矩阵
const transform = Cesium.Transforms.eastNorthUpToFixedFrame(
  Cesium.Cartesian3.fromDegrees(-100.0, 40.0)
);
```

## 四、相机 Camera（必考）

`orientation` 由三个欧拉角构成：`heading`（偏航，绕天顶轴，0 为正北）、`pitch`（俯仰，0 为水平，负值向下看）、`roll`（横滚）。

```js
// setView：立即跳转，无动画
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0),
  orientation: {
    heading: Cesium.Math.toRadians(20.0),
    pitch: Cesium.Math.toRadians(-35.0),
    roll: 0.0,
  },
});

// flyTo：带缓动动画飞行过去
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0),
  orientation: { heading: Cesium.Math.toRadians(20.0), pitch: Cesium.Math.toRadians(-35.0), roll: 0.0 },
  easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
  duration: 5, // 秒
});

// 缩放定位到某个实体/矩形范围（自动计算合适视角）
viewer.flyTo(someEntityOrDataSource);
viewer.zoomTo(entity);
```

`setView` 和 `flyTo` 的核心区别：前者瞬移无动画，后者带过渡动画、可配置 `duration`/`easingFunction`，产品级应用几乎总是用 `flyTo`。

跟随 / 环绕效果常用 `lookAtTransform` 锁定相机相对某个局部坐标系的位置：

```js
// lookAtTransform：锁定相机相对某个局部坐标系的位置（常用于跟随/环绕）
const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
viewer.scene.camera.lookAtTransform(
  transform,
  new Cesium.HeadingPitchRange(0, -Math.PI / 4, 2900) // 环绕半径 2900 米
);

// 相机事件：每帧 tick 时旋转，实现自动环绕效果
viewer.clock.onTick.addEventListener(() => {
  viewer.scene.camera.rotateRight(0.005);
});
```

拾取点击位置对应的世界坐标，依赖深度缓冲区，需要 `scene` 已经渲染出几何体：

```js
// 拾取点击位置对应的世界坐标（依赖深度缓冲区，需 scene 已渲染出几何体）
const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction((movement) => {
  const pickedPosition = viewer.scene.pickPosition(movement.position);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

::: tip 高层 API 优先于底层字段
直接操作 `camera.position`/`direction`/`up` 底层字段需要自己保证正交归一性等约束，出错概率高。绝大多数业务场景应该使用 `setView`/`flyTo`/`lookAtTransform` 这类高层 API，而不是手改底层向量字段。
:::

掌握了 Viewer/Scene 结构与三套坐标系之后，进入 [Entity 与 Primitive](./entity-and-primitive)：Entity API 各类图形类型、拾取选中、Primitive 底层渲染与材质外观。
