---
layout: doc
outline: [2, 3]
---

# Tooltip、Legend 与参考系：定制、联动与标注

> 基于 **Recharts 3.9**（npm latest 3.9.2）· 核于 2026-07

## 速查

- **Tooltip 零配置即用**；`formatter` 逐项格式化：`(value, name, item, index, payload) => [显示值, 显示名]`
- `labelFormatter` 格式化标签行；`separator` 名值分隔符（默认 " : "）
- **自定义渲染走 `content`**（函数/元素），收 `{ active, payload, label }`
- **标准头两行**：`if (!active || !payload?.length) return null`——payload 可能为 undefined/空数组，直接解构取值会崩
- **v3 类型名 `TooltipContentProps`**（v2 叫 TooltipProps，沿用旧名类型报错——迁移必改）
- **payload 数组每项结构（必考）**：`{ name, value, dataKey, color, unit, payload }`
  - 最末的 `payload` 字段 = **该数据点的原始数据行**；`payload[0].payload` 才能取未画到图上的字段（双层同名经典坑）
- `cursor` 默认 true（十字线/高亮带）；`false` 关闭；可传 SVG props/元素
- `active` 受控强制显隐；**`defaultIndex` 首渲即高亮某项（v3 交互受控官方入口）**
- `trigger`："hover"（默认）或 "click"
- `shared`：true 轴共享模式（整列）、false 单点模式；`position` 固定位置（可只锁 x 或 y）；`offset` 默认 10
- `filterNull` 默认 true；`itemSorter` 默认 "name"（可 "dataKey" / "value" / 函数）
- **v3 新**：`portal` 渲染到图表外任意 DOM；`axisId` 多轴时跟随哪根轴
- `allowEscapeViewBox` 默认 x/y 都 false；四层样式 `wrapperStyle` / `contentStyle` / `itemStyle` / `labelStyle`
- 隐藏 tooltip 但保留交互高亮：`content={() => null}`；连 cursor 一起关：`cursor={false}`
- **v3 变更**：图表级/series 级 `activeIndex` prop 已移除——交互激活统一收敛到 Tooltip（defaultIndex / active / trigger）
- v3 提供 hooks（如 `useActiveTooltipLabel`）在自定义组件里读激活态
- **多图联动**：图表根 `syncId` 相同 ⇒ 共享 Tooltip / Brush；`syncMethod`："index"（默认）/ "value" / 函数
- **Legend 布局三 props**：`layout`（"horizontal" 默认）、`align`（"center" 默认）、`verticalAlign`（"bottom" 默认）
- Legend 放边缘（left/right/top/bottom）会**挤压绘图区**；middle/center 悬浮
- `iconType`（circle/rect/line/square/diamond/star/triangle/cross/wye/plainline/none）、`iconSize`（14）、`inactiveColor`（"#ccc"）
- Legend `content` 自定义**必须返回 HTML**（Legend 是 HTML 层）；也支持 `portal`（v3 新）、`formatter`、`itemSorter`（默认 "value"）
- **v3 变更**：Legend 的 `payload` 覆盖 prop 已移除；默认排序不再保证与 series 顺序一致
- **显隐切换经典模式**：Legend `onClick` 收 entry（含 dataKey）+ state + series `hide`（hide 的 series 不画但留在 Legend，配 `inactiveColor` 显灰）
- **ReferenceLine**：`x`（竖线）/ `y`（横线），用**数据域坐标**；`segment` 两点画斜线；`label` 标注
- **`ifOverflow` 默认 "discard"** ⇒ 目标值在 domain 外时**直接不画**；取值 "discard" / "hidden" / "visible" / **"extendDomain"（出界撑轴，必考）**
- v2 的 `alwaysShow` / `isFront` 已移除 → 用 `ifOverflow` + `zIndex`（ReferenceLine 默认 zIndex 400）
- **ReferenceArea**：`x1/x2/y1/y2` 任意省略 ⇒ 顺延到图表边界（只给 y1/y2 = 全宽横带高亮）；`shape` 可自定义；默认 zIndex 100
- **ReferenceDot**：`x` + `y` 单点标注
- **Label**：单点/轴标题；**LabelList**：整条 series 批量打标——`position`（20 余种）、`formatter`（只能返回字符串/数字）、`content`（自绘 SVG）、`offset`（5）、`angle`
- **ErrorBar**：`dataKey` 取误差——**单值 = 对称误差，`[下界, 上界]` 数组 = 不对称**；`width`（5）、`stroke`（"black"）；Scatter 必须给 `direction="x"` 或 `"y"`

## 一、Tooltip 核心 props

`<Tooltip />` 零配置即用。定制从浅到深：`formatter` 改值 → `content` 整体接管。

| prop | 类型/默认 | 说明 |
| --- | --- | --- |
| `content` | 函数/元素 | **自定义渲染**，收 `{ active, payload, label }` |
| `formatter` | 函数 | `(value, name, item, index, payload)`，返回 `[显示值, 显示名]` |
| `labelFormatter` | 函数 | 标签行格式化 |
| `separator` | " : " | 名值分隔符 |
| `cursor` | true | 悬停指示（十字线/高亮带）；false 关闭；可传 SVG props/元素 |
| `active` | undefined（自动） | 受控强制显示/隐藏 |
| `defaultIndex` | — | **首渲即高亮某项**（v3 交互受控官方入口） |
| `trigger` | "hover" | 或 "click" |
| `shared` | — | true 轴共享模式（整列），false 单点模式 |
| `position` | — | 固定位置（可只锁 x 或 y） |
| `offset` | 10 | 距鼠标偏移 |
| `filterNull` | true | 滤掉 null 项 |
| `itemSorter` | "name" | 可 "dataKey" / "value" / 函数 |
| `portal` | — | **v3 新：渲染到图表外任意 DOM** |
| `axisId` | 0 | v3 新：多轴时跟随哪根轴 |
| `allowEscapeViewBox` | x/y 均 false | 允许超出图表框 |
| `wrapperStyle` 等 | 空对象 | 四层样式：wrapper / content / item / label |

## 二、自定义 content 标准写法（必考）

```tsx
import { Tooltip, TooltipContentProps } from 'recharts';

// v3 类型名 TooltipContentProps（v2 叫 TooltipProps，沿用旧名会类型报错）
const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
  // 标准头两行：必须处理非激活态——payload 可能为 undefined / 空数组
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p>{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
};

<Tooltip content={<CustomTooltip />} />
```

要点逐条：

- **payload 数组每项结构**：`{ name, value, dataKey, color, unit, payload }`。注意**双层同名**：`item.value` 是当前 series 的值，`item.payload` 才是**该数据点的原始数据行**——要取没画到图上的字段（如订单号、备注），必须走 `payload[0].payload.xxx`。两层混淆是最经典的取值错误。
- Tooltip 是 **HTML 层**，content 里放 `<div>` / `<p>` 没问题（对比自定义 tick/shape 必须返回 SVG）。
- 隐藏 tooltip 但保留悬停高亮：`content={() => null}`；连十字线一起关：再加 `cursor={false}`。

## 三、v3 的交互收敛：从 activeIndex 到 Tooltip 受控

v2 里散落在图表级 / series 级的 `activeIndex`（Scatter/Bar/Pie 受控高亮）**在 v3 已全部移除**，交互激活统一收敛到 Tooltip 管理：

- `defaultIndex`：首次渲染就高亮某项（引导性 Dashboard 常用）。
- `active`：完全受控的显示/隐藏。
- `trigger="click"`：点击触发替代悬停。
- 自定义组件里读激活态：用 v3 公开 hooks（如 `useActiveTooltipLabel`，3.0+），不再有 v2 事件回调里的 `activeTooltipIndex` / `activePayload`（`CategoricalChartState` 已删除，见[迁移要点](./customization-and-performance#八-v2-v3-迁移要点)）。

## 四、多图联动：syncId

图表根组件给相同的 `syncId`，多张图即共享 Tooltip 与 Brush（Dashboard 联动标配）：

```jsx
<LineChart syncId="dashboard" data={cpuData}>{/* … */}</LineChart>
<AreaChart syncId="dashboard" data={memData}>{/* … */}</AreaChart>
```

配对方式由 `syncMethod` 决定："index"（默认，按数据下标对齐）、"value"（按值对齐）、或自定义函数。

## 五、Legend：布局与自定义

- **布局三 props**：`layout`（"horizontal" 默认）、`align`（"center" 默认）、`verticalAlign`（"bottom" 默认）。放边缘（left/right/top/bottom）会**挤压绘图区**，middle/center 则悬浮在图上。
- 外观：`iconType`（circle / rect / line / square / diamond / star / triangle / cross / wye / plainline / none）、`iconSize`（14）、`inactiveColor`（"#ccc"，配合 hide 显灰）。
- 定制：`formatter` 改文案；`content` 整体接管——**必须返回 HTML**（Legend 是 HTML 层）；`itemSorter` 默认 "value"；v3 新增 `portal` 可渲染到图表外。
- **v3 变更**：v2 可用 `payload` prop 整体伪造图例项，已移除；默认排序不再保证与 series 顺序一致——顺序敏感就自定义 content。

## 六、点击图例切换 series 显隐（经典模式，必考)

Legend `onClick` 收 entry（含 `dataKey`），配 state 与 series 的 `hide`：

```jsx
const [hidden, setHidden] = useState({});

<LineChart width={700} height={400} data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  {/* 点击图例项翻转对应 series 的隐藏状态 */}
  <Legend onClick={(e) => setHidden((h) => ({ ...h, [e.dataKey]: !h[e.dataKey] }))} />
  <Line dataKey="uv" hide={hidden['uv']} stroke="#8884d8" />
  <Line dataKey="pv" hide={hidden['pv']} stroke="#82ca9d" />
</LineChart>
```

关键机制：`hide` 的 series **不画但仍保留在 Legend 里**（配 `inactiveColor` 显示为灰色），所以图例项不会消失、可以再点回来。

## 七、参考系：ReferenceLine / ReferenceArea / ReferenceDot

三兄弟都用**数据域坐标**（不是像素）标注：

```jsx
{/* 横线：y 用数据值；目标线在数据范围外时必须 extendDomain，否则默认 discard 直接不画 */}
<ReferenceLine y={4000} stroke="red" label="目标" ifOverflow="extendDomain" />

{/* 竖线：x 用类目值；segment 可两点画斜线 */}
<ReferenceLine x="Page C" stroke="green" />

{/* 区间高亮：只给 y1/y2，x 方向自动顺延到图表边界 = 全宽横带 */}
<ReferenceArea y1={2000} y2={3000} fill="#8884d8" fillOpacity={0.2} />

{/* 单点标注 */}
<ReferenceDot x="Page B" y={3000} r={6} fill="orange" />
```

- **`ifOverflow`（必考）**：默认 **"discard"**——参考值超出当前 domain 时**直接丢弃不画**，「参考线怎么不见了」十有八九是它。四个取值："discard" / "hidden" / "visible" / **"extendDomain"（把轴撑大到容下参考值——目标线在数据范围外时必用）**。
- v2 的 `alwaysShow` / `isFront` 已移除：显示语义并入 `ifOverflow`，层级用 `zIndex`（ReferenceLine 默认 400、ReferenceArea 默认 100）。
- `ReferenceArea` 的 `x1/x2/y1/y2` 任意省略即顺延到图表边界；`shape` 可自定义区域图形。

## 八、Label、LabelList 与 ErrorBar

- **Label**：单点标签或轴标题（轴的 `label` prop 背后就是它）。
- **LabelList**：给整条 series 批量打标——`dataKey` 取显示值、`position`（top / insideTop / insideBottomLeft / outside… 20 余种，文档默认 "middle"）、`formatter`（**只能返回字符串/数字**）、`content`（自绘，返回 SVG）、`offset`（5）、`angle`。
- **ErrorBar**：置于 Bar / Line / Scatter 内，`dataKey` 取误差值——**单值 = 对称误差，`[下界, 上界]` 数组 = 不对称误差**；`width`（5）、`stroke`（"black"）；`direction` 在 Bar/Line 上自动、**Scatter 必须显式 "x" 或 "y"**。v3 修复：计算 domain 时忽略 nullish 误差值。

---

下一页：[自定义与性能](./customization-and-performance)——四态 prop 与 shape 自绘、v3 hooks 与 zIndex 图层、动画、性能优化清单与 v2 → v3 迁移全景。
