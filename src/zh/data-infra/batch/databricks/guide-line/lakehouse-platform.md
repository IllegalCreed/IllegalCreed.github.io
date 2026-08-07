---
layout: doc
outline: [2, 3]
---

# Lakehouse 平台：Delta Lake 事务与 Photon 引擎

> 基于 Databricks Runtime 16 / Delta Lake 3.x · 核于 2026-08

## 速查

- **Delta Lake 事务日志**：每个 Delta 表 = 一堆 Parquet 文件 + 一个 `_delta_log/` 目录，里面是按版本号命名的 JSON 提交记录（000...0.json、000...1.json...）。日志是「单一事实来源」，记录所有 add/remove 文件、schema 变更、属性。读时先读日志重建「当前该读哪些文件」，再并行读 Parquet。
- **ACID 实现**：基于**乐观并发控制（OCC）+ 原子日志提交**。写操作：①写新 Parquet 文件到表目录；②尝试原子地把新版本日志 JSON 写入（用文件系统的 conditional write / rename 原语）。若并发冲突则重试或失败。要么全成功（新文件可见），要么全失败（孤儿文件后台清理）。
- **MVCC**：每次提交对应版本号，读操作「读时定版本」——基于某版本的文件列表做快照读。**读不阻塞写，写不阻塞读**，并发安全。
- **time travel**：`VERSION AS OF n` / `TIMESTAMP AS OF 'ts'` 查历史版本。用途：审计（谁改了数据）、回滚（错误操作后还原）、复现 ML 实验（用历史特征重训）。
- **merge / upsert**：`MERGE INTO target USING source ON key WHEN MATCHED THEN UPDATE WHEN NOT MATCHED THEN INSERT`——CDC 同步（业务库变更增量合并到湖）的核心。
- **schema 强约束 + evolution**：写入校验 schema（拒绝不匹配的脏数据）；显式 `mergeSchema=true` 或 `ALTER TABLE` 演进 schema。避免「垃圾数据进湖」。
- **Z-ordering / Liquid Clustering**：对多列重排数据，让查询通过 **data skipping**（用每个文件的 min/max 统计跳过无关文件）大幅减少 IO。Z-order 是批重排，Liquid Clustering 是流式自动聚簇（Databricks 版先发）。
- **Photon 引擎**：Databricks 自研 **C++ 原生向量化执行引擎**，替代开源 Spark 的 JVM 执行层。向量化（列批量 SIMD）、原生代码（无 JVM/GC）、whole-stage codegen，让 SQL/Spark 快数倍。**闭源**，是商业化核心壁垒。
- **Unity Catalog**：统一**元数据 + 权限治理**层——管理 catalog/schema/table/view/model/volume，行/列级权限，动态视图脱敏，审计日志。取代早期 Hive Metastore 的碎片化权限。
- **OPTIMIZE / VACUUM**：`OPTIMIZE` 合并小文件 + Z-order；`VACUUM` 删除不再被引用的旧文件（释放空间，但会丢失 time travel 历史）。

## 一、Delta Lake 事务日志：单一事实来源

Delta Lake 的核心创新是**事务日志（transaction log）**。每个 Delta 表：

```
my_table/
  ├── _delta_log/
  │     ├── 00000000000000000000.json   ← version 0：CREATE TABLE
  │     ├── 00000000000000000001.json   ← version 1：add 文件 a.parquet
  │     ├── 00000000000000000002.json   ← version 2：remove a + add b
  │     ├── ...
  │     └── _last_checkpoint            ← 检查点（加速日志重放）
  └── part-00000-a.parquet              ← 实际数据（Parquet）
      part-00001-b.parquet
      ...
```

- **每个 JSON 提交**：原子记录「这次操作做了什么」——`{"add": {"path":"part-00000-a.parquet", ...}}` / `{"remove": {...}}` / `{"metaData": {"schema": ...}}` / `{"protocol": ...}`。
- **读流程**：①读日志，从 checkpoint + 增量 JSON 重建「当前版本应该读哪些文件 + schema」；②并行读这些 Parquet 文件。
- **写流程**：①写新 Parquet 文件；②尝试原子写下一个版本 JSON。并发写用 OCC——冲突时重试或按规则解决（如盲写 append 不冲突，update 互斥）。

这种「日志 + 不可变文件」的架构（类似 Kafka/Event Sourcing）让 Delta 兼具 ACID 与可审计性。

## 二、ACID 与 MVCC

Delta Lake 的 ACID：

- **原子性（Atomicity）**：每次提交要么全成功（新文件可见 + 日志更新），要么全失败（孤儿文件后台清理）——靠文件系统的原子 rename/conditional write 实现。
- **一致性（Consistency）**：schema 约束保证写入数据符合表结构，事务日志保证读到的一定是某次提交后的完整状态。
- **隔离性（Isolation）**：基于 **MVCC（多版本并发控制）**——每次提交对应版本号，读操作「读时定版本」做快照读。**写不阻塞读，读不阻塞写**。写写冲突用 OCC（乐观并发控制）：先假设不冲突地写，提交时检测，冲突则重试或失败。
- **持久性（Durability）**：写入的对象存储（S3/ADLS）本身持久，日志提交成功即永久。

MVCC 是 time travel 的基础——任何历史版本都还在（直到被 VACUUM 清理），可随时查。

## 三、time travel：版本回溯

```sql
-- 查询 5 个版本前的状态
SELECT * FROM my_table VERSION AS OF 5;

-- 查询某时间点的状态
SELECT * FROM my_table TIMESTAMP AS OF '2026-08-01 10:00:00';

-- ML 实验复现：用历史特征重训
SELECT user_id, features FROM features VERSION AS OF 100;
```

- **审计**：谁改了数据？对比版本差异。
- **回滚**：错误 UPDATE/DELETE 后，`RESTORE TABLE TO VERSION AS OF n` 还原。
- **复现 ML 实验**：训练时记录特征表的版本，重训时读同一版本保证特征一致。

## 四、merge / upsert：CDC 同步利器

```sql
MERGE INTO target AS t
USING source AS s
ON t.id = s.id
WHEN MATCHED AND s.op = 'DELETE' THEN DELETE
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

- **CDC（变更数据捕获）**：业务库（MySQL）的 binlog 变更，通过 Debezium/Flink 写到 Delta 表，用 MERGE 把增量变更合并到目标表——支持 INSERT/UPDATE/DELETE 全操作。
- **幂等写**：`INSERT OVERWRITE` 整段覆盖（适合分区级重写）；MERGE 按 key 合并（行级 upsert）。

## 五、Z-ordering 与 Liquid Clustering：加速多维查询

数据湖查询慢的主因是「**读太多无关文件**」。Delta 用聚簇 + data skipping 解决：

- **data skipping**：每个 Parquet 文件在日志里记录每列的 min/max 统计。查询带 `WHERE date = '2026-08-01'` 时，跳过 min/max 不覆盖该值的文件——大幅减少 IO。
- **Z-ordering**：对多列联合排序（如 (date, user_id)），让「这两列都接近的行」尽量在同一文件。这样按 date 或 user_id 查询都能命中。`OPTIMIZE TABLE ZORDER BY (date, user_id)`。
- **Liquid Clustering**（Databricks 版先发，逐步开源）：流式自动聚簇，写入时即维护聚簇，无需定期 OPTIMIZE——比 Z-order 更省运维。

## 六、Photon：C++ 向量化执行引擎

Photon 是 Databricks 商业化的核心壁垒——替代开源 Spark 的 JVM 执行层：

| 维度 | 开源 Spark（JVM） | Photon（C++） |
| --- | --- | --- |
| 语言 | Scala/Java（JVM） | **C++ 原生** |
| 执行 | 行/对象 | **向量化（列批量 SIMD）** |
| 内存 | JVM 堆 + GC | **堆外，无 GC** |
| 代码生成 | whole-stage codegen（JVM 字节码） | **C++ 编译** |
| 性能 | 基线 | **快数倍（部分场景 10x+）** |

- **向量化（vectorized）**：一次处理一批列数据（而非一行），充分利用 CPU SIMD（单指令多数据）+ 缓存 locality。
- **无 JVM/GC**：C++ 原生，避免 GC 停顿与对象开销，长查询稳定。
- **闭源**：Photon 是 Databricks 专有，开源 Spark 没有——这是用 Databricks vs 自建开源 Spark 的核心性能差异来源。
- **自动启用**：在 Databricks Runtime 选 Photon-enabled 集群即用，无需改 SQL/代码。

## 七、Unity Catalog：统一治理

Unity Catalog（2021）是 Databricks 的统一**元数据 + 权限**层：

```
Catalog（目录）
  └── Schema（库）
      └── Table / View / Volume / Model
```

- **统一命名空间**：`catalog.schema.table`，所有数据资产（表/视图/模型/文件）统一管理。
- **行/列级权限**：GRANT SELECT ON table，动态视图做行级过滤/列脱敏（如 `mask(email)`）。
- **审计日志**：所有访问记录，满足合规（GDPR/等保）。
- **取代 Hive Metastore**：早期 Databricks 用 Hive Metastore 管元数据，碎片化（每 workspace 一套），Unity Catalog 统一全局。

## 八、OPTIMIZE 与 VACUUM：维护操作

- **OPTIMIZE**：合并小文件（每个 task 写一个文件易产生小文件，OPTIMIZE 把它们合并成大文件，加速后续读）。配合 Z-order 重排。
- **VACUUM**：删除不再被引用的旧文件（已被新版本 remove 的 Parquet）。释放空间，但**会丢失 time travel 历史**——超过保留期（默认 7 天）的版本被清掉，不能再 VERSION AS OF 那些版本。所以要按需配置保留期。

## 下一步

掌握了 Delta Lake 与 Photon 后，下一步是 [集成：MLflow、Spark 商业化与开源对比](./integration) —— MLflow 四件套、Databricks Runtime vs 开源 Spark、Serverless 与定价、与 Snowflake/BigQuery 对照。
