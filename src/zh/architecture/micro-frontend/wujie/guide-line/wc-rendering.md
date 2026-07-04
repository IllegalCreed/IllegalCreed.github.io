---
layout: doc
outline: [2, 3]
---

# WebComponent 容器渲染

> 基于 wujie v2（2026-06 复活） · 核于 2026-07

## 速查

- **CSS 隔离通论**（Shadow DOM / 属性改写 / 命名空间四路方案）已在[核心机制·CSS 隔离](../../mfe-mechanisms/guide-line/css-isolation)讲透——本页只讲 **wujie 怎么用 WebComponent 渲染 DOM**
- wujie 的 DOM 容器是一个**自定义元素 <code v-pre>&lt;wujie&gt;</code>**（WebComponent）：子应用的真实 DOM 树渲染进它的 **`shadowRoot`**
- **iframe 与 WC 分工**：**JS 在 iframe 里跑**（[iframe 沙箱](./iframe-sandbox)），**DOM 在 <code v-pre>&lt;wujie&gt;</code> WebComponent 里渲染**——二者分离是 wujie 破解「裸 iframe 把 DOM 框死」的关键
- **DOM 不进 iframe 的收益**：子应用弹窗/浮层能**覆盖主应用全屏**（不被 iframe 边框框死），布局随主应用文档流
- **`document` 代理桥接**：wujie 代理 iframe 的 `document.querySelector`/`getElementById`/`getElementsByClassName`/`getElementsByTagName`、`body`/`head` 等，指向 <code v-pre>&lt;wujie&gt;</code> 的 `shadowRoot`——子应用「以为」在操作 document，实为操作 WebComponent 的 DOM
- **样式隔离随 Shadow DOM 天然发生**：`shadowRoot` 是浏览器原生的样式边界，子应用样式进不来、出不去，**无需 qiankun 那种运行时选择器改写**
- **`@font-face` 逃逸处理**：字体声明在 Shadow DOM 内不生效，wujie 自动把字体声明搬到 shadow 边界外（注意主/子应用**字体名别重名**）
- **事件系统修正**：异步事件处理器里 `e.target` 会变成 `wujie-app` 元素，需用 `e.composedPath()[0]` 取真实目标
- **弹窗定位坑**：基于 Popper.js 2.0 的下拉/气泡可能错位，子应用 `body` 设 `position: relative` 修正
- **相对 URL 自动转绝对**：CSS 里的相对 `url()`、动态图片路径由 wujie 自动补成绝对地址（`v-html`/`innerHTML` 动态插入需额外配 <code v-pre>window.__webpack_public_path__</code>）
- 一句话：**iframe 给隔离与运行时，WebComponent 给渲染与样式隔离**，`document` 代理把两者缝合成「子应用感觉自己在正常跑」

## 一、为什么 DOM 不放进 iframe

裸 iframe 方案里，子应用的 JS 和 DOM 都在 iframe 内——这带来一个**致命体验问题**：iframe 是一个独立的视口盒子，**里面的弹窗、下拉、全屏遮罩永远无法超出 iframe 的边框**。一个居中的模态框，在 iframe 里只能相对 iframe 居中，没法覆盖整个主应用页面。

wujie 的破解思路是**把 JS 和 DOM 拆开**：

- **JS** 留在 iframe 里跑（拿[物理隔离](./iframe-sandbox)）；
- **DOM** 拎出来，渲染进主应用页面里的一个 <code v-pre>&lt;wujie&gt;</code> WebComponent 元素。

于是子应用的 DOM 就活在主应用的文档流里了——它的弹窗能覆盖全屏、`z-index` 与主应用同一套层叠上下文、布局随主应用容器伸缩。这就是 wujie 相对裸 iframe 最直观的渲染收益。

## 二、<code v-pre>&lt;wujie&gt;</code> 与 shadowRoot

wujie 用 [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) 定义了一个自定义元素 <code v-pre>&lt;wujie&gt;</code>。你在主应用配的 `el`（或 <code v-pre>&lt;WujieVue&gt;</code> 组件位置），最终就渲染出这个元素，子应用的真实 DOM 挂在它的 `shadowRoot` 里：

```text
#sub-container（你给的 el）
└─ wujie                      ← 自定义元素（WebComponent）
     └─ #shadow-root (open)     ← Shadow DOM 边界：样式的天然隔离墙
          ├─ <div id="app">     ← 子应用真实 DOM 树从这里开始
          │    └─ ……子应用的组件树
          └─ <style>……</style> ← 子应用样式被限制在这层 shadow 里
```

`shadowRoot` 是浏览器原生的封装边界：**shadow 内的样式不会泄漏到外面，外面的样式（除继承属性/CSS 变量外）也进不来**。这正是 wujie「CSS 隔离」的来源——不是框架运行时改写选择器，而是**借浏览器 Shadow DOM 的原生能力**（对比通论里的四路方案，wujie 属「Shadow DOM 派」，见[核心机制·CSS 隔离](../../mfe-mechanisms/guide-line/css-isolation)）。

## 三、iframe 与 WebComponent 的分工

这是 wujie 架构的核心，一张表说清谁管什么：

| 关注点 | 归谁 | 说明 |
| --- | --- | --- |
| 子应用 **JS 执行** | **iframe** | 全局变量、闭包、定时器、事件都在 iframe 原生 window |
| `window` / `history` / `location` | **iframe** | 原生独立，路由同步靠劫持 iframe `history` |
| 子应用 **DOM 树** | **WebComponent** | 渲染进 <code v-pre>&lt;wujie&gt;</code> 的 `shadowRoot`，活在主应用文档流 |
| **样式隔离** | **WebComponent** | 随 Shadow DOM 天然隔离 |
| **JS ↔ DOM 桥接** | **`document` 代理** | 把 iframe 的 `document` 查询指向 <code v-pre>&lt;wujie&gt;</code> |

关键在最后一行：JS 在 iframe、DOM 在 WC，两者本来是**两个不同的文档**——子应用调 `document.getElementById('app')` 时，如果直接查 iframe 的 document，是查不到 DOM 的（DOM 不在 iframe 里）。wujie 靠 `document` 代理把这道缝补上。

## 四、document 代理桥接

wujie 代理（劫持）iframe `document` 上的一批查询 API，把它们**重定向到 <code v-pre>&lt;wujie&gt;</code> 的 `shadowRoot`**：

```text
子应用代码（在 iframe 里执行）        wujie 代理后实际作用于
────────────────────────────       ────────────────────────
document.querySelector('.btn')  →   wujie.shadowRoot.querySelector('.btn')
document.getElementById('app')  →   wujie.shadowRoot.getElementById('app')
document.getElementsByClassName →   查 shadowRoot
document.getElementsByTagName   →   查 shadowRoot
document.body / document.head   →   指向 shadowRoot 里的 body/head 代理
document.createElement(...)     →   正常创建，挂载时进 shadowRoot
```

于是从子应用视角看，它「以为」自己在一个正常页面里操作 `document`——`querySelector` 能查到自己的节点、`body` 就是自己的 body。实际这些操作被透明地导向了 WebComponent 容器。**子应用几乎无需为这套桥接改代码**（这就是 wujie「低侵入」的技术底座）。

> 这套代理只在**默认双容器模式**下生效；若 [`degrade: true`](./iframe-sandbox) 降级为「iframe 直接渲染」，DOM 回到 iframe 内，就不需要也没有这套 document 代理了。

## 五、样式隔离与两个逃逸修正

样式随 Shadow DOM 天然隔离，但有两类东西**在 Shadow DOM 里会「失灵」**，wujie 做了特殊处理：

**① `@font-face` 字体**：CSS 字体声明在 shadow tree 内不生效（浏览器规范限制）。wujie 会**自动把 `@font-face` 声明搬到 shadow 边界外**，让字体能加载。副作用：主应用和子应用**若用了同名字体族会互相覆盖**——起字体名时要避开重名（见[常见问题](https://wujie-micro.github.io/doc/question/)）。

**② 相对 `url()` 路径**：CSS 里 `background: url(./a.png)` 的相对路径，默认会相对主应用域名解析而 404。wujie **自动把相对 `url()` 转成绝对地址**。但**动态插入的 HTML**（`v-html`、`innerHTML`、运行时 append 的 `<style>`）不走这条自动转换，需要在子应用入口补一行：

```js
// 子应用入口：让动态插入的资源也用正确的 publicPath
window.__webpack_public_path__ = window.__WUJIE_PUBLIC_PATH__;
```

主应用样式如何不污染子应用、Shadow DOM 的继承属性穿透等通论，见[核心机制·CSS 隔离](../../mfe-mechanisms/guide-line/css-isolation)。

一个和分工相关的推论：子应用运行时动态 append 的 `<style>`/`<link>`，因为 `document.head`/`document.body` 被上一节的 `document` 代理指向了 <code v-pre>&lt;wujie&gt;</code> 容器，会正确落进 `shadowRoot`、随子应用[销毁而移除](./keep-alive-preload)——这也是「样式隔离靠 WebComponent」在动态样式上的自洽体现，无需框架像 Proxy 沙箱那样逐条记账改写选择器。

## 六、事件系统修正

DOM 在 Shadow DOM 里、事件跨越 shadow 边界冒泡时，浏览器会做**事件重定向（event retargeting）**——事件的 `target` 会被改写成宿主元素（这里是 `wujie-app`/<code v-pre>&lt;wujie&gt;</code>），以免暴露 shadow 内部结构。这会坑到依赖 `e.target` 的代码，尤其**异步处理器**里：

```js
// ❌ 坑：异步事件处理里 e.target 已被重定向成 wujie 宿主元素
element.addEventListener("click", (e) => {
  setTimeout(() => {
    console.log(e.target); // 可能是 wujie-app，而非真实点击的节点
  });
});

// ✅ 正解：用 composedPath 取穿透 shadow 的真实目标
const realTarget =
  e.target.shadowRoot && e.composed ? e.composedPath()[0] || e.target : e.target;
```

另一个高频渲染坑是**弹窗定位**：基于 Popper.js 2.0 的下拉框、气泡卡片在 Shadow DOM 里可能定位错乱，官方给的修正是给子应用 `body` 设 `position: relative`。这些都是「DOM 活在 Shadow DOM 里」带来的边角成本——换来的是原生、强隔离的样式边界。

## 小结

wujie 把子应用**拆成两半渲染**：JS 在 iframe 里跑拿隔离，DOM 在 <code v-pre>&lt;wujie&gt;</code> WebComponent 的 `shadowRoot` 里渲染拿「活在主应用文档流」的能力（弹窗覆盖全屏、样式随 Shadow DOM 天然隔离）。两半靠 **`document` 代理**缝合——iframe 里的 `querySelector`/`getElementById`/`body`/`head` 被透明重定向到 shadowRoot，子应用几乎无感。代价是几处逃逸修正：`@font-face` 搬出 shadow（防重名）、相对 `url()` 自动转绝对（动态插入需配 publicPath）、异步事件用 `composedPath` 取真实 `target`、Popper 弹窗设 `position: relative`。DOM 渲染通了，子应用在 iframe 里的路由怎么和浏览器地址栏对上？下一页 [路由同步](./route-sync)。
