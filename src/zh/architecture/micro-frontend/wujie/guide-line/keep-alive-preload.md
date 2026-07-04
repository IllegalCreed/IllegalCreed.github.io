---
layout: doc
outline: [2, 3]
---

# 保活与预加载

> 基于 wujie v2（2026-06 复活） · 核于 2026-07

## 速查

- **预加载通论**（子应用秒开的通用手段）见[核心机制·性能与预加载](../../mfe-mechanisms/guide-line/perf-preload)——本页只讲 **wujie 的三模式 + `preloadApp`**
- wujie 有**三种运行模式**：**保活（keep-alive）/ 单例（singleton）/ 重建（rebuild，默认）**，靠 `alive` 配置 + 是否写生命周期区分
- **保活模式（`alive: true`）**：子应用只渲染一次，切走时 **WebComponent 与 iframe 都留在内存不销毁**，切回时把缓存的 WebComponent 重新挂回 DOM——**状态（数据 + 路由）全不丢、切换秒切**
- **单例模式（`alive: false` + 写生命周期）**：切走时 <code v-pre>__WUJIE_UNMOUNT</code> 销毁实例、切回时 <code v-pre>__WUJIE_MOUNT</code> 重建；改 `url` 会**触发真实路由跳转**；多菜单同 `name` 可共享实例
- **重建模式（默认）**：既不配 `alive` 也不写生命周期，**每次切换销毁 WebComponent（DOM）+ iframe（JS）**，下次进来全量重建
- **`preloadApp` 预加载**：空闲期用 `requestIdleCallback` 把子应用**静态资源（HTML/JS/CSS）拉进内存缓存**，大幅缩短首屏时间
- **`preloadApp({ exec: true })` 预执行**：不止拉资源，还**提前把子应用渲染出来**，进一步逼近「秒开」
- **`fiber: true`（默认）**：像 React Fiber 那样**把 JS 执行切成小片**，避免预执行/首次渲染长时间阻塞主线程；主应用初始化时就加载的子应用建议 `fiber: false`
- **秒开三件套**：预加载（省下载）+ 预执行（省渲染）+ 保活（省重建）——代价是**内存**（每个保活/预执行的子应用常驻一个 iframe + WebComponent）
- **缓存管理**：wujie 按 host 缓存 HTML/JS/CSS，资源更新后用 `clearAssetsCache()` 清缓存强制重取
- **`degrade` 降级**：老浏览器回退到「iframe 直接渲染」，弹窗无法覆盖全屏（详见 [iframe 沙箱·降级](./iframe-sandbox)）

## 一、三种运行模式总览

wujie 的「切换子应用时怎么处理它」有三档，取决于两个开关：**`alive` 是否为 `true`**、**子应用是否写了 <code v-pre>__WUJIE_MOUNT</code>/<code v-pre>__WUJIE_UNMOUNT</code> 生命周期**：

| 模式 | 配置 | 切走时 | 切回时 | 状态 | 子应用改造 |
| --- | --- | --- | --- | --- | --- |
| **保活 keep-alive** | `alive: true` | WebComponent + iframe **都留内存** | 缓存 WC **重新挂回** | **全保留** | 零改造 |
| **单例 singleton** | `alive: false` + 写生命周期 | <code v-pre>__WUJIE_UNMOUNT</code> 销毁实例 | <code v-pre>__WUJIE_MOUNT</code> 重建实例 | 不保留 | 需写生命周期 |
| **重建 rebuild**（默认） | 都不配 | 销毁 **WC + iframe** | 全量重建 | 不保留 | 零改造 |

一句话选择：**要状态不丢、切换最快** → 保活；**要每次进来是全新实例、但复用 iframe/沙箱** → 单例；**最省内存、每次全新** → 重建（默认）。

## 二、保活模式：切换秒切、状态不丢

保活是 wujie 的招牌能力。`alive: true` 后，子应用**渲染一次就常驻**：切到别的页面时，wujie **不销毁**它的 WebComponent 和 iframe，只是把 WebComponent 从 DOM 上摘下来留在内存；切回来时把缓存的 WebComponent 直接挂回去。

```js
// 保活模式：子应用状态（表单、滚动位置、路由）切走切回都不丢
startApp({
  name: "app-form",
  url: "//localhost:7100/",
  el: "#sub-container",
  alive: true, // 保活：渲染一次，切换不销毁
});
```

保活的语义要点：

- **状态全留**：内部数据、组件状态、**子应用路由状态**都不随切换丢失——用户填了一半的表单、滚动到一半的长列表，切走再回来原样还在。
- **切换秒切**：切回不是重新加载渲染，而是把内存里现成的 WebComponent 挂回 DOM，几乎无感。
- **改 `url` 不跳路由**：保活模式下改 `startApp` 的 `url` 参数**不会**触发子应用路由跳转——要控制子应用跳转得走[通信](./communication)。
- **后台仍活着**：即使不在前台，保活的子应用**仍在响应 `bus` 事件**（它的 JS 一直在 iframe 里跑），这既是能力也是内存/CPU 成本。

## 三、单例与重建

**单例模式**——`alive: false` 且子应用实现了生命周期钩子。切走时 wujie 调 <code v-pre>window.__WUJIE_UNMOUNT</code> 销毁当前实例，切回时调 <code v-pre>window.__WUJIE_MOUNT</code> 渲染一个全新实例：

```js
// 子应用：单例模式需要实现的生命周期
window.__WUJIE_MOUNT = () => render(); // 进入：建实例并挂载
window.__WUJIE_UNMOUNT = () => instance.unmount(); // 离开：销毁实例
```

单例模式下**改 `url` 会触发真实的路由跳转**（不像保活），且**多个菜单项用同一个 `name`** 指向子应用不同页面时，会**共享同一个子应用实例**（同一 iframe 沙箱），只是导航到不同路由——适合「同一个子应用、多个入口」的场景。

**重建模式（默认）**——什么都不配。每次切换都把 WebComponent（DOM）和 iframe（JS）**双双销毁**，下次进入全量重建。最省内存、隔离最干净，但每次进入都有加载渲染开销（非 webpack 老项目切换时可能有白屏，官方建议这类项目用保活）。需要手动全量重建刷新时，用 `refreshApp()`（v2.1.0 新增）。

## 四、preloadApp：预加载与预执行

保活解决的是「切回快」，**预加载/预执行**解决的是「第一次进也快」。`preloadApp` 在用户还没进入子应用前就提前准备：

```js
// 主应用启动后：空闲期预加载子应用
import { preloadApp } from "wujie";

preloadApp({
  name: "app-vue",
  url: "//localhost:7100/",
  exec: true, // 预执行：不止下载资源，还提前把子应用渲染出来
  // 不配 exec 则只「预加载」：空闲期把 HTML/JS/CSS 拉进缓存
});
```

两个层次：

- **预加载（不配 `exec`）**：wujie 在浏览器**空闲期**用 `requestIdleCallback` 把子应用的**静态资源（HTML/JS/CSS）下载进内存缓存**。等用户真进入时，资源已就绪，省掉了下载时间——「极大提升子应用打开的首屏时间」。
- **预执行（`exec: true`）**：更进一步，**提前把子应用渲染出来**（执行 JS、建 DOM）。用户进入时几乎是「现成的」直接展示，最逼近秒开。

## 五、fiber：别让预执行卡住主线程

预执行要跑子应用的 JS、建 DOM，这可能**长时间占用主线程**导致主应用卡顿。wujie 借鉴 **React Fiber** 的思路，用 `fiber` 把子应用 JS 的执行**切成一个个小片**，插空执行，避免一次性阻塞：

```js
startApp({
  name: "app-vue",
  url: "//localhost:7100/",
  el: "#sub-container",
  fiber: true, // 默认 true：分片执行 JS，不阻塞主线程
});
```

- **`fiber: true`（默认）**：分片执行，适合预执行、后台预加载等「不希望卡住主应用」的场景。
- **`fiber: false`**：一次性执行。官方建议——**在主应用初始化时就要加载的子应用**设 `false`（此时主应用本就在忙初始化，分片反而拖慢子应用就绪）。

## 六、秒开的代价：内存账

「预加载 + 预执行 + 保活」这套秒开秒切组合拳，本质是**用内存换时间**——要心里有本账：

| 手段 | 换来 | 代价 |
| --- | --- | --- |
| 预加载 | 省下载时间 | 内存里多份资源缓存 |
| 预执行（`exec`） | 省首次渲染时间 | 提前常驻一个 iframe + WebComponent |
| 保活（`alive`） | 切换秒切、状态不丢 | 子应用**永久常驻**内存、后台仍跑 JS |

因为 wujie 的[隔离靠 iframe](./iframe-sandbox)，**每个被预执行/保活的子应用都常驻一个 iframe（+ WebComponent + 其 JS 运行时）**。同屏保活的子应用越多，内存占用越高——不能无脑全开保活。实践建议：**高频往返、状态重的子应用**开保活/预执行；**低频、一次性**的走默认重建。缓存也可主动清理：

```js
// 子应用资源更新后：清掉按 host 缓存的 HTML/JS/CSS，强制下次重取
import { clearAssetsCache } from "wujie";
clearAssetsCache(); // 也可传 host 精确清某个子应用
```

预加载能秒开、iframe 沙箱能物理隔离的**通用权衡**（内存 vs 速度 vs 隔离）见[核心机制·性能与预加载](../../mfe-mechanisms/guide-line/perf-preload)，本页只讲 wujie 的落地开关。

## 小结

wujie 用三种模式覆盖不同「切换成本」需求：**保活**（`alive: true`，WC+iframe 常驻、状态不丢、切换秒切）、**单例**（写生命周期、切换销毁重建实例、改 `url` 会跳路由）、**重建**（默认、每次销毁 WC+iframe 全量重建、最省内存）。首次进入的速度靠 **`preloadApp`**——空闲期 `requestIdleCallback` 预加载资源、`exec: true` 进一步预执行渲染，配合 **`fiber`** 分片避免阻塞主线程。这套「预加载 + 预执行 + 保活」的秒开秒切是 wujie 的体验杀手锏，但代价是每个常驻子应用一个 iframe 的**内存开销**——按子应用冷热取舍，别全开。子应用在 iframe 里独立跑着，主子应用之间怎么传数据、发事件？下一页 [通信](./communication)。
