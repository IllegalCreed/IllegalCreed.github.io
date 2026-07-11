---
layout: doc
outline: [2, 3]
---

# 入门：观察器模式与共同 API 形状

> 基于各 Observer 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：Observer 是浏览器内建的一组**异步观察器**——你声明"观察什么"，浏览器在渲染管线恰当时机**批量回调**"变了什么"，取代 `scroll`/`resize` 事件与轮询。
- **五个成员**：`IntersectionObserver`（可见性/交叉）· `ResizeObserver`（尺寸）· `MutationObserver`（DOM 变化）· `PerformanceObserver`（性能条目）· `ReportingObserver`（弃用/干预报告）。
- **为何取代旧范式**：`scroll`/`resize` 事件在主线程**高频触发**、回调里读 `getBoundingClientRect` 易引发**强制同步布局**（layout thrashing）；`setInterval` 轮询空转耗电。观察器由浏览器驱动、同帧合并、后台标签页可暂停。
- **共同 API 形状**：`new XObserver(callback)` → `observe(...)` 开始 → `disconnect()` 全停；回调签名统一为 `(records, observer) => {}`，`records` 是**一批**变化。
- **`observe` 的差异**：Intersection/Resize/Mutation 传 **DOM 目标**（Resize/Mutation 还带 options）；Performance 传 **`{ entryTypes }` 或 `{ type, buffered }`**（无目标）；Reporting 的 `observe()` **无参**（配置在构造函数）。
- **配置在哪**：`IntersectionObserver` 与 `ReportingObserver` 的配置在**构造函数**（IO 构造后不可改）；`ResizeObserver`/`MutationObserver` 的配置在**每次 `observe`**；`PerformanceObserver` 在 `observe`。
- **`unobserve` 只有两家**：`IntersectionObserver` 与 `ResizeObserver` 能停单个目标；Mutation/Performance/Reporting **没有** `unobserve`，只能 `disconnect` 全停或重新配置。
- **`takeRecords` 四家有**：IO/Mutation/Performance/Reporting 可**同步取走**待派发记录并清空队列；**`ResizeObserver` 没有** `takeRecords`。
- **回调时机各不同**：IO 交叉状态变化时异步入队；Resize **布局后、绘制前**；Mutation **微任务**（当前任务 DOM 改完后）；Performance 条目产生后异步；Reporting 报告产生后异步。
- **首帧行为**：`IntersectionObserver` 与 `ResizeObserver` 在 `observe` 后会**立即回调一次**报告初始状态；`MutationObserver` **不会**为已有内容回调（只报此后的变化）。
- **一个观察器管多目标**：同一个 IO/Resize/Mutation 实例可 `observe` 多个元素，回调里用 `entry.target`/`record.target` 区分来源。
- **批处理是内建的**：一批变化合成一个 `records` 数组、一次回调——别假设"一次变化一次回调"，务必 `for (const r of records)` 遍历。
- **`IntersectionObserver`**：`root`（默认视口）+ `rootMargin`（扩/缩根边界）+ `threshold`（交叉比例，单值或数组）；`entry.isIntersecting`/`intersectionRatio`。懒加载/无限滚动/曝光埋点三大场景 → [详见](./guide-line/intersection-observer)。
- **`ResizeObserver`**：`observe(el, { box })`，box = `content-box`（默认）/`border-box`/`device-pixel-content-box`；读 `entry.contentBoxSize[0].inlineSize`；"loop 告警"是回调改尺寸引发 → [详见](./guide-line/resize-observer)。
- **`MutationObserver`**：`observe(el, options)` **必须**至少给 `childList`/`attributes`/`characterData` 之一，否则 `TypeError`；`subtree` 扩到后代；取代已废弃的 Mutation Events → [详见](./guide-line/mutation-observer)。
- **`PerformanceObserver`**：`observe({ entryTypes: [...] })` 或 `observe({ type, buffered: true })`（**`buffered` 只配 `type`**）；`entryType` 有 `navigation`/`resource`/`paint`/`largest-contentful-paint`/`longtask`/`event` 等 → [详见](./guide-line/performance-reporting-observer)。
- **边界·优化章**：IO 的懒加载/预加载**工程优化**口径在优化章「懒加载和预加载」（规划中）；Performance 的 **Web Vitals 指标解读**（LCP/CLS/INP）在优化章「性能评估」（规划中）——本叶只讲 API 机制与"有哪些 entryType"。
- **相邻叶**：把重 I/O 挪出主线程用 [Web Workers](/zh/web-advanced/web-api/web-workers/)；结构化数据用 [IndexedDB](/zh/web-advanced/web-api/indexeddb/)。
- **进阶顺序**：本页 → [IntersectionObserver](./guide-line/intersection-observer) → [ResizeObserver](./guide-line/resize-observer) → [MutationObserver](./guide-line/mutation-observer) → [PerformanceObserver 与 ReportingObserver](./guide-line/performance-reporting-observer) → [参考](./reference)。

## 一、观察器模式：为什么取代 scroll/resize 事件与轮询

在观察器出现之前，"元素滚进视口了吗""这个 `div` 尺寸变了吗""列表被别的脚本改了吗"这类问题都靠两种笨办法：

1. **高频事件监听**：给 `window` 挂 `scroll`/`resize`，在回调里 `getBoundingClientRect()` 反复量位置。
2. **定时轮询**：`setInterval` 每隔几十毫秒查一遍状态。

两者都在**主线程**上高频运行，而且有个隐蔽的性能杀手——**强制同步布局（forced synchronous layout / layout thrashing）**：`scroll` 回调里刚读了 `getBoundingClientRect()`（触发浏览器把待处理的样式改动立即算成布局），紧接着又改了样式，下一次读又得重算……读写交替把本可批处理的布局拆成一次次同步计算，滚动直接卡顿。

观察器把这套彻底反转：

| 维度 | `scroll`/`resize` 事件 + 轮询 | Observer |
| --- | --- | --- |
| 谁驱动 | 你的 JS 在主线程高频跑 | **浏览器**在渲染管线恰当时机驱动 |
| 频率 | 每次滚动/每个 tick 都触发 | 只在**关心的变化真的发生**时回调 |
| 布局读取 | 手动 `getBoundingClientRect`，易 thrashing | 浏览器内部算好，**结果直接给你** |
| 批处理 | 自己写防抖/节流 | **内建**：同帧多次变化合成一批 |
| 后台标签页 | 照常空转耗电 | 浏览器可**暂停** |
| 多目标 | 自己维护列表逐个量 | 一个观察器 `observe` 多个，回调带 `target` |

核心心智：**观察器是"声明式 + 异步 + 批处理"的**。你只声明"我关心 X 的某种变化"，剩下的"何时算、算完了通知你"全交给浏览器，它能在最省的时机（布局已算好、准备绘制前）一次性把这一批变化派发给你的回调。

## 二、五类 Observer 的定位

| 观察器 | 观察对象 | 典型问题 | 深入 |
| --- | --- | --- | --- |
| `IntersectionObserver` | 元素与 **root（视口/祖先）** 的交叉可见性 | 元素进视口了吗？可见了百分之几？ | [IO 页](./guide-line/intersection-observer) |
| `ResizeObserver` | 单个元素的**尺寸**变化 | 这个容器变宽/变窄了吗？ | [Resize 页](./guide-line/resize-observer) |
| `MutationObserver` | **DOM 树**的结构/属性/文本变化 | 有人往这个列表里加/删/改节点了吗？ | [Mutation 页](./guide-line/mutation-observer) |
| `PerformanceObserver` | **性能条目**（Performance Timeline） | 有新的资源加载/绘制/长任务条目吗？ | [Perf 页](./guide-line/performance-reporting-observer) |
| `ReportingObserver` | **报告**（弃用、浏览器干预等） | 我的页面用了将废弃的 API 吗？ | [Perf 页](./guide-line/performance-reporting-observer) |

前三个是**DOM 观察器**（观察页面元素），后两个观察的是**浏览器产生的信息流**（性能数据、报告）。五者 API 形状高度一致，但观察对象与回调时机各有讲究。

## 三、共同 API 形状：observe / unobserve / disconnect / takeRecords

所有观察器都遵循同一套骨架——构造时传回调，`observe` 开始，`disconnect` 收工：

```js
// 骨架：五类观察器通用
const observer = new SomeObserver((records, obs) => {
  // records 是一批变化（数组），obs 是观察器自身，便于在回调里 unobserve/disconnect
  for (const record of records) {
    // 处理单条变化……
  }
});

observer.observe(/* 目标或配置，因观察器而异 */);
// ……
observer.disconnect(); // 停止一切观察，释放引用
```

但四个方法的**有无与签名因观察器而异**，这张矩阵是本叶最该记住的结构差异：

| 观察器 | 构造签名 | `observe` 签名 | `unobserve` | `disconnect` | `takeRecords` |
| --- | --- | --- | --- | --- | --- |
| `IntersectionObserver` | `(cb, options)` | `observe(target)` | ✅ `unobserve(target)` | ✅ | ✅ |
| `ResizeObserver` | `(cb)` | `observe(target, { box })` | ✅ `unobserve(target)` | ✅ | ❌ |
| `MutationObserver` | `(cb)` | `observe(target, options)` | ❌ | ✅ | ✅ |
| `PerformanceObserver` | `(cb)` | `observe({ entryTypes })` \| `observe({ type, buffered })` | ❌ | ✅ | ✅ |
| `ReportingObserver` | `(cb, options)` | `observe()`（无参） | ❌ | ✅ | ✅ |

从矩阵读出三条规律：

- **配置放哪，看它是不是构造参数**：`IntersectionObserver`（`root`/`rootMargin`/`threshold`）和 `ReportingObserver`（`types`/`buffered`）把配置放在**构造函数**里，一个观察器一套配置、且 IO 构造后不可改；`ResizeObserver`/`MutationObserver`/`PerformanceObserver` 把配置放在 **`observe` 调用**里，因此同一个观察器可以对不同目标用不同配置（多次 `observe`）。
- **`unobserve` 只有"逐目标"的两家有**：`IntersectionObserver`/`ResizeObserver` 观察的是一个个具体元素，能停单个；`MutationObserver` 的每次 `observe` 是"追加一份观察配置"、无法单独撤销某个，只能 `disconnect` 全停后重来；`PerformanceObserver`/`ReportingObserver` 根本不针对具体目标。
- **`takeRecords` 是"同步取走待派发队列"**：四家都有、唯独 `ResizeObserver` 没有。它的用途是在 `disconnect` 前把还没来得及回调的记录一次性捞出来处理（避免丢失），后面各页会具体演示。

### 3.1 一个观察器管多个目标

观察器天生适配"一批元素同一逻辑"——建**一个**实例，`observe` 多个目标，回调里用 `target` 区分：

```js
// 一个 IO 实例观察全部懒加载图片，回调里按 entry.target 处理各自
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      loadImage(entry.target); // entry.target 指明是哪张图进了视口
      io.unobserve(entry.target); // 加载过就停止观察这一张，省资源
    }
  }
});

// 把所有待懒加载的图片交给同一个观察器
document.querySelectorAll("img[data-src]").forEach((img) => io.observe(img));
```

不要"一个元素一个观察器"——那会退化成 N 个观察器，白白丢掉批处理红利。

## 四、回调时机总览：观察器最关键的差异

观察器都是**异步**回调，但"异步到什么时机"各不相同，这决定了你能不能在回调里安全地读/写布局。这是五类观察器**唯一真正需要死记**的差异：

| 观察器 | 回调时机 | 含义 |
| --- | --- | --- |
| `IntersectionObserver` | 交叉状态跨过阈值后，异步入队派发 | 不保证同步于滚动的每一帧；批量、去抖 |
| `ResizeObserver` | **布局计算后、绘制前**（同一帧内） | 能读到最新尺寸，且此时改样式仍会在本帧生效 |
| `MutationObserver` | **微任务**：当前任务的 DOM 改动全部完成后 | 一个任务里的多次 DOM 变化合成一批 |
| `PerformanceObserver` | 性能条目产生后异步派发 | 配 `buffered: true` 可补取观察前的历史条目 |
| `ReportingObserver` | 报告产生后异步派发 | 配 `buffered: true` 可补取观察前的报告 |

三个直接影响写法的推论：

- **`ResizeObserver` 的"布局后绘制前"是双刃剑**：好处是你读到的尺寸绝对最新、改的样式本帧就生效；坏处是——如果你在回调里改了被观察元素的尺寸，就会触发**再一次**布局与观察，循环下去超出单帧上限，浏览器报 `ResizeObserver loop completed with undelivered notifications`。规避见 [ResizeObserver 页](./guide-line/resize-observer)。
- **`MutationObserver` 的微任务批处理意味着"连续改 100 个节点只回调一次"**：别指望每 `appendChild` 一次就回调一次；也正因如此，回调里若再改 DOM 且落在观察范围内，会产生新的一批记录、形成循环，见 [MutationObserver 页](./guide-line/mutation-observer)。
- **`buffered: true` 是 Performance/Reporting 的"补历史"开关**：观察器创建得晚，页面早期的条目/报告怎么办？加 `buffered: true`（Performance 仅对 `type` 生效）让浏览器把观察前缓冲的条目也补给你——见 [PerformanceObserver 页](./guide-line/performance-reporting-observer)。

下一页起逐个拆解。先从最常用、场景最多的 [IntersectionObserver](./guide-line/intersection-observer) 开始。
