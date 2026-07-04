---
layout: doc
outline: [2, 3]
---

# 实例与 option：生命周期、合并模式与布局挂载

> 基于 Apache ECharts 6.1 · 核于 2026-07

## 速查

- **init**：`echarts.init(dom, theme?, opts?)`；容器必须已有宽高，否则 0 尺寸空白图（解法：先布局后 init / opts 显式 `width`、`height` / 显示后 `resize()`）。
- **同一 DOM 禁止重复 init**：会告警且有拿回旧实例的风险；先用 `echarts.getInstanceByDom(dom)` 查已有实例（React 严格模式双执行 effect 时尤其要配合 dispose 清理）。
- **setOption 两种签名**：`setOption(option, notMerge?, lazyUpdate?)` 或 `setOption(option, { notMerge, replaceMerge, lazyUpdate, silent })`。
- **三种合并模式（必考）**：
  - 默认（`notMerge: false`）**普通合并**：新旧 option 递归合并，数组型组件（series / xAxis…）**按 index 对位**——传更少的 series 也删不掉旧的；
  - `notMerge: true`：丢弃旧 option **全量替换**（v6 setTheme 之后官方也建议用它）；
  - `replaceMerge: 'series'` 或 `['series', 'xAxis']`（v5+）：对指定组件类型**替换式合并**，按 id 对齐并能**删除**未出现的组件——增删 series 的正解。
- **lazyUpdate: true**：不立即重绘，推迟到下一帧（合并多次 setOption）；**silent: true**：不触发事件。
- **数据更新范式**：一切更新都走 `setOption`（数据驱动，内部 diff + 过渡动画），不手动清空重画；更新时 series 靠 **name 对齐**（推荐显式命名而非依赖顺序）。
- **异步加载体验**：取数期间 `chart.showLoading()`，到手后 `hideLoading()` + `setOption`。
- **resize**：`chart.resize({ width?, height?, silent?, animation? })`；
  - 窗口级：`window.addEventListener('resize', () => chart.resize())`；
  - 容器级（CSS/JS 改尺寸，不触发 window resize）：用 **ResizeObserver** 监听容器再 resize，建议加防抖；
  - 卸载时记得 removeEventListener / 断开 observer，否则实例与闭包泄漏。
- **clear vs dispose（必考）**：`clear()` 清空图表内容、实例还活着可再 setOption 复用；`dispose()` 彻底销毁实例（解绑事件、释放 DOM 与内存），之后不可用；**SPA 组件卸载 / Tab 移除容器必须 dispose**。
- **多图联动**：`echarts.connect([c1, c2])`，或给实例设同一 `chart.group` 后 `echarts.connect(group)`。
- **option = 组件声明集合**。常用顶层项：title / legend / grid / xAxis / yAxis / polar / radar / dataZoom / visualMap / tooltip / axisPointer / toolbox / brush / geo / timeline / graphic / calendar / dataset / aria / series；全局属性：color（调色盘）/ backgroundColor / textStyle / darkMode / animation 系列。
- **v6 新增顶层**：`matrix`（矩阵坐标系）、`thumbnail`（缩略图组件），以及 `richInheritPlainLabel` / `legacyViewCoordSysCenterBase` 两个兼容开关。
- **坐标系挂载**：series 用 `coordinateSystem`（'cartesian2d' / 'polar' / 'geo' / 'calendar' / 'matrix'…）+ 索引挂坐标系；直角系用 `xAxisIndex` / `yAxisIndex`，轴用 `gridIndex` 挂 grid（**轴挂 grid、series 挂轴**）；其余 `polarIndex` / `geoIndex` / `calendarIndex` / `matrixIndex` 同理。
- **双 y 轴**：`yAxis: [{...}, {...}]` + series 设 `yAxisIndex: 1`（降水量 / 温度双轴是官方经典例）。
- **多 grid 一图多区**：grid 数组分区、轴按 `gridIndex` 归组、series 按轴索引挂载——K 线 + 成交量的典型布局。
- **轴四要素**：`axisLine` 轴线 / `axisTick` 刻度 / `axisLabel` 刻度标签（`formatter: '{value} kg'`）/ name 轴名（`nameLocation`）；辅助线 `splitLine` / `splitArea` / `minorTick` / `minorSplitLine`。
- **轴 type 四种**：`'value'` / `'category'` / `'time'` / `'log'`；`min` / `max` 支持 `'dataMin'` / `'dataMax'` 或函数；`boundaryGap` 控制留白（category 轴默认 true）。
- **v6 轴布局变化**：axisLabel / axisName 防溢出 + 防重叠**默认开启**；关闭用 `grid: { outerBoundsMode: 'none' }` 与轴上 `nameMoveOverlap: false`；`grid.containLabel` 现等价于 `{ outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' }`。
- **Vue 3 铁律**：实例存 **shallowRef 或普通变量**，绝不能放进 reactive / ref 深层代理（Proxy 劫持 echarts 内部大对象 → 性能骤降甚至报错）；`onMounted` 里 init，`onBeforeUnmount` 里 dispose + 断开 ResizeObserver；数据变化 watch 后 setOption。
- **React**：`useRef` 存 DOM 与实例，`useEffect` 里 init、清理函数里 dispose。
- **现成封装**：Vue 用 vue-echarts、React 用 echarts-for-react（封装了生命周期 / resize / 事件绑定，但按需引入仍需自己 use）。

## 一、init 与容器：实例从哪来

`echarts.init(dom, theme?, opts?)` 返回图表实例（opts 详见[入门](../getting-started)）。两条纪律：

1. **容器必须已有宽高**。`display: none` 的 Tab、flex 未撑开时 init 会拿到 0 尺寸，图表空白。
2. **同一 DOM 只 init 一次**。重复 init 会告警并有行为异常风险，先查再建：

```js
// 防重复 init 的标准写法
let chart = echarts.getInstanceByDom(dom);
if (!chart) {
  chart = echarts.init(dom);
}
```

React 18 严格模式下 effect 双执行，尤其容易踩重复 init——正解是清理函数里 `dispose()`（见第五节）。

## 二、setOption 合并模式（必考）

`setOption` 不只是「设置」，它有三种合并语义，直接决定「组件删不删得掉」：

```js
chart.setOption(option, notMerge?, lazyUpdate?);
// 或对象形式，可用 replaceMerge：
chart.setOption(option, { notMerge, replaceMerge, lazyUpdate, silent });
```

| 模式 | 写法 | 行为 | 适用 |
| --- | --- | --- | --- |
| 普通合并（默认） | `setOption(opt)` | 新旧递归合并；数组型组件**按 index 对位合并** | 常规增量更新 |
| 全量替换 | `notMerge: true` | 丢弃旧 option 重来 | 图表结构大变、setTheme 之后 |
| 替换式合并 | `replaceMerge: 'series'` 或数组 | 仅对指定组件类型按 **id 对齐**，**能删除**未出现的组件 | **增删 series 的正解**（v5+） |

::: danger 「传了更少的 series 也删不掉」
默认合并下 series / xAxis 等数组型组件按 index 对位合并——新 option 里少传一个 series，旧的那个**依然留在图上**。要删除，用 `replaceMerge: 'series'`（按 id 对齐做增删）或干脆 `notMerge: true` 全量替换。
:::

两个附加开关：`lazyUpdate: true` 不立即重绘、推迟到下一帧（可合并多次 setOption）；`silent: true` 不触发事件。

## 三、数据更新范式：一切走 setOption

ECharts 是数据驱动的：**任何数据更新都通过 setOption 传入新数据**，内部自动 diff 出差异并做过渡动画，不需要手动清空重画。

```js
// 异步取数的标准节奏
chart.showLoading();                  // ① 转圈
const data = await fetchData();
chart.hideLoading();                  // ② 关掉加载动画
chart.setOption({                     // ③ 只传变化的部分，内部合并 + 动画过渡
  series: [{ name: '销量', data }]    // 用 name 对齐旧 series，别依赖顺序
});
```

更新时 series 靠 `name` 对齐——**推荐显式命名**，依赖数组顺序在系列增减时会错位。

## 四、resize：窗口级与容器级

`chart.resize({ width?, height?, silent?, animation? })` 让实例适配新尺寸。两类场景两种监听：

```js
// 窗口级：浏览器窗口缩放
window.addEventListener('resize', () => chart.resize());

// 容器级：CSS / JS 改容器尺寸（不触发 window resize），用 ResizeObserver
const ro = new ResizeObserver(() => chart.resize());  // 实践中建议加防抖
ro.observe(chartContainer);
```

卸载时两者都要解除（`removeEventListener` / `ro.disconnect()`），否则监听器持有实例与闭包，内存泄漏。

## 五、clear vs dispose 与多图联动

| | `chart.clear()` | `chart.dispose()` |
| --- | --- | --- |
| 图表内容 | 清空 | 清空 |
| 实例 | **还活着**，可再 setOption 复用 | **彻底销毁**，之后不可用 |
| 资源 | 保留 | 解绑事件、释放 DOM 与内存 |
| 场景 | 换一张全新的图但复用实例 | SPA 组件卸载、Tab 移除容器 |

SPA 路由切换忘 dispose 是经典泄漏源；配套的 resize 监听同样要解绑（v6 之前 tooltip 也有过泄漏案例，6.0 修复 #21087）。

多图联动：`echarts.connect([chart1, chart2])`，或给多个实例设置同一 `chart.group` 值后 `echarts.connect(group)`——联动 tooltip、dataZoom 等行为。

## 六、option 心智模型：组件声明集合

一个 option 就是一组组件声明，每个顶层键对应一类组件：`title / legend / grid / xAxis / yAxis / polar / radiusAxis / angleAxis / radar / dataZoom / visualMap / tooltip / axisPointer / toolbox / brush / geo / parallel / singleAxis / timeline / graphic / calendar / dataset / aria / series`，再加全局属性 `color`（调色盘）、`backgroundColor`、`textStyle`、`darkMode`、`animation` 系列。v6 新增顶层 `matrix`（矩阵坐标系）与 `thumbnail`（缩略图组件）。完整清单见[参考](../reference)。

理解 option 的关键是**挂载链**：series 声明自己属于哪个坐标系（`coordinateSystem`），坐标轴声明自己属于哪个 grid（`gridIndex`），series 再通过 `xAxisIndex` / `yAxisIndex` 挂到具体的轴——**轴挂 grid、series 挂轴**。

## 七、多 grid、多轴与双 y 轴

一图多区（K 线 + 成交量）靠 grid 数组切分画布，轴与 series 逐级挂载：

```js
option = {
  grid: [{ bottom: '55%' }, { top: '55%' }],       // 上下两个绘图区
  xAxis: [{ gridIndex: 0 }, { gridIndex: 1 }],      // 各挂一个 grid
  yAxis: [{ gridIndex: 0 }, { gridIndex: 1 }],
  series: [
    { type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0, data: kline },  // K 线在上区
    { type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: volume }          // 成交量在下区
  ]
};
```

双 y 轴更简单：`yAxis` 给数组，第二个 series 设 `yAxisIndex: 1`（官方经典例：降水量 / 温度双轴）。

## 八、坐标轴四要素

每条轴由四要素组成：**axisLine**（轴线）、**axisTick**（刻度）、**axisLabel**（刻度标签，支持 `formatter: '{value} kg'` 模板）、**name**（轴名，位置由 `nameLocation` 控制）；辅助元素有 `splitLine`（分隔线）、`splitArea`（分隔带）、`minorTick` / `minorSplitLine`（次级刻度线）。

- 轴类型 `type`：`'value'`（数值）/ `'category'`（类目）/ `'time'`（时间）/ `'log'`（对数）。
- `min` / `max`：支持数字、`'dataMin'` / `'dataMax'`、或函数。
- `boundaryGap`：轴两端留白，category 轴默认 `true`（柱子不贴边）。

::: tip v6 布局默认值变了
v6 起直角坐标系 axisLabel / axisName 的**防溢出 + 防重叠策略默认开启**，标签位置可能与 v5 有细微差异。要还原旧行为：`grid: { outerBoundsMode: 'none' }`、轴上 `nameMoveOverlap: false`。`grid.containLabel` 在 v6 中等价于 `{ outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' }`。详见 [v6 新特性](./v6-features)。
:::

## 九、框架集成：Vue 3 / React 铁律

共性铁律：**容器 ref + 挂载后 init、卸载前 dispose、容器尺寸变化 resize**。

Vue 3（本站技术栈）最要命的一条：**实例绝不能放进 reactive / ref 深层代理**——Proxy 会劫持 echarts 内部大对象的属性访问，导致性能骤降甚至报错。存 `shallowRef` 或普通变量：

```ts
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';

const chartRef = ref<HTMLDivElement>();
const chart = shallowRef<echarts.ECharts>();       // shallowRef，避免深层代理

onMounted(() => {
  chart.value = echarts.init(chartRef.value!);
  chart.value.setOption(option);
});
onBeforeUnmount(() => {
  chart.value?.dispose();                          // 卸载必 dispose，防泄漏
  // 若用了 ResizeObserver，这里同步 disconnect
});
// 数据变化：watch 数据源，回调里 chart.value?.setOption({ series: [...] })
```

React 用 `useRef` 存 DOM 与实例，effect 清理函数里 dispose：

```jsx
useEffect(() => {
  const c = echarts.init(ref.current);
  return () => c.dispose();   // 严格模式双执行也安全
}, []);
```

不想手写这套模板：Vue 用 **vue-echarts**、React 用 **echarts-for-react**——它们封装了生命周期 / resize / 事件绑定，但**按需引入仍需自己 `use`**。

---

实例与合并语义吃透后，下一步是数据怎么进图表：[dataset 与系列](./dataset-and-series)。
