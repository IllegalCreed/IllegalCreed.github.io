---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个图表

> 基于 Apache ECharts 6.1 · 核于 2026-07

## 速查

- **一句话**：Apache ECharts = 基于 zrender 的**声明式、配置驱动**图表库——一个 option 对象描述整张图；Canvas/SVG 双渲染器，20+ 内置图表类型，Apache-2.0 许可。
- **架构分层**：ECharts（图表逻辑：坐标系 / series / 组件 / 状态管理）→ zrender（2D 渲染引擎，抽象 Canvas 与 SVG 两后端）→ 浏览器；`chart.getZr()` 可拿底层实例。
- **版本基线**：npm 最新 `echarts@6.1.0`（v6.0.0 于 2025-07-30 发布）；升级命令 `npm install echarts@6`；唯一运行时核心依赖是 zrender。
- **获取方式**：CDN（jsDelivr）script 引入，或 npm 安装。
- **全量引入**：`import * as echarts from 'echarts'`——简单但**打包体积大**，生产项目应按需引入。
- **快速上手四步**：准备**有宽高**的 div → `echarts.init(dom)` → 组装 option → `chart.setOption(option)`。
- **按需引入五模块（v5+ 标准写法，必背）**：
  - `echarts/core`——核心与 `use` 注册入口；
  - `echarts/charts`——`BarChart`、`LineChart` 等图表（XxxChart）；
  - `echarts/components`——`TooltipComponent`、`GridComponent`、`DatasetComponent`、`TransformComponent` 等（XxxComponent）；
  - `echarts/renderers`——`CanvasRenderer` / `SVGRenderer`，**渲染器必须注册其一**；
  - `echarts/features`——`LabelLayout`、`UniversalTransition`。
- **最高频报错**：`Component grid not exists. Load it first`——用了 tooltip 的 `trigger: 'axis'` / dataset / transform，却漏 `use` 对应组件。
- **TS 严格类型**：用 `ComposeOption` 组合出只含所用组件的 Option 类型。
- **init 签名**：`echarts.init(dom, theme?, opts?)`；常用 opts：
  - `renderer: 'canvas'`（默认）或 `'svg'`；
  - `width` / `height`——容器无尺寸时显式指定；
  - `devicePixelRatio`（默认取 `window.devicePixelRatio`）、`locale`（v5+，如 `'ZH'` / `'EN'`）；
  - `useDirtyRect`（v5+ 脏矩形局部重绘）、`useCoarsePointer` + `pointerSize`（v5.4+ 手指粗点击扩大拾取）、`ssr`（v5.3+，仅 SVG）。
- **容器必须已有宽高**：`display: none` / 布局未完成时 init → 拿到 0 尺寸、图表空白（控制台有警告）；解法：先布局后 init、opts 显式 `width/height`、或显示后 `resize()`。
- **option 是组件声明集合**：title / legend / tooltip / xAxis / yAxis / series 各司其职；`series.type` 决定图表类型，同一 option 可多 series 混合（折柱混合）。
- **最小折线 / 柱状配置**：category x 轴 + value y 轴 + `series.data`；**饼图**不需要坐标轴，data 是 `{ name, value }` 数组。
- **tooltip 不声明不启用**：需要提示框就写 `tooltip: {}`。
- **legend 项对应 `series.name`**：名字对不上则图例不显示、不联动（高频坑）。
- **内置暗色主题**：`echarts.init(dom, 'dark')`。
- **渲染器选型**：
  - Canvas：大数据量（1k 点以上）、频繁交互、热力图 / 轨迹特效等像素级效果；
  - SVG：内存占用更低（移动端、多实例页面防崩溃）、浏览器缩放不模糊、低端设备；
  - v5.3 起 SVG 渲染性能提升 2-10 倍，官方建议拿不准就在真实场景实测；SSR 字符串输出仅 SVG 模式支持。
- **进阶顺序**：[实例与 option](./guide-line/instance-and-option) → [dataset 与系列](./guide-line/dataset-and-series) → [交互与视觉](./guide-line/interaction-and-visual) → [性能与规模化](./guide-line/performance-and-scale) → [v6 新特性](./guide-line/v6-features) → [参考](./reference)。

## 一、ECharts 是什么

ECharts 是 Apache 顶级项目（Apache-2.0 许可），底层基于 2D 图形渲染引擎 **zrender**——zrender 统一抽象了 Canvas 与 SVG 两种渲染后端，ECharts 在其上实现坐标系、series、组件与状态管理。使用者不需要命令式地「画」图，而是**声明式**地给出一个 option 对象描述整张图，剩下的布局、绘制、交互、动画全部由库完成。

和同类库的一句话对比（详见[参考](./reference)）：

- **vs Chart.js**：Chart.js 轻量（core 约几十 KB）、8 种基础图、Canvas 单渲染器，适合简单仪表盘；ECharts 图表类型、交互组件、大数据方案全面碾压，但包体大（按需引入后可控）。
- **vs D3**：D3 是数据驱动 DOM 的底层工具集，自由度天花板但一切自己画；ECharts 声明式开箱即用，自由度靠 custom series / graphic 兜底。「造轮子选 D3，交付业务选 ECharts」。
- **vs AntV G2**：G2 走图形语法（mark/encode/transform 组合推导图表），API 更可组合；ECharts 走「图表类型 + 配置项」枚举式心智，示例即抄即用，社区存量与大屏 / 地图实践更厚。

## 二、安装与全量引入

两种获取方式：

```bash
# npm 安装（推荐）
npm install echarts@6
# 当前最新版 6.1.0；也可用 CDN（jsDelivr）直接 script 引入
```

最简单的引入方式是全量引入：

```js
// 全量引入：所有图表与组件一次到位，但打包体积大
import * as echarts from 'echarts';
```

全量引入适合原型验证；**生产项目应按需引入**（下一节），否则打包体积会显著膨胀。

## 三、按需引入：echarts/core + use（必背）

v5 起的标准按需引入体系分五个模块：core（核心）、charts（图表）、components（组件）、renderers（渲染器）、features（特性）。写法固定：

```ts
// ① 核心模块：提供 init、use 等接口
import * as echarts from 'echarts/core';
// ② 图表：按 series 类型引入，命名规律 XxxChart
import { BarChart, LineChart } from 'echarts/charts';
// ③ 组件：按 option 顶层组件引入，命名规律 XxxComponent
import {
  TitleComponent, TooltipComponent, GridComponent,
  DatasetComponent, TransformComponent, LegendComponent
} from 'echarts/components';
// ④ 特性：标签自动布局、万物过渡动画（可选）
import { LabelLayout, UniversalTransition } from 'echarts/features';
// ⑤ 渲染器：Canvas / SVG 必须注册其一
import { CanvasRenderer } from 'echarts/renderers';

// 一次性注册本项目用到的能力
echarts.use([BarChart, LineChart, TitleComponent, TooltipComponent,
  GridComponent, DatasetComponent, TransformComponent, LegendComponent,
  LabelLayout, UniversalTransition, CanvasRenderer]);
```

配套的 TypeScript 严格类型：用 `ComposeOption` 组合出**只包含已注册组件**的 Option 类型，漏配在类型层就能暴露：

```ts
import type { ComposeOption } from 'echarts/core';
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts';
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components';

// 组合出严格的 option 类型：只含 bar/line 系列与 grid/tooltip 组件
type ECOption = ComposeOption<
  BarSeriesOption | LineSeriesOption | GridComponentOption | TooltipComponentOption
>;
```

::: warning 漏注册是最高频报错
报 `Component grid not exists. Load it first` 一类错误，多半是：用了 `tooltip: { trigger: 'axis' }`（依赖 GridComponent）、用了 dataset（依赖 DatasetComponent）、用了 transform（依赖 TransformComponent），却没有 `use` 对应组件；渲染器忘记注册也属此类。
:::

## 四、第一个图表：init → option → setOption

快速上手四步：准备有宽高的容器 → init → 组装 option → setOption。

```html
<!-- 容器必须已有宽高，否则 init 拿到 0 尺寸 -->
<div id="main" style="width: 600px; height: 400px;"></div>
```

```js
// ① 基于准备好的 DOM 初始化实例（第二参可传主题名，如 'dark'）
const chart = echarts.init(document.getElementById('main'));

// ② 声明式 option：一组组件声明，各司其职
const option = {
  title: { text: '第一个图表' },
  tooltip: {},                                   // tooltip 需显式声明才启用
  xAxis: { type: 'category', data: ['衬衫', '羊毛衫', '雪纺衫'] },
  yAxis: { type: 'value' },
  series: [{
    name: '销量',                                 // legend 项与之对应
    type: 'bar',                                  // series.type 决定图表类型
    data: [5, 20, 36]
  }]
};

// ③ 应用配置，图表随即渲染
chart.setOption(option);
```

init 的完整签名（类型文件实测）值得记住，第三参 opts 覆盖了渲染器、尺寸、语言、性能开关：

```js
echarts.init(dom, theme?, {
  renderer: 'canvas',            // 'canvas'（默认）| 'svg'
  devicePixelRatio: 2,           // 默认 window.devicePixelRatio
  width: 600, height: 400,       // 容器无尺寸时显式指定
  locale: 'ZH',                  // v5.0+，'ZH' / 'EN'
  useDirtyRect: false,           // v5.0+ 脏矩形局部重绘优化
  useCoarsePointer: true,        // v5.4+ 手指粗点击扩大拾取（配 pointerSize）
  ssr: false,                    // v5.3+ 服务端渲染模式（仅 SVG）
});
```

::: danger 容器无宽高是新手第一坑
在 `display: none` 的 Tab、`v-show` 未显示、flex 未撑开时 init，实例拿到 0 尺寸（控制台警告），图表一片空白。三种解法：**布局完成后再 init**、opts 显式传 `width`/`height`、或元素显示后调用 `chart.resize()`。
:::

## 五、渲染器选型：Canvas vs SVG

init 时通过 `renderer` 指定，按需引入时对应渲染器必须先注册：

```js
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
echarts.use([SVGRenderer]);
const chart = echarts.init(dom, null, { renderer: 'svg' });
```

| 维度 | Canvas（默认） | SVG |
| --- | --- | --- |
| 适用数据量 | 大数据量（1k 点以上）占优 | 中小数据量 |
| 交互 / 特效 | 频繁交互、热力图 / 轨迹特效等像素级效果 | 常规交互 |
| 内存 | 较高 | **更低**——移动端、同页多实例防崩溃 |
| 视觉 | 位图，缩放可能模糊 | 矢量，浏览器缩放不模糊 |
| 设备 | 主流设备 | 低端设备友好 |
| SSR | 需 node-canvas 出图 | `ssr: true` 字符串输出**仅 SVG 支持** |

v5.3 起 SVG 渲染器经虚拟 DOM 化改造，性能提升 2-10 倍，官方建议：**拿不准就在真实场景实测**。

---

跑通第一个图表后，下一步吃透实例生命周期与 setOption 合并语义——这是所有动态图表的地基，见[实例与 option](./guide-line/instance-and-option)。
