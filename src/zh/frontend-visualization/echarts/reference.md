---
layout: doc
outline: [2, 3]
---

# 参考：option 结构与 API 速查

> 基于 Apache ECharts 6.1 · 核于 2026-07

## 速查

- **一句话**：基于 zrender 的声明式图表库——一个 option 描述整张图；Canvas / SVG 双渲染器；`echarts@6.1.0`，Apache-2.0。
- **上手四步**：有宽高的 div → `echarts.init(dom, theme?, opts?)` → 组装 option → `chart.setOption(option)`。
- **按需引入五模块**：`echarts/core` + `echarts/charts`（XxxChart）+ `echarts/components`（XxxComponent）+ `echarts/renderers`（必选其一）+ `echarts/features`，统一 `echarts.use([...])`；TS 用 `ComposeOption` 组合严格类型。
- **setOption 合并三模式**：默认普通合并（数组组件按 index 对位，**删不掉**）/ `notMerge: true` 全量替换 / `replaceMerge: 'series'` 按 id 对齐可删（v5+）。
- **clear vs dispose**：清空可复用 vs 彻底销毁；SPA 卸载必 dispose。
- **resize**：window resize 或 ResizeObserver（容器级）+ 防抖；卸载解绑。
- **dataset + encode**：source 三格式、dimensions 声明类型、encode 映射通道、`seriesLayoutBy`、`datasetIndex`；transform（filter / sort / ecStat）链式派生。
- **tooltip**：`trigger: 'item' / 'axis' / 'none'`；模板变量 `{a}` 系列名 / `{b}` 名称 / `{c}` 值 / `{d}` 百分比；回调 params 在 axis 触发时是**数组**；`valueFormatter`（v5.3+）、`confine`。
- **legend 坑**：图例项名必须 = `series.name`，否则不显示不联动。
- **dataZoom**：inside / slider 并用；`filterMode` 默认 'filter' 会过滤数据（联动轴跟着变），只裁窗口用 'none' / 'weakFilter'。
- **visualMap**：continuous / piecewise；`min` / `max`（continuous 必填）、`dimension`、`seriesIndex`、`inRange` / `outOfRange`。
- **事件两类**：鼠标事件（click 等，params.componentType / seriesIndex / dataIndex / dataType 必背）+ 组件行为事件（legendselectchanged / datazoom / rendered / finished）；query 第二参过滤；`dispatchAction` 触发行为不触发鼠标事件；空白点击走 `getZr()`。
- **性能分层**：按需引入（包体）→ large / progressive（绘制）→ sampling / appendData / dataZoom（数据量）→ useDirtyRect / TypedArray / animation off（渲染层）→ dispose / SVG 多实例（治理）。
- **appendData**：仅 scatter / lines；不支持 dataset。
- **SSR**：`{ renderer: 'svg', ssr: true }` + `renderToSVGString()`；仅 SVG；服务端 dispose；水合走懒加载全量或 v5.5 约 4KB 轻量运行时。
- **地图**：v5 起 GeoJSON 不内置，`registerMap` 后才能用 map series / geo 组件；散点上地图 `coordinateSystem: 'geo'`。
- **主题**：init 传名 / registerTheme；v6 `setTheme` 动态切换（后续 setOption 配 notMerge）；`darkMode` + matchMedia 联动。
- **v6 关键词**：新默认主题（v5.js 回退）、chord、轴级 jitter（蜂群）、breaks 断轴、matrix 坐标系、thumbnail、registerCustomSeries、轴防溢出默认开（outerBoundsMode / nameMoveOverlap 回退）、richInheritPlainLabel、legacyViewCoordSysCenterBase。
- **candlestick 数据序**：`[open, close, lowest, highest]`（不是 OHLC）。
- **Vue 集成**：实例存 shallowRef / 普通变量，严禁 reactive 深层代理；onMounted init / onBeforeUnmount dispose。

## 一、option 顶层结构速查

一个 option = 组件声明集合 + 全局属性。

| 类别 | 顶层项 | 作用 |
| --- | --- | --- |
| 标题 / 图例 | `title`、`legend` | 标题；图例（项名对应 series.name） |
| 直角坐标系 | `grid`、`xAxis`、`yAxis` | 绘图区网格；x / y 轴（轴挂 grid，series 挂轴） |
| 极坐标系 | `polar`、`radiusAxis`、`angleAxis` | 极坐标容器与径向 / 角度轴 |
| 其他坐标系 | `radar`、`geo`、`calendar`、`singleAxis`、`parallel` + `parallelAxis` | 雷达指标 / 地理 / 日历 / 单轴 / 平行坐标 |
| **v6 新坐标系** | `matrix` | 矩阵坐标系，表格化编排图表与组件 |
| 数据 | `dataset` | 数据集（source / dimensions / transform） |
| 交互组件 | `tooltip`、`axisPointer`、`dataZoom`、`visualMap`、`toolbox`、`brush`、`timeline` | 提示框 / 轴指示器 / 缩放 / 视觉映射 / 工具栏 / 刷选 / 时间轴 |
| 图形 / 导航 | `graphic`、`thumbnail`（v6） | 自定义图形元素（水印等）；graph / geo 漫游缩略图 |
| 无障碍 | `aria` | `aria: { enabled: true }` 总控（v5 起，旧名 aria.show 已过时）；`aria.decal.show` 贴花补色盲 |
| 系列 | `series` | 图表本体，type 决定图表类型 |
| 全局属性 | `color`、`backgroundColor`、`textStyle`、`darkMode`、`animation` 系列、`stateAnimation` | 调色盘 / 背景 / 全局字体 / 深色模式 / 动画 |
| v6 兼容开关 | `richInheritPlainLabel`、`legacyViewCoordSysCenterBase` | rich 继承回退；center 百分比基准回退 |

series 通过 `coordinateSystem` + 索引（`xAxisIndex` / `yAxisIndex` / `polarIndex` / `geoIndex` / `calendarIndex` / `matrixIndex`）挂到坐标系。

## 二、echarts.* 静态 API

| API | 作用 |
| --- | --- |
| `echarts.init(dom, theme?, opts?)` | 创建实例；opts：renderer / width / height / devicePixelRatio / locale / useDirtyRect / useCoarsePointer / ssr |
| `echarts.use([...])` | 按需注册图表 / 组件 / 渲染器 / 特性 |
| `echarts.getInstanceByDom(dom)` | 取 DOM 上已有实例（防重复 init） |
| `echarts.connect(chartsOrGroup)` | 多图联动（数组或 group 值） |
| `echarts.registerTheme(name, obj)` | 注册自定义主题 |
| `echarts.registerMap(name, geoJSONOrSvg)` | 注册地图数据（v5 起 GeoJSON 不内置） |
| `echarts.registerTransform(fn)` | 注册外部数据变换（如 ecStat 系列） |
| `echarts.registerCustomSeries(type, renderItem)` | v6：注册可复用自定义系列 |

## 三、chart.* 实例 API

| API | 作用 | 备注 |
| --- | --- | --- |
| `setOption(option, opts?)` | 声明 / 更新图表 | notMerge / replaceMerge / lazyUpdate / silent |
| `resize(opts?)` | 适配新尺寸 | width / height / silent / animation |
| `setTheme(nameOrObj)` | v6 动态换主题 | 不销毁实例；之后 setOption 配 notMerge |
| `showLoading()` / `hideLoading()` | 加载动画 | 异步取数期间 |
| `appendData({ seriesIndex, data })` | 增量加载 | 仅 scatter / lines；不支持 dataset |
| `on(event, query?, handler)` | 事件监听 | query 过滤：'series.line' 或对象 |
| `dispatchAction({ type, ... })` | 代码触发行为 | highlight / showTip / legendSelect… |
| `getZr()` | 底层 zrender 实例 | 空白区域点击监听 |
| `renderToSVGString()` | SSR 输出 SVG 字符串 | 需 init 时 ssr: true + svg |
| `clear()` | 清空内容，实例可复用 | 与 dispose 相对 |
| `dispose()` | 彻底销毁实例 | SPA 卸载必调 |
| `group`（属性） | 联动分组标识 | 配 echarts.connect(group) |

## 四、常用事件与 action 对照

| 交互 | 事件（被动监听） | action（主动触发） |
| --- | --- | --- |
| 高亮 / 取消 | `highlight` / `downplay` | `highlight` / `downplay` |
| 提示框 | — | `showTip`（配 seriesIndex + dataIndex） |
| 图例 | `legendselectchanged` | `legendSelect` / `legendUnSelect` / `legendToggleSelect` |
| 缩放 | `datazoom` | `dataZoom` |
| 视觉映射 | — | `selectDataRange` |
| 刷选 | `brushSelected` | `brush` |
| 断轴（v6） | — | `expandAxisBreak` / `collapseAxisBreak` |
| 渲染生命周期 | `rendered`（每帧）/ `finished`（完成，截图时机） | — |

鼠标事件另有：click / dblclick / mousedown / mousemove / mouseup / mouseover / mouseout / globalout / contextmenu（dispatchAction 不触发它们）。

## 五、性能手段对照

| 手段 | 配置 | 适用 | 代价 / 限制 |
| --- | --- | --- | --- |
| 按需引入 | core + use | 所有生产项目 | 漏注册报 Component not exists |
| large | `large: true` + `largeThreshold`（默认 2000） | bar / scatter 大数据 | 单点样式 / 交互定制失效 |
| progressive | `progressive` + `progressiveThreshold` + `progressiveChunkMode` | line（默认每帧 1e5）/ candlestick（3e3，阈值 1e4） | 完整画面需多帧 |
| appendData | `chart.appendData()` | 千万级分片加载 | 仅 scatter / lines；不配 dataset |
| sampling | line `sampling: 'lttb'` 等 | 点数远超像素宽 | 显示为降采样结果 |
| dataZoom 窗口 | 初始 start / end | 首屏减量 | — |
| 脏矩形 | init `useDirtyRect: true`（v5.0+） | 局部频繁更新 | — |
| 数据结构 | TypedArray + dimensions float / int | 大数据内存 | — |
| 关动画 | `animation: false` | 大数据量 | 无过渡效果 |
| 多实例 | 必 dispose + 解绑 resize；小图用 SVG | 大屏 / 仪表盘 | — |

## 六、易错点清单

- 容器无宽高就 init → 0 尺寸空白图（先布局 / 显式尺寸 / 显示后 resize）。
- 默认合并下传更少的 series 删不掉旧项 → `replaceMerge: 'series'` 或 `notMerge: true`。
- 同一 DOM 重复 init → getInstanceByDom 先查；React 严格模式配 dispose 清理。
- 忘 dispose / 忘解绑 resize 监听 → 实例与闭包泄漏。
- Vue 用 ref / reactive 深层代理存实例 → Proxy 劫持内部对象、性能骤降，必须 shallowRef。
- tooltip formatter 回调用 this、或 axis 触发时把数组 params 当对象取值。
- legend 项与 series.name 不一致 → 图例不显示不联动。
- 按需引入漏组件（dataset / transform / tooltip axis 的隐性依赖）→ Component not exists。
- candlestick 数据顺序记成 OHLC → 实际是 `[open, close, lowest, highest]`。
- appendData 配 dataset（不支持）、或用在 scatter / lines 之外的系列。
- large 模式后还想按 dataItem 定制 itemStyle（失效属预期）。
- v6 升级视觉「跑偏」→ 主题 / 轴防溢出 / rich 继承 / center 基准四处定点回退（见 [v6 新特性](./guide-line/v6-features)）。
- 地图不显示 → v5 起 GeoJSON 不内置，必须 registerMap。
- dataZoom 默认 filterMode 'filter' 令另一轴 extent 跟着变 → 'none' / 'weakFilter'。
- aria.show 已过时 → v5 起 `aria: { enabled: true }`；贴花另需 `aria.decal.show: true`。

## 七、选型对比

| 对比 | 结论 |
| --- | --- |
| vs Chart.js | Chart.js 轻量（core 约几十 KB）、8 种基础图、Canvas 单渲染器——简单仪表盘选它；复杂 / 大屏 / 地图 / 金融选 ECharts |
| vs D3 | D3 是数据驱动 DOM 的底层工具集，自由度天花板但一切自己画；「造轮子选 D3，交付业务选 ECharts」 |
| vs AntV G2 | G2 图形语法（mark / encode / transform 推导图表）、React 生态配套好；ECharts「图表类型 + 配置项」心智、示例即抄即用、大屏 / 地图实践更厚 |
| 3D | 用 echarts-gl 扩展 |

## 八、资源链接

- [快速上手](https://echarts.apache.org/handbook/zh/get-started/) —— 官方 handbook 入口
- [按需引入](https://echarts.apache.org/handbook/zh/basics/import/) —— core + use + ComposeOption
- [v6 新特性](https://echarts.apache.org/handbook/zh/basics/release-note/v6-feature/) / [v6 升级指南](https://echarts.apache.org/handbook/zh/basics/release-note/v6-upgrade-guide/)
- [数据集](https://echarts.apache.org/handbook/zh/concepts/dataset/) / [数据变换](https://echarts.apache.org/handbook/zh/concepts/data-transform/) —— dataset / encode / transform
- [事件与行为](https://echarts.apache.org/handbook/zh/concepts/event/) —— on / query / dispatchAction / getZr
- [服务端渲染](https://echarts.apache.org/handbook/zh/how-to/cross-platform/server/) —— SSR / 轻量运行时 / node-canvas
- [Canvas vs SVG](https://echarts.apache.org/handbook/zh/best-practices/canvas-vs-svg/) —— 渲染器选型
- [无障碍 aria](https://echarts.apache.org/handbook/zh/best-practices/aria/) —— aria.enabled / decal
- [配置项手册](https://echarts.apache.org/zh/option.html) —— option 全量检索
- [GitHub v6.0.0 Release](https://github.com/apache/echarts/releases/tag/6.0.0) —— 完整 Feature / Breaking 清单
