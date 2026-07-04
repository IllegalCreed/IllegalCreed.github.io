---
layout: doc
outline: [2, 3]
---

# with 沙箱（默认）

> 基于 micro-app 1.0（RC） · 核于 2026-07

## 速查

- 沙箱的**四代通论**（快照 / Proxy / with+Proxy / iframe / ShadowRealm）已在[核心机制·JS 沙箱](../../mfe-mechanisms/guide-line/js-sandbox)讲透——本页只讲 **micro-app 的 with 沙箱怎么落地**，不重复原理
- micro-app **默认沙箱 = with 沙箱**：把子应用代码包进 <code v-pre>with(proxyWindow){ … }</code>，用 **`Proxy`** 拦截对 `window`/`document` 的读写，造一个「相对独立的运行空间」
- 与 [qiankun](../../qiankun/) 的 proxySandbox 同宗（都靠 `Proxy` 拦截假 window），但 micro-app **叠了 `with`** 改写作用域链——所以叫 **with 沙箱**而非纯 proxy 沙箱
- **全局变量隔离**：子应用 `window.x = 1` 落在代理 window 上，不污染主应用真 `window`；卸载时随沙箱回收
- micro-app 向子应用注入一批全局变量：<code v-pre>__MICRO_APP_ENVIRONMENT__</code>（是否被嵌入）、<code v-pre>__MICRO_APP_NAME__</code>（应用名）、<code v-pre>__MICRO_APP_PUBLIC_PATH__</code>（publicPath）、<code v-pre>__MICRO_APP_BASE_ROUTE__</code>（路由 base）、<code v-pre>__MICRO_APP_BASE_APPLICATION__</code>（是否主应用）
- **经典坑**：`with` 作用域下，子应用**顶层 `var x` / `function f(){}` 不会挂到 `window.x`**——依赖 `window.全局` 的库会失效
- **三种解法**：webpack 把 `output.library.type` 设为 `"window"`；或手动 `window.x = x`；或用**插件系统**在加载时改写代码
- **取真实对象**：子应用用 `window.rawWindow` / `window.rawDocument` 拿到未被代理的主应用真 `window`/`document`
- **软隔离本质**：with 沙箱是「防意外、不防恶意」的软隔离，性能好、兼容广、无 iframe 开销；要更强隔离用 [iframe 沙箱模式](./iframe-sandbox-mode)
- **关沙箱**：`disable-sandbox` 属性可关（**官方不推荐**，会丢隔离）
- 依赖 **`Proxy`**（必须原生、不可 polyfill），这是 micro-app 除 IE 外全兼容、但**必须 Proxy** 的根因

## 一、边界：本页讲什么、不讲什么

JS 沙箱要防的三类事故（全局变量污染、事件监听残留、定时器泄漏），以及四代方案（快照 diff / Proxy 写时隔离 / **with 改作用域链** / iframe 物理隔离 / ShadowRealm 前瞻）的**原理与取舍**，已经在[核心机制·JS 沙箱谱系](../../mfe-mechanisms/guide-line/js-sandbox)里逐代拆过。其中 **with + Proxy** 这一代，正是 micro-app 默认走的路。

本页只答一个具体问题：**micro-app 这个框架，怎么用 `with` + `Proxy` 把「软隔离沙箱」落地**。原理层推理不再重复，需要时点回通论页。

## 二、默认沙箱就是 with 沙箱：Proxy + with

micro-app 的默认沙箱一句话：**把子应用的每段脚本包进 `with(proxyWindow){…}`，`proxyWindow` 是一个 `Proxy`，拦截所有全局读写**。

```js
// micro-app with 沙箱（高度简化示意）
const rawWindow = window; // 真实主应用 window
const microAppWindow = {}; // 子应用专属的「假 window」载体

// 用 Proxy 拦截：写落到假 window，读优先假 window、回退真 window
const proxyWindow = new Proxy(microAppWindow, {
  get(target, key) {
    if (key in target) return target[key];
    return rawWindow[key]; // 未覆盖的读，回退真 window
  },
  set(target, key, value) {
    target[key] = value; // 写只落到子应用的假 window，不污染主应用
    return true;
  },
});

// 子应用代码执行时被这样包裹：with 让「裸的全局名」都走 proxyWindow
(function (window, self, globalThis) {
  with (window) {
    /* …子应用源码… 这里的 document、location、自定义全局都走代理 */
  }
}).call(proxyWindow, proxyWindow, proxyWindow, proxyWindow);
```

两层机制配合：

- **`with(proxyWindow)`**：让子应用源码里**裸写的全局名**（`document`、`location`、`setTimeout`、自定义全局……）在查找时先落到 `proxyWindow`，而不是真 `window`——这是「改作用域链」。
- **`Proxy` 拦截**：`proxyWindow` 的 `get`/`set` 决定「读回退真 window、写只落假 window」，实现**写时隔离**。

于是子应用「以为」自己在操作 `window`，实际操作的是一个专属代理，全局互不干扰。

## 三、全局变量隔离与注入的环境变量

**隔离**：子应用 `window.token = 'sub'` 只写进代理 window，主应用 `window.token` 完全看不见；子应用卸载时代理连同其上的全局一起回收，无需像快照沙箱那样 diff 恢复。

**注入**：micro-app 在沙箱里给子应用挂了一批**约定全局变量**，供子应用自省与配置：

| 注入变量 | 含义 | 典型用法 |
| --- | --- | --- |
| <code v-pre>window.__MICRO_APP_ENVIRONMENT__</code> | 是否运行在 micro-app 环境 | 判断「独立 / 被嵌入」切换渲染 |
| <code v-pre>window.__MICRO_APP_NAME__</code> | 当前子应用的 `name` | 日志、多实例区分 |
| <code v-pre>window.__MICRO_APP_PUBLIC_PATH__</code> | 注入的 publicPath | 配 <code v-pre>__webpack_public_path__</code> |
| <code v-pre>window.__MICRO_APP_BASE_ROUTE__</code> | 基础路由（对应 `baseroute` 属性） | 设路由 `base` |
| <code v-pre>window.__MICRO_APP_BASE_APPLICATION__</code> | 是否为主应用（`start()` 后为真） | 主/子应用共用代码时分支 |

```js
// 子应用：用注入变量自省 + 配 publicPath
if (window.__MICRO_APP_ENVIRONMENT__) {
  // 被 micro-app 嵌入：改写 webpack 运行时 publicPath
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__;
  console.log("当前子应用名：", window.__MICRO_APP_NAME__);
}
```

## 四、经典坑：顶层变量不挂 window

这是 micro-app（以及所有 with 沙箱）**最容易踩的坑**，务必知道：

```js
// 子应用顶层这样写：
var globalCfg = { a: 1 };
function init() {}

// 在 with 沙箱里，globalCfg / init 不会挂到 window！
console.log(window.globalCfg); // undefined（不是 { a: 1 }）
console.log(window.init); // undefined
```

**原因**：正常浏览器里，顶层 `var x`/`function f(){}` 会成为 `window` 的属性；但子应用代码被包进了 `with(proxyWindow){ (function(){ … })() }` 这类作用域，顶层声明落在了**函数作用域**里，并没有真正挂到 window 上。凡是「声明一个全局、再用 `window.全局` 去读」的库（一些老 UMD/JSONP 库、CDN 全局库）都会因此失效。

**三种解法**（任选其一，官方均给出）：

```js
// 解法 A：webpack 把库产物的挂载目标设为 window（dll / module federation 等场景）
module.exports = {
  output: { library: { type: "window" } },
};
```

```js
// 解法 B：源码里手动挂到 window
window.globalCfg = { a: 1 };
```

- **解法 C：插件系统**——用 micro-app 的 `plugins` 在加载子应用代码时**运行时改写**，把顶层声明转成 `window.x =` 形式（适合改不动源码的三方脚本）。

## 五、逃逸到真实对象：rawWindow / rawDocument

有时子应用**确实需要**操作主应用真实的 `window`/`document`（比如挂一个真正全局的监听、或读主应用注入的全局）。micro-app 提供逃逸口：

```js
// 子应用：拿未被代理的真实主应用对象
window.rawWindow; // 真实 window（未经 Proxy）
window.rawDocument; // 真实 document

// 例：在真实 document 上做一次性操作（谨慎，会突破隔离）
window.rawDocument.title = "被子应用改了主文档标题";
```

`rawWindow`/`rawDocument` 是**有意的隔离缺口**——用它意味着「我知道我在突破沙箱」。日常应避免，仅在明确需要跨界时使用。

## 六、与 qiankun proxySandbox 的异同

micro-app 的 with 沙箱和 [qiankun](../../qiankun/) 的 proxySandbox 是「近亲」，但有一处关键差别：

| 维度 | qiankun proxySandbox | **micro-app with 沙箱** |
| --- | --- | --- |
| **核心机制** | `Proxy` 拦截 fakeWindow | **`with` 改作用域链 + `Proxy` 拦截** |
| **作用域改写** | 无 `with`，靠打包/执行时注入 `window` 变量 | **有 `with(proxyWindow)`** |
| **隔离性质** | 软隔离（防意外不防恶意） | **软隔离**（同性质） |
| **全局清理** | 卸载回收代理 | 卸载回收代理 |
| **多实例** | `Proxy` 天然多实例 | 每个 <code v-pre>&lt;micro-app&gt;</code> 一套代理 |
| **典型坑** | `window.onXxx` 事件属性等 | **顶层 `var`/`function` 不挂 window** |

一句话定性：**两者都是「用 `Proxy` 造假 window 的软隔离」，micro-app 额外用 `with` 收敛了裸全局名的查找**，代价就是上一节那个「顶层声明不挂 window」的坑。qiankun proxySandbox 的三沙箱细节（`window.onXxx`、快照沙箱）见 [qiankun·沙箱实现](../../qiankun/guide-line/sandbox-impl)，本页不重复。要连 `document`/`location` 都物理独立、或 with 沙箱兼容出问题，就该上 [iframe 沙箱模式](./iframe-sandbox-mode)。

## 小结

micro-app 的默认沙箱是 **with 沙箱**：`with(proxyWindow){…}` 改作用域链 + `Proxy` 拦截读写，造出「读回退真 window、写只落假 window」的软隔离，全局互不污染、卸载即回收，性能好、兼容广、无 iframe 开销。它给子应用注入 <code v-pre>__MICRO_APP_*__</code> 系列环境变量做自省与配置；最需要警惕的坑是「顶层 `var`/`function` 不挂 window」，用 `output.library.type='window'`、手动挂载或插件改写来解；`rawWindow`/`rawDocument` 是有意的逃逸口。软隔离不够用时，1.0 提供了更强的另一条路——下一页 [iframe 沙箱模式](./iframe-sandbox-mode)：它怎么用真 iframe 换来更强隔离，又付出什么代价。
