---
layout: doc
outline: [2, 3]
---

# 相机、图层与事件：控制、增删改查、拾取、坑集中地

> 基于 **MapLibre GL JS 5.x**（npm latest 5.24.0，BSD-3-Clause）/ **Mapbox GL JS 3.x**（npm latest 3.25.0，专有许可证）· 核于 2026-07

## 速查

- **相机过渡三兄弟**：`flyTo`（带弧线动画，观感最好）/ `easeTo`（平滑过渡，无抛物线）/ `jumpTo`（无动画立即跳转）；`fitBounds(bounds, options)` 自动计算缩放/中心使地理范围完整可见。
- **相机读写**：`getCenter`/`setCenter`、`getZoom`/`setZoom`、`getPitch`/`setPitch`（0-85°）、`getBearing`/`setBearing`（0-360°）。
- **常用控件**：`NavigationControl`（缩放+指南针）、`GeolocateControl`（浏览器定位，核心 options `positionOptions`/`trackUserLocation`，方法 `geolocate.trigger()`）、`ScaleControl`/`FullscreenControl`/`AttributionControl`。
- **图层增删改查**：`addSource`/`addLayer`（第二参 `beforeId`）/`removeLayer`/`removeSource`/`setPaintProperty`/`setLayoutProperty`（隐藏图层用 `visibility: 'none'`）/`setFilter`/`moveLayer`。
- **要素拾取**：`queryRenderedFeatures(point, {layers})` 拾取**已渲染**要素；`querySourceFeatures(id, {filter})` 查询**源数据**（不依赖是否已渲染）。
- **Marker（DOM） vs symbol layer（GPU）**：`Marker` 是真实 DOM 元素，适合单个/少量强交互场景；`symbol` 图层 GPU 批渲染，适合成百上千点位，数量再多也不会导致 DOM 卡顿。
- **Popup**：`setHTML()` 直接注入 HTML（需自行防 XSS）；`setText()` 作为纯文本安全写入，适合渲染用户提交内容；`closeButton`/`closeOnClick` 默认都为 `true`。
- ⚠️ **`map.on('load', callback)` 必考坑**：必须等 style 与初始瓦片加载完成后才能安全 `addSource`/`addLayer`，之外调用大概率报错或静默失败。
- ⚠️ **`mouseenter`/`mouseleave` 必须传第二参数 `layer`**，否则退化为全局 `mouseover`/`mouseout` 语义，对所有图层生效而非目标图层。
- **事件大类**：加载/就绪（`load`/`idle`）、鼠标/触摸（`click`/`mousemove`/`mouseenter`/`mouseleave`/`contextmenu`/`touchstart` 等）、相机运动（`movestart`/`move`/`moveend`/`zoomstart`/`zoom`/`zoomend`/`rotatestart`/`pitchstart` 等）、数据/样式（`data`/`sourcedata`/`styledata`/`styleimagemissing`/`error`）。
- **进阶顺序**：[paint/layout 与表达式](./paint-layout-expressions) → 本页 → [GeoJSON、3D 与生态](./geojson-3d-ecosystem)。

## 一、相机与镜头控制

| 方法 | 用途 |
| --- | --- |
| `flyTo(options)` | 带弧线动画的镜头飞行（自动组合缩放+平移+旋转），观感最好 |
| `easeTo(options)` | 平滑过渡到目标状态，无 `flyTo` 的抛物线效果 |
| `jumpTo(options)` | 无动画立即跳转 |
| `fitBounds(bounds, options)` | 自动计算缩放/中心，使给定地理范围完整可见 |
| `getCenter()` / `setCenter()` | 读取/设置中心点 |
| `getZoom()` / `setZoom()` | 读取/设置缩放级别 |
| `getPitch()` / `setPitch()` | 读取/设置倾斜角（0-85°） |
| `getBearing()` / `setBearing()` | 读取/设置旋转角（0-360°） |

```js
map.flyTo({ center: [-0.1276, 51.5072], zoom: 15.5, bearing: 27, pitch: 45 });
```

常用内置控件（`map.addControl(control, position)`）：

- **NavigationControl**：缩放按钮 + 指南针，点击指南针可复位旋转角。
- **GeolocateControl**：调用浏览器 Geolocation API 定位用户位置，核心 options 为 `positionOptions`（透传给浏览器定位 API）、`trackUserLocation`（默认 `false`，为 `true` 时持续跟踪并显示方向锥）；触发方法 `geolocate.trigger()`，事件包括 `geolocate`/`error`/`trackuserlocationstart`/`trackuserlocationend`/`outofmaxbounds`。
- **ScaleControl** / **FullscreenControl** / **AttributionControl**：分别提供比例尺、全屏切换、归属信息展示，属于常规辅助控件。

```js
map.addControl(new maplibregl.NavigationControl(), "top-left");
map.addControl(
  new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
  }),
);
```

## 二、图层动态操作：增删改查

```js
map.addSource("id", { type: "geojson", data: geojson });
map.addLayer(
  { id: "layer-id", type: "circle", source: "id", paint: {} },
  "beforeLayerId",
);
map.removeLayer("layer-id");
map.removeSource("id");

map.setPaintProperty("layer-id", "circle-color", "#f00");
map.setLayoutProperty("layer-id", "visibility", "none"); // 隐藏图层的标准做法
map.setFilter("layer-id", ["==", ["get", "type"], "a"]);
map.moveLayer("layer-id", "anotherLayerId"); // 调整层叠顺序（移到 anotherLayerId 之前）
```

`addLayer` 的第二参数 `beforeId` 决定新图层插入到哪个已有图层之前——这是控制"新加的图层盖住谁 / 被谁盖住"的关键，遗漏时默认插到最顶层。

## 三、要素拾取：queryRenderedFeatures vs querySourceFeatures

```js
const features = map.queryRenderedFeatures(point, { layers: ["layer-id"] }); // 拾取渲染出的要素
const sourceFeatures = map.querySourceFeatures("id", { filter: [] }); // 查询源数据（不依赖是否渲染）
```

两者语义不同：`queryRenderedFeatures` 只返回**当前视口内已渲染**的要素（受缩放级别、过滤器、图层可见性影响）；`querySourceFeatures` 直接查询**源数据本身**，不管是否已经渲染到屏幕上。点击拾取、hover 高亮等交互场景通常用前者；需要遍历全部数据（不受视口限制）时用后者。

## 四、标记与弹窗：Marker（DOM）vs symbol layer（GPU）

`Marker` 是真实的 DOM 元素，定位随地图变换用 CSS transform 更新；`symbol` 图层是在 WebGL 里由 GPU 批量渲染的图标/文字。两者的适用场景差异：

- **Marker**：单个或少量、需要复杂 DOM 交互（内嵌表单/动画/事件）的场景，例如"当前用户位置"这种唯一标记。
- **symbol layer**：成百上千个点位的场景（POI、聚合点等），因为是 GPU 批渲染，数量再多也不会造成 DOM 节点膨胀导致的卡顿——这是矢量瓦片地图库的通用性能实践，而非某一方文档独有结论。

```js
// Marker：DOM 标记，适合少量/强交互
new maplibregl.Marker({ color: "#FFFFFF", draggable: true })
  .setLngLat([30.5, 50.5])
  .setPopup(new maplibregl.Popup().setHTML("<h1>Hello!</h1>"))
  .addTo(map);

// Popup 独立使用（不挂 Marker，常配合 click/hover 事件动态定位）
const popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  offset: [0, -10],
});
map.on("mousemove", "places", (e) => {
  popup
    .setLngLat(e.features[0].geometry.coordinates)
    .setHTML(e.features[0].properties.description)
    .addTo(map);
});
```

`Popup` 的 `setHTML()` 直接注入 HTML（需自行防 XSS），`setText()` 则作为纯文本安全写入，适合渲染用户提交的内容。`closeButton`/`closeOnClick` 默认都为 `true`。

## 五、事件系统：load 坑与事件大全

```js
map.on("load", () => {
  // 必须等 load 事件后才能安全地 addSource/addLayer/操作图层——
  // 这是最高频的入门坑：style 还没加载完就调用 addLayer 会直接报错
  map.addSource("points", { type: "geojson", data: geojson });
  map.addLayer({ id: "points", type: "circle", source: "points", paint: {} });
});

map.on("click", "points", (e) => {
  /* 点击某图层要素才触发，第二参数是 layer id */
});
map.on("mouseenter", "points", () => {
  map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", "points", () => {
  map.getCanvas().style.cursor = "";
});
```

事件大类：

- **加载/就绪**：`load`（style 与初始瓦片加载完成，只触发一次）、`idle`（当前没有正在进行的动画/加载，可用于"稳定后截图"等场景）。
- **鼠标/触摸**：`click`/`dblclick`/`mousemove`/`mouseenter`/`mouseleave`/`mouseover`/`mouseout`/`contextmenu`/`touchstart`/`touchend`/`touchmove`；其中 `mouseenter`/`mouseleave` **必须**传第二参数 `layer` 才有意义，否则退化为全局 `mouseover`/`mouseout` 语义。
- **相机运动**：`movestart`/`move`/`moveend`、`zoomstart`/`zoom`/`zoomend`、`rotatestart`/`rotate`/`rotateend`、`pitchstart`/`pitch`/`pitchend`。
- **数据/样式**：`data`、`sourcedata`、`styledata`、`styleimagemissing`（引用的图标缺失时触发，可在回调里 `addImage` 补救）、`error`（WebGL/资源错误）。

::: warning style 未完全加载时读取图层信息
`getLayer()`/`getPaintProperty()` 等方法在 style 切换过程中调用可能拿到过时或空结果，应监听 `styledata`/`load` 确认切换完成后再读取。
:::

跑通图层操作与事件系统后，进入 [GeoJSON、3D 与生态](./geojson-3d-ecosystem)：GeoJSON 动态更新、聚合、3D 挤出建筑与地形、性能优化、生态集成与选型。
