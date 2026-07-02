---
layout: doc
---

# 微前端基础

把多个可独立开发、独立部署的前端应用在运行时组合成一个整体产品——这就是微前端（Micro Frontends）。本叶是整章的概念与决策层：先讲清 martinfowler.com 的定义与四收益、Geers 的端到端团队与五核心理念，再给出「什么时候该用、什么时候千万别用」的判据与反判据，然后用组合模式三分法（构建时 / 服务端 / 客户端运行时）与路由-容器模式搭起架构心智，厘清它与 iframe、monorepo、BFF、模块化单体的边界，最后落到 2026 年的选型全景——qiankun / wujie / micro-app 三主流 + Module Federation 的格局、各家真实维护状态与选型决策树。JS 沙箱、样式隔离、通信、依赖共享等机制原理归兄弟叶[微前端核心机制](../mfe-mechanisms/)，各框架的接入配置归对应框架叶——本叶只管概念与架构决策。

## 概述

- **定义**（martinfowler.com）：「把**可独立交付**的前端应用**组合**成一个更大整体的架构风格」，术语 2016 年底进入 ThoughtWorks 技术雷达；四收益——**增量升级、解耦代码库、独立部署、团队自治**。
- **组织内核**（Geers）：按业务使命纵切的**端到端团队**（从数据库到用户界面），配五核心理念——技术无关 / 隔离团队代码 / 团队前缀 / 原生浏览器特性优先 / 韧性站点。
- **组合模式三分法**：构建时组合（npm 包集成）是 Fowler 点名的**反模式**（改一块须全量重发）；服务端组合（SSI/模板，2026 升级为 Vercel 式平台路由）与客户端运行时组合（iframe / JS 渲染函数 / Web Components）才守得住独立部署。
- **不是银弹**：Fowler 三大 Downsides（payload 重复 / 环境漂移 / 运营治理复杂度）+ Vercel 官方「先考虑 **monorepo 与 feature flags**」；single-spa 的性能反论（懒加载后常更快）提醒结论只能靠生产实测。
- **2026 格局**：国内从「qiankun 一超」变为 **qiankun / wujie / micro-app 三主流 + Module Federation**，**Vite/ESM 兼容是第一分水岭**；MF 2.0 运行时化成事实主线，wujie 携全新 iframe 沙箱复活，qiankun 3.0 三年难产，single-spa v7 卡 beta，Garfish/icestark 退场。

## 本叶地图

- [入门](./getting-started) —— 微前端一句话、催生它的巨石之痛、本章「通论两叶 + 五框架叶」导览与学习路径
- [微前端是什么与为什么](./guide-line/what-why) —— Fowler 定义与四收益、Geers 端到端团队与五理念、qiankun 四核心价值、巨石之痛
- [适用判据与反判据](./guide-line/when-not-to-use) —— 该用的三类场景；Fowler Downsides、Vercel「先考虑替代方案」、single-spa 性能反论
- [组合模式三分法](./guide-line/composition-patterns) —— 构建时反模式、服务端组合的今昔、客户端运行时三径与取舍表
- [路由分发与容器模式](./guide-line/routing-shell) —— activity function/activeRule 心智 vs 手动挂载、容器四大职责、root config 最薄哲学
- [与相邻方案的关系](./guide-line/relations) —— vs iframe / monorepo / BFF / 模块化单体，一条判别公式
- [2026 选型全景](./guide-line/landscape-2026) —— 三主流+MF 格局表、停滞与退场名单、新动向、选型决策树
- [参考](./reference) —— 核心概念表 / 组合模式对比 / 判据清单 / 生态状态表 / 决策树 + 权威链接

## 文档地址

- [Micro Frontends - martinfowler.com](https://martinfowler.com/articles/micro-frontends.html) —— 定义、四收益、组合方式、Downsides、BFF 的最系统论述
- [micro-frontends.org](https://micro-frontends.org/) —— Michael Geers：端到端团队、五核心理念、Custom Elements 方案
- [single-spa: Microfrontends Concept](https://single-spa.js.org/docs/microfrontends-concept/) —— 「浏览器里的微服务」与性能反论
- [qiankun 指南](https://qiankun.umijs.org/guide) —— 核心价值四条，国内工程口径
- [Vercel: Microfrontends](https://vercel.com/docs/microfrontends) —— 平台侧组合与「先考虑替代方案」的官方反判据
- [module-federation.io](https://module-federation.io/) —— Module Federation 2.0 官方文档

## 幻灯片地址

<a href="/SlideStack/mfe-basics-slide/" target="_blank">微前端基础</a>
