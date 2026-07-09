---
layout: doc
---

# wujie

wujie（无界）是腾讯开源的微前端框架，走的是一条和 [qiankun](../qiankun/)/[single-spa](../single-spa/) 都不同的**独特路线**。它的定位一句话说清：**wujie = iframe（跑子应用 JS，拿原生 `window`/`history`/`location` 做物理隔离）+ WebComponent（承载子应用 DOM 渲染）**。子应用的 JavaScript 被注入到一个**同域 iframe** 里执行——iframe 天然就是一个「原生 window 沙箱」，全局变量、`history`、`location` 全在 iframe 自己的上下文里，与主应用物理隔离，**不用 Proxy 代理 window、不用 with 改作用域链**，因此省掉了这类软沙箱的性能损耗；而子应用的 DOM 不渲染在 iframe 内，而是被渲染进一个自定义的 <code v-pre>&lt;wujie&gt;</code> WebComponent 元素（`shadowRoot`），靠代理 iframe 的 `document.querySelector` 等查询方法把「iframe 里的 JS」和「WebComponent 里的 DOM」桥接起来。这套「**JS 在 iframe、DOM 在 WebComponent**」的分工，让 wujie 拿到了微前端框架里**最强的隔离性**，同时**原生亲和 Vite/ESM**（ESM 交给浏览器在 iframe 里原生执行，绕开了 qiankun 2.x `import-html-entry` 不认 `type=module` 的痛点），还支持**保活**（keep-alive）与**预加载/预执行**实现子应用秒开秒切。代价也很实在：每个子应用一个 iframe 有**内存与启动开销**、同域约束、弹窗需处理 Shadow DOM 逃逸。2026-06 wujie 发布 **v2.0（全新空白同域 iframe 沙箱，支持浏览器前进后退）**并连发 4 版（v2.0.0 → v2.1.0）复活。沙箱、CSS 隔离、通信的**通论**已在[微前端核心机制](../mfe-mechanisms/)叶讲透，本叶只讲 wujie 的**具体实现与 API**。

## 概述

- **定位**：wujie 是**腾讯开源、iframe JS 沙箱 + WebComponent 容器**的微前端方案——子应用 JS 跑在同域 iframe（拿原生 `window`/`history`/`location`、物理隔离），子应用 DOM 渲染进 <code v-pre>&lt;wujie&gt;</code> WebComponent（`shadowRoot`、样式随 Shadow DOM 隔离），两者靠 `document` 代理桥接。
- **隔离最强 + Vite 原生友好**：iframe 是浏览器级的物理隔离（不像 Proxy 沙箱是「尽力而为的软隔离」），且 ESM 在 iframe 里由浏览器原生执行——**Vite/ESM 子应用零改造接入**，这正是 qiankun 2.x 的最大痛点。
- **组件化接入，无需注册**：主应用不必像 single-spa/qiankun 那样先 `registerMicroApps`——直接 `startApp({ name, url, el })` 或用 <code v-pre>&lt;WujieVue&gt;</code>/<code v-pre>&lt;WujieReact&gt;</code> 组件把子应用当普通组件用，支持**同屏多子应用并存**。
- **保活 + 预加载 = 秒开秒切**：`alive: true` 保活（子应用不销毁、切回瞬时恢复状态）、`preloadApp({ exec: true })` 预加载/预执行（空闲期 `requestIdleCallback` 拉资源、提前渲染），配合 `fiber` 分片执行避免阻塞主线程。
- **版本与选型**：**v1 线（2021~2023）** 沉寂多年后，**2026-06 发布 v2.0**（全新空白同域 iframe 沙箱、支持浏览器前进后退）并连发 4 版复活；甜区是**「复杂子应用 + 要最强隔离 + Vite 主力」**，代价是 iframe 开销、同域限制、弹窗 Shadow DOM 逃逸。

## 本叶地图

- [入门](./getting-started) —— wujie 解决什么、最小接入（`startApp` / <code v-pre>&lt;WujieVue&gt;</code>）、iframe+WC 双容器心智、与 qiankun 的路线差异
- [iframe JS 沙箱](./guide-line/iframe-sandbox) —— iframe 跑子应用 JS 的原理（原生 `window`/`history`/`location`、免 Proxy/with 损耗）、空白同域 iframe（v2.0 新沙箱）、降级策略、与 qiankun Proxy 沙箱对比
- [WebComponent 容器渲染](./guide-line/wc-rendering) —— 子应用 DOM 渲染进 <code v-pre>&lt;wujie&gt;</code>（`shadowRoot`）、iframe 与 WC 分工、`document` 代理桥接、事件系统修正、样式随 Shadow DOM 隔离
- [路由同步](./guide-line/route-sync) —— 劫持 iframe `history.pushState`/`replaceState`、同步子应用路由到主应用 query（`?子应用=路由`）、`prefix` 短路径、浏览器前进后退、`sync` 开关与单向同步
- [保活与预加载](./guide-line/keep-alive-preload) —— 保活/单例/重建三模式、`preloadApp` 预加载/预执行、`fiber` 分片、秒开原理与内存代价、`degrade` 降级
- [通信](./guide-line/communication) —— `props` 注入、去中心化 EventBus（`bus.$emit`/`$on`）、`window.parent` 直通、主子应用通信
- [v2.0 与现状](./guide-line/v2-status) —— v2.0 全新空白同域 iframe 沙箱（2026-06）、连发 4 版复活时间线、选型定位、与 [micro-app](../micro-app/) 的对比、局限
- [参考](./reference) —— 核心 API / iframe+WC 分工 / 保活模式 / 路由同步 / 通信 / 版本时间线六张表 + 权威链接

## 文档地址

- [wujie 官网文档](https://wujie-micro.github.io/doc/) —— 原理、快速开始、API、模式、常见问题一手总入口
- [Guide 指南](https://wujie-micro.github.io/doc/guide/) · [快速开始](https://wujie-micro.github.io/doc/guide/start.html) —— 原理、主/子应用接入、生命周期
- [API](https://wujie-micro.github.io/doc/api/startApp.html) · [Bus](https://wujie-micro.github.io/doc/api/bus.html) —— `startApp`/`preloadApp`/`destroyApp` 全部配置项与 EventBus 签名
- [模式](https://wujie-micro.github.io/doc/pattern/) · [常见问题](https://wujie-micro.github.io/doc/question/) —— 保活/单例/重建模式、CORS/字体/弹窗/事件等一手排障
- [GitHub: Tencent/wujie](https://github.com/Tencent/wujie) · [Releases](https://github.com/Tencent/wujie/releases) —— 源码与 v2.0 版本状态核对源

## 幻灯片地址

- <a href="/SlideStack/wujie-slide/" target="_blank">wujie 无界</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=wujie" target="_blank" rel="noopener noreferrer">wujie 测试题</a>
