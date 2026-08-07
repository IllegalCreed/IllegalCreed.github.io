---
layout: doc
outline: [2, 3]
---

# 复制、JSON 与性能调优：binlog、GTID、连接池与 EXPLAIN

> 基于 MySQL 8.4 LTS / 9.x · 核于 2026-08

## 速查

- **binlog（归档日志）**：server 层记录所有**已提交**的 DDL+DML，用于**复制与 PITR（按时间点恢复）**。三种格式：`STATEMENT`（记 SQL，小但非确定函数如 `NOW()`/`UUID()` 在从库可能不一致）、**`ROW`（记每行变更，大但确定，默认）**、`MIXED`。
- **复制流程**：主库写 binlog → 从库 **IO 线程**拉取 → 写 **relay log** → **SQL 线程**回放 → 数据一致。**5.7+ 支持并行回放**（基于组提交或写集合）。
- **GTID**（全局事务 ID，`<server_uuid>:<seq>`）：让从库自动追踪已应用事务，故障切换**不再手动算 binlog 位点**，现代复制标配。`gtid_mode=ON` 启用。
- **半同步复制**：主库等至少一个从库 ACK 收到 binlog 才返回提交成功，比异步少丢数据；**组复制（MGR）**用 Paxos 实现多主一致性，配 MySQL Router = InnoDB Cluster。
- **JSON 类型**（8.0+）：二进制存储 + 自动校验。`col->'$.key'` 取 JSON 值，`col->>'$.key'` 取文本，`JSON_EXTRACT`/`JSON_SET`/`JSON_TABLE`/`JSON_CONTAINS` 操作。可在 JSON 列上建**函数索引**（`INDEX((CAST(col->'$.age' AS UNSIGNED)))`）。
- **连接池**：复用连接避免 TCP+鉴权握手。客户端侧（HikariCP/Prisma 内置）+ 服务端侧（ProxySQL）。`max_connections`（默认 151）按「应用实例数 × 单实例连接池上限」估算，留余量给 DBA/监控。
- **EXPLAIN 字段**：`type`（访问类型，`ALL` 全表扫描要消灭）、`key`（实际索引）、`rows`（预估扫描行数）、`Extra`（`Using index` 覆盖索引好；`Using filesort`/`Using temporary` 要优化）。
- **EXPLAIN ANALYZE**（8.0+）：真正执行 SQL 并输出**实际耗时与行数**，比预估更准，调优利器。
- **慢查询日志**：`slow_query_log=ON` + `long_query_time=1`（秒）记录慢 SQL；`pt-query-digest` 聚合分析找 TOP N。
- **调优三板斧**：①**消灭全表扫描**（看 `type=ALL`，加索引）；②**减少回表**（用覆盖索引，看 `Using index`）；③**避免 filesort/临时表**（看 `Extra`，优化 ORDER BY/GROUP BY 让它走索引）。

## 一、binlog：复制的基石

binlog 是 MySQL server 层的**归档日志**，记录所有已提交的数据变更（DDL + DML），与 InnoDB 引擎层的 redo log（物理日志）不同——binlog 是**逻辑日志**：

| binlog 格式 | 记录内容 | 优点 | 缺点 |
| --- | --- | --- | --- |
| `STATEMENT` | 原始 SQL 语句 | 日志小 | 非确定函数（`NOW()`/`UUID()`/`RAND()`）在从库结果不一致 |
| **`ROW`**（默认） | 每行的变更前后镜像 | 完全确定，复制安全 | 日志大（一条 UPDATE 影响百万行就记百万条） |
| `MIXED` | 自动在两者间切换 | 折中 | 复杂度略高 |

- **推荐 `ROW`**——复制最安全，且是 GTID、组复制的硬性要求。
- **binlog 与 redo log 的两阶段提交**：为确保 binlog 与引擎层数据一致（崩溃恢复不丢 binlog），MySQL 用**两阶段提交**——先写 redo log prepare → 写 binlog → 写 redo log commit。这是「主从数据一致」的底层保障。

## 二、复制流程与并行回放

主从复制的完整链路：

```
主库（Master）                          从库（Slave）
  事务提交                                 
   ↓                                      
  写 redo log + binlog                     
   ↓                                      
  binlog dump 线程 ─────网络─────→ IO 线程（拉 binlog）
                                       ↓
                                  写 relay log（中继日志）
                                       ↓
                                  SQL 线程（回放 relay log）
                                       ↓
                                  数据一致
```

- **复制延迟**是主要痛点：单线程回放时，主库高并发写入，从库跟不上。**5.7+ 并行复制**（`slave_parallel_workers`）基于「组提交」（同一组提交的事务无冲突，可并行）或「写集合」（`binlog_transaction_dependency_tracking=WRITESET`）提升回放吞吐。
- **读写分离**：主库写，从库读，分担压力。**注意复制延迟**——刚写主库立刻从从库读可能读不到（最终一致）。强一致读要走主库或等 GTID 同步。

## 三、GTID 与半同步、组复制

| 方案 | 一致性 | 复杂度 | 适用 |
| --- | --- | --- | --- |
| **异步复制**（传统） | 最终一致，主库宕机可能丢已提交 | 低 | 容忍少量数据丢失 |
| **半同步**（`rpl_semi_sync`） | 主库等从库 ACK 才返回提交 | 中 | 减少丢数据 |
| **组复制 MGR**（`group_replication`） | Paxos 多主强一致 | 高 | 金融/高可用集群 |
| **InnoDB Cluster** | MGR + MySQL Router + MySQL Shell | 高 | 官方高可用方案 |

- **GTID 的价值**：传统复制用「binlog 文件名 + 位置（position）」标识复制进度，故障切换要手动算。GTID 用全局事务 ID，从库自动对齐——`CHANGE MASTER TO MASTER_AUTO_POSITION=1` 即可，是现代复制标配。
- **跨区复制超时坑**（本站踩过）：跨区拉 binlog 易掉线，给 `DATABASE_URL` 追加 `?connectTimeout=30000&acquireTimeout=60000&connection_limit=3` 提升稳定性。

## 四、JSON 类型：半结构化数据进关系库

8.0+ 原生 JSON 类型，二进制存储 + 自动校验 + 丰富函数：

```sql
-- 建表
CREATE TABLE product (
  id BIGINT PRIMARY KEY,
  attrs JSON,                          -- 半结构化属性
  INDEX idx_brand ((CAST(attrs->>'$.brand' AS CHAR(20))))  -- 函数索引
);

-- 插入（自动校验 JSON 合法性）
INSERT INTO product VALUES (1, '{"brand":"Apple","tags":["phone","5G"],"price":7999}');

-- 查询
SELECT attrs->>'$.brand' AS brand FROM product WHERE attrs->>'$.brand' = 'Apple';
SELECT * FROM product WHERE JSON_CONTAINS(attrs->'$.tags', '"5G"');
SELECT * FROM product, JSON_TABLE(attrs, '$.tags[*]' COLUMNS(tag VARCHAR(20) PATH '$')) AS t;
```

- **vs PostgreSQL JSONB**：MySQL JSON 功能完整但**不如 PG JSONB 强**（PG 有 GIN 索引、更丰富的操作符、`@>`包含查询更高效）。简单半结构化场景 MySQL JSON 够用；重度 JSON 查询选 PG。
- **函数索引**：JSON 内字段要高效查询，必须建**函数索引**（`CAST(col->>'$.x' AS T)`），否则全表扫描。

## 五、连接池：复用连接

每次新建 MySQL 连接的开销：TCP 三次握手 + 鉴权（加载用户/权限）+ 分配连接线程内存。高 QPS 下频繁建连是灾难。

- **客户端连接池**：HikariCP（Java）、Prisma 内置、Node 的 `mysql2/promise` 配 `connectionLimit`。**池大小建议「CPU 核数 × 2 + 磁盘数」**（HikariCP 公式），盲目调大反而因上下文切换变慢。
- **服务端连接池**：ProxySQL 连接复用 + 路由，让后端实例承受更多前端连接。
- **`max_connections`**（默认 151）：MySQL 能承受的并发连接数上限。按「应用实例数 × 每实例连接池上限 + 余量」估算，超过会报 `Too many connections`。每个连接至少分配约 256KB-1MB 内存，盲目调大耗内存。

## 六、EXPLAIN：执行计划分析

在 SQL 前加 `EXPLAIN`（或 `DESC`）看优化器的执行计划：

```sql
EXPLAIN SELECT id, name FROM user WHERE age > 18 ORDER BY name;
```

关键字段：

| 字段 | 含义 | 关注点 |
| --- | --- | --- |
| **`type`** | 访问类型 | 从好到坏：`system` > `const` > `eq_ref` > `ref` > `range` > `index` > **`ALL`（全表扫描，要消灭）** |
| **`key`** | 实际用的索引 | NULL 表示没用索引；是否符合预期 |
| **`rows`** | 预估扫描行数 | 越小越好 |
| **`Extra`** | 附加信息 | `Using index`（覆盖索引，**好**）；`Using where`（过滤）；`Using filesort`/`Using temporary`（**要优化**） |

- **EXPLAIN ANALYZE**（8.0+）：真正执行并输出**实际**耗时与行数（不只预估），调复杂 SQL 必备。
- **调优三板斧**：
  1. **消灭全表扫描**：`type=ALL` → 加合适索引。
  2. **减少回表**：用覆盖索引让 `Extra` 出现 `Using index`。
  3. **避免 filesort/临时表**：`ORDER BY`/`GROUP BY` 列走索引，避免 `Using filesort`/`Using temporary`。

## 七、慢查询与常见陷阱

- **慢查询日志**：`slow_query_log=ON`、`long_query_time=1`（秒）、`log_queries_not_using_indexes=ON`。用 `pt-query-digest slow.log` 聚合找 TOP N 慢 SQL。
- **`SELECT *`**：返回所有列，无法用覆盖索引、网络传输浪费。**只查需要的列**。
- **隐式类型转换**：`phone` 是 `VARCHAR`，`WHERE phone = 13800000000`（数字）会让索引失效变全表扫描。**字符串字段查询加引号**。
- **`LIKE '%xxx'`**：前导通配符让索引失效。用全文索引（`FULLTEXT`）或 Elasticsearch。
- **大事务/长事务**：undo 膨胀、锁持有久、主从延迟。拆成小事务、避免不必要的 `FOR UPDATE`。
- **深分页**：`LIMIT 1000000, 20` 要先扫 100 万行。改用「游标分页」`WHERE id > last_id ORDER BY id LIMIT 20`。

## 下一步

复制与调优讲完后，可回到[参考](../reference)查阅存储引擎对比、索引类型速查、隔离级别矩阵、EXPLAIN 字段速查与易错点清单。
