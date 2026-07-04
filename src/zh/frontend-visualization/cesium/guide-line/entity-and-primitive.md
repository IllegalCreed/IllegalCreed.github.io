---
layout: doc
outline: [2, 3]
---

# Entity 与 Primitive：声明式图形与底层渲染

> 基于 CesiumJS 1.143（npm `cesium@1.143.0`，Apache-2.0）· 核于 2026-07

## 速查

- **Entity API**：「高级声明式」接口——把位置 + 若干图形定义（point/billboard/label/polyline/polygon/model 等）打包成一个数据驱动对象，通过 `viewer.entities.add()` 挂载。
- **图形类型不止这几种**：point/billboard/label/polyline/polygon/model 之外还有 box/cylinder/corridor/ellipse/rectangle/path，与 CZML packet 的图形类型一一对应（详见[时间动态与性能](./time-dynamics-performance)）。
- **point vs billboard**：`point` 是纯色 GPU 绘制的圆点（`pixelSize`/`color`/`outlineColor`），`billboard` 需要图片资源（`image`/`width`/`height`），二选一取决于是否需要图标视觉。
- **双 API 并存的原因**：Entity 声明式覆盖易用性，Primitive 底层覆盖极致性能，二者不是新旧替代关系而是场景分层——业务开发默认选 Entity，遇到性能瓶颈再权衡是否下沉到 Primitive。
- **EntityCollection 增删查改**：`entities.add(options)` / `getById(id)` / `remove(entity)` / `removeAll()`；`collectionChanged` 事件在增删改时触发，可用于同步外部状态（如列表 UI）。
- **拾取与选中**：`scene.pick(windowPosition)` 拾取对象，`Cesium.defined(picked)` + `picked.id instanceof Cesium.Entity` 判断是否命中实体；`viewer.selectedEntity = entity` 触发绿色选中框 + infoBox。
- **`selectedEntity` vs `trackedEntity`**（易混）：前者只是「选中框 + infoBox」的 UI 反馈；后者是相机跟随目标，设置后相机自动跟随实体运动，二者可同时设置也可只设置其一。
- **贴地 / 高度参照**：`heightReference` 属性（`NONE`/`CLAMP_TO_GROUND`/`RELATIVE_TO_GROUND`）控制实体相对地形 / 3D Tiles 表面如何定位；`Scene.clampToHeight(position)` 可手动把一个坐标「吸附」到当前场景几何体表面。
- **Primitive = Geometry + Appearance**：适合大批量静态数据合批渲染，减少 CPU 开销、提升 GPU 利用率；`vertexFormat` 必须匹配所选 `Appearance` 静态属性 `VERTEX_FORMAT` 的要求，否则渲染异常。
- **合批**：把数千个 `GeometryInstance` 合并进一个 `Primitive`，大幅降低 draw call，是大规模静态数据的标准优化路径；每个实例可通过 `attributes` 单独指定颜色等外观。
- **Entity vs Primitive 选型**（必考）：少量 / 需频繁更新的动态对象用 Entity（API 便捷）；大批量静态几何体（数千+）用 Primitive（合批提性能）；需要自定义着色器用 Primitive；快速原型 / 常规业务用 Entity。
- ⚠️ **把数千甚至上万个静态对象都用 Entity 实现**，会导致场景帧率骤降——Entity 的便捷是有 CPU/GPU 开销代价的。
- **材质**：`Material.fromType("Color")` 快捷创建；完整 **Fabric**（Cesium 材质的 JSON 描述规范）写法可配置更复杂的 `uniforms`，两种写法等价；`PolylineGlowMaterialProperty` 是轨迹 / 管线高亮的常用发光折线材质。
- **常见 MaterialProperty**：`ColorMaterialProperty`、`PolylineGlowMaterialProperty`、`PolylineOutlineMaterialProperty`、`ImageMaterialProperty`、`StripeMaterialProperty`、`GridMaterialProperty`。
- **ParticleSystem**：模拟烟雾 / 火焰 / 雨雪 / 爆炸等进阶视觉效果，通过 `scene.primitives.add()` 注册（生命周期管理与 Primitive 一致），用 `emitter`（Circle/Box/Sphere/Cone）+ `particleLife`/`speed`/`emissionRate`/`lifetime` 等参数控制。
- **DataSource**：除 CZML（详见[时间动态与性能](./time-dynamics-performance)）外，Cesium 内置 GeoJSON/TopoJSON、KML 数据源适配器，统一挂载到 `viewer.dataSources`。
- **GeoJsonDataSource**：支持 `simplestyle-spec` 规范样式属性（`stroke`/`fill`/`strokeWidth`），`clampToGround: true` 可贴地显示；`KmlDataSource.load` 用法类似。
- ⚠️ **静态 `Cartesian3` 赋值 vs 动态属性混淆**：给 `entity.position` 赋一个固定 `Cartesian3` 和赋一个 `SampledPositionProperty`/`CallbackProperty` 语义完全不同（前者静止，后者随时间变化），阅读示例代码要看清赋的是「值」还是「Property 对象」。
- **异步数据源加载**：`GeoJsonDataSource.load`/`KmlDataSource.load` 均返回 Promise，与后续[影像·地形·3D Tiles](./imagery-terrain-3dtiles)里 3D Tiles 的异步工厂方法是同一套「返回 Promise 需 await」的心智模型。
- **进阶顺序**：[Viewer 与坐标系](./viewer-and-coordinates) → 本页 → [影像·地形·3D Tiles](./imagery-terrain-3dtiles) → [时间动态与性能](./time-dynamics-performance) → [参考](../reference)。

## 一、Entity API：声明式图形对象

Entity API 是「高级声明式」接口：把位置 + 若干图形定义（point/billboard/label/polyline/polygon/model 等）打包成一个数据驱动对象，通过 `viewer.entities.add()` 挂载。

```js
// 点 + 标签
const stadium = viewer.entities.add({
  name: "Citizens Bank Park",
  position: Cesium.Cartesian3.fromDegrees(-75.166493, 39.9060534),
  point: {
    pixelSize: 5,
    color: Cesium.Color.RED,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2,
  },
  label: {
    text: "Citizens Bank Park",
    font: "14pt monospace",
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    pixelOffset: new Cesium.Cartesian2(0, -9),
  },
});

// 公告牌(图片标记)
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-75.166493, 39.9060534),
  billboard: { image: "/path/to/icon.png", width: 64, height: 64 },
});

// 折线
viewer.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray([-77, 35, -77.1, 35]),
    width: 5,
    material: Cesium.Color.RED,
  },
});

// 多边形
const wyoming = viewer.entities.add({
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray([/* ... 经纬度顺序对 ... */]),
    height: 0,
    material: Cesium.Color.RED.withAlpha(0.5),
    outline: true,
  },
});
viewer.zoomTo(wyoming);

// 3D 模型（glTF/glb）
const modelEntity = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706),
  model: { uri: "path/to/model.glb" },
});
viewer.trackedEntity = modelEntity; // 相机跟随
```

## 二、EntityCollection：增删查改

```js
viewer.entities.add({ id: "uniqueId" /* ... */ });
const e = viewer.entities.getById("uniqueId");
viewer.entities.remove(e);
viewer.entities.removeAll();
viewer.entities.collectionChanged.addEventListener((collection, added, removed, changed) => {
  // 增删改都会触发，可用于同步外部状态（如列表 UI）
});
```

## 三、拾取与选中

```js
function pickEntity(viewer, windowPosition) {
  const picked = viewer.scene.pick(windowPosition);
  if (Cesium.defined(picked)) {
    const id = Cesium.defaultValue(picked.id, picked.primitive.id);
    if (id instanceof Cesium.Entity) return id;
  }
}
viewer.selectedEntity = entity; // 触发绿色选中框 + infoBox
```

`viewer.selectedEntity`（选中框 + infoBox 的 UI 反馈）与 `viewer.trackedEntity`（相机自动跟随该实体运动）是两个容易混淆但完全不同的概念——前者只影响视觉提示，后者影响相机行为，二者可以同时设置也可以只设置其一。

## 四、贴地与高度参照

`heightReference` 属性（`HeightReference.NONE` / `CLAMP_TO_GROUND` / `RELATIVE_TO_GROUND`）控制实体相对地形 / 3D Tiles 表面如何定位；`Scene.clampToHeight(position)` 可手动把一个坐标「吸附」到当前场景几何体（地形 / 3D Tiles / 图元）表面上。批量贴地查询的异步版本 `clampToHeightMostDetailed` 见[时间动态与性能](./time-dynamics-performance)的性能优化小节。

## 五、Primitive API：底层高性能渲染

Primitive = `Geometry`（几何形状）+ `Appearance`（外观 / 材质）组合，适合大批量静态数据合批渲染，减少 CPU 开销、提升 GPU 利用率。

```js
// 单个 Geometry + Appearance
const instance = new Cesium.GeometryInstance({
  geometry: new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromDegrees(-100.0, 20.0, -90.0, 30.0),
    vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT, // 顶点格式必须匹配 Appearance 要求
  }),
});
viewer.scene.primitives.add(
  new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      material: Cesium.Material.fromType("Stripe"),
    }),
  })
);

// 合批：数千个矩形合并为一个 Primitive，大幅降低 draw call
const instances = [];
for (let lon = -180; lon < 180; lon += 5) {
  for (let lat = -85; lat < 85; lat += 5) {
    instances.push(new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleGeometry({
        rectangle: Cesium.Rectangle.fromDegrees(lon, lat, lon + 5, lat + 5),
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromRandom({ alpha: 0.5 })),
      },
    }));
  }
}
viewer.scene.primitives.add(new Cesium.Primitive({
  geometryInstances: instances,
  appearance: new Cesium.PerInstanceColorAppearance(),
}));
```

## 六、Entity vs Primitive 选型表（必考）

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 少量 / 需要频繁更新的动态对象 | Entity | API 便捷，改属性即生效 |
| 大批量静态几何体（数千+） | Primitive | 合批减少 draw call，GPU 利用率高 |
| 需要自定义着色器 / 渲染状态 | Primitive | 更接近底层渲染管线 |
| 快速原型 / 常规产品开发 | Entity | 抽象层级适合业务代码 |

::: warning Entity 大规模使用的性能代价
把数千甚至上万个静态对象都用 Entity 实现，会导致场景帧率骤降；Entity 的便捷是有 CPU/GPU 开销代价的，大规模静态数据应转 Primitive 合批。
:::

## 七、材质与外观

```js
// 基础材质：fromType 快捷方式
polygon.material = Cesium.Material.fromType("Color");
polygon.material.uniforms.color = new Cesium.Color(1, 1, 0, 1);

// 完整 Fabric 写法（等价于上面，Fabric 是 Cesium 材质的 JSON 描述规范）
polygon.material = new Cesium.Material({
  fabric: { type: "Color", uniforms: { color: new Cesium.Color(1, 1, 0, 1) } },
});

// 发光折线材质（轨迹/管线/路径高亮常用）
polyline.material = new Cesium.PolylineGlowMaterialProperty({
  glowPower: 0.2,
  color: Cesium.Color.BLUE,
});
```

常见 MaterialProperty：`ColorMaterialProperty`、`PolylineGlowMaterialProperty`、`PolylineOutlineMaterialProperty`、`ImageMaterialProperty`、`StripeMaterialProperty`、`GridMaterialProperty`。

## 八、粒子系统（进阶）

```js
// 粒子系统：模拟烟雾/火焰/雨雪/爆炸
const particleSystem = viewer.scene.primitives.add(
  new Cesium.ParticleSystem({
    image: "smoke.png",
    imageSize: new Cesium.Cartesian2(20, 20),
    startScale: 1.0,
    endScale: 4.0,
    startColor: Cesium.Color.LIGHTSEAGREEN.withAlpha(0.7),
    endColor: Cesium.Color.WHITE.withAlpha(0.0),
    particleLife: 1.0,
    speed: 5.0,
    emitter: new Cesium.CircleEmitter(0.5), // 还有 BoxEmitter/SphereEmitter/ConeEmitter
    emissionRate: 5.0,
    lifetime: 16.0,
  })
);
```

## 九、数据源 DataSource

除 CZML 外（CZML 的时空数据交换定位见[时间动态与性能](./time-dynamics-performance)），Cesium 内置了 GeoJSON/TopoJSON、KML 的数据源适配器，统一挂载到 `viewer.dataSources`：

```js
// 支持 simplestyle-spec 规范的样式属性
const ds = await Cesium.GeoJsonDataSource.load("us-states.topojson", {
  stroke: Cesium.Color.HOTPINK,
  fill: Cesium.Color.PINK,
  strokeWidth: 3,
  clampToGround: true, // 贴地显示
});
viewer.dataSources.add(ds);

// KML
viewer.dataSources.add(Cesium.KmlDataSource.load("doc.kml"));
```

掌握了 Entity/Primitive 两套图形接口之后，进入 [影像·地形·3D Tiles](./imagery-terrain-3dtiles)：影像图层叠加、地形与垂直夸张、海量倾斜摄影/BIM 数据的 3D Tiles 流式加载。
