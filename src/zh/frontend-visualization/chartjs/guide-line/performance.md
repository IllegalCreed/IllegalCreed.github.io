---
layout: doc
outline: [2, 3]
---

# 性能优化与实例管理：destroy / update / decimation / OffscreenCanvas

> 基于 **Chart.js 4.5.x** · 核于 2026-07

## 速查

- **「Canvas is already in use」**：同一 canvas 重复 `new Chart` 必炸——先 `Chart.getChart(canvas)?.destroy()`，或组件卸载钩子里 `chart.destroy()`（SPA / 热更新最高频坑）
- **`destroy()`**：复用 canvas 前**必须调用**，清理引用与事件监听——SPA 卸载必做，否则内存泄漏 + 重建报错
- **`Chart.getChart(key)`**：按 canvas（id / 元素 / ctx）反查实例，找不到返回 undefined——重建前防重复 new 的钥匙
- **`Chart.instances`**：全部实例注册表（打印 resize 场景遍历用）
- **数据更新范式**：直接 push / pop `chart.data.labels` 与 `chart.data.datasets[i].data`，然后 `chart.update()`
- **`update(mode?)`**：`'none'`（跳过动画）/ `'reset'` / `'resize'` / `'show'` / `'hide'` / `'active'`；也可传函数按 dataset 定制
- **整对象替换**：`chart.options` 支持整对象替换后再 `update()`
- **换轴注意**：换轴 id / type 后旧 `chart.scales` 引用失效
- **spanGaps 数字形式**：给毫秒数 = 仅跨越不超过该时间距离的 null 缺口
- **打印坑**：打印时 resize 事件不触发——`onbeforeprint` 里遍历 `Chart.instances` 手动 `resize()`
- **`resizeDelay`**：响应式 resize 的防抖毫秒数（默认 0），容器高频变化时的重绘阀门
- **其他实例方法**：`reset()`（回初始动画前）、`render()`（重绘不重布局）、`stop()`（停动画）、`clear()`（清画布）、`resize(w?, h?)`（无参 = 适配容器）
- **导出**：`toBase64Image(type?, quality?)` 如 `('image/jpeg', 1)`；PNG 默认**透明底**——白底用背景插件（见[插件页](./plugins-and-custom)）
- **显隐两套 API**：dataset 级 `setDatasetVisibility(i, bool)` / `hide(i, dataIndex?)` / `show(...)`（hide/show 带过渡动画）；**数据条目级** `toggleDataVisibility(index)` / `getDataVisibility(index)`（pie 用）
- **程序化高亮**：`setActiveElements([{ datasetIndex, index }])`；查插件 `isPluginEnabled(id)`
- **元数据**：`getDatasetMeta(i)` / `getSortedVisibleDatasetMetas()` 取元素级 meta
- **性能手段 ① 禁动画**：`animation: false` → 单次渲染 + 自动启用 Path2D 缓存
- **性能手段 ② decimation 降采样**（line 专用，默认 disabled）：`plugins.decimation: { enabled, algorithm, samples, threshold }`
- **decimation 启用前提（五条全满足）**：dataset `indexAxis: 'x'`、line 类型、x 轴 linear / time、**`parsing: false`**、数据点数超 threshold（默认 4×画布宽）
- **算法取舍**：`lttb` 保趋势大幅减点；`min-max` 保峰值（噪声信号），每像素最多 4 点
- **decimation 属 v4 内置插件**：按需注册路线下别漏 `Chart.register(Decimation)`
- **性能手段 ③**：`parsing: false` + 内部格式喂数（数据必须**已排序**，如 category 轴内部是整数索引）
- **normalized: true 三前提**：数据唯一、已排序、各 dataset 索引一致
- **性能手段 ④ 轴与刻度**：指定 `min` / `max` 免全量扫描算范围；`ticks.sampleSize` 只测量子集；`minRotation === maxRotation` 跳过旋转计算
- **性能手段 ⑤ line 专项**：保持 `tension: 0`（默认）走自动路径抽稀（tension / stepped / borderDash 全默认时生效）、`spanGaps: true` 省分段开销、`showLine: false` 只画点、`pointRadius: 0` 只画线
- **性能手段 ⑥ Web Worker + OffscreenCanvas**：`canvas.transferControlToOffscreen()` 后 postMessage 给 worker 内 new Chart
- **Worker 三限制**：配置里**不能带函数**、worker **无 DOM**、resize 需**手动**

## 一、实例生命周期：destroy 与「Canvas is already in use」

Chart.js 一个 canvas 只能挂一个实例。SPA（Vue / React 热更新、路由切换、组件重建）里最高频的报错就是**同一 canvas 重复 `new Chart`** 导致的「Canvas is already in use」：

```js
// 重建前：按 canvas（id/元素/ctx）反查旧实例，有则销毁
Chart.getChart(canvas)?.destroy();   // 找不到返回 undefined，可安全链式
const chart = new Chart(canvas, config);

// SPA 组件卸载钩子里必做，否则内存泄漏 + 下次重建报错
chart.destroy();
```

- `destroy()` 会清理引用与事件监听，**复用 canvas 前必须调用**。
- 静态注册表 `Chart.instances` 收录全部存活实例——打印场景 resize 事件不触发，就靠 `onbeforeprint` 遍历它逐个 `resize()`。

## 二、更新数据的正确姿势：update(mode)

官方 addData / removeData 范式——**直接改 `chart.data`，然后 `update()`**：

```js
// 加一条数据：labels 和每个 dataset 的 data 同步 push
chart.data.labels.push(label);
chart.data.datasets.forEach((dataset) => {
  dataset.data.push(newData);
});
chart.update();          // 带动画重绘

// 删数据同理 pop 后 update
chart.update('none');    // 跳过动画（高频刷新场景）
```

- `update(mode)` 全模式：`'none'` / `'reset'` / `'resize'` / `'show'` / `'hide'` / `'active'`；还可传**函数**按 dataset 定制过渡。
- 整对象替换 `chart.options` 也支持；注意**换轴 id / type 后旧 `chart.scales` 引用失效**，要重新获取。

## 三、实例 API 速览

| 方法 | 要点 |
| --- | --- |
| `update(mode?)` | 改完 data / options 后调用；`'none'` 跳过动画 |
| `destroy()` | 复用 canvas 前必须调用（SPA 卸载必做） |
| `reset()` | 回到初始动画前状态 |
| `render()` | 重绘（不重新布局 / 更新数据） |
| `stop()` | 停止当前动画（可链式） |
| `resize(w?, h?)` | 手动改尺寸；无参 = 适配容器 |
| `clear()` | 清空画布（可链式） |
| `toBase64Image(type?, quality?)` | 导出图片，如 `('image/jpeg', 1)`；PNG 默认透明底 |
| `getElementsAtEventForMode(e, mode, options, useFinalPosition)` | 事件 → 命中元素数组（见[交互页](./scales-and-interactions)） |
| `getDatasetMeta(i)` / `getSortedVisibleDatasetMetas()` | 取元素级元数据 |
| `setDatasetVisibility(i, bool)` / `hide(i, dataIndex?)` / `show(...)` | **dataset 级**显隐（hide / show 带过渡动画） |
| `toggleDataVisibility(index)` / `getDataVisibility(index)` | **数据条目级**显隐（pie / doughnut / polarArea 图例点击走这套） |
| `setActiveElements([{ datasetIndex, index }])` | 程序触发高亮 |
| `isPluginEnabled(id)` | 检查插件是否启用 |
| 静态 `Chart.getChart(key)` | 按 canvas 反查实例——防重复 new 的钥匙 |
| 静态 `Chart.instances` | 全部实例注册表 |

## 四、性能优化清单（官方 Performance 页）

### 1. 禁动画

```js
options: { animation: false }  // 单次渲染，且自动启用 Path2D 缓存
```

### 2. decimation 降采样插件（line 专用）

默认 disabled，启用前提**五条全部满足**：dataset `indexAxis: 'x'`、line 类型、x 轴 linear / time、**`parsing: false`**、数据点数超 threshold（默认 4×画布宽）——「配了没生效」几乎都是缺前提：

```js
options: {
  parsing: false,               // 前提之一：关闭解析、按内部格式喂数
  plugins: {
    decimation: {
      enabled: true,
      algorithm: 'lttb'         // 'lttb' 保趋势大幅减点；'min-max' 保峰值（噪声信号，每像素最多 4 点）
      // 另有 samples、threshold 选项
    }
  }
}
```

### 3. parsing: false + normalized: true

跳过解析直接吃**内部格式**数据（须已排序）；数据唯一、已排序、各 dataset 索引一致时再加 `normalized: true`。

### 4. 轴与刻度

- 指定轴 `min` / `max`：免去全量扫描算范围。
- `ticks.sampleSize`：只测量部分标签加速布局。
- `minRotation === maxRotation`：跳过旋转计算。

### 5. line 专项

- 保持 `tension: 0`（默认）走**自动路径抽稀**——tension / stepped / borderDash 全默认时生效。
- `spanGaps: true` 省分段开销（有 null 缺口时反而更快）。
- `showLine: false` 只画点；`pointRadius: 0` 只画线。

### 6. Web Worker + OffscreenCanvas

把渲染整个挪出主线程：

```js
// 主线程：移交 canvas 控制权
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);

// worker 线程：对 OffscreenCanvas 正常 new Chart
onmessage = (event) => {
  const chart = new Chart(event.data.canvas, config);
};
```

**三个限制**：配置里**不能带函数**（postMessage 序列化不了）、worker 内**无 DOM**、resize 需**手动**处理。

下一页：[参考](../reference) —— 图表类型 / 配置命名空间 / 实例 API / v2→v4 迁移映射速查表与易错点清单。
