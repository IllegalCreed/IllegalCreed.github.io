---
layout: doc
outline: [2, 3]
---

# 入门

> 基于微前端 2026 生态 · 核于 2026-07

## 速查

- 一句话：**微前端（Micro Frontends）= 把可独立交付的前端应用组合成一个更大整体的架构风格**（martinfowler.com）——关键词是「独立交付」与「组合」，不指代任何具体框架
- 术语史：2016 年底进入 **ThoughtWorks 技术雷达**；Geers 称其与 **Self-contained Systems** 一脉相承，早年叫「Frontend Integration for Verticalised Systems」
- 催生它的不是新技术而是规模：**前端巨石（Frontend Monolith）**——全量构建、**锁步发布（lockstep release）**、框架升级 stop-the-world、多团队互相踩脚
- 微服务的镜像：single-spa 直接定义为「**存在于浏览器里的微服务**」——独立仓库、独立 package.json、独立构建、独立 CI/CD
- 本质是**组织问题的技术解**：Geers 的端到端团队按业务使命**纵切**（数据库到 UI），取代按技术层**横切**的前端组/后端组
- **不是银弹**：Vercel 官方明说「微前端可能增加复杂度，先考虑 **monorepo（Turborepo）/ feature flags** / 更快的编译器」——判据与反判据见[适用判据与反判据](./guide-line/when-not-to-use)
- 实现光谱很宽：**iframe、SSI 服务端拼接、JS 渲染函数、Web Components、Module Federation** 都能承载微前端——分类法见[组合模式三分法](./guide-line/composition-patterns)
- 2026 国内选型口径：**qiankun / wujie / micro-app 三主流 + Module Federation**，**Vite/ESM 兼容是第一分水岭**；全景见 [2026 选型全景](./guide-line/landscape-2026)
- 本章结构：**通论两叶**（本叶管概念决策 + [微前端核心机制](../mfe-mechanisms/)管沙箱/隔离/通信原理）+ **五框架叶**（single-spa / qiankun / wujie / micro-app / Module Federation）
- 学习路径：**先概念（本叶）→ 再机制（核心机制叶）→ 最后框架（按选型结论深入 1~2 个）**——反着学会陷进某家 API 出不来

## 一、微前端一句话

martinfowler.com 上的长文给出的定义至今仍是最通用的口径：

> An architectural style where independently deliverable frontend applications are composed into a greater whole.
> ——一种把**可独立交付**的前端应用**组合**成一个更大整体的架构风格。

三个关键词各管一件事：

| 关键词 | 含义 | 不满足时的形态 |
| --- | --- | --- |
| **独立交付**（independently deliverable） | 每块有自己的仓库/构建/CI/CD，可单独发布到生产 | 拆了目录但同一次构建发布 = 模块化单体 |
| **组合**（composed） | 多块在运行时（或请求时）拼成一个产品，用户感知为整体 | 各自独立域名互跳 = 多个网站，不是微前端 |
| **架构风格**（architectural style） | 由属性与收益定义，不绑定实现技术 | 「用了 qiankun」不等于做对了微前端 |

single-spa 文档给了一个更工程化的镜像表述：「**微前端就是存在于浏览器里的微服务**（a microservice that exists within a browser）」——独立仓库、独立 `package.json`、独立构建配置、独立部署管道，微服务的组织学被原样搬进前端。对照着看更直观：

| 微服务世界 | 微前端里的对应物 | 关键差异（别照搬） |
| --- | --- | --- |
| 一个服务 | 一个微应用/子应用 | 服务有进程边界，子应用共享一个页面 |
| API 网关 | 容器/主应用的路由分发 | 网关转发请求，容器要管挂载与卸载 |
| 服务注册与发现 | 注册表 / import map | 前端「发现」发生在用户的浏览器里 |
| 进程隔离 | JS 沙箱 / iframe / Shadow DOM | 天然隔离 vs 人工模拟，强度差一个量级 |
| 服务间 RPC/消息 | 自定义事件 / props / URL | 通信越多，拆分越可疑（Fowler 同款告诫） |

表格右列就是那句必须补上的刹车：浏览器里**只有一个 DOM、一个 `window`、一张样式表级联**，隔离条件远比服务器上的进程边界苛刻——这正是[微前端核心机制](../mfe-mechanisms/)整叶要处理的难题，也是各框架差异的来源。

## 二、什么问题催生它

微前端不是被发明出来的酷技术，而是被**规模**逼出来的。一个前端巨石系统的日常大概是这样：

- 改一行按钮文案，CI 全量构建 20 分钟，回归测试跑整站；
- 发布要上「发布火车」：等所有团队的功能都就绪、过一轮 code freeze，一起上线——**最慢的团队决定所有人的节奏**；
- 想把 2019 年的框架版本升上来？涉及 40 万行代码，排期三个季度，期间新需求照收——于是永远排不上；
- 五个业务团队改同一个仓库，合并冲突与「谁动了我的公共组件」成为周会保留节目。

qiankun 文档把这条曲线概括为：单体应用随时间与人手增长，最终演变为难以维护的 **Frontend Monolith**——这在企业级 Web 应用里几乎是普遍宿命。Geers 则指出病根在组织形态：按**技术层横切**（前端组/后端组/运维组）时，任何一个特性都要跨团队协作、层层交接；微前端配套的解法是按**业务使命纵切**——每个团队从数据库到用户界面端到端负责一块业务，独立开发、独立上线。技术上的「拆」，本质是给组织上的「分」提供物理边界。

痛感可以量化——三个指标超线，才值得把微前端摆上桌面：

| 指标 | 健康线 | 巨石晚期的典型值 |
| --- | --- | --- |
| 全量构建时长 | 分钟级以内 | 15 分钟起步，CI 队列常态拥堵 |
| 发布节奏 | 各团队按需随时发 | 固定发布火车 + code freeze |
| 框架升级排期 | 一个迭代内消化 | 以「季度」为单位、常年排不上 |

反过来说也成立：**如果你没有这些痛**——单团队、单产品、技术栈统一、构建几十秒——微前端提供的每一分收益都用不上，而它的每一分成本（沙箱、通信、依赖治理、多管道运维）照付不误。这是[适用判据与反判据](./guide-line/when-not-to-use)整页的主题。

## 三、本章与本叶结构导览

本章「微前端框架」共七叶，按「概念 → 机制 → 框架」排列：

| 叶 | 定位 | 回答的问题 |
| --- | --- | --- |
| **微前端基础**（本叶） | 概念与架构决策 | 是什么/为什么/该不该用/怎么组合/2026 选谁 |
| [微前端核心机制](../mfe-mechanisms/) | 框架无关的原理层 | JS 沙箱、样式隔离、通信、依赖共享怎么实现，代价几何 |
| [single-spa](../single-spa/) | 生命周期编排鼻祖 | 生命周期协议、root config、import maps 工作流 |
| [qiankun](../qiankun/) | 国内存量最大 | 三沙箱、样式隔离、HTML entry、Vite 之痛 |
| [wujie](../wujie/) | iframe 沙箱路线 | iframe JS 沙箱 + WebComponent 容器、保活预加载 |
| [micro-app](../micro-app/) | 组件化接入 | CustomElement 标签接入、双沙箱模式 |
| [Module Federation](../module-federation/) | 模块联邦主线 | 联邦架构、shared 治理、MF 2.0 运行时生态 |

本叶八页各管一段：

| 页 | 回答的问题 |
| --- | --- |
| [微前端是什么与为什么](./guide-line/what-why) | 定义、四收益、五理念、四核心价值——三家信源的共识 |
| [适用判据与反判据](./guide-line/when-not-to-use) | 什么时候该用；Downsides、官方劝退论与性能反论 |
| [组合模式三分法](./guide-line/composition-patterns) | 构建时/服务端/客户端组合，各自的取舍与反模式 |
| [路由分发与容器模式](./guide-line/routing-shell) | URL 怎么分发给应用、容器该管什么、不该管什么 |
| [与相邻方案的关系](./guide-line/relations) | vs iframe/monorepo/BFF/模块化单体的边界 |
| [2026 选型全景](./guide-line/landscape-2026) | 谁还活着、谁在退场、决策树怎么走 |
| [参考](./reference) | 全叶速查表与权威链接 |

边界纪律：本叶**不出现任何框架接入代码与插件配置**——Module Federation 的 webpack 配置见[构建工具章](/zh/frontend-toolchain/build/webpack/guide-line/expert)，Vue 项目挂微前端的实操见 [Vue 章](/zh/frontend-framework/ui/vue/guide-line/other)，iframe 标签与安全属性见 [HTML 章](/zh/base/language/html/html-media/guide-line/iframe-embedding)与[浏览器安全章](/zh/base/browser/browser-security/guide-line/iframe-sandbox-clickjacking)。

## 四、学习路径建议

先修只有两样，缺了会在机制叶卡住：浏览器的同源/隔离常识（[浏览器安全叶](/zh/base/browser/browser-security/)有全景）、以及你团队现用构建器的产物形态（webpack chunk 还是原生 ESM）——后者直接决定 2026 年你能选哪半张候选表。

按角色给三条路径：

- **架构决策者**（要回答「上不上、选哪家」）：[what-why](./guide-line/what-why) → [when-not-to-use](./guide-line/when-not-to-use) → [landscape-2026](./guide-line/landscape-2026)，三页读完即可进入 POC；[参考](./reference)的判据清单与生态状态表适合直接进评审材料。
- **一线工程师**（要落地或接手存量系统）：顺读本叶全部 → [微前端核心机制](../mfe-mechanisms/)（沙箱/隔离/通信是排错的底层地图）→ 按选型结论深入对应框架叶。
- **快速建立概念**（面试/技术雷达）：[参考](./reference)的五张表 + [what-why](./guide-line/what-why)、[composition-patterns](./guide-line/composition-patterns) 两页。

无论哪条路径，请守住一个顺序感：**概念上的「为什么拆、按什么拆」永远先于「用什么拆」**——选型页放在最后不是因为它不重要，而是因为跳过前五页直接看框架对比，得到的只是一份没有判断依据的榜单。

顺手纠掉四个最常见的初学误区，正文里都会给出出处与论证：

| 误区 | 事实 | 展开 |
| --- | --- | --- |
| 「微前端就是 qiankun」 | 微前端是架构风格，qiankun 只是实现之一；iframe/SSI/MF 拼的也是微前端 | [what-why](./guide-line/what-why) |
| 「拆得越细越好」 | 拆分粒度对齐团队边界，不对齐组织的拆分只产生通信成本 | [when-not-to-use](./guide-line/when-not-to-use) |
| 「iframe 已经过时」 | 2026 年 iframe 作为**隔离原语**被 wujie 路线重新启用，过时的是「拿它当渲染容器」 | [relations](./guide-line/relations) |
| 「上了微前端自然就解耦了」 | 共享运行时/状态/领域模型的做法会原样偿还收益，解耦靠纪律不靠框架 | [what-why](./guide-line/what-why) 五理念 |

先从定义与动机讲起：[微前端是什么与为什么](./guide-line/what-why)。
