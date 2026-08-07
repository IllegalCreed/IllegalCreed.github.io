---
layout: doc
---

# MySQL

**MySQL** 是全球最流行的**开源关系型数据库**（RDBMS），由瑞典 MySQL AB 于 1995 年创建，现归 Oracle 所有。它用 **SQL（结构化查询语言）** 把数据组织成**表（行+列）**，以**行式存储 + B+ 树索引**为核心，靠 **ACID 事务**保证一致性。MySQL 的灵魂是 **InnoDB 存储引擎**——提供行锁、MVCC、崩溃恢复、外键约束，是 OLTP（在线事务处理）的事实标准。当前主线是 **MySQL 8.4 LTS**（2024 年长期支持版，稳定首选）与 **9.x 创新版**（引入向量、JavaScript 存储过程等）。本站 quiz-backend 也跑在 MySQL（MariaDB 适配器）上。MySQL 凭借**成熟生态、运维资料丰富、云厂商普遍托管（RDS/PolarDB/TiDB 兼容）**，长期统治 Web 与企业应用——LAMP/LNMP 架构的「M」就是它。理解 MySQL 的核心是理解**存储引擎分层**（server 层 vs 引擎层）、**索引结构**（B+ 树为何高效、聚簇索引 vs 二级索引、覆盖索引与回表）、**事务与隔离级别**（READ COMMITTED/REPEATABLE READ/SERIALIZABLE、MVCC 与间隙锁）、**复制拓扑**（binlog/GTID/半同步）以及**性能调优**（EXPLAIN 执行计划、慢查询、连接池）。本叶是关系型数据库章的起点，后续深入 InnoDB 内部与运维调优。

## 评价

**优点**

- **成熟稳定**：30 年沉淀，文档/工具/运维经验极丰富，云厂商普遍托管，招人也最容易
- **InnoDB 事务强**：行锁 + MVCC + 崩溃恢复 + 外键，高并发 OLTP 表现稳健
- **B+ 树索引高效**：聚簇索引 + 覆盖索引，范围查询与点查都极快
- **复制生态完善**：binlog + GTID + 半同步，主从/读写分离/高可用方案成熟（MGR/Orchestrator）

**缺点**

- **JSON/分析弱于 PG**：JSON 类型支持晚且功能不如 PostgreSQL JSONB 丰富，OLAP 要靠列存插件
- **MVCC 实现回滚段**：长事务导致 undo log 膨胀、空间无法回收，是经典坑
- **优化器有时「抽风」**：复杂 JOIN 选错索引，需 hint 或 FORCE INDEX 干预
- **集群方案碎片化**：原生 MGR/InnoDB Cluster、第三方 TiDB/PolarDB 各有取舍，选型成本高

## 本叶地图

- [入门](./getting-started) —— MySQL 定义、8.4 LTS/9.x 版本、InnoDB 引擎、索引（B+ 树/聚簇/二级）、事务与隔离级别、复制（binlog/GTID）、JSON、连接池、EXPLAIN 调优
- [InnoDB 引擎与索引事务](./guide-line/innodb-and-indexes) —— 存储引擎分层、B+ 树索引原理、聚簇索引 vs 二级索引、覆盖索引/回表、ACID 与四种隔离级别、MVCC 与锁
- [复制、JSON 与性能调优](./guide-line/replication-and-tuning) —— binlog 三种格式、GTID、半同步/MGR、JSON 类型与函数、连接池、EXPLAIN 执行计划、慢查询分析
- [参考](./reference) —— 存储引擎对比、索引类型速查、隔离级别矩阵、EXPLAIN 字段、易错点清单

## 幻灯片地址

<a href="/SlideStack/mysql-slide/" target="_blank">MySQL</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=MySQL" target="_blank" rel="noopener noreferrer">MySQL 测试题</a>
