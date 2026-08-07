---
layout: doc
outline: [2, 3]
---

# 用例与 SQL：物化视图、近似查询与 Serverless

> 基于 ClickHouse 24.x / ClickHouse Cloud · 核于 2026-08

## 速查

- **物化视图（Materialized View）**：预计算并物化聚合，原表写入触发物化视图**增量更新**，查询趋势直接读物化表，快几个数量级。
- **物化视图底层**：通常用 `SummingMergeTree` 或 `AggregatingMergeTree`，合并时自动预聚合。
- **聚合状态函数**：`uniqState`/`quantileState`/`sumState` 存「聚合状态」，`uniqMerge`/`quantileMerge` 合并状态得最终值——支持增量聚合。
- **近似查询**：`uniq()`（HyperLogLog 去重，~0.5-2% 误差）、`quantile()`（分位数估计）、`SAMPLE`（采样扫描），毫秒级近似结果，精度换速度。
- **标准 SQL**：兼容大部分 ANSI SQL + 大量扩展（数组/JSON/URL/日期/窗口函数），JDBC/ODBC/HTTP/原生协议接入。
- **产品分析场景**：漏斗（windowFunnel）、留存（retention）、用户路径——扫全量事件聚合，ClickHouse 强项。
- **日志分析场景**：TB 级应用/访问/安全日志，快速检索统计，分区裁剪 + 列存扫描。
- **Serverless / ClickHouse Cloud**：存算分离（存储 S3 + 计算弹性）、按用量付费、自动扩缩容、免运维。
- **不适合场景**：强 ACID 事务、点查（按主键取单行）、频繁随机更新/删除（mutation 异步且代价高）。

## 一、物化视图：预聚合加速

物化视图是 ClickHouse 加速重复查询的核心手段。原理：原表写入时，自动触发物化视图的增量计算（按 GROUP BY 聚合），结果存到物化视图的目标表。查询趋势读物化视图（预聚合数据少），而非扫原表。

### 示例：每分钟去重用户数

```sql
-- 1. 原表：原始事件（每秒海量写入）
CREATE TABLE events (
  time DateTime, user_id UInt64, event String
) ENGINE = MergeTree ORDER BY (time, user_id);

-- 2. 物化视图：每分钟 UV（增量聚合，存 uniqState 状态）
CREATE MATERIALIZED VIEW mv_minute_uv
ENGINE = AggregatingMergeTree ORDER BY (minute)
AS SELECT
  toStartMinute(time) AS minute,
  uniqState(user_id)  AS uv_state   -- 存聚合状态，非最终值
FROM events
GROUP BY minute;

-- 3. 查询：合并状态得最终 UV
SELECT minute, uniqMerge(uv_state) AS uv
FROM mv_minute_uv
WHERE minute > now() - INTERVAL 1 HOUR
GROUP BY minute ORDER BY minute;
```

### 关键点

- **增量更新**：原表每批写入，物化视图自动按 GROUP BY 增量聚合（不是全量重算）。
- **聚合状态**：`uniqState` 存的是 HyperLogLog 状态（可合并），用 `uniqMerge` 合并多 part 状态得最终 UV。这让增量聚合正确（多批的状态可合并）。
- **多层级联**：分钟 → 小时 → 天，每层物化视图，大范围查粗粒度。

## 二、近似查询：精度换速度

海量数据精确聚合慢，ClickHouse 提供近似函数，毫秒级返回近似结果：

### HyperLogLog 近似去重

```sql
-- 精确去重（慢，要存所有 user_id）
SELECT count(DISTINCT user_id) FROM events WHERE date = today();

-- 近似去重（快，HyperLogLog 固定内存，~0.5-2% 误差）
SELECT uniq(user_id) FROM events WHERE date = today();
-- 或显式：uniqHLL12(user_id)、uniqCombined(user_id)
```

- **原理**：HyperLogLog 用哈希 + 概率估计基数，固定内存（如 64KB）即可估计上亿基数，误差 ~0.5-2%。
- **场景**：UV 统计、独立访客——看趋势，±1% 无所谓。

### 分位数估计

```sql
-- 近似 P99 延迟（reservoir sampling）
SELECT quantile(0.99)(latency) FROM requests;
-- 更精确：quantileTDigest / quantileExact（精确但慢）
```

### 采样查询

```sql
-- 只扫 10% 数据（采样）
SELECT avg(amount) FROM orders SAMPLE 0.1 WHERE date = today();
```

适合探索性分析、看大致趋势。

| 函数 | 用途 | 精度 |
| --- | --- | --- |
| `uniq()` | 近似去重计数 | ~0.5-2% 误差 |
| `quantile()` | 近似分位数 | 中等 |
| `SAMPLE n` | 采样查询 | 取决于样本量 |
| `any()` | 任意取一值 | 非聚合 |

## 三、标准 SQL 与扩展函数

ClickHouse 用标准 SQL（兼容大部分 ANSI SQL），并扩展大量函数：

### 数组函数

```sql
-- 事件按用户分组，取每个用户最近 3 个事件
SELECT user_id, arraySlice(groupArray(event), 1, 3) AS recent_events
FROM events GROUP BY user_id;

-- 数组展开（一行变多行）
SELECT arrayJoin([1,2,3]);  -- 返回 3 行
```

### JSON / URL / 日期函数

```sql
-- 解析 JSON 字段
SELECT JSONExtractString(props, 'city') FROM events;

-- 解析 URL
SELECT domain(URL) FROM access_logs;

-- 日期函数
SELECT toStartOfHour(time), dateDiff('day', time1, time2);
```

### 窗口函数（ClickHouse 支持）

```sql
SELECT user_id, time,
  row_number() OVER (PARTITION BY user_id ORDER BY time) AS rn
FROM events;
```

### 接入协议

- **原生 TCP 协议**：最高性能，官方客户端用。
- **HTTP**：通用，RESTful，BI/语言绑定常用。
- **JDBC/ODBC**：Java/传统 BI（Tableau/Superset/Metabase）直连。

## 四、产品分析场景

ClickHouse 是产品分析（漏斗/留存）的顶级选择：

### 漏斗分析（windowFunnel）

```sql
-- 计算用户完成「浏览→加购→下单」漏斗的转化
SELECT
  windowFunnel(1800)(time, event='view', event='cart', event='order') AS step
FROM events
WHERE date = today() GROUP BY user_id;
-- step=3 表示完成全部，step=1 只浏览
```

### 留存分析（retention）

```sql
-- 第 1 天访问的用户，在第 2/3/7 天是否回访
SELECT
  retention(time = '2026-08-01', time = '2026-08-02') AS r2,
  retention(time = '2026-08-01', time = '2026-08-08') AS r7
FROM events GROUP BY user_id;
```

这些函数扫全量事件聚合，行存库做不到（太慢），ClickHouse 列存向量化秒级返回。

## 五、日志分析场景

```sql
-- TB 级访问日志：按 URL 统计 QPS 与 P99 延迟
SELECT
  domain(URL),
  count() AS qps,
  quantile(0.99)(latency) AS p99
FROM access_logs
WHERE date BETWEEN '2026-08-01' AND '2026-08-07'
GROUP BY domain(URL) ORDER BY qps DESC;
```

分区裁剪（按 date）只扫相关分区，列存只读 URL/latency 列，秒级出结果。这是 ELK（Elasticsearch）之外的大规模日志分析方案，ClickHouse 在纯统计聚合上更快更省。

## 六、Serverless / ClickHouse Cloud

- **存算分离**：存储放对象存储（S3），计算节点无状态弹性扩缩容。
- **按用量付费**：存储按 GB、计算按 CU（Compute Unit）秒级计费。
- **自动扩缩容**：查询高峰自动加计算节点，闲时缩容。
- **免运维**：备份、升级、监控、高可用全托管。
- **适合**：不想自建集群、负载波动大、按需付费。

## 七、不适合的场景

| 场景 | 不适合原因 | 替代 |
| --- | --- | --- |
| 强 ACID 事务 | 无强事务 | MySQL/PG |
| 点查（按主键取单行） | 列存点查弱 | Redis/MySQL |
| 频繁随机 UPDATE/DELETE | mutation 异步且代价高 | OLTP 库 |
| 复杂多表 JOIN | 分布式 JOIN 是瓶颈 | 关系库/数据仓库 |

## 下一步

掌握物化视图、近似查询、场景用例后，可进入 [参考](../reference) 查阅 MergeTree 家族对比、近似函数速查、分布式架构与易错点清单。
