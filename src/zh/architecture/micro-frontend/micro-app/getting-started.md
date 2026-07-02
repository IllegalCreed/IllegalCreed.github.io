---
layout: doc
outline: [2, 3]
---

# 入门：micro-app 是什么与怎么接入

> 基于 micro-app 1.0（RC） · 核于 2026-07

## 速查

- micro-app 是**京东开源的微前端框架**——一句话定位：**借 WebComponent 的 CustomElement 思想，把微前端封装成 `<micro-app>` 自定义 HTML 标签**，主应用一行标签接入
- **最小接入两步**：主应用 `microApp.start()` 一次 → 模板里写 `<micro-app name='x' url='...'></micro-app>`；官方语「只需一行代码，实现微前端」
- **接入成本全场最低**：不像 [single-spa](../single-spa/)/[qiankun](../qiankun/) 要 `registerMicroApps` 注册 + 子应用导出 `bootstrap/mount/unmount`——micro-app 把子应用当**普通标签/组件**用，无需注册、无需在子应用写生命周期函数
- **类 WebComponent ≠ Shadow DOM**：只用 `customElements.define` 定义 `<micro-app>` 标签这一层，**默认不开 Shadow DOM**，隔离靠**元素隔离 + scopedcss 样式隔离 + JS 沙箱**三件事
- 子应用改造极轻：主要是**开 CORS** + 配 <code v-pre>__webpack_public_path__</code>（用注入的 <code v-pre>window.__MICRO_APP_PUBLIC_PATH__</code>）；用 <code v-pre>window.__MICRO_APP_ENVIRONMENT__</code> 判断是否被 micro-app 嵌入
- 安装：`npm i @micro-zoe/micro-app --save`；浏览器要求**除 IE 外全支持**，依赖 **CustomElements（可 polyfill）+ Proxy（必须原生）**
- **默认 with 沙箱**（`Proxy` + `with`），**1.0 起可选 iframe 沙箱**（`iframe` 属性）——见 [with 沙箱](./guide-line/with-sandbox) / [iframe 沙箱模式](./guide-line/iframe-sandbox-mode)
- 自带**虚拟路由系统**（子应用一套隔离 `location`/`history`，5 种 `router-mode`）、**数据通信**、**预加载**、**keep-alive 保活**——通信见 [数据通信](./guide-line/data-communication)
- **Vite/ESM 原生友好**，与 [wujie](../wujie/) 同属「组件化 + Vite 友好」阵营，但 wujie 靠 iframe 物理隔离、micro-app 默认靠 with 软沙箱
- **沙箱/样式/通信通论**（四代沙箱、四路 CSS 隔离、通信模式）见[微前端核心机制](../mfe-mechanisms/)，本叶只讲 micro-app 的具体实现与 API
- 选型直觉：**要最低接入成本 + 组件化用法 + 快速试点** → micro-app；要最强隔离 → [wujie](../wujie/)；存量 webpack 生态最大 → [qiankun](../qiankun/)
- 起步顺序：先读本页建立「`<micro-app>` 标签容器」心智 → 再读 [CustomElement 容器](./guide-line/custom-element) 吃透标签属性与生命周期

## 一、micro-app 解决什么问题

微前端的通用价值（技术栈无关、独立开发部署、增量升级、运行时隔离）不是 micro-app 独有（判据见[微前端基础](../mfe-basics/)）。micro-app 的独到之处，是它把**接入这件事做到了极致的轻**——用一个标签解决「加载子应用」，让微前端的心智负担接近于「用一个 iframe，但没有 iframe 的那些毛病」：

| 传统方案的痛点 | micro-app 怎么破 |
| --- | --- |
| single-spa/qiankun 要 **`registerMicroApps` 注册 + 路由适配** | 直接写 `<micro-app>` 标签，**无需注册**、放到哪渲染到哪 |
| 子应用要导出 **`bootstrap/mount/unmount` 生命周期** + 改打包为 UMD | 子应用**基本零生命周期改造**（只需 CORS + public-path），micro-app 接管加载/卸载 |
| iframe 隔离强但**路由丢失、弹窗被框死、通信繁琐** | 用 `<micro-app>` 自定义标签 + **虚拟路由系统** + 数据通信，规避 iframe 老毛病 |
| qiankun 2.x **接不了 Vite/ESM 子应用** | **原生友好 Vite/ESM**，Vite 子应用零沙箱插件即可接入 |

一句话：micro-app 把「嵌一个子应用」的成本压到**一行 HTML 标签**，这是它对比同类框架最直接的卖点。

## 二、最小接入：主应用一行标签

**第一步**，主应用安装并启动（全局只需一次）：

```js
// 主应用入口：安装 npm i @micro-zoe/micro-app --save
import microApp from "@micro-zoe/micro-app";

// 启动 micro-app，全局注册 <micro-app> 自定义标签；可传全局配置
microApp.start();
```

**第二步**，在任意需要子应用的位置，写一行 `<micro-app>` 标签：

```html
<!-- name：子应用唯一标识（须字母开头）；url：子应用 index.html 地址 -->
<micro-app name="my-app" url="http://localhost:3000/"></micro-app>
```

就这样——子应用会被拉取、在 `<micro-app>` 元素内渲染、随元素卸载而卸载。因为 `<micro-app>` 是一个**真正的自定义 HTML 元素**，它天然能写进任何框架的模板，当成普通组件用：

```vue
<!-- 主应用（Vue）：<micro-app> 就是个标签，:url 动态绑定、data 传数据、@事件 监听生命周期 -->
<template>
  <micro-app
    name="my-app"
    :url="url"
    :data="dataForChild"
    @created="onCreated"
    @mounted="onMounted"
    @unmount="onUnmount"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
const url = "http://localhost:3000/";
const dataForChild = ref({ token: "abc" }); // 下行数据（见「数据通信」页）
/** 子应用渲染完成 */
function onMounted() {
  console.log("子应用已挂载");
}
function onCreated() {}
function onUnmount() {}
</script>
```

> React 里写 `<micro-app name="my-app" url={url} data={dataForChild} />` 同理（JSX 属性用单花括号绑定，注意 `data` 只接受对象）。命令式加载、预渲染等进阶用法见[官方文档](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/start)。

## 三、CustomElement 容器心智

理解 micro-app 的钥匙是这句话：**`<micro-app>` 是一个用 CustomElement 定义出来的真标签，它是子应用的「容器元素」**。

```text
主应用 DOM 树
└─ <micro-app name="my-app" url="...">   ← customElements.define 定义的自定义元素
     └─ 子应用真实 DOM 树               ← 直接渲染在这个元素内部（默认非 Shadow DOM）
          · 元素隔离：子应用 querySelector 只能查到自己这棵树
          · 样式隔离：子应用 CSS 被改写为 micro-app[name=my-app] 前缀
          · JS 沙箱：子应用脚本跑在 with(proxyWindow){…} 里，全局互不污染
```

三个要点，务必先建立：

- **它是标签，不是配置**：`<micro-app>` 由 `customElements.define('micro-app', …)` 注册（所以运行环境必须支持 CustomElements——这是「类 WebComponent」的字面含义）。你把它写进模板的哪里，子应用就渲染在哪里，生命周期跟着元素的插入/移除走。
- **默认不是 Shadow DOM**：micro-app **只借用了 CustomElement「自定义标签」这一层**，子应用 DOM 默认直接挂在 `<micro-app>` 元素内（非 shadowRoot）。隔离由**元素隔离 + scopedcss + JS 沙箱**三件事分别负责（详见 [元素与样式隔离](./guide-line/element-style-isolation)），`shadowDOM` 属性是可选增强。这与 [wujie](../wujie/) 真的把 DOM 塞进 `shadowRoot` 不同。
- **生命周期是 DOM 事件**：`created`/`beforemount`/`mounted`/`unmount`/`error` 五个事件挂在 `<micro-app>` 元素上，用 `addEventListener` 或框架的 `@事件` 监听——**不需要子应用导出任何函数**（详见 [CustomElement 容器](./guide-line/custom-element)）。

## 四、子应用改造清单：几乎只有两件事

micro-app 的最大卖点是**低侵入**——子应用要做的核心就两件事：

**① 开 CORS**。micro-app 从主应用上下文用 `fetch` 拉子应用的 HTML 与静态资源，跨域时子应用服务器要放开跨域头（webpack/vite/nginx/nodejs 都是配 `Access-Control-Allow-Origin`）：

```js
// 子应用 webpack devServer（vite 用 server.cors、nginx 配 add_header 同理）
devServer: {
  headers: { "Access-Control-Allow-Origin": "*" },
}
```

**② 配 public-path**，让子应用静态资源按绝对地址加载。micro-app 会向子应用注入一批全局变量，其中 <code v-pre>window.__MICRO_APP_PUBLIC_PATH__</code> 就是给 webpack 用的：

```js
// 子应用 src/public-path.js —— __MICRO_APP_* 是 micro-app 注入的全局变量
if (window.__MICRO_APP_ENVIRONMENT__) {
  // 被 micro-app 嵌入时，改写 webpack 运行时 publicPath
  __webpack_public_path__ = window.__MICRO_APP_PUBLIC_PATH__;
}
```

```js
// 子应用入口第一行（必须最顶部）引入
import "./public-path";
```

其余按需：用 <code v-pre>window.__MICRO_APP_ENVIRONMENT__</code> 判断「独立运行 / 被嵌入」以切换渲染逻辑；用虚拟路由时把路由 `base` 设为 <code v-pre>window.__MICRO_APP_BASE_ROUTE__</code>（见 [数据通信](./guide-line/data-communication) 与官方[虚拟路由](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/router)）。**注意**：micro-app 默认**不要求**子应用导出 `mount/unmount`——只有 UMD 多实例等进阶场景才需要（对比 qiankun 是必须导出）。

> Vue/React 子应用与 micro-app 的拼接实操（路由 base、`unmount` 钩子）在 UI 框架章有实操，本叶不复述——见 [Vue 其他生态·微前端接入](/zh/frontend-framework/ui/vue/guide-line/other)。

## 五、与 qiankun / wujie 的接入成本对比

三者都能做微前端，但**接入这一步的成本差异明显**——micro-app 的核心竞争力正在这里：

| 维度 | [qiankun](../qiankun/) | [wujie](../wujie/) | **micro-app** |
| --- | --- | --- | --- |
| **主应用接入** | `registerMicroApps` 注册 + `start()` | `startApp()` / `<WujieVue>` | **`<micro-app>` 标签**（一行） |
| **子应用改造** | 必须导出 `bootstrap/mount/unmount` + 改 UMD | 重建/保活零改造、单例才写生命周期 | **基本零生命周期**（CORS + public-path） |
| **容器形态** | JS 编排，无专用标签 | `<wujie>` WebComponent（`shadowRoot`） | **`<micro-app>` CustomElement**（默认非 Shadow DOM） |
| **JS 沙箱** | Proxy 三沙箱（软隔离） | iframe 原生 window（物理隔离） | **with 沙箱**（默认软）/ **iframe 沙箱**（1.0 可选） |
| **Vite/ESM** | 2.x 接不了 `type=module` | 原生友好 | **原生友好** |
| **接入成本** | 高（注册 + 双端改造） | 低（组件化） | **最低（一行标签）** |

选型不是「谁更好」，是「谁更配你的场景」：**要最低接入成本、组件化用法、快速试点** → micro-app；**要最强隔离、复杂子应用** → wujie；**存量 webpack、生态最大** → qiankun。三者对比在本叶点到为止，qiankun/wujie 的沙箱细节不在本叶重复（见各自叶）。

## 小结

micro-app 用「**把微前端封装成 `<micro-app>` 自定义标签**」的 CustomElement 路线，把接入成本压到全场最低：主应用 `microApp.start()` 一次 + 一行 `<micro-app name url>` 标签，子应用基本只需开 CORS 与配 public-path，无需像 qiankun 那样导出生命周期。理解了「`<micro-app>` 是个真标签、是子应用容器元素」这张图，下一步是吃透这个标签本身——它有哪些属性、五个生命周期事件怎么用、组件化到底怎么落地：从 [CustomElement 容器](./guide-line/custom-element) 开始。
