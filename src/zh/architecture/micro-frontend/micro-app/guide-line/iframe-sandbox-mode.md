---
layout: doc
outline: [2, 3]
---

# iframe 沙箱模式

> 基于 micro-app 1.0（RC） · 核于 2026-07

## 速查

- iframe 沙箱是 micro-app **1.0 起新增的可选强隔离模式**——默认仍是 [with 沙箱](./with-sandbox)，加一个 **`iframe` 属性**即切换
- 开启方式：`<micro-app name url iframe></micro-app>` 或全局 `microApp.start({ iframe: true })`
- **原理**：把子应用 JS 注入一个**同域 iframe** 里跑，拿 iframe 原生的 `window`/`document`/`history`/`location`——是**物理隔离**，比 with 软沙箱强（沙箱四代通论见[核心机制·JS 沙箱](../../mfe-mechanisms/guide-line/js-sandbox)）
- **与 with 沙箱的取舍**：iframe **隔离更强**（连 `document`/`location` 都独立），但**兼容性/体验代价更大**（同域约束、每应用一 iframe 开销、部分 API 行为差异）；with 沙箱**性能好、兼容广**但软隔离
- **同域初始化坑**：iframe 初始可能**误加载主应用资源**，两解——① 建一个空的 `empty.html` 并把 `iframeSrc` 指向它；② 主应用 `<head>` 顶部插 <code v-pre>if (window.parent !== window) { window.stop() }</code> 阻止非顶层窗口继续加载
- **同域是硬约束**：iframe 与主应用**同源**才能互访、才能被 micro-app 桥接；跨域会被浏览器同源策略拦死
- **何时选 iframe**：with 沙箱下**顶层变量/全局污染**难缠、或子应用**强隔离诉求**（如第三方不可信、需要独立 `history`）、或 with 沙箱有兼容问题跑不通时
- iframe 沙箱在 1.0 持续增强：Document 禁用、window 事件逃逸、Worker 代理等（见 [Releases](https://github.com/jd-opensource/micro-app/releases)）
- 这条路线**与 [wujie](../../wujie/) 的默认路线同源**（都靠同域 iframe 拿物理隔离）——差别是 wujie 天生 iframe-only，micro-app 是「with 为主、iframe 可选」
- **本页只讲 micro-app 的 iframe 模式落地**；iframe 沙箱的通代原理见通论页，不重复

## 一、边界：本页讲什么

「iframe 天生独立 `window` ⇒ 物理隔离」这个**原理**，以及它在四代沙箱里的位置，已在[核心机制·JS 沙箱](../../mfe-mechanisms/guide-line/js-sandbox)讲过（也是 [wujie](../../wujie/) 的默认路线）。本页只讲 micro-app 这个框架里，**iframe 沙箱作为「可选模式」怎么开、和默认 with 沙箱怎么权衡、有哪些落地坑**。

## 二、1.0 起可选：一个 iframe 属性

micro-app **默认用 with 沙箱**；从 1.0 起，它把 iframe 沙箱作为**平行的可选模式**提供出来，切换只需一个属性：

```html
<!-- 单个子应用：开 iframe 沙箱 -->
<micro-app name="app1" url="http://localhost:3000/" iframe></micro-app>
```

```js
// 或全局默认：所有子应用都用 iframe 沙箱
import microApp from "@micro-zoe/micro-app";
microApp.start({ iframe: true });
```

开启后，micro-app 会为子应用创建一个**同域、不可见的 iframe**，把子应用的 JavaScript 注入其中执行。子应用因此拿到的是 iframe **原生的** `window`/`document`/`history`/`location`——全局变量、定时器、事件、路由栈全在 iframe 自己的上下文里，与主应用**物理隔离**。这和 [with 沙箱](./with-sandbox) 那种「`Proxy` 造假 window」的软件模拟是两回事。

> **注意**：即便开了 iframe 沙箱，子应用的 **DOM 仍渲染在 `<micro-app>` 元素里**（不是渲染在 iframe 内），micro-app 依旧靠 CustomElement 容器承载视图——iframe 只当「JS 运行时」。这一点与 [wujie](../../wujie/) 的「JS 在 iframe、DOM 在 `<wujie>` WebComponent」分工是相通的。

## 三、与 with 沙箱的取舍

选 with 还是 iframe，本质是**「兼容/性能」与「隔离强度」的权衡**：

| 维度 | [with 沙箱](./with-sandbox)（默认） | **iframe 沙箱**（可选） |
| --- | --- | --- |
| **隔离性质** | 软隔离（`Proxy`+`with` 模拟） | **物理隔离**（iframe 原生上下文） |
| **`window`** | 代理假 window（读回退真 window） | **iframe 原生 window** |
| **`document`/`location`/`history`** | 部分代理/共享 | **各自独立、原生** |
| **顶层变量挂 window** | ❌ 经典坑 | **✅ 接近原生行为** |
| **性能** | 好（无 iframe 开销） | 有 **iframe 创建/常驻开销** |
| **兼容性** | 广（除 IE） | 同域约束 + 部分 API 差异 |
| **防隔离逃逸** | 弱（防意外不防恶意） | **强**（接近物理隔离） |

结论：**with 沙箱是默认、够用、轻量的选择**；只有当软隔离摆不平（顽固的全局污染、强隔离诉求、with 兼容问题）时，才用 iframe 沙箱换更强的隔离，代价是内存开销与同域约束。

## 四、同域初始化坑与 window.stop()

iframe 沙箱最著名的落地坑，源于「这是个真同域 iframe」：**初始化时，这个 iframe 可能会误加载主应用的资源**（因为同域、初始 src 可能落到主应用上下文），导致主应用脚本在子应用 iframe 里重复执行、报错。官方给两条解法：

**解法 A：把 iframe 指向一个空页面**。建一个几乎空的 `empty.html`，用 `iframeSrc` 让沙箱 iframe 初始化到它，避免加载多余内容：

```js
// 主应用：让 iframe 沙箱初始化到一个空白同域页面
microApp.start({
  iframe: true,
  iframeSrc: location.origin + "/empty.html", // 同域空页面，避免误载主应用资源
});
```

```html
<!-- 主应用 public/empty.html：内容尽量空，只当 iframe 沙箱的干净初始页 -->
<!doctype html>
<html>
  <head></head>
  <body></body>
</html>
```

**解法 B：主应用头部拦截非顶层窗口**。在主应用 `<head>` **最前面**插一段脚本——若当前不是顶层窗口（说明在 iframe 沙箱里），立刻停止加载：

```html
<!-- 主应用 index.html 的 <head> 最前面 -->
<script>
  // window.parent !== window 说明当前处于 iframe（子应用沙箱）里，停止继续加载主应用内容
  if (window.parent !== window) {
    window.stop();
  }
</script>
```

这两个坑和「同域 iframe」这个物理事实绑定——理解了「iframe 沙箱就是个真同域 iframe」，它们就都好解释了。此外**同域是硬约束**：iframe 必须与主应用同源，micro-app 才能桥接与通信，跨域会被同源策略（SOP）拦死。更多排障见官方[沙箱文档](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/sandbox)。

## 五、何时选 iframe 模式

给一张决策清单——**默认留在 with 沙箱**，命中下列任一条再考虑切 iframe：

- **顽固的全局污染/顶层变量问题**：with 沙箱「顶层 `var`/`function` 不挂 window」的坑（见 [with 沙箱](./with-sandbox)）在某些三方库上绕不过去时，iframe 的原生 window 行为更接近独立运行。
- **强隔离诉求**：子应用来源不完全可信、或需要**独立的 `history`/`location`**（如子应用自己要完整控制浏览器历史），iframe 的物理隔离更稳。
- **with 沙箱跑不通**：个别子应用在 with 沙箱下有兼容性问题（官方原话「with 沙箱不工作时」用 iframe 兜底）。
- **对齐 wujie 式隔离**：团队就是想要 iframe 物理隔离路线，但又想保留 micro-app 的标签化接入与生态时。

反过来，**大多数场景（内部可信子应用、追求性能与最低成本）应留在默认 with 沙箱**——iframe 的内存开销与同域约束是实打实的成本。

## 六、切沙箱只换「JS 隔离」，其余不变

一个容易误解的点：**`iframe` 属性只切换「JS 沙箱的实现」，micro-app 的其余能力与用法完全不变**。换句话说，with 与 iframe 之间切换，对上层是**近乎透明**的：

| 能力 | with 沙箱 | iframe 沙箱 | 说明 |
| --- | --- | --- | --- |
| **DOM 渲染位置** | `<micro-app>` 元素内 | **同样在 `<micro-app>` 元素内** | iframe 只当 JS 运行时，视图不进 iframe |
| **样式隔离** | scopedcss 前缀改写 | 同左 | 走 [元素与样式隔离](./element-style-isolation) 那套，与沙箱无关 |
| **元素隔离** | DOM 作用域代理 | 同左 | `removeDomScope` 逃逸口一致 |
| **数据通信** | `window.microApp` API | **同一套 API** | `getData`/`dispatch`/`GlobalData` 见 [数据通信](./data-communication) |
| **生命周期事件** | `created`…`mounted` | 同左 | 见 [CustomElement 容器](./custom-element) |
| **虚拟路由** | `microApp.router` | 同左 | `router-mode` 等不受沙箱选择影响 |

所以「选 with 还是 iframe」是一个**局部决策**——你不需要为切沙箱而重写通信、路由或样式代码，只是把「子应用 JS 跑在代理 window 还是 iframe 原生 window」这一层换掉。这让「先用 with 快速跑通、遇到隔离问题再局部切 iframe」成为低成本的渐进路径，也是 micro-app「双沙箱可选」相对 wujie「iframe only」的灵活之处。

## 小结

iframe 沙箱是 micro-app 1.0 起的**可选强隔离模式**：加一个 `iframe` 属性，就把子应用 JS 注入同域 iframe，拿原生 `window`/`document`/`history`/`location` 的**物理隔离**，摆平 with 软沙箱摆不平的全局污染与强隔离诉求；代价是同域约束、每应用一 iframe 的内存开销，以及「初始化误载主应用资源」的坑（用 `iframeSrc` 指空页 或 `window.stop()` 兜）。默认仍是 with 沙箱，命中强隔离/兼容问题再切。沙箱（JS 隔离）讲完了，接下来看另外两件隔离——DOM 与 CSS 是怎么被圈进 `<micro-app>` 边界的：下一页 [元素与样式隔离](./element-style-isolation)。
