---
layout: doc
outline: [2, 3]
---

# 坐标轴与交互：scales / time adapter / interaction / tooltip / legend

> 基于 **Chart.js 4.5.x** · 核于 2026-07

## 速查

- **v3+ 形式**：`options.scales` 是**以轴 id 为键的对象**（v2 的 `xAxes` / `yAxes` 数组已废弃，v2→v3 最大破坏性变更）
- **轴 id 首字母推断方向**（x* / y* / r*），建议显式给 `axis` / `position`
- **双 y 轴**：scales 下自定义 id（如 `y1: { position: 'right' }`）+ dataset 用 `yAxisID: 'y1'` 关联（另有 `xAxisID` / `rAxisID`）
- **笛卡尔轴五类**：`category`（labels 索引，line/bar 默认索引轴）、`linear`（数值）、`logarithmic`（0 / 负数无法落在对数刻度）、`time`（真实时间距离）、`timeseries`（数据点等距）
- **径向轴**：`radialLinear`——radar / polarArea 的 `scales.r`
- **time 轴前置要求**：必须装 date 库 + 对应 adapter（`chartjs-adapter-date-fns` / `-luxon` / `-moment` / `-dayjs` 社区版）；v3 起 moment 不再捆绑
- **time 配置**：`time.unit / minUnit / displayFormats / tooltipFormat / round / isoWeekday`；`ticks.source: 'auto' | 'data' | 'labels'`
- **min/max**：硬边界，覆盖数据范围，**超出的数据被裁掉不显示**
- **suggestedMin/suggestedMax**：软建议，只参与自动范围计算，**数据超过时轴仍会扩展**
- **beginAtZero**：强制范围含 0；**grace**：`'5%'` 上下各留呼吸空间
- **ticks.callback(value, index, ticks)**：自定义刻度文案；category 轴收到的 value 是**索引**，取文案用 `this.getLabelForValue(value)`；返回 null/undefined 隐藏该刻度
- **ticks 其他**：`stepSize`（固定步长）、`count`（固定个数）、`precision`、`format`（Intl.NumberFormat 选项）、`autoSkip`（默认 true 自动抽稀）、`maxRotation`、`sampleSize`（只测量子集加速）
- **v4 grid/border 拆分**：`grid.drawBorder → border.display`、`grid.borderColor → border.color`、`grid.borderWidth → border.width`、`grid.borderDash → border.dash`
- **grid 剩余项**：`display / color / lineWidth / drawOnChartArea / drawTicks / offset / circular`；z 层级默认 -1（数据下方）
- **堆叠**：`x.stacked + y.stacked` 都 true = 堆叠柱；只设 `y.stacked` = 堆叠面积图；`'single'` 值正负堆同一栈
- **interaction 默认**：`mode: 'nearest'`、`intersect: true`；另有 `axis`（'x' / 'y' / 'xy' / 'r'）、`includeInvisible`
- **六种 mode**：`point`（相交的所有元素）、`nearest`（最近）、`index`（同索引所有 dataset，多系列对齐提示标配）、`dataset`（整个数据集）、`x` / `y`（仅按单坐标相交）
- **多系列 tooltip 标配**：`mode: 'index'` + `intersect: false`
- **继承链**：`options.interaction` 是 hover 与 tooltip 的共同基线；`options.hover` 与 `options.plugins.tooltip` 可分别覆盖
- **v3 变化**：折线默认交互从 v2 的 index 改为 nearest
- **events 默认**：`['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove']`，可裁剪；插件可用 `options.plugins.{id}.events` 单独定制
- **命中检测**：`chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true)` 返回 `[{ datasetIndex, index, element }]`
- **像素↔数值**：`Chart.helpers.getRelativePosition(e, chart)` + `chart.scales.x.getValueForPixel(pos.x)`
- **tooltip 命名空间**：`options.plugins.tooltip`（v3 起从 options 根移入 plugins）
- **tooltip 关键项**：`enabled` / `external` / `position: 'average' 或 'nearest'` / `backgroundColor`（默认 `rgba(0,0,0,0.8)`）/ `displayColors` / `filter` / `itemSort`；mode 与 intersect 默认继承 interaction
- **callbacks 全家桶**：`beforeTitle / title / afterTitle`、`beforeBody / afterBody`、`beforeLabel / label / labelColor / labelTextColor / labelPointStyle / afterLabel`、`beforeFooter / footer / afterFooter`
- **TooltipItem 属性**：`chart, label, parsed, raw, formattedValue, dataset, datasetIndex, dataIndex, element`
- **External HTML tooltip**：`enabled: false` + `external(context)`，从 `context.tooltip` 取 opacity（0 即隐藏）/ title / body / labelColors / caretX / caretY 自建 DOM
- **legend**：`display / position（top、left、bottom、right、chartArea）/ align / reverse / maxWidth`；`labels.usePointStyle`、`labels.generateLabels`（完全自定义）、`labels.filter / sort`
- **legend onClick 默认**：普通图表 toggle 整个 dataset（`chart.hide/show(datasetIndex)`）；**pie / doughnut / polarArea 是 toggle 单条数据**（`toggleDataVisibility(index)`，图例项来自 labels 而非 datasets）
- **legend 回调签名**：`onClick / onHover / onLeave` 统一 `(event, legendItem, legend)`；`legend.chart` 拿实例
- **title**：`display` 默认 false、`text` **数组即多行**、`position / align / font / fullSize / padding`；subtitle 选项与 title 完全一致，命名空间 `plugins.subtitle`

## 一、scales：对象键式与轴 id

**v3+ 的 `options.scales` 是以轴 id 为键的对象**——v2 的 `xAxes` / `yAxes` 数组写法已废弃，这是 v2→v3 最大的破坏性变更。轴 id 首字母推断方向（x* / y* / r*），建议显式给 `axis` / `position`：

```js
options: {
  scales: {
    x: { type: 'time', time: { unit: 'day' } },
    y: { position: 'left' },
    y1: { position: 'right', grid: { drawOnChartArea: false } }  // 双 y 轴：右轴不画网格避免重叠
  }
}
// dataset 关联到指定轴：{ yAxisID: 'y1' }；同理 xAxisID / rAxisID
```

## 二、轴类型速览

**笛卡尔轴 5 类**：

| 类型 | 用途与要点 |
| --- | --- |
| `category` | labels 索引轴，line / bar 的默认索引轴 |
| `linear` | 数值轴 |
| `logarithmic` | 跨数量级数据；0 / 负数在实数域无对数，无法落在对数刻度上 |
| `time` | 按**真实时间距离**排布（需 date adapter，见下节） |
| `timeseries` | 数据点**等距**排布——股票 K 线场景（周末无交易日不留空） |

**径向轴**：`radialLinear`——radar / polarArea 的 `scales.r`。radar 的 `angleLines`（角度线）、`pointLabels`（顶点标签）都配在这里。

## 三、time 轴与 date adapter（必踩的坑）

裸配 `type: 'time'` 直接报错：**`The time scale requires both a date library and a corresponding adapter`**——v3 起 moment 不再捆绑，必须额外装一个 date 适配器：

- `chartjs-adapter-date-fns` / `chartjs-adapter-luxon` / `chartjs-adapter-moment`（官方系）、`-dayjs`（社区版），装任一即可。

常用配置：`time.unit / minUnit / displayFormats / tooltipFormat / round / isoWeekday`；刻度来源 `ticks.source: 'auto' | 'data' | 'labels'`。

## 四、范围控制：min/max vs suggestedMin/suggestedMax

| 配置 | 语义 | 数据超出时 |
| --- | --- | --- |
| `min` / `max` | **硬边界**，覆盖数据算出的范围 | 超出的数据**被裁掉不显示** |
| `suggestedMin` / `suggestedMax` | **软建议**，只参与自动范围计算 | 轴**仍会扩展**容纳数据 |

- 「suggestedMax 怎么没生效」：数据超过建议值时轴自动扩展是**预期行为**；要硬顶就用 `max`（但会裁数据）。
- `beginAtZero: true` 强制范围含 0；`grace: '5%'` 在上下各留 5% 呼吸空间。
- 指定 `min` / `max` 还能免去全量扫描算范围，是性能手段之一（见[性能优化](./performance)）。

## 五、ticks 定制

`ticks.callback(value, index, ticks)` 自定义刻度文案：

```js
scales: {
  x: {
    ticks: {
      // category 轴回调收到的 value 是索引，取标签文案要用 getLabelForValue
      callback(value) {
        return this.getLabelForValue(value);
      }
      // 返回 null / undefined 可隐藏该刻度
    }
  }
}
```

其余常用项：`stepSize`（固定步长）、`count`（固定个数）、`precision`、`format`（直接给 Intl.NumberFormat 选项）、`autoSkip`（空间不足自动抽稀，默认 true）、`maxRotation`、`sampleSize`（只测量子集加速布局）。

## 六、grid 与 border（v4 拆分）

v4 把「轴线」从 grid 拆到独立的 `border` 命名空间，老配置全部迁移：

| v3 写法 | v4 写法 |
| --- | --- |
| `grid.drawBorder` | `border.display` |
| `grid.borderColor` | `border.color` |
| `grid.borderWidth` | `border.width` |
| `grid.borderDash` | `border.dash` |

grid 剩下 `display / color / lineWidth / drawOnChartArea / drawTicks / offset / circular`；z 层级默认 **-1**（画在数据下方）。

## 七、堆叠 stacked

```js
options: { scales: { x: { stacked: true }, y: { stacked: true } } } // 堆叠柱
```

- x、y 都 `stacked: true` → 堆叠柱状图。
- **只设 `y.stacked: true`** → 堆叠面积图。
- `stacked: 'single'` → 正负值堆进同一栈。
- dataset 的 `stack` 属性控制分组归属（见[数据结构](./data-and-options)）。

## 八、interaction：mode × intersect

`options.interaction` 控制「指针命中哪些元素」：`mode`（默认 `'nearest'`）、`intersect`（默认 `true`，须指针与图形相交才触发）、`axis`（距离计算方向 'x' / 'y' / 'xy' / 'r'）、`includeInvisible`。

**六种 mode**：

| mode | 行为 |
| --- | --- |
| `point` | 与指针相交的**所有**元素 |
| `nearest` | 距指针最近的元素（intersect:false 时不相交也取最近） |
| `index` | 同一索引的所有 dataset 元素——多系列对齐提示的标配 |
| `dataset` | 命中元素所在的整个 dataset |
| `x` / `y` | 仅按 x（或 y）坐标相交——做垂直 / 水平游标 |

```js
options: {
  interaction: { mode: 'index', intersect: false } // 多系列 tooltip 标配：折线不必精确压线
}
```

- **继承链**：`options.interaction` 是 hover 与 tooltip 的共同基线；`options.hover` 与 `options.plugins.tooltip` 可分别覆盖。
- v3 起折线默认交互从 v2 的 `index` 改为 `nearest`。
- `events` 默认 `['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove']`，可裁剪；插件可用 `options.plugins.{id}.events` 单独定制。

## 九、事件与命中检测

`onClick(event, activeElements, chart)` / `onHover`（同签名）配合命中检测 API：

```js
options: {
  onClick(e, activeElements, chart) {
    // 事件 → 命中元素数组：[{ datasetIndex, index, element }]
    const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
    if (points.length) {
      const { datasetIndex, index } = points[0];
      const value = chart.data.datasets[datasetIndex].data[index]; // 回查数据
    }
  }
}
```

像素 → 数值换算（如点击空白处取坐标值）：

```js
import { getRelativePosition } from 'chart.js/helpers';

const pos = getRelativePosition(e, chart);            // 事件的画布相对坐标
const xValue = chart.scales.x.getValueForPixel(pos.x); // 像素 → 轴数值
```

## 十、tooltip 定制

命名空间是 `options.plugins.tooltip`（v3 起从 options 根移入 plugins；v2 的 `options.tooltips` 复数写法失效）。关键项：`enabled`（canvas 内置提示，默认 true）、`external`（HTML tooltip 函数）、`position: 'average' 或 'nearest'`、`backgroundColor`（默认 `rgba(0,0,0,0.8)`）、`displayColors`、`filter`、`itemSort`；mode / intersect 默认**继承 interaction**。

### callbacks 全家桶

按渲染区域分组（返回 string / string[] / undefined）：

- 标题区：`beforeTitle / title / afterTitle`
- 主体区：`beforeBody / afterBody`（收 TooltipItem 数组）；`beforeLabel / label / labelColor / labelTextColor / labelPointStyle / afterLabel`（收单个 TooltipItem）
- 页脚区：`beforeFooter / footer / afterFooter`

TooltipItem 属性：`chart, label, parsed, raw, formattedValue, dataset, datasetIndex, dataIndex, element`。

```js
plugins: { tooltip: { callbacks: {
  label: (ctx) => {
    // ctx.parsed 是解析后的数值（区别于原始 ctx.raw）
    let label = ctx.dataset.label ? ctx.dataset.label + ': ' : '';
    return label + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(ctx.parsed.y);
  }
}}}
```

### External HTML tooltip

完全自定义样式的正路——关掉内置提示、用函数接管 DOM：

```js
plugins: {
  tooltip: {
    enabled: false,                 // 关掉 canvas 内置提示
    external(context) {
      const { tooltip } = context;
      if (tooltip.opacity === 0) {  // opacity 为 0 表示应隐藏
        return;                     // 隐藏自建的 tooltip DOM
      }
      // 从 tooltip.title / tooltip.body / tooltip.labelColors 取内容，
      // 用 tooltip.caretX / tooltip.caretY 定位自建 DOM
    }
  }
}
```

## 十一、legend / title / subtitle

- **legend**（`options.plugins.legend`）：`display / position（'top'、'left'、'bottom'、'right'、'chartArea'）/ align / reverse / maxWidth`；`labels.usePointStyle`（图例标记随点样式）、`labels.generateLabels`（完全自定义图例项，HTML legend 方案的核心）、`labels.filter / sort`。
- **onClick 默认行为的分野**（高频考点）：普通图表点图例 toggle **整个 dataset**（内部调 `chart.hide/show(datasetIndex)`）；**pie / doughnut / polarArea 覆盖为 toggle 单条数据**（`toggleDataVisibility(index)`）——因为这三类的图例项来自 **labels** 而非 datasets。
- 回调签名统一 `(event, legendItem, legend)`，`onClick / onHover / onLeave` 都是；`legend.chart` 可拿图表实例。
- **title**（`options.plugins.title`）：`display` 默认 **false**；`text` 给**数组即多行标题**；`position / align / font（{ weight: 'bold' }）/ fullSize / padding`。**subtitle** 与 title 选项完全一致，命名空间 `plugins.subtitle`。

下一页：[插件体系与自定义图表](./plugins-and-custom) —— inline vs 全局插件、生命周期钩子、Filler 面积填充、mixed 混合图与自定义 controller。
