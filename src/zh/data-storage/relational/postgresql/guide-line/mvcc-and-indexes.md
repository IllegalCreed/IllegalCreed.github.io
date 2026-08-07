---
layout: doc
outline: [2, 3]
---

# MVCC 与索引类型：每行多版本、VACUUM 与 GIN/GiST/BRIN

> 基于 PostgreSQL 17 / 18 · 核于 2026-08

## 速查

- **PG 的 MVCC = 每行多版本**：UPDATE 实际是「标记旧行已死（设 xmax）+ 插入新行」，旧行（dead tuple）留在表里靠 **VACUUM** 清理。与 MySQL（undo log 回滚段）根本不同。
- **无回滚段膨胀**：PG 不用 undo log，所以没有 MySQL 长事务致 undo 膨胀的问题；但代价是**表膨胀**（dead tuples 占空间）需 VACUUM 回收。
- **VACUUM**：扫描表清理 dead tuples，标记空间可重用（不一定还给 OS）。`autovacuum` 后台进程默认开启；大表/高写入可能跟不上，需调参；`VACUUM FULL` 锁表重建回收空间（慎用）。
- **xmin/xmax**：每行的系统列。`xmin` = 插入该行的事务 ID，`xmax` = 删除/更新该行的事务 ID（0 表示未删）。MVCC 判断可见性靠这两个字段 + 事务快照。
- **隔离级别默认 READ COMMITTED**：与 MySQL 默认 REPEATABLE READ 不同。PG 还支持真正的 SERIALIZABLE（SSI 实现，可串行化快照隔离）。
- **索引类型 5+1**：**B-tree**（默认，等值/范围/排序）、**GIN**（倒排，JSONB/数组/全文）、**GiST**（空间/R-树）、**BRIN**（块范围摘要，海量有序）、**SP-GiST**（空间分区）、**Hash**（仅等值，少用）。
- **GIN 是 JSONB/全文/数组的杀手锏**：倒排索引，`@>`包含、`?`键存在、`@@`全文匹配都高效。
- **BRIN 极省空间**：只为每个数据块存 min/max 摘要，前提数据物理有序（时序数据），1TB 表索引可能几 MB。
- **JSONB**：二进制 JSON（解析后存储，去重保序），与 JSON（文本）不同。`@>`/`?`/`->`/`->>`/`#>`操作符，配 GIN 索引。
- **部分索引**：`CREATE INDEX ... WHERE cond`，只索引满足条件的行，省空间提查询。**表达式索引**：`CREATE INDEX ON t(LOWER(name))`，对函数结果索引。

## 一、MVCC：每行多版本

PG 的 MVCC 与 MySQL InnoDB 的根本差异在于「多版本存哪」：

```
MySQL InnoDB：                       PostgreSQL：
表（当前数据）                         表（所有版本都在表里）
  行: {data, ...}                       行: {xmin=100, xmax=0, data...}     ← 当前
                                        行: {xmin=90,  xmax=100, data...}   ← 死（被 UPDATE 替换）
undo log（历史版本链）                  （无独立 undo log，旧版本就在表里）
  行: 旧版本 → 更旧版本 → ...
```

- **UPDATE 流程**：①找到旧行；②**标记旧行已死**（设 xmax = 当前事务 ID）；③**插入新行**（xmin = 当前事务 ID）。所以一次 UPDATE 至少产生一行 dead tuple。
- **DELETE 流程**：只标记 xmax（不真正删除），dead tuple 留待 VACUUM。
- **可见性判断**：读操作根据「事务快照」（哪些事务在我开始时已提交）+ 行的 xmin/xmax，判断该行版本对我是否可见。只有 `xmin` 已提交且 `xmax` 未提交/为 0 的版本可见。
- **优势**：①无 undo log，**无回滚段膨胀**；②回滚极快（只需标记）；③DDL 大多非阻塞（pg_rewind）。
- **代价——表膨胀**：dead tuples 留在表里占空间，需 **VACUUM** 清理。

## 二、VACUUM：清理 dead tuples

VACUUM 是 PG 运维的核心概念：

| 操作 | 行为 | 锁表 |
| --- | --- | --- |
| `VACUUM` | 标记 dead tuples 空间可重用（不一定还给 OS），更新统计 | 否（并发安全） |
| `VACUUM FULL` | 锁表重建表，物理回收空间还给 OS，重建索引 | **是**（慎用，用 pg_repack 替代） |
| `ANALYZE` | 采样更新统计信息，供优化器选执行计划 | 否 |
| `VACUUM ANALYZE` | 两者都做 | 否 |
| `autovacuum` | 后台进程自动 VACUUM/ANALYZE | 否 |

- **autovacuum 调参**：默认在「dead tuples 占表 20%（`autovacuum_vacuum_scale_factor`）+ 50 行（`autovacuum_vacuum_threshold`）」时触发。大表/高写入可能跟不上，需调低 scale_factor 或对单表设置。
- **表膨胀的危害**：①磁盘占用涨；②查询要扫描更多 dead tuples 变慢；③索引也膨胀。监控 `pg_stat_user_tables` 的 `n_dead_tup`。
- **bloat 修复**：轻度用 `VACUUM`；严重用 `pg_repack`（在线重建，不锁表）或 `VACUUM FULL`（锁表，停服窗口）。

## 三、隔离级别：默认 RC，支持真 SERIALIZABLE

PG 支持四种标准隔离级别，但默认与实现细节与 MySQL 不同：

| 隔离级别 | PG 实现 | 默认 | 特点 |
| --- | --- | --- | --- |
| READ UNCOMMITTED | 实际等同 RC | ❌ | PG 不允许脏读 |
| **READ COMMITTED** | 每条语句新快照 | ✅ **PG 默认** | 不可重复读/幻读可能 |
| REPEATABLE READ | 事务首个语句定快照 | ❌ | PG 的 RR 已防幻读（快照隔离） |
| SERIALIZABLE | **SSI**（可串行化快照隔离） | ❌ | 真正可串行化，并发冲突会回滚重试 |

- **PG 默认 READ COMMITTED**——与 MySQL 默认 REPEATABLE READ 不同。迁移时要注意。
- **PG 的 RR 实际是「快照隔离」**：已能防幻读（比 SQL 标准的 RR 更强），但存在「写偏序异常」（write skew）——两个事务各自基于快照读后写不同行，结果不可串行化。SERIALIZABLE（SSI）才彻底解决。
- **SERIALIZABLE 的 SSI**：PG 用 SSI（Serializable Snapshot Isolation）检测并发冲突，冲突时回滚并抛 `40001` 错误，应用需重试。性能开销比 RC/RR 高，金融强一致场景才用。

## 四、索引类型：B-tree + GIN + GiST + BRIN + SP-GiST

PG 的索引体系是开源库中最丰富的，按数据与查询选型：

### B-tree（默认）

- 结构：B+ 树，等值/范围/排序/唯一约束都靠它。
- 适用：`=`/`<`/`>`/`BETWEEN`/`IN`/`IS NULL`/`ORDER BY`/`LIKE 'prefix%'`（前缀）。
- 自动：主键、UNIQUE、外键默认建 B-tree。

### GIN（Generalized Inverted Index，倒排索引）

- 结构：**倒排索引**——「值 → 行指针列表」。一个键值映射到多行。
- 适用：**多值列**（JSONB、数组、tsvector 全文），`@>`包含、`?`键存在、`@@`全文匹配。
- 优势：JSONB `WHERE attrs @> '{"k":"v"}'` 走 GIN 极快。
- 劣势：构建慢（倒排维护成本高）、占空间大；可用 `gin_pending_list_limit` 缓解。

### GiST（Generalized Search Tree）

- 结构：平衡树的通用框架，可塞入 R-树（空间）、范围树等。
- 适用：**空间数据**（PostGIS 的 `&&`/`<->`）、范围重叠（`&&`）、KNN 最近邻（`<->`）。
- 典型：PostGIS 地理查询（`ST_DWithin`、`ST_Contains`）底层用 GiST。

### BRIN（Block Range Index，块范围索引）

- 结构：**块范围摘要**——只为每 N 个数据页存「min/max/计数」摘要，不存具体行。
- 适用：**海量有序数据**（如时间序列，按时间写入物理有序）。
- 优势：**极省空间**（1TB 表的 BRIN 索引可能只有几 MB），适合冷数据范围扫描。
- 劣势：无序数据效果差（min/max 范围太宽，过滤不掉）。

### SP-GiST（Space-Partitioned GiST）

- 结构：空间分区树（非平衡），适合「分区」型数据。
- 适用：IP 路由表、电话区号、kd-树。少用，特定场景。

### Hash

- 结构：哈希表。仅支持**等值**（不支持范围/排序）。PG 10 后 WAL 安全。少用，B-tree 通常够。

## 五、JSONB 与 GIN：混合存储

JSONB 是 PG 的杀手特性之一。JSONB 与 JSON 的区别：

| 类型 | 存储 | 校验 | 索引 | 操作 |
| --- | --- | --- | --- | --- |
| `JSON` | 原始文本 | 插入时校验 | 需函数索引 | 保序、保留重复键 |
| **`JSONB`** | 解析后二进制 | 插入时校验 | **GIN 原生支持** | 去重、不保序、更高效 |

操作符速查：

| 操作符 | 含义 | 示例 |
| --- | --- | --- |
| `->` | 取 JSON 值（返回 JSONB） | `'{"a":1}'::jsonb -> 'a'` → `1` |
| `->>` | 取文本（返回 text） | `'{"a":1}'::jsonb ->> 'a'` → `'1'` |
| `#>` / `#>>` | 路径取值/文本 | `'{"a":{"b":1}}' #> '{a,b}'` |
| `@>` | 包含（左侧含右侧） | `'{"a":1,"b":2}' @> '{"a":1}'` → `t` |
| `<@` | 被包含 | — |
| `?` | 键存在 | `'{"a":1}' ? 'a'` → `t` |
| `?\|` / `?&` | 任一/全部键存在 | — |

```sql
CREATE TABLE product (id BIGSERIAL PRIMARY KEY, attrs JSONB);
CREATE INDEX idx_attrs ON product USING GIN(attrs jsonb_path_ops);  -- jsonb_path_ops 更小更快，只支持 @/

SELECT * FROM product WHERE attrs @> '{"brand":"Apple"}';   -- GIN 加速
```

- **jsonb_path_ops vs 默认 ops**：`jsonb_path_ops` 索引更小更快，但只支持 `@>`（不支持 `?`）。按查询模式选。
- **vs MySQL JSON**：PG JSONB + GIN 的 `@>`包含查询明显强于 MySQL（MySQL 要靠函数索引），重度 JSON 选 PG。

## 六、部分索引与表达式索引

- **部分索引（Partial Index）**：`CREATE INDEX idx ON t(status) WHERE status='active'`，只索引满足条件的行。常用于「热数据少」场景——90% 数据是 `inactive`，只索引 `active` 的 10%，省空间、提查询。
- **表达式索引**：`CREATE INDEX idx ON t(LOWER(email))`，对函数/表达式结果索引。查询 `WHERE LOWER(email) = ?` 才能用上。常用于大小写不敏感查询。
- **唯一约束索引**：`CREATE UNIQUE INDEX` 可带条件或表达式，灵活实现「部分唯一」（如「每个用户只能有一个默认地址」）。

## 下一步

MVCC 与索引讲透后，下一个核心是[CTE、窗口函数与扩展生态](./extensions-and-features)——递归 CTE、窗口函数、pgvector/timescaledb/postgis、逻辑复制与 pgbouncer。
