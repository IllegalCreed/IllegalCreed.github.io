---
layout: doc
outline: [2, 3]
---

# 标记与编码：Mark 体系与视觉通道

> 基于 **AntV G2 v5.4**（npm latest 5.4.8）· 核于 2026-07

## 速查

- **官方定义**：「G2 中**没有图表的概念**，把标记（Mark）作为基本的视觉组成单元，任何一个图表都可以由一个或多个标记组合而成」
- **基础 mark ↔ 传统图表**：
  - `interval` 区间条 → 柱状图 / 条形图（+transpose）/ 饼图（+theta）/ 玫瑰图（+polar）
  - `line` 折线 → 折线图；+parallel 坐标 = 平行坐标系图
  - `point` 点 → 散点图、气泡图（size 编码）
  - `area` 面积 → 面积图、堆叠面积图
  - `cell` 单元格分割 → 热力日历图、分块热力图
  - `rect` 矩形 → 直方图（+binX）、矩形树图
- **标注类 mark**（v4 annotation 的替代）：`text` / `image` / `link` 两点连线 / `lineX` / `lineY` 辅助线 / `range` / `rangeX` / `rangeY` 区域块
- **统计与专业类**：`box` / `boxplot`（boxplot 自带聚合统计）/ `vector` 向量 / `shape` 自定义图形 / `heatmap` 密度热力 / `density` 核密度（小提琴图）
- **复合标记**（高级图表一句话绘制）：`wordCloud / gauge / liquid / sunburst / chord / sankey / treemap / pack / forceGraph`
- **mark 完整配置结构**：`{ type, data, encode, scale, transform, coordinate, style, viewStyle, animate, state, labels, title, axis, legend, tooltip, slider, scrollbar, theme, interaction }`——每个 mark 自带一整套语法要素
- **多 mark 叠加**：一个 view 的 `children` 数组放多个 mark（如 line + point = 带点折线图）
- **自定义复合标记**：写一个返回 spec（或 spec 数组）的函数即可当新 type 使用
- **Encode 定义**：「编码是把数据和视觉通道绑定，决定标记**哪些**通道需要被可视化」
- **通道全表**：
  - 位置：`x` / `y` / `z` / `x1` / `y1`（终点，甘特图 / 瀑布图用）/ `position`（平行坐标）
  - 颜色与透明度：`color` / `opacity`
  - 形状与大小：`shape` / `size`
  - 系列拆分：`series`（空间上区分系列）
  - 动画通道：`key`（数据↔图形关联）/ `groupKey` / `enterType` / `enterDuration` / `enterDelay` / `enterEasing` 及 update* / exit* 系列
- **编码值四种形式**：字段（字符串按列名解析）/ 常量（数据无此列时）/ 回调（返回「抽象数据」再走 scale）/ column（直接给数组）
- **显式消歧**：`{ type: 'field' | 'constant' | 'transform' | 'column', value: ... }`
- **数组通道**：`y: ['end', 'start']` 等价于 `y: 'end', y1: 'start'`（瀑布图 / 甘特图 / 区间面积）
- **color 分类 vs 连续**：离散值→分类色板 + 分类图例；连续数值→sequential 渐变 + 连续图例（由 scale 推断）
- **series 自动复制**：未显式声明 series 时，G2 把 `color` 值自动复制给 series；画渐变单线须 `series: () => undefined` 禁用
- **传递性**：view 层 encode 传给 children，子 mark 已定义的通道不被覆盖
- **函数式写法**：`.encode('x', 'name')` 逐通道，或 `.encode({ x, y })` 一次传对象
- **encode 最小集**：`{ x: 字段, y: 字段 }`；color 加绑一个字段即自动分色 + 生成图例
- **动画通道同样走 scale**：`enterDuration` 等可绑字段并配比例尺（详见[复合、交互与动画](./composition-interaction-animation)）
- **v4 → v5 语义差**：v5 编码回调返回「抽象数据」（再经 scale 映射），v4 直接返回视觉值——迁移最隐蔽的坑
- **头号坑**：encode 字段名拼错**静默失败**——数据列中不存在的字符串被当**常量**处理，不报错、不生成图例

## 一、G2 没有「图表类型」，只有标记

传统库里「柱状图」「饼图」是互不相通的顶层类型；G2 里它们只是**标记（Mark）在不同语法组合下的呈现**。官方原文：「G2 中没有图表的概念，把标记（Mark）作为基本的视觉组成单元，任何一个图表都可以由一个或多个标记组合而成」。

这带来两个直接后果：

1. **学习对象从「N 种图表」收敛为「一张 mark 清单 + 几个组合维度」**——记住 interval / line / point / area 等十几个标记，再理解 transform / coordinate 怎么改变它们，就覆盖了绝大多数统计图表。
2. **mark 是「一等公民」**：每个 mark 自带完整的配置结构（见下），可以独立设置数据、编码、比例尺甚至坐标系，多个 mark 能像图层一样叠加。

## 二、Mark 全览表

| mark type | 含义 | 对应传统图表 |
| --- | --- | --- |
| `interval` | 区间条 | **柱状图 / 条形图（+transpose）/ 饼图（+theta）/ 玫瑰图（+polar）** |
| `line` | 折线 | 折线图；+parallel 坐标 = 平行坐标系图 |
| `point` | 点 | 散点图、气泡图（size 编码） |
| `area` | 面积 | 面积图、堆叠面积图 |
| `cell` | 单元格分割 | 热力日历图、分块热力图 |
| `rect` | 矩形 | 直方图（+binX）、矩形树图 |
| `text` | 文本 | 数据标注 |
| `image` | 图片 | 图片标注 |
| `link` | 两点连线 | 区间连线、关系标注 |
| `lineX` / `lineY` | 垂直 / 水平辅助线 | 均值线、参考线（v4 annotation 的替代） |
| `range` / `rangeX` / `rangeY` | 区域块 | 区间高亮标注 |
| `box` / `boxplot` | 箱形 | 箱线图（boxplot 自带聚合统计） |
| `vector` | 向量箭头 | 向量场 |
| `shape` | 自定义图形 | 任意定制 |
| `heatmap` | 密度热力 | 热力图 |
| `density` | 核密度 | 小提琴图 |
| `wordCloud` / `gauge` / `liquid` / `sunburst` / `chord` / `sankey` / `treemap` / `pack` / `forceGraph` | 复合标记 | 词云 / 仪表盘 / 水波 / 旭日 / 弦图 / 桑基 / 矩形树 / 打包 / 力导向 |

注意 `interval` 一行：**同一个标记，换坐标系就是另一张「图表」**——这是 G2 语法威力的缩影，机制展开见[转换与坐标系](./transform-and-coordinate)。

## 三、mark 的完整配置结构与多标记叠加

每个 mark 都自带一整套语法要素，不依赖全局配置：

```js
// mark 的完整配置结构（每一项都可省略）
{
  type: 'interval',
  data: [],          // v5 里每个 mark 可绑定独立数据（v4 一个 view 一份数据）
  encode: {},        // 编码：数据列 ↔ 视觉通道
  scale: {},         // 每个通道的比例尺
  transform: [],     // 标记转换（堆叠、分组、分箱……）
  coordinate: {},    // 坐标系（会「冒泡」到所在 view）
  style: {},         // 图形样式
  viewStyle: {},     // 所在视图区域样式
  animate: {},       // 动画
  state: {},         // 交互状态样式（selected / active……）
  labels: [],        // 数据标签（可挂多个）
  title: '',         // 标题
  axis: {}, legend: {}, tooltip: {},   // 组件
  slider: {}, scrollbar: {},           // 缩略轴 / 滚动条
  theme: {}, interaction: {},          // 主题 / 交互
}
```

**多 mark 叠加**用 view 的 `children` 数组，像图层一样组合：

```js
// line + point 叠加 = 带数据点的折线图
chart.options({
  type: 'view',
  data: [
    { year: '2021', value: 30 },
    { year: '2022', value: 80 },
    { year: '2023', value: 45 },
  ],
  children: [
    { type: 'line', encode: { x: 'year', y: 'value' } },  // 折线层
    { type: 'point', encode: { x: 'year', y: 'value' } }, // 数据点层
  ],
});
```

view 的 `data` / `encode` / `transform` 会**传递**给 children：子 mark 没有声明的配置继承自父 view，已声明的不被覆盖。所以上例也可以把 data 和 encode 都提到 view 层，children 里只写 `{ type: 'line' }` 和 `{ type: 'point' }`。

## 四、复合标记：高级图表一句话绘制

v5 把桑基、矩形树、词云等「高级图表」内置为**复合标记**——它们内部就是「若干基础 mark + transform」的封装，多数场景不再需要上层封装库：

```js
// 桑基图：一个复合标记搞定
chart.options({
  type: 'sankey',
  data: { type: 'fetch', value: 'https://assets.antv.antgroup.com/g2/energy.json' },
});
```

复合标记还**支持自定义**：写一个返回 spec（或 spec 数组）的函数，就能当作新 type 使用（官方给过 Pie 封装、PointLineArea 组合两个示例）：

```js
// 自定义复合标记：把「面积 + 折线 + 点」封装成一个可复用的 type
function PointLineArea({ data, encode = {} }) {
  return [
    { type: 'area', data, encode, style: { fillOpacity: 0.1 } }, // 面积衬底
    { type: 'line', data, encode },                              // 折线
    { type: 'point', data, encode },                             // 数据点
  ];
}

chart.options({
  type: PointLineArea, // 函数直接当 type 用
  data: [{ year: '2021', value: 30 }, { year: '2022', value: 80 }],
  encode: { x: 'year', y: 'value' },
});
```

更底层的定制是**自定义 shape**：`register('shape.interval.triangle', ...)` 注册后经 `encode: { shape: 'triangle' }` 使用，属专家级话题（见[参考](../reference)）。

## 五、Encode：数据列 ↔ 视觉通道

官方定义：「编码是把数据和视觉通道绑定，决定标记**哪些**通道需要被可视化」。注意分工——encode 管「哪些通道被可视化」，**「如何可视化」是 scale 的事**（见[比例尺与组件](./scales-and-components)）。

通道全表：

| 类别 | 通道 | 说明 |
| --- | --- | --- |
| 位置 | `x` / `y` / `z` | 基本位置 |
| 位置 | `x1` / `y1` | 区间终点（甘特图、瀑布图） |
| 位置 | `position` | 平行坐标专用 |
| 颜色 | `color` / `opacity` | 颜色、透明度 |
| 形状大小 | `shape` / `size` | 形状、大小（气泡图靠 size） |
| 系列 | `series` | 空间上区分系列 |
| 动画 | `key` / `groupKey` | 数据↔图形关联，更新动画的对应依据 |
| 动画 | `enterType` / `enterDuration` / `enterDelay` / `enterEasing` 及 update* / exit* | 动画属性即编码通道（见[复合、交互与动画](./composition-interaction-animation)） |

最小可用编码是 `{ x: 字段, y: 字段 }`；**color 加绑一个字段即自动分色 + 生成图例**——离散字段走分类色板 + 分类图例，连续数值走 sequential 渐变 + 连续图例（ribbon），这个「离散 / 连续」判断由 scale 类型推断完成。

## 六、编码值的四种形式

```js
// ① 字段（field）：字符串按数据列名解析
encode: { x: 'name' }

// ② 常量（constant）：数据中不存在该列时按常量处理，不生成图例
encode: { color: 'steelblue' }

// ③ 回调（transform）：返回的是「抽象数据」，仍要经过 scale 映射——不是直接视觉值
encode: { color: (d) => (d.value > 100 ? '高' : '低') }

// ④ column：直接给数组（大数据 / 程序生成的数据）
encode: { x: { type: 'column', value: [0, 1, 2] } }
```

也可以显式写 `{ type: 'field' | 'constant' | 'transform' | 'column', value: ... }` **消歧**。两个必须知道的坑都出在「字符串有歧义」上：

- **字段名拼错静默失败**：字符串在数据列中不存在时会被当**常量**处理——不报错、不生成图例，图形异常但无任何告警。排查图形不对时，第一步先核对字段名。
- **color 常量撞上同名列**：`encode: { color: 'red' }` 本想给常量色，若数据恰好有 `red` 这一列就会被当字段。稳妥写法：`encode: { color: { type: 'constant', value: 'red' } }`。

另外注意 ③ 的语义（v5 与 v4 的隐蔽差异）：**v5 编码回调返回的是「抽象数据」，还要再经 scale 映射**；v4 的回调直接返回视觉值。迁移 v4 代码时这是最容易踩的语义变化。

## 七、数组通道与系列拆分

**数组通道**是区间类图形的标准写法：

```js
// y 数组 = 同时绑定 y 与 y1（区间的两端）——瀑布图 / 甘特图 / 区间面积图
encode: { x: 'task', y: ['end', 'start'] }
// 等价于
encode: { x: 'task', y: 'end', y1: 'start' }
```

**series 通道**负责在空间上区分系列。G2 有个默认行为：未显式声明 series 时，会把 `color` 通道的值**自动复制**给 series——多数时候这正是你要的（按颜色分组自然也按系列分组）。但有一个反例：

```js
// 想画「单条渐变色折线」：color 绑连续字段做渐变
chart.options({
  type: 'line',
  data,
  encode: {
    x: 'date',
    y: 'value',
    color: 'value',              // 连续字段 → 渐变色
    series: () => undefined,     // 必须禁用 series 复制，否则被拆成多条系列线
  },
});
```

最后是**传递性**：view 层的 encode 会传给 children，子 mark 已定义的通道不被覆盖——多 mark 叠加时把公共通道提到 view 层是惯用手法。

## 八、易错点

- **字段名拼错 → 静默当常量**：无报错、无图例、图形异常；先查字段名再查别处。
- **常量色写显式 constant**：防数据恰有同名列。
- **渐变单线忘了禁 series**：color 绑连续字段画单线时须 `series: () => undefined`。
- **v4 迁移**：编码回调 v5 返回抽象数据（再经 scale），v4 返回视觉值；v4 时间字符串自动解析，v5 需显式 `new Date`。

---

Mark 决定「画什么」、Encode 决定「数据进哪个通道」，但柱状图变饼图、堆叠与分组这些「变形」，靠的是另外两员：[转换与坐标系](./transform-and-coordinate)。
