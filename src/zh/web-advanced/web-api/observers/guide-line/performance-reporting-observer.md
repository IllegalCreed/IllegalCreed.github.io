---
layout: doc
outline: [2, 3]
---

# PerformanceObserver 与 ReportingObserver

> 基于各 Observer 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：这两个观察器观察的不是 DOM，而是浏览器产生的**信息流**——`PerformanceObserver` 观察**性能条目**（Performance Timeline），`ReportingObserver` 观察**报告**（弃用、干预等）。
- **PerformanceObserver 构造**：`new PerformanceObserver((list, observer) => {})`，回调收到的是 `PerformanceObserverEntryList`（不是数组）。
- **两种 observe 二选一**：`observe({ entryTypes: ["paint","resource"] })`（一次订阅多类）**或** `observe({ type: "largest-contentful-paint", buffered: true })`（单类，可补历史）。
- **`entryTypes` 与 `type` 互斥**：不能同时传；传了 `entryTypes` 就不能再带 `buffered`/`durationThreshold`。
- **`buffered: true` 只配 `type`**：让浏览器把**观察器创建前**已缓冲的同类条目也补给你——解决"观察器注册太晚、错过早期条目"。`entryTypes` 不支持 `buffered`。
- **`list` 三方法**：`getEntries()` / `getEntriesByType(type)` / `getEntriesByName(name)` 取条目。
- **`PerformanceEntry` 通用字段**：`name`、`entryType`、`startTime`、`duration`；各子类型再加专有字段。
- **有哪些 `entryType`**（概览）：`navigation`（导航时序）、`resource`（资源加载）、`paint`（FP/FCP）、`largest-contentful-paint`（LCP）、`layout-shift`（CLS 来源）、`first-input`/`event`（输入/事件时序，INP 来源）、`longtask`（长任务）、`mark`/`measure`（自定义打点）、`element`、`visibility-state` 等。
- **能力探测**：用静态属性 `PerformanceObserver.supportedEntryTypes` 判断当前浏览器支持哪些类型，再决定 observe 什么。
- **可多次 observe 追加**：同一 PerformanceObserver 可多次 `observe` 订阅不同类型；要对某类补历史就单独用 `type + buffered` 那一档。
- **`disconnect()` / `takeRecords()`**：停止 / 同步取走待派发条目；**无 `unobserve`**（不针对具体目标）。
- **边界·具体指标解读归优化章**：LCP/CLS/INP 等 **Web Vitals 指标含义、阈值、优化手段**在优化章「性能评估」（规划中）——**本页只讲 API 机制与"有哪些 entryType"**，指标解读点到即止。
- **ReportingObserver 构造**：`new ReportingObserver((reports, observer) => {}, { types, buffered })`——配置（观察哪些报告类型、是否补历史）在**构造函数**里。
- **ReportingObserver 的 observe 无参**：`observe()` 开始收集、`disconnect()` 停、`takeRecords()` 取走队列。
- **`Report` 结构**：`type`（`deprecation`/`intervention`/`crash`/`csp-violation` 等）、`url`（发生页面）、`body`（类型专有细节，如弃用 API 名、行号）。
- **ReportingObserver 观察什么**：**弃用报告**（用了将废弃的 API）、**干预报告**（浏览器出于性能/安全否决了某操作）、崩溃与各类策略违规报告——用于把这些"控制台警告"变成可上报的结构化数据。
- **兼容**：PerformanceObserver 全现代浏览器绿（2020-01 起 Baseline）；ReportingObserver 长期偏 Chromium，跨浏览器达成 Baseline 较晚（约 2026 前后）。

## 一、PerformanceObserver：观察性能条目

浏览器在加载与运行中会源源不断产生**性能条目**（PerformanceEntry），记录到 Performance Timeline 上。`PerformanceObserver` 让你**订阅感兴趣的条目类型**，条目产生时异步收到回调——比一次性 `performance.getEntries()` 轮询更实时、也不会错过：

```js
// 回调收到的是 PerformanceObserverEntryList，用 getEntries() 取条目
const observer = new PerformanceObserver((list, observer) => {
  for (const entry of list.getEntries()) {
    console.log(entry.entryType, entry.name, entry.startTime, entry.duration);
  }
});

// 方式一：一次订阅多类（不能带 buffered）
observer.observe({ entryTypes: ["paint", "resource"] });
```

### 1.1 entryTypes 与 type + buffered 的关键区别

`observe` 有两种**互斥**的调用形态，选错会静默收不到你要的历史数据：

| 形态 | 写法 | 能否补历史 | 适用 |
| --- | --- | --- | --- |
| `entryTypes`（数组） | `observe({ entryTypes: ["mark","measure"] })` | ❌ 不支持 `buffered` | 一次订阅多类、只要**将来**的条目 |
| `type`（单类） | `observe({ type: "largest-contentful-paint", buffered: true })` | ✅ `buffered: true` 补观察前缓冲的同类条目 | 单类、且要**追溯**页面早期已产生的条目 |

```js
// 方式二：单类 + buffered，补取观察器注册前就已产生的 LCP 条目
const lcpObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // 注意：这里只演示"拿到 LCP 条目"，指标怎么解读见优化章
    console.log("LCP 候选，startTime =", entry.startTime);
  }
});
lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
```

三条硬规则（易错点）：

- **`entryTypes` 和 `type` 不能同时给**——二选一。
- **`buffered` 只对 `type` 生效**：想补历史就必须用 `type` 单类形态；`entryTypes` 里加 `buffered` 无效。
- **`durationThreshold`（事件时序用）也只配 `type`**，不能与 `entryTypes` 同用。

因为很多性能条目（`paint`、`largest-contentful-paint`、`navigation`）在你的脚本执行前就产生了，**要拿这些早期条目，`buffered: true` + 单类 `type` 是唯一正确姿势**。要订阅多类又都要补历史，就为每一类各调一次 `observe({ type, buffered: true })`（同一观察器可多次 observe 追加）。

### 1.2 有哪些 entryType（概览）

`PerformanceObserver.supportedEntryTypes` 列出当前浏览器支持的类型。常见的一批：

| entryType | 大致内容 | 关联指标（解读见优化章） |
| --- | --- | --- |
| `navigation` | 本次页面导航的时序（DNS/TCP/请求/DOM 等） | TTFB 等 |
| `resource` | 每个资源（脚本/图片/CSS/fetch）的加载时序 | 资源瀑布分析 |
| `paint` | 首次绘制 FP、首次内容绘制 FCP | FCP |
| `largest-contentful-paint` | 最大内容绘制候选 | **LCP** |
| `layout-shift` | 布局偏移记录 | **CLS** 的来源数据 |
| `first-input` / `event` | 首次输入 / 事件时序 | **INP**/FID 的来源数据 |
| `longtask` | 阻塞主线程 ≥ 50ms 的长任务 | 主线程阻塞分析 |
| `mark` / `measure` | 你用 `performance.mark/measure` 打的自定义点 | 自定义耗时 |
| `element` / `visibility-state` | 元素时序 / 可见性状态变化 | — |

```js
// 能力探测：先看浏览器支持哪些，再订阅，避免 observe 抛错
if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.warn(`长任务：${entry.duration.toFixed(0)}ms`); // 只讲"拿到长任务条目"
    }
  }).observe({ type: "longtask", buffered: true });
}
```

> **边界（严守）**：上表的 LCP/CLS/INP 只标注"哪个 entryType 是它的来源"。**这些指标的定义、好坏阈值、如何优化，属于优化章「性能评估」（规划中）**——本页到"如何用 API 拿到条目"为止，指标解读点到即止。

### 1.3 自定义打点：mark 与 measure

`mark`/`measure` 是你自己产生的条目，配 PerformanceObserver 做业务耗时监控：

```js
performance.mark("checkout-start"); // 打起点
await doCheckout();
performance.mark("checkout-end"); // 打终点
performance.measure("checkout", "checkout-start", "checkout-end"); // 量区间

new PerformanceObserver((list) => {
  for (const entry of list.getEntriesByType("measure")) {
    console.log(`${entry.name} 耗时 ${entry.duration.toFixed(1)}ms`);
  }
}).observe({ type: "measure", buffered: true });
```

## 二、ReportingObserver：观察弃用与干预报告

浏览器平时把"你用了将废弃的 API""出于性能/安全我否决了这个操作"这类信息打到**控制台警告**里——散落、抓不住、上不了报。`ReportingObserver` 把它们变成**结构化、可订阅、可上报**的报告流：

```js
// 配置在构造函数：观察哪些报告类型、是否补历史
const observer = new ReportingObserver(
  (reports, observer) => {
    for (const report of reports) {
      // 把弃用/干预信息上报到监控后台，而不是任其淹没在控制台
      sendToMonitoring({
        type: report.type, // "deprecation" / "intervention" / ...
        url: report.url, // 发生的页面
        body: report.body, // 细节：如弃用的 API 名、源码行列号
      });
    }
  },
  {
    types: ["deprecation", "intervention"], // 只看弃用与干预
    buffered: true, // 补取观察器创建前已产生的报告
  },
);

observer.observe(); // ⭐ 无参：开始收集（配置已在构造函数给过）
```

### 2.1 Report 结构与常见类型

每个 `Report` 有三个字段：

| 字段 | 含义 |
| --- | --- |
| `type` | 报告类型字符串 |
| `url` | 触发报告的页面 URL |
| `body` | 类型专有的细节对象（弃用报告含 API 名、`sourceFile`、行列号等） |

`type` 的常见取值：

- **`deprecation`**：用了**将废弃**的 API（如同步 `XMLHttpRequest`）——提前发现、及早迁移。
- **`intervention`**：浏览器出于性能/安全/用户体验**否决**了某个操作（如自动播放被拦、某慢脚本被干预）。
- 其余：`crash`（页面崩溃）、`csp-violation`（CSP 违规）、`permissions-policy-violation`、`coep-violation` 等策略违规报告。

### 2.2 方法与用途

- `observe()`：无参，开始收集报告到队列。
- `disconnect()`：停止收集。
- `takeRecords()`：同步取走当前队列里的报告并清空——收尾或轮询时用。

ReportingObserver 的价值在于**把开发期才看得到的控制台警告，变成生产环境可采集的数据**：线上有多少真实用户命中了弃用 API、哪些浏览器触发了干预，一目了然，为技术债清理排优先级。

## 三、五类观察器横向对比

把本叶五个观察器放到一张表里收束——观察对象、回调时机、记录类型、典型场景一栏看清：

| 观察器 | 观察对象 | 回调时机 | 记录类型 | 典型场景 |
| --- | --- | --- | --- | --- |
| `IntersectionObserver` | 元素与 root 的交叉可见性 | 交叉跨阈值后异步入队 | `IntersectionObserverEntry` | 懒加载、无限滚动、曝光埋点 |
| `ResizeObserver` | 元素尺寸 | **布局后、绘制前** | `ResizeObserverEntry` | 容器查询式响应式、Canvas 重绘 |
| `MutationObserver` | DOM 结构/属性/文本 | **微任务**（当前任务改完后） | `MutationRecord` | 监听第三方改 DOM、等元素出现 |
| `PerformanceObserver` | 性能条目 | 条目产生后异步 | `PerformanceEntry`（多子类） | 性能监控、自定义耗时、长任务 |
| `ReportingObserver` | 报告（弃用/干预等） | 报告产生后异步 | `Report` | 弃用/干预上报、策略违规采集 |

三点收束：

- **前三个观察 DOM、后两个观察浏览器信息流**；但 API 形状一致，学一个会一串。
- **回调时机是最大差异**：`ResizeObserver` 在绘制前（能读最新尺寸、也最容易 loop），`MutationObserver` 在微任务（批处理"改完再回调"），其余走队列异步。
- **`buffered` 是 Performance/Reporting 的补历史开关**（Performance 仅对 `type` 生效）——观察器注册晚时靠它追溯早期条目/报告。

一句话：**性能条目用 `PerformanceObserver`（`type + buffered` 补历史、`entryType` 决定看什么，指标解读归优化章）、弃用与干预报告用 `ReportingObserver`（配置在构造函数、`observe()` 无参）**。本叶各观察器的字段与易错点汇总见 [参考](../reference)。
