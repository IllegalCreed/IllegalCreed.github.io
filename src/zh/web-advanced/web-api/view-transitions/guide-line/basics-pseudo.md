---
layout: doc
outline: [2, 3]
---

# 基础与伪元素树：生命周期与快照结构

> 基于 W3C CSS View Transitions（Level 1/2）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **入口**：`document.startViewTransition(updateCallback)` 启动**同文档、文档级**过渡，返回一个 `ViewTransition` 对象；`updateCallback` 可返回 `Promise`（异步渲染完成后再抓新快照）。
- **`updateCallback` 的职责**：只做「把 DOM 从旧状态改到新状态」；浏览器在**调用它之前**抓旧快照、**它（返回的 Promise）完成之后**抓新快照。
- **`ViewTransition.updateCallbackDone`**：`Promise<void>`，回调返回的 Promise 完成时 resolve——「DOM 已更新」的信号（回调 reject 则它 reject，过渡放弃）。
- **`ViewTransition.ready`**：`Promise<void>`，**伪元素树已建好、动画即将开始**时 resolve——**用 Web Animations API 接管伪元素动画的黄金时机**；若过渡被跳过（如同名冲突）则它 **reject**。
- **`ViewTransition.finished`**：`Promise<void>`，**动画结束、新视图可见可交互**后 resolve；即便动画被跳过、只要 DOM 更新成功它也会 resolve。
- **三个 Promise 时序**：`updateCallbackDone` →（伪元素树建立）→ `ready` →（动画播放）→ `finished`。
- **`ViewTransition.skipTransition()`**：**跳过动画但仍更新 DOM**——立刻推进到结束态，`finished` 照常 resolve；用于「用户已不耐烦 / 减弱动效」的即时收敛。
- **伪元素树五层**：`::view-transition`（根覆盖层）→ `::view-transition-group(name)`（每组）→ `::view-transition-image-pair(name)`（配对容器）→ `::view-transition-old(name)` / `::view-transition-new(name)`（旧 / 新快照）。
- **树挂在 `:root` 上**：整棵 `::view-transition*` 伪元素挂在文档根元素、**浮在页面内容之上**，覆盖全视口。
- **`::view-transition-old/new` 是「被替换内容」**：像 `<img>` 一样渲染，可用 `object-fit`、`object-position`、`animation`、`clip-path` 等常规 CSS 处理。
- **默认就有一组 `root`**：浏览器 UA 样式含 `:root { view-transition-name: root }`，所以**零配置也会有整页交叉淡入淡出**。
- **`old` 是静态图、`new` 是活的**：旧快照是更新前的**静态位图**；新快照是新 DOM 的**实时**表示（内容会继续更新）。
- **默认动画 = 交叉淡入淡出 + 形变**：`old` 从 `opacity:1→0`、`new` 从 `opacity:0→1`；`group` 对位置尺寸做形变补间（`transform` + `width`/`height`）。
- **快照期间渲染被抑制**：`updateCallback` 执行时页面不重绘，用户看不到「改到一半」的中间态。
- **`visibilityState: hidden` 直接跳过**：调用时若文档不可见（最小化 / 切后台 / 被遮），过渡被跳过、只更新 DOM。
- **不要在回调里 `await` 无关异步**：回调里 `await fetch()` 会拖长「渲染抑制」窗口、卡住页面——数据应**先取好再 `startViewTransition`**（见[工程模式页](./guide-line/patterns-fallback)）。

## 一、`startViewTransition` 与 `updateCallback`

同文档过渡的唯一入口是 `Document.startViewTransition()`。最常见形态是传一个回调：

```js
// updateCallback：把 DOM 从旧状态改到新状态。可同步，也可返回 Promise
const transition = document.startViewTransition(async () => {
  // 若渲染需要异步（如等待框架完成 patch），返回 Promise，
  // 浏览器会等它 resolve 后再抓「新状态」快照
  await renderRoute("/detail/42");
});
```

浏览器围绕这个回调编排整条流水线：

1. **抓旧快照**（回调**运行前**）：为当前带 `view-transition-name` 的元素各拍静态快照。
2. **运行回调**：执行 DOM 更新；**这期间渲染被抑制**——无论回调内部改了多少次，用户只会看到「改完」的结果，不会看到闪烁的中间态。
3. **等回调 Promise**：回调返回的 Promise resolve 后，`updateCallbackDone` resolve。
4. **抓新快照 + 建树 + 播放**：为新状态抓快照、构造伪元素树、`ready` resolve、动画开始。

> ⚠️ 回调是**渲染抑制窗口**：里面 `await fetch()`/`setTimeout` 会让整页「冻」在旧态直到异步完成，观感是卡顿。正确姿势是**数据准备放外面**，回调里只做纯粹的 DOM 变更。

## 二、`ViewTransition` 对象：三个 Promise + 一个方法

`startViewTransition` 立即返回的 `ViewTransition` 对象，是你观测与干预这次过渡的全部把手：

```js
const transition = document.startViewTransition(() => updateDOM());

// ① updateCallbackDone：回调（的 Promise）完成 → DOM 已更新
transition.updateCallbackDone.then(() => {
  console.log("DOM 更新完成，此时新快照尚未开始动画");
});

// ② ready：伪元素树建好、动画即将开始 → 接管自定义动画的时机
transition.ready.then(() => {
  // 用 WAAPI 给新快照加一段圆形揭示（默认交叉淡入淡出之外的花样）
  document.documentElement.animate(
    { clipPath: ["circle(0% at 50% 50%)", "circle(150% at 50% 50%)"] },
    { duration: 400, easing: "ease-in", pseudoElement: "::view-transition-new(root)" },
  );
}).catch(() => {
  // ready 会 reject 的典型原因：view-transition-name 同名冲突 → 过渡被跳过
});

// ③ finished：动画结束、新视图可交互 → 清理 / 埋点
transition.finished.then(() => {
  console.log("过渡彻底结束");
});
```

| 成员 | 类型 | resolve / 行为时机 | 典型用途 |
| --- | --- | --- | --- |
| `updateCallbackDone` | `Promise<void>` | 回调返回的 Promise 完成 | 感知「DOM 已更新」，与动画无关的后续逻辑 |
| `ready` | `Promise<void>` | 伪元素树建好、动画将开始（**失败会 reject**） | 用 WAAPI 接管伪元素做自定义动画 |
| `finished` | `Promise<void>` | 动画结束、新视图可见可交互 | 清理临时 `view-transition-name`、埋点 |
| `skipTransition()` | 方法 | 立即跳过动画、直达结束态（DOM 仍更新，`finished` 照常 resolve） | 连点 / 减弱动效时即时收敛 |

三个 Promise 的**时序**固定：`updateCallbackDone` → `ready` → `finished`。记住 `ready` 是**唯一会 reject** 的那个——同名冲突、`visibilityState` 为 hidden 等导致过渡被跳过时，从 `ready` 的 `catch` 里能感知（而 `finished` 只要 DOM 更新成功仍会 resolve）。

### 2.1 `skipTransition()`：跳动画不跳更新

`skipTransition()` 的语义是「**我不要这段动画了，但 DOM 该更新还是更新**」。它把过渡**立刻**推进到结束状态：正在播的动画被砍掉，伪元素树尽快销毁，`finished` 照常 resolve。

```js
const transition = document.startViewTransition(() => updateDOM());

// 用户在动画播放中又点了下一项：砍掉当前动画、直接到位，避免动画排队积压
nextButton.addEventListener("click", () => transition.skipTransition());
```

区别于「不支持时的降级」：降级是**根本没进过渡流程**；`skipTransition()` 是**进了、但主动放弃动画部分**。二者最终都得到「无动画、DOM 已更新」的结果。

## 三、`::view-transition` 伪元素树

过渡进行时，浏览器在 `:root` 上生成一棵**临时伪元素树**，浮在页面内容之上、覆盖全视口。所有对动画的 CSS 定制都作用在这棵树上：

```
::view-transition                          根覆盖层（overlay），全视口
└─ ::view-transition-group(name)           每个「命名快照」一组（含默认的 root 组）
   └─ ::view-transition-image-pair(name)   配对容器（隔离混合，装 old + new）
      ├─ ::view-transition-old(name)       旧状态的静态快照（更新前的位图）
      └─ ::view-transition-new(name)       新状态的实时快照（新 DOM 的活表示）
```

各层职责：

- **`::view-transition`**：根，所有组的容器，坐在页面之上。一般不直接动它。
- **`::view-transition-group(name)`**：**形变动画发生的层**——位置、尺寸的补间加在 group 上（默认 `transform` + `width`/`height` 一起动）。想统一调某组时长就选它。
- **`::view-transition-image-pair(name)`**：装 old 与 new 的容器，默认 `isolation: isolate` 以便 `mix-blend-mode` 生效；做自定义 clip 动画时常需把它改回 `isolation: auto`。
- **`::view-transition-old(name)` / `::view-transition-new(name)`**：真正的两张「图」。**old 是更新前的静态位图；new 是新 DOM 的实时表示**（内容会随新 DOM 继续变）。二者都以**被替换内容**（replaced content，类似 `<img>`）渲染，可用 `object-fit`、`object-position` 控制填充方式。

`name` 就是元素的 `view-transition-name`；默认整页那一组的名字是 `root`。用 `*` 通配可一次命中所有组：

```css
/* 统一把所有组的时长改成 0.5s（含默认的 root 组与所有命名组） */
::view-transition-group(*) {
  animation-duration: 0.5s;
}

/* 单独定制某一组：只调 root（整页那组） */
::view-transition-group(root) {
  animation-duration: 0.3s;
}
```

## 四、默认动画：为什么零配置也有转场

即使你**没给任何元素**写 `view-transition-name`，一次 `startViewTransition` 也会有可见的转场——因为浏览器 UA 样式表里有：

```css
/* 浏览器内置：根元素默认参与，名字叫 root */
:root {
  view-transition-name: root;
}
```

于是默认永远至少存在一组 `root`，其 old/new 各自淡出淡入 → 整页交叉淡入淡出。默认动画的两条规则：

- **淡入淡出**：`::view-transition-old(name)` 从 `opacity:1→0`，`::view-transition-new(name)` 从 `opacity:0→1`（UA 提供的 `-ua-view-transition-fade-*` 关键帧）。
- **形变补间**：当同名元素在新旧两态位置 / 尺寸不同时，`::view-transition-group(name)` 对 `transform` 与 `width`/`height` 做平滑补间——这是「元素飞过去 + 缩放」观感的来源。

这也解释了[概览页](../index)提到的「默认根转场易全屏闪」：大面积内容跳变时，那一整组 `root` 的交叉淡入淡出会显得突兀。对策是**把真正要动的元素单独命名成组、并给 `root` 收敛动画**——这是[命名与定制](./naming-customization)的主题。

## 五、时序小结与一个坑

把本页串起来，一次同文档过渡的完整时间线：

```
调用 startViewTransition(cb)
  │  抓「旧」快照（当前带 name 的元素，含默认 root）
  ├─ 运行 cb 更新 DOM（★渲染被抑制，用户看不到中间态）
  │  cb 返回的 Promise resolve → updateCallbackDone ✓
  │  抓「新」快照 → 构造 ::view-transition 伪元素树
  ├─ ready ✓（动画将开始；此处可用 WAAPI 接管；失败则 reject）
  │  播放动画（默认交叉淡入淡出 + 形变）
  └─ finished ✓（新视图可交互）→ 销毁伪元素树
```

一个必须避开的坑：**`updateCallback` 是渲染抑制窗口**。别在里面 `await` 网络请求或定时器——那会把整页「冻」在旧态直到异步结束。数据准备、路由数据拉取都应在 `startViewTransition` **之前**完成，回调里只留纯 DOM 变更。完整的工程坑位清单见[工程模式与降级](./patterns-fallback)。

下一页把 `view-transition-name` 讲透：唯一性约束、`view-transition-class` 批量样式化、`match-element` 自动命名、以及如何为 old/new 写自定义动画——[命名与定制](./naming-customization)。
