---
layout: doc
outline: [2, 3]
---

# 入门：scale-to-zero 与三大 Serverless DB

> 基于 Neon / PlanetScale / Turso · 核于 2026-08

## 速查

- **Serverless DB 定义**：无需预置实例、按用量计费、能随负载自动伸缩（甚至缩到零）的托管数据库——空闲零成本、有请求自动唤醒。
- **为什么需要**：Serverless 计算（Lambda/Workers）已经无服务器，**数据库也得无服务器**，否则常驻 DB 实例的费用与运维会吞噬 Serverless 红利。
- **scale-to-zero**：空闲时把计算节点挂起（不计费），有连接/请求时毫秒到秒级唤醒。开发/测试/低流量环境几乎零成本。
- **三大主流**：①**Neon**（云原生 Postgres，存算分离 + DB branching）；②**PlanetScale**（云原生 MySQL，基于 Vitess 分片）；③**Turso**（边缘 SQLite，libSQL）。
- **Neon**：存算分离——存储在对象存储（S3-like）+ 计算节点（无状态）。支持 scale-to-zero（秒级挂起/唤醒）、**DB branching**（像 git 分支数据库，秒级创建，每个 PR 一个副本）、完整 PG 生态。
- **PlanetScale**：基于 **Vitess**（YouTube 在用的 MySQL 分片层）。强项是**水平分片**（自动拆分大表到多节点）与 **schema 迁移工作流**（分支 + deploy requests）。**无外键约束**、跨分片事务受限。
- **Turso**：基于 **libSQL**（SQLite 开源 fork），数据复制到全球边缘节点**就近读**，每个客户端可有一个**嵌入式副本**（进程内 SQLite），超低延迟读，适合读多写少 + 全球分布。
- **计费模型**：各家不同——Neon 按计算时长 + 存储；PlanetScale 按行读 + 行写 + 存储；Turso 按行读 + 存储 + 副本数。
- **唤醒延迟（冷启动）**：scale-to-zero 后首次请求有冷唤醒——Neon 几百 ms-数秒（要拉起计算节点）；Turso 嵌入式副本无此问题；PlanetScale 不强调 scale-to-zero。
- **进阶顺序**：[Neon 与 PlanetScale](./guide-line/neon-and-planetscale) → [Turso 与选型对比](./guide-line/turso-and-selection) → [参考](./reference)。

## 一、为什么需要 Serverless DB

Serverless 计算解决了"应用层无服务器"，但数据库仍是痛点：

```
Serverless 计算（Lambda/Workers）    传统托管 DB（RDS/Aurora Provisioned）
┌──────────────────────────┐        ┌──────────────────────────┐
│ 按请求自动扩缩           │        │ 预置固定实例              │
│ 空闲零成本               │   ←→   │ 24/7 付费（即使空闲）     │
│ 无运维                   │        │ 手动扩缩、备份、补丁      │
└──────────────────────────┘        └──────────────────────────┘
   计算层省钱了                          数据库层仍贵且要运维
```

- **痛点**：一个低流量应用，Lambda 每月 $1，但 RDS 最小实例每月 $15——**数据库吃掉了 Serverless 节省的钱**。
- **Serverless DB 的承诺**：把数据库也变成"按用量付费、空闲零成本、自动伸缩"——与 Serverless 计算形成完整闭环。
- **核心能力**：①scale-to-zero（空闲挂起）；②按用量计费（按行/按存储/按计算）；③自动伸缩（无需手动加实例）；④HTTP API（适配 Serverless 函数的连接模型）。

## 二、三家概览

| | **Neon** | **PlanetScale** | **Turso** |
| --- | --- | --- | --- |
| 数据模型 | **Postgres** | **MySQL** | **SQLite**（libSQL） |
| 底层技术 | 存算分离（对象存储 + 计算节点） | **Vitess**（MySQL 分片层） | libSQL（SQLite fork）+ 边缘复制 |
| 杀手锏 | **DB branching**（git 式分支） | 水平分片 + schema 迁移工作流 | **边缘就近读 + 嵌入式副本** |
| scale-to-zero | ✅（秒级挂起/唤醒） | ❌（不强调） | ✅（嵌入式副本无冷启动） |
| 一致性 | 强一致（PG） | 强一致（单分片），跨分片受限 | 读副本最终一致，主节点强一致 |
| 适合 | PG 应用、preview 环境、中小规模 | MySQL 大规模、需分片 | 全球读多写少、边缘低延迟 |

## 三、scale-to-zero：空闲零成本

scale-to-zero 是 Serverless DB 的核心卖点——**没有请求时把计算节点挂起，不计费**：

- **Neon**：计算节点（compute）无状态，空闲超过阈值（如 5 分钟无活动）自动挂起（suspend），存储仍在对象存储。下次连接时**冷唤醒**（拉起计算节点 + 加载缓冲），约几百 ms - 数秒。
- **Turso**：数据复制到边缘节点，且支持**嵌入式副本**（客户端进程内跑 SQLite）——读直接走本地副本，无冷启动；写走主节点同步。
- **PlanetScale**：不强调 scale-to-zero（计算节点常驻），靠按行计费 + 自动伸缩控制成本。
- **唤醒延迟是痛点**：scale-to-zero 节省了钱，但首次请求的冷唤醒影响延迟敏感场景。解法：①keep-alive（定时 ping 保持 warm）；②把对延迟敏感的库设为不挂起（Neon 的 scale-to-zero 可配置/关闭）。

## 四、DB branching：像 git 一样分支数据库

**Neon** 和 **PlanetScale** 都支持 **DB branching**——这是 Serverless DB 相对传统 DB 的革命性能力：

```
main 分支（生产数据库）
   │
   ├── feature-login 分支（秒级创建，copy-on-write，几乎不占额外存储）
   │      └── 给 PR #42 的 preview 环境用
   │
   └── fix-bug 分支
          └── 给 PR #43 用，可独立跑迁移测试
```

- **copy-on-write**：分支不复制全量数据，只记录差异——秒级创建、几乎零额外存储成本。
- **价值**：①每个 PR/feature 一个独立数据库副本，preview 环境与生产数据隔离；②schema 迁移先在分支测试，再 merge 到 main（PlanetScale 的 deploy requests）；③测试不污染生产数据。
- **传统 DB 做不到**：RDS 要 dump + restore 全量，慢且贵；Serverless DB 的 branching 是基础设施级支持。

## 五、与 Serverless 计算的连接模型

Serverless 函数（Lambda/Workers）是短生命周期、高并发的，传统 DB 的**连接池模型**不匹配（每个函数实例一个连接会撑爆 DB 的 max_connections）。Serverless DB 的解法：

- **HTTP API**：Neon/Turso 提供 HTTP 接口（不是 TCP 长连接），函数直接 HTTP 调用查询，无连接池问题。
- **连接池（PgBouncer/池化端点）**：Neon 提供 pooled endpoint，多函数复用少量连接。
- **驱动适配**：如 PlanetScale 的 JavaScript 驱动走 HTTP/fetch；Turso 的 libSQL 客户端也走 HTTP 或嵌入式。

## 六、何时选 Serverless DB

| 场景 | 选谁 | 原因 |
| --- | --- | --- |
| PG 应用 + preview 环境多 | **Neon** | DB branching + scale-to-zero |
| MySQL + 大规模需分片 | **PlanetScale** | Vitess 水平分片 + schema 工作流 |
| 全球读多写少 + 边缘低延迟 | **Turso** | 边缘副本 + 嵌入式 SQLite |
| 高流量稳定生产 + 强事务 | （可能）Aurora/RDS | Serverless DB 大流量可能更贵 |

## 下一步

理解了 scale-to-zero 与三家概览后，下一步深入——[Neon 与 PlanetScale](./guide-line/neon-and-planetscale)（存算分离、DB branching、Vitess 分片、schema 迁移）与[Turso 与选型对比](./guide-line/turso-and-selection)（边缘 SQLite、嵌入式副本、三家选型决策）。
