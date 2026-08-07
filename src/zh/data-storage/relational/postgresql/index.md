---
layout: doc
---

# PostgreSQL

**PostgreSQL**（常简称为 **Postgres**）是全球功能最强大的**开源关系型数据库**，被誉为「最像商业数据库的开源库」。它源于 1986 年加州大学伯克利分校的 POSTGRES 项目（Michael Stonebraker 主导，后获图灵奖），1996 年加入 SQL 解释器后改名 PostgreSQL。与 MySQL「成熟稳定、够用就好」的实用主义路线不同，PostgreSQL 走的是**学术严谨 + 功能完备**路线——**MVCC（多版本并发控制）**从底层重新实现（非回滚段，而是每行多版本），事务语义严格；**索引体系**远超 MySQL：除 B-tree 外还有 **GIN**（倒排，加速 JSONB/数组/全文）、**GiST**（空间/R-树）、**BRIN**（块范围，海量有序数据极省空间）、**SP-GiST**（空间分区）；**JSONB**（二进制 JSON）配合 GIN 索引让 PG 成为「文档+关系」混合存储的标杆；**扩展生态（Extensions）**是 PG 最独特的优势——`pgvector`（AI 向量检索）、`TimescaleDB`（时序）、`PostGIS`（地理）让它「一个数据库顶三个用」。**CTE（公共表表达式，含递归）**与**窗口函数**让复杂分析查询无需外接系统。当前主线是 **PostgreSQL 17**（2024，性能与逻辑复制的成熟版）与刚发布的 **18**（2025，逻辑复制增强、虚拟生成列、异步 I/O 改进）。PostgreSQL 凭借**功能完备、标准遵循（SQL 标准）、扩展性强**，成为「全栈工程师首选数据库」与众多 NewSQL（CockroachDB/YugabyteDB）、云原生数据库（Supabase/Neon/Aurora PG）的内核。理解 PostgreSQL 的核心是理解 **MVCC 实现差异**（每行多版本 + VACUUM 清理）、**索引选型**（B-tree/GIN/GiST/BRIN 各擅其长）、**JSONB 与关系混合**、**扩展生态**与**逻辑复制**。本叶是关系型数据库章的深度补充，与 [MySQL](../mysql/) 互为对照。

## 评价

**优点**

- **功能最全**：SQL 标准遵循度最高、窗口函数/CTE/递归/物化视图/生成列/部分索引/表达式索引齐全，复杂查询能力强
- **MVCC 严谨**：每行多版本（非回滚段），无回滚段膨胀问题；DDL 大多非阻塞（pg_rewind）
- **索引体系丰富**：B-tree + GIN + GiST + BRIN + SP-GiST + Hash + GIN/GIN Pending，按数据类型与查询模式选最优
- **JSONB 混合存储**：二进制 JSON + GIN 索引，`@>`/`?`/路径查询高效，「关系+文档」一站搞定
- **扩展生态无敌**：pgvector/timescaledb/postgis/pg_partman/citrus，把 PG 变成「向量库/时序库/GIS 库/分布式库」

**缺点**

- **生态规模略小于 MySQL**：云托管、运维资料、招人难度上 MySQL 略胜
- **VACUUM 开销**：MVCC 的 dead tuples 靠 VACUUM 清理，大表自动 VACUUM 可能跟不上，需调参与分区
- **复制配置繁琐**：流复制 + 逻辑复制各有坑，连接池（pgbouncer）与 prepared statement 配合有事务模式限制
- **单机写入扩展弱**：单节点写入是瓶颈（不像 Cassandra 线性扩展），分布式要靠 Citus/cockroach

## 本叶地图

- [入门](./getting-started) —— PostgreSQL 定义、17/18 版本、MVCC、索引类型、CTE/窗口函数、JSONB、扩展生态、逻辑复制、pgbouncer
- [MVCC 与索引类型](./guide-line/mvcc-and-indexes) —— MVCC 每行多版本 + VACUUM、B-tree/GIN/GiST/BRIN/SP-GiST 选型、JSONB 与 GIN 索引
- [CTE、窗口函数与扩展生态](./guide-line/extensions-and-features) —— CTE（含递归）、窗口函数、pgvector/timescaledb/postgis 扩展、逻辑复制、pgbouncer 连接池
- [参考](./reference) —— 索引类型速查、JSONB 操作符、扩展清单、与 MySQL 对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/postgresql-slide/" target="_blank">PostgreSQL</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PostgreSQL" target="_blank" rel="noopener noreferrer">PostgreSQL 测试题</a>
