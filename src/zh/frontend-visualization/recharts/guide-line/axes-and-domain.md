---
layout: doc
outline: [2, 3]
---

# 坐标轴与 domain：轴类型、双 Y 轴与 Brush 缩放

> 基于 **Recharts 3.9**（npm latest 3.9.2）· 核于 2026-07

## 速查

- **type 默认值差异（必考）**：`XAxis` 默认 **"category"**、`YAxis` 默认 **"number"**
- **第一坑**：数字数据落在默认 category 的 XAxis 上会被当成**不重复的分类**（等距、按出现顺序排）——散点图/时间序列必须显式 `type="number"`
- 语义：category 轴把值当**离散字符串**（相邻类目无插值）；number 轴当**连续数轴**（会为「好看」自动外扩刻度）
- `domain` 写法：`[0, 100]` / `['dataMin', 'dataMax']` / `['auto', 'auto']` / 函数元素 `[(dataMin) => dataMin - 5, 'dataMax']`
- domain 仅对 **number 轴**生效；默认会自动扩到容下所有数据
- **`allowDataOverflow={true}`**：阻止自动扩域 + 裁掉出界图形（配合 Brush / 缩放场景常用）
- `ticks`：完全手工指定刻度数组
- `tickFormatter={(v) => …}`：刻度格式化
- `tick`：boolean / 元素 / 函数——自定义刻度组件（返回 SVG）
- `tickCount` 默认 5；`minTickGap` 默认 5；`angle` 旋转标签
- `interval`：数字 n（每 n+1 个显示 1 个）或 "preserveStart" / "preserveEnd" / "preserveStartEnd" / "equidistantPreserveStart"（XAxis 默认 "preserveEnd"）
- **`niceTicks`（v3 新）**：'none' / 'auto' / 'adaptive' / 'snap125'——「好看刻度」取整策略（官方新示例常见 snap125）
- `scale`：默认 "auto"（band/linear）；可 "log" / "sqrt" / **"symlog"（v3 新）**，或直接传 d3-scale 对象
- **log 轴必须显式给 domain，且不能含 0**（含 0/负数直接异常）
- **双 Y 轴**：两个 `YAxis` 各给 `yAxisId`，series 用相同 `yAxisId` 配对；右轴 `orientation="right"`
- v3 行为：多 Y 轴按 **yAxisId 字母序**排布（不按渲染顺序）
- v3 行为：轴线没有 ticks 也会显示
- `YAxis` `width` 默认 60，**v3 支持 'auto'**（宽度自适应长标签）
- `xAxisId` / `yAxisId` 默认 0（多轴配对标识）
- `allowDecimals` 默认 true；`allowDuplicatedCategory` 默认 true
- `hide` 隐藏轴；`mirror` 刻度翻到轴内侧；`padding`（`{left, right}` 或 `{top, bottom}`）
- `unit` 单位、`label` 轴标题、`reversed` 反向
- `CartesianGrid strokeDasharray="3 3"`：经典虚线网格
- **v3 暗坑**：`CartesianGrid` 新增 `xAxisId` / `yAxisId`——与轴 ID **不匹配则网格不渲染**（多轴图表网格消失就查它）
- **Brush（缩放选区）**：`dataKey`、`height`（40）、`startIndex` / `endIndex`
- Brush 事件：`onChange`（收 startIndex/endIndex）、`onDragEnd`
- Brush 外观：`travellerWidth`（5）、`gap`、`tickFormatter`、`alwaysShowText`；children 可内嵌迷你图（缩略 LineChart）
- **Brush 配 `allowDataOverflow` 才是真「放大」**：否则选区外数据仍参与自动 domain 计算
- Brush 受图表根 `syncId` 联动（多图共享选区/Tooltip）
- `syncMethod`："index"（默认）/ "value" / 函数——决定 syncId 联动时多图数据点的配对方式
- 横向条形图也靠轴实现：`layout="vertical"` + `XAxis type="number"` + `YAxis type="category"`（详见[图表类型页](./charts-and-data)）

## 一、number vs category：一字之差的两种轴

Recharts 的轴 `type` 只有两种，语义截然不同：

- **category**：把值当**离散字符串**——相邻类目之间没有插值概念，等距摆放。
- **number**：把值当**连续数轴**——按数值定位，还会为了「刻度好看」自动外扩。

**必考坑**：`XAxis` 默认就是 `type="category"`。把数字数据（时间戳、数值 X）直接喂给默认 XAxis，每个数字会被当成一个**不重复的分类**：间距失真（1、2、100 等距排开）、顺序按出现顺序而非大小。散点图、时间序列必须显式写 `<XAxis type="number" dataKey="x" />`。

## 二、轴 props 速览

| prop | XAxis 默认 | YAxis 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | **"category"** | **"number"** | 必考差异：X 默认分类轴、Y 默认数值轴 |
| `dataKey` | undefined | undefined | 轴取值字段 |
| `domain` | 自动 | 自动 | 仅 number 轴生效 |
| `interval` | "preserveEnd" | — | 刻度抽稀策略 |
| `allowDataOverflow` | false | false | true 时 domain 不自动扩、超界裁剪 |
| `orientation` | "bottom" | "left" | YAxis 可 "right"（双轴） |
| `width` | — | 60，**支持 'auto'**（v3 新） | YAxis 宽度自适应长标签 |
| `xAxisId` / `yAxisId` | 0 | 0 | 多轴配对标识 |

其他常用：`allowDecimals`（默认 true）、`allowDuplicatedCategory`（默认 true）、`hide`、`mirror`（刻度翻到轴内侧）、`padding`（`{left, right}` / `{top, bottom}`）、`unit`、`label`（轴标题）、`reversed`。

## 三、domain 与 allowDataOverflow

`domain` 只对 number 轴生效，写法四态：

```jsx
<YAxis domain={[0, 100]} />                          // 固定区间
<YAxis domain={['dataMin', 'dataMax']} />            // 贴住数据边界
<YAxis domain={['auto', 'auto']} />                  // 自动（含好看刻度取整）
<YAxis domain={[(dataMin) => dataMin - 5, 'dataMax']} />  // 函数元素微调
```

默认行为是**自动扩到容下所有数据**。而 **`allowDataOverflow={true}` 反其道行之**：阻止自动扩域，并把超出 domain 的图形**裁剪掉**——这是配合 Brush / 缩放做「真放大」的关键开关（见第八节）。

## 四、刻度控制

- `ticks`：完全手工指定刻度数组；`tickCount` 默认 5；`minTickGap` 默认 5。
- `tickFormatter={(v) => …}`：格式化显示值（千分位、日期格式化的入口）。
- `tick`：boolean / 元素 / 函数——自定义刻度组件，**必须返回 SVG**（`<text>` 而非 `<div>`）。
- `angle`：标签旋转（长标签防重叠）。
- `interval` 抽稀：数字 n（每 n+1 个显示 1 个）或策略串 "preserveStart" / "preserveEnd" / "preserveStartEnd" / "equidistantPreserveStart"；XAxis 默认 "preserveEnd"。
- **`niceTicks`（v3 新）**：控制「好看刻度」的取整策略，取值 'none' / 'auto' / 'adaptive' / 'snap125'；官方新示例常见 `niceTicks="snap125"`。它与 `tickCount`、`domain` 相互作用——手工 domain + snap125 时以取整策略为准。

## 五、scale：log / symlog 与自定义

`scale` 默认 "auto"（category 走 band、number 走 linear），还可以：

- `"log"`：**必须显式给 domain，且不能含 0 / 负数**，否则直接异常（必考坑）。
- `"sqrt"`、**`"symlog"`（v3 新，可跨 0 的对数轴）**。
- 直接传一个 **d3-scale 对象**——需要非常规刻度时的逃生门。

## 六、双 Y 轴（必考）

两个 `<YAxis>` 各给 `yAxisId`，series 用相同 `yAxisId` 配对：

```jsx
<YAxis yAxisId="left" orientation="left" />
<YAxis yAxisId="right" orientation="right" />
<Line yAxisId="left" dataKey="uv" />
<Bar  yAxisId="right" dataKey="pv" />
```

v3 行为变化要记两条：

1. 多 Y 轴**按 yAxisId 字母序**排布，不按渲染顺序——轴的左右/先后位置与 JSX 书写顺序无关。
2. 轴线**没有 ticks 也会显示**。

双轴最常与 [`ComposedChart` 混合图](./charts-and-data#八-composedchart-混合图-必考)搭配（柱 + 线各挂一轴）。

## 七、CartesianGrid：网格与 v3 暗坑

`<CartesianGrid strokeDasharray="3 3" />` 是经典虚线网格。**v3 新增 `xAxisId` / `yAxisId`**：网格必须与轴 ID 匹配，**不匹配则网格干脆不渲染**——多轴图表里「网格莫名消失」十有八九是这个暗坑。

## 八、Brush：缩放选区

`Brush` 在图表底部提供一个可拖拽选区，实现数据窗口缩放：

```jsx
<LineChart width={700} height={400} data={data} syncId="dashboard">
  <XAxis dataKey="name" />
  {/* allowDataOverflow：选区外数据不再参与 domain 计算 + 出界图形被裁剪 = 真“放大” */}
  <YAxis allowDataOverflow />
  <Tooltip />
  <Line type="monotone" dataKey="uv" stroke="#8884d8" dot={false} />
  <Brush
    dataKey="name"
    height={40}              // 默认 40
    startIndex={0}
    endIndex={30}
    travellerWidth={5}       // 拖拽手柄宽，默认 5
    onChange={({ startIndex, endIndex }) => console.log(startIndex, endIndex)}
  />
</LineChart>
```

- 常用 props：`dataKey`、`height`（40）、`startIndex` / `endIndex`、`onChange`、`onDragEnd`、`travellerWidth`（5）、`gap`、`tickFormatter`、`alwaysShowText`。
- children 可内嵌一个**迷你图**（缩略 LineChart）作为选区背景。
- **必考组合**：只加 Brush 不配 `allowDataOverflow` / domain 时，选区外数据仍参与自动 domain 计算，「放大」效果不彻底——真缩放 = Brush + `allowDataOverflow`。
- Brush 受图表根 `syncId` 联动：多张图给相同 `syncId` 即共享 Brush 选区与 Tooltip（详见[下一页](./tooltip-legend-reference)）。

---

下一页：[Tooltip、Legend 与参考系](./tooltip-legend-reference)——自定义 Tooltip content、payload 双层结构、图例显隐切换与 ReferenceLine 的 ifOverflow。
