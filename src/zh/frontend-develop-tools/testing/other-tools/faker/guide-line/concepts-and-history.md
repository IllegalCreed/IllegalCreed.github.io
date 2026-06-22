---
layout: doc
outline: [2, 3]
---

# 概念与历史

> 基于 @faker-js/faker v10 编写

## 速查

- Faker 生成「**逼真但虚假**」数据，用于单元测试 / 性能测试 / Demo / 原型 / 无后端开发
- **不是边界 / 对抗输入生成器**：造的是正常分布的逼真数据，找极端值边界 bug 要用 fast-check
- **2022-01 事件**：原作者 **Marak Squires** 蓄意破坏自己的 `faker.js`（及 `colors.js`），导致海量应用崩溃
- 社区随即在 GitHub 组织 **`@faker-js/faker`** 下建立维护 fork，组建团队接管——这才是今天该用的包
- 现代包名 **`@faker-js/faker`**（带 scope）；裸 `faker` 已废弃 / 不可信
- 当前 **v10.5.x**，要求 **Node 20+**、**ESM-only**

## 是什么

Faker 是一个生成「逼真但虚假」（fake but reasonable）数据的库。官方原话：

> Faker is a popular library that generates fake (but reasonable) data that can be used for things such as: Unit Testing, Performance Testing, Building Demos, Working without a completed backend.

它的关键定位是「**逼真**」——生成的人名、邮箱、地址看起来就像真实用户的数据，落在「正常」分布里，而**不是**刻意的极端 / 边界值。

## 用途

| 场景 | 说明 |
| ---- | ---- |
| **单元测试 / 快照测试** | 造测试 fixture、工厂对象，省去手写一堆假数据 |
| **性能测试** | 批量造大数据集压测（注意控制 `count`，几万条会耗时） |
| **构建 Demo / 原型** | 用逼真数据填充界面，演示更真实 |
| **无后端开发** | 后端接口未就绪时，前端先用假数据把列表 / 表单 / 卡片跑通——与 Vue 3 前端开发高度契合 |

> 边界提醒：Faker **不会**主动探测空串 / `0` / `NaN` / 超长 / Unicode / 负数等极端输入。要验证「对所有输入都成立的性质」并自动收缩最小反例，应该用属性测试库 fast-check（二者目的不同、互补不互斥，详见 [测试实战](./testing-practice.md)）。

## 历史：原版 `faker` 被废弃 → 社区 fork `@faker-js/faker`

这是 Faker 生态里**最该讲清的史实**，也是「为什么包名带 scope」的根源。

- **起源**：Faker 最初是 Perl 库，后被移植到 JavaScript（也有 Ruby / Java / Python 版本）。
- **2022-01-04**：原作者 **Marak Squires** 蓄意破坏（官方公告原话 "went rogue and acted maliciously"）。他往自己维护的 `faker.js`（及 `colors.js`）植入破坏性代码并废弃 / 删库，导致**成千上万依赖它的应用崩溃**。业界俗称「colors.js / faker.js 事件」，据 The Verge、BleepingComputer 等报道，破坏手法是在入口注入死循环 + ASCII 乱码输出。
- **社区响应**：依赖 Faker 的工程师在 GitHub 组织 **`@faker-js/faker`** 下建立**社区维护的 fork**，组建约 8 人维护团队接管开发。
- **2022-01-14**：新团队发布公告，并对历史赞助资金做了「principled」处理（新建 `fakerjs-legacy` collective 转移旧捐款）。
- 事件被 The Verge、BleepingComputer、ZDNet 等大量报道，成为开源供应链安全的标志性案例。

> ⚠️ 纠偏要点：**今天 npm 上不带 scope 的旧 `faker` 已废弃 / 不可信**；正确的现代包是带 scope 的 **`@faker-js/faker`**。任何教程 / 题目里出现裸 `npm install faker` 都是错误 / 过时写法。

## 版本与运行环境

- **当前大版本线 v10.x**（撰写时核到 v10.5.0，2026-06-17 发布；后续可能有 v10.5.x 补丁，但大版本与关键 API 结论不变）。
- **Node.js 要求**：v10 需 **Node 20+**（精确下限 v20.19.0 / v22.13.0 / v24.0.0；v18 已不支持）。
- **ESM-only**：v10 起包为纯 ESM；CommonJS 项目可经 Node 的 ESM-require 使用，但需 Node v20.19+ / v22.13+。
- **TypeScript**：`moduleResolution` 需为 `"Bundler"` / `"Node20"`（需 TS 5.9+）/ `"NodeNext"`。

> 历代大版本伴随多次破坏性改名（`name→person`、`address→location`、`datatype.number→number.int`、`random` 整模块移除、`userName→username` 等），跟着旧教程很容易踩坑——完整对照见 [模块与 API](./modules-api.md)。
