---
layout: doc
outline: [2, 3]
---

# dataset 与系列：数据流与常用图表配置

> 基于 Apache ECharts 6.1 · 核于 2026-07

## 速查

- **dataset 动机（v4+ 推荐数据流，必考）**：数据与样式配置分离，一份数据多 series 复用。
- **source 三种格式**：二维数组（首行可为维度名）/ 对象数组 `[{ product: 'A', 2015: 43 }]` / 按列键值对象 `{ product: [...], count: [...] }`。
- **dimensions**：显式声明维度名与类型——`'number'` / `'ordinal'` / `'time'` / `'float'` / `'int'`（float / int 配 TypedArray 优化性能）。
- **encode**：维度 → 视觉通道，如 `{ x: 'product', y: 'sales', tooltip: [1, 2], itemName: 0, value: 1 }`；坐标系不同通道不同（直角 x/y、极坐标 radius/angle、饼图 itemName/value）。
- **默认映射规则**：未写 encode 时，有类目轴则第一列/行给类目轴，其余各列/行依次成为各 series 的值。
- **seriesLayoutBy**：`'column'`（默认，series 取列）或 `'row'`（series 取行）。
- **多 dataset**：`series.datasetIndex`（或 datasetId）指定取哪个数据源。
- **dataset 支持的系列**：line、bar、pie、scatter、effectScatter、parallel、candlestick、map、funnel、custom；**appendData 与 dataset 不兼容**。
- **transform（v5+）**：声明在第二个及之后的 dataset 上，`outData = f(inputData)`：
  - filter：`{ dimension: 'Year', '=': 2011 }`，运算符 `> >= < <= = != reg`（文档亦作 gt/gte/lt/lte/eq/ne），支持 and / or / not 复合与 `parser: 'time' / 'trim' / 'number'`；
  - sort：多维度排序，`incomparable: 'min' / 'max'` 处理空值；
  - 链式：上一个 transform 的结果是下一个的输入；`fromDatasetIndex` / `fromDatasetId` 指定输入源，多输出用 `fromTransformResult` 取第 n 个结果；
  - 外部 transform：`echarts.registerTransform` 注册；官方生态 **ecStat**（echarts-stat）提供回归 / 聚类 / 直方图 / 箱线图；
  - 调试：transform 里加 `print: true` 控制台打印结果。
- **line**：`smooth` 平滑、`areaStyle: {}` 面积图、`stack: '组名'` 堆叠（**同 stack 名才叠**）、`step` 阶梯、`connectNulls`、`showSymbol`、`sampling` 降采样（`'lttb'` 推荐保形，另有 average / min / max / minmax(v5.5+) / sum）。
- **bar**：`stack` 堆叠 + v6 `stackOrder`（'seriesAsc' / 'seriesDesc' 反转堆叠序）与 `stackStrategy`；`barWidth` / `barMaxWidth` / `barGap`；大数据 `large: true` + `largeThreshold`（默认 2000）。
- **pie**：`radius: ['40%', '70%']` 环形图、`roseType: 'radius' / 'area'` 南丁格尔玫瑰、`avoidLabelOverlap`、`minAngle`；data 是 `{ name, value }` 数组（不需要坐标轴），占比模板变量 `{d}`。
- **scatter**：`symbolSize` 传函数做气泡图（如按第三维缩放）；v6 蜂群 / 抖动散点是**轴上的 `jitter`** 配置（详见 [v6 新特性](./v6-features)）。
- **candlestick（K 线）**：data 每项 **`[open, close, lowest, highest]`**——不是 OHLC 顺序，高频记反；阳线 `itemStyle.color`、阴线 `itemStyle.color0`；大数据配 `progressive`。
- **radar**：不用 xAxis / yAxis，配套独立顶层 `radar: { indicator: [{ name, max }] }` 组件，data 为每个目标一组值。
- **heatmap**：直角坐标（需配 visualMap）、calendar 坐标、geo 上均可画。
- **层次数据三兄弟**：`tree`（树图）/ `treemap`（矩形树图，支持 drill-down）/ `sunburst`（旭日图）。
- **graph（关系图）**：`layout: 'force' / 'circular' / 'none'`，data(nodes) + links；v6 可配 thumbnail 缩略图辅助漫游导航。
- **chord（v6 新增）**：和弦图，`data: [{ name }]` + `links: [{ source, target, value }]`（links 亦名 edges），支持出入节点渐变色作边色。
- **gauge** 仪表盘、**funnel** 漏斗。
- **custom 自定义系列**：`renderItem(params, api)` 返回图形元素描述；v6 `registerCustomSeries` 可注册复用，官方仓库提供小提琴图等 6 种现成（npm 可装）。

## 一、dataset：数据与配置分离

传统写法把数据塞进每个 `series.data`；dataset 则把数据集中声明一次，多个 series 引用——数据与样式配置解耦，是 v4+ 推荐的数据流。

`source` 支持三种格式：

```js
// ① 二维数组：首行可以是维度名
dataset: {
  source: [
    ['product', '2015', '2016'],
    ['Matcha Latte', 43.3, 85.8],
    ['Milk Tea', 83.1, 73.4]
  ]
}
// ② 对象数组
dataset: { source: [{ product: 'Matcha Latte', 2015: 43.3, 2016: 85.8 }] }
// ③ 按列的键值对象
dataset: { source: { product: ['Matcha Latte', 'Milk Tea'], count: [43.3, 83.1] } }
```

`dimensions` 可显式声明维度名与类型（`'number'` / `'ordinal'` / `'time'` / `'float'` / `'int'`）；其中 float / int 配合 TypedArray 是大数据性能优化手段。

最经典的「自动映射」例子——不写 encode，两个 bar series 自动按列映射出两年的系列：

```js
option = {
  dataset: {
    source: [
      ['product', '2015', '2016'],
      ['Matcha Latte', 43.3, 85.8],
      ['Milk Tea', 83.1, 73.4]
    ]
  },
  xAxis: { type: 'category' },   // 有类目轴：第一列自动给类目轴
  yAxis: {},
  series: [{ type: 'bar' }, { type: 'bar' }]  // 其余各列依次成为各 series 的值
};
```

**默认映射规则**：未写 encode 时，有类目轴则第一列（或行）给类目轴，其余各列（行）依次成为各 series 的值。

## 二、encode：维度 → 视觉通道

`encode` 把 dataset 的维度显式映射到视觉通道，不同坐标系通道不同（直角系 x / y，极坐标 radius / angle，饼图 itemName / value）：

```js
series: {
  type: 'scatter',
  encode: {
    x: 'product',      // x 轴用 product 维度（可用维度名或下标）
    y: 'sales',        // y 轴用 sales 维度
    tooltip: [1, 2],   // tooltip 显示第 1、2 维
    itemName: 0,       // 数据项名取第 0 维
    value: 1
  }
}
```

配套两个开关：

- **seriesLayoutBy**：`'column'`（默认）series 按列取数，`'row'` 按行取数。
- **多 dataset**：`dataset` 给数组，series 用 `datasetIndex`（或 datasetId）指定取哪份。

## 三、transform：声明式数据变换（v5+）

transform 声明在第二个及之后的 dataset 上，语义是 `outData = f(inputData)`——原始数据不动，派生出过滤 / 排序后的新数据集：

```js
option = {
  dataset: [
    { source: rawData },                                                    // 0：原始数据
    { transform: { type: 'filter', config: { dimension: 'Year', '=': 2011 } } },  // 1：过滤出 2011 年
    { transform: { type: 'sort', config: { dimension: 'score', order: 'desc' } } } // 2：按分数降序
  ],
  series: { type: 'bar', datasetIndex: 1 }   // 用过滤后的那份
};
```

- **filter** 条件运算符：`> >= < <= = != reg`（文档亦写作 gt / gte / lt / lte / eq / ne），支持 `and / or / not` 复合条件与 `parser: 'time' | 'trim' | 'number'` 预处理。
- **sort** 支持多维度排序，`incomparable: 'min' | 'max'` 决定空值排哪头。
- **链式**：上一个 transform 的结果是下一个的输入；`fromDatasetIndex` / `fromDatasetId` 指定输入源；多输出 transform 用 `fromTransformResult` 取第 n 个结果。
- **外部 transform**：`echarts.registerTransform(...)` 注册；官方生态 **echarts-stat（ecStat）** 提供 `ecStat:regression`（回归）、`clustering`（聚类）、`histogram`（直方图）、`boxplot`（箱线图）。
- **调试**：transform 里加 `print: true`，控制台打印变换结果。

## 四、line 与 bar：最常用的两兄弟

```js
// 折线：平滑 + 面积 + 堆叠
series: [
  { type: 'line', smooth: true, areaStyle: {}, stack: 'total', data: a },
  { type: 'line', smooth: true, areaStyle: {}, stack: 'total', data: b }  // 同 stack 名才堆叠
]
```

- **line**：`smooth` 平滑曲线；`areaStyle: {}` 变面积图；`stack: '组名'` 堆叠（**同名才叠**）；`step` 阶梯线；`connectNulls` 连接空值断点；`showSymbol` 控制拐点标记；数据点远超像素宽度时开 `sampling: 'lttb'` 降采样（可选 `'lttb'`（推荐，保形）、`'average'`、`'min'`、`'max'`、`'minmax'`（v5.5+）、`'sum'`）。
- **bar**：`stack` 同折线；v6 新增 `stackOrder: 'seriesAsc' | 'seriesDesc'`（反转堆叠顺序）与 `stackStrategy`；宽度用 `barWidth` / `barMaxWidth`，同类目多柱间距 `barGap`；大数据开 `large: true`，`largeThreshold`（默认 2000）超过才启用优化——代价是单点样式定制失效（详见[性能与规模化](./performance-and-scale)）。

## 五、pie 与 scatter

- **pie**：data 是 `{ name, value }` 数组，不需要坐标轴。`radius: ['40%', '70%']` 内外半径成环形图；`roseType: 'radius' | 'area'` 南丁格尔玫瑰图；`avoidLabelOverlap` 防标签重叠、`minAngle` 保证小扇区可见；label 的占比模板变量是 `{d}`（百分比）。
- **scatter**：`symbolSize` 传函数即气泡图，如 `symbolSize: (val) => val[2] * k` 按第三维缩放。v6 的蜂群图 / 抖动散点通过**坐标轴上的 `jitter`** 实现（配置在非数据维度那条轴上，`jitterOverlap: false` 避让成蜂群、`true` 允许重叠性能更高），详见 [v6 新特性](./v6-features)。

## 六、candlestick 与 radar

- **candlestick（K 线）**：data 每项是 **`[open, close, lowest, highest]`**——注意不是 OHLC 的 `[open, high, low, close]`，这是高频记反点。阳线颜色 `itemStyle.color`、阴线 `itemStyle.color0`；大数据量配 `progressive` 渐进渲染。v6 金融增强：markPoint / markLine / markArea 支持 `relativeTo` 相对坐标系或角落定位与 z / z2 层级，官方新增分时图、MACD、盘口、深度图等示例组合。
- **radar（雷达图）**：不用 xAxis / yAxis，配套独立的顶层 `radar` 组件声明各维度指标，data 为每个目标一组值：

```js
option = {
  radar: { indicator: [{ name: '进攻', max: 100 }, { name: '防守', max: 100 }] },
  series: [{ type: 'radar', data: [{ name: '球员A', value: [88, 72] }] }]
};
```

## 七、其他系列速览

| 系列 | 说明 |
| --- | --- |
| heatmap | 热力图，可画在直角坐标（需 visualMap 配色）、calendar 坐标、geo 地图上 |
| tree / treemap / sunburst | 层次数据三兄弟：树图 / 矩形树图（drill-down）/ 旭日图 |
| graph | 关系图，`layout` 取 force（力导）/ circular（环形）/ none（给定坐标）；v6 可配 thumbnail 缩略图辅助漫游 |
| chord | **v6 新增**和弦图：`data`（节点）+ `links`（亦名 edges，`{ source, target, value }`），支持出入节点渐变色作边色，金融交易 / 社交关系场景 |
| gauge / funnel | 仪表盘 / 漏斗图 |
| map / geo | 地图与地理坐标系，见[性能与规模化](./performance-and-scale)的地图一节 |
| custom | 自定义系列：`renderItem(params, api)` 返回图形元素描述；v6 `echarts.registerCustomSeries(seriesType, renderItem)` 可把自定义系列注册成像内置图表一样用，官方仓库 apache/echarts-custom-series 提供小提琴图、轮廓图、睡眠阶段图、分段环形图、范围柱状图、范围折线图 6 种（npm 可装） |

---

数据进了图，下一步是让图「能交互、会说话」：[交互与视觉](./interaction-and-visual)。
