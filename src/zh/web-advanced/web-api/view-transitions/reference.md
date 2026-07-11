---
layout: doc
outline: [2, 3]
---

# 参考：API 速查 / 支持矩阵 / 易错点

> 基于 W3C CSS View Transitions（Level 1/2）现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **入口**：同文档 `document.startViewTransition(cb | { update, types })` → 返回 `ViewTransition`；跨文档 `@view-transition { navigation: auto }`（两侧同源页面都写）。
- **`ViewTransition` 三 Promise**：`updateCallbackDone`（DOM 已更新）→ `ready`（伪元素树就绪、动画将开始，**会 reject**）→ `finished`（动画结束、可交互）。
- **`ViewTransition.skipTransition()`**：跳动画不跳 DOM 更新；`ViewTransition.types`（`ViewTransitionTypeSet`，`add`/`delete`/`has`）运行时管类型。
- **伪元素树**：`::view-transition` →（每组）`::view-transition-group(name)` → `::view-transition-image-pair(name)` → `::view-transition-old(name)` / `::view-transition-new(name)`。
- **形变在 `group`、外观在 `old`/`new`**：位置尺寸补间加在 `group`；淡入淡出 / 自定义 `animation` 加在 `old`/`new`。
- **CSS 属性**：`view-transition-name`（**唯一**、配对钥匙、`none`/`match-element`）；`view-transition-class`（**不唯一**、样式钩子、选择器用 `.类名`）。
- **默认动画**：`root` 组整页交叉淡入淡出（UA 内置 `:root { view-transition-name: root }`）+ 同名元素形变补间。
- **选择器**：`:active-view-transition`（过渡中，Baseline）；`:active-view-transition-type(x)`（某类型激活时，随 types，缺 Firefox）。
- **事件（跨文档）**：`pageswap`（`PageSwapEvent`，旧页离场前）/ `pagereveal`（`PageRevealEvent`，新页首渲染）；均带 `viewTransition`。
- **支持三层**：同文档核心 = **Baseline（2025-10）**；view transition types = Chrome 125+/Safari 18+（**缺 Firefox**）；跨文档 = Chrome 126+/Safari 18.2+（**缺 Firefox**）——后两者未进 Baseline，短板都在 Firefox。
- **降级**：SPA 检 `document.startViewTransition`；MPA 不支持则忽略 `@view-transition` 硬切；恒等式「无动画 + DOM 已更新」有多条来路（撞名 / 不可见 / skip / 不支持）。
- **无障碍**：尊重 `prefers-reduced-motion`——弱化或 `skipTransition()`。
- **性能**：每个 name 抓两张位图；命名要克制，只给「跨态移动的主角」命名。
- **头号坑**：唯一名冲突 → `ready` reject、整过渡跳过；回调里 `await` 无关异步 → 卡页面。
- **边界**：CSS `transition`/`@keyframes` 管元素自身属性过渡（[CSS 叶](/zh/base/language/css/css-animation-effects/)）；[JS 动画库](/zh/frontend-visualization/)管时间线 / 手势 / 物理；View Transitions 只补「前后两态之间」。
- **动态命名**：JS `element.style.viewTransitionName = "x"`，抓完 `await ready/finished` 后复位 `"none"`（防 bfcache 撞名）。

## 一、`ViewTransition` 对象

`document.startViewTransition()`、`PageSwapEvent.viewTransition`、`PageRevealEvent.viewTransition` 都返回 / 暴露它。

| 成员 | 类型 | 语义 |
| --- | --- | --- |
| `updateCallbackDone` | `Promise<void>` | 回调（返回的 Promise）完成 = DOM 已更新；回调 reject 则它 reject |
| `ready` | `Promise<void>` | 伪元素树建好、动画将开始；**过渡被跳过时 reject**（用 WAAPI 接管的时机） |
| `finished` | `Promise<void>` | 动画结束、新视图可见可交互；DOM 更新成功即会 resolve（即便动画被跳过） |
| `types` | `ViewTransitionTypeSet` | set-like，`add`/`delete`/`has`/`clear`/`forEach`——运行时增删本次过渡的类型（缺 Firefox） |
| `skipTransition()` | 方法 | 跳过动画部分，DOM 仍更新，`finished` 仍 resolve |

> Level 2 方向：元素级 `element.startViewTransition()`（scoped transitions）等更细粒度能力在较新 Chromium 铺开中，支持面窄于文档级，用前查兼容表。本叶以文档级（`document.startViewTransition`）为准。

`startViewTransition` 两种签名：

```js
document.startViewTransition(updateCallback); // 形态一：直接传回调
document.startViewTransition({ update, types }); // 形态二：选项对象（携带 types）
```

## 二、伪元素树

| 伪元素 | 层级 | 职责 |
| --- | --- | --- |
| `::view-transition` | 根 | 覆盖层，浮在页面之上、覆盖全视口，所有组的容器 |
| `::view-transition-group(name)` | 组 | 每个命名快照一组；**位置 / 尺寸形变补间发生在此**（`transform` + `width`/`height`） |
| `::view-transition-image-pair(name)` | 配对容器 | 装 old + new；默认 `isolation: isolate`（供 `mix-blend-mode`），自定义 clip 常改回 `auto` |
| `::view-transition-old(name)` | 旧快照 | 更新前的**静态位图**；被替换内容渲染，可 `object-fit`/`animation` |
| `::view-transition-new(name)` | 新快照 | 新 DOM 的**实时**表示；被替换内容渲染 |

- `name` = 元素的 `view-transition-name`；默认整页那组叫 `root`。
- `::view-transition-group(*)` 通配命中所有组；`::view-transition-group(.类名)` 命中带某 `view-transition-class` 的组。
- 默认动画：`old` `opacity:1→0`、`new` `opacity:0→1`；`group` 形变补间。

## 三、相关 CSS 属性与选择器

| 特性 | 作用 | 关键点 |
| --- | --- | --- |
| `view-transition-name` | 让元素单独成组 + 新旧配对 | **同一时刻必须唯一**；取值 `<custom-ident>` / `none`（默认） / `match-element`（自动唯一名） |
| `view-transition-class` | 给一批快照共享样式钩子 | **不要求唯一**、**不**单独成组；选择器用 `::view-transition-group(.类名)`；可空格分隔多类 |
| `@view-transition` | 跨文档转场开关（at-rule） | 描述符 `navigation: auto \| none`、`types: <名列表>`；两侧同源页面都写 |
| `:active-view-transition` | 过渡进行中匹配根元素 | 无参；**Baseline** |
| `:active-view-transition-type(x)` | 某类型激活时匹配 | 随 view transition types；**缺 Firefox** |

JS 侧动态命名：`element.style.viewTransitionName = "hero"`（驼峰 `viewTransitionName`）；复位 `= "none"`。

## 四、事件（跨文档）

| 事件 | 事件对象 | 触发时机 | 关键成员 |
| --- | --- | --- | --- |
| `pageswap` | `PageSwapEvent` | 旧文档**卸载前** | `viewTransition`（本次过渡）、`activation`（`from`/`entry` 导航信息） |
| `pagereveal` | `PageRevealEvent` | 新文档**首次渲染时** | `viewTransition`（本次过渡） |

用途：在两侧临时设 `view-transition-name` 做跨文档元素配对，`await viewTransition.finished`（pageswap）/`ready`（pagereveal）后复位 `"none"`，防 bfcache 撞名。跨源导航链中 `activation` 可能为 `null`。

## 五、支持矩阵（核于 2026-07）

| 能力 | Chrome / Edge | Safari | Firefox | Baseline |
| --- | --- | --- | --- | --- |
| **同文档核心**：`startViewTransition`、`view-transition-name`、`view-transition-class`、`match-element`、`:active-view-transition` | 111+ | 18+ | **144+** | **Newly available（2025-10-14）** |
| **view transition types**：`types` 参数 / 描述符、`:active-view-transition-type()`、`ViewTransition.types` | 125+ | 18+ | **✗（144 初版不含）** | 否 |
| **跨文档 MPA**：`@view-transition`、`pageswap`、`pagereveal` | 126+ | 18.2+ | **✗** | 否 |

三句话：

- **同文档核心是安全区**（三引擎齐全，2025-10 进 Baseline；旧版本仍需检测降级）。
- **types 与跨文档不是「仅 Chromium」**——Safari 已跟上（types 18+ / 跨文档 18.2+），**唯一短板是 Firefox**；只要它没补齐，这两块就非 Baseline，生产用必须渐进增强。
- **降级无痛**：SPA 检 `document.startViewTransition`；MPA 不支持时浏览器忽略 `@view-transition` → 硬切，不报错不白屏。

## 六、易错点清单

- **唯一名冲突**：两个元素同 `view-transition-name` → `ready` reject、整过渡跳过（DOM 仍更新）。列表用 `match-element` / 拼 id；`ready.then` 配 `.catch`。
- **根元素全屏闪**：不命名任何元素时 `root` 组整页淡入淡出，突兀——单独命名主角 + 收敛 `root` 动画。
- **回调里 `await` 无关异步**：`updateCallback` 是渲染抑制窗口，`await fetch` 卡页面——数据先取好再进过渡。
- **动态命名忘复位**：JS 设的 `viewTransitionName` 不清 → 跨文档 bfcache 撞名——`await ready/finished` 后设 `"none"`。
- **跨文档没两侧写 / 跨源**：`@view-transition` 需源页目标页都声明且同源，否则不触发。
- **误信动画必然发生**：撞名 / 不可见 / `skipTransition()` / 不支持都会「无动画但 DOM 更新成功」——逻辑别绑动画。
- **误信 types 到处有**：types 与跨文档缺 Firefox——渐进增强，Firefox 落无类型 / 硬切。
- **快照过多**：给太多元素命名 = 抓太多位图——只命名跨态移动的主角。
- **内容跳变**：过渡前后布局骤变，快照跳——预留尺寸 / 骨架或走形变。
- **无障碍缺失**：不理 `prefers-reduced-motion`——reduce 时弱化或 `skipTransition()`。
- **当成动画库**：时间线 / 手势 / 物理 / 循环不是它的活——见[可视化章动画组](/zh/frontend-visualization/)。
- **只在 Chrome 测**：三引擎能力不齐——CI 覆盖「过渡」与「降级」两条路径。

## 七、权威链接

- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) —— API 总览与指南入口
- [MDN: Using the View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using) —— 官方完整教程（伪元素树、自定义动画、跨文档）
- [MDN: Document.startViewTransition()](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) ｜ [ViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition) —— 入口方法与过渡对象
- [MDN: `@view-transition`](https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition) ｜ [view-transition-name](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name) ｜ [view-transition-class](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-class) —— CSS 面
- [MDN: View transition types](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using_types) —— types 与 `:active-view-transition-type()`
- [Chrome for Developers: View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions) ｜ [What's new in 2025](https://developer.chrome.com/blog/view-transitions-in-2025) —— 版本时间线与跨文档实践
- [web.dev: Same-document view transitions are now Baseline](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available) —— Firefox 144 补齐、Baseline 公告
- [WebKit: Features in Safari 18.2](https://webkit.org/blog/16301/webkit-features-in-safari-18-2/) —— Safari 跨文档 View Transitions
- [W3C CSS View Transitions Module Level 1](https://www.w3.org/TR/css-view-transitions-1/) ｜ [Level 2](https://drafts.csswg.org/css-view-transitions-2/) —— 规范原文
- 本站相邻内容：[三大语言 · CSS 叶](/zh/base/language/css/css-animation-effects/)（`transition`/`@keyframes`） ｜ [可视化章 · 动画组](/zh/frontend-visualization/)（WAAPI / GSAP / Framer Motion / Anime.js）
