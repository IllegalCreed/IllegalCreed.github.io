---
layout: doc
outline: [2, 3]
---

# Flink SQL、Checkpoint 与 CEP：SQL 写流、exactly-once 与模式匹配

> 基于 Apache Flink 1.20 · 核于 2026-08

## 速查

- **Table API & SQL**：Flink 的**关系型 API**——用 SQL/表算子（select/where/join/group by）写流处理，让分析师也能做实时数仓。底层编译成与 DataStream 同一套算子，流批统一。
- **动态表（Dynamic Table）**：SQL 里的「表」在流语境下是**随时间变化的动态表**——查询结果也是动态表，被转成** changelog 流**（INSERT/UPDATE/DELETE）下发。
- **连续查询（Continuous Query）**：流上的 SQL 是**永不停止的连续查询**，每来一条数据增量更新结果。与批查询（一次性出结果）相对。
- **Checkpoint**：基于 **Chandy-Lamport 分布式快照**算法——JobManager 周期性向 source 注入 **checkpoint barrier**，barrier 随数据流传播，算子收到 barrier 后对齐并对自身状态做快照。所有算子快照汇总即一份全局一致的状态。
- **barrier 对齐**：多上游算子收到 barrier 时间不同，需**对齐**（缓存早到 barrier 的上游数据）以保证一致性——会引入短暂延迟，可用 **unaligned checkpoint** 牺牲精确性换低延迟。
- **exactly-once 三件套**：①**可重放的 source**（Kafka 提交 offset 跟随 checkpoint）；②**Checkpoint 状态快照**（恢复后状态一致）；③**事务/幂等 sink**（两阶段提交或幂等写，保证下游不重不漏）。
- **Savepoint**：**手动触发**的 Checkpoint（如版本升级/作业迁移），格式与 Checkpoint 兼容但**按算子 ID 绑定**（不像 Checkpoint 是临时快照）。改代码后用 `uid()` 固定算子 ID 才能恢复状态。
- **CEP（Complex Event Processing）**：用**模式（Pattern）**定义时序事件组合（如「登录失败 3 次后 5 分钟内成功」），从流中检测匹配。`PatternStream` + `select` 输出匹配事件。
- **CEP 模式要素**：`begin("a").where(...)`（起点）→ `followedBy("b")`（非严格紧跟）→ `times(3)`（重复）→ `within(Time.minutes(5))`（时间窗口）。
- **Flink vs Kafka Streams**：Flink 是**独立集群 + 全功能**（SQL/CEP/批统一）；Kafka Streams 是**嵌入式库**（嵌入应用进程，无独立集群，依赖 Kafka 为主）。

## 一、Flink SQL：用关系算子写流处理

DataStream API 要写 Java/Scala 代码，对分析师门槛高。Flink SQL 让你**像写离线 SQL 一样写流处理**：

```sql
-- 建动态表（对应 Kafka topic）
CREATE TABLE orders (
  order_id   STRING,
  user_id    BIGINT,
  amount     DECIMAL(10, 2),
  ts         TIMESTAMP(3),
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND   -- watermark 直接在 DDL 声明
) WITH (
  'connector' = 'kafka',
  'topic' = 'orders',
  'properties.bootstrap.servers' = '...',
  'format' = 'json'
);

-- 每分钟滚动窗口统计各用户的下单金额（连续查询，永不停止）
SELECT
  user_id,
  TUMBLE_START(ts, INTERVAL '1' MINUTE) AS win_start,
  SUM(amount) AS total
FROM orders
GROUP BY user_id, TUMBLE(ts, INTERVAL '1' MINUTE);
```

底层这条 SQL 会被优化器（基于 Calcite）转成与 DataStream 同一套算子执行计划——**SQL 和 DataStream 是同一运行时的两种 API**。

## 二、动态表与连续查询

SQL 的核心抽象是「表」，但流上的表是**动态的**——随数据到来不断变化。Flink 用两个概念衔接：

- **动态表（Dynamic Table）**：随时间变化的表。source（如 Kafka）是一张不断 append 的动态表；带 GROUP BY 的查询结果是「每来一条数据就更新一行」的动态表。
- **changelog 流（Changelog Stream）**：动态表可转成流——每行变化编码成 `+I`（INSERT）/`+U`（UPDATE 后值）/`-U`（UPDATE 前值）/`-D`（DELETE）。

```
Kafka 订单流            SELECT user_id, SUM(amount) FROM orders GROUP BY user_id
(append-only)          (动态表，每来一条更新一行)
                        ┌─────────────────────┐
order1 (u1, 10)   ──►   │ u1 → 10             │  +I(u1,10)
order2 (u2, 20)   ──►   │ u1 → 10, u2 → 20    │  +I(u2,20)
order3 (u1, 5)    ──►   │ u1 → 15, u2 → 20    │  -U(u1,10) +U(u1,15)
                        └─────────────────────┘   （changelog 流，发到 sink）
```

- **append-only 表 vs upsert 表**：source 通常是 append-only（只 INSERT）；GROUP BY/JOIN 的结果表是 upsert（有主键，可 UPDATE）。sink 要支持对应模式（如 MySQL/UPSERT Kafka）。
- **retention time vs processing time**：流 SQL 的事件时间窗口用 `TUMBLE/HOP/SESSION` 函数；窗口函数内部依赖 watermark 触发清理。

## 三、Checkpoint：Chandy-Lamport 分布式快照

故障后要恢复，必须有一份**全局一致的状态快照**。Flink 用 Chandy-Lamport 算法的工程实现——**Checkpoint Barrier**：

```
JobManager 触发 Checkpoint N
        │ 向 source 注入 barrier N
        ▼
  source ──[barrier N]──► op1 ──[barrier N]──► op2 ──► sink
   ① 收到 barrier，快照自身状态（含 Kafka offset）
   ② 把 barrier 广播到下游
        │
   op1 收到 barrier（若多上游要「对齐」：缓存早到 barrier 的上游数据）
        ③ 快照自身状态
        ④ 继续传播 barrier
   ...
   sink 收到 barrier → 快照 + 通知 JM「Checkpoint N 完成」
   所有算子都上报 → JM 标记 Checkpoint N 成功（全局一致快照）
```

- **barrier 随数据传播**：barrier 像一条特殊「事件」混在数据流里，不污染数据。
- **对齐（aligned）**：多上游算子收到 barrier 时刻不同，要**对齐**——缓存早到 barrier 的那条上游数据，等所有上游 barrier 都到再快照。对齐保证「checkpoint 内状态对应同一逻辑时刻」。
- **非对齐（unaligned）**：背压严重时对齐缓存爆掉，可用 `unalignedCheckpoints`（barrier 直通，状态快照里带上 in-flight 数据）——牺牲精确语义换低延迟。Flink 1.11+ 引入。
- **配置**：`env.enableCheckpointing(60000)`（60 秒一次）；`setCheckpointingMode(EXACTLY_ONCE)`（默认）；`setMinPauseBetweenCheckpoints`、`setCheckpointTimeout`、`setMaxConcurrentCheckpoints` 等调优。
- **故障恢复**：JM 选最近成功 Checkpoint N，所有算子恢复到 N 的状态，source 从 N 记录的 offset 重新读——重放 (N, now] 的数据。

## 四、exactly-once：三件套

「精确一次」不是 Checkpoint 单独保证的，要 source + checkpoint + sink **三方协同**：

1. **可重放的 source**：如 Kafka——Checkpoint 时把当前 offset 也存进快照；恢复时从 checkpoint 的 offset 重新读，保证「故障后从一致位点重放」。
2. **Checkpoint 状态快照**：状态在恢复后回到一致点，避免重复累加。
3. **事务/幂等 sink**：恢复后重放的数据要能被正确处理——
   - **两阶段提交（Two-Phase Commit, 2PC）**：sink 先预写（prepare），Checkpoint 成功后再 commit（如 Kafka 事务 producer、JDBC 事务）。这是 Flink 端到端 exactly-once 的标准方案。
   - **幂等写**：每次写主键相同，重复写结果不变（如 `INSERT ... ON DUPLICATE KEY UPDATE`），是简化方案（依赖下游幂等性）。

- **at-least-once vs exactly-once**：Checkpoint 模式设 `at-least-once` 时算子不要求 barrier 对齐，状态可能多算，靠下游幂等兜底。延迟低但下游要抗重。
- **端到端 exactly-once**：source + sink 都要支持——Kafka 0.11+ 事务 producer、JDBC 事务、自定义两阶段提交 sink。

## 五、Savepoint：手动快照与作业迁移

Savepoint 是**手动触发**的全局快照，格式与 Checkpoint 兼容但用途不同：

| | Checkpoint | Savepoint |
| --- | --- | --- |
| 触发 | **自动周期性** | **手动**（CLI `savepoint`） |
| 目的 | **故障恢复** | **版本升级/作业迁移/暂停恢复** |
| 格式 | 增量（RocksDB）、标准化（1.15+） | 标准化、跨版本兼容性更好 |
| 生命周期 | 作业取消通常删（可配保留） | **长期保留**，独立于作业 |
| 算子绑定 | 按位点 | **按算子 uid() 绑定** |

- **算子 ID 是关键**：恢复状态时按 `uid("name")` 匹配算子。改代码（增删算子、调顺序）后只要 uid 不变，状态就能恢复。**强烈建议给每个算子显式 `.uid("xxx")`**，否则 Flink 用 hash（改代码就变，状态对不上）。
- **典型用法**：升级 Flink 版本 → `stop --savepointPath s3://...`（停作业并存 savepoint）→ 新版本代码 `run --fromSavepoint s3://...`（从 savepoint 恢复）。
- **状态兼容性**：改状态结构（如 ValueState 改 MapState）可能破坏兼容性——用 `TypeSerializerSnapshot` 自定义迁移逻辑。

## 六、CEP：复杂事件处理

CEP（Complex Event Processing）让你用**模式（Pattern）**描述感兴趣的时序事件组合，框架从流中检出匹配——风控（连续失败登录）、IoT（温度异常序列）、运维（连续告警）。

```java
// 检测「同一用户 5 分钟内登录失败 3 次后成功」
Pattern<LoginEvent, ?> pattern = Pattern
    .<LoginEvent>begin("fails")                       // 起点：失败
        .where(e -> !e.success)
        .timesOrMore(3)                                // 至少 3 次
        .consecutive()                                 // 连续（中间不能成功）
    .followedBy("success")                             // 紧跟：成功
        .where(e -> e.success)
    .within(Time.minutes(5));                          // 整个序列在 5 分钟内

CEP.pattern(loginStream.keyBy(e -> e.userId), pattern)
    .process(new PatternProcessFunction<...>() { ... }) // 处理匹配
    .print();
```

- **模式算子**：`begin`（起点）、`followedBy`（非严格紧跟，中间可有其他事件）、`next`（严格紧跟）、`notNext`/`notFollowedBy`（否定）。
- **量词**：`times(n)`、`timesOrMore(n)`、`oneOrMore`、`optional`、`consecutive`（连续）。
- **within**：整个模式的时间窗口限制。
- **CEP 内部用 NFA（非确定有限自动机）** 实现模式匹配——每个 key 维护一个 NFA 状态机（也是状态，被 Checkpoint 容错）。

## 下一步

掌握了 Flink SQL、Checkpoint 与 CEP 后，可进入 [参考](../reference) 速查状态类型、窗口对比、Checkpoint 配置、Flink vs Spark vs Kafka Streams 选型与易错点。
