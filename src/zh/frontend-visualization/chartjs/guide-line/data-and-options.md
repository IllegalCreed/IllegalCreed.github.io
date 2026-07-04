---
layout: doc
outline: [2, 3]
---

# 数据结构与 options 体系：四种数据格式 / parsing / scriptable / 响应式

> 基于 **Chart.js 4.5.x** · 核于 2026-07

## 速查

- **data 结构**：`data = { labels?, datasets: [...] }`；`labels` 服务**索引轴**（category 轴）；labels 长度须匹配最大 dataset 长度（短了尾部点无标签）
- **dataset.data 四种格式**：
  - `[20, 10]` —— primitive 数组，配 labels 按索引对齐
  - `[[10, 20], [15, null]]` —— `[x, y]` 元组
  - `[{ x: 10, y: 20 }]` —— 对象数组（scatter / bubble 标配，bubble 再加 `r`）
  - `{ January: 10, February: 20 }` —— 键值对对象（键作索引）
- **parsing 字段映射**：`parsing: { xAxisKey: 'id', yAxisKey: 'nested.value' }`，支持点号嵌套路径；pie / doughnut / radar 单值类用 `parsing: { key: '...' }`
- **属性名本身含点号**：写 `'data\\.key'` 转义
- **`parsing: false`**（chart 或 dataset 级）：跳过解析走性能路线——数据必须**已排序且符合内部格式**（如 category 轴内部是整数索引）
- **dataset 通用属性**：`label`（图例 / tooltip 文案）、`order`（绘制权重）、`stack`（堆叠分组）、`hidden`、`clip`、`parsing`
- **null = 跳过的点**：line 图断线；`spanGaps: true`（或最大可跨毫秒数）连上
- **options 解析优先级**（高 → 低）：`options` → `overrides[config.type]`（类型级默认）→ `defaults`（`Chart.defaults` 全局）
- **dataset 级**再在最前面插入 `dataset.{...}` 与 `options.datasets[type]`
- **改全局默认**：`Chart.defaults.backgroundColor = '#9BD0F5'`、`Chart.defaults.font.size = 16`
- **scriptable options**：绝大多数样式项可给函数，签名 `(context, options)`，按上下文动态求值
- **context 七类**：`chart` / `dataset` / `data` / `scale` / `tick` / `pointLabel` / `tooltip`；写通用函数先判 `context.type`
- **indexable options**：样式项给数组，按数据索引循环取用——pie 每扇区一色即此机制
- **响应式五件套**：`responsive: true`（默认）、`maintainAspectRatio: true`（默认）、`aspectRatio: 2`（radial 类为 1）、`onResize(chart, size)`、`resizeDelay: 0`
- **容器铁律**：Chart.js **监听的是父容器**——canvas 外包**专属 + 相对定位**的 div，宽高设在容器上而非 canvas 上
- **JS 手改容器高度生效前提**：`maintainAspectRatio: false`
- **打印坑**：resize 事件不触发——`onbeforeprint` 里遍历 `Chart.instances` 手动 `resize()`
- **手动模式**：`responsive: false` 时用 `chart.resize(width, height)` 控制
- **默认色**：`backgroundColor` / `borderColor` 均 `rgba(0,0,0,0.1)`，字色 `#666`
- **Colors 插件**（v4 内置）：自动循环 7 种品牌色；按需注册 `Chart.register(Colors)`；UMD 版默认启用；动态数据集配 `forceOverride: true`
- **颜色取值**：hex / rgb(a) / hsl(a) 字符串及 CanvasPattern / CanvasGradient 对象
- **字体全局**：`Chart.defaults.font = { family, size: 12, style: 'normal', lineHeight: 1.2 }`，局部（如 `legend.labels.font`）覆盖全局
- **动态 webfont**：`document.fonts.ready` 后需 `chart.update()`，否则用回退字体渲染
- **无障碍**：canvas 内容屏幕阅读器不可见——`role="img"` + `aria-label`，或 canvas 标签内写有意义的 fallback 内容
- **动画默认**：`duration: 1000`、`easing: 'easeOutQuart'`（共 30 种）；另有 `delay` / `loop`、回调 `onProgress` / `onComplete`
- **禁动画**：`animation: false` 整体禁用（单次渲染，且自动启用 Path2D 缓存）
- **按属性精调**：`animations.{property}` 给 `{ properties, from, to, type, duration, easing }`；默认数值组 x / y / borderWidth / radius / tension，颜色组 color / borderColor / backgroundColor
- **transitions 四场景**：`active`（hover，400ms）、`resize`（0ms）、`show` / `hide`（图例切换数据集的渐入 / 渐出）

## 一、data 的四种格式

`data = { labels?, datasets: [...] }`，`labels` 服务于**索引轴**（category 轴）。dataset.data 支持 4 种格式：

```js
data: [20, 10]                                  // ① primitive 数组，配 labels 按索引对齐
data: [[10, 20], [15, null]]                    // ② [x, y] 元组
data: [{ x: 10, y: 20 }, { x: '2016-12-25', y: 20 }]  // ③ 对象数组（scatter/bubble 标配，bubble 加 r）
data: { January: 10, February: 20 }             // ④ 键值对对象（键作索引）
```

两个易错点：

- **labels 数量要对齐**：labels 长度须匹配最大 dataset 长度，短了尾部点无标签。
- **`null` 表示跳过的点**：line 图在 null 处断线是默认行为；用 `spanGaps: true`（或给一个最大可跨的毫秒距离数字）连接缺口。

## 二、dataset 通用属性

每个 dataset 除了 `data` 还有一组通用属性：

| 属性 | 作用 |
| --- | --- |
| `label` | 图例与 tooltip 显示的系列名 |
| `order` | 绘制权重（mixed 图层叠控制的关键，见[插件与自定义](./plugins-and-custom)） |
| `stack` | 堆叠分组名 |
| `hidden` | 初始隐藏 |
| `clip` | 绘制裁剪 |
| `parsing` | dataset 级解析配置（可覆盖 chart 级） |

## 三、parsing：字段映射与关闭解析

对象数组配非 x/y 属性名时，用 `parsing` 映射字段（支持点号嵌套路径）：

```js
data: { datasets: [{ data: [{ id: 'Sales', nested: { value: 1500 } }] }] },
options: { parsing: { xAxisKey: 'id', yAxisKey: 'nested.value' } }
// pie/doughnut/radar 单值类：parsing: { key: 'nested.value' }
// 属性名本身含点号：'data\\.key' 转义
```

**`parsing: false`**（chart 或 dataset 级）跳过解析，是大数据性能路线的地基——前提是数据**已排序且符合内部格式**（例如 category 轴的内部格式是整数索引）。它同时也是 decimation 降采样插件的启用前提之一（见[性能优化](./performance)）。

## 四、options 解析层级与全局默认

一个配置项最终取什么值，按**优先级从高到低**解析：

1. `options` —— 实例配置
2. `overrides[config.type]` —— 图表类型级默认
3. `defaults` —— `Chart.defaults` 全局默认

dataset 级选项再在最前面插入两层：`dataset.{...}`（数据集自身）与 `options.datasets[type]`（配置里的类型级数据集默认）。

改全局默认的姿势：

```js
Chart.defaults.backgroundColor = '#9BD0F5'; // 全局默认填充色
Chart.defaults.font.size = 16;              // 全局字号
```

## 五、scriptable options：样式项给函数

绝大多数样式项都可以给一个函数，按上下文动态求值：

```js
backgroundColor: (ctx) => {
  const v = ctx.dataset.data[ctx.dataIndex];
  return v < 0 ? 'red' : 'green';       // 负值红、正值绿
}
```

- 签名是 `(context, options)`。
- context 按调用位置分 **7 类**：`chart` / `dataset`（含 datasetIndex、active、mode）/ `data`（含 dataIndex、parsed、raw、element）/ `scale` / `tick` / `pointLabel` / `tooltip`——写通用函数应先判断 `context.type`。

## 六、indexable options：样式项给数组

样式项给数组时按**数据索引循环取用**：

```js
backgroundColor: ['red', 'blue', 'green'] // 第 1/2/3 个数据依次取色，超出循环
```

pie 图「每扇区一色」就是这个机制。

## 七、响应式

| 选项 | 默认 | 含义 |
| --- | --- | --- |
| `responsive` | `true` | 跟随**容器**尺寸变化重绘 |
| `maintainAspectRatio` | `true` | resize 时锁定宽高比 |
| `aspectRatio` | 2（radial 类为 1） | 宽 / 高比 |
| `onResize` | `null` | resize 回调 `(chart, size)` |
| `resizeDelay` | `0` | 防抖毫秒 |

**关键机制**：canvas 的 render size（width / height 属性）不能用相对单位，且 canvas 自身尺寸变化无法直接侦测——Chart.js **监听的是父容器**。因此：

```html
<div class="chart-container" style="position: relative; height:40vh; width:80vw">
  <canvas id="chart"></canvas>
</div>
```

- 容器必须**相对定位**且**专属**（只放这一个 canvas），宽高设在容器上而非 canvas 上。
- JS 手改容器高度要生效，前提是 `maintainAspectRatio: false`——否则高度塌陷 / 无限增高的怪象多半源于此。
- **打印场景** resize 事件不触发：挂 `onbeforeprint` 遍历 `Chart.instances` 手动 `resize()`。
- `responsive: false` 时用 `chart.resize(width, height)` 手动控制。

## 八、颜色、字体与无障碍

- **默认色**：未指定时全局默认 `backgroundColor: rgba(0,0,0,0.1)`、`borderColor: rgba(0,0,0,0.1)`、字色 `#666`。
- **Colors 插件**（v4 内置）：自动循环 7 种品牌色给 dataset 配色；按需注册场景要 `Chart.register(Colors)`，UMD 版默认启用；动态增删数据集时配 `forceOverride: true`。颜色值接受 hex / rgb(a) / hsl(a) 字符串及 CanvasPattern / CanvasGradient 对象。
- **字体**：全局 `Chart.defaults.font = { family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif", size: 12, style: 'normal', lineHeight: 1.2 }`；局部（如 `legend.labels.font`）覆盖全局。**动态 webfont** 加载完成前渲染的图表会用回退字体——`document.fonts.ready` 后再 `chart.update()`。
- **无障碍**：canvas 内容**屏幕阅读器不可见**，必须给 canvas 加 `role="img"` + `aria-label`，或在 canvas 标签内写有意义的 fallback 内容（「浏览器不支持」类文案不算）。

## 九、动画与过渡

- `options.animation`：`duration`（默认 **1000ms**）、`easing`（默认 **'easeOutQuart'**，共 30 种）、`delay`、`loop`；回调 `onProgress` / `onComplete`（收 `{ currentStep, numSteps, initial }`）。
- `animation: false` 整体禁用——单次渲染的性能手段，且禁动画会自动启用 Path2D 缓存。
- `options.animations.{property}`：按属性精调 `{ properties, from, to, type, duration, easing }`；默认数值组 `x / y / borderWidth / radius / tension`、颜色组 `color / borderColor / backgroundColor`。
- `options.transitions`：四种内置场景态——`active`（hover，400ms）、`resize`（0ms）、`show` / `hide`（图例切换数据集时颜色透明渐入 / 渐出）。

下一页：[坐标轴与交互](./scales-and-interactions) —— scales 对象键式写法、time adapter、min/max 语义、interaction 六种 mode 与 tooltip 定制。
