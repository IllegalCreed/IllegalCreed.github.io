---
layout: doc
outline: [2, 3]
---

# iframe JS 沙箱

> 基于 wujie v2（2026-06 复活） · 核于 2026-07

## 速查

- 沙箱的**四代通论**（快照 / Proxy / with+Proxy / iframe / ShadowRealm）已在[核心机制·JS 沙箱](../../mfe-mechanisms/guide-line/js-sandbox)讲透——本页只讲 **wujie 的 iframe 沙箱怎么落地**，不重复原理
- wujie 的 JS 沙箱**就是 iframe**：把子应用的 JavaScript 注入一个**同域 iframe**，子应用代码在 iframe 自己的 window 上下文里执行
- iframe 沙箱拿到的是**原生 `window`/`history`/`location`**——全局变量、定时器、事件、路由栈全在 iframe 内，**物理隔离**，不污染主应用
- **免 Proxy/with 损耗**：子应用直接跑在 iframe 原生 window 上，**不经代理层**，执行性能不受 qiankun 那种 `Proxy` fakeWindow 拖累
- **同域是关键**：iframe 与主应用**同源**，因此 `window.parent`、`iframe.contentWindow` 可直接互访（跨域会被浏览器 SOP 拦死）——这是 wujie 通信与桥接的地基
- **v2.0 全新「空白同域 iframe 沙箱」**（2026-06）：iframe 指向一个空白同域地址，JS 注入其中执行，**支持浏览器前进后退**，重构了 v1 的沙箱内核
- **物理隔离 ≠ 万能**：iframe 沙箱的代价是**每个子应用一个 iframe**（内存 + 启动开销）、**同域约束**、以及 `location` 操作需走 <code v-pre>window.$wujie.location</code> 以防替换沙箱
- **降级（`degrade`）**：不支持 WebComponent/`Proxy` 的老浏览器可 `degrade: true`，回退到「iframe 直接渲染」——但 iframe 内弹窗无法覆盖全屏
- 拿真实 window：子应用里用 <code v-pre>window.__WUJIE_RAW_WINDOW__</code> 访问未被代理的真实 window
- 与 qiankun Proxy 沙箱的分野：**qiankun 软隔离（防意外不防恶意、省内存、ESM 难）** vs **wujie 物理隔离（最强、Vite 友好、有 iframe 开销）**

## 一、边界：本页讲什么、不讲什么

JS 沙箱要防的三类事故（全局变量污染、事件监听残留、定时器泄漏）、以及四代方案（快照 diff / Proxy 写时隔离 / with 改作用域链 / **iframe 物理隔离** / ShadowRealm 前瞻）的**原理与取舍**，已经在[核心机制·JS 沙箱谱系](../../mfe-mechanisms/guide-line/js-sandbox)里逐代拆过。那一页是「沙箱为什么这么设计」的通论，其中**第四代 iframe 沙箱**正是 wujie 走的路。

本页只答一个具体问题：**wujie 这个框架，怎么用 iframe 把「物理隔离」落地成可用的 JS 沙箱**。原理层的推理（「iframe 天生独立 window ⇒ 物理隔离」）不再重复，需要时点回通论页。

## 二、wujie 的 JS 沙箱就是一个 iframe

wujie 的沙箱内核一句话：**把子应用的 JS 注入一个同域 iframe 里跑**。iframe 是浏览器原生就提供的、独立的浏览上下文（browsing context）——它自带一套完全独立的 `window`、`document`、`history`、`location`、全局对象。子应用的所有脚本都在这个 iframe 的 window 上执行：

```text
主应用 window                      子应用 iframe（同域、display:none）
├─ Vue / React（主应用自己的）      ├─ window（原生！子应用的全局都挂这）
├─ window.token = "main"           ├─ window.token = "sub"（互不影响）
├─ history（主应用路由栈）          ├─ history（子应用自己的路由栈）
└─ location                        └─ location（子应用自己的地址）
```

对比 qiankun 的 Proxy 沙箱——那是「造一个假的 `fakeWindow`、用 `Proxy` 拦截读写、卸载时对 diff 恢复」的**软件模拟**；wujie 这里**不模拟**，直接借用浏览器给 iframe 的**真隔离**。所以：

- **全局变量**：子应用 `window.xxx = 1` 落在 iframe 的原生 window 上，主应用完全看不见，也无需卸载时手动清——iframe 销毁，全局跟着没。
- **定时器 / 事件**：`setInterval`、`addEventListener` 注册在 iframe window 上，iframe 销毁即随之消亡，**不像 Proxy 沙箱要框架逐个记账、卸载时手动清理**。
- **`history` / `location`**：iframe 自带独立的 `history` 栈和 `location`，子应用可以正常 `pushState`、读 `location.pathname`，这正是 wujie [路由同步](./route-sync)能劫持 iframe `history` 的前提。

## 三、免 Proxy/with 的性能账

wujie 官方对比 single-spa/qiankun 时点名的一条优势：**执行性能不被代理上下文拖累**。这句话的技术含义是——

qiankun 的子应用每次访问 `window.X`，都要穿过一层 `Proxy` 的 `get`/`set` 陷阱（先查 `fakeWindow`、再回退真 window）；with+Proxy 沙箱还要把整段代码包进 `with(proxyWindow){...}` 改写作用域链。这两者都是**运行时每次全局访问都要付的税**。

wujie 的子应用跑在 iframe 的**原生 window** 上，`window.X` 就是普通的原生属性访问，**没有代理陷阱、没有 with 作用域改写**——高频访问全局的子应用（尤其大型应用）在这点上更省 CPU。代价则挪到了别处：**iframe 本身的创建有启动开销、每个子应用常驻一个 iframe 有内存开销**（详见 [保活与预加载·内存代价](./keep-alive-preload)）。这是一笔「用内存换执行性能与隔离强度」的账。

## 四、v2.0：全新空白同域 iframe 沙箱

2026-06 的 v2.0 重构了沙箱内核，官方称之为**「全新空白同域 iframe 沙箱」**，两个关键词：

- **空白（blank）**：iframe 的 `src` 指向一个**空白的同域地址**（而非直接把子应用页面塞进 iframe），子应用的 JS 再被注入这个干净的 iframe 上下文里执行。空白 iframe 意味着一张「白纸 window」——没有多余的页面副作用，纯粹当 JS 运行时用。
- **同域（same-origin）**：iframe 与主应用**同源**。这一点至关重要：只有同源，主应用才能 `iframe.contentWindow.xxx` 直接读子应用全局、子应用才能 `window.parent.xxx` 直接访问主应用（[通信](./communication)的地基），wujie 才能代理 iframe 的 `document`（[WC 渲染](./wc-rendering)的地基）——**跨域 iframe 会被浏览器同源策略（SOP）全部拦死**。

v2.0 沙箱的一个用户可感知的收益是**支持浏览器前进后退**：子应用在 iframe 里的路由操作能正确进入浏览器历史栈，配合[路由同步](./route-sync)，点浏览器的前进/后退按钮能正确驱动子应用路由。这解决了 v1 时代 iframe 路由与浏览器历史割裂的老问题，也是 2026-06「连发 4 版复活」的核心动作（详见 [v2.0 与现状](./v2-status)）。

> **同域约束的实战坑**：因为沙箱是同域 iframe，子应用里**直接操作 `location`**（如 `window.location.href = ...`）可能把整个 iframe 替换掉、导致「跨域 frame 访问被拦」。wujie 的解法是让子应用改用 <code v-pre>window.$wujie.location</code> 做所有 location 操作；Vite 子应用尤其要注意这条（见[常见问题](https://wujie-micro.github.io/doc/question/)）。

## 五、降级策略：degrade

不是所有环境都支持 WebComponent 与 `Proxy`。wujie 提供 `degrade` 开关做降级：

```js
// 主应用：对老浏览器强制降级渲染
startApp({
  name: "app-legacy",
  url: "//localhost:7100/",
  el: "#sub-container",
  degrade: true, // 降级：不用 WebComponent，直接把子应用渲染进 iframe
  degradeAttrs: { style: "width:100%;height:100%;" }, // 降级 iframe 的自定义属性
});
```

- **默认（`degrade: false`）**：JS 在 iframe、DOM 在 WebComponent（标准双容器）。
- **降级（`degrade: true`）**：退回「iframe 直接渲染」——JS 和 DOM 都在 iframe 里。此时回到了裸 iframe 的老约束：**iframe 内的弹窗无法覆盖整个应用**（被 iframe 边框框死）。
- wujie 也会在**检测到浏览器不支持 WebComponent** 时自动降级；`degrade: true` 是手动强制。

降级是「保可用性、牺牲体验」的兜底，主力场景仍是默认的双容器模式。

## 六、与 qiankun Proxy 沙箱的对比

把两条路线并排看，隔离这件事上的取舍就清楚了：

| 维度 | qiankun（Proxy 沙箱） | wujie（iframe 沙箱） |
| --- | --- | --- |
| **隔离性质** | 软隔离：`Proxy` 模拟 fakeWindow | **物理隔离：iframe 原生 window** |
| **`window`/`history`/`location`** | 代理/共享真实的（`window.top` 能逃逸） | **各自独立、原生** |
| **全局清理** | 框架记账 + 卸载 diff 恢复 | **iframe 销毁自动清，无需记账** |
| **执行性能** | 每次全局访问过 Proxy 陷阱 / with | **原生访问，无代理税** |
| **防恶意** | 防意外不防恶意（软隔离） | **接近物理隔离**（同域仍可 `window.parent`） |
| **ESM/Vite** | 2.x eval 模型接不了 `type=module` | **iframe 内浏览器原生执行 ESM** |
| **代价** | 省内存、单页多应用轻 | **每应用一 iframe，内存/启动开销** |

一句话定性：**qiankun 是「用软件尽力模拟隔离、省资源」，wujie 是「借浏览器 iframe 拿物理隔离、付内存」**。qiankun Proxy 沙箱的实现细节（三沙箱、`window.onXxx` 坑）见 [qiankun·沙箱实现](../../qiankun/guide-line/sandbox-impl)，本页不重复。真要连 `history`/`location` 都物理独立、要跑 Vite 子应用，iframe 路线（wujie）就是答案。

## 七、iframe 沙箱的两个实战坑

iframe 是物理隔离的强项，但也带来两个**必须知道的落地坑**，都源于「这是个真 iframe」：

**① iframe 不可见，只当 JS 运行时**。承载子应用 JS 的那个 iframe 是 `display: none` 的——它**不参与渲染**（渲染在 [WebComponent](./wc-rendering) 里），纯粹当「子应用 JS 的独立 window 运行时」。所以别指望在 DevTools 的 Elements 里看到子应用界面在 iframe 内，界面在 <code v-pre>&lt;wujie&gt;</code> 的 `shadowRoot` 里。

**② 主应用资源误注入子应用 iframe**。因为 iframe 与主应用同域、初始可能加载主应用上下文，有时主应用的脚本/资源会被误加载进子应用 iframe，导致重复执行或报错。官方给的两条解法：

```js
// 解法 A：给 iframe 的 src 指向一个「返回空内容」的同域端点
startApp({
  name: "app-vue",
  url: "//localhost:7100/",
  el: "#sub-container",
  attrs: { src: "https://your-host/empty" }, // 空端点，避免加载多余内容
});
```

```html
<!-- 解法 B：主应用 <head> 最前面插一段——非顶层窗口就停止加载 -->
<script>
  // window.parent !== window 说明当前在 iframe 里（子应用沙箱），立即停止
  if (window.parent !== window) {
    window.stop();
  }
</script>
```

这两个坑与「同域 iframe」这个物理事实绑定——理解了「沙箱就是个真 iframe」，它们就都好解释了。更多 iframe 相关排障（跨域 frame 访问、Vite `location` 替换）见官方[常见问题](https://wujie-micro.github.io/doc/question/)。

## 小结

wujie 的 JS 沙箱本质是「把子应用 JS 注入同域 iframe 里跑」：借浏览器给 iframe 的原生 `window`/`history`/`location` 拿到**物理隔离**，全局无需记账清理、执行不付 Proxy/with 代理税、ESM 交浏览器原生执行——这是隔离性与 Vite 亲和的根源。v2.0 用「全新空白同域 iframe 沙箱」重构内核并支持浏览器前进后退；代价是每应用一 iframe 的内存开销、同域约束与 `location` 操作要走 <code v-pre>window.$wujie.location</code>。JS 在 iframe 里跑通了，DOM 又是怎么跑到主应用页面上、还能弹窗覆盖全屏的？下一页 [WebComponent 容器渲染](./wc-rendering)。
