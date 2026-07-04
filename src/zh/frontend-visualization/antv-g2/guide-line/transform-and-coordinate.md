---
layout: doc
outline: [2, 3]
---

# 转换与坐标系：饼图、条形、玫瑰的本质

> 基于 **AntV G2 v5.4**（npm latest 5.4.8）· 核于 2026-07

## 速查

- **mark transform 定义**：「标记转换是一个函数，能够**筛选、修改、聚合以及生成**新的通道值」，在**绘制阶段**作用于通道（区别于 data.transform 的数据预处理）
- **按用途三类**：
  - 防重叠 / 布局：`stackY`（堆叠）、`dodgeX`（分组错位）、`jitter / jitterX / jitterY`（散点抖动）、`symmetryY`（对称，河流图）、`diffY`（差值）、`pack`（紧密排布）、`sample`（大数据采样）、`flexX`（变宽柱）
  - 聚合 / 统计：`bin / binX`（分箱→直方图）、`group / groupX / groupY / groupColor`（分组聚合 mean / max / min / count / sum 等）、`normalizeY`（归一化→百分比图）
  - 筛选 / 排序：`select / selectX / selectY`（按 selector 选极值做标注）、`sortX / sortY / sortColor`（排序）、`stackEnter`（对 enter 动画通道堆叠→交错入场）
- **数组顺序即执行顺序**：`[binX, stackY]` 先分箱再堆叠，顺序错则结果错
- **经典组合速记**：堆叠柱 `[{ type: 'stackY' }]`；分组柱 `[{ type: 'dodgeX' }]`；百分比堆叠柱 `[{ type: 'stackY' }, { type: 'normalizeY' }]`；直方图 rect + `[{ type: 'binX', y: 'count' }]`；均值线 lineY + `[{ type: 'groupX', y: 'mean' }]`；峰值标注 text + `[{ type: 'selectY', groupBy: 'color', selector: 'max' }]`
- **bin vs group**：bin 对**连续**数据分箱（直方图），group 对**离散**数据分组聚合（分类均值）
- **参考线 / 标注**：均值线、区间高亮等 v4 annotation 的活由 `lineX` / `lineY` / `rangeY` 等标注型 mark + transform 承接
- **配置层级**：mark 或 view 层均可；view 层传递给无 transform 的子 mark（data / transform 同具传递性）
- **data 三形式**：内联数组 / `{ type: 'inline', value }` / `{ type: 'fetch', value: url }`（json / csv，format 可指定）
- **data.transform 全表**：`filter / map / sort / sortBy / pick / rename / fold`（宽表转长表）`/ join / slice / kde / ema / log`（调试打印）`/ custom`（接第三方如 d3-regression）
- **log 调试**：data.transform 的 `log` 打印当前数据，排查变换链路必备
- **custom 接第三方**：如接 d3-regression 在数据层算回归线再绘制
- **两种 transform 分工**：data.transform 在数据加载阶段处理**原始行**；mark transform 在绘制阶段处理**通道值**（stackY 改的是 y / y1 通道而非原数据）
- **v5 数据自由度**：每个 mark 可绑定独立数据（v4 一个 view 一份）；多源数据默认同步比例尺——双轴图 / 图层叠加的根基
- **coordinate 机制**：位置属性 x / y 先经比例尺映射到 [0, 1]，**坐标系再把标准化位置转换为画布坐标**
- **坐标系全表**：`cartesian`（默认直角）、`polar`（角度 + 半径）、`theta`（**半径固定、只映射角度**的特殊极坐标）、`radial`（极坐标转置扩展）、`helix`（螺旋）、`parallel`（平行坐标）、`radar`（polar + parallel 混合）、`fisheye`（鱼眼放大）、`cartesian3D`
- **同一个 interval 的四次变身**（高频理解题）：
  - cartesian → 柱状图
  - `coordinate: { transform: [{ type: 'transpose' }] }` → **条形图**
  - `coordinate: { type: 'polar' }` → **玫瑰图**（半径比较大小）
  - `coordinate: { type: 'theta' }` + `transform: [{ type: 'stackY' }]` → **饼图**（弧度比较大小；x 通道留空；innerRadius 配出环图）
  - `coordinate: { type: 'radial' }` → 玉珏图
- **饼图口诀**：「theta 定形，stackY 定角」——忘配 stackY 则扇区全部从 0 起画互相覆盖
- **玫瑰 vs 饼一句话**：玫瑰 = polar，用**半径**比较大小；饼 = theta，用**弧度**比较大小
- **坐标系变换写法**：`coordinate: { transform: [{ type: 'transpose' }, { type: 'fisheye', focusX: 0.1 }] }`；属性平铺（`outerRadius: 0.8, innerRadius: 0.1` 直接写在 coordinate 对象上）
- **层级规则**：「每一个视图只能拥有一个坐标系」；mark 级 coordinate 会「冒泡」与 view 合并，**第一个声明的优先**；子 mark 继承父 view 坐标系
- **混用坐标系**：同画布极坐标 + 直角坐标必须 `spaceLayer` 分层（第二个 coordinate 声明不生效）

## 一、mark transform：绘制前对通道值的加工

官方定义：「标记转换是一个函数，能够**筛选、修改、聚合以及生成**新的通道值」。关键词是**通道值**——它发生在绘制阶段，加工的是 encode 之后的通道数据，而不是原始数据表。比如 `stackY` 改写的是每根柱子的 `y` / `y1` 通道（起点与终点），原始数据一行都没动。

按用途分三类记：

| 类别 | transform | 用途 |
| --- | --- | --- |
| 防重叠 / 布局 | `stackY` | 堆叠（堆叠柱 / 堆叠面积 / 饼图定角） |
| | `dodgeX` | 分组错位（分组柱） |
| | `jitter / jitterX / jitterY` | 散点抖动防重叠 |
| | `symmetryY` | 对称布局（河流图） |
| | `diffY` | 差值展示 |
| | `pack` | 紧密排布 |
| | `sample` | 大数据采样 |
| | `flexX` | 变宽柱 |
| 聚合 / 统计 | `bin / binX` | 连续数据分箱（直方图） |
| | `group / groupX / groupY / groupColor` | 分组聚合：mean / max / min / count / sum 等 |
| | `normalizeY` | 归一化（百分比图） |
| 筛选 / 排序 | `select / selectX / selectY` | 按 selector 选极值（峰值标注） |
| | `sortX / sortY / sortColor` | 排序 |
| | `stackEnter` | 对 enter 动画通道堆叠（交错入场） |

`bin` 与 `group` 的区别：**bin 对连续数据分箱，group 对离散数据分组**——直方图用 binX，分类均值用 groupX。

## 二、顺序敏感与经典组合

transform 是数组，**数组顺序就是执行顺序**：

```js
// 堆叠直方图：先 binX 分箱，再 stackY 堆叠——顺序颠倒结果就错了
transform: [
  { type: 'binX', y: 'count' }, // ① 连续值分箱，y 通道变成每箱计数
  { type: 'stackY' },           // ② 同箱内按 color 堆叠
]
```

高频组合背下来：

```js
// 堆叠柱状图
transform: [{ type: 'stackY' }]

// 分组柱状图
transform: [{ type: 'dodgeX' }]

// 百分比堆叠柱：先堆叠再归一化（normalizeY 放前面结果错误）
transform: [{ type: 'stackY' }, { type: 'normalizeY' }]

// 直方图：rect 标记 + binX
{ type: 'rect', transform: [{ type: 'binX', y: 'count' }] }

// 均值参考线：lineY 标记 + groupX 聚合
{ type: 'lineY', transform: [{ type: 'groupX', y: 'mean' }] }

// 每组峰值标注：text 标记 + selectY 选极值
{ type: 'text', transform: [{ type: 'selectY', groupBy: 'color', selector: 'max' }] }
```

transform 可配在 mark 层或 view 层：view 层的 transform 会**传递**给没有自己 transform 的子 mark。

## 三、data 与 data.transform：数据层预处理

数据声明有三种形式（内联数组是语法糖）：

```js
data: [{ genre: 'Sports', sold: 275 }]                 // ① 内联数组（语法糖）
data: { type: 'inline', value: [...] }                  // ② 标准写法
data: { type: 'fetch', value: 'https://.../data.json' } // ③ 远程拉取，支持 json / csv（format 可指定）
```

数据连接器上还能挂 **data.transform**——在数据加载阶段对**原始表**做预处理：

```js
data: {
  type: 'fetch',
  value: url,
  transform: [
    { type: 'filter', callback: (d) => d.sex === 'male' }, // 行过滤
    { type: 'sortBy', fields: ['sold'] },                  // 按字段排序
  ],
}
```

全表：`filter / map / sort / sortBy / pick / rename / fold`（宽表转长表）`/ join / slice / kde / ema / log`（调试打印当前数据）`/ custom`（接第三方库，如 d3-regression 算回归线）。

**与 mark transform 的分工**是考点：

| | data.transform | mark transform |
| --- | --- | --- |
| 阶段 | 数据加载 | 绘制 |
| 对象 | 原始数据行 | encode 后的**通道值** |
| 典型 | filter / fold / join / custom | stackY / binX / normalizeY |

v5 还有一个数据模型升级：**每个 mark 可绑定独立数据**（v4 一个 view 只有一份数据），多源数据默认同步比例尺——这是双轴图与图层叠加的根基（见[复合、交互与动画](./composition-interaction-animation)）。

## 四、Coordinate：标准化位置 → 画布坐标

坐标系的机制（官方表述）：「位置属性 x / y 先经比例尺映射到 [0, 1]，**坐标系再把标准化位置转换为画布坐标**」。也就是说 mark 输出的是抽象的标准化位置，**长成直角还是圆形，由坐标系决定**——这正是「同一个 mark 变出多种图表」的原理。

| type | 含义 | 典型产物 |
| --- | --- | --- |
| `cartesian` | 直角坐标（默认） | 柱状 / 折线 / 散点 |
| `polar` | 极坐标（角度 + 半径都参与映射） | 玫瑰图、雷达底座 |
| `theta` | **特殊极坐标：半径固定、只映射角度** | 饼图 / 环图 |
| `radial` | 极坐标的转置扩展 | 玉珏图 |
| `helix` | 螺旋坐标 | 螺旋图 |
| `parallel` | 平行坐标 | 平行坐标系图 |
| `radar` | polar + parallel 混合 | 雷达图 |
| `fisheye` | 鱼眼放大 | 焦点探索 |
| `cartesian3D` | 三维直角 | 3D 图表 |

坐标系自身还支持**变换数组**与**属性平铺**：

```js
coordinate: {
  type: 'polar',
  outerRadius: 0.8,   // 属性直接平铺在 coordinate 对象上
  innerRadius: 0.1,
  transform: [{ type: 'transpose' }, { type: 'fisheye', focusX: 0.1 }], // 坐标系变换
}
```

## 五、一个 interval 的四次变身（饼图的本质）

同一个 interval 标记，坐标系一换就是另一张「图表」——这是 G2 最高频的理解题：

```js
// ① 什么都不配：直角坐标 → 柱状图
{ type: 'interval', encode: { x: 'genre', y: 'sold' } }

// ② transpose 转置 → 条形图（柱转条）
{
  type: 'interval',
  encode: { x: 'genre', y: 'sold' },
  coordinate: { transform: [{ type: 'transpose' }] },
}

// ③ polar 极坐标 → 玫瑰图（用「半径」比较大小）
{
  type: 'interval',
  encode: { x: 'genre', y: 'sold', color: 'genre' },
  coordinate: { type: 'polar' },
}

// ④ theta + stackY → 饼图（用「弧度」比较大小）
{
  type: 'interval',
  data: [
    { item: '事例一', count: 40 },
    { item: '事例二', count: 21 },
    { item: '事例三', count: 17 },
  ],
  encode: { y: 'count', color: 'item' },  // 注意：x 通道留空
  transform: [{ type: 'stackY' }],        // stackY 定角：堆出各扇区的起止角度
  coordinate: { type: 'theta' },          // theta 定形：半径固定、只映射角度
  // coordinate: { type: 'theta', innerRadius: 0.6 } → 环图
}

// ⑤ radial → 玉珏图
{ type: 'interval', encode: { x: 'genre', y: 'sold' }, coordinate: { type: 'radial' } }
```

饼图这一组里两个点最容易错：

- **口诀「theta 定形，stackY 定角」**——只配 theta 不配 stackY，所有扇区都从 0 角度起画、互相覆盖，看起来只剩最大的一块。
- **玫瑰图 vs 饼图**：玫瑰图是 polar（弧度均分、**半径**比较大小），饼图是 theta（半径固定、**弧度**比较大小）——一句话答清两者区分。

## 六、坐标系层级规则

- **「每一个视图只能拥有一个坐标系」**——坐标系是 view 级资源。
- mark 级声明的 coordinate 会**「冒泡」**到所在 view 并合并，**第一个声明的优先**；后声明的不生效。
- 子 mark **继承**父 view 的坐标系。
- 推论：想在同一画布上混用极坐标 + 直角坐标（如「柱图 + 饼图」组合），必须用 `spaceLayer` 把它们放进**不同的视图**分层叠放——这正是视图复合的用武之地（见[复合、交互与动画](./composition-interaction-animation)）。

## 七、易错点

- **饼图忘 stackY**：扇区全从 0 起画互相覆盖；「theta 定形，stackY 定角」。
- **transform 顺序敏感**：`normalizeY` 必须放 `stackY` 之后；`binX` 与 `stackY` 同理。
- **一 view 一坐标系**：第二个 coordinate 声明静默不生效（第一个优先），混用须 spaceLayer 分层。
- **data.transform 与 mark transform 用混**：想改原始表（过滤 / 宽转长）用 data.transform；想做绘制期统计（堆叠 / 分箱 / 归一化）用 mark transform。

---

transform 与 coordinate 解决了「形」，下一页看「度」：[比例尺与组件](./scales-and-components)——数据到视觉的映射规则，以及 axis / legend / tooltip / label 四大组件。
