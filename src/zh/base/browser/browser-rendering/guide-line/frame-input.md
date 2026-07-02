---
layout: doc
outline: [2, 3]
---

# 帧生命周期与输入

> 基于 Chromium 现代架构 · 核于 2026-07

## 速查

- **帧预算 = 1000ms ÷ 显示器刷新率**：60Hz≈**16.7ms**、90Hz≈11.1ms、120Hz≈**8.3ms**——别写死 60fps
- 一帧主线程流水：**输入回调 → rAF 回调 → style → layout → paint → commit**，然后合成器接手
- **rAF（requestAnimationFrame）**：每帧渲染步骤**之前**执行一次，是做视觉更新的标准位置
- **rIC（requestIdleCallback）**：帧内活干完的**空闲期**执行，只放可推迟的低优工作
- **合成器线程不等 JS、不等样式计算**——纯合成器滚动/动画在主线程卡死时照常出帧
- 输入路由：**浏览器进程**先收手势（只知坐标）→ 渲染进程**合成器线程** → 必要时才进**主线程**
- 主线程用 **hit test** 找事件目标——基于 **paint records** 数据按坐标查找
- **非快速滚动区（non-fast scrollable region）**：绑了相关监听的区域，输入必须等主线程；**把监听委托到 `document`/`body` 会把整页标进去**
- **`passive: true`**：承诺不 `preventDefault()`，合成器**不等主线程直接滚**；CSS `touch-action` 可整个绕开监听
- **事件合并（coalescing）**：连续事件（`mousemove`/`touchmove`/`pointermove`/`wheel`）合并到**下一次 rAF 前**才分发；离散事件（`keydown`/`mousedown`…）立即分发；`getCoalescedEvents()` 找回中间点

## 一、一帧之内发生什么

显示器按固定节奏刷新，浏览器出帧的目标就是**跟上刷新率**：60Hz 屏一帧 ≈16.7ms，120Hz 屏只有 ≈8.3ms。错过一拍，这一帧顺延，用户看到的就是卡顿（jank）。MDN 的表述：为保证滚动动画流畅，「占据主线程的一切——样式计算、reflow、paint——必须在 16.67ms 内完成」（以 60Hz 为例）。

主线程在一帧里的标准编排：

```
vsync 信号
   │
   ▼
输入事件回调（合并后的 mousemove/touchmove 等在此分发）
   ▼
requestAnimationFrame 回调        ← 视觉更新写在这里
   ▼
style（重算样式）→ layout（重排）→ paint（生成绘制指令）
   ▼
commit 给合成器线程 ──▶ 栅格化 → 组装 compositor frame → 送屏
   ▼
（若有富余）requestIdleCallback 的空闲回调
```

注意两点：

- 这条流水**不是每帧全跑**：没有失效就跳过对应阶段（没改几何就没有 layout）；反之一旦超预算，后面的 vsync 只能干等。
- 渲染任务与 JS 任务共享主线程。宏任务/微任务如何插队、`setTimeout` 为何不适合做动画，归[事件循环](/zh/base/language/javascript/js-async/guide-line/event-loop)讲；本页只管**帧内时序**。

## 二、主线程 vs 合成器线程：流畅的分工

回顾[上一页](./paint-compositing)的结论并升格为本页的主轴：

| | 主线程 | 合成器线程 |
| --- | --- | --- |
| 干什么 | JS、样式、layout、paint、hit test、事件分发 | 拼帧、滚动、合成器动画、图层管理 |
| 被 JS 阻塞？ | 会 | **不会**——「不需要等待样式计算或 JavaScript 执行」 |
| 滚动 | 仅当需要跑监听器时介入 | **默认在这里处理**：瓦片已栅格化，滚动只是换个偏移重新拼帧 |

这就是「页面 JS 卡成狗、滚动依然顺滑」的原理：滚动走的是合成器线程的独立通道。**但这条快速通道是有条件的**——输入事件可能把它拖回主线程，见第四节。

## 三、rAF 与 rIC：把工作放进正确的槽位

### 3.1 requestAnimationFrame：渲染前的黄金位置

Chrome 官方对主线程动画的建议就是它：「用 `requestAnimationFrame()` 把 JavaScript 操作切成小块，安排在每一帧运行」。rAF 回调的时机是**本帧渲染步骤（style/layout/paint）之前**，且与刷新率对齐：

```js
// 用 rAF 驱动动画：每帧执行一次，自动匹配 60Hz/120Hz
function tick(timestamp) {
  // timestamp 是本帧的时间基准；用它算进度，别自己攒帧数
  box.style.transform = `translateX(${Math.min(progress(timestamp), 100)}%)`;
  if (!done) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

- **为什么不用 `setTimeout(fn, 16)`**：定时器不与 vsync 对齐、受任务队列排队影响，注定漂移掉帧；且在 120Hz 屏上 16ms 本身就是错的节拍。
- **rAF 里读几何最危险**：此刻改样式 → 立刻读 `offsetWidth` 就是标准的强制同步布局（见[布局与重排](./layout-reflow)），读写分离原则在这里最要紧。
- 高频连续输入（`mousemove` 等）已被引擎**对齐到 rAF 前**分发（见第五节），监听回调里直接改样式即可，无需再包一层节流。

### 3.2 requestIdleCallback：帧的边角料

一帧的活提前干完，到下一个 vsync 之间的空隙就是**空闲期**。`requestIdleCallback` 把低优先级工作填进去：

```js
requestIdleCallback(
  (deadline) => {
    // deadline.timeRemaining()：本次空闲还剩多少毫秒
    while (deadline.timeRemaining() > 0 && tasks.length) {
      processNext(tasks); // 上报埋点、预热缓存等可推迟工作
    }
  },
  { timeout: 2000 }, // 兜底：迟迟没空闲也要在 2s 内执行
);
```

纪律：rIC 里**不要改 DOM**（改了会在下一帧引发布局，等于把「空闲工作」变成「下一帧的账单」）——要改就转投一个 rAF。

## 四、输入事件路由：从屏幕到你的回调

Chrome part4 视角下，「输入」指**用户的一切手势**：滚轮、触摸、鼠标移动都算。路由链条：

```
用户手势
   ▼
浏览器进程（先收到；只知道手势发生在哪个坐标）
   │  事件类型 + 坐标
   ▼
渲染进程 · 合成器线程 ──── 事件不涉及主线程监听？──▶ 直接拼新帧（快速通道）
   │ 落在非快速滚动区 / 需要跑监听
   ▼
渲染进程 · 主线程：hit test 找目标 → 分发事件、执行监听器
```

- **浏览器进程只是邮差**：页面内容归渲染进程管，浏览器进程只把事件类型（如 `touchstart`）和坐标转交给渲染进程。
- **hit test（命中测试）**：主线程拿到坐标后第一件事就是命中测试——**基于 paint records 数据**查这个坐标下面是哪个元素，再走捕获/冒泡分发（DOM 事件模型的用法归 [js-dom-events](/zh/base/language/javascript/js-dom-events/)）。

## 五、非快速滚动区：一行监听毁掉丝滑滚动

合成器线程能独立出帧的前提是**不需要问主线程**。页面绑定了相关事件监听时，合成器会把「附加了事件处理器的区域」标记为**非快速滚动区（non-fast scrollable region）**：

- 输入发生在**区外** → 合成器不等主线程，直接合成新帧滚动。
- 输入发生在**区内** → 事件必须先发给主线程（万一监听器 `preventDefault()` 取消滚动呢？）——**滚动开始前先等一趟主线程往返**，主线程忙就是肉眼可见的滚动迟滞。

最大的坑是**事件委托**：

```js
// ❌ 委托到 document.body：合成器无法预知哪些区域有监听，
//    只能把整页标成非快速滚动区——所有滚动都得先问主线程
document.body.addEventListener("touchstart", (event) => {
  if (event.target === area) event.preventDefault();
});
```

两个官方解法：

```js
// ✅ passive: true —— 向浏览器承诺「不会 preventDefault」
//    合成器不等主线程结果，立刻继续合成新帧（监听器照常异步执行）
document.body.addEventListener(
  "touchstart",
  (event) => {
    if (event.target === area) {
      // passive 监听里 preventDefault 无效；需要时先查 event.cancelable
      if (event.cancelable) event.preventDefault();
    }
  },
  { passive: true },
);
```

```css
/* ✅ CSS touch-action：声明式禁掉某方向的默认手势，压根不需要 JS 监听 */
.drawing-area {
  touch-action: pan-y; /* 只允许纵向滚动，横向手势留给自己处理 */
}
```

> 定调：`passive: true` 不是「让回调跑得快」，而是**解除「滚动等待监听结果」的依赖**——救的是合成器的快速通道。

## 六、事件合并：为什么 mousemove 不会淹死主线程

输入设备的上报频率远高于屏幕刷新：**触摸屏每秒 60–120 次、鼠标约 100 次**，而屏幕典型 60Hz。逐条分发既浪费（多数中间态根本画不出来）又容易压垮主线程。Chrome 的策略（part4）：

- **连续事件**（`wheel`、`mousewheel`、`mousemove`、`pointermove`、`touchmove`）——**合并（coalesce）**，延迟到**下一次 `requestAnimationFrame` 之前**才分发。一帧至多一发，天然与渲染同频。
- **离散事件**（`keydown`、`keyup`、`mouseup`、`mousedown`、`touchstart`、`touchend`）——**立即分发**，不合并（点击/按键丢一个都是事故）。

绘图板这类需要完整轨迹的应用怎么办？被合并掉的中间坐标可以用 `getCoalescedEvents()` 找回：

```js
window.addEventListener("pointermove", (event) => {
  // 一次回调拿回本帧内被合并的全部中间点，笔迹不断线
  for (const e of event.getCoalescedEvents()) {
    drawPoint(e.pageX, e.pageY);
  }
});
```

对写代码的影响：给 `pointermove` 手写 `throttle(16)` 做「渲染节流」多半是多余的——引擎已按帧合并；节流的正当场景是想进一步**降频**（如拖拽联动昂贵计算，降到每 100ms 一次）。

## 小结

- 帧预算跟着**刷新率**走（60Hz≈16.7ms / 120Hz≈8.3ms）；一帧内主线程按「输入 → rAF → style/layout/paint → commit」编排，合成器线程接力出帧。
- 滚动流畅的本质：**合成器线程不等 JS**；纯合成路径上主线程卡死也不掉帧。
- 视觉更新写进 **rAF**（渲染前、对齐刷新率），可推迟杂务进 **rIC**（空闲期、别碰 DOM）。
- 输入从浏览器进程 → 合成器 → （必要时）主线程 hit test 分发；hit test 基于 paint records。
- **非快速滚动区**是快滚的天敌：监听委托到 document 会标掉整页；`passive: true` 解除等待、`touch-action` 直接免监听。
- 连续事件按帧**合并**、离散事件立即发；要中间点用 `getCoalescedEvents()`。
- 经典模型到此讲完；引擎的现代真身——[现代架构 RenderingNG](./renderingng)。
