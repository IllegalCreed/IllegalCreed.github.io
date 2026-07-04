---
layout: doc
outline: [2, 3]
---

# CustomElement 容器

> 基于 micro-app 1.0（RC） · 核于 2026-07

## 速查

- micro-app 的容器 <code v-pre>&lt;micro-app&gt;</code> 是用浏览器原生 **`window.customElements.define`** 注册的**自定义元素**——这就是它「**类 WebComponent（webcomponent-like）**」的字面含义
- **只借 CustomElement 一层，不默认用 Shadow DOM**：子应用 DOM 默认直接挂在 <code v-pre>&lt;micro-app&gt;</code> 元素内部，隔离另由元素隔离 + scopedcss + JS 沙箱负责（`shadowDOM` 属性是可选增强）
- 运行环境因此**必须支持 CustomElements**（可 polyfill）**与 Proxy**（必须原生、不可 polyfill）——除 IE 外的现代浏览器都满足
- 核心属性：**`name`（必填、唯一、字母开头）**、**`url`（必填、指向子应用 index.html）**、`baseroute`（子应用基础路由）、`iframe`（开 iframe 沙箱）、`keep-alive`（保活）、`ssr`、`inline`、`destroy`、`default-page`、`router-mode`
- **组件化接入**：<code v-pre>&lt;micro-app&gt;</code> 是真标签，能直接写进 Vue/React/Angular 模板当普通组件用，`:url` 动态绑定、`data` 传数据、`@事件` 监听
- **五个生命周期事件**：`created`（元素初始化后、加载资源前）→ `beforemount`（资源加载完、渲染前）→ `mounted`（渲染结束）→ `unmount`（卸载）→ `error`（渲染终止型错误）
- 生命周期**是 DOM 事件**：用 `addEventListener('mounted', …)` 或框架 `@mounted` 监听，也可用全局 `microApp.start({ lifeCycles })` 统一监听（回调收 `(e, appName)`）
- **keep-alive 的额外事件**：`beforeshow`/`aftershow`/`afterhidden`，子应用侧监听 `window.addEventListener('appstate-change', e => e.detail.appState)`
- **接入成本最低的本质**：子应用无需导出 `bootstrap/mount/unmount`（对比 [qiankun](../../qiankun/) 必须导出），micro-app 靠「元素插入/移除」驱动加载/卸载，主应用只写一行标签
- 与 [wujie](../../wujie/) 的差别：wujie 的 <code v-pre>&lt;wujie&gt;</code> 真用 `shadowRoot` 承载 DOM；micro-app 的 <code v-pre>&lt;micro-app&gt;</code> 默认非 Shadow DOM，是「借标签、不借影子树」
- 本页只讲**标签与生命周期**；沙箱见 [with 沙箱](./with-sandbox)/[iframe 沙箱模式](./iframe-sandbox-mode)，隔离见 [元素与样式隔离](./element-style-isolation)，通信见 [数据通信](./data-communication)

## 一、边界：本页讲什么

本页聚焦 micro-app 的**容器元素本身**：<code v-pre>&lt;micro-app&gt;</code> 从哪来、有哪些属性、怎么当组件用、五个生命周期事件怎么接。至于「标签背后」的三件隔离——JS 沙箱、样式隔离、元素隔离——各有专页。先把「这是个真 HTML 标签」这件事吃透，后面的一切都挂在它上面。

## 二、<code v-pre>&lt;micro-app&gt;</code> 从哪来：customElements.define

WebComponent 标准由三块组成：**Custom Elements（自定义标签）+ Shadow DOM（影子树）+ HTML Templates**。micro-app 的路线是**只取第一块**——用 Custom Elements API 把 <code v-pre>&lt;micro-app&gt;</code> 注册成一个合法的自定义 HTML 元素：

```js
// micro-app 内部（简化示意）：注册 micro-app 自定义元素
class MicroAppElement extends HTMLElement {
  // 元素被插入文档：读取 name/url 属性 → 拉取并挂载子应用
  connectedCallback() {
    /* 加载子应用、派发 created/beforemount/mounted */
  }
  // 元素被移除：卸载子应用、派发 unmount
  disconnectedCallback() {
    /* 卸载、清理 */
  }
  // 监听 name/url 等属性变化，触发重载
  static get observedAttributes() {
    return ["name", "url"];
  }
}
window.customElements.define("micro-app", MicroAppElement);
```

`microApp.start()` 的作用之一就是完成这次 `define`。于是浏览器认识了 <code v-pre>&lt;micro-app&gt;</code> 标签，它的插入/移除/属性变化，天然映射到子应用的加载/卸载/重载——**这就是「组件化接入」的底层机制**。

> **关键澄清**：注册自定义元素 ≠ 使用 Shadow DOM。micro-app 默认把子应用 DOM 直接渲染在 <code v-pre>&lt;micro-app&gt;</code> 元素**内部**（Light DOM），并不套 `shadowRoot`。因此它的样式/元素隔离要另做（见 [元素与样式隔离](./element-style-isolation)），而不是白嫖 Shadow DOM 的天然隔离——这是它和 [wujie](../../wujie/) 最大的实现差异。`shadowDOM` 属性可选地启用真 Shadow DOM 做样式隔离，但非默认。

## 三、核心标签属性

<code v-pre>&lt;micro-app&gt;</code> 的能力几乎都通过**标签属性**开启。高频属性如下（完整表见 [参考](../reference)）：

| 属性 | 作用 | 默认 |
| --- | --- | --- |
| `name` | 子应用**唯一标识**，须字母开头、无特殊字符（连字符/下划线除外） | **必填** |
| `url` | 子应用地址，指向其 `index.html` | **必填** |
| `baseroute` | 设置子应用的**基础路由**（子应用路由 `base`），注入为 <code v-pre>__MICRO_APP_BASE_ROUTE__</code> | `''` |
| `iframe` | 开启 **iframe 沙箱**模式（默认是 with 沙箱） | `false` |
| `keep-alive` | 开启**保活**：卸载时不销毁、推入后台 | `false` |
| `ssr` | 开启 **SSR** 模式（子应用为服务端渲染时） | `false` |
| `inline` | 使用**内联 script**（便于断点调试） | `false` |
| `destroy` | 卸载时**删除缓存资源**（下次重新拉取） | `false` |
| `default-page` | 指定子应用初始渲染的页面路径 | `''` |
| `router-mode` | 虚拟路由模式：`search`/`native`/`native-scope`/`pure`/`state` | `search` |
| `disable-scopecss` | 关闭样式隔离（见 [元素与样式隔离](./element-style-isolation)） | `false` |
| `disable-sandbox` | 关闭 JS 沙箱（**不推荐**） | `false` |

属性既能写在标签上（单应用生效），也能传给 `microApp.start({...})`（全局默认）——后者用小驼峰或连字符 key（如 `disableScopecss` / `'disable-scopecss'`）。

## 四、组件化接入：当普通组件用

因为 <code v-pre>&lt;micro-app&gt;</code> 是真标签，它能无缝写进任何框架模板，**像用一个业务组件一样用子应用**：

```vue
<!-- Vue：动态 url、传 data、监听生命周期与错误 -->
<template>
  <micro-app
    name="app1"
    :url="url"
    :data="dataForChild"
    keep-alive
    @mounted="onMounted"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
const url = ref("http://localhost:3000/");
const dataForChild = ref({ userId: 1 }); // 下行数据，详见「数据通信」页
/** 子应用挂载完成回调 */
function onMounted(e: CustomEvent) {
  console.log("mounted", e.detail);
}
/** 子应用渲染终止型错误 */
function onError(e: CustomEvent) {
  console.error("micro-app error", e.detail);
}
</script>
```

对比 [single-spa](../../single-spa/)/[qiankun](../../qiankun/) 需要在 JS 里 `registerMicroApps([...])` 并做路由适配，micro-app 把「放哪、何时显示」交给**模板与框架的条件渲染/路由**——子应用出现在页面上的时机，就是 <code v-pre>&lt;micro-app&gt;</code> 元素出现在 DOM 上的时机。这是它「组件化」的直接体现。

## 五、生命周期事件

micro-app 的生命周期**不是让子应用导出函数**，而是**在 <code v-pre>&lt;micro-app&gt;</code> 元素上派发 DOM 事件**。标准流程五个：

| 事件 | 触发时机 | 典型用途 |
| --- | --- | --- |
| `created` | <code v-pre>&lt;micro-app&gt;</code> 元素初始化后、**加载资源前** | 打点、显示 loading |
| `beforemount` | 资源加载完成、**开始渲染前** | 注入初始数据、埋点 |
| `mounted` | 子应用**渲染结束** | 隐藏 loading、通知就绪 |
| `unmount` | 子应用**卸载时** | 清理主应用侧副作用 |
| `error` | 加载/渲染出错（**仅渲染终止型错误**） | 兜底 UI、上报 |

两种监听方式，按需选：

```js
// 方式一：直接在元素上 addEventListener（细粒度、单应用）
const el = document.querySelector("micro-app[name=app1]");
el.addEventListener("mounted", () => console.log("app1 已挂载"));
el.addEventListener("error", () => console.log("app1 出错"));
```

```js
// 方式二：全局 lifeCycles，统一监听所有子应用（回调收 e 与 appName）
import microApp from "@micro-zoe/micro-app";
microApp.start({
  lifeCycles: {
    created(e, appName) {},
    beforemount(e, appName) {},
    mounted(e, appName) {
      console.log(`${appName} 挂载完成`);
    },
    unmount(e, appName) {},
    error(e, appName) {},
  },
});
```

**keep-alive 场景的额外事件**：保活模式下应用不销毁、只在前后台切换，micro-app 另派发 `beforeshow`/`aftershow`/`afterhidden`，子应用侧统一从 `appstate-change` 事件里取状态：

```js
// 子应用：监听保活状态切换（进前台/离后台）
window.addEventListener("appstate-change", function (e) {
  if (e.detail.appState === "beforeshow") {
    console.log("即将重新展示（从后台回前台）");
  } else if (e.detail.appState === "aftershow") {
    console.log("已重新展示");
  } else if (e.detail.appState === "afterhidden") {
    console.log("已进入后台");
  }
});
```

## 六、「接入成本最低」到底省在哪

把 micro-app 和 [qiankun](../../qiankun/) 的接入责任并排列出来，就看清它省了什么：

| 责任项 | qiankun | **micro-app** |
| --- | --- | --- |
| 主应用注册子应用 | `registerMicroApps([...])` + `start()` | **一行 <code v-pre>&lt;micro-app&gt;</code> 标签** |
| 子应用导出生命周期 | **必须** `bootstrap/mount/unmount` | **默认不需要**（UMD 多实例才需） |
| 子应用打包格式 | 改成 **UMD** | 一般无需改打包格式 |
| 何时渲染子应用 | 路由匹配 + `activeRule` | **元素在不在 DOM 上** |
| 生命周期怎么接 | 子应用导出的函数 | **元素上的 DOM 事件** |

省下的正是「双端契约」——qiankun 要求主应用注册、子应用导出、约定 UMD；micro-app 把这套契约收敛成「**写标签 + 监听事件**」，子应用侧只剩 CORS 与 public-path 两件小事（见[入门·子应用改造清单](../getting-started)）。这就是官方敢说「只需一行代码」的底气，也是它在**快速试点、渐进接入**场景里最讨喜的原因。代价是：默认的 with 软沙箱隔离强度不及 iframe（见 [with 沙箱](./with-sandbox)），大型/强隔离诉求要另做权衡。

## 小结

<code v-pre>&lt;micro-app&gt;</code> 是 micro-app 用 `customElements.define` 注册的**真自定义元素**——它只借了 WebComponent 的 CustomElement「自定义标签」一层，默认不套 Shadow DOM，隔离另由三件事负责。标签属性开启能力（`name`/`url` 必填，`baseroute`/`iframe`/`keep-alive` 等按需），组件化接入让子应用「写进模板即用」，五个 DOM 生命周期事件（外加 keep-alive 的三个）让主应用无需子应用导出函数即可掌控全程——这正是「接入成本最低」的机制来源。标签讲完了，接下来看标签背后第一件隔离：默认的 [with 沙箱](./with-sandbox) 是怎么用 `Proxy` + `with` 把子应用的全局圈起来的。
