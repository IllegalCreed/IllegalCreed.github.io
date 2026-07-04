---
layout: doc
---

# Recharts

React 生态下载量第一的图表库（npm 周下载约 5150 万，约为 chart.js 的 4 倍、echarts 的 14 倍）：用 **React 组件组合（composition）声明图表**——图表就是一棵 JSX 组件树，`<LineChart>` 里放 `<XAxis/>`、`<Tooltip/>`、`<Line/>`；加图例 = 加一行 `<Legend/>`，删网格 = 删掉 `<CartesianGrid/>`。D3 只作底层计算子模块（scale/shape），渲染完全交给 React + **原生 SVG**。当前版本 **3.9.x**：2025 年发布的 v3 对内部状态管理整体重写（去 class、内部 store、新增约 3500 单测），是当前唯一主线；此后 v3.3 加图表根组件 `responsive`、v3.4 加 `zIndex` 图层机制、v3.8 加 TypeScript 泛型组件、v3.9 加 `animationMatchBy`。

## 评价

**优点**

- **React 心智零切换**：图 = 组件树、改图 = 改 JSX/props，图表与组件状态天然联动；对比 Chart.js 的 Canvas 命令式（`new Chart(ctx, config)`）与 ECharts 的单一 option 大对象，Recharts 的「配置」就是子组件与 props
- **声明式组合极易增删部件**：Tooltip / Legend / 网格 / 参考线全部即插即用，一行组件的事
- **SVG 真实 DOM**：每个图形都可被 CSS / DevTools 直接查改，调试与样式化友好
- **v3 可及性默认开启**：`accessibilityLayer` 默认 true，方向键在数据点间导航、支持屏幕阅读器
- **扩展体系完整**：dot / label / tick / shape / content 等 prop 统一接受四态（boolean / 对象 / 元素 / 函数），v3 还开放公开 hooks，自定义 SVG 组件可直接放进图表树

**缺点**

- **强绑 React**：非 React 技术栈直接出局
- **大数据是硬边界**：每个数据点都是 SVG DOM 节点，数据量线性膨胀；万级点、实时高刷（行情 / 监控）应换 Canvas 系（ECharts / Chart.js）
- **高度定制视觉不如 visx / D3 自由**：组件封装既是便利也是天花板
- **功能广度不及 ECharts**：无 3D / 地图 / 大屏套件（常规统计图 + Treemap / Sankey / Sunburst 够用，超出即换库）

## 本叶地图

- [入门](./getting-started) —— 声明式组合心智、安装（recharts + react-is）、第一个折线图、尺寸与响应式正确姿势（`responsive` prop / `ResponsiveContainer`）
- [图表类型与数据](./guide-line/charts-and-data) —— 图表家族全览、dataKey 三态、Bar `stackId` 堆叠、Area 渐变填充、Pie 环形图、`ComposedChart` 混合
- [坐标轴与 domain](./guide-line/axes-and-domain) —— number vs category、domain 与 `allowDataOverflow`、刻度控制、log/symlog、双 Y 轴、`CartesianGrid`、Brush 缩放
- [Tooltip / Legend / 参考系](./guide-line/tooltip-legend-reference) —— 自定义 Tooltip content、payload 结构、Legend 显隐切换、ReferenceLine/Area/Dot、Label / ErrorBar
- [自定义与性能](./guide-line/customization-and-performance) —— shape 与四态 prop、v3 hooks 与 zIndex、动画、性能优化清单、TypeScript 泛型、v2 → v3 迁移
- [参考](./reference) —— 组件 / props / 易错点 / 迁移映射速查表 + 资源链接

## 文档地址

[Recharts Docs](https://recharts.github.io) —— Guide + API + Examples + Storybook 一体（⚠️ 老域名 recharts.org 已 404）

## GitHub 地址

[recharts/recharts](https://github.com/recharts/recharts)

## 幻灯片地址

<a href="/SlideStack/recharts-slide/" target="_blank">Recharts</a>
