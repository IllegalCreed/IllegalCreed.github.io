---
layout: doc
outline: [2, 3]
---

# 图表类型与数据：家族全览、dataKey 与经典模式

> 基于 **Recharts 3.9**（npm latest 3.9.2）· 核于 2026-07

## 速查

- **直角坐标图表**：`LineChart` / `BarChart` / `AreaChart` / `ScatterChart` / `ComposedChart`（混合）
- **极坐标图表**：`PieChart` / `RadarChart` / `RadialBarChart`（v3 极坐标也支持多轴）
- **层级/关系图**：`Treemap` / `Sankey` / `FunnelChart` / `SunburstChart`（v3 新增）
- **单类型图表只接受自己的 series**（`LineChart` 只吃 `Line`）；混合柱+线+面积+散点必须 `ComposedChart`
- 数据 = **对象数组**；series 用 `dataKey` 取值（字符串 `'a.b'` 路径 / 数字索引 / 函数）
- series 通用：`name`（显示名）、`unit`（单位）、`hide`（隐藏但留在 Legend）
- **Line**：`type` 插值——默认 "linear"，常用 **"monotone"**（平滑不过冲）、"step"、"basis"、"natural"
- Line：`dot` / `activeDot`（boolean/对象/元素/函数，默认 true）、`connectNulls`（默认 false）、`strokeDasharray`、`strokeWidth`（默认 1）
- **Bar 堆叠**：相同 `stackId`（且同轴）的 Bar 自动堆叠；**忘写 stackId ⇒ 柱子重叠遮挡**
- `stackOffset`（图表级）："none" 默认 / **"expand"（100% 归一化堆叠）** / "sign"（正负分堆）/ "silhouette" / "wiggle"
- Bar 尺寸：`barSize`（定宽 px 或百分比）、`maxBarSize`、`minPointSize`（小值也可见，默认 0）
- 图表级间距：`barGap`（同类目内柱间距，默认 4）、`barCategoryGap`（类目间距，默认 "10%"，本质是 band scale padding 快捷方式）
- Bar `radius` 圆角：数字（四角同）或 `[TL, TR, BR, BL]` 四元组；**堆叠圆角用 `BarStack` 对整摞设置**
- Bar：`background`（柱背景）、`activeBar`（hover 态四态 prop）
- **横向条形图三件套**：`layout="vertical"` + `XAxis type="number"` + `YAxis type="category" dataKey`（缺一不可）
- **Area**：`stackId` 同 Bar（堆叠面积图）；`baseValue`（"dataMin" / "dataMax" / 数字）
- **Area 渐变填充经典模式**：`<defs>` + `<linearGradient>` + `fill="url(#id)"`
- v3 行为：Area `connectNulls` 时 null 点按 0 处理
- **Pie 自带 `data` prop**（不吃图表根 data，必考）；`dataKey` 默认 "value"、`nameKey` 默认 "name"
- Pie：`cx` / `cy` 默认 "50%"；`innerRadius` 默认 0（**给正值 ⇒ 环形图 Donut**）、`outerRadius` 默认 "80%"
- Pie：`startAngle` 0 / `endAngle` 360——**半圆仪表盘 = 180 → 0**；另有 `paddingAngle` / `cornerRadius` / `minAngle`
- Pie `label`：boolean/函数/元素；函数收 name / value / **percent** / cx / cy / **midAngle** / innerRadius / outerRadius 等
- **逐扇区/逐柱着色两法**：老写法 `Cell` 列表（**已废弃，v4 移除**）；新写法 series `shape` 函数按数据返回带 fill 的图形
- **Scatter**：X/Y 都是 number 轴（各给 dataKey）；`ZAxis` 映射点大小（`range={[60, 400]}`）
- Scatter 的 `ErrorBar` 必须显式 `direction="x"` 或 `"y"`
- **Radar**：`PolarGrid` + `PolarAngleAxis dataKey` + `PolarRadiusAxis` + `Radar dataKey fillOpacity`
- **RadialBar**：环形进度条族；`background`、`minAngle`、`legendType`
- **Treemap**：data + dataKey（嵌套矩形）；**Sankey**：`data` 传 nodes + links（v3 类型收紧）
- **Funnel**：`FunnelChart` + `Funnel`（漏斗，也支持 stackId）
- **series/图形级事件**：Bar、Pie 扇区等支持 `onClick` / `onMouseEnter` 等，回调收 `(data, index, event)`
- v3 起原生 SVG 元素（`<defs>` / `<linearGradient>`）与 SVG 兼容的自定义组件可直接混进图表树

## 一、图表家族总览

| 类别 | 图表容器 | 常配部件 | 说明 |
| --- | --- | --- | --- |
| 直角坐标 | `LineChart` / `BarChart` / `AreaChart` / `ScatterChart` | `XAxis` `YAxis` `CartesianGrid` `Tooltip` `Legend` | 常规统计图主力 |
| 混合 | `ComposedChart` | 同上 + 双 `YAxis` | 同图混排 `Area` + `Bar` + `Line` + `Scatter` |
| 极坐标 | `PieChart` / `RadarChart` / `RadialBarChart` | `PolarGrid` `PolarAngleAxis` `PolarRadiusAxis` | 饼/环、雷达、环形进度；v3 起极坐标也支持多轴 |
| 层级/关系 | `Treemap` / `Sankey` / `FunnelChart` / `SunburstChart` | — | `SunburstChart` 为 v3 新增图表类型 |

**单类型图表只接受自己的 series 类型**：往 `LineChart` 里塞 `<Bar>` 不会渲染。要混合，必须换 `ComposedChart`（见下文第八节）。

## 二、数据与 dataKey

所有直角坐标图共享同一套数据约定：

- **数据是对象数组**，挂在图表根组件的 `data` prop 上（Pie 例外，见第六节）。
- 每条 series 用 **`dataKey`** 声明取哪个字段，三态：
  - 字符串：`dataKey="uv"`，支持 `'a.b'` 嵌套路径；
  - 数字索引；
  - 函数：`dataKey={(entry) => entry.uv * 2}`——**必须用 `useCallback` 固定引用**，内联写法每次渲染都是新引用，触发全量重算重渲（详见[性能](./customization-and-performance)）。
- series 通用 props：`name` 决定 Tooltip / Legend 里的显示名；`unit` 附加数值单位；`hide` 隐藏 series 但保留在 Legend——这是[图例切换显隐](./tooltip-legend-reference)的基础。

## 三、Line：折线

```jsx
<Line
  type="monotone"        // 插值：默认 "linear"；monotone 平滑且不过冲；还有 step/basis/natural
  dataKey="uv"
  stroke="#8884d8"
  strokeWidth={2}        // 默认 1
  dot={false}            // 千点级折线关 dot 是性能大头
  activeDot={{ r: 8 }}   // 悬停放大点；dot/activeDot 都是四态 prop
  connectNulls           // 默认 false：null 断线；true 则跨 null 连线
  strokeDasharray="5 5"  // 虚线
/>
```

## 四、Bar：堆叠、布局与圆角

### stackId：堆叠的开关（必考）

**相同 `stackId`（且同一轴）的 Bar 自动堆叠**。忘写 stackId 是经典翻车：多个 Bar 直接重叠遮挡，视觉上像「只有一个 series」。

```jsx
{/* 相同 stackId="a" ⇒ 自动堆叠；删掉 stackId ⇒ 柱子互相重叠遮挡 */}
<BarChart width={700} height={400} data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="uv" stackId="a" fill="#8884d8" />
  <Bar dataKey="pv" stackId="a" fill="#82ca9d" />
</BarChart>
```

堆叠形态由**图表级** `stackOffset` 控制："none"（默认）、**"expand"（归一化 100% 堆叠）**、"sign"（正负值分向堆叠）、"silhouette"、"wiggle"。

### 尺寸、间距与圆角

- `barSize`：定宽（px 或百分比），不给则按可用空间自动算；`maxBarSize` 封顶；`minPointSize` 让极小值也可见（默认 0）。
- 图表级 `barGap`（同类目内柱间距，默认 4）、`barCategoryGap`（类目间距，默认 "10%"）——本质是 band scale 的 padding 快捷方式；更细的控制可以给轴传自定义 band scale（paddingInner / paddingOuter / align）。
- `radius` 圆角：数字（四角相同）或 `[TL, TR, BR, BL]` 四元组。**堆叠柱的圆角要用 `BarStack` 组件对整摞设置**，否则某段高度小于圆角半径时会画出畸形。
- 交互外观：`background` 给柱子画背景条，`activeBar` 定义 hover 态（四态 prop）。

### 横向条形图三件套（必考）

```jsx
{/* 三件缺一不可：layout + X 换 number + Y 换 category */}
<BarChart layout="vertical" width={700} height={400} data={data}>
  <XAxis type="number" />
  <YAxis type="category" dataKey="name" />
  <Tooltip />
  <Bar dataKey="uv" fill="#8884d8" />
</BarChart>
```

## 五、Area：堆叠面积与渐变填充

`Area` 的 `stackId` 语义与 Bar 相同（堆叠面积图）；`baseValue` 可设 "dataMin" / "dataMax" / 数字。v3 行为变化：开 `connectNulls` 时 Area 的 null 点按 0 处理。

**渐变填充经典模式（官方示例原样，必背）**——SVG `<defs>` 定义线性渐变，`fill` 引用其 id：

```jsx
<AreaChart responsive data={data} style={{ width: '100%', aspectRatio: 1.618 }}>
  <defs>
    {/* 从上（80% 不透明）渐隐到下（全透明） */}
    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
    </linearGradient>
  </defs>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="url(#colorUv)" />
</AreaChart>
```

这也顺带展示了 Recharts 的 SVG 本色：**原生 SVG 元素（`<defs>`、`<linearGradient>`）可以直接混进组件树**。

## 六、Pie：环形、半圆与逐扇区着色

`Pie` 有两点与直角坐标系图表不同：

1. **`Pie` 自带 `data` prop**——它不吃图表根组件的 data（必考）。
2. 取值键有默认值：`dataKey` 默认 "value"、`nameKey` 默认 "name"。

几何 props 一览：`cx` / `cy` 圆心（默认 "50%"）；`innerRadius` 默认 0，**给正值即环形图（Donut）**；`outerRadius` 默认 "80%"；`startAngle` 0 / `endAngle` 360，**半圆仪表盘 = startAngle 180、endAngle 0**；再加 `paddingAngle`（扇区间隙）、`cornerRadius`（扇区圆角）、`minAngle`（极小值保底角度）。

`label` 支持 boolean / 函数 / 元素；函数收 `{ name, value, percent, cx, cy, midAngle, innerRadius, outerRadius, … }`，自绘百分比标签、外引线标签都靠它；`labelLine` 控制引线。

### 逐扇区着色：Cell（废弃）与 shape（趋势）

```jsx
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

{/* 老写法：Cell 列表逐扇区着色——v3 仍可用但已标废弃，v4 将移除 */}
<Pie data={data} dataKey="value" nameKey="name">
  {data.map((entry, i) => (
    <Cell key={i} fill={COLORS[i % COLORS.length]} />
  ))}
</Pie>

{/* 新推荐：shape 函数按数据项返回带 fill 的 Sector（props.payload 是原始数据行） */}
<Pie
  data={data}
  dataKey="value"
  shape={(props) => <Sector {...props} fill={props.payload.color} />}
/>
```

官方原文：「Cell is deprecated and will be removed in version 4.0」。废弃动因与迁移细节见[自定义与性能](./customization-and-performance)；两种写法都要认识（存量代码遍地是 Cell），**新代码写 shape**。逐柱着色同理（Bar 的 `shape`）。

## 七、Scatter 与极坐标家族

- **Scatter（`ScatterChart`）**：X / Y 都是 number 轴，各自给 `dataKey`；第三维用 `ZAxis` 映射点大小（如 `range={[60, 400]}`）；挂 `ErrorBar` 时必须显式 `direction="x"` 或 `"y"`。
- **Radar（`RadarChart`）**：组件树为 `PolarGrid` + `PolarAngleAxis`（给 dataKey）+ `PolarRadiusAxis` + `<Radar dataKey fillOpacity/>`。
- **RadialBar（`RadialBarChart`）**：环形进度条族，常用 `background`、`minAngle`、`legendType`。
- v3 起极坐标图也支持多轴。

## 八、ComposedChart：混合图（必考）

同一张图混排 `<Area>` + `<Bar>` + `<Line>` + `<Scatter>`，只能用 `ComposedChart`——单类型图表不接受他类 series。经典「柱 + 线」组合通常还配双 Y 轴：

```jsx
<ComposedChart width={700} height={400} data={data}>
  <XAxis dataKey="name" />
  <YAxis yAxisId="left" orientation="left" />
  <YAxis yAxisId="right" orientation="right" />
  <Tooltip />
  <Legend />
  <Bar yAxisId="right" dataKey="pv" fill="#82ca9d" />
  <Line yAxisId="left" type="monotone" dataKey="uv" stroke="#8884d8" />
</ComposedChart>
```

双轴配对规则与 v3 的排布行为详见[坐标轴与 domain](./axes-and-domain)。

## 九、层级与关系图

- **`Treemap`**：data + dataKey，嵌套矩形面积图。
- **`Sankey`**：`data` 传 nodes + links 结构（v3 对类型收紧）。
- **`FunnelChart` + `Funnel`**：漏斗图，同样支持 `stackId`。
- **`SunburstChart`**：旭日图，v3 新增图表类型。

---

下一页：[坐标轴与 domain](./axes-and-domain)——number vs category 的本质差异、domain 裁剪、双 Y 轴与 Brush 缩放。
