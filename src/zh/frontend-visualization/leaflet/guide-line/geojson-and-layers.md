---
layout: doc
outline: [2, 3]
---

# GeoJSON 与图层：数据驱动地图 / 图层管理 / 控件

> 基于 Leaflet v1.9.4 · 核于 2026-07

## 速查

- **加载 GeoJSON**：`L.geoJSON(data, options).addTo(map)`。
- **`pointToLayer`**：把 GeoJSON 的 `Point` 要素转换为自定义 Marker/CircleMarker（默认才会用普通 Marker）。
- **`style`**：函数或对象，可依据 `feature.properties` 动态返回样式——分级着色（Choropleth）的核心机制。
- **`onEachFeature`**：对每个要素执行回调，典型用途是绑定 popup、绑定 `layer.on({mouseover/mouseout/click})` 交互事件。
- **`filter`**：控制哪些要素被渲染。
- ⚠️ **坐标顺序**：GeoJSON 坐标是 `[经度, 纬度]`，Leaflet 内部自动转换为 `LatLng` 渲染——业务代码手写坐标时容易与 `LatLng` 的 `[纬度, 经度]` 顺序搞混。
- **其它方法**：`addData()`（追量添加数据）、`resetStyle()`（重置为默认/初始样式）、`toGeoJSON()`（导出当前图层为 GeoJSON）。
- **Choropleth 三段式范式**：`getColor` 阶梯函数（依数值返回颜色）+ `style`（属性驱动着色）+ `onEachFeature`（绑定 hover/click 交互）。
- **hover 高亮**：`layer.setStyle({...})` 高亮 + `layer.bringToFront()` 置顶；离开时 `geojson.resetStyle(e.target)` 恢复。
- **click 缩放**：`map.fitBounds(e.target.getBounds())` 定位到该要素范围。
- **`L.layerGroup([...])`**：把多个图层打包成一个整体统一 `addTo`/`removeFrom` 地图，**本身不支持** `bindPopup`/事件监听。
- **`L.featureGroup(...)`**：继承自 `LayerGroup`，额外支持整体 `bindPopup`/`bindTooltip`/事件（本身也是 Layer/Evented），是"可交互的图层组"。
- **图层控件**：`L.control.layers(baseMaps, overlayMaps, options).addTo(map)`；`baseLayers` 互斥（单选切换底图），`overlays` 独立开关（复选叠加层）；`collapsed`（默认 `true`）常用 option。
- **动态追加**：`layerControl.addBaseLayer(layer, name)` / `layerControl.addOverlay(layer, name)`。
- **Control 家族**：`Control.Zoom`（缩放按钮，`zoomControl:true` 自动加）/ `Control.Attribution`（版权，自动汇总各图层 attribution）/ `Control.Layers`（底图切换+叠加层）/ `Control.Scale`（比例尺，支持公制/英制）。
- **自定义 Control 范式**：`L.control(options)` → 重写 `onAdd(map)` 返回 DOM 节点 →（可选）`onRemove(map)` → `.addTo(map)`；Legend/Info 控件的标准写法。
- **Overlays**：`L.imageOverlay`/`L.videoOverlay`/`L.svgOverlay` 都用 `LatLngBounds` 把媒体资源校准贴合到地图地理范围；`VideoOverlay` 继承自 `ImageOverlay`。
- **Map Panes**：默认堆叠顺序（从下到上）`TileLayer` → `Path` → Marker 阴影 → Marker 图标 → `Popup`；`map.createPane()` + 设 `zIndex` 可打破默认顺序。
- **GeoJSON 数据来源**：常见做法是 `fetch(url).then(r => r.json())` 拿到原始 GeoJSON 对象后传给 `L.geoJSON()`，也可以是本地静态导入的 JSON。
- **`feature.properties`**：GeoJSON 每个要素自带的业务属性字段，是 `style`/`onEachFeature`/`filter` 三个回调做动态判断的数据来源。
- ⚠️ **LayerGroup 与 FeatureGroup 混淆**：对 `LayerGroup` 调 `bindPopup()`/事件监听不会生效，需要统一交互能力时应换 `FeatureGroup`。
- **Control.Layers 自动同步**：控件会自动检测已添加的图层并同步勾选状态，无需手动维护 UI 与图层的对应关系。
- **自定义 Control 的 DOM 构建**：常用 `L.DomUtil.create(tagName, className)` 创建节点，比原生 `document.createElement` 多一步自动挂 class。
- **Legend 与 Info 是同一范式**：显示图例的 Legend 与显示 hover 要素属性的 Info，都是"`onAdd` 返回 div、内部拼 innerHTML"的同一套写法。
- **Overlay 的 `interactive` 选项**：`L.imageOverlay`/`L.svgOverlay` 传 `interactive: true` 才能绑定鼠标事件，默认媒体图层不接受交互。
- **自定义 Pane 典型场景**：某个标注文字层要求盖在 GeoJSON 之上、但仍在 Popup 之下，默认堆叠顺序无法满足时才需要用它。
- **Choropleth 与图层控件组合**：分级着色图层本身可作为 `overlayMaps` 的一项接入 `Control.Layers`，与其它专题图层做开关切换。
- **GeoJSON 与 FeatureGroup 的关系**：`L.geoJSON()` 返回的对象本身就是一个 `FeatureGroup`，因此可以直接整体 `bindPopup`/监听事件。
- **下一步**：图层与控件玩转后，进[事件、交互与插件](./events-interaction-plugins)看事件系统、性能优化与生态插件。

## 一、加载 GeoJSON：核心回调

```js
L.geoJSON(geojsonFeature, {
  // Point 要素默认渲染为普通 Marker；这里改成自定义样式的 CircleMarker
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      fillOpacity: 0.8,
    });
  },
  // 依据要素属性动态返回样式（分级着色的核心机制）
  style: function (feature) {
    switch (feature.properties.party) {
      case "Republican":
        return { color: "#ff0000" };
      case "Democrat":
        return { color: "#0000ff" };
    }
  },
  // 对每个要素执行回调，典型用途是绑定 popup
  onEachFeature: function (feature, layer) {
    if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
    }
  },
  // 控制哪些要素被渲染
  filter: function (feature, layer) {
    return feature.properties.show_on_map;
  },
}).addTo(map);
```

::: warning GeoJSON 坐标顺序与 LatLng 相反
GeoJSON 坐标是 `[经度, 纬度]`（如 `[-104.99, 39.75]`），Leaflet 内部会自动转换为 `LatLng` 供渲染——**业务代码手写坐标、或把 GeoJSON 数据转手写坐标数组时容易与 `LatLng` 的 `[纬度, 经度]` 顺序搞混**，详见[入门页](../getting-started)的 LatLng 坑。
:::

其它常用方法：`addData()`（追量添加数据到已有图层）、`resetStyle()`（重置为默认/初始样式）、`toGeoJSON()`（导出当前图层为 GeoJSON）。

## 二、Choropleth 分级统计图完整范式

官方案例（人口密度地图）展示的三段式范式，是 GeoJSON 交互最经典的写法：

```js
// 第一段：getColor 阶梯函数——依数值返回颜色
function getColor(d) {
  return d > 1000
    ? "#800026"
    : d > 500
      ? "#BD0026"
      : d > 200
        ? "#E31A1C"
        : d > 100
          ? "#FC4E2A"
          : d > 50
            ? "#FD8D3C"
            : d > 20
              ? "#FEB24C"
              : d > 10
                ? "#FED976"
                : "#FFEDA0";
}

// 第二段：style——属性驱动着色
function style(feature) {
  return {
    fillColor: getColor(feature.properties.density),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
  };
}

// 第三段：onEachFeature——绑定交互
function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({ weight: 5, color: "#666", dashArray: "", fillOpacity: 0.7 });
  layer.bringToFront(); // 置顶，避免被相邻要素的描边压住
  info.update(layer.feature.properties);
}
function resetHighlight(e) {
  geojson.resetStyle(e.target); // 恢复到 style() 计算出的默认样式
  info.update();
}
function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds()); // 点击缩放到该要素范围
}
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
}

const geojson = L.geoJson(statesData, { style: style, onEachFeature: onEachFeature }).addTo(map);
```

配套的**自定义 Info 控件**（显示当前 hover 区域信息）与 **Legend 图例控件**均通过 `L.control({position}).onAdd = function(map){ ... return div; }` 模式实现（见第五节）。

## 三、图层管理：LayerGroup 与 FeatureGroup

```js
// LayerGroup：只打包统一增删，本身不支持 bindPopup/事件
const cities = L.layerGroup([marker1, marker2, marker3]);
cities.addTo(map);

// FeatureGroup：继承自 LayerGroup，额外支持整体交互
const parks = L.featureGroup([polygon1, polygon2]).bindPopup("这是一组公园");
```

`L.layerGroup([layer1, layer2, ...])`：把多个图层打包成一个整体统一 `addTo`/`removeFrom` 地图，**本身不支持** `bindPopup`/事件监听。

`L.featureGroup(...)`：**继承自 LayerGroup**，额外支持整体 `bindPopup`/`bindTooltip`/事件（因为它本身也是 Layer/Evented），是"可交互的图层组"。

::: warning LayerGroup 与 FeatureGroup 混淆
对 `LayerGroup` 调用 `bindPopup()`/事件监听不会生效（它本身不支持），需要统一交互能力时应使用 `FeatureGroup`。
:::

## 四、图层控件 Control.Layers

```js
const baseMaps = { OpenStreetMap: osm, "OpenStreetMap.HOT": osmHOT };
const overlayMaps = { Cities: cities };
const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

// 动态追加
layerControl.addBaseLayer(openTopoMap, "OpenTopoMap");
layerControl.addOverlay(parks, "Parks");
```

`L.control.layers(baseLayers, overlays, options)`：`baseLayers` 内的图层互斥（单选，切换底图），`overlays` 内的图层独立开关（复选，叠加层）。控件自动检测已添加的图层并同步勾选状态。`collapsed`（默认 `true`，是否折叠）是常用 option。

## 五、控件家族与自定义 Control

- **Control.Zoom**：默认缩放 +/- 按钮，`map.options.zoomControl: true` 时自动添加。
- **Control.Attribution**：版权信息控件，`attributionControl: true` 时自动添加，自动汇总各图层的 `attribution`。
- **Control.Layers**：见第四节，底图切换 + 叠加层开关。
- **Control.Scale**：显示比例尺，支持公制/英制单位切换。

**自定义 Control**（Legend/Info 案例的标准写法）：

```js
const legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
  const div = L.DomUtil.create("div", "info legend");
  const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
  for (let i = 0; i < grades.length; i++) {
    // 逐档拼接色块 + 数值区间
    div.innerHTML +=
      '<i style="background:' +
      getColor(grades[i] + 1) +
      '"></i> ' +
      grades[i] +
      (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+");
  }
  return div;
};
legend.addTo(map);
```

任意自定义 Control 都遵循：`L.control(options)` 创建实例 → 重写 `onAdd(map)` 返回一个 DOM 节点 → （可选）重写 `onRemove(map)` → `.addTo(map)`。

## 六、其他图层类型：Image / Video / SVG Overlay

```js
L.imageOverlay(imageUrl, latLngBounds, {
  opacity: 0.8,
  interactive: true,
}).addTo(map);

// VideoOverlay 继承自 ImageOverlay
L.videoOverlay([urlWebm, urlMp4], latLngBounds, {
  autoplay: true,
  muted: true,
  playsInline: true,
}).addTo(map);

L.svgOverlay(svgDomElement, latLngBounds, {
  opacity: 0.7,
  interactive: true,
}).addTo(map);
```

三者共享同一种"用 `LatLngBounds` 把任意媒体资源校准贴合到地图地理范围"的模式，`VideoOverlay` 明确继承自 `ImageOverlay`。

## 七、Map Panes：图层层级控制

Leaflet 默认图层堆叠顺序（从下到上）：`TileLayer`/`GridLayer` → `Path`（折线/多边形/圆/GeoJSON）→ Marker 阴影 → Marker 图标 → `Popup`。

当默认顺序不满足需求时（例如某个标注文字层要求盖在 GeoJSON 之上、但仍在 Popup 之下），用自定义 pane 打破默认层级：

```js
map.createPane("labels");
map.getPane("labels").style.zIndex = 650;
map.getPane("labels").style.pointerEvents = "none"; // 避免遮挡下方图层的鼠标事件
```

图层与控件玩转后，进入[事件、交互与插件](./events-interaction-plugins)：统一的 Evented 事件系统、性能优化与 invalidateSize、海量标记聚合与插件生态。
