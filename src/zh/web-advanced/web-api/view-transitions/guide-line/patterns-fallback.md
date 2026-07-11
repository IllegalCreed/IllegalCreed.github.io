---
layout: doc
outline: [2, 3]
---

# 工程模式与降级：检测、无障碍与坑位

> 基于 W3C CSS View Transitions（Level 1/2）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **特性检测（SPA）**：`if (!document.startViewTransition) { 直接改DOM(); return; }`——渐进增强的标准起手式；`"startViewTransition" in document` 亦可。
- **特性检测（MPA）**：无需 JS——不支持的浏览器**直接忽略** `@view-transition`，天然降级为硬切。
- **封装一个 helper**：把「检测 + 降级 + 无障碍」收进一个 `withViewTransition(update)` 工具，业务只调它，避免每处重复样板。
- **尊重 `prefers-reduced-motion`**：前庭敏感用户设了「减少动态效果」时，应**弱化或跳过**动画——把动画包进 `@media (prefers-reduced-motion: no-preference)`，或检测到 reduce 就 `skipTransition()`。
- **`skipTransition()` 收敛**：连点 / 用户已切走时立即跳到结束态（DOM 仍更新，`finished` 仍 resolve），避免动画排队积压。
- **唯一名冲突**：同一时刻两个元素撞 `view-transition-name` → `ready` reject、**整过渡被跳过**；列表用 `match-element` 或把 id 拼进名字。
- **根元素全屏闪**：不命名任何元素时 `:root`（`root` 组）承担整页交叉淡入淡出，大改动时突兀——**把真正要动的元素单独命名、给 `root` 收敛动画**。
- **回调别塞异步**：`updateCallback` 是**渲染抑制窗口**，里面 `await fetch()`/定时器会卡页面——**数据先取好再进过渡**，回调只做同步 DOM 变更。
- **内容跳变（CLS）**：过渡前后布局若骤变，快照会「跳」——过渡前预留尺寸 / 骨架，或用形变让变化连续。
- **快照开销**：每个 `view-transition-name` 都要抓两张位图（旧+新）——**别给成百上千元素命名**；大列表只给「真正跨态移动」的少数关键元素命名。
- **`visibilityState: hidden` 跳过**：页面不可见（切后台 / 最小化）时过渡被跳过、只更新 DOM——不必特判，但要知道此时无动画。
- **`fixed`/`sticky` 与 `transform`**：快照期间元素被提到伪元素树，某些定位 / 裁剪上下文会变——复杂布局先小范围验证。
- **别依赖动画必然播放**：撞名、不可见、`skipTransition()`、不支持——多条路径都会「无动画但 DOM 更新成功」，逻辑不能挂在「动画一定发生」上。
- **清理临时命名**：JS 动态设的 `viewTransitionName` 在 `finished`/`ready` 后复位为 `"none"`，尤其跨文档防 bfcache 撞名。
- **测试要跨引擎**：Firefox 缺 types 与跨文档、旧 Safari/Chrome 缺同文档——CI 里覆盖「有过渡」与「降级」两条路径。

## 一、特性检测与降级封装

同文档场景，检测 `document.startViewTransition` 是否存在即可，标准起手式：

```js
// 不支持：直接更新，不进过渡流程
if (!document.startViewTransition) {
  updateDOM();
  return;
}
document.startViewTransition(updateDOM);
```

生产里别把这段散落各处，封一个统一处理「检测 + 无障碍 + 降级」的工具，业务只调它：

```js
/**
 * 统一的过渡入口：不支持 / 用户要求减少动效时优雅降级
 * @param {() => void | Promise<void>} update 纯 DOM 变更
 * @param {string[]} [types] 可选的 view transition types
 * @returns {ViewTransition | null}
 */
function withViewTransition(update, types = []) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 不支持，或用户要求减少动效：直接更新，不做动画
  if (!document.startViewTransition || reduce) {
    update();
    return null;
  }
  // 传选项对象以携带 types（不支持 types 的引擎会忽略该字段）
  return document.startViewTransition({ update, types });
}
```

跨文档（MPA）无需 JS 检测——不支持 `@view-transition` 的浏览器直接忽略它、退化为普通硬切，是「零成本降级」的典范。

## 二、无障碍：尊重 `prefers-reduced-motion`

View Transitions 是**纯视觉动效**，对前庭功能障碍用户可能引发不适。系统级的「减少动态效果」偏好必须尊重。两种落法：

```css
/* 法一（推荐）：默认不给动画，仅在用户「不介意动效」时才启用 */
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-group(*) {
    animation-duration: 0.3s;
  }
}
/* reduce 时上面的规则不生效 → 退化为「近乎瞬时」的默认，无明显位移 */
```

```js
// 法二：JS 里检测到 reduce 就干脆跳过动画（DOM 仍更新）
const transition = document.startViewTransition(update);
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  transition.skipTransition(); // 不 animate，但 DOM 照常更新、finished 照常 resolve
}
```

注意：「减少动效」不等于「零过渡」——通常做法是**保留极短的淡入淡出、去掉大幅位移与缩放**，兼顾连续性与舒适度。上面 `withViewTransition` 里直接降级为无动画是更保守的选择。

## 三、`skipTransition()`：连点与即时收敛

用户在动画播放中又触发了下一次导航，若不处理，动画会排队积压、观感拖沓。`skipTransition()` 把当前过渡**立刻**推到结束态：

```js
let current = null;
function navigate(url) {
  // 上一段还在播？先砍掉它，直达结束态
  if (current) current.skipTransition();
  current = withViewTransition(() => renderRoute(url));
  current?.finished.finally(() => (current = null));
}
```

记牢语义：**`skipTransition()` 只砍动画，不砍 DOM 更新**——回调照样跑、`finished` 照样 resolve。它和「特性不支持的降级」殊途同归（都得到「无动画 + DOM 已更新」），区别是前者进了过渡流程再主动放弃。

## 四、性能：快照是有成本的

每个 `view-transition-name` 都会让浏览器抓**两张位图**（旧态一张、新态一张）并纳入伪元素树。据此的性能纪律：

- **命名要克制**：只给「真正跨态移动 / 形变」的**少数关键元素**命名。给一个长列表的每一项都命名 = 抓成百上千张快照，帧率与内存双输。
- **大列表只命名「主角」**：例如列表进详情，只给被点的那一项 + 详情主图命名，其余项走整页 `root` 的淡入淡出即可。
- **形变优于逐元素动画**：让一个 `group` 做位置尺寸补间，比给几十个元素各写动画更省。
- **回调要快**：`updateCallback` 是渲染抑制窗口，回调越慢、页面「冻」得越久——重活（网络、大计算）挪到过渡外。
- **警惕 `visibilityState: hidden`**：页面不可见时过渡直接跳过，不必特判，但别把关键逻辑绑在「动画一定播放」上。

## 五、常见坑清单

- **唯一名冲突**：同一时刻两个渲染中的元素带相同 `view-transition-name` → `ready` reject、**整过渡被跳过**（DOM 仍更新但无动画）。列表用 `view-transition-name: match-element` 或把唯一 id 拼进名字；JS 临时命名后记得复位 `"none"`。
- **根元素默认全屏过渡**：不命名任何元素时，`:root`（`root` 组）承担整页交叉淡入淡出，大面积内容跳变时观感突兀。对策：把要动的元素**单独命名成组**、并给 `::view-transition-old(root)/new(root)` **收敛或关掉**默认动画。
- **回调里塞异步**：`updateCallback` 内 `await fetch()`/`setTimeout` 会拉长渲染抑制窗口、卡住页面。**数据先取好再 `startViewTransition`**，回调只做同步 DOM 变更。
- **内容跳变 / 布局抖动**：过渡前后布局尺寸骤变，快照会「跳」。过渡前**预留尺寸 / 骨架屏**，或用同名元素让尺寸变化走形变补间而非硬跳。
- **快照过多拖性能**：给太多元素命名 → 抓太多位图。见上一节，命名要克制。
- **动态命名忘复位**：JS 设的 `viewTransitionName` 不清 → 跨文档 bfcache 恢复时残留、下次撞名。`await finished`/`ready` 后设回 `"none"`。
- **跨文档忘了两侧都写 / 跨源**：`@view-transition` 必须**源页与目标页都声明**且**同源**，否则不触发。
- **误以为 `ready` 一定 resolve**：撞名、不可见都会让 `ready` reject——挂在 `ready.then` 里的自定义动画要配 `.catch` 兜底。
- **误以为 types 到处都有**：view transition types 与跨文档都**缺 Firefox**——依赖它们必须渐进增强，Firefox 落到无类型 / 硬切。
- **把它当动画库用**：想要时间线编排 / 手势跟随 / 物理弹簧 / 循环动画 → 那是 [JS 动画库](/zh/frontend-visualization/)的活；View Transitions 只补「前后两态之间」。
- **`fixed`/`sticky`/裁剪上下文异常**：快照期间元素被提到伪元素树，定位与 `overflow` 裁剪上下文可能变化——复杂布局先小范围验证再铺开。
- **只在 Chrome 测**：三引擎能力不齐（Firefox 缺 types/跨文档，旧版缺同文档核心）——CI 覆盖「过渡」与「降级」两条路径。

## 六、一个可复用的最小封装

把本页要点收进一处，业务侧只需一行调用：

```js
/**
 * withViewTransition：检测 + 无障碍 + types + 连点收敛 一站式
 * 业务只管传「纯 DOM 变更」，其余降级逻辑封装内处理
 */
let pending = null;
function withViewTransition(update, types = []) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    update();
    return null;
  }
  if (pending) pending.skipTransition(); // 连点：砍掉上一段
  pending = document.startViewTransition({ update, types });
  pending.finished.catch(() => {}).finally(() => (pending = null));
  return pending;
}

// 业务侧：
navButton.addEventListener("click", () =>
  withViewTransition(() => renderRoute("/detail"), ["forward"]),
);
```

到此，同文档 / 跨文档、命名 / 定制、检测 / 降级都已成体系。速查表、支持矩阵与易错点汇总见[参考](../reference)。
