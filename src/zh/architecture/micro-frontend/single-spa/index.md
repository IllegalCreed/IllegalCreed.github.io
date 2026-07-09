---
layout: doc
---

# single-spa

single-spa 是微前端框架里的**生命周期编排层鼻祖**——用官方自己的话说，它是「浏览器里的微服务」调度器。它只做一件极窄的事：在浏览器里按当前 URL 判定哪些子应用该活、哪些该走，然后调用它们导出的 `bootstrap`/`mount`/`unmount` 把应用**装上或卸下**。它**不提供 JS 沙箱、不提供样式隔离**——这些是 qiankun 在它之上补出来的。single-spa 只定义三样东西：一套**生命周期协议**（每个钩子返回 Promise、一台 11 态状态机）、一个 **activity function**（`location => boolean` 决定何时激活）、一个**「最薄」root config**（官方原话 root config「exists only to start up」）。现代推荐架构已经是**原生 ESM + import maps**，SystemJS 退居历史 polyfill。稳定版停在 **v6.0.3（2024-09）**，v7 长期卡在 beta（`7.0.0-beta.13` 后 2025-09 停更）。读懂它就读懂了国内主流微前端方案的底座——**qiankun ≈ single-spa + 沙箱 + 样式隔离 + HTML entry**。机制通论（沙箱/样式/通信/依赖共享）见兄弟叶[微前端核心机制](../mfe-mechanisms/)，定义与判据见[微前端基础](../mfe-basics/)。

## 概述

- **定位**：single-spa 是微前端的**生命周期编排与路由分发层**，只负责按路由把子应用 mount/unmount，是「浏览器里的微服务」——不管隔离、不管加载资源清单，是 qiankun/乾坤系方案的**底座**。
- **三种模块类型**：**application**（有生命周期、按路由声明式激活）、**parcel**（手动挂载的框架无关 UI 片段，single-spa 版「Web Components」）、**utility module**（共享逻辑如鉴权/请求，直接 `import`、非路由激活）。
- **两根支柱**：**生命周期协议**（`bootstrap`/`mount`/`unmount` + parcel 的 `update`，各返回 Promise，走 `NOT_LOADED → … → MOUNTED` 状态机）+ **root config**（`registerApplication` + activity function + `start()`，官方定位「最薄」）。
- **只编排、不隔离**：single-spa 本身**不处理**全局污染与样式互踩——多应用同页要么自己补沙箱/样式隔离、要么改用 qiankun 封装；现代架构走**原生 ESM + import maps**（import-map-overrides 本地覆盖、import-map-deployer 部署），SystemJS 是兼容 polyfill。
- **版本与选型**：v6.0.3 稳定、v7 长期 beta（2025-09 后停更）；2026 年它是「要**极致控制**或**自建底座**、团队愿意自理沙箱」时的选择，多数团队直接用它的封装（qiankun）。

## 本叶地图

- [入门](./getting-started) —— single-spa 解决什么、最小 root config 心智、它与 qiankun 的底座关系、直接用它 vs 用封装
- [三种模块类型](./guide-line/three-types) —— application / parcel / utility module 的用途、API 风格与选择
- [生命周期协议](./guide-line/lifecycle-protocol) —— bootstrap/mount/unmount/update、11 态状态机、超时配置、错误处理与 unload
- [root config 与注册](./guide-line/root-config) —— registerApplication、activity function、start()、「exists only to start up」哲学
- [import maps 工作流](./guide-line/import-maps-workflow) —— 原生 ESM + import maps、SystemJS 历史 polyfill、overrides 本地开发、deployer 部署、externals 共享
- [框架适配器](./guide-line/framework-adapters) —— single-spa-vue/react/angular 把组件包成生命周期、各适配器关键参数、Native Federation 一句带过
- [现状与定位](./guide-line/status-positioning) —— v6 稳定 / v7 卡 beta、作为 qiankun 底座的意义、直接用 vs 用 qiankun 的判据、2026 选型位置
- [参考](./reference) —— 三类型 / 状态机 / registerApplication 参数 / import maps / 适配器 / 版本状态六张表 + 权威链接

## 文档地址

- [single-spa 官网](https://single-spa.js.org/) —— 概念、API、生态、推荐架构一手文档
- [Getting Started / Overview](https://single-spa.js.org/docs/getting-started-overview/) —— 起源（Canopy）、三大收益、三核心概念
- [Microfrontends Concept](https://single-spa.js.org/docs/microfrontends-concept/) —— 「浏览器里的微服务」定义、5kb 编排器定位
- [Configuration / API](https://single-spa.js.org/docs/configuration/) · [API](https://single-spa.js.org/docs/api/) —— registerApplication、生命周期、状态机、事件
- [Recommended Setup](https://single-spa.js.org/docs/recommended-setup/) —— import maps + SystemJS、overrides/deployer、externals 共享
- [Ecosystem](https://single-spa.js.org/docs/ecosystem/) —— single-spa-vue/react/angular 等适配器与工具
- [GitHub Releases](https://github.com/single-spa/single-spa/releases) —— v6.0.3 稳定 / v7 beta 版本核对源

## 幻灯片地址

- <a href="/SlideStack/single-spa-slide/" target="_blank">single-spa</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=single-spa" target="_blank" rel="noopener noreferrer">single-spa 测试题</a>
