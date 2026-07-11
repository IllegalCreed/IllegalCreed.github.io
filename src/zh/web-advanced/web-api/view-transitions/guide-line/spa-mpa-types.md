---
layout: doc
outline: [2, 3]
---

# SPA / MPA 与类型：作用范围与分场景

> 基于 W3C CSS View Transitions（Level 1/2）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **两种作用范围**：**同文档（SPA）**用 JS `document.startViewTransition()` 触发；**跨文档（MPA）**用 CSS `@view-transition { navigation: auto }` 在同源导航时**自动**触发，可零 JavaScript。
- **同文档 = Baseline**：Chrome 111 / Safari 18 / Firefox 144，安全区。
- **跨文档 ≠ 仅 Chromium**：Chrome 126+ **与 Safari 18.2+** 都支持 `@view-transition`；**Firefox 不支持** → 因此**未进 Baseline**（短板在 Firefox，不是「只有 Chrome」）。
- **`@view-transition` 要两侧都写**：源页和目标页**都**要 `@view-transition { navigation: auto }`，且**同源**；跨源导航一律跳过。
- **不支持即降级**：不支持 `@view-transition` 的浏览器**直接忽略**该规则 → 退化为普通硬切，不报错不白屏。
- **`pageswap` 事件**（`PageSwapEvent`）：旧页**离开前**触发，`e.viewTransition` 拿到过渡对象、`e.activation` 拿导航信息——给**离场**元素打 `view-transition-name`。
- **`pagereveal` 事件**（`PageRevealEvent`）：新页**首次渲染时**触发，`e.viewTransition` 拿过渡对象——给**入场**元素打 `view-transition-name`。
- **跨文档命名要「打标 + 复位」**：在 `pageswap`/`pagereveal` 里用 JS 临时设 `viewTransitionName`，`await e.viewTransition.finished`/`ready` 后复位为 `"none"`，防 bfcache 恢复时撞名。
- **view transition types**：给一次过渡贴「类型标签」，据此**分场景**用不同 CSS——`前进`用一种动画、`后退`用另一种。
- **types ≠ 仅 Chromium**：Chrome 125+ **与 Safari 18+** 支持；**Firefox 144 初版不含** → 未进 Baseline（短板同样在 Firefox）。
- **设置 types 的三条路**：SPA `document.startViewTransition({ update, types: ["forward"] })`；MPA `@view-transition { types: slide }`；运行时改 `transition.types`（`ViewTransitionTypeSet`，`add`/`delete`/`has`）。
- **`:active-view-transition`**（Baseline）：过渡进行中匹配根元素，做「过渡期间的临时样式」。
- **`:active-view-transition-type(x)`**（随 types，缺 Firefox）：仅当某类型激活时匹配，据此分场景写样式。
- **`startViewTransition` 的两种签名**：传回调 `startViewTransition(cb)`；或传选项对象 `startViewTransition({ update, types })`。
- **框架已内建**：Astro（`<ClientRouter />`）、SvelteKit（`onNavigate` + `startViewTransition`）、Vue Router / Nuxt、Next App Router、React Router 等都有一行开关或封装（本页点到，不展开某一框架）。
- **仍是渐进增强**：跨文档与 types 都缺 Firefox，生产必须「有则增强、无则硬切」；用 `transitionHelper` 之类封装统一降级路径。

## 一、同文档（SPA）：JS 触发

单页应用里，「导航」其实是 JS 改 DOM。把「改 DOM」这步包进 `startViewTransition` 即可：

```js
/** SPA 路由切换：把渲染新路由的 DOM 变更包进过渡 */
async function navigate(url) {
  const render = async () => {
    const html = await loadRouteHTML(url); // ⚠️ 数据准备放外面更好，见下
    document.querySelector("#app").innerHTML = html;
  };

  // 特性检测降级：不支持就直接渲染
  if (!document.startViewTransition) return render();
  document.startViewTransition(render);
}
```

更稳的写法是**先把数据取好、再进过渡**，让 `updateCallback` 只做纯 DOM 变更（回调是渲染抑制窗口，里面 `await fetch` 会卡页面）：

```js
async function navigate(url) {
  const data = await loadRoute(url); // 网络在过渡外完成
  const render = () => renderInto("#app", data); // 回调里只改 DOM，同步、快
  if (!document.startViewTransition) return render();
  document.startViewTransition(render);
}
```

## 二、跨文档（MPA）：CSS 自动触发

多页应用（每次导航是真正的文档切换）**几乎零 JS**：源页与目标页都声明 `@view-transition`，浏览器在**同源**导航时自动抓两侧文档的快照并过渡。

```css
/* 放进两侧页面的全局 CSS——都要写、且必须同源 */
@view-transition {
  navigation: auto; /* auto=同源导航自动过渡；none=关闭 */
}
```

就这么多，导航时整页默认交叉淡入淡出。要「同一元素跨页面形变」（如列表头像飞到详情页头像），给两侧对应元素同名即可：

```css
/* 列表页与详情页各自的头像用同名 → 跨文档也能形变补间 */
.avatar { view-transition-name: avatar; }
```

::: warning 支持现状（务必分清）
跨文档 `@view-transition` 在 **Chrome 126+ 与 Safari 18.2+** 可用，**Firefox 目前不支持**。因此它**不是 Baseline**——但降级无痛：不支持的浏览器**忽略** `@view-transition`，导航退化为普通硬切。这与旧资料常说的「仅 Chromium」不同，Safari 自 18.2 已跟上，真正的短板只剩 Firefox。
:::

## 三、`pageswap` / `pagereveal`：跨文档的 JS 定制点

跨文档转场里没有「一个 JS 回调」，取而代之的是**两侧各一个事件**，用来在过渡前后临时调整 `view-transition-name`：

- **`pageswap`**（`PageSwapEvent`）：**旧页即将卸载前**在旧页触发；`e.viewTransition` 是本次过渡对象，`e.activation` 带导航来源 / 目标信息——用来给**离场**元素打标。
- **`pagereveal`**（`PageRevealEvent`）：**新页首次渲染时**在新页触发；`e.viewTransition` 是过渡对象——用来给**入场**元素打标。

```js
// 旧页：离开前，根据「去哪」给对应元素打上跨页配对名
window.addEventListener("pageswap", async (e) => {
  if (!e.viewTransition) return; // 不支持 / 未触发过渡
  const target = new URL(e.activation.entry.url);

  if (isDetailPage(target)) {
    // 让列表里被点的那张头像，与详情页头像用同名 → 跨文档形变
    const el = document.querySelector("#list .avatar.active");
    el.style.viewTransitionName = "avatar";
    // 快照抓完即复位，防止 bfcache 恢复时该名残留、下次撞名
    await e.viewTransition.finished;
    el.style.viewTransitionName = "none";
  }
});

// 新页：首次渲染时，给详情页头像打同一个名
window.addEventListener("pagereveal", async (e) => {
  if (!e.viewTransition) return;
  const from = new URL(navigation.activation.from.url);

  if (isListPage(from)) {
    const el = document.querySelector("#detail .avatar");
    el.style.viewTransitionName = "avatar";
    await e.viewTransition.ready; // 快照抓完即复位
    el.style.viewTransitionName = "none";
  }
});
```

「打标 + 抓完即复位」是跨文档的固定套路：`view-transition-name` 只需在**抓快照的那一刻**存在，之后留着反而会在 bfcache（前进后退缓存）恢复页面时造成撞名。

## 四、view transition types：一次过渡，分场景样式

同一个转场，「前进」和「后退」往往想要相反的方向。**view transition types** 给一次过渡贴上类型标签，让 CSS 按类型分流。

设置 types 的三条路：

```js
// ① SPA：startViewTransition 传选项对象，用 types 字段
document.startViewTransition({
  update: () => renderRoute(url), // 等价于传回调
  types: isBack ? ["backward"] : ["forward"], // 本次过渡的类型
});
```

```css
/* ② MPA：at-rule 的 types 描述符（也可在 pagereveal 里用 e.viewTransition.types 动态设） */
@view-transition {
  navigation: auto;
  types: slide;
}
```

```js
// ③ 运行时增删：ViewTransition.types 是 set-like（add/delete/has/清空）
const t = document.startViewTransition(update);
t.types.add("forward");
t.types.delete("backward");
```

再用 **`:active-view-transition-type()`** 按类型写样式（**仅当该类型激活时**才生效）：

```css
/* 前进：新页从右滑入 */
:active-view-transition-type(forward) {
  &::view-transition-new(root) { animation-name: slide-from-right; }
}
/* 后退：新页从左滑入 —— 同一套 DOM，方向相反 */
:active-view-transition-type(backward) {
  &::view-transition-new(root) { animation-name: slide-from-left; }
}
```

另有 **`:active-view-transition`**（无参，Baseline）匹配「任意过渡进行中」的根元素，用于过渡期间的临时样式（如禁用某些悬停效果）。

::: warning 支持现状
view transition types（`types` 参数 / 描述符、`:active-view-transition-type()`、`ViewTransition.types`）在 **Chrome 125+ 与 Safari 18+** 可用，**Firefox 144 初版不含**。而无参的 `:active-view-transition` 已随同文档核心进入 Baseline。所以 types 相关的分场景样式**必须渐进增强**：Firefox 上会落到「无类型」的默认动画。
:::

## 五、框架集成（点到为止）

主流框架都已把 View Transitions 封成开关或钩子，业务里通常不用手写 `startViewTransition`：

| 框架 | 接入方式（概念） |
| --- | --- |
| **Astro** | `<ClientRouter />`（原 `<ViewTransitions />`）一行开启；`transition:name` 指令声明式命名 |
| **SvelteKit** | `onNavigate(() => { ... document.startViewTransition(...) })` 官方推荐片段 |
| **Vue Router / Nuxt** | Nuxt `experimental.viewTransition`；Vue Router 在 `afterEach` 里包 `startViewTransition` |
| **Next.js（App Router）** | 社区 `next-view-transitions` 封装，或跨文档场景直接 `@view-transition` |
| **React Router** | `<Link viewTransition>` / `useViewTransitionState` 内建支持 |

它们的共同点：**在路由切换处替你包 `startViewTransition`（SPA）或替你输出 `@view-transition`（MPA）**，并处理命名与降级。本站不展开任一框架的用法——需要时查该框架文档；本叶讲的是它们底下共用的这套浏览器机制。

下一页收口工程细节：特性检测的标准写法、`prefers-reduced-motion` 无障碍、`skipTransition` 的用法、性能与快照开销、以及一份常见坑清单——[工程模式与降级](./patterns-fallback)。
