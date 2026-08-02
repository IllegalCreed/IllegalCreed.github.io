---
layout: doc
outline: [2, 3]
---

# Neon 与 PlanetScale：存算分离与 Vitess 分片

> 基于 Neon / PlanetScale · 核于 2026-08

## 速查

- **Neon**：**云原生 Postgres**，存算分离架构——存储在对象存储（S3-like），计算是无状态计算节点。完整 PG 生态（SQL、扩展、驱动兼容）。
- **存算分离**：存储层（持久化在对象存储 + 本地页缓存）与计算层（Postgres 进程）解耦。计算无状态 → 可 scale-to-zero、可随时起停、可分支。
- **scale-to-zero（Neon）**：计算节点空闲自动挂起（不计费），有连接冷唤醒（几百 ms - 数秒）。
- **DB branching（Neon）**：基于 copy-on-write 的存储层，秒级创建数据库分支——给 preview 环境/迁移测试用，几乎不占额外存储。
- **计算-存储分离的代价**：计算节点本地是页缓存，未命中的页要从对象存储拉，**冷查询有额外延迟**（vs 传统 DB 全在本地磁盘）。
- **PlanetScale**：基于 **Vitess**（YouTube 在用的 MySQL 分片层）的云原生 MySQL。
- **Vitess 分片**：把大表按主键 hash/range 拆到多个 MySQL 实例（shards），自动路由查询。解决单机 MySQL 数据量/写入瓶颈。
- **schema 迁移工作流**：PlanetScale 用 **分支 + deploy requests**——在分支改 schema（ddl）、测试、提 deploy request 合并到 main，平台在线执行（无锁迁移，bg schema change）。
- **无外键约束**：PlanetScale 默认**不支持外键**（跨分片 FK 无法保证），需应用层保证引用完整性——这是 Vitess 分片的取舍。
- **跨分片事务受限**：分布式事务开销大，PlanetScale 推荐单分片事务设计。

## 一、Neon：云原生 Postgres

Neon 把 Postgres 改造成**存算分离**的云原生架构：

```
传统 Postgres                       Neon（存算分离）
┌─────────────────────┐             ┌──────────────────────┐
│ 单进程              │             │ 计算节点（无状态）     │  ← 可 scale-to-zero / 分支
│ - Postgres 进程     │             │  Postgres 进程        │     本地只有页缓存
│ - 本地存储（磁盘）   │             └──────────┬───────────┘
│ 全在本地，强一致     │                        │ 拉页/写页
└─────────────────────┘                        ▼
                                   ┌──────────────────────┐
                                   │ 存储层（对象存储）     │  ← 持久化，copy-on-write
                                   │  pageserver + S3-like │     支持分支（零拷贝）
                                   └──────────────────────┘
```

- **为什么存算分离**：计算无状态 → 可以随时起停（scale-to-zero）、可以分支（共享存储，copy-on-write）、可以弹性扩缩。
- **完整 PG 生态**：Neon 是真正的 Postgres（不是兼容层），SQL/扩展（pg_vector 等）/驱动（psycopg/Prisma/Drizzle）全部兼容——迁移成本极低。
- **冷查询延迟**：计算节点本地只有页缓存（热数据），未命中的页要从对象存储（pageserver）拉，比传统 DB 全本地磁盘慢——所以 Neon 适合**温热数据**或可接受偶发冷查询的场景。
- **HTTP API**：Neon 提供 HTTP 端点，Serverless 函数（Lambda/Workers）可直接 HTTP 查询，绕过 TCP 连接池瓶颈。

## 二、Neon DB branching：git 式数据库分支

Neon 最革命的能力是 **DB branching**——像 git 一样分支数据库：

```
neon branches create --name preview-42  # 秒级创建
   main 分支（生产数据 100GB）
      │
      └── preview-42 分支（共享 100GB，copy-on-write）
             └── 只记录该分支的修改（几 MB）
                └── PR #42 的 preview 环境用这个分支
```

- **copy-on-write**：分支共享父分支的数据页，只在修改时才写新页（COW）。所以创建秒级、几乎不占额外存储。
- **典型工作流**：①开 PR 时自动建分支 → preview 环境连该分支 → 合并时删分支或 promote。②schema 迁移先在分支测试。③测试用真实生产数据（不污染生产）。
- **vs 传统 DB**：RDS dump + restore 全量要分钟到小时；Neon branching 秒级——这是基础设施级的差异。

## 三、PlanetScale：基于 Vitess 的 MySQL

PlanetScale 把 **Vitess**（YouTube 在用的 MySQL 分片层）做成云服务：

```
应用
  │  SQL（看起来像一个 MySQL）
  ▼
VTGate（查询路由层）── 按主键 hash 把查询分发到对应 shard
  │
  ├─→ Shard 0（VTTablet + MySQL，存 id % 4 == 0 的行）
  ├─→ Shard 1（id % 4 == 1 的行）
  ├─→ Shard 2
  └─→ Shard 3
```

- **Vitess 是什么**：MySQL 之上的一层代理/分片层。对应用看起来像一个 MySQL，底层把大表按主键拆到多个 MySQL 实例（shards），自动路由。YouTube 用它管理海量数据。
- **为什么分片**：单机 MySQL 有数据量/写入吞吐上限。Vitess 把数据水平拆到 N 个实例，突破单机瓶颈——适合**大规模数据 + 高写入**。
- **强项是水平扩展**：加 shard 即可线性扩容，无需应用改代码（Vitess 屏蔽分片细节）。

## 四、PlanetScale schema 迁移工作流

PlanetScale 把 schema 变更做成**在线、无锁、可审查**的工作流：

```
1. 在分支改 schema（CREATE TABLE / ALTER TABLE）
   ↓
2. 分支内测试（数据副本）
   ↓
3. 提 deploy request（像 PR）
   ↓
4. 审查 + 平台在线执行（gh-ost / Online DDL，无锁迁移）
   ↓
5. 合并到 main，自动回填数据
```

- **无锁迁移**：传统 `ALTER TABLE` 会锁表（生产事故常见源）。PlanetScale 用 **gh-ost / 在线 DDL** 后台拷贝数据，切换时只短暂锁——大表改 schema 不阻塞业务。
- **可审查**：schema 变更像代码 PR 一样 review、批准、记录——团队协作安全。
- **revert**：部分变更支持回滚（删除列等不支持的除外）。

## 五、PlanetScale 的取舍：无外键

PlanetScale（Vitess）默认**不支持外键约束**：

- **为什么**：跨分片的外键无法保证（一个 shard 的行引用另一个 shard 的行）。Vitess 选择不支持 FK 而非提供不可靠的 FK。
- **影响**：应用层必须自己保证引用完整性（在代码/事务里检查）——习惯了 PG/FK 约束的开发者要适应。
- **跨分片事务受限**：分布式事务开销大，PlanetScale 推荐设计成**单分片事务**（按 sharding key 聚合数据）。

## 六、Neon vs PlanetScale

| 维度 | **Neon** | **PlanetScale** |
| --- | --- | --- |
| 数据模型 | Postgres | MySQL |
| 架构 | 存算分离（对象存储） | Vitess 分片（多 MySQL） |
| 强项 | DB branching、PG 生态、scale-to-zero | 水平分片、schema 工作流 |
| 外键 | ✅ 支持 | ❌ 默认不支持 |
| scale-to-zero | ✅ | ❌（不强调） |
| 适合 | PG 应用、preview 环境、中小规模 | MySQL 大规模、高写入、需分片 |

## 下一步

Neon 与 PlanetScale 讲完后，下一个核心是 [Turso 与选型对比](./turso-and-selection)——Turso 边缘 SQLite/嵌入式副本，以及三家横向选型决策。
