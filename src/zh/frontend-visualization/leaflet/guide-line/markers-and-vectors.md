---
layout: doc
outline: [2, 3]
---

# 标记与矢量图形：Marker / Icon / Popup / Path

> 基于 Leaflet v1.9.4 · 核于 2026-07

## 速查

- **基础标记**：`L.marker([lat, lng]).addTo(map)`。
- **Marker 常用 options**：`icon`（默认 `L.Icon.Default`）、`draggable`（可拖拽）、`title`（浏览器原生 hover 提示）、`alt`（无障碍 alt 文本）、`zIndexOffset`（层级偏移修正）、`opacity`、`riseOnHover`（hover 时置顶）。
- **Marker 常用方法**：`getLatLng()`/`setLatLng()`/`getIcon()`/`setIcon()`/`setOpacity()`/`setZIndexOffset()`。
- **L.icon（图片图标）**：`iconUrl`/`shadowUrl`/`iconSize`/`shadowSize`/`iconAnchor`（图标上对应地理位置的锚点）/`shadowAnchor`/`popupAnchor`（弹窗相对 iconAnchor 的打开位置）。
- **自定义图标类**：`L.Icon.extend({options: {...}})` 复用共同配置，`new LeafIcon({iconUrl: ...})` 实例化只传差异项。
- **L.divIcon（HTML/CSS 图标）**：不依赖图片资源，用 `html` + `className` 渲染纯 DOM/CSS 标记，适合数字徽标、SVG、CSS 动画等动态内容；核心 options：`html`/`iconSize`/`className`/`popupAnchor`。
- **Popup options**：`maxWidth`(300)/`minWidth`(50)/`maxHeight`（超出内部滚动）/`autoPan`(true，自动平移地图使弹窗可见)/`keepInView`/`closeButton`(true)/`autoClose`(true，开新关旧)/`closeOnClick`（继承地图设置）/`closeOnEscapeKey`(true)/`offset`(默认 `[0,7]`)/`className`。
- **Tooltip options**：`offset`(默认 `[0,0]`)/`direction`（`right`/`left`/`top`/`bottom`/`center`/`auto`）/`permanent`(false，是否常驻而非仅 hover)/`sticky`（是否跟随鼠标）/`opacity`(0.9)/`pane`(`'tooltipPane'`)。
- **共同方法**：`bindPopup()`/`bindTooltip()`、`openPopup()`/`openTooltip()`、`closePopup()`/`closeTooltip()`、`setContent()`/`getContent()`/`isOpen()`。
- **核心区别**：Tooltip 默认随鼠标 hover 显示/消失（轻量提示），Popup 默认需点击触发、常驻直到用户关闭（承载更多信息/交互）。
- **Path 通用 options**：`stroke`(true)/`color`(`'#3388ff'`)/`weight`(3)/`opacity`(1.0)/`fill`/`fillColor`/`fillOpacity`(0.2)/`fillRule`(`'evenodd'`)/`lineCap`/`lineJoin`(`'round'`)/`dashArray`（虚线，如 `'5, 10'`）。
- **构造函数**：`L.polyline`（折线，坐标数组）/`L.polygon`（多边形，自动闭合）/`L.rectangle`（矩形，传 `LatLngBounds`）/`L.circle`（圆，`radius` 单位【米】）/`L.circleMarker`（圆点，`radius` 单位【像素】）。
- ⚠️ **Circle 与 CircleMarker 半径单位混淆**：`Circle.radius` 是米（随缩放级别改变屏幕大小），`CircleMarker.radius` 是像素（屏幕固定，不随缩放改变）。
- **渲染器**：默认 SVG（每个图形是独立 DOM 节点，事件精确、可用 CSS 操作）；`preferCanvas: true` 或 `L.canvas()` 显式指定改用单张 Canvas 绘制（大量图形性能更好，但样式/事件处理方式不同）。
- **Marker 交互示例**：`marker.on('click', fn)`、`marker.on('dragend', fn)`（配合 `draggable: true`）都是常见的标记级事件监听，继承自 `Evented`。
- **拖拽结束读值**：`marker.on('dragend', e => e.target.getLatLng())` 拿到拖拽后的新坐标。
- **弹窗内容支持 HTML**：`bindPopup("<b>Hello</b>")` 可传任意 HTML 字符串，也可传 DOM 节点或返回它们的函数。
- **Tooltip 常驻用法**：`marker.bindTooltip("常驻标签", { permanent: true, direction: "top" })`，配 `sticky: true` 可让提示跟随鼠标移动。
- **图标锚点心智模型**：`iconAnchor` 决定图标哪个像素点对准地理坐标（通常是图钉尖端），`popupAnchor` 是弹窗相对该锚点的偏移。
- **DivIcon 常见用途**：数字徽标（聚合计数）、内联 SVG、CSS 动画标记，比图片图标更灵活但需自己管理样式。
- **矢量图形坐标顺序**：`L.polyline`/`L.polygon` 等吃的坐标数组元素仍是 `LatLng` 顺序（纬度在前），与 GeoJSON 的 `[经度, 纬度]` 不同，详见[地图与瓦片](./map-and-tiles)。
- **构造函数补充**：所有 Path 构造函数第二参都是共享的 options 对象（`color`/`weight`/`fillOpacity` 等），与 Marker/GeoJSON 的 options 参数位置一致。
- **Path 事件与样式同源**：SVG 渲染下每个 Path 都是独立 DOM 节点，可被 CSS 选中定制；Canvas 渲染下没有对应 DOM 节点，事件靠内部命中检测模拟。
- **多图形组合预告**：单个 Marker/Path 之外，`L.layerGroup`/`L.featureGroup` 可把多个图形打包统一管理，详见[GeoJSON 与图层](./geojson-and-layers)。
- **图标丢失坑预告**：webpack/vite 打包下默认 Marker 图标可能 404，修复方式见[事件、交互与插件](./events-interaction-plugins)。
- **性能预告**：矢量图形数量上百上千时切 `L.canvas()` 渲染器；标记数量上万级用 `Leaflet.markercluster` 插件聚合，详见下一篇。
- **Marker 层级排序**：默认按纬度自动定层级（越靠图面下方越靠前），`zIndexOffset` 可手动修正这一默认排序。
- **矢量图形与 Marker 的组合**：一张地图上 Marker（点）与 Path（线/面）经常混用，样式与交互 API 是两套，但共享同一个地图实例与事件模型。
- **下一步**：加完标记与矢量图形，进[GeoJSON 与图层](./geojson-and-layers)接数据驱动的分级着色地图。

## 一、Marker 基础

```js
const marker = L.marker([51.5, -0.09]).addTo(map);
```

**Marker 常用 options**：`icon`（默认 `L.Icon.Default`）、`draggable`（可拖拽）、`title`（浏览器原生 hover 提示文字）、`alt`（无障碍 alt 文本）、`zIndexOffset`（相对纬度自动层级的偏移修正）、`opacity`、`riseOnHover`（hover 时置顶）。

**Marker 常用方法**：`getLatLng()` / `setLatLng()` / `getIcon()` / `setIcon()` / `setOpacity()` / `setZIndexOffset()`。

## 二、自定义图标：L.icon 与 L.Icon.extend

```js
const greenIcon = L.icon({
  iconUrl: "leaf-green.png",
  shadowUrl: "leaf-shadow.png",
  iconSize: [38, 95], // 图标尺寸
  shadowSize: [50, 64], // 阴影尺寸
  iconAnchor: [22, 94], // 图标上对应标记地理位置的锚点
  shadowAnchor: [4, 62], // 阴影锚点
  popupAnchor: [-3, -76], // 弹窗相对 iconAnchor 的打开位置
});
L.marker([51.5, -0.09], { icon: greenIcon }).addTo(map);
```

多个图标共享同一套尺寸/锚点配置时，用 `L.Icon.extend` 定义一个自定义图标类，复用共同配置：

```js
const LeafIcon = L.Icon.extend({
  options: {
    shadowUrl: "leaf-shadow.png",
    iconSize: [38, 95],
    shadowSize: [50, 64],
    iconAnchor: [22, 94],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -76],
  },
});
// 实例化时只需传差异项（这里只有 iconUrl 不同）
const greenIcon2 = new LeafIcon({ iconUrl: "leaf-green.png" });
```

## 三、L.divIcon：HTML/CSS 图标

不依赖图片资源，用 `html` + `className` 渲染纯 DOM/CSS 标记，适合需要动态内容（数字徽标、SVG、CSS 动画）的场景。核心 options：`html`、`iconSize`、`className`、`popupAnchor`。

```js
const badgeIcon = L.divIcon({
  className: "custom-badge", // 配合 CSS 类名做样式定制
  html: `<div class="badge">99+</div>`, // 任意 HTML 片段，可放数字徽标/内联 SVG
  iconSize: [30, 30],
});
L.marker([51.5, -0.1], { icon: badgeIcon }).addTo(map);
```

## 四、Popup 与 Tooltip

```js
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
```

**Popup options**：`maxWidth`(300) / `minWidth`(50) / `maxHeight`（超出则内部滚动） / `autoPan`(true，自动平移地图使弹窗可见) / `keepInView` / `closeButton`(true) / `autoClose`(true，打开新 popup 时关闭旧的) / `closeOnClick`（继承地图设置） / `closeOnEscapeKey`(true) / `offset`（默认 `[0,7]`） / `className`。

**Tooltip options**：`offset`（默认 `[0,0]`）/ `direction`（`right`/`left`/`top`/`bottom`/`center`/`auto`）/ `permanent`(false，是否常驻显示而非仅 hover) / `sticky`（是否跟随鼠标移动）/ `opacity`(0.9) / `pane`(`'tooltipPane'`)。

共同方法：`bindPopup()` / `bindTooltip()`、`openPopup()` / `openTooltip()`、`closePopup()` / `closeTooltip()`、`setContent()` / `getContent()` / `isOpen()`。

::: tip Tooltip 与 Popup 的核心区别
Tooltip 默认随鼠标 hover 显示/消失（轻量提示），Popup 默认需点击触发、常驻直到用户关闭（承载更多信息/交互）。想做"常驻标签"效果，给 Tooltip 设 `permanent: true`；想让提示跟手，设 `sticky: true`。
:::

## 五、矢量图层 Path 系列

**Path 通用 options**（Polyline/Polygon/Circle/CircleMarker/Rectangle 共享）：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `stroke` | `true` | 是否绘制描边 |
| `color` | `'#3388ff'` | 描边颜色 |
| `weight` | `3` | 描边宽度（像素） |
| `opacity` | `1.0` | 描边不透明度 |
| `fill` | 视形状而定 | 是否填充 |
| `fillColor` | 同 `color` | 填充颜色 |
| `fillOpacity` | `0.2` | 填充不透明度 |
| `fillRule` | `'evenodd'` | SVG fill-rule |
| `lineCap` / `lineJoin` | `'round'` | SVG 线帽/线连接样式 |
| `dashArray` | — | 虚线样式，如 `'5, 10'` |

**构造函数与形状特有参数**：

```js
L.polyline(latlngsArray, options); // 折线：普通坐标数组
L.polygon(
  [
    [lat1, lng1],
    [lat2, lng2],
    [lat3, lng3],
  ],
  options,
); // 多边形：自动闭合
L.rectangle(latLngBounds, options); // 矩形：传 LatLngBounds 而非坐标数组
L.circle([lat, lng], { radius: 500 /* 单位【米】 */ }); // 随地图缩放保持真实地理尺寸
L.circleMarker([lat, lng], { radius: 5 /* 单位【像素】 */ }); // 不随缩放改变地理尺寸
```

::: warning Circle 与 CircleMarker 半径单位混淆
`Circle.radius` 是**米**（真实地理尺寸，随缩放级别改变屏幕大小），`CircleMarker.radius` 是**像素**（屏幕固定大小，不随缩放改变）；选错会导致图形在不同缩放级别下表现完全不符合预期——想画"精确到米"的范围圈用 `Circle`，想画"屏幕上固定大小"的点标记用 `CircleMarker`。
:::

## 六、渲染器：SVG vs Canvas

默认用 **SVG** 渲染矢量图形：每个图形是独立 DOM 节点，事件精确、可用 CSS 操作，但图形数量大时 DOM 开销高。设置 `preferCanvas: true`（地图级）或用 `L.canvas()` 显式指定渲染器（图层级），改用单张 Canvas 绘制所有矢量图形：

```js
// 地图级全局切换
const map = L.map("map", { preferCanvas: true });

// 或只给某个图层指定渲染器
L.circle([51.5, -0.09], { radius: 500, renderer: L.canvas() }).addTo(map);
```

Canvas 路线在大量图形（成百上千条 Path）时性能更好，但每个图形不再是独立 DOM 节点，样式/事件处理方式与 SVG 不同（事件靠 Leaflet 内部命中检测模拟，而非浏览器原生 DOM 事件）。

标记与矢量图形加完后，进入[GeoJSON 与图层](./geojson-and-layers)：用真实数据驱动地图渲染、管理多图层、加控件。
