---
layout: doc
outline: [2, 3]
---

# 参考：Style / Sources / Layers / Expressions / API 速查

> 基于 **MapLibre GL JS 5.x**（npm latest 5.24.0，BSD-3-Clause）/ **Mapbox GL JS 3.x**（npm latest 3.25.0，专有许可证）· 核于 2026-07

## 速查

- **包名**：`mapbox-gl`（`mapboxgl`）vs `maplibre-gl`（`maplibregl`）；`accessToken` 是 Mapbox 专属，MapLibre 不需要；CSS 必须单独引入。
- **`center`**：`[经度 lng, 纬度 lat]`，与 Leaflet 的 `[纬度 lat, 经度 lng]` 相反。
- **Style root**：`version`(8)/`sources`/`layers`/`sprite`/`glyphs`/`light`/`sky`/`terrain`/`projection`/`center`/`zoom`/`bearing`/`pitch`/`transition`。
- **Sources 六种**：`vector`/`raster`/`raster-dem`/`geojson`/`image`/`video`。
- **Layers**：`background`/`fill`/`line`/`symbol`/`circle`/`heatmap`/`fill-extrusion`/`raster`/`hillshade`/`color-relief`（较新，待确认是否两者同步）；**paint**（视觉，重绘）vs **layout**（布局，重排）。
- **Expressions**：`get`/`interpolate`/`case`/`match`/`step`；`feature-state` 免改数据做交互高亮；`filter` 同语法判布尔。
- **相机**：`flyTo`/`easeTo`/`jumpTo`/`fitBounds`；控件 `NavigationControl`/`GeolocateControl`/`ScaleControl`/`FullscreenControl`/`AttributionControl`。
- **图层 CRUD**：`addSource`/`addLayer`(`beforeId`)/`removeLayer`/`removeSource`/`setPaintProperty`/`setLayoutProperty`/`setFilter`/`moveLayer`；拾取 `queryRenderedFeatures`/`querySourceFeatures`。
- **Marker**（DOM，少量强交互）vs **symbol layer**（GPU，海量点位）；`Popup.setHTML`（需防 XSS）vs `setText`（安全）。
- **事件坑**：`load` 之后才能操作图层；`mouseenter`/`mouseleave` 必须传 `layer` 参数。
- **选型**：Mapbox 计费但有专属底图/服务；MapLibre 免费开源但需自建/自选瓦片源。

## 一、Map 初始化差异速查

| 维度 | Mapbox GL JS | MapLibre GL JS |
| --- | --- | --- |
| npm 包名 | `mapbox-gl` | `maplibre-gl` |
| 全局命名空间 | `mapboxgl` | `maplibregl` |
| CSS | `mapbox-gl/dist/mapbox-gl.css` | `maplibre-gl/dist/maplibre-gl.css` |
| `accessToken` | 必需（`account.mapbox.com` 获取） | 不需要 |
| style URL | 可用专有协议 `mapbox://styles/mapbox/streets-v12` | 直接指向公开 style JSON（如 OpenFreeMap） |
| `center` 顺序 | `[经度 lng, 纬度 lat]` | `[经度 lng, 纬度 lat]`（与 Mapbox 一致） |

::: warning accessToken 传入方式的版本差异
v3.x 起 ESM 具名导出（`import { Map } from 'mapbox-gl'`）没有默认导出对象可挂载全局 `accessToken`，必须放进 `Map` 的 options 里传入；沿用老代码 `mapboxgl.accessToken = 'xxx'` 全局赋值写法会静默不生效。
:::

其余常用 options 两者共享：`bearing`/`pitch`/`minZoom`/`maxZoom`/`hash`/`attributionControl`/`maxBounds`/`transformRequest`。

## 二、Style 根级属性速查

| 属性 | 作用 |
| --- | --- |
| `version` | 规范版本，必须为 8 |
| `name` / `metadata` | 描述性信息，不影响渲染 |
| `sources` | 数据源字典 |
| `layers` | 图层数组，顺序即渲染层叠顺序 |
| `sprite` | 精灵图 URL，供 `icon-image`/`fill-pattern` 引用 |
| `glyphs` | 字体 URL 模板（`{fontstack}`/`{range}` 占位符） |
| `light` / `sky` / `terrain` / `projection` | 全局光照 / 天空盒 / 地形 / 投影 |
| `center` / `zoom` / `bearing` / `pitch` | 默认相机位置（Map 构造未显式传入时生效） |
| `transition` | 属性过渡动画默认时长 |

Mapbox 专有 `mapbox://styles/mapbox/standard`（内置 3D 光照/大气）；MapLibre 在 `maplibre-style-spec` 独立维护规范文本，核心结构（sources/layers/paint/layout）两者保持一致。

## 三、Sources 六种类型速查

| 类型 | 用途 | 关键字段 |
| --- | --- | --- |
| `vector` | 矢量瓦片 | `url`/`tiles`/`bounds`/`minzoom`/`maxzoom`/`scheme`/`encoding`(`mvt`/`mlt`) |
| `raster` | 栅格瓦片 | `tiles`/`tileSize`(512)/`minzoom`/`maxzoom`/`bounds` |
| `raster-dem` | 地形高程 | `encoding`(`terrarium`/`mapbox`/`custom`)/`redFactor`/`greenFactor`/`blueFactor`/`baseShift` |
| `geojson` | 动态 GeoJSON | `data`/`cluster`/`clusterRadius`(50)/`clusterMaxZoom`/`clusterMinPoints`/`clusterProperties`/`buffer`/`lineMetrics` |
| `image` | 静态图片叠加 | `url` + `coordinates`（四角经纬度，顺时针） |
| `video` | 视频叠加 | `urls` + `coordinates` |

Mapbox 常走 `mapbox://` 协议引用官方托管瓦片集；MapLibre 通常直接给可公开访问的 TileJSON/瓦片模板 URL（自建或第三方托管）。

## 四、Layers 图层类型与 paint/layout 对照

| 图层类型 | 说明 |
| --- | --- |
| `background` | 无 source 的背景色/纹理层 |
| `fill` | 多边形填充 |
| `line` | 线条 |
| `symbol` | 图标/文字（GPU 批渲染） |
| `circle` | 圆点（常用于渲染大量 GeoJSON 点） |
| `heatmap` | 热力图 |
| `fill-extrusion` | 3D 挤出（如建筑） |
| `raster` | 栅格瓦片渲染 |
| `hillshade` | 山体阴影（配合 `raster-dem`） |
| `color-relief` | 高程分层设色（较新，待确认 Mapbox 是否同步） |

| 属性组 | 语义 | 性能 | 举例 |
| --- | --- | --- | --- |
| `layout` | 几何放置方式与是否显示 | 改动较重（重算符号碰撞/文字排版） | `visibility`/`icon-image`/`text-field`/`text-size`/`symbol-placement`/`line-cap` |
| `paint` | 最终视觉呈现 | 改动较轻（只重绘） | `fill-color`/`fill-opacity`/`line-width`/`circle-radius`/`fill-extrusion-height`/`heatmap-radius` |

⚠️ 频繁动态变化（悬停高亮、滑块调不透明度）优先只改 `paint`，避免触发 layout 重算。`addLayer(layer, beforeId)` 的 `beforeId` 决定插入位置，遗漏默认插最顶层。

## 五、Expressions 速查

| 表达式 | 用途 | 示例 |
| --- | --- | --- |
| `get` | 读取要素属性 | `["get", "temperature"]` |
| `interpolate` | 连续插值（常配合 zoom） | `["interpolate", ["linear"], ["zoom"], 5, 1, 10, 5]` |
| `case` | 条件分支 | `["case", ["boolean", ["feature-state", "hover"], false], 1, 0.5]` |
| `match` | 按枚举值分类 | `["match", ["get", "type"], "a", "#f00", "#000"]` |
| `step` | 阶跃函数（分级） | `["step", ["get", "point_count"], 20, 100, 30]` |

- **feature-state**：`map.setFeatureState({source, id}, {hover: true})`，依赖稳定 `feature.id`（GeoJSON 需 `generateId: true`）。
- **filter**：现代写法 `["==", ["get", "class"], "river"]`；⚠️ legacy 写法 `["==", "class", "river"]` 已列入 Deprecations，避免继续使用。

## 六、相机方法与控件速查

| 方法/控件 | 用途 |
| --- | --- |
| `flyTo(options)` | 弧线动画飞行 |
| `easeTo(options)` | 平滑过渡，无抛物线 |
| `jumpTo(options)` | 无动画立即跳转 |
| `fitBounds(bounds, options)` | 自适应地理范围 |
| `getCenter`/`setCenter`、`getZoom`/`setZoom`、`getPitch`/`setPitch`、`getBearing`/`setBearing` | 相机状态读写 |
| `NavigationControl` | 缩放按钮 + 指南针 |
| `GeolocateControl` | 浏览器定位；`positionOptions`/`trackUserLocation`/`geolocate.trigger()` |
| `ScaleControl` / `FullscreenControl` / `AttributionControl` | 比例尺 / 全屏 / 归属信息 |

## 七、图层操作与拾取 API 速查

| API | 用途 |
| --- | --- |
| `addSource(id, source)` / `removeSource(id)` | 增删数据源 |
| `addLayer(layer, beforeId?)` / `removeLayer(id)` | 增删图层，`beforeId` 控制层叠位置 |
| `setPaintProperty(id, name, value)` / `setLayoutProperty(id, name, value)` | 动态改样式；隐藏图层用 `setLayoutProperty(id, 'visibility', 'none')` |
| `setFilter(id, expr)` | 动态过滤要素 |
| `moveLayer(id, beforeId?)` | 调整层叠顺序 |
| `queryRenderedFeatures(point, {layers})` | 拾取**已渲染**要素 |
| `querySourceFeatures(id, {filter})` | 查询**源数据**（不依赖渲染状态） |
| `getSource(id).setData(geojson)` | GeoJSON 整体替换数据 |

## 八、Marker / Popup API 速查

| API | 说明 |
| --- | --- |
| `new Marker(options).setLngLat([lng, lat]).addTo(map)` | DOM 标记，适合少量/强交互 |
| `Marker.setPopup(popup)` | 绑定弹窗 |
| `new Popup(options)` | `closeButton`/`closeOnClick` 默认 `true`；`offset` 偏移 |
| `Popup.setHTML(html)` | 直接注入 HTML，**需自行防 XSS** |
| `Popup.setText(text)` | 纯文本安全写入，适合用户提交内容 |
| `Popup.setLngLat([lng, lat]).addTo(map)` | 独立使用，常配合 hover/click 事件动态定位 |

Marker 数量上百会有明显性能问题，应改用 `symbol` 图层做 GPU 批渲染。

## 九、事件速查表

| 类别 | 事件 |
| --- | --- |
| 加载/就绪 | `load`（只触发一次）/ `idle`（无进行中动画/加载） |
| 鼠标/触摸 | `click`/`dblclick`/`mousemove`/`mouseenter`/`mouseleave`/`mouseover`/`mouseout`/`contextmenu`/`touchstart`/`touchend`/`touchmove` |
| 相机运动 | `movestart`/`move`/`moveend`、`zoomstart`/`zoom`/`zoomend`、`rotatestart`/`rotate`/`rotateend`、`pitchstart`/`pitch`/`pitchend` |
| 数据/样式 | `data`/`sourcedata`/`styledata`/`styleimagemissing`/`error` |

⚠️ `mouseenter`/`mouseleave` 必须传第二参数 `layer`，否则退化为全局 `mouseover`/`mouseout`。

## 十、易错点清单

| 坑 | 说明 |
| --- | --- |
| `center` 坐标顺序 | `[经度, 纬度]`，与 Leaflet 的 `[纬度, 经度]` 完全相反 |
| 未等 `load` 事件 | 在 `map.on('load', ...)` 之外调用 `addSource`/`addLayer` 大概率报错或静默失败 |
| `accessToken` 误用 | Mapbox 必须设置有效 token；误把 Mapbox token 逻辑套用到 MapLibre 是常见迁移遗留坑 |
| CSS 未引入 | 忘记引入对应 CSS 导致控件/弹窗/比例尺样式错乱错位 |
| 容器高度未设置 | `#map` 无显式高度导致地图区域高度为 0，整个白屏 |
| 瓦片 CORS 问题 | 自建瓦片服务器未正确配置 CORS，请求被浏览器拦截，表现为地图空白但网络面板有请求 |
| `mouseenter`/`mouseleave` 漏传 layer | 退化成全局 `mouseover`/`mouseout`，对所有图层生效 |
| 包名/API 混淆 | `mapbox-gl` 与 `maplibre-gl` 独立两包；迁移时容易漏改 CSS 类名前缀（`mapboxgl-ctrl` → `maplibregl-ctrl`） |
| accessToken 设置方式版本差异 | v3.x ESM 具名导出下必须放进 `Map` options，沿用老代码全局赋值会静默不生效 |
| `Marker` 数量过多 | DOM 标记数以百计后有明显渲染/交互卡顿，应改用 `symbol` 图层 |
| style 未完全加载时读图层信息 | `getLayer()`/`getPaintProperty()` 在切换过程中调用可能拿到过时或空结果 |
| legacy filter 语法 | `["==", "class", "river"]` 已过时，应写成 `["==", ["get", "class"], "river"]` |
| 聚合数据缺少稳定 id | 想用 `feature-state` 但 GeoJSON 没设 `generateId: true` 或无 `id` 字段，会设置失败或错位 |

## 十一、选型对比：Mapbox GL JS vs MapLibre GL JS

| 维度 | Mapbox GL JS | MapLibre GL JS |
| --- | --- | --- |
| 许可证 | 专有（`SEE LICENSE IN LICENSE.txt`） | BSD-3-Clause 完全开源 |
| 计费 | 每月 50,000 次免费 web map load，超额阶梯计费 | 完全免费，无使用量限制 |
| 底图/服务 | 官方托管矢量瓦片、Standard 专有 style、导航/搜索 API | 需自建或第三方（MapTiler/OpenFreeMap） |
| 迁移成本 | — | 换包名/去 token/换 CSS 类名前缀，业务代码基本不用大改 |

完整选型叙述（选型口诀 + 与 Leaflet 的两层决策关系）见 [GeoJSON、3D 与生态](./guide-line/geojson-3d-ecosystem)。

## 十二、权威链接

- [MapLibre GL JS 文档首页](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Map 类 API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
- [MapLibre Marker 类 API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/)
- [MapLibre Popup 类 API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Popup/)
- [MapLibre GeolocateControl API](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeolocateControl/)
- [MapLibre Style Spec 首页](https://maplibre.org/maplibre-style-spec/)
- [MapLibre Mapbox 迁移指南](https://maplibre.org/maplibre-gl-js/docs/guides/mapbox-migration-guide/)
- [MapLibre GL JS GitHub 仓库](https://github.com/maplibre/maplibre-gl-js) —— README 含分叉史与法律声明
- [Mapbox GL JS Guides](https://docs.mapbox.com/mapbox-gl-js/guides/)
- [Mapbox GL JS Map API 参考](https://docs.mapbox.com/mapbox-gl-js/api/map/)
- [Mapbox 定价](https://docs.mapbox.com/mapbox-gl-js/guides/pricing/)
- [deck.gl 与 MapLibre/Mapbox 集成](https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre)
- [react-map-gl](https://visgl.github.io/react-map-gl/docs)
- 本站幻灯片：<a href="/SlideStack/mapbox-maplibre-slide/" target="_blank">Mapbox GL JS 与 MapLibre</a>
