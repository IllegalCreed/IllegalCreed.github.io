---
layout: doc
outline: [2, 3]
---

# SQL 与监控集成：3.x Parquet 引擎与 TIG 栈

> 基于 InfluxDB 3 Core/Enterprise · 核于 2026-08

## 速查

- **3.x 的查询栈**：**SQL**（标准 ANSI）→ **Apache DataFusion**（Rust 查询引擎，解析优化执行）→ **Apache Arrow**（列式内存格式）→ **Parquet**（列式存储文件）。四层全开源、全列式。
- **回归 SQL**：3.x 主推标准 SQL，弃用 1.x 的 InfluxQL 与 2.x 的 Flux。`SELECT mean(value) FROM cpu WHERE time > now() - interval '1 hour' GROUP BY date_bin(...)` 即可查时序。
- **Parquet 列存**：底层按列存储 + 高压缩比（相邻时间点的数值相似，delta/run-length 编码压缩极高）。列式聚合（只读需要的列）远快于行存。
- **Apache Arrow 内存格式**：查询结果在内存里是列式的 Arrow RecordBatch，可**零拷贝**传给 Pandas/Polars/Spark/BI——无序列化开销。
- **Apache DataFusion**：Rust 写的查询引擎（基于 Arrow），提供 SQL 解析、优化、向量化执行，InfluxDB 3.x 直接复用而非自研。
- **Flight RPC**：Apache Arrow Flight 提供**高性能远程查询**协议（gRPC + Arrow 流），比 HTTP+JSON 快一个数量级，适合大数据量传输。
- **Telegraf**：Go 写的采集 agent，**插件化**——input（数百种数据源）+ processor（转换）+ output（写出）。配置即启用，无需写采集代码。
- **Grafana**：可视化平台，原生支持 InfluxDB 数据源（SQL/Flux），写查询画时序图、配告警，是「看监控」的标准界面。
- **TIG 数据流**：服务器/应用 → Telegraf 采集 → InfluxDB 存储 → Grafana 查询展示。
- **3.x 弃用 Flux**：Flux 函数式语言学习曲线陡、生态小，3.x 转向 SQL（兼容 DataFusion 的 ANSI SQL + 时序扩展）。

## 一、3.x 的查询栈：SQL → DataFusion → Arrow → Parquet

3.x 完全重写了查询栈，拥抱开源列式生态：

```
   用户查询（SQL / InfluxQL / Flight RPC）
            │
            ▼
   ┌──────────────────┐
   │ Apache DataFusion │  ← SQL 解析、优化、向量化执行
   └────────┬─────────┘
            │ Apache Arrow（列式内存格式）
            ▼
   ┌──────────────────┐
   │   Parquet 文件    │  ← 列式存储、高压缩、按时间分区
   └──────────────────┘
```

每一层都关键：

- **SQL 接口**：用户写标准 `SELECT ... FROM ... WHERE time > ... GROUP BY ...`，DataFusion 解析执行。BI 工具（Superset/Metabase）、ORM、数据科学家无需学新语言。
- **DataFusion 执行**：基于 Arrow 的向量化执行引擎，按批处理（一次处理一批列向量），CPU 缓存友好、能 SIMD 加速。
- **Arrow 内存格式**：执行中间结果与最终结果都是 Arrow 列式表，**零拷贝**传给下游（Pandas/Polars/Spark/Flight 客户端），无序列化/反序列化开销。
- **Parquet 存储**：数据持久化为 Parquet 列式文件，按时间分区（如每天一个文件）。列式压缩（数值列 delta/run-length encoding）让时序数据压缩比常达 10-50 倍。

### SQL 查询时序示例

```sql
-- 过去 1 小时每分钟 CPU 平均使用率（按 host 分组）
SELECT
  date_bin(INTERVAL '1 minute', time, TIMESTAMP '1970-01-01') AS bucket,
  host,
  AVG(usage) AS avg_usage
FROM cpu
WHERE time > now() - INTERVAL '1 hour'
GROUP BY bucket, host
ORDER BY bucket, host;
```

- `date_bin`：把时间戳按窗口分桶（类似 InfluxQL 的 `GROUP BY time(1m)`）。
- 聚合函数 `AVG`/`MAX`/`MIN`/`SUM`/`COUNT` 直接用，列式执行高效。

## 二、为何 Parquet + Arrow：列式的胜利

通用行存（MySQL/PG 的 B+ 树）适合事务（取一整行），但分析聚合（只算某列的均值）要读整行浪费 IO。列式存储按列存，聚合时只读目标列：

| 维度 | 行存（MySQL/PG） | 列存（Parquet） |
| --- | --- | --- |
| 存储粒度 | 一行连续存 | 一列连续存 |
| 聚合 IO | 读整行（含无关列） | **只读目标列** |
| 压缩比 | 一般 | **高**（同列数据类型一致，相似值可 delta/run-length） |
| 适合 | 事务、点查、取整行 | **分析聚合、扫描大范围** |
| 随机更新 | 快 | 慢（列存追加为主） |

时序场景是「**写多读少、按时间扫描聚合**」，列式是天然契合：写入追加（列存擅长），查询是时间范围扫描 + 列聚合（列存只读目标列）。

Arrow 是 Parquet 的「内存版」——同样是列式，但为内存随机访问优化（Parquet 为磁盘压缩优化）。InfluxDB 3.x 用 Parquet 存盘、用 Arrow 在内存里算，两者格式接近，磁盘↔内存转换开销低。

## 三、Flight RPC：高性能远程查询

Apache Arrow Flight 是基于 gRPC 的远程查询协议，专门传 Arrow 数据：

- **零拷贝流式传输**：查询结果以 Arrow 流的形式直接传给客户端，无 JSON 序列化/解析。
- **高吞吐**：比 HTTP+JSON 快一个数量级，适合拉取大量时序点。
- **客户端**：Python（PyArrow）、Rust、Java、Go 等都有 Flight 客户端，可直接拉 Arrow 表喂给 Pandas/Polars。

```
客户端（PyArrow）
   │ Flight gRPC（Arrow 流）
   ▼
InfluxDB 3.x → Parquet/Arrow → 零拷贝返回
   │
   ▼
Pandas DataFrame（零拷贝转换）
```

## 四、Telegraf：插件化采集 agent

Telegraf 是 InfluxData 出品的采集 agent，用 Go 写，**插件化**架构：

| 插件类型 | 作用 | 举例 |
| --- | --- | --- |
| **input** | 抓数据 | `cpu`、`mem`、`disk`、`nginx`、`mysql`、`redis`、`docker`、`kafka_consumer` |
| **processor** | 转换 | 聚合、过滤、重命名、加 tag、单位换算 |
| **aggregator** | 聚合 | 窗口 min/max/mean |
| **output** | 写出 | `influxdb_v2`/`influxdb_v3`、`prometheus_client`、`kafka` |

- **配置即启用**：在 `telegraf.conf` 里启用 input/output 插件，无需写采集代码。想监控 nginx？启用 `[[inputs.nginx]]` 配个 URL 即可。
- **轻量稳定**：单二进制、内存占用低、长期跑在生产服务器无压力。
- **不止写 InfluxDB**：output 也能写 Prometheus/Kafka/其他，是通用采集层。

## 五、Grafana：可视化与告警

Grafana 是开源的可视化平台，原生支持 InfluxDB 数据源：

- **数据源**：3.x 用 SQL 数据源（也兼容 1.x/2.x 的 InfluxQL/Flux）。
- **时序图**：写 SQL 查询，结果画成时序折线/热力图/仪表盘。
- **告警**：基于查询配告警规则（CPU 持续 5 分钟超 80% 告警），通知到 Slack/邮件/钉钉。
- **Dashboard 复用**：社区有海量现成的 InfluxDB 监控模板。

## 六、完整 TIG 数据流

```
  服务器/应用/IoT
       │
       ▼ 采集（input 插件）
  ┌──────────┐  processor/aggregator（清洗聚合）
  │ Telegraf │
  └────┬─────┘
       │ HTTP Line Protocol / Flight
       ▼ 写入
  ┌──────────┐  Parquet 列存 + Arrow
  │ InfluxDB │  SQL / Flight RPC 查询
  └────┬─────┘
       │ 查询
       ▼
  ┌──────────┐  时序图、仪表盘、告警
  │  Grafana │
  └──────────┘
```

## 下一步

掌握数据模型与查询栈后，可进入[参考](../reference)查阅三代 API 对比、降采样/retention 策略速查与易错点清单。
