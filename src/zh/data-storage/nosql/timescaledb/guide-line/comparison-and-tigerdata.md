---
layout: doc
outline: [2, 3]
---

# 对比与 TigerData：与 InfluxDB 的取舍

> 基于 TimescaleDB 2.x / TigerData · 核于 2026-08

## 速查

- **两大流派**：①**关系库扩展**（TimescaleDB，复用 Postgres）；②**专用时序引擎**（InfluxDB，从存储到查询层全面定制）。
- **TimescaleDB 哲学**：**复用生态**——加扩展而非造新轮子，Postgres 技能/工具/ORM/BI 全可用，关系+时序一体。
- **InfluxDB 哲学**：**专用优化**——为时序从底层（3.x Parquet/Arrow）重写，监控/IoT 极大规模写入与聚合更优。
- **核心差异**：TimescaleDB 有 ACID 事务 + 强 JOIN + Postgres 生态；InfluxDB 无事务、JOIN 弱但专用引擎在大规模时序更轻快。
- **TigerData**：2025 年 Timescale 公司时序业务重构的新品牌，仍基于 Postgres，云原生 + 存算分离 + 更强扩展性；原 TimescaleDB 开源版进维护模式，核心概念（hypertable/连续聚合/压缩）延续。
- **选型 TimescaleDB**：已有 Postgres 技术栈、需关系+时序 JOIN、看重 SQL/工具生态、中大规模。
- **选型 InfluxDB**：纯监控/IoT 时序、规模极大、要 TIG 栈、与业务库隔离。
- **共有时序策略**：两者都支持降采样/连续聚合 + 数据保留 + 时间窗口聚合，思路相通。

## 一、哲学差异：复用 vs 专用

时序数据库的两大流派代表了两种工程哲学：

| 维度 | TimescaleDB（复用派） | InfluxDB（专用派） |
| --- | --- | --- |
| 出发点 | Postgres 已经很好，加时序能力 | 时序场景特殊，从底层重写 |
| 查询语言 | 标准 SQL（Postgres 方言） | 3.x SQL / 1.x InfluxQL / 2.x Flux |
| 底层存储 | Postgres 堆表 + chunk 分区 | 3.x Parquet 列存 + Arrow 内存 |
| 事务 | **ACID**（继承 Postgres MVCC） | 弱（时序追加为主） |
| 关系 JOIN | **强**（与业务表 JOIN） | 弱 |
| 工具生态 | 复用 Postgres 全生态（pgAdmin/DBeaver/psql/备份/复制） | 自建 TIG 栈（Telegraf/Grafana） |
| 写入瓶颈 | Postgres 进程模型（连接/锁） | 专用引擎（3.x 列存追加）高吞吐 |
| 极大规模 | 受 Postgres 限制（千万级 series 吃力） | 3.x Parquet/Arrow 更优 |
| 学习成本 | 极低（会 Postgres 即可） | 中（学过 Flux/InfluxQL，3.x 转 SQL） |

### 选型决策树

```
需要时序 + 关系业务 JOIN？
  ├─ 是 → TimescaleDB（一个库搞定，避免数据孤岛）
  └─ 否 → 纯时序场景？
            ├─ 规模极大（千万 series、极高写入）→ InfluxDB 3.x
            ├─ 已有 Postgres 技术栈 → TimescaleDB（迁移成本低）
            └─ 要 TIG 监控栈开箱即用 → InfluxDB
```

## 二、关键能力对比

| 能力 | TimescaleDB | InfluxDB |
| --- | --- | --- |
| 数据模型 | 关系表（行）+ hypertable 分区 | measurement/tag/field（时序四元组） |
| 时间窗口聚合 | `time_bucket` + 连续聚合物化 | `date_bin` + 降采样任务 |
| 预计算/物化 | **连续聚合**（自动增量刷新） | 降采样任务（Task 定时） |
| 压缩 | **chunk 列式编码**（10-20x） | Parquet 列存（10-50x） |
| 数据保留 | retention policy（整 chunk 删） | retention（按时间过期） |
| 高基数处理 | 受 Postgres 限制（需控制 tag 基数） | 同样有高基数坑（series 爆炸） |
| 更新/删除 | 支持（压缩 chunk 需先解压） | 弱（时序追加为主） |
| 背景调度 | 内置 Job（压缩/retention/刷新策略） | Task 调度 |

两者在时序核心能力（时间窗口聚合、降采样/连续聚合、压缩、retention）上思路相通，差异主要在底层引擎与生态。

## 三、TigerData：Timescale 公司的战略转型

2025 年 Timescale 公司调整战略，核心变化：

- **新品牌 TigerData**：将时序与数据基础设施业务整合为 **TigerData**，仍以 Postgres 为内核，但引入更现代的架构：
  - **云原生**：为云/容器环境优化，弹性扩缩容。
  - **存算分离**：存储与计算解耦，独立扩展、降成本。
  - **更强的水平扩展**：突破单机 Postgres 的写入与存储瓶颈。
  - **企业特性**：更强的高可用、灾备、安全。
- **原 TimescaleDB 开源版**：进入**维护模式**——持续接受 bugfix 与兼容性更新，但新功能主要进 TigerData（企业/云版）。
- **核心概念延续**：hypertable、连续聚合、压缩、retention 这些概念在 TigerData 中继续存在并增强，已有知识与部署可平滑过渡。
- **对开发者的影响**：
  - 已部署 TimescaleDB：可继续用（维护支持），长期可评估迁移 TigerData。
  - 新项目：评估 TigerData（如需云原生/扩展性）或维护版（如需纯开源）。
  - 学习核心概念不会过时——TigerData 继承。

## 四、选型建议

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 已有 Postgres，加时序能力 | TimescaleDB / TigerData | 复用技能与工具，迁移成本最低 |
| 时序 + 业务关系 JOIN | TimescaleDB / TigerData | 一个库搞定，避免数据孤岛 |
| 纯监控/IoT，规模极大 | InfluxDB 3.x | 专用引擎高吞吐，TIG 栈开箱即用 |
| 中小规模时序，看重生态 | TimescaleDB | Postgres 生态丰富，运维资料多 |
| 要 ACID 事务保证 | TimescaleDB | 继承 Postgres MVCC，时序写入事务安全 |
| 极简部署（单二进制） | InfluxDB | 无需 Postgres 依赖 |

## 五、迁移与共存

- **TimescaleDB → InfluxDB**：用 `COPY` 导出 → 转 Line Protocol → 写入 InfluxDB；连续聚合转降采样任务。
- **InfluxDB → TimescaleDB**：Line Protocol → 关系表（measurement 变表，tag 变索引列，field 变普通列）→ `create_hypertable`。
- **共存**：业务在 Postgres/TimescaleDB，监控在 InfluxDB——但能用一个库（TimescaleDB）就别维护两个，减少数据孤岛与同步成本。

## 下一步

掌握对比与 TigerData 转型后，可进入 [参考](../reference) 查阅 hypertable/连续聚合/压缩速查、对比表与易错点清单。
