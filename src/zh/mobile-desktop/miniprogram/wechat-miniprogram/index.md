---
layout: doc
---

# 微信小程序

微信小程序是**微信 App 内的原生小程序框架 + 运行平台**——它既不是一个 npm 包，也不是独立安装的 App，而是开发者用微信定制的 DSL（WXML/WXSS）＋ JavaScript ＋ JSON 编写、由微信客户端（iOS / Android / PC / Mac / 鸿蒙）内建运行时承载的应用形态。核心体验是「无需安装、用完即走、扫码 / 搜索 / 分享即达」。技术上，它以**双线程隔离**（逻辑层与渲染层分属两个线程）换取安全与可控，代价是 `setData` 跨线程通信成为性能命门；而自研的 **Skyline 渲染引擎**是它追赶原生渲染性能的战略级演进。它同时是 **uni-app / Taro / mpvue 等跨端框架的编译目标底座**——读懂原生机制，才读得懂这些框架「编译产物」的运行规律。

## 概述

- **定位**：中国移动生态里「超级 App 内应用层」的事实标准。开发者写四类文件（结构 / 样式 / 逻辑 / 配置），在微信运行时里跑，用户扫码即用、无需下载安装。
- **双线程架构（核心机制）**：逻辑层（跑开发者 JS，**无 DOM / BOM**）与渲染层（WebView）分属两个线程，经微信 Native（JSBridge）异步中转通信。这带来安全与管控，也让 `setData` 成为唯一且高成本的跨线程数据通道——**性能优化的主战场**。
- **四文件模型**：每个页面 / 组件由 `.wxml`（结构）、`.wxss`（样式，含 `rpx` 响应式单位）、`.js`（逻辑，`Page()` / `Component()`）、`.json`（纯配置，不能写注释）组成；全局层为 `app.js` / `app.json` / `app.wxss`。
- **Skyline 渲染引擎**：在传统 WebView 渲染之外新增的自研引擎，配合新一代 `glass-easel` 组件框架，用独立渲染线程 + 更精简管线把性能推向原生；正式版起于**基础库 3.0.0**。
- **平台能力**：登录（`wx.login` → `code2Session`）、分包加载、云开发（Serverless）、微信支付（`wx.requestPayment`）构成一套完整的「即用型」商业闭环。
- **生态位**：小程序总量、月活等**第三方统计**口径为「累计约 430 万+、月活约 9 亿+」（非官方定论，仅作规模量级参考）；作为跨端框架的底座，它的机制知识可迁移到 uni-app / Taro。

## 本叶地图

- [入门](./getting-started) —— 小程序是什么、与 Web / 跨端框架的关系、开发者工具起步、第一个页面、心智地图
- [四文件与 WXS](./guide-line/four-files) —— `.wxml` / `.wxss` / `.js` / `.json` 职责分离、全局 vs 页面文件、`rpx`、WXS 脚本
- [双线程与 setData](./guide-line/dual-thread) —— 逻辑层 / 渲染层分离、JSBridge 通信、`setData` 性能命门与五大优化原则
- [生命周期·API·事件](./guide-line/lifecycle-api) —— `App` / `Page` / `Component` 生命周期、路由页面栈、数据绑定与事件、常用 `wx.*` API
- [分包与云开发](./guide-line/subpackage-cloud) —— 分包体积限制、预下载 / 独立分包 / 分包异步化、云开发四大能力（数据库 / 存储 / 云函数 / 云调用）
- [Skyline 与性能优化](./guide-line/skyline-perf) —— Skyline vs WebView、glass-easel、Worklet / 手势、启动与渲染优化清单
- [登录与支付](./guide-line/login-pay) —— `wx.login` → `code2Session` 四步登录、`openid` / `session_key` / `unionid`、头像昵称填写能力、微信支付调起
- [参考](./reference) —— 四文件 / 双线程 / setData / 生命周期 / 路由 / 网络 / 登录 / 分包 / Skyline / 支付 等速查表 + 权威链接

## 文档地址

- [小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/) —— 框架、组件、API 一手文档
- [框架 · 逻辑层 / 视图层](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/) —— App / Page / Component、WXML / WXSS、事件、运行机制
- [组件](https://developers.weixin.qq.com/miniprogram/dev/component/) —— `view` / `text` / `scroll-view` 等基础组件参考
- [API](https://developers.weixin.qq.com/miniprogram/dev/api/) —— `wx.*` 接口全集（网络 / 存储 / 界面 / 媒体 / 开放能力）
- [Skyline 渲染引擎](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/introduction.html) —— 引擎介绍、支持与差异、新特性
- [小程序登录](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html) —— `wx.login` + `code2Session` 官方流程
- [微信支付 · 小程序支付](https://pay.weixin.qq.com/doc/v3/merchant/4012791856) —— 商户下单 + `wx.requestPayment` 调起
- [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) —— 云数据库 / 云存储 / 云函数 / 云调用

## 幻灯片地址

- <a href="/SlideStack/wechat-miniprogram-slide/" target="_blank">微信小程序</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F" target="_blank" rel="noopener noreferrer">微信小程序 测试题</a>
