---
layout: doc
outline: [2, 3]
---

# 性能与规模化：大数据、包体、SSR 与地图

> 基于 Apache ECharts 6.1 · 核于 2026-07

## 速查

- **包体第一刀 = 按需引入**：`echarts/core` + charts / components / renderers / features 分模块 `use`；全量 `import * as echarts from 'echarts'` 打包体积大；只用 SVG 就别引 CanvasRenderer。
- **漏注册报错定位**：`Component xxx not exists. Load it first`——三大隐性依赖：
  - tooltip `trigger: 'axis'` → 依赖 GridComponent；
  - dataset → DatasetComponent；transform → TransformComponent；
  - 渲染器（CanvasRenderer / SVGRenderer）必须注册其一。
- **large 模式**：`large: true` + `largeThreshold`（默认 2000，超过才启用）——bar / scatter 等启用绘制优化；
  - 代价：**单数据项样式 / 交互定制受限**（itemStyle 按 dataItem 定制不再生效，属预期）。
- **progressive 渐进渲染**（分帧绘制，不阻塞交互）：
  - `progressive`：每帧渲染块大小（line 默认 1e5、candlestick 3e3）；
  - `progressiveThreshold`：超过才启用（candlestick 1e4）；
  - `progressiveChunkMode`：`'sequential'` 顺序分块 / `'mod'` 取模分块——先出整体轮廓再填细节。
- **appendData 增量加载**：`chart.appendData({ seriesIndex, data })` 分片加载千万级数据、不清空已绘内容；
  - 限制（必考）：**仅支持 scatter、lines**（GL 版另有 scatterGL / linesGL / polygons3D）；**不支持 dataset 数据源**。
- **sampling 降采样**：line 系列 `sampling: 'lttb'`（推荐，保形）/ 'average' / 'min' / 'max' / 'minmax'(v5.5+) / 'sum'，数据点数远超像素宽度时开。
- **dataZoom 配合**：限定初始 `start` / `end` 窗口，减少首屏绘制量。
- **渲染层优化**：
  - init 时 `useDirtyRect: true`（v5.0 脏矩形局部重绘，图表局部频繁更新场景）；
  - 数据用 **TypedArray** + dataset dimensions 声明 `'float'` / `'int'`；
  - 大数据下 `animation: false` 关动画。
- **多实例治理**：
  - SPA 卸载必 `dispose()`；resize 监听必须 removeEventListener（否则实例与闭包泄漏，v6 还修过 tooltip 泄漏 #21087）；
  - 同页大量小图**优先 SVG 渲染器省内存**（移动端防崩溃）。
- **SSR（v5.3+，零外部依赖）**：
  - `echarts.init(null, null, { renderer: 'svg', ssr: true, width, height })` → `setOption` → `renderToSVGString()` 返回字符串；
  - 仅 SVG 模式；不再逐帧自动渲染；初始动画以 **CSS 动画内嵌**在 SVG 字符串中（无 JS 也有入场动画）；
  - **服务端务必 dispose**，否则内存堆积。
- **服务端出图片**：node-canvas 等 Node Canvas 实现，把 canvas 对象传给 `echarts.init(canvas)`（SVG 不适用的平台再选此路）。
- **SSR 水合两方案**：A——首屏 SVG + 懒加载完整 echarts 接管交互；B（v5.5+）——**约 4KB 轻量客户端运行时**，支持图例开关等基础交互 + 请求服务端重渲染，免下发几百 KB 全量库。
- **地图三件事**：
  - **v5 起 GeoJSON 不再内置于包**，`echarts.registerMap('china', geoJSON, specialAreas?)` 注册后才能用，否则地图不显示；也支持 `{ svg }` 注册 SVG 底图；
  - **geo 组件 vs map series（考点）**：map series 自带地图 + 数据填色（区域上色）；geo 是独立坐标系组件，供其他 series 挂载；
  - 散点上地图：`series: { type: 'scatter', coordinateSystem: 'geo', data: [[lng, lat, value]] }`（或 effectScatter 涟漪特效）。
- **小程序**：官方适配仓库 **echarts-for-weixin**（微信小程序组件封装）；跨平台差异核心在 DOM / Canvas 获取方式。
- **性能手段分层记忆**：包体（按需引入）→ 绘制模式（large / progressive）→ 数据量（sampling / appendData / dataZoom）→ 渲染层（useDirtyRect / TypedArray / animation off）→ 实例治理（dispose / SVG 多实例）。

## 一、按需引入与包体控制

包体优化的第一刀永远是按需引入（完整写法与 `ComposeOption` 类型见[入门](../getting-started)）：`echarts/core` 打底，图表、组件、渲染器、特性四类分模块 `use`。两个细节：

- 只用 SVG 渲染就不要引 `CanvasRenderer`，反之亦然——渲染器注册其一即可。
- **报错定位口诀**：`Component xxx not exists. Load it first` 出现时，回查三大隐性依赖——tooltip 的 `trigger: 'axis'` 依赖 GridComponent、dataset 依赖 DatasetComponent、transform 依赖 TransformComponent。

## 二、large 与 progressive：两种大数据绘制模式

| 机制 | 配置 | 默认值 | 行为 | 代价 |
| --- | --- | --- | --- | --- |
| large | `large: true` + `largeThreshold` | 阈值 2000 | bar / scatter 等超阈值启用绘制优化 | **单数据项样式 / 交互定制失效**（itemStyle 按 dataItem 定制不再生效，属预期） |
| progressive | `progressive` + `progressiveThreshold` + `progressiveChunkMode` | line 每帧 1e5；candlestick 每帧 3e3、阈值 1e4 | 分帧渐进渲染，不阻塞交互 | 完整画面需多帧 |

`progressiveChunkMode` 两种分块策略：`'sequential'` 顺序分块；`'mod'` 取模分块——先渲染出整体轮廓再逐帧填细节。

## 三、appendData：增量加载千万级数据

```js
// 分片请求、分片喂给图表，已绘制内容不清空
fetchChunk().then(chunk => {
  chart.appendData({ seriesIndex: 0, data: chunk });
});
```

两条硬限制（必考）：

1. **仅 scatter、lines 系列支持**（echarts-gl 另有 scatterGL / linesGL / polygons3D）。
2. **与 dataset 不兼容**——appendData 只能配 series.data 直填的数据。

## 四、sampling 降采样与渲染层优化

- **sampling**（line 系列）：数据点数远超像素宽度时，绘制前先降采样——`'lttb'`（推荐，最大化保留趋势形状）、`'average'`、`'min'`、`'max'`、`'minmax'`（v5.5+）、`'sum'`。
- **dataZoom 窗口**：初始 `start` / `end` 限定可视窗口，首屏只画一段。
- **useDirtyRect**（v5.0+，init opts）：脏矩形局部重绘，适合图表局部频繁更新的场景。
- **TypedArray + 维度类型**：数据用 TypedArray，dataset `dimensions` 声明 `'float'` / `'int'`，内存与解析双省。
- **animation: false**：大数据量下关动画，省一大块主线程时间。

## 五、多实例治理与内存泄漏

多图页面（大屏、仪表盘）三条纪律：

1. **SPA 组件卸载必 `dispose()`**：不销毁则实例、事件、DOM 引用全部滞留。
2. **resize 监听必解绑**：`window.addEventListener('resize', handler)` 卸载时 `removeEventListener`，否则 handler 闭包持有实例——泄漏成对出现（v6 之前 tooltip 也有泄漏案例，6.0 修复 #21087）。
3. **同页大量小图优先 SVG 渲染器**：内存占用更低，移动端多实例页面防崩溃。

Vue 里还有一条：实例存 shallowRef / 普通变量，别进响应式深层代理（详见[实例与 option](./instance-and-option)）。

## 六、SSR 全链路（v5.3+）

服务端渲染是 v5.3 的招牌能力，**零外部依赖**（不需要无头浏览器）：

```js
// 服务端：init 第一参传 null，开 ssr 模式（仅 SVG）
const chart = echarts.init(null, null, {
  renderer: 'svg', ssr: true, width: 600, height: 400
});
chart.setOption(option);
const svgStr = chart.renderToSVGString();  // 拿到 SVG 字符串，HTTP 响应直接返回
chart.dispose();                           // 服务端务必释放，否则内存堆积
```

- `ssr: true` 下不再逐帧自动渲染；**初始动画以 CSS 动画内嵌在 SVG 字符串中**——客户端无 JS 也有入场动画。
- 要出**图片**而非 SVG：用 node-canvas 等 Node Canvas 实现，把 canvas 对象传给 `echarts.init(canvas)`（SVG 不适用的平台再选此路）。

**客户端水合两方案**：

| 方案 | 机制 | 适用 |
| --- | --- | --- |
| A：懒加载全量接管 | 首屏展示服务端 SVG，空闲时加载完整 echarts 重新 init 接管交互 | 需要完整交互 |
| B：轻量运行时（v5.5+） | 客户端只挂**约 4KB** 的轻量运行时，支持图例开关等基础交互，复杂更新请求服务端重渲染 | 弱交互、极致首屏——免下发几百 KB 全量库 |

## 七、地图：registerMap、geo 与 map series

**v5 起地图数据（GeoJSON）不再内置于包**——不注册就不显示，这是地图第一坑：

```js
// 先注册地图数据（GeoJSON 需自行获取；也支持 { svg } 注册 SVG 底图）
echarts.registerMap('china', geoJSON /*, specialAreas? */);

// 用法一：map series —— 自带地图 + 数据填色（区域上色）
option = { series: { type: 'map', map: 'china', data: regionValues } };

// 用法二：geo 组件 —— 独立地理坐标系，供其他系列挂载
option = {
  geo: { map: 'china' },
  series: {
    type: 'scatter',              // 或 effectScatter（涟漪特效）
    coordinateSystem: 'geo',      // 散点挂到 geo 坐标系上
    data: [[116.4, 39.9, 100]]    // [经度, 纬度, 值]
  }
};
```

**geo 组件 vs map series（考点）**：map series 管「区域填色」；geo 是坐标系组件，管「让别的系列画到地图上」。

## 八、小程序与跨端

微信小程序用官方适配仓库 **echarts-for-weixin**（小程序组件封装）。跨平台适配的核心差异在 **DOM / Canvas 的获取方式**——小程序没有标准 DOM，需通过组件封装拿到 canvas 上下文再 init。

---

单机性能榨干后，v6 还带来一批新图表与新坐标能力：[v6 新特性](./v6-features)。
