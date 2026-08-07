---
layout: doc
outline: [2, 3]
---

# 参考：MySQL 引擎、索引、隔离级别与 EXPLAIN 速查

> 基于 MySQL 8.4 LTS / 9.x · 核于 2026-08

## 速查

- **MySQL 定义**：开源关系型数据库，行式存储 + B+ 树索引 + ACID 事务，OLTP 事实标准。
- **版本**：**8.4 LTS**（生产首选，支持到 2032）、9.x（创新版，向量/JS 存储过程，迭代快）、5.7 已 EOL。
- **架构**：server 层（连接/解析/优化/执行）+ 存储引擎层（InnoDB 默认）。
- **InnoDB**：行锁 + MVCC + 崩溃恢复（redo/undo log）+ 外键 + 聚簇索引。
- **索引**：B+ 树（数据在叶子 + 链表）；聚簇索引（主键，存整行）vs 二级索引（存主键值，要回表）；覆盖索引避免回表。
- **隔离级别**：默认 **REPEATABLE READ**（间隙锁防幻读）；RC（PG 默认）→ RR → SERIALIZABLE 越来越严。
- **MVCC**：undo 版本链 + 一致性视图，读不加锁；长事务致 undo 膨胀。
- **复制**：binlog（ROW 默认）→ relay log → 回放；GTID 简化故障切换；半同步/MGR 提升一致性。
- **JSON**：8.0+ 原生类型，`->`/`->>`/`JSON_EXTRACT`，建函数索引加速查询。
- **调优三板斧**：消灭全表扫描（`type=ALL`）→ 减少回表（覆盖索引）→ 避免 filesort/临时表。

## 一、存储引擎对比

| 引擎 | 事务 | 锁粒度 | 外键 | 崩溃恢复 | 适用 |
| --- | --- | --- | --- | --- | --- |
| **InnoDB**（默认） | ✅ ACID | 行锁 + MVCC | ✅ | ✅ redo/undo | **OLTP 通用首选** |
| MyISAM | ❌ | 表锁 | ❌ | ❌ | 已淘汰（旧项目） |
| Memory | ❌ | 表锁 | ❌ | ❌（数据在内存） | 临时表/缓存 |
| NDB（Cluster） | ✅ | 行锁 | ❌ | ✅ | 分布式高可用 |
| RocksDB（MyRocks） | ✅ | 行锁 | ❌ | ✅ | 压缩比高、写多 |

**95% 场景用 InnoDB**。`CREATE TABLE ... ENGINE=InnoDB` 显式指定（虽是默认）。

## 二、索引类型速查

| 索引类型 | 结构 | 适用 |
| --- | --- | --- |
| **主键索引（聚簇）** | B+ 树，叶子存整行 | 按主键点查/范围 |
| **唯一索引（UNIQUE）** | B+ 树，值唯一 | 唯一约束 + 查询 |
| **普通索引（INDEX）** | B+ 树，二级索引 | 加速等值/范围查询 |
| **联合索引（多列）** | B+ 树，最左前缀 | 多条件查询 |
| **全文索引（FULLTEXT）** | 倒排索引 | 文本搜索（`MATCH ... AGAINST`） |
| **空间索引（SPATIAL）** | R 树 | GIS 地理数据（`GEOMETRY`） |

- **聚簇索引只有主键**，一张表一个。二级索引可有多个。
- **覆盖索引**：索引含查询全部列，`Using index`，避免回表。
- **前缀索引**：`INDEX(name(10))` 对长字符串只索引前 N 字符，省空间但无法用于 ORDER BY/覆盖索引。

## 三、隔离级别矩阵

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | MVCC 视图 | 锁 |
| --- | --- | --- | --- | --- | --- |
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 无 | 最少 |
| READ COMMITTED | 避免 | 可能 | 可能 | 每次 SELECT 新视图 | 行锁 |
| **REPEATABLE READ**（默认） | 避免 | 避免 | 避免（间隙锁） | 事务首次 SELECT 定视图 | 行锁 + 间隙锁 |
| SERIALIZABLE | 避免 | 避免 | 避免 | — | 加共享锁，退化为串行 |

## 四、InnoDB 锁体系

| 锁 | 范围 | 用途 |
| --- | --- | --- |
| 共享锁（S） | 行/表 | 读（`LOCK IN SHARE MODE`） |
| 排他锁（X） | 行/表 | 写（`FOR UPDATE`） |
| 记录锁（Record） | 单行 | 命中行 |
| 间隙锁（Gap） | 行间区间 | 防插入（防幻读，RR 下） |
| 临键锁（Next-Key） | 记录 + 前间隙 | RR 默认行锁 |
| 意向锁（IS/IX） | 表级 | 标记表内有行锁，加速冲突判断 |
| 插入意向锁 | 间隙 | 并发插入同一区间不互斥 |
| 自增锁（AUTO-INC） | 表级 | 自增主键并发插入 |

## 五、EXPLAIN 字段速查

| 字段 | 含义 | 看什么 |
| --- | --- | --- |
| `id` | 查询序号 | 大的先执行 |
| `select_type` | 查询类型 | SIMPLE/PRIMARY/SUBQUERY/DERIVED |
| **`table`** | 表名 | — |
| **`type`** | 访问类型 | `const`>`eq_ref`>`ref`>`range`>`index`>`ALL`，**消灭 ALL** |
| `possible_keys` | 可能用的索引 | 多了说明有冗余索引 |
| **`key`** | 实际用的索引 | NULL = 没用索引 |
| `key_len` | 索引使用长度 | 判断联合索引用了几列 |
| `ref` | 索引比较来源 | const/列名 |
| **`rows`** | 预估扫描行数 | 越小越好 |
| `filtered` | 过滤后比例 | 百分比 |
| **`Extra`** | 附加信息 | `Using index`（好）/ `Using where` / `Using filesort`（坏）/ `Using temporary`（坏） |

## 六、binlog 格式与复制方案

| binlog 格式 | 内容 | 一致性 | 大小 |
| --- | --- | --- | --- |
| STATEMENT | SQL 语句 | 非确定函数可能不一致 | 小 |
| **ROW**（默认） | 行变更镜像 | 完全确定 | 大 |
| MIXED | 自动切换 | 折中 | 中 |

| 复制方案 | 一致性 | 延迟 | 复杂度 |
| --- | --- | --- | --- |
| 异步（默认） | 最终一致 | 低 | 低 |
| 半同步 | 主库等从库 ACK | 中 | 中 |
| 组复制（MGR） | Paxos 强一致 | 中 | 高 |

## 七、易错点清单

- **「MyISAM 比 InnoDB 快」**：过时。现代 InnoDB 性能全面超越，且 MyISAM 不支持事务/行锁/崩溃恢复，新项目别用。
- **「索引越多越好」**：错。索引加速查询但拖慢写入（每次写要更新索引）+ 占空间。只给查询频繁、区分度高的列建。
- **「`SELECT *` 无所谓」**：错。破坏覆盖索引、浪费网络/内存、表结构变更易出问题。只查需要的列。
- **「UUID 当主键很好」**：错。UUID 随机插入导致聚簇索引频繁页分裂、索引膨胀、写入变慢。用自增整型主键。
- **「`LIKE '%xxx'` 能用索引」**：错。前导通配符让索引失效变全表扫描。后导 `LIKE 'xxx%'` 才用索引。
- **「MySQL 的 RR 有幻读」**：错。MySQL 的 RR 用间隙锁/临键锁避免了幻读（其他数据库的 RR 仍有）。
- **「MVCC 读完全不加锁」**：不精确。普通快照读不加锁，但 `SELECT ... FOR UPDATE` / `LOCK IN SHARE MODE` 是当前读，加锁。
- **「binlog 和 redo log 一样」**：错。binlog 是 server 层逻辑日志（记语句/行变更），redo log 是 InnoDB 层物理日志（记页修改），两阶段提交保证一致。
- **「长事务无所谓」**：错。长事务持有锁、导致 undo 膨胀无法 purge、主从延迟，是经典性能杀手。
- **「字符串字段查询不加引号也行」**：错。`WHERE phone = 13800000000`（phone 是 VARCHAR）会隐式转数字让索引失效变全表扫描。
- **「连接池越大越好」**：错。连接池过大导致 MySQL 端连接线程过多、上下文切换开销反而变慢。HikariCP 建议「CPU 核数 × 2 + 磁盘数」。
- **「9.x 比 8.4 新所以更好」**：错。9.x 是创新版（非 LTS），稳定性与生态尚需沉淀，生产用 8.4 LTS。

## 八、进阶方向（链接其他叶）

- [PostgreSQL](../../postgresql/) —— 功能更强（JSONB/扩展生态/MVCC 实现）的对照
- [SQLite](../../sqlite/) —— 嵌入式零运维，移动端/PWA 首选
- 本站幻灯片：<a href="/SlideStack/mysql-slide/" target="_blank">MySQL</a>

## 权威链接

- [MySQL 8.4 Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [InnoDB Storage Engine](https://dev.mysql.com/doc/refman/8.4/en/innodb.html)
- [EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
- [MySQL 9.x Release Notes](https://dev.mysql.com/doc/relnotes/mysql/9.0/en/)
- [MySQL Replication](https://dev.mysql.com/doc/refman/8.4/en/replication.html)
- 本站幻灯片：<a href="/SlideStack/mysql-slide/" target="_blank">MySQL</a>
