---
layout: doc
outline: [2, 3]
---

# 参考

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- **定义**：微前端 = 「把**可独立交付**的前端应用**组合**成一个更大整体的架构风格」（martinfowler.com）；single-spa：「**浏览器里的微服务**」；2016 年底入 ThoughtWorks 技术雷达
- **判别公式**：微前端 = **独立部署 ∧ 运行时组合**——缺前者是模块化单体，缺后者是懒加载
- **Fowler 四收益**：增量升级 / 解耦代码库 / 独立部署 / 团队自治——全部长在「独立」上
- **Geers 五理念**：技术无关 / 隔离团队代码 / 团队前缀 / 原生浏览器特性优先 / 韧性站点；组织内核 = **端到端团队**（数据库到 UI）
- **qiankun 四核心价值**：技术栈无关 / 独立开发独立部署 / 增量升级 / 独立运行时——三家口径互相印证
- **组合三分法**：构建时（npm 集成，**反模式**：锁步发布回归）/ 服务端（SSI → 2026 平台路由）/ 客户端运行时（iframe / JS 渲染函数 / Web Components）
- **Fowler Downsides**：payload 重复（对冲：隐式代码分割）/ 环境漂移 / 运营治理复杂度；裁决靠**生产实测**
- **Vercel 官方反判据**：先考虑 **monorepo（Turborepo）/ feature flags / 更快编译（Turbopack）**——痛点对症再谈微前端
- **single-spa 性能反论**：微前端「常比脱胎的巨石更快」——内建懒加载 + 暴露隐藏问题；前提**大库共享单例**
- **容器纪律**：只管路由分发 / 公共 chrome / 鉴权注入 / 生命周期编排 / 依赖底座；「**root config 的存在只为启动各应用**」——业务逻辑一律下放
- **鉴权与 BFF**：token 由容器统一获取注入；每微前端配**同团队拥有的 BFF**，「别让团队等其他团队」
- **2026 格局**：**qiankun / wujie / micro-app 三主流 + Module Federation**；**Vite/ESM 兼容是第一分水岭**；MF 2.0 运行时化为事实主线
- **状态一句话**：qiankun 3.0 三年难产（rc.21）、wujie v2.0 复活（2026-06 连发 4 版）、micro-app 常青 RC（rc.32）、single-spa v7 卡 beta、Garfish/icestark 退场
- **选型三问**：要不要 → 构建器与产物形态 → 双候选 POC（沙箱逃逸/样式冲突/构建兼容只有跑过才知道）

## 一、核心概念表

| 概念 | 英文 | 一句话 | 出处 |
| --- | --- | --- | --- |
| 微前端 | Micro Frontends | 可独立交付的前端应用组合成更大整体的架构风格 | martinfowler.com |
| 前端巨石 | Frontend Monolith | 单一构建、单一部署、锁步发布的大型前端 | Geers / qiankun |
| 锁步发布 | lockstep release | 任何一块变更都迫使整体重新构建发布 | Fowler |
| 端到端团队 | end-to-end team | 按业务使命纵切、从数据库到 UI 全程负责 | Geers |
| 绞杀者路径 | strangler | 新块逐步替换旧系统而非全量重写 | Fowler（增量升级） |
| 容器 / 基座 | container / shell / root config | 唯一常驻方：路由、chrome、鉴权、编排 | Fowler / single-spa / qiankun |
| 活性函数 | activity function / activeRule | `(location) => boolean`，URL 决定应用活性 | single-spa / qiankun |
| 生命周期协议 | bootstrap / mount / unmount | 容器与微应用之间的挂载契约 | single-spa |
| HTML Entry | —— | 子应用交出 HTML，框架解析接管资源 | qiankun |
| 自定义元素契约 | Custom Elements as contract | 标签名/属性/事件即团队间公共 API | Geers |
| 团队前缀 | team prefixes | CSS/事件/存储/Cookie 命名空间化防冲突 | Geers |
| BFF | Backend For Frontend | 只服务一个前端的专属后端，与微前端同团队 | Fowler |
| 依赖共享 | shared dependencies | 大库单实例化，对冲 payload 重复 | single-spa / MF |
| 模块联邦 | Module Federation | 应用间运行时共享模块，2.0 起独立于打包器 | module-federation.io |

## 二、组合模式对比表

| 维度 | 构建时（npm） | SSI/模板 | 平台路由 | iframe | JS 渲染函数 | Web Components |
| --- | --- | --- | --- | --- | --- | --- |
| 独立部署 | **✗（反模式）** | ✓ | ✓ | ✓ | ✓ | ✓ |
| 隔离强度 | 无 | 页面级天然 | 页面级天然 | **最强** | 靠沙箱补 | Shadow DOM 中等 |
| 首屏/SEO | 好 | **最好** | 好 | 差 | 一般 | 一般 |
| 页内多应用共存 | —— | ✓ 片段级 | ✗ 页面粒度 | ✓ 但笨重 | ✓ | ✓ |
| 典型代表 | —— | 电商门户、Geers 配方 | Vercel MFE、Web Fragments | 传统门户、wujie 底层 | single-spa、qiankun | Geers 方案、micro-app |

展开见[组合模式三分法](./guide-line/composition-patterns)。

## 三、判据与反判据清单

| 该用的信号 | 别用的信号 |
| --- | --- |
| ≥3 个特性团队常态并行、发布互相排队 | 单团队维护整个前端 |
| 遗留系统 + 渐进迁移诉求（绞杀者路径） | 绿地新项目、无历史包袱 |
| 生命周期以 5 年计、必经框架换代 | 活动页/短生命周期产品 |
| 技术栈诉求真实分裂（收购/多 BU） | 全员同栈且无分裂计划 |
| 具备平台工程能力（IaC、模板化 CI、监控） | CI 常年没人修 |
| monorepo / feature flags 试过仍卡协作边界 | 还没试过任何替代方案 |

三笔必付的账（Fowler Downsides）：**payload 重复**（治理靠依赖共享，裁决靠生产实测）、**环境漂移**（预算集成回归流水线）、**运营治理复杂度**（仓库/管道/域名 ×N，四个自问见[判据页](./guide-line/when-not-to-use)）。

## 四、2026 生态状态表

主流五家（版本日期核于 2026-07）：

| 方案 | 出品 | 版本锚点 | 沙箱路线 | Vite/ESM | 状态 |
| --- | --- | --- | --- | --- | --- |
| qiankun | 蚂蚁 | 稳定 2.10.16（2023-11）；3.0-rc.21（2026-02）；2.10.17-beta（2026-06） | with + Proxy 模拟 | 弱，需插件绕行 | 存量王者，恢复活动 |
| wujie | 腾讯 | **2.0 全新 iframe 沙箱**，2026-06 连发 4 版（→2.1.0） | iframe 原生隔离 + WC 渲染 | 好 | 复活，上升 |
| micro-app | 京东 | 1.0.0-rc.32（2026-06），月度活跃 | with / iframe 双沙箱 | 较好（iframe 模式） | 活跃，常青 RC |
| single-spa | 社区 | v6 稳定；v7 beta.13（2025-09）后停更 | 无沙箱，纯编排 | 好（官方推荐 ESM + import maps） | 稳定，演进停滞 |
| Module Federation | 字节 Web Infra + Zack Jackson | core v2.6.0（2026-06）高频 | 无沙箱，模块共享 | 官方 @module-federation/vite | **事实主线** |

退场与边缘：

| 方案 | 状态 | 判词 |
| --- | --- | --- |
| Garfish（字节） | 维护模式（v1.19.7，2026-01） | 官方资源已转投 MF，新项目勿入 |
| icestark（阿里） | 遗产态（release 停 2022-04） | 已淡出，存量应规划迁移 |
| Piral / Luigi | 国际活跃 | 国内案例≈0，慎选 |

新动向：**Vercel Microfrontends**（平台组合商业化，按路由请求计费）、**Web Fragments**（Cloudflare 系边缘组合）、**Native Federation**（import maps 系联邦，细见 [Module Federation 叶](../module-federation/)）。

## 五、选型决策树（精简版）

```text
Q0 要不要？→ 判据不满足 → monorepo + feature flags，到此为止
Q1 同栈同大版本、只要模块共享 → Module Federation 2.0
Q2 要应用级容器 → 看构建器：
     webpack 存量 → qiankun 2.x（资产复用）/ micro-app
     Vite/ESM   → 强隔离选 wujie；轻接入选 micro-app（iframe 模式）
     纯编排无沙箱 → single-spa v6 + 原生 ESM + import maps
Q3 页面粒度 + 接受平台绑定 → Vercel Microfrontends
终选：双候选 POC（沙箱逃逸/样式冲突/构建兼容/内存回收）
```

## 权威链接

- [Micro Frontends - martinfowler.com](https://martinfowler.com/articles/micro-frontends.html) —— 定义、四收益、组合方式、Downsides、BFF、示例工程
- [micro-frontends.org](https://micro-frontends.org/) —— Geers：端到端团队、五核心理念、Custom Elements + SSI 配方
- [single-spa: Microfrontends Concept](https://single-spa.js.org/docs/microfrontends-concept/) · [Configuration](https://single-spa.js.org/docs/configuration/) —— 浏览器里的微服务、性能反论、root config 与 registerApplication
- [qiankun 指南](https://qiankun.umijs.org/guide) —— 核心价值四条与特性清单
- [Vercel: Microfrontends](https://vercel.com/docs/microfrontends) —— 平台侧组合、mono/polyrepo 等价性、「先考虑替代方案」、定价
- [module-federation.io](https://module-federation.io/) —— MF 2.0 文档与运行时体系
- GitHub releases（生态状态复核入口）：[qiankun](https://github.com/umijs/qiankun/releases) · [wujie](https://github.com/Tencent/wujie/releases) · [micro-app](https://github.com/jd-opensource/micro-app/releases) · [single-spa](https://github.com/single-spa/single-spa/releases) · [module-federation/core](https://github.com/module-federation/core/releases)

## 相关页

- [概览](./index) —— 本叶定位与地图
- [入门](./getting-started) —— 一句话定义、巨石之痛、本章导览与学习路径
- [微前端是什么与为什么](./guide-line/what-why) —— 定义、四收益、五理念、四核心价值
- [适用判据与反判据](./guide-line/when-not-to-use) —— 正判据、Downsides、官方劝退论、性能反论
- [组合模式三分法](./guide-line/composition-patterns) —— 构建时反模式、服务端今昔、客户端三径
- [路由分发与容器模式](./guide-line/routing-shell) —— 活性映射 vs 手动挂载、容器职责、最薄哲学
- [与相邻方案的关系](./guide-line/relations) —— vs iframe / monorepo / BFF / 模块化单体
- [2026 选型全景](./guide-line/landscape-2026) —— 格局表、逐家点评、决策树
- 兄弟叶：[微前端核心机制](../mfe-mechanisms/) · [single-spa](../single-spa/) · [qiankun](../qiankun/) · [wujie](../wujie/) · [micro-app](../micro-app/) · [Module Federation](../module-federation/)
- 跨章：[iframe 嵌入（HTML）](/zh/base/language/html/html-media/guide-line/iframe-embedding) · [iframe sandbox 与点击劫持](/zh/base/browser/browser-security/guide-line/iframe-sandbox-clickjacking) · [Vue 接入实操](/zh/frontend-framework/ui/vue/guide-line/other) · [webpack Module Federation 配置](/zh/frontend-toolchain/build/webpack/guide-line/expert)
