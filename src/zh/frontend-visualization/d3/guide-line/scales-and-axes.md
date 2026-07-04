---
layout: doc
outline: [2, 3]
---

# 比例尺与坐标轴：scale 全家桶与 axis

> 基于 D3.js v7.9（d3-scale@4 / d3-axis）· 核于 2026-07

## 速查

- **心智模型**：scale = **domain（数据域）→ range（视觉域）的映射函数**；`d3.scaleLinear([10, 130], [0, 960])`，`x(20) === 80`。
- **选型总览**：
  - 连续→连续：`scaleLinear` / `scalePow` / `scaleSqrt` / `scaleLog` / `scaleSymlog` / `scaleTime` / `scaleUtc` / `scaleRadial`
  - 离散→离散：`scaleOrdinal`（类别→颜色等）
  - 离散→连续位置：`scaleBand`（柱状图）/ `scalePoint`（折线类目轴）
  - 连续→离散：`scaleQuantize`（等宽）/ `scaleQuantile`（等频）/ `scaleThreshold`（手动阈值）
  - 连续→颜色：`scaleSequential` / `scaleDiverging`（数值→插值器）
- **scaleLinear 关键方法**：
  - **`invert(px)`**：像素反算数据（鼠标拾取基石）；**range 必须是数值**否则 NaN
  - `clamp(true)` 夹紧出界值（默认线性外推）；`nice()` 圆整 domain（**只作用当前 domain，重设后要重新 nice**）
  - `ticks(count)` 返回人类可读刻度（count 只是提示）；`tickFormat(count, specifier)`；`rangeRound()` 输出取整；`unknown(v)` 兜底 NaN 输入
  - domain 可给 3+ 值做分段映射（`[-1, 0, 1]` 映射红白绿 = 发散配色）
- **scaleBand**：`x("a")` 返回 band 起点；**`bandwidth()`** 条宽；**`step()`** 相邻起点距离；`paddingInner / paddingOuter / padding / align / round`；**没有 invert（必考坑）**
- **scalePoint**：band 退化版，`bandwidth()` 恒为 0（折线图类目轴）
- **scaleOrdinal**：**隐式 domain 坑**——不设 domain 时未知输入按调用顺序自动加入（哨兵 `d3.scaleImplicit`），结果依赖调用顺序；生产显式 domain 或 `.unknown(null)`；range 短于 domain 时循环复用
- **scaleTime / scaleUtc**：domain 是 Date；invert 返回 Date；ticks 按时间间隔取整（可传 `d3.timeMonth`、`d3.utcMinute.every(15)`）；默认多级 tickFormat；**官方建议优先 scaleUtc**（一天恒 24h，不受时区影响）
- **scaleLog**：**domain 严格同号、不得包含或跨越 0**；负 domain 隐式乘 -1；`base()` 只影响 ticks 不影响映射；跨 0 用 **scaleSymlog**（`constant()` 调线性区）
- **scalePow / scaleSqrt**：`exponent()` 设指数；sqrt ≡ pow(0.5)，面积编码常用
- **连续→离散三兄弟**：
  - `scaleQuantize`：domain 均分成 range.length 段（等宽）；`thresholds()` 返回切分点
  - `scaleQuantile`：按数据分位数切（等频，domain 传全部数据）；`scaleThreshold`：手动 `domain([0, 100])` 得 3 档
  - **`invertExtent(v)`** 反查档位对应的 domain 区间 `[x0, x1]`（图例交互标准做法）
- **坐标轴 d3-axis**：
  - 四方向 `axisTop / axisRight / axisBottom / axisLeft`（刻度画在对应侧）；**轴永远渲染在原点，必须 transform 平移（必考）**
  - `selection.call(axis)` 渲染；`g.transition().call(axis)` 动画更新
  - 配置：`ticks(count[, specifier])`（转发给 scale，对 band/point 无效）、`tickValues([...])`、`tickFormat(fn)`、`tickSize / tickSizeInner`（默认 6）、`tickSizeOuter`（两端「方括号」，0 = 纯直线）、`tickPadding`（默认 3）
  - 网格线惯用法：`tickSize(-innerWidth)` 让刻度线穿过绘图区
- **margin convention**：x range `[margin.left, width - margin.right]`；**y range `[height - margin.bottom, margin.top]`（反向）**；或外层 g 平移 + 净宽高（两种等价）
- **band 反算**（没有 invert 的替代）：`Math.floor((px - range[0]) / step)`，或改 scalePoint + `bisectCenter`

## 一、心智模型：domain → range 的函数

比例尺回答的问题只有一个：「**这个数据值该画在哪 / 用什么颜色**」。所有 scale 都是函数，把 domain（数据域）映射到 range（视觉域——像素、颜色、角度）：

```js
const x = d3.scaleLinear([10, 130], [0, 960]); // domain、range 可直接传构造器
x(20);        // 80    数据 → 像素
x.invert(80); // 20    像素 → 数据（鼠标拾取的基石）
```

`invert` 只有**数值 range** 才支持——range 是颜色等非数值时返回 NaN。

## 二、比例尺分类总览

| 类别 | API | domain → range |
| --- | --- | --- |
| 连续→连续 | scaleLinear / scalePow / scaleSqrt / scaleLog / scaleSymlog / scaleTime / scaleUtc / scaleRadial | 数值→数值/颜色 |
| 离散→离散 | scaleOrdinal | 类别→颜色等 |
| 离散→连续位置 | scaleBand / scalePoint | 类别→坐标区间/点 |
| 连续→离散 | scaleQuantize（等宽）/ scaleQuantile（等频）/ scaleThreshold（手动阈值） | 数值→档位 |
| 连续→颜色 | scaleSequential / scaleDiverging | 数值→插值器 |

## 三、连续比例尺：linear 家族

### scaleLinear 的关键配置

```js
const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.value)) // extent 返回 [min, max]，喂 domain 的标配
    .nice()                                // 圆整 domain 到好看的边界（extent 的零碎值必配）
    .range([height - margin.bottom, margin.top]);

y.clamp(true);        // 夹紧出界输入（默认是线性外推）
y.ticks(5);           // 人类可读的刻度值数组（5 只是提示，不精确）
y.tickFormat(5, "s"); // 刻度格式化函数
y.unknown(0);         // NaN 输入的兜底输出
```

- **`nice()` 只作用于当前 domain**：重设 domain 后必须重新调用。
- `rangeRound()` ≡ `interpolate(d3.interpolateRound)`，输出取整避免亚像素模糊。
- domain 可给 3 个及以上值做**分段映射**：`domain([-1, 0, 1])` 配 `range(["red", "white", "green"])` 即发散配色。

### 对数与幂：log / symlog / pow / sqrt

- **scaleLog 的 domain 严格同号、不得包含或跨越 0**（log(0) = -∞，行为未定义）；全负 domain 隐式乘 -1 处理。
- `base()` 只影响 ticks 的取法，**不影响映射本身**；刻度过密时 tickFormat 会对部分标签返回空串（刻度线仍画）。
- 数据跨 0 用 **scaleSymlog**，`constant()` 调节 0 附近的线性区宽度。
- scalePow 用 `exponent()` 设指数；**scaleSqrt ≡ pow(0.5)**——用「面积」编码数值（如气泡半径）的常用选择。

### 时间轴：scaleTime / scaleUtc

- domain 是 **Date 对象**；`invert` 返回 Date。
- ticks 按时间间隔取整，可直接传间隔对象：`ticks(d3.timeMonth)`、`ticks(d3.utcMinute.every(15))`。
- 默认 tickFormat 是**多级格式**：年边界显示 %Y、月边界 %B、天边界 %a %d……
- **官方建议优先 scaleUtc**：UTC 的一天恒定 24 小时，不受浏览器时区影响。

## 四、离散比例尺：band / point / ordinal

### scaleBand（柱状图专用）

```js
const x = d3.scaleBand()
    .domain(data.map(d => d.name))               // 类别数组
    .range([margin.left, width - margin.right])
    .padding(0.1);                               // 同设 paddingInner + paddingOuter

x("a");         // band 起点（柱子的 x）
x.bandwidth();  // 条宽（柱子的 width）
x.step();       // 相邻 band 起点的距离
```

- `paddingInner`：band 间隙占 step 的比例（0~1）；`paddingOuter`：两端留白（step 的倍数）；`align`：外侧留白分配（默认 0.5 居中）；`round(true)`：整数化避免锯齿。
- **scaleBand 没有 invert（必考坑）**——hover 反算类别用 `Math.floor((px - range[0]) / step)`，或改用 scalePoint + `d3.bisectCenter`。
- **scalePoint** 是 band 的退化版：`bandwidth()` 恒为 0，把类别映射到「点」位置——折线图的类目轴。

### scaleOrdinal（分类配色）

```js
const color = d3.scaleOrdinal(["a", "b", "c"], d3.schemeTableau10);
```

- **隐式 domain 坑（必考）**：不设 domain 时，未知输入会按**调用顺序**自动加入 domain（默认 unknown 值是哨兵 `d3.scaleImplicit`）——结果依赖调用顺序，两次渲染数据顺序不同颜色就漂移。生产环境显式设 domain，或 `.unknown(null)` 关闭隐式行为。
- range 比 domain 短时**循环复用**。

## 五、连续 → 离散：quantize / quantile / threshold

| API | 切法 | 场景 |
| --- | --- | --- |
| scaleQuantize | domain 均匀切成 range.length 段（等宽） | 分档着色 |
| scaleQuantile | 按数据分位数切（等频；domain 传全部数据） | 五等分收入档 |
| scaleThreshold | `domain([0, 100])` 手动阈值，range 得 3 档 | 自定义分界 |

- **`invertExtent(v)`**：反查某档位对应的 domain 区间 `[x0, x1]`——图例 hover 高亮对应数据范围的标准做法。
- `thresholds()` 返回全部切分点（range 长度 - 1 个）。

## 六、坐标轴 d3-axis 与 margin convention

```js
const margin = {top: 20, right: 20, bottom: 30, left: 40};
const x = d3.scaleUtc(domain, [margin.left, width - margin.right]);
const y = d3.scaleLinear(dom, [height - margin.bottom, margin.top]); // 注意 y 反向！

svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`) // 平移到底部
    .call(d3.axisBottom(x));
svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)            // 平移到左侧
    .call(d3.axisLeft(y));
```

- **轴不会自己定位**：`axisTop / axisRight / axisBottom / axisLeft` 只决定刻度画在轴线哪一侧，**轴永远渲染在原点，必须 transform 平移**（必考）。
- `g.transition().call(axis)` 可动画更新轴——axis 支持把 transition 当渲染上下文。
- 轴生成的 DOM：`path.domain`（轴线）+ 若干 `g.tick`（内含 line + text）——可用 CSS 或后处理定制。
- 配置项：`ticks(count[, specifier])` 转发给 scale.ticks / tickFormat（**对 band/point 无效**）、`tickValues([...])` 显式指定、`tickFormat(fn)`、`tickSize / tickSizeInner`（刻度线长，默认 6）、`tickSizeOuter`（轴线两端的「方括号」，设 0 变纯直线）、`tickPadding`（默认 3）。
- **网格线惯用法**：`tickSize(-innerWidth)` 让刻度线反向穿过整个绘图区。
- margin convention 两种等价形式都要认识：scale 的 range 直接嵌入 margin（如上）；或外层 `g` 统一 `translate(margin.left, margin.top)`、内部用净宽高。

## 七、易错点

- **y 轴 range 忘反转**：`range([0, height])` 大值在下、图倒挂——必须 `[height - margin.bottom, margin.top]`。
- **scaleBand 调 invert**：直接 undefined 报错——用 step 除法反算，别照抄 linear 的套路。
- **log domain 含 0 / 跨 0**：行为未定义——换 symlog 或裁剪 domain。
- **scaleOrdinal 不设 domain**：颜色随数据出现顺序漂移，两次渲染不一致。
- **nice 后重设 domain**：nice 不会自动跟随，要再调一次。
- **轴忘 transform**：贴在原点只见一半。

## 下一步

位置有了，接下来把数据变成真正的图形——[形状与层级布局](./shapes-and-layouts)讲 line / area / arc / pie / stack 生成器与 hierarchy 布局家族。
