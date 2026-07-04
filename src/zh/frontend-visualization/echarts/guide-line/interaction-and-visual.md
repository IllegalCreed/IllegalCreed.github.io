---
layout: doc
outline: [2, 3]
---

# 交互与视觉：tooltip、事件、主题与视觉映射

> 基于 Apache ECharts 6.1 · 核于 2026-07

## 速查

- **tooltip.trigger（必考）**：`'item'`（单点，散点 / 饼图适用）/ `'axis'`（整轴，折线柱状多系列对比）/ `'none'`；`triggerOn: 'mousemove' / 'click' / 'none'`（'none' 配 dispatchAction 手动控制）。
- **formatter 字符串模板**：`{a}` 系列名、`{b}` 类目 / 数据名、`{c}` 数值、`{d}` 百分比（饼图）；多系列写 `{b0}` `{c0}` `{b1}` `{c1}`。
- **formatter 回调**：`(params, ticket, callback)` 返回字符串或 HTMLElement；**trigger 'axis' 时 params 是数组**（按对象取值是高频 bug）；异步内容用 ticket + callback 回填；params 还有 `marker`（色点 HTML）、`percent` 等字段。
- **tooltip 其他**：`valueFormatter`（v5.3+，只格式化数值）、`confine: true`（限制在图表区域内）、`appendTo` / `appendToBody`（脱离容器渲染）、`position` 函数定位、v6 `displayTransition` 显隐过渡。
- **axisPointer**：`type: 'line' / 'shadow' / 'cross'`，可配在 tooltip 内或轴上；顶层 axisPointer 可做多图联动。
- **legend**：图例项名 = `series.name`（饼图等类目型 = data item name），**不一致则不显示不联动**（高频坑）；`selectedMode: true / false / 'single' / 'multiple'`；`selected: { '系列名': false }` 初始隐藏；项目多用 `type: 'scroll'` 翻页；布局 `orient` + left / top / right / bottom；v6 新 `triggerEvent`。
- **dataZoom**：`type: 'inside'`（滚轮 / 触摸，藏在坐标系内）/ `'slider'`（可见滑条），常两个并用同控一轴；`start` / `end`（百分比 0-100）、`startValue` / `endValue`（绝对值）、`xAxisIndex` / `yAxisIndex` 指定控制哪根轴。
- **filterMode**：`'filter'`（默认，过滤数据，联动轴 extent 跟着变）/ `'weakFilter'` / `'empty'` / `'none'`（只改窗口不过滤）——误解默认行为是高频坑。
- **toolbox 内置五件套**：saveAsImage / restore / dataView / dataZoom / magicType（折柱切换 / 堆叠切换）/ brush。
- **brush**：区域刷选（矩形 / 多边形 / 横纵向），配 `brushSelected` 事件做联动分析。
- **visualMap**：数据值 → 视觉通道（颜色 / 大小 / 透明度）；`type: 'continuous'`（连续拖拽手柄）/ `'piecewise'`（分段，`pieces` 或 `splitNumber`）；continuous 必填 `min` / `max`；`dimension` 指定映射维度、`seriesIndex` 指定作用系列；`inRange` / `outOfRange` 定义映射到的视觉元素；v6 新 `unboundedRange` 开区间。
- **调色盘**：顶层 `color: [...]` 全局，series 内 `color` 局部。
- **鼠标事件**：click / dblclick / mousedown / mousemove / mouseup / mouseover / mouseout / globalout / contextmenu。
- **params 结构（必背）**：`componentType`（series / markLine / legend…）、`seriesType` / `seriesIndex` / `seriesName`、`name`（类目名）、`dataIndex`、`data`、`dataType`（graph / chord 区分 node / edge）、`value`、`color`。
- **query 过滤第二参**：`chart.on('click', 'series.line', fn)`（`mainType.subType` 字符串）或对象 `{ seriesName, dataIndex }`——只监听指定组件 / 数据项。
- **行为事件**：legendselectchanged、datazoom、brushSelected、highlight / downplay、restore、timelinechanged；生命周期 `rendered`（每帧）/ `finished`（全部渲染完，可作截图时机）。
- **鼠标事件 vs 行为事件（考点）**：前者是 DOM 级用户输入（参数为图形元素上下文），后者是组件状态变化（参数为状态描述）；**dispatchAction 触发行为事件、不触发 click 等鼠标事件**。
- **dispatchAction 常用**：highlight / downplay / showTip / legendSelect / legendUnSelect / legendToggleSelect / dataZoom / selectDataRange / brush；v6 新 expandAxisBreak / collapseAxisBreak。
- **空白区点击**：下探 zrender——`chart.getZr().on('click', e => !e.target && ...)`。
- **主题**：init 传入（内置 `'dark'`）；自定义 `echarts.registerTheme('myTheme', obj)` 后 `init(dom, 'myTheme')`；主题编辑器可视化生成。
- **v6 动态主题（必考新特性）**：`chart.setTheme(nameOrObj)` 不销毁实例、无二次初始化动画；**setTheme 后多次 merge 型 setOption 不受支持，官方建议后续 setOption 用 `notMerge: true`**。
- **深色模式**：`option.darkMode: true`（配深色 backgroundColor 自动调亮文字组件色）；v6 推荐 matchMedia 监听 `prefers-color-scheme` 联动 setTheme。
- **rich 富文本**：label 的 `formatter` 用 `{样式名|文本}` 分段 + `rich: { 样式名: {...} }` 多样式混排；**v6 起 rich 默认继承外层 label 字体属性**，旧行为设 `richInheritPlainLabel: false`。
- **graphic**：顶层组件，声明式放任意图形元素（text / image / rect / group…）——水印、自定义标注、不属于 series 的装饰。

## 一、tooltip：提示框

tooltip 需显式声明才启用。第一决策是 `trigger`：

| trigger | 行为 | 适用 |
| --- | --- | --- |
| `'item'` | 悬停单个数据项触发 | 散点、饼图 |
| `'axis'` | 悬停触发整根轴的所有系列 | 折线、柱状多系列对比 |
| `'none'` | 不自动触发 | 配 dispatchAction 手动控制 |

`triggerOn` 控制触发时机：`'mousemove'` / `'click'` / `'none'`。

**formatter 两种形态**——字符串模板与回调：

```js
tooltip: {
  trigger: 'axis',
  // ① 字符串模板：{a} 系列名 {b} 类目名 {c} 数值 {d} 百分比（饼图）
  //    多系列用带下标的 {b0}: {c0}<br />{b1}: {c1}
  formatter: '{b0}: {c0}<br />{b1}: {c1}'
}
```

```js
tooltip: {
  trigger: 'axis',
  // ② 回调：完全自定义；trigger 'axis' 时 params 是数组！
  formatter(params) {
    // params[i].marker 是现成的色点 HTML；还有 seriesName/name/value/percent 等
    return params.map(p => `${p.marker}${p.seriesName}: ${p.value}`).join('<br />');
  }
  // 回调完整签名 (params, ticket, callback)：异步内容先返回占位，
  // 数据到手后 callback(ticket, html) 回填
}
```

实用配置：

- `valueFormatter`（v5.3+）：只格式化数值部分，不用重写整个 formatter。
- `confine: true`：把 tooltip 限制在图表区域内——容器有 overflow hidden 或 tooltip 超出屏幕时用。
- `appendTo` / `appendToBody`：让 tooltip 脱离容器渲染，解决层级裁剪。
- `position`：函数自定义定位；v6 新增 `displayTransition` 控制显隐过渡。
- 轴指示器 `axisPointer: { type: 'line' | 'shadow' | 'cross' }`（可配在 tooltip 内或轴上）；**顶层 axisPointer** 还能 link 多图联动。

::: danger formatter 回调里别用 this
应使用形参 params（箭头函数 / 严格模式下 this 不是图表）；`trigger: 'axis'` 时 params 是**数组**还按对象取值，是最高频的 tooltip bug。
:::

## 二、legend：图例

图例项名与 `series.name` 对应（饼图等类目型图表对应 data item 的 name）——**名字对不上，图例既不显示也不联动**，这是 legend 第一坑。

- `selectedMode`：`true` / `false` / `'single'` / `'multiple'`——控制点击图例开关系列的行为。
- `selected: { '系列名': false }`：初始隐藏某系列。
- 项目太多：`type: 'scroll'` 翻页滚动。
- 布局：`orient: 'horizontal' | 'vertical'` + left / top / right / bottom 定位。
- v6 新增 `triggerEvent`。

## 三、dataZoom：数据窗口缩放

两种类型常**并用**同控一根轴：

```js
dataZoom: [
  { type: 'inside', xAxisIndex: 0, start: 50, end: 100 },  // 滚轮/触摸拖拽，藏在坐标系内
  { type: 'slider', xAxisIndex: 0, start: 50, end: 100 }   // 可见滑条
]
```

- `start` / `end` 是**百分比**（0-100）；`startValue` / `endValue` 是绝对值。
- `xAxisIndex` / `yAxisIndex` 指定控制哪几根轴。
- **filterMode 高频坑**：默认 `'filter'` 会真正过滤数据，导致**另一根轴的 extent 跟着变**；只想裁剪显示窗口用 `'none'` 或 `'weakFilter'`（另有 `'empty'` 置空模式）。
- 性能角度：限定初始 `start` / `end` 可减少首屏绘制量（见[性能与规模化](./performance-and-scale)）。

## 四、toolbox 与 brush

- **toolbox** 内置 feature：`saveAsImage`（导出图片）、`restore`（还原）、`dataView`（数据视图）、`dataZoom`（框选缩放）、`magicType`（折柱切换 / 堆叠切换）、`brush`。
- **brush**：区域刷选（矩形 / 多边形 / 横纵向），配合 `brushSelected` 事件拿到选中数据做联动分析。

## 五、visualMap：视觉映射

visualMap 把**数据值映射到视觉通道**（颜色、大小、透明度），热力图必配组件：

```js
visualMap: {
  type: 'continuous',        // 连续型（拖拽手柄）；'piecewise' 分段型（pieces 或 splitNumber）
  min: 0, max: 100,          // continuous 必填
  dimension: 2,              // 用数据的哪一维做映射
  seriesIndex: 0,            // 作用于哪些系列
  inRange: { color: ['#50a3ba', '#eac736', '#d94e5d'] },  // 范围内映射到的视觉元素
  outOfRange: { color: '#ccc' }                            // 范围外
}
```

`inRange` / `outOfRange` 里可映射 `color`、`symbolSize` 等；v6 新增 `unboundedRange` 支持开区间。

调色盘则是更「静态」的配色方式：顶层 `color: ['#5470c6', ...]` 全局生效，series 内 `color` 局部覆盖。

## 六、事件系统：鼠标事件与 query 过滤

鼠标事件：`'click'`、`'dblclick'`、`'mousedown'`、`'mousemove'`、`'mouseup'`、`'mouseover'`、`'mouseout'`、`'globalout'`、`'contextmenu'`。

```js
chart.on('click', params => {
  // params 结构（必背）：
  // componentType: 'series' | 'markLine' | 'legend' | ... 触发所在组件
  // seriesType: 'line' | 'bar' | 'pie'...；seriesIndex / seriesName
  // name: 类目名；dataIndex: 数据下标；data: 原始数据项
  // dataType: 'node' | 'edge'（graph / chord 区分点和边）；value；color
});
```

**query 过滤第二参**——只监听指定组件或数据项，避免回调里手写 if：

```js
chart.on('click', 'series.line', fn);                          // mainType.subType 字符串
chart.on('mouseover', { seriesName: '销量', dataIndex: 1 }, fn); // 对象条件
```

**空白区域点击**：元素事件挂在 `chart.on`，画布空白要下探 zrender：

```js
chart.getZr().on('click', e => {
  if (!e.target) { /* 点在了空白处 */ }
});
```

## 七、行为事件与 dispatchAction

除鼠标事件外还有一类**组件行为事件**——用户操作交互组件后的状态变更通知：`legendselectchanged`、`datazoom`、`brushSelected`、`highlight` / `downplay`、`restore`、`timelinechanged`；以及生命周期事件 `rendered`（每帧渲染完）/ `finished`（全部渲染完成，可用作截图时机）。

`dispatchAction` 用代码触发与用户交互等效的行为（会触发对应行为事件）：

```js
chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: i }); // 高亮
chart.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex: i }); // 取消高亮
chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: i });  // 显示 tooltip
chart.dispatchAction({ type: 'legendSelect', name: '系列名' });            // 图例选中
// 其他：legendUnSelect / legendToggleSelect / dataZoom / selectDataRange / brush
// v6 新增：expandAxisBreak / collapseAxisBreak（展开/折叠断轴）
```

典型应用：定时器轮流 `highlight` + `showTip` 实现**轮播高亮**。

::: tip 考点：鼠标事件 vs 行为事件
鼠标事件是 DOM 级用户输入（参数为图形元素上下文）；行为事件是组件状态变化（参数为选中表等状态描述）。**dispatchAction 触发的是行为（及行为事件），不会触发 click 之类的鼠标事件**。
:::

## 八、主题与深色模式

- **init 时指定**：`echarts.init(dom, 'dark')` 用内置暗色主题；自定义主题先 `echarts.registerTheme('myTheme', themeObj)` 再 `init(dom, 'myTheme')`；主题对象可用官方**主题编辑器**可视化生成。
- **v6 动态主题切换（必考新特性）**：`chart.setTheme('myTheme')` 或 `chart.setTheme(themeObj)`——不销毁实例、无二次初始化动画。**限制**：setTheme 后多次 merge 模式的 setOption 不受支持，官方建议后续 setOption 用 `notMerge: true`。
- **v6 新默认主题**：基于设计令牌（design token）重构；想保持 v5 观感 `import 'echarts/theme/v5.js'` 后 `init(dom, 'v5')`（详见 [v6 新特性](./v6-features)）。
- **深色模式**：`option.darkMode: true` 配合深色 `backgroundColor`，自动调亮文字与组件颜色。v6 推荐与系统深色模式联动：

```js
// 跟随系统 prefers-color-scheme 自动切主题（v6 setTheme 不销毁实例）
const media = window.matchMedia('(prefers-color-scheme: dark)');
media.addEventListener('change', e => chart.setTheme(e.matches ? 'dark' : 'default'));
```

## 九、rich 富文本与 graphic

- **rich**：一个 label 里多样式混排（图标 + 文字、KPI 卡片式标签）。`formatter` 用 `{样式名|文本}` 分段，样式定义在 `rich` 里：

```js
label: {
  formatter: '{styleA|文本}{value|42}',   // {样式名|内容} 分段引用样式
  rich: {
    styleA: { color: '#999', fontSize: 12 },
    value: { color: '#333', fontSize: 20, backgroundColor: { image: iconUrl } }
  }
}
```

  **v6 变更**：rich 各样式默认**继承**外层 label 的 fontStyle / fontWeight / fontSize / fontFamily / textShadow；要旧行为设 `richInheritPlainLabel: false`（顶层或具体 label 上）。

- **graphic**：顶层组件，声明式放置任意图形元素（text / image / rect / group…），用于**水印、自定义标注**等不属于任何 series 的装饰。

---

交互打通后，数据量一上来就是另一场仗：[性能与规模化](./performance-and-scale)。
