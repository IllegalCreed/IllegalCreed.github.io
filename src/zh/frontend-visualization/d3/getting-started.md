---
layout: doc
outline: [2, 3]
---

# 入门：定位、模块化与第一张图

> 基于 D3.js v7.9 · 核于 2026-07

## 速查

- **定位**：D3 = **D**ata-**D**riven **D**ocuments，基于 Web 标准的**低层级可视化工具集**——**不是图表库**，没有「图表」概念，用数据驱动 DOM（SVG / Canvas / HTML），换取无上限的定制自由度。
- **官方原话**：「Consider D3 an alternative to "doing everything yourself", not an alternative to a high-level charting library.」——D3 的替代对象是手写原生，不是图表库。
- **版本基线**：当前 `d3@7.9.0`（作者 Mike Bostock，ISC 协议）；v7 = **30 个独立模块的元包**（d3-selection@3、d3-scale@4、d3-force@3 等各自独立发版）。
- **四种引入方式**：
  - 全量：`import * as d3 from "d3"`
  - 按模块：`import {mean} from "d3-array"`
  - CDN（ESM）：`https://cdn.jsdelivr.net/npm/d3@7/+esm`
  - TypeScript：类型走 DefinitelyTyped（`@types/d3`）
- **版本演进（考点）**：
  - v4：单包拆分为模块化多包
  - v5：d3-fetch 取代 d3-request（回调 → Promise）
  - v5.8+（d3-selection 1.4）：引入 `selection.join()` 新范式
  - **v6**：事件监听改 `(event, d)` 签名；`d3.event` 全局对象移除；`d3.mouse` → `d3.pointer`；`d3.nest` → `d3.group/rollup`
  - v7：ESM 优先（type: module），无重大 API 变更
- **模块两大阵营**：d3-scale / d3-shape / d3-array / d3-hierarchy 是**纯数据计算、不碰 DOM**；d3-selection / d3-transition / d3-zoom 等才操作 DOM——与 React / Vue 分工协作的基础。
- **margin convention（布局范式）**：
  - `const margin = {top: 20, right: 20, bottom: 30, left: 40}`
  - x 的 range：`[margin.left, width - margin.right]`
  - **y 的 range：`[height - margin.bottom, margin.top]`——反向书写，大值才在上**（SVG 的 y 向下增长）
  - **轴永远渲染在原点，必须 `transform` 平移定位**
- **画图三步**：scale 定映射 → `svg.append("g").call(d3.axisBottom(x))` 画轴 → data join 画图形。
- **SVG 坐标系**：y 向下增长；`g` 元素 + transform 做分组平移。
- **数据加载**：`d3.csv/json` 返回 **Promise**；**csv 解析出的值全是字符串**——`d3.csv(url, d3.autoType)` 或手动 `+d.value` 转型。
- **选型速断**：
  - 内部仪表板 / 一次性分析：官方直言 D3 是 overkill，用姊妹高层库 **Observable Plot**（「D3 直方图约 50 行，Plot 1 行」）或 ECharts
  - 图表库没现货的定制视觉 / enter-exit 级动画控制 / 一图服务百万读者：上 D3
  - **混合路线（现代主流）**：只引 d3-scale / d3-array / d3-time-format 做数据处理——「用 D3 的数学，不用 D3 的 DOM」
- **进阶顺序**：[选择集与数据绑定](./guide-line/selection-and-data) → [比例尺与坐标轴](./guide-line/scales-and-axes) → [形状与层级布局](./guide-line/shapes-and-layouts) → [力导向图](./guide-line/force-simulation) → [过渡与交互](./guide-line/interaction-and-transition) → [参考](./reference)。

## 一、定位与哲学：D3 不是图表库

D3（**Data-Driven Documents**）是基于 Web 标准的**低层级数据可视化工具集**。它与 ECharts、Recharts 最根本的差别在于：**D3 里没有「图表」这个概念**——没有现成的柱状图、折线图函数，它提供的是比例尺、形状生成器、选择集、过渡这些「造图零件」，由你把数据一步步驱动成 DOM（SVG / Canvas / HTML）。

- **核心创新是 data join**（enter / update / exit 三态数据绑定）：几乎所有高层图表库（Observable Plot、Recharts 的底层思想、ECharts 的 scale 设计）都受其影响。
- 它被称为可视化领域的「汇编语言」与事实标准，拿下 IEEE VIS 与 Information is Beautiful 双料 Test of Time Award。
- 代价同样明确：**一个基础柱状图也要几十行代码**。官方原话说得很直白：

> Consider D3 an alternative to "doing everything yourself", not an alternative to a high-level charting library.

也就是说，D3 的替代对象是「全部手写原生」，而不是图表库——赶时间做仪表板该用 Plot / ECharts；要做《纽约时报》级定制交互可视化，D3 是唯一解。

## 二、安装与模块化

### 引入方式

```js
// 1. 全量引入（元包，最常见）
import * as d3 from "d3";

// 2. 按模块引入（只打包用到的部分）
import {mean} from "d3-array";

// 3. CDN（ESM），适合快速原型
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// 4. TypeScript 类型走 DefinitelyTyped
//    pnpm add -D @types/d3
```

### 30 个模块，两大阵营

v7 的 `d3` 包只是**元包**：它聚合 30 个独立发版的模块（d3-selection@3、d3-scale@4、d3-force@3……）。按用途分类：

| 类别 | 模块 |
| --- | --- |
| 选择与 DOM | d3-selection |
| 比例尺 | d3-scale、d3-scale-chromatic（配色） |
| 形状 | d3-shape（line/area/arc/pie/stack/curve/symbol） |
| 布局 | d3-hierarchy（tree/treemap/pack/partition）、d3-force |
| 动画 | d3-transition、d3-ease、d3-timer、d3-interpolate |
| 交互 | d3-zoom、d3-drag、d3-brush、d3-dispatch |
| 数据 | d3-array、d3-fetch、d3-dsv、d3-format、d3-time、d3-time-format、d3-random |
| 地理 | d3-geo |

关键认知：**d3-scale / d3-shape / d3-array / d3-hierarchy 是纯数据计算，不碰 DOM**——这是 D3 能与 React / Vue 分工协作的基础（见第五节）。

### 版本演进（高频考点）

- **v4**：单包拆分为模块化多包。
- **v5**：d3-fetch 取代 d3-request（回调 → Promise）。
- **v5.8+**（d3-selection 1.4）：引入 `selection.join()` 新范式。
- **v6**：事件签名从 `function(d, i)` 改为 `(event, d)`；`d3.event` 全局对象移除；`d3.mouse` → `d3.pointer`；`d3.nest` 被 `d3.group/rollup` 取代。
- **v7**：ESM 优先（type: module），无重大 API 变更。

## 三、第一张图：柱状图与 margin convention

D3 画图的标准三步：**比例尺定映射 → 坐标轴定参照 → data join 画图形**。margin convention（边距约定）贯穿始终：

```js
const width = 640, height = 400;
// margin convention：先定边距对象
const margin = {top: 20, right: 20, bottom: 30, left: 40};

const data = [
  {name: "A", value: 30},
  {name: "B", value: 80},
  {name: "C", value: 45},
];

// 1. 比例尺：数据域 → 像素域
const x = d3.scaleBand()
    .domain(data.map(d => d.name))                 // 类别数组
    .range([margin.left, width - margin.right])    // range 直接嵌入 margin
    .padding(0.1);                                 // band 间隙

const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()                                        // 圆整 domain 到好看的边界
    .range([height - margin.bottom, margin.top]);  // 注意 y 反向！大值才在上

// 2. SVG 容器（游离构建，最后挂载）
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

// 3. 坐标轴：轴永远渲染在原点，必须 transform 平移到位
svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));
svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

// 4. data join：一条数据 ↔ 一个 rect
svg.selectAll("rect.bar")
  .data(data)
  .join("rect")
    .attr("class", "bar")               // 专属 class，防止选中轴里的 rect
    .attr("x", d => x(d.name))          // band 起点
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())       // 条宽
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", "steelblue");

// 5. 挂载游离节点
document.querySelector("#chart").append(svg.node());
```

三条读图要点：

- **y 轴 range 必须反向**：SVG 的 y 坐标向下增长，range 写 `[height - margin.bottom, margin.top]` 数据大值才画在上面；写成 `[0, height]` 图会倒挂。
- **轴不会自己定位**：axis 永远渲染在原点，必须 `transform` 平移到底部/左侧——忘了平移就贴在 (0,0) 只见一半。
- **margin convention 有两种等价形式**：比例尺的 range 直接嵌入 margin（如上）；或外层 `g` 统一 `translate(margin.left, margin.top)`、内部用净宽高。两种都要认识。

### 加载真实数据

```js
// d3-fetch 全部返回 Promise
const data = await d3.csv("data.csv", d3.autoType);
```

**csv 解析出的所有值都是字符串**（必考坑）：`"9" > "10"` 按字典序比较、scale 的 domain 会变 NaN。第二参传行转换函数——手写 `d => ({date: new Date(d.date), value: +d.value})`，或直接 `d3.autoType` 自动转型（数字串 → number、ISO 8601 日期串 → Date 等，规则详见[参考页](./reference)）。

## 四、与图表库怎么选

| 维度 | D3 | ECharts | Recharts（及 Nivo/Visx 类） |
| --- | --- | --- | --- |
| 抽象层级 | 低层工具集（无 chart 概念） | 高层配置式图表库（option 对象） | 中层 React 组件（`<LineChart>`） |
| 定制自由度 | 无上限（任意视觉形式） | 预设图表类型内定制 | 受组件 props 限制（Visx 例外，本质是 React 版 D3 壳） |
| 上手成本 | 高（50+ 行/图，需懂 SVG） | 低（一个 option 出图） | 低-中（React 心智） |
| 渲染 | 自选 SVG/Canvas/HTML | 内置 Canvas/SVG 双引擎，大数据开箱优化 | SVG 为主 |
| DOM 所有权 | 自己管（与框架需划界） | 自持画布，框架无冲突 | 原生融入 React 树 |
| 动态/动画 | data join + transition 精确控制每个元素 | 声明式动画，细粒度控制弱 | 中等 |
| 典型场景 | 新闻级定制叙事图、力导向图、创新图型 | 中后台仪表板、常规统计图、地图大屏 | React 项目常规图表 |

- **该用 D3**：需要的视觉形式在图表库里「没有现货」（自定义布局 / 混合图型 / 叙事滚动动画）；需要 enter/update/exit 级的动画控制；图本身是产品核心（一图服务百万读者）；或作为其他库的底层（Recharts / Nivo / Plot 都构建于 D3 模块之上）。
- **不该用**：内部仪表板、一次性分析——官方原话 "D3 is overkill for throwing together a private dashboard or a one-off analysis"，并推荐自家高层姊妹库 **Observable Plot**（「D3 直方图约 50 行，Plot 1 行」）。
- **混合路线（现代主流）**：即便选了框架图表库，d3-scale / d3-array / d3-time-format 仍常被单独引入做数据处理——**「用 D3 的数学，不用 D3 的 DOM」**。

## 五、与框架协作的两种模式

官方入门文档原生给出 React 示例，归纳为两种模式：

1. **D3 算数据、框架渲染 DOM（推荐默认）**：只用 scale / shape / array 等纯计算模块，元素由框架模板渲染（如 JSX 里 `<path d={line(data)} />`、用 `data.map` 渲染一组 `circle`）——享受框架声明式与虚拟 DOM diff，避免两套 DOM 所有权打架。
2. **D3 全接管 ref**（需要 axis / transition / zoom / brush 等 DOM 行为时）：把某个 `<g>` 的所有权完整让渡给 D3。

```js
// React：轴的所有权交给 D3（官方入门示例写法）
useEffect(() => void d3.select(gx.current).call(d3.axisBottom(x)), [x]);
// Vue 对应：onMounted + 模板 ref / watchEffect
```

取舍：模式 1 的动画/交互行为要自己补（或用 CSS / framer-motion）；模式 2 绕过框架 diff，注意组件卸载时清理（移除监听、停掉仿真）。

**大数据量走 Canvas**：SVG 千级元素顺滑、万级卡顿——DOM 节点数是主要瓶颈。数据量超过 1 万个元素时改用 Canvas 路线：shape 生成器 `.context(ctx)` 直接绘制、力导向图在 tick 里全量重绘、拾取用 `simulation.find` / quadtree / 隐藏色彩缓冲。

## 下一步

D3 的一切都从**选择集与数据绑定**开始——那是它区别于所有库的心脏。先读[选择集与数据绑定](./guide-line/selection-and-data)，再按[比例尺与坐标轴](./guide-line/scales-and-axes) → [形状与层级布局](./guide-line/shapes-and-layouts) → [力导向图](./guide-line/force-simulation) → [过渡与交互](./guide-line/interaction-and-transition)推进，[参考](./reference)可随时查表。
