---
layout: doc
---

# Taro

Taro 是**京东·凹凸实验室（O2 Team / NervJS）开源的多端统一开发框架**——写一套代码，编译到「各家小程序 + H5 + React Native + 纯血鸿蒙」。它的口径是「开放式跨端跨框架解决方案」：**主打 React**（JSX + Hooks），同时支持 **Vue3 / Vue2 / Preact / Nerv / Svelte**，因此与「Vue 系为主」的 uni-app 并称国内跨端小程序框架「双雄」。架构上 Taro 经历了从 1/2 代「重编译时」（把类 React 私有 DSL 静态编译成小程序 `wxml`、语法限制多）到 3 代「重运行时」（直接跑真正的 React/Vue 运行时 + 模拟 DOM/BOM + `setData` 桥接）的**彻底重写**；4.x 又叠加 **Vite 编译内核**、小程序 **CompileMode** 与**三条鸿蒙路线**。2026 年最大的看点是**纯血鸿蒙 HarmonyOS NEXT 的 C-API 方案**——京东 APP 鸿蒙版即用 Taro 开发，2024 年 9 月上线并获华为 S 级应用认证。仓库约 37k+ star，最新稳定版 **v4.1.8（2025-11-06）**。

## 概述

- **定位**：京东开源的**多端统一开发框架**，一套代码编译到多个终端；组件名/API 名/路由/配置**对齐微信小程序规范**，其它端做适配层。
- **主打 React、兼 Vue3**：写「真正的 React/Vue 组件」+ Taro 内置组件（`@tarojs/components`，PascalCase）+ `Taro.*` API + 页面 Hooks；React 自 v3.5 起默认 React 18（legacy 模式）。
- **支持端**：微信/支付宝/抖音/百度/QQ/京东/钉钉/飞书/快手等 **10+ 家小程序** + **H5** + **React Native**（自 3.2）+ **纯血鸿蒙**（C-API，自 v4.1.0）。
- **架构演进**：**Taro 1/2 重编译时 → Taro 3 重运行时（彻底重写）→ Taro 4 运行时 + Vite + 鸿蒙**；核心适配层是 `@tarojs/runtime`（模拟 DOM + `setData`）。
- **编译内核**：webpack4 / webpack5 / **Vite**（Vite 自 v4.0 起支持）；**纯血鸿蒙 C-API 仅支持 Vite**。
- **维护与量级**：京东·凹凸实验室 / NervJS 开源；仓库 [github.com/NervJS/taro](https://github.com/NervJS/taro)，约 37k+ star，最新稳定版 v4.1.8。

## 本叶地图

- [入门](./getting-started) —— Taro 是什么、与 uni-app 的分野、用 CLI 起步、支持端与命令、心智地图
- [开发模型：React（也支持 Vue3）](./guide-line/react-model) —— 真 React/Vue 组件、内置组件 PascalCase、`on` 事件、`Taro.*` API 与 promisify
- [页面 Hooks 与路由](./guide-line/hooks-router) —— `useLoad`/`useReady`/`useRouter` 全清单、`app.config.ts` 路由、`navigateTo` 与参数
- [架构演进：编译时到运行时](./guide-line/architecture) —— 1/2 代重编译时、3 代重运行时重写、`@tarojs/runtime` 模拟 DOM + `setData` 递归模板
- [纯血鸿蒙三路线](./guide-line/harmony) —— `harmony-hybrid`（套壳）/ `harmony`（ArkTS）/ `harmony_cpp`（C-API 纯血主推）三条路线严禁混淆
- [工程与构建配置](./guide-line/build-config) —— CLI、`app.config.ts`、`config/index.ts`、compiler（webpack/Vite）、CompileMode、rpx
- [Taro vs uni-app](./guide-line/vs-uni-app) —— React 系 vs Vue 系的分野、选型取舍、生态与鸿蒙对比
- [参考](./reference) —— 版本坐标 / 内置组件 / `Taro.*` / Hooks / 鸿蒙三路线 / config 关键项 / 易错点 速查表 + 权威链接

## 文档地址

- [Taro 官方文档](https://docs.taro.zone/docs/) —— 定位、支持端、导航（默认 4.x 频道，并存 3.x/2.x/1.x）
- [安装及使用](https://docs.taro.zone/docs/GETTING-STARTED) —— Node 要求、CLI、`taro init`、`dev`/`build` 命令
- [React 使用](https://docs.taro.zone/docs/react-overall) · [Vue3 使用](https://docs.taro.zone/docs/vue3) —— 双框架一手说明
- [Hooks](https://docs.taro.zone/docs/hooks) · [路由](https://docs.taro.zone/docs/router) —— 页面生命周期 Hooks 与路由 API
- [编译配置详情](https://docs.taro.zone/docs/config-detail) —— `config/index.ts` 全项与 compiler
- [鸿蒙总览](https://docs.taro.zone/docs/harmony) · [Harmony C-API 插件](https://docs.taro.zone/docs/harmony/c-api) —— 三路线与纯血鸿蒙 C-API
- [运行时实现](https://docs.taro.zone/docs/implement-note) —— `@tarojs/runtime`、DOM 序列化、`setData`、递归模板
- [Taro GitHub](https://github.com/NervJS/taro) —— 源码、Releases、Issues

## 幻灯片地址

- <a href="/SlideStack/taro-slide/" target="_blank">Taro</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=taro" target="_blank" rel="noopener noreferrer">Taro 测试题</a>
