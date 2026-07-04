---
layout: doc
outline: [2, 3]
---

# 入门：声明式组合、安装与第一个图表

> 基于 **Recharts 3.9**（npm latest 3.9.2）· 核于 2026-07

## 速查

- **定位**：用 React 组件组合声明图表的 **SVG** 图表库；D3 只作计算子模块（scale/shape），渲染交给 React + 原生 SVG
- **三大官方原则**：简单部署、SVG 原生轻依赖、声明式组件
- **安装**：`npm install recharts react-is`
  - **react-is 版本必须与 react 一致**；`Cell` 是最后一处依赖 react-is 的代码，v4 移除 Cell 后该依赖将取消
- **版本**：当前 3.9.2；2025 年 v3 发布后为唯一主线
- **体量**：周下载约 5150 万（React 生态图表库第一，约为 chart.js 4 倍、echarts 14 倍）
- **环境要求（v3 起）**：React 16.8+（Hooks）、TypeScript 5+、Node 18+
- **产物**：ES6（不再带 ES5 polyfill）；提供 ESM / CJS / UMD（`window.Recharts`）
- **已移除依赖**：`recharts-scale`、`react-smooth`（功能内部化）
- **心智模型**：图表 = JSX 组件树；加图例 = 加 `<Legend/>`，删网格 = 删 `<CartesianGrid/>`
- **数据格式**：**对象数组**；每条 series 用 `dataKey` 从对象取值
- **dataKey 三态**：字符串（支持 `'a.b'` 路径）/ 数字索引 / 函数 `(entry) => value`（函数必须引用稳定，详见性能页）
- series 通用 `name`：Tooltip / Legend 里的显示名
- series 通用 `unit`（数值单位）、`hide`（隐藏但保留在 Legend——图例切换显隐的基础）
- **最小折线图**：`LineChart` + `XAxis` + `YAxis` + `Tooltip` + `Line`
- `<Legend/>`、`<CartesianGrid strokeDasharray="3 3"/>` 即插即用
- Line `type="monotone"` 平滑曲线（不过冲）；`stroke` / `strokeWidth` 描边
- **分层**：Tooltip / Legend 是 **HTML** 元素，其余全是 **SVG** 元素（自定义时上下文别搞混）
- v3 起任意 SVG 兼容的自定义 React 组件可直接放进图表树（不再必须 `Customized` 包裹）
- **第一坑**：图表必须有**确定 width/height 才渲染**——高度为 0 或未指定 ⇒ 页面空白
- 图表根 `width` / `height`：数字（px）或百分比字符串
- `margin` 默认四边 5
- **v3.3+ 新推荐**：图表根组件 `responsive` prop（boolean，默认 false）——监听容器尺寸自动重渲，兼容 flex/grid
  - 配 style 给 width / maxWidth / maxHeight / aspectRatio（官方新示例统一写法）
- **经典方案 `ResponsiveContainer`**：`width` / `height` 默认 "100%"
  - **铁律：父容器必须有确定尺寸**——父级高度靠内容撑（auto）时测得 0 ⇒ 图表不渲染
  - 经典解法：父 div 固定 height，或 flex 链传高
  - 其他 props：`aspect`（宽高比，给定后高度由宽度算出）、`minWidth` / `minHeight`
  - `debounce`（默认 0，ms，防抖 resize）、`onResize`、`initialDimension`
  - 基于 **ResizeObserver**（老浏览器需 polyfill）
  - v3 修复了 v2 的嵌套 ref（`ref.current.current`）问题
- **SSR / Next.js**：响应式依赖浏览器测量，服务端量不到尺寸 ⇒ 首帧空白 / 水合尺寸跳变
  - 缓解：`dynamic(() => import(...), { ssr: false })` 包图表组件；或固定 width/height + `initialDimension`；关动画减少水合抖动
- **进阶顺序**：[图表类型与数据](./guide-line/charts-and-data) → [坐标轴与 domain](./guide-line/axes-and-domain) → [Tooltip / Legend / 参考系](./guide-line/tooltip-legend-reference) → [自定义与性能](./guide-line/customization-and-performance)

## 一、Recharts 是什么

Recharts 是**用 React 组件组合（composition）声明图表的 SVG 图表库**：图表即 JSX 组件树，D3 只作计算子模块（scale/shape），渲染交给 React + 原生 SVG。官方三大设计原则：**简单部署、SVG 原生轻依赖、声明式组件**。

它与另外两大流行方案的本质区别在「图怎么写」：

| 库 | 范式 | 一张图怎么写 |
| --- | --- | --- |
| **Recharts** | JSX 组件组合声明 | 一棵组件树：配置 = 子组件 + props |
| Chart.js | Canvas 命令式 | 拿画布上下文 `new Chart(ctx, config)` |
| ECharts | option 声明 | 一个大 `option` 对象描述一切 |

对 React 开发者，这意味着**零心智切换**：增加图例是加一行 `<Legend/>`，删除网格是删掉 `<CartesianGrid/>`，联动交互就是普通的 state + props。代价也明确：SVG DOM 数量随数据点线性增长，万级点 / 高频实时刷新要换 Canvas 方案；高度定制视觉不如 visx / D3 自由（详见[自定义与性能](./guide-line/customization-and-performance)的选型边界）。

## 二、安装与环境

```bash
npm install recharts react-is
```

- **react-is 版本必须与 react 保持一致**。这是历史包袱：`Cell` 组件是库内最后一处依赖 react-is 的代码，v4 移除 Cell 后该依赖将一并取消。
- **环境要求（v3 起）**：React 16.8+（Hooks）、TypeScript 5+、Node 18+；构建产物为 ES6，不再附带 ES5 polyfill。
- **分发形态**：ESM / CJS / UMD（UMD 挂 `window.Recharts`）。
- v3 已移除 `recharts-scale`、`react-smooth` 两个外部依赖（功能内部化）。
- 文档站注意：老域名 recharts.org **已 404**，现役文档站为 [recharts.github.io](https://recharts.github.io)（Guide + API + Examples 一体）。

## 三、心智模型：图表 = JSX 组件树

第一个折线图，完整可运行：

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// 数据 = 对象数组；每条 series 用 dataKey 从对象取字段
const data = [
  { name: 'Page A', uv: 4000, pv: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398 },
];

export function MyChart() {
  return (
    <LineChart width={700} height={400} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />  {/* 经典虚线网格，删掉这行即无网格 */}
      <XAxis dataKey="name" />                 {/* X 轴取 name 字段 */}
      <YAxis />
      <Tooltip />                              {/* 悬停提示：零配置即用 */}
      <Legend />                               {/* 图例：加一行即有 */}
      <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
    </LineChart>
  );
}
```

读懂这棵树，就读懂了 Recharts 的全部理念：

- **数据格式是对象数组**，每条 series（这里是两条 `<Line>`）用 `dataKey` 声明取哪个字段。
- **dataKey 三态**：字符串（支持 `'a.b'` 嵌套路径）、数字索引、函数 `(entry) => value`。函数形态必须引用稳定（`useCallback` 固定），否则每次渲染新引用会触发全量重算——这是大数据卡顿的头号隐形杀手。
- series 通用 props：`name`（Tooltip / Legend 里的显示名）、`unit`（数值单位）、`hide`（隐藏但保留在 Legend 中，是图例切换显隐的基础）。
- **分层要记牢**：`Tooltip` / `Legend` 渲染为 **HTML** 元素，其余全是 **SVG** 元素。后面自定义任何部件时，返回 HTML 还是 SVG 取决于所处上下文，混了就不渲染或报错。
- v3 起，任意 SVG 兼容的自定义 React 组件可以**直接**作为图表子元素参与组合，不再必须用 `Customized` 包裹。

## 四、尺寸与响应式：第一坑与两种正确姿势

### 图表必须有确定宽高才渲染

**高度为 0 或未指定 ⇒ 页面空白**，这是新手第一坑。图表根组件的 `width` / `height` 接受数字（px）或百分比字符串；`margin` 默认四边各 5。写死宽高最稳，但不响应式——于是有下面两种姿势。

### 姿势一（v3.3+ 新推荐）：根组件 responsive

```jsx
// responsive 监听容器尺寸自动重渲，天然兼容 flex / grid 布局
<AreaChart
  responsive
  data={data}
  style={{ width: '100%', maxWidth: 700, maxHeight: '70vh', aspectRatio: 1.618 }}
>
  {/* …轴与 series… */}
</AreaChart>
```

`responsive` 是图表根组件的 boolean prop（默认 false），开启后尺寸约束全部交给 style（width / maxWidth / maxHeight / aspectRatio），官方新示例已统一用这种写法。

### 姿势二（经典，仍完全支持）：ResponsiveContainer

```jsx
import { ResponsiveContainer, LineChart } from 'recharts';

// 铁律：父容器必须有确定尺寸——这里显式给 height: 300
<div style={{ height: 300 }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>{/* … */}</LineChart>
  </ResponsiveContainer>
</div>
```

- `width` / `height` 默认就是 "100%"；还支持 `aspect`（给定宽高比后高度由宽度算出）、`minWidth` / `minHeight`、`debounce`（默认 0，防抖 resize）、`onResize`、`initialDimension`。
- **铁律：父容器必须有确定尺寸**。父级高度靠内容撑（auto）时测得 0，图表整个不渲染——最高频翻车点。解法：父 div 固定 height，或用 flex 链把高度传下来。
- 实现基于 **ResizeObserver**（老浏览器需 polyfill）；v3 修复了 v2 的嵌套 ref 问题（不再是 `ref.current.current`）。

### SSR / Next.js 注意

`responsive` / `ResponsiveContainer` 都依赖浏览器测量，服务端量不到尺寸 ⇒ 首帧空白或水合时尺寸跳变。通行做法：Next.js 里用 `dynamic(() => import(...), { ssr: false })` 包图表组件；或给固定 width/height + `initialDimension`；再配 `isAnimationActive={false}` 减少水合抖动。

## 五、下一步

跑通第一张图后，按顺序进阶：[图表类型与数据](./guide-line/charts-and-data)把折线之外的整个图表家族（堆叠柱、渐变面积、环形饼、混合图）过一遍，再进[坐标轴与 domain](./guide-line/axes-and-domain)搞定 number vs category、双轴与缩放。
