---
layout: doc
outline: [2, 3]
---

# 比例尺与组件：Scale、坐标轴、图例、提示与标签

> 基于 **AntV G2 v5.4**（npm latest 5.4.8）· 核于 2026-07

## 速查

- **Scale 定义**（官方）：「比例尺是将抽象数据映射为视觉数据的桥梁」；**每个通道各绑定一个比例尺**——encode 管「哪些通道可视化」，scale 管「如何可视化」
- **三大家族 + 颜色专用**：
  - 连续：`linear`（默认数值）、`log`（跨数量级）、`pow` / `sqrt`（压缩差异，面积 / 大小映射）、`time`（时间轴）
  - 分类：`ordinal`（颜色 / 形状一对一）、`band`（等宽区间 + 间距，柱状图 x 轴）、`point`（band 的 bandWidth=0 特例，折线 / 点图 x 轴）
  - 离散化：`quantize`（等宽分段）、`quantile`（等频分段）、`threshold`（自定义阈值），多用于颜色分段
  - 颜色专用：`sequential`（连续色板插值）
- **类型自动推断**（优先级从高到低）：显式 `scale.type` > domain 含字符串 / 布尔→分类、含 Date→time > 数据值判断同理；分类时定量通道（x / y / position / size）→ `point`，其余→ `ordinal`；连续时颜色通道无 range → `sequential`，否则 `linear`
- **band vs point**：band 给每个类别分配带间距的等宽区间（柱有宽度）；point 只给点位（折线拐点）——interval 的 x 默认推成 band，line / point 默认推成 point
- **常用配置**：`domain`（定义域）/ `range`（值域）/ `nice`（刻度取整）/ `padding` / `paddingInner` / `paddingOuter`（band 间距）/ `tickCount` / `tickMethod` / `round` / `interpolate` / `unknown` / `compare`（分类排序）
- **写法**：`scale: { y: { type: 'log', domain: [10, 100], nice: true }, x: { padding: 0.5 } }`；函数式 `.scale('y', {...})`
- **v5 vs v4**：scale 绑**通道**不绑字段（v4 的 `chart.scale('field', {...})` 已废）；v4 的 `values` 对应 v5 的 `domain`
- **比例尺同步**：同一 view 下多 mark 同名通道**默认同步**；`scale: { y: { independent: true } }` 声明独立；或 scale `key` 相同者一组同步——双轴图核心
- **Axis**：`axis: { x: { title, labelFormatter, tickCount, grid, line, tick, position } }`
  - `labelFormatter` 双形态：d3-format 字符串（`'.2f'`、`'.1%'`、`'~s'`）或回调函数
  - 标签防重叠四件套：`labelAutoEllipsis`（缩略）/ `labelAutoRotate`（旋转，optionalAngles）/ `labelAutoWrap`（换行）/ `labelAutoHide`（抽稀，keepHeader / keepTail）
  - 隐藏：`axis: false`（全部）、`axis: { y: false }`（单轴）
- **Legend**：由**非空间通道**（color / opacity / size / shape）的 scale 自动生成；离散→分类图例（可分页 nav、defaultSelect 默认选中），连续→色带 ribbon 图例（handle 滑窗）
  - 配置：`legend: { color: { position: 'top'（默认）, layout: { justifyContent: 'center' }, maxRows, itemMarker, labelFormatter } }`
  - 隐藏：`legend: false` / `legend: { color: false }`
- **Tooltip 两层配置**（高频考点）：
  - mark 级 `tooltip` 管**数据内容**：`{ title, items: [{ channel / field, valueFormatter, name, color }] }`
  - view 级 `interaction.tooltip` 管**渲染行为**：`shared`（同 x 合并）、`crosshairs`（十字线）、`marker`、`filter`、`render`（完全自定义）
  - 关闭：`tooltip: false`（内容层）/ `interaction: { tooltip: false }`（交互层）；运行时 `chart.emit('tooltip:disable')`
- **Label**：`labels: [...]` 数组，**一个 mark 可挂多个标签**；单条配置 `{ text, position（inside / top / outside / spider / surround / area）, style, formatter, selector, connector, background }`
  - label transform 防重叠：`overlapDodgeY`（Y 向错开）、`overlapHide`（重叠隐藏）、`contrastReverse`（对比度不足反色）、`overflowHide`（超出图形隐藏）、`overflowStroke`、`exceedAdjust`（超出视图回调整）
  - view 级统一配置：`chart.labelTransform({ type: 'overlapHide' })`
  - 饼图外部标签用 `position: 'spider'`（蜘蛛布局 + 引导线），玫瑰图用 `surround`
- **双轴第二轴**：`axis: { y: { position: 'right' } }` + scale `independent: true`（完整配方见复合页）
- **隐藏组件统一模式**：`axis: false` / `legend: { color: false }` / `tooltip: false` / `animate: false`
- **Slider / Scrollbar**：`slider: { x: {...} }` 缩略轴、`scrollbar: { x: {...} }` 滚动条，常配 `sliderFilter` / `scrollbarFilter` 交互
- **坑**：d3-format 字符串不是模板字符串；双轴量纲差异大忘配 `independent: true` 小量纲折线被压成直线

## 一、Scale：「哪些通道」之后的「如何可视化」

encode 决定了哪些数据列进入哪些视觉通道，但「sold = 275 该画多高」「'Sports' 该是什么颜色」由**比例尺**决定。官方定义：「比例尺是将抽象数据映射为视觉数据的桥梁」，并且**每个通道各绑定一个比例尺**——x 有 x 的比例尺，color 有 color 的比例尺。

三大家族 + 颜色专用：

| 家族 | 类型 | 适用 |
| --- | --- | --- |
| 连续 | `linear` | 数值默认 |
| | `log` | 跨数量级数据 |
| | `pow` / `sqrt` | 压缩差异（面积 / 大小映射常用 sqrt） |
| | `time` | 时间轴 |
| 分类 | `ordinal` | 颜色 / 形状等一对一映射 |
| | `band` | 等宽区间 + 间距（柱状图 x 轴） |
| | `point` | band 的 bandWidth=0 特例（折线 / 点图 x 轴） |
| 离散化 | `quantize` | 等宽分段（连续值切色阶） |
| | `quantile` | 等频分段 |
| | `threshold` | 自定义阈值分段 |
| 颜色专用 | `sequential` | 连续色板插值（渐变） |

配置写在 `scale` 对象里，键是**通道名**（v5 与 v4 的关键差异：v4 绑字段，v5 绑通道）：

```js
chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold' },
  scale: {
    y: { type: 'log', domain: [10, 1000], nice: true }, // y 通道：对数轴 + 指定定义域 + 刻度取整
    x: { padding: 0.5 },                                // x 通道：band 间距
  },
});
```

常用配置项：`domain`（定义域）、`range`（值域）、`nice`（刻度取整优化）、`padding` / `paddingInner` / `paddingOuter`（band 间距）、`tickCount` / `tickMethod`、`round`、`interpolate`、`unknown`、`compare`（分类排序）。

## 二、类型自动推断与 band / point

多数时候不用写 `scale.type`，G2 按规则推断（优先级从高到低）：

1. 显式声明的 `scale.type` 最优先；
2. `domain` 里含字符串 / 布尔 → 分类家族；含 `Date` → `time`；
3. 未配 domain 则按数据值同理判断；
4. 推成分类时再细分：**定量通道（x / y / position / size）→ `point`，其余通道 → `ordinal`**；
5. 推成连续时：**颜色通道且无 range → `sequential`**，否则 `linear`。

其中 **band 与 point 的区别**值得单独记：band 给每个类别分配**带间距的等宽区间**（所以柱子有宽度），point 只给**点位**（折线只要拐点坐标）——interval 的分类 x 默认推成 band，line / point 的分类 x 默认推成 point。这也解释了 color 通道「离散字段自动分类色板、连续数值自动渐变」的行为：类型推断选了 ordinal 还是 sequential。

## 三、比例尺同步与独立（双轴图根基）

同一 view 下多个 mark 的**同名通道默认同步比例尺**——两条折线共用一个 y 轴量纲，这通常是对的。但双轴图两侧量纲差异大时必须打破同步：

```js
scale: { y: { independent: true } } // 该 mark 的 y 比例尺独立，不与其它 mark 同步
```

也可以用 `key` 精细分组：scale 配置里 `key` 相同的通道同步为一组。**忘配 independent 是双轴图最经典的翻车**：小量纲那条折线被大量纲挤压成一条贴地直线。完整双轴图写法见[复合、交互与动画](./composition-interaction-animation)。

## 四、Axis 坐标轴

```js
axis: {
  x: { title: '类别', labelAutoRotate: true },        // 标签自动旋转防重叠
  y: { labelFormatter: '.0%', tickCount: 5, grid: true }, // d3-format 字符串 + 刻度数 + 网格线
}
```

- 配置项：`title` / `labelFormatter` / `tickCount` / `grid` / `line` / `tick` / `position` 等。
- **`labelFormatter` 双形态**：d3-format 字符串（`',.0f'`、`'.1%'`、`'~s'`）或回调函数——注意 `'.0%'` 这类是 **d3-format 语法**，不是模板字符串。
- **标签防重叠四件套**：`labelAutoEllipsis`（缩略）、`labelAutoRotate`（旋转，可配 optionalAngles）、`labelAutoWrap`（换行）、`labelAutoHide`（抽稀，可配 keepHeader / keepTail 保首尾）。
- 隐藏：`axis: false` 关全部，`axis: { y: false }` 关单轴。

## 五、Legend 图例

图例**不用手动创建**：由**非空间通道**（color / opacity / size / shape）的比例尺自动生成——这正是「encode 加个 color 就有图例」的原因。两种形态：

- **分类图例**（离散 scale）：条目式，可分页（nav）、可配默认选中（defaultSelect）；
- **连续图例**（连续 scale）：色带 ribbon，带 handle 滑窗筛选。

```js
legend: {
  color: {
    position: 'top',                        // top（默认）/ bottom / left / right
    layout: { justifyContent: 'center' },   // 布局对齐
    maxRows: 2,                             // 分类图例最大行数
    labelFormatter: (d) => `${d} 类`,       // 条目文案格式化
  },
}
```

隐藏：`legend: false` 或 `legend: { color: false }`。

## 六、Tooltip 的两层配置

Tooltip 是 G2 组件里最容易配错的，因为它**分两层**——这是高频考点：

```js
chart.options({
  type: 'interval',
  data,
  encode: { x: 'genre', y: 'sold' },

  // ① mark 级 tooltip：管「数据内容」——标题与条目
  tooltip: {
    title: 'genre', // 字段名 / 回调 / { field, valueFormatter }
    items: [
      { channel: 'y', valueFormatter: '.0%' },      // 按通道取值 + d3-format
      { field: 'sold', name: '销量', color: 'red' }, // 按字段取值 + 自定义名称与色点
    ],
  },

  // ② view 级 interaction.tooltip：管「渲染行为」
  interaction: {
    tooltip: {
      shared: true,      // 同 x 的多条数据合并进一个提示框
      crosshairs: true,  // 十字辅助线
      // render: (event, { title, items }) => `<div>自定义 HTML</div>`, // 完全自定义渲染
    },
  },
});
```

记忆口径：**内容找 mark 的 `tooltip`，行为找 `interaction.tooltip`**。关闭同样分两层：`tooltip: false` 关内容层、`interaction: { tooltip: false }` 关交互层；运行时还可 `chart.emit('tooltip:disable')` / `chart.emit('tooltip:hide')` 程序化控制。

## 七、Label 数据标签

标签配置是 `labels` **数组**——一个 mark 可以挂多个标签：

```js
labels: [
  { text: 'sold', position: 'inside' },  // 第一个标签：柱内显示数值
  {
    text: 'genre',
    position: 'top',
    transform: [{ type: 'overlapDodgeY' }], // 标签防重叠：Y 向错开
  },
]
```

- 单条配置：`text`（字段或回调）、`position`（`inside` / `top` / `outside` / `spider` 饼图蜘蛛布局 / `surround` 玫瑰环绕 / `area`）、`style`、`formatter`、`selector`（`first` / `last` / 回调，只给部分数据挂标签）、`connector`（引导线）、`background`。
- **label transform 防重叠**：`overlapDodgeY`（Y 向错开）、`overlapHide`（重叠则隐藏）、`contrastReverse`（与图形对比度不足时反色）、`overflowHide`（超出图形隐藏）、`overflowStroke`、`exceedAdjust`（超出视图自动回调）。
- view 级统一配置：`chart.labelTransform({ type: 'overlapHide' })`。

饼图标签是重灾区：外部标签用 `position: 'spider'`（蜘蛛布局 + 引导线），密集小扇区配 `overlapDodgeY` / `overlapHide` 兜底。

## 八、Slider 与 Scrollbar

大数据量下的两个视窗组件，按通道配置：

```js
slider: { x: {} }     // x 轴缩略轴（大时间序列拖选范围）
scrollbar: { x: {} }  // x 轴滚动条
```

它们常与 `sliderFilter` / `scrollbarFilter` 交互配套（默认已接好），实现拖动筛选数据窗口。

## 九、易错点

- **d3-format 不是模板字符串**：`labelFormatter: '.0%'`、`valueFormatter: '~s'` 是 d3-format 语法。
- **双轴忘 independent**：量纲差异大的第二 y 轴必须 `independent: true`（或独立 key），否则小量纲曲线贴地。
- **tooltip 配错层**：改标题条目去 mark `tooltip`，改合并 / 十字线 / 自定义渲染去 `interaction.tooltip`。
- **图例不见了**：color 编码被当成常量（数据无此列）时不生成图例——回查字段名。

---

单张图的语法到此完整。下一页把镜头拉远：[复合、交互与动画](./composition-interaction-animation)——多视图组合成报表、交互联动与动画叙事。
