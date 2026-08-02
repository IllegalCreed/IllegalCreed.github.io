---
layout: doc
outline: [2, 3]
---

# 参考：Serverless DB 三家对比与选型

> 基于 Neon / PlanetScale / Turso · 核于 2026-08

## 速查

- **Serverless DB 定义**：无需预置实例、按用量计费、能 scale-to-zero / 自动伸缩的托管数据库。
- **三家**：Neon（PG，存算分离 + DB branching）、PlanetScale（MySQL，Vitess 分片）、Turso（SQLite/libSQL，边缘复制）。
- **scale-to-zero**：Neon ✅（秒级挂起/唤醒）、Turso ✅（嵌入式无冷启动）、PlanetScale ❌（不强调）。
- **DB branching**：Neon ✅（copy-on-write，秒级）、PlanetScale ✅（分支 + deploy requests）。
- **唤醒延迟**：Neon 几百 ms - 数秒；Turso 嵌入式无；PlanetScale 不挂起。

## 一、三家横向对比矩阵

| 维度 | **Neon** | **PlanetScale** | **Turso** |
| --- | --- | --- | --- |
| 数据模型 | Postgres | MySQL | SQLite（libSQL） |
| 底层技术 | 存算分离（对象存储） | Vitess 分片层 | libSQL fork + 边缘复制 |
| 强项 | DB branching + PG 生态 | 水平分片 + schema 工作流 | 边缘就近读 + 嵌入式副本 |
| scale-to-zero | ✅（秒级挂起/唤醒） | ❌ | ✅（嵌入式无冷启动） |
| DB branching | ✅（copy-on-write） | ✅（分支 + deploy requests） | ❌（无） |
| 外键约束 | ✅ | ❌（Vitess 不支持） | ✅（SQLite 支持） |
| 跨分片/分布式事务 | N/A | 受限（推荐单分片） | N/A |
| 全球低延迟读 | 需多区域部署 | 需多区域部署 | ✅ 原生边缘 |
| 唤醒延迟 | 几百 ms - 数秒 | 无 | 嵌入式无 |
| 适合规模 | 中小 | 大（分片扩展） | 中小（读多写少） |
| 一致性 | 强一致 | 强一致（单分片） | 副本最终一致，主强一致 |

## 二、架构速览

```
Neon（存算分离）          PlanetScale（Vitess 分片）       Turso（边缘复制）
┌──────────────┐          ┌──────────────┐               ┌──────────────┐
│ 计算节点(无状态)│          │ VTGate 路由层  │               │ 主节点(primary)│
│ Postgres 进程 │          └──────┬───────┘               └──────┬───────┘
└──────┬───────┘                  │                              │ 异步复制
       │ 拉页/写页                  ├── Shard 0 (MySQL)            ├── 东京副本
       ▼                          ├── Shard 1                     ├── 上海副本
┌──────────────┐                  ├── Shard 2                     └── 纽约副本
│ 存储层(对象存储)│                  └── Shard 3                         │
│ pageserver    │                                                      ▼
└──────────────┘                                              ┌──────────────┐
                                                              │ 客户端嵌入式副本│
                                                              │ (进程内 SQLite)│
                                                              └──────────────┘
```

## 三、计费模型对比

| DB | 核心计费维度 | 特点 |
| --- | --- | --- |
| **Neon** | 计算时长（compute hours）+ 存储 + 数据传输 | scale-to-zero 省计算费；分支几乎不占存储（COW） |
| **PlanetScale** | 行读 + 行写 + 存储 | 按行计费，高读写量要算清；不强调 scale-to-zero |
| **Turso** | 行读 + 存储 + 副本数（边缘节点数） | 嵌入式副本读不计云端；多地域副本增加成本 |

**通用陷阱**：高流量/大数据下按用量计费可能**比预留实例贵**——上线前要做成本测算（对比 RDS/Aurora Provisioned）。

## 四、DB branching 工作流

**Neon**：

```
neon branches create --name preview-42  # 秒级（copy-on-write）
preview-42 分支 → preview 环境
合并 PR → 删分支 / promote
```

**PlanetScale**：

```
1. 在分支改 schema（CREATE/ALTER）
2. 测试
3. 提 deploy request（像 PR）
4. 审查 + 在线无锁执行（gh-ost / Online DDL）
5. 合并到 main
```

## 五、嵌入式副本（Turso 独有）

```ts
const client = createClient({
  url: "file:local.db",         // 本地副本
  syncUrl: "https://...",       // 主节点
});
await client.sync();            // 同步
await client.execute("SELECT..."); // 读本地，零网络延迟
```

- **零网络读**、**离线可用**、**后台同步**——适合边缘函数/移动应用。

## 六、选型决策树

```
PG 应用 + preview 环境多          → Neon
MySQL + 大规模/需分片/schema 工作流 → PlanetScale
全球读多写少 + 边缘低延迟/嵌入式    → Turso
高流量稳定生产 + 强事务           → 考虑 Aurora/RDS（Serverless DB 可能更贵）
```

## 七、易错点清单

- **"Serverless DB 一定比 RDS 便宜"**：不一定。低流量/开发环境省（scale-to-zero），高流量/大数据可能更贵（按用量计费累积）。要算清。
- **"scale-to-zero 无延迟"**：错。Neon 冷唤醒几百 ms - 数秒，延迟敏感场景要 keep-alive 或关闭挂起。
- **"PlanetScale 支持外键"**：错。Vitess 默认不支持外键（跨分片无法保证），需应用层保证。
- **"Turso 副本强一致"**：错。副本最终一致（异步同步），读可能读到旧数据；强一致走主节点。
- **"Neon 是 PG 兼容层"**：错。Neon 是真正的 Postgres（不是兼容层），SQL/扩展/驱动全部原生兼容。
- **"DB branching 复制全量数据"**：错。基于 copy-on-write，共享数据页，秒级创建、几乎零额外存储。
- **"嵌入式副本（Turso）能强一致写"**：错。嵌入式副本写先存本地，异步同步主节点——读副本最终一致。
- **"Serverless DB 适合所有规模"**：错。大规模高吞吐下按用量计费可能爆，且分片/分支机制是厂商锁定。

## 权威链接

- [Neon 官方文档](https://neon.tech/docs/introduction)
- [PlanetScale 官方文档](https://planetscale.com/docs)
- [Turso 官方文档](https://docs.turso.tech/)
- [Vitess 官方文档](https://vitess.io/docs/)
- [libSQL（Turso GitHub）](https://github.com/tursodatabase/libsql)
- 本站幻灯片：<a href="/SlideStack/serverless-database-slide/" target="_blank">Serverless 数据库</a>
