---
layout: doc
---

# uni-app

uni-app 是 DCloud（数字天堂）出品、**使用 Vue.js 语法的跨端框架**——一套代码同时编译到「各家小程序 + H5/Web + App（iOS/Android）+ 鸿蒙」，是国内 Vue 系跨端的事实龙头。它有两种形态：**传统版 uni-app**（JS + WebView 渲染，最成熟、生态最大、上手成本最低）与 **uni-app x**（UTS 语言 + uvue 原生渲染，编译为 Kotlin/Swift/ArkTS 原生代码，是 DCloud 主推的未来方向）。两者现已**共用统一版本号 5.x**（最新 `5.07.2026041006`，2026-04）。开发心智对齐小程序：不写 `div`/`span`，改用 `view`/`text`/`image` 等组件，把 `wx.*` 统一成 `uni.*`，靠 easycom 免注册引入组件，用**条件编译**在同一份代码里按平台裁剪差异。很多用户通过官方 IDE「HBuilderX」的内置编译器开发（不走 npm），因此 npm 下载量严重低估其真实体量——GitHub 上 `dcloudio/uni-app` 已有 41.6k★、Apache-2.0。

## 概述

- **定位**：用 Vue 语法写、一套代码跨「小程序 / H5 / App / 鸿蒙」的国内 Vue 系跨端龙头；组件与 API 对齐小程序规范（`view`/`text` 而非 `div`/`span`，`uni.*` 而非 `wx.*`）。
- **两种形态**：**传统版 uni-app**（JS 逻辑层 + WebView 渲染，App 端 nvue 页面走 Weex 原生渲染）；**uni-app x**（UTS 强类型语言 + uvue 原生渲染，编译为各平台原生代码，主打接近甚至超越原生的性能）。
- **开发模型**：Vue 单文件组件（`.vue`，Vue2/Vue3 都支持；uni-app x 用 `.uvue`）；`pages.json` 管路由与导航（**不是 Vue Router**）；`manifest.json` 管应用级与各端差异配置；easycom 让符合目录规范的组件免手动 import/注册。
- **跨端核心机制**：**条件编译**（`#ifdef`/`#ifndef` 按平台裁剪同一份代码）；**三类生命周期**（组件周期来自 `vue`、页面周期来自 `@dcloudio/uni-app`、应用周期写在 `App.vue`）。
- **云开发（uniCloud）**：DCloud 联合阿里云/腾讯云的 Serverless 平台，云函数/云对象 + MongoDB 系云数据库 + clientDB（前端 JQL 直查）+ 云存储，前后端都用 JS。
- **版本与选型**：统一 5.x；Vue2（webpack 编译器）与 Vue3（Vite 编译器）双支持，**新项目用 Vue3 + Vite**（Node 18+/20+）；两条上手路——「HBuilderX」官方 IDE（免装 Node、图形化运行）与 CLI（Vite 工程化，适合团队/CI）。

## 本叶地图

- [入门](./getting-started) —— uni-app 是什么、两种形态、工程结构、HBuilderX vs CLI、开发心智地图
- [工程配置：pages.json 与 manifest.json](./guide-line/project-config) —— 路由/导航/TabBar/分包、应用级与各端差异化配置
- [API 与组件](./guide-line/api-components) —— `uni.*` 统一 API 分类、内置组件（对齐小程序）、easycom 自动引入
- [条件编译](./guide-line/conditional-compile) —— `#ifdef`/`#ifndef` 三指令、按文件类型的注释语法、平台常量全表与易错点
- [生命周期](./guide-line/lifecycle) —— 组件/页面/应用三类周期、`onLoad`/`onShow` 从 `@dcloudio/uni-app` 引入
- [uni-app x](./guide-line/uni-app-x) —— UTS 语言、编译 Kotlin/Swift/ArkTS、uvue 原生渲染、VDOM→Vapor、平台覆盖
- [uniCloud](./guide-line/unicloud) —— 云函数/云对象、MongoDB 系云数据库、clientDB（JQL）、DB Schema、云存储
- [参考](./reference) —— 版本坐标 / 工程文件 / 生命周期来源 / 条件编译常量 / API 与组件 / uni-app x / 易错点 等速查表 + 权威链接

## 文档地址

- [uni-app 官网](https://uniapp.dcloud.net.cn/) —— 教程、组件、API 一手文档
- [教程总览](https://uniapp.dcloud.net.cn/tutorial/) —— 工程结构、Vue2/3、编译器与运行时分离
- [条件编译](https://uniapp.dcloud.net.cn/tutorial/platform.html) —— 平台常量全表（核心）
- [pages.json](https://uniapp.dcloud.net.cn/collocation/pages.html) · [manifest.json](https://uniapp.dcloud.net.cn/collocation/manifest.html)
- [uni-app x 文档](https://doc.dcloud.net.cn/uni-app-x/) · [UTS 语言](https://doc.dcloud.net.cn/uni-app-x/uts/)
- [uniCloud 文档](https://doc.dcloud.net.cn/uniCloud/) —— 云函数/云对象、云数据库、clientDB
- [DCloud 插件市场](https://ext.dcloud.net.cn/) —— 组件、模板、UTS 原生插件、云函数模板
- [GitHub dcloudio/uni-app](https://github.com/dcloudio/uni-app) —— 源码与 issue

## 幻灯片地址

- <a href="/SlideStack/uni-app-slide/" target="_blank">uni-app</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=uni-app" target="_blank" rel="noopener noreferrer">uni-app 测试题</a>
