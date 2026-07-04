---
layout: doc
outline: [2, 3]
---

# 2026 选型全景

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- 国内格局换代：从「qiankun 一超」→ **qiankun / wujie / micro-app 三主流 + Module Federation**；**Vite/ESM 兼容是第一分水岭**
- **qiankun**（蚂蚁）：存量最大；稳定版停在 **v2.10.16（2023-11）**，**3.0 三年难产**（rc.21，2026-02）；2026 活动恢复——rc 重启推进、探索 @scope 样式隔离、推出 create-qiankun 脚手架、2.10.17-beta（2026-06）
- **wujie**（腾讯）：2026-06 **复活**——**v2.0 全新 iframe 沙箱**发布后一个月内连发 4 版（2.0.0 → 2.1.0）
- **micro-app**（京东）：提交月度活跃，但 **1.0 长期停在 RC**（rc.32，2026-06）——「常青 RC」
- **single-spa**：**v6 稳定**、生态成熟；**v7 卡在 beta**（2025-09 beta.13 后再无发版）；官方推荐架构已是**原生 ESM + import maps**
- **Module Federation 2.0 = 事实主线**：运行时库独立于打包器；文档站 module-federation.io，**字节 Web Infra + Zack Jackson** 维护，core **v2.6.0（2026-06）**高频迭代；官方 **@module-federation/vite** 活跃，早年的 originjs 社区 Vite 插件已停滞被取代
- 退场名单：**Garfish 维护模式**（字节资源转投 MF 生态）、**icestark 遗产态**（release 停在 2022-04）
- 国际方案：**Piral、Luigi（SAP）持续活跃**，但国内采用率≈0；新动向：**Web Fragments**（Cloudflare 系边缘组合）、**Vercel Microfrontends**（平台组合商业化 GA、按用量计费）、Native Federation（打包器无关联邦）
- 选型第一问不是「哪家强」而是**「要不要」**（回[适用判据与反判据](./when-not-to-use)）；第二问是**你的构建器与产物形态**（webpack 存量还是 Vite/ESM）——它直接砍掉一半选项
- 终选纪律：决策树只做第一轮收敛，**拿真实子应用 POC 两名候选**——沙箱逃逸、样式冲突、构建链路兼容都只有跑过才知道

## 一、格局总览

主流五家一张表（版本与日期核于 2026-07，来源为各项目 GitHub releases / npm）：

| 方案 | 出品 | 最新动态 | 沙箱/隔离路线 | Vite/ESM 友好度 | 接入形态 | 状态评级 |
| --- | --- | --- | --- | --- | --- | --- |
| **qiankun** | 蚂蚁 | 稳定版 2.10.16（2023-11）；3.0-rc.21（2026-02）；2.10.17-beta（2026-06） | with + Proxy JS 沙箱；运行时样式隔离（实验方向 @scope） | **弱**——ESM 绕过沙箱，需社区插件降级配合 | 主应用注册 `activeRule` | 存量王者，恢复活动，换代未完成 |
| **wujie** | 腾讯 | **v2.0 全新 iframe 沙箱**，2026-06 连发 4 版 | iframe 原生 JS 隔离 + Web Component/Shadow DOM 渲染 | **好**——不靠改写脚本，天然容纳 ESM | Vue/React 组件式 | 复活，势头上升 |
| **micro-app** | 京东 | 1.0.0-rc.32（2026-06），月度活跃 | 双沙箱可选：with 沙箱 / iframe 沙箱；样式作用域化 | **较好**（iframe 沙箱模式下） | CustomElement 标签 <code v-pre>&lt;micro-app&gt;</code> | 活跃，但 1.0 常青 RC |
| **single-spa** | 社区 | v6 稳定；v7.0.0-beta.13（2025-09）后无发版 | **无沙箱**——只做生命周期编排，隔离靠团队纪律 | **好**——官方推荐原生 ESM + import maps | `registerApplication` | 稳定可用，演进停滞 |
| **Module Federation** | 字节 Web Infra + Zack Jackson | core v2.6.0（2026-06），高频发版 | **无沙箱**——模块级共享与运行时加载 | 官方 @module-federation/vite 插件活跃 | host/remote 声明 | **事实主线** |

两个横向观察：

- **Vite/ESM 是第一分水岭**。国内存量项目的构建器大规模转向 Vite 之后，「沙箱能不能管住原生 ESM」把候选表切成了两半——这正是 qiankun 焦虑与 wujie 复活共同的背景板。
- **「沙箱路线」两派收敛**：靠 Proxy/with 改写脚本作用域的模拟派（qiankun、micro-app 默认模式），与靠 iframe 原生全局隔离的浏览器派（wujie、micro-app 的 iframe 模式）。模拟派兼容老产物但拦不住 ESM，浏览器派天然兼容 ESM 但要解决通信与渲染桥接——原理对比归[核心机制叶](../../mfe-mechanisms/)。

## 二、逐家点评：状态背后的含义

### 2.1 qiankun：存量最大，换代最难

事实清单：稳定版 v2.10.16 停在 2023-11；3.0 从 2023-09 的 rc.0 走到 2026-02 的 rc.21，**三年没有正式版**；2026 年活动明显恢复——rc.20/21 连发、探索 @scope 样式隔离、推出 create-qiankun 脚手架、2.10.17-beta（2026-06）。

3.0 难产的技术根源可以一句话说清：qiankun 的 JS 沙箱靠 `with + Proxy` 改写脚本作用域来劫持 `window` 访问，而**原生 ESM 的执行不经过这层改写**——Vite 开发态与默认产物都是 ESM，于是沙箱对其失效，兼容要靠社区插件把产物降回可改写形态，隔离随之打折。这就是国内语境里的「**Vite 之痛**」（细节与规避见 [qiankun 叶](../../qiankun/)）。

**决策含义**：webpack 存量系统 + 已有 qiankun 资产 → 继续用完全合理，2.x 是被大规模生产验证过的；全新 Vite 项目起手选 qiankun = 逆着生态阻力走，需要非常具体的理由。

### 2.2 wujie：iframe 沙箱路线的复活

wujie 曾沉寂近一年（1.0.29 停在 2025-07），2026-06 以 **v2.0 全新 iframe 沙箱**回归，一个月内连发 2.0.0/2.0.1/2.0.2/2.1.0 四版。路线优势在[与相邻方案的关系](./relations)已铺垫：JS 隔离交给浏览器原生 iframe——**不改写脚本，所以 ESM/Vite 天然兼容**；渲染走主文档 Web Component，体验不割裂；组件式接入对 Vue/React 宿主都顺手。

**决策含义**：Vite 技术栈 + 强隔离需求（接入低信任子应用、多版本冲突严重）→ 2026 年的首选评估对象。风险项也要如实记录：刚复活，**2.x 新沙箱接受生产检验的时间还短**，重仓前用自己的场景做压测与内存回收验证。

### 2.3 micro-app：组件化接入，常青 RC

京东 micro-app 的提交与发版保持月度活跃（rc.29 2026-01 → rc.32 2026-06），接入形态是五家里最轻的——像写一个 <code v-pre>&lt;micro-app name url&gt;</code> 标签。但 **1.0 版本号在 RC 阶段停留多年**，rc 序号已经排到 32。

**决策含义**：组件化接入的心智成本最低，适合「宿主是业务应用、顺手嵌几个子应用」的中等规模场景。采信前把心理价位摆正：你实际使用的是一个**长期 RC 的 1.0**（iframe 沙箱等关键能力都在其中），版本策略上保守的团队应按「实质稳定、名义 RC」评估，并锁定小版本。

### 2.4 single-spa：鼻祖的停滞与遗产

single-spa 定义了微前端框架的原语——生命周期协议（bootstrap/mount/unmount）、activity function、root config，qiankun 就构建在其上。现状两面：**v6 稳定**、周边生态（single-spa-vue/react、layout 引擎）成熟；**v7 卡在 beta**，2025-09 的 beta.13 之后再无发版。同时官方推荐架构已经演进为**原生 ESM + import maps**——浏览器原生能力承担模块加载与依赖共享，框架本体要做的事变少了。

**决策含义**：停滞不等于死亡——它要做的事本来就少，v6 + 原生 ESM 的组合今天依然能打；但要接受「不会有大演进」，且**无沙箱**意味着隔离全靠团队纪律（Geers 前缀理念的用武之地）。需要开箱即用的沙箱与样式隔离时,看国内三家。

### 2.5 Module Federation：从打包器特性到运行时体系

MF 的叙事在 2.0 完成关键一跃：从「webpack 5 的编译期特性」变成**独立于打包器的运行时体系**——`@module-federation/runtime` 承担远程加载与共享治理，webpack/Rspack/Vite 各有官方插件，文档站 module-federation.io，由**字节 Web Infra 团队与 MF 作者 Zack Jackson** 共同维护，core 仓库 v2.6.0（2026-06）保持高频发版。注意生态换代细节：早年社区常用的 originjs `vite-plugin-federation` 已停滞，**官方 @module-federation/vite 是现行方案**——搜到旧教程先看发布日期。

**定位辨析**：MF 解决的是**模块级共享与组合**（跨应用共享组件/逻辑、依赖版本协商），**不带沙箱与样式隔离**——它与 qiankun 类「应用级容器」不是同类竞品，更常是叠用关系（容器管编排隔离，MF 管依赖共享）。同栈同大版本的多团队（都是 React 18 或都是 Vue 3）直接用 MF 组合，是链路最短的微前端。webpack 侧配置实操见[构建工具章](/zh/frontend-toolchain/build/webpack/guide-line/expert)，体系细讲在 [Module Federation 叶](../../module-federation/)。

## 三、退场与边缘

| 方案 | 出品 | 状态（核于 2026-07） | 一句话判词 |
| --- | --- | --- | --- |
| **Garfish** | 字节 | 维护模式——v1.19.7（2026-01）低频修补 | 字节自己的资源已转投 MF/Rspack 生态，新项目勿入 |
| **icestark** | 阿里 ice-lab | 遗产态——release 停在 v2.7.3（2022-04） | 与 ice 框架绑定的一代方案，已淡出演进 |
| **Piral** | smapiot | 国际活跃 | 「微前端即插件」的门户框架，国内案例≈0，选它等于放弃中文社区支援 |
| **Luigi** | SAP | 国际活跃 | 企业门户导向、iframe 为主，SAP 生态外少见 |

**存量迁移提示**：跑在 Garfish/icestark 上的系统不必恐慌（它们不会一夜消失），但应停止追加投资，把 MF / 三主流列为迁移路标——微前端架构本身的「增量升级」收益，此刻正好用在自己身上。

## 四、新动向：平台化与标准化

- **Vercel Microfrontends**：平台侧组合正式商业化——多项目共享域名、path 路由、`microfrontends.json` 声明式配置，并按用量计费（Pro 计划每百万路由请求 2 美元、超出 2 个项目后每项目 250 美元/月）。信号很直白：**「微前端托管」成了可以直接购买的商品**，组合与路由下沉到平台层，应用层不再需要运行时容器。代价是与平台深度绑定。
- **Web Fragments**（Cloudflare 系）：把「片段级服务端组合」搬到边缘的新尝试，思路上是 SSI 的现代化转世——值得关注，尚未到生产重仓的成熟度。
- **Native Federation**：打包器无关、基于 import maps 的联邦实现（Angular 社区推动）——与 MF 2.0 的运行时化殊途同归，一句带过，细讲在 [Module Federation 叶](../../module-federation/)。

三条趋势线收拢：**其一**，组合职责在两头迁移——要么下沉运行时（MF runtime），要么上浮平台/边缘（Vercel、Web Fragments），中间层的「重型框架容器」空间被挤压；**其二**，浏览器原生能力（ESM、import maps、Web Components）持续吃掉框架职责——single-spa 的推荐架构演变就是缩影；**其三**，沙箱路线收敛为 iframe 原生隔离与 Proxy 模拟两派，前者因 ESM 兼容占据代际优势。

## 五、选型决策树

```text
Q0 要不要微前端？——先过判据页（多团队/渐进迁移/长生命周期）
│   过不了 → monorepo + feature flags + 更快编译器，到此为止
│
Q1 只需「同栈同大版本」的模块/组件跨应用共享？
│   是 → Module Federation 2.0（webpack/Rspack/Vite 官方插件）
│        （无沙箱诉求时链路最短；勿用已停滞的 originjs Vite 插件）
│
Q2 需要应用级容器（跨栈混跑 / 遗留接入 / 路由级切分）→ 看构建器：
│   ├─ webpack 存量为主
│   │    ├─ 已有 qiankun 资产/团队熟 → qiankun 2.x 续用（3.0 观望）
│   │    └─ 新建 → qiankun / micro-app 皆可，按接入形态偏好定
│   ├─ Vite/ESM 为主（第一分水岭）
│   │    ├─ 强隔离（低信任子应用/多版本冲突）→ wujie（iframe 沙箱）
│   │    └─ 组件式轻接入 → micro-app（开 iframe 沙箱模式）或 wujie
│   └─ 纯编排、无沙箱诉求、团队纪律强
│        → single-spa v6 + 原生 ESM + import maps
│
Q3 组合粒度只到页面/路径，且可接受平台绑定？
    是 → Vercel Microfrontends（托管组合）；关注 Web Fragments
```

三条使用须知：决策树只负责**第一轮收敛**，终选前必须拿**你自己的真实子应用**对两名候选做 POC——沙箱逃逸、样式冲突、构建产物兼容、内存回收，全是跑过才暴露的问题；分支之间可以组合（容器框架 + MF 共享依赖是常见叠法）；以及，任何一家的「难产/停滞/RC」标签都会随时间变化——本页数据核于 2026-07，重大决策前按[参考页](../reference)的链接自行复核最新 release。

## 小结

2026 年的微前端版图：国内三主流 qiankun（存量王者、3.0 三年难产、2026 恢复活动）、wujie（iframe 沙箱路线携 v2.0 复活）、micro-app（月度活跃的常青 RC），加上完成运行时化、由字节与 Zack Jackson 共同维护的 Module Federation 2.0 事实主线；single-spa v6 稳定但 v7 停在 beta，Garfish/icestark 退场，Piral/Luigi 活在国际，平台化（Vercel GA 商业化）与边缘组合（Web Fragments）开辟新前线。选型顺序恪守三问：先「要不要」，再「构建器与产物形态」（Vite/ESM 分水岭），最后才是框架特性对比与双候选 POC。全叶的概念、判据、模式、格局至此讲完——速查表与全部权威链接收拢在[参考](../reference)。
