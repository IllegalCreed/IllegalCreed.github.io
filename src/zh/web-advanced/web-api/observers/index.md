---
layout: doc
---

# Observer 观察器 API

Observer 观察器 API 是浏览器内建的一组**异步观察器**——`IntersectionObserver`（元素与视口/祖先的交叉可见性）、`ResizeObserver`（元素尺寸变化）、`MutationObserver`（DOM 树的结构/属性/文本变化）、`PerformanceObserver`（性能条目）、`ReportingObserver`（弃用与干预报告）。它们共享同一套设计哲学：把"我关心某种变化"**声明**给浏览器，浏览器在**渲染管线的恰当时机**批量、异步地回调你，从根本上取代了 `scroll`/`resize` 事件监听与 `setInterval` 轮询那套"在主线程上高频计算、反复读 `getBoundingClientRect` 触发强制同步布局"的旧范式。共同 API 形状是 `observe`/`disconnect`（外加因观察对象而异的 `unobserve`/`takeRecords`），回调统一为 `(records, observer) => {}`。本叶讲这五个观察器的**机制与通用用法**；IntersectionObserver 的懒加载/预加载"工程优化实践"口径归优化章「懒加载和预加载」，PerformanceObserver 的 Web Vitals 指标解读归优化章「性能评估」——本叶只讲 API 机制与"有哪些 entryType"，具体指标点到即止。

## 评价

**优点**

- **渲染管线集成、异步批处理**：观察器由浏览器在布局/绘制的恰当时机驱动回调，天然把同一帧内的多次变化合并成一批，避免了 `scroll`/`resize` 事件那种主线程高频触发与"读布局→改样式→再读布局"的抖动（layout thrashing）
- **声明式、省样板**：把"观察什么"交给浏览器，回调只处理"变了什么"；比手写 `getBoundingClientRect` 轮询 + 防抖节流简洁得多，且更省电——后台标签页里浏览器可暂停观察
- **一个观察器管多个目标**：单个 `IntersectionObserver`/`ResizeObserver`/`MutationObserver` 可 `observe` 任意多元素，回调里用 `entry.target`/`record.target` 区分，天然适配列表、网格、无限流
- **覆盖面广、各司其职**：可见性、尺寸、DOM 结构、性能条目、报告五个维度各有专用观察器，API 形状高度一致——学会一个，其余触类旁通
- **Baseline 成熟**：三大 DOM 观察器（Intersection/Resize/Mutation）在现代浏览器全绿，可放心用于生产（仅 IE 从未支持 IntersectionObserver）

**局限**

- **回调时机与批处理必须理解**：观察器不是"立即同步告诉你结果"——IO/Performance 走队列异步派发、Resize 在布局后绘制前、Mutation 走微任务；把它当同步 API 用会踩空
- **ResizeObserver 回调里改尺寸易触发 loop 告警**：在回调中修改被观察元素尺寸会引发再次观察，超单帧递归上限报 `ResizeObserver loop completed with undelivered notifications`，需 `requestAnimationFrame` 或跳过无变化项规避
- **MutationObserver 易自触发死循环**：在回调里改 DOM、而改动又落在观察范围内 → 再次入队，需要 `takeRecords`/`disconnect` 或缩小观察范围来隔离
- **配置能力有上下限**：IO 只能判**矩形**交叉、阈值是**比例**不是像素、且构造后配置不可改；像素级或非矩形需求要自己算
- **PerformanceObserver/ReportingObserver 有浏览器差异**：支持的 `entryType` 逐浏览器不同（须用 `supportedEntryTypes` 探测），ReportingObserver 长期偏 Chromium、跨浏览器达成 Baseline 较晚

一句话选型：**只要你在"轮询 DOM/尺寸/可见性"或"高频监听 `scroll`/`resize`"，几乎都该换成对应的 Observer**——可见性用 `IntersectionObserver`、尺寸用 `ResizeObserver`、DOM 变化用 `MutationObserver`、性能条目用 `PerformanceObserver`、弃用/干预报告用 `ReportingObserver`；它们更快、更省电、更少样板。唯一要付出的学习成本，就是搞懂各自的"回调时机"。

## 本叶地图

- [入门](./getting-started) —— 观察器模式为何取代 `scroll`/`resize` 事件与轮询（渲染管线集成、异步批处理）、五类 Observer 定位、共同 API 形状（`observe`/`unobserve`/`disconnect`/`takeRecords`）与差异矩阵、回调时机总览
- [IntersectionObserver](./guide-line/intersection-observer) —— 构造 options（`root`/`rootMargin`/`threshold`）、entry 七字段、懒加载图片、无限滚动 sentinel、曝光埋点、回调批处理与 `unobserve` 时机、IO v2 的 `trackVisibility`/`delay`
- [ResizeObserver](./guide-line/resize-observer) —— `observe` 与 `box` 三选项、entry 尺寸字段（`contentBoxSize`/`borderBoxSize`/…）、回调在布局后绘制前、**loop 告警**成因与规避、容器查询式响应式组件、与 `window.resize` 对比
- [MutationObserver](./guide-line/mutation-observer) —— `observe` 七选项、`MutationRecord` 结构、微任务批处理、`takeRecords` 清队、`disconnect`、与已废弃 Mutation Events 对比、观察自身修改导致循环的坑
- [PerformanceObserver 与 ReportingObserver](./guide-line/performance-reporting-observer) —— `entryTypes` 或 `type + buffered`、有哪些 `entryType`、**指标解读链接优化章**、ReportingObserver 观察弃用/干预报告、五类观察器横向对比表
- [参考](./reference) —— 五类对比表、各自 options 与 entry/record 字段速查、回调时机对照、易错点清单、资源链接

## 文档地址

[MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)（观察器家族入口页；其余成员见 [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)、[MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)、[PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)、[ReportingObserver](https://developer.mozilla.org/en-US/docs/Web/API/ReportingObserver)）

## GitHub 地址

[w3c/IntersectionObserver](https://github.com/w3c/IntersectionObserver)（IO 规范仓库；ResizeObserver 在 [w3c/csswg-drafts](https://github.com/w3c/csswg-drafts)、MutationObserver 在 [whatwg/dom](https://github.com/whatwg/dom)、PerformanceObserver 在 [w3c/performance-timeline](https://github.com/w3c/performance-timeline)、ReportingObserver 在 [w3c/reporting](https://github.com/w3c/reporting)）

## 幻灯片地址

<a href="/SlideStack/observers-slide/" target="_blank">Observer 观察器 API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=observer-观察器-api" target="_blank" rel="noopener noreferrer">Observer 观察器 API 测试题</a>
