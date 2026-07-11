---
layout: doc
outline: [2, 3]
---

# 参考：五类观察器速查 / 对比 / 易错点

> 基于各 Observer 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **五个成员**：`IntersectionObserver`（可见性）· `ResizeObserver`（尺寸）· `MutationObserver`（DOM 变化）· `PerformanceObserver`（性能条目）· `ReportingObserver`（报告）。
- **共同形状**：`new XObserver(callback[, options])` → `observe(...)` → `disconnect()`；回调统一 `(records, observer) => {}`，`records` 是一批变化，务必遍历。
- **配置在构造还是 observe**：`IntersectionObserver`/`ReportingObserver` 在**构造函数**（IO 构造后不可改）；`ResizeObserver`/`MutationObserver`/`PerformanceObserver` 在 **`observe`**。
- **`unobserve` 只有两家**：`IntersectionObserver`/`ResizeObserver`；其余只能 `disconnect` 全停。
- **`takeRecords` 四家有、Resize 独缺**：IO/Mutation/Performance/Reporting 可同步取走待派发记录清空队列。
- **首帧回调**：`IntersectionObserver`/`ResizeObserver` **observe 后立即回调一次**；`MutationObserver` **不回放已有内容**。
- **回调时机**：IO 交叉跨阈值异步 / Resize **布局后绘制前** / Mutation **微任务** / Performance 条目产生后 / Reporting 报告产生后。
- **IO options**：`root`（默认视口）/ `rootMargin`（扩缩根边界、`px`\|`%`、正值提前触发）/ `threshold`（比例 `0`~`1`、单值或数组）。
- **IO entry**：`isIntersecting`/`intersectionRatio`/`boundingClientRect`/`intersectionRect`/`rootBounds`/`target`/`time`（v2 加 `isVisible`）。
- **Resize `box`**：`content-box`（默认）/`border-box`/`device-pixel-content-box`；读 `entry.contentBoxSize[0].inlineSize`（逻辑尺寸、随 `writing-mode`）。
- **Resize loop 告警**：回调改被观察元素尺寸 → `ResizeObserver loop completed with undelivered notifications`；`requestAnimationFrame` 或跳过同值项规避。
- **Mutation options**：至少一个 `childList`/`attributes`/`characterData`，否则 `TypeError`；`subtree` 扩后代；`attributeFilter`/`*OldValue`。
- **Mutation record**：`type`/`target`/`addedNodes`/`removedNodes`/`previousSibling`/`nextSibling`/`attributeName`/`oldValue`。
- **Performance observe**：`{ entryTypes: [...] }` 或 `{ type, buffered }`——**互斥**，`buffered` 只配 `type`；`supportedEntryTypes` 探测。
- **entryType 概览**：`navigation`/`resource`/`paint`/`largest-contentful-paint`/`layout-shift`/`first-input`/`event`/`longtask`/`mark`/`measure`——**指标解读归优化章「性能评估」（规划中）**。
- **Reporting**：构造 `{ types, buffered }`，`observe()` 无参；`Report` = `type`（`deprecation`/`intervention`/…）+`url`+`body`。
- **边界·优化章**：IO 懒加载/预加载**工程优化**→优化章「懒加载和预加载」（规划中）；Performance 的 Web Vitals **指标解读**→优化章「性能评估」（规划中）。本叶只讲 API 机制。
- **收尾铁律**：组件卸载 `observer.disconnect()`，否则观察器持 DOM 引用泄漏；一次性任务命中后 `unobserve`（IO/Resize）去重。

## 一、五类观察器总览

| 观察器 | 观察对象 | 规范 | Baseline |
| --- | --- | --- | --- |
| `IntersectionObserver` | 元素与 root 的交叉可见性 | [w3c/IntersectionObserver](https://github.com/w3c/IntersectionObserver) | 全现代浏览器（2019 起，IE 除外） |
| `ResizeObserver` | 元素尺寸 | w3c/csswg-drafts（Resize Observer） | Chrome 64/Edge 79/FF 69/Safari 13.1（2020-07 起） |
| `MutationObserver` | DOM 结构/属性/文本 | [whatwg/dom](https://github.com/whatwg/dom) | 全现代浏览器（2015-07 起） |
| `PerformanceObserver` | 性能条目 | w3c/performance-timeline | 全现代浏览器（2020-01 起） |
| `ReportingObserver` | 报告（弃用/干预等） | [w3c/reporting](https://github.com/w3c/reporting) | 长期偏 Chromium，跨浏览器较晚（约 2026） |

## 二、API 形状矩阵

| 观察器 | 构造签名 | `observe` | `unobserve` | `disconnect` | `takeRecords` |
| --- | --- | --- | --- | --- | --- |
| `IntersectionObserver` | `(cb, options)` | `observe(target)` | ✅ | ✅ | ✅ |
| `ResizeObserver` | `(cb)` | `observe(target, { box })` | ✅ | ✅ | ❌ |
| `MutationObserver` | `(cb)` | `observe(target, options)` | ❌ | ✅ | ✅ |
| `PerformanceObserver` | `(cb)` | `observe({ entryTypes })` \| `observe({ type, buffered })` | ❌ | ✅ | ✅ |
| `ReportingObserver` | `(cb, options)` | `observe()`（无参） | ❌ | ✅ | ✅ |

- **配置在构造 = IO / Reporting**（IO 构造后不可改）；**配置在 observe = Resize / Mutation / Performance**。
- **`unobserve` = 逐目标的 IO / Resize**；其余无。
- **`takeRecords` 除 Resize 外都有**。

## 三、回调时机对照

| 观察器 | 时机 | 首帧是否回调 | 批处理粒度 |
| --- | --- | --- | --- |
| `IntersectionObserver` | 交叉状态跨阈值后异步入队 | **是**（报初始状态） | 一批多目标/多阈值 |
| `ResizeObserver` | **布局计算后、绘制前**（同帧） | **是**（报初始尺寸） | 一批多目标 |
| `MutationObserver` | **微任务**：当前任务 DOM 改完后 | **否**（不回放已有） | 一个任务的多次变化合一批 |
| `PerformanceObserver` | 条目产生后异步派发 | `buffered` 可补历史 | 一批多条目 |
| `ReportingObserver` | 报告产生后异步派发 | `buffered` 可补历史 | 一批多报告 |

## 四、IntersectionObserver 速查

### 4.1 options（构造时，不可改）

| option | 默认 | 说明 |
| --- | --- | --- |
| `root` | `null`（视口） | 交叉参照框；传祖先元素则以其为"视口" |
| `rootMargin` | `"0px 0px 0px 0px"` | 扩/缩 root 边界；仅 `px`/`%`；正值**提前触发**（预加载） |
| `threshold` | `0` | 交叉比例阈值；单值或数组；每跨过一个回调一次 |
| `trackVisibility`（v2） | `false` | 是否计算**真实可见**（防遮挡/透明/transform）；较昂贵 |
| `delay`（v2） | — | 两次通知最小间隔；开 `trackVisibility` 时最小 `100` |

### 4.2 IntersectionObserverEntry

| 字段 | 含义 |
| --- | --- |
| `target` | 被观察元素 |
| `isIntersecting` | 进入（`true`）/离开（`false`）相交 |
| `intersectionRatio` | 交叉比例 `0`~`1` |
| `boundingClientRect` | 目标矩形 |
| `intersectionRect` | 相交区域矩形 |
| `rootBounds` | root 矩形（含 `rootMargin`） |
| `time` | 时间戳 |
| `isVisible`（v2） | 真实可见（需 `trackVisibility`） |

## 五、ResizeObserver 速查

### 5.1 observe 的 box

| `box` | 报告尺寸 | 用途 |
| --- | --- | --- |
| `content-box`（默认） | 内容区（不含 padding/border） | 常规布局 |
| `border-box` | 含 padding+border | 关心占位总尺寸 |
| `device-pixel-content-box` | 设备物理像素内容区 | Canvas 高清渲染 |

### 5.2 ResizeObserverEntry

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `target` | `Element` | 尺寸变化元素 |
| `contentBoxSize` | `ResizeObserverSize[]` | 内容盒；`[0].inlineSize`/`.blockSize`（推荐） |
| `borderBoxSize` | `ResizeObserverSize[]` | 边框盒 |
| `devicePixelContentBoxSize` | `ResizeObserverSize[]` | 设备像素内容盒 |
| `contentRect` | `DOMRectReadOnly` | 遗留字段，`width`/`height`（物理尺寸） |

`inlineSize`/`blockSize` 是**逻辑尺寸**，随 `writing-mode`：横排 `inlineSize`=宽、`blockSize`=高；竖排对调。

## 六、MutationObserver 速查

### 6.1 observe 的 options

| option | 作用 | 约束 |
| --- | --- | --- |
| `childList` | 直接子节点增删 | 配 `subtree` 含后代 |
| `attributes` | 属性变化 | 有 `attributeFilter`/`attributeOldValue` 时隐式为 `true` |
| `attributeOldValue` | 记录属性旧值 | 需 `attributes` 真，否则 `TypeError` |
| `attributeFilter` | 只观察指定属性名（数组） | 需 `attributes` 真 |
| `characterData` | 文本内容变化 | 有 `characterDataOldValue` 时隐式为 `true` |
| `characterDataOldValue` | 记录文本旧值 | 需 `characterData` 真，否则 `TypeError` |
| `subtree` | 观察扩到所有后代 | 与上任意组合 |

**必填**：`childList`/`attributes`/`characterData` 至少一个 `true`，否则 `TypeError`。

### 6.2 MutationRecord

| 字段 | 适用 | 含义 |
| --- | --- | --- |
| `type` | 全部 | `childList`/`attributes`/`characterData` |
| `target` | 全部 | 变化节点 |
| `addedNodes`/`removedNodes` | childList | 增/删的节点 `NodeList` |
| `previousSibling`/`nextSibling` | childList | 增删位置的兄弟节点 |
| `attributeName`/`attributeNamespace` | attributes | 属性名/命名空间 |
| `oldValue` | attributes/characterData | 旧值（需开 `*OldValue`，否则 `null`） |

## 七、PerformanceObserver 与 ReportingObserver 速查

### 7.1 PerformanceObserver.observe

| 形态 | 写法 | 补历史 |
| --- | --- | --- |
| `entryTypes`（多类） | `observe({ entryTypes: ["paint","resource"] })` | ❌ 不支持 `buffered` |
| `type`（单类） | `observe({ type: "largest-contentful-paint", buffered: true })` | ✅ `buffered` |

- `entryTypes` 与 `type` **互斥**；`buffered`/`durationThreshold` **只配 `type`**。
- `PerformanceObserver.supportedEntryTypes` 探测支持类型。
- 回调收 `PerformanceObserverEntryList`：`getEntries()`/`getEntriesByType(t)`/`getEntriesByName(n)`。

**entryType 概览**：`navigation`/`resource`/`paint`/`largest-contentful-paint`/`layout-shift`/`first-input`/`event`/`longtask`/`mark`/`measure`/`element`/`visibility-state`。**具体指标（LCP/CLS/INP）解读 → 优化章「性能评估」（规划中），本叶只讲 API。**

### 7.2 ReportingObserver

| 项 | 说明 |
| --- | --- |
| 构造 | `new ReportingObserver(cb, { types, buffered })` |
| `observe()` | 无参，开始收集 |
| `Report` | `type`（`deprecation`/`intervention`/`crash`/`csp-violation`…）+`url`+`body` |
| 用途 | 把控制台里的弃用/干预警告变成可上报的结构化数据 |

## 八、易错点清单

- **把观察器当同步 API**：`observe` 后立刻读结果——观察器都是**异步**回调，结果在回调里拿。
- **只取 `entries[0]`**：回调是**批处理**的，`entries` 可能多目标/多阈值——永远遍历（单哨兵无限滚动除外）。
- **IO 忘了首帧会回调一次**：`observe` 后立即触发一次报初始状态，懒加载要靠 `isIntersecting` 分流，别无脑执行。
- **IO 一次性任务不 `unobserve`**：懒加载/曝光命中后不停观察 → 重复触发——命中即 `unobserve(target)`。
- **IO `threshold` 当像素用**：它是**比例** `0`~`1`，做不了"相交超 N 像素"——那类要用 `intersectionRect` 自己算。
- **IO 构造后想改配置**：配置不可变——换阈值/root 只能新建观察器。
- **Resize 回调里改被观察元素尺寸**：触发 loop 告警 `undelivered notifications`——`requestAnimationFrame` 延帧 + 跳过同值项。
- **Resize 用 `contentRect` 而非 `contentBoxSize`**：`contentRect` 是遗留物理尺寸——新代码用 `contentBoxSize[0].inlineSize`，老浏览器才回落。
- **Resize 忘了 `contentBoxSize` 是数组**：直接读 `.inlineSize` 得 `undefined`——取 `[0]`。
- **Resize 找 `takeRecords`**：它**没有**——五类里唯一缺席。
- **Mutation `observe` 什么都不传**：至少给 `childList`/`attributes`/`characterData` 之一，否则 `TypeError`。
- **Mutation 矛盾配置**：`attributes:false` 配 `attributeOldValue:true`、`characterData:false` 配 `characterDataOldValue:true` → `TypeError`。
- **Mutation 期望回放已有内容**：只报此后变化——现有元素要自己先扫一遍。
- **Mutation 回调里改观察范围内的 DOM**：自触发循环——`takeRecords`+临时 `disconnect`/`observe`，或缩小范围/幂等判断。
- **还在用 Mutation Events**：`DOMNodeInserted` 等已废弃、同步且慢——迁移到 `MutationObserver`。
- **Performance 用 `entryTypes` 还想 `buffered`**：`buffered` 只对 `type` 生效——补历史用单类 `type + buffered`。
- **Performance 同时给 `entryTypes` 和 `type`**：互斥、报错——二选一。
- **Performance 不探测就 observe 冷门类型**：不支持会抛——先查 `supportedEntryTypes`。
- **在本叶展开 Web Vitals 指标解读**：越界——LCP/CLS/INP 的含义与优化归优化章「性能评估」（规划中）。
- **Reporting 的 `observe` 传参**：它**无参**——配置在构造函数的 `{ types, buffered }`。
- **组件卸载不 `disconnect`**：观察器持 DOM 引用泄漏——`onUnmounted`/`useEffect` 清理里 `disconnect()`。

## 九、权威链接

- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) ｜ [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) ｜ [IntersectionObserverEntry](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry)
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) ｜ [ResizeObserverEntry](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry)
- [MDN: MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) ｜ [MutationObserver.observe()](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe) ｜ [MutationRecord](https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord)
- [MDN: PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) ｜ [PerformanceObserver.observe()](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/observe) ｜ [PerformanceEntry](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry)
- [MDN: ReportingObserver](https://developer.mozilla.org/en-US/docs/Web/API/ReportingObserver) ｜ [Report](https://developer.mozilla.org/en-US/docs/Web/API/Report)
- 规范仓库：[w3c/IntersectionObserver](https://github.com/w3c/IntersectionObserver) ｜ [whatwg/dom](https://github.com/whatwg/dom)（MutationObserver）｜ [w3c/csswg-drafts](https://github.com/w3c/csswg-drafts)（ResizeObserver）｜ [w3c/performance-timeline](https://github.com/w3c/performance-timeline) ｜ [w3c/reporting](https://github.com/w3c/reporting)
- 本站相邻内容：[Web Workers API](/zh/web-advanced/web-api/web-workers/) ｜ [IndexedDB](/zh/web-advanced/web-api/indexeddb/) ｜ 优化口径见优化章「懒加载和预加载」「性能评估」（规划中）
