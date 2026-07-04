---
layout: doc
---

# micro-app

micro-app（`@micro-zoe/micro-app`）是**京东开源**（jd-opensource，前身 micro-zoe）的微前端框架，官方自我定位是「**一款简约、高效、功能强大的微前端框架**」。它最鲜明的路线，是**借鉴 WebComponent 的 CustomElement 思想**：用浏览器原生的 `window.customElements.define` 把整套微前端能力**包装成一个 <code v-pre>&lt;micro-app&gt;</code> HTML 标签**——主应用只要写 `micro-app name='x' url='...'/micro-app` 这**一行标签**，就能像用普通 HTML 元素/框架组件一样把子应用嵌进页面，因此它把自己标榜为**接入成本全场最低**的微前端方案（官方语「只需一行代码，实现微前端，如此简单」「无关技术栈，任何框架皆可使用」）。要澄清的是：它是**类 WebComponent（webcomponent-like）**——只借用了 CustomElement「自定义标签」这一层，**默认并不用 Shadow DOM 做隔离**，而是靠**样式隔离（scopedcss 前缀改写）+ 元素隔离（DOM 作用域）+ JS 沙箱**三件事各自实现隔离。JS 沙箱默认是 **with 沙箱**（`Proxy` 拦截 + `with` 改作用域链，思路近 qiankun 的 proxySandbox 但叠了 `with`），**1.0 起新增 iframe 沙箱**作为可选强隔离模式（`iframe` 属性开启）。此外它自带**虚拟路由系统**（拦截浏览器路由、给子应用一套隔离的 `location`/`history`，5 种 `router-mode`）、**数据通信**、**预加载**、**keep-alive 保活**、**UMD/插件系统**等能力，并**原生亲和 Vite/ESM**。版本上它长期停留在 **1.0.0-rc**（2021-06 建库、至今 rc.x 持续发版），是「持续活跃但 1.0 长期 RC」的典型。沙箱、CSS 隔离、通信的**通论**已在[微前端核心机制](../mfe-mechanisms/)叶讲透，本叶只讲 micro-app 的**具体实现与 API**。

## 概述

- **定位**：micro-app 是**京东开源、类 WebComponent（CustomElement）容器**的微前端方案——把微前端封装成 <code v-pre>&lt;micro-app&gt;</code> 自定义标签，主应用一行标签即可接入，从「**组件化思想**」使用子应用，接入成本在同类框架里最低。
- **CustomElement ≠ Shadow DOM**：它用 `customElements.define` 定义 <code v-pre>&lt;micro-app&gt;</code> 标签（这是「类 WebComponent」的含义），但**默认不启用 Shadow DOM**；隔离靠**元素隔离 + scopedcss 样式隔离 + JS 沙箱**三者分工，`shadowDOM` 只是可选的样式隔离增强。
- **双沙箱模式**：默认 **with 沙箱**（`Proxy` + `with` 造相对独立的 `window`/`document`，全局变量隔离、性能好、兼容广）；**1.0 起提供 iframe 沙箱**（`iframe` 属性开启，隔离更强、兼容代价更大），二者按场景取舍。
- **能力齐全**：虚拟路由系统（5 种 `router-mode`、`microApp.router` 编排）、数据通信（`data`/`setData`/`dispatch`/全局数据）、预加载、keep-alive 保活、资源地址补全、UMD/插件系统，且**原生友好 Vite/ESM**。
- **版本与选型**：**1.0 长期 RC**（当前 `1.0.0-rc.32`，rc.x 持续发版），京东生态背书、约 6.2k star；甜区是**「要最低接入成本 + 组件化用法 + Vite 主力」**，代价是 1.0 未正式发布的心理门槛、默认软沙箱隔离不及 iframe、主应用样式仍会下渗子应用。

## 本叶地图

- [入门](./getting-started) —— micro-app 解决什么、最小接入（<code v-pre>&lt;micro-app name url&gt;</code> 一行标签）、CustomElement 容器心智、与 qiankun/wujie 的接入成本对比
- [CustomElement 容器](./guide-line/custom-element) —— 借 WebComponent 的 CustomElement 定义 <code v-pre>&lt;micro-app&gt;</code> 标签、`name`/`url`/`baseroute` 等属性、组件化接入、生命周期事件（created/beforemount/mounted/unmount/error）
- [with 沙箱（默认）](./guide-line/with-sandbox) —— 默认 `Proxy` + `with` 沙箱、元素隔离、全局变量隔离、`__MICRO_APP_*__` 环境变量、顶层变量不挂 window 等常见坑
- [iframe 沙箱模式](./guide-line/iframe-sandbox-mode) —— 1.0 起可选 iframe 沙箱（`iframe` 属性）、与 with 沙箱的取舍、`iframeSrc`/`window.stop()` 初始化坑、何时选 iframe
- [元素与样式隔离](./guide-line/element-style-isolation) —— 元素隔离（DOM 作用域、`removeDomScope`）、样式隔离（scopedcss 前缀改写、`disableScopecss`、`shadowDOM`）、与主应用样式冲突处理
- [数据通信](./guide-line/data-communication) —— `data`/`setData` 下行、`dispatch` 上行、`setGlobalData`/`getGlobalData` 全局数据、`EventCenterForMicroApp`、与虚拟路由的关系
- [1.0 RC 与现状](./guide-line/rc-status) —— 1.0 长期 RC 时间线（rc.x 持续发版）、京东生态背书、虚拟路由系统、ESM/Vite 友好、选型定位、与 wujie 对比、局限
- [参考](./reference) —— 核心属性/API、双沙箱对比、生命周期事件、样式隔离方案、数据通信、版本状态七张表 + 权威链接

## 文档地址

- [micro-app 官网](https://jd-opensource.github.io/micro-app/) —— 定位、特性、在线演示总入口
- [快速开始](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/start) · [配置项](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/configure) —— 主/子应用接入、<code v-pre>&lt;micro-app&gt;</code> 全部属性与全局配置
- [沙箱](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/sandbox) · [数据通信](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/data) · [虚拟路由](https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/router) —— with/iframe 双沙箱、通信 API、`router-mode` 一手说明
- [GitHub: jd-opensource/micro-app](https://github.com/jd-opensource/micro-app) · [Releases](https://github.com/jd-opensource/micro-app/releases) —— 源码与 1.0 RC 版本状态核对源

## 幻灯片地址

- <a href="/SlideStack/micro-app-slide/" target="_blank">micro-app</a>
