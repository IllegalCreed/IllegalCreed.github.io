---
layout: doc
---

# 微前端核心机制

把 qiankun、wujie、micro-app、Module Federation 摆到一起看，会发现它们回答的其实是同一组问题：子应用的 JS 怎么互不污染（**沙箱**）、样式怎么互不覆盖（**样式隔离**）、拆开的应用怎么协作（**通信**）、公共依赖怎么不重复下载（**依赖共享**）、拆分之后的性能账怎么算（**加载与预加载**）。本叶做的就是这件事——**框架无关的四大机制通论**：每条机制讲清问题面、主流实现路线，以及每条路线「为什么这样设计、坏起来什么样」。框架只作为路线代表出场：qiankun 代表 Proxy 沙箱与 HTML entry、wujie 代表 iframe 沙箱、micro-app 代表 with 沙箱与 CustomElement 容器、Module Federation 代表运行时依赖共享。读懂这一叶，后面五个框架叶（[single-spa](../single-spa/) / [qiankun](../qiankun/) / [wujie](../wujie/) / [micro-app](../micro-app/) / [Module Federation](../module-federation/)）就只剩「它选了哪条路线、补了哪些细节」。微前端的定义、判据与组合模式见兄弟叶[微前端基础](../mfe-basics/)。

## 概述

- **JS 沙箱**是隔离的第一半：从快照沙箱（mount/unmount diff `window`、只能单实例）→ Proxy 沙箱（fakeWindow 代理、多实例并存）→ with + Proxy（作用域链第一站拦截，micro-app 默认）→ iframe 沙箱（wujie 路线，原生 `window`/`history` 物理隔离），一代比一代隔离更彻底；**ShadowRealm**（TC39 Stage 2.7）是语言层标准沙箱的前瞻，尚无生产可用实现。
- **CSS 隔离**是隔离的另一半，四条路线各有盲区：Shadow DOM 双向隔离但救不了挂 `body` 的弹窗；属性前缀改写（qiankun `experimentalStyleIsolation` 型）不支持 `@keyframes`/`@font-face`；动态样式表劫持只管「子应用之间」，主应用样式需自治；命名约定（BEM / CSS Modules）是唯一零运行时成本的方案。
- **通信**五模式按耦合从低到高排：URL 即通信、CustomEvent 上行、props 下行、发布订阅/全局状态、utility module 直接 import；跨域 iframe 场景的唯一通道是 **postMessage**——`targetOrigin` 明确指定与接收端 `origin` 校验是安全底线。
- **依赖共享**三路线：externals + **import maps**（浏览器原生，Baseline Widely available，2023-03 起）、**Module Federation shared**（运行时 semver 版本协商，singleton 冲突时最高版本获胜）、以及「什么都不共享」——Fowler 实测立场：独立编译天然自带按页 code-split，未必更慢。
- **加载与性能**贯穿以上四者：HTML entry 把子应用 HTML 当资源清单（import-html-entry 三 API）；预加载有 qiankun `prefetch` 四形态、wujie 预执行 + keep-alive 秒开两派；代价清单 = 重复运行时下载、公共依赖抽取导致构建耦合回潮、请求瀑布（MF 2.0 公告点名的固有问题）。

## 本叶地图

- [入门](./getting-started) —— 四大机制全景：隔离两件套 + 协作两件套 + 加载与性能，机制与框架的映射表
- [JS 沙箱谱系](./guide-line/js-sandbox) —— 快照 / Proxy / with + Proxy / iframe 四代路线、逃逸面与对比表、ShadowRealm 前瞻
- [CSS 隔离](./guide-line/css-isolation) —— Shadow DOM 的穿透边界与弹窗逃逸、属性改写的 at-rule 盲区、样式表劫持、命名约定
- [HTML entry 与资源加载](./guide-line/html-entry-loading) —— JS entry vs HTML entry、import-html-entry 工作流、UMD 约束、publicPath 注入、ESM 挑战
- [应用间通信](./guide-line/communication) —— 五模式选型 + postMessage 深讲（结构化克隆、targetOrigin、origin 校验、MessageChannel）
- [依赖共享三路线](./guide-line/dependency-sharing) —— externals + import maps、MF shared 版本协商、混用禁忌
- [预加载与性能代价](./guide-line/perf-preload) —— prefetch 四形态、预执行与保活、重复运行时 / 构建耦合 / 请求瀑布、实测原则
- [参考](./reference) —— 沙箱 / CSS 隔离 / 通信 / 依赖共享 / 预加载五张对比表 + 机制×框架映射表 + 权威链接

## 文档地址

- [qiankun FAQ](https://qiankun.umijs.org/faq) · [qiankun API](https://qiankun.umijs.org/api) —— Proxy 沙箱、两种样式隔离、prefetch 四形态的一手说明
- [wujie 原理指南](https://wujie-micro.github.io/doc/guide/) —— iframe 沙箱 + WebComponent 容器、路由同步、保活与预执行
- [micro-app 沙箱文档](https://github.com/jd-opensource/micro-app/blob/master/docs/zh-cn/sandbox.md) —— with 沙箱 / iframe 沙箱双模式与同域坑
- [import-html-entry](https://github.com/kuitos/import-html-entry) —— HTML entry 的事实标准实现（importHTML / importEntry / execScripts）
- [Module Federation: shared](https://module-federation.io/configure/shared.html) —— singleton / requiredVersion / shareStrategy 版本协商规则
- [MDN: import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) —— Baseline 状态、scopes 多版本、integrity
- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) —— 隔离边界、继承穿透、adoptedStyleSheets
- [MDN: window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) —— 结构化克隆、targetOrigin 与 origin 校验安全告诫
- [TC39: ShadowRealm 提案](https://github.com/tc39/proposal-shadowrealm) —— Stage 2.7、callable boundary 语义
- [single-spa: Recommended Setup](https://single-spa.js.org/docs/recommended-setup/) —— utility module 通信立场、externals + import maps 共享立场
- [Martin Fowler: Micro Frontends](https://martinfowler.com/articles/micro-frontends.html) —— JS entry 约定、URL 即通信、依赖重复的实测论点

## 幻灯片地址

- <a href="/SlideStack/mfe-mechanisms-slide/" target="_blank">微前端核心机制</a>
