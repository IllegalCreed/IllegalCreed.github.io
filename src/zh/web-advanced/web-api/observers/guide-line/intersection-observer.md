---
layout: doc
outline: [2, 3]
---

# IntersectionObserver：交叉可见性观察

> 基于各 Observer 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：`IntersectionObserver` 异步观察**目标元素与 root（视口或某个祖先）的交叉比例**变化——元素进出视口、可见了几成，都不用监听 `scroll`。
- **构造**：`new IntersectionObserver(callback, options)`；配置在**构造函数**里、构造后**不可改**（要换配置就新建观察器）。
- **`root`**：交叉判定的参照框，默认 `null` = **浏览器视口**；也可传一个**祖先元素**（必须是目标的祖先，用于内部滚动容器）。
- **`rootMargin`**：给 root 边界加"外扩/内缩"的 CSS 边距（如 `"200px 0px"`），**正值提前触发**（元素还没到视口就算交叉，用于预加载）；只接受 `px`/`%`。
- **`threshold`**：交叉比例阈值，`0`~`1`，**单值或数组**；每跨过一个阈值回调一次。`0` = 一露头就触发，`1` = 完全进入才触发，`[0, 0.25, 0.5, 0.75, 1]` = 多档采样。
- **回调签名**：`(entries, observer) => {}`，`entries` 是一批 `IntersectionObserverEntry`；务必遍历、别只取 `entries[0]`。
- **`entry.isIntersecting`**：布尔——本次是"进入相交"还是"离开相交"，懒加载/曝光的主判据。
- **`entry.intersectionRatio`**：当前交叉比例（`0`~`1`），配多阈值做"可见 75% 才算曝光"这类判断。
- **`entry` 其余字段**：`boundingClientRect`（目标矩形）、`intersectionRect`（相交区域矩形）、`rootBounds`（root 矩形）、`target`（哪个元素）、`time`（时间戳）。
- **首帧必回调一次**：`observe(el)` 后会**立即异步回调一次**报告初始交叉状态——不是"变化了才回调"，写懒加载时要靠 `isIntersecting` 分流。
- **观察即"一个管多个"**：一个观察器 `observe` 多个元素，回调里用 `entry.target` 区分；用完 `unobserve(target)` 停单个，或 `disconnect()` 全停。
- **懒加载三步**：`observe` 图片 → `isIntersecting` 时把 `data-src` 赋给 `src` → **`unobserve` 该图**（加载过就别再观察）。
- **无限滚动**：在列表底部放一个 **sentinel（哨兵）空元素**，观察它；它进视口就加载下一页——比监听 `scroll` 判断 `scrollTop` 干净得多。
- **曝光埋点**：用 `threshold: [0.5]` 之类判"可见过半"，`isIntersecting` 且比例达标即上报，上报后 `unobserve` 去重。
- **`unobserve` 时机**：一次性任务（懒加载、曝光去重）在命中后立刻 `unobserve`；持续观察（滚动进度、吸顶）才保持。
- **IO v2（`trackVisibility` + `delay`）**：默认的 `isIntersecting` 只算**几何**相交，看不出元素是否被遮挡/透明/`transform` 隐藏；开 `trackVisibility: true` + `delay >= 100` 后 `entry.isVisible` 才反映**真实可见**（较昂贵，防广告作弊等场景用）。
- **`rootMargin` 的坑**：root 为默认视口时 `rootMargin` 生效；跨源 iframe 中观察有额外限制。`%` 相对 root 尺寸计算。
- **边界·优化章**：懒加载/预加载的**工程取舍**（首屏排除、占位、优先级、与原生 `loading="lazy"` 对比）在优化章「懒加载和预加载」（规划中）——本页给**通用实现代码**，优化口径归优化章。

## 一、构造与三个 option

`IntersectionObserver` 的全部行为由构造时的 `options` 决定，且**构造后不可修改**——想换阈值或 root，只能新建一个观察器：

```js
const observer = new IntersectionObserver(callback, {
  root: null, // 参照框：null=视口（默认）；或传一个祖先元素
  rootMargin: "0px 0px 0px 0px", // 给 root 边界加外扩/内缩边距（上 右 下 左）
  threshold: 0, // 交叉比例阈值：单值或数组
});
```

### 1.1 root：拿什么当"视口"

- `root: null`（默认）：以**浏览器视口**为参照——最常见，"元素滚进屏幕了吗"。
- `root: someAncestor`：以某个**可滚动的祖先元素**为参照——目标必须是 root 的后代。用于"元素滚进这个内部滚动容器了吗"（如侧边栏列表、模态框内长列表）。

### 1.2 rootMargin：把触发线提前或推后

`rootMargin` 用 CSS 边距语法（`px` 或 `%`，**不支持其他单位**）在计算交叉前**扩大或缩小** root 的判定框：

```js
// 正值外扩：元素距视口还有 200px 就判为"相交"——预加载的关键
new IntersectionObserver(cb, { rootMargin: "200px 0px 200px 0px" });

// 负值内缩：元素要进入视口 100px 以内才算——避免"擦边就触发"
new IntersectionObserver(cb, { rootMargin: "-100px 0px" });
```

懒加载/预加载几乎都靠正的 `rootMargin` 把加载时机提前到"即将进入视口"，让用户滚到时图片已就位。

### 1.3 threshold：可见到几成才回调

`threshold` 是"目标可见比例"的阈值，取值 `0`~`1`：

- `0`（默认）：目标**任何一个像素**进入 root 就触发（离开时同理）。
- `1.0`：目标**完全**进入 root 才触发。
- **数组** `[0, 0.25, 0.5, 0.75, 1]`：**每跨过其中一个比例都回调一次**——做"可见度进度条""可见过半才算曝光"用。

```js
// 一个观察器同时采样多档可见度：每跨过一档就回调一次
const observer = new IntersectionObserver(handle, {
  threshold: [0, 0.25, 0.5, 0.75, 1], // 5 个采样点
});
```

> 记忆点：`threshold` 是**比例**不是像素——IO 天生做不了"相交超过 137px 就触发"这种像素级判断，那类需求得在回调里用 `intersectionRect` 自己算。

## 二、IntersectionObserverEntry：回调拿到什么

回调收到的每个 `entry` 描述**一次交叉状态变化**，字段如下：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `target` | `Element` | 发生变化的被观察元素——一个观察器管多目标时靠它区分 |
| `isIntersecting` | `boolean` | 本次是"**进入**相交"（`true`）还是"**离开**相交"（`false`） |
| `intersectionRatio` | `number` | 当前交叉比例 `0`~`1`（= `intersectionRect` 面积 / `boundingClientRect` 面积） |
| `boundingClientRect` | `DOMRectReadOnly` | **目标**元素的边界矩形 |
| `intersectionRect` | `DOMRectReadOnly` | 目标与 root 的**相交区域**矩形（被裁剪后剩下的可见部分） |
| `rootBounds` | `DOMRectReadOnly` | **root** 的边界矩形（含 `rootMargin` 调整后） |
| `time` | `DOMHighResTimeStamp` | 交叉发生的时间戳，用于精确排序 |

实践中 90% 的场景只用 `target` + `isIntersecting`（懒加载、无限滚动），加上 `intersectionRatio`（曝光/可见度）。其余矩形字段用于自己算精确位置的高级场景。

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    console.log(
      entry.target, // 哪个元素
      entry.isIntersecting, // 进/出
      entry.intersectionRatio.toFixed(2), // 可见比例
    );
  }
});
```

## 三、场景一：图片懒加载

最经典用法。把真实地址存 `data-src`，元素接近视口时才赋给 `src` 触发加载，加载后 `unobserve` 停止观察：

```html
<!-- 占位：src 先给一个极小的占位图，真实地址放 data-src -->
<img class="lazy" data-src="/photos/large-01.jpg" alt="风景" />
<img class="lazy" data-src="/photos/large-02.jpg" alt="风景" />
```

```js
const imgObserver = new IntersectionObserver(
  (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue; // 只处理"进入"事件
      const img = entry.target;
      img.src = img.dataset.src; // 真正开始加载
      img.removeAttribute("data-src");
      observer.unobserve(img); // ⭐ 加载过就停止观察这一张，避免重复触发
    }
  },
  {
    rootMargin: "200px 0px", // 提前 200px 开始加载，滚到时已就位
    threshold: 0, // 一露头（含 rootMargin 外扩区）就加载
  },
);

// 一个观察器接管全部懒加载图片
document.querySelectorAll("img.lazy").forEach((img) => imgObserver.observe(img));
```

三个要点：`rootMargin` 正值做预加载、命中后 `unobserve` 去重、`isIntersecting` 分流进入事件。

> 工程口径提示：首屏图片是否该排除懒加载、占位图策略、与浏览器原生 `loading="lazy"` 的取舍——这些**优化实践**归优化章「懒加载和预加载」（规划中）；本页只负责讲清 IO 的实现机制。

## 四、场景二：无限滚动（sentinel 哨兵）

不要监听 `scroll` 去比较 `scrollTop + clientHeight >= scrollHeight`——在列表**末尾放一个空的哨兵元素**，观察它进视口即加载下一页，天然干净：

```html
<ul id="feed">
  <!-- 列表项…… -->
</ul>
<!-- 哨兵：列表最后一个不可见的占位元素 -->
<div id="sentinel" aria-hidden="true"></div>
```

```js
let loading = false;
let page = 1;

const sentinel = document.querySelector("#sentinel");

const feedObserver = new IntersectionObserver(
  async (entries) => {
    // 哨兵进入视口且当前没有在加载 → 拉下一页
    if (!entries[0].isIntersecting || loading) return;
    loading = true;
    const items = await fetchPage(++page); // 拉数据
    renderItems(items); // 渲染到列表
    loading = false;

    if (items.length === 0) feedObserver.unobserve(sentinel); // 没有更多，停止观察
  },
  {
    rootMargin: "400px 0px", // 提前 400px 触发，让加载在用户滚到之前完成
  },
);

feedObserver.observe(sentinel);
```

`loading` 标志位防重复触发；`rootMargin` 提前量决定"无缝"体验；数据取尽后 `unobserve` 哨兵收工。

## 五、场景三：曝光埋点

广告/卡片"被用户真正看到"才计一次曝光——用 `threshold` 设可见度门槛，命中后 `unobserve` 去重（一次曝光只报一次）：

```js
const trackObserver = new IntersectionObserver(
  (entries, observer) => {
    for (const entry of entries) {
      // 可见比例达到 50% 才算"曝光"
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        reportImpression(entry.target.dataset.trackId); // 上报曝光
        observer.unobserve(entry.target); // ⭐ 一次曝光只报一次，报完停观察
      }
    }
  },
  {
    threshold: [0.5], // 只在跨过 50% 可见度时回调
  },
);

document
  .querySelectorAll("[data-track-id]")
  .forEach((el) => trackObserver.observe(el));
```

如果要求"连续可见 1 秒才算曝光"，可在 `isIntersecting` 时启定时器、`!isIntersecting` 时清定时器——IO 负责"进出通知"，停留时长由你自己计时。

## 六、回调批处理与 unobserve 时机

两条容易踩空的机制：

- **回调是批处理的**：一次回调的 `entries` 可能包含**多个**元素、甚至**同一元素跨过多个阈值**的多条记录——永远 `for...of entries` 遍历，别写 `entries[0]` 当唯一结果（无限滚动那种"只有一个哨兵"的场景才可以取 `entries[0]`）。
- **`unobserve` vs `disconnect`**：
  - 一次性任务（懒加载、曝光去重）：命中后**立刻 `unobserve(entry.target)`**，只停这一个，其余继续观察。
  - 整体收工（组件卸载、路由离开）：`observer.disconnect()` 一次性停掉全部并释放引用——**组件销毁时务必调用**，否则观察器持有 DOM 引用造成泄漏。
  - `takeRecords()`：同步取走**尚未派发**的交叉记录（清空内部队列），用于 `disconnect` 前捞取最后一批、避免丢失。

```js
// Vue/React 组件卸载时的标准收尾
onUnmounted(() => observer.disconnect()); // 停止一切观察，断开 DOM 引用
```

## 七、IntersectionObserver v2：trackVisibility 与 delay

默认的 `isIntersecting`/`intersectionRatio` 只算**几何交叉**——元素在视口里，但它可能被别的元素**遮挡**、被 `opacity: 0` **透明化**、被 `transform` **移出可见范围**、被 `filter` 处理，几何上仍"相交"。这给广告可见性作弊留了空子。

IO v2 引入 `trackVisibility` + `delay` + `entry.isVisible` 来判断**真实可见性**：

```js
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      // isVisible 为 true 才代表"未被遮挡、未透明、未被 transform 隐藏"的真实可见
      if (entry.isVisible) {
        reportGenuineImpression(entry.target);
      }
    }
  },
  {
    threshold: [1.0],
    trackVisibility: true, // 开启真实可见性计算（较昂贵）
    delay: 100, // 两次通知的最小间隔（毫秒），开 trackVisibility 时最小 100
  },
);
```

要点：

- `trackVisibility` **计算开销较大**，规范要求配合 `delay >= 100` 使用以限制频率——**只在真需要防遮挡/防作弊时开**，普通懒加载不必。
- `entry.isVisible` 的判断偏保守：浏览器无法百分百确定时会返回 `false`，别拿它做核心业务逻辑的唯一开关。

## 八、浏览器兼容与小结

`IntersectionObserver` 自 2019 年起在 Chrome/Edge/Firefox/Safari/Opera/Samsung Internet 全面可用（Baseline widely available），**仅 IE 从未支持**（需 polyfill）。IO v2 的 `trackVisibility`/`isVisible` 目前主要在 Chromium 系落地，用前以 `supportedEntryTypes` 之外的特性探测方式确认（如检查 `entry` 上是否存在 `isVisible`）。

一页话总结：**凡是"元素进没进某个框"的判断，都用 IntersectionObserver 而不是监听 `scroll`**。懒加载、无限滚动、曝光埋点是三大主场景，实现套路一致——`observe` 元素、`isIntersecting` 分流、命中后 `unobserve` 去重、组件卸载 `disconnect`。工程优化口径（首屏策略、预加载优先级）见优化章「懒加载和预加载」（规划中）。下一页看观察**尺寸**的 [ResizeObserver](./resize-observer)。
