---
layout: doc
outline: [2, 3]
---

# 入门：wujie 是什么与怎么接入

> 基于 wujie v2（2026-06 复活） · 核于 2026-07

## 速查

- wujie 是**腾讯开源的微前端框架**——一句话定位：**iframe（跑子应用 JS、拿原生 `window`/`history`/`location`）+ WebComponent（承载子应用 DOM 渲染）**
- **双容器心智**是理解 wujie 的钥匙：**JS 跑在同域 iframe**（物理隔离、免 Proxy/with 损耗），**DOM 渲染进 <code v-pre>&lt;wujie&gt;</code> WebComponent**（`shadowRoot`、样式随 Shadow DOM 隔离），靠代理 iframe `document` 查询把二者桥接
- **主应用接入极简**：`startApp({ name, url, el })` 一个命令式 API，或用 <code v-pre>&lt;WujieVue&gt;</code>/<code v-pre>&lt;WujieReact&gt;</code> 组件——**无需 `registerMicroApps` 注册**，直接把子应用当组件用，支持同屏多实例
- 子应用改造分模式：**保活（`alive: true`）/ 重建（默认）零改造**；**单例模式**才需导出 <code v-pre>window.__WUJIE_MOUNT</code>/<code v-pre>window.__WUJIE_UNMOUNT</code> 生命周期
- 子应用**必须开 CORS**：wujie 从主应用上下文 `fetch` 子应用 HTML 与静态资源，跨域资源要 `Access-Control-Allow-Origin`（带 cookie 时须指定具体源、不能用 `*`）
- 子应用用 <code v-pre>window.__POWERED_BY_WUJIE__</code> 判断自己是**独立运行**还是**被 wujie 嵌入**，据此切换渲染逻辑
- **Vite/ESM 原生友好**：ESM 在 iframe 里交浏览器原生执行，不像 qiankun 2.x 的 `import-html-entry` eval 模型接不了 `type=module`——这是选 wujie 的核心动机之一
- **组件化用法**：<code v-pre>&lt;WujieVue name url :props :sync :alive @事件&gt;</code>，`@event` 可直接监听子应用 `bus.$emit` 发的事件；`this.$refs.wujie.refresh()` 刷新
- 与 qiankun 的路线差异：qiankun 走 **HTML entry + Proxy 软沙箱**（省内存、隔离弱、ESM 难）；wujie 走 **iframe 物理沙箱 + WC 渲染**（隔离最强、Vite 友好、每应用一 iframe 有开销）
- **沙箱/样式/通信通论**（四代沙箱、四路 CSS 隔离、通信模式）见[微前端核心机制](../mfe-mechanisms/)，本叶只讲 wujie 的具体实现与 API
- 选型直觉：**复杂子应用 + 要最强隔离 + Vite 主力** → wujie；存量 webpack 要开箱 → [qiankun](../qiankun/)；要极致控制自建底座 → [single-spa](../single-spa/)
- 起步顺序：先读本页建立「iframe+WC 双容器」心智 → 再读 [iframe JS 沙箱](./guide-line/iframe-sandbox) 吃透隔离原理

## 一、wujie 解决什么问题

微前端的通用价值（技术栈无关、独立开发部署、增量升级、运行时隔离）不是 wujie 独有（判据见[微前端基础](../mfe-basics/)）。wujie 的独到之处，是它**用 iframe 拿隔离、用 WebComponent 拿渲染**，同时**回避了裸 iframe 的四大老毛病**：

| 裸 iframe 的老毛病 | wujie 怎么破 |
| --- | --- |
| 刷新/分享 URL 后**子应用路由丢失** | 劫持 iframe `history` 把子应用路由**同步到主应用 URL query**（[路由同步](./guide-line/route-sync)） |
| iframe 的 **DOM 被框死在框内**，弹窗无法覆盖全屏 | DOM 渲染进主应用容器里的 <code v-pre>&lt;wujie&gt;</code> WebComponent，**不受 iframe 边界约束**（[WC 渲染](./guide-line/wc-rendering)） |
| iframe 跨文档**通信繁琐** | 同域 iframe + 去中心化 EventBus + `window.parent` 直通（[通信](./guide-line/communication)） |
| 每次进入**白屏重建、慢** | **保活**（状态不销毁）+ **预加载/预执行**（空闲期提前拉资源渲染），实现秒开秒切（[保活与预加载](./guide-line/keep-alive-preload)） |

对比 [single-spa](../single-spa/)/[qiankun](../qiankun/) 这类「Proxy 软沙箱 + 路由编排」路线，wujie 的收益是官方总结的四条：**可同屏激活多个子应用**、**组件化无需路由适配**、**天然保活**、**执行性能不受 Proxy 代理上下文拖累**（子应用 JS 跑在 iframe 原生 window 里，不经代理）。

## 二、最小接入：主应用一步

wujie **不需要注册**——直接 `startApp` 就能把子应用挂到某个 DOM 节点：

```js
// 主应用：命令式接入，一个 startApp 搞定
import { startApp } from "wujie";

startApp({
  name: "app-vue", // 子应用唯一标识（同名共享同一实例）
  url: "//localhost:7100/", // 子应用地址（末尾 / 建议保留）
  el: "#sub-container", // 渲染容器：子应用 DOM 会进这个节点里的 wujie WebComponent
  sync: true, // 开启路由同步：子应用路由写回主应用 URL query
  // alive: true,             // 可选：保活模式，切走不销毁、切回秒恢复
  // props: { token: "abc" }, // 可选：注入给子应用的数据
});
```

若用 Vue，用 <code v-pre>&lt;WujieVue&gt;</code> 组件更顺手——**把子应用当普通组件用**：

```vue
<!-- 主应用：组件式接入（Vue 3 安装 wujie-vue3，Vue 2 安装 wujie-vue2） -->
<template>
  <!-- width/height 建议给满，避免子应用渲染尺寸异常 -->
  <WujieVue
    width="100%"
    height="100%"
    name="app-vue"
    :url="url"
    :sync="true"
    :props="{ token: 'abc' }"
    @routeChange="onRouteChange"
  />
  <!-- @event 可直接监听子应用 bus.$emit 发出的事件 -->
</template>

<script setup lang="ts">
import WujieVue from "wujie-vue3";
// WujieVue 上还挂了 bus / setupApp / preloadApp / destroyApp / refreshApp / clearAssetsCache
const { bus } = WujieVue;
const url = "//localhost:7100/";
/** 处理子应用广播的路由变化 */
function onRouteChange(payload: unknown) {
  console.log("子应用路由变了", payload);
}
</script>
```

> <code v-pre>&lt;WujieVue&gt;</code> 内部渲染出的正是那个 <code v-pre>&lt;wujie&gt;</code> 自定义元素（WebComponent），子应用的 DOM 就挂在它的 `shadowRoot` 里。命令式 `startApp` 与组件式 <code v-pre>&lt;WujieVue&gt;</code> 底层是同一套内核，配置项一一对应（详见[参考·核心 API 表](./reference)）。

## 三、双容器心智：JS 在 iframe、DOM 在 WebComponent

这是 wujie 与所有 Proxy 沙箱框架**最本质的区别**，务必先建立这张图：

```text
主应用页面
├─ <iframe>（同域、不可见）        ← 子应用的 JS 在这里跑
│    └─ 原生 window / history / location（物理隔离，不经 Proxy）
│
└─ #sub-container
     └─ wujie（WebComponent）      ← 子应用的 DOM 渲染在这里
          └─ shadowRoot             ← 样式随 Shadow DOM 天然隔离
               └─ 子应用真实 DOM 树

     ⇅ document 代理桥接：iframe 里的 querySelector/getElementById
       被代理到 wujie 的 shadowRoot，让「iframe 的 JS」操作「WC 的 DOM」
```

- **iframe 负责隔离**：子应用所有 JS 都在这个同域 iframe 的 window 上下文里执行，全局变量、定时器、`history`、`location` 全是 iframe 原生的，天然不污染主应用——这是**物理隔离**，比 Proxy「假 window」强得多（原理见 [iframe JS 沙箱](./guide-line/iframe-sandbox)）。
- **WebComponent 负责渲染**：子应用的 DOM 不在 iframe 里（否则就被框死了），而是渲染进主应用里的 <code v-pre>&lt;wujie&gt;</code> 元素的 `shadowRoot`，因此弹窗能覆盖全屏、样式随 Shadow DOM 隔离（原理见 [WC 渲染](./guide-line/wc-rendering)）。
- **桥接靠 document 代理**：wujie 代理 iframe 的 `document.querySelector`/`getElementById`/`getElementsByClassName`、`body`/`head` 等，把它们指向 <code v-pre>&lt;wujie&gt;</code> 容器——于是子应用「以为」自己在正常操作 document，实际操作的是 WebComponent 里的 DOM。

## 四、子应用改造清单：按模式而定

wujie 的一大卖点是**低侵入**——改造多少取决于用哪种[运行模式](./guide-line/keep-alive-preload)：

| 模式 | 配置 | 子应用是否要改造 |
| --- | --- | --- |
| **重建**（默认） | 不配 `alive`、不写生命周期 | **零改造**（每次切换销毁 iframe+WC 重建） |
| **保活** | `alive: true` | **零改造**（渲染一次、切换不销毁，状态全留） |
| **单例** | `alive: false` + 写生命周期 | 需导出 <code v-pre>window.__WUJIE_MOUNT</code>/<code v-pre>window.__WUJIE_UNMOUNT</code> |

**单例模式**才需要子应用配合（对齐类似 qiankun 的生命周期契约）：

```js
// 子应用入口：仅「单例模式」需要——被 wujie 嵌入时挂载/卸载钩子
if (window.__POWERED_BY_WUJIE__) {
  // 被 wujie 嵌入：把渲染/销毁交给 wujie 的生命周期
  window.__WUJIE_MOUNT = () => {
    // 每次进入子应用：创建路由 + 应用实例并挂载
    render();
  };
  window.__WUJIE_UNMOUNT = () => {
    // 每次离开子应用：销毁实例、清理副作用
    instance.unmount();
  };
} else {
  // 独立运行：正常自渲染
  render();
}
```

两条硬约束对所有模式都成立：

1. **开 CORS**：wujie 从主应用上下文 `fetch` 子应用 HTML 与静态资源，子应用服务器必须放开 `Access-Control-Allow-Origin`（携带 cookie 时要指定**具体源**、不能 `*`，并配 `Access-Control-Allow-Credentials`）。
2. **判别运行环境**：子应用用 <code v-pre>window.__POWERED_BY_WUJIE__</code> 区分「独立跑」还是「被嵌入」，切换路由 `base`、挂载目标等。

> Vue/React 子应用与 wujie 生命周期的具体拼接（`createApp`、`ReactDOM.createRoot` 与钩子的对接）在 UI 框架章有实操，本叶不复述——见 [Vue 其他生态·微前端接入](/zh/frontend-framework/ui/vue/guide-line/other)。

## 五、与 qiankun 的路线差异

wujie 和 [qiankun](../qiankun/) 都能做微前端，但**内核路线完全不同**——一句话：**qiankun 靠软件模拟隔离，wujie 靠浏览器物理隔离**。

| 维度 | qiankun | wujie |
| --- | --- | --- |
| **JS 沙箱** | Proxy 代理 `window`（软隔离，防意外不防恶意） | **iframe 原生 window**（物理隔离，最强） |
| **DOM 渲染** | 直接进主应用容器 / Shadow DOM | **<code v-pre>&lt;wujie&gt;</code> WebComponent + `shadowRoot`** |
| **子应用接入** | 注册 `registerMicroApps` + 导出 `bootstrap/mount/unmount` + UMD | **`startApp`/组件**，重建/保活模式零改造 |
| **Vite/ESM** | 2.x 不认 `type=module`，需社区插件（沙箱失效） | **原生友好**（ESM 交 iframe 浏览器执行） |
| **保活** | 无（`loadMicroApp` 多实例但不保活） | **原生 `alive: true` 保活** |
| **多实例同屏** | 需 `singular: false` | **天然支持** |
| **代价** | 隔离弱、ESM 难 | **每应用一 iframe 有内存/启动开销、同域限制** |

选型不是「谁更好」，是「谁更配你的场景」：**存量 webpack + 要开箱即用** → qiankun；**复杂子应用 + 要最强隔离 + Vite 主力** → wujie（完整选型见 [v2.0 与现状](./guide-line/v2-status)）。二者对比在本叶点到为止，qiankun 的沙箱/样式细节不在本叶重复（见 [qiankun 叶](../qiankun/)）。

## 小结

wujie 用「**iframe 跑 JS、WebComponent 渲 DOM**」的双容器路线，拿到了微前端里最强的隔离与最好的 Vite 亲和：主应用 `startApp` 或 <code v-pre>&lt;WujieVue&gt;</code> 一步接入，重建/保活模式子应用零改造，单例模式才需生命周期钩子，所有模式都要开 CORS。理解了「JS 在 iframe、DOM 在 WC」这张图，下一步是吃透隔离的物理原理——iframe 凭什么能拿原生 window、v2.0 的空白同域 iframe 沙箱新在哪：从 [iframe JS 沙箱](./guide-line/iframe-sandbox) 开始。
