---
layout: doc
outline: [2, 3]
---

# 参考：Recharts 组件与 props 速查

> 基于 **Recharts 3.9**（npm latest 3.9.2）· 核于 2026-07

## 速查

- **安装**：`npm install recharts react-is`（react-is 版本须与 react 一致）；文档站 [recharts.github.io](https://recharts.github.io)（recharts.org 已 404）
- **环境（v3）**：React 16.8+ / TS 5+ / Node 18+；产物 ES6；ESM / CJS / UMD
- **心智**：图表 = JSX 组件树；数据 = 对象数组 + series `dataKey`（字符串 'a.b' / 索引 / 函数——函数须引用稳定）
- **最小折线图**：`LineChart` + `XAxis` + `YAxis` + `Tooltip` + `Line type="monotone"`
- **第一坑**：图表必须有确定宽高才渲染；`ResponsiveContainer` 铁律 = 父容器有确定尺寸；v3.3+ 可改根组件 `responsive` + style/aspectRatio
- **轴默认**：XAxis "category" / YAxis "number"——数字数据必须显式 `type="number"`，否则被当离散分类
- `domain`：`[0, 100]` / `['dataMin', 'dataMax']` / 函数元素；**`allowDataOverflow` 阻扩域 + 裁剪**（配 Brush 真放大）
- `scale="log"` 必须显式 domain 且不能含 0；v3 新 "symlog"、`niceTicks`（snap125 等）
- **双 Y 轴**：`yAxisId` 配对；v3 按 id 字母序排布；`CartesianGrid` 须匹配轴 ID 否则不渲染
- **Bar 堆叠**：相同 `stackId` 自动堆叠（忘写 ⇒ 重叠）；`stackOffset="expand"` = 100% 堆叠
- **横向条形图**：`layout="vertical"` + X number + Y category(dataKey) 三件套
- **Area 渐变**：`<defs>` + `<linearGradient>` + `fill="url(#id)"`
- **Pie**：自带 `data` prop；`innerRadius` 正值 = 环形；startAngle 180 → endAngle 0 = 半圆
- **混合图**：单类型图表只吃自己的 series，混排必须 `ComposedChart`
- **Tooltip 自定义**：`content` 收 active/payload/label，头两行判空；类型 `TooltipContentProps`（v3 改名）
- **payload 双层**：`payload[0].value` 是 series 值、`payload[0].payload` 是原始数据行
- **Legend 显隐**：`onClick` + state + series `hide`（hide 不画但留在 Legend）
- **ReferenceLine**：`ifOverflow` 默认 "discard" ⇒ 出界不画；目标线出界要 **"extendDomain"**
- **Brush**：dataKey / startIndex / endIndex / onChange；配 `allowDataOverflow` 才是真缩放；`syncId` 多图联动
- **四态 prop**：dot / label / tick / shape / content / cursor = boolean / 对象 / 元素 / 函数；SVG 上下文返回 SVG、Tooltip/Legend content 返回 HTML
- **Cell 已废弃（v4 移除）**：逐项着色改 series `shape` 函数（按 `props.payload` 决定 fill）
- **动画**：`isAnimationActive` v3 默认 'auto'（尊重 prefers-reduced-motion）；测试/SSR/性能场景关动画
- **性能四板斧**：引用稳定（useMemo/useCallback）、组件隔离、关动画关 dot、降采样；**万级+点换 Canvas 系**
- **v3 亮点**：`accessibilityLayer` 默认 true（键盘导航）、公开 hooks、zIndex 图层、portal、泛型组件
- **v2 → v3 崩点**：CategoricalChartState 删除、series activeIndex 移除、alwaysShow/isFront 移除、Legend payload 移除、TooltipProps 改名
- **Scatter**：X/Y 都是 number 轴；`ZAxis range={[60, 400]}` 映射点大小；ErrorBar 必须给 direction
- **Radar 组件树**：`PolarGrid` + `PolarAngleAxis dataKey` + `PolarRadiusAxis` + `Radar`
- **ReferenceArea**：x1/x2/y1/y2 任意省略即顺延到图表边界（只给 y1/y2 = 全宽横带高亮）
- **LabelList**：`position` 20 余种 / `formatter` 只能返回字符串或数字 / `content` 自绘 SVG
- **事件**：图表级 `onClick` / `onMouseMove`（v3 签名 `CategoricalChartFunc`）；series 级收 `(data, index, event)`

## 一、组件总表

| 类别 | 组件 | 备注 |
| --- | --- | --- |
| 图表容器 | `LineChart` `BarChart` `AreaChart` `PieChart` `ScatterChart` `RadarChart` `RadialBarChart` `ComposedChart` `FunnelChart` `Treemap` `Sankey` `SunburstChart` | `SunburstChart` v3 新增；单类型容器只接受自己的 series |
| 响应式 | `ResponsiveContainer`；图表根 `responsive` prop | 后者 v3.3+ 新推荐 |
| 直角坐标部件 | `XAxis` `YAxis` `ZAxis` `CartesianGrid` `Brush` | `ZAxis` 给 Scatter 映射点大小 |
| 极坐标部件 | `PolarGrid` `PolarAngleAxis` `PolarRadiusAxis` | v3 极坐标也支持多轴 |
| series | `Line` `Bar` `Area` `Pie` `Scatter` `Radar` `RadialBar` `Funnel` | 通用 `name` / `unit` / `hide` |
| 交互 | `Tooltip` `Legend` | 均为 HTML 层；v3 支持 `portal` |
| 参考/标注 | `ReferenceLine` `ReferenceArea` `ReferenceDot` `Label` `LabelList` `ErrorBar` | Reference 系用数据域坐标 |
| 图形/底层 | `Sector` `BarStack` `ZIndexLayer` `Customized` `Cell` | `BarStack` 整摞圆角；`Customized` 不再注入状态；**`Cell` 已废弃** |

## 二、坐标轴常用 props

| prop | XAxis 默认 | YAxis 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | "category" | "number" | 必考默认差异 |
| `dataKey` | — | — | 轴取值字段 |
| `domain` | 自动 | 自动 | 仅 number 轴生效 |
| `allowDataOverflow` | false | false | 阻止扩域 + 裁剪出界图形 |
| `interval` | "preserveEnd" | — | 数字 n 或 preserve 系策略串 |
| `tickFormatter` | — | — | 刻度格式化函数 |
| `tickCount` | 5 | 5 | 期望刻度数 |
| `niceTicks` | — | — | v3：'none' / 'auto' / 'adaptive' / 'snap125' |
| `scale` | "auto" | "auto" | "log"（须显式 domain 避 0）/ "sqrt" / "symlog"（v3）/ d3-scale 对象 |
| `orientation` | "bottom" | "left" | YAxis 可 "right" |
| `width` | — | 60 或 'auto'（v3） | 长标签自适应 |
| `xAxisId` / `yAxisId` | 0 | 0 | 多轴配对；CartesianGrid 须匹配 |
| 其他 | — | — | `allowDecimals` `allowDuplicatedCategory` `hide` `mirror` `padding` `unit` `label` `reversed` `ticks` `tick` `minTickGap` `angle` |

## 三、Tooltip 常用 props

| prop | 默认 | 说明 |
| --- | --- | --- |
| `content` | — | 自定义渲染，收 active / payload / label |
| `formatter` | — | `(value, name, item, index, payload)` 返回 `[显示值, 显示名]` |
| `labelFormatter` / `separator` | — / " : " | 标签行格式化 / 名值分隔符 |
| `cursor` | true | false 关闭；可传 SVG props/元素 |
| `active` / `defaultIndex` | 自动 / — | 受控显隐 / 首渲即高亮（v3） |
| `trigger` | "hover" | 或 "click" |
| `shared` / `position` / `offset` | — / — / 10 | 轴共享模式 / 锁定位置 / 鼠标偏移 |
| `filterNull` / `itemSorter` | true / "name" | 滤 null / 排序 |
| `portal` / `axisId` | — / 0 | v3 新：渲染到图表外 / 多轴跟随 |
| `allowEscapeViewBox` | x、y 均 false | 允许超出图表框 |
| 样式四层 | 空对象 | `wrapperStyle` `contentStyle` `itemStyle` `labelStyle` |

## 四、动画 props（series 级）

| prop | 默认 | 说明 |
| --- | --- | --- |
| `isAnimationActive` | 'auto'（v3） | 尊重 prefers-reduced-motion；true 强开 / false 关 |
| `animationBegin` | — | 首渲延迟 ms |
| `animationDuration` | 400 | 时长 ms |
| `animationEasing` | 'ease' | ease-in / ease-out / ease-in-out / linear / spring / cubic-bezier / 自定义函数 |
| `animationMatchBy` | — | v3.9+：数据更新时新旧点配对（索引 / 追加 / dataKey / 函数） |
| `onAnimationStart` / `onAnimationEnd` | — | 动画回调 |

## 五、v2 → v3 迁移映射

| v2 写法 | v3 替代 |
| --- | --- |
| 事件回调读 `CategoricalChartState`（activeTooltipIndex / activePayload） | Tooltip 受控（`defaultIndex` / `active` / `trigger`）+ hooks（`useActiveTooltipLabel` 等） |
| series `activeIndex`（Scatter / Bar / Pie 受控高亮） | 已移除，激活态统一收敛到 Tooltip |
| ReferenceLine `alwaysShow` / `isFront` | `ifOverflow="extendDomain"` + `zIndex`（v3.4 图层机制） |
| Legend `payload` 整体伪造图例 | 已移除，自定义 `content` 自行渲染 |
| `TooltipProps` 泛型类型 | `TooltipContentProps` |
| `Customized` 注入内部状态 | 自定义 SVG 组件直接进树 + 公开 hooks |
| defaultProps 弃用警告刷屏（issue #3615） | v3 改 JS 默认参数，警告消失 |
| ResponsiveContainer `ref.current.current` | ref 不再嵌套 |
| `Cell` 逐项着色 | series `shape` / `content` 按 payload 着色（Cell v4 移除） |

## 六、易错点清单

- **ResponsiveContainer 父高度 0 ⇒ 整图不渲染**（最高频）：父级 auto 高度测得 0；解法 = 父 div 固定 height / flex 链传高 / 改用 v3.3 `responsive` + aspectRatio。
- **数字数据落 category 轴**：XAxis 默认 "category"，数字被当离散分类（等距、按出现序）——散点/时间序列必须 `type="number"`。
- **堆叠忘 stackId**：多个 Bar/Area 重叠遮挡，视觉像「只有一个 series」。
- **自定义 Tooltip 不判 active/payload**：payload 可能 undefined/空数组，直接解构崩溃；标准头两行 `if (!active || !payload?.length) return null`。
- **payload 双层同名**：`payload[0].payload` 才是原始数据行，`payload[0].value` 是当前 series 值。
- **Cell 已废弃**：v3 可用、v4 移除；新代码用 shape/content；react-is 目前仍须与 react 版本配对安装。
- **v2 代码迁 v3 崩点**：读 activeTooltipIndex / activePayload、series activeIndex、alwaysShow、Legend payload——全按新 API 重写。
- **自定义 content 类型名**：v3 是 `TooltipContentProps`，沿用 v2 `TooltipProps` 泛型写法类型报错。
- **log 轴不给 domain**：`scale="log"` 必须显式 domain，含 0/负数直接异常。
- **ReferenceLine 画不出来**：目标值在 domain 外时默认 `ifOverflow="discard"` 直接丢弃——要 "extendDomain"。
- **多轴图 CartesianGrid 消失**：v3 网格须与轴 xAxisId/yAxisId 匹配。
- **SVG/HTML 混淆**：Legend/Tooltip content 返回 HTML；tick/label/shape 必须返回 SVG，塞 `<div>` 不渲染或报错。
- **dataKey 传内联函数**：每次渲染新引用 ⇒ 全量重算重渲，大数据卡顿首因；`useCallback` 固定。
- **动画期取 DOM 量值**：首渲动画中路径/柱高是中间态，截图/测试断言需 `isAnimationActive={false}`。
- **zIndex 期望跨图生效**：仅单图表内有效；条件渲染改变插入顺序，层级要显式。
- **Brush 不配裁剪**：不加 `allowDataOverflow`/domain 时选区外数据仍参与 domain 计算，「放大」不彻底。
- **SSR 水合抖动**：ResponsiveContainer 服务端无尺寸 ⇒ 首帧空/跳变；`ssr: false` 或固定尺寸 + `initialDimension`。
- **defaultProps 警告刷屏（v2 时代）**：React 18.3+ 噪音（issue #3615），不影响功能，根治 = 升 v3。

## 七、选型对比（React 项目视角）

| 维度 | **Recharts** | Chart.js (react-chartjs-2) | ECharts (echarts-for-react) | visx |
| --- | --- | --- | --- | --- |
| 范式 | **JSX 组件组合声明** | Canvas 命令式 + config，React 靠包装层 | 单一 option 大对象，React 靠包装层 | D3 原语 + React 自己拼 |
| 渲染 | SVG | Canvas | Canvas/SVG 可切 | SVG（自决） |
| 定制自由度 | 高（组件级扩展点） | 中（插件体系） | 高（option 海量配置） | 极高（无封装） |
| 大数据/高刷 | 弱（SVG DOM 瓶颈） | 强 | 强（增量渲染/降采样内建） | 取决于实现 |
| 功能广度 | 常规统计图全 + Treemap/Sankey/Sunburst | 常规图 | **最广**（3D/地图/dataZoom/GL） | 无上限但全手工 |
| React 心智契合 | **最高**（图=组件树） | 低（ref 命令式） | 低（两套心智） | 高（但样板多） |
| 可及性 | v3 默认键盘导航 | 需自配 | 需自配 | 自己实现 |
| 周下载（2026-06 实测） | **51.5M** | 12.8M | 3.7M | 量级更小 |

**选型一句话**：React 项目常规 Dashboard/后台报表（千点内、快速交付、与组件状态深度联动）⇒ Recharts 默认首选；万级+点、实时高刷 ⇒ Canvas 系；要地图/3D/大屏 ⇒ ECharts；设计系统级完全定制 ⇒ visx/D3；非 React 技术栈 ⇒ Recharts 直接出局。

## 八、资源链接

- [官方文档站](https://recharts.github.io) —— Guide + API + Examples + Storybook 一体（老域名 recharts.org 已 404）
- [Guide：performance](https://recharts.github.io/en-US/guide/performance/) / [zIndex](https://recharts.github.io/en-US/guide/zIndex/) / [cell（Cell → shape 迁移）](https://recharts.github.io/en-US/guide/cell/) / [typescript](https://recharts.github.io/en-US/guide/typescript/) 等 15 页
- [API 组件总表](https://recharts.github.io/en-US/api/)
- [3.0 迁移指南（Wiki）](https://github.com/recharts/recharts/wiki/3.0-Migration-Guide)
- [v3.0.0 Release Notes](https://github.com/recharts/recharts/releases/tag/v3.0.0)
- [defaultProps 警告 issue #3615](https://github.com/recharts/recharts/issues/3615)
- [GitHub 仓库](https://github.com/recharts/recharts)

---

回到[本叶概览](./index)，或从[入门](./getting-started)重新过一遍主线。
