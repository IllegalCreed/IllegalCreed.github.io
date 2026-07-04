---
layout: doc
outline: [2, 3]
---

# 入门：图形语法、第一个图表与双 API 风格

> 基于 **AntV G2 v5.4**（npm latest 5.4.8，v5 minor 迭代较快，细节以 5.4.x 为基线）· 核于 2026-07

## 速查

- **定位**：蚂蚁 AntV 出品的「简洁的渐进式可视化语法」，名字与理念来自《The Grammar of Graphics》；**拒绝图表分类**，用基本标记与可视化组件的组合描述一切图表
- **七大核心概念**：Mark 标记（最小视觉单元）、Transform 转换（派生数据）、Scale 比例尺（数据→视觉映射）、Coordinate 坐标系（空间点变换）、Composition 视图复合（多视图管理）、Animation 动画（数据驱动）、Interaction 交互（按需探索）
- **心智公式**：一张图 ≈ `data + mark(type) + encode + transform + scale + coordinate + 组件(axis/legend/tooltip/label) + animate + interaction`
- **安装**：`npm install @antv/g2`；`import { Chart } from '@antv/g2'`；CDN 场景用全局 `G2.Chart`
- **第一个图表四步**：`new Chart({ container })` → `chart.options({ type, data, encode })` → `chart.render()`
- **container**：DOM id 字符串或 HTMLElement；**框架里用 ref 传元素**（字符串 id 在多实例 / 组件复用时会冲突）
- **尺寸**：默认 640×480；`autoFit: true`（默认 false）自适应容器，此时手动宽高被容器尺寸覆盖——容器必须先有实际尺寸
- **构造参数速记**：`container` / `autoFit` / `width` / `height` / `depth`（3D 用）/ `padding`（'auto'，组件区内边距）/ `margin`（16）/ `inset`（0，呼吸区）/ `clip`（false，裁剪溢出图形）/ `renderer`（默认 Canvas）/ `theme`（'classic'、'classicDark'、'academy' 或自定义对象）/ `plugins`
- **渲染器三选一**：`@antv/g-canvas` 内置默认（脏矩形优化）；`@antv/g-svg` 产出 DOM（利于无障碍 / 导出矢量）；`@antv/g-webgl` 大数据量高性能——SVG / WebGL 需**单独装包**后 `renderer: new SVGRenderer()`
- **`render()` 必须手动调用，返回 `Promise<Chart>`**：截图 / 测试须 `await chart.render()`（render 是异步的）
- **生命周期五阶段**：创建 `new Chart()` → 挂载容器 → `render()` 渲染 → 修改 options 后再次 `render()` 更新 → `destroy()` 销毁
- **`clear()` vs `destroy()`**：clear 清空画布、取消监听、清空图表配置但**保留实例**（可重新声明）；destroy 用于组件 / 页面卸载，**不调会内存泄漏**
- **数据更新**：`mark.changeData(newData)` = `.data(newData)` + `chart.render()` 语法糖，自动重渲染；**别每次 setState 都重建实例**
- **尺寸变更**：`chart.changeSize(w, h)`、`chart.forceFit()`（重新适配父容器），均触发重渲染
- **事件**：`chart.on / off / emit`；生命周期事件 `beforerender` / `afterrender`；元素事件 `element:click`、`element:pointerover`（`组件:事件名` 格式）
- **数据三形式**：内联数组（语法糖）/ `{ type: 'inline', value: [...] }` / `{ type: 'fetch', value: url }`（支持 json / csv）
- **远程数据可挂预处理**：`data: { type: 'fetch', value: url, transform: [...] }`（数据层变换，详见转换页）
- **encode 最小集**：`{ x: 字段, y: 字段 }`；color 加一个字段即自动分色 + 图例
- **双 API 完全等价**（官方表述）：Functional API **基于 Spec API 实现**，两者最终都渲染同一份 options，「声明可视化的能力完全等价」，可混用
  - Spec / Options 式：`chart.options({ type: 'interval', data, encode })`——当前官方文档主推
  - 函数式链：`chart.interval().data(data).encode('x', 'genre').encode('y', 'sold')`
- **函数式节点方法**：mark 类 `chart.interval() / line() / point() / area() / rect() / cell()` 等；复合容器类 `chart.view() / spaceLayer() / spaceFlex() / facetRect() / repeatMatrix() / timingKeyframe()` 等
- **实例配置方法**（获取或设置）：`options() / data() / encode() / scale() / transform() / coordinate() / axis() / legend() / tooltip() / label() / style() / theme() / interaction() / slider()`
- **定位节点更新**：`chart.getNodesByType('rect')[0].changeData(data)`——按 mark 类型定位后局部更新
- **React 集成**：chart 实例存 `useRef`；`useEffect(() => { ...; return () => chart.destroy(); }, [])`
- **Vue 集成**：`onMounted` 里创建、`onUnmounted` 里 destroy；容器用模板 ref
- **开箱封装**：React 只想要现成图表组件时直接用 `@ant-design/charts` / `@ant-design/plots`（Ant Design Charts 2.x 底层已是 G2 v5）
- **按需打包**：`extend(Runtime, { ...corelib() })` 只带核心库，Tree Shaking 减包体（geolib / 3dlib 等按需追加）
- **移动端 / 小程序**：G2 面向 Web / Node；该场景由 AntV 家族的 F2（或社区适配）承接
- **v4 教程陷阱**：见到 `position('x*y')`、`adjust('stack')`、geometry 链上 `.position()` 即 v4 资料，v5 完全不兼容
- **vs ECharts 一句话**：ECharts 给你一柜子成品图表，G2 给你一套造图表的语法
- **进阶顺序**：[标记与编码](./guide-line/marks-and-encode) → [转换与坐标系](./guide-line/transform-and-coordinate) → [比例尺与组件](./guide-line/scales-and-components) → [复合、交互与动画](./guide-line/composition-interaction-animation) → [参考](./reference)

## 一、图形语法：拒绝枚举图表类型

G2 的名字和设计理念都来自 Wilkinson 的《The Grammar of Graphics》（图形语法），官方对核心思想的表述是：「**拒绝图表分类，用一些基本标记和可视化组件去描述可视化**」。换句话说：

- **G2 中没有「柱状图 / 折线图 / 饼图」这样的图表类型**——「G2 中的所有图表都是由不同标记构成的」，图表不再是一个不可分割的整体，而是由具有不同用途的标记组合而成。
- 学 G2 不是背图表配置项清单，而是掌握一套**可组合的语法单元**，之后「造新图 = 换组合」。

官方列举的七大核心概念构成这套语法的骨架：

| 概念 | 职责 |
| --- | --- |
| **Mark 标记** | 最小视觉单元，一切图表的原子 |
| **Transform 转换** | 派生数据（堆叠、分组、分箱、抖动……） |
| **Scale 比例尺** | 抽象数据 → 视觉数据的映射 |
| **Coordinate 坐标系** | 对空间位置做点变换（直角、极坐标、螺旋……） |
| **Composition 视图复合** | 多视图的管理（分层、分面、重复……） |
| **Animation 动画** | 数据驱动的动画编排 |
| **Interaction 交互** | 按需探索数据 |

把它们串起来就是 G2 的心智公式：

**一张图 ≈ data + mark(type) + encode + transform + scale + coordinate + 组件(axis / legend / tooltip / label) + animate + interaction**

后面每个 guide 页都对应公式里的一段。

## 二、G2 vs ECharts：语法式与配置式

两者是国内可视化选型最常见的对比，范式差异是根源：

| 维度 | AntV G2 v5 | Apache ECharts 5 |
| --- | --- | --- |
| 范式 | **图形语法**：mark + encode + transform + coordinate 组合生成图表 | **配置式**：series.type 枚举图表类型，查文档拼 option |
| 心智 | 先学语法模型，之后「造新图 = 换组合」 | 上手即用，超出内置类型即困难（custom series 门槛陡增） |
| 非常规图 | 分面 / 复合 / 坐标系变换原生支持，小倍数图、SPLOM 一等公民 | 需 grid 多实例拼接或 custom series 手写 |
| 数据处理 | 内置 data.transform + mark transform（bin / group / normalize 声明式统计） | 多数聚合需在业务侧预处理数据 |
| API 风格 | options 声明式 + 函数式链双风格等价 | option 对象单风格（setOption） |
| 动画 | 动画属性 = 编码通道，数据驱动、关键帧 morphing | 预设动画为主，定制维度较少 |
| 图表广度 | 统计图表深；地图弱（L7 另管）、3D 有限 | 品类极广（地图 / 3D / 仪表盘全家桶），开箱效果丰富 |
| 生态 / 社区 | 蚂蚁系，中文文档好；社区规模较小 | Apache 顶级项目，社区 / 主题 / 示例海量 |
| 上层封装 | Ant Design Charts（React） | 各框架 wrapper（echarts-for-react 等） |

选型口径：**需求在成品清单内 ECharts 更快；需求长尾、组合多变、要统计变换与编码一致性时，G2 的边际成本更低**。数据探索 / 分析产品、React + AntD 技术栈倾向 G2；常规大屏 / 管理后台标准图表快速堆量、需要地图 / 3D 倾向 ECharts。

## 三、安装与第一个图表

```bash
npm install @antv/g2
```

```js
import { Chart } from '@antv/g2';

// ① 创建实例：container 可以是 DOM id 字符串或 HTMLElement
const chart = new Chart({
  container: 'container', // 框架里推荐传 ref 元素而非字符串 id
  autoFit: true,          // 自适应容器宽高，默认 false（默认尺寸 640×480）
});

// ② 声明可视化：一个 interval 标记 + 两个编码通道，就是柱状图
chart.options({
  type: 'interval',
  data: [
    { genre: 'Sports', sold: 275 },
    { genre: 'Strategy', sold: 115 },
    { genre: 'Action', sold: 120 },
    { genre: 'Shooter', sold: 350 },
    { genre: 'Other', sold: 150 },
  ],
  encode: { x: 'genre', y: 'sold' }, // x/y 通道绑定数据字段
});

// ③ 渲染：必须手动调用，返回 Promise
chart.render();
```

几个初次上手就会碰到的点：

- **`autoFit: true` 时手动宽高被容器尺寸覆盖**；容器还没布局（无高度）时图表高度会异常——先保证容器有实际尺寸。
- 其余构造参数：`padding: 'auto'`（组件区内边距）、`margin: 16`、`inset: 0`（呼吸区）、`clip: false`（是否裁剪溢出图形）、`theme`（'classic'、'classicDark'、'academy' 或自定义对象）、`renderer`（默认 Canvas，SVG / WebGL 需另装包）、`plugins`。
- 数据除了内联数组，还可以 `data: { type: 'fetch', value: 'https://.../data.json' }` 远程拉取（支持 json / csv，`format` 可指定），详见[转换与坐标系](./guide-line/transform-and-coordinate)。

## 四、Chart 实例与生命周期

Chart 实例的生命周期是五个阶段：**创建 `new Chart()` → 挂载容器 → `chart.render()` 渲染 → 修改 options 后再次 `render()` 更新 → `chart.destroy()` 销毁**。

```js
// render 是异步的，返回 Promise<Chart>——截图、测试要 await
await chart.render();

// 更新数据：changeData 是「.data(newData) + chart.render()」的语法糖
mark.changeData(newData);
// 也可按类型定位节点后更新
chart.getNodesByType('rect')[0].changeData(data);

// 尺寸变化（均触发重渲染）
chart.changeSize(800, 400); // 指定宽高
chart.forceFit();           // 重新适配父容器

// 事件总线
chart.on('afterrender', () => console.log('渲染完成')); // 生命周期事件 beforerender / afterrender
chart.on('element:click', (e) => console.log(e));       // 元素事件：「组件:事件名」格式

chart.destroy(); // 组件 / 页面卸载时必调
```

**`clear()` 与 `destroy()` 的区别**是高频考点：

| 方法 | 行为 | 场景 |
| --- | --- | --- |
| `clear()` | 清空画布和取消事件监听，**同时清空图表配置**，但保留实例 | 同一实例重新声明一张完全不同的图 |
| `destroy()` | 销毁画布和取消事件监听 | 组件卸载 / 页面离开，防内存泄漏 |

两个工程习惯：**render 之后立即截图 / 取 DOM 可能拿到空画布**（须 await 或 then）；**数据更新用 `changeData` 或改 options 后再次 `render()` 增量更新**，每次都 `new Chart` 性能极差。

## 五、双 API 风格：options 声明式 vs 函数式链

官方 API 页原文：「**Functional API 是基于 Spec API 实现的**……Functional API 通过一系列方法去生成 options，Spec API 直接设置 options。不论哪种形式，G2 最后都是直接渲染当前的 options，所以**两者声明可视化的能力完全等价**」。

```js
// ① Spec / Options 声明式（当前官方文档主推风格）
chart.options({
  type: 'interval',
  data: [{ genre: 'Sports', sold: 275 }],
  encode: { x: 'genre', y: 'sold' },
});

// ② 函数式链（Functional API）——生成的还是同一份 options
chart
  .interval()
  .data([{ genre: 'Sports', sold: 275 }])
  .encode('x', 'genre')
  .encode('y', 'sold');

chart.render(); // 两种写法都要手动 render
```

- **历史沿革**：Spec API 在 v5 早期文档路径叫 `experimental-spec-api`（实验性），现已「转正」为 quick-start 默认风格。
- **两种可混用**：函数式链快速搭骨架、options 整体声明存档 / 序列化，随意切换。
- 函数式节点方法分两类：mark 类（`chart.interval() / line() / area() / point() / rect() / cell() / sankey() / treemap() / geoPath() / point3D()` 等）与复合容器类（`chart.view() / spaceLayer() / spaceFlex() / facetRect() / facetCircle() / repeatMatrix() / geoView() / timingKeyframe()`）。
- 实例配置方法（获取或设置双用）：`options() / attr() / data() / encode() / scale() / transform() / coordinate() / axis() / legend() / tooltip() / label() / style() / theme() / interaction() / slider()`。

本笔记后续示例以 options 声明式为主（与官方文档一致），必要处对照函数式写法。

## 六、在 React / Vue 中集成

核心范式一句话：**ref 拿容器元素、挂载时创建、卸载时 destroy、数据变化用 changeData**。

```jsx
// React：实例存 useRef，useEffect 里创建 + 清理
function BarChart({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    // 容器用 ref 传 HTMLElement 而非字符串 id（防多实例 id 冲突）
    const chart = new Chart({ container: containerRef.current, autoFit: true });
    chart.options({ type: 'interval', data, encode: { x: 'genre', y: 'sold' } });
    chart.render();
    chartRef.current = chart;
    return () => chart.destroy(); // 卸载必调，防内存泄漏
  }, []);

  return <div ref={containerRef} />;
}
```

- **Vue** 同理：`onMounted` 里 `new Chart` + `render`，`onUnmounted` 里 `destroy`，容器用模板 ref。
- **数据变化用 `changeData` 而非重建实例**：SPA 里每次状态更新都 `new Chart` 是最常见的性能反模式。
- 只想要开箱即用的 React 图表组件时，直接用 `@ant-design/charts` / `@ant-design/plots`（Ant Design Charts 2.x 底层已是 G2 v5）。

## 七、鉴别 v4 老资料

v5 与 v4 **完全不兼容**（架构重写；v4 官网已迁至 g2-v4.antv.vision，官方对 v4 的维护承诺止于 2023 年底）。搜索引擎和老博客里大量教程仍是 v4 写法，**判别标志**：

- 见到用 `*` 连接字段的 `position('x*y')`；
- 见到 geometry 链上的 `.position()`、`.color('field')`、`adjust('stack')`；
- 见到 `chart.scale('field', {...})`（v5 的 scale 绑**通道**不绑字段）。

命中任何一条即 v4 资料，照抄必报错。v4 → v5 的系统迁移对照见[参考](./reference)。

---

理解了「图表 = 标记的组合」之后，下一步先看这套语法里最核心的两员：[标记与编码](./guide-line/marks-and-encode)——Mark 决定画什么，Encode 决定数据如何变成视觉。
