---
layout: doc
outline: [2, 3]
---

# v6 新特性全景与升级要点

> 基于 Apache ECharts 6.1 · 核于 2026-07

## 速查

- **版本节点**：v6.0.0 于 2025-07-30 发布，npm 当前最新 `echarts@6.1.0`；升级命令 `npm install echarts@6`。
- **新默认主题**：基于设计令牌（design token）重构的现代默认外观；
  - 回退 v5 观感：`import 'echarts/theme/v5.js'` 后 `init(dom, 'v5')`；
  - 或只回退调色盘：`#5470c6 #91cc75 #fac858 #ee6666 #73c0de #3ba272 #fc8452 #9a60b4 #ea7ccc`；
  - v5 的 light 主题迁移为 `echarts/theme/rainbow.js`。
- **动态主题切换（必考）**：`chart.setTheme(nameOrObj)`——不销毁实例、无二次初始化动画；
  - 限制：setTheme 后多次 merge 型 setOption 不受支持，后续 setOption 配 `notMerge: true`。
- **深色联动**：matchMedia 监听 `prefers-color-scheme` 变化 → setTheme（配 `option.darkMode`）。
- **和弦图 chord**：`type: 'chord'`，`data: [{ name }]` + `links: [{ source, target, value }]`（links 亦名 edges），支持出入节点渐变色作边色；金融交易 / 社交关系流量场景。
- **蜂群 / 抖动散点（轴级 jitter，配在非数据维度那条轴上）**：
  - `jitter: 30`——非零即开启随机偏移；
  - `jitterOverlap: false` 避让不重叠（**蜂群图**）/ `true` 允许重叠（抖动散点，性能更高）；
  - 另有 `jitterMargin`；挂在轴上的设计让 series 无感。
- **断轴 breaks**：轴上 `breaks: [{ start, end }]` 截断跳变区间（撕纸效果）；
  - 配 action `expandAxisBreak` / `collapseAxisBreak`（用 xAxisIndex + breaks 的 start / end 定位）点击展开真实比例。
- **矩阵坐标系 matrix**：顶层 `matrix` + series / 组件设 `coordinateSystem: 'matrix'` 与 `matrixIndex`——把图表与组件**表格化编排**（协方差矩阵、元素周期表类布局）。
- **轴标签防溢出 / 防重叠默认开启**：axisLabel / axisName 位置可能与 v5 有细微差异；
  - 关闭：`grid: { outerBoundsMode: 'none' }`、轴 `nameMoveOverlap: false`；
  - `grid.containLabel` 现等价于 `{ outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' }`。
- **registerCustomSeries**：`echarts.registerCustomSeries(seriesType, renderItem)` 把自定义系列注册成像内置图表一样用；
  - 官方仓库 apache/echarts-custom-series 提供 6 种现成：小提琴图 / 轮廓图 / 睡眠阶段图 / 分段环形图 / 范围柱状图 / 范围折线图（npm 可装）。
- **thumbnail 缩略图组件**：graph / geo 漫游时的导航小地图。
- **金融增强**：markPoint / markLine / markArea 支持 `relativeTo`（相对坐标系 / 角落定位）与 z / z2 层级；
  - 官方新增分时图、MACD、盘口、深度图等示例组合。
- **其他新能力**：bar `stackOrder` / `stackStrategy` 堆叠序控制、sankey 漫游、visualMap `unboundedRange` 开区间、legend `triggerEvent`、tooltip `displayTransition`。
- **breaking：rich 继承**：rich 各样式默认**继承**外层 label 的 fontStyle / fontWeight / fontSize / fontFamily / textShadow；旧行为设 `richInheritPlainLabel: false`。
- **breaking：center 基准**：geo / map / graph / tree 的 center 百分比基准修正；旧行为设 `legacyViewCoordSysCenterBase: true`。
- **升级「视觉跑偏」四查**：主题变 → v5 主题文件；布局微移 → outerBoundsMode / nameMoveOverlap；富文本字体变 → richInheritPlainLabel；地图 / 关系图中心偏 → legacyViewCoordSysCenterBase。
- **v6 修复**：tooltip 内存泄漏（#21087）。

## 一、v6 新特性全景表

| 类别 | 特性 | 关键 API / 配置 |
| --- | --- | --- |
| 主题 | 新默认主题（设计令牌重构） | 回退 v5：`echarts/theme/v5.js` + init 'v5' |
| 主题 | 动态主题切换 | `chart.setTheme(nameOrObj)`，不销毁实例 |
| 主题 | 深色模式联动 | matchMedia('prefers-color-scheme') + setTheme |
| 新图 | 和弦图 chord | `type: 'chord'`，data + links |
| 新图 | 蜂群图 / 抖动散点 | **轴上** `jitter` + `jitterOverlap: false`（蜂群）/ `true`（抖动） |
| 坐标 | 断轴 | 轴 `breaks: [{start, end}]` + expand / collapseAxisBreak action |
| 坐标 | 矩阵坐标系 matrix | 顶层 `matrix` + `coordinateSystem: 'matrix'` + matrixIndex，表格化编排 |
| 坐标 | 轴标签防溢出 / 防重叠默认开 | 关闭：`grid.outerBoundsMode: 'none'`、轴 `nameMoveOverlap: false` |
| 扩展 | 自定义系列可注册复用 | `registerCustomSeries(type, renderItem)`；官方 6 种现成 |
| 组件 | thumbnail 缩略图 | graph / geo 漫游导航小地图 |
| 金融 | K 线体系增强 | marker `relativeTo` / z / z2；分时、MACD、深度图示例 |
| 其他 | 堆叠反转、sankey 漫游、visualMap `unboundedRange`、legend `triggerEvent`、tooltip `displayTransition` | — |

## 二、主题体系：新默认主题与 setTheme

v6 用设计令牌（design token）重构了默认主题，开箱观感现代化——同时这也是升级后「图变样了」的第一来源。三条路线：

```js
// ① 接受新默认主题：什么都不用做

// ② 回退 v5 观感：引入官方提供的 v5 兼容主题
import 'echarts/theme/v5.js';
const chart = echarts.init(dom, 'v5');
// v5 的 light 主题则迁移为 echarts/theme/rainbow.js

// ③ 只回退调色盘：自定义 v5 的九色
option.color = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
                '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
```

**setTheme 动态切换**（必考新特性）：`chart.setTheme('dark')` 或传主题对象——不销毁实例、无二次初始化动画，主题切换从「dispose + 重 init」的体力活变成一行调用。**限制**：setTheme 后多次 merge 模式的 setOption 不受支持，官方建议后续 setOption 用 `notMerge: true`。

配合系统深色模式：

```js
const media = window.matchMedia('(prefers-color-scheme: dark)');
media.addEventListener('change', e => chart.setTheme(e.matches ? 'dark' : 'default'));
```

## 三、新图表：chord 与蜂群 / 抖动散点

**chord 和弦图**——展现关系网络中的流量 / 权重（金融交易、社交关系）：

```js
series: {
  type: 'chord',
  data: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],       // 节点
  links: [{ source: 'A', target: 'B', value: 10 }]           // 边（亦名 edges）
  // 支持出入节点渐变色作为边颜色
}
```

**轴级 jitter（蜂群 / 抖动散点）**——设计要点是配置挂在**坐标轴**而非 series：在**非数据维度那条轴**的方向上散开重叠点，series 无感：

```js
yAxis: {
  type: 'category',
  jitter: 30,             // 非零即开启随机偏移
  jitterOverlap: false,   // false = 避让不重叠（蜂群图）；true = 允许重叠（抖动散点，性能更高）
  jitterMargin: 2
}
```

## 四、坐标能力：断轴与 matrix 坐标系

**断轴 breaks**——数据里有巨大跳变（如个别异常大值）时截断轴区间，视觉呈「撕纸」效果，还能点击展开看真实比例：

```js
xAxis: {
  breaks: [{ start: 1000, end: 50000 }]   // 截断 1000 ~ 50000 区间
}
// 交互：用 action 展开 / 折叠断轴
chart.dispatchAction({ type: 'expandAxisBreak', xAxisIndex: 0, breaks: [{ start: 1000, end: 50000 }] });
chart.dispatchAction({ type: 'collapseAxisBreak', xAxisIndex: 0, breaks: [{ start: 1000, end: 50000 }] });
```

**matrix 矩阵坐标系**——顶层 `matrix` 组件 + series / 组件声明 `coordinateSystem: 'matrix'` 与 `matrixIndex`，把多个图表与组件**表格化编排**在行列网格里；协方差矩阵、元素周期表式布局的正解（类型层面通过 ComponentOnMatrixOptionMixin 提供 matrixIndex）。

## 五、扩展与组件：registerCustomSeries、thumbnail、金融增强

- **registerCustomSeries**：v5 的 custom series 只能在单个 option 里写 `renderItem`；v6 的 `echarts.registerCustomSeries(seriesType, renderItem)` 把它注册成**可复用的系列类型**，像内置图表一样 `type: 'xxx'` 使用。官方仓库 apache/echarts-custom-series 已提供 6 种（小提琴图、轮廓图、睡眠阶段图、分段环形图、范围柱状图、范围折线图），npm 可装。
- **thumbnail 缩略图组件**：graph / geo 大图漫游时的导航小地图，一眼看到当前视口在全图的位置。
- **金融增强**：markPoint / markLine / markArea 支持 `relativeTo` 相对坐标系 / 角落定位与 z / z2 层级控制；官方新增分时图、MACD、盘口、深度图等示例组合，K 线场景配套成熟。

## 六、v5 → v6 breaking changes 与回退开关

升级后「图不一样了」按这张表定点回退：

| 变化 | 影响 | 回退开关 |
| --- | --- | --- |
| 新默认主题 | 整体配色 / 观感变化 | `echarts/theme/v5.js` + init 'v5'；或自配 v5 调色盘 |
| light 主题移除 | 原 light 观感 | 迁移为 `echarts/theme/rainbow.js` |
| 轴防溢出 / 防重叠默认开 | axisLabel / axisName 位置微移 | `grid: { outerBoundsMode: 'none' }`；轴 `nameMoveOverlap: false` |
| containLabel 语义 | 布局行为 | v6 中等价于 `{ outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' }` |
| rich 继承 plain label | 富文本字号 / 字重变化 | `richInheritPlainLabel: false`（顶层或具体 label） |
| geo / map / graph / tree center 百分比基准修正 | 视图中心偏移 | `legacyViewCoordSysCenterBase: true` |

## 七、升级实操

1. `npm install echarts@6` 升级依赖。
2. 跑一遍核心页面，对照上表排查「视觉跑偏」：先看主题（整体配色变 → v5 主题回退），再看布局（标签 / 轴名微移 → outerBoundsMode / nameMoveOverlap），最后看富文本与地图类 center。
3. 有主题切换需求的代码，从「dispose + 重 init」迁移到 `setTheme`，并把 setTheme 之后的 setOption 改为 `notMerge: true`。
4. 想尝鲜新能力：chord / 轴级 jitter / breaks / matrix / registerCustomSeries 按需接入（见上文各节）。

---

所有配置项与 API 的速查表在[参考](../reference)。
