---
layout: doc
outline: [2, 3]
---

# 形状生成器与层级布局：d3-shape 与 d3-hierarchy

> 基于 D3.js v7.9（d3-shape / d3-hierarchy）· 核于 2026-07

## 速查

- **shape 心智模型**：生成器把数据算成 `path` 的 **d 字符串**（或 `.context(ctx)` 直接画 Canvas）——**只算数，不画图**。
- **line**：`d3.line().x(d => x(d.date)).y(d => y(d.close))`；`line(data)` 返回 d 字符串（默认访问器取 `d[0]` / `d[1]`）
  - `defined(d => !isNaN(d.close))`：假值处**断线**（缺失数据留缺口，必考）
  - `curve(d3.curveXxx)` 插值；`digits(3)` 控制输出精度；path 要 `fill: none` + stroke
- **area**：拓线（x1, y1）+ 基线（x0, y0）围成闭合区域；`.x(f)` 同设 x0 = f、x1 = null（x1 为 null 时复用 x0）
  - **y0 默认 0 = SVG 顶部，忘设 y0 面积图倒挂（坑）**——通常 `y0(y(0))`
  - `area.lineY1()` / `area.lineY0()` 提取顶线/基线为 line 生成器（描边用）
- **arc**：`innerRadius / outerRadius / startAngle / endAngle`
  - **角度约定（必考）**：弧度制；**0 在 12 点钟方向（-y）**；**顺时针为正**（与 Math 极坐标不同！）；夹角 ≥ 2π 画整圆环
  - innerRadius 大于 0 即甜甜圈；`cornerRadius()` 圆角；`padAngle()` + `padRadius()` 扇区间隙（建议只用于环形）
  - **`centroid(d)`** 返回弧中线中点放标签（角度、半径各取中值，非几何质心）
- **pie**：**不画图，只做数据变换（必考）**——值数组 → 带角度对象数组（data / value / index / startAngle / endAngle / padAngle）
  - **返回数组顺序 = 输入顺序，排序只影响角度分配**；默认 `sortValues(d3.descending)` 值降序排扇区；`sort(null)` 保持输入序
  - `startAngle / endAngle / padAngle` 可配；与 arc 配合：`join("path").attr("d", arc)`
- **stack**：宽/长表 → 堆叠序列（每点 `[y0, y1]`，附 .data；序列有 .key / .index）——同样只算数
  - 宽表用默认 `d[key]` 取值；长表先 `d3.index(data, d => d.date, d => d.fruit)` 再配访问器
  - **order**：None（默认按 keys）/ Ascending / Descending / InsideOut（配 streamgraph）/ Reverse / Appearance
  - **offset**：None（零基线）/ **Expand**（归一化 = 百分比堆叠）/ **Diverging**（正上负下）/ Silhouette（中心对称）/ **Wiggle**（streamgraph 标配，官方推荐配 InsideOut）
- **curve 家族（必考「过不过数据点」）**：
  - 过点：Linear、Step/Before/After、Cardinal（tension）、CatmullRom（alpha 0.5 防自交过冲，通用首选）、**MonotoneX（保单调防过冲，时间序列最稳）**、Natural、BumpX/Y
  - **不过点**：Basis（仅过首尾）、BasisOpen（首尾都不过）、Bundle（仅 line 不能用于 area，层级边捆绑）
  - Open 变体不过首尾点；Closed 变体闭合成环（雷达图）
- **symbol**：`d3.symbol().type(d3.symbolCircle).size(64)`——**size 是面积（px²）不是半径**
- **hierarchy 构造**：`d3.hierarchy(data)`（嵌套 JSON，默认取 `d.children`）或 `d3.stratify().id(...).parentId(...)(table)`（扁平表；要求恰一个根、无环、id 唯一，否则 throw）；`stratify().path(d => d)` 直接吃文件路径
- **node**：属性 `data / depth / height / parent / children / value`；**`sum(fn)` 后序累加出 value——treemap/pack/partition 前必须先 sum（或 count）（必考）**；`sort(cmp)` 排兄弟
- **遍历/查询**：`each`（广度优先）/ `eachBefore` / `eachAfter`；`descendants()` / `ancestors()` / `leaves()` / **`links()`**（source/target 对，画连线）/ `path(target)`
- **布局输出（必考对应）**：**tree**（tidy 算法）→ x/y；**cluster** → 同 tree 但**叶子等深**；**treemap** → x0/y0/x1/y1（tile：Squarify 默认 / Binary / Dice / Slice / SliceDice / Resquarify 动画稳定）；**partition**（冰柱，极坐标 = 旭日）→ x0/y0/x1/y1；**pack**（圆堆积）→ x/y/r
- **tree 尺寸**：`size([w, h])` 或 `nodeSize([w, h])`（**后者根固定在 (0,0)**，二选一）；`separation()` 调兄弟间距；x 当角度、y 当半径 = 径向树

## 一、心智模型：数据 → path 的 d

d3-shape 的所有生成器遵循同一约定：**输入数据，输出 SVG `path` 元素的 `d` 属性字符串**；把 `.context(ctx)` 设为 Canvas 2D 上下文则改为直接绘制（返回 void）。生成器本身**不碰 DOM**——画不画、画到哪，由你决定。

```js
const line = d3.line()
    .x(d => x(d.date))              // 访问器：从数据取 x
    .y(d => y(d.close))
    .defined(d => !isNaN(d.close))  // 假值处断线：缺失数据留缺口
    .curve(d3.curveMonotoneX);      // 插值方式

svg.append("path")
    .attr("d", line(data))          // 数据 → d 字符串
    .attr("fill", "none")           // 折线必须去填充
    .attr("stroke", "steelblue");
```

- 默认访问器取 `d[0]` / `d[1]`——`[[x, y], ...]` 形式的数据可直接喂。
- `digits(3)` 控制输出精度。

## 二、area：面积图与基线

```js
const area = d3.area()
    .x(d => x(d.date))     // 同时设 x0 = f、x1 = null（x1 为 null 时复用 x0）
    .y0(y(0))              // 基线：不设默认 0 = SVG 顶部，面积图会倒挂！
    .y1(d => y(d.value));  // 拓线
```

- area = 拓线（x1, y1）+ 基线（x0, y0）围成的闭合区域。
- `area.lineY1()` / `area.lineY0()` 把顶线/基线提取为 line 生成器——给面积图描边的标准做法。

## 三、pie + arc：饼图两件套

**pie 不画图，只做数据变换**（必考）：把值数组变成带角度的对象数组；**arc** 再把角度对象变成扇形 path：

```js
// 1. pie：值 → 角度
const arcs = d3.pie().value(d => d.sales)(data);
// 每项: {data, value, index, startAngle, endAngle, padAngle}

// 2. arc：角度对象 → path d
const arc = d3.arc().innerRadius(0).outerRadius(100);

svg.selectAll("path")
  .data(arcs)
  .join("path")
    .attr("d", arc)                    // arc 直接当访问器用
    .attr("fill", d => color(d.data.name));

// 3. 标签放弧中线中点
svg.selectAll("text")
  .data(arcs)
  .join("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .text(d => d.data.name);
```

- **角度约定（必考）**：弧度制；**0 在 12 点钟方向（-y 轴）**；**顺时针为正**——与 Math 极坐标不同！起止夹角 ≥ 2π 时画整圆环。
- **pie 的排序惊喜**：默认 `sortValues(d3.descending)` 按值降序分配扇区角度，但**返回数组顺序仍等于输入顺序**——图例按输入序、扇区按值序，对不上号时用 `sort(null)` / `sortValues(null)` 保持输入序。
- innerRadius 大于 0 即甜甜圈；`cornerRadius()` 圆角；`padAngle()` + `padRadius()` 扇区间隙（官方建议只用于环形）；`centroid(d)` 取 (startAngle+endAngle)/2 与 (inner+outer)/2 处的点，**不是几何质心**。

## 四、stack：堆叠数据变换

stack 把表格数据变成堆叠序列——同样只算数不画图。长表（tidy data）先用 `d3.index` 变形：

```js
const series = d3.stack()
    .keys(d3.union(data.map(d => d.fruit)))              // 堆叠的 key 集合
    .value(([, group], key) => group.get(key).sales)     // 长表的取值访问器
  (d3.index(data, d => d.date, d => d.fruit));           // 长表 → 嵌套 InternMap
// series：每 key 一条序列；序列里每点是 [y0, y1]，附 .data；序列有 .key/.index
```

配 area / rect 渲染时，把每点的 `[y0, y1]` 分别喂 `y0()` / `y1()`。order / offset 决定「怎么叠」：

| 配置 | 枚举 | 说明 |
| --- | --- | --- |
| order | stackOrderNone（默认） | 按 keys 顺序 |
| order | Ascending / Descending | 小和在底 / 大和在底 |
| order | InsideOut | 大的在中间，配 streamgraph |
| order | Reverse / Appearance | 反转 / 按出现顺序 |
| offset | stackOffsetNone（默认） | 零基线 |
| offset | **Expand** | 归一化到 [0, 1] = 百分比堆叠 |
| offset | **Diverging** | 正值向上、负值向下 |
| offset | Silhouette | 中心对称 |
| offset | **Wiggle** | 最小化摆动，streamgraph 标配（官方推荐配 InsideOut） |

**数据形态与 value 访问器要匹配**：宽表直接用默认 `d[key]`；长表先 `d3.index(data, d => d.date, d => d.fruit)` 再用上面的访问器。缺数据的组合会 undefined 崩——先补齐，或在 value 里兜底 0。

## 五、curve 家族：过不过数据点

| 组 | curve | 特点 |
| --- | --- | --- |
| 过数据点 | curveLinear | 直线折线 |
| 过数据点 | curveStep / StepBefore / StepAfter | 阶梯 |
| 过数据点 | curveCardinal | tension 0~1（1 ≈ 直线），可能过冲 |
| 过数据点 | curveCatmullRom | alpha(0.5) 向心参数化，防自交/过冲，通用首选 |
| 过数据点 | **curveMonotoneX** | **保单调防过冲，时间序列折线最稳选择** |
| 过数据点 | curveNatural | 自然三次样条 |
| 过数据点 | curveBumpX / BumpY | 贝塞尔，树/流程连线 |
| 不过数据点 | curveBasis | B 样条，仅过首尾 |
| 不过数据点 | curveBasisOpen | 首尾都不过 |
| 不过数据点 | curveBundle | beta 拉直的 basis，**仅用于 line 不能用于 area**，层级边捆绑 |
| 变体 | Open（CardinalOpen / CatmullRomOpen） | 不过首尾点 |
| 变体 | Closed | 闭合成环（雷达图） |

选型要点：**Basis 系不过数据点**（tooltip 会对不上）；Cardinal / CatmullRom 可能过冲「造出负值」；时间序列稳妥用 **curveMonotoneX**。

散点符号：`d3.symbol().type(d3.symbolCircle).size(64)`——注意 **size 是面积（px²）**，不是半径。

## 六、hierarchy：先建树，必 sum，再布局

### 两种构造

```js
// 1. 嵌套 JSON（默认取 d.children）
const root = d3.hierarchy(data);

// 2. 扁平表 → 层级（要求恰一个根、无环、id 唯一，否则 throw）
const root2 = d3.stratify()
    .id(d => d.name)
    .parentId(d => d.parent)
  (tableData);

// 3. 文件路径数组直接建树
const root3 = d3.stratify().path(d => d)(paths);
```

### node 的属性与方法

- 属性：`data` / `depth`（根为 0）/ `height`（叶为 0）/ `parent` / `children` / `value`。
- **`node.sum(d => d.value)`**：后序遍历自底向上累加出 `node.value`——**treemap / pack / partition 布局前必须先 sum（或 `count()` 数叶子），忘了则 value 全 undefined、布局全 NaN（必考）**。
- `node.sort(cmp)`：treemap / icicle 推荐 `(a, b) => b.height - a.height || b.value - a.value`；pack 推荐 `(a, b) => b.value - a.value`。
- 遍历：`each`（广度优先）/ `eachBefore`（前序）/ `eachAfter`（后序）。
- 查询：`descendants()`（含自身）/ `ancestors()` / `leaves()` / **`links()`**（返回 source/target 对数组，画连线）/ `path(target)`。

### 五大布局对照（必考）

| 布局 | 输出 | 要点 |
| --- | --- | --- |
| tree | 每节点 `x/y` | Reingold–Tilford tidy 算法；`size([w,h])` 或 `nodeSize([w,h])`（后者根固定在 (0,0)，二选一）；`separation((a, b) => a.parent === b.parent ? 1 : 2)`；x 当角度、y 当半径即径向树 |
| cluster | 每节点 `x/y` | 系谱图 dendrogram：**所有叶子等深**；tree 更紧凑 |
| treemap | `x0/y0/x1/y1` 矩形 | `tile()` 算法：Squarify（默认，趋黄金比，ratio 可调）/ Binary / Dice（横切）/ Slice（竖切）/ SliceDice（奇偶交替）/ Resquarify（动画时保持拓扑稳定）；padding 系列（Inner/Outer/Top…）；`round(true)` |
| partition | `x0/y0/x1/y1` | 冰柱图 icicle；转极坐标 = 旭日图 sunburst |
| pack | `x/y/r` | 圆堆积 |

## 七、易错点

- **area 忘设 y0**：默认 0 是 SVG 顶部，面积图倒挂。
- **pie 默认排序**：扇区顺序与输入不一致、图例对不上号——`sort(null)` 或自定义。
- **curve 选错**：Basis 不过点（tooltip 对不上）、Cardinal/CatmullRom 可能过冲；时序用 MonotoneX。
- **hierarchy 忘 sum**：treemap/pack 的 value 全 undefined，布局全 NaN。
- **stack 访问器与数据形态不匹配**：长表要先 `d3.index`；缺失组合先补齐或兜底 0。

## 下一步

层级布局解决「有父子关系」的数据；「只有连接关系」的网络图，交给[力导向图](./force-simulation)。
