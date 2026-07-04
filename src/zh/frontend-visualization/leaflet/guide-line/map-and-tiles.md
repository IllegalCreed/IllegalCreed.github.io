---
layout: doc
outline: [2, 3]
---

# 地图与瓦片：初始化 / TileLayer / 坐标系

> 基于 Leaflet v1.9.4 · 核于 2026-07

## 速查

- **创建地图**：`L.map(id, options)` + `.setView([lat, lng], zoom)`；容器 `div` 必须显式设 CSS 高度。
- **常用 Map options**：`center`/`zoom`、`minZoom`/`maxZoom`、`zoomControl`(默认 `true`)、`attributionControl`(默认 `true`)、`layers`（初始图层数组）、`maxBounds`（限制可平移范围）、`zoomSnap`/`zoomDelta`（缩放对齐粒度/增量）、`preferCanvas`（矢量图形优先 Canvas）、`dragging`/`scrollWheelZoom`/`doubleClickZoom`/`boxZoom`/`touchZoom`/`keyboard`（各类交互开关）。
- **常用 Map 方法**：`setView`/`setZoom`/`zoomIn`/`zoomOut`/`panTo`/`panBy`/`fitBounds`/`flyTo`（带动画飞行）/`flyToBounds`/`getBounds`/`getCenter`/`getZoom`/`invalidateSize`（容器尺寸变化后必调）/`locate`（浏览器定位）/`remove`（销毁地图）/`addLayer`/`removeLayer`/`setMaxBounds`。
- **常用 Map 事件**：`load`/`click`/`dblclick`/`zoomstart`/`zoomend`/`movestart`/`moveend`/`zoom`/`move`/`resize`/`locationfound`/`locationerror`/`popupopen`/`popupclose`/`tooltipopen`/`tooltipclose`/`layeradd`/`layerremove`。
- **TileLayer**：`L.tileLayer(urlTemplate, options).addTo(map)`；占位符 `{z}`/`{x}{y}`/`{s}`（子域名）/`{r}`（Retina 后缀）。
- ⚠️ **`attribution` 是法律要求**，生产环境不可删除。
- **TileLayer 常用 options**：`subdomains`(默认 `'abc'`)、`tms`(默认 `false`)、`opacity`(1.0)、`zIndex`(1)、`minZoom`/`maxZoom`(0/18)、`minNativeZoom`/`maxNativeZoom`（瓦片源实际提供的级别范围）、`bounds`（限定区域加载）、`noWrap`（禁止低缩放级别世界地图重复平铺）、`errorTileUrl`（失败占位图）、`detectRetina`（高 DPI 请求 Retina 瓦片）、`keepBuffer`(默认 2，预加载行列数)。
- ⚠️ **`maxZoom` vs `maxNativeZoom`**：只设前者不设后者，超出瓦片源原生级别后会对最后一级瓦片做**放大插值**（糊化），容易被误认为"瓦片没加载出来"。
- 多个 `tileLayer` 可叠加（底图 + 路网标注层），靠 `zIndex` 或添加顺序控制堆叠。
- **WMS**：`L.tileLayer.wms(url, {layers}).addTo(map)`，服务端按地理角坐标实时合成渲染，可一次请求叠加多图层；对比普通 XYZ 瓦片是预先切好的标准化瓦片网格，加载更快、优化程度更高。
- ⚠️ **TMS 坐标系 Y 轴反转**：普通瓦片原点左上角、Y 向下；TMS 标准原点左下角、Y 向上；用 `{tms: true}` 或 URL 模板里的 `{-y}` 修正。
- **LatLng（必考坑）**：`L.latLng(lat, lng)` **纬度在前、经度在后**，与 GeoJSON `[经度, 纬度]`（RFC 7946）顺序相反；方法 `equals()`/`distanceTo()`（单位：米）/`toString()`。
- **LatLngBounds**：`L.latLngBounds(southWest, northEast)`；`extend()`/`contains()`/`isValid()`/`getCenter()`/`getNorthEast()`/`getSouthWest()`；常用于 `fitBounds()`。
- **Point / Bounds**：`LatLng`/`LatLngBounds` 对应的像素坐标系版本，用于底层渲染计算，业务代码较少直接用。
- **CRS 三选项**：`L.CRS.EPSG3857`（默认，Web Mercator）/ `L.CRS.EPSG4326`（WGS84 经纬度）/ `L.CRS.Simple`（简单笛卡尔，1 地图单位=1 像素）；官方提醒"不确定就别改"。
- **CRS.Simple** 用于游戏地图/室内平面图，配 `L.imageOverlay` + `fitBounds`，通常需负数 `minZoom` 容纳大图整体缩小显示。
- **缩放级别体系**：0 级 = 整个地球一张 **256×256** 瓦片；每升一级，世界地图宽高**翻倍**（第 n 级尺寸 `256 · 2^n` 像素，瓦片数按 4 的幂次增长）；常见瓦片源最高到约 18～19 级。
- ⚠️ **地图容器高度必设**：官方 Quick Start 原话——"确保地图容器具有定义的高度"，否则容器高度为 0、地图空白不显示；父级 flex 布局需让高度传递到底。
- **click 事件典型用法**：`map.on('click', e => ...)`，回调参数 `e.latlng` 即点击处的地理坐标（`LatLng` 实例），常见用法是拿它更新一个 popup 的位置与内容。
- **CRS 选择原则**：地图默认 `EPSG3857`；官方文档特别提醒"如果不确定 CRS 选项的含义，不要修改它"，是较少需要触碰的进阶配置。
- **图层叠加与层级**：瓦片图层可叠加多层（如路网标注层盖底图）；图层间与矢量图形的默认堆叠顺序、以及用 `map.createPane()` 打破默认层级，详见[GeoJSON 与图层](./geojson-and-layers)的 Map Panes 一节。
- **性能预告**：矢量图形量大可切 Canvas 渲染（`preferCanvas`/`L.canvas()`）；容器尺寸变化后必调 `invalidateSize()`，否则瓦片错位、留白、坐标偏移，详见[事件、交互与插件](./events-interaction-plugins)。
- **地图方法链式风格**：`L.map(id).setView(...)` 是最常见的链式写法，`.addTo(map)` 同理贯穿 TileLayer/Marker/Popup/Path 全部图层类型的创建。
- **WMS 适用场景**：科研/政府机构常见的地理数据服务多以 WMS 形式提供，与商业瓦片源并存时可用多个 `tileLayer`/`tileLayer.wms` 叠加。
- **`Point`/`Bounds` 与业务代码**：日常开发几乎不需要直接操作像素坐标系，除非要自己实现基于屏幕坐标的命中检测或自定义渲染逻辑。
- **官方提醒总结**：地图容器高度、CRS 默认值不要乱改、attribution 不可删，是 Quick Start 教程反复强调的三条入门红线。
- **Retina 适配**：URL 模板里的 `{r}` 占位符配 `detectRetina: true`，可在高 DPI 屏幕上请求带 `@2x` 后缀的高清瓦片。
- **下一步**：跑通地图与瓦片后，进[标记与矢量图形](./markers-and-vectors)加内容。

## 一、地图实例与常用 options

```js
// L.map(容器 id, options) 创建地图实例
const map = L.map("map", {
  center: [51.505, -0.09], // 也可用 setView 单独设
  zoom: 13,
  minZoom: 3,
  maxZoom: 18,
  zoomControl: true, // 默认 true，显示缩放 +/- 按钮
  attributionControl: true, // 默认 true，显示版权控件
  preferCanvas: false, // 矢量图形默认走 SVG，true 则优先 Canvas
});
```

| 选项 | 说明 |
| --- | --- |
| `center` / `zoom` | 初始中心点 / 初始缩放级别 |
| `minZoom` / `maxZoom` | 允许的最小 / 最大缩放级别 |
| `zoomControl` | 是否显示缩放控件，默认 `true` |
| `attributionControl` | 是否显示版权控件，默认 `true` |
| `layers` | 初始化时即加入地图的图层数组 |
| `maxBounds` | 限制地图可平移查看的地理范围 |
| `zoomSnap` / `zoomDelta` | 缩放级别对齐粒度 / 每次缩放的增量 |
| `preferCanvas` | 矢量图形优先用 Canvas 而非 SVG 渲染 |
| `dragging` / `scrollWheelZoom` / `doubleClickZoom` / `boxZoom` / `touchZoom` / `keyboard` | 各类交互开关（拖拽 / 滚轮缩放 / 双击缩放 / 框选缩放 / 触摸缩放 / 键盘导航） |

## 二、常用方法与事件

```js
function onMapClick(e) {
  // e.latlng 是点击处的地理坐标（LatLng 实例）
  popup
    .setLatLng(e.latlng)
    .setContent("你点击了地图：" + e.latlng.toString())
    .openOn(map);
}
map.on("click", onMapClick);
```

常用方法：`setView`/`setZoom`/`zoomIn`/`zoomOut`/`panTo`/`panBy`/`fitBounds`（按 `LatLngBounds` 自动定中心与缩放）/`flyTo`（带动画的平滑飞行）/`flyToBounds`/`getBounds`/`getCenter`/`getZoom`/`invalidateSize`（容器尺寸变化后必调，见[事件与插件页](./events-interaction-plugins)）/`locate`（浏览器定位）/`remove`（销毁地图）/`addLayer`/`removeLayer`/`setMaxBounds`。

常用事件：`load`/`click`/`dblclick`/`zoomstart`/`zoomend`/`movestart`/`moveend`/`zoom`/`move`/`resize`/`locationfound`/`locationerror`/`popupopen`/`popupclose`/`tooltipopen`/`tooltipclose`/`layeradd`/`layerremove`。

## 三、瓦片图层 TileLayer

```js
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
```

URL 模板占位符：`{z}` 缩放级别、`{x}{y}` 瓦片坐标、`{s}` 可用子域名（默认 `abc`，用于浏览器并行请求提速）、`{r}` Retina 高清屏后缀（如 `@2x`）。**attribution 是法律要求**，OpenStreetMap 等开放数据源明确要求署名，生产环境不可删除/隐藏。

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `attribution` | `null` | 版权/来源声明 |
| `subdomains` | `'abc'` | 子域名列表，可为字符串或数组 |
| `tms` | `false` | 是否为 TMS 服务（Y 轴反转） |
| `opacity` | `1.0` | 瓦片透明度 |
| `zIndex` | `1` | 层级顺序 |
| `minZoom` / `maxZoom` | `0` / `18` | 地图允许该图层显示的缩放范围 |
| `minNativeZoom` / `maxNativeZoom` | `undefined` | **瓦片源实际提供瓦片的级别范围**（进阶必考，见下） |
| `bounds` | `undefined` | 仅在指定地理范围内加载瓦片 |
| `noWrap` | `false` | 低缩放级别下是否禁止世界地图重复平铺 |
| `errorTileUrl` | `''` | 瓦片加载失败时的占位图 |
| `detectRetina` | `false` | 是否为高 DPI 屏幕请求 Retina 瓦片 |
| `keepBuffer` | `2` | 平移时视口外保留的瓦片行列数（预加载） |

多个 `tileLayer` 可叠加（如底图 + 路网标注层），通过 `zIndex` 或添加顺序控制堆叠。

::: warning maxZoom 与 maxNativeZoom 的区别
若只设地图/图层的 `maxZoom` 而不设 `maxNativeZoom`，Leaflet 会在超出瓦片源原生级别后对最后一级瓦片做**放大插值**（图像糊化），而不是请求更高精度图源，容易被误认为"该级别瓦片没加载出来"。瓦片源实际最高只到 16 级、但想让用户继续放大到 19 级时，应设 `maxNativeZoom: 16, maxZoom: 19`。
:::

## 四、WMS 与 TMS

```js
const wmsLayer = L.tileLayer
  .wms("http://ows.mundialis.de/services/service?", {
    layers: "TOPO-OSM-WMS",
  })
  .addTo(map);

// 单次请求叠加多图层（由 WMS 服务端合成）
const combo = L.tileLayer.wms(url, { layers: "TOPO-WMS,OSM-Overlay-WMS" });
```

**WMS（Web Map Service）vs 普通 XYZ 瓦片**：WMS 由地理角坐标动态定义请求范围，瓦片切分计算在 Leaflet 侧完成，"更通用但优化程度不如标准 web 瓦片"；服务端可对多图层做一次性合成渲染。普通 XYZ/TMS 瓦片则是预先切好的标准化瓦片网格，专为 web 地图优化，加载更快。

::: warning TMS 坐标系 Y 轴反转
普通 `TileLayer` 的瓦片坐标原点在**左上角**、Y 轴向下；TMS 标准原点在**左下角**、Y 轴向上。混用会导致瓦片上下颠倒，适配方式：旧版 `{tms: true}` 选项，或直接在 URL 模板里用 `{-y}` 反转 Y 坐标。
:::

## 五、坐标系与基础几何类型

**LatLng（必考坑）**：`L.latLng(lat, lng)` —— **纬度在前、经度在后**。这与 GeoJSON 标准（RFC 7946 规定坐标为 `[经度, 纬度]`）**顺序相反**，是 Leaflet 与 GeoJSON 混用时最容易踩的坑（详见[GeoJSON 与图层](./geojson-and-layers)）。

`LatLng` 方法：`equals()` 比较两点是否相等、`distanceTo()` 计算两点间距离（单位：米）、`toString()`。

`LatLngBounds`：`L.latLngBounds(southWest, northEast)`，方法 `extend()`（扩展边界以包含新点/边界）、`contains()`、`isValid()`、`getCenter()`、`getNorthEast()` / `getSouthWest()`。常用于 `fitBounds()`。

`Point` / `Bounds`：与 `LatLng`/`LatLngBounds` 对应的**像素坐标系**版本（屏幕/容器坐标，而非地理坐标），用于底层渲染计算，业务代码较少直接使用。

**CRS（坐标参考系）**：

| CRS | 用途 |
| --- | --- |
| `L.CRS.EPSG3857`（默认） | Web Mercator 投影，瓦片地图（OSM/Google/Mapbox 等）事实标准 |
| `L.CRS.EPSG4326` | WGS84 地理坐标，经纬度直接映射，常用于对接部分 WMS 服务 |
| `L.CRS.Simple` | 无地理意义的简单笛卡尔坐标系（1 地图单位 = 1 像素），用于游戏地图/室内平面图 |

官方文档原话对 CRS 选项特别提醒："如果不确定它的含义，不要修改这个选项"——侧面说明这是较少需要触碰的进阶配置。

## 六、CRS.Simple：非地理坐标系

```js
// crs: L.CRS.Simple 切换为简单笛卡尔坐标系；minZoom 常设为负数以容纳大图整体缩小显示
const map = L.map("map", { crs: L.CRS.Simple, minZoom: -5 });
const bounds = [
  [-26.5, -25],
  [1021.5, 1023],
];
L.imageOverlay("uqm_map_full.png", bounds).addTo(map);
map.fitBounds(bounds);
```

适用于**没有地理经纬度概念的场景**：游戏地图（官方例子是《星际争霸 II》星图，自带方形坐标系）、室内平面图、扫描版大图等。与默认 `CRS.Earth`（经度 360°/纬度约 170° 映射到 256px）不同，`CRS.Simple` 是**1 地图单位 = 1 像素**的简单笛卡尔映射，通常需要把 `minZoom` 设为负数以容纳大尺寸图片整体缩小显示。

## 七、缩放级别体系

- 缩放级别 **0** = 整个地球显示为一张 **256×256** 像素的瓦片图。
- 每提升一级，世界地图的宽高**翻倍**：第 n 级世界地图尺寸为 `256 · 2^n` 像素（对应瓦片数量：0 级 1 张 → 1 级 2×2=4 张 → 2 级 4×4=16 张，按 4 的幂次增长）。
- 常见瓦片源最高支持到约 **18～19 级**（能看清城市街区/建筑细节）。
- `minZoom` / `maxZoom` 限制可用范围；`zoomSnap` / `zoomDelta` 控制缩放是否必须落在整数级别及每次缩放的增量粒度。

跑通地图初始化与瓦片配置后，进入[标记与矢量图形](./markers-and-vectors)：Marker/Icon/DivIcon、Popup/Tooltip、Polyline/Polygon/Circle 等矢量图形，以及 SVG/Canvas 两种渲染器的取舍。
