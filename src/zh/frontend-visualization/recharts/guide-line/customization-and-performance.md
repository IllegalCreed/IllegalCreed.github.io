---
layout: doc
outline: [2, 3]
---

# 自定义与性能：shape、动画、性能边界与 v3 迁移

> 基于 **Recharts 3.9**（npm latest 3.9.2）· 核于 2026-07

## 速查

- **四态 prop 统一约定**：`dot` / `activeDot` / `label` / `tick` / `shape` / `content` / `cursor` 都接受 **boolean / 对象(props) / React 元素 / 函数**
- 函数形态收带坐标与数据的 props、**必须返回 SVG**；例外：Tooltip / Legend 的 `content` 返回 **HTML**（它们是 HTML 层）
- Bar `shape` 函数收 x / y / width / height / fill / **payload（原始数据行）** 及动画参数（`animationElapsedTime` / `isAnimating` / `isEntrance`）
- Pie `shape` / `activeShape` 另有 `isActive`
- **v3**：任意 SVG 兼容的自定义 React 组件**可直接放进图表树**；`Customized` 仍在但**不再注入内部状态**（v2 `CategoricalChartState` 已删除）
- **v3 公开 hooks**：`useActiveTooltipLabel`、`useOffset`、`useMargin`、`usePlotArea`、`useXAxisScale` / `useYAxisScale`（数据 → 像素）及逆变换 `useXAxisInverseScale` 等
- **三套坐标系**：数据域坐标 / 图表像素坐标 / 鼠标原生坐标（`getRelativeCoordinate` 换算）
- 布局术语：`margin`（图表外留白）→ `offset`（margin + 轴 + Brush + Legend 占位）→ **plot area**（真正绘图区）
- **zIndex（v3.4+）**：SVG 无 z-index，Recharts 用绘制顺序 + 内部 `zIndex` 分层；组件可传 `zIndex`，不支持的元素包 `ZIndexLayer`
- zIndex **仅单图表内有效**；条件渲染会改变 DOM 插入顺序 ⇒ 层级要显式声明才稳
- **动画四件套**：`isAnimationActive` / `animationBegin`（首渲延迟 ms）/ `animationDuration`（400）/ `animationEasing`
- `isAnimationActive` **v3 默认 'auto'：尊重系统 `prefers-reduced-motion`**；true 强开 / false 关
- `animationEasing`：'ease'（默认）/ ease-in / ease-out / ease-in-out / linear / **spring** / cubic-bezier 字符串 / 自定义函数（0 → 1）
- **`animationMatchBy`（v3.9+）**：数据更新时新旧点配对方式（按索引 / 追加 / dataKey / 自定义函数），决定过渡动画形态
- 回调：`onAnimationStart` / `onAnimationEnd`；SSR、测试断言、性能场景常置 `isAnimationActive={false}`
- **性能瓶颈本质**：每个数据点都是 SVG DOM 节点，数据量大 + 高频 mousemove ⇒ 全图重渲
- 官方优化清单：①**引用稳定**（data / dataKey 函数 / 自定义组件用 useMemo / useCallback 固定）②**组件隔离**（频变部分拆独立 memo 组件）③**关动画 + 关 dot** ④**降采样/聚合**（先 d3.bin 分箱再画）⑤mousemove **防抖** ⑥React DevTools Profiler 定位
- dataKey 传内联函数 = 每渲染新引用 ⇒ 全量重算，**头号隐形杀手**（可上 eslint-plugin-react-perf）
- **经验阈值**：几千点内可用；**万级+点、实时高刷 ⇒ 换 Canvas 系**（Chart.js / ECharts）或 WebGL
- **TypeScript**：类型内置主包；**v3.8+ 泛型组件**校验 dataKey + IDE 补全；类型工厂 `createHorizontalChart` / `createVerticalChart` / `createRadialChart` / `createCentricChart`
- 自定义 Tooltip 类型用 `TooltipContentProps`（v2 `TooltipProps` 已改名）
- **v2 → v3 核心**：内部状态管理整体重写（去 class、内部 store、+3500 单测）
- v3 移除：series `activeIndex`、Reference 系 `alwaysShow` / `isFront`、Legend `payload`、事件回调里的 `CategoricalChartState`
- **defaultProps 警告根治**：React 18.3+ 弃用警告刷屏（issue #3615）是 v2 著名噪音，升 v3 消失
- `accessibilityLayer` **v3 默认 true**：方向键在数据点间移动 Tooltip、支持屏幕阅读器
- **Cell 已废弃（v4 移除）**：动因 = 最后一处 react-is 依赖 + 按父上下文变形的 props 无法 TS 准确类型化 → 新代码用 `shape` / `content`
- **图表级事件**：`onClick` / `onMouseMove` / `onMouseDown` / `onMouseLeave` 及 touch 系列；v3 回调签名为 `CategoricalChartFunc`（不再注入状态对象）
- **series/图形级事件**：Bar、Pie 扇区等支持 `onClick` / `onMouseEnter` 等，收 `(data, index, event)`
- v3 键盘事件不再从 `onMouseMove` 透传（配合 accessibilityLayer 的可及性重构）
- **动画中间态坑**：首渲动画中路径/柱高是中间态——截图、E2E 断言 DOM 量值前必须关动画

## 一、自定义渲染统一约定：四态 prop

Recharts 的扩展点高度一致：`dot`、`activeDot`、`label`、`tick`、`shape`、`content`、`cursor` 等 prop 都接受**四态**——

1. **boolean**：开/关默认渲染；
2. **对象**：合并进默认图形的 props（如 <code v-pre>activeDot={{ r: 8 }}</code>）；
3. **React 元素**：直接替换；
4. **函数**：收到带坐标与数据的 props，返回自定义渲染。

**SVG / HTML 边界必须记牢**：自定义 `tick` / `label` / `shape` / `dot` 处在 SVG 上下文，必须返回 SVG 元素（`<text>`、`<g>`、`<path>`），塞 `<div>` 不渲染或报错；而 Tooltip / Legend 的 `content` 是 HTML 层，返回 `<div>` 才对。

## 二、shape 实战：按数据自绘图形

`shape` 函数收到的 props 带定位与数据：Bar 的 `shape` 收 `x / y / width / height / fill / payload`，还有动画参数（`animationElapsedTime` / `isAnimating` / `isEntrance`）；Pie 的 `shape` / `activeShape` 另有 `isActive`。

```jsx
// 按数据条件着色的 Bar（替代已废弃的 Cell 列表写法）
<Bar
  dataKey="uv"
  shape={(props) => (
    // props.payload 是该柱对应的原始数据行
    <rect
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      fill={props.payload.uv > 3000 ? '#82ca9d' : '#8884d8'}
    />
  )}
/>
```

这正是官方给 `Cell` 指的迁移方向：逐柱/逐扇区着色，从「渲染一列 `<Cell fill/>`」改为「一个按 `payload` 决定 fill 的 `shape` 函数」（Pie 用 `<Sector {...props} fill={…}/>`，见[图表类型页](./charts-and-data#六-pie-环形-半圆与逐扇区着色)）。

## 三、v3 扩展新能力：直接组合、hooks 与三套坐标系

- **自定义组件直接进树**：v3 起任意 SVG 兼容的自定义 React 组件可直接作为图表子元素，不再必须 `<Customized>` 包裹；`Customized` 仍存在但**不再注入内部状态**——v2 靠 `CategoricalChartState` 的自定义组件是迁移重灾区。
- **公开 hooks（v3）**，在图表树内的自定义组件里读内部状态：

```tsx
// 自定义组件可直接放进图表树，内部用 hooks 读图表状态
const label = useActiveTooltipLabel(); // 当前激活的 tooltip 标签（3.0+）
const plotArea = usePlotArea();        // 真正绘图区（不含 margin/轴/Legend 占位）
const xScale = useXAxisScale();        // 数据 → 像素；useXAxisInverseScale 反向
```

另有 `useOffset`、`useMargin` 等。三者对应 Recharts 的**三套坐标系**：数据域坐标 / 图表像素坐标 / 鼠标原生坐标（`getRelativeCoordinate` 换算）——自绘十字线、拖拽选区、点击换算数据值都靠这套。

- **布局术语**：`margin`（图表外留白）→ `offset`（margin + 轴 + Brush + Legend 的总占位）→ **plot area**（真正画数据的区域）。

## 四、zIndex 图层机制（v3.4+）

SVG 没有 z-index，层级由**绘制顺序**决定。v3.4 引入内部 `zIndex` 分层（默认层级见源码 DefaultZIndexes，如 Line 画在 Area 之上；ReferenceLine 默认 400、ReferenceArea 默认 100）：

- 支持的组件直接传 `zIndex`；不支持的元素用 `<ZIndexLayer zIndex={…}>` 包裹。
- **仅单图表内有效**，不能跨图表比层级。
- 坑：条件渲染会改变 DOM 插入顺序，进而改变默认层级——需要稳定层级就**显式声明 zIndex**（v2 的 `isFront` 即由此机制取代）。

## 五、动画

series 级动画四件套：

| prop | 默认 | 说明 |
| --- | --- | --- |
| `isAnimationActive` | **'auto'（v3）** | 尊重系统 `prefers-reduced-motion`；true 强开 / false 关 |
| `animationBegin` | — | 首渲延迟（ms） |
| `animationDuration` | 400 | 时长（ms） |
| `animationEasing` | 'ease' | ease-in / ease-out / ease-in-out / linear / **spring** / cubic-bezier 字符串 / 自定义函数（0 → 1） |

- 回调：`onAnimationStart` / `onAnimationEnd`。
- **`animationMatchBy`（v3.9+）**：数据更新时新旧数据点的配对方式（按索引 / 追加 / dataKey / 自定义函数），直接决定过渡动画的形态。
- 关动画的三大场景：**SSR**（稳定首帧输出）、**测试/截图**（动画中路径与柱高是中间态，断言 DOM 量值必须 `isAnimationActive={false}`）、**性能**。

## 六、性能：瓶颈本质与优化清单（必考选型判断）

**瓶颈本质**：每个数据点都是 SVG DOM 节点（dot、bar 的 rect、path 上的点），数据量大 + 高频 mousemove ⇒ 全图重渲。

官方 performance 指南的优化清单：

1. **引用稳定**：data、`dataKey` 函数、自定义组件用 `useMemo` / `useCallback` 固定。**dataKey 传内联函数是头号隐形杀手**——每次渲染新引用 ⇒ 全量重算重渲（可上 eslint-plugin-react-perf 兜底）。
2. **组件隔离**：频繁变化的部分拆成独立 memo 组件，静态图形不跟着渲。
3. **关动画 + 关 dot**：`isAnimationActive={false}`、Line `dot={false}`（千点级折线的 dot 是 DOM 大头）。
4. **降采样/聚合**：官方直问「5 万个点用户真的读得懂吗」——先 d3.bin 分箱/抽稀再画。
5. **事件防抖**：mousemove 处理器 debounce。
6. **React DevTools Profiler** + 火焰图定位真正的重渲源。

```jsx
// 性能敏感场景的标准姿势
const data = useMemo(() => rawData.map(transform), [rawData]); // 数据引用稳定
const getUv = useCallback((entry) => entry.uv, []);            // dataKey 函数引用稳定

<Line dataKey={getUv} dot={false} isAnimationActive={false} />
```

**经验阈值与选型边界**：几千点内 Recharts 可用；**万级+数据点、实时高频刷新（行情/监控）⇒ 换 Canvas 系**（Chart.js / ECharts）或 WebGL。这是 SVG DOM 模型的物理边界，不是调参能解决的。

## 七、TypeScript（v3.8+）

- 类型内置于主包（无需 @types）；默认 data / dataKey 是宽松 any。
- **v3.8+ 泛型组件**：dataKey 获得编译期校验 + IDE 补全：

```tsx
type MyData = { name: string; uv: number; pv: number };

// dataKey 拼错直接编译报错
<Area<MyData, number> dataKey="uv" />
```

- 配套**类型工厂**：`createHorizontalChart` / `createVerticalChart` / `createRadialChart` / `createCentricChart`，返回整棵树都强类型的组件族。
- 自定义 Tooltip 的类型是 **`TooltipContentProps`**——v2 的 `TooltipProps` 泛型写法（ValueType, NameType）已改名，沿用旧名会类型报错（迁移必改点）。

## 八、v2 → v3 迁移要点

v3（2025）是一次架构级重写，迁移要点按影响排序：

1. **内部状态管理整体重写**：去 class 化、引入内部 store、新增约 3500 单测；**`CategoricalChartState` 从事件回调与 `Customized` 中彻底移除**——v2 在 `onMouseMove` 回调里读 `activeTooltipIndex` / `activePayload` 的代码全部要按「Tooltip 受控 props + hooks」重写。
2. **defaultProps 警告根治**：React 18.3+ 对函数组件 defaultProps 的弃用警告刷屏（issue #3615，P0，标记 3.0 milestone）是 v2 时代著名噪音；v3 改 JS 默认参数后消失——**不影响功能，根治 = 升 v3**。
3. **`accessibilityLayer` 默认 true**（v2 默认 false）：方向键在数据点间移动 Tooltip、支持屏幕阅读器；键盘事件不再从 `onMouseMove` 透传。
4. **移除的 props**：series `activeIndex`（Scatter/Bar/Pie，受控高亮并入 Tooltip）、Reference 系 `alwaysShow` / `isFront`（改 `ifOverflow` + `zIndex`）、Legend `payload` 覆盖、Scatter/Area 内部 `points`、Pie `blendStroke`、Funnel/Area `animateNewValues`。
5. **Tooltip**：自定义 content 类型改 `TooltipContentProps`；label 可为 number/undefined；新增 `portal` / `axisId` / `defaultIndex`。
6. **行为细节矩阵**：`CartesianGrid` 需匹配 `xAxisId` / `yAxisId`；多 YAxis 按 id 字母序排布；无 ticks 也画轴线；Area `connectNulls` 时 null 视为 0；Legend 顺序不保证；Scatter tooltip 默认带色。
7. **ResponsiveContainer** ref 不再嵌套（v2 是 `ref.current.current`）。
8. **新能力**：zIndex 分层（v3.4）、公开 hooks、直接组合自定义 SVG 组件、极坐标多轴、YAxis `width="auto"`、symlog scale、SunburstChart、泛型组件（v3.8）、`animationMatchBy`（v3.9）。
9. **依赖/环境**：删 `recharts-scale`、`react-smooth`；React 16.8+ / TS 5+ / Node 18+ / 产物 ES6。
10. **Cell 标记 deprecated（v4 移除）**：废弃动因——①它是最后一处 react-is 依赖；②按父上下文变形的 props 无法用 TS 准确类型化。迁移方向：各 series 的 `shape` / `content` 按数据着色。

---

下一页：[参考](../reference)——组件总表、常用 props 表、易错点清单与 v2 → v3 迁移映射速查。
