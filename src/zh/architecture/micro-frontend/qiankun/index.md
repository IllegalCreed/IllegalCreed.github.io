---
layout: doc
---

# qiankun

qiankun（乾坤）是蚂蚁集团开源的微前端框架，也是**国内存量最大、最常被面试问到**的那一个。它的定位一句话说清：**qiankun = single-spa + HTML entry + JS 沙箱 + 样式隔离 的开箱方案**——[single-spa](../single-spa/) 只做「按路由把子应用 mount/unmount」的编排，故意不管隔离与资源加载；qiankun 在它之上补齐了三样 single-spa 留白的能力：用 **HTML entry**（`entry` 直接填子应用 HTML 地址，靠 import-html-entry 解析）替代手写 import maps，用 **JS 沙箱**（Proxy 代理 `window`）防全局污染，用**样式隔离**（Shadow DOM / 运行时属性改写）防样式互踩。设计哲学是「接入像用 iframe 一样简单」——主应用 `registerMicroApps + start` 两行、子应用导出 `bootstrap/mount/unmount` 三个生命周期即可跑。代价也很实在：稳定版停在 **2.10.16（2023-11）**，**3.0 rc 三年难产**（2024-09 rc.0 → 2026-02 rc.21，仍无 stable），2.x **不支持 ESM 入口**是最大痛点——Vite 子应用得靠社区插件硬接或干脆换 [wujie](../wujie/)/[micro-app](../micro-app/)。沙箱与样式隔离的**通论**（四代沙箱、四路 CSS 隔离）已在[微前端核心机制](../mfe-mechanisms/)叶讲透，本叶只讲 qiankun 的**具体实现与配置坑**。

## 概述

- **定位**：qiankun 是**基于 single-spa 的上层封装**，把 single-spa 故意不做的三件事补齐——**HTML entry**（子应用给 HTML 地址而非 JS 模块）、**JS 沙箱**（Proxy 代理 window 防污染）、**样式隔离**（Shadow DOM / 属性改写）；主打「接入像 iframe 一样简单」。
- **核心 API 极少**：主应用侧 `registerMicroApps(apps, lifeCycles)` + `start(opts)` 走路由自动加载，`loadMicroApp(app)` 走手动加载（可多实例）；`initGlobalState` 做通信；子应用侧只需导出 `bootstrap`/`mount`/`unmount` 并打成 **UMD**。
- **三沙箱自动选择**：`proxySandbox`（多实例，`singular:false`）、`legacyProxySandbox`（单实例，`singular:true` 默认）、`snapshotSandbox`（无 Proxy 的旧环境降级）——路由型默认**单实例**、手动 `loadMicroApp` 可**多实例**。
- **两难点最扎手**：**样式隔离**——`strictStyleIsolation`（Shadow DOM）弹窗逃逸、`experimentalStyleIsolation`（属性改写）不支持 `@keyframes`/`@font-face`；**Vite/ESM 之痛**——2.x 基于 import-html-entry 不认 `<script type="module">`，Vite 需社区插件或换路线。
- **版本与选型**：**2.10.16（2023-11）事实稳定线**，3.0 三年 rc（rc.21 2026-02）未 stable，2026 活动恢复（@scope 样式隔离、`create-qiankun` 脚手架）；存量 webpack 项目要开箱即用 → qiankun，新项目主力是 Vite → 优先看 wujie/micro-app。

## 本叶地图

- [入门](./getting-started) —— qiankun 解决什么、最小接入（`registerMicroApps` + `start`）、主/子应用改造清单、与 single-spa 的底座关系
- [核心 API](./guide-line/core-api) —— `registerMicroApps`/`start`/`loadMicroApp`（含 singular 单实例 vs 多实例语义）/`setDefaultMountApp`/`runAfterFirstMounted`
- [沙箱实现](./guide-line/sandbox-impl) —— 三沙箱自动选择逻辑、单实例 vs 多实例、window 代理细节、拦得住什么拦不住什么（通论链核心机制叶）
- [样式隔离](./guide-line/style-isolation) —— `strictStyleIsolation`（Shadow DOM 弹窗逃逸）、`experimentalStyleIsolation`（属性改写 + at-rule 不支持）、2026 @scope 方案、主应用样式自治与 antd prefixCls
- [HTML entry 与接入约束](./guide-line/html-entry-integration) —— UMD 打包要求、entry script 标记、`__INJECTED_PUBLIC_PATH_BY_QIANKUN__` 修 publicPath、跨域 CORS、常见接入报错排查
- [Vite 与 ESM 之痛](./guide-line/vite-esm-pain) —— 2.x 不支持 `type=module` 的根因、`vite-plugin-qiankun` 原理与局限、何时该换 wujie/micro-app、3.0 对 ESM 的规划
- [演进与现状](./guide-line/evolution-status) —— prefetch 四形态、`initGlobalState` 通信、2.10.16 事实稳定线、3.0 rc 三年难产史与 2026 复苏、选型定位
- [参考](./reference) —— 核心 API / 三沙箱 / 样式隔离 / UMD 接入 / Vite 方案 / 版本时间线六张表 + 权威链接

## 文档地址

- [qiankun 官网](https://qiankun.umijs.org/) —— 指南、API、FAQ、Cookbook 一手文档总入口
- [Guide 指南](https://qiankun.umijs.org/guide) · [Getting Started](https://qiankun.umijs.org/guide/getting-started) —— 核心价值、快速上手、主/子应用接入
- [API](https://qiankun.umijs.org/api) —— `registerMicroApps`/`start`/`loadMicroApp`/`initGlobalState` 等全部签名与配置项
- [FAQ](https://qiankun.umijs.org/faq) —— 沙箱、样式隔离、UMD 接入、publicPath、CORS 一手排障
- [Cookbook 实践](https://qiankun.umijs.org/cookbook) —— 路由模式、部署方案、1.x→2.x 升级
- [GitHub Releases](https://github.com/umijs/qiankun/releases) · [3.0 Roadmap #1378](https://github.com/umijs/qiankun/discussions/1378) —— 版本状态与 3.0 规划核对源

## 幻灯片地址

- <a href="/SlideStack/qiankun-slide/" target="_blank">qiankun</a>
