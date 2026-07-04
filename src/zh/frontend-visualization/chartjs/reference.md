---
layout: doc
outline: [2, 3]
---

# 参考：Chart.js 速查

> 基于 **Chart.js 4.5.x**（npm latest 4.5.1）· 核于 2026-07

## 速查

- **安装**：`npm install chart.js`；CDN 走 jsDelivr / CDNJS（锁版本 + SRI）；**ESM-only**（CJS 只能动态 `import()`；RequireJS 用 `dist/chart.umd.min.js`）
- **入口**：`chart.js`（named import + 按需注册）/ `chart.js/auto`（default import 全量）/ `chart.js/helpers`（工具函数）
- **注册**：`Chart.register(...)`；一把梭 `...registerables`；漏注册报 `"xxx" is not a registered controller/scale/element/plugin`
- **注册收益**：按需注册较 auto 约省 56 KB（示例应用约 -25%）
- **config 三件套**：`new Chart(ctx, { type, data, options })`；ctx 可为 canvas 元素 / 2d context / id 字符串
- **8 类型**：line / bar / pie / doughnut / radar / scatter / bubble / polarArea；mixed = dataset 级 `type` 覆盖；面积 = `fill` + Filler
- **pie vs doughnut 唯一区别**：`cutout`——pie 0、doughnut `'50%'`
- **水平条形图**：`indexAxis: 'y'`（v3 起无 horizontalBar 类型）
- **bubble 的 `r`**：原始**像素**半径，不随图表缩放
- **data 四格式**：primitive 数组 / `[x, y]` 元组 / 对象数组（scatter、bubble 标配）/ 键值对对象
- **parsing**：`xAxisKey` / `yAxisKey` / `key`（单值类），点号嵌套路径；`parsing: false` 走性能路线
- **options 优先级**：`options` → `overrides[type]` → `defaults`；scriptable（函数）与 indexable（数组）两大机制
- **scales**：v3+ 对象键式；轴 id 首字母定方向；双 y 轴自定义 id + `yAxisID` 关联
- **time 轴**：必装 date adapter（date-fns / luxon / moment / dayjs 社区版）
- **time vs timeseries**：真实时间距离 vs 数据点等距（股票 K 线用后者）
- **响应式默认**：`responsive: true`、`maintainAspectRatio: true`、`aspectRatio: 2`（radial 类 1）；容器 div 须专属 + 相对定位
- **min/max**：硬边界裁数据；**suggestedMin/Max**：软建议可扩展；`beginAtZero`、`grace: '5%'`
- **v4 grid/border 拆分**：`grid.drawBorder → border.display` 等四项迁移
- **interaction**：默认 `mode: 'nearest'` + `intersect: true`；多系列 tooltip 标配 `index` + `intersect: false`
- **events 默认**：mousemove / mouseout / click / touchstart / touchmove，可裁剪
- **tooltip**：`options.plugins.tooltip`（v3 起入 plugins）；callbacks 定制文案；external 接管 HTML
- **legend 点击分野**：普通图 toggle 整个 dataset；pie / doughnut / polarArea toggle 单条数据（图例项来自 labels）
- **title.text 数组 = 多行**；`display` 默认 false；subtitle 同款配置
- **动画**：默认 1000ms `'easeOutQuart'`；`animation: false` 禁用 + Path2D 缓存；transitions 四场景
- **插件**：inline（仅实例）vs `Chart.register`（全局）；配置走 `options.plugins.{id}`；多数 `before*` 返回 false 可取消
- **实例管理**：复用 canvas 前 `destroy()`；`Chart.getChart(canvas)` 防重复 new；改 data 后 `update()`（`'none'` 免动画）
- **性能组合拳**：禁动画 → decimation（五前提）→ `parsing: false` + `normalized: true` → 指定 min/max → line 专项 → Worker + OffscreenCanvas
- **导出**：`toBase64Image()` PNG 默认透明底，白底靠背景插件
- **无障碍**：canvas 屏幕阅读器不可见——`role="img"` + `aria-label` 或 fallback 内容
- **选型一句话**：要快要轻选 Chart.js；要全要炫（地图 / 大屏 / 关系图）选 ECharts；React 内快速常规图选 Recharts；非标创意可视化选 D3

## 一、安装与注册速查

| 事项 | 内容 |
| --- | --- |
| npm | `npm install chart.js`（唯一运行时依赖 `@kurkle/color`） |
| CDN | jsDelivr / CDNJS；生产锁版本 + SRI；GitHub 不再发预构建产物 |
| 包形态 | ESM-only（`"type": "module"`）；UMD 兜底 `dist/chart.umd.min.js` |
| CJS | `const { Chart } = await import('chart.js')` |
| TS | 类型内置，无需 @types；泛型 `Chart<TType, TData, TLabel>` |
| 测试 | Jest 需开 ESM，官方建议 Vitest |

按需注册的最小组件集：

| 图表 | 必需组件 |
| --- | --- |
| bar | BarController + BarElement + CategoryScale + LinearScale |
| line | LineController + LineElement + PointElement + 两个 scale |
| pie / doughnut | 对应 Controller + ArcElement（无需 scale） |

可注册 plugin：`Decimation / Filler / Legend / SubTitle / Title / Tooltip / Colors`；可注册 scale：`CategoryScale / LinearScale / LogarithmicScale / TimeScale / TimeSeriesScale / RadialLinearScale`。按需注册较 auto 约省 56 KB（约 -25%）。

## 二、图表类型速览

| type | 要点 |
| --- | --- |
| `line` | `tension`（默认 0 直线，大于 0 贝塞尔）、`cubicInterpolationMode: 'monotone'`、`stepped`、`fill`、`spanGaps`（true 跨 null 连线，数字 = 最大可跨毫秒距离）、`showLine`、`pointRadius`（0 不画点）、`segment`（逐段样式，如虚线补缺口） |
| `bar` | `indexAxis: 'y'` 即水平条形图；`barPercentage`(0.9) / `categoryPercentage`(0.8) / `barThickness` / `maxBarThickness`；`borderRadius` / `borderSkipped`；`grouped`；浮动条 `data: [[start, end], ...]`；`base` |
| `pie` / `doughnut` | 同一实现，唯一区别 `cutout`：doughnut `'50%'`、pie 0；data 为 number 数组，占比自动算；`rotation`（0，12 点方向起）/ `circumference`(360) / `radius` / `offset` / `hoverOffset` / `spacing`；半环仪表盘 = `rotation: 270`（或 -90）+ `circumference: 180` |
| `radar` | 单 `scales.r`（radialLinear）；需要 labels；fill / tension / point 系列与 line 共享；`angleLines`、`pointLabels` |
| `scatter` | line 的变体：x 轴默认 linear、`showLine` 强制默认 false；data 必须 `{ x, y }` |
| `bubble` | `{ x, y, r }`，r 是原始像素半径、不随图表缩放；`hoverRadius` 是悬停附加增量（默认 4） |
| `polarArea` | 等角扇区、半径映数值（vs pie 角度映数值）；radialLinear 轴；`animateRotate` / `animateScale` 默认 true |
| mixed | 顶层 type + dataset 级 `type` 覆盖；层叠：datasets[0] 在最上，`order` 越大越先画（越靠下层） |

面积图不是独立 type：line / radar 设 `fill` 即面积（`'origin'` / `'start'` / `'end'` / 绝对索引 / `'-1'` `'+1'` 相对索引 / `{ value: 25 }` / `'shape'`），由 Filler 插件实现。

## 三、options 命名空间地图

| 命名空间 | 管什么 | 关键项 |
| --- | --- | --- |
| `scales.{id}` | 坐标轴 | type / position / min / max / suggestedMin / suggestedMax / beginAtZero / grace / stacked / ticks / grid / border |
| `plugins.tooltip` | 提示框 | enabled / external / position / callbacks / displayColors / filter / itemSort |
| `plugins.legend` | 图例 | display / position / align / reverse / labels.usePointStyle / labels.generateLabels / onClick |
| `plugins.title` `plugins.subtitle` | 标题 / 副标题 | display（默认 false）/ text（数组 = 多行）/ position / align / font / fullSize / padding |
| `plugins.colors` | 自动配色（v4 内置） | forceOverride（动态数据集） |
| `plugins.decimation` | 降采样（line 专用） | enabled / algorithm（lttb、min-max）/ samples / threshold |
| `plugins.filler` | 面积填充 | propagate |
| `interaction` | 交互基线（hover 与 tooltip 共享） | mode / intersect / axis / includeInvisible |
| `hover` | 悬停覆盖 | 同 interaction |
| `animation` / `animations.{property}` / `transitions` | 动画 | duration(1000) / easing('easeOutQuart') / delay / loop；场景 active、resize、show、hide |
| `parsing` | 数据解析 | xAxisKey / yAxisKey / key / false |
| 根级响应式 | 尺寸 | responsive(true) / maintainAspectRatio(true) / aspectRatio(2，radial 为 1) / onResize / resizeDelay |
| `events` | 监听事件 | 默认 mousemove / mouseout / click / touchstart / touchmove |
| `datasets.{type}` | 类型级 dataset 默认 | 如 `datasets.line.tension` |

## 四、实例 API 速查

| API | 用途 |
| --- | --- |
| `update(mode?)` | 改 data / options 后重绘；`'none'` / `'reset'` / `'resize'` / `'show'` / `'hide'` / `'active'` 或函数 |
| `destroy()` | 销毁实例（复用 canvas 前必须） |
| `reset()` / `render()` / `stop()` / `clear()` | 回初始态 / 重绘 / 停动画 / 清画布 |
| `resize(w?, h?)` | 手动尺寸；无参 = 适配容器 |
| `toBase64Image(type?, quality?)` | 导出图片（PNG 默认透明底） |
| `getElementsAtEventForMode(e, mode, options, useFinalPosition)` | 命中检测 → `[{ datasetIndex, index, element }]` |
| `getDatasetMeta(i)` / `getSortedVisibleDatasetMetas()` | 元素级元数据 |
| `setDatasetVisibility` / `hide` / `show` | dataset 级显隐 |
| `toggleDataVisibility(i)` / `getDataVisibility(i)` | 数据条目级显隐（pie 系） |
| `setActiveElements([...])` | 程序化高亮 |
| `isPluginEnabled(id)` | 插件启用检查 |
| `Chart.getChart(key)`（静态） | canvas / id / ctx 反查实例 |
| `Chart.instances`（静态） | 全部实例注册表 |
| `Chart.register(...)` / `Chart.defaults`（静态） | 注册组件 / 全局默认 |

## 五、插件钩子速查

| 阶段 | 钩子 |
| --- | --- |
| 安装态 | install / start / stop / uninstall |
| 初始化 | beforeInit / afterInit |
| 更新 | beforeUpdate / afterUpdate、beforeLayout / afterLayout、beforeDatasetsUpdate / afterDatasetsUpdate、beforeDatasetUpdate / afterDatasetUpdate、beforeElementsUpdate |
| 渲染 | beforeRender / afterRender、beforeDraw / afterDraw、beforeDatasetsDraw / afterDatasetsDraw、beforeDatasetDraw / afterDatasetDraw、beforeTooltipDraw / afterTooltipDraw |
| 事件 | beforeEvent / afterEvent |
| 其他 | resize / reset / beforeDestroy / afterDestroy（v4 移除 destroy 钩子） |

多数 `before*` 返回 `false` 可取消对应阶段；配置走 `options.plugins.{id}`（即钩子第三参）；`plugins.{id}: false` 禁单个、`plugins: false` 禁全部。社区常用：`chartjs-plugin-zoom` / `chartjs-plugin-datalabels` / `chartjs-plugin-annotation`。

## 六、v2 → v3 → v4 迁移映射

| 旧写法 | 新写法 | 变更版本 |
| --- | --- | --- |
| `scales: { xAxes: [...], yAxes: [...] }` 数组 | `scales: { x: {...}, y: {...} }` 对象键式 | v3 |
| `options.tooltips`（复数） | `options.plugins.tooltip` | v3 |
| `type: 'horizontalBar'` | `type: 'bar'` + `indexAxis: 'y'` | v3 |
| moment 内置捆绑 | 需另装 date adapter | v3 |
| 折线默认交互 `index` | 默认 `nearest` | v3 |
| `grid.drawBorder / borderColor / borderWidth / borderDash` | `border.display / color / width / dash` | v4 |
| 分发文件 `chart.esm.js`、`chart.min.js` | `chart.js`、`chart.umd.min.js` | v4 |
| 插件 `destroy` 钩子 | `afterDestroy` | v4 |

## 七、易错点清单

- **「Canvas is already in use」**：同一 canvas 重复 new——先 `Chart.getChart(canvas)?.destroy()`；SPA 卸载钩子里 `destroy()`。
- **tree-shaking 漏注册**：报 `"category" is not a registered scale` 之类——查最小组件集，或图省事 `chart.js/auto` / `...registerables`。
- **time 轴裸奔**：不装 date adapter 直接 `type: 'time'` 报错（v3 起 moment 不捆绑）。
- **响应式高度塌陷 / 无限增高**：canvas 没裹专属相对定位 div、或想 JS 控高没关 `maintainAspectRatio`——高度设在容器上。
- **suggestedMax 当 max 用**：数据超出后轴仍扩展是预期行为；硬边界用 min / max（会裁数据）。
- **v2 老代码直接搬**：xAxes 数组、`options.tooltips`、horizontalBar 在 v3+ 全失效（见迁移表）。
- **v4 grid 边框样式失效**：`grid.drawBorder / borderColor` 已迁往 `border.*`。
- **ESM-only 踩坑**：CJS require 失败需动态 import；Jest 需开 ESM（官方建议 Vitest）；RequireJS 只能 UMD。
- **bubble 半径误会**：r 是画布像素，不随缩放；按数值映射面积要 scriptable radius 自己换算。
- **decimation 配了没生效**：五前提（indexAxis 'x'、line、x 轴 linear/time、`parsing: false`、点数超 threshold）缺一不可。
- **pie 图例点击行为预期错**：不是隐藏 dataset，是 toggle 单个扇区数据（`toggleDataVisibility`）。
- **toBase64Image 黑 / 透明底**：canvas 默认透明——beforeDraw 插件铺 `destination-over` 背景。
- **null 断线**：默认行为；连上用 `spanGaps: true`（或最大间隔毫秒数），性能上反而更快。
- **labels 数量对不齐**：labels 长度须匹配最大 dataset 长度，短了尾部点无标签。
- **动态 webfont**：加载完成前渲染用回退字体——`document.fonts.ready` 后 `chart.update()`。

## 八、选型对比（vs ECharts / Recharts / D3）

| 维度 | Chart.js | ECharts | Recharts | D3 |
| --- | --- | --- | --- | --- |
| 渲染 | Canvas | Canvas / SVG 双引擎（可选 WebGL 扩展） | SVG（React 组件） | 任意（常 SVG），绘图原语 |
| 体量 | 核心小 + tree-shaking（按需省约 25%） | 全量大（也支持按需引入模块） | 中（依赖 React + d3 子包） | 库本身模块化，图表全自己搭 |
| 图表类型 | 8 内置 + 插件 / 自定义 | 20+（地图 / 桑基 / 关系图 / 3D 生态） | 常用十余种 | 无上限（全手写） |
| 上手 | 一个 config 对象即出图 | 声明式 option 大而全，学习面广 | JSX 组合直觉（限 React） | 陡峭，数据到 DOM 的绑定思维 |
| 定制深度 | scriptable + 插件钩子 + 自定义 controller | option 巨细 + 自定义系列 | 受组件封装限制 | 无限 |
| 适用 | 常规仪表盘 / 管理后台轻量图表 | 大屏 / 复杂交互 / 地理 / 大数据量 | React 项目快速常规图 | 非标可视化 / 艺术级定制 |

一句话：**要快要轻选 Chart.js；要全要炫（地图 / 大屏 / 关系图）选 ECharts；React 内快速常规图选 Recharts；非标创意可视化选 D3。** Chart.js 的 Canvas 路线在数据点多时优于 SVG 方案（DOM 节点数不随数据涨），但单像素级交互与无障碍不如 SVG 天然。

## 九、权威链接

- [Chart.js 官方文档（latest / v4）](https://www.chartjs.org/docs/latest/)
- [Getting Started](https://www.chartjs.org/docs/latest/getting-started/) ｜ [Performance](https://www.chartjs.org/docs/latest/general/performance.html) ｜ [Plugins](https://www.chartjs.org/docs/latest/developers/plugins.html) ｜ [API](https://www.chartjs.org/docs/latest/developers/api.html)
- [v4 Migration Guide](https://www.chartjs.org/docs/latest/migration/v4-migration.html) ｜ [v3 Migration Guide](https://www.chartjs.org/docs/latest/migration/v3-migration.html)
- [GitHub: chartjs/Chart.js](https://github.com/chartjs/Chart.js)
- <a href="/SlideStack/chartjs-slide/" target="_blank">幻灯片：Chart.js</a>

学习路线回顾：从[入门](./getting-started)出发，依次过[数据结构与 options](./guide-line/data-and-options)、[坐标轴与交互](./guide-line/scales-and-interactions)、[插件与自定义](./guide-line/plugins-and-custom)、[性能与实例管理](./guide-line/performance)。
