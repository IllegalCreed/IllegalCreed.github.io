---
layout: doc
---

# Ionic

Ionic（Ionic Framework）是一套**基于 Web Components、框架无关、移动优先的开源 UI 组件工具包**——用标准 HTML/CSS/JS 就能构建 iOS / Android / PWA / 桌面 的高质量界面，一套代码多端运行（MIT 许可）。它的心智内核只有一句：**Ionic 只做「UI 层」**——组件、主题、导航、手势、动画归它管；而把 Web 应用装进原生壳、访问相机/GPS/蓝牙等原生能力的，是**运行时 Capacitor（或更老的 Cordova）**。二者由同一个 Ionic 团队出品，但职责分离、可组合也可各自独立使用——这也是初学者最大的误区靶点。底层上，Ionic 的 `ion-*` 组件都是用 **Stencil** 编译出的标准自定义元素（Custom Elements），因此天然框架无关：官方提供 `@ionic/angular` / `@ionic/react` / `@ionic/vue` 三个薄封装，也能纯 vanilla / CDN（`@ionic/core`）零框架直接用。当前主线是 **Ionic 8**（最新补丁 **8.8.12**）：同一套组件会按平台自动切换 iOS 或 Material Design 的**双 mode** 外观，主题则全靠 **CSS 变量**换肤、无需 Sass，暗色内置三种预置 palette。

## 概述

- **定位**：框架无关的**移动优先 UI 组件库**，产出 `ion-*` Web Components + CSS；**不**负责原生打包与原生 API（那是 Capacitor 的活）。一套代码同时覆盖 iOS / Android / PWA / 桌面。
- **架构底座**：所有组件是 **Stencil 编译出的标准 Web Components（Custom Elements）**，多数用 Shadow DOM 封装；`@ionic/core` 是组件本体，`@ionic/angular|react|vue` 只是各框架的薄 wrapper。
- **双 mode 自适应**：同一组件按平台自动呈现 **iOS** 或 **MD（Material Design）** 外观（Adaptive Styling），可全局或单组件 `mode="..."` 覆盖，无需写两套 UI。
- **主题系统**：全靠 **CSS 变量（CSS custom properties）** 换肤，运行时可改、不需要 Sass；9 个应用色各有成套变量；Shadow DOM 内部靠 **CSS Shadow Parts（`::part()`）** 定制；暗色内置 3 种 palette。
- **路由**：用**各框架自己的 router**（Angular Router / React Router / Vue Router）搭配 `ion-router-outlet` 承载页面转场与生命周期，而**非** Ionic 私有路由。
- **与 Capacitor 分工**：Ionic = UI 层，Capacitor = 原生运行时；同队出品、职责分离，可组合也可各自独立用（Ionic 可脱离 Capacitor 做纯 PWA，Capacitor 可脱离 Ionic 包任意 Web 应用）。
- **版本坐标**：主线 **Ionic 8**（v8.0.0 于 2024-04-17 首发，最新补丁 **8.8.12**）；**8.8 是 Ionic 8 的最后一个功能 minor**，下一大版本 **Ionic 9** 在开发中（方向是更模块化、更易扩展的架构重构）。

## 本叶地图

- [入门](./getting-started) —— Ionic 是什么、为何是「UI 库不是运行时」、CLI 起步、第一个 `ion-*` 页面、心智地图
- [组件体系与双 mode](./guide-line/components-modes) —— `ion-*` 组件分组全景、内联 vs 控制器用法、iOS/MD 双 mode 的检测与覆盖
- [主题与暗色](./guide-line/theming) —— CSS 变量主题、9 色成套变量、CSS Shadow Parts、暗色 3 palette（always/system/class）
- [框架集成与底座](./guide-line/framework-integration) —— Stencil/Web Components 底座、Angular/React/Vue 三包 + vanilla、版本矩阵与初始化配置
- [路由与导航](./guide-line/routing) —— `ion-router-outlet` 承载转场、各框架 router 对接、tabs/menu/back-button 导航组件
- [Ionic vs Capacitor](./guide-line/vs-capacitor) —— UI 层 vs 原生运行时分工、WebView 机制、Cordova 关系、组合与独立
- [参考](./reference) —— 版本坐标 / 组件速查 / mode / 主题变量 / 暗色 palette / 框架矩阵 / CLI / 易错点 等速查表 + 权威链接

## 文档地址

- [Ionic 官方文档](https://ionicframework.com/docs) —— 组件、API、主题、指南一手文档
- [组件总览 Components](https://ionicframework.com/docs/components) —— 全部 `ion-*` 组件清单与演示
- [API 参考](https://ionicframework.com/docs/api) —— 每个组件的属性/事件/CSS 变量/Shadow Parts
- [Theming 主题](https://ionicframework.com/docs/theming/basics) —— CSS 变量、颜色、暗色 palette
- [Config 配置](https://ionicframework.com/docs/developing/config) —— `mode`/`rippleEffect`/`animated` 等全局项
- [Capacitor 官方文档](https://capacitorjs.com/docs) —— 配套原生运行时（对照理解分工）
- [Stencil](https://stenciljs.com/) —— Ionic 组件的 Web Components 编译器底座
- [Ionicons](https://ionic.io/ionicons) —— 官方图标库

## 幻灯片地址

- <a href="/SlideStack/ionic-slide/" target="_blank">Ionic</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ionic" target="_blank" rel="noopener noreferrer">Ionic 测试题</a>
