---
layout: doc
outline: [2, 3]
---

# Turso 与选型对比：边缘 SQLite

> 基于 Turso / Neon / PlanetScale · 核于 2026-08

## 速查

- **Turso**：基于 **libSQL**（SQLite 的开源 fork，Turso 维护）的**边缘 SQLite 数据库**。数据复制到全球边缘节点就近读。
- **libSQL**：Turso fork 的 SQLite，加了原生复制、HTTP API、嵌入式查询接口——保持 SQLite 的简单，加云的能力。
- **边缘复制**：每个 Turso 数据库可有多地域副本（replica），读请求路由到**最近边缘节点**，P50 延迟常 < 50ms。
- **嵌入式副本（Embedded Replica）**：客户端进程内可以跑一个 SQLite 副本——读直接走本地文件（零网络延迟），后台同步主节点。这是 Turso 的杀手锏。
- **一致性模型**：读副本**最终一致**（异步同步）；主节点（primary）**强一致**。应用读副本可能读到稍旧数据，写走主节点。
- **适合读多写少**：Turso 的边缘复制 + 嵌入式副本对**全球读密集**场景（多语言文档站、配置、CMS）极友好；写密集或强一致要求高要慎选。
- **scale-to-zero 友好**：嵌入式副本在客户端，无 DB 冷启动；服务端副本按用量计费。
- **三家选型决策**：①PG 应用/preview 环境多 → **Neon**；②MySQL 大规模/需分片 → **PlanetScale**；③全球读多写少/边缘低延迟 → **Turso**。
- **大数据量成本 caveat**：高流量/大数据集下按用量计费可能比预留实例贵——要算清。
- **厂商锁定**：各家分片/分支/复制机制是私有实现（Neon 存算分离、PlanetScale Vitess、Turso libSQL），迁出有成本。

## 一、Turso：边缘 SQLite

Turso 把 SQLite（最广泛部署的数据库，每台手机/浏览器都有）改造成**云原生 + 边缘**的数据库：

```
                    主节点（primary，强一致写）
                          │
            异步复制（replication）
   ┌──────────┬──────────┴──────────┬──────────┐
   ▼          ▼                     ▼          ▼
 东京副本   上海副本              法兰副本   纽约副本
（就近读）  （就近读）           （就近读）  （就近读）
   │          │                     │          │
   └──────┬───┴─────────────────────┴──────────┘
          ▼
   客户端可嵌入一个本地副本（进程内 SQLite，零网络读）
```

- **libSQL**：SQLite 的 fork（Turso 维护），加了：①原生复制（多副本同步）；②HTTP API（适配 Serverless）；③嵌入式查询 SDK（JS/Go/Python）。
- **为什么用 SQLite 做基础**：SQLite 极简（单文件、无服务器、零运维）、无处不在、嵌入式友好。Turso 把它"云化"——加复制与边缘，但保持简单。
- **一致性**：副本是**最终一致**（异步从主节点同步，有延迟）。应用读副本可能读到稍旧数据；强一致读要走主节点或用 `read-your-writes` 模式。

## 二、嵌入式副本：Turso 的杀手锏

Turso 独有的**嵌入式副本（Embedded Replica）**——在客户端进程内跑一个完整 SQLite 副本：

```ts
import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:local.db",         // 本地文件（嵌入式副本）
  syncUrl: "https://turso...", // 主节点
  authToken: "...",
});

await client.sync();            // 从主节点同步到本地
const rows = await client.execute("SELECT * FROM users"); // 读本地，零网络延迟
await client.execute("INSERT ..."); // 写本地 + 自动同步到主
```

- **零网络读**：SELECT 直接读本地 SQLite 文件，**无 RTT**——延迟低于任何远程 DB。
- **离线可用**：断网时仍可读本地副本（写先存本地，联网后 sync）。
- **后台同步**：写本地后异步同步到主节点，主节点再复制到其他副本。
- **适合场景**：①边缘函数（Workers/Lambda）进程内嵌副本；②移动应用本地 DB + 云同步；③读多写少的全球应用。

## 三、三家横向对比

| 维度 | **Neon** | **PlanetScale** | **Turso** |
| --- | --- | --- | --- |
| 数据模型 | Postgres | MySQL | SQLite（libSQL） |
| 架构 | 存算分离 | Vitess 分片 | 边缘复制 |
| 强项 | DB branching + PG 生态 | 水平分片 + schema 工作流 | 边缘就近读 + 嵌入式副本 |
| 一致性 | 强一致 | 强一致（单分片） | 副本最终一致，主强一致 |
| scale-to-zero | ✅（秒级挂起） | ❌ | ✅（嵌入式无冷启动） |
| 外键 | ✅ | ❌ | ✅（SQLite 支持） |
| 全球低延迟读 | 需多区域部署 | 需多区域部署 | ✅ 原生边缘 |
| 唤醒延迟 | 几百 ms - 数秒 | 无（不挂起） | 嵌入式无 |
| 适合规模 | 中小 | 大（分片） | 中小（读多写少） |

## 四、选型决策树

```
你的应用用什么数据模型 / 需求？
│
├─ Postgres（PG 生态、复杂查询、JSON、扩展）
│     └─ 需要 preview 环境 / DB branching？
│           ├─ 是 → Neon
│           └─ 否 → 大规模？是→Aurora Serverless v2；否→Neon/RDS
│
├─ MySQL（已有 MySQL、大规模、高写入）
│     └─ 需要水平分片 / schema 工作流？
│           ├─ 是 → PlanetScale
│           └─ 否 → Aurora Serverless / RDS
│
└─ 全球读多写少 / 边缘低延迟 / 嵌入式
      └─ Turso（边缘 SQLite）
```

- **Neon 的甜点**：PG 应用 + 多 preview 环境（每个 PR 一个 DB 分支）+ 中小规模 + 接受 scale-to-zero 唤醒。
- **PlanetScale 的甜点**：MySQL + 数据量大到单机扛不住 + 需要 schema 在线迁移工作流 + 接受无外键。
- **Turso 的甜点**：全球用户 + 读远多于写 + 要超低延迟读（边缘/嵌入式）+ 数据模型简单。

## 五、成本与陷阱

- **大数据量/高流量更贵**：按行/按计算计费在规模化后可能超过预留实例。要做成本测算（月度估算 vs RDS/Aurora）。
- **唤醒延迟**：Neon scale-to-zero 后首次查询几百 ms - 数秒——延迟敏感场景要 keep-alive 或关闭挂起。
- **PlanetScale 无外键**：迁移已有依赖 FK 的 schema 要先改应用层。
- **Turso 最终一致**：副本读可能读到旧数据，强一致场景要走主节点（牺牲延迟）。
- **厂商锁定**：Neon 分支、PlanetScale 分片、Turso libSQL 都是私有增强，迁出要重设计。

## 下一步

Turso 与选型讲完后，回到[参考](../reference)查阅三家对比矩阵、计费表、易错点清单。
