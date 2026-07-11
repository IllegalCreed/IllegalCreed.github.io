---
layout: doc
outline: [2, 3]
---

# ResizeObserver：元素尺寸观察

> 基于各 Observer 现行标准（W3C/WHATWG）与浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：`ResizeObserver` 异步观察**单个元素的尺寸变化**——不止窗口，任何因内容、布局、CSS 导致的元素变宽变高都能捕获，是"容器查询式响应式"的基石。
- **构造与配置分离**：`new ResizeObserver(callback)` 只传回调；观察配置（`box`）在**每次 `observe`** 里给，因此同一观察器可对不同元素用不同 box。
- **`observe(target, { box })`**：`box` 取 `content-box`（默认）/`border-box`/`device-pixel-content-box`——决定回调报告的是内容盒、边框盒还是设备像素级内容盒尺寸。
- **回调时机**：**布局计算后、绘制前**（同一帧内）——读到的尺寸绝对最新，此时改样式仍在本帧生效。
- **回调签名**：`(entries, observer) => {}`，`entries` 是一批 `ResizeObserverEntry`；一个观察器管多元素时靠 `entry.target` 区分。
- **首帧必回调一次**：`observe(el)` 后**立即回调一次**报告初始尺寸——初始化布局逻辑可直接放回调里，不必额外手动量一次。
- **读尺寸首选 `contentBoxSize`**：`entry.contentBoxSize[0].inlineSize`（宽）/ `.blockSize`（高）——注意是**数组**（为多列/分片场景预留），取 `[0]`。
- **`inlineSize`/`blockSize` 是逻辑尺寸**：随 `writing-mode` 变——横排时 `inlineSize`=宽、`blockSize`=高；竖排（如竖版中文/日文）会对调。国际化友好。
- **`entry` 字段**：`target`、`contentRect`（旧版 `DOMRectReadOnly`，`width`/`height` 物理尺寸，仅向后兼容）、`contentBoxSize[]`、`borderBoxSize[]`、`devicePixelContentBoxSize[]`。
- **`contentRect` 是遗留字段**：能用但推荐用 `contentBoxSize`（逻辑尺寸、支持分片）；老浏览器兜底才回落到 `contentRect.width/height`。
- **头号坑：loop 告警**：回调里**修改被观察元素尺寸** → 触发再次观察 → 超单帧递归上限 → 控制台报 `ResizeObserver loop completed with undelivered notifications`（旧版文案 `ResizeObserver loop limit exceeded`）。
- **loop 通常无害但要治**：它表示"这一帧没派发完、延到下一帧"，多数情况视觉正常；但会刷屏、可能触发全局 `error`。规避：把改尺寸放进 `requestAnimationFrame`，或**跳过与上次相同尺寸**的项。
- **`unobserve(target)` / `disconnect()`**：停单个 / 停全部；**没有 `takeRecords`**（五类观察器里唯一缺席）。
- **vs `window.resize`**：`resize` 只在**视口**变化时触发、且是全局事件；ResizeObserver 精确到**元素**，元素因任何原因变尺寸都触发（内容撑开、flex 重排、字体加载），时机也更可控。
- **典型场景**：容器查询式响应式组件（按容器宽切换布局，而非按视口）、Canvas/图表随容器重绘、`textarea` 自适应高、虚拟列表测量。
- **别在回调里做重活**：回调在绘制前的关键路径上，繁重计算会拖帧——重活挪进 `requestAnimationFrame` 或节流。
- **兼容**：Chrome 64+/Edge 79+/Firefox 69+/Safari 13.1+（Baseline widely available，2020-07 起）。

## 一、构造与 observe 的 box 选项

`ResizeObserver` 把回调放在构造函数、把配置放在 `observe`——所以一个观察器能对不同元素用不同的盒模型口径：

```js
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // 处理 entry……
  }
});

// box 决定回调报告哪个盒子的尺寸
observer.observe(el, { box: "content-box" }); // 默认：内容盒（不含 padding/border）
```

`box` 三个取值：

| `box` | 报告的尺寸 | 用途 |
| --- | --- | --- |
| `content-box`（默认） | 内容区（不含 padding、border） | 大多数布局判断 |
| `border-box` | 边框盒（含 padding + border） | 关心元素"占位总尺寸"时 |
| `device-pixel-content-box` | 内容区的**设备物理像素**尺寸 | Canvas 高清渲染、像素级精确绘制 |

`device-pixel-content-box` 对 Canvas 尤其关键——它把 CSS 像素乘以 `devicePixelRatio` 后的**真实物理像素**给你，避免高分屏下 Canvas 模糊。

## 二、ResizeObserverEntry：读尺寸的正确姿势

每个 `entry` 描述一个元素的当前尺寸：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `target` | `Element` | 尺寸变化的元素 |
| `contentBoxSize` | `ResizeObserverSize[]` | 内容盒尺寸，**数组**，每项含 `inlineSize`/`blockSize`（推荐） |
| `borderBoxSize` | `ResizeObserverSize[]` | 边框盒尺寸，数组同上 |
| `devicePixelContentBoxSize` | `ResizeObserverSize[]` | 设备像素内容盒尺寸，数组同上 |
| `contentRect` | `DOMRectReadOnly` | 旧字段，`width`/`height`/`top`/`left`（**物理**尺寸，仅向后兼容） |

三个必须记住的点：

- **`*BoxSize` 是数组**：设计成数组是为了将来支持**分片元素**（如多列布局里一个元素被拆成多段）。当前实践中取 `[0]` 即可。
- **`inlineSize`/`blockSize` 是逻辑尺寸**：跟随 `writing-mode`——横排文档里 `inlineSize` 是宽度、`blockSize` 是高度；竖排文档里两者对调。这让组件天然适配竖排语言。
- **`contentRect` 是遗留字段**：它用物理的 `width`/`height`，不随书写方向变，且不支持分片；**新代码优先 `contentBoxSize`**，只在极老浏览器兜底时回落。

```js
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      const size = entry.contentBoxSize[0]; // 取第一片
      const width = size.inlineSize; // 逻辑"宽"（横排下）
      const height = size.blockSize; // 逻辑"高"（横排下）
      applyLayout(entry.target, width);
    } else {
      // 极老浏览器兜底：回落到遗留的 contentRect
      applyLayout(entry.target, entry.contentRect.width);
    }
  }
});
```

## 三、回调时机：布局后、绘制前

`ResizeObserver` 的回调在浏览器**完成布局计算之后、把这一帧绘制到屏幕之前**触发。这个时机有两面：

- **好处**：回调里读到的尺寸是**这一帧最终的尺寸**；而且此时改样式，改动会并入**本帧**绘制，不会闪一下再变。
- **代价**：如果你在回调里改了被观察元素（或其祖先）的尺寸，就会让浏览器**在同一帧内重新算布局、重新触发观察**——循环若停不下来，就撞上下一节的 loop 告警。

## 四、头号坑：ResizeObserver loop 告警

在回调里修改被观察元素的尺寸，是最常见的翻车方式：

```js
// ❌ 反面教材：回调里改宽度 → 再次触发观察 → 循环
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // 改了被观察元素的宽度，下一轮又会观察到，无限循环
    entry.target.style.width = `${entry.contentBoxSize[0].inlineSize + 10}px`;
  }
});
observer.observe(el);
```

浏览器为防止真死循环设了**单帧递归上限**：一帧内观察-回调-再观察若超过上限还没稳定，就把剩余通知**推迟到下一帧**，并在控制台报：

```
ResizeObserver loop completed with undelivered notifications.
```

（旧版 Chrome 文案是 `ResizeObserver loop limit exceeded`。）

### 4.1 它到底有没有害

**多数情况无害**——它只是说"这一帧没算完、顺延到下一帧"，视觉上通常照常收敛。但两个理由让你不该放着不管：

- 它会**刷屏**控制台，淹没真正的错误；
- 它会冒泡到全局 `window.onerror` / 错误监控（如 Sentry），造成**误报噪声**。

### 4.2 两种规避

```js
// ✅ 规避一：把"改尺寸"推迟到下一帧，跳出当前观察循环
const observer = new ResizeObserver((entries) => {
  requestAnimationFrame(() => {
    for (const entry of entries) {
      entry.target.style.width = `${entry.contentBoxSize[0].inlineSize + 10}px`;
    }
  });
});
```

```js
// ✅ 规避二：记录"期望尺寸"，与本次相同就跳过——从根上断掉循环
const expected = new WeakMap();
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const current = entry.contentBoxSize[0].inlineSize;
    if (expected.get(entry.target) === current) continue; // 已是期望值，不再改
    const next = current + 10;
    entry.target.style.width = `${next}px`;
    expected.set(entry.target, next); // 记下期望值
  }
});
```

心法：**回调里尽量不要改被观察元素自身的尺寸**；非改不可就 `requestAnimationFrame` 延帧 + 幂等判断（尺寸没变就不动）。

## 五、典型场景：容器查询式响应式组件

`ResizeObserver` 让组件按**自己所在容器的宽度**（而非全局视口）切换布局——这正是 CSS 容器查询（`@container`）落地前的 JS 方案，至今仍用于容器查询覆盖不到的逻辑：

```js
// 卡片按容器宽度在"横向/纵向"两种布局间切换——放侧栏是纵向、放主区是横向
const layoutObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const width = entry.contentBoxSize[0].inlineSize;
    // 按容器宽而非视口宽决定布局，同一组件在不同容器里自适应
    entry.target.classList.toggle("card--horizontal", width >= 480);
    entry.target.classList.toggle("card--vertical", width < 480);
  }
});

document.querySelectorAll(".card").forEach((card) => layoutObserver.observe(card));
```

其他常见场景：Canvas/图表随容器尺寸重绘（配 `device-pixel-content-box` 防糊）、`textarea` 随内容自适应高度、虚拟列表测量可视区尺寸。

## 六、与 window.resize 事件的对比

| 维度 | `window.resize` 事件 | `ResizeObserver` |
| --- | --- | --- |
| 观察对象 | 只有**视口** | 任意**元素** |
| 触发条件 | 仅窗口尺寸变 | 元素因**任何原因**变尺寸（内容撑开、flex 重排、字体加载、JS 改样式） |
| 粒度 | 全局一个事件 | 每个元素独立、`entry.target` 区分 |
| 时机 | 事件循环里派发，需自己防抖 | 布局后绘制前，内建批处理 |
| 拿尺寸 | 自己 `getBoundingClientRect`（可能 thrashing） | `entry` 直接给，无需再量 |

结论：**只关心"浏览器窗口变了"用 `resize` 够了；只要关心"某个元素变了"就用 `ResizeObserver`**——尤其是元素尺寸受内容或布局驱动、而非窗口驱动时，`resize` 根本捕获不到。

## 七、清理与小结

- **停止观察**：`observer.unobserve(el)` 停单个；`observer.disconnect()` 停全部——组件卸载时务必 `disconnect`，否则观察器持有 DOM 引用泄漏。
- **无 `takeRecords`**：五类观察器里唯独 `ResizeObserver` 没有 `takeRecords`。
- **别在回调里做重活**：回调在绘制前关键路径，繁重计算拖帧；重活挪 `requestAnimationFrame` 或节流。

一句话：**元素尺寸变化就用 `ResizeObserver`**，读 `contentBoxSize[0].inlineSize`、警惕回调改尺寸引发的 loop 告警、卸载时 `disconnect`。下一页看观察 **DOM 结构变化**的 [MutationObserver](./mutation-observer)。
