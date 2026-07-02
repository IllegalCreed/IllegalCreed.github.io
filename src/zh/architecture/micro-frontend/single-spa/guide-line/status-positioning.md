---
layout: doc
outline: [2, 3]
---

# 现状与定位

> 基于 single-spa v6 · 核于 2026-07

## 速查

- **稳定版停在 v6.0.3（2024-09-29）**，长期占据 npm `latest` 标签；v6.0.0 早在 2023-12 发布，v6 线一年只出到 `.3`——**成熟、少变**
- **v7 长期卡 beta**：`7.0.0-beta.0`（2024-09-30）到 `7.0.0-beta.13`（2025-09-22）走了一年，**此后无新版本**（截至 2026-07 核对 GitHub Releases / npm）——**没有稳定 v7、势头停滞**
- 读法：single-spa 核心**已经够用**，v7 更像渐进改进而非重写；「长期 beta 且停更」侧面说明**无紧迫升级压力**，生产上 **v6 仍是正确选择**
- **作为 qiankun 底座**：qiankun 直接把 single-spa 作为依赖，复用它的**生命周期编排 + reroute 路由**，再补上 single-spa 故意不做的三样——**沙箱、样式隔离、HTML entry**
- 分层等式：**qiankun ≈ single-spa（编排）+ import-html-entry（加载）+ Proxy/快照沙箱（JS 隔离）+ Shadow DOM/属性改写（CSS 隔离）**
- **直接用 single-spa 的代价**：全局污染、样式互踩、子应用给 HTML 而非 JS 模块——这些**都要你自己处理**；single-spa 只保证「按路由把导出生命周期的模块装上/卸下」
- **直接用 single-spa 的场景**：全面 ESM + import maps、子应用同栈自律不需强隔离、要极致控制加载/路由/共享、自建底座
- **用 qiankun 的场景**：要开箱即用的沙箱 + 样式隔离、子应用只愿给 HTML 地址、团队大要降低互相踩坑概率（国内主流）
- **2026 选型位置**：single-spa 是「编排层标杆 / 底座」，直接选它的多是有平台化诉求的团队；多数业务团队用它的封装（qiankun）或换 wujie/micro-app/Module Federation
- 一句定性：**single-spa 不是过时，而是「稳定到不需要频繁更新」**——它把自己钉死在「只编排」这件事上，隔离与加载的演进交给上层，所以自身可以长期不动

## 一、版本现状：v6 稳定、v7 长期 beta

把 npm 与 GitHub Releases 的时间线摆出来，现状一目了然（截至 2026-07 核对）：

| 版本 | 发布时间 | 标签 | 说明 |
| --- | --- | --- | --- |
| `6.0.0` | 2023-12-03 | — | v6 首发 |
| `6.0.1` | 2024-02-26 | — | 补丁 |
| `6.0.2` | 2024-09-12 | — | 补丁 |
| **`6.0.3`** | **2024-09-29** | **`latest`** | **当前稳定版**，长期未变 |
| `7.0.0-beta.0` | 2024-09-30 | `beta` | v7 beta 起点 |
| … | 2025 全年 | `beta` | beta.1 ~ beta.12 陆续 |
| **`7.0.0-beta.13`** | **2025-09-22** | **`beta`** | **最新 beta，此后无新版本** |

两个事实：**其一，稳定线停在 v6.0.3、且一整年只出三个补丁**——这是「成熟且少变」的典型形态；**其二，v7 从 2024-09 进 beta，历经 13 个 beta 到 2025-09，之后再无发布**——没有正式 v7，且开发势头在 2025-09 后停滞。

## 二、怎么读「长期 beta 且停更」

「v7 卡 beta 一年后停更」听起来像项目要黄，但对 single-spa 这种**定位极窄**的库要换个角度读：

- **核心已经够用**。single-spa 只做生命周期编排 + reroute，这套 API 从 v5 到 v6 基本稳定，能加的边角料有限——v7 更像渐进打磨，不是重写。
- **无紧迫升级压力**。正因为它不碰沙箱/样式/加载这些「快速演进」的领域（那些在 qiankun/wujie/MF 层），它的核心可以长期不动。**长期 beta 且停更，恰恰反映「没有非升不可的理由」**。
- **生产结论**：2026 年上 single-spa，**用 v6.0.3（`latest`）**是正确选择，不必等 v7、也不必用 beta。

需要警惕的是**生态活跃度**——编排层稳定不等于周边（适配器、import-map-deployer 等）都持续维护，选型时应实际核对所依赖的适配器版本与 issue 活跃度，而非只看核心包。

**自行核对现状**（本页数据的复现方式，选型前建议亲跑一遍，别只信二手结论）：

```bash
npm view single-spa dist-tags   # 看 latest / beta / 各 x 标签当前指向
npm view single-spa time --json # 看每个版本的真实发布时间，判断是否停更
```

再配合 [GitHub Releases](https://github.com/single-spa/single-spa/releases) 看有无正式 v7、最后一次发布距今多久——「核心包停更」要结合「它定位极窄」一起读，别单看时间戳就下「已死」的结论。同理，`single-spa-vue`/`single-spa-react`/`single-spa-angular` 各自的版本与维护状态要**分别核对**，它们与核心包不同仓、不同节奏。

## 三、作为 qiankun 底座的意义

single-spa 在中文微前端世界最重要的身份，是 **qiankun 的底座**。qiankun 并没有重新发明路由编排——它**直接依赖 single-spa**，复用其**生命周期协议**与 **reroute 路由分发**，然后补上 single-spa 刻意留白的三样能力：

```text
┌─────────────────────────── qiankun ───────────────────────────┐
│  HTML entry（import-html-entry：吃子应用 HTML，解析资源清单）      │
│  JS 沙箱（Proxy / 快照：防全局污染）                              │
│  CSS 隔离（Shadow DOM / 属性改写：防样式互踩）                     │
│  ┌──────────────────── single-spa（底座）─────────────────────┐  │
│  │  生命周期编排（bootstrap/mount/unmount）                     │  │
│  │  reroute 路由分发（activity function 判定谁激活）             │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

于是有那条常被引用的分层等式：**qiankun ≈ single-spa + import-html-entry + 沙箱 + 样式隔离**。理解这一层关系有实际价值——qiankun 的路由/生命周期问题，根子往往在 single-spa 的机制里；反过来，读懂 single-spa 就等于读懂了 qiankun 的一半。这些补出来的隔离机制通论见[微前端核心机制](../../mfe-mechanisms/)，qiankun 的完整封装见 [qiankun 叶](../../qiankun/)。

## 四、直接用 single-spa vs 用 qiankun

「只编排、不隔离」是 single-spa 的定位，也是直接用它的**代价清单**。single-spa 只保证一件事：**按路由把「导出生命周期的模块」装上/卸下**。以下这些它一概不管，直接用就得自己扛：

| single-spa 不做的事 | 直接用的后果 | qiankun 怎么补 |
| --- | --- | --- |
| JS 沙箱 | 子应用全局变量/事件/定时器互相污染 | Proxy / 快照沙箱自动隔离 |
| 样式隔离 | 两个子应用样式互相覆盖 | Shadow DOM / 属性改写 |
| HTML entry | 子应用必须改造成 JS 生命周期模块 | import-html-entry 直接吃 HTML |
| 加载器脚手架 | 自己搭 import maps + overrides + deployer | 内置加载，`registerMicroApps` 开箱即用 |

据此的选型判据：

- **直接用 single-spa**：已全面 ESM + import maps；子应用**同技术栈、团队自律**、不需要强隔离；要**极致控制**加载/路由/依赖共享；在做平台化、**自建微前端底座**。
- **用 qiankun**（或 wujie/micro-app）：要**开箱即用**的沙箱 + 样式隔离；子应用只愿给 **HTML 地址**、不想改造；团队规模大，要**降低互相踩坑**的概率。国内业务团队多数落在这一档。

## 五、2026 选型位置

放到 2026 微前端全景里，single-spa 的坐标是**「编排层标杆 / 底座」**而非「拿来即用的业务框架」：

- 直接选 single-spa 的，多是**有平台化诉求、愿意自建能力**的团队；
- 多数业务团队用它的**封装**——国内是 **qiankun**（single-spa 底座）；要更强隔离/更好体验则转向 **wujie**（iframe 沙箱）、**micro-app**（低侵入）；
- 若核心诉求只是**模块与依赖共享**、不需要页面级隔离，则是 **Module Federation** 的领域（与 single-spa 互补，甚至可共用）。

一句定性收束：**single-spa 不是过时，而是「稳定到不需要频繁更新」**——它把自己钉死在「只编排」这一件事上，把快速演进的隔离与加载交给上层，因此核心可以长期不动、v6 长青。选型的完整全景（含各框架横向对比）见[微前端基础·2026 选型全景](../../mfe-basics/guide-line/landscape-2026)。

## 六、与 Module Federation：不是竞品，可共用

选型时最容易被误当成「二选一」的一对，是 **single-spa 与 Module Federation（MF）**。但它们**不在同一层、也不冲突**——single-spa 官方推荐架构文档里把话讲得很清楚：**「Module Federation 是微前端的一种性能技术，二者互补、可以一起用（They complement each other well and can be used together）」**。

理由是它们回答的问题不同：

| 关注点 | single-spa | Module Federation |
| --- | --- | --- |
| 主职责 | **生命周期编排 + 路由分发**（谁在什么路由下挂载） | **模块与依赖的运行时共享**（怎么把远程模块/共享库拉进来） |
| 抽象单位 | application / parcel（一整块可挂载的 UI） | expose 出去的**模块**（可细到一个组件/函数） |
| 依赖共享 | externals + import maps（集中裁定） | `shared`（运行时 semver 协商） |
| 是否管隔离 | 否 | 否 |

所以一种真实的组合是：**用 single-spa 做「哪个子应用在哪个路由激活」的编排骨架，用 MF 做「子应用之间的模块/依赖共享」**——各司其职。single-spa 官方甚至把 MF 与自家的 import maps 并列为可选的依赖共享手段。两者的机制层横向对比（import maps vs MF shared vs 不共享）见[微前端核心机制·依赖共享](../../mfe-mechanisms/guide-line/dependency-sharing)，MF 自身的完整封装见 [Module Federation 叶](../../module-federation/)。

## 小结

single-spa 的现状是「v6.0.3 长期稳定、v7 历经 13 个 beta 后于 2025-09 停更、无正式 v7」——对一个定位极窄的编排层而言，这是「成熟到不需要频繁更新」而非衰败，生产上用 v6 即可。它最重要的身份是 qiankun 的底座：qiankun 复用它的生命周期编排与路由，再补上它刻意不做的沙箱、样式隔离与 HTML entry。直接用 single-spa 的代价就是这三样要自己扛，因此它适合有平台化诉求、愿自建底座的团队，多数业务团队则用它的封装。至此 single-spa 叶的机制与定位讲完，各类对比表汇总见[参考](../reference)。
