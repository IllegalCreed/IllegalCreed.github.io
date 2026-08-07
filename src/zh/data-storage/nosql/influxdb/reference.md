---
layout: doc
outline: [2, 3]
---

# 参考：InfluxDB 三代对比与易错点

> 基于 InfluxDB 3 Core/Enterprise · 核于 2026-08

## 速查

- **定义**：InfluxData 开源的专用时序数据库，按 measurement/tag/field/timestamp 四元组组织。
- **数据模型**：measurement（表）+ tag（索引维度）+ field（不索引度量）+ timestamp（纳秒）。tag 索引、field 不索引。
- **series**：measurement + 所有 tag 值的组合 = 一条时间序列；series 数是性能核心指标。
- **高基数陷阱**：唯一性强的值（用户 ID/trace ID）放 tag → series 爆炸 → 内存撑爆。
- **三代**：1.x（InfluxQL + TSMTree）/ 2.x（Flux + 云原生）/ 3.x（**SQL + Arrow/DataFusion + Parquet**）。
- **降采样**：时间窗口聚合（1s→1m），用更少存储回答趋势查询。
- **retention**：按时间自动过期（7d/30d/1y），配合降采样控成本。
- **TIG 栈**：Telegraf（采集）+ InfluxDB（存储）+ Grafana（展示）。
- **3.x 关键**：SQL 接口、Parquet 列存（高压缩）、Arrow 内存格式（零拷贝）、Flight RPC（高性能远程查询）、弃用 Flux。
- **不适合**：业务事务（无 ACID）、复杂关联（JOIN 弱）、随机更新删除历史。

## 一、三代 API 对比

| 维度 | 1.x | 2.x | 3.x |
| --- | --- | --- | --- |
| 查询语言 | **InfluxQL**（类 SQL） | **Flux**（函数式） | **SQL**（ANSI）+ InfluxQL |
| 存储引擎 | TSMTree | TSM（云原生） | **Parquet 列存 + Arrow** |
| 查询引擎 | 自研 | 自研 | **Apache DataFusion** |
| 远程协议 | HTTP | HTTP | **HTTP + Flight RPC** |
| 写入协议 | Line Protocol | Line Protocol | Line Protocol / Flight |
| Flux 状态 | 不支持 | 主推 | **弃用（维护模式）** |
| 定位 | 单机/集群 | 云、Task 调度 | 性能与生态全面升级 |

**选型建议**：新项目直接上 3.x + SQL；老 1.x 可逐步迁 3.x；2.x Flux 用户需评估迁移到 SQL。

## 二、数据模型速查

| 概念 | 作用 | 索引 | 举例 |
| --- | --- | --- | --- |
| measurement | 表名 | 是 | `cpu`、`temperature` |
| tag | 维度（过滤分组） | **是** | `host=server1` |
| field | 度量值 | 否 | `usage=0.83` |
| timestamp | 时间 | 是（排序） | `1693843200000000000` |
| point | 一个数据点 | - | 一行 = 一个 point |
| series | measurement + 所有 tag 值 | - | 一条时间序列 |

### Line Protocol 格式

```
measurement,tag1=val1,tag2=val2 field1=num,field2="str" timestamp
cpu,host=server1,region=us-east usage=0.83,status="ok" 1693843200000000000
```

- measurement 与 tag 用逗号；tag 与 field 用**空格**；field 与 timestamp 用空格。
- 字符串 field 要双引号；数值不引号；timestamp 纳秒可省略（用服务器时间）。

## 三、降采样与 retention 策略

| 层级 | 粒度 | 保留时长 | 用途 |
| --- | --- | --- | --- |
| 原始 | 1s | 7 天 | 近期明细排查 |
| 中期 | 1m | 30 天 | 近期趋势 |
| 长期 | 1h/1d | 1-5 年 | 长期趋势、年度对比 |

**协同**：原始保留短期，同时定时降采样成长期摘要；原始到期删除，摘要长期保留——存储降一个数量级。

### 常见聚合函数

| 函数 | 含义 |
| --- | --- |
| `mean`/`avg` | 均值 |
| `max`/`min` | 极值 |
| `sum` | 累计 |
| `count` | 计数 |
| `percentile` | 分位数（P50/P95/P99） |
| `last`/`first` | 窗口末/首值 |

## 四、TIG 栈组件

| 组件 | 角色 | 关键特性 |
| --- | --- | --- |
| **Telegraf** | 采集 agent | 插件化（input/processor/aggregator/output），单二进制 |
| **InfluxDB** | 时序存储 | Parquet 列存 + Arrow + DataFusion，SQL 查询 |
| **Grafana** | 可视化 | 原生 InfluxDB 数据源，时序图 + 告警 |

## 五、易错点清单

- **「tag 和 field 都索引」**：错。**只有 tag 索引，field 不索引**。把过滤维度放 tag，度量值放 field。
- **「把 userId/traceId 放 tag 方便查询」**：错。这会触发**高基数陷阱**，series 爆炸撑爆内存。唯一性强的值放 field 或不存。
- **「InfluxDB 能做业务事务库」**：错。无 ACID 事务、JOIN 弱、强一致性差，是时序专用库。业务库用 MySQL/PG。
- **「3.x 还在用 Flux」**：错。3.x 主推 **SQL**，Flux 已进入维护模式（弃用）。新项目用 SQL。
- **「时序数据不删，retention 没用」**：错。时序数据增长快，retention 是**必需**——按时间自动过期，否则磁盘必爆。
- **「降采样就是压缩」**：错。降采样是**有损聚合**（mean/max），丢精度换存储；压缩是无损编码。两者不同。
- **「Parquet 和 Arrow 是一回事」**：Parquet 是**磁盘列存**（压缩优先），Arrow 是**内存列存**（随机访问优先），格式接近但定位不同。
- **「Flight RPC 就是 HTTP REST」**：错。Flight 是基于 **gRPC + Arrow 流**的高性能协议，零拷贝，比 HTTP+JSON 快一个数量级。
- **「tag 值可以是数值」**：tag 值**始终是字符串**（即使写数字也被当字符串）。要数值运算就放 field。
- **「1.x 的 InfluxQL 和 3.x 的 SQL 完全一样」**：不完全一样。3.x 用 DataFusion 的 ANSI SQL + 时序扩展（如 `date_bin`），InfluxQL 是类 SQL 方言，语法有差异。

## 六、进阶方向（链接其他叶）

- [TimescaleDB](../timescaledb/) —— PostgreSQL 扩展路线的时序方案，与 InfluxDB 对比
- [ClickHouse](../../analytics/clickhouse/) —— 列式分析库，时序大范围扫描分析更强
- [DuckDB](../../analytics/duckdb/) —— 进程内列式 OLAP，本地时序分析

## 权威链接

- [InfluxDB 官方文档](https://docs.influxdata.com/)
- [InfluxDB 3 文档](https://docs.influxdata.com/influxdb3/)
- [Line Protocol](https://docs.influxdata.com/influxdb3/core/reference/syntax/line-protocol/)
- [Telegraf 文档](https://docs.influxdata.com/telegraf/)
- [Apache Arrow](https://arrow.apache.org/)
- [Apache Parquet](https://parquet.apache.org/)
- [Apache DataFusion](https://arrow.apache.org/datafusion/)
- 本站幻灯片：<a href="/SlideStack/influxdb-slide/" target="_blank">InfluxDB</a>
