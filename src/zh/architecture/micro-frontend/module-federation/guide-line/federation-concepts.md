---
layout: doc
outline: [2, 3]
---

# 联邦概念与心智模型

> 基于 Module Federation 2.0（v2.6 2026-06） · 核于 2026-07

## 速查

- MF 官方定义：**「JavaScript 应用去中心化的架构模式（类比服务端微服务）」**——每个应用是一个可独立部署的节点，运行时互相加载对方导出的模块。
- **remote（生产者/Provider）**：`exposes` 导出模块，产出一张**入口清单**（`remoteEntry.js` / `mf-manifest.json`）。**host（消费者/Consumer）**：`remotes` 声明来源，运行时按清单拉模块。
- **双向联邦**：同一应用可**同时是 host 与 remote**——无中心编排者、无 shell/child 层级；A 用 B 的组件、B 也能用 A 的工具，是**对等网络**而非树。
- **模块级复用**（MF）：共享**一个组件/函数/store**；**应用级复用**（qiankun/wujie）：挂载**整个子应用**。粒度差一个数量级，决定了隔离、通信、部署的全部差异。
- **remoteEntry / manifest 是「目录」不是「代码」**：它先告诉 host「有哪些 expose、依赖哪些 shared、chunk 在哪、类型在哪」，host 据此**按需**再拉真正的模块 chunk——两段式加载。
- **mf-manifest.json（2.0 新增）**比裸 `remoteEntry.js` 多带**结构化元信息**（exposes/shared/remotes/chunks/type），使版本管理、类型同步、预加载、DevTools 成为可能。
- **构建时组合**：构建插件把 `import("shop/Button")` 改写成「查 shared scope + 拉 remoteEntry」的运行时调用——remote 列表**编译期写死**。
- **运行时组合**：用 Runtime SDK（`registerRemotes`）在**运行时**注册 remote——列表可来自接口/配置中心，实现灰度、动态上下线（见 [MF 2.0 运行时化](./mf2-runtime)）。
- **联邦 ≠ 编排**：single-spa 管「谁在什么路由 mount/unmount」（应用级编排），MF 管「谁能 import 谁的模块」（模块级共享）——两者正交、可叠加。
- **共享作用域（share scope）**是运行时的「公共依赖货架」：各 remote 把自带的 React 副本注册进去，用时按 semver 协商取哪一份（治理见 [shared 版本治理](./shared-governance)）。
- **无沙箱是结构性事实**：联邦模块执行在宿主同一个 realm/`window` 里，因此能直接共享 React 实例与 context——这正是「模块级」得以成立的前提，也是「需自律」的根源。
- 配置语法（`exposes`/`remotes` 字段怎么写）见[构建工具章 · webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)，本页只讲这些概念**在架构上意味着什么**。

## 一、去中心化：MF 的第一性原理

MF 官方把自己定义为**「JavaScript 应用去中心化的架构模式，类似服务端的微服务」**。这句类比是理解一切的钥匙：微服务里没有「主服务」，每个服务独立部署、通过网络互相调用；MF 里也**没有「主应用」**，每个前端应用独立构建部署、通过运行时加载互相调用**模块**。

这与 [single-spa](../../single-spa/) 的**中心化编排**形成鲜明对比：single-spa 有一个 root-config 作为「大脑」，注册所有子应用、按路由决定谁 mount。MF 没有这个大脑——host 直接点名「我要 `shop` 这个 remote 的 `./Button`」，不需要谁在中间登记调度。**去中心化**因此带来两个结构后果：**双向**（下一节）与**按需**（第四节的两段式加载）。

## 二、host / remote 与双向联邦

| 角色 | 官方别名 | 声明什么 | 产出/行为 |
| --- | --- | --- | --- |
| **remote** | Provider / 生产者 | `exposes`：我导出哪些模块 | 构建出 `remoteEntry.js` / `mf-manifest.json` 入口清单 |
| **host** | Consumer / 消费者 | `remotes`：我从哪些 remote 加载 | 运行时取清单 → 按需拉模块 chunk → 执行 |

关键在于**这两个角色不是互斥的身份，而是可叠加的能力**。一个应用可以同时 `exposes`（当 remote）和 `remotes`（当 host）——于是出现**双向联邦**：

```text
        exposes ./Header ─────────────►
  App A                                   App B
        ◄───────────── exposes ./Chart
  （A 用 B 的 Chart，B 也用 A 的 Header —— 对等，无主从）
```

对比 single-spa 那种「root-config 在上、子应用在下」的**树状层级**，MF 是**对等网络**（peer network）。这在架构上意味着：**没有天然的「壳应用」**——谁做页面骨架、谁负责路由，MF 本身不规定，需要你在架构层自己约定（常见做法：选一个应用当 host 兼壳，或叠加 single-spa 做编排层）。

## 三、模块级复用 vs 应用级复用

这是 MF 与 qiankun 系最本质的分界，把它拆到三个层面看：

| 层面 | 模块级复用（MF） | 应用级复用（qiankun/wujie） |
| --- | --- | --- |
| **复用单位** | 一个模块：组件、hook、工具函数、store | 一个子应用：带自己路由的完整 SPA |
| **加载动作** | 跨应用 `import()` 一个导出 | `mount(container)` 挂载整应用 |
| **谁在同一 realm** | 联邦模块与宿主**共享 `window`/React 实例** | 子应用被沙箱**隔离**在代理 `window` 里 |
| **通信** | **直接函数调用 / 共享内存**（同 realm） | 跨沙箱：props / 全局状态 / 事件总线 |
| **去重依赖** | shared scope 运行时协商，**真正共用一份实例** | 各自打包或 import maps（实例通常不共享） |

一句话：**MF 让两个应用「像同一个应用里的两个模块」那样共享代码**（同 realm、可直接调用、共用依赖实例）；**qiankun 让两个应用「像两个隔离的租户」那样共存于一页**（沙箱、隔离、通过约定接口通信）。这也解释了为什么 MF 能做到 qiankun 做不到的事——**共享 React context、共用一个 Redux store 实例**：因为它们本就在同一个 realm。代价是**失去隔离**，见[与应用级方案的选型](./vs-qiankun-selection)。

## 四、remoteEntry / manifest：联邦的「目录」

host 加载一个 remote 的模块，是**两段式**的，理解这一点能澄清很多误解：

```text
第 1 段（取目录）：host 运行时 fetch remote 的入口清单
    remoteEntry.js  或  mf-manifest.json
    └─ 清单里写着：这个 remote exposes 了 ./Button ./Chart…
                   它 shared 了 react@18.3 react-dom@18.3…
                   各 chunk 的 URL、（2.0）类型文件地址

第 2 段（按需取货）：host 真的 import("shop/Button") 时
    └─ 才去拉 ./Button 对应的 chunk 并执行
       shared 依赖先查 share scope，能复用就不重复下载
```

所以 **remoteEntry 不是「一大包代码」，而是「一张导出目录 + 加载器」**。它的架构价值在于**解耦部署**：remote 重新部署、清单 URL 不变，host 下次运行时自动拿到新版本的模块——**无需重新构建 host**。这正是「独立部署」在 MF 里的落地方式。

**mf-manifest.json（2.0 引入）** 是这张目录的升级版：裸 `remoteEntry.js` 只是个能自解释的 JS 入口，而 mf-manifest.json 是**结构化 JSON**，额外携带 `exposes`/`shared`/`remotes`/`chunks`/`type` 等元信息。正是这份结构化清单，让 **类型联邦、预加载、DevTools、版本管理** 成为可能（见 [MF 2.0 生态](./mf2-ecosystem)）。

> **注意**：`remoteEntry.js` 的文件名、`exposes` 的键名、清单 URL 如何配置，属于**插件配置**——见 [webpack 深入](/zh/frontend-toolchain/build/webpack/guide-line/expert)。本页只强调它在架构上扮演「运行时目录」这一**角色**。

## 五、运行时组合 vs 构建时组合

同样是「host 加载 remote」，发生的时机可以在**构建时**也可以在**运行时**，这是 MF 2.0 打开的关键自由度：

| | 构建时组合 | 运行时组合 |
| --- | --- | --- |
| **remote 列表来自** | 构建配置（编译期写死） | Runtime SDK 运行时注册（`registerRemotes`） |
| **改动 remote 需** | 重新构建 host | **不用重构**，改配置/接口即可 |
| **典型能力** | 静态、可 tree-shake、类型好推 | 灰度发布、A/B、动态上下线、按环境切源 |
| **心智** | 「编译期就把 remote 织进依赖图」 | 「运行期像插件一样装载 remote」 |

MF 1.0（webpack 时代）以**构建时**为主——`remotes` 写在配置里。MF 2.0 把**运行时**也做成一等公民：`@module-federation/enhanced/runtime` 的 `createInstance` + `registerRemotes` 允许 remote 清单**运行时才确定**，甚至来自服务端接口。架构上这意味着：**「哪些微前端在线、用哪个版本」可以变成运行期决策**，而不是构建期决策——这是 MF 从「打包技术」升维成「微前端运行时」的核心（展开见 [MF 2.0 运行时化](./mf2-runtime)）。

## 六、正交的三个词：联邦 / 编排 / 共享

初学最容易把三个词混成一团，其实它们**正交**、各管一层，看清了整个微前端的坐标就立起来了：

| 词 | 管什么 | 谁的本命 |
| --- | --- | --- |
| **编排（orchestration）** | 谁在什么路由 mount/unmount **整应用** | single-spa / qiankun |
| **联邦（federation）** | 谁能 import 谁的**模块** | Module Federation |
| **共享（sharing）** | 一份依赖如何被多方复用 | shared / import maps |

- **编排 ⟂ 联邦**：编排在**应用级**决定「装谁」，联邦在**模块级**决定「谁能引谁的模块」——正因正交，二者能叠加（编排层用 single-spa、模块共享用 MF）。
- **联邦 ⊃ 共享的一种实现**：MF 的 `shared` 是「共享」的一种运行时实现，import maps 是另一种；「共享」本身是比 MF 更大的话题（三路线通论见[依赖共享三路线](../../mfe-mechanisms/guide-line/dependency-sharing)）。
- 记牢这张表，就不会再纠结「MF 和 qiankun 谁替代谁」——它们分别是**联邦**与**编排**的代表，压根不在同一层（选型见[与应用级方案的选型](./vs-qiankun-selection)）。

## 小结

MF 的心智模型立在「去中心化」这块基石上：没有主应用，只有可互相加载模块的对等节点。host/remote 是可兼任的能力而非身份，因而支持**双向联邦**；复用单位是**模块**而非**应用**，因而联邦模块与宿主同处一个 realm、能直接共享依赖实例与 context（也因此**无沙箱、需自律**）；remoteEntry/manifest 是运行时的**目录**，两段式加载解耦了 remote 与 host 的部署；组合时机可**构建时**也可**运行时**，后者是 2.0 的关键升维。这套概念里，**跨应用共享依赖**的裁决被搬到了运行时——它带来的治理问题，是下一页的主题：[shared 版本治理](./shared-governance)。
